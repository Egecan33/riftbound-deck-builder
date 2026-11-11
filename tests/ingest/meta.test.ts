import { describe, expect, it } from 'vitest';
import { aggregate, balanced, classifyName, eraOf, erasOf, flight, parseDeckPage, parseListingPage, pickCandidates, resolveDeck, runeSplitKey, type PaDeck, type PaListRow } from '@/ingest/meta';
import { hubDates } from '@/ingest/legality';
import { fixtureDb, fixtureDecks } from '../helpers/fixture-db';

const db = fixtureDb();
const eras = erasOf(db.legality(), '2026-11-12');

/** A Piltover Archive record built from a reference deck, as the deck page would give it. */
function paDeck(index: number, over: Partial<PaDeck> = {}): PaDeck {
  const ref = fixtureDecks()[index];
  const entry = (id: string, q: number) => ({ q, name: db.get(id)!.name, code: db.get(id)!.code });
  const champion = ref.deck.champion!;
  return {
    id: `deck-${index}`, name: 'Some list', views: 1000, likes: 3, createdAt: '2026-11-01T00:00:00.000Z', editedAt: '2026-11-05T00:00:00.000Z',
    legend: { name: null, code: db.get(ref.legend)!.code },
    champions: [entry(champion, 1)],
    main: ref.deck.main.map((e) => entry(e.id, e.id === champion ? e.qty - 1 : e.qty)).filter((e) => e.q > 0),
    side: ref.deck.side.map((e) => entry(e.id, e.qty)),
    battlefields: ref.deck.battlefields.map((id) => entry(id, 1)),
    runes: Object.entries(ref.deck.runes).map(([domain, q]) => ({ q: q ?? 0, name: `${domain[0].toUpperCase()}${domain.slice(1)} Rune`, code: null })),
    ...over,
  };
}

describe('page parsing', () => {
  const push = (payload: string) => `<script>self.__next_f.push([1,${JSON.stringify(payload)}])</script>`;

  it('reads a deck from the flight payload and leaves the author out', () => {
    const deck = {
      id: 'd1', authorName: 'someone', name: 'RQ - #1', views: 12, likes: 1, createdAt: '$D2026-11-01T00:00:00.000Z', editedAt: '$D2026-11-02T00:00:00.000Z',
      legendId: 'x', legend: { variantNumber: 'OGS-019', card: { name: 'Master Yi, Wuju Bladesman' } },
      champions: [{ quantity: 1, variantId: 'v2', card: { name: 'Master Yi, Tempered', type: 'Unit', cardColors: [{ color: { name: 'Calm' } }], cardVariants: [{ id: 'v1', variantNumber: 'UNL-113a' }, { id: 'v2', variantNumber: 'UNL-113' }] } }],
      battlefields: [], runes: [], maindeck: [{ quantity: 3, variantId: 'q', card: { name: 'Hush', cardVariants: [{ id: 'q', variantNumber: 'RAD-041' }] } }], sideboard: [],
    };
    const json = JSON.stringify({ wrapper: { deck } });
    const html = push(`5:${json.slice(0, 40)}`) + push(json.slice(40));
    expect(flight(html)).toBe(`5:${json}`);
    const parsed = parseDeckPage(html)!;
    expect(parsed.name).toBe('RQ - #1');
    expect(parsed.editedAt).toBe('2026-11-02T00:00:00.000Z');
    expect(parsed.legend.code).toBe('OGS-019');
    expect(parsed.champions).toEqual([{ q: 1, name: 'Master Yi, Tempered', code: 'UNL-113', type: 'unit', domains: ['calm'] }]);
    expect(parsed.main[0]).toMatchObject({ q: 3, code: 'RAD-041' });
    expect(JSON.stringify(parsed)).not.toContain('someone');
    expect(parseDeckPage('<html>nothing</html>')).toBeNull();
  });

  it('reads the rows of a listing page', () => {
    const rows = [{ id: '493c5f53-dac5-4385-aca1-e353f5182e9d', name: 'Best of riven', authorName: 'x', views: 9, likes: 1, createdAt: '2026-10-08T00:00:00.000Z', editedAt: '2026-11-10T00:00:00.000Z', legend: { variantNumber: 'RAD-173' }, sets: [{ prefix: 'RAD' }], isLegal: true }];
    const parsed = parseListingPage(push(`a:${JSON.stringify({ decks: rows })}`));
    expect(parsed).toEqual([{ id: rows[0].id, name: 'Best of riven', views: 9, likes: 1, createdAt: rows[0].createdAt, editedAt: rows[0].editedAt, legendCode: 'RAD-173', sets: ['RAD'], isLegal: true }]);
    expect(parseListingPage('<html></html>')).toEqual([]);
    expect(balanced('x{"a":"}"}y', 1)).toBe('{"a":"}"}');
  });

  it('finds the Rules Hub dates', () => {
    expect(hubDates('<p>Last updated: September 18, 2026</p><span>last updated: October 9, 2026</span>')).toEqual(['2026-10-09', '2026-09-18']);
    expect(hubDates('no dates')).toEqual([]);
  });
});

