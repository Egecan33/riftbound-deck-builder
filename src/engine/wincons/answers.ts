// What an interaction card can actually hit. New code (wincons.md V6 item 4; matchups-and-lines.md 3.9).
//
// The research prototypes named "answers" by class and never tested them: Bellows Breath (deal 1) was listed
// against a 4-Might champion, Gust (3 Might or less) against big holders, a gear-only kill as unit removal.
// Here every effect is read from the card's own sentence with its limits (damage size, Might cap, domain,
// location, the need for an own unit), and `answerHits` tests it against one target card.
//
// HEURISTIC: the sentence patterns are ours. They read current card text; a sentence no pattern matches gives
// no answer (fail closed), so a card is never credited with removal it does not have.
import type { Card, Domain } from '../types';

export type AnswerKind = 'kill' | 'damage' | 'bounce' | 'stun' | 'displace' | 'steal' | 'shrink' | 'gear-kill' | 'sweep' | 'counter';

export interface Answer {
  kind: AnswerKind;
  /** damage / sweep: the number dealt; shrink: the Might taken away. null = depends on a unit's Might or on a payment. */
  amount: number | null;
  /** "with N Might or less" (also a total-Might cap). */
  maxMight: number | null;
  /** "an enemy Calm unit". */
  domain: Domain | null;
  where: 'battlefield' | 'base' | 'any';
  /** The effect needs one of the caster's units (a fight, "less Might than it", a friendly unit returned too). */
  needsOwnUnit: boolean;
  /** A stated condition that is not a property of the target ("If there are 4 or more units there"). */
  condition: string | null;
  /** counter only. */
  counter: { maxEnergy: number | null; maxPower: number | null; minPower: number | null; onlyTargeting: boolean; tax: number | null } | null;
  /** The sentence the effect was read from, reminder text removed. */
  sentence: string;
}

const DOMAINS: readonly Domain[] = ['fury', 'calm', 'mind', 'body', 'chaos', 'order'];

export const stripReminder = (text: string): string => text.replace(/\([^()]*\)/g, ' ').replace(/[ \t]+/g, ' ');

/** Sentences of a card's current text, reminder text removed, list bullets kept as their own sentences. */
export function sentencesOf(card: Pick<Card, 'text'>): string[] {
  const out: string[] = [];
  for (const line of stripReminder(card.text).split('\n')) {
    for (const part of line.split(/(?<=[.!?])\s+/)) {
      const s = part.replace(/^[-–—•]\s*/, '').trim();
      if (s) out.push(s);
    }
  }
  return out;
}

const whereOf = (s: string): Answer['where'] =>
  /\bat (?:a |its |their |that )?base\b|\bin (?:a|their|its) base\b/.test(s) ? 'base'
    : /\bat (?:a |the same |that )?battlefields?\b|\bhere\b|\bthere\b|\battacking\b/.test(s) ? 'battlefield' : 'any';

const base = (kind: AnswerKind, sentence: string, s: string): Answer => ({
  kind, amount: null, maxMight: null, domain: null, where: whereOf(s), needsOwnUnit: false, condition: null, counter: null, sentence,
});

const mightCap = (s: string): number | null => {
  const m = /\bwith (?:total might )?(\d+) (?:\[might\] )?or less\b|\btotal might (\d+) or less\b/.exec(s);
  return m ? Number(m[1] ?? m[2]) : null;
};

const domainOf = (s: string): Domain | null => {
  const m = /\benemy (fury|calm|mind|body|chaos|order) (?:units?|gear|spell)/.exec(s);
  return m && (DOMAINS as readonly string[]).includes(m[1]) ? (m[1] as Domain) : null;
};

const conditionOf = (s: string): string | null => {
  const m = /\bif (there (?:are|is)[^,.]*|you control[^,.]*|you paid[^,.]*)/.exec(s);
  return m ? m[1].trim() : null;
};

/** Only the caster's own things are named: "a friendly unit", "you control", "me", with no enemy in the sentence. */
const ownOnly = (s: string): boolean => /\bfriendly\b|\byou control\b|\byour (?:units?|gear)\b/.test(s) && !/\benemy\b|\bopponent/.test(s);

const powerPips = (s: string): number => (s.match(/\[(?:any|fury|calm|mind|body|chaos|order)\]/g) ?? []).length;

