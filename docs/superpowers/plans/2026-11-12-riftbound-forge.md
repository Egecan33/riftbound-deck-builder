# Riftbound Forge Implementation Plan

> **For agentic workers:** execute task by task. Steps use checkbox (`- [ ]`) syntax. Read the spec section named in each task before starting it.

**Goal:** a local web app that builds, scores, rates, improves and theorycrafts Riftbound decks for 1v1, 2v2 and FFA, with card images on disk.

**Architecture:** one Next.js process. A pure TypeScript engine (`src/engine`, no IO) over an in-memory card database. Ingest CLIs load the official gallery, reviewed data files and Piltover Archive lists into SQLite and download images. Card understanding and card-to-card interactions are ported from the owner's Riftfoundry code and extended.

**Tech stack:** Node 22, pnpm, Next.js (App Router), React, TypeScript strict, Tailwind, better-sqlite3, Vitest, Playwright, tsx, `@piltoverarchive/riftbound-deck-codes`.

**Spec:** `docs/superpowers/specs/2026-11-12-riftbound-forge-design.md`. Research: `docs/research/*.md`.

## Global constraints

- Repo: `~/github_repositories/riftbound-forge`. Never modify any other repository. Read-only sources: `~/github_repositories/Untitled` (Riftfoundry; use `git show origin/main:<path>` or the snapshot at `docs/research/analysis/riftfoundry/raw/`), `~/github_repositories/GameLab`.
- `AGENTS.md` hard rules apply. In short: no game fact from memory; lists in `sync-data/`, not code; no score without reasons; heuristics labelled; no card data or images in git except the test fixture.
- `src/engine/**` imports nothing from Node, Next, React or `src/server`.
- Shared types live in `src/engine/types.ts` exactly as in Task 1. Add a field there first and say so in the commit message.
- **Reuse rule (spec §8.4):** before writing a module, look for it in Riftfoundry `apps/web/src/lib/`. Port with its tests, keep behaviour, then extend. Ported files keep a header comment naming the source file and commit (4b90179). Ported code's own types (`ScoreCard`, `DeckEntry`, `DeckScore`, `Trait`, …) stay as they are inside `src/engine/mine` and `src/engine/network`; `src/engine/mine/adapter.ts` converts from the Forge `Card`.
- HTTP: `User-Agent: RiftboundForge/0.1`, serial per host, community sites ≥1.5 s apart, no personal data. Do not fetch riftbound.gg or riftdecks.
- Images: `data/images/{cardId}.webp`. `data/` is gitignored. Fixtures are committed under `tests/fixtures/`.
- English UI. Desktop. Every card shown as an image.
- Each task ends with `pnpm typecheck && pnpm test` green and a commit staging only that task's paths. Trailer: `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`. Push after each commit. Update the stage table in `docs/STATUS.md` when a stage finishes.

## Review focus

1. **Card names.** Champion units are `name, subtitle`; signature cards and starter legends are `name` alone; local GameLab data names two Master Yi units "Yi, …". Copy limits, bans and imports all key on the rules name. → Tasks 2, 3, 9.
2. **Incomplete Radiance gallery rows** (empty type or domain, seven rows typed "spell" with Might). Must become `dataIncomplete`, never domainless or silently wrong. → Tasks 2, 3.
3. **Errata.** The gallery shows old text for most of the 70 errata'd cards; the mine must parse current text. → Tasks 2, 4.
4. **Partial decks** (no legend, no champion, 7 cards, 43 cards, 0 runes): every engine function returns sane values and never throws or divides by zero. → Tasks 5–8.
5. **Format differences.** Exactly 40 vs at least 40; side deck only where allowed; per-format bans; 2v2 teammate checks. → Tasks 3, 8.
6. **Messy imports.** `3 Card Name`, `3x`, section headers (Legend, Champion, Main, Runes, Battlefields, Sideboard), set codes (`OGN-043`), deck codes, tokens in lists, banned cards in old lists. Unresolved lines are reported, never dropped. → Task 9.

## File map