describe('name heuristics and eras', () => {
  it('classifies event, placement and multiplayer names', () => {
    expect(classifyName('【Regional Qualifier】Hartford - #1 (x)')).toEqual({ event: true, rank: '1', format: 'standard' });
    expect(classifyName('Top 8 RQ Lille Draven')).toMatchObject({ event: true, rank: '5-8' });
    expect(classifyName('my fun kaisa brew')).toEqual({ event: false, rank: null, format: 'standard' });
    expect(classifyName('RC Stuttgart 2v2 5-0')).toMatchObject({ event: true, format: '2v2' });
    expect(classifyName('FFA Annie')).toMatchObject({ format: 'ffa' });
    expect(classifyName('Jinx Champion Deck precon')).toMatchObject({ event: false });
  });

  it('derives eras from set releases and ban dates', () => {
    expect(eras.at(-1)).toEqual({ id: 'RAD', from: '2026-10-23' });
    expect(eras.map((e) => e.from)).toContain('2026-09-18');
    expect(eraOf('2026-10-01T10:00:00.000Z', eras)?.id).toBe('VEN-postban-2026-09-18');
    expect(eraOf('2026-08-02', eras)?.id).toBe('VEN');
    expect(erasOf(db.legality(), '2026-08-01').at(-1)?.id).toBe('VEN');
  });
});

