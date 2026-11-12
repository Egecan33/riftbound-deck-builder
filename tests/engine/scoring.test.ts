// Plan Task 6: the per-card score (spec 10).
import { describe, expect, it } from 'vitest';
import { createScorer, candidateFit, SCORE_WEIGHTS } from '@/engine/scoring';
import { resolveThemeWeights, summarizeDeck } from '@/engine/summary';
import { GUIDELINE_RECONCILIATION, MEASURED_BANDS, archetypeOf, bandScore, targetsFor } from '@/engine/targets';
import { evaluateDeckGuidelines } from '@/engine/scoring/ported';
import type { CardScore, Deck, EngineContext } from '@/engine/types';
import { hasRealDb } from '../helpers/real-db';
import { LEGALITY, blankDeck, card, edge, features, scoredFixture, syntheticDb } from './scoring/forge-db';

const sumParts = (s: CardScore): number => s.parts.reduce((n, p) => n + p.points, 0);
const ctxOf = (db: EngineContext['db']): EngineContext => ({ db, opponentLegend: null });
const entries = (ids: string[], qty = 3): Deck['main'] => ids.map((id) => ({ id, qty, locked: false }));

describe('gates', () => {
  it('a card outside the legend\'s domains scores 0 with the reason', () => {
    const { db, legend } = syntheticDb(30, { cards: [card('off', { domains: ['order'] })], features: [features('off')] });
    const s = createScorer(blankDeck({ legend: legend.id }), ctxOf(db)).score(db.get('off')!);
    expect(s.score).toBe(0);
    expect(s.gate?.code).toBe('DOMAIN_VIOLATION');
    expect(s.reasons[0]).toContain('Tester');
  });
  it('a ban gates only in the formats it names', () => {
    const legality = { ...LEGALITY, bans: [
      { name: 'Card t1', zone: 'main' as const, formats: ['standard-bo1' as const, 'standard-bo3' as const], effectiveFrom: '2026-09-18', sourceUrl: '' },
      { name: 'Card t2', zone: 'main' as const, formats: ['2v2' as const], effectiveFrom: '2026-09-18', sourceUrl: '' },
    ] };
    const { db, legend } = syntheticDb(30, { legality });
    const score = (id: string, format: Deck['format']) => createScorer(blankDeck({ legend: legend.id, format }), ctxOf(db)).score(db.get(id)!);
    expect(score('t1', 'standard-bo1').gate).not.toBeNull();
    expect(score('t1', '2v2').gate).toBeNull();
    expect(score('t2', '2v2').gate).not.toBeNull();
    expect(score('t2', 'standard-bo1').gate).toBeNull();
    expect(score('t2', 'standard-bo3').score).toBeGreaterThan(0);
  });
  it('the real 2v2-only ban gates only in 2v2 (synced legality)', () => {
    const { db } = scoredFixture();
    const only2v2 = db.legality().bans.filter((b) => b.formats.includes('2v2') && !b.formats.includes('standard-bo1'));
    expect(only2v2.length).toBeGreaterThan(0);
    const banned = db.byName(only2v2[0].name)!;
    expect(banned).toBeDefined();
    const zone = banned.type === 'legend' ? 'legend' : banned.type === 'battlefield' ? 'battlefields' : 'main';
    const legend = banned.type === 'legend' ? banned.id : null;
    expect(createScorer(blankDeck({ legend, format: '2v2' }), ctxOf(db)).score(banned, zone).gate).not.toBeNull();
    expect(createScorer(blankDeck({ legend, format: 'standard-bo1' }), ctxOf(db)).score(banned, zone).gate).toBeNull();
  });
  it('a fourth signature card, a signature of another champion, a fourth copy and an incomplete row are gated', () => {
    const sig = (id: string, tag = 'Tester') => card(id, { superTypes: ['signature'], championTag: tag, type: 'spell', might: null });
    const { db, legend } = syntheticDb(30, {
      cards: [sig('s1'), sig('s2'), sig('s3'), sig('s4'), sig('other', 'Someone'), card('broken', { dataIncomplete: true })],
      features: ['s1', 's2', 's3', 's4', 'other', 'broken'].map((id) => features(id, { roles: ['removal'] })),
    });
    const three = blankDeck({ legend: legend.id, main: entries(['s1', 's2', 's3'], 1) });
    expect(createScorer(three, ctxOf(db)).score(db.get('s4')!).gate?.code).toBe('SIGNATURE_TOTAL_EXCEEDED');
    expect(createScorer(blankDeck({ legend: legend.id, main: entries(['s1', 's2'], 1) }), ctxOf(db)).score(db.get('s4')!).gate).toBeNull();
    expect(createScorer(three, ctxOf(db)).score(db.get('other')!).gate?.code).toBe('SIGNATURE_WRONG_CHAMPION');
    expect(createScorer(three, ctxOf(db)).score(db.get('broken')!).gate?.code).toBe('DATA_STALE');
    const full = blankDeck({ legend: legend.id, main: entries(['t0'], 2), side: entries(['t0'], 1) });
    expect(createScorer(full, ctxOf(db)).score(db.get('t0')!, 'side').gate?.code).toBe('COPY_LIMIT_EXCEEDED');
    // in the main deck the same card is scored leave-one-out: 2 of 3 held, so it is not gated
    expect(createScorer(full, ctxOf(db)).score(db.get('t0')!).gate).toBeNull();
    expect(createScorer(three, ctxOf(db)).score(legend, 'main').gate).not.toBeNull(); // wrong zone
  });
});

