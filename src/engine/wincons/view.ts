// A deck resolved for analysis: the cards the report may count, with their library copies. New code.
//
// wincons.md V6 items 2 and 3: legality runs first (a card banned in the deck's format is never part of a
// plan) and a card whose source row is incomplete is left out of every count (fail closed). Both are listed
// in `excluded` so the report can say so. Partial decks (no legend, no champion, 7 cards) resolve to whatever
// is there; nothing here throws.
import { formatName, formatRules } from '../rules/formats';
import { legendOf } from '../rules/identity';
import { nameKey } from '../rules/names';
import type { Card, CardDb, CardFeatures, Deck, DeckEntry, Domain } from '../types';
import { formatFacts, type FormatFacts } from './facts';
import { sentencesOf } from './answers';

export interface DeckCard {
  card: Card;
  features: CardFeatures | undefined;
  traits: ReadonlySet<string>;
  /** Copies in the zone. */
  qty: number;
  /** Copies in the library: the Chosen Champion's Champion Zone copy is not drawn (CR 103.3.a.1). */
  lib: number;
  champion: boolean;
  /** Runes on board needed to play it: max(Energy, Power), because an exhausted rune can still be recycled (CR 164.2). */
  need: number;
  /** Current text as sentences, reminder text removed. */
  sentences: string[];
  rating: number;
}

export interface DeckView {
  deck: Deck;
  db: CardDb;
  facts: FormatFacts;
  legend: DeckCard | null;
  champion: DeckCard | null;
  /** Main-deck cards that count: legal in the format, complete, unit / spell / gear. Sorted by name. */
  main: DeckCard[];
  side: DeckCard[];
  battlefields: DeckCard[];
  excluded: { card: Card; why: string }[];
  /** Cards in the library (the main cards that count, without the Champion Zone copy). */
  library: number;
  runes: { total: number; byDomain: Partial<Record<Domain, number>> };
  ids: ReadonlySet<string>;
  byId: ReadonlyMap<string, DeckCard>;
}

export const runeNeed = (card: Card): number => Math.max(card.energy ?? 0, card.power ?? 0);

const qtyOf = (entry: DeckEntry): number => (Number.isFinite(entry.qty) ? Math.max(0, Math.floor(entry.qty)) : 0);

export function deckCard(card: Card, db: CardDb, qty = 1, champion = false): DeckCard {
  const features = db.features(card.id);
  return {
    card, features, traits: new Set(features?.traits ?? []), qty, lib: Math.max(0, qty - (champion ? 1 : 0)), champion,
    need: runeNeed(card), sentences: sentencesOf(card), rating: features?.evaluatedRating ?? features?.baseRating ?? 50,
  };
}

export function viewDeck(deck: Deck, db: CardDb): DeckView {
  const facts = formatFacts(deck.format);
  const banList = formatRules(deck.format, db.legality()).banListOf;
  const banned = new Map<string, string>(); // name key -> zone
  for (const ban of db.legality().bans) if (ban.formats.includes(banList)) banned.set(`${ban.zone}:${nameKey(ban.name)}`, ban.name);
  const isBanned = (card: Card, zone: 'main' | 'battlefields' | 'legend'): boolean => banned.has(`${zone}:${nameKey(card.name)}`);
  const excluded: DeckView['excluded'] = [];

  const zone = (entries: readonly DeckEntry[], championId: string | null): DeckCard[] => {
    const merged = new Map<string, number>();
    for (const e of entries ?? []) if (qtyOf(e) > 0) merged.set(e.id, (merged.get(e.id) ?? 0) + qtyOf(e));
    const out: DeckCard[] = [];
    for (const [id, qty] of merged) {
      const card = db.get(id);
      if (!card) continue;
      if (card.dataIncomplete) { excluded.push({ card, why: 'its source row is incomplete' }); continue; }
      if (card.type !== 'unit' && card.type !== 'spell' && card.type !== 'gear') continue;
      if (isBanned(card, 'main')) { excluded.push({ card, why: `it is banned in ${formatName(deck.format)}` }); continue; }
      out.push(deckCard(card, db, qty, card.id === championId));
    }
    return out.sort((a, b) => a.card.name.localeCompare(b.card.name) || a.card.id.localeCompare(b.card.id));
  };

  const main = zone(deck.main ?? [], deck.champion);
  const side = zone(deck.side ?? [], null);
  const legendCard = legendOf(deck, db);
  const legend = legendCard && !legendCard.dataIncomplete && !isBanned(legendCard, 'legend') ? deckCard(legendCard, db) : null;
  const battlefields: DeckCard[] = [];
  for (const id of deck.battlefields ?? []) {
    const card = db.get(id);
    if (!card || card.type !== 'battlefield' || card.dataIncomplete) continue;
    if (isBanned(card, 'battlefields')) { excluded.push({ card, why: `it is banned in ${formatName(deck.format)}` }); continue; }
    if (!battlefields.some((b) => b.card.id === card.id)) battlefields.push(deckCard(card, db));
  }
  const byDomain: Partial<Record<Domain, number>> = {};
  let total = 0;
  for (const [d, n] of Object.entries(deck.runes ?? {})) {
    const q = Number.isFinite(n) ? Math.max(0, Math.floor(n as number)) : 0;
    if (q > 0) { byDomain[d as Domain] = q; total += q; }
  }
  const byId = new Map(main.map((c) => [c.card.id, c]));
  return {
    deck, db, facts, legend, champion: main.find((c) => c.champion) ?? null, main, side, battlefields, excluded,
    library: main.reduce((n, c) => n + c.lib, 0), runes: { total, byDomain },
    ids: new Set(byId.keys()), byId,
  };
}

/** P(at least one of `copies` among `seen` cards of the library). 0 for an empty library or no copies. */
export function pSeen(copies: number, seen: number, library: number): number {
  const N = Math.max(0, Math.floor(library));
  const K = Math.max(0, Math.min(N, Math.floor(copies)));
  const n = Math.max(0, Math.min(N, Math.floor(seen)));
  if (N === 0 || K === 0 || n === 0) return 0;
  if (n > N - K) return 1;
  let miss = 1;
  for (let i = 0; i < n; i += 1) miss *= (N - K - i) / (N - i);
  return 1 - miss;
}

/** "A, B and C" with at most `max` names and "+N more". */
export function nameList(names: readonly string[], max = 4): string {
  const unique = [...new Set(names)];
  const shown = unique.slice(0, max);
  const rest = unique.length - shown.length;
  if (shown.length === 0) return '';
  if (rest > 0) return `${shown.join(', ')} +${rest} more`;
  return shown.length === 1 ? shown[0] : `${shown.slice(0, -1).join(', ')} and ${shown[shown.length - 1]}`;
}

/** A legend's rules name is its title ("Heart of the Tempest"); official prose puts the champion first. */
export const displayName = (card: Card): string => (card.type === 'legend' && card.championTag && !card.name.toLowerCase().includes(card.championTag.toLowerCase()) ? `${card.championTag}, ${card.name}` : card.name);

export const pct = (p: number): string => `${Math.round(Math.max(0, Math.min(1, p)) * 100)}%`;
