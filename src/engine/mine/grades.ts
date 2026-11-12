// Ported from Riftfoundry apps/web/src/lib/scoring.ts at origin/main 4b90179 (lines 288-354): tier grades and scored-card predicates.
// Port rule (spec 8.1): behaviour unchanged; top-level declarations are exported so the split files can share them.
import {
  baseCardRating,
} from "./rating";
import {
  type ScoreCard,
} from "./types";

export const CARD_TIER_GRADES = [
  "SSS+",
  "SSS",
  "SS",
  "S",
  "A",
  "B",
  "C",
  "D",
  "F",
] as const;

export type CardTierGrade = (typeof CARD_TIER_GRADES)[number];

/**
 * Fixed theory-grade boundaries for the deterministic foundation prior.
 *
 * These are deliberately not tournament percentiles: a card's grade remains
 * stable when a set is added, while evidence contributes a
 * separate, bounded correction to the final card and deck scores.
 */
export const CARD_TIER_THRESHOLDS: Readonly<
  Record<Exclude<CardTierGrade, "F">, number>
> = {
  "SSS+": 6.86,
  SSS: 6.14,
  SS: 5.81,
  S: 5.49,
  A: 5.19,
  B: 4.91,
  C: 4.18,
  D: 3.14,
};

export function cardTierGrade(score: number): CardTierGrade {
  if (!Number.isFinite(score)) return "F";
  if (score >= CARD_TIER_THRESHOLDS["SSS+"]) return "SSS+";
  if (score >= CARD_TIER_THRESHOLDS.SSS) return "SSS";
  if (score >= CARD_TIER_THRESHOLDS.SS) return "SS";
  if (score >= CARD_TIER_THRESHOLDS.S) return "S";
  if (score >= CARD_TIER_THRESHOLDS.A) return "A";
  if (score >= CARD_TIER_THRESHOLDS.B) return "B";
  if (score >= CARD_TIER_THRESHOLDS.C) return "C";
  if (score >= CARD_TIER_THRESHOLDS.D) return "D";
  return "F";
}

export const FOUNDATION_SCORE_CARD_TYPES = new Set([
  "unit",
  "spell",
  "gear",
  "legend",
  "battlefield",
]);

export function isScoredCard(card: Pick<ScoreCard, "type">): boolean {
  return FOUNDATION_SCORE_CARD_TYPES.has(card.type);
}

export function isMainDeckScoreCard(card: Pick<ScoreCard, "type">): boolean {
  return ["unit", "spell", "gear"].includes(card.type);
}

export function foundationGradeForCard(card: ScoreCard): CardTierGrade | null {
  return isScoredCard(card) ? cardTierGrade(baseCardRating(card)) : null;
}
