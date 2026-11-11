import { mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

export type Db = Database.Database;

// turbopackIgnore: the bundler must not trace the image files under data/ into the build.
export const DATA_DIR = process.env.RIFTBOUND_FORGE_DATA ?? path.join(/* turbopackIgnore: true */ process.cwd(), 'data');
export const DEFAULT_DB_PATH = path.join(DATA_DIR, 'forge.db');
export const RAW_DIR = path.join(DATA_DIR, 'raw');
export const IMAGE_DIR = path.join(DATA_DIR, 'images');

// Tables of spec §6.2, plus two the spec does not name:
//   sync_data    the reviewed sync-data/*.json snapshots as loaded by the last sync (legality, errata, overrides)
//   meta_legends one row per legend: list count, effective sample size and quality grade of its meta rows
const SCHEMA = `
CREATE TABLE IF NOT EXISTS cards (id TEXT PRIMARY KEY, name TEXT NOT NULL, json TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS cards_name ON cards(name);
CREATE TABLE IF NOT EXISTS printings (
  id TEXT PRIMARY KEY, card_id TEXT NOT NULL, code TEXT NOT NULL, public_code TEXT NOT NULL,
  set_code TEXT NOT NULL, collector_number INTEGER NOT NULL, variant TEXT NOT NULL, rarity TEXT,
  image_url TEXT NOT NULL, width INTEGER, height INTEGER
);
CREATE INDEX IF NOT EXISTS printings_card ON printings(card_id);
CREATE INDEX IF NOT EXISTS printings_code ON printings(code);
CREATE TABLE IF NOT EXISTS card_features (id TEXT PRIMARY KEY, json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS card_edges (
  a TEXT NOT NULL, b TEXT NOT NULL, net REAL NOT NULL, json TEXT NOT NULL, PRIMARY KEY (a, b)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS card_edges_b ON card_edges(b);
CREATE TABLE IF NOT EXISTS legend_profiles (legend_id TEXT PRIMARY KEY, json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS meta_decks (
  id TEXT PRIMARY KEY, source TEXT NOT NULL, name TEXT NOT NULL,
  legend_id TEXT, champion_id TEXT, format TEXT NOT NULL,
  created_at TEXT, edited_at TEXT, views INTEGER NOT NULL DEFAULT 0, likes INTEGER NOT NULL DEFAULT 0,
  event INTEGER NOT NULL DEFAULT 0, rank TEXT, era TEXT,
  complete INTEGER NOT NULL DEFAULT 0, banned INTEGER NOT NULL DEFAULT 0, unresolved TEXT NOT NULL DEFAULT '[]',
  fetched_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS meta_decks_legend ON meta_decks(legend_id);
CREATE TABLE IF NOT EXISTS meta_deck_cards (
  deck_id TEXT NOT NULL, zone TEXT NOT NULL, card_id TEXT NOT NULL, qty INTEGER NOT NULL,
  PRIMARY KEY (deck_id, zone, card_id)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS meta_legend_cards (
  legend TEXT NOT NULL, zone TEXT NOT NULL, card TEXT NOT NULL,
  decks INTEGER NOT NULL, share REAL NOT NULL, avgCopies REAL NOT NULL, era TEXT NOT NULL,
  PRIMARY KEY (legend, zone, card)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS meta_legends (
  legend TEXT PRIMARY KEY, decks INTEGER NOT NULL, n_eff REAL NOT NULL, quality TEXT NOT NULL,
  era TEXT NOT NULL, computed_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS collection (card_id TEXT PRIMARY KEY, qty INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS decks (id TEXT PRIMARY KEY, name TEXT NOT NULL, json TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sync_state (step TEXT PRIMARY KEY, finished_at TEXT NOT NULL, info TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sync_data (key TEXT PRIMARY KEY, json TEXT NOT NULL, updated_at TEXT NOT NULL);
`;

/** Opens (and creates if needed) the SQLite database. Pass ':memory:' for tests. */
export function openDb(dbPath: string = process.env.RIFTBOUND_FORGE_DB ?? DEFAULT_DB_PATH): Db {
  if (dbPath !== ':memory:') mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.exec(SCHEMA);
  return db;
}

export function writeSyncState(db: Db, step: string, info: Record<string, unknown>): void {
  db.prepare(
    'INSERT INTO sync_state(step, finished_at, info) VALUES (?, ?, ?) ' +
      'ON CONFLICT(step) DO UPDATE SET finished_at = excluded.finished_at, info = excluded.info',
  ).run(step, new Date().toISOString(), JSON.stringify(info));
}

export function readSyncState(db: Db, step: string): { finishedAt: string; info: Record<string, unknown> } | null {
  const row = db.prepare('SELECT finished_at AS finishedAt, info FROM sync_state WHERE step = ?').get(step) as
    | { finishedAt: string; info: string }
    | undefined;
  return row ? { finishedAt: row.finishedAt, info: JSON.parse(row.info) as Record<string, unknown> } : null;
}

export function writeSyncData(db: Db, key: string, value: unknown): void {
  db.prepare(
    'INSERT INTO sync_data(key, json, updated_at) VALUES (?, ?, ?) ' +
      'ON CONFLICT(key) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at',
  ).run(key, JSON.stringify(value), new Date().toISOString());
}

export function readSyncData<T>(db: Db, key: string): T | null {
  const row = db.prepare('SELECT json FROM sync_data WHERE key = ?').get(key) as { json: string } | undefined;
  return row ? (JSON.parse(row.json) as T) : null;
}
