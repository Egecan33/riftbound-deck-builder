// mineCard and the coverage report. New code on top of the ported mine; nothing here changes a rating.
import type { Card } from '../types';
import { toScoreCard } from './adapter';
import { calibrateFoundation, type CalibrationResult } from './calibration';
import { cardTierGrade, isScoredCard, type CardTierGrade } from './grades';
import type { Trait } from './labels';
import { baseCardRatingBreakdown } from './rating';
import type { BaseCardMechanicContribution, BaseCardRatingAxes } from './rating-types';
import { deriveTraits } from './traits';
import type { ScoreCard } from './types';

/** Traits that only restate the card type. A card whose traits are all of these has no mined mechanic. */
export const TYPE_TRAITS: ReadonlySet<string> = new Set(['unit', 'spell', 'gear', 'equipment', 'unit-gear']);

/**
 * HEURISTIC scale. The ported foundation rating runs from about 2 to 8.5 (grade thresholds 3.14 = D to
 * 6.86 = SSS+). CardFeatures.baseRating is 0..100: calibrated foundation x 12, clamped. The grade is taken
 * from the calibrated foundation itself (calibration.ts), never from the 0..100 number.
 */
export const BASE_RATING_SCALE = 12;
export const toBaseRating100 = (foundation: number): number =>
  Math.max(0, Math.min(100, Math.round(foundation * BASE_RATING_SCALE)));

export interface EffectProfile {
  /** Effect families the rating recognised (ported `recognizedEffects`). */
  recognizedEffects: string[];
  /** Each mechanic's contribution with its component, value, activation and a readable detail. */
  mechanics: BaseCardMechanicContribution[];
  axes: BaseCardRatingAxes;
  /** The numeric ledger of the ported breakdown (typeBaseline, effectValue, cardAdvantage, ...). */
  components: Record<string, number>;
}

export interface MinedCard {
  id: string;
  traits: Trait[];
  /** Ported foundation rating (about 2..8.5); null for cards the mine does not score (runes, typeless rows). */
  foundation: number | null;
  /**
   * Foundation after the play calibration of calibration.ts (same scale); equal to `foundation` for legends
   * and battlefields. This is the mechanical rating: text only, no play data of the card itself.
   */
  calibratedFoundation: number | null;
  /** The calibration terms that moved the rating; null when not scored. */
  calibration: CalibrationResult | null;
  /** 0..100 from the calibrated foundation, see BASE_RATING_SCALE; 0 when not scored. */
  baseRating: number;
  /** Tier grade of the calibrated foundation. */
  grade: CardTierGrade | null;
  /** Sentences of the current text that produced no trait and no recognised effect. */
  unparsed: string[];
  effectProfile: EffectProfile;
}

/** A reviewed correction from sync-data/card-overrides.json (`mine` section). */
export interface MineOverride { addTraits?: string[]; removeTraits?: string[]; noMechanic?: boolean; reason: string }