```
src/engine/types.ts            contract (Task 1)
src/engine/carddb.ts           in-memory CardDb (Task 2)
src/engine/rules/              names.ts, identity.ts, champion.ts, copies.ts, validate.ts
src/engine/mine/               ported scoring.ts card-understanding half, adapter.ts, radiance.ts, coverage.ts
src/engine/network/            ported pair/triple analysis, edges.ts, loops.ts, suppress.ts
src/engine/features/           roles.ts, axes.ts, legend.ts, compute.ts
src/engine/maths/              hypergeo.ts, runes.ts, curve.ts
src/engine/targets.ts
src/engine/scoring/  rating/  wincons/  builder/  lines/  text/
src/ingest/                    http.ts, cards.ts, errata.ts, legality.ts, images.ts, meta.ts, features.ts, sync.ts, fixtures.ts
src/server/                    db.ts, carddb.ts, decks.ts, settings.ts, context.ts
src/app/api/**  src/app/**
sync-data/                     legality.json, errata.json, card-overrides.json
tests/fixtures/                cards.json, meta.json, decks/*.txt
tests/engine/**  tests/server/**  tests/e2e/**
```

---

### Task 1: Scaffold and contract

**Files:** `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `playwright.config.ts`, Tailwind config, `src/app/layout.tsx`, `src/app/page.tsx` (placeholder), `src/engine/types.ts`, `tests/engine/smoke.test.ts`.

- [ ] Create the Next.js + TypeScript + Tailwind app in the repo root (existing `docs/`, `README.md`, `AGENTS.md`, `LICENSE`, `.gitignore` stay). Scripts: `dev`, `build`, `start` (port 3220), `typecheck`, `test` (`vitest run`), `e2e`, `sync` (`tsx src/ingest/sync.ts`). Alias `@/*` → `src/*`. `better-sqlite3` in `serverExternalPackages`.
- [ ] Write `src/engine/types.ts` exactly:

```ts
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
```

- [ ] `tests/engine/smoke.test.ts` imports a type and asserts `1 + 1 === 2`. `pnpm typecheck && pnpm test`. Commit.

### Task 2: Data ingest, database, fixtures

**Spec:** §6. **Research:** `legality-and-data.md §5–§8`, `rules.md §9, §11`, `rulings-and-errata.md §1, §4`, `meta-sources.md`.

**Files:** `src/ingest/*`, `src/server/{db,carddb}.ts`, `src/engine/carddb.ts`, `src/engine/rules/names.ts`, `sync-data/*`, `tests/fixtures/*`, `tests/helpers/fixture-db.ts`, `tests/engine/{carddb,names}.test.ts`.

**Produces:** `openDb(path?)` with the tables of spec §6.2; `toCard(galleryPrintings[], errata, overrides): Card`; `rulesName(row)`; `createCardDb(cards, features, edges, profiles, meta, legality): CardDb` (pure); `loadCardDb(db)` cached with `invalidateCardDb()`; CLI steps `cards`, `errata`, `legality`, `images` (`--limit N`), `meta` (`--max N`), `features` (stub until Task 4), each writing `sync_state` and printing `step done/total`; fixtures and `fixtureDb()`.

- [ ] Tests on inline gallery-shaped samples: champion unit name joins subtitle; signature card and starter legend do not; printings collapse to one card with all sets; empty type or domain → `dataIncomplete`; `colorless` → `noDomain`; errata text replaces printed text and sets `errata`; equipment effect text is appended; Spiderling `copyLimit` is `Infinity`; Unique → 1; `byName` accepts rules name, code, gameplay id, wrong case and curly apostrophes.
- [ ] `sync-data/legality.json` from `rules.md §9` (6 sets; 12 Standard bans; the 2v2 legend ban; `sideboardMax: 10`), each ban with its source URL and date. `sync-data/errata.json` from `rulings-and-errata.md §1` (reuse the JSON its analysis scripts produced if present). `sync-data/card-overrides.json` with the champion-tag and name fixes of `rules.md §3`.
- [ ] `cards`: fetch the official gallery JSON endpoint (`legality-and-data.md §5`), build cards, upsert cards and printings. Reuse the research scripts under `docs/research/analysis/` where they already solve a step.
- [ ] `images`: WebP per card from the CDN (`fm=webp`), 6 parallel, resume, `.part` then rename, failures reported not fatal.
- [ ] `meta`: Piltover Archive lists per `meta-sources.md` (reuse `docs/research/analysis/**/fetch*` logic and its cached raw files when present), into `meta_decks`, `meta_deck_cards`; aggregate `meta_legend_cards` with era weighting; quality grade per legend.
- [ ] `fixtures`: after a real `pnpm sync cards errata legality meta`, write `tests/fixtures/cards.json` with: every card named in `rules.md §2–§13`; all legends, all champion units, all signature cards, all battlefields, the six runes; every banned card; every card in `tests/fixtures/decks/*.txt`; plus 150 further main-deck cards spread across sets and types including 40 Radiance cards. `tests/fixtures/meta.json` for 6 legends. Six reference decklists (`tests/fixtures/decks/`), from recent Piltover Archive lists of different legends, legal today.
- [ ] Run the real sync for cards, errata, legality, meta and at least 200 images; record counts in the commit message (expect ≈1,100 gameplay cards, 58 legends). Commit code, sync-data and fixtures.

### Task 3: Rules engine

**Spec:** §7. **Research:** `rules.md §1–§13`.

**Files:** `src/engine/rules/*`, `tests/engine/rules.test.ts`.

**Produces:**
```ts
domainIdentity(deck: Deck, db: CardDb): Set<Domain>
championTagOf(card: Card): string | null
eligibleChampions(legend: Card, db: CardDb): Card[]
copyLimit(card: Card): number
cardFitsDeck(card: Card, zone: Zone, deck: Deck, db: CardDb): Violation | null   // identity, type/zone, ban, signature tag, incomplete data
validateDeck(deck: Deck, db: CardDb): Violation[]
formatRules(format: Format): { mainExact: number | null; mainMin: number; sideAllowed: boolean; sideMax: number; victoryScore: number; battlefieldsOnBoard: number; banListOf: Format }
```
Violation codes exactly as in `rules.md §12`.

- [ ] One test per row of `rules.md §12` and per edge case of `§13` (21 cases), on fixture cards; plus Review focus 4 and 5. An empty deck returns violations and does not throw.
- [ ] Implement. Commit.

### Task 4: Card mine (port and extend)

**Spec:** §8.1, §8.4. **Research:** `mechanics-glossary.md`, `card-text-parser.md`, `rulings-and-errata.md`.

**Files:** `src/engine/mine/*`, `src/ingest/features.ts`, `tests/engine/mine/*`.

**Produces:** `toScoreCard(card: Card): ScoreCard`; ported `deriveTraits`, `baseCardRatingBreakdown`, `baseCardRating`, `foundationGradeForCard`, `TRAIT_LABELS` and the registry; `mineCard(card): { traits, baseRating, grade, unparsed, effectProfile }`; `coverage(cards): { noTraits: string[]; unparsedSentences: {text: string; count: number}[] }`.

- [ ] Port the card-understanding half of Riftfoundry `scoring.ts` into `src/engine/mine/` split into files of reasonable size, and port the tests that cover it (`scoring-effect-families`, `scoring-semantic-*`, `scoring-conditional-value`, `scoring-cross-clause-costs`, `scoring-directionality`, `scoring-ready-action-economy`, `scoring-accumulated-engine`, `scoring-compound-point-gates`, `scoring-equipment-context`, `scoring-card-eligibility`, and others that apply). Remove the JSON and meta imports in favour of parameters. Ported tests pass against the same card inputs they used (copy the cards they need into the fixture).
- [ ] Run the mine over the full synced pool. List every card with no traits and every unparsed sentence by frequency. Extend the registry for Radiance and the current rules (Deploy, Disarm, Show Off, Backline, Empower/Empowered, Flow, Bomb, and whatever the report shows), one test per added mechanic on real card text.
- [ ] Compare mined effects with the scripted cards in `~/github_repositories/GameLab/packages/cards` for cards that have scripts; fix disagreement classes or record the card in `sync-data/card-overrides.json` with the reason.
- [ ] Coverage guard test: every fixture main-deck card has ≥1 trait or an override. Print pool-wide coverage in the commit message.
- [ ] `pnpm sync features` stores traits, base rating, grade and unparsed sentences. Commit.

### Task 5: Knowledge network, roles, axes, legend profiles, maths

**Spec:** §8.2, §8.3. **Research:** `interactions.md`, `legend-profiles.md`, `deck-theory.md` Parts 2–3.

**Files:** `src/engine/network/*`, `src/engine/features/*`, `src/engine/maths/*`, `tests/engine/{network,features,maths}.test.ts`.

**Produces:** ported `analyzeCardPair`, `analyzeCardTriple`, `synergyAffinity`, `PACKAGE_PAIRS`, `ORPHAN_ENGINE_RULES`, `cardRuneReliability`, `earlyPackageReliability`, `hypergeometricAtLeast`; `buildEdges(cards): CardEdge[]` (pairs that can share an identity, net ≠ 0, with suppressors and rule-forbidden overrides applied); `findLoops(deckIds, db)`; `rolesOf(card, traits): Role[]`; `axesOf(card, traits)`; `AXES`; `legendProfile(legend, db): LegendProfile`; `computeFeatures(card): CardFeatures`; `runeSplit(deck, db): Partial<Record<Domain, number>>`.

- [ ] Port with tests (`scoring-candidate-combinations`, `scoring-pair-provider-compatibility`, and the pair/triple tests). Edge reasons quote both cards' text.
- [ ] Tests on real fixture cards: ten known synergy pairs produce an edge with a sensible reason; ten unrelated pairs produce none; a rule-forbidden interaction from `rulings-and-errata.md §5` is absent; roles for 30 named cards (removal, sweeper, counter, card flow, trick, finisher, token maker…) are right; each of the 58 legends gets a profile with a champion tag, ≥1 eligible champion and ≥1 axis.
- [ ] `pnpm sync features` builds and stores edges and profiles for the full pool; print node/edge counts and the 30 strongest edges in the commit message; full-pool pass under 60 s.
- [ ] Commit.

### Task 6: Summary, targets, scoring, rating

**Spec:** §9, §10, §11. **Research:** `deck-theory.md` Parts 2 and 6.

**Files:** `src/engine/{summary,targets}.ts`, `src/engine/scoring/*`, `src/engine/rating/*`, `tests/engine/{scoring,rating}.test.ts`.

**Produces:**
```ts
summarizeDeck(deck: Deck, db: CardDb, exclude?: string): DeckSummary
resolveThemeWeights(deck: Deck, db: CardDb): Record<AxisId, number>
targetsFor(deck: Deck, db: CardDb, summary: DeckSummary): Targets
createScorer(deck: Deck, ctx: EngineContext): { score(card: Card, zone?: Zone): CardScore; scoreAll(filter?: (c: Card) => boolean): CardScore[] }
rateDeck(deck: Deck, ctx: EngineContext): DeckRating
```
Use the ported `scoreDeck` / `evaluateCandidateFit` where they fit; the weights are those of spec §10 and §11.

- [ ] Scoring tests: off-identity card gated; banned card gated per format (a 2v2-only ban gates only in 2v2); fourth signature gated; a card with strong edges into the deck outscores a similar-quality card with none by ≥ 10; role-need monotonicity (removal score falls as removal fills); leave-one-out equality; parts sum to score ±1 and `reasons.length ≥ 1`; partners named; empty deck with a legend does not throw; `scoreAll` over a 1,200-card synthetic pool under 400 ms.
- [ ] Rating tests: each reference deck rates 55–90 and is legal; removing 6 units lowers `roles` and adds a fix; a rune split with 0 of a needed domain lowers `runes` and adds a fix naming the card and the numbers; an illegal deck ≤ 40 with violations; a 15-card partial deck returns a rating, no NaN; every sub-score ≤ 3 fixes; heuristic sub-scores flagged.
- [ ] Commit.

### Task 7: Win conditions and lines

**Spec:** §12, §14. **Research:** `wincons.md §2, §4, §5.2`, `matchups-and-lines.md §2–§5`.

**Files:** `src/engine/wincons/*`, `src/engine/lines/*`, `tests/engine/{wincons,lines}.test.ts`.

**Produces:** `detectWinRoutes(deck: Deck, ctx: EngineContext): WinReport`; `generateLines(deck: Deck, ctx: EngineContext): LineReport`. Port Riftfoundry's strategy identity, packages, linked strategy lines and mulligan priorities from `theory-decks.ts` as the starting point; the research detectors (`docs/research/analysis/wincons/detect.py`, `matchups-and-lines/linegen.py`) are the reference for what to add. Fix the defects listed in `wincons.md §5.2`.

- [ ] Tests: the six reference decks get ≥ 1 route each with closers that are in the deck; at least four different primary routes across them; `foldsTo` non-empty; every `Line.cardIds` is non-empty and ⊆ deck (matchup lines may also name opponent cards); for three decks of different legends, fewer than 15% of line texts are shared; keep odds lie in (0,1) and change when copies change; setting `opponentLegend` changes `matchup` and `side`; a deck with no side deck yields no side lines; format notes differ between `standard-bo3` and `ffa4`.
- [ ] Commit.

### Task 8: Builder

**Spec:** §13.

**Files:** `src/engine/builder/*`, `tests/engine/builder.test.ts`.

**Produces:**
```ts
autoBuild(deck: Deck, ctx: EngineContext, opts: BuildOptions): Deck     // keeps legend, champion, locked entries
fillRest(deck: Deck, ctx: EngineContext, opts: BuildOptions): Deck
suggestSwaps(deck: Deck, ctx: EngineContext, opts: BuildOptions, count?: number): SwapProposal[]
improveDeck(deck: Deck, ctx: EngineContext, opts: BuildOptions, max?: number): SwapProposal[]
applySwaps(deck: Deck, swaps: SwapProposal[]): Deck
buildSideDeck(deck: Deck, ctx: EngineContext, opts: BuildOptions): DeckEntry[]
```
Port the generator logic of Riftfoundry `theory-decks.ts` / `theory-deck-fit*.ts` as the base. Seeded RNG (mulberry32).

- [ ] Tests: for 20 legends (≥ 5 from Radiance) × 6 formats, `autoBuild` → `validateDeck` has no errors, main is 40, runes 12, battlefields 3, side deck ≤ 10 and only where allowed, rating ≥ 55; same seed → same deck, different seed → different; `buildAround` cards are in the result at ≥ 2 copies and their strongest partners appear; locked entries survive; `ownedOnly` with a small collection still returns a legal deck or a clear violation list; `fillRest` keeps what is present; `improveDeck` on a reference deck with 8 cards replaced by weak ones returns ≥ 4 proposals each raising the rating, never cutting a locked card; an imported list with a banned card gets that card cut first.
- [ ] Each build under 3 s on the fixture DB. Commit.

### Task 9: Text, deck codes, collection

**Spec:** §15 import/export. **Files:** `src/engine/text/*`, `tests/engine/text.test.ts`.

**Produces:** `parseDecklist(text, db)` → `{ deck: Partial<Deck>; unresolved: {line: number; text: string}[] }`; `exportDecklist(deck, db): string`; `decodeDeckCode(code, db)`, `encodeDeckCode(deck, db)` (port `deck-code.ts`); `parseCollection(text, db)`.

- [ ] Tests: every Review focus 6 format; round trip; a Piltover Archive deck code from the fixtures decodes to its list; tokens dropped with a notice; CSV with header auto-detected.
- [ ] Commit.

### Task 10: Server and API

**Spec:** §6.2, §15. **Files:** `src/server/*`, `src/app/api/**/route.ts`, `tests/server/api.test.ts`.

Routes (JSON): `GET /api/status`; `POST/GET /api/sync`; `GET /api/legends`; `GET /api/champions?legend`; `GET/POST /api/decks`, `GET/PUT/DELETE /api/decks/[id]`; `POST /api/analyze {deck, opponentLegend}` → `{ rating, summary, targets, themeWeights, deckScores, win, lines }`; `POST /api/cards {deck, zone, q, filters, sort, page, pageSize}` → scored, gated cards last; `GET /api/card/[id]?deck` → card, features, top partners; `POST /api/build {deck, mode, options}`; `POST /api/import`, `POST /api/export`; `GET/POST /api/collection`; `GET/PUT /api/settings`; `GET /api/img/[file]` with a one-year cache header and an SVG placeholder on 404.

- [ ] Tests against a temp SQLite seeded from fixtures: analyze returns rating, win routes and lines; `/api/cards` filter by role; build `auto` returns a legal deck; import → save → load round trip; image path traversal → 400.
- [ ] Commit.

### Task 11: UI

**Spec:** §15. Use the `frontend-design` skill. Commander Forge's UI (`~/github_repositories/commander-forge/src/app`) is the reference for structure and interaction; Riftfoundry's deck lab for Riftbound-specific presentation.

- [ ] `/` decks. `/new` Legend → Chosen Champion → format and power → themes and build-around → Auto-build / Start empty / Import.
- [ ] `/deck/[id]` builder with header, card browser, deck zones (main, runes, battlefields, side), panels (Rating, Win conditions, Network, Lines, Matchup, Themes, Improve), card overlay. Debounced autosave and re-analyze; optimistic edits.
- [ ] `/data`, `/collection`. First run with an empty DB redirects to `/data`.
- [ ] Heuristic outputs carry a visible "heuristic" mark. Missing image → placeholder tile with the name.
- [ ] Commit.

### Task 12: End-to-end, calibration, review

- [ ] Playwright against the real synced DB: create a deck via Auto-build → 40 main, legal chip, rating visible, ≥ 40 images loaded; remove a card → numbers change; Lines panel shows named cards; set an opponent → matchup lines appear; Improve on an imported list → accept one swap; export.
- [ ] `pnpm tsx src/ingest/calibrate.ts`: for 8 legends print top 30 scored cards, the auto-build per format, its rating, routes and lines; fix what is plainly wrong.
- [ ] Whole-branch review against the spec's goals and anti-goals by driving the real UI and reading screenshots; fix findings; `pnpm typecheck && pnpm test && pnpm e2e`.
- [ ] `README.md`: real getting-started, screenshots, roadmap ticked. `docs/STATUS.md` final.

### Task 13: Downloads for macOS and Windows, packaged exactly like Commander Forge

Owner, 2026-11-12: "package both like the Magic one and put them on GitHub, with everything." The GitHub repository is `Egecan33/riftbound-deck-builder` (product name Riftbound Forge; local folder `riftbound-forge`). This replaces the earlier Electron idea.

Port Commander Forge's release setup (`~/github_repositories/commander-forge`: `packaging/` with `assemble.mjs`, `build-sync.mjs`, `launcher.mjs`, the `.command` and `.bat` starters, `READ ME FIRST.txt`, `RELEASE_NOTES.md`; `.github/workflows/release.yml`; `package.json` scripts `build:sync` and `package`; `next.config.ts` standalone output; its commits `275a85b` and `e35f899`). Same shape: a portable zip per platform holding the Next standalone server, the bundled sync script, the official Node.js binary and a double-click starter. No card data or images in the bundle; first start syncs them.

**Files:** `packaging/*`, `.github/workflows/release.yml`, `package.json`, `next.config.ts`, `README.md`, `docs/screenshots/*`.

- [ ] Port and adapt names, port 3220, data directory handling and the sync steps of this app (`cards errata legality images meta features`; `sync-data/` ships in the bundle).
- [ ] Build and assemble the macOS bundle on this Mac. Unzip it into a fresh folder, start it with the starter, run the first sync from the Data page, auto-build a deck, quit. Fix what breaks.
- [ ] `release.yml` on a `v*` tag: macOS arm64, macOS x64 and Windows x64 bundles, tests first, artifacts attached to a GitHub Release. Runner images as in Commander Forge's current workflow.
- [ ] README like Commander Forge's: download and downloads badges, test-count badge, hero screenshot, feature list, screenshot table, download and first-run instructions per system including the unsigned-app steps, run-from-source, how it works, data sources and legal note. State plainly what is heuristic. Roadmap ticked.
- [ ] Tag `v0.1.0`, push, wait for the workflow, confirm the Release holds all three zips, download the macOS one and start it once more. The Windows bundle is verified by its CI job and artifact only; say so.
- [ ] `docs/STATUS.md` final. Commit.
