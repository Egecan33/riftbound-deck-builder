import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { rebuildCards, type GalleryItem, type RawGallery } from '@/ingest/cards';
import { syncErrata, validateErrata } from '@/ingest/errata';
import { syncFeatures } from '@/ingest/features';
import { imagePath, isWebp, syncImages, webpUrl } from '@/ingest/images';
import { syncLegality, validateLegality } from '@/ingest/legality';
import { syncMeta } from '@/ingest/meta';
import { parseArgs } from '@/ingest/sync';
import { invalidateCardDb, loadCardDb } from '@/server/carddb';
import { openDb, readSyncState } from '@/server/db';
import { readErrataFile, readLegalityFile, readOverridesFile, setOrderOf, toLegalityData } from '@/server/syncdata';

const tmp = mkdtempSync(path.join(tmpdir(), 'rbf-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

const item = (publicCode: string, name: string, type: string, extra: Partial<GalleryItem> = {}): GalleryItem => ({
  id: publicCode.toLowerCase(), name, publicCode, set: { value: { id: publicCode.split('-')[0] } },
  cardType: { type: [{ id: type }], superType: [] }, domain: { values: [{ id: 'fury' }] },
  cardImage: { url: `https://cdn.example/${publicCode.replace('/', '_')}-744x1039.png?accountingTag=RB` },
  text: { richText: { body: '<p>Deal 2 to a unit.</p>' } }, ...extra,
});
const raw: RawGallery = {
  fetchedAt: '2026-11-12T00:00:00.000Z',
  sets: [{ id: 'OGN', name: 'Origins' }],
  items: [
    item('OGN-005/298', 'Disintegrate', 'spell'),
    item('OGN-005a/298', 'Disintegrate', 'spell'),
    item('VEN-097/166', 'Spiderling', 'unit', { might: { value: { id: 1 } }, text: { richText: { body: '<p>Your deck can have any number of cards named Spiderling.</p>' } } }),
    item('OGN-271/298', 'Recruit (DE)', 'unit', { cardType: { type: [{ id: 'unit' }], superType: [{ id: 'token' }] }, might: { value: { id: 1 } } }),
  ],
};
const rawFile = path.join(tmp, 'gallery.json');
writeFileSync(rawFile, JSON.stringify(raw));
const quiet = () => undefined;

describe('database and card steps', () => {
  const db = openDb(':memory:');
  afterAll(() => db.close());

  it('creates every table of the spec', () => {
    const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map((t) => t.name);
    for (const t of ['cards', 'printings', 'card_features', 'card_edges', 'legend_profiles', 'meta_decks', 'meta_deck_cards', 'meta_legend_cards', 'collection', 'decks', 'settings', 'sync_state']) expect(tables).toContain(t);
  });

  it('rebuilds cards from a cached gallery file, twice with the same result, and applies errata', () => {
    const first = rebuildCards(db, quiet, { rawFile });
    const second = rebuildCards(db, quiet, { rawFile });
    expect(second).toEqual(first);
    expect(first.cards).toBe(2);
    expect(first.tokens).toBe(1);
    expect(first.printings).toBe(4);
    expect(first.errata).toBe(1);
    const cards = loadCardDb(db);
    expect(cards.all().map((c) => c.name).sort()).toEqual(['Disintegrate', 'Spiderling']);
    expect(cards.byName('OGN-005a')?.name).toBe('Disintegrate');
    expect(cards.byName('Disintegrate')?.errata).toBe(true);
    expect(cards.byName('Disintegrate')?.text).not.toBe('Deal 2 to a unit.');
    expect(cards.byName('spiderling')?.copyLimit).toBe(Infinity);
    expect(cards.legality().sideboardMax).toBe(10);
    expect(readSyncState(db, 'cards')?.info.cards).toBe(2);
  });

  it('refuses a build that loses cards unless told otherwise', () => {
    const smaller = path.join(tmp, 'smaller.json');
    writeFileSync(smaller, JSON.stringify({ ...raw, items: raw.items.slice(0, 2) }));
    expect(() => rebuildCards(db, quiet, { rawFile: smaller })).toThrow(/refusing/);
    expect(rebuildCards(db, quiet, { rawFile: smaller, allowShrink: true }).cards).toBe(1);
    rebuildCards(db, quiet, { rawFile });
  });

  it('errata and features steps write their state', () => {
    expect(syncErrata(db, quiet, { rawFile }).applied).toBe(1);
    expect(readSyncState(db, 'errata')?.info.entries).toBe(70);
    syncFeatures(db, quiet);
    // Plan Task 4 replaced the stub: the step now mines every card (see tests/ingest/features.test.ts).
    expect(readSyncState(db, 'features')?.info.implemented).toBe(true);
  });

  it('the legality step fails loudly when a ban does not match the cards', async () => {
    invalidateCardDb();
    await expect(syncLegality(db, quiet, { skipHub: true })).rejects.toThrow(/does not match the synced cards/);
  });

  it('the legality step warns when the Rules Hub is newer than the file', async () => {
    const empty = openDb(':memory:');
    const lines: string[] = [];
    const page = '<p>Last updated: December 1, 2026</p>';
    const info = await syncLegality(empty, (l) => lines.push(l), { http: { minGapMs: 0, fetchImpl: (async () => new Response(page)) as typeof fetch } });
    expect(info).toMatchObject({ bans: 13, sets: 6, hubNewest: '2026-12-01', stale: true });
    expect(lines.join('\n')).toMatch(/Rules Hub was updated 2026-12-01/);
    const down = await syncLegality(empty, quiet, { http: { minGapMs: 0, maxAttempts: 1, fetchImpl: (async () => { throw new Error('offline'); }) as typeof fetch } });
    expect(down).toMatchObject({ hubChecked: false, stale: false });
    empty.close();
  });

  it('images download once, skip what is there, and report failures without stopping', async () => {
    const dir = path.join(tmp, 'images');
    const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.from([4, 0, 0, 0]), Buffer.from('WEBP'), Buffer.from('data')]);
    const urls: string[] = [];
    const fetchImpl = (async (url: string) => {
      urls.push(String(url));
      return String(url).includes('VEN-097') ? new Response('nope', { status: 500 }) : new Response(webp);
    }) as unknown as typeof fetch;
    const first = await syncImages(db, quiet, { dir, http: { fetchImpl } });
    expect(first).toMatchObject({ cards: 3, downloaded: 2, failed: 1, present: 2 });
    expect(urls.every((u) => u.includes('fm=webp'))).toBe(true);
    expect(await isWebp(imagePath('ogn-005-298', dir))).toBe(true);
    const second = await syncImages(db, quiet, { dir, limit: 2, http: { fetchImpl: (async () => new Response(webp)) as unknown as typeof fetch } });
    expect(second.downloaded + second.skipped).toBe(2);
    expect(webpUrl('https://x.test/a-744x1039.png?accountingTag=RB')).toBe('https://x.test/a-744x1039.png?accountingTag=RB&fm=webp&q=85');
  });

  it('the meta step runs offline from an empty cache', async () => {
    const info = await syncMeta(db, quiet, { max: 0, researchDir: null, deckCache: path.join(tmp, 'none.jsonl'), listCache: path.join(tmp, 'none-list.jsonl') });
    expect(info).toMatchObject({ decks: 0, legends: 0, requests: 0 });
  });
});

