// Select tournament-looking decks from the crawled listing by NAME regex (heuristic), newest formats only.
import { readFileSync, writeFileSync } from 'node:fs';
const L = readFileSync('raw/pa-list.jsonl', 'utf8').trim().split('\n').map((x) => JSON.parse(x));
const seen = new Set(); const uniq = L.filter((d) => !seen.has(d.id) && seen.add(d.id));
export const EVENT_RE = /\b(RQ|RC|regionals?|qualifier|championship|top[ -]?(4|8|16|32|64)|t(4|8|16|32)\b|#\d+|\d+(st|nd|rd|th)( place)?|winner|winning|won\b|champion\b|finalist|finals?\b|best[- ]of|undefeated|\d+-\d+(-\d+)?\b|stuttgart|stuttgard|utrecht|hartford|vancouver|sydney|melbourne|los angeles|\bLA\b|chengdu|shenyang|sacramento|LDXP|showdown|nexus night|nexus cup|skirmish|major\b|regional open|invitational|bologna|lille|houston|las vegas|atlanta|dallas|worlds|summoner skirmish|store championship|1er|1°|🏆|🥇|🥈|🥉)/i;
const hits = uniq.filter((d) => EVENT_RE.test(d.name));
writeFileSync('raw/pa-tournament-ids.json', JSON.stringify(hits.map((d) => ({ id: d.id, name: d.name, createdAt: d.createdAt, editedAt: d.editedAt, views: d.views, legend: d.legend })), null, 0));
const month = {}; for (const d of hits) month[d.createdAt.slice(0, 7)] = (month[d.createdAt.slice(0, 7)] || 0) + 1;
console.log('listed', uniq.length, 'tournament-like', hits.length, month);
if (process.argv[2]) for (const d of hits.filter((_, i) => i % Number(process.argv[2]) === 0)) console.log(d.createdAt.slice(0, 10), '|', d.name.slice(0, 90));
