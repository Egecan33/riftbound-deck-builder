// Plan Task 9: text lists, deck codes, collection. Runs on the committed fixture only.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { decodeDeckCode, encodeDeckCode, exportDecklist, looksLikeDeckCode, parseCollection, parseDecklist } from '@/engine/text';
import { splitQuantity } from '@/engine/text/resolve';
import type { Deck, DeckEntry } from '@/engine/types';
import { fixtureDb, fixtureDeckFiles, readFixtureDeck } from '../helpers/fixture-db';

const db = fixtureDb();
const id = (name: string): string => {
  const card = db.byName(name);
  if (!card) throw new Error(`fixture has no card "${name}"`);
  return card.id;
};
const counts = (entries: DeckEntry[] | undefined): Record<string, number> =>
  Object.fromEntries([...(entries ?? [])].map((e) => [e.id, e.qty] as const).sort(([a], [b]) => a.localeCompare(b)));
/** The parts of a deck the importer fills, in a form that ignores entry order. */
const shape = (deck: Partial<Deck>) => ({
  legend: deck.legend ?? null, champion: deck.champion ?? null,
  main: counts(deck.main), side: counts(deck.side), runes: deck.runes ?? {},
  battlefields: [...(deck.battlefields ?? [])].sort(), extraLegends: deck.extraLegends ?? [],
});
const deckText = (file: string): string => readFileSync(path.join(process.cwd(), 'tests', 'fixtures', 'decks', file), 'utf8');

// The deck code on https://piltoverarchive.com/decks/view/d0e2d3fd-f76c-41ed-83b6-31fbcd96d7e0 (the
// page's "/deckbuilder?code=" link, read 2026-11-12), the source of tests/fixtures/decks/irelia-blade-dancer.txt.
const IRELIA_CODE =
  'CMAAAAAAAAAACAQAAMVKMAIAAABQCAAAHIBAGAECAHCACAQGAAQGSBADAAAC3LIBY4AQEAYAGCCQCAQEAAWTKAIFAATAMAIAAAVQIAYAFWFQDEIB6YAQCAYBRUAQIBAAQAAZCAONAHLQCAQFAAP2IAIBAYAGUAIBAAADQAIBAQAZMAICAIBQBCABSEAQGBAAQAAYGAMRAEAQGAMNAE';

describe('parseDecklist: fixture decks', () => {
  it.each(fixtureDeckFiles())('%s reads to the reference deck with nothing unresolved', (file) => {
    const parsed = parseDecklist(deckText(file), db);
    expect(parsed.unresolved).toEqual([]);
    expect(shape(parsed.deck)).toEqual(shape(readFixtureDeck(file).deck));
  });

  it('counts the Chosen Champion inside main', () => {
    const { deck } = parseDecklist(deckText('irelia-blade-dancer.txt'), db);
    expect(deck.champion).toBe(id('Irelia, Graceful'));
    expect(deck.main?.find((e) => e.id === deck.champion)?.qty).toBe(1);
    expect(deck.main?.reduce((n, e) => n + e.qty, 0)).toBe(40);
    expect(deck.side?.reduce((n, e) => n + e.qty, 0)).toBe(10);
    expect(deck.runes).toEqual({ calm: 6, chaos: 6 });
  });
});

