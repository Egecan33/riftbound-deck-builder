import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import * as api from '@/app/lib/api';
import type {
  AnalyzeResponse, BuildResponse, CardDetailResponse, CardsResponse, ChampionsResponse, CollectionImportResponse, DeckResponse, DecksResponse,
  ExportResponse, ImportResponse, LegendsResponse, Settings, StatusResponse, SyncState,
} from '@/app/lib/api';
import * as analyzeRoute from '@/app/api/analyze/route';
import * as buildRoute from '@/app/api/build/route';
import * as cardRoute from '@/app/api/card/[id]/route';
import * as cardsRoute from '@/app/api/cards/route';
import * as championsRoute from '@/app/api/champions/route';
import * as collectionRoute from '@/app/api/collection/route';
import * as deckRoute from '@/app/api/decks/[id]/route';
import * as decksRoute from '@/app/api/decks/route';
import * as exportRoute from '@/app/api/export/route';
import * as imgRoute from '@/app/api/img/[file]/route';
import * as importRoute from '@/app/api/import/route';
import * as legendsRoute from '@/app/api/legends/route';
import * as settingsRoute from '@/app/api/settings/route';
import * as statusRoute from '@/app/api/status/route';
import * as syncRoute from '@/app/api/sync/route';
import { isLegal, validateDeck } from '@/engine/rules/validate';
import type { Deck, Line } from '@/engine/types';
import { STEPS } from '@/ingest/sync';
import { MAX_ANALYSES, getAnalysisEntry } from '@/server/context';
import { openDb, type Db } from '@/server/db';
import { deckKey, sanitizeDeck } from '@/server/decks';
import { getCardDb } from '@/server/store';
import { SYNC_STEPS, startSync, syncState } from '@/server/sync-runner';
import { readFixtureDeck } from '../helpers/fixture-db';
import { seedDb, useServerDb } from './server-db';

type Handler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Response | Promise<Response>;
type RouteModule = Partial<Record<'GET' | 'POST' | 'PUT' | 'DELETE', unknown>>;

const ROUTES: [RegExp, RouteModule][] = [
  [/^\/api\/status$/, statusRoute], [/^\/api\/sync$/, syncRoute], [/^\/api\/legends$/, legendsRoute], [/^\/api\/champions$/, championsRoute],
  [/^\/api\/decks$/, decksRoute], [/^\/api\/decks\/(?<id>[^/]+)$/, deckRoute], [/^\/api\/analyze$/, analyzeRoute], [/^\/api\/cards$/, cardsRoute],
  [/^\/api\/card\/(?<id>[^/]+)$/, cardRoute], [/^\/api\/build$/, buildRoute], [/^\/api\/import$/, importRoute], [/^\/api\/export$/, exportRoute],
  [/^\/api\/collection$/, collectionRoute], [/^\/api\/settings$/, settingsRoute], [/^\/api\/img\/(?<file>[^/]+)$/, imgRoute],
];

/** Calls the route handler a real request to `url` would reach. */
async function request(method: string, url: string, body?: unknown): Promise<Response> {
  const u = new URL(url, 'http://localhost:3220');
  for (const [pattern, mod] of ROUTES) {
    const m = pattern.exec(u.pathname);
    if (!m) continue;
    const handler = mod[method as keyof RouteModule] as Handler | undefined;
    if (!handler) return new Response('method not allowed', { status: 405 });
    const params = Object.fromEntries(Object.entries(m.groups ?? {}).map(([k, v]) => [k, decodeURIComponent(v)]));
    const init: RequestInit = { method };
    if (body !== undefined) {
      init.body = typeof body === 'string' ? body : JSON.stringify(body);
      init.headers = { 'Content-Type': 'application/json' };
    }
    return handler(new Request(u, init), { params: Promise.resolve(params) });
  }
  return new Response('not found', { status: 404 });
}
const get = <T>(url: string) => request('GET', url).then(async (r) => ({ status: r.status, body: (await r.json()) as T }));
const send = <T>(method: string, url: string, body: unknown) => request(method, url, body).then(async (r) => ({ status: r.status, body: (await r.json()) as T }));
const post = <T>(url: string, body: unknown) => send<T>('POST', url, body);

const IRELIA = 'irelia-blade-dancer.txt';
const KAISA = 'kaisa-daughter-of-the-void.txt';
const total = (list: { qty: number }[]) => list.reduce((n, e) => n + e.qty, 0);
const allLines = (r: AnalyzeResponse): Line[] => Object.values(r.lines).flat();

let db: Db;
let dataDir: string;
let irelia: Deck;
let kaisa: Deck;
const env = { data: process.env.RIFTBOUND_FORGE_DATA };

beforeAll(() => {
  dataDir = mkdtempSync(path.join(tmpdir(), 'forge-api-'));
  mkdirSync(path.join(dataDir, 'images'));
  process.env.RIFTBOUND_FORGE_DATA = dataDir;
  db = seedDb();
  useServerDb(db);
  irelia = readFixtureDeck(IRELIA, getCardDb()).deck;
  kaisa = readFixtureDeck(KAISA, getCardDb()).deck;
}, 120_000);

afterAll(() => {
  useServerDb(null);
  db.close();
  rmSync(dataDir, { recursive: true, force: true });
  if (env.data === undefined) delete process.env.RIFTBOUND_FORGE_DATA;
  else process.env.RIFTBOUND_FORGE_DATA = env.data;
});

