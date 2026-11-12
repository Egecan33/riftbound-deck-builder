// Generator profiles. Ported from Riftfoundry apps/web/src/lib/theory-decks.ts (origin/main 4b90179),
// CONCRETE_PROFILES: the weights the generator scores a candidate with and its copy and quota numbers.
//
// What changed in the port:
// - Riftfoundry picked a profile by building every one and keeping the best. Forge has measured archetypes
//   (targets.ts, 406 public lists), so the profile follows the archetype the deck's targets resolve to.
// - The curve, type and role RANGES of a profile are not ported: Forge's measured bands (targetsFor) replace
//   them, because the rating compares the deck with those bands. Kept from each profile: the candidate
//   weights, the interactive-spell and small-drop quotas (used as floors next to the measured bands) and the
//   top-end copy rule.
// Every number here is HEURISTIC (hand-set in Riftfoundry, never fitted to results).
import type { Archetype } from '../targets';

export type ProfileId = 'aggro' | 'tempo' | 'midrange' | 'control' | 'combo';

export interface BuildProfile {
  id: ProfileId;
  title: string;
  strategy: string;
  /** Weight of a stored pair with a build-around card. */
  anchorWeight: number;
  /** Utility lost per Power pip of the candidate. */
  powerPenalty: number;
  /** Interactive spells the generator secures before the free fill. */
  interactiveSpells: number;
  /** Units costing 2-4 Energy the generator secures before the free fill. */
  smallDrops: number;
  /** Copies of a 6+ Energy card that is not a build-around card. */
  topEndCopies: number;
  /** Cards sharing the legend's identity secured first. */
  identityCards: number;
}

export const PROFILES: Record<ProfileId, BuildProfile> = {
  aggro: {
    id: 'aggro', title: 'Aggro Pressure',
    strategy: 'Claims battlefields early with redundant small units, then converts board presence into a short closing window.',
    anchorWeight: 1.9, powerPenalty: 0.62, interactiveSpells: 6, smallDrops: 12, topEndCopies: 1, identityCards: 1,
  },
  tempo: {
    id: 'tempo', title: 'Tempo Edge',
    strategy: 'Deploys efficient threats while interaction and movement keep the initiative on contested battlefields.',
    anchorWeight: 1.75, powerPenalty: 0.48, interactiveSpells: 8, smallDrops: 10, topEndCopies: 1, identityCards: 1,
  },
  midrange: {
    id: 'midrange', title: 'Midrange Value',
    strategy: 'Uses reliable early plays to bridge into sturdy four- and five-Energy cards that win exchanges.',
    anchorWeight: 1.55, powerPenalty: 0.38, interactiveSpells: 6, smallDrops: 9, topEndCopies: 1, identityCards: 1,
  },
  control: {
    id: 'control', title: 'Control Finish',
    strategy: 'Meets the opponent with removal and defensive exchanges, then wins with a small number of durable threats.',
    anchorWeight: 1.35, powerPenalty: 0.32, interactiveSpells: 10, smallDrops: 9, topEndCopies: 2, identityCards: 1,
  },
  combo: {
    id: 'combo', title: 'Combo Engine',
    strategy: 'Assembles enabler and payoff links around its key cards, with redundant copies and a fair-game fallback.',
    anchorWeight: 3.2, powerPenalty: 0.42, interactiveSpells: 6, smallDrops: 9, topEndCopies: 1, identityCards: 2,
  },
};

/** HEURISTIC mapping of the measured archetypes (targets.ts) to the ported generator profiles. */
export const PROFILE_OF_ARCHETYPE: Record<Archetype, ProfileId> = {
  'unit-aggro': 'aggro', 'spell-tempo': 'tempo', 'gear-engine': 'combo', 'big-control': 'control', any: 'midrange',
};

export const profileFor = (archetype: Archetype): BuildProfile => PROFILES[PROFILE_OF_ARCHETYPE[archetype] ?? 'midrange'];
