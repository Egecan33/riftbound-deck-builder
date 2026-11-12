// Win routes of a deck (spec 12). New code: Riftfoundry has no win-route detection. The route model, weights
// and formulas are those of docs/research/wincons.md section 4 (prototype: docs/research/analysis/wincons/
// detect.py), with the defects of its section 5.2 and verification log (V4, V6) fixed:
//
//   5.2-1 / P9  play-from-elsewhere, alone, hand attack, death loops, cost reduction and tribes are detected
//               and credited to the route the legend's own text points at ("legend feed");
//   5.2-2 / P1  features come from the card's own keywords, mined traits and single sentences (features.ts);
//   5.2-3       a route with no threshold closer falls back to the cards carrying its main feature and says so;
//   5.2-4 / P3  every "folds to" line tests the field's actual answer cards against the deck's actual closer
//               (folds.ts); nothing is printed when nothing deck-specific can be said;
//   P5          a legend is never a guaranteed closer; only the Chosen Champion is (Champion Zone);
//   P8          banned and incomplete cards are dropped before anything is counted (view.ts), and named;
//   P10         alternate wins are reported as present with the chance of having the card, not of winning;
//   V6-5        routes within CO_PRIMARY of the first are marked co-primary.
//
// HEURISTIC: all of it. The research measured that the sub-score (`WinReport.value`) does not track
// tournament results; it is a construction check ("does this list present its own way to the last point"),
// never a strength rating. Rule facts quoted in notes carry their rule number.
import type { CardDb, Deck, EngineContext, RouteId, WinReport, WinRoute } from '../types';
import { RULE } from './facts';
import { routeFeatures, soloSide, type Feature } from './features';
import { foldsFor } from './folds';
import { displayName, nameList, pSeen, pct, viewDeck, type DeckCard, type DeckView } from './view';

export type ScoringRoute = Exclude<RouteId, 'altwin'>;
export const SCORING_ROUTES: readonly ScoringRoute[] = ['wide', 'tall', 'hold', 'burst', 'points', 'attrition'];

export const ROUTE_LABELS: Record<RouteId, string> = {
  wide: 'Go wide', tall: 'One big threat', hold: 'Hold and defend', burst: 'Burst conquer', points: 'Direct points',
  attrition: 'Attrition', altwin: 'Alternate win',
};

/** Weight per copy of a card with the feature (wincons.md 4.2). */
export const ROUTE_WEIGHTS: Record<ScoringRoute, Partial<Record<Feature, number>>> = {
  wide: { token: 1, 'multi-token': 1, widepay: 1.5, cheap: 0.5 },
  tall: { big: 1, scaling: 1, mightypay: 1, buff: 0.75, equip: 0.75, pump: 0.5, prot: 0.5 },
  hold: { holdpay: 1.5, 'holdpay-shared': 0.5, shield: 1, tank: 1, stun: 0.5, deftrick: 0.5 },
  burst: { haste: 1, ready: 1, gank: 0.75, move: 0.75, assault: 0.5, conqpay: 0.5, movepay: 0.5 },
  points: { point: 3, doubler: 1 },
  attrition: { removal: 1, sweep: 1.5, counter: 0.75, recur: 0.75, draw: 0.5, displace: 0.5, debuff: 0.5 },
};
export const HIDDEN_WEIGHTS: Partial<Record<Feature, number>> = { hidden: 0.25, 'hidden-unit': 1, ambush: 1, 'facedown-pay': 1.5 };

/**
 * Reference level per route: the 75th percentile of the raw score over the synced Standard lists, so a
 * normalised score of 1.0 means "as committed as the top quarter of the field". Without it every deck would
 * be ATTRITION (removal and draw are everywhere).
 * DATA: recomputed with this file's features over the 788 complete lists in data/forge.db on 2026-11-12
 * (`routeReferences`; tests/engine/wincons.test.ts checks them against the synced lists when the database
 * is there). POINTS has a 75th percentile of 0; its reference is two copies of a point card (wincons.md 4.3).
 */
