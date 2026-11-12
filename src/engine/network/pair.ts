// Ported from Riftfoundry apps/web/src/lib/scoring.ts at origin/main 4b90179 (lines 5733-6261): tag references, synergyAffinity, analyzeCardPair.
// Port rule (spec 8.2): behaviour unchanged; top-level declarations are exported so the split files can share them.
import {
  TRAIT_LABELS, clamp, counterEffectValuation, deriveTraits, finiteOr, hasEquipmentAssaultPackage,
  hasTargetedReadyPackage, normalizedChampionIdentity, round, rulesForScoring,
  type CounterEffectValuation, type DeckEntry, type ScoreCard, type Trait,
} from "../mine";
import { PACKAGE_PAIRS } from "./packages";
import type { CardPairAnalysis, CombinationReason } from "./types";

export function cardNames(
  entries: DeckEntry[],
  predicate: (card: ScoreCard) => boolean,
) {
  return entries
    .filter(({ card }) => predicate(card))
    .map(({ card }) => card.name)
    .filter((name, index, names) => names.indexOf(name) === index)
    .sort((left, right) => left.localeCompare(right))
    .slice(0, 6);
}

export const REGION_TAGS = new Set([
  "Bandle City",
  "Bilgewater",
  "Demacia",
  "Freljord",
  "Icathia",
  "Ionia",
  "Ixtal",
  "Mount Targon",
  "Noxus",
  "Piltover",
  "Shadow Isles",
  "Shurima",
  "The Void",
  "Zaun",
]);

export const TRIBAL_TAGS = new Set([
  "Bird",
  "Cat",
  "Demon",
  "Dog",
  "Dragon",
  "Elite",
  "Equipment",
  "Fae",
  "Mech",
  "Pirate",
  "Poro",
  "Recruit",
  "Sentinel",
  "Spider",
  "Spirit",
  "Trifarian",
  "Yordle",
]);

export function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function textExplicitlyReferencesTag(card: ScoreCard, tag: string): boolean {
  if (REGION_TAGS.has(tag)) return false;
  const normalizedTag = tag.toLocaleLowerCase();
  if (normalizedTag.length < 3) return false;
  return new RegExp(`\\b${escapeRegExp(normalizedTag)}(?:s|es)?\\b`, "i").test(
    rulesForScoring(card),
  );
}

export function cardNameStem(card: ScoreCard): string {
  return normalizedChampionIdentity(card.name.split(",")[0] ?? card.name);
}

export function explicitlyReferencesCard(
  source: ScoreCard,
  target: ScoreCard,
): boolean {
  const targetStem = cardNameStem(target);
  if (targetStem.length < 4) return false;
  return new RegExp(`\\b${escapeRegExp(targetStem)}\\b`, "i").test(
    rulesForScoring(source),
  );
}

export function synergyAffinity(left: ScoreCard, right: ScoreCard): number {
  const leftTraits = deriveTraits(left);
  const rightTraits = deriveTraits(right);
  let score = 0;

  const sharedTags = [...new Set(left.tags)].filter((tag) =>
    right.tags.includes(tag),
  );
  for (const tag of sharedTags) {
    if (REGION_TAGS.has(tag)) continue;
    const explicitReference =
      textExplicitlyReferencesTag(left, tag) ||
      textExplicitlyReferencesTag(right, tag);
    if (explicitReference) {
      score += TRIBAL_TAGS.has(tag) ? 1.35 : 1.05;
    }
  }

  if (
    explicitlyReferencesCard(left, right) ||
    explicitlyReferencesCard(right, left)
  ) {
    score += 1.45;
  }

  for (const pair of PACKAGE_PAIRS) {
    if (
      (leftTraits.has(pair.left) && rightTraits.has(pair.right)) ||
      (leftTraits.has(pair.right) && rightTraits.has(pair.left))
    ) {
      score += 1.42;
    }
  }

  if (
    hasTargetedReadyPackage(left, right, rightTraits) ||
    hasTargetedReadyPackage(right, left, leftTraits)
  ) {
    score += 0.52;
  }

  if (
    hasEquipmentAssaultPackage(left, right, rightTraits) ||
    hasEquipmentAssaultPackage(right, left, leftTraits)
  ) {
    score += 0.64;
  }

  return round(clamp(score, 0, 8), 2);
}

export function orderedCardPair(
  left: ScoreCard,
  right: ScoreCard,
): [ScoreCard, ScoreCard] {
  return left.id.localeCompare(right.id) <= 0 ? [left, right] : [right, left];
}

