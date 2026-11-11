import { readFileSync } from 'node:fs';
import { ab, loadParsed } from './show.mjs';
const R = JSON.parse(readFileSync(new URL('./out/engine-compare.json', import.meta.url))).rows; const P = new Map(loadParsed().map((c) => [c.code, c]));
const [from, to, src] = [+process.argv[2], +process.argv[3], process.argv[4]];
const rows = R.filter((r) => !src || r.source === src).slice(from, to);
for (const r of rows) { const d = []; for (const f of ['verbs', 'nums', 'trig', 'kws']) { if (r.d[f].missing.length) d.push(`-${f}:${r.d[f].missing}`); if (r.d[f].extra.length) d.push(`+${f}:${r.d[f].extra}`); } if (!r.agree.activated) d.push(`act e${r.eAct}/p${r.pAct}`); if (!r.agree.speed) d.push(`speed e${r.eSpeed}/p${r.pSpeed}`);
  console.log(`${r.code} ${r.name} [${r.source}${r.textChanged ? ',TEXTCHG' : ''}] ${d.join(' ')}\n  T: ${r.text.replace(/\([^()]*\)/g, '').replace(/\n/g, ' / ').slice(0, 420)}\n${P.get(r.code).abilities.filter((a) => a.kind !== 'keyword').map((a) => '   · ' + ab(a).slice(0, 300)).join('\n')}`); }
console.log(R.length, R.filter((r) => r.source === 'manual').length);
