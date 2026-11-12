// Main-deck generator (spec 13 steps 1-3). Pure.
//
// Base: Riftfoundry apps/web/src/lib/theory-decks.ts (origin/main 4b90179) - `candidateStaticUtility`,
// `candidateUtility`, `suggestedFlexibleCopies`, `requestedAnchorCopies`, `legendPlanAffinity` and the quota
// loop of `buildMainDeck` (`addUntil`, `maximumSafeCopies`, the 2+2 -> 3+1 consolidation). Kept: the order
// of the quota phases, the copy rules, the static terms (build-around pairs, champion pair, legend identity,
// Power penalty, seeded tie-break) and the guard that no phase may push a type or a cost bucket over its
// maximum.
//
// Changed for Forge:
// - The foundation, curve-repair, role-repair, type-repair and network terms of `candidateUtility` are the
//   Forge per-card score (scoring/score.ts: quality, synergy with the cards chosen so far, role need, curve
//   need, play data, legend fit), recomputed for every pick, so a pick is explained by the same reasons the
//   UI shows for that card.
// - Ranges come from the measured bands of targetsFor(), recomputed as the deck grows.
// - Riftfoundry's "executable package" repair (1,300 lines of per-payoff requirement readers) is not ported:
//   the stored network already holds those pairs with their reasons, and the package phase below seeds the
//   strongest stored partners of the champion and of every build-around card.
// - Copies follow the legend's public lists where they exist (data), then the ported rules.
// - Format: a main deck of 40 in all six formats; multiplayer formats shift the utility (HEURISTIC below).
import { isSignature, sameTag } from '../rules/champion';
import { copyLimit } from '../rules/copies';
import { legendOf } from '../rules/identity';
import { createScorer } from '../scoring';
import { featuresFor, qtyOf, summarizeDeck } from '../summary';
import { INTERACTION_ROLES, derivedCounts, targetsFor, type FullTargets } from '../targets';
import type { BuildOptions, Card, CardScore, Deck, EngineContext, Format, PowerTarget, Role } from '../types';
import { profileFor, type BuildProfile } from './profiles';
import { seededBias } from './rng';
import { isMainType, legalPool, mainSizeOf, nameOf, netOf, qtyIn, roomFor, signatureRoom, total, withCopies, type BuildPick, type MainType } from './state';

/** HEURISTIC constants of the generator. */
export const BUILD = {
  /** Points (on the 0-100 card score) the seed moves a card by at most; "Reroll" changes close calls only. */
  jitter: 5,
  /** Ported weights of candidateStaticUtility. */
  championPair: 0.95, affinity: 1.55, anchorCap: 9,
  /** A stored pair at or above this net value is a package partner worth seeding. */
  packageNet: 1.0, partnersPerAnchor: 3, partnersOfChampion: 2,
  /** A signature card is seeded when its card score reaches this. */
  signatureScore: 50,
  /** Lowest evaluated rating the free fill takes, by power target (spec 9); dropped when the pool runs out. */
  floor: { competitive: 52, focused: 45, casual: 0 } as Record<PowerTarget, number>,
  /** Lists of the legend needed before their copy counts are followed. */
  copyLists: 5, copyCardLists: 3,
  /** Multiplayer (fit sub-score, rules.md 10): holding through several enemy turns, sweepers and direct points gain; counters lose. */
  multiplayer: { protection: 3, sweeper: 3, 'point-source': 3, counter: -2 } as Partial<Record<Role, number>>,
} as const;

const MULTIPLAYER: readonly Format[] = ['2v2', 'ffa3', 'ffa4'];

export interface FillState {
  deck: Deck;
  picks: BuildPick[];
  notes: string[];
}

export interface FillContext {
  ctx: EngineContext;
  opts: BuildOptions;
  /** Build-around cards and locked main-deck cards: what the deck is built around. */
  anchors: Card[];
  profile: BuildProfile;
}

const escaped = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mentions = (card: Card, tag: string): boolean => tag.length > 1 && new RegExp(`\\b${escaped(tag)}\\b`, 'i').test(card.text);

