// Deck summary and theme weights (plan Task 6; spec 10, 11; docs/research/deck-theory.md 7.2). New code. Pure.
//
// Everything here tolerates partial decks: no legend, no champion, unknown ids, 0 cards. Nothing throws and
// nothing divides by a deck size.
import { computeFeatures } from './features/compute';
import { legendProfile } from './features/legend';
import { ROLES } from './features/roles';
import { runeDemand } from './maths/runes';
import { isSignature } from './rules/champion';
import { legendOf } from './rules/identity';
import type { AxisId, Card, CardDb, CardFeatures, Deck, DeckEntry, DeckSummary, LegendProfile, Role } from './types';

export const qtyOf = (entry: Pick<DeckEntry, 'qty'>): number => (Number.isFinite(entry.qty) ? Math.max(0, Math.floor(entry.qty)) : 0);

const featureCache = new WeakMap<CardDb, Map<string, CardFeatures>>();
/**
 * Stored features of a card, or (when the db was built without the `features` sync step, as in tests)
 * the mechanical features computed on the spot and cached. Computed features carry no play evidence.
 */
export function featuresFor(db: CardDb, card: Card): CardFeatures {
  const stored = db.features(card.id);
  if (stored) return stored;
  let held = featureCache.get(db);
  if (!held) featureCache.set(db, (held = new Map()));
  let f = held.get(card.id);
  if (!f) held.set(card.id, (f = computeFeatures(card)));
  return f;
}

const profileCache = new WeakMap<CardDb, Map<string, LegendProfile>>();
/** Stored legend profile, or the text-derived one computed on the spot; null when the deck has no usable legend. */
export function profileFor(deck: Pick<Deck, 'legend'>, db: CardDb): LegendProfile | null {
  const legend = legendOf(deck as Deck, db);
  if (!legend) return null;
  const stored = db.legendProfile(legend.id);
  if (stored) return stored;
  let held = profileCache.get(db);
  if (!held) profileCache.set(db, (held = new Map()));
  let p = held.get(legend.id);
  if (!p) held.set(legend.id, (p = legendProfile(legend, db)));
  return p;
}

/** The deck with one copy of `id` taken out of the main deck (leave-one-out scoring). Other zones untouched. */
export function withoutCopy(deck: Deck, id: string): Deck {
  let taken = false;
  const main: DeckEntry[] = [];
  for (const entry of deck.main) {
    if (!taken && entry.id === id && qtyOf(entry) > 0) {
      taken = true;
      if (qtyOf(entry) > 1) main.push({ ...entry, qty: qtyOf(entry) - 1 });
    } else main.push(entry);
  }
  return taken ? { ...deck, main } : deck;
}

export const emptyRoleCounts = (): Record<Role, number> => Object.fromEntries(ROLES.map((r) => [r, 0])) as Record<Role, number>;

/**
 * Counts over the Main Deck (the Chosen Champion's copy is inside `main`, types.ts).
 * @param exclude a card id: one copy of it is left out, so an in-deck card can be scored against the rest
 */
export function summarizeDeck(deck: Deck, db: CardDb, exclude?: string): DeckSummary {
  const source = exclude ? withoutCopy(deck, exclude) : deck;
  const summary: DeckSummary = {
    mainCount: 0, sideCount: 0, runeCount: 0,
    typeCounts: { unit: 0, spell: 0, gear: 0 },
    roleCounts: emptyRoleCounts(),
    curve: new Array<number>(8).fill(0),
    avgEnergy: 0,
    powerDemand: runeDemand(source, db),
    axisTotals: {},
    signatureCount: 0, reactionCount: 0,
  };
  let energy = 0;
  for (const entry of source.main) {
    const card = db.get(entry.id);
    const qty = qtyOf(entry);
    if (!card || qty === 0) continue;
    const f = featuresFor(db, card);
    summary.mainCount += qty;
    if (card.type === 'unit' || card.type === 'spell' || card.type === 'gear') summary.typeCounts[card.type] += qty;
    for (const role of f.roles) summary.roleCounts[role] += qty;
    summary.curve[Math.max(0, Math.min(7, f.costBucket))] += qty;
    energy += qty * (card.energy ?? 0);
    for (const [axis, v] of Object.entries(f.axes)) {
      const t = (summary.axisTotals[axis] ??= { e: 0, p: 0 });
      t.e += qty * v.e;
      t.p += qty * v.p;
    }
    if (isSignature(card)) summary.signatureCount += qty;
    if (f.speed === 'reaction') summary.reactionCount += qty;
  }
  for (const entry of source.side) if (db.get(entry.id)) summary.sideCount += qtyOf(entry);
  for (const n of Object.values(source.runes)) summary.runeCount += Number.isFinite(n) ? Math.max(0, Math.floor(n ?? 0)) : 0;
  summary.avgEnergy = summary.mainCount === 0 ? 0 : Math.round((energy / summary.mainCount) * 100) / 100;
  for (const t of Object.values(summary.axisTotals)) { t.e = Math.round(t.e * 100) / 100; t.p = Math.round(t.p * 100) / 100; }
  return summary;
}

/** HEURISTIC constants of the theme vector (deck-theory.md 7.2 step 3; the locked-card term is ours). */
export const THEME = { listShare: 0.5, payoffCopiesForFull: 6, lockedPayoff: 0.7, lockedEnabler: 0.4, floor: 0.05 } as const;

/**
 * Weight of each theme axis for this deck, 0..1.
 * - The user's own weights (`deck.themeWeights`) win outright.
 * - Otherwise: the legend's text-derived weights, raised by what the list already pays off
 *   (`max(w_legend, 0.5 x min(1, payoffCopies / 6))`), and by the axes of locked (build-around) cards.
 * Never throws; a deck with no legend and no cards gives {}.
 */
export function resolveThemeWeights(deck: Deck, db: CardDb, summary: DeckSummary = summarizeDeck(deck, db)): Record<AxisId, number> {
  if (deck.themeWeights) {
    const out: Record<AxisId, number> = {};
    for (const [axis, w] of Object.entries(deck.themeWeights)) if (Number.isFinite(w) && w > 0) out[axis] = Math.min(1, w);
    return out;
  }
  const out: Record<AxisId, number> = { ...(profileFor(deck, db)?.axisWeights ?? {}) };
  for (const [axis, t] of Object.entries(summary.axisTotals)) {
    const fromList = THEME.listShare * Math.min(1, t.p / THEME.payoffCopiesForFull);
    if (fromList > (out[axis] ?? 0)) out[axis] = fromList;
  }
  for (const entry of deck.main) {
    if (!entry.locked || qtyOf(entry) === 0) continue;
    const card = db.get(entry.id);
    if (!card) continue;
    for (const [axis, v] of Object.entries(featuresFor(db, card).axes)) {
      const w = v.p >= 1 ? THEME.lockedPayoff : v.e >= 1 ? THEME.lockedEnabler : 0;
      if (w > (out[axis] ?? 0)) out[axis] = w;
    }
  }
  for (const axis of Object.keys(out)) {
    if (out[axis] < THEME.floor) delete out[axis];
    else out[axis] = Math.round(out[axis] * 100) / 100;
  }
  return out;
}
