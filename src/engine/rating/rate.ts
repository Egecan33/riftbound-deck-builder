// Deck rating 0-100 (plan Task 6; spec 11; docs/research/deck-theory.md 8). New code. Pure.
//
// Nine sub-scores with the weights of spec 11. Each `value` is 0..100 (how much of that sub-score the deck
// earns); rating = round(sum(weight x value) / 100). Legality is separate: `legal` is the rules engine's
// verdict, and a deck with a rule violation other than "not finished yet" is capped at ILLEGAL_CAP.
//
// Where the numbers come from:
// - curve, roles, consistency: measured bands of src/engine/targets.ts and exact draw odds (maths/).
// - runes: castability is the ported hypergeometric check; the split is deck-theory.md 3.2 (fitted).
// - quality: evaluated card ratings (mechanical rating blended with measured play).
// - synergy: stored network edges, theme balance, and the ported Riftfoundry deck score's structural
//   findings (dead payoffs, engines without support). Its curve targets are NOT used (deck-theory.md 2.10).
// - win conditions: an interim formula (deck-theory.md 8 "Win plan") until plan Task 7 passes a WinReport.
// Sub-scores resting on our own formulas are flagged `heuristic`.
import { axisLabel } from '../features/axes';
import { ROLE_LABELS } from '../features/roles';
import { seenByTurn } from '../maths/curve';
import type { RuneRecommendation } from '../maths/hypergeo';
import { runeSplit } from '../maths/runes';
import { isGenericReason } from '../network/edges';
import { BATTLEFIELDS_BROUGHT, MAIN_MIN, RUNE_DECK_SIZE, formatRules } from '../rules/formats';
import { legendOf } from '../rules/identity';
import { isLegal, validateDeck } from '../rules/validate';
import { portedDeckScore } from '../scoring/bridge';
import { CAST_EPS, acceptedCast, castFit, payOdds, payingDomains, payingRunes, runesWhenCast } from '../scoring/castability';
import { featuresFor, qtyOf, resolveThemeWeights, summarizeDeck } from '../summary';
import { bandScore, bandText, derivedCounts, targetsFor, wholeBand, type FullTargets } from '../targets';
import type { Card, CardDb, CardFeatures, Deck, DeckRating, DeckSummary, Domain, EngineContext, Fix, Role, SubScore, Violation, WinReport } from '../types';

export const RATING_WEIGHTS = { quality: 12, synergy: 16, curve: 12, runes: 12, roles: 12, wincons: 12, consistency: 10, extras: 8, fit: 6 } as const;
export const ILLEGAL_CAP = 40;
export const MAX_FIXES = 3;

/** Violations that only say the deck is not finished; they do not cap the rating. */
export const UNFINISHED_CODES: readonly string[] = ['MAIN_TOO_SMALL', 'RUNE_COUNT', 'BATTLEFIELD_COUNT', 'LEGEND_MISSING', 'CHAMPION_MISSING'];

/** HEURISTIC constants of the rating. */
export const RATING = {
  /**
   * Mean evaluated rating mapped to 0..1 between these. Measured 2026-11-12: the median card of the pool is 59;
   * the mean over a public list is 68 (p5), 74.5 (median), 78 (p95). So a pile of average cards earns about a
   * fifth and a typical public list all of it.
   */
  qualityLo: 55, qualityHi: 75, weakRating: 45, weakTailFull: 0.2,
  /**
   * Stored partners per card (copy-weighted, each card counted up to `partnerCap`) at which the density term is
   * full. Measured 2026-11-12 on public lists: 0.65 (p25), 1.33 (median), 1.95 (p75) rules-interaction partners.
   * In the median public list 40% of the copies have no stored partner at all, so "no partner" alone is not a
   * fault. An orphan is an unconnected PAYOFF with fewer than `orphanEnablers` enabler copies in the deck
   * (stage 3 review); `orphanFree` of the deck may be orphans before the orphan term falls.
   */
  partnersFull: 2, partnerCap: 4, orphanFree: 0.05, orphanSpan: 0.3, orphanEnablers: 3, balanceFull: 6, orphanPenalty: 0.08, orphanPenaltyMax: 0.24,
  /**
   * Share of the rating lost per share of main-deck cards that the rune deck can never pay for (0 runes of every
   * domain that pays their Power). 1 = a dead card counts as a missing card. HEURISTIC.
   */
  deadCardScale: 1,
  earlyLo: 0.6, earlyHi: 0.9,
  /** A count outside its band becomes a fix at this band score or lower (1 = on the band edge, 0.5 = at the tolerance edge). HEURISTIC. */
  fixBelow: 0.8,
  /** In the order of role fixes a missing role counts this much more than a surplus of the same size. HEURISTIC. */
  shortFirst: 1.5,
  /** Band score of a core role under which the Roles score is scaled by (1 - coreHole + score). HEURISTIC. */
  coreHole: 0.5,
  enginePoints: 12, offChampion: 0.6,
  sideFullShare: 0.5, bfNoData: 0.7, bfMinLists: 8,
  powerMean: { competitive: 68, focused: 62, casual: 0 } as Record<string, number>,
  /**
   * Answers (calibration 2026-11-12, plan Task 12). The weighted sub-scores let a deck with no removal or no
   * interaction at all keep a tournament-level rating (40 tournament lists 80 mean; the same lists with every
   * interaction card swapped for good units 67, the best of them 84). Measured on 789 public Standard lists:
   * interaction copies (removal, sweeper, counter, combat trick, disruption) p1 3, p2 4, p5 5, median 14;
   * removal and sweeper copies 0 in 4% of lists (11 of 295 tournament lists); chance of an interaction card by
   * turn 3 p2 0.56, p10 0.83, median 0.97. HEURISTIC scales on top of those measured floors:
   * - `answersFloor` interaction copies (p5) or more cost nothing; under it the whole rating is scaled down
   *   linearly to `answersMaxLoss` at 0 (like dead cards: a deck that cannot answer anything is not 13% worse).
   * - no removal or sweeper at all scales the rating by 1 - `noRemovalLoss`.
   * - the interaction term of Consistency runs from `ixLo` (0) to `ixHi` (full) instead of linearly from 0.
   * - a short core role's hole is at most count / band floor, so 0 removal is a full hole, not a third of one.
   * Applied once the main deck is full (MAIN_MIN cards): an unfinished deck is not judged on what it lacks yet.
   */
  answersFloor: 5, answersMaxLoss: 0.25, noRemovalLoss: 0.08, ixLo: 0.5, ixHi: 0.9,
} as const;

