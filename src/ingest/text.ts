// Gallery rich text -> plain rules text. Ported from GameLab packages/cards/src/normalize/icons.ts
// (field handling kept: unknown icons and entities fail loudly instead of passing through).
//
// Canonical symbols in Card.text: [Might], [Exhaust], [Any] (any rune), [Fury] ... [Order] (a rune of
// that domain), [N] (energy). Keywords stay as printed: [Accelerate], [Assault 2].
import type { Domain } from '@/engine/types';

export const DOMAINS: readonly Domain[] = ['fury', 'calm', 'mind', 'body', 'chaos', 'order'];
const label = (d: string): string => d[0].toUpperCase() + d.slice(1);

export class UnknownIconError extends Error {
  constructor(public readonly tokens: string[]) {
    super(`Unknown icon tokens: ${tokens.join(', ')}`);
    this.name = 'UnknownIconError';
  }
}

export function iconToken(raw: string): string | null {
  if (raw === 'rb_might') return '[Might]';
  if (raw === 'rb_exhaust') return '[Exhaust]';
  const energy = /^rb_energy_(\d+)$/.exec(raw);
  if (energy) return `[${energy[1]}]`;
  const rune = /^rb_rune_([a-z]+)$/.exec(raw);
  if (rune) {
    if (rune[1] === 'rainbow') return '[Any]';
    if ((DOMAINS as readonly string[]).includes(rune[1])) return `[${label(rune[1])}]`;
  }
  return null;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', gt: '>', lt: '<', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–', hellip: '…',
};

export class UnknownEntityError extends Error {
  constructor(public readonly entities: string[]) {
    super(`Unknown HTML entities: ${entities.join(', ')}`);
    this.name = 'UnknownEntityError';
  }
}

export function decodeEntities(s: string): string {
  const unknown = new Set<string>();
  const out = s.replace(/&(?:#x([0-9a-fA-F]+)|#(\d+)|([a-zA-Z][a-zA-Z0-9]*));/g, (m: string, hex?: string, dec?: string, name?: string) => {
    if (hex !== undefined) return String.fromCodePoint(parseInt(hex, 16));
    if (dec !== undefined) return String.fromCodePoint(parseInt(dec, 10));
    const key = (name ?? '').toLowerCase();
    if (key in NAMED_ENTITIES) return NAMED_ENTITIES[key];
    unknown.add(m);
    return m;
  });
  if (unknown.size) throw new UnknownEntityError([...unknown]);
  return out;
}

export function replaceIcons(s: string): string {
  const unknown = new Set<string>();
  const out = s.replace(/:(rb_[a-z0-9_]+):/g, (_m, raw: string) => {
    const t = iconToken(raw);
    if (t === null) { unknown.add(raw); return `:${raw}:`; }
    return t;
  });
  if (unknown.size) throw new UnknownIconError([...unknown]);
  return out;
}

/** Gallery rich HTML -> plain text. Paragraphs, <br> and list items become lines; list items get "- ". */
export function richToPlain(html: string): string {
  let s = html.replace(/\r?\n/g, ' ');
  s = s.replace(/<br\b[^>]*\/?>/gi, '\n');
  s = s.replace(/<\/p>/gi, '\n').replace(/<p[^>]*>/gi, '');
  s = s.replace(/<li[^>]*>/gi, '\n- ').replace(/<\/li>/gi, '\n');
  s = s.replace(/<\/?ul[^>]*>/gi, '\n');
  s = s.replace(/<\/?(?:div|h[1-6]|ol|table|tr|td|th|blockquote|section)\b[^>]*>/gi, '\n');
  s = s.replace(/<[^>]+>/g, ' ');
  s = decodeEntities(s);
  s = replaceIcons(s);
  s = s.replace(/\[NO TEXT\]/g, '');
  return s.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter((l) => l.length > 0).join('\n');
}

/**
 * Errata articles and the gallery's accessibility text use letters: [M] or [S] = Might, [E] or [T] = exhaust,
 * [A] = any rune, [C] = a rune of the card's own domain. [C] is resolved only for a one-domain card;
 * on a two-domain card it stays "[C]" because the article does not say which rune is meant.
 */
export function letterSymbolsToCanonical(text: string, domains: readonly string[]): string {
  let s = text
    .replace(/_/g, '') // the articles mark italics with underscores; card text has none
    .replace(/\[(?:S|M)\]/g, '[Might]')
    .replace(/\[(?:T|E)\]/g, '[Exhaust]')
    .replace(/\[A\]/g, '[Any]');
  if (domains.length === 1 && (DOMAINS as readonly string[]).includes(domains[0])) {
    s = s.replace(/\[C\]/g, `[${label(domains[0])}]`);
  }
  return s.split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).filter((l) => l.length > 0).join('\n');
}

const SYMBOL = /^(?:\d+|Might|Exhaust|Any|Fury|Calm|Mind|Body|Chaos|Order|C|>)$/;

/**
 * Keywords the card itself has: bracketed tokens at the start of a line, chained, with any number dropped
 * ("[Assault 2]" -> "Assault"). Not a fixed list, so a new set's keywords are picked up from the text.
 * Reminder text in parentheses is ignored. A token followed by "[>]" is a condition marker
 * ("[Empowered][>] I have ...") and a token that starts a sentence ("[Stun] an enemy unit.") is a keyword
 * action; neither is a keyword of the card. This is a coarse field: the card mine (plan Task 4) parses the text.
 */
export function ownKeywords(text: string): string[] {
  const out: string[] = [];
  for (const rawLine of text.split('\n')) {
    let rest = rawLine.replace(/\([^()]*\)/g, ' ').replace(/^- /, '').replace(/\s+/g, ' ').trim();
    for (;;) {
      const m = /^\[([A-Za-z][A-Za-z' -]*?)(?:\s+\d+)?\]\s*/.exec(rest);
      if (!m) break;
      rest = rest.slice(m[0].length);
      if (SYMBOL.test(m[1])) break;
      if (rest.startsWith('[>]')) break;
      // "[Stun] an enemy unit." and "[Predict]." use a keyword action as a sentence; the card does not have that keyword.
      if (/^(?:[a-z]|\.(?:\s|$))/.test(rest)) break;
      if (!out.includes(m[1])) out.push(m[1]);
      // A cost after the keyword ("[Equip] [3][Any]", "[Repeat] [2]") belongs to it; skip it and go on.
      rest = rest.replace(/^(?:—\s*)?(?:\[(?:\d+|Any|Fury|Calm|Mind|Body|Chaos|Order|C)\])+[.,]?\s*/, '');
    }
  }
  return out;
}

/** Copy limit stated by the card's own text; null when the text says nothing (the format default applies). */
export function copyLimitFromText(text: string, keywords: readonly string[]): number | null {
  const explicit = /deck can have up to (\d+) cards? named/i.exec(text);
  if (explicit) return Number(explicit[1]);
  if (/deck can have any number of cards? named/i.test(text)) return Infinity;
  if (keywords.includes('Unique') || /deck can have only 1 card with this name/i.test(text)) return 1;
  return null;
}
