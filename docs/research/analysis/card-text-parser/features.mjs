// Derived per-card scorer features from out/parsed.json. Deterministic; no text is read here except by the recall baseline.
// Usage: node features.mjs [--sample]   -> out/features.json, out/role-counts.json, out/role-samples.txt
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { card as show } from './show.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const parsed = JSON.parse(readFileSync(join(HERE, 'out/parsed.json'), 'utf8'));

// ---------- effect iteration with pronoun resolution ----------
const OPP_ACTORS = new Set(['chosen-player', 'each-opponent', 'opponent', 'controller', 'owner']);
/** Yields { a, e, t, nested } for every effect; t = target with "prev"/"chosen" refs resolved to the last explicit target
 *  of the same ability, or to the trigger subject ("when you buff a friendly unit, ready it"). */
function* effectsOf(c) {
  function* run(list, a, nested, ctx) {
    for (const e of list || []) {
      if (Array.isArray(e)) { yield* run(e, a, nested, ctx); continue; }
      let t = e.target;
      if (t && !t.ref) ctx.last = t;
      else if (t && (t.ref === 'prev' || t.ref === 'chosen')) t = ctx.last || trigTarget(a) || t;
      yield { a, e, t, nested };
      // a pronoun after "play a ... token" refers to the token, not to an earlier chosen object
      if (e.verb === 'createToken' && !OPP_ACTORS.has(e.actor)) ctx.last = { controller: 'friendly', types: [e.token?.type || 'unit'], count: 1, fromToken: true };
      if (e.options) for (const o of e.options) yield* run(o, a, nested, { last: ctx.last });
      if (e.granted) for (const g of [].concat(e.granted)) yield* run(g.effects, g, true, { last: ctx.last });
    }
  }
  for (const a of c.abilities) yield* run(a.effects, a, false, { last: null });
}
/** "it" in a triggered ability with no earlier explicit target refers to the object named by the trigger condition. */
function trigTarget(a) {
  const tr = a.trigger; if (!tr || /^when-(played|i-|attached)/.test(tr.event) || tr.scope === 'self') return null;
  const txt = `${tr.event} ${tr.raw || ''}`.toLowerCase(); const ty = /\bgear\b/.test(txt) ? 'gear' : /\bspell\b/.test(txt) ? 'spell' : /\bunits?\b/.test(txt) ? 'unit' : null; if (!ty) return null;
  const controller = tr.subject && ['friendly', 'enemy'].includes(tr.subject) ? tr.subject : /opponent|enemy/.test(txt) ? 'enemy' : /friendly|you (play|buff|ready|stun|move)|your /.test(txt) ? 'friendly' : 'any';
  return { controller, types: [ty], count: 1, fromTrigger: true };
}
const parts = (t) => (t?.multi ? t.multi : t ? [t] : []);
const isSelf = (t) => t?.ref === 'self';
const hasType = (t, ...ty) => parts(t).some((p) => (p.types || []).some((x) => ty.includes(x)));
/** May this effect hit something the opponent controls? "any" controller counts (the caster chooses). An effect performed by
 *  an opposing actor on "their"/friendly objects (edict: "the defender must kill one of their units") also counts. */
const hitsEnemy = (e, t) => !isSelf(t) && parts(t).some((p) => !p.ref && (OPP_ACTORS.has(e.actor) ? p.controller !== 'enemy' || e.actor === 'controller' : p.controller === 'enemy' || p.controller === 'any' || p.controller === undefined));
const hitsFriendly = (e, t) => isSelf(t) || (!OPP_ACTORS.has(e.actor) && parts(t).some((p) => p.controller === 'friendly' || p.controller === 'any'));
const isMass = (e, t) => t && (t.count === 'all' || t.count === 'any-number' || e.split === true || (typeof t.count === 'number' && t.count >= 3 && !t.multi) || (typeof t.count === 'object' && t.count?.upTo >= 3));
const onBoard = (t) => !['trash', 'hand', 'deck', 'looked', 'banished-with-this'].includes(t?.location);
// iteration 3: a permanent that can be played at Reaction timing ([Reaction] / [Action] on the card, [Hidden] CR 811.1.b, [Ambush] CR 822,
// [Quick-Draw] CR 819) delivers its play effect at that speed, so its "When you play me" trigger counts as fast.
const FASTKW = new Set(['Hidden', 'Ambush', 'Quick-Draw']);
const fast = (c, a) => a.speed === 'action' || a.speed === 'reaction' || (c.type === 'spell' && c.speed !== 'normal')
  || ((c.speed !== 'normal' || c.keywords.some((k) => FASTKW.has(k.name) && !k.grantedToWearer)) && (a.kind === 'on-play' || (a.kind === 'triggered' && (a.trigger?.events || [a.trigger?.event]).includes('when-played') && a.trigger?.scope === 'self')));
