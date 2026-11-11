# Riftbound Forge — design

Date: 2026-11-12. Owner's decisions are recorded in `docs/STATUS.md`; they were given up front ("skip the brainstorming questions") and in follow-up messages, so this document was not sent back for approval.

Research this design rests on is in `docs/research/`. References look like `rules.md §12`. When this document and a research file disagree, this document wins; when it is silent, the research file is the spec. Verified files (they end with a verification log): `rules.md`, `legality-and-data.md`, `deck-theory.md`, `meta-sources.md`, `wincons.md`. Written but not independently verified: `mechanics-glossary.md`, `rulings-and-errata.md`, `interactions.md`, `legend-profiles.md`, `matchups-and-lines.md`, `card-text-parser.md`. Anything taken from an unverified file is tested against real cards during the build before it is relied on.

## 1. Intent

A local, single-user web app for building Riftbound decks and theorycrafting with them, built the way Commander Forge was (`~/github_repositories/commander-forge`): pure TypeScript engine, SQLite, card images on disk, Next.js UI on localhost.

The owner, in their words: build decks for 1v1, 2v2 and FFA; fit themes and build around chosen cards; pay attention to synergies; understand what a good deck needs; follow every Riftbound rule; give theorycraft lines "that aren't rinse and repeat", win conditions, what to do in matchups, the side deck and the rune split, following the current meta. "Card mechanics are critical." "Understanding and evaluating the cards is important." "Use the knowledge network and the card mine from Riftfoundry."

## 2. Goals

1. **Auto-build** a legal deck from a Legend and Chosen Champion: 40 main, 12 runes, 3 battlefields, side deck where the format has one. Options: format, power target, themes, cards to build around (locks), owned-only.
2. **Build by hand** on the same screen with live legality, scores and rating. Any mix: lock some cards, fill the rest.
3. **Per-card score 0–100** relative to the Legend and the current deck, with the breakdown and the partner cards that produce it.
4. **Deck rating 0–100** with sub-scores and concrete fixes.
5. **Improve a list**: paste a decklist or deck code, get ordered swap proposals with reasons and rating deltas, accept or reject one by one.
6. **Collection** import with an owned-only mode.
7. **Rules enforced exactly** for `standard-bo1`, `standard-bo3`, `2v2`, `ffa3`, `ffa4` and `casual`, per `rules.md §12` (34 checks).
8. **Theorycraft**: interactions and packages in the deck and one card away; win routes with named closers; opening-hand keeps; a turn plan from the deck's real curve and runes; matchup notes and side-in/side-out against a chosen opposing Legend; rune split with the reason.
9. **Images first.** Every card is an image everywhere. Works offline after sync.

## 3. Non-goals (v1)

Accounts, hosting, multi-user. AI/LLM features. A game simulator or playtest table. Sealed and Draft (the format switch leaves room, `rules.md §10.1`). Prices. Phone layout. Non-English cards.

## 4. Anti-goals

- A deck the app calls legal that is not.
- A score, rating, line or suggestion without its reasons.
- Ban list, set legality, copy limits or errata hardcoded in source files.
- A card the engine does not understand passing silently. Every main-deck card must produce at least one trait or sit in the reviewed overrides file; a test fails otherwise.
- Lines that read the same for different decks. A line must name cards from the deck.
- Text-only card lists as the primary view.
- A heuristic shown as if it were a rule or a measurement.

## 5. Stack and layout

Next.js (App Router), React, TypeScript strict, Tailwind, pnpm, Node 22, `better-sqlite3`, Vitest, Playwright, `tsx` for CLIs. Dev and start on port 3220.

```
src/engine/            pure TypeScript, no IO
  types.ts             shared contract
  carddb.ts            in-memory card database
  rules/               deck validation per format
  mine/                card understanding (ported from Riftfoundry scoring.ts)
  network/             card-to-card interactions (ported from Riftfoundry scoring.ts)
  features/            roles, theme axes, legend profile, derived from mine + network
  maths/               hypergeometric, rune reliability, curve
  targets.ts           target bands per format, power target and archetype
  scoring/             per-card score
  rating/              deck rating and fixes
  wincons/             win-route detection
  builder/             auto-build, fill, swaps, improve, side deck, rune split
  lines/               keeps, turn plan, sequencing, matchup and side-deck notes
  text/                decklist, deck code and collection import/export
src/ingest/            sync CLIs
src/server/            SQLite repositories, analysis context
src/app/               UI and route handlers
sync-data/             reviewed data files committed to git (legality, errata, overrides)
data/                  SQLite, images, caches (gitignored)
```

