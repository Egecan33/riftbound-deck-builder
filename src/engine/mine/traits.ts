// Ported from Riftfoundry apps/web/src/lib/scoring.ts at origin/main 4b90179 (lines 1356-1660): deriveTraits.
// Port rule (spec 8.1): behaviour unchanged; top-level declarations are exported so the split files can share them.
import {
  burnDirection,
  damageDirection,
  discardDirection,
  gearInteractionDirection,
  mightReductionDirection,
  movementDirection,
  removalDirection,
  returnDirection,
  scoringDirection,
  tokenDirection,
} from "./directions";
import {
  type Trait,
} from "./labels";
import { addForgeTraits } from "./radiance";
import { refineForgeTraits } from "./refine";
import {
  isEquipmentCard,
  readyInteractionDirection,
  requiresFriendlyEquipment,
  rulesForScoring,
} from "./text";
import {
  type ScoreCard,
} from "./types";

// Forge addition (not in the port): the traits of a card depend only on the card, and the ported deck score
// and pair analysis ask for them thousands of times per deck. Memoised per ScoreCard object; every caller
// gets its own copy, so a caller that edits its set cannot change another's.
const traitCache = new WeakMap<ScoreCard, ReadonlySet<Trait>>();
export function deriveTraits(card: ScoreCard): Set<Trait> {
  let held = traitCache.get(card);
  if (!held) traitCache.set(card, (held = computeTraits(card)));
  return new Set(held);
}

