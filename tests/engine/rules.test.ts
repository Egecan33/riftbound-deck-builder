// Rules engine: one test per row of docs/research/rules.md §12 and per worked edge case of §13,
// on the committed fixture cards and the real sync-data/legality.json.
import { describe, expect, it } from 'vitest';
import { createCardDb } from '@/engine/carddb';
import { isChampionUnit } from '@/engine/rules/champion';
import { identityFit } from '@/engine/rules/identity';
import {
  cardFitsDeck, championTagOf, copyLimit, domainIdentity, eligibleChampions, formatRules, isLegal, validateDeck,
} from '@/engine/rules/validate';
import type { Card, CardDb, Deck, DeckEntry, Domain, Format, LegalityData, Violation } from '@/engine/types';
import { fixtureCards, fixtureDb, fixtureDecks } from '../helpers/fixture-db';

const db = fixtureDb();
const FORMATS: Format[] = ['standard-bo1', 'standard-bo3', '2v2', 'ffa3', 'ffa4', 'casual'];

const card = (name: string, from: CardDb = db): Card => {
  const c = from.byName(name);
  if (!c) throw new Error(`fixture has no card "${name}"; add it with \`pnpm sync fixtures\``);
  return c;
};
const id = (name: string, from: CardDb = db): string => card(name, from).id;

const bannedAnywhere = (from: CardDb): Set<string> =>
  new Set(from.legality().bans.map((b) => from.byName(b.name)?.id).filter((x): x is string => !!x));

/** Cards the tests add by name; kept out of the generated decks so a test controls their count. */
const RESERVED = new Set(['Defy', 'Stupefy']);

/** Plain cards that fit a legend: no supertype, complete data, never banned, 3 copies, inside the identity. */
function filler(legend: Card, from: CardDb): Card[] {
  const identity = new Set<Domain>(legend.domains);
  const banned = bannedAnywhere(from);
  return fixtureCards()
    .map((c) => from.get(c.id) as Card)
    .filter((c) => (c.type === 'unit' || c.type === 'spell' || c.type === 'gear') && c.superTypes.length === 0 && !c.dataIncomplete
      && c.copyLimit === 3 && !RESERVED.has(c.name) && !banned.has(c.id) && !c.noDomain && identityFit(c, identity) === 'ok')
    .sort((a, b) => a.id.localeCompare(b.id));
}

const safeBattlefields = (from: CardDb): string[] => {
  const banned = bannedAnywhere(from);
  return from.all().filter((c) => c.type === 'battlefield' && !c.dataIncomplete && !banned.has(c.id)).map((c) => c.id).sort();
};

/** A legal 40-card deck: 1 Chosen Champion + 13 plain cards x3, runes 6/6, three unbanned battlefields. */
function legalDeck(legendName: string, championName: string, format: Format = 'standard-bo3', from: CardDb = db): Deck {
  const legend = card(legendName, from);
  const champion = card(championName, from);
  const main: DeckEntry[] = [{ id: champion.id, qty: 1, locked: false }, ...filler(legend, from).slice(0, 13).map((c) => ({ id: c.id, qty: 3, locked: false }))];
  const runes: Partial<Record<Domain, number>> = {};
  legend.domains.forEach((d, i) => { runes[d] = legend.domains.length === 1 ? 12 : i === 0 ? 6 : i === 1 ? 6 : 0; });
  return {
    id: null, name: 'test', format, power: 'focused', legend: legend.id, champion: champion.id, main, side: [], runes,
    battlefields: safeBattlefields(from).slice(0, 3), extraLegends: [], themeWeights: null, teammate: null,
  };
}

const count = (entries: DeckEntry[]): number => entries.reduce((n, e) => n + e.qty, 0);

/** Removes `n` copies of generated filler from the end of the main deck (never the Chosen Champion or a card a test added; those are `locked`). */
function trim(deck: Deck, n: number): Deck {
  const main = deck.main.map((e) => ({ ...e }));
  for (let i = main.length - 1; i >= 0 && n > 0; i--) {
    if (main[i].id === deck.champion || main[i].locked) continue;
    const take = Math.min(n, main[i].qty);
    main[i].qty -= take;
    n -= take;
  }
  return { ...deck, main: main.filter((e) => e.qty > 0) };
}
const add = (entries: DeckEntry[], cardId: string, qty: number): DeckEntry[] => {
  const held = entries.find((e) => e.id === cardId);
  return held ? entries.map((e) => (e.id === cardId ? { ...e, qty: e.qty + qty } : e)) : [...entries, { id: cardId, qty, locked: true }];
};
/** Puts `qty` copies into the main deck in place of filler, so the deck stays at its size. */
const swapIn = (deck: Deck, name: string, qty: number, from: CardDb = db): Deck => {
  const trimmed = trim(deck, qty);
  return { ...trimmed, main: add(trimmed.main, id(name, from), qty) };
};
const toSide = (deck: Deck, name: string, qty: number, from: CardDb = db): Deck => ({ ...deck, side: add(deck.side, id(name, from), qty) });

const codes = (vs: Violation[]): string[] => vs.map((v) => v.code);
const errors = (vs: Violation[]): string[] => vs.filter((v) => v.severity === 'error').map((v) => v.code);
const find = (vs: Violation[], code: string): Violation => {
  const v = vs.find((x) => x.code === code);
  if (!v) throw new Error(`expected ${code}, got [${codes(vs).join(', ')}]`);
  return v;
};
const check = (deck: Deck, from: CardDb = db): Violation[] => validateDeck(deck, from);

/** The fixture cards behind a CardDb with some cards or the legality replaced. */
function dbWith(change: (c: Card) => Card, legality: LegalityData = db.legality(), drop: (c: Card) => boolean = () => false): CardDb {
  return createCardDb(fixtureCards().filter((c) => !drop(c)).map(change), [], [], [], [], legality, { 'Yi, Meditative': id('Master Yi, Meditative') });
}

const kaisa = (format: Format = 'standard-bo3') => legalDeck('Daughter of the Void', "Kai'Sa, Survivor", format);
const jinx = (format: Format = 'standard-bo3') => legalDeck('Loose Cannon', 'Jinx, Rebel', format);
const yi = (format: Format = 'standard-bo3') => legalDeck('Wuju Master', 'Master Yi, Meditative', format);
const ornn = () => legalDeck('Fire Below the Mountain', 'Ornn, Blacksmith');

describe('the test decks themselves', () => {
  it('the generated base decks are clean in every format', () => {
    for (const format of FORMATS) {
      for (const deck of [kaisa(format), jinx(format), yi(format), legalDeck('Fire Below the Mountain', 'Ornn, Blacksmith', format)]) {
        expect(count(deck.main)).toBe(40);
        expect(check(deck)).toEqual([]);
        expect(isLegal(check(deck))).toBe(true);
      }
    }
  });

  it('the six reference lists from the meta sync are legal in standard-bo3', () => {
    const decks = fixtureDecks();
    expect(decks).toHaveLength(6);
    for (const { deck, file, unresolved } of decks) {
      expect(unresolved, file).toEqual([]);
      const vs = check(deck);
      expect(vs.filter((v) => v.severity !== 'info'), file).toEqual([]);
      expect(isLegal(vs), file).toBe(true);
    }
  });
});

