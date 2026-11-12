// Review fixes of the card mine (stage 3 review of plan Tasks 4 and 5, 2026-11-12). New code, not a port.
//
// An audit of 60 cards read against their current text (20 Radiance, 10 errata'd, the 15 longest texts, 15
// random) found defect classes that the ported patterns and the first Forge extension share. Each is fixed
// here, at the level of the wording, with a test that quotes a real card (tests/engine/mine/refine.test.ts):
//   - effects with no trait: taking control of a unit, damage of a counted amount ("equal to its [Shield]"),
//     a forced kill by the opponent ("the defender must kill one of their units"), playing a card without
//     paying for it, returning or flickering one's own unit, saving a unit that would die;
//   - a mention read as the effect: "When you stun ..." and "would stun me" gave the Stun provider trait,
//     "kill this instead" gave Death enabler, "up to two units" gave Go wide;
//   - direction: "4 or fewer runes" was a rune-count payoff next to rune channelling, which it punishes;
//   - a restriction read as an ability: "Play me only to ..." was Flexible placement.
// refineForgeTraits runs last in deriveTraits. Unlike addForgeTraits it also removes traits; every removal
// is narrow: the trait goes only when none of the text supports it once the mention is set aside.
//
// HEURISTIC: text patterns over the mine's normalised text (lower case, reminder text removed, symbols as
// [s] Might and [t] exhaust).
import type { ScoreCard } from './types';

/** Trait ids added by the review. radiance.ts merges them into FORGE_TRAIT_LABELS. */
export const REVIEW_TRAIT_LABELS = {
  steal: 'Takes control of a unit',
  'cost-cheat': 'Plays cards without paying their cost',
  'replay-unit': 'Returns or replays own units (bounce / flicker)',
  'play-effect': 'Play effect (when you play me)',
  'death-prevention': 'Saves a unit that would die',
  'low-rune-payoff': 'Rewards having few runes',
  'might-damage': 'Deals damage equal to Might',
} as const;

interface TraitSet { add(trait: string): unknown; has(trait: string): boolean; delete(trait: string): unknown }