function counterOf(sentence: string, s: string): Answer | null {
  if (!/\bcounter (?:a|an|that|target|it\b)/.test(s) || !/\bspell|\bcounter it\b/.test(s)) return null;
  const a = base('counter', sentence, s);
  const energy = /\b(?:costs?|energy cost) no more than \[(\d+)\]/.exec(s);
  const powerCap = /\band no more than ((?:\[[a-z]+\])+)/.exec(s);
  const powerMin = /\bpower cost ((?:\[[a-z]+\])+) or more\b/.exec(s);
  const tax = /\bunless its controller pays \[(\d+)\]/.exec(s);
  a.counter = {
    maxEnergy: energy ? Number(energy[1]) : null,
    maxPower: powerCap ? powerPips(powerCap[1]) : null,
    minPower: powerMin ? powerPips(powerMin[1]) : null,
    onlyTargeting: /\bthat chooses\b/.test(s),
    tax: tax ? Number(tax[1]) : null,
  };
  a.needsOwnUnit = /\bchoose a friendly unit\b/.test(s) && a.counter.onlyTargeting;
  return a;
}

/** Effects of one sentence. `prev` is the sentence before it: "Choose a spell with Energy cost no more than [4]. ... Otherwise, counter it." */
function readSentence(sentence: string, prev: string): Answer[] {
  const s = sentence.toLowerCase();
  const out: Answer[] = [];
  // A cost is not an effect: "Kill a friendly unit as an additional cost", "[Exhaust]: ...", "discard 1 to ...".
  if (/\bas an additional cost\b/.test(s) && !/\bif you (?:do|paid)\b/.test(s)) return out;
  const afterCost = s.includes(':') && /^[^:]*(?:\[exhaust\]|\[\d+\]|\[any\]|kill this|discard|recycle)[^:]*:/.test(s) ? s.slice(s.indexOf(':') + 1) : s;
  // "Exhaust all friendly units, then deal 12 to all units at battlefields": the clause about one's own
  // things is dropped, the rest is read.
  const clauses = afterCost.split(/,? then /).filter((c) => !ownOnly(c) || /\bcounter\b/.test(c));
  if (clauses.length === 0) return out;
  const effect = clauses.join(', then ');

  const counter = counterOf(sentence, /\bcounter it\b/.test(effect) && !/\bspell\b/.test(effect) ? `${prev.toLowerCase()} ${effect}` : effect);
  if (counter) out.push(counter);

  // Mass damage: "Deal 1 to all units at battlefields", "deal 2 to enemy units here", "deal that much damage to all enemy units".
  const sweep = /\bdeals? (\d+|that much damage|damage equal to (?:its|my|their) might) to (?:all|each)(?! of up to)(?: other)?(?: enemy)? units?\b|\bdeals? (\d+) to enemy units\b/.exec(effect);
  const massKill = /\bkill (?:all|each)(?: other)?(?: enemy)? units?\b/.test(effect);
  if (sweep || massKill) {
    const a = base('sweep', sentence, effect);
    const n = sweep ? sweep[1] ?? sweep[2] : null;
    a.amount = massKill ? Infinity : n && /^\d+$/.test(n) ? Number(n) : null;
    a.needsOwnUnit = !!n && /might/.test(n);
    a.maxMight = massKill ? mightCap(effect) : null;
    out.push(a);
  } else {
    // Aimed damage: "Deal 3 to a unit", "deal 1 to each of up to 2 units", "deal 2 to up to one enemy unit at a battlefield".
    const dmg = /\bdeals? (\d+) to (?:each of )?(?:up to (?:\d+|one|two|three) )?(?:an? |another |target )?(?:enemy |other )?(?:fury |calm |mind |body |chaos |order )?units?\b/.exec(effect) ?? /\bdeals? (\d+) to (?:it|them|an enemy)\b/.exec(effect);
    if (dmg) {
      const a = base('damage', sentence, effect);
      a.amount = Number(dmg[1]);
      a.domain = domainOf(effect);
      a.condition = conditionOf(effect);
      out.push(a);
      const more = /\bdeal (\d+) to it instead\b/.exec(effect);
      if (more) a.condition = `${more[1]} with the stated condition`;
    } else if (/\bdeals? damage equal to (?:its|my|their|that unit's) (?:\[)?(?:might|shield)\]?s?\b/.test(effect) && /\benemy|\beach other\b/.test(effect)) {
      const a = base('damage', sentence, effect);
      a.needsOwnUnit = true;
      out.push(a);
    }
  }

  // Kill: "Kill a unit at a battlefield", "kill an enemy unit", "Kill an enemy unit with less Might than it", "kill a unit or gear".
  const kill = /\bkill (?:an? |up to one |target |another |any number of )?(?:enemy )?(?:fury |calm |mind |body |chaos |order )?(units?)\b/.exec(effect);
  if (kill && !massKill && !/\bkill a friendly\b/.test(effect)) {
    const a = base('kill', sentence, effect);
    a.maxMight = mightCap(effect);
    a.domain = domainOf(effect);
    a.needsOwnUnit = /\bless might than\b/.test(effect);
    a.condition = conditionOf(effect);
    out.push(a);
  }
  if (/\bkill (?:an? |up to one |all |target |an enemy )?(?:enemy )?(?:fury |calm |mind |body |chaos |order )?(?:unit or )?gear\b|\bgive a gear \[temporary\]|\bchoose an enemy gear\b/.test(effect)) {
    const a = base('gear-kill', sentence, effect);
    a.domain = domainOf(effect);
    a.condition = conditionOf(effect);
    out.push(a);
  }

  // Bounce: "Return a unit at a battlefield with 3 [Might] or less to its owner's hand".
  if (/\breturn\b[^.]*\bunits?\b[^.]*\bto (?:its|their) owner(?:'|’)?s?(?:'|’)? hands?\b/.test(effect)) {
    const a = base('bounce', sentence, effect);
    a.maxMight = mightCap(effect);
    a.domain = domainOf(effect);
    a.needsOwnUnit = /\ba friendly unit and an enemy unit\b/.test(effect);
    a.condition = conditionOf(prev.toLowerCase()) ?? conditionOf(effect);
    out.push(a);
  }
  if (/\[stun\] (?:an?|it|up to|each|all|that)\b|(?<!\[)\bstun (?:an?|it|up to|each|all|that)\b/.test(effect)) out.push(base('stun', sentence, effect));
  if (/\bmove (?:an|up to one|another) enemy unit\b|\bmove an enemy\b/.test(effect)) out.push(base('displace', sentence, effect));
  if (/\btake control of an enemy unit\b/.test(effect)) out.push(base('steal', sentence, effect));
  const shrink = /\bgive (?:an? |up to \w+ )?(?:enemy )?units?[^.]*?-(\d+) \[might\]/.exec(effect);
  if (shrink) {
    const a = base('shrink', sentence, effect);
    a.amount = Number(shrink[1]);
    a.domain = domainOf(effect);
    out.push(a);
  }
  return out;
}

const cache = new WeakMap<object, Answer[]>();

/** Every interaction effect of a card that can be aimed at an opponent's unit, gear or spell. */
export function answersOf(card: Card): Answer[] {
  const held = cache.get(card);
  if (held) return held;
  const out: Answer[] = [];
  if (card.type === 'unit' || card.type === 'spell' || card.type === 'gear' || card.type === 'legend') {
    let prev = '';
    for (const sentence of sentencesOf(card)) {
      for (const a of readSentence(sentence, prev)) if (!out.some((o) => o.kind === a.kind && o.amount === a.amount && o.where === a.where && o.maxMight === a.maxMight)) out.push(a);
      prev = sentence;
    }
  }
  cache.set(card, out);
  return out;
}

export interface Hit { hits: boolean; conditional: boolean; why: string }

const hasKeyword = (card: Card, keyword: string): boolean => card.keywords.some((k) => k.toLowerCase() === keyword);

/** Does the unit's own text stop enemy spells and abilities from choosing it? */
export function untargetable(target: Card): 'always' | 'outside-combat' | null {
  for (const s of sentencesOf(target)) {
    const m = /^i can(?:'|’)t be chosen by enemy spells and abilities\b(.*)$/i.exec(s);
    if (!m) continue;
    return /\bunless i(?:'|’)m in combat\b/i.test(m[1]) ? 'outside-combat' : /\bunless\b|\bwhile\b|\bif\b/i.test(m[1]) ? null : 'always';
  }
  return null;
}

/** Short description of an effect with its limits: "deal 3", "return, 3 Might or less", "kill, enemy Calm only". */
export function describeAnswer(a: Answer): string {
  const limits = [
    a.maxMight !== null ? `${a.maxMight} Might or less` : null,
    a.domain ? `${a.domain[0].toUpperCase()}${a.domain.slice(1)} only` : null,
    a.where === 'base' ? 'at a base' : a.where === 'battlefield' ? 'at a battlefield' : null,
    a.needsOwnUnit ? 'needs their own unit' : null,
    a.condition,
  ].filter(Boolean).join(', ');
  const head = a.kind === 'damage' ? (a.amount !== null ? `deal ${a.amount}` : 'damage equal to a unit\'s Might')
    : a.kind === 'sweep' ? (a.amount === Infinity ? 'kill all' : a.amount !== null ? `deal ${a.amount} to all` : 'mass damage of variable size')
    : a.kind === 'bounce' ? 'return to hand' : a.kind === 'displace' ? 'move it' : a.kind === 'steal' ? 'take control for the turn'
    : a.kind === 'shrink' ? `-${a.amount} Might` : a.kind === 'gear-kill' ? 'kill a gear' : a.kind === 'counter' ? describeCounter(a) : a.kind;
  return limits ? `${head}; ${limits}` : head;
}

function describeCounter(a: Answer): string {
  const c = a.counter;
  if (!c) return 'counter';
  const parts = [
    c.maxEnergy !== null ? `Energy ${c.maxEnergy} or less` : null,
    c.maxPower !== null ? `Power ${c.maxPower} or less` : null,
    c.minPower !== null ? `Power ${c.minPower} or more` : null,
    c.onlyTargeting ? 'only an enemy spell or ability that chooses a friendly unit or gear' : null,
    c.tax !== null ? `unless you pay ${c.tax}` : null,
  ].filter(Boolean);
  return parts.length ? `counter a spell: ${parts.join(', ')}` : 'counter any spell';
}

/**
 * Does the effect work on this target card?
 * Units: tested at printed Might at a battlefield (buffs and Shield are not modelled). Gear: only gear-kill.
 * Spells: only counter, by the spell's own Energy and Power.
 */
export function answerHits(a: Answer, target: Card): Hit {
  const no = (why: string): Hit => ({ hits: false, conditional: false, why });
  const yes = (why: string, conditional = false): Hit => ({ hits: true, conditional: conditional || a.needsOwnUnit || a.condition !== null, why });
  if (a.kind === 'counter') {
    if (target.type !== 'spell') return no('not a spell');
    const c = a.counter;
    const energy = target.energy ?? 0;
    const power = target.power ?? 0;
    if (c?.maxEnergy !== null && c?.maxEnergy !== undefined && energy > c.maxEnergy) return no(`costs ${energy} Energy, over the ${c.maxEnergy} limit`);
    if (c?.maxPower !== null && c?.maxPower !== undefined && power > c.maxPower) return no(`costs ${power} Power, over the ${c.maxPower} limit`);
    if (c?.minPower !== null && c?.minPower !== undefined && power < c.minPower) return no(`costs ${power} Power, under the ${c.minPower} it needs`);
    return yes(describeCounter(a), !!c?.onlyTargeting || c?.tax !== null);
  }
  if (a.kind === 'gear-kill') {
    if (target.type !== 'gear') return no('not a gear');
    if (a.domain && !target.domains.includes(a.domain)) return no(`only ${a.domain} gear`);
    return yes('kills the gear');
  }
  if (target.type !== 'unit') return no('not a unit');
  const might = target.might ?? 0;
  if (a.where === 'base') return no('only reaches units at a base');
  if (a.domain && !target.domains.includes(a.domain)) return no(`only ${a.domain} units`);
  if (a.maxMight !== null && might > a.maxMight) return no(`${might} Might is over its ${a.maxMight} limit`);
  // "I can't be chosen by enemy spells and abilities" (Baron Nashor, Ruin Runner): only an effect that chooses
  // nothing (mass damage, "kill all units") reaches the unit. A [Level N] line is not counted: it is off at the start.
  if (a.kind !== 'sweep') {
    const guard = untargetable(target);
    if (guard === 'always') return no('it cannot be chosen by enemy spells and abilities');
    if (guard === 'outside-combat') return yes(`only while it is in combat (it cannot be chosen otherwise)`, true);
  }
  const deflect = hasKeyword(target, 'deflect') && a.kind !== 'sweep' ? ' (Deflect: they pay 1 more Power to choose it)' : '';
  switch (a.kind) {
    case 'damage':
    case 'sweep':
      if (a.amount === null) return yes(`damage of variable size against ${might} Might${deflect}`, true);
      if (a.amount < might) return no(`deals ${a.amount}, short of ${might} Might`);
      return yes(`${a.amount === Infinity ? 'kills' : `deals ${a.amount} to`} a ${might}-Might unit${deflect}`);
    case 'shrink':
      return (a.amount ?? 0) >= might ? yes(`-${a.amount} Might leaves it at 0${deflect}`) : yes(`-${a.amount} Might of ${might}${deflect}`, true);
    case 'kill': return yes(`kills it${deflect}`);
    case 'bounce': return yes(`returns it to hand${deflect}`);
    case 'stun': return yes(`stuns it for the turn${deflect}`);
    case 'displace': return yes(`moves it off the battlefield${deflect}`);
    case 'steal': return yes(`takes it for a turn${deflect}`);
    default: return no('no effect on a unit');
  }
}

/** Kinds that take a unit off the battlefield for good or for a turn cycle (a stun or a shrink does not). */
export const REMOVING: readonly AnswerKind[] = ['kill', 'damage', 'bounce', 'steal', 'sweep'];
