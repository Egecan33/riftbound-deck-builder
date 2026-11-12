// Target bands of a deck (plan Task 6; spec 9-11; docs/research/deck-theory.md 2.3, 3.1, 5.2). New code. Pure.
//
// MEASURED, then HEURISTIC in how it is used:
// - The bands below were measured on 2026-11-12 on the 789 complete Standard lists of the `meta` sync step
//   (Piltover Archive public lists), with THIS engine's role classifier (src/engine/features/roles.ts), so a
//   band and the count it is compared with mean the same thing. Each entry is [p10, p25, median, p75, p90].
//   deck-theory.md 3.1 rule: target band = p25-p75, tolerance band = p10-p90.
// - Reconciliation with deck-theory.md 3.1 (406 lists, the research's own regex classifier): the
//   classifier-independent rows agree (units of unit-aggro 22-27 there, 21.75-26.25 here; spells of spell-tempo
//   16-21 / 15-20; gear of gear-engine 7-15 / 8-15; average Energy of big-control 3.54-4.17 / 3.58-4.15).
//   Role rows differ because the classifiers differ (the research counts bounce and stun as removal, this
//   engine does not), which is why the role rows were re-measured instead of copied.
// - Archetype = nearest centroid of deck-theory.md 2.3, on the six of its twelve features that need no role
//   classifier (units, average Energy, Energy 0-1, Energy 2, Energy 6+, gear), z-scored with the research's
//   mean and sd. On the 789 lists this gives unit-aggro 276, spell-tempo 243, gear-engine 151, big-control 119.
// - Not done: per-legend bands (deck-theory.md 3.1 last line). LegendMeta holds per-card inclusion, not
//   per-list role counts, so a legend's own p25-p75 cannot be computed from the contract's data. The legend
//   enters through the archetype of its typical list instead (expectedComposition).
// - Riftfoundry's DECK_CURVE_TARGETS are not used: deck-theory.md 2.10 measured that they do not match play.
// Public lists are what people registered, not proof of what wins (deck-theory.md 0.3).
import { featuresFor, qtyOf, summarizeDeck } from './summary';
import { legendOf } from './rules/identity';
import { MAIN_MIN } from './rules/formats';
import type { Band, CardDb, Deck, DeckSummary, Format, PowerTarget, Role, Targets } from './types';

export type Archetype = 'unit-aggro' | 'spell-tempo' | 'gear-engine' | 'big-control' | 'any';
type Quantiles = readonly [number, number, number, number, number];

export const ARCHETYPE_LABELS: Record<Archetype, string> = {
  'unit-aggro': 'Unit aggro', 'spell-tempo': 'Spell tempo', 'gear-engine': 'Gear engine', 'big-control': 'Big control', any: 'No clear archetype yet',
};

