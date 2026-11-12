// Stage 3 review, evaluation: measured play evidence, the evidence blend, measured co-play edges and the
// play calibration of the mechanical rating. Synthetic lists over real fixture cards.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BLEND, COPLAY, COPLAY_LABEL, COPLAY_SCOPE, bannedFromOf, coPlayOf, coPlayStats, coPlayValue, computePlayEvidence, evaluate,
  evidenceRatingOf, evidenceWeightOf, legalFromOf, legendCanRun, legendLabels, mergeCoPlayEdges, playScoreOf, type PlayList,
} from '@/engine/evidence';
import { computeFeatures } from '@/engine/features';
import {
  CALIBRATION_COEFFICIENTS, CALIBRATION_FIT, CALIBRATION_MAX_SHIFT, CALIBRATION_TERMS, baseCardRatingBreakdown, calibrateFoundation, mineCard,
  toBaseRating100, toScoreCard,
} from '@/engine/mine';
import type { Card, CardEdge, PlayEvidence } from '@/engine/types';
import { fixtureCards, fixtureDb } from '../helpers/fixture-db';

const db = fixtureDb();
const cards = fixtureCards();
const legality = db.legality();
const named = (name: string): Card => { const c = db.byName(name); if (!c) throw new Error(`fixture lacks ${name}`); return c; };
const isMain = (c: Card): boolean => (c.type === 'unit' || c.type === 'spell' || c.type === 'gear') && !c.superTypes.includes('token') && !c.dataIncomplete;
const banned = new Set(legality.bans.map((b) => b.name));
const plain = (c: Card): boolean => isMain(c) && !c.superTypes.includes('signature') && !c.superTypes.includes('champion') && !banned.has(c.name);

const kaisa = named('Daughter of the Void');   // fury + mind
const jinx = named('Loose Cannon');            // fury + chaos
const ahri = named('Nine-Tailed Fox');         // calm + mind
const rain = named('Icathian Rain');           // Kai'Sa signature
const mono = (domain: string, set = 'OGN', skip = 0): Card => {
  const c = cards.filter((x) => plain(x) && x.domains.length === 1 && x.domains[0] === domain && x.sets.length === 1 && x.sets[0] === set)[skip];
  if (!c) throw new Error(`fixture lacks a ${set} ${domain} card`);
  return c;
};
const furyA = mono('fury', 'OGN', 0);
const furyB = mono('fury', 'OGN', 1);
const furyC = mono('fury', 'OGN', 2);
const furyD = mono('fury', 'OGN', 3);
const mind = mono('mind');
const furyRad = mono('fury', 'RAD');

let seq = 0;
const list = (legend: Card, ids: Card[], over: Partial<PlayList> = {}): PlayList => ({
  id: `l${(seq += 1)}`, legend: legend.id, date: '2026-11-01', weight: 1, eraWeight: 1,
  main: Object.fromEntries(ids.map((c) => [c.id, 3])), ...over,
});
const many = (n: number, make: (i: number) => PlayList): PlayList[] => Array.from({ length: n }, (_, i) => make(i));
const evidence = (over: Partial<PlayEvidence>): PlayEvidence => ({
  share: 0, lists: 0, eligibleLists: 100, eligibleLegends: 5, nEff: 100, avgCopies: 0, eraWeight: 1, peak: null, banned: false, ...over,
});

