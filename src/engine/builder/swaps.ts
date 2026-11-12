// Swap proposals (spec 13: Improve, Suggest swaps, the bounded hill-climb). Pure.
//
// Base: Riftfoundry apps/web/src/lib/theory-deck-fit.ts `selectTheoryReplacementSlot` (origin/main 4b90179):
// open the weakest copy that is not the anchor or the Chosen Champion, preferring a copy of a duplicated
// card, then ask the scorer for the best card for that slot. `rankTheoryDeckFits` (theory-deck-fit-ranking.ts)
// reconciled a cheap shortlist with the full deck score; here the shortlist is the Forge per-card score and
// the reconciliation is the deck rating (with the win report), so a proposal is kept only if the rating rises.
//
// A swap is ONE copy out and one copy in. Ratings in a proposal have one decimal: a single copy moves the
// rating by less than a point (see state.ts `rate`).
import { legendOf } from '../rules/identity';
import { validateDeck } from '../rules/validate';
import { createScorer, type Scorer } from '../scoring';
import { featuresFor, qtyOf, withoutCopy } from '../summary';
import type { BuildOptions, Card, CardDb, CardScore, Deck, EngineContext, Fix, SwapProposal, Violation } from '../types';
import { seededBias } from './rng';
import { legalPool, nameOf, qtyIn, rate, roomFor, signatureRoom, withCopies } from './state';
import { isSignature } from '../rules/champion';
import { chooseRunes } from './zones';

/** HEURISTIC limits of the search. */
export const SWAPS = { maxImprove: 15, outsPerStep: 3, insPerOut: 2, failuresToStop: 2, minGain: 0.1, guidedRates: 12, guidedSubscores: 4 } as const;

/** Violations that name a card to cut from the main or side deck. */
const CUT_CODES: readonly string[] = ['CARD_BANNED', 'CARD_NOT_IN_FORMAT', 'DOMAIN_VIOLATION', 'SIGNATURE_WRONG_CHAMPION', 'SIGNATURE_TOTAL_EXCEEDED', 'COPY_LIMIT_EXCEEDED', 'UNIQUE_LIMIT_EXCEEDED', 'TOKEN_IN_DECK', 'MAIN_WRONG_TYPE', 'SIDEBOARD_WRONG_TYPE', 'RUNE_WRONG_TYPE'];

/** One swap applied: a copy of `out` leaves the zone and a copy of `in` enters. Null when `out` is not there. */
function applyOne(deck: Deck, swap: Pick<SwapProposal, 'zone' | 'out' | 'in'>): Deck | null {
  const list = swap.zone === 'main' ? deck.main : deck.side;
  if (qtyIn(list, swap.out) <= 0 || swap.out === swap.in) return null;
  if (swap.zone === 'main' && swap.out === deck.champion && qtyIn(deck.main, swap.out) <= 1) return null;
  return withCopies(withCopies(deck, swap.zone, swap.out, -1), swap.zone, swap.in, 1);
}

/** Applies swaps in order. A swap whose `out` card is no longer in its zone (or is the last Chosen Champion copy) is skipped. */
export function applySwaps(deck: Deck, swaps: readonly SwapProposal[]): Deck {
  let out = deck;
  for (const swap of swaps) out = applyOne(out, swap) ?? out;
  return out;
}

const lockedIds = (deck: Deck, zone: 'main' | 'side'): Set<string> => new Set((zone === 'main' ? deck.main : deck.side).filter((e) => e.locked).map((e) => e.id));

interface Search { ctx: EngineContext; opts: BuildOptions; pool: Card[]; sidePool: Card[]; protect: ReadonlySet<string> }

function searchOf(deck: Deck, ctx: EngineContext, opts: BuildOptions): Search {
  return { ctx, opts, pool: legalPool(deck, ctx.db, 'main'), sidePool: legalPool(deck, ctx.db, 'side'), protect: new Set(opts.buildAround) };
}

