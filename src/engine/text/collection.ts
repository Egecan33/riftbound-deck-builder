// Collection import: a pasted list ("3 Charm", "Charm x3", "OGN-043") or a CSV/TSV export with a
// header row. Printings of one card add up under its gameplay id. Pure: no Node, no I/O; never throws.
import type { Card, CardDb } from '../types';
import { isToken, padCode, resolveCard, resolveLine, tokenNotice, type UnresolvedLine } from './resolve';

export interface ParsedCollection {
  owned: Record<string, number>;   // gameplay id -> copies, the shape of BuildOptions.owned
  unresolved: UnresolvedLine[];
  notices: string[];
  format: 'csv' | 'list';
  /** For CSV: the header cells used, so the UI can show what was detected. */
  columns: { name: string | null; code: string | null; set: string | null; quantity: string[] };
}

const NAME_COLS = ['name', 'card name', 'cardname', 'card', 'title'];
const CODE_COLS = ['code', 'card code', 'cardcode', 'public code', 'card id', 'id', 'card number', 'number', 'collector number', 'card #', '#', 'no'];
const SET_COLS = ['set', 'set code', 'set id', 'setid', 'edition', 'expansion'];
const QTY_COLS = ['quantity', 'qty', 'count', 'owned', 'amount', 'copies', 'total', 'quantity owned', 'normal', 'foil', 'normal count', 'foil count', 'normal quantity', 'foil quantity'];

/** Splits one delimited line, honouring double quotes ("Ekko, Recurrent" stays one cell). */
export function splitDelimited(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell.trim() === '') quoted = true;
    else if (ch === delimiter) { cells.push(cell.trim()); cell = ''; }
    else cell += ch;
  }
  cells.push(cell.trim());
  return cells;
}

const headerCell = (cell: string): string => cell.replace(/^﻿/, '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

function detectDelimiter(line: string): string {
  if (line.includes('\t')) return '\t';
  const commas = (line.match(/,/g) ?? []).length;
  const semis = (line.match(/;/g) ?? []).length;
  return semis > commas ? ';' : ',';
}

interface Header { delimiter: string; name: number; code: number; set: number; qty: number[]; cells: string[] }

/** A first row is a header when it names a name or code column and no cell is a number. */
function detectHeader(line: string): Header | null {
  const delimiter = detectDelimiter(line);
  const cells = splitDelimited(line, delimiter).map(headerCell);
  if (cells.length < 2 || cells.some((c) => /^\d+$/.test(c))) return null;
  const find = (names: string[]) => cells.findIndex((c) => names.includes(c));
  const name = find(NAME_COLS);
  const code = find(CODE_COLS);
  if (name === -1 && code === -1) return null;
  const qty = cells.map((c, i) => (QTY_COLS.includes(c) ? i : -1)).filter((i) => i !== -1);
  return { delimiter, name, code, set: find(SET_COLS), qty, cells };
}

const toCount = (cell: string | undefined): number => {
  const n = Number((cell ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.min(9999, Math.trunc(n)) : 0;
};

/** Headerless delimited rows: "3,Charm", "Charm,3", "Ekko, Recurrent, 2". */
function resolveLooseRow(line: string, db: CardDb): { card: Card; qty: number } | undefined {
  for (const delimiter of ['\t', ';', ',']) {
    if (!line.includes(delimiter)) continue;
    const cells = splitDelimited(line, delimiter).filter((c) => c !== '');
    if (cells.length < 2) continue;
    const joiner = delimiter === ',' ? ', ' : ' ';
    const first = cells[0];
    const last = cells[cells.length - 1];
    const tries: [string, number][] = [];
    if (/^\d+$/.test(first)) tries.push([cells.slice(1).join(joiner), toCount(first)]);
    if (/^\d+$/.test(last)) tries.push([cells.slice(0, -1).join(joiner), toCount(last)]);
    for (const cell of cells) if (!/^\d+$/.test(cell)) tries.push([cell, /^\d+$/.test(first) ? toCount(first) : /^\d+$/.test(last) ? toCount(last) : 1]);
    for (const [text, qty] of tries) {
      const card = resolveCard(text, db);
      if (card) return { card, qty };
    }
  }
  return undefined;
}

export function parseCollection(text: string, db: CardDb): ParsedCollection {
  const owned: Record<string, number> = {};
  const unresolved: UnresolvedLine[] = [];
  const notices: string[] = [];
  const add = (card: Card, qty: number) => {
    if (qty <= 0) return;
    if (isToken(card)) { const n = tokenNotice(card); if (!notices.includes(n)) notices.push(n); return; }
    owned[card.id] = (owned[card.id] ?? 0) + qty;
  };
  const lines = (typeof text === 'string' ? text : '').split(/\r\n|\r|\n/);
  const firstIndex = lines.findIndex((l) => l.trim() !== '');
  const header = firstIndex === -1 ? null : detectHeader(lines[firstIndex]);

  if (header) {
    lines.forEach((raw, index) => {
      if (index <= firstIndex || !raw.trim()) return;
      const cells = splitDelimited(raw, header.delimiter);
      const qty = header.qty.length ? header.qty.reduce((sum, i) => sum + toCount(cells[i]), 0) : 1;
      const code = header.code === -1 ? '' : cells[header.code] ?? '';
      const set = header.set === -1 ? '' : cells[header.set] ?? '';
      const name = header.name === -1 ? '' : cells[header.name] ?? '';
      const card =
        (code ? resolveCard(code, db) : undefined) ??
        (code && set && /^[A-Za-z]{2,4}$/.test(set) ? resolveCard(padCode(set.toUpperCase(), code.replace(/^#/, '').replace(/\/\d+$/, '')), db) : undefined) ??
        (name ? resolveCard(name, db) : undefined);
      if (!card) unresolved.push({ line: index + 1, text: raw.trim() });
      else add(card, qty);
    });
    return {
      owned, unresolved, notices, format: 'csv',
      columns: {
        name: header.name === -1 ? null : header.cells[header.name],
        code: header.code === -1 ? null : header.cells[header.code],
        set: header.set === -1 ? null : header.cells[header.set],
        quantity: header.qty.map((i) => header.cells[i]),
      },
    };
  }

  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (!line || /^(?:#|\/\/)/.test(line)) return;
    const hit = resolveLine(line, db) ?? resolveLooseRow(line, db);
    if (!hit) unresolved.push({ line: index + 1, text: line });
    else add(hit.card, hit.qty);
  });
  return { owned, unresolved, notices, format: 'list', columns: { name: null, code: null, set: null, quantity: [] } };
}
