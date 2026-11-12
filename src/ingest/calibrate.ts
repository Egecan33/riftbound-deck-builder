// `pnpm calibrate [--write | --report | --diagnose]`: fits the calibration table of src/engine/mine/calibration.ts on the TRAIN
// split of the synced lists and prints the check on the HOLDOUT split. `--write` pastes the fitted table
// between the markers of calibration.ts. No network; reads data/forge.db.
//
// Splits (deterministic hashes, nothing tuned to them):
//   lists: by the champion tag of the list's legend, so a champion's units and signature cards never sit on
//          both sides. About 70% of tags are TRAIN.
//   cards: by card id, about 70% TRAIN. The strict holdout number uses holdout cards AND holdout lists.
// Target: the evidence rating of blend.ts on the foundation scale, weighted by the evidence weight.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  BLEND, COPLAY, COPLAY_SCOPE, coPlayStats, computePlayEvidence, evaluate, evidenceRatingOf, evidenceWeightOf, isMainDeckCard, type PlayList,
} from '@/engine/evidence';
import {
  BASE_RATING_SCALE, CALIBRATION_TERMS, baseCardRatingBreakdown, calibrateFoundation, mineCard, mineOverridesById, toBaseRating100, toScoreCard,
  type CalibrationInput, type MineOverrideEntry,
} from '@/engine/mine';
import { championTagOf } from '@/engine/rules/champion';
import type { Card, LegalityData, PlayEvidence } from '@/engine/types';
import { loadCards, loadLegality } from '@/server/carddb';
import { openDb } from '@/server/db';
import { readOverridesFile } from '@/server/syncdata';
import { loadPlayLists } from './evidence';

export const hash = (text: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
};
/** TRAIN when the hash falls in the first 70 of 100 buckets. */
export const inTrain = (key: string): boolean => hash(key) % 100 < 70;

export function ranks(xs: readonly number[]): number[] {
  const idx = xs.map((x, i) => [x, i] as const).sort((a, b) => a[0] - b[0]);
  const out = new Array<number>(xs.length).fill(0);
  for (let i = 0; i < idx.length;) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j += 1;
    for (let k = i; k <= j; k += 1) out[idx[k][1]] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return out;
}
export function pearson(a: readonly number[], b: readonly number[]): number {
  const n = a.length;
  if (n < 3) return NaN;
  const ma = a.reduce((s, x) => s + x, 0) / n, mb = b.reduce((s, x) => s + x, 0) / n;
  let sab = 0, saa = 0, sbb = 0;
  for (let i = 0; i < n; i += 1) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; }
  return saa > 0 && sbb > 0 ? sab / Math.sqrt(saa * sbb) : NaN;
}
export const spearman = (a: readonly number[], b: readonly number[]): number => pearson(ranks(a), ranks(b));

/** Solves (A) x = b for a symmetric positive definite A (Gaussian elimination with pivoting). */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c += 1) {
    let p = c;
    for (let r = c + 1; r < n; r += 1) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c] || 1e-12;
    for (let r = 0; r < n; r += 1) {
      if (r === c) continue;
      const f = M[r][c] / d;
      if (f === 0) continue;
      for (let k = c; k <= n; k += 1) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / (row[i] || 1e-12));
}

export interface Row { card: Card; input: CalibrationInput; foundation: number; x: number[] }

