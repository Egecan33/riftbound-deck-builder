# Card-text understanding layer: parser prototype, measured over the whole pool (2026-11-11)

Scope: a deterministic (no AI, no network) parser that turns the rules text of every Riftbound card into a structured list of abilities, measured on the complete current pool, plus the derived per-card features the scorer needs. This file is the mechanics ground truth for the other research files in this folder.

Labels: **FACT** = stated by a primary source (rule number from the Core Rules edition 2026-10-09, or a card code whose text is in the gallery snapshot). **DATA** = measured; dataset and n named. **HEURISTIC** = our own definition or judgement. **UNCONFIRMED** = not verified.

## 0. Sources and files

| ID | Source | Date |
|---|---|---|
| GAL | Official card gallery, https://playriftbound.com/en-us/card-gallery/ (embedded JSON, 1408 printings). Cached: `analysis/raw/gallery-2026-11-11.html` | fetched 2026-11-11 |
| CR | Core Rules PDF, "Last Updated: 2026-10-09" (URL in rules.md section 0). Cached text: `analysis/raw/core-rules-2026-10-09.compact.txt` | fetched 2026-11-11 |
| ERR-RAD | Radiance Errata Updates, https://playriftbound.com/en-us/news/announcements/radiance-errata-updates/ (published 2026-10-09) | fetched 2026-11-11 (see rules.md) |
| GL | GameLab engine scripts, local, read-only: `~/github_repositories/GameLab/packages/engine` `buildLibrary()` dumped to `analysis/card-text-parser/raw/engine-scripts.json`; card ids and texts from `~/github_repositories/GameLab/data/cards/cards.json` (931 cards, built 2026-09-06, no Radiance) | dumped 2026-11-11 |

No web request was made for this file; everything was reused from the cached downloads listed in rules.md.

Everything lives in `docs/research/analysis/card-text-parser/`:

| File | Purpose |
|---|---|
| `build-pool.mjs` | gallery HTML -> `out/pool.json`, one row per distinct rules name |
| `schema.d.ts` | TypeScript types of the structured representation |
| `parser.mjs` | the parser (1052 lines, plain Node ESM, no dependencies) |
| `run.mjs` | parses the pool -> `out/parsed.json`, `out/coverage.json`, `out/unparsed.txt` |
| `compare-engine.mjs` | accuracy check (a) against GameLab scripts -> `out/engine-compare.json` |
| `audit-sample.mjs` | seeded 60-card sample for accuracy check (b) -> `out/audit-sample.json`, `out/audit-sample.txt` |
| `features.mjs` | derived features and roles -> `out/features.json`, `out/role-counts.json`, `out/role-samples.txt` |
| `build-overrides.mjs` | -> `overrides.proposed.json` (the data file proposal of section 9) |
| `show.mjs` | one-line-per-ability rendering used for the hand audits (`node show.mjs RAD-150`) |

Reproduce: `node build-pool.mjs && node run.mjs && node compare-engine.mjs && node features.mjs --sample && node build-overrides.mjs`. `compare-engine.mjs` needs the local GameLab checkout.

## 1. The pool

- **DATA (GAL, 1408 printings):** 1103 distinct rules names. Minus 6 basic runes (no text) and 2 play aids ("Buff", "XP Tracker", UNL-T04 / UNL-T08) = **1095 gameplay cards**: 557 units, 271 spells, 133 gear, 58 legends, 76 battlefields. 10 of them are tokens with a gallery row. 953 are deckable (unit / spell / gear, not a token).
- **DATA:** by set of first printing: OGN 298, OGS 24, SFD 222, UNL 225, VEN 167, RAD 167 (before removing runes and play aids). 172 gameplay cards have a RAD printing.
- **FACT (rules.md section 11):** the rules name of a champion unit is `name + ", " + subtitle`; rows are grouped on that.
- **DATA defect, gallery `cardType` on Radiance:** on 36 RAD rows the `cardType` field is empty or plainly wrong (for example RAD-059 Supernova, "Deal 10 to a unit. Draw 2.", is typed `unit`). `build-pool.mjs` resolves the type from, in order: structure ([Equip] / [Deploy] / [Quick-Draw] line => gear), the type word in the image alt text ("Riftbound Spell: ..."), the `cardType` field. All 36 are listed in `overrides.proposed.json` under `dataFixes.type`. **UNCONFIRMED:** the alt text is the only evidence for the type of rows with no Might and no gear keyword.
- **DATA defect, missing domain:** 11 RAD deckable rows have no domain in the gallery (RAD-006, RAD-009, RAD-022, RAD-026, RAD-041, RAD-047, RAD-049, RAD-104, RAD-121, RAD-123, RAD-134). **UNCONFIRMED:** their domains; the parser does not need them, the deck validator does.
- **Text fixes applied before parsing (8 cards, table `TEXT_FIXES` in `parser.mjs`):** one erratum, RAD-167 Neeko, Blending In ("choose up to 3 different legends", ERR-RAD; the gallery still shows the printed "choose 3"), and seven obvious data defects: keyword printed without brackets (SFD-096, SFD-138, RAD-071, VEN-073), stray characters (RAD-127), a Might value rendered as an Energy icon (VEN-109), an en dash for a minus (RAD-048).
- Reminder text (parentheses) is stripped before parsing. **FACT:** keyword meaning comes from CR 805-832, not from the reminder text.
- Equipment has a second text field, the Effect Text. **FACT (CR 136.2.b, 136.2.c):** it is inactive unless the card is attached, and its abilities are appended to the rules text of the card it is attached to. The parser parses it separately and marks those abilities `origin: 'equipment-effect'`.

## 2. Structured representation

Full types in `schema.d.ts`. One `ParsedCard` per rules name:

```ts
ParsedCard { code, name, type, superTypes, domains, energy, power, might, mightBonus?, tags, sets, codes,
             speed,                 // card-level play speed: normal | action | reaction
             keywords[],            // { name, value?, cost?, conditional?, grantedToWearer? }
             abilities[],           // see below
             parse { status, sentences[{ text, status }] },
             textUsed, textSource } // gallery | errata | fix

Ability { kind:   keyword | static | triggered | activated | on-play | replacement
          keyword?  { name, value }                 // CR 805-832
          trigger?  { event, events[], frequency, scope: self|here|any, subject: friendly|enemy }
          cost?     { energy, power{fury,calm,mind,body,chaos,order,any}, exhaust, other[], variable, alternatives[] }
          speed     normal | action | reaction
          conditions[] { type, value, negate }      // gates: legion, level N, empowered, "while ...", "if ..."
          effects[]
          staticType?                               // might-mod, keyword-grant, cost-mod, additional-cost, enter-ready, restriction, ...
          origin    rules | equipment-effect
          status    full | partial | none }

Effect  { verb, target?, amount?, duration?: turn|combat|..., optional?, cost?, conditions?, perEach?, instead?, delayed?,
          actor?: you | each-player | each-opponent | chosen-player | controller | owner,
          keywords?, token?{ name, type, might, count, ready, exhausted, where }, resources?, from?, to?, free?,
          options?[][] /* choose one */, granted? /* quoted ability */, split?, minimum? }

Target  { ref?: self|prev|chosen|player, count: n | all | any-number | {upTo:n} | x, other?, controller: friendly|enemy|any,
          types[], tags[], states[], location: here|there|battlefield|base|trash|hand|..., filters[{key,op,value}] }
```

**DATA (out/parsed.json, n = 1095 cards):** 1831 abilities: 578 keyword, 531 triggered, 308 static, 287 on-play (spell effects), 114 activated, 13 replacement. 72 effect verbs are in use; the most frequent are might 185, draw 140, createToken 103, deal 102, grantKeyword 88, choose 82, move 63, costChange 62, ready 59, kill 53, play 49, look 46, buff 41, restrict 40, returnToHand 38, enterReady 37, recycle 36, channel 32, add 31, banish 27, stun 26, discard 22. 78 distinct trigger events; the top ones are when-played 168, when-i-attack 39, when-i-move 37, when-i-die 31 (Deathknell, CR 808), when-i-conquer 29, when-you-conquer 26, when-i-hold 24, when-you-hold 22, when-a-unit-dies 16, when-you-play-card 15, when-i-defend 14, start-of-turn 13, when-you-play-unit 13. 28 keywords are recognised, all of CR 805-832.

How the parser works, in order:

1. Split the text into lines, strip reminder text, split lines into sentences (quoted granted abilities are masked first).
2. A line that starts with a bracketed keyword is a keyword ability; `[Action]` / `[Reaction]` set speed (CR 806, 813); `[Equip]`, `[Empower]`, `[Repeat]`, `[Flow]`, `[Accelerate]` carry a cost (CR 818, 827, 820, 829, 805); `[Legion]`, `[Level N]`, `[Empowered]` followed by the `[>]` glyph gate the rest of the line as a condition (CR 812, 824, 828); `[Deathknell]` becomes a when-i-die trigger (CR 808).
3. `cost: effect` is an activated ability; the cost side is parsed by a cost grammar (resource icons, exhaust, discard N, kill me / a friendly unit, spend buff / XP, recycle from trash, disempower).
4. `When / Whenever / At the start of / The first time ...` is a triggered ability; `If ... would ..., ... instead` is a replacement.
5. On a spell, remaining sentences are on-play effects. On a permanent, a remaining sentence must match a static pattern (Might modifier, keyword grant, cost modifier, additional cost, enters ready, restriction, permission); an effect sentence with no trigger on a permanent is marked partial instead of being guessed.
6. Each effect clause is matched by verb-specific patterns; noun phrases go through one shared target grammar.

A sentence is **full** when every clause, target and condition in it matched; **partial** when some did; **none** when nothing did. A card is full only if all its sentences are.

## 3. Coverage

**DATA (GAL snapshot 2026-11-11; n = 1095 gameplay cards, 2113 ability sentences after removing reminder text):**

| slice | cards | full | partial | unparsed | sentences | full | partial | unparsed |
|---|---|---|---|---|---|---|---|---|
| **all** | 1095 | 1070 (97.7%) | 23 (2.1%) | 2 (0.2%) | 2113 | 2083 (98.6%) | 19 (0.9%) | 11 (0.5%) |
| set OGN | 292 | 284 (97.3%) | 7 (2.4%) | 1 (0.3%) | 497 | 488 (98.2%) | 4 (0.8%) | 5 (1.0%) |
| set OGS | 24 | 24 (100.0%) | 0 (0.0%) | 0 (0.0%) | 37 | 37 (100.0%) | 0 (0.0%) | 0 (0.0%) |
| set SFD | 235 | 232 (98.7%) | 3 (1.3%) | 0 (0.0%) | 451 | 448 (99.3%) | 2 (0.4%) | 1 (0.2%) |
| set UNL | 231 | 230 (99.6%) | 1 (0.4%) | 0 (0.0%) | 475 | 474 (99.8%) | 1 (0.2%) | 0 (0.0%) |
| set VEN | 183 | 175 (95.6%) | 8 (4.4%) | 0 (0.0%) | 375 | 365 (97.3%) | 7 (1.9%) | 3 (0.8%) |
| set RAD | 172 | 167 (97.1%) | 4 (2.3%) | 1 (0.6%) | 346 | 339 (98.0%) | 5 (1.4%) | 2 (0.6%) |
| unit | 557 | 550 (98.7%) | 6 (1.1%) | 1 (0.2%) | 970 | 962 (99.2%) | 5 (0.5%) | 3 (0.3%) |
| spell | 271 | 266 (98.2%) | 5 (1.8%) | 0 (0.0%) | 696 | 691 (99.3%) | 3 (0.4%) | 2 (0.3%) |
| gear | 133 | 128 (96.2%) | 5 (3.8%) | 0 (0.0%) | 267 | 260 (97.4%) | 5 (1.9%) | 2 (0.7%) |
| legend | 58 | 54 (93.1%) | 4 (6.9%) | 0 (0.0%) | 93 | 88 (94.6%) | 3 (3.2%) | 2 (2.2%) |
| battlefield | 76 | 72 (94.7%) | 3 (3.9%) | 1 (1.3%) | 87 | 82 (94.3%) | 3 (3.4%) | 2 (2.3%) |

