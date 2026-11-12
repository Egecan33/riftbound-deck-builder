// Ported from Riftfoundry apps/web/src/lib/scoring.ts at origin/main 4b90179 (lines 152-184): CombinationReason, pair and triple analysis types.
// Port rule (spec 8.2): behaviour unchanged; top-level declarations are exported so the split files can share them.
import type { Trait } from "../mine";

export type CombinationReasonKind = "synergy" | "antisynergy";
export type CombinationReasonScope =
  | "explicit-reference"
  | "mechanic-package"
  | "resource-conflict"
  | "triple-motif";

export interface CombinationReason {
  id: string;
  label: string;
  kind: CombinationReasonKind;
  scope: CombinationReasonScope;
  value: number;
  detail: string;
  cardIds: string[];
  traits: Trait[];
}

export interface CardPairAnalysis {
  cardIds: [string, string];
  synergy: number;
  antisynergy: number;
  net: number;
  reasons: CombinationReason[];
}

export interface CardTripleAnalysis {
  cardIds: [string, string, string];
  synergy: number;
  antisynergy: number;
  net: number;
  reasons: CombinationReason[];
}