function computeTraits(card: ScoreCard): Set<Trait> {
  const text = rulesForScoring(card);
  const traits = new Set<Trait>();
  const has = (pattern: RegExp) => pattern.test(text);
  const discard = discardDirection(text);
  const removal = removalDirection(text);
  const damage = damageDirection(text);
  const returns = returnDirection(text);
  const mightReduction = mightReductionDirection(text);
  const tokens = tokenDirection(text);
  const burn = burnDirection(text);
  const scoring = scoringDirection(text);
  const movement = movementDirection(text);
  const ready = readyInteractionDirection(text);
  const gearInteraction = gearInteractionDirection(text);

  if (card.type === "unit") traits.add("unit");
  if (card.type === "spell") traits.add("spell");
  if (card.type === "gear") traits.add("gear");
  if (isEquipmentCard(card)) traits.add("equipment");
  if (
    (card.type.includes("unit") && card.type.includes("gear")) ||
    card.superTypes?.some((type) => type.toLocaleLowerCase() === "gear") ||
    card.accessibilityText
      ?.toLocaleLowerCase()
      .startsWith("riftbound unit, gear:")
  ) {
    traits.add("unit");
    traits.add("gear");
    traits.add("unit-gear");
  }

  if (has(/\[action\]/)) traits.add("action");
  if (has(/\[reaction\]/)) traits.add("reaction");
  if (has(/\[accelerate\]/)) traits.add("accelerate");
  if (has(/\[ambush\]/)) traits.add("ambush");
  if (has(/\[assault(?: \d+)?\]/)) traits.add("assault");
  if (has(/\[backline\]/)) traits.add("backline");
  if (has(/\[deflect(?: \d+)?\]/)) traits.add("deflect");
  if (has(/\[equip\]/)) traits.add("equip");
  if (has(/\[ganking\]|\bganking\b/)) traits.add("ganking");
  if (has(/\[hidden\]/)) traits.add("hidden");
  if (has(/\[legion\]/)) traits.add("legion");
  if (has(/\[mighty\]/)) traits.add("mighty");
  if (has(/\[quick-draw\]/)) {
    traits.add("quick-draw");
    traits.add("reaction");
    traits.add("equip");
  }
  if (has(/\[repeat\]/)) traits.add("repeat");
  if (has(/\[shield(?: \d+)?\]/)) traits.add("shield");
  if (has(/\[stun\]|\bstun(?:ned)?\b/)) traits.add("stun");
  if (has(/\[tank\]/)) traits.add("tank");
  if (has(/\[temporary\]/)) traits.add("temporary");
  if (has(/\[unique\]/)) traits.add("unique");
  if (has(/\[vision\]/)) traits.add("vision");
  if (has(/\[weaponmaster\]/)) {
    traits.add("weaponmaster");
    traits.add("equip");
    traits.add("equipment-matters");
  }

  if (has(/\[empower\]|\bempower (?:a|an|another|up to|me|this|something)/)) {
    traits.add("empower");
  }
  if (has(/\[empowered\]|if (?:i|'?m|it|'?s|they|'?re).*empowered/)) {
    traits.add("empowered-payoff");
  }
  if (has(/\bdisempower\b/)) traits.add("disempower");
  if (has(/\[flow\]|play (?:this|cards?) from (?:your )?trash/)) {
    traits.add("flow");
    traits.add("trash-payoff");
  }

  if (has(/\[hunt(?: \d+)?\]|\bgain \d+ xp\b/)) traits.add("hunt");
  if (has(/\[level \d+\]/)) traits.add("level");
  if (has(/\bspend \d+ xp\b|\bpay \d+ xp\b|\byour xp\b/)) {
    traits.add("xp-spend");
  }

  if (burn.selfAmount > 0) {
    traits.add("burn-self");
    traits.add("trash-filler");
  }
  if (burn.opponentAmount > 0) {
    traits.add("burn-opponent");
  }
  if (burn.payoff) {
    traits.add("burn-payoff");
  }
  if (
    has(
      /from (?:your|the) trash|in (?:your|the) trash|cards? in (?:your|the) trash|trash has/,
    )
  ) {
    traits.add("trash-payoff");
  }
  if (
    has(
      /(?:return|put|choose|play) (?:a|an|up to \d+|target)? ?cards?.{0,30}from (?:your|the) trash/,
    )
  ) {
    traits.add("trash-retrieval");
  }
  if (removal.trashBanish) {
    traits.add("trash-banish");
  }
  if (removal.banishPayoff) {
    traits.add("banish-payoff");
  }
  if (removal.banishEnabler) traits.add("banish-enabler");

  const buffProductionText = text
    .replaceAll(/\bwhen you buff\b[^,.]*/g, "")
    .replaceAll(/\bwhen (?:a|one or more|the) buffed\b[^,.]*/g, "")
    .replaceAll(/\bwhile [^,.]*buffed\b/g, "");
  if (
    /\b(?:buff|\[buff\]) (?:me|a|an|another|all|each|friendly|up to|one|this)\b/.test(
      buffProductionText,
    )
  ) {
    traits.add("buff-producer");
  }
  if (
    has(
      /spend.{0,28}buff|for each.{0,20}buff|if [^,.]*buff|while [^,.]*buffed|buffed friendly|when you buff/,
    )
  ) {
    traits.add("buff-consumer");
  }
  if (
    removal.killCount > 0 ||
    removal.friendlyKillCount > 0 ||
    removal.deathPayoff ||
    has(/\bdies?\b|deathknell/)
  ) {
    traits.add("death");
  }
  if (removal.friendlyKillCount > 0 || has(/\bsacrifice\b/)) {
    traits.add("death-enabler");
  }
  if (removal.deathPayoff) {
    traits.add("death-payoff");
  }
  if (discard.selfAmount > 0 || discard.symmetric) {
    traits.add("discard");
    if (
      has(
        /(?:^|[.!?;:—]\s*|\]\s*|,\s*|\bthen\s+)(?:you\s+(?:may\s+)?)?discard (?:the top|this|from your main deck)/,
      )
    ) {
      traits.add("trash-filler");
    }
  }
  if (discard.payoff) {
    traits.add("discard-payoff");
  }
  const drawText = text.replaceAll(/\[quick-draw\]/g, " ");
  if (/\bdraw\b|put .* into your hand/.test(drawText)) traits.add("draw");
  if (gearInteraction.friendlySupport) {
    traits.add(
      requiresFriendlyEquipment(card, text)
        ? "equipment-matters"
        : "gear-matters",
    );
  }
  if (requiresFriendlyEquipment(card, text)) {
    traits.add("equipment-matters");
  }
  if (
    has(/\bcounter\b/) ||
    discard.opponentAmount > 0 ||
    removal.killCount > 0 ||
    removal.banishCount > 0 ||
    removal.handDisruptionCount > 0 ||
    damage.hostileAmount > 0 ||
    mightReduction.hostileAmount > 0 ||
    returns.enemyCount > 0 ||
    returns.flexibleCount > 0 ||
    returns.symmetric ||
    movement.enemyCount > 0 ||
    scoring.denial ||
    movement.lock ||
    movement.tax ||
    ready.denial ||
    gearInteraction.hostileOrSymmetric
  ) {
    traits.add("interaction");
  }
  if (
    removal.killCount > 0 ||
    removal.banishCount > 0 ||
    returns.enemyCount > 0 ||
    returns.flexibleCount > 0
  ) {
    traits.add("removal");
  }
  if (
    damage.hostileAmount > 0 ||
    has(
      /\bdeal damage equal to (?:its|their|that unit'?s|my) might\b|\bpay any amount of \[c\] to deal that much damage\b/,
    )
  ) {
    traits.add("damage-provider");
  }
  if (
    has(
      /\bany amount of (?:your|friendly) damage is enough to kill (?:an? |any |all )?enemy units?\b/,
    )
  ) {
    traits.add("lethal-damage-conversion");
  }
  if (has(/\bcounter\b/)) traits.add("counter");
  if (
    movement.friendlyCount > 0 ||
    movement.enemyCount > 0 ||
    has(
      /\[ganking\]|\bganking\b|\bgive [^.!?]{0,32}\[ganking\]\b|open battlefield/,
    )
  ) {
    traits.add("movement");
  }
  if (movement.payoff) {
    traits.add("movement-payoff");
  }
  if (has(/\bpredict\b|look at the top \d+|top \d+ cards?/)) {
    traits.add("predict");
  }
  if (has(/if the top card|revealed card|card on top|put .* on top/)) {
    traits.add("topdeck-payoff");
  }
  if (ready.self || ready.external || ready.payoff) traits.add("ready");
  if (has(/\bexhaust\b|\[t\]/)) traits.add("exhaust");
  if (has(/\brecycle\b/)) traits.add("recycle");
  if (has(/\bchannel \d+ rune/)) traits.add("channel-rune");
  if (has(/\[add\]|add \d+ energy/)) traits.add("energy-ramp");
  if (has(/runes? you control|control \d+ or (?:more|fewer) runes/)) {
    traits.add("rune-count-payoff");
  }
  if ((card.power ?? 0) >= 2) traits.add("power-demand");
  if (
    scoring.ownPoints > 0 ||
    has(
      /\bconquer\b|\bhold\b|\bwhen (?:you|i) (?:conquer|hold)\b|\bif you (?:conquer|hold)\b/,
    )
  ) {
    traits.add("scoring");
  }
  if (
    has(
      /\b(?:when|whenever|after|if|while) [^,.!?]{0,56}\bconquer\b|\bconquer a battlefield\b/,
    )
  ) {
    traits.add("conquer");
  }
  if (
    has(
      /\b(?:when|whenever|after|if|while) [^,.!?]{0,56}\bhold\b|\bhold a battlefield\b/,
    )
  ) {
    traits.add("hold");
    traits.add("hold-payoff");
  }
  if (
    has(
      /\b(?:your|friendly|all) hold (?:effects?|abilities)\b[^.!?]{0,64}\b(?:trigger|triggers|activate|activates|happen|resolve)(?:s)?\b[^.!?]{0,32}\b(?:again|additional|extra|twice|time)\b|\bhold (?:effects?|abilities)\b[^.!?]{0,48}\btrigger an additional time\b/,
    )
  ) {
    traits.add("hold-enabler");
  }
  if (has(/when you play a spell|your spells|spell you|for each spell/)) {
    traits.add("spell-matters");
  }
  if (tokens.controllerProduces) traits.add("token");
  if (tokens.matters) {
    traits.add("token-matters");
  }
  if (
    has(/other friendly units|each friendly unit|two .*units|three .*units/)
  ) {
    traits.add("wide");
  }
  if (
    has(/costs? (?:\[[^\]]*\])+\s*less|costs? \d+ less|reduce .* cost|discount/)
  ) {
    traits.add("cost-reduction");
  }
  if (has(/\bcopy of\b|\bcopy (?:a|the|this)/)) traits.add("card-copy");
  if (has(/\bname a card\b|\bname a tag\b|cards? with (?:the|that) name/)) {
    traits.add("card-naming");
  }
  if (has(/\bheal\b|remove .* damage/)) traits.add("heal");
  if (has(/\bprevent .* damage|can'?t be dealt damage/)) {
    traits.add("damage-prevention");
  }
  if (has(/\bskip\b|additional turn|\bturn after this\b/)) {
    traits.add("skip");
  }
  if (has(/while .*stunned|for each stunned|if .*stunned/)) {
    traits.add("stun-payoff");
  }

  // Forge addition (not in the port): Radiance keywords and coverage gaps, see radiance.ts.
  // Forge addition for plan Task 5 (role point-source): the card itself scores points for its controller.
  if (scoring.ownPoints > 0) traits.add("point-gain");
  addForgeTraits(card, text, traits);
  // Forge addition (stage 3 review): missed effects and mentions read as effects, see refine.ts.
  refineForgeTraits(card, text, traits);

  return traits;
}
