// Evaluated rating = mechanical rating shrunk toward the play evidence, in proportion to sample size. Pure.
//
// Shape taken from Riftfoundry's tournament calibration (calibration.json `priorOpportunities: 20`): the
// evidence of n lists counts n / (n + prior). Riftfoundry only added a small bonus (cap 0.15 on its
// 2..8.5 scale, never negative); here a well-evidenced card that nobody runs also falls, because the
// review found the mechanical rating alone does not separate staples from duds.
import type { PlayEvidence } from '../types';
import { playScoreOf } from './play';

/** HEURISTIC constants of the blend. */
export const BLEND = {
  /** Pseudo-lists at the mechanical rating (Riftfoundry's priorOpportunities). nEff = 20 gives the evidence half of maxWeight. */
  priorLists: 20,
  /** The evidence never takes more than this share of the evaluated rating: the card's text always counts. */
  maxWeight: 0.8,
  /** Rating (0..100) the evidence says for a card no eligible list runs, and for a card every eligible list runs. */
  unplayedRating: 30,
  stapleRating: 90,
  /** Half-saturation of the play score: a 15% share is already halfway from unplayed to staple. */
  halfShare: 0.15,
  /**
   * Signature cards whose only eligible lists are one legend's (CR 103.2.d: only that champion's legend can
   * run them). Every list of the legend chose for or against the card, so each list says more than a list
   * of a format-wide pool: a smaller prior, and the share read linearly (a signature in 1 of 19 of its own
   * legend's lists is a card the legend passes on, not "halfway to a staple"). Calibration 2026-11-12:
   * 'super:signature' plus the 20-list prior kept Lilting Lullaby at 73 with 1 of 19 lists.
   */
  signaturePriorLists: 3,
} as const;

/** Options of the blend that depend on the card, not on the evidence. */
export interface EvaluateOptions { signature?: boolean }

/** True when the evidence is a signature card's own legend only: the case the stronger pull applies to. */
export const isSingleLegendSignature = (evidence: Pick<PlayEvidence, 'eligibleLegends'> | null, opts: EvaluateOptions = {}): boolean =>
  !!opts.signature && !!evidence && evidence.eligibleLegends === 1;

/** 0..1, concave: the step from 0% to 15% of lists says more about a card than the step from 60% to 75%. */
export const playCurve = (score: number): number => {
  const s = Math.max(0, Math.min(1, score));
  return (s * (1 + BLEND.halfShare)) / (s + BLEND.halfShare);
};

/** The rating (0..100) the evidence alone would give. Monotonic in share and in the peak share. */
export const evidenceRatingOf = (evidence: Pick<PlayEvidence, 'share' | 'peak'> & Partial<Pick<PlayEvidence, 'eligibleLegends'>>, opts: EvaluateOptions = {}): number =>
  BLEND.unplayedRating + (BLEND.stapleRating - BLEND.unplayedRating) * (
    isSingleLegendSignature(evidence as PlayEvidence, opts) ? Math.max(0, Math.min(1, evidence.share)) : playCurve(playScoreOf(evidence)));

/** Weight of the evidence, 0..maxWeight: 0 with no data, rising with the effective sample size. */
export const evidenceWeightOf = (evidence: Pick<PlayEvidence, 'nEff'> & Partial<Pick<PlayEvidence, 'eligibleLegends'>> | null, opts: EvaluateOptions = {}): number => {
  if (!evidence || !(evidence.nEff > 0)) return 0;
  const prior = isSingleLegendSignature(evidence as PlayEvidence, opts) ? BLEND.signaturePriorLists : BLEND.priorLists;
  return BLEND.maxWeight * (evidence.nEff / (evidence.nEff + prior));
};

export interface Evaluation { evaluatedRating: number; evidenceRating: number | null; weight: number; reason: string }

const pct = (x: number): string => `${Math.round(x * 100)}%`;

/**
 * @param baseRating mechanical rating, 0..100
 * @param legendName readable name of the peak legend, when the caller has it
 * @param opts signature: the card is a signature card (stronger pull when only its legend's lists are eligible)
 */
export function evaluate(baseRating: number, evidence: PlayEvidence | null, legendName?: string, opts: EvaluateOptions = {}): Evaluation {
  if (!evidence || evidence.eligibleLists === 0) {
    return { evaluatedRating: baseRating, evidenceRating: null, weight: 0, reason: 'No play data: no synced list could run this card. The evaluated rating is the mechanical rating.' };
  }
  const weight = evidenceWeightOf(evidence, opts);
  const target = evidenceRatingOf(evidence, opts);
  const own = isSingleLegendSignature(evidence, opts) ? ' Signature card: only its legend can run it, so every eligible list chose for or against it and the evidence counts more.' : '';
  const evaluatedRating = Math.max(0, Math.min(100, Math.round(baseRating + weight * (target - baseRating))));
  const peak = evidence.peak && evidence.peak.share * 0.999 > evidence.share
    ? `; most in ${legendName ?? 'one legend'} (${evidence.peak.lists} of ${evidence.peak.of} lists)` : '';
  const era = evidence.banned ? ' Banned now: these are its lists from before the ban.' : evidence.eraWeight < 0.75 ? ' Mostly lists from before the current rules era.' : '';
  const direction = evaluatedRating > baseRating ? 'raises' : evaluatedRating < baseRating ? 'lowers' : 'keeps';
  const reason =
    `Measured play (data, not rules): in ${evidence.lists} of ${evidence.eligibleLists} lists that could run it, weighted share ${pct(evidence.share)}${peak}. ` +
    `Evidence weight ${pct(weight)} at an effective sample of ${Math.round(evidence.nEff)} lists ${direction} the mechanical ${baseRating} to ${evaluatedRating}.${own}${era}`;
  return { evaluatedRating, evidenceRating: Math.round(target), weight: Math.round(weight * 1000) / 1000, reason };
}
