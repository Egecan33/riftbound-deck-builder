// Ported from Riftfoundry apps/web/src/lib/scoring.ts at origin/main 4b90179 (lines 1767-2085): rules-text normalisation, equipment and ready helpers, keyword magnitudes.
// Port rule (spec 8.1): behaviour unchanged; top-level declarations are exported so the split files can share them.
import {
  controllerInstructionClauses,
  rememberRuleAnalysis,
} from "./directions";
import {
  type Trait,
} from "./labels";
import {
  type ScoreCard,
} from "./types";

export function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.min(maximum, value));
}

export function finiteOr(value: number | null | undefined, fallback: number): number {
  return Number.isFinite(value) ? (value as number) : fallback;
}

/**
 * Reminder text explains keywords rather than adding a second effect. Ignoring
 * parentheticals prevents e.g. Deathknell reminder text from counting another
 * death payoff, while the printed keyword itself remains visible.
 */
export const normalizedRulesTextCache = new Map<string, string>();

export function rulesForScoring(card: ScoreCard): string {
  const cached = normalizedRulesTextCache.get(card.rulesText);
  if (cached !== undefined) return cached;
  const normalized = card.rulesText
    .toLocaleLowerCase()
    .replaceAll(/\([^)]*\)/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
  return rememberRuleAnalysis(
    normalizedRulesTextCache,
    card.rulesText,
    normalized,
  );
}

export function isEquipmentCard(card: ScoreCard): boolean {
  if (card.type !== "gear") return false;
  return (
    card.tags.some((tag) => tag.toLocaleLowerCase() === "equipment") ||
    /\[(?:equip|quick-draw)\]/.test(rulesForScoring(card))
  );
}

/**
 * Friendly Equipment is a narrower resource than Gear. Enemy interaction and
 * generic Gear-count text deliberately do not enter this requirement family.
 */
export function requiresFriendlyEquipment(card: ScoreCard, text: string): boolean {
  if (isEquipmentCard(card)) return false;
  return (
    /\[weaponmaster\]/.test(text) ||
    /\bchoose a unit and an equipment with the same controller\b/.test(text) ||
    /\bequipped friendly unit\b|\bif (?:it|that unit|the unit|i|this unit) (?:is |'?s )?equipped\b/.test(
      text,
    ) ||
    /\b(?:each|an?|one|its|that|the|your) equipment attached to (?:me|it|that unit|the unit|a friendly unit)\b/.test(
      text,
    ) ||
    /\bwhen you attach an equipment to me\b/.test(text) ||
    /\b(?:you may )?play an equipment\b/.test(text) ||
    /\b(?:each|for each) equipment (?:in your hand|you control)\b/.test(text) ||
    /\byour equipment(?:s)?\b/.test(text) ||
    /\b(?:kill|sacrifice) (?:an?|one|the) equipment you control\b/.test(text) ||
    /\battach that equipment to that unit\b|\battach one of its equipment to me\b/.test(
      text,
    ) ||
    /\battach (?:an?|one of your|a detached|an attached) equipment (?:you control|with the same controller)?\b/.test(
      text,
    )
  );
}

export interface ReadyProviderTargets {
  unit: boolean;
  gear: boolean;
  legend: boolean;
}

export const readyProviderTargetsCache = new Map<string, ReadyProviderTargets>();

export interface ReadyInteractionDirection {
  self: boolean;
  external: boolean;
  payoff: boolean;
  denial: boolean;
}

export const readyInteractionDirectionCache = new Map<
  string,
  ReadyInteractionDirection
>();

/**
 * Readiness keywords and self-ready effects describe the card's own tempo.
 * A cross-card package exists only when the printed effect can ready a
 * compatible second card.
 */
export function readyProviderTargets(text: string): ReadyProviderTargets {
  const cached = readyProviderTargetsCache.get(text);
  if (cached) return cached;

  const targets: ReadyProviderTargets = {
    unit: false,
    gear: false,
    legend: false,
  };
  for (const clause of controllerInstructionClauses(text, "ready", true)) {
    if (
      /\b(?:me|myself|itself|this card)\b/.test(clause) &&
      !/\b(?:another|besides me)\b/.test(clause)
    ) {
      continue;
    }
    if (/\bsomething (?:else|besides me)\b/.test(clause)) {
      targets.unit = true;
      targets.gear = true;
      targets.legend = true;
      continue;
    }
    if (/\b(?:unit|units)\b/.test(clause)) targets.unit = true;
    if (/\b(?:gear|equipment)\b/.test(clause)) targets.gear = true;
    if (/\blegend\b/.test(clause)) targets.legend = true;
  }

  return rememberRuleAnalysis(readyProviderTargetsCache, text, targets);
}

/**
 * "Ready" can describe four different jobs. Self-ready, an instruction that
 * readies another object, and a trigger that rewards becoming ready are
 * positive conversion roles. Text preventing enemies from readying is denial,
 * not a provider or payoff.
 */
