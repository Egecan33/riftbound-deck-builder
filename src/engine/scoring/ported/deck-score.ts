// Ported from Riftfoundry apps/web/src/lib/scoring.ts at origin/main 4b90179 (lines 119-125, 133-150, 186-253,
// 396-442, 5077-5195, 5376-5732, 6493-8090): DeckScore types, deck normalisation, rune allocation, equipment
// context, rune strain, scoreDeck.
// Port rule (spec 8.4): behaviour unchanged; top-level declarations are exported so the split files can share them.
import {
  DECK_CURVE_TARGETS, baseCardRating, baseCardRatingBreakdown, championMatchesLegend, clamp, clausesForScoring,
  conditionalClauseCount, controllerInstructionClauses, curveBandFor, deriveTraits, finiteOr, instructionAmount,
  isEquipmentCard, isImmediatePlayEffect, isMainDeckScoreCard, isSignatureCard, requiresFriendlyEquipment, round,
  cardTierGrade, rulesForScoring, signatureMatchesLegend,
  type BaseCardRatingBreakdown, type BaseCardRatingComponent, type CardTierGrade, type CurveBandId, type DeckEntry,
  type ScoreCard, type Trait,
} from "../../mine";
import {
  ORPHAN_ENGINE_RULES, PACKAGE_PAIRS, REGION_TAGS, TRIBAL_TAGS, analyzeCardPair, analyzeCardTripleWithResolvers,
  cardNames, hasAnyTrait, orderedCardPair, synergyAffinity, textExplicitlyReferencesTag,
  type CardPairAnalysis, type CardTripleAnalysis, type CombinationReason,
} from "../../network";
import {
  DEFAULT_EARLY_DRAWS, STANDARD_OPENING_HAND, cardRuneReliability, earlyCombinationReliability,
  earlyPackageReliability, hypergeometricAtLeast, type RuneRecommendation,
} from "../../maths/hypergeo";
import {
  SCORE_MODEL_VERSION, bannedBattlefields, bannedCards, previewSetLabel, previewSetLegalFrom, rateCardWithEvidence,
  resolveDeckMetaOverlay, type BanSets, type GameplayEvidence, type MetaCalibration,
} from "./externals";
export interface ScoreContribution {
  id: string;
  label: string;
  value: number;
  detail: string;
  cards?: string[];
}
export interface DeckScore {
  total: number;
  base: number;
  synergy: number;
  antisynergy: number;
  compatibility: number;
  structure: number;
  meta: number;
  confidence: "foundation" | "developing" | "calibrated";
  contributions: ScoreContribution[];
  cardBreakdown: CardScoreBreakdown[];
  runes: RuneRecommendation[];
  legality: {
    legal: boolean;
    issues: string[];
    warnings: string[];
  };
}
export interface CardScorePartner {
  cardId: string;
  name: string;
  synergy: number;
  antisynergy: number;
  net: number;
  reasons: string[];
}

export interface EquipmentActivationBreakdown {
  /** Value retained when the card's Equipment line is unsupported. */
  standaloneFloor: number;
  /** Maximum value available when every printed requirement is reliable. */
  supportedCeiling: 1;
  /** Deck-context interpolation between the standalone floor and ceiling. */
  activation: number;
  /** Reliability of finding compatible Equipment, carriers, and fresh supply. */
  supportReliability: number;
  equipmentCopies: number;
  /** Causal providers split by the role they supply. */
  providerRoles: {
    equipment: string[];
    carriers: string[];
  };
  providerCardIds: string[];
  carrierCopies: number;
  maximumEquipmentEnergy: number | null;
  attachedStateRequired: boolean;
  /** Reusable detach windows; these do not consume fresh Equipment. */
  detachTempoDemand: number;
  /** Kill/sacrifice windows that require fresh Equipment objects. */
  consumptionDemand: number;
  /** Selected-copy deck RDS retained without the Equipment-dependent text. */
  unconditionalValue: number;
  /** Selected-copy deck RDS available from Equipment-dependent text. */
  conditionalValue: number;
  /** Conditional RDS realized at the modeled support reliability. */
  realizedConditionalValue: number;
  /** Extra deck-RDS tempo paid to reattach between reusable detach windows. */
  reattachTempoTax: number;
  /** Exact deck-RDS delta applied by this context. */
  scoreAdjustment: number;
  detail: string;
}

export interface CardScoreBreakdown {
  cardId: string;
  name: string;
  quantity: number;
  grade: CardTierGrade;
  foundation: number;
  base: number;
  synergy: number;
  antisynergy: number;
  compatibility: number;
  structure: number;
  meta: number;
  floorAdjustment: number;
  total: number;
  partners: CardScorePartner[];
  traits: Trait[];
  effectProfile: BaseCardRatingBreakdown;
  curveBand: CurveBandId | null;
  curveRepair: number;
  runeReliability: number;
  equipmentActivation?: EquipmentActivationBreakdown | null;
  confidence: "stable" | "context-sensitive";
}
export type DeckFormat = "standard-1v1" | "vendetta-prerift";

export interface ChampionRuleProfile {
  required: boolean;
  countsInMainDeck: boolean;
  mustMatchLegendChampion: boolean;
}

export interface SealedDeckRuleProfile {
  minimumMainDeck: number;
  maximumMainDeck: number | null;
  maximumDomains: number;
  battlefieldCount: number;
}

// FORGE CHANGE: extends BanSets (bans, preview sets and card evidence are passed in, see externals.ts).
export interface DeckScoreOptions extends BanSets {
  gameplayEvidence?: GameplayEvidence | null;
  legend?: ScoreCard | null;
  champion?: ScoreCard | null;
  battlefields?: ScoreCard[];
  metaAdjustment?: number;
  metaCalibration?: MetaCalibration;
  format?: DeckFormat;
  sealedPool?: Record<string, number>;
  blankBattlefields?: number;
  championRules?: Partial<ChampionRuleProfile>;
  sealedRules?: Partial<SealedDeckRuleProfile>;
  /**
   * Reference size used to normalize the additive foundation. Keeping this
   * separate from the number of cards currently selected prevents a one-card
   * draft from receiving a complete-deck base score.
   */
  targetDeckSize?: number;
  openingHand?: number;
  earlyDraws?: number;
  runeDeckSize?: number;
  /**
   * Full deck views evaluate closed three-card motifs. Candidate ranking uses
   * pair depth during before/after deltas because it performs its own exact
   * candidate triple pass.
   */
  combinationDepth?: "full" | "pair";
}

export const FOUNDATION_DECK_SCALE = 10.5;
export function safeQuantity(quantity: number): number {
  return Number.isFinite(quantity)
    ? Math.max(0, Math.min(250, Math.floor(quantity)))
    : 0;
}

export function normalizeDeckEntries(entries: readonly DeckEntry[]): DeckEntry[] {
  const entriesById = new Map<string, DeckEntry>();
  for (const entry of entries) {
    const existing = entriesById.get(entry.card.id);
    const quantity = Number.isFinite(entry.quantity) ? entry.quantity : 0;
    entriesById.set(entry.card.id, {
      card: existing?.card ?? entry.card,
      quantity: (existing?.quantity ?? 0) + quantity,
    });
  }
  return [...entriesById.values()]
    .map((entry) => ({ ...entry, quantity: safeQuantity(entry.quantity) }))
    .filter(({ quantity }) => quantity > 0)
    .sort((left, right) => left.card.id.localeCompare(right.card.id));
}

export function normalizeMainDeckEntries(entries: readonly DeckEntry[]): DeckEntry[] {
  return normalizeDeckEntries(entries).filter(({ card }) =>
    isMainDeckScoreCard(card),
  );
}

export function weightedCards(entries: DeckEntry[]): ScoreCard[] {
  return entries.flatMap(({ card, quantity }) =>
    Array.from({ length: safeQuantity(quantity) }, () => card),
  );
}

export function allocateRunes(
  entries: DeckEntry[],
  fallbackDomains: readonly string[] = [],
  targetTotal = 12,
): RuneRecommendation[] {
  const demand = new Map<string, number>();

  for (const { card, quantity } of entries) {
    const copies = safeQuantity(quantity);
    if (copies === 0) continue;
    const power = Math.max(0, card.power ?? 0);
    const coloredDomains = card.domains.filter(
      (domain) => domain !== "colorless",
    );
    if (coloredDomains.length === 0) continue;
    const energy = Math.max(1, card.energy ?? 6);
    const curveUrgency = 1 + Math.max(0, 6 - energy) * 0.12;
    const coloredDemand = power > 0 ? power : 0.18;
    const perDomain =
      (coloredDemand * curveUrgency * copies) / coloredDomains.length;
    for (const domain of coloredDomains) {
      demand.set(domain, (demand.get(domain) ?? 0) + perDomain);
    }
  }

  if (demand.size === 0) {
    for (const domain of new Set(fallbackDomains)) {
      if (domain !== "colorless") demand.set(domain, 1);
    }
  }
  if (demand.size === 0) return [];

  const totalDemand = [...demand.values()].reduce(
    (sum, value) => sum + value,
    0,
  );
  const preliminary = [...demand.entries()].map(([domain, value]) => ({
    domain,
    demand: round(value),
    exact: (value / totalDemand) * targetTotal,
    count: Math.floor((value / totalDemand) * targetTotal),
  }));
  let remaining =
    targetTotal - preliminary.reduce((sum, item) => sum + item.count, 0);

  for (const item of [...preliminary].sort((a, b) => {
    const remainderDifference = b.exact - b.count - (a.exact - a.count);
    return remainderDifference || a.domain.localeCompare(b.domain);
  })) {
    if (remaining <= 0) break;
    item.count += 1;
    remaining -= 1;
  }

  if (preliminary.length === 2 && targetTotal >= 6) {
    const minimumSide = Math.max(1, Math.floor(targetTotal / 3));
    const maximumSide = targetTotal - minimumSide;
    const low = preliminary.find((item) => item.count < minimumSide);
    if (low) {
      const high = preliminary.find((item) => item !== low)!;
      const transfer = Math.min(
        minimumSide - low.count,
        Math.max(0, high.count - minimumSide),
      );
      low.count += transfer;
      high.count -= transfer;
    }
    const high = preliminary.find((item) => item.count > maximumSide);
    if (high) {
      const lowSide = preliminary.find((item) => item !== high)!;
      const transfer = high.count - maximumSide;
      high.count -= transfer;
      lowSide.count += transfer;
    }
  }

  return preliminary
    .map(({ domain, count, demand: domainDemand }) => ({
      domain,
      count,
      demand: domainDemand,
    }))
    .sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain));
}

