// Suppressors: known false-positive patterns of the pair network. New code.
//
// The ported analyzeCardPair joins two cards when one holds the enabler trait of a package and the other the
// payoff trait. Traits are mined from a card's whole text, so the join does not check that what the enabler
// produces is what the payoff asks for. docs/research/interactions.md sections 6.2 and 6.4 list the patterns
// that made a prototype graph wrong (S1..S18); the ones that apply to the ported reasons are implemented
// here at sentence level, plus three found by sampling this network on 2026-11-12 (gear tokens joined to
// go-wide payoffs, "Skip your Draw Phase" read as an extra turn, a card's own keyword joined to another
// card's own gate). Every suppressor has an id that the build counts and a test that quotes real cards.
//
// HEURISTIC throughout: these are text patterns, written to remove only what is certainly wrong. When the
// sentence that carries a trait cannot be found (a whole-text pattern), nothing is suppressed.
import { deriveTraits, finiteOr, type ScoreCard, type Trait } from '../mine';
import { sentencesWithTrait } from './quote';
import type { CombinationReason } from './types';

export const SUPPRESSORS: Readonly<Record<string, string>> = {
  'cost-threshold': 'S1: the payoff asks for a card that costs N or more and the enabler costs less',
  'non-tag': 'S2/S14: the only mention of the tag is "non-<Tag>"',
  'self-only-enabler': "S5: the enabler acts on itself only and the payoff is another card's own gate or trigger",
  'move-to-base': 'S6: the payoff needs a move to a battlefield, the enabler moves to base',
  'kill-with-spell': 'S8: the payoff needs a kill by a spell and the enabler is not a spell',
  'move-side': 'S10/S16: enemy moves do not trigger friendly-move payoffs, and the reverse',
  'gear-move': 'S13: the enabler moves gear, the payoff is a unit moving',
  'death-replacement': 'S17: "kill this instead" replaces a death; nothing is sacrificed on demand',
  'token-type': 'a gear token does not widen the board, and a unit token is not a gear',
  'wrong-type-kill': 'the enabler cannot kill the Deathknell card: unit vs gear, or a [Mighty] unit is asked for',
  'skip-not-extra-turn': 'the "skip" text skips a phase; it gives no additional turn',
  'trait-override': 'a reviewed mine override removed the trait this reason rests on',
  // Stage 3 review (2026-11-12), found by sampling the stored edges against card text:
  'own-effect-only': 'the payoff counts only what its own effect did ("when you burn a unit this way")',
  'no-activated-ability': 'the payoff asks for an activated ability of a gear and the gear has none',
  'death-side': 'the payoff watches enemy units die and the enabler kills only your own',
};

export interface PackageSides { enabler: ScoreCard; payoff: ScoreCard }
export interface Judgement { suppressor: string | null; sides: PackageSides | null }

const all = (sentences: string[], pattern: RegExp): boolean => sentences.length > 0 && sentences.every((s) => pattern.test(s));
const any = (sentences: string[], pattern: RegExp): boolean => sentences.some((s) => pattern.test(s));

