// Rune split (docs/research/deck-theory.md section 3.2). New code.
//
// HEURISTIC formula fitted to 406 public lists: exact match with the player's split in about 48% of lists,
// within one rune in about 89%. Demand of a domain = printed Power pips of the deck's cards payable with
// that domain (a card payable with two domains splits its pips evenly) + that domain's symbols in rules text
// outside reminder text, summed over the Main Deck with copies.
import { legendOf } from '../rules/identity';
import { RUNE_DECK_SIZE } from '../rules/formats';
import type { CardDb, Deck, Domain } from '../types';

const SYMBOL: Record<Domain, RegExp> = {
  fury: /\[Fury\]/g, calm: /\[Calm\]/g, mind: /\[Mind\]/g, body: /\[Body\]/g, chaos: /\[Chaos\]/g, order: /\[Order\]/g,
};

/** Power demand per domain of the legend. Empty when the deck has no usable legend. */
export function runeDemand(deck: Deck, db: CardDb): Partial<Record<Domain, number>> {
  const legend = legendOf(deck, db);
  const out: Partial<Record<Domain, number>> = {};
  if (!legend) return out;
  for (const d of legend.domains) out[d] = 0;
  for (const entry of deck.main) {
    const card = db.get(entry.id);
    const qty = Number.isFinite(entry.qty) ? Math.max(0, entry.qty) : 0;
    if (!card || qty === 0) continue;
    const payable = (card.powerDomains.length ? card.powerDomains : card.domains).filter((d) => d in out);
    if ((card.power ?? 0) > 0 && payable.length > 0) for (const d of payable) out[d] = (out[d] ?? 0) + (qty * (card.power ?? 0)) / payable.length;
    const text = card.text.replace(/\([^)]*\)/g, ' ');
    for (const d of legend.domains) out[d] = (out[d] ?? 0) + qty * (text.match(SYMBOL[d])?.length ?? 0);
  }
  return out;
}

/**
 * Recommended runes per domain, summing to the Rune Deck size (12).
 * Two domains: major = clamp(round(6 + 6 x (s - 0.5)), 6, 9) where s is the larger demand's share; no demand
 * at all gives 6/6. One domain: all 12. No legend: {} (nothing to recommend, never a throw).
 */
export function runeSplit(deck: Deck, db: CardDb): Partial<Record<Domain, number>> {
  const legend = legendOf(deck, db);
  const domains = legend ? [...new Set(legend.domains)] : [];
  if (domains.length === 0) return {};
  if (domains.length === 1) return { [domains[0]]: RUNE_DECK_SIZE };
  const demand = runeDemand(deck, db);
  if (domains.length === 2) {
    const [a, b] = domains;
    const da = demand[a] ?? 0;
    const db2 = demand[b] ?? 0;
    const total = da + db2;
    const half = RUNE_DECK_SIZE / 2;
    if (total <= 0) return { [a]: half, [b]: RUNE_DECK_SIZE - half };
    const s = Math.max(da, db2) / total;
    const major = Math.max(half, Math.min(9, Math.round(half + half * (s - 0.5))));
    const majorDomain = da >= db2 ? a : b;
    const minorDomain = majorDomain === a ? b : a;
    return { [majorDomain]: major, [minorDomain]: RUNE_DECK_SIZE - major };
  }
  // No legend has more than two domains today; share the runes by demand, largest remainder first.
  const total = domains.reduce((n, d) => n + (demand[d] ?? 0), 0);
  const exact = domains.map((d) => (total > 0 ? ((demand[d] ?? 0) / total) * RUNE_DECK_SIZE : RUNE_DECK_SIZE / domains.length));
  const split = exact.map(Math.floor);
  let left = RUNE_DECK_SIZE - split.reduce((a, b) => a + b, 0);
  for (const i of exact.map((x, i) => [x - Math.floor(x), i] as const).sort((x, y) => y[0] - x[0] || x[1] - y[1]).map(([, i]) => i)) {
    if (left <= 0) break;
    split[i] += 1;
    left -= 1;
  }
  return Object.fromEntries(domains.map((d, i) => [d, split[i]])) as Partial<Record<Domain, number>>;
}
