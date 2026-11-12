// Can the rune split pay a card's Power cost when the card is first affordable? New code (stage 3 review of
// plan Task 6). Pure.
//
// Model (docs/research/deck-theory.md 6, "Runes on board"): a card with Energy E and Power P needs max(E, P)
// runes on board, P of them of a domain that pays it; runes of a domain among the first r channelled follow
// a hypergeometric draw from the rune deck. Two runes are channelled per turn, so r is never under 2.
// The ported cardRuneReliability (maths/hypergeo.ts) draws max(2, E) runes and so returns 0 for a card whose
// Power is above its Energy; this file draws max(2, E, P).
//
// What the odds are compared with is MEASURED, not chosen: the first review compared them with a flat 80%
// and told 37 of 40 tournament lists to run 11 runes of one domain for a 2-Energy card with 2 Power, a
// number no split reaches. ACCEPTED_CAST holds what the synced public lists actually run.
import { hypergeometricAtLeast } from '../maths/hypergeo';
import type { Card, Domain } from '../types';

export interface RuneCount { domain: string; count: number }

/** Runes on board on the first turn the card can be paid for: max(2, Energy, Power). */
export const runesWhenCast = (card: Pick<Card, 'energy' | 'power'>): number =>
  Math.max(2, Math.ceil(Number.isFinite(card.energy) ? (card.energy as number) : 0), Math.floor(Number.isFinite(card.power) ? (card.power as number) : 0));

/** Domains whose runes pay the card's Power: its Power domains, else its domains. Empty = any rune pays. */
export const payingDomains = (card: Pick<Card, 'powerDomains' | 'domains'>): readonly Domain[] =>
  (card.powerDomains.length ? card.powerDomains : card.domains);

/** Runes of the split that can pay the card's Power. */
export function payingRunes(card: Pick<Card, 'powerDomains' | 'domains'>, runes: readonly RuneCount[]): number {
  const pay = payingDomains(card) as readonly string[];
  let n = 0;
  for (const r of runes) if (Number.isFinite(r.count) && r.count > 0 && (pay.length === 0 || pay.includes(r.domain))) n += Math.floor(r.count);
  return n;
}

/** P(the first `runesWhenCast` runes hold the card's Power), 0..1. 1 for a card with no Power cost. */
export function payOdds(card: Pick<Card, 'energy' | 'power' | 'powerDomains' | 'domains'>, runes: readonly RuneCount[]): number {
  const power = Math.max(0, Math.floor(Number.isFinite(card.power) ? (card.power as number) : 0));
  if (power === 0) return 1;
  let total = 0;
  for (const r of runes) if (Number.isFinite(r.count) && r.count > 0) total += Math.floor(r.count);
  if (total === 0) return 0;
  return hypergeometricAtLeast(total, payingRunes(card, runes), Math.min(total, runesWhenCast(card)), power);
}

/**
 * MEASURED 2026-11-12 on the 789 usable public Standard lists (one row per main-deck copy with a Power cost):
 * the odds, under the model above, that the list's own rune split pays the card. `low` is the 10th percentile
 * (nine lists in ten do at least this well), `usual` the median. Rows are [Power][runes when cast]; the last
 * column of a row also covers every larger number of runes.
 * A split is only told it is short when it is under `low`, and it is asked for `usual`.
 */
export const ACCEPTED_CAST: Readonly<Record<number, readonly { runes: number; low: number; usual: number; copies: number }[]>> = {
/*ACCEPTED-CAST-BEGIN*/
  1: [{ runes: 2, low: 0.68, usual: 0.77, copies: 4790 }, { runes: 3, low: 0.84, usual: 0.91, copies: 1893 }, { runes: 4, low: 0.93, usual: 0.97, copies: 686 }, { runes: 5, low: 0.97, usual: 0.99, copies: 1240 }, { runes: 6, low: 0.97, usual: 1.00, copies: 413 }, { runes: 7, low: 1.00, usual: 1.00, copies: 546 }, { runes: 8, low: 1.00, usual: 1.00, copies: 219 }],
  2: [{ runes: 2, low: 0.23, usual: 0.32, copies: 1387 }, { runes: 3, low: 0.50, usual: 0.87, copies: 131 }, { runes: 4, low: 0.58, usual: 0.85, copies: 73 }, { runes: 5, low: 0.88, usual: 0.88, copies: 161 }, { runes: 6, low: 0.88, usual: 0.96, copies: 162 }, { runes: 7, low: 0.95, usual: 0.99, copies: 37 }, { runes: 8, low: 1.00, usual: 1.00, copies: 282 }],
  3: [{ runes: 3, low: 0.05, usual: 0.09, copies: 9 }, { runes: 6, low: 0.72, usual: 0.72, copies: 20 }, { runes: 8, low: 0.85, usual: 1.00, copies: 327 }],
/*ACCEPTED-CAST-END*/
};

/** The table is printed to two decimals; comparisons allow for the rounding. */
export const CAST_EPS = 0.006;

/** HEURISTIC for a cell no public list fills (fewer than 30 copies): what a 7-rune share of 12 would pay. */
const UNMEASURED_RUNES = 7;

export function acceptedCast(card: Pick<Card, 'energy' | 'power'>): { low: number; usual: number; measured: boolean } {
  const power = Math.max(0, Math.floor(Number.isFinite(card.power) ? (card.power as number) : 0));
  if (power === 0) return { low: 1, usual: 1, measured: true };
  const r = runesWhenCast(card);
  const row = ACCEPTED_CAST[Math.min(power, 3)] ?? [];
  let cell: (typeof row)[number] | undefined;
  for (const c of row) if (c.runes <= r) cell = c;
  if (cell && cell.runes !== r && cell !== row[row.length - 1]) cell = undefined;
  if (cell && cell.copies >= 30) return { low: cell.low, usual: cell.usual, measured: true };
  const p = hypergeometricAtLeast(12, UNMEASURED_RUNES, Math.min(12, r), power);
  return { low: p, usual: p, measured: false };
}

/** 0..1: the odds as a share of what public lists usually reach for a card like this. */
export function castFit(card: Pick<Card, 'energy' | 'power' | 'powerDomains' | 'domains'>, runes: readonly RuneCount[]): number {
  const usual = acceptedCast(card).usual;
  const p = payOdds(card, runes);
  return usual <= 0 ? 1 : Math.max(0, Math.min(1, (p + CAST_EPS) / usual));
}