// Movement -----------------------------------------------------------------------------------------------
const MOVE_ENEMY = /\bmove[^.]*\benemy\b|\bthey move\b/i;
const MOVE_SELF = /^\[ganking\]$|\b(?:give|gives) (?:me|this) \[ganking\]|\bi have \[ganking\]|\bmove me\b|\bi (?:may |can )?move\b|\bme to\b/i;
const MOVE_GEAR_ONLY = /\bmove (?:a|an|this|that|another|up to \w+)(?: friendly| attached)* (?:gear|equipment)\b(?![^.]*\bunit)/i;
const MOVE_TO_BASE = /\b(?:to|into) (?:your|my|its|their|its owner'?s|their owner'?s) base\b|\brecall\b/i;
const MOVE_TO_BATTLEFIELD = /\b(?:to|into) (?:a|an|another|that|the same|this|my|any|an open|its|their) battlefield\b|\bto here\b|\bhere\b/i;
const NEED_ENEMY_MOVE = /\bmove an enemy\b|\benemy units? (?:is |are )?moved\b|\bmove one or more enemy\b/i;
const NEED_SELF_MOVE = /\bwhen i move\b|\bif i (?:have )?moved\b|\bi(?:'ve| have) moved\b|\bwhen i'?m moved\b|\bwhen you move me\b|\bthe first time i move\b/i;
const NEED_BATTLEFIELD_MOVE = /\bmoves? to a battlefield\b|\bmoved? to a battlefield\b/i;

type MoveKind = 'enemy' | 'self' | 'gear' | 'friendly' | 'enemy-tax';
const MOVE_RESTRICTION = /\bmust pay\b[^.]*\bto move\b|\bcan'?t (?:be )?moved?\b/i;
function moveKinds(sentence: string): MoveKind[] {
  if (MOVE_GEAR_ONLY.test(sentence)) return ['gear'];
  // A move tax or a move ban ("Opponents must pay [1] to move ... here") moves nothing.
  if (MOVE_RESTRICTION.test(sentence)) return ['enemy-tax'];
  const kinds: MoveKind[] = [];
  if (MOVE_ENEMY.test(sentence)) kinds.push('enemy');
  // "Move a unit" with no side word can be either side.
  const neutral = /\bmove (?:a|an|another|up to \w+|any number of) units?\b/i.test(sentence);
  const friendly = /\bfriendly\b|\byour units?\b|\bunits? you control\b|\bunits? (?:here )?(?:have|gain) \[ganking\]|\bgive (?:a|an|another|it|them)\b[^.]*\[ganking\]/i.test(sentence);
  if (friendly || neutral) kinds.push('friendly');
  if (neutral && !kinds.includes('enemy')) kinds.push('enemy');
  if (kinds.length === 0) kinds.push(MOVE_SELF.test(sentence) ? 'self' : 'friendly');
  return kinds;
}

function movementSuppressor(enabler: ScoreCard, payoff: ScoreCard, same: boolean): string | null {
  const produce = sentencesWithTrait(enabler, 'movement');
  const need = sentencesWithTrait(payoff, 'movement-payoff');
  if (produce.length === 0 || need.length === 0) return null;
  let verdict: string | null = null;
  for (const n of need) {
    const wantsEnemy = NEED_ENEMY_MOVE.test(n);
    const wantsSelf = !wantsEnemy && NEED_SELF_MOVE.test(n);
    for (const p of produce) {
      for (const kind of moveKinds(p)) {
        if (kind === 'gear') { verdict ??= 'gear-move'; continue; }
        if (kind === 'enemy-tax') { verdict ??= 'move-side'; continue; }
        if (wantsEnemy) { if (kind === 'enemy') return null; verdict ??= 'move-side'; continue; }
        if (kind === 'enemy') { verdict ??= 'move-side'; continue; }
        // A card that moves only itself triggers a watcher of friendly moves, never another card's "When I move".
        if (kind === 'self' && (wantsSelf || same)) { verdict ??= 'self-only-enabler'; continue; }
        if (NEED_BATTLEFIELD_MOVE.test(n) && MOVE_TO_BASE.test(p) && !MOVE_TO_BATTLEFIELD.test(p)) { verdict ??= 'move-to-base'; continue; }
        return null;
      }
    }
  }
  return verdict;
}

// Death ---------------------------------------------------------------------------------------------------
const KILL_OTHER = /\bkill (?:a|an|another|any|all|each|up to|one|two|three|\d+|that|those|it|them)\b|\bsacrifice (?:a|an|another)\b|\bkills? one of their\b|\bdeal \d+ to all units you control\b/i;
const KILL_SELF = /\bkill (?:this|me)\b/i;
const DEATH_REPLACEMENT = /\bwould die\b[^.]*\bkill (?:this|me) instead\b/i;
const DEATH_WATCHER = /\bwhen (?:a|an|another|one or more|any)\b[^.,]*\b(?:dies?|is killed|are killed)\b|\bwhen you kill\b|\bif (?:a|an|another)\b[^.,]*\b(?:died|has died)\b|\bfor each\b[^.]*\bdied\b|\bunits? died\b|\[deathknell\] effects/i;
const WITH_SPELL = /\bwith a spell\b/i;
const ENEMY_DEATH = /\benemy units?\b[^.,]*\b(?:dies?|is killed|are killed)\b|\bkill an? (?:stunned |exhausted |damaged )?enemy\b/i;
const KILLS_ENEMY_TOO = /\beach player\b|\bopponents?\b|\benemy\b|\bthe defender\b|\bkill (?:a|an|all|each|any) (?:units?|gear)\b(?! you control)/i;
const THIS_WAY = /\bthis way\b/i;
const NEEDS_GEAR_ABILITY = /\bactivated ability of a gear\b/i;
/** A cost before a colon ("[1], [T]: ...", "Discard 1, [T]: ...") or [Equip]: the gear has an ability to activate. */
const ACTIVATED = /(?:^|\n|"|\. )[^.\n"]{0,60}(?:\]|\bthis|\bme|\bxp|\b\d)\s*:\s|\[equip\]/i;
const BOOSTS_A_UNIT = /\bgive (?:a|an|another|it|that|them|those|up to \w+|each|all|your|friendly)\b[^.]*\+|\b(?:friendly|other|your) units?\b[^.]*\b(?:have|has|get|gets|gain|gains)\b[^.]*\+|\[buff\] (?:a|an|another|all|each|friendly|up to)|\bdouble (?:a|an|that) |\bmights? of\b|\bbase might becomes\b/i;