describe('parseDecklist: messy input (Review focus 6)', () => {
  it('reads "3 Name", "3x Name", "3xName", "Name x3", a bare name and bullets', () => {
    const { deck, unresolved } = parseDecklist('3 Charm\n2x Defy\n2xDiscipline\nTideturner x3\nSwitcheroo\n- 2 Scuttle Crab\n', db);
    expect(unresolved).toEqual([]);
    expect(counts(deck.main)).toEqual(counts([
      { id: id('Charm'), qty: 3, locked: false }, { id: id('Defy'), qty: 2, locked: false },
      { id: id('Discipline'), qty: 2, locked: false }, { id: id('Tideturner'), qty: 3, locked: false },
      { id: id('Switcheroo'), qty: 1, locked: false }, { id: id('Scuttle Crab'), qty: 2, locked: false },
    ]));
  });

  it('does not eat the x of a name that starts with X', () => {
    expect(splitQuantity('3 Xerath, Arcane')).toEqual({ qty: 3, text: 'Xerath, Arcane', explicit: true });
    expect(splitQuantity('3x Xerath')).toEqual({ qty: 3, text: 'Xerath', explicit: true });
  });

  it('reads set codes in every common spelling', () => {
    const charm = db.byName('Charm')!;
    const lines = [
      `2 ${charm.code}`, `1 ${charm.code}/298`, `1 ${charm.code.toLowerCase()}`, `1 Charm (${charm.code})`, `1 Charm [${charm.code}]`,
      `1 ${charm.code} Charm`, `1 Charm (OGN) ${Number(charm.code.split('-')[1])}`, `1 OGN-${Number(charm.code.split('-')[1])}`,
      `1 Chaarm (${charm.code})`,
    ];
    const { deck, unresolved } = parseDecklist(lines.join('\n'), db);
    expect(unresolved).toEqual([]);
    expect(deck.main).toEqual([{ id: charm.id, qty: lines.length + 1, locked: false }]);
  });

  it('reads an alternate-art printing code as its card', () => {
    const { deck, unresolved } = parseDecklist('6 OGN-042a\n6 Calm Rune', db);
    expect(unresolved).toEqual([]);
    expect(deck.runes).toEqual({ calm: 12 });
  });

  it('accepts header variants, markdown, counts, inline headers and CRLF', () => {
    const text = [
      '## Legend', '1 Blade Dancer', '', 'Chosen Champion:', '1 Irelia, Graceful', '', 'Main Deck (39):', '3 Charm',
      'Rune Deck: 12', '6 Calm Rune', '6 Chaos Rune', 'BATTLEFIELDS', '1 Abandoned Hall', 'Side Deck - 2', '2 Defy',
    ].join('\r\n');
    const { deck, unresolved } = parseDecklist(text, db);
    expect(unresolved).toEqual([]);
    expect(shape(deck)).toEqual({
      legend: id('Blade Dancer'), champion: id('Irelia, Graceful'),
      main: counts([{ id: id('Irelia, Graceful'), qty: 1, locked: false }, { id: id('Charm'), qty: 3, locked: false }]),
      side: { [id('Defy')]: 2 }, runes: { calm: 6, chaos: 6 }, battlefields: [id('Abandoned Hall')], extraLegends: [],
    });
    const inline = parseDecklist('Legend: Blade Dancer\nChampion: Irelia, Graceful\nSideboard: 2 Defy', db);
    expect(inline.unresolved).toEqual([]);
    expect(inline.deck.legend).toBe(id('Blade Dancer'));
    expect(inline.deck.champion).toBe(id('Irelia, Graceful'));
    expect(inline.deck.side).toEqual([{ id: id('Defy'), qty: 2, locked: false }]);
  });

  it('places cards by type when there are no headers', () => {
    const { deck, unresolved } = parseDecklist('1 Blade Dancer\n3 Charm\n12 Chaos Rune\n1 Star Spring\n1 Sandswept Tomb', db);
    expect(unresolved).toEqual([]);
    expect(deck.legend).toBe(id('Blade Dancer'));
    expect(deck.champion).toBeNull();
    expect(deck.main).toEqual([{ id: id('Charm'), qty: 3, locked: false }]);
    expect(deck.runes).toEqual({ chaos: 12 });
    expect(deck.battlefields).toEqual([id('Star Spring'), id('Sandswept Tomb')]);
  });

  it('keeps a legend, rune or battlefield out of main even under a Main header', () => {
    const { deck } = parseDecklist('Main:\n1 Blade Dancer\n6 Calm Rune\n1 Star Spring\n3 Charm', db);
    expect(deck.main).toEqual([{ id: id('Charm'), qty: 3, locked: false }]);
    expect(deck.legend).toBe(id('Blade Dancer'));
  });

  it('keeps a second legend as an extra legend', () => {
    const { deck } = parseDecklist('Legend:\n1 Blade Dancer\n1 Wuju Bladesman\n1 Blade Dancer', db);
    expect(deck.legend).toBe(id('Blade Dancer'));
    expect(deck.extraLegends).toEqual([id('Wuju Bladesman')]);
  });

  it('resolves names whatever the case, apostrophe or legend prose form (Review focus 1)', () => {
    const { deck, unresolved } = parseDecklist('1 kai’sa, survivor\n1 KAISA SURVIVOR\n1 Master Yi, Wuju Bladesman\n1 Yi, Meditative\n1 Master Yi, Meditative', db);
    expect(unresolved).toEqual([]);
    expect(deck.legend).toBe(id('Wuju Bladesman'));
    expect(counts(deck.main)).toEqual(counts([
      { id: id("Kai'Sa, Survivor"), qty: 2, locked: false }, { id: id('Master Yi, Meditative'), qty: 2, locked: false },
    ]));
  });

  it('reports unresolved lines with their line number and never drops them', () => {
    const { deck, unresolved } = parseDecklist('3 Charm\n2 Definitely Not A Card\n\n# a comment\n1 ZZZ-999\nMain:\n4 ???', db);
    expect(deck.main).toEqual([{ id: id('Charm'), qty: 3, locked: false }]);
    expect(unresolved).toEqual([
      { line: 2, text: '2 Definitely Not A Card' }, { line: 5, text: '1 ZZZ-999' }, { line: 7, text: '4 ???' },
    ]);
  });

  it('drops tokens with a notice', () => {
    const { deck, unresolved, notices } = parseDecklist('3 Charm\n4 Recruit\n1 Baron Pit\n2 UNL-T02', db);
    expect(unresolved).toEqual([]);
    expect(deck.main).toEqual([{ id: id('Charm'), qty: 3, locked: false }]);
    expect(notices).toHaveLength(3);
    expect(notices.join(' ')).toMatch(/Recruit is a token.*Baron Pit is a token.*Bird is a token/);
  });

  it('keeps a banned card and says so, using the synced ban list', () => {
    const ban = db.legality().bans.find((b) => b.zone === 'main' && db.byName(b.name));
    expect(ban).toBeDefined();
    const { deck, notices } = parseDecklist(`3 ${ban!.name}\n3 Charm`, db);
    expect(deck.main?.[0]).toEqual({ id: id(ban!.name), qty: 3, locked: false });
    expect(notices).toHaveLength(1);
    expect(notices[0]).toContain(ban!.name);
    expect(notices[0]).toContain('ban list');
  });

  it('flags a card whose source data is incomplete', () => {
    const { deck, notices } = parseDecklist('1 RAD-039', db);
    expect(deck.main).toEqual([{ id: db.byName('RAD-039')!.id, qty: 1, locked: false }]);
    expect(notices[0]).toMatch(/incomplete source data/);
  });

  it('returns sane values for empty and odd input and never throws', () => {
    const empty = { legend: null, champion: null, main: {}, side: {}, runes: {}, battlefields: [], extraLegends: [] };
    for (const text of ['', '   \n\n', '# only a comment', 'Main:\n\nSideboard:\n']) {
      const parsed = parseDecklist(text, db);
      expect(shape(parsed.deck)).toEqual(empty);
      expect(parsed.unresolved).toEqual([]);
    }
    expect(() => parseDecklist(undefined as unknown as string, db)).not.toThrow();
    expect(parseDecklist('0 Charm\n3', db).deck.main).toEqual([]);
    expect(parseDecklist('3', db).unresolved).toEqual([{ line: 1, text: '3' }]);
  });
});

