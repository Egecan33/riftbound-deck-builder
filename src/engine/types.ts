export type Domain = 'fury' | 'calm' | 'mind' | 'body' | 'chaos' | 'order';
export type CardType = 'unit' | 'spell' | 'gear' | 'rune' | 'battlefield' | 'legend';
export type Format = 'standard-bo1' | 'standard-bo3' | '2v2' | 'ffa3' | 'ffa4' | 'casual';
export type PowerTarget = 'casual' | 'focused' | 'competitive';
export type Zone = 'main' | 'side' | 'runes' | 'battlefields' | 'legend';

export interface Card {
  id: string;              // gameplay id, lowercase, e.g. "ogn-001-298"
  code: string;            // public code, e.g. "OGN-001"
  name: string;            // rules name: "Ekko, Recurrent"; "Tibbers"; "Wuju Bladesman"
  shortName: string;       // part before the comma
  set: string;             // set of the first printing, e.g. "OGN"
  sets: string[];          // every set with a printing
  type: CardType | null;   // null when the source row is incomplete
  superTypes: string[];    // 'champion' | 'signature' | 'basic' | 'token'
  domains: Domain[];       // [] together with noDomain=true means "no domain"
  noDomain: boolean;
  tags: string[];
  championTag: string | null; // for legends, champion units and signature cards
  energy: number | null;
  power: number | null;    // total power cost
  powerDomains: Domain[];  // domains the power cost may be paid with
  might: number | null;
  mightBonus: number | null;
  printedText: string;
  text: string;            // current text: errata applied, equipment effect text included
  errata: boolean;
  keywords: string[];
  copyLimit: number;       // 3, 1 (Unique) or Infinity
  imageUrl: string;
  dataIncomplete: boolean; // excluded from building and flagged in validation
}

export type Role =
  | 'unit-body' | 'removal' | 'sweeper' | 'combat-trick' | 'protection' | 'counter'
  | 'card-flow' | 'rune-ramp' | 'mobility' | 'token-maker' | 'buff-source' | 'recursion'
  | 'disruption' | 'finisher' | 'point-source' | 'gear' | 'hate';

export type AxisId = string; // e.g. 'tokens', 'buffs', 'tag:noxus', 'kw:hidden'
export type Speed = 'action' | 'reaction' | 'normal';

export interface CardFeatures {
  id: string;
  traits: string[];                 // mined trait ids
  baseRating: number;               // 0..100
  grade: string;                    // tier grade
  roles: Role[];
  speed: Speed;
  axes: Record<AxisId, { e: number; p: number }>; // sparse, strengths in [0,1]
  costBucket: number;               // energy 0..7, 7 = 7+
  unparsed: string[];               // sentences no rule matched
}

export interface EdgeReason { id: string; kind: 'synergy' | 'antisynergy'; scope: string; label: string; detail: string; value: number }
export interface CardEdge { a: string; b: string; synergy: number; antisynergy: number; net: number; reasons: EdgeReason[] }

export interface LegalityData {
  asOf: string;                                    // ISO date of the reviewed snapshot
  sets: { code: string; name: string; legalFrom: string | null }[];
  bans: { name: string; zone: Zone; formats: Format[]; effectiveFrom: string; sourceUrl: string }[];
  sideboardMax: number;
}

export interface MetaCardStat { decks: number; share: number; avgCopies: number }
export interface LegendMeta {
  legendId: string; decks: number; quality: 'ok' | 'thin' | 'insufficient';
  main: Record<string, MetaCardStat>; side: Record<string, MetaCardStat>;
  battlefields: Record<string, MetaCardStat>;
  champions: Record<string, number>; runeSplits: Record<string, number>;
}

export interface LegendProfile {
  legendId: string; championTag: string; domains: Domain[];
  champions: string[]; signatures: string[];
  axisWeights: Record<AxisId, number>;
  battlefieldFit: { id: string; reason: string }[];
}

