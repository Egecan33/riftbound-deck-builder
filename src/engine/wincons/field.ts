// The field: what the synced public lists of every legend run. New code.
//
// DATA, not rules: rates are shares of the stored lists (`LegendMeta`), weighted by each legend's list count.
// The lists are not weighted by tournament play rate, so "the field" means "the synced lists". HEURISTIC:
// `rateOfAny` assumes cards are included independently inside one legend's lists.
import type { Card, CardDb, LegendMeta } from '../types';
import { answersOf, type Answer } from './answers';

export interface FieldCard {
  card: Card;
  answers: Answer[];
  /** Share of the field's lists that run it in the main deck. */
  rate: number;
  /** Expected main-deck copies per field list. */
  copies: number;
}

export interface Field {
  lists: number;
  legends: { legend: Card; meta: LegendMeta }[];
  /** Main-deck cards of the field, most played first. */
  cards: FieldCard[];
  byId: ReadonlyMap<string, FieldCard>;
  /** Share of field lists running at least one of the cards. */
  rateOfAny(ids: readonly string[]): number;
}

/** Lists a legend needs before it counts toward the field. */
export const FIELD_MIN_LISTS = 3;

const cache = new WeakMap<CardDb, Field>();

export function fieldOf(db: CardDb): Field {
  const held = cache.get(db);
  if (held) return held;
  const legends: Field['legends'] = [];
  for (const card of db.all()) {
    if (card.type !== 'legend') continue;
    const meta = db.legendMeta(card.id);
    if (meta && meta.decks >= FIELD_MIN_LISTS) legends.push({ legend: card, meta });
  }
  legends.sort((a, b) => a.legend.id.localeCompare(b.legend.id));
  const lists = legends.reduce((n, l) => n + l.meta.decks, 0);
  const sums = new Map<string, { rate: number; copies: number }>();
  for (const { meta } of legends) {
    for (const [id, stat] of Object.entries(meta.main)) {
      const s = sums.get(id) ?? { rate: 0, copies: 0 };
      s.rate += meta.decks * stat.share;
      s.copies += meta.decks * stat.share * stat.avgCopies;
      sums.set(id, s);
    }
  }
  const cards: FieldCard[] = [];
  for (const [id, s] of sums) {
    const card = db.get(id);
    if (!card || lists === 0) continue;
    cards.push({ card, answers: answersOf(card), rate: s.rate / lists, copies: s.copies / lists });
  }
  cards.sort((a, b) => b.rate - a.rate || a.card.id.localeCompare(b.card.id));
  const field: Field = {
    lists, legends, cards, byId: new Map(cards.map((c) => [c.card.id, c])),
    rateOfAny(ids) {
      if (lists === 0 || ids.length === 0) return 0;
      let sum = 0;
      for (const { meta } of legends) {
        let miss = 1;
        for (const id of ids) miss *= 1 - Math.max(0, Math.min(1, meta.main[id]?.share ?? 0));
        sum += meta.decks * (1 - miss);
      }
      return sum / lists;
    },
  };
  cache.set(db, field);
  return field;
}

/** Expected main-deck copies of each card in a typical list of one legend, most played first. */
export function typicalList(meta: LegendMeta, db: CardDb, zone: 'main' | 'side' = 'main'): { card: Card; share: number; copies: number }[] {
  const out: { card: Card; share: number; copies: number }[] = [];
  for (const [id, stat] of Object.entries(zone === 'main' ? meta.main : meta.side)) {
    const card = db.get(id);
    if (card && stat.share > 0) out.push({ card, share: stat.share, copies: stat.share * stat.avgCopies });
  }
  return out.sort((a, b) => b.copies - a.copies || a.card.id.localeCompare(b.card.id));
}
