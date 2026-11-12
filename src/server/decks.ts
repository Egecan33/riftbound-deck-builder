import { createHash, randomUUID } from 'node:crypto';
import type { DeckTile } from '@/app/lib/api';
import { rate } from '@/engine/builder';
import { summarizeDeck } from '@/engine/summary';
import type { CardDb, Deck, DeckEntry, Domain, Format, PowerTarget } from '@/engine/types';
import { clientCard } from './cards';
import { HttpError, isObject } from './http';
import { DEFAULT_SETTINGS, FORMATS, POWERS } from './settings';
import { cacheSlot } from './state';
import { getCardDb, getDb } from './store';

export const MAX_NAME = 200;
export const MAX_ENTRIES = 500;
export const MAX_QTY = 99;
export const MAX_BATTLEFIELDS = 12;
export const MAX_EXTRA_LEGENDS = 6;
const DOMAINS: readonly Domain[] = ['fury', 'calm', 'mind', 'body', 'chaos', 'order'];
const ID = /^[A-Za-z0-9_-]{1,64}$/;
/** Card ids are short lower-case codes; anything else cannot be in the data and only bloats the deck. */
const MAX_CARD_ID = 80;

const cardId = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 && v.length <= MAX_CARD_ID ? v : null);

/**
 * Turns request data into a `Deck`. Shapes that cannot be a deck are a 400; small faults are repaired
 * (quantities floored, entries without a positive quantity dropped, duplicates merged, weights clamped
 * to 0..1) so the engine always gets clean input. Whether the deck is legal is the validator's job:
 * unknown card ids, too many copies and a wrong format all pass through here and are reported there.
 */
export function sanitizeDeck(input: unknown): Deck {
  if (!isObject(input)) throw new HttpError(400, 'deck must be an object.');
  const bad = (what: string): never => {
    throw new HttpError(400, `deck.${what}`);
  };

  const name = typeof input.name === 'string' && input.name.trim() ? input.name.trim().slice(0, MAX_NAME) : 'Untitled deck';
  const id = typeof input.id === 'string' && ID.test(input.id) ? input.id : null;

  const formatRaw = input.format ?? DEFAULT_SETTINGS.defaultFormat;
  if (!FORMATS.includes(formatRaw as Format)) bad(`format must be one of ${FORMATS.join(', ')}.`);
  const powerRaw = input.power ?? DEFAULT_SETTINGS.defaultPower;
  if (!POWERS.includes(powerRaw as PowerTarget)) bad(`power must be one of ${POWERS.join(', ')}.`);

  const entries = (raw: unknown, zone: string): DeckEntry[] => {
    if (raw === undefined || raw === null) return [];
    if (!Array.isArray(raw)) return bad(`${zone} must be a list.`);
    if (raw.length > MAX_ENTRIES) return bad(`${zone} can hold at most ${MAX_ENTRIES} entries.`);
    const merged = new Map<string, DeckEntry>();
    for (const e of raw as unknown[]) {
      const eid = isObject(e) ? cardId(e.id) : null;
      if (!isObject(e) || !eid) return bad(`${zone} entries need a card id.`);
      const qty = Math.min(MAX_QTY, Math.floor(Number(e.qty ?? 1)));
      if (!Number.isFinite(qty) || qty < 1) continue;
      const prev = merged.get(eid);
      if (prev) {
        prev.qty = Math.min(MAX_QTY, prev.qty + qty);
        prev.locked = prev.locked || e.locked === true;
      } else {
        merged.set(eid, { id: eid, qty, locked: e.locked === true });
      }
    }
    return [...merged.values()];
  };
  const idList = (raw: unknown, what: string, max: number): string[] => {
    if (raw === undefined || raw === null) return [];
    if (!Array.isArray(raw) || raw.some((v) => !cardId(v))) return bad(`${what} must be a list of card ids.`);
    if (raw.length > max) return bad(`${what} can hold at most ${max} cards.`);
    return [...(raw as string[])];
  };

  const runes: Deck['runes'] = {};
  if (input.runes !== undefined && input.runes !== null) {
    if (!isObject(input.runes)) bad('runes must be an object of domain -> count.');
    for (const [domain, n] of Object.entries(input.runes as Record<string, unknown>)) {
      const count = Math.min(MAX_QTY, Math.floor(Number(n)));
      if (DOMAINS.includes(domain as Domain) && Number.isFinite(count) && count > 0) runes[domain as Domain] = count;
    }
  }

  let themeWeights: Deck['themeWeights'] = null;
  if (input.themeWeights !== null && input.themeWeights !== undefined) {
    if (!isObject(input.themeWeights)) bad('themeWeights must be an object or null.');
    themeWeights = {};
    for (const [axis, w] of Object.entries(input.themeWeights as Record<string, unknown>)) {
      if (axis.length <= 64 && typeof w === 'number' && Number.isFinite(w)) themeWeights[axis] = Math.min(1, Math.max(0, w));
    }
  }

  let teammate: Deck['teammate'] = null;
  if (input.teammate !== null && input.teammate !== undefined) {
    if (!isObject(input.teammate)) bad('teammate must be an object or null.');
    const t = input.teammate as Record<string, unknown>;
    teammate = { legend: cardId(t.legend), battlefields: idList(t.battlefields, 'teammate.battlefields', MAX_BATTLEFIELDS) };
  }

  return {
    id, name, format: formatRaw as Format, power: powerRaw as PowerTarget,
    legend: cardId(input.legend), champion: cardId(input.champion),
    main: entries(input.main, 'main'), side: entries(input.side, 'side'),
    runes, battlefields: idList(input.battlefields, 'battlefields', MAX_BATTLEFIELDS),
    extraLegends: idList(input.extraLegends, 'extraLegends', MAX_EXTRA_LEGENDS),
    themeWeights, teammate,
  };
}

