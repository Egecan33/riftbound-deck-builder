// The `features` step with stored public lists: play evidence on card_features, measured co-play edges on
// card_edges. In-memory database, fixture cards, synthetic lists.
import { describe, expect, it } from 'vitest';
import { serializeCard } from '@/engine/carddb';
import { COPLAY_SCOPE, legendCanRun } from '@/engine/evidence';
import type { Card, CardEdge, CardFeatures } from '@/engine/types';
import { loadPlayLists } from '@/ingest/evidence';
import { syncFeatures } from '@/ingest/features';
import { META } from '@/ingest/meta';
import { invalidateCardDb, loadCardDb, loadLegality } from '@/server/carddb';
import { openDb, readSyncState } from '@/server/db';
import { fixtureCards, fixtureDb } from '../helpers/fixture-db';

describe('features step (evidence part)', () => {
  const kaisa = fixtureDb().byName('Daughter of the Void') as Card;
  const bans = new Set(fixtureDb().legality().bans.map((b) => b.name));
  const pool = fixtureCards()
    .filter((c) => (c.type === 'unit' || c.type === 'spell' || c.type === 'gear') && !c.dataIncomplete && !c.superTypes.includes('token') && !bans.has(c.name) && c.sets.includes('OGN') && legendCanRun(c, kaisa))
    .slice(0, 40);
  const [a, b, staple, never] = pool;

  const seed = () => {
    const db = openDb(':memory:');
    const insert = db.prepare('INSERT INTO cards (id, name, json) VALUES (?, ?, ?)');
    for (const card of [kaisa, ...pool]) insert.run(card.id, card.name, JSON.stringify(serializeCard(card)));
    const deck = db.prepare(
      "INSERT INTO meta_decks(id, source, name, legend_id, format, edited_at, views, event, rank, era, complete, fetched_at) VALUES (?, 'piltoverarchive', ?, ?, ?, ?, ?, ?, ?, 'x', ?, 'now')",
    );
    const cardRow = db.prepare("INSERT INTO meta_deck_cards(deck_id, zone, card_id, qty) VALUES (?, ?, ?, ?)");
    const add = (id: string, cards: Card[], over: { format?: string; complete?: number; editedAt?: string } = {}) => {
      deck.run(id, id, kaisa.id, over.format ?? 'standard', over.editedAt ?? '2026-11-05T10:00:00.000Z', 1000, 0, null, over.complete ?? 1);
      for (const c of cards) cardRow.run(id, 'main', c.id, 2);
      cardRow.run(id, 'side', never.id, 1); // the side deck is not main-deck evidence
    };
    for (let i = 0; i < 8; i += 1) add(`with-${i}`, [staple, a, b]);
    for (let i = 0; i < 12; i += 1) add(`without-${i}`, [staple]);
    add('old', [staple], { editedAt: '2026-08-10T10:00:00.000Z' });
    add('two-v-two', [never], { format: '2v2' });
    add('incomplete', [never], { complete: 0 });
    return db;
  };

  it('reads complete Standard lists with the meta weights and an era weight', () => {
    const db = seed();
    const lists = loadPlayLists(db, loadLegality(db), '2026-11-12');
    expect(lists).toHaveLength(21);
    const old = lists.find((l) => l.id === 'old')!;
    const fresh = lists.find((l) => l.id === 'with-0')!;
    expect(fresh.eraWeight).toBe(1);
    expect(old.eraWeight).toBe(META.previousEraFactor);
    expect(old.weight).toBeLessThan(fresh.weight); // recency
    expect(fresh.main).toEqual({ [staple.id]: 2, [a.id]: 2, [b.id]: 2 });
    db.close();
  });

  it('stores evidence, both ratings with reasons, and measured co-play edges; idempotent', () => {
    const db = seed();
    const lines: string[] = [];
    syncFeatures(db, (line) => lines.push(line));
    const first = db.prepare('SELECT COUNT(*) AS n FROM card_edges').get() as { n: number };
    syncFeatures(db, () => {});
    expect(db.prepare('SELECT COUNT(*) AS n FROM card_edges').get()).toEqual(first);
    expect(lines[1]).toMatch(/^evidence 21 lists, 40 main-deck cards with play data; 1 measured co-play edges/);
    expect(readSyncState(db, 'features')?.info).toMatchObject({ playLists: 21, cardsWithEvidence: 40, coPlayEdges: 1 });

    invalidateCardDb();
    const cards = loadCardDb(db);
    const f = (c: Card): CardFeatures => cards.features(c.id) as CardFeatures;
    expect(f(staple).evidence).toMatchObject({ share: 1, lists: 21, eligibleLists: 21, banned: false });
    expect(f(staple).evaluatedRating).toBeGreaterThan(f(staple).baseRating);
    expect(f(never).evidence).toMatchObject({ share: 0, lists: 0, eligibleLists: 21 });
    expect(f(never).evaluatedRating).toBeLessThan(f(never).baseRating);
    expect(f(a).evidence?.lists).toBe(8);
    for (const c of [staple, never, a]) {
      expect(f(c).ratingReasons).toHaveLength(2);
      expect(f(c).ratingReasons[0]).toContain(`Mechanical rating of ${c.name}`);
      expect(f(c).ratingReasons[1]).toMatch(/Measured play \(data, not rules\)/);
    }
    // The legend itself has no play evidence: its rating stays mechanical.
    expect(f(kaisa).evidence).toBeNull();
    expect(f(kaisa).evaluatedRating).toBe(f(kaisa).baseRating);

    const edge = cards.edge(a.id, b.id) as CardEdge;
    const measured = edge.reasons.filter((r) => r.scope === COPLAY_SCOPE);
    expect(measured).toHaveLength(1);
    expect(measured[0].kind).toBe('synergy');
    expect(measured[0].detail).toMatch(/are played together in 8 of 21 Kai'Sa lists \(8 run .+, 8 run .+\), 2\.63x the 3\.05 that chance predicts\. Measured in public lists; not a rules interaction\.$/);
    // The staple is in every list: no measured edge with it.
    for (const e of cards.edges(staple.id)) expect(e.reasons.some((r) => r.scope === COPLAY_SCOPE)).toBe(false);
    invalidateCardDb();
    db.close();
  });

  it('without lists every card keeps its mechanical rating and is marked "no play data"', () => {
    const db = openDb(':memory:');
    const insert = db.prepare('INSERT INTO cards (id, name, json) VALUES (?, ?, ?)');
    for (const card of pool.slice(0, 5)) insert.run(card.id, card.name, JSON.stringify(serializeCard(card)));
    syncFeatures(db, () => {});
    invalidateCardDb();
    const cards = loadCardDb(db);
    for (const card of pool.slice(0, 5)) {
      const f = cards.features(card.id) as CardFeatures;
      expect(f.evidence).toBeNull();
      expect(f.evaluatedRating).toBe(f.baseRating);
      expect(f.ratingReasons[1]).toMatch(/No play data/);
    }
    invalidateCardDb();
    db.close();
  });
});