function deathSuppressor(enabler: ScoreCard, payoff: ScoreCard, same: boolean): string | null {
  const produce = sentencesWithTrait(enabler, 'death-enabler');
  const need = sentencesWithTrait(payoff, 'death-payoff');
  if (produce.length === 0 || need.length === 0) return null;
  if (all(need, WITH_SPELL) && enabler.type !== 'spell') return 'kill-with-spell';
  // "When an enemy unit dies ..." (Pyke, Returned) is fed by removal, not by a sacrifice outlet.
  if (all(need, ENEMY_DEATH) && !any(produce, KILLS_ENEMY_TOO)) return 'death-side';
  if (all(produce, DEATH_REPLACEMENT)) return 'death-replacement';
  const watcher = any(need, DEATH_WATCHER);
  const killsOthers = any(produce, KILL_OTHER);
  if (!killsOthers && all(produce, KILL_SELF)) {
    // A self-sacrifice feeds a card that watches deaths; it never triggers another card's own Deathknell.
    return watcher && !same ? null : 'self-only-enabler';
  }
  if (!watcher && killsOthers) {
    // The payoff is its own Deathknell: the enabler has to be able to kill that card's type.
    const others = produce.filter((s) => KILL_OTHER.test(s));
    const unitOnly = all(others, /\bunits?\b/i) && !any(others, /\bgear\b|\banything\b|\bcard\b/i);
    const gearOnly = all(others, /\bgear\b/i) && !any(others, /\bunits?\b/i);
    if (unitOnly && payoff.type === 'gear') return 'wrong-type-kill';
    // "kill a friendly [Mighty] unit": the Deathknell unit has to have 5+ Might (CR 706) to be the one killed.
    if (all(others, /\[mighty\]/i) && payoff.type === 'unit' && finiteOr(payoff.might, 0) < 5) return 'wrong-type-kill';
    if (gearOnly && payoff.type === 'unit') return 'wrong-type-kill';
  }
  return null;
}