describe('formatRules', () => {
  it('tournament formats need exactly 40, casual and free-for-all at least 40', () => {
    for (const f of ['standard-bo1', 'standard-bo3', '2v2'] as Format[]) expect(formatRules(f)).toMatchObject({ mainExact: 40, mainMin: 40, sideAllowed: true, sideMax: 10 });
    for (const f of ['ffa3', 'ffa4', 'casual'] as Format[]) expect(formatRules(f)).toMatchObject({ mainExact: null, mainMin: 40, sideAllowed: false });
  });
  it('victory score, battlefields on board and ban list per format (rules.md §10)', () => {
    expect(formatRules('standard-bo1')).toMatchObject({ victoryScore: 8, battlefieldsOnBoard: 2, banListOf: 'standard-bo1' });
    expect(formatRules('standard-bo3')).toMatchObject({ victoryScore: 8, battlefieldsOnBoard: 2, banListOf: 'standard-bo3' });
    expect(formatRules('2v2')).toMatchObject({ victoryScore: 11, battlefieldsOnBoard: 3, banListOf: '2v2' });
    expect(formatRules('ffa3')).toMatchObject({ victoryScore: 8, battlefieldsOnBoard: 3, banListOf: 'ffa3' });
    expect(formatRules('ffa4')).toMatchObject({ victoryScore: 8, battlefieldsOnBoard: 3, banListOf: 'ffa4' });
    expect(formatRules('casual')).toMatchObject({ victoryScore: 8, battlefieldsOnBoard: 2, banListOf: 'casual' });
  });
  it('the side deck maximum comes from the synced legality snapshot', () => {
    expect(formatRules('standard-bo3', db.legality()).sideMax).toBe(db.legality().sideboardMax);
    expect(formatRules('standard-bo3', { ...db.legality(), sideboardMax: 8 }).sideMax).toBe(8);
  });
});

describe('domainIdentity, championTagOf, eligibleChampions, copyLimit', () => {
  it('identity is the set of the legend domains, empty without a usable legend', () => {
    expect([...domainIdentity(kaisa(), db)].sort()).toEqual(['fury', 'mind']);
    expect(domainIdentity({ ...kaisa(), legend: null }, db).size).toBe(0);
    expect(domainIdentity({ ...kaisa(), legend: 'nope' }, db).size).toBe(0);
    expect(domainIdentity({ ...kaisa(), legend: id("Kai'Sa, Survivor") }, db).size).toBe(0);
    expect(domainIdentity({ ...kaisa(), extraLegends: [id('Loose Cannon')] }, db).has('chaos')).toBe(false); // CR 107.4.d.1
  });
  it('champion tag: short name for a champion unit, linked tag for legends and signature cards, null otherwise', () => {
    expect(championTagOf(card("Kai'Sa, Survivor"))).toBe("Kai'Sa");
    expect(championTagOf(card('Master Yi, Meditative'))).toBe('Master Yi');
    expect(championTagOf(card('Heart of the Tempest'))).toBe('Kennen');
    expect(championTagOf(card('Wuju Bladesman'))).toBe('Master Yi'); // a legend row carrying the champion supertype (§8.2)
    expect(championTagOf(card('Tibbers'))).toBe('Annie');
    expect(championTagOf(card('Defy'))).toBeNull();
    expect(championTagOf(card('Fury Rune'))).toBeNull();
  });
  it('eligible champions: every unit of the champion, none through a shared tag', () => {
    expect(eligibleChampions(card('Wuju Master'), db).map((c) => c.name)).toEqual(['Master Yi, Honed', 'Master Yi, Meditative', 'Master Yi, Tempered', 'Master Yi, Unstoppable']);
    expect(eligibleChampions(card('Wuju Bladesman'), db)).toHaveLength(4);
    const kennen = eligibleChampions(card('Heart of the Tempest'), db);
    expect(kennen.length).toBeGreaterThan(0);
    expect(kennen.every((c) => c.shortName === 'Kennen' && isChampionUnit(c))).toBe(true);
    expect(eligibleChampions(card('Dark Child'), db).map((c) => c.name)).not.toContain('Tibbers');
    expect(eligibleChampions(card('Defy'), db)).toEqual([]);
    for (const legend of db.all().filter((c) => c.type === 'legend')) expect(eligibleChampions(legend, db).length, legend.name).toBeGreaterThan(0);
  });
  it('copy limit: 3, Unique 1, unlimited by card text', () => {
    expect(copyLimit(card('Defy'))).toBe(3);
    expect(copyLimit(card('Forgefire Cape'))).toBe(1);
    expect(copyLimit(card('Spiderling'))).toBe(Infinity);
    expect(copyLimit({ ...card('Spiderling'), copyLimit: 10 })).toBe(Infinity); // older data stored a placeholder 10
    expect(copyLimit({ ...card('Forgefire Cape'), copyLimit: 3 })).toBe(1);     // Unique keyword cross-check
  });
});

describe('cardFitsDeck', () => {
  const deck = kaisa();
  it('accepts a card of the identity and a no-domain card', () => {
    expect(cardFitsDeck(card('Kai\'Sa, Evolutionary'), 'main', deck, db)).toBeNull();
    expect(cardFitsDeck(card('Neeko, Blending In'), 'main', deck, db)).toBeNull();
    expect(cardFitsDeck(card('Icathian Rain'), 'side', deck, db)).toBeNull();
    expect(cardFitsDeck(card('Fury Rune'), 'runes', deck, db)).toBeNull();
    expect(cardFitsDeck(card('Windswept Hillock'), 'battlefields', deck, db)).toBeNull();
    expect(cardFitsDeck(card('Daughter of the Void'), 'legend', deck, db)).toBeNull();
  });
  it('names the reason a card does not fit', () => {
    expect(cardFitsDeck(card('Defy'), 'main', deck, db)?.code).toBe('DOMAIN_VIOLATION');
    expect(cardFitsDeck(card('Calm Rune'), 'runes', deck, db)?.code).toBe('DOMAIN_VIOLATION');
    expect(cardFitsDeck(card('Chronobreak'), 'main', deck, db)?.code).toBe('SIGNATURE_WRONG_CHAMPION'); // Ekko, Fury/Mind
    expect(cardFitsDeck(card('Recruit'), 'main', deck, db)?.code).toBe('TOKEN_IN_DECK');
    expect(cardFitsDeck(card('Fury Rune'), 'main', deck, db)?.code).toBe('RUNE_WRONG_TYPE');
    expect(cardFitsDeck(card('Windswept Hillock'), 'main', deck, db)?.code).toBe('MAIN_WRONG_TYPE');
    expect(cardFitsDeck(card('Windswept Hillock'), 'side', deck, db)?.code).toBe('SIDEBOARD_WRONG_TYPE');
    expect(cardFitsDeck(card('Defy'), 'battlefields', deck, db)?.code).toBe('BATTLEFIELD_WRONG_TYPE');
    expect(cardFitsDeck(card('Defy'), 'legend', deck, db)?.code).toBe('LEGEND_NOT_LEGEND');
    expect(cardFitsDeck(card("The Arena's Greatest"), 'battlefields', deck, db)?.code).toBe('CARD_BANNED');
    expect(cardFitsDeck(card("The Arena's Greatest"), 'battlefields', { ...deck, format: 'casual' }, db)).toBeNull();
    expect(cardFitsDeck(card('Wuju Bladesman'), 'legend', { ...deck, format: '2v2' }, db)?.code).toBe('LEGEND_BANNED');
  });
  it('without a legend only identity-free checks run', () => {
    const open = { ...deck, legend: null };
    expect(cardFitsDeck(card('Defy'), 'main', open, db)).toBeNull();
    expect(cardFitsDeck(card('Recruit'), 'main', open, db)?.code).toBe('TOKEN_IN_DECK');
  });
});