describe('exportDecklist', () => {
  it.each(fixtureDeckFiles())('%s exports to exactly the fixture text', (file) => {
    const body = deckText(file).split('\n').filter((l) => !l.startsWith('#')).join('\n').trim();
    expect(exportDecklist(readFixtureDeck(file).deck, db).trim()).toBe(body);
  });

  it.each(fixtureDeckFiles())('%s round-trips through text', (file) => {
    const { deck } = readFixtureDeck(file);
    const back = parseDecklist(exportDecklist(deck, db), db);
    expect(back.unresolved).toEqual([]);
    expect(shape(back.deck)).toEqual(shape(deck));
  });

  it('round-trips partial decks: no legend, no champion, 7 cards, no runes, extra legends, unknown ids', () => {
    const base = readFixtureDeck('irelia-blade-dancer.txt').deck;
    const partials: Deck[] = [
      { ...base, legend: null, champion: null, main: base.main.slice(0, 3), side: [], runes: {}, battlefields: [] },
      { ...base, champion: null },
      { ...base, champion: null, main: [], side: base.side },
      { ...base, extraLegends: [id('Wuju Bladesman')] },
      { ...base, main: [{ id: base.champion!, qty: 3, locked: false }] },
    ];
    for (const deck of partials) {
      const back = parseDecklist(exportDecklist(deck, db), db);
      expect(back.unresolved).toEqual([]);
      expect(shape(back.deck)).toEqual(shape(deck));
    }
    const empty: Deck = { ...base, legend: null, champion: null, main: [], side: [], runes: {}, battlefields: [] };
    expect(exportDecklist(empty, db)).toBe('');
    const unknown = exportDecklist({ ...empty, main: [{ id: 'gone-001-001', qty: 2, locked: false }] }, db);
    expect(unknown).toBe('Main:\n2 gone-001-001\n');
    expect(parseDecklist(unknown, db).unresolved).toEqual([{ line: 2, text: '2 gone-001-001' }]);
  });

  it('writes every non-token card under a label that reads back as that card', () => {
    const base = readFixtureDeck('irelia-blade-dancer.txt').deck;
    const wrong = db.all().filter((card) => {
      if (card.type === 'legend' || card.type === 'rune' || card.type === 'battlefield') return false;
      const text = exportDecklist({ ...base, legend: null, champion: null, main: [{ id: card.id, qty: 1, locked: false }], side: [], runes: {}, battlefields: [] }, db);
      const back = parseDecklist(text, db);
      return back.deck.main?.[0]?.id !== card.id || back.unresolved.length > 0;
    });
    expect(wrong.map((c) => c.name)).toEqual([]);
  });
});

