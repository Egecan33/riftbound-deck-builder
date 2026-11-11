import { createCardDb, reviveCard, type StoredCard } from '@/engine/carddb';
import { nameKey } from '@/engine/rules/names';
import type { Card, CardDb, CardEdge, CardFeatures, LegalityData, LegendMeta, LegendProfile } from '@/engine/types';
import { readSyncData, type Db } from './db';
import { readLegalityFile, readOverridesFile, toLegalityData, type LegalityFile, type OverridesFile } from './syncdata';

// On globalThis so that separately bundled route handlers share one copy.
const KEY = '__riftboundForgeCardDb';
const holder = globalThis as unknown as Record<string, { db: Db; value: CardDb } | null | undefined>;

const rows = <T>(db: Db, sql: string): T[] => db.prepare(sql).all() as T[];

export function loadCards(db: Db): Card[] {
  return rows<{ json: string }>(db, 'SELECT json FROM cards').map((r) => reviveCard(JSON.parse(r.json) as StoredCard));
}

/** Lookup aliases: every printing code and id, plus the reviewed alternative names of card-overrides.json. */
export function loadAliases(db: Db, cards: readonly Card[], overrides: OverridesFile | null): Record<string, string> {
  const aliases: Record<string, string> = {};
  for (const p of rows<{ id: string; code: string; cardId: string }>(db, 'SELECT id, code, card_id AS cardId FROM printings')) {
    aliases[p.code] = p.cardId;
    aliases[p.id] = p.cardId;
  }
  const byName = new Map(cards.map((c) => [nameKey(c.name), c.id]));
  for (const a of overrides?.aliases ?? []) {
    const id = byName.get(nameKey(a.name));
    if (id) aliases[a.alias] = id;
  }
  return aliases;
}

export function loadLegendMeta(db: Db): LegendMeta[] {
  const out = new Map<string, LegendMeta>();
  for (const l of rows<{ legend: string; decks: number; quality: LegendMeta['quality'] }>(db, 'SELECT legend, decks, quality FROM meta_legends')) {
    out.set(l.legend, { legendId: l.legend, decks: l.decks, quality: l.quality, main: {}, side: {}, battlefields: {}, champions: {}, runeSplits: {} });
  }
  const stats = rows<{ legend: string; zone: string; card: string; decks: number; share: number; avgCopies: number }>(
    db, 'SELECT legend, zone, card, decks, share, avgCopies FROM meta_legend_cards',
  );
  for (const s of stats) {
    const m = out.get(s.legend);
    if (!m) continue;
    const stat = { decks: s.decks, share: s.share, avgCopies: s.avgCopies };
    if (s.zone === 'main') m.main[s.card] = stat;
    else if (s.zone === 'side') m.side[s.card] = stat;
    else if (s.zone === 'battlefields') m.battlefields[s.card] = stat;
    else if (s.zone === 'champion') m.champions[s.card] = s.share;
    else if (s.zone === 'runes') m.runeSplits[s.card] = s.share;
  }
  return [...out.values()];
}

/** Legality as loaded by the last `legality` sync step; the reviewed file itself when the step has not run. */
export function loadLegality(db: Db): LegalityData {
  const file = readSyncData<LegalityFile>(db, 'legality') ?? readLegalityFile();
  return toLegalityData(file);
}

/** Builds the in-memory CardDb from SQLite. Cached per database handle until `invalidateCardDb()`. */
export function loadCardDb(db: Db): CardDb {
  const cache = holder[KEY];
  if (cache && cache.db === db) return cache.value;

  const cards = loadCards(db);
  const features = rows<{ json: string }>(db, 'SELECT json FROM card_features').map((r) => JSON.parse(r.json) as CardFeatures);
  const edges = rows<{ json: string }>(db, 'SELECT json FROM card_edges').map((r) => JSON.parse(r.json) as CardEdge);
  const profiles = rows<{ json: string }>(db, 'SELECT json FROM legend_profiles').map((r) => JSON.parse(r.json) as LegendProfile);
  let overrides = readSyncData<OverridesFile>(db, 'overrides');
  if (!overrides) {
    try { overrides = readOverridesFile(); } catch { overrides = null; }
  }
  const value = createCardDb(cards, features, edges, profiles, loadLegendMeta(db), loadLegality(db), loadAliases(db, cards, overrides));
  holder[KEY] = { db, value };
  return value;
}

export function invalidateCardDb(): void {
  holder[KEY] = null;
}
