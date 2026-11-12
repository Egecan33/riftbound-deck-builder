// Stage 3 review of the card mine (src/engine/mine/refine.ts): one test per defect class the 60-card audit
// found, each on the real synced text of a card. Every test first checks the sentence it relies on.
import { describe, expect, it } from 'vitest';
import { computeFeatures } from '@/engine/features';
import { mineCard, TRAIT_LABELS } from '@/engine/mine';
import { reviewCard } from '../../helpers/review-cards';

const mined = (code: string, sentence: string) => {
  const card = reviewCard(code);
  expect(card.text).toContain(sentence);
  return mineCard(card);
};
const features = (code: string) => computeFeatures(reviewCard(code));
const effect = (m: ReturnType<typeof mineCard>, label: string) => m.effectProfile.mechanics.find((x) => x.label === label);

describe('effects that had no trait', () => {
  it('taking control of an enemy unit is removal', () => {
    const possession = mined('OGN-203', 'Take control of it and recall it.');
    const takeover = mined('SFD-202', 'Take control of an enemy unit at a battlefield.');
    for (const m of [possession, takeover]) expect(m.traits).toEqual(expect.arrayContaining(['steal', 'removal', 'interaction']));
    expect(features('OGN-203').roles).toContain('removal');
    expect(features('SFD-202').roles).toContain('removal');
  });

  it('damage of a counted amount is damage', () => {
    const ntofo = mined('RAD-148', 'then deal damage equal to its [Shield] to an enemy unit');
    expect(ntofo.traits).toEqual(expect.arrayContaining(['damage-provider', 'interaction', 'shield']));
    expect(effect(ntofo, 'Counted damage')?.value).toBeGreaterThan(0);
    expect(features('RAD-148').roles).toContain('removal');
    const projectile = mined('RAD-056', 'Deal damage equal to its Energy cost to a unit at a battlefield.');
    expect(projectile.traits).toEqual(expect.arrayContaining(['damage-provider', 'gear-matters']));
  });

  it('a kill the opponent has to make is removal', () => {
    const atakhan = mined('UNL-170', 'the defender must kill one of their units here');
    expect(atakhan.traits).toEqual(expect.arrayContaining(['removal', 'interaction', 'death-enabler']));
    expect(features('UNL-170').roles).toContain('removal');
  });

  it('playing a card without paying is cost-cheat, unless the opponent is the one who plays', () => {
    expect(mined('OGN-160', 'Play it, ignoring its cost, and recycle the rest.').traits).toContain('cost-cheat');
    expect(mined('UNL-139', 'They play that unit to that battlefield, ignoring any and all costs.').traits).not.toContain('cost-cheat');
  });

  it('bouncing or flickering your own unit is replay-unit; a flicker is not cost-cheat; a gear bounce is neither', () => {
    expect(mined('UNL-128', 'Return a friendly unit and an enemy unit to their owners\' hands.').traits).toContain('replay-unit');
    expect(mined('RAD-061', 'As an additional cost to play me, return a friendly unit to its owner\'s hand.').traits).toContain('replay-unit');
    const thrill = mined('UNL-184', 'Banish a friendly unit, then its owner plays it to any battlefield, ignoring its cost.');
    expect(thrill.traits).toContain('replay-unit');
    expect(thrill.traits).not.toContain('cost-cheat');
    expect(mined('SFD-044', 'return a friendly gear to its owner\'s hand').traits).not.toContain('replay-unit');
    expect(mined('OGN-199', 'When you play me, you may choose a unit you control at another location.').traits).toContain('play-effect');
  });

  it('saving a unit that would die is death-prevention, valued, and a protection role', () => {
    const zhonya = mined('OGN-077', 'If a friendly unit would die, kill this instead. Heal that unit, exhaust it, and recall it.');
    expect(zhonya.traits).toContain('death-prevention');
    // "kill this instead" is the price of the save, not a sacrifice outlet.
    expect(zhonya.traits).not.toContain('death-enabler');
    expect(effect(zhonya, 'Death prevention')?.value).toBeGreaterThan(0);
    expect(features('OGN-077').roles).toContain('protection');
    // A real sacrifice inside the same sentence stays a Death enabler.
    const mordekaiser = mined('RAD-020', 'if I would die, you may kill a friendly unit to heal me, exhaust me, and recall me instead');
    expect(mordekaiser.traits).toEqual(expect.arrayContaining(['death-prevention', 'death-enabler']));
    // "If it would die this turn, banish it instead" is aimed at the enemy unit: nothing is saved.
    expect(mined('UNL-007', 'If it would die this turn, banish it instead.').traits).not.toContain('death-prevention');
  });

  it('legend text: Power for spells only is a spell payoff, playing from elsewhere pays off trash and Hidden', () => {
    expect(mined('OGN-247', 'Use only to play spells.').traits).toContain('spell-matters');
    expect(mined('VEN-155', 'When you play a card from anywhere other than your hand, empower me.').traits).toEqual(expect.arrayContaining(['trash-payoff', 'hidden-matters']));
  });
});

describe('a mention read as the effect', () => {
  it('"When you stun" and "would stun me" do not make a Stun provider', () => {
    const herald = mined('OGN-059', 'When you stun an enemy unit, ready me and give me +1 [Might] this turn.');
    expect(herald.traits).toContain('stun-payoff');
    expect(herald.traits).not.toContain('stun');
    expect(features('OGN-059').roles).not.toContain('disruption');
    expect(features('OGN-059').axes.stun).toEqual({ e: 0, p: 1 });
    const gangplank = mined('VEN-086', 'If a spell or ability that chooses me would stun me');
    expect(gangplank.traits).not.toContain('stun');
    expect(features('VEN-086').roles).not.toContain('disruption');
    // A card that stuns keeps the trait.
    expect(mined('UNL-139', 'If they do, then do this: [Stun] it.').traits).toContain('stun');
  });

  it('a count of targets is not Go wide; a count of friendly units is', () => {
    expect(mined('SFD-145', 'Swap the Mights of two units at the same battlefield this turn.').traits).not.toContain('wide');
    expect(mined('RAD-065', 'when you exhaust three or more friendly units at the same time').traits).toContain('wide');
    expect(mined('RAD-151', 'you may exhaust me and three friendly units').traits).toContain('wide');
  });

  it('"Play me only to" is a restriction, not flexible placement or mobility', () => {
    const wyrm = mined('SFD-015', 'Play me only to a battlefield you conquered this turn.');
    expect(wyrm.traits).not.toContain('placement');
    expect(wyrm.traits).toContain('conquer');
    expect(features('SFD-015').roles).not.toContain('mobility');
  });
});

describe('direction', () => {
  it('"4 or fewer runes" rewards few runes; "for each rune you control" rewards many', () => {
    const renekton = mined('VEN-019', 'if you control 4 or fewer runes, deal 2 to all enemy units here');
    expect(renekton.traits).toContain('low-rune-payoff');
    expect(renekton.traits).not.toContain('rune-count-payoff');
    expect(features('VEN-019').axes.ramp?.p ?? 0).toBe(0);
    expect(mined('VEN-050', 'This ability costs [1] less for each rune you control.').traits).toContain('rune-count-payoff');
  });
});

it('every review trait has a label', () => {
  for (const id of ['steal', 'cost-cheat', 'replay-unit', 'play-effect', 'death-prevention', 'low-rune-payoff', 'might-damage']) {
    expect((TRAIT_LABELS as Record<string, string>)[id], id).toBeTruthy();
  }
});
