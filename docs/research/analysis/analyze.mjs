// Throwaway analysis: tournament-tagged Riftbound decklists joined to the official card gallery.
// Reads (read-only): cards-2026-11-11.json (built by build-cards.mjs), raw/pa-decks.jsonl (fetch-decks.mjs),
// and the local GameLab sample ~/github_repositories/GameLab/data/decks/samples/piltover-archive-2026-09-06.json.
// Writes: out/results.json and out/*.md tables. usage: node analyze.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { roles, speed, strip, BUCKETS, inBucket } from './roles.mjs';

mkdirSync('out', { recursive: true });
const DOMAINS = ['fury', 'calm', 'mind', 'body', 'chaos', 'order'];
const BANNED = new Set(['Called Shot', 'Ekko, Recurrent', 'Draven, Vanquisher', 'Fight or Flight', 'Scrapheap', 'Stealthy Pursuer', 'Stacked Deck', "The Arena's Greatest", "Aspirant's Climb", 'Dreaming Tree', 'Obelisk of Power', "Reaver's Row"]);

// ---------- card table ----------
const gal = JSON.parse(readFileSync('cards-2026-11-11.json', 'utf8')).cards;
const norm = (s) => (s || '').toLowerCase().replace(/[’`]/g, "'").replace(/\s+/g, ' ').trim();
const byName = new Map(); const byCode = new Map();
for (const c of gal) {
  const k = norm(c.name);
  if (!byName.has(k) || (byName.get(k).rarity === 'showcase' && c.rarity !== 'showcase')) byName.set(k, c);
  byCode.set(c.code, c);
  for (const v of c.variants) byCode.set(v.split('/')[0].replace(/\*$/, 's'), c), byCode.set(v.split('/')[0], c);
}
const roleCache = new Map();
function cardInfo(entry) {
  // entry: {name, type, super, energy, power, might, colors, text, code} (PA shape) -> unified card
  let g = byName.get(norm(entry.name)) || (entry.code && byCode.get(entry.code.replace(/[a-z*]+$/, '')));
  const paType = (entry.type || '').toLowerCase();
  const type = paType.includes('gear') && !paType.includes('unit') ? 'gear' : paType.includes('unit') ? 'unit' : paType.includes('spell') ? 'spell' : g?.type || paType;
  const c = {
    name: g?.name || entry.name, type,
    superTypes: g?.superTypes?.length ? g.superTypes : entry.super ? [String(entry.super).toLowerCase()] : [],
    energy: g?.energy ?? entry.energy ?? 0, power: g?.power ?? entry.power ?? 0, might: g?.might ?? entry.might ?? null,
    domains: g?.domains?.length ? g.domains : (entry.colors || []).map((x) => x.toLowerCase()),
    tags: g?.tags || entry.tags || [], text: g?.text || entry.text || '', set: g?.set || (entry.code || '').split('-')[0], inGallery: !!g,
  };
  if (!roleCache.has(c.name)) roleCache.set(c.name, { roles: roles(c), speed: speed(c) });
  return Object.assign(c, roleCache.get(c.name));
}

// ---------- load decks ----------
const decks = [];
const sum = (a) => a.reduce((x, y) => x + y.q, 0);
if (existsSync('raw/pa-decks.jsonl')) {
  for (const line of readFileSync('raw/pa-decks.jsonl', 'utf8').trim().split('\n')) {
    const d = JSON.parse(line);
    decks.push({ src: 'pa-2026-11-11', id: d.id, name: d.name, description: d.description, createdAt: d.createdAt, editedAt: d.editedAt, views: d.views,
      legendName: d.legend?.name, legendTag: (d.legend?.tags || [])[0], legendDomains: (d.legend?.colors || []).map((x) => x.toLowerCase()).sort(),
      champ: d.champions.map((e) => ({ q: e.q, c: cardInfo(e) })), main: d.main.map((e) => ({ q: e.q, c: cardInfo(e) })), side: d.side.map((e) => ({ q: e.q, c: cardInfo(e) })),
      runes: d.runes.map((e) => ({ q: e.q, name: e.name, domain: (e.colors[0] || e.name.split(' ')[0]).toLowerCase() })), battlefields: d.battlefields.map((e) => e.name) });
  }
}
const localPath = `${homedir()}/github_repositories/GameLab/data/decks/samples/piltover-archive-2026-09-06.json`;
if (existsSync(localPath)) {
  const have = new Set(decks.map((d) => d.id));
  for (const d of JSON.parse(readFileSync(localPath, 'utf8')).decks) {
    const id = d.source.split('/').pop(); if (have.has(id)) continue;
    const look = (code) => byCode.get(code) || byCode.get(code.replace(/[a-z*]+$/, ''));
    const ent = (x) => { const g = look(x.cardCode); return g ? { q: x.count, c: cardInfo({ name: g.name, type: g.type, code: g.code }) } : { q: x.count, c: cardInfo({ name: x.name || x.cardCode, type: x.type, code: x.cardCode }) }; };
    const champG = d.chosenChampion && look(d.chosenChampion);
    let main = d.main.map(ent);
    // the sample stores the chosen champion inside main; split one copy out to mirror the PA shape
    const champ = [];
    if (champG) { const e = main.find((m) => m.c.name === champG.name); if (e) { e.q -= 1; champ.push({ q: 1, c: e.c }); main = main.filter((m) => m.q > 0); } }
    const lg = d.legend && look(d.legend);
    const tag = lg?.tags?.[0] || champG?.tags?.[0];
    const lgAny = lg || gal.find((c) => c.type === 'legend' && c.tags[0] === tag);
    decks.push({ src: 'gamelab-sample-2026-09-06', id, name: d.name.replace(/&#x27;/g, "'"), description: '', createdAt: '2026-09-06', editedAt: '2026-09-06', views: null,
      legendName: lgAny?.name, legendTag: tag, legendDomains: (lgAny?.domains || []).slice().sort(),
      champ, main, side: (d.sideboard || []).map(ent),
      runes: (d.runes || []).map((x) => { const g = look(x.cardCode); return { q: x.count, name: g?.name, domain: g?.domains?.[0] }; }), battlefields: (d.battlefields || []).map((b) => look(b)?.name || b) });
  }
}

// ---------- per-deck features ----------
function placement(d) {
  const s = `${d.name} ${(d.description || '').slice(0, 200)}`;
  let rank = null; let m;
  if ((m = /(?:^|[^\d-])(\d{1,3})\s?(?:st|nd|rd|th)\b/i.exec(s))) rank = +m[1];
  else if ((m = /#\s?(\d{1,3})\b/.exec(s))) rank = +m[1];
  else if ((m = /\btop[ -]?(\d{1,3})\b/i.exec(s))) rank = +m[1];
  else if ((m = /\bT(4|8|16|32|64)\b/.exec(s))) rank = +m[1];
  if (rank === null && /\b(winner|winning|1er|won the|champion(?! deck)|🥇)\b/i.test(s)) rank = 1;
  if (rank === null && /\bfinalist\b|🥈/i.test(s)) rank = 2;
  const bestOf = /best[- ]?of/i.test(s);
  const cls = rank === 1 ? 'win' : rank && rank <= 8 ? 'top8' : rank && rank <= 64 ? 'top64' : bestOf ? 'bestof' : rank ? 'ranked>64' : 'event-only';
  return { rank, bestOf, cls };
}
const EVENTS = [['Stuttgart (RC Europe, Nov 6-8)', /stutt?g|rc ?eu|rc europe/i], ['Orlando 25K', /orlando|25k/i], ['Sacramento (LDXP)', /sacramento|ldxp/i], ['Melbourne', /melbourne/i], ['Los Angeles RQ', /\bRQ ?LA\b|los angeles|\bLA\b/], ['Singapore RQ', /singapore/i], ['Hartford RQ', /hartford/i], ['Utrecht RQ', /utrecht/i], ['Vancouver RQ', /vancouver/i], ['Sydney RQ', /sydney/i], ['Chengdu', /chengdu/i], ['Shenzhen/Shanghai/Shenyang', /shenzhen|shanghai|shenyang/i]];
function feat(d) {
  const all = [...d.champ, ...d.main];
  const n = (pred) => all.filter((e) => pred(e.c)).reduce((a, e) => a + e.q, 0);
  const f = {};
  f.mainTotal = sum(all); f.runeTotal = sum(d.runes); f.bfTotal = d.battlefields.length; f.sideTotal = sum(d.side);
  f.units = n((c) => c.type === 'unit'); f.spells = n((c) => c.type === 'spell'); f.gear = n((c) => c.type === 'gear');
  f.e01 = n((c) => c.energy <= 1); f.e2 = n((c) => c.energy === 2); f.e3 = n((c) => c.energy === 3); f.e4 = n((c) => c.energy === 4); f.e5 = n((c) => c.energy === 5); f.e6p = n((c) => c.energy >= 6);
  f.avgEnergy = all.reduce((a, e) => a + e.q * e.c.energy, 0) / f.mainTotal;
  f.units_e2to4 = n((c) => c.type === 'unit' && c.energy >= 2 && c.energy <= 4); f.units_le2 = n((c) => c.type === 'unit' && c.energy <= 2); f.units_le3 = n((c) => c.type === 'unit' && c.energy <= 3);
  f.powerCards = n((c) => c.power >= 1); f.power2Cards = n((c) => c.power >= 2); f.powerPips = all.reduce((a, e) => a + e.q * (e.c.power || 0), 0); f.maxPower = Math.max(...all.map((e) => e.c.power || 0));
  // domain demand: printed power pips (split evenly over the card's domains) and domain symbols in rules text (activated/optional costs)
  const pips = {}, textPips = {}, cardsBy = {};
  for (const e of all) {
    const ds = e.c.domains.filter((x) => DOMAINS.includes(x));
    for (const x of ds) { pips[x] = (pips[x] || 0) + (e.q * (e.c.power || 0)) / ds.length; cardsBy[x] = (cardsBy[x] || 0) + e.q / ds.length; }
    const t = strip(e.c.text);
    for (const x of DOMAINS) { const k = (t.match(new RegExp(`\\[${x}\\]`, 'gi')) || []).length; if (k) textPips[x] = (textPips[x] || 0) + e.q * k; }
  }
  f.pips = pips; f.textPips = textPips; f.cardsByDomain = cardsBy;
  const rd = {}; for (const r of d.runes) rd[r.domain] = (rd[r.domain] || 0) + r.q; f.runeSplit = rd;
  f.runeMajor = Math.max(0, ...Object.values(rd)); f.nonBasicRunes = d.runes.filter((r) => !/^(Fury|Calm|Mind|Body|Chaos|Order) Rune$/.test(r.name || '')).reduce((a, r) => a + r.q, 0);
  f.distinct = all.length ? new Set(all.map((e) => e.c.name)).size : 0;
  const cnt = {}; for (const e of all) cnt[e.c.name] = (cnt[e.c.name] || 0) + e.q;
  f.x3 = Object.values(cnt).filter((v) => v >= 3).length; f.x2 = Object.values(cnt).filter((v) => v === 2).length; f.x1 = Object.values(cnt).filter((v) => v === 1).length;
  f.chosen = d.champ[0]?.c.name || null; f.chosenCopies = f.chosen ? cnt[f.chosen] : 0; f.chosenEnergy = d.champ[0]?.c.energy ?? null;
  f.championUnits = n((c) => c.superTypes.includes('champion')); f.otherChampionUnits = f.championUnits - f.chosenCopies;
  f.signature = n((c) => c.superTypes.includes('signature'));
  for (const b of Object.keys(BUCKETS)) f['r_' + b] = n((c) => inBucket(c.roles, b));
  for (const r of ['removal_kill', 'removal_damage', 'removal_bounce', 'stun', 'sweeper', 'debuff', 'points', 'topend', 'token_maker', 'buff', 'score_trigger', 'discard_outlet', 'hate_gear', 'tempo_ready']) f['x_' + r] = n((c) => c.roles.includes(r));
  f.interaction = n((c) => inBucket(c.roles, 'removal') || c.roles.includes('counterspell') || c.roles.includes('combat_trick') || c.roles.includes('debuff'));
  f.sp_reaction = n((c) => c.type === 'spell' && c.speed === 'reaction'); f.sp_action = n((c) => c.type === 'spell' && c.speed === 'action'); f.sp_slow = n((c) => c.type === 'spell' && c.speed === 'slow');
  f.hiddenCards = n((c) => /\[hidden\]/i.test(c.text)); f.ambushUnits = n((c) => c.type === 'unit' && /\[ambush\]/i.test(c.text));
  f.banned = [...all, ...d.side].filter((e) => BANNED.has(e.c.name)).map((e) => e.c.name).concat(d.battlefields.filter((b) => BANNED.has(b)));
  f.hasRAD = [...all, ...d.side].some((e) => e.c.set === 'RAD') || /^RAD/.test(d.legendName && byName.get(norm(d.legendName))?.set || '');
  f.notInGallery = [...all, ...d.side].filter((e) => !e.c.inGallery).map((e) => e.c.name);
  return f;
}
for (const d of decks) {
  d.f = feat(d); d.p = placement(d);
  d.event = (EVENTS.find(([, re]) => re.test(d.name + ' ' + (d.description || '').slice(0, 120))) || ['other/unspecified'])[0];
  const when = (d.editedAt || d.createdAt || '').slice(0, 10);
  d.era = d.f.hasRAD || when >= '2026-10-16' ? 'RAD' : when >= '2026-09-18' ? 'VEN-postban' : 'VEN-preban';
  d.pair = d.legendDomains.join('+');
  d.valid = d.f.mainTotal === 40 && d.f.runeTotal === 12 && d.f.bfTotal === 3 && !!d.legendTag && d.champ.length === 1;
}
const valid = decks.filter((d) => d.valid);

// ---------- archetype clustering (k-means on z-scored composition features) ----------
const CL_FEATS = ['units', 'avgEnergy', 'e01', 'e2', 'e6p', 'r_removal', 'r_counterspells', 'r_draw', 'r_combat_tricks', 'r_tempo', 'x_topend', 'gear'];
function kmeans(rows, k, seed = 7, restarts = 30) {
  const d = rows[0].length; let best = null;
  let s = seed; const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const dist = (a, b) => a.reduce((t, v, i) => t + (v - b[i]) ** 2, 0);
  for (let r = 0; r < restarts; r++) {
    const cent = [rows[Math.floor(rnd() * rows.length)].slice()];
    while (cent.length < k) { const w = rows.map((x) => Math.min(...cent.map((c) => dist(x, c)))); const tot = w.reduce((a, b) => a + b, 0); let t = rnd() * tot, i = 0; while (t > w[i] && i < w.length - 1) t -= w[i++]; cent.push(rows[i].slice()); }
    let asg = new Array(rows.length).fill(0);
    for (let it = 0; it < 60; it++) {
      const na = rows.map((x) => { let bi = 0, bd = Infinity; cent.forEach((c, i) => { const dd = dist(x, c); if (dd < bd) bd = dd, bi = i; }); return bi; });
      const changed = na.some((v, i) => v !== asg[i]); asg = na;
      for (let i = 0; i < k; i++) { const m = rows.filter((_, j) => asg[j] === i); if (m.length) for (let j = 0; j < d; j++) cent[i][j] = m.reduce((a, x) => a + x[j], 0) / m.length; }
      if (!changed) break;
    }
    const inertia = rows.reduce((a, x, i) => a + dist(x, cent[asg[i]]), 0);
    if (!best || inertia < best.inertia) best = { inertia, asg, cent };
  }
  return best;
}
const mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((v) => (v - m) ** 2))) || 1; };
const mu = CL_FEATS.map((k) => mean(valid.map((d) => d.f[k]))), sg = CL_FEATS.map((k) => sd(valid.map((d) => d.f[k])));
const Z = valid.map((d) => CL_FEATS.map((k, i) => (d.f[k] - mu[i]) / sg[i]));
const kmOut = {};
for (const k of [3, 4, 5]) { const km = kmeans(Z, k); kmOut[k] = { inertia: +km.inertia.toFixed(1), sizes: Array.from({ length: k }, (_, i) => km.asg.filter((a) => a === i).length), centroidsRaw: km.cent.map((c) => Object.fromEntries(CL_FEATS.map((f, i) => [f, +(c[i] * sg[i] + mu[i]).toFixed(2)]))) }; if (k === 4) valid.forEach((d, i) => (d.cluster = km.asg[i])); }
// Rule-based archetype label (HEURISTIC, thresholds chosen after reading the k=4 centroids; see deck-theory.md 2.1)
function archetype(f) {
  if (f.avgEnergy <= 2.75 && f.units >= 20 && f.e6p <= 2) return 'aggro';
  if (f.units <= 15 || (f.spells >= 20 && f.r_removal + f.r_counterspells >= 12)) return 'control';
  if (f.avgEnergy >= 3.5 || f.e6p >= 6) return 'ramp/big';
  return 'midrange';
}
for (const d of valid) d.arch = archetype(d.f);

// ---------- stats helpers ----------
const q = (arr, p) => { if (!arr.length) return NaN; const a = arr.slice().sort((x, y) => x - y); const i = (a.length - 1) * p; const lo = Math.floor(i), hi = Math.ceil(i); return a[lo] + (a[hi] - a[lo]) * (i - lo); };
const st = (arr) => ({ n: arr.length, mean: +mean(arr).toFixed(2), p10: +q(arr, 0.1).toFixed(1), p25: +q(arr, 0.25).toFixed(1), p50: +q(arr, 0.5).toFixed(1), p75: +q(arr, 0.75).toFixed(1), p90: +q(arr, 0.9).toFixed(1) });
const METRICS = ['units', 'spells', 'gear', 'e01', 'e2', 'e3', 'e4', 'e5', 'e6p', 'avgEnergy', 'units_le2', 'units_le3', 'units_e2to4', 'powerCards', 'power2Cards', 'powerPips', 'maxPower', 'runeMajor', 'distinct', 'x3', 'x2', 'x1', 'chosenCopies', 'otherChampionUnits', 'championUnits', 'signature',
  'r_removal', 'r_hard_removal', 'x_removal_kill', 'x_removal_damage', 'x_removal_bounce', 'x_stun', 'x_sweeper', 'r_card_flow', 'r_draw', 'r_movement', 'r_tempo', 'r_combat_tricks', 'x_debuff', 'r_counterspells', 'r_protection', 'r_ramp', 'r_finishers', 'x_points', 'x_topend', 'r_recursion', 'r_hate', 'x_token_maker', 'x_buff', 'x_score_trigger', 'interaction', 'sp_reaction', 'sp_action', 'sp_slow', 'hiddenCards', 'sideTotal'];
const table = (rows, title) => { if (!rows.length) return `### ${title} (n=0)`; const o = [`### ${title} (n=${rows.length})`, '| metric | mean | p10 | p25 | p50 | p75 | p90 |', '|---|---|---|---|---|---|---|']; for (const m of METRICS) { const s = st(rows.map((d) => d.f[m])); o.push(`| ${m} | ${s.mean} | ${s.p10} | ${s.p25} | ${s.p50} | ${s.p75} | ${s.p90} |`); } return o.join('\n'); };
const groupBy = (rows, f) => { const m = new Map(); for (const r of rows) { const k = f(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); } return m; };
const top = (obj, n = 10) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
const tally = (arr) => { const m = {}; for (const v of arr) m[v] = (m[v] || 0) + 1; return m; };

// ---------- outputs ----------
const out = [];
out.push(`# dataset\n- decks loaded: ${decks.length}; valid (40 main incl. chosen champion, 12 runes, 3 battlefields, legend known): ${valid.length}`);
out.push(`- by source: ${JSON.stringify(tally(valid.map((d) => d.src)))}`);
out.push(`- by era: ${JSON.stringify(tally(valid.map((d) => d.era)))}`);
out.push(`- placement class: ${JSON.stringify(tally(valid.map((d) => d.p.cls)))}`);
out.push(`- events: ${JSON.stringify(tally(valid.map((d) => d.event)))}`);
out.push(`- decks containing a currently banned card: ${valid.filter((d) => d.f.banned.length).length}`);
out.push(`- invalid reasons sample: ${JSON.stringify(tally(decks.filter((d) => !d.valid).map((d) => `${d.f.mainTotal}/${d.f.runeTotal}/${d.f.bfTotal}/${d.champ.length}`)))}`);
out.push(`- cards not found in gallery (by name): ${JSON.stringify(top(tally(valid.flatMap((d) => d.f.notInGallery)), 15))}`);
out.push(`- kmeans: ${JSON.stringify(kmOut, null, 1)}`);
out.push(`- rule archetypes: ${JSON.stringify(tally(valid.map((d) => d.arch)))}; cluster x arch: ${JSON.stringify(tally(valid.map((d) => `c${d.cluster}:${d.arch}`)))}`);
writeFileSync('out/00-dataset.md', out.join('\n'));

const T = [table(valid, 'ALL valid lists')];
for (const era of ['RAD', 'VEN-postban', 'VEN-preban']) T.push(table(valid.filter((d) => d.era === era), `era ${era}`));
T.push(table(valid.filter((d) => ['win', 'top8'].includes(d.p.cls)), 'placement win/top8 only'));
writeFileSync('out/01-overall.md', T.join('\n\n'));
writeFileSync('out/02-archetype.md', ['aggro', 'midrange', 'control', 'ramp/big'].map((a) => table(valid.filter((d) => d.arch === a), `archetype ${a}`)).join('\n\n'));

// compact per-group table: selected metrics, p25-p50-p75
const SEL = ['units', 'spells', 'gear', 'avgEnergy', 'e01', 'e2', 'e3', 'e4', 'e5', 'e6p', 'powerPips', 'runeMajor', 'chosenCopies', 'championUnits', 'signature', 'r_removal', 'r_card_flow', 'r_tempo', 'r_combat_tricks', 'r_counterspells', 'r_finishers', 'x3'];
const compact = (groups, title, minN = 5) => { const o = [`### ${title}`, `| group | n | ${SEL.join(' | ')} |`, `|---|---|${SEL.map(() => '---').join('|')}|`]; for (const [k, rows] of [...groups].sort((a, b) => b[1].length - a[1].length)) { if (rows.length < minN) continue; o.push(`| ${k} | ${rows.length} | ${SEL.map((m) => { const a = rows.map((d) => d.f[m]); return m === 'avgEnergy' ? `${q(a, 0.5).toFixed(2)}` : `${q(a, 0.25).toFixed(0)}-${q(a, 0.5).toFixed(0)}-${q(a, 0.75).toFixed(0)}`; }).join(' | ')} |`); } return o.join('\n'); };
writeFileSync('out/03-groups.md', [compact(groupBy(valid, (d) => d.legendTag), 'per legend (champion tag), p25-p50-p75'), compact(groupBy(valid, (d) => d.pair), 'per domain pair'), compact(groupBy(valid, (d) => d.arch), 'per rule archetype', 1), compact(groupBy(valid, (d) => 'cluster' + d.cluster), 'per k-means cluster (k=4)', 1), compact(groupBy(valid, (d) => d.era), 'per era', 1), compact(groupBy(valid, (d) => d.p.cls), 'per placement class', 1)].join('\n\n'));

// legend detail: archetype mix, chosen champion, battlefields, rune splits
const L = ['### per legend detail', '| legend | n | pair | archetypes | chosen champion (share) | chosen copies p50 | rune splits | top battlefields (share of lists) |', '|---|---|---|---|---|---|---|---|'];
for (const [k, rows] of [...groupBy(valid, (d) => d.legendTag)].sort((a, b) => b[1].length - a[1].length)) {
  if (rows.length < 4) continue; const n = rows.length;
  const sp = (d) => Object.entries(d.f.runeSplit).sort((a, b) => b[1] - a[1]).map(([x, v]) => `${v} ${x}`).join('/');
  L.push(`| ${k} | ${n} | ${rows[0].pair} | ${top(tally(rows.map((d) => d.arch)), 3).map(([a, v]) => `${a} ${v}`).join(', ')} | ${top(tally(rows.map((d) => d.f.chosen)), 2).map(([a, v]) => `${a} ${(100 * v / n).toFixed(0)}%`).join('; ')} | ${q(rows.map((d) => d.f.chosenCopies), 0.5)} | ${top(tally(rows.map(sp)), 2).map(([a, v]) => `${a} ×${v}`).join('; ')} | ${top(tally(rows.flatMap((d) => d.battlefields)), 4).map(([a, v]) => `${a} ${(100 * v / n).toFixed(0)}%`).join('; ')} |`);
}
L.push('', '### battlefields overall (share of valid lists)', top(tally(valid.flatMap((d) => d.battlefields)), 25).map(([a, v]) => `- ${a}: ${(100 * v / valid.length).toFixed(0)}%${BANNED.has(a) ? ' (BANNED now)' : ''}`).join('\n'));
L.push('', '### battlefields RAD era', (() => { const r = valid.filter((d) => d.era === 'RAD'); return top(tally(r.flatMap((d) => d.battlefields)), 20).map(([a, v]) => `- ${a}: ${(100 * v / r.length).toFixed(0)}%`).join('\n'); })());
writeFileSync('out/04-legends.md', L.join('\n'));

// rune split vs demand
const R = ['### rune split distribution (major-minor)', JSON.stringify(tally(valid.map((d) => Object.values(d.f.runeSplit).sort((a, b) => b - a).join('-')))), `non-basic runes in rune deck: ${JSON.stringify(tally(valid.map((d) => d.f.nonBasicRunes)))}`];
const two = valid.filter((d) => d.legendDomains.length === 2);
const fit = (xs, ys) => { const mx = mean(xs), my = mean(ys); const sxy = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0), sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0), syy = ys.reduce((a, y) => a + (y - my) ** 2, 0); const b = sxy / sxx; return { n: xs.length, a: +(my - b * mx).toFixed(3), b: +b.toFixed(3), r2: +((sxy * sxy) / (sxx * syy)).toFixed(3) }; };
const share = (o, a, b) => { const A = o[a] || 0, B = o[b] || 0; return A + B > 0 ? A / (A + B) : 0.5; };
const mk = (fn) => two.map((d) => { const [a, b] = d.legendDomains; return fn(d, a, b); });
const y = mk((d, a, b) => (d.f.runeSplit[a] || 0));
const defs = {
  'printed power pips share': mk((d, a, b) => share(d.f.pips, a, b)),
  'printed + text-cost pips share': mk((d, a, b) => { const o = {}; for (const x of [a, b]) o[x] = (d.f.pips[x] || 0) + (d.f.textPips[x] || 0); return share(o, a, b); }),
  'printed + 0.5*text pips share': mk((d, a, b) => { const o = {}; for (const x of [a, b]) o[x] = (d.f.pips[x] || 0) + 0.5 * (d.f.textPips[x] || 0); return share(o, a, b); }),
  'card-count share': mk((d, a, b) => share(d.f.cardsByDomain, a, b)),
};
R.push('### OLS: runes of domain A (of 12) ~ a + b * share_A, two-domain legends');
for (const [k, xs] of Object.entries(defs)) R.push(`- ${k}: ${JSON.stringify(fit(xs, y))}`);
// formula accuracy: runesA = clamp(round(6 + 12*k*(share-0.5)), 3, 9) for several k
const best = defs['printed + text-cost pips share'];
for (const k of [0.4, 0.5, 0.6, 0.75, 1]) { let exact = 0, within1 = 0; best.forEach((s, i) => { const pred = Math.max(3, Math.min(9, Math.round(6 + 12 * k * (s - 0.5)))); if (pred === y[i]) exact++; if (Math.abs(pred - y[i]) <= 1) within1++; }); R.push(`- formula k=${k}: exact ${(100 * exact / y.length).toFixed(0)}%, within±1 ${(100 * within1 / y.length).toFixed(0)}% (n=${y.length})`); }
// binned: share bucket -> observed major-domain runes
const bins = {}; best.forEach((s, i) => { const maj = Math.max(s, 1 - s); const b = maj < 0.55 ? '0.50-0.55' : maj < 0.65 ? '0.55-0.65' : maj < 0.75 ? '0.65-0.75' : maj < 0.85 ? '0.75-0.85' : '0.85-1.00'; const r = s >= 0.5 ? y[i] : 12 - y[i]; (bins[b] ||= []).push(r); });
R.push('### runes in the higher-demand domain, by that domain\'s share of (printed+text) pips'); for (const b of Object.keys(bins).sort()) R.push(`- share ${b}: n=${bins[b].length}, mean ${mean(bins[b]).toFixed(2)}, dist ${JSON.stringify(tally(bins[b]))}`);
R.push(`### power stats: total printed pips p25/p50/p75 = ${[0.25, 0.5, 0.75].map((p) => q(valid.map((d) => d.f.powerPips), p)).join('/')}; max single-card power dist ${JSON.stringify(tally(valid.map((d) => d.f.maxPower)))}`);
writeFileSync('out/05-runes.md', R.join('\n'));