/** Weighted ridge on standardised columns. Returns coefficients on the raw scale and the intercept. */
export function ridge(X: number[][], y: number[], w: number[], lambda: number): { coef: number[]; intercept: number } {
  const p = X[0]?.length ?? 0;
  const sw = w.reduce((s, v) => s + v, 0);
  const mean = Array.from({ length: p }, (_, j) => X.reduce((s, r, i) => s + w[i] * r[j], 0) / sw);
  const sd = Array.from({ length: p }, (_, j) => Math.sqrt(X.reduce((s, r, i) => s + w[i] * (r[j] - mean[j]) ** 2, 0) / sw) || 1);
  const my = y.reduce((s, v, i) => s + w[i] * v, 0) / sw;
  const A = Array.from({ length: p }, () => new Array<number>(p).fill(0));
  const b = new Array<number>(p).fill(0);
  for (let i = 0; i < X.length; i += 1) {
    const z = X[i].map((v, j) => (v - mean[j]) / sd[j]);
    for (let j = 0; j < p; j += 1) {
      b[j] += w[i] * z[j] * (y[i] - my);
      for (let k = j; k < p; k += 1) A[j][k] += w[i] * z[j] * z[k];
    }
  }
  for (let j = 0; j < p; j += 1) { for (let k = 0; k < j; k += 1) A[j][k] = A[k][j]; A[j][j] += lambda * sw; }
  const beta = solve(A, b);
  const coef = beta.map((v, j) => v / sd[j]);
  return { coef, intercept: my - coef.reduce((s, c, j) => s + c * mean[j], 0) };
}

const targetOf = (e: PlayEvidence): number => evidenceRatingOf(e) / BASE_RATING_SCALE;
const weightOf = (e: PlayEvidence): number => evidenceWeightOf(e) / BLEND.maxWeight;

export interface CalibrationData {
  cards: Card[]; rows: Row[]; lists: PlayList[]; legality: LegalityData;
  trainLists: PlayList[]; holdLists: PlayList[];
  evAll: Map<string, PlayEvidence>; evTrain: Map<string, PlayEvidence>; evHold: Map<string, PlayEvidence>;
}

export function loadCalibrationData(): CalibrationData {
  const db = openDb();
  try {
    const cards = loadCards(db);
    const legality = loadLegality(db);
    const lists = loadPlayLists(db, legality);
    const byId = new Map(cards.map((c) => [c.id, c]));
    const tagOf = (l: PlayList): string => { const legend = byId.get(l.legend); return (legend && championTagOf(legend)) ?? l.legend; };
    const trainLists = lists.filter((l) => inTrain(`legend:${tagOf(l)}`));
    const holdLists = lists.filter((l) => !inTrain(`legend:${tagOf(l)}`));
    const overrides = mineOverridesById((readOverridesFile() as unknown as { mine?: MineOverrideEntry[] }).mine, cards);
    const rows: Row[] = [];
    for (const card of cards) {
      if (!isMainDeckCard(card) || card.dataIncomplete || card.type === null) continue;
      const score = toScoreCard(card);
      const breakdown = baseCardRatingBreakdown(score);
      const input: CalibrationInput = { card: score, breakdown, traits: new Set<string>(mineCard(card, overrides[card.id]).traits) };
      rows.push({ card, input, foundation: breakdown.total, x: CALIBRATION_TERMS.map((t) => t.value(input)) });
    }
    return {
      cards, rows, lists, legality, trainLists, holdLists,
      evAll: computePlayEvidence(cards, lists, legality),
      evTrain: computePlayEvidence(cards, trainLists, legality),
      evHold: computePlayEvidence(cards, holdLists, legality),
    };
  } finally {
    db.close();
  }
}

/** Spearman of a rating with the measured share over the rows that have (non-banned) evidence. */
export function spearmanWithShare(rows: readonly Row[], ev: ReadonlyMap<string, PlayEvidence>, rating: (r: Row) => number, minNEff = 0): { rho: number; n: number } {
  const used = rows.filter((r) => { const e = ev.get(r.card.id); return e && !e.banned && e.nEff >= minNEff; });
  return { rho: spearman(used.map(rating), used.map((r) => (ev.get(r.card.id) as PlayEvidence).share)), n: used.length };
}

export interface Fit { coefficients: Record<string, number>; intercept: number; lambda: number; trainCards: number }

/** Minimum |coefficient| x column spread for a term to stay in the table (foundation points). */
const KEEP = 0.05;
const CV_SLACK = 0.01;