/**
 * No reference is lower than this many weighted copies. HEURISTIC (stage 3 review): the 75th percentile of HOLD
 * is 3 (most lists have no hold plan; the 90th percentile is 10), so two Shield units made HOLD the first route
 * of a list that wins another way: Lecturing Yordle was the "closer" of Jayce lists, Explosimian of Ziggs lists.
 * With the floor 60 of the 130 hold-first synced lists move to the route their champion or top end carries.
 */
export const REF_FLOOR = 6;
export const ROUTE_REF: Record<ScoringRoute, number> = { wide: 10, tall: 11.25, hold: REF_FLOOR, burst: 13.5, points: 6.0, attrition: 16.5 };
export const HIDDEN_REF = 6.25;
/** Routes whose rank is within this of the first are co-primary (wincons.md V6 item 5). */
export const CO_PRIMARY = 0.2;
/** Fallback "closer" features when no card passes the closer test (wincons.md 5.2 item 3). */
const TOP_FEATURES: Record<ScoringRoute, Feature[]> = {
  wide: ['token'], tall: ['mighty', 'scaling', 'mightypay'], hold: ['shield', 'tank', 'holdpay-shared', 'deftrick'],
  burst: ['haste', 'ready', 'gank', 'move'], points: ['doubler'], attrition: ['removal'],
};
const LEGEND_FACTOR = 4;   // the legend is available every turn (wincons.md 4.3)
const FEED_WEIGHT = 0.5;   // per copy of a card that feeds the legend's engine
const CHAMPION_POINT_COPIES = 4;

const weightOf = (features: ReadonlySet<Feature>, weights: Partial<Record<Feature, number>>): number => {
  let sum = 0;
  for (const f of features) sum += weights[f] ?? 0;
  return sum;
};

function isCloser(route: ScoringRoute, c: DeckCard, shieldToAssault: boolean): boolean {
  const f = routeFeatures(c);
  const unit = c.card.type === 'unit';
  const might = c.card.might ?? 0;
  switch (route) {
    case 'wide': return f.has('widepay') || f.has('multi-token') || (c.card.type !== 'spell' && f.has('token-engine'));
    case 'tall': return unit && !f.has('no-combat-damage') && (might >= 6 || f.has('scaling') || f.has('self-pump') || (might >= 5 && (f.has('prot') || f.has('gank'))));
    case 'hold': return unit && !f.has('no-hold') && (f.has('holdpay') || ((f.has('shield') || f.has('tank')) && might >= 4));
    case 'burst':
      return (unit && f.has('haste') && (might >= 4 || f.has('assault'))) || (!unit && f.has('ready'))
        || (unit && f.has('gank') && might >= 4) || (unit && f.has('ready') && might >= 4) || (shieldToAssault && unit && f.has('shield') && might >= 4);
    case 'points': return f.has('point');
    case 'attrition': return f.has('sweep') || (unit && (c.card.energy ?? 0) >= 7) || (unit && f.has('recur') && (c.card.energy ?? 0) >= 5);
    default: return false;
  }
}

export interface LegendFeed { route: ScoringRoute; label: string; feeders: DeckCard[]; copies: number }

/** The route the legend's own text supports and the deck cards that switch the legend on. */
function legendFeed(view: DeckView): LegendFeed | null {
  const legend = view.legend;
  if (!legend) return null;
  const lf = routeFeatures(legend, 'legend');
  let route: ScoringRoute | null = null;
  let best = 0;
  for (const r of SCORING_ROUTES) {
    const w = weightOf(lf, ROUTE_WEIGHTS[r]);
    if (w > best) { best = w; route = r; }
  }
  if (!route) return null;
  const text = legend.sentences.join(' ').toLowerCase();
  let feeders: DeckCard[] = [];
  let label = '';
  if (/\bfrom anywhere other than your hand\b/.test(text)) {
    feeders = view.main.filter((c) => routeFeatures(c).has('elsewhere'));
    label = 'cards played from outside the hand (Hidden, Flow, from the trash or the deck)';
  } else {
    const profile = view.db.legendProfile(legend.card.id);
    const axes = Object.entries(profile?.axisWeights ?? {}).filter(([, w]) => w >= 0.6).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 2).map(([a]) => a);
    feeders = view.main.filter((c) => axes.some((a) => (c.features?.axes[a]?.e ?? 0) > 0));
    label = axes.length ? `its ${axes.join(' and ')} theme` : '';
  }
  if (feeders.length === 0) return null;
  return { route, label, feeders, copies: feeders.reduce((n, c) => n + c.qty, 0) };
}

