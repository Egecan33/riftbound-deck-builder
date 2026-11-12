import path from 'node:path';
import type { CardDb } from '@/engine/types';
import { invalidateCardDb, loadCardDb } from './carddb';
import { DEFAULT_DB_PATH, IMAGE_DIR, openDb, readSyncData, type Db } from './db';
import { cacheSlot, dropCaches, serverState } from './state';
import { readLegalityFile, toLegalityData, type LegalityFile } from './syncdata';

/** Path of the SQLite file, read from the environment on every call (tests and the desktop build point it elsewhere). */
export const dbPath = (): string => process.env.RIFTBOUND_FORGE_DB ?? DEFAULT_DB_PATH;

/** Directory of the card images (`{cardId}.webp`); follows RIFTBOUND_FORGE_DATA when it is set after start-up. */
export const imageDir = (): string =>
  process.env.RIFTBOUND_FORGE_DATA ? path.join(/* turbopackIgnore: true */ process.env.RIFTBOUND_FORGE_DATA, 'images') : IMAGE_DIR;

/** The one open database handle of this process. Creates an empty database on first run. */
export function getDb(): Db {
  const s = serverState();
  return (s.db ??= openDb(dbPath()));
}

/** The legality snapshot as synced (the reviewed file itself before the first `legality` sync). */
export function legalityFile(): LegalityFile | null {
  return cacheSlot('legality-file', () => {
    try {
      return readSyncData<LegalityFile>(getDb(), 'legality') ?? readLegalityFile();
    } catch {
      return null;
    }
  });
}

/** `settings.ffaUsesStandardBans` as stored, without going through settings.ts (which reads the card db). */
function ffaOverride(): boolean | null {
  return cacheSlot<{ value: boolean | null }>('ffa-override', () => {
    try {
      const row = getDb().prepare("SELECT json FROM settings WHERE key = 'ffaUsesStandardBans'").get() as { json: string } | undefined;
      const value: unknown = row ? JSON.parse(row.json) : null;
      return { value: typeof value === 'boolean' ? value : null };
    } catch {
      return { value: null };
    }
  }).value;
}

/**
 * The in-memory card database (about 0.2 s to load, then cached). When the user has switched the
 * free-for-all ban heuristic away from the snapshot's own value, the same data is served with that
 * legality view; the wrapper keeps its identity until the caches are dropped.
 */
export function getCardDb(): CardDb {
  const base = loadCardDb(getDb());
  const file = legalityFile();
  const ffa = ffaOverride();
  if (!file || ffa === null || ffa === file.ffa.useStandardBans) return base;
  const slot = cacheSlot<{ base: CardDb | null; ffa: boolean; value: CardDb | null }>('carddb-ffa', () => ({ base: null, ffa, value: null }));
  if (slot.base !== base || slot.ffa !== ffa || !slot.value) {
    const legality = toLegalityData(file, { ffaUsesStandardBans: ffa });
    slot.base = base;
    slot.ffa = ffa;
    slot.value = { ...base, legality: () => legality };
  }
  return slot.value;
}

/** Call after card data changed on disk (a sync step finished): everything derived is rebuilt on demand. */
export function onCardDataChanged(): void {
  invalidateCardDb();
  dropCaches();
}