Card level: **97.7% fully parsed, 2.1% partially, 0.2% unparsed.** Sentence level: **98.6% full, 0.9% partial, 0.5% unparsed.** Radiance, which no earlier local tool had seen, parses at 97.1% of cards, the same level as the older sets. Legends (93.1%) and battlefields (94.7%) are the weakest types: few cards, each with a one-off rule.

"Full" means the grammar consumed the sentence. It does not mean the reading is right: sections 5 and 6 measure that.

## 4. Unparsed and partially parsed sentence patterns

**DATA:** 30 sentences on 25 cards are not full. After normalising numbers and costs they form **30 distinct shapes, each occurring exactly once**, so there is no frequency ranking left to exploit: every remaining pattern is a single card.

| # | status | sentence shape (numbers -> N, costs -> [C]) | card |
|---|---|---|---|
| 1 | partial | [Empower] costs of your units here cost [C] or [C] less. | VEN-163 |
| 2 | none | Any player may pay [C] as an additional cost to play a Dragon. | VEN-157 |
| 3 | partial | Banish that many units you control, then for each, its owner plays that unit back to the same location or to their base, ignoring its cost. | RAD-140 |
| 4 | partial | Choose a friendly unit that's in combat with an enemy Fury unit or that's being chosen by an enemy Fury spell. | VEN-040 |
| 5 | partial | choose another friendly unit. | VEN-137 |
| 6 | partial | choose one of those legends and add it to your Legend Zone while I'm on the board. | RAD-167 |
| 7 | none | copy that unit's text to this Equipment's effect text for as long as this is attached to it. | SFD-059 |
| 8 | partial | During showdowns here, cards with [Reaction] cost [C] more to play. | VEN-160 |
| 9 | none | Each player chooses N units, N gear, N runes, and N cards in their hands. | OGN-244 |
| 10 | none | Each player looks at the top N cards of their Main Deck, chooses one, then recycles the rest. | OGN-115 |
| 11 | partial | Friendly buffed units have [Deflect] if they didn't already. | OGN-063 |
| 12 | partial | If a combat where you are the attacker ends in a tie, recall ALL units instead. | OGN-227 |
| 13 | partial | If a spell or ability that chooses me would stun me, give me -[Might], or return me to hand, give me ±N [Might] instead. | VEN-086 |
| 14 | none | If a spell or ability you control would give -[Might] to a unit it chooses, it gives an additional ±N [Might]. | VEN-069 |
| 15 | partial | If another unit you control here would die, if it has less Might than me, instead heal it, exhaust it, and recall it. | SFD-173 |
| 16 | partial | If it's your turn, move a friendly unit in a showdown to base and if I'm [Empowered], ready it. | VEN-139 |
| 17 | partial | If Neeko is in your deck, choose up to N different legends in addition to your starting legend. | RAD-167 |
| 18 | partial | If they do, they play it to this battlefield. | VEN-157 |
| 19 | none | It becomes a unit gear with Might equal to its Energy cost until you choose another gear with me. | RAD-145 |
| 20 | partial | Kill a friendly unit. | OGN-242 |
| 21 | partial | Move any number of enemy units with the same controller and a total Might of N or less to a single location. | UNL-054 |
| 22 | none | Once each turn, while I'm at a battlefield, you may pay [C] less to play a gear. | RAD-068 |
| 23 | none | Put a Teemo unit you own into your hand from your Champion Zone or the board. | OGN-263 |
| 24 | none | The equipped unit becomes a copy of that unit for as long as this is attached to it. | VEN-137 |
| 25 | partial | While I'm in combat, friendly spells cost [C] less to a minimum of [C], and enemy spells cost [C] more. | SFD-146 |
| 26 | partial | You may banish a unit from among them that has Might up to N more than the killed unit and play it, ignoring its cost. | OGN-242 |
| 27 | partial | you may exhaust me and N friendly units to reduce the cost of that spell by [C]. | RAD-151 |
| 28 | partial | you may pay [C] to choose a friendly gear. | RAD-145 |
| 29 | none | you may play a spell from your trash with Energy cost less than your points without paying its Energy cost. | OGN-112 |
| 30 | none | you may return your Chosen Champion from your trash to your Champion Zone if it is empty. | OGN-281 |

Grouped by cause (**HEURISTIC** grouping, n = 30): cost modifiers with unusual scope or wording (7: VEN-163, VEN-160, SFD-146, RAD-068, RAD-151, VEN-157 twice), copy / type-changing effects (4: SFD-059, VEN-137 twice, RAD-145), replacement effects with compound conditions (4: OGN-227, VEN-086, VEN-069, SFD-173), symmetric "each player" procedures (2: OGN-244, OGN-115), champion-zone and legend-zone moves (4: OGN-263, OGN-281, RAD-167 twice), targets with a relational filter (5: OGN-242 twice, UNL-054, VEN-040, OGN-112), nested conditionals and variable counts (4: VEN-139, RAD-140, RAD-145, OGN-063).

## 5. Where it plateaus

- **DATA:** the previous iteration is kept in `out/_parsed.prev.json`. Between it and the final run 20 cards changed their parse (target quantifiers on cost modifiers), and card coverage moved from 1071 / 22 / 2 (full / partial / none) to 1070 / 23 / 2: the last grammar iteration bought **zero** coverage.
- **DATA:** the 30 remaining shapes each cover one sentence, so one more grammar rule buys at most 1 card (0.09 points of card coverage). 5 of the 25 cards are dynamic by nature (their text refers to the text of other cards) and cannot be captured by any amount of grammar.
- **DATA:** accuracy shows the same picture. In check (a) the confirmed parser errors are 13 of 604 hand-scripted cards, 9 of which the parser already flags itself; in check (b) the silent errors are 3 of 60, each a different one-off.
- Conclusion (**HEURISTIC**): the grammar is at its plateau at about 97.7% of cards / 98.6% of sentences. The remaining 2 to 3% is cheaper and safer as a hand-written override file (section 9, 41 cards) than as more grammar. Earlier iterations were not snapshotted, so the path to the plateau cannot be plotted; only the last step is measured. **UNCONFIRMED:** how the parser holds up on a future set. Radiance is the only evidence: it was parsed with the same grammar family and lands at 97.1%, but the grammar was tuned with Radiance text in view, so this is not a blind test.

## 6. Accuracy

### 6a. Against the GameLab engine scripts

