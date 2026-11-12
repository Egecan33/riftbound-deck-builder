// A SQLite database filled from the committed fixtures the way `pnpm sync` fills the real one.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { StoredCard } from '@/engine/carddb';
import type { LegendMeta, MetaCardStat } from '@/engine/types';
import { syncFeatures } from '@/ingest/features';
import { invalidateCardDb } from '@/server/carddb';
import { openDb, writeSyncData, writeSyncState, type Db } from '@/server/db';
import { resetServerState } from '@/server/state';
import { readLegalityFile } from '@/server/syncdata';

const FIXTURES = path.join(process.cwd(), 'tests', 'fixtures');
const readJson = <T>(file: string): T => JSON.parse(readFileSync(path.join(FIXTURES, file), 'utf8')) as T;

export function seedDb(dbPath = ':memory:'): Db {
  const db = openDb(dbPath);
  const { cards, aliases } = readJson<{ cards: StoredCard[]; aliases: Record<string, string> }>('cards.json');
  const meta = readJson<{ era: string | null; legends: LegendMeta[] }>('meta.json');
  const era = meta.era ?? 'fixture';
  db.transaction(() => {
    const insCard = db.prepare('INSERT INTO cards(id, name, json) VALUES (?, ?, ?)');
    for (const c of cards) insCard.run(c.id, c.name, JSON.stringify(c));
    // The fixture keeps printings as alias -> card id; that is all the server reads from the table.
    const insPrinting = db.prepare(
      "INSERT OR IGNORE INTO printings(id, card_id, code, public_code, set_code, collector_number, variant, rarity, image_url) VALUES (?, ?, ?, ?, ?, 0, 'fixture', NULL, '')",
    );
    for (const [alias, cardId] of Object.entries(aliases)) insPrinting.run(`fixture:${alias}`, cardId, alias, alias, alias.split('-')[0] ?? '');
    const insLegend = db.prepare('INSERT INTO meta_legends(legend, decks, n_eff, quality, era, computed_at) VALUES (?, ?, ?, ?, ?, ?)');
    const insStat = db.prepare('INSERT INTO meta_legend_cards(legend, zone, card, decks, share, avgCopies, era) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const l of meta.legends) {
      insLegend.run(l.legendId, l.decks, l.decks, l.quality, era, '2026-11-12T00:00:00.000Z');
      const stats = (zone: string, rows: Record<string, MetaCardStat>) => {
        for (const [card, s] of Object.entries(rows)) insStat.run(l.legendId, zone, card, s.decks, s.share, s.avgCopies, era);
      };
      stats('main', l.main);
      stats('side', l.side);
      stats('battlefields', l.battlefields);
      for (const [card, share] of Object.entries(l.champions)) insStat.run(l.legendId, 'champion', card, Math.round(share * l.decks), share, 1, era);
      for (const [split, share] of Object.entries(l.runeSplits)) insStat.run(l.legendId, 'runes', split, Math.round(share * l.decks), share, 1, era);
    }
  })();
  writeSyncData(db, 'legality', readLegalityFile(path.join(process.cwd(), 'sync-data')));
  writeSyncState(db, 'cards', { cards: cards.length });
  syncFeatures(db, () => undefined);
  return db;
}

/** Points the server layer at `db` (or at nothing) and forgets every cache. */
export function useServerDb(db: Db | null): void {
  invalidateCardDb();
  resetServerState(db);
}
