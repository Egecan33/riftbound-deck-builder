// Labels, deck edits and small formatters shared by every screen. Browser-safe: types and the two
// small pure engine tables only.
import { ROLE_LABELS } from '@/engine/features/roles';
import { formatRules } from '@/engine/rules/formats';
import type { AxisId, CardType, Deck, DeckEntry, Domain, Fix, Format, PowerTarget, Role, Violation } from '@/engine/types';
import type { BrowseZone, CardFilters, CardSort, ClientCard, StatusResponse } from './api';

export { ROLE_LABELS, formatRules };

// ---------------------------------------------------------------------------------------------
// Labels

export const DOMAINS: Domain[] = ['fury', 'calm', 'mind', 'body', 'chaos', 'order'];
export const DOMAIN_LABEL: Record<Domain, string> = { fury: 'Fury', calm: 'Calm', mind: 'Mind', body: 'Body', chaos: 'Chaos', order: 'Order' };
export const domainVar = (d: Domain | undefined | null): string => (d ? `var(--color-${d})` : 'var(--color-edge-hi)');

export const FORMATS: { id: Format; label: string; blurb: string }[] = [
  { id: 'standard-bo1', label: 'Standard, best of one', blurb: '1v1, one game.' },
  { id: 'standard-bo3', label: 'Standard, best of three', blurb: '1v1 with a side deck.' },
  { id: '2v2', label: '2v2', blurb: 'Two teams of two; its own ban list.' },
  { id: 'ffa3', label: 'Free-for-all, 3 players', blurb: 'No official ban list; see Card data.' },
  { id: 'ffa4', label: 'Free-for-all, 4 players', blurb: 'No official ban list; see Card data.' },
  { id: 'casual', label: 'Casual', blurb: 'Core Rules only, no ban list.' },
];
export const formatLabel = (f: Format): string => FORMATS.find((x) => x.id === f)?.label ?? f;
export const FORMAT_SHORT: Record<Format, string> = { 'standard-bo1': 'Bo1', 'standard-bo3': 'Bo3', '2v2': '2v2', ffa3: 'FFA 3', ffa4: 'FFA 4', casual: 'Casual' };

export const POWERS: { id: PowerTarget; label: string; blurb: string }[] = [
  { id: 'casual', label: 'Casual', blurb: 'Theme first; staples count for less.' },
  { id: 'focused', label: 'Focused', blurb: 'A tuned plan without chasing the meta.' },
  { id: 'competitive', label: 'Competitive', blurb: 'What public tournament lists run counts most.' },
];
export const powerLabel = (p: PowerTarget): string => POWERS.find((x) => x.id === p)?.label ?? p;

export const ROLES = Object.keys(ROLE_LABELS) as Role[];
export const TYPE_LABEL: Record<CardType, string> = { unit: 'Unit', spell: 'Spell', gear: 'Gear', rune: 'Rune', battlefield: 'Battlefield', legend: 'Legend' };

export type Labels = StatusResponse['labels'];
export function axisLabel(id: AxisId, labels: Labels | null | undefined): string {
  const hit = labels?.axes.find((a) => a.id === id);
  if (hit) return hit.label;
  if (id.startsWith('tag:')) return `${id.slice(4)} tribe`;
  if (id.startsWith('kw:')) return id.slice(3);
  return id;
}
export const traitLabel = (id: string, labels: Labels | null | undefined): string => labels?.traits[id] ?? id.replace(/-/g, ' ');

export const PART_LABEL: Record<string, string> = {
  quality: 'Card quality',
  synergy: 'Works with the deck',
  role: 'Fills a needed role',
  curve: 'Curve and runes',
  meta: 'Played by this legend',
  fit: 'Format and power fit',
};
export const ROUTE_LABEL: Record<string, string> = {
  wide: 'Go wide', tall: 'Go tall', hold: 'Hold battlefields', burst: 'Burst', points: 'Direct points', attrition: 'Attrition', altwin: 'Alternate win',
};

// ---------------------------------------------------------------------------------------------
// Scores