export interface RawRoutes { raw: Record<ScoringRoute, number>; hidden: number; feed: LegendFeed | null }

/** Raw route scores of a deck (wincons.md 4.3), before normalisation. Exported for the calibration of ROUTE_REF. */
export function rawRouteScores(view: DeckView): RawRoutes {
  const raw: Record<ScoringRoute, number> = { wide: 0, tall: 0, hold: 0, burst: 0, points: 0, attrition: 0 };
  const shieldToAssault = !!view.legend && routeFeatures(view.legend, 'legend').has('shield-to-assault');
  let hidden = 0;
  for (const c of view.main) {
    const f = routeFeatures(c);
    for (const r of SCORING_ROUTES) {
      let w = weightOf(f, ROUTE_WEIGHTS[r]);
      if (r === 'burst' && shieldToAssault && f.has('shield')) w += 0.75;
      const copies = r === 'points' && c.champion && f.has('point') ? c.qty - 1 + CHAMPION_POINT_COPIES : c.qty;
      raw[r] += copies * w;
    }
    hidden += c.qty * weightOf(f, HIDDEN_WEIGHTS);
  }
  if (view.legend) for (const r of SCORING_ROUTES) raw[r] += LEGEND_FACTOR * weightOf(routeFeatures(view.legend, 'legend'), ROUTE_WEIGHTS[r]);
  for (const b of view.battlefields) for (const r of SCORING_ROUTES) raw[r] += weightOf(routeFeatures(b, 'battlefield'), ROUTE_WEIGHTS[r]);
  const feed = legendFeed(view);
  if (feed) raw[feed.route] += FEED_WEIGHT * feed.copies;
  return { raw, hidden, feed };
}

/** 75th percentile of the raw route scores over a set of decks: the numbers `ROUTE_REF` is set from. */
export function routeReferences(decks: readonly Deck[], db: CardDb): Record<ScoringRoute | 'hidden', number> {
  const samples: Record<string, number[]> = { wide: [], tall: [], hold: [], burst: [], points: [], attrition: [], hidden: [] };
  for (const deck of decks) {
    const { raw, hidden } = rawRouteScores(viewDeck(deck, db));
    for (const r of SCORING_ROUTES) samples[r].push(raw[r]);
    samples.hidden.push(hidden);
  }
  const p75 = (xs: number[]): number => {
    if (xs.length === 0) return 0;
    const sorted = [...xs].sort((a, b) => a - b);
    const pos = 0.75 * (sorted.length - 1);
    const lo = Math.floor(pos);
    return sorted[lo] + (sorted[Math.min(sorted.length - 1, lo + 1)] - sorted[lo]) * (pos - lo);
  };
  return Object.fromEntries(Object.entries(samples).map(([k, xs]) => [k, Math.round(p75(xs) * 100) / 100])) as Record<ScoringRoute | 'hidden', number>;
}

const copiesWith = (view: DeckView, ...features: Feature[]): DeckCard[] => view.main.filter((c) => features.some((f) => routeFeatures(c).has(f)));
const sumQty = (cards: readonly DeckCard[]): number => cards.reduce((n, c) => n + c.qty, 0);
const sumLib = (cards: readonly DeckCard[]): number => cards.reduce((n, c) => n + c.lib, 0);
const byWeight = (cards: readonly DeckCard[]): DeckCard[] => [...cards].sort((a, b) => Number(b.champion) - Number(a.champion) || b.qty - a.qty || b.rating - a.rating || a.card.name.localeCompare(b.card.name));
const round2 = (n: number): number => Math.round(n * 100) / 100;