/** Best cards for the slot a removed copy leaves, by card score in the deck without that copy. */
function bestIns(without: Deck, zone: 'main' | 'side', out: string, s: Search, n: number, only?: (card: Card) => boolean): { card: Card; score: CardScore }[] {
  const db = s.ctx.db;
  const scorer = createScorer(without, s.ctx);
  const ranked: { card: Card; score: CardScore; u: number }[] = [];
  for (const card of zone === 'main' ? s.pool : s.sidePool) {
    if (card.id === out || (only && !only(card)) || roomFor(card, without, s.opts) <= 0) continue;
    if (isSignature(card) && (zone === 'side' || signatureRoom(without, db) <= 0)) continue;
    const score = scorer.score(card, zone);
    if (score.gate) continue;
    ranked.push({ card, score, u: score.score + (seededBias(s.opts.seed, `swap:${card.id}`) - 0.5) });
  }
  return ranked.sort((a, b) => b.u - a.u || a.card.id.localeCompare(b.card.id)).slice(0, n);
}

/** Main-deck copies that may be cut, weakest first (ported replacement-slot order: lowest card score, duplicated cards first on ties, then the more expensive). */
function weakestOuts(deck: Deck, scorer: Scorer, s: Search): { card: Card; score: CardScore }[] {
  const db = s.ctx.db;
  const locked = lockedIds(deck, 'main');
  const out: { card: Card; score: CardScore; qty: number }[] = [];
  for (const e of deck.main) {
    const card = db.get(e.id);
    if (!card || qtyOf(e) <= 0 || locked.has(e.id) || s.protect.has(e.id)) continue;
    if (e.id === deck.champion && qtyOf(e) <= 1) continue;
    out.push({ card, score: scorer.score(card, 'main'), qty: qtyOf(e) });
  }
  return out.sort((a, b) => a.score.score - b.score.score || b.qty - a.qty || (b.card.energy ?? -1) - (a.card.energy ?? -1) || a.card.id.localeCompare(b.card.id));
}

const firstReason = (score: CardScore): string => (score.reasons[0] ?? '').replace(/\.$/, '');

function reasonOf(db: CardDb, out: Card, outScore: CardScore | null, inn: Card, inScore: CardScore, why: string | null): string {
  const partner = inScore.partners[0];
  const cut = why ?? `${out.name} is the weakest copy here (card score ${outScore?.score ?? 0}${outScore && firstReason(outScore) ? `: ${firstReason(outScore)}` : ''})`;
  return `${cut}. ${inn.name} is the best card for the slot (card score ${inScore.score}${partner ? `; works with ${nameOf(db, partner.id)}: ${partner.reason}` : firstReason(inScore) ? `: ${firstReason(inScore)}` : ''}).`;
}

/** Rune split redone after a main-deck change, only if the deck already had a full rune deck chosen by the builder. */
const resplit = (deck: Deck, ctx: EngineContext, on: boolean): Deck => (on ? { ...deck, runes: chooseRunes(deck, ctx).runes } : deck);

/** The first card a rule violation asks to cut, main deck before side deck; locked cards are never cut. */
function illegalCopy(deck: Deck, violations: readonly Violation[]): { zone: 'main' | 'side'; id: string; violation: Violation } | null {
  for (const zone of ['main', 'side'] as const) {
    const list = zone === 'main' ? deck.main : deck.side;
    const locked = lockedIds(deck, zone);
    for (const v of violations) {
      if (v.severity !== 'error' || !CUT_CODES.includes(v.code)) continue;
      for (const id of v.cardIds) {
        if (qtyIn(list, id) <= 0 || locked.has(id)) continue;
        if (zone === 'main' && id === deck.champion && qtyIn(list, id) <= 1) continue;
        return { zone, id, violation: v };
      }
    }
  }
  return null;
}

/**
 * Improve (spec 13): repairs first - every copy a rule violation names is swapped for the best legal card, in
 * the order the validator reports them - then the best rating-raising swap is taken again and again. Each
 * proposal builds on the ones before it (`ratingBefore` of one is `ratingAfter` of the previous), so they are
 * ordered by the gain available at each step. At most `max` (15); locked and build-around cards are never cut.
 */
export function improveDeck(deck: Deck, ctx: EngineContext, opts: BuildOptions, max: number = SWAPS.maxImprove): SwapProposal[] {
  return climbSwaps(deck, ctx, opts, { max, keepRunes: true, outsPerStep: SWAPS.outsPerStep, insPerOut: SWAPS.insPerOut, failuresToStop: SWAPS.failuresToStop, guidedRates: SWAPS.guidedRates });
}

