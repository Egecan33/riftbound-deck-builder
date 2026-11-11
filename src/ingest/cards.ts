// `cards` step: official gallery JSON -> gameplay cards and printings.
// Field handling follows GameLab packages/cards/src/build/canonicalize.ts and ids.ts, changed for the
// current gallery shape (name and subtitle are separate; docs/research/legality-and-data.md §5.1, §7.1).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { serializeCard } from '@/engine/carddb';
import { nameKey, rulesName, shortName, stripTokenSuffix } from '@/engine/rules/names';
import type { Card, CardType, Domain } from '@/engine/types';
import { RAW_DIR, writeSyncState, type Db } from '@/server/db';
import { invalidateCardDb } from '@/server/carddb';
import { readErrataFile, readLegalityFile, readOverridesFile, setOrderOf, type CardOverride, type ErrataEntry } from '@/server/syncdata';
import { getJson } from './http';
import { DOMAINS, copyLimitFromText, letterSymbolsToCanonical, ownKeywords, richToPlain } from './text';

export type Log = (line: string) => void;

const GALLERY_BASE = 'https://content.publishing.riotgames.com/publishing-content/v2.0/public/channel/riftbound_website/list';
export const GALLERY_CARDS_URL = `${GALLERY_BASE}/riftbound_gallery_cards?locale=en_US&from=0&limit=2000`;
export const GALLERY_SETS_URL = `${GALLERY_BASE}/riftbound_gallery_sets?locale=en_US&from=0&limit=200`;
export const RAW_GALLERY_FILE = path.join(RAW_DIR, 'gallery-latest.json');

const CARD_TYPES: readonly CardType[] = ['unit', 'spell', 'gear', 'rune', 'battlefield', 'legend'];
/** Line prefix for an Equipment's attached-effect text, which the gallery keeps in its own "Effect" field. */
export const EFFECT_PREFIX = 'Effect: ';
// CR 103.3.b: "up to 3 copies of the same named card". The only copy limit not carried by card text;
// it is a core rule, not a list, so it is a constant here. Unique and "any number" come from the text.
const DEFAULT_COPY_LIMIT = 3;

interface Ref { id: string | number; label?: string }
export interface GalleryItem {
  id: string;
  collectorNumber?: number;
  name: string;
  subtitle?: string | null;
  publicCode: string;
  set: { value: { id: string; label?: string } };
  cardType: { type?: Ref[] | null; superType?: Ref[] | null };
  rarity?: { value?: Ref | null } | null;
  domain?: { values?: Ref[] | null } | null;
  cardImage: { url: string; accessibilityText?: string | null; dimensions?: { width?: number; height?: number } | null };
  text?: { richText?: { body?: string | null } | null } | null;
  effect?: { richText?: { body?: string | null } | null } | null;
  energy?: { value?: Ref | null } | null;
  might?: { value?: Ref | null } | null;
  power?: { value?: Ref | null } | null;
  mightBonus?: { value?: Ref | null } | null;
  tags?: { tags?: string[] | null } | null;
}

export type Variant = 'base' | 'alt' | 'signature' | 'special' | 'overnumbered' | 'token' | 'rune';
export interface ParsedCode { set: string; prefix: '' | 'SP' | 'T' | 'R'; number: number; suffix: string; total: number | null }

const CODE_RE = /^([A-Z]{2,4})-(SP|T|R)?(\d+)([abs*])?(?:\/(\d+))?$/;

export function parsePublicCode(code: string): ParsedCode {
  const m = CODE_RE.exec(code.trim());
  if (!m) throw new Error(`Unparseable card code: ${code}`);
  return { set: m[1], prefix: (m[2] ?? '') as ParsedCode['prefix'], number: Number(m[3]), suffix: m[4] ?? '', total: m[5] === undefined ? null : Number(m[5]) };
}

