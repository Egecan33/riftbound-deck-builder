import { loadParsed } from './show.mjs';
const P = loadParsed(); const v = {}, kw = {}, st = {};
const walk = (e, f) => { if (!e) return; if (Array.isArray(e)) return e.forEach((x) => walk(x, f)); f(e); if (e.options) walk(e.options, f); if (e.granted) for (const a of [].concat(e.granted)) walk(a.effects, f); };
for (const c of P) { for (const k of c.keywords) kw[k.name] = (kw[k.name] || 0) + 1; for (const a of c.abilities) { if (a.staticType) st[a.staticType] = (st[a.staticType] || 0) + 1; walk(a.effects, (e) => (v[e.verb] = (v[e.verb] || 0) + 1)); } }
const f = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map((e) => e.join(':')).join(' ');
console.log('VERBS', f(v)); console.log('KW', f(kw)); console.log('STATIC', f(st));
