// Measured co-play edges (stage 3 review: evaluation). Pure.
//
// A co-play edge says: in the synced public lists of a legend, these two cards are registered together
// more often than their separate play rates in that legend's lists predict. It is DATA about what people
// register. It is not a rules interaction and must never be shown as one: every reason carries the scope
// "co-play", the label below and the counts it rests on.
//
// The idea follows Riftfoundry's pair evidence (meta.ts MetaPairAdjustment, signalKind
// "conditional_cooccurrence", eligibleDecks / jointDecks at origin/main 4b90179); the rule is new.
//
// Definitions, per pair (A, B):
//   For each legend L that can run both, over the lists of L on whose date both cards were legal:
//     n = lists, a = lists with A, b = lists with B, t = lists with both.
//     chance = a x b / n   (lists with both if A and B were chosen independently within L's lists)
//   together = sum of t, chance = sum of a x b / n over the legends with at least COPLAY.minLegendLists lists.
//   lift = together / chance.
//   shrunk lift = (together + k) / (chance + k), k = COPLAY.priorLists: a small sample is pulled toward 1.
// Two staples of one legend (both in nearly every list) have lift near 1 and get no edge: that they are
// both run there is already in the legend's own meta rows, and says nothing about the pair.
import type { Card, CardEdge, EdgeReason, LegalityData } from '../types';
import { bannedFromOf, isMainDeckCard, legalFromOf, legendCanRun, type PlayList } from './play';

/** HEURISTIC thresholds of the co-play rule. */
export const COPLAY = {
  minLegendLists: 5,     // a legend's lists are used only when at least this many could run both cards
  minTogether: 5,        // minimum support: lists that run both, summed over legends
  minExcess: 2,          // lists together beyond chance
  priorLists: 3,         // pseudo-lists at chance (shrinkage)
  minLift: 1.3,          // shrunk lift needed for an edge: "a clear margin"
  maxValue: 1,           // a measured edge never outweighs a strong rules interaction (those reach 2 and more)
} as const;

export const COPLAY_SCOPE = 'co-play';
export const COPLAY_LABEL = 'Played together (measured)';

export interface PairCount { n: number; a: number; b: number; t: number }
export interface CoPlayStat {
  a: string; b: string;
  together: number; chance: number; lift: number; shrunkLift: number;
  /** The legend with the most lists running both. */
  top: { legend: string } & PairCount;
  legends: number;
}

const round = (n: number, places: number): number => { const f = 10 ** places; return Math.round(n * f) / f; };

/** Lift and shrunk lift from per-legend counts; null when the pair fails the rule. */
export function coPlayOf(counts: readonly PairCount[]): { together: number; chance: number; lift: number; shrunkLift: number } | null {
  let together = 0;
  let chance = 0;
  for (const c of counts) {
    if (c.n < COPLAY.minLegendLists) continue;
    together += c.t;
    chance += (c.a * c.b) / c.n;
  }
  if (together < COPLAY.minTogether || together - chance < COPLAY.minExcess) return null;
  const shrunkLift = (together + COPLAY.priorLists) / (chance + COPLAY.priorLists);
  if (shrunkLift < COPLAY.minLift) return null;
  return { together, chance: round(chance, 2), lift: round(together / chance, 2), shrunkLift: round(shrunkLift, 2) };
}

/** HEURISTIC edge value, 0.1..COPLAY.maxValue: grows with the shrunk lift and with support. */
export const coPlayValue = (shrunkLift: number, together: number): number =>
  round(Math.max(0.1, Math.min(COPLAY.maxValue, (0.4 + 0.6 * Math.log2(shrunkLift)) * Math.min(1, together / 10))), 2);

/** Readable legend name for reasons: the champion tag, with the legend's own name when a tag has several legends. */
export function legendLabels(cards: readonly Card[]): Map<string, string> {
  const legends = cards.filter((c) => c.type === 'legend');
  const perTag = new Map<string, number>();
  for (const l of legends) perTag.set(l.championTag ?? l.name, (perTag.get(l.championTag ?? l.name) ?? 0) + 1);
  return new Map(legends.map((l) => {
    const tag = l.championTag ?? l.name;
    return [l.id, (perTag.get(tag) ?? 0) > 1 && tag !== l.name ? `${tag} (${l.name})` : tag];
  }));
}