describe('rules.md §12: one test per check', () => {
  it('1 LEGEND_MISSING', () => {
    const vs = check({ ...kaisa(), legend: null });
    expect(find(vs, 'LEGEND_MISSING').severity).toBe('error');
    expect(codes(vs)).not.toContain('DOMAIN_VIOLATION'); // no identity to test against
  });
  it('2 LEGEND_NOT_LEGEND: a unit or a token in the legend slot', () => {
    expect(errors(check({ ...kaisa(), legend: id("Kai'Sa, Survivor") }))).toContain('LEGEND_NOT_LEGEND');
    const token = errors(check({ ...kaisa(), legend: id('Recruit') }));
    expect(token).toContain('LEGEND_NOT_LEGEND');
    expect(token).toContain('TOKEN_IN_DECK');
  });
  it('3 LEGEND_BANNED: Wuju Bladesman in 2v2', () => {
    const v = find(check(legalDeck('Wuju Bladesman', 'Master Yi, Meditative', '2v2')), 'LEGEND_BANNED');
    expect(v).toMatchObject({ severity: 'error', cardIds: [id('Wuju Bladesman')] });
    expect(v.message).toContain('Wuju Bladesman');
  });
  it('4 CHAMPION_MISSING', () => {
    expect(find(check({ ...kaisa(), champion: null }), 'CHAMPION_MISSING').severity).toBe('error');
  });
  it('5 CHAMPION_NOT_CHAMPION_UNIT: a plain unit, a spell, a legend row with the champion supertype', () => {
    const plain = filler(card('Daughter of the Void'), db)[0];
    expect(errors(check({ ...kaisa(), champion: plain.id }))).toEqual(['CHAMPION_NOT_CHAMPION_UNIT']);
    expect(errors(check({ ...kaisa(), champion: id('Wuju Bladesman') }))).toContain('CHAMPION_NOT_CHAMPION_UNIT');
  });
  it('6 CHAMPION_TAG_MISMATCH: a champion unit of another champion', () => {
    const deck = swapIn({ ...kaisa(), champion: id('Volibear, Furious'), main: kaisa().main.filter((e) => e.id !== id("Kai'Sa, Survivor")) }, 'Volibear, Furious', 0);
    const withChamp = { ...deck, main: add(deck.main, id('Volibear, Furious'), 1) };
    const v = find(check(withChamp), 'CHAMPION_TAG_MISMATCH');
    expect(v).toMatchObject({ severity: 'error', interpretation: false });
    expect(v.message).toContain('Volibear');
    expect(v.message).toContain("Kai'Sa");
    expect(errors(check(withChamp))).toEqual(['CHAMPION_TAG_MISMATCH']); // Fury is inside Fury/Mind
  });
  it('7 CHAMPION_NOT_IN_MAIN', () => {
    const deck = kaisa();
    const without = { ...deck, main: add(deck.main.filter((e) => e.id !== deck.champion), filler(card('Daughter of the Void'), db)[13].id, 1) };
    expect(count(without.main)).toBe(40);
    expect(errors(check(without))).toEqual(['CHAMPION_NOT_IN_MAIN']);
    // a copy in the side deck does not count
    expect(errors(check({ ...without, side: [{ id: deck.champion as string, qty: 1, locked: false }] }))).toEqual(['CHAMPION_NOT_IN_MAIN']);
  });
  it('8 MAIN_TOO_SMALL: 39 cards, in every format', () => {
    for (const format of FORMATS) {
      const vs = check(trim(kaisa(format), 1));
      expect(errors(vs), format).toEqual(['MAIN_TOO_SMALL']);
      expect(find(vs, 'MAIN_TOO_SMALL').message).toContain('39');
    }
  });
  it('9 MAIN_NOT_EXACT_40: 41 cards in tournament formats, off elsewhere', () => {
    const extra = filler(card('Daughter of the Void'), db)[13].id;
    for (const format of FORMATS) {
      const deck = kaisa(format);
      const vs = errors(check({ ...deck, main: add(deck.main, extra, 1) }));
      expect(vs, format).toEqual(formatRules(format).mainExact === null ? [] : ['MAIN_NOT_EXACT_40']);
    }
  });
  it('10 MAIN_WRONG_TYPE: a battlefield or a legend in the main deck', () => {
    expect(errors(check(swapIn(kaisa(), 'Windswept Hillock', 1)))).toEqual(['MAIN_WRONG_TYPE']);
    expect(errors(check(swapIn(kaisa(), 'Loose Cannon', 1)))).toEqual(['MAIN_WRONG_TYPE']);
  });
  it('11 TOKEN_IN_DECK: in the main deck, the side deck and the battlefields', () => {
    expect(errors(check(swapIn(kaisa(), 'Recruit', 2)))).toEqual(['TOKEN_IN_DECK']);
    expect(errors(check(toSide(kaisa(), 'Sprite', 1)))).toEqual(['TOKEN_IN_DECK']);
    const deck = kaisa();
    expect(errors(check({ ...deck, battlefields: [...deck.battlefields.slice(0, 2), id('Baron Pit')] }))).toContain('TOKEN_IN_DECK');
  });
  it('12 DOMAIN_VIOLATION: main, side deck and runes; no-domain cards pass; an empty domain list is DATA_STALE', () => {
    const main = check(swapIn(kaisa(), 'Defy', 1));
    expect(errors(main)).toEqual(['DOMAIN_VIOLATION']);
    expect(find(main, 'DOMAIN_VIOLATION')).toMatchObject({ cardIds: [id('Defy')] });
    expect(find(main, 'DOMAIN_VIOLATION').message).toContain('Defy');
    expect(errors(check(toSide(kaisa(), 'Defy', 1)))).toEqual(['DOMAIN_VIOLATION']);
    expect(errors(check({ ...kaisa(), runes: { fury: 6, mind: 5, calm: 1 } }))).toEqual(['DOMAIN_VIOLATION']);
    // battlefields have no domain and fit any identity (CR 103.5.b)
    expect(db.all().filter((c) => c.type === 'battlefield' && !c.dataIncomplete).every((c) => c.noDomain)).toBe(true);
    // missing domain data is not "no domain"
    const blank = dbWith((c) => (c.name === 'Defy' ? { ...c, domains: [], noDomain: false } : c));
    const vs = check(swapIn(kaisa(), 'Defy', 1), blank);
    expect(errors(vs)).toEqual([]);
    expect(find(vs, 'DATA_STALE')).toMatchObject({ severity: 'warning', cardIds: [id('Defy')] });
    expect(isLegal(vs)).toBe(false);
  });
  it('13 COPY_LIMIT_EXCEEDED: four of a name', () => {
    const name = db.get(kaisa().main[1].id)?.name as string;
    const vs = check(swapIn(kaisa(), name, 1));
    expect(errors(vs)).toEqual(['COPY_LIMIT_EXCEEDED']);
    expect(find(vs, 'COPY_LIMIT_EXCEEDED').message).toContain(name);
  });
  it('14 UNIQUE_LIMIT_EXCEEDED: two Forgefire Cape', () => {
    const v = find(check(swapIn(ornn(), 'Forgefire Cape', 2)), 'UNIQUE_LIMIT_EXCEEDED');
    expect(v).toMatchObject({ severity: 'error', interpretation: false, cardIds: [id('Forgefire Cape')] });
    // one in the main deck and one in the side deck: the stricter reading, marked as interpretation
    const split = find(check(toSide(swapIn(ornn(), 'Forgefire Cape', 1), 'Forgefire Cape', 1)), 'UNIQUE_LIMIT_EXCEEDED');
    expect(split.interpretation).toBe(true);
    expect(split.message).toContain('interpretation');
  });
  it('15 SIGNATURE_TOTAL_EXCEEDED: four signature cards', () => {
    const vs = check(swapIn(swapIn(yi(), 'Highlander', 3), 'Alpha Strike', 1));
    expect(errors(vs)).toEqual(['SIGNATURE_TOTAL_EXCEEDED']);
    expect(find(vs, 'SIGNATURE_TOTAL_EXCEEDED').cardIds.sort()).toEqual([id('Highlander'), id('Alpha Strike')].sort());
  });
  it('16 SIGNATURE_WRONG_CHAMPION: main and side deck', () => {
    expect(errors(check(swapIn(kaisa(), 'Chronobreak', 1)))).toEqual(['SIGNATURE_WRONG_CHAMPION']);
    expect(errors(check(toSide(kaisa(), 'Chronobreak', 1)))).toEqual(['SIGNATURE_WRONG_CHAMPION']);
    expect(errors(check(swapIn(kaisa(), 'Icathian Rain', 3)))).toEqual([]);
  });
  it('17 RUNE_COUNT: 11, 13 and 0 runes', () => {
    expect(errors(check({ ...kaisa(), runes: { fury: 6, mind: 5 } }))).toEqual(['RUNE_COUNT']);
    expect(errors(check({ ...kaisa(), runes: { fury: 7, mind: 6 } }))).toEqual(['RUNE_COUNT']);
    expect(errors(check({ ...kaisa(), runes: {} }))).toEqual(['RUNE_COUNT']);
  });
  it('18 RUNE_WRONG_TYPE: a rune in the main deck; a non-rune in the rune deck', () => {
    expect(errors(check(swapIn(kaisa(), 'Fury Rune', 1)))).toEqual(['RUNE_WRONG_TYPE']);
    expect(errors(check({ ...kaisa(), runes: { fury: 6, mind: 5, colorless: 1 } as Deck['runes'] }))).toEqual(['RUNE_WRONG_TYPE']);
    expect(cardFitsDeck(card('Defy'), 'runes', kaisa(), db)?.code).toBe('RUNE_WRONG_TYPE');
  });
  it('19 BATTLEFIELD_COUNT: two or four', () => {
    const deck = kaisa();
    const pool = safeBattlefields(db);
    expect(errors(check({ ...deck, battlefields: pool.slice(0, 2) }))).toEqual(['BATTLEFIELD_COUNT']);
    expect(errors(check({ ...deck, battlefields: pool.slice(0, 4) }))).toEqual(['BATTLEFIELD_COUNT']);
    expect(errors(check({ ...deck, battlefields: [] }))).toEqual(['BATTLEFIELD_COUNT']);
  });
  it('20 BATTLEFIELD_DUPLICATE', () => {
    const [a, b] = safeBattlefields(db);
    const v = find(check({ ...kaisa(), battlefields: [a, a, b] }), 'BATTLEFIELD_DUPLICATE');
    expect(v).toMatchObject({ severity: 'error', cardIds: [a] });
  });
  it('21 BATTLEFIELD_WRONG_TYPE: a spell, and the Brush token', () => {
    const [a, b] = safeBattlefields(db);
    expect(errors(check({ ...kaisa(), battlefields: [a, b, id('Stupefy')] }))).toEqual(['BATTLEFIELD_WRONG_TYPE']);
    expect(errors(check({ ...kaisa(), battlefields: [a, b, id('Brush')] })).sort()).toEqual(['BATTLEFIELD_WRONG_TYPE', 'TOKEN_IN_DECK']);
  });
  it('22 CARD_BANNED: every banned main-deck card, in the main deck and in the side deck, per format', () => {
    const mainBans = db.legality().bans.filter((b) => b.zone === 'main');
    expect(mainBans.length).toBeGreaterThanOrEqual(7);
    for (const ban of mainBans) {
      const banned = card(ban.name);
      const legend = db.all().find((c) => c.type === 'legend' && banned.domains.every((d) => c.domains.includes(d)) && championTagOf(c) !== championTagOf(banned)) as Card;
      const champion = eligibleChampions(legend, db)[0];
      for (const format of FORMATS) {
        const base = legalDeck(legend.name, champion.name, format);
        const expected = ban.formats.includes(format) ? ['CARD_BANNED'] : [];
        expect(errors(check(swapIn(base, banned.name, 1))), `${ban.name} main ${format}`).toEqual(expected);
        if (formatRules(format).sideAllowed) expect(errors(check(toSide(base, banned.name, 1))), `${ban.name} side ${format}`).toEqual(expected);
      }
    }
    expect(errors(check(swapIn(kaisa('casual'), 'Stacked Deck', 1)))).not.toContain('CARD_BANNED');
  });
  it('22 CARD_BANNED in free-for-all is marked as an interpretation (no official list)', () => {
    const [a, b] = safeBattlefields(db);
    const v = find(check({ ...kaisa('ffa3'), battlefields: [a, b, id("The Arena's Greatest")] }), 'CARD_BANNED');
    expect(v.interpretation).toBe(true);
    expect(find(check({ ...kaisa('standard-bo1'), battlefields: [a, b, id("The Arena's Greatest")] }), 'CARD_BANNED').interpretation).toBe(false);
  });
  it('23 CARD_NOT_IN_FORMAT: a card whose only set is not legal', () => {
    const legality = db.legality();
    const noRadiance = dbWith((c) => c, { ...legality, sets: legality.sets.filter((s) => s.code !== 'RAD') });
    const notYet = dbWith((c) => c, { ...legality, sets: legality.sets.map((s) => (s.code === 'RAD' ? { ...s, legalFrom: '2099-01-01' } : s)) });
    expect(card('Ekko, Revolutionary').sets).toEqual(['RAD']);
    for (const other of [noRadiance, notYet]) {
      const vs = check(swapIn(kaisa(), 'Ekko, Revolutionary', 1), other);
      expect(errors(vs)).toEqual(['CARD_NOT_IN_FORMAT']);
      expect(find(vs, 'CARD_NOT_IN_FORMAT').message).toContain('Ekko, Revolutionary');
      expect(errors(check(swapIn(kaisa('casual'), 'Ekko, Revolutionary', 1), other))).toEqual([]);
    }
    expect(errors(check(swapIn(kaisa(), 'Ekko, Revolutionary', 1)))).toEqual([]); // Radiance is legal today
    // a reprint in a legal set keeps a card legal by name (TR 601.2.a)
    expect(card('Fury Rune').sets).toContain('RAD');
    expect(cardFitsDeck(card('Fury Rune'), 'runes', kaisa(), noRadiance)).toBeNull();
  });
  it('24 SIDEBOARD_TOO_LARGE: 11 cards', () => {
    const spare = filler(card('Daughter of the Void'), db).slice(13, 17);
    const side = (n: number): DeckEntry[] => spare.map((c, i) => ({ id: c.id, qty: i < 3 ? 3 : n - 9, locked: false }));
    expect(errors(check({ ...kaisa(), side: side(10) }))).toEqual([]);
    expect(errors(check({ ...kaisa(), side: side(11) }))).toEqual(['SIDEBOARD_TOO_LARGE']);
    expect(errors(check({ ...kaisa('standard-bo1'), side: side(11) }))).toEqual(['SIDEBOARD_TOO_LARGE']);
    expect(errors(check({ ...kaisa('2v2'), side: side(11) }))).toEqual(['SIDEBOARD_TOO_LARGE']);
  });
  it('25 SIDEBOARD_WRONG_TYPE: rune, battlefield, legend', () => {
    for (const name of ['Fury Rune', 'Windswept Hillock', 'Loose Cannon']) expect(errors(check(toSide(kaisa(), name, 1))), name).toEqual(['SIDEBOARD_WRONG_TYPE']);
  });
  it('26 SIDEBOARD_NOT_ALLOWED: a warning in ffa3, ffa4 and casual', () => {
    const spare = filler(card('Daughter of the Void'), db)[13];
    for (const format of FORMATS) {
      const vs = check({ ...kaisa(format), side: [{ id: spare.id, qty: 2, locked: false }] });
      expect(errors(vs), format).toEqual([]);
      if (formatRules(format).sideAllowed) expect(codes(vs), format).toEqual([]);
      else expect(find(vs, 'SIDEBOARD_NOT_ALLOWED')).toMatchObject({ severity: 'warning', interpretation: true });
    }
  });
  const extraLegends = ['Loose Cannon', 'Wuju Master', 'Dark Child', 'Heart of the Tempest'].map((n) => id(n));
  it('27 NEEKO_LEGENDS_COUNT: error above 3, warning below 3', () => {
    const neeko = swapIn(kaisa(), 'Neeko, Blending In', 1);
    expect(codes(check({ ...neeko, extraLegends: extraLegends.slice(0, 3) }))).toEqual([]);
    expect(find(check({ ...neeko, extraLegends }), 'NEEKO_LEGENDS_COUNT').severity).toBe('error');
    const few = check({ ...neeko, extraLegends: extraLegends.slice(0, 2) });
    expect(find(few, 'NEEKO_LEGENDS_COUNT').severity).toBe('warning');
    expect(isLegal(few)).toBe(true);
    expect(find(check(neeko), 'NEEKO_LEGENDS_COUNT').severity).toBe('warning');
  });
  it('28 NEEKO_LEGENDS_NOT_DIFFERENT: a repeat, or the Champion Legend itself', () => {
    const neeko = swapIn(kaisa(), 'Neeko, Blending In', 1);
    expect(errors(check({ ...neeko, extraLegends: [extraLegends[0], extraLegends[0], extraLegends[1]] }))).toEqual(['NEEKO_LEGENDS_NOT_DIFFERENT']);
    expect(errors(check({ ...neeko, extraLegends: [id('Daughter of the Void'), extraLegends[0], extraLegends[1]] }))).toEqual(['NEEKO_LEGENDS_NOT_DIFFERENT']);
    // the two Master Yi legends have different names
    expect(errors(check({ ...neeko, extraLegends: [id('Wuju Master'), id('Wuju Bladesman'), extraLegends[0]] }))).toEqual([]);
    // an extra legend must be a legend
    expect(errors(check({ ...neeko, extraLegends: [id('Defy'), extraLegends[0], extraLegends[1]] }))).toEqual(['LEGEND_NOT_LEGEND']);
  });
  it('29 NEEKO_LEGENDS_UNUSED: extra legends without Neeko', () => {
    const vs = check({ ...kaisa(), extraLegends: extraLegends.slice(0, 3) });
    expect(errors(vs)).toEqual([]);
    expect(find(vs, 'NEEKO_LEGENDS_UNUSED').severity).toBe('warning');
  });
  it('30 NEEKO_LEGEND_BANNED: a warning for a banned extra legend', () => {
    const neeko = { ...swapIn(kaisa('2v2'), 'Neeko, Blending In', 1), extraLegends: [id('Wuju Bladesman'), extraLegends[0], extraLegends[2]] };
    const vs = check(neeko);
    expect(errors(vs)).toEqual([]);
    expect(find(vs, 'NEEKO_LEGEND_BANNED')).toMatchObject({ severity: 'warning', interpretation: true, cardIds: [id('Wuju Bladesman')] });
    expect(codes(check({ ...neeko, format: 'standard-bo3' }))).toEqual([]);
  });
  it('31 TEAM_SAME_LEGEND: only in 2v2 with a teammate deck', () => {
    const deck = kaisa('2v2');
    const mate = { legend: deck.legend, battlefields: [] };
    expect(errors(check({ ...deck, teammate: mate }))).toEqual(['TEAM_SAME_LEGEND']);
    expect(errors(check({ ...deck, teammate: { legend: id('Loose Cannon'), battlefields: [] } }))).toEqual([]);
    expect(errors(check({ ...deck, format: 'standard-bo3', teammate: mate }))).toEqual([]);
    expect(errors(check({ ...deck, teammate: null }))).toEqual([]);
  });
  it('32 TEAM_SAME_BATTLEFIELD', () => {
    const deck = kaisa('2v2');
    const pool = safeBattlefields(db);
    const v = find(check({ ...deck, teammate: { legend: id('Loose Cannon'), battlefields: [pool[5], deck.battlefields[1], pool[6]] } }), 'TEAM_SAME_BATTLEFIELD');
    expect(v).toMatchObject({ severity: 'error', cardIds: [deck.battlefields[1]] });
    expect(errors(check({ ...deck, teammate: { legend: id('Loose Cannon'), battlefields: pool.slice(4, 7) } }))).toEqual([]);
  });
  it('33 ALT_CHAMPION_AVAILABLE: another eligible champion unit in the main or side deck', () => {
    const main = check(swapIn(kaisa(), "Kai'Sa, Evolutionary", 2));
    expect(find(main, 'ALT_CHAMPION_AVAILABLE')).toMatchObject({ severity: 'info', cardIds: [id("Kai'Sa, Evolutionary")] });
    expect(find(main, 'ALT_CHAMPION_AVAILABLE').message).toContain("Kai'Sa, Evolutionary");
    expect(codes(check(toSide(kaisa(), "Kai'Sa, Evolutionary", 1)))).toEqual(['ALT_CHAMPION_AVAILABLE']);
    expect(codes(check(swapIn(kaisa(), 'Ekko, Revolutionary', 1)))).toEqual([]); // another champion's unit is just a card
    expect(codes(check(swapIn(kaisa('casual'), "Kai'Sa, Evolutionary", 2)))).toEqual([]); // no sideboarding there
  });
  it('34 DATA_STALE: an unknown card in any zone is a warning, and the deck is not called legal', () => {
    const deck = kaisa();
    const cases: Deck[] = [
      { ...trim(deck, 1), main: add(trim(deck, 1).main, 'xyz-001-999', 1) },
      { ...deck, side: [{ id: 'xyz-001-999', qty: 1, locked: false }] },
      { ...deck, battlefields: [...deck.battlefields.slice(0, 2), 'xyz-001-999'] },
      { ...deck, legend: 'xyz-001-999' },
      { ...deck, champion: 'xyz-001-999' },
      { ...swapIn(deck, 'Neeko, Blending In', 1), extraLegends: ['xyz-001-999', id('Loose Cannon'), id('Dark Child')] },
    ];
    for (const [i, c] of cases.entries()) {
      const vs = check(c);
      expect(find(vs, 'DATA_STALE'), String(i)).toMatchObject({ severity: 'warning', cardIds: ['xyz-001-999'] });
      expect(isLegal(vs), String(i)).toBe(false);
    }
    expect(errors(check(cases[0]))).toEqual([]);
  });
});