## 6. Data

### 6.1 Sources and sync

`pnpm sync [step|all]`, each step resumable and idempotent. All requests are serial per host, with a generic `User-Agent: RiftboundForge/0.1` and no personal data.

| Step | Source | Notes |
|---|---|---|
| `cards` | Official gallery JSON (`legality-and-data.md §5`), 1,408 printings | Collapse printings to gameplay cards. Rules name: `name + ", " + subtitle` for champion units only; `name` alone for signature cards and starter legends (`rules.md §11`). Equipment effect text and Might bonus come from their own gallery fields. An empty type or domain list is missing data: the card is stored with `dataIncomplete` and excluded from building, never treated as domainless. |
| `errata` | `sync-data/errata.json` (reviewed, from `rulings-and-errata.md §1`) | Overlay by rules name. The gallery shows old text for most errata'd cards. |
| `legality` | `sync-data/legality.json` | Sets, per-format ban lists with zone, effective date and source URL. The step also fetches the Rules Hub and warns when its "last updated" date is newer than the file's. |
| `overrides` | `sync-data/card-overrides.json` | Champion-tag fixes (Karma, Channeler; Master Yi names), copy-limit text (Spiderling = unlimited), per-card trait corrections found in review. |
| `images` | Riot CDN URL from card data, `fm=webp` at native 744×1039 | `data/images/{cardId}.webp`. 6 parallel, resume, write to `.part` then rename. If `~/github_repositories/GameLab/data/images/{id}.png` exists the step may convert it locally instead of downloading. |
| `meta` | Piltover Archive deck lists (`meta-sources.md`) | Complete lists with legend, champion, battlefields, main, runes, side deck, date, event name where present. Serial, ≥1.5 s apart, cached, capped per run. Sites whose robots.txt forbids automated access (riftbound.gg, riftdecks) are not fetched. |
| `features` | computed locally | Traits, base rating, roles, axes, pair network, legend profiles, meta inclusion tables. Re-run after any other step. |

A banner appears when card or legality data is older than 14 days.

### 6.2 Tables

`cards` (id PK = gameplay id, name, json), `printings`, `card_features` (id PK, json), `card_edges` (a, b, net, json), `legend_profiles`, `meta_decks`, `meta_deck_cards`, `meta_legend_cards` (legend, card, zone, decks, share, avgCopies, era), `collection`, `decks`, `settings`, `sync_state`.

Meta rows carry a rules era (`rulings-and-errata.md §3`): lists from before the latest ban or set change are down-weighted, and lists containing a currently banned card are kept for inclusion statistics only after dropping the banned cards.

## 7. Rules engine (`src/engine/rules`)

`validateDeck(deck, db, legality) → Violation[]`, implementing `rules.md §12` check by check with the same codes and severities, and the 21 worked edge cases of `rules.md §13` as tests.

Points that are easy to get wrong:

- Main deck: at least 40 in `casual` and FFA; exactly 40 in `standard-*` and `2v2`. The Chosen Champion is one of the 40 and one of its 3 copies.
- Copy limit by rules name across main + side deck; Unique = 1; "any number of cards named" text lifts it.
- At most 3 Signature cards in total, each with the Legend's champion tag.
- Champion tag = the tag equal to a champion's short name, with the overrides file correcting known data errors. A shared tag such as Yordle never qualifies.
- Domain identity: every domain of a card must be in the Legend's; `colorless` is allowed anywhere.
- 12 runes inside the identity, any split. 3 battlefields with different names.
- Side deck 0–10 valid main-deck cards in `standard-bo3` and (optionally) `standard-bo1` and `2v2`; a warning elsewhere.
- Ban lists per format from `legality.json`; FFA uses the Standard list by default and the user can switch it off (no official FFA list exists).
- Neeko, Blending In: up to 3 extra, differently named legends.
- 2v2 with a teammate deck: different Legends, no shared battlefield name.

Items the research left unconfirmed (combined counting of Signature and Unique across main and side deck, and others in `rules.md §14`) follow the stricter reading and are marked "interpretation" in the violation message.

## 8. Card understanding (`src/engine/mine`, `src/engine/network`, `src/engine/features`)

This is the core of the product and reuses the owner's own work.

### 8.1 Card mine — ported

