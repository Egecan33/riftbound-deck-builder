// Ported from Riftfoundry apps/web/src/lib/scoring.ts at origin/main 4b90179 (lines 3111-3684): structured semantic valuation (the effect-family registry).
// Port rule (spec 8.1): behaviour unchanged; top-level declarations are exported so the split files can share them.
import {
  type RuleClauseActivation,
  activationForEffects,
} from "./clauses";
import {
  round,
} from "./directions";
import { addForgeSemanticFamilies } from "./radiance";
import {
  clamp,
  writtenNumber,
} from "./text";

export type StructuredSemanticComponent =
  | "expectedStrength"
  | "effectValue"
  | "cardAdvantage"
  | "boardControl"
  | "resourceValue"
  | "costsAndDrawbacks";

export interface StructuredSemanticContribution {
  activation: number;
  component: StructuredSemanticComponent;
  detail: string;
  label: string;
  value: number;
}

export interface StructuredSemanticValuation {
  contributions: readonly StructuredSemanticContribution[];
  expectedStrength: number;
  effectValue: number;
  cardAdvantage: number;
  boardControl: number;
  resourceValue: number;
  costsAndDrawbacks: number;
}

/**
 * Structured, name-agnostic rules semantics that sit between primitive word
 * counts and deck-context packages. These priors cover effects whose value is
 * carried by the relationship between two clauses (for example, transferring
 * a delayed hazard) or by a variable object (Might, Energy cost, top-N access).
 *
 * Each positive is:
 * - direction checked, so an opponent benefit or mandatory friendly loss does
 *   not masquerade as controller value;
 * - activation and modal-share gated through the same clause model as every
 *   other rules-text family;
 * - bounded here, leaving the larger supported ceiling to deck synergies; and
 * - emitted as its own mechanic ledger entry below.
 */
