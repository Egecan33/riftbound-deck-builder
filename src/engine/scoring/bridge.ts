// Forge Deck -> the ported Riftfoundry deck score and candidate fit (plan Task 6). New code. Pure.
//
// The ported functions take ScoreCard entries and options; this file converts and passes the synced ban list
// in (the ported code no longer has one compiled in, see ported/externals.ts).
import { toScoreCard, type DeckEntry as PortedEntry, type ScoreCard } from '../mine';
import { formatRules } from '../rules/formats';
import { legendOf } from '../rules/identity';
import { qtyOf } from '../summary';
import type { Card, CardDb, Deck, EngineContext, Format } from '../types';
import { evaluateCandidateFit, scoreDeck, type CandidateFit, type DeckScore, type DeckScoreOptions } from './ported';

const scoreCardCache = new WeakMap<Card, ScoreCard>();
export function scoreCardOf(card: Card): ScoreCard {
  let held = scoreCardCache.get(card);
  if (!held) scoreCardCache.set(card, (held = toScoreCard(card)));
  return held;
}

const banCache = new WeakMap<CardDb, Map<Format, { cards: Set<string>; battlefields: Set<string> }>>();
/** Ids banned in the format, from the synced legality data (bans are by name: every printing). */
export function bannedIds(db: CardDb, format: Format): { cards: Set<string>; battlefields: Set<string> } {
  let held = banCache.get(db);
  if (!held) banCache.set(db, (held = new Map()));
  const list = formatRules(format, db.legality()).banListOf;
  let sets = held.get(list);
  if (!sets) {
    sets = { cards: new Set(), battlefields: new Set() };
    for (const ban of db.legality().bans) {
      if (!ban.formats.includes(list)) continue;
      const card = db.byName(ban.name);
      if (card) (card.type === 'battlefield' ? sets.battlefields : sets.cards).add(card.id);
    }
    held.set(list, sets);
  }
  return sets;
}

export function portedEntries(deck: Deck, db: CardDb): PortedEntry[] {
  const out: PortedEntry[] = [];
  for (const entry of deck.main) {
    const card = db.get(entry.id);
    if (card && qtyOf(entry) > 0 && (card.type === 'unit' || card.type === 'spell' || card.type === 'gear')) out.push({ card: scoreCardOf(card), quantity: qtyOf(entry) });
  }
  return out;
}

export function portedOptions(deck: Deck, db: CardDb): DeckScoreOptions {
  const legend = legendOf(deck, db);
  const champion = deck.champion ? db.get(deck.champion) : undefined;
  const bans = bannedIds(db, deck.format);
  return {
    legend: legend ? scoreCardOf(legend) : null,
    champion: champion ? scoreCardOf(champion) : null,
    battlefields: deck.battlefields.map((id) => db.get(id)).filter((c): c is Card => !!c && c.type === 'battlefield').map(scoreCardOf),
    bannedCardIds: bans.cards,
    bannedBattlefieldIds: bans.battlefields,
  };
}

/**
 * The ported Riftfoundry deck score (RDS) of a Forge deck. Mechanical only: no Forge play evidence is in it.
 * `depth` 'pair' skips the three-card motifs (about ten times faster; the live rating uses it).
 */
export function portedDeckScore(deck: Deck, db: CardDb, depth: 'full' | 'pair' = 'full'): DeckScore {
  return scoreDeck(portedEntries(deck, db), { ...portedOptions(deck, db), combinationDepth: depth });
}

/**
 * The ported candidate fit of adding one copy of `card` to the deck: before/after deck score, component
 * deltas, pair and triple analyses. Slow (two deck scores); for swap proposals, not for scoring the pool.
 */
export function candidateFit(deck: Deck, ctx: EngineContext, card: Card): CandidateFit | null {
  if (card.type !== 'unit' && card.type !== 'spell' && card.type !== 'gear') return null;
  return evaluateCandidateFit(portedEntries(deck, ctx.db), scoreCardOf(card), portedOptions(deck, ctx.db));
}
