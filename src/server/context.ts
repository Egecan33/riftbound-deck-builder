import type { AnalyzeResponse, BrowseZone } from '@/app/lib/api';
import { rate } from '@/engine/builder';
import { generateLines } from '@/engine/lines';
import { createScorer, type Scorer } from '@/engine/scoring';
import { resolveThemeWeights, summarizeDeck } from '@/engine/summary';
import { targetsFor } from '@/engine/targets';
import type { Card, CardDb, CardScore, Deck, DeckRating, DeckSummary, LineReport, Targets, WinReport } from '@/engine/types';
import { detectWinRoutes } from '@/engine/wincons';
import { cardLookup, deckIds } from './cards';
import { deckKey } from './decks';
import { cacheSlot } from './state';
import { getCardDb } from './store';

/** Deck states kept in memory. One holds a report and up to three scored pools of about a thousand cards. */
export const MAX_ANALYSES = 12;
/** Opponents kept per deck state (the matchup lines are the only part that reads the opponent). */
export const MAX_OPPONENTS = 6;

export interface Report {
  rating: DeckRating; precise: number; summary: DeckSummary; targets: Targets;
  themeWeights: Record<string, number>;
  deckScores: Record<string, CardScore>; sideScores: Record<string, CardScore>;
  win: WinReport;
  unknown: string[];
}

export interface ScoredPool {
  /** The cards that can be browsed for the zone. */
  cards: readonly Card[];
  /** One score per card of `cards`, same order. */
  scores: CardScore[];
  /** Positions ordered for a sort key, gated cards last; computed on first use. */
  order(sort: string, compare: (a: number, b: number) => number): Int32Array;
}

/** Everything computed for one deck state. Each part is computed on first use and kept. */
export interface Analysis {
  key: string;
  deck: Deck;
  db: CardDb;
  scorer: Scorer;
  report(): Report;
  lines(opponentLegend: string | null): LineReport;
  pool(zone: BrowseZone): ScoredPool;
}

const isMain = (c: Card): boolean => c.type === 'unit' || c.type === 'spell' || c.type === 'gear';

/** The cards a zone's browser lists (tokens are never in `db.all()`). Cached per card database. */
export function poolCards(db: CardDb, zone: BrowseZone): readonly Card[] {
  const held = cacheSlot<{ db: CardDb | null; main: Card[]; battlefields: Card[] }>('pool-cards', () => ({ db: null, main: [], battlefields: [] }));
  if (held.db !== db) {
    held.db = db;
    held.main = db.all().filter(isMain);
    held.battlefields = db.all().filter((c) => c.type === 'battlefield');
  }
  return zone === 'battlefields' ? held.battlefields : held.main;
}