export function fit(data: CalibrationData, log: (line: string) => void = () => {}): Fit {
  const train = data.rows.filter((r) => inTrain(`card:${r.card.id}`) && data.evTrain.has(r.card.id) && !(data.evTrain.get(r.card.id) as PlayEvidence).banned);
  const y = train.map((r) => targetOf(data.evTrain.get(r.card.id) as PlayEvidence) - r.foundation);
  const w = train.map((r) => weightOf(data.evTrain.get(r.card.id) as PlayEvidence));
  const share = train.map((r) => (data.evTrain.get(r.card.id) as PlayEvidence).share);

  const cv = (cols: number[], lambda: number): number => {
    // 5-fold cross-validation inside TRAIN: Spearman of the calibrated rating with the share.
    const pred = new Array<number>(train.length).fill(0);
    for (let fold = 0; fold < 5; fold += 1) {
      const inFold = (r: Row) => hash(`fold:${r.card.id}`) % 5 === fold;
      const idx = train.map((r, i) => (inFold(r) ? -1 : i)).filter((i) => i >= 0);
      const model = ridge(idx.map((i) => cols.map((c) => train[i].x[c])), idx.map((i) => y[i]), idx.map((i) => w[i]), lambda);
      train.forEach((r, i) => { if (inFold(r)) pred[i] = r.foundation + model.intercept + cols.reduce((s, c, j) => s + model.coef[j] * r.x[c], 0); });
    }
    return spearman(pred, share);
  };

  const all = CALIBRATION_TERMS.map((_, i) => i).filter((c) => train.some((r) => r.x[c] !== train[0].x[c]));
  const lambdas = [0.03, 0.1, 0.3, 1, 3];
  const scores = lambdas.map((l) => { const s = cv(all, l); log(`cv lambda ${l}: spearman ${s.toFixed(3)} (all ${all.length} terms)`); return s; });
  // The strongest penalty within CV_SLACK of the best cross-validated score (the usual "one standard error"
  // habit, with a fixed slack): with noisy shares a smaller table that scores the same is the safer one.
  const best = Math.max(...scores);
  const lambda = lambdas[scores.reduce((at, s, i) => (s >= best - CV_SLACK ? i : at), 0)];

  // Keep the terms that move a rating: |coef| x spread >= KEEP. Then refit on the kept terms.
  const first = ridge(train.map((r) => all.map((c) => r.x[c])), y, w, lambda);
  const spread = (c: number): number => { const xs = train.map((r) => r.x[c]); const m = xs.reduce((s, v) => s + v, 0) / xs.length; return Math.sqrt(xs.reduce((s, v) => s + (v - m) ** 2, 0) / xs.length); };
  const kept = all.filter((c, j) => Math.abs(first.coef[j]) * spread(c) >= KEEP);
  log(`kept ${kept.length} of ${all.length} terms; cv spearman with kept terms ${cv(kept, lambda).toFixed(3)}`);
  const model = ridge(train.map((r) => kept.map((c) => r.x[c])), y, w, lambda);
  const coefficients: Record<string, number> = {};
  kept.forEach((c, j) => { coefficients[CALIBRATION_TERMS[c].id] = Math.round(model.coef[j] * 1000) / 1000; });
  // Intercept: the pool keeps its level. Chosen so the mean shift over the TRAIN cards is zero.
  const meanShift = train.reduce((s, r) => s + kept.reduce((t, c) => t + (coefficients[CALIBRATION_TERMS[c].id] ?? 0) * r.x[c], 0), 0) / train.length;
  return { coefficients, intercept: Math.round(-meanShift * 1000) / 1000, lambda, trainCards: train.length };
}

export interface SplitScores { train: number; trainN: number; holdoutLists: number; holdoutListsN: number; holdoutStrict: number; holdoutStrictN: number; all: number; allN: number }