Ground truth: `buildLibrary()` of the GameLab engine gives a script for 931 card ids; 925 match a pool card (6 ids unmatched, generated tokens excluded). 604 scripts are **hand-written** (`source: manual`), 285 come from GameLab's own text compiler (`compiled`; not independent evidence, reported separately), 36 are vanilla. For 21 matched cards the GameLab text differs from the gallery text.

The two structures are different, so the comparison is on six facets that can be extracted from both: the set of effect verbs, the numbers attached to them (deal N, draw N, +N Might, tokens, channel, discard, burn, XP, score), the set of trigger events (mapped to one vocabulary), the keyword list, the number of activated abilities, and the play speed.

**DATA (n per row; agreement = both sides give identical sets):**

| scripts | n | all six facets | verbs | numbers | triggers | keywords | activated count | speed |
|---|---|---|---|---|---|---|---|---|
| hand-written | 604 | 502 (83.1%) | 91.1% | 96.7% | 95.9% | 96.7% | 99.8% | 99.2% |
| hand-written, same text in both sources | 584 | 487 (83.4%) | 91.1% | 96.6% | 95.9% | 96.9% | 99.8% | 99.1% |
| text-compiled | 285 | 258 (90.5%) | 91.6% | 94.7% | 95.4% | 98.6% | 100% | 99.3% |
| vanilla | 36 | 36 (100%) | 100% | 100% | 100% | 100% | 100% | 100% |
| all | 925 | 796 (86.1%) | 91.6% | 96.2% | 95.9% | 97.4% | 99.9% | 99.2% |

Every one of the 129 disagreeing cards was read by hand and put in a class (table `ADJ` in `compare-engine.mjs`; a second pass on 8 rows moved one card, SFD-039, from "representation" to "parser error"). **DATA, hand-written scripts, 102 disagreeing cards:**

| class | n | what it is | whose error |
|---|---|---|---|
| repr: other | 18 | same behaviour, different decomposition (e.g. OGN-053 "Buffs give an additional +1 Might" is a static Might modifier in the parse and a buff rule flag in the script) | none |
| repr: keyword / speed level | 13 | gate keywords ([Legion], [Empowered], [Deathknell]) or [Action] / [Reaction] recorded on the ability in one structure and on the card in the other | none |
| repr: scaling amount | 11 | "draw 1 for each ..." is amount 1 + `perEach` in the parse, a computed number in the script | none |
| repr: look / reveal | 11 | reveal-then-play / recycle sequences: the parse lists look + play + recycle, the script has one composite op | none |
| repr: delayed or granted | 11 | "when it wins a combat this turn ..." is a separate triggered ability in the parse, a delayed effect inside the spell in the script | none |
| **parser-flagged** | 9 | the parser itself marks the card partial / none (OGN-112, OGN-242, OGN-263, SFD-059, SFD-173, VEN-137, VEN-139, VEN-157, VEN-163) | parser, known |
| engine-extra | 7 | the script does more than the text says ("recall it exhausted" scripted as heal + exhaust + recall; OGN-027, OGN-077, OGN-117, OGN-269, OGS-020, SFD-147, UNL-023) | neither |
| repr: additional cost | 7 | "you may discard 1 as an additional cost; if you do, reduce my cost" is an additional-cost ability + costChange in the parse | none |
| repr: cost as effect | 5 | "kill me to ..." is a cost in the parse and an effect op in the script | none |
| **parser-lossy** | 4 | parse marked full but incomplete: VEN-044 (first card each turn), SFD-198 (token count per Equipment), UNL-170 (two-part cost reduction), SFD-039 ("ready or exhaust" read as ready) | parser, silent |
| engine gap: equipment effect text | 3 | the script ignores the Effect Text that the parse reads (CR 136.2) | engine |
| text changed | 2 | SFD-138, VEN-073: the gallery text needed a fix | data |
| engine gap | 1 | SFD-175: the script omits "As I'm revealed from your deck, [Add] [2]" | engine |

Result (**DATA, n = 604 hand-written scripts**): raw agreement on all six facets 83.1%. After adjudication, **13 cards (2.2%) are parser errors, of which 9 are self-flagged and 4 (0.7%) are silent**; 76 are representation differences, 11 are engine-side. So the parse agrees with the hand-written behaviour on 591 of 604 cards (97.8%). Among the 27 disagreeing text-compiled scripts none is a parser error (17 are equipment Effect Text the compiler does not see).

Limits: the facet comparison checks verbs, numbers, triggers, keywords, activation count and speed. It does **not** check targets (friendly / enemy, unit / gear, location), conditions or durations; a wrong target with the right verb passes. Check (b) covers those by hand. GameLab has no Radiance scripts, so check (a) says nothing about RAD.

### 6b. Hand audit of 60 random cards

Sample: seeded (LCG seed 20261111), stratified by set of first printing among cards that have rules text: OGN 13, OGS 3, SFD 10, UNL 10, VEN 8, **RAD 16**. Codes in `out/audit-sample.json`, text and parse side by side in `out/audit-sample.txt`. Each card's text was read against every field of the parse (kind, trigger, cost, verb, target, amount, duration, conditions, speed, plus the raw JSON where the one-line rendering was ambiguous).

**DATA (n = 60, graded by hand 2026-11-11):**

| grade | n | share | cards |
|---|---|---|---|
| exact: every field right | 44 | 73.3% | the remaining 44 |
| minor loss: verbs, kinds, triggers and costs right; one qualifier coarse or dropped; no derived role changes | 10 | 16.7% | OGN-111 (ability copy recorded as a bare `copy`), OGN-160 (reveal-until-unit as look x), OGN-180 ("unit at a battlefield or a gear": location applied to both), OGS-010 ("from your trash": controller left as any), SFD-141 and VEN-164 ("spells that choose ..." kept as an unparsed qualifier string), SFD-166 (this-turn window of the delayed trigger not recorded), VEN-023 (token ability lives only in reminder text), RAD-019 ("Units don't ready during the Awaken Phase" as a generic restriction), RAD-032 ("up to 2 runes" as 2) |
| flagged by the parser (partial / none) | 3 | 5.0% | OGN-063, SFD-059, RAD-145 |
| **silent error** (marked full, something material wrong) | 3 | 5.0% | UNL-170 (cost reduction halves merged; actor of the forced kill), UNL-081 (copy points at the source, not the tokens), VEN-053 (conditions "first or second turn" and "from conquering or holding" dropped) |