afterEach(() => {
  vi.unstubAllGlobals();
  db.exec('DELETE FROM decks; DELETE FROM collection; DELETE FROM settings;');
  useServerDb(db);
});

describe('status, legends, champions', () => {
  it('reports a ready database with its counts, legality snapshot and mine coverage', async () => {
    const { status, body } = await get<StatusResponse>('/api/status');
    expect(status).toBe(200);
    expect(body.ready).toBe(true);
    expect(body.error).toBeNull();
    expect(body.counts.cards).toBeGreaterThan(500);
    expect(body.counts.features).toBe(body.counts.cards);
    expect(body.counts.edges).toBeGreaterThan(0);
    expect(body.counts.legends).toBeGreaterThan(5);
    expect(body.steps.cards?.finishedAt).toBeTruthy();
    expect(body.steps.images).toBeNull();
    expect(body.legality?.bans.length).toBeGreaterThan(0);
    expect(body.legality?.hub?.url).toMatch(/^https:/);
    expect(body.coverage?.cards).toBe(body.counts.cards);
    expect(body.imagesMissing).toBe(body.counts.cards);
    expect(body.sync.running).toBe(false);
  });

  it('an empty database is not ready and nothing throws', async () => {
    const empty = seedEmpty();
    try {
      const { body } = await get<StatusResponse>('/api/status');
      expect(body.ready).toBe(false);
      expect(body.counts.cards).toBe(0);
      expect((await get<LegendsResponse>('/api/legends')).body.legends).toEqual([]);
      const analysed = await post<AnalyzeResponse>('/api/analyze', { deck: irelia });
      expect(analysed.status).toBe(200);
      expect(analysed.body.rating.legal).toBe(false);
      expect(analysed.body.unknown.length).toBeGreaterThan(0);
    } finally {
      useServerDb(db);
      empty.close();
    }
  });

  it('lists legends with meta, filters by domain and search, and gives the champions of one', async () => {
    const { body } = await get<LegendsResponse>('/api/legends');
    expect(body.legends.length).toBeGreaterThan(5);
    expect(body.legends.every((l) => l.card.type === 'legend')).toBe(true);
    expect(body.legends[0].meta?.decks).toBeGreaterThan(0); // most public lists first
    const blade = body.legends.find((l) => l.card.id === irelia.legend)!;
    expect(blade.card.image).toBe(`/api/img/${irelia.legend}.webp`);
    expect(blade.champions).toBeGreaterThan(0);
    const banned2v2 = body.legends.find((l) => l.card.name === 'Wuju Bladesman');
    if (banned2v2) expect(banned2v2.bannedIn).toEqual(['2v2']); // from sync-data/legality.json, not from code

    const domain = blade.card.domains[0];
    const filtered = (await get<LegendsResponse>(`/api/legends?domains=${domain}`)).body.legends;
    expect(filtered.length).toBeLessThan(body.legends.length);
    expect(filtered.every((l) => l.card.domains.includes(domain))).toBe(true);
    const searched = (await get<LegendsResponse>('/api/legends?q=irelia')).body.legends;
    expect(searched.map((l) => l.card.id)).toContain(irelia.legend);

    const champs = await get<ChampionsResponse>(`/api/champions?legend=${irelia.legend}`);
    expect(champs.body.champions.map((c) => c.card.id)).toContain(irelia.champion);
    expect(champs.body.champions.every((c) => c.card.superTypes.includes('champion') && c.card.type === 'unit')).toBe(true);
    expect(champs.body.champions[0].share).not.toBeNull();
    expect((await get('/api/champions?legend=nope')).status).toBe(404);
    expect((await get(`/api/champions?legend=${irelia.champion}`)).status).toBe(404);
  });
});

