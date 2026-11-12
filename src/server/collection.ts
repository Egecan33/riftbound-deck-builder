import type { CollectionImportResponse, CollectionResponse } from '@/app/lib/api';
import { parseCollection } from '@/engine/text';
import { cardLookup } from './cards';
import { HttpError, isObject, type Body } from './http';
import { cacheSlot, serverState } from './state';
import { getCardDb, getDb } from './store';

export const MAX_COLLECTION_TEXT = 2_000_000;
export const MAX_OWNED = 9999;

/** Copies owned by card id. The object keeps its identity until the collection is written. */
export function getOwned(): Record<string, number> {
  return cacheSlot('collection', () => {
    const out: Record<string, number> = {};
    for (const row of getDb().prepare('SELECT card_id AS id, qty FROM collection').all() as { id: string; qty: number }[]) if (row.qty > 0) out[row.id] = row.qty;
    return out;
  });
}

export function collectionResponse(): CollectionResponse {
  const owned = getOwned();
  const ids = Object.keys(owned);
  return { owned, unique: ids.length, total: ids.reduce((n, id) => n + owned[id], 0), cards: cardLookup(ids) };
}

function write(counts: Record<string, number>, replace: boolean): void {
  const db = getDb();
  const put = db.prepare('INSERT INTO collection(card_id, qty) VALUES (?, ?) ON CONFLICT(card_id) DO UPDATE SET qty = excluded.qty');
  const del = db.prepare('DELETE FROM collection WHERE card_id = ?');
  db.transaction(() => {
    if (replace) db.exec('DELETE FROM collection');
    for (const [id, qty] of Object.entries(counts)) {
      if (qty > 0) put.run(id, Math.min(MAX_OWNED, qty));
      else del.run(id);
    }
  })();
  serverState().caches.delete('collection');
}

/**
 * POST /api/collection. `text` (a pasted list or CSV) or `owned` (counts by card id); mode 'replace'
 * (default) or 'merge'. Merging a text adds its copies to what is there; merging counts sets those cards
 * (0 removes one). Lines that name no card are returned in `unresolved`, never dropped silently.
 */
export function saveCollection(body: Body): CollectionImportResponse {
  const mode = body.mode ?? 'replace';
  if (mode !== 'replace' && mode !== 'merge') throw new HttpError(400, 'mode must be replace or merge.');
  const db = getCardDb();
  if (typeof body.text === 'string') {
    if (body.text.length > MAX_COLLECTION_TEXT) throw new HttpError(413, 'The collection text is too large.');
    const parsed = parseCollection(body.text, db);
    const counts = { ...parsed.owned };
    if (mode === 'merge') {
      const held = getOwned();
      for (const id of Object.keys(counts)) counts[id] += held[id] ?? 0;
    }
    write(counts, mode === 'replace');
    return { ...collectionResponse(), unresolved: parsed.unresolved, notices: parsed.notices, format: parsed.format, columns: parsed.columns };
  }
  if (isObject(body.owned)) {
    const counts: Record<string, number> = {};
    const unresolved: { line: number; text: string }[] = [];
    Object.entries(body.owned).forEach(([id, raw], i) => {
      const qty = Math.floor(Number(raw));
      const card = db.get(id);
      if (!card || card.superTypes.includes('token') || !Number.isFinite(qty) || qty < 0) unresolved.push({ line: i + 1, text: `${id}: ${String(raw)}` });
      else counts[id] = qty;
    });
    write(counts, mode === 'replace');
    return { ...collectionResponse(), unresolved, notices: [], format: 'counts', columns: null };
  }
  throw new HttpError(400, 'Send `text` (a list or CSV) or `owned` (counts by card id).');
}
