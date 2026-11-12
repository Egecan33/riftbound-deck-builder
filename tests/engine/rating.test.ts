// Plan Task 6: the deck rating (spec 11).
import { describe, expect, it } from 'vitest';
import { ILLEGAL_CAP, RATING, RATING_WEIGHTS, rateDeck } from '@/engine/rating';
import { featuresFor } from '@/engine/summary';
import { INTERACTION_ROLES } from '@/engine/targets';
import { identityFit } from '@/engine/rules/identity';
import { runeSplit } from '@/engine/maths';
import { isLegal, validateDeck } from '@/engine/rules/validate';
import { parseDecklist } from '@/engine/text';
import type { Deck, DeckRating, Domain, EngineContext } from '@/engine/types';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fixtureDeckFiles } from '../helpers/fixture-db';
import { hasRealDb } from '../helpers/real-db';
import { blankDeck, card, features, scoredFixture, syntheticDb } from './scoring/forge-db';

const entries = (ids: string[], qty = 3): Deck['main'] => ids.map((id) => ({ id, qty, locked: false }));

const ctxOf = (db: EngineContext['db']): EngineContext => ({ db, opponentLegend: null });
const subOf = (r: DeckRating, key: string) => r.subscores.find((s) => s.key === key)!;
const finite = (r: DeckRating): boolean => Number.isFinite(r.rating) && r.subscores.every((s) => Number.isFinite(s.value) && s.value >= 0 && s.value <= 100);

