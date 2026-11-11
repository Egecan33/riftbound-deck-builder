// `meta` step: public deck lists from Piltover Archive (docs/research/meta-sources.md §3.2, §8).
// Page parsing is ported from the research prototypes docs/research/analysis/{pa-lib,crawl-list,fetch-decks}.mjs.
//
// Polite by construction: serial, at least 1.5 s between requests, a cap per run, stop after three
// failures in a row, never the same deck twice unless it was edited. /api/ is disallowed by the site's
// robots.txt and is not called. Author names, avatars and handles are not stored.
//
// Everything about weighting below is HEURISTIC (meta-sources.md §8 says so too); the constants sit in META.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Card, CardDb, Domain, LegalityData } from '@/engine/types';
import { invalidateCardDb, loadCardDb } from '@/server/carddb';
import { RAW_DIR, readSyncState, writeSyncState, type Db } from '@/server/db';
import type { Log } from './cards';
import { getText, type HttpOptions } from './http';

export const PA_BASE = 'https://piltoverarchive.com';
export const OWN_DECK_CACHE = path.join(RAW_DIR, 'pa-decks.jsonl');
export const OWN_LIST_CACHE = path.join(RAW_DIR, 'pa-list.jsonl');
/** Raw downloads of the research stage (gitignored). Used first when present, so nothing is fetched twice. */
export const RESEARCH_RAW_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), 'docs', 'research', 'analysis', 'raw');

/** HEURISTIC constants (meta-sources.md §8.1-§8.3). */
export const META = {
  minGapMs: 1500,
  defaultMaxRequests: 150,
  listingPages: 3,
  halfLifeDays: 21,            // recency weight 0.5 ^ (age / 21), age measured from the newest list in the data
  previousEraFactor: 0.25,     // lists from before the latest set or ban change, used only when the current era is thin
  nEffOk: 20,                  // effective sample size for quality "ok"; also the point where older lists stop being added
  nEffThin: 8,                 // below this a legend's numbers are "insufficient"
  eventSizeUnknown: 0.75,
  placement: { '1': 1.25, '2': 1.15, '3-4': 1.05, '5-8': 0.95, other: 0.85, unknown: 0.8 } as Record<string, number>,
  minViews: 500,               // a community list needs this many views or an event-looking name to be fetched
} as const;

/** `type` and `domains` are the site's own card data, kept only to cross-check gallery rows during review. */
export interface PaEntry { q: number; name: string; code: string | null; type?: string | null; domains?: string[] }
export interface PaDeck {
  id: string; name: string; views: number; likes: number; createdAt: string; editedAt: string;
  legend: { name: string | null; code: string | null };
  champions: PaEntry[]; battlefields: PaEntry[]; runes: PaEntry[]; main: PaEntry[]; side: PaEntry[];
}
export interface PaListRow { id: string; name: string; views: number; likes: number; createdAt: string; editedAt: string; legendCode: string | null; sets: string[]; isLegal: boolean }

// ---------- page parsing ----------

/** Concatenates the Next.js flight payload chunks embedded in a page. */
export function flight(html: string): string {
  const out: string[] = [];
  const re = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try { out.push(JSON.parse(`"${m[1]}"`) as string); } catch { /* a chunk that is not a string literal carries no data */ }
  }
  return out.join('');
}

/** The balanced JSON value that starts at index i ('{' or '['), or null. */
export function balanced(s: string, i: number): string | null {
  const open = s[i];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inStr = false;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (inStr) { if (c === '\\') j++; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close && --depth === 0) return s.slice(i, j + 1);
  }
  return null;
}

type Json = Record<string, unknown>;
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const dateOf = (v: unknown): string => str(v).replace(/^\$D/, '');

