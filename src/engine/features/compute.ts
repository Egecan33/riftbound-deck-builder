// CardFeatures of one card (spec 8.3): the mined part (plan Task 4) plus roles and axes (plan Task 5). Pure.
import { evaluate } from '../evidence/blend';
import { isMainDeckCard } from '../evidence/play';
import { isSignature } from '../rules/champion';
import { mineCard, ownsKeyword, toScoreCard, type MineOverride, type MinedCard } from '../mine';
import type { Card, CardFeatures, PlayEvidence, Speed } from '../types';
import { axesOf } from './axes';
import { rolesOf } from './roles';

/** Reaction beats Action when a card has both (Quick-Draw gear is reaction speed, CR 819). */
export function speedOf(card: Card): Speed {
  const score = toScoreCard(card);
  if (ownsKeyword(score, 'reaction') || ownsKeyword(score, 'quick-draw')) return 'reaction';
  if (ownsKeyword(score, 'action')) return 'action';
  return 'normal';
}

export interface EvidenceContext {
  /** Measured play of this card, or null/undefined when no synced list could run it. */
  evidence?: PlayEvidence | null;
  /** Readable name of the evidence's peak legend, for the reason text. */
  peakLegendName?: string;
}

const signed = (n: number): string => `${n >= 0 ? '+' : ''}${n.toFixed(2)}`;

/** The mechanical half of the rating reasons: ported text rating, then what the play calibration moved. */
export function mechanicalReason(card: Card, mined: MinedCard): string {
  if (mined.foundation === null || mined.calibration === null) return `${card.name} is not rated: the mine scores units, spells, gear, legends and battlefields with complete data.`;
  const terms = mined.calibration.terms.slice(0, 4).map((t) => `${t.label} ${signed(t.value)}`).join(', ');
  const moved = mined.calibration.terms.length
    ? `; play calibration ${signed(mined.calibration.shift)} (${terms}${mined.calibration.terms.length > 4 ? ', ...' : ''}; fitted heuristic)`
    : '';
  return `Mechanical rating of ${card.name}: ${mined.baseRating} (grade ${mined.grade}). Text rating ${mined.foundation.toFixed(2)} on the 2-8.5 scale${moved}. No play data of the card itself is in this number.`;
}

/**
 * @param override reviewed mine correction of sync-data/card-overrides.json for this card
 * @param tags tribe tags that get a `tag:` axis (see axisTagsOf); default: the ported tribal list
 * @param context measured play evidence; without it the evaluated rating is the mechanical rating
 */
export function computeFeatures(card: Card, override?: MineOverride, tags?: readonly string[], context: EvidenceContext = {}): CardFeatures {
  const mined = mineCard(card, override);
  const scored = mined.foundation !== null;
  // Play evidence is defined for main-deck cards only (a legend's or battlefield's play is in the meta rows).
  const evidence = scored && isMainDeckCard(card) ? context.evidence ?? null : null;
  const evaluation = evaluate(mined.baseRating, evidence, context.peakLegendName, { signature: isSignature(card) });
  return {
    id: card.id,
    traits: mined.traits,
    baseRating: mined.baseRating,
    grade: mined.grade ?? '',
    roles: rolesOf(card, mined.traits),
    speed: speedOf(card),
    axes: axesOf(card, mined.traits, tags),
    costBucket: Math.max(0, Math.min(7, card.energy ?? 0)),
    unparsed: mined.unparsed,
    evaluatedRating: evaluation.evaluatedRating,
    evidence,
    ratingReasons: scored ? [mechanicalReason(card, mined), evaluation.reason] : [mechanicalReason(card, mined)],
  };
}
