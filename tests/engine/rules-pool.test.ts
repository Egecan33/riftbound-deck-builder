// Adversarial review of the rules engine against the REAL synced pool (data/forge.db), not the fixture:
// every legend, every champion unit, every signature card, every ban, every format. Expectations are
// derived here from docs/research/rules.md §2-§13 without calling the engine's own helpers, and each
// test demands the exact set of error and warning codes ("the right code fires and no wrong one does").
// Skipped where the database has not been synced.
import { describe, expect, it } from 'vitest';
import { createCardDb } from '@/engine/carddb';
import { cardFitsDeck, eligibleChampions, isLegal, validateDeck } from '@/engine/rules/validate';
import type { Card, CardDb, Deck, DeckEntry, Domain, Format, Violation } from '@/engine/types';
import { hasRealDb, realDb } from '../helpers/real-db';

const FORMATS: Format[] = ['standard-bo1', 'standard-bo3', '2v2', 'ffa3', 'ffa4', 'casual'];
const TOURNAMENT: Format[] = ['standard-bo1', 'standard-bo3', '2v2'];
const SIDE_FORMATS = TOURNAMENT;
const NEEKO = 'Neeko, Blending In';

describe.skipIf(!hasRealDb())('rules engine on the real synced pool', () => {
  const db = hasRealDb() ? realDb() : createCardDb([]);
  const all = [...db.all()].sort((a, b) => a.id.localeCompare(b.id));
  const legends = all.filter((c) => c.type === 'legend');
  const championUnits = all.filter((c) => c.type === 'unit' && c.superTypes.includes('champion'));
  const signatures = all.filter((c) => c.superTypes.includes('signature'));
  const short = (c: Card): string => (c.name.includes(', ') ? c.name.slice(0, c.name.indexOf(', ')) : c.name);
  const championShorts = new Set(championUnits.map(short));
  /** rules.md §3: the champion tag of a legend or signature card is its one tag that is a champion's short name. */
  const linkTag = (c: Card): string => {
    const hits = c.tags.filter((t) => championShorts.has(t));
    if (hits.length !== 1) throw new Error(`${c.name} (${c.code}) has ${hits.length} champion tags among [${c.tags.join(', ')}]`);
    return hits[0];
  };
  const bannedIn = (format: Format): Set<string> => new Set(db.legality().bans.filter((b) => b.formats.includes(format)).map((b) => (db.byName(b.name) as Card).id));
  const bannedAnywhere = new Set(db.legality().bans.map((b) => db.byName(b.name)?.id).filter((x): x is string => !!x));
  const inside = (c: Card, legend: Card): boolean => c.noDomain || (c.domains.length > 0 && c.domains.every((d) => legend.domains.includes(d)));
  const plain = (c: Card): boolean => (c.type === 'unit' || c.type === 'spell' || c.type === 'gear') && c.superTypes.length === 0
    && !c.dataIncomplete && !c.noDomain && c.copyLimit === 3 && !bannedAnywhere.has(c.id) && !/your deck/i.test(c.text);
  const fillerOf = (legend: Card): Card[] => all.filter((c) => plain(c) && inside(c, legend));
  const fields = all.filter((c) => c.type === 'battlefield' && !c.dataIncomplete && !bannedAnywhere.has(c.id));
  const championsOf = (legend: Card): Card[] => championUnits.filter((c) => short(c) === linkTag(legend) && inside(c, legend) && !c.dataIncomplete);
  const need = (name: string): Card => {
    const c = db.byName(name);
    if (!c) throw new Error(`the pool has no card "${name}"`);
    return c;
  };
  const e = (id: string, qty: number): DeckEntry => ({ id, qty, locked: false });

  /** 1 Chosen Champion + 13 plain cards x3 = 40, runes 6/6, three unbanned battlefields. */
  function base(legend: Card, format: Format = 'standard-bo3', champion?: Card): Deck {
    const champ = champion ?? championsOf(legend).find((c) => !bannedAnywhere.has(c.id));
    if (!champ) throw new Error(`no unbanned champion for ${legend.name}`);
    const filler = fillerOf(legend).slice(0, 13);
    if (filler.length < 13) throw new Error(`not enough filler for ${legend.name}`);
    const runes: Partial<Record<Domain, number>> = {};
    legend.domains.forEach((d, i) => { runes[d] = legend.domains.length === 1 ? 12 : i < 2 ? 6 : 0; });
    return {
      id: null, name: legend.name, format, power: 'focused', legend: legend.id, champion: champ.id,
      main: [e(champ.id, 1), ...filler.map((c) => e(c.id, 3))], side: [], runes,
      battlefields: fields.slice(0, 3).map((c) => c.id), extraLegends: [], themeWeights: null, teammate: null,
    };
  }
  /** Replaces `qty` filler copies (the last of the 13 filler rows first) with `qty` copies of `id`; the deck stays at its size. */
  function swap(deck: Deck, id: string, qty = 1): Deck {
    const main = deck.main.map((x) => ({ ...x }));
    let left = qty;
    for (let i = main.length - 1; i >= 1 && left > 0; i--) {
      if (main[i].locked || main[i].id === id) continue; // rows a test added are locked
      const take = Math.min(left, main[i].qty);
      main[i].qty -= take;
      left -= take;
    }
    const kept = main.filter((x) => x.qty > 0);
    const held = kept.find((x) => x.id === id);
    if (held) held.qty += qty; else kept.push({ id, qty, locked: true });
    return { ...deck, main: kept };
  }
  const withChampion = (deck: Deck, champion: Card): Deck => ({ ...deck, champion: champion.id, main: [e(champion.id, 1), ...deck.main.slice(1)] });
  const sig = (vs: Violation[]): string[] => [...new Set(vs.filter((v) => v.severity !== 'info').map((v) => `${v.severity[0]}:${v.code}`))].sort();
  const fails: string[] = [];
  const want = (label: string, deck: Deck, expected: string[]): void => {
    const vs = validateDeck(deck, db);
    const got = sig(vs);
    const exp = [...expected].sort();
    if (got.join() !== exp.join()) fails.push(`${label}: expected [${exp.join(', ')}] got [${got.join(', ')}]`);
    const legal = isLegal(vs);
    const shouldBeLegal = !exp.some((c) => c.startsWith('e:') || c === 'w:DATA_STALE');
    if (legal !== shouldBeLegal) fails.push(`${label}: isLegal is ${legal}`);
  };
  const done = (): void => { const copy = fails.splice(0); expect(copy).toEqual([]); };
  const legendNamed = (name: string): Card => legends.find((l) => l.name === name) ?? need(name);
  const firstLegendFor = (c: Card): Card => {
    const l = legends.find((x) => inside(c, x));
    if (!l) throw new Error(`no legend holds ${c.name}`);
    return l;
  };

  it('pool shape matches docs/STATUS.md', () => {
    expect(legends).toHaveLength(58);
    expect(championUnits).toHaveLength(177);
    expect(signatures).toHaveLength(60);
    expect(db.legality().bans).toHaveLength(13);
    for (const ban of db.legality().bans) expect(db.byName(ban.name), ban.name).toBeDefined();
  });

  it('no two different cards share a rules name (copy limits, bans and battlefield uniqueness key on it)', () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const c of all) {
      const key = c.name.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (seen.has(key)) clashes.push(`${c.name}: ${seen.get(key)} / ${c.id}`);
      seen.set(key, c.id);
    }
    expect(clashes).toEqual([]);
  });

  it('every legend: the engine offers exactly the champions the rules allow', () => {
    for (const legend of legends) {
      const mine = championsOf(legend).map((c) => c.name).sort();
      expect(mine.length, legend.name).toBeGreaterThan(0);
      expect(eligibleChampions(legend, db).map((c) => c.name).sort(), legend.name).toEqual(mine);
    }
  });

  it('every legend x every format: a minimal legal deck has no violation at all', () => {
    for (const legend of legends) {
      for (const format of FORMATS) {
        const expected = bannedIn(format).has(legend.id) ? ['e:LEGEND_BANNED'] : [];
        want(`${legend.name} ${format}`, base(legend, format), expected);
        const vs = validateDeck(base(legend, format), db);
        if (expected.length === 0 && vs.length > 0) fails.push(`${legend.name} ${format}: ${vs.map((v) => v.code).join(', ')}`);
      }
    }
    done();
  });

  it('every legend x every champion unit of the pool as Chosen Champion: only tag-matching, in-identity, unbanned ones pass', () => {
    let passing = 0;
    for (const legend of legends) {
      const tag = linkTag(legend);
      for (const champion of championUnits) {
        for (const format of (bannedAnywhere.has(champion.id) ? ['standard-bo3', 'casual'] : ['standard-bo3']) as Format[]) {
          const expected: string[] = [];
          if (champion.dataIncomplete) expected.push('w:DATA_STALE');
          else {
            if (!inside(champion, legend)) expected.push('e:DOMAIN_VIOLATION');
            if (bannedIn(format).has(champion.id)) expected.push('e:CARD_BANNED');
            // Neeko (no domain, a champion unit) asks for extra legends: a warning when none is listed.
            if (champion.name === NEEKO) expected.push('w:NEEKO_LEGENDS_COUNT');
          }
          if (short(champion) !== tag) expected.push('e:CHAMPION_TAG_MISMATCH');
          if (expected.length === 0) passing += 1;
          want(`${legend.name} + ${champion.name} ${format}`, withChampion(base(legend, format), champion), expected);
        }
      }
    }
    expect(passing).toBeGreaterThan(58);
    done();
  }, 120_000);

  it('every legend x every signature card: 1 copy passes only under the matching champion tag and identity', () => {
    for (const legend of legends) {
      const tag = linkTag(legend);
      for (const card of signatures) {
        const expected: string[] = [];
        if (card.dataIncomplete) expected.push('w:DATA_STALE');
        else {
          if (!inside(card, legend)) expected.push('e:DOMAIN_VIOLATION');
          if (linkTag(card) !== tag) expected.push('e:SIGNATURE_WRONG_CHAMPION');
        }
        want(`${legend.name} + ${card.name} main`, swap(base(legend), card.id), expected);
        want(`${legend.name} + ${card.name} side`, { ...base(legend), side: [e(card.id, 1)] }, expected);
        // A signature card can never be the Chosen Champion (CR 103.3.d.3), also the legend's own signature unit.
        if (card.type === 'unit' && !card.dataIncomplete) {
          const deck = { ...base(legend), champion: card.id };
          want(`${legend.name} champion ${card.name}`, swap(deck, card.id), [...expected, 'e:CHAMPION_NOT_CHAMPION_UNIT']);
        }
      }
    }
    done();
  });

  it('every legend: signature total, copy limits and Unique', () => {
    for (const legend of legends) {
      const tag = linkTag(legend);
      const own = signatures.filter((s) => !s.dataIncomplete && linkTag(s) === tag && inside(s, legend));
      const copies = (c: Card): number => (c.copyLimit === 1 ? 1 : 3);
      // Fill up to exactly 3 signature cards: legal.
      let deck = base(legend);
      let n = 0;
      for (const s of own) { const take = Math.min(copies(s), 3 - n); if (take > 0) { deck = swap(deck, s.id, take); n += take; } }
      if (n === 3) {
        want(`${legend.name} 3 signature`, deck, []);
        const pool = own.reduce((a, s) => a + copies(s), 0);
        if (pool >= 4) {
          // A fourth one within every name limit: only the total fires, in main or in the side deck.
          const fourth = own.find((s) => (deck.main.find((x) => x.id === s.id)?.qty ?? 0) < copies(s)) as Card;
          want(`${legend.name} 4 signature main`, swap(deck, fourth.id, 1), ['e:SIGNATURE_TOTAL_EXCEEDED']);
          want(`${legend.name} 3 signature main + 1 side`, { ...deck, side: [e(fourth.id, 1)] }, ['e:SIGNATURE_TOTAL_EXCEEDED']);
        }
      }
      for (const s of own.filter((x) => x.copyLimit === 1)) {
        want(`${legend.name} 2 ${s.name}`, swap(base(legend), s.id, 2), ['e:UNIQUE_LIMIT_EXCEEDED']);
        want(`${legend.name} ${s.name} main + side`, { ...swap(base(legend), s.id, 1), side: [e(s.id, 1)] }, ['e:UNIQUE_LIMIT_EXCEEDED']);
      }
      // Plain card: 4 copies in main; 3 main + 1 side; the Chosen Champion counts as one of the 3.
      const b = base(legend);
      const first = b.main[1].id;
      want(`${legend.name} 4 copies`, swap(b, first, 1), ['e:COPY_LIMIT_EXCEEDED']);
      want(`${legend.name} 3 main + 1 side`, { ...b, side: [e(first, 1)] }, ['e:COPY_LIMIT_EXCEEDED']);
      want(`${legend.name} 4 Chosen Champion copies`, swap(b, b.champion as string, 3), ['e:COPY_LIMIT_EXCEEDED']);
      want(`${legend.name} 3 Chosen Champion copies`, swap(b, b.champion as string, 2), []);
    }
    done();
  });

  it('every legend: legend, champion, size, type, token, rune and battlefield mutations fire their own code only', () => {
    const recruit = db.get('ogn-271-298') as Card;
    const gold = db.get('sfd-t03') as Card;
    const brush = db.get('unl-t03') as Card;
    const buff = db.get('unl-t04') as Card;
    for (const t of [recruit, gold, brush, buff]) expect(t?.superTypes).toContain('token');
    const anyRune = all.find((c) => c.type === 'rune') as Card;
    for (const legend of legends) {
      const L = legend.name;
      for (const format of FORMATS) {
        const b = base(legend, format);
        const ban = bannedIn(format).has(legend.id) ? ['e:LEGEND_BANNED'] : [];
        const tournament = TOURNAMENT.includes(format);
        const w = (label: string, deck: Deck, expected: string[]) => want(`${L} ${format} ${label}`, deck, [...ban, ...expected]);
        const other = legends.find((x) => x.domains.every((d) => !legend.domains.includes(d))) as Card;
        const offCard = fillerOf(other).find((c) => !inside(c, legend)) as Card;
        const offRune = (['fury', 'calm', 'mind', 'body', 'chaos', 'order'] as Domain[]).find((d) => !legend.domains.includes(d)) as Domain;

        // 1-2
        want(`${L} ${format} no legend`, { ...b, legend: null }, ['e:LEGEND_MISSING']);
        want(`${L} ${format} unit as legend`, { ...b, legend: b.main[1].id }, ['e:LEGEND_NOT_LEGEND']);
        want(`${L} ${format} token as legend`, { ...b, legend: brush.id }, ['e:LEGEND_NOT_LEGEND', 'e:TOKEN_IN_DECK']);
        want(`${L} ${format} unknown legend`, { ...b, legend: 'zzz-999' }, ['w:DATA_STALE']);
        // 4, 5, 7
        w('no champion', { ...b, champion: null }, ['e:CHAMPION_MISSING']);
        w('plain unit as champion', { ...b, champion: b.main[1].id }, ['e:CHAMPION_NOT_CHAMPION_UNIT']);
        w('legend as champion', { ...b, champion: legend.id }, ['e:CHAMPION_NOT_CHAMPION_UNIT', 'e:CHAMPION_NOT_IN_MAIN']);
        w('champion not in main', { ...b, main: [e(fillerOf(legend)[13].id, 1), ...b.main.slice(1)] }, ['e:CHAMPION_NOT_IN_MAIN']);
        w('unknown champion', { ...b, champion: 'zzz-999' }, ['w:DATA_STALE']);
        // 8-9
        w('39 main', { ...b, main: b.main.map((x, i) => (i === 13 ? { ...x, qty: 2 } : x)) }, ['e:MAIN_TOO_SMALL']);
        w('41 main', { ...b, main: [...b.main, e(fillerOf(legend)[13].id, 1)] }, tournament ? ['e:MAIN_NOT_EXACT_40'] : []);
        w('61 main', { ...b, main: [...b.main, ...fillerOf(legend).slice(13, 20).map((c) => e(c.id, 3))] }, tournament ? ['e:MAIN_NOT_EXACT_40'] : []);
        // 10, 18, 11
        w('rune in main', swap(b, anyRune.id), ['e:RUNE_WRONG_TYPE']);
        w('battlefield in main', swap(b, fields[5].id), ['e:MAIN_WRONG_TYPE']);
        w('legend in main', swap(b, legend.id), ['e:MAIN_WRONG_TYPE']);
        w('token unit in main', swap(b, recruit.id), ['e:TOKEN_IN_DECK']);
        w('token gear in main', swap(b, gold.id), ['e:TOKEN_IN_DECK']);
        w('typeless token in main', swap(b, buff.id), ['e:TOKEN_IN_DECK']);
        w('unknown card in main', swap(b, 'zzz-999'), ['w:DATA_STALE']);
        // 12
        w('off-identity card in main', swap(b, offCard.id), ['e:DOMAIN_VIOLATION']);
        w('off-identity rune', { ...b, runes: { [legend.domains[0]]: 11, [offRune]: 1 } }, ['e:DOMAIN_VIOLATION']);
        // 17
        w('12/0 runes', { ...b, runes: { [legend.domains[0]]: 12 } }, []);
        w('11 runes', { ...b, runes: { [legend.domains[0]]: 11 } }, ['e:RUNE_COUNT']);
        w('13 runes', { ...b, runes: { [legend.domains[0]]: 7, [legend.domains[1]]: 6 } }, ['e:RUNE_COUNT']);
        w('no runes', { ...b, runes: {} }, ['e:RUNE_COUNT']);
        // 19-21
        w('2 battlefields', { ...b, battlefields: b.battlefields.slice(0, 2) }, ['e:BATTLEFIELD_COUNT']);
        w('4 battlefields', { ...b, battlefields: fields.slice(0, 4).map((c) => c.id) }, ['e:BATTLEFIELD_COUNT']);
        w('duplicate battlefield', { ...b, battlefields: [b.battlefields[0], b.battlefields[0], b.battlefields[1]] }, ['e:BATTLEFIELD_DUPLICATE']);
        w('triple battlefield', { ...b, battlefields: [b.battlefields[0], b.battlefields[0], b.battlefields[0]] }, ['e:BATTLEFIELD_DUPLICATE']);
        w('unit as battlefield', { ...b, battlefields: [b.battlefields[0], b.battlefields[1], b.main[1].id] }, ['e:BATTLEFIELD_WRONG_TYPE']);
        w('token battlefield', { ...b, battlefields: [b.battlefields[0], b.battlefields[1], brush.id] }, ['e:BATTLEFIELD_WRONG_TYPE', 'e:TOKEN_IN_DECK']);
        w('unknown battlefield', { ...b, battlefields: [b.battlefields[0], b.battlefields[1], 'zzz-999'] }, ['w:DATA_STALE']);
        // 24-26
        const sideCards = fillerOf(legend).slice(13, 17);
        const side10 = [e(sideCards[0].id, 3), e(sideCards[1].id, 3), e(sideCards[2].id, 3), e(sideCards[3].id, 1)];
        const hasSide = SIDE_FORMATS.includes(format);
        w('10 side', { ...b, side: side10 }, hasSide ? [] : ['w:SIDEBOARD_NOT_ALLOWED']);
        w('11 side', { ...b, side: [...side10.slice(0, 3), e(sideCards[3].id, 2)] }, hasSide ? ['e:SIDEBOARD_TOO_LARGE'] : ['w:SIDEBOARD_NOT_ALLOWED']);
        w('rune in side', { ...b, side: [e(anyRune.id, 1)] }, ['e:SIDEBOARD_WRONG_TYPE', ...(hasSide ? [] : ['w:SIDEBOARD_NOT_ALLOWED'])]);
        w('battlefield in side', { ...b, side: [e(fields[5].id, 1)] }, ['e:SIDEBOARD_WRONG_TYPE', ...(hasSide ? [] : ['w:SIDEBOARD_NOT_ALLOWED'])]);
        w('legend in side', { ...b, side: [e(other.id, 1)] }, ['e:SIDEBOARD_WRONG_TYPE', ...(hasSide ? [] : ['w:SIDEBOARD_NOT_ALLOWED'])]);
        w('token in side', { ...b, side: [e(recruit.id, 1)] }, ['e:TOKEN_IN_DECK', ...(hasSide ? [] : ['w:SIDEBOARD_NOT_ALLOWED'])]);
        w('off-identity card in side', { ...b, side: [e(offCard.id, 1)] }, ['e:DOMAIN_VIOLATION', ...(hasSide ? [] : ['w:SIDEBOARD_NOT_ALLOWED'])]);
      }
    }
    done();
  });

  it('every ban: flagged in its formats and in free-for-all, in main, side deck and battlefields; not in casual', () => {
    for (const ban of db.legality().bans) {
      const card = need(ban.name);
      for (const format of FORMATS) {
        const on = ban.formats.includes(format);
        expect(on, `${ban.name} ${format}`).toBe(format === 'casual' ? false : ban.zone === 'legend' ? format === '2v2' : true);
        if (card.type === 'legend') {
          want(`${ban.name} legend ${format}`, base(card, format), on ? ['e:LEGEND_BANNED'] : []);
          continue;
        }
        const hasSide = SIDE_FORMATS.includes(format);
        if (card.type === 'battlefield') {
          const b = base(legends[0], format);
          want(`${ban.name} battlefield ${format}`, { ...b, battlefields: [b.battlefields[0], b.battlefields[1], card.id] }, on ? ['e:CARD_BANNED'] : []);
          continue;
        }
        const legend = firstLegendFor(card);
        const b = base(legend, format);
        want(`${ban.name} main ${format}`, swap(b, card.id), on ? ['e:CARD_BANNED'] : []);
        want(`${ban.name} side ${format}`, { ...b, side: [e(card.id, 1)] }, [...(on ? ['e:CARD_BANNED'] : []), ...(hasSide ? [] : ['w:SIDEBOARD_NOT_ALLOWED'])]);
        expect(cardFitsDeck(card, 'main', b, db)?.code, `${ban.name} ${format}`).toBe(on ? 'CARD_BANNED' : undefined);
        // A banned champion unit as the Chosen Champion of its own legend.
        const own = legends.find((l) => linkTag(l) === short(card) && inside(card, l));
        if (own && card.superTypes.includes('champion')) {
          want(`${ban.name} as Chosen Champion ${format}`, base(own, format, card), on ? ['e:CARD_BANNED'] : []);
        }
      }
    }
    done();
  });

  it('a ban whose name is not in the card data is reported, never dropped in silence', () => {
    const legality = { ...db.legality(), bans: [...db.legality().bans, { name: 'A Card That Was Renamed', zone: 'main' as const, formats: ['standard-bo3' as Format], effectiveFrom: '2026-11-01', sourceUrl: '' }] };
    const other = createCardDb(all, [], [], [], [], legality);
    const vs = validateDeck(base(legends[0]), other);
    expect(vs.map((v) => v.code)).toEqual(['DATA_STALE']);
    expect(vs[0].message).toContain('A Card That Was Renamed');
    expect(isLegal(vs)).toBe(false);
    // Not in a format the unknown ban does not cover.
    expect(validateDeck(base(legends[0], 'casual'), other)).toEqual([]);
  });

  it('set legality: a card with no printing in a legal set is out, casual aside', () => {
    const cut = { ...db.legality(), sets: db.legality().sets.filter((s) => s.code !== 'RAD') };
    const other = createCardDb(all, [], [], [], [], cut);
    const radOnly = all.find((c) => plain(c) && c.sets.length === 1 && c.sets[0] === 'RAD') as Card;
    const legend = firstLegendFor(radOnly);
    const filler = fillerOf(legend).filter((c) => !c.sets.every((s) => s === 'RAD')).slice(0, 13);
    const champ = championsOf(legend).find((c) => !bannedAnywhere.has(c.id) && c.sets.some((s) => s !== 'RAD')) as Card;
    for (const format of FORMATS) {
      const b = { ...base(legend, format, champ), main: [e(champ.id, 1), ...filler.map((c) => e(c.id, 3))] };
      if (legend.sets.every((s) => s === 'RAD')) continue;
      expect(sig(validateDeck(b, other)), format).toEqual([]);
      expect(sig(validateDeck(swap(b, radOnly.id), other)), format).toEqual(format === 'casual' ? [] : ['e:CARD_NOT_IN_FORMAT']);
    }
    // In the real snapshot every card of the pool has a printing in a legal set.
    const legal = new Set(db.legality().sets.map((s) => s.code));
    expect(all.filter((c) => !c.sets.some((s) => legal.has(s))).map((c) => c.name)).toEqual([]);
  });

  it('rows with incomplete data are flagged in every zone and never called legal', () => {
    const incomplete = all.filter((c) => c.dataIncomplete);
    expect(incomplete.length).toBe(8);
    for (const card of incomplete) {
      for (const legend of [legends[0], legends[30]]) {
        const b = base(legend);
        want(`${card.code} main`, swap(b, card.id), ['w:DATA_STALE']);
        want(`${card.code} side`, { ...b, side: [e(card.id, 1)] }, ['w:DATA_STALE']);
        want(`${card.code} battlefield`, { ...b, battlefields: [b.battlefields[0], b.battlefields[1], card.id] }, ['w:DATA_STALE']);
        expect(cardFitsDeck(card, 'main', b, db)?.code).toBe('DATA_STALE');
      }
    }
    done();
  });

  it('Spiderling and other "any number" text; Unique gear outside its legend', () => {
    const anyNumber = all.filter((c) => /your deck can have any number/i.test(c.text));
    expect(anyNumber.map((c) => c.name)).toEqual(['Spiderling']);
    const spiderling = anyNumber[0];
    const legend = firstLegendFor(spiderling);
    for (const format of FORMATS) {
      const b = base(legend, format);
      want(`12 Spiderling ${format}`, swap(b, spiderling.id, 12), []);
      want(`39 Spiderling ${format}`, { ...b, main: [b.main[0], e(spiderling.id, 39)] }, []);
      want(`40 Spiderling + champion ${format}`, { ...b, main: [b.main[0], e(spiderling.id, 40)] }, TOURNAMENT.includes(format) ? ['e:MAIN_NOT_EXACT_40'] : []);
      if (SIDE_FORMATS.includes(format)) {
        want(`10 Spiderling side ${format}`, { ...b, side: [e(spiderling.id, 10)] }, []);
        want(`11 Spiderling side ${format}`, { ...b, side: [e(spiderling.id, 11)] }, ['e:SIDEBOARD_TOO_LARGE']);
      }
    }
    const unique = all.filter((c) => c.copyLimit === 1 || /only 1 card with this name/i.test(c.text) || c.keywords.some((k) => /unique/i.test(k)));
    expect(unique.map((c) => c.name).sort()).toEqual(['Forgefire Cape', "Rabadon's Deathcrown", "Shurelya's Requiem"]);
    const ornn = legends.find((l) => linkTag(l) === 'Ornn') as Card;
    let deck = base(ornn);
    for (const u of unique) deck = swap(deck, u.id, 1);
    want('Ornn with all three Unique gear', deck, []);
    done();
  });

  it('Neeko, Blending In: any identity, shared extra legends, up to 3, different names, main or side deck', () => {
    const neeko = need(NEEKO);
    expect(neeko.noDomain).toBe(true);
    for (const legend of legends) {
      const others = legends.filter((l) => l.id !== legend.id && l.name !== 'Wuju Bladesman').slice(0, 4).map((l) => l.id);
      for (const format of ['standard-bo3', 'casual'] as Format[]) {
        const b = base(legend, format);
        const L = `${legend.name} ${format}`;
        for (const qty of [1, 3]) {
          want(`${L} ${qty} Neeko + 3 legends`, { ...swap(b, neeko.id, qty), extraLegends: others.slice(0, 3) }, []);
        }
        want(`${L} Neeko + 2 legends`, { ...swap(b, neeko.id), extraLegends: others.slice(0, 2) }, ['w:NEEKO_LEGENDS_COUNT']);
        want(`${L} Neeko + 0 legends`, swap(b, neeko.id), ['w:NEEKO_LEGENDS_COUNT']);
        want(`${L} Neeko + 4 legends`, { ...swap(b, neeko.id), extraLegends: others }, ['e:NEEKO_LEGENDS_COUNT']);
        want(`${L} Neeko + own legend`, { ...swap(b, neeko.id), extraLegends: [others[0], others[1], legend.id] }, ['e:NEEKO_LEGENDS_NOT_DIFFERENT']);
        want(`${L} Neeko + repeated legend`, { ...swap(b, neeko.id), extraLegends: [others[0], others[1], others[1]] }, ['e:NEEKO_LEGENDS_NOT_DIFFERENT']);
        want(`${L} Neeko + a unit as legend`, { ...swap(b, neeko.id), extraLegends: [others[0], others[1], b.main[1].id] }, ['e:LEGEND_NOT_LEGEND']);
        want(`${L} extra legends without Neeko`, { ...b, extraLegends: others.slice(0, 3) }, ['w:NEEKO_LEGENDS_UNUSED']);
        want(`${L} 4 Neeko`, { ...swap(b, neeko.id, 4), extraLegends: others.slice(0, 3) }, ['e:COPY_LIMIT_EXCEEDED']);
        if (format === 'standard-bo3') {
          want(`${L} Neeko in side + 3 legends`, { ...b, side: [e(neeko.id, 1)], extraLegends: others.slice(0, 3) }, []);
          want(`${L} Neeko in side + 4 legends`, { ...b, side: [e(neeko.id, 1)], extraLegends: others }, ['e:NEEKO_LEGENDS_COUNT']);
        }
      }
    }
    // Extra legends never widen the identity (CR 107.4.d.1).
    const legend = legends[0];
    const other = legends.find((x) => x.domains.every((d) => !legend.domains.includes(d))) as Card;
    const off = fillerOf(other)[0];
    const three = [other.id, ...legends.filter((l) => l.id !== legend.id && l.id !== other.id).slice(0, 2).map((l) => l.id)];
    want('extra legend does not widen identity', { ...swap(swap(base(legend), neeko.id), off.id), extraLegends: three }, ['e:DOMAIN_VIOLATION']);
    // A legend banned in the format as an extra legend: a warning, not an error.
    const bladesman = need('Wuju Bladesman');
    const host = legends.find((l) => l.name !== 'Wuju Bladesman' && l.name !== 'Wuju Master') as Card;
    const extras = [bladesman.id, ...legends.filter((l) => l.id !== host.id && l.id !== bladesman.id).slice(0, 2).map((l) => l.id)];
    want('2v2 Neeko with a banned extra legend', { ...swap(base(host, '2v2'), neeko.id), extraLegends: extras }, ['w:NEEKO_LEGEND_BANNED']);
    want('bo3 Neeko with Wuju Bladesman', { ...swap(base(host, 'standard-bo3'), neeko.id), extraLegends: extras }, []);
    done();
  });

  it('2v2 teammate rules: different Champion Legends and no shared battlefield, only in 2v2', () => {
    const master = legendNamed('Wuju Master');
    const bladesman = legendNamed('Wuju Bladesman');
    for (const legend of legends) {
      if (bannedIn('2v2').has(legend.id)) continue;
      const mate = legends.find((l) => l.id !== legend.id && !bannedIn('2v2').has(l.id)) as Card;
      const b = base(legend, '2v2');
      const free = fields.slice(3, 6).map((c) => c.id);
      want(`${legend.name} clean team`, { ...b, teammate: { legend: mate.id, battlefields: free } }, []);
      want(`${legend.name} same legend`, { ...b, teammate: { legend: legend.id, battlefields: free } }, ['e:TEAM_SAME_LEGEND']);
      want(`${legend.name} one shared battlefield`, { ...b, teammate: { legend: mate.id, battlefields: [free[0], free[1], b.battlefields[2]] } }, ['e:TEAM_SAME_BATTLEFIELD']);
      want(`${legend.name} all shared`, { ...b, teammate: { legend: legend.id, battlefields: [...b.battlefields] } }, ['e:TEAM_SAME_LEGEND', 'e:TEAM_SAME_BATTLEFIELD']);
      want(`${legend.name} teammate unknown yet`, { ...b, teammate: { legend: null, battlefields: [] } }, []);
      for (const format of FORMATS.filter((f) => f !== '2v2')) {
        want(`${legend.name} ${format} ignores teammate`, { ...base(legend, format), teammate: { legend: legend.id, battlefields: [...b.battlefields] } }, []);
      }
    }
    // Same champion through another legend is a different card (rules.md §13.19).
    want('Wuju Master with a Wuju Bladesman teammate', { ...base(master, '2v2'), teammate: { legend: bladesman.id, battlefields: [] } }, []);
    done();
  });

  it('a second eligible champion in the list is offered as an alternative, as info only', () => {
    let seen = 0;
    for (const legend of legends) {
      const champs = championsOf(legend).filter((c) => !bannedAnywhere.has(c.id) && c.name !== NEEKO);
      if (champs.length < 2) continue;
      seen += 1;
      for (const format of FORMATS) {
        if (bannedIn(format).has(legend.id)) continue;
        const main = validateDeck(swap(base(legend, format, champs[0]), champs[1].id, 3), db);
        const side = validateDeck({ ...base(legend, format, champs[0]), side: [e(champs[1].id, 1)] }, db);
        const hasSide = SIDE_FORMATS.includes(format);
        expect(main.map((v) => `${v.severity}:${v.code}`), `${legend.name} ${format}`).toEqual(hasSide ? ['info:ALT_CHAMPION_AVAILABLE'] : []);
        expect(side.map((v) => `${v.severity}:${v.code}`).sort(), `${legend.name} ${format}`).toEqual(hasSide ? ['info:ALT_CHAMPION_AVAILABLE'] : ['warning:SIDEBOARD_NOT_ALLOWED']);
        expect(isLegal(main)).toBe(true);
      }
    }
    expect(seen).toBeGreaterThan(20);
  });

  it('cardFitsDeck (the builder\'s filter) agrees with validateDeck for every card of the pool in every zone', () => {
    const neeko = need(NEEKO);
    const everything = [...all, ...['ogn-271-298', 'sfd-t03', 'unl-t03', 'unl-t04'].map((id) => db.get(id) as Card)];
    let offered = 0;
    for (const legend of legends.filter((_, i) => i % 12 === 0)) {
      for (const format of ['standard-bo3', 'casual'] as Format[]) {
        const b = base(legend, format);
        const baseline = sig(validateDeck(b, db));
        for (const card of everything) {
          const decks: [string, Deck][] = [
            ['main', swap(b, card.id)],
            ['side', { ...b, side: [e(card.id, 1)] }],
            ['battlefields', { ...b, battlefields: [b.battlefields[0], b.battlefields[1], card.id] }],
            ['legend', { ...b, legend: card.id }],
          ];
          for (const [zone, deck] of decks) {
            if (zone === 'main' && card.id === b.champion) continue;
            if (zone === 'battlefields' && b.battlefields.slice(0, 2).includes(card.id)) continue;
            const fit = cardFitsDeck(card, zone as 'main', b, db);
            // What the card itself adds to a clean deck, leaving out the two things that are not about the card:
            // the format having no side deck, a fourth copy, and Neeko asking for extra legends.
            const added = sig(validateDeck(deck, db)).filter((c) => !baseline.includes(c) && c !== 'w:SIDEBOARD_NOT_ALLOWED' && c !== 'e:COPY_LIMIT_EXCEEDED' && !(card.id === neeko.id && c === 'w:NEEKO_LEGENDS_COUNT'));
            const relevant = zone === 'legend' ? added.filter((c) => /LEGEND|TOKEN|DATA_STALE|CARD_NOT_IN_FORMAT/.test(c)) : added;
            if ((fit === null) !== (relevant.length === 0)) fails.push(`${legend.name} ${format} ${card.name} in ${zone}: cardFitsDeck ${fit?.code ?? 'null'}, validateDeck adds [${added.join(', ')}]`);
            if (fit && !relevant.includes(`${fit.severity[0]}:${fit.code}`)) fails.push(`${legend.name} ${format} ${card.name} in ${zone}: cardFitsDeck says ${fit.code}, validateDeck adds [${added.join(', ')}]`);
            if (fit === null) offered += 1;
          }
        }
      }
    }
    expect(offered).toBeGreaterThan(1000);
    done();
  }, 120_000);

  it('partial, empty and malformed decks return violations and never throw', () => {
    const b = base(legends[0]);
    const empty: Deck = { id: null, name: '', format: 'standard-bo3', power: 'focused', legend: null, champion: null, main: [], side: [], runes: {}, battlefields: [], extraLegends: [], themeWeights: null, teammate: null };
    for (const format of FORMATS) {
      expect(sig(validateDeck({ ...empty, format }, db)), format).toEqual(['e:BATTLEFIELD_COUNT', 'e:CHAMPION_MISSING', 'e:LEGEND_MISSING', 'e:MAIN_TOO_SMALL', 'e:RUNE_COUNT']);
    }
    // Missing optional zones read as empty: the deck stays legal.
    for (const deck of [{ ...b, side: null }, { ...b, extraLegends: undefined }, { ...b, extraLegends: [null, 3] }, { ...b, teammate: undefined }, { ...b, format: '2v2', teammate: {} }, { ...b, format: '2v2', teammate: { legend: 9, battlefields: null } }]) {
      expect(validateDeck(deck as unknown as Deck, db), JSON.stringify(deck).slice(-80)).toEqual([]);
    }
    // A format the rules do not know is never "legal by default".
    expect(sig(validateDeck({ ...b, format: 'nonsense' as Format }, db))).toEqual(['e:FORMAT_UNKNOWN']);
    const junk: unknown[] = [
      {}, { format: 'standard-bo3' }, { ...b, main: undefined }, { ...b, runes: null }, { ...b, battlefields: undefined },
      { ...b, main: [null, { id: 5, qty: 'x' }, { id: b.main[1].id, qty: NaN }, { id: b.main[2].id, qty: -3 }, { id: b.main[3].id, qty: 1.9 }] },
      { ...b, runes: { fury: 'six', calm: -2, nope: 3 } }, { ...b, battlefields: [null, 7, ''] },
      { ...b, format: 'nonsense' }, { ...b, format: undefined }, { ...b, legend: 42 }, { ...b, champion: {} },
    ];
    junk.forEach((deck, i) => {
      let vs: Violation[] = [];
      expect(() => { vs = validateDeck(deck as Deck, db); }, `junk ${i}`).not.toThrow();
      expect(isLegal(vs), `junk ${i}`).toBe(false);
    });
    // Every prefix of a legal deck is "not legal yet", never legal and never a crash.
    for (let n = 0; n < b.main.length; n++) expect(isLegal(validateDeck({ ...b, main: b.main.slice(0, n) }, db))).toBe(false);
    expect(isLegal(validateDeck(b, db))).toBe(true);
  });
});
