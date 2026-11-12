import type { BrowseZone, CardFilters, CardSort, CardsResponse, ScoredCard } from '@/app/lib/api';
import { featuresFor, qtyOf } from '@/engine/summary';
import type { Card, CardDb, CardFeatures, Deck, Domain } from '@/engine/types';
import { clientCard } from './cards';
import { getOwned } from './collection';
import { getAnalysis, poolCards } from './context';
import { HttpError, intParam, isObject, type Body } from './http';
import { cacheSlot } from './state';

export const DEFAULT_PAGE_SIZE = 60;
export const MAX_PAGE_SIZE = 200;
export const ZONES: readonly BrowseZone[] = ['main', 'side', 'battlefields'];
export const SORTS: readonly CardSort[] = ['score', 'name', 'energy', 'rating', 'popularity'];

interface Indexed { card: Card; f: CardFeatures; hay: string; name: string }

/** Per-card search text and features, same order as `poolCards`. Cached per card database and pool. */
function indexOf(db: CardDb, zone: BrowseZone): Indexed[] {
  const pool = zone === 'battlefields' ? 'battlefields' : 'main';
  const held = cacheSlot<{ db: CardDb | null; byPool: Map<string, Indexed[]> }>('browse-index', () => ({ db: null, byPool: new Map() }));
  if (held.db !== db) {
    held.db = db;
    held.byPool.clear();
  }
  let rows = held.byPool.get(pool);
  if (!rows) {
    rows = poolCards(db, zone).map((card) => ({
      card, f: featuresFor(db, card), name: card.name.toLowerCase(),
      hay: [card.name, card.code, card.type ?? '', card.tags.join(' '), card.keywords.join(' '), card.superTypes.join(' '), card.text].join('\n').toLowerCase(),
    }));
    held.byPool.set(pool, rows);
  }
  return rows;
}

function readFilters(raw: unknown): CardFilters {
  if (raw === undefined || raw === null) return {};
  if (!isObject(raw)) throw new HttpError(400, 'filters must be an object.');
  const out: CardFilters = {};
  const str = (k: 'type' | 'role' | 'axis' | 'speed' | 'superType' | 'set') => {
    const v = raw[k];
    if (typeof v === 'string' && v) (out as Record<string, unknown>)[k] = v;
  };
  for (const k of ['type', 'role', 'axis', 'speed', 'superType', 'set'] as const) str(k);
  if (Array.isArray(raw.domains)) {
    const domains = raw.domains.filter((d): d is Domain => typeof d === 'string');
    if (domains.length > 0) out.domains = domains;
  }
  for (const k of ['energyMin', 'energyMax'] as const) if (typeof raw[k] === 'number' && Number.isFinite(raw[k])) out[k] = raw[k] as number;
  for (const k of ['owned', 'inDeck', 'hideGated'] as const) if (typeof raw[k] === 'boolean') out[k] = raw[k] as boolean;
  return out;
}

/**
 * POST /api/cards: the cards that can go into a zone, scored against the deck, filtered, sorted and
 * paged. Gated cards (banned, outside the Domain Identity, incomplete data) come last whatever the
 * sort, each with its reason, unless `filters.hideGated` leaves them out. The scored pool and each sort
 * order are kept with the deck's analysis, so a second page or another filter costs a scan.
 */
export function browseCards(deck: Deck, body: Body): CardsResponse {
  const zone = (body.zone ?? 'main') as BrowseZone;
  if (!ZONES.includes(zone)) throw new HttpError(400, `zone must be one of ${ZONES.join(', ')}.`);
  const sort = (body.sort ?? 'score') as CardSort;
  if (!SORTS.includes(sort)) throw new HttpError(400, `sort must be one of ${SORTS.join(', ')}.`);
  if (body.dir !== undefined && body.dir !== 'asc' && body.dir !== 'desc') throw new HttpError(400, 'dir must be asc or desc.');
  const dir: 'asc' | 'desc' = body.dir ?? (sort === 'name' || sort === 'energy' ? 'asc' : 'desc');
  const filters = readFilters(body.filters);
  const page = intParam(body.page, 1, 1, 100000);
  const pageSize = intParam(body.pageSize, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
  const terms = (typeof body.q === 'string' ? body.q : '').toLowerCase().split(/\s+/).filter(Boolean).slice(0, 8);

  const analysis = getAnalysis(deck);
  const db = analysis.db;
  const pool = analysis.pool(zone);
  const rows = indexOf(db, zone);
  const owned = getOwned();
  const inZone = new Map<string, number>();
  if (zone === 'battlefields') for (const id of deck.battlefields) inZone.set(id, (inZone.get(id) ?? 0) + 1);
  else for (const e of zone === 'side' ? deck.side : deck.main) inZone.set(e.id, (inZone.get(e.id) ?? 0) + qtyOf(e));

  const sign = dir === 'asc' ? 1 : -1;
  const byName = (a: number, b: number) => rows[a].name.localeCompare(rows[b].name) || rows[a].card.id.localeCompare(rows[b].card.id);
  const num = (value: (i: number) => number | null) => (a: number, b: number) => {
    const va = value(a);
    const vb = value(b);
    if (va === null || vb === null) return va === vb ? byName(a, b) : va === null ? 1 : -1; // no value: last in both directions
    return sign * (va - vb) || byName(a, b);
  };
  const compare =
    sort === 'name' ? (a: number, b: number) => sign * byName(a, b)
    : sort === 'energy' ? num((i) => rows[i].card.energy)
    : sort === 'rating' ? num((i) => rows[i].f.evaluatedRating)
    : sort === 'popularity' ? num((i) => rows[i].f.evidence?.share ?? null)
    : (a: number, b: number) => sign * (pool.scores[a].score - pool.scores[b].score) || rows[b].f.evaluatedRating - rows[a].f.evaluatedRating || byName(a, b);
  const order = pool.order(`${sort}:${dir}`, compare);

  const keep = (i: number): boolean => {
    const { card, f, hay } = rows[i];
    if (filters.hideGated && pool.scores[i].gate) return false;
    if (filters.type && card.type !== filters.type) return false;
    if (filters.role && !f.roles.includes(filters.role)) return false;
    if (filters.axis && !f.axes[filters.axis]) return false;
    if (filters.speed && f.speed !== filters.speed) return false;
    if (filters.superType && !card.superTypes.includes(filters.superType)) return false;
    if (filters.set && !card.sets.includes(filters.set.toUpperCase())) return false;
    if (filters.domains && !filters.domains.some((d) => card.domains.includes(d))) return false;
    if (filters.energyMin !== undefined && (card.energy ?? 0) < filters.energyMin) return false;
    if (filters.energyMax !== undefined && (card.energy ?? 0) > filters.energyMax) return false;
    if (filters.owned && !(owned[card.id] > 0)) return false;
    if (filters.inDeck !== undefined && (inZone.get(card.id) ?? 0) > 0 !== filters.inDeck) return false;
    for (const term of terms) if (!hay.includes(term)) return false;
    return true;
  };

  const start = (page - 1) * pageSize;
  const cards: ScoredCard[] = [];
  let total = 0;
  let gated = 0;
  for (const i of order) {
    if (!keep(i)) continue;
    if (pool.scores[i].gate) gated++;
    if (total >= start && cards.length < pageSize) {
      const card = rows[i].card;
      cards.push({ card: clientCard(card, db), score: pool.scores[i], inDeck: inZone.get(card.id) ?? 0, owned: owned[card.id] ?? 0 });
    }
    total++;
  }
  return { total, gated, page, pageSize, zone, cards };
}