const sentencesOf = (text: string): string[] => text.split(/\n+|(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

// Effects with no trait --------------------------------------------------------------------------------------
const STEAL = /\btake control of (?:it|them|that unit|an? (?:enemy )?unit|any enemy unit|an enemy)\b/;
const CONTROL_SPELL = /\bgain control of (?:a|an|it|that) ?(?:enemy )?(?:spell)?\b/;
const COUNTED_DAMAGE = /\bdeals? damage equal to [^.!?]{1,40}? to (?:a|an|another|all|each|enemy|that|it)\b/;
const MIGHT_DAMAGE = /\bdeals? damage equal to (?:its|their|my|our|that unit'?s) mights?\b/;
const ENEMIES_FIGHT = /\banother enemy unit\b[^.!?]*\.\s*they deal damage equal to their mights\b/;
const EDICT = /\b(?:the defender|each opponent|an opponent|that opponent|that player|they) (?:must )?kills? one of their units\b/;
const FRIENDLY_DEATH_WATCH = /\bthe first time a(?:nother)? friendly unit dies\b/;
const COST_CHEAT = /\bignoring (?:its|their|that card'?s|any and all) (?:energy |power )?costs?\b/;
const OPPONENT_PLAYS = /\b(?:they|that player|an opponent|its controller) plays?\b/;
const SELF_BOUNCE =
  /\breturn (?:a|an|another|up to \w+|that) (?:other )?(?:friendly (?:gear, )?unit|unit you control)\b[^.!?]{0,30}\bto (?:its|their) owners?'? ?s? hands?\b|\breturn a friendly unit and an enemy unit to their owners'? hands?\b/;
/** Flicker: "Banish a friendly unit, then its owner plays it ..., ignoring its cost." The unit is played again. */
const FLICKER = /\bbanish (?:a|an|another|that many|up to \w+) (?:friendly )?units?(?: you control)?,? then (?:for each, )?its owner plays\b/;
const PLAY_EFFECT = /\bwhen you play me\b/;
const DEATH_PREVENTION = /\bwould die\b[^.!?]*\b(?:heal|recall)\b|\bwould die\b[^.!?]{0,60}\binstead\. heal\b/;
/** "kill this instead" / "kill Guardian Angel instead": the card that dies in the unit's place. */
const DIES_IN_PLACE = /\bwould die\b[^.!?]*\bkill [a-z' ]+ instead\b/;
const SPELL_ONLY_RESOURCE = /\buse (?:this (?:power|energy) )?only to play spells\b/;
const PLAY_FROM_ELSEWHERE = /\bplay a card from anywhere other than your hand\b/;

// A mention read as the effect ----------------------------------------------------------------------------------
/** "When you stun ...", "would stun me", "If you stunned ...": the card reacts to a stun, it does not stun. */
const STUN_MENTION = /\b(?:when(?:ever)? you|would|if you|each time you|the first time you) (?:\[stun\]|stun)\b/g;
const STUN_ACT = /\[stun\]|\bstun\b/;
/** A count of chosen units ("up to two units", "the Mights of two units"): targets, not a board gone wide. */
const TARGET_COUNT = /\b(?:up to|mights of|choose|to|of) (?:up to )?(?:two|three) (?:[a-z]+ ){0,2}units\b/g;
const WIDE_PORTED = /other friendly units|each friendly unit|two .*units|three .*units/;
const LOW_RUNES = /\b\d+ or fewer runes\b|\bfewer runes than\b/;
const RUNE_COUNT_ANY = /runes? you control|control \d+ or (?:more|fewer) runes|\b\d+\+ runes\b|\bfewer runes\b|\bmore runes\b/;

/**
 * Corrects a card's trait set after the ported patterns and addForgeTraits ran.
 * @param text the mine's normalised text (rulesForScoring)
 */
export function refineForgeTraits(card: ScoreCard, text: string, traits: TraitSet): void {
  const has = (pattern: RegExp): boolean => pattern.test(text);
  const sentences = sentencesOf(text);

  // Taking control of an enemy unit removes it from their board and adds it to yours.
  if (has(STEAL)) {
    traits.add('steal');
    traits.add('removal');
    traits.add('interaction');
  }
  if (has(CONTROL_SPELL)) traits.add('interaction');
  if (has(COUNTED_DAMAGE)) {
    traits.add('damage-provider');
    traits.add('interaction');
  }
  // "Choose another enemy unit ... They deal damage equal to their Mights to each other" (Dragon's Rage)
  // makes two enemy units fight: no Might of yours is dealt.
  if (has(MIGHT_DAMAGE) && !ENEMIES_FIGHT.test(text)) traits.add('might-damage');
  if (has(EDICT)) {
    traits.add('removal');
    traits.add('interaction');
    traits.add('death');
  }
  if (has(FRIENDLY_DEATH_WATCH)) traits.add('death-payoff');
  // "They play that unit ..., ignoring any and all costs" pays for the opponent's card, not yours.
  // A flicker replays the same unit; that is a replay, not a cheaper card.
  if (sentences.some((s) => COST_CHEAT.test(s) && !OPPONENT_PLAYS.test(s) && !FLICKER.test(s))) traits.add('cost-cheat');
  if (has(SELF_BOUNCE) || has(FLICKER)) traits.add('replay-unit');
  if (card.type === 'unit' && has(PLAY_EFFECT)) traits.add('play-effect');
  if (has(DEATH_PREVENTION)) traits.add('death-prevention');
  if (has(SPELL_ONLY_RESOURCE)) traits.add('spell-matters');
  if (has(PLAY_FROM_ELSEWHERE)) {
    traits.add('trash-payoff');
    traits.add('hidden-matters');
  }

  // Stun: the provider trait needs a stun the card performs.
  if (traits.has('stun') && !STUN_ACT.test(text.replaceAll(STUN_MENTION, ' ').replaceAll(/\bstunned\b/g, ' '))) {
    traits.delete('stun');
  }
  // Death enabler: "If a friendly unit would die, kill this instead" sacrifices nothing on demand.
  if (traits.has('death-enabler') && has(DEATH_PREVENTION)) {
    const kills = sentences.filter((s) => /\bkills?\b|\bsacrifice\b/.test(s));
    if (kills.length > 0 && kills.every((s) => DIES_IN_PLACE.test(s))) traits.delete('death-enabler');
  }
  // Go wide: only target counts in the text.
  if (traits.has('wide') && !WIDE_PORTED.test(text.replaceAll(TARGET_COUNT, ' '))) traits.delete('wide');
  // Rune count: "if you control 4 or fewer runes" rewards staying low; channelling runes turns it off.
  if (traits.has('rune-count-payoff') && has(LOW_RUNES)) {
    const rest = sentences.filter((s) => !LOW_RUNES.test(s)).join(' ');
    if (!RUNE_COUNT_ANY.test(rest)) traits.delete('rune-count-payoff');
    traits.add('low-rune-payoff');
  }
}

type Component = 'expectedStrength' | 'effectValue' | 'cardAdvantage' | 'boardControl' | 'resourceValue' | 'costsAndDrawbacks';
type Add = (label: string, component: Component, rawValue: number, pattern: RegExp, detail: string, activationOverride?: number) => void;

/**
 * Effect families the rating had no value for. HEURISTIC priors, set beside the ported value of the
 * closest family: saving a unit from death beside a combat trick that wins a fight (0.9), damage equal
 * to a Shield beside a small fixed ping (0.8). None is measured.
 */
export function addReviewSemanticFamilies(add: Add, text: string): void {
  if (DEATH_PREVENTION.test(text)) {
    add(
      'Death prevention',
      'boardControl',
      0.9,
      /\bwould die\b/,
      'Saves a friendly unit that would die: the opponent\'s removal or winning combat is undone and the unit stays.',
    );
  }
  // Damage equal to an Energy cost has a ported family ("Cost-based damage"); Shield had none.
  if (/\bdeals? damage equal to (?:its|my) \[shield\]/.test(text)) {
    add(
      'Counted damage',
      'boardControl',
      0.8,
      /\bdeals? damage equal to\b/,
      'Deals damage equal to a unit\'s Shield: removal whose size depends on the Shield in play.',
    );
  }
}
