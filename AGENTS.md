# AGENTS.md

Guidance for coding agents (and people) working in this repository.

## What this is

Riftbound Forge is a local, single-user deck builder and theorycrafting tool for the Riftbound TCG. One Next.js process on localhost, SQLite on disk, card images on disk. No AI or LLM calls at runtime: every output is computed from card data, rules and synced meta data, and is shown with its reasons.

The project is in early development. Check the roadmap in `README.md` and the documents under `docs/superpowers/` for what exists; do not assume a directory below is populated yet.

## Layout

| Path | Contents | Rule |
|---|---|---|
| `src/engine/` | Pure TypeScript: rules, features, interactions, scoring, rating, builder, lines | No imports from Node, Next, React or `src/server`. Takes a `CardDb` and plain data. |
| `src/engine/types.ts` | The shared type contract | Do not rename or reshape. Add a field here first and say so in the commit. |
| `src/ingest/` | Sync CLIs (cards, images, legality, meta) | Resumable and idempotent. |
| `src/server/` | SQLite repositories, route handlers | |
| `src/app/` | UI | Every card is shown as an image. |
| `docs/research/` | Verified research | The spec for game facts. |
| `docs/superpowers/specs`, `plans` | Design and implementation plan | Read the section a task names before starting it. |
| `tests/` | Vitest (engine, server), Playwright (e2e), fixtures | |
| `data/` | SQLite file, images, caches | Gitignored. Never commit. |

## Hard rules

1. **Never state a game fact from memory.** Deck sizes, copy limits, domain identity, bans, set legality, scoring: take them from `docs/research/` (which cites the official rules) or from synced data. If the research is silent, look it up in a primary source and add it there with the source.
2. **Lists live in synced data, not code.** Ban list, set legality and per-card copy limits must not be hardcoded. A hardcode needs a comment saying why data cannot express it.
3. **A deck the app calls legal must be legal.** Rules changes need a test per rule.
4. **No score without reasons.** Every score, rating and suggestion carries human-readable reasons naming the cards involved.
5. **Label heuristics.** Anything not derived from an official rule or measured data is marked heuristic in code comments and in the UI.
6. **Theorycraft output must be deck-specific.** Lines, win routes and matchup notes name the cards in the deck. Generic advice that would read the same for any deck is a bug.
7. **No card images or card data in git.** They belong to Riot Games and are downloaded by the sync step.
8. **No personal information** in any outgoing request header, URL or payload. Use a generic `User-Agent`. Requests to community sites are serial and slow.

## Commands

These are the intended scripts; they appear as the foundation stage lands.

```bash
pnpm install
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest run
pnpm e2e              # playwright test
pnpm sync [step|all]  # cards, images, legality, meta, features
pnpm dev              # localhost
```

A task is finished when `pnpm typecheck && pnpm test` pass.

## Commits

- One task per commit, staging only that task's paths.
- Conventional prefixes: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, with a scope where it helps (`feat(engine): ...`).
- If a change alters the type contract or a rule, say so in the message.

## Legal

This is a fan project, not endorsed by Riot Games. Keep the disclaimer in `README.md` intact.
