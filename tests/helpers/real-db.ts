// The synced card pool (data/forge.db) as a CardDb, opened read-only. The file is gitignored, so tests
// that use it must be wrapped in `describe.skipIf(!hasRealDb())`: they run where `pnpm sync` has run.
import { existsSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { createCardDb } from '@/engine/carddb';
import type { CardDb } from '@/engine/types';
import { loadAliases, loadCards, loadLegendMeta } from '@/server/carddb';
import { readLegalityFile, readOverridesFile, toLegalityData } from '@/server/syncdata';

const FILE = process.env.RIFTBOUND_FORGE_DB ?? path.join(process.cwd(), 'data', 'forge.db');

export const hasRealDb = (): boolean => existsSync(FILE);

export interface MetaList {
  id: string; name: string; format: string; legend: string | null; champion: string | null;
  complete: boolean; banned: number;
  zones: Record<'main' | 'side' | 'runes' | 'battlefields', { id: string; qty: number }[]>;
}

let cached: { db: CardDb; lists: MetaList[] } | null = null;

function load() {
  if (cached) return cached;
  const sql = new Database(FILE, { readonly: true, fileMustExist: true });
  try {
    const cards = loadCards(sql);
    // Legality is read from the reviewed file, like the fixture db, so the tests follow sync-data/legality.json.
    const legality = { ...toLegalityData(readLegalityFile(path.join(process.cwd(), 'sync-data'))), upcomingBans: [] /* announced bans have their own test */ };
    const db = createCardDb(cards, [], [], [], loadLegendMeta(sql), legality, loadAliases(sql, cards, readOverridesFile()));
    const lists = new Map<string, MetaList>();
    const rows = sql.prepare('SELECT id, name, format, legend_id AS legend, champion_id AS champion, complete, banned FROM meta_decks ORDER BY id').all() as
      { id: string; name: string; format: string; legend: string | null; champion: string | null; complete: number; banned: number }[];
    for (const r of rows) lists.set(r.id, { ...r, complete: r.complete === 1, zones: { main: [], side: [], runes: [], battlefields: [] } });
    const cardRows = sql.prepare('SELECT deck_id AS deck, zone, card_id AS id, qty FROM meta_deck_cards ORDER BY deck_id, zone, card_id').all() as
      { deck: string; zone: keyof MetaList['zones']; id: string; qty: number }[];
    for (const c of cardRows) lists.get(c.deck)?.zones[c.zone]?.push({ id: c.id, qty: c.qty });
    cached = { db, lists: [...lists.values()] };
  } finally {
    sql.close();
  }
  return cached;
}

export const realDb = (): CardDb => load().db;
export const metaLists = (): MetaList[] => load().lists;
