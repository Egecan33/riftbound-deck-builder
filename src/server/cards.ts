import type { CardDetailResponse, CardLookup, CardPartner, ChampionsResponse, ClientCard, LegendTile } from '@/app/lib/api';
import { signaturesOf } from '@/engine/features';
import { eligibleChampions } from '@/engine/rules/champion';
import { cardFitsDeck } from '@/engine/rules/validate';
import { featuresFor, qtyOf } from '@/engine/summary';
import type { Card, CardDb, CardEdge, Deck, Domain, Format } from '@/engine/types';
import { getOwned } from './collection';
import { getAnalysis } from './context';
import { HttpError } from './http';
import { cacheSlot } from './state';
import { getCardDb, getDb } from './store';

export const imageOf = (cardId: string): string => `/api/img/${cardId}.webp`;

/** The card as the UI gets it. Cached: the same object is reused across responses until the data changes. */
export function clientCard(card: Card, db: CardDb = getCardDb()): ClientCard {
  const cache = cacheSlot('client-cards', () => new Map<string, ClientCard>());
  let out = cache.get(card.id);
  if (!out) {
    const { copyLimit, imageUrl: _imageUrl, printedText: _printedText, ...rest } = card;
    const f = featuresFor(db, card);
    out = { ...rest, copyLimit: Number.isFinite(copyLimit) ? copyLimit : null, image: imageOf(card.id), roles: f.roles, speed: f.speed, rating: Math.round(f.evaluatedRating), grade: f.grade };
    cache.set(card.id, out);
  }
  return out;
}

/** Client cards for the ids the data knows; unknown ids are left out. */
export function cardLookup(ids: Iterable<string | null | undefined>): CardLookup {
  const db = getCardDb();
  const out: CardLookup = {};
  for (const id of ids) {
    if (!id || out[id]) continue;
    const card = db.get(id);
    if (card) out[id] = clientCard(card, db);
  }
  return out;
}

/** Every id a deck names. */
export const deckIds = (deck: Deck): string[] => [
  ...new Set([deck.legend, deck.champion, ...deck.main.map((e) => e.id), ...deck.side.map((e) => e.id), ...deck.battlefields, ...deck.extraLegends, deck.teammate?.legend ?? null, ...(deck.teammate?.battlefields ?? [])].filter((id): id is string => !!id)),
];

/** Formats whose ban list names the card (from the synced legality snapshot; no list in code). */
export function bannedIn(card: Card, db: CardDb = getCardDb()): Format[] {
  const out = new Set<Format>();
  // Bans are by rules name, resolved the way the engine resolves them (scoring/bridge.ts bannedIds).
  for (const ban of db.legality().bans) if (db.byName(ban.name)?.id === card.id) for (const f of ban.formats) out.add(f);
  return [...out];
}

const DOMAINS: readonly string[] = ['fury', 'calm', 'mind', 'body', 'chaos', 'order'];

/** GET /api/legends: every legend, most public lists first, then by name. */
export function listLegends(q: string | null, domains: string | null): LegendTile[] {
  const db = getCardDb();
  const all = cacheSlot<{ db: CardDb | null; tiles: LegendTile[] }>('legend-tiles', () => ({ db: null, tiles: [] }));
  if (all.db !== db) {
    all.db = db;
    all.tiles = db.all().filter((c) => c.type === 'legend').map((card) => {
      const meta = db.legendMeta(card.id);
      return { card: clientCard(card, db), champions: eligibleChampions(card, db).length, meta: meta ? { decks: meta.decks, quality: meta.quality } : null, bannedIn: bannedIn(card, db) };
    }).sort((a, b) => (b.meta?.decks ?? 0) - (a.meta?.decks ?? 0) || a.card.name.localeCompare(b.card.name));
  }
  const want = (domains ?? '').split(',').map((d) => d.trim().toLowerCase()).filter((d) => DOMAINS.includes(d)) as Domain[];
  const needle = (q ?? '').trim().toLowerCase();
  return all.tiles.filter((t) =>
    want.every((d) => t.card.domains.includes(d)) &&
    (!needle || t.card.name.toLowerCase().includes(needle) || (t.card.championTag ?? '').toLowerCase().includes(needle) || t.card.tags.some((tag) => tag.toLowerCase().includes(needle))));
}

/** GET /api/champions?legend: the champion units the legend may choose, most registered first, and its signature cards. */
export function championsOf(legendId: string | null): ChampionsResponse {
  const db = getCardDb();
  const legend = legendId ? db.get(legendId) : undefined;
  if (!legend || legend.type !== 'legend') throw new HttpError(404, 'No legend with that id.');
  const meta = db.legendMeta(legend.id);
  const champions = eligibleChampions(legend, db)
    .map((card) => ({ card: clientCard(card, db), share: meta ? meta.champions[card.id] ?? 0 : null, bannedIn: bannedIn(card, db) }))
    .sort((a, b) => (b.share ?? 0) - (a.share ?? 0) || b.card.rating - a.card.rating || a.card.name.localeCompare(b.card.name));
  return { legend: clientCard(legend, db), champions, signatures: signaturesOf(legend, db).map((c) => clientCard(c, db)) };
}

export const MAX_PARTNERS = 12;
export const MAX_CONFLICTS = 6;

/** GET/POST /api/card/:id. With a deck: the card's score against it and the deck's own partners first. */
export function cardDetail(id: string, deck: Deck | null): CardDetailResponse {
  const db = getCardDb();
  const card = db.get(id) ?? db.byName(id);
  if (!card) throw new HttpError(404, 'No card with that id.');
  const inMain = new Map<string, number>();
  if (deck) for (const e of deck.main) inMain.set(e.id, (inMain.get(e.id) ?? 0) + qtyOf(e));
  const partner = (edge: CardEdge): CardPartner | null => {
    const other = db.get(edge.a === card.id ? edge.b : edge.a);
    if (!other || other.id === card.id) return null;
    const fits = !deck || cardFitsDeck(other, other.type === 'battlefield' ? 'battlefields' : other.type === 'legend' ? 'legend' : 'main', deck, db)?.severity !== 'error';
    return { card: clientCard(other, db), net: edge.net, synergy: edge.synergy, antisynergy: edge.antisynergy, reasons: edge.reasons, inDeck: inMain.get(other.id) ?? 0, fits };
  };
  const all = db.edges(card.id).map(partner).filter((p): p is CardPartner => p !== null);
  // With a deck: its own cards first, then cards it could run, then the rest.
  const held = (p: CardPartner): number => (p.inDeck > 0 ? 2 : p.fits ? 1 : 0);
  const partners = all.filter((p) => p.net > 0).sort((a, b) => held(b) - held(a) || b.net - a.net || a.card.name.localeCompare(b.card.name)).slice(0, MAX_PARTNERS);
  const conflicts = all.filter((p) => p.net < 0).sort((a, b) => held(b) - held(a) || a.net - b.net || a.card.name.localeCompare(b.card.name)).slice(0, MAX_CONFLICTS);
  const zone = card.type === 'battlefield' ? 'battlefields' : 'main';
  const printings = getDb().prepare('SELECT code, set_code AS "set", variant, rarity FROM printings WHERE card_id = ? ORDER BY code').all(card.id) as CardDetailResponse['printings'];
  return {
    card: clientCard(card, db),
    printedText: card.errata && card.printedText !== card.text ? card.printedText : null,
    features: db.features(card.id) ?? featuresFor(db, card),
    score: deck ? getAnalysis(deck).scorer.score(card, zone) : null,
    partners, conflicts, printings,
    bannedIn: bannedIn(card, db),
    owned: getOwned()[card.id] ?? 0,
  };
}
