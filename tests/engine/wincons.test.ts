// Win routes (plan Task 7, spec 12). The reference decks are six public lists of six legends; the card pool,
// legend meta and ban list are the committed fixtures, so every expectation here is about real card text.
import path from 'node:path';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import type { Card, Deck, DeckEntry, WinReport } from '@/engine/types';
import {
  HIDDEN_REF, ROUTE_REF, answerHits, answersOf, deckCard, describeAnswer, detectWinRoutes, fieldOf, formatFacts, routeFeatures, routeReferences, viewDeck,
} from '@/engine/wincons';
import { loadCardDb } from '@/server/carddb';
import { hasRealDb, metaLists } from '../helpers/real-db';
import { theoryDb } from '../helpers/theory-db';

const { db, decks } = theoryDb();
const ctx = { db, opponentLegend: null };
const card = (name: string): Card => {
  const c = db.byName(name);
  if (!c) throw new Error(`fixture has no card named ${name}`);
  return c;
};
const deckOf = (prefix: string): Deck => {
  const d = decks.find((x) => x.file.startsWith(prefix));
  if (!d) throw new Error(`no reference deck ${prefix}`);
  return structuredClone(d.deck);
};
const report = (prefix: string): WinReport => detectWinRoutes(deckOf(prefix), ctx);
const names = (ids: readonly string[]): string[] => ids.map((id) => db.get(id)?.name ?? id);
const features = (name: string, role: 'main' | 'legend' | 'battlefield' = 'main'): Set<string> => routeFeatures(deckCard(card(name), db), role);
const entry = (name: string, qty: number): DeckEntry => ({ id: card(name).id, qty, locked: false });

describe('answers: what an interaction card can actually hit (wincons.md V6 item 4)', () => {
  it('reads damage size, Might caps, domain limits and location from the card sentence', () => {
    expect(answersOf(card('Gust'))).toMatchObject([{ kind: 'bounce', maxMight: 3, where: 'battlefield' }]);
    expect(answersOf(card('Falling Star'))).toMatchObject([{ kind: 'damage', amount: 3 }]);
    expect(answersOf(card('Decree of Rage'))).toMatchObject([{ kind: 'damage', amount: 4, domain: 'calm' }]);
    expect(answersOf(card('Decree of Unity')).map((a) => [a.kind, a.domain])).toEqual([['kill', 'chaos'], ['gear-kill', 'chaos']]);
    expect(answersOf(card('Star-Crossed'))).toMatchObject([{ kind: 'bounce', needsOwnUnit: true }]);
    expect(answersOf(card('Bedeviling Stranger'))[0].condition).toMatch(/4 or more units/);
    expect(answersOf(card('Unchecked Power'))).toMatchObject([{ kind: 'sweep', amount: 12 }]);
  });
  it('reads counterspell conditions', () => {
    expect(answersOf(card('Defy'))[0].counter).toMatchObject({ maxEnergy: 4, maxPower: 1 });
    expect(answersOf(card('Hush'))[0].counter).toMatchObject({ minPower: 2 });
    expect(describeAnswer(answersOf(card('Defy'))[0])).toBe('counter a spell: Energy 4 or less, Power 1 or less');
    // Falling Star costs 2 Power: outside Defy, inside Hush.
    expect(answerHits(answersOf(card('Defy'))[0], card('Falling Star')).hits).toBe(false);
    expect(answerHits(answersOf(card('Hush'))[0], card('Falling Star')).hits).toBe(true);
    expect(answerHits(answersOf(card('Defy'))[0], card('Ride the Wind')).hits).toBe(true);
  });
  it('does not credit removal a card does not have (P3, P4)', () => {
    // Gear-only kill: no unit answer. A flicker (banish, then its owner replays it) is no answer at all.
    expect(answersOf(card("An Offer You Can't Refuse")).map((a) => a.kind)).toEqual(['gear-kill']);
    expect(answersOf(card('Temporal Breach'))).toEqual([]);
    // "Kill a friendly unit ... as an additional cost" is a cost, not removal.
    expect(answersOf(card('Shimmering Swimmer')).map((a) => a.kind)).toEqual(['damage']);
    const nocturne = card('Nocturne, Horrifying'); // 4 Might, Chaos
    expect(answerHits(answersOf(card('Bellows Breath'))[0], nocturne)).toMatchObject({ hits: false, why: 'deals 1, short of 4 Might' });
    expect(answerHits(answersOf(card('Gust'))[0], nocturne).hits).toBe(false);
    expect(answerHits(answersOf(card('Falling Star'))[0], nocturne).hits).toBe(false);
    expect(answerHits(answersOf(card('Decree of Rage'))[0], nocturne)).toMatchObject({ hits: false, why: 'only calm units' });
    expect(answerHits(answersOf(card('Decree of Unity'))[0], nocturne).hits).toBe(true);
    expect(answerHits(answersOf(card('Falling Star'))[0], card('Trifarian Captain')).hits).toBe(true);
    // A targeted answer on a Deflect unit works and says what it costs.
    expect(answerHits(answersOf(card('Star-Crossed'))[0], card('Vex, Apathetic')).why).toMatch(/Deflect/);
  });
});

