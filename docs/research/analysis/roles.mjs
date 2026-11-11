// Text-rule role classifier for Riftbound main-deck cards. Pure functions, no I/O.
// Input card: { name, type: 'unit'|'spell'|'gear', superTypes[], energy, power, might, tags[], text }
// Reminder text "( ... )" is stripped before matching so that reminder wording never triggers a role.
export const strip = (t) => (t || '').replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
const FRIENDLY_ONLY = /^(?:(?!enemy|opponent)[^.])*\bfriendly\b/i;
export const ROLE_RULES = {
  // --- interaction ---
  removal_kill: (t) => sentences(t).some((s) => /\b(kill|banish) (?!me\b|this\b|it\b|them\b)(an? |another |up to \w+ |any number of |all |each |that |those |target |the |one )?(of )?(?!friendly)(\w+ ){0,3}units?\b/i.test(s) && !/\b(kill|banish) (an? |another |up to \w+ |any number of |\d+ )?(other )?friendly\b/i.test(s) && !/as an additional cost/i.test(s) && !/banish (an? |that |target )?(friendly )?unit, then its owner plays it/i.test(s)) || /choose an enemy unit[^.]*\.[^.]*\bkill it\b|each (player|opponent) (must )?kills? one of their units|when any unit takes damage[^.]*kill it|take control of (it|an?|that|target)|\bgive (an?|that|target|up to)[^.]*\b(unit|gear)\b[^.]*\[temporary\]/i.test(t),
  removal_damage: (t) => sentences(t).some((s) => /\bdeals? (\d+|x|damage equal to[^.]*?|that much( damage)?|twice[^.]*?)( damage)? (split (among|between) |divided )?(to|among) (?!me\b)/i.test(s) || /\bdeals? damage equal to (its|my|their) might (split )?(to|among)/i.test(s)),
  removal_bounce: (t) => sentences(t).some((s) => /\breturn (an? |another |all |each |up to \w+ |that |those |target )[^.]*\b(units?|gear)\b[^.]*to (its|their) owners?'s? hands?|to their owners' hands/i.test(s) && !/from (your|a|their) trash/i.test(s) && !/\breturn (an? |another )?friendly\b(?![^.]*\benemy\b)/i.test(s)),
  stun: (t) => /\[stun\]|\bstuns?\b (an?|all|each|up to|that|it|them|target|another)/i.test(t),
  sweeper: (t) => /\b(kill|banish|stun|return|deals? \d+( damage)? to) (all|each)\b(?! friendly)(?! of up to)[^.]*\bunits?\b|kill the rest|split among enemy units/i.test(t),
  debuff: (t) => /-\d+ \[might\]|\[disarm|reduce[^.]*might/i.test(t),
  counterspell: (t) => /\bcounter (an? |that |target |it\b|the )[^.]*?(spell|abilit|unless)|\bcounter (it|that spell)\b|gain control of it and you may make new choices/i.test(t),
  hate_gear: (t) => sentences(t).some((s) => /\b(kill|banish|return) (an? |all |each |up to \w+ |target |another |that )?(enemy )?(unit or )?gear\b/i.test(s) && !/(kill|banish|return) (an? |another )?friendly/i.test(s) && !/as an additional cost|from your trash/i.test(s)) || /choose an enemy gear/i.test(t),
  hate_trash: (t) => /(banish|recycle)[^.]*(opponent|enemy|each player|any player|a player)[^.]*trash|from (an opponent's|any|each player's) trash|opponents' trashes|their owners recycle them/i.test(t),
  hand_attack: (t) => /(opponent|they|each player)[^.]*\bdiscards?\b|reveals? their hand\.[^.]*\b(choose|discard|recycle|banish)\b[^.]*\b(card|it)\b/i.test(t),
  // --- card economy ---
  draw: (t) => sentences(t).some((s) => /\bdraws? (\d+|a card|x\b|that many|cards|it\b)/i.test(s) && (/\byou\b[^.]*\bdraw/i.test(s) || !/\b(they|opponents?|that player|its controller|their owners?)\b[^.]*\bdraws?\b/i.test(s)) && !/would[^.]*draws? 1 instead/i.test(s)) || /until[^.]*you may play (that card|it|them)/i.test(t),
  selection: (t) => /\[predict|look at the top|reveals? the top|reveal cards from the top|from among them/i.test(t),
  recursion: (t) => /(play|return|put|draw)[^.:]*from (your|their|a|any) trash|in your trash[^.]*\.\s*play it|from your trash (to|into)|\[flow\]/i.test(t),
  discard_outlet: (t) => /\bdiscard (\d+|a card|your hand|x\b|any number)/i.test(t) && !/(opponent|they) discards?/i.test(t),
  // --- resources ---
  ramp: (t) => /\bchannel (\d+|a) runes?|\[add\]|\badd \[|gold gear tokens?|\bready (up to )?(\d+|a|your|all your) runes?|\b(your|next|friendly|other)\b[^.]*\bcosts? (\[[^\]]+\])+ less/i.test(t),
  // --- board / tempo ---
  movement: (t) => /\bmove (an? |another |up to \w+ |any number of |all |each |that |those |target |it\b|them\b|me\b)|\[ganking\]|\bswap\b[^.]*\blocations?\b/i.test(t.replace(/can't move[^.]*/gi, '')),
  tempo_ready: (t) => /\bready (me|it|them|an? |another |up to \w+ (friendly |other )?units?|all |each |that |those )(?!runes?)|enters? ready|\[accelerate\]|\[ambush\]/i.test(t.replace(/when you (choose or )?ready me/gi, '')),
  combat_trick: (t, c) => c.type === 'spell' && /(give|gives|gets?|has|have)[^.]*[+-]\d+ \[might\]|\+\[might\] equal|\[(assault|shield|tank|deflect)( \d+)?\][^.]*this turn|\bprevent\b|double[^.]*might|swap the mights|\[buff\]|\bbuff (an?|another|up to|each|all|it)/i.test(t),
  protection: (t) => sentences(t).some((s) => !/\bignore \[deflect/i.test(s) && (/can't be chosen|\bprevent\b|can't be (killed|dealt|damaged)|give[^.]*\[(deflect|shield)( \d+)?\]|\[deflect( \d+)?\]/i.test(s.replace(/tokens? with \[deflect\]/gi, '')) || /\b(friendly unit|i|me|unit you control)\b[^.]*would die[^.]*instead/i.test(s))),
  buff: (t) => /\[buff\]|\bbuffs?\b (an?|me|another|it|each|all|up to|that|them|two|three)/i.test(t),
  token_maker: (t) => /\bunit tokens?\b/i.test(t),
  // --- win pressure ---
  points: (t) => /\bscores? \d+ points?|\byou score\b|gains? \d+ points?|win the game|take (a|an extra|another) turn/i.test(t.replace(/would score \d+ points?/gi, '')),
  point_denial: (t) => /can't score|would score[^.]*instead|loses? \d+ points?/i.test(t),
  score_trigger: (t) => /when (i|you|a friendly unit|one or more friendly units) (conquers?|holds?)|when you (conquer|hold)|conquer effects|hold effects/i.test(t),
};
function sentences(t) { return t.split(/(?<=[.!?])\s+|\s*—\s*|\n/).filter(Boolean); }
export function speed(c) {
  const t = strip(c.text);
  if (c.type === 'spell') return /^(\[\w[\w -]*\] )*\[reaction\]/i.test(t) ? 'reaction' : /^(\[\w[\w -]*\] )*\[action\]/i.test(t) ? 'action' : 'slow';
  if (/\[ambush\]/i.test(t)) return 'reaction'; // CR 822 Ambush: unit playable as a Reaction to a battlefield with friendly units
  if (/\[hidden\]/i.test(t)) return 'hidden';
  return 'slow';
}
export function roles(c) {
  const t = strip(c.text);
  const out = [];
  for (const [k, f] of Object.entries(ROLE_RULES)) if (f(t, c)) out.push(k);
  if (c.type === 'unit' && ((c.energy ?? 0) >= 6 || (c.might ?? 0) >= 6)) out.push('topend');
  return out;
}
// Aggregated buckets used for bands
export const BUCKETS = {
  removal: ['removal_kill', 'removal_damage', 'removal_bounce', 'stun', 'sweeper'],
  hard_removal: ['removal_kill', 'removal_damage'],
  card_flow: ['draw', 'selection'],
  draw: ['draw'],
  movement: ['movement'],
  tempo: ['movement', 'tempo_ready'],
  combat_tricks: ['combat_trick'],
  counterspells: ['counterspell'],
  protection: ['protection'],
  ramp: ['ramp'],
  finishers: ['points', 'topend'],
  recursion: ['recursion'],
  hate: ['hate_gear', 'hate_trash', 'hand_attack', 'point_denial'],
};
export const inBucket = (rs, b) => BUCKETS[b].some((r) => rs.includes(r));
