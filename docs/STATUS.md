# Build status and how to resume

This file is the single place a new session reads to continue the build if the previous one was cut off. Update it at every stage boundary, in the same commit as the stage's work.

Last updated: 2026-11-11, during Stage 0.

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
- Quality over cost. Stages run as separate workflows, with a commit and push at every stage boundary.

## Stages

| # | Stage | State |
|---|---|---|
| 0 | Research with independent fact-checking | **in progress** |
| 1 | Design doc (`docs/superpowers/specs/`) and implementation plan with shared types contract (`docs/superpowers/plans/`) | not started |
| 2 | Foundation and data: scaffold, sync (cards incl. Radiance, images, legality, meta), fixtures | not started |
| 3 | Engine: rules, mechanics parser, features, interaction graph, scoring, rating, builder, lines; adversarial reviewer after each part | not started |
| 4 | API and UI | not started |
| 5 | End-to-end tests | not started |
| 6 | Final review by driving the real UI and looking at screenshots | not started |

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
