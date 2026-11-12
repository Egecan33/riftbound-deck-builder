import { readdirSync } from 'node:fs';
import type { StatusResponse, SyncStep } from '@/app/lib/api';
import { AXES } from '@/engine/features/axes';
import { TRAIT_LABELS } from '@/engine/mine/labels';
import type { Domain } from '@/engine/types';
import { DEFAULT_SETTINGS, getSettings } from './settings';
import { cacheSlot } from './state';
import { dbPath, getCardDb, getDb, imageDir, legalityFile } from './store';
import { SYNC_STEPS, syncState } from './sync-runner';

export const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
/** Counts are re-read at most this often; a running sync changes them under us. */
const COUNT_TTL_MS = 5000;

function countImages(): number {
  try {
    let n = 0;
    for (const name of readdirSync(imageDir())) if (name.endsWith('.webp')) n++;
    return n;
  } catch {
    return 0; // no directory yet
  }
}

type Counts = StatusResponse['counts'];
const emptyCounts = (): Counts => ({ cards: 0, legends: 0, dataIncomplete: 0, errata: 0, features: 0, edges: 0, metaLists: 0, metaLegends: 0, images: 0, collection: 0, decks: 0 });

function smallCounts(): Pick<Counts, 'collection' | 'decks'> {
  const db = getDb();
  const one = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  return { collection: one('SELECT count(*) AS n FROM collection WHERE qty > 0'), decks: one('SELECT count(*) AS n FROM decks') };
}

function readCounts(): Counts {
  const slot = cacheSlot<{ at: number; counts: Counts | null }>('status-counts', () => ({ at: 0, counts: null }));
  // Decks and the collection change through this server, so they are always read fresh.
  if (slot.counts && Date.now() - slot.at < COUNT_TTL_MS) return { ...slot.counts, ...smallCounts() };
  const db = getDb();
  const one = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  const cards = db
    .prepare(
      "SELECT count(*) AS cards, coalesce(sum(json_extract(json, '$.type') = 'legend'), 0) AS legends, " +
        "coalesce(sum(json_extract(json, '$.dataIncomplete') = 1), 0) AS dataIncomplete, " +
        "coalesce(sum(json_extract(json, '$.errata') = 1), 0) AS errata FROM cards",
    )
    .get() as Pick<Counts, 'cards' | 'legends' | 'dataIncomplete' | 'errata'>;
  slot.counts = {
    ...cards,
    features: one('SELECT count(*) AS n FROM card_features'),
    edges: one('SELECT count(*) AS n FROM card_edges'),
    metaLists: one('SELECT count(*) AS n FROM meta_decks'),
    metaLegends: one('SELECT count(*) AS n FROM meta_legends'),
    images: countImages(),
    ...smallCounts(),
  };
  slot.at = Date.now();
  return slot.counts;
}

const numberOf = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** The Data page's facts. Never throws: a database that cannot be opened is reported in `error`. */
/** The basic rune card of each domain, so the UI can show a Rune Deck as images. */
function runeCards(): Partial<Record<Domain, string>> {
  return cacheSlot('rune-cards', () => {
    const out: Partial<Record<Domain, string>> = {};
    for (const card of getCardDb().all()) {
      const d = card.domains[0];
      if (card.type === 'rune' && card.domains.length === 1 && d && !out[d]) out[d] = card.id;
    }
    return out;
  });
}

export function getStatus(): StatusResponse {
  const steps = Object.fromEntries(SYNC_STEPS.map((s) => [s, null])) as StatusResponse['steps'];
  const base: StatusResponse = {
    ready: false, error: null, dbPath: dbPath(), steps, counts: emptyCounts(), imagesMissing: 0, legality: null, coverage: null,
    cardsSyncedAt: null, stale: true, settings: { ...DEFAULT_SETTINGS }, sync: syncState(),
    labels: { traits: TRAIT_LABELS, axes: AXES.map((a) => ({ id: a.id, label: a.label })), runeCards: {} },
  };
  try {
    const db = getDb();
    const rows = db.prepare('SELECT step, finished_at AS finishedAt, info FROM sync_state').all() as { step: string; finishedAt: string; info: string }[];
    for (const row of rows) {
      if (!SYNC_STEPS.includes(row.step as SyncStep)) continue;
      let info: Record<string, unknown> = {};
      try {
        const parsed: unknown = JSON.parse(row.info);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) info = parsed as Record<string, unknown>;
      } catch {
        // unreadable info is shown as none
      }
      steps[row.step as SyncStep] = { finishedAt: row.finishedAt, info };
    }
    base.counts = readCounts();
    // Tokens have rows in `cards` but no image is required for the app to work; never report a negative number.
    base.imagesMissing = Math.max(0, base.counts.cards - base.counts.images);
    base.settings = getSettings();
    const file = legalityFile();
    if (file) {
      const legality = getCardDb().legality();
      const usesStandard = base.settings.ffaUsesStandardBans ?? file.ffa.useStandardBans;
      base.legality = { ...legality, hub: file.hub ?? null, ffaUsesStandardBans: usesStandard, ffaNote: file.ffa.note ?? null };
    }
    const f = steps.features?.info;
    if (f && f.implemented === true) {
      base.coverage = {
        cards: numberOf(f.cards), noMechanic: numberOf(f.noMechanic), sentences: numberOf(f.sentences), unparsedSentences: numberOf(f.unparsedSentences),
        edges: numberOf(f.edges), playLists: numberOf(f.playLists), cardsWithEvidence: numberOf(f.cardsWithEvidence),
      };
    }
    base.cardsSyncedAt = steps.cards?.finishedAt ?? null;
    const age = base.cardsSyncedAt ? Date.now() - Date.parse(base.cardsSyncedAt) : Number.POSITIVE_INFINITY;
    base.stale = !(age < STALE_AFTER_MS);
    base.ready = base.counts.cards > 0 && base.counts.features > 0;
    if (base.ready) base.labels.runeCards = runeCards();
  } catch (err) {
    base.error = err instanceof Error ? err.message : String(err);
  }
  return base;
}