const DOMAIN_LABEL: Record<Domain, string> = { fury: 'Fury', calm: 'Calm', mind: 'Mind', body: 'Body', chaos: 'Chaos', order: 'Order' };
const clamp01 = (x: number): number => (Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 0);
const pct = (x: number): string => `${Math.round(clamp01(x) * 100)}%`;
const sub = (key: keyof typeof RATING_WEIGHTS, label: string, value: number, fixes: Fix[], heuristic: boolean): SubScore =>
  ({ key, label, weight: RATING_WEIGHTS[key], value: Math.round(clamp01(value) * 100), fixes: fixes.slice(0, MAX_FIXES), heuristic });

interface Held { card: Card; qty: number; f: CardFeatures }

interface Work {
  deck: Deck; db: CardDb; summary: DeckSummary; targets: FullTargets; main: Held[]; legend: Card | null; so: string;
}

/** A band deficit or excess as a fix, or null when the count is inside the band. */
function bandFix(w: Work, key: string, label: string, count: number, filter: Fix['filter']): { fix: Fix; score: number } | null {
  const band = w.targets.scaled[key];
  if (!band) return null;
  const score = bandScore(count, band);
  // The band is the middle half of public lists, so half of all tournament lists sit just outside it on any one
  // count. That costs score, but it is only called a fix from `fixBelow` down (stage 3 review: 40 of 40
  // tournament lists were told to fix their curve).
  if (score > RATING.fixBelow) return null;
  const short = count < band.lo;
  const shown = wholeBand(band);
  const gap = Math.max(1, Math.round(short ? shown.lo - count : count - shown.hi));
  // One card off the middle half is inside the spread of tournament lists unless it is past the tolerance edge.
  if (gap <= 1 && score >= 0.5) return null;
  return { score, fix: { text: `${gap} ${short ? 'short on' : 'over on'} ${label} for ${w.targets.archetype}: have ${count}, band ${bandText(band)}${w.so}.`, filter: short ? filter : null } };
}

function qualityScore(w: Work): SubScore {
  const copies = w.main.reduce((n, h) => n + h.qty, 0);
  if (copies === 0) return sub('quality', 'Card quality', 0, [{ text: 'No main-deck cards yet.', filter: null }], true);
  const mean = w.main.reduce((n, h) => n + h.qty * h.f.evaluatedRating, 0) / copies;
  const weak = w.main.filter((h) => h.f.evaluatedRating < RATING.weakRating).sort((a, b) => a.f.evaluatedRating - b.f.evaluatedRating || a.card.id.localeCompare(b.card.id));
  const tail = weak.reduce((n, h) => n + h.qty, 0) / copies;
  const value = 0.75 * clamp01((mean - RATING.qualityLo) / (RATING.qualityHi - RATING.qualityLo)) + 0.25 * (1 - Math.min(1, tail / RATING.weakTailFull));
  const fixes: Fix[] = weak.map((h) => {
    const ev = h.f.evidence;
    const why = ev && ev.eligibleLists > 0 ? `played in ${ev.lists} of ${ev.eligibleLists} lists that could run it` : 'no play data, text rating only';
    return { text: `${h.qty}x ${h.card.name} is among the weakest cards here: evaluated rating ${h.f.evaluatedRating} (mechanical ${h.f.baseRating}; ${why}). Mean of the deck is ${mean.toFixed(1)}.`, filter: h.f.roles[0] ? { role: h.f.roles[0] } : null };
  });
  return sub('quality', 'Card quality', value, fixes, true);
}