describe('answers: a deck with no removal or no interaction is told apart from a real list (calibration 2026-11-12)', () => {
  // The reference decks with every removal (or every interaction) card swapped for the best in-identity units
  // that answer nothing: quality stays, answers go. The weighted sub-scores alone moved 7 / 13 points on 40
  // tournament lists; with the answers scale the stripped copies rate clearly lower.
  const strip = (db: EngineContext['db'], deck: Deck, bad: (roles: string[]) => boolean): Deck => {
    const legend = db.get(deck.legend!)!;
    const keep = deck.main.filter((e) => e.id === deck.champion || !bad(featuresFor(db, db.get(e.id)!).roles));
    let missing = deck.main.reduce((n, e) => n + e.qty, 0) - keep.reduce((n, e) => n + e.qty, 0);
    const have = new Set(keep.map((e) => db.get(e.id)!.name));
    const fill = db.all().filter((c) => c.type === 'unit' && !have.has(c.name) && !c.superTypes.includes('signature') && !c.superTypes.includes('champion') && !c.superTypes.includes('token')
      && !c.dataIncomplete && identityFit(c, new Set(legend.domains)) === 'ok' && !featuresFor(db, c).roles.some((r) => INTERACTION_ROLES.includes(r)))
      .sort((a, b) => featuresFor(db, b).evaluatedRating - featuresFor(db, a).evaluatedRating || a.id.localeCompare(b.id));
    const main = [...keep];
    for (const c of fill) { if (missing <= 0) break; const q = Math.min(3, missing); main.push({ id: c.id, qty: q, locked: false }); missing -= q; }
    return { ...deck, main };
  };
  it('stripping removal, then all interaction, lowers the rating, Roles and Consistency, with a fix that says why', () => {
    const { db, decks } = scoredFixture();
    let checked = 0;
    for (const d of decks) {
      const real = rateDeck(d.deck, ctxOf(db));
      const noRemoval = rateDeck(strip(db, d.deck, (r) => r.includes('removal') || r.includes('sweeper')), ctxOf(db));
      const noIx = rateDeck(strip(db, d.deck, (r) => r.some((x) => (INTERACTION_ROLES as readonly string[]).includes(x))), ctxOf(db));
      if (subOf(real, 'roles').fixes.some((f) => /^No removal/.test(f.text))) continue; // the list itself runs none
      checked += 1;
      expect(noRemoval.rating, d.file).toBeLessThanOrEqual(real.rating - 5);
      expect(noIx.rating, d.file).toBeLessThanOrEqual(real.rating - 15);
      expect(subOf(noRemoval, 'roles').value, d.file).toBeLessThan(subOf(real, 'roles').value);
      expect(subOf(noIx, 'consistency').value, d.file).toBeLessThan(subOf(real, 'consistency').value);
      expect(subOf(noRemoval, 'roles').fixes[0].text).toMatch(/No removal or sweeper.*scales the whole rating by 0\.92/);
      expect(subOf(noIx, 'consistency').fixes[0].text).toMatch(/interaction cards? \(removal, sweepers.*scales the whole rating by 0\.[78]\d/);
      expect(finite(noIx)).toBe(true);
    }
    expect(checked).toBeGreaterThanOrEqual(4);
  });
  it('a real list with enough answers is not scaled; an unfinished deck is not judged on answers yet', () => {
    const { db, decks } = scoredFixture();
    for (const d of decks) {
      const r = rateDeck(d.deck, ctxOf(db));
      const texts = r.subscores.flatMap((s) => s.fixes.map((f) => f.text)).join(' | ');
      if (!/scales the whole rating/.test(texts)) expect(r.rating, d.file).toBe(Math.round(r.subscores.reduce((n, s) => n + s.weight * s.value, 0) / 100));
      const stripped = strip(db, d.deck, (x) => x.some((y) => (INTERACTION_ROLES as readonly string[]).includes(y)));
      let n = 0;
      const part = rateDeck({ ...stripped, main: stripped.main.filter((e) => (n += e.qty) <= 30) }, ctxOf(db));
      const partTexts = part.subscores.flatMap((s) => s.fixes.map((f) => f.text)).join(' | ');
      expect(partTexts).not.toMatch(/No removal or sweeper/);
      expect(partTexts).not.toMatch(/A deck that cannot answer/);
    }
    expect(RATING.answersFloor).toBeGreaterThan(0);
  });
});

describe('rateDeck on the reference decks (fixture pool, no play evidence)', () => {
  it('each reference deck is legal and rates 55-90; weights sum to 100; at most three fixes per sub-score; heuristic sub-scores are flagged', () => {
    const { db, decks } = scoredFixture();
    expect(Object.values(RATING_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
    expect(decks).toHaveLength(6);
    for (const d of decks) {
      const r = rateDeck(d.deck, ctxOf(db));
      expect(r.legal, d.file).toBe(true);
      expect(r.complete, d.file).toBe(true);
      expect(r.rating, d.file).toBeGreaterThanOrEqual(55);
      expect(r.rating, d.file).toBeLessThanOrEqual(90);
      expect(finite(r)).toBe(true);
      expect(r.subscores.map((s) => s.key)).toEqual(['quality', 'synergy', 'curve', 'runes', 'roles', 'wincons', 'consistency', 'extras', 'fit']);
      expect(r.subscores.reduce((n, s) => n + s.weight, 0)).toBe(100);
      expect(Math.round(r.subscores.reduce((n, s) => n + s.weight * s.value, 0) / 100)).toBe(r.rating);
      for (const s of r.subscores) {
        expect(s.fixes.length).toBeLessThanOrEqual(3);
        for (const f of s.fixes) expect(f.text.length).toBeGreaterThan(10);
      }
      expect(r.subscores.filter((s) => s.heuristic).map((s) => s.key)).toEqual(expect.arrayContaining(['quality', 'synergy', 'wincons', 'fit']));
      expect(subOf(r, 'curve').heuristic).toBe(false);
      expect(subOf(r, 'roles').heuristic).toBe(false);
    }
  });
  it('removing 6 units lowers the roles sub-score and adds a fix that names the count and the band', () => {
    const { db, decks } = scoredFixture();
    let withUnitFix = 0;
    let lowered = 0;
    for (const d of decks) {
      const before = rateDeck(d.deck, ctxOf(db));
      const overBefore = subOf(before, 'roles').fixes.some((f) => /over on units/.test(f.text));
      let left = 6;
      const main = d.deck.main.map((e) => {
        const c = db.get(e.id)!;
        if (c.type !== 'unit' || e.id === d.deck.champion || left === 0) return e;
        const take = Math.min(left, e.qty);
        left -= take;
        return { ...e, qty: e.qty - take };
      }).filter((e) => e.qty > 0);
      expect(left).toBe(0);
      const after = rateDeck({ ...d.deck, main }, ctxOf(db));
      // A deck that ran more units than its archetype's band (the Rek'Sai list: 30) is not worse on roles with fewer.
      if (overBefore) continue;
      expect(subOf(after, 'roles').value, d.file).toBeLessThan(subOf(before, 'roles').value);
      lowered += 1;
      const known = new Set(subOf(before, 'roles').fixes.map((f) => f.text));
      expect(subOf(after, 'roles').fixes.some((f) => !known.has(f.text)), d.file).toBe(true);
      const fix = subOf(after, 'roles').fixes.find((f) => /short on units/.test(f.text));
      if (!fix) continue; // a wide unit band (big control) can still hold the smaller count at 34 cards
      withUnitFix += 1;
      expect(fix.text).toMatch(/\d+ short on units for .*: have \d+, band \d+-\d+ at 34 cards so far\./);
      expect(fix.filter).toEqual({ role: 'unit-body' });
    }
    expect(lowered).toBeGreaterThanOrEqual(4);
    // Bands are scaled to the 34 cards left, so only decks at the low end of their unit band get the unit fix
    // (Irelia 16 -> 10 of 14-17, Kha'Zix 21 -> 15 of 19-22); the others get a different new fix.
    expect(withUnitFix).toBeGreaterThanOrEqual(2);
  });
  it('a rune split with none of a needed domain lowers runes and the fix names the card and the numbers', () => {
    const { db, decks } = scoredFixture();
    let checked = 0;
    for (const d of decks) {
      const legend = db.get(d.legend)!;
      // a card with Power payable by exactly one of the legend's domains
      const needy = d.deck.main.map((e) => db.get(e.id)!).find((c) => (c.power ?? 0) >= 1 && (c.powerDomains.length ? c.powerDomains : c.domains).filter((x) => legend.domains.includes(x)).length === 1);
      if (!needy) continue;
      const domain = (needy.powerDomains.length ? needy.powerDomains : needy.domains).find((x) => legend.domains.includes(x)) as Domain;
      const other = legend.domains.find((x) => x !== domain) as Domain;
      const before = rateDeck(d.deck, ctxOf(db));
      const after = rateDeck({ ...d.deck, runes: { [other]: 12 } }, ctxOf(db));
      expect(subOf(after, 'runes').value, d.file).toBeLessThan(subOf(before, 'runes').value);
      const texts = subOf(after, 'runes').fixes.map((f) => f.text);
      const label = domain[0].toUpperCase() + domain.slice(1);
      expect(texts.some((t) => new RegExp(`\\d+ short on ${label} runes for .+: have 0, need \\d+ \\(its \\d+ Power is paid with the first \\d+ runes in 0% of games now, \\d+% with \\d+; `).test(t)), `${d.file}: ${texts.join(' | ')}`).toBe(true);
      expect(subOf(after, 'runes').fixes.some((f) => f.filter?.domain === domain)).toBe(true);
      // Stage 3 review: cards no rune can pay for are dead; the first rune fix counts them and the rating is scaled.
      const dead = d.deck.main.filter((e) => { const c = db.get(e.id)!; return (c.power ?? 0) >= 1 && !(c.powerDomains.length ? c.powerDomains : c.domains).includes(other); }).reduce((n, e) => n + e.qty, 0);
      const mainCount = d.deck.main.reduce((n, e) => n + e.qty, 0);
      expect(texts[0], d.file).toContain(`${dead} of ${mainCount} main-deck cards can never be paid for from this rune deck: it has 0 ${label} runes for `);
      expect(texts[0]).toContain(`scaled by ${(1 - dead / mainCount).toFixed(2)} (heuristic)`);
      const weighted = after.subscores.reduce((n, s) => n + s.weight * s.value, 0) / 100;
      expect(after.rating).toBe(Math.round(weighted * (1 - dead / mainCount)));
      expect(before.rating - after.rating, d.file).toBeGreaterThanOrEqual(8);
      checked += 1;
    }
    expect(checked).toBeGreaterThanOrEqual(4);
  });
  it('the recommended split rates at least as well as a split two runes away', () => {
    const { db, decks } = scoredFixture();
    for (const d of decks) {
      const rec = runeSplit(d.deck, db);
      const [a, b] = Object.keys(rec) as Domain[];
      if (!b) continue;
      const off = { [a]: (rec[a] ?? 0) - 3, [b]: (rec[b] ?? 0) + 3 };
      const good = subOf(rateDeck({ ...d.deck, runes: rec }, ctxOf(db)), 'runes');
      const bad = subOf(rateDeck({ ...d.deck, runes: off }, ctxOf(db)), 'runes');
      expect(good.value, d.file).toBeGreaterThan(bad.value);
      expect(bad.fixes.some((f) => f.text.startsWith('Rune split'))).toBe(true);
    }
  });
  it('an illegal deck is capped at 40 and lists its violations', () => {
    const { db, decks } = scoredFixture();
    const d = decks[0];
    const off = db.all().find((c) => c.type === 'unit' && !c.noDomain && c.domains.length > 0 && !c.domains.some((x) => db.get(d.legend)!.domains.includes(x)) && !c.dataIncomplete && !c.superTypes.length)!;
    const main = [...d.deck.main];
    const victim = main.findIndex((e) => e.id !== d.deck.champion && e.qty === 3);
    main[victim] = { id: off.id, qty: 3, locked: false };
    const r = rateDeck({ ...d.deck, main }, ctxOf(db));
    expect(r.legal).toBe(false);
    expect(r.rating).toBeLessThanOrEqual(ILLEGAL_CAP);
    expect(r.violations.some((v) => v.code === 'DOMAIN_VIOLATION' && v.cardIds.includes(off.id))).toBe(true);
    expect(Math.round(r.subscores.reduce((n, s) => n + s.weight * s.value, 0) / 100)).toBeGreaterThan(ILLEGAL_CAP);
  });
  it('too many runes is a broken deck (capped); too few runes, or a Chosen Champion not yet in a partial main deck, is an unfinished one', () => {
    const { db, decks } = scoredFixture();
    const d = decks[0];
    const domain = db.get(d.legend)!.domains[0];
    const weighted = (r: DeckRating) => Math.round(r.subscores.reduce((n, s) => n + s.weight * s.value, 0) / 100);
    const over = rateDeck({ ...d.deck, runes: { ...d.deck.runes, [domain]: (d.deck.runes[domain] ?? 0) + 1 } }, ctxOf(db));
    expect(over.violations.some((v) => v.code === 'RUNE_COUNT')).toBe(true);
    expect(weighted(over)).toBeGreaterThan(ILLEGAL_CAP);
    expect(over.rating).toBe(ILLEGAL_CAP);
    const under = rateDeck({ ...d.deck, runes: { ...d.deck.runes, [domain]: (d.deck.runes[domain] ?? 0) - 1 } }, ctxOf(db));
    expect(under.violations.some((v) => v.code === 'RUNE_COUNT')).toBe(true);
    expect(under.rating).toBe(weighted(under));
    let n = 0;
    const part = rateDeck({ ...d.deck, main: d.deck.main.filter((e) => e.id !== d.deck.champion && (n += e.qty) <= 20) }, ctxOf(db));
    expect(part.violations.some((v) => v.code === 'CHAMPION_NOT_IN_MAIN')).toBe(true);
    expect(part.rating).toBe(weighted(part));
    expect(part.rating).toBeGreaterThan(ILLEGAL_CAP);
    // in a full main deck the same violation is a broken deck
    const champ = d.deck.main.find((e) => e.id === d.deck.champion)!;
    const filler = d.deck.main.find((e) => e.id !== d.deck.champion && e.qty < 3) ?? null;
    if (filler) {
      const full = rateDeck({ ...d.deck, main: d.deck.main.filter((e) => e !== champ).map((e) => (e === filler ? { ...e, qty: e.qty + champ.qty } : e)) }, ctxOf(db));
      if (full.violations.some((v) => v.code === 'CHAMPION_NOT_IN_MAIN')) expect(full.rating).toBeLessThanOrEqual(ILLEGAL_CAP);
    }
  });
  it('an unconnected card is an orphan only when it is a payoff whose enablers are missing; the fix names the card, the theme and the count', () => {
    const extra = [card('payoff', { domains: ['fury'] }), card('plain', { domains: ['fury'] }), card('fed', { domains: ['fury'] }), card('feeder', { domains: ['fury'] })];
    const { db, legend } = syntheticDb(40, {
      cards: extra,
      features: [features('payoff', { axes: { discard: { e: 0, p: 1 } } }), features('plain'), features('fed', { axes: { trash: { e: 0, p: 1 } } }), features('feeder', { axes: { trash: { e: 1, p: 0 } } })],
    });
    const main = [...entries(['t0', 't1', 't2', 't3', 't4', 't6', 't7', 't8', 't9']), ...entries(['payoff', 'plain', 'fed', 'feeder'])];
    const r = rateDeck(blankDeck({ legend: legend.id, main: [...main, { id: 't10', qty: 1, locked: false }] }), ctxOf(db));
    const texts = r.subscores.find((s) => s.key === 'synergy')!.fixes.map((f) => f.text).join(' | ');
    expect(texts).toContain('3x Card payoff pays off Discard, but the deck has 0 other copies that set it up');
    expect(texts).not.toContain('Card plain');
    expect(texts).not.toContain('Card fed pays off');
  });
  it('a count one card outside the middle half of public lists is not called a fix; a missing role is listed before a surplus', () => {
    const { db, decks } = scoredFixture();
    for (const d of decks) {
      const r = rateDeck(d.deck, ctxOf(db));
      for (const s of r.subscores) for (const f of s.fixes) if (/^1 (short|over) on /.test(f.text)) {
        // only past the tolerance edge: the band text is "lo-hi" and the count is at least 2 away from the unrounded band
        expect(s.value, `${d.file}: ${f.text}`).toBeLessThan(100);
      }
    }
    const { db: syn, legend, cards } = syntheticDb(60);
    const units = cards.filter((c) => c.type === 'unit' && (c.energy ?? 9) <= 4).slice(0, 14).map((c) => ({ id: c.id, qty: 3, locked: false }));
    const r = rateDeck(blankDeck({ legend: legend.id, main: units.slice(0, 13).concat([{ id: units[13].id, qty: 1, locked: false }]), runes: { fury: 6, mind: 6 } }), ctxOf(syn));
    const roles = subOf(r, 'roles').fixes.map((f) => f.text);
    // A deck with no removal at all is told so first (calibration 2026-11-12), then the band shortfalls.
    expect(roles[0]).toMatch(/^No removal or sweeper/);
    expect(roles[1]).toMatch(/short on (Removal|Card flow) for .+: have 0, band \d+-\d+/);
    expect(roles.findIndex((t) => / over on /.test(t))).not.toBe(0);
  });
  it('a 15-card partial deck returns a rating labelled by its size, not capped for being unfinished, with no NaN', () => {
    const { db, decks } = scoredFixture();
    for (const d of decks) {
      let n = 0;
      const main = d.deck.main.filter((e) => (n += e.qty) <= 15);
      const r = rateDeck({ ...d.deck, main, runes: {}, battlefields: [], side: [] }, ctxOf(db));
      expect(finite(r)).toBe(true);
      expect(r.complete).toBe(false);
      expect(r.legal).toBe(false);
      expect(r.violations.some((v) => v.code === 'MAIN_TOO_SMALL')).toBe(true);
      expect(subOf(r, 'runes').fixes[0].text).toMatch(/No runes yet\. Recommended split/);
      expect(r.subscores.flatMap((s) => s.fixes).every((f) => !/NaN|undefined|Infinity/.test(f.text))).toBe(true);
    }
  });
  it('an empty deck, a deck with no legend, and a deck of unknown ids rate 0-100 without throwing', () => {
    const { db, decks } = scoredFixture();
    const shapes: Deck[] = [
      blankDeck(), blankDeck({ legend: decks[0].legend }), blankDeck({ legend: 'nope', champion: 'nope', main: [{ id: 'missing', qty: 3, locked: false }] }),
      blankDeck({ main: decks[0].deck.main.slice(0, 5) }), blankDeck({ legend: decks[0].legend, main: [{ id: decks[0].deck.main[0].id, qty: Number.NaN, locked: false }], runes: { fury: Number.NaN } }),
      { ...decks[0].deck, format: 'ffa4' }, { ...decks[0].deck, format: '2v2', power: 'casual' }, { ...decks[0].deck, format: 'casual', side: [] },
    ];
    for (const deck of shapes) {
      const r = rateDeck(deck, ctxOf(db));
      expect(finite(r)).toBe(true);
      expect(r.rating).toBeGreaterThanOrEqual(0);
      expect(r.rating).toBeLessThanOrEqual(100);
    }
    expect(rateDeck(blankDeck(), ctxOf(db)).rating).toBe(0);
  });
  it('a top-heavy pile with a wrong rune split rates far below the reference decks and says why', () => {
    const { db, legend, cards } = syntheticDb(60);
    const heavy = cards.filter((c) => c.type !== 'legend' && (c.energy ?? 0) >= 5).slice(0, 14).map((c) => ({ id: c.id, qty: 3, locked: false }));
    const r = rateDeck(blankDeck({ legend: legend.id, main: heavy.slice(0, 13).concat([{ id: heavy[13].id, qty: 1, locked: false }]), runes: { fury: 12 } }), ctxOf(db));
    expect(r.rating).toBeLessThan(45);
    expect(subOf(r, 'curve').value).toBeLessThan(40);
    expect(subOf(r, 'curve').fixes.some((f) => /Average Energy \d\.\d\d is above/.test(f.text))).toBe(true);
    expect(subOf(r, 'curve').fixes.some((f) => /costing 2 or less: one is in hand by turn 2 in 0% of games/.test(f.text))).toBe(true);
  });
  it('a win report from plan Task 7, when passed, replaces the interim win-condition formula', () => {
    const { db, decks } = scoredFixture();
    const r = rateDeck(decks[0].deck, ctxOf(db), { win: { routes: [], hiddenDelivery: false, value: 0.25 } });
    expect(subOf(r, 'wincons').value).toBe(25);
  });
});

describe.skipIf(!hasRealDb())('rateDeck on the synced pool (data/forge.db: play evidence, stored network, meta)', () => {
  it('each reference deck is legal and rates 55-90', async () => {
    const { openDb } = await import('@/server/db');
    const { loadCardDb } = await import('@/server/carddb');
    const db = loadCardDb(openDb());
    for (const file of fixtureDeckFiles()) {
      const parsed = parseDecklist(readFileSync(path.join(process.cwd(), 'tests', 'fixtures', 'decks', file), 'utf8'), db);
      expect(parsed.unresolved, file).toEqual([]);
      const deck: Deck = { ...blankDeck({ format: 'standard-bo3' }), ...parsed.deck };
      expect(isLegal(validateDeck(deck, db)), file).toBe(true);
      const r = rateDeck(deck, ctxOf(db));
      expect(r.rating, file).toBeGreaterThanOrEqual(55);
      expect(r.rating, file).toBeLessThanOrEqual(90);
    }
  });
});
