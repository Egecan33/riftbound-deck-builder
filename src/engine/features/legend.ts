// Legend profiles, text half (spec 8.3; docs/research/legend-profiles.md section 4). New code.
//
// The data half (core cards, typical champion, rune split, battlefields by frequency) is LegendMeta, built
// by the `meta` sync step. HEURISTIC: axis weights and battlefield fit are derived from mined traits with
// the fixed constants of legend-profiles.md 4.3; text fit explains only a minority of registered
// battlefields (4.5), so callers rank by LegendMeta first and use this as the explanation.
import { deriveTraits, toScoreCard, type Trait } from '../mine';
import { quoteCard } from '../network/quote';
import { championTagOf, eligibleChampions, isSignature, isTokenCard, sameTag } from '../rules/champion';
import { identityFit } from '../rules/identity';
import type { AxisId, Card, CardDb, LegendProfile } from '../types';
import { AXES, axesOf, axisLabel, axisTagsOf } from './axes';

/** legend-profiles.md 4.3. `rewards` = the legend text pays for the axis; `enables` = it produces it. */
export const LEGEND_WEIGHTS = { rewards: 1.0, enables: 0.6, championShare: 0.2, signatureShare: 0.1, championOnly: 0.35, signatureOnly: 0.15 } as const;
export const BATTLEFIELD_FIT_MAX = 8;

const traitsOf = (card: Card, db: CardDb): string[] => db.features(card.id)?.traits ?? [...deriveTraits(toScoreCard(card))];
const round2 = (n: number): number => Math.round(n * 100) / 100;

const tagCache = new WeakMap<CardDb, string[]>();
const poolTags = (db: CardDb): string[] => {
  let held = tagCache.get(db);
  if (!held) tagCache.set(db, (held = axisTagsOf(db.all())));
  return held;
};

/**
 * Axes left out of a profile. `ready`: its payoff side is "has an exhaust cost", which most legends have;
 * what readies runes or units does not ready a legend, so the axis says nothing about the deck to build
 * (legend-profiles.md 4.4 counts only "ready your legend").
 */
export const LEGEND_SKIP_AXES: readonly AxisId[] = ['ready'];

/** Axes a card's text states (strength 1); structural enablers are left out. */
function textAxes(card: Card, db: CardDb): Record<AxisId, { e: number; p: number }> {
  const out: Record<AxisId, { e: number; p: number }> = {};
  for (const [id, v] of Object.entries(axesOf(card, traitsOf(card, db), poolTags(db)))) {
    if (LEGEND_SKIP_AXES.includes(id)) continue;
    const e = v.e >= 1 && !(id.startsWith('tag:') && card.type !== 'legend' && card.type !== 'battlefield' && !v.p) ? 1 : 0;
    if (e || v.p) out[id] = { e, p: v.p };
  }
  return out;
}

const axisTraits = (id: AxisId, side: 'e' | 'p'): Trait[] => {
  const def = AXES.find((a) => a.id === id);
  return (def ? (side === 'e' ? def.enablers : def.payoffs) : []) as Trait[];
};

const quoteAxis = (card: Card, id: AxisId, side: 'e' | 'p'): string => {
  const tag = id.startsWith('tag:') ? new RegExp(`\\b${id.slice(4)}`, 'i') : undefined;
  return quoteCard(toScoreCard(card), axisTraits(id, side), tag);
};