function entries(list: unknown): PaEntry[] {
  if (!Array.isArray(list)) return [];
  return list.map((raw) => {
    const e = raw as Json;
    const card = (e.card ?? {}) as Json;
    const variants = (Array.isArray(card.cardVariants) ? card.cardVariants : []) as Json[];
    const variant = variants.find((v) => v.id === e.variantId) ?? variants[0];
    const colors = (Array.isArray(card.cardColors) ? card.cardColors : []) as Json[];
    const domains = colors.map((c) => str(((c.color ?? c) as Json).name).toLowerCase()).filter(Boolean);
    return { q: num(e.quantity), name: str(card.name), code: variant ? str(variant.variantNumber) || null : null, type: str(card.type).toLowerCase() || null, domains };
  });
}

/** One deck from a /decks/view/{id} page; null when the page holds no deck. The author is not read. */
export function parseDeckPage(html: string): PaDeck | null {
  const s = flight(html);
  const k = s.indexOf('"legendId"');
  if (k === -1) return null;
  const i = s.lastIndexOf('{"id":"', k);
  const json = i === -1 ? null : balanced(s, i);
  if (!json) return null;
  let o: Json;
  try { o = JSON.parse(json) as Json; } catch { return null; }
  const legend = (o.legend ?? {}) as Json;
  return {
    id: str(o.id), name: str(o.name), views: num(o.views), likes: num(o.likes),
    createdAt: dateOf(o.createdAt), editedAt: dateOf(o.editedAt),
    legend: { name: str(((legend.card ?? {}) as Json).name) || null, code: str(legend.variantNumber) || null },
    champions: entries(o.champions), battlefields: entries(o.battlefields), runes: entries(o.runes),
    main: entries(o.maindeck), side: entries(o.sideboard),
  };
}