describe('POST /api/analyze', () => {
  it('returns rating, summary, targets, themes, per-card scores, win routes and lines that name the deck', async () => {
    const { status, body } = await post<AnalyzeResponse>('/api/analyze', { deck: irelia });
    expect(status).toBe(200);
    expect(body.rating.rating).toBeGreaterThan(0);
    expect(body.rating.rating).toBeLessThanOrEqual(100);
    expect(body.rating.subscores.length).toBeGreaterThan(5);
    expect(body.rating.subscores.every((s) => Number.isFinite(s.value))).toBe(true);
    expect(body.summary.mainCount).toBe(40);
    expect(body.summary.runeCount).toBe(12);
    expect(body.targets.archetype).toBeTruthy();
    expect(Object.keys(body.themeWeights).length).toBeGreaterThan(0);
    for (const e of irelia.main) {
      expect(body.deckScores[e.id].reasons.length, e.id).toBeGreaterThan(0); // no score without reasons
      expect(body.cards[e.id].image).toBe(`/api/img/${e.id}.webp`);
    }
    for (const e of irelia.side) expect(body.sideScores[e.id]).toBeDefined();
    for (const id of irelia.battlefields) expect(body.deckScores[id]).toBeDefined();
    expect(body.win.routes.length).toBeGreaterThan(0);
    const lines = allLines(body);
    expect(lines.length).toBeGreaterThan(5);
    const deckIds = new Set([irelia.legend, irelia.champion, ...irelia.main.map((e) => e.id), ...irelia.side.map((e) => e.id), ...irelia.battlefields]);
    for (const line of lines) {
      expect(line.cardIds.length, line.text).toBeGreaterThan(0);
      for (const id of line.cardIds) expect(deckIds.has(id), `${line.text} -> ${id}`).toBe(true);
      for (const id of [...line.cardIds, ...(line.otherIds ?? [])]) expect(body.cards[id], id).toBeDefined(); // every named card can be shown
    }
    expect(body.unknown).toEqual([]);
    expect(body.opponentLegend).toBeNull();
    expect(body.lines.matchup).toEqual([]);
    expect(body.timing.cached).toBe(false);
  });

  it('reuses the held analysis for the same deck state, whatever its name, and rebuilds after an edit', async () => {
    const first = (await post<AnalyzeResponse>('/api/analyze', { deck: irelia })).body;
    const again = (await post<AnalyzeResponse>('/api/analyze', { deck: { ...irelia, name: 'Renamed', id: 'abc' } })).body;
    expect(again.timing.cached).toBe(true);
    expect(again.rating).toEqual(first.rating);

    const cut = irelia.main.find((e) => e.id !== irelia.champion)!;
    const edited: Deck = { ...irelia, main: irelia.main.filter((e) => e !== cut) };
    const after = (await post<AnalyzeResponse>('/api/analyze', { deck: edited })).body;
    expect(after.timing.cached).toBe(false);
    expect(after.summary.mainCount).toBe(40 - cut.qty);
    expect(after.rating.complete).toBe(false);
    expect(after.deckScores[cut.id]).toBeUndefined();
    // Undo: the first state is still held.
    expect((await post<AnalyzeResponse>('/api/analyze', { deck: irelia })).body.timing.cached).toBe(true);
  });

  it('writes matchup lines for an opponent legend and ignores an opponent that is not a legend', async () => {
    await post<AnalyzeResponse>('/api/analyze', { deck: irelia });
    const vs = (await post<AnalyzeResponse>('/api/analyze', { deck: irelia, opponentLegend: kaisa.legend })).body;
    expect(vs.opponentLegend).toBe(kaisa.legend);
    expect(vs.lines.matchup.length).toBeGreaterThan(0);
    expect(vs.cards[kaisa.legend!]).toBeDefined();
    expect(vs.timing.cached).toBe(true); // same deck state, only the matchup part is new
    const none = (await post<AnalyzeResponse>('/api/analyze', { deck: irelia, opponentLegend: irelia.champion })).body;
    expect(none.opponentLegend).toBeNull();
    expect(none.lines.matchup).toEqual([]);
  });

  it('analyses partial and broken decks without throwing', async () => {
    const empty = sanitizeDeck({});
    for (const deck of [empty, { ...empty, legend: irelia.legend }, { ...irelia, main: [{ id: 'no-such-card', qty: 3, locked: false }], runes: {} }, { ...irelia, legend: irelia.champion }]) {
      const { status, body } = await post<AnalyzeResponse>('/api/analyze', { deck });
      expect(status).toBe(200);
      expect(Number.isFinite(body.rating.rating)).toBe(true);
      expect(body.rating.legal).toBe(false);
    }
    const unknown = (await post<AnalyzeResponse>('/api/analyze', { deck: { ...irelia, main: [...irelia.main, { id: 'no-such-card', qty: 1, locked: false }] } })).body;
    expect(unknown.unknown).toEqual(['no-such-card']);
  });

  it('answers 400 for a body that is not a deck', async () => {
    expect((await post('/api/analyze', {})).status).toBe(400);
    expect((await post('/api/analyze', { deck: { ...irelia, format: 'vintage' } })).status).toBe(400);
    expect((await post('/api/analyze', { deck: { ...irelia, main: 'x' } })).status).toBe(400);
    expect((await post('/api/analyze', { deck: { ...irelia, main: [{ qty: 2 }] } })).status).toBe(400);
    expect((await request('POST', '/api/analyze', 'not json')).status).toBe(400);
  });

  it('keeps at most MAX_ANALYSES deck states', () => {
    const states = Array.from({ length: MAX_ANALYSES + 3 }, (_, i) => ({ ...irelia, runes: { ...irelia.runes, fury: i + 1 } }));
    expect(new Set(states.map(deckKey)).size).toBe(states.length);
    for (const s of states) expect(getAnalysisEntry(s).cached).toBe(false);
    expect(getAnalysisEntry(states[states.length - 1]).cached).toBe(true);
    expect(getAnalysisEntry(states[0]).cached).toBe(false); // evicted
  });
});

