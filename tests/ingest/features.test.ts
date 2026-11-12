import { describe, expect, it } from 'vitest';
import { serializeCard } from '@/engine/carddb';
import { computeFeatures, syncFeatures } from '@/ingest/features';
import { loadCardDb, invalidateCardDb } from '@/server/carddb';
import { openDb, readSyncState } from '@/server/db';
import { cardByCode, mineCards, mineOverrides } from '../helpers/mine-cards';

describe('features step (card mine part)', () => {
  it('computes traits, base rating, grade, speed and cost bucket per card', () => {
    const rows = computeFeatures(mineCards(), mineOverrides());
    expect(rows).toHaveLength(mineCards().length);
    const byId = new Map(rows.map((r) => [r.id, r]));
    const peddler = byId.get(cardByCode('RAD-054').id)!;
    expect(peddler.traits).toEqual(expect.arrayContaining(['unit', 'disarm']));
    expect(peddler.baseRating).toBeGreaterThan(40);
    expect(peddler.grade).not.toBe('');
    expect(peddler.costBucket).toBe(3);
    expect(peddler.speed).toBe('normal');
    expect(byId.get(cardByCode('RAD-032').id)!.speed).toBe('reaction'); // Battle Preparations
    expect(byId.get(cardByCode('RAD-142').id)!.speed).toBe('action'); // Hexplosive Minefield
    expect(byId.get(cardByCode('VEN-022').id)!.traits).not.toContain('draw'); // reviewed override
  });

  it('stores the rows and the card database serves them', () => {
    const db = openDb(':memory:');
    const insert = db.prepare('INSERT INTO cards (id, name, json) VALUES (?, ?, ?)');
    const sample = mineCards().slice(0, 60);
    for (const card of sample) insert.run(card.id, card.name, JSON.stringify(serializeCard(card)));
    const lines: string[] = [];
    syncFeatures(db, (line) => lines.push(line));
    syncFeatures(db, () => {}); // idempotent
    expect((db.prepare('SELECT COUNT(*) AS n FROM card_features').get() as { n: number }).n).toBe(60);
    expect(readSyncState(db, 'features')?.info).toMatchObject({ implemented: true, cards: 60 });
    expect(lines[0]).toMatch(/^features 60\/60 cards mined/);
    invalidateCardDb();
    const cards = loadCardDb(db);
    const features = cards.features(sample[0].id);
    expect(features?.traits.length).toBeGreaterThan(0);
    invalidateCardDb();
    db.close();
  });
});