/** [p10, p25, median, p75, p90] per metric, in copies of a 40-card Main Deck. `any` = all lists together. */
export const MEASURED_BANDS: Record<Archetype, { n: number; m: Record<string, Quantiles> }> = {
  'unit-aggro': { n: 276, m: {
    'unit': [20, 21.75, 24, 26.25, 30], 'spell': [7.5, 10, 13, 16, 18], 'gear': [0, 1, 3, 5, 6], 'e0': [0, 0, 0, 0, 0],
    'e1': [0, 2, 4, 5, 6], 'e2': [9, 12, 14, 17, 19], 'e3': [6, 8.75, 11, 14, 17], 'e4': [2, 4, 5, 7, 9],
    'e5': [0, 1, 3, 4, 5], 'e6': [0, 0, 1, 2, 3], 'e7': [0, 0, 0, 2, 3], 'avgEnergy': [2.65, 2.77, 2.9, 3.13, 3.3],
    'reaction': [1, 2, 4, 6, 9], 'earlyUnits': [4, 6, 8, 9, 10], 'units24': [15, 17, 19, 22, 25], 'interaction': [7.5, 10, 12, 15, 18],
    'earlyIx': [3, 4, 6, 9, 11], 'threeOfs': [12, 15, 21, 27, 30], 'pips': [13, 15, 18, 22, 26], 'role:removal': [2, 3, 6, 9, 10],
    'role:sweeper': [0, 0, 0, 0, 0], 'role:combat-trick': [0, 1, 3, 5, 6], 'role:protection': [0, 0, 0, 1, 2], 'role:counter': [0, 0, 0, 1, 3],
    'role:card-flow': [3, 5, 6, 8, 11], 'role:rune-ramp': [0, 0, 0, 3, 4], 'role:mobility': [0, 3, 4, 8, 10], 'role:finisher': [0, 0, 1, 2, 4],
    'role:disruption': [0, 1, 2, 3, 5], 'role:token-maker': [0, 1, 3, 7, 10], 'role:hate': [0, 0, 0, 1, 1],
  } },
  'spell-tempo': { n: 243, m: {
    'unit': [14, 16, 18, 20, 21], 'spell': [14, 15, 17, 20, 22], 'gear': [1.2, 3, 5, 6, 8], 'e0': [0, 0, 0, 0, 3],
    'e1': [5, 5, 7, 9, 12], 'e2': [14, 15, 17, 19, 20], 'e3': [3, 5, 7, 9, 10], 'e4': [1, 3, 4, 5, 7],
    'e5': [0, 1, 2, 3, 4], 'e6': [0, 0, 0, 1, 2], 'e7': [0, 0, 2, 3, 4], 'avgEnergy': [2.28, 2.46, 2.68, 2.8, 2.92],
    'reaction': [4, 6, 10, 12, 14], 'earlyUnits': [5, 6, 8, 9, 9], 'units24': [10, 12, 14, 16, 17], 'interaction': [10, 13, 16, 18, 20],
    'earlyIx': [7.2, 10, 12, 14, 16], 'threeOfs': [15, 18, 21, 27, 30], 'pips': [14, 16, 18, 20, 23], 'role:removal': [2, 3, 5, 8, 11],
    'role:sweeper': [0, 0, 0, 0, 0], 'role:combat-trick': [2, 3, 5, 7, 9], 'role:protection': [0, 0, 2, 4, 5], 'role:counter': [0, 1, 3, 4, 4],
    'role:card-flow': [6, 7, 10, 11, 13.8], 'role:rune-ramp': [0, 0, 1, 3, 3], 'role:mobility': [0.2, 3.5, 5, 8, 9], 'role:finisher': [0, 0, 2, 3, 4],
    'role:disruption': [0, 0, 1, 3, 4], 'role:token-maker': [0, 0, 1, 3, 8.8], 'role:hate': [0, 0, 0, 1, 1],
  } },
  'gear-engine': { n: 151, m: {
    'unit': [6, 9, 13, 17, 20], 'spell': [7, 11, 16, 20, 23], 'gear': [6, 8, 11, 15, 18], 'e0': [0, 0, 0, 2, 3],
    'e1': [6, 8, 9, 11, 12], 'e2': [9, 12, 15, 17, 19], 'e3': [3, 4, 7, 9.5, 13], 'e4': [0, 1, 3, 4, 5],
    'e5': [0, 1, 3, 4, 6], 'e6': [0, 0, 0, 1, 2], 'e7': [0, 0, 1, 3, 4], 'avgEnergy': [2.08, 2.3, 2.53, 2.73, 2.9],
    'reaction': [1, 3, 7, 11, 15], 'earlyUnits': [0, 3, 5, 6, 8], 'units24': [4, 7, 10, 14, 15], 'interaction': [5, 10, 14, 18, 22],
    'earlyIx': [3, 7, 10, 12, 14], 'threeOfs': [18, 21, 24, 30, 33], 'pips': [12, 14, 17, 21, 24], 'role:removal': [1, 2, 5, 12, 20],
    'role:sweeper': [0, 0, 0, 0, 1], 'role:combat-trick': [0, 0, 3, 6, 8], 'role:protection': [0, 0, 1, 3, 4], 'role:counter': [0, 0, 2, 3, 4],
    'role:card-flow': [4, 6, 9, 12, 17], 'role:rune-ramp': [0, 0, 2, 4, 6], 'role:mobility': [0, 0, 3, 5, 7], 'role:finisher': [0, 0, 1, 2, 3],
    'role:disruption': [0, 0, 1, 2, 3], 'role:token-maker': [0, 2, 5, 7, 13], 'role:hate': [0, 0, 0, 2, 3],
  } },
  'big-control': { n: 119, m: {
    'unit': [5, 15, 20, 23, 30], 'spell': [7, 13.5, 19, 23, 25], 'gear': [0, 0, 2, 5, 10], 'e0': [0, 0, 0, 0, 0],
    'e1': [2, 3, 6, 8, 8], 'e2': [8, 9, 10, 13, 14], 'e3': [1.8, 3, 5, 7, 11], 'e4': [0, 2, 4, 6, 10.2],
    'e5': [0, 0, 2, 5, 7], 'e6': [0, 2, 3, 4, 5], 'e7': [4.8, 6, 7, 9, 13.2], 'avgEnergy': [3.4, 3.58, 3.88, 4.15, 4.82],
    'reaction': [2, 4, 5, 7, 9], 'earlyUnits': [0, 0, 6, 6, 8], 'units24': [0, 8, 11, 13.5, 15], 'interaction': [9, 12, 14, 19, 23.2],
    'earlyIx': [2, 3, 6, 13.5, 16], 'threeOfs': [21, 24, 27, 27, 30], 'pips': [20, 24, 28, 30, 32], 'role:removal': [5.8, 7, 11, 14, 16],
    'role:sweeper': [0, 0, 0, 1, 2], 'role:combat-trick': [0, 0, 3, 5, 5], 'role:protection': [0, 0, 0, 0, 1], 'role:counter': [0, 0, 0, 0, 2.2],
    'role:card-flow': [6, 8, 10, 12, 15], 'role:rune-ramp': [0, 0, 3, 8, 9], 'role:mobility': [0, 0, 0, 0, 2], 'role:finisher': [4, 5, 7, 9, 12],
    'role:disruption': [0, 0, 1, 3, 3], 'role:token-maker': [0, 2, 4, 7.5, 12.2], 'role:hate': [0, 0, 1, 1, 2],
  } },
  'any': { n: 789, m: {
    'unit': [11, 16, 20, 23, 27], 'spell': [8.8, 12, 15, 19, 22], 'gear': [0, 2, 5, 7, 11], 'e0': [0, 0, 0, 0, 2],
    'e1': [2, 4, 6, 9, 11], 'e2': [9, 12, 15, 17, 19], 'e3': [3, 5, 8, 11, 14], 'e4': [1, 3, 4, 6, 8],
    'e5': [0, 1, 2, 4, 5], 'e6': [0, 0, 0, 2, 3], 'e7': [0, 0, 2, 3, 7], 'avgEnergy': [2.35, 2.58, 2.8, 3.13, 3.68],
    'reaction': [2, 3, 6, 10, 13], 'earlyUnits': [1, 5, 7, 8, 9], 'units24': [7, 12, 14, 18, 22], 'interaction': [8, 11, 14, 18, 21],
    'earlyIx': [3, 5, 9, 12, 15], 'threeOfs': [15, 18, 24, 27, 30], 'pips': [13, 16, 18, 23, 29], 'role:removal': [2, 3, 6, 9, 14],
    'role:sweeper': [0, 0, 0, 0, 0], 'role:combat-trick': [0, 2, 4, 6, 8], 'role:protection': [0, 0, 0, 2, 4], 'role:counter': [0, 0, 1, 3, 4],
    'role:card-flow': [4, 6, 8, 11, 14], 'role:rune-ramp': [0, 0, 1, 3, 6], 'role:mobility': [0, 1, 4, 6, 9], 'role:finisher': [0, 0, 2, 3, 6],
    'role:disruption': [0, 0, 1, 3, 4], 'role:token-maker': [0, 0, 3, 6, 10], 'role:hate': [0, 0, 0, 1, 2],
  } },
};

