// Stage 3 review of the pair network: false edges found by sampling the stored network against card text,
// and pairs that top lists play together for a reason the network had no join for. Real synced rows.
import { describe, expect, it } from 'vitest';
import { toScoreCard } from '@/engine/mine';
import { analyzeCardPair, edgeForPair, judgeReason, SUPPRESSORS } from '@/engine/network';
import { reviewCard as card } from '../../helpers/review-cards';

const edge = (a: string, b: string) => edgeForPair(card(a), card(b));
const labels = (a: string, b: string) => (edge(a, b)?.reasons ?? []).map((r) => r.label);
const suppressors = (a: string, b: string) => {
  const [l, r] = [toScoreCard(card(a)), toScoreCard(card(b))].sort((x, y) => x.id.localeCompare(y.id));
  return analyzeCardPair(l!, r!).reasons.map((reason) => judgeReason(reason, l!, r!).suppressor).filter(Boolean);
};

describe('false edges removed', () => {
  it('a low-rune payoff is not fed by channelling runes (Renekton, Rage Fueled + Nasus, Guardian of Knowledge)', () => {
    expect(card('VEN-063').text).toContain('channel 1 rune exhausted');
    expect(labels('VEN-019', 'VEN-063')).not.toContain('Rune-count acceleration');
  });

  it('"When you burn a unit this way" counts only its own burn (Forgotten Relic + Kennen, Storm of Shuriken)', () => {
    expect(card('VEN-108').text).toContain('When you burn a unit this way');
    expect(labels('VEN-108', 'VEN-113')).not.toContain('Burn rewards');
    expect(suppressors('VEN-108', 'VEN-113')).toContain('own-effect-only');
    // The burn still fills the trash for Kennen's Flow grant.
    expect(labels('VEN-108', 'VEN-113')).toContain('Burn into Flow');
  });

  it('a gear with no activated ability does not feed "When you use an activated ability of a gear"', () => {
    expect(card('SFD-075').text).toContain('When you use an activated ability of a gear');
    expect(edge('SFD-075', 'UNL-085')).toBeNull();
    expect(suppressors('SFD-075', 'UNL-085')).toContain('no-activated-ability');
    // Seal of Rage and Garbage Grabber have one.
    expect(labels('SFD-075', 'OGN-040')).toContain('Gear workshop');
    expect(labels('SFD-075', 'OGN-099')).toContain('Gear workshop');
  });

  it('"When an enemy unit dies" is not fed by a sacrifice outlet, and is fed by a kill on both sides', () => {
    expect(card('UNL-145').text).toContain('when an enemy unit dies while I\'m at a battlefield');
    expect(labels('UNL-145', 'OGN-242')).not.toContain('Death engine');
    expect(suppressors('UNL-145', 'OGN-242')).toContain('death-side');
    expect(card('OGN-209').text).toContain('Each player kills one of their units.');
    expect(labels('UNL-145', 'OGN-209')).toContain('Death engine');
  });

  it('a stun payoff does not count as a stun provider (Eclipse Herald + Eclipse Herald)', () => {
    expect(labels('OGN-059', 'OGN-059')).not.toContain('Stun lock');
  });
});

describe('joins that top lists play and the network lacked', () => {
  it('a bounce or flicker of your own unit replays a "When you play me" effect', () => {
    expect(labels('UNL-128', 'OGN-199')).toContain('Replay play effects');
    const thrill = edge('UNL-184', 'OGN-199');
    expect(thrill?.reasons.find((r) => r.label === 'Replay play effects')?.detail).toContain('its owner plays it to any battlefield');
    expect(thrill?.reasons.find((r) => r.label === 'Replay play effects')?.detail).toContain('When you play me');
  });

  it('a Might boost given to a unit feeds damage equal to its Might; a boost a card gives only itself does not', () => {
    expect(card('SFD-097').text).toContain('Give a unit +5 [Might] this turn.');
    expect(card('VEN-083').text).toContain('They deal damage equal to their Mights to each other.');
    expect(labels('SFD-097', 'VEN-083')).toContain('Might as damage');
    expect(card('OGN-055').text).toContain('I have +2 [Might]');
    expect(labels('OGN-055', 'VEN-083')).not.toContain('Might as damage');
    expect(card('VEN-125').text).toContain('Ready me and give me +1 [Might] this turn.');
    expect(labels('VEN-125', 'VEN-083')).not.toContain('Might as damage');
    // Dragon's Rage makes two enemy units fight; a boost on your unit adds nothing.
    expect(card('OGN-258').text).toContain('Choose another enemy unit at its destination. They deal damage equal to their Mights to each other.');
    expect(labels('SFD-097', 'OGN-258')).not.toContain('Might as damage');
  });
});

it('the review suppressors are documented', () => {
  for (const id of ['own-effect-only', 'no-activated-ability', 'death-side']) expect(SUPPRESSORS[id], id).toBeTruthy();
});