export function scoreSplits(data: CalibrationData, rating: (r: Row) => number): SplitScores {
  const trainCards = data.rows.filter((r) => inTrain(`card:${r.card.id}`));
  const holdCards = data.rows.filter((r) => !inTrain(`card:${r.card.id}`));
  const a = spearmanWithShare(trainCards, data.evTrain, rating);
  const b = spearmanWithShare(data.rows, data.evHold, rating);
  const c = spearmanWithShare(holdCards, data.evHold, rating);
  const d = spearmanWithShare(data.rows, data.evAll, rating);
  return { train: a.rho, trainN: a.n, holdoutLists: b.rho, holdoutListsN: b.n, holdoutStrict: c.rho, holdoutStrictN: c.n, all: d.rho, allN: d.n };
}

const fmt = (s: SplitScores): string =>
  `train ${s.train.toFixed(3)} (${s.trainN} cards) | holdout lists ${s.holdoutLists.toFixed(3)} (${s.holdoutListsN}) | holdout lists+cards ${s.holdoutStrict.toFixed(3)} (${s.holdoutStrictN}) | all ${s.all.toFixed(3)} (${s.allN})`;

/** The mechanical rating (0..100) of a row with the table in calibration.ts. */
const mechanical100 = (r: Row): number => toBaseRating100(calibrateFoundation(r.input).total);

/**
 * `--report`: the before/after numbers of the evaluation work, from the table that is in the file.
 * "Evaluated, out of sample" blends the mechanical rating with the evidence of the TRAIN lists only and is
 * compared with the share in the HOLDOUT lists; the same comparison with all lists on both sides would be
 * circular (the rating would contain the number it is compared with) and is printed only for completeness.
 */
