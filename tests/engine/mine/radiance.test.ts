// Forge extension of the card mine: one test per added mechanic, each on the real synced text of a card.
// Every test first checks the sentence it relies on, so a text change in the fixture fails loudly here.
import { describe, expect, it } from 'vitest';
import { FORGE_TRAIT_LABELS, TRAIT_LABELS, bombTokensPlayed, mineCard, ownedDisarm, ownsKeyword, toScoreCard } from '@/engine/mine';
import { cardByCode } from '../../helpers/mine-cards';

const mined = (code: string, sentence: string) => {
  const card = cardByCode(code);
  expect(card.text).toContain(sentence);
  return mineCard(card);
};
const effect = (m: ReturnType<typeof mineCard>, label: string) => m.effectProfile.mechanics.find((x) => x.label === label);

describe('Radiance keywords (CR 830-832, Bomb token CR 187.12)', () => {
  it('Deploy: an owner has the trait and the placement value; a reference is a Deploy payoff', () => {
    const banner = mined('RAD-002', '[Deploy] (Play this only to a battlefield. When an opponent holds here, kill this.)');
    expect(banner.traits).toEqual(expect.arrayContaining(['deploy', 'gear', 'assault']));
    expect(banner.traits).not.toContain('deploy-matters');
    expect(effect(banner, 'Deploy placement')?.value).toBeGreaterThan(0);
    expect(banner.unparsed).toEqual([]);

    const jarvan = mined('RAD-091', 'Your gear with [Deploy] have [Action].');
    expect(jarvan.traits).toEqual(expect.arrayContaining(['deploy-matters', 'gear-matters']));
    expect(jarvan.traits).not.toContain('deploy');
    expect(effect(jarvan, 'Deploy placement')).toBeUndefined();
    expect(effect(jarvan, 'Deploy at Action speed')?.value).toBeGreaterThan(0);

    const command = mined('RAD-033', 'Move a friendly gear with [Deploy] to a battlefield.');
    expect(command.traits).toContain('deploy-matters');
    expect(ownsKeyword(toScoreCard(cardByCode('RAD-033')), 'deploy')).toBe(false);
  });

  it('Disarm: the value follows the printed number, summed, and it is enemy Might reduction', () => {
    const one = mined('RAD-054', '[Disarm] (When I attack, give an enemy unit here -1 [Might] this turn.)');
    const two = mined('RAD-050', '[Disarm 2] (When I attack, give an enemy unit here -2 [Might] this turn.)');
    expect(ownedDisarm(toScoreCard(cardByCode('RAD-054')))).toBe(1);
    expect(ownedDisarm(toScoreCard(cardByCode('RAD-050')))).toBe(2);
    for (const m of [one, two]) expect(m.traits).toEqual(expect.arrayContaining(['disarm', 'might-reduction', 'interaction']));
    expect(effect(two, 'Disarm')!.value).toBeGreaterThan(effect(one, 'Disarm')!.value);
    expect(effect(one, 'Disarm')!.detail).toContain('-1 Might');
    // A 3-Might unit for 3 with Disarm must rate above the same body with no text.
    const blank = mineCard({ ...cardByCode('RAD-054'), id: 'blank', text: '' });
    expect(one.foundation!).toBeGreaterThan(blank.foundation!);
    expect(one.unparsed).toEqual([]);
  });

  it('Disarm granted to others is a grant, not an owned keyword', () => {
    const sentry = mined('RAD-055', 'Your Mechs have [Disarm].');
    expect(ownedDisarm(toScoreCard(cardByCode('RAD-055')))).toBe(0);
    expect(sentry.traits).toContain('disarm');
    expect(effect(sentry, 'Disarm')).toBeUndefined();
    expect(effect(sentry, 'Disarm grant')?.value).toBeGreaterThan(0);
  });

  it('Show Off: the keyword and its payoff clause are both read', () => {
    const construct = mined('RAD-011', '[Show Off] a Mech.');
    expect(construct.traits).toEqual(expect.arrayContaining(['show-off', 'ready']));
    expect(construct.unparsed).toEqual([]);
    const roar = mined('RAD-082', 'If you showed off a unit, deal damage equal to that unit\'s Might to a unit.');
    expect(roar.traits).toEqual(expect.arrayContaining(['show-off', 'damage-provider']));
    const display = mined('RAD-127', 'If you showed off, play four to your base instead.');
    expect(display.traits).toEqual(expect.arrayContaining(['show-off', 'token']));
  });

  it('Bomb tokens: counted per use, valued as delayed damage, and tagged for Deploy decks', () => {
    const one = mined('RAD-001', 'play a Bomb gear token to a battlefield');
    const three = mined('RAD-094', 'play three Bomb gear tokens to a single battlefield');
    expect(bombTokensPlayed('when you play me, play a bomb gear token to a battlefield.')).toBe(1);
    expect(bombTokensPlayed('when i hold, play three bomb gear tokens to a single battlefield.')).toBe(3);
    expect(bombTokensPlayed('at end of turn, play that many bomb tokens to a single battlefield.')).toBe(0);
    for (const m of [one, three]) expect(m.traits).toEqual(expect.arrayContaining(['bomb', 'token', 'damage-provider']));
    expect(effect(one, 'Bomb tokens')!.value).toBeGreaterThan(0);
    const repeatable = mined('RAD-112', '[1], [Exhaust]: Play a Bomb gear token to a battlefield.');
    expect(effect(repeatable, 'Bomb tokens')!.detail).toContain('per activation');
    const minefield = mined('RAD-142', 'Kill any number of friendly Bomb tokens.');
    expect(minefield.traits).toContain('bomb');
    expect(effect(minefield, 'Bomb detonation')?.value).toBeGreaterThan(0);
  });

  it('Deathknell doubling on a Deploy gear is valued', () => {
    const amplifier = mined('RAD-017', 'Friendly [Deathknell] effects here trigger an additional time.');
    expect(effect(amplifier, 'Deathknell doubling')?.value).toBeGreaterThan(0);
    expect(amplifier.traits).toContain('deploy');
  });

  it('Might-reduction payoff (Ahri, Confident) is its own trait', () => {
    const ahri = mined('RAD-038', 'When you reduce the Might of an enemy unit here by 1 or more, give me +1 [Might] this turn.');
    expect(ahri.traits).toEqual(expect.arrayContaining(['disarm', 'might-reduction-payoff', 'might-boost']));
  });
});

