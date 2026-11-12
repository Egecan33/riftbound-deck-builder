// Ported from Riftfoundry apps/web/src/lib/scoring.ts at origin/main 4b90179 (lines 3685-3959): accelerate, counter and direct-point valuations.
// Port rule (spec 8.1): behaviour unchanged; top-level declarations are exported so the split files can share them.
import {
  type RuleClauseActivation,
} from "./clauses";
import {
  countMatches,
  round,
  scoringDirection,
} from "./directions";
import {
  clamp,
  finiteOr,
} from "./text";
import {
  type ScoreCard,
} from "./types";

export function isImmediatePlayEffect(text: string): boolean {
  return (
    /\bwhen you play me\b|\bas you play me\b|\bwhen you play this\b/.test(
      text,
    ) ||
    (!/\bif\b|\bwhile\b|\bwhenever\b/.test(text) &&
      /\bdeal\b|\bdraw\b|\bkill\b|\bstun\b|\bmove\b|\bscore\b/.test(text))
  );
}

export function conditionalClauseCount(text: string): number {
  const withoutPlayTriggers = text.replaceAll(
    /\bwhen you play (?:me|this)\b|\bas you play me\b/g,
    "",
  );
  const explicit = countMatches(
    withoutPlayTriggers,
    /\bif\b|\bwhile\b|\bwhenever\b|\bwhen\b|\bunless\b|\bonce\b/g,
  );
  const levelGates = countMatches(withoutPlayTriggers, /\[level \d+\]/g);
  const implicitStateTargets = countMatches(
    withoutPlayTriggers,
    /\b(?:stunned|damaged|buffed|exhausted|ready) (?:enemy |friendly |opponent'?s )?(?:units?|gear)\b[^.!?]{0,48}\b(?:have|has|gets?|can'?t|cannot|costs?)\b/g,
  );
  return explicit + levelGates + implicitStateTargets;
}

export interface AccelerateOptionValuation {
  effectValue: number;
  investment: number;
}

export interface CounterEffectValuation {
  effectValue: number;
  reliabilityPenalty: number;
  contextValue: number;
  targetReliability: number;
  targetBreadth: "spell" | "spell-or-ability";
  protectedTargets: {
    unit: boolean;
    gear: boolean;
    spell: boolean;
  } | null;
}

/**
 * Reusable effect-family priors, not named-card overrides.
 *
 * Rules evidence:
 * - https://playriftbound.com/en-us/news/rules-and-releases/riftbound-spiritforged-faq/
 * - https://playriftbound.com/en-us/news/rules-and-releases/unleashed-rules-faq-and-clarifications/
 *
 * The official FAQs define Accelerate as an optional additional cost that
 * makes the unit enter ready, and clarify that [C] uses the unit's sole domain
 * or becomes [A] for zero/multiple domains. Community timing examples inform
 * only conservative context priors, never card-specific constants:
 * - https://www.reddit.com/r/riftboundtcg/comments/1tds9bx/rift_herald_accelerate/
 * - https://www.reddit.com/r/riftboundtcg/comments/1sdmugt/can_reaction_speed_cards_be_played_proactively_on/
 */
export function accelerateOptionValuation(
  card: ScoreCard,
  text: string,
): AccelerateOptionValuation | null {
  if (!/\[accelerate\]/.test(text) || card.type !== "unit") return null;
  const rawText = card.rulesText
    .toLocaleLowerCase()
    .replaceAll(/\s+/g, " ")
    .trim();
  const printedCost = rawText.match(
    /\[accelerate\][\s\S]{0,120}?\byou may pay\s+((?:\[[^\]]+\]\s*)+)/,
  )?.[1];
  let energyInvestment = 1;
  let powerInvestment = 1;
  if (printedCost) {
    energyInvestment = 0;
    powerInvestment = 0;
    for (const token of printedCost.matchAll(/\[([^\]]+)\]/g)) {
      const symbol = token[1]?.trim() ?? "";
      if (/^\d+$/.test(symbol)) {
        energyInvestment += Number(symbol);
      } else {
        powerInvestment += 1;
      }
    }
  }

  const nonlinearPowerBurden =
    powerInvestment * 1.15 +
    0.25 * powerInvestment * Math.max(0, powerInvestment - 1);
  const totalBurden = energyInvestment + nonlinearPowerBurden;
  const coloredDomains = card.domains.filter(
    (domain) => domain !== "colorless",
  );
  const domainAccess = coloredDomains.length === 1 ? 0.86 : 1;
  const might = clamp(finiteOr(card.might, 0), 0, 30);
  let conversionValue = 0;
  if (/\battack\b|\[assault(?: \d+)?\]/.test(text)) conversionValue += 0.11;
  if (/\bmov(?:e|ed|es|ing)\b|\[ganking\]/.test(text)) {
    conversionValue += 0.14;
  }
  if (/\bconquer\b|\bhold\b|\bscore\b/.test(text)) conversionValue += 0.16;
  if (/\bxp\b|\[hunt(?: \d+)?\]|\[level \d+\]/.test(text)) {
    conversionValue += 0.14;
  }
  conversionValue = clamp(conversionValue, 0, 0.48);

  // Optionality prevents an unaffordable mode from making the base body worse.
  // The option is credited only for its bounded expected ready-tempo window.
  const availability = clamp(1 - totalBurden * 0.075, 0.42, 0.88);
  const effectValue = clamp(
    (0.24 + might * 0.05 + conversionValue) * domainAccess * availability,
    0.12,
    1.15,
  );
  const investment = clamp(
    Math.min(
      Math.max(0, effectValue - 0.04),
      totalBurden * 0.065 * availability,
    ),
    0,
    0.72,
  );
  return {
    effectValue: round(effectValue, 3),
    investment: round(investment, 3),
  };
}