export interface RouteDetail {
  id: ScoringRoute; raw: number; norm: number; rank: number; closers: DeckCard[]; fallback: boolean; enablers: DeckCard[]; p: number;
}

export interface WinAnalysis { view: DeckView; routes: RouteDetail[]; feed: LegendFeed | null; hidden: number; clock: number; firstConquerTurn: number; pointsPerTurn: number; reach: { hold: number; conquer: number; direct: number; holders: DeckCard[]; movers: DeckCard[]; pointCards: DeckCard[] } }

/** The ranked routes with their cards, before they are turned into report text. Used by the line generator too. */
export function analyseRoutes(view: DeckView): WinAnalysis {
  const { raw, hidden, feed } = rawRouteScores(view);
  const shieldToAssault = !!view.legend && routeFeatures(view.legend, 'legend').has('shield-to-assault');
  const seenBy5 = view.facts.seats[0].seen(5);
  const pOf = (cards: readonly DeckCard[]): number => (cards.some((c) => c.champion) ? 1 : pSeen(sumLib(cards), seenBy5, view.library));
  const details: RouteDetail[] = SCORING_ROUTES.map((id) => {
    const closers = byWeight(view.main.filter((c) => isCloser(id, c, shieldToAssault)));
    const norm = raw[id] / ROUTE_REF[id];
    const p = closers.length ? pOf(closers) : pOf(copiesWith(view, ...TOP_FEATURES[id]));
    return { id, raw: raw[id], norm, rank: norm * (0.6 + 0.4 * p), closers, fallback: false, enablers: [], p };
  }).sort((a, b) => b.rank - a.rank || SCORING_ROUTES.indexOf(a.id) - SCORING_ROUTES.indexOf(b.id));

  // A closer is counted once, under the highest-ranked route that wants it (wincons.md 4.3).
  const used = new Set<string>();
  for (const d of details) {
    const own = d.closers.filter((c) => !used.has(c.card.id));
    if (own.length > 0) d.closers = own;
    else {
      // 5.2 item 3: no card passes the stat threshold; the route's redundancy is the cards carrying its main feature.
      d.closers = byWeight(copiesWith(view, ...TOP_FEATURES[d.id]).filter((c) => !used.has(c.card.id))).slice(0, 6);
      d.fallback = true;
    }
    for (const c of d.closers) used.add(c.card.id);
    d.p = d.closers.length ? pOf(d.closers) : 0;
    const closerIds = new Set(d.closers.map((c) => c.card.id));
    const weights = ROUTE_WEIGHTS[d.id];
    const fed = feed && feed.route === d.id ? new Set(feed.feeders.map((c) => c.card.id)) : new Set<string>();
    d.enablers = view.main
      .filter((c) => !closerIds.has(c.card.id) && (weightOf(routeFeatures(c), weights) > 0 || fed.has(c.card.id)))
      .sort((a, b) => b.qty * (weightOf(routeFeatures(b), weights) + (fed.has(b.card.id) ? FEED_WEIGHT : 0)) - a.qty * (weightOf(routeFeatures(a), weights) + (fed.has(a.card.id) ? FEED_WEIGHT : 0)) || a.card.name.localeCompare(b.card.name))
      .slice(0, 8);
  }

  // Uncontested clock (wincons.md 4.4, with the verification's correction: no unit can conquer on turn 1).
  const cheap = sumQty(copiesWith(view, 'cheap'));
  const firstConquerTurn = cheap >= 8 ? 2 : 3;
  const legendMoves = !!view.legend && ['token', 'ready', 'move', 'gank', 'haste'].some((f) => routeFeatures(view.legend!, 'legend').has(f as Feature));
  const spread = sumQty(copiesWith(view, 'cheap', 'token', 'gank', 'haste', 'ready', 'ambush')) + (legendMoves ? LEGEND_FACTOR : 0);
  const pointsPerTurn = 1 + Math.min(1, spread / 20);
  const pointCards = copiesWith(view, 'point');
  const pointCopies = pointCards.reduce((n, c) => n + (c.champion ? c.qty - 1 + CHAMPION_POINT_COPIES : c.qty), 0);
  const target = view.facts.team ? Math.ceil(view.facts.victoryScore / 2) : view.facts.victoryScore;
  const clock = firstConquerTurn + Math.ceil(Math.max(0, target - 1 - Math.min(2, 0.25 * pointCopies)) / pointsPerTurn);

  const holders = byWeight(copiesWith(view, 'shield', 'tank', 'holdpay', 'prot').filter((c) => c.card.type === 'unit' && !routeFeatures(c).has('no-hold')));
  const movers = byWeight(copiesWith(view, 'haste', 'ready', 'gank', 'move'));
  const legendHolds = !!view.legend && ['shield', 'holdpay', 'deftrick'].some((f) => routeFeatures(view.legend!, 'legend').has(f as Feature));
  const moverNeed = view.facts.battlefieldsOnBoard >= 3 ? 18 : 12;
  const reach = {
    hold: Math.min(1, (sumQty(holders) + (legendHolds ? LEGEND_FACTOR : 0)) / 12),
    conquer: Math.min(1, (sumQty(movers) + (legendMoves ? LEGEND_FACTOR : 0)) / moverNeed),
    direct: Math.min(1, pointCopies / 4 + 0.34 * view.battlefields.filter((b) => routeFeatures(b, 'battlefield').has('point')).length),
    holders, movers, pointCards,
  };
  return { view, routes: details, feed, hidden, clock, firstConquerTurn, pointsPerTurn, reach };
}

