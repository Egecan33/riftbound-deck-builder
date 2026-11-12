// Play data in the builder (stage 3 review of plan Task 8). New code, pure.
//
// The first builder ranked candidates by the card score alone, where the legend's public lists weigh at most
// 10 points of 100. Measured on the synced pool (58 legends, best-of-three, seed 1): the Kai'Sa build left out
// six cards that all 27 of her public lists run and took four that none runs, and cards almost no list plays
// (Guttural Roar, 1% of the lists that could run it; Smoke and Mirrors, 7%) were in half of all builds.
// Spec 9: the power target changes "how much the meta inclusion data weighs". This file is that weight for the
// builder: what the data says is DATA (shares, list counts), how much it moves a pick is HEURISTIC.
import { legendOf } from '../rules/identity';
import { featuresFor } from '../summary';
import type { Card, CardDb, Deck, PowerTarget } from '../types';

/** HEURISTIC weights; the shares and list counts they multiply are measured. */
export const LEAN = {
  /** Points (card-score scale) for a card the legend's lists run at `fullShare` or more; half of it is lost by a card none of them runs. */
  legend: { competitive: 14, focused: 8, casual: 0 } as Record<PowerTarget, number>,
  /** Points lost by a card that almost no list of any legend runs although many could. */
  field: { competitive: 10, focused: 5, casual: 0 } as Record<PowerTarget, number>,
  /** Lists of the legend before its data is used at all, and the pseudo-lists the weight is shrunk with. */
  minLists: 4, prior: 8, fullShare: 0.6,
  /** A field share under this is "almost unplayed"; the penalty grows linearly to its full size at 0%. */
  lowShare: 0.15, fieldPrior: 20,
  /**
   * Core cards: a card run by at least this share of the legend's lists (and by `coreCardLists` of them) is
   * taken before the quota phases, at the copies those lists run. Casual builds take no core.
   */
  coreShare: { competitive: 0.6, focused: 0.75, casual: 2 } as Record<PowerTarget, number>,
  coreCardLists: 3,
  /** A stored partner of the Chosen Champion is seeded only if this share of the legend's lists run it (when it has lists). */
  partnerShare: 0.2,
} as const;

const pct = (x: number): string => `${Math.round(x * 100)}%`;

export interface Lean { value: number; text: string | null }

/** How far the play data moves a main-deck candidate, with the sentence that says why (null when it says nothing). */
export function playLean(card: Card, deck: Deck, db: CardDb): Lean {
  const power: PowerTarget = deck.power ?? 'focused';
  const legend = legendOf(deck, db);
  const meta = legend ? db.legendMeta(legend.id) : undefined;
  let value = 0;
  const texts: string[] = [];
  const stat = meta?.main[card.id];
  const wLegend = LEAN.legend[power] ?? 0;
  if (legend && meta && meta.decks >= LEAN.minLists && wLegend > 0) {
    const conf = meta.decks / (meta.decks + LEAN.prior);
    if (stat && stat.share > 0) {
      value += wLegend * conf * Math.min(1, stat.share / LEAN.fullShare);
      texts.push(`${pct(stat.share)} of ${meta.decks} public ${legend.name} lists run it`);
    } else {
      value -= wLegend * conf * 0.5;
      texts.push(`none of ${meta.decks} public ${legend.name} lists runs it`);
    }
  }
  const e = featuresFor(db, card).evidence;
  const wField = LEAN.field[power] ?? 0;
  if (e && !e.banned && wField > 0 && e.share < LEAN.lowShare && e.eligibleLists > 0 && !(stat && stat.share >= 0.3)) {
    const conf = e.nEff / (e.nEff + LEAN.fieldPrior);
    value -= wField * conf * (1 - e.share / LEAN.lowShare);
    texts.push(`${e.lists} of the ${e.eligibleLists} public lists that could run it do`);
  }
  return { value: Math.round(value * 10) / 10, text: texts.length ? `Play data ${value >= 0 ? '+' : ''}${(Math.round(value * 10) / 10).toFixed(1)} (heuristic weight): ${texts.join('; ')}` : null };
}

/** The legend's core cards (data), most played first, with the copies its lists run. Empty without enough lists. */
export function coreCards(deck: Deck, db: CardDb): { card: Card; copies: number; share: number; lists: number; of: number }[] {
  const legend = legendOf(deck, db);
  const meta = legend ? db.legendMeta(legend.id) : undefined;
  const need = LEAN.coreShare[deck.power ?? 'focused'] ?? 2;
  if (!meta || meta.decks < LEAN.minLists) return [];
  const out: { card: Card; copies: number; share: number; lists: number; of: number }[] = [];
  for (const [id, stat] of Object.entries(meta.main)) {
    const card = db.get(id);
    if (!card || !Number.isFinite(stat.share) || stat.share < need || stat.decks < LEAN.coreCardLists) continue;
    out.push({ card, copies: Math.max(1, Math.round(stat.avgCopies)), share: stat.share, lists: stat.decks, of: meta.decks });
  }
  return out.sort((a, b) => b.share - a.share || b.copies - a.copies || a.card.id.localeCompare(b.card.id));
}
