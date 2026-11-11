// Official locator (locator.riftbound.uvsgames.com/events/{id}): list dehydrated react-query entries and trimmed shapes. Player names are redacted in output.
import { readFileSync } from 'node:fs';
import { flight, balanced } from '../pa-lib.mjs';
const s = flight(readFileSync(process.argv[2], 'utf8'));
const trim = (v, d = 0, k = '') => /name|pronoun|picture|identifier|email/i.test(k) && typeof v === 'string' && d > 1 && /user|player|best_identifier|first|last|picture|pronoun/i.test(k) ? '<redacted>' : Array.isArray(v) ? (v.length ? [trim(v[0], d + 1, k), `…(${v.length} items)`] : []) : v && typeof v === 'object' ? (d > 5 ? '{…}' : Object.fromEntries(Object.entries(v).map(([kk, x]) => [kk, trim(x, d + 1, kk)]))) : typeof v === 'string' && v.length > 70 ? v.slice(0, 70) + '…' : v;
const seen = new Set();
for (const m of s.matchAll(/"queryKey":\[\{"_id":"([A-Za-z]+)"/g)) {
  const id = m[1]; if (seen.has(id)) continue; seen.add(id);
  // find the enclosing query object: search backwards for {"dehydratedAt" or {"state"
  const start = s.lastIndexOf('{"dehydratedAt"', m.index); const st2 = s.lastIndexOf('{"state"', m.index);
  const i = Math.max(start, st2); const obj = i >= 0 ? balanced(s, i) : null;
  let q = null; try { q = JSON.parse(obj); } catch {}
  const key = JSON.parse(balanced(s, m.index + '"queryKey":'.length));
  console.log('\n### ' + id, JSON.stringify(key).slice(0, 300), '| status', q?.state?.status);
  if (q?.state?.data && process.argv[3] !== 'brief') console.log(JSON.stringify(trim(q.state.data), null, 1).slice(0, Number(process.argv[3] || 2500)));
}