// Self-scoped enablers ------------------------------------------------------------------------------------
const BUFF_OTHER = /\bbuff (?:a|an|another|all|each|friendly|up to|one|two|it|them|that|your)\b/i;
const BUFF_PAYOFF_SELF = /\bmy buffs?\b|\bi(?:'m| am) buffed\b|\bif i have a buff\b/i;
const BUFF_PAYOFF_ANY = /\bbuffed (?:friendly )?units?\b|\bwhen you buff\b|\bfor each\b|\bspend (?:a|any|\d+|one|two) buffs?\b|\bfriendly units?\b[^.]*\bbuff/i;
const EMPOWER_OTHER = /\bempower (?:a|an|another|up to|it|them|that|something|each|all)\b/i;
const EMPOWERED_ANY = /\bempowered (?:friendly )?units?\b|\bwhen you empower\b|\beach empowered\b|\bfriendly empowered\b|\bunits? (?:you control )?(?:that are|that is|that's) empowered\b/i;

function buffSuppressor(enabler: ScoreCard, payoff: ScoreCard, same: boolean): string | null {
  const produce = sentencesWithTrait(enabler, 'buff-producer');
  const need = sentencesWithTrait(payoff, 'buff-consumer');
  if (produce.length === 0 || need.length === 0) return null;
  const selfOnly = !any(produce, BUFF_OTHER) && all(produce, /\bbuff (?:me|this)\b/i);
  const payoffSelf = all(need, BUFF_PAYOFF_SELF) && !any(need, BUFF_PAYOFF_ANY);
  return selfOnly && (payoffSelf || same) ? 'self-only-enabler' : null;
}

/** [Empower] (CR 827) empowers the card it is printed on and [Empowered] (CR 828) is the card's own gate. */
function empowerSuppressor(enabler: ScoreCard, payoff: ScoreCard): string | null {
  const produce = sentencesWithTrait(enabler, 'empower');
  if (produce.length === 0 || any(produce, EMPOWER_OTHER)) return null;
  return any(sentencesWithTrait(payoff, 'empowered-payoff'), EMPOWERED_ANY) ? null : 'self-only-enabler';
}

// Tokens ---------------------------------------------------------------------------------------------------
function tokenSuppressor(enabler: ScoreCard, payoff: ScoreCard, payoffTrait: Trait): string | null {
  const produce = sentencesWithTrait(enabler, 'token').filter((s) => /\btokens?\b|\bbombs?\b/i.test(s));
  if (produce.length === 0) return null;
  const makesUnits = any(produce, /\bunit tokens?\b/i);
  const makesGear = any(produce, /\bgear tokens?\b|\bbombs?\b/i);
  if (payoffTrait === 'wide') return makesUnits || !makesGear ? null : 'token-type';
  const need = sentencesWithTrait(payoff, 'token-matters');
  if (need.length === 0) return null;
  const wantsUnits = all(need, /\bunit tokens?\b|\btoken units?\b/i);
  const wantsGear = all(need, /\bgear tokens?\b|\btoken gear\b|\bgold\b|\bbombs?\b/i);
  if (wantsUnits && makesGear && !makesUnits) return 'token-type';
  if (wantsGear && makesUnits && !makesGear) return 'token-type';
  return null;
}

// Cost thresholds (S1) ---------------------------------------------------------------------------------------
const COST_AT_LEAST = /\b(?:costs?|cost of|energy cost(?: of)?) \[?(\d+)\]? or more\b|\bcosting \[?(\d+)\]? or more\b/i;

function thresholdSuppressor(enabler: ScoreCard, payoff: ScoreCard, payoffTrait: Trait): string | null {
  const need = sentencesWithTrait(payoff, payoffTrait);
  if (need.length === 0) return null;
  let lowest = Infinity;
  for (const s of need) {
    const m = COST_AT_LEAST.exec(s);
    if (!m) return null; // one sentence without a threshold is enough for the join
    lowest = Math.min(lowest, Number(m[1] ?? m[2]));
  }
  return finiteOr(enabler.energy, 0) >= lowest ? null : 'cost-threshold';
}

function judgeOrientation(enabler: ScoreCard, payoff: ScoreCard, x: Trait, y: Trait, same: boolean): string | null {
  // A payoff that counts only its own effect ("When you burn a unit this way") is fed by no other card.
  const needed = sentencesWithTrait(payoff, y);
  if (!same && needed.length > 0 && all(needed, THIS_WAY)) return 'own-effect-only';
  if (x === 'gear' && y === 'gear-matters' && needed.length > 0 && all(needed, NEEDS_GEAR_ABILITY) && !ACTIVATED.test(enabler.rulesText.replace(/\([^)]*\)/g, ' '))) return 'no-activated-ability';
  if (x === 'might-boost' && y === 'might-damage') {
    // The boost has to reach the unit that deals its Might: a second copy of one card, or a card that only
    // grows itself, is not that.
    const boosts = sentencesWithTrait(enabler, 'might-boost');
    if (same) return 'self-only-enabler';
    return boosts.length === 0 || any(boosts, BOOSTS_A_UNIT) ? null : 'self-only-enabler';
  }
  if ((x as string) === 'replay-unit' && same) return 'self-only-enabler';
  if (x === 'movement') return movementSuppressor(enabler, payoff, same);
  if (x === 'death-enabler') return deathSuppressor(enabler, payoff, same);
  if (x === 'temporary') {
    // A Temporary card dies by itself: that feeds a death watcher, never another card's own Deathknell.
    const need = sentencesWithTrait(payoff, 'death-payoff');
    const grants = any(sentencesWithTrait(enabler, 'temporary'), /\b(?:give|gives|with|has|have|gains?)\b[^.]*\[temporary\]/i);
    if (need.length === 0 || grants) return null;
    return any(need, DEATH_WATCHER) && !same ? null : 'self-only-enabler';
  }
  if (x === 'buff-producer') return buffSuppressor(enabler, payoff, same);
  if (x === 'empower') return empowerSuppressor(enabler, payoff);
  if (x === 'token') return tokenSuppressor(enabler, payoff, y);
  if (x === 'spell' || x === 'gear' || x === 'equipment') return thresholdSuppressor(enabler, payoff, y);
  return null;
}

const EXTRA_TURN = /\badditional turn\b|\bextra turn\b|\bturn after this\b|\banother turn\b/i;

/**
 * Should this reason of the ported analysis be dropped, and for a package which card is the enabler?
 * `removed` holds the traits a reviewed mine override took away, per card id (the ported analysis reads
 * the unmodified traits).
 */
export function judgeReason(reason: CombinationReason, left: ScoreCard, right: ScoreCard, removed?: Readonly<Record<string, readonly string[]>>): Judgement {
  const kind = reason.id.slice(0, reason.id.indexOf(':'));
  const same = left.id === right.id;
  const traitsOf = (card: ScoreCard): Set<Trait> => {
    const traits = new Set(deriveTraits(card));
    for (const t of removed?.[card.id] ?? []) traits.delete(t as Trait);
    return traits;
  };

  if (kind === 'package') {
    const [x, y] = reason.traits as [Trait, Trait];
    const lt = traitsOf(left);
    const rt = traitsOf(right);
    const orientations: PackageSides[] = [];
    if (lt.has(x) && rt.has(y)) orientations.push({ enabler: left, payoff: right });
    if (!same && rt.has(x) && lt.has(y)) orientations.push({ enabler: right, payoff: left });
    if (orientations.length === 0) return { suppressor: 'trait-override', sides: null };
    let first: string | null = null;
    for (const sides of orientations) {
      const suppressor = judgeOrientation(sides.enabler, sides.payoff, x, y, same);
      if (!suppressor) return { suppressor: null, sides };
      first ??= suppressor;
    }
    return { suppressor: first, sides: null };
  }

  if (kind === 'tag-reference') {
    const tag = (reason.id.split(':')[1] ?? '').toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const mention = new RegExp(`(non-)?\\b${tag}(?:s|es)?\\b`, 'gi');
    let plain = 0;
    let negated = 0;
    for (const card of same ? [left] : [left, right]) {
      for (const m of card.rulesText.replace(/\([^)]*\)/g, ' ').matchAll(mention)) { if (m[1]) negated += 1; else plain += 1; }
    }
    return { suppressor: plain === 0 && negated > 0 ? 'non-tag' : null, sides: null };
  }

  if (kind === 'extra-turn-value' || kind === 'extra-turn-ramp') {
    const skips = [left, right].filter((c) => deriveTraits(c).has('skip'));
    if (!skips.some((c) => traitsOf(c).has('skip'))) return { suppressor: 'trait-override', sides: null };
    if (!skips.some((c) => EXTRA_TURN.test(c.rulesText))) return { suppressor: 'skip-not-extra-turn', sides: null };
  }
  return { suppressor: null, sides: null };
}

/** The id of the suppressor that rejects the reason, or null. */
export const suppressReason = (reason: CombinationReason, left: ScoreCard, right: ScoreCard, removed?: Readonly<Record<string, readonly string[]>>): string | null =>
  judgeReason(reason, left, right, removed).suppressor;