describe('2026-10-09 rules already in the port, checked on real text', () => {
  it('Backline: the keyword, and the two cards that print its text without the keyword (CR 467.2.c.8)', () => {
    expect(mined('UNL-043', '[Backline] (I must be assigned combat damage last.)').traits).toContain('backline');
    expect(mined('OGN-068', 'I must be assigned combat damage last.').traits).toContain('backline');
    expect(mined('SFD-173', 'I must be assigned combat damage last.').traits).toContain('backline');
  });

  it('Flow: owner and payoff', () => {
    const steel = mined('VEN-003', '[Flow] [4][Fury] (You may play this from your trash for its Flow cost. Then banish it.)');
    expect(steel.traits).toEqual(expect.arrayContaining(['flow', 'trash-payoff']));
    expect(steel.effectProfile.recognizedEffects).toContain('Flow reuse');
    expect(mined('VEN-098', 'Spells with [Flow] you play from your trash cost [2] less').traits).toEqual(expect.arrayContaining(['flow', 'cost-reduction']));
  });

  it('Empower and Empowered', () => {
    const mel = mined('VEN-069', '[Empower] [3]');
    expect(mel.traits).toEqual(expect.arrayContaining(['empower', 'empowered-payoff', 'might-reduction-payoff']));
  });
});