describe('rules.md §13: worked edge cases', () => {
  it('1 two champion units of the same champion: 3 of each, one Chosen Champion', () => {
    const deck = swapIn(swapIn(kaisa(), "Kai'Sa, Survivor", 2), "Kai'Sa, Evolutionary", 3);
    expect(count(deck.main)).toBe(40);
    const vs = check(deck);
    expect(vs.filter((v) => v.severity !== 'info')).toEqual([]);
    expect(find(vs, 'ALT_CHAMPION_AVAILABLE').cardIds).toEqual([id("Kai'Sa, Evolutionary")]);
  });
  it('2 the Chosen Champion is one of the 3 copies: champion + 3 more is 4', () => {
    const base = legalDeck('Relentless Storm', 'Volibear, Furious');
    expect(errors(check(swapIn(base, 'Volibear, Furious', 2)))).toEqual([]);
    const vs = check(swapIn(base, 'Volibear, Furious', 3));
    expect(errors(vs)).toEqual(['COPY_LIMIT_EXCEEDED']);
    expect(find(vs, 'COPY_LIMIT_EXCEEDED').message).toContain('Chosen Champion');
  });
  it('3 signature card of another champion: Tibbers in a Jinx deck', () => {
    const vs = check(swapIn(jinx(), 'Tibbers', 1));
    expect(errors(vs)).toEqual(['SIGNATURE_WRONG_CHAMPION']);
    expect(find(vs, 'SIGNATURE_WRONG_CHAMPION').message).toContain('Annie');
  });
  it('4 signature total: 3 + 1 of the same champion, and 2 main + 2 side deck', () => {
    // No champion has both a signature spell and signature gear in the data; Master Yi has two signature spells.
    expect(errors(check(swapIn(yi(), 'Highlander', 3)))).toEqual([]);
    const main = find(check(swapIn(swapIn(yi(), 'Highlander', 3), 'Alpha Strike', 1)), 'SIGNATURE_TOTAL_EXCEEDED');
    expect(main.interpretation).toBe(false);
    const split = find(check(toSide(swapIn(yi(), 'Highlander', 2), 'Alpha Strike', 2)), 'SIGNATURE_TOTAL_EXCEEDED');
    expect(split.interpretation).toBe(true);
    expect(split.message).toContain('interpretation');
  });
  it('5 Unique signature gear: one of each is legal, two of one is not, a fourth signature card is not', () => {
    const three = swapIn(swapIn(swapIn(ornn(), 'Forgefire Cape', 1), "Rabadon's Deathcrown", 1), "Shurelya's Requiem", 1);
    expect(check(three)).toEqual([]);
    expect(errors(check(swapIn(ornn(), 'Forgefire Cape', 2)))).toEqual(['UNIQUE_LIMIT_EXCEEDED']);
    // the only other Calm/Mind signature cards belong to other champions
    expect(errors(check(swapIn(three, 'Lilting Lullaby', 1)))).toContain('SIGNATURE_TOTAL_EXCEEDED');
  });
  it('6 a signature unit as Chosen Champion: Tibbers under Dark Child', () => {
    const base = legalDeck('Dark Child', 'Annie, Fiery');
    const deck = { ...base, champion: id('Tibbers'), main: base.main.map((e) => (e.id === id('Annie, Fiery') ? { ...e, id: id('Tibbers') } : e)) };
    const vs = check(deck);
    expect(errors(vs)).toEqual(['CHAMPION_NOT_CHAMPION_UNIT']);
    expect(find(vs, 'CHAMPION_NOT_CHAMPION_UNIT').message).toContain('signature');
  });
  it('7 a shared non-champion tag (Yordle) does not make a Chosen Champion', () => {
    const base = legalDeck('Heart of the Tempest', 'Kennen, Storm of Shuriken');
    const lead = (name: string): Violation[] => check({ ...base, champion: id(name), main: base.main.map((e) => (e.id === base.champion ? { ...e, id: id(name) } : e)) });
    const inside = ['Fizz, Trickster', 'Heimerdinger, Academy Instructor', 'Lulu, Whimsical', 'Poppy, Defender of the Meek', 'Teemo, Scout', 'Vex, Apathetic', 'Vex, Cheerless'];
    for (const name of inside) {
      expect(card(name).tags, name).toContain('Yordle');
      const vs = lead(name);
      expect(errors(vs), name).toEqual(['CHAMPION_TAG_MISMATCH']); // the champion-tag check is the only guard
      expect(find(vs, 'CHAMPION_TAG_MISMATCH'), name).toMatchObject({ interpretation: true });
      expect(find(vs, 'CHAMPION_TAG_MISMATCH').message, name).toContain('Yordle');
    }
    expect(errors(lead('Heimerdinger, Inventor')).sort()).toEqual(['CHAMPION_TAG_MISMATCH', 'DOMAIN_VIOLATION']);
    expect(eligibleChampions(card('Heart of the Tempest'), db).map((c) => c.shortName)).not.toContain('Teemo');
  });
  it('8 a two-domain card needs both domains in the identity', () => {
    const rocket = card('Super Mega Death Rocket!');
    expect(rocket.domains.slice().sort()).toEqual(['chaos', 'fury']);
    const vs = check(swapIn(kaisa(), rocket.name, 1)); // Fury/Mind legend
    expect(errors(vs).sort()).toEqual(['DOMAIN_VIOLATION', 'SIGNATURE_WRONG_CHAMPION']);
    expect(errors(check(swapIn(jinx(), rocket.name, 3)))).toEqual([]);
  });
  it('9 a legend with one domain: 12 runes of it, no multi-domain card, no-domain cards still fit', () => {
    const mono = dbWith((c) => (c.name === 'Loose Cannon' ? { ...c, domains: ['fury'] } : c));
    const base = legalDeck('Loose Cannon', 'Jinx, Demolitionist', 'standard-bo3', mono);
    expect([...domainIdentity(base, mono)]).toEqual(['fury']);
    expect(base.runes).toEqual({ fury: 12 });
    expect(check(base, mono)).toEqual([]);
    expect(errors(check({ ...base, runes: { fury: 11, chaos: 1 } }, mono))).toEqual(['DOMAIN_VIOLATION']);
    expect(errors(check(swapIn(base, 'Super Mega Death Rocket!', 1, mono), mono))).toEqual(['DOMAIN_VIOLATION']);
    expect(errors(check(swapIn(base, 'Jinx, Rebel', 1, mono), mono))).toEqual(['DOMAIN_VIOLATION']);
    expect(errors(check({ ...swapIn(base, 'Neeko, Blending In', 1, mono), extraLegends: [id('Dark Child'), id('Wuju Master'), id('Unforgiven')] }, mono))).toEqual([]);
  });
  it('10 Neeko, Blending In: any identity, one shared set of up to 3 legends, side deck counts', () => {
    const legends = ['Loose Cannon', 'Wuju Master', 'Dark Child'].map((n) => id(n));
    for (const base of [kaisa(), jinx(), yi(), ornn()]) {
      expect(codes(check({ ...swapIn(base, 'Neeko, Blending In', 3), extraLegends: legends.filter((l) => l !== base.legend).concat(id('Unforgiven')).slice(0, 3) }))).toEqual([]);
    }
    const two = check({ ...swapIn(kaisa(), 'Neeko, Blending In', 3), extraLegends: legends.slice(0, 2) });
    expect(errors(two)).toEqual([]);
    expect(isLegal(two)).toBe(true);
    // only in the side deck: the legends are still asked for, and listing them is not "unused"
    const sideOnly = toSide(kaisa(), 'Neeko, Blending In', 1);
    expect(codes(check({ ...sideOnly, extraLegends: legends }))).toEqual([]);
    expect(codes(check(sideOnly))).toEqual(['NEEKO_LEGENDS_COUNT']);
    expect(eligibleChampions(card('Daughter of the Void'), db).map((c) => c.name)).not.toContain('Neeko, Blending In');
  });
  it("11 banned battlefield: The Arena's Greatest in standard, not in casual", () => {
    const fields = [id("The Arena's Greatest"), id("Vilemaw's Lair"), id('Windswept Hillock')];
    for (const format of FORMATS) {
      const vs = check({ ...kaisa(format), battlefields: fields });
      if (format === 'casual') expect(codes(vs)).toEqual([]);
      else {
        expect(errors(vs), format).toEqual(['CARD_BANNED']);
        expect(find(vs, 'CARD_BANNED').cardIds).toEqual([fields[0]]);
      }
    }
  });
  it('12 duplicate battlefield, also as two different printings', () => {
    const fields = safeBattlefields(db);
    expect(errors(check({ ...kaisa(), battlefields: [fields[0], fields[0], fields[1]] }))).toEqual(['BATTLEFIELD_DUPLICATE']);
    // a printing code and the name resolve to one card id
    const printed = db.get(fields[0]) as Card;
    const other = fields[1];
    expect(errors(check({ ...kaisa(), battlefields: [db.byName(printed.code)?.id as string, db.byName(printed.name)?.id as string, other] }))).toEqual(['BATTLEFIELD_DUPLICATE']);
    // two printings stored as two rows with the same rules name are still one name
    const twin = createCardDb([...fixtureCards(), { ...printed, id: 'zzz-001-001', code: 'ZZZ-001' }], [], [], [], [], db.legality());
    expect(errors(check({ ...kaisa(), battlefields: [printed.id, 'zzz-001-001', other] }, twin))).toEqual(['BATTLEFIELD_DUPLICATE']);
  });
  it('13 format-dependent legend: Wuju Bladesman is banned in 2v2 only; Wuju Master fixes it without touching the 40', () => {
    for (const format of FORMATS) {
      const deck = legalDeck('Wuju Bladesman', 'Master Yi, Meditative', format);
      expect(errors(check(deck)), format).toEqual(format === '2v2' ? ['LEGEND_BANNED'] : []);
      expect(check({ ...deck, legend: id('Wuju Master') }), format).toEqual([]);
    }
  });
  it('14 a main deck of 41', () => {
    const extra = filler(card('Wuju Master'), db)[13].id;
    for (const format of FORMATS) {
      const deck = yi(format);
      const vs = errors(check({ ...deck, main: add(deck.main, extra, 1) }));
      expect(vs, format).toEqual(['casual', 'ffa3', 'ffa4'].includes(format) ? [] : ['MAIN_NOT_EXACT_40']);
    }
  });
  it('15 copies overflow into the side deck: 3 Defy main + 1 Defy side', () => {
    const three = swapIn(yi(), 'Defy', 3);
    expect(errors(check(three))).toEqual([]);
    const vs = check(toSide(three, 'Defy', 1));
    expect(errors(vs)).toEqual(['COPY_LIMIT_EXCEEDED']);
    expect(find(vs, 'COPY_LIMIT_EXCEEDED').message).toContain('3 main + 1 side');
  });
  it('16 Spiderling: any number, but deck and side deck sizes still hold', () => {
    const twelve = swapIn(jinx(), 'Spiderling', 12);
    expect(count(twelve.main)).toBe(40);
    expect(check(twelve)).toEqual([]);
    expect(errors(check({ ...twelve, main: add(twelve.main, id('Spiderling'), 1) }))).toEqual(['MAIN_NOT_EXACT_40']);
    expect(errors(check(toSide(twelve, 'Spiderling', 10)))).toEqual([]);
    expect(errors(check(toSide(twelve, 'Spiderling', 11)))).toEqual(['SIDEBOARD_TOO_LARGE']);
  });
  it('17 rune split: 12/0 is legal, an outside rune is not, 11 or 13 is not', () => {
    expect(check({ ...jinx(), runes: { fury: 12 } })).toEqual([]);
    expect(check({ ...jinx(), runes: { fury: 12, chaos: 0 } })).toEqual([]);
    expect(check({ ...jinx(), runes: { fury: 2, chaos: 10 } })).toEqual([]);
    const calm = check({ ...jinx(), runes: { fury: 11, calm: 1 } });
    expect(errors(calm)).toEqual(['DOMAIN_VIOLATION']);
    expect(find(calm, 'DOMAIN_VIOLATION').cardIds).toEqual([id('Calm Rune')]);
    expect(errors(check({ ...jinx(), runes: { fury: 11 } }))).toEqual(['RUNE_COUNT']);
    expect(errors(check({ ...jinx(), runes: { fury: 7, chaos: 6 } }))).toEqual(['RUNE_COUNT']);
  });
  it('18 a token in a list: Recruit, Gold', () => {
    for (const name of ['Recruit', 'Gold']) {
      expect(card(name).superTypes).toContain('token');
      const vs = check(swapIn(kaisa(), name, 1));
      expect(errors(vs), name).toEqual(['TOKEN_IN_DECK']);
      expect(find(vs, 'TOKEN_IN_DECK').message).toContain(name);
    }
  });
  it('19 2v2 team: same legend, same battlefield; two legends of one champion are different names', () => {
    const deck = yi('2v2');
    expect(errors(check({ ...deck, teammate: { legend: id('Wuju Master'), battlefields: deck.battlefields } })).sort()).toEqual(['TEAM_SAME_BATTLEFIELD', 'TEAM_SAME_LEGEND']);
    expect(errors(check({ ...deck, teammate: { legend: id('Wuju Bladesman'), battlefields: [] } }))).toEqual([]);
    expect(errors(check({ ...deck, teammate: { legend: null, battlefields: [] } }))).toEqual([]);
  });
  it('20 stale card data: a card missing from the database is DATA_STALE, not an illegal card', () => {
    const without = dbWith((c) => c, db.legality(), (c) => c.name === 'Ekko, Revolutionary');
    expect(without.byName('Ekko, Revolutionary')).toBeUndefined();
    const deck = swapIn(kaisa(), 'Ekko, Revolutionary', 1);
    expect(check(deck)).toEqual([]);
    const vs = check(deck, without);
    expect(codes(vs)).toEqual(['DATA_STALE']);
    expect(vs[0]).toMatchObject({ severity: 'warning', cardIds: [id('Ekko, Revolutionary')] });
    expect(isLegal(vs)).toBe(false);
  });
  it('21 a wrong tag in the data: Karma, Channeler with the stray tag Vi cannot lead a Vi deck; "Yi, Meditative" passes', () => {
    const stray = dbWith((c) => (c.name === 'Karma, Channeler' ? { ...c, tags: ['Vi', 'Ionia'] } : c));
    const base = legalDeck('Piltover Enforcer', 'Vi, Destructive', 'standard-bo3', stray);
    const karma = id('Karma, Channeler');
    const vs = check({ ...base, champion: karma, main: base.main.map((e) => (e.id === base.champion ? { ...e, id: karma } : e)) }, stray);
    expect(errors(vs)).toEqual(['CHAMPION_TAG_MISMATCH']);
    expect(find(vs, 'CHAMPION_TAG_MISMATCH').message).toContain('Karma');
    expect(eligibleChampions(card('Piltover Enforcer', stray), stray).map((c) => c.name)).not.toContain('Karma, Channeler');
    // the older local name resolves to the Master Yi unit and passes
    const meditative = db.byName('Yi, Meditative') as Card;
    expect(meditative.name).toBe('Master Yi, Meditative');
    for (const legend of ['Wuju Master', 'Wuju Bladesman']) expect(check(legalDeck(legend, 'Yi, Meditative'))).toEqual([]);
  });
});

