// Builder (spec 13, plan Task 8): auto-build, fill the rest, swap proposals, improve, side deck. Pure.
//
// Base: the generator of Riftfoundry apps/web/src/lib/theory-decks.ts and theory-deck-fit*.ts (origin/main
// 4b90179); what was ported and what replaced the rest is in the header of each file here. New for Forge:
// six formats, the side deck, build-around locks, the collection, repair, the rating hill-climb.
//
// Pipeline of one build (spec 13 steps 1-8):
//   legend (kept, or chosen from the build-around cards) -> Chosen Champion -> build-around cards locked ->
//   main deck (fill.ts) -> runes (zones.ts) -> battlefields (zones.ts) -> side deck (side.ts, best-of-three
//   only) -> repair -> bounded hill-climb on the rating (swaps.ts) -> runes again.
// Deterministic for `opts.seed`; a different seed moves close calls (rng.ts).
import { eligibleChampions } from '../rules/champion';
import { RUNE_DECK_SIZE } from '../rules/formats';
import { legendOf } from '../rules/identity';
import { cardFitsDeck, validateDeck } from '../rules/validate';
import { qtyOf } from '../summary';
import type { BuildOptions, Card, Deck, DeckEntry, DeckRating, EngineContext, SwapProposal, Violation } from '../types';
import { anchorCopies, fillMain, fillProfile, type FillContext, type FillState } from './fill';
import type { BuildProfile } from './profiles';
import { planSideDeck } from './side';
import { isMainType, mainSizeOf, nameOf, qtyIn, rate, roomFor, total, withCopies, type BuildPick } from './state';
import { applySwaps, climbSwaps } from './swaps';
import { chooseBattlefields, chooseChampion, chooseLegend, chooseRunes } from './zones';

export * from './rng';
export * from './profiles';
export { LEAN, coreCards, playLean, type Lean } from './lean';
export { BUILD, anchorCopies, legendAffinity, staticUtility, suggestedCopies } from './fill';
export { ZONES, chooseBattlefields, chooseChampion, chooseLegend, chooseRunes } from './zones';
export { SIDE, buildSideDeck, planSideDeck, type SideJob, type SidePlan } from './side';
export { SWAPS, applySwaps, improveDeck, suggestSwaps } from './swaps';
export { rate, type BuildPick, type Rated } from './state';

/** Rating-raising swaps the auto-build tries after the fill (spec 13.7 "bounded"). HEURISTIC. */
export const CLIMB_STEPS = 6;
/** Deck ratings the fix-guided part of that climb may spend (about 0.1 s each on the synced pool). */
export const CLIMB_GUIDED = 6;

/** Picks the climb may not cut: the plan's key cards (spec 13.3) - the champion, signature cards, build-around cards and their package partners. */
const KEY_PHASES: readonly string[] = ['champion', 'identity', 'package', 'build-around', 'core'];

export interface BuildResult {
  deck: Deck;
  /** Why each card is in the deck, in the order it was chosen. */
  picks: BuildPick[];
  /** What the builder decided or could not do, in words. */
  notes: string[];
  /** Swaps the hill-climb accepted after the fill (already applied to `deck`). */
  climb: SwapProposal[];
  profile: BuildProfile | null;
  rating: DeckRating;
  /** Rating before rounding, one decimal. */
  precise: number;
  violations: Violation[];
}

const cleanOpts = (opts: BuildOptions): BuildOptions => ({
  ownedOnly: !!opts?.ownedOnly && !!opts.owned, owned: opts?.owned ?? null,
  seed: Number.isFinite(opts?.seed) ? Math.floor(opts.seed) : 0, buildAround: [...new Set(opts?.buildAround ?? [])],
});

const cleanEntries = (entries: readonly DeckEntry[]): DeckEntry[] => entries.filter((e) => qtyOf(e) > 0).map((e) => ({ ...e, qty: qtyOf(e) }));