describe('POST /api/cards', () => {
  it('scores the pool against the deck, best first, gated cards last with their reason', async () => {
    const { status, body } = await post<CardsResponse>('/api/cards', { deck: irelia, pageSize: 200 });
    expect(status).toBe(200);
    expect(body.zone).toBe('main');
    expect(body.total).toBeGreaterThan(300);
    expect(body.gated).toBeGreaterThan(0);
    expect(body.cards.every((c) => ['unit', 'spell', 'gear'].includes(c.card.type ?? ''))).toBe(true);
    const open = body.cards.filter((c) => !c.score.gate);
    for (let i = 1; i < open.length; i++) expect(open[i - 1].score.score).toBeGreaterThanOrEqual(open[i].score.score);
    const last = (await post<CardsResponse>('/api/cards', { deck: irelia, pageSize: 50, page: Math.ceil(body.total / 50) })).body;
    expect(last.cards.length).toBeGreaterThan(0);
    expect(last.cards.every((c) => c.score.gate !== null && c.score.gate.message.length > 0)).toBe(true);
    const firstGate = body.cards.findIndex((c) => c.score.gate);
    if (firstGate >= 0) expect(body.cards.slice(firstGate).every((c) => c.score.gate)).toBe(true);
    const inDeck = body.cards.find((c) => c.card.id === irelia.main[0].id) ?? (await post<CardsResponse>('/api/cards', { deck: irelia, filters: { inDeck: true }, pageSize: 200 })).body.cards.find((c) => c.card.id === irelia.main[0].id);
    expect(inDeck?.inDeck).toBe(irelia.main[0].qty);
  });

  it('filters by role, type, domain, cost, deck membership and search text', async () => {
    const browse = async (extra: Record<string, unknown>) => (await post<CardsResponse>('/api/cards', { deck: irelia, pageSize: 200, ...extra })).body;
    const removal = await browse({ filters: { role: 'removal' } });
    expect(removal.total).toBeGreaterThan(0);
    expect(removal.cards.every((c) => c.card.roles.includes('removal'))).toBe(true);
    const spells = await browse({ filters: { type: 'spell', energyMax: 2, hideGated: true } });
    expect(spells.total).toBeGreaterThan(0);
    expect(spells.gated).toBe(0);
    expect(spells.cards.every((c) => c.card.type === 'spell' && (c.card.energy ?? 0) <= 2 && !c.score.gate)).toBe(true);
    const domain = getCardDb().get(irelia.legend!)!.domains[0];
    const mono = await browse({ filters: { domains: [domain] } });
    expect(mono.cards.every((c) => c.card.domains.includes(domain))).toBe(true);
    const held = await browse({ filters: { inDeck: true } });
    expect(held.total).toBe(irelia.main.length);
    const notHeld = await browse({ filters: { inDeck: false } });
    expect(notHeld.total + held.total).toBe((await browse({})).total);
    const name = getCardDb().get(irelia.main[1].id)!.name;
    const found = await browse({ q: name.toUpperCase() });
    expect(found.cards.map((c) => c.card.name)).toContain(name);
    expect((await browse({ q: 'zzzz-no-such-text' })).total).toBe(0);
  });

  it('sorts by name and cost, pages without overlap, and browses side deck and battlefields', async () => {
    const page = async (extra: Record<string, unknown>) => (await post<CardsResponse>('/api/cards', { deck: irelia, filters: { hideGated: true }, ...extra })).body;
    const names = (await page({ sort: 'name', pageSize: 200 })).cards.map((c) => c.card.name.toLowerCase());
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    const costs = (await page({ sort: 'energy', dir: 'desc', pageSize: 200 })).cards.map((c) => c.card.energy ?? -1);
    for (let i = 1; i < costs.length; i++) if (costs[i] >= 0) expect(costs[i - 1]).toBeGreaterThanOrEqual(costs[i]);
    const p1 = await page({ pageSize: 20, page: 1 });
    const p2 = await page({ pageSize: 20, page: 2 });
    expect(p1.cards).toHaveLength(20);
    expect(p2.cards.some((c) => p1.cards.some((d) => d.card.id === c.card.id))).toBe(false);
    const fields = (await post<CardsResponse>('/api/cards', { deck: irelia, zone: 'battlefields', pageSize: 200 })).body;
    expect(fields.total).toBeGreaterThan(3);
    expect(fields.cards.every((c) => c.card.type === 'battlefield')).toBe(true);
    expect(fields.cards.filter((c) => c.inDeck > 0).map((c) => c.card.id).sort()).toEqual([...irelia.battlefields].sort());
    const side = (await post<CardsResponse>('/api/cards', { deck: irelia, zone: 'side', filters: { inDeck: true } })).body;
    expect(side.total).toBe(irelia.side.length);
    expect((await post('/api/cards', { deck: irelia, zone: 'legend' })).status).toBe(400);
    expect((await post('/api/cards', { deck: irelia, sort: 'price' })).status).toBe(400);
  });
});

describe('GET /api/card/:id', () => {
  it('gives the card, its features and its strongest partners; with a deck, its score and the deck\'s own partners first', async () => {
    const id = irelia.champion!;
    const alone = await get<CardDetailResponse>(`/api/card/${id}`);
    expect(alone.status).toBe(200);
    expect(alone.body.card.id).toBe(id);
    expect(alone.body.features?.traits.length).toBeGreaterThan(0);
    expect(alone.body.score).toBeNull();
    expect(alone.body.partners.length).toBeGreaterThan(0);
    for (const p of alone.body.partners) {
      expect(p.net).toBeGreaterThan(0);
      expect(p.reasons.length).toBeGreaterThan(0);
      expect(p.inDeck).toBe(0);
      expect(p.fits).toBe(true);
    }
    const live = await post<CardDetailResponse>(`/api/card/${id}`, { deck: irelia });
    expect(live.body.score?.reasons.length).toBeGreaterThan(0);
    const flags = live.body.partners.map((p) => (p.inDeck > 0 ? 2 : p.fits ? 1 : 0));
    expect(flags).toEqual([...flags].sort((a, b) => b - a));

    const saved = (await post<DeckResponse>('/api/decks', { deck: irelia })).body.deck;
    const viaSaved = await get<CardDetailResponse>(`/api/card/${id}?deck=${saved.id}`);
    expect(viaSaved.body.score).toEqual(live.body.score);
    expect((await get(`/api/card/${id}?deck=missing`)).status).toBe(404);
    expect((await get('/api/card/no-such-card')).status).toBe(404);
  });
});

