// Plan Task 8: the builder (spec 13). Fixture pool first; the synced pool (data/forge.db) where it exists.
// The full real-pool run (all 58 legends x 6 formats) is slow, so the normal suite builds a sample of it;
// `FORGE_BUILDER_FULL=1 pnpm test builder` runs every legend and prints pass counts, times and ratings.
import { describe, expect, it } from 'vitest';
import {
  CLIMB_STEPS, PROFILES, applySwaps, autoBuild, autoBuildDetailed, buildSideDeck, chooseRunes, fillRest, fillRestDetailed, improveDeck,
  mulberry32, planSideDeck, rate, seededBias, stableBias, suggestSwaps, suggestedCopies,
} from '@/engine/builder';
import { copyLimit } from '@/engine/rules/copies';
import { formatRules } from '@/engine/rules/formats';
import { cardFitsDeck, isLegal, validateDeck } from '@/engine/rules/validate';
import { featuresFor } from '@/engine/summary';
import type { BuildOptions, Card, CardDb, Deck, DeckEntry, EngineContext, Format } from '@/engine/types';
import { hasRealDb } from '../helpers/real-db';
import { blankDeck, scoredFixture } from './scoring/forge-db';

const FORMATS: Format[] = ['standard-bo1', 'standard-bo3', '2v2', 'ffa3', 'ffa4', 'casual'];
const ctxOf = (db: CardDb): EngineContext => ({ db, opponentLegend: null });
const opts = (over: Partial<BuildOptions> = {}): BuildOptions => ({ ownedOnly: false, owned: null, seed: 1, buildAround: [], ...over });
const count = (entries: readonly DeckEntry[]): number => entries.reduce((n, e) => n + e.qty, 0);
const runeCount = (deck: Deck): number => Object.values(deck.runes).reduce((n: number, x) => n + (x ?? 0), 0);
const key = (deck: Deck): string => JSON.stringify([deck.champion, deck.main.map((e) => [e.id, e.qty]).sort(), deck.battlefields, deck.runes, deck.side.map((e) => [e.id, e.qty]).sort()]);
const errors = (deck: Deck, db: CardDb): string[] => validateDeck(deck, db).filter((v) => v.severity === 'error').map((v) => `${v.code}: ${v.message}`);

/** The properties every auto-built deck must have (plan Task 8, first test line). */
function expectBuilt(deck: Deck, db: CardDb, label: string): void {
  const rules = formatRules(deck.format, db.legality());
  expect(errors(deck, db), label).toEqual([]);
  expect(count(deck.main), label).toBe(40);
  expect(runeCount(deck), label).toBe(12);
  expect(deck.battlefields, label).toHaveLength(3);
  expect(count(deck.side), label).toBeLessThanOrEqual(rules.sideAllowed ? rules.sideMax : 0);
  if (deck.format === 'standard-bo3') expect(count(deck.side), label).toBe(rules.sideMax);
  // Copies over main and side together stay inside each card's limit.
  const held = new Map<string, number>();
  for (const e of [...deck.main, ...deck.side]) held.set(e.id, (held.get(e.id) ?? 0) + e.qty);
  for (const [id, qty] of held) expect(qty, `${label} ${db.get(id)?.name}`).toBeLessThanOrEqual(copyLimit(db.get(id) as Card));
  expect(deck.champion && deck.main.some((e) => e.id === deck.champion), label).toBe(true);
}

/** 20 legends, the Radiance ones first (at least 5), then the rest in id order. */
function twentyLegends(db: CardDb): Card[] {
  const legends = db.all().filter((c) => c.type === 'legend' && !c.dataIncomplete).sort((a, b) => a.id.localeCompare(b.id));
  const rad = legends.filter((c) => c.set === 'RAD').slice(0, 6);
  const rest = legends.filter((c) => c.set !== 'RAD');
  const step = Math.max(1, Math.floor(rest.length / 14));
  return [...rad, ...rest.filter((_, i) => i % step === 0).slice(0, 14)];
}

