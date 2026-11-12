// Ported from Riftfoundry apps/web/src/lib/deck-guidelines.ts at origin/main 4b90179, unchanged.
// These are COMMUNITY guideline numbers (advisory). Forge reconciles them with the measured bands of
// docs/research/deck-theory.md in src/engine/targets.ts (GUIDELINE_RECONCILIATION); the rating uses the measured ones.
import { deriveTraits, type DeckEntry, type ScoreCard } from "../../mine";

/**
 * Community deck-building guidelines. This module is ADVISORY ONLY: it is
 * a separate checklist sourced from public Riftbound deckbuilding guides
 * and is never mixed into the deterministic RDS numbers produced by
 * `scoreDeck`. Every check is a pure function of the Main Deck entries so
 * results stay deterministic for a given deck.
 */

export interface CommunityGuidelineSource {
  id: string;
  label: string;
  url: string;
}

export const COMMUNITY_GUIDELINE_SOURCES: readonly CommunityGuidelineSource[] =
  [
    {
      id: "mobalytics",
      label: "Mobalytics — Beginner Guide to Deckbuilding",
      url: "https://mobalytics.gg/riftbound/guides/deckbuilding-fundamentals",
    },
    {
      id: "gamertag",
      label:
        "GamertagMythras — Riftbound Deckbuilding Basics (Riot primer numbers)",
      url: "https://gamertagmythras.com/blog/riftbound-tcg/riftbound-deckbuilding-basics",
    },
    {
      id: "runesandrift",
      label: "RunesAndRift — Riftbound Deckbuilding Guide",
      url: "https://runesandrift.com/riftbound-deckbuilding-guide/",
    },
  ];

export interface DeckGuidelineResult {
  id: string;
  label: string;
  actual: number;
  target: number;
  pass: boolean;
  /** One plain-English sentence when the rule fails; null when it passes. */
  advice: string | null;
  sourceId: string;
}

/** All targets are expressed against the 40-card Standard Main Deck. */
export const GUIDELINE_MAIN_DECK_SIZE = 40;

export function isGuidelineUnit(card: Pick<ScoreCard, "type">): boolean {
  return card.type === "unit";
}

/** Units costing 2 Energy or less — the operator's requested minimum is 8. */
export function isLowDropUnit(
  card: Pick<ScoreCard, "type" | "energy">,
): boolean {
  return card.type === "unit" && card.energy !== null && card.energy <= 2;
}

/** Units costing 2–4 Energy (Riot's primer recommends 9+). */
export function isEarlyCurveUnit(
  card: Pick<ScoreCard, "type" | "energy">,
): boolean {
  return (
    card.type === "unit" &&
    card.energy !== null &&
    card.energy >= 2 &&
    card.energy <= 4
  );
}

/**
 * Interactive spells answer opposing units or plays. Classification reuses
 * the exported `deriveTraits` registry from the RDS model, whose
 * "interaction" trait is derived deterministically from directional rules
 * text (hostile kill / damage / stun / exhaust / recall / negate effects),
 * so this checklist never re-invents the scoring model's semantics.
 */
export function isInteractiveSpell(card: ScoreCard): boolean {
  return card.type === "spell" && deriveTraits(card).has("interaction");
}

/** Cards castable without Power pips (no colored pip requirement). */
export function isPowerPipFree(card: Pick<ScoreCard, "power">): boolean {
  return (card.power ?? 0) === 0;
}

/**
 * A "playset" is a card held at 3 copies, or at its copy limit when the
 * limit is below 3 (RunesAndRift: maximize 3x playsets for consistency).
 */
export function isPlaysetEntry(entry: {
  card: Pick<ScoreCard, "copyLimit">;
  quantity: number;
}): boolean {
  return entry.quantity >= Math.min(3, Math.max(1, entry.card.copyLimit));
}

interface GuidelineRule {
  id: string;
  label: string;
  target: number;
  sourceId: string;
  measure: (entries: readonly DeckEntry[]) => number;
  advice: (actual: number, target: number) => string;
}

function countCopies(
  entries: readonly DeckEntry[],
  matches: (card: ScoreCard) => boolean,
): number {
  return entries.reduce(
    (total, { card, quantity }) =>
      matches(card) ? total + Math.max(0, quantity) : total,
    0,
  );
}

const GUIDELINE_RULES: readonly GuidelineRule[] = [
  {
    id: "low-drop-units",
    label: "Units costing 2 Energy or less",
    target: 8,
    sourceId: "mobalytics",
    measure: (entries) => countCopies(entries, isLowDropUnit),
    advice: (actual, target) =>
      `Add ${target - actual} more units costing 2 Energy or less so you can contest battlefields from the first turns.`,
  },
  {
    id: "early-curve-units",
    label: "Units costing 2–4 Energy",
    target: 9,
    sourceId: "gamertag",
    measure: (entries) => countCopies(entries, isEarlyCurveUnit),
    advice: (actual, target) =>
      `Add ${target - actual} more units in the 2–4 Energy range to keep a steady flow of early board presence.`,
  },
  {
    id: "unit-share",
    label: "Units in the Main Deck",
    target: 20,
    sourceId: "mobalytics",
    measure: (entries) => countCopies(entries, isGuidelineUnit),
    advice: (actual, target) =>
      `Raise the unit count to at least ${target} of ${GUIDELINE_MAIN_DECK_SIZE} cards so the deck can hold battlefields, not just react.`,
  },
  {
    id: "interactive-spells",
    label: "Interactive spells",
    target: 6,
    sourceId: "gamertag",
    measure: (entries) => countCopies(entries, isInteractiveSpell),
    advice: (actual, target) =>
      `Include ${target - actual} more spells that answer opposing units or plays so you are never a pure bystander.`,
  },
  {
    id: "power-pip-free",
    label: "Cards castable without Power pips",
    target: 26,
    sourceId: "gamertag",
    measure: (entries) => countCopies(entries, isPowerPipFree),
    advice: (actual, target) =>
      `Swap toward ${target} of ${GUIDELINE_MAIN_DECK_SIZE} cards with no Power pip cost (about two-thirds) so hands stay castable before runes line up.`,
  },
  {
    id: "playset-consistency",
    label: "Full playsets (3 copies, or the copy limit if lower)",
    target: 10,
    sourceId: "runesandrift",
    measure: (entries) =>
      new Set(
        entries
          .filter((entry) => entry.quantity > 0 && isPlaysetEntry(entry))
          .map((entry) => entry.card.name),
      ).size,
    advice: (actual, target) =>
      `Consolidate the list into at least ${target} full playsets so key cards show up reliably every game.`,
  },
];

/**
 * Evaluate the community checklist over Main Deck entries. Purely
 * advisory: the result never feeds back into RDS scores or legality.
 */
export function evaluateDeckGuidelines(
  entries: readonly DeckEntry[],
): DeckGuidelineResult[] {
  return GUIDELINE_RULES.map((rule) => {
    const actual = rule.measure(entries);
    const pass = actual >= rule.target;
    return {
      id: rule.id,
      label: rule.label,
      actual,
      target: rule.target,
      pass,
      advice: pass ? null : rule.advice(actual, rule.target),
      sourceId: rule.sourceId,
    };
  });
}