describe('POST /api/build', () => {
  const blank = (): Deck => ({ ...sanitizeDeck({}), name: 'Fresh', legend: irelia.legend, format: 'standard-bo3', power: 'competitive' });

  it('auto-builds a legal deck with a reason for every pick', async () => {
    const { status, body } = await post<BuildResponse>('/api/build', { deck: blank(), mode: 'auto', options: { seed: 1 } });
    expect(status).toBe(200);
    expect(body.violations.filter((v) => v.severity === 'error')).toEqual([]);
    expect(body.rating.legal).toBe(true);
    expect(isLegal(validateDeck(body.deck, getCardDb()))).toBe(true);
    expect(total(body.deck.main)).toBe(40);
    expect(Object.values(body.deck.runes).reduce((a, b) => a + (b ?? 0), 0)).toBe(12);
    expect(body.deck.battlefields).toHaveLength(3);
    expect(total(body.deck.side)).toBeGreaterThan(0);
    expect(body.deck.champion).toBeTruthy();
    expect(body.deck.name).toBe('Fresh');
    expect(body.picks.length).toBeGreaterThan(10);
    expect(body.picks.every((p) => p.reason.length > 0)).toBe(true);
    for (const e of body.deck.main) expect(body.cards[e.id]).toBeDefined();
    expect(body.rating.rating).toBeGreaterThan(40);
  }, 60_000);

  it('fills the rest around what is there, and rebuilds single zones', async () => {
    const kept = irelia.main.slice(0, 6);
    const partial: Deck = { ...irelia, main: kept, side: [], runes: {}, battlefields: [] };
    const filled = (await post<BuildResponse>('/api/build', { deck: partial, mode: 'fill' })).body;
    expect(total(filled.deck.main)).toBe(40);
    for (const e of kept) expect(filled.deck.main.find((m) => m.id === e.id)?.qty ?? 0).toBeGreaterThanOrEqual(e.qty);
    expect(filled.rating.legal).toBe(true);

    const runes = (await post<BuildResponse>('/api/build', { deck: { ...irelia, runes: {} }, mode: 'runes' })).body;
    expect(Object.values(runes.deck.runes).reduce((a, b) => a + (b ?? 0), 0)).toBe(12);
    expect(runes.notes[0]).toBeTruthy();
    const fields = (await post<BuildResponse>('/api/build', { deck: { ...irelia, battlefields: [irelia.battlefields[0]] }, mode: 'battlefields' })).body;
    expect(fields.deck.battlefields).toHaveLength(3);
    expect(fields.deck.battlefields).toContain(irelia.battlefields[0]);
    const side = (await post<BuildResponse>('/api/build', { deck: { ...irelia, side: [] }, mode: 'side' })).body;
    expect(total(side.deck.side)).toBeGreaterThan(0);
    expect(side.deck.main).toEqual(irelia.main);
    expect(side.picks.every((p) => p.zone === 'side' && p.reason.length > 0)).toBe(true);
  }, 60_000);

  it('proposes swaps without applying them, and applies the accepted ones', async () => {
    const db2 = getCardDb();
    const junk = db2.all().filter((c) => c.type === 'unit' && !irelia.main.some((e) => e.id === c.id) && c.domains.every((d) => db2.get(irelia.legend!)!.domains.includes(d)) && !c.superTypes.includes('champion') && !c.superTypes.includes('signature'))
      .sort((a, b) => (db2.features(a.id)?.evaluatedRating ?? 0) - (db2.features(b.id)?.evaluatedRating ?? 0))[0];
    const cut = irelia.main.find((e) => e.id !== irelia.champion && e.qty >= 2)!;
    const worse: Deck = { ...irelia, main: [...irelia.main.map((e) => (e === cut ? { ...e, qty: e.qty - 2 } : e)), { id: junk.id, qty: 2, locked: false }].filter((e) => e.qty > 0) };
    const improve = (await post<BuildResponse>('/api/build', { deck: worse, mode: 'improve', options: { count: 4 } })).body;
    expect(improve.deck.main).toEqual(worse.main); // not applied
    expect(improve.proposals.length).toBeGreaterThan(0);
    for (const p of improve.proposals) {
      expect(p.reason.length).toBeGreaterThan(0);
      expect(p.ratingAfter).toBeGreaterThan(p.ratingBefore);
      expect(improve.cards[p.in]).toBeDefined();
      expect(improve.cards[p.out]).toBeDefined();
    }
    const applied = (await post<BuildResponse>('/api/build', { deck: worse, mode: 'apply', options: { swaps: improve.proposals } })).body;
    expect(total(applied.deck.main)).toBe(40);
    expect(applied.precise).toBeGreaterThan(improve.precise);
    const swaps = (await post<BuildResponse>('/api/build', { deck: worse, mode: 'swaps', options: { count: 3 } })).body;
    expect(swaps.proposals.length).toBeLessThanOrEqual(3);
    expect(swaps.deck.main).toEqual(worse.main);
  }, 60_000);

  it('builds from the collection only when asked, and rejects bad requests', async () => {
    const pool = (await post<CardsResponse>('/api/cards', { deck: blank(), filters: { hideGated: true }, pageSize: 200 })).body.cards.slice(0, 30);
    const owned = Object.fromEntries(pool.map((c) => [c.card.id, 3]));
    const savedCollection = await post<CollectionImportResponse>('/api/collection', { owned });
    expect(savedCollection.body.unique).toBe(30);
    const built = (await post<BuildResponse>('/api/build', { deck: blank(), mode: 'auto', options: { ownedOnly: true } })).body;
    const mainIds = built.deck.main.map((e) => e.id).filter((id) => id !== built.deck.champion);
    expect(mainIds.length).toBeGreaterThan(0);
    expect(mainIds.every((id) => owned[id] > 0)).toBe(true);

    expect((await post('/api/build', { deck: blank(), mode: 'magic' })).status).toBe(400);
    expect((await post('/api/build', { deck: blank(), mode: 'auto', options: { buildAround: 'x' } })).status).toBe(400);
    expect((await post('/api/build', { deck: blank(), mode: 'apply', options: { swaps: [{ zone: 'runes' }] } })).status).toBe(400);
  }, 60_000);
});

