// The committed test fixture as a CardDb. Engine tests use this; nothing here touches SQLite or the network.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { createCardDb, reviveCard, type StoredCard } from '@/engine/carddb';
import type { Card, CardDb, Deck, DeckEntry, Domain, LegendMeta } from '@/engine/types';
import { readLegalityFile, toLegalityData } from '@/server/syncdata';

const DIR = path.join(process.cwd(), 'tests', 'fixtures');
const readJson = <T>(file: string): T => JSON.parse(readFileSync(path.join(DIR, file), 'utf8')) as T;

interface CardsFixture { cards: StoredCard[]; aliases: Record<string, string> }
interface MetaFixture { era: string | null; legends: LegendMeta[] }

let cached: { cards: Card[]; meta: LegendMeta[]; db: CardDb } | null = null;

function load() {
  if (!cached) {
    const file = readJson<CardsFixture>('cards.json');
    const cards = file.cards.map(reviveCard);
    const meta = readJson<MetaFixture>('meta.json').legends;
    // Legality comes from the reviewed sync-data file itself, so tests follow the real ban list.
    const legality = { ...toLegalityData(readLegalityFile(path.join(process.cwd(), 'sync-data'))), upcomingBans: [] /* announced bans have their own test */ };
    cached = { cards, meta, db: createCardDb(cards, [], [], [], meta, legality, file.aliases) };
  }
  return cached;
}

export const fixtureCards = (): Card[] => load().cards;

export interface FixtureDeck {
  file: string;
  deck: Deck;
  legend: string;
  unresolved: string[];
  mainCount: number;   // with the Chosen Champion
  sideCount: number;
  runeCount: number;
  battlefields: string[];
}

const SECTIONS = ['legend', 'champion', 'main', 'battlefields', 'runes', 'sideboard'] as const;
type Section = (typeof SECTIONS)[number];

/** Reads one tests/fixtures/decks/*.txt file. A small reader for the fixture format only; the real importer is plan Task 9. */
export function readFixtureDeck(file: string, db: CardDb = fixtureDb()): FixtureDeck {
  const zones: Record<Section, Map<string, number>> = { legend: new Map(), champion: new Map(), main: new Map(), battlefields: new Map(), runes: new Map(), sideboard: new Map() };
  const unresolved: string[] = [];
  let section: Section | null = null;
  for (const raw of readFileSync(path.join(DIR, 'decks', file), 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const head = /^([A-Za-z]+):$/.exec(line)?.[1]?.toLowerCase();
    if (head && (SECTIONS as readonly string[]).includes(head)) { section = head as Section; continue; }
    const m = /^(\d+)\s+(.+)$/.exec(line);
    const card = m ? db.byName(m[2]) : undefined;
    if (!m || !card || !section) { unresolved.push(line); continue; }
    zones[section].set(card.id, (zones[section].get(card.id) ?? 0) + Number(m[1]));
  }
  const entries = (z: Map<string, number>): DeckEntry[] => [...z.entries()].map(([id, qty]) => ({ id, qty, locked: false }));
  const legend = [...zones.legend.keys()][0] ?? '';
  const champion = [...zones.champion.keys()][0] ?? null;
  const main = new Map(zones.main);
  if (champion) main.set(champion, (main.get(champion) ?? 0) + 1); // the Chosen Champion is counted inside `main`
  const runes: Partial<Record<Domain, number>> = {};
  for (const [id, qty] of zones.runes) {
    const domain = db.get(id)?.domains[0];
    if (domain) runes[domain] = (runes[domain] ?? 0) + qty;
  }
  const deck: Deck = {
    id: null, name: file.replace(/\.txt$/, ''), format: 'standard-bo3', power: 'competitive',
    legend: legend || null, champion, main: entries(main), side: entries(zones.sideboard),
    runes, battlefields: [...zones.battlefields.keys()], extraLegends: [], themeWeights: null, teammate: null,
  };
  const total = (list: DeckEntry[]) => list.reduce((n, e) => n + e.qty, 0);
  return {
    file, deck, legend, unresolved,
    mainCount: total(deck.main), sideCount: total(deck.side),
    runeCount: Object.values(runes).reduce((a, b) => a + (b ?? 0), 0), battlefields: deck.battlefields,
  };
}

export const fixtureDeckFiles = (): string[] => readdirSync(path.join(DIR, 'decks')).filter((f) => f.endsWith('.txt')).sort();
export const fixtureDecks = (): FixtureDeck[] => fixtureDeckFiles().map((f) => readFixtureDeck(f));

/** CardDb over tests/fixtures/cards.json and meta.json, with the legality of sync-data/legality.json. */
export function fixtureDb(): CardDb {
  return load().db;
}
fixtureDb.extras = (): { metaLegends: string[]; decks: FixtureDeck[] } => ({ metaLegends: load().meta.map((m) => m.legendId), decks: fixtureDecks() });