function report(data: CalibrationData, log: (line: string) => void): void {
  const ported = (r: Row): number => r.foundation;
  const calibrated = (r: Row): number => calibrateFoundation(r.input).total;
  const evaluatedWith = (ev: ReadonlyMap<string, PlayEvidence>) => (r: Row): number => evaluate(mechanical100(r), ev.get(r.card.id) ?? null).evaluatedRating;
  log(`ported text rating     ${fmt(scoreSplits(data, ported))}`);
  log(`mechanical (calibrated) ${fmt(scoreSplits(data, calibrated))}`);
  const oos = spearmanWithShare(data.rows, data.evHold, evaluatedWith(data.evTrain));
  const oosBase = spearmanWithShare(data.rows, data.evHold, calibrated);
  const oosPorted = spearmanWithShare(data.rows, data.evHold, ported);
  const withTrain = data.rows.filter((r) => data.evTrain.has(r.card.id));
  const oosShared = spearmanWithShare(withTrain, data.evHold, evaluatedWith(data.evTrain));
  log(`evaluated, out of sample (TRAIN-list evidence vs HOLDOUT-list share): ${oos.rho.toFixed(3)} over ${oos.n} cards (mechanical ${oosBase.rho.toFixed(3)}, ported ${oosPorted.rho.toFixed(3)}); cards with train evidence only: ${oosShared.rho.toFixed(3)} over ${oosShared.n}`);
  const circ = spearmanWithShare(data.rows, data.evAll, evaluatedWith(data.evAll));
  log(`evaluated, in sample (circular, all lists both sides): ${circ.rho.toFixed(3)} over ${circ.n} cards`);

  const line = (r: Row): string => {
    const e = data.evAll.get(r.card.id) ?? null;
    const m = mechanical100(r);
    const share = e ? `${Math.round(e.share * 100)}% of ${e.eligibleLists}${e.banned ? ' pre-ban' : ''}` : 'no play data';
    return `${r.card.name} [${r.card.energy ?? '-'}${(r.card.power ?? 0) > 0 ? `+${r.card.power}P` : ''}] ported ${toBaseRating100(r.foundation)} mech ${m} eval ${evaluate(m, e).evaluatedRating} (${share})`;
  };
  const evalOf = (r: Row): number => evaluate(mechanical100(r), data.evAll.get(r.card.id) ?? null).evaluatedRating;
  for (const type of ['unit', 'spell', 'gear'] as const) {
    const rows = data.rows.filter((r) => r.card.type === type).sort((a, b) => evalOf(b) - evalOf(a) || a.card.name.localeCompare(b.card.name));
    log(`--- top 25 ${type}s by evaluated rating`);
    for (const r of rows.slice(0, 25)) log(`  ${line(r)}`);
    log(`--- bottom 25 ${type}s by evaluated rating`);
    for (const r of rows.slice(-25)) log(`  ${line(r)}`);
  }
  // Mis-rated staples: the most played cards the ported rating put lowest.
  const staples = data.rows
    .filter((r) => { const e = data.evAll.get(r.card.id); return e && !e.banned && e.nEff >= 20 && e.share >= 0.4; })
    .sort((a, b) => a.foundation - b.foundation || a.card.name.localeCompare(b.card.name)).slice(0, 12);
  log('--- 12 staples (share >= 40%, nEff >= 20) the ported rating put lowest');
  for (const r of staples) log(`  ${line(r)}`);
  const duds = data.rows
    .filter((r) => { const e = data.evAll.get(r.card.id); return e && !e.banned && e.nEff >= 40 && e.lists === 0; })
    .sort((a, b) => b.foundation - a.foundation || a.card.name.localeCompare(b.card.name)).slice(0, 12);
  log('--- 12 unplayed cards (0 lists, nEff >= 40) the ported rating put highest');
  for (const r of duds) log(`  ${line(r)}`);

  // Co-play: how many of the 200 pairs most often registered together (raw count over all lists) have an edge.
  const byId = new Map(data.cards.map((c) => [c.id, c]));
  const raw = new Map<string, number>();
  for (const l of data.lists) {
    const ids = Object.keys(l.main).filter((id) => { const c = byId.get(id); return c && isMainDeckCard(c); }).sort();
    for (let i = 0; i < ids.length; i += 1) for (let j = i + 1; j < ids.length; j += 1) raw.set(`${ids[i]}|${ids[j]}`, (raw.get(`${ids[i]}|${ids[j]}`) ?? 0) + 1);
  }
  const top = [...raw.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 200).map(([k]) => k);
  const stats = coPlayStats(data.cards, data.lists, data.legality);
  const measured = new Set(stats.map((s) => `${s.a}|${s.b}`));
  const db = openDb();
  const mechanical = new Set<string>();
  try {
    for (const e of db.prepare('SELECT a, b, json FROM card_edges').all() as { a: string; b: string; json: string }[]) {
      if ((JSON.parse(e.json) as { reasons: { scope: string }[] }).reasons.some((r) => r.scope !== COPLAY_SCOPE)) mechanical.add(e.a < e.b ? `${e.a}|${e.b}` : `${e.b}|${e.a}`);
    }
  } finally { db.close(); }
  log(`--- co-play: ${stats.length} measured pairs; of the 200 most co-registered pairs ${top.filter((k) => mechanical.has(k)).length} have a mechanical edge, ${top.filter((k) => measured.has(k)).length} a measured edge, ${top.filter((k) => mechanical.has(k) || measured.has(k)).length} either`);
  // Why so few: the lift of those 200 pairs inside each legend's lists.
  const lifts: number[] = [];
  const byLegend = new Map<string, PlayList[]>();
  for (const l of data.lists) { const held = byLegend.get(l.legend); if (held) held.push(l); else byLegend.set(l.legend, [l]); }
  for (const k of top) {
    const [x, y] = k.split('|');
    let together = 0, chance = 0;
    for (const group of byLegend.values()) {
      if (group.length < COPLAY.minLegendLists) continue;
      const a = group.filter((l) => l.main[x]).length, b = group.filter((l) => l.main[y]).length, t = group.filter((l) => l.main[x] && l.main[y]).length;
      together += t; chance += (a * b) / group.length;
    }
    if (chance > 0) lifts.push(together / chance);
  }
  lifts.sort((a, b) => a - b);
  log(`    lift of those 200 pairs within legends: median ${lifts[Math.floor(lifts.length / 2)]?.toFixed(2)}, 90th percentile ${lifts[Math.floor(lifts.length * 0.9)]?.toFixed(2)} (the rule needs a shrunk lift of ${COPLAY.minLift})`);
  const byMeasure = [...stats].sort((a, b) => (b.together - b.chance) - (a.together - a.chance)).slice(0, 200);
  log(`    of the 200 measured pairs with the largest excess over chance, ${byMeasure.filter((s) => mechanical.has(`${s.a}|${s.b}`)).length} also have a mechanical edge`);
}

