// `features` step. Plan Task 4 (card mine) fills `card_features` with the mined traits, the base rating, the
// grade and the unparsed sentences of every card. Roles, axes, edges and legend profiles are plan Task 5:
// until it lands, `roles` is empty and `axes` is {}.
import { mineCard, mineOverridesById, ownsKeyword, toScoreCard, coverage, type MineOverride, type MineOverrideEntry } from '@/engine/mine';
import type { Card, CardFeatures, Speed } from '@/engine/types';
import { loadCards } from '@/server/carddb';
import { writeSyncState, type Db } from '@/server/db';
import { readOverridesFile } from '@/server/syncdata';
import type { Log } from './cards';

/** Reaction beats Action when a card has both (Quick-Draw gear is reaction speed, CR 819). */
function speedOf(card: Card): Speed {
  const score = toScoreCard(card);
  if (ownsKeyword(score, 'reaction') || ownsKeyword(score, 'quick-draw')) return 'reaction';
  if (ownsKeyword(score, 'action')) return 'action';
  return 'normal';
}

/** The mined part of CardFeatures for every card. Pure: the same cards and overrides give the same rows. */
export function computeFeatures(cards: readonly Card[], overrides: Readonly<Record<string, MineOverride>> = {}): CardFeatures[] {
  return cards.map((card) => {
    const mined = mineCard(card, overrides[card.id]);
    return {
      id: card.id,
      traits: mined.traits,
      baseRating: mined.baseRating,
      grade: mined.grade ?? '',
      roles: [],
      speed: speedOf(card),
      axes: {} as CardFeatures['axes'],
      costBucket: Math.max(0, Math.min(7, card.energy ?? 0)),
      unparsed: mined.unparsed,
    };
  });
}

export function syncFeatures(db: Db, log: Log): void {
  const cards = loadCards(db);
  const entries = (readOverridesFile() as unknown as { mine?: MineOverrideEntry[] }).mine;
  const overrides = mineOverridesById(entries, cards);
  const features = computeFeatures(cards, overrides);
  const insert = db.prepare('INSERT INTO card_features (id, json) VALUES (?, ?)');
  db.transaction(() => {
    db.exec('DELETE FROM card_features');
    for (const row of features) insert.run(row.id, JSON.stringify(row));
  })();
  const report = coverage(cards, overrides);
  const info = {
    implemented: true,
    cards: features.length,
    noMechanic: report.noTraits.length,
    unparsedSentences: report.unparsedTotal,
    sentences: report.sentenceTotal,
    overrides: Object.keys(overrides).length,
  };
  writeSyncState(db, 'features', info);
  log(`features ${features.length}/${cards.length} cards mined; ${report.noTraits.length} with text but no mechanic trait; ${report.unparsedTotal} of ${report.sentenceTotal} sentences unparsed; ${info.overrides} overrides (roles, axes, edges: plan Task 5)`);
}
