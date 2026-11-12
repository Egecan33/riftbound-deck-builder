// Legend, Chosen Champion, battlefields and runes of a built deck (spec 13 steps 2, 4, 5). Pure.
//
// Base: Riftfoundry apps/web/src/lib/theory-decks.ts (origin/main 4b90179) `chooseLegend`, `chooseChampion`
// and `chooseBattlefields`: rank by stored pairs with the build-around card and the champion, plus the card's
// own rating and a seeded tie-break. Added for Forge: the legend's public lists come first where they exist
// (registered champions and battlefields: data), 2v2 teammate battlefields are avoided (CR 491.8.i), the
// collection is respected, and the rune split is checked against cast reliability.
import { cardRuneReliability, runeDemand, runeSplit } from '../maths';
import { eligibleChampions, sameTag } from '../rules/champion';
import { BATTLEFIELDS_BROUGHT, RUNE_DECK_SIZE } from '../rules/formats';
import { legendOf } from '../rules/identity';
import { nameKey } from '../rules/names';
import { cardFitsDeck } from '../rules/validate';
import { createScorer, scoreCardOf } from '../scoring';
import { featuresFor, qtyOf } from '../summary';
import type { BuildOptions, Card, Deck, Domain, EngineContext } from '../types';
import { seededBias } from './rng';
import { legalPool, netOf, ownedEnough, ratingOf, type BuildPick } from './state';

/** HEURISTIC constants. */
export const ZONES = {
  /**
   * Lists of the legend needed before registered battlefields and champions lead the choice. Battlefields: 4,
   * with the share shrunk by lists / (lists + battlefieldPrior) - the first version asked for 8 and gave a
   * legend with 4 public lists three battlefields none of them brings (stage 3 review).
   */
  battlefieldLists: 4, battlefieldPrior: 4, championLists: 5,
  /** Ported weights: pair with a build-around card, pair with the champion, own rating. */
  anchorPair: 1.5, championPair: 0.8, rating: 0.25,
  /** A different split is taken only when it raises the mean on-time cast chance by this much. */
  runeGain: 0.02,
  /** Lists of the legend, and the share of them on one split, before that split may move the computed one by a rune. */
  runeLists: 8, runeShare: 0.25,
} as const;

const DOMAIN_LABEL: Record<Domain, string> = { fury: 'Fury', calm: 'Calm', mind: 'Mind', body: 'Body', chaos: 'Chaos', order: 'Order' };

/**
 * A legend for a deck that has none (ported `chooseLegend`): the legend whose domains hold every build-around
 * card, preferring the champion tag of a build-around card, then the legend whose text-derived theme meets
 * the build-around cards' axes. Null when nothing is given to choose by.
 */
export function chooseLegend(deck: Deck, ctx: EngineContext, anchors: readonly Card[], opts: BuildOptions): { card: Card; reason: string } | null {
  if (anchors.length === 0) return null;
  const db = ctx.db;
  const ranked: { card: Card; score: number; why: string }[] = [];
  for (const legend of db.all()) {
    if (legend.type !== 'legend' || legend.dataIncomplete) continue;
    const probe: Deck = { ...deck, legend: legend.id, champion: null, main: [], side: [] };
    if (cardFitsDeck(legend, 'legend', probe, db)) continue;
    if (anchors.some((a) => cardFitsDeck(a, a.type === 'battlefield' ? 'battlefields' : 'main', probe, db))) continue;
    const tag = anchors.some((a) => sameTag(a.championTag, legend.championTag));
    const weights = db.legendProfile(legend.id)?.axisWeights ?? {};
    let axis = 0;
    for (const a of anchors) for (const [id, v] of Object.entries(featuresFor(db, a).axes)) axis += (weights[id] ?? 0) * Math.max(v.e, v.p);
    ranked.push({
      card: legend, score: (tag ? 100 : 0) + axis * 10 + seededBias(opts.seed, legend.id),
      why: tag ? `${anchors.find((a) => sameTag(a.championTag, legend.championTag))?.name} carries its champion tag` : axis > 0 ? 'its text rewards what the build-around cards do (heuristic)' : 'its domains hold every build-around card',
    });
  }
  ranked.sort((a, b) => b.score - a.score || a.card.id.localeCompare(b.card.id));
  return ranked[0] ? { card: ranked[0].card, reason: `${ranked[0].card.name} chosen as legend: ${ranked[0].why}.` } : null;
}