export function variantOf(p: ParsedCode): Variant {
  if (p.prefix === 'T') return 'token';
  if (p.prefix === 'R') return 'rune';
  if (p.prefix === 'SP') return 'special';
  if (p.suffix === '*' || p.suffix === 's') return 'signature';
  if (p.suffix === 'a' || p.suffix === 'b') return 'alt';
  return p.total !== null && p.number > p.total ? 'overnumbered' : 'base';
}

const numberPart = (p: ParsedCode): string =>
  p.prefix === 'SP' ? `SP${p.number}` : p.prefix ? `${p.prefix}${String(p.number).padStart(2, '0')}` : String(p.number).padStart(3, '0');

/** Deck-code form: OGN-001, OGN-066a, SFD-227s, VEN-SP3, UNL-T01. */
export const cardCodeOf = (p: ParsedCode): string => `${p.set}-${numberPart(p)}${p.suffix === '*' ? 's' : p.suffix}`;

/** One id per printing, filesystem-safe: ogn-066a-298, sfd-227s-221, ven-sp3-006, unl-t01. */
export function printingIdOf(p: ParsedCode): string {
  const core = cardCodeOf(p).toLowerCase();
  return p.total === null ? core : `${core}-${String(p.total).padStart(3, '0')}`;
}

export interface PrintingRow {
  id: string; cardId: string; code: string; publicCode: string; set: string; collectorNumber: number;
  variant: Variant; rarity: string | null; imageUrl: string; width: number | null; height: number | null;
}

const ids = (refs: Ref[] | null | undefined): string[] => (refs ?? []).map((r) => String(r.id).toLowerCase());
const intOf = (v: { value?: Ref | null } | null | undefined): number | null => {
  if (v?.value == null) return null;
  const n = Number(v.value.id);
  return Number.isFinite(n) ? n : null;
};
const bodyOf = (v: GalleryItem['text']): string => (v?.richText?.body ? richToPlain(v.richText.body) : '');
const isTokenRow = (item: GalleryItem): boolean => ids(item.cardType.superType).includes('token');

/** The type word of the image's accessibility text ("Riftbound Unit: Name. ..."), when it is a card type. */
function accessibilityType(item: GalleryItem): CardType | null {
  const word = /^Riftbound ([A-Za-z]+):/.exec(item.cardImage.accessibilityText ?? '')?.[1]?.toLowerCase();
  return word && (CARD_TYPES as readonly string[]).includes(word) ? (word as CardType) : null;
}

function galleryType(item: GalleryItem): CardType | null {
  const types = ids(item.cardType.type).filter((t): t is CardType => (CARD_TYPES as readonly string[]).includes(t));
  return types.length === 1 ? types[0] : null;
}

const rowName = (item: GalleryItem): string =>
  rulesName({ name: item.name, subtitle: item.subtitle, type: galleryType(item), superTypes: ids(item.cardType.superType) });

/** Printings with the same key are one gameplay card. A token never merges with a real card. */
export function groupKey(item: GalleryItem): string {
  return isTokenRow(item) ? `token:${nameKey(stripTokenSuffix(item.name))}` : nameKey(rowName(item));
}

const findOverride = (overrides: readonly CardOverride[], name: string): CardOverride | undefined => {
  const key = nameKey(name);
  return overrides.find((o) => nameKey(o.name) === key);
};

const findErrata = (errata: readonly ErrataEntry[], name: string, codes: readonly string[]): ErrataEntry | undefined => {
  const live = errata.filter((e) => e.status !== 'superseded');
  const key = nameKey(name);
  return live.find((e) => e.codes.some((c) => codes.includes(c))) ?? live.find((e) => e.codes.length === 0 && nameKey(e.cardName) === key);
};

export interface BuildContext { setOrder?: readonly string[] }
export interface BuiltCard { card: Card; printings: PrintingRow[]; issues: string[] }