- Usable for role derivation (exact + minor): 54 of 60 = **90.0%**. Silent error rate: **5.0%** (3 of 60; with n = 60 the uncertainty is wide, roughly 1% to 14%).
- Radiance subset (n = 16): 13 exact, 2 minor (RAD-019, RAD-032), 1 flagged (RAD-145), 0 silent errors.
- Only one of the three silent errors changes a derived role (VEN-053 gets `card_flow`); it is in the override file.
- The audit also confirmed two representation choices that look like errors in the one-line rendering but are right in the JSON: cost changes carry `{amount, sign, amountAlt}` (OGN-144, SFD-141), and alternative Equip costs are kept as `cost.alternatives` (RAD-150 "[Rainbow] or exhaust a friendly unit").

Caveat (**HEURISTIC**): the grader is the same agent that wrote the parser; no second reader checked the 60 grades.

## 7. Derived per-card features

Implemented in `features.mjs`; output `out/features.json`, one row per card: `{ roles{role: [reasons]}, speed{...}, conditionality{...}, efficiency{...}, parseStatus }`. All role definitions are **HEURISTIC** (our taxonomy); the counts are **DATA** over the 1095-card pool.

### 7.1 Shared helpers

- **Pronoun resolution.** A target `ref: prev` ("it", "that unit") resolves to the last explicit target in the same ability; after a `createToken` it resolves to the token; if there is none and the ability is triggered by something other than the card itself, it resolves to the object named in the trigger ("When an opponent plays a gear, ... banish it" => enemy gear).
- `hitsEnemy(effect, target)`: target is not the card itself and its controller is `enemy` or `any` (the caster chooses), **or** the actor is an opposing player acting on their own objects ("the defender must kill one of their units").
- `isMass`: target count is `all` or `any-number`, or the damage is `split`, or the count is 3 or more.
- `onBoard`: target location is not trash / hand / deck.
- `fast(card, ability)`: the ability is an activated ability with [Action] or [Reaction], or the card is a spell with [Action] or [Reaction] (CR 806, 813).
- Costs never create roles: "Kill a friendly unit: ..." is in `ability.cost`, not in `effects`.

### 7.2 Roles: exact derivation

| role | a card has it when any effect (including options of a "choose one" and quoted granted abilities) matches |
|---|---|
| `removal_single` | verb in {kill, banish, deal, takeControl} with `hitsEnemy`, `onBoard`, target type unit or gear, not `isMass`; or verb `fight`; or grantKeyword [Temporary] (CR 816) on something that `hitsEnemy`; or `kill` by `each-player` on their own unit (symmetric edict). Reason records the verb and unit / gear |
| `removal_sweeper` | same verbs with `isMass` |
| `combat_trick` | `fast` and not static, and verb in {stun, doubleMight, setMight, swapMight, prevent}, or `might` with a duration, or `grantKeyword` with a duration, or `ready` on a unit |
| `counter_protection` | verb `counter`, `prevent` or `retarget`; `untargetable` on others; grantKeyword [Deflect] (CR 809) to others; a replacement ability on would-die whose effects are not just a banish; `recall ... instead` of dying; a restriction "can't be chosen / countered / moved by enemy ..." granted to others |
| `card_flow` | verb in {draw, tutorTop, toHand}, actor not `each-opponent` |
| `card_selection` | verb `look` or `banishTop`, or keyword [Vision] (CR 817) |
| `rune_ramp` | verb in {channel, readyRune, add}; or creates a Gold token for yourself |
| `cost_reducer` | `costChange` with sign `-` whose target is not the card itself and that is not part of a keyword cost |
| `finisher` | verb in {score, win, extraTurn} for yourself; or `doubleMight`; or non-static `might` > 0 on all friendly units (mass pump); or a unit whose Might is in the top decile of the pool (Might >= 7, see 7.4) |
| `token_maker` | `createToken` for yourself, token not Gold and not a battlefield. Reason records type and name |
| `buff_source` | verb `buff` (the Buff counter, CR 427); static or permanent `might` > 0 on others (anthem); static grantKeyword to others; gear with [Equip] (CR 818) |
| `mobility` | `move` / `swapPlaces` of the card itself or a friendly unit; `recall` that is not a death replacement; `playPermission` (play to a battlefield you could not otherwise use); has, grants or equips [Ganking] (CR 810) |
| `haste` | `enterReady` (self or others), keyword [Accelerate] (CR 805), or grants it |
| `recursion` | verb in {play, returnToHand, toHand, attach} with `from: trash` or target in trash; keyword [Flow] (**FACT, CR 829.1.b:** "You may play this from your trash for its flow cost. Then banish it."); a play-from-trash permission |
| `disruption` | `discard` by an opposing or every player; `revealHand`; `stun` with `hitsEnemy`; `exhaust` of an enemy; `move` of an enemy-or-any unit; `returnToHand` of an enemy-or-any permanent from the board (bounce); non-static negative `might` with `hitsEnemy` (shrink); `costChange` with sign `+` (tax); a restriction on others matching can't play / move / score / ready / be played / be revealed, can only, must pay, only channel; `burn` by an opponent (mill); `banish` from a trash |

A card can have several roles. `stun` deliberately counts for both `combat_trick` (when fast) and `disruption`.

### 7.3 Role counts over the pool

**DATA (out/role-counts.json; n = 1095 gameplay cards, 953 deckable):**

