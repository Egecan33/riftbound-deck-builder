// mineCard, the coverage report and the coverage guard over the committed fixtures.
import { describe, expect, it } from 'vitest';
import { CARD_TIER_GRADES, TRAIT_LABELS, TYPE_TRAITS, coverage, isStructuralSentence, mineCard, mineSentences, toBaseRating100 } from '@/engine/mine';
import { cardByCode, mineCards, mineOverrides } from '../../helpers/mine-cards';

const cards = mineCards();
const overrides = mineOverrides();
const mainDeck = cards.filter((c) => c.type === 'unit' || c.type === 'spell' || c.type === 'gear');
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

describe('mineCard', () => {
  it('returns traits, a 0..100 base rating, a grade and reasons for every main-deck card', () => {
    const unvalued: string[] = [];
    for (const card of mainDeck) {
      const mined = mineCard(card, overrides[card.id]);
      for (const trait of mined.traits) expect(TRAIT_LABELS, `${card.code} ${trait}`).toHaveProperty(trait);
      expect(mined.baseRating).toBeGreaterThanOrEqual(0);
      expect(mined.baseRating).toBeLessThanOrEqual(100);
      expect(mined.baseRating).toBe(toBaseRating100(mined.calibratedFoundation!));
      expect(CARD_TIER_GRADES as readonly string[]).toContain(mined.grade);
      // No score without reasons: the ledger names what the number is made of.
      if (card.text.replaceAll(/\([^)]*\)/g, ' ').trim() && mined.effectProfile.mechanics.length === 0) unvalued.push(card.code);
      for (const m of mined.effectProfile.mechanics) expect(m.detail.length, `${card.code} ${m.label}`).toBeGreaterThan(0);
    }
    // Cards whose text adds nothing to the value ledger: known gaps, kept under 1% of the main-deck pool.
    expect(unvalued.length, unvalued.join(' ')).toBeLessThan(mainDeck.length * 0.01);
  });

  it('does not throw on cards the mine does not score (runes, legends, battlefields, typeless rows)', () => {
    for (const card of cards.filter((c) => !mainDeck.includes(c))) expect(() => mineCard(card)).not.toThrow();
    const rune = cards.find((c) => c.type === 'rune')!;
    expect(mineCard(rune)).toMatchObject({ foundation: null, baseRating: 0, grade: null });
    const typeless = mineCard({ ...cardByCode('RAD-054'), id: 'typeless', type: null });
    expect(typeless.foundation).toBeNull();
  });

  it('applies a reviewed override', () => {
    const riches = cardByCode('VEN-022');
    expect(riches.text).toContain('Skip your Draw Phase.');
    expect(mineCard(riches).traits).toContain('draw');
    expect(mineCard(riches, overrides[riches.id]).traits).not.toContain('draw');
    const chimera = cardByCode('VEN-036');
    expect(mineCard(chimera, overrides[chimera.id]).traits).toContain('interaction');
    expect(mineCard(chimera, overrides[chimera.id]).traits).not.toContain('channel-rune');
  });
});

describe('sentences', () => {
  it('sets target declarations, cost riders and debris apart from unparsed text', () => {
    for (const s of ['Choose a unit', 'Choose one —', 'When you play me, choose an opponent', 'You may pay [C] as an additional cost to play me', 'Use only once per turn', '"']) {
      expect(isStructuralSentence(s), s).toBe(true);
    }
    for (const s of ['Choose a card revealed this way and banish it', 'Draw 1', 'They reveal their hand']) expect(isStructuralSentence(s), s).toBe(false);
  });
  it('drops reminder text', () => {
    expect(mineSentences('[Tank] (I must be assigned combat damage first.)\nWhen you play me, draw 1.')).toEqual(['[Tank]', 'When you play me, draw 1']);
  });
});

describe('coverage guard', () => {
  const report = coverage(cards, overrides);

  it('every fixture main-deck card with rules text has a mechanic trait or a reviewed override', () => {
    const missing = mainDeck
      .filter((c) => c.text.replaceAll(/\([^)]*\)/g, ' ').trim() && !overrides[c.id]?.noMechanic)
      .filter((c) => !mineCard(c, overrides[c.id]).traits.some((t) => !TYPE_TRAITS.has(t)))
      .map((c) => `${c.code} ${c.name}`);
    expect(missing).toEqual([]);
    expect(report.noTraits.filter((id) => mainDeck.some((c) => c.id === id))).toEqual([]);
  });

  it('every override names a reason', () => {
    for (const o of Object.values(overrides)) expect(o.reason.length).toBeGreaterThan(20);
    expect(Object.keys(overrides).length).toBeGreaterThanOrEqual(6);
  });

  it('keeps unparsed sentences under 6% of all sentences', () => {
    expect(report.sentenceTotal).toBeGreaterThan(1000);
    expect(report.unparsedTotal / report.sentenceTotal).toBeLessThan(0.06);
    expect(report.unparsedSentences[0].count).toBeGreaterThanOrEqual(report.unparsedSentences.at(-1)!.count);
  });

  it('Radiance cards do not rate systematically below older sets', () => {
    // Complete rows only: an incomplete gallery row has a wrong type or cost.
    for (const type of ['unit', 'spell', 'gear'] as const) {
      const of = (rad: boolean) => mainDeck.filter((c) => c.type === type && !c.dataIncomplete && (c.set === 'RAD') === rad).map((c) => mineCard(c).foundation!);
      expect(of(true).length, type).toBeGreaterThan(10);
      expect(Math.abs(mean(of(true)) - mean(of(false))), type).toBeLessThan(0.3);
    }
    // No Radiance main-deck card is left with text the rating could not name.
    const fallback = mainDeck.filter((c) => c.set === 'RAD' && !overrides[c.id]?.noMechanic && mineCard(c).effectProfile.recognizedEffects.includes('situational rules-text utility'));
    expect(fallback.map((c) => c.code)).toEqual([]);
  });
});