/** Collapses the printings of one name into a gameplay card. See `toCard` for the rules. */
export function buildCard(
  group: readonly GalleryItem[],
  errata: readonly ErrataEntry[] = [],
  overrides: readonly CardOverride[] = [],
  ctx: BuildContext = {},
): BuiltCard {
  if (group.length === 0) throw new Error('buildCard needs at least one printing');
  const setRank = (set: string): number => {
    const i = (ctx.setOrder ?? []).indexOf(set);
    return i === -1 ? 99 : i;
  };
  const variantRank = (v: Variant): number => (v === 'base' ? 0 : v === 'token' ? 1 : v === 'rune' ? 2 : 3);
  const parsed = group
    .map((item) => {
      const code = parsePublicCode(item.publicCode);
      return { item, code, variant: variantOf(code) };
    })
    .sort((a, b) => variantRank(a.variant) - variantRank(b.variant) || setRank(a.code.set) - setRank(b.code.set) || a.code.number - b.code.number || a.item.publicCode.localeCompare(b.item.publicCode));
  // Primary printing: base variant first, then earliest set, then lowest number.
  const primary = parsed[0];
  const item = primary.item;
  const issues: string[] = [];

  const superTypes = ids(item.cardType.superType);
  const token = superTypes.includes('token');
  const name = token ? stripTokenSuffix(item.name) : rowName(item);
  const override = findOverride(overrides, name);
  const code = cardCodeOf(primary.code);
  if (override?.code && override.code !== code) issues.push(`override for "${override.name}" expects code ${override.code}, card is ${code}`);

  const gType = galleryType(item);
  const aType = accessibilityType(item);
  // The gallery repeats an Equipment's Might bonus in `might`; a gear has no Might of its own.
  const bonus = intOf(item.mightBonus);
  let might = intOf(item.might);
  if (might !== null && might === bonus && (override?.type ?? aType ?? gType) !== 'unit') might = null;

  // Type. An empty type, a type that contradicts the row's own image text, a "spell" with Might or a
  // "unit" without Might is missing or wrong data: the card is flagged, never guessed (plan Review focus 2).
  let type: CardType | null = null;
  if (override?.type) type = override.type;
  else if (gType === null) {
    // Buff and XP Tracker are typeless markers, not unfinished rows (rules.md §11); a token is never deckable anyway.
    if (!token) issues.push('no card type in the gallery row');
  }
  else if (aType !== null && aType !== gType) issues.push(`type conflict: gallery says ${gType}, image text says ${aType}`);
  else if (gType === 'spell' && might !== null) issues.push('typed spell but has Might');
  else if (gType === 'unit' && might === null && !token) issues.push('typed unit but has no Might');
  else type = gType;

  // Domains. "colorless" means no domain; an empty list means the row is unfinished.
  const domainIds = parsed.map((p) => ids(p.item.domain?.values)).find((d) => d.length > 0) ?? [];
  let domains = domainIds.filter((d): d is Domain => (DOMAINS as readonly string[]).includes(d));
  let noDomain = domains.length === 0 && domainIds.includes('colorless');
  if (override?.domains) { domains = [...override.domains]; noDomain = false; }
  if (override?.noDomain) { domains = []; noDomain = true; }
  const domainMissing = domains.length === 0 && !noDomain;
  if (domainMissing) issues.push('no domain in the gallery row');

  const championUnit = (type ?? gType) === 'unit' && superTypes.includes('champion');
  const short = shortName(name, championUnit);

  // Tags are not stable across printings (rules.md §3): take the union, never compare whole lists.
  const tags: string[] = [];
  for (const p of parsed) for (const t of p.item.tags?.tags ?? []) if (!tags.includes(t)) tags.push(t);
  const finalTags = override?.tags ? [...override.tags] : tags;

  let championTag: string | null = override?.championTag ?? null;
  if (!championTag && championUnit) {
    championTag = short;
    if (!finalTags.includes(short)) issues.push(`champion unit whose tags ${JSON.stringify(finalTags)} lack its short name "${short}"`);
  }
  // Legends and signature cards get their champion tag in `buildCards`, which knows every champion name.
  // A signature card's subtitle is the owning champion; use it until then.
  if (!championTag && superTypes.includes('signature') && item.subtitle) championTag = item.subtitle.trim();

  // Text. Printed text is the first printing's; current text is the errata text when one exists,
  // otherwise the text of the newest printing (rulings-and-errata.md §4.1).
  const effect = parsed.map((p) => bodyOf(p.item.effect)).find((t) => t.length > 0) ?? '';
  const withEffect = (text: string): string =>
    effect && !text.includes(effect) ? [text, ...effect.split('\n').map((l) => EFFECT_PREFIX + l)].filter(Boolean).join('\n') : text;
  const printedMain = bodyOf(item.text);
  const newest = [...parsed].filter((p) => bodyOf(p.item.text).length > 0).sort((a, b) => setRank(b.code.set) - setRank(a.code.set) || variantRank(a.variant) - variantRank(b.variant))[0];
  const newestMain = newest ? bodyOf(newest.item.text) : printedMain;
  const codes = [...new Set(parsed.map((p) => cardCodeOf(p.code)))];
  const fix = findErrata(errata, name, codes);
  const currentMain = fix ? letterSymbolsToCanonical(fix.currentText, domains) : newestMain;
  const text = withEffect(currentMain);

  const keywords = ownKeywords(currentMain);
  let copyLimit = copyLimitFromText(currentMain, keywords) ?? DEFAULT_COPY_LIMIT;
  if (override?.copyLimit !== undefined) copyLimit = override.copyLimit === 'unlimited' ? Infinity : override.copyLimit;

  const sets = [...new Set(parsed.map((p) => p.code.set))].sort((a, b) => setRank(a) - setRank(b) || a.localeCompare(b));
  const power = intOf(item.power);
  const id = printingIdOf(primary.code);

  const card: Card = {
    id,
    code,
    name,
    shortName: short,
    set: primary.code.set,
    sets,
    type,
    superTypes,
    domains,
    noDomain,
    tags: finalTags,
    championTag,
    energy: intOf(item.energy),
    power,
    powerDomains: power !== null && power > 0 ? [...domains] : [],
    might,
    mightBonus: bonus,
    printedText: withEffect(printedMain),
    text,
    errata: fix !== undefined,
    keywords,
    copyLimit,
    imageUrl: item.cardImage.url,
    dataIncomplete: (type === null && !token) || domainMissing,
  };

  const printings: PrintingRow[] = parsed.map((p) => ({
    id: printingIdOf(p.code),
    cardId: id,
    code: cardCodeOf(p.code),
    publicCode: p.item.publicCode,
    set: p.code.set,
    collectorNumber: p.code.number,
    variant: p.variant,
    rarity: p.item.rarity?.value ? String(p.item.rarity.value.id) : null,
    imageUrl: p.item.cardImage.url,
    width: p.item.cardImage.dimensions?.width ?? null,
    height: p.item.cardImage.dimensions?.height ?? null,
  }));
  return { card, printings, issues };
}