describe('families the coverage report showed missing', () => {
  it('Might boost and solo combat', () => {
    expect(mined('OGN-055', 'While I\'m attacking or defending alone, I have +2 [Might].').traits).toEqual(expect.arrayContaining(['might-boost', 'solo']));
    expect(mined('OGN-028', 'My Might is increased by your points.').traits).toContain('might-boost');
    expect(mined('SFD-110', 'double my Might this combat').traits).toEqual(expect.arrayContaining(['might-boost', 'solo']));
  });

  it('variable Might debuff written with an en dash (High Note)', () => {
    const note = mined('RAD-048', 'Give a unit –[Might] this turn equal to the number of exhausted units you control.');
    expect(note.traits).toEqual(expect.arrayContaining(['might-reduction', 'interaction']));
    expect(effect(note, 'Variable Might debuff')?.value).toBeGreaterThan(0);
  });

  it('a chosen-unit debuff behind an optional cost is enemy Might reduction, not a drawback on itself', () => {
    expect(mined('SFD-067', 'if you paid the additional cost, give a unit -2 [Might] this turn').traits).toEqual(expect.arrayContaining(['might-reduction', 'interaction']));
  });

  it('protection from being chosen', () => {
    const runner = mined('SFD-105', 'I can\'t be chosen by enemy spells and abilities.');
    expect(runner.traits).toContain('protection');
    expect(effect(runner, 'Cannot be chosen')?.value).toBeGreaterThan(0);
    expect(mined('UNL-057', 'can\'t be chosen by enemy spells and abilities').traits).toContain('protection');
  });

  it('play restrictions are interaction', () => {
    expect(mined('OGN-026', 'opponents can\'t play cards this turn').traits).toEqual(expect.arrayContaining(['lock', 'interaction']));
  });

  it('flexible placement', () => {
    expect(mined('OGN-161', 'You may play me to an occupied enemy battlefield.').traits).toContain('placement');
  });

  it('Hidden payoffs', () => {
    expect(mined('RAD-108', 'that player may hide an additional card here').traits).toEqual(expect.arrayContaining(['deploy', 'hidden-matters']));
    expect(mined('RAD-109', 'if you control a facedown card here, score 1 point').traits).toEqual(expect.arrayContaining(['hidden-matters', 'disarm', 'scoring']));
  });

  it('Bonus Damage', () => {
    expect(mined('OGS-001', 'Your spells and abilities deal 1 Bonus Damage.').traits).toContain('bonus-damage');
    expect(mined('RAD-023', 'Abilities of friendly gear deal 1 Bonus Damage.').traits).toEqual(expect.arrayContaining(['bonus-damage', 'bomb', 'gear-matters']));
  });

  it('unit-play payoff', () => {
    expect(mined('VEN-121', 'When you play another unit, give me +2 [Might] this turn.').traits).toEqual(expect.arrayContaining(['unit-play-payoff', 'might-boost']));
    expect(mined('UNL-183', 'When you play a unit, give a unit +1 [Might] this turn.').traits).toContain('unit-play-payoff');
  });

  it('cost reduction written as "reduced by" and "pay ... less"', () => {
    expect(mined('OGN-140', 'Your Dragons\' Energy costs are reduced by [2]').traits).toContain('cost-reduction');
    const orianna = mined('RAD-068', 'you may pay [1][Any] less to play a gear');
    expect(orianna.traits).toEqual(expect.arrayContaining(['cost-reduction', 'gear-matters']));
    expect(effect(orianna, 'Play discount')?.value).toBeGreaterThan(0);
  });

  it('extra rune channel (Seraphic Wyvern)', () => {
    const wyvern = mined('RAD-092', 'channel that many runes plus 1 exhausted rune instead');
    expect(wyvern.traits).toContain('channel-rune');
    expect(effect(wyvern, 'Extra rune channel')?.value).toBeGreaterThan(0);
  });

  it('cost-based damage, paid removal, optional enter ready, mass recursion, play from the top', () => {
    const projectile = mined('RAD-056', 'Deal damage equal to its Energy cost to a unit at a battlefield.');
    expect(effect(projectile, 'Cost-based damage')?.value).toBeGreaterThan(0);
    const mordekaiser = mined('RAD-137', 'you may discard 1 to kill a unit or gear');
    expect(mordekaiser.traits).toEqual(expect.arrayContaining(['removal', 'interaction']));
    expect(effect(mordekaiser, 'Paid removal')?.value).toBeGreaterThan(0);
    const boar = mined('RAD-026', 'You may have me enter ready.');
    expect(boar.traits).toContain('ready');
    expect(effect(boar, 'Optional enter ready')?.value).toBeGreaterThan(0);
    expect(effect(mined('RAD-135', 'Play up to 3 units and/or gear from your trash'), 'Mass recursion')?.value).toBeGreaterThan(0);
    expect(effect(mined('RAD-012', 'banish the top card of your Main Deck'), 'Play from the top of the deck')?.value).toBeGreaterThan(0);
  });

  it('[Add] of plain Energy or domain Power is Energy acceleration (Energy Conduit)', () => {
    const conduit = mined('OGN-098', '[Exhaust]: [Reaction] — [Add] [1].');
    expect(conduit.traits).toContain('energy-ramp');
    expect(effect(conduit, 'Energy acceleration')?.value).toBeGreaterThan(0);
  });

  it('Predict has a value (the port valued Vision only)', () => {
    expect(effect(mined('RAD-053', 'When I become exhausted, [Predict].'), 'Predict selection')?.value).toBeGreaterThan(0);
  });
});

describe('wordings found by the GameLab script comparison', () => {
  it('a bulleted modal option is read as an instruction', () => {
    const barrage = mined('SFD-077', '- Deal 4 to a unit in a base.');
    expect(barrage.traits).toEqual(expect.arrayContaining(['damage-provider', 'interaction']));
    const curtain = mined('UNL-182', '- Deal 2 to a unit at a battlefield.');
    expect(curtain.traits).toEqual(expect.arrayContaining(['damage-provider', 'draw', 'might-reduction']));
  });

  it('"choose a unit ... kill it" is removal', () => {
    expect(mined('OGN-225', 'If it is stunned, kill it.').traits).toEqual(expect.arrayContaining(['removal', 'interaction', 'stun']));
  });

  it('a token made by a paid ability is token production', () => {
    expect(mined('SFD-063', 'you may exhaust me to play a Gold gear token exhausted').traits).toContain('token');
  });

  it('bracketed [Stun] and [Buff] are valued like the plain spelling', () => {
    const punch = mined('RAD-121', '[Buff] a friendly unit and [Stun] an enemy unit.');
    expect(punch.traits).toEqual(expect.arrayContaining(['buff-producer', 'stun']));
    expect(punch.effectProfile.recognizedEffects).toEqual(expect.arrayContaining(['stun tempo', 'persistent buffs']));
    const ki = mined('RAD-028', '[Stun] a unit.');
    expect(ki.effectProfile.recognizedEffects).toContain('stun tempo');
  });
});

describe('labels', () => {
  it('every Forge trait has a label in TRAIT_LABELS', () => {
    for (const [trait, label] of Object.entries(FORGE_TRAIT_LABELS)) expect((TRAIT_LABELS as Record<string, string>)[trait]).toBe(label);
  });
});