| role | all (n=1095) | deckable (n=953) | unit | spell | gear | legend | battlefield | first printed in RAD | derivation hits |
|---|---|---|---|---|---|---|---|---|---|
| removal_single | 120 | 119 | 44 | 71 | 4 | 1 | 0 | 17 | deal:unit 66, kill:unit 20, kill:gear 13, fight:unit 8, banish:unit 5, grant-Temporary 3, takeControl:unit 3, edict-symmetric 2, takeControl:gear 1, banish:gear 1 |
| removal_sweeper | 25 | 24 | 8 | 14 | 2 | 0 | 1 | 4 | deal:unit 21, kill:unit 3, kill:gear 1 |
| combat_trick | 65 | 63 | 1 | 61 | 1 | 2 | 0 | 10 | might 36, stun 10, grantKeyword 9, ready 5, prevent 3, doubleMight 2, setMight 1, swapMight 1 |
| counter_protection | 33 | 31 | 8 | 19 | 4 | 1 | 1 | 3 | counter 12, death-replacement 8, grant-Deflect 5, prevent 4, retarget 2, grant-immunity 2, untargetable-others 1 |
| card_flow | 152 | 132 | 58 | 48 | 26 | 10 | 10 | 26 | draw 135, toHand 10, tutorTop 7 |
| card_selection | 54 | 49 | 28 | 14 | 7 | 1 | 4 | 15 | look 44, Vision 8, banishTop 3 |
| rune_ramp | 96 | 72 | 39 | 14 | 20 | 14 | 9 | 17 | channel 32, add 29, gold-token 28, readyRune 9 |
| cost_reducer | 15 | 9 | 9 | 0 | 0 | 1 | 5 | 2 | others 15 |
| finisher | 76 | 73 | 62 | 8 | 3 | 0 | 3 | 14 | big-body 52, score 14, mass-pump 10, win 2, extraTurn 1 |
| token_maker | 66 | 58 | 32 | 17 | 9 | 5 | 3 | 17 | unit:Recruit 20, unit:Mech 10, unit:Sprite 8, gear:Bomb 7, unit:Bird 7, unit:Sand Soldier 6, unit:Reflection 3, unit:Shadow Clone 3, unit:Tentacle 2, unit:(same) 1, unit:(copy) 1 |
| buff_source | 122 | 106 | 47 | 6 | 53 | 8 | 8 | 18 | equipment 43, buff-counter 40, keyword-anthem 25, anthem 16, permanent-might 1 |
| mobility | 98 | 91 | 61 | 21 | 9 | 5 | 2 | 14 | move 32, grant-Ganking 23, Ganking 18, play-anywhere 13, recall 7, swapPlaces 4, equip-Ganking 2 |
| haste | 68 | 65 | 62 | 2 | 1 | 2 | 1 | 15 | Accelerate 31, self 29, others 8, grant-Accelerate 2 |
| recursion | 42 | 42 | 15 | 25 | 2 | 0 | 0 | 3 | play 17, Flow 15, returnToHand 9, self-from-trash 1, play-from-trash-permission 1 |
| disruption | 121 | 112 | 55 | 50 | 7 | 2 | 7 | 13 | move-enemy 28, stun 25, shrink 23, bounce 16, restriction 15, reveal-hand 7, tax 4, discard 3, discard-symmetric 2, mill 2, exhaust 1, trash-hate 1 |

- Roles per deckable card: 0 roles 184, 1 role 533, 2 roles 200, 3 roles 33, 4 or more 3.
- The 184 deckable cards with no role are mostly vanilla or keyword-only bodies, self-buffing units, XP sources and build-around rule cards (see the hand check below).

### 7.4 Cost efficiency: Might versus the pool curve

**DATA (n = 550 non-token units with printed Energy and Might):**

| Energy | n units | median Might | mean Might | min-max |
|---|---|---|---|---|
| 1 | 2 | 0.5 | 0.5 | 0-1 |
| 2 | 76 | 2 | 1.76 | 0-4 |
| 3 | 126 | 3 | 2.96 | 1-6 |
| 4 | 117 | 4 | 3.73 | 1-6 |
| 5 | 95 | 5 | 4.63 | 1-6 |
| 6 | 70 | 6 | 5.53 | 3-8 |
| 7 | 27 | 7 | 6.7 | 4-8 |
| 8 | 20 | 8 | 7.5 | 5-9 |
| 9 | 7 | 8 | 8.14 | 6-10 |
| 10 | 7 | 8 | 8.14 | 5-12 |
| 12 | 3 | 10 | 10.67 | 10-12 |

- Least-squares fit: **Might = 0.233 + 0.849 x Energy + 0.241 x Power icons**, R squared 0.81, residual standard deviation 0.82.
- Per unit the scorer gets: `mightPerEnergy`, `medianAtEnergy`, `vsMedian = Might - median at that Energy`, `expected` (the fit), `residual = Might - expected`, `z = residual / 0.818`.
- The median curve is "Might = Energy" from 2 to 8 Energy, so a unit at or above the median has given up nothing for its text. Largest positive residuals: UNL-171 Galio, Indefatigable (3 Energy + 1 Power, 6 Might, +2.98; it carries the drawback "don't deal combat damage" restriction), UNL-147 Baron Nashor (+2.55), OGN-208 Cruel Patron (+2.37, additional cost: kill a friendly unit). Largest negative: SFD-055 Needlessly Large Yordle (-4.45, has a self cost reduction), RAD-138 Seraphine, Not Alone (-3.72).
- **HEURISTIC:** the residual measures stats only. It has to be read together with `conditionality.selfCostReduction`, `optionalCosts` and drawback statics; the two extremes above show why.
- Only 5 units have no abilities at all (OGN-049 5/5, OGN-088 7/8, OGN-142 9/10, OGN-175 3/3, OGN-219 4/4, Energy/Might), too few for a separate vanilla curve.
- Big-body threshold: Might >= 7 is the smallest value reached by at most 10% of units (52 of 550).
- Spells and gear have no Might; the scorer should compare them by effect amount per cost within a verb (deal N per Energy, draw N per Energy), which the structure supports (`effects[].amount`, card `energy`, `power`) but which is not tabulated here.

### 7.5 Speed

**DATA (n = 953 deckable):** spells: 91 [Action], 71 [Reaction], 109 normal. Units: 3 with [Reaction], 547 normal. Gear: 1 with [Reaction], 131 normal. 45 cards have [Hidden] (CR 811). `speed.interactive` (can act outside your own normal timing: [Action] / [Reaction] card, [Hidden], or a fast activated ability that is not just a resource ability) is true for 201 deckable cards.

Fields: `speed.card`, `speed.hidden`, `speed.fastestAbility`, `speed.interactive`.

### 7.6 Conditionality

Fields: number of non-keyword abilities, how many carry a condition (ability gate or effect-level "if", excluding "if you do" / "otherwise" bookkeeping and usage limits), their share, the gate keywords, the condition types, the count of optional additional costs, and whether the card reduces its own cost.

