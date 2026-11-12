// Energy curve and draw odds of a deck. New code; the probability itself is the ported hypergeometricAtLeast.
import type { CardDb, Deck } from '../types';
import { hypergeometricAtLeast } from './hypergeo';

export const CURVE_BUCKETS = 8; // Energy 0..6 and 7+

/** Copies per Energy bucket (index 0..7, 7 = 7 or more) over the Main Deck. Unknown ids are skipped. */
export function curveOf(deck: Deck, db: CardDb): number[] {
  const curve = new Array<number>(CURVE_BUCKETS).fill(0);
  for (const entry of deck.main) {
    const card = db.get(entry.id);
    const qty = Number.isFinite(entry.qty) ? Math.max(0, entry.qty) : 0;
    if (!card || qty === 0) continue;
    curve[Math.max(0, Math.min(CURVE_BUCKETS - 1, card.energy ?? 0))] += qty;
  }
  return curve;
}

/** Mean Energy cost of the Main Deck; 0 for an empty deck. */
export function averageEnergy(deck: Deck, db: CardDb): number {
  let cards = 0;
  let energy = 0;
  for (const entry of deck.main) {
    const card = db.get(entry.id);
    const qty = Number.isFinite(entry.qty) ? Math.max(0, entry.qty) : 0;
    if (!card || qty === 0) continue;
    cards += qty;
    energy += qty * (card.energy ?? 0);
  }
  return cards === 0 ? 0 : Math.round((energy / cards) * 100) / 100;
}

/**
 * Consistency model of docs/research/deck-theory.md section 3.3 (assumptions tied to CR 116, 117, 315.4.b):
 * opening hand 4, one draw per turn, both players draw on turn 1 in 1v1, so by your own turn T you have seen
 * 4 + T cards, plus the cards a mulligan replaced (at most 2). The library is the Main Deck without the
 * Chosen Champion (39 of 40).
 */
export const OPENING_HAND = 4;
export const cardsSeenByTurn = (turn: number, mulligan = 0): number => OPENING_HAND + Math.max(0, Math.floor(turn)) + Math.max(0, Math.min(2, Math.floor(mulligan)));

/** P(at least `required` of `copies` seen by your own turn `turn`). Sane for any input: 0 copies -> 0, empty library -> 0. */
export function seenByTurn(copies: number, turn: number, library = 39, mulligan = 0, required = 1): number {
  return hypergeometricAtLeast(library, copies, Math.min(Math.max(0, Math.floor(library)), cardsSeenByTurn(turn, mulligan)), required);
}