Source: Riftfoundry `apps/web/src/lib/scoring.ts` at `origin/main` 4b90179 (snapshot under `docs/research/analysis/riftfoundry/raw/`, local only). Ported with their tests: `deriveTraits`, `TRAIT_LABELS`, the effect-family registry, conditional value, cross-clause costs, directionality, ready/action economy, accumulated engines, compound point gates, equipment context, `baseCardRatingBreakdown`, `baseCardRating`, `foundationGradeForCard`, tier grades.

Changes made in the port, and only these:

- Inputs become plain data. The imports of `calibration.json`, `current-constructed-rules.json` and the meta module are replaced by parameters; no ban list or date stays in the code.
- The card shape is Riftfoundry's `ScoreCard`, produced by one adapter from the Forge `Card`.
- **Radiance and current rules.** Add the mechanics the registry predates, from `mechanics-glossary.md §1–§4`: Deploy, Disarm, Show Off, Backline, Empower/Empowered, Flow, Bomb tokens, and any other keyword or pattern found unrecognised when the mine is run over the full current pool. Errata text is what gets parsed.
- A coverage report is produced on every `features` run: cards with no traits, sentences no family matched. It is shown on the Data page and guarded by a test (§4).

Checks during the build: agreement of mined effects with the hand-scripted cards in `~/github_repositories/GameLab/packages/cards` for the cards that have scripts, and a hand audit of 60 cards including at least 20 Radiance cards.

### 8.2 Knowledge network — ported

Also from `scoring.ts`: `PACKAGE_PAIRS`, `ORPHAN_ENGINE_RULES`, `synergyAffinity`, `analyzeCardPair`, `analyzeCardTriple`, `CombinationReason` kinds and scopes, card score partners, `cardRuneReliability`, `earlyPackageReliability`.

Added on top:

- The pair network is computed once per sync for every pair of cards that can share a deck (same identity) and stored in `card_edges` with its reasons, so the UI can show a card's partners instantly and lines can walk it.
- Interactions the rules forbid are removed through `sync-data/card-overrides.json` (`rulings-and-errata.md §5`), each with its rule number.
- Edge reasons quote the two cards' relevant text.
- From `interactions.md`: the suppressor list for known false-positive patterns, and loop/engine detection (self-replay, refund loops, repeatable engines) as additional reason kinds where the ported analysis does not already cover them. That prototype measured 87.5% precision after suppressors but only 15% recall against published co-mentions, so it supplements the ported network rather than replacing it.

### 8.3 Derived features

Per card, stored: traits; base rating and grade; roles (`unit-body`, `removal`, `sweeper`, `combat-trick`, `protection`, `counter`, `card-flow`, `rune-ramp`, `mobility`, `token-maker`, `buff-source`, `recursion`, `disruption`, `finisher`, `point-source`, `gear`, `hate`); speed (action, reaction, normal); theme axes with enabler and payoff strength; energy, power by domain, might.

Per Legend, stored (`legend-profiles.md`): champion tag, legal Chosen Champions, signature cards, axis weights from its text, text-fit battlefields, and meta tables (core and flex cards, typical champion, rune split, battlefields) with a data-quality grade. Most legends have thin tournament data; the app says so and falls back to text-derived advice.

### 8.4 Everything else reused from decksofriftbound

The owner's `decksofriftbound` repo (Riftfoundry) already holds much of what this app needs. The rule for the build: **look there first, port with its tests, extend; write new code only where it has nothing or cannot meet a requirement here.** All of it lives in `apps/web/src/lib/` at `origin/main` 4b90179.

| Riftfoundry module | Used here for | How |
|---|---|---|
| `scoring.ts` (9,000 lines, ~50 test files) | card mine, knowledge network, `scoreDeck`, `evaluateCandidateFit`, `rankCandidateFits`, rune recommendation, curve targets | port and extend (§8.1, §8.2); `scoreDeck` and candidate fit become the base of §10, §11 and the swap proposals of §13 |
| `theory-decks.ts`, `theory-deck-fit.ts`, `theory-deck-fit-ranking.ts` | auto-builder: archetype profiles, role range targets, curve bands, card access odds, construction audit, strategy identity and packages, linked strategy lines, mulligan priorities | port as the base of §13 and §14; extend for formats, side deck, build-around locks; lines that repeat across decks are replaced by network-derived ones |
| `deck-guidelines.ts` | "what a good deck needs" checks | port; reconcile its bands with the measured ones in `deck-theory.md` |
| `deck-code.ts` | deck code import/export | port (wraps `@piltoverarchive/riftbound-deck-codes`) |
| `meta.ts`, `meta-presentation.ts`, `data/tournament/*.json` | meta calibration shape and tournament top-8 data | port the model; data is refreshed by the `meta` sync step |
| `sample-deck-generator.ts`, `sample-decks.ts`, `public-deck-analysis.ts` | reference decks for tests and the analysis presentation | port what the tests need |
| `config/current-constructed-rules.json` | shape of the legality file | superseded by `sync-data/legality.json` with current contents |