describe('sync-data files', () => {
  const legality = readLegalityFile();

  it('legality: six sets, twelve Standard bans, the 2v2 legend ban, side deck of 10, sources on every ban', () => {
    expect(validateLegality(legality)).toEqual([]);
    expect(legality.sets.map((s) => s.code).sort()).toEqual(['OGN', 'OGS', 'RAD', 'SFD', 'UNL', 'VEN']);
    expect(setOrderOf(legality)).toEqual(['OGN', 'OGS', 'SFD', 'UNL', 'VEN', 'RAD']);
    expect(legality.sideboardMax).toBe(10);
    const standard = legality.bans.filter((b) => b.formats.includes('standard-bo1') && b.formats.includes('standard-bo3'));
    expect(standard).toHaveLength(12);
    expect(standard.filter((b) => b.zone === 'battlefields')).toHaveLength(5);
    expect(standard.every((b) => b.formats.includes('2v2'))).toBe(true);
    const only2v2 = legality.bans.filter((b) => !b.formats.includes('standard-bo1'));
    expect(only2v2.map((b) => [b.name, b.zone, b.code, b.formats])).toEqual([['Wuju Bladesman', 'legend', 'OGS-019', ['2v2']]]);
    for (const b of legality.bans) expect(b.sourceUrl).toMatch(/^https:\/\/playriftbound\.com\//);
  });

  it('free-for-all uses the Standard bans only while the heuristic switch is on', () => {
    const on = toLegalityData(legality);
    const off = toLegalityData(legality, { ffaUsesStandardBans: false });
    expect(on.bans.filter((b) => b.formats.includes('ffa4'))).toHaveLength(12);
    expect(off.bans.filter((b) => b.formats.includes('ffa3') || b.formats.includes('ffa4'))).toHaveLength(0);
    expect(on.bans.filter((b) => b.formats.includes('casual'))).toHaveLength(0);
    expect(on.bans.find((b) => b.name === 'Wuju Bladesman')?.formats).toEqual(['2v2']);
  });

  it('errata: 70 reviewed entries with sources and codes; overrides name their reason and source', () => {
    const errata = readErrataFile();
    expect(validateErrata(errata)).toEqual([]);
    expect(errata.errata).toHaveLength(70);
    expect(errata.errata.filter((e) => e.status === 'faq-only').map((e) => e.cardName).sort()).toEqual(['Symbol of the Solari', 'Unyielding Spirit', 'Wraith of Echoes']);
    expect(errata.errata.every((e) => e.codes.length > 0)).toBe(true);
    const overrides = readOverridesFile();
    for (const o of overrides.cards) expect(o.reason.length > 10 && o.source.length > 5, o.name).toBe(true);
    expect(overrides.cards.find((o) => o.name === 'Karma, Channeler')?.championTag).toBe('Karma');
  });

  it('parses the sync command line', () => {
    expect(parseArgs(['meta', 'cards', '--max', '20']).steps).toEqual(['cards', 'meta']);
    expect(parseArgs(['images', '--limit', '200']).flags.limit).toBe(200);
    expect(parseArgs([]).steps).toEqual(['cards', 'errata', 'legality', 'meta', 'features', 'images']);
    expect(parseArgs(['all', 'fixtures']).steps.at(-1)).toBe('fixtures');
    expect(() => parseArgs(['nope'])).toThrow(/unknown argument/);
    expect(() => parseArgs(['--limit', 'x'])).toThrow();
  });
});
