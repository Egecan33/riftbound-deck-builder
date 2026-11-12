// Card databases for the scoring and rating tests (plan Task 6).
// - scoredFixtureDb(): the committed fixture with what the `features` sync step would add, computed here:
//   features for every card (no play evidence: the fixture has no lists), legend profiles, and stored edges
//   among the cards of the six reference decks (the whole pool would take minutes).
// - syntheticDb(): hand-made cards, features and edges, so one property can be tested at a time.
import { createCardDb } from '@/engine/carddb';
import { legendProfiles } from '@/engine/features';
import { buildEdges } from '@/engine/network';
import { emptyRoleCounts } from '@/engine/summary';
import type { Card, CardDb, CardEdge, CardFeatures, Deck, Domain, LegalityData, LegendMeta, Role } from '@/engine/types';
import { readLegalityFile, toLegalityData } from '@/server/syncdata';
import path from 'node:path';
import { fixtureCards, fixtureDb, fixtureDecks, type FixtureDeck } from '../../helpers/fixture-db';
import { ingestFeatures } from '../../helpers/ingest-features';

let scored: { db: CardDb; decks: FixtureDeck[] } | null = null;

export function scoredFixture(): { db: CardDb; decks: FixtureDeck[] } {
  if (scored) return scored;
  const cards = fixtureCards();
  const plain = fixtureDb();
  const decks = fixtureDecks();
  const ids = new Set<string>();
  for (const d of decks) {
    for (const e of [...d.deck.main, ...d.deck.side]) ids.add(e.id);
    for (const id of d.deck.battlefields) ids.add(id);
    if (d.deck.legend) ids.add(d.deck.legend);
  }
  const features = ingestFeatures(cards);
  const edges = buildEdges(cards.filter((c) => ids.has(c.id)));
  const legality = toLegalityData(readLegalityFile(path.join(process.cwd(), 'sync-data')));
  const meta = cards.map((c) => plain.legendMeta(c.id)).filter((m): m is LegendMeta => !!m);
  const withFeatures = createCardDb(cards, features, edges, [], meta, legality);
  const db = createCardDb(cards, features, edges, legendProfiles(withFeatures), meta, legality);
  scored = { db, decks: decks.map((d) => ({ ...d })) };
  return scored;
}

export const blankDeck = (over: Partial<Deck> = {}): Deck => ({
  id: null, name: 'test', format: 'standard-bo1', power: 'competitive', legend: null, champion: null, main: [], side: [],
  runes: {}, battlefields: [], extraLegends: [], themeWeights: null, teammate: null, ...over,
});

export function card(id: string, over: Partial<Card> = {}): Card {
  return {
    id, code: id.toUpperCase(), name: over.name ?? `Card ${id}`, shortName: over.name ?? `Card ${id}`, set: 'TST', sets: ['TST'], type: 'unit', superTypes: [],
    domains: ['fury'], noDomain: false, tags: [], championTag: null, energy: 2, power: 0, powerDomains: [], might: 2, mightBonus: null,
    printedText: '', text: '', errata: false, keywords: [], copyLimit: 3, imageUrl: '', dataIncomplete: false, ...over,
  };
}

export function features(id: string, over: Partial<CardFeatures> = {}): CardFeatures {
  return {
    id, traits: [], baseRating: 60, grade: 'B', roles: ['unit-body'], speed: 'normal', axes: {}, costBucket: 2, unparsed: [],
    evaluatedRating: 60, evidence: null, ratingReasons: ['synthetic'], ...over,
  };
}

export const edge = (a: string, b: string, value = 1.42, kind: 'synergy' | 'antisynergy' = 'synergy'): CardEdge => ({
  a, b, synergy: kind === 'synergy' ? value : 0, antisynergy: kind === 'antisynergy' ? value : 0, net: kind === 'synergy' ? value : -value,
  reasons: [{ id: `test:${a}:${b}`, kind, scope: 'mechanic-package', label: kind === 'synergy' ? 'Test package' : 'Test clash', detail: 'synthetic', value }],
});

export const LEGALITY: LegalityData = { asOf: '2026-11-12', sets: [{ code: 'TST', name: 'Test', legalFrom: '2026-01-01' }], bans: [], sideboardMax: 10 };

export interface Synthetic { db: CardDb; legend: Card; cards: Card[] }

/**
 * A Fury/Mind legend "Tester" and `n` main-deck cards t0..t(n-1): every third a spell, costs 1..6, Fury or
 * Mind, plus whatever `extra` adds. Roles: units are unit-body; spells alternate removal and card-flow.
 */
export function syntheticDb(n: number, extra: { cards?: Card[]; features?: CardFeatures[]; edges?: CardEdge[]; meta?: LegendMeta[]; legality?: LegalityData } = {}): Synthetic {
  const legend = card('legend-tester', { name: 'Tester', type: 'legend', domains: ['fury', 'mind'], championTag: 'Tester', energy: null, might: null });
  const cards: Card[] = [legend];
  const feats: CardFeatures[] = [];
  for (let i = 0; i < n; i += 1) {
    const spell = i % 3 === 2;
    const energy = 1 + (i % 6);
    const domain: Domain = i % 2 ? 'mind' : 'fury';
    const roles: Role[] = spell ? [i % 2 ? 'removal' : 'card-flow'] : ['unit-body'];
    cards.push(card(`t${i}`, { type: spell ? 'spell' : 'unit', energy, domains: [domain], might: spell ? null : energy, power: i % 5 === 0 ? 1 : 0, powerDomains: i % 5 === 0 ? [domain] : [] }));
    feats.push(features(`t${i}`, { roles, costBucket: energy, baseRating: 45 + (i % 30), evaluatedRating: 45 + (i % 30) }));
  }
  cards.push(...(extra.cards ?? []));
  const byId = new Map(feats.map((f) => [f.id, f]));
  for (const f of extra.features ?? []) byId.set(f.id, f);
  return { db: createCardDb(cards, [...byId.values()], extra.edges ?? [], [], extra.meta ?? [], extra.legality ?? LEGALITY), legend, cards };
}

export { emptyRoleCounts };