/**
 * `--diagnose`: why the ported text rating does not follow play. The 60 most played main-deck cards
 * (eligibility-normalised play score, nEff >= 20, not banned) against 60 cards no eligible list runs
 * (nEff >= 40), matched one to one on type and nearest Energy cost. Prints, per type, the mean of each
 * component of the ported ledger on both sides, and the mechanics that are most over- and under-represented.
 */
function diagnose(data: CalibrationData, log: (line: string) => void): void {
  const ev = (r: Row): PlayEvidence | undefined => data.evAll.get(r.card.id);
  const score = (r: Row): number => { const e = ev(r) as PlayEvidence; return Math.max(e.share, e.peak ? 0.5 * e.peak.share : 0); };
  const played = data.rows.filter((r) => { const e = ev(r); return e && !e.banned && e.nEff >= 20 && e.lists > 0; })
    .sort((a, b) => score(b) - score(a) || a.card.id.localeCompare(b.card.id)).slice(0, 60);
  const pool = data.rows.filter((r) => { const e = ev(r); return e && !e.banned && e.nEff >= 40 && e.lists === 0; })
    .sort((a, b) => a.card.id.localeCompare(b.card.id));
  const taken = new Set<string>();
  const pairs: [Row, Row][] = [];
  for (const p of played) {
    const match = pool.filter((u) => !taken.has(u.card.id) && u.card.type === p.card.type)
      .sort((a, b) => Math.abs((a.card.energy ?? 0) - (p.card.energy ?? 0)) - Math.abs((b.card.energy ?? 0) - (p.card.energy ?? 0)) || a.card.id.localeCompare(b.card.id))[0];
    if (!match) continue;
    taken.add(match.card.id);
    pairs.push([p, match]);
  }
  const mean = (rows: Row[], f: (r: Row) => number): number => rows.reduce((s, r) => s + f(r), 0) / Math.max(1, rows.length);
  const keys = ['total', 'typeBaseline', 'printedStrength', 'expectedStrength', 'effectValue', 'cardAdvantage', 'boardControl', 'battlefieldControl',
    'resourceValue', 'flexibility', 'roleUtility', 'reliability', 'activationFactor', 'costsAndDrawbacks', 'energyCost', 'powerCost', 'highCostRisk'] as const;
  log(`diagnosis: ${pairs.length} matched pairs (played vs never played), unplayed pool ${pool.length}`);
  for (const type of ['unit', 'spell', 'gear', 'all'] as const) {
    const sel = pairs.filter(([p]) => type === 'all' || p.card.type === type);
    if (!sel.length) continue;
    const P = sel.map(([p]) => p), U = sel.map(([, u]) => u);
    log(`--- ${type}: ${sel.length} pairs; mean Energy ${mean(P, (r) => r.card.energy ?? 0).toFixed(2)} vs ${mean(U, (r) => r.card.energy ?? 0).toFixed(2)}; mean Power ${mean(P, (r) => r.card.power ?? 0).toFixed(2)} vs ${mean(U, (r) => r.card.power ?? 0).toFixed(2)}; mean Might ${mean(P, (r) => r.card.might ?? 0).toFixed(2)} vs ${mean(U, (r) => r.card.might ?? 0).toFixed(2)}`);
    for (const k of keys) {
      const a = mean(P, (r) => Number(r.input.breakdown[k]) || 0), b = mean(U, (r) => Number(r.input.breakdown[k]) || 0);
      log(`  ${k.padEnd(20)} played ${a.toFixed(2).padStart(6)}  unplayed ${b.toFixed(2).padStart(6)}  diff ${(a - b >= 0 ? '+' : '') + (a - b).toFixed(2)}`);
    }
    if (type !== 'all') continue;
    const traits = new Set<string>();
    for (const r of [...P, ...U]) for (const t of r.input.traits) traits.add(t);
    const rowsOf = [...traits].map((t) => ({ t, a: P.filter((r) => r.input.traits.has(t)).length, b: U.filter((r) => r.input.traits.has(t)).length }))
      .filter((x) => x.a + x.b >= 6).sort((x, y) => (y.a - y.b) - (x.a - x.b));
    log('  mechanics more common among the played (played / unplayed of 60):');
    for (const x of rowsOf.slice(0, 14)) log(`    ${x.t.padEnd(22)} ${x.a} / ${x.b}`);
    log('  mechanics more common among the never played:');
    for (const x of rowsOf.slice(-12).reverse()) log(`    ${x.t.padEnd(22)} ${x.a} / ${x.b}`);
  }
}

