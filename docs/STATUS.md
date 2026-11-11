# Build status and how to resume

This file is the single place a new session reads to continue the build if the previous one was cut off. Update it at every stage boundary, in the same commit as the stage's work.

Last updated: 2026-11-12. Stage 2 (plan Tasks 1-2) done; the build continues at plan Task 3.

## Owner's decisions (do not re-ask)

- Standalone public MIT repo; local, single-user app; English UI; every card shown as an HD image stored on disk.
- No AI at runtime. Rule- and data-based scoring with visible reasons.
- Formats: 1v1 (Bo1, Bo3), 2v2, FFA. Deck rules enforced exactly, from primary sources, lists in synced data.
- Features: auto-build from a Legend, hand-building with live updates, per-card 0–100 score, deck 0–100 rating with sub-scores and fixes, paste-a-list swap proposals with accept/reject, optional collection with owned-only mode.
- Theorycrafting is a main feature: deck-specific lines (not generic templates), win conditions, card interactions and packages, matchup play, side deck and rune split advice following the current meta. "Like Commander Forge" (`~/github_repositories/commander-forge`) in architecture and feature set.
- Card mechanics must be understood correctly; this is critical.
- Power target casual / focused / competitive replaces brackets; say plainly what is heuristic.
- Scraping community sites (Piltover Archive and similar) is allowed and stays in the repo as a normal sync step.
- Research files are pushed as written (local paths not scrubbed). Raw downloads stay local (`docs/research/**/raw/` is gitignored).
- GitHub repo is `Egecan33/riftbound-deck-builder` (renamed 2026-11-12 for discoverability; product name Riftbound Forge, local folder still `riftbound-forge`). Ship downloadable executables for macOS and Windows (plan Task 13).
- Reuse the owner's Riftfoundry code (`decksofriftbound`): its card mine and knowledge network in `scoring.ts`, theory-deck generator and more (spec section 8.4). Look there first, port with tests, extend.
- Understanding and evaluating cards correctly is the priority.
- Keep token use modest, the way Commander Forge was built: small staged workflows, no extra research rounds.
- Quality over cost was said earlier; the later instruction to spend less wins where they conflict. Stages run as separate workflows, with a commit and push at every stage boundary.

## Stages

| # | Stage | State |
|---|---|---|
| 0 | Research with independent fact-checking | done; 5 of 11 files verified, the rest are tested against real cards during the build (owner asked to stop spending on research) |
| 1 | Design doc `docs/superpowers/specs/2026-11-12-riftbound-forge-design.md` and plan `docs/superpowers/plans/2026-11-12-riftbound-forge.md` | done |
| 2 | Foundation and data: plan Tasks 1-2 | done and reviewed 2026-11-12. Synced: 1,408 gallery printings → 1,091 gameplay cards + 9 tokens (unit 546, spell 271, gear 130, battlefield 74, legend 58, rune 6, untyped Radiance 6); 177 champion units, 60 signature cards; 8 Radiance rows `dataIncomplete`; 70 errata applied; 13 bans (12 Standard + 1 2v2 legend), 6 sets, side deck 10; 300 of 1,100 images on disk (the rest: `pnpm sync images`); meta 508 lists, 498 usable Standard lists, 58 legends (1 ok, 12 thin, 45 insufficient) |
| 3 | Engine: plan Tasks 3-9, adversarial reviewer after each part | not started |
| 4 | API and UI: plan Tasks 10-11 | not started |
| 5 | End-to-end tests: plan Task 12 | not started |
| 6 | Final review by driving the real UI and looking at screenshots | not started |
| 7 | Desktop downloads for macOS and Windows: plan Task 13 | not started |

## Stage 0 detail

Eleven research files are expected in `docs/research/`. A file is finished only when it ends with a `## Verification log (2026-11-11)` section written by the second agent.