export interface CardDb {
  get(id: string): Card | undefined;
  features(id: string): CardFeatures | undefined;
  byName(name: string): Card | undefined;    // case/diacritic-insensitive; rules name, code or gameplay id
  all(): readonly Card[];                     // non-token cards
  edges(id: string): readonly CardEdge[];
  edge(a: string, b: string): CardEdge | undefined;
  legendProfile(id: string): LegendProfile | undefined;
  legendMeta(id: string): LegendMeta | undefined;
  legality(): LegalityData;
}

export interface DeckEntry { id: string; qty: number; locked: boolean }
export interface Deck {
  id: string | null; name: string;
  format: Format; power: PowerTarget;
  legend: string | null;
  champion: string | null;          // Chosen Champion; one copy of it is counted inside `main`
  main: DeckEntry[];
  side: DeckEntry[];
  runes: Partial<Record<Domain, number>>;
  battlefields: string[];
  extraLegends: string[];           // Neeko, Blending In
  themeWeights: Record<AxisId, number> | null; // null = derive from the legend
  teammate: { legend: string | null; battlefields: string[] } | null; // 2v2 only
}

export interface Violation { code: string; severity: 'error' | 'warning' | 'info'; message: string; cardIds: string[]; rule: string; interpretation: boolean }

export interface DeckSummary {
  mainCount: number; sideCount: number; runeCount: number;
  typeCounts: Record<'unit' | 'spell' | 'gear', number>;
  roleCounts: Record<Role, number>;
  curve: number[];                  // index 0..7
  avgEnergy: number;
  powerDemand: Partial<Record<Domain, number>>;
  axisTotals: Record<AxisId, { e: number; p: number }>;
  signatureCount: number; reactionCount: number;
}

export interface Band { lo: number; hi: number }
export interface Targets {
  archetype: string;
  types: Record<'unit' | 'spell' | 'gear', Band>;
  roles: Partial<Record<Role, Band>>;
  curve: Band[];                    // per cost bucket
  avgEnergy: Band;
}

export interface ScorePart { key: 'quality' | 'synergy' | 'role' | 'curve' | 'meta' | 'fit'; points: number; max: number }
export interface CardScore {
  id: string; score: number;        // 0..100 integer
  parts: ScorePart[]; reasons: string[];
  partners: { id: string; net: number; reason: string }[];
  gate: { code: string; message: string } | null;
}

export interface Fix { text: string; filter: { role?: Role; axis?: AxisId; domain?: Domain; maxEnergy?: number; type?: CardType } | null }
export interface SubScore { key: string; label: string; weight: number; value: number; fixes: Fix[]; heuristic: boolean }
export interface DeckRating { rating: number; legal: boolean; complete: boolean; subscores: SubScore[]; violations: Violation[] }

export type RouteId = 'wide' | 'tall' | 'hold' | 'burst' | 'points' | 'attrition' | 'altwin';
export interface WinRoute {
  id: RouteId; strength: number;    // 0..1
  closers: string[]; enablers: string[];
  closerCopies: number; pCloserByTurn5: number; clock: number;
  foldsTo: { text: string; cardIds: string[]; fieldRate: number | null }[];
  notes: string[];
}
export interface WinReport { routes: WinRoute[]; hiddenDelivery: boolean; value: number }

export interface Line { kind: 'keep' | 'turn' | 'sequence' | 'package' | 'spike' | 'matchup' | 'side' | 'format'; text: string; cardIds: string[]; reason: string; probability: number | null; heuristic: boolean }
export interface LineReport { keeps: Line[]; turns: Line[]; sequencing: Line[]; packages: Line[]; oneAway: Line[]; spikes: Line[]; matchup: Line[]; side: Line[]; format: Line[] }

export interface BuildOptions { ownedOnly: boolean; owned: Record<string, number> | null; seed: number; buildAround: string[] }
export interface SwapProposal { zone: 'main' | 'side'; out: string; in: string; reason: string; ratingBefore: number; ratingAfter: number }

export interface EngineContext { db: CardDb; opponentLegend: string | null }