// sideboard
const sideCat = (c) => c.roles.includes('counterspell') ? 'counterspell' : (c.roles.includes('hate_gear') || c.roles.includes('hate_trash') || c.roles.includes('hand_attack') || c.roles.includes('point_denial')) ? 'hate (gear/trash/hand/points)' : c.roles.includes('sweeper') ? 'sweeper' : inBucket(c.roles, 'removal') ? 'spot removal/stun/bounce' : c.roles.includes('protection') ? 'protection' : (c.roles.includes('combat_trick') || c.roles.includes('debuff')) ? 'combat trick/debuff' : inBucket(c.roles, 'card_flow') ? 'card flow' : c.type === 'unit' ? 'unit (threat/body)' : c.type === 'gear' ? 'gear (other)' : 'spell (other)';
const S = []; const withSide = valid.filter((d) => d.f.sideTotal > 0);
S.push(`### sideboard size: ${JSON.stringify(tally(valid.map((d) => d.f.sideTotal)))}`);
const catTot = {}; let tot = 0; for (const d of withSide) for (const e of d.side) { const k = sideCat(e.c); catTot[k] = (catTot[k] || 0) + e.q; tot += e.q; }
S.push('### sideboard slots by category, all lists with a sideboard (n=' + withSide.length + ')', ...top(catTot, 12).map(([k, v]) => `- ${k}: ${(100 * v / tot).toFixed(1)}% of slots, ${(v / withSide.length).toFixed(2)} cards/deck`));
for (const a of ['aggro', 'midrange', 'control', 'ramp/big']) { const rows = withSide.filter((d) => d.arch === a); const ct = {}; let t = 0; for (const d of rows) for (const e of d.side) { const k = sideCat(e.c); ct[k] = (ct[k] || 0) + e.q; t += e.q; } S.push(`- ${a} (n=${rows.length}): ` + top(ct, 6).map(([k, v]) => `${k} ${(v / rows.length).toFixed(1)}`).join('; ')); }
const sc = {}; for (const d of withSide) for (const e of d.side) sc[e.c.name] = (sc[e.c.name] || 0) + 1;
S.push('### most common sideboard cards (share of lists with a sideboard)', ...top(sc, 25).map(([k, v]) => { const c = roleCache.get(k); return `- ${k}: ${(100 * v / withSide.length).toFixed(0)}% [${(c?.roles || []).join(',')}]`; }));
const mc = {}; for (const d of valid) for (const e of [...d.champ, ...d.main]) mc[e.c.name] = (mc[e.c.name] || 0) + 1;
S.push('### most common main-deck cards (share of valid lists)', ...top(mc, 30).map(([k, v]) => { const c = roleCache.get(k); return `- ${k}: ${(100 * v / valid.length).toFixed(0)}% [${(c?.roles || []).join(',')}]`; }));
S.push(`### sideboard: distinct cards p50 ${q(withSide.map((d) => d.side.length), 0.5)}, copies-per-card: ${JSON.stringify(tally(withSide.flatMap((d) => d.side.map((e) => e.q))))}`);
S.push(`### side champions: lists with a champion unit of the legend's tag in the sideboard: ${withSide.filter((d) => d.side.some((e) => e.c.superTypes.includes('champion') && e.c.tags.includes(d.legendTag))).length}/${withSide.length}`);
writeFileSync('out/06-sideboard.md', S.join('\n'));