export function hasAnyTrait(
  traits: Set<Trait>,
  candidates: readonly Trait[],
): boolean {
  return candidates.some((trait) => traits.has(trait));
}

export function analyzeCardPair(
  first: ScoreCard,
  second: ScoreCard,
): CardPairAnalysis {
  const [left, right] = orderedCardPair(first, second);
  const leftTraits = deriveTraits(left);
  const rightTraits = deriveTraits(right);
  const reasons: CombinationReason[] = [];
  let synergy = synergyAffinity(left, right);
  let antisynergy = 0;

  const sharedTags = [...new Set(left.tags)].filter((tag) =>
    right.tags.includes(tag),
  );
  for (const tag of sharedTags) {
    if (REGION_TAGS.has(tag)) continue;
    if (
      !textExplicitlyReferencesTag(left, tag) &&
      !textExplicitlyReferencesTag(right, tag)
    ) {
      continue;
    }
    const value = TRIBAL_TAGS.has(tag) ? 1.35 : 1.05;
    reasons.push({
      id: `tag-reference:${tag}:${left.id}:${right.id}`,
      label: `${tag} rules-text package`,
      kind: "synergy",
      scope: "explicit-reference",
      value,
      detail: `A printed ${tag} reference connects the tagged cards instead of relying on identity-only overlap.`,
      cardIds: [left.id, right.id],
      traits: [],
    });
  }

  if (
    explicitlyReferencesCard(left, right) ||
    explicitlyReferencesCard(right, left)
  ) {
    reasons.push({
      id: `reference:${left.id}:${right.id}`,
      label: "Explicit card reference",
      kind: "synergy",
      scope: "explicit-reference",
      value: 1.45,
      detail:
        "One card names the other card family in its official rules text.",
      cardIds: [left.id, right.id],
      traits: [],
    });
  }

  for (const pair of PACKAGE_PAIRS) {
    if (
      (leftTraits.has(pair.left) && rightTraits.has(pair.right)) ||
      (leftTraits.has(pair.right) && rightTraits.has(pair.left))
    ) {
      reasons.push({
        id: `package:${pair.left}:${pair.right}:${left.id}:${right.id}`,
        label: pair.label,
        kind: "synergy",
        scope: "mechanic-package",
        value: 1.42,
        detail: `${TRAIT_LABELS[pair.left]} connects to ${TRAIT_LABELS[pair.right]}.`,
        cardIds: [left.id, right.id],
        traits: [pair.left, pair.right],
      });
    }
  }

  if (
    hasEquipmentAssaultPackage(left, right, rightTraits) ||
    hasEquipmentAssaultPackage(right, left, leftTraits)
  ) {
    reasons.push({
      id: `equipment-assault:${left.id}:${right.id}`,
      label: "Equipment Assault grant",
      kind: "synergy",
      scope: "mechanic-package",
      value: 0.64,
      detail:
        "A printed Equipment-only Assault grant connects to a card that can actually be equipped.",
      cardIds: [left.id, right.id],
      traits: ["equip", "assault"],
    });
  }

  const leftCounter = counterEffectValuation(rulesForScoring(left));
  const rightCounter = counterEffectValuation(rulesForScoring(right));
  const isHighImpactLine = (card: ScoreCard, traits: Set<Trait>) => {
    const text = rulesForScoring(card);
    return (
      traits.has("skip") ||
      /\btake (?:a|an) (?:additional |extra )?turn\b/.test(text) ||
      /\bscore [2-9]\b/.test(text) ||
      /\bopponents? can'?t play cards this turn\b/.test(text)
    );
  };
  const canProtectLine = (
    counter: CounterEffectValuation,
    card: ScoreCard,
    traits: Set<Trait>,
  ) =>
    counter.protectedTargets === null ||
    (counter.protectedTargets.unit && traits.has("unit")) ||
    (counter.protectedTargets.gear && traits.has("gear")) ||
    (counter.protectedTargets.spell && card.type === "spell");
  const counterContext =
    leftCounter &&
    isHighImpactLine(right, rightTraits) &&
    canProtectLine(leftCounter, right, rightTraits)
      ? leftCounter
      : rightCounter &&
          isHighImpactLine(left, leftTraits) &&
          canProtectLine(rightCounter, left, leftTraits)
        ? rightCounter
        : null;
  if (counterContext) {
    const value = counterContext.contextValue;
    synergy += value;
    reasons.push({
      id: `counter-protection:${left.id}:${right.id}`,
      label: "Counter protection for a high-impact line",
      kind: "synergy",
      scope: "mechanic-package",
      value,
      detail:
        "A legal Reaction window can protect a high-impact scoring or extra-turn line by denying an opposing spell or ability; ordinary units, gears, and movement are not treated as counterable.",
      cardIds: [left.id, right.id],
      traits: ["counter", "reaction"],
    });
  }

  const leftExtraTurn = leftTraits.has("skip");
  const rightExtraTurn = rightTraits.has("skip");
  const leftHoldEngine = hasAnyTrait(leftTraits, ["hold", "scoring", "ready"]);
  const rightHoldEngine = hasAnyTrait(rightTraits, [
    "hold",
    "scoring",
    "ready",
  ]);
  if (
    (leftExtraTurn && rightHoldEngine) ||
    (rightExtraTurn && leftHoldEngine)
  ) {
    const value = 1.65;
    synergy += value;
    reasons.push({
      id: `extra-turn-value:${left.id}:${right.id}`,
      label: "Extra-turn battlefield conversion",
      kind: "synergy",
      scope: "mechanic-package",
      value,
      detail:
        "An additional turn can ready resources and convert Hold, scoring, or readying value a second time.",
      cardIds: [left.id, right.id],
      traits: ["skip", "hold"],
    });
  }

  const leftRamp = hasAnyTrait(leftTraits, ["energy-ramp", "cost-reduction"]);
  const rightRamp = hasAnyTrait(rightTraits, ["energy-ramp", "cost-reduction"]);
  if ((leftExtraTurn && rightRamp) || (rightExtraTurn && leftRamp)) {
    const value = 1.45;
    synergy += value;
    reasons.push({
      id: `extra-turn-ramp:${left.id}:${right.id}`,
      label: "Finisher acceleration",
      kind: "synergy",
      scope: "mechanic-package",
      value,
      detail:
        "Energy acceleration or cost reduction improves access to the high-cost additional-turn effect.",
      cardIds: [left.id, right.id],
      traits: ["skip", "energy-ramp"],
    });
  }

  const leftEnergy = finiteOr(left.energy, 0);
  const rightEnergy = finiteOr(right.energy, 0);
  const leftTopEndSupport = hasAnyTrait(leftTraits, [
    "energy-ramp",
    "cost-reduction",
    "channel-rune",
  ]);
  const rightTopEndSupport = hasAnyTrait(rightTraits, [
    "energy-ramp",
    "cost-reduction",
    "channel-rune",
  ]);
  if (
    (leftTopEndSupport && rightEnergy >= 6 && !rightExtraTurn) ||
    (rightTopEndSupport && leftEnergy >= 6 && !leftExtraTurn)
  ) {
    const supportedEnergy = leftTopEndSupport ? rightEnergy : leftEnergy;
    const value = round(
      clamp(0.38 + (supportedEnergy - 6) * 0.08, 0.38, 0.78),
      2,
    );
    synergy += value;
    reasons.push({
      id: `top-end-support:${left.id}:${right.id}`,
      label: "Top-end acceleration",
      kind: "synergy",
      scope: "mechanic-package",
      value,
      detail:
        "Resource acceleration or cost reduction makes the expensive payoff reachable without treating raw cost as upside.",
      cardIds: [left.id, right.id],
      traits: ["energy-ramp", "power-demand"],
    });
  }

  if (
    hasTargetedReadyPackage(left, right, rightTraits) ||
    hasTargetedReadyPackage(right, left, leftTraits)
  ) {
    reasons.push({
      id: `ready-trigger:${left.id}:${right.id}`,
      label: "Repeatable trigger",
      kind: "synergy",
      scope: "mechanic-package",
      value: 0.52,
      detail:
        "A printed ready effect can target the other card and reuse its intrinsic Assault, self trigger, or exhaust ability.",
      cardIds: [left.id, right.id],
      traits: ["ready"],
    });
  }

  const leftProtection = hasAnyTrait(leftTraits, [
    "tank",
    "deflect",
    "backline",
    "damage-prevention",
  ]);
  const rightProtection = hasAnyTrait(rightTraits, [
    "tank",
    "deflect",
    "backline",
    "damage-prevention",
  ]);
  const leftEngine = hasAnyTrait(leftTraits, [
    "hold",
    "draw",
    "energy-ramp",
    "spell-matters",
    "token-matters",
    "death-payoff",
    "trash-payoff",
  ]);
  const rightEngine = hasAnyTrait(rightTraits, [
    "hold",
    "draw",
    "energy-ramp",
    "spell-matters",
    "token-matters",
    "death-payoff",
    "trash-payoff",
  ]);
  if ((leftProtection && rightEngine) || (rightProtection && leftEngine)) {
    const value = 0.36;
    synergy += value;
    reasons.push({
      id: `protect-engine:${left.id}:${right.id}`,
      label: "Protected engine",
      kind: "synergy",
      scope: "mechanic-package",
      value,
      detail:
        "Protection is worth more when it preserves a persistent draw, resource, Hold, or package payoff.",
      cardIds: [left.id, right.id],
      traits: ["deflect", "hold"],
    });
  }

  if (
    (leftTraits.has("legion") && rightEnergy <= 2) ||
    (rightTraits.has("legion") && leftEnergy <= 2)
  ) {
    const value = 0.3;
    synergy += value;
    reasons.push({
      id: `legion-sequencing:${left.id}:${right.id}`,
      label: "Legion sequencing",
      kind: "synergy",
      scope: "mechanic-package",
      value,
      detail:
        "The cheap card can turn on Legion while leaving enough Energy to play the payoff in the same turn.",
      cardIds: [left.id, right.id],
      traits: ["legion"],
    });
  }

  if (leftEnergy >= 6 && rightEnergy >= 6) {
    const value = round(
      clamp(0.18 + (leftEnergy + rightEnergy - 12) * 0.055, 0.18, 0.72),
      2,
    );
    antisynergy += value;
    reasons.push({
      id: `curve-collision:${left.id}:${right.id}`,
      label: "Top-end curve collision",
      kind: "antisynergy",
      scope: "resource-conflict",
      value: -value,
      detail:
        "Two expensive cards increase dead-opening and same-turn sequencing risk unless the deck supplies acceleration.",
      cardIds: [left.id, right.id],
      traits: ["power-demand"],
    });
  }

  const leftPower = Math.max(0, finiteOr(left.power, 0));
  const rightPower = Math.max(0, finiteOr(right.power, 0));
  const sharedPowerDomains = left.domains.some(
    (domain) => domain !== "colorless" && right.domains.includes(domain),
  );
  if (
    leftPower >= 2 &&
    rightPower >= 2 &&
    leftEnergy <= 4 &&
    rightEnergy <= 4 &&
    sharedPowerDomains
  ) {
    const value = round(
      clamp(0.2 + (leftPower + rightPower - 4) * 0.09, 0.2, 0.65),
      2,
    );
    antisynergy += value;
    reasons.push({
      id: `early-power-collision:${left.id}:${right.id}`,
      label: "Early colored-Power collision",
      kind: "antisynergy",
      scope: "resource-conflict",
      value: -value,
      detail:
        "Both early plays recycle multiple matching runes, competing for the same colored Power window and future Energy.",
      cardIds: [left.id, right.id],
      traits: ["power-demand"],
    });
  }

  const leftTrashConsumer = hasAnyTrait(leftTraits, [
    "flow",
    "trash-banish",
    "trash-retrieval",
  ]);
  const rightTrashConsumer = hasAnyTrait(rightTraits, [
    "flow",
    "trash-banish",
    "trash-retrieval",
  ]);
  const suppliesTrash =
    hasAnyTrait(leftTraits, ["trash-filler", "burn-self", "discard"]) ||
    hasAnyTrait(rightTraits, ["trash-filler", "burn-self", "discard"]);
  if (leftTrashConsumer && rightTrashConsumer && !suppliesTrash) {
    const value = 0.42;
    antisynergy += value;
    reasons.push({
      id: `trash-contention:${left.id}:${right.id}`,
      label: "Shared trash demand",
      kind: "antisynergy",
      scope: "resource-conflict",
      value: -value,
      detail:
        "Both cards consume or depend on the trash without either card supplying fuel.",
      cardIds: [left.id, right.id],
      traits: ["trash-payoff"],
    });
  }

  synergy = round(clamp(synergy, 0, 10), 2);
  antisynergy = round(clamp(antisynergy, 0, 5), 2);
  return {
    cardIds: [left.id, right.id],
    synergy,
    antisynergy,
    net: round(synergy - antisynergy, 2),
    reasons: reasons.sort(
      (a, b) =>
        Math.abs(b.value) - Math.abs(a.value) || a.id.localeCompare(b.id),
    ),
  };
}