function makeAnalysis(key: string, deck: Deck, db: CardDb): Analysis {
  const base = { db, opponentLegend: null };
  let scorer: Scorer | null = null;
  let report: Report | null = null;
  const lines = new Map<string, LineReport>();
  const pools = new Map<BrowseZone, ScoredPool>();
  const getScorer = (): Scorer => (scorer ??= createScorer(deck, base));
  return {
    key, deck, db,
    get scorer() { return getScorer(); },
    report() {
      if (report) return report;
      const s = getScorer();
      const summary = summarizeDeck(deck, db);
      const deckScores: Record<string, CardScore> = {};
      const sideScores: Record<string, CardScore> = {};
      const unknown: string[] = [];
      const put = (id: string, zone: 'main' | 'side' | 'battlefields', into: Record<string, CardScore>) => {
        if (into[id]) return;
        const card = db.get(id);
        if (card) into[id] = s.score(card, zone);
        else if (!unknown.includes(id)) unknown.push(id);
      };
      for (const e of deck.main) put(e.id, 'main', deckScores);
      for (const id of deck.battlefields) put(id, 'battlefields', deckScores);
      for (const e of deck.side) put(e.id, 'side', sideScores);
      for (const id of [deck.legend, deck.champion, ...deck.extraLegends]) if (id && !db.get(id) && !unknown.includes(id)) unknown.push(id);
      const { rating, precise } = rate(deck, base);
      return (report = {
        rating, precise, summary,
        targets: targetsFor(deck, db, summary),
        themeWeights: resolveThemeWeights(deck, db, summary),
        deckScores, sideScores,
        win: detectWinRoutes(deck, base),
        unknown,
      });
    },
    lines(opponentLegend) {
      const k = opponentLegend ?? '';
      let held = lines.get(k);
      if (!held) {
        held = generateLines(deck, { db, opponentLegend });
        lines.set(k, held);
        while (lines.size > MAX_OPPONENTS) lines.delete(lines.keys().next().value as string);
      }
      return held;
    },
    pool(zone) {
      let pool = pools.get(zone);
      if (pool) return pool;
      const s = getScorer();
      const cards = poolCards(db, zone);
      const scores = cards.map((c) => s.score(c, zone));
      const orders = new Map<string, Int32Array>();
      pool = {
        cards, scores,
        order(sort, compare) {
          let order = orders.get(sort);
          if (!order) {
            order = Int32Array.from(cards.keys());
            order.sort((a, b) => (scores[a].gate ? 1 : 0) - (scores[b].gate ? 1 : 0) || compare(a, b));
            orders.set(sort, order);
          }
          return order;
        },
      };
      pools.set(zone, pool);
      return pool;
    },
  };
}

/**
 * The analysis of a deck state, cached by deck hash. An edit makes a new state (about 70 ms for the
 * report and lines on the synced pool); paging, filtering and sorting the browser, opening a card,
 * changing the opponent, undoing an edit and re-analysing an unchanged deck all reuse a held state.
 * An entry is only reused while the card database it was built with is still the current one.
 */
export function getAnalysisEntry(deck: Deck): { analysis: Analysis; cached: boolean } {
  const cache = cacheSlot('analyses', () => new Map<string, Analysis>());
  const key = deckKey(deck);
  const db = getCardDb();
  const hit = cache.get(key);
  if (hit && hit.db === db) {
    cache.delete(key);
    cache.set(key, hit); // most recently used last
    return { analysis: hit, cached: true };
  }
  const fresh = makeAnalysis(key, deck, db);
  cache.delete(key);
  cache.set(key, fresh);
  while (cache.size > MAX_ANALYSES) cache.delete(cache.keys().next().value as string);
  return { analysis: fresh, cached: false };
}

export const getAnalysis = (deck: Deck): Analysis => getAnalysisEntry(deck).analysis;

/** An opponent the matchup lines can be written for: a legend of the card data, else null. */
export function opponentOf(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  const card = getCardDb().get(value);
  return card && card.type === 'legend' ? card.id : null;
}

/** The body of POST /api/analyze. */
export function analyzeResponse(deck: Deck, opponent: unknown): AnalyzeResponse {
  const started = performance.now();
  const { analysis, cached } = getAnalysisEntry(deck);
  const opponentLegend = opponentOf(opponent);
  const r = analysis.report();
  const lines = analysis.lines(opponentLegend);
  const ids = new Set<string>(deckIds(deck));
  if (opponentLegend) ids.add(opponentLegend);
  for (const v of r.rating.violations) for (const id of v.cardIds) ids.add(id);
  for (const route of r.win.routes) {
    for (const id of [...route.closers, ...route.enablers]) ids.add(id);
    for (const fold of route.foldsTo) for (const id of [...fold.cardIds, ...(fold.answerIds ?? [])]) ids.add(id);
  }
  for (const group of Object.values(lines) as LineReport[keyof LineReport][]) {
    for (const line of group) for (const id of [...line.cardIds, ...(line.otherIds ?? [])]) ids.add(id);
  }
  for (const score of [...Object.values(r.deckScores), ...Object.values(r.sideScores)]) for (const p of score.partners) ids.add(p.id);
  return {
    ...r, lines, opponentLegend, cards: cardLookup(ids),
    timing: { ms: Math.round((performance.now() - started) * 10) / 10, cached },
  };
}
