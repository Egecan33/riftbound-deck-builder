// Forge extension of the ported card mine. New code, not a port.
//
// The Riftfoundry mine (origin/main 4b90179) was written against the pool up to Vendetta. This file adds what
// the 2026-10-09 Core Rules and the Radiance set brought, and the gaps the pool-wide coverage report showed:
//   - Radiance keywords Deploy (CR 830), Disarm (CR 831), Show Off (CR 832) and the Bomb token (CR 187.12);
//   - the two pre-keyword Backline cards (CR 826 reminder printed as plain text, CR 467.2.c.8);
//   - families the ported trait list had no name for: Might boosts and reductions, solo combat, protection
//     from being chosen, play restrictions, placement, Hidden payoffs, Bonus Damage, unit-play triggers;
//   - wordings the ported patterns miss for traits that already exist (cost reduction "reduced by",
//     "channels 1 rune", "enter ready", "your token units", ...).
// What each keyword does is taken from docs/research/mechanics-glossary.md sections 2.22-2.28, 4.10, 4.15 and
// 6.2, and every pattern was checked against the synced card text (tests/engine/mine/radiance.test.ts quotes
// the cards). The ported files call in through three one-line hooks: labels.ts spreads FORGE_TRAIT_LABELS,
// traits.ts calls addForgeTraits, semantic.ts calls addForgeSemanticFamilies.
//
// HEURISTIC: every number in addForgeSemanticFamilies is a prior chosen to sit beside the ported value of the
// closest older keyword (Assault for Disarm, a chosen 2-damage ping for a Bomb). None is measured.
import type { ScoreCard } from './types';

/** Trait ids added by Forge. labels.ts merges them into TRAIT_LABELS, so `Trait` covers them. */
export const FORGE_TRAIT_LABELS = {
  bomb: 'Bomb tokens',
  'bonus-damage': 'Bonus Damage',
  deploy: 'Deploy',
  'deploy-matters': 'Deploy payoff',
  disarm: 'Disarm',
  'hidden-matters': 'Hidden payoff',
  lock: 'Play restriction',
  'might-boost': 'Might boost',
  'might-reduction': 'Enemy Might reduction',
  'might-reduction-payoff': 'Might-reduction payoff',
  placement: 'Flexible placement',
  protection: 'Protection from being chosen',
  'gear-removal': 'Gear removal',
  'point-gain': 'Direct points',
  'show-off': 'Show Off',
  sweeper: 'Mass removal',
  solo: 'Alone / one on one',
  'unit-play-payoff': 'Unit-play payoff',
} as const;

export type ForgeTrait = keyof typeof FORGE_TRAIT_LABELS;

/** Minimal view of the trait set: the ported `Set<Trait>` satisfies it without a circular type import. */
interface TraitSink { add(trait: string): unknown; has(trait: string): boolean }

const stripReminder = (s: string): string => s.replaceAll(/\([^)]*\)/g, ' ');

/** Ability lines of the printed text, reminder text removed, lower case. */
export function abilityLines(card: Pick<ScoreCard, 'rulesText'>): string[] {
  return stripReminder(card.rulesText)
    .toLocaleLowerCase()
    .split(/\n+/)
    .map((line) => line.replaceAll(/\s+/g, ' ').trim())
    .filter(Boolean);
}

const KEYWORD_HEAD = String.raw`^(?:\[[a-z -]+(?: \d+)?\](?:\[>+\])?[ ,]*)*`;

/**
 * True when the card itself has the keyword: it heads an ability line, possibly after other keyword heads
 * (glossary 6.1 step 3). A mention elsewhere ("Your Mechs have [Disarm]", "a gear with [Deploy]") is a grant
 * or a reference, not ownership.
 */
export function ownsKeyword(card: Pick<ScoreCard, 'rulesText'>, keyword: string): boolean {
  const pattern = new RegExp(`${KEYWORD_HEAD}\\[${keyword}(?: \\d+)?\\]`);
  return abilityLines(card).some((line) => pattern.test(line));
}