/**
 * Gallery printings of one name -> one gameplay card.
 * - rules name: `name, subtitle` for champion units only; `name` alone for signature cards and starter legends;
 * - id and code come from the first printing (base variant, earliest set, lowest number); `sets` lists every set;
 * - an empty or contradictory type, or an empty domain list, gives `dataIncomplete` (never "no domain");
 * - `colorless` gives `noDomain`;
 * - errata text replaces the printed text and sets `errata`; an Equipment's effect text is appended;
 * - copy limit from the card's own text: "any number" -> Infinity, Unique -> 1, otherwise 3;
 * - a reviewed override (sync-data/card-overrides.json) can supply type, domains, tags, champion tag, copy limit.
 */
export function toCard(
  printings: readonly GalleryItem[],
  errata: readonly ErrataEntry[] = [],
  overrides: readonly CardOverride[] = [],
  ctx: BuildContext = {},
): Card {
  return buildCard(printings, errata, overrides, ctx).card;
}

export interface BuildResult { cards: Card[]; printings: PrintingRow[]; warnings: string[] }

/** All gallery rows -> gameplay cards, with champion tags linked across legends, champion units and signature cards. */
export function buildCards(
  items: readonly GalleryItem[],
  errata: readonly ErrataEntry[] = [],
  overrides: readonly CardOverride[] = [],
  ctx: BuildContext = {},
): BuildResult {
  const groups = new Map<string, GalleryItem[]>();
  for (const item of items) {
    const key = groupKey(item);
    const g = groups.get(key);
    if (g) g.push(item);
    else groups.set(key, [item]);
  }
  const warnings: string[] = [];
  const cards: Card[] = [];
  const printings: PrintingRow[] = [];
  for (const group of groups.values()) {
    const built = buildCard(group, errata, overrides, ctx);
    cards.push(built.card);
    printings.push(...built.printings);
    for (const issue of built.issues) warnings.push(`${built.card.code} ${built.card.name}: ${issue}`);
  }

  // CR 133.8.b: champion tags link legends, champion units and signature cards. The champion tag of a
  // legend or signature card is the one tag that equals a champion unit's short name (rules.md §3).
  const championNames = new Set(cards.filter((c) => c.type === 'unit' && c.superTypes.includes('champion')).map((c) => c.shortName));
  for (const card of cards) {
    const linked = card.type === 'legend' || card.superTypes.includes('signature');
    if (!linked || findOverride(overrides, card.name)?.championTag) continue;
    const matches = card.tags.filter((t) => championNames.has(t));
    if (matches.length === 1) card.championTag = matches[0];
    else if (card.championTag && championNames.has(card.championTag)) continue; // signature card: subtitle
    else {
      card.championTag = null;
      if (!card.superTypes.includes('token')) warnings.push(`${card.code} ${card.name}: ${matches.length} tags match a champion name (${JSON.stringify(card.tags)}); champion tag left empty`);
    }
  }

  for (const { card, was } of domainOrderBreaks(cards, printings, overrides)) {
    card.dataIncomplete = true;
    warnings.push(`${card.code} ${card.name}: domain ${was} breaks the set's collector-number order; flagged incomplete`);
  }

  for (const o of overrides) if (!cards.some((c) => nameKey(c.name) === nameKey(o.name))) warnings.push(`override for "${o.name}" matches no card`);
  for (const e of errata) {
    const hit = cards.some((c) => c.errata && (e.codes.length ? printings.some((p) => p.cardId === c.id && e.codes.includes(p.code)) : nameKey(c.name) === nameKey(e.cardName)));
    if (!hit && e.status !== 'superseded') warnings.push(`errata ${e.id} for "${e.cardName}" matches no card`);
  }

  const rank = (set: string) => { const i = (ctx.setOrder ?? []).indexOf(set); return i === -1 ? 99 : i; };
  cards.sort((a, b) => rank(a.set) - rank(b.set) || a.id.localeCompare(b.id));
  return { cards, printings, warnings };
}