describe('resolving and aggregating lists', () => {
  it('resolves a list by card code and counts the Chosen Champion inside main', () => {
    const r = resolveDeck(paDeck(0), db);
    expect(r.unresolved).toEqual([]);
    expect(r.complete).toBe(true);
    expect(r.legendId).toBe(fixtureDecks()[0].legend);
    expect(Object.values(r.cards.main).reduce((a, b) => a + b, 0)).toBe(40);
    expect(r.championId).toBe(fixtureDecks()[0].deck.champion);
    expect(r.banned).toEqual([]);
  });

  it('reports what it cannot resolve instead of dropping it, and marks banned cards', () => {
    const base = paDeck(0);
    const r = resolveDeck({ ...base, main: [...base.main, { q: 2, name: 'Not A Card', code: 'ZZZ-999' }, { q: 1, name: 'Ekko, Recurrent', code: 'OGN-110' }] }, db);
    expect(r.unresolved).toEqual(['2 Not A Card']);
    expect(r.complete).toBe(false);
    expect(r.banned).toEqual([db.byName('Ekko, Recurrent')!.id]);
  });

  it('aggregates inclusion per legend, drops banned cards, and grades thin samples', () => {
    const base = paDeck(0);
    // Stacked Deck is banned and Chaos, inside the Calm/Chaos identity of the first reference deck.
    const withBan = { ...base, id: 'b', main: [...base.main.slice(1), { q: base.main[0].q, name: 'Stacked Deck', code: 'OGN-183' }] };
    const old = { ...base, id: 'old', editedAt: '2026-10-01T00:00:00.000Z' };
    const multi = { ...base, id: 'm', name: '2v2 list' };
    const resolved = [base, { ...base, id: 'a2' }, withBan, old, multi, paDeck(1)].map((d) => resolveDeck(d, db));
    const { legends, cards } = aggregate(resolved, db, eras);
    const legend = fixtureDecks()[0].legend;
    const row = legends.find((l) => l.legend === legend)!;
    expect(row.decks).toBe(4); // three current lists and the older one; the 2v2 list is left out
    expect(row.quality).toBe('insufficient');
    expect(row.era).toBe('RAD+older');
    expect(legends).toHaveLength(2);
    const mine = cards.filter((c) => c.legend === legend);
    expect(resolved[2].complete).toBe(true);
    expect(resolved[2].banned).toEqual([db.byName('Stacked Deck')!.id]);
    expect(mine.some((c) => c.card === db.byName('Stacked Deck')!.id)).toBe(false);
    const champion = mine.find((c) => c.zone === 'champion')!;
    expect(champion.share).toBe(1);
    const first = mine.find((c) => c.zone === 'main' && c.card === db.byName(base.main[0].code!)!.id)!;
    expect(first.decks).toBe(3);
    expect(first.share).toBeLessThan(1);
    expect(first.share).toBeGreaterThan(0.5);
    expect(mine.filter((c) => c.zone === 'runes')).toHaveLength(1);
    expect(mine.filter((c) => c.zone === 'battlefields')).toHaveLength(3);
    expect(runeSplitKey(resolved[0].cards.runes, db)).toMatch(/^[a-z]+\d+(-[a-z]+\d+)?$/);
  });

  it('does not count a list that breaks Domain Identity or has the wrong Chosen Champion', () => {
    const base = paDeck(0); // Blade Dancer, Calm/Chaos
    expect(resolveDeck(base, db).illegal).toEqual([]);

    const swap = (name: string) => [...base.main.slice(1), { q: base.main[0].q, name, code: db.byName(name)!.code }];
    const offDomain = resolveDeck({ ...base, id: 'off', main: swap('Glowstone') }, db); // Order
    expect(offDomain.unresolved).toEqual([]);
    expect(offDomain.illegal).toEqual([`off-identity: ${base.main[0].q} Glowstone`]);
    expect(offDomain.complete).toBe(false);

    const offSide = resolveDeck({ ...base, id: 'side', side: [{ q: 1, name: 'Glowstone', code: null }] }, db);
    expect(offSide.complete).toBe(false);
    const offRune = resolveDeck({ ...base, id: 'rune', runes: [{ q: 12, name: 'Order Rune', code: null }] }, db);
    expect(offRune.illegal).toEqual(['off-identity: 12 Order Rune']);

    // Another legend's champion in the champion slot (seen live: a Kha'Zix list with Rengar, Trophy Hunter).
    const stranger = db.byName(fixtureDecks()[1].deck.champion!)!;
    const wrongChampion = resolveDeck({ ...base, id: 'champ', champions: [{ q: 1, name: stranger.name, code: stranger.code }] }, db);
    expect(wrongChampion.illegal.some((x) => x.startsWith('champion: '))).toBe(true);
    expect(wrongChampion.complete).toBe(false);

    // No champion slot: fine when the main deck holds a champion unit of the legend, not otherwise.
    const inMain = resolveDeck({ ...base, id: 'in-main', champions: [], main: [...base.main, base.champions[0]] }, db);
    expect(inMain.championId).toBeNull();
    expect(inMain.complete).toBe(true);
    const own = db.get(fixtureDecks()[0].deck.champion!)!;
    const others = base.main.filter((e) => db.byName(e.code!)!.championTag !== own.championTag || !db.byName(e.code!)!.superTypes.includes('champion'));
    const filler = { q: 40 - others.reduce((n, e) => n + e.q, 0), name: 'Spiderling', code: 'VEN-097' }; // Chaos, any number
    const none = resolveDeck({ ...base, id: 'none', champions: [], main: [...others, filler] }, db);
    expect(Object.values(none.cards.main).reduce((a, b) => a + b, 0)).toBe(40);
    expect(none.illegal).toEqual([`champion: no champion unit of ${db.get(fixtureDecks()[0].legend)!.name} in the list`]);
    expect(none.complete).toBe(false);

    // None of them reaches the aggregate.
    const { legends } = aggregate([offDomain, offSide, offRune, wrongChampion, none], db, eras);
    expect(legends).toEqual([]);

    // A card whose row is flagged incomplete has an untrusted domain and is not judged.
    const incomplete = db.all().find((c) => c.dataIncomplete && c.type !== null && c.domains.length === 1 && !['calm', 'chaos'].includes(c.domains[0]));
    if (incomplete) expect(resolveDeck({ ...base, id: 'inc', main: swap(incomplete.name) }, db).illegal).toEqual([]);
  });

  it('survives an empty input', () => {
    expect(aggregate([], db, eras)).toEqual({ legends: [], cards: [] });
    expect(aggregate([], db, [])).toEqual({ legends: [], cards: [] });
  });
});

describe('pickCandidates', () => {
  const legendCodes = fixtureDecks().slice(0, 2).map((d) => db.get(d.legend)!.code);
  const row = (id: string, over: Partial<PaListRow>): PaListRow => ({ id, name: 'list', views: 900, likes: 0, createdAt: '2026-10-30', editedAt: '2026-11-01T00:00:00.000Z', legendCode: legendCodes[0], sets: ['RAD'], isLegal: true, ...over });

  it('keeps legal, recent, popular or event lists that are new or edited, thin legends first', () => {
    const rows = [
      row('popular', {}),
      row('event', { views: 3, name: 'RQ Top 8' }),
      row('quiet', { views: 3 }),
      row('illegal', { isLegal: false }),
      row('old', { editedAt: '2026-09-01T00:00:00.000Z', sets: ['OGN'] }),
      row('known', {}),
      row('edited', { editedAt: '2026-11-09T00:00:00.000Z' }),
      row('other-legend', { legendCode: legendCodes[1] }),
      row('no-legend', { legendCode: 'ZZZ-001' }),
    ];
    const have = new Map([['known', '2026-11-01T00:00:00.000Z'], ['edited', '2026-11-01T00:00:00.000Z']]);
    const counts = new Map([[db.byName(legendCodes[0])!.id, 5]]);
    const picked = pickCandidates(rows, have, counts, db, eras.at(-1)!, 'RAD').map((r) => r.id);
    expect(picked).toEqual(['other-legend', 'event', 'popular', 'edited']);
  });
});