/** Metrics a band exists for. `role:<Role>` rows use roles.ts; the rest need no classifier. */
export const BANDED_ROLES: readonly Role[] = ['removal', 'sweeper', 'combat-trick', 'protection', 'counter', 'card-flow', 'rune-ramp', 'mobility', 'finisher', 'disruption', 'token-maker', 'hate'];

export interface BandSpec extends Band { tolLo: number; tolHi: number; median: number }

export interface FullTargets extends Targets {
  archetypeId: Archetype;
  /** Lists the bands were measured on. */
  sample: number;
  /** Main Deck size the bands are scaled to, divided by 40. 1 for a complete 40-card deck and for an empty one. */
  scale: number;
  /** Bands for a 40-card deck. */
  full: Record<string, BandSpec>;
  /** The same bands scaled to this deck's size ("so far"). Average Energy is not scaled. */
  scaled: Record<string, BandSpec>;
  /** Why this archetype, in words. */
  reason: string;
  /** What is heuristic about these targets. */
  notes: string[];
}

// deck-theory.md 2.3: mean and sd of the z-scale, and the centroids, for units, avgEnergy, e01, e2, e6p, gear.
const Z_MEAN = [19.039, 2.909, 6.938, 14.953, 3.675, 4.869] as const;
const Z_SD = [6.459, 0.577, 3.347, 4.014, 3.666, 4.371] as const;
const CENTROIDS: Record<Exclude<Archetype, 'any'>, readonly number[]> = {
  'big-control': [17.56, 3.93, 6.3, 10.67, 10.71, 3.3],
  'gear-engine': [14.04, 2.56, 10.19, 14.64, 2.41, 10.67],
  'spell-tempo': [17.19, 2.65, 8.09, 17.33, 2.68, 4.64],
  'unit-aggro': [24.33, 2.85, 4.35, 14.76, 1.86, 2.86],
};
/** HEURISTIC: below this many cards the list alone says too little about its archetype. */
export const ARCHETYPE_MIN_CARDS = 12;
/** HEURISTIC: a legend's typical list is used only when this many lists back it. */
export const ARCHETYPE_MIN_LISTS = 5;

