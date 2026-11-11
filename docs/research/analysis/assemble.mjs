// Build ../deck-theory.md from deck-theory.template.md by inlining measured tables from out/.
import { readFileSync, writeFileSync } from 'node:fs';
const g = readFileSync('out/03-groups.md', 'utf8').split('\n\n');
writeFileSync('out/03-groups-legend-pair.md', g.slice(0, 2).join('\n\n').replace(/^### /gm, '**').replace(/^(\*\*[^\n|]+)$/gm, '$1**'));
const l = readFileSync('out/04-legends.md', 'utf8'); const cut = l.indexOf('### battlefields overall');
writeFileSync('out/04-legends-detail.md', l.slice(0, cut).replace('### per legend detail\n', '').trim());
writeFileSync('out/04-battlefields.md', l.slice(cut).replace(/^### (.*)$/gm, '**$1** [D]\n').trim());
let t = readFileSync('deck-theory.template.md', 'utf8');
t = t.replace(/\{\{INCLUDE:([^}]+)\}\}/g, (m, f) => {
  let x = readFileSync(f, 'utf8').trim().replace(/^### (.*)$/gm, '\n**$1**\n');
  if (f.endsWith('.md')) x = x.replace(/^(\{.*|non-basic.*)$/gm, '- $1').replace(/^(\*\*[^\n]*\*\*(?: \[D\])?)\n(?!\n)/gm, '$1\n\n').replace(/\n{3,}/g, '\n\n');
  return x.trim();
});
writeFileSync('../deck-theory.md', t);
console.log('written', t.length, 'chars,', t.split('\n').length, 'lines; unresolved includes:', (t.match(/\{\{INCLUDE/g) || []).length);