describe('route features: the prototype failures P1-P9', () => {
  it('P1: a keyword counts only on the card that has it', () => {
    expect(features('Carrion Dredger').has('prot')).toBe(false);        // its token has Deflect
    expect(features('Decree of Insight').has('prot')).toBe(false);      // names Deflect in its cost
    expect(features('Scuttle Crab').has('facedown-pay')).toBe(false);   // "facedown cards" in a Deathknell
    expect(features('Scuttle Crab').has('hidden')).toBe(false);
    expect(features('Vex, Apathetic').has('prot')).toBe(true);
    expect(features('Edge of Night').has('facedown-pay')).toBe(true);
  });
  it('P4: self-returning holders, units without combat damage and mass damage are not misfiled', () => {
    const blitz = features('Blitzcrank, Impassive');
    expect(blitz.has('no-hold')).toBe(true);
    expect(blitz.has('tank')).toBe(false);
    expect(blitz.has('holdpay')).toBe(false);
    expect(features('Galio, Indefatigable').has('no-combat-damage')).toBe(true);
    expect(features('Graves, Blasting Through').has('no-combat-damage')).toBe(true);
    expect(features('Unchecked Power').has('widepay')).toBe(false);
    expect(features('Unchecked Power').has('sweep')).toBe(true);
  });
  it('P5: "ready me" on a legend readies the legend; a move to base is a retreat', () => {
    expect(features('The Boss', 'legend').has('ready')).toBe(false);
    expect(features('Battle Mistress', 'legend').has('ready')).toBe(false);
    expect(features('Voidreaver', 'legend').has('move')).toBe(false);
    expect(features('Voidreaver', 'legend').has('retreat')).toBe(true);
    expect(features('The Exile', 'legend').has('haste')).toBe(true);
    expect(features('Pride of Nazumah', 'legend').has('shield-to-assault')).toBe(true);
    expect(features('Herald of the Arcane', 'legend').has('token-engine')).toBe(true);
  });
  it('P6: a battlefield only counts for points, doublers and alternate wins', () => {
    expect([...features('Minefield', 'battlefield')]).toEqual([]);
    expect([...features('Zaun Warrens', 'battlefield')]).toEqual([]);
    expect(features('The Grand Plaza', 'battlefield').has('altwin')).toBe(true);
  });
  it('P9: families the prototype had no feature for', () => {
    for (const n of ['Lightning Rush', 'Nocturne, Horrifying', 'Fizz, Trickster', 'Bedeviling Stranger', 'Switcheroo']) expect(features(n).has('elsewhere'), n).toBe(true);
    expect(features('Trifarian Captain').has('elsewhere')).toBe(false);
    expect(features("Kha'Zix, Mutating Horror").has('solo')).toBe(true);
    expect(features('Sabotage').has('hand-attack')).toBe(true);
    expect(features('Rhasa the Sunderer').has('cost-reduction')).toBe(true);
    // A 4-Might unit that gives itself +2 is a big threat on the turn it matters.
    expect(features("Kha'Zix, Mutating Horror").has('self-pump')).toBe(true);
    expect(features('Akali, Silent').has('self-pump')).toBe(true);
  });
});