describe('parts', () => {
  const twins = () => syntheticDb(30, {
    cards: [card('linked'), card('alone')],
    features: [features('linked'), features('alone')],
    edges: [edge('linked', 't0'), edge('linked', 't1'), edge('linked', 't3'), edge('linked', 't4')],
  });
  it('a card with strong edges into the deck outscores an equal card with none by 10 or more, and names its partners', () => {
    const { db, legend } = twins();
    const scorer = createScorer(blankDeck({ legend: legend.id, main: entries(['t0', 't1', 't3', 't4', 't6', 't7']) }), ctxOf(db));
    const linked = scorer.score(db.get('linked')!);
    const alone = scorer.score(db.get('alone')!);
    expect(linked.score - alone.score).toBeGreaterThanOrEqual(10);
    expect(linked.partners.map((p) => p.id).sort()).toEqual(['t0', 't1', 't3', 't4']);
    expect(linked.partners.every((p) => p.net > 0 && p.reason.length > 0)).toBe(true);
    expect(linked.reasons.find((r) => r.startsWith('Synergy'))).toContain('Card t0');
    expect(alone.partners).toEqual([]);
  });
  it('an antisynergy edge lowers the score and is named', () => {
    const { db, legend } = syntheticDb(30, { cards: [card('clash'), card('calm')], features: [features('clash'), features('calm')], edges: [edge('clash', 't0', 2.5, 'antisynergy'), edge('clash', 't1'), edge('calm', 't1')] });
    const scorer = createScorer(blankDeck({ legend: legend.id, main: entries(['t0', 't1']) }), ctxOf(db));
    const clash = scorer.score(db.get('clash')!);
    expect(clash.score).toBeLessThan(scorer.score(db.get('calm')!).score);
    expect(clash.partners.some((p) => p.id === 't0' && p.net < 0)).toBe(true);
    expect(clash.reasons.find((r) => r.startsWith('Synergy'))).toContain('clashes with Card t0');
  });
  it('role need falls as the role fills (removal)', () => {
    const removal = Array.from({ length: 8 }, (_, i) => card(`r${i}`, { type: 'spell', might: null, energy: 3 }));
    const { db, legend } = syntheticDb(30, { cards: [...removal, card('probe', { type: 'spell', might: null, energy: 3 })], features: [...removal.map((c) => features(c.id, { roles: ['removal'], costBucket: 3 })), features('probe', { roles: ['removal'], costBucket: 3 })] });
    const units = entries(['t0', 't1', 't3', 't4', 't6', 't7', 't9']);
    let last = Infinity;
    const seen: number[] = [];
    for (let k = 0; k <= 8; k += 1) {
      const deck = blankDeck({ legend: legend.id, main: [...units, ...entries(removal.slice(0, k).map((c) => c.id))] });
      const part = createScorer(deck, ctxOf(db)).score(db.get('probe')!).parts.find((p) => p.key === 'role')!;
      expect(part.points).toBeLessThanOrEqual(last);
      last = part.points;
      seen.push(part.points);
    }
    expect(seen[0]).toBeGreaterThan(seen[8]);
    expect(seen[8]).toBe(0); // 24 removal cards are over every archetype's band
  });
  it('an in-deck card is scored leave-one-out: same score as a candidate for the deck without that copy', () => {
    const { db, legend } = twins();
    const deck = blankDeck({ legend: legend.id });
    const single = { ...deck, main: [...entries(['t0', 't1', 't3', 't4']), { id: 'linked', qty: 1, locked: false }] };
    const inDeck = createScorer(single, ctxOf(db)).score(db.get('linked')!);
    expect(inDeck).toEqual(createScorer({ ...deck, main: entries(['t0', 't1', 't3', 't4']) }, ctxOf(db)).score(db.get('linked')!));
    expect(inDeck.gate).toBeNull();
    // with two copies, the score is that of the second copy: the deck keeps one
    const two = { ...deck, main: [...entries(['t0', 't1', 't3', 't4']), { id: 'linked', qty: 2, locked: false }] };
    const second = createScorer(two, ctxOf(db)).score(db.get('linked')!);
    expect(second.reasons.find((r) => r.startsWith('Role need'))).toContain('(13,');
  });
  it('parts sum to the score within 1, every part is within its maximum, the maxima sum to 100 and each part has a reason', () => {
    const { db, decks } = scoredFixture();
    for (const d of decks) {
      const scorer = createScorer(d.deck, ctxOf(db));
      const all = scorer.scoreAll();
      expect(all.length).toBeGreaterThan(300);
      for (const s of all) {
        expect(s.reasons.length).toBeGreaterThanOrEqual(1);
        if (s.gate) { expect(s.score).toBe(0); continue; }
        expect(Math.abs(sumParts(s) - s.score)).toBeLessThanOrEqual(1);
        expect(s.parts.reduce((n, p) => n + p.max, 0)).toBeCloseTo(100, 5);
        for (const p of s.parts) { expect(p.points).toBeGreaterThanOrEqual(0); expect(p.points).toBeLessThanOrEqual(p.max + 1e-9); }
        expect(s.reasons.length).toBe(6);
        expect(Number.isInteger(s.score)).toBe(true);
      }
      for (let i = 1; i < all.length; i += 1) expect(all[i - 1].score).toBeGreaterThanOrEqual(all[i].score);
    }
  });
  it('the reasons say which data is which: Quality is the evaluated rating, Meta is per-legend inclusion', () => {
    const { db, decks } = scoredFixture();
    const d = decks.find((x) => db.legendMeta(x.legend)?.decks)!;
    const meta = db.legendMeta(d.legend)!;
    const [id] = Object.entries(meta.main).sort((a, b) => b[1].share - a[1].share)[0];
    const s = createScorer(blankDeck({ legend: d.legend, format: 'standard-bo3' }), ctxOf(db)).score(db.get(id)!);
    expect(s.reasons.find((r) => r.startsWith('Quality'))).toMatch(/evaluated rating \d+ = mechanical text rating \d+/);
    expect(s.reasons.find((r) => r.startsWith('Meta'))).toMatch(/per-legend inclusion data - \d+ of \d+ .* lists run it/);
    expect(s.parts.find((p) => p.key === 'meta')!.points).toBeGreaterThan(0);
  });
  it('with no lists of the legend the Meta weight moves to Quality and Synergy', () => {
    const { db, legend } = syntheticDb(30);
    const s = createScorer(blankDeck({ legend: legend.id }), ctxOf(db)).score(db.get('t0')!);
    const max = Object.fromEntries(s.parts.map((p) => [p.key, p.max]));
    expect(max.meta).toBe(0);
    expect(max.quality).toBe(SCORE_WEIGHTS.quality + 5);
    expect(max.synergy).toBe(SCORE_WEIGHTS.synergy + 5);
    expect(s.reasons.find((r) => r.startsWith('Meta'))).toContain('no public lists');
  });
  it('a Power cost the runes cannot pay lowers the curve part and the reason gives the odds', () => {
    const { db, legend } = syntheticDb(30, { cards: [card('pips', { power: 2, powerDomains: ['mind'], domains: ['mind'] })], features: [features('pips')] });
    const part = (runes: Deck['runes']) => createScorer(blankDeck({ legend: legend.id, runes }), ctxOf(db)).score(db.get('pips')!);
    const none = part({ fury: 12 });
    const many = part({ fury: 4, mind: 8 });
    expect(none.parts.find((p) => p.key === 'curve')!.points).toBeLessThan(many.parts.find((p) => p.key === 'curve')!.points);
    expect(none.reasons.find((r) => r.startsWith('Curve'))).toContain('2 Mind Power is paid on time in 0% of games with 0 of 12 runes');
  });
});