/** Every pair of main-deck cards that passes the co-play rule. Cards banned today are left out. */
export function coPlayStats(cards: readonly Card[], lists: readonly PlayList[], legality: LegalityData): CoPlayStat[] {
  const byId = new Map(cards.map((c) => [c.id, c]));
  const usable = (c: Card | undefined): c is Card => !!c && isMainDeckCard(c) && !c.dataIncomplete && bannedFromOf(c, legality) === null;
  const legalFrom = new Map<string, string>();
  const from = (c: Card): string => {
    let held = legalFrom.get(c.id);
    if (held === undefined) { held = legalFromOf(c, legality) ?? ''; legalFrom.set(c.id, held); }
    return held;
  };
  const byLegend = new Map<string, PlayList[]>();
  for (const l of lists) {
    const held = byLegend.get(l.legend);
    if (held) held.push(l);
    else byLegend.set(l.legend, [l]);
  }
  const acc = new Map<string, { a: string; b: string; counts: ({ legend: string } & PairCount)[] }>();
  for (const [legendId, group] of [...byLegend.entries()].sort((x, y) => x[0].localeCompare(y[0]))) {
    const legend = byId.get(legendId);
    if (!legend || legend.type !== 'legend' || group.length < COPLAY.minLegendLists) continue;
    const played = new Map<string, Card>();
    for (const l of group) for (const id of Object.keys(l.main)) { const c = byId.get(id); if (usable(c) && legendCanRun(c, legend)) played.set(id, c); }
    const ids = [...played.keys()].sort();
    const days = group.map((l) => l.date.slice(0, 10));
    const has = new Map(ids.map((id) => [id, group.map((l) => (l.main[id] ?? 0) > 0)]));
    for (let i = 0; i < ids.length; i += 1) {
      const A = played.get(ids[i]) as Card;
      const hasA = has.get(ids[i]) as boolean[];
      for (let j = i + 1; j < ids.length; j += 1) {
        const B = played.get(ids[j]) as Card;
        const hasB = has.get(ids[j]) as boolean[];
        const since = from(A) > from(B) ? from(A) : from(B);
        let n = 0, a = 0, b = 0, t = 0;
        for (let k = 0; k < group.length; k += 1) {
          if (days[k] < since) continue;
          n += 1;
          if (hasA[k]) a += 1;
          if (hasB[k]) b += 1;
          if (hasA[k] && hasB[k]) t += 1;
        }
        if (t === 0 || n < COPLAY.minLegendLists) continue;
        const key = `${ids[i]}|${ids[j]}`;
        const held = acc.get(key);
        if (held) held.counts.push({ legend: legendId, n, a, b, t });
        else acc.set(key, { a: ids[i], b: ids[j], counts: [{ legend: legendId, n, a, b, t }] });
      }
    }
  }
  const out: CoPlayStat[] = [];
  for (const pair of acc.values()) {
    const stat = coPlayOf(pair.counts);
    if (!stat) continue;
    const top = [...pair.counts].sort((x, y) => y.t - x.t || x.legend.localeCompare(y.legend))[0];
    out.push({ a: pair.a, b: pair.b, ...stat, top, legends: pair.counts.length });
  }
  return out.sort((x, y) => x.a.localeCompare(y.a) || x.b.localeCompare(y.b));
}

/** The reason of a co-play edge: the counts, in words, and the statement that it is measured data. */
export function coPlayReason(stat: CoPlayStat, cards: ReadonlyMap<string, Card>, labels: ReadonlyMap<string, string>): EdgeReason {
  const nameA = cards.get(stat.a)?.name ?? stat.a;
  const nameB = cards.get(stat.b)?.name ?? stat.b;
  const legend = labels.get(stat.top.legend) ?? 'one legend';
  const inTop = `${stat.top.t} of ${stat.top.n} ${legend} lists (${stat.top.a} run ${nameA}, ${stat.top.b} run ${nameB})`;
  const detail = stat.legends > 1
    ? `${nameA} and ${nameB} are played together in ${stat.together} lists of ${stat.legends} legends, ${stat.lift}x the ${stat.chance} that chance predicts; most in ${legend}: ${inTop}.`
    : `${nameA} and ${nameB} are played together in ${inTop}, ${stat.lift}x the ${stat.chance} that chance predicts.`;
  return {
    id: `${COPLAY_SCOPE}:${stat.a}:${stat.b}`,
    kind: 'synergy',
    scope: COPLAY_SCOPE,
    label: COPLAY_LABEL,
    detail: `${detail} Measured in public lists; not a rules interaction.`,
    value: coPlayValue(stat.shrunkLift, stat.together),
  };
}

export const isCoPlayReason = (reason: Pick<EdgeReason, 'scope'>): boolean => reason.scope === COPLAY_SCOPE;

/**
 * Stored edges plus the measured ones. A pair that already has a mechanical edge gets the co-play reason
 * appended and its totals recomputed with the network's clamps (synergy 0..10); a new pair gets an edge
 * whose only reason is the measurement. Edge direction (a, b) of an existing edge is kept. Idempotent.
 */
export function mergeCoPlayEdges(edges: readonly CardEdge[], stats: readonly CoPlayStat[], cards: readonly Card[]): { edges: CardEdge[]; added: number; merged: number } {
  const byId = new Map(cards.map((c) => [c.id, c]));
  const labels = legendLabels(cards);
  const key = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);
  // A measurement already on an edge is replaced, not stacked: take it out first, value included.
  const out: CardEdge[] = [];
  for (const e of edges) {
    const old = e.reasons.filter(isCoPlayReason);
    if (old.length === 0) { out.push(e); continue; }
    const reasons = e.reasons.filter((r) => !isCoPlayReason(r));
    if (reasons.length === 0) continue; // the edge was only the measurement
    const synergy = round(Math.max(0, e.synergy - old.reduce((s, r) => s + r.value, 0)), 2);
    out.push({ ...e, synergy, net: round(synergy - e.antisynergy, 2), reasons });
  }
  const index = new Map(out.map((e, i) => [key(e.a, e.b), i]));
  let added = 0;
  let merged = 0;
  for (const stat of stats) {
    const reason = coPlayReason(stat, byId, labels);
    const at = index.get(key(stat.a, stat.b));
    if (at === undefined) {
      out.push({ a: stat.a, b: stat.b, synergy: reason.value, antisynergy: 0, net: reason.value, reasons: [reason] });
      added += 1;
    } else {
      const e = out[at];
      const synergy = round(Math.min(10, e.synergy + reason.value), 2);
      out[at] = { ...e, synergy, net: round(synergy - e.antisynergy, 2), reasons: [...e.reasons, reason] };
      merged += 1;
    }
  }
  return { edges: out, added, merged };
}