export interface EquipmentRequirement {
  needsEquipment: boolean;
  needsCarrier: boolean;
  maximumEquipmentEnergy: number | null;
  attachedStateRequired: boolean;
  detachTempoPerUse: number;
  destructiveConsumptionPerUse: number;
}

export interface EquipmentContextResult {
  breakdown: EquipmentActivationBreakdown;
  penalty: number;
}

export function equipmentInstructionPerUse(
  text: string,
  verbs: readonly ("detach" | "kill" | "sacrifice")[],
): number {
  return clamp(
    controllerInstructionClauses(text, verbs.join("|"), true).reduce(
      (total, clause) => {
        if (!/\bequipment\b/.test(clause)) return total;
        const verb = verbs.find((candidate) =>
          new RegExp(`\\b${candidate}\\b`).test(clause),
        );
        return verb ? total + instructionAmount(clause, verb, 1) : total;
      },
      0,
    ),
    0,
    12,
  );
}

export function equipmentConditionalFoundationValue(card: ScoreCard): number {
  const profile = baseCardRatingBreakdown(card);
  const text = rulesForScoring(card);
  const equipmentSpecificLabels = new Set([
    "Weaponmaster Equipment access",
    "Equipment attachment access",
    "Granted Equipment attachment",
  ]);

  if (isEquipmentCard(card)) {
    const conditional = profile.mechanics.reduce((total, mechanic) => {
      if (mechanic.value <= 0) return total;
      if (mechanic.label === "Printed Might") return total + mechanic.value;
      if (mechanic.label === "Rules-text utility") {
        return total + Math.min(0.18, mechanic.value);
      }
      return total;
    }, 0);
    return round(clamp(conditional, 0, Math.max(0, profile.total - 1.5)), 3);
  }

  const dependentClauses = clausesForScoring(card).filter(({ text: clause }) =>
    /\bequipment\b|\bequipped\b|\[weaponmaster\]/.test(clause),
  );
  const dependentText = dependentClauses
    .map(({ text: clause }) => clause)
    .join(" ");
  const equipmentResolutionText =
    /\bchoose an equipped friendly unit\b|\bchoose a unit and an equipment with the same controller\b|\bfor each equipment\b/.test(
      text,
    )
      ? text
      : dependentText;
  const dependentComponents = new Set<BaseCardRatingComponent>();
  if (/\bdraw\b|\binto your hand\b/.test(equipmentResolutionText)) {
    dependentComponents.add("cardAdvantage");
  }
  if (
    /\bkill\b|\bbanish\b|\bstun\b|\bdeals?\b[^.!?]{0,48}\bdamage\b|[-+]\d+ (?:\[[ms]\]|might\b)/.test(
      equipmentResolutionText,
    )
  ) {
    dependentComponents.add("boardControl");
  }
  if (/\bbuff\b|\bmight\b|\[assault/.test(equipmentResolutionText)) {
    dependentComponents.add("expectedStrength");
  }
  if (
    /\bplay\b|\bignoring\b[^.!?]{0,32}\bcost\b/.test(equipmentResolutionText)
  ) {
    dependentComponents.add("resourceValue");
  }
  if (
    /\bscore\b|\bhold\b|\bconquer\b|\bmov(?:e|es|ed|ing)\b/.test(dependentText)
  ) {
    dependentComponents.add("battlefieldControl");
  }

  const conditional = profile.mechanics.reduce((total, mechanic) => {
    if (mechanic.value <= 0) return total;
    if (equipmentSpecificLabels.has(mechanic.label)) {
      return total + mechanic.value;
    }
    return dependentComponents.has(mechanic.component)
      ? total + mechanic.value
      : total;
  }, 0);
  const explicitAttachmentWithoutMechanic =
    /\battach that equipment to that unit\b|\battach one of its equipment to me\b|\battach it to me\b/.test(
      text,
    ) &&
    !profile.mechanics.some(
      ({ label }) => label === "Equipment attachment access",
    );
  const attachmentFlexibilitySlice = explicitAttachmentWithoutMechanic
    ? Math.min(0.08, Math.max(0, profile.flexibility))
    : 0;
  return round(
    clamp(
      conditional + attachmentFlexibilitySlice,
      0,
      Math.max(0, profile.total - 1.5),
    ),
    3,
  );
}

export function equipmentRequirementFor(card: ScoreCard): EquipmentRequirement | null {
  const text = rulesForScoring(card);
  const equipment = isEquipmentCard(card);
  const needsEquipment = requiresFriendlyEquipment(card, text);
  if (!equipment && !needsEquipment) return null;

  const maximumEquipmentEnergyMatch = text.match(
    /\bequipment with energy cost no more than \[(\d+)\]/,
  );
  const maximumEquipmentEnergy = maximumEquipmentEnergyMatch
    ? clamp(Number(maximumEquipmentEnergyMatch[1]), 0, 20)
    : null;
  const attachedStateRequired =
    equipment ||
    /\bequipped friendly unit\b|\bequipment attached to\b|\battach (?:an?|one of your|a detached|an attached|that) equipment\b|\battach one of its equipment\b|\battach it to (?:me|a|the|that|another|friendly)\b/.test(
      text,
    );
  const needsExternalCarrier =
    /\bequipped friendly unit\b|\bchoose (?:a|an) unit and an equipment\b|\bone of its equipment\b/.test(
      text,
    );
  const needsCarrier =
    equipment ||
    needsExternalCarrier ||
    (card.type !== "unit" &&
      /\bequipped friendly unit\b|\bchoose (?:a|an) unit and an equipment\b|\battach [^.!?]{0,48}\bto (?:a|the|that|another|friendly) unit\b/.test(
        text,
      ));

  return {
    needsEquipment,
    needsCarrier,
    maximumEquipmentEnergy,
    attachedStateRequired,
    detachTempoPerUse: equipmentInstructionPerUse(text, ["detach"]),
    destructiveConsumptionPerUse: equipmentInstructionPerUse(text, [
      "kill",
      "sacrifice",
    ]),
  };
}

export function equipmentContextForCard(
  card: ScoreCard,
  quantity: number,
  entries: readonly DeckEntry[],
  deckSize: number,
  openingHand: number,
  earlyDraws: number,
): EquipmentContextResult | null {
  const requirement = equipmentRequirementFor(card);
  if (!requirement) return null;

  const compatibleEquipment = entries.filter(({ card }) => {
    if (!requirement.needsEquipment) return false;
    if (!isEquipmentCard(card)) return false;
    return !(
      requirement.maximumEquipmentEnergy !== null &&
      finiteOr(card.energy, Number.POSITIVE_INFINITY) >
        requirement.maximumEquipmentEnergy
    );
  });
  const compatibleEquipmentCopies = compatibleEquipment.reduce(
    (total, entry) => total + safeQuantity(entry.quantity),
    0,
  );
  const equipmentProviderIds = [
    ...new Set(compatibleEquipment.map(({ card }) => card.id)),
  ].sort((left, right) => left.localeCompare(right));
  const carrierEntries = requirement.needsCarrier
    ? entries.filter(
        ({ card: candidate }) =>
          candidate.type === "unit" && candidate.id !== card.id,
      )
    : [];
  const carrierCopies = carrierEntries.reduce(
    (total, entry) => total + safeQuantity(entry.quantity),
    0,
  );
  const carrierProviderIds = [
    ...new Set(carrierEntries.map(({ card: candidate }) => candidate.id)),
  ].sort((left, right) => left.localeCompare(right));
  const providerCardIds = [
    ...new Set([...equipmentProviderIds, ...carrierProviderIds]),
  ].sort((left, right) => left.localeCompare(right));
  const draws = openingHand + earlyDraws;
  let supportReliability = 1;
  if (requirement.needsEquipment) {
    supportReliability = requirement.needsCarrier
      ? earlyCombinationReliability(
          deckSize,
          [
            { copies: compatibleEquipmentCopies, required: 1 },
            { copies: carrierCopies, required: 1 },
          ],
          openingHand,
          earlyDraws,
        )
      : hypergeometricAtLeast(deckSize, compatibleEquipmentCopies, draws, 1);
  } else if (requirement.needsCarrier) {
    supportReliability = hypergeometricAtLeast(
      deckSize,
      carrierCopies,
      draws,
      1,
    );
  }

  const copies = safeQuantity(quantity);
  const detachTempoDemand = copies * requirement.detachTempoPerUse;
  const consumptionDemand = copies * requirement.destructiveConsumptionPerUse;
  if (consumptionDemand > 0) {
    const freshSupply = clamp(
      compatibleEquipmentCopies / consumptionDemand,
      0,
      1,
    );
    supportReliability *= 0.35 + freshSupply * 0.65;
  }
  supportReliability = round(clamp(supportReliability, 0, 1), 3);
  const profile = baseCardRatingBreakdown(card);
  const conditionalFoundationValue = equipmentConditionalFoundationValue(card);
  const unconditionalFoundationValue = Math.max(
    0,
    profile.total - conditionalFoundationValue,
  );
  const standaloneFloor = round(
    profile.total > 0 ? unconditionalFoundationValue / profile.total : 1,
    3,
  );
  const activation = round(
    profile.total > 0
      ? (unconditionalFoundationValue +
          conditionalFoundationValue * supportReliability) /
          profile.total
      : 1,
    3,
  );
  const deckScale = FOUNDATION_DECK_SCALE / Math.max(1, deckSize);
  const unconditionalValue = round(
    unconditionalFoundationValue * copies * deckScale,
    3,
  );
  const conditionalValue = round(
    conditionalFoundationValue * copies * deckScale,
    3,
  );
  const realizedConditionalValue = round(
    conditionalValue * supportReliability,
    3,
  );
  const reattachTempoTax = round(
    Math.max(0, detachTempoDemand - 1) * 0.22 * supportReliability * deckScale,
    3,
  );
  const scoreAdjustment = round(
    realizedConditionalValue - conditionalValue - reattachTempoTax,
    3,
  );
  const penalty = Math.max(0, -scoreAdjustment);
  const ceilingText =
    requirement.maximumEquipmentEnergy === null
      ? "any Energy cost"
      : `Energy ${requirement.maximumEquipmentEnergy} or less`;
  const detachText =
    detachTempoDemand > 0
      ? ` ${detachTempoDemand} reusable detach window${detachTempoDemand === 1 ? "" : "s"} add ${reattachTempoTax} RDS of between-use re-equip tempo without consuming fresh Equipment.`
      : "";
  const consumptionText =
    consumptionDemand > 0
      ? ` ${consumptionDemand} destructive kill/sacrifice window${consumptionDemand === 1 ? "" : "s"} require fresh Equipment supply.`
      : "";
  const carrierText = requirement.needsCarrier
    ? ` and ${carrierCopies} unit carrier cop${carrierCopies === 1 ? "y" : "ies"}`
    : "";
  const detail = `${compatibleEquipmentCopies} compatible Equipment ${compatibleEquipmentCopies === 1 ? "copy" : "copies"} (${ceilingText})${carrierText} produce ${round(supportReliability * 100)}% modeled support reliability.${detachText}${consumptionText}`;

  return {
    breakdown: {
      standaloneFloor,
      supportedCeiling: 1,
      activation,
      supportReliability,
      equipmentCopies: compatibleEquipmentCopies,
      providerRoles: {
        equipment: equipmentProviderIds,
        carriers: carrierProviderIds,
      },
      providerCardIds,
      carrierCopies,
      maximumEquipmentEnergy: requirement.maximumEquipmentEnergy,
      attachedStateRequired: requirement.attachedStateRequired,
      detachTempoDemand,
      consumptionDemand,
      unconditionalValue,
      conditionalValue,
      realizedConditionalValue,
      reattachTempoTax,
      scoreAdjustment,
      detail,
    },
    penalty,
  };
}

export function runeDemandStrain(
  entries: DeckEntry[],
  runes: RuneRecommendation[],
): number {
  const allocated = new Map(runes.map((rune) => [rune.domain, rune.count]));
  let weightedStrain = 0;
  let weightedCopies = 0;

  for (const { card, quantity } of entries) {
    const copies = safeQuantity(quantity);
    const power = clamp(finiteOr(card.power, 0), 0, 12);
    if (copies === 0 || power === 0) continue;
    const domains = card.domains.filter((domain) => domain !== "colorless");
    if (domains.length === 0) continue;
    const availableRunes = domains.reduce(
      (sum, domain) => sum + (allocated.get(domain) ?? 0),
      0,
    );
    const energy = clamp(finiteOr(card.energy, 6), 1, 20);
    const curveUrgency = 1 + Math.max(0, 5 - energy) * 0.12;
    const pressure =
      (power ** 1.35 / Math.max(1, availableRunes)) * curveUrgency;
    weightedStrain += pressure * copies;
    weightedCopies += copies;
  }

  if (weightedCopies === 0) return 0;
  const averagePressure = weightedStrain / weightedCopies;
  return round(clamp((averagePressure - 0.22) * 4.2, 0, 5.5));
}

// scoring.ts lines 6493-6583
export const DEAD_PAYOFF_RULES: ReadonlyArray<{
  id: string;
  payoffTraits: Trait[];
  supportTraits: Trait[];
  label: string;
  minimumPayoffs: number;
  minimumSupport: number;
  coefficient: number;
  cap: number;
}> = [
  {
    id: "dead-empower-payoff",
    payoffTraits: ["empowered-payoff", "disempower"],
    supportTraits: ["empower"],
    label: "Empower payoffs without enablers",
    minimumPayoffs: 3,
    minimumSupport: 2,
    coefficient: 0.38,
    cap: 4,
  },
  {
    id: "dead-xp-payoff",
    payoffTraits: ["level", "xp-spend"],
    supportTraits: ["hunt"],
    label: "XP outlets without generation",
    minimumPayoffs: 3,
    minimumSupport: 2,
    coefficient: 0.38,
    cap: 4,
  },
  {
    id: "dead-gear-payoff",
    payoffTraits: ["gear-matters"],
    supportTraits: ["gear"],
    label: "Gear payoffs without Gear",
    minimumPayoffs: 1,
    minimumSupport: 3,
    coefficient: 0.34,
    cap: 3.8,
  },
  {
    id: "dead-spell-payoff",
    payoffTraits: ["spell-matters"],
    supportTraits: ["spell"],
    label: "Spell payoffs without spells",
    minimumPayoffs: 3,
    minimumSupport: 5,
    coefficient: 0.28,
    cap: 3.4,
  },
  {
    id: "dead-token-payoff",
    payoffTraits: ["token-matters", "wide", "legion"],
    supportTraits: ["token"],
    label: "Token payoffs without production",
    minimumPayoffs: 3,
    minimumSupport: 2,
    coefficient: 0.3,
    cap: 3.5,
  },
  {
    id: "dead-trash-payoff",
    payoffTraits: ["flow", "trash-retrieval", "trash-payoff"],
    supportTraits: ["trash-filler", "burn-self", "discard"],
    label: "Trash payoffs without setup",
    minimumPayoffs: 4,
    minimumSupport: 3,
    coefficient: 0.34,
    cap: 4.2,
  },
  {
    id: "dead-movement-payoff",
    payoffTraits: ["movement-payoff"],
    supportTraits: ["movement"],
    label: "Move triggers without movement",
    minimumPayoffs: 3,
    minimumSupport: 2,
    coefficient: 0.3,
    cap: 3.2,
  },
  {
    id: "dead-topdeck-payoff",
    payoffTraits: ["topdeck-payoff"],
    supportTraits: ["predict", "recycle"],
    label: "Top-deck payoffs without control",
    minimumPayoffs: 3,
    minimumSupport: 2,
    coefficient: 0.3,
    cap: 3.2,
  },
];

export function countCardsWithAnyTrait(cards: ScoreCard[], traits: Trait[]): number {
  return cards.filter((card) => {
    const cardTraits = deriveTraits(card);
    return traits.some((trait) => cardTraits.has(trait));
  }).length;
}

export function contextualAffinity(context: ScoreCard, candidate: ScoreCard): number {
  let affinity = synergyAffinity(context, candidate);
  if (
    context.type === "legend" &&
    candidate.type === "unit" &&
    championMatchesLegend(context, candidate)
  ) {
    affinity += 1.35;
  }
  return round(clamp(affinity, 0, 8), 2);
}

export function conditionalSupportCard(card: ScoreCard): boolean {
  const text = rulesForScoring(card);
  return conditionalClauseCount(text) > 0 && !isImmediatePlayEffect(text);
}

export function validExternalLegend(
  legend: ScoreCard | null | undefined,
): ScoreCard | null {
  return legend?.type === "legend" ? legend : null;
}

export function scoreDeck(
  requestedEntries: DeckEntry[],
  options: DeckScoreOptions = {},
): DeckScore {
  const normalizedRequestedEntries = normalizeDeckEntries(requestedEntries);
  const invalidMainDeckEntries = normalizedRequestedEntries.filter(
    ({ card }) => !isMainDeckScoreCard(card),
  );
  const entries = normalizedRequestedEntries.filter(({ card }) =>
    isMainDeckScoreCard(card),
  );
  const legend = validExternalLegend(options.legend);
  const format = options.format ?? "standard-1v1";
  const isPreRift = format === "vendetta-prerift";
  const sealedMinimumMainDeck = Math.floor(
    clamp(finiteOr(options.sealedRules?.minimumMainDeck, 25), 1, 200),
  );
  const requestedSealedMaximum = options.sealedRules?.maximumMainDeck;
  const sealedMaximumMainDeck =
    requestedSealedMaximum === null || requestedSealedMaximum === undefined
      ? null
      : Math.floor(
          clamp(
            finiteOr(requestedSealedMaximum, 200),
            sealedMinimumMainDeck,
            200,
          ),
        );
  const sealedMaximumDomains = Math.floor(
    clamp(finiteOr(options.sealedRules?.maximumDomains, 3), 1, 6),
  );
  const sealedBattlefieldCount = Math.floor(
    clamp(finiteOr(options.sealedRules?.battlefieldCount, 3), 0, 10),
  );
  const sealedBattlefieldLabel =
    sealedBattlefieldCount === 3 ? "three" : String(sealedBattlefieldCount);
  const sealedDomainLabel =
    sealedMaximumDomains === 3 ? "three" : String(sealedMaximumDomains);
  const sealedDomainNoun = sealedMaximumDomains === 1 ? "domain" : "domains";
  const championRules: ChampionRuleProfile = {
    ...(isPreRift
      ? {
          required: false,
          countsInMainDeck: false,
          mustMatchLegendChampion: false,
        }
      : {
          required: true,
          countsInMainDeck: true,
          mustMatchLegendChampion: true,
        }),
    ...options.championRules,
  };
  const targetDeckSize = Math.floor(
    clamp(
      finiteOr(options.targetDeckSize, isPreRift ? sealedMinimumMainDeck : 40),
      1,
      200,
    ),
  );
  const openingHand = Math.floor(
    clamp(
      finiteOr(options.openingHand, STANDARD_OPENING_HAND),
      0,
      targetDeckSize,
    ),
  );
  const earlyDraws = Math.floor(
    clamp(finiteOr(options.earlyDraws, DEFAULT_EARLY_DRAWS), 0, targetDeckSize),
  );
  const runeDeckSize = Math.floor(
    clamp(finiteOr(options.runeDeckSize, 12), 1, 40),
  );
  const cards = weightedCards(entries);
  const totalCards = cards.length;
  const contributions: ScoreContribution[] = [];
  const traitCounts = new Map<Trait, number>();
  const foundationSum =
    cards.reduce(
      (sum, card) => sum + Math.round(baseCardRating(card) * 100),
      0,
    ) / 100;
  const selectedEntries = entries
    .map(({ card, quantity }) => ({
      card,
      quantity: safeQuantity(quantity),
    }))
    .filter(({ quantity }) => quantity > 0)
    .sort((left, right) => left.card.id.localeCompare(right.card.id));
  const equipmentContexts = new Map(
    selectedEntries.flatMap(({ card, quantity }) => {
      const context = equipmentContextForCard(
        card,
        quantity,
        selectedEntries,
        targetDeckSize,
        openingHand,
        earlyDraws,
      );
      return context ? [[card.id, context] as const] : [];
    }),
  );
  const pairAnalyses = selectedEntries.flatMap((left, leftIndex) =>
    selectedEntries.slice(leftIndex).flatMap((right) =>
      left.card.id === right.card.id && left.quantity < 2
        ? []
        : [
            {
              analysis: analyzeCardPair(left.card, right.card),
              leftQuantity: left.quantity,
              rightQuantity: right.quantity,
            },
          ],
    ),
  );

  for (const card of cards) {
    for (const trait of deriveTraits(card)) {
      traitCounts.set(trait, (traitCounts.get(trait) ?? 0) + 1);
    }
  }

  const base =
    totalCards === 0
      ? 0
      : round((foundationSum / targetDeckSize) * FOUNDATION_DECK_SCALE);

  if (totalCards > 0) {
    contributions.push({
      id: "base-quality",
      label: "Base card quality",
      value: base,
      detail: `${totalCards}/${targetDeckSize} cards contribute ${round(
        base,
      )} foundation RDS; selected cards average ${round(
        foundationSum / totalCards,
      )}.`,
    });
  }

  const packageCandidates = PACKAGE_PAIRS.map((pair) => {
    const leftCopies = traitCounts.get(pair.left) ?? 0;
    const rightCopies = traitCounts.get(pair.right) ?? 0;
    const overlap = cards.filter((card) => {
      const traits = deriveTraits(card);
      return traits.has(pair.left) && traits.has(pair.right);
    }).length;
    const reliability = earlyPackageReliability(
      targetDeckSize,
      leftCopies,
      rightCopies,
      overlap,
      openingHand,
      earlyDraws,
    );
    const balance =
      leftCopies + rightCopies === 0
        ? 0
        : (2 * Math.min(leftCopies, rightCopies)) / (leftCopies + rightCopies);
    const density = 1 - Math.exp(-(leftCopies + rightCopies) / 5);
    const rawValue =
      leftCopies === 0 || rightCopies === 0
        ? 0
        : clamp(
            3.15 * reliability ** 0.72 * (0.48 + balance * 0.52) * density,
            0,
            2.8,
          );
    return {
      ...pair,
      leftCopies,
      rightCopies,
      overlap,
      reliability,
      balance,
      rawValue,
    };
  }).filter(({ rawValue }) => rawValue >= 0.08);

  const traitPackageDegrees = new Map<Trait, number>();
  for (const candidate of packageCandidates) {
    traitPackageDegrees.set(
      candidate.left,
      (traitPackageDegrees.get(candidate.left) ?? 0) + 1,
    );
    traitPackageDegrees.set(
      candidate.right,
      (traitPackageDegrees.get(candidate.right) ?? 0) + 1,
    );
  }

  let synergy = 0;
  for (const candidate of packageCandidates.sort(
    (left, right) =>
      right.rawValue - left.rawValue ||
      `${left.left}-${left.right}`.localeCompare(
        `${right.left}-${right.right}`,
      ),
  )) {
    const overlapDiscount = Math.sqrt(
      (traitPackageDegrees.get(candidate.left) ?? 1) *
        (traitPackageDegrees.get(candidate.right) ?? 1),
    );
    const value = round(candidate.rawValue / overlapDiscount);
    if (value < 0.1) continue;
    synergy += value;
    contributions.push({
      id: `package-${candidate.left}-${candidate.right}`,
      label: candidate.label,
      value,
      detail: `${candidate.leftCopies} ${candidate.leftCopies === 1 ? "copy" : "copies"} + ${candidate.rightCopies} ${candidate.rightCopies === 1 ? "copy" : "copies"} · ${round(candidate.reliability * 100)}% chance to see both roles in the modeled ${openingHand}-card opener plus ${earlyDraws} early draws · ${round(candidate.balance * 100)}% package balance.`,
      cards: cardNames(
        entries,
        (card) =>
          deriveTraits(card).has(candidate.left) ||
          deriveTraits(card).has(candidate.right),
      ),
    });
  }

  const deckTags = [...new Set(cards.flatMap((card) => card.tags))].sort();
  for (const tag of deckTags) {
    if (REGION_TAGS.has(tag)) continue;
    const supporters = cards.filter((card) => card.tags.includes(tag));
    const payoffs = cards.filter((card) =>
      textExplicitlyReferencesTag(card, tag),
    );
    if (supporters.length < 2 || payoffs.length === 0) continue;
    const overlap = supporters.filter((card) => payoffs.includes(card)).length;
    const reliability = earlyPackageReliability(
      targetDeckSize,
      supporters.length,
      payoffs.length,
      overlap,
      openingHand,
      earlyDraws,
    );
    const balance =
      (2 * Math.min(supporters.length, payoffs.length)) /
      (supporters.length + payoffs.length);
    const tagCeiling = TRIBAL_TAGS.has(tag) ? 2.1 : 1.65;
    const value = round(
      clamp(
        tagCeiling *
          reliability ** 0.75 *
          (0.5 + balance * 0.5) *
          (1 - Math.exp(-supporters.length / 4)),
        0,
        tagCeiling,
      ),
    );
    if (value < 0.1) continue;
    synergy += value;
    contributions.push({
      id: `tag-${tag}`,
      label: `${tag} package`,
      value,
      detail: `${supporters.length} tagged cards connect to ${payoffs.length} rules-text references; generic region density is never scored as a combo.`,
      cards: cardNames(
        entries,
        (card) =>
          card.tags.includes(tag) || textExplicitlyReferencesTag(card, tag),
      ),
    });
  }

  const detailedPairSignals = pairAnalyses
    .map(({ analysis, leftQuantity, rightQuantity }) => {
      const reliability =
        analysis.cardIds[0] === analysis.cardIds[1]
          ? earlyCombinationReliability(
              targetDeckSize,
              [{ copies: leftQuantity, required: 2 }],
              openingHand,
              earlyDraws,
            )
          : earlyPackageReliability(
              targetDeckSize,
              leftQuantity,
              rightQuantity,
              0,
              openingHand,
              earlyDraws,
            );
      const synergyReasons = analysis.reasons.filter(
        (reason) =>
          reason.kind === "synergy" && !reason.id.startsWith("package:"),
      );
      const antisynergyReasons = analysis.reasons.filter(
        (reason) => reason.kind === "antisynergy",
      );
      return {
        analysis,
        synergyReasons,
        antisynergyReasons,
        synergy: round(
          synergyReasons.reduce(
            (sum, reason) => sum + Math.max(0, reason.value),
            0,
          ) *
            reliability ** 0.72 *
            0.48,
          2,
        ),
        friction: round(
          antisynergyReasons.reduce(
            (sum, reason) => sum + Math.abs(reason.value),
            0,
          ) *
            reliability ** 0.72 *
            0.48,
          2,
        ),
        reliability,
      };
    })
    .filter((signal) => signal.synergy >= 0.04 || signal.friction >= 0.04);

  const detailedPairSynergy = Math.min(
    5,
    detailedPairSignals.reduce((sum, signal) => sum + signal.synergy, 0),
  );
  if (detailedPairSynergy > 0) {
    synergy += detailedPairSynergy;
    for (const signal of [...detailedPairSignals]
      .filter(({ synergy: value }) => value >= 0.04)
      .sort(
        (left, right) =>
          right.synergy - left.synergy ||
          left.analysis.cardIds
            .join(":")
            .localeCompare(right.analysis.cardIds.join(":")),
      )
      .slice(0, 4)) {
      contributions.push({
        id: `pair-${signal.analysis.cardIds.join("-")}`,
        label: signal.synergyReasons[0]?.label ?? "Explicit two-card package",
        value: signal.synergy,
        detail: `${round(signal.reliability * 100)}% modeled early overlap. ${signal.synergyReasons
          .map((reason) => reason.detail)
          .join(" ")}`,
        cards: signal.analysis.cardIds
          .map(
            (cardId) =>
              selectedEntries.find(({ card }) => card.id === cardId)?.card.name,
          )
          .filter((name): name is string => Boolean(name)),
      });
    }
  }

  let tripleSynergy = 0;
  let tripleAntisynergy = 0;
  if (
    (options.combinationDepth ?? "full") === "full" &&
    selectedEntries.reduce((sum, entry) => sum + entry.quantity, 0) >= 3
  ) {
    const pairByIds = new Map(
      pairAnalyses.map(({ analysis }) => [
        analysis.cardIds.join(":"),
        analysis,
      ]),
    );
    const traitsById = new Map(
      selectedEntries.map(({ card }) => [card.id, deriveTraits(card)]),
    );
    const analyzeSelectedPair = (left: ScoreCard, right: ScoreCard) => {
      const [orderedLeft, orderedRight] = orderedCardPair(left, right);
      return (
        pairByIds.get(`${orderedLeft.id}:${orderedRight.id}`) ??
        analyzeCardPair(orderedLeft, orderedRight)
      );
    };
    const selectedTraits = (card: ScoreCard) =>
      traitsById.get(card.id) ?? deriveTraits(card);
    const tripleSignals: Array<{
      analysis: CardTripleAnalysis;
      synergyReasons: CombinationReason[];
      antisynergyReasons: CombinationReason[];
      reliability: number;
      synergy: number;
      antisynergy: number;
    }> = [];
    for (
      let firstIndex = 0;
      firstIndex < selectedEntries.length;
      firstIndex += 1
    ) {
      for (
        let secondIndex = firstIndex;
        secondIndex < selectedEntries.length;
        secondIndex += 1
      ) {
        for (
          let thirdIndex = secondIndex;
          thirdIndex < selectedEntries.length;
          thirdIndex += 1
        ) {
          const selected = [
            selectedEntries[firstIndex]!,
            selectedEntries[secondIndex]!,
            selectedEntries[thirdIndex]!,
          ] as const;
          const requiredCopies = new Map<string, number>();
          for (const entry of selected) {
            requiredCopies.set(
              entry.card.id,
              (requiredCopies.get(entry.card.id) ?? 0) + 1,
            );
          }
          if (
            [...requiredCopies].some(
              ([cardId, required]) =>
                required >
                (selectedEntries.find(({ card }) => card.id === cardId)
                  ?.quantity ?? 0),
            )
          ) {
            continue;
          }

          const [firstSelected, secondSelected, thirdSelected] = selected;
          const analysis = analyzeCardTripleWithResolvers(
            firstSelected.card,
            secondSelected.card,
            thirdSelected.card,
            analyzeSelectedPair,
            selectedTraits,
          );
          const motifReasons = analysis.reasons.filter(
            (reason) => reason.scope === "triple-motif" && reason.value !== 0,
          );
          if (motifReasons.length === 0) continue;
          const reliability = earlyCombinationReliability(
            targetDeckSize,
            [...requiredCopies].map(([cardId, required]) => ({
              copies:
                selectedEntries.find(({ card }) => card.id === cardId)
                  ?.quantity ?? 0,
              required,
            })),
            openingHand,
            earlyDraws,
          );
          const synergyReasons = motifReasons.filter(
            (reason) => reason.kind === "synergy" && reason.value > 0,
          );
          const antisynergyReasons = motifReasons.filter(
            (reason) => reason.kind === "antisynergy" && reason.value < 0,
          );
          const synergyValue = round(
            synergyReasons.reduce((sum, reason) => sum + reason.value, 0) *
              reliability ** 0.7 *
              0.42,
            2,
          );
          const antisynergyValue = round(
            antisynergyReasons.reduce(
              (sum, reason) => sum + Math.abs(reason.value),
              0,
            ) *
              reliability ** 0.7 *
              0.42,
            2,
          );
          if (synergyValue < 0.04 && antisynergyValue < 0.04) continue;
          tripleSignals.push({
            analysis,
            synergyReasons,
            antisynergyReasons,
            reliability,
            synergy: synergyValue,
            antisynergy: antisynergyValue,
          });
        }
      }
    }

    tripleSynergy = Math.min(
      4,
      tripleSignals.reduce((sum, signal) => sum + signal.synergy, 0),
    );
    tripleAntisynergy = Math.min(
      4,
      tripleSignals.reduce((sum, signal) => sum + signal.antisynergy, 0),
    );
    if (tripleSynergy > 0) {
      synergy += tripleSynergy;
      for (const signal of tripleSignals
        .filter(({ synergy: value }) => value >= 0.04)
        .sort(
          (left, right) =>
            right.synergy - left.synergy ||
            left.analysis.cardIds
              .join(":")
              .localeCompare(right.analysis.cardIds.join(":")),
        )
        .slice(0, 3)) {
        contributions.push({
          id: `triple-${signal.analysis.cardIds.join("-")}`,
          label: signal.synergyReasons[0]?.label ?? "Three-card engine",
          value: signal.synergy,
          detail: `${round(signal.reliability * 100)}% modeled early three-card overlap. ${signal.synergyReasons
            .map((reason) => reason.detail)
            .join(" ")}`,
          cards: signal.analysis.cardIds
            .map(
              (cardId) =>
                selectedEntries.find(({ card }) => card.id === cardId)?.card
                  .name,
            )
            .filter((name): name is string => Boolean(name)),
        });
      }
    }
    if (tripleAntisynergy > 0) {
      for (const signal of tripleSignals
        .filter(({ antisynergy: value }) => value >= 0.04)
        .sort(
          (left, right) =>
            right.antisynergy - left.antisynergy ||
            left.analysis.cardIds
              .join(":")
              .localeCompare(right.analysis.cardIds.join(":")),
        )
        .slice(0, 3)) {
        contributions.push({
          id: `triple-antisynergy-${signal.analysis.cardIds.join("-")}`,
          label: signal.antisynergyReasons[0]?.label ?? "Three-card friction",
          value: -signal.antisynergy,
          detail: `${round(signal.reliability * 100)}% modeled early three-card overlap. ${signal.antisynergyReasons
            .map((reason) => reason.detail)
            .join(" ")}`,
          cards: signal.analysis.cardIds
            .map(
              (cardId) =>
                selectedEntries.find(({ card }) => card.id === cardId)?.card
                  .name,
            )
            .filter((name): name is string => Boolean(name)),
        });
      }
    }
  }
  synergy = round(Math.min(24, synergy));

  const detailedPairFriction = Math.min(
    4,
    detailedPairSignals.reduce((sum, signal) => sum + signal.friction, 0),
  );
  let antisynergy = detailedPairFriction + tripleAntisynergy;
  let equipmentPenaltyTotal = 0;
  let equipmentCarrierPenalty = 0;
  const strandedEquipmentNames: string[] = [];
  for (const { card } of selectedEntries) {
    const context = equipmentContexts.get(card.id);
    if (!context || context.penalty <= 0) continue;
    equipmentPenaltyTotal += context.penalty;
    if (isEquipmentCard(card)) {
      equipmentCarrierPenalty += context.penalty;
      strandedEquipmentNames.push(card.name);
      continue;
    }
    antisynergy += context.penalty;
    if (context.penalty >= 0.005) {
      contributions.push({
        id: `equipment-activation:${card.id}`,
        label: `${card.name} Equipment activation`,
        value: context.breakdown.scoreAdjustment,
        detail: `${round(context.breakdown.activation * 100)}% deck-context activation: ${context.breakdown.detail} ${context.breakdown.conditionalValue} conditional RDS realizes ${context.breakdown.realizedConditionalValue}; ${context.breakdown.reattachTempoTax} re-equip tempo yields an exact ${context.breakdown.scoreAdjustment} adjustment.`,
        cards: [card.name],
      });
    }
  }
  if (equipmentCarrierPenalty > 0) {
    const value = round(equipmentCarrierPenalty, 3);
    antisynergy += value;
    if (value >= 0.005) {
      contributions.push({
        id: "equipment-carriers",
        label: "Equipment without reliable carriers",
        value: -value,
        detail:
          "Only the Equipment-dependent slice of each Gear card is gated by the chance to find a causal unit carrier in the modeled early window.",
        cards: [...new Set(strandedEquipmentNames)]
          .sort((left, right) => left.localeCompare(right))
          .slice(0, 6),
      });
    }
  }
  if (detailedPairFriction > 0) {
    contributions.push({
      id: "pair-resource-friction",
      label: "Pair resource friction",
      value: -round(detailedPairFriction, 2),
      detail:
        "Exact pair analysis found top-end, early colored-Power, or shared-resource collisions after modeled draw overlap.",
      cards: detailedPairSignals
        .filter(({ friction }) => friction > 0)
        .sort((left, right) => right.friction - left.friction)
        .flatMap(({ analysis }) =>
          analysis.cardIds.map(
            (cardId) =>
              selectedEntries.find(({ card }) => card.id === cardId)?.card.name,
          ),
        )
        .filter((name): name is string => Boolean(name))
        .filter((name, index, names) => names.indexOf(name) === index)
        .slice(0, 6),
    });
  }
  const units = cards.filter((card) => card.type === "unit").length;
  const cheapUnits = cards.filter(
    (card) =>
      card.type === "unit" &&
      finiteOr(card.energy, 99) >= 1 &&
      finiteOr(card.energy, 99) <= 4,
  ).length;
  const earlyActions = cards.filter(
    (card) =>
      ["unit", "spell", "gear"].includes(card.type) &&
      finiteOr(card.energy, 99) <= 3,
  ).length;
  const interactive = countCardsWithAnyTrait(cards, [
    "interaction",
    "removal",
    "counter",
    "stun",
  ]);
  const velocity = countCardsWithAnyTrait(cards, [
    "draw",
    "predict",
    "recycle",
  ]);
  const scoringRoles = countCardsWithAnyTrait(cards, [
    "scoring",
    "movement",
    "ganking",
    "assault",
  ]);
  const defensiveRoles = countCardsWithAnyTrait(cards, [
    "shield",
    "tank",
    "deflect",
    "damage-prevention",
    "heal",
  ]);
  const expensive = cards.filter(
    (card) => finiteOr(card.energy, 0) >= 6,
  ).length;
  const midCurve = cards.filter(
    (card) => finiteOr(card.energy, 0) >= 4 && finiteOr(card.energy, 0) <= 5,
  ).length;
  const curveCounts = {
    early: cards.filter((card) => curveBandFor(card) === "early").length,
    setup: cards.filter((card) => curveBandFor(card) === "setup").length,
    mid: cards.filter((card) => curveBandFor(card) === "mid").length,
    top: cards.filter((card) => curveBandFor(card) === "top").length,
  };
  const officialEarlyUnits = cards.filter(
    (card) =>
      card.type === "unit" &&
      finiteOr(card.energy, 99) >= 2 &&
      finiteOr(card.energy, 99) <= 4,
  ).length;
  const curveProfile = DECK_CURVE_TARGETS[format];
  const curveScale = targetDeckSize / curveProfile.targetDeckSize;
  const scaledCurveBands = curveProfile.bands.map((band) => ({
    ...band,
    minimum: Math.max(1, Math.round(band.minimum * curveScale)),
    ideal: Math.max(1, Math.round(band.ideal * curveScale)),
    maximum: Math.max(1, Math.round(band.maximum * curveScale)),
  }));
  const distinctDomains = new Set(
    cards
      .flatMap((card) => card.domains)
      .filter((domain) => domain !== "colorless"),
  );
  const runes = allocateRunes(entries, legend?.domains, runeDeckSize);
  const runeStrain = runeDemandStrain(entries, runes);

  const unitTarget = isPreRift ? 15 : 18;
  const cheapUnitTarget = isPreRift ? 5 : 9;
  const earlyActionTarget = isPreRift ? 7 : 11;
  const interactionTarget = isPreRift ? 3 : 6;
  const velocityTarget = isPreRift ? 2 : 4;
  if (totalCards > 0 && units < unitTarget) {
    const value = round(Math.min(7, (unitTarget - units) * 0.48));
    antisynergy += value;
    contributions.push({
      id: "low-unit-count",
      label: "Low board presence",
      value: -value,
      detail: `${units} units leave the deck below the ${unitTarget}-unit structural target.`,
    });
  }
  if (totalCards > 0 && earlyActions < earlyActionTarget) {
    const value = round(Math.min(5, (earlyActionTarget - earlyActions) * 0.36));
    antisynergy += value;
    contributions.push({
      id: "slow-opening",
      label: "Low early playability",
      value: -value,
      detail: `${earlyActions}/${earlyActionTarget} modeled 1–3 Energy actions can affect the opening turns.`,
    });
  }
  if (totalCards > 0 && officialEarlyUnits < cheapUnitTarget) {
    const value = round(
      Math.min(5.5, (cheapUnitTarget - officialEarlyUnits) * 0.42),
    );
    antisynergy += value;
    contributions.push({
      id: "official-early-unit-floor",
      label: "2–4 Energy unit access",
      value: -value,
      detail: `${officialEarlyUnits}/${cheapUnitTarget} modeled early units. Riot’s official Deckbuilding Primer recommends at least nine 2–4 Energy units in a 40-card deck.`,
      cards: cardNames(
        entries,
        (card) =>
          card.type === "unit" &&
          finiteOr(card.energy, 99) >= 2 &&
          finiteOr(card.energy, 99) <= 4,
      ),
    });
  }
  if (totalCards > 0 && expensive / totalCards > 0.24) {
    const value = round(Math.min(6, (expensive / totalCards - 0.24) * 18));
    antisynergy += value;
    contributions.push({
      id: "top-heavy",
      label: "Top-heavy curve",
      value: -value,
      detail: `${expensive} cards cost six or more Energy.`,
    });
  }
  const saturatedBands = scaledCurveBands.filter(
    (band) => curveCounts[band.id] > band.maximum,
  );
  for (const band of saturatedBands) {
    const excess = curveCounts[band.id] - band.maximum;
    const value = round(
      Math.min(4.5, excess * (band.id === "mid" ? 0.34 : 0.42)),
    );
    antisynergy += value;
    contributions.push({
      id: `curve-saturation-${band.id}`,
      label: `${band.label} curve saturation`,
      value: -value,
      detail: `${curveCounts[band.id]} cards occupy ${band.label}; the ${targetDeckSize}-card theorycraft prior keeps this band at or below ${band.maximum} unless an engine explicitly supports it.`,
      cards: cardNames(entries, (card) => curveBandFor(card) === band.id),
    });
  }
  for (const rule of ORPHAN_ENGINE_RULES) {
    const enablerCards = cards.filter((card) => {
      const traits = deriveTraits(card);
      return rule.enablers.some((trait) => traits.has(trait));
    });
    if (enablerCards.length < rule.minimumEnablers) continue;
    const payoffCards = cards.filter((card) => {
      const traits = deriveTraits(card);
      return rule.payoffs.some((trait) => traits.has(trait));
    });
    if (payoffCards.length >= rule.minimumPayoffs) continue;
    const missingShare =
      (rule.minimumPayoffs - payoffCards.length) / rule.minimumPayoffs;
    const value = round(
      Math.min(rule.cap, enablerCards.length * rule.coefficient * missingShare),
    );
    antisynergy += value;
    contributions.push({
      id: rule.id,
      label: rule.label,
      value: -value,
      detail: `${enablerCards.length} setup cards connect to only ${payoffCards.length}/${rule.minimumPayoffs} expected payoff cards.`,
      cards: [...new Set(enablerCards.map((card) => card.name))]
        .sort((left, right) => left.localeCompare(right))
        .slice(0, 6),
    });
  }
  for (const rule of DEAD_PAYOFF_RULES) {
    const payoffCount = countCardsWithAnyTrait(cards, rule.payoffTraits);
    const supportCount = countCardsWithAnyTrait(cards, rule.supportTraits);
    if (
      payoffCount < rule.minimumPayoffs ||
      supportCount >= rule.minimumSupport
    ) {
      continue;
    }
    const missingShare =
      (rule.minimumSupport - supportCount) / rule.minimumSupport;
    const value = round(
      Math.min(rule.cap, payoffCount * rule.coefficient * missingShare),
    );
    antisynergy += value;
    contributions.push({
      id: rule.id,
      label: rule.label,
      value: -value,
      detail: `${payoffCount} payoff cards connect to only ${supportCount}/${rule.minimumSupport} expected setup cards.`,
      cards: cardNames(entries, (card) => {
        const traits = deriveTraits(card);
        return rule.payoffTraits.some((trait) => traits.has(trait));
      }),
    });
  }

  const trashFillers = countCardsWithAnyTrait(cards, [
    "trash-filler",
    "burn-self",
  ]);
  const trashBanishers = countCardsWithAnyTrait(cards, ["trash-banish"]);
  const trashReusers = countCardsWithAnyTrait(cards, [
    "flow",
    "trash-retrieval",
  ]);
  if (trashBanishers >= 2 && trashReusers >= 2) {
    const consumerDemand = trashBanishers + trashReusers;
    const shortage = Math.max(0, consumerDemand * 0.75 - trashFillers);
    if (shortage > 0) {
      const competition =
        (2 * Math.min(trashBanishers, trashReusers)) / consumerDemand;
      const value = round(
        Math.min(5, shortage * 0.38 * (0.65 + competition * 0.35)),
      );
      antisynergy += value;
      contributions.push({
        id: "trash-resource-conflict",
        label: "Competing trash consumers",
        value: -value,
        detail: `${trashBanishers} banish-from-trash cards and ${trashReusers} Flow/retrieval cards compete for only ${trashFillers} dedicated trash fillers.`,
        cards: cardNames(entries, (card) => {
          const traits = deriveTraits(card);
          return (
            traits.has("trash-banish") ||
            traits.has("flow") ||
            traits.has("trash-retrieval")
          );
        }),
      });
    }
  }

  const gears = cards.filter((card) => card.type === "gear").length;
  if (gears >= 5 && units < 12) {
    const value = round(Math.min(4.5, (gears - 4) * 0.2 + (12 - units) * 0.24));
    antisynergy += value;
    contributions.push({
      id: "gear-without-board",
      label: "Gear without enough carriers",
      value: -value,
      detail: `${gears} Gear cards have only ${units} units available to establish and hold a board.`,
    });
  }
  const buffProducers = traitCounts.get("buff-producer") ?? 0;
  if (buffProducers >= 4 && units < 12) {
    const value = round(
      Math.min(4, (buffProducers - 3) * 0.22 + (12 - units) * 0.2),
    );
    antisynergy += value;
    contributions.push({
      id: "buff-without-board",
      label: "Buffs without enough board",
      value: -value,
      detail: `${buffProducers} buff effects depend on a deck with only ${units} units.`,
    });
  }
  const conditionalCards = cards.filter(conditionalSupportCard).length;
  const conditionalThreshold = Math.ceil(totalCards * 0.36);
  if (totalCards >= 20 && conditionalCards > conditionalThreshold) {
    const value = round(
      Math.min(3.5, (conditionalCards - conditionalThreshold) * 0.2),
    );
    antisynergy += value;
    contributions.push({
      id: "conditional-density",
      label: "Conditional dead-draw risk",
      value: -value,
      detail: `${conditionalCards} cards need a board, trigger, or game state before producing their modeled value.`,
    });
  }
  if (runeStrain > 0) {
    antisynergy += runeStrain;
    contributions.push({
      id: "rune-strain",
      label: "Colored Power strain",
      value: -runeStrain,
      detail: `Power requirements are stressed against the recommended ${runeDeckSize}-rune split (${runes.map((rune) => `${rune.domain} ${rune.count}`).join(" · ")}). Recycling a rune for Power also removes future Energy tempo, so earlier multi-Power cards carry more weight.`,
    });
  }
  if (legend && !isPreRift) {
    const legendDomains = new Set(legend.domains);
    const offDomain = cards.filter(
      (card) =>
        card.domains.length > 0 &&
        !card.domains.includes("colorless") &&
        !card.domains.every((domain) => legendDomains.has(domain)),
    );
    if (offDomain.length > 0) {
      const value = Math.min(18, offDomain.length * 1.5);
      antisynergy += value;
      contributions.push({
        id: "off-domain",
        label: "Domain violation",
        value: -value,
        detail: `${offDomain.length} cards fall outside the Legend’s domain identity.`,
        cards: [...new Set(offDomain.map((card) => card.name))]
          .sort((left, right) => left.localeCompare(right))
          .slice(0, 6),
      });
    }
  } else if (!isPreRift && distinctDomains.size > 2) {
    const value = (distinctDomains.size - 2) * 2.5;
    antisynergy += value;
    contributions.push({
      id: "domain-spread",
      label: "Unfocused domain demand",
      value: -value,
      detail: `${distinctDomains.size} domains are present before choosing a Legend.`,
    });
  }
  const nonEquipmentAntisynergy = Math.max(
    0,
    antisynergy - equipmentPenaltyTotal,
  );
  antisynergy = round(
    equipmentPenaltyTotal + Math.min(48, nonEquipmentAntisynergy),
    3,
  );

  let structure = 0;
  if (totalCards > 0) {
    structure += Math.min(4.1, (units / unitTarget) * 4.1);
    structure += Math.min(2.5, (earlyActions / earlyActionTarget) * 2.5);
    structure += Math.min(2.2, (interactive / interactionTarget) * 2.2);
    structure += Math.min(1.5, (velocity / velocityTarget) * 1.5);
    structure += Math.min(1.1, (scoringRoles / (isPreRift ? 3 : 5)) * 1.1);
    structure += Math.min(0.8, (defensiveRoles / (isPreRift ? 2 : 4)) * 0.8);
    const curveCoverage =
      scaledCurveBands.reduce(
        (sum, band) =>
          sum + Math.min(1, curveCounts[band.id] / Math.max(1, band.ideal)),
        0,
      ) / scaledCurveBands.length;
    structure += curveCoverage * 1.5;
    if (earlyActions > 0 && midCurve > 0 && expensive < totalCards * 0.35) {
      structure += 0.6;
    }
    if ((!isPreRift && totalCards === 40) || (isPreRift && totalCards >= 25)) {
      structure += 1.2;
    }
  }
  structure = round(Math.min(14, structure));
  contributions.push({
    id: "deck-structure",
    label: "Curve & role coverage",
    value: structure,
    detail: `${units} units (${officialEarlyUnits} at 2–4 Energy) · curve ${curveCounts.early}/${curveCounts.setup}/${curveCounts.mid}/${curveCounts.top} across 1–2/3/4–5/6+ · ${interactive} interaction · ${velocity} velocity · ${scoringRoles} scoring/movement · ${defensiveRoles} protection.`,
  });

  const contextScore = (
    context: ScoreCard,
    cap: number,
    coefficient: number,
  ) => {
    const affinities = cards
      .map((card) => contextualAffinity(context, card))
      .filter((affinity) => affinity >= 0.16)
      .sort((left, right) => right - left)
      .slice(0, 12);
    return Math.min(
      cap,
      affinities.reduce(
        (sum, affinity) => sum + Math.min(1.6, affinity) * coefficient,
        0,
      ),
    );
  };

  let compatibility = 0;
  if (legend) {
    compatibility += contextScore(legend, 5.2, 0.3);
    if (options.champion && championMatchesLegend(legend, options.champion)) {
      compatibility += 0.7;
    }
  }
  if (options.champion) {
    compatibility += contextScore(options.champion, 3.2, 0.2);
  }
  for (const battlefield of options.battlefields ?? []) {
    compatibility += contextScore(battlefield, 1.1, 0.1);
  }
  compatibility = round(Math.min(12, compatibility));
  if (compatibility > 0) {
    contributions.push({
      id: "legend-compatibility",
      label: "Legend, Champion & Battlefield fit",
      value: compatibility,
      detail:
        "Context fit uses explicit rules-text packages and Champion identity. Shared region tags and domain legality do not inflate this component.",
    });
  }

  const requestedMeta = options.metaAdjustment ?? 0;
  const legacyMeta = Number.isFinite(requestedMeta)
    ? Math.max(-5, Math.min(5, requestedMeta))
    : 0;
  const evidenceMeta = resolveDeckMetaOverlay(entries, options.metaCalibration);
  const totalCopies = entries.reduce((n, entry) => n + entry.quantity, 0);
  const averagedEvidence =
    totalCopies > 0
      ? entries.reduce(
          (sum, entry) => {
            const rating = rateCardWithEvidence(
              entry.card,
              options,
            );
            return {
              tournament: sum.tournament + rating.tournament * entry.quantity,
              outcomes: sum.outcomes + rating.outcomes * entry.quantity,
            };
          },
          { tournament: 0, outcomes: 0 },
        )
      : { tournament: 0, outcomes: 0 };
  const tournamentPoints =
    totalCopies > 0 ? (averagedEvidence.tournament / totalCopies) * 10 : 0;
  const outcomePoints =
    totalCopies > 0 ? (averagedEvidence.outcomes / totalCopies) * 10 : 0;
  const cardEvidence = tournamentPoints + outcomePoints;
  const meta = round(
    Math.max(-5, Math.min(5, legacyMeta + evidenceMeta.total + cardEvidence)),
  );
  const suppliedSnapshot = options.metaCalibration?.snapshot;
  const snapshot =
    suppliedSnapshot?.scoreModelVersion === SCORE_MODEL_VERSION
      ? suppliedSnapshot
      : null;
  contributions.push({
    id: "meta-calibration",
    label: "Meta calibration",
    value: meta,
    detail: `Historical Top-8 adoption ${round(tournamentPoints)} · qualified human inclusion outcomes ${round(outcomePoints)} · legacy source ${round(legacyMeta + evidenceMeta.total)}. Total correction capped at ±5 deck points. Missing evidence is neutral.${snapshot ? ` Source: ${snapshot.attributionText}.` : ""}`,
    cards: evidenceMeta.matchedCardNames.slice(0, 6),
  });

  const rawTotal = round(
    base + synergy - antisynergy + compatibility + structure + meta,
    2,
  );
  const floorAdjustment = rawTotal < 0 ? round(-rawTotal, 2) : 0;
  const total = round(rawTotal + floorAdjustment);
  if (floorAdjustment > 0) {
    contributions.push({
      id: "score-floor",
      label: "Zero-point score floor",
      value: floorAdjustment,
      detail: `The component ledger reached ${rawTotal}; a +${floorAdjustment} floor adjustment keeps the published deck score at zero.`,
    });
  }
  const issues: string[] = [];
  const warnings: string[] = [];
  const invalidEntryTypes = new Set(
    invalidMainDeckEntries.map(({ card }) => card.type),
  );
  if (invalidEntryTypes.has("legend")) {
    issues.push(
      "Legends are external to the 40-card Main Deck; select exactly one through the Legend slot.",
    );
  }
  if (invalidEntryTypes.has("rune")) {
    issues.push(
      "Rune cards belong to the separate Rune Deck and cannot be Main Deck entries.",
    );
  }
  if (invalidEntryTypes.has("battlefield")) {
    issues.push(
      "Battlefields are external to the Main Deck; select them through the Battlefield slots.",
    );
  }
  if (
    invalidMainDeckEntries.some(
      ({ card }) => !["legend", "rune", "battlefield"].includes(card.type),
    )
  ) {
    issues.push("Only Unit, Spell, and Gear cards can be Main Deck entries.");
  }
  if (options.legend && !legend) {
    issues.push("Selected Legend must be a Legend card.");
  }
  const battlefields = options.battlefields ?? [];
  const previewCards = [
    ...entries.map(({ card }) => card),
    ...(legend ? [legend] : []),
    ...(options.champion ? [options.champion] : []),
    ...battlefields,
  ].filter((card) => previewSetLegalFrom(card.setId, options) !== null);

  if (isPreRift) {
    if (totalCards < sealedMinimumMainDeck) {
      issues.push(
        `Pre-Rift Main Deck needs at least ${sealedMinimumMainDeck} cards (${totalCards}/${sealedMinimumMainDeck}).`,
      );
    }
    if (sealedMaximumMainDeck !== null && totalCards > sealedMaximumMainDeck) {
      issues.push(
        `Pre-Rift Main Deck allows at most ${sealedMaximumMainDeck} cards (${totalCards}/${sealedMaximumMainDeck}).`,
      );
    }
  } else if (totalCards !== 40) {
    issues.push(`Main Deck must be exactly 40 cards (${totalCards}/40).`);
  }
  if (!isPreRift && !legend) {
    issues.push("Choose exactly one Champion Legend.");
  }
  if (championRules.required && !options.champion) {
    issues.push("Choose one Chosen Champion.");
  }
  if (
    options.champion &&
    championRules.countsInMainDeck &&
    !entries.some(
      ({ card, quantity }) => card.id === options.champion?.id && quantity > 0,
    )
  ) {
    issues.push("Chosen Champion must be included in the Main Deck.");
  }
  if (
    legend &&
    options.champion &&
    championRules.mustMatchLegendChampion &&
    !championMatchesLegend(legend, options.champion)
  ) {
    issues.push("Chosen Champion must match the selected Champion Legend.");
  }
  if (!isPreRift) {
    const signatureEntries = entries.filter(({ card }) =>
      isSignatureCard(card),
    );
    const signatureTotal = signatureEntries.reduce(
      (total, { quantity }) => total + quantity,
      0,
    );
    if (signatureTotal > 3) {
      issues.push(
        `Main Deck has ${signatureTotal} Signature cards; Constructed allows at most 3 total.`,
      );
    }
    if (legend) {
      for (const { card } of signatureEntries) {
        if (signatureMatchesLegend(card, legend)) continue;
        const signatureIdentity = card.tags[0] ?? "unknown-character";
        const article = /^[aeiou]/i.test(signatureIdentity) ? "an" : "a";
        issues.push(
          `${card.name} is ${article} ${signatureIdentity} Signature card and requires ${article} ${signatureIdentity} Champion Legend.`,
        );
      }
    }
  }
  const battlefieldTotal =
    battlefields.length + (isPreRift ? (options.blankBattlefields ?? 0) : 0);
  if (battlefieldTotal !== (isPreRift ? sealedBattlefieldCount : 3)) {
    issues.push(
      isPreRift
        ? `Present ${sealedBattlefieldLabel} Battlefields; opened cards or facedown blanks are allowed (${battlefieldTotal}/${sealedBattlefieldCount}).`
        : `Choose exactly three distinct Battlefields (${battlefields.length}/3).`,
    );
  }
  if (
    new Set(battlefields.map((card) => card.name)).size !== battlefields.length
  ) {
    issues.push("Battlefields must have unique names.");
  }
  if (!isPreRift && previewCards.length > 0) {
    for (const setId of new Set(previewCards.map((card) => card.setId))) {
      issues.push(
        `${previewSetLabel(setId, options)} cards are preview-only; local Constructed legality begins ${previewSetLegalFrom(setId, options)}.`,
      );
    }
  }
  for (const { card, quantity } of entries) {
    if (!isPreRift && quantity > card.copyLimit) {
      issues.push(`${card.name} exceeds its ${card.copyLimit}-copy limit.`);
    }
    if (isPreRift && quantity > (options.sealedPool?.[card.id] ?? 0)) {
      issues.push(
        `${card.name} exceeds the ${options.sealedPool?.[card.id] ?? 0} copies in your sealed pool.`,
      );
    }
    if (!isPreRift && bannedCards(options).has(card.id)) {
      issues.push(`${card.name} is currently banned in Constructed.`);
    }
  }
  for (const battlefield of battlefields) {
    if (isPreRift && (options.sealedPool?.[battlefield.id] ?? 0) < 1) {
      issues.push(`${battlefield.name} is not recorded in your sealed pool.`);
    }
    if (
      !isPreRift &&
      bannedBattlefields(options).has(battlefield.id)
    ) {
      issues.push(`${battlefield.name} is currently banned in Constructed.`);
    }
  }
  const preRiftDomains = new Set([
    ...distinctDomains,
    ...(legend?.domains ?? []),
    ...(options.champion?.domains ?? []),
  ]);
  preRiftDomains.delete("colorless");
  if (isPreRift && preRiftDomains.size > sealedMaximumDomains) {
    issues.push(
      `Pre-Rift decks may use at most ${sealedDomainLabel} ${sealedDomainNoun} (${preRiftDomains.size} selected).`,
    );
  }
  if (runes.length > 2)
    warnings.push("Rune demand spans more than two domains.");
  if (
    interactive < interactionTarget &&
    totalCards >= (isPreRift ? sealedMinimumMainDeck : 30)
  ) {
    warnings.push(
      `Fewer than ${interactionTarget} interactive cards may reduce comeback potential.`,
    );
  }
  if (
    cheapUnits < cheapUnitTarget &&
    totalCards >= (isPreRift ? sealedMinimumMainDeck : 30)
  ) {
    warnings.push(
      `Fewer than ${cheapUnitTarget} 2–4 Energy units may weaken early battlefield access.`,
    );
  }

  const contextCards = [
    legend,
    options.champion,
    ...(options.battlefields ?? []),
  ].filter((card): card is ScoreCard => Boolean(card));
  const matchedMetaNames = new Set(evidenceMeta.matchedCardNames);
  const curveIdeals = new Map(
    scaledCurveBands.map((band) => [band.id, band.ideal] as const),
  );
  const rowWeights = selectedEntries.map(({ card, quantity }) => {
    const cardPairs = pairAnalyses.filter(({ analysis }) =>
      analysis.cardIds.includes(card.id),
    );
    const synergyWeight = cardPairs.reduce(
      (sum, pair) =>
        sum +
        pair.analysis.synergy *
          (pair.analysis.cardIds[0] === card.id
            ? pair.rightQuantity
            : pair.leftQuantity) *
          quantity,
      0,
    );
    const pairAntisynergy = cardPairs.reduce(
      (sum, pair) =>
        sum +
        pair.analysis.antisynergy *
          (pair.analysis.cardIds[0] === card.id
            ? pair.rightQuantity
            : pair.leftQuantity) *
          quantity,
      0,
    );
    const foundationProfile = baseCardRatingBreakdown(card);
    // Deck-score rows cross a Worker boundary in public inspection views.
    // Materialize the structured fields so the browser's structured-clone
    // algorithm carries them along with the legacy flat numeric ledger.
    const effectProfile: BaseCardRatingBreakdown = {
      ...foundationProfile,
      mechanics: foundationProfile.mechanics,
      axes: foundationProfile.axes,
    };
    const curveBand = curveBandFor(card);
    const curveDeficit = curveBand
      ? Math.max(0, (curveIdeals.get(curveBand) ?? 0) - curveCounts[curveBand])
      : 0;
    const curveRepair =
      curveBand === "early" || curveBand === "setup"
        ? curveDeficit * 0.32
        : curveBand === "mid"
          ? curveDeficit * 0.16
          : curveDeficit * 0.08;
    const runeReliability = cardRuneReliability(card, runes);
    const conditionalRisk =
      conditionalClauseCount(rulesForScoring(card)) * 0.08 * quantity;
    const runeRisk =
      (1 - runeReliability) * Math.max(0, finiteOr(card.power, 0)) * quantity;
    const compatibilityWeight =
      contextCards.reduce(
        (sum, context) => sum + contextualAffinity(context, card),
        0,
      ) * quantity;
    const roleWeight =
      (deriveTraits(card).has("interaction") ? 0.45 : 0) +
      (deriveTraits(card).has("draw") ? 0.32 : 0) +
      (deriveTraits(card).has("scoring") ? 0.3 : 0) +
      curveRepair;
    const equipmentContext = equipmentContexts.get(card.id) ?? null;

    return {
      effectProfile,
      equipmentContext,
      curveBand,
      curveRepair: round(curveRepair, 2),
      runeReliability,
      base: baseCardRating(card) * quantity,
      synergy: synergyWeight,
      antisynergy:
        pairAntisynergy + conditionalRisk + runeRisk + quantity * 0.01,
      equipmentPenalty: equipmentContext?.penalty ?? 0,
      compatibility: compatibilityWeight,
      structure: (roleWeight + quantity * 0.08) * quantity,
      meta: matchedMetaNames.has(card.name) ? quantity : 0,
    };
  });

  const apportion = (
    component: number,
    key: keyof (typeof rowWeights)[number],
  ) => {
    const weights = rowWeights.map((row) => {
      const value = row[key];
      return typeof value === "number" && Number.isFinite(value)
        ? Math.max(0, value)
        : 0;
    });
    const weightTotal = weights.reduce((sum, value) => sum + value, 0);
    const fallbackTotal = selectedEntries.reduce(
      (sum, entry) => sum + entry.quantity,
      0,
    );
    const shares = weights.map((weight, index) =>
      round(
        component *
          (weightTotal > 0
            ? weight / weightTotal
            : selectedEntries[index]!.quantity / Math.max(1, fallbackTotal)),
        2,
      ),
    );
    if (shares.length > 0) {
      const residual = round(
        component - shares.reduce((sum, share) => sum + share, 0),
        2,
      );
      const anchorIndex =
        weightTotal > 0
          ? weights.reduce(
              (best, weight, index) => (weight > weights[best]! ? index : best),
              0,
            )
          : 0;
      shares[anchorIndex] = round(shares[anchorIndex]! + residual, 2);
    }
    return shares;
  };

  const baseShares = apportion(base, "base");
  const synergyShares = apportion(synergy, "synergy");
  const generalAntisynergy = Math.max(
    0,
    round(antisynergy - equipmentPenaltyTotal, 3),
  );
  const antisynergyShares = apportion(generalAntisynergy, "antisynergy");
  const compatibilityShares = apportion(compatibility, "compatibility");
  const structureShares = apportion(structure, "structure");
  const metaShares = apportion(Math.abs(meta), "meta").map((value) =>
    meta < 0 ? -value : value,
  );
  const floorAdjustmentShares = apportion(floorAdjustment, "antisynergy");
  const cardBreakdown: CardScoreBreakdown[] = selectedEntries.map(
    ({ card, quantity }, index) => {
      const cardPairs = pairAnalyses
        .filter(({ analysis }) => analysis.cardIds.includes(card.id))
        .map(({ analysis }) => {
          const partnerId =
            analysis.cardIds[0] === card.id
              ? analysis.cardIds[1]
              : analysis.cardIds[0];
          const partner = selectedEntries.find(
            (entry) => entry.card.id === partnerId,
          )?.card;
          return {
            cardId: partnerId,
            name: partner?.name ?? partnerId,
            synergy: analysis.synergy,
            antisynergy: analysis.antisynergy,
            net: analysis.net,
            reasons: analysis.reasons.map((reason) => reason.label),
          };
        })
        .sort(
          (left, right) =>
            Math.abs(right.net) - Math.abs(left.net) ||
            left.cardId.localeCompare(right.cardId),
        )
        .slice(0, 3);
      const row = rowWeights[index]!;
      const rowBase = baseShares[index] ?? 0;
      const rowSynergy = synergyShares[index] ?? 0;
      const rowAnti = round(
        (antisynergyShares[index] ?? 0) + row.equipmentPenalty,
        3,
      );
      const rowCompatibility = compatibilityShares[index] ?? 0;
      const rowStructure = structureShares[index] ?? 0;
      const rowMeta = metaShares[index] ?? 0;
      const rowFloorAdjustment = floorAdjustmentShares[index] ?? 0;
      return {
        cardId: card.id,
        name: card.name,
        quantity,
        grade: cardTierGrade(row.effectProfile.total),
        foundation: row.effectProfile.total,
        base: rowBase,
        synergy: rowSynergy,
        antisynergy: rowAnti,
        compatibility: rowCompatibility,
        structure: rowStructure,
        meta: rowMeta,
        floorAdjustment: rowFloorAdjustment,
        total: round(
          rowBase +
            rowSynergy -
            rowAnti +
            rowCompatibility +
            rowStructure +
            rowMeta +
            rowFloorAdjustment,
          2,
        ),
        partners: cardPairs,
        traits: [...deriveTraits(card)].sort((left, right) =>
          left.localeCompare(right),
        ),
        effectProfile: row.effectProfile,
        curveBand: row.curveBand,
        curveRepair: row.curveRepair,
        runeReliability: row.runeReliability,
        equipmentActivation: row.equipmentContext?.breakdown ?? null,
        confidence:
          conditionalClauseCount(rulesForScoring(card)) > 0 ||
          deriveTraits(card).has("spell-matters") ||
          deriveTraits(card).has("trash-payoff") ||
          row.equipmentContext !== null
            ? "context-sensitive"
            : "stable",
      };
    },
  );

  return {
    total,
    base,
    synergy,
    antisynergy,
    compatibility,
    structure,
    meta,
    confidence: "foundation",
    contributions: contributions.sort(
      (a, b) => Math.abs(b.value) - Math.abs(a.value),
    ),
    cardBreakdown,
    runes,
    legality: {
      legal: issues.length === 0,
      issues: issues.sort((left, right) => left.localeCompare(right)),
      warnings: warnings.sort((left, right) => left.localeCompare(right)),
    },
  };
}