/** Ported `legendPlanAffinity`: how much a card belongs to the legend's own identity (champion tag, signature, tag mentions). */
export function legendAffinity(card: Card, legend: Card, champion: Card | null): number {
  let affinity = 0;
  const shares = sameTag(card.championTag, legend.championTag) || card.tags.some((t) => sameTag(t, legend.championTag));
  if (shares) affinity += 2.6;
  if (shares && isSignature(card)) affinity += 3.4;
  if (legend.tags.some((t) => mentions(card, t))) affinity += 2.2;
  if (champion && card.id !== champion.id && card.tags.some((t) => champion.tags.some((c) => sameTag(c, t)))) affinity += 1.4;
  return affinity;
}

/** The part of a candidate's utility that does not change as the deck grows (ported `candidateStaticUtility` without its foundation term). */
export function staticUtility(card: Card, deck: Deck, fc: FillContext): number {
  const db = fc.ctx.db;
  const legend = legendOf(deck, db);
  const champion = deck.champion ? db.get(deck.champion) ?? null : null;
  let anchor = 0;
  for (const a of fc.anchors) anchor += netOf(db, card.id, a.id) * fc.profile.anchorWeight;
  let u = Math.max(-BUILD.anchorCap, Math.min(BUILD.anchorCap, anchor));
  if (champion) u += netOf(db, card.id, champion.id) * BUILD.championPair;
  if (legend) u += legendAffinity(card, legend, champion) * BUILD.affinity;
  u -= Math.max(0, card.power ?? 0) * fc.profile.powerPenalty;
  u += (seededBias(fc.opts.seed, card.id) - 0.5) * 2 * BUILD.jitter;
  if (MULTIPLAYER.includes(deck.format)) for (const role of featuresFor(db, card).roles) u += BUILD.multiplayer[role] ?? 0;
  return u;
}

const bucketOf = (card: Card): number => Math.max(0, Math.min(7, Math.floor(card.energy ?? 0)));
const isInteraction = (card: Card, fc: FillContext): boolean => featuresFor(fc.ctx.db, card).roles.some((r) => INTERACTION_ROLES.includes(r));

/**
 * Copies of a card the plan wants. Data first: the average copies in the legend's public lists. Then the ported
 * `suggestedFlexibleCopies`: 1 of a Unique card, 1 (control: 2) of a 6+ Energy card, 2 of gear, of cards with
 * 2+ Power and of pure payoffs, 3 of cheap units and cheap interaction, 1 of narrow hate.
 */
export function suggestedCopies(card: Card, deck: Deck, fc: FillContext): { copies: number; why: string } {
  const db = fc.ctx.db;
  const limit = copyLimit(card);
  if (limit <= 1) return { copies: 1, why: 'copy limit 1' };
  const cap = Number.isFinite(limit) ? limit : 3;
  const legend = legendOf(deck, db);
  const meta = legend ? db.legendMeta(legend.id) : undefined;
  const stat = meta?.main[card.id];
  if (meta && stat && meta.decks >= BUILD.copyLists && stat.decks >= BUILD.copyCardLists) {
    const copies = Math.max(1, Math.min(cap, Math.round(stat.avgCopies)));
    return { copies, why: `${stat.decks} of ${meta.decks} public lists run it at ${stat.avgCopies.toFixed(1)} copies (data)` };
  }
  const f = featuresFor(db, card);
  const energy = card.energy ?? 0;
  if (f.roles.includes('hate')) return { copies: 1, why: 'narrow answer: one copy in the main deck (heuristic)' };
  if (energy >= 6) return { copies: Math.min(cap, fc.profile.topEndCopies), why: `6+ Energy: ${fc.profile.topEndCopies} in a ${fc.profile.title} list (heuristic)` };
  const payoffOnly = Object.values(f.axes).some((a) => a.p >= 1) && !Object.values(f.axes).some((a) => a.e >= 1);
  if (card.type === 'gear' || (card.power ?? 0) >= 2 || payoffOnly) return { copies: Math.min(cap, 2), why: 'gear, 2+ Power or a payoff that needs its enablers first: two copies (heuristic)' };
  if (energy <= 3 && (card.type === 'unit' || isInteraction(card, fc))) return { copies: Math.min(cap, 3), why: 'cheap unit or interaction the plan wants every game: three copies (heuristic)' };
  return { copies: Math.min(cap, 3), why: 'three copies for consistency (heuristic)' };
}