describe('partial decks and speed', () => {
  it('an empty deck with a legend, a deck with no legend, unknown ids and bad quantities all score without throwing', () => {
    const { db, decks } = scoredFixture();
    const legend = decks[0].legend;
    const shapes: Deck[] = [
      blankDeck({ legend }), blankDeck(), blankDeck({ legend: 'nope', champion: 'nope' }),
      blankDeck({ legend, main: [{ id: 'missing', qty: 3, locked: false }, { id: decks[0].deck.main[0].id, qty: Number.NaN, locked: false }, { id: decks[0].deck.main[1].id, qty: -2, locked: true }] }),
      blankDeck({ legend, main: decks[0].deck.main.slice(0, 3), runes: { fury: Number.NaN } }),
      { ...decks[0].deck, main: [...decks[0].deck.main, ...decks[0].deck.main.slice(0, 2)] },
    ];
    for (const deck of shapes) {
      const scorer = createScorer(deck, ctxOf(db));
      const all = scorer.scoreAll();
      for (const s of all) { expect(Number.isFinite(s.score)).toBe(true); expect(s.score).toBeGreaterThanOrEqual(0); expect(s.score).toBeLessThanOrEqual(100); }
      expect(() => summarizeDeck(deck, db)).not.toThrow();
      expect(Object.values(resolveThemeWeights(deck, db)).every((w) => w >= 0 && w <= 1)).toBe(true);
      const t = targetsFor(deck, db);
      expect(t.curve).toHaveLength(8);
      expect(Number.isFinite(t.avgEnergy.lo)).toBe(true);
    }
    const empty = createScorer(blankDeck({ legend }), ctxOf(db)).scoreAll().filter((s) => !s.gate);
    expect(empty.length).toBeGreaterThan(50);
    expect(empty[0].score).toBeGreaterThan(empty[empty.length - 1].score);
  });
  it('battlefields are scored from the legend\'s lists and text fit; legends and runes are not scored', () => {
    const { db, decks } = scoredFixture();
    const d = decks[0];
    const scorer = createScorer(d.deck, ctxOf(db));
    const bf = scorer.score(db.get(d.deck.battlefields[0])!, 'battlefields');
    expect(bf.gate).toBeNull();
    expect(bf.reasons.length).toBe(2);
    expect(Math.abs(sumParts(bf) - bf.score)).toBeLessThanOrEqual(1);
    expect(scorer.score(db.get(d.legend)!, 'legend').score).toBe(0);
  });
  it('scoreAll over a 1,200-card pool takes under 400 ms', () => {
    const edges = Array.from({ length: 4000 }, (_, i) => edge(`t${i % 1200}`, `t${(i * 7 + 3) % 1200}`));
    const { db, legend } = syntheticDb(1200, { edges });
    const deck = blankDeck({ legend: legend.id, main: entries(Array.from({ length: 13 }, (_, i) => `t${i * 6}`)), runes: { fury: 6, mind: 6 } });
    createScorer(deck, ctxOf(db)).scoreAll(); // warm-up (JIT)
    const started = performance.now();
    const all = createScorer(deck, ctxOf(db)).scoreAll();
    const elapsed = performance.now() - started;
    expect(all).toHaveLength(1200);
    expect(elapsed).toBeLessThan(400);
  });
});