describe('seeded randomness', () => {
  it('mulberry32 and the biases are deterministic, in range, and differ across seeds', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    const xs = Array.from({ length: 50 }, () => a());
    expect(xs).toEqual(Array.from({ length: 50 }, () => b()));
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
    expect(new Set(xs).size).toBeGreaterThan(45);
    expect(mulberry32(Number.NaN)()).toBe(mulberry32(0)());
    expect(stableBias('aggro:0:ogn-001')).toBe(stableBias('aggro:0:ogn-001'));
    expect(seededBias(1, 'x')).toBe(seededBias(1, 'x'));
    expect(seededBias(1, 'x')).not.toBe(seededBias(2, 'x'));
    expect(Object.keys(PROFILES)).toEqual(['aggro', 'tempo', 'midrange', 'control', 'combo']);
  });
});

describe('autoBuild on the fixture pool', () => {
  const { db, decks } = scoredFixture();
  const ctx = ctxOf(db);

  it('20 legends (6 from Radiance) x 6 formats: legal, 40 / 12 / 3, side deck only in best-of-three, rating 55+, under 3 s', () => {
    const legends = twentyLegends(db);
    expect(legends).toHaveLength(20);
    expect(legends.filter((c) => c.set === 'RAD').length).toBeGreaterThanOrEqual(5);
    const slow: string[] = [];
    const low: string[] = [];
    const times: number[] = [];
    const ratings: number[] = [];
    // Warm the caches the first build of a process pays for once (field, answers, win-route references).
    autoBuild(blankDeck({ legend: legends[0].id, format: 'standard-bo3' }), ctx, opts());
    for (const legend of legends) {
      for (const format of FORMATS) {
        const label = `${legend.name} ${format}`;
        if (cardFitsDeck(legend, 'legend', blankDeck({ legend: legend.id, format }), db)) continue; // a legend banned in the format (Wuju Bladesman in 2v2): covered on the synced pool below
        const t = performance.now();
        const built = autoBuildDetailed(blankDeck({ legend: legend.id, format }), ctx, opts());
        const ms = performance.now() - t;
        if (ms >= 3000) slow.push(`${label} ${Math.round(ms)} ms`);
        times.push(ms);
        ratings.push(built.rating.rating);
        expectBuilt(built.deck, db, label);
        expect(built.rating.legal, label).toBe(true);
        if (built.rating.rating < 55) low.push(`${label} ${built.rating.rating}`);
        expect(built.picks.every((p) => p.reason.length > 10), label).toBe(true);
        // Every main-deck card of the result has a recorded reason at its final copies.
        for (const e of built.deck.main) expect(built.picks.filter((p) => p.zone === 'main' && p.id === e.id).reduce((n, p) => n + p.qty, 0), `${label} ${db.get(e.id)?.name}`).toBe(e.qty);
      }
    }
    const sorted = [...ratings].sort((x, y) => x - y);
    const ms = [...times].sort((x, y) => x - y);
    console.log(`[builder, fixture pool] ${ratings.length} builds legal; time ms median ${Math.round(ms[Math.floor(ms.length / 2)])}, max ${Math.round(ms[ms.length - 1])}; rating min ${sorted[0]}, median ${sorted[Math.floor(sorted.length / 2)]}, max ${sorted[sorted.length - 1]}`);
    expect(slow).toEqual([]);
    expect(low).toEqual([]);
  }, 600_000);

  it('same seed gives the same deck, another seed a different one', () => {
    for (const d of decks.slice(0, 3)) {
      const start = blankDeck({ legend: d.deck.legend, format: 'standard-bo3' });
      const a = autoBuild(start, ctx, opts({ seed: 11 }));
      expect(key(autoBuild(start, ctx, opts({ seed: 11 })))).toBe(key(a));
      const others = [12, 13, 14].map((seed) => key(autoBuild(start, ctx, opts({ seed }))));
      expect(others.some((k) => k !== key(a)), d.file).toBe(true);
    }
  }, 120_000);

  it('build-around cards are in the result at 2+ copies, locked, and their strongest stored partners appear', () => {
    const d = decks.find((x) => x.file.startsWith('irelia'))!;
    const start = blankDeck({ legend: d.deck.legend, format: 'standard-bo3' });
    // The main-deck card of the reference list with the most stored partners that is not a champion unit.
    const anchor = d.deck.main.map((e) => db.get(e.id) as Card)
      .filter((c) => copyLimit(c) >= 3 && !c.superTypes.includes('champion') && !c.superTypes.includes('signature') && (c.energy ?? 0) < 6)
      .sort((a, b) => db.edges(b.id).filter((e) => e.net >= 1).length - db.edges(a.id).filter((e) => e.net >= 1).length || a.id.localeCompare(b.id))[0];
    const partners = db.edges(anchor.id).map((e) => ({ id: e.a === anchor.id ? e.b : e.a, net: e.net }))
      .filter((p) => p.net >= 1 && cardFitsDeck(db.get(p.id) as Card, 'main', start, db) === null && ['unit', 'spell', 'gear'].includes(db.get(p.id)?.type ?? ''))
      .sort((a, b) => b.net - a.net || a.id.localeCompare(b.id));
    expect(partners.length).toBeGreaterThanOrEqual(2);
    const built = autoBuildDetailed(start, ctx, opts({ buildAround: [anchor.id] }));
    expectBuilt(built.deck, db, anchor.name);
    const entry = built.deck.main.find((e) => e.id === anchor.id);
    expect(entry?.qty).toBeGreaterThanOrEqual(2);
    expect(entry?.locked).toBe(true);
    const ids = new Set(built.deck.main.map((e) => e.id));
    expect(partners.slice(0, 2).every((p) => ids.has(p.id)), `${anchor.name}: ${partners.slice(0, 2).map((p) => db.get(p.id)?.name).join(', ')}`).toBe(true);
    expect(built.picks.some((p) => p.phase === 'package' && p.reason.includes(anchor.name))).toBe(true);
    // Without the build-around the anchor's package is not forced: the two decks differ.
    expect(key(autoBuild(start, ctx, opts()))).not.toBe(key(built.deck));
  }, 60_000);

  it('a build-around card that cannot be played is left out with the reason; a build-around battlefield is brought; a champion build-around becomes the Chosen Champion', () => {
    const d = decks[0];
    const legend = db.get(d.deck.legend as string) as Card;
    const start = blankDeck({ legend: legend.id, format: 'standard-bo3' });
    const off = db.all().find((c) => c.type === 'unit' && c.domains.length > 0 && c.domains.every((x) => !legend.domains.includes(x)) && !c.dataIncomplete)!;
    const field = db.all().filter((c) => c.type === 'battlefield' && cardFitsDeck(c, 'battlefields', start, db) === null).sort((a, b) => b.id.localeCompare(a.id))[0];
    const built = autoBuildDetailed(start, ctx, opts({ buildAround: [off.id, field.id, 'no-such-card'] }));
    expectBuilt(built.deck, db, 'off-domain build-around');
    expect(built.deck.main.some((e) => e.id === off.id)).toBe(false);
    expect(built.notes.some((n) => n.includes(off.name) && n.includes('left out'))).toBe(true);
    expect(built.notes.some((n) => n.includes('no-such-card'))).toBe(true);
    expect(built.deck.battlefields).toContain(field.id);
    const champions = db.all().filter((c) => c.type === 'unit' && c.superTypes.includes('champion') && c.championTag === legend.championTag && cardFitsDeck(c, 'main', start, db) === null);
    if (champions.length > 1) {
      const usual = autoBuild(start, ctx, opts()).champion;
      const other = champions.find((c) => c.id !== usual)!;
      expect(autoBuild(start, ctx, opts({ buildAround: [other.id] })).champion).toBe(other.id);
    }
  }, 60_000);

  it('a legend is chosen from the build-around cards when the deck has none; with nothing to go by the deck comes back with a note', () => {
    const d = decks[0];
    const signature = d.deck.main.map((e) => db.get(e.id) as Card).find((c) => c.superTypes.includes('signature'));
    const empty = autoBuildDetailed(blankDeck({ format: 'standard-bo1' }), ctx, opts());
    expect(empty.deck.legend).toBeNull();
    expect(empty.notes.join(' ')).toContain('legend');
    expect(Number.isFinite(empty.rating.rating)).toBe(true);
    if (signature) {
      const built = autoBuildDetailed(blankDeck({ format: 'standard-bo1' }), ctx, opts({ buildAround: [signature.id] }));
      expect(db.get(built.deck.legend as string)?.championTag).toBe(signature.championTag);
      expectBuilt(built.deck, db, 'legend from signature');
    }
  }, 60_000);

  it('locked entries survive an auto-build; unlocked ones are replaced', () => {
    const d = decks[1];
    const main = d.deck.main.map((e, i) => ({ ...e, locked: i < 4 }));
    const side = d.deck.side.map((e, i) => ({ ...e, locked: i === 0 }));
    const built = autoBuild({ ...d.deck, main, side }, ctx, opts({ seed: 3 }));
    expectBuilt(built, db, d.file);
    for (const e of main.slice(0, 4)) {
      const now = built.main.find((x) => x.id === e.id);
      expect(now?.qty, db.get(e.id)?.name).toBeGreaterThanOrEqual(e.qty);
      expect(now?.locked).toBe(true);
    }
    expect(built.side.find((x) => x.id === side[0].id)?.qty).toBeGreaterThanOrEqual(side[0].qty);
    expect(built.champion).toBe(d.deck.champion);
    expect(built.legend).toBe(d.deck.legend);
  }, 60_000);

  it('ownedOnly: a small collection gives a deck of owned cards only and a clear violation list; a full collection gives a legal deck', () => {
    const d = decks[2];
    const start = blankDeck({ legend: d.deck.legend, format: 'standard-bo1' });
    const owned: Record<string, number> = {};
    for (const e of d.deck.main.slice(0, 6)) owned[e.id] = 2;
    owned[d.deck.champion as string] = 1;
    for (const id of d.deck.battlefields.slice(0, 2)) owned[id] = 1;
    const small = autoBuildDetailed(start, ctx, opts({ ownedOnly: true, owned }));
    for (const e of [...small.deck.main, ...small.deck.side]) expect(e.qty, db.get(e.id)?.name).toBeLessThanOrEqual(owned[e.id] ?? 0);
    for (const id of small.deck.battlefields) expect(owned[id]).toBe(1);
    expect(count(small.deck.main)).toBeLessThan(40);
    const codes = small.violations.filter((v) => v.severity === 'error').map((v) => v.code);
    expect(codes).toEqual(expect.arrayContaining(['MAIN_TOO_SMALL', 'BATTLEFIELD_COUNT']));
    expect(small.notes.some((n) => n.includes('collection'))).toBe(true);
    expect(small.rating.legal).toBe(false);

    const all: Record<string, number> = {};
    for (const c of db.all()) all[c.id] = 2;
    const full = autoBuildDetailed(start, ctx, opts({ ownedOnly: true, owned: all }));
    expectBuilt(full.deck, db, 'two of everything');
    expect(full.deck.main.every((e) => e.qty <= 2)).toBe(true);
  }, 60_000);

  it('fillRest keeps every card already present and fills main, runes, battlefields and the side deck', () => {
    const d = decks[3];
    const partial: Deck = { ...d.deck, main: d.deck.main.slice(0, 7), side: d.deck.side.slice(0, 2), runes: {}, battlefields: d.deck.battlefields.slice(0, 1) };
    const filled = fillRestDetailed(partial, ctx, opts());
    expectBuilt(filled.deck, db, d.file);
    for (const e of partial.main) expect(filled.deck.main.find((x) => x.id === e.id)?.qty, db.get(e.id)?.name).toBe(e.qty);
    for (const e of partial.side) expect(filled.deck.side.find((x) => x.id === e.id)?.qty, db.get(e.id)?.name).toBeGreaterThanOrEqual(e.qty);
    expect(filled.deck.battlefields[0]).toBe(partial.battlefields[0]);
    expect(filled.climb).toEqual([]);
    // A complete deck comes back as it is.
    const whole = fillRest(d.deck, ctx, opts());
    expect(whole.main).toEqual(d.deck.main);
    expect(whole.runes).toEqual(d.deck.runes);
    expect(whole.battlefields).toEqual(d.deck.battlefields);
  }, 60_000);

  it('improveDeck: 8 copies of a reference deck replaced by weak cards give 4+ proposals, each raising the rating, none cutting a locked card', () => {
    const d = decks.find((x) => x.file.startsWith('irelia'))!;
    const inDeck = new Set(d.deck.main.map((e) => e.id));
    const weak = db.all()
      .filter((c) => (c.type === 'unit' || c.type === 'spell' || c.type === 'gear') && !inDeck.has(c.id) && copyLimit(c) >= 3 && cardFitsDeck(c, 'main', d.deck, db) === null && !c.superTypes.includes('signature'))
      .sort((a, b) => featuresFor(db, a).evaluatedRating - featuresFor(db, b).evaluatedRating || a.id.localeCompare(b.id)).slice(0, 3);
    // Take 8 copies out of the non-champion cards, last entries first.
    let cut = 8;
    const main: DeckEntry[] = [];
    for (const e of [...d.deck.main].reverse()) {
      if (cut > 0 && e.id !== d.deck.champion) { const take = Math.min(cut, e.qty); cut -= take; if (e.qty - take > 0) main.push({ ...e, qty: e.qty - take }); } else main.push(e);
    }
    main.push({ id: weak[0].id, qty: 3, locked: false }, { id: weak[1].id, qty: 3, locked: false }, { id: weak[2].id, qty: 2, locked: true });
    const worse: Deck = { ...d.deck, main };
    expect(count(worse.main)).toBe(40);
    const before = rate(worse, ctx);
    const proposals = improveDeck(worse, ctx, opts());
    expect(proposals.length).toBeGreaterThanOrEqual(4);
    expect(proposals.length).toBeLessThanOrEqual(15);
    expect(proposals[0].ratingBefore).toBe(before.precise);
    proposals.forEach((p, i) => {
      expect(p.ratingAfter, `proposal ${i}`).toBeGreaterThan(p.ratingBefore);
      if (i > 0) expect(p.ratingBefore).toBe(proposals[i - 1].ratingAfter);
      expect(p.out).not.toBe(weak[2].id);
      expect(p.reason).toContain(db.get(p.in)?.name);
      expect(p.reason).toContain(db.get(p.out)?.name);
    });
    expect(proposals.some((p) => p.out === weak[0].id || p.out === weak[1].id)).toBe(true);
    const improved = applySwaps(worse, proposals);
    expect(count(improved.main)).toBe(40);
    expect(improved.main.find((e) => e.id === weak[2].id)?.qty).toBe(2);
    expect(rate(improved, ctx).precise).toBe(proposals[proposals.length - 1].ratingAfter);
    expect(errors(improved, db)).toEqual([]);
    expect(improveDeck(worse, ctx, opts(), 2)).toHaveLength(2);
    expect(improveDeck(worse, ctx, opts(), 0)).toEqual([]);
  }, 120_000);

  it('an imported list with a banned card gets that card cut first, by improveDeck and by suggestSwaps', () => {
    const bans = db.legality().bans.filter((b) => b.zone === 'main' && b.formats.includes('standard-bo3')).map((b) => db.byName(b.name)).filter((c): c is Card => !!c && c.type !== 'legend');
    let found: { deck: Deck; banned: Card } | null = null;
    for (const d of decks) {
      const legend = db.get(d.deck.legend as string) as Card;
      const banned = bans.find((c) => c.domains.length > 0 && c.domains.every((x) => legend.domains.includes(x)) && !c.superTypes.includes('signature') && !c.superTypes.includes('champion'));
      if (!banned) continue;
      const victim = d.deck.main.find((e) => e.id !== d.deck.champion && e.qty >= 2)!;
      const main = d.deck.main.map((e) => (e.id === victim.id ? { ...e, qty: e.qty - 2 } : e)).filter((e) => e.qty > 0);
      found = { deck: { ...d.deck, main: [...main, { id: banned.id, qty: 2, locked: false }] }, banned };
      break;
    }
    expect(found).not.toBeNull();
    const { deck, banned } = found!;
    expect(errors(deck, db).some((e) => e.startsWith('CARD_BANNED'))).toBe(true);
    const proposals = improveDeck(deck, ctx, opts());
    expect(proposals.slice(0, 2).map((p) => p.out)).toEqual([banned.id, banned.id]);
    expect(proposals[0].reason).toContain(banned.name);
    expect(proposals[1].ratingAfter).toBeGreaterThan(proposals[0].ratingBefore);
    expect(errors(applySwaps(deck, proposals), db)).toEqual([]);
    const suggested = suggestSwaps(deck, ctx, opts());
    expect(suggested[0].out).toBe(banned.id);
    expect(suggested.length).toBeLessThanOrEqual(5);
  }, 120_000);

  it('suggestSwaps gives independent proposals for different cards, best gain first; applySwaps skips what it cannot do', () => {
    const d = decks[4];
    const base = rate(d.deck, ctx).precise;
    const swaps = suggestSwaps(d.deck, ctx, opts(), 4);
    expect(swaps.length).toBeLessThanOrEqual(4);
    expect(new Set(swaps.map((s) => s.out)).size).toBe(swaps.length);
    swaps.forEach((s, i) => {
      expect(s.ratingBefore).toBe(base);
      expect(s.ratingAfter).toBeGreaterThan(base);
      if (i > 0) expect(s.ratingAfter - s.ratingBefore).toBeLessThanOrEqual(swaps[i - 1].ratingAfter - swaps[i - 1].ratingBefore + 1e-9);
      expect(rate(applySwaps(d.deck, [s]), ctx).precise).toBe(s.ratingAfter);
    });
    expect(suggestSwaps(d.deck, ctx, opts(), 0)).toEqual([]);
    const ghost = { zone: 'main' as const, out: 'not-in-deck', in: d.deck.main[0].id, reason: '', ratingBefore: 0, ratingAfter: 0 };
    expect(applySwaps(d.deck, [ghost])).toEqual(d.deck);
    const lastChampion = { ...ghost, out: d.deck.champion as string };
    const oneCopy: Deck = { ...d.deck, main: d.deck.main.map((e) => (e.id === d.deck.champion ? { ...e, qty: 1 } : e)) };
    expect(applySwaps(oneCopy, [lastChampion])).toEqual(oneCopy);
  }, 120_000);

  it('buildSideDeck: full in a side-deck format with reasons, empty elsewhere, copy limits over main and side, locked side cards kept', () => {
    const d = decks[5];
    const side = buildSideDeck({ ...d.deck, side: [] }, ctx, opts());
    expect(count(side)).toBe(10);
    for (const e of side) expect(e.qty + (d.deck.main.find((m) => m.id === e.id)?.qty ?? 0)).toBeLessThanOrEqual(copyLimit(db.get(e.id) as Card));
    expect(errors({ ...d.deck, side }, db)).toEqual([]);
    const plan = planSideDeck({ ...d.deck, side: [] }, ctx, opts());
    expect(plan.picks.reduce((n, p) => n + p.qty, 0)).toBe(10);
    expect(plan.picks.every((p) => p.zone === 'side' && p.reason.length > 20)).toBe(true);
    expect(plan.picks.some((p) => p.phase === 'side:gear-hate' || p.phase === 'side:removal')).toBe(true);
    for (const format of ['ffa3', 'ffa4', 'casual'] as Format[]) expect(buildSideDeck({ ...d.deck, format }, ctx, opts())).toEqual([]);
    expect(count(buildSideDeck({ ...d.deck, format: '2v2', side: [] }, ctx, opts()))).toBe(10);
    const lock = d.deck.side[0];
    const kept = buildSideDeck({ ...d.deck, side: [{ ...lock, locked: true }, ...d.deck.side.slice(1)] }, ctx, opts());
    expect(kept.find((e) => e.id === lock.id)?.locked).toBe(true);
    expect(kept.find((e) => e.id === lock.id)?.qty).toBeGreaterThanOrEqual(lock.qty);
    expect(count(kept)).toBe(10);
    expect(buildSideDeck(blankDeck({ format: 'standard-bo3' }), ctx, opts())).toEqual([]);
  }, 60_000);

  it('rune split: 12 runes inside the legend\'s domains with the reason; copies follow the plan', () => {
    for (const d of decks) {
      const legend = db.get(d.deck.legend as string) as Card;
      const runes = chooseRunes(d.deck, ctx);
      expect(Object.values(runes.runes).reduce((n: number, x) => n + (x ?? 0), 0), d.file).toBe(12);
      expect(Object.keys(runes.runes).every((x) => (legend.domains as string[]).includes(x)), d.file).toBe(true);
      expect(runes.reason.length).toBeGreaterThan(20);
    }
    expect(chooseRunes(blankDeck(), ctx).runes).toEqual({});
    const d = decks[0];
    const unique = db.all().find((c) => copyLimit(c) === 1 && c.type === 'unit');
    if (unique) expect(suggestedCopies(unique, d.deck, { ctx, opts: opts(), anchors: [], profile: PROFILES.midrange }).copies).toBe(1);
  });

  it('partial and broken decks never throw: no legend, no champion, 7 cards, 43 cards, no runes, unknown ids, bad numbers', () => {
    const d = decks[0];
    const cases: Deck[] = [
      blankDeck(),
      blankDeck({ legend: 'no-such-legend' }),
      { ...d.deck, champion: null },
      { ...d.deck, main: d.deck.main.slice(0, 3) },
      { ...d.deck, main: [...d.deck.main, { id: d.deck.main[1].id, qty: 3, locked: false }] },
      { ...d.deck, runes: {} },
      { ...d.deck, main: [...d.deck.main.slice(0, 5), { id: 'ghost', qty: 2, locked: true }, { id: d.deck.main[6].id, qty: Number.NaN, locked: false }] },
      { ...d.deck, format: 'nope' as Format },
    ];
    for (const deck of cases) {
      for (const run of [
        () => autoBuildDetailed(deck, ctx, opts()).rating.rating,
        () => fillRestDetailed(deck, ctx, opts({ seed: Number.NaN })).rating.rating,
        () => improveDeck(deck, ctx, opts(), 2).length,
        () => suggestSwaps(deck, ctx, opts(), 2).length,
        () => buildSideDeck(deck, ctx, opts()).length,
      ]) {
        let value = Number.NaN;
        expect(() => { value = run(); }).not.toThrow();
        expect(Number.isFinite(value)).toBe(true);
      }
    }
    // No champion: one is chosen. 43 cards in fill mode: nothing is cut, the size violation is reported.
    expect(autoBuild({ ...d.deck, champion: null }, ctx, opts()).champion).not.toBeNull();
    const over = fillRestDetailed({ ...d.deck, main: [...d.deck.main, { id: d.deck.main[1].id, qty: 3, locked: false }] }, ctx, opts());
    expect(count(over.deck.main)).toBe(43);
    expect(over.violations.some((v) => v.severity === 'error')).toBe(true);
    expect(CLIMB_STEPS).toBeGreaterThan(0);
  }, 180_000);

  it('2v2: the teammate\'s battlefields are not brought', () => {
    const d = decks[0];
    const alone = autoBuild(blankDeck({ legend: d.deck.legend, format: '2v2' }), ctx, opts());
    const withMate = autoBuild(blankDeck({ legend: d.deck.legend, format: '2v2', teammate: { legend: null, battlefields: alone.battlefields } }), ctx, opts());
    expect(withMate.battlefields.some((id) => alone.battlefields.includes(id))).toBe(false);
    expect(errors(withMate, db)).toEqual([]);
  }, 60_000);
});

