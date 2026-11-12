// Reads the stored public lists (`meta_decks`, `meta_deck_cards`) in the shape the evidence layer takes.
// The `features` step calls this; no network.
import type { PlayList } from '@/engine/evidence';
import type { LegalityData } from '@/engine/types';
import type { Db } from '@/server/db';
import { erasOf, META } from './meta';

const DAY = 86_400_000;

interface DeckRow { id: string; legend: string; editedAt: string; views: number; event: number; rank: string | null }

/**
 * Complete Standard lists with a legend, each with the weight the meta step gives a list
 * (placement-or-popularity x recency, HEURISTIC constants of META) and its era weight: 1 for the current
 * rules era, META.previousEraFactor for an older one. Unlike the per-legend meta rows, lists of older
 * eras are always kept (discounted): a card's evidence needs every list that could have run it.
 */
export function loadPlayLists(db: Db, legality: LegalityData, today: string = new Date().toISOString().slice(0, 10)): PlayList[] {
  const decks = db.prepare(
    "SELECT id, legend_id AS legend, edited_at AS editedAt, views, event, rank FROM meta_decks WHERE complete = 1 AND format = 'standard' AND legend_id IS NOT NULL ORDER BY id",
  ).all() as DeckRow[];
  const main = new Map<string, Record<string, number>>();
  for (const r of db.prepare("SELECT deck_id AS deck, card_id AS card, qty FROM meta_deck_cards WHERE zone = 'main'").all() as { deck: string; card: string; qty: number }[]) {
    const held = main.get(r.deck);
    if (held) held[r.card] = r.qty;
    else main.set(r.deck, { [r.card]: r.qty });
  }
  const eras = erasOf(legality, today);
  const currentFrom = eras[eras.length - 1]?.from ?? '0000-00-00';
  const newest = decks.reduce((t, d) => Math.max(t, Date.parse(d.editedAt) || 0), 0);
  return decks.map((d) => {
    const age = Math.max(0, (newest - (Date.parse(d.editedAt) || newest)) / DAY);
    const recency = 0.5 ** (age / META.halfLifeDays);
    const strength = d.event ? META.placement[d.rank ?? 'unknown'] * META.eventSizeUnknown : Math.log10(d.views + 10) / 4;
    return {
      id: d.id, legend: d.legend, date: (d.editedAt ?? '').slice(0, 10),
      weight: strength * recency,
      eraWeight: (d.editedAt ?? '').slice(0, 10) >= currentFrom ? 1 : META.previousEraFactor,
      main: main.get(d.id) ?? {},
    };
  }).filter((l) => l.weight > 0);
}