interface Composition { cards: number; units: number; gear: number; energy: number; e01: number; e2: number; e6p: number }

const compositionOf = (s: DeckSummary): Composition => ({
  cards: s.mainCount, units: s.typeCounts.unit, gear: s.typeCounts.gear, energy: s.avgEnergy * s.mainCount,
  e01: s.curve[0] + s.curve[1], e2: s.curve[2], e6p: s.curve[6] + s.curve[7],
});

/**
 * The legend's typical list as expected copies (inclusion share x copies when run), from LegendMeta.
 * DATA, not rules. Null when the legend has fewer than ARCHETYPE_MIN_LISTS lists.
 */
export function expectedComposition(deck: Deck, db: CardDb): (Composition & { lists: number }) | null {
  const legend = legendOf(deck, db);
  const meta = legend ? db.legendMeta(legend.id) : undefined;
  if (!meta || meta.decks < ARCHETYPE_MIN_LISTS) return null;
  const c: Composition = { cards: 0, units: 0, gear: 0, energy: 0, e01: 0, e2: 0, e6p: 0 };
  for (const [id, stat] of Object.entries(meta.main)) {
    const card = db.get(id);
    const copies = stat.share * stat.avgCopies;
    if (!card || !(copies > 0)) continue;
    const e = card.energy ?? 0;
    c.cards += copies;
    if (card.type === 'unit') c.units += copies;
    if (card.type === 'gear') c.gear += copies;
    c.energy += copies * e;
    if (e <= 1) c.e01 += copies;
    if (e === 2) c.e2 += copies;
    if (e >= 6) c.e6p += copies;
  }
  return c.cards > 0 ? { ...c, lists: meta.decks } : null;
}