describe('review focus 2: incomplete gallery rows', () => {
  const incomplete = fixtureCards().filter((c) => c.dataIncomplete && !c.superTypes.includes('token'));
  it('the fixture has incomplete Radiance rows, with and without a type or domain', () => {
    expect(incomplete.length).toBeGreaterThanOrEqual(8);
    expect(incomplete.some((c) => c.type === null)).toBe(true);
    expect(incomplete.some((c) => c.domains.length === 0 && !c.noDomain)).toBe(true);
  });
  it('never fit a deck, never pass as domainless, and keep the deck from being called legal', () => {
    for (const c of incomplete) {
      for (const legend of ['Daughter of the Void', 'Wuju Master', 'Heart of the Tempest']) {
        const base = legalDeck(legend, eligibleChampions(card(legend), db)[0].name);
        expect(cardFitsDeck(c, 'main', base, db)?.code, c.name).toBe('DATA_STALE');
        expect(cardFitsDeck(c, 'side', base, db)?.code, c.name).toBe('DATA_STALE');
        const trimmed = trim(base, 1);
        const vs = check({ ...trimmed, main: add(trimmed.main, c.id, 1) });
        expect(errors(vs), c.name).toEqual([]);
        expect(find(vs, 'DATA_STALE'), c.name).toMatchObject({ severity: 'warning', cardIds: [c.id] });
        expect(isLegal(vs), c.name).toBe(false);
      }
    }
  });
  it('are never offered as a Chosen Champion', () => {
    const offered = new Set(db.all().filter((c) => c.type === 'legend').flatMap((l) => eligibleChampions(l, db)).map((c) => c.id));
    expect(db.all().filter((c) => c.dataIncomplete && offered.has(c.id))).toEqual([]);
  });
});