**DATA:** 210 of 953 deckable cards have at least one conditional ability. Gate keywords: [Empowered] 36 cards, [Level N] 15, [Legion] 10. 39 cards have an additional cost; 35 reduce their own cost. Most frequent condition types: paid-additional-cost 17, turn-event 16 (something happened this turn), control 13, state 13, exists 11, rune-count 9, at-battlefield 8.

### 7.7 Hand check of the roles

Precision: 10 seeded cards per role, read against their text (`out/role-samples.txt`; the first-pass sample is `out/role-samples.v1.json`).

**DATA (n = 150, 10 per role):** first rule set: 146 of 150 correct. The four errors were UNL-007 Smite ("if it would die this turn, banish it instead" counted as protection), UNL-147 Baron Nashor (the Baron Pit battlefield token counted as a token maker), OGN-227 and OGN-023 ("recall ... instead" death replacements counted as mobility). After fixing those four rules and re-sampling the changed roles: **150 of 150** in the final samples. One sampled card is borderline (SFD-026 Rumble, Hotheaded as `cost_reducer`: it reduces the cost only of the Mech it replays). `finisher: big-body` is correct by definition, not by judgement.

Recall, two checks:

1. **DATA (regex baseline over all 1095 texts):** a naive text regex per role, and the cards where the regex fires but the role is missing, each read by hand.

| role | regex hits | have the role | without it | true misses after reading |
|---|---|---|---|---|
| card_flow | 135 | 134 | 1 | 0 (OGN-033: the opponent chooses whether you draw) |
| removal (single or sweeper) | 174 | 133 | 41 | 0 (kill / banish used as a cost or on your own cards, banish from a deck or hand, Bonus Damage amplifiers). The first pass had 3 true misses (OGN-221, UNL-164, VEN-102), fixed by the trigger-pronoun and edict rules |
| counter_protection | 16 | 16 | 0 | 0 |
| rune_ramp | 66 | 65 | 1 | 0 (VEN-036 limits channeling) |
| token_maker | 60 | 58 | 2 | 0 (RAD-159 symmetric, UNL-130 gives the opponent a token) |
| recursion | 33 | 24 | 9 | 3 (OGN-112, OGN-281 unparsed; UNL-148 reanimates through a banish zone). All three are in the override file |
| finisher | 19 | 16 | 3 | 0 (OGN-276 raises the points needed, RAD-069 gives the opponent a point, VEN-053 denies points) |

2. **DATA (n = 15 seeded deckable cards with no role):** 13 really have none of the listed roles; 2 were misses: OGN-018 Noxus Saboteur ("can't be revealed here", now covered by the disruption rule) and VEN-101 Gust Monk (trash hate written as a cost-shaped clause; override). An earlier draw of the same check found OGN-026 Brynhir Thundersong ("opponents can't play cards this turn"), now covered, and OGN-244 Divine Judgment (unparsed; override).

**UNCONFIRMED:** recall for roles with no regex baseline (combat_trick, buff_source, mobility, haste, disruption, card_selection, cost_reducer) was only checked through the no-role sample.

## 8. Known limits of the structure

- Effect Text of equipment is parsed and tagged, but roles treat what an equipment grants as the gear's own contribution only for [Ganking] and the generic `buff_source: equipment`; other granted abilities (e.g. SFD-016 Recurve Bow, "When I attack or defend, deal 2 to an enemy unit here.") are derived as if the gear had them itself. That is intended for a deck scorer.
- Token abilities are known only for tokens with a gallery row (Recruit, Sprite, Bird, Gold, Reflection, Baron Pit, Brush). Mech, Sand Soldier, Shadow Clone, Tentacle and Bomb are defined only by the reminder text of the cards that create them, which the parser strips.
- `restrict` and `ruleMod` keep the restriction as a text fragment (`what`), not as structure; roles read it through a whitelist of prefixes.
- Symmetric effects (each player) are recorded with `actor`, but the scorer has to decide their sign.
- No interaction semantics: the parse says what a card does, not how two cards combine. That is the subject of interactions.md.

## 9. Cards that need a hand-written override

Data file proposal: `analysis/card-text-parser/overrides.proposed.json` (built by `build-overrides.mjs`; card text is copied from the parsed pool, not typed). Shape:

```json
{ "cards": [ { "code": "OGN-244", "name": "...", "class": "unparsed | silent-loss | dynamic | role-fix",
               "parseStatus": "partial", "text": "...", "derivedRoles": [],
               "roles": { "add": ["removal_sweeper", "disruption"], "remove": [], "note": "" },
               "why": "...", "ability": "intended reading, to be turned into the schema of section 2" } ],
  "tokens": { "needDefinition": ["Mech (unit, 3 Might)", "..."] },
  "dataFixes": { "type": [36 rows], "domainMissing": [11 rows], "text": [8 rows] } }
```

**DATA: 41 cards** = 23 unparsed or partial, 5 dynamic (text depends on other cards: SFD-059, VEN-137, OGN-111, UNL-200, UNL-086), 6 silent losses found by the audits, 7 role fixes. That is 3.7% of the 1095-card pool. Every card the parser flags (25) is in the file.