const nearest = (c: Composition): { id: Exclude<Archetype, 'any'>; distance: number } => {
  const k = MAIN_MIN / c.cards;
  const x = [c.units * k, c.energy / c.cards, c.e01 * k, c.e2 * k, c.e6p * k, c.gear * k].map((v, i) => (v - Z_MEAN[i]) / Z_SD[i]);
  let best: { id: Exclude<Archetype, 'any'>; distance: number } = { id: 'spell-tempo', distance: Infinity };
  for (const [id, centroid] of Object.entries(CENTROIDS) as [Exclude<Archetype, 'any'>, readonly number[]][]) {
    const distance = centroid.reduce((sum, v, i) => sum + ((v - Z_MEAN[i]) / Z_SD[i] - x[i]) ** 2, 0);
    if (distance < best.distance) best = { id, distance };
  }
  return best;
};

/**
 * Archetype of a deck. A complete list is classified by itself. A partial list is completed with the legend's
 * typical list (the missing share of the 40 cards comes from LegendMeta); without enough lists a deck under
 * ARCHETYPE_MIN_CARDS cards is 'any' (bands of all lists together).
 */
export function archetypeOf(deck: Deck, db: CardDb, summary: DeckSummary = summarizeDeck(deck, db)): { id: Archetype; reason: string } {
  const own = compositionOf(summary);
  const missing = Math.max(0, MAIN_MIN - own.cards);
  const expected = missing > 0 ? expectedComposition(deck, db) : null;
  const legendName = legendOf(deck, db)?.name ?? 'the legend';
  if (missing === 0 || (!expected && own.cards >= ARCHETYPE_MIN_CARDS)) {
    const { id } = nearest(own);
    return { id, reason: `${ARCHETYPE_LABELS[id]}: nearest measured archetype for ${summary.typeCounts.unit} units, ${summary.typeCounts.gear} gear, average Energy ${summary.avgEnergy.toFixed(2)} in ${own.cards} cards${missing > 0 ? ' so far' : ''}.` };
  }
  if (!expected) return { id: 'any', reason: `No archetype yet: ${own.cards} cards and too few public lists of ${legendName} to know its typical list. Bands are those of all measured lists.` };
  const k = missing / expected.cards;
  const mixed: Composition = {
    cards: own.cards + missing, units: own.units + expected.units * k, gear: own.gear + expected.gear * k, energy: own.energy + expected.energy * k,
    e01: own.e01 + expected.e01 * k, e2: own.e2 + expected.e2 * k, e6p: own.e6p + expected.e6p * k,
  };
  const { id } = nearest(mixed);
  return { id, reason: `${ARCHETYPE_LABELS[id]}: ${own.cards} cards so far, completed with the typical ${legendName} list from ${expected.lists} public lists (data, not rules).` };
}

const POWER_TOLERANCE: Record<PowerTarget, number> = { competitive: 1, focused: 1.25, casual: 1.6 };

/** HEURISTIC (deck-theory.md 5.2 "Bands", a guess until multiplayer lists exist): shift of a band in copies. */
const MODE_SHIFT: Partial<Record<Format, Record<string, number>>> = {
  ffa3: { 'role:protection': 1, 'role:finisher': 1, 'role:combat-trick': -1, 'role:counter': -1, earlyUnits: 1 },
  ffa4: { 'role:protection': 2, 'role:finisher': 1, 'role:combat-trick': -2, 'role:counter': -1, earlyUnits: 1 },
  '2v2': { 'role:protection': 1, 'role:finisher': 1, earlyUnits: 1 },
};

const r2 = (n: number): number => Math.round(n * 100) / 100;

function specOf(q: Quantiles, shift: number, tolerance: number): BandSpec {
  const lo = Math.max(0, q[1] + shift);
  const hi = Math.max(lo, q[3] + shift);
  return {
    lo, hi, median: Math.max(0, q[2] + shift),
    tolLo: Math.max(0, lo - (q[1] - q[0]) * tolerance - (tolerance - 1)),
    tolHi: hi + (q[4] - q[3]) * tolerance + (tolerance - 1),
  };
}