describe('play evidence: eligibility-normalised share', () => {
  it('counts a card only against the lists whose legend can run it', () => {
    expect(legendCanRun(furyA, kaisa)).toBe(true);
    expect(legendCanRun(furyA, ahri)).toBe(false);
    expect(legendCanRun(rain, kaisa)).toBe(true);
    expect(legendCanRun(rain, jinx)).toBe(false); // a signature card needs its champion's legend, whatever the domains
    const lists = [
      ...many(4, () => list(kaisa, [rain, furyA])),
      ...many(4, () => list(jinx, [furyA])),
      ...many(8, () => list(ahri, [mind])),
    ];
    const ev = computePlayEvidence(cards, lists, legality);
    // The signature card is in every list that could run it (4 of 4), not in 4 of 16.
    expect(ev.get(rain.id)).toMatchObject({ share: 1, lists: 4, eligibleLists: 4, eligibleLegends: 1 });
    expect(ev.get(furyA.id)).toMatchObject({ share: 1, lists: 8, eligibleLists: 8, eligibleLegends: 2 });
    // Mind: Kai'Sa (4 lists, none run it) and Ahri (8 lists, all run it).
    expect(ev.get(mind.id)).toMatchObject({ share: 0.6667, lists: 8, eligibleLists: 12 });
    expect(ev.get(furyB.id)).toMatchObject({ share: 0, lists: 0, eligibleLists: 8 });
    expect(ev.get(furyB.id)?.avgCopies).toBe(0);
    expect(ev.get(furyA.id)?.avgCopies).toBe(3);
  });

  it('weights lists, reports the effective sample size and the era weight', () => {
    const lists = [list(kaisa, [furyA], { weight: 3 }), list(kaisa, [], { weight: 1 }), list(kaisa, [], { weight: 1, eraWeight: 0.25 })];
    const e = computePlayEvidence(cards, lists, legality).get(furyA.id) as PlayEvidence;
    expect(e.share).toBeCloseTo(3 / 4.25, 3);
    // Kish: (3 + 1 + 0.25)^2 / (9 + 1 + 0.0625)
    expect(e.nEff).toBeCloseTo((4.25 * 4.25) / 10.0625, 2);
    expect(e.eraWeight).toBeLessThan(1);
    expect(e.eraWeight).toBeGreaterThan(0.9);
  });

  it('a list from before the card was legal is not an opportunity', () => {
    const from = legalFromOf(furyRad, legality) as string;
    expect(from > '2026-10-01').toBe(true);
    const lists = [...many(6, () => list(kaisa, [], { date: '2026-09-25' })), ...many(3, () => list(kaisa, [furyRad], { date: '2026-11-02' }))];
    expect(computePlayEvidence(cards, lists, legality).get(furyRad.id)).toMatchObject({ share: 1, lists: 3, eligibleLists: 3 });
  });

  it('a banned card keeps its pre-ban evidence, flagged, and later lists do not count against it', () => {
    const ban = legality.bans.find((b) => b.zone === 'main' && b.formats.includes('standard-bo3') && db.byName(b.name));
    expect(ban).toBeDefined();
    const card = named(ban!.name);
    expect(bannedFromOf(card, legality)).toBe(ban!.effectiveFrom);
    const legend = cards.find((c) => c.type === 'legend' && legendCanRun(card, c)) as Card;
    const before = new Date(Date.parse(ban!.effectiveFrom) - 5 * 86_400_000).toISOString().slice(0, 10);
    const lists = [
      ...many(4, (i) => list(legend, i < 3 ? [card] : [], { date: before, eraWeight: 0.25 })),
      ...many(10, () => list(legend, [], { date: '2026-11-01' })),
    ];
    const e = computePlayEvidence(cards, lists, legality).get(card.id) as PlayEvidence;
    expect(e).toMatchObject({ banned: true, lists: 3, eligibleLists: 4, share: 0.75 });
    expect(evaluate(60, e).reason).toMatch(/Banned now: these are its lists from before the ban/);
  });

  it('peak: one legend running a card is seen, shrunk when that legend has few lists', () => {
    const lists = [...many(10, () => list(kaisa, [furyA])), ...many(30, () => list(jinx, []))];
    const e = computePlayEvidence(cards, lists, legality).get(furyA.id) as PlayEvidence;
    expect(e.share).toBe(0.25);
    expect(e.peak).toMatchObject({ legend: kaisa.id, lists: 10, of: 10 });
    expect(e.peak!.share).toBeCloseTo(10 / 15, 3); // 10 lists and 5 pseudo-lists at "not played"
    expect(playScoreOf(e)).toBeCloseTo(0.5 * (10 / 15), 3);
    const few = computePlayEvidence(cards, [...many(2, () => list(kaisa, [furyA])), ...many(30, () => list(jinx, []))], legality).get(furyA.id) as PlayEvidence;
    expect(few.peak).toBeNull(); // two lists are not a peak
  });

  it('no list that could run a card = no evidence row', () => {
    const ev = computePlayEvidence(cards, many(5, () => list(ahri, [mind])), legality);
    expect(ev.has(furyA.id)).toBe(false);
    expect(ev.has(kaisa.id)).toBe(false); // main-deck cards only
  });
});

