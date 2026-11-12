// Ported from Riftfoundry apps/web/src/lib/scoring.ts at origin/main 4b90179 (lines 1661-1766): base rating types, type baselines, curve bands.
// Port rule (spec 8.1): behaviour unchanged; top-level declarations are exported so the split files can share them.
import {
  finiteOr,
} from "./text";
import {
  type ScoreCard,
} from "./types";

export type BaseCardRatingComponent =
  | "printedStrength"
  | "expectedStrength"
  | "effectValue"
  | "cardAdvantage"
  | "boardControl"
  | "battlefieldControl"
  | "resourceValue"
  | "flexibility"
  | "roleUtility"
  | "reliability"
  | "costsAndDrawbacks"
  | "energyCost"
  | "powerCost"
  | "highCostRisk";

export interface BaseCardMechanicContribution {
  id: string;
  label: string;
  component: BaseCardRatingComponent;
  value: number;
  detail: string;
  activation: number;
}

export interface BaseCardRatingAxes {
  standaloneFloor: number;
  synergyCeiling: number;
  interactionFlexibility: number;
  deckBuildingTax: number;
  activationReliability: number;
}

export interface BaseCardRatingBreakdown {
  total: number;
  typeBaseline: number;
  printedStrength: number;
  expectedStrength: number;
  effectValue: number;
  cardAdvantage: number;
  boardControl: number;
  battlefieldControl: number;
  resourceValue: number;
  statEfficiency: number;
  immediateValue: number;
  flexibility: number;
  roleUtility: number;
  reliability: number;
  activationFactor: number;
  resourceCost: number;
  energyCost: number;
  powerCost: number;
  highCostRisk: number;
  costsAndDrawbacks: number;
  powerStrain: number;
  recognizedEffects: string[];
  mechanics: BaseCardMechanicContribution[];
  axes: BaseCardRatingAxes;
}

export const baseCardRatingBreakdownCache = new WeakMap<
  ScoreCard,
  BaseCardRatingBreakdown
>();

export const TYPE_BASELINES: Readonly<Record<string, number>> = {
  unit: 5,
  spell: 5,
  gear: 5,
  legend: 5,
  battlefield: 5,
};

export const DECK_CURVE_TARGETS = {
  "standard-1v1": {
    targetDeckSize: 40,
    bands: [
      { id: "early", label: "1–2 Energy", minimum: 5, ideal: 8, maximum: 11 },
      { id: "setup", label: "3 Energy", minimum: 5, ideal: 8, maximum: 11 },
      { id: "mid", label: "4–5 Energy", minimum: 10, ideal: 14, maximum: 18 },
      { id: "top", label: "6+ Energy", minimum: 2, ideal: 5, maximum: 8 },
    ],
  },
  "vendetta-prerift": {
    targetDeckSize: 25,
    bands: [
      { id: "early", label: "1–2 Energy", minimum: 3, ideal: 5, maximum: 7 },
      { id: "setup", label: "3 Energy", minimum: 3, ideal: 5, maximum: 7 },
      { id: "mid", label: "4–5 Energy", minimum: 6, ideal: 9, maximum: 12 },
      { id: "top", label: "6+ Energy", minimum: 1, ideal: 3, maximum: 5 },
    ],
  },
} as const;

export type CurveBandId =
  (typeof DECK_CURVE_TARGETS)["standard-1v1"]["bands"][number]["id"];

export function curveBandFor(card: ScoreCard): CurveBandId | null {
  if (!["unit", "spell", "gear"].includes(card.type)) return null;
  const energy = finiteOr(card.energy, 0);
  if (energy <= 2) return "early";
  if (energy === 3) return "setup";
  if (energy <= 5) return "mid";
  return "top";
}