describe.skipIf(!hasRealDb())('autoBuild on the synced pool (data/forge.db)', () => {
  const full = process.env.FORGE_BUILDER_FULL === '1';
  it(`${full ? 'all legends' : 'a sample of legends (FORGE_BUILDER_FULL=1 for all)'} x 6 formats: legal, 40 / 12 / 3, rating 55+, under 3 s`, async () => {
    const { openDb } = await import('@/server/db');
    const { loadCardDb } = await import('@/server/carddb');
    const db = loadCardDb(openDb());
    const ctx = ctxOf(db);
    const all = db.all().filter((c) => c.type === 'legend' && !c.dataIncomplete).sort((a, b) => a.id.localeCompare(b.id));
    const legends = full ? all : all.filter((_, i) => i % 8 === 0);
    autoBuild(blankDeck({ legend: legends[0].id, format: 'standard-bo3' }), ctx, opts());
    const times: number[] = [];
    const ratings: number[] = [];
    const failed: string[] = [];
    let seedPairs = 0;
    let seedSame = 0;
    const bannedLegends: string[] = [];
    for (const legend of legends) {
      for (const format of FORMATS) {
        const label = `${legend.championTag}, ${legend.name} ${format}`;
        const t = performance.now();
        const built = autoBuildDetailed(blankDeck({ legend: legend.id, format }), ctx, opts());
        times.push(performance.now() - t);
        ratings.push(built.rating.rating);
        // A legend banned in the format cannot be repaired by a builder that keeps the legend: that one violation must be the only one.
        if (cardFitsDeck(legend, 'legend', blankDeck({ legend: legend.id, format }), db)) {
          bannedLegends.push(label);
          expect(built.violations.filter((v) => v.severity === 'error').map((v) => v.code), label).toEqual(['LEGEND_BANNED']);
          expect(count(built.deck.main), label).toBe(40);
          continue;
        }
        try { expectBuilt(built.deck, db, label); expect(isLegal(built.violations)).toBe(true); } catch (e) { failed.push(`${label}: ${(e as Error).message.split('\n')[0]}`); }
        if (built.rating.rating < 55) failed.push(`${label}: rating ${built.rating.rating}`);
        if (format === 'standard-bo3') {
          seedPairs += 1;
          if (key(autoBuild(blankDeck({ legend: legend.id, format }), ctx, opts({ seed: 2 }))) === key(built.deck)) seedSame += 1;
        }
      }
    }
    const sorted = (xs: number[]): number[] => [...xs].sort((a, b) => a - b);
    const q = (xs: number[], p: number): number => sorted(xs)[Math.min(xs.length - 1, Math.floor(p * xs.length))];
    const hist = [55, 60, 65, 70, 75, 80, 85, 90, 95].map((lo) => `${lo}-${lo + 4}: ${ratings.filter((r) => r >= lo && r < lo + 5).length}`).join(', ');
    console.log(`[builder, synced pool] ${legends.length} legends x ${FORMATS.length} formats = ${times.length} builds; ${times.length - bannedLegends.length - new Set(failed.map((f) => f.split(':')[0])).size} legal, ${bannedLegends.length} with a legend banned in the format (${bannedLegends.join('; ') || 'none'}), ${new Set(failed.map((f) => f.split(':')[0])).size} failed; `
      + `time ms median ${Math.round(q(times, 0.5))}, p95 ${Math.round(q(times, 0.95))}, max ${Math.round(q(times, 1))}; rating min ${q(ratings, 0)}, median ${q(ratings, 0.5)}, max ${q(ratings, 1)}; ${hist}; below 55: ${ratings.filter((r) => r < 55).length}; `
      + `seed 1 = seed 2 in ${seedSame} of ${seedPairs} best-of-three builds`);
    expect(failed).toEqual([]);
    expect(q(times, 1)).toBeLessThan(3000);
    expect(seedSame).toBeLessThan(Math.max(1, seedPairs / 4));
  }, 1_800_000);
});
