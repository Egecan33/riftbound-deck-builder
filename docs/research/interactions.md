# Card-interaction graph: the local stand-in for a combo database

Researched and measured 2026-11-11. Labels: **FACT** = primary source (official rules, card text, a page we fetched); **DATA** = measured here, with dataset and n; **HEURISTIC** = our judgement; **UNCONFIRMED** = could not be verified.

Riftbound has no Commander Spellbook. This document records what the community has published instead, defines an effect/trigger vocabulary over the real card pool, describes a working prototype that turns it into a directed graph of `enabler -> payoff` edges with reasons, measures how good that graph is, and recommends the data model, the scoring use and the line generator for Riftbound Forge.

All scripts and outputs are in `docs/research/analysis/interactions/`. Reproduce with:

```bash
cd docs/research/analysis/interactions
python3 build_graph.py -v      # facets.json, edges.json, structures.json   (4 s)
python3 validate.py            # validation.json                             (needs ../raw/pa-decks.jsonl)
python3 lines.py               # lines for three real decks + corpus overlap check
EDGES=out-pre/edges.json python3 audit_sample.py   # audit sample 1 (after: OUT_DIR=out-pre python3 build_graph.py --no-suppress)
```

Sources used throughout:

| Key | Source |
|---|---|
| CR-JUL | Core Rules 2026-07-16, `~/github_repositories/GameLab/data/rules/core-rules.md` |
| CR-OCT | Core Rules 2026-10-09, `docs/research/analysis/raw/core-rules-2026-10-09.compact.txt` (fetched 2026-11-11 by the rules workflow) |
| TR-OCT | Tournament Rules 2026-10-09, `docs/research/analysis/raw/tournament-rules-2026-10-09.txt` |
| CARDS | `GameLab/data/cards/cards.json`, 931 cards, sets OGN, OGS, SFD, UNL, VEN (September 2026) |
| RAD | 178 Radiance cards, text only, normalised from the official gallery https://playriftbound.com/en-us/card-gallery/ (fetched 2026-11-11) into `analysis/interactions/data/rad-cards.json` |
| ENGINE | GameLab engine `CardScript` for all 931 CARDS, dumped by `dump-scripts.mts` to `engine-scripts.json` |
| PA-NOV | Piltover Archive deck pages, `analysis/raw/pa-decks.jsonl`, 361 lists fetched 2026-11-11 by the deck-theory workflow |
| PA-SEP | `GameLab/data/decks/samples/piltover-archive-2026-09-06.json`, 60 lists |
| RGG | riftbound.gg articles, harvested 2026-11-11 by `harvest-community.mjs` (serial, 1.2 s apart, generic User-Agent) |

## 0. Findings in one page

1. **FACT/DATA: no combo database exists.** The nearest things are riftbound.gg's "Best Combos & Synergies" articles (one set, December 2025), per-legend guides, and deck-tech articles on cardsrealm. They are prose, cover one set or one deck, and are not maintained after bans (section 1).
2. **DATA: the prototype works end to end.** 1,109 cards (931 with an engine script, 178 Radiance cards from text only) get facets from a vocabulary of 100 keys; 40 rule families produce 40,856 directed edges (26,052 specific, 14,804 class-level) and 819 nonbo pairs, each with a strength and a sentence that quotes both cards (sections 2 to 4).
3. **DATA: hand-audited precision.** First sample of 40 specific edges: 27 correct, 2 conditional, 11 wrong (67.5%, Wilson 95% interval 52 to 80%). The 11 errors fell into 8 patterns; after adding suppressors for them a second sample of 40 gave 36 correct, 2 conditional, 2 wrong (90%, interval 77 to 96%). The suppressors remove 3,685 candidate edges (section 6).
4. **DATA: co-occurrence in top lists is a weak validator.** The 250 strongest edge pairs co-occur 2.39 times as often as independence over all eligible decks predicts, but only 1.05 times once you condition on the legend (random pairs: median 1.01, 95th percentile 1.10). Strong edges mostly identify "cards of the same legend's plan"; inside one legend's lists they do not predict which cards are picked together. Nonbo pairs co-occur just as often as synergy pairs (section 5).
5. **DATA: the graph rediscovers a published infinite loop.** riftbound.gg's Lux guide (published 2026-07-13) describes a loop of Forge of the Future, Ekko, Recurrent, Shadow's Call and Sacrifice. The graph has `Sacrifice -> Ekko, Recurrent` and `Shadow's Call -> Ekko, Recurrent` as refund loops with net-positive runes and lists Forge of the Future among the cards that close them. Ekko, Recurrent has been banned since 2026-09-18 (`legality-and-data.md`), so the graph must be filtered by the synced ban list before anything is shown (section 4.1).
6. **DATA: recall against community co-mentions is low.** Of 445 card pairs that riftbound.gg writers name in the same paragraph, 14.8% have an edge (base rate for random legal pairs 8.0%). The graph models "A produces what B triggers on"; it does not model two payoffs sharing an enabler, board-position plays, or plain rate (section 5.4).
7. **DATA: lines differ between decks.** Top-5 line sets for 361 real decks: no two decks of different legends share a line set (mean Jaccard 0.001). Two different lists of the same legend share on average 25% of their lines (section 8.3).
8. **HEURISTIC recommendation:** ship the graph as a `card_interaction` table built at sync time from the structured parser (`analysis/card-text-parser`), not from these regexes; use edge sums as the synergy part of a card score with a cap and with class edges excluded; never use raw co-occurrence as ground truth for edge weights; generate lines as scored paths with a diversity rule (sections 7 and 8).

## 1. What the community has published

Searched 2026-11-11 (web search plus direct fetches). "Reliability" is our judgement of whether the content can be used as ground truth for edges.