const scaleSpec = (s: BandSpec, k: number): BandSpec => ({ lo: r2(s.lo * k), hi: r2(s.hi * k), tolLo: r2(s.tolLo * k), tolHi: r2(s.tolHi * k), median: r2(s.median * k) });
/** A band in whole cards: the counts that are inside it (21.75-26.25 holds 22..26). Never empty. */
export const wholeBand = (s: Band): Band => { const lo = Math.ceil(s.lo - 1e-9); return { lo, hi: Math.max(lo, Math.floor(s.hi + 1e-9)) }; };
export const bandText = (s: Band): string => { const b = wholeBand(s); return `${b.lo}-${b.hi}`; };
const whole = wholeBand;

/**
 * 1 inside the target band; falls linearly to 0.5 at the tolerance bound; to 0 one band-width further out
 * (deck-theory.md 3.1). A band-width under 1 counts as 1 so a 0-0 band is not a cliff.
 */
export function bandScore(x: number, spec: BandSpec): number {
  if (!Number.isFinite(x)) return 0;
  if (x >= spec.lo && x <= spec.hi) return 1;
  const width = Math.max(1, spec.hi - spec.lo);
  const below = x < spec.lo;
  const edge = below ? spec.lo : spec.hi;
  const tol = below ? spec.tolLo : spec.tolHi;
  const gap = Math.abs(edge - tol);
  const d = Math.abs(x - edge);
  if (d <= gap && gap > 0) return 1 - 0.5 * (d / gap);
  return Math.max(0, 0.5 - 0.5 * ((d - gap) / width));
}

/**
 * Target bands for this deck: archetype, format and power target decide them; an incomplete deck gets the
 * bands scaled to its size. `scaled` and the `Targets` fields are what the deck is compared with now;
 * `full` is where a 40-card deck should end (the card score's role need uses `full`).
 */
export function targetsFor(deck: Deck, db: CardDb, summary: DeckSummary = summarizeDeck(deck, db)): FullTargets {
  const { id, reason } = archetypeOf(deck, db, summary);
  const measured = MEASURED_BANDS[id];
  const tolerance = POWER_TOLERANCE[deck.power] ?? 1;
  const shift = MODE_SHIFT[deck.format] ?? {};
  const scale = summary.mainCount > 0 ? summary.mainCount / MAIN_MIN : 1;
  const full: Record<string, BandSpec> = {};
  const scaled: Record<string, BandSpec> = {};
  for (const [key, q] of Object.entries(measured.m)) {
    full[key] = specOf(q, shift[key] ?? 0, tolerance);
    scaled[key] = key === 'avgEnergy' ? full[key] : scaleSpec(full[key], scale);
  }
  const notes = [
    `Bands are the middle half (p25-p75) of ${measured.n} public ${id === 'any' ? '' : `${ARCHETYPE_LABELS[id]} `}lists measured on 2026-11-12: what players registered, not proof of what wins.`,
  ];
  if (Object.keys(shift).length) notes.push('Heuristic: the bands are shifted for this format by guess (no multiplayer lists exist to measure).');
  if (tolerance !== 1) notes.push(`Heuristic: the ${deck.power} power target widens the tolerance around each band.`);
  if (summary.mainCount > 0 && summary.mainCount !== MAIN_MIN) notes.push(`Bands are scaled to ${summary.mainCount} cards (so far).`);
  const roles: Partial<Record<Role, Band>> = { 'unit-body': whole(scaled.unit), gear: whole(scaled.gear) };
  for (const role of BANDED_ROLES) if (scaled[`role:${role}`]) roles[role] = whole(scaled[`role:${role}`]);
  return {
    archetype: ARCHETYPE_LABELS[id], archetypeId: id, sample: measured.n, scale, full, scaled, reason, notes,
    types: { unit: whole(scaled.unit), spell: whole(scaled.spell), gear: whole(scaled.gear) },
    roles,
    curve: Array.from({ length: 8 }, (_, b) => whole(scaled[`e${b}`])),
    avgEnergy: { lo: full.avgEnergy.lo, hi: full.avgEnergy.hi },
  };
}