function build(input: Deck, ctx: EngineContext, rawOpts: BuildOptions, mode: 'auto' | 'fill'): BuildResult {
  const db = ctx.db;
  const opts = cleanOpts(rawOpts);
  const notes: string[] = [];
  const picks: BuildPick[] = [];
  let deck: Deck = { ...input, main: cleanEntries(input.main ?? []), side: cleanEntries(input.side ?? []), battlefields: [...(input.battlefields ?? [])], runes: { ...(input.runes ?? {}) }, extraLegends: [...(input.extraLegends ?? [])] };
  const around = opts.buildAround.map((id) => db.get(id)).filter((c): c is Card => !!c);
  for (const id of opts.buildAround) if (!db.get(id)) notes.push(`Build-around card "${id}" is not in the card data and was left out.`);

  if (mode === 'auto') {
    // Keeps legend, champion and locked entries; everything else is chosen new.
    deck = { ...deck, main: deck.main.filter((e) => e.locked), side: deck.side.filter((e) => e.locked), runes: {}, battlefields: [] };
  }

  // Legend.
  if (!legendOf(deck, db)) {
    const chosen = chooseLegend(deck, ctx, around, opts);
    if (chosen) { deck = { ...deck, legend: chosen.card.id }; notes.push(chosen.reason); picks.push({ zone: 'legend', id: chosen.card.id, qty: 1, phase: 'legend', reason: chosen.reason }); }
  }
  const legend = legendOf(deck, db);
  if (!legend) {
    notes.push('No legend chosen and no build-around card to choose one by: pick a legend first.');
    const rated = rate(deck, ctx);
    return { deck, picks, notes, climb: [], profile: null, rating: rated.rating, precise: rated.precise, violations: rated.rating.violations };
  }

  // Chosen Champion: kept when it is a legal champion unit of the legend, else chosen.
  const eligible = new Set(eligibleChampions(legend, db).map((c) => c.id));
  const keptChampion = deck.champion && eligible.has(deck.champion) && cardFitsDeck(db.get(deck.champion) as Card, 'main', deck, db) === null;
  const anchorChampion = around.find((c) => eligible.has(c.id));
  if (!keptChampion || (mode === 'auto' && anchorChampion && !input.champion)) {
    if (deck.champion && !keptChampion) notes.push(`${nameOf(db, deck.champion)} cannot be the Chosen Champion of ${legend.name} in ${deck.format}; another was chosen.`);
    const chosen = chooseChampion({ ...deck, champion: null }, ctx, around, opts);
    if (chosen) { deck = { ...deck, champion: chosen.card.id }; picks.push({ zone: 'main', id: chosen.card.id, qty: 0, phase: 'champion', reason: chosen.reason }); }
    else { deck = { ...deck, champion: null }; notes.push(`No legal champion unit of ${legend.name}${opts.ownedOnly ? ' in the collection' : ''}: the deck has no Chosen Champion.`); }
  }
  const profile = fillProfile(deck, ctx);

  // Build-around cards: battlefields are brought, main-deck cards are locked in at the copies the plan wants.
  const keepFields: string[] = mode === 'fill' ? [...deck.battlefields] : [];
  const anchors: Card[] = [];
  const fcBase: FillContext = { ctx, opts, anchors, profile };
  for (const card of around) {
    const zone = card.type === 'battlefield' ? 'battlefields' : 'main';
    const issue = card.type === 'legend' ? null : cardFitsDeck(card, zone, deck, db);
    if (card.type === 'legend') continue;
    if (issue || (zone === 'main' && !isMainType(card))) { notes.push(`Build-around card ${card.name} was left out: ${issue?.message ?? 'it is not a main-deck card or a battlefield'}`); continue; }
    if (zone === 'battlefields') { if (!keepFields.includes(card.id)) keepFields.unshift(card.id); continue; }
    const have = qtyIn(deck.main, card.id);
    const want = Math.max(have, anchorCopies(card, fcBase));
    const add = Math.min(want - have, roomFor(card, deck, opts));
    if (have + add <= 0) { notes.push(`Build-around card ${card.name} was left out: no copy${opts.ownedOnly ? ' in the collection' : ''} can be added.`); continue; }
    deck = withCopies(deck, 'main', card.id, add, true);
    deck = { ...deck, main: deck.main.map((e) => (e.id === card.id ? { ...e, locked: true } : e)) };
    anchors.push(card);
    picks.push({ zone: 'main', id: card.id, qty: add, phase: 'build-around', reason: `Build-around card: ${have + add} ${have + add === 1 ? 'copy' : 'copies'}, locked.` });
  }
  for (const e of deck.main) {
    const card = db.get(e.id);
    if (e.locked && card && !anchors.some((a) => a.id === card.id)) anchors.push(card);
  }

  // The Chosen Champion is counted inside the main deck: at least its one copy, more by the plan.
  if (deck.champion && qtyIn(deck.main, deck.champion) === 0) {
    const card = db.get(deck.champion) as Card;
    const qty = Math.max(1, Math.min(anchorCopies(card, fcBase), roomFor(card, deck, opts)));
    deck = withCopies(deck, 'main', card.id, qty);
    const pick = picks.find((p) => p.phase === 'champion' && p.id === card.id);
    if (pick) pick.qty = qty;
    else picks.push({ zone: 'main', id: card.id, qty, phase: 'champion', reason: `Chosen Champion of the deck: ${qty} ${qty === 1 ? 'copy' : 'copies'} (one starts in the Champion Zone).` });
  }

  // Main deck.
  const state: FillState = { deck, picks, notes };
  fillMain(state, fcBase);
  deck = state.deck;

  // Runes: kept in fill mode when the rune deck is already complete.
  const runeCount = Object.values(deck.runes).reduce((n: number, x) => n + (Number.isFinite(x) ? Math.max(0, x as number) : 0), 0);
  const ownRunes = mode === 'auto' || runeCount !== RUNE_DECK_SIZE;
  if (ownRunes) {
    const runes = chooseRunes(deck, ctx);
    deck = { ...deck, runes: runes.runes };
    notes.push(`Runes: ${runes.reason}`);
  }

  // Battlefields.
  const fields = chooseBattlefields(deck, ctx, anchors.concat(around.filter((c) => c.type === 'battlefield')), opts, keepFields);
  deck = { ...deck, battlefields: fields.ids };
  picks.push(...fields.picks);
  if (fields.ids.length < 3) notes.push(`Only ${fields.ids.length} legal battlefield${fields.ids.length === 1 ? '' : 's'}${opts.ownedOnly ? ' in the collection' : ''}.`);

  // Side deck: built where the rules give one a use (best-of-three, TR 601.1.c). In fill mode the cards already in the side deck stay and the rest is filled.
  if (deck.format === 'standard-bo3') {
    const lockedAll = mode === 'fill' ? { ...deck, side: deck.side.map((e) => ({ ...e, locked: true })) } : deck;
    const plan = planSideDeck(lockedAll, ctx, opts);
    const wasLocked = new Set(deck.side.filter((e) => e.locked).map((e) => e.id));
    deck = { ...deck, side: plan.entries.map((e) => ({ ...e, locked: wasLocked.has(e.id) })) };
    picks.push(...plan.picks);
    notes.push(...plan.notes);
  } else if (mode === 'auto' && total(deck.side) === 0) {
    notes.push(deck.format === 'standard-bo1' || deck.format === '2v2'
      ? `No side deck built for ${deck.format}: it is used between the games of a best-of-three match; call buildSideDeck to get one anyway.`
      : `${deck.format} has no side deck.`);
  }

  // Repair, then the bounded hill-climb (spec 13.7): one-copy swaps judged by the rating. Not in fill mode,
  // where every card already present must stay.
  const climb = mode === 'auto' && total(deck.main) >= mainSizeOf(deck, db) ? climbSwaps(deck, ctx, { ...opts, buildAround: [...anchors.map((a) => a.id), ...picks.filter((p) => p.zone === 'main' && KEY_PHASES.includes(p.phase)).map((p) => p.id)] }, { max: CLIMB_STEPS, keepRunes: !ownRunes, outsPerStep: 2, insPerOut: 1, failuresToStop: 1, guidedRates: CLIMB_GUIDED }) : [];
  if (climb.length > 0) {
    deck = applySwaps(deck, climb);
    if (ownRunes) deck = { ...deck, runes: chooseRunes(deck, ctx).runes };
    for (const swap of climb) {
      const cut = picks.find((p) => p.zone === swap.zone && p.id === swap.out);
      if (cut) cut.qty = Math.max(0, cut.qty - 1);
      const held = picks.find((p) => p.zone === swap.zone && p.id === swap.in);
      if (held) { held.qty += 1; held.reason += ` One more copy after the fill: ${swap.reason}`; }
      else picks.push({ zone: swap.zone, id: swap.in, qty: 1, phase: 'climb', reason: swap.reason });
    }
    for (let i = picks.length - 1; i >= 0; i -= 1) if (picks[i].qty <= 0 && picks[i].zone !== 'legend') picks.splice(i, 1);
    notes.push(`${climb.length} swap${climb.length === 1 ? '' : 's'} after the fill raised the rating from ${climb[0].ratingBefore} to ${climb[climb.length - 1].ratingAfter}.`);
  }

  const rated = rate(deck, ctx);
  const violations = validateDeck(deck, db);
  for (const v of violations) if (v.severity === 'error') notes.push(`Not legal: ${v.message}${v.code === 'LEGEND_BANNED' ? ' The builder keeps the legend it is given; choose another legend or format.' : ''}`);
  return { deck, picks, notes, climb, profile, rating: rated.rating, precise: rated.precise, violations };
}

/** Builds a deck around the legend, champion and locked entries of `deck`, with every reason (see BuildResult). */
export const autoBuildDetailed = (deck: Deck, ctx: EngineContext, opts: BuildOptions): BuildResult => build(deck, ctx, opts, 'auto');
/** Keeps everything in `deck` and fills what is missing, with every reason. */
export const fillRestDetailed = (deck: Deck, ctx: EngineContext, opts: BuildOptions): BuildResult => build(deck, ctx, opts, 'fill');

/** Auto-build (spec 13): keeps legend, champion and locked entries; zero violations for the format whenever the pool allows it. */
export const autoBuild = (deck: Deck, ctx: EngineContext, opts: BuildOptions): Deck => autoBuildDetailed(deck, ctx, opts).deck;
/** Fill the rest: every card already in the deck stays at its copies; missing main-deck cards, runes, battlefields and (best-of-three) side deck are added. */
export const fillRest = (deck: Deck, ctx: EngineContext, opts: BuildOptions): Deck => fillRestDetailed(deck, ctx, opts).deck;
