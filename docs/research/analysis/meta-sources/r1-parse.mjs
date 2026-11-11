// riftbound.one /decklists -> raw/r1-parsed.json : [{key,date(MM/YY),legend,legendCode,event,result,sections:{legend,champion,battlefield,rune,main,sideboard:[{id,qty}]}}]
import { readFileSync, writeFileSync } from 'node:fs';
const h = readFileSync('raw/r1-decklists.html', 'utf8');
const txt = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/\s+/g, ' ').trim();
const rows = [...h.matchAll(/<tr class="deck-row" id="deck-(\d+)"[^>]*>([\s\S]*?)<\/tr>\s*<tr class="deck-row-expanded"[^>]*>([\s\S]*?)<\/tr>/g)];
const out = rows.map((m) => {
  const main = m[2], exp = m[3];
  const f = (c) => { const x = main.match(new RegExp(`class="${c}"[^>]*>([\\s\\S]*?)</(?:td|div)>`)); return x ? txt(x[1]) : null; };
  const sections = {};
  for (const g of exp.split(/<div class="deck-type-group group-/).slice(1)) {
    const name = g.match(/^([a-z]+)/)[1];
    const count = (g.match(/deck-type-count[^>]*>([^<]*)</) || [])[1];
    sections[name] = { count, cards: [...g.matchAll(/data-card-id="([^"]+)"(?:[^>]*data-qty="(\d+)")?/g)].map((c) => ({ id: c[1], qty: c[2] ? +c[2] : null })) };
  }
  return { key: m[1], date: f('col-date'), legend: f('deck-name'), legendCode: (main.match(/cards\/([A-Z0-9-]+?)-160w/) || [])[1], event: f('event-name'), result: f('col-result'), sections };
});
writeFileSync('raw/r1-parsed.json', JSON.stringify(out));
const cnt = (k) => { const c = {}; for (const d of out) { const v = typeof k === 'function' ? k(d) : d[k]; c[v] = (c[v] || 0) + 1; } return Object.entries(c).sort((a, b) => b[1] - a[1]); };
console.log('decks', out.length);
console.log('dates', JSON.stringify(cnt('date')));
console.log('results', JSON.stringify(cnt('result')));
const ev = cnt((d) => d.date + ' | ' + d.event); console.log('events', ev.length); console.log(ev.slice(0, 60).map((e) => e.join(' x')).join('\n'));
console.log('sections', JSON.stringify(cnt((d) => Object.entries(d.sections).map(([k, v]) => k + ':' + v.count).join(' ')).slice(0, 12)));
console.log('legends', cnt('legend').length);
console.log(JSON.stringify(out[0]).slice(0, 900));