describe('review focus 4: partial decks never throw', () => {
  const empty = (format: Format): Deck => ({
    id: null, name: '', format, power: 'focused', legend: null, champion: null, main: [], side: [], runes: {},
    battlefields: [], extraLegends: [], themeWeights: null, teammate: null,
  });
  it('an empty deck returns the missing-part violations in every format', () => {
    for (const format of FORMATS) {
      const vs = check(empty(format));
      expect(errors(vs).sort(), format).toEqual(['BATTLEFIELD_COUNT', 'CHAMPION_MISSING', 'LEGEND_MISSING', 'MAIN_TOO_SMALL', 'RUNE_COUNT']);
      expect(isLegal(vs)).toBe(false);
      expect(vs.every((v) => v.message.length > 0 && v.rule.length > 0)).toBe(true);
    }
  });
  it('no legend, no champion, 7 cards, 43 cards, 0 runes', () => {
    const full = kaisa();
    const seven = { ...full, main: [{ id: full.champion as string, qty: 1, locked: false }, { ...full.main[1], qty: 3 }, { ...full.main[2], qty: 3 }] };
    expect(errors(check(seven))).toEqual(['MAIN_TOO_SMALL']);
    expect(errors(check({ ...seven, legend: null })).sort()).toEqual(['LEGEND_MISSING', 'MAIN_TOO_SMALL']);
    expect(errors(check({ ...seven, legend: null, champion: null })).sort()).toEqual(['CHAMPION_MISSING', 'LEGEND_MISSING', 'MAIN_TOO_SMALL']);
    expect(errors(check({ ...full, champion: null }))).toEqual(['CHAMPION_MISSING']);
    const fortyThree = { ...full, main: add(full.main, filler(card('Daughter of the Void'), db)[13].id, 3) };
    expect(errors(check(fortyThree))).toEqual(['MAIN_NOT_EXACT_40']);
    expect(errors(check({ ...fortyThree, format: 'casual' }))).toEqual([]);
    expect(errors(check({ ...full, runes: {} }))).toEqual(['RUNE_COUNT']);
    expect(errors(check({ ...full, legend: null })).sort()).toEqual(['LEGEND_MISSING']);
  });
  it('malformed entries are ignored, not thrown on', () => {
    const full = kaisa();
    const broken = {
      ...full,
      main: [...full.main, { id: full.main[1].id, qty: Number.NaN, locked: false }, { id: full.main[2].id, qty: -4, locked: false }, { id: 'nope', qty: 0, locked: false }],
      runes: { fury: 6, mind: 6, body: Number.NaN, chaos: -2 },
    } as Deck;
    expect(check(broken)).toEqual([]);
    const holes = { ...empty('standard-bo3'), main: undefined, side: undefined, runes: undefined, battlefields: undefined, extraLegends: undefined, teammate: undefined } as unknown as Deck;
    expect(() => check(holes)).not.toThrow();
    expect(() => cardFitsDeck(card('Defy'), 'main', holes, db)).not.toThrow();
    expect(() => check({ ...full, format: '2v2', teammate: { legend: 'nope', battlefields: ['nope'] } })).not.toThrow();
  });
  it('works on a database without legality data', () => {
    const bare = createCardDb(fixtureCards());
    const [a, b] = safeBattlefields(db);
    const vs = check({ ...kaisa(), battlefields: [a, b, id("The Arena's Greatest")] }, bare);
    expect(vs).toEqual([]); // no ban list, no set list: nothing to enforce, nothing thrown
    expect(formatRules('standard-bo3', bare.legality()).sideMax).toBe(10);
  });
});