function synergyScore(w: Work, theme: Record<string, number>): SubScore {
  const copies = w.main.reduce((n, h) => n + h.qty, 0);
  if (copies === 0) return sub('synergy', 'Synergy density', 0, [{ text: 'No main-deck cards yet.', filter: null }], true);
  const anchors: Card[] = [];
  if (w.legend) anchors.push(w.legend);
  const fixes: { fix: Fix; weight: number }[] = [];
  let partnerSum = 0;
  let orphanCopies = 0;
  for (const h of w.main) {
    let partners = 0;
    for (const other of [...w.main.map((o) => o.card), ...anchors]) {
      if (other.id === h.card.id) continue;
      const edge = w.db.edge(h.card.id, other.id);
      if (!edge) continue;
      let net = 0;
      for (const r of edge.reasons) if (!isGenericReason(r.id)) net += r.kind === 'synergy' ? Math.abs(r.value) : -Math.abs(r.value);
      if (net > 0) partners += 1;
    }
    partnerSum += h.qty * Math.min(RATING.partnerCap, partners);
    const onTheme = Object.entries(h.f.axes).some(([axis, v]) => (theme[axis] ?? 0) >= 0.3 && Math.max(v.e, v.p) >= 0.5);
    if (partners > 0 || onTheme) continue;
    // An orphan is a card that WANTS something the deck does not give it: a payoff whose enablers are missing.
    // A card that only enables, answers or draws stands on its own, and so does a card most lists run. (The first
    // version called every unconnected card an orphan and listed Defy and Discipline as a fault of 40 of 40
    // tournament lists.)
    if (h.f.evaluatedRating >= RATING.qualityHi) continue;
    let unmet: { axis: string; enablers: number } | null = null;
    for (const [axis, v] of Object.entries(h.f.axes)) {
      if (v.p < 0.5) continue;
      const enablers = Math.max(0, (w.summary.axisTotals[axis]?.e ?? 0) - h.qty * v.e);
      if (enablers >= RATING.orphanEnablers * w.targets.scale) { unmet = null; break; }
      if (!unmet || enablers < unmet.enablers) unmet = { axis, enablers };
    }
    if (!unmet) continue;
    orphanCopies += h.qty;
    fixes.push({ weight: h.qty, fix: { text: `${h.qty}x ${h.card.name} pays off ${axisLabel(unmet.axis)}, but the deck has ${Math.round(unmet.enablers)} other ${Math.round(unmet.enablers) === 1 ? 'copy' : 'copies'} that set it up, and it has no stored interaction (rules text or measured co-play) with any other card here or with ${w.legend?.name ?? 'a legend'}.`, filter: { axis: unmet.axis } } });
  }
  const density = Math.min(1, partnerSum / copies / RATING.partnersFull);
  const orphanShare = Math.max(0, orphanCopies / copies - RATING.orphanFree) / RATING.orphanSpan;
  const top = Object.entries(theme).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  let balance = 0.5;
  if (top) {
    const t = w.summary.axisTotals[top[0]] ?? { e: 0, p: 0 };
    const lo = Math.min(t.e, t.p);
    const hi = Math.max(t.e, t.p);
    // A theme with no card at all on either side is a theme the deck does not play, not a lopsided one (the Task 12
    // calibration print told a Kha'Zix build "Buffs is lopsided: 0 enabler and 0 payoff copies. Add payoffs").
    // The score is unchanged (0 balance); only the words are.
    balance = hi === 0 ? 0 : lo >= RATING.balanceFull * w.targets.scale ? 1 : lo / hi;
    if (hi === 0) {
      fixes.push({ weight: 1, fix: { text: `No card here plays ${axisLabel(top[0])}, the theme ${w.legend?.name ?? 'the legend'} leans on most; the deck builds around something else.`, filter: { axis: top[0] } } });
    } else if (balance < 0.5) {
      const side = t.e < t.p ? 'enablers' : 'payoffs';
      fixes.push({ weight: 4, fix: { text: `The deck's top theme, ${axisLabel(top[0])}, is lopsided: ${Math.round(t.e)} enabler and ${Math.round(t.p)} payoff copies. Add ${side}.`, filter: { axis: top[0] } } });
    }
  }
  // Structural findings of the ported Riftfoundry deck score: payoffs without support, engines without a board.
  let penalty = 0;
  const ported = portedDeckScore(w.deck, w.db, 'pair');
  for (const c of ported.contributions) {
    if (c.value >= 0 || !/^(dead-|buff-without-board|gear-without-board|equipment-carriers|trash-resource-conflict)/.test(c.id)) continue;
    penalty += RATING.orphanPenalty;
    fixes.push({ weight: 10 + Math.abs(c.value), fix: { text: `${c.label}: ${c.detail}${c.cards?.length ? ` (${c.cards.slice(0, 4).join(', ')})` : ''}`, filter: null } });
  }
  const value = 0.6 * density + 0.25 * balance + 0.15 * (1 - Math.min(1, orphanShare)) - Math.min(RATING.orphanPenaltyMax, penalty);
  fixes.sort((a, b) => b.weight - a.weight);
  return sub('synergy', 'Synergy density', value, fixes.map((f) => f.fix), true);
}

function earlyCopies(w: Work): { copies: number; label: string } {
  const control = w.targets.archetypeId === 'big-control';
  let copies = 0;
  for (const h of w.main) {
    const e = h.card.energy ?? 0;
    const cheapAnswer = control && e <= 2 && h.f.roles.some((r) => r === 'removal' || r === 'counter' || r === 'combat-trick' || r === 'disruption' || r === 'sweeper');
    if ((h.card.type === 'unit' && e <= 2) || cheapAnswer) copies += h.qty;
  }
  return { copies, label: control ? 'units or interaction costing 2 or less' : 'units costing 2 or less' };
}

const libraryOf = (w: Work): number => Math.max(0, w.summary.mainCount - (w.deck.champion && w.main.some((h) => h.card.id === w.deck.champion) ? 1 : 0));