describe('targets', () => {
  it('bandScore: 1 inside, 0.5 at the tolerance bound, 0 one band-width beyond', () => {
    const band = { lo: 10, hi: 14, tolLo: 8, tolHi: 16, median: 12 };
    expect(bandScore(12, band)).toBe(1);
    expect(bandScore(10, band)).toBe(1);
    expect(bandScore(9, band)).toBeCloseTo(0.75);
    expect(bandScore(8, band)).toBeCloseTo(0.5);
    expect(bandScore(6, band)).toBeCloseTo(0.25);
    expect(bandScore(4, band)).toBe(0);
    expect(bandScore(20, band)).toBe(0);
    expect(bandScore(Number.NaN, band)).toBe(0);
  });
  it('every measured band is ordered and every archetype has every metric', () => {
    const keys = Object.keys(MEASURED_BANDS.any.m);
    for (const a of Object.values(MEASURED_BANDS)) {
      expect(Object.keys(a.m)).toEqual(keys);
      for (const q of Object.values(a.m)) for (let i = 1; i < 5; i += 1) expect(q[i]).toBeGreaterThanOrEqual(q[i - 1]);
    }
  });
  it('the reference decks classify as the archetype their lists show, and a partial deck leans on the legend\'s typical list', () => {
    const { db, decks } = scoredFixture();
    const byFile = Object.fromEntries(decks.map((d) => [d.file, archetypeOf(d.deck, db).id]));
    expect(byFile['kaisa-daughter-of-the-void.txt']).toBe('big-control');
    expect(byFile['khazix-voidreaver.txt']).toBe('unit-aggro');
    const kaisa = decks.find((d) => d.file.startsWith('kaisa'))!;
    const few = { ...kaisa.deck, main: kaisa.deck.main.slice(0, 2) };
    const lists = db.legendMeta(kaisa.legend)?.decks ?? 0;
    const partial = archetypeOf(few, db);
    if (lists >= 5) { expect(partial.id).toBe('big-control'); expect(partial.reason).toContain('public lists'); }
    else expect(partial.id).toBe('any');
    expect(archetypeOf(blankDeck(), db).id).toBe('any');
  });
  it('an incomplete deck gets bands scaled to its size; power target widens tolerance; FFA shifts bands (heuristic, said so)', () => {
    const { db, decks } = scoredFixture();
    const d = decks[0].deck;
    const full = targetsFor(d, db);
    const half = targetsFor({ ...d, main: d.main.slice(0, Math.ceil(d.main.length / 2)) }, db);
    expect(half.scale).toBeLessThan(1);
    expect(half.notes.some((n) => n.includes('so far'))).toBe(true);
    expect(full.scale).toBe(1);
    const casual = targetsFor({ ...d, power: 'casual' }, db);
    expect(casual.full.unit.tolLo).toBeLessThan(full.full.unit.tolLo);
    const ffa = targetsFor({ ...d, format: 'ffa4' }, db);
    expect(ffa.full['role:protection'].hi).toBe(full.full['role:protection'].hi + 2);
    expect(ffa.notes.some((n) => n.startsWith('Heuristic'))).toBe(true);
  });
  it('the ported community guidelines are advisory and each has a reconciliation with the measured bands', () => {
    const ids = evaluateDeckGuidelines([]).map((g) => g.id).sort();
    expect(GUIDELINE_RECONCILIATION.map((g) => g.id).sort()).toEqual(ids);
    expect(GUIDELINE_RECONCILIATION.find((g) => g.id === 'playset-consistency')!.verdict).toBe('contradicted');
  });
});

