// Measured play evidence per card (stage 3 review: evaluation). Pure: takes plain list data.
//
// The idea is Riftfoundry's tournament calibration (apps/web/src/data/tournament/calibration.json at
// origin/main 4b90179, read by rateCardWithEvidence in scoring.ts): count a card only against the lists that
// COULD have run it ("eligibleDecks" / "includedDecks"), and shrink by a prior number of opportunities.
// Riftfoundry had 32 top-8 lists and capped the effect at +0.15 on a 2..8.5 scale; here the sample is the
// synced public lists, so the evidence is allowed to move a rating both ways (see blend.ts).
//
// Everything in this file is DATA about what people registered, not a statement about the rules.
import { identityFit } from '../rules/identity';
import { championTagOf, isSignature, isTokenCard, sameTag } from '../rules/champion';
import { nameKey } from '../rules/names';
import type { Card, Domain, LegalityData, PlayEvidence } from '../types';

/** One complete public list, as the evidence layer needs it. */
export interface PlayList {
  id: string;
  legend: string;                  // legend card id
  date: string;                    // ISO date the list was last edited
  /** Placement-or-popularity x recency weight of the list (the meta step's weight), > 0. */
  weight: number;
  /** 1 for a list of the current rules era, the meta step's previous-era factor for an older one. */
  eraWeight: number;
  main: Readonly<Record<string, number>>;   // card id -> copies, Chosen Champion included
}

/** HEURISTIC constants of the evidence layer. */
export const EVIDENCE = {
  /**
   * A legend's own share counts for this fraction when it is higher than the pooled share: a card run by
   * 9 of 10 lists of one legend and by nobody else is a staple of one deck, not a staple of the format.
   */
  peakFactor: 0.5,
  /** Lists of pseudo-evidence at "not played" added to a legend's count before its share is used as a peak. */
  peakPriorLists: 5,
  /** A legend needs this many eligible lists before its share can be a peak. */
  peakMinLists: 3,
} as const;

export const isMainDeckCard = (card: Card): boolean =>
  !isTokenCard(card) && (card.type === 'unit' || card.type === 'spell' || card.type === 'gear');

/** First date any printing of the card was legal, or null when no set of the card has a date. */
export function legalFromOf(card: Card, legality: LegalityData): string | null {
  let first: string | null = null;
  for (const s of legality.sets) {
    if (!s.legalFrom || !card.sets.includes(s.code)) continue;
    if (first === null || s.legalFrom < first) first = s.legalFrom;
  }
  return first;
}

/** Date a main-deck ban of the card took effect in Standard, or null. Keyed on the rules name (legality data). */
export function bannedFromOf(card: Card, legality: LegalityData): string | null {
  let from: string | null = null;
  for (const b of legality.bans) {
    if (b.zone !== 'main' || nameKey(b.name) !== nameKey(card.name)) continue;
    if (!b.formats.some((f) => f === 'standard-bo1' || f === 'standard-bo3')) continue;
    if (from === null || b.effectiveFrom < from) from = b.effectiveFrom;
  }
  return from;
}

/** Can a deck of this legend hold the card (Domain Identity CR 103.2.b; signature cards CR 103.2.d)? */
export function legendCanRun(card: Card, legend: Card): boolean {
  if (identityFit(card, new Set<Domain>(legend.domains)) !== 'ok') return false;
  return !isSignature(card) || sameTag(championTagOf(card), championTagOf(legend));
}

/**
 * Was the list able to run the card? The legend must allow it, the card must have been legal on the list's
 * date, and for a card that is banned today only lists from before the ban count (its pre-ban evidence).
 */
export function listCanRun(card: Card, legend: Card, list: PlayList, legalFrom: string | null, bannedFrom: string | null): boolean {
  const day = list.date.slice(0, 10);
  if (legalFrom !== null && day < legalFrom) return false;
  if (bannedFrom !== null && day >= bannedFrom) return false;
  return legendCanRun(card, legend);
}

const round = (n: number, places: number): number => { const f = 10 ** places; return Math.round(n * f) / f; };

/**
 * The single 0..1 number the blend reads: the pooled share, or a fraction of the best legend's share when
 * that is higher. Monotonic in both.
 */
export const playScoreOf = (e: Pick<PlayEvidence, 'share' | 'peak'>): number =>
  Math.max(e.share, e.peak ? EVIDENCE.peakFactor * e.peak.share : 0);

/**
 * Evidence for every main-deck card of `cards` that at least one list could have run. A card absent from
 * the result has no play data (no legend with lists can run it, or it is newer than every list).
 *
 * share = sum of weights of the eligible lists that run it / sum of weights of the eligible lists.
 * Normalising by eligibility matters: a two-domain signature card can only ever be in one legend's lists,
 * a one-domain common in a third of all lists.
 */
export function computePlayEvidence(cards: readonly Card[], lists: readonly PlayList[], legality: LegalityData): Map<string, PlayEvidence> {
  const byId = new Map(cards.map((c) => [c.id, c]));
  const byLegend = new Map<string, PlayList[]>();
  for (const l of lists) {
    if (!(l.weight > 0)) continue;
    const legend = byId.get(l.legend);
    if (!legend || legend.type !== 'legend') continue;
    const held = byLegend.get(l.legend);
    if (held) held.push(l);
    else byLegend.set(l.legend, [l]);
  }
  const out = new Map<string, PlayEvidence>();
  for (const card of cards) {
    if (!isMainDeckCard(card)) continue;
    const legalFrom = legalFromOf(card, legality);
    const bannedFrom = bannedFromOf(card, legality);
    let wAll = 0, wSq = 0, wIn = 0, wEra = 0, wCopies = 0, n = 0, nIn = 0, legends = 0;
    let peak: PlayEvidence['peak'] = null;
    for (const [legendId, group] of byLegend) {
      const legend = byId.get(legendId) as Card;
      if (!legendCanRun(card, legend)) continue;
      let lw = 0, lwIn = 0, ln = 0, lnIn = 0;
      for (const list of group) {
        if (!listCanRun(card, legend, list, legalFrom, bannedFrom)) continue;
        // A banned card's evidence is its pre-ban era: those lists are not discounted for being old.
        const w = list.weight * (bannedFrom !== null ? 1 : list.eraWeight);
        const copies = list.main[card.id] ?? 0;
        lw += w; ln += 1; wSq += w * w; wEra += w * list.eraWeight;
        if (copies > 0) { lwIn += w; lnIn += 1; wCopies += w * copies; }
      }
      if (ln === 0) continue;
      legends += 1;
      wAll += lw; wIn += lwIn; n += ln; nIn += lnIn;
      if (ln >= EVIDENCE.peakMinLists && lnIn > 0) {
        const share = (lwIn / lw) * (ln / (ln + EVIDENCE.peakPriorLists));
        if (!peak || share > peak.share) peak = { legend: legendId, share: round(share, 4), lists: lnIn, of: ln };
      }
    }
    if (n === 0 || wAll <= 0) continue;
    out.set(card.id, {
      share: round(wIn / wAll, 4),
      lists: nIn,
      eligibleLists: n,
      eligibleLegends: legends,
      nEff: round((wAll * wAll) / wSq, 2),
      avgCopies: wIn > 0 ? round(wCopies / wIn, 2) : 0,
      eraWeight: round(wEra / wAll, 3),
      peak,
      banned: bannedFrom !== null,
    });
  }
  return out;
}