// chosen champion energy, champion detail
const C = [`### chosen champion energy cost distribution: ${JSON.stringify(tally(valid.map((d) => d.f.chosenEnergy)))}`, `### copies of the chosen champion (incl. the champion-zone copy): ${JSON.stringify(tally(valid.map((d) => d.f.chosenCopies)))}`, `### signature cards: ${JSON.stringify(tally(valid.map((d) => d.f.signature)))}`, `### other champion units: ${JSON.stringify(tally(valid.map((d) => d.f.otherChampionUnits)))}`, `### main-deck size incl. champion: ${JSON.stringify(tally(decks.map((d) => d.f.mainTotal)))}`, `### spell speeds (copies per deck, mean): reaction ${mean(valid.map((d) => d.f.sp_reaction)).toFixed(1)}, action ${mean(valid.map((d) => d.f.sp_action)).toFixed(1)}, slow ${mean(valid.map((d) => d.f.sp_slow)).toFixed(1)}`];
writeFileSync('out/07-champion.md', C.join('\n'));

writeFileSync('out/results.json', JSON.stringify({ generatedAt: new Date().toISOString(), nDecks: decks.length, nValid: valid.length, kmeans: kmOut, decks: valid.map((d) => ({ id: d.id, src: d.src, name: d.name, era: d.era, event: d.event, placement: d.p, legend: d.legendTag, pair: d.pair, arch: d.arch, cluster: d.cluster, battlefields: d.battlefields, f: d.f })) }));
console.log(readFileSync('out/00-dataset.md', 'utf8'));
