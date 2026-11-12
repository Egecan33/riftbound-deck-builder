// `features` step. Fills `card_features` (mined traits, base rating, grade, roles, axes, unparsed sentences:
// plan Tasks 4 and 5), `card_edges` (the stored pair network) and `legend_profiles` (text half) for the
// full pool. Idempotent: every table is rebuilt from the cards and the reviewed overrides.
import { createCardDb } from '@/engine/carddb';
import { axisTagsOf, computeFeatures as featuresOf, legendProfiles } from '@/engine/features';
import { mineOverridesById, coverage, type MineOverride, type MineOverrideEntry } from '@/engine/mine';
import { buildEdgesWithStats, removedTraitsOf, type ForbiddenInteraction } from '@/engine/network';
import type { Card, CardFeatures } from '@/engine/types';
import { loadCards } from '@/server/carddb';
import { writeSyncState, type Db } from '@/server/db';
import { readOverridesFile } from '@/server/syncdata';
import type { Log } from './cards';

/** CardFeatures for every card. Pure: the same cards and overrides give the same rows. */
export function computeFeatures(cards: readonly Card[], overrides: Readonly<Record<string, MineOverride>> = {}): CardFeatures[] {
  const tags = axisTagsOf(cards);
  return cards.map((card) => featuresOf(card, overrides[card.id], tags));
}

export function syncFeatures(db: Db, log: Log): void {
  const started = Date.now();
  const cards = loadCards(db);
  const file = readOverridesFile() as unknown as { mine?: MineOverrideEntry[]; forbiddenInteractions?: ForbiddenInteraction[] };
  const overrides = mineOverridesById(file.mine, cards);
  const features = computeFeatures(cards, overrides);
  const { edges, stats } = buildEdgesWithStats(cards, { forbidden: file.forbiddenInteractions, removedTraits: removedTraitsOf(overrides) });
  const profiles = legendProfiles(createCardDb(cards, features));

  const insertFeature = db.prepare('INSERT INTO card_features (id, json) VALUES (?, ?)');
  const insertEdge = db.prepare('INSERT INTO card_edges (a, b, net, json) VALUES (?, ?, ?, ?)');
  const insertProfile = db.prepare('INSERT INTO legend_profiles (legend_id, json) VALUES (?, ?)');
  db.transaction(() => {
    db.exec('DELETE FROM card_features; DELETE FROM card_edges; DELETE FROM legend_profiles;');
    for (const row of features) insertFeature.run(row.id, JSON.stringify(row));
    for (const edge of edges) insertEdge.run(edge.a, edge.b, edge.net, JSON.stringify(edge));
    for (const profile of profiles) insertProfile.run(profile.legendId, JSON.stringify(profile));
  })();

  const report = coverage(cards, overrides);
  const suppressed = Object.values(stats.suppressed).reduce((a, b) => a + b, 0);
  const info = {
    implemented: true,
    cards: features.length,
    noMechanic: report.noTraits.length,
    unparsedSentences: report.unparsedTotal,
    sentences: report.sentenceTotal,
    overrides: Object.keys(overrides).length,
    nodes: stats.nodes,
    pairsChecked: stats.pairsChecked,
    edges: stats.edges,
    suppressed: stats.suppressed,
    forbiddenApplied: stats.forbiddenApplied,
    genericOnlyPairs: stats.genericOnlyDropped,
    legendProfiles: profiles.length,
    ms: Date.now() - started,
  };
  writeSyncState(db, 'features', info);
  log(`features ${features.length}/${cards.length} cards mined; ${report.noTraits.length} with text but no mechanic trait; ${report.unparsedTotal} of ${report.sentenceTotal} sentences unparsed; ${info.overrides} overrides`);
  log(`network ${stats.nodes} nodes, ${stats.pairsChecked} pairs checked, ${stats.edges} edges stored; ${suppressed} reasons suppressed, ${stats.forbiddenApplied} rule-forbidden pairs, ${stats.genericOnlyDropped} generic-only pairs not stored; ${profiles.length} legend profiles; ${info.ms} ms`);
}
