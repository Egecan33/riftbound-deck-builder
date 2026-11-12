// Play calibration of the mechanical rating (stage 3 review: evaluation). New code, not a port.
//
// The ported foundation rating (rating.ts) prices a card from its text with Riftfoundry's design priors.
// Measured against the synced public lists it barely followed play (Spearman 0.13 with the
// eligibility-normalised share, 2026-11-12). This file corrects the VALUE TABLE, not single cards: every
// term is a property any card can have (a type, a cost, a component of the ported ledger, a mined
// mechanic), with one coefficient for the whole pool. There is no card id and no card name here, and the
// ported rating itself is unchanged (its tests still pin it).
//
// calibrated foundation = ported foundation + sum(coefficient x term value) + CALIBRATION_INTERCEPT
//
// HEURISTIC, FITTED. The coefficients are a ridge regression of (play target - ported foundation) on the
// terms, fitted by `pnpm calibrate` on the TRAIN split only and checked on the HOLDOUT split; the numbers
// are in CALIBRATION_FIT below and in the commit message. They describe what players of this card pool
// register, as far as text features can; they are not rules facts, and they should be refitted when the
// pool or the meta moves (run `pnpm calibrate`, paste the printed table).
import type { BaseCardRatingBreakdown } from './rating-types';
import type { ScoreCard } from './types';

export interface CalibrationInput {
  card: ScoreCard;
  breakdown: BaseCardRatingBreakdown;
  traits: ReadonlySet<string>;
}

export interface CalibrationTerm {
  id: string;
  /** Shown in rating reasons. */
  label: string;
  value: (input: CalibrationInput) => number;
}

const flag = (on: boolean): number => (on ? 1 : 0);
const superType = (card: ScoreCard, name: string): boolean => (card.superTypes ?? []).some((s) => s.toLowerCase() === name);
const trait = (id: string, label: string): CalibrationTerm => ({ id: `mech:${id}`, label, value: ({ traits }) => flag(traits.has(id)) });
const component = (key: keyof BaseCardRatingBreakdown, label: string): CalibrationTerm => ({
  id: `value:${String(key)}`, label, value: ({ breakdown }) => Number(breakdown[key]) || 0,
});

/**
 * Every term the fit may use. `pnpm calibrate` fits all of them and keeps the ones whose effect is large
 * enough to matter; a term without an entry in CALIBRATION_COEFFICIENTS contributes nothing.
 */
export const CALIBRATION_TERMS: readonly CalibrationTerm[] = [
  // Card type and supertype.
  { id: 'type:spell', label: 'spell', value: ({ card }) => flag(card.type === 'spell') },
  { id: 'type:gear', label: 'gear', value: ({ card }) => flag(card.type === 'gear') },
  { id: 'super:signature', label: 'signature card', value: ({ card }) => flag(superType(card, 'signature')) },
  { id: 'super:champion', label: 'champion unit', value: ({ card }) => flag(superType(card, 'champion')) },
  // Costs: the ported penalties (negative numbers), so a negative coefficient removes part of a penalty.
  component('energyCost', 'Energy cost penalty'),
  component('powerCost', 'Power cost penalty'),
  component('highCostRisk', 'high-cost risk'),
  { id: 'cost:cheap', label: 'costs 2 Energy or less', value: ({ card }) => flag((card.energy ?? 0) <= 2) },
  { id: 'cost:top', label: 'costs 6 Energy or more', value: ({ card }) => flag((card.energy ?? 0) >= 6) },
  { id: 'cost:free-power', label: 'no Power cost', value: ({ card }) => flag((card.power ?? 0) === 0) },
  // Components of the ported ledger: a coefficient rescales what the port credits for that kind of value.
  component('printedStrength', 'printed Might'),
  component('expectedStrength', 'conditional Might'),
  component('effectValue', 'rules-text utility'),
  component('cardAdvantage', 'card advantage'),
  component('boardControl', 'board control'),
  component('battlefieldControl', 'battlefield control'),
  component('resourceValue', 'resource conversion'),
  component('costsAndDrawbacks', 'costs and drawbacks'),
  { id: 'value:utility', label: 'flexibility, role and reliability credit', value: ({ breakdown }) => breakdown.flexibility + breakdown.roleUtility + breakdown.reliability },
  { id: 'value:conditionality', label: 'conditional text', value: ({ breakdown }) => 1 - breakdown.activationFactor },
  { id: 'stat:efficiency', label: 'Might above Energy cost', value: ({ card }) => (card.type === 'unit' ? Math.max(-3, Math.min(3, (card.might ?? 0) - (card.energy ?? 0))) : 0) },
  // Mined mechanics (keywords and effect families).
  trait('reaction', 'Reaction speed'), trait('action', 'Action speed'), trait('hidden', 'Hidden'),
  trait('accelerate', 'Accelerate'), trait('ganking', 'Ganking'), trait('deflect', 'Deflect'),
  trait('assault', 'Assault'), trait('tank', 'Tank'), trait('shield', 'Shield'), trait('temporary', 'Temporary'),
  trait('ambush', 'Ambush'), trait('deploy', 'Deploy'), trait('equipment', 'Equipment'), trait('weaponmaster', 'Weaponmaster'),
  trait('hunt', 'Hunt'), trait('level', 'Level'), trait('empower', 'Empower'), trait('empowered-payoff', 'Empowered payoff'),
  trait('legion', 'Legion'), trait('vision', 'Vision'), trait('flow', 'Flow'), trait('repeat', 'Repeat'),
  trait('might-reduction', 'enemy Might reduction'), trait('might-boost', 'Might boost'), trait('might-damage', 'Might as damage'),
  trait('draw', 'card draw'), trait('predict', 'Predict'), trait('discard', 'discard outlet'), trait('recycle', 'recycle'),
  trait('removal', 'removal'), trait('damage-provider', 'damage'), trait('sweeper', 'mass removal'), trait('stun', 'stun'),
  trait('counter', 'countermagic'), trait('interaction', 'interaction'), trait('gear-removal', 'gear removal'),
  trait('movement', 'movement'), trait('movement-payoff', 'movement payoff'), trait('ready', 'ready'), trait('exhaust', 'exhaust'),
  trait('token', 'token maker'), trait('wide', 'go wide'), trait('scoring', 'conquer / scoring'), trait('conquer', 'conquer payoff'),
  trait('hold', 'hold payoff'), trait('point-gain', 'direct points'),
  trait('cost-reduction', 'cost reduction'), trait('cost-cheat', 'cost cheat'), trait('energy-ramp', 'Energy ramp'), trait('channel-rune', 'rune channel'),
  trait('death', 'death matters'), trait('death-payoff', 'death payoff'), trait('death-enabler', 'death enabler'),
  trait('trash-payoff', 'trash payoff'), trait('banish-enabler', 'banish enabler'), trait('replay-unit', 'replay a unit'),
  trait('play-effect', 'play effect'), trait('hidden-matters', 'Hidden payoff'),
  trait('spell-matters', 'spell payoff'), trait('gear-matters', 'gear payoff'), trait('equipment-matters', 'Equipment payoff'),
  trait('buff-producer', 'buff producer'), trait('buff-consumer', 'buff payoff'),
];