function curveScore(w: Work): SubScore {
  if (w.summary.mainCount === 0) return sub('curve', 'Curve', 0, [{ text: 'No main-deck cards yet.', filter: null }], false);
  const fixes: { fix: Fix; score: number }[] = [];
  const avg = bandScore(w.summary.avgEnergy, w.targets.full.avgEnergy);
  if (avg < 1) {
    const b = w.targets.full.avgEnergy;
    fixes.push({ score: avg, fix: { text: `Average Energy ${w.summary.avgEnergy.toFixed(2)} is ${w.summary.avgEnergy < b.lo ? 'below' : 'above'} the ${w.targets.archetype} band ${b.lo.toFixed(2)}-${b.hi.toFixed(2)}.`, filter: w.summary.avgEnergy > b.hi ? { maxEnergy: 2 } : null } });
  }
  const bucketFixes: { fix: Fix; score: number }[] = [];
  let buckets = 0;
  for (let b = 1; b <= 7; b++) {
    const count = w.summary.curve[b] ?? 0;
    buckets += bandScore(count, w.targets.scaled[`e${b}`]);
    const fix = bandFix(w, `e${b}`, `${b === 7 ? '7+' : b}-Energy cards`, count, { maxEnergy: b });
    if (fix) bucketFixes.push(fix);
  }
  const early = earlyCopies(w);
  const library = libraryOf(w);
  const pEarly = seenByTurn(early.copies, 2, library);
  const earlyValue = clamp01((pEarly - RATING.earlyLo) / (RATING.earlyHi - RATING.earlyLo));
  const want = Math.ceil(w.targets.scaled.earlyUnits.lo);
  // Said only when the deck has fewer early plays than the lower quartile of its archetype's public lists, or
  // so few that the early term is at zero.
  if (earlyValue < 1 && (early.copies < want || pEarly < RATING.earlyLo)) {
    fixes.push({ score: earlyValue, fix: { text: `${early.copies} ${early.label}: one is in hand by turn 2 in ${pct(pEarly)} of games${want > early.copies ? `; ${want} would give ${pct(seenByTurn(want, 2, library))}` : ''}.`, filter: { type: 'unit', maxEnergy: 2 } } });
  }
  // The two whole-curve findings come first; then the buckets furthest from their band.
  bucketFixes.sort((a, b) => a.score - b.score);
  return sub('curve', 'Curve', 0.4 * avg + 0.3 * (buckets / 7) + 0.3 * earlyValue, [...fixes, ...bucketFixes].map((f) => f.fix), false);
}

/**
 * Main-deck cards with a Power cost that no rune of the deck's rune deck can pay. Only a complete-looking rune
 * deck is judged (an empty one is "no runes yet", not a mistake). Gold tokens and other Power sources are not
 * modelled (deck-theory.md 6), which is why this scales the rating instead of failing the deck.
 */
export function deadCards(w: Pick<Work, 'deck' | 'main'>): { copies: number; names: string[]; domains: Domain[] } {
  const runes = (Object.entries(w.deck.runes) as [Domain, number][]).filter(([, n]) => Number.isFinite(n) && n > 0).map(([domain, count]) => ({ domain, count: Math.floor(count) }));
  const out = { copies: 0, names: [] as string[], domains: [] as Domain[] };
  if (runes.reduce((n, r) => n + r.count, 0) === 0) return out;
  for (const h of w.main) {
    if ((h.card.power ?? 0) < 1 || payingRunes(h.card, runes) > 0) continue;
    out.copies += h.qty;
    out.names.push(h.card.name);
    for (const d of payingDomains(h.card)) if (!out.domains.includes(d)) out.domains.push(d);
  }
  return out;
}

/**
 * How much the deck can answer: interaction copies and removal (plus sweeper) copies, and the factor that scales
 * the whole rating when they are under the measured floors of public lists (see RATING answers*). HEURISTIC scale.
 */
export function answersOf(w: Pick<Work, 'deck' | 'db' | 'summary'>): { interaction: number; removal: number; factor: number; interactionFix: Fix | null; removalFix: Fix | null } {
  const interaction = derivedCounts(w.deck, w.db).interaction;
  const removal = w.summary.roleCounts.removal + w.summary.roleCounts.sweeper;
  const out = { interaction, removal, factor: 1, interactionFix: null as Fix | null, removalFix: null as Fix | null };
  if (w.summary.mainCount < MAIN_MIN) return out;
  const floor = RATING.answersFloor;
  if (interaction < floor) {
    const loss = RATING.answersMaxLoss * (1 - interaction / floor);
    out.factor *= 1 - loss;
    out.interactionFix = { text: `Only ${interaction} interaction ${interaction === 1 ? 'card' : 'cards'} (removal, sweepers, counters, combat tricks, disruption); 95% of public lists run ${RATING.answersFloor} or more (median 14). A deck that cannot answer the opponent's board scales the whole rating by ${(1 - loss).toFixed(2)} (heuristic).`, filter: { role: 'removal' } };
  }
  if (removal === 0) {
    out.factor *= 1 - RATING.noRemovalLoss;
    out.removalFix = { text: `No removal or sweeper: nothing here kills or bounces an enemy unit, which 96% of public lists can do. That scales the whole rating by ${(1 - RATING.noRemovalLoss).toFixed(2)} (heuristic).`, filter: { role: 'removal' } };
  }
  return out;
}