export function readyInteractionDirection(text: string): ReadyInteractionDirection {
  const cached = readyInteractionDirectionCache.get(text);
  if (cached) return cached;

  const readyInstructions = controllerInstructionClauses(text, "ready", true);
  const controllerReadyInstructions = readyInstructions.filter(
    (clause) =>
      !/\b(?:enemy|opponent'?s)\b/.test(clause) &&
      !/\b(?:each|every|all) players?\b/.test(clause) &&
      !/\b(?:can'?t|cannot|prevent(?:s|ed|ing)?)\b[^.!?]{0,32}\bready\b/.test(
        clause,
      ),
  );
  const self =
    /\[accelerate\]|\bready (?:me|myself|this card)\b|\b(?:i|this (?:unit|gear|legend|card)) enters? ready\b/.test(
      text,
    ) ||
    controllerReadyInstructions.some((clause) =>
      /\bready (?:me|myself|this card)\b/.test(clause),
    );
  const external =
    controllerReadyInstructions.some(
      (clause) => !/\bready (?:me|myself|this card)\b/.test(clause),
    ) ||
    /\b(?:friendly units?|your (?:units?|tokens?)|(?:the next |other )?units? you play) enters? ready\b/.test(
      text,
    );
  const payoff =
    /\b(?:when|whenever|after) [^,.!?]{0,48}\b(?:becomes? ready|is readied)\b|\bwhen you ready\b/.test(
      text,
    );
  const denial =
    /\bcan'?t ready\b|\bcannot ready\b|\bprevent(?:s|ed|ing)?\b[^.!?]{0,32}\bready\b/.test(
      text,
    );

  return rememberRuleAnalysis(readyInteractionDirectionCache, text, {
    self,
    external,
    payoff,
    denial,
  });
}

export function canReadyCard(
  targets: ReadyProviderTargets,
  card: ScoreCard,
  traits: Set<Trait>,
): boolean {
  return (
    (targets.unit && traits.has("unit")) ||
    (targets.gear && traits.has("gear")) ||
    (targets.legend && card.type === "legend")
  );
}

export function hasIntrinsicAssault(card: ScoreCard, text: string): boolean {
  if (card.type !== "unit") return false;
  return (
    /(?:^|\]\s*)\[assault(?: \d+)?\]/.test(text) ||
    /\b(?:i|this unit) (?:gain|gains|have|has|get|gets) \[assault(?: \d+)?\]/.test(
      text,
    )
  );
}

export function hasReusableSelfTrigger(text: string): boolean {
  for (const match of text.matchAll(
    /\b(?:when|whenever|after) (?:i|this (?:unit|gear|legend)) (?:attack|move|conquer|score)\b[^,.!?]*,\s*([^.!?]*)/g,
  )) {
    const effect = match[1] ?? "";
    if (
      /\b(?:draw|deal|give|gain|play|score|burn|discard|stun|kill|banish|channel|recycle|return|move)\b/.test(
        effect.replaceAll(/\bready (?:me|this card)\b/g, ""),
      )
    ) {
      return true;
    }
  }
  return false;
}

export function isRepeatableReadyRecipient(card: ScoreCard, text: string): boolean {
  return (
    hasIntrinsicAssault(card, text) ||
    /\[t\]\s*:/.test(text) ||
    hasReusableSelfTrigger(text)
  );
}

export function hasTargetedReadyPackage(
  provider: ScoreCard,
  recipient: ScoreCard,
  recipientTraits: Set<Trait>,
): boolean {
  const recipientText = rulesForScoring(recipient);
  return (
    canReadyCard(
      readyProviderTargets(rulesForScoring(provider)),
      recipient,
      recipientTraits,
    ) && isRepeatableReadyRecipient(recipient, recipientText)
  );
}

export function grantsAssaultToEquipment(text: string): boolean {
  return (
    /\byour equipment(?:s)? (?:each )?(?:give|gain|have) \[assault(?: \d+)?\]/.test(
      text,
    ) ||
    /\bequipment(?:s)? you control (?:each )?(?:give|gain|have) \[assault(?: \d+)?\]/.test(
      text,
    )
  );
}

export function isEquipmentBeneficiary(card: ScoreCard, traits: Set<Trait>): boolean {
  return traits.has("equipment") && card.type !== "legend";
}

export function hasEquipmentAssaultPackage(
  provider: ScoreCard,
  beneficiary: ScoreCard,
  beneficiaryTraits: Set<Trait>,
): boolean {
  return (
    grantsAssaultToEquipment(rulesForScoring(provider)) &&
    isEquipmentBeneficiary(beneficiary, beneficiaryTraits)
  );
}

export function sumCapturedNumbers(text: string, pattern: RegExp): number {
  let total = 0;
  for (const match of text.matchAll(pattern)) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) total += value;
  }
  return total;
}

export function keywordMagnitude(text: string, keyword: "assault" | "shield"): number {
  let total = 0;
  const pattern = new RegExp(
    `\\[${keyword}(?: (\\d+))?\\](?=\\s|[.!?,;:]|$)`,
    "g",
  );
  for (const match of text.matchAll(pattern)) {
    const printed = Number(match[1]);
    total += Number.isFinite(printed) ? printed : 1;
  }
  return total;
}

export function writtenNumber(value: string | undefined): number {
  if (!value) return 1;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  const written: Readonly<Record<string, number>> = {
    a: 1,
    an: 1,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
  };
  return written[value] ?? 1;
}

export function tokenBoardValue(text: string): {
  value: number;
  temporary: boolean;
} {
  let value = 0;
  let temporary = false;
  for (const match of text.matchAll(
    /\bplay (?:(a|an|one|two|three|four|five|\d+)\s+)?(?:ready\s+|exhausted\s+)?(\d+) \[[ms]\] [^.!?]{0,42}\bunit tokens?\b[^.!?]{0,32}/g,
  )) {
    const quantity = clamp(writtenNumber(match[1]), 1, 12);
    const might = clamp(Number(match[2] ?? 0), 0, 20);
    const clause = match[0] ?? "";
    temporary = temporary || /\[temporary\]/.test(clause);
    value +=
      quantity *
      (might * (temporary ? 0.45 : 0.85) + (temporary ? 0.15 : 0.35)) *
      0.55;
  }
  return { value, temporary };
}