/** Summed Disarm value the card owns (CR 831.2: values are summed; no number means 1). */
export function ownedDisarm(card: Pick<ScoreCard, 'rulesText'>): number {
  let total = 0;
  const head = new RegExp(`${KEYWORD_HEAD}\\[disarm(?: (\\d+))?\\]`);
  for (const line of abilityLines(card)) {
    const match = head.exec(line);
    if (match) total += Number(match[1] ?? 1);
  }
  return total;
}

const WORD_NUMBER: Readonly<Record<string, number>> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5 };

/**
 * Bomb gear tokens the text makes per use (CR 187.12: a Bomb has Deploy; when it dies it deals 2 to an enemy
 * there and kills the controller's other Bombs there). "that many" (Hexplosive Minefield) moves existing
 * Bombs and makes none, so it counts 0.
 */
export function bombTokensPlayed(text: string): number {
  let total = 0;
  for (const match of text.matchAll(/\bplay (a|an|one|two|three|four|five|\d+) bomb (?:gear )?tokens?\b/g)) {
    const word = match[1] ?? 'a';
    total += WORD_NUMBER[word] ?? (Number(word) || 1);
  }
  return total;
}

// Patterns run on the mine's normalised text: lower case, reminder text removed, symbols as [s] (Might),
// [t] (exhaust), [a] (any Power), [c] (domain Power).
const MIGHT_BOOST =
  /\+\d+ \[[ms]\]|\+\[[ms]\]|\bdouble (?:my|its|their|that unit'?s) might\b|\bmy might is increased\b|\bbase might becomes?\b(?! 0\b)|\bmight equal to\b/;
const ENEMY_MIGHT_REDUCTION =
  /\bgive (?:a|an|an enemy|each enemy|all enemy|enemy|another|target|that|up to \w+)(?: \w+){0,3} units?\b[^.!?]{0,40}[-–]\s?(?:\d+ )?\[[ms]\]|\[disarm(?: \d+)?\]|\bgives? an additional -\d+ \[[ms]\]|\breduce the might of an enemy\b/;
const MIGHT_REDUCTION_PAYOFF =
  /\bwhen you reduce the might of an? (?:enemy )?unit\b|\bwould give -\[[ms]\] to a unit\b/;
const SOLO = /\balone\b|\bone on one\b/;
const PROTECTION =
  /\bcan'?t be chosen by (?:enemy|opponents?'?)\b|\bcan'?t be (?:moved|killed|damaged|stunned|countered) by enemy\b/;
const LOCK =
  /\bopponents? can'?t play\b|\bplayers? can'?t (?:play|score)\b|\bunits can'?t be played here\b|\bcan'?t play (?:cards|spells|units)\b|\bunits don'?t ready\b/;
const PLACEMENT =
  /\b(?:you may )?play me to an? (?:occupied|open|enemy)\b|\bcan be played to\b|\bplay me only to\b|\bplayed to any battlefield\b/;
const HIDDEN_MATTERS =
  /\bface ?down\b|\bhide (?:an additional|ignoring|a card)\b|\bcards? with \[hidden\]|\bhidden cards?\b|\bwhen you hide\b|\byou can hide\b/;
const BONUS_DAMAGE = /\bbonus damage\b/;
const UNIT_PLAY_PAYOFF =
  /\bwhen(?:ever)? (?:you|a player) plays? (?:a|an|another|your first|a non-token)(?: \w+)? units?\b(?!, kill this)|\bwhen a friendly unit is played\b|\bthe first time (?:you|a player) plays? [^.!?]{0,24}\bunit\b/;
const DEPLOY_REFERENCE = /\b(?:gear|cards?|one) with \[deploy\]|\[deploy\] (?:gear|cards?)\b/;
const COST_REDUCTION_EXTRA =
  /\bcosts?\b[^.!?]{0,40}\b(?:is|are) reduced by\b|\bcost is reduced by\b|\bpay (?:\[[^\]]+\])+ less\b|\breducing its cost\b|\bcosts? (?:\[[^\]]+\])+(?: or (?:\[[^\]]+\])+)? less\b/;