describe('deck codes', () => {
  it('decodes a real Piltover Archive code to its fixture list', () => {
    const decoded = decodeDeckCode(IRELIA_CODE, db);
    expect(decoded.error).toBeNull();
    expect(decoded.unresolved).toEqual([]);
    expect(shape(decoded.deck)).toEqual(shape(readFixtureDeck('irelia-blade-dancer.txt').deck));
  });

  it('parseDecklist accepts a pasted deck code, with spaces around it and in lower case', () => {
    expect(looksLikeDeckCode(IRELIA_CODE)).toBe(true);
    expect(looksLikeDeckCode('3 Charm')).toBe(false);
    for (const text of [IRELIA_CODE, `\n  ${IRELIA_CODE}\n`, IRELIA_CODE.toLowerCase()]) {
      const parsed = parseDecklist(text, db);
      expect(parsed.unresolved).toEqual([]);
      expect(shape(parsed.deck)).toEqual(shape(readFixtureDeck('irelia-blade-dancer.txt').deck));
    }
  });

  it.each(fixtureDeckFiles())('%s round-trips through a deck code', (file) => {
    const { deck } = readFixtureDeck(file);
    const encoded = encodeDeckCode(deck, db);
    expect(encoded.error).toBeNull();
    expect(encoded.skipped).toEqual([]);
    const back = decodeDeckCode(encoded.code, db);
    expect(back.error).toBeNull();
    expect(back.unresolved).toEqual([]);
    expect(shape(back.deck)).toEqual(shape(deck));
  });

  it('round-trips partial decks, extra legends and Radiance and Vendetta cards', () => {
    const base = readFixtureDeck('irelia-blade-dancer.txt').deck;
    const rad = db.all().find((c) => c.set === 'RAD' && c.type === 'unit' && !c.dataIncomplete)!;
    const ven = db.all().find((c) => c.set === 'VEN' && c.type === 'unit')!;
    const decks: Deck[] = [
      { ...base, legend: null, champion: null, main: base.main.slice(0, 3), side: [], runes: {}, battlefields: [] },
      { ...base, extraLegends: [id('Wuju Bladesman')] },
      { ...base, champion: null, main: [{ id: rad.id, qty: 3, locked: false }, { id: ven.id, qty: 2, locked: false }], side: [] },
    ];
    for (const deck of decks) {
      const encoded = encodeDeckCode(deck, db);
      expect(encoded.error).toBeNull();
      expect(shape(decodeDeckCode(encoded.code, db).deck)).toEqual(shape(deck));
    }
  });

  it('lists cards it cannot encode instead of throwing', () => {
    const base = readFixtureDeck('irelia-blade-dancer.txt').deck;
    const encoded = encodeDeckCode({ ...base, main: [...base.main, { id: db.byName('UNL-T01')!.id, qty: 1, locked: false }, { id: 'gone-001-001', qty: 1, locked: false }] }, db);
    expect(encoded.error).toBeNull();
    expect(encoded.skipped).toEqual(['Baron Pit', 'gone-001-001']);
    expect(shape(decodeDeckCode(encoded.code, db).deck)).toEqual(shape(base));
  });

  it('returns an error for an unreadable code, and parseDecklist reports the line', () => {
    const bad = 'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ';
    const decoded = decodeDeckCode(bad, db);
    expect(decoded.error).toMatch(/Not a readable deck code/);
    expect(decoded.deck).toEqual({});
    expect(decodeDeckCode('', db).error).not.toBeNull();
    expect(decodeDeckCode('not a code!', db).error).not.toBeNull();
    expect(parseDecklist(bad, db).unresolved).toEqual([{ line: 1, text: bad }]);
  });

  it('reports a card code the card data does not have', async () => {
    const { getCodeFromDeck } = await import('@piltoverarchive/riftbound-deck-codes');
    const code = getCodeFromDeck([{ cardCode: 'ARC-001', count: 2 }, { cardCode: db.byName('Charm')!.code, count: 3 }], [], 'ARC-002');
    const decoded = decodeDeckCode(code, db);
    expect(decoded.error).toBeNull();
    expect(decoded.deck.main).toEqual([{ id: id('Charm'), qty: 3, locked: false }]);
    expect(decoded.unresolved.map((u) => u.text).sort()).toEqual(['1 ARC-002', '2 ARC-001']);
  });
});