/** Ported `requestedAnchorCopies`, with a floor of 2: a deck built around a card must find it (spec 13: 3 for the plan's key cards). */
export function anchorCopies(card: Card, fc: FillContext): number {
  const limit = copyLimit(card);
  if (limit <= 1) return 1;
  if (!Number.isFinite(limit)) return 6;
  const energy = card.energy ?? 0;
  if (energy >= 9) return Math.min(2, limit);
  if (energy >= 6) return Math.min(Math.max(2, fc.profile.topEndCopies), limit);
  return Math.min(3, limit);
}

interface Counts { total: number; type: Record<MainType, number>; curve: number[]; interactiveSpells: number; smallDrops: number; earlyUnits: number; units24: number; interaction: number; cardFlow: number }

function countsOf(deck: Deck, fc: FillContext): Counts {
  const db = fc.ctx.db;
  const s = summarizeDeck(deck, db);
  const d = derivedCounts(deck, db);
  let interactiveSpells = 0;
  let smallDrops = 0;
  for (const e of deck.main) {
    const card = db.get(e.id);
    if (!card) continue;
    if (card.type === 'spell' && isInteraction(card, fc)) interactiveSpells += qtyOf(e);
    if (card.type === 'unit' && (card.energy ?? 0) >= 2 && (card.energy ?? 0) <= 4) smallDrops += qtyOf(e);
  }
  return { total: s.mainCount, type: s.typeCounts, curve: s.curve, interactiveSpells, smallDrops, earlyUnits: d.earlyUnits, units24: d.units24, interaction: d.interaction, cardFlow: s.roleCounts['card-flow'] };
}

interface Ranked { card: Card; utility: number; score: CardScore }

/**
 * Fills the main deck to its size. Never throws: when the pool cannot fill the deck (a small collection,
 * a legend with few cards) it stops and says so in `state.notes`; validateDeck then reports the size.
 */
