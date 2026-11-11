// riftbound.one /decklists: extract the two embedded JSON blocks and describe them.
import { readFileSync, writeFileSync } from 'node:fs';
const h = readFileSync('raw/r1-decklists.html', 'utf8');
const blk = (id) => { const m = h.match(new RegExp(`<script type="application/json" id="${id}">([\\s\\S]*?)</script>`)); return m ? JSON.parse(m[1]) : null; };
const pool = blk('card-pool'), decks = blk('deck-payloads');
const trim = (v, d = 0) => Array.isArray(v) ? (v.length ? [trim(v[0], d + 1), `…(${v.length} items)`] : []) : v && typeof v === 'object' ? (d > 4 ? '{…}' : Object.fromEntries(Object.entries(v).slice(0, 30).map(([k, x]) => [k, trim(x, d + 1)]))) : typeof v === 'string' && v.length > 80 ? v.slice(0, 80) + '…' : v;
console.log('pool type', Array.isArray(pool) ? 'array ' + pool.length : typeof pool + ' keys ' + Object.keys(pool).length);
console.log('pool sample', JSON.stringify(trim(Array.isArray(pool) ? pool[0] : Object.entries(pool)[0])));
console.log('decks type', Array.isArray(decks) ? 'array ' + decks.length : typeof decks + ' keys ' + Object.keys(decks).length);
const arr = Array.isArray(decks) ? decks : Object.values(decks);
console.log('deck sample', JSON.stringify(trim(Array.isArray(decks) ? decks[0] : Object.entries(decks)[0]), null, 1));
writeFileSync('raw/r1-decks.json', JSON.stringify(decks)); writeFileSync('raw/r1-pool.json', JSON.stringify(pool));