const kwNames = (c) => c.keywords.filter((k) => !k.grantedToWearer).map((k) => k.name);

// ---------- role derivation (exact rules; mirrored in card-text-parser.md section 7) ----------
export function deriveRoles(c) {
  const R = {}; const add = (role, why) => { (R[role] ||= new Set()).add(why); };
  const kws = kwNames(c);
  for (const { a, e, t, nested } of effectsOf(c)) {
    const v = e.verb; const stat = a.kind === 'static';
    // removal: destroys / damages / steals an opposing unit or gear on the board
    if (['kill', 'banish', 'deal', 'fight', 'takeControl'].includes(v) && t && onBoard(t) && (v === 'fight' ? true : hitsEnemy(e, t)) && (hasType(t, 'unit', 'gear', 'equipment', 'permanent') || v === 'fight')) {
      const what = hasType(t, 'unit') || v === 'fight' ? 'unit' : 'gear';
      add(isMass(e, t) ? 'removal_sweeper' : 'removal_single', `${v}:${what}`);
    }
    if (v === 'kill' && e.actor === 'each-player' && t && hasType(t, 'unit')) add('removal_single', 'edict-symmetric');
    // combat trick: fast, temporary stat/keyword/state change
    if (fast(c, a) && !stat && (['stun', 'doubleMight', 'setMight', 'swapMight', 'prevent'].includes(v) || (v === 'might' && e.duration) || (v === 'grantKeyword' && e.duration) || (v === 'ready' && t && (isSelf(t) || hasType(t, 'unit'))))) add('combat_trick', v);
    // counter / protection
    if (v === 'counter') add('counter_protection', 'counter');
    if (v === 'prevent' || v === 'retarget') add('counter_protection', v);
    if (v === 'untargetable' && !isSelf(t)) add('counter_protection', 'untargetable-others');
    if (v === 'grantKeyword' && (e.keywords || []).some((k) => k.name === 'Deflect') && !isSelf(t)) add('counter_protection', 'grant-Deflect');
    if (a.kind === 'replacement' && a.trigger?.event === 'would-die' && v !== 'banish' && !a.effects.every((x) => x.verb === 'banish')) add('counter_protection', 'death-replacement');
    if (v === 'recall' && e.instead && t?.count !== 'all') add('counter_protection', 'death-replacement');
    if (v === 'restrict' && /^can't be (chosen|countered|moved by enemy)/.test(e.what || '') && (a.kind !== 'static' || !isSelf(t))) add('counter_protection', 'grant-immunity');
    // card flow
    if (['draw', 'tutorTop', 'toHand'].includes(v) && e.actor !== 'each-opponent') add('card_flow', v);
    if (['look', 'banishTop'].includes(v)) add('card_selection', v);
    // rune ramp / resources
    if (['channel', 'readyRune', 'add'].includes(v)) add('rune_ramp', v);
    if (v === 'createToken' && e.token?.name === 'Gold' && !OPP_ACTORS.has(e.actor)) add('rune_ramp', 'gold-token');
    if (v === 'costChange' && e.sign === '-' && !isSelf(t) && a.kind !== 'keyword') add('cost_reducer', 'others');
    // finisher
    if (['score', 'win', 'extraTurn'].includes(v) && !OPP_ACTORS.has(e.actor)) add('finisher', v);
    if (v === 'doubleMight' || (v === 'might' && !stat && t?.count === 'all' && t.controller === 'friendly' && (typeof e.amount !== 'number' || e.amount > 0))) add('finisher', 'mass-pump');
    // token maker
    if (v === 'createToken' && e.token?.name !== 'Gold' && e.token?.type !== 'battlefield' && !OPP_ACTORS.has(e.actor)) add('token_maker', `${e.token?.type || '?'}:${e.token?.name || '?'}`);
    // buff source
    if (v === 'buff') add('buff_source', 'buff-counter');
    if (v === 'might' && !isSelf(t) && (typeof e.amount !== 'number' || e.amount > 0) && e.sign !== '-' && (stat || !e.duration) && a.origin !== 'equipment-effect') add('buff_source', stat ? 'anthem' : 'permanent-might');
    if (v === 'grantKeyword' && stat && !isSelf(t) && a.origin !== 'equipment-effect') add('buff_source', 'keyword-anthem');
    // mobility
    if (['move', 'swapPlaces'].includes(v) && (isSelf(t) || (t && hitsFriendly(e, t) && parts(t).some((p) => p.controller === 'friendly')) || (!t && !OPP_ACTORS.has(e.actor)))) add('mobility', v);
    // a recall that is the outcome of a replacement effect ("heal it, exhaust it, and recall it instead", errata wording) is a save, not movement
    if (v === 'recall' && !e.instead && a.kind !== 'replacement' && !/would die/.test(String(e.delayed || '')) && !OPP_ACTORS.has(e.actor)) add('mobility', 'recall');
    if (v === 'playPermission') add('mobility', 'play-anywhere');
    if (v === 'grantKeyword' && (e.keywords || []).some((k) => k.name === 'Ganking')) add('mobility', 'grant-Ganking');
    if (v === 'enterReady') add('haste', isSelf(t) ? 'self' : 'others');
    if (v === 'grantKeyword' && (e.keywords || []).some((k) => k.name === 'Accelerate')) add('haste', 'grant-Accelerate');
    // recursion
    if (['play', 'returnToHand', 'toHand', 'attach'].includes(v) && (e.from === 'trash' || t?.location === 'trash')) add('recursion', v);
    if (v === 'permission' && e.what === 'play-from-trash') add('recursion', 'play-from-trash-permission');
    // disruption
    if (v === 'discard' && OPP_ACTORS.has(e.actor)) add('disruption', 'discard');
    if (v === 'discard' && e.actor === 'each-player') add('disruption', 'discard-symmetric');
    if (v === 'revealHand') add('disruption', 'reveal-hand');
    if (v === 'stun' && t && hitsEnemy(e, t)) add('disruption', 'stun');
    if (v === 'exhaust' && t && !isSelf(t) && parts(t).some((p) => p.controller === 'enemy')) add('disruption', 'exhaust');
    if (v === 'move' && t && !isSelf(t) && parts(t).some((p) => p.controller === 'enemy' || p.controller === 'any')) add('disruption', 'move-enemy');
    if (v === 'returnToHand' && t && !isSelf(t) && onBoard(t) && e.from !== 'trash' && parts(t).some((p) => !p.ref && (p.controller === 'enemy' || p.controller === 'any'))) add('disruption', 'bounce');
    if (v === 'might' && !stat && hitsEnemy(e, t) && t && (e.sign === '-' || (typeof e.amount === 'number' && e.amount < 0))) add('disruption', 'shrink');
    if (v === 'costChange' && e.sign === '+') add('disruption', 'tax');
    if (v === 'restrict' && !isSelf(t) && (a.staticType === 'restriction' ? /^(can't (play|move|score|gain points|ready|be played|be revealed)|can only|must pay|only channel|don't ready)/.test(e.what || '') : a.kind !== 'static' && /^can't play/.test(e.what || ''))) add('disruption', 'restriction');
    if (v === 'burn' && OPP_ACTORS.has(e.actor)) add('disruption', 'mill');
    if (v === 'banish' && t?.location === 'trash') add('disruption', 'trash-hate');
    if (v === 'grantKeyword' && (e.keywords || []).some((k) => k.name === 'Temporary') && t && hitsEnemy(e, t)) add('removal_single', 'grant-Temporary');
    void nested;
  }
  if (kws.includes('Ganking')) add('mobility', 'Ganking');
  if (c.keywords.some((k) => k.name === 'Ganking' && k.grantedToWearer)) add('mobility', 'equip-Ganking');
  if (kws.includes('Accelerate')) add('haste', 'Accelerate');
  if (kws.includes('Vision')) add('card_selection', 'Vision');
  if (c.type === 'gear' && kws.includes('Equip')) add('buff_source', 'equipment');
  if (kws.includes('Flow')) add('recursion', 'Flow'); // CR 829.1.b: "You may play this from your trash for its flow cost. Then banish it."
  if (c.abilities.some((a) => a.staticType === 'effect-text' && a.effects.some((e) => e.verb === 'play' && e.from === 'trash'))) add('recursion', 'self-from-trash');
  return Object.fromEntries(Object.entries(R).map(([k, v]) => [k, [...v]]));
}

// ---------- cost efficiency: Might versus the pool curve ----------
const units = parsed.filter((c) => c.type === 'unit' && !c.superTypes.includes('token') && typeof c.might === 'number' && typeof c.energy === 'number');
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
const curve = {}; for (const u of units) (curve[u.energy] ||= []).push(u.might);
const curveTable = Object.entries(curve).map(([e, ms]) => ({ energy: +e, n: ms.length, median: median(ms), mean: +(ms.reduce((a, b) => a + b, 0) / ms.length).toFixed(2), min: Math.min(...ms), max: Math.max(...ms) })).sort((a, b) => a.energy - b.energy);
// OLS: might ~ b0 + b1*energy + b2*power (normal equations, 3x3)
function ols(rows) {
  const X = rows.map((u) => [1, u.energy, u.power || 0]); const y = rows.map((u) => u.might);
  const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; const b = [0, 0, 0];
  X.forEach((x, i) => { for (let r = 0; r < 3; r++) { b[r] += x[r] * y[i]; for (let s = 0; s < 3; s++) A[r][s] += x[r] * x[s]; } });
  for (let i = 0; i < 3; i++) { const p = A[i][i]; for (let j = i; j < 3; j++) A[i][j] /= p; b[i] /= p; for (let k = 0; k < 3; k++) if (k !== i) { const f = A[k][i]; for (let j = i; j < 3; j++) A[k][j] -= f * A[i][j]; b[k] -= f * b[i]; } }
  const pred = (u) => b[0] + b[1] * u.energy + b[2] * (u.power || 0);
  const mean = y.reduce((a, c) => a + c, 0) / y.length; const ssT = y.reduce((a, v) => a + (v - mean) ** 2, 0); const ssR = rows.reduce((a, u) => a + (u.might - pred(u)) ** 2, 0);
  return { b0: +b[0].toFixed(3), b1: +b[1].toFixed(3), b2: +b[2].toFixed(3), r2: +(1 - ssR / ssT).toFixed(3), sd: +Math.sqrt(ssR / (rows.length - 3)).toFixed(3), pred };
}
const fit = ols(units);
const vanilla = units.filter((u) => u.abilities.length === 0);
const fitVanilla = vanilla.length > 5 ? ols(vanilla) : null;
// big body = smallest Might m such that at most 10% of non-token units have Might >= m
const p90 = (() => { for (let m = 0; m < 20; m++) if (units.filter((u) => u.might >= m).length <= 0.1 * units.length) return m; return 99; })();
const medByEnergy = Object.fromEntries(curveTable.map((r) => [r.energy, r.median]));

// ---------- per-card features ----------
const GATE = new Set(['legion', 'level', 'empowered']);
function features(c) {
  const roles = deriveRoles(c);
  const nonKw = c.abilities.filter((a) => a.kind !== 'keyword');
  const condOf = (a) => [...a.conditions.filter((k) => k.type !== 'usage-limit' && k.type !== 'optional').map((k) => k.type), ...a.effects.flatMap((e) => (e.conditions || []).filter((k) => !['if-you-do', 'otherwise', 'optional'].includes(k.type)).map((k) => k.type))];
  const conditional = nonKw.filter((a) => condOf(a).length > 0);
  const f = {
    code: c.code, name: c.name, type: c.type, superTypes: c.superTypes, domains: c.domains, sets: c.sets, energy: c.energy, power: c.power, might: c.might ?? null,
    roles,
    speed: { card: c.speed, hidden: kwNames(c).includes('Hidden'), fastestAbility: c.abilities.some((a) => a.kind === 'activated' && a.speed === 'reaction') ? 'reaction' : c.abilities.some((a) => a.kind === 'activated' && a.speed === 'action') ? 'action' : null,
      interactive: c.speed !== 'normal' || kwNames(c).includes('Hidden') || c.abilities.some((a) => a.kind === 'activated' && a.speed !== 'normal' && !a.effects.every((e) => e.verb === 'add')) },
    conditionality: { abilities: nonKw.length, conditional: conditional.length, share: nonKw.length ? +(conditional.length / nonKw.length).toFixed(2) : 0, gates: [...new Set(nonKw.flatMap((a) => condOf(a)).filter((t) => GATE.has(t)))], types: [...new Set(nonKw.flatMap(condOf))],
      optionalCosts: c.abilities.filter((a) => a.staticType === 'additional-cost').length, selfCostReduction: c.abilities.some((a) => a.effects.some((e) => e.verb === 'costChange' && e.sign === '-' && e.target?.ref === 'self')) },
    parseStatus: c.parse.status,
  };
  if (c.type === 'unit' && typeof c.might === 'number' && typeof c.energy === 'number') {
    const exp = fit.pred(c);
    f.efficiency = { mightPerEnergy: c.energy > 0 ? +(c.might / c.energy).toFixed(2) : null, medianAtEnergy: medByEnergy[c.energy] ?? null, vsMedian: medByEnergy[c.energy] != null ? c.might - medByEnergy[c.energy] : null, expected: +exp.toFixed(2), residual: +(c.might - exp).toFixed(2), z: +((c.might - exp) / fit.sd).toFixed(2) };
    if (c.might >= p90 && !c.superTypes.includes('token')) (f.roles.finisher ||= []).push('big-body');
  }
  return f;
}
const feats = parsed.map(features);
writeFileSync(join(HERE, 'out/features.json'), JSON.stringify({ generated: '2026-11-11', curve: curveTable, fit: { ...fit, pred: undefined, n: units.length }, fitVanilla: fitVanilla ? { ...fitVanilla, pred: undefined, n: vanilla.length } : null, bigBodyThreshold: p90, cards: feats }));

// ---------- counts ----------
const ROLES = ['removal_single', 'removal_sweeper', 'combat_trick', 'counter_protection', 'card_flow', 'card_selection', 'rune_ramp', 'cost_reducer', 'finisher', 'token_maker', 'buff_source', 'mobility', 'haste', 'recursion', 'disruption'];
const deckable = (f) => ['unit', 'spell', 'gear'].includes(f.type) && !f.superTypes.includes('token');
const counts = {}; for (const r of ROLES) { const rs = feats.filter((f) => f.roles[r]); const why = {}; for (const f of rs) for (const w of f.roles[r]) { const k = r === 'token_maker' ? w : w; why[k] = (why[k] || 0) + 1; }
  counts[r] = { all: rs.length, deckable: rs.filter(deckable).length, byType: Object.fromEntries(['unit', 'spell', 'gear', 'legend', 'battlefield'].map((t) => [t, rs.filter((f) => f.type === t).length])), rad: rs.filter((f) => f.sets[0] === 'RAD').length, why: Object.fromEntries(Object.entries(why).sort((a, b) => b[1] - a[1])) }; }
const noRole = feats.filter((f) => deckable(f) && Object.keys(f.roles).length === 0);
const sp = { card: {}, interactive: feats.filter((f) => deckable(f) && f.speed.interactive).length, hidden: feats.filter((f) => f.speed.hidden).length }; for (const f of feats.filter(deckable)) sp.card[f.type + ':' + f.speed.card] = (sp.card[f.type + ':' + f.speed.card] || 0) + 1;
const cd = { anyConditional: feats.filter((f) => deckable(f) && f.conditionality.conditional > 0).length, gates: {}, types: {}, optionalCosts: feats.filter((f) => f.conditionality.optionalCosts).length, selfCostReduction: feats.filter((f) => f.conditionality.selfCostReduction).length };
for (const f of feats) { for (const g of f.conditionality.gates) cd.gates[g] = (cd.gates[g] || 0) + 1; for (const g of f.conditionality.types) cd.types[g] = (cd.types[g] || 0) + 1; }
// recall baseline: naive text regexes; cards where the regex fires but the role is absent are candidates for a miss
const bare = (c) => c.textUsed.replace(/\([^()]*\)/g, '') + ' ' + (c.effectTextUsed || '');
const BASE = { card_flow: /\bdraws? \d|\bdraw a card/i, removal: /\bkill (a|an|all|each|up to|any|target|that|it\b)|\bdeals? (\d+|damage|that much)|\bbanish (a|an|all|each|that|it\b)/i, counter_protection: /\bcounter (a|an|that|it)\b|\bprevent\b/i, rune_ramp: /\bchannel\b|\[Add\]|ready (up to )?(\d+|a|two|your) runes?/i, token_maker: /unit tokens?\b/i, recursion: /from your trash/i, finisher: /score \d+ points?|score a point|win the game|extra turn/i };
const byCode = new Map(feats.map((f) => [f.code, f])); const recall = {};
for (const [r, re] of Object.entries(BASE)) { const hit = parsed.filter((c) => re.test(bare(c))); const has = (f) => (r === 'removal' ? f.roles.removal_single || f.roles.removal_sweeper : f.roles[r]); const miss = hit.filter((c) => !has(byCode.get(c.code))); recall[r] = { regexHits: hit.length, withRole: hit.length - miss.length, missing: miss.map((c) => c.code) }; }
writeFileSync(join(HERE, 'out/role-counts.json'), JSON.stringify({ pool: feats.length, deckable: feats.filter(deckable).length, counts, noRoleDeckable: noRole.length, speed: sp, conditionality: cd, curve: curveTable, fit: { ...fit, pred: undefined, n: units.length }, fitVanilla: fitVanilla ? { ...fitVanilla, pred: undefined, n: vanilla.length } : null, bigBodyThreshold: p90, recall }, null, 1));
console.log('pool', feats.length, 'deckable', feats.filter(deckable).length, 'no-role deckable', noRole.length, 'bigBody>=', p90);
for (const r of ROLES) console.log(r.padEnd(20), String(counts[r].all).padStart(4), 'deckable', String(counts[r].deckable).padStart(4), 'RAD', String(counts[r].rad).padStart(3), JSON.stringify(counts[r].byType), JSON.stringify(counts[r].why).slice(0, 230));
console.log('fit', JSON.stringify({ ...fit, pred: undefined }), 'n', units.length, 'vanilla', fitVanilla && JSON.stringify({ ...fitVanilla, pred: undefined }), vanilla.length);
console.log(curveTable.map((r) => `E${r.energy}: n${r.n} med${r.median} mean${r.mean} [${r.min}-${r.max}]`).join(' | '));
console.log('speed', JSON.stringify(sp)); console.log('cond', JSON.stringify(cd));
for (const [r, v] of Object.entries(recall)) console.log('recall-baseline', r, v.regexHits, v.withRole, v.missing.join(','));
// ---------- seeded samples: 10 per role for the hand check ----------
if (process.argv.includes('--sample')) {
  let seed = 20261111; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
  const pc = new Map(parsed.map((c) => [c.code, c])); let out = ''; const sampleCodes = {};
  for (const r of ROLES) { const pool = feats.filter((f) => f.roles[r]).sort((a, b) => a.code.localeCompare(b.code)); const pick = []; const a = [...pool]; while (pick.length < 10 && a.length) pick.push(a.splice(Math.floor(rnd() * a.length), 1)[0]);
    sampleCodes[r] = pick.map((f) => f.code); out += `\n===== ${r} (${pool.length}) =====\n` + pick.map((f) => `[${f.roles[r].join(',')}] ${show(pc.get(f.code)).split('\n').slice(0, 2).join(' | ').slice(0, 520)}`).join('\n') + '\n'; }
  { const a = [...noRole].sort((x, y) => x.code.localeCompare(y.code)); const pick = []; while (pick.length < 15 && a.length) pick.push(a.splice(Math.floor(rnd() * a.length), 1)[0]); sampleCodes.none = pick.map((f) => f.code); out += `\n===== NO ROLE (${noRole.length} deckable) =====\n` + pick.map((f) => show(pc.get(f.code)).split('\n').slice(0, 2).join(' | ').slice(0, 420)).join('\n') + '\n'; }
  writeFileSync(join(HERE, 'out/role-samples.txt'), out); writeFileSync(join(HERE, 'out/role-samples.json'), JSON.stringify(sampleCodes));
}