describe('import, export, decks', () => {
  it('imports a list, saves it, loads it back unchanged, and exports it again', async () => {
    const text = readFileSync(path.join(process.cwd(), 'tests', 'fixtures', 'decks', IRELIA), 'utf8');
    const imported = await post<ImportResponse>('/api/import', { text, format: 'standard-bo3', power: 'competitive' });
    expect(imported.status).toBe(200);
    expect(imported.body.unresolved).toEqual([]);
    expect(imported.body.legal).toBe(true);
    expect(imported.body.deck.legend).toBe(irelia.legend);
    expect(imported.body.deck.champion).toBe(irelia.champion);
    expect(total(imported.body.deck.main)).toBe(40);
    expect(imported.body.deck.name).toMatch(/imported/i);

    const created = await post<DeckResponse>('/api/decks', { deck: imported.body.deck });
    expect(created.status).toBe(201);
    const id = created.body.deck.id!;
    expect(id).toBeTruthy();
    const loaded = await get<DeckResponse>(`/api/decks/${id}`);
    expect(loaded.status).toBe(200);
    expect(loaded.body.deck).toEqual({ ...imported.body.deck, id });
    expect(deckKey(loaded.body.deck)).toBe(deckKey(imported.body.deck));
    expect(loaded.body.cards[irelia.legend!].name).toBeTruthy();

    const exported = (await post<ExportResponse>('/api/export', { deck: loaded.body.deck })).body;
    expect(exported.text).toContain('Legend:');
    const again = (await post<ImportResponse>('/api/import', { text: exported.text, format: 'standard-bo3', power: 'competitive', name: imported.body.deck.name })).body;
    const sorted = (d: Deck) => ({ ...d, main: [...d.main].sort((a, b) => a.id.localeCompare(b.id)), side: [...d.side].sort((a, b) => a.id.localeCompare(b.id)), battlefields: [...d.battlefields].sort() });
    expect(sorted(again.deck)).toEqual(sorted(imported.body.deck));
    if (exported.code) {
      const fromCode = (await post<ImportResponse>('/api/import', { text: exported.code, format: 'standard-bo3', power: 'competitive', name: imported.body.deck.name })).body;
      expect(sorted(fromCode.deck)).toEqual(sorted(imported.body.deck));
    } else {
      expect(exported.codeError ?? exported.codeSkipped.join()).toBeTruthy();
    }
  });

  it('reports lines it cannot read instead of dropping them, and rejects an empty import', async () => {
    const res = (await post<ImportResponse>('/api/import', { text: 'Legend:\n1 Blade Dancer\nMain:\n3 Defy\n2 Totally Unknown Card\n' })).body;
    expect(res.unresolved).toEqual([{ line: 5, text: '2 Totally Unknown Card' }]);
    expect(res.legal).toBe(false);
    expect(res.deck.format).toBe('standard-bo3'); // the default setting
    expect((await post('/api/import', { text: '   ' })).status).toBe(400);
    expect((await post('/api/import', { text: 'x', format: 'vintage' })).status).toBe(400);
  });

  it('lists, updates and deletes saved decks', async () => {
    const a = (await post<DeckResponse>('/api/decks', { deck: { ...irelia, name: 'A' } })).body.deck;
    const b = (await post<DeckResponse>('/api/decks', { deck: { ...kaisa, name: 'B', main: kaisa.main.slice(0, 3) } })).body.deck;
    const list = (await get<DecksResponse>('/api/decks')).body.decks;
    expect(list.map((d) => d.id).sort()).toEqual([a.id, b.id].sort());
    const tileA = list.find((d) => d.id === a.id)!;
    expect(tileA).toMatchObject({ name: 'A', format: 'standard-bo3', mainCount: 40, runeCount: 12, battlefieldCount: 3, legal: true, complete: true });
    expect(tileA.legend?.id).toBe(irelia.legend);
    expect(tileA.rating).toBeGreaterThan(0);
    const tileB = list.find((d) => d.id === b.id)!;
    expect(tileB.legal).toBe(false);
    expect(tileB.complete).toBe(false);

    const put = await send<DeckResponse>('PUT', `/api/decks/${a.id}`, { deck: { ...a, name: 'A2', id: 'ignored', main: a.main.slice(1) } });
    expect(put.status).toBe(200);
    expect(put.body.deck.id).toBe(a.id);
    expect((await get<DeckResponse>(`/api/decks/${a.id}`)).body.deck.name).toBe('A2');
    expect((await get<DecksResponse>('/api/decks')).body.decks.find((d) => d.id === a.id)?.mainCount).toBe(40 - a.main[0].qty);
    expect((await send('PUT', '/api/decks/missing', { deck: a })).status).toBe(404);
    expect((await request('DELETE', `/api/decks/${a.id}`)).status).toBe(200);
    expect((await get(`/api/decks/${a.id}`)).status).toBe(404);
    expect((await request('DELETE', `/api/decks/${a.id}`)).status).toBe(404);
  });

  it('repairs small faults in a deck and keeps what the validator must judge', () => {
    const deck = sanitizeDeck({ name: '  x  ', main: [{ id: 'a', qty: 2.9 }, { id: 'a', qty: 1, locked: true }, { id: 'b', qty: 0 }, { id: 'c', qty: 1e9 }], runes: { fury: 7.5, nope: 3, calm: -1 }, themeWeights: { tokens: 4, bad: 'x' }, battlefields: ['f1', 'f1'] });
    expect(deck.name).toBe('x');
    expect(deck.main).toEqual([{ id: 'a', qty: 3, locked: true }, { id: 'c', qty: 99, locked: false }]);
    expect(deck.runes).toEqual({ fury: 7 });
    expect(deck.themeWeights).toEqual({ tokens: 1 });
    expect(deck.battlefields).toEqual(['f1', 'f1']); // a duplicate battlefield is a rules violation, reported by the validator
    expect(deck.format).toBe('standard-bo3');
  });
});

