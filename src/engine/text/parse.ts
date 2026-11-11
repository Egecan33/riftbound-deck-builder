// Deck list import. Pure: no Node, no I/O. Never throws; a line that cannot be read is reported in
// `unresolved`, never dropped (plan Review focus 6).
import type { CardDb, Deck } from '../types';
import { DeckCollector, type Section } from './collector';
import { decodeDeckCode, looksLikeDeckCode } from './deck-code';
import { resolveLine, type UnresolvedLine } from './resolve';

export interface ParsedDecklist {
  deck: Partial<Deck>;
  unresolved: UnresolvedLine[];
  /** Things the user should know that are not errors: tokens left out, banned cards kept, and so on. */
  notices: string[];
}

const HEADERS: Record<string, Section> = {
  legend: 'legend', legends: 'legend',
  champion: 'champion', champions: 'champion', 'chosen champion': 'champion',
  main: 'main', 'main deck': 'main', maindeck: 'main', mainboard: 'main', deck: 'main',
  units: 'main', unit: 'main', spells: 'main', spell: 'main', gear: 'main', gears: 'main', equipment: 'main',
  runes: 'runes', rune: 'runes', 'rune deck': 'runes', 'rune pool': 'runes',
  battlefields: 'battlefields', battlefield: 'battlefields',
  sideboard: 'side', side: 'side', 'side deck': 'side', sidedeck: 'side', 'side board': 'side',
};

/** "## Main Deck (40):" -> "main deck". */
const headerKey = (text: string): string =>
  text
    .replace(/^[#=\-*\s]+/, '')
    .replace(/[=\-*\s]+$/, '')
    .replace(/\s*[:\-–]?\s*[([]?\d+\s*(?:cards?)?[)\]]?\s*:?$/i, '')
    .replace(/:$/, '')
    .trim()
    .toLowerCase();

/** A header alone on its line, or "Legend: Blade Dancer" with the card after the colon. */
function readHeader(line: string): { section: Section; rest: string } | null {
  const alone = HEADERS[headerKey(line)];
  if (alone) return { section: alone, rest: '' };
  const inline = /^#*\s*([A-Za-z ]+?)\s*:\s*(.+)$/.exec(line);
  if (inline) {
    const section = HEADERS[inline[1].trim().toLowerCase()];
    if (section && !/^\d+$/.test(inline[2].trim())) return { section, rest: inline[2] };
  }
  return null;
}

const isComment = (line: string): boolean => /^(?:#|\/\/|;)/.test(line);

/**
 * Reads a pasted deck: a deck code, or a text list with optional section headers (Legend, Champion,
 * Main, Runes, Battlefields, Sideboard), `3 Name`, `3x Name`, `Name x3`, card codes (`OGN-043`) and
 * bracketed codes. Without headers a card goes to the zone its type names; legends, runes and
 * battlefields go to their own zone whatever the header says.
 */
export function parseDecklist(text: string, db: CardDb): ParsedDecklist {
  const source = typeof text === 'string' ? text : '';
  if (looksLikeDeckCode(source) && !db.byName(source)) {
    const decoded = decodeDeckCode(source, db);
    if (!decoded.error) return { deck: decoded.deck, unresolved: decoded.unresolved, notices: decoded.notices };
  }
  const collector = new DeckCollector(db);
  const unresolved: UnresolvedLine[] = [];
  let section: Section | null = null;
  const lines = source.split(/\r\n|\r|\n/);
  lines.forEach((raw, index) => {
    let line = raw.trim();
    if (!line) return;
    const header = readHeader(line);
    if (header) {
      section = header.section;
      if (!header.rest) return;
      line = header.rest.trim();
    } else if (isComment(line)) {
      return;
    }
    const hit = resolveLine(line, db);
    if (!hit || !collector.add(hit.card, hit.qty, section)) unresolved.push({ line: index + 1, text: raw.trim() });
  });
  return { deck: collector.deck(), unresolved, notices: collector.notices };
}
