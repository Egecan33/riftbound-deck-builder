// Synergy axes for Riftbound: enabler (E) and payoff (P) text patterns, counted against the current card pool.
// Pool = distinct named main-deck cards (unit/spell/gear, no tokens) from cards-2026-11-11.json; legends and battlefields are counted separately as payoff carriers.
import { readFileSync, writeFileSync } from 'node:fs';
import { strip } from './roles.mjs';
const { cards } = JSON.parse(readFileSync('cards-2026-11-11.json', 'utf8'));
const pick = (pred) => { const m = new Map(); for (const c of cards) if (pred(c)) { const o = m.get(c.name); if (!o || (o.rarity === 'showcase' && c.rarity !== 'showcase')) m.set(c.name, c); } return [...m.values()]; };
const pool = pick((c) => ['unit', 'spell', 'gear'].includes(c.type) && !c.superTypes.includes('token'));
const legends = pick((c) => c.type === 'legend');
const bfs = pick((c) => c.type === 'battlefield' && !c.superTypes.includes('token'));
const T = (c) => strip(c.text);
const kw = (k) => new RegExp(`\\[${k}( \\d+)?\\]`, 'i');
// Each axis: e(card) = enabler test, p(card) = payoff test. Tests see the reminder-stripped text via T(c).
export const AXES = {
  'tokens / go-wide': { e: (c) => /\bunit tokens?\b/i.test(T(c)), p: (c) => /for each (other )?(friendly |of your )?(token )?units?|token units?\b(?! tokens?)|\[legion\]|your units (have|get)|other friendly units have|friendly units (here )?(have|get)|give (your|friendly) units/i.test(T(c)) && !/play (a|two|three|four|\w+) .*unit tokens?[^.]*\.$/i.test(T(c)) },
  'buffs': { e: (c) => /\[buff\]|\bbuffs? (an?|another|me|it|all|each|up to|that|them|two)/i.test(T(c)), p: (c) => /\bbuffed\b|spend (its|a|my|any number of|their|\d+)? ?buffs?|has a buff|for each buff|with a buff|spent a buff/i.test(T(c)) },
  'equipment / attach': { e: (c) => c.tags.includes('Equipment') || kw('equip').test(T(c)) || kw('quick-draw').test(T(c)), p: (c) => /\[weaponmaster\]|\bequipment\b|\battach(ed)?\b|\bequipped\b/i.test(T(c)) && !c.tags.includes('Equipment') },
  'gear matters': { e: (c) => c.type === 'gear', p: (c) => /when you play a gear|for each (friendly |other )?gear|friendly gear|your gear|kill a friendly gear|a gear from|\[show off\] a gear|gear you control/i.test(T(c)) },
  'discard': { e: (c) => /\bdiscard (\d+|a card|your hand|any number)/i.test(T(c)) && !/(they|opponent)s? discard/i.test(T(c)), p: (c) => /when you discard|whenever you discard|you('ve| have) discarded|discarded this turn|when (i'm|this is) discarded|if you discarded/i.test(T(c)) },
  'trash / recursion': { e: (c) => /\[burn( \d+)?\]|\bdiscard\b|into your trash|kill a friendly/i.test(T(c)), p: (c) => /from your trash|\[flow\]|cards? in your trash|in your trash\b/i.test(T(c)) },
  'stun': { e: (c) => /\[stun\]|\bstuns? (an?|all|each|up to|it|that|them)/i.test(T(c)), p: (c) => /\bstunned\b/i.test(T(c)) },
  'movement': { e: (c) => /\bmove (an?|another|up to \w+|any number of) (friendly |of your )?(\w+ )?units?|\[ganking\]|units? here have \[ganking\]/i.test(T(c)), p: (c) => /when i move|when (a|another) friendly unit moves|when you move|moved this turn|whenever (i|a friendly unit) moves?/i.test(T(c)) },
  'conquer triggers': { e: (c) => /\[accelerate\]|enters? ready|\bready (me|an?|another|up to|your)\b|\[ganking\]|\[assault/i.test(T(c)), p: (c) => /when (i|you|a friendly unit) conquers?|conquer effects|you('ve| have) conquered|conquered this turn|\[hunt/i.test(T(c)) },
  'hold triggers': { e: (c) => /\[shield|\[tank\]|\[deflect|can't be chosen/i.test(T(c)), p: (c) => /when (i|you|a friendly unit) holds?|hold effects|from holding|\[hunt/i.test(T(c)) },
  'mighty (5+ Might)': { e: (c) => (c.type === 'unit' && (c.might ?? 0) >= 5) || /\+[3-9] \[might\]|double[^.]*might/i.test(T(c)), p: (c) => /\[mighty\]|\bmighty\b|5 \[might\] or more|with [5-9] or more \[?might/i.test(T(c)) },
  'spell-slinging': { e: (c) => c.type === 'spell' && (c.energy ?? 9) <= 2, p: (c) => /when you play a spell|whenever you play a spell|your spells|spells? (you play )?costs?|for each spell|spell (from|in) your trash|next spell|play a spell from|only to play spells/i.test(T(c)) },
  'rune ramp / big energy': { e: (c) => /\bchannel (\d+|a) runes?|gold gear tokens?|\[add\]|\bready (up to )?(\d+|your) runes?/i.test(T(c)), p: (c) => (c.energy ?? 0) >= 6 || /control \d+ or more runes|for each rune|pay any amount|\[repeat\]|\[empower\] \[[5-9]/i.test(T(c)) },
  'XP / Level': { e: (c) => /gains? \d+ xp|gain xp|\[hunt( \d+)?\]/i.test(T(c)), p: (c) => /\[level \d+\]|spend \d+ xp|pay \d+ xp|for each xp|your level/i.test(T(c)) },
  'hidden / facedown': { e: (c) => kw('hidden').test(T(c)), p: (c) => /face ?down|\bhide\b|hidden (card|unit)s?|a card with \[hidden\]/i.test(T(c)) },
  'deathknell / sacrifice': { e: (c) => kw('deathknell').test(T(c)) || /\[temporary\]/i.test(T(c)), p: (c) => /kill (an? |another |\d+ |any number of |up to \w+ )?(other )?friendly (unit|gear)|when (a|another) friendly unit dies|when one or more friendly units die|deathknell effects|friendly \[deathknell\]|died this turn/i.test(T(c)) },
  'empower': { e: (c) => kw('empower').test(T(c)), p: (c) => /when (i|a friendly unit|it|something) becomes? \[empowered\]|empower (something|an?|another|it|that)|empowered (unit|gear|friendly)|each \[?empowered|if it's \[empowered\]|disempower/i.test(T(c)) },
  'deploy / bombs (RAD)': { e: (c) => kw('deploy').test(T(c)) || /bomb gear token/i.test(T(c)), p: (c) => /gear with \[deploy\]|\bbombs?\b(?! gear token)|gear (at|here at) (a |this )?battlefield|friendly gear at a battlefield/i.test(T(c)) },
  'show off (RAD)': { e: (c) => (c.energy ?? 0) >= 7 || c.type === 'gear', p: (c) => kw('show off').test(T(c)) },
  'disarm / shrink': { e: (c) => /\[disarm|-\d+ \[might\]/i.test(T(c)), p: (c) => /when you reduce the might|reduced? (the )?might|might (is|was) reduced|with 0 \[might\]|\d \[might\] or less/i.test(T(c)) },
  'legion (second card)': { e: (c) => (c.energy ?? 9) <= 1, p: (c) => kw('legion').test(T(c)) || /another card this turn|cards you've played this turn|for each card you've played/i.test(T(c)) },
  'attack (Assault)': { e: (c) => kw('assault').test(T(c)), p: (c) => /when i attack|when (a|one or more) friendly units? attacks?|while (i'm )?attacking|attacker/i.test(T(c)) },
  'defend (Shield/Tank)': { e: (c) => /\[shield( \d+)?\]|\[tank\]/i.test(T(c)), p: (c) => /when i defend|when (a|one or more) friendly units? defends?|defender|while defending/i.test(T(c)) },
  'deflect / being chosen': { e: (c) => kw('deflect').test(T(c)), p: (c) => /when (you|an opponent) chooses?|when i('m| am) chosen|chosen (by|this turn)|you've chosen/i.test(T(c)) },
  'top-deck (Vision/Predict)': { e: (c) => /\[vision\]|\[predict( \d+)?\]/i.test(T(c)), p: (c) => /top card of your main deck|reveal the top|look at the top/i.test(T(c)) },
  'ready / exhaust': { e: (c) => /\bready (an?|another|up to \w+|your|all) (friendly |other )?(\w+ )?units?|ready (it|them|me)\b/i.test(T(c)), p: (c) => /when i become exhausted|when you (choose or )?ready|exhaust (two|three|\d+) or more|as an additional cost[^.]*exhaust|\[exhaust\]:/i.test(T(c)) && c.type === 'unit' },
  'solo / alone': { e: (c) => /\[deflect|\[shield|\+\d+ \[might\]/i.test(T(c)) && c.type !== 'unit', p: (c) => /\balone\b|only unit|no other (friendly )?units?/i.test(T(c)) },
  'hand size / draw matters': { e: (c) => /\bdraw (\d+|a card)/i.test(T(c)), p: (c) => /cards? in (your|their) hand|for each card in|when you draw|hand size|exactly \d+ cards in hand|fewer cards in hand/i.test(T(c)) },
  'gold': { e: (c) => /gold gear tokens?/i.test(T(c)), p: (c) => /\bgold\b(?! gear tokens? exhausted)(?! gear token)/i.test(T(c)) || /for each gold|kill a friendly gear/i.test(T(c)) },
};
const TAGS = {}; for (const c of pool) for (const t of c.tags) TAGS[t] = (TAGS[t] || 0) + 1;
const champTags = new Set(legends.flatMap((l) => l.tags));
const out = ['| axis | enablers (pool) | payoffs (pool) | both | legends with payoff text | battlefields with payoff text | example payoffs |', '|---|---|---|---|---|---|---|'];
const res = {};
for (const [name, ax] of Object.entries(AXES)) {
  const E = pool.filter(ax.e), P = pool.filter(ax.p), B = pool.filter((c) => ax.e(c) && ax.p(c));
  const Lg = legends.filter((c) => ax.p(c) || (name.startsWith('rune') ? false : false)), Bf = bfs.filter(ax.p);
  res[name] = { enablers: E.length, payoffs: P.length, both: B.length, legends: Lg.map((l) => `${l.tags[0]}`), battlefields: Bf.map((b) => b.name) };
  out.push(`| ${name} | ${E.length} | ${P.length} | ${B.length} | ${Lg.length ? [...new Set(Lg.map((l) => l.tags.find((t) => champTags.has(t)) || l.name))].slice(0, 8).join(', ') : '-'} | ${Bf.length} | ${P.filter((c) => !ax.e(c)).slice(0, 3).map((c) => c.name).join('; ')} |`);
}
// Tag (typal/region) axes: members = cards with the tag; payoffs = cards whose rules text names the tag.
const tagRows = [];
for (const [t, n] of Object.entries(TAGS).sort((a, b) => b[1] - a[1])) {
  if (champTags.has(t) && n < 8) continue;
  const re = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\b`);
  const pay = pool.filter((c) => re.test(T(c))); const lg = legends.filter((c) => re.test(T(c))); const bf = bfs.filter((c) => re.test(T(c)));
  if (n >= 8 || pay.length) tagRows.push(`| ${t} | ${n} | ${pay.length} | ${lg.map((l) => l.tags[0]).join(', ') || '-'} | ${bf.map((b) => b.name).join(', ') || '-'} | ${pay.slice(0, 3).map((c) => c.name).join('; ')} |`);
}
writeFileSync('out/09-axes.md', [`pool: ${pool.length} named main-deck cards, ${legends.length} legends, ${bfs.length} battlefields`, '', ...out, '', '### tag axes (members = cards carrying the tag; payoffs = cards whose rules text names the tag)', '| tag | members | payoff cards | legends naming it | battlefields naming it | example payoffs |', '|---|---|---|---|---|---|', ...tagRows].join('\n'));
writeFileSync('out/axes.json', JSON.stringify(res));
console.log(readFileSync('out/09-axes.md', 'utf8'));
