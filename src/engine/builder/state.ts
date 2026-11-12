// Shared pieces of the builder (spec 13): deck edits, the legal pool, copy room, the precise rating. Pure.
import { ILLEGAL_CAP, rateDeck } from '../rating';
import { copyLimit } from '../rules/copies';
import { isSignature } from '../rules/champion';
import { MAIN_MIN, SIGNATURE_MAX, formatRules } from '../rules/formats';
import { legendOf } from '../rules/identity';
import { cardFitsDeck } from '../rules/validate';
import { featuresFor, qtyOf } from '../summary';
import { detectWinRoutes } from '../wincons';
import type { BuildOptions, Card, CardDb, Deck, DeckEntry, DeckRating, EngineContext, Zone } from '../types';

export type MainType = 'unit' | 'spell' | 'gear';
export const isMainType = (card: Card): card is Card & { type: MainType } => card.type === 'unit' || card.type === 'spell' || card.type === 'gear';

/** Why a card is in a built deck. Every pick the builder makes carries one (AGENTS.md rule 4). */
export interface BuildPick { zone: Zone; id: string; qty: number; phase: string; reason: string }

export const total = (entries: readonly DeckEntry[]): number => entries.reduce((n, e) => n + qtyOf(e), 0);
export const qtyIn = (entries: readonly DeckEntry[], id: string): number => entries.reduce((n, e) => n + (e.id === id ? qtyOf(e) : 0), 0);

/** The deck with `delta` copies of `id` added to (or taken from) a zone. An entry that reaches 0 is removed. */
export function withCopies(deck: Deck, zone: 'main' | 'side', id: string, delta: number, locked = false): Deck {
  const list = zone === 'main' ? deck.main : deck.side;
  let found = false;
  const next: DeckEntry[] = [];
  for (const entry of list) {
    if (entry.id !== id || found) { next.push(entry); continue; }
    found = true;
    const qty = qtyOf(entry) + delta;
    if (qty > 0) next.push({ ...entry, qty, locked: entry.locked || locked });
  }
  if (!found && delta > 0) next.push({ id, qty: delta, locked });
  return zone === 'main' ? { ...deck, main: next } : { ...deck, side: next };
}

/** Cards of the pool that may go into a zone of this deck (legend, format, bans, identity, signature tag, complete data). */
export function legalPool(deck: Deck, db: CardDb, zone: 'main' | 'side' | 'battlefields'): Card[] {
  const out: Card[] = [];
  for (const card of db.all()) {
    if (zone === 'battlefields' ? card.type !== 'battlefield' : !isMainType(card)) continue;
    if (cardFitsDeck(card, zone, deck, db) === null) out.push(card);
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

/** Copies of a card the user may still add: the copy limit over main and side together, and the collection when `ownedOnly`. */
export function roomFor(card: Card, deck: Deck, opts: BuildOptions): number {
  const held = qtyIn(deck.main, card.id) + qtyIn(deck.side, card.id);
  const limit = copyLimit(card);
  let room = (Number.isFinite(limit) ? limit : MAIN_MIN) - held;
  if (opts.ownedOnly) room = Math.min(room, Math.max(0, Math.floor(opts.owned?.[card.id] ?? 0)) - held);
  return Math.max(0, room);
}

export const ownedEnough = (id: string, opts: BuildOptions, need = 1): boolean => !opts.ownedOnly || Math.floor(opts.owned?.[id] ?? 0) >= need;

export function signatureCopies(deck: Deck, db: CardDb): number {
  let n = 0;
  for (const e of deck.main) { const c = db.get(e.id); if (c && isSignature(c)) n += qtyOf(e); }
  return n;
}
export const signatureRoom = (deck: Deck, db: CardDb): number => Math.max(0, SIGNATURE_MAX - signatureCopies(deck, db));

/** Main-deck size the builder fills to: 40 in every format (exactly 40 where the Tournament Rules apply, the minimum elsewhere). */
export const mainSizeOf = (deck: Deck, db: CardDb): number => formatRules(deck.format, db.legality()).mainExact ?? MAIN_MIN;

export interface Rated { precise: number; rating: DeckRating }

/**
 * The deck rating with the Task 7 win report, and its value before rounding: the sum of weight x sub-score.
 * One swapped copy rarely moves the whole-number rating, so swaps are compared on this value (one decimal
 * in a proposal). A deck with a rule violation is capped like the rating itself.
 */
export function rate(deck: Deck, ctx: EngineContext): Rated {
  const rating = rateDeck(deck, ctx, { win: detectWinRoutes(deck, ctx) });
  const raw = rating.subscores.reduce((n, s) => n + s.weight * s.value, 0) / 100;
  const capped = rating.rating < Math.round(raw) ? Math.min(ILLEGAL_CAP, raw) : raw;
  return { precise: Number.isFinite(capped) ? Math.round(capped * 10) / 10 : 0, rating };
}

export const nameOf = (db: CardDb, id: string): string => db.get(id)?.name ?? id;
export const ratingOf = (db: CardDb, card: Card): number => featuresFor(db, card).evaluatedRating;
export const netOf = (db: CardDb, a: string, b: string): number => (a === b ? 0 : db.edge(a, b)?.net ?? 0);
export const hasLegend = (deck: Deck, db: CardDb): boolean => legendOf(deck, db) !== null;