const sortedPairs = (o: Record<string, number | undefined> | null): [string, number | undefined][] | null =>
  o ? Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)) : null;

/**
 * Identity of a deck for the engine: everything it reads (zones, quantities, locks, format, power,
 * themes, teammate), nothing it does not (name, id). Entry order is part of it: the engine breaks ties
 * in deck order.
 */
export function deckKey(deck: Deck): string {
  const zone = (list: DeckEntry[]) => list.map((e) => [e.id, e.qty, e.locked ? 1 : 0]);
  const shape = [
    deck.format, deck.power, deck.legend, deck.champion, zone(deck.main), zone(deck.side), sortedPairs(deck.runes),
    deck.battlefields, deck.extraLegends, sortedPairs(deck.themeWeights), deck.teammate ? [deck.teammate.legend, deck.teammate.battlefields] : null,
  ];
  return createHash('sha1').update(JSON.stringify(shape)).digest('hex');
}

interface Row { id: string; name: string; json: string; updated_at: string }

const readRow = (row: Row): Deck => ({ ...sanitizeDeck(JSON.parse(row.json)), id: row.id, name: row.name });

export function getDeck(id: string): { deck: Deck; updatedAt: string } | null {
  const row = getDb().prepare('SELECT id, name, json, updated_at FROM decks WHERE id = ?').get(id) as Row | undefined;
  if (!row) return null;
  try {
    return { deck: readRow(row), updatedAt: row.updated_at };
  } catch {
    return null;
  }
}

/** Saves a deck: as a new one (fresh id) when `id` is omitted, else over the deck with that id. */
export function saveDeck(deck: Deck, id?: string): { deck: Deck; updatedAt: string } | null {
  const db = getDb();
  const updatedAt = new Date().toISOString();
  if (id === undefined) {
    const saved: Deck = { ...deck, id: randomUUID() };
    db.prepare('INSERT INTO decks(id, name, json, updated_at) VALUES (?, ?, ?, ?)').run(saved.id, saved.name, JSON.stringify(saved), updatedAt);
    return { deck: saved, updatedAt };
  }
  const saved: Deck = { ...deck, id };
  const res = db.prepare('UPDATE decks SET name = ?, json = ?, updated_at = ? WHERE id = ?').run(saved.name, JSON.stringify(saved), updatedAt, id);
  return res.changes > 0 ? { deck: saved, updatedAt } : null;
}

export function deleteDeck(id: string): boolean {
  return getDb().prepare('DELETE FROM decks WHERE id = ?').run(id).changes > 0;
}

type TileNumbers = Pick<DeckTile, 'mainCount' | 'sideCount' | 'runeCount' | 'battlefieldCount' | 'rating' | 'legal' | 'complete'>;

/** Saved decks, newest first, with what a tile shows. Ratings are computed once per deck version. */
export function listDecks(): DeckTile[] {
  const rows = getDb().prepare('SELECT id, name, json, updated_at FROM decks ORDER BY updated_at DESC, id').all() as Row[];
  const db = getCardDb();
  // Rated outside the analysis cache, so that listing decks never evicts the deck being edited.
  const held = cacheSlot<{ db: CardDb | null; numbers: Map<string, TileNumbers> }>('deck-tiles', () => ({ db: null, numbers: new Map() }));
  if (held.db !== db) {
    held.db = db;
    held.numbers.clear();
  }
  const tiles: DeckTile[] = [];
  const live = new Set<string>();
  for (const row of rows) {
    let deck: Deck;
    try {
      deck = readRow(row);
    } catch {
      continue; // a row that is not a deck is not listed
    }
    const key = deckKey(deck);
    live.add(key);
    let n = held.numbers.get(key);
    if (!n) {
      const { rating } = rate(deck, { db, opponentLegend: null });
      const summary = summarizeDeck(deck, db);
      n = {
        mainCount: summary.mainCount, sideCount: summary.sideCount, runeCount: summary.runeCount, battlefieldCount: deck.battlefields.length,
        rating: rating.rating, legal: rating.legal, complete: rating.complete,
      };
      held.numbers.set(key, n);
    }
    const legend = deck.legend ? db.get(deck.legend) : undefined;
    const champion = deck.champion ? db.get(deck.champion) : undefined;
    tiles.push({
      id: row.id, name: row.name, updatedAt: row.updated_at, format: deck.format, power: deck.power,
      legend: legend ? clientCard(legend, db) : null, champion: champion ? clientCard(champion, db) : null, ...n,
    });
  }
  for (const key of held.numbers.keys()) if (!live.has(key)) held.numbers.delete(key);
  return tiles;
}
