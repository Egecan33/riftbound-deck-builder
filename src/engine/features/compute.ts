// CardFeatures of one card (spec 8.3): the mined part (plan Task 4) plus roles and axes (plan Task 5). Pure.
import { mineCard, ownsKeyword, toScoreCard, type MineOverride } from '../mine';
import type { Card, CardFeatures, Speed } from '../types';
import { axesOf } from './axes';
import { rolesOf } from './roles';

/** Reaction beats Action when a card has both (Quick-Draw gear is reaction speed, CR 819). */
export function speedOf(card: Card): Speed {
  const score = toScoreCard(card);
  if (ownsKeyword(score, 'reaction') || ownsKeyword(score, 'quick-draw')) return 'reaction';
  if (ownsKeyword(score, 'action')) return 'action';
  return 'normal';
}

/**
 * @param override reviewed mine correction of sync-data/card-overrides.json for this card
 * @param tags tribe tags that get a `tag:` axis (see axisTagsOf); default: the ported tribal list
 */
export function computeFeatures(card: Card, override?: MineOverride, tags?: readonly string[]): CardFeatures {
  const mined = mineCard(card, override);
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
  };
}