/** Signature cards of the legend's champion inside its domains. */
export function signaturesOf(legend: Card, db: CardDb): Card[] {
  const tag = championTagOf(legend);
  if (legend.type !== 'legend' || !tag) return [];
  const identity = new Set(legend.domains);
  return db.all()
    .filter((c) => isSignature(c) && c.type !== 'legend' && !isTokenCard(c) && !c.dataIncomplete && sameTag(championTagOf(c), tag) && identityFit(c, identity) === 'ok')
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The text-derived profile of a legend. Never throws: a card that is not a legend, or a legend without a
 * champion tag, gets an empty profile (championTag '').
 */
export function legendProfile(legend: Card, db: CardDb): LegendProfile {
  const championTag = championTagOf(legend) ?? '';
  const champions = eligibleChampions(legend, db);
  const signatures = signaturesOf(legend, db);
  const own = legend.type === 'legend' ? textAxes(legend, db) : {};
  const share = (cards: Card[]): Record<AxisId, number> => {
    const out: Record<AxisId, number> = {};
    if (cards.length === 0) return out;
    for (const c of cards) for (const id of Object.keys(textAxes(c, db))) out[id] = (out[id] ?? 0) + 1 / cards.length;
    return out;
  };
  const championShare = share(champions);
  const signatureShare = share(signatures);
  const axisWeights: Record<AxisId, number> = {};
  for (const id of new Set([...Object.keys(own), ...Object.keys(championShare), ...Object.keys(signatureShare)])) {
    const cs = championShare[id] ?? 0;
    const ss = signatureShare[id] ?? 0;
    const mine = own[id];
    const w = mine
      ? Math.min(1, (mine.p ? LEGEND_WEIGHTS.rewards : LEGEND_WEIGHTS.enables) + LEGEND_WEIGHTS.championShare * cs + LEGEND_WEIGHTS.signatureShare * ss)
      : LEGEND_WEIGHTS.championOnly * cs + LEGEND_WEIGHTS.signatureOnly * ss;
    if (w >= 0.05) axisWeights[id] = round2(w);
  }

  // Battlefields by text (4.4): complementary = it gives what the legend rewards, or asks for what the legend
  // makes (1.0 x weight); shared = both trigger on the same event (0.5 x weight). Two texts that merely make
  // the same thing do not count.
  const battlefieldFit: { id: string; reason: string; score: number }[] = [];
  if (legend.type === 'legend') {
    for (const bf of db.all()) {
      if (bf.type !== 'battlefield' || bf.dataIncomplete || isTokenCard(bf)) continue;
      const theirs = textAxes(bf, db);
      let score = 0;
      let best: { value: number; reason: string } | null = null;
      for (const [id, mine] of Object.entries(own)) {
        const other = theirs[id];
        if (!other) continue;
        const weight = axisWeights[id] ?? 0;
        let value = 0;
        let reason = '';
        if (other.e && mine.p) { value = weight; reason = `${bf.name} supplies ${axisLabel(id)}, which ${legend.name} rewards. ${quoteAxis(bf, id, 'e')} | ${quoteAxis(legend, id, 'p')}`; }
        else if (other.p && mine.e) { value = weight; reason = `${legend.name} supplies ${axisLabel(id)}, which ${bf.name} rewards. ${quoteAxis(legend, id, 'e')} | ${quoteAxis(bf, id, 'p')}`; }
        else if (other.p && mine.p) { value = 0.5 * weight; reason = `Both reward ${axisLabel(id)}. ${quoteAxis(bf, id, 'p')} | ${quoteAxis(legend, id, 'p')}`; }
        if (value <= 0) continue;
        score += value;
        if (!best || value > best.value) best = { value, reason };
      }
      if (best) battlefieldFit.push({ id: bf.id, reason: best.reason, score: round2(score) });
    }
  }
  battlefieldFit.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  return {
    legendId: legend.id,
    championTag,
    domains: [...legend.domains],
    champions: champions.map((c) => c.id),
    signatures: signatures.map((c) => c.id),
    axisWeights,
    battlefieldFit: battlefieldFit.slice(0, BATTLEFIELD_FIT_MAX).map(({ id, reason }) => ({ id, reason })),
  };
}

/** A profile for every complete, non-token legend of the pool. */
export const legendProfiles = (db: CardDb): LegendProfile[] =>
  db.all().filter((c) => c.type === 'legend' && !c.dataIncomplete && !isTokenCard(c)).map((c) => legendProfile(c, db));
