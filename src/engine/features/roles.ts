// Roles of a card (spec 8.3), derived from the mined traits of plan Task 4. New code.
//
// HEURISTIC: a role is a reading of traits, not an official category. No pattern runs over card text here;
// where a role had no trait to rest on (mass removal, gear removal, direct points) the trait was added to the
// mine (src/engine/mine/radiance.ts, traits.ts) with a test.
import type { Card, Role } from '../types';

export const ROLES: readonly Role[] = [
  'unit-body', 'removal', 'sweeper', 'combat-trick', 'protection', 'counter', 'card-flow', 'rune-ramp', 'mobility',
  'token-maker', 'buff-source', 'recursion', 'disruption', 'finisher', 'point-source', 'gear', 'hate',
];

export const ROLE_LABELS: Record<Role, string> = {
  'unit-body': 'Unit', removal: 'Removal', sweeper: 'Sweeper', 'combat-trick': 'Combat trick', protection: 'Protection',
  counter: 'Counter', 'card-flow': 'Card flow', 'rune-ramp': 'Rune ramp', mobility: 'Mobility', 'token-maker': 'Token maker',
  'buff-source': 'Buff source', recursion: 'Recursion', disruption: 'Disruption', finisher: 'Finisher',
  'point-source': 'Point source', gear: 'Gear', hate: 'Hate',
};

/** HEURISTIC cut-offs for "finisher": a unit this expensive and this large ends games by itself. */
export const FINISHER_ENERGY = 6;
export const FINISHER_MIGHT = 6;

/**
 * @param traits mined trait ids of the card (CardFeatures.traits or deriveTraits)
 * Main-deck cards only get roles; a legend, battlefield or rune has none.
 */
export function rolesOf(card: Card, traits: Iterable<string>): Role[] {
  const t = traits instanceof Set ? (traits as Set<string>) : new Set(traits);
  const has = (...ids: string[]): boolean => ids.some((id) => t.has(id));
  const unit = card.type === 'unit';
  const spell = card.type === 'spell';
  const gear = card.type === 'gear';
  if (!unit && !spell && !gear) return [];
  const fast = has('action', 'reaction');
  const roles = new Set<Role>();

  if (unit) roles.add('unit-body');
  if (gear) roles.add('gear');
  // Damage aimed at an enemy unit is removal in this game: damage that reaches Might kills (CR 140).
  if (has('removal', 'damage-provider')) roles.add('removal');
  if (has('sweeper')) roles.add('sweeper');
  // A fast spell that changes Might or prevents damage for a turn; Quick-Draw gear attaches at Reaction speed.
  if ((spell && fast && has('might-boost', 'might-reduction', 'damage-prevention', 'bonus-damage')) || (gear && has('quick-draw') && has('might-boost'))) roles.add('combat-trick');
  // On a unit, Deflect/Shield/Tank protect that unit only; on a spell or gear they are given to something
  // (a token maker is left out: there the keyword belongs to the token).
  if (has('damage-prevention', 'protection', 'death-prevention') || (!unit && !has('token') && has('deflect', 'shield', 'tank'))) roles.add('protection');
  if (has('counter')) roles.add('counter');
  if (has('draw')) roles.add('card-flow');
  if (has('channel-rune', 'energy-ramp')) roles.add('rune-ramp');
  if (has('movement', 'ganking', 'placement')) roles.add('mobility');
  if (has('token')) roles.add('token-maker');
  if (has('buff-producer')) roles.add('buff-source');
  if (has('trash-retrieval', 'flow')) roles.add('recursion');
  if (has('stun', 'lock', 'disarm', 'burn-opponent')) roles.add('disruption');
  if (has('skip', 'lethal-damage-conversion') || (unit && (card.energy ?? 0) >= FINISHER_ENERGY && (card.might ?? 0) >= FINISHER_MIGHT)) roles.add('finisher');
  if (has('point-gain')) roles.add('point-source');
  if (has('gear-removal')) roles.add('hate');
  return ROLES.filter((r) => roles.has(r));
}