export function structuredSemanticValuation(
  clauses: readonly RuleClauseActivation[],
  text: string,
): StructuredSemanticValuation {
  const contributions: StructuredSemanticContribution[] = [];

  const add = (
    label: string,
    component: StructuredSemanticComponent,
    rawValue: number,
    pattern: RegExp,
    detail: string,
    activationOverride?: number,
  ) => {
    if (!Number.isFinite(rawValue) || Math.abs(rawValue) < 0.005) return;
    const activation = round(
      clamp(
        activationOverride ?? activationForEffects(clauses, pattern),
        0.12,
        1,
      ),
      3,
    );
    contributions.push({
      activation,
      component,
      detail,
      label,
      value: round(rawValue * activation, 3),
    });
  };

  // Interaction and control -------------------------------------------------
  const temporaryTargetPattern =
    /\bgive (?:a|an|the|chosen|target) (?:unit|gear)\b[^.!?]{0,48}\[temporary\]/;
  if (
    temporaryTargetPattern.test(text) &&
    !/\bgive (?:me|this (?:unit|gear|card))\b[^.!?]{0,32}\[temporary\]/.test(
      text,
    )
  ) {
    add(
      "Temporary removal",
      "boardControl",
      0.96,
      temporaryTargetPattern,
      "A chosen opposing permanent receives delayed hard removal; friendly use remains optional rather than assumed.",
    );
  }

  const negativeMightPattern =
    /\bgive (?:a|an|the|chosen|target) unit\b[^.!?]{0,32}-(\d+) (?:\[[ms]\](?=\s|[.!?,;:]|$)|might\b)/;
  const negativeMightAmount = Number(
    text.match(negativeMightPattern)?.[1] ?? 0,
  );
  if (negativeMightAmount > 0) {
    add(
      "Chosen Might debuff",
      "boardControl",
      Math.min(1.45, negativeMightAmount * 0.36),
      negativeMightPattern,
      "A freely chosen unit can be weakened; the value is capped below removal and does not assume a friendly target.",
    );
  }

  const symmetricKillPattern =
    /\beach player chooses? (?:a|one) unit they control\b[\s\S]{0,48}\bkill the rest\b/;
  if (symmetricKillPattern.test(text)) {
    add(
      "Symmetric board purge",
      "boardControl",
      2.15,
      symmetricKillPattern,
      "A mass unit purge creates a large but symmetric reset; controller value assumes only modest timing advantage.",
    );
    add(
      "Symmetric board purge liability",
      "costsAndDrawbacks",
      -1.05,
      symmetricKillPattern,
      "The controller must also lose all but one chosen unit.",
    );
  }

  const symmetricRecyclePattern =
    /\beach player chooses? \d+ units?, \d+ gear, \d+ runes?, and \d+ cards? in their hands?\b[\s\S]{0,48}\brecycle the rest\b/;
  if (symmetricRecyclePattern.test(text)) {
    add(
      "Mass recycle reset",
      "boardControl",
      1.9,
      symmetricRecyclePattern,
      "A multi-zone reset can dismantle developed boards while preserving only a bounded controller timing edge.",
    );
    add(
      "Symmetric recycle liability",
      "costsAndDrawbacks",
      -0.92,
      symmetricRecyclePattern,
      "The same board, Rune, and hand compression applies to the controller.",
    );
  }

  const burnBuffPattern =
    /\bwhen you burn (?:a|the) unit this way\b[^.!?]{0,80}\bgive a friendly unit \+\[[ms]\] equal to the burned card'?s might\b/;
  if (burnBuffPattern.test(text)) {
    add(
      "Burn-derived Might conversion",
      "expectedStrength",
      1.05,
      burnBuffPattern,
      "A burned unit's variable Might becomes a bounded temporary friendly buff; the Burn cost is itemized separately.",
    );
  }

  const transferredHazardPattern =
    /\bgain control of this and recall it\b[\s\S]{0,160}\bat the end of your turn, kill this and deal (\d+) to all units you control\b/;
  if (transferredHazardPattern.test(text)) {
    const hazardDamage = Number(text.match(transferredHazardPattern)?.[1] ?? 0);
    add(
      "Transferred delayed hazard",
      "boardControl",
      Math.min(2.15, 0.55 + hazardDamage * 0.2),
      /\bgain control of this and recall it\b/,
      "Control transfer makes the delayed self-destruct a hostile board hazard; activation and delay keep it below an immediate wipe.",
    );
  }

  const discardedEnergyDamagePattern =
    /\bdiscard 1\b[\s\S]{0,64}\bdeal its energy cost as damage to (?:a|an|the|chosen) unit\b/;
  if (discardedEnergyDamagePattern.test(text)) {
    add(
      "Discarded-Energy damage",
      "boardControl",
      1.28,
      discardedEnergyDamagePattern,
      "A discarded card converts variable Energy cost into targeted damage; the discarded card is charged separately.",
    );
  }

  const deploymentLockPattern =
    /\bopponents can only play units to their base\b/;
  if (deploymentLockPattern.test(text)) {
    add(
      "Battlefield play restriction",
      "effectValue",
      0.82,
      deploymentLockPattern,
      "Opposing units are denied direct battlefield deployment while the source remains in position.",
    );
  }
  const readyLockPattern =
    /\bspells and abilities can'?t ready enemy units and gear\b/;
  if (readyLockPattern.test(text)) {
    add(
      "Ready prevention",
      "boardControl",
      0.68,
      readyLockPattern,
      "Enemy unit and Gear action-economy recovery is disabled without being treated as friendly readying.",
    );
  }

  const spellControlPattern =
    /\bgain control of a spell\b[\s\S]{0,72}\bmake new choices for it\b/;
  if (spellControlPattern.test(text)) {
    add(
      "Spell control",
      "effectValue",
      1.42,
      spellControlPattern,
      "Taking control of a live spell and redirecting its choices converts opposing investment into bounded interaction value.",
    );
  }

  const handRecyclePattern =
    /\bopponent\b[\s\S]{0,96}\breveal(?:s)? their hand\b[\s\S]{0,120}\bchoose a non-unit card\b[\s\S]{0,72}\brecycle that card\b/;
  if (handRecyclePattern.test(text)) {
    add(
      "Opponent hand recycle",
      "cardAdvantage",
      0.78,
      handRecyclePattern,
      "Targeted hand information plus forced recycle denies one selected non-unit card.",
    );
  }

  const bilateralStunPattern = /\bstun a friendly unit and an enemy unit\b/;
  if (bilateralStunPattern.test(text)) {
    add(
      "Bilateral stun",
      "boardControl",
      0.76,
      bilateralStunPattern,
      "The enemy loses a combat window; the paired friendly stun is charged as a separate liability.",
    );
    add(
      "Friendly stun liability",
      "costsAndDrawbacks",
      -0.42,
      bilateralStunPattern,
      "Resolving the effect also stuns a friendly unit.",
    );
  }

  const damageDoomPattern = /\bwhen any unit takes damage this turn, kill it\b/;
  if (damageDoomPattern.test(text)) {
    add(
      "Lethal damage conversion",
      "boardControl",
      1.9,
      damageDoomPattern,
      "Any damage becomes lethal for the turn, turning small hostile damage sources into removal.",
    );
    add(
      "Symmetric damage-doom liability",
      "costsAndDrawbacks",
      -0.48,
      damageDoomPattern,
      "The lethal conversion is bilateral and can also expose friendly units.",
    );
  }

  const delayedKillPattern =
    /\bchoose a unit\b[\s\S]{0,48}\bkill it the next time it takes damage this turn\b/;
  if (delayedKillPattern.test(text)) {
    // The conditional immediate replacement improves the delayed base mode;
    // it is not a second removal spell and therefore is valued once.
    const legionUpgrade = /\[legion\]\s*(?:—|-)\s*kill it now instead\b/.test(
      text,
    );
    add(
      legionUpgrade ? "Delayed kill / hard removal" : "Delayed kill",
      "boardControl",
      legionUpgrade ? 1.48 : 1.08,
      delayedKillPattern,
      "A damage-gated kill receives one bounded value; a conditional immediate replacement raises reliability without being summed as another kill.",
    );
  }

  const deckDisplacementPattern =
    /\bchoose an enemy unit\b[\s\S]{0,96}\bowner places it on the top or bottom of their main deck\b/;
  if (deckDisplacementPattern.test(text)) {
    add(
      "Deck displacement removal",
      "boardControl",
      1.38,
      deckDisplacementPattern,
      "An enemy battlefield unit is removed into its owner's deck, denying both tempo and immediate graveyard recursion.",
    );
  }

  // Recursion and reusable value -------------------------------------------
  const activatedAbilityAccessPattern =
    /\bhave all \[t\] abilities of all friendly legends, units, and gear\b/;
  if (activatedAbilityAccessPattern.test(text)) {
    add(
      "Activated ability access",
      "effectValue",
      1.08,
      activatedAbilityAccessPattern,
      "Friendly activated abilities become reusable options, with their supported ceiling left to actual deck composition.",
    );
  }

  const trashToHandPattern =
    /\breturn (?:(?:up to )?(one|two|three|\d+) )?[^.!?]{1,80}\bfrom your trash to your hand\b/;
  const trashToHandMatch = text.match(trashToHandPattern);
  if (trashToHandMatch) {
    const count = clamp(writtenNumber(trashToHandMatch[1]), 1, 3);
    add(
      "Trash retrieval",
      "cardAdvantage",
      Math.min(2.1, 0.78 * count),
      trashToHandPattern,
      `${count} printed trash-to-hand access window${count === 1 ? "" : "s"} receive bounded card-advantage value.`,
    );
  }

  const deathknellMultiplierPattern =
    /\byour \[deathknell\] effects trigger an additional time\b/;
  if (deathknellMultiplierPattern.test(text)) {
    add(
      "Deathknell multiplier",
      "effectValue",
      1.02,
      deathknellMultiplierPattern,
      "Deathknell output can repeat once; the standalone prior is bounded until a deck supplies actual Deathknell effects.",
    );
  }

  const attachPattern =
    /\battach (?:(?:a|an|the)\s+)?(?:detached |attached )?equipment you control to a unit you control\b/;
  if (attachPattern.test(text)) {
    const attachClauses = clauses.filter(({ text: clause }) =>
      attachPattern.test(clause),
    );
    const bestActivation = Math.max(
      0.12,
      ...attachClauses.map((clause) => clause.activation * clause.valueShare),
    );
    add(
      "Equipment attachment access",
      "effectValue",
      0.52,
      attachPattern,
      "A detached or already attached Equipment can be reassigned; multiple alternative attachment modes are valued by their best bounded window, not summed.",
      bestActivation,
    );
  }

  const grantedAttachPattern =
    /\bfriendly legends have\b[^.!?]{0,48}\[t\]\s*:\s*attach an equipment you control\b/;
  if (grantedAttachPattern.test(text)) {
    add(
      "Granted Equipment attachment",
      "effectValue",
      0.48,
      grantedAttachPattern,
      "Friendly legends gain a reusable Equipment attachment action while the battlefield is controlled.",
    );
  }

  const banishedZoneAccessPattern = /\bplay a unit banished with this\b/;
  if (banishedZoneAccessPattern.test(text)) {
    add(
      "Banished-card access",
      "cardAdvantage",
      0.68,
      banishedZoneAccessPattern,
      "A card stored by this permanent remains playable instead of becoming lost zone value.",
    );
  }

  const topToHandPattern =
    /\blook at the top (\d+) cards? of your main deck\b[\s\S]{0,120}\bput 1 into your hand\b/;
  const topToHandCount = Number(text.match(topToHandPattern)?.[1] ?? 0);
  if (topToHandCount > 0) {
    add(
      "Top-deck card access",
      "cardAdvantage",
      Math.min(0.92, 0.48 + topToHandCount * 0.07),
      topToHandPattern,
      "Top-N selection converts one chosen card into hand value while the rest are recycled.",
    );
  }

  const topPlayPattern =
    /\blook at the top (\d+) cards? of your main deck\b[\s\S]{0,180}\bbanish a unit from among them\b[\s\S]{0,96}\bplay it\b/;
  const topPlayCount = Number(text.match(topPlayPattern)?.[1] ?? 0);
  if (topPlayCount > 0) {
    add(
      "Top-deck play access",
      "cardAdvantage",
      Math.min(0.96, 0.58 + topPlayCount * 0.055),
      topPlayPattern,
      "Top-N selection finds and plays one unit; miss risk keeps the standalone access value bounded.",
    );
  }

  const playFromTrashPattern = /\bplay a unit from your trash\b/;
  if (playFromTrashPattern.test(text)) {
    add(
      "Play-from-trash recursion",
      "cardAdvantage",
      0.82,
      playFromTrashPattern,
      "A unit in trash becomes a playable card again, before any separate cost bypass is counted.",
    );
  }

  const symmetricTopPlayPattern =
    /\beach player looks at the top (\d+) cards? of their main deck\b[\s\S]{0,240}\beach player plays those cards, ignoring energy costs\b/;
  if (symmetricTopPlayPattern.test(text)) {
    add(
      "Symmetric top-deck play access",
      "cardAdvantage",
      0.42,
      symmetricTopPlayPattern,
      "The controller receives one selected top-N card, discounted for granting the same access to opponents.",
    );
    add(
      "Symmetric cost bypass",
      "resourceValue",
      0.58,
      symmetricTopPlayPattern,
      "One selected card ignores Energy cost, with only the controller's bounded timing edge credited.",
    );
    add(
      "Opponent top-deck access liability",
      "costsAndDrawbacks",
      -0.46,
      symmetricTopPlayPattern,
      "Every opponent receives the same selected-card access and Energy bypass.",
    );
  }

  const hiddenCostBypassPattern = /\bhide cards ignoring costs this turn\b/;
  if (hiddenCostBypassPattern.test(text)) {
    add(
      "Hidden cost bypass",
      "resourceValue",
      0.46,
      hiddenCostBypassPattern,
      "Retrieved Hidden cards can be set without paying their normal hide costs for the turn.",
    );
  }

  // Amplification, XP, costs, and Gear -------------------------------------
  const nextSpellBonusDamagePattern =
    /\bthe next spell you play this turn deals (\d+) bonus damage\b/;
  const bonusDamage = Number(text.match(nextSpellBonusDamagePattern)?.[1] ?? 0);
  if (bonusDamage > 0) {
    add(
      "Next-spell bonus damage",
      "effectValue",
      Math.min(1.05, bonusDamage * 0.58),
      nextSpellBonusDamagePattern,
      "The next spell's damage instances are amplified; an activation gate and the need for a follow-up spell bound the floor.",
    );
  }

  const grantedXpActionPattern =
    /\bunits here have\b[^.!?]{0,32}\[t\]\s*:\s*gain (\d+) xp\b/;
  const grantedXp = Number(text.match(grantedXpActionPattern)?.[1] ?? 0);
  if (grantedXp > 0) {
    add(
      "Granted XP action",
      "effectValue",
      Math.min(0.9, 0.38 + grantedXp * 0.14),
      grantedXpActionPattern,
      "Units may trade an action for XP; repeated progression is possible but competes with attacking and movement.",
    );
  }

  const nextSpellDiscountPattern =
    /\bthe next spell you play this turn costs \[(\d+)\] less\b/;
  const nextSpellDiscount = Number(
    text.match(nextSpellDiscountPattern)?.[1] ?? 0,
  );
  if (nextSpellDiscount > 0) {
    add(
      "Next-spell cost reduction",
      "resourceValue",
      Math.min(1.45, 0.28 + nextSpellDiscount * 0.18),
      nextSpellDiscountPattern,
      "A one-turn spell discount converts a bounded share of its printed ceiling because it requires a timely follow-up.",
    );
  }

  const opponentSpellTaxPattern =
    /\bopponents'? spells cost \[1\] more\b[\s\S]{0,96}\bif this is \[empowered\], they cost \[1\]\[a\] more instead\b/;
  if (opponentSpellTaxPattern.test(text)) {
    add(
      "Spell cost tax",
      "effectValue",
      0.92,
      opponentSpellTaxPattern,
      "The base spell tax is always useful; the Empowered replacement adds only a reliability-weighted increment rather than a second stacked tax.",
    );
  }

  const empowerOtherGearPattern = /\bempower another gear\b/;
  if (empowerOtherGearPattern.test(text)) {
    add(
      "Empower-other-Gear access",
      "effectValue",
      0.46,
      empowerOtherGearPattern,
      "A separate Gear can be Empowered through this activated effect; payoff beyond access depends on supported Gear.",
    );
  }

  const empowerDiscountPattern =
    /\[empower\] costs of your units here cost \[1\] or \[[a-z]\] less\b/;
  if (empowerDiscountPattern.test(text)) {
    add(
      "Empower cost reduction",
      "resourceValue",
      0.62,
      empowerDiscountPattern,
      "Friendly units at this battlefield receive one flexible Energy-or-Power Empower discount.",
    );
  }

  // Forge addition (not in the port): Radiance families (Disarm, Deploy, Bomb, ...), see radiance.ts.
  addForgeSemanticFamilies(add, text);

  const componentCaps: Readonly<Record<StructuredSemanticComponent, number>> = {
    expectedStrength: 2.5,
    effectValue: 3.2,
    cardAdvantage: 3,
    boardControl: 5,
    resourceValue: 3,
    costsAndDrawbacks: 2,
  };
  const scaled = [...contributions];
  for (const component of Object.keys(
    componentCaps,
  ) as StructuredSemanticComponent[]) {
    const matching = scaled
      .map((contribution, index) => ({ contribution, index }))
      .filter(({ contribution }) => contribution.component === component);
    const magnitude = matching.reduce(
      (sum, { contribution }) => sum + Math.abs(contribution.value),
      0,
    );
    const cap = componentCaps[component];
    if (magnitude <= cap || magnitude === 0) continue;
    const scale = cap / magnitude;
    for (const { contribution, index } of matching) {
      scaled[index] = {
        ...contribution,
        value: round(contribution.value * scale, 3),
      };
    }
  }

  const totalFor = (component: StructuredSemanticComponent) =>
    round(
      scaled
        .filter((contribution) => contribution.component === component)
        .reduce((sum, contribution) => sum + contribution.value, 0),
      3,
    );

  return {
    contributions: scaled,
    expectedStrength: totalFor("expectedStrength"),
    effectValue: totalFor("effectValue"),
    cardAdvantage: totalFor("cardAdvantage"),
    boardControl: totalFor("boardControl"),
    resourceValue: totalFor("resourceValue"),
    costsAndDrawbacks: totalFor("costsAndDrawbacks"),
  };
}