function runesScore(w: Work): SubScore {
  const recommended = runeSplit(w.deck, w.db);
  const recText = (Object.entries(recommended) as [Domain, number][]).map(([d, n]) => `${n} ${DOMAIN_LABEL[d]}`).join(' / ');
  if (!w.legend) return sub('runes', 'Runes', 0, [{ text: 'Choose a legend: its domains decide the runes.', filter: null }], false);
  if (w.summary.runeCount === 0) return sub('runes', 'Runes', 0, [{ text: `No runes yet. Recommended split for the cards so far: ${recText || 'none'}.`, filter: null }], false);
  const runes: RuneRecommendation[] = (Object.entries(w.deck.runes) as [Domain, number][])
    .filter(([, n]) => Number.isFinite(n) && n > 0).map(([domain, count]) => ({ domain, count: Math.floor(count), demand: w.summary.powerDemand[domain] ?? 0 }));
  const total = runes.reduce((n, r) => n + r.count, 0);
  const fixes: { fix: Fix; score: number }[] = [];
  let weight = 0;
  let cast = 0;
  const dead = deadCards(w);
  if (dead.copies > 0) {
    fixes.push({
      score: -1,
      fix: {
        text: `${dead.copies} of ${w.summary.mainCount} main-deck cards can never be paid for from this rune deck: it has 0 ${dead.domains.map((d) => DOMAIN_LABEL[d]).join(' or ')} runes for ${dead.names.slice(0, 4).join(', ')}${dead.names.length > 4 ? ` and ${dead.names.length - 4} more` : ''}. Those cards are dead, so the whole rating is scaled by ${(1 - RATING.deadCardScale * dead.copies / Math.max(1, w.summary.mainCount)).toFixed(2)} (heuristic).`,
        filter: dead.domains[0] ? { domain: dead.domains[0] } : null,
      },
    });
  }
  for (const h of w.main) {
    const power = h.card.power ?? 0;
    if (power < 1) continue;
    const p = payOdds(h.card, runes);
    const accepted = acceptedCast(h.card);
    weight += h.qty;
    cast += h.qty * castFit(h.card, runes);
    if (p + CAST_EPS >= accepted.low) continue;
    const r = Math.min(total, runesWhenCast(h.card));
    const basis = accepted.measured ? `public lists reach ${pct(accepted.low)} to ${pct(accepted.usual)} for a card with this cost` : 'no public list runs a card with this cost, so the comparison is a heuristic';
    const payable = payingDomains(h.card).filter((d) => w.legend?.domains.includes(d));
    if (payable.length !== 1) {
      fixes.push({ score: p / Math.max(0.01, accepted.usual), fix: { text: `${h.card.name} (${power} Power) is paid with the first ${r} runes in only ${pct(p)} of games with these runes (${basis}).`, filter: null } });
      continue;
    }
    const domain = payable[0];
    const have = runes.find((x) => x.domain === domain)?.count ?? 0;
    let need = have;
    let pNeed = p;
    while (need < total && pNeed + CAST_EPS < accepted.usual) {
      need += 1;
      pNeed = payOdds(h.card, [{ domain, count: need }, { domain: '__other', count: total - need }]);
    }
    fixes.push({
      score: p / Math.max(0.01, accepted.usual),
      fix: {
        text: pNeed + CAST_EPS >= accepted.usual
          ? `${need - have} short on ${DOMAIN_LABEL[domain]} runes for ${h.card.name}: have ${have}, need ${need} (its ${power} Power is paid with the first ${r} runes in ${pct(p)} of games now, ${pct(pNeed)} with ${need}; ${basis}).`
          : `${h.card.name} needs ${power} ${DOMAIN_LABEL[domain]} Power; even ${total} ${DOMAIN_LABEL[domain]} runes pay it with the first ${r} runes in only ${pct(pNeed)} of games (have ${have}).`,
        filter: { domain },
      },
    });
  }
  const castability = weight === 0 ? 1 : cast / weight;
  let off = 0;
  for (const d of new Set([...Object.keys(recommended), ...runes.map((r) => r.domain)])) off = Math.max(off, Math.abs((recommended[d as Domain] ?? 0) - (runes.find((r) => r.domain === d)?.count ?? 0)));
  const splitFit = off === 0 ? 1 : off === 1 ? 0.7 : off === 2 ? 0.3 : 0;
  const sizeFit = total === RUNE_DECK_SIZE ? 1 : Math.max(0, 1 - Math.abs(RUNE_DECK_SIZE - total) / RUNE_DECK_SIZE);
  if (off >= 2) {
    const haveText = runes.map((r) => `${r.count} ${DOMAIN_LABEL[r.domain as Domain] ?? r.domain}`).join(' / ');
    fixes.push({ score: 0.5 + splitFit / 2, fix: { text: `Rune split ${haveText} is ${off} away from the split the deck's Power costs ask for (${recText}; fitted formula, matches players within one rune in about 89% of lists).`, filter: null } });
  }
  fixes.sort((a, b) => a.score - b.score);
  return sub('runes', 'Runes', (0.6 * castability + 0.4 * splitFit) * sizeFit, fixes.map((f) => f.fix), false);
}

const ROLE_PARTS: readonly { key: string; label: string; weight: number; role: Role | null }[] = [
  { key: 'unit', label: 'units', weight: 3, role: 'unit-body' }, { key: 'role:removal', label: ROLE_LABELS.removal, weight: 3, role: 'removal' },
  { key: 'role:card-flow', label: ROLE_LABELS['card-flow'], weight: 3, role: 'card-flow' }, { key: 'role:mobility', label: ROLE_LABELS.mobility, weight: 2, role: 'mobility' },
  { key: 'role:combat-trick', label: ROLE_LABELS['combat-trick'], weight: 2, role: 'combat-trick' }, { key: 'role:counter', label: ROLE_LABELS.counter, weight: 0.75, role: 'counter' },
  { key: 'role:protection', label: ROLE_LABELS.protection, weight: 0.75, role: 'protection' }, { key: 'role:finisher', label: ROLE_LABELS.finisher, weight: 2, role: 'finisher' },
  { key: 'role:rune-ramp', label: ROLE_LABELS['rune-ramp'], weight: 1.5, role: 'rune-ramp' },
];

