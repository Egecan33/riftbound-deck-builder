// Adversarial review of the text importer, exporter and deck codes against the REAL synced pool and the
// real public lists in data/forge.db (and the raw Piltover Archive cache when it is on disk).
// Skipped where the database has not been synced.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { getCodeFromDeck } from '@piltoverarchive/riftbound-deck-codes';
import { describe, expect, it } from 'vitest';
import { createCardDb } from '@/engine/carddb';
import { isLegal, validateDeck } from '@/engine/rules/validate';
import { decodeDeckCode, encodeDeckCode, exportDecklist, parseDecklist } from '@/engine/text';
import type { Card, Deck, DeckEntry, Domain, Format } from '@/engine/types';
import { fixtureDeckFiles } from '../helpers/fixture-db';
import { hasRealDb, metaLists, realDb, type MetaList } from '../helpers/real-db';

const FIXTURES = path.join(process.cwd(), 'tests', 'fixtures');
const RAW = path.join(process.cwd(), 'data', 'raw', 'pa-decks.jsonl');

describe.skipIf(!hasRealDb())('text import, export and deck codes on the real pool', () => {
  const db = hasRealDb() ? realDb() : createCardDb([]);
  const lists = hasRealDb() ? metaLists() : [];
  const all = [...db.all()].sort((a, b) => a.id.localeCompare(b.id));
  const blank: Deck = { id: null, name: 'x', format: 'standard-bo3', power: 'focused', legend: null, champion: null, main: [], side: [], runes: {}, battlefields: [], extraLegends: [], themeWeights: null, teammate: null };
  const full = (part: Partial<Deck>, format: Format = 'standard-bo3'): Deck => ({ ...blank, ...part, format });
  const merge = (entries: readonly DeckEntry[] | undefined): [string, number][] => {
    const m = new Map<string, number>();
    for (const x of entries ?? []) m.set(x.id, (m.get(x.id) ?? 0) + x.qty);
    return [...m.entries()].filter(([, q]) => q > 0).sort((a, b) => a[0].localeCompare(b[0]));
  };
  /** A deck reduced to what a list can carry, in a fixed order. */
  const shape = (d: Partial<Deck>) => ({
    legend: d.legend ?? null, champion: d.champion ?? null, main: merge(d.main), side: merge(d.side),
    runes: Object.entries(d.runes ?? {}).filter(([, n]) => (n ?? 0) > 0).sort(), battlefields: [...(d.battlefields ?? [])].sort(),
    extraLegends: [...(d.extraLegends ?? [])].sort(),
  });
  const count = (entries: readonly DeckEntry[] | undefined): number => (entries ?? []).reduce((n, x) => n + x.qty, 0);
  const errorCodes = (deck: Deck): string[] => [...new Set(validateDeck(deck, db).filter((v) => v.severity === 'error').map((v) => v.code))].sort();
  const fromMeta = (l: MetaList, format: Format): Deck => {
    const runes: Partial<Record<Domain, number>> = {};
    for (const r of l.zones.runes) { const d = db.get(r.id)?.domains[0]; if (d) runes[d] = (runes[d] ?? 0) + r.qty; }
    const ent = (z: { id: string; qty: number }[]): DeckEntry[] => z.map((x) => ({ id: x.id, qty: x.qty, locked: false }));
    return full({ name: l.name, legend: l.legend, champion: l.champion, main: ent(l.zones.main), side: ent(l.zones.side), runes, battlefields: l.zones.battlefields.flatMap((x) => Array.from({ length: x.qty }, () => x.id)) }, format);
  };
  const formatOf = (l: MetaList): Format => (l.format === '2v2' ? '2v2' : 'standard-bo3');

  it('the six reference lists: parse, validate, export and parse again', () => {
    const files = fixtureDeckFiles();
    expect(files).toHaveLength(6);
    for (const file of files) {
      const text = readFileSync(path.join(FIXTURES, 'decks', file), 'utf8');
      const first = parseDecklist(text, db);
      expect(first.unresolved, file).toEqual([]);
      const deck = full(first.deck);
      expect(count(deck.main), file).toBe(40);
      expect(Object.values(deck.runes).reduce((a, b) => a + (b ?? 0), 0), file).toBe(12);
      expect(deck.battlefields, file).toHaveLength(3);
      expect(deck.champion, file).not.toBeNull();
      expect(errorCodes(deck), file).toEqual([]);
      expect(isLegal(validateDeck(deck, db)), file).toBe(true);
      const out = exportDecklist(deck, db);
      const second = parseDecklist(out, db);
      expect(second.unresolved, file).toEqual([]);
      expect(shape(second.deck), file).toEqual(shape(deck));
      expect(exportDecklist(full(second.deck), db), file).toBe(out);
      // The same list as a deck code.
      const code = encodeDeckCode(deck, db);
      expect(code.error, file).toBeNull();
      expect(code.skipped, file).toEqual([]);
      const viaCode = parseDecklist(code.code, db);
      expect(viaCode.unresolved, file).toEqual([]);
      expect(shape(viaCode.deck), file).toEqual(shape(deck));
    }
  });

  it('every complete public list of the meta sync: export -> parse -> export is lossless and the verdict does not change', () => {
    const complete = lists.filter((l) => l.complete);
    expect(complete.length).toBeGreaterThanOrEqual(50);
    const fails: string[] = [];
    let legal = 0;
    for (const l of complete) {
      const deck = fromMeta(l, formatOf(l));
      const text = exportDecklist(deck, db);
      const parsed = parseDecklist(text, db);
      if (parsed.unresolved.length) fails.push(`${l.id}: unresolved ${JSON.stringify(parsed.unresolved)}`);
      const back = full({ ...parsed.deck, name: deck.name }, deck.format);
      if (JSON.stringify(shape(back)) !== JSON.stringify(shape(deck))) fails.push(`${l.id}: deck changed in the round trip`);
      if (exportDecklist(back, db) !== text) fails.push(`${l.id}: second export differs`);
      const before = errorCodes(deck);
      if (before.join() !== errorCodes(back).join()) fails.push(`${l.id}: verdict changed`);
      if (before.length === 0) legal += 1;
      // The sync counted banned cards per list; the deck check must agree, and so must the import notices.
      const flagged = validateDeck(back, db).filter((v) => v.code === 'CARD_BANNED' || v.code === 'LEGEND_BANNED');
      if ((l.banned > 0) !== (flagged.length > 0)) fails.push(`${l.id}: sync says ${l.banned} banned cards, validateDeck flags ${flagged.length}`);
      for (const v of flagged) {
        const name = (db.get(v.cardIds[0]) as Card).name;
        if (!parsed.notices.some((n) => n.includes(name) && /ban/i.test(n))) fails.push(`${l.id}: no import notice for banned ${name}`);
      }
      // And through a deck code.
      const code = encodeDeckCode(deck, db);
      const decoded = decodeDeckCode(code.code, db);
      if (code.error || code.skipped.length || decoded.error || decoded.unresolved.length) fails.push(`${l.id}: deck code ${code.error ?? decoded.error ?? code.skipped.join() ?? ''}`);
      else if (JSON.stringify(shape(decoded.deck)) !== JSON.stringify(shape(deck))) fails.push(`${l.id}: deck changed through its deck code`);
    }
    expect(fails).toEqual([]);
    expect(legal).toBeGreaterThan(complete.length / 2);
  }, 120_000);

  it('incomplete public lists survive the round trip too and are never called legal by accident', () => {
    for (const l of lists.filter((x) => !x.complete)) {
      const deck = fromMeta(l, formatOf(l));
      const parsed = parseDecklist(exportDecklist(deck, db), db);
      expect(parsed.unresolved, l.id).toEqual([]);
      const back = full(parsed.deck, deck.format);
      // A list without a legend cannot say which legend is the Champion Legend; everything else is kept.
      if (deck.legend && (deck.champion === null || deck.main.some((x) => x.id === deck.champion))) expect(shape(back), l.id).toEqual(shape(deck));
      expect(errorCodes(back).length > 0 || !isLegal(validateDeck(back, db)) || isLegal(validateDeck(deck, db)), l.id).toBe(true);
    }
  });

  it('every banned card pasted into a list is kept, named in a notice, and flagged by the deck check', () => {
    const text = readFileSync(path.join(FIXTURES, 'decks', fixtureDeckFiles()[0]), 'utf8');
    for (const ban of db.legality().bans) {
      const card = db.byName(ban.name) as Card;
      const section = card.type === 'legend' ? 'Legend' : card.type === 'battlefield' ? 'Battlefields' : 'Sideboard';
      const pasted = card.type === 'legend' ? `Legend:\n1 ${card.name}\n` : `${text}\n${section}:\n1 ${card.name}\n`;
      const parsed = parseDecklist(pasted, db);
      expect(parsed.unresolved, ban.name).toEqual([]);
      expect(parsed.notices.some((n) => n.includes(card.name) && /ban list/.test(n)), ban.name).toBe(true);
      for (const format of ['standard-bo3', '2v2', 'ffa3', 'casual'] as Format[]) {
        const vs = validateDeck(full(parsed.deck, format), db);
        const flagged = vs.some((v) => (v.code === 'CARD_BANNED' || v.code === 'LEGEND_BANNED') && v.cardIds.includes(card.id));
        expect(flagged, `${ban.name} ${format}`).toBe(ban.formats.includes(format));
        if (flagged) expect(isLegal(vs)).toBe(false);
      }
    }
  });

  it('every card of the pool reads back from every way a list can write it', () => {
    const fails: string[] = [];
    const zoneOf = (c: Card): string => (c.type === 'legend' ? 'legend' : c.type === 'battlefield' ? 'battlefields' : c.type === 'rune' ? 'runes' : 'main');
    for (const card of all) {
      const forms: [string, number][] = [
        [`2 ${card.name}`, 2], [`2x ${card.name}`, 2], [`${card.name} x2`, 2], [card.name, 1], [`- 2 ${card.name}`, 2],
        [`2 ${card.code}`, 2], [`2 ${card.name} (${card.code})`, 2], [`2 ${card.name.toUpperCase()}`, 2], [`2 ${card.name.replace(/'/g, '’')}`, 2],
        [`Main:\n2 ${card.name}`, 2], [`Sideboard:\n2 ${card.name}`, 2],
      ];
      for (const [text, qty] of forms) {
        const p = parseDecklist(text, db);
        const zone = zoneOf(card);
        const side = text.startsWith('Sideboard') && zone === 'main';
        const got =
          zone === 'legend' ? (p.deck.legend === card.id ? 1 : 0)
          : zone === 'battlefields' ? (p.deck.battlefields ?? []).filter((x) => x === card.id).length
          : zone === 'runes' ? (p.deck.runes?.[card.domains[0]] ?? 0)
          : count(((side ? p.deck.side : p.deck.main) ?? []).filter((x) => x.id === card.id));
        const wantQty = zone === 'legend' ? 1 : qty;
        if (p.unresolved.length || got !== wantQty) fails.push(`${JSON.stringify(text)} -> ${got} of ${card.id}, unresolved ${JSON.stringify(p.unresolved)}`);
      }
    }
    expect(fails).toEqual([]);
  }, 120_000);

  it('20 real deck codes from Piltover Archive decode to the list the site showed', () => {
    const file = JSON.parse(readFileSync(path.join(FIXTURES, 'deck-codes.json'), 'utf8')) as {
      decks: { url: string; code: string; legend: string; chosenChampion: string; battlefields: string[]; main: [string, number][]; runes: [string, number][]; sideboard: [string, number][] }[];
    };
    expect(file.decks).toHaveLength(20);
    const idOf = (code: string): string => {
      const c = db.byName(code);
      if (!c) throw new Error(`pool has no ${code}`);
      return c.id;
    };
    const ent = (rows: [string, number][]): DeckEntry[] => rows.map(([code, qty]) => ({ id: idOf(code), qty, locked: false }));
    for (const d of file.decks) {
      const runes: Partial<Record<Domain, number>> = {};
      for (const [code, qty] of d.runes) { const dom = (db.byName(code) as Card).domains[0]; runes[dom] = (runes[dom] ?? 0) + qty; }
      const expected = shape({ legend: idOf(d.legend), champion: idOf(d.chosenChampion), main: ent(d.main), side: ent(d.sideboard), runes, battlefields: d.battlefields.map(idOf) });
      const decoded = decodeDeckCode(d.code, db);
      expect(decoded.error, d.url).toBeNull();
      expect(decoded.unresolved, d.url).toEqual([]);
      expect(shape(decoded.deck), d.url).toEqual(expected);
      expect(count(decoded.deck.main), d.url).toBe(40);
      // Lower case and surrounding blanks, as pasted; and through the list importer.
      expect(shape(parseDecklist(`  ${d.code.toLowerCase()}\n`, db).deck), d.url).toEqual(expected);
      // Our own code for the decoded deck reads back to the same deck.
      const again = encodeDeckCode(full(decoded.deck), db);
      expect(again.error, d.url).toBeNull();
      expect(shape(decodeDeckCode(again.code, db).deck), d.url).toEqual(expected);
      // The September lists predate two ban updates: banned cards are named, not dropped.
      const banned = validateDeck(full(decoded.deck), db).filter((v) => v.code === 'CARD_BANNED');
      for (const v of banned) expect(decoded.notices.some((n) => n.includes((db.get(v.cardIds[0]) as Card).name)), d.url).toBe(true);
    }
  });

  it.skipIf(!existsSync(RAW))('the names and codes Piltover Archive itself writes resolve to the same cards, and its own printing codes make a readable deck code', () => {
    const raw = readFileSync(RAW, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l) as Record<string, unknown>);
    type Row = { q: number; name: string; code: string; type?: string };
    const fails: string[] = [];
    const seen = new Set<string>();
    let codes = 0;
    let skipped = 0;
    let runeVariants = 0;
    for (const d of raw) {
      const legend = d.legend as { name: string; code: string } | null;
      const zones = ['champions', 'battlefields', 'runes', 'main', 'side'].map((z) => [z, (d[z] ?? []) as Row[]] as const);
      const rows: Row[] = [...(legend ? [{ q: 1, name: legend.name, code: legend.code }] : []), ...zones.flatMap(([, r]) => r)];
      for (const r of rows) {
        const key = `${r.name}|${r.code}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const byCode = /-R\d/.test(r.code) ? all.find((c) => c.type === 'rune' && c.name === r.name) : db.byName(r.code);
        const byLine = parseDecklist(`Main:\n${r.q} ${r.name}`, db);
        const hit = byLine.deck.legend ?? byLine.deck.battlefields?.[0] ?? byLine.deck.main?.[0]?.id ?? (byLine.deck.runes && byCode && byLine.deck.runes[byCode.domains[0]] ? byCode.id : undefined);
        if (!byCode) fails.push(`code ${r.code} (${r.name}) is not in the pool`);
        else if (hit !== byCode.id) fails.push(`"${r.name}" reads as ${hit}, its code ${r.code} is ${byCode.id}`);
        else {
          // The printing code alone, as a list line: the same card.
          const viaCode = parseDecklist(`${r.q} ${r.code}`, db);
          const got = viaCode.deck.legend ?? viaCode.deck.battlefields?.[0] ?? viaCode.deck.main?.[0]?.id ?? (viaCode.deck.runes?.[byCode.domains[0]] ? byCode.id : undefined);
          if (viaCode.unresolved.length || got !== byCode.id) fails.push(`code line "${r.q} ${r.code}" (${r.name}) reads as ${got}`);
        }
      }
      // A deck code built from the site's own printing codes (alt arts, rune variants) decodes to the merged list.
      const get = (z: string): Row[] => (d[z] ?? []) as Row[];
      if (!legend || get('champions').length !== 1) continue;
      const main = new Map<string, number>();
      for (const r of [{ q: 1, code: legend.code }, ...get('champions'), ...get('main'), ...get('battlefields'), ...get('runes')]) main.set(r.code, (main.get(r.code) ?? 0) + r.q);
      const side = new Map<string, number>();
      for (const r of get('side')) side.set(r.code, (side.get(r.code) ?? 0) + r.q);
      let code: string;
      try {
        code = getCodeFromDeck([...main].map(([cardCode, count]) => ({ cardCode, count })), [...side].map(([cardCode, count]) => ({ cardCode, count })), get('champions')[0].code);
      } catch { skipped += 1; continue; } // a list the library cannot encode is not a decoder case
      codes += 1;
      if (get('runes').some((r) => /^(?:SFD|UNL)-R/.test(r.code))) runeVariants += 1;
      const decoded = decodeDeckCode(code, db);
      const total = (rows2: Row[]): number => rows2.reduce((n, r) => n + r.q, 0);
      if (decoded.error || decoded.unresolved.length) { fails.push(`${String(d.id)}: ${decoded.error ?? JSON.stringify(decoded.unresolved)}`); continue; }
      if (decoded.deck.legend !== db.byName(legend.code)?.id) fails.push(`${String(d.id)}: legend`);
      if (decoded.deck.champion !== db.byName(get('champions')[0].code)?.id) fails.push(`${String(d.id)}: champion`);
      if (count(decoded.deck.main) !== total(get('main')) + 1) fails.push(`${String(d.id)}: main ${count(decoded.deck.main)} vs ${total(get('main')) + 1}`);
      if (count(decoded.deck.side) !== total(get('side'))) fails.push(`${String(d.id)}: side`);
      if ((decoded.deck.battlefields ?? []).length !== total(get('battlefields'))) fails.push(`${String(d.id)}: battlefields`);
      if (Object.values(decoded.deck.runes ?? {}).reduce((a, b) => a + (b ?? 0), 0) !== total(get('runes'))) fails.push(`${String(d.id)}: runes`);
    }
    expect(fails).toEqual([]);
    expect(codes).toBeGreaterThanOrEqual(20);
    expect(skipped).toBeLessThan(codes / 10);
    console.info(`deck codes from Piltover Archive printing codes: ${codes} decoded, ${skipped} not encodable, ${runeVariants} with SFD/UNL rune codes; ${seen.size} distinct name/code pairs`);
  }, 120_000);
});