export type Band = 'top' | 'good' | 'mid' | 'low' | 'gated';
export function bandOf(score: number, gated = false): Band {
  if (gated) return 'gated';
  if (score >= 80) return 'top';
  if (score >= 65) return 'good';
  if (score >= 45) return 'mid';
  return 'low';
}
export const bandVar = (score: number, gated = false): string => `var(--color-band-${bandOf(score, gated)})`;

// ---------------------------------------------------------------------------------------------
// Deck edits (all return a new deck)

export type CardZone = 'main' | 'side';

export function emptyDeck(patch: Partial<Deck> = {}): Deck {
  return {
    id: null, name: 'New deck', format: 'standard-bo3', power: 'focused', legend: null, champion: null, main: [], side: [], runes: {},
    battlefields: [], extraLegends: [], themeWeights: null, teammate: null, ...patch,
  };
}
export const qtyOf = (entries: DeckEntry[], id: string): number => entries.find((e) => e.id === id)?.qty ?? 0;
export const countOf = (entries: DeckEntry[]): number => entries.reduce((n, e) => n + e.qty, 0);
export const runeCount = (deck: Deck): number => Object.values(deck.runes).reduce((n, v) => n + (v ?? 0), 0);
export const copiesOf = (deck: Deck, id: string): number => qtyOf(deck.main, id) + qtyOf(deck.side, id);

export function addCard(deck: Deck, zone: CardZone, id: string): Deck {
  const list = deck[zone];
  const next = list.some((e) => e.id === id) ? list.map((e) => (e.id === id ? { ...e, qty: e.qty + 1 } : e)) : [...list, { id, qty: 1, locked: false }];
  return { ...deck, [zone]: next };
}
/** Takes one copy out; the entry goes when its last copy does. */
export function removeCard(deck: Deck, zone: CardZone, id: string): Deck {
  return { ...deck, [zone]: deck[zone].flatMap((e) => (e.id !== id ? [e] : e.qty > 1 ? [{ ...e, qty: e.qty - 1 }] : [])) };
}
export function toggleLock(deck: Deck, zone: CardZone, id: string): Deck {
  return { ...deck, [zone]: deck[zone].map((e) => (e.id === id ? { ...e, locked: !e.locked } : e)) };
}
export function toggleBattlefield(deck: Deck, id: string): Deck {
  return { ...deck, battlefields: deck.battlefields.includes(id) ? deck.battlefields.filter((b) => b !== id) : [...deck.battlefields, id] };
}
export function setRune(deck: Deck, domain: Domain, n: number): Deck {
  const runes = { ...deck.runes };
  if (n <= 0) delete runes[domain];
  else runes[domain] = n;
  return { ...deck, runes };
}
/** Picks a Chosen Champion and makes sure one copy of it is in the main deck (the rules count it there). */
export function setChampion(deck: Deck, id: string | null): Deck {
  const next = { ...deck, champion: id };
  return id && qtyOf(deck.main, id) === 0 ? addCard(next, 'main', id) : next;
}

// ---------------------------------------------------------------------------------------------
// Browser query

export interface BrowserQuery {
  zone: BrowseZone;
  q: string;
  type: CardType | '';
  role: Role | '';
  axis: AxisId | '';
  domains: Domain[];
  energyMin: string;
  energyMax: string;
  owned: boolean;
  hideGated: boolean;
  hideInDeck: boolean;
  sort: CardSort;
  /** The fix that set these filters, shown as a chip so it can be undone. */
  fromFix: string | null;
}
export const DEFAULT_QUERY: BrowserQuery = {
  zone: 'main', q: '', type: '', role: '', axis: '', domains: [], energyMin: '', energyMax: '', owned: false, hideGated: false, hideInDeck: false, sort: 'score', fromFix: null,
};
const num = (s: string): number | undefined => {
  const n = Number(s);
  return s.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : undefined;
};
export function toFilters(q: BrowserQuery): CardFilters {
  const f: CardFilters = {};
  if (q.axis) f.axis = q.axis;
  // Battlefields have no type, role, cost or domain to filter on; those controls are hidden for them.
  if (q.zone !== 'battlefields') {
    if (q.type) f.type = q.type;
    if (q.role) f.role = q.role;
    if (q.domains.length) f.domains = q.domains;
    const lo = num(q.energyMin);
    const hi = num(q.energyMax);
    if (lo !== undefined) f.energyMin = lo;
    if (hi !== undefined) f.energyMax = hi;
  }
  if (q.owned) f.owned = true;
  if (q.hideGated) f.hideGated = true;
  if (q.hideInDeck) f.inDeck = false;
  return f;
}
/** The browser query a rating fix asks for: everything else is reset so the result is what the fix names. */
export function queryForFix(fix: Fix): BrowserQuery | null {
  const f = fix.filter;
  if (!f) return null;
  return {
    ...DEFAULT_QUERY, hideGated: true, hideInDeck: true,
    zone: f.type === 'battlefield' ? 'battlefields' : 'main',
    type: f.type && f.type !== 'battlefield' ? f.type : '',
    role: f.role ?? '', axis: f.axis ?? '', domains: f.domain ? [f.domain] : [],
    energyMax: f.maxEnergy !== undefined ? String(f.maxEnergy) : '',
    fromFix: fix.text,
  };
}
export function activeFilterCount(q: BrowserQuery): number {
  const cardOnly = q.zone === 'battlefields' ? [] : [q.type, q.role, q.domains.length, q.energyMin || q.energyMax];
  return [...cardOnly, q.axis, q.owned, q.hideGated, q.hideInDeck].filter(Boolean).length;
}