describe('parseCollection', () => {
  it('reads a pasted list and adds printings of one card together', () => {
    const { owned, unresolved, format } = parseCollection('3 Charm\nDefy x2\n1 OGN-042\n2 OGN-042a\nNot A Card\n', db);
    expect(format).toBe('list');
    expect(owned).toEqual({ [id('Charm')]: 3, [id('Defy')]: 2, [id('Calm Rune')]: 3 });
    expect(unresolved).toEqual([{ line: 5, text: 'Not A Card' }]);
  });

  it('detects a CSV header and reads quoted names with commas', () => {
    const csv = 'Card Name,Set,Quantity\n"Irelia, Graceful",UNL,2\nCharm,OGN,3\n"Kai\'Sa, Survivor",OGN,1\nNope,OGN,1\nDefy,OGN,0\n';
    const parsed = parseCollection(csv, db);
    expect(parsed.format).toBe('csv');
    expect(parsed.columns).toEqual({ name: 'card name', code: null, set: 'set', quantity: ['quantity'] });
    expect(parsed.owned).toEqual({ [id('Irelia, Graceful')]: 2, [id('Charm')]: 3, [id("Kai'Sa, Survivor")]: 1 });
    expect(parsed.unresolved).toEqual([{ line: 5, text: 'Nope,OGN,1' }]);
  });

  it('reads code columns, set + number columns, several count columns, semicolons and tabs', () => {
    const charm = db.byName('Charm')!;
    const number = charm.code.split('-')[1];
    const byCode = parseCollection(`code;normal;foil\n${charm.code};2;1\n${charm.code}/298;1;0\n`, db);
    expect(byCode.format).toBe('csv');
    expect(byCode.owned).toEqual({ [charm.id]: 4 });
    const bySetNumber = parseCollection(`Set\tNumber\tQty\nOGN\t${Number(number)}\t2\n`, db);
    expect(bySetNumber.owned).toEqual({ [charm.id]: 2 });
    const noQty = parseCollection('name,rarity\nCharm,common\nCharm,common\n', db);
    expect(noQty.owned).toEqual({ [charm.id]: 2 });
    const bom = parseCollection('﻿Name,Count\nCharm,5\n', db);
    expect(bom.owned).toEqual({ [charm.id]: 5 });
  });

  it('reads headerless delimited rows', () => {
    const { owned, unresolved, format } = parseCollection('3,Charm\nDefy,2\nIrelia, Graceful, 2\n"Kai\'Sa, Survivor",1\n', db);
    expect(format).toBe('list');
    expect(unresolved).toEqual([]);
    expect(owned).toEqual({ [id('Charm')]: 3, [id('Defy')]: 2, [id('Irelia, Graceful')]: 2, [id("Kai'Sa, Survivor")]: 1 });
  });

  it('drops tokens with a notice and survives empty input', () => {
    const parsed = parseCollection('name,qty\nRecruit,4\nCharm,1\n', db);
    expect(parsed.owned).toEqual({ [id('Charm')]: 1 });
    expect(parsed.notices).toEqual(['Recruit is a token, not a deck card; it was left out.']);
    expect(parseCollection('', db)).toMatchObject({ owned: {}, unresolved: [], notices: [], format: 'list' });
    expect(() => parseCollection(undefined as unknown as string, db)).not.toThrow();
  });
});