export interface ClimbConfig { max: number; keepRunes: boolean; outsPerStep: number; insPerOut: number; failuresToStop: number; /** Deck ratings the fix-guided search may spend. */ guidedRates: number }

/** The search behind improveDeck. The auto-build runs it with a small budget and lets it redo the rune split. */
export function climbSwaps(deck: Deck, ctx: EngineContext, opts: BuildOptions, cfg: ClimbConfig): SwapProposal[] {
  const { max, keepRunes } = cfg;
  const db = ctx.db;
  const limit = Math.max(0, Math.min(Number.isFinite(max) ? Math.floor(max) : SWAPS.maxImprove, 40));
  const out: SwapProposal[] = [];
  if (!legendOf(deck, db) || limit === 0) return out;
  const s = searchOf(deck, ctx, opts);
  let cur = deck;
  let rated = rate(cur, ctx);

  // Repairs.
  for (let guard = 0; guard < 60 && out.length < limit; guard += 1) {
    const bad = illegalCopy(cur, rated.rating.violations);
    if (!bad) break;
    const without = bad.zone === 'main' ? withoutCopy(cur, bad.id) : withCopies(cur, 'side', bad.id, -1);
    const pick = bestIns(without, bad.zone, bad.id, s, 1)[0];
    const card = db.get(bad.id);
    if (!pick || !card) break;
    const next = resplit(withCopies(without, bad.zone, pick.card.id, 1), ctx, !keepRunes);
    const nextRated = rate(next, ctx);
    out.push({ zone: bad.zone, out: bad.id, in: pick.card.id, reason: reasonOf(db, card, null, pick.card, pick.score, `${card.name} cannot stay: ${bad.violation.message}`), ratingBefore: rated.precise, ratingAfter: nextRated.precise });
    cur = next;
    rated = nextRated;
  }

  // Rating climb.
  let failures = 0;
  const tried = new Set<string>();
  while (out.length < limit && failures < cfg.failuresToStop) {
    const scorer = createScorer(cur, ctx);
    const outs = weakestOuts(cur, scorer, s).filter((o) => !tried.has(o.card.id)).slice(0, cfg.outsPerStep);
    if (outs.length === 0) break;
    let best: { next: Deck; rated: ReturnType<typeof rate>; proposal: SwapProposal } | null = null;
    for (const o of outs) {
      const without = withoutCopy(cur, o.card.id);
      for (const pick of bestIns(without, 'main', o.card.id, s, cfg.insPerOut)) {
        const next = resplit(withCopies(without, 'main', pick.card.id, 1), ctx, !keepRunes);
        const nextRated = rate(next, ctx);
        if (nextRated.precise < rated.precise + SWAPS.minGain) continue;
        if (!best || nextRated.precise > best.rated.precise) {
          best = { next, rated: nextRated, proposal: { zone: 'main', out: o.card.id, in: pick.card.id, reason: reasonOf(db, o.card, o.score, pick.card, pick.score, null), ratingBefore: rated.precise, ratingAfter: nextRated.precise } };
        }
      }
      if (best) break; // the weakest copy that can be improved is taken first
      tried.add(o.card.id);
    }
    if (!best) { failures += 1; continue; }
    out.push(best.proposal);
    cur = best.next;
    rated = best.rated;
    tried.clear();
    failures = 0;
  }

  // Guided by the rating's own fixes: the weakest-copy search above cannot see a deck-level problem (a curve
  // that is too high, a theme with no payoffs). Each fix of the sub-scores that lose the most carries a card
  // filter; the best card that passes it is tried against the weakest copies that do not.
  let budget = cfg.guidedRates;
  while (out.length < limit && budget > 0) {
    const subs = [...rated.rating.subscores].sort((a, b) => b.weight * (100 - b.value) - a.weight * (100 - a.value) || a.key.localeCompare(b.key)).slice(0, SWAPS.guidedSubscores);
    const scorer = createScorer(cur, ctx);
    const outsAll = weakestOuts(cur, scorer, s);
    let accepted = false;
    search: for (const sub of subs) {
      for (const fix of sub.fixes) {
        const filter = fix.filter;
        if (!filter || filter.type === 'battlefield' || filter.type === 'legend' || filter.type === 'rune') continue;
        const match = (card: Card): boolean => matchesFilter(card, filter, db);
        const outs = outsAll.filter((o) => !match(o.card) && (filter.maxEnergy === undefined || (o.card.energy ?? 0) > filter.maxEnergy + 1)).slice(0, 2);
        for (const o of outs) {
          if (budget <= 0) break search;
          const without = withoutCopy(cur, o.card.id);
          const pick = bestIns(without, 'main', o.card.id, s, 1, match)[0];
          if (!pick) break;
          budget -= 1;
          const next = resplit(withCopies(without, 'main', pick.card.id, 1), ctx, !keepRunes);
          const nextRated = rate(next, ctx);
          if (nextRated.precise < rated.precise + SWAPS.minGain) continue;
          out.push({ zone: 'main', out: o.card.id, in: pick.card.id, reason: reasonOf(db, o.card, o.score, pick.card, pick.score, `${sub.label}: ${fix.text.replace(/\.$/, '')}; ${o.card.name} is the weakest copy that does not help with it (card score ${o.score.score})`), ratingBefore: rated.precise, ratingAfter: nextRated.precise });
          cur = next;
          rated = nextRated;
          accepted = true;
          break search;
        }
      }
    }
    if (!accepted) break;
  }
  return out;
}