/**
 * HEURISTIC integrity check, used only to flag, never to assign. Measured on the 2026-11-12 gallery:
 * inside a set the one-domain main-deck cards are numbered in domain blocks (all Fury, then all Calm, ...).
 * A card whose domain breaks that order has a wrong domain in the source row: Radiance rows did, and a
 * wrong domain would let the app call an illegal deck legal. Such cards become `dataIncomplete` until a
 * reviewed override states their domain. A set where more than a quarter of the cards break the order is
 * taken as not block-ordered and is left alone.
 */
export function domainOrderBreaks(cards: readonly Card[], printings: readonly PrintingRow[], overrides: readonly CardOverride[] = []): { card: Card; was: string }[] {
  const primary = new Map(printings.filter((p) => p.id === p.cardId).map((p) => [p.cardId, p]));
  const bySet = new Map<string, { card: Card; n: number }[]>();
  for (const card of cards) {
    const p = primary.get(card.id);
    const mainDeck = card.type === 'unit' || card.type === 'spell' || card.type === 'gear';
    if (!p || p.variant !== 'base' || !mainDeck || card.dataIncomplete || card.domains.length !== 1) continue;
    if (card.superTypes.includes('signature') || card.superTypes.includes('token')) continue;
    const list = bySet.get(card.set);
    if (list) list.push({ card, n: p.collectorNumber });
    else bySet.set(card.set, [{ card, n: p.collectorNumber }]);
  }
  const out: { card: Card; was: string }[] = [];
  for (const list of bySet.values()) {
    list.sort((a, b) => a.n - b.n);
    // Block order of the set: domains by the median collector number of their cards.
    const numbers = new Map<string, number[]>();
    for (const { card, n } of list) numbers.set(card.domains[0], [...(numbers.get(card.domains[0]) ?? []), n]);
    const order = [...numbers.entries()].map(([d, ns]) => [d, ns[Math.floor(ns.length / 2)]] as const).sort((a, b) => a[1] - b[1]).map(([d]) => d);
    const rank = list.map(({ card }) => order.indexOf(card.domains[0]));
    // Longest non-decreasing subsequence of ranks; everything outside it breaks the order.
    const best = rank.map(() => 1);
    const prev = rank.map(() => -1);
    for (let i = 0; i < rank.length; i++) {
      for (let j = 0; j < i; j++) if (rank[j] <= rank[i] && best[j] + 1 > best[i]) { best[i] = best[j] + 1; prev[i] = j; }
    }
    let end = best.indexOf(Math.max(...best));
    const keep = new Set<number>();
    for (; end !== -1; end = prev[end]) keep.add(end);
    const breaks = list.filter((_, i) => !keep.has(i));
    if (breaks.length * 4 > list.length) continue;
    for (const { card } of breaks) {
      if (findOverride(overrides, card.name)?.domains) continue; // a reviewed domain is trusted
      out.push({ card, was: card.domains.join('/') });
    }
  }
  return out;
}

