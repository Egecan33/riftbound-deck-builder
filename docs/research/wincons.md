# Win conditions in Riftbound: rules, routes, meta data, and a deterministic detector

Research date 2026-11-11 (second pass the same day: detector v2, 351-list corpus). Labels: **FACT** = primary source read (rule number / card code given), **DATA** = measured by a script in `docs/research/analysis/wincons/` (dataset and n given), **HEURISTIC** = our judgement or a derived estimate, **UNCONFIRMED** = looked for, not settled.

Sources used throughout:

| Key | Source | Date |
|---|---|---|
| CR-JUL | `~/github_repositories/GameLab/data/rules/core-rules.md`, official Core Rules, "Last Updated: 2026-07-16" | local |
| CR-OCT | Core Rules "Last Updated: 2026-10-09", PDF saved by the rules workflow at `docs/research/analysis/raw/core-rules-2026-10-09.pdf` (text extracted with pdftotext) | fetched 2026-11-11 |
| L-CARDS | `~/github_repositories/GameLab/data/cards/cards.json` (931 cards, built 2026-09-06, sets OGN/OGS/SFD/UNL/VEN) | local |
| GAL | Official card gallery https://playriftbound.com/en-us/card-gallery/ (1,408 printings -> 1,103 distinct cards after `build_pool.py`; includes 170 Radiance cards) | fetched 2026-11-11 |
| FAQ-SFD | `GameLab/docs/research/official-faq/spiritforged-faq.md` (copy of https://playriftbound.com/en-us/news/rules-and-releases/riftbound-spiritforged-faq/) | local |
| PA-SEP | `GameLab/data/decks/samples/piltover-archive-2026-09-06.json` (59 lists from https://piltoverarchive.com/decks, 49 with a complete 40-card main deck) | local |
| PA-NOV (first pass, superseded by PA-CORPUS) | https://piltoverarchive.com/decks pages 1-4 (96 lists indexed), 37 deck pages fetched serially, generic User-Agent, 2.5 s apart -> `analysis/wincons/pa-decks-2026-11-11.json` | fetched 2026-11-11 |
| RULES.MD | `docs/research/rules.md` (sibling workflow; ban lists and legality) | read 2026-11-11 |
| PA-CORPUS | `docs/research/analysis/raw/pa-decks.jsonl`: 361 lists from https://piltoverarchive.com fetched 2026-11-11 by the deck-theory workflow (`analysis/fetch-decks.mjs`, serial, generic User-Agent); 351 valid (40 main including the Chosen Champion, 12 runes, 3 battlefields). Era, event and placement class come from `analysis/out/results.json` (parsed from deck names by `analysis/analyze.mjs`). After merging identical 40-card lists: 282 distinct lists, 201 of them RAD era, 50 of those named as a win or top 8 | fetched 2026-11-11 |
| RUL.MD | `docs/research/rulings-and-errata.md` (sibling workflow; official FAQ digests with source keys FAQ-SFD, FAQ-UNL) | read 2026-11-11 |

Card names and texts below are copied from L-CARDS; Radiance cards (not in L-CARDS) are copied from GAL and marked RAD.

## 0. Read first: what is stale, what is not confirmed

- **FACT:** the local rules file is one edition behind. CR-OCT renumbers the sections this document depends on. Rule numbers below are CR-JUL (the local file the task names); the mapping is:

| Topic | CR-JUL | CR-OCT |
|---|---|---|
| Winning | 194-196 | 194-196 (unchanged) |
| Burn Out | 431 | 432 |
| Scoring | 467-472 | 469-474 |
| Final Point | 471.1.a-b | 473.1.a-b |
| Modes of Play (1v1 Duel, 1v1 Match, FFA3, FFA4, 2v2) | 485-489 | 487-491 |
| 2v2 Final Point adjustment | 489.8.g | 491.8.g |

- **FACT (CR-OCT 470.1-470.3, new text):** "Scoring is a distinct process from Gaining Points." Card text "Score X points" means gaining points and "does not refer to the process of Scoring"; card text that uses "score" without a number refers to Scoring. CR-JUL 468.1 said the opposite direction only ("Every instance of Scoring is also an instance of Gaining points"). The app must model two separate events: `scoreBattlefield` (conquer/hold) and `gainPoint`.
- **FACT (CR-OCT 830-832):** three keywords exist that L-CARDS has never seen: Deploy (gear played to a battlefield, killed "when an opponent holds here"), Disarm ("When I attack, give an enemy unit here -X [Might] this turn"), Show Off.
- **FACT (GAL, RULES.MD line 53):** Radiance (RAD) released 2026-10-23 and is Standard-legal. **DATA:** L-CARDS has 0 RAD cards; the riftcodex API (https://api.riftcodex.com/cards, 1,451 printings fetched 2026-11-11) also has 0 RAD cards. GAL is the only complete card source found today. 13 RAD cards in GAL have no card type filled in; `detect.py` infers it (has Might -> unit; `[Equip]`/`[Deploy]`/`[Exhaust]:` -> gear; else spell).
- **FACT (RULES.MD section 9, Rules Hub "Last updated: September 18, 2026"):** two of the point-related battlefields are banned in Standard since 2026-07-24: The Arena's Greatest (OGN-290) and Aspirant's Climb (OGN-276). **DATA:** they still appear in 19 and 10 of the 49 complete PA-SEP lists and in 0 of 37 PA-NOV lists, so PA-SEP contains lists older than the ban; treat PA-SEP as a historical corpus.
- **FACT (https://playriftbound.com news, "Testing Start of Game Rules", 2026-10-15, saved at `analysis/raw/start-of-game-test.html`):** Riot is testing start-of-game variants at events; one variant has the second player "start at 1 point". If adopted it changes every clock in section 1.5 by one scoring step for the second player. **UNCONFIRMED** which variant, if any, becomes a rule.
- **UNCONFIRMED:** placements. Piltover Archive deck pages carry no structured tournament or placement field (checked: no `tournament` or `placement` key in the page payload). The placement classes used in section 3 (win, top8, top64, bestof, event-only) are parsed from deck names by the sibling workflow's `analyze.mjs`; they are the uploader's claim, not a result table. No win-rate data exists in any source found.
- **UNCONFIRMED:** real game length. Section 1.5 gives rules-derived floors, not observed averages. No turn-count data was found locally or on the pages fetched.
- **DATA (new in v2):** the win-condition sub-score (section 4.6) does **not** separate placed lists from the rest: mean 0.691 for the 50 RAD-era lists named win/top 8 versus 0.727 for the other 151 (`detect.py placement`). It is a description of how a list is built, not a strength rating. Whether any deck-construction score predicts results stays UNCONFIRMED: there is no match-level data.
- **UNCONFIRMED:** current texts of pre-Radiance cards. `build_pool.py` found 35 of 931 L-CARDS texts differing from GAL (mostly wording, e.g. Brazen Buccaneer "discard 1" -> "discard a card"; placeholder texts for runes). Tianna Crownguard's printed text is superseded by errata (section 1.6).

## 1. FACT: how the game is won

### 1.1 Points and the win check

- **FACT (194.1):** points come from (a) holding a battlefield, (b) conquering a battlefield, (c) "Spells, Triggered Abilities and Activated Abilities that instruct them to gain one or more points", (d) an opponent burning out and picking you.
- **FACT (194.2, 323.1, 472):** you win if, **in a cleanup**, you have points >= the Victory Score **and** more points than any other player. Ties at or above the Victory Score continue "until one player has more points in a cleanup" (194.2.a-b).
- **FACT (194.3):** the Victory Score is 8 by default; modes or cards may change it (194.3.a).
- **FACT (194.4):** points cannot go below 0.
- **FACT (195, 195.1):** a player also wins "if an effect instructs them to do so, or if they are the only player remaining"; an effect that says a player loses removes them immediately.

### 1.2 Scoring: conquer and hold

- **FACT (469.1):** Conquer = "A player gains Control of a Battlefield they did not yet Score this turn." Control is established by having units there at the end of a showdown or combat (190.4, 466.5, 466.5.d).
- **FACT (469.2, 315.2.b):** Hold = keeping control of a battlefield not yet scored this turn during your Beginning Phase; the Scoring Step is the second step of the Beginning Phase, before Channel and Draw.
- **FACT (470):** "A player may only Score, from either method, once per Battlefield per turn." So scoring yields at most one point per battlefield per own turn: 2 in 1v1, 3 in the three-battlefield modes.
- **FACT (471.2):** scoring triggers the Conquer or Hold abilities at that battlefield, at most once per turn per player (471.2.c).
- **FACT (143.4, 144.2, 144.4):** units enter exhausted; a Standard Move costs exhausting the unit; it goes base -> battlefield or battlefield -> base; only Ganking allows battlefield -> battlefield (810.1.b). Units are played to your base or a battlefield you control (813.3.a). So a unit played this turn cannot conquer this turn unless something makes it ready: Accelerate (805.1.a, "[1][C]" extra), "I enter ready", or a ready effect.
- **FACT (466.1.a.2, 466.3.d):** if defenders survive, attackers are recalled; the combat has "No Result" and nobody conquers.
- **FACT (816.1.b):** Temporary is short for "At the start of this permanent's controller's Beginning Phase, before scoring, kill this." A Temporary unit can conquer on the turn it arrives and can never hold. **DATA:** 9 pool cards make Temporary unit tokens (`audit.py temp_token`: Sprite Call OGN-094, Sprite Mother OGN-106, Trevor Snoozebottom UNL-048, Sprite Burst UNL-069, Sprite Fountain UNL-078, Keeper of Masks UNL-081, Lillia, Fae Fawn UNL-082, Sprite Queen UNL-084, and the legend Lillia, Bashful Bloom UNL-189). Sprite tokens enter ready ("Play two ready 3 [Might] Sprite unit tokens with [Temporary].", Sprite Burst), so they are burst-conquer bodies, not holders.

### 1.3 The Final Point restriction

- **FACT (471.1.b, 471.1.b.1):** when a player would gain a point **through a Conquer** while at Victory Score minus 1 or higher, they gain it only "if the player has Scored every Battlefield this turn"; otherwise "that player draws a card instead".
- **FACT (471.1.a.1):** "points Gained from sources that are not Conquer are not beholden to these restrictions." A hold, a card that says "score 1 point", and a burn-out point all take you from 7 to 8 with no extra condition.
- **FACT (489.8.g.1, 2v2 only):** for the final point from conquer a player must score each battlefield in the same turn "excepting any that were occupied by their ally during the scoring step of that turn's Beginning Phase". CR-OCT 491.8.g.1 narrows this to conquers "during their or a teammate's turn".
- **HEURISTIC (consequence):** at 7 points in 1v1 there are exactly three ways to close: hold one battlefield at your next Beginning Phase; conquer both battlefields in one turn (or hold one and conquer the other, since the hold already wins); or gain a point from a card. A deck is judged on which of the three it can actually do (section 4.5).

### 1.4 Burn Out (empty Main Deck)

- **FACT (431.1, 431.2):** when a player must move more cards out of their Main Deck than it holds, they do as much as possible, **recycle their trash into the Main Deck, choose an opponent to gain 1 point**, then finish the action. An empty deck on the draw step triggers it (315.4.b.1) and the player "still Draws 1" (315.4.b.2).
- **FACT (431.1.c):** looking at or revealing more cards than the deck holds does not burn out.
- **FACT (431.3, 431.3.a-c):** with deck and trash both empty the player burns out repeatedly, 1 point to an opponent each time; points after the first in the sequence "cannot be replaced or prevented by any means" and can win the game immediately "without needing to wait for a cleanup" (431.3.c.1) if the receiver also leads.
- **FACT (440.4):** a Burn instruction larger than the deck burns, burns out, then burns the rest.
- **HEURISTIC:** a burn-out point is a gained point, not a conquer, so it is not under the Final Point restriction (471.1.a.1). Burning out is not a loss; it is a 1-point gift per cycle of the deck. In FFA the burned-out player chooses who gets the point (431.2.c): a kingmaking lever.

### 1.5 Victory Score and battlefields by mode; rules-derived clocks

| Mode | Rule | Players | Victory Score | Battlefields in play | Notes (FACT) |
|---|---|---|---|---|---|
| 1v1 Duel (Bo1) | 485 | 2 | 8 | 2 | each player brings 3, one chosen at random (485.5); second player channels an extra rune on turn 1 (485.7) |
| 1v1 Match (Bo3) | 486 | 2 | 8 | 2 | player selects 1 of 3; a battlefield used in a won game is removed for the match (486.5) |
| FFA3 Skirmish | 487 | 3 | 8 | 3 | first player skips first draw; last player channels an extra rune (487.7) |
| FFA4 War | 488 | 4 | 8 | 3 | first player's battlefields are not used (488.4.b) |
| 2v2 Magma Chamber | 489 | 4 | 11 | 3 | points shared by the team (489.8.d); control not shared (489.8.c); a battlefield a teammate controlled in your Beginning Phase cannot be scored by your team that turn (469.1.a, 489.8.b); you cannot move to a battlefield your teammate occupies (447.2.b) |

Rules-derived, uncontested ("goldfish") clocks. **HEURISTIC**, computed from the FACTs above (2 runes channelled per turn, 315.3.b; units enter exhausted):

| Line (1v1, Victory 8) | Points after own turn 1 / 2 / 3 / 4 / 5 / 6 | Wins |
|---|---|---|
| One unit on T1, conquer A on T2, conquer B on T3, then hold both | 0 / 1 / 3 / 5 / 7 / 8 (hold at start of T6) | start of turn 6 |
| A ready unit on T1 (Accelerate needs [1][C] extra) conquers A | 1 / 3 / 5 / 7 / 8 (hold at start of T5) | start of turn 5 |
| Two 1-cost units on T1, both battlefields conquered on T2 | 0 / 2 / 4 / 6 / 8 | start of turn 5 |
| Hold exactly one battlefield from T2 on, nothing else | 0 / 1 / 2 / 3 / 4 / 5 ... | start of turn 9 |

- Each non-conquer point (section 1.6) removes one scoring step, about half a turn on the two-battlefield line and a full turn on the one-battlefield line.
- Floor in 1v1 without bonus points: 8 points at 2 per turn is four scoring turns, so no deck wins before its turn 5.
- FFA (Victory 8, 3 battlefields): the per-turn cap is 3, so the theoretical floor is turn 4 (3 + 3 + 2), but two or three opponents act between your turns, combats are two-player only (462) and a battlefield with a staged combat between two others is an invalid destination (447.2.a). The final conquer point needs all three battlefields in one turn (471.1.b.1).
- 2v2 (Victory 11, 3 battlefields, shared points): a team takes two turns per round, but each battlefield can be held only by its controller on that controller's own turn and cannot be conquered by the partner that turn (469.1.a). A team that controls all three scores 3 per round, not 6. Floor about four rounds after the board is established.

### 1.6 Every card that changes how the game is won

Search: `win the game|lose the game|point(s)|score(s/d)|can't score|Victory` over L-CARDS rules text (931 cards), plus the same search over the 170 RAD cards in GAL. **DATA:** 29 distinct L-CARDS card names match once reminder text is stripped (48 with reminder text, the extra 19 being "before scoring" reminders on Temporary cards and similar), plus 3 RAD hits; every card that changes points or winning is listed. The detector's tag is in the last column.

**A. Alternate wins ("you win the game", rule 195) - 2 cards**

| Code | Card | Text (verbatim) | Tag |
|---|---|---|---|
| OGN-293 | The Grand Plaza (battlefield) | "When you hold here, if you have 7+ units here, you win the game." | altwin |
| UNL-088 | Gutter Palace (gear, Mind, cost 4) | "At the start of your Beginning Phase, if you have exactly 4 cards in hand and exactly 4 units at battlefields, you win the game.\nDiscard 1, [Exhaust]: Play a 1 [Might] Bird unit token with [Deflect]. (Opponents must pay [Any] to choose it with a spell or ability.)" | altwin |

No card in either pool says a player loses the game.

**B. Cards that give you a point outside conquer/hold scoring - 11 main-deck cards, 2 battlefields**

| Code | Card (domain, cost / Might) | Text (verbatim) | Trigger class |
|---|---|---|---|
| OGN-034 | Tryndamere, Barbarian (Fury, 7 / 8) | "When I conquer after an attack, if you assigned 5 or more excess damage to enemy units, you score 1 point." | conquer |
| OGN-066 | Ahri, Alluring (Calm, 5 / 4) | "When I hold, you score 1 point." | hold |
| OGN-205 | Yasuo, Windrider (Chaos, 5 / 4) | "[Ganking] (I can move from battlefield to battlefield.)\nThe third time I move in a turn, you score 1 point." | movement |
| SFD-088 | Renata Glasc, Mastermind (Mind, 5 / 4) | "[1][Mind]: Draw 1.\n[4][Mind][Mind][Mind][Mind], [Exhaust]: Score 1 point.\nUse my abilities only while I'm at a battlefield." | activated |
| SFD-148 | Draven, Audacious (Chaos, 6 / 6) | "[Deflect] (Opponents must pay [Any] to choose me with a spell or ability.)\nThe first time I win a combat each turn, you score 1 point.\nWhen I die in combat, choose an opponent. They score 1 point." | combat win (and a point gift on death) |
| UNL-177 | Ivern, Friend to All (Order, 6 / 6) | "As you play me, choose Bird, Cat, Dog, or Poro. I gain that tag.\nWhen I conquer or hold, score 1 point if your units have all of the following tags among them — Bird, Cat, Dog, and Poro." | conquer or hold |
| VEN-046 | Nasus, Ascended (Calm, 8 / 8) | "[Deflect 2] (Opponents must pay [Any][Any] to choose me with a spell or ability.)\n[Empower] [8] ([8]: Empower me. Use only if not Empowered.)\n[Empowered][>] When I conquer, you score 1 point." | conquer |
| VEN-065 | Swain, Visionary (Mind, 6 / 6) | "[Vision] (When you play me, look at the top card of your Main Deck. You may recycle it.)\nWhen I conquer, if you've played a non-token unit, a non-token gear, and a spell this turn, you score 1 point." | conquer |
| VEN-067 | Bottled Constellation (gear, Mind, cost 10) | "At the start of your Main Phase, you may kill 3 other friendly units and/or gear to score 1 point." | sacrifice engine |
| VEN-138 | Shen, Leader of the Kinkou Order (Order, 6 / 7) | "[Shield] (+1 [Might] while I'm a defender.)\nWhen I hold, if there is exactly one other unit you control here, you score 1 point." | hold |
| RAD-109 | Evelynn, In Control (Chaos, 4 / 4) RAD | "[Disarm] (When I attack, give an enemy unit here -1 [Might] this turn.)\nWhen I hold, if you control a facedown card here, score 1 point." | hold |
| SFD-214 | Power Nexus (battlefield) | "When you hold here, you may pay [Any][Any][Any][Any] to score 1 point." | hold |
| RAD-160 | Cosmic Vista (battlefield) RAD | "When you hold here, if your Rune Deck is empty, you score 1 point." | hold |

Symmetric or opponent-facing point effects:

| Code | Card | Text (verbatim) |
|---|---|---|
| OGN-290 | The Arena's Greatest (battlefield, banned in Standard since 2026-07-24) | "At the start of each player's first Beginning Phase, that player gains 1 point." |
| RAD-069 | Zero Point Inflection (Mind, cost 9, type blank in GAL) RAD | "When you play a card, draw 2.\nWhen you draw 1 or more cards with 9 or more other cards in your hand, discard your hand, kill this, and choose an opponent. They score 1 point." |

**C. Cards that stop or delay points - 4 cards**

| Code | Card | Text (verbatim) |
|---|---|---|
| SFD-060 | Tianna Crownguard (Calm, 7 / 4) | Printed: "[Deflect] (Opponents must pay [Any] to choose me with a spell or ability.)\nWhile I'm at a battlefield, opponents can't score points." Errata (FAQ-SFD): "While I'm at a battlefield, opponents can't gain points." |
| SFD-209 | Forgotten Monument (battlefield) | "Players can't score here until their third turn." |
| VEN-053 | Otterpus (Mind, 2 / 2) | "If a player would score 1 point from conquering or holding during their first or second turn, they draw 1 instead." |
| OGN-276 | Aspirant's Climb (battlefield, banned in Standard since 2026-07-24) | "Increase the points needed to win the game by 1." |

- **FACT (FAQ-SFD, Tianna entry):** Tianna "is solely concerned with points and doesn't interfere with the process of conquering or holding"; conquer and hold triggers still happen, and the draw-instead from the Final Point rule still happens.
- **FACT (FAQ-SFD, Forgotten Monument entry):** Forgotten Monument "completely prevents the process of scoring there. That means no conquer triggers, no hold triggers, and no points"; "'Extra' points such as those from Renata Glasc, Mastermind are unaffected."
- **FACT (FAQ-SFD via RUL.MD row D7; CR-OCT 473.1.b.1):** Draven, Audacious's combat-win point is gained before the conquer point. From 6 points one conquer with Draven does not win: the Draven point makes 7, and the conquer is then the Final Point and needs every battlefield scored that turn.

**D. Cards that only read the score (cost, tempo or stat changes) - 9 cards**

Draven, Showboat OGN-028 ("My Might is increased by your points."); Find Your Center OGN-047 and Leona, Zealot OGN-079 and Poppy, Paragon UNL-116 (discount or enter ready "If an opponent's score is within 3 points of the Victory Score"); Corrupted Dragon VEN-091 ("If your score is not within 3 points of the Victory Score, I enter ready."); Kai'Sa, Evolutionary OGN-112 (spell from trash "with Energy cost less than your points"); Needlessly Large Yordle SFD-055 ("I cost [2][Calm] less for each point you scored from holding this turn."); Chem-Baroness SFD-201 legend ("While your score is within 3 points of the Victory Score, your Gold [Add] an additional [1]."); Sumpworks Map UNL-085 ("When an opponent scores, draw 1."). Also Illaoi, Prophet of the Great Kraken VEN-109 ("when I score": a scoring trigger, not a point) and the Brush token UNL-T03 / Green Father UNL-195 (battlefield swap on scoring).

**E. Trigger doublers that multiply class-B cards - 2 cards and 1 battlefield (DATA: `audit.py doubler`)

Red Brambleback UNL-029 ("Your conquer effects for conquering here trigger an additional time."), Blue Sentinel UNL-087 ("Your hold effects for holding here trigger an additional time."), Reckoner's Arena OGN-286 ("When you hold here, activate the conquer effects of units here."). Corrected in v2: Karthus, Eternal OGN-236 ("Your [Deathknell] effects trigger an additional time.") and Detonation Amplifier RAD-017 ("Friendly [Deathknell] effects here trigger an additional time.") double Deathknell only and were removed from this class.

- **FACT (FAQ-UNL via RUL.MD row L7):** "activate conquer effects" on Reckoner's Arena does not make a conquer, and each ability still checks its own conditions (the FAQ example is Yone, Blademaster). So Reckoner's Arena fires Nasus, Ascended's Empowered conquer point on a hold, but Tryndamere, Barbarian (needs an attack with excess damage) and Swain, Visionary (needs three card types played this turn) must still meet their conditions.
- **UNCONFIRMED:** no official ruling was found for Blue Sentinel or Red Brambleback together with a class-B point card (searched GameLab `docs/research/official-faq/` and `rulings/` for the card names: 0 hits). The reading "two triggers, two points" is HEURISTIC.

## 2. Taxonomy of win routes actually present in the pool

Every route is defined by features the script can detect (regex over rules text with reminder text stripped, plus printed cost and Might). Feature list and weights: section 4. Pool counts are **DATA** from `pool_routes.py` over the 1,103-card GAL pool (`out-pool-routes.txt`). The number in brackets after a card is its copies (main + side) across the 201 distinct RAD-era lists of PA-CORPUS, so "(0)" means "exists, unplayed in the current corpus". "What stops it" and the mode notes are **HEURISTIC** unless a rule is cited; the percentages inside them are DATA.

Two structural points before the routes:

- **HEURISTIC:** Riftbound has no "closer" in the Magic sense. With two exceptions (The Grand Plaza, Gutter Palace) nothing ends the game; every deck wins by reaching 8 through battlefield scoring, at most 2 points per own turn in 1v1 (rule 470). A "closer" below means: the card that makes the deck's scoring plan work on the turn it matters. An "enabler" carries the route's features without doing that alone.
- **DATA:** Hidden / Ambush is not a scoring route. In v1 it was ranked against the others; in v2 it is a separate **delivery** axis. 52 of 201 RAD-era lists have a Hidden delivery score of 1.0 or more, and their scoring routes are BURST 22, TALL 19, HOLD 8, WIDE 3.

Where each scoring route sits (DATA, 201 distinct RAD-era lists, `detect.py table rad`; clock = uncontested estimate of section 4.4; final-point reach = means of the three numbers of 4.4):

| Primary route | Lists | Mean clock (range) | Median closer copies | Median interaction copies | Final point: hold / double conquer / direct |
|---|---|---|---|---|---|
| BURST | 53 | turn 6.6 (6-8) | 4 | 10 | 0.31 / 0.92 / 0.00 |
| WIDE | 44 | turn 6.7 (6-8) | 5 | 10 | 0.29 / 0.54 / 0.00 |
| TALL | 43 | turn 6.8 (6-9) | 4 | 7 | 0.42 / 0.63 / 0.00 |
| HOLD | 27 | turn 7.1 (6-9) | 2 | 11 | 0.86 / 0.49 / 0.02 |
| ATTRITION | 31 | turn 8.0 (6-10) | 5 | 14 | 0.19 / 0.34 / 0.00 |
| POINTS | 3 | (Yasuo x2, Nasus x1: point card as Chosen Champion) | 1 | - | 0.47 / 0.86 / 1.00 |

What the field main-decks against these routes (DATA, same 201 lists: share of lists with at least one main-deck copy, mean copies):

| Answer class | Share of lists | Mean copies | Most played (copies main + side) |
|---|---|---|---|
| kill / damage removal | 72% | 4.8 | Falling Star (136), Bilgewater Tracker (100), An Offer You Can't Refuse (100), Decree of Rage (99), Bellows Breath (96) |
| Deflect / can't be chosen / protection | 70% | 2.2 | Zhonya's Hourglass (117), Vex, Apathetic (104), Decree of Insight (81), Carrion Dredger (63), Ruin Runner (45) |
| displacement (move or bounce an enemy) | 60% | 2.9 | Star-Crossed (138), Gust (122), Bedeviling Stranger (101), Charm (80), Rebuke (59) |
| stun | 58% | 1.4 | Vex, Apathetic (104), Vi, Peacekeeper (72), Back Off (59) |
| counterspell | 47% | 1.2 | Defy (216), Hush (63), Hard Bargain (46), Abandon (27) |
| Shield | 22% | 0.9 | - |
| sweeper | 9% | 0.2 | Unchecked Power (28), Flurry of Blades (24), Angler Beast (16), Avalanche (12), Downwell (6) |

The detector prints these numbers inside every "folds to" line and orders the lines by them, so a weakness that 72% of the field can punish is listed before one that 9% can.

### 2.1 WIDE: go-wide flood of both battlefields

- **Detectable properties:** unit-token makers, cards that make two or more tokens, payoffs that count or pump all your units, units costing 2 or less. 53 closers and 89 enablers in the pool.
- **Closers:** Ferrous Forerunner SFD-021 (79), Sprite Fountain UNL-078 (57), Sprite Burst UNL-069 (44), Concert Poster RAD-116 (35), Baron Nashor UNL-147 (33), Vanguard Captain OGN-218 (29), Up from the Deep VEN-100 (21), Faithful Manufactor OGN-211 (18), Forge of the Future OGN-212 (15). (Unchecked Power OGN-123 (28) is tagged here by the "all friendly units" pattern; it is a sweeper: known false positive, section 5.2.)
- **Enablers:** Scuttle Crab UNL-053 (118), Trifarian Captain RAD-129 (109), Traveling Merchant OGN-185 (78), Plundering Poro SFD-069 (70), Carrion Dredger UNL-153 (63).
- **Legends (pool, by text):** Viktor, Herald of the Arcane ("[1], [Exhaust]: Play a 1 [Might] Recruit unit token."), Lillia, Bashful Bloom, Azir, Emperor of the Sands, Garen, Might of Demacia ("When you conquer, if you have 4+ units at that battlefield, draw 2."), LeBlanc, Deceiver, Master Yi, Wuju Master. **Legends (DATA, primary WIDE in the RAD-era lists):** Viktor 6 of 6, Rek'Sai 4 of 4, Mordekaiser 5 of 7, Lillia 3 of 3, Darius 3 of 3, Seraphine 3 of 3, Azir 3 of 3.
- **Battlefields:** by text: Altar to Unity OGN-275, Black Rose Sanctum RAD-159, Emperor's Dais SFD-207, Trapping Grounds UNL-217, The Grand Plaza OGN-293 (alternate win at 7+ units), Trifarian War Camp OGN-294 ("Units here have +1 [Might]."). **DATA** (share in WIDE lists vs all lists): Trifarian War Camp 20% vs 6%, Black Rose Sanctum 14% vs 4%, Seat of Power 23% vs 10%.
- **Typical win turn:** 6-7. It scores two battlefields per turn early (the "two 1-cost units" line of 1.5).
- **The Temporary problem (FACT 816.1.b + DATA):** the most played mass-token cards (Sprite Fountain, Sprite Burst) make Temporary Sprites that die before the scoring step. A Sprite deck conquers; it does not hold. At 7 points its last point must be a double conquer or a hold by a non-token unit. The detector prints this with the deck's own counts (Viktor example in section 5: 6 of 13 token-maker copies are Temporary, double-conquer reach 0.58, hold reach 0.25).
- **What stops it:** damage sweepers (13 in the pool; main-decked by 9% of lists, the least-played answer class), Shield/Tank blockers that out-Might a token stack, Frozen Fortress UNL-212 ("At the start of each player's Beginning Phase, deal 1 to each unit here."; in 61% of ATTRITION lists, 11% of all lists), Vex, Apathetic UNL-150 (104).
- **2v2:** a unit cannot move to a battlefield the teammate occupies (447.2.b), so extra bodies idle once the partner sits on a battlefield. **FFA:** strong at taking the third, undefended battlefield; with 9% of lists main-decking a sweeper, P(at least one opponent has one) is 0.18 with two opponents and 0.26 with three.

### 2.2 TALL: one Mighty threat

- **Detectable properties:** units with Might 6+, self-scaling Might text, `[Mighty]` payoffs (Mighty = Might 5+, rule 708), buffs, Equipment, +Might tricks, Deflect / can't-be-chosen. 128 closers, 195 enablers.
- **Closers:** Thousand-Tailed Watcher OGN-116 (124), Astral Heron VEN-044 (98), Ferrous Forerunner SFD-021 (79), Rengar, Trophy Hunter UNL-120 (78), Ruin Runner SFD-105 (45; "I can't be chosen by enemy spells and abilities."), Rhasa the Sunderer OGN-195 (39), The Empyrean RAD-060 (36), Elder Dragon UNL-118 (33), Baron Nashor UNL-147 (33).
- **Enablers:** Discipline OGN-058 (209), Zhonya's Hourglass OGN-077 (117), Punch First SFD-097 (117), Rampage VEN-083 (95), Decree of Focus VEN-040 (86), Decree of Insight VEN-061 (81).
- **Legends (pool):** Volibear, Relentless Storm; Lee Sin, Blind Monk; Leona, Radiant Dawn; Sett, The Boss; Fiora, Grand Duelist; Rengar, Pridestalker; Kha'Zix, Voidreaver. **Legends (DATA):** Sett 6 of 6, Master Yi, Wuju Bladesman 4 of 4, Rengar 4 of 4, Riven 9 of 17, Evelynn 5 of 8, Volibear 2 of 2.
- **Battlefields:** by text: Sunken Temple SFD-218, Navori Fighting Pit OGN-283, Valley of Idols UNL-218, Back-Alley Bar OGN-277, Packed Amphitheater RAD-164 ("Champion units here have +1 [Might]."). **DATA:** Valley of Idols 14% vs 3%, Monastery of Hirana 21% vs 5%, Rakelstake 21% vs 7%, Emperor's Dais 26% vs 10%.
- **Typical win turn:** 6-9. One big unit takes or holds one battlefield per turn (the 1-point line) unless a second body or a ready effect covers the other battlefield.
- **What stops it:** single-target removal (72% of lists, 4.8 copies), displacement (60%), stun (58%; a stunned unit "doesn't deal combat damage this turn"), Might reduction (Stupefy OGN-095 (142)), chump defence: one surviving defender recalls the attacker (466.1.a.2), gear removal when the Might is Equipment. TALL lists run the least interaction (median 7), so they also lose races. The Final Point rule is the structural weakness: one threat cannot conquer both battlefields in a turn without Ganking plus a ready effect.
- **2v2:** good; the partner covers other battlefields and friendly buffs can target a teammate's unit (489.8.e). **FFA:** a closer faces about 10-14 single-target answers across two or three opposing main decks (4.8 per list).

### 2.3 HOLD: hold and defend

- **Detectable properties:** "When I hold" / "When you hold" payoffs, Shield, Tank, stun, "defend" text. 49 closers, 61 enablers.
- **Closers:** Blitzcrank, Impassive OGN-067 (61), Xin Zhao, Vigilant SFD-176 (22), Fiora, Victorious OGN-232 (17), Dockside Lock-Up RAD-136 (17), Orianna, Exquisite RAD-042 (15), Vilemaw UNL-060 (15), K'Sante, Courageous RAD-086 (14); hold-point cards Ahri, Alluring OGN-066 (2), Shen, Leader of the Kinkou Order VEN-138 (1), Evelynn, In Control RAD-109 (0).
- **Enablers:** Vex, Apathetic UNL-150 (104), Vi, Peacekeeper UNL-176 (72), Back Off UNL-042 (59), Lecturing Yordle OGN-087 (37), The Good Stuff RAD-106 (32), Mutated Mouser UNL-036 (30), Stalwart Poro OGN-052 (29).
- **Legends (pool):** Vex, Gloomist ("When you or an ally hold, you may exhaust me to draw 1."), Poppy, Keeper of the Hammer, Renata Glasc, Chem-Baroness, Ivern, Green Father, Master Yi, Wuju Bladesman ("While a friendly unit defends alone, it gets +2 [Might]."), Shen, Eye of Twilight, Rumble, Mechanized Menace, K'Sante, Pride of Nazumah. **Legends (DATA):** K'Sante 6 of 6, Vex 5 of 5, Ivern 3 of 3, Shen 2 of 2, LeBlanc 3 of 7, Evelynn 3 of 8.
- **Battlefields:** 22 carry a hold or defend clause. **DATA:** Startipped Peak 22% vs 5%, Bandle Scouts' Academy 30% vs 7%, Grove of the God-Willow 22% vs 8%, Fortified Position 15% vs 2%.
- **Typical win turn:** 7 (6-9). Holding is the only scoring that ignores the Final Point restriction (471.1.a.1), so this route always has a legal last point (hold reach 0.86 on average); its problem is the first seven.
- **What stops it:** displacement before the Beginning Phase (the hold is checked in the scoring step, 315.2.b; 60% of lists main-deck displacement, 2.9 copies), Assault and pump on the attack, Forbidding Waste UNL-210 ("While a unit here is defending alone, it has -2 [Might]."), Frozen Fortress on low-Might holders, Tianna Crownguard against hold-point cards.
- **2v2:** each battlefield is held only by its controller on that controller's turn, and a teammate-controlled battlefield cannot be scored by you that turn (469.1.a). **FFA:** best route for the final point, worst for the first seven: the holder must survive two or three opposing turns per round.

### 2.4 BURST: burst conquer through ready, haste and movement

- **Detectable properties:** Accelerate, "I enter ready", effects that ready a unit, Ganking, friendly-move effects, "When I move" payoffs (new in v2), Assault, conquer triggers. 107 closers, 152 enablers. (Accelerate is on 32 pool cards, Ganking on 39, unit-ready effects on 71, move payoffs on 30: DATA, `audit.py`.)
- **Closers:** Thousand-Tailed Watcher OGN-116 (124), Kai'Sa, Survivor OGN-039 (96), Ride the Wind OGN-173 (74; "Move a friendly unit and ready it."), Sprite Fountain UNL-078 (57), Sprite Burst UNL-069 (44), Nocturne, Horrifying OGN-194 (33), Riven, Broken Blade RAD-043 (24), Irelia, Fervent SFD-057 (21).
- **Enablers:** Reckless Innovator RAD-105 (104), Tideturner OGN-199 (95), Stellacorn Herder SFD-048 (89; "When I move, draw 1."), Traveling Merchant OGN-185 (78), First Mate OGN-132 (58), Irresistible Faefolk UNL-112 (57), Treasure Hunter SFD-130 ("When I move, play a Gold gear token exhausted.").
- **Legends (pool):** Riven, The Exile ("Units you play to battlefields you control enter ready."), Yasuo, Unforgiven ("[2], [Exhaust]: Move a friendly unit to or from your base."), Miss Fortune, Bounty Hunter, Irelia, Blade Dancer, Vi, Piltover Enforcer, Ambessa, Matriarch of War, Akali, Rogue Assassin, Kennen, Heart of the Tempest (gives [Assault 2]), Sett, The Boss, Jarvan IV, Exemplar of Demacia, K'Sante, Pride of Nazumah (Shield becomes Assault). **Legends (DATA):** Kennen 10 of 10, Vi 5 of 5, Diana 4 of 4, Kha'Zix 6 of 7, Akali 5 of 7, Irelia 4 of 5, Ekko 3 of 4, Riven 8 of 17.
- **Battlefields:** by text: Windswept Hillock OGN-297 ("Units here have [Ganking]."), Firelights' Hideout RAD-162, Hall of Legends SFD-210, Targon's Peak OGN-289, Sigil of the Storm OGN-287. **DATA:** Minefield 26% vs 10%, Zaun Warrens 26% vs 11%, Abandoned Hall 13% vs 5%, Sandswept Tomb 15% vs 7%.
- **Typical win turn:** 6 (6-8). The most common primary route in the corpus (53 of 201; 15 of the 50 lists named win/top 8) and the only one that satisfies the Final Point restriction by conquest (double-conquer reach 0.92).
- **What stops it:** stun on the readied attacker (58% of lists), Shield/Tank defenders (22%), Vex, Apathetic UNL-150, Minotaur Reckoner SFD-014 ("Units can't move to base."), counterspells on the ready spell (Defy OGN-045 (216), Hush RAD-041 (63), Hard Bargain SFD-136 (46)).
- **2v2:** Ganking and move effects lose every teammate-occupied destination (447.2.b). **FFA:** the final conquer needs all three battlefields in one turn (471.1.b.1) and a battlefield with a pending combat between two other players cannot be entered (447.2.a). The detector prints a separate triple-conquer reach (move copies / 18 instead of / 12).

### 2.5 POINTS: direct point gain

- **Detectable properties:** the 11 main-deck cards and 2 battlefields of section 1.6 B; the trigger doublers of 1.6 E.
- **Closers:** the 11 cards. **Enablers:** Blue Sentinel UNL-087 and Red Brambleback UNL-029, Reckoner's Arena OGN-286; move and ready effects for Yasuo, Windrider; Bird/Cat/Dog/Poro units for Ivern, Friend to All.
- **Typical win turn:** each resolved trigger removes one scoring step. A hold-point unit that survives two of your Beginning Phases turns the one-battlefield line (turn 9) into turn 7.
- **What stops it:** killing or displacing the one unit (only Draven, Audacious and Nasus, Ascended have Deflect), Tianna Crownguard ("opponents can't gain points" after errata; 0 copies in the corpus), cost (Renata's ability is [4] plus four Mind power; Nasus needs [8] to Empower; Bottled Constellation costs 10).
- **DATA (201 RAD-era lists, main + side):** Yasuo, Windrider in 2 lists (both with Yasuo, Unforgiven, both as Chosen Champion), Draven, Audacious 2, Nasus, Ascended 1, Shen, Leader of the Kinkou Order 1, Ahri, Alluring 1, Red Brambleback 1. No list named win/top 8 plays one. In the 81 older lists Nasus, Ascended appears in 3 more. The route exists; today it is played as a champion engine (Yasuo, Windrider twice, Nasus, Ascended once).
- **v2 rule:** a point card that is the Chosen Champion starts in the Champion Zone (103.2.a.1) and is counted as 4 copies. That makes three lists POINTS-primary: both Yasuo, Unforgiven lists and one Nasus, Curator of the Sands list with Nasus, Ascended as champion (named "NASUS TEST RC", no placement).
- **2v2:** points are shared (489.8.d) and Victory is 11. One of the two Yasuo lists is named "RC Stuttgart 2v2 5-0". **FFA:** gained points ignore the three-battlefield final-point condition (471.1.a.1); Draven, Audacious hands a point to a chosen opponent on death: a kingmaking liability.

### 2.6 HIDDEN delivery: Hidden / Ambush tempo (an axis, not a route)

- **Detectable properties:** Hidden units, Ambush, payoffs for hiding or playing from face down. 33 closers, 38 enablers. Hidden cards gain Reaction while face down (811.6); Ambush lets a unit be played at Reaction speed to a battlefield where you have units (822.1.b).
- **Closers:** Rengar, Trophy Hunter UNL-120 (78), Vi, Peacekeeper UNL-176 (72), Nidalee, Cat Form UNL-114 (39), Tornado Warrior VEN-099 (32), Pyke, Returned UNL-145 (30), Edge of Night SFD-139 (27), Kha'Zix, Mutating Horror UNL-143 (24), Evelynn, Entrancing UNL-141 (20), Gutter Guardian RAD-103 (18). (Scuttle Crab UNL-053 (118) is tagged by "You can look at their facedown cards": false positive, section 5.2.)
- **Enablers:** Bedeviling Stranger RAD-107 (101), Tideturner OGN-199 (95), Switcheroo SFD-145 (94), Hidden Blade OGN-213 (81), Temporal Breach VEN-066 (79).
- **Legends:** Teemo, Swift Scout; Evelynn, Agony's Embrace ("Once each turn, when you play a card from face down, draw 1. Then, if it's not your turn, discard 1."). **DATA:** delivery score 1.0+ in Evelynn 8 of 8, Riven 13 of 17, Rengar 4 of 4, Vex 4 of 5, Irelia 4 of 5, Vi 4 of 5, Kennen 4 of 10. **Battlefields:** Bandle Tree OGN-278, Bandle Scouts' Academy RAD-157.
- **What it does:** wins the combat the opponent thought was safe; the points still come from conquer or hold. The report shows "identity: HIDDEN tempo that scores by X" when the delivery score exceeds the best scoring route.
- **What stops it:** Noxus Saboteur OGN-018 (2 copies in the corpus; "Your opponents' [Hidden] cards can't be revealed here."), Mystic Vortex VEN-160 (0 copies), losing control of the battlefield (466.5.c removes Hidden cards that do not share a controller with the battlefield). **DATA:** dedicated Hidden hate is effectively unplayed.
- **2v2:** you may not hide cards at a battlefield your teammate controls (489.8.c.1). **FFA:** hidden information is worth more against several opponents.

### 2.7 ATTRITION: removal, recursion, inevitability

- **Detectable properties:** kill/damage removal, sweepers, counterspells, trash recursion (Flow, Deathknell, "from your trash"), draw, displacement, Might reduction. 86 closers, 293 enablers: nearly every deck has some, which is why the score is normalised against the field (4.3).
- **Closers:** Thousand-Tailed Watcher OGN-116 (124), Astral Heron VEN-044 (98), Ferrous Forerunner SFD-021 (79), Rhasa the Sunderer OGN-195 (39), The Empyrean RAD-060 (36), Elder Dragon UNL-118 (33), Baron Nashor UNL-147 (33), Unchecked Power OGN-123 (28), Flurry of Blades OGN-133 (24).
- **Enablers:** Defy OGN-045 (216), Discipline OGN-058 (209), Stupefy OGN-095 (142), Star-Crossed UNL-128 (138), Falling Star OGN-029 (136), Gust OGN-169 (122).
- **Legends (pool):** Kai'Sa, Daughter of the Void; Ezreal, Prodigal Explorer; Jhin, Virtuoso; Lux, Lady of Luminosity; Mel, Soul's Reflection; Ahri, Nine-Tailed Fox; Mordekaiser, Iron Revenant; Jinx, Loose Cannon; Zed, Master of Shadows. **Legends (DATA):** Kai'Sa 15 of 15, Jayce 3 of 3, LeBlanc 4 of 7, Ziggs 3 of 4.
- **Battlefields (DATA, the clearest signal in the corpus):** Void Gate OGN-296 65% of ATTRITION lists vs 15% of all ("Spells and abilities affecting units here each deal 1 Bonus Damage."), Frozen Fortress UNL-212 61% vs 11%, Rockfall Path 58% vs 24%. A control list brings battlefields that damage units, not battlefields that score.
- **Typical win turn:** 8.0 uncontested (6-10), the slowest; in practice later, because the plan is to deny the opponent's scoring first. Final-point reach is the lowest of all routes (hold 0.19, double conquer 0.34): the list wins by leaving the opponent with no units, after which any conquer or hold is uncontested.
- **What stops it:** two-battlefield pressure (few units cannot contest both; points lost early are permanent), Deflect and can't-be-chosen threats (70% of lists, 2.2 copies), its own draw volume late (Burn Out gives the opponent a point, 431.2.c).
- **2v2:** Victory 11 lengthens the game, and spells may be played on the teammate's turn when invited (489.8.a). **FFA:** one-for-one removal loses to two or three boards; sweepers scale, and only 9% of lists play one.

### 2.8 Battlefield point engines and battlefield denial

- **FACT:** three legal battlefields add points or win: Power Nexus SFD-214 (hold, pay [Any] x4), Cosmic Vista RAD-160 (hold with an empty Rune Deck: 12 runes at 2 per turn and the hold is checked before the Channel Phase, so the scoring step of turn 7 at the earliest without extra channel effects), The Grand Plaza OGN-293 (alternate win). The Arena's Greatest and Aspirant's Climb are banned.
- **HEURISTIC:** in Bo1 a listed battlefield is in play in one game of three for its owner (random pick, 485.5), and the opponent benefits equally because battlefield text addresses whoever holds or conquers it. Count a battlefield engine as a bonus, never as the plan. In Bo3 the player chooses (486.5).
- **DATA (201 RAD-era lists):** 0 lists bring Power Nexus, Cosmic Vista or The Grand Plaza. The scoring-related battlefield that is played is a denial one: Forgotten Monument SFD-209 ("Players can't score here until their third turn.") in 16 lists (8%), 13% of ATTRITION lists. Reckoner's Arena appears in 1.

### 2.9 Legend engines

- **FACT:** no legend in L-CARDS or GAL gains points by itself. Chem-Baroness only reads the score.
- **HEURISTIC:** a legend defines the route by supplying the same feature every turn. The detector counts each legend feature as 4 copies of a card (4.3) and treats the legend as a guaranteed closer when it supplies the route's closer feature. v2 adds two explicit legend conversions, because keyword presence alone misreads these decks:
  - Riven, The Exile ("Units you play to battlefields you control enter ready."): the legend's enter-ready is weighted like a haste unit (1.0, not 0.5).
  - K'Sante, Pride of Nazumah ("Give a friendly unit \"I have [Assault] equal to my [Shield]\" this turn."): every Shield unit also counts toward BURST (0.75), and a Shield unit with Might 4+ is a BURST closer.

### 2.10 Combo finishers and alternate wins

| Combo (all texts in 1.6) | What it does | Pieces | Status |
|---|---|---|---|
| Yasuo, Windrider as Chosen Champion + Yasuo, Unforgiven + Ride the Wind | third move in a turn scores 1 point that is not a conquer; legend supplies one move per turn for [2] | champion + legend + 1 move/ready card | FACT for the texts. **DATA:** 2 RAD-era lists, 3x Ride the Wind and 2x Flash in the one shown in section 5 |
| Gutter Palace | win at Beginning Phase with exactly 4 cards in hand and exactly 4 units at battlefields | 1 card + hand/board control | FACT for the text. **DATA:** 3 distinct RAD-era Jayce, Defender of Tomorrow lists play it (3, 2 and 1 main-deck copies), two of them named 7th and 8th at "Orlando 25K"; the legend readies gear ("[1], [Exhaust]: Ready a gear."), which repeats the Bird-token ability to set the unit count |
| Blue Sentinel + Ahri, Alluring / Shen, Leader of the Kinkou Order / Evelynn, In Control at the same battlefield | hold trigger twice | 2 cards | HEURISTIC reading; no official ruling found: UNCONFIRMED. DATA: 0 lists |
| Red Brambleback + Nasus, Ascended / Swain, Visionary / Tryndamere, Barbarian | conquer trigger twice | 2 cards + condition | UNCONFIRMED, same reason. DATA: 0 lists with both |
| Reckoner's Arena + Nasus, Ascended (Empowered) | on hold, "activate the conquer effects of units here" | battlefield + 1 card + [8] | FACT that conditions are still checked (FAQ-UNL, RUL.MD L7); the point on hold is a HEURISTIC consequence |
| The Grand Plaza + token flood | win on hold with 7+ units there | battlefield + WIDE deck | FACT for the text; Temporary Sprites die before the hold (816.1.b), so only permanent tokens count. DATA: 0 RAD-era lists |
| Ivern, Friend to All + Bird, Cat, Dog and Poro tags | +1 point on each conquer or hold | 1 card + tag set | FACT for the text. DATA: 0 lists |

All gained points here bypass the Final Point restriction (471.1.a.1).

### 2.11 Not a route in this pool

- **Milling the opponent out.** DATA: only two cards make an opponent burn cards (Blade Twirler VEN-002 "choose a player. They [Burn 1]"; Kharox VEN-114 "choose an opponent. They [Burn 3]"). With 40-card decks and one point per burn-out this is support, not a plan.
- **Point denial as a plan.** Tianna Crownguard, Otterpus and Forgotten Monument delay; none of them wins.

## 3. DATA: which legends win by which routes

Method: `detect.py table rad` over PA-CORPUS. Primary route = highest rank score among the six scoring routes (4.3). Identical 40-card lists under the same legend are merged (53 duplicates merged in the RAD era; the merged list keeps the best placement class among its copies). "delivery>=1" = lists whose Hidden delivery score is 1.0 or more. Clock, closer copies and sub-score are means over the legend's lists.

### 3.1 RAD era, n = 201 distinct lists (Radiance legal; fetched 2026-11-11)

```
Riven, The Exile                   n 17 | TALL 9, BURST 8                    | delivery>=1: 13 | clock 6.2 | closers 3.4 | score 0.77
Kai'Sa, Daughter of the Void       n 15 | ATTRITION 15                       | delivery>=1:  0 | clock 8.3 | closers 4.8 | score 0.54
Kennen, Heart of the Tempest       n 10 | BURST 10                           | delivery>=1:  4 | clock 6.5 | closers 5.1 | score 0.63
Orianna, Lady of Clockwork         n  8 | WIDE 3, HOLD 2, ATTRITION 2, TALL 1 | delivery>=1:  0 | clock 7.5 | closers 3.5 | score 0.60
Evelynn, Agony's Embrace           n  8 | TALL 5, HOLD 3                     | delivery>=1:  8 | clock 8.2 | closers 2.6 | score 0.49
Kha'Zix, Voidreaver                n  7 | BURST 6, TALL 1                    | delivery>=1:  3 | clock 6.1 | closers 1.3 | score 0.77
LeBlanc, Deceiver                  n  7 | ATTRITION 4, HOLD 3                | delivery>=1:  0 | clock 6.4 | closers 7.7 | score 0.90
Akali, Rogue Assassin              n  7 | BURST 5, HOLD 2                    | delivery>=1:  0 | clock 7.9 | closers 3.3 | score 0.81
Mordekaiser, Iron Revenant         n  7 | WIDE 5, BURST 2                    | delivery>=1:  0 | clock 6.0 | closers 5.9 | score 0.84
Viktor, Herald of the Arcane       n  6 | WIDE 6                             | delivery>=1:  0 | clock 6.8 | closers 7.0 | score 0.82
Sett, The Boss                     n  6 | TALL 6                             | delivery>=1:  0 | clock 6.2 | closers 3.5 | score 0.88
K'Sante, Pride of Nazumah          n  6 | HOLD 6                             | delivery>=1:  0 | clock 7.2 | closers 2.2 | score 0.98
Irelia, Blade Dancer               n  5 | BURST 4, TALL 1                    | delivery>=1:  4 | clock 7.4 | closers 3.6 | score 0.79
Vex, Gloomist                      n  5 | HOLD 5                             | delivery>=1:  4 | clock 7.2 | closers 1.6 | score 0.86
Vi, Piltover Enforcer              n  5 | BURST 5                            | delivery>=1:  4 | clock 6.0 | closers 9.2 | score 0.82
Master Yi, Wuju Bladesman          n  4 | TALL 4                             | delivery>=1:  1 | clock 6.0 | closers 5.0 | score 0.70
Diana, Scorn of the Moon           n  4 | BURST 4                            | delivery>=1:  0 | clock 6.5 | closers 4.8 | score 0.61
Ekko, Boy Who Shattered Time       n  4 | BURST 3, WIDE 1                    | delivery>=1:  1 | clock 6.2 | closers 8.5 | score 0.73
Ziggs, Hexplosives Expert          n  4 | ATTRITION 3, WIDE 1                | delivery>=1:  0 | clock 8.0 | closers 3.2 | score 0.45
Rek'Sai, Void Burrower             n  4 | WIDE 4                             | delivery>=1:  0 | clock 6.0 | closers 5.8 | score 0.76
Rengar, Pridestalker               n  4 | TALL 4                             | delivery>=1:  4 | clock 6.0 | closers 1.8 | score 0.65
Poppy, Keeper of the Hammer        n  4 | TALL 2, HOLD 1, WIDE 1             | delivery>=1:  0 | clock 8.2 | closers 7.2 | score 0.76
Lillia, Bashful Bloom              n  3 | WIDE 3                             | delivery>=1:  0 | clock 6.7 | closers 8.7 | score 0.97
Ivern, Green Father                n  3 | HOLD 3                             | delivery>=1:  0 | clock 6.0 | closers 2.7 | score 0.92
Azir, Emperor of the Sands         n  3 | WIDE 3                             | delivery>=1:  0 | clock 7.0 | closers 1.0 | score 0.69
Jarvan IV, Exemplar of Demacia     n  3 | TALL 2, BURST 1                    | delivery>=1:  0 | clock 6.3 | closers 3.7 | score 0.73
Nasus, Curator of the Sands        n  3 | POINTS 1, TALL 1, ATTRITION 1      | delivery>=1:  0 | clock 6.3 | closers 5.7 | score 0.79
Darius, Hand of Noxus              n  3 | WIDE 3                             | delivery>=1:  0 | clock 6.3 | closers 4.7 | score 0.70
Seraphine, Starry-Eyed Songstress  n  3 | WIDE 3                             | delivery>=1:  0 | clock 7.0 | closers 11.3 | score 0.69
Jayce, Defender of Tomorrow        n  3 | ATTRITION 3                        | delivery>=1:  0 | clock 8.7 | closers 2.7 | score 0.50
Zed, Master of Shadows             n  3 | WIDE 2, BURST 1                    | delivery>=1:  0 | clock 6.7 | closers 3.7 | score 0.65
Jhin, Virtuoso                     n  3 | WIDE 2, ATTRITION 1                | delivery>=1:  0 | clock 8.0 | closers 4.7 | score 0.60
Yasuo, Unforgiven                  n  2 | POINTS 2                           | delivery>=1:  0 | clock 7.5 | closers 1.0 | score 0.94
Volibear, Relentless Storm         n  2 | TALL 2                             | delivery>=1:  0 | clock 8.5 | closers 15.5 | score 0.77
Ornn, Fire Below the Mountain      n  2 | WIDE 2                             | delivery>=1:  0 | clock 6.0 | closers 3.0 | score 0.50
Pyke, Bloodharbor Ripper           n  2 | WIDE 1, BURST 1                    | delivery>=1:  2 | clock 6.0 | closers 0.5 | score 0.29
Shen, Eye of Twilight              n  2 | HOLD 2                             | delivery>=1:  1 | clock 6.0 | closers 4.0 | score 0.75
Teemo, Swift Scout                 n  1 | WIDE 1                             | delivery>=1:  1 | clock 6.0 | closers 3.0 | score 0.57
Master Yi, Wuju Master             n  1 | WIDE 1                             | delivery>=1:  0 | clock 6.0 | closers 1.0 | score 0.90
Ezreal, Prodigal Explorer          n  1 | ATTRITION 1                        | delivery>=1:  0 | clock 10.0 | closers 2.0 | score 0.42
Leona, Radiant Dawn                n  1 | TALL 1                             | delivery>=1:  1 | clock 6.0 | closers 3.0 | score 0.84
Lucian, Purifier                   n  1 | TALL 1                             | delivery>=1:  0 | clock 7.0 | closers 3.0 | score 0.61
Renekton, Butcher of the Sands     n  1 | TALL 1                             | delivery>=1:  0 | clock 6.0 | closers 4.0 | score 0.71
Ahri, Nine-Tailed Fox              n  1 | ATTRITION 1                        | delivery>=1:  0 | clock 7.0 | closers 3.0 | score 0.55
Sivir, Battle Mistress             n  1 | BURST 1                            | delivery>=1:  0 | clock 8.0 | closers 3.0 | score 0.67
Jax, Grandmaster at Arms           n  1 | TALL 1                             | delivery>=1:  0 | clock 8.0 | closers 1.0 | score 0.83
Miss Fortune, Bounty Hunter        n  1 | BURST 1                            | delivery>=1:  0 | clock 8.0 | closers 3.0 | score 0.67
Rumble, Mechanized Menace          n  1 | BURST 1                            | delivery>=1:  0 | clock 7.0 | closers 6.0 | score 0.77
Lee Sin, Blind Monk                n  1 | TALL 1                             | delivery>=1:  0 | clock 8.0 | closers 5.0 | score 0.84
Draven, Glorious Executioner       n  1 | WIDE 1                             | delivery>=1:  1 | clock 6.0 | closers 2.0 | score 0.54
Mel, Soul's Reflection             n  1 | WIDE 1                             | delivery>=1:  0 | clock 8.0 | closers 3.0 | score 0.57
primary route totals [('BURST', 53), ('WIDE', 44), ('TALL', 43), ('ATTRITION', 31), ('HOLD', 27), ('POINTS', 3)] n 201
secondary route totals [('BURST', 69), ('TALL', 55), ('ATTRITION', 39), ('WIDE', 20), ('HOLD', 17), ('POINTS', 1)]
hidden delivery (norm >= 1): 52
specials [('ALTWIN', 3), ('COMBO', 2)]
point cards in main decks: [('Yasuo, Windrider', 2), ('Draven, Audacious', 1), ('Nasus, Ascended', 1), ('Ahri, Alluring', 1)]
by primary route: n, mean clock, median closers, median interaction, mean sub-score
  WIDE      n  44 | clock 6.7 (6-8) | closers 5 | interaction 10 | score 0.72
  TALL      n  43 | clock 6.8 (6-9) | closers 4 | interaction 7 | score 0.70
  HOLD      n  27 | clock 7.1 (6-9) | closers 2 | interaction 11 | score 0.86
  BURST     n  53 | clock 6.6 (6-8) | closers 4 | interaction 10 | score 0.74
  POINTS    n   3 | clock 7.0 (6-8) | closers 1 | interaction 16 | score 0.95
  ATTRITION n  31 | clock 8.0 (6-10) | closers 5 | interaction 14 | score 0.56
```

Per-list lines with deck names: `analysis/wincons/out-rad.txt`.

### 3.2 RAD-era lists named as a win or a top 8, n = 50

Placement is the uploader's wording in the deck name (section 0): treat as a claim.

```
Riven, The Exile                   n  8 | BURST 5, TALL 3                    | delivery>=1:  7 | clock 6.2 | closers 2.8 | score 0.78
Kai'Sa, Daughter of the Void       n  5 | ATTRITION 5                        | delivery>=1:  0 | clock 8.4 | closers 5.0 | score 0.55
Evelynn, Agony's Embrace           n  3 | TALL 3                             | delivery>=1:  3 | clock 8.0 | closers 3.3 | score 0.45
Kennen, Heart of the Tempest       n  3 | BURST 3                            | delivery>=1:  0 | clock 6.3 | closers 5.0 | score 0.63
Akali, Rogue Assassin              n  3 | BURST 2, HOLD 1                    | delivery>=1:  0 | clock 7.7 | closers 3.3 | score 0.81
Ekko, Boy Who Shattered Time       n  2 | WIDE 1, BURST 1                    | delivery>=1:  1 | clock 6.0 | closers 9.0 | score 0.76
LeBlanc, Deceiver                  n  2 | HOLD 1, ATTRITION 1                | delivery>=1:  0 | clock 6.5 | closers 7.0 | score 0.94
Irelia, Blade Dancer               n  2 | BURST 2                            | delivery>=1:  2 | clock 7.5 | closers 3.0 | score 0.78
Jayce, Defender of Tomorrow        n  2 | ATTRITION 2                        | delivery>=1:  0 | clock 9.0 | closers 3.0 | score 0.51
Kha'Zix, Voidreaver                n  2 | BURST 1, TALL 1                    | delivery>=1:  1 | clock 6.0 | closers 1.5 | score 0.69
Master Yi, Wuju Bladesman          n  1 | TALL 1                             | delivery>=1:  0 | clock 6.0 | closers 5.0 | score 0.69
Lillia, Bashful Bloom              n  1 | WIDE 1                             | delivery>=1:  0 | clock 7.0 | closers 9.0 | score 0.97
Leona, Radiant Dawn                n  1 | TALL 1                             | delivery>=1:  1 | clock 6.0 | closers 3.0 | score 0.84
Mordekaiser, Iron Revenant         n  1 | WIDE 1                             | delivery>=1:  0 | clock 6.0 | closers 13.0 | score 0.78
Jarvan IV, Exemplar of Demacia     n  1 | BURST 1                            | delivery>=1:  0 | clock 7.0 | closers 0.0 | score 0.57
Lucian, Purifier                   n  1 | TALL 1                             | delivery>=1:  0 | clock 7.0 | closers 3.0 | score 0.61
Ornn, Fire Below the Mountain      n  1 | WIDE 1                             | delivery>=1:  0 | clock 6.0 | closers 3.0 | score 0.52
Renekton, Butcher of the Sands     n  1 | TALL 1                             | delivery>=1:  0 | clock 6.0 | closers 4.0 | score 0.71
Jax, Grandmaster at Arms           n  1 | TALL 1                             | delivery>=1:  0 | clock 8.0 | closers 1.0 | score 0.83
Rek'Sai, Void Burrower             n  1 | WIDE 1                             | delivery>=1:  0 | clock 6.0 | closers 6.0 | score 0.75
Orianna, Lady of Clockwork         n  1 | ATTRITION 1                        | delivery>=1:  0 | clock 7.0 | closers 2.0 | score 0.40
Darius, Hand of Noxus              n  1 | WIDE 1                             | delivery>=1:  0 | clock 6.0 | closers 3.0 | score 0.72
Draven, Glorious Executioner       n  1 | WIDE 1                             | delivery>=1:  1 | clock 6.0 | closers 2.0 | score 0.54
Viktor, Herald of the Arcane       n  1 | WIDE 1                             | delivery>=1:  0 | clock 7.0 | closers 10.0 | score 0.78
Pyke, Bloodharbor Ripper           n  1 | WIDE 1                             | delivery>=1:  1 | clock 6.0 | closers 1.0 | score 0.34
Rengar, Pridestalker               n  1 | TALL 1                             | delivery>=1:  1 | clock 6.0 | closers 2.0 | score 0.69
Vex, Gloomist                      n  1 | HOLD 1                             | delivery>=1:  1 | clock 7.0 | closers 3.0 | score 0.83
K'Sante, Pride of Nazumah          n  1 | HOLD 1                             | delivery>=1:  0 | clock 7.0 | closers 5.0 | score 0.97
primary route totals [('BURST', 15), ('TALL', 13), ('WIDE', 9), ('ATTRITION', 9), ('HOLD', 4)] n 50
secondary route totals [('BURST', 18), ('TALL', 13), ('ATTRITION', 10), ('HOLD', 6), ('WIDE', 3)]
hidden delivery (norm >= 1): 19
specials [('ALTWIN', 2)]
point cards in main decks: []
by primary route: n, mean clock, median closers, median interaction, mean sub-score
  WIDE      n   9 | clock 6.2 (6-7) | closers 6 | interaction 11 | score 0.69
  TALL      n  13 | clock 6.8 (6-8) | closers 3 | interaction 10 | score 0.65
  HOLD      n   4 | clock 7.2 (7-8) | closers 3 | interaction 16 | score 0.88
  BURST     n  15 | clock 6.6 (6-8) | closers 3 | interaction 11 | score 0.75
  ATTRITION n   9 | clock 8.1 (6-9) | closers 5 | interaction 13 | score 0.56
```

By placement class (`detect.py placement`):

```
win        n  18 | sub-score mean 0.742 | clock 6.44 | interaction 10.7 | primary TALL 6, BURST 6, WIDE 3, HOLD 3
top8       n  32 | sub-score mean 0.662 | clock 7.16 | interaction 10.6 | primary ATTRITION 9, BURST 9, TALL 7, WIDE 6, HOLD 1
top64      n  20 | sub-score mean 0.721 | clock 7.20 | interaction 9.6 | primary BURST 7, TALL 5, HOLD 4, WIDE 3, ATTRITION 1
bestof     n  47 | sub-score mean 0.715 | clock 7.02 | interaction 9.6 | primary WIDE 15, BURST 10, HOLD 9, TALL 7, ATTRITION 6
event-only n  84 | sub-score mean 0.735 | clock 6.85 | interaction 11.1 | primary BURST 21, TALL 18, WIDE 17, ATTRITION 15, HOLD 10, POINTS 3
  part closer      win/top8 0.789 (n 50) vs rest 0.820 (n 151)
  part depth       win/top8 0.765 (n 50) vs rest 0.827 (n 151)
  part plan_b      win/top8 0.398 (n 50) vs rest 0.454 (n 151)
  part final_point win/top8 0.693 (n 50) vs rest 0.717 (n 151)
  part resilience  win/top8 0.645 (n 50) vs rest 0.620 (n 151)
  sub-score   win/top8 0.691 vs rest 0.727
```

### 3.3 Older corpora, for the trend only

- **PA-CORPUS all eras, n = 282 distinct lists:** primary WIDE 74, BURST 65, TALL 60, ATTRITION 39, HOLD 38, POINTS 6; Hidden delivery 1.0+ in 67; ALTWIN 5, COMBO 2, BF_SYMMETRIC 1 (`out-table-all.txt`).
- **PA-SEP, n = 49 (pre-Radiance, includes pre-ban lists):** primary WIDE 15, BURST 12, ATTRITION 10, TALL 8, HOLD 4; BF_SYMMETRIC (The Arena's Greatest) 19; ALTWIN 2; Ahri, Alluring in 2 lists (`out-table-sept.txt`).

### 3.4 What the data says

- **DATA:** legends split into two groups. Locked to one route in every list: Kai'Sa (ATTRITION 15/15), Kennen (BURST 10/10), Viktor (WIDE 6/6), Sett (TALL 6/6), K'Sante (HOLD 6/6), Vex (HOLD 5/5), Vi (BURST 5/5), Rek'Sai, Rengar, Master Yi, Diana, Lillia, Ivern, Darius, Seraphine, Azir (all n of n with n <= 4). Split: Riven (TALL 9, BURST 8), Orianna (WIDE 3, HOLD 2, ATTRITION 2, TALL 1), Evelynn (TALL 5, HOLD 3), LeBlanc (ATTRITION 4, HOLD 3), Akali (BURST 5, HOLD 2), Mordekaiser (WIDE 5, BURST 2). For the second group a legend-to-archetype lookup would be wrong; the route has to be computed from the 40 cards.
- **DATA:** among lists named win/top 8 the order is BURST 15, TALL 13, WIDE 9, ATTRITION 9, HOLD 4. Lists named as a win (n 18): TALL 6, BURST 6, WIDE 3, HOLD 3, ATTRITION 0; their mean clock is 6.4 against 6.9-7.2 for every other class. Lists named top 8 but not first (n 32): ATTRITION 9, BURST 9. HEURISTIC reading: slow removal lists reach top cuts and lose the final; n is small and the placement labels are unverified.
- **DATA:** direct point cards are absent from all 50 placed lists. Placed lists win by scoring battlefields; the two exceptions in the wider corpus are Yasuo (POINTS, champion engine) and Jayce (Gutter Palace alternate win, 2 of the 50 placed lists).
- **DATA:** 9% of lists main-deck a sweeper while 44 of 201 are WIDE-primary. WIDE is the least-answered route in the corpus.
- **DATA:** the sub-score does not rise with placement (0.742 win, 0.662 top 8, 0.721 top 64, 0.715 best-of, 0.735 event-only). The only part that is higher in placed lists is resilience (0.645 vs 0.620); depth and plan B are lower (0.765 vs 0.827; 0.398 vs 0.454). HEURISTIC reading: placed lists are less "pure" in one route and carry more protection and counterspells.

## 4. Deterministic detection rules

Implementation: `docs/research/analysis/wincons/detect.py` (Python 3 standard library). Supporting scripts: `build_pool.py` (GAL -> `cards-current.json`), `fetch_decks.py` (first-pass PA-NOV), `audit.py` (which cards carry a feature), `pool_routes.py` (census for section 2), `assemble.py` (rebuilds this file from `wincons.head.md`, `wincons.body.md` and the `out-*.txt` files). Everything in this section is **HEURISTIC** design; the numbers are fixed constants so the same list always gives the same output.

Changes from v1 (same day): Hidden moved to a delivery axis; a closer is counted once, under the highest-ranked route that wants it; routes with no closer are demoted; the Chosen Champion is listed first; legend conversions (Riven, K'Sante); "When I move" payoffs; Temporary tokens; Deathknell doublers removed; "kill a friendly unit" no longer counts as removal; reference levels recalibrated on 201 RAD-era lists; "folds to" lines carry the field's main-deck rate and are ordered by it; 2v2 / FFA notes with the deck's own numbers.

### 4.1 Card features

Reminder text in parentheses is stripped first, so "(Opponents must pay ...)" never matches. One regex per feature (the `RX` table in `detect.py`):

| Feature | Meaning | Pool cards (DATA, `audit.py`) |
|---|---|---|
| point_self / point_gift | "score 1 point" for you / for an opponent ("would score" and "that player gains" excluded) | 13 / 2 |
| altwin, denial, doubler | "you win the game"; "can't score", "points needed to win", "draw 1 instead"; "(conquer or hold) effects ... trigger an additional time", "activate the conquer effects" | 2, 4, 3 |
| haste | unit with `[Accelerate]` or "I enter ready" | 57 |
| ready | a "ready ..." clause whose object is a unit, me, it or them (runes, gear, legend excluded) | 71 |
| gank, move_friendly, movepay, assault, pump | `[Ganking]`; "move me / a friendly unit / your ..."; "When I move"; `[Assault`; "+N [Might] this turn/combat" | 39, 31, 30, 44, 97 |
| token, multi_token, token_engine, temp_token, widepay | unit-token makers; two or more tokens; repeatable token source; tokens with `[Temporary]`; "for each unit", "your units have +", "N+ units" | 58, 15, 36, 9, 18 |
| cheap, mighty, big, top_end | unit cost <= 2; Might >= 5 (rule 708); Might >= 6; cost >= 7 | 80, 198, 112, 65 |
| scaling, mightypay, buff, equip, prot | self-scaling Might; `[Mighty]` text; buff; `[Equip]`; Deflect / can't be chosen / death replacement | 10, 12, 39, 41, 65 |
| holdpay, conqpay, shield, tank, stun, deftrick | hold trigger; conquer or attack trigger; `[Shield`; `[Tank]`; stun; "defend" | 43, 85, 39, 30, 28, 23 |
| removal, sweep, displace, debuff, counter | kill / damage / steal aimed at something that is not "friendly" or "you control"; mass kill / damage / bounce; move or bounce an enemy unit; -Might or Disarm; counterspell | 105, 13, 38, 34, 9 |
| recur, draw, ramp | trash use, Flow, Deathknell; draw; channel / Add / Gold | 78, 128, 83 |
| hidden, hidden_unit, ambush, facedown_pay | `[Hidden]`; Hidden on a unit; `[Ambush]`; payoff for hiding or playing from face down | 50, 21, 15, 17 |
| shield_to_assault (legend only) | "[Assault] equal to (my) [Shield]" | 1 |

### 4.2 Routes: weights per copy and the closer test

| Route | Weight per copy of a card with the feature | A card is a closer when |
|---|---|---|
| WIDE | token 1.0, multi_token 1.0, widepay 1.5, cheap 0.5 | widepay, or multi_token, or a non-spell token_engine |
| TALL | big 1.0, scaling 1.0, mightypay 1.0, buff 0.75, equip 0.75, pump 0.5, prot 0.5 | unit with Might >= 6, or scaling, or Might >= 5 with prot or Ganking |
| HOLD | holdpay 1.5, shield 1.0, tank 1.0, stun 0.5, deftrick 0.5 | unit with holdpay, or unit with Shield/Tank and Might >= 4 |
| BURST | haste 1.0, ready 1.0, gank 0.75, move_friendly 0.75, assault 0.5, conqpay 0.5, enter_ready 0.5, movepay 0.5 (+ shield 0.75 under a shield_to_assault legend) | haste unit with Might >= 4 or Assault; a non-unit ready effect; Ganking unit with Might >= 4; ready-effect unit with Might >= 4 (+ Shield unit with Might >= 4 under a shield_to_assault legend) |
| POINTS | point_self 3.0, doubler 1.0; a point card that is the Chosen Champion counts as 4 copies | point_self |
| ATTRITION | removal 1.0, sweep 1.5, counter 0.75, recur 0.75, draw 0.5, displace 0.5, debuff 0.5 | sweep, or a unit costing >= 7, or a recursion unit costing >= 5 |
| HIDDEN (delivery axis) | hidden 0.25, hidden_unit 1.0, ambush 1.0, facedown_pay 1.5 | facedown_pay, or a Hidden/Ambush unit with Might >= 3 |

Special rule-based routes, reported separately with their named cards: ALTWIN (The Grand Plaza among the battlefields; Gutter Palace in the main deck), COMBO (a doubler together with a hold- or conquer-triggered point card; Yasuo, Windrider with move and ready enablers, strength = min(1, enablers / 12) with the legend as 4), BF_ENGINE (a battlefield with point_self), LEGEND_ENGINE (legend with point_self; none exists today), BF_SYMMETRIC (The Arena's Greatest).

### 4.3 Route score and ranking

```
raw(route)  = sum over main-deck cards of copies x (sum of the route's weights for features on the card)
            + 4 x (sum of weights for features on the legend)          # legend: available every turn
            + 1 x (sum of weights for features on each of the 3 battlefields)
            + legend conversions (2.9): +2.0 BURST for an enter-ready legend, +2.0 BURST for shield_to_assault
norm(route) = raw(route) / REF(route)
REF         = WIDE 9.0, TALL 11.5, HOLD 6.5, BURST 14.75, POINTS 6.0, ATTRITION 21.5, HIDDEN 8.5
p0(route)   = 1 if the Chosen Champion or the legend is a closer for the route,
              else P(at least one closer copy in 9 cards)                (4.4)
rank(route) = norm(route) x (0.6 + 0.4 x p0(route))
```

REF is the 75th percentile of raw over the 201 distinct RAD-era lists (`detect.py calibrate rad`; POINTS has a 75th percentile of 0, so its REF is two copies of a point card). norm 1.0 means "as committed to this route as the top quarter of the current field". Without the normalisation every deck would be ATTRITION, because removal and draw are everywhere (293 pool enablers). The six scoring routes are ordered by rank; HIDDEN is reported beside them. A route that no card in the list can close loses up to 40% of its score: this is what moves the Riven winner from HOLD (2 copies of Blitzcrank, Impassive) to BURST (champion and legend).

Closers are then assigned once: going down the ranking, a card already listed as a closer for a higher route is shown as "shared, counted above" and is not counted again. Closer copies, names and the turn-5 probability of a lower route use only its own closers.

### 4.4 Redundancy and speed

- **Closer redundancy:** closer copies and distinct names per route, and `P(closer by turn 5) = 1 - C(40-k, 9) / C(40, 9)`: at least one of k copies in 9 cards (4-card opening hand, rule 116, plus 5 draws; mulligan ignored). It is 1.0 when the Chosen Champion is a closer (Champion Zone, 103.2.a.1) or when the legend supplies the closer feature. Reference values: 3 copies 0.55, 6 copies 0.81, 9 copies 0.93.
- **Speed (uncontested clock, from section 1.5):**

```
t_first  = 1 if >= 6 copies of haste units costing <= 1
           2 if cheap units + those >= 8
           3 otherwise
two_bf   = min(1, (cheap + token + gank + haste + ready + ambush [+4 if the legend makes tokens / readies / moves]) / 20)
ppt      = 1 + two_bf                         # points per turn, between 1 and 2 (rule 470 cap in 1v1)
bonus    = min(2, 0.25 x point-card copies)   # a champion point card counts as 4 copies
clock    = t_first + ceil((8 - 1 - bonus) / ppt)
label    = fast (<= 6), medium (7), slow (>= 8)
```

  The clock reproduces the first line of the 1.5 table (t_first 2, ppt 2 -> turn 6) and the one-battlefield line (ppt 1 -> turn 9). It does not model the opponent and it compresses: 201 lists land on turns 6 to 10, most on 6 or 7.
- **Final point reach**, three numbers in 0-1: `hold = min(1, (shield + tank + holdpay + prot [+4 legend]) / 12)`, `double_conquer = min(1, movers / 12)` with `movers = haste + ready + gank + move_friendly [+4 legend]`, `direct = min(1, point-card copies / 4 + 0.34 x point battlefields)`. For FFA: `triple_conquer = min(1, movers / 18)`.

### 4.5 "Folds to" rules

Each line is emitted only when its condition holds, names the deck's own card or count, and carries the field's main-deck rate for the answer class (section 2 table). Lines are sorted by that rate, highest first. Example answers are pool cards with the feature, ordered by copies in the RAD-era corpus; cards with 0 copies are not named.

| Condition | Line | Sort key |
|---|---|---|
| primary is TALL, POINTS or HOLD and under 50% of closer copies have prot | single-target removal / bounce on the top closer (Chosen Champion first), with the share of protected closers | removal rate (0.72) |
| primary is ATTRITION | two-battlefield pressure: unit count; answers split into kill/damage, displacement, Might-reduction, counterspell, sweeper copies; Deflect tax | prot rate (0.70) |
| primary is HOLD, or hold reach >= 0.75 | displacement of the holder before the Beginning Phase | displace rate (0.60) |
| BURST is primary or second | stun on the readied attacker; Shield/Tank defenders | stun rate (0.58) |
| fewer than 8 interaction copies (removal + sweep + counter + stun + displace) | any faster racer | 0.5 |
| fewer than 6 closer copies and neither champion nor legend is a closer | counterspell / removal on the few closers | counter rate (0.47) |
| >= 5 Equipment copies | gear removal | 0.3 |
| >= 8 trash-using copies | trash hate | 0.1 |
| average unit Might <= 3.2, or primary is WIDE | sweepers, with average Might and token-maker count | sweep rate (0.09) |
| Hidden delivery >= 1.0, or >= 8 Hidden copies | Noxus Saboteur, Mystic Vortex (with their copies in the corpus), rule 466.5.c | 0.05 |
| any point card or point battlefield | Tianna Crownguard | 0.02 |
| >= 3 Temporary-token maker copies and WIDE is primary or second | own tokens cannot hold at 7 points; prints double-conquer and hold reach | 1.0 (always first) |

Mode notes: two lines per deck, chosen by primary route, filled with the deck's numbers (unit and token counts, Ganking and move copies, closer copies against 2-3 opponents' mean removal, P(an opponent has a sweeper) for 2 and 3 opponents, triple-conquer reach). Texts: `mode` table in `detect.py`; rules cited inline (447.2.a-b, 469.1.a, 471.1.a.1, 471.1.b.1, 489.8.a, 489.8.d, 489.8.e).

### 4.6 Win-condition sub-score (0-1)

```
S = 0.30 x closer + 0.25 x depth + 0.15 x plan_b + 0.20 x final_point + 0.10 x resilience

closer      = P(closer by turn 5) of the primary route                      (4.4)
depth       = min(1, norm(primary) / 1.5)
plan_b      = min(1, norm(second)) x P(second route's own closer by turn 5) # v2: shared closers do not count
final_point = max(hold, double_conquer, direct)                              (4.4)
resilience  = min(1, (prot + 0.5 x recur + counter copies) / 8)
```

DATA over the 201 RAD-era lists: mean 0.72, minimum 0.21, maximum 1.00. By primary route: POINTS 0.95 (n 3), HOLD 0.86, BURST 0.74, WIDE 0.72, TALL 0.70, ATTRITION 0.56. **DATA: it does not track results** (section 3.4: 0.691 placed vs 0.727 not placed; the list named Regional Championship Europe winner scores 0.57, a list named "K'sante 1st attempt" scores 0.97). The low ATTRITION mean is a property of the formula (few closers, low final-point reach). The score answers one question: "how reliably does this list present its own way to reach 8, a second way, and a legal last point". The app must show it with that wording and with its five parts, never as "deck strength".

## 5. Prototype output on six real lists from six legends

Command: `python3 detect.py show rad 46 rad 145 rad 56 rad 185 rad 23 rad 51` (PA-CORPUS, RAD era, lists named as a win or top 8). Raw output, unedited (`analysis/wincons/out-six-lists.txt`):

```
### Kennen Win Regional Europe
identity: BURST
legend: Kennen, Heart of the Tempest | champion: Kennen, Storm of Shuriken | main 40 | RAD win | https://piltoverarchive.com/decks/view/65a88af2-cb6a-4871-8bf5-9a212580690d
win-condition sub-score 0.568  parts {'closer': 0.656, 'depth': 0.553, 'plan_b': 0.283, 'final_point': 0.67, 'resilience': 0.562}
speed: fast - goldfish win turn 6 (first conquer T2, 1.75 pts/turn, 0.0 bonus pts) | final point reach {'hold': 0.0, 'double_conquer': 0.67, 'direct': 0.0} | FFA triple conquer 0.44
1. BURST Burst conquer (ready/haste/move)  norm 0.83 (raw 12.25, rank 0.716) | closers 4 copies / 2 names, P(closer by T5) 0.656 | legend: assault | battlefields: Minefield, Veiled Temple, Zaun Warrens
   closers: 3x Nocturne, Horrifying, 1x Ride the Wind
   enablers: 1x Kennen, Storm of Shuriken, 2x Reckless Innovator, 3x Traveling Merchant, 1x Tideturner
2. TALL Go-tall single threat  norm 0.52 (raw 6.0, rank 0.425) | closers 3 copies / 1 names, P(closer by T5) 0.545
   closers: 3x Rhasa the Sunderer
   enablers: 2x Edge of Night, 2x Last Rites
3. ATTRITION Attrition / recursion control  norm 0.67 (raw 14.5, rank 0.402) | closers 0 copies / 0 names, P(closer by T5) 0.0 | battlefields: Zaun Warrens
   closers: -
   enablers: 1x Kennen, Storm of Shuriken, 3x Lightning Rush, 2x Last Rites, 3x Traveling Merchant, 1x An Offer You Can't Refuse, 2x Bedeviling Stranger (+7 more)
delivery: HIDDEN Hidden / Ambush tempo (face-down reactions)  norm 0.94 (raw 8.0, rank 0.716) | closers 2 copies / 1 names, P(closer by T5) 0.404
   closers: 2x Edge of Night
   enablers: 2x Bedeviling Stranger, 1x Tideturner, 2x Switcheroo, 1x Hidden Blade
folds to (most common answer class in the RAD-era corpus first):
   - stun on the readied attacker and Shield/Tank defenders (a stunned unit deals no combat damage; stun main-decked by 58% of 201 RAD-era lists, mean 1.4 copies; Shield main-decked by 22% of 201 RAD-era lists, mean 0.9 copies) - e.g. Back Off (59), Ki Burst (15), Existential Dread (9), One-Two Punch (8)
   - counterspell / removal on the few closers (4 copies, no champion or legend closer; counterspells main-decked by 47% of 201 RAD-era lists, mean 1.2 copies)
   - sweepers (average unit Might 3.1, 0 token-maker copies; main-decked by 9% of 201 RAD-era lists, mean 0.2 copies) - e.g. Unchecked Power (28), Flurry of Blades (24), Angler Beast (16), Avalanche (12), Downwell (6)
   - Hidden hate (8 Hidden copies): Noxus Saboteur (2) stops reveals at its battlefield, Mystic Vortex (0) taxes Reaction cards in showdowns there; losing control of the battlefield removes your face-down cards there (rule 466.5.c)
modes:
   - 2v2: Ganking and move effects lose every teammate-occupied destination (447.2.b); 3 Ganking copies, 2 move copies
   - FFA: the final conquer needs all 3 battlefields in one turn (471.1.b.1): triple-conquer reach 0.44 vs 0.67 in 1v1; a battlefield with a pending combat between two other players can't be entered (447.2.a)

### 5th place Viktor Riftbound Showdown 25k - LDXP Sacramento by Cаlvin Jin
identity: WIDE + ATTRITION
legend: Viktor, Herald of the Arcane | champion: Viktor, Leader | main 40 | RAD top8 | https://piltoverarchive.com/decks/view/fc8db44f-6da3-45f8-842e-04678b1dcae3
win-condition sub-score 0.775  parts {'closer': 1.0, 'depth': 1.0, 'plan_b': 0.225, 'final_point': 0.58, 'resilience': 0.75}
speed: medium - goldfish win turn 7 (first conquer T3, 2.0 pts/turn, 0.0 bonus pts) | final point reach {'hold': 0.25, 'double_conquer': 0.58, 'direct': 0.0} | FFA triple conquer 0.39
1. WIDE Go-wide flood (both battlefields)  norm 2.39 (raw 21.5, rank 2.39) | closers 10 copies / 4 names, P(closer by T5) 1.0 [champion] [legend] | legend: token
   closers: 1x Viktor, Leader, 3x Sprite Burst, 3x Concert Poster, 3x Sprite Fountain
   enablers: 3x Carrion Dredger
2. ATTRITION Attrition / recursion control  norm 1.14 (raw 24.5, rank 0.787) | closers 1 copies / 1 names, P(closer by T5) 0.225 | battlefields: Forbidding Waste
   closers: 1x Thousand-Tailed Watcher
   enablers: 3x Bellows Breath, 3x Hidden Blade, 3x Imperial Decree, 3x Stupefy, 3x Wages of Pain, 3x Carrion Dredger (+4 more)
3. BURST Burst conquer (ready/haste/move)  norm 0.58 (raw 8.5, rank 0.547) | closers 0 copies / 0 names, P(closer by T5) 0.0
   closers: - | shared, counted above: Sprite Burst (WIDE), Sprite Fountain (WIDE), Thousand-Tailed Watcher (ATTRITION)
   enablers: 3x Concert Poster
folds to (most common answer class in the RAD-era corpus first):
   - its own tokens at 7 points: 6 of 13 token-maker copies make Temporary tokens, which are killed at the start of your Beginning Phase before scoring, so they never hold; the last point needs a double conquer (reach 0.58) or a non-token holder (hold reach 0.25)
   - sweepers (average unit Might 2.7, 13 token-maker copies; main-decked by 9% of 201 RAD-era lists, mean 0.2 copies) - e.g. Unchecked Power (28), Flurry of Blades (24), Angler Beast (16), Avalanche (12), Downwell (6)
   - Hidden hate (8 Hidden copies): Noxus Saboteur (2) stops reveals at its battlefield, Mystic Vortex (0) taxes Reaction cards in showdowns there; losing control of the battlefield removes your face-down cards there (rule 466.5.c)
modes:
   - 2v2: a unit can't move to a battlefield a teammate occupies (447.2.b), so 6 unit copies + 13 token makers share the battlefields your partner leaves free
   - FFA: P(at least one opponent main-decks a sweeper) = 0.18 with 2 opponents, 0.26 with 3 (from 9% per list)

### RC Stuttgart Top 8 Best of Kaisa ChallengerTCG Daniel Zidenberg
identity: ATTRITION
legend: Kai'Sa, Daughter of the Void | champion: Kai'Sa, Survivor | main 40 | RAD top8 | https://piltoverarchive.com/decks/view/8e8dd2b6-eeba-4fd8-9d26-0fe2bec4df96
win-condition sub-score 0.548  parts {'closer': 0.742, 'depth': 0.767, 'plan_b': 0.41, 'final_point': 0.33, 'resilience': 0.062}
speed: slow - goldfish win turn 9 (first conquer T3, 1.35 pts/turn, 0.0 bonus pts) | final point reach {'hold': 0.17, 'double_conquer': 0.33, 'direct': 0.0} | FFA triple conquer 0.22
1. ATTRITION Attrition / recursion control  norm 1.15 (raw 24.75, rank 1.031) | closers 5 copies / 2 names, P(closer by T5) 0.742
   closers: 3x Thousand-Tailed Watcher, 2x The Empyrean
   enablers: 1x Kai'Sa, Survivor, 3x Bilgewater Tracker, 3x Falling Star, 3x Hextech Ray, 3x Stupefy, 3x Temporal Breach (+5 more)
2. BURST Burst conquer (ready/haste/move)  norm 0.41 (raw 6.0, rank 0.41) | closers 1 copies / 1 names, P(closer by T5) 1.0 [champion]
   closers: 1x Kai'Sa, Survivor | shared, counted above: Thousand-Tailed Watcher (ATTRITION)
   enablers: 3x Plundering Poro
3. TALL Go-tall single threat  norm 0.43 (raw 5.0, rank 0.386) | closers 0 copies / 0 names, P(closer by T5) 0.0
   closers: - | shared, counted above: Thousand-Tailed Watcher (ATTRITION), The Empyrean (ATTRITION)
   enablers: -
folds to (most common answer class in the RAD-era corpus first):
   - two-battlefield pressure: 20 unit copies to contest 2 battlefields; answers are 16 kill/damage, 0 displacement, 8 Might-reduction, 0 counterspell, 0 sweeper copies; Deflect / can't-be-chosen taxes every targeted answer (main-decked by 70% of 201 RAD-era lists, mean 2.2 copies) - e.g. Vex, Apathetic (104), Carrion Dredger (63), Ruin Runner (45), Baron Nashor (33)
   - stun on the readied attacker and Shield/Tank defenders (a stunned unit deals no combat damage; stun main-decked by 58% of 201 RAD-era lists, mean 1.4 copies; Shield main-decked by 22% of 201 RAD-era lists, mean 0.9 copies) - e.g. Back Off (59), Ki Burst (15), Existential Dread (9), One-Two Punch (8)
   - counterspell / removal on the few closers (5 copies, no champion or legend closer; counterspells main-decked by 47% of 201 RAD-era lists, mean 1.2 copies)
modes:
   - 2v2: Victory 11 lengthens the game; spells may be played on the teammate's turn when invited (489.8.a)
   - FFA: 16 one-for-one answers against 2-3 boards; only 0 sweeper copies scale with the number of opponents

### K'sante 1st attempt
identity: HOLD + BURST
legend: K'Sante, Pride of Nazumah | champion: K'Sante, Dauntless | main 40 | RAD win | https://piltoverarchive.com/decks/view/78bf038f-f7df-4e0c-85be-93f334ed0b33
win-condition sub-score 0.969  parts {'closer': 1.0, 'depth': 1.0, 'plan_b': 1.0, 'final_point': 1.0, 'resilience': 0.688}
speed: medium - goldfish win turn 7 (first conquer T2, 1.55 pts/turn, 0.0 bonus pts) | final point reach {'hold': 1.0, 'double_conquer': 0.33, 'direct': 0.0} | FFA triple conquer 0.22
1. HOLD Hold-and-defend  norm 6.15 (raw 40.0, rank 6.15) | closers 5 copies / 3 names, P(closer by T5) 1.0 [champion] | legend: shield | battlefields: Fortified Position, Amateur Recital, Grove of the God-Willow
   closers: 1x K'Sante, Dauntless, 2x Blitzcrank, Impassive, 2x Armored Tusker
   enablers: 3x Mutated Mouser, 2x Block, 3x Ntofo Strikes, 3x Stalwart Poro, 2x Consult the Heavens, 2x Stoic Ferryman (+1 more)
2. BURST Burst conquer (ready/haste/move)  norm 1.59 (raw 23.5, rank 1.59) | closers 0 copies / 0 names, P(closer by T5) 1.0 [legend] | legend: assault+shield+shield_to_assault | battlefields: Fortified Position
   closers: - | shared, counted above: K'Sante, Dauntless (HOLD), Armored Tusker (HOLD)
   enablers: 3x Mutated Mouser, 3x Ntofo Strikes, 3x Stalwart Poro, 2x Block, 2x Consult the Heavens, 2x Stoic Ferryman (+1 more)
3. TALL Go-tall single threat  norm 0.57 (raw 6.5, rank 0.466) | closers 3 copies / 1 names, P(closer by T5) 0.545
   closers: 3x Astral Heron
   enablers: 3x Discipline, 2x Punch First, 2x Zhonya's Hourglass
delivery: HIDDEN Hidden / Ambush tempo (face-down reactions)  norm 0.65 (raw 5.5, rank 0.532) | closers 3 copies / 1 names, P(closer by T5) 0.545
   closers: 3x Scuttle Crab
   enablers: 2x Block, 2x Zhonya's Hourglass
folds to (most common answer class in the RAD-era corpus first):
   - single-target removal/bounce on K'Sante, Dauntless (0% of the 5 closer copies have Deflect or can't-be-chosen; main-decked by 72% of 201 RAD-era lists, mean 4.8 copies) - e.g. Falling Star (136), Decree of Rage (99), Bellows Breath (96), Decree of Unity (94)
   - displacement of the holder before your Beginning Phase (main-decked by 60% of 201 RAD-era lists, mean 2.9 copies) - e.g. Star-Crossed (138), Gust (122), Bedeviling Stranger (101), Charm (80), Rebuke (59)
   - stun on the readied attacker and Shield/Tank defenders (a stunned unit deals no combat damage; stun main-decked by 58% of 201 RAD-era lists, mean 1.4 copies; Shield main-decked by 22% of 201 RAD-era lists, mean 0.9 copies) - e.g. Back Off (59), Ki Burst (15), Existential Dread (9), One-Two Punch (8)
   - sweepers (average unit Might 2.5, 0 token-maker copies; main-decked by 9% of 201 RAD-era lists, mean 0.2 copies) - e.g. Unchecked Power (28), Flurry of Blades (24), Angler Beast (16), Avalanche (12), Downwell (6)
modes:
   - 2v2: a battlefield is held only by its controller on that controller's turn; teammate-controlled battlefields can't be scored by you that turn (469.1.a)
   - FFA: the holder must survive 2-3 opposing turns per round; hold reach 1.00 is computed for one

### Evelynn Skirmish Winner
identity: HIDDEN tempo that scores by TALL
legend: Evelynn, Agony's Embrace | champion: Evelynn, Entrancing | main 40 | RAD win | https://piltoverarchive.com/decks/view/aa57a31e-e360-424b-adac-0080beb0c9bd
win-condition sub-score 0.575  parts {'closer': 0.808, 'depth': 0.78, 'plan_b': 0.0, 'final_point': 0.5, 'resilience': 0.375}
speed: slow - goldfish win turn 8 (first conquer T3, 1.5 pts/turn, 0.0 bonus pts) | final point reach {'hold': 0.5, 'double_conquer': 0.25, 'direct': 0.0} | FFA triple conquer 0.17
1. TALL Go-tall single threat  norm 1.17 (raw 13.5, rank 1.08) | closers 6 copies / 2 names, P(closer by T5) 0.808
   closers: 3x Rengar, Trophy Hunter, 3x Ruin Runner
   enablers: 3x Boots of Swiftness, 3x Edge of Night, 3x Hold 'Em, 3x Punch First, 3x Rampage
2. HOLD Hold-and-defend  norm 0.92 (raw 6.0, rank 0.552) | closers 0 copies / 0 names, P(closer by T5) 0.0 | battlefields: Startipped Peak
   closers: -
   enablers: 3x The Good Stuff
3. ATTRITION Attrition / recursion control  norm 0.33 (raw 7.0, rank 0.198) | closers 0 copies / 0 names, P(closer by T5) 0.0 | legend: draw
   closers: -
   enablers: 1x Evelynn, Entrancing, 3x Bedeviling Stranger, 3x Reckless Innovator, 3x The Good Stuff
delivery: HIDDEN Hidden / Ambush tempo (face-down reactions)  norm 3.59 (raw 30.5, rank 3.59) | closers 13 copies / 5 names, P(closer by T5) 1.0 [champion] [legend] | legend: facedown_pay | battlefields: Bandle Scouts' Academy
   closers: 1x Evelynn, Entrancing, 3x Edge of Night, 3x Gutter Guardian, 3x Pyke, Returned, 3x Rengar, Trophy Hunter
   enablers: 3x Bedeviling Stranger, 3x Switcheroo
folds to (most common answer class in the RAD-era corpus first):
   - any faster racer: only 4 interaction copies in the main deck
   - gear removal (6 Equipment copies carry the Might)
   - Hidden hate (16 Hidden copies): Noxus Saboteur (2) stops reveals at its battlefield, Mystic Vortex (0) taxes Reaction cards in showdowns there; losing control of the battlefield removes your face-down cards there (rule 466.5.c)
modes:
   - 2v2: the partner covers the other battlefields; friendly buffs may target a teammate's unit (489.8.e)
   - FFA: 6 closer copies face about 10-14 single-target answers across 2-3 opposing main decks (mean 4.8 per list)

### 8/11/2026 Ricky Riftbound League - JoseWolf - 1st
identity: BURST + HOLD
legend: Riven, The Exile | champion: Riven, Deserter | main 40 | RAD win | https://piltoverarchive.com/decks/view/73744918-222e-48c9-8f20-1b24f9e5c67f
win-condition sub-score 0.838  parts {'closer': 1.0, 'depth': 0.76, 'plan_b': 0.404, 'final_point': 1.0, 'resilience': 0.875}
speed: fast - goldfish win turn 6 (first conquer T2, 2.0 pts/turn, 0.0 bonus pts) | final point reach {'hold': 0.5, 'double_conquer': 1.0, 'direct': 0.0} | FFA triple conquer 0.78
1. BURST Burst conquer (ready/haste/move)  norm 1.14 (raw 16.75, rank 1.14) | closers 4 copies / 2 names, P(closer by T5) 1.0 [champion] [legend] | legend: enter_ready | battlefields: Emperor's Dais
   closers: 1x Riven, Deserter, 3x Riven, Broken Blade
   enablers: 3x Reckless Innovator, 3x Tideturner, 3x Stellacorn Herder, 3x Treasure Hunter
2. HOLD Hold-and-defend  norm 1.08 (raw 7.0, rank 0.822) | closers 2 copies / 1 names, P(closer by T5) 0.404
   closers: 2x Blitzcrank, Impassive
   enablers: 3x Riven, Broken Blade, 1x Ki Burst
3. TALL Go-tall single threat  norm 0.98 (raw 11.25, rank 0.676) | closers 1 copies / 1 names, P(closer by T5) 0.225
   closers: 1x Baron Nashor
   enablers: 1x Riven, Deserter, 3x Boots of Swiftness, 3x Riven, Broken Blade, 3x Battle Preparations, 3x Discipline, 1x Twilight Shroud (+1 more)
delivery: HIDDEN Hidden / Ambush tempo (face-down reactions)  norm 1.12 (raw 9.5, rank 0.966) | closers 4 copies / 2 names, P(closer by T5) 0.656
   closers: 3x Scuttle Crab, 1x Pyke, Returned
   enablers: 3x Tideturner
folds to (most common answer class in the RAD-era corpus first):
   - stun on the readied attacker and Shield/Tank defenders (a stunned unit deals no combat damage; stun main-decked by 58% of 201 RAD-era lists, mean 1.4 copies; Shield main-decked by 22% of 201 RAD-era lists, mean 0.9 copies) - e.g. Back Off (59), Ki Burst (15), Existential Dread (9), One-Two Punch (8)
   - sweepers (average unit Might 3.0, 0 token-maker copies; main-decked by 9% of 201 RAD-era lists, mean 0.2 copies) - e.g. Unchecked Power (28), Flurry of Blades (24), Angler Beast (16), Avalanche (12), Downwell (6)
   - Hidden hate (4 Hidden copies): Noxus Saboteur (2) stops reveals at its battlefield, Mystic Vortex (0) taxes Reaction cards in showdowns there; losing control of the battlefield removes your face-down cards there (rule 466.5.c)
modes:
   - 2v2: Ganking and move effects lose every teammate-occupied destination (447.2.b); 0 Ganking copies, 3 move copies
   - FFA: the final conquer needs all 3 battlefields in one turn (471.1.b.1): triple-conquer reach 0.78 vs 1.00 in 1v1; a battlefield with a pending combat between two other players can't be entered (447.2.a)
```

Two more, for the special routes (`detect.py show rad 96 rad 20`, full text in `out-specials.txt`; selected lines):

```
### JAYCE 7TH ORLANDO 25K SHOWDOWN  1/11/2026
identity: ATTRITION
1. ATTRITION Attrition / recursion control  norm 1.05 (raw 22.5, rank 0.905) | closers 4 copies / 2 names, P(closer by T5) 0.656
   closers: 3x Flurry of Blades, 1x Avalanche
*  ALTWIN: Alternate win: Gutter Palace (exactly 4 cards in hand and 4 units at battlefields at your Beginning Phase) strength 0.55 | Gutter Palace | 3 copies

### Yasuo - RC Stuttgart 2v2 5-0
speed: slow - goldfish win turn 8 (first conquer T3, 1.4 pts/turn, 1.0 bonus pts) | final point reach {'hold': 0.25, 'double_conquer': 1.0, 'direct': 1.0} | FFA triple conquer 0.72
1. POINTS Direct point gain  norm 2.17 (raw 13.0, rank 2.17) | closers 1 copies / 1 names, P(closer by T5) 1.0 [champion] | battlefields: Reckoner's Arena
2. BURST Burst conquer (ready/haste/move)  norm 0.78 (raw 11.5, rank 0.78) | closers 3 copies / 1 names, P(closer by T5) 1.0 [legend] | legend: move_friendly | battlefields: Targon's Peak
*  COMBO: Combo finisher: Yasuo, Windrider third move in a turn (+1 point, not a conquer) strength 1 | Yasuo, Windrider, 3x Ride the Wind, 2x Flash | 12 move / ready enabler copies (legend counted as 4); needs 2 extra moves after his own
```

### 5.1 Do the outputs differ meaningfully?

**Yes (DATA).** Across the six full reports:

- identities: BURST; WIDE + ATTRITION; ATTRITION; HOLD + BURST; HIDDEN tempo that scores by TALL; BURST + HOLD. The two special reports add ATTRITION with ALTWIN and POINTS with COMBO.
- primary closer sets share no card: Nocturne, Horrifying / Ride the Wind; Viktor, Leader / Sprite Burst / Concert Poster / Sprite Fountain; Thousand-Tailed Watcher / The Empyrean; K'Sante, Dauntless / Blitzcrank, Impassive / Armored Tusker; Rengar, Trophy Hunter / Ruin Runner; Riven, Deserter / Riven, Broken Blade.
- clocks: turn 6, 7, 9, 7, 8, 6. Sub-scores: 0.57, 0.78, 0.55, 0.97, 0.58, 0.84.
- first "folds to" line: stun on the readied attacker (Kennen); own Temporary tokens (Viktor); two-battlefield pressure with the 16 / 0 / 8 / 0 / 0 answer split (Kai'Sa); removal on K'Sante, Dauntless (K'Sante); "only 4 interaction copies" (Evelynn); stun (Riven). Kennen and Riven share a first line because both are BURST; their second lines differ.
- every line carries a count, a probability or a card name from that list. The only fixed sentences are the rule citations.

### 5.2 Are they correct?

Checked by reading each list's 40 cards and the legend text (HEURISTIC judgement by the author of this document, not by a player of the deck):

| List | Detector says | Judgement |
|---|---|---|
| Kennen (named Regional Championship Europe winner; 4 identical uploads merged) | BURST 0.83, closers 3x Nocturne, Horrifying + 1x Ride the Wind, Hidden delivery 0.94, clock 6 | Right family, thin evidence. The legend gives [Assault 2] and is empowered by playing cards "from anywhere other than your hand"; the list is built on that (Hidden cards, Lightning Rush with Flow, Fizz, Trickster, Seal of Discord, Nocturne's play-from-deck). The detector has no feature for "played from elsewhere", so depth is only 0.55 and the sub-score 0.57. Missing feature, listed below. |
| Viktor (named 5th, LDXP Sacramento; 3 uploads merged) | WIDE 2.39 with champion and legend as closers; ATTRITION second; Temporary-token warning; sweepers at 9% | Correct. Legend makes a Recruit each turn; Sprite Burst, Sprite Fountain, Concert Poster are the mass-token cards; the removal suite (Bellows Breath, Hidden Blade, Imperial Decree, Stupefy, Wages of Pain) is the second route. The Temporary line is the non-obvious, list-specific output. |
| Kai'Sa (named RC Stuttgart top 8) | ATTRITION 1.15, closers Thousand-Tailed Watcher + The Empyrean, 16 kill/damage answers, 0 sweepers, 0 counterspells, clock 9, all three battlefields are the ATTRITION ones of 2.7 | Correct. The "0 counterspell, 0 sweeper" split is accurate for this list and is a real FFA weakness. BURST second is only the champion Kai'Sa, Survivor (Accelerate), correctly marked as one copy. |
| K'Sante (named "1st attempt"; placement class "win" is a name-parsing artefact) | HOLD 6.15, BURST 1.59 through the Shield-to-Assault conversion, hold reach 1.0, removal on the champion first | Correct in kind: the Shield units both hold and, with the legend, attack. The 0.97 sub-score shows the formula rewards a pure list; it says nothing about strength. |
| Evelynn (named Skirmish winner) | "HIDDEN tempo that scores by TALL": delivery 3.59 (13 closer copies, champion and legend), TALL 1.17 with Rengar, Trophy Hunter and Ruin Runner, 4 interaction copies, 6 Equipment copies | Correct. v1 called this list HIDDEN and stopped; v2 names how it scores and that it has almost no interaction. Clock 8 is probably too slow: Ambush units are counted, face-down spells are not. |
| Riven (named 1st, weekly league) | BURST 1.14 (champion + legend), HOLD 1.08 second (2x Blitzcrank, Impassive), Hidden delivery 1.12, double-conquer reach 1.0 | Plausible. The move and exhaust payoffs (Stellacorn Herder, Treasure Hunter, Riven, Broken Blade) are found. Riven lists split 9 TALL / 8 BURST in the corpus with scores near 1.0 on both: the split is a threshold effect, and the report should show both routes when they are within 0.2 (the identity line does this when the second route is >= 1.0). |
| Jayce (named 7th, Orlando 25K) | ATTRITION + ALTWIN Gutter Palace, 3 copies, P(draw by turn 5) 0.55 | Correct, and absent from v1's sample. |
| Yasuo (named 2v2 5-0) | POINTS primary because the point card is the Chosen Champion; COMBO strength 1.0 with 12 move/ready enablers | Correct about the engine. Strength 1.0 overstates it: three moves in one turn cost [2] for the legend plus two cards. |

Known errors and limits:

1. **No feature for "play from somewhere other than hand"** (Kennen, Heart of the Tempest; Rek'Sai). `Untitled/apps/web/src/lib/scoring.ts` and `legend-profiles.md` already have a play-from-elsewhere family; the detector should take features from that registry instead of its own regexes.
2. **Regex false positives:** Unchecked Power as a WIDE closer ("all friendly units" pattern), Scuttle Crab as a Hidden closer ("facedown cards" in its Deathknell), Reckoner's Arena listed as a POINTS battlefield (it is a doubler). Each is one pattern to tighten.
3. **Closer tests are stat thresholds** (Might >= 4, >= 6). Kha'Zix lists average 1.3 closer copies and Diana lists had 0 in an earlier calibration: tempo decks win with many mid-size units and no single closer. For them "closer copies" under-reports redundancy; `P(closer)` should fall back to the count of cards carrying the route's top feature.
4. **"Folds to" answers are field-level.** They become opponent-specific only when crossed with an actual opposing list; that belongs to the matchup feature (`matchups-and-lines.md`).
5. **The clock ignores the opponent**, face-down spells, and mulligans; it separates fast lists from slow ones and nothing finer.
6. **Sub-score does not predict placement** (4.6). Keep it as a construction check.
7. **REF constants are fitted to 201 lists from one meta** and must be recomputed whenever the corpus is refreshed (`detect.py calibrate rad`).
8. **Placement and event labels are parsed from deck names.**
9. **Card data:** 13 RAD cards have an inferred type; pre-Radiance errata other than Tianna were not applied; 35 local card texts differ in wording from GAL (section 0).
10. **Doubler combos, The Grand Plaza and battlefield point engines are untested on real lists**: no list in the RAD-era corpus contains them.

## 6. What the app should take from this

- Model `scoreBattlefield` and `gainPoint` as different events (CR-OCT 470.1-470.3); the Final Point rule and Forgotten Monument apply to the first, Tianna Crownguard to the second.
- Two axes per deck: **scoring route** (WIDE, TALL, HOLD, BURST, POINTS, ATTRITION, ranked) and **delivery** (Hidden / Ambush today; "play from elsewhere" next). Show an identity line built from both.
- Show for every deck: ranked routes with named closers and enablers, closers counted once, closer copies with the turn-5 probability, the three final-point numbers (hold / double conquer / direct), the uncontested clock with its inputs, and the conditional "folds to" lines with the field rate for each answer class. Every number has a formula in section 4.
- Deck-specific rule consequences are the lines that do not repeat between decks: Temporary tokens that cannot hold; a point card as Chosen Champion; a legend that converts Shield into Assault; 0 sweepers in a control list. Add one such check per rule interaction found, each with its rule number.
- Mode switch: Victory 8 with 2 battlefields (1v1), Victory 8 with 3 (FFA, triple-conquer reach), Victory 11 with 3 and shared points (2v2), with the mode notes of 4.5.
- Do not present the sub-score as strength. If a strength signal is wanted, it needs match results, which no source found today provides.
- Refresh order: GAL (cards) -> ban list -> deck corpus -> `calibrate` -> `assemble.py`. The detector reads only `cards-current.json`, so a new set needs no code change unless it brings a new keyword (Deploy, Disarm and Show Off are in the pool; only Disarm is mapped to a feature).