describe('detectWinRoutes on the six reference decks', () => {
  const reports = decks.map((d) => ({ d, r: detectWinRoutes(d.deck, ctx) }));

  it('finds at least one route per deck, with closers that are in the deck', () => {
    for (const { d, r } of reports) {
      const main = new Set(d.deck.main.map((e) => e.id));
      const all = new Set([...main, d.deck.legend, ...d.deck.battlefields]);
      expect(r.routes.length, d.file).toBeGreaterThanOrEqual(1);
      for (const route of r.routes) {
        expect(route.closers.length, `${d.file} ${route.id}`).toBeGreaterThan(0);
        for (const id of route.closers) expect(route.id === 'altwin' ? all.has(id) : main.has(id), `${d.file} ${route.id} closer ${db.get(id)?.name}`).toBe(true);
        for (const id of route.enablers) expect(all.has(id), `${d.file} enabler ${id}`).toBe(true);
        expect(route.strength).toBeGreaterThanOrEqual(0);
        expect(route.strength).toBeLessThanOrEqual(1);
        expect(route.pCloserByTurn5).toBeGreaterThan(0);
        expect(route.pCloserByTurn5).toBeLessThanOrEqual(1);
        expect(route.closerCopies).toBeGreaterThan(0);
        expect(Number.isFinite(route.clock)).toBe(true);
        expect(route.notes.length).toBeGreaterThan(0);
      }
      expect(r.value).toBeGreaterThan(0);
      expect(r.value).toBeLessThanOrEqual(1);
    }
  });
  it('gives at least four different primary routes across the six', () => {
    const primaries = Object.fromEntries(reports.map(({ d, r }) => [d.file.split('-')[0], r.routes[0].id]));
    expect(primaries).toEqual({ irelia: 'burst', kaisa: 'attrition', kennen: 'burst', khazix: 'tall', reksai: 'wide', riven: 'burst' });
    expect(new Set(Object.values(primaries)).size).toBeGreaterThanOrEqual(4);
  });
  it('names the closers a player would name', () => {
    expect(names(report('kennen').routes[0].closers)).toEqual(['Nocturne, Horrifying', 'Ride the Wind']);
    expect(names(report('kaisa').routes[0].closers)).toEqual(['Thousand-Tailed Watcher', 'The Empyrean']);
    expect(names(report('riven').routes[0].closers)).toEqual(['Riven, Broken Blade', 'Riven, Deserter', 'Hunker Down']);
    expect(names(report('khazix').routes[0].closers)[0]).toBe("Kha'Zix, Mutating Horror");
    // The Chosen Champion is listed first and is always available (Champion Zone).
    expect(report('riven').routes[0].pCloserByTurn5).toBe(1);
    expect(report('kennen').routes[0].pCloserByTurn5).toBeCloseTo(0.75, 2); // 5 copies in 9 of 39 cards
  });
  it('folds-to lines are non-empty, name the deck\'s own card, and only name answers that work', () => {
    for (const { d, r } of reports) {
      const mine = new Set(d.deck.main.map((e) => e.id));
      const primary = r.routes[0];
      expect(primary.foldsTo.length, d.file).toBeGreaterThan(0);
      for (const fold of r.routes.flatMap((x) => x.foldsTo)) {
        expect(fold.cardIds.length, fold.text).toBeGreaterThan(0);
        for (const id of fold.cardIds) expect(mine.has(id), fold.text).toBe(true);
        expect(names(fold.cardIds).some((n) => fold.text.includes(n)), fold.text).toBe(true);
        for (const id of fold.answerIds ?? []) expect(db.get(id), id).toBeDefined();
        if (fold.fieldRate !== null) { expect(fold.fieldRate).toBeGreaterThanOrEqual(0); expect(fold.fieldRate).toBeLessThanOrEqual(1); }
      }
      // Sorted by how common the answer is; rule-fact lines (no rate) last.
      const rates = primary.foldsTo.map((f) => f.fieldRate ?? -1);
      expect(rates).toEqual([...rates].sort((a, b) => b - a));
    }
    // Kennen's Nocturne has 4 Might: every named answer reaches it, and a card that does not is called out.
    const first = report('kennen').routes[0].foldsTo.find((f) => f.text.startsWith('Nocturne, Horrifying'))!;
    expect(first.text).toMatch(/Not an answer: /);
    const nocturne = card('Nocturne, Horrifying');
    expect((first.answerIds ?? []).length).toBeGreaterThan(0);
    for (const id of first.answerIds ?? []) expect(answersOf(db.get(id)!).some((a) => answerHits(a, nocturne).hits), db.get(id)!.name).toBe(true);
    expect(first.answerIds).not.toContain(card('Gust').id);
    expect(first.answerIds).not.toContain(card('Falling Star').id);
  });
  it('5.2-1: Kennen\'s legend is fed by cards played from outside the hand', () => {
    const note = report('kennen').routes[0].notes.find((n) => n.startsWith('Kennen, Heart of the Tempest is switched on'))!;
    expect(note).toMatch(/outside the hand/);
    expect(Number(/(\d+) copies/.exec(note)![1])).toBeGreaterThanOrEqual(12);
  });
  it('P4: Blitzcrank, Impassive is not a hold closer for Riven', () => {
    const r = report('riven');
    expect(r.routes.some((x) => x.id === 'hold')).toBe(false);
    expect(r.routes[0].notes.find((n) => n.startsWith('Last point'))).not.toMatch(/Blitzcrank/);
  });
  it('V6-5: routes within the margin are marked co-primary', () => {
    const r = report('khazix');
    expect(r.routes[1].id).toBe('burst');
    expect(r.routes[1].notes[0]).toMatch(/co-primary with One big threat/);
  });
  it('quotes the rule for the last point, the victory score and the Champion Zone', () => {
    const notes = report('riven').routes[0].notes.join(' ');
    expect(notes).toMatch(/CR 473\.1\.a\.1/);
    expect(notes).toMatch(/CR 473\.1\.b\.1/);
    expect(notes).toMatch(/CR 103\.3\.a\.1/);
    expect(notes).toMatch(/toward 8, CR 488\.3/);
  });
  it('is deterministic', () => {
    for (const { d, r } of reports) expect(detectWinRoutes(structuredClone(d.deck), ctx)).toEqual(r);
  });
});