function main(): void {
  const write = process.argv.includes('--write');
  const data = loadCalibrationData();
  const log = (line: string) => console.log(line);
  if (process.argv.includes('--report')) { report(data, log); return; }
  if (process.argv.includes('--diagnose')) { diagnose(data, log); return; }
  log(`lists ${data.lists.length}: train ${data.trainLists.length}, holdout ${data.holdLists.length}; main-deck cards ${data.rows.length}`);
  const result = fit(data, log);
  log(`before  ${fmt(scoreSplits(data, (r) => r.foundation))}`);
  log(`after   ${fmt(scoreSplits(data, (r) => calibrateFoundation(r.input, result.coefficients, result.intercept).total))}`);
  log(`in file ${fmt(scoreSplits(data, (r) => calibrateFoundation(r.input).total))}`);
  const table = Object.entries(result.coefficients).sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]));
  for (const [id, coef] of table) log(`  ${id.padEnd(28)} ${coef >= 0 ? '+' : ''}${coef}`);
  log(`  intercept ${result.intercept}, lambda ${result.lambda}`);
  if (write) {
    const file = path.join(process.cwd(), 'src', 'engine', 'mine', 'calibration.ts');
    const source = readFileSync(file, 'utf8');
    const scores = scoreSplits(data, (r) => calibrateFoundation(r.input, result.coefficients, result.intercept).total);
    const before = scoreSplits(data, (r) => r.foundation);
    const r3 = (n: number) => Math.round(n * 1000) / 1000;
    const block = [
      '/*CALIBRATION-TABLE-START*/',
      `export const CALIBRATION_INTERCEPT = ${result.intercept};`,
      'export const CALIBRATION_COEFFICIENTS: Readonly<Record<string, number>> = {',
      ...table.map(([id, coef]) => `  '${id}': ${coef},`),
      '};',
      '/** The fit that produced the table: Spearman of the rating with the eligibility-normalised share, before -> after. */',
      'export const CALIBRATION_FIT = {',
      `  fittedOn: '${new Date().toISOString().slice(0, 10)}', lists: ${data.lists.length}, trainLists: ${data.trainLists.length}, holdoutLists: ${data.holdLists.length},`,
      `  trainCards: ${result.trainCards}, lambda: ${result.lambda},`,
      `  spearmanTrain: [${r3(before.train)}, ${r3(scores.train)}], spearmanHoldoutLists: [${r3(before.holdoutLists)}, ${r3(scores.holdoutLists)}], spearmanHoldoutListsAndCards: [${r3(before.holdoutStrict)}, ${r3(scores.holdoutStrict)}],`,
      '} as const;',
      '/*CALIBRATION-TABLE-END*/',
    ].join('\n');
    writeFileSync(file, source.replace(/\/\*CALIBRATION-TABLE-START\*\/[^]*\/\*CALIBRATION-TABLE-END\*\//, block));
    log(`wrote ${table.length} coefficients to src/engine/mine/calibration.ts`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
