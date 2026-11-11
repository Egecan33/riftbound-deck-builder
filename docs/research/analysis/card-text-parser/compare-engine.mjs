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
// One canonical event vocabulary for both sides (iteration 2: the first run counted pure naming differences as disagreements).
const CANON = (raw) => {
  const t = String(raw).toLowerCase().replace(/[^a-z]/g, '');
  const T = [[/^play$|^equipped$|whenplayed|whenattached|youattach/, 'play'], [/becomesempowered|ibecomeempowered/, 'becomesEmpowered'], [/youempower/, 'youEmpower'], [/becomesready|ibecomeready|readiedbyyou|youready/, 'ready'], [/becomesmighty/, 'mighty'], [/youstun/, 'stun'],
    [/choose|chosen|spelltargets/, 'choose'], [/youbuff/, 'buff'], [/yourecycle/, 'recycle'], [/youhide/, 'hide'], [/youdraw/, 'draw'], [/spendbuff/, 'spendBuff'], [/youbanish/, 'banish'], [/mightbecomes|mightreaches/, 'mightThreshold'], [/returnedtohand|returnstohand/, 'bounce'], [/useability|playability|usegearability/, 'useAbility'],
    [/enemyunitattacks|friendlyunitattacks|aunitattacks/, 'unitAttacks'], [/friendlyunitdefends|aunitdefends/, 'unitDefends'], [/attack/, 'attack'], [/defend/, 'defend'], [/conquer/, 'conquer'], [/hold/, 'hold'], [/^die$|leaveboard|whenidie|leavesboard/, 'die'], [/unitdies|unitsdie|youkill|geardies/, 'unitDies'],
    [/move/, 'move'], [/discard/, 'discard'], [/youplay|opponentplays|unitplayedhere|playerplays/, 'playCard'], [/beginning|startofturn/, 'beginning'], [/endofturn/, 'end'], [/wincombat|combatended|combathere|showdown|combatends|combatstarts/, 'combat'], [/mainphase|startofmain/, 'main'], [/score/, 'score']];
  for (const [re, v] of T) if (re.test(t)) return v; return 'other:' + raw;
};
const TRIGMAP = (t) => (t ? CANON(t) : null);
function engineFacets(s) {
  const verbs = new Set(); const nums = new Set(); const trig = new Set(); let activated = 0; let rule = false;
  const walk = (o, key) => {
    if (Array.isArray(o)) return o.forEach((x) => walk(x, key)); if (!o || typeof o !== 'object') return;
    if (o.op) {
      let v = OPMAP[o.op];
      if (o.op === 'buffMight') v = (typeof o.n === 'number' ? o.n : 1) < 0 ? 'might-' : 'might+';
      if (o.op === 'modifyCost') v = 'costChange';
      if (o.op === 'lookAtTop' || o.op === 'eachPlayerLookAtTopAndPlay') { if (o.take === 'hand') verbs.add('toHand'); if (o.take === 'play' || o.op !== 'lookAtTop') verbs.add('play'); if (o.rest === 'bottom') verbs.add('recycle'); if (o.rest === 'trash') verbs.add('burn'); if (o.banishBeforePlay) verbs.add('banish'); }
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
const VMAP = { toHand: 'toHand', deal: 'deal', fight: 'fight', kill: 'kill', banish: 'banish', stun: 'stun', counter: 'counter', buff: 'buff', grantKeyword: 'grantKeyword', doubleMight: 'doubleMight', setMight: 'setMight', swapMight: 'setMight', ready: 'ready', readyRune: 'ready', exhaust: 'exhaust', move: 'move', swapPlaces: 'move', recall: 'recall', draw: 'draw', tutorTop: 'toHand', discard: 'discard', channel: 'channel', recycle: 'recycle', recycleRune: 'recycle', burn: 'burn', look: 'look', banishTop: 'look', add: 'add', gainXp: 'gainXp', score: 'score', win: 'win', extraTurn: 'extraTurn', createToken: 'createToken', play: 'play', returnToHand: 'returnToHand', attach: 'attach', detach: 'detach', takeControl: 'takeControl', heal: 'heal', empower: 'empower', disempower: 'disempower', copy: 'copy', enterReady: 'enterReady', costChange: 'costChange' };
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
  const TR = (ev) => CANON(ev);
  const ab = (a, nested) => {
    if (a.kind === 'activated' && !nested) activated++;
    if (a.kind === 'triggered' && a.trigger) for (const ev of a.trigger.events || [a.trigger.event]) { if (/^would-|^other$|^when-they-do$/.test(ev)) continue; trig.add(TR(ev)); }
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
// ---- adjudication of every disagreeing row (hand-read 2026-11-11; see card-text-parser.md section 5) ----
const ADJ = {};
const put = (cls, codes) => codes.split(/[ ,]+/).filter(Boolean).forEach((c) => (ADJ[c] = cls));
put('parser-lossy', 'VEN-044 SFD-198 UNL-170 SFD-039');                                   // still silently incomplete after iteration 2
put('repr:cost-as-effect', 'OGN-110 SFD-128 SFD-163 VEN-095 VEN-101');             // "kill me to ..." = cost in the parse, an effect op in the script
put('repr:additional-cost', 'OGN-002 OGN-146 OGN-150 OGN-207 OGN-231 UNL-178 UNL-089 SFD-026 SFD-084 OGN-264 UNL-025 OGN-044');
put('repr:scaling-amount', 'OGN-028 OGN-109 OGN-038 SFD-106 OGN-230 UNL-046 UNL-157 VEN-041 OGN-201 VEN-018 OGN-138 SFD-068');
put('repr:delayed-or-granted', 'UNL-073 UNL-095 UNL-169 VEN-146 OGN-221 SFD-166 SFD-184 VEN-108 SFD-208 UNL-213 UNL-216 SFD-078 UNL-146');
put('repr:look-reveal', 'OGN-200 OGN-291 SFD-018 SFD-140 SFD-170 SFD-188 SFD-243 SFD-058 UNL-051 UNL-064 UNL-179 UNL-032 SFD-122 OGN-194 OGN-160 OGN-121');
put('repr:other', 'OGN-053 OGN-068 OGN-111 UNL-131 UNL-138 UNL-147 UNL-177 UNL-195 SFD-109 SFD-201 SFD-202 SFD-207 VEN-075 VEN-134 UNL-086 OGN-033 SFD-011 VEN-145 SFD-057 VEN-045 SFD-029');
put('engine-extra', 'OGN-027 OGN-117 UNL-023 SFD-147 OGN-077 OGN-269 OGS-020'); // incl. "recall it exhausted" scripted as heal+exhaust+recall                            // script does more than the text says (implementation detail)
put('engine-gap', 'SFD-175');
const GATEKW = /^(Legion|Level \d+|Empowered|Deathknell|Empower|Equip|Action|Reaction|Hidden)$/;
for (const r of rows) { if (r.all) continue;
  const onlyKw = r.agree.verbs && r.agree.nums && r.agree.trig && r.agree.activated && [...r.d.kws.missing, ...r.d.kws.extra].every((k) => GATEKW.test(k));
  const c = byCode.get(r.code); const hasEq = c.abilities.some((a) => a.origin === 'equipment-effect');
  r.cls = r.parseStatus !== 'full' ? 'parser-flagged' : ADJ[r.code] ? ADJ[r.code] : r.textChanged ? 'text-changed' : onlyKw ? 'repr:keyword-or-speed-level' : hasEq ? 'engine-gap:equipment-effect-text' : 'UNADJUDICATED';
}
const clsCount = (rs) => { const m = {}; for (const r of rs) if (!r.all) m[r.cls] = (m[r.cls] || 0) + 1; return Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1])); };
out.adjudication = { all: clsCount(rows), manual: clsCount(rows.filter((r) => r.source === 'manual')), compiled: clsCount(rows.filter((r) => r.source === 'compiled')) };
out.adjudicationCodes = {}; for (const r of rows) if (!r.all) (out.adjudicationCodes[r.cls] ||= []).push(r.code);
console.log('adjudication manual', JSON.stringify(out.adjudication.manual)); console.log('adjudication compiled', JSON.stringify(out.adjudication.compiled));
console.log('UNADJUDICATED', rows.filter((r) => r.cls === 'UNADJUDICATED').map((r) => r.code + '[' + r.source + ']').join(' '));
writeFileSync(join(HERE, 'out/engine-compare.json'), JSON.stringify({ ...out, rows: rows.filter((r) => !r.all) }, null, 0));
console.log('unmatched engine ids', unmatched, '| GameLab text differs from gallery text (after stripping reminders):', out.textChanged);
if (!process.argv.includes('--quiet')) for (const [k, v] of ranked.slice(0, 60)) console.log(String(v.length).padStart(4), k.padEnd(44), v.slice(0, 6).map((r) => r.code).join(','));