describe('legality, special routes and formats', () => {
  it('P8: a banned card is dropped before anything is counted, and named', () => {
    const deck = deckOf('kennen');
    deck.main.push(entry('Fight or Flight', 3));
    const r = detectWinRoutes(deck, ctx);
    const banned = card('Fight or Flight').id;
    for (const route of r.routes) { expect(route.closers).not.toContain(banned); expect(route.enablers).not.toContain(banned); }
    expect(r.routes[0].notes).toContain('Fight or Flight is not counted: it is banned in standard-bo3.');
    // The same card is not banned in a casual game.
    expect(viewDeck({ ...deck, format: 'casual' }, db).excluded).toEqual([]);
  });
  it('P10: an alternate win is shown as present, with no strength', () => {
    const deck = deckOf('kennen');
    deck.main.push(entry('Gutter Palace', 3));
    deck.battlefields = [card('The Grand Plaza').id, ...deck.battlefields.slice(0, 2)];
    const alt = detectWinRoutes(deck, ctx).routes.find((x) => x.id === 'altwin')!;
    expect(names(alt.closers).sort()).toEqual(['Gutter Palace', 'The Grand Plaza']);
    expect(alt.strength).toBe(0);
    expect(alt.notes.join(' ')).toMatch(/you win the game/);
    expect(alt.notes.join(' ')).toMatch(/no strength number/);
  });
  it('5.2-3: a route nobody closes alone falls back to its main feature and says so', () => {
    const deck = deckOf('reksai');
    deck.main = [entry('Trifarian Captain', 3), entry('Faithful Manufactor', 3), entry('Hunting Dog', 3), entry('Traveling Merchant', 3)];
    deck.champion = null;
    const r = detectWinRoutes(deck, ctx);
    const fallback = r.routes.find((x) => x.notes.some((n) => n.startsWith('No single card closes this route')));
    expect(fallback).toBeDefined();
    expect(fallback!.closers.length).toBeGreaterThan(0);
  });
  it('uses the format\'s victory score and battlefield count', () => {
    const duel = report('riven').routes[0];
    const ffa = detectWinRoutes({ ...deckOf('riven'), format: 'ffa4' }, ctx).routes[0];
    const team = detectWinRoutes({ ...deckOf('riven'), format: '2v2' }, ctx).routes[0];
    expect(duel.notes.join(' ')).toMatch(/all 2 battlefields/);
    expect(ffa.notes.join(' ')).toMatch(/all 3 battlefields/);
    expect(ffa.notes.join(' ')).toMatch(/CR 490\.3/);
    expect(team.notes.join(' ')).toMatch(/your half of 11, CR 491\.3/);
    expect(team.notes.join(' ')).toMatch(/CR 491\.8\.g\.1/);
    expect(team.clock).toBeLessThan(duel.clock);
    expect(formatFacts('ffa4').seats[0].seen(1)).toBe(4); // the first player skips the first draw
    expect(formatFacts('ffa4').seats[1].seen(1)).toBe(5);
    expect(formatFacts('standard-bo1').seats[0].runes(1)).toBe(2);
    expect(formatFacts('standard-bo1').seats[1].runes(1)).toBe(3);
    expect(formatFacts('standard-bo1').seats[1].runes(6)).toBe(12);
    expect(formatFacts('standard-bo1').firstTurnRule).toBe('CR 487.7');
    expect(formatFacts('2v2').victoryScore).toBe(11);
  });
  it('the field is built from every legend with enough lists', () => {
    const field = fieldOf(db);
    expect(field.legends.length).toBe(6);
    expect(field.lists).toBeGreaterThan(50);
    const gust = card('Gust');
    expect(field.byId.get(gust.id)!.rate).toBeGreaterThan(0);
    expect(field.rateOfAny([gust.id, card('Falling Star').id])).toBeGreaterThanOrEqual(field.byId.get(gust.id)!.rate);
    expect(field.rateOfAny([])).toBe(0);
  });
});