/** The deck rows of a /decks?page=N listing page. */
export function parseListingPage(html: string): PaListRow[] {
  const s = flight(html);
  for (const m of s.matchAll(/\[\{"id":"[0-9a-f-]{36}","name":/g)) {
    const json = balanced(s, m.index);
    if (!json) continue;
    let arr: Json[];
    try { arr = JSON.parse(json) as Json[]; } catch { continue; }
    if (!arr[0]?.createdAt || arr[0]?.authorName === undefined) continue; // the legend and set filter arrays look similar
    return arr.map((d) => ({
      id: str(d.id), name: str(d.name), views: num(d.views), likes: num(d.likes),
      createdAt: dateOf(d.createdAt), editedAt: dateOf(d.editedAt),
      legendCode: str(((d.legend ?? {}) as Json).variantNumber) || null,
      sets: (Array.isArray(d.sets) ? (d.sets as Json[]) : []).map((x) => str(x.prefix)).filter(Boolean),
      isLegal: d.isLegal !== false,
    }));
  }
  return [];
}

// ---------- name heuristics ----------

// HEURISTIC, from docs/research/analysis/select-tournament.mjs: Piltover Archive has no structured event,
// placement or format field; for imported tournament lists they are only in the deck name.
const EVENT_RE = /\b(RQ|RC|regionals?|qualifier|championship|top[ -]?(4|8|16|32|64)|t(4|8|16|32)\b|#\d+|\d+(st|nd|rd|th)( place)?|winner|winning|won\b|champion\b|finalist|finals?\b|best[- ]of|undefeated|\d+-\d+(-\d+)?\b|showdown|nexus night|nexus cup|skirmish|major\b|regional open|invitational|worlds|store championship|1er|1°)|🏆|🥇|🥈|🥉/i;
const SKIP_RE = /champion deck|precon|showdown deck|win-a-case/i;
const MULTI_RE = /\b(2v2|2 v 2|two[- ]headed|ffa|free[- ]for[- ]all|multiplayer|\bMP\b)/i;

export interface NameClass { event: boolean; rank: string | null; format: 'standard' | '2v2' | 'ffa' }

export function classifyName(name: string): NameClass {
  const multi = MULTI_RE.exec(name)?.[1]?.toLowerCase() ?? null;
  const format = multi === null ? 'standard' : /2|two/.test(multi) ? '2v2' : 'ffa';
  const event = EVENT_RE.test(name) && !SKIP_RE.test(name);
  let rank: string | null = null;
  if (event) {
    if (/#1\b|\b1st\b|winner|winning|\bwon\b|🏆|🥇|1er|1°/i.test(name)) rank = '1';
    else if (/#2\b|\b2nd\b|finalist|🥈/i.test(name)) rank = '2';
    else if (/#[34]\b|\b(3rd|4th)\b|top[ -]?4\b|\bt4\b|🥉/i.test(name)) rank = '3-4';
    else if (/#[5-8]\b|\b[5-8]th\b|top[ -]?8\b|\bt8\b/i.test(name)) rank = '5-8';
    else if (/#\d+\b|\b\d+th\b|top[ -]?(16|32|64)\b|\bt(16|32)\b/i.test(name)) rank = 'other';
  }
  return { event, rank, format };
}

// ---------- eras ----------

export interface Era { id: string; from: string }

/**
 * Rules eras, oldest first: a new era starts when a set becomes legal or a ban takes effect
 * (meta-sources.md §8.1). Derived from the legality data on every run, never a constant.
 */
export function erasOf(legality: LegalityData, today: string = new Date().toISOString().slice(0, 10)): Era[] {
  const marks = new Map<string, string>();
  const sets = legality.sets.filter((s) => s.legalFrom).sort((a, b) => (a.legalFrom as string).localeCompare(b.legalFrom as string));
  for (const s of sets) marks.set(s.legalFrom as string, s.code);
  for (const b of legality.bans) {
    if (marks.has(b.effectiveFrom)) continue;
    const set = [...sets].reverse().find((s) => (s.legalFrom as string) <= b.effectiveFrom);
    marks.set(b.effectiveFrom, `${set?.code ?? 'pre'}-postban-${b.effectiveFrom}`);
  }
  return [...marks.entries()].filter(([from]) => from <= today).sort((a, b) => a[0].localeCompare(b[0])).map(([from, id]) => ({ id, from }));
}

export const eraOf = (date: string, eras: readonly Era[]): Era | null =>
  [...eras].reverse().find((e) => e.from <= date.slice(0, 10)) ?? null;

// ---------- resolving a list against the card database ----------

export type MetaZone = 'main' | 'side' | 'battlefields' | 'runes';
export interface ResolvedDeck {
  id: string; name: string; legendId: string | null; championId: string | null;
  format: NameClass['format']; event: boolean; rank: string | null;
  createdAt: string; editedAt: string; views: number; likes: number;
  cards: Record<MetaZone, Record<string, number>>;   // card id -> copies; the Chosen Champion is counted inside main
  unresolved: string[]; complete: boolean; banned: string[];
}

const MAIN_TYPES = new Set(['unit', 'spell', 'gear']);

export function resolveDeck(deck: PaDeck, db: CardDb): ResolvedDeck {
  const unresolved: string[] = [];
  const find = (e: PaEntry): Card | undefined => (e.code ? db.byName(e.code) : undefined) ?? (e.name ? db.byName(e.name) : undefined);
  const zone = (list: PaEntry[], ok: (c: Card) => boolean): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const e of list) {
      const card = find(e);
      if (!card || !ok(card) || e.q <= 0) { unresolved.push(`${e.q} ${e.name || e.code || '?'}`); continue; }
      out[card.id] = (out[card.id] ?? 0) + e.q;
    }
    return out;
  };
  const isMain = (c: Card) => c.type !== null && MAIN_TYPES.has(c.type) && !c.superTypes.includes('token');
  const legend = (deck.legend.code ? db.byName(deck.legend.code) : undefined) ?? (deck.legend.name ? db.byName(deck.legend.name) : undefined);
  const legendId = legend?.type === 'legend' ? legend.id : null;
  if (!legendId) unresolved.push(`legend ${deck.legend.name ?? deck.legend.code ?? '?'}`);

  const main = zone(deck.main, isMain);
  const champions = zone(deck.champions, isMain);
  const championId = Object.keys(champions)[0] ?? null;
  for (const [id, q] of Object.entries(champions)) main[id] = (main[id] ?? 0) + q;
  const cards: ResolvedDeck['cards'] = {
    main,
    side: zone(deck.side, isMain),
    battlefields: zone(deck.battlefields, (c) => c.type === 'battlefield'),
    runes: zone(deck.runes, (c) => c.type === 'rune'),
  };
  const total = (z: Record<string, number>) => Object.values(z).reduce((a, b) => a + b, 0);
  const cls = classifyName(deck.name);

  const bans = db.legality().bans.filter((b) => b.formats.includes('standard-bo3'));
  const banned: string[] = [];
  for (const b of bans) {
    const card = db.byName(b.name);
    if (!card) continue;
    const zones: MetaZone[] = b.zone === 'battlefields' ? ['battlefields'] : ['main', 'side'];
    if (b.zone === 'legend' ? legendId === card.id : zones.some((z) => cards[z][card.id])) banned.push(card.id);
  }
  // A usable list: everything resolved, 40 or more main-deck cards with the champion, 12 runes, 3 battlefields.
  const complete = unresolved.length === 0 && total(cards.main) >= 40 && total(cards.runes) === 12 && Object.keys(cards.battlefields).length === 3;
  return {
    id: deck.id, name: deck.name, legendId, championId, format: cls.format, event: cls.event, rank: cls.rank,
    createdAt: deck.createdAt, editedAt: deck.editedAt, views: deck.views, likes: deck.likes,
    cards, unresolved, complete, banned,
  };
}

// ---------- aggregation ----------

export interface LegendCardRow { legend: string; zone: 'main' | 'side' | 'battlefields' | 'champion' | 'runes'; card: string; decks: number; share: number; avgCopies: number; era: string }
export interface LegendRow { legend: string; decks: number; nEff: number; quality: 'ok' | 'thin' | 'insufficient'; era: string }

const DAY = 86_400_000;

/** Rune split key, larger share first: "calm7-body5". */
export function runeSplitKey(runes: Record<string, number>, db: CardDb): string {
  const byDomain = new Map<Domain | 'none', number>();
  for (const [id, q] of Object.entries(runes)) {
    const d = db.get(id)?.domains[0] ?? 'none';
    byDomain.set(d, (byDomain.get(d) ?? 0) + q);
  }
  return [...byDomain.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([d, q]) => `${d}${q}`).join('-');
}

/**
 * Inclusion statistics per legend from complete 1v1 lists.
 * weight = placement-or-popularity x recency (HEURISTIC, META). Current-era lists first; when their
 * effective sample size is below META.nEffOk, lists of earlier eras are added at META.previousEraFactor
 * and the era label gets a "+older" suffix so the UI can say so. Currently banned cards are dropped from
 * a list before counting (spec §6.2); the list itself stays.
 */
export function aggregate(decks: readonly ResolvedDeck[], db: CardDb, eras: readonly Era[]): { legends: LegendRow[]; cards: LegendCardRow[] } {
  const current = eras[eras.length - 1] ?? { id: 'unknown', from: '0000-00-00' };
  const usable = decks.filter((d) => d.complete && d.legendId && d.format === 'standard');
  const newest = usable.reduce((t, d) => Math.max(t, Date.parse(d.editedAt) || 0), 0);
  const baseWeight = (d: ResolvedDeck): number => {
    const age = Math.max(0, (newest - (Date.parse(d.editedAt) || newest)) / DAY);
    const recency = 0.5 ** (age / META.halfLifeDays);
    const strength = d.event ? META.placement[d.rank ?? 'unknown'] * META.eventSizeUnknown : Math.log10(d.views + 10) / 4;
    return strength * recency;
  };
  const nEff = (ws: number[]): number => {
    const sum = ws.reduce((a, b) => a + b, 0);
    const sq = ws.reduce((a, b) => a + b * b, 0);
    return sq > 0 ? (sum * sum) / sq : 0;
  };

  const byLegend = new Map<string, ResolvedDeck[]>();
  for (const d of usable) {
    const list = byLegend.get(d.legendId as string);
    if (list) list.push(d);
    else byLegend.set(d.legendId as string, [d]);
  }

  const legends: LegendRow[] = [];
  const cards: LegendCardRow[] = [];
  for (const [legend, list] of [...byLegend.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const isCurrent = (d: ResolvedDeck) => d.editedAt.slice(0, 10) >= current.from;
    let weighted = list.filter(isCurrent).map((d) => ({ d, w: baseWeight(d) }));
    let era = current.id;
    if (nEff(weighted.map((x) => x.w)) < META.nEffOk) {
      const older = list.filter((d) => !isCurrent(d)).map((d) => ({ d, w: baseWeight(d) * META.previousEraFactor }));
      if (older.length) { weighted = [...weighted, ...older]; era = `${current.id}+older`; }
    }
    weighted = weighted.filter((x) => x.w > 0);
    const total = weighted.reduce((a, x) => a + x.w, 0);
    if (total <= 0) continue;
    const n = nEff(weighted.map((x) => x.w));
    legends.push({ legend, decks: weighted.length, nEff: Math.round(n * 100) / 100, quality: n >= META.nEffOk ? 'ok' : n >= META.nEffThin ? 'thin' : 'insufficient', era });

    const acc = new Map<string, { decks: number; w: number; copies: number }>();
    const add = (zone: LegendCardRow['zone'], card: string, w: number, copies: number) => {
      const key = `${zone}|${card}`;
      const a = acc.get(key) ?? { decks: 0, w: 0, copies: 0 };
      a.decks += 1; a.w += w; a.copies += w * copies;
      acc.set(key, a);
    };
    for (const { d, w } of weighted) {
      const banned = new Set(d.banned);
      for (const zone of ['main', 'side', 'battlefields'] as const) {
        for (const [card, q] of Object.entries(d.cards[zone])) if (!banned.has(card)) add(zone, card, w, q);
      }
      if (d.championId && !banned.has(d.championId)) add('champion', d.championId, w, 1);
      add('runes', runeSplitKey(d.cards.runes, db), w, 1);
    }
    for (const [key, a] of [...acc.entries()].sort((x, y) => x[0].localeCompare(y[0]))) {
      const [zone, card] = key.split('|') as [LegendCardRow['zone'], string];
      cards.push({ legend, zone, card, decks: a.decks, share: Math.round((a.w / total) * 10000) / 10000, avgCopies: Math.round((a.copies / a.w) * 100) / 100, era });
    }
  }
  return { legends, cards };
}

// ---------- storage ----------

const slimEntry = (e: { q?: number; name?: string; code?: string | null; type?: string | null; domains?: string[]; colors?: string[] }): PaEntry => ({
  q: e.q ?? 0, name: e.name ?? '', code: e.code ?? null,
  type: e.type ? e.type.toLowerCase() : null, domains: (e.domains ?? e.colors ?? []).map((d) => d.toLowerCase()),
});

/** Reads a deck cache (ours or the research stage's) and keeps only the fields of PaDeck; later lines win. */
export function readDeckCache(file: string): PaDeck[] {
  if (!existsSync(file)) return [];
  const out = new Map<string, PaDeck>();
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const d = JSON.parse(line) as PaDeck & { legend?: { name?: string; code?: string } };
      if (!d.id) continue;
      out.set(d.id, {
        id: d.id, name: d.name ?? '', views: d.views ?? 0, likes: d.likes ?? 0, createdAt: d.createdAt ?? '', editedAt: d.editedAt ?? '',
        legend: { name: d.legend?.name ?? null, code: d.legend?.code ?? null },
        champions: (d.champions ?? []).map(slimEntry), battlefields: (d.battlefields ?? []).map(slimEntry),
        runes: (d.runes ?? []).map(slimEntry), main: (d.main ?? []).map(slimEntry), side: (d.side ?? []).map(slimEntry),
      });
    } catch { /* a truncated last line from an interrupted run is skipped */ }
  }
  return [...out.values()];
}

export function readListCache(file: string): PaListRow[] {
  if (!existsSync(file)) return [];
  const out: PaListRow[] = [];
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const d = JSON.parse(line) as Partial<PaListRow>;
      if (d.id) out.push({ id: d.id, name: d.name ?? '', views: d.views ?? 0, likes: d.likes ?? 0, createdAt: d.createdAt ?? '', editedAt: d.editedAt ?? '', legendCode: d.legendCode ?? null, sets: d.sets ?? [], isLegal: d.isLegal !== false });
    } catch { /* skip */ }
  }
  return out;
}

export function storeDecks(db: Db, decks: readonly ResolvedDeck[], eras: readonly Era[]): void {
  const upsert = db.prepare(
    `INSERT INTO meta_decks(id, source, name, legend_id, champion_id, format, created_at, edited_at, views, likes, event, rank, era, complete, banned, unresolved, fetched_at)
     VALUES (@id, 'piltoverarchive', @name, @legendId, @championId, @format, @createdAt, @editedAt, @views, @likes, @event, @rank, @era, @complete, @banned, @unresolved, @fetchedAt)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, legend_id = excluded.legend_id, champion_id = excluded.champion_id, format = excluded.format,
       created_at = excluded.created_at, edited_at = excluded.edited_at, views = excluded.views, likes = excluded.likes, event = excluded.event,
       rank = excluded.rank, era = excluded.era, complete = excluded.complete, banned = excluded.banned, unresolved = excluded.unresolved`,
  );
  const clear = db.prepare('DELETE FROM meta_deck_cards WHERE deck_id = ?');
  const insert = db.prepare('INSERT INTO meta_deck_cards(deck_id, zone, card_id, qty) VALUES (?, ?, ?, ?)');
  const fetchedAt = new Date().toISOString();
  db.transaction(() => {
    for (const d of decks) {
      upsert.run({
        id: d.id, name: d.name, legendId: d.legendId, championId: d.championId, format: d.format, createdAt: d.createdAt, editedAt: d.editedAt,
        views: d.views, likes: d.likes, event: d.event ? 1 : 0, rank: d.rank, era: eraOf(d.editedAt, eras)?.id ?? null,
        complete: d.complete ? 1 : 0, banned: d.banned.length, unresolved: JSON.stringify(d.unresolved), fetchedAt,
      });
      clear.run(d.id);
      for (const zone of ['main', 'side', 'battlefields', 'runes'] as const) {
        for (const [card, q] of Object.entries(d.cards[zone])) insert.run(d.id, zone, card, q);
      }
    }
  })();
}

export function storeAggregate(db: Db, agg: ReturnType<typeof aggregate>): void {
  const now = new Date().toISOString();
  const card = db.prepare('INSERT INTO meta_legend_cards(legend, zone, card, decks, share, avgCopies, era) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const legend = db.prepare('INSERT INTO meta_legends(legend, decks, n_eff, quality, era, computed_at) VALUES (?, ?, ?, ?, ?, ?)');
  db.transaction(() => {
    db.exec('DELETE FROM meta_legend_cards; DELETE FROM meta_legends;');
    for (const l of agg.legends) legend.run(l.legend, l.decks, l.nEff, l.quality, l.era, now);
    for (const c of agg.cards) card.run(c.legend, c.zone, c.card, c.decks, c.share, c.avgCopies, c.era);
  })();
}

// ---------- the step ----------

export interface MetaOptions {
  max?: number;               // request cap for this run (listing pages and deck pages together); 0 = no network
  listingPages?: number;
  researchDir?: string | null; // null = ignore the research caches
  deckCache?: string;
  listCache?: string;
  http?: HttpOptions;
}
export interface MetaInfo {
  decks: number; complete: number; legends: number; ok: number; thin: number; insufficient: number;
  requests: number; fetched: number; failures: number; fromCache: number; remainingCandidates: number; era: string; stoppedEarly: boolean;
}

/** Which listed decks are worth a page fetch (meta-sources.md §3.2 recipe, step 3). HEURISTIC. */
export function pickCandidates(rows: readonly PaListRow[], have: ReadonlyMap<string, string>, legendCount: ReadonlyMap<string, number>, db: CardDb, era: Era, newestSet: string): PaListRow[] {
  const latest = new Map<string, PaListRow>();
  for (const r of rows) {
    const held = latest.get(r.id);
    if (!held || r.editedAt > held.editedAt) latest.set(r.id, r);
  }
  const byLegend = new Map<string, PaListRow[]>();
  for (const r of latest.values()) {
    const cls = classifyName(r.name);
    if (!r.isLegal || SKIP_RE.test(r.name)) continue;
    if (!(r.editedAt.slice(0, 10) >= era.from || r.sets.includes(newestSet))) continue;
    if (!(cls.event || r.views >= META.minViews)) continue;
    const stored = have.get(r.id);
    if (stored !== undefined && stored >= r.editedAt) continue; // never refetch a deck that was not edited
    const legend = r.legendCode ? db.byName(r.legendCode) : undefined;
    if (!legend || legend.type !== 'legend') continue;
    const list = byLegend.get(legend.id);
    if (list) list.push(r);
    else byLegend.set(legend.id, [r]);
  }
  for (const list of byLegend.values()) {
    list.sort((a, b) => Number(classifyName(b.name).event) - Number(classifyName(a.name).event) || b.views - a.views);
  }
  // Round-robin, always serving the legend that has the fewest lists so far: thin legends fill up first.
  const counts = new Map<string, number>([...byLegend.keys()].map((id) => [id, legendCount.get(id) ?? 0]));
  const out: PaListRow[] = [];
  for (;;) {
    let best: string | null = null;
    for (const [id, list] of byLegend) {
      if (list.length === 0) continue;
      if (best === null || (counts.get(id) as number) < (counts.get(best) as number)) best = id;
    }
    if (best === null) break;
    out.push((byLegend.get(best) as PaListRow[]).shift() as PaListRow);
    counts.set(best, (counts.get(best) as number) + 1);
  }
  return out;
}

export async function syncMeta(db: Db, log: Log, opts: MetaOptions = {}): Promise<MetaInfo> {
  const max = opts.max ?? META.defaultMaxRequests;
  const deckCache = opts.deckCache ?? OWN_DECK_CACHE;
  const listCache = opts.listCache ?? OWN_LIST_CACHE;
  const researchDir = opts.researchDir === undefined ? RESEARCH_RAW_DIR : opts.researchDir;
  const http: HttpOptions = { minGapMs: META.minGapMs, maxAttempts: 2, backoffMs: 5000, ...opts.http };

  const cards = loadCardDb(db);
  if (cards.all().length === 0) throw new Error('meta needs cards: run `pnpm sync cards` first');
  const eras = erasOf(cards.legality());
  const era = eras[eras.length - 1] ?? { id: 'unknown', from: '0000-00-00' };
  const newestSet = [...cards.legality().sets].filter((s) => s.legalFrom).sort((a, b) => (b.legalFrom as string).localeCompare(a.legalFrom as string))[0]?.code ?? '';

  // 1. Cached lists first: the research stage's download, then our own cache. Later edits win.
  const decks = new Map<string, PaDeck>();
  const sources = [...(researchDir ? [path.join(researchDir, 'pa-decks.jsonl')] : []), deckCache];
  for (const file of sources) for (const d of readDeckCache(file)) {
    const held = decks.get(d.id);
    if (!held || d.editedAt >= held.editedAt) decks.set(d.id, d);
  }
  const fromCache = decks.size;
  log(`meta ${fromCache} lists from cache`);

  // 2. New lists, up to the cap.
  let requests = 0;
  let fetched = 0;
  let failures = 0;
  let streak = 0;
  let stoppedEarly = false;
  let remainingCandidates = 0;
  if (max > 0) {
    mkdirSync(path.dirname(deckCache), { recursive: true });
    const listRows = [...(researchDir ? readListCache(path.join(researchDir, 'pa-list.jsonl')) : []), ...readListCache(listCache)];
    const pages = Math.min(opts.listingPages ?? META.listingPages, max);
    for (let p = 1; p <= pages && streak < 3; p++) {
      requests++;
      try {
        const html = await getText(`${PA_BASE}/decks?page=${p}`, http);
        const rows = html ? parseListingPage(html) : [];
        if (rows.length === 0) throw new Error('no deck rows on the page');
        for (const r of rows) appendFileSync(listCache, `${JSON.stringify(r)}\n`);
        listRows.push(...rows);
        streak = 0;
      } catch (err) {
        failures++; streak++;
        log(`meta listing page ${p} failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const have = new Map([...decks.values()].map((d) => [d.id, d.editedAt]));
    const legendCount = new Map<string, number>();
    for (const d of decks.values()) {
      const r = resolveDeck(d, cards);
      if (r.complete && r.legendId && r.format === 'standard' && r.editedAt.slice(0, 10) >= era.from) legendCount.set(r.legendId, (legendCount.get(r.legendId) ?? 0) + 1);
    }
    const candidates = pickCandidates(listRows, have, legendCount, cards, era, newestSet);
    const budget = Math.max(0, max - requests);
    const todo = candidates.slice(0, budget);
    remainingCandidates = candidates.length - todo.length;
    log(`meta ${candidates.length} candidate lists, fetching up to ${todo.length}`);
    let done = 0;
    for (const row of todo) {
      if (streak >= 3) { stoppedEarly = true; remainingCandidates += todo.length - done; break; }
      requests++;
      try {
        const html = await getText(`${PA_BASE}/decks/view/${row.id}`, http);
        const deck = html ? parseDeckPage(html) : null;
        if (!deck || !deck.id) throw new Error(html === null ? 'HTTP 404' : 'no deck data on the page');
        appendFileSync(deckCache, `${JSON.stringify(deck)}\n`);
        decks.set(deck.id, deck);
        fetched++; streak = 0;
      } catch (err) {
        failures++; streak++;
        log(`meta list ${row.id} failed: ${err instanceof Error ? err.message : String(err)}`);
      }
      if (++done % 25 === 0 || done === todo.length) log(`meta ${done}/${todo.length}`);
    }
    if (stoppedEarly) log('meta stopped after three failures in a row; run the step again later to continue');
  }

  // 3. Resolve, store, aggregate.
  const resolved = [...decks.values()].map((d) => resolveDeck(d, cards));
  storeDecks(db, resolved, eras);
  const agg = aggregate(resolved, cards, eras);
  storeAggregate(db, agg);
  invalidateCardDb();

  const count = (q: LegendRow['quality']) => agg.legends.filter((l) => l.quality === q).length;
  const info: MetaInfo = {
    decks: resolved.length, complete: resolved.filter((d) => d.complete).length, legends: agg.legends.length,
    ok: count('ok'), thin: count('thin'), insufficient: count('insufficient'),
    requests, fetched, failures, fromCache, remainingCandidates, era: era.id, stoppedEarly,
  };
  // An offline run (max 0) keeps the record of the last run that used the network.
  const previous = readSyncState(db, 'meta')?.info as { lastFetch?: unknown } | undefined;
  const lastFetch = requests > 0 ? { at: new Date().toISOString(), requests, fetched, failures, remainingCandidates, stoppedEarly } : previous?.lastFetch ?? null;
  writeSyncState(db, 'meta', { ...info, lastFetch });
  log(`meta ${info.complete}/${info.decks} lists usable, ${info.legends} legends (${info.ok} ok, ${info.thin} thin, ${info.insufficient} insufficient), era ${era.id}, ${requests} requests, ${fetched} new`);
  return info;
}