/*CALIBRATION-TABLE-START*/
export const CALIBRATION_INTERCEPT = -0.428;
export const CALIBRATION_COEFFICIENTS: Readonly<Record<string, number>> = {
  'super:signature': 1.029,
  'value:highCostRisk': -0.971,
  'value:utility': 0.531,
  'mech:equipment-matters': -0.522,
  'mech:buff-consumer': -0.477,
  'mech:deploy': 0.455,
  'mech:flow': 0.384,
  'mech:shield': 0.356,
  'mech:removal': 0.333,
  'mech:hidden': 0.3,
  'mech:death': 0.286,
  'type:spell': 0.263,
  'mech:reaction': 0.251,
  'super:champion': 0.244,
  'value:powerCost': -0.235,
  'mech:damage-provider': -0.223,
  'type:gear': 0.221,
  'mech:action': 0.211,
  'value:printedStrength': -0.112,
  'cost:cheap': 0.1,
};
/** The fit that produced the table: Spearman of the rating with the eligibility-normalised share, before -> after. */
export const CALIBRATION_FIT = {
  fittedOn: '2026-11-12', lists: 789, trainLists: 574, holdoutLists: 215,
  trainCards: 647, lambda: 1,
  spearmanTrain: [0.177, 0.43], spearmanHoldoutLists: [0.14, 0.289], spearmanHoldoutListsAndCards: [0.081, 0.228],
} as const;
/*CALIBRATION-TABLE-END*/

/** Largest total correction, in foundation points (about 2..8.5 scale). HEURISTIC guard against a runaway sum. */
export const CALIBRATION_MAX_SHIFT = 2.5;

export interface CalibrationResult {
  /** Calibrated foundation, same scale and clamps as the ported one. */
  total: number;
  /** Sum of the term contributions and the intercept, after the guard. */
  shift: number;
  /** Non-zero contributions, largest first. */
  terms: { id: string; label: string; value: number }[];
}

/** Applies the fitted table. Main-deck cards only: legends and battlefields keep the ported rating. */
export function calibrateFoundation(
  input: CalibrationInput,
  coefficients: Readonly<Record<string, number>> = CALIBRATION_COEFFICIENTS,
  intercept: number = CALIBRATION_INTERCEPT,
): CalibrationResult {
  const base = input.breakdown.total;
  if (!['unit', 'spell', 'gear'].includes(input.card.type)) return { total: base, shift: 0, terms: [] };
  const terms: CalibrationResult['terms'] = [];
  let sum = intercept;
  for (const term of CALIBRATION_TERMS) {
    const coef = coefficients[term.id];
    if (!coef) continue;
    const value = coef * term.value(input);
    if (Math.abs(value) < 0.005) continue;
    sum += value;
    terms.push({ id: term.id, label: term.label, value: Math.round(value * 100) / 100 });
  }
  const shift = Math.max(-CALIBRATION_MAX_SHIFT, Math.min(CALIBRATION_MAX_SHIFT, sum));
  terms.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return { total: Math.round(Math.max(1.5, Math.min(9.8, base + shift)) * 100) / 100, shift: Math.round(shift * 100) / 100, terms };
}
