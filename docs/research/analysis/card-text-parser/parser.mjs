// Deterministic card-text parser prototype for Riftbound (no AI, no network). See schema.d.ts for the output shape.
// Input: a pool row from build-pool.mjs ({ code, name, type, text, effectText, ... }).
// Every regex here was written against the card text in the official gallery snapshot of 2026-11-11.

export const DOMAINS = ['fury', 'calm', 'mind', 'body', 'chaos', 'order'];
// Keyword glossary: Core Rules 2026-10-09, rules 805-832 (rule number in comment).
export const KEYWORDS = {
  Accelerate: 805, Action: 806, Assault: 807, Deathknell: 808, Deflect: 809, Ganking: 810, Hidden: 811, Legion: 812, Reaction: 813,
  Shield: 814, Tank: 815, Temporary: 816, Vision: 817, Equip: 818, 'Quick-Draw': 819, Repeat: 820, Weaponmaster: 821, Ambush: 822,
  Hunt: 823, Level: 824, Unique: 825, Backline: 826, Empower: 827, Empowered: 828, Flow: 829, Deploy: 830, Disarm: 831, 'Show Off': 832,
};
const KW_ALT = Object.keys(KEYWORDS).join('|');
const NUMWORD = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const num = (s) => (s == null ? null : /^\d+$/.test(s) ? Number(s) : NUMWORD[s.toLowerCase()] ?? null);
const NUM = '(\\d+|a|an|one|two|three|four|five|six|seven)';

// ---------- text fixes: gallery typos and official errata, applied before parsing ----------
// Each entry: code -> { from, to, why, kind }. kind 'errata' = official errata text; 'fix' = obvious gallery data defect.
export const TEXT_FIXES = {
  'RAD-167': { from: 'choose 3 different legends', to: 'choose up to 3 different legends', kind: 'errata', why: 'Radiance Errata Updates (playriftbound.com, published 2026-10-09): "choose up to 3 different legends"; gallery shows printed text' },
  'RAD-127': { from: 'instead.disa', to: 'instead.', kind: 'fix', why: 'stray characters after the final period in gallery text' },
  'SFD-096': { from: /^Ganking/, to: '[Ganking]', kind: 'fix', why: 'keyword printed without brackets in gallery text' },
  'SFD-138': { from: /^Hidden/, to: '[Hidden]', kind: 'fix', why: 'keyword printed without brackets in gallery text' },
  'RAD-071': { from: /^Equip /, to: '[Equip] ', kind: 'fix', why: 'keyword printed without brackets in gallery text' },
  'VEN-073': { from: /^Equip /, to: '[Equip] ', kind: 'fix', why: 'keyword printed without brackets in gallery text' },
  'VEN-109': { from: 'a [1] [Might] Tentacle', to: 'a 1 [Might] Tentacle', kind: 'fix', why: 'Might value rendered as an Energy icon' },
  'RAD-048': { from: '–[Might]', to: '-[Might]', kind: 'fix', why: 'en dash for minus' },
};