function rolesScore(w: Work): SubScore {
  if (w.summary.mainCount === 0) return sub('roles', 'Roles', 0, [{ text: 'No main-deck cards yet.', filter: null }], false);
  const fixes: { fix: Fix; score: number; weight: number }[] = [];
  let total = 0;
  let weights = 0;
  // A weighted mean hides a hole: a control list with 0 of its 7-14 removal cards kept 69% of this sub-score
  // (stage 3 review). The core role (units, removal, card flow) that is furthest under its band scales the mean
  // once its band score is under `coreHole`. Measured 2026-11-12: 24% of public lists are under 0.5 on one core
  // role and lose a little; 6% are under 0.25 (3% of placed tournament lists).
  let hole: { score: number; fix: Fix | null } | null = null;
  for (const part of ROLE_PARTS) {
    const count = part.role === 'unit-body' ? w.summary.typeCounts.unit : w.summary.roleCounts[part.role as Role];
    const score = bandScore(count, w.targets.scaled[part.key]);
    const isShort = count < w.targets.scaled[part.key].lo;
    total += part.weight * score;
    weights += part.weight;
    const fix = bandFix(w, part.key, part.label, count, part.role ? { role: part.role } : null);
    if (fix) fixes.push({ ...fix, weight: part.weight * (isShort ? RATING.shortFirst : 1) });
    // The hole is at most count / band floor: 0 removal against a floor of 3 is a full hole (bandScore alone gave
    // it 0.33 through the tolerance and kept 83% of the Roles score; calibration 2026-11-12).
    const holeScore = isShort ? Math.min(score, count / Math.max(1, w.targets.scaled[part.key].lo)) : score;
    if (isShort && part.weight >= 3 && holeScore < RATING.coreHole && (!hole || holeScore < hole.score)) hole = { score: holeScore, fix: fix?.fix ?? null };
  }
  const scale = hole ? 1 - RATING.coreHole + hole.score : 1;
  if (hole?.fix) hole.fix.text += ` A core role this far under its band scales the whole Roles score by ${scale.toFixed(2)} (heuristic).`;
  fixes.sort((a, b) => (1 - b.score) * b.weight - (1 - a.score) * a.weight);
  const removalFix = answersOf(w).removalFix;
  return sub('roles', 'Roles', (total / weights) * scale, [...(removalFix ? [removalFix] : []), ...fixes.map((f) => f.fix)], false);
}

