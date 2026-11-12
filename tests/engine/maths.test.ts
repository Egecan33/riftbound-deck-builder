// Plan Task 5: reliability maths (ported), consistency model, curve and rune split.
import { describe, expect, it } from 'vitest';
import { toScoreCard } from '@/engine/mine';
import { averageEnergy, cardRuneReliability, cardsSeenByTurn, curveOf, earlyPackageReliability, hypergeometricAtLeast, runeDemand, runeSplit, seenByTurn } from '@/engine/maths';
import type { Deck, Domain } from '@/engine/types';
import { fixtureDb, fixtureDecks } from '../helpers/fixture-db';
import { networkCard as card } from '../helpers/mine-cards';

const db = fixtureDb();
const deckOf = (over: Partial<Deck>): Deck => ({
  id: null, name: 't', format: 'standard-bo1', power: 'focused', legend: null, champion: null, main: [], side: [], runes: {},
  battlefields: [], extraLegends: [], themeWeights: null, teammate: null, ...over,
});
const sum = (split: Partial<Record<Domain, number>>): number => Object.values(split).reduce((a, b) => a + (b ?? 0), 0);

describe('ported reliability maths', () => {
  it('hypergeometricAtLeast matches hand-computed values and is sane at the edges', () => {
    expect(hypergeometricAtLeast(12, 6, 2, 1)).toBe(0.7727);
    expect(hypergeometricAtLeast(12, 8, 4, 2)).toBe(0.9333);
    expect(hypergeometricAtLeast(40, 3, 7, 1)).toBeCloseTo(1 - (37 / 40) * (36 / 39) * (35 / 38) * (34 / 37) * (33 / 36) * (32 / 35) * (31 / 34), 4);
    expect(hypergeometricAtLeast(0, 0, 0, 1)).toBe(0);
    expect(hypergeometricAtLeast(40, 0, 7, 1)).toBe(0);
    expect(hypergeometricAtLeast(40, 3, 7, 0)).toBe(1);
    expect(hypergeometricAtLeast(40, 99, 99, 1)).toBe(1);
    expect(hypergeometricAtLeast(NaN, 3, 7, 1)).toBe(0);
  });
  it('earlyPackageReliability grows with copies and is 0 without one side or without a deck', () => {
    const one = earlyPackageReliability(40, 1, 1);
    const three = earlyPackageReliability(40, 3, 3);
    expect(three).toBeGreaterThan(one);
    expect(earlyPackageReliability(40, 0, 6)).toBe(0);
    expect(earlyPackageReliability(0, 3, 3)).toBe(0);
    expect(earlyPackageReliability(40, 3, 3)).toBe(earlyPackageReliability(40, 3, 3, 0, 4, 3));
  });
  it('cardRuneReliability reads a real card: Possession needs 3 Chaos Power', () => {
    const possession = toScoreCard(card('OGN-203'));
    expect(possession.power).toBe(3);
    expect(cardRuneReliability(possession, [])).toBe(0);
    const even = cardRuneReliability(possession, [{ domain: 'chaos', count: 6, demand: 0 }, { domain: 'mind', count: 6, demand: 0 }]);
    const heavy = cardRuneReliability(possession, [{ domain: 'chaos', count: 9, demand: 0 }, { domain: 'mind', count: 3, demand: 0 }]);
    expect(heavy).toBeGreaterThan(even);
    expect(cardRuneReliability(toScoreCard(card('OGN-064')), [])).toBe(cardRuneReliability(toScoreCard(card('OGN-064')), [{ domain: 'calm', count: 0, demand: 0 }]));
  });
});

describe('consistency model (deck-theory.md 3.3, table A)', () => {
  it('reproduces the published percentages for a 39-card library', () => {
    expect(cardsSeenByTurn(3)).toBe(7);
    expect(cardsSeenByTurn(3, 2)).toBe(9);
    const pct = (copies: number, turn: number, mulligan = 0) => Math.round(seenByTurn(copies, turn, 39, mulligan) * 100);
    expect([pct(1, 1), pct(3, 1), pct(3, 3), pct(3, 3, 2), pct(6, 2), pct(9, 4), pct(3, 8)]).toEqual([13, 35, 46, 56, 66, 90, 68]);
  });
  it('never divides by zero', () => {
    expect(seenByTurn(0, 3)).toBe(0);
    expect(seenByTurn(3, 3, 0)).toBe(0);
    expect(seenByTurn(3, -5, 39)).toBeGreaterThan(0);
    expect(seenByTurn(3, 99, 39)).toBe(1);
  });
});