| code | name | class | why the parser cannot capture it | role patch |
|---|---|---|---|---|
| OGN-063 | Spirit's Refuge | unparsed | Clause "if they didn't already" is a no-op qualifier; the parse is otherwise right. | none |
| OGN-112 | Kai'Sa, Evolutionary | unparsed | Free-cast of a spell from trash limited by "Energy cost less than your points". | +recursion |
| OGN-115 | Promising Future | unparsed | Symmetric "each player looks at top 5, chooses one, ... plays those cards, ignoring Energy costs". | +card_selection |
| OGN-227 | Symbol of the Solari | unparsed | Replacement on a tied combat: "recall ALL units instead". | none |
| OGN-242 | Baited Hook | unparsed | Sacrifice-and-upgrade: unit from top 5 with "Might up to 1 more than the killed unit". | +card_selection |
| OGN-244 | Divine Judgment | unparsed | Symmetric keep-N sweeper over units, gear, runes and hands. | +removal_sweeper +disruption |
| OGN-263 | Swift Scout | unparsed | Returns a named champion ("a Teemo unit you own") from Champion Zone or board to hand. | none |
| OGN-281 | Hallowed Tomb | unparsed | Chosen Champion from trash to Champion Zone. | +recursion |
| RAD-068 | Orianna, Mechanical Marvel | unparsed | Cost reduction phrased as "you may pay ... less to play a gear", once each turn, while at a battlefield. | +cost_reducer |
| RAD-140 | Chronobreak | unparsed | Variable-X blink: banish X of your units, owners replay them free. | none |
| RAD-145 | Lady of Clockwork | unparsed | Type-changing effect: a gear "becomes a unit gear with Might equal to its Energy cost". | none |
| RAD-151 | Starry-Eyed Songstress | unparsed | Cost reduction paid by exhausting the legend and three friendly units. | +cost_reducer |
| RAD-167 | Neeko, Blending In | unparsed | Deckbuilding rule plus Legend Zone change. Errata text used (Radiance Errata Updates, 2026-10-09). See rules.md 8.3. | none |
| SFD-059 | Svellsongur | dynamic | Copies the equipped unit's text into its own effect text; what it does depends on the wearer. | none |
| SFD-146 | Vex, Cheerless | unparsed | Two-sided cost modifier with a floor, gated on being in combat. | +cost_reducer |
| SFD-173 | Soraka, Wanderer | unparsed | Death replacement for another unit with a Might comparison; the recall is part of the save, not movement. |  -mobility |
| UNL-054 | Tricksy Tentacles | unparsed | Target set limited by "same controller" and "total Might of 8 or less". | none |
| VEN-040 | Decree of Focus | unparsed | Target must be in combat with an enemy Fury unit or chosen by an enemy Fury spell. | none |
| VEN-069 | Mel, Newly Awakened | unparsed | Replacement that increases -Might effects by 1. | none |
| VEN-086 | Gangplank, Naval | unparsed | Self-protection replacement (stun / -Might / return to hand become +3 Might). Not a buff source for others. | +counter_protection -buff_source |
| VEN-137 | Shady Spectacles | dynamic | Equipped unit "becomes a copy of" another friendly unit. | none |
| VEN-139 | Rogue Assassin | unparsed | Nested condition ("if I'm Empowered, ready it") inside an activated ability. | none |
| VEN-157 | Dragon Roost | unparsed | Any player may pay an additional cost to play a Dragon to this battlefield. | none |
| VEN-160 | Mystic Vortex | unparsed | Tax on cards with [Reaction] during showdowns here. | none |
| VEN-163 | Risen Altar | unparsed | Reduces [Empower] costs of your units here. | +cost_reducer |
| UNL-170 | Atakhan | silent-loss | Two-part cost reduction merged into one phrase; actor of the forced kill is "the defender". | none |
| VEN-044 | Astral Heron | silent-loss | Trigger is "your first card each turn" and the reduction applies to the next card; frequency is lost. | none |
| SFD-198 | Arise! | silent-loss | Token count scales with Equipment you control; "ready two of them". | none |
| SFD-039 | Royal Entourage | silent-loss | Modal "ready or exhaust a legend" parsed as ready only (found against the GameLab script). | none |
| VEN-053 | Otterpus | silent-loss | Symmetric replacement of early points by a draw; the "first or second turn" and "from conquering or holding" conditions are lost, and it is not card flow for its owner. | +disruption -card_flow |
| UNL-081 | Keeper of Masks | silent-loss | "They become copies of me": parser points the copy at the source instead of the tokens. | none |
| OGN-033 | Shakedown | role-fix | Punisher: the opponent chooses between taking 6 and letting you draw 2. Neither outcome is guaranteed. |  note: removal_single and card_flow are both opponent-choice |
| VEN-101 | Gust Monk | role-fix | "banish a card from any trash to give ..." is a cost-shaped clause, so the trash hate is not seen. | +disruption |
| RAD-110 | Lulu, Whimsical | role-fix | Sets another unit's base Might to 4: a buff or a shrink depending on the target. | +combat_trick |
| OGN-111 | Heimerdinger, Inventor | dynamic | Has all [Exhaust] abilities of all friendly legends, units and gear. | none |
| UNL-200 | Mirror Image | dynamic | Reflection token becomes a copy of a chosen unit. | none |
| UNL-086 | Zilean, Time Mage | dynamic | Doubles token-unit plays; the token is whatever the other card makes. | none |
| UNL-148 | Cursed Sarcophagus | role-fix | Reanimation through an intermediate zone: banishes all units from your trash, then plays "a unit banished with this". | +recursion |
| SFD-175 | Undertitan | role-fix | The [Add] happens only "as I'm revealed from your deck"; it is not a repeatable resource source. |  note: rune_ramp is conditional on reveal effects |
| OGN-276 | Aspirant's Climb | role-fix | Changes the points needed to win; no scorer role fits. |  note: rule-mod victory-score +1 |
| VEN-022 | Endless Riches | role-fix | Whole-card engine: banish hand and trash, burn 7, skip draws, play from trash. |  note: recursion via permission; treat as build-around |

Also in the file: the 5 token definitions that have no gallery row, the 36 Radiance type corrections, the 11 Radiance rows with no domain, and the 8 text fixes.

**HEURISTIC:** the override file should be the only place where a human interprets card text; it should be keyed on card code plus a hash of the text it was written for, so that an erratum or a gallery correction invalidates the override instead of silently keeping it.

## 10. What stayed unconfirmed

- The type of the 36 Radiance rows whose gallery `cardType` is wrong or empty rests on the image alt text; the domain of 11 Radiance rows is missing altogether. Both need a second source (see legality-and-data.md).
- Check (a) has no Radiance coverage and does not compare targets, conditions or durations.
- Check (b) is one grader, n = 60; the 5% silent-error rate has a wide interval.
- Only the gallery's printed text plus one known erratum (RAD-167) was used. Whether other errata listed in rulings-and-errata.md change wording that matters to the parse was not reconciled here.
- Whether a unit at 0 Might dies was not looked up; negative-Might effects are therefore classed as `disruption: shrink` / `combat_trick`, never as removal.
- The role taxonomy and every threshold (top-decile Might, "3 or more targets is a sweeper") are our own choices, not official terms.