/** Counts of the derived metrics the bands use and DeckSummary does not hold. */
export interface DerivedCounts { earlyUnits: number; units24: number; interaction: number; earlyInteraction: number; threeOfs: number; pips: number }
export const INTERACTION_ROLES: readonly Role[] = ['removal', 'sweeper', 'counter', 'combat-trick', 'disruption'];

export function derivedCounts(deck: Deck, db: CardDb): DerivedCounts {
  const out: DerivedCounts = { earlyUnits: 0, units24: 0, interaction: 0, earlyInteraction: 0, threeOfs: 0, pips: 0 };
  for (const entry of deck.main) {
    const card = db.get(entry.id);
    const qty = qtyOf(entry);
    if (!card || qty === 0) continue;
    const e = card.energy ?? 0;
    if (card.type === 'unit' && e <= 2) out.earlyUnits += qty;
    if (card.type === 'unit' && e >= 2 && e <= 4) out.units24 += qty;
    const interactive = featuresFor(db, card).roles.some((r) => INTERACTION_ROLES.includes(r));
    if (interactive) out.interaction += qty;
    if (interactive && e <= 2) out.earlyInteraction += qty;
    if (qty >= 3) out.threeOfs += qty;
    out.pips += qty * (card.power ?? 0);
  }
  return out;
}

export interface GuidelineReconciliation { id: string; guideline: string; measured: string; verdict: 'holds' | 'holds for some archetypes' | 'contradicted'; note: string }

const mid = (a: Archetype, key: string): string => { const q = MEASURED_BANDS[a].m[key]; return `${q[1]}-${q[3]}`; };
const four = (key: string): string => (['unit-aggro', 'spell-tempo', 'gear-engine', 'big-control'] as const).map((a) => `${ARCHETYPE_LABELS[a]} ${mid(a, key)}`).join('; ');

/**
 * The ported community guidelines (scoring/ported/deck-guidelines.ts) against the measured bands.
 * The rating uses the measured bands; the guidelines stay an advisory checklist, shown with this verdict.
 */
export const GUIDELINE_RECONCILIATION: readonly GuidelineReconciliation[] = [
  { id: 'low-drop-units', guideline: 'at least 8 units costing 2 Energy or less', measured: four('earlyUnits'), verdict: 'holds for some archetypes',
    note: 'True for the middle of unit-aggro and spell-tempo lists; gear-engine and big-control lists run fewer and start with gear or cheap interaction instead.' },
  { id: 'early-curve-units', guideline: 'at least 9 units costing 2-4 Energy', measured: four('units24'), verdict: 'holds',
    note: 'Nearly every measured list clears it; as a target it is too low to guide a unit deck (their middle half is 17-22).' },
  { id: 'unit-share', guideline: 'at least 20 units in 40 cards', measured: four('unit'), verdict: 'holds for some archetypes',
    note: 'Unit-aggro only. The middle half of spell-tempo lists runs 16-20 units and gear-engine 9-17.' },
  { id: 'interactive-spells', guideline: 'at least 6 interactive spells', measured: four('interaction'), verdict: 'holds',
    note: 'Measured interaction counts cards of any type and is far above 6; the guideline is a floor, not a target.' },
  { id: 'power-pip-free', guideline: 'at least 26 of 40 cards with no Power cost', measured: `printed Power pips per deck: ${four('pips')}`, verdict: 'holds for some archetypes',
    note: 'Lists carry 14-22 printed pips outside big-control, which runs 24-30; the rune sub-score checks castability card by card instead of a flat count.' },
  { id: 'playset-consistency', guideline: 'at least 10 full playsets', measured: `cards played as 3-ofs: ${four('threeOfs')}`, verdict: 'contradicted',
    note: 'Ten playsets are 30 cards; the middle half of lists has 15-30 cards in 3-ofs (5 to 10 playsets), so ten is the top of the measured range, not a minimum.' },
];