// ---------------------------------------------------------------------------------------------
// Small formatters

export const pct = (x: number, digits = 0): string => `${(x * 100).toFixed(digits)}%`;
export const fmtInt = (n: number): string => n.toLocaleString('en-US');
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return 'never';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export const errText = (e: unknown): string => (e instanceof Error ? e.message : String(e));
export const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === 'AbortError';

/** The type line under a card name: "Champion unit, Fury, 4 Energy". */
export function typeLine(card: ClientCard): string {
  const supers = card.superTypes.filter((s) => s !== 'basic').map((s) => s[0]!.toUpperCase() + s.slice(1));
  const type = card.type ? TYPE_LABEL[card.type] : 'Type missing in the source data';
  return [...supers, supers.length ? type.toLowerCase() : type].join(' ');
}

/** Violations that make the deck illegal as built, as opposed to merely unfinished. */
export const blocking = (violations: Violation[]): Violation[] => violations.filter((v) => v.severity === 'error');

/** How a play-evidence share reads in a sentence. */
export function evidenceText(e: { share: number; eligibleLists: number; lists: number } | null | undefined): string {
  if (!e || e.eligibleLists === 0) return 'no play data';
  return `in ${pct(e.share)} of ${fmtInt(e.eligibleLists)} lists that could run it`;
}

/** A measured edge is one counted in public lists; every other edge is a reading of the card texts. */
export const isMeasuredScope = (scope: string): boolean => scope === 'co-play';
export const looksMeasured = (reason: string): boolean => /\(measured\)|played together|run together in public lists/i.test(reason);

/** A legend's card name is its title ("The Exile"); people know it by the champion ("Riven, The Exile"). */
export const legendName = (card: { name: string; championTag: string | null; type: string | null }): string =>
  card.type === 'legend' && card.championTag && !card.name.includes(card.championTag) ? `${card.championTag}, ${card.name}` : card.name;

/** A gate that only says "no more copies fit": the card itself is fine and may already be in the deck. */
export const isLimitGate = (gate: { code: string } | null | undefined): boolean => !!gate && /LIMIT_EXCEEDED|TOTAL_EXCEEDED/.test(gate.code);
/** A gate in a few words for a tile; the full sentence is in the tooltip and the card overlay. */
export function gateNote(gate: { code: string; message: string }): string {
  if (gate.code === 'DOMAIN_VIOLATION') return 'Outside the legend\'s domains';
  if (/BAN/.test(gate.code)) return 'Banned in this format';
  if (gate.code === 'DATA_STALE') return 'Unfinished source data';
  if (gate.code === 'TOKEN_IN_DECK') return 'Token';
  if (/SIGNATURE/.test(gate.code)) return isLimitGate(gate) ? 'Signature limit reached' : 'Another champion\'s signature';
  if (isLimitGate(gate)) return 'Copy limit reached';
  const words = gate.code.toLowerCase().replace(/_/g, ' ');
  return words[0]!.toUpperCase() + words.slice(1);
}