describe('collection and settings', () => {
  it('reads a pasted collection, merges, and filters the browser by owned cards', async () => {
    const [x, y] = irelia.main.map((e) => getCardDb().get(e.id)!);
    const first = await post<CollectionImportResponse>('/api/collection', { text: `2 ${x.name}\n1 ${y.name}\n3 Not A Real Card` });
    expect(first.status).toBe(200);
    expect(first.body.owned).toEqual({ [x.id]: 2, [y.id]: 1 });
    expect(first.body.unresolved).toEqual([{ line: 3, text: '3 Not A Real Card' }]);
    expect(first.body.cards[x.id].name).toBe(x.name);
    const merged = (await post<CollectionImportResponse>('/api/collection', { text: `1 ${x.name}`, mode: 'merge' })).body;
    expect(merged.owned[x.id]).toBe(3);
    expect(merged.total).toBe(4);
    const set = (await post<CollectionImportResponse>('/api/collection', { owned: { [y.id]: 0, 'no-such': 2 }, mode: 'merge' })).body;
    expect(set.owned).toEqual({ [x.id]: 3 });
    expect(set.unresolved).toHaveLength(1);
    expect((await get<CollectionImportResponse>('/api/collection')).body.unique).toBe(1);
    const ownedOnly = (await post<CardsResponse>('/api/cards', { deck: irelia, filters: { owned: true } })).body;
    expect(ownedOnly.cards.map((c) => c.card.id)).toEqual([x.id]);
    expect(ownedOnly.cards[0].owned).toBe(3);
    expect((await post<CollectionImportResponse>('/api/collection', { owned: {} })).body.unique).toBe(0);
    expect((await post('/api/collection', {})).status).toBe(400);
    expect((await post('/api/collection', { text: 'x', mode: 'append' })).status).toBe(400);
  });

  it('saves settings, rejects unknown keys, and the free-for-all ban switch changes what is legal', async () => {
    const defaults = (await get<Settings>('/api/settings')).body;
    expect(defaults).toEqual({ ownedOnly: false, ffaUsesStandardBans: null, defaultFormat: 'standard-bo3', defaultPower: 'focused' });
    const put = await send<Settings>('PUT', '/api/settings', { defaultFormat: '2v2', ownedOnly: true });
    expect(put.body).toMatchObject({ defaultFormat: '2v2', ownedOnly: true });
    expect((await get<Settings>('/api/settings')).body.defaultFormat).toBe('2v2');
    expect((await send('PUT', '/api/settings', { nope: 1 })).status).toBe(400);
    expect((await send('PUT', '/api/settings', { defaultFormat: 'vintage' })).status).toBe(400);
    expect((await send('PUT', '/api/settings', { ownedOnly: 'yes' })).status).toBe(400);

    const snapshot = (await get<StatusResponse>('/api/status')).body.legality!;
    const ban = snapshot.bans.find((b) => b.zone === 'main' && b.formats.includes('standard-bo3'))!;
    const bannedId = getCardDb().byName(ban.name)?.id;
    if (bannedId) {
      const ffa = (uses: boolean) => send<Settings>('PUT', '/api/settings', { ffaUsesStandardBans: uses })
        .then(() => post<CardDetailResponse>(`/api/card/${bannedId}`, { deck: { ...irelia, format: 'ffa4' } }))
        .then((r) => r.body.bannedIn.includes('ffa4'));
      expect(await ffa(true)).toBe(true);
      expect(await ffa(false)).toBe(false);
      expect((await get<StatusResponse>('/api/status')).body.legality?.ffaUsesStandardBans).toBe(false);
    }
  });
});