| Source | What exists | Structure | Reliability for our purpose |
|---|---|---|---|
| riftbound.gg | **FACT**: sitemap lists 367 article URLs; 63 are guides or synergy articles (`data/community/rgg-urls.json`). One article is an explicit combo list: "Spiritforged Best Early Combos & Synergies", https://riftbound.gg/spiritforged-best-combos-synergies/ (published 2025-12-22, author Den). Six "Spiritforged Best Cards & Synergies" domain guides (published 2025-12-12). One "Movement 101: Advanced Movement, Ganking and Combos" (2025-06-23). Per-legend guides through 2026-11 | Prose. The site marks cards as `<span data-card="OGN-052">`, so card codes per paragraph can be extracted exactly | Medium. Written by named authors, card codes are exact. Covers one set at release; not updated for bans or errata. A paragraph naming two cards is not always a combo |
| riftbound.gg legend guides | **FACT**: the Lux guide https://riftbound.gg/lux-lady-of-luminosity-guide/ (published 2026-07-13) spells out a four-card infinite loop step by step | Prose with card codes | High for that one loop at its date; it is now illegal (Ekko, Recurrent banned 2026-09-18) |
| cardsrealm | **FACT**: deck-tech articles, e.g. "Deck Tech - Draven Ram Rhasa Combo" https://riftbound.cardsrealm.com/en-us/articles/riftbound-deck-tech-draven-ram-rhasa-combo (2026-01-23) and "Deck Tech - Renata Combo" https://riftbound.cardsrealm.com/en-us/articles/riftbound-deck-tech-renata-combo (2026-03-12). Both fetched 2026-11-11 | Prose, one deck per article, card names without codes | Medium. Describes play patterns of one list. The Draven list runs Called Shot (banned), the Renata loop uses Ekko, Recurrent (banned); see `rulings-and-errata.md` section 5 |
| Piltover Archive | **FACT**: deck lists and a card browser (https://piltoverarchive.com). We found no combo or synergy feature on the site | Deck JSON | High as deck data, none as combo data |
| mobalytics.gg/riftbound | **UNCONFIRMED**: search results show deck pages and a "deckbuilding fundamentals" guide; we did not find a combo list and did not fetch the pages | n/a | n/a |
| RiftJudge | **FACT**: community rules Q&A. FAQ #589 https://app.riftjudge.com/questions/589 (asked 2025-12-18, fetched 2026-11-11) explains how a loop with a maintaining player is shortcut | Q&A | Low to medium: not official, the answer cites no rule number. The official text is TR-OCT 505 (below) |
| riftmana.com | **UNCONFIRMED**: a search hit titled "Reksai infinite combo" (https://riftmana.com/?p=52877) returned HTTP 403 behind a bot check; not read | n/a | n/a |
| Reddit, YouTube | **UNCONFIRMED**: searches returned no combo megathread, list or spreadsheet. We did not crawl Reddit or video descriptions | n/a | n/a |
| Star City Games | **FACT** (search result, article not fetched): reports that Stealthy Pursuer was banned ahead of Vendetta because of a three-card infinite combo; the other pieces were not officially named. The ban itself is confirmed in `legality-and-data.md` (OGN-177, effective 2026-07-24) | News | The ban is fact; the combo's other cards are **UNCONFIRMED** |

**FACT (official loop rule):** TR-OCT 505: "Some sequences of actions can be repeated and are shortcutted as a loop" (505.1); each iteration must contain identical, non-conditional actions on the same set of cards (505.2); loops must be fully deterministic (505.2.a), with a legal example that replays Grim Apothecary (505.2.a.1). The Core Rules (CR-JUL, CR-OCT) have no loop section; the word appears only for layer dependencies (CR-OCT 478.1.c) and the turn queue (CR-JUL 115.1.c).

**DATA (harvest):** `harvest-community.mjs` read the 63 riftbound.gg guide and synergy articles and kept every paragraph, list item or card grid that names two or more cards: 425 such units, giving 445 distinct card pairs that resolve to the pool (`data/community/rgg-comentions.json`). They are used as a recall check in section 5.4.

**HEURISTIC:** community content is useful as a test set and as a source of named packages for a hand-curated seed list. It cannot be the database: too small, dated, and silent on why two cards work together in a machine-readable way.

## 2. Vocabulary: what a card produces and what it cares about

### 2.1 Ground truth used

- **ENGINE (best).** The GameLab engine compiles every one of the 931 CARDS into a `CardScript`: abilities with `kind` (triggered, activated, static), `trigger` (for example `youConquer`, `moveToBattlefield`, `friendlyUnitDies`), `condition`, `targets` with controller and filters, and `effects` with an `op` (`buff`, `ready`, `lookAtTop`, `buffMight`, ...). `build_graph.py` maps triggers, conditions, per-counters and effect ops to facets (`TRIG`, `COND`, `PER`, `FILT` tables and `engine_facets`). This keeps ability boundaries: the graph knows that Ekko, Recurrent's rune readying comes from the same ability as its Deathknell.
- **Text (fallback).** For the 178 Radiance cards there is no engine script. A regex per facet runs on each rules sentence with reminder text removed.
- **Untitled `scoring.ts`.** Its trait registry was read for coverage (effect families over `rulesText`); the facet list below is a superset for the interaction use. It was not executed.
- **`analysis/card-text-parser/`** (written by a parallel workflow, schema in `schema.d.ts`) is a structured parser with targets, costs, conditions and effects. It was not available when the prototype was built. It is the right production input (section 7.4).

### 2.2 The facets

100 distinct facet keys occur in the pool (counting `C.tag:*`, `P.token:*`, `P.grantkw:*`, `C.kw:*`, `P.double:*` as one each). Each facet on a card stores: source (`engine`, `text`, `keyword`), repeatability (`once` = on play, `repeat` = every time the trigger happens, `turn` = needs the card to be ready, `free` = activated without exhausting, `static`), the ability it belongs to, engine filters where present, and the sentence it came from.

**PRODUCES** (card count in the 1,109-card pool, DATA from `out/facets.json`):

| Facet | Meaning | Cards |
|---|---|---|
| `P.draw` | draws cards | 127 |
| `P.might+` / `P.might-` | raises a friendly unit's Might / lowers an enemy's (includes [Disarm], CR-OCT 831) | 117 / 30 |
| `P.targetsFriendly` | chooses a friendly unit (CR-JUL 355.7: choosing a specific object is targeting) | 114 |
| `P.damage`, `P.kill.enemy` | deals damage, kills enemy units or gear | 84, 36 |
| `P.token` (+ `P.token:recruit` etc.), `P.gold`, `P.bomb` | creates unit tokens (CR-JUL 187.1 to 187.11), Gold gear tokens, Bomb gear tokens | 57, 33, 7 |
| `P.grantkw:*` | grants a keyword (Assault, Ganking, Temporary, ...) | 52 |
| `P.attach` | attaches Equipment / has [Equip] | 49 |
| `P.topdeck`, `P.reveal`, `P.mill` | Predict / Vision / look at top; reveals from the Main Deck; Burn | 46, 13, 9 |
| `P.move.friendly`, `P.move.self`, `P.move.enemy`, `P.recall` | moves a friendly unit, itself (Ganking), an enemy unit; recalls to base | 38, 28, 27, 15 |
| `P.ready.unit`, `P.ready.self`, `P.ready.rune`, `P.ready.legend`, `P.ready.gear`, `P.enterReady` | readies a unit, itself, runes, the legend, gear; makes units enter ready | 37, 23, 10, 5, 5, 12 |
| `P.buff` | puts a buff counter on a friendly unit | 33 |
| `P.reanimate`, `P.regrowth`, `P.recycle` | plays from trash (includes [Flow], CR-JUL 829), returns from trash to hand, recycles | 31, 8, 22 |
| `P.channel`, `P.add` | channels runes, adds Energy or Power | 30, 27 |
| `P.discard.self`, `P.discard.enemy` | discards own cards, makes the opponent discard | 29, 5 |
| `P.bounce.friendly`, `P.bounce.enemy` | returns own / enemy permanents to hand | 29, 15 |
| `P.cheat`, `P.costReduce` | plays a card ignoring cost, reduces cost | 28, 18 |
| `P.xp`, `P.empower`, `P.selfEmpower` | gains XP (includes [Hunt]); empowers another object; empowers itself | 28, 4, 38 |
| `P.stun`, `P.banish`, `P.counter`, `P.point` | stuns, banishes, counters spells, scores points directly | 24, 21, 11, 15 |
| `P.kill.friendly`, `P.selfkill`, `P.exhaustFriendly` | kills one of your own units (sacrifice outlet), kills itself, exhausts a friendly unit as cost or effect | 18, 14, 6 |
| `P.onlyFor.spell`, `P.onlyFor.gear` | gives a resource or discount only spells / gear can use | 8, 3 |
| `P.double:*`, `P.extraTurn` | makes a trigger class happen an additional time; extra turn | 3, 1 |

**CARES ABOUT / TRIGGERS ON:**

| Facet | Meaning | Cards |
|---|---|---|
| `C.replay` | has a when-played effect (wants to be replayed) | 167 |
| `C.exhaustAbility` | has an [Exhaust] ability (wants to be readied) | 111 |
| `C.tag:*` | names a tag (Mech, Recruit, Poro, Dog, ...) | 59 |
| `C.hidden` | has or rewards [Hidden] / facedown cards | 53 |
| `C.conquer`, `C.hold` | triggers when you conquer / hold | 52, 45 |
| `C.empowered`, `C.xp` | needs to be Empowered; spends or checks XP ([Level]) | 48, 27 |
| `C.attackTrigger`, `C.selfMove`, `C.moveEvent` | triggers when it attacks, when it moves, when any unit moves | 38, 35, 3 |
| `C.gear`, `C.gearCast`, `C.deploy`, `C.abilityUse` | counts or watches gear / Equipment; when you play gear; cares about [Deploy] gear (CR-OCT 830); when you use abilities | 36, 7, 11, 3 |
| `C.selfDeath`, `C.friendlyDeath`, `C.enemyDeath` | Deathknell / dies trigger; friendly death watcher; enemy death watcher | 30, 9, 5 |
| `C.trash`, `C.bigEnergy`, `C.runes` | uses the trash; is an Energy sink ([Repeat], X costs); counts runes | 24, 22, 8 |
| `C.buffed`, `C.mighty` | needs or spends buffs; cares about Mighty (5+ Might) units | 22, 7 |
| `C.cardCast`, `C.spellCast`, `C.unitCast`, `C.multiPlay` | triggers when you play any card / a spell / a unit; [Legion] and "another card this turn" | 16, 12, 10, 13 |
| `C.stun`, `C.targeted`, `C.readyEvent`, `C.selfExhausted` | rewards stunning; "when you choose me"; "when I become ready"; "when I become exhausted" | 9, 4, 4, 6 |
| `C.tokens`, `C.wide`, `C.alone` | counts tokens; counts your units; wants to be the only unit | 7, 6, 7 |
| `C.showoff`, `C.notFromHand`, `C.revealed`, `C.mightReduced` | [Show Off] (CR-OCT 832); rewards units not played from hand; as-revealed effect; "when you reduce the Might" | 6, 4, 1, 1 |
| `C.discard`, `C.selfDiscarded`, `C.draw`, `C.recycleEvent`, `C.banish`, `C.excess`, `C.handSize`, `C.kw:*` | discard payoffs, draw / recycle / banish watchers, excess damage, hand size, counts units with a keyword | 2, 3, 2, 2, 1, 5, 2, 2 |

Intrinsic facts are used as enablers without a facet: card type, tags, printed keywords, Energy cost, printed Might 5+ (CR-JUL 711: units outside the board are judged by printed Might).

### 2.3 How good is the text-only extractor? (DATA)

`build_graph.py -v` compares the regex facets with the engine facets on the 931 scripted cards (`out/text-vs-engine.json`; engine = reference).

- High agreement (precision and recall both at least 0.85): `P.token` 0.96/1.00, `P.gold` 1.00/1.00, `P.draw` 0.96/0.98, `P.attach` 0.94/0.98, `P.xp` 0.97/1.00, `P.channel` 0.95/0.91, `C.conquer` 0.98/0.96, `C.hold` 1.00/0.92, `C.selfDeath` 0.96/0.96, `C.buffed` 1.00/1.00, `C.replay` 1.00/0.95, `C.attackTrigger` 1.00/0.97, `C.selfMove` 1.00/1.00, `C.exhaustAbility` 0.98/0.94, `C.hidden` 0.92/0.98.
- Poor precision from text: `P.ready.unit` 0.52 (cannot tell "ready me" from "ready a unit"), `P.move.self` 0.49, `P.cheat` 0.50, `P.targetsFriendly` 0.38, `C.gear` 0.45, `C.trash` 0.39, `C.mighty` 0.45, `P.recycle` 0.35, `C.wide` 0.12, `P.enterReady` 0.11, `P.costReduce` 0.10, `P.recall` 0.08.
- Poor recall from text: `P.bounce.friendly` 0.50, `P.bounce.enemy` 0.21, `C.gearCast` 0.33, `C.abilityUse` 0.33, `C.runes` 0.38.

**HEURISTIC:** facets for Radiance cards are noticeably worse than for the older sets. Two of the residual false positives seen in the lines demo came from Radiance text facets. Tags are present for only 67 of the 178 Radiance cards in `rad-cards.json` (Clanging Sentry is a Mech per the CR-OCT 831.2 example, but has no tag in our file), so tribal edges into Radiance are incomplete. **UNCONFIRMED**: complete Radiance tags.

## 3. From facets to edges

### 3.1 Edge rule families

An edge is `enabler A -> payoff B` under a rule. A rule names the produce-facet (or intrinsic fact) required of A, the care-facet required of B, an optional compatibility test on the pair, and a base weight. DATA: counts are from the final graph (`out/edges.json`, `rule_stats`).

| Rule | Base w | Enabler | Payoff | Extra test | Edges |
|---|---|---|---|---|---|
| `sac->deathknell` | 3.0 | `P.kill.friendly` | `C.selfDeath` (unit) | printed stats must satisfy the engine's kill filter (tag, Might, Mighty) | 381 |
| `ready->exhaust-unit` / `-legend` / `-gear` | 3.0 / 3.0 / 2.8 | `P.ready.*` | `C.exhaustAbility` | type of B matches | 544 / 40 / 140 before suppression |
| `discard->discardpayoff` | 3.0 | `P.discard.self` | `C.discard`, `C.selfDiscarded` | | 133 |
| `stun->stunpayoff` | 3.0 | `P.stun` | `C.stun` | | 203 |
| `buff->buffpayoff` | 2.8 | `P.buff` | `C.buffed` | | |
| `ready->readytrigger` | 2.8 | `P.ready.*` | `C.readyEvent` | | 133 |
| `token->tokenpayoff`, `move->selfmove`, `move->movewatch`, `xp->xppayoff`, `draw->drawpayoff`, `recycle->recyclepayoff`, `target->targeted`, `sac->deathwatch`, `deploy->deploypayoff`, `shrink->shrinkpayoff`, `exhaust->exhaustpayoff`, `reveal->revealed`, `tribal:<Tag>`, `keyword:<K>` | 2.6 | matching produce facet, tag membership or token maker | matching care facet | unit-only where the trigger is the unit's own | `tribal` 911, `move->selfmove` 929 |
| `cheat->expensive` | 2.4 | `P.cheat` | any main-deck card costing 5+ | type, tag, keyword and max-cost limits from the engine script; weight grows with Energy saved | 3,616 |
| `hidden->hiddenpayoff`, `offhand->notfromhand`, `banish->banishpayoff`, `double->trigger` | 2.4 | | | | 364, 53, 11, 83 |
| `replay->etb`, `gear->gearpayoff`, `empower->empowered`, `temporary->deathknell`, `extraturn->hold` | 2.2 | bounce / gear / empower / grants Temporary / extra turn | when-played / gear counter / Empowered / Deathknell / hold trigger | | `replay->etb` 3,266, `gear->gearpayoff` 3,089 |
| `reanimate->etb`, `removal->killpayoff`, `ready->exhaustpayoff`, `temporary->deathwatch`, `object->showoff`, `gearability->abilitypayoff` | 2.0 | | | Show Off matches the printed object (CR-OCT 832.1.c) | `reanimate->etb` 1,309 |
| `token->sac`, `token->wide`, `reduce->expensive` | 1.6 | | | | 817, 221, 2,419 |
| `might->mighty`, `trashfill->trash` | 1.5 | | | | 900 |
| `ready->attacker` | 1.4 | `P.ready.unit` | `C.attackTrigger` | | 926 |
| `token->deathwatch` | 1.2 | | | | 454 |
| **class rules** `ramp->sink` 1.2, `spellsupport->spell` 1.2, `gearsupport->gear` 1.2, `spell->spellpayoff` 1.0, `cheap->multiplay` 1.0, `unit->unitpayoff` 0.8 | | a whole card type or cost band | a play-a-type payoff | | 5,743 / 1,741 / 189 / 2,340 / 516 / 4,275 |

Class rules link a payoff to an entire card type ("is a spell" -> "when you play a spell"). They are kept in a separate class because they describe a deck's composition, not a pair of cards, and are excluded from structures, the audit and the lines.

### 3.2 Legality gate (FACT)

No edge is created between two cards that cannot share a deck. `legality()` applies CR-JUL 103.1.b (the Champion Legend dictates the deck's Domain Identity): the union of both cards' domains must fit inside at least one legend's domain pair; an edge to a legend requires the other card's domains to be inside that legend's; a Signature card must share the legend's champion tag (CR-JUL 103.2.d refers to "Signature cards that have the same Champion tag as your Champion Legend"). cards.json marks battlefields as `colorless`; that value is dropped (a first version treated it as a domain and silently produced no edges for 66 battlefields).

**Not applied in the prototype:** bans. HEURISTIC: production must drop edges and structures that contain a card banned in the selected format, from the synced ban table in `legality-and-data.md`.

### 3.3 Strength (HEURISTIC)

```
s = base_weight(rule)
    x specificity            1 / (1 + log10(max(1, inDegree(B) x outDegree(A)) / 25)), clamped to [0.25, 1]
    x repeatability          x1.2 for each end that repeats (trigger, static, free or once-per-turn ability)
    x pair multiplier        x1.2 kill filter satisfied; x1.15 bounce filter satisfied; cheat: x(1 + 0.1 per Energy above 5, max 1.5); legend on either end: x1.25
```

Specificity is the important term: a narrow enabler pointing at a narrow payoff keeps its full weight, while "any gear -> counts gear" is damped. DATA: specific edges have median strength 0.88, maximum 6.75; 2,706 are at least 1.8 and 226 at least 3.0.

### 3.4 Reason text (requirement: names both cards and quotes both texts)

Every edge stores one sentence built from the two facet sentences. Verbatim from `out/edges.json`:

> Shadow's Call (UNL-165: "Give it [Temporary].") can give the Deathknell unit [Temporary] so it dies at your next Beginning Phase: Hunting Dog (RAD-119: "[Deathknell][>] Play a 1 [Might] Bird unit token with [Deflect] to your base.")

> Forgotten Signpost (UNL-045: "[Action][>] Exhaust a unit you control, [Exhaust]: Move a different unit you control to the location of the unit you exhausted to pay for this ability.") exhausts a friendly unit outside combat, which is the trigger: Reckless Innovator (RAD-105: "When I become exhausted, choose one —Play a Gold gear token exhausted.")

## 4. Special structures

DATA from `out/structures.json` (final graph).

### 4.1 Loops

| Kind | Count | Definition |
|---|---|---|
| `self-replay` | 6 | a unit whose own when-played ability can return itself to hand: Zaunite Bouncer (OGN-188), Beast Below (SFD-132), Windsinger (SFD-138), Grim Apothecary (UNL-021), Angler Beast (UNL-132), Ocean Drake (VEN-115). Grim Apothecary is the legal-loop example in TR-OCT 505.2.a.1. Limiter: its own play cost per iteration |
| `mutual` | 16 | edges in both directions, checked at ability level: the facet A produces comes from the very ability that B's edge triggers, and the reverse. Example: The Syren (OGN-184) moves Miss Fortune, Captain (OGN-162), whose first-move trigger readies The Syren. Limiter reported: "The Syren: once per turn / needs readying", which here is exactly what the other card supplies |
| `mutual-card-level` | 179 | edges in both directions but not through the same abilities. HEURISTIC: treat as a strong two-card package, not as a loop |
| `refund` | 301 (193 net-positive, 39 neutral, 69 negative) | the payoff's triggered ability gives resources back (readies runes, adds Energy). The record carries the Energy the enabler spends, the refund, and what is still missing ("a way to get Sacrifice back", "a way to get Ekko, Recurrent back") plus the cards in the same domains that supply it (recycle from trash, return to hand) |

**DATA (validation against a published loop):** the Lux guide on riftbound.gg lists the loop as OGN-212, OGN-110, UNL-165, UNL-173. From cards.json: Forge of the Future (OGN-212, "Kill this: Recycle up to 4 cards from trashes."), Ekko, Recurrent (OGN-110, "[Deathknell] — Recycle me to ready your runes."), Shadow's Call (UNL-165, "Give it [Temporary]. Draw 2."), Sacrifice (UNL-173, "kill a friendly [Mighty] unit ... Draw 2 and channel 1 rune exhausted."). The graph, built without any knowledge of the article, contains refund loops `[Sacrifice, Ekko, Recurrent]` and `[Shadow's Call, Ekko, Recurrent]`, both net-positive ("all runes"), with needs "a way to get Sacrifice back" and "a way to get Ekko, Recurrent back", and Forge of the Future in the closer list. So the three-card structure "enabler + refunding payoff + closer" is how a real infinite shows up in this graph.

**FACT:** Ekko, Recurrent is banned since 2026-09-18 and Stealthy Pursuer since 2026-07-24 (`legality-and-data.md` ban table). Both appear in top-ranked structures (the fourth-strongest triple is Miss Fortune, Captain + Stealthy Pursuer + Voidreaver). The ban filter is not optional.

**HEURISTIC:** the tool should call something a loop only when (a) it is `mutual` or a net-positive `refund` with a closer present in the deck, and (b) the resource arithmetic closes. Everything else is an "engine". TR-OCT 505.2 requires identical, deterministic iterations; a loop that depends on a reveal or on a "may" of the opponent must be labelled non-deterministic.

### 4.2 Cost cheats

3,616 `cheat->expensive` edges after suppression (5,940 before). Strongest: Ava Achiever (OGN-107, "play a card with [Hidden] from your hand here, ignoring its cost") -> Hostile Takeover (SFD-202, Hidden, 5 Energy) and -> Elnuk Herd (RAD-081, Hidden, 6 Energy); Baited Hook (OGN-242) -> Daisy! (UNL-196, 9 Energy). Each record stores the Energy saved. The engine's filters (type, tag, keyword, maximum cost) decide which targets are valid.

### 4.3 Repeatable engines

2,386 specific edges where both ends repeat (enabler is a trigger, static or reusable ability; payoff is a trigger or reusable ability). Strongest family: Miss Fortune, Captain (OGN-162) -> legends with an exhaust cost (Relentless Storm, Bounty Hunter, The Boss, Battle Mistress, Grand Duelist, Voidreaver), strength 6.75 each.

### 4.4 Packages and "one card away"

- **Pairs:** undirected pair score = sum of specific edge strengths in both directions; 2,790 pairs score at least 1.8.
- **Triples:** triangles among those pairs, sharing one legal Domain Identity, joined by at least two different rule families (three cards joined by one generic rule are a theme, not a package): 851. Top examples: Miss Fortune, Captain + Blood Rose (UNL-109) + Voidreaver (UNL-201), score 15.25, rules move->selfmove, ready->exhaust-gear, ready->exhaust-legend, xp->xppayoff; Royal Entourage (SFD-039) + Irelia, Fervent (SFD-057) + Rogue Assassin (VEN-139), 15.23; Rumble, Hotheaded (SFD-026) + Bubble Bot (SFD-062) + Rumble, Scrapper (SFD-089), 13.26, rules reanimate->etb and tribal:Mech.
- **One card away:** for a given deck, every package (pair, triple, loop with closers) with exactly one member missing and that member legal for the legend. `lines.py` implements the pair version as "score of a candidate = sum of edge strengths between it and the deck" and prints the two strongest reasons. Example for the list "Stuttgart Viktor" (Herald of the Arcane, PA-NOV): +9.83 Whirling Twirligig (RAD-022), +8.41 Vanguard Helm (OGN-228), Demacian Illuminators (RAD-131), Altar of Memories (SFD-169), Shard of Undoing (UNL-174), all death watchers or sacrifice outlets for the Sprite and Deathknell cards the list already runs.

### 4.5 Anti-synergies (nonbos)

819 pairs in four implemented families (a fifth, discard-vs-hand-size, found no pair in the pool):

| Family | Pairs | Example reason from the output |
|---|---|---|
| `nonbo:sweeper-vs-wide` | 327 | Unchecked Power (OGN-123: "Exhaust all friendly units, then deal 12 to ALL units at battlefields.") hits your own board too, which punishes Sprite Call (OGN-094)'s go-wide plan |
| `nonbo:wide-vs-alone` | 248 | Sprite Call (OGN-094) adds units, but En Garde (OGN-046: "... an additional +1 [Might] this turn if it is the only unit you control there.") wants to be alone |
| `nonbo:bounce-loses-buffs` | 164 | Retreat (OGN-104) returns a unit to hand, which removes the buff Stand United (OGN-053) put on it. FACT: CR-JUL 705, "If a Unit leaves play, remove all Buffs from it." |
| `nonbo:trash-contention` | 80 | Last Rites (SFD-150: "[Equip] — [Chaos], Recycle 2 cards from your trash") removes cards from your trash that Vi, Destructive (OGN-036) also needs |

HEURISTIC: more families worth adding: two cards that both need the same once-per-turn resource (legend exhaust), self-discard with cards that have no discard value, "enters exhausted" with ready-dependent payoffs, [Temporary] granted to a unit you want to keep. DATA (section 5.3): top lists do contain nonbo pairs at a normal rate, so a nonbo is a warning with a reason, never a legality-style error.

## 5. Validation against real lists

### 5.1 Dataset

DATA: PA-NOV (361 rows) plus PA-SEP (60 lists), reduced to 327 unique (legend, card set) lists across 56 legends, 664 distinct cards; 404 main-deck cards and legends appear in at least 3 lists. Zero unmapped card names. Lists come from Piltover Archive pages the deck-theory workflow selected (tournament and popular lists); they are not a random sample of the meta and include lists older than the latest bans.

Measures (`validate.py`): for a pair, `observed` = lists containing both. `exp_global` = expectation under independence over every list whose legend could legally hold both cards. `exp_within_legend` = the same expectation computed inside each legend and summed, which removes "both cards belong to the same legend's pool". Lift = observed / expected, pooled over a set of pairs. Random baseline: 200 draws of 250 legal pairs with no edge.

### 5.2 Lift of the strongest edges

| Pair set | Pairs | Observed | Lift, global | Lift, within legend | Share co-occurring at least once |
|---|---|---|---|---|---|
| all legal pairs among played cards | 63,279 | 56,276 | 1.03 | 1.02 | 22.2% |
| no edge | 58,346 | 50,410 | 1.00 | 1.01 | 21.7% |
| class edge only | 1,505 | 1,562 | 1.27 | 1.03 | 23.7% |
| specific edge | 3,428 | 4,304 | 1.42 | 1.06 | 29.7% |
| top 50 by strength | 50 | 146 | 2.55 | 1.02 | 54.0% |
| top 100 | 100 | 266 | 2.39 | 1.03 | 54.0% |
| top 250 | 250 | 660 | 2.39 | 1.05 | 49.2% |
| top 500 | 500 | 1,056 | 2.01 | 1.04 | 45.2% |
| top 1,000 | 1,000 | 1,988 | 1.84 | 1.06 | 43.0% |
| strength at least 3.0 | 51 | 149 | 2.58 | 1.02 | 54.9% |
| 2.4 to 3.0 | 61 | 165 | 2.29 | 1.03 | 55.7% |
| 1.8 to 2.4 | 228 | 494 | 2.17 | 1.05 | 43.4% |
| 1.2 to 1.8 | 643 | 1,131 | 1.66 | 1.07 | 40.7% |
| below 1.2 | 2,445 | 2,365 | 1.19 | 1.06 | 24.3% |
| random 250 no-edge pairs (median; 95th percentile) | 250 | | 0.99 (1.14) | 1.01 (1.10) | 21.6% |

Reading:

- **DATA:** strength is monotone in global lift (1.19 -> 1.66 -> 2.17 -> 2.29 -> 2.58) and in the share of pairs that ever co-occur (24% -> 55%). The strongest edges do point at cards that are played together about 2.4 times more often than chance, far outside the random band (95th percentile 1.14).
- **DATA:** within a legend the lift is 1.02 to 1.07, inside the random band (95th percentile 1.10). Once you know the legend, having an edge tells you almost nothing more about co-occurrence.
- **HEURISTIC interpretation:** competitive lists of one legend are near-copies of each other (deck-theory measures this), so within-legend co-occurrence has little variance left to explain; and the graph's strong edges are concentrated on legend abilities and champion units, which sit in every list of that legend by construction. Co-occurrence therefore validates "the graph finds each legend's plan" but cannot rank edges inside a deck. Do not fit edge weights to co-occurrence.

Deck-level check, DATA: sum of specific edge strengths inside a real list, median 14.6; a random legal pile of the same size from the same legend's legal played cards, median 12.1; real exceeds its random pile in 59.0% of 327 lists. Against a stricter null (cards drawn from what that legend's lists actually play, weighted by play count) the median is 14.0 and real wins 50.2% of the time: no signal. Restricted to edges of strength at least 1.8: real mean 6.95 against null mean 2.57, but medians 2.3 against 2.0, 42.5% of lists have none, and real beats null for 33 of 56 legends. So strong-edge density is concentrated in a minority of synergy-driven legends; many top lists are built on rate and interaction rather than on engines. HEURISTIC: this caps how much weight synergy deserves in a card score (section 7.3).

### 5.3 By rule family and for nonbos

DATA, pairs among played cards (families with at least 15 pairs; global lift / within-legend lift):

- Clearly above chance: `deploy->deploypayoff` 9.98 / 1.83 (28 pairs), `empower->empowered` 4.65 / 2.01 (17), `ready->exhaust-gear` 3.76 / 1.00 (26), `gearsupport->gear` 3.63 (25), `xp->xppayoff` 2.97 / 1.02 (115), `double->trigger` 2.87 / 1.03 (18), `token->deathwatch` 2.22 / 0.97 (19), `buff->buffpayoff` 2.09 / 1.04 (37), `tribal` 2.08 / 1.09 (98), `temporary->deathknell` 1.98 / 1.03 (72), `gear->gearpayoff` 1.75 / 1.08 (479), `sac->deathknell` 1.74 / 1.05 (101), `trashfill->trash` 1.68 / 1.13 (100).
- Weak: `ramp->sink` 1.39, `move->selfmove` 1.38, `token->sac` 1.35, `object->showoff` 1.31, `reanimate->etb` 1.29, `unit->unitpayoff` 1.28, `stun->stunpayoff` 1.26, `cheat->expensive` 1.24, `target->targeted` 1.23.
- At chance or below: `replay->etb` 1.11 (713 pairs), `spell->spellpayoff` 1.12, `ready->exhaustpayoff` 1.12, `ready->attacker` 1.03, `token->tokenpayoff` 1.00, `reduce->expensive` 0.99, `cheap->multiplay` 0.98, `might->mighty` 0.96, `removal->killpayoff` 0.88, `token->wide` 0.66.

HEURISTIC: the at-chance families are the ones where one side is very common (167 cards have a when-played effect; 149 cards raise Might). They should be demoted to class level or have their base weight cut to about 1.0, pending the measure in section 9.

Nonbos, DATA: 206 nonbo pairs among played cards have global lift 1.34 and within-legend lift 1.02; by family 1.47 (wide-vs-alone), 1.44 (trash-contention), 1.42 (sweeper-vs-wide), 0.78 (bounce-loses-buffs). Players do run these pairs together. HEURISTIC: a go-wide deck plays En Garde anyway because the cards are individually strong and rarely collide in one turn. A nonbo should cost little in the score and should be shown as a sequencing note ("do not play X while Y is your only body").

### 5.4 Recall against community co-mentions

DATA: of the 445 riftbound.gg co-mention pairs, 66 (14.8%) have any edge and 53 (11.9%) a specific edge. For random legal pairs the rates are 8.0% and 5.2% (n = 51,145). For the eight combo and synergy articles alone: 112 pairs, 17 with any edge (15.2%), 11 specific (9.8%). So a co-mentioned pair is about twice as likely as a random pair to have an edge, but 85% of what writers pair up is not in the graph.

What the misses are (read from the "Spiritforged Best Early Combos & Synergies" article against cards.json):

- **Sibling payoffs.** Treasure Hunter (SFD-130, "When I move, play a Gold gear token exhausted.") with Stellacorn Herder (SFD-048, "When I move, draw 1."). Neither enables the other; both want the same enabler. The graph has no edge type for "shares an enabler", though the line generator can express it as a fan-out (section 8).
- **Board-position plays.** Sneaky Deckhand (OGN-176, "You may play me to an open battlefield.") with Ravenbloom Conservatory (SFD-215, "When you defend here, ..."); Deadbloom Predator (OGN-161, "You may play me to an occupied enemy battlefield."). The vocabulary has no facet for "gets onto / stays on a battlefield", so conquer, hold and defend triggers have no enablers at all. This is the largest gap, because scoring is the win condition (see `wincons.md`).
- **Rate, not synergy.** Stalwart Poro (OGN-052, "[Shield]") with Trinity Force (SFD-115, "[Equip] [Body]"): a good body for a good Equipment. Correctly not an edge; it belongs to card quality.
- **Legend plan.** Rumble, Hotheaded with Minefield (SFD-212, "put the top 2 cards of your Main Deck into your trash"): mill feeding "play a Mech from your trash". Needs a `trashfill -> reanimate-by-type` rule that checks what is milled.

## 6. Hand audit of 80 edges

Method (`audit_sample.py`, deterministic): only specific edges. Stratum A = 20 edges from the 500 strongest; stratum B = 20 from the rest with strength at least 1.2. At most 2 edges per payoff card and 3 per rule family per stratum, so one legend or one rule cannot fill the sample. For each edge both full rules texts were read (cards.json; Radiance from the gallery file) and the stated reason was judged: **correct** = the two cards alone do what the reason says; **conditional** = the interaction is real but needs a further condition or the stated reason is not the true one; **wrong** = the reason is false. Verdicts and notes: `audit-verdicts.json`. Samples: `out/audit-sample.txt`, `out/audit-sample-2.txt`.

The precision figures are rule-balanced because of the caps. They are not edge-volume-weighted: one family, `cheat->expensive`, had 2,324 of its 5,940 edges removed by suppressors S4, S7 and S9 alone.

### 6.1 Sample 1: graph before any suppressor (seed 40)

| | Correct | Conditional | Wrong | Strict precision |
|---|---|---|---|---|
| A (top 500) | 15 | 0 | 5 | 75% |
| B (rest, s at least 1.2) | 12 | 2 | 6 | 60% |
| All 40 | 27 | 2 | 11 | 67.5% (Wilson 95%: 52 to 80%); 72.5% counting conditional as correct |

The 13 non-correct edges, with card text from cards.json or the gallery:

| # | Edge | Why it fails | Pattern |
|---|---|---|---|
| 1, 6 | Solari Shrine (OGN-072) / Heart of Dark Ice (SFD-052) -> Curator of the Sands (VEN-145: "When you play a unit, gear, or activated ability with Energy cost [7] or more, ...") | neither gear has an ability costing 7 Energy. FACT: CR-JUL 206.1 uses the ability's base cost | S1 cost threshold ignored |
| 9, 13 | Herald of the Arcane (OGN-265) / Vanguard Captain (OGN-218), as Recruit makers -> Viktor, Leader (OGN-246: "When another non-Recruit unit you control dies, ...") | the payoff names the tag to exclude it | S2 negated tag |
| 7 | Tornado Warrior (VEN-099: "you may empower something here") -> Master of Shadows (VEN-143, legend) | "here" is a battlefield; a legend is not there | S3 location scope vs legend |
| 21, 26 | Void Burrower (SFD-187: "reveal the top 2 cards of your Main Deck. You may play one.") -> Brazen Buccaneer (OGN-002), Drakehound Packmaster (RAD-018) | "play" without "ignoring its cost" is not free. Radiance prints the reminder on Akali, Brash (RAD-015): "(You still pay its costs.)" | S4 play is not a cheat |
| 24 | Crowd Favorite (UNL-102: "Spend 2 XP: [Buff] me.") -> Simian Ancestor (SFD-047: "When you buff me, ready me.") | the enabler only buffs itself | S5 self-only enabler |
| 31 | Stoic Ferryman (RAD-031: "move another unit you control here to your base") -> Ribbon Dancer (SFD-038: "When I move to a battlefield, ...") | wrong destination | S6 move destination |
| 32 | Dockside Lock-Up (RAD-136: "banish a unit here ... play the banished card, ignoring its cost") -> Volibear, Furious (OGN-041) | only replays a unit already on the board | S7 cheat source is the board |
| 33 | Ezreal, Dashing (SFD-082, a unit that deals damage) -> Immortal Phoenix (OGN-037: "When you kill a unit with a spell, ...") | qualifier "with a spell" | S8 qualifier on the trigger |
| 28 (conditional) | Shadow's Call (UNL-165) -> Unsung Hero (SFD-167: "[Deathknell] — If I was [Mighty], draw 2.") | Deathknell fires but pays nothing at printed Might 2 | conditional payoff |
| 36 (conditional) | Gravity Field (RAD-062, [Deploy], "[Deathknell] Draw 1.") -> Whirling Twirligig (RAD-022: "Kill a friendly gear, [Exhaust]: ...") | real (gear fodder with a Deathknell) but the reason says "gear with [Deploy]"; any gear works | facet regex too broad |

### 6.2 Suppressors added (all in `suppress()` in `build_graph.py`)

DATA: candidate edges removed in the final build.

| ID | Check | Removed |
|---|---|---|
| S1 | payoff sentence has "Energy cost [N] or more" / "costs N or more": require the enabler's printed cost (or its largest activated-ability cost) to reach N | 488 |
| S2 | tribal edge whose payoff sentence contains "non-<Tag>" | 39 |
| S3 | enabler sentence is scoped to "here" and the payoff is a legend | 45 |
| S4 | `cheat->expensive` requires "ignoring ... cost", "without paying", "reducing its cost" or "costs N less" in the enabler text | 1,304 |
| S5 | enabler verb only has "me" as object (buff me, ready me, move me) and the payoff is another card's self-scoped requirement; swaps ("me ... and it to my original location") are exempt | 485 |
| S6 | payoff needs "move to a battlefield", enabler's move clause ends in base | 107 |
| S7 | the free play only returns a card that was banished from the board ("banish a unit ... play the banished card", "its owner plays it") | 744 |
| S8 | kill payoff says "with a spell" and the enabler is not a spell | 52 |
| S9 | the free play belongs to the opponent ("They play that unit ...") | 276 |
| S10 | watcher needs "move an enemy unit", enabler only moves friendly units (added after sample 2) | 45 |
| S12 | enabler readies runes only, payoff needs a unit, legend or gear readied (added after the lines demo) | 65 |
| S13 | enabler moves gear, payoff is a unit's own move trigger (added after the lines demo) | 35 |
| | Total | 3,685 |

All 11 wrong edges of sample 1 are absent from the final graph; no correct or conditional edge of either sample was removed (`still_in_final_graph` in `audit-verdicts.json`).

### 6.3 Sample 2: after S1 to S9 (seed 41)

| | Correct | Conditional | Wrong | Strict precision |
|---|---|---|---|---|
| A | 17 | 1 | 2 | 85% |
| B | 19 | 1 | 0 | 95% |
| All 40 | 36 | 2 | 2 | 90% (Wilson 95%: 77 to 96%); 95% counting conditional as correct |

- Wrong: #3 Voidreaver (UNL-201, "Move an exhausted friendly unit ...") -> Blast Cone (UNL-133, "When you move an enemy unit, ...") (now S10); #10 Jayce, Brilliant Inventor (VEN-068) -> Glowstone (VEN-133: "Disempower this, [Exhaust]: Choose a player. They gain control of this and recall it."): the ability gives the gear away, readying it repeats nothing. Not suppressed; pattern "one-shot ability with a self-removing effect".
- Conditional: #8 Skyward Strike (UNL-038, "[Level 6][>] [Stun] an enemy unit.") -> Radiant Dawn (OGN-261): needs Level 6; #25 Cull the Weak (OGN-209) -> Spoils of War (OGN-144, "If an enemy unit has died this turn, this costs [2] less."): real, but typed as a friendly-death watcher.

Caveats, stated plainly: sample 2 was drawn from an intermediate graph (S1 to S9, before the battlefield-domain fix and before S10, S12, S13). The two samples differ by sampling noise as well as by the suppressors; with n = 40 each the intervals overlap at their edges. The final graph has not had a third independent sample. Residual false positives seen while reading the lines demo, and already suppressed or still open:

- **Open:** a payoff whose condition is only partly met ("If I was [Mighty]", "[Level 6]", "if you paid the additional cost"). Suggested fix: carry the payoff's condition on the edge and multiply strength by 0.5 unless the enabler or the card itself satisfies it.
- **Open:** generic death watcher with an exclusion (Cull the Weak -> Viktor, Leader is shown as a line although only a non-Recruit death counts). S2 handles tribal edges only; the same negation check is needed on `sac->deathwatch` and `token->deathwatch` with the token's tag.
- **Open:** "here" scoping between two units (Ahri, Inquisitive -> Ahri, Confident needs both at one battlefield). Correct but should be annotated "same battlefield".
- **Open:** text-only facets for Radiance (section 2.3).

### 6.4 False-positive patterns, generalised

1. Quantified or qualified triggers (cost thresholds, "with a spell", "non-X", "another", "enemy" vs "friendly"). Fix at the source: the structured parser already has `filters`, `controller`, `other` and `tags` on targets and trigger conditions (`card-text-parser/schema.d.ts`). An edge should be created only if the enabler's output object satisfies the payoff's trigger filter.
2. Scope of the enabler's object (self only, "here", gear vs unit, runes vs units). Same fix: compare `Target` of the enabler effect with what the payoff needs.
3. Verbs that look like a produce but are not (play vs play free; move to base vs to battlefield; opponent plays).
4. Conditional payoffs and conditional enablers.
5. Zone of origin (cheat from the board, not from hand or deck).

## 7. Recommended data model and scoring use

### 7.1 Tables (SQLite; built by `pnpm sync features`, never hand-edited)

```sql
-- one row per facet occurrence on a card; produced by the parser stage
CREATE TABLE card_facet (
  card_id      TEXT NOT NULL,          -- gameplayId
  facet        TEXT NOT NULL,          -- 'P.ready.unit', 'C.selfDeath', 'C.tag:Mech', ...
  ability_idx  INTEGER,                -- which ability of the card; NULL for intrinsic facts
  repeat       TEXT NOT NULL,          -- once | repeat | turn | free | static
  filter_json  TEXT,                   -- target / trigger filter from the parser (controller, type, tags, might, cost, location)
  cond_json    TEXT,                   -- condition that must hold for the facet to do anything
  sentence     TEXT NOT NULL,          -- the rules sentence shown in reasons
  source       TEXT NOT NULL,          -- parser | keyword | override
  PRIMARY KEY (card_id, facet, ability_idx)
);

CREATE TABLE card_interaction (
  id           INTEGER PRIMARY KEY,
  enabler_id   TEXT NOT NULL,
  payoff_id    TEXT NOT NULL,
  rule         TEXT NOT NULL,          -- 'sac->deathknell', 'tribal:Mech', 'nonbo:wide-vs-alone'
  class        TEXT NOT NULL,          -- specific | class | nonbo
  strength     REAL NOT NULL,          -- negative for nonbos
  specificity  REAL NOT NULL,
  enabler_facet TEXT NOT NULL, enabler_ability INTEGER, enabler_repeat TEXT,
  payoff_facet  TEXT NOT NULL, payoff_ability  INTEGER, payoff_repeat  TEXT,
  condition    TEXT,                   -- 'same battlefield', 'needs Level 6', NULL
  reason       TEXT NOT NULL,          -- sentence naming both cards and quoting both texts
  confidence   TEXT NOT NULL,          -- derived | override-allow | heuristic
  rules_version TEXT NOT NULL,         -- version of the rule set that produced the row
  UNIQUE (enabler_id, payoff_id, rule)
);
CREATE INDEX ix_inter_enabler ON card_interaction(enabler_id);
CREATE INDEX ix_inter_payoff  ON card_interaction(payoff_id);

CREATE TABLE package (
  id          INTEGER PRIMARY KEY,
  kind        TEXT NOT NULL,           -- pair | triple | loop-mutual | loop-refund | loop-self | engine | cost-cheat
  strength    REAL NOT NULL,
  domains     TEXT NOT NULL,           -- union of member domains, for the legality prefilter
  deterministic INTEGER,               -- loops: 1 if every step is non-conditional (TR 505.2.a)
  net_json    TEXT,                    -- loops: resources per iteration (energy spent, runes readied, cards drawn, points)
  needs       TEXT,                    -- what is missing for the loop to close, in words
  summary     TEXT NOT NULL            -- generated from member edge reasons
);
CREATE TABLE package_member (
  package_id INTEGER NOT NULL, card_id TEXT NOT NULL,
  role       TEXT NOT NULL,            -- enabler | payoff | closer | both
  PRIMARY KEY (package_id, card_id)
);
CREATE TABLE package_edge (package_id INTEGER NOT NULL, interaction_id INTEGER NOT NULL);
```

Rules for the builder:

- Edges are keyed on the gameplay card, not the printing. Reprints share a name and are one card (TR 601.2.a, see `legality-and-data.md`).
- The legality gate of section 3.2 runs at build time. Bans and set legality are applied at query time from the synced tables, because they change without the card pool changing.
- `interactionOverrides` from `rulings-and-errata.md` section 6 are applied after inference: `forbid` deletes a row, `allow` inserts one with `confidence = 'override-allow'`, `strength` scales it.
- Size is small: about 41,000 edge rows and a few thousand package rows for 1,109 cards. Rebuilding takes seconds; rebuild whenever cards, errata or the rule set change, and record `rules_version`.
- Edge and package ids must be stable across rebuilds only through their natural keys; nothing user-facing should store the integer id.

### 7.2 What goes into `src/engine/interactions`

Pure functions over a `CardDb` and facet rows: `buildFacets(cards) -> Facet[]`, `buildEdges(facets, legends) -> Interaction[]`, `buildPackages(edges) -> Package[]`, `deckInteractions(deck, edges)`, `candidateSynergy(deck, card, edges)`, `lines(deck, edges, packages)`. The prototype's rule table (section 3.1) translates directly; each rule gets one unit test with a positive pair and one negative pair taken from the audit tables in section 6.

### 7.3 Synergy part of a card score (HEURISTIC)

For a candidate card `c` and the current deck `D` (legend and battlefields included, with copy counts):

```
raw(c, D)   = sum over specific edges e between c and a card d in D of
                 e.strength x copies(d)/3 x conditionFactor(e, D)
            + 0.25 x sum over class edges, each capped at 1.0 per payoff
            + sum over nonbo edges (negative strength) x copies(d)/3
            + packageBonus: +1.5 for each package that c completes in D (the one-card-away case)
synergy(c, D) = 10 x (1 - exp(-raw / 6))          -- saturating, range 0 to 10
```

- The saturation matters: the measured in-deck strength sum has a median near 15 per list and a long tail for a few legends (section 5.2). Without it, engine legends would drown every other score component.
- Class edges count at a quarter and capped, so "play 20 spells" cannot be bought by one payoff.
- `conditionFactor` is 0.5 when the edge carries a condition the deck does not currently satisfy (for example "same battlefield" with no way to move, "needs Level 6" with fewer than three XP sources).
- The reasons shown with the score are the two or three strongest contributing edges, verbatim. That satisfies "no score without reasons".
- Weight inside the total card score: `deck-theory.md` section 7 already sets a quality term from play rates. HEURISTIC: synergy should weigh at most as much as quality, and less for legends where real lists show no density above the null (23 of 56 legends in section 5.2). A per-legend factor `clamp(realMean / nullMean, 0.5, 1.5)` from the strong-density table is a measured way to set it.
- Deck-level synergy for the deck rating: `sum of specific in-deck strength`, reported against the legend's own distribution of real lists, not against an absolute scale.

### 7.4 Production differences from the prototype

1. Use the structured parser for facets. The prototype's regexes are the weak part (section 2.3) and the suppressors in section 6.2 are patches for missing target and filter structure.
2. Keep the engine scripts as a test oracle: for the 931 scripted cards the parser's facets must match the engine-derived ones, facet by facet (the comparison in `out/text-vs-engine.json` is the test).
3. Add the missing vocabulary: battlefield access (play to open or occupied battlefield, Ganking, enters ready, Accelerate) as enablers of conquer and hold triggers; "shares an enabler" as a package kind; a condition field on edges.
4. Apply bans and overrides.

## 8. Generating lines from paths

### 8.1 Definitions

Within a deck, take the subgraph of specific edges whose two ends are both in the list. A **line** is one of:

- **chain** `A -> B -> C`: edge 1 switches on an ability of B, and that same ability is what produces for C (`edge1.payoff_ability == edge2.enabler_ability`). This is a real sequence: do A, B triggers, C benefits.
- **pivot** `A -> B -> C` where B's two roles come from different abilities. Still a plan around B, weaker as a sequence.
- **fan** `A -> {B, C}`: one enabler with two payoffs (the sibling-payoff case of section 5.4). Not in the prototype; recommended.
- **pair** `A -> B`: fallback so sparse decks still get output.
- **loop**: a `mutual` loop or net-positive `refund` loop whose members are all in the deck, with the closers that the deck does or does not contain.

Each line is rendered from the stored edge reasons, so it always names the cards and quotes their text. Nothing is templated beyond the connective.

### 8.2 Scoring and selection (HEURISTIC, implemented in `lines.py`)

```
w(e)      = strength x (0.7 + 0.1 x (copies(A) + copies(B), each capped at 3)) / (1 + 0.25 x otherLegends(e))
score     = (w(e1) + w(e2)) x 1.3 if chain else x 1.0 ; pair: w x 1.2 ; loop: 2 x strength
select    = greedy by score; a new line may share at most one card with any line already chosen;
            a rule family may appear at most twice
```

`otherLegends(e)` is the number of other legends whose lists in the corpus contain both cards. It demotes pairs that every deck in those colours runs and promotes what is particular to this list. The two diversity rules are what stop the output from being five restatements of the legend's ability.

To make lines read as play advice rather than as a graph dump, add from other research documents: the turn on which the line is first affordable (Energy of the cards against the rune curve, `deck-theory.md`), the probability of holding all pieces by that turn (hypergeometric with copy counts, `matchups-and-lines.md` already computes keep probabilities), and the sequencing detector that applies (Legion, ready-after, action window; `matchups-and-lines.md` section 3). Tie each line to a win route from `wincons.md` by the facets at its end: a line ending in `P.point`, `C.conquer` or `C.hold` output is a scoring line; one ending in `P.draw` or `P.add` is a value line.

### 8.3 Do two decks get different lines? (DATA)

`python3 lines.py` on three PA-NOV lists (`out/lines-demo.txt`):

- **"Stuttgart Viktor"** (Herald of the Arcane, OGN-265): 21 in-deck edges. Line 1: Herald of the Arcane -> Cull the Weak (OGN-209) -> Viktor, Leader (OGN-246). Line 2: Sprite Fountain (UNL-078) -> Cull the Weak -> Hunting Dog (RAD-119). Line 3: Shadow's Call (UNL-165) -> Hunting Dog -> Viktor, Leader.
- **"Around the World! (Other Champion)"** (Blade Dancer, SFD-195): 32 in-deck edges. Line 1: Forgotten Signpost (UNL-045) -> Reckless Innovator (RAD-105) -> Battle Preparations (RAD-032). Line 2: Blade Dancer -> Reckless Innovator. Line 3: Ride the Wind (OGN-173) -> Treasure Hunter (SFD-130) -> Battle Preparations. Line 4: The Good Stuff (RAD-106) -> Tideturner (OGN-199) -> Akali, Silent (VEN-038).
- **"Best of Orlando"** (Daughter of the Void, OGN-247): 5 in-deck edges in the first run, fewer after S7; this is a rate-and-interaction list and the graph has little to say about it. That is the honest output for such a deck; its lines must come from the win-route and matchup modules instead.

Overlap between the three line sets: Jaccard 0.0 on cards and 0.0 on rule sequences for every pair.

Corpus check over all 361 PA-NOV lists, top 5 lines each: 22 lists get no line at all. Among 55,872 pairs of lists with different legends, none have identical line sets and the mean Jaccard of line sets is 0.001. Among 1,295 pairs of different lists with the same legend, 51 have identical line sets and the mean Jaccard is 0.248. HEURISTIC: same-legend lists sharing a quarter of their lines is expected (they share the legend and the champion); the distinctiveness weight and the "at most one shared card" rule keep the rest tied to the cards that differ.

Known weaknesses of the demo output, visible in `out/lines-demo.txt`: the Viktor line 1 states the death-watcher reason although Viktor, Leader only counts non-Recruit deaths (open item in section 6.3); candidates in "one card away" are not ban-filtered.

## 9. Open items and unconfirmed points

- **UNCONFIRMED:** complete tags for Radiance cards (67 of 178 have tags in our normalised file); Radiance facets rest on regexes only.
- **UNCONFIRMED:** contents of mobalytics deck pages, the riftmana "Reksai infinite combo" page (HTTP 403), Reddit and YouTube. No combo list was found by search; absence is not proven.
- **UNCONFIRMED:** the other two cards of the Stealthy Pursuer combo that led to its ban.
- **UNCONFIRMED:** precision of the final graph. The second sample (90%) predates three suppressors and the battlefield fix; the 2,882 edges that involve a battlefield were added afterwards and only one battlefield edge has been audited (Ruined Monastery -> Jinx, Rebel, correct).
- **Not done:** ban filter; fan lines; condition field on edges; battlefield-access vocabulary; resource arithmetic for loops beyond Energy and runes (cards drawn, points per iteration); using the structured parser as input.
- **Measure to add before tuning weights:** co-occurrence cannot rank edges within a legend (section 5.2). A better target is hand-labelled packages: label the top 10 pairs for each of the 20 most-played legends as real or not, and fit base weights to that.

## 10. Files

| Path (under `docs/research/analysis/interactions/`) | Contents |
|---|---|
| `build_graph.py` | vocabulary, engine and text extractors, legality gate, rules, strength, suppressors, nonbos, structures. `--no-suppress` reproduces the pre-audit graph; `OUT_DIR` redirects output |
| `validate.py` | lift tables, random baseline, nonbo lift, deck density, community recall |
| `lines.py` | line generator, one-card-away, corpus overlap check |
| `audit_sample.py`, `audit-verdicts.json`, `out/audit-sample.txt`, `out/audit-sample-2.txt` | the two 40-edge samples and the 80 verdicts |
| `dump-scripts.mts`, `engine-scripts.json` | dump of the GameLab engine's CardScript per card |
| `normalize_rad.py`, `data/rad-cards.json` | Radiance cards from the official gallery |
| `harvest-community.mjs`, `fetch-extra.mjs`, `data/community/` | riftbound.gg harvest, cardsrealm and RiftJudge pages |
| `out/facets.json`, `out/edges.json`, `out/structures.json`, `out/validation.json`, `out/text-vs-engine.json`, `out/lines-demo.txt`, `out/build-stdout.txt` | outputs of the final run |
| `.gitignore` | keeps card-text-bearing outputs and scraped pages out of git (AGENTS.md rule 7) |