| File | Topic |
|---|---|
| `rules.md` | deck construction per format, 34 validator checks |
| `legality-and-data.md` | ban lists, set legality, card and image sources |
| `meta-sources.md` | tournament and meta data sources, scraping recipes |
| `deck-theory.md` | what a good deck needs, target bands, consistency maths |
| `interactions.md` | card-interaction graph (the stand-in for a combo database) |
| `wincons.md` | win routes and their detection |
| `legend-profiles.md` | a profile per Legend |
| `matchups-and-lines.md` | line generator, matchup and side-deck logic |
| `mechanics-glossary.md` | every keyword and system with rule numbers |
| `card-text-parser.md` | measured card-text parser and derived roles |
| `rulings-and-errata.md` | errata and rulings as synced data |

To see what is finished:

```bash
grep -L "Verification log" docs/research/*.md
```

To resume Stage 0 in a new session: for each expected file that is missing or has no verification log, run one researcher (if missing) and then one independent fact-checker on it. The prompts used are summarised by the topic column above; `rules.md` section 0 lists the current primary sources.

## Known facts that changed the plan

- Local card data in GameLab (931 cards, September 2026) has no Radiance (RAD, released 2026-10-23). Sync must read the official gallery.
- Core Rules and Tournament Rules have a 2026-10-09 edition; rule numbers moved.
- Ban list last updated 2026-09-18; 2v2 has its own list; FFA has none (use Standard, switchable).
- Side deck maximum is 10.
- The official gallery's Radiance rows were unfinished on 2026-11-12: 13 with no card type, 23 whose type contradicts the row's own image text, 11 with no domain, and 14 more with a wrong domain that looks complete. The `cards` sync flags all of them `dataIncomplete` by itself (type checks, plus a collector-number domain-block check). `sync-data/card-overrides.json` repairs the 42 that a second source confirms; 8 stay incomplete (RAD-039, 069, 072, 102, 104, 111, 120, 131). Remove an override once the gallery row is fixed.
- The gallery repeats an Equipment's Might bonus in `might`; `Card.might` is null for gear and the bonus is in `mightBonus`. An Equipment's attached-effect text is appended to `Card.text` as lines starting with `Effect: `.
- `Card.text` symbols: `[Might]`, `[Exhaust]`, `[Any]`, `[Fury]`...`[Order]`, `[N]`. The Riftfoundry mine expects `[S]`, `[T]`, `[A]`, `[C]`; `src/engine/mine/adapter.ts` (Task 4) converts.
- Meta after the first sync: 508 Piltover Archive lists (500 complete: 498 Standard, 2 2v2 that are stored but not aggregated), 58 legends, but only 1 legend graded `ok` and 12 `thin`; the rest are `insufficient` until more `pnpm sync meta` runs (150 requests each) add lists.
- A public list is counted only if it is a deck: all cards resolved, 40+ main, 12 runes, 3 battlefields, every main, side and rune card inside the legend's Domain Identity, and a Chosen Champion of that legend (in the champion slot, or at least in the main deck). The stage 2 review found a six-domain pile and a Kha'Zix list with a Rengar champion being counted; the reason a list is left out is stored in `meta_decks.unresolved`.
- Buff and XP Tracker are typeless token markers (`type` null), not unfinished rows: `dataIncomplete` is set on the 8 Radiance rows only.
- Neeko, Blending In (RAD-167) has no domain but a Power cost of 1; `powerDomains` is empty for her. The Boss (OGN-269) keeps `[C]` in its errata text because the article does not say which of the legend's two runes is meant. Engine tasks must handle both.

## Data on disk (gitignored, rebuild with `pnpm sync`)

`pnpm sync cards errata legality meta` then `pnpm sync images` (`--limit N` for a part) and, to refresh the committed test fixture, `pnpm sync fixtures`. `pnpm sync meta --max 0` re-aggregates from the caches without any request.

## Resume

To continue: read the plan, run `git log --oneline | head -20` to see which task commits exist, and start at the first task without one. Each plan task ends in exactly one `feat`/`fix` commit naming the task.