What Riftfoundry does not have and is new here: per-format rules for 2v2 and FFA, the 2026-10-09 rules and September bans, Radiance cards and mechanics, the errata overlay, side-deck construction, win-route detection, matchup and side-in/out lines, the stored pair network, local images and SQLite.

## 9. Formats and power target

Format changes legality (§7) and valuation. Mode facts come from `rules.md §10`: victory score 8, or 11 shared in 2v2; 2 battlefields on board in 1v1 and 3 otherwise; the final-point rule is harder with 3; "friendly" includes a teammate's objects in 2v2; one random battlefield of three is used outside Bo3. The multipliers applied to traits per mode (for example, effects that hit each enemy, hold-oriented cards, friendly-unit buffs) are heuristic and labelled so.

Riftbound has no official power brackets. The user picks **casual, focused or competitive**. It changes target bands (§10), how much the meta inclusion data weighs, and the minimum base grade the builder will fill with. A "plays like" estimate is shown next to it. All of this is heuristic and the UI says it.

## 10. Per-card score (`src/engine/scoring`)

`scoreCard(card, context) → { score, parts, reasons, partners, gate }`. In-deck cards are scored leave-one-out so in-deck and out-of-deck cards share a scale.

**Gates** (score 0, card shown greyed with the reason): outside the domain identity; banned in the format; over its copy limit; wrong zone; a fourth Signature card or one of another champion; incomplete card data.

| Part | Weight | What it measures |
|---|---|---|
| Quality | 25 | Ported base rating (mechanic contributions per cost), adjusted for format. |
| Synergy | 30 | Network edges into the current deck, the Legend and the Chosen Champion: saturating and capped, anti-synergy subtracted, axis match with the chosen themes and build-around cards. |
| Role need | 15 | How short the deck is on the card's roles against the target bands. |
| Curve and runes | 15 | Whether its cost bucket is under target and whether the rune split can pay its power cost on time (rune reliability). |
| Meta | 10 | Inclusion share and copies for this Legend in recent lists, shrunk when the sample is small. With thin data the weight moves to Quality and Synergy. |
| Format and power fit | 5 | Mode multipliers and distance from the power target. |

Every score keeps its parts, the partner cards and plain-English reasons. Rescoring the pool after a deck change must stay under 150 ms; deck-independent parts are cached.

## 11. Deck rating (`src/engine/rating`)

`rateDeck(deck, context) → { rating, legal, complete, subscores[], violations[] }`. Bands and formulas start from `deck-theory.md` Parts 2 and 6 (measured on 406 lists) and the ported `scoreDeck`.

| Sub-score | Weight |
|---|---|
| Card quality (mean base rating, weak-card tail) | 12 |
| Synergy density (network edges per card, enabler/payoff balance, orphan engines) | 16 |
| Curve (energy buckets against the archetype band, early plays) | 12 |
| Runes (split against power-cost demand, reliability of the costliest cards) | 12 |
| Roles (units, removal, card flow, tricks and reactions, protection) | 12 |
| Win conditions (routes, closer redundancy, clock; §12) | 12 |
| Consistency (copies of key cards, opening-hand odds, champion access) | 10 |
| Battlefields and side deck (fit with the plan, coverage of the meta) | 8 |
| Format and power fit | 6 |

Legality is a separate pass/fail chip; an illegal deck's rating is capped at 40. Incomplete decks scale targets by size and are labelled "so far". Each sub-score lists up to three fixes as concrete numbers ("2 short on Fury runes for Blazing Scorcher: have 5, need 7"), and clicking one filters the card browser.

## 12. Win conditions (`src/engine/wincons`)

From `wincons.md §2, §4` (verified): six scoring routes (wide, tall, hold, burst, points, attrition) plus hidden/ambush as a delivery axis and alternate-win battlefields. For a deck: ranked routes with the named closers and enablers, closer redundancy, probability of a closer by turn 5, an uncontested clock, final-point reach per format, and "folds to" with how common each answer is in the current meta.