describe('review focus 5: format differences in one table', () => {
  it('41 cards, a side deck, a 2v2-only ban and a teammate, per format', () => {
    const extra = filler(card('Wuju Bladesman'), db)[13].id;
    const side = filler(card('Wuju Bladesman'), db)[14].id;
    const expected: Record<Format, string[]> = {
      'standard-bo1': ['MAIN_NOT_EXACT_40'],
      'standard-bo3': ['MAIN_NOT_EXACT_40'],
      '2v2': ['LEGEND_BANNED', 'MAIN_NOT_EXACT_40', 'TEAM_SAME_BATTLEFIELD', 'TEAM_SAME_LEGEND'],
      ffa3: ['SIDEBOARD_NOT_ALLOWED'],
      ffa4: ['SIDEBOARD_NOT_ALLOWED'],
      casual: ['SIDEBOARD_NOT_ALLOWED'],
    };
    for (const format of FORMATS) {
      const base = legalDeck('Wuju Bladesman', 'Master Yi, Honed', format);
      const deck: Deck = {
        ...base, main: add(base.main, extra, 1), side: [{ id: side, qty: 3, locked: false }],
        teammate: { legend: base.legend, battlefields: [base.battlefields[0]] },
      };
      expect(codes(check(deck)).sort(), format).toEqual(expected[format]);
    }
  });
});