const CHANNEL_EXTRA = /\bchannels? (?:\d+|a|an|that many) (?:exhausted )?runes?\b/;
const RUNE_COUNT_EXTRA = /\b\d+\+ runes\b|\bfewer runes\b|\bmore runes\b/;
const TOKEN_MATTERS_EXTRA = /\byour tokens?\b|\byour token units?\b|\bfriendly tokens?\b|\btoken units? you control\b/;
const GEAR_MATTERS_EXTRA =
  /\bactivated ability of a gear\b|\bto play a gear\b|\bchoose a friendly gear\b|\bkill a friendly gear\b|\babilities of friendly gear\b|\bwhen you play a gear\b|\byour gear\b/;
const SPELL_MATTERS_EXTRA = /\bspells you play\b|\bto play a spell this turn\b|\bplayed a spell this turn\b/;
const MUTUAL_MIGHT_DAMAGE = /\bdeal damage equal to their mights to each other\b/;
const EACH_PLAYER_KILLS = /\beach player (?:must )?kills? one of their units\b/;
const BACKLINE_TEXT = /\bi must be assigned combat damage last\b/;
// Plan Task 5 (roles): families the role list needs and no trait named. Mass damage, kill, banish, stun or
// bounce over all or each unit or gear, friendly-only wording left out; removal that can hit an enemy gear.
const SWEEPER =
  /\b(?:deals? \d+(?: damage)? to|kill|banish|stun|return) (?:all|each|every) (?!friendly)(?:other |enemy |stunned |exhausted |damaged |attacking |defending )*(?:units?|gear)\b(?! you control| from (?:your|a|their) trash)|\bgive (?:all|each) enemy units? -\d+ \[[ms]\]/;
const GEAR_REMOVAL =
  /\b(?:kill|banish) (?:a|an|all|each|every|another|up to \w+|any number of|that)(?: enemy| attached)? (?:gear|equipment)\b|\bkill (?:a|an|all|each)(?: enemy)? units? (?:or|and) gear\b|\b(?:kill|banish) all gear\b/;
const POINT_TEXT = /\bpoints needed to win\b|\bgains? \d+ points?\b/;

/**
 * Adds the Forge traits, and the existing traits whose wording the ported patterns miss, to a card's trait
 * set. `text` is the mine's normalised text (rulesForScoring). Called at the end of the ported deriveTraits;
 * it only ever adds.
 */