describe('partial and broken decks never throw', () => {
  const base = deckOf('kennen');
  const rhasa = card('Rhasa the Sunderer').id;
  const cases: Record<string, Deck> = {
    empty: { ...base, legend: null, champion: null, main: [], side: [], runes: {}, battlefields: [] },
    'legend only': { ...base, champion: null, main: [], side: [], runes: {}, battlefields: [] },
    'no legend, no champion, 7 cards': { ...base, legend: null, champion: null, main: base.main.slice(0, 3), runes: {} },
    '43 cards': { ...base, main: [...base.main, entry('Falling Star', 3)] },
    '0 runes': { ...base, runes: {} },
    'bad quantities': { ...base, main: [...base.main.slice(0, 4), { id: 'nope', qty: 3, locked: false }, { id: base.main[5].id, qty: Number.NaN, locked: false }, { id: base.main[6].id, qty: -2, locked: false }] },
    'champion not in main': { ...base, champion: rhasa, main: base.main.filter((e) => e.id !== rhasa) },
  };
  for (const [name, deck] of Object.entries(cases)) {
    it(name, () => {
      const r = detectWinRoutes(deck, ctx);
      expect(JSON.stringify(r)).not.toMatch(/NaN|Infinity|undefined/);
      expect(Number.isFinite(r.value)).toBe(true);
      for (const route of r.routes) { expect(Number.isFinite(route.strength)).toBe(true); expect(Number.isFinite(route.clock)).toBe(true); }
    });
  }
  it('an empty deck has no routes', () => {
    expect(detectWinRoutes(cases.empty, ctx)).toEqual({ routes: [], hiddenDelivery: false, value: 0 });
  });
});

describe.skipIf(!hasRealDb())('calibration against the synced lists (wincons.md 5.2 item 7)', () => {
  it('ROUTE_REF stays near the 75th percentile of the raw route scores of the synced lists', () => {
    const sql = new Database(process.env.RIFTBOUND_FORGE_DB ?? path.join(process.cwd(), 'data', 'forge.db'), { readonly: true, fileMustExist: true });
    try {
      const real = loadCardDb(sql);
      const all: Deck[] = metaLists().filter((l) => l.complete && l.legend).map((l) => ({
        id: null, name: l.name, format: 'standard-bo3', power: 'competitive', legend: l.legend, champion: l.champion,
        main: l.zones.main.map((e) => ({ ...e, locked: false })), side: [], runes: {}, battlefields: l.zones.battlefields.map((b) => b.id),
        extraLegends: [], themeWeights: null, teammate: null,
      }));
      expect(all.length).toBeGreaterThan(100);
      // A refreshed meta moves these. Outside the band the constants in detect.ts are stale: recompute them
      // with `routeReferences` and update ROUTE_REF and HIDDEN_REF.
      const refs = routeReferences(all, real);
      for (const route of ['wide', 'tall', 'hold', 'burst', 'attrition'] as const) {
        expect(refs[route], route).toBeGreaterThan(ROUTE_REF[route] * 0.65);
        expect(refs[route], route).toBeLessThan(ROUTE_REF[route] * 1.35);
      }
      expect(refs.hidden).toBeGreaterThan(HIDDEN_REF * 0.65);
      expect(refs.hidden).toBeLessThan(HIDDEN_REF * 1.35);
    } finally {
      sql.close();
    }
  });
});
