import { describe, expect, it } from 'vitest';
import { deriveTraits, toMineText, toScoreCard } from '@/engine/mine';
import { cardByCode } from '../../helpers/mine-cards';

describe('toMineText', () => {
  it('converts the Forge symbols to the ones the ported mine reads', () => {
    expect(toMineText('[Exhaust]: Give a unit +2 [Might] this turn. Pay [Any] or [Fury][Fury].')).toBe('[T]: Give a unit +2 [S] this turn. Pay [A] or [C][C].');
  });
  it('turns list bullets into the Riftfoundry form and drops the Equipment "Effect: " label', () => {
    expect(toMineText('Choose one —\n- Draw 1.\n- Kill a gear.')).toBe('Choose one —\n* Draw 1.\n* Kill a gear.');
    expect(toMineText('[Equip] [Body]\nEffect: When I attack, draw 1.')).toBe('[Equip] [C]\nWhen I attack, draw 1.');
  });
  it('brackets a keyword printed bare at the head of a line', () => {
    expect(toMineText('Action (Play on your turn or in showdowns.)\nDeal 3 to a unit.')).toBe('[Action] (Play on your turn or in showdowns.)\nDeal 3 to a unit.');
    expect(toMineText('Equip [Body] ([Body]: Attach this to a unit you control.)')).toBe('[Equip] [C] ([C]: Attach this to a unit you control.)');
    expect(toMineText('Hidden cards have [Reaction].')).toBe('Hidden cards have [Reaction].');
  });
  it('writes the game actions Stun and Buff without brackets', () => {
    expect(toMineText('[Buff] a friendly unit and [Stun] an enemy unit.')).toBe('Buff a friendly unit and Stun an enemy unit.');
  });
});

describe('toScoreCard', () => {
  it('maps a real unit and returns the same object for the same card', () => {
    const card = cardByCode('RAD-054');
    const score = toScoreCard(card);
    expect(score).toBe(toScoreCard(card));
    expect(score).toMatchObject({ id: card.id, name: 'Trinket Peddler', setId: 'RAD', type: 'unit', energy: 3, might: 3, copyLimit: 3 });
    expect(score.domainNames[0]).toMatch(/^[A-Z]/);
  });
  it('an unbracketed Action line on a real card becomes the action trait and its damage is read (Disintegrate)', () => {
    const card = cardByCode('OGN-005');
    expect(card.text.startsWith('Action (')).toBe(true);
    const traits = deriveTraits(toScoreCard(card));
    expect(traits.has('action')).toBe(true);
    expect(traits.has('damage-provider')).toBe(true);
  });
  it('gives a typeless row an empty type and a rune a finite copy limit', () => {
    const typeless = toScoreCard({ ...cardByCode('RAD-054'), id: 'x', type: null, domains: [] });
    expect(typeless.type).toBe('');
    expect(typeless.domains).toEqual(['colorless']);
    expect(toScoreCard({ ...cardByCode('RAD-054'), id: 'y', copyLimit: Infinity }).copyLimit).toBe(99);
  });
});
