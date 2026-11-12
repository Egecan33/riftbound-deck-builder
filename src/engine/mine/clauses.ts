// Ported from Riftfoundry apps/web/src/lib/scoring.ts at origin/main 4b90179 (lines 2086-2791): rule clause analysis: triggers, requirements, payments, activation.
// Port rule (spec 8.1): behaviour unchanged; top-level declarations are exported so the split files can share them.
import {
  countMatches,
  rememberRuleAnalysis,
  round,
} from "./directions";
import {
  clamp,
  writtenNumber,
} from "./text";
import {
  type ScoreCard,
} from "./types";

export type RuleClauseTrigger =
  | "play"
  | "reaction"
  | "attack"
  | "defend"
  | "conquer"
  | "hold"
  | "move"
  | "death"
  | "turn"
  | "activated"
  | "conditional"
  | "unconditional";

export interface RuleClauseActivation {
  text: string;
  activation: number;
  trigger: RuleClauseTrigger;
  ordinal: number | null;
  requirementCount: number;
  choiceGroup: number | null;
  choiceKind: "elective" | "contingent" | null;
  valueShare: number;
  paymentBurden: number;
}

export const ruleClauseActivationCache = new Map<
  string,
  readonly RuleClauseActivation[]
>();

export const payoffClausePattern =
  /\b(?:counter|draw|discard|kill|banish|recall|stun|deal|score|play|ready|channel|move|return|prevent|copy|gain|give|might|take control|costs? less|reduce|add \d+ energy|buff)\b|\[(?:add|buff|flow|repeat|hunt|vision|deflect|ganking|backline|tank)\b/;

export function requirementPrefixForClause(clause: string): string {
  const firstPayoff = clause.search(payoffClausePattern);
  return firstPayoff > 0 ? clause.slice(0, firstPayoff) : clause;
}

export function ordinalTriggerNumber(clause: string): number | null {
  const match = clause.match(
    /\b(?:the\s+)?(first|second|third|fourth|fifth|\d+(?:st|nd|rd|th))\s+time\b/,
  );
  if (!match) return null;
  const written: Readonly<Record<string, number>> = {
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    fifth: 5,
  };
  return (
    written[match[1] ?? ""] ??
    Number.parseInt((match[1] ?? "").replaceAll(/\D/g, ""), 10) ??
    null
  );
}

export function ordinalActivationMultiplier(ordinal: number | null): number {
  if (ordinal === null || ordinal <= 0) return 1;
  if (ordinal === 1) return 0.85;
  if (ordinal === 2) return 0.65;
  if (ordinal === 3) return 0.45;
  if (ordinal === 4) return 0.32;
  return 0.22;
}

export function accumulatedStateRequirementCount(clause: string): number {
  const match = clause.match(
    /\bif there (?:is|are) (?:exactly )?(a|an|one|two|three|four|five|\d+) (?:[^,.!?]{0,32}\s)?(?:cards?|spells?|units?|gear|runes?|tokens?)\b[^,.!?]{0,56}\b(?:with|under|on) (?:me|this(?: card| unit| gear| legend)?)\b/,
  );
  if (!match) return 1;
  return clamp(writtenNumber(match[1]), 1, 12);
}

export function requiredSacrificeCountForPayoff(clause: string): number {
  const match = clause.match(
    /\b(?:kill|sacrifice) (a|an|one|two|three|four|five|\d+) (?:other )?(?:friendly )?(?:units?|gear|cards?|tokens?)(?: and\/or (?:friendly )?(?:units?|gear|cards?|tokens?))?\b[^.!?]{0,32}\bto (?:score|draw|play|ready|channel|deal|give|gain)\b/,
  );
  if (!match) return 0;
  return clamp(writtenNumber(match[1]), 1, 12);
}

export function isActivatedAbilityClause(clause: string): boolean {
  return /\[(?:t|e)\]\s*(?::|—|-)|\bexhaust (?:me|this|a|an|one|chosen)\b[^.!?]{0,32}(?::|—|-|\bto\b)|\b(?:you\s+)?(?:may\s+|can\s+|must\s+)?pay\b[^.!?]{0,56}(?::|\bto\b)|(?:^|[\n])\s*(?:\[(?:\d+|[a-z])\]\s*,?\s*)+:/i.test(
    clause,
  );
}

export function requiredAllTagNames(text: string): string[] {
  const serialized = text.match(
    /\ball of the following tags\b[^—:\n]*(?:—|:)\s*([^.\n]+)/i,
  )?.[1];
  if (!serialized) return [];

  return [
    ...new Set(
      serialized
        .split(/\s*,\s*|\s+(?:and|or)\s+/i)
        .map((tag) =>
          tag
            .replaceAll(/[^\p{L}\p{N}' -]/gu, "")
            .replace(/^(?:and|or)\s+/i, "")
            .replaceAll(/\s+/g, " ")
            .trim()
            .toLocaleLowerCase(),
        )
        .filter(Boolean),
    ),
  ];
}

export function independentRequirementCount(clause: string): number {
  const requirementText = requirementPrefixForClause(clause);
  const explicitConditions = countMatches(
    requirementText,
    /\bif\b|\bunless\b|\bprovided that\b|\bonly if\b|\bwhile\b/g,
  );
  const taggedRequirements = requiredAllTagNames(clause).length;
  const conditionStart = requirementText.search(
    /\b(?:if|unless|provided that|only if|while)\b/,
  );
  const conditionText =
    conditionStart >= 0
      ? requirementText
          .slice(conditionStart)
          .replace(
            /,\s*(?:you|your|i|they|it|this|that|opponents?|players?|chosen player|each player)\b[\s\S]*$/i,
            "",
          )
          .replace(/,\s*$/, "")
      : "";
  const listCommas = countMatches(conditionText, /,/g);
  const listConjunctions = countMatches(
    conditionText.replaceAll(/\band\/or\b|\bor\b/g, " "),
    /\band\b|\bas well as\b/g,
  );
  const oxfordConjunctions = countMatches(
    conditionText,
    /,\s*(?:and|as well as)\b/g,
  );
  const serializedRequirementCount =
    conditionStart >= 0
      ? Math.max(1, 1 + listCommas + listConjunctions - oxfordConjunctions)
      : 0;
  const stateQualifiedTarget =
    /\b(?:stunned|damaged|buffed|exhausted|ready) (?:enemy |friendly |opponent'?s )?(?:units?|gear)\b[^.!?]{0,48}\b(?:have|has|gets?|can'?t|cannot|costs?)\b/.test(
      requirementText,
    );
  const implicitStateRequirements = stateQualifiedTarget
    ? 1 +
      (/\bhere\b|\bat (?:a|the|this) battlefield\b/.test(requirementText)
        ? 1
        : 0)
    : 0;
  if (
    explicitConditions === 0 &&
    taggedRequirements === 0 &&
    implicitStateRequirements === 0
  ) {
    return 1;
  }

  const conjuncts = countMatches(
    requirementText.replaceAll(/\band\/or\b|\bor\b/g, " "),
    /\band\b|\bas well as\b/g,
  );
  return Math.max(
    1,
    explicitConditions,
    explicitConditions > 0 ? 1 + conjuncts : 1,
    serializedRequirementCount,
    taggedRequirements,
    implicitStateRequirements,
  );
}

export function paymentBurdenForClause(clause: string): number {
  const burdens: number[] = [];
  for (const match of clause.matchAll(
    /\bpay\s+((?:\[[^\]]+\]\s*)+)(?=\bto\b|:|\bfor\b)/g,
  )) {
    const matchIndex = match.index ?? 0;
    const prefix = clause.slice(Math.max(0, matchIndex - 32), matchIndex);
    if (
      /\b(?:opponent|controller|enemy|each player|any player)\b/.test(prefix)
    ) {
      continue;
    }
    const mechanicPrefix = clause.slice(
      Math.max(0, matchIndex - 80),
      matchIndex,
    );
    if (/\[(?:accelerate|empower)\b/.test(mechanicPrefix)) continue;
    burdens.push(printedActivationBurden(match[1] ?? ""));
  }
  for (const match of clause.matchAll(
    /(?:^|[.!?;\n])\s*((?:\[(?:\d+|[a-z])\]\s*,?\s*)+)(?:\[(?:t|exhaust)\]\s*,?\s*)?:/g,
  )) {
    const surrounding = match[0] ?? "";
    if (/\[(?:accelerate|empower)\b/.test(surrounding)) continue;
    burdens.push(printedActivationBurden(match[1] ?? ""));
  }
  return round(Math.max(0, ...burdens), 3);
}

export function analyzeRuleClause(
  clause: string,
  reactionCard: boolean,
): RuleClauseActivation {
  const playTrigger =
    /\b(?:as|when|whenever) you play (?:me|this)\b|\bwhen (?:i|this card) enters\b/.test(
      clause,
    );
  const counterClause = /\bcounter\b/.test(clause);
  const counterReaction = reactionCard && counterClause;
  const ordinal = ordinalTriggerNumber(clause);
  const requirementCount = independentRequirementCount(clause);
  const triggerText = requirementPrefixForClause(clause);
  const triggerLead =
    /\b(?:when|whenever|after|if|while)\b|\b(?:first|second|third|fourth|fifth|\d+(?:st|nd|rd|th)) time\b/;
  const hasTriggerLead = triggerLead.test(clause) || ordinal !== null;
  const triggerPriors: Array<{
    gate: string;
    trigger: RuleClauseTrigger;
    value: number;
  }> = [];

  if (hasTriggerLead && /\b(?:when|whenever|after) you play\b/.test(clause)) {
    triggerPriors.push({ gate: "event:play", trigger: "play", value: 0.75 });
  }
  if (
    hasTriggerLead &&
    /\battack(?:s|ed|ing)?\b|\bafter an attack\b/.test(clause)
  ) {
    triggerPriors.push({
      gate: "event:attack",
      trigger: "attack",
      value: 0.55,
    });
  }
  if (hasTriggerLead && /\bdefend(?:s|ed|ing)?\b/.test(clause)) {
    triggerPriors.push({
      gate: "event:defend",
      trigger: "defend",
      value: 0.45,
    });
  }
  if (hasTriggerLead && /\bconquer(?:s|ed|ing)?\b/.test(clause)) {
    triggerPriors.push({
      gate: "event:conquer",
      trigger: "conquer",
      value: 0.35,
    });
  }
  if (hasTriggerLead && /\bhold(?:s|ing)?\b/.test(clause)) {
    triggerPriors.push({ gate: "event:hold", trigger: "hold", value: 0.3 });
  }
  if (hasTriggerLead && /\bmov(?:e|es|ed|ing)\b/.test(clause)) {
    triggerPriors.push({ gate: "event:move", trigger: "move", value: 0.55 });
  }
  if (
    /\bdeathknell\b/.test(clause) ||
    (hasTriggerLead && /\b(?:die|dies|died|death)\b/.test(clause))
  ) {
    triggerPriors.push({
      gate: "event:death",
      trigger: "death",
      value: 0.55,
    });
  }
  if (
    /\b(?:each|every|once (?:each|per)) turn\b|\bat (?:the )?(?:start|end) of\b|\bstart of your next\b/.test(
      clause,
    )
  ) {
    triggerPriors.push({ gate: "event:turn", trigger: "turn", value: 0.68 });
  }
  if (/^\s*\[level \d+\](?:\[>\])?/.test(clause)) {
    triggerPriors.push({
      gate: "state:level",
      trigger: "conditional",
      value: 0.48,
    });
  }
  if (/^\s*\[empowered\](?:\[>\])?/.test(clause)) {
    triggerPriors.push({
      gate: "state:empowered",
      trigger: "conditional",
      value: 0.55,
    });
  }
  if (/^\s*\[legion\](?:\[>\])?/.test(clause)) {
    triggerPriors.push({
      gate: "state:legion",
      trigger: "conditional",
      value: 0.65,
    });
  }
  if (
    /\b(?:stunned|damaged|buffed|exhausted|ready) (?:enemy |friendly |opponent'?s )?(?:units?|gear)\b[^.!?]{0,48}\b(?:have|has|gets?|can'?t|cannot|costs?)\b/.test(
      clause,
    )
  ) {
    triggerPriors.push({
      gate: "state:qualified-target",
      trigger: "conditional",
      value: 0.48,
    });
  }
  const activated = isActivatedAbilityClause(clause);
  if (activated) {
    triggerPriors.push({
      gate: "activation:payment",
      trigger: "activated",
      value: 0.62,
    });
  }
  const sacrificeCount = requiredSacrificeCountForPayoff(clause);
  if (sacrificeCount > 0) {
    triggerPriors.push({
      gate: "activation:sacrifice",
      trigger: "conditional",
      value: round(clamp(0.62 / Math.sqrt(sacrificeCount), 0.22, 0.62), 3),
    });
  }
  const independentPriors = [
    ...new Map(triggerPriors.map((prior) => [prior.gate, prior])).values(),
  ];
  const hasSpecificEventPrior = independentPriors.some(({ trigger }) =>
    [
      "play",
      "attack",
      "defend",
      "conquer",
      "hold",
      "move",
      "death",
      "turn",
    ].includes(trigger),
  );
  const primaryEventIntroducedByCondition =
    hasSpecificEventPrior &&
    /^\s*(?:\[[^\]]+\]\s*)*(?:if|unless|only if|provided that)\b/.test(
      triggerText,
    );
  const explicitConditionGateCount = Math.max(
    0,
    countMatches(
      triggerText,
      /\bif\b|\bunless\b|\bonly if\b|\bprovided that\b/g,
    ) - (primaryEventIntroducedByCondition ? 1 : 0),
  );
  // A printed payment/exhaust cost already contributes to the clause's cost
  // burden below. Treat it as a standalone usage prior only when it is the
  // sole gate; otherwise multiplying it into a real timing/state condition
  // would price the same activation friction twice.
  const hasGateBeyondActivation =
    independentPriors.some(({ gate }) => gate !== "activation:payment") ||
    explicitConditionGateCount > 0;
  const composablePriors = independentPriors.filter(
    ({ gate }) => gate !== "activation:payment" || !hasGateBeyondActivation,
  );
  const productOf = (
    priors: ReadonlyArray<(typeof composablePriors)[number]>,
  ) => priors.reduce((product, prior) => product * prior.value, 1);

  let trigger: RuleClauseTrigger = "unconditional";
  let activation = 1;
  if (counterReaction) {
    // Counter target/timing/payment eligibility is owned by
    // counterEffectValuation. Keeping the clause itself live prevents those
    // same printed restrictions from being multiplied in a second time.
    trigger = "reaction";
  } else if (playTrigger) {
    trigger = "play";
    const additionalPriors = composablePriors.filter(
      ({ gate }) => gate !== "event:play",
    );
    if (additionalPriors.length > 0) {
      activation = productOf(additionalPriors);
      trigger = [...additionalPriors].sort(
        (left, right) => left.value - right.value,
      )[0]!.trigger;
    }
  } else if (composablePriors.length > 0) {
    const conquerOrHold =
      composablePriors.some(
        ({ trigger: candidate }) => candidate === "conquer",
      ) &&
      composablePriors.some(({ trigger: candidate }) => candidate === "hold") &&
      /\bconquer\b[^.!?]{0,16}\bor hold\b/.test(triggerText);
    if (conquerOrHold) {
      activation =
        0.325 *
        productOf(
          composablePriors.filter(
            ({ trigger: candidate }) =>
              candidate !== "conquer" && candidate !== "hold",
          ),
        );
      trigger = "hold";
    } else {
      const mostRestrictive = [...composablePriors].sort(
        (left, right) => left.value - right.value,
      )[0]!;
      activation = productOf(composablePriors);
      trigger = mostRestrictive.trigger;
    }
  } else if (
    explicitConditionGateCount === 0 &&
    /\b(?:if|unless|while|when|whenever|once|provided that|only if)\b|(?:^|[,;]\s*)after\b/.test(
      triggerText,
    )
  ) {
    activation = 0.68;
    trigger = "conditional";
  } else if (reactionCard) {
    // Counter target breadth/reliability already prices whether its priority
    // window is live. Applying the generic Reaction prior again would count
    // the same uncertainty twice.
    activation = counterClause ? 1 : 0.9;
    trigger = "reaction";
  }

  if (!counterReaction && explicitConditionGateCount > 0) {
    activation *= Math.pow(0.68, explicitConditionGateCount);
    if (trigger === "unconditional") trigger = "conditional";
  }
  if (
    !counterReaction &&
    /\b(?:counter|draw|discard|kill|banish|stun|deal|score|play|ready|channel|move|return|prevent|copy)\b[^.!?]{0,96}\b(?:if|unless|only if|provided that)\b/.test(
      clause,
    )
  ) {
    activation *= 0.78;
    if (trigger === "unconditional") trigger = "conditional";
  }
  if (!counterReaction) {
    activation *= Math.pow(0.78, Math.max(0, requirementCount - 1));
  }
  // A stored-state engine pays out only after every required event has
  // happened. Amortize the printed reward across those events instead of
  // treating "four spells banished with me" like a one-step condition.
  activation /= accumulatedStateRequirementCount(clause);
  activation *= ordinalActivationMultiplier(ordinal);

  return {
    text: clause,
    activation: round(clamp(activation, 0.12, 1), 3),
    trigger,
    ordinal,
    requirementCount,
    choiceGroup: null,
    choiceKind: null,
    valueShare: 1,
    paymentBurden: paymentBurdenForClause(clause),
  };
}

export function modalChoiceKindForHeader(
  clause: string,
): RuleClauseActivation["choiceKind"] {
  if (!/[—–:-]\s*$/.test(clause)) return null;
  const opensModal =
    /\bchoose one\b/.test(clause) ||
    /\b(?:choose|do) one of the following\b/.test(clause) ||
    /\bdo the following based on\b/.test(clause);
  if (!opensModal) return null;
  return /\bbased on\b/.test(clause) ? "contingent" : "elective";
}

export function clausesForScoring(card: ScoreCard): readonly RuleClauseActivation[] {
  const cached = ruleClauseActivationCache.get(card.rulesText);
  if (cached) return cached;
  const normalized = card.rulesText
    .toLocaleLowerCase()
    .replaceAll(/\([^)]*\)/g, " ")
    .replaceAll(/\r/g, "\n")
    .replaceAll(/[ \t]+/g, " ");
  const reactionCard = /\[reaction\]/.test(normalized);
  const rawClauses = normalized
    .split(/(?:\n+|[.!?;]+\s*)/)
    .map((clause) => clause.replaceAll(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((clause) => !/^\[(?:reaction|action)\]$/.test(clause));
  let inheritedGroupTrigger: RuleClauseActivation | null = null;
  let previousClause: RuleClauseActivation | null = null;
  let activeChoiceGroup: number | null = null;
  let activeChoiceKind: RuleClauseActivation["choiceKind"] = null;
  let nextChoiceGroup = 1;
  const analyzedClauses = rawClauses.map((clause) => {
    const analyzed = analyzeRuleClause(clause, reactionCard);
    const continuation = /^(?:[*•]\s*|[-–—]\s+|\[[^\]]+\]\s*(?:—|-))/.test(
      clause,
    );
    const modalChoiceKind = modalChoiceKindForHeader(clause);
    const continuationHeader = modalChoiceKind !== null;
    let resolved = analyzed;
    if (continuation && inheritedGroupTrigger) {
      const parent = inheritedGroupTrigger;
      resolved = {
        ...analyzed,
        ...(parent.activation < analyzed.activation
          ? {
              activation: parent.activation,
              trigger: parent.trigger,
            }
          : {}),
        requirementCount: Math.max(
          analyzed.requirementCount,
          parent.requirementCount,
        ),
        choiceGroup: activeChoiceGroup,
        choiceKind: activeChoiceKind,
        // A cost printed on a continuation header is paid once to activate
        // the group. Child effects carry only costs printed on that child.
        paymentBurden: analyzed.paymentBurden,
      };
    }
    if (
      continuationHeader &&
      previousClause &&
      previousClause.activation < resolved.activation
    ) {
      resolved = {
        ...resolved,
        activation: previousClause.activation,
        trigger: previousClause.trigger,
      };
    }
    const opensContinuationGroup =
      /:\s*$/.test(clause) ||
      modalChoiceKind !== null ||
      /\bbased on (?:its|their|the) [^:]+$/.test(clause);
    const opensChoiceGroup = modalChoiceKind !== null;
    if (opensContinuationGroup) {
      inheritedGroupTrigger = resolved;
      if (opensChoiceGroup) {
        activeChoiceGroup = nextChoiceGroup;
        activeChoiceKind = modalChoiceKind;
        nextChoiceGroup += 1;
      }
    } else if (!continuation) {
      inheritedGroupTrigger = null;
      activeChoiceGroup = null;
      activeChoiceKind = null;
    }
    previousClause = resolved;
    return resolved;
  });
  const battlefieldRestrictedAbilityIndices = new Set<number>();
  rawClauses.forEach((clause, index) => {
    const allAbilities =
      /^use (?:my|this (?:card|unit|gear)'?s|its) abilities only while (?:i'?m|this (?:card|unit|gear) is) at a battlefield$/.test(
        clause,
      );
    const previousAbility =
      /^use this ability only while (?:i'?m|this (?:card|unit|gear) is) at a battlefield$/.test(
        clause,
      );
    if (allAbilities) {
      for (let candidate = 0; candidate < index; candidate += 1) {
        if (isActivatedAbilityClause(rawClauses[candidate] ?? "")) {
          battlefieldRestrictedAbilityIndices.add(candidate);
        }
      }
    } else if (previousAbility) {
      for (let candidate = index - 1; candidate >= 0; candidate -= 1) {
        if (!isActivatedAbilityClause(rawClauses[candidate] ?? "")) continue;
        battlefieldRestrictedAbilityIndices.add(candidate);
        break;
      }
    }
  });
  const globallyRestrictedClauses = analyzedClauses.map((clause, index) =>
    battlefieldRestrictedAbilityIndices.has(index)
      ? {
          ...clause,
          activation: round(clamp(clause.activation * 0.62, 0.12, 1), 3),
          requirementCount: clause.requirementCount + 1,
        }
      : clause,
  );

  const choiceCounts = new Map<number, number>();
  for (const clause of globallyRestrictedClauses) {
    if (clause.choiceGroup === null) continue;
    choiceCounts.set(
      clause.choiceGroup,
      (choiceCounts.get(clause.choiceGroup) ?? 0) + 1,
    );
  }
  const clauses = globallyRestrictedClauses.map((clause) => {
    if (clause.choiceGroup === null) return clause;
    const optionCount = choiceCounts.get(clause.choiceGroup) ?? 1;
    const choiceShare =
      clause.choiceKind === "contingent"
        ? 1 / optionCount
        : (1 + 0.25 * Math.max(0, optionCount - 1)) / optionCount;
    return {
      ...clause,
      valueShare: round(clamp(choiceShare, 0.2, 1), 3),
    };
  });
  return rememberRuleAnalysis(
    ruleClauseActivationCache,
    card.rulesText,
    clauses,
  );
}

export function activationForEffects(
  clauses: readonly RuleClauseActivation[],
  pattern: RegExp,
): number {
  const tester = new RegExp(pattern.source, pattern.flags.replaceAll("g", ""));
  const matches = clauses.filter(({ text }) => tester.test(text));
  if (matches.length === 0) return 1;
  return round(
    matches.reduce(
      (sum, clause) => sum + clause.activation * clause.valueShare,
      0,
    ) / matches.length,
    3,
  );
}

export function rulesActivationFactor(
  clauses: readonly RuleClauseActivation[],
): number {
  const payoffClauses = clauses.filter(({ text }) =>
    payoffClausePattern.test(text),
  );
  if (payoffClauses.length === 0) return 1;
  return round(
    Math.min(...payoffClauses.map(({ activation }) => activation)),
    3,
  );
}

export function printedActivationBurden(payment: string): number {
  let energy = 0;
  let power = 0;
  for (const token of payment.matchAll(/\[([^\]]+)\]/g)) {
    const symbol = token[1]?.trim() ?? "";
    if (/^\d+$/.test(symbol)) {
      energy += Number(symbol);
    } else if (!["t", "e", "exhaust"].includes(symbol)) {
      power += 1;
    }
  }
  return round(
    energy + power * 1.15 + 0.25 * power * Math.max(0, power - 1),
    3,
  );
}

export function paymentTaxForBurden(paymentBurden: number): number {
  return Math.min(
    1.4,
    paymentBurden * 0.16 + Math.max(0, paymentBurden - 2) * 0.04,
  );
}

export function activatedPaymentSummary(clauses: readonly RuleClauseActivation[]): {
  maximumBurden: number;
  expectedTax: number;
  activation: number;
} {
  const paymentClauses = clauses.filter(
    ({ paymentBurden }) => paymentBurden > 0,
  );
  if (paymentClauses.length === 0) {
    return { maximumBurden: 0, expectedTax: 0, activation: 1 };
  }
  return {
    maximumBurden: round(
      Math.max(...paymentClauses.map(({ paymentBurden }) => paymentBurden)),
      3,
    ),
    expectedTax: round(
      clamp(
        paymentClauses.reduce(
          (sum, clause) =>
            sum +
            paymentTaxForBurden(clause.paymentBurden) *
              clause.activation *
              clause.valueShare,
          0,
        ),
        0,
        1.4,
      ),
      3,
    ),
    activation: round(
      paymentClauses.reduce(
        (sum, clause) => sum + clause.activation * clause.valueShare,
        0,
      ) / paymentClauses.length,
      3,
    ),
  };
}