describe('curve', () => {
  it('counts copies per Energy bucket with 7+ in the last one', () => {
    // Falling Star 2, Icathian Rain 7, Time Warp 10, Wind Wall 3.
    const deck = deckOf({ main: [{ id: card('OGN-029').id, qty: 3, locked: false }, { id: card('OGN-248').id, qty: 2, locked: false }, { id: card('OGN-122').id, qty: 1, locked: false }, { id: card('OGN-064').id, qty: 2, locked: false }, { id: 'unknown', qty: 3, locked: false }] });
    expect(curveOf(deck, db)).toEqual([0, 0, 3, 2, 0, 0, 0, 3]);
    expect(averageEnergy(deck, db)).toBe(4.5);
  });
  it('is sane for an empty deck', () => {
    expect(curveOf(deckOf({}), db)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(averageEnergy(deckOf({}), db)).toBe(0);
  });
});

describe('runeSplit (deck-theory.md 3.2)', () => {
  const kaisa = db.byName('Daughter of the Void')!; // Fury/Mind
  it('gives every fixture deck 12 runes inside the legend\'s domains, major 6 to 9', () => {
    const decks = fixtureDecks();
    expect(decks.length).toBeGreaterThan(0);
    let within1 = 0;
    for (const { deck } of decks) {
      const split = runeSplit(deck, db);
      const legend = db.get(deck.legend!)!;
      expect(sum(split), deck.name).toBe(12);
      expect(Object.keys(split).sort()).toEqual([...legend.domains].sort());
      for (const n of Object.values(split)) expect(n).toBeGreaterThanOrEqual(3);
      expect(Math.max(...Object.values(split) as number[])).toBeLessThanOrEqual(9);
      if (legend.domains.every((d) => Math.abs((split[d] ?? 0) - (deck.runes[d] ?? 0)) <= 1)) within1 += 1;
    }
    // The research measured "within one rune" for about 89% of lists; the few fixture decks must not all miss.
    expect(within1).toBeGreaterThan(0);
  });
  it('follows the demand: all Fury Power gives 9 Fury, an even demand 6/6, no demand 6/6', () => {
    expect(kaisa.domains).toEqual(['fury', 'mind']);
    const furyCard = db.all().find((c) => c.type === 'spell' && c.domains.length === 1 && c.domains[0] === 'fury' && (c.power ?? 0) >= 1 && !/\[Mind\]/.test(c.text))!;
    const mindCard = db.all().find((c) => c.type === 'spell' && c.domains.length === 1 && c.domains[0] === 'mind' && (c.power ?? 0) === furyCard.power && !/\[(?:Fury|Mind)\]/.test(c.text.replace(/\([^)]*\)/g, '')))!;
    const fury = deckOf({ legend: kaisa.id, main: [{ id: furyCard.id, qty: 3, locked: false }] });
    expect(runeDemand(fury, db).fury).toBeGreaterThan(0);
    expect(runeSplit(fury, db)).toEqual({ fury: 9, mind: 3 });
    if (!/\[Fury\]/.test(furyCard.text.replace(/\([^)]*\)/g, ''))) {
      expect(runeSplit(deckOf({ legend: kaisa.id, main: [{ id: furyCard.id, qty: 2, locked: false }, { id: mindCard.id, qty: 2, locked: false }] }), db)).toEqual({ fury: 6, mind: 6 });
    }
    expect(runeSplit(deckOf({ legend: kaisa.id }), db)).toEqual({ fury: 6, mind: 6 });
  });
  it('returns nothing rather than throwing for a deck without a usable legend', () => {
    expect(runeSplit(deckOf({}), db)).toEqual({});
    expect(runeSplit(deckOf({ legend: 'nope' }), db)).toEqual({});
    expect(runeSplit(deckOf({ legend: card('OGN-064').id }), db)).toEqual({});
    expect(runeDemand(deckOf({}), db)).toEqual({});
    expect(runeSplit(deckOf({ legend: kaisa.id, main: [{ id: 'unknown', qty: 3, locked: false }, { id: card('OGN-029').id, qty: NaN, locked: false }] }), db)).toEqual({ fury: 6, mind: 6 });
  });
});
