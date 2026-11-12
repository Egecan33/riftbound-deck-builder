// A CardDb for the win-route and line tests (plan Task 7): the committed fixture pool with mined features,
// legend profiles, the fixture's legend meta, and the pair network between the cards the six reference decks
// and the fixture meta use. Building the network for all 698 fixture cards takes minutes; the reference decks
// need only their own neighbourhood. Nothing here touches SQLite or the network.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createCardDb } from '@/engine/carddb';
import { legendProfiles } from '@/engine/features';
import { mineOverridesById, type MineOverrideEntry } from '@/engine/mine';
import { buildEdges, removedTraitsOf, type ForbiddenInteraction } from '@/engine/network';
import type { CardDb, LegendMeta } from '@/engine/types';
import { computeFeatures } from '@/ingest/features';
import { readLegalityFile, readOverridesFile, toLegalityData } from '@/server/syncdata';
import { fixtureCards, fixtureDecks, type FixtureDeck } from './fixture-db';

/** A fixture legend's card joins the network from this share of its lists. */
const NETWORK_SHARE = 0.5;

let cached: { db: CardDb; decks: FixtureDeck[] } | null = null;

export function theoryDb(): { db: CardDb; decks: FixtureDeck[] } {
  if (cached) return cached;
  const cards = fixtureCards();
  const decks = fixtureDecks();
  const meta = (JSON.parse(readFileSync(path.join(process.cwd(), 'tests', 'fixtures', 'meta.json'), 'utf8')) as { legends: LegendMeta[] }).legends;
  const file = readOverridesFile() as unknown as { mine?: MineOverrideEntry[]; forbiddenInteractions?: ForbiddenInteraction[] };
  const overrides = mineOverridesById(file.mine, cards);
  const features = computeFeatures(cards, overrides);
  const ids = new Set<string>();
  for (const d of decks) {
    for (const e of [...d.deck.main, ...d.deck.side]) ids.add(e.id);
    for (const b of d.deck.battlefields) ids.add(b);
  }
  for (const m of meta) for (const [id, stat] of Object.entries(m.main)) if (stat.share >= NETWORK_SHARE) ids.add(id);
  // Every legend stays in: which pairs can share a deck is decided by the legends of the pool.
  const nodes = cards.filter((c) => ids.has(c.id) || c.type === 'legend');
  const edges = buildEdges(nodes, { forbidden: file.forbiddenInteractions, removedTraits: removedTraitsOf(overrides) });
  const legality = toLegalityData(readLegalityFile(path.join(process.cwd(), 'sync-data')));
  const profiles = legendProfiles(createCardDb(cards, features));
  cached = { db: createCardDb(cards, features, edges, profiles, meta, legality), decks };
  return cached;
}