describe('evidence blend', () => {
  it('no play data: the evaluated rating is the mechanical rating, and says so', () => {
    for (const base of [0, 37, 62, 100]) {
      const out = evaluate(base, null);
      expect(out.evaluatedRating).toBe(base);
      expect(out.weight).toBe(0);
      expect(out.evidenceRating).toBeNull();
      expect(out.reason).toMatch(/No play data/);
    }
    expect(evaluate(55, evidence({ eligibleLists: 0, nEff: 0 })).evaluatedRating).toBe(55);
  });

  it('is monotonic in share at a fixed sample', () => {
    for (const base of [35, 60, 85]) {
      let last = -1;
      for (let s = 0; s <= 100; s += 1) {
        const r = evaluate(base, evidence({ share: s / 100, lists: s })).evaluatedRating;
        expect(r, `base ${base} share ${s}`).toBeGreaterThanOrEqual(last);
        last = r;
      }
    }
    expect(evidenceRatingOf({ share: 0, peak: null })).toBe(BLEND.unplayedRating);
    expect(evidenceRatingOf({ share: 1, peak: null })).toBe(BLEND.stapleRating);
    expect(evidenceRatingOf({ share: 0.3, peak: null })).toBeGreaterThan(evidenceRatingOf({ share: 0.1, peak: null }));
  });

  it('shrinks with a small sample: the same share moves the rating less', () => {
    const staple = (nEff: number) => evaluate(50, evidence({ share: 0.8, lists: 8, nEff })).evaluatedRating;
    expect(staple(2)).toBeLessThan(staple(10));
    expect(staple(10)).toBeLessThan(staple(40));
    expect(staple(40)).toBeLessThan(staple(400));
    expect(staple(2) - 50).toBeLessThanOrEqual(4);
    const dud = (nEff: number) => evaluate(70, evidence({ share: 0, lists: 0, nEff })).evaluatedRating;
    expect(dud(2)).toBeGreaterThan(dud(10));
    expect(dud(10)).toBeGreaterThan(dud(400));
    expect(evidenceWeightOf(evidence({ nEff: BLEND.priorLists }))).toBeCloseTo(BLEND.maxWeight / 2, 6);
    expect(evidenceWeightOf(evidence({ nEff: 1e9 }))).toBeLessThanOrEqual(BLEND.maxWeight);
    expect(evidenceWeightOf(null)).toBe(0);
  });

  it('a well-evidenced staple rises, a well-evidenced dud falls, and both numbers are named', () => {
    const up = evaluate(45, evidence({ share: 0.7, lists: 140, eligibleLists: 200, nEff: 150 }));
    expect(up.evaluatedRating).toBeGreaterThan(70);
    expect(up.reason).toMatch(/in 140 of 200 lists/);
    expect(up.reason).toMatch(/raises the mechanical 45 to \d+/);
    expect(up.reason).toMatch(/data, not rules/);
    const down = evaluate(80, evidence({ share: 0, lists: 0, eligibleLists: 200, nEff: 150 }));
    expect(down.evaluatedRating).toBeLessThan(50);
    expect(down.reason).toMatch(/lowers the mechanical 80 to \d+/);
    // The text always counts: two unplayed cards keep their mechanical order.
    expect(evaluate(80, evidence({ nEff: 1e6 })).evaluatedRating).toBeGreaterThan(evaluate(40, evidence({ nEff: 1e6 })).evaluatedRating);
  });

  it('computeFeatures keeps both numbers with reasons; without evidence they are equal', () => {
    const bare = computeFeatures(furyA);
    expect(bare.evaluatedRating).toBe(bare.baseRating);
    expect(bare.evidence).toBeNull();
    expect(bare.ratingReasons[0]).toContain(furyA.name);
    expect(bare.ratingReasons[1]).toMatch(/No play data/);
    const played = computeFeatures(furyA, undefined, undefined, { evidence: evidence({ share: 0.9, lists: 90, nEff: 80, peak: { legend: kaisa.id, share: 0.95, lists: 20, of: 20 } }), peakLegendName: "Kai'Sa" });
    expect(played.baseRating).toBe(bare.baseRating);
    expect(played.evaluatedRating).toBeGreaterThan(bare.baseRating);
    expect(played.evidence?.share).toBe(0.9);
    expect(played.ratingReasons[1]).toMatch(/most in Kai'Sa \(20 of 20 lists\)/);
    // A legend is not a main-deck card: no evidence is attached even when offered.
    const legend = computeFeatures(kaisa, undefined, undefined, { evidence: evidence({ share: 1 }) });
    expect(legend.evaluatedRating).toBe(legend.baseRating);
  });

  it('signature card judged by its own legend only: the evidence pulls harder (calibration 2026-11-12)', () => {
    // Lilting Lullaby as synced: mechanical 78, 1 of 19 of its legend's lists, nEff 9.7. Was 73 with the plain blend.
    const lullaby = evidence({ share: 0.11, lists: 1, eligibleLists: 19, eligibleLegends: 1, nEff: 9.7, peak: { legend: 'x', share: 0.087, lists: 1, of: 19 } });
    expect(evaluate(78, lullaby).evaluatedRating).toBe(73);
    const sig = evaluate(78, lullaby, undefined, { signature: true });
    expect(sig.evaluatedRating).toBeLessThanOrEqual(55);
    expect(sig.reason).toMatch(/Signature card: only its legend can run it/);
    // A signature its legend always runs rises more than with the plain blend.
    const always = evidence({ share: 1, lists: 14, eligibleLists: 14, eligibleLegends: 1, nEff: 12 });
    expect(evaluate(70, always, undefined, { signature: true }).evaluatedRating).toBeGreaterThan(evaluate(70, always).evaluatedRating);
    expect(evaluate(70, always, undefined, { signature: true }).evaluatedRating).toBeGreaterThanOrEqual(82);
    // Not applied to a non-signature card, nor to a signature whose evidence spans several legends.
    expect(evaluate(78, lullaby, undefined, { signature: false }).evaluatedRating).toBe(73);
    expect(evaluate(78, { ...lullaby, eligibleLegends: 2 }, undefined, { signature: true }).evaluatedRating).toBe(73);
    // Monotonic in share, bounded, and the card text still counts (weight below maxWeight).
    let last = -1;
    for (let s = 0; s <= 100; s += 5) {
      const r = evaluate(60, evidence({ share: s / 100, eligibleLegends: 1, nEff: 20 }), undefined, { signature: true }).evaluatedRating;
      expect(r).toBeGreaterThanOrEqual(last);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(100);
      last = r;
    }
    expect(evaluate(60, evidence({ share: 0, eligibleLegends: 1, nEff: 1e6 }), undefined, { signature: true }).evaluatedRating).toBeGreaterThan(30);
    // computeFeatures passes the signature flag from the card.
    const ev = evidence({ share: 0, lists: 0, eligibleLists: 32, eligibleLegends: 1, nEff: 25.9 });
    const f = computeFeatures(rain, undefined, undefined, { evidence: ev });
    expect(f.evaluatedRating).toBeLessThan(evaluate(f.baseRating, ev).evaluatedRating);
  });
});

describe('measured co-play edges', () => {
  it('the rule: lift over chance within a legend, minimum support, shrinkage', () => {
    // 20 lists, each card in 8, together in 8: chance 3.2, lift 2.5.
    expect(coPlayOf([{ n: 20, a: 8, b: 8, t: 8 }])).toMatchObject({ together: 8, chance: 3.2, lift: 2.5 });
    expect(coPlayOf([{ n: 20, a: 8, b: 8, t: 8 }])!.shrunkLift).toBeCloseTo(11 / 6.2, 2);
    // Too few lists together (support).
    expect(coPlayOf([{ n: 20, a: 4, b: 4, t: 4 }])).toBeNull();
    // Two staples: together in 18 of 20, but chance alone predicts 16.2.
    expect(coPlayOf([{ n: 20, a: 18, b: 18, t: 18 }])).toBeNull();
    // Independent cards: no excess.
    expect(coPlayOf([{ n: 20, a: 10, b: 10, t: 5 }])).toBeNull();
    // A legend with too few lists is not counted at all.
    expect(coPlayOf([{ n: COPLAY.minLegendLists - 1, a: 4, b: 4, t: 4 }, { n: 4, a: 4, b: 4, t: 4 }])).toBeNull();
    // Legends add up: 3 of 6 twice is 6 together against a chance of 3.
    expect(coPlayOf([{ n: 6, a: 3, b: 3, t: 3 }])).toBeNull();
    expect(coPlayOf([{ n: 6, a: 3, b: 3, t: 3 }, { n: 6, a: 3, b: 3, t: 3 }])).toMatchObject({ together: 6, chance: 3, lift: 2 });
    // Shrinkage: the same raw lift needs more lists to count for as much.
    expect(coPlayOf([{ n: 12, a: 5, b: 5, t: 5 }])!.shrunkLift).toBeLessThan(coPlayOf([{ n: 48, a: 20, b: 20, t: 20 }])!.shrunkLift);
    expect(coPlayValue(1.4, 5)).toBeLessThan(coPlayValue(1.4, 12));
    expect(coPlayValue(1.4, 12)).toBeLessThan(coPlayValue(2.5, 12));
    expect(coPlayValue(9, 99)).toBeLessThanOrEqual(COPLAY.maxValue);
  });

  const lists = [
    // Kai'Sa: furyA+furyB are a package (8 of 20 lists, always together); furyC and the signature are in every list.
    ...many(8, () => list(kaisa, [rain, furyC, furyA, furyB])),
    ...many(12, () => list(kaisa, [rain, furyC, furyD])),
    // Jinx has too few lists to be counted.
    ...many(3, () => list(jinx, [furyA, furyB])),
  ];
  const stats = coPlayStats(cards, lists, legality);
  const pair = (x: Card, y: Card) => stats.find((s) => (s.a === x.id && s.b === y.id) || (s.a === y.id && s.b === x.id));

  it('finds the package and not the staples', () => {
    expect(pair(furyA, furyB)).toMatchObject({ together: 8, chance: 3.2, lift: 2.5, legends: 1, top: { legend: kaisa.id, n: 20, a: 8, b: 8, t: 8 } });
    expect(pair(rain, furyC)).toBeUndefined();   // both in 20 of 20
    expect(pair(furyA, furyC)).toBeUndefined();  // furyC is in every list: no lift
    expect(pair(furyA, furyD)).toBeUndefined();  // never together
    expect(stats.every((s) => s.a < s.b)).toBe(true);
  });

  it('is stored as a labelled measurement next to mechanical edges, with the numbers in the reason', () => {
    const mechanical: CardEdge = {
      a: furyB.id, b: furyA.id, synergy: 1.5, antisynergy: 0.5, net: 1,
      reasons: [{ id: 'package:x:y', kind: 'synergy', scope: 'mechanic-package', label: 'A rules join', detail: 'text', value: 1.5 }, { id: 'curve-collision:x', kind: 'antisynergy', scope: 'resource-conflict', label: 'Curve', detail: 'text', value: -0.5 }],
    };
    const other: CardEdge = { a: rain.id, b: furyC.id, synergy: 2, antisynergy: 0, net: 2, reasons: [{ id: 'reference:x', kind: 'synergy', scope: 'explicit-reference', label: 'Named', detail: 'text', value: 2 }] };
    const extra = coPlayStats(cards, [...lists, ...many(10, () => list(ahri, [mind, mono('calm')])), ...many(10, () => list(ahri, []))], legality);
    const out = mergeCoPlayEdges([mechanical, other], extra, cards);
    expect(out).toMatchObject({ added: 1, merged: 1 });
    const merged = out.edges.find((e) => e.a === furyB.id && e.b === furyA.id) as CardEdge; // direction of the stored edge kept
    expect(merged.reasons).toHaveLength(3);
    const reason = merged.reasons[2];
    expect(reason).toMatchObject({ kind: 'synergy', scope: COPLAY_SCOPE, label: COPLAY_LABEL });
    expect(reason.detail).toContain(`${furyA.name} and ${furyB.name} are played together in 8 of 20 Kai'Sa lists (8 run ${furyA.name}, 8 run ${furyB.name}), 2.5x the 3.2 that chance predicts.`);
    expect(reason.detail).toMatch(/Measured in public lists; not a rules interaction\.$/);
    expect(reason.value).toBeGreaterThan(0);
    expect(reason.value).toBeLessThanOrEqual(COPLAY.maxValue);
    expect(merged.synergy).toBeCloseTo(1.5 + reason.value, 2);
    expect(merged.net).toBeCloseTo(merged.synergy - 0.5, 2);
    expect(out.edges.find((e) => e.a === rain.id)).toEqual(other); // untouched
    const fresh = out.edges[2];
    expect(mergeCoPlayEdges(out.edges, [], cards).edges).toEqual([mechanical, other]); // and taking it away restores the stored edges
    expect(fresh.reasons).toHaveLength(1);
    expect(fresh.reasons[0].scope).toBe(COPLAY_SCOPE);
    expect(fresh.net).toBe(fresh.reasons[0].value);
    // Merging again replaces the measurement instead of stacking it.
    const again = mergeCoPlayEdges(out.edges, extra, cards);
    expect(again.edges.find((e) => e.a === furyB.id && e.b === furyA.id)?.reasons).toHaveLength(3);
    expect(again.edges.find((e) => e.a === furyB.id && e.b === furyA.id)?.synergy).toBeCloseTo(merged.synergy, 2);
  });

  it('names several legends when the pair is measured in more than one', () => {
    const both = [...lists.filter((l) => l.legend === kaisa.id), ...many(4, () => list(jinx, [furyA, furyB])), ...many(6, () => list(jinx, []))];
    const stat = coPlayStats(cards, both, legality).find((s) => [s.a, s.b].includes(furyA.id) && [s.a, s.b].includes(furyB.id));
    expect(stat).toMatchObject({ together: 12, legends: 2 });
    const reason = mergeCoPlayEdges([], [stat!], cards).edges[0].reasons[0];
    expect(reason.detail).toMatch(/are played together in 12 lists of 2 legends, [\d.]+x the [\d.]+ that chance predicts; most in Kai'Sa: 8 of 20 Kai'Sa lists/);
    expect(legendLabels(cards).get(kaisa.id)).toBe("Kai'Sa");
  });

  it('a card banned today gets no co-play edge', () => {
    const ban = legality.bans.find((b) => b.zone === 'main' && b.formats.includes('standard-bo3') && db.byName(b.name));
    const card = named(ban!.name);
    const legend = cards.find((c) => c.type === 'legend' && legendCanRun(card, c)) as Card;
    const partner = cards.find((c) => plain(c) && legendCanRun(c, legend) && c.sets.includes('OGN')) as Card;
    const old = [...many(8, () => list(legend, [card, partner], { date: '2026-01-15' })), ...many(12, () => list(legend, [], { date: '2026-01-15' }))];
    expect(coPlayStats(cards, old, legality)).toEqual([]);
  });
});

describe('play calibration of the mechanical rating', () => {
  const main = cards.filter(isMain);

  it('the table holds mechanic terms only: every coefficient names a known term, no card id or name', () => {
    const ids = new Set(CALIBRATION_TERMS.map((t) => t.id));
    expect(ids.size).toBe(CALIBRATION_TERMS.length);
    expect(Object.keys(CALIBRATION_COEFFICIENTS).length).toBeGreaterThan(0);
    for (const key of Object.keys(CALIBRATION_COEFFICIENTS)) expect(ids.has(key), key).toBe(true);
    const source = readFileSync(path.join(process.cwd(), 'src', 'engine', 'mine', 'calibration.ts'), 'utf8');
    expect(source).not.toMatch(/\b[a-z]{3}-\d{3}\b/i);
    for (const c of main) if (c.name.length > 9) expect(source.includes(`'${c.name}'`), c.name).toBe(false);
  });

  it('records a fit that improved the holdout, not only the train split', () => {
    expect(CALIBRATION_FIT.spearmanTrain[1]).toBeGreaterThan(CALIBRATION_FIT.spearmanTrain[0]);
    expect(CALIBRATION_FIT.spearmanHoldoutLists[1]).toBeGreaterThan(CALIBRATION_FIT.spearmanHoldoutLists[0] + 0.05);
    expect(CALIBRATION_FIT.spearmanHoldoutListsAndCards[1]).toBeGreaterThan(CALIBRATION_FIT.spearmanHoldoutListsAndCards[0] + 0.05);
  });

  it('moves a rating by the listed terms, within the guard, and leaves the ported rating alone', () => {
    for (const c of main) {
      const score = toScoreCard(c);
      const breakdown = baseCardRatingBreakdown(score);
      const mined = mineCard(c);
      expect(mined.foundation).toBe(breakdown.total);
      const result = mined.calibration!;
      expect(Math.abs(result.shift), c.code).toBeLessThanOrEqual(CALIBRATION_MAX_SHIFT);
      expect(mined.calibratedFoundation).toBe(result.total);
      expect(result.total).toBeGreaterThanOrEqual(1.5);
      expect(result.total).toBeLessThanOrEqual(9.8);
      if (Math.abs(result.shift) < CALIBRATION_MAX_SHIFT && result.total > 1.5 && result.total < 9.8) expect(result.total).toBeCloseTo(breakdown.total + result.shift, 1);
      expect(mined.baseRating).toBe(toBaseRating100(result.total));
    }
  });

  it('with no coefficients nothing moves; legends and battlefields are never calibrated', () => {
    const score = toScoreCard(furyA);
    const input = { card: score, breakdown: baseCardRatingBreakdown(score), traits: new Set<string>(mineCard(furyA).traits) };
    expect(calibrateFoundation(input, {}, 0)).toEqual({ total: input.breakdown.total, shift: 0, terms: [] });
    const legend = mineCard(kaisa);
    expect(legend.calibratedFoundation).toBe(legend.foundation);
    expect(legend.calibration?.terms).toEqual([]);
  });

  it('prices what the fit found: a spell above a unit of the same text rating, less Power penalty', () => {
    const score = toScoreCard(furyA);
    const breakdown = baseCardRatingBreakdown(score);
    const as = (type: string, power: number, powerCost: number) =>
      calibrateFoundation({ card: { ...score, type, power }, breakdown: { ...breakdown, powerCost }, traits: new Set<string>() }).shift;
    if (CALIBRATION_COEFFICIENTS['type:spell']) expect(Math.sign(as('spell', 0, 0) - as('unit', 0, 0))).toBe(Math.sign(CALIBRATION_COEFFICIENTS['type:spell']));
    if (CALIBRATION_COEFFICIENTS['value:powerCost']) expect(as('unit', 2, -1.54) - as('unit', 0, 0)).toBeCloseTo(CALIBRATION_COEFFICIENTS['value:powerCost'] * -1.54, 1);
  });
});