interface GalleryPage { data: GalleryItem[]; linkdata?: { next?: string | null } }
export interface RawGallery { fetchedAt: string; items: GalleryItem[]; sets: { id: string; name: string; collectorNumberMax?: number }[] }

/** Downloads every gallery row. `metadata.totalItems` is not reliable (legality-and-data.md §5.1); rows are counted. */
export async function fetchGallery(log: Log): Promise<RawGallery> {
  const items: GalleryItem[] = [];
  let url: string | null = GALLERY_CARDS_URL;
  for (let page = 0; url && page < 20; page++) {
    const body: GalleryPage = await getJson<GalleryPage>(url, { minGapMs: 1000 });
    items.push(...body.data);
    const next: string | null | undefined = body.linkdata?.next;
    url = next ? new URL(next, GALLERY_CARDS_URL).href : null;
  }
  const sets = (await getJson<{ data: RawGallery['sets'] }>(GALLERY_SETS_URL, { minGapMs: 1000 })).data;
  const unique = new Map(items.map((i) => [i.id, i]));
  log(`cards fetched ${unique.size} gallery rows, ${sets.length} sets`);
  return { fetchedAt: new Date().toISOString(), items: [...unique.values()], sets };
}

export const readRawGallery = (file: string = RAW_GALLERY_FILE): RawGallery | null =>
  existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as RawGallery) : null;

export interface CardsInfo { printings: number; cards: number; tokens: number; legends: number; dataIncomplete: number; errata: number; bySet: Record<string, number>; warnings: number; source: string; galleryFetchedAt: string }

