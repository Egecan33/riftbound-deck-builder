// Ported from Riftfoundry apps/web/src/lib/scoring.ts at origin/main 4b90179 (lines 96-118): ScoreCard and DeckEntry.
// Port rule (spec 8.1): behaviour unchanged; top-level declarations are exported so the split files can share them.

export interface ScoreCard {
  id: string;
  name: string;
  setId: string;
  type: string;
  accessibilityText?: string;
  superTypes?: string[];
  domains: string[];
  domainNames: string[];
  rulesText: string;
  energy: number | null;
  power: number | null;
  might: number | null;
  mightBonus?: number | null;
  tags: string[];
  copyLimit: number;
}

export interface DeckEntry {
  card: ScoreCard;
  quantity: number;
}