The research found the win-condition sub-score does not track tournament placement. It is presented as a construction check, not a strength rating.

## 13. Builder (`src/engine/builder`)

Inputs: Legend, Chosen Champion, format, power target, theme weights, locked cards (the "build around" cards), options (owned only, seed).

1. Targets: bands for roles, curve and unit/spell/gear counts for the archetype the themes point to.
2. Seed: locked cards, the Chosen Champion, signature cards worth playing, and the strongest network packages around the Legend and the locks.
3. Fill greedily by score, rescoring as the deck grows; copies are chosen by need (3 for the plan's key cards, fewer for situational ones).
4. Runes: split from the deck's actual power-cost demand, checked with rune reliability.
5. Battlefields: three by registered frequency for the Legend where data exists and text fit otherwise; all three matter in Bo3, each is one third of a game elsewhere.
6. Side deck (formats that have one): answers to the most played opposing plans, by category bands from `matchups-and-lines.md §5`, never exceeding combined copy limits.
7. Repair any violation, then a bounded hill-climb on the rating.
8. Deterministic for a seed; "Reroll" changes it.

Guarantee: zero violations for the chosen format. Under 3 seconds.

**Improve**: repair first, then record each accepted swap as `{out, in, reason, ratingBefore, ratingAfter}` ordered by gain, at most 15, never cutting a locked card. **Fill the rest** and **Suggest swaps** as in Commander Forge.

## 14. Lines (`src/engine/lines`)

Deterministic, from `matchups-and-lines.md §2–§3` and the network. Every line names cards in the deck and carries its reason; identical boilerplate is filtered out.

- **Keeps**: named keep sets for this deck with hypergeometric odds (draw 4, mulligan up to 2), on the play and on the draw.
- **Turn plan**: turns 1–6 from the real curve and rune count per seat, with the probability of having each play.
- **Sequencing**: named pairs in order ("A before B") from network edges and rule-backed detectors.
- **Packages**: complete in the deck, and one card away with the missing card.
- **Power spikes**: the turn the champion, an engine or a closer comes online.
- **Matchup** (optional opposing Legend): which of their typical cards (meta inclusion) your cards answer, what to play around, and side-in/side-out by named card.
- **Format notes**: what changes in 2v2 and FFA for this deck.

No usable win-rate matrix exists (`matchups-and-lines.md §4`); the matchup estimate is computed from deck properties and labelled heuristic.

## 15. Screens

Desktop. Dark, card-art-forward, dense but calm.

- **Data**: sync status and buttons per step, image progress, legality snapshot with sources, mine coverage report.
- **Decks**: saved decks as Legend-art tiles with format, rating and count. New, duplicate, delete, import.
- **New deck**: Legend grid with domain filters → Chosen Champion → format and power target → themes and build-around cards → Auto-build / Start empty / Import.
- **Builder**: header (Legend and champion images, format, power target, counts 40/12/3/side, rating gauge, legality chip); card browser (image grid, score badges, search, filters for type, role, axis, domain, cost, owned; gated cards greyed with the reason); deck (main, runes, battlefields, side deck as image grids, lock and remove, weakest marked); panels: Rating, Win conditions, Network (partners, packages, one card away), Lines, Matchup, Themes, Improve. Card overlay: full image, score parts, partners with reasons, mined traits, current text when errata'd.
- **Import / export**: text lists and deck codes.
- **Collection**: paste or CSV.

## 16. Testing and done

- Engine unit tests on a committed fixture of real cards, including every card named in `rules.md §13`, the ported Riftfoundry tests, the coverage guard, scoring monotonicity, and rating on reference lists.
- Auto-build property test: 20 Legends (including Radiance ones) × 6 formats → zero violations.
- Lines test: decks of three different Legends share almost no lines; every line names a card in its deck.
- Playwright: pick a Legend, auto-build, see the images, rating and a legal chip; remove a card and see numbers change; improve an imported list and accept a swap.
- Final review by driving the real UI and looking at screenshots.

Done means: sync completes with images on disk; the owner can pick a Legend, auto-build for a format, edit by hand with live scores, read the rating with reasons, the win routes and lines, and export, with the network unplugged after sync.

## 17. Builder's calls the owner can overrule

Project name; port 3220; WebP at native resolution; scoring and rating weights; role and axis lists; FFA using the Standard ban list by default; stricter reading of unconfirmed rules; not fetching sites that forbid it; Sealed/Draft left out; porting Riftfoundry's mine and network rather than rebuilding them from the research prototypes.