/** Rebuilds `cards` and `printings` from the cached raw gallery and the reviewed sync-data files. No network. */
export function rebuildCards(db: Db, log: Log, opts: { rawFile?: string; syncDataDir?: string; allowShrink?: boolean; source?: string } = {}): CardsInfo {
  const raw = readRawGallery(opts.rawFile);
  if (!raw) throw new Error('no gallery data yet: run `pnpm sync cards` with network access first');
  const legality = readLegalityFile(opts.syncDataDir);
  const errata = readErrataFile(opts.syncDataDir).errata;
  const overrides = readOverridesFile(opts.syncDataDir).cards;
  const { cards, printings, warnings } = buildCards(raw.items, errata, overrides, { setOrder: setOrderOf(legality) });

  for (const s of raw.sets) if (!legality.sets.some((l) => l.code === s.id)) warnings.push(`gallery set ${s.id} (${s.name}) is not in sync-data/legality.json: review needed`);

  // Fail closed (GameLab report.ts assertNoShrink): a build that loses cards is refused.
  const before = (db.prepare('SELECT COUNT(*) AS n FROM cards').get() as { n: number }).n;
  if (before > 0 && cards.length < before && !opts.allowShrink) {
    throw new Error(`refusing to replace ${before} cards with ${cards.length}; pass --allow-shrink if this is intended`);
  }

  const insertCard = db.prepare('INSERT INTO cards(id, name, json) VALUES (?, ?, ?)');
  const insertPrinting = db.prepare(
    'INSERT INTO printings(id, card_id, code, public_code, set_code, collector_number, variant, rarity, image_url, width, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  db.transaction(() => {
    db.exec('DELETE FROM cards; DELETE FROM printings;');
    for (const c of cards) insertCard.run(c.id, c.name, JSON.stringify(serializeCard(c)));
    for (const p of printings) insertPrinting.run(p.id, p.cardId, p.code, p.publicCode, p.set, p.collectorNumber, p.variant, p.rarity, p.imageUrl, p.width, p.height);
  })();
  invalidateCardDb();

  const real = cards.filter((c) => !c.superTypes.includes('token'));
  const bySet: Record<string, number> = {};
  for (const c of real) bySet[c.set] = (bySet[c.set] ?? 0) + 1;
  const info: CardsInfo = {
    printings: printings.length,
    cards: real.length,
    tokens: cards.length - real.length,
    legends: real.filter((c) => c.type === 'legend').length,
    dataIncomplete: real.filter((c) => c.dataIncomplete).length,
    errata: cards.filter((c) => c.errata).length,
    bySet,
    warnings: warnings.length,
    source: opts.source ?? 'cached raw gallery',
    galleryFetchedAt: raw.fetchedAt,
  };
  writeSyncState(db, 'cards', { ...info, warningList: warnings });
  for (const w of warnings) log(`cards warning ${w}`);
  log(`cards ${real.length}/${real.length} gameplay cards (${info.legends} legends, ${info.tokens} tokens, ${info.dataIncomplete} incomplete, ${info.errata} with errata) from ${printings.length} printings`);
  return info;
}

/** `cards` step. If the gallery cannot be reached, builds from the last cached download and says so. */
export async function syncCards(db: Db, log: Log, opts: { rawFile?: string; allowShrink?: boolean } = {}): Promise<CardsInfo> {
  const rawFile = opts.rawFile ?? RAW_GALLERY_FILE;
  let source = 'official gallery JSON';
  try {
    const raw = await fetchGallery(log);
    if (raw.items.length === 0) throw new Error('gallery returned no rows');
    mkdirSync(path.dirname(rawFile), { recursive: true });
    writeFileSync(rawFile, JSON.stringify(raw));
  } catch (err) {
    if (!existsSync(rawFile)) throw new Error(`gallery unreachable and no cached copy: ${err instanceof Error ? err.message : String(err)}`);
    source = 'cached raw gallery (source unreachable)';
    log(`cards gallery unreachable (${err instanceof Error ? err.message : String(err)}); building from the cached download`);
  }
  return rebuildCards(db, log, { rawFile, allowShrink: opts.allowShrink, source });
}