/** The Chosen Champion: a build-around champion unit first, then the one most registered, then pairs and rating. */
export function chooseChampion(deck: Deck, ctx: EngineContext, anchors: readonly Card[], opts: BuildOptions): { card: Card; reason: string } | null {
  const db = ctx.db;
  const legend = legendOf(deck, db);
  if (!legend) return null;
  const eligible = eligibleChampions(legend, db).filter((c) => !c.dataIncomplete && cardFitsDeck(c, 'main', deck, db) === null && ownedEnough(c.id, opts));
  if (eligible.length === 0) return null;
  const anchored = eligible.find((c) => anchors.some((a) => a.id === c.id));
  if (anchored) return { card: anchored, reason: `${anchored.name} is a build-around card and a champion unit of ${legend.name}.` };
  const meta = db.legendMeta(legend.id);
  const useMeta = !!meta && meta.decks >= ZONES.championLists;
  const ranked = eligible.map((card) => {
    // LegendMeta.champions holds the share of the legend's lists with this Chosen Champion.
    const share = useMeta ? Math.max(0, Math.min(1, meta.champions[card.id] ?? 0)) : 0;
    const lists = useMeta ? Math.round(share * meta.decks) : 0;
    const pairs = anchors.reduce((n, a) => n + netOf(db, card.id, a.id), 0) * ZONES.anchorPair;
    return { card, lists, score: 100 * share + pairs + ratingOf(db, card) * ZONES.rating + seededBias(opts.seed, `champion:${card.id}`) };
  }).sort((a, b) => b.score - a.score || a.card.id.localeCompare(b.card.id));
  const best = ranked[0];
  return {
    card: best.card,
    reason: useMeta && best.lists > 0
      ? `${best.card.name}: Chosen Champion in ${best.lists} of ${meta.decks} public ${legend.name} lists (data).`
      : `${best.card.name}: best evaluated champion unit of ${legend.name} (${ratingOf(db, best.card)})${anchors.length ? ' with its stored pairs with the build-around cards' : ''}; no public lists to go by.`,
  };
}

/**
 * Three battlefields with different names. Kept ones stay. With enough public lists of the legend the most
 * registered come first (data); otherwise the battlefield card score (text fit with the legend and the deck,
 * heuristic) plus stored pairs with the build-around cards and the champion.
 */
export function chooseBattlefields(deck: Deck, ctx: EngineContext, anchors: readonly Card[], opts: BuildOptions, keep: readonly string[] = []): { ids: string[]; picks: BuildPick[] } {
  const db = ctx.db;
  const legend = legendOf(deck, db);
  const picks: BuildPick[] = [];
  const names = new Set<string>();
  const ids: string[] = [];
  for (const id of keep) {
    const card = db.get(id);
    if (!card || names.has(nameKey(card.name)) || ids.length >= BATTLEFIELDS_BROUGHT) continue;
    ids.push(id);
    names.add(nameKey(card.name));
  }
  if (!legend || ids.length >= BATTLEFIELDS_BROUGHT) return { ids, picks };
  const mate = new Set((deck.format === '2v2' ? deck.teammate?.battlefields ?? [] : []).map((id) => nameKey(db.get(id)?.name ?? id)));
  const meta = db.legendMeta(legend.id);
  const useMeta = !!meta && meta.decks >= ZONES.battlefieldLists;
  const champion = deck.champion ? db.get(deck.champion) : undefined;
  const scorer = createScorer(deck, ctx);
  const ranked = legalPool(deck, db, 'battlefields')
    .filter((c) => !mate.has(nameKey(c.name)) && ownedEnough(c.id, opts))
    .map((card) => {
      const fit = scorer.score(card, 'battlefields');
      const share = useMeta ? meta.battlefields[card.id]?.share ?? 0 : 0;
      const pairs = anchors.reduce((n, a) => n + netOf(db, card.id, a.id), 0) * ZONES.anchorPair + (champion ? netOf(db, card.id, champion.id) * ZONES.championPair : 0);
      return { card, fit, share, score: share * (meta ? meta.decks / (meta.decks + ZONES.battlefieldPrior) : 0) * 200 + fit.score * 0.5 + pairs + seededBias(opts.seed, `bf:${card.id}`) * 2 };
    })
    .sort((a, b) => b.score - a.score || a.card.id.localeCompare(b.card.id));
  const weight = deck.format === 'standard-bo3' ? 'all three are used across a best-of-three match' : 'one of the three is drawn at random each game, so each is a third of a game';
  for (const r of ranked) {
    if (ids.length >= BATTLEFIELDS_BROUGHT) break;
    if (names.has(nameKey(r.card.name))) continue;
    ids.push(r.card.id);
    names.add(nameKey(r.card.name));
    const stat = meta?.battlefields[r.card.id];
    picks.push({
      zone: 'battlefields', id: r.card.id, qty: 1, phase: 'battlefields',
      reason: useMeta && stat && r.share > 0
        ? `Brought by ${stat.decks} of ${meta.decks} public ${legend.name} lists (data); ${weight}.`
        : `${r.fit.reasons[r.fit.reasons.length - 1] ?? `Battlefield score ${r.fit.score}`} ${useMeta ? 'Not in the public lists; chosen by text fit.' : 'Too few public lists of this legend to go by; chosen by text fit (heuristic).'} ${weight[0].toUpperCase()}${weight.slice(1)}.`,
    });
  }
  return { ids, picks };
}