export function fillMain(state: FillState, fc: FillContext): void {
  const { ctx, opts } = fc;
  const db = ctx.db;
  const size = mainSizeOf(state.deck, db);
  if (!legendOf(state.deck, db) || total(state.deck.main) >= size) return;
  const pool = legalPool(state.deck, db, 'main');
  const statics = new Map(pool.map((c) => [c.id, staticUtility(c, state.deck, fc)]));
  let targets: FullTargets = targetsFor(state.deck, db);
  let strict = true;
  let floor = BUILD.floor[state.deck.power] ?? 0;

  const maxOf = (key: string): number => { const b = targets.full[key]; return b ? Math.max(Math.ceil(b.lo), Math.floor(b.tolHi + 1e-9)) : Infinity; };
  const loOf = (key: string): number => { const b = targets.full[key]; return b ? Math.ceil(b.lo - 1e-9) : 0; };

  /** Ported `maximumSafeCopies`: copy room, deck room, signature room, and (while strict) the type and cost-bucket maxima. */
  const safeCopies = (card: Card, counts: Counts): number => {
    let max = Math.min(roomFor(card, state.deck, opts), size - counts.total);
    if (isSignature(card)) max = Math.min(max, signatureRoom(state.deck, db));
    if (strict && isMainType(card)) {
      max = Math.min(max, maxOf(card.type) - counts.type[card.type]);
      max = Math.min(max, maxOf(`e${bucketOf(card)}`) - (counts.curve[bucketOf(card)] ?? 0));
    }
    return Math.max(0, max);
  };

  const rank = (counts: Counts, predicate: (card: Card) => boolean, fresh: boolean): Ranked[] => {
    const scorer = createScorer(state.deck, ctx);
    const out: Ranked[] = [];
    for (const card of pool) {
      if (fresh && qtyIn(state.deck.main, card.id) > 0) continue;
      if (!predicate(card) || safeCopies(card, counts) <= 0) continue;
      if (floor > 0 && featuresFor(db, card).evaluatedRating < floor) continue;
      const score = scorer.score(card, 'main');
      if (score.gate) continue;
      out.push({ card, score, utility: score.score + (statics.get(card.id) ?? 0) });
    }
    return out.sort((a, b) => b.utility - a.utility || a.card.id.localeCompare(b.card.id));
  };

  const add = (pick: Ranked, qty: number, phase: string, why: string): void => {
    state.deck = withCopies(state.deck, 'main', pick.card.id, qty);
    const partner = pick.score.partners[0];
    const text = `${why}. Card score ${pick.score.score}${partner ? `; works with ${nameOf(db, partner.id)} (${partner.reason})` : ''}.`;
    const held = state.picks.find((p) => p.zone === 'main' && p.id === pick.card.id);
    if (held) held.qty += qty;
    else state.picks.push({ zone: 'main', id: pick.card.id, qty, phase, reason: text });
  };

  /** Ported `addUntil`: take the best card that passes `predicate` until `current()` reaches `target`. */
  const addUntil = (phase: string, label: string, predicate: (card: Card) => boolean, target: number, current: (c: Counts) => number): void => {
    for (let guard = 0; guard < 40; guard += 1) {
      const counts = countsOf(state.deck, fc);
      if (current(counts) >= target || counts.total >= size) return;
      const next = rank(counts, predicate, true)[0];
      if (!next) return;
      const want = suggestedCopies(next.card, state.deck, fc);
      const qty = Math.min(target - current(counts), safeCopies(next.card, counts), want.copies);
      if (qty <= 0) return;
      add(next, qty, phase, `${label}: ${current(counts)} of ${target} so far; ${want.why}`);
      targets = targetsFor(state.deck, db);
    }
  };

  // 1. Identity: signature cards worth playing (spec 13.2).
  {
    const counts = countsOf(state.deck, fc);
    for (const r of rank(counts, (c) => isSignature(c), true)) {
      if (r.score.score < BUILD.signatureScore || signatureRoom(state.deck, db) <= 0) continue;
      const qty = Math.min(suggestedCopies(r.card, state.deck, fc).copies, safeCopies(r.card, countsOf(state.deck, fc)), fc.profile.identityCards + 1);
      if (qty > 0) add(r, qty, 'identity', `Signature card of ${nameOf(db, state.deck.legend ?? '')}`);
    }
  }

  // 2. Packages: the strongest stored partners of each build-around card, then of the Chosen Champion.
  const champion = state.deck.champion ? db.get(state.deck.champion) : undefined;
  const sources: { card: Card; n: number }[] = fc.anchors.map((card) => ({ card, n: BUILD.partnersPerAnchor }));
  if (champion && !fc.anchors.some((a) => a.id === champion.id)) sources.push({ card: champion, n: BUILD.partnersOfChampion });
  for (const source of sources) {
    const partners = db.edges(source.card.id)
      .map((e) => ({ id: e.a === source.card.id ? e.b : e.a, edge: e }))
      .filter((p) => p.edge.net >= BUILD.packageNet && statics.has(p.id))
      .sort((a, b) => b.edge.net - a.edge.net || a.id.localeCompare(b.id));
    let taken = 0;
    for (const p of partners) {
      if (taken >= source.n) break;
      const card = db.get(p.id);
      if (!card) continue;
      if (qtyIn(state.deck.main, card.id) > 0) { taken += 1; continue; }
      const counts = countsOf(state.deck, fc);
      const score = createScorer(state.deck, ctx).score(card, 'main');
      if (score.gate || safeCopies(card, counts) <= 0) continue;
      const qty = Math.min(Math.max(2, suggestedCopies(card, state.deck, fc).copies), safeCopies(card, counts));
      const reason = p.edge.reasons.find((r) => r.kind === 'synergy');
      add({ card, score, utility: score.score }, qty, 'package', `Partner of ${source.card.name}: ${reason ? `${reason.label} - ${reason.detail}` : `stored pair value ${p.edge.net.toFixed(2)}`}`);
      taken += 1;
    }
  }
  targets = targetsFor(state.deck, db);

  // 3. Quotas, in the ported order: interaction, type minimums, unit curve, cost curve, small drops, card flow.
  const interactive = Math.min(fc.profile.interactiveSpells, Math.max(loOf('role:removal'), Math.floor(loOf('interaction') / 2)));
  addUntil('interaction', 'Interactive spells', (c) => c.type === 'spell' && isInteraction(c, fc), interactive, (n) => n.interactiveSpells);
  for (const type of ['unit', 'spell', 'gear'] as const) addUntil('types', `${type} count for ${targets.archetype}`, (c) => c.type === type, loOf(type), (n) => n.type[type]);
  addUntil('curve', 'Units costing 0-2', (c) => c.type === 'unit' && (c.energy ?? 0) <= 2, loOf('earlyUnits'), (n) => n.earlyUnits);
  addUntil('curve', 'Units costing 2-4', (c) => c.type === 'unit' && (c.energy ?? 0) >= 2 && (c.energy ?? 0) <= 4, Math.min(fc.profile.smallDrops, loOf('units24')), (n) => n.smallDrops);
  for (const b of [1, 2, 3, 4]) addUntil('curve', `${b}-Energy cards`, (c) => bucketOf(c) === b, loOf(`e${b}`), (n) => n.curve[b] ?? 0);
  addUntil('roles', 'Card flow', (c) => featuresFor(db, c).roles.includes('card-flow'), loOf('role:card-flow'), (n) => n.cardFlow);

  // 4. Free fill by utility. When nothing fits: first the maxima go, then the quality floor, then extra copies.
  for (let guard = 0; guard < 80; guard += 1) {
    const counts = countsOf(state.deck, fc);
    if (counts.total >= size) break;
    let next = rank(counts, () => true, true)[0];
    if (!next && strict) { strict = false; continue; }
    if (!next && floor > 0) { state.notes.push(`The pool of cards rated ${floor} or more ran out at ${counts.total} cards; weaker cards fill the rest.`); floor = 0; continue; }
    let extraCopy = false;
    if (!next) { next = rank(counts, () => true, false)[0]; extraCopy = true; }
    if (!next) {
      state.notes.push(`No legal card is left to add at ${counts.total} of ${size} cards${opts.ownedOnly ? ' in the collection' : ''}.`);
      break;
    }
    const want = suggestedCopies(next.card, state.deck, fc);
    const qty = extraCopy ? 1 : Math.min(size - counts.total, safeCopies(next.card, counts), want.copies);
    add(next, Math.max(1, qty), 'fill', extraCopy ? 'One more copy: no other legal card is left' : `Best card for the deck as it stands; ${want.why}`);
    targets = targetsFor(state.deck, db);
  }

  consolidate(state, fc, targets);
}