function winScore(w: Work, win: WinReport | undefined): SubScore {
  if (win) return sub('wincons', 'Win conditions', win.value, win.routes.length ? [] : [{ text: 'No win route was found in this deck.', filter: { role: 'finisher' } }], true);
  if (w.summary.mainCount === 0) return sub('wincons', 'Win conditions', 0, [{ text: 'No main-deck cards yet.', filter: null }], true);
  const fixes: Fix[] = [];
  const finishers = w.summary.roleCounts.finisher + w.summary.roleCounts['point-source'];
  const finisher = bandScore(finishers, w.targets.scaled['role:finisher']);
  const fix = bandFix(w, 'role:finisher', 'finishers (6+ Energy 6+ Might units, extra turns, direct points)', finishers, { role: 'finisher' });
  if (fix && finishers < w.targets.scaled['role:finisher'].lo) fixes.push(fix.fix);
  const axis = (id: string): number => w.summary.axisTotals[id]?.p ?? 0;
  const engineCopies = axis('conquer') + axis('hold') + w.summary.roleCounts.mobility;
  const engine = Math.min(1, engineCopies / (RATING.enginePoints * w.targets.scale));
  if (engine < 0.5) fixes.push({ text: `${Math.round(engineCopies)} cards score or move toward points (conquer or hold payoffs, movement); ${Math.ceil(RATING.enginePoints * w.targets.scale)} make a steady scoring plan.`, filter: { axis: 'conquer' } });
  const meta = w.legend ? w.db.legendMeta(w.legend.id) : undefined;
  let champ = 0;
  if (w.deck.champion && w.db.get(w.deck.champion)) {
    const ranked = Object.entries(meta?.champions ?? {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const topId = ranked[0]?.[0];
    champ = !meta || meta.decks < 5 || !topId || topId === w.deck.champion ? 1 : RATING.offChampion;
    if (champ < 1 && topId) fixes.push({ text: `${w.db.get(topId)?.name ?? topId} is the Chosen Champion in ${ranked[0][1]} of ${meta?.decks} ${w.legend?.name} lists; ${w.db.get(w.deck.champion)?.name} in ${meta?.champions[w.deck.champion] ?? 0} (data, not a rule).`, filter: null });
  } else fixes.push({ text: 'No Chosen Champion yet.', filter: null });
  // deck-theory.md 8 sets this case to 0; measured 2026-11-12, more than 5% of public lists are in it under this
  // engine's finisher reading, so it halves the value and says why instead.
  const noPlan = finishers === 0 && engine < 0.3;
  const value = (0.5 * finisher + 0.3 * engine + 0.2 * champ) * (noPlan ? 0.5 : 1);
  if (noPlan) fixes.unshift({ text: `No finisher and only ${Math.round(engineCopies)} cards that score or move toward points: this reading finds no stated way to take the last points (interim check until win routes are detected).`, filter: { role: 'finisher' } });
  return sub('wincons', 'Win conditions', value, fixes, true);
}

function consistencyScore(w: Work): SubScore {
  if (w.summary.mainCount === 0) return sub('consistency', 'Consistency', 0, [{ text: 'No main-deck cards yet.', filter: null }], false);
  const d = derivedCounts(w.deck, w.db);
  const library = libraryOf(w);
  const early = earlyCopies(w);
  const pOpen = seenByTurn(early.copies, 0, library, 2);
  const pIx = seenByTurn(d.interaction, 3, library);
  const redundancy = bandScore(d.threeOfs, w.targets.scaled.threeOfs);
  const over = Math.max(0, w.summary.mainCount - MAIN_MIN);
  const sizeFit = Math.max(0, 1 - 0.25 * over);
  const fixes: { fix: Fix; score: number }[] = [];
  if (pOpen < 0.8 && (early.copies < Math.ceil(w.targets.scaled.earlyUnits.lo) || pOpen < RATING.earlyLo)) fixes.push({ score: pOpen, fix: { text: `An opening hand (4 cards, up to 2 replaced) holds one of the ${early.copies} ${early.label} in ${pct(pOpen)} of games.`, filter: { type: 'unit', maxEnergy: 2 } } });
  if (pIx < 0.85) fixes.push({ score: pIx, fix: { text: `${d.interaction} interaction cards: at least one by turn 3 in ${pct(pIx)} of games.`, filter: { role: 'removal' } } });
  if (redundancy < 1) {
    const b = w.targets.scaled.threeOfs;
    fixes.push({ score: redundancy, fix: { text: `${d.threeOfs} cards are played as 3-ofs; ${w.targets.archetype} lists have ${bandText(b)}${w.so}. ${d.threeOfs < b.lo ? 'More 3-ofs make the key cards show up.' : 'Almost everything is a 3-of; a few 1- and 2-ofs add reach.'}`, filter: null } });
  }
  if (over > 0) fixes.push({ score: sizeFit, fix: { text: `${w.summary.mainCount} main-deck cards: each card over ${MAIN_MIN} makes every key card rarer (a 3-of is in the opening hand ${pct(seenByTurn(3, 0, library))} of the time here).`, filter: null } });
  fixes.sort((a, b) => a.score - b.score);
  const ixFix = answersOf(w).interactionFix;
  if (ixFix) { const i = fixes.findIndex((f) => /interaction cards: at least one by turn 3/.test(f.fix.text)); if (i >= 0) fixes.splice(i, 1); }
  const ixValue = clamp01((pIx - RATING.ixLo) / (RATING.ixHi - RATING.ixLo));
  return sub('consistency', 'Consistency', 0.35 * pOpen + 0.25 * ixValue + 0.25 * redundancy + 0.15 * sizeFit, [...(ixFix ? [ixFix] : []), ...fixes.map((f) => f.fix)], false);
}

function extrasScore(w: Work): SubScore {
  const rules = formatRules(w.deck.format, w.db.legality());
  const meta = w.legend ? w.db.legendMeta(w.legend.id) : undefined;
  const hasData = !!meta && meta.decks >= RATING.bfMinLists;
  const fixes: Fix[] = [];
  let bf = 0;
  const picks = w.deck.battlefields.map((id) => w.db.get(id)).filter((c): c is Card => !!c && c.type === 'battlefield').slice(0, BATTLEFIELDS_BROUGHT);
  const ranked = Object.entries(meta?.battlefields ?? {}).sort((a, b) => b[1].share - a[1].share || a[0].localeCompare(b[0]));
  for (const pick of picks) {
    const stat = meta?.battlefields[pick.id];
    bf += hasData ? Math.min(1, (stat?.share ?? 0) / RATING.sideFullShare) : RATING.bfNoData;
    if (hasData && (stat?.share ?? 0) < 0.1) {
      const better = ranked.filter(([id]) => !w.deck.battlefields.includes(id)).slice(0, 2).map(([id, s]) => `${w.db.get(id)?.name ?? id} (${pct(s.share)})`).join(', ');
      fixes.push({ text: `${pick.name} is brought by ${stat?.decks ?? 0} of ${meta?.decks} ${w.legend?.name} lists${better ? `; most brought and not here: ${better}` : ''} (data, not a rule).`, filter: { type: 'battlefield' } });
    }
  }
  bf /= BATTLEFIELDS_BROUGHT;
  if (picks.length < BATTLEFIELDS_BROUGHT) fixes.unshift({ text: `${picks.length} of ${BATTLEFIELDS_BROUGHT} battlefields chosen.`, filter: { type: 'battlefield' } });
  const wantsSide = rules.sideAllowed && (w.deck.format === 'standard-bo3' || w.summary.sideCount > 0);
  if (!wantsSide) return sub('extras', 'Battlefields', bf, fixes, !hasData);
  const roles: Record<string, number> = { removal: 0, hate: 0, guard: 0 };
  for (const entry of w.deck.side) {
    const card = w.db.get(entry.id);
    if (!card) continue;
    const f = featuresFor(w.db, card);
    if (f.roles.includes('removal') || f.roles.includes('sweeper')) roles.removal += qtyOf(entry);
    if (f.roles.includes('hate')) roles.hate += qtyOf(entry);
    if (f.roles.includes('counter') || f.roles.includes('protection')) roles.guard += qtyOf(entry);
  }
  const met = [roles.removal >= 2, roles.hate >= 2, roles.guard >= 1];
  const side = 0.4 * Math.min(1, w.summary.sideCount / Math.max(1, rules.sideMax)) + 0.6 * (met.filter(Boolean).length / met.length);
  if (w.summary.sideCount < rules.sideMax) fixes.push({ text: `Side deck has ${w.summary.sideCount} of ${rules.sideMax} cards.`, filter: null });
  if (!met[0]) fixes.push({ text: `Side deck has ${roles.removal} removal ${roles.removal === 1 ? 'card' : 'cards'}; 2 or more cover a matchup that needs extra answers.`, filter: { role: 'removal' } });
  if (!met[1]) fixes.push({ text: `Side deck has ${roles.hate} ${roles.hate === 1 ? 'card that removes' : 'cards that remove'} gear; 2 or more cover gear decks.`, filter: { role: 'hate' } });
  if (!met[2]) fixes.push({ text: 'Side deck has no counter or protection card for spell-heavy opponents.', filter: { role: 'counter' } });
  return sub('extras', 'Battlefields and side deck', 0.5 * bf + 0.5 * side, fixes, true);
}

function fitScore(w: Work): SubScore {
  const copies = w.main.reduce((n, h) => n + h.qty, 0);
  if (copies === 0) return sub('fit', 'Format and power fit', 0, [{ text: 'No main-deck cards yet.', filter: null }], true);
  const mean = w.main.reduce((n, h) => n + h.qty * h.f.evaluatedRating, 0) / copies;
  const want = RATING.powerMean[w.deck.power] ?? 0;
  const power = want === 0 ? 1 : clamp01(1 - (want - mean) / 12);
  const fixes: Fix[] = [];
  if (power < 1) fixes.push({ text: `Mean evaluated card rating ${mean.toFixed(1)} is under the ${want} a ${w.deck.power} build aims for (heuristic).`, filter: null });
  let format = 1;
  if (w.deck.format === 'ffa3' || w.deck.format === 'ffa4' || w.deck.format === '2v2') {
    const guard = w.summary.roleCounts.protection + (w.summary.axisTotals.hold?.p ?? 0);
    const sweepers = w.summary.roleCounts.sweeper + w.summary.roleCounts['point-source'];
    format = clamp01(0.5 + 0.08 * guard * (1 / w.targets.scale) + 0.1 * sweepers * (1 / w.targets.scale) - 0.02 * w.summary.roleCounts.counter);
    if (format < 0.8) fixes.push({ text: `Multiplayer rewards cards that hold through several enemy turns, sweepers and direct points; the deck has ${Math.round(guard)} hold or protection cards and ${sweepers} sweepers or point sources (heuristic).`, filter: { role: 'protection' } });
  }
  return sub('fit', 'Format and power fit', 0.6 * power + 0.4 * format, fixes, true);
}

/**
 * Rates a deck. Never throws and never returns NaN: an empty deck rates 0 with a fix per sub-score.
 * @param extras.win the win-condition report of plan Task 7; without it an interim formula is used
 */
export function rateDeck(deck: Deck, ctx: EngineContext, extras: { win?: WinReport } = {}): DeckRating {
  const db = ctx.db;
  const summary = summarizeDeck(deck, db);
  const targets = targetsFor(deck, db, summary);
  const main: Held[] = [];
  for (const entry of deck.main) {
    const card = db.get(entry.id);
    if (card && qtyOf(entry) > 0) main.push({ card, qty: qtyOf(entry), f: featuresFor(db, card) });
  }
  const w: Work = { deck, db, summary, targets, main, legend: legendOf(deck, db), so: summary.mainCount > 0 && summary.mainCount < MAIN_MIN ? ` at ${summary.mainCount} cards so far` : '' };
  const subscores = [
    qualityScore(w), synergyScore(w, resolveThemeWeights(deck, db, summary)), curveScore(w), runesScore(w), rolesScore(w),
    winScore(w, extras.win), consistencyScore(w), extrasScore(w), fitScore(w),
  ];
  const violations: Violation[] = validateDeck(deck, db);
  const legal = isLegal(violations);
  const complete = !!w.legend && !!deck.champion && summary.mainCount >= MAIN_MIN && summary.runeCount === RUNE_DECK_SIZE && deck.battlefields.length === BATTLEFIELDS_BROUGHT;
  // "Not finished" is a deck that is still short. Too many runes or battlefields is a broken deck, and a Chosen
  // Champion that is not in the main deck yet is only unfinished while the main deck is still being filled.
  const short = summary.mainCount < MAIN_MIN;
  const unfinished = (v: Violation): boolean =>
    v.code === 'RUNE_COUNT' ? summary.runeCount < RUNE_DECK_SIZE
      : v.code === 'BATTLEFIELD_COUNT' ? deck.battlefields.length < BATTLEFIELDS_BROUGHT
        : v.code === 'CHAMPION_NOT_IN_MAIN' ? short
          : UNFINISHED_CODES.includes(v.code);
  const broken = violations.some((v) => v.severity === 'error' && !unfinished(v));
  // Cards the rune deck can never pay for are dead cards: no weighted sub-score can say that loudly enough
  // (a 12/0 split of a two-domain tournament list lost 6 points in the stage 3 review), so they scale the total.
  const deadShare = summary.mainCount > 0 ? deadCards(w).copies / summary.mainCount : 0;
  // Same for a deck with (almost) no answers: see RATING answers* (calibration 2026-11-12).
  const answers = answersOf(w).factor;
  const raw = Math.round((subscores.reduce((n, s) => n + s.weight * s.value, 0) / 100) * (1 - RATING.deadCardScale * Math.min(1, deadShare)) * answers);
  const rating = Math.max(0, Math.min(100, broken ? Math.min(ILLEGAL_CAP, raw) : raw));
  return { rating: Number.isFinite(rating) ? rating : 0, legal, complete, subscores, violations };
}