const copyList = (cards: readonly DeckCard[], max = 4): string => nameList(cards.map((c) => (c.qty > 1 ? `${c.card.name} x${c.qty}` : c.card.name)), max);

function familyNotes(view: DeckView): string[] {
  const out: string[] = [];
  const of = (f: Feature): DeckCard[] => byWeight(copiesWith(view, f));
  // Whose unit is alone decides the advice: your own (spread out) or an enemy's (go where one stands alone).
  const solo = of('solo').filter((c) => soloSide(c) === 'own');
  const legendSolo = !!view.legend && routeFeatures(view.legend, 'legend').has('solo') && soloSide(view.legend) === 'own';
  if (solo.length > 0 || legendSolo) {
    const who = [legendSolo ? displayName(view.legend!.card) : null, solo.length ? copyList(solo) : null].filter(Boolean);
    out.push(`Alone / one-on-one plan: ${who.join(' with ')} ${who.length === 1 && solo.length <= 1 ? 'cares' : 'care'} about your unit standing by itself, so units go to different battlefields.`);
  }
  const lone = of('solo').filter((c) => soloSide(c) === 'enemy');
  if (lone.length > 0) out.push(`Lone-enemy plan: ${copyList(lone)} ${lone.length > 1 ? 'pay' : 'pays'} off where an enemy unit stands alone, so attack the battlefield that holds exactly one of theirs.`);
  const enablers = of('death-enabler');
  const payoffs = of('death-payoff');
  if (sumQty(enablers) >= 2 && sumQty(payoffs) >= 2) out.push(`Death loop: ${copyList(enablers, 3)} kill or sacrifice your own units for ${copyList(payoffs, 3)}.`);
  const hand = of('hand-attack');
  if (sumQty(hand) >= 2) out.push(`Hand attack: ${copyList(hand)} (${sumQty(hand)} copies) strip cards before they are played.`);
  const reducers = of('cost-reduction');
  if (sumQty(reducers) >= 4) out.push(`Cost reduction: ${copyList(reducers)} (${sumQty(reducers)} copies) come down earlier than their printed cost.`);
  // Tribes: a tag some card in the deck pays off, carried by at least four other copies.
  const tags = new Map<string, { payoffs: DeckCard[]; members: DeckCard[] }>();
  for (const c of [...view.main, ...(view.legend ? [view.legend] : [])]) {
    for (const [axis, v] of Object.entries(c.features?.axes ?? {})) {
      if (!axis.startsWith('tag:')) continue;
      const t = tags.get(axis) ?? { payoffs: [], members: [] };
      if (v.p > 0) t.payoffs.push(c);
      if (v.e > 0 && view.byId.has(c.card.id)) t.members.push(c);
      tags.set(axis, t);
    }
  }
  for (const [axis, t] of [...tags].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (t.payoffs.length > 0 && sumQty(t.members) >= 4) out.push(`${axis.slice(4)} tribe: ${copyList(byWeight(t.payoffs), 2)} ${t.payoffs.length > 1 ? 'pay' : 'pays'} off ${sumQty(t.members)} ${axis.slice(4)} copies (${copyList(byWeight(t.members), 3)}).`);
  }
  return out;
}