describe('ported candidate fit on a Forge deck', () => {
  it('returns before/after deck scores and names the card; a legend is not a candidate', () => {
    const { db, decks } = scoredFixture();
    const d = decks[0];
    const main = d.deck.main.slice(0, 6);
    const candidate = db.get(d.deck.main[7].id)!;
    const fit = candidateFit({ ...d.deck, main }, ctxOf(db), candidate)!;
    expect(fit.card.id).toBe(candidate.id);
    expect(Number.isFinite(fit.totalDelta)).toBe(true);
    expect(fit.after.cardBreakdown.some((c) => c.cardId === candidate.id)).toBe(true);
    expect(candidateFit(d.deck, ctxOf(db), db.get(d.legend)!)).toBeNull();
  });
});

describe.skipIf(!hasRealDb())('synced pool (data/forge.db)', () => {
  it('for an empty deck, most of a legend\'s core cards are in its top 40', async () => {
    const { openDb } = await import('@/server/db');
    const { loadCardDb } = await import('@/server/carddb');
    const db = loadCardDb(openDb());
    for (const name of ['Daughter of the Void', 'Voidreaver']) {
      const legend = db.byName(name)!;
      const meta = db.legendMeta(legend.id);
      if (!meta || meta.quality !== 'ok') continue;
      const top = createScorer(blankDeck({ legend: legend.id, format: 'standard-bo3' }), ctxOf(db)).scoreAll().filter((s) => !s.gate).slice(0, 40).map((s) => s.id);
      const core = Object.entries(meta.main).filter(([, s]) => s.share >= 0.5).map(([id]) => id);
      expect(core.filter((id) => top.includes(id)).length / core.length).toBeGreaterThanOrEqual(0.6);
    }
  });
});