describe('adversarial review: rune printings the official gallery does not list', () => {
  // Piltover Archive writes runes of Spiritforged and Unleashed as SFD-R01a..R06a and UNL-R01..R06a;
  // the gallery has rune printings for OGN, VEN and RAD only.
  const order = ['fury', 'calm', 'mind', 'body', 'chaos', 'order'] as const;

  it('reads them in a list as the rune with the same R-number', () => {
    for (const set of ['SFD', 'UNL']) {
      order.forEach((domain, i) => {
        for (const suffix of ['', 'a']) {
          const parsed = parseDecklist(`Runes:\n7 ${set}-R0${i + 1}${suffix}`, db);
          expect(parsed.unresolved, `${set}-R0${i + 1}${suffix}`).toEqual([]);
          expect(parsed.deck.runes, `${set}-R0${i + 1}${suffix}`).toEqual({ [domain]: 7 });
        }
      });
    }
    expect(parseDecklist('7 UNL-R09a', db).unresolved).toHaveLength(1);
    expect(parseDecklist('7 XYZ-123', db).unresolved).toHaveLength(1);
  });

  it('decodes a deck code that carries them', async () => {
    const { getCodeFromDeck } = await import('@piltoverarchive/riftbound-deck-codes');
    const { deck } = readFixtureDeck('kaisa-daughter-of-the-void.txt');
    const cards = [
      ...deck.main.map((e) => ({ cardCode: db.get(e.id)!.code, count: e.qty })),
      { cardCode: db.get(deck.legend!)!.code, count: 1 },
      ...deck.battlefields.map((b) => ({ cardCode: db.get(b)!.code, count: 1 })),
      ...order.filter((d) => (deck.runes[d] ?? 0) > 0).map((d) => ({ cardCode: `UNL-R0${order.indexOf(d) + 1}a`, count: deck.runes[d] as number })),
    ];
    const code = getCodeFromDeck(cards, [], db.get(deck.champion!)!.code);
    const decoded = decodeDeckCode(code, db);
    expect(decoded.unresolved).toEqual([]);
    expect(decoded.deck.runes).toEqual(deck.runes);
    expect(shape(decoded.deck)).toEqual(shape({ ...deck, side: [] }));
  });
});
