// Copy limits (CR 103.3.b, 825.3.a; docs/research/rules.md §4). Pure.
import type { Card } from '../types';

const ANY_NUMBER = /your deck can have any number of cards named/i;
const UNIQUE_REMINDER = /your deck can have only 1 card with this name/i;

/**
 * Copies of this name a deck may hold, main and side deck together (TR 403.3, 601.1.c.3):
 * Infinity when card text lifts the limit (Spiderling; card text beats rules text, CR 002),
 * 1 for Unique (CR 825.3.a), otherwise the synced value (3, CR 103.3.b).
 * The synced `copyLimit` is the source; the text and keyword are a cross-check for rows where it was not derived.
 */
export function copyLimit(card: Card): number {
  if (!Number.isFinite(card.copyLimit) || ANY_NUMBER.test(card.text)) return Infinity;
  if (card.copyLimit === 1 || card.keywords.some((k) => k.toLowerCase() === 'unique') || UNIQUE_REMINDER.test(card.text)) return 1;
  return card.copyLimit > 0 ? card.copyLimit : 3;
}

export const isUnique = (card: Card): boolean => copyLimit(card) === 1;