// ---------- helpers ----------
const stripReminders = (t) => { let p; do { p = t; t = t.replace(/[ \t]*\([^()]*\)/g, ''); } while (t !== p); return t; };
const maskQuotes = (t) => { const q = []; return [t.replace(/"([^"]*)"/g, (m, x) => { q.push(x); return `\u0001${q.length - 1}\u0002`; }), q]; };
const unmask = (t, q) => t.replace(/\u0001(\d+)\u0002/g, (m, i) => `"${q[+i]}"`);
function splitSentences(t) {
  const [m, q] = maskQuotes(t);
  return m.split(/(?<=[.!?])\s+(?=[A-Z\[\u0001+\-])/).map((s) => unmask(s, q).trim()).filter(Boolean);
}
const worst = (a, b) => (a === 'none' && b === 'none' ? 'none' : a === 'full' && b === 'full' ? 'full' : 'partial');
const combine = (list) => (list.length === 0 ? 'full' : list.every((s) => s === 'full') ? 'full' : list.every((s) => s === 'none') ? 'none' : 'partial');

// ---------- costs ----------
export function parseResources(s) {
  // "[2][Fury][Rainbow]" -> { energy: 2, power: { fury: 1, any: 1 } }
  const c = { raw: s.trim() }; let rest = s.trim(); let m;
  while ((m = /^\[(\d+|Fury|Calm|Mind|Body|Chaos|Order|Rainbow|Exhaust)\]\s*/.exec(rest))) {
    const k = m[1];
    if (/^\d+$/.test(k)) c.energy = (c.energy || 0) + Number(k);
    else if (k === 'Exhaust') c.exhaust = true;
    else { c.power = c.power || {}; const d = k === 'Rainbow' ? 'any' : k.toLowerCase(); c.power[d] = (c.power[d] || 0) + 1; }
    rest = rest.slice(m[0].length);
  }
  return rest === '' && (c.energy != null || c.power || c.exhaust) ? c : null;
}
const COST_ATOMS = [
  [/^kill (this|me)$/i, () => ({ verb: 'killSelf' })],
  [/^banish (this|me)$/i, () => ({ verb: 'banishSelf' })],
  [/^disempower (this|me)$/i, () => ({ verb: 'disempower' })],
  [/^spend my buff$/i, () => ({ verb: 'spendBuff', amount: 1 })],
  [/^spend (\d+) XP$/i, (m) => ({ verb: 'spendXp', amount: Number(m[1]) })],
  [new RegExp(`^discard ${NUM}$`, 'i'), (m) => ({ verb: 'discard', amount: num(m[1]) })],
  [/^discard (a|an) (\w+)$/i, (m) => ({ verb: 'discard', amount: 1, of: m[2] })],
  [/^recycle (\d+)( cards?)? from your trash$/i, (m) => ({ verb: 'recycleFromTrash', amount: Number(m[1]) })],
  [/^recycle (a|an) (\w+) from your trash$/i, (m) => ({ verb: 'recycleFromTrash', amount: 1, of: m[2] })],
  [/^banish (a|an) (.+) from your trash$/i, (m) => ({ verb: 'banishFromTrash', amount: 1, of: m[2] })],
  [/^kill (a|another) friendly (unit or gear|unit|gear)$/i, (m) => ({ verb: 'killFriendly', amount: 1, of: m[2] })],
  [/^exhaust (a|an) (friendly (?:\[Mighty\] )?unit|unit you control)$/i, (m) => ({ verb: 'exhaustOther', amount: 1, of: m[2] })],
];
export function parseCost(s) {
  // comma-separated list of resource groups and action atoms. Returns null when any atom is unknown.
  const cost = { raw: s.trim() }; const parts = s.split(/,\s*/).map((x) => x.trim()).filter(Boolean);
  if (!parts.length) return null;
  for (const p of parts) {
    const r = parseResources(p);
    if (r) { if (r.energy != null) cost.energy = (cost.energy || 0) + r.energy; if (r.exhaust) cost.exhaust = true; if (r.power) { cost.power = cost.power || {}; for (const k in r.power) cost.power[k] = (cost.power[k] || 0) + r.power[k]; } continue; }
    let hit = null; for (const [re, f] of COST_ATOMS) { const m = re.exec(p); if (m) { hit = { ...f(m), raw: p }; break; } }
    if (!hit) return null;
    (cost.other = cost.other || []).push(hit);
  }
  return cost;
}

// ---------- noun phrases (targets) ----------
const STATE_WORDS = { stunned: 'stunned', buffed: 'buffed', exhausted: 'exhausted', ready: 'ready', damaged: 'damaged', attacking: 'attacking', defending: 'defending', equipped: 'equipped', token: 'token', 'non-token': 'non-token', facedown: 'facedown', '[Mighty]': 'mighty', '[Empowered]': 'empowered', detached: 'detached', attached: 'attached', unattached: 'detached', champion: 'champion' };
const HEAD = { unit: 'unit', units: 'unit', gear: 'gear', gears: 'gear', spell: 'spell', spells: 'spell', card: 'card', cards: 'card', rune: 'rune', runes: 'rune', legend: 'legend', legends: 'legend', equipment: 'equipment', battlefield: 'battlefield', battlefields: 'battlefield', token: 'token', tokens: 'token', something: 'permanent', permanent: 'permanent', ability: 'ability' };
export function parseNP(raw0) {
  let s = raw0.trim().replace(/\.$/, ''); const t = { raw: raw0.trim(), ok: true }; let m;
  // pronouns and self
  if (/^(me|myself|this|this unit|this gear|this spell|i)$/i.test(s)) return { ref: 'self', raw: t.raw, ok: true };
  if (/^(it|them|they|that unit|that card|that spell|that gear|that equipment|those units|those cards|the chosen unit|the unit|the friendly unit|the enemy unit|each|each of them|both|that enemy unit|your unit|the equipped unit|that many units you control)$/i.test(s)) return { ref: 'prev', raw: t.raw, ok: true };
  if (/^(you|an opponent|each opponent|each player|a player|that player|opponents|each other player|its controller|its owner|their owners?)$/i.test(s)) return { ref: 'player', raw: t.raw, ok: true };
  const filters = []; const states = []; const tags = [];
  // --- trailing modifiers (repeat until stable) ---
  for (let guard = 0; guard < 8; guard++) {
    const before = s;
    if ((m = /^(.*?),? (?:each )?with (\d+) \[Might\] or (less|more)$/i.exec(s))) { filters.push({ key: 'might', op: m[3] === 'less' ? '<=' : '>=', value: +m[2] }); s = m[1]; }
    else if ((m = /^(.*?) with (?:a )?total Might (?:of )?(\d+) or (less|more)$/i.exec(s))) { filters.push({ key: 'totalMight', op: m[3] === 'less' ? '<=' : '>=', value: +m[2] }); s = m[1]; }
    else if ((m = /^(.*?) with (less|more) Might than (me|it|that unit|the chosen unit)$/i.exec(s))) { filters.push({ key: 'might', op: m[2] === 'less' ? '<' : '>', value: m[3] === 'me' ? 'self' : 'ref' }); s = m[1]; }
    else if ((m = /^(.*?) with (?:Energy )?cost (?:no more than|up to) \[(\d+)\](?: and (?:with )?(?:Power cost )?no more than ((?:\[\w+\])+))?$/i.exec(s))) { filters.push({ key: 'energy', op: '<=', value: +m[2] }); if (m[3]) filters.push({ key: 'power', op: '<=', value: (m[3].match(/\[/g) || []).length }); s = m[1]; }
    else if ((m = /^(.*?) (?:with Energy cost|that costs?|costing) no more than \[(\d+)\](?: and (?:Power cost )?no more than ((?:\[\w+\])+))?$/i.exec(s))) { filters.push({ key: 'energy', op: '<=', value: +m[2] }); if (m[3]) filters.push({ key: 'power', op: '<=', value: (m[3].match(/\[/g) || []).length }); s = m[1]; }
    else if ((m = /^(.*?) (?:with Energy cost|that costs) \[(\d+)\] or (more|less)$/i.exec(s))) { filters.push({ key: 'energy', op: m[3] === 'more' ? '>=' : '<=', value: +m[2] }); s = m[1]; }
    else if ((m = /^(.*?) with Power cost ((?:\[\w+\])+) or more$/i.exec(s))) { filters.push({ key: 'power', op: '>=', value: (m[2].match(/\[/g) || []).length }); s = m[1]; }
    else if ((m = new RegExp(`^(.*?) (with|without) \\[(${KW_ALT})\\]$`, 'i').exec(s))) { filters.push({ key: 'keyword', op: m[2] === 'with' ? '=' : '!=', value: m[3] }); s = m[1]; }
    else if ((m = /^(.*?) with the same controller$/i.exec(s))) { filters.push({ key: 'controller', op: '=', value: 'same' }); s = m[1]; }
    else if ((m = /^(.*?) with (?:my|this) name$/i.exec(s))) { filters.push({ key: 'name', op: '=', value: 'self' }); s = m[1]; }
    else if ((m = /^(.*?) with the named tag$/i.exec(s))) { filters.push({ key: 'tag', op: '=', value: 'named' }); s = m[1]; }
    else if ((m = /^(.*?) (?:that's|that is|that are) (exhausted|ready|stunned|\[Empowered\]|\[Mighty\])$/i.exec(s))) { states.push(STATE_WORDS[m[2]] || m[2].toLowerCase()); s = m[1]; }
    else if ((m = /^(.*?) that moved this turn$/i.exec(s))) { states.push('moved-this-turn'); s = m[1]; }
    else if ((m = /^(.*?) (?:you control|you own)$/i.exec(s))) { t.controller = 'friendly'; s = m[1]; }
    else if ((m = /^(.*?) (?:you don't control|an opponent controls|they control)$/i.exec(s))) { t.controller = 'enemy'; s = m[1]; }
    else if ((m = /^(.*?) (?:here|at this battlefield|at my battlefield|at my location)$/i.exec(s))) { t.location = 'here'; s = m[1]; }
    else if ((m = /^(.*?) (?:there|at that battlefield|at its location|at its destination|at the same battlefield|at that location)$/i.exec(s))) { t.location = 'there'; s = m[1]; }
    else if ((m = /^(.*?) (?:at|on) (?:a|an|a single|any) (?:(occupied enemy|open|different) )?battlefields?$/i.exec(s))) { t.location = 'battlefield'; if (m[2]) states.push('bf-' + m[2].replace(/ /g, '-')); s = m[1]; }
    else if ((m = /^(.*?) (?:at|in) battlefields$/i.exec(s))) { t.location = 'battlefield'; s = m[1]; }
    else if ((m = /^(.*?) at the same (?:battlefield|location)$/i.exec(s))) { t.location = 'same-battlefield'; s = m[1]; }
    else if ((m = /^(.*?) at a different location$/i.exec(s))) { t.location = 'elsewhere'; s = m[1]; }
    else if ((m = /^(.*?) (?:in|at) (?:your|a|its|their|my) bases?$/i.exec(s))) { t.location = 'base'; s = m[1]; }
    else if ((m = /^(.*?) in bases$/i.exec(s))) { t.location = 'base'; s = m[1]; }
    else if ((m = /^(.*?) in combat$/i.exec(s))) { t.location = 'combat'; s = m[1]; }
    else if ((m = /^(.*?) in a showdown$/i.exec(s))) { t.location = 'showdown'; s = m[1]; }
    else if ((m = /^(.*?) anywhere$/i.exec(s))) { t.location = 'anywhere'; s = m[1]; }
    else if ((m = /^(.*?) on the board$/i.exec(s))) { t.location = 'board'; s = m[1]; }
    else if ((m = /^(.*?) (?:from|in) (?:your|their|a|any|its owner's|opponents') (trash|hand|trashes)$/i.exec(s))) { t.location = m[2].startsWith('trash') ? 'trash' : 'hand'; s = m[1]; }
    else if ((m = /^(.*?) from trashes$/i.exec(s))) { t.location = 'trash'; s = m[1]; }
    else if ((m = /^(.*?) from among them$/i.exec(s))) { t.location = 'looked'; s = m[1]; }
    else if ((m = /^(.*?) (?:attacking|defending) here$/i.exec(s))) { t.location = 'here'; states.push(/attacking here$/i.test(s) ? 'attacking' : 'defending'); s = m[1]; }
    if (s === before) break;
  }
  // --- leading quantifier ---
  if ((m = new RegExp(`^each of up to ${NUM} `, 'i').exec(s))) { t.count = { upTo: num(m[1]) }; s = s.slice(m[0].length); }
  else if ((m = new RegExp(`^up to ${NUM} (other )?`, 'i').exec(s))) { t.count = { upTo: num(m[1]) }; if (m[2]) t.other = true; s = s.slice(m[0].length); }
  else if ((m = /^any number of (?:your )?/i.exec(s))) { t.count = 'any-number'; if (/your/i.test(m[0])) t.controller = 'friendly'; s = s.slice(m[0].length); }
  else if ((m = /^(all|each|both)( of)?( your| the)?( other)? /i.exec(s))) { t.count = 'all'; if (m[3] && /your/.test(m[3])) t.controller = 'friendly'; if (m[4]) t.other = true; s = s.slice(m[0].length); }
  else if ((m = /^one of (your|their|them)( other)? ?/i.exec(s))) { t.count = 1; if (m[1] === 'your') t.controller = 'friendly'; if (m[2]) t.other = true; s = s.slice(m[0].length) || 'units'; }
  else if ((m = /^(your|their) (other )?/i.exec(s))) { t.count = 'all'; t.controller = m[1].toLowerCase() === 'your' ? 'friendly' : 'enemy'; if (m[2]) t.other = true; s = s.slice(m[0].length); }
  else if ((m = /^(another|a different) /i.exec(s))) { t.count = 1; t.other = true; s = s.slice(m[0].length); }
  else if ((m = /^(other|the other) /i.exec(s))) { t.count = 'all'; t.other = true; s = s.slice(m[0].length); }
  else if ((m = new RegExp(`^${NUM} (other )?`, 'i').exec(s))) { t.count = num(m[1]); if (m[2]) t.other = true; s = s.slice(m[0].length); }
  else if ((m = /^(any|the|that|those|these) /i.exec(s))) { t.count = 1; s = s.slice(m[0].length); }
  else t.count = 'all'; // bare plural: "enemy units", "friendly units"
  // --- adjectives ---
  for (let guard = 0; guard < 8; guard++) {
    if ((m = /^(friendly|enemy|other|opposing) /i.exec(s))) { const w = m[1].toLowerCase(); if (w === 'other') t.other = true; else t.controller = w === 'friendly' ? 'friendly' : 'enemy'; s = s.slice(m[0].length); continue; }
    if ((m = /^(stunned|buffed|exhausted|ready|damaged|attacking|defending|equipped|token|non-token|facedown|detached|attached|unattached|champion|\[Mighty\]|\[Empowered\]) /i.exec(s))) { states.push(STATE_WORDS[m[1]] || STATE_WORDS[m[1].toLowerCase()] || m[1].toLowerCase()); s = s.slice(m[0].length); continue; }
    if ((m = /^(Fury|Calm|Mind|Body|Chaos|Order) /.exec(s))) { tags.push('domain:' + m[1].toLowerCase()); s = s.slice(m[0].length); continue; }
    if ((m = /^(non-)?([A-Z][a-z]+(?: [A-Z][a-z]+)?) (?=units?\b|gear\b|tokens?\b|cards?\b)/.exec(s))) { tags.push((m[1] ? '!' : '') + m[2]); s = s.slice(m[0].length); continue; }
    break;
  }
  // --- head ---
  const head = s.trim().toLowerCase(); const types = [];
  const list = head.replace(/\s*(,\s*and\/or|,\s*or|,\s*and|and\/or|,)\s*/g, '|').replace(/\s+(or|and)\s+/g, '|').split('|').map((x) => x.trim()).filter(Boolean);
  let ok = list.length > 0;
  for (let h of list) {
    h = h.replace(/^(a|an) /, '');
    const hm = /^(.*?)(?: (unit|gear|card|spell|token)s?)? ?tokens?$/.exec(h);
    if (HEAD[h]) types.push(HEAD[h]);
    else if (/^(unit|gear) (cards?|tokens?)$/.test(h)) types.push(h.split(' ')[0]);
    else if (/^\[hidden\] cards?$/.test(h)) { types.push('card'); filters.push({ key: 'keyword', op: '=', value: 'Hidden' }); }
    else if (/^(mechs?|poros?|dragons?|birds?|cats?|dogs?|recruits?|sand soldiers?|bombs?|sprites?|shadow clones?|gold)$/.test(h)) { tags.push(h.replace(/s$/, '').replace(/\b\w/g, (c) => c.toUpperCase())); types.push(/bomb|gold/.test(h) ? 'gear' : 'unit'); }
    else if (hm && hm[1] && /^[a-z ]+$/.test(hm[1]) && hm[1].split(' ').length <= 2) { tags.push(hm[1]); types.push('token'); }
    else ok = false;
  }
  if (types.length) t.types = [...new Set(types)]; if (states.length) t.states = states; if (tags.length) t.tags = tags; if (filters.length) t.filters = filters;
  t.ok = ok && types.length > 0;
  if (!t.controller) t.controller = 'any';
  return t;
}

// ---------- conditions ----------
const COND = [
  [/^(?:i'm|i am|it's|it is|this is|they're) \[?(mighty|empowered)\]?$/i, (m) => ({ type: m[1].toLowerCase() })],
  [/^(?:i'm|i am|it's|it is) (buffed|stunned|exhausted|ready|equipped|attacking|defending|a unit|a gear|an equipment|a spell)$/i, (m) => ({ type: 'state', value: m[1].toLowerCase() })],
  [/^it(?:'s| is) (?:already )?(buffed|stunned|\[Empowered\])$/i, (m) => ({ type: 'state', value: m[1].toLowerCase() })],
  [/^(?:i'm|i am|it's|it is|this is) at a battlefield$/i, () => ({ type: 'at-battlefield' })],
  [/^(?:i'm|i am) (?:in combat|in a showdown)$/i, () => ({ type: 'in-combat' })],
  [/^(?:i'm|i am) (attacking|defending|attacking or defending) alone$/i, (m) => ({ type: 'alone', value: m[1] })],
  [/^(?:i'm|i am) attacking with another unit$/i, () => ({ type: 'attacking-with-other' })],
  [/^it(?:'s| is)(?: not)? your turn$/i, (m) => ({ type: 'your-turn', negate: /not/.test(m[0]) })],
  [/^it's your Beginning Phase$/i, () => ({ type: 'phase', value: 'beginning' })],
  [/^an opponent's score is within (\d+) points? of the Victory Score$/i, (m) => ({ type: 'opponent-near-win', value: +m[1] })],
  [/^your score is (not )?within (\d+) points? of the Victory Score$/i, (m) => ({ type: 'you-near-win', value: +m[2], negate: !!m[1] })],
  [/^you (?:control|have) (\d+) or (fewer|more) runes$/i, (m) => ({ type: 'rune-count', value: (m[2] === 'more' ? '>=' : '<=') + m[1] })],
  [/^you have (\d+)\+ runes$/i, (m) => ({ type: 'rune-count', value: '>=' + m[1] })],
  [/^you control fewer runes than an opponent(?: at the start of your Beginning Phase)?$/i, () => ({ type: 'rune-count', value: '<opponent' })],
  [/^you have (one|two|\d+) or fewer cards in your hand$/i, (m) => ({ type: 'hand-size', value: '<=' + num(m[1]) })],
  [/^you(?:'ve| have) discarded a card this turn$/i, () => ({ type: 'turn-event', value: 'discarded' })],
  [/^you(?:'ve| have) gained XP this turn$/i, () => ({ type: 'turn-event', value: 'gained-xp' })],
  [/^you(?:'ve| have) played a spell this turn$/i, () => ({ type: 'turn-event', value: 'played-spell' })],
  [/^you(?:'ve| have) played (?:a unit or gear|an Equipment|a card|another card) (?:to a battlefield )?this turn$/i, () => ({ type: 'turn-event', value: 'played-card' })],
  [/^you(?:'ve| have) spent (?:at least )?(\[\w+\](?:\[\w+\])*)(?: or more)?(?: to play a spell)? this turn$/i, (m) => ({ type: 'turn-event', value: 'spent ' + m[1] })],
  [/^you spent \[(\d+)\] or more$/i, (m) => ({ type: 'spent', value: '>=' + m[1] })],
  [/^(?:a|an) (friendly |enemy )?unit(?: or gear)? (?:has )?died(?: during your Beginning Phase)? this turn$/i, (m) => ({ type: 'turn-event', value: (m[1] || 'any ').trim() + '-unit-died' })],
  [/^you assigned (\d+) or more excess damage(?: to enemy units)?$/i, (m) => ({ type: 'excess-damage', value: +m[1] })],
  [/^you paid (?:the|my) additional cost$/i, () => ({ type: 'paid-additional-cost' })],
  [/^you do$/i, () => ({ type: 'if-you-do' })], [/^they do$/i, () => ({ type: 'if-they-do' })],
  [/^you showed off(?: (?:a|an) \w+)?$/i, () => ({ type: 'showed-off' })],
  [/^(?:you played (?:this|me) from face down|i was played from face down)$/i, () => ({ type: 'played-from-face-down' })],
  [/^you played this from your hand$/i, () => ({ type: 'played-from-hand' })],
  [/^you control (?:a|an|another|two or more|\d+ or more(?: other)?) (.+)$/i, (m) => ({ type: 'control', value: m[1] })],
  [/^you (?:control|have) (no other|another) units?(?: here)?$/i, (m) => ({ type: 'control', value: m[1] + ' unit' })],
  [/^an opponent controls (?:a|an) (.+)$/i, (m) => ({ type: 'opponent-controls', value: m[1] })],
  [/^there(?:'s| is| are) (.+)$/i, (m) => ({ type: 'exists', value: m[1] })],
  [/^you have (\d+)\+ units (?:here|at that battlefield)$/i, (m) => ({ type: 'unit-count-here', value: '>=' + m[1] })],
  [/^it (?:has|had) (\d+) \[Might\] or less$/i, (m) => ({ type: 'target-might', value: '<=' + m[1] })],
  [/^it(?:'s| is| was) (?:a|an) (.+)$/i, (m) => ({ type: 'target-is', value: m[1] })],
  [/^it's (attacking|\[Mighty\]|an Equipment|equipped)$/i, (m) => ({ type: 'target-is', value: m[1] })],
  [/^this kills it$/i, () => ({ type: 'kills-target' })],
  [/^i (?:died|didn't die) alone$/i, (m) => ({ type: 'died-alone', negate: /didn't/.test(m[0]) })],
  [/^i was \[Mighty\]$/i, () => ({ type: 'was-mighty' })],
  [/^i have moved twice this turn$/i, () => ({ type: 'turn-event', value: 'moved-twice' })],
  [/^you can't$/i, () => ({ type: 'if-you-cant' })],
  [/^your Rune Deck is empty$/i, () => ({ type: 'rune-deck-empty' })],
  [/^you control this battlefield$/i, () => ({ type: 'control-here' })],
  [/^you (?:or an ally )?control this battlefield$/i, () => ({ type: 'control-here' })],
  [/^an opponent controls a battlefield$/i, () => ({ type: 'opponent-controls', value: 'battlefield' })],
  [/^you have (.+)$/i, (m) => ({ type: 'you-have', value: m[1] })],
  [/^(?:a|an) (.+) is alone (?:here|there)$/i, (m) => ({ type: 'alone', value: m[1] })],
  [/^i haven't been dealt damage this turn$/i, () => ({ type: 'turn-event', value: 'undamaged' })],
  [/^i didn't conquer this turn$/i, () => ({ type: 'turn-event', value: 'no-conquer' })],
  [/^this was attached to me this turn$/i, () => ({ type: 'turn-event', value: 'attached-this-turn' })],
  [/^it has that type$/i, () => ({ type: 'guessed-type' })],
];
export function parseCondition(raw) {
  const s = raw.trim().replace(/\.$/, '');
  for (const [re, f] of COND) { const m = re.exec(s); if (m) return { ...f(m), raw: s, ok: true }; }
  return { type: 'other', raw: s, ok: false };
}

// ---------- effect clauses ----------
const dur = (s) => { let m; if ((m = /^(.*?),? this turn$/i.exec(s))) return [m[1], 'turn']; if ((m = /^this turn,? (.*)$/i.exec(s))) return [m[1], 'turn']; if ((m = /^(.*?) this combat$/i.exec(s))) return [m[1], 'combat']; return [s, undefined]; };
const kwList = (s) => { const out = []; const re = new RegExp(`\\[(${KW_ALT})(?: (\\d+))?\\]`, 'g'); let m; while ((m = re.exec(s))) out.push(m[2] ? { name: m[1], value: +m[2] } : { name: m[1] }); return out; };
const KWSEQ = `(?:\\[(?:${KW_ALT})(?: \\d+)?\\](?:,? (?:and )?)?)+`;
const WHERE = '(here|there|to your base|in your base|at your base|into your base|to their base|to a battlefield|to a single battlefield|to that same location|to base)';
const amountRef = (s) => {
  let m;
  if (/^(my|its|their|that unit's) Mights?$/i.test(s)) return { ref: /^my/i.test(s) ? 'self.might' : 'target.might' };
  if ((m = /^(my|its) \[(Assault|Shield)\]$/i.exec(s))) return { ref: (m[1].toLowerCase() === 'my' ? 'self.' : 'target.') + m[2].toLowerCase() };
  if (/^its Energy cost$/i.test(s)) return { ref: 'target.energy' };
  if (/^the damage marked on it$/i.test(s)) return { ref: 'target.damage' };
  if (/^that unit's Might$/i.test(s)) return { ref: 'target.might' };
  if (/^the number of (.+)$/i.test(s)) return { ref: 'count:' + s.replace(/^the number of /i, '') };
  if (/^(its|that spell's|that card's|the burned card's|the gear you returned'?s?) (Energy cost|Power cost|Might|cost|base cost)$/i.test(s) || /^the (Energy cost|Might) of .+$/i.test(s)) return { ref: 'target.' + (/Energy|cost/.test(s) ? 'energy' : 'might') };
  return null;
};
function tokenFrom(m, o) {
  // m: count, ready, might, name, type, kw, exhausted, where
  const t = { count: num(m.count) ?? m.count, name: m.name.trim(), type: m.type };
  if (m.might != null) t.might = +m.might; if (m.ready) t.ready = true; if (m.exhausted) t.exhausted = true;
  if (m.kw) t.keywords = kwList(m.kw).map((k) => k.name); if (m.where) t.where = m.where.replace(/^(to|in|at|into) /, '').trim();
  return { verb: 'createToken', token: t, ...o };
}
const np = (s) => parseNP(s);
const E = (verb, o = {}) => ({ verb, ...o });
// Each rule: [regex, builder(match) -> Effect | Effect[] | null]. A builder returns null to decline.
const CLAUSES = [
  // --- damage ---
  [/^deal (\d+)(?: damage)? to (.+?) and (\d+) to (.+)$/i, (m) => [E('deal', { amount: +m[1], target: np(m[2]) }), E('deal', { amount: +m[3], target: np(m[4]) })]],
  [/^deal (\d+) damage split among (?:any number of )?(.+)$/i, (m) => E('deal', { amount: +m[1], split: true, target: np(m[2]) })],
  [/^(?:it |they )?deals? damage equal to (.+?) split among (.+)$/i, (m) => E('deal', { amount: amountRef(m[1]) || 'x', split: true, target: np(m[2]) })],
  [/^deal (\d+)(?: damage)? to (.+)$/i, (m) => E('deal', { amount: +m[1], target: np(m[2]) })],
  [/^deal (\d+)$/i, (m) => E('deal', { amount: +m[1], target: { ref: 'prev', raw: '', ok: true } })],
  [/^(?:it |that unit )?deals? damage equal to (.+?) to (.+)$/i, (m) => { const a = amountRef(m[1]); return E('deal', { amount: a || 'x', target: np(m[2]), ok: !!a }); }],
  [/^deal damage to (.+?) equal to (.+)$/i, (m) => { const a = amountRef(m[2]); return E('deal', { amount: a || 'x', target: np(m[1]), ok: !!a }); }],
  [/^deal (its Energy cost) as damage to (.+)$/i, (m) => E('deal', { amount: { ref: 'discarded.energy' }, target: np(m[2]) })],
  [/^deal that much(?: damage)? to (.+)$/i, (m) => E('deal', { amount: 'x', target: np(m[1]) })],
  [/^(?:they|we) deal damage equal to (?:their|our) Mights to each other$/i, () => E('fight', { target: { ref: 'prev', raw: 'they', ok: true } })],
  // --- removal ---
  [/^kill (.+?) the next time it takes damage$/i, (m) => E('kill', { target: np(m[1]), delayed: 'next-damage' })],
  [/^kill (.+?) if it has (\d+) \[Might\] or less$/i, (m) => E('kill', { target: np(m[1]), conditions: [{ type: 'target-might', value: '<=' + m[2], raw: m[0], ok: true }] })],
  [/^kill (.+?) now$/i, (m) => E('kill', { target: np(m[1]) })],
  [/^kill (.+)$/i, (m) => E('kill', { target: np(m[1]) })],
  [/^banish (the top card of your Main Deck)$/i, () => E('banishTop', { amount: 1 })],
  [/^banish (your hand and trash)$/i, () => E('banish', { target: { ref: 'player', raw: 'your hand and trash', ok: true }, from: 'hand+trash' })],
  [/^banish (.+)$/i, (m) => E('banish', { target: np(m[1]) })],
  [/^stun (.+)$/i, (m) => E('stun', { target: np(m[1]) })],
  [/^counter (.+?) unless its controller pays (\[.+\])$/i, (m) => E('counter', { target: counterTarget(m[1]), unlessPay: parseResources(m[2]) })],
  [/^counter (.+)$/i, (m) => E('counter', { target: counterTarget(m[1]) })],
  // --- might / buffs ---
  [/^buff (.+)$/i, (m) => E('buff', { target: np(m[1]) })],
  [new RegExp(`^give (.+?) ([+-]\\d+) \\[Might\\](?: and (${KWSEQ}))?(?:, to a minimum of (\\d+) \\[Might\\])?( for each .+)?$`, 'i'), (m) => { const out = [E('might', { amount: +m[2], target: np(m[1]) })]; if (m[4]) out[0].minimum = +m[4]; if (m[5]) out[0].perEach = m[5].replace(/^ for each /, ''); if (m[3]) out.push(E('grantKeyword', { keywords: kwList(m[3]), target: np(m[1]) })); return out; }],
  [/^give (.+?) (each )?([+-]\d+) \[Might\]$/i, (m) => E('might', { amount: +m[3], target: np(m[1]) })],
  [/^give (.+?) ([+-]\d+) \[Might\] and (.+?) ([+-]\d+) \[Might\]$/i, (m) => [E('might', { amount: +m[2], target: np(m[1]) }), E('might', { amount: +m[4], target: np(m[3]) })]],
  [/^give (.+?) ([+-])\[Might\] equal to (.+)$/i, (m) => { const a = amountRef(m[3]); return E('might', { amount: a || 'x', sign: m[2], target: np(m[1]), ok: !!a }); }],
  [/^give ([+-])\[Might\] equal to (.+?) to (.+)$/i, (m) => { const a = amountRef(m[2]); return E('might', { amount: a || 'x', sign: m[1], target: np(m[3]), ok: !!a }); }],
  [/^(?:then )?an additional ([+-]\d+) \[Might\]$/i, (m) => E('might', { amount: +m[1], target: { ref: 'prev', raw: '', ok: true } })],
  [/^(.+?) (?:each )?(?:get|gets|have|has) ([+-]\d+) \[Might\]$/i, (m) => E('might', { amount: +m[2], target: np(m[1]) })],
  [/^double (.+?)'s Might$/i, (m) => E('doubleMight', { target: np(m[1]) })],
  [/^double my Might$/i, () => E('doubleMight', { target: { ref: 'self', raw: 'me', ok: true } })],
  [/^double the \[(Shield|Assault)\] of (.+)$/i, (m) => E('doubleKeyword', { keywords: [{ name: m[1] }], target: np(m[2]) })],
  [/^(?:its|their) base Might becomes (\d+)$/i, (m) => E('setMight', { amount: +m[1], target: { ref: 'prev', raw: 'its', ok: true } })],
  [/^have (.+?)'s base Might become (\d+)$/i, (m) => E('setMight', { amount: +m[2], target: np(m[1]) })],
  [/^increase (?:its|my) Might to (?:the Might of (.+)|its Might)$/i, (m) => E('setMight', { amount: { ref: 'other.might' }, target: m[1] ? np(m[1]) : { ref: 'prev', raw: 'it', ok: true } })],
  [/^swap the Mights of (.+)$/i, (m) => E('swapMight', { target: np(m[1]) })],
  [new RegExp(`^give (.+?) (${KWSEQ})( equal to .+)?$`, 'i'), (m) => E('grantKeyword', { keywords: kwList(m[2]), target: np(m[1]), ...(m[3] ? { amount: amountRef(m[3].replace(/^ equal to /, '')) || 'x' } : {}) })],
  [new RegExp(`^(?:it|they) gains? (${KWSEQ})$`, 'i'), (m) => E('grantKeyword', { keywords: kwList(m[1]), target: { ref: 'prev', raw: 'it', ok: true } })],
  [/^give (.+?) "(.+)"$/i, (m) => E('grantAbility', { target: np(m[1]), grantedText: m[2] })],
  [/^(.+?) (?:has|have) "(.+)"$/i, (m) => E('grantAbility', { target: np(m[1]), grantedText: m[2] })],
  [/^give (.+?) my keywords and \+\[Might\] equal to my Might$/i, (m) => [E('grantKeyword', { keywords: [{ name: '*self' }], target: np(m[1]) }), E('might', { amount: { ref: 'self.might' }, target: np(m[1]) })]],
  // --- ready / exhaust ---
  [new RegExp(`^ready (?:up to )?${NUM} (?:friendly )?runes?$`, 'i'), (m) => E('readyRune', { amount: num(m[1]) })],
  [/^ready your runes$/i, () => E('readyRune', { amount: 'all' })],
  [/^ready up to (\d+) units, gear, and\/or runes$/i, (m) => E('ready', { target: { count: { upTo: +m[1] }, types: ['unit', 'gear', 'rune'], controller: 'any', raw: m[0], ok: true } })],
  [/^ready something (?:else|besides me) that's exhausted$/i, () => E('ready', { target: { count: 1, other: true, types: ['permanent'], states: ['exhausted'], controller: 'friendly', raw: 'something else', ok: true } })],
  [/^ready or exhaust (.+)$/i, (m) => E('ready', { target: np(m[1]), orExhaust: true })],
  [/^ready (.+)$/i, (m) => E('ready', { target: np(m[1]) })],
  [/^exhaust (.+)$/i, (m) => E('exhaust', { target: np(m[1]) })],
  // --- movement ---
  [/^move (.+?) to (?:its|their|your|my) base$/i, (m) => E('move', { target: moveSrc(m[1]), to: 'base' })],
  [/^move (.+?) to base$/i, (m) => E('move', { target: moveSrc(m[1]), to: 'base' })],
  [/^move (.+?) to or from your base$/i, (m) => E('move', { target: np(m[1]), to: 'any' })],
  [/^move (.+?) to (?:here|this battlefield|my battlefield|that battlefield|the same battlefield|that enemy unit's battlefield|there)$/i, (m) => E('move', { target: moveSrc(m[1]), to: /here|this|my/.test(m[0].slice(m[1].length)) ? 'here' : 'there' })],
  [/^move (.+?) to (?:a|an) (open |occupied enemy |different |single )?(?:battlefield|location)(?: you control)?(?: where .+)?$/i, (m) => E('move', { target: moveSrc(m[1]), to: 'battlefield' + (m[2] ? ':' + m[2].trim() : '') })],
  [/^move (.+?) to (?:a|the) location (?:where|of) .+$/i, (m) => E('move', { target: moveSrc(m[1]), to: 'location' })],
  [/^move (.+)$/i, (m) => E('move', { target: moveSrc(m[1]), to: 'any' })],
  [/^move me to its location and it to my original location$/i, () => E('swapPlaces', { target: { ref: 'prev', raw: 'it', ok: true } })],
  [/^move each to the other's location$/i, () => E('swapPlaces', { target: { ref: 'prev', raw: 'each', ok: true } })],
  [/^recall (.+?)( exhausted)?$/i, (m) => E('recall', { target: np(m[1]) })],
  // --- cards ---
  [new RegExp(`^draw ${NUM}( for each .+)?$`, 'i'), (m) => E('draw', { amount: num(m[1]), ...(m[2] ? { perEach: m[2].replace(/^ for each /, '') } : {}) })],
  [/^draw (it|one|any you did not play this way|that card)$/i, (m) => E('draw', { amount: 1, from: 'looked' })],
  [/^put (it|\d+|one|that card) in(?:to)? your hand$/i, () => E('draw', { amount: 1, from: 'looked' })],
  [new RegExp(`^discard ${NUM}$`, 'i'), (m) => E('discard', { amount: num(m[1]) })],
  [/^discard (your|their) hands?$/i, () => E('discard', { amount: 'all' })],
  [/^discard that card$/i, () => E('discard', { amount: 1, chosen: true })],
  [new RegExp(`^channel ${NUM} runes?( exhausted)?$`, 'i'), (m) => E('channel', { amount: num(m[1]), exhausted: !!m[2] })],
  [/^recycle (\d+) from your trash$/i, (m) => E('recycle', { amount: +m[1], from: 'trash' })],
  [/^recycle up to (\d+) cards from trashes$/i, (m) => E('recycle', { amount: +m[1], from: 'trash' })],
  [/^recycle (the rest|the remaining cards|it|them|that card|that spell|the other|one or both of them)$/i, () => E('recycle', { from: 'looked' })],
  [/^recycle (me|this)$/i, () => E('recycle', { target: { ref: 'self', raw: 'me', ok: true } })],
  [/^recycle (one of your runes|all your runes|a rune)$/i, (m) => E('recycleRune', { amount: /all/.test(m[1]) ? 'all' : 1 })],
  [/^put the top (\d+|two|three) cards? of (?:your|their) Main Deck into (?:your|their) trash$/i, (m) => E('burn', { amount: num(m[1]) })],
  [/^put (?:it|the rest) in(?:to)? your trash$/i, () => E('burn', { amount: 'x', from: 'looked' })],
  [/^burn (\d+)$/i, (m) => E('burn', { amount: +m[1] })],
  [/^predict(?: (\d+))?$/i, (m) => E('look', { amount: m[1] ? +m[1] : 1, predict: true })],
  [/^predict equal to (.+)$/i, (m) => E('look', { amount: amountRef(m[1]) || 'x', predict: true })],
  [/^look at the top (\d+|two|three|card)(?: cards?)? of your Main Deck$/i, (m) => E('look', { amount: num(m[1]) ?? 1 })],
  [/^reveal the top (\d+|two|three|card)(?: cards?)? of (?:your|their|each opponent's) Main Deck$/i, (m) => E('look', { amount: num(m[1]) ?? 1, reveal: true })],
  [/^reveal the top rune of your rune deck$/i, () => E('look', { amount: 1, reveal: true, from: 'rune-deck' })],
  [/^reveal (?:their|your) hands?$/i, () => E('revealHand', {})],
  [/^(?:you may )?reveal (?:from among them )?(.+?) (?:from among them )?and draw it$/i, (m) => E('tutorTop', { target: np(m[1].replace(/ from among them$/, '')) })],
  [/^put those you don't back in any order$/i, () => E('reorderTop', {})],
  [/^put a card from your hand on the top or bottom of your Main Deck$/i, () => E('toDeck', { from: 'hand', amount: 1 })],
  [/^(?:place|put) it on the top or bottom of (?:their|your) Main Deck$/i, () => E('toDeck', { target: { ref: 'prev', raw: 'it', ok: true } })],
  // --- resources ---
  [/^add ((?:\[\w+\])+)$/i, (m) => E('add', { resources: parseResources(m[1]) })],
  [/^add (an additional )?((?:\[\w+\])+)$/i, (m) => E('add', { resources: parseResources(m[2]) })],
  [/^add that much (Energy|\[Rainbow\])$/i, (m) => E('add', { amount: 'x', resources: { raw: m[1] } })],
  [/^gain (\d+) XP( for each .+)?$/i, (m) => E('gainXp', { amount: +m[1], ...(m[2] ? { perEach: m[2].replace(/^ for each /, '') } : {}) })],
  [/^(?:you )?(?:score|gains?) (\d+) points?$/i, (m) => E('score', { amount: +m[1] })],
  [/^(?:you )?win the game$/i, () => E('win', {})],
  [/^take a turn after this one$/i, () => E('extraTurn', {})],
  // --- tokens ---
  [new RegExp(`^play (?<count>${NUM.slice(1, -1)})(?<ready> ready)? (?:(?<might>\\d+) \\[Might\\] )?(?<name>[A-Z][A-Za-z]+(?: [A-Z][a-z]+)?) (?<type>unit|gear) tokens?(?: with (?<kw>${KWSEQ}))?(?: from Bilgewater)?(?<exhausted> exhausted)?(?: ${WHERE.replace('(', '(?<where>')})?$`, 'i'), (m) => tokenFrom(m.groups, {})],
  [new RegExp(`^play (?<count>${NUM.slice(1, -1)})(?<ready> ready)? (?<name>[A-Z][A-Za-z]+) tokens?(?<exhausted> exhausted)?(?: ${WHERE.replace('(', '(?<where>')})?$`, 'i'), (m) => tokenFrom({ ...m.groups, type: /bomb|gold/i.test(m.groups.name) ? 'gear' : 'unit' }, {})],
  [/^play (four|three|two|\d+) (to your base|here)$/i, (m) => E('createToken', { token: { count: num(m[1]), name: '(same)', type: 'unit', where: m[2] } })],
  [/^play that many (\w+) tokens to (.+)$/i, (m) => E('createToken', { token: { count: 'x', name: m[1], type: 'gear', where: m[2] } })],
  // --- playing cards from zones ---
  [/^play (me|this)(?: from your trash)?(?: for ((?:\[\w+\])+))?$/i, (m) => E('play', { target: { ref: 'self', raw: m[1], ok: true }, ...(m[2] ? { cost: parseResources(m[2]) } : {}) })],
  [/^play (this|me) from your trash for ((?:\[\w+\])+)$/i, (m) => E('play', { target: { ref: 'self', raw: m[1], ok: true }, from: 'trash', cost: parseResources(m[2]) })],
  [/^play (it|that unit|that card|one|one of them|them|those cards|the banished card|that token)(?: (?:back )?to .+?| here)?(?:, (ignoring|reducing) .+)?$/i, (m) => E('play', { target: { ref: 'prev', raw: m[1], ok: true }, ...(m[2] ? (m[2] === 'ignoring' ? { free: /Energy/.test(m[0]) ? 'energy' : true } : { reduced: true }) : {}) })],
  [/^play (.+?)(?: from (?:your )?(hand|trash))?(?: to (?:your base|a battlefield you control|here|a battlefield))?(?:, (ignoring (?:its|their|my) (?:Energy )?costs?|reducing its (?:Energy )?cost by \[\d+\])| without paying its Energy cost)?$/i, (m) => { const t = np(m[1]); if (!t.ok) return null; return E('play', { target: t, from: m[2] || t.location, ...(m[3] || /without paying/.test(m[0]) ? { free: /Energy/.test(m[0]) ? 'energy' : /reducing/.test(m[0]) ? undefined : true, reduced: /reducing/.test(m[0]) || undefined } : {}) }); }],
  [/^(?:its owner )?plays? (?:it|that unit)(?: back)? to (?:the same location|any battlefield|base|the same location or to their base)(?:, ignoring its cost)?$/i, (m) => E('play', { target: { ref: 'prev', raw: 'it', ok: true }, free: /ignoring/.test(m[0]) })],
  [/^return (.+?) from (?:your )?(trash|trashes) to (?:your|their owners'|its owner's) hands?$/i, (m) => E('returnToHand', { target: { ...np(m[1]), location: 'trash' }, from: 'trash' })],
  [/^return (.+?) to (?:its|their|my) owners?'s? hands?$/i, (m) => E('returnToHand', { target: np(m[1]), from: np(m[1]).location === 'trash' ? 'trash' : 'board' })],
  [/^return (.+?) to (?:its|their) owners' hands?$/i, (m) => E('returnToHand', { target: np(m[1]), from: 'board' })],
  [/^return (.+?) to (?:your|their|hand|its owner's|a player's) hand$/i, (m) => E('returnToHand', { target: np(m[1]), from: np(m[1]).location === 'trash' ? 'trash' : 'board' })],
  // --- attach / control / misc ---
  [/^attach (.+?) to (.+)$/i, (m) => E('attach', { target: np(m[1]), to: np(m[2]).ref === 'self' ? 'self' : 'unit' })],
  [/^(?:then )?detach (.+?)(?: from (.+))?$/i, (m) => E('detach', { target: np(m[1]) })],
  [/^(?:take|gain) control of (.+)$/i, (m) => E('takeControl', { target: /spell/.test(m[1]) ? { types: ['spell'], count: 1, controller: 'any', raw: m[1], ok: true } : np(m[1]) })],
  [/^heal (.+)$/i, (m) => E('heal', { target: np(m[1]) })],
  [/^prevent (?:all|the next (\d+)) (?:spell and ability )?damage(?: that would be dealt to it)?$/i, (m) => E('prevent', { amount: m[1] ? +m[1] : 'all' })],
  [/^prevent it$/i, () => E('prevent', { amount: 'all' })],
  [/^empower (.+)$/i, (m) => E('empower', { target: np(m[1]) })],
  [/^disempower (.+)$/i, (m) => E('disempower', { target: np(m[1]) })],
  [/^spend (?:a|its|my) buff$/i, () => E('spendBuff', { amount: 1 })],
  [/^spend any number of buffs$/i, () => E('spendBuff', { amount: 'x' })],
  [/^(?:it|they) becomes? (?:a )?cop(?:y|ies) of (.+)$/i, (m) => E('copy', { target: np(m[1]) })],
  [/^make new choices for it$/i, () => E('retarget', {})],
  [/^hide ignoring costs$/i, () => E('permission', { what: 'hide-free' })],
  [/^activate the conquer effects of (.+)$/i, (m) => E('triggerAgain', { what: 'conquer', target: np(m[1]) })],
  [/^repeat this gear's play effect$/i, () => E('triggerAgain', { what: 'play' })],
  [/^name (?:a|an) (spell|tag|card)$/i, (m) => E('name', { what: m[1] })],
  [/^guess a card type$/i, () => E('name', { what: 'type' })],
  // --- targeting sentences ---
  [/^choose (.+?) and (?:an? )(.+)$/i, (m) => { const a = np(m[1]); const b = np('a ' + m[2]); return a.ok && b.ok ? [E('choose', { target: a }), E('choose', { target: b })] : null; }],
  [/^choose (an opponent|a player)$/i, (m) => E('choosePlayer', { who: m[1] })],
  [/^choose (.+)$/i, (m) => E('choose', { target: np(m[1]) })],
];
function counterTarget(s) {
  const t = { types: /ability/.test(s) ? ['spell', 'ability'] : ['spell'], count: 1, controller: /enemy/.test(s) ? 'enemy' : 'any', raw: s, ok: true }; let m; const f = [];
  let rest = s.replace(/^(a|an|that) (enemy )?spell( or ability)?/i, '').trim();
  if ((m = /^that costs no more than \[(\d+)\] and no more than ((?:\[\w+\])+)$/i.exec(rest))) { f.push({ key: 'energy', op: '<=', value: +m[1] }, { key: 'power', op: '<=', value: (m[2].match(/\[/g) || []).length }); rest = ''; }
  else if ((m = /^with Power cost ((?:\[\w+\])+) or more$/i.exec(rest))) { f.push({ key: 'power', op: '>=', value: (m[1].match(/\[/g) || []).length }); rest = ''; }
  else if ((m = /^that chooses (.+)$/i.exec(rest))) { f.push({ key: 'chooses', op: '=', value: m[1] }); rest = ''; }
  if (f.length) t.filters = f; t.ok = rest === ''; return t;
}
function moveSrc(s) { const m = /^(.+?) from (?:a battlefield|here|there|a location)$/i.exec(s); const t = np(m ? m[1] : s); if (m && t.ok && !t.location) t.location = /here/.test(s) ? 'here' : 'battlefield'; return t; }

const INLINE_COST = /^(pay ((?:\[\w+\])+)(?: and exhaust (?:me|this))?|exhaust (?:me|this)(?: and pay ((?:\[\w+\])+))?|pay ((?:\[\w+\])+) and exhaust (?:me|this)|spend (?:a|its|my) buff|(?:spend|pay) (\d+) XP|discard (\d+)(?: and exhaust me)?|kill (?:a|another) (?:friendly )?(?:unit or gear|unit|gear)(?: you control here)?|kill (?:this|me)|banish me|burn (\d+)|recycle another friendly unit|disempower something you control|kill 3 other friendly units and\/or gear|banish a card from any trash|banish a unit from your trash) to (.+)$/i;
function inlineCost(text) {
  const c = { raw: text }; let m;
  if ((m = /((?:\[\w+\])+)/.exec(text))) Object.assign(c, parseResources(m[1]) || {}, { raw: text });
  if (/exhaust (me|this)/i.test(text)) c.exhaust = true;
  const o = [];
  if (/spend (a|its|my) buff/i.test(text)) o.push({ verb: 'spendBuff', amount: 1, raw: text });
  if ((m = /(?:spend|pay) (\d+) XP/i.exec(text))) o.push({ verb: 'spendXp', amount: +m[1], raw: text });
  if ((m = /discard (\d+)/i.exec(text))) o.push({ verb: 'discard', amount: +m[1], raw: text });
  if (/^kill (a|another|3)/i.test(text)) o.push({ verb: 'killFriendly', amount: /^kill 3/.test(text) ? 3 : 1, raw: text });
  if (/^kill (this|me)/i.test(text)) o.push({ verb: 'killSelf', raw: text });
  if (/^banish me/i.test(text)) o.push({ verb: 'banishSelf', raw: text });
  if ((m = /^burn (\d+)/i.exec(text))) o.push({ verb: 'burn', amount: +m[1], raw: text });
  if (/^recycle another/i.test(text)) o.push({ verb: 'recycleFriendly', amount: 1, raw: text });
  if (/^disempower/i.test(text)) o.push({ verb: 'disempower', raw: text });
  if (/^banish a (card|unit) from/i.test(text)) o.push({ verb: 'banishFromTrash', amount: 1, raw: text });
  if (o.length) c.other = o;
  return c;
}

const ACTOR = [
  [/^each (?:other )?player (.+)$/i, 'each-player'], [/^each opponent (?:must )?(.+)$/i, 'each-opponent'], [/^(?:they|that player|an opponent) (?:must |may )?(.+)$/i, 'chosen-player'],
  [/^its controller (.+)$/i, 'controller'], [/^(?:its|their) owners? (.+)$/i, 'owner'], [/^you and that player each (.+)$/i, 'both'], [/^the defender must (.+)$/i, 'chosen-player'],
  [/^opponents (.+)$/i, 'each-opponent'], [/^you and each opponent (.+)$/i, 'each-player'],
];
const deconj = (s) => s.replace(/^(draw|discard|channel|play|kill|reveal|recycle|move|gain|score|choose|look|put|place|return|pay|burn|banish|guess|name|add)s\b/i, '$1').replace(/^(kills?|recycles?) one of their /i, 'kill a friendly ').replace(/^(choose|kill|move|reveal|discard|recycle) (\S+ )?(unit|gear|units)? ?they control/i, (m) => m.replace('they control', 'you control')).replace(/\btheir (hand|Main Deck|trash)\b/g, 'your $1');

/** Parse one clause (no period). Returns { effects, ok } */
function parseClause(s0, depth = 0) {
  let s = s0.trim().replace(/[.!]$/, '').replace(/\[(Buff|Stun|Add|ADD)\]/g, (m, w) => w.toLowerCase()).replace(/\[Predict(?: (\d+))?\]/g, (m, n) => 'predict' + (n ? ' ' + n : '')).replace(/\[Burn (\d+)\]/g, 'burn $1');
  if (!s) return { effects: [], ok: true };
  let m; const wrap = (r, f) => ({ effects: r.effects.map((e) => { f(e); return e; }), ok: r.ok });
  if (depth > 6) return { effects: [{ verb: 'unknown', raw: s, ok: false }], ok: false };
  if ((m = /^(?:then,?|and|also) (.+)$/i.exec(s))) return parseClause(m[1], depth + 1);
  if ((m = /^otherwise, (.+)$/i.exec(s))) return wrap(parseClause(m[1], depth + 1), (e) => (e.conditions = [...(e.conditions || []), { type: 'otherwise', raw: 'otherwise', ok: true }]));
  if ((m = /^if (you do|they do|you paid (?:the|my) additional cost|you showed off(?: (?:a|an) \w+)?|you can't|you couldn't channel \d+ runes this way), (.+)$/i.exec(s))) { const c = /couldn't/.test(m[1]) ? { type: 'if-you-cant', raw: m[1], ok: true } : parseCondition(m[1]); return wrap(parseClause(m[2], depth + 1), (e) => (e.conditions = [c, ...(e.conditions || [])])); }
  if ((m = /^(.+?) instead$/i.exec(s)) && !/would/.test(s)) return wrap(parseClause(m[1], depth + 1), (e) => (e.instead = true));
  if ((m = /^if ([^,]+), (.+)$/i.exec(s))) { const c = parseCondition(m[1]); const r = wrap(parseClause(m[2], depth + 1), (e) => (e.conditions = [c, ...(e.conditions || [])])); return { effects: r.effects, ok: r.ok && c.ok }; }
  if ((m = /^(?:then )?do this: (.+)$/i.exec(s))) return parseClause(m[1], depth + 1);
  if ((m = /^you may (?:then )?(?:do this: )?(.+)$/i.exec(s))) return wrap(parseClause(m[1], depth + 1), (e) => (e.optional = true));
  if ((m = /^for each (.+?), (.+)$/i.exec(s))) return wrap(parseClause(m[2], depth + 1), (e) => (e.perEach = m[1]));
  if ((m = /^at (?:the )?end of (?:this |your )?turn,? (.+)$/i.exec(s))) return wrap(parseClause(m[1], depth + 1), (e) => (e.delayed = 'end-of-turn'));
  if ((m = /^(.+?) at (?:the )?end of (?:this |the )?turn$/i.exec(s))) return wrap(parseClause(m[1], depth + 1), (e) => (e.delayed = 'end-of-turn'));
  if ((m = /^(.+?) at the start of your next Main Phase$/i.exec(s))) return wrap(parseClause(m[1], depth + 1), (e) => (e.delayed = 'next-main-phase'));
  if ((m = /^at the start of your next Main Phase, (.+)$/i.exec(s))) return wrap(parseClause(m[1], depth + 1), (e) => (e.delayed = 'next-main-phase'));
  // inline cost: "pay [X] to <effect>"
  if ((m = INLINE_COST.exec(s))) { const eff = m[m.length - 1]; const costText = s.slice(0, s.length - eff.length - 4); const c = inlineCost(costText); return wrap(parseClause(eff, depth + 1), (e) => (e.cost = c)); }
  if ((m = /^pay ((?:\[\w+\])+)$/i.exec(s))) return { effects: [{ verb: 'pay', cost: parseResources(m[1]), raw: s, ok: true }], ok: true };
  if ((m = /^pay any amount of (\[Rainbow\]|Energy|Power) to (.+)$/i.exec(s))) return wrap(parseClause(m[2], depth + 1), (e) => (e.cost = { variable: true, raw: m[1] }));
  // actor prefixes
  for (const [re, actor] of ACTOR) if ((m = re.exec(s))) { const r = parseClause(deconj(m[1]), depth + 1); if (r.ok) return wrap(r, (e) => (e.actor = actor)); }
  // duration
  let [body, duration] = dur(s);
  // trailing "if <cond>" / "unless <cond>"
  const tryRules = (text) => {
    for (const [re, f] of CLAUSES) {
      const mm = re.exec(text); if (!mm) continue;
      let out; try { out = f(mm); } catch { out = null; }
      if (!out) continue;
      const arr = Array.isArray(out) ? out : [out];
      const ok = arr.every((e) => e.ok !== false && (!e.target || e.target.ok));
      if (!ok) { tryRules.best = tryRules.best || arr; continue; }
      return arr;
    }
    return null;
  };
  tryRules.best = null;
  const finish = (arr, ok) => ({ effects: arr.map((e) => ({ ...e, ...(duration && !e.duration ? { duration } : {}), raw: e.raw || s, ok: e.ok !== false && (!e.target || e.target.ok) })), ok });
  let arr = tryRules(body);
  if (arr) return finish(arr, true);
  // "X if COND" / "X unless COND" / "X while COND"
  if ((m = /^(.+?) (if|unless|while) (.+)$/i.exec(body))) {
    const inner = parseClause(m[1], depth + 1); const c = parseCondition(m[3]); if (m[2] === 'unless') c.negate = true;
    if (inner.ok) return { effects: inner.effects.map((e) => ({ ...e, conditions: [...(e.conditions || []), c], ...(duration ? { duration } : {}) })), ok: c.ok };
  }
  // compound: "A, then B" / "A and B" / "A, B, and C"
  const seps = [/,? then /i, /, and /i, / and (?=(?:you may |then )?(?:deal|kill|banish|stun|buff|give|ready|exhaust|move|recall|draw|discard|channel|recycle|play|return|attach|detach|heal|gain|score|add|choose|reveal|look|put|empower|disempower|counter|burn|predict|its |it |they |each |spend|pay|take|double)\b)/i, /, (?=(?:exhaust|heal|recall|kill|draw|channel|put|discard) )/i];
  for (const sep of seps) {
    const parts = body.split(sep);
    if (parts.length < 2) continue;
    const rs = parts.map((p) => parseClause(p, depth + 1));
    if (rs.every((r) => r.ok)) return { effects: rs.flatMap((r) => r.effects).map((e) => ({ ...e, ...(duration && !e.duration ? { duration } : {}) })), ok: true };
    if (rs.some((r) => r.ok) && !parseClause.partial) parseClause.partial = { effects: rs.flatMap((r) => r.effects), ok: false };
  }
  const partial = parseClause.partial; parseClause.partial = null;
  if (partial && depth === 0) return partial;
  if (tryRules.best) return finish(tryRules.best, false);
  return { effects: [{ verb: 'unknown', raw: s, ok: false }], ok: false };
}

// "Choose one —" lists
function parseChoose(head, options) {
  const m = /^(?:(.*?),? )?(?:then )?(?:choose|do) (one|two)(?: of the following)?(?: (?:that hasn't been chosen|you've not chosen|you haven't already chosen)(?: this turn)?| to give me this turn| based on [^—]+)? —$/i.exec(head.trim());
  if (!m) return null;
  const opts = options.map((o) => { const t = o.replace(/^(?:\[\w+\]|Spell|Gear|Unit) — /, ''); if (new RegExp(`^${KWSEQ}$`).test(t.trim())) return { effects: [{ verb: 'grantKeyword', keywords: kwList(t), target: { ref: 'self', raw: 'me', ok: true }, raw: t, ok: true }], ok: true }; return parseEffects(t); });
  const pre = m[1] ? parseEffects(m[1] + '.') : { effects: [], status: 'full' };
  const ok = opts.every((o) => o.status === 'full' || o.ok === true) && pre.status === 'full';
  return { effects: [...pre.effects, { verb: 'chooseOne', chooseCount: num(m[2]), options: opts.map((o) => o.effects), raw: head, ok }], status: ok ? 'full' : 'partial' };
}

/** Parse a run of sentences into effects. Returns { effects, status, sentences:[{text,status}] } */
export function parseEffects(text) {
  const sentences = splitSentences(text); const effects = []; const out = [];
  for (const sent of sentences) {
    parseClause.partial = null;
    const r = parseClause(sent);
    const known = r.effects.filter((e) => e.verb !== 'unknown').length;
    const status = r.ok ? 'full' : known > 0 ? 'partial' : 'none';
    effects.push(...r.effects); out.push({ text: sent, status });
  }
  return { effects, status: combine(out.map((o) => o.status)), sentences: out };
}

// ---------- triggers ----------
const TRIG = [
  [/^you play (me|this)(?: to a battlefield)?$/i, (m) => ({ event: 'when-played', scope: 'self', ...( /battlefield/.test(m[0]) ? { qualifier: 'to-battlefield' } : {}) })],
  [/^(?:i'm|this is) played$/i, () => ({ event: 'when-played', scope: 'self' })],
  [/^you play (?:me|this) from face down(?: on your turn)?$/i, () => ({ event: 'when-played', scope: 'self', qualifier: 'from-face-down' })],
  [/^i'm played from \[Hidden\]$/i, () => ({ event: 'when-played', scope: 'self', qualifier: 'from-face-down' })],
  [/^you play or move this$/i, () => ({ event: 'when-played', events: ['when-played', 'when-i-move'], scope: 'self' })],
  [/^i attack or defend(?: one on one)?$/i, (m) => ({ event: 'when-i-attack', events: ['when-i-attack', 'when-i-defend'], scope: 'self', ...( /one on one/.test(m[0]) ? { qualifier: 'one-on-one' } : {}) })],
  [/^i attack(?: while .+)?$/i, () => ({ event: 'when-i-attack', scope: 'self' })],
  [/^i defend$/i, () => ({ event: 'when-i-defend', scope: 'self' })],
  [/^i conquer or hold$/i, () => ({ event: 'when-i-conquer', events: ['when-i-conquer', 'when-i-hold'], scope: 'self' })],
  [/^i conquer(?: after an attack| an open battlefield)?$/i, (m) => ({ event: 'when-i-conquer', scope: 'self', ...( / after| an open/.test(m[0]) ? { qualifier: m[0].replace(/^i conquer /i, '') } : {}) })],
  [/^i hold$/i, () => ({ event: 'when-i-hold', scope: 'self' })],
  [/^i score$/i, () => ({ event: 'when-i-score', scope: 'self' })],
  [/^i move(?: (to|from) a (?:battlefield|location))?(?: each turn| in a turn)?$/i, (m) => ({ event: 'when-i-move', scope: 'self', ...(m[1] ? { qualifier: m[1] + '-battlefield' } : {}) })],
  [/^i win a combat(?: each turn)?$/i, () => ({ event: 'when-i-win-combat', scope: 'self' })],
  [/^i die(?: in combat)?$/i, () => ({ event: 'when-i-die', scope: 'self' })],
  [/^i become (exhausted|ready|\[Empowered\])$/i, (m) => ({ event: 'when-i-become-' + m[1].replace(/[\[\]]/g, '').toLowerCase(), scope: 'self' })],
  [/^my Might becomes (\d+) or more$/i, () => ({ event: 'when-my-might-reaches', scope: 'self' })],
  [/^a combat that i was in ends$/i, () => ({ event: 'when-combat-ends', scope: 'self' })],
  [/^this leaves the board$/i, () => ({ event: 'when-leaves-board', scope: 'self' })],
  [/^this is played, discarded, or killed$/i, () => ({ event: 'when-played', events: ['when-played', 'when-discarded', 'when-i-die'], scope: 'self' })],
  [/^you discard me$/i, () => ({ event: 'when-discarded', scope: 'self' })],
  [/^you look at cards from the top of your deck and see me$/i, () => ({ event: 'when-seen-from-deck', scope: 'self' })],
  [/^you (?:choose|buff|ready|choose or ready) me(?: with a spell)?$/i, (m) => ({ event: 'when-you-' + (/buff/.test(m[0]) ? 'buff' : /choose/.test(m[0]) ? 'choose' : 'ready'), scope: 'self' })],
  [/^you attach an Equipment to me$/i, () => ({ event: 'when-you-attach', scope: 'self' })],
  [/^you (conquer|hold|defend|score)( or hold)?( here)?(?: with .+)?$/i, (m) => ({ event: 'when-you-' + m[1].toLowerCase(), ...(m[2] ? { events: ['when-you-conquer', 'when-you-hold'] } : {}), scope: m[3] ? 'here' : 'any' })],
  [/^you or an ally hold$/i, () => ({ event: 'when-you-hold', scope: 'any' })],
  [/^you defend at a battlefield$/i, () => ({ event: 'when-you-defend', scope: 'any' })],
  [/^you win a combat( here)?$/i, (m) => ({ event: 'when-you-win-combat', scope: m[1] ? 'here' : 'any' })],
  [/^an opponent (holds|scores|conquers)( here)?$/i, (m) => ({ event: 'when-opponent-' + m[1].replace(/s$/, ''), scope: m[2] ? 'here' : 'any' })],
  [/^you play (?:a|an|another|your (?:first|second)) (.+?)(?: (?:on an opponent's turn|during a showdown|in a turn|each turn|this turn))?$/i, (m) => { const what = m[1].toLowerCase(); const k = /spell/.test(what) ? 'spell' : /gear|equipment/.test(what) ? 'gear' : /unit/.test(what) ? 'unit' : 'card'; return { event: 'when-you-play-' + k, scope: 'any', subject: m[1], ...( /opponent's turn|showdown|from face down|from \[hidden\]|from anywhere|second|first|costs|cost|with |mighty|token|another/i.test(m[0]) ? { qualifier: m[0].replace(/^you play /i, '') } : {}) }; }],
  [/^you play (?:me or another Dragon)$/i, () => ({ event: 'when-played', events: ['when-played', 'when-you-play-unit'], scope: 'self', qualifier: 'or another Dragon' })],
  [/^you discard one or more cards$/i, () => ({ event: 'when-you-discard', scope: 'any' })],
  [/^you recycle (?:one or more cards|a rune)$/i, () => ({ event: 'when-you-recycle', scope: 'any' })],
  [/^you draw (?:your second card each turn|1 or more cards .+)$/i, () => ({ event: 'when-you-draw', scope: 'any' })],
  [/^you stun (?:an|one or more) enemy units?(?: at a battlefield)?$/i, () => ({ event: 'when-you-stun', scope: 'any' })],
  [/^you kill (?:a unit with a spell|a stunned enemy unit)$/i, () => ({ event: 'when-you-kill', scope: 'any' })],
  [/^you buff a friendly unit$/i, () => ({ event: 'when-you-buff', scope: 'any' })],
  [/^you ready a friendly unit$/i, () => ({ event: 'when-you-ready', scope: 'any' })],
  [/^you choose a friendly unit$/i, () => ({ event: 'when-you-choose', scope: 'any' })],
  [/^you spend a buff$/i, () => ({ event: 'when-you-spend-buff', scope: 'any' })],
  [/^you hide a card( here)?$/i, (m) => ({ event: 'when-you-hide', scope: m[1] ? 'here' : 'any' })],
  [/^you use an activated ability of a gear$/i, () => ({ event: 'when-you-use-ability', scope: 'any' })],
  [/^you move an enemy unit$/i, () => ({ event: 'when-you-move-unit', scope: 'any' })],
  [/^you empower something else$/i, () => ({ event: 'when-you-empower', scope: 'any' })],
  [/^you banish a card you own$/i, () => ({ event: 'when-you-banish', scope: 'any' })],
  [/^you reduce the Might of an enemy unit here by 1 or more$/i, () => ({ event: 'when-you-reduce-might', scope: 'here' })],
  [/^you exhaust three or more friendly units at the same time$/i, () => ({ event: 'when-you-exhaust', scope: 'any' })],
  [/^(?:a|another|one or more|a buffed|another non-Recruit) (?:friendly )?units? (?:you control )?(?:dies|die)(?: during your Beginning Phase)?(?: each turn)?$/i, () => ({ event: 'when-a-unit-dies', scope: 'any', subject: 'friendly' })],
  [/^a non-token unit they control dies here$/i, () => ({ event: 'when-a-unit-dies', scope: 'here', subject: 'friendly' })],
  [/^(?:an|a stunned|one or more) enemy units? (here )?(?:dies|die)(?: while I'm at a battlefield)?$/i, (m) => ({ event: 'when-a-unit-dies', scope: m[1] ? 'here' : 'any', subject: 'enemy' })],
  [/^a friendly gear at a battlefield dies$/i, () => ({ event: 'when-a-gear-dies', scope: 'any', subject: 'friendly' })],
  [/^a friendly unit attacks or defends alone$/i, () => ({ event: 'when-a-unit-attacks', events: ['when-a-unit-attacks', 'when-a-unit-defends'], scope: 'any', subject: 'friendly' })],
  [/^one or more friendly units attack here$/i, () => ({ event: 'when-a-unit-attacks', scope: 'here', subject: 'friendly' })],
  [/^an enemy unit attacks a battlefield you control$/i, () => ({ event: 'when-a-unit-attacks', scope: 'any', subject: 'enemy' })],
  [/^a friendly unit moves from my location$/i, () => ({ event: 'when-a-unit-moves', scope: 'here', subject: 'friendly' })],
  [/^a unit moves from here$/i, () => ({ event: 'when-a-unit-moves', scope: 'here', subject: 'any' })],
  [/^another friendly unit becomes exhausted$/i, () => ({ event: 'when-a-unit-becomes-exhausted', scope: 'any', subject: 'friendly' })],
  [/^(?:a unit you control|one of your units) becomes \[Mighty\]$/i, () => ({ event: 'when-a-unit-becomes-mighty', scope: 'any', subject: 'friendly' })],
  [/^a friendly unit is played this turn$/i, () => ({ event: 'when-you-play-unit', scope: 'any' })],
  [/^any unit takes damage this turn$/i, () => ({ event: 'when-a-unit-takes-damage', scope: 'any' })],
  [/^a unit here is returned to a player's hand$/i, () => ({ event: 'when-a-unit-returns-to-hand', scope: 'here' })],
  [/^an opponent (?:moves to a battlefield other than mine|plays a unit while I'm at a battlefield|plays a gear)$/i, (m) => ({ event: /moves/.test(m[0]) ? 'when-opponent-moves' : 'when-opponent-plays', scope: 'any' })],
  [/^a player plays a (spell|unit)( here)?$/i, (m) => ({ event: 'when-a-player-plays-' + m[1], scope: m[2] ? 'here' : 'any' })],
  [/^a player plays a non-token unit here each turn$/i, () => ({ event: 'when-a-player-plays-unit', scope: 'here' })],
  [/^they play a unit or gear here each turn$/i, () => ({ event: 'when-a-player-plays-unit', scope: 'here' })],
  [/^a player chooses a friendly unit here with a spell for the first time each turn$/i, () => ({ event: 'when-a-player-chooses', scope: 'here', frequency: 'first-each-turn' })],
  [/^a showdown begins here$/i, () => ({ event: 'when-showdown-begins', scope: 'here' })],
  [/^combat starts here$/i, () => ({ event: 'when-combat-starts', scope: 'here' })],
  [/^it (?:dies|wins a combat)$/i, (m) => ({ event: /dies/.test(m[0]) ? 'when-target-dies' : 'when-target-wins-combat', scope: 'any' })],
  [/^you play it$/i, () => ({ event: 'when-played', scope: 'any' })], [/^they do$/i, () => ({ event: 'when-they-do', scope: 'any' })],
  [/^you burn a unit this way$/i, () => ({ event: 'when-you-burn', scope: 'any' })],
  [/^you play a card$/i, () => ({ event: 'when-you-play-card', scope: 'any' })],
];
const PHASE = [
  [/^at (?:the )?start of your Beginning Phase$/i, { event: 'start-of-turn', scope: 'any' }],
  [/^at the start of each player's (first )?Beginning Phase$/i, { event: 'start-of-turn', scope: 'any', subject: 'each-player' }],
  [/^at the start of your Main Phase$/i, { event: 'start-of-main', scope: 'any' }],
  [/^at the end of your turn$/i, { event: 'end-of-turn', scope: 'any' }],
];
function classifyTrigger(clause) {
  // clause without the leading "When "/"The first time " etc. May contain " or when " / " and when " / " or at ".
  const parts = clause.split(/ (?:or|and) (?=when |at the start |the first time )/i).map((p) => p.replace(/^(when|the first time) /i, '').trim());
  const out = []; let ok = true;
  for (const p of parts) {
    let hit = null;
    for (const [re, v] of PHASE) if (re.test(p)) hit = { ...v };
    if (!hit) for (const [re, f] of TRIG) { const m = re.exec(p); if (m) { hit = f(m); break; } }
    if (!hit && /^you play me or i attack$/i.test(p)) hit = { event: 'when-played', events: ['when-played', 'when-i-attack'], scope: 'self' };
    if (!hit && /^i defend or i'm played from \[Hidden\]$/i.test(p)) hit = { event: 'when-i-defend', events: ['when-i-defend', 'when-played'], scope: 'self', qualifier: 'from-face-down' };
    if (!hit && /^i'm played and when i conquer$/i.test(p)) hit = { event: 'when-played', events: ['when-played', 'when-i-conquer'], scope: 'self' };
    if (!hit && /^you play me or the first time you play a non-token gear each turn$/i.test(p)) hit = { event: 'when-played', events: ['when-played', 'when-you-play-gear'], scope: 'self' };
    if (!hit) { ok = false; hit = { event: 'other' }; }
    out.push(hit);
  }
  const events = [...new Set(out.flatMap((o) => o.events || [o.event]))];
  return { ...out[0], event: events[0], ...(events.length > 1 ? { events } : {}), ok };
}
/** Split "When X, [if C,] effect" at the first comma whose left side is a recognised trigger clause. */
function splitTrigger(line) {
  const m = /^(Once each turn, )?(?:(While [^,]+), )?(For each player, )?(When|At|The (first|second|third) time|The next time|The next (\w+) times)\b(.*)$/i.exec(line);
  if (!m) return null;
  const lead = m[4]; const rest = m[7]; const frequency = m[1] ? 'once-each-turn' : m[5] ? m[5].toLowerCase() + '-each-turn' : /next time/i.test(lead) ? 'next' : m[6] ? 'next-n' : undefined;
  const full = (/^at$/i.test(lead) ? 'At' : '') + rest; // phase triggers keep "At"
  const body = /^at$/i.test(lead) ? ('at' + rest) : rest.trim();
  // candidate comma positions
  const idxs = []; for (let i = 0; i < body.length; i++) if (body[i] === ',' && body[i + 1] === ' ') idxs.push(i);
  let fallback = null;
  for (const i of idxs) {
    const left = body.slice(0, i).trim(); const right = body.slice(i + 2).trim();
    const tr = classifyTrigger(left.replace(/^each turn /i, ''));
    if (tr.ok) return { trigger: { ...tr, ...(frequency && !tr.frequency ? { frequency } : {}), raw: `${lead} ${left}`.trim() }, rest: right, pre: m[2], forEach: !!m[3] };
    if (!fallback) fallback = { trigger: { event: 'other', ok: false, ...(frequency ? { frequency } : {}), raw: `${lead} ${left}`.trim() }, rest: right, pre: m[2], forEach: !!m[3] };
  }
  return fallback;
}

// ---------- static lines ----------
const SUBJ = '(I|This|Me|Other friendly units|Friendly units|Units|Your units|Your other units|Enemy units|Stunned enemy units|Other buffed friendly units|Friendly buffed units|Your Mechs|Your token units|Your gear|Your tokens|Champion units|Your Equipment|Friendly legends|Other units|Sand Soldiers you play|Each Equipment in your hand|Your gear with \\[Deploy\\]|Your spells|Bird, Cat, Dog, Poro, and Ivern units|Your units that are \\[Empowered\\]|They|It|Units you play this turn|Units you play to battlefields you control|Friendly units played from anywhere other than a player\'s hand)';
function subjectTarget(s) {
  if (/^(I|Me|This)$/i.test(s)) return { ref: 'self', raw: s, ok: true };
  if (/^(They|It)$/i.test(s)) return { ref: 'prev', raw: s, ok: true };
  const t = parseNP(s.replace(/^Your (other )?/i, 'your $1').replace(/ each$/i, '').replace(/ you play( this turn| to battlefields you control)?$/i, ' you control').replace(/ played from anywhere other than a player's hand$/i, ''));
  return t;
}
const STATIC = [
  // might modifiers
  [new RegExp(`^${SUBJ}( each)?( here| there| at my battlefield| with \\[\\w+\\])?(?: here)? (?:have|has|get|gets) (?:an additional )?([+-]\\d+) \\[Might\\](?: and (${KWSEQ}))?( here)?(, to a minimum of \\d+ \\[Might\\])?( for each .+)?$`, 'i'), (m) => { const t = subjectTarget(m[1] + (m[3] && /with/.test(m[3]) ? m[3] : '')); if (m[3] && !/with/.test(m[3]) || m[6]) t.location = 'here'; const fx = [{ verb: 'might', amount: +m[4], target: t, ...(m[8] ? { perEach: m[8].replace(/^ for each /, '') } : {}), ok: t.ok }]; if (m[5]) fx.push({ verb: 'grantKeyword', keywords: kwList(m[5]), target: t, ok: t.ok }); return { staticType: 'might-mod', effects: fx }; }],
  [/^My Might is increased by (.+)$/i, (m) => ({ staticType: 'might-mod', effects: [{ verb: 'might', amount: { ref: 'count:' + m[1] }, target: { ref: 'self', raw: 'me', ok: true }, ok: true }] })],
  [/^I (?:get|have) \+1 \[Might\] for each (.+)$/i, (m) => ({ staticType: 'might-mod', effects: [{ verb: 'might', amount: 1, perEach: m[1], target: { ref: 'self', raw: 'me', ok: true }, ok: true }] })],
  [new RegExp(`^${SUBJ}( each)?( here| there| at my battlefield| with \\[\\w+\\])? (?:have|has|give) (${KWSEQ})( here)?( equal to .+)?( if they didn't already)?$`, 'i'), (m) => { const t = subjectTarget(m[1] + (m[3] && /with/.test(m[3]) ? m[3] : '')); if ((m[3] && !/with/.test(m[3])) || m[5]) t.location = 'here'; return { staticType: 'keyword-grant', effects: [{ verb: 'grantKeyword', keywords: kwList(m[4]), target: t, ...(m[6] ? { amount: amountRef(m[6].replace(/^ equal to /, '')) || 'x' } : {}), ok: t.ok }] }; }],
  [new RegExp(`^${SUBJ}( here)? (?:have|has) "(.+)"$`, 'i'), (m) => { const t = subjectTarget(m[1]); if (m[2]) t.location = 'here'; return { staticType: 'ability-grant', effects: [{ verb: 'grantAbility', grantedText: m[3], target: t, ok: t.ok }] }; }],
  // enter ready / exhausted
  [/^(?:I|This) enters? ready$/i, () => ({ staticType: 'enter-ready', effects: [{ verb: 'enterReady', target: { ref: 'self', raw: 'I', ok: true }, ok: true }] })],
  [/^(?:I|This) enters? exhausted$/i, () => ({ staticType: 'enter-exhausted', effects: [{ verb: 'enterExhausted', target: { ref: 'self', raw: 'I', ok: true }, ok: true }] })],
  [new RegExp(`^${SUBJ} enter ready( this turn)?$`, 'i'), (m) => { const t = subjectTarget(m[1]); return { staticType: 'enter-ready', effects: [{ verb: 'enterReady', target: t, ok: t.ok, ...(m[2] ? { duration: 'turn' } : {}) }] }; }],
  [/^You may have me enter ready$/i, () => ({ staticType: 'enter-ready', effects: [{ verb: 'enterReady', target: { ref: 'self', raw: 'I', ok: true }, optional: true, ok: true }] })],
  [/^I have \+(\d+) \[Might\] and enter ready$/i, (m) => ({ staticType: 'might-mod', effects: [{ verb: 'might', amount: +m[1], target: { ref: 'self', raw: 'I', ok: true }, ok: true }, { verb: 'enterReady', target: { ref: 'self', raw: 'I', ok: true }, ok: true }] })],
  // cost modifiers
  [/^(?:I|This) costs? ((?:\[\w+\])+) less(?: instead)?(?: to play)?( for each .+| if .+| to play from anywhere other than your hand)?(?:, to a minimum of \[\d+\])?$/i, (m) => ({ staticType: 'cost-mod', effects: [{ verb: 'costChange', amount: parseResources(m[1]), sign: '-', target: { ref: 'self', raw: 'I', ok: true }, ...(m[2] ? (/^ for each/.test(m[2]) ? { perEach: m[2].replace(/^ for each /, '') } : /^ if/.test(m[2]) ? { conditions: [parseCondition(m[2].replace(/^ if /, ''))] } : { conditions: [{ type: 'played-from-not-hand', raw: m[2].trim(), ok: true }] }) : {}), ok: true }] })],
  [/^(?:I|This) costs? ((?:\[\w+\])+) less and enter ready$/i, (m) => ({ staticType: 'cost-mod', effects: [{ verb: 'costChange', amount: parseResources(m[1]), sign: '-', target: { ref: 'self', raw: 'I', ok: true }, ok: true }, { verb: 'enterReady', target: { ref: 'self', raw: 'I', ok: true }, ok: true }] })],
  [/^Reduce my cost by ((?:\[\w+\])+)( for each .+)?$/i, (m) => ({ staticType: 'cost-mod', effects: [{ verb: 'costChange', amount: parseResources(m[1]), sign: '-', target: { ref: 'self', raw: 'I', ok: true }, ...(m[2] ? { perEach: m[2].replace(/^ for each /, '') } : {}), ok: true }] })],
  [/^This (?:spell's|ability's) Energy cost is reduced by (.+)$/i, (m) => ({ staticType: 'cost-mod', effects: [{ verb: 'costChange', amount: { ref: m[1] }, sign: '-', target: { ref: 'self', raw: 'this', ok: true }, ok: true }] })],
  [/^This ability costs ((?:\[\w+\])+) less (for each|if) (.+)$/i, (m) => ({ staticType: 'cost-mod', effects: [{ verb: 'costChange', amount: parseResources(m[1]), sign: '-', target: { ref: 'self', raw: 'this ability', ok: true }, ...(m[2] === 'if' ? { conditions: [parseCondition(m[3])] } : { perEach: m[3] }), ok: true }] })],
  [/^(.+?) (?:cost|costs|is reduced by|are reduced by) ((?:\[\w+\])+(?: or \[\w+\])?)( less| more)?(?: to play)?( this turn)?(?:,? to a minimum of \[\d+\])?( instead)?$/i, (m) => ({ staticType: 'cost-mod', effects: [{ verb: 'costChange', amount: parseResources(m[2].replace(/ or .*/, '')), sign: m[3] && /more/.test(m[3]) ? '+' : '-', target: { raw: m[1], ok: true, types: [/spell/i.test(m[1]) ? 'spell' : /gear/i.test(m[1]) ? 'gear' : /unit|Dragons|Mechs/i.test(m[1]) ? 'unit' : 'card'], controller: /opponent|enemy/i.test(m[1]) ? 'enemy' : 'friendly' }, ok: true }] })],
  // play permissions / restrictions
  [/^(?:You may play me|I can be played|Play me only) to (.+)$/i, (m) => ({ staticType: 'play-permission', effects: [{ verb: 'playPermission', where: m[1], only: /^Play me only/i.test(m[0]), target: { ref: 'self', raw: 'me', ok: true }, ok: true }] })],
  [/^Friendly units (?:may|can) be played to (.+)$/i, (m) => ({ staticType: 'play-permission', effects: [{ verb: 'playPermission', where: m[1], target: { types: ['unit'], controller: 'friendly', count: 'all', raw: 'friendly units', ok: true }, ok: true }] })],
  [/^You may (?:hide an additional card here|play cards from your trash)$/i, (m) => ({ staticType: 'play-permission', effects: [{ verb: 'permission', what: /hide/.test(m[0]) ? 'extra-hidden' : 'play-from-trash', ok: true }] })],
  [/^(?:I|It|This) can't be chosen by enemy spells and abilities( unless .+)?$/i, (m) => ({ staticType: 'protection', effects: [{ verb: 'untargetable', target: { ref: /^It/i.test(m[0]) ? 'prev' : 'self', raw: 'I', ok: true }, ...(m[1] ? { conditions: [{ ...parseCondition(m[1].replace(/^ unless /, '')), negate: true }] } : {}), ok: true }] })],
  [/^(.+?) can't be chosen by enemy spells and abilities$/i, (m) => { const t = parseNP(m[1]); return { staticType: 'protection', effects: [{ verb: 'untargetable', target: t, ok: t.ok }] }; }],
  [/^(?:I|This spell|This) can't be (countered|readied|moved by enemy spells and abilities)$/i, (m) => ({ staticType: /countered|moved/.test(m[1]) ? 'protection' : 'restriction', effects: [{ verb: 'restrict', what: "can't be " + m[1], target: { ref: 'self', raw: 'I', ok: true }, ok: true }] })],
  [/^Your spells and abilities can't be countered$/i, () => ({ staticType: 'protection', effects: [{ verb: 'restrict', what: "can't be countered", target: { types: ['spell', 'ability'], controller: 'friendly', count: 'all', raw: 'your spells and abilities', ok: true }, ok: true }] })],
  [/^(I|It|Units|Opponents|Players|.+?) (can't|can only|must|don't|doesn't|only) (.+)$/i, (m) => ({ staticType: /don't deal combat damage|doesn't deal/.test(m[0]) ? 'drawback' : /^I (can't|must)/.test(m[0]) ? 'self-restriction' : 'restriction', effects: [{ verb: 'restrict', what: `${m[2]} ${m[3]}`, target: /^(I|It)$/i.test(m[1]) ? { ref: /^I$/i.test(m[1]) ? 'self' : 'prev', raw: m[1], ok: true } : { raw: m[1], ok: true, controller: /^(Opponents|Enemy)/i.test(m[1]) ? 'enemy' : 'any' }, ok: true }] })],
  [/^(?:Your|Friendly) (?:spells and abilities|spells) deal (\d+) Bonus Damage$/i, (m) => ({ staticType: 'bonus-damage', effects: [{ verb: 'bonusDamage', amount: +m[1], ok: true }] })],
  [/^(?:Abilities of friendly gear|Spells and abilities affecting units here each) deal (\d+) Bonus Damage$/i, (m) => ({ staticType: 'bonus-damage', effects: [{ verb: 'bonusDamage', amount: +m[1], ok: true }] })],
  [/^The next spell you play this turn deals (\d+) Bonus Damage$/i, (m) => ({ staticType: 'bonus-damage', effects: [{ verb: 'bonusDamage', amount: +m[1], duration: 'turn', ok: true }] })],
  [/^This deals (\d+)(?: additional)? Bonus Damage for each (.+)$/i, (m) => ({ staticType: 'bonus-damage', effects: [{ verb: 'bonusDamage', amount: +m[1], perEach: m[2], ok: true }] })],
  [/^(?:Your|Friendly) (\[Deathknell\]|conquer|hold) effects(?: for (?:conquering|holding) here)?(?: here)? trigger an additional time$/i, (m) => ({ staticType: 'trigger-mod', effects: [{ verb: 'triggerAgain', what: m[1].replace(/[\[\]]/g, '').toLowerCase(), ok: true }] })],
  [/^My hold effects are also conquer effects, and vice versa$/i, () => ({ staticType: 'trigger-mod', effects: [{ verb: 'triggerAgain', what: 'hold<->conquer', ok: true }] })],
  [/^Your \[Temporary\] effects at my battlefield don't trigger$/i, () => ({ staticType: 'trigger-mod', effects: [{ verb: 'restrict', what: 'temporary-suppressed', ok: true }] })],
  [/^I can have any number of buffs$/i, () => ({ staticType: 'rule-mod', effects: [{ verb: 'ruleMod', what: 'buff-limit', ok: true }] })],
  [/^I can be \[Empowered\] up to three times$/i, () => ({ staticType: 'rule-mod', effects: [{ verb: 'ruleMod', what: 'empower-limit', ok: true }] })],
  [/^I am a (\w+)$/i, (m) => ({ staticType: 'tag-grant', effects: [{ verb: 'grantTag', tag: m[1], ok: true }] })],
  [/^Increase the points needed to win the game by (\d+)$/i, (m) => ({ staticType: 'rule-mod', effects: [{ verb: 'ruleMod', what: 'victory-score', amount: +m[1], ok: true }] })],
  [/^Your deck can have any number of cards named (.+)$/i, (m) => ({ staticType: 'deckbuilding', effects: [{ verb: 'deckRule', what: 'unlimited-copies', ok: true }] })],
  [/^If Neeko is in your deck, choose up to 3 different legends in addition to your starting legend$/i, () => ({ staticType: 'deckbuilding', effects: [{ verb: 'deckRule', what: 'extra-legends', amount: 3, ok: true }] })],
  [/^Buffs give an additional \+(\d+) \[Might\] to friendly units$/i, (m) => ({ staticType: 'might-mod', effects: [{ verb: 'might', amount: +m[1], target: { types: ['unit'], controller: 'friendly', states: ['buffed'], count: 'all', raw: 'buffed friendly units', ok: true }, ok: true }] })],
  [/^Each Equipment attached to me gives double its base Might bonus$/i, () => ({ staticType: 'might-mod', effects: [{ verb: 'might', amount: { ref: 'equipment.bonus' }, target: { ref: 'self', raw: 'me', ok: true }, ok: true }] })],
  [/^Any amount of your damage is enough to kill enemy units$/i, () => ({ staticType: 'rule-mod', effects: [{ verb: 'ruleMod', what: 'deathtouch', ok: true }] })],
  [/^You ignore \[Tank\] while assigning combat damage here$/i, () => ({ staticType: 'rule-mod', effects: [{ verb: 'ruleMod', what: 'ignore-tank', ok: true }] })],
  [/^(?:Players ignore|Ignore) \[Deflect\] while paying (.+)$/i, () => ({ staticType: 'rule-mod', effects: [{ verb: 'ruleMod', what: 'ignore-deflect', ok: true }] })],
  [/^Skip your Draw Phase$/i, () => ({ staticType: 'drawback', effects: [{ verb: 'ruleMod', what: 'skip-draw', ok: true }] })],
  [/^Units can move here from anywhere$/i, () => ({ staticType: 'rule-mod', effects: [{ verb: 'ruleMod', what: 'move-from-anywhere', ok: true }] })],
  [/^You can look at their facedown cards$/i, () => ({ staticType: 'rule-mod', effects: [{ verb: 'ruleMod', what: 'peek-facedown', ok: true }] })],
  [/^I have all \[Exhaust\] abilities of all friendly legends, units, and gear$/i, () => ({ staticType: 'ability-grant', effects: [{ verb: 'copy', what: 'exhaust-abilities', ok: true }] })],
];
const ADDL = [
  [/^As you play (?:me|this), you may (.+?) as an additional cost$/i, 1, true], [/^You may (.+?) as an additional cost to play (?:me|this)$/i, 1, true],
  [/^As an additional cost to play (?:me|this), you may (.+)$/i, 1, true], [/^As an additional cost to play (?:me|this), (.+)$/i, 1, false],
  [/^If you've played a spell this turn, you may (.+?) as an additional cost to play me$/i, 1, true],
];
function parseAdditionalCost(sent) {
  const s = sent.replace(/\.$/, '');
  for (const [re, g, optional] of ADDL) {
    const m = re.exec(s); if (!m) continue;
    let ct = m[g].trim(); let cost = null; let mm;
    if ((mm = /^pay ((?:\[\w+\])+)$/i.exec(ct))) cost = parseResources(mm[1]);
    else if ((mm = /^pay any amount of Power$/i.exec(ct))) cost = { variable: true, raw: ct };
    else { const ic = inlineCost(ct); if (ic.other || ic.exhaust) cost = ic; else if ((mm = /^(discard a card|exhaust a friendly unit|exhaust your legend|return a friendly (?:unit|gear) to its owner's hand|kill a (?:Bird, Cat, Dog, or Poro you control|friendly \[Mighty\] unit|friendly unit)|kill any number of friendly units|spend any number of buffs|spend a buff)$/i.exec(ct))) cost = { raw: ct, other: [{ verb: /^discard/i.test(ct) ? 'discard' : /^exhaust/i.test(ct) ? 'exhaustOther' : /^return/i.test(ct) ? 'returnToHand' : /^kill/i.test(ct) ? 'killFriendly' : 'spendBuff', amount: /any number/.test(ct) ? 'x' : 1, raw: ct }] }; }
    return { optional, cost: cost || { raw: ct }, ok: !!cost };
  }
  return null;
}

// ---------- line level ----------
function mkAbility(kind, o) { return { kind, speed: 'normal', conditions: [], effects: [], origin: 'rules', ...o }; }
const usageRe = /^(Use (?:this ability )?only .+|Use my abilities only .+|Each player may use this ability once on their turn|Spend this (?:Energy|Power) only .+)$/i;

/** Parse one line (already stripped of reminder text). Returns { abilities, sentences } */
function parseLine(line0, card, origin, options) {
  let line = line0.trim(); const gates = []; let speed = 'normal'; let m; let deathknell = false;
  const sentences = []; const abilities = [];
  const done = (ab, status, text = line0) => { ab.origin = origin; ab.text = text; ab.status = status; ab.conditions = [...gates, ...ab.conditions]; if (speed !== 'normal' && ab.speed === 'normal') ab.speed = speed; abilities.push(ab); };
  // gates and prefixes
  for (let guard = 0; guard < 6; guard++) {
    if ((m = /^\[Level (\d+)\]\[>\]\s*(?:\[>>\])?\s*/.exec(line))) { gates.push({ type: 'level', value: +m[1], raw: m[0].trim(), ok: true }); line = line.slice(m[0].length); continue; }
    if ((m = /^\[Empowered\]\[>\]\s*(?:\[>>\])?\s*/.exec(line))) { gates.push({ type: 'empowered', raw: '[Empowered]', ok: true }); line = line.slice(m[0].length); continue; }
    if ((m = /^\[Legion\](?:\[>\]| —)\s*/.exec(line))) { gates.push({ type: 'legion', raw: '[Legion]', ok: true }); line = line.slice(m[0].length); continue; }
    if ((m = /^\[Deathknell\](?:\[>\]| —)\s*/.exec(line))) { deathknell = true; line = line.slice(m[0].length); continue; }
    if ((m = /^\[(Action|Reaction)\]\[>\]\s*/.exec(line))) { speed = m[1].toLowerCase(); line = line.slice(m[0].length); continue; }
    break;
  }
  const kwLine = new RegExp(`^(?:\\[(?:${KW_ALT})(?: \\d+)?\\]\\.?(?:,? (?:and )?)?)+$`);
  // pure keyword line
  if (!deathknell && kwLine.test(line) && !/^\[(Equip|Empower|Repeat|Flow|Show Off)\]$/.test(line)) {
    for (const k of kwList(line)) done(mkAbility('keyword', { keyword: k }), 'full');
    sentences.push({ text: line0, status: 'full' }); return { abilities, sentences };
  }
  // keywords with parameters
  if ((m = /^\[(Equip|Empower|Repeat|Flow)\](?: —)?\s+(.+?)(?:\. (This ability.+))?\.?$/.exec(line))) {
    let costText = m[2].trim(); let cost = parseCost(costText); let ok = !!cost;
    if (!cost) { // alternatives: "[1] or [Body]", "[Rainbow] or exhaust a friendly unit", "[1] / [Rainbow] / [1][Rainbow]", "Discard 1", "Spend 1 XP", "Kill a friendly unit", "Discard a spell"
      const alts = costText.split(/ or | \/ /).map((x) => parseCost(x.replace(/^(\w)/, (c) => c.toUpperCase())) || (/^(discard|kill|exhaust|spend|recycle) /i.test(x) ? { raw: x, other: [{ verb: x.split(' ')[0].toLowerCase(), raw: x }] } : null));
      if (alts.every(Boolean)) { cost = { raw: costText, alternatives: alts }; ok = true; } else cost = { raw: costText };
    }
    const ab = mkAbility('keyword', { keyword: { name: m[1] }, cost });
    if (m[3]) { const st = parseStatic(m[3]); if (st) ab.effects = st.effects; else ok = false; }
    done(ab, ok ? 'full' : 'partial'); sentences.push({ text: line0, status: ok ? 'full' : 'partial' }); return { abilities, sentences };
  }
  if ((m = /^\[Show Off\] (.+?)\.?$/.exec(line))) { const t = parseNP(m[1]); done(mkAbility('keyword', { keyword: { name: 'Show Off' }, effects: [{ verb: 'showOff', target: t, optional: true, raw: line, ok: t.ok }] }), t.ok ? 'full' : 'partial'); sentences.push({ text: line0, status: t.ok ? 'full' : 'partial' }); return { abilities, sentences }; }
  if ((m = new RegExp(`^\\[(Assault|Shield)\\] equal to (.+?)\\.?$`).exec(line))) { done(mkAbility('keyword', { keyword: { name: m[1], value: 'x' } }), 'full'); sentences.push({ text: line0, status: 'full' }); return { abilities, sentences }; }

  // choose-one block
  if (options && options.length) {
    let head = line; let pre = null; let costPart = null; let trig = null;
    const act = splitActivated(head); if (act) { costPart = act.cost; head = act.rest; if (act.speed) speed = act.speed; }
    else { const st = splitTrigger(head); if (st) { trig = st.trigger; head = st.rest; } }
    const ch = parseChoose(head, options);
    if (ch) {
      const kind = deathknell || trig ? 'triggered' : costPart ? 'activated' : card.type === 'spell' ? 'on-play' : 'static';
      done(mkAbility(kind, { ...(deathknell ? { trigger: { event: 'when-i-die', scope: 'self', raw: '[Deathknell]', ok: true } } : trig ? { trigger: trig } : {}), ...(costPart ? { cost: costPart } : {}), effects: ch.effects }), trig && !trig.ok ? 'partial' : ch.status);
      sentences.push({ text: line0 + ' ' + options.map((o) => '- ' + o).join(' '), status: trig && !trig.ok ? 'partial' : ch.status }); return { abilities, sentences };
    }
  }

  // sentence loop: an ability line can hold several sentences; usage limits attach to the ability
  const sents = splitSentences(line); let current = null; let i = 0;
  const pushEffects = (ab, text, sentText) => { const r = parseEffects(text); ab.effects.push(...r.effects); for (const s of r.sentences) sentences.push({ text: s.text, status: s.status }); return r.status; };
  // 1) activated ability:  cost: effect
  const act = splitActivated(line);
  if (act && !deathknell) {
    const ab = mkAbility('activated', { cost: act.cost, speed: act.speed || speed });
    if (act.legion) ab.conditions.push({ type: 'legion', raw: '[Legion]', ok: true });
    const rest = splitSentences(act.rest); const statuses = [];
    for (const s of rest) {
      if (usageRe.test(s.replace(/\.$/, ''))) { ab.conditions.push({ type: 'usage-limit', raw: s, ok: true }); sentences.push({ text: s, status: 'full' }); statuses.push('full'); continue; }
      const st = parseStatic(s.replace(/\.$/, ''));
      if (st && /cost-mod/.test(st.staticType)) { ab.effects.push(...st.effects); sentences.push({ text: s, status: 'full' }); statuses.push('full'); continue; }
      statuses.push(pushEffects(ab, s));
    }
    done(ab, combine(statuses)); return { abilities, sentences };
  }
  // 2) deathknell
  if (deathknell) {
    const ab = mkAbility('triggered', { trigger: { event: 'when-i-die', scope: 'self', raw: '[Deathknell]', ok: true } });
    let text = line; if ((m = /^If ([^,]+), (.+)$/i.exec(text))) { const c = parseCondition(m[1]); if (c.ok) { ab.conditions.push(c); text = m[2]; } }
    const status = pushEffects(ab, text); done(ab, status); return { abilities, sentences };
  }
  // 3) line by sentences
  for (i = 0; i < sents.length; i++) {
    const sent = sents[i]; const bare = sent.replace(/\.$/, '');
    if (usageRe.test(bare)) { if (current) current.conditions.push({ type: 'usage-limit', raw: sent, ok: true }); else done(mkAbility('static', { staticType: 'usage-limit', conditions: [{ type: 'usage-limit', raw: sent, ok: true }] }), 'full', sent); sentences.push({ text: sent, status: 'full' }); continue; }
    // additional cost (+ following "If you do, ..." sentence)
    const ac = parseAdditionalCost(sent);
    if (ac) {
      const ab = mkAbility('static', { staticType: 'additional-cost', cost: ac.cost });
      if (ac.optional) ab.conditions.push({ type: 'optional', raw: 'you may', ok: true });
      let status = ac.ok ? 'full' : 'partial'; sentences.push({ text: sent, status });
      while (sents[i + 1] && /^(If you do|Otherwise|Reduce my cost)/i.test(sents[i + 1])) { const nxt = sents[++i]; const st = parseStatic(nxt.replace(/\.$/, '').replace(/^If you do, /i, '')); if (st) { ab.effects.push(...st.effects.map((e) => ({ ...e, conditions: [{ type: 'if-you-do', raw: 'If you do', ok: true }] }))); sentences.push({ text: nxt, status: 'full' }); } else status = worst(status, pushEffects(ab, nxt)); }
      done(ab, status, sent); current = ab; continue;
    }
    // triggered
    const st = splitTrigger(bare);
    if (st) {
      const ab = mkAbility('triggered', { trigger: st.trigger });
      if (st.pre) ab.conditions.push(parseCondition(st.pre.replace(/^While /i, '')));
      let rest = st.rest; let mm;
      // intervening "if" (CR 383.2.a.1: part of the trigger condition)
      while ((mm = /^if ([^,]+), (.+)$/i.exec(rest)) && !/^if (you do|they do)/i.test(rest)) { const c = parseCondition(mm[1]); ab.conditions.push(c); rest = mm[2]; }
      let status = pushEffects(ab, rest + '.');
      if (!st.trigger.ok) status = status === 'none' ? 'none' : 'partial';
      if (ab.conditions.some((c) => !c.ok)) status = worst(status, 'partial') === 'none' ? 'partial' : worst(status, 'partial');
      // following sentences belong to the same ability until a new trigger/static starts
      while (sents[i + 1] && !splitTrigger(sents[i + 1].replace(/\.$/, '')) && !usageRe.test(sents[i + 1].replace(/\.$/, '')) && !(parseStatic(sents[i + 1].replace(/\.$/, '')) && !/^(They|It) /i.test(sents[i + 1]))) status = worst(status, pushEffects(ab, sents[++i]));
      // fix sentence status of first sentence when trigger unknown
      done(ab, status, sent); current = ab; continue;
    }
    // replacement effects
    if (/\bwould\b/i.test(bare) && (m = /^(Once each turn, )?(?:If|The next time) (.+?) would (.+?), (.+?)(?: instead)?$/i.exec(bare))) {
      const ab = mkAbility('replacement', { trigger: { event: 'would-' + (/die/.test(m[3]) ? 'die' : /channel/.test(m[3]) ? 'channel' : /deal|dealt|damage/.test(m[3]) ? 'damage' : /reveal/.test(m[3]) ? 'reveal' : /play/.test(m[3]) ? 'play' : /score/.test(m[3]) ? 'score' : /go to your trash/.test(m[3]) ? 'trash' : 'other'), raw: `${m[2]} would ${m[3]}`, ok: true, ...(m[1] ? { frequency: 'once-each-turn' } : {}) } });
      const status = pushEffects(ab, m[4] + '.'); sentences[sentences.length - 1].text = sent; done(ab, status, sent); current = ab; continue;
    }
    // conditional static: "While C, X" / "If C, X"
    let cond = null; let body = bare;
    if ((m = /^(?:While|If|During) ([^,]+), (.+)$/i.exec(bare))) { cond = parseCondition(m[1]); body = m[2]; }
    else if ((m = /^(.+?) (?:while|if|unless) (.+)$/i.exec(bare)) && parseStatic(m[1])) { cond = parseCondition(m[2]); if (/ unless /.test(bare)) cond.negate = true; body = m[1]; }
    const stt = parseStatic(body) || (cond ? null : parseStatic(bare));
    if (stt && (card.type !== 'spell' || /^(This|I) |cost|can't be countered|Ignore/i.test(body))) {
      const ab = mkAbility('static', { staticType: stt.staticType, effects: stt.effects });
      if (cond) ab.conditions.push(cond);
      const ok = stt.effects.every((e) => e.ok !== false) && (!cond || cond.ok);
      done(ab, ok ? 'full' : 'partial', sent); sentences.push({ text: sent, status: ok ? 'full' : 'partial' }); current = ab; continue;
    }
    // spell text / free-standing effect sentence
    const isSpell = card.type === 'spell';
    if (current && (current.kind === 'on-play' || (!isSpell && current.kind !== 'static'))) { const s2 = pushEffects(current, sent); current.status = worst(current.status, s2); continue; }
    const ab = mkAbility(isSpell ? 'on-play' : gates.length ? 'static' : 'static', isSpell ? {} : { staticType: 'effect-text' });
    let status = pushEffects(ab, sent);
    if (!isSpell && status === 'full' && !gates.length && origin === 'rules') status = 'partial'; // an effect sentence with no trigger on a permanent: not understood as an ability
    if (!isSpell && status !== 'full') sentences[sentences.length - 1].status = status;
    done(ab, status, sent); current = ab;
  }
  return { abilities, sentences };
}
function parseStatic(s) { for (const [re, f] of STATIC) { const m = re.exec(s); if (m) { const r = f(m); if (r) return r; } } return null; }
function splitActivated(line) {
  // "<cost>: [Speed] — effect"  |  "<cost>: effect"
  const i = line.indexOf(': '); if (i < 0) return null;
  const left = line.slice(0, i); if (/[.]/.test(left.replace(/\[[^\]]*\]/g, ''))) return null;
  const cost = parseCost(left); if (!cost) return null;
  let rest = line.slice(i + 2).trim(); let speed = null; let legion = false; let m;
  if ((m = /^\[(Action|Reaction)\](, \[Legion\])? — /.exec(rest))) { speed = m[1].toLowerCase(); legion = !!m[2]; rest = rest.slice(m[0].length); }
  else if ((m = /^\[Legion\] — /.exec(rest))) { legion = true; rest = rest.slice(m[0].length); }
  return { cost, rest, speed, legion };
}

// ---------- card level ----------
export function cardText(card) {
  const fix = TEXT_FIXES[card.code]; let text = card.text || ''; let source = 'gallery';
  if (fix) { const t2 = text.replace(fix.from, fix.to); if (t2 !== text) { text = t2; source = fix.kind; } }
  return { text, source };
}
export function parseCard(card) {
  const { text, source } = cardText(card);
  const abilities = []; const sentences = [];
  const run = (raw, origin) => {
    const lines = stripReminders(raw).split('\n').map((l) => l.trim()).filter(Boolean);
    // merge bullets into the preceding line
    const blocks = []; for (const l of lines) { if (/^- /.test(l) && blocks.length) blocks[blocks.length - 1].options.push(l.slice(2).trim()); else blocks.push({ line: l, options: [] }); }
    for (const b of blocks) { const r = parseLine(b.line, card, origin, b.options); abilities.push(...r.abilities); sentences.push(...r.sentences); }
  };
  run(text, 'rules');
  if (card.effectText && stripReminders(card.effectText).trim() && !/^\d+$/.test(card.effectText.trim())) run(card.effectText, 'equipment-effect');
  // quoted granted abilities: parse the inner text too
  for (const ab of abilities) for (const e of ab.effects) if (e.verb === 'grantAbility' && e.grantedText) { const inner = parseLine(e.grantedText, { ...card, type: 'unit' }, 'granted', []); e.granted = inner.abilities; if (inner.sentences.some((s) => s.status !== 'full')) { e.ok = false; } }
  // card-level speed and keyword summary
  let speed = 'normal'; const keywords = [];
  for (const ab of abilities) if (ab.kind === 'keyword') {
    const k = { ...ab.keyword }; if (ab.conditions.length) k.conditional = true; if (ab.cost) k.cost = ab.cost; if (ab.origin !== 'rules') k.grantedToWearer = true;
    keywords.push(k);
    if (ab.origin === 'rules' && !ab.conditions.length && (k.name === 'Action' || k.name === 'Reaction')) speed = k.name === 'Reaction' ? 'reaction' : speed === 'reaction' ? 'reaction' : 'action';
  }
  // Hidden grants Reaction when played from face down; Quick-Draw and Ambush grant Reaction timing (reminder text, CR 811/819/822)
  const status = combine(sentences.map((s) => s.status));
  const { text: _t, effectText: _e, printings, altType, galleryType, ...meta } = card;
  return { ...meta, speed, keywords, abilities, parse: { status: sentences.length ? status : 'full', sentences }, textUsed: text, effectTextUsed: card.effectText || '', textSource: source };
}