export function detectWinRoutes(deck: Deck, ctx: EngineContext): WinReport {
  const view = viewDeck(deck, ctx.db);
  if (view.main.length === 0) return { routes: [], hiddenDelivery: false, value: 0 };
  const a = analyseRoutes(view);
  const facts = view.facts;
  const first = a.routes[0];
  const kept = a.routes.filter((d, i) => d.closers.length > 0 && (i < 2 || d.rank >= 0.5)).slice(0, 4);
  const routes: WinRoute[] = kept.map((d, i) => {
    const notes: string[] = [];
    const label = ROUTE_LABELS[d.id];
    if (i === 0) notes.push(`${label} is the main way this list scores: ${round2(d.norm)}x the commitment of the top quarter of synced lists (HEURISTIC).`);
    else if (first.rank - d.rank <= CO_PRIMARY) notes.push(`${label} is co-primary with ${ROUTE_LABELS[first.id]}: the two rank within ${CO_PRIMARY} of each other.`);
    if (d.fallback) notes.push(`No single card closes this route by itself; the count is the ${sumQty(d.closers)} ${sumQty(d.closers) === 1 ? 'copy' : 'copies'} carrying its main feature: ${copyList(d.closers)}.`);
    else notes.push(`Closers: ${copyList(d.closers)} (${sumQty(d.closers)} ${sumQty(d.closers) === 1 ? 'copy' : 'copies'}). ${d.closers.some((c) => c.champion) ? `${d.closers.find((c) => c.champion)!.card.name} is the Chosen Champion and starts in the Champion Zone (${RULE.championZone}), so one is always available.` : `At least one in the ${view.facts.seats[0].seen(5)} cards seen by turn 5: ${pct(d.p)}.`}`);
    if (a.feed && a.feed.route === d.id && view.legend) notes.push(`${displayName(view.legend.card)} is switched on by ${a.feed.label}: ${a.feed.copies} ${a.feed.copies === 1 ? 'copy' : 'copies'} (${copyList(byWeight(a.feed.feeders))}).`);
    if (i === 0) {
      notes.push(`Uncontested clock: turn ${a.clock} (first conquer on turn ${a.firstConquerTurn}, about ${round2(a.pointsPerTurn)} points a turn toward ${facts.team ? `your half of ${facts.victoryScore}` : facts.victoryScore}, ${facts.victoryRule}). HEURISTIC: ignores the opponent.`);
      const holdPart = a.reach.holders.length ? `holders: ${copyList(a.reach.holders, 3)}` : 'this list has no unit built to hold';
      const movePart = a.reach.movers.length ? `ready or moving pieces: ${copyList(a.reach.movers, 3)}` : 'this list has no ready or move effect to take them in one turn';
      const directPart = a.reach.pointCards.length ? ` ${copyList(a.reach.pointCards, 2)} ${a.reach.pointCards.length > 1 ? 'give' : 'gives'} the point without a battlefield.` : '';
      notes.push(`Last point: a hold wins outright (${RULE.finalPointOther}) - ${holdPart}. A conquer gives it only if all ${facts.battlefieldsOnBoard} battlefields were scored that turn (${facts.team ? RULE.teamFinalPoint : RULE.finalPointConquer}) - ${movePart}.${directPart}`);
      // The Chosen Champion is always available (CR 103.3.a.1); when no route counts it as a closer, say what it is here for.
      const champ = view.champion;
      if (champ && !kept.some((k) => k.closers.some((c) => c.card.id === champ.card.id))) {
        const asEnabler = kept.find((k) => k.enablers.some((c) => c.card.id === champ.card.id));
        notes.push(`${champ.card.name}, the Chosen Champion (${RULE.championZone}), is not a closer of any route here${asEnabler ? `; it is counted as an enabler of ${ROUTE_LABELS[asEnabler.id].toLowerCase()}` : ''}: "${champ.sentences.find((s) => !/^\[[^\]]+\]$/.test(s.trim())) ?? champ.sentences[0] ?? ''}"`);
      }
      for (const n of familyNotes(view)) notes.push(n);
      for (const e of view.excluded) notes.push(`${e.card.name} is not counted: ${e.why}.`);
    }
    return {
      id: d.id,
      strength: round2(Math.max(0, Math.min(1, d.rank / 1.5))),
      closers: d.closers.map((c) => c.card.id),
      enablers: d.enablers.map((c) => c.card.id),
      closerCopies: sumQty(d.closers),
      pCloserByTurn5: round2(d.p),
      clock: a.clock,
      foldsTo: i < 2 ? foldsFor(a, d, ctx.db, i === 0) : [],
      notes,
    };
  });

  // Alternate wins: present, with the chance of having the card. Their own conditions are not modelled (P10).
  const alt = [...view.main.filter((c) => routeFeatures(c).has('altwin')), ...view.battlefields.filter((b) => routeFeatures(b, 'battlefield').has('altwin'))];
  if (alt.length > 0) {
    const cards = alt.filter((c) => view.byId.has(c.card.id));
    const fields = alt.filter((c) => !view.byId.has(c.card.id));
    const p = cards.length ? pSeen(sumLib(cards), view.facts.seats[0].seen(5), view.library) : facts.battlefieldPick.chosen ? 1 : 1 / 3;
    routes.push({
      id: 'altwin', strength: 0, closers: alt.map((c) => c.card.id), enablers: [], closerCopies: sumQty(cards) + fields.length,
      pCloserByTurn5: round2(p), clock: a.clock, foldsTo: [],
      notes: [
        ...alt.map((c) => `${c.card.name}: "${c.sentences.find((s) => /win the game/i.test(s)) ?? ''}"`),
        fields.length ? `${copyList(fields)} is ${facts.battlefieldPick.chosen ? `yours to choose each game (${facts.battlefieldPick.rule})` : `in play one game in three (random pick, ${facts.battlefieldPick.rule})`}.` : `Chance of drawing a copy by turn 5: ${pct(p)}.`,
        'Shown as present only: the win condition printed on the card is not modelled, so there is no strength number.',
      ],
    });
  }

  const second = a.routes[1];
  const resilience = Math.min(1, (sumQty(copiesWith(view, 'prot')) + 0.5 * sumQty(copiesWith(view, 'recur')) + sumQty(copiesWith(view, 'counter'))) / 8);
  const value = first.closers.length === 0 ? 0
    : 0.3 * first.p + 0.25 * Math.min(1, first.norm / 1.5) + 0.15 * (second ? Math.min(1, second.norm) * second.p : 0)
      + 0.2 * Math.max(a.reach.hold, a.reach.conquer, a.reach.direct) + 0.1 * resilience;
  return { routes, hiddenDelivery: a.hidden / HIDDEN_REF >= 1, value: round2(Math.max(0, Math.min(1, value))) };
}