export function addForgeTraits(card: ScoreCard, text: string, traits: TraitSink): void {
  const has = (pattern: RegExp): boolean => pattern.test(text);

  // Radiance keywords ---------------------------------------------------------------------------------
  if (ownsKeyword(card, 'deploy')) traits.add('deploy');
  if (has(DEPLOY_REFERENCE)) {
    traits.add('deploy-matters');
    traits.add('gear-matters');
  }
  if (has(/\[disarm(?: \d+)?\]/)) {
    // Owned or granted ("Your Mechs have [Disarm]"): either way the deck gets attack-time -Might.
    traits.add('disarm');
    traits.add('might-reduction');
    traits.add('interaction');
  }
  if (has(/\[show off\]|\bif you showed off\b/)) traits.add('show-off');
  if (has(/\bbombs?\b/)) {
    traits.add('bomb');
    // A Bomb is a Deploy gear token; cards that make or move Bombs feed Deploy payoffs.
    if (bombTokensPlayed(text) > 0) {
      traits.add('token');
      traits.add('damage-provider');
    }
  }

  // Backline printed as plain text before the keyword existed (Caitlyn, Patrolling; Soraka, Wanderer).
  if (has(BACKLINE_TEXT)) traits.add('backline');

  // Families without a ported trait ----------------------------------------------------------------------
  if (has(MIGHT_BOOST)) traits.add('might-boost');
  if (has(ENEMY_MIGHT_REDUCTION)) {
    traits.add('might-reduction');
    traits.add('interaction');
  }
  if (has(MIGHT_REDUCTION_PAYOFF)) traits.add('might-reduction-payoff');
  if (has(SOLO)) traits.add('solo');
  if (has(PROTECTION)) traits.add('protection');
  if (has(LOCK)) {
    traits.add('lock');
    traits.add('interaction');
  }
  if (has(PLACEMENT)) traits.add('placement');
  if (has(HIDDEN_MATTERS)) traits.add('hidden-matters');
  if (has(BONUS_DAMAGE)) traits.add('bonus-damage');
  if (has(UNIT_PLAY_PAYOFF)) traits.add('unit-play-payoff');

  if (has(SWEEPER)) {
    traits.add('sweeper');
    traits.add('interaction');
  }
  if (has(GEAR_REMOVAL)) {
    traits.add('gear-removal');
    traits.add('interaction');
  }

  // Existing traits, wordings the ported patterns miss ------------------------------------------------------
  if (has(COST_REDUCTION_EXTRA)) traits.add('cost-reduction');
  if (has(CHANNEL_EXTRA)) traits.add('channel-rune');
  if (has(RUNE_COUNT_EXTRA)) traits.add('rune-count-payoff');
  if (has(TOKEN_MATTERS_EXTRA)) traits.add('token-matters');
  if (has(GEAR_MATTERS_EXTRA) && !traits.has('equipment-matters')) traits.add('gear-matters');
  if (has(SPELL_MATTERS_EXTRA)) traits.add('spell-matters');
  if (has(/\benters? ready\b/)) traits.add('ready');
  if (has(/\bname a spell\b/)) traits.add('card-naming');
  if (has(/\bbattlefield you conquered\b/)) traits.add('conquer');
  if (has(POINT_TEXT)) traits.add('scoring');
  if (has(MUTUAL_MIGHT_DAMAGE)) {
    traits.add('damage-provider');
    traits.add('interaction');
  }
  if (has(EACH_PLAYER_KILLS)) {
    traits.add('death');
    traits.add('death-enabler');
    traits.add('interaction');
  }
  if (has(/\bbanish (?:that many|a|an|any number of|up to \w+) (?:friendly )?units? you control\b/)) {
    traits.add('banish-enabler');
  }
  // Wordings found by comparing with the GameLab scripts (scripts/mine-gamelab.ts): the script performs the
  // effect, the ported patterns did not see it. Each is quoted from a card in radiance.test.ts.
  // Damage through Might, a cost or a counted amount ("It deals damage equal to its Might to an enemy
  // unit", "We deal damage equal to our Mights to each other", "Deal its Energy cost as damage to a unit").
  if (
    has(/\bdeals? damage equal to (?:its|their|our|my|that unit'?s) (?:might|mights|\[assault\])|\bdeals? damage to a unit equal to\b|\bdeal its energy cost as damage to\b|\bto deal that much damage to\b|\bdeal \d+ to it for each\b/)
  ) {
    traits.add('damage-provider');
    traits.add('interaction');
  }
  // "Choose an enemy unit. If it is stunned, kill it." / "Then kill it if it has 3 Might or less."
  if (
    has(/\bchoose (?:a|an|an enemy|another enemy) (?:unit|gear)\b[^]*\bkill it\b/) ||
    has(/\beach player chooses? (?:a|one) unit they control\b[^]{0,48}\bkill the rest\b/) ||
    has(/\bwhen any unit takes damage this turn, kill it\b/)
  ) {
    traits.add('removal');
    traits.add('interaction');
    traits.add('death');
  }
  if (has(/\beach player kills? one of their gear\b/)) traits.add('interaction');
  // "... you may discard 1 to kill a unit or gear": removal behind a cost in the same sentence.
  if (has(/\bto kill (?:a|an|an enemy) (?:enemy )?(?:unit|gear|unit or gear)\b/)) {
    traits.add('removal');
    traits.add('interaction');
    traits.add('death');
  }
  // Readying as the effect of a paid or modal ability ("... exhaust me to ready a unit", "- Ready me.").
  if (has(/\bto ready (?:it|me|them|a unit|a friendly unit|your legend)\b|[*:] ready (?:me|a unit|a friendly unit)\b|"(?:\[[^\]]+\])+: ready me\b/)) {
    traits.add('ready');
  }
  // Readying runes is Energy for this turn (CR 416; glossary 6.2 "Ready runes" = ramp).
  if (has(/\bready (?:up to )?(?:\d+|a|an|one|two|three|your|all(?: of)? your) (?:friendly |exhausted )?runes?\b/)) {
    traits.add('energy-ramp');
  }
  // Tokens made as the effect of a paid ability or a modal option ("... exhaust me to play a Gold gear
  // token exhausted", "- Play four 1 Might Bird unit tokens"). "They play ..." gives the opponent the token.
  if (has(/(?:\bto|[*—:]) play (?:a|an|one|two|three|four|five|\d+)(?: ready| exhausted)?(?: \d+ \[[ms]\])?(?: [a-z']+){0,3} (?:unit|gear) tokens?\b/)) {
    traits.add('token');
  }
  // "[Buff] a friendly unit" written with the bracketed game action; the ported pattern needs a word
  // character before the bracket, so it only saw the unbracketed spelling.
  if (has(/\[buff\] (?:me|a|an|another|all|each|friendly|up to|one|this|it|them)\b|(?<!when you |would |if you )\bbuff (?:it|them|that unit)\b/)) {
    traits.add('buff-producer');
  }
  if (has(/\beach player\b[^.!?]{0,48}\bdraws\b/)) traits.add('draw');
  if (has(/\bmove (?:a|an|another|up to \w+) (?:attacking |exhausted |enemy |friendly )+(?:unit|gear)s?\b|\bi may be moved with it\b|\bmove another unit they control\b/)) {
    traits.add('movement');
  }
  if (has(/\bdouble (?:a|an) (?:friendly |enemy )?unit'?s might\b|\bincrease its might\b/)) traits.add('might-boost');
  if (has(/\bwhen an enemy unit attacks\b[^.!?]{0,60}\bgive it -\d+ \[[ms]\]/)) {
    traits.add('might-reduction');
    traits.add('interaction');
  }
  if (has(/\blook at the top (?:card|two|three|four|five)\b|\breveals? the top card of (?:your|their) main deck\b|\breveal cards from the top of your main deck\b/)) {
    traits.add('predict');
  }
  if (has(/\bput the top (?:\d+ )?cards? of your main deck into your trash\b/)) {
    traits.add('burn-self');
    traits.add('trash-filler');
  }
  if (has(/\bempower (?:it|them|that unit)\b/)) traits.add('empower');
  if (has(/\breveals? their hand\b[^]{0,90}\b(?:recycle|discards?|banish)\b/)) traits.add('interaction');
  if (has(/\bbanish it\. otherwise, return it to its owner'?s hand\b/)) {
    traits.add('removal');
    traits.add('interaction');
  }
  if (has(/\bswap the mights of\b/)) {
    traits.add('might-boost');
    traits.add('might-reduction');
    traits.add('interaction');
  }
  // "When you stun an enemy unit, ..." / "Stunned enemy units here have -8 Might": payoffs for stunning.
  if (has(/\bwhen you (?:\[stun\]|stun)\b|\bstunned (?:enemy )?units?\b|\bcontrols a stunned unit\b/)) traits.add('stun-payoff');
}

type ForgeSemanticComponent = 'expectedStrength' | 'effectValue' | 'cardAdvantage' | 'boardControl' | 'resourceValue' | 'costsAndDrawbacks';

/** The `add` closure of the ported structuredSemanticValuation. */
export type ForgeSemanticAdd = (
  label: string,
  component: ForgeSemanticComponent,
  rawValue: number,
  pattern: RegExp,
  detail: string,
  activationOverride?: number,
) => void;

/**
 * Effect families for the Radiance mechanics, registered in the ported semantic registry so that they pass
 * through the same clause activation, component caps and mechanic ledger as every older family. Without
 * them a Radiance card is rated as if its keyword text were blank. HEURISTIC values, see the file header.
 */
export function addForgeSemanticFamilies(add: ForgeSemanticAdd, text: string): void {
  // Disarm X (CR 831): "When I attack, give an enemy unit here -X Might this turn." An attack-only swing of
  // X, like Assault X (ported: 0.55 * 0.55 per point), and the reduction lasts the turn. Owned values sum.
  const grantPattern = /\b(?:have|has|gains?|gets?)\s+\[disarm(?: \d+)?\]/;
  const ownedText = text.replaceAll(new RegExp(grantPattern, 'g'), ' ');
  let disarm = 0;
  for (const match of ownedText.matchAll(/\[disarm(?: (\d+))?\]/g)) disarm += Number(match[1] ?? 1);
  if (disarm > 0) {
    add(
      'Disarm',
      'boardControl',
      Math.min(0.96, disarm * 0.32),
      /\[disarm(?: \d+)?\]/,
      `Disarm ${disarm}: each attack gives an enemy unit there -${disarm} Might for the turn. Attack-only, and it chooses its target, so Deflect taxes it.`,
    );
  }
  if (grantPattern.test(text)) {
    add(
      'Disarm grant',
      'effectValue',
      0.26,
      grantPattern,
      'Other friendly units gain Disarm; the value depends on how many of the named kind the deck attacks with.',
    );
  }

  // Deploy (CR 830): the gear is played to any battlefield, enemy-occupied ones included, is not recalled in
  // cleanup, and dies when an opponent holds there. Its "here" text works without a unit and cannot be
  // answered in combat; the hold clause is the price.
  const ownedDeploy = /(?<!\b(?:with|have|has|gain|gains) )\[deploy\]/;
  if (ownedDeploy.test(text)) {
    add(
      'Deploy placement',
      'effectValue',
      0.24,
      ownedDeploy,
      'Played straight to any battlefield and stays there without a unit; an opponent holding that battlefield kills it.',
      1,
    );
  }

  // Bomb gear tokens (CR 187.12): each is a delayed 2 damage to an enemy at its battlefield, and one Bomb
  // dying kills the controller's other Bombs there, so a stack goes off together.
  const bombs = bombTokensPlayed(text);
  if (bombs > 0) {
    const repeatable = /\[t\]\s*:\s*play (?:a|an|one) bomb\b|\],?\s*\[t\]\s*:\s*play (?:a|an|one) bomb\b/.test(text);
    add(
      'Bomb tokens',
      'boardControl',
      Math.min(1.4, 0.44 + (bombs - 1) * 0.3 + (repeatable ? 0.3 : 0)),
      /\bbomb (?:gear )?tokens?\b/,
      `${bombs} Bomb token${bombs === 1 ? '' : 's'}${repeatable ? ' per activation' : ''}: 2 damage each to an enemy at that battlefield when it dies, delayed until something kills it.`,
    );
  }

  // "Friendly [Deathknell] effects here trigger an additional time." (Detonation Amplifier)
  const deathknellDoubling = /\[deathknell\] effects?\b[^.!?]{0,24}\btrigger an additional time\b/;
  if (deathknellDoubling.test(text)) {
    add(
      'Deathknell doubling',
      'effectValue',
      0.42,
      deathknellDoubling,
      'Friendly Deathknell effects at that battlefield happen twice; the value is the deck\'s Deathknell and Bomb count.',
    );
  }

  // "Your gear with [Deploy] have [Action]." (Jarvan IV, Martial Paragon)
  const deployAction = /\bgear with \[deploy\] have \[action\]/;
  if (deployAction.test(text)) {
    add(
      'Deploy at Action speed',
      'effectValue',
      0.3,
      deployAction,
      'Deploy gear can be played in showdowns, onto the battlefield being fought over.',
    );
  }

  // Base Might set to a number ("Its base Might becomes 5 this turn."): a pump on a small unit, a shrink on
  // a large one. The ported families read neither.
  const baseMight = /\bbase might becomes? (?:(\d+)|equal to)\b/;
  const baseMightMatch = text.match(baseMight);
  const baseMightValue = baseMightMatch ? Number(baseMightMatch[1] ?? 4) : 0;
  if (baseMightValue > 0) {
    add(
      'Base Might set',
      'expectedStrength',
      Math.min(0.9, baseMightValue * 0.14),
      baseMight,
      `A unit's base Might is set (to ${baseMightMatch?.[1] ?? 'a variable amount'}) this turn: raises a small friendly unit or lowers a large enemy one.`,
    );
  }

  // "can't be chosen by enemy spells and abilities" as a static or granted protection.
  const untargetable = /\bcan'?t be chosen by enemy spells and abilities\b/;
  if (untargetable.test(text)) {
    add(
      'Cannot be chosen',
      'effectValue',
      0.4,
      untargetable,
      'Enemy spells and abilities cannot choose the unit (CR 756); stronger than Deflect, which only taxes.',
    );
  }

  // Variable-amount effects the ported families read only with a printed number -------------------------
  const variableDebuff = /\bgive (?:a|an|an enemy) (?:enemy )?unit [-–]\s?\[[ms]\] this turn equal to\b/;
  if (variableDebuff.test(text)) {
    add('Variable Might debuff', 'boardControl', 0.72, variableDebuff,
      'A chosen unit loses Might equal to a count the deck controls; valued at about a -2 Might debuff.');
  }
  const variableDamage = /\bdeal damage equal to its energy cost to a unit\b|\bdeal its energy cost as damage to a unit\b/;
  if (variableDamage.test(text)) {
    add('Cost-based damage', 'boardControl', 0.95, variableDamage,
      'Damage equal to the Energy cost of another card; valued at about 3 damage to a chosen unit.');
  }
  const paidKill = /\bto kill (?:a|an|an enemy) (?:enemy )?(?:unit|gear|unit or gear)\b/;
  if (paidKill.test(text)) {
    add('Paid removal', 'boardControl', 1.3, paidKill,
      'Kills a chosen unit or gear as the result of a cost paid in the same sentence ("you may discard 1 to kill ...").');
  }
  const extraChannel = /\bchannel that many runes plus \d+\b/;
  if (extraChannel.test(text)) {
    add('Extra rune channel', 'resourceValue', 0.62, extraChannel,
      'Every channel brings one more rune, exhausted: one extra Energy from the following turn on.');
  }
  const payLess = /\bpay (?:\[[^\]]+\])+ less to play\b/;
  if (payLess.test(text)) {
    add('Play discount', 'resourceValue', 0.5, payLess, 'A repeatable discount on the named kind of card.');
  }
  const optionalReady = /\byou may have me enter ready\b/;
  if (optionalReady.test(text)) {
    add('Optional enter ready', 'effectValue', 0.42, optionalReady,
      'May enter ready at the price printed in the same ability (CR 149.1: units normally enter exhausted).');
  }
  const impulse = /\bbanish the top card of your main deck\b[^]{0,60}\byou may play that card\b/;
  if (impulse.test(text)) {
    add('Play from the top of the deck', 'cardAdvantage', 0.5, impulse,
      'The banished top card can be played for a limited time: a card of advantage when it is castable in that window.');
  }
  const massRecursion = /\bplay up to (\d+|two|three) (?:units?|gear|units and\/or gear)[^.!?]{0,24}\bfrom your trash\b[^.!?]{0,120}\bignoring (?:their|its) costs?\b/;
  if (massRecursion.test(text)) {
    add('Mass recursion', 'cardAdvantage', 1.5, massRecursion,
      'Several cheap units or gear return from the trash without paying their costs; needs a filled trash.');
  }
  const bombRelocation = /\bkill any number of friendly bomb tokens\b/;
  if (bombRelocation.test(text)) {
    add('Bomb detonation', 'boardControl', 0.5, bombRelocation,
      'Sets off the Bombs already on the board (2 damage each where they die) and puts the same number back.');
  }
  // Predict N (CR 437): look at the top N, recycle any, order the rest. The ported rating values Vision
  // (0.14) but gave Predict nothing, in any set.
  const predict = /\[predict(?: (\d+))?\]/;
  const predictMatch = text.match(predict);
  if (predictMatch) {
    add('Predict selection', 'effectValue', Math.min(0.3, 0.1 + 0.06 * Number(predictMatch[1] ?? 1)), predict,
      `Predict ${predictMatch[1] ?? 1}: filters the next draws.`);
  }

  // [Add] of plain Energy or of a domain's Power ("[Exhaust]: [Reaction] — [Add] [1].", the Seals' "[Add]
  // [Fury]."). The ported rating values only "[Add] [A]" (0.55 * 0.55 per symbol); the same rate is used here
  // so that an Energy or domain-Power source is not rated as a blank card.
  let added = 0;
  for (const match of text.matchAll(/\[add\]\s*\[(\d+|c)\](?!\s*\[a\])/g)) added += match[1] === 'c' ? 1 : Number(match[1]);
  if (/\[add\] that much\b/.test(text)) added += 1;
  if (added > 0) {
    add('Energy acceleration', 'resourceValue', Math.min(1.1, added * 0.3025), /\[add\]/,
      `Adds ${added} Energy or Power of its domain per use.`);
  }

  // Effects that left a card with text and an empty value ledger (pool report 2026-11-12) -----------------
  // Gold gear token (CR 187: "[Reaction] Kill this, [Exhaust]: [Add] [A]"): one stored Power each. The
  // ported token value covers unit tokens only.
  let gold = 0;
  for (const match of text.matchAll(/\bplays? (a|an|one|two|three|four|five|\d+) (?:ready )?gold gear tokens?\b/g)) {
    gold += WORD_NUMBER[match[1] ?? 'a'] ?? (Number(match[1]) || 1);
  }
  if (gold > 0 && !/\bits controller plays a gold\b/.test(text)) {
    add('Gold tokens', 'resourceValue', Math.min(1.1, gold * 0.3), /\bgold gear tokens?\b/,
      `${gold} Gold gear token${gold === 1 ? '' : 's'}: each is one Power of any domain, spent once.`);
  }
  const simple: readonly [string, ForgeSemanticComponent, number, RegExp, string][] = [
    ['Blink', 'effectValue', 0.6, /\bbanish a friendly unit, then its owner plays it\b/,
      'A friendly unit leaves and returns at once: it dodges a removal spell and repeats its play effect.'],
    ['Death prevention', 'effectValue', 0.7, /\bthe next time it would die this turn, heal it\b/,
      'The chosen friendly unit survives its next death this turn and is recalled.'],
    ['Gear bounce', 'boardControl', 0.5, /\breturn a gear to its owner'?s hand\b/,
      'Returns a gear to hand: tempo against an enemy gear, or a replay of a friendly one.'],
    ['Hand disruption', 'boardControl', 0.8, /\breveals? their hand\b[^]{0,90}\b(?:recycle|discards?|banish)\b/,
      'The opponent reveals their hand and loses a chosen card from it.'],
    ['Conditional removal', 'boardControl', 1.4, /\bbanish it\. otherwise, return it to its owner'?s hand\b/,
      'A chosen unit is banished when small and returned to hand otherwise.'],
    ['Symmetric gear kill', 'boardControl', 0.4, /\beach player kills one of their gear\b/,
      'Each player loses a gear; the value is the difference between the two boards.'],
    ['Scalable sweep', 'boardControl', 1.2, /\bpay any amount of \[a\] to deal that much damage to all enemy units\b/,
      'Damage to every enemy unit at a battlefield, bought with Power.'],
    ['Reanimation', 'cardAdvantage', 0.9, /\bplay a unit\b[^.!?]{0,70}\bfrom your trash, ignoring its cost\b/,
      'A cheap unit returns from the trash without paying its cost.'],
    ['Discounted deployment', 'resourceValue', 0.6, /\bplay a unit from hand to a battlefield you control, reducing its cost by \[\d+\]/,
      'A unit is played straight to a controlled battlefield at a discount.'],
    ['Damage doubling', 'boardControl', 0.6, /\bdouble all damage that would be dealt to it\b/,
      'Damage to the chosen unit is doubled this turn.'],
    ['Might swap', 'effectValue', 0.5, /\bswap the mights of two units\b/,
      'Two units at one battlefield trade Might for the turn.'],
    ['Empower toggle', 'effectValue', 0.4, /\bempower a unit\. disempower it at end of turn\b/,
      'Turns Empowered on for a friendly unit for a turn, or off for an enemy one.'],
    ['Dig and play', 'cardAdvantage', 0.9, /\bbanish a unit or gear from among them and play it, reducing its energy cost by \[\d+\]/,
      'Finds a unit or gear in the top cards and plays it at a large discount.'],
    ['Flexible placement', 'effectValue', 0.4, /\bcan be played to any battlefield\b/,
      'The next unit can be played to any battlefield, enemy-occupied ones included.'],
  ];
  for (const [label, component, value, pattern, detail] of simple) if (pattern.test(text)) add(label, component, value, pattern, detail);
}