/**
 * The rune split: the measured demand formula (maths/runes.ts), then a check with rune reliability. For a
 * two-domain legend the neighbouring splits (one rune either way) are compared on the copy-weighted chance
 * that each Power cost is paid on time; a neighbour is taken only when it gains ZONES.runeGain.
 */
export function chooseRunes(deck: Deck, ctx: EngineContext): { runes: Partial<Record<Domain, number>>; reason: string } {
  const db = ctx.db;
  const legend = legendOf(deck, db);
  const base = runeSplit(deck, db);
  const domains = Object.keys(base) as Domain[];
  if (!legend || domains.length === 0) return { runes: base, reason: 'No legend: no runes to choose.' };
  const text = (split: Partial<Record<Domain, number>>): string => (Object.entries(split) as [Domain, number][]).map(([d, n]) => `${n} ${DOMAIN_LABEL[d]}`).join(' / ');
  if (domains.length !== 2) return { runes: base, reason: `${text(base)}: ${legend.name} has ${domains.length === 1 ? 'one domain' : 'more than two domains'}.` };
  const demand = runeDemand(deck, db);
  const powered = deck.main.map((e) => ({ card: db.get(e.id), qty: qtyOf(e) })).filter((x): x is { card: Card; qty: number } => !!x.card && (x.card.power ?? 0) > 0 && x.qty > 0);
  const reliability = (split: Partial<Record<Domain, number>>): number => {
    if (powered.length === 0) return 1;
    const runes = domains.map((domain) => ({ domain, count: split[domain] ?? 0, demand: demand[domain] ?? 0 }));
    let weight = 0;
    let sum = 0;
    for (const p of powered) { weight += p.qty; sum += p.qty * cardRuneReliability(scoreCardOf(p.card), runes); }
    return weight > 0 ? sum / weight : 1;
  };
  const [a, b] = domains;
  let best = base;
  let bestP = reliability(base);
  const baseP = bestP;
  for (const shift of [-1, 1]) {
    const na = (base[a] ?? 0) + shift;
    if (na < 3 || na > 9) continue;
    const split = { [a]: na, [b]: RUNE_DECK_SIZE - na } as Partial<Record<Domain, number>>;
    const p = reliability(split);
    if (p >= bestP + ZONES.runeGain) { best = split; bestP = p; }
  }
  const demandText = domains.map((d) => `${DOMAIN_LABEL[d]} ${Math.round((demand[d] ?? 0) * 10) / 10}`).join(', ');
  // Data (stage 3 review): the split most public lists of the legend run, when it is within one rune of the
  // computed one. Measured on 789 public lists: the formula alone gives a list's own split 47% of the time.
  const meta = db.legendMeta(legend.id);
  if (meta && meta.decks >= ZONES.runeLists) {
    let pick: { na: number; share: number } | null = null;
    for (const [key, share] of Object.entries(meta.runeSplits)) {
      const m = new RegExp(`(?:^|-)${a}(\\d+)(?:-|$)`).exec(key);
      const na = m ? Number(m[1]) : NaN;
      if (!Number.isFinite(na) || share < ZONES.runeShare || Math.abs(na - (best[a] ?? 0)) > 1) continue;
      if (!pick || share > pick.share) pick = { na, share };
    }
    if (pick && pick.na !== (best[a] ?? 0)) {
      const split = { [a]: pick.na, [b]: RUNE_DECK_SIZE - pick.na } as Partial<Record<Domain, number>>;
      return { runes: split, reason: `${text(split)}: the split ${Math.round(pick.share * 100)}% of ${meta.decks} public ${legend.name} lists run (data), one rune from the ${text(best)} the Power demand of this main deck gives (${demandText}).` };
    }
    if (pick) return { runes: best, reason: `${text(best)} from the Power demand of the main deck (${demandText}); ${Math.round(pick.share * 100)}% of ${meta.decks} public ${legend.name} lists run the same split (data).` };
  }
  return {
    runes: best,
    reason: best === base
      ? `${text(base)} from the Power demand of the main deck (${demandText}); Power costs are paid on time in ${Math.round(bestP * 100)}% of games (heuristic formula fitted to public lists).`
      : `${text(best)}: one rune moved from the demand formula's ${text(base)} because it raises on-time Power payment from ${Math.round(baseP * 100)}% to ${Math.round(bestP * 100)}% (demand: ${demandText}).`,
  };
}
