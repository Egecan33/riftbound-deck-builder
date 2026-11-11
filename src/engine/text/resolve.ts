// Shared line reading for deck lists and collections. Pure: no Node, no I/O.
// Cards are looked up through CardDb.byName, which keys on the rules name (docs/research/rules.md §11),
// the public code and the gameplay id, so "Kai'Sa, Survivor", "kaisa survivor" and "OGN-043/298" all resolve.
import { isToken } from '../carddb';
import type { Card, CardDb } from '../types';

export interface UnresolvedLine { line: number; text: string }

/** "OGN-43" -> "OGN-043". Prefixed numbers ("VEN-SP3", "UNL-T01", "OGN-R01") are left as written. */
export function padCode(set: string, number: string): string {
  const m = /^(\d+)([abs*]?)$/i.exec(number);
  return m ? `${set}-${m[1].padStart(3, '0')}${m[2]}` : `${set}-${number}`;
}

const CODE_IN_TEXT = /\b([A-Za-z]{2,4})-((?:SP|T|R)?\d{1,3}[abs*]?)(?:\/\d+)?(?![A-Za-z0-9])/i;
const ARENA_SUFFIX = /\(([A-Za-z]{2,4})\)\s*#?((?:SP|T|R)?\d{1,3}[abs*]?)\s*$/i; // "Card Name (OGN) 43"

/**
 * Finds the card a piece of list text means. The name is tried first, then the name without bracketed
 * parts ("Charm (OGN-043)", "Charm [foil]"), then a card code anywhere in the text.
 */
export function resolveCard(raw: string, db: CardDb): Card | undefined {
  const text = raw.trim().replace(/^["'“”]+|["'“”]+$/g, '').trim();
  if (!text) return undefined;
  const direct = db.byName(text);
  if (direct) return direct;
  const arena = ARENA_SUFFIX.exec(text);
  const bare = text.replace(ARENA_SUFFIX, '').replace(/\s*[([{][^)\]}]*[)\]}]/g, ' ').replace(/\s+/g, ' ').trim();
  if (bare && bare !== text) {
    const byBare = db.byName(bare);
    if (byBare) return byBare;
  }
  if (arena) {
    const byArena = db.byName(padCode(arena[1], arena[2]));
    if (byArena) return byArena;
  }
  const code = CODE_IN_TEXT.exec(text);
  if (code) {
    const byCode = db.byName(padCode(code[1], code[2]));
    if (byCode) return byCode;
    // "OGN-043 Charm": the code is unknown but the rest may still be a name.
    const rest = text.replace(CODE_IN_TEXT, ' ').replace(/[()[\]]/g, ' ').replace(/\s+/g, ' ').trim();
    if (rest) return db.byName(rest);
  }
  return undefined;
}

const MAX_QTY = 999;
const clampQty = (n: number): number => Math.max(0, Math.min(MAX_QTY, Math.trunc(n)));

/** Splits "3 Name", "3x Name", "3xName", "Name x3" into quantity and the rest. No quantity means 1. */
export function splitQuantity(line: string): { qty: number; text: string; explicit: boolean } {
  const text = line.replace(/^\s*(?:[-*•–]\s+)?/, '').trim();
  const lead = /^(\d{1,4})(?:\s*[x×]\s+|\s+|[x×])(.+)$/i.exec(text);
  if (lead) return { qty: clampQty(Number(lead[1])), text: lead[2].trim(), explicit: true };
  const trail = /^(.+?)\s*[x×]\s*(\d{1,4})$/i.exec(text);
  if (trail) return { qty: clampQty(Number(trail[2])), text: trail[1].trim(), explicit: true };
  return { qty: 1, text, explicit: false };
}

/** One list line -> card and quantity. A line whose leading number is part of the name still resolves. */
export function resolveLine(line: string, db: CardDb): { card: Card; qty: number } | undefined {
  const split = splitQuantity(line);
  const card = resolveCard(split.text, db);
  if (card) return { card, qty: split.qty };
  if (split.explicit) {
    const whole = resolveCard(line, db);
    if (whole) return { card: whole, qty: 1 };
  }
  return undefined;
}

export const tokenNotice = (card: Card): string =>
  `${card.name} is a token, not a deck card; it was left out.`;

export { isToken };
