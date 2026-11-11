// Accuracy check (a): compare the parser output with the GameLab engine scripts (hand-written "manual" scripts are the
// ground truth; "compiled" ones come from GameLab's own text compiler and are reported separately).
// Inputs: out/parsed.json (run.mjs), raw/engine-scripts.json (dump of GameLab packages/engine buildLibrary(), read-only),
//         ~/github_repositories/GameLab/data/cards/cards.json (id -> name, rulesText as of 2026-09-06).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
const HERE = dirname(fileURLToPath(import.meta.url));
const parsed = JSON.parse(readFileSync(join(HERE, 'out/parsed.json'), 'utf8'));
const scripts = JSON.parse(readFileSync(join(HERE, 'raw/engine-scripts.json'), 'utf8'));
const glCards = JSON.parse(readFileSync(join(homedir(), 'github_repositories/GameLab/data/cards/cards.json'), 'utf8'));
const gl = new Map((Array.isArray(glCards) ? glCards : glCards.cards).map((c) => [c.gameplayId, c]));
const byCode = new Map(); for (const c of parsed) for (const code of c.codes) byCode.set(code, c);
const byName = new Map(parsed.map((c) => [c.name.toLowerCase(), c]));

// ---- engine side ----
const IGNORE = new Set(['if', 'may', 'mayPay', 'mayCost', 'trigger', 'delay', 'repeatForEach', 'payAny', 'installReplacement', 'chooseOne', 'choose', 'spendBuff', 'spendBuffs', 'spendXp', 'nameSpell', 'globalMod', 'restrict', 'reveal', 'lookAtFacedown', 'grantNextSpellRepeat', 'activateConquerEffectsHere', 'swapBackBattlefield', 'trashLinkedBanished', 'toChampionZone', 'grantAbility', 'toDeck', 'replaceBattlefield', 'modifyCost']);
const OPMAP = { deal: 'deal', kill: 'kill', banish: 'banish', banishFromTrash: 'banish', stun: 'stun', buff: 'buff', grantKeyword: 'grantKeyword', grantKeywordsAndMight: 'grantKeyword', ready: 'ready', exhaust: 'exhaust', moveChoose: 'move', moveHere: 'move', moveToBase: 'move', moveTo: 'move', swapPlaces: 'move', recall: 'recall', draw: 'draw', discard: 'discard', channel: 'channel', recycle: 'recycle', add: 'add', playToken: 'createToken', eachPlayerMayPlayToken: 'createToken', returnToHand: 'returnToHand', playFree: 'play', playLinkedBanished: 'play', eachPlayerLookAtTopAndPlay: 'play', playSelfAgain: 'play', counter: 'counter', counterUnlessPay: 'counter', attach: 'attach', detach: 'detach', gainPoint: 'score', lookAtTop: 'look', revealTopRune: 'look', takeControl: 'takeControl', heal: 'heal', burn: 'burn', gainXp: 'gainXp', empower: 'empower', disempower: 'disempower', doubleMight: 'doubleMight', setMight: 'setMight', swapMight: 'setMight', fight: 'fight', extraTurn: 'extraTurn', winGame: 'win', becomeCopy: 'copy', eachPlayerChooseThenRecycle: 'recycle' };
const TRIGMAP = (t) => {
  if (!t) return null;
  if (/^play$|^equipped$/.test(t)) return 'play'; if (/attack/i.test(t) && !/enemy/i.test(t)) return 'attack'; if (/enemyUnitAttacks/.test(t)) return 'unitAttacks'; if (/defend/i.test(t)) return 'defend';
  if (/conquer/i.test(t)) return 'conquer'; if (/hold/i.test(t)) return 'hold'; if (/^die$|leaveBoard/.test(t)) return 'die'; if (/^move|unitMovesAway|youMoveUnit|opponentMovesToBattlefield/.test(t)) return 'move';
  if (/discarded|youDiscard/.test(t)) return 'discard'; if (/^youPlay|opponentPlays|unitPlayedHere/.test(t)) return 'playCard'; if (/[bB]eginning/.test(t)) return 'beginning'; if (/endOfTurn/i.test(t)) return 'end';
  if (/UnitDies|UnitsDie|youKill/.test(t)) return 'unitDies'; if (/winCombat|combatEnded|combatHere|showdown/.test(t)) return 'combat'; if (/mainPhase/.test(t)) return 'main';
  if (/[sS]core/.test(t)) return 'score'; return 'other:' + t;
};
function engineFacets(s) {
  const verbs = new Set(); const nums = new Set(); const trig = new Set(); let activated = 0; let rule = false;
  const walk = (o, key) => {
    if (Array.isArray(o)) return o.forEach((x) => walk(x, key)); if (!o || typeof o !== 'object') return;
    if (o.op) {
      let v = OPMAP[o.op];
      if (o.op === 'buffMight') v = (typeof o.n === 'number' ? o.n : 1) < 0 ? 'might-' : 'might+';
      if (o.op === 'modifyCost') v = 'costChange';
      if (o.op === 'grantKeywordsAndMight') verbs.add('might+');
      if (o.op === 'installReplacement' && o.replacement?.entersReady) verbs.add('enterReady');
      if (o.op === 'restrict' || o.op === 'globalMod') rule = true;
      if (v) { verbs.add(v); if (typeof o.n === 'number' && ['deal', 'draw', 'might+', 'might-', 'createToken', 'channel', 'discard', 'burn', 'gainXp'].includes(v)) nums.add(`${v}:${Math.abs(o.n)}`); if (v === 'score') nums.add(`score:${o.n ?? 1}`); }
      else if (!IGNORE.has(o.op)) verbs.add('?' + o.op);
    }
    for (const [k, val] of Object.entries(o)) if (k !== 'cost' && k !== 'label' && k !== 'prompt') walk(val, k);
  };
  for (const a of s.abilities || []) {
    if (a.kind === 'activated') { if (a.label === 'Equip' || /^(Equip|Empower)\b/.test(a.label || '')) continue; activated++; }
    if (a.kind === 'triggered') { const t = TRIGMAP(a.trigger || a.event); if (t) trig.add(t); }
    if (a.kind === 'passive') { if (typeof a.might === 'number') { verbs.add(a.might < 0 ? 'might-' : 'might+'); nums.add(`${a.might < 0 ? 'might-' : 'might+'}:${Math.abs(a.might)}`); } else if (a.might) verbs.add('might+'); if (a.keywords) verbs.add('grantKeyword'); if (a.dealsNoCombatDamage || a.untargetableBy) rule = true; if (a.grantAbility) rule = true; }
    if (a.kind === 'costMod') verbs.add('costChange'); if (['restriction', 'globalMod', 'triggerMod'].includes(a.kind)) rule = true;
    if (a.entersReady) verbs.add('enterReady');
    walk(a.effects, 'effects'); walk(a.modes, 'modes'); walk(a.instead, 'instead');
  }
  walk(s.spell, 'spell');
  if (s.entersReady || s.entersReadyIf) verbs.add('enterReady'); if (s.costMods) verbs.add('costChange');
  const kws = new Set((s.keywords || []).map((k) => k.name + (k.n ? ' ' + k.n : '')));
  const speed = (s.keywords || []).some((k) => k.name === 'Reaction') ? 'reaction' : (s.keywords || []).some((k) => k.name === 'Action') ? 'action' : 'normal';
  return { verbs, nums, trig, activated, kws, speed, rule, hasAddl: !!s.additionalCosts };
}
// ---- parser side ----
const VMAP = { deal: 'deal', fight: 'fight', kill: 'kill', banish: 'banish', stun: 'stun', counter: 'counter', buff: 'buff', grantKeyword: 'grantKeyword', doubleMight: 'doubleMight', setMight: 'setMight', swapMight: 'setMight', ready: 'ready', readyRune: 'ready', exhaust: 'exhaust', move: 'move', swapPlaces: 'move', recall: 'recall', draw: 'draw', tutorTop: 'look', discard: 'discard', channel: 'channel', recycle: 'recycle', recycleRune: 'recycle', burn: 'burn', look: 'look', banishTop: 'look', add: 'add', gainXp: 'gainXp', score: 'score', win: 'win', extraTurn: 'extraTurn', createToken: 'createToken', play: 'play', returnToHand: 'returnToHand', attach: 'attach', detach: 'detach', takeControl: 'takeControl', heal: 'heal', empower: 'empower', disempower: 'disempower', copy: 'copy', enterReady: 'enterReady', costChange: 'costChange' };
const RULEV = new Set(['restrict', 'ruleMod', 'untargetable', 'permission', 'playPermission', 'bonusDamage', 'triggerAgain', 'prevent', 'grantAbility', 'deckRule', 'grantTag', 'amplifyDamage']);
function parserFacets(c) {
  const verbs = new Set(); const nums = new Set(); const trig = new Set(); let activated = 0; let rule = false; let hasAddl = false;
  const fx = (e) => {
    if (!e) return; if (Array.isArray(e)) return e.forEach(fx);
    let v = VMAP[e.verb];
    if (e.verb === 'might') v = (typeof e.amount === 'number' ? e.amount < 0 : e.sign === '-') ? 'might-' : 'might+';
    if (RULEV.has(e.verb)) rule = true;
    if (v) { verbs.add(v); const n = e.verb === 'createToken' ? e.token?.count : e.amount; if (typeof n === 'number' && ['deal', 'draw', 'might+', 'might-', 'createToken', 'channel', 'discard', 'burn', 'gainXp', 'score'].includes(v)) nums.add(`${v}:${Math.abs(n)}`); }
    if (e.options) e.options.forEach(fx); if (e.granted) for (const a of e.granted) ab(a, true);
  };
  const TR = (ev) => (/when-played|when-attached/.test(ev) ? 'play' : /when-i-attack/.test(ev) ? 'attack' : /when-a-unit-attacks/.test(ev) ? 'unitAttacks' : /defend/.test(ev) ? 'defend' : /conquer/.test(ev) ? 'conquer' : /hold/.test(ev) ? 'hold' : /when-i-die|leaves-board/.test(ev) ? 'die' : /move/.test(ev) ? 'move' : /discard/.test(ev) ? 'discard' : /when-you-play|player-plays|opponent-plays/.test(ev) ? 'playCard' : /start-of-turn/.test(ev) ? 'beginning' : /end-of-turn/.test(ev) ? 'end' : /unit-dies|you-kill/.test(ev) ? 'unitDies' : /combat|showdown/.test(ev) ? 'combat' : /start-of-main/.test(ev) ? 'main' : /score/.test(ev) ? 'score' : 'other:' + ev);
  const ab = (a, nested) => {
    if (a.kind === 'activated' && !nested) activated++;
    if (a.kind === 'triggered' && a.trigger) for (const ev of a.trigger.events || [a.trigger.event]) trig.add(TR(ev));
    if (a.kind === 'static' && a.staticType === 'additional-cost') hasAddl = true;
    fx(a.effects);
  };
  for (const a of c.abilities) ab(a, false);
  const kws = new Set(c.keywords.filter((k) => !k.grantedToWearer).map((k) => k.name + (typeof k.value === 'number' ? ' ' + k.value : '')));
  return { verbs, nums, trig, activated, kws, speed: c.speed, rule, hasAddl };
}
const diff = (a, b) => ({ missing: [...a].filter((x) => !b.has(x)), extra: [...b].filter((x) => !a.has(x)) }); // a = engine, b = parser
const letters = (t) => (t || '').replace(/\([^()]*\)/g, '').replace(/\[(Any|Rainbow)\]/g, '[R]').replace(/[^A-Za-z0-9\[\]+-]/g, '').toLowerCase();