export function counterEffectValuation(text: string): CounterEffectValuation | null {
  const namesCounterTarget =
    /\bcounter (?:an? |the |that |target |enemy )*(?:spell|ability)\b/.test(
      text,
    );
  const refersToChosenCounterTarget =
    /\b(?:choose|chosen|target) (?:an? |the )?(?:spell|ability)\b[\s\S]{0,220}\bcounter it\b/.test(
      text,
    );
  if (!namesCounterTarget && !refersToChosenCounterTarget) {
    return null;
  }

  const affectsAbilities =
    /\bspell or ability\b|\bspells? and abilities?\b/.test(text);
  let targetReliability = affectsAbilities ? 1 : 0.92;
  const energyCeiling = Number(
    text.match(/\bcosts? no more than \[(\d+)\]/)?.[1] ?? Number.NaN,
  );
  if (Number.isFinite(energyCeiling)) {
    targetReliability *= clamp(0.48 + energyCeiling * 0.08, 0.48, 0.88);
  }
  const hasPowerCeiling = /\band no more than \[[a-z]\](?:\s|[.,;:]|$)/.test(
    text,
  );
  if (hasPowerCeiling) {
    targetReliability *= 0.9;
  }
  const hasFriendlyTargetRestriction =
    /\bthat chooses? (?:a|one|it|a friendly|friendly)\b|\band no other friendly unit\b/.test(
      text,
    );
  if (hasFriendlyTargetRestriction) {
    targetReliability *= 0.58;
  }
  const hasTimingRestriction =
    /\bif an opponent has played another spell\b/.test(text);
  if (hasTimingRestriction) {
    targetReliability *= 0.62;
  }
  const hasPaymentEscape = /\bunless (?:its|the) controller pays?\b/.test(text);
  if (hasPaymentEscape) {
    targetReliability *= 0.72;
  }
  const explicitConditionalRestrictions = countMatches(
    text,
    /\bif\b|\bunless\b|\bprovided that\b|\bonly if\b/g,
  );
  const specificallyPricedRestrictions =
    Number(hasTimingRestriction) + Number(hasPaymentEscape);
  const additionalConditionalRestrictions = Math.max(
    0,
    explicitConditionalRestrictions - specificallyPricedRestrictions,
  );
  if (additionalConditionalRestrictions > 0) {
    targetReliability *=
      0.68 * Math.pow(0.78, Math.max(0, additionalConditionalRestrictions - 1));
  }
  targetReliability = clamp(targetReliability, 0.24, 1);

  let protectedTargets: CounterEffectValuation["protectedTargets"] = null;
  const directFriendlyTarget = text.match(
    /\bthat chooses? (?:a |an |one )?friendly ([^.!?;]+)/,
  )?.[1];
  if (directFriendlyTarget) {
    protectedTargets = {
      unit: /\bunits?\b/.test(directFriendlyTarget),
      gear: /\bgear\b|\bequipment\b/.test(directFriendlyTarget),
      spell: /\bspells?\b/.test(directFriendlyTarget),
    };
  } else if (
    /\bchoose a friendly unit\b[^.!?]*[.!?]\s*counter\b[^.!?]*\bthat chooses it\b|\band no other friendly unit\b/.test(
      text,
    )
  ) {
    protectedTargets = { unit: true, gear: false, spell: false };
  }

  // A counter spends one card to deny one card, so card advantage stays
  // neutral. Its standalone value is the opposing investment and mid-flight
  // tempo denied plus a bounded share of the swing it can prevent. A
  // return-to-hand replacement is soft denial rather than a one-for-one trade,
  // while a broad hard counter retains a bounded decisive-swing ceiling.
  const targetBreadth = affectsAbilities ? 1.12 : 1;
  const softCounter =
    /\breturn (?:it|that spell) to its owner'?s hand instead\b/.test(text);
  const oneForOneDenial = softCounter ? 0 : 0.68;
  const midFlightTempo = 1.04 * targetBreadth;
  const preventedSwing = 0.63 * targetBreadth;
  const effectValue = clamp(
    (oneForOneDenial + midFlightTempo + preventedSwing) * targetReliability,
    0.22,
    2.9,
  );
  return {
    effectValue: round(effectValue, 3),
    reliabilityPenalty: round((1 - targetReliability) * 0.18, 3),
    contextValue: round(clamp(0.18 + targetReliability * 0.2, 0.2, 0.42), 3),
    targetReliability: round(targetReliability, 3),
    targetBreadth: affectsAbilities ? "spell-or-ability" : "spell",
    protectedTargets,
  };
}

export function directPointFoundationValue(
  points: number,
  activation: number,
): number {
  if (points <= 0) return 0;
  const boundedActivation = clamp(activation, 0, 1);
  const reliabilityGate =
    boundedActivation >= 0.999 ? 1 : Math.pow(boundedActivation, 1.5);
  return round(points * 4.5 * 0.55 * reliabilityGate, 3);
}

export function directPointClauseLedger(
  clauses: readonly RuleClauseActivation[],
): Array<{
  points: number;
  activation: number;
  paymentBurden: number;
  value: number;
}> {
  return clauses.flatMap((clause) => {
    const points = scoringDirection(clause.text).ownPoints;
    if (points <= 0) return [];
    const activation = round(
      clamp(clause.activation * clause.valueShare, 0, 1),
      3,
    );
    return [
      {
        points,
        activation,
        paymentBurden: clause.paymentBurden,
        value: directPointFoundationValue(points, activation),
      },
    ];
  });
}

/**
 * Explainable, rules-text-only foundation prior. It intentionally knows
 * nothing about tournament adoption; evidence calibration is applied later at
 * deck level. Coefficients are bounded design priors and every component can be
 * surfaced independently.
 */