function matchesFilter(card: Card, filter: NonNullable<Fix['filter']>, db: CardDb): boolean {
  const f = featuresFor(db, card);
  if (filter.type && card.type !== filter.type) return false;
  if (filter.role && !f.roles.includes(filter.role)) return false;
  if (filter.axis) { const a = f.axes[filter.axis]; if (!a || (a.e <= 0 && a.p <= 0)) return false; }
  if (filter.domain && !card.domains.includes(filter.domain)) return false;
  if (filter.maxEnergy !== undefined && (card.energy ?? 0) > filter.maxEnergy) return false;
  return true;
}

/**
 * Suggest swaps: up to `count` independent one-copy proposals for different cards of the deck as it is, each
 * rated on its own against the current deck, best gain first. Copies a rule violation names come first.
 */
export function suggestSwaps(deck: Deck, ctx: EngineContext, opts: BuildOptions, count = 5): SwapProposal[] {
  const db = ctx.db;
  const want = Math.max(0, Math.min(Number.isFinite(count) ? Math.floor(count) : 5, 20));
  if (!legendOf(deck, db) || want === 0) return [];
  const s = searchOf(deck, ctx, opts);
  const rated = rate(deck, ctx);
  const repairs: SwapProposal[] = [];
  const seen = new Set<string>();
  for (const v of rated.rating.violations) {
    const bad = illegalCopy(deck, [v]);
    if (!bad || seen.has(bad.id) || repairs.length >= want) continue;
    seen.add(bad.id);
    const without = bad.zone === 'main' ? withoutCopy(deck, bad.id) : withCopies(deck, 'side', bad.id, -1);
    const pick = bestIns(without, bad.zone, bad.id, s, 1)[0];
    const card = db.get(bad.id);
    if (!pick || !card) continue;
    const after = rate(withCopies(without, bad.zone, pick.card.id, 1), ctx);
    repairs.push({ zone: bad.zone, out: bad.id, in: pick.card.id, reason: reasonOf(db, card, null, pick.card, pick.score, `${card.name} cannot stay: ${v.message}`), ratingBefore: rated.precise, ratingAfter: after.precise });
  }
  const scorer = createScorer(deck, ctx);
  const gains: SwapProposal[] = [];
  const usedIn = new Set<string>();
  for (const o of weakestOuts(deck, scorer, s).filter((x) => !seen.has(x.card.id)).slice(0, want * 2)) {
    const without = withoutCopy(deck, o.card.id);
    const pick = bestIns(without, 'main', o.card.id, s, 3).find((p) => !usedIn.has(p.card.id));
    if (!pick) continue;
    const after = rate(withCopies(without, 'main', pick.card.id, 1), ctx);
    if (after.precise <= rated.precise) continue;
    usedIn.add(pick.card.id);
    gains.push({ zone: 'main', out: o.card.id, in: pick.card.id, reason: reasonOf(db, o.card, o.score, pick.card, pick.score, null), ratingBefore: rated.precise, ratingAfter: after.precise });
  }
  gains.sort((a, b) => (b.ratingAfter - b.ratingBefore) - (a.ratingAfter - a.ratingBefore) || a.out.localeCompare(b.out));
  return [...repairs, ...gains].slice(0, want);
}