describe('GET /api/img/:file', () => {
  it('serves an image with a one-year cache header, a placeholder for a missing one, and refuses anything that is not a card file', async () => {
    const bytes = Buffer.from('RIFF\u0000\u0000\u0000\u0000WEBPfake');
    writeFileSync(path.join(dataDir, 'images', 'ogn-001-298.webp'), bytes);
    writeFileSync(path.join(dataDir, 'secret.webp'), 'secret');
    const hit = await request('GET', '/api/img/ogn-001-298.webp');
    expect(hit.status).toBe(200);
    expect(hit.headers.get('Content-Type')).toBe('image/webp');
    expect(hit.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    expect(Buffer.from(await hit.arrayBuffer()).equals(bytes)).toBe(true);

    const miss = await request('GET', '/api/img/ogn-999-298.webp');
    expect(miss.status).toBe(404);
    expect(miss.headers.get('Content-Type')).toMatch(/^image\/svg\+xml/);
    expect(miss.headers.get('Cache-Control')).toBe('no-store');
    expect(await miss.text()).toContain('<svg');

    for (const file of ['..%2Fsecret.webp', '..%2F..%2Fetc%2Fpasswd', '%2e%2e%2fsecret.webp', 'ogn-001-298.png', '.webp', 'OGN-001.webp', 'a..b.webp', 'a%00.webp', `${'a'.repeat(200)}.webp`, 'images%5Csecret.webp']) {
      const res = await request('GET', `/api/img/${file}`);
      expect(res.status, file).toBe(400);
      expect(await res.text()).not.toContain('secret');
    }
  });
});

describe('sync', () => {
  const fakeChild = () => {
    const handlers: Record<string, (arg: unknown) => void> = {};
    const stream = () => {
      const on: Record<string, (arg?: unknown) => void> = {};
      return { on: (event: string, fn: (arg?: unknown) => void) => { on[event] = fn; }, emit: (event: string, arg?: unknown) => on[event]?.(arg) };
    };
    const stdout = stream();
    const stderr = stream();
    return { child: { stdout, stderr, on: (event: string, fn: (arg: unknown) => void) => { handlers[event] = fn; } }, stdout, close: (code: number) => handlers.close?.(code) };
  };

  it('knows the same steps as the ingest CLI', () => {
    expect([...SYNC_STEPS]).toEqual([...STEPS]);
  });

  it('runs one step at a time, streams its lines, and drops the caches when it ends', async () => {
    const fake = fakeChild();
    const calls: string[][] = [];
    const before = getCardDb();
    const started = startSync({ step: 'meta', max: 5 }, (args) => { calls.push(args); return fake.child as never; });
    expect(calls).toEqual([['meta', '--max', '5']]);
    expect(started.running).toBe(true);
    expect(() => startSync({ step: 'cards' }, () => fake.child as never)).toThrow(/already running/);
    expect((await post('/api/sync', { step: 'cards' })).status).toBe(409);
    fake.stdout.emit('data', 'meta 1/5\nmeta 2');
    fake.stdout.emit('data', '/5\n');
    expect(syncState().lines).toEqual(['meta 1/5', 'meta 2/5']);
    expect((await get<SyncState>('/api/sync?since=1')).body.lines).toEqual(['meta 2/5']);
    fake.close(0);
    const done = syncState();
    expect(done).toMatchObject({ running: false, exitCode: 0, step: 'meta', lineCount: 2 });
    expect(getCardDb()).not.toBe(before); // reloaded after the sync
    expect((await post('/api/sync', { step: 'everything' })).status).toBe(400);
    expect((await post('/api/sync', { step: 'images', limit: -1 })).status).toBe(400);
  });
});

describe('typed client', () => {
  it('reaches every route and turns error bodies into ApiError', async () => {
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) => request(init?.method ?? 'GET', input, init?.body as string | undefined));
    expect((await api.getStatus()).ready).toBe(true);
    expect((await api.getLegends({ q: 'blade' })).legends.length).toBeGreaterThan(0);
    expect((await api.getChampions(irelia.legend!)).champions.length).toBeGreaterThan(0);
    const created = await api.createDeck(irelia);
    const id = created.deck.id!;
    expect((await api.getDeck(id)).deck.id).toBe(id);
    expect((await api.updateDeck(id, { ...created.deck, name: 'Client' })).deck.name).toBe('Client');
    expect((await api.listDecks()).decks).toHaveLength(1);
    expect((await api.analyzeDeck(created.deck, kaisa.legend)).lines.matchup.length).toBeGreaterThan(0);
    expect((await api.browseCards({ deck: created.deck, filters: { role: 'removal' }, pageSize: 5 })).cards.length).toBeGreaterThan(0);
    expect((await api.getCard(irelia.champion!, id)).score).not.toBeNull();
    expect((await api.getCardFor(irelia.champion!, created.deck)).score).not.toBeNull();
    expect((await api.buildDeck(created.deck, 'runes')).deck.runes).toBeTruthy();
    expect((await api.exportDeck(created.deck)).text).toContain('Main');
    expect((await api.importDeck({ text: '3 Defy' })).deck.main).toHaveLength(1);
    expect((await api.saveCollection({ text: '3 Defy' })).unique).toBe(1);
    expect((await api.getCollection()).total).toBe(3);
    expect((await api.updateSettings({ ownedOnly: true })).ownedOnly).toBe(true);
    expect((await api.getSettings()).ownedOnly).toBe(true);
    expect((await api.getSync()).running).toBe(false);
    expect(await api.deleteDeck(id)).toEqual({ ok: true });
    await expect(api.getDeck(id)).rejects.toMatchObject({ name: 'ApiError', status: 404, message: 'No deck with that id.' });
    expect(api.imagePath('ogn-001-298')).toBe('/api/img/ogn-001-298.webp');
  });
});

/** An empty database, as on first run before any sync. */
function seedEmpty(): Db {
  const empty = openDb(':memory:');
  useServerDb(empty);
  return empty;
}