/** Sentences as the mine sees them: reminder text removed, one per line or full stop. Original case kept. */
export function mineSentences(rulesText: string): string[] {
  return rulesText
    .replaceAll(/\([^)]*\)/g, ' ')
    .replaceAll(/\r/g, '\n')
    .split(/(?:\n+|[.!?;]+\s*)/)
    .map((s) => s.replaceAll(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((s) => !/^\[(?:reaction|action)\]$/i.test(s));
}

/**
 * Sentences that carry no effect of their own: a target or mode declaration whose effect is the next
 * sentence ("Choose a unit.", "Choose one —"), an optional-cost or use-restriction rider ("You may pay
 * [C] as an additional cost to play me.", "Use only once per turn."), and formatting debris from the
 * gallery text. They are counted apart from unparsed sentences: no family could match them in isolation.
 */
const STRUCTURAL: readonly RegExp[] = [
  /^(?:when [^,]+, |then,? )?(?:you may )?choose (?:a|an|another|one|two|up to|any)\b(?![^]*\b(?:banish|kill|play|put|draw|deal|give|return|move|ready|exhaust|stun|buff|recycle|discard)\b)[^]*$/i,
  /^choose (?:one|two)\b[^]*—$/i,
  /^(?:when|as) [^,]+, choose (?:one|two)\b[^]*—$/i,
  /^(?:as you play (?:this|me), |if [^,]+, )?you may pay (?:\[[^\]]+\])+ as an additional cost(?: to play (?:me|this))?$/i,
  /^as an additional cost to play (?:this|me), pay [^]*$/i,
  /^(?:use|spend) (?:this (?:ability|energy|power) )?only\b[^]*$/i,
  /^each player may use this ability once on their turn$/i,
  /^do (?:one of )?the following based on [^]*:$/i,
  /^then,? do the following based on [^]*:$/i,
  /^(?:"|\d+|disa|action|hidden|reaction)$/i,
];

export const isStructuralSentence = (sentence: string): boolean => STRUCTURAL.some((p) => p.test(sentence));

const probeCache = new Map<string, boolean>();

/** The rating's catch-all label for text no effect family matched. It does not count as recognition. */
export const FALLBACK_EFFECT = 'situational rules-text utility';

/**
 * True when the mine gets something out of this sentence on its own, compared with the same card with no
 * text: a trait beyond the card type, or a recognised effect family other than the catch-all fallback.
 * A typeless (incomplete) row is probed as a unit when it has Might, else as a spell.
 */
export function sentenceRecognised(card: ScoreCard, sentence: string): boolean {
  const type = card.type || (card.might !== null ? 'unit' : 'spell');
  const key = `${type}|${card.tags.join(',')}|${card.energy}|${card.power}|${card.might}|${sentence}`;
  const held = probeCache.get(key);
  if (held !== undefined) return held;
  const probe = (rulesText: string): ScoreCard => ({ ...card, type, id: `${card.id}#probe`, rulesText, accessibilityText: undefined });
  const blank = probe('');
  // A modal option is probed without its bullet, as the sentence it is.
  const withText = probe(sentence.replace(/^[*•-]\s+/, ''));
  const blankTraits = deriveTraits(blank);
  let recognised = [...deriveTraits(withText)].some((t) => !blankTraits.has(t) && t !== 'action' && t !== 'reaction');
  if (!recognised && isScoredCard(withText)) {
    const before = baseCardRatingBreakdown(blank);
    const after = baseCardRatingBreakdown(withText);
    const blankEffects = new Set(before.recognizedEffects);
    recognised =
      after.recognizedEffects.some((e) => e !== FALLBACK_EFFECT && !blankEffects.has(e)) ||
      // A drawback or cost the rating priced ("This enters exhausted.") is read text too.
      Math.abs(after.costsAndDrawbacks - before.costsAndDrawbacks) >= 0.01;
  }
  if (probeCache.size > 20000) probeCache.clear();
  probeCache.set(key, recognised);
  return recognised;
}

export function unparsedSentences(card: ScoreCard): string[] {
  return mineSentences(card.rulesText).filter((s) => !isStructuralSentence(s) && !sentenceRecognised(card, s));
}

export function mineScoreCard(card: ScoreCard, override?: MineOverride): MinedCard {
  const traits = new Set<string>(deriveTraits(card));
  for (const t of override?.addTraits ?? []) traits.add(t);
  for (const t of override?.removeTraits ?? []) traits.delete(t);
  const scored = isScoredCard(card);
  const breakdown = scored ? baseCardRatingBreakdown(card) : null;
  const components: Record<string, number> = {};
  if (breakdown) for (const [k, v] of Object.entries(breakdown)) if (typeof v === 'number') components[k] = v;
  const calibration = breakdown ? calibrateFoundation({ card, breakdown, traits }) : null;
  return {
    id: card.id,
    traits: [...traits].sort() as Trait[],
    foundation: breakdown ? breakdown.total : null,
    calibratedFoundation: calibration ? calibration.total : null,
    calibration,
    baseRating: calibration ? toBaseRating100(calibration.total) : 0,
    grade: calibration ? cardTierGrade(calibration.total) : null,
    unparsed: unparsedSentences(card),
    effectProfile: {
      recognizedEffects: breakdown ? [...breakdown.recognizedEffects] : [],
      mechanics: breakdown ? breakdown.mechanics.map((m) => ({ ...m })) : [],
      axes: breakdown ? { ...breakdown.axes } : { standaloneFloor: 0, synergyCeiling: 0, interactionFlexibility: 0, deckBuildingTax: 0, activationReliability: 0 },
      components,
    },
  };
}

export const mineCard = (card: Card, override?: MineOverride): MinedCard => mineScoreCard(toScoreCard(card), override);