/**
 * Ported consolidation (theory-decks.ts, after the quota loop): quota filling strands core cards at two copies.
 * While the deck has fewer copies in three-ofs than the measured band asks, a pair of 2-ofs of the same type
 * and cost bucket becomes a 3-of (the higher-scored card) and a 1-of. Type and curve counts do not change.
 * Skipped for cards whose copies follow public lists, for locked cards and the champion.
 */
function consolidate(state: FillState, fc: FillContext, targets: FullTargets): void {
  const db = fc.ctx.db;
  const want = targets.full.threeOfs ? Math.ceil(targets.full.threeOfs.lo) : 0;
  const builtIds = new Set(state.picks.filter((p) => p.zone === 'main' && (p.phase === 'fill' || p.phase === 'curve' || p.phase === 'types')).map((p) => p.id));
  for (let guard = 0; guard < 6; guard += 1) {
    if (derivedCounts(state.deck, db).threeOfs >= want) return;
    const scorer = createScorer(state.deck, fc.ctx);
    const twos = state.deck.main
      .filter((e) => qtyOf(e) === 2 && !e.locked && e.id !== state.deck.champion && builtIds.has(e.id))
      .map((e) => ({ e, card: db.get(e.id) }))
      .filter((x): x is { e: typeof x.e; card: Card } => !!x.card && roomFor(x.card, state.deck, fc.opts) > 0 && suggestedCopies(x.card, state.deck, fc).copies >= 3)
      .map((x) => ({ ...x, score: scorer.score(x.card, 'main').score }))
      .sort((a, b) => b.score - a.score || a.card.id.localeCompare(b.card.id));
    let done = false;
    for (const up of twos) {
      const down = [...twos].reverse().find((d) => d.card.id !== up.card.id && d.card.type === up.card.type && bucketOf(d.card) === bucketOf(up.card));
      if (!down || down.score > up.score) continue;
      state.deck = withCopies(withCopies(state.deck, 'main', up.card.id, 1), 'main', down.card.id, -1);
      for (const p of state.picks) {
        if (p.zone !== 'main') continue;
        if (p.id === up.card.id) { p.qty += 1; p.reason += ` Third copy taken from ${down.card.name} (same type and cost, lower card score) so the deck has enough three-ofs.`; }
        if (p.id === down.card.id) p.qty -= 1;
      }
      done = true;
      break;
    }
    if (!done) return;
  }
}

export const fillProfile = (deck: Deck, ctx: EngineContext): BuildProfile => profileFor(targetsFor(deck, ctx.db).archetypeId);