const rows = []; let unmatched = 0;
for (const [id, s] of Object.entries(scripts)) {
  const g = gl.get(id); if (!g) continue; // generated tokens
  const c = byCode.get(g.cardCode) || byName.get(g.name.toLowerCase()); if (!c) { unmatched++; continue; }
  if (c.type === 'rune') continue;
  const E = engineFacets(s); const P = parserFacets(c);
  const d = { verbs: diff(E.verbs, P.verbs), nums: diff(E.nums, P.nums), trig: diff(E.trig, P.trig), kws: diff(E.kws, P.kws) };
  const agree = { verbs: !d.verbs.missing.length && !d.verbs.extra.length, nums: !d.nums.missing.length && !d.nums.extra.length, trig: !d.trig.missing.length && !d.trig.extra.length, kws: !d.kws.missing.length && !d.kws.extra.length, activated: E.activated === P.activated, speed: E.speed === P.speed };
  rows.push({ id, code: c.code, name: c.name, type: c.type, source: s.source, parseStatus: c.parse.status, textChanged: letters(g.rulesText) !== letters(c.textUsed), agree, all: Object.values(agree).every(Boolean), d, eAct: E.activated, pAct: P.activated, eSpeed: E.speed, pSpeed: P.speed, text: c.textUsed });
}
const pct = (a, b) => (100 * a / b).toFixed(1) + '%';
const summary = (rs, label) => { const n = rs.length; const o = { n, all: rs.filter((r) => r.all).length }; for (const f of ['verbs', 'nums', 'trig', 'kws', 'activated', 'speed']) o[f] = rs.filter((r) => r.agree[f]).length; console.log(label.padEnd(26), `n=${n}`, `all-facets ${o.all} (${pct(o.all, n)})`, ['verbs', 'nums', 'trig', 'kws', 'activated', 'speed'].map((f) => `${f} ${pct(o[f], n)}`).join(' | ')); return o; };
const out = { unmatched, textChanged: rows.filter((r) => r.textChanged).length };
out.all = summary(rows, 'ALL scripted'); out.manual = summary(rows.filter((r) => r.source === 'manual'), 'manual (hand-scripted)'); out.compiled = summary(rows.filter((r) => r.source === 'compiled'), 'compiled (text compiler)'); out.vanilla = summary(rows.filter((r) => r.source === 'vanilla'), 'vanilla');
out.manualSameText = summary(rows.filter((r) => r.source === 'manual' && !r.textChanged), 'manual, text unchanged');
// disagreement classes
const classes = new Map(); const add = (k, r) => { if (!classes.has(k)) classes.set(k, []); classes.get(k).push(r); };
for (const r of rows) { for (const f of ['verbs', 'nums', 'trig', 'kws']) { for (const x of r.d[f].missing) add(`${f}: parser misses ${x.replace(/:\d+$/, ':N')}`, r); for (const x of r.d[f].extra) add(`${f}: parser adds ${x.replace(/:\d+$/, ':N')}`, r); } if (!r.agree.activated) add(`activated count differs`, r); if (!r.agree.speed) add('speed differs', r); }
const ranked = [...classes.entries()].sort((a, b) => b[1].length - a[1].length);
out.classes = ranked.map(([k, v]) => ({ class: k, n: v.length, manual: v.filter((r) => r.source === 'manual').length, cards: v.map((r) => r.code) }));
writeFileSync(join(HERE, 'out/engine-compare.json'), JSON.stringify({ ...out, rows: rows.filter((r) => !r.all) }, null, 0));
console.log('unmatched engine ids', unmatched, '| GameLab text differs from gallery text (after stripping reminders):', out.textChanged);
if (!process.argv.includes('--quiet')) for (const [k, v] of ranked.slice(0, 60)) console.log(String(v.length).padStart(4), k.padEnd(44), v.slice(0, 6).map((r) => r.code).join(','));
