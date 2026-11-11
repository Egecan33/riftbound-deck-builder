# Win conditions in Riftbound: rules, routes, meta data, and a deterministic detector

Research date 2026-11-11. Labels: **FACT** = primary source read (rule number / card code given), **DATA** = measured by a script in `docs/research/analysis/wincons/` (dataset and n given), **HEURISTIC** = our judgement or a derived estimate, **UNCONFIRMED** = looked for, not settled.

Sources used throughout:

| Key | Source | Date |
|---|---|---|
| CR-JUL | `~/github_repositories/GameLab/data/rules/core-rules.md`, official Core Rules, "Last Updated: 2026-07-16" | local |
| CR-OCT | Core Rules "Last Updated: 2026-10-09", PDF saved by the rules workflow at `docs/research/analysis/raw/core-rules-2026-10-09.pdf` (text extracted with pdftotext) | fetched 2026-11-11 |
| L-CARDS | `~/github_repositories/GameLab/data/cards/cards.json` (931 cards, built 2026-09-06, sets OGN/OGS/SFD/UNL/VEN) | local |
| GAL | Official card gallery https://playriftbound.com/en-us/card-gallery/ (1,408 printings -> 1,103 distinct cards after `build_pool.py`; includes 170 Radiance cards) | fetched 2026-11-11 |
| FAQ-SFD | `GameLab/docs/research/official-faq/spiritforged-faq.md` (copy of https://playriftbound.com/en-us/news/rules-and-releases/riftbound-spiritforged-faq/) | local |
| PA-SEP | `GameLab/data/decks/samples/piltover-archive-2026-09-06.json` (59 lists from https://piltoverarchive.com/decks, 49 with a complete 40-card main deck) | local |
| PA-NOV | https://piltoverarchive.com/decks pages 1-4 (96 lists indexed), 37 deck pages fetched serially, generic User-Agent, 2.5 s apart -> `analysis/wincons/pa-decks-2026-11-11.json` | fetched 2026-11-11 |
| RULES.MD | `docs/research/rules.md` (sibling workflow; ban lists and legality) | read 2026-11-11 |

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
- **UNCONFIRMED:** placements in PA-NOV. Deck names say "1st", "Top 8", "Best of <legend>" and so on, but piltoverarchive deck pages carry no structured tournament/placement field (checked: no `tournament` or `placement` key in the page payload). 18 of the 37 lists have a tournament marker in the name; the other 19 are the most-viewed recent list of a legend not otherwise covered.
- **UNCONFIRMED:** real game length. Section 1.5 gives rules-derived floors, not observed averages. No turn-count data was found locally or on the pages fetched.
- **UNCONFIRMED:** that the win-condition sub-score (section 4.6) correlates with winning. It was not joined to any win-rate data.
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

Search: `win the game|lose the game|point(s)|score(s/d)|can't score|Victory` over L-CARDS rules text (931 cards), plus the same search over the 170 RAD cards in GAL. **DATA:** 30 L-CARDS hits and 3 RAD hits; all are listed. The detector's tag is in the last column.

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

**D. Cards that only read the score (cost, tempo or stat changes) - 9 cards**

Draven, Showboat OGN-028 ("My Might is increased by your points."); Find Your Center OGN-047 and Leona, Zealot OGN-079 and Poppy, Paragon UNL-116 (discount or enter ready "If an opponent's score is within 3 points of the Victory Score"); Corrupted Dragon VEN-091 ("If your score is not within 3 points of the Victory Score, I enter ready."); Kai'Sa, Evolutionary OGN-112 (spell from trash "with Energy cost less than your points"); Needlessly Large Yordle SFD-055 ("I cost [2][Calm] less for each point you scored from holding this turn."); Chem-Baroness SFD-201 legend ("While your score is within 3 points of the Victory Score, your Gold [Add] an additional [1]."); Sumpworks Map UNL-085 ("When an opponent scores, draw 1."). Also Illaoi, Prophet of the Great Kraken VEN-109 ("when I score": a scoring trigger, not a point) and the Brush token UNL-T03 / Green Father UNL-195 (battlefield swap on scoring).

**E. Trigger doublers that multiply class-B cards - 4 cards and 1 battlefield (DATA: `audit.py doubler`)**

Red Brambleback UNL-029 ("Your conquer effects for conquering here trigger an additional time."), Blue Sentinel UNL-087 ("Your hold effects for holding here trigger an additional time."), Reckoner's Arena OGN-286 ("When you hold here, activate the conquer effects of units here."), plus Karthus, Eternal OGN-236 and Detonation Amplifier RAD-017 (matched by the "trigger an additional time" pattern; their texts were not individually reviewed: UNCONFIRMED that they double scoring triggers).

## 2. Taxonomy of win routes actually present in the pool

Every route is defined by features the script can detect (regex over rules text with reminder text stripped, plus printed cost and Might). The feature list and weights are in section 4. Counts are **DATA** from `pool_routes.py` over the 1,103-card GAL pool; the number in brackets after a card is its copies (main + side) across the 37 PA-NOV lists, so "(0)" means "exists, unplayed in the current sample". "What stops it" and the mode notes are **HEURISTIC** unless a rule is cited.

Where every route sits on the clock (DATA, 86 complete lists, primary route by the detector; clock = uncontested estimate from section 4.4):

| Primary route | Lists | Mean clock (range) | Median closer copies | Median interaction copies |
|---|---|---|---|---|
| BURST | 7 | turn 6.4 (6-8) | 6 | 8 |
| HIDDEN | 17 | turn 6.5 (6-8) | 6 | 11 |
| WIDE | 16 | turn 6.6 (6-7) | 4 | 9 |
| HOLD | 9 | turn 7.0 (6-8) | 2 | 16 |
| TALL | 17 | turn 7.1 (6-10) | 4 | 6 |
| ATTRITION | 20 | turn 7.5 (6-9) | 2 | 14 |

### 2.1 WIDE: go-wide flood of both battlefields

- **Detectable properties:** unit-token makers, cards that make two or more tokens, payoffs that count or pump all your units, units costing 2 or less. 53 closers and 89 enablers in the pool.
- **Closers:** Sprite Fountain UNL-078 (19), Ferrous Forerunner SFD-021 (17), Sprite Burst UNL-069 (12), Concert Poster RAD-116 (8), Antagonistic Apparatus RAD-009 (6), Up from the Deep VEN-100 (6), Baron Nashor UNL-147 (5), Vanguard Captain OGN-218 (3), Encore RAD-152 (3); payoffs Darius, Executioner OGN-243, Garen, Commander OGS-013, Azir, Sovereign SFD-177.
- **Enablers:** Scuttle Crab UNL-053 (23), Traveling Merchant OGN-185 (17), Trifarian Captain RAD-129 (17), Pit Rookie OGN-136 (15), Carrion Dredger UNL-153 (12).
- **Legends:** Viktor, Herald of the Arcane ("[1], [Exhaust]: Play a 1 [Might] Recruit unit token."), Lillia, Bashful Bloom, Azir, Emperor of the Sands, Garen, Might of Demacia ("When you conquer, if you have 4+ units at that battlefield, draw 2."), LeBlanc, Deceiver, Master Yi, Wuju Master.
- **Battlefields:** Altar to Unity OGN-275, Black Rose Sanctum RAD-159, Emperor's Dais SFD-207, Trapping Grounds UNL-217, The Grand Plaza OGN-293 (alternate win at 7+ units), Trifarian War Camp OGN-294 ("Units here have +1 [Might].").
- **Typical win turn:** 6-7. It scores two battlefields per turn early (the "two 1-cost units" line of 1.5) and usually takes the final point by holding.
- **What stops it:** damage sweepers. The pool has 13 (Flurry of Blades OGN-133, Cannon Barrage OGN-127, Firestorm OGS-002, Tibbers OGS-018, Avalanche RAD-079, Angler Beast UNL-132, Unchecked Power OGN-123, The Ruination UNL-180, Downwell SFD-147, Kog'Maw, Caustic OGN-190, Anivia, Primal OGN-148, Renekton, Rage Fueled VEN-019, Glowstone VEN-133). **DATA:** only 9 of 86 lists play any sweeper in the main deck; in PA-NOV the most played is Downwell with 3 copies in total. Also: Shield/Tank blockers that out-Might a token stack, Frozen Fortress UNL-212 ("deal 1 to each unit here" each Beginning Phase), Vex, Apathetic UNL-150 (stuns each unit an opponent plays while she is at a battlefield).
- **2v2:** tokens cannot enter a battlefield the teammate occupies (447.2.b), so the team's three battlefields fill fast and extra bodies idle. **FFA:** strong at taking the third, undefended battlefield; weak because every opponent's sweeper hits you and a wide board is the visible leader.

### 2.2 TALL: one Mighty threat

- **Detectable properties:** units with Might 6+, self-scaling Might text, `[Mighty]` payoffs (Mighty = Might 5+, rule 708), buffs, Equipment, +Might tricks, Deflect / can't-be-chosen. 128 closers, 195 enablers.
- **Closers:** Rengar, Trophy Hunter UNL-120 (18), Thousand-Tailed Watcher OGN-116 (12), Rhasa the Sunderer OGN-195 (12), Ruin Runner SFD-105 (11; "I can't be chosen by enemy spells and abilities."), Astral Heron VEN-044 (9), Baron Nashor UNL-147 (5), Kadregrin the Infernal OGN-038 (3), Draven, Showboat OGN-028 (Might grows with your points).
- **Enablers:** Discipline OGN-058 (37), Punch First SFD-097 (22), Decree of Insight VEN-061 (19), Rampage VEN-083 (18), Long Sword SFD-022 (14), Zhonya's Hourglass OGN-077 (13).
- **Legends:** Volibear, Relentless Storm; Fiora, Grand Duelist; Sett, The Boss; Lee Sin, Blind Monk; Leona, Radiant Dawn; Rengar, Pridestalker; Kha'Zix, Voidreaver; Jax, Grandmaster at Arms; Lucian, Purifier.
- **Battlefields:** Sunken Temple SFD-218, Navori Fighting Pit OGN-283, Valley of Idols UNL-218, Back-Alley Bar OGN-277, Packed Amphitheater RAD-164 ("Champion units here have +1 [Might].").
- **Typical win turn:** 7-8 (range 6-10 in the data). One big unit takes or holds one battlefield per turn, which is the 1-point-per-turn line unless a second body or a ready effect covers the other battlefield.
- **What stops it:** single-target removal and bounce (Falling Star OGN-029 (25), Decree of Rage VEN-015 (25), Temporal Breach VEN-066 (14)), displacement (Bedeviling Stranger RAD-107 (20), Star-Crossed UNL-128 (20), Gust OGN-169 (19), Charm OGN-043 (16)), stun (a stunned unit "doesn't deal combat damage this turn", reminder text on Nami, Headstrong UNL-052), Might reduction (Stupefy OGN-095 (29)), and chump defence: one surviving defender recalls the attacker (466.1.a.2). Gear removal when the Might comes from Equipment. The Final Point rule is the structural weakness: a single threat cannot conquer both battlefields in one turn without Ganking plus a ready effect.
- **2v2:** good; the partner covers the second battlefield and friendly buffs can target a teammate's unit ("Friendly" includes the teammate's objects, 489.8.e). **FFA:** two or three opponents hold targeted removal; one threat cannot guard three battlefields.

### 2.3 HOLD: hold and defend

- **Detectable properties:** "When I hold" / "When you hold" payoffs, Shield, Tank, stun, "defend" text. 49 closers, 61 enablers.
- **Closers:** Blitzcrank, Impassive OGN-067 (11), Fiora, Victorious OGN-232 (5), K'Sante, Courageous RAD-086 (3), Dockside Lock-Up RAD-136 (3), Xin Zhao, Vigilant SFD-176 (2), Nami, Headstrong UNL-052 (2), Ivern, Nurturer UNL-051, Vilemaw UNL-060; hold-point cards Ahri, Alluring OGN-066, Shen, Leader of the Kinkou Order VEN-138, Evelynn, In Control RAD-109.
- **Enablers:** Back Off UNL-042 (18), Vex, Apathetic UNL-150 (18), The Good Stuff RAD-106 (13), Stalwart Poro OGN-052 (8), Block OGN-057 (6), Mutated Mouser UNL-036 (6).
- **Legends:** Vex, Gloomist ("When you or an ally hold, you may exhaust me to draw 1."), Poppy, Keeper of the Hammer, Renata Glasc, Chem-Baroness, Ivern, Green Father, Master Yi, Wuju Bladesman ("While a friendly unit defends alone, it gets +2 [Might]."), Ahri, Nine-Tailed Fox (attackers get -1 [Might]), Shen, Eye of Twilight, Rumble, Mechanized Menace, K'Sante, Pride of Nazumah.
- **Battlefields:** 22 carry a hold or defend clause; the ones that pay per hold are Grove of the God-Willow OGN-280 (draw 1), Startipped Peak OGN-288 (channel 1 rune exhausted), Navori Fighting Pit OGN-283, Altar to Unity OGN-275, Fortified Position OGN-279, Durand Memorial RAD-161, Power Nexus SFD-214 and Cosmic Vista RAD-160 (points), Reckoner's Arena OGN-286.
- **Typical win turn:** 7 (6-8). Holding is the only scoring that ignores the Final Point restriction (471.1.a.1), so this route always has a legal last point; its problem is the first seven.
- **What stops it:** displacement before the Beginning Phase (the hold is checked in the scoring step, 315.2.b, so a unit moved to base on the opponent's turn holds nothing), Assault and pump bursts on the attack, Forbidding Waste UNL-210 ("While a unit here is defending alone, it has -2 [Might]."), Tianna Crownguard against hold-point cards, sweepers on low-Might holders.
- **2v2:** each battlefield is held only by its controller, so a team of two HOLD decks caps at 3 points per round and needs 11. **FFA:** best route for the final point; worst at the first seven, because three opponents take turns attacking the same holder.

### 2.4 BURST: burst conquer through ready, haste and movement

- **Detectable properties:** Accelerate, "I enter ready", effects that ready a unit, Ganking, friendly-move effects, Assault, conquer triggers. 107 closers, 129 enablers. (Accelerate is on 32 pool cards, Ganking on 39, unit-ready effects on 71: DATA, `audit.py`.)
- **Closers:** Kai'Sa, Survivor OGN-039 (20), Sprite Fountain UNL-078 (19), Thousand-Tailed Watcher OGN-116 (12), Ride the Wind OGN-173 (11; "Move a friendly unit and ready it."), Nocturne, Horrifying OGN-194 (9), Raucous Anthem RAD-134 (5), Vayne, Hunter OGN-035 (3), Blazing Scorcher OGN-001 (3); mass readies On the Hunt SFD-204 ("Ready your units."), Shurelya's Requiem SFD-192, Acceleration Gate VEN-150, Confront OGN-129, Bushwhack SFD-004.
- **Enablers:** Tideturner OGN-199 (17), Reckless Innovator RAD-105 (14), First Mate OGN-132 (13), Inferna UNL-002 (9), Pit Crew OGN-091 (6).
- **Legends:** Riven, The Exile RAD ("Units you play to battlefields you control enter ready."), Yasuo, Unforgiven, Miss Fortune, Bounty Hunter (gives Ganking), Irelia, Blade Dancer, Vi, Piltover Enforcer, Ambessa, Matriarch of War, Akali, Rogue Assassin, Kennen, Heart of the Tempest, Sett, The Boss, Jarvan IV, Exemplar of Demacia RAD, Master Yi, Wuju Master (Level 11: "Your units enter ready.").
- **Battlefields:** Windswept Hillock OGN-297 ("Units here have [Ganking]."), Firelights' Hideout RAD-162 (next unit has Accelerate after a conquer), Hall of Legends SFD-210, Targon's Peak OGN-289, Sigil of the Storm OGN-287, Seat of Power SFD-217, Back-Alley Bar OGN-277.
- **Typical win turn:** 6 (6-8); the fastest route in the data. It is also the only route that satisfies the Final Point restriction by conquest: a readied or Ganking unit conquers the second battlefield in the same turn.
- **What stops it:** stun on the readied attacker, Shield/Tank defenders, Vex, Apathetic UNL-150, Minotaur Reckoner SFD-014 ("Units can't move to base."), counterspells on the ready spell (Defy OGN-045 (42), Hush RAD-041 (15), Hard Bargain SFD-136 (11)). It runs the least interaction of the fast routes (median 8 copies), so it folds to a board it cannot out-Might.
- **2v2:** Ganking loses destinations because teammate-occupied battlefields are invalid (447.2.b). **FFA:** a battlefield with a staged combat between two other players cannot be entered (447.2.a), which removes the surprise second conquer exactly when it matters.

### 2.5 POINTS: direct point gain

- **Detectable properties:** the 11 main-deck cards and 2 battlefields of section 1.6 B; trigger doublers of 1.6 E.
- **Closers:** the 11 cards. **Enablers:** Blue Sentinel UNL-087 and Red Brambleback UNL-029 (doublers), Reckoner's Arena OGN-286; move effects for Yasuo, Windrider; Bird/Cat/Dog/Poro units for Ivern, Friend to All.
- **Typical win turn:** each resolved trigger removes one scoring step. A hold-point unit that survives two of your Beginning Phases turns the one-battlefield line (turn 9) into turn 7.
- **What stops it:** killing or displacing the one unit (only Draven, Audacious and Nasus, Ascended have Deflect; the other nine have no built-in protection), Tianna Crownguard ("opponents can't gain points" after errata), cost (Renata's ability is [4] plus four Mind power; Nasus needs [8] to Empower; Bottled Constellation costs 10).
- **DATA:** in PA-SEP 5 of 49 lists play a class-B card (Ahri, Alluring 5 copies in total, Renata Glasc, Mastermind 1, Ivern, Friend to All 1). In PA-NOV 0 of 37 lists play one. The route exists in the pool and is absent from the current sample.
- **2v2:** points are shared (489.8.d), so one partner's point engine works for both, and Victory 11 gives it more time. **FFA:** Draven, Audacious hands a point to a chosen opponent on death: a kingmaking liability.

### 2.6 HIDDEN: Hidden / Ambush tempo

- **Detectable properties:** Hidden units, Ambush, payoffs for hiding or playing from face down. 33 closers, 38 enablers. Hidden cards gain Reaction while face down (811.6); Ambush lets a unit be played at Reaction speed to a battlefield where you have units (822.1.b).
- **Closers:** Scuttle Crab UNL-053 (23), Rengar, Trophy Hunter UNL-120 (18), Edge of Night SFD-139 (7), Pyke, Returned UNL-145 (7), Nidalee, Cat Form UNL-114 (6), Momentary Companion RAD-095 (5), Evelynn, Entrancing UNL-141 (5), Vi, Peacekeeper UNL-176 (5).
- **Enablers:** Bedeviling Stranger RAD-107 (20), Switcheroo SFD-145 (18), Back Off UNL-042 (18), Temporal Breach VEN-066 (14), Hidden Blade OGN-213 (11).
- **Legends:** Teemo, Swift Scout; Evelynn, Agony's Embrace RAD ("Once each turn, when you play a card from face down, draw 1. Then, if it's not your turn, discard 1."). **Battlefields:** Bandle Tree OGN-278, Bandle Scouts' Academy RAD-157.
- **What it is:** a delivery mechanism more than a scoring plan. It wins the combat the opponent thought was safe, then scores by conquer or hold like any other deck. The detector reports it as a route because 17 of 86 lists are built around it; the app should show it next to, not instead of, the scoring route (section 5).
- **What stops it:** Noxus Saboteur OGN-018 ("Your opponents' [Hidden] cards can't be revealed here."), Mystic Vortex VEN-160 ("During showdowns here, cards with [Reaction] cost [Any] more to play."), losing control of the battlefield (466.5.c removes Hidden cards that do not share a controller with the battlefield).
- **2v2:** you may not hide cards at a battlefield your teammate controls (489.8.c.1). **FFA:** fine; hidden information is worth more against several opponents.

### 2.7 ATTRITION: removal, recursion, inevitability

- **Detectable properties:** single-target removal, sweepers, counterspells, trash recursion (Flow, Deathknell, "from your trash"), draw, displacement, Might reduction. 86 closers, 301 enablers: nearly every deck has some, which is why the score is normalised against the field (section 4.3).
- **Closers:** Ferrous Forerunner SFD-021 (17), Thousand-Tailed Watcher OGN-116 (12), Rhasa the Sunderer OGN-195 (12), Astral Heron VEN-044 (9), The Empyrean RAD-060 (3), Seraphic Wyvern RAD-092 (3), Downwell SFD-147 (3).
- **Enablers:** Defy OGN-045 (42), Discipline OGN-058 (37), Stupefy OGN-095 (29), An Offer You Can't Refuse RAD-101 (28), Falling Star OGN-029 (25), Decree of Rage VEN-015 (25).
- **Legends:** Kai'Sa, Daughter of the Void; Ezreal, Prodigal Explorer; Jhin, Virtuoso; Lux, Lady of Luminosity; Mel, Soul's Reflection; Ahri, Nine-Tailed Fox; Mordekaiser, Iron Revenant RAD; Jinx, Loose Cannon; Zed, Master of Shadows.
- **Typical win turn:** 7.5 uncontested (6-9); in practice later, because the plan is to deny the opponent's scoring first.
- **What stops it:** two-battlefield pressure (a deck with few units cannot contest both; points lost early are permanent since points never go down except by card effect), Deflect and can't-be-chosen threats that tax targeted answers (Vex, Apathetic (18), Carrion Dredger (12), Ruin Runner (11)), its own draw volume late (Burn Out gives the opponent a point, 431.2.c).
- **2v2:** shared Victory 11 lengthens the game, which suits it, and it may play spells on the teammate's turn when invited (489.8.a). **FFA:** one-for-one removal loses to two or three opponents; sweepers gain value.

### 2.8 Battlefield point engines

- **FACT:** only three legal battlefields add points: Power Nexus SFD-214 (hold, pay [Any] x4), Cosmic Vista RAD-160 (hold with an empty Rune Deck: 12 runes at 2 per turn, and the hold is checked before the Channel Phase, so the scoring step of turn 7 at the earliest without extra channel effects), The Grand Plaza OGN-293 (alternate win). The Arena's Greatest and Aspirant's Climb are banned.
- **HEURISTIC:** in Bo1 a listed battlefield is in play in one game out of three for its owner (random pick, 485.5), and the opponent benefits from it equally because battlefield text addresses "you" for whoever holds or conquers it. Count a battlefield engine as a bonus, never as the plan. In Bo3 the player chooses (486.5).
- **DATA:** PA-NOV lists contain 0 point battlefields; PA-SEP contains The Grand Plaza once.

### 2.9 Legend engines

- **FACT:** no legend in L-CARDS or GAL (59 legends) gains points by itself. Chem-Baroness only reads the score.
- **HEURISTIC:** a legend defines the route by supplying the same feature every turn. The detector counts each legend feature as 4 copies of a card (section 4.3) and treats the legend as a guaranteed closer when it supplies the route's closer feature (tokens for WIDE, hold payoff for HOLD, ready/Ganking/move for BURST, face-down payoff for HIDDEN).

### 2.10 Combo finishers

| Combo (all texts in 1.6) | What it does | Pieces | Status |
|---|---|---|---|
| Blue Sentinel + Ahri, Alluring / Shen, Leader of the Kinkou Order / Evelynn, In Control at the same battlefield | hold trigger twice: 1 scoring point + 2 gained points per turn from one battlefield | 2 cards | HEURISTIC reading of "Your hold effects for holding here trigger an additional time"; no official ruling found: UNCONFIRMED |
| Red Brambleback + Nasus, Ascended / Swain, Visionary / Tryndamere, Barbarian | conquer trigger twice | 2 cards + condition | UNCONFIRMED, same reason |
| Reckoner's Arena + a conquer-point unit | on hold, "activate the conquer effects of units here" | battlefield + 1 card | UNCONFIRMED whether the conditions on Tryndamere / Swain can be met during a hold |
| Yasuo, Windrider + two extra moves (Ride the Wind, Yasuo, Unforgiven legend "[2], [Exhaust]: Move a friendly unit to or from its base") | third move in a turn scores 1 | 1 card + 2 move effects | FACT for the card text |
| The Grand Plaza + token flood | win on hold with 7+ units there | battlefield + WIDE deck | FACT for the card text |
| Gutter Palace | win at Beginning Phase with exactly 4 cards in hand and exactly 4 units at battlefields | 1 card + hand/board control | FACT for the card text; DATA: 2 copies in PA-SEP, 0 in PA-NOV |
| Ivern, Friend to All + Bird, Cat, Dog and Poro tags among your units | +1 point on each conquer or hold | 1 card + tag set | FACT for the card text |

All gained points here bypass the Final Point restriction (471.1.a.1).

### 2.11 Not a route in this pool

- **Milling the opponent out.** DATA: only two cards make an opponent burn cards (Blade Twirler VEN-002 "choose a player. They [Burn 1]"; Kharox VEN-114 "choose an opponent. They [Burn 3]"). With 40-card decks and one point per burn-out this is support, not a plan.
- **Point denial as a plan.** Tianna Crownguard, Otterpus and Forgotten Monument delay; none of them wins.

## 3. DATA: which legends win by which routes

Method: `detect.py table sept|nov`. Primary route = highest normalised route score (section 4.3). Lists with a main deck that is not exactly 40 cards are dropped (10 of 59 in PA-SEP). Where PA-SEP has no legend field (8 lists) the legend is inferred from the Chosen Champion's name or the deck name; Master Yi lists inferred this way default to Wuju Master.

### 3.1 PA-NOV, n = 37 (post-Radiance; fetched 2026-11-11)

Columns: index | legend | primary route, normalised score | second route, score | closer copies in the primary route | uncontested clock | win-condition sub-score.

```
nov  0 | Riven, The Exile               | HOLD      1.33 | HIDDEN    0.93 | cl  2 | T6 fast   | 0.72
nov  1 | Teemo, Swift Scout             | HIDDEN     3.9 | HOLD      1.58 | cl  6 | T6 fast   | 0.82
nov  2 | Kennen, Heart of the Tempest   | BURST     0.94 | ATTRITION 0.66 | cl  6 | T6 fast   | 0.69
nov  3 | Viktor, Herald of the Arcane   | WIDE      2.05 | ATTRITION 1.29 | cl 10 | T7 medium | 0.83
nov  4 | Diana, Scorn of the Moon       | ATTRITION 0.97 | BURST     0.88 | cl  0 | T6 fast   | 0.57
nov  5 | Lillia, Bashful Bloom          | WIDE      2.29 | ATTRITION 1.01 | cl  8 | T7 medium | 0.86
nov  6 | Ivern, Green Father            | HOLD      4.67 | TALL      0.95 | cl  3 | T6 fast   | 0.83
nov  7 | Evelynn, Agony's Embrace       | HIDDEN    4.07 | HOLD      1.75 | cl 13 | T8 slow   | 0.79
nov  8 | Mordekaiser, Iron Revenant     | WIDE      1.29 | ATTRITION 1.28 | cl  3 | T6 fast   | 0.77
nov  9 | Zed, Master of Shadows         | HIDDEN     0.7 | TALL       0.6 | cl  0 | T7 medium | 0.22
nov 10 | Kha'Zix, Voidreaver            | TALL       1.1 | BURST      1.1 | cl  3 | T6 fast   | 0.77
nov 11 | Orianna, Lady of Clockwork     | WIDE      0.95 | TALL       0.9 | cl  5 | T7 medium | 0.72
nov 12 | Orianna, Lady of Clockwork     | ATTRITION 1.07 | TALL       0.8 | cl  2 | T7 medium | 0.51
nov 13 | Kennen, Heart of the Tempest   | HIDDEN    1.07 | BURST     0.86 | cl  2 | T6 fast   | 0.59
nov 14 | Rek'Sai, Void Burrower         | WIDE      1.38 | BURST     0.72 | cl  6 | T6 fast   | 0.67
nov 15 | Kai'Sa, Daughter of the Void   | ATTRITION  1.3 | TALL       0.5 | cl  5 | T9 slow   | 0.54
nov 16 | Riven, The Exile               | HIDDEN     1.6 | TALL       1.0 | cl  3 | T6 fast   | 0.77
nov 17 | Akali, Rogue Assassin          | HOLD      1.33 | BURST     1.14 | cl  2 | T8 slow   | 0.73
nov 18 | Jarvan IV, Exemplar of Demacia | TALL      1.65 | HOLD       1.0 | cl  2 | T8 slow   | 0.75
nov 19 | Ziggs, Hexplosives Expert      | WIDE      0.76 | ATTRITION 0.63 | cl  2 | T7 medium | 0.45
nov 20 | Ekko, Boy Who Shattered Time   | BURST     2.88 | HIDDEN     0.9 | cl 11 | T6 fast   | 0.81
nov 21 | K'Sante, Pride of Nazumah      | HOLD      4.92 | HIDDEN     1.0 | cl  1 | T7 medium | 0.87
nov 22 | Seraphine, Starry-Eyed Songstr | WIDE      1.86 | ATTRITION 1.45 | cl  6 | T6 fast   | 0.85
nov 23 | Rengar, Pridestalker           | HIDDEN    2.07 | TALL      1.02 | cl  8 | T6 fast   | 0.74
nov 24 | Leona, Radiant Dawn            | HOLD      2.08 | TALL      1.82 | cl  4 | T8 slow   | 0.80
nov 25 | Master Yi, Wuju Bladesman      | HIDDEN    1.47 | TALL      1.27 | cl  7 | T7 medium | 0.88
nov 26 | Sett, The Boss                 | TALL      2.48 | BURST     1.28 | cl  3 | T6 fast   | 0.86
nov 27 | Pyke, Bloodharbor Ripper       | ATTRITION 1.36 | HOLD      0.58 | cl  2 | T8 slow   | 0.52
nov 28 | Rumble, Mechanized Menace      | BURST     1.62 | WIDE       0.9 | cl  3 | T6 fast   | 0.70
nov 29 | Vex, Gloomist                  | HIDDEN    2.73 | HOLD      2.42 | cl  5 | T7 medium | 0.91
nov 30 | Azir, Emperor of the Sands     | TALL      1.62 | WIDE       1.1 | cl  0 | T7 medium | 0.51
nov 31 | Renekton, Butcher of the Sands | TALL      1.25 | BURST     0.98 | cl  5 | T6 fast   | 0.80
nov 32 | Draven, Glorious Executioner   | HIDDEN    3.07 | BURST     0.86 | cl  9 | T7 medium | 0.73
nov 33 | Volibear, Relentless Storm     | TALL      2.75 | BURST     1.02 | cl 15 | T8 slow   | 0.78
nov 34 | Ahri, Nine-Tailed Fox          | ATTRITION 1.28 | HIDDEN     0.9 | cl  3 | T7 medium | 0.70
nov 35 | Mel, Soul's Reflection         | HIDDEN     1.3 | ATTRITION 0.97 | cl  3 | T7 medium | 0.66
nov 36 | Ornn, Fire Below the Mountain  | TALL      0.95 | ATTRITION 0.87 | cl  0 | T6 fast   | 0.46
```

Deck names and URLs for each index: `analysis/wincons/out-nov.txt` and `pa-decks-2026-11-11.json`.

Totals (DATA): primary HIDDEN 10, WIDE 7, TALL 7, HOLD 5, ATTRITION 5, BURST 3; secondary BURST 9, TALL 9, ATTRITION 8, HOLD 5, HIDDEN 4, WIDE 2. No list triggers ALTWIN, COMBO or a battlefield engine. Tournament-labelled lists in this sample: Kennen (named "1st ... Regional Championship Europe") is HIDDEN over BURST; Riven (named "1st place ... Sacramento Showdown") HIDDEN over TALL; Lillia (named "1st ... Win-A-Case") WIDE; Diana (named "1º Melbourne Showdown") ATTRITION over BURST; Akali (named "2nd Place - LDXP Sacramento 25k") HOLD over BURST; Kai'Sa (named "RC Stuttgart Top 8") ATTRITION. Placement claims are from deck names: UNCONFIRMED.

### 3.2 PA-SEP, n = 49 (pre-Radiance; includes lists older than the July ban)

```
Ahri, Nine-Tailed Fox                    WIDE 1, ATTRITION 1
Annie, Dark Child                        WIDE 2
Azir, Emperor of the Sands               TALL 1
Darius, Hand of Noxus                    WIDE 1
Diana, Scorn of the Moon                 ATTRITION 2
Draven, Glorious Executioner             HIDDEN 1, BURST 1
Ezreal, Prodigal Explorer                ATTRITION 2
Fiora, Grand Duelist                     TALL 1
Irelia, Blade Dancer                     BURST 1, HIDDEN 1
Ivern, Green Father                      HOLD 1
Jax, Grandmaster at Arms                 TALL 1
Jhin, Virtuoso                           ATTRITION 2
Jinx, Loose Cannon                       ATTRITION 1
Kai'Sa, Daughter of the Void             ATTRITION 2
Kha'Zix, Voidreaver                      HIDDEN 1
LeBlanc, Deceiver                        ATTRITION 1
Lillia, Bashful Bloom                    WIDE 1
Lux, Lady of Luminosity                  ATTRITION 1
Master Yi, Wuju Bladesman                TALL 2
Master Yi, Wuju Master                   TALL 1
Ornn, Fire Below the Mountain            WIDE 1, BURST 1
Poppy, Keeper of the Hammer              ATTRITION 1
Pyke, Bloodharbor Ripper                 ATTRITION 1, WIDE 1
Rek'Sai, Void Burrower                   HIDDEN 1, WIDE 1
Rengar, Pridestalker                     HIDDEN 2
Sett, The Boss                           TALL 2
Sivir, Battle Mistress                   TALL 1
Teemo, Swift Scout                       HIDDEN 1
Vex, Gloomist                            HOLD 3
Vi, Piltover Enforcer                    BURST 1
Viktor, Herald of the Arcane             WIDE 1, ATTRITION 1
Volibear, Relentless Storm               TALL 1
primary route totals [('ATTRITION', 15), ('TALL', 10), ('WIDE', 9), ('HIDDEN', 7), ('HOLD', 4), ('BURST', 4)] n 49
secondary route totals [('WIDE', 12), ('BURST', 12), ('TALL', 11), ('ATTRITION', 7), ('HIDDEN', 6), ('POINTS', 1)]
specials [('BF_SYMMETRIC', 19), ('ALTWIN', 2)]
```

Per-list lines: `analysis/wincons/out-sept.txt`.

### 3.3 What the data says

- **DATA:** the same legend is not locked to one route. Viktor is WIDE in two of three lists and ATTRITION in one; Orianna splits WIDE / ATTRITION; Kennen splits BURST / HIDDEN; Riven splits HOLD / HIDDEN; Rek'Sai splits BURST / WIDE; Ahri moved from WIDE or ATTRITION (September) to ATTRITION (November). A legend-to-archetype lookup table would be wrong for these; the route has to be computed from the 40 cards.
- **DATA:** ATTRITION was the most common primary route in September (15 of 49) and fell to 5 of 37 in November; HIDDEN rose from 7 of 49 to 10 of 37. Small samples, different sampling rules: treat as a hint, not a trend.
- **DATA:** direct point cards went from 5 of 49 lists to 0 of 37. Current tournament-labelled lists win by scoring battlefields only.
- **DATA:** 9 of 86 lists run a main-deck sweeper. WIDE is the least-answered route in the sample.

## 4. Deterministic detection rules

Implementation: `docs/research/analysis/wincons/detect.py` (Python 3 standard library, about 380 lines). Supporting scripts: `build_pool.py` (GAL -> `cards-current.json`), `fetch_decks.py` (PA-NOV), `audit.py` (which cards carry a feature), `pool_routes.py` (census for section 2). Everything in this section is **HEURISTIC** design; the numbers are fixed constants so that the same list always gives the same output.

### 4.1 Card features

Reminder text in parentheses is stripped first, so "(Opponents must pay ...)" never matches. One regex per feature (exact patterns are the `RX` table in `detect.py`):

| Feature | Meaning | Pool cards (DATA, `audit.py`) |
|---|---|---|
| point_self / point_gift | "score 1 point" for you / for an opponent ("would score" and "that player gains" excluded) | 13 / 2 |
| altwin, denial, doubler | "you win the game"; "can't score", "points needed to win", "draw 1 instead"; "trigger an additional time", "activate the conquer effects" | 2, 4, 5 |
| haste | unit with `[Accelerate]` or "I enter ready" | 57 |
| ready | a "ready ..." clause whose object is a unit, me, it or them (runes, gear, legend excluded) | 71 |
| gank, move_friendly, assault, pump | `[Ganking]`; "move me / a friendly unit / your ..."; `[Assault`; "+N [Might] this turn/combat" | 39, 31, 44, 97 |
| token, multi_token, token_engine, widepay | unit-token makers; two or more tokens; repeatable token source; "for each unit", "your units have +", "N+ units" | 58, 15, 36, 18 |
| cheap, mighty, big, top_end | unit cost <= 2; Might >= 5 (rule 708); Might >= 6; cost >= 7 | 80, 198, 112, 65 |
| scaling, mightypay, buff, equip, prot | self-scaling Might; `[Mighty]` text; buff; `[Equip]`; Deflect / can't be chosen / death replacement | 10, 12, 39, 41, 65 |
| holdpay, conqpay, shield, tank, stun, deftrick | hold trigger; conquer or attack trigger; `[Shield`; `[Tank]`; stun; "defend" | 43, 85, 39, 30, 28, 23 |
| removal, sweep, displace, debuff, counter | single-target kill / damage / steal; mass kill / damage / bounce; move or bounce an enemy unit; -Might or Disarm; counterspell | 120, 13, 38, 34, 9 |
| recur, draw, ramp | trash use, Flow, Deathknell; draw; channel / Add / Gold | 78, 128, 83 |
| hidden, hidden_unit, ambush, facedown_pay | `[Hidden]`; Hidden on a unit; `[Ambush]`; payoff for hiding or playing from face down | 50, 21, 15, 17 |

### 4.2 Routes: weights per copy and the closer test

| Route | Weight per copy of a card with the feature | A card is a closer when |
|---|---|---|
| WIDE | token 1.0, multi_token 1.0, widepay 1.5, cheap 0.5 | widepay, or multi_token, or a non-spell token_engine |
| TALL | big 1.0, scaling 1.0, mightypay 1.0, buff 0.75, equip 0.75, pump 0.5, prot 0.5 | unit with Might >= 6, or scaling, or Might >= 5 with prot or Ganking |
| HOLD | holdpay 1.5, shield 1.0, tank 1.0, stun 0.5, deftrick 0.5 | unit with holdpay, or unit with Shield/Tank and Might >= 4 |
| BURST | haste 1.0, ready 1.0, gank 0.75, move_friendly 0.75, assault 0.5, conqpay 0.5, enter_ready 0.5 | haste unit with Might >= 4 or Assault; a non-unit ready effect; Ganking unit with Might >= 4; ready-effect unit with Might >= 4 |
| POINTS | point_self 3.0, doubler 1.0 | point_self |
| HIDDEN | hidden 0.25, hidden_unit 1.0, ambush 1.0, facedown_pay 1.5 | facedown_pay, or a Hidden/Ambush unit with Might >= 3 |
| ATTRITION | removal 1.0, sweep 1.5, counter 0.75, recur 0.75, draw 0.5, displace 0.5, debuff 0.5 | sweep, or a unit costing >= 7, or a recursion unit costing >= 5 |

Special rule-based routes, reported separately with their named cards: ALTWIN (The Grand Plaza among the battlefields; Gutter Palace in the main deck), COMBO (a doubler together with a hold- or conquer-triggered point card; Yasuo, Windrider with move enablers), BF_ENGINE (a battlefield with point_self), LEGEND_ENGINE (legend with point_self; none exists today), BF_SYMMETRIC (The Arena's Greatest).

### 4.3 Route score and ranking

```
raw(route)  = sum over main-deck cards of copies x (sum of the route's weights for features on the card)
            + 4 x (sum of weights for features on the legend)          # legend: available every turn
            + 1 x (sum of weights for features on each of the 3 battlefields)
norm(route) = raw(route) / REF(route)
REF = WIDE 10.5, TALL 10.0, HOLD 6.0, BURST 12.5, POINTS 6.0, HIDDEN 7.5, ATTRITION 19.0
```

REF is the 75th percentile of raw over the 86 complete lists (`detect.py calibrate`; POINTS has a 75th percentile of 0, so its REF is set to two copies of a point card). Routes are ranked by norm: 1.0 means "as committed to this route as the top quarter of the field". Without the normalisation every deck would be ATTRITION, because removal and draw are everywhere (301 pool enablers).

### 4.4 Redundancy and speed

- **Closer redundancy:** closer copies and distinct names in the primary route, and `P(closer by turn 5) = 1 - C(40-k, 9) / C(40, 9)`: at least one of k copies in 9 cards (4-card opening hand, rule 116, plus 5 draws; mulligan ignored). It is set to 1.0 when the Chosen Champion is a closer (it starts in the Champion Zone, rule 103.2.a.1; the formula still uses a 40-card deck although one copy sits outside it, a small overestimate of n) or when the legend supplies the closer feature. Reference values: 3 copies 0.55, 6 copies 0.81, 9 copies 0.93.
- **Speed (uncontested clock, from section 1.5):**

```
t_first  = 1 if >= 6 copies of haste units costing <= 1
           2 if cheap units + those >= 8
           3 otherwise
two_bf   = min(1, (cheap + token + gank + haste + ready [+4 if the legend makes tokens / readies / moves]) / 20)
ppt      = 1 + two_bf                         # points per turn, between 1 and 2 (rule 470 cap in 1v1)
bonus    = min(2, 0.25 x copies of point_self)
clock    = t_first + ceil((8 - 1 - bonus) / ppt)
label    = fast (<= 6), medium (7), slow (>= 8)
```

  The clock reproduces the first line of the 1.5 table (t_first 2, ppt 2 -> turn 6) and the one-battlefield line (ppt 1 -> turn 9). It does not model the opponent.
- **Final point reach**, three numbers in 0-1: `hold = min(1, (shield + tank + holdpay + prot [+4 legend]) / 12)`, `double_conquer = min(1, (haste + ready + gank + move_friendly [+4 legend]) / 12)`, `direct = min(1, point_self / 4 + 0.34 x point battlefields)`.

### 4.5 "Folds to" rules

Each line is emitted only when its condition holds, and names cards. Answer cards are taken from the pool by feature and ordered by copies played in PA-NOV (shown in brackets), so the list follows the current sample rather than the alphabet.

| Condition | Line |
|---|---|
| primary is TALL, POINTS or HOLD and under 50% of closer copies have prot | single-target removal / bounce on the top closer (named), with the share of protected closers |
| average unit Might <= 3.2, or primary is WIDE | sweepers, with average Might and token-maker count |
| BURST is primary or second | stun on the readied attacker; Shield/Tank defenders |
| primary is HOLD, or hold reach >= 0.75 | displacement of the holder before the Beginning Phase |
| primary is ATTRITION | two-battlefield pressure (unit count, single-target vs sweeper count); Deflect tax |
| primary is HIDDEN, or >= 8 Hidden copies | Noxus Saboteur, Mystic Vortex, rule 466.5.c |
| >= 5 Equipment copies | gear removal |
| >= 8 trash-using copies | trash hate |
| any point_self card or point battlefield | Tianna Crownguard |
| fewer than 8 interaction copies (removal + sweep + counter + stun + displace) | any faster racer |
| fewer than 6 closer copies and neither champion nor legend is a closer | discard / counterspell on the few closers |

### 4.6 Win-condition sub-score (0-1)

```
S = 0.30 x closer + 0.25 x depth + 0.15 x plan_b + 0.20 x final_point + 0.10 x resilience

closer      = P(closer by turn 5) of the primary route                      (4.4)
depth       = min(1, norm(primary) / 1.5)
plan_b      = min(1, norm(second) / norm(primary)) x min(1, norm(second))
final_point = max(hold, double_conquer, direct)                              (4.4)
resilience  = min(1, (prot + 0.5 x recur + counter copies) / 8)
```

DATA over the 86 complete lists: mean 0.72 (PA-SEP) and 0.71 (PA-NOV), minimum 0.22, maximum 0.95. By primary route: HOLD 0.83, BURST 0.82, HIDDEN 0.74, TALL 0.74, WIDE 0.73, ATTRITION 0.57. The low ATTRITION mean is a property of the formula (few closers, low final-point reach), not evidence that control lists are worse: the score measures "how reliably does this list present a way to reach 8", and must be shown with that wording. Correlation with results: UNCONFIRMED.

## 5. Prototype output on six real lists from six legends

Command: `python3 detect.py show nov 3 nov 6 nov 20 nov 33 nov 15 nov 7` (PA-NOV, fetched 2026-11-11). Raw output, unedited (`analysis/wincons/out-six-lists.txt`):

```
### LDXP Sacramento / Best Of Viktor / Calvin Jin
legend: Viktor, Herald of the Arcane | champion: Viktor, Leader | main 40 | https://piltoverarchive.com/decks/view/60b43a42-2794-4ecf-bd74-6d14c6dba81b
win-condition sub-score 0.835  parts {'closer': 1.0, 'depth': 1.0, 'plan_b': 0.629, 'final_point': 0.58, 'resilience': 0.75}
speed: medium - goldfish win turn 7 (first conquer T3, 2.0 pts/turn, 0.0 bonus pts) | final point reach {'hold': 0.25, 'double_conquer': 0.58, 'direct': 0.0}
1. WIDE Go-wide flood (both battlefields)  norm 2.05 (raw 21.5) | closers 10 copies / 4 names, P(closer by T5) 1.0 [champion] [legend] | legend: token
   closers: 3x Sprite Burst, 3x Concert Poster, 3x Sprite Fountain, 1x Viktor, Leader
   enablers: 3x Carrion Dredger
2. ATTRITION Attrition / recursion control  norm 1.29 (raw 24.5) | closers 1 copies / 1 names, P(closer by T5) 0.225 | battlefields: Forbidding Waste
   closers: 1x Thousand-Tailed Watcher
   enablers: 3x Bellows Breath, 3x Hidden Blade, 3x Imperial Decree, 3x Stupefy, 3x Wages of Pain, 3x Carrion Dredger (+4 more)
3. BURST Burst conquer (ready/haste/move)  norm 0.68 (raw 8.5) | closers 7 copies / 3 names, P(closer by T5) 0.859
   closers: 3x Sprite Burst, 3x Sprite Fountain, 1x Thousand-Tailed Watcher
   enablers: 3x Concert Poster
folds to:
   - sweepers (average unit Might 2.7, 13 token-maker copies) - e.g. Downwell (3), Unchecked Power (2), Flurry of Blades (0), Cannon Barrage (0), Glowstone (0)
   - Hidden hate (8 Hidden copies): Noxus Saboteur (your Hidden cards can't be revealed at its battlefield), Mystic Vortex (Reaction cards cost [Any] more in showdowns there); a lost combat removes your face-down cards there (rule 466.5.c)

### Best Of List Radiance
legend: Ivern, Green Father | champion: Ivern, Nurturer | main 40 | https://piltoverarchive.com/decks/view/f0b46fab-c82e-4ad1-9254-8fdfe4171ff3
win-condition sub-score 0.829  parts {'closer': 1.0, 'depth': 1.0, 'plan_b': 0.193, 'final_point': 1.0, 'resilience': 0.5}
speed: fast - goldfish win turn 6 (first conquer T2, 1.8 pts/turn, 0.0 bonus pts) | final point reach {'hold': 1.0, 'double_conquer': 0.33, 'direct': 0.0}
1. HOLD Hold-and-defend  norm 4.67 (raw 28.0) | closers 3 copies / 2 names, P(closer by T5) 1.0 [champion] [legend] | legend: holdpay | battlefields: Forbidding Waste
   closers: 2x Ivern, Nurturer, 1x Blitzcrank, Impassive
   enablers: 3x Mutated Mouser, 2x Block, 3x Stalwart Poro, 3x Back Off, 1x For Demacia!, 1x Daisy!
2. TALL Go-tall single threat  norm 0.95 (raw 9.5) | closers 1 copies / 1 names, P(closer by T5) 0.225
   closers: 1x Daisy!
   enablers: 2x Iridescent Avian, 3x Discipline, 2x Ivern, Nurturer, 3x Raucous Anthem, 2x Friendship, 1x Frisky Hunter
3. WIDE Go-wide flood (both battlefields)  norm 0.62 (raw 6.5) | closers 1 copies / 1 names, P(closer by T5) 0.225
   closers: 1x Frisky Hunter
   enablers: 3x Mutated Mouser, 3x Stalwart Poro, 3x Trusty Ramhound, 2x Fallen Feline
folds to:
   - single-target removal/bounce on Ivern, Nurturer (0% of closer copies have Deflect or can't-be-chosen) - e.g. Decree of Rage (25), Falling Star (25), Decree of Unity (16), Temporal Breach (14)
   - sweepers (average unit Might 2.9, 1 token-maker copies) - e.g. Downwell (3), Unchecked Power (2), Flurry of Blades (0), Cannon Barrage (0), Glowstone (0)
   - displacement of the holder before your Beginning Phase - e.g. Bedeviling Stranger (20), Star-Crossed (20), Gust (19), Charm (16), Irresistible Faefolk (12)

### Ekko Ingenious Theorycraft
legend: Ekko, Boy Who Shattered Time | champion: Ekko, Ingenious | main 40 | https://piltoverarchive.com/decks/view/7c358ad1-68c7-4f94-9ad3-a1a6f4159dc4
win-condition sub-score 0.805  parts {'closer': 1.0, 'depth': 1.0, 'plan_b': 0.281, 'final_point': 1.0, 'resilience': 0.125}
speed: fast - goldfish win turn 6 (first conquer T2, 2.0 pts/turn, 0.0 bonus pts) | final point reach {'hold': 0.0, 'double_conquer': 1.0, 'direct': 0.0}
1. BURST Burst conquer (ready/haste/move)  norm 2.88 (raw 36.0) | closers 11 copies / 5 names, P(closer by T5) 1.0 [champion] | battlefields: Emperor's Dais, Seat of Power, The Candlelit Sanctum
   closers: 3x Vayne, Hunter, 2x Ekko, Revolutionary, 2x Kai'Sa, Survivor, 3x Thousand-Tailed Watcher, 1x Ekko, Ingenious
   enablers: 3x Antagonistic Apparatus, 3x Pyke, Dockside Butcher, 2x War Scout, 3x Inferna
2. HIDDEN Hidden / Ambush tempo (face-down reactions)  norm 0.9 (raw 6.75) | closers 0 copies / 0 names, P(closer by T5) 0.0
   closers: -
   enablers: 3x Pyke, Dockside Butcher, 3x Inferna
3. ATTRITION Attrition / recursion control  norm 0.89 (raw 17.0) | closers 3 copies / 1 names, P(closer by T5) 0.545 | battlefields: Emperor's Dais, Seat of Power
   closers: 3x Thousand-Tailed Watcher
   enablers: 3x Stupefy, 2x Void Seeker, 2x Watchful Sentry, 2x Shock Blast, 1x Falling Star, 2x Kai'Sa, Survivor (+2 more)
folds to:
   - sweepers (average unit Might 3.0, 3 token-maker copies) - e.g. Downwell (3), Unchecked Power (2), Flurry of Blades (0), Cannon Barrage (0), Glowstone (0)
   - stun on the readied attacker and Shield/Tank defenders (a stunned unit deals no combat damage) - e.g. Back Off (18), Ki Burst (5), Existential Dread (3), Facebreaker (1)
   - any faster racer: only 7 interaction copies in the main deck

### DRAGONSTORM - Radaince
legend: Volibear, Relentless Storm | champion: Volibear, Furious | main 40 | https://piltoverarchive.com/decks/view/342e3f0f-815a-4b9a-8ebc-c36d47208645
win-condition sub-score 0.781  parts {'closer': 1.0, 'depth': 1.0, 'plan_b': 0.371, 'final_point': 0.75, 'resilience': 0.25}
speed: slow - goldfish win turn 8 (first conquer T3, 1.7 pts/turn, 0.0 bonus pts) | final point reach {'hold': 0.08, 'double_conquer': 0.75, 'direct': 0.0}
1. TALL Go-tall single threat  norm 2.75 (raw 27.5) | closers 15 copies / 7 names, P(closer by T5) 1.0 [champion] | legend: mightypay
   closers: 3x Kadregrin the Infernal, 3x Gentle Gemdragon, 3x Seraphic Wyvern, 2x Direwing, 2x Elder Dragon, 1x Volibear, Furious (+1 more)
   enablers: 3x Show of Strength, 3x Dune Drake, 1x Vi, Destructive
2. BURST Burst conquer (ready/haste/move)  norm 1.02 (raw 12.75) | closers 8 copies / 3 names, P(closer by T5) 0.897 | battlefields: Sigil of the Storm
   closers: 3x Dune Drake, 3x Blazing Scorcher, 2x Direwing
   enablers: 1x Vi, Destructive, 1x Confront, 1x Volibear, Furious
3. ATTRITION Attrition / recursion control  norm 0.39 (raw 7.5) | closers 4 copies / 2 names, P(closer by T5) 0.656
   closers: 3x Kadregrin the Infernal, 1x Ferrous Forerunner
   enablers: 3x Mobilize, 3x Show of Strength, 1x Sky Splitter, 1x Vi, Destructive, 1x Confront
folds to:
   - single-target removal/bounce on Kadregrin the Infernal (7% of closer copies have Deflect or can't-be-chosen) - e.g. Decree of Rage (25), Falling Star (25), Decree of Unity (16), Temporal Breach (14)
   - stun on the readied attacker and Shield/Tank defenders (a stunned unit deals no combat damage) - e.g. Back Off (18), Ki Burst (5), Existential Dread (3), Facebreaker (1)
   - any faster racer: only 1 interaction copies in the main deck

### RC Stuttgart Top 8 Best of Kaisa ChallengerTCG Daniel Zidenberg
legend: Kai'Sa, Daughter of the Void | champion: Kai'Sa, Survivor | main 40 | https://piltoverarchive.com/decks/view/8e8dd2b6-eeba-4fd8-9d26-0fe2bec4df96
win-condition sub-score 0.54  parts {'closer': 0.742, 'depth': 0.867, 'plan_b': 0.192, 'final_point': 0.33, 'resilience': 0.062}
speed: slow - goldfish win turn 9 (first conquer T3, 1.35 pts/turn, 0.0 bonus pts) | final point reach {'hold': 0.17, 'double_conquer': 0.33, 'direct': 0.0}
1. ATTRITION Attrition / recursion control  norm 1.3 (raw 24.75) | closers 5 copies / 2 names, P(closer by T5) 0.742
   closers: 3x Thousand-Tailed Watcher, 2x The Empyrean
   enablers: 3x Bilgewater Tracker, 3x Falling Star, 3x Hextech Ray, 3x Stupefy, 3x Temporal Breach, 2x Singularity (+5 more)
2. TALL Go-tall single threat  norm 0.5 (raw 5.0) | closers 5 copies / 2 names, P(closer by T5) 0.742
   closers: 3x Thousand-Tailed Watcher, 2x The Empyrean
   enablers: -
3. BURST Burst conquer (ready/haste/move)  norm 0.48 (raw 6.0) | closers 4 copies / 2 names, P(closer by T5) 1.0 [champion]
   closers: 3x Thousand-Tailed Watcher, 1x Kai'Sa, Survivor
   enablers: 3x Plundering Poro
folds to:
   - two-battlefield pressure: 20 unit copies to contest 2 battlefields, 16 single-target answers vs 0 sweepers; Deflect taxes every targeted answer - e.g. Vex, Apathetic (18), Carrion Dredger (12), Ruin Runner (11), Fiora, Victorious (5)
   - discard / counterspell on the few closers (5 copies)

### mimi’s best of evelynn melbourne showdown
legend: Evelynn, Agony's Embrace | champion: Evelynn, Entrancing | main 40 | https://piltoverarchive.com/decks/view/c9ef3662-b6ff-44e0-b640-636eefb56a25
win-condition sub-score 0.786  parts {'closer': 1.0, 'depth': 1.0, 'plan_b': 0.43, 'final_point': 0.67, 'resilience': 0.375}
speed: slow - goldfish win turn 8 (first conquer T3, 1.5 pts/turn, 0.0 bonus pts) | final point reach {'hold': 0.67, 'double_conquer': 0.42, 'direct': 0.0}
1. HIDDEN Hidden / Ambush tempo (face-down reactions)  norm 4.07 (raw 30.5) | closers 13 copies / 7 names, P(closer by T5) 1.0 [champion] [legend] | legend: facedown_pay | battlefields: Bandle Tree, Bandle Scouts' Academy
   closers: 3x Momentary Companion, 1x Evelynn, Entrancing, 2x Gutter Guardian, 2x Pyke, Returned, 2x Nidalee, Cat Form, 2x Rengar, Trophy Hunter (+1 more)
   enablers: 3x Bedeviling Stranger, 2x Switcheroo
2. HOLD Hold-and-defend  norm 1.75 (raw 10.5) | closers 3 copies / 1 names, P(closer by T5) 0.545 | battlefields: Grove of the God-Willow
   closers: 3x K'Sante, Courageous
   enablers: 2x Vex, Apathetic, 1x Existential Dread
3. TALL Go-tall single threat  norm 0.9 (raw 9.0) | closers 2 copies / 1 names, P(closer by T5) 0.404
   closers: 2x Rengar, Trophy Hunter
   enablers: 2x Boots of Swiftness, 2x Hold 'Em, 2x Punch First, 2x Rampage, 2x Vex, Apathetic, 1x Edge of Night (+1 more)
folds to:
   - Hidden hate (14 Hidden copies): Noxus Saboteur (your Hidden cards can't be revealed at its battlefield), Mystic Vortex (Reaction cards cost [Any] more in showdowns there); a lost combat removes your face-down cards there (rule 466.5.c)
```

### 5.1 Do the outputs differ meaningfully?

**Yes (DATA).** Six lists give six different primary routes (WIDE, HOLD, BURST, TALL, ATTRITION, HIDDEN), six different closer sets with no card shared between the primary closer lists except Thousand-Tailed Watcher (Kai'Sa primary, Ekko primary), clocks from turn 6 to turn 9, sub-scores from 0.54 to 0.84, and between one and three different "folds to" lines. Nothing in the reports is a template sentence without a deck-specific number or card name.

### 5.2 Are they correct?

Checked by reading each list's cards against the legend text (HEURISTIC judgement by the author of this document, not by a player of the deck):

| List | Detector says | Judgement |
|---|---|---|
| Viktor | WIDE 2.05, legend and champion are closers; sweepers and Hidden hate | Correct. The legend makes a Recruit token each turn; Sprite Burst, Sprite Fountain and Concert Poster are the mass-token cards. Second route ATTRITION 1.29 matches the removal and Might-reduction spells listed as its enablers. |
| Ivern | HOLD 4.67, clock 6, displacement and removal on Blitzcrank, Impassive | Plausible. The legend and Ivern, Nurturer are hold payoffs and the list is full of Shield/Tank bodies. The top closer named for removal should be the champion, not a one-of Blitzcrank: ordering bug (closers are sorted by weight x copies, then name). |
| Ekko | BURST 2.88, 11 closer copies, double-conquer reach 1.0, only 7 interaction copies | Correct in kind. Vayne, Hunter, Kai'Sa, Survivor, Ekko, Revolutionary, Thousand-Tailed Watcher are all ready-on-entry or Accelerate units. |
| Volibear | TALL 2.75, 15 closer copies, clock 8, 1 interaction copy | Correct. A Dragon ramp list; "any faster racer: only 1 interaction copy" is the true weakness. |
| Kai'Sa | ATTRITION 1.3, 16 single-target answers, 0 sweepers, sub-score 0.54 | Correct in kind; the low sub-score is the formula's bias against control (4.6). |
| Evelynn | HIDDEN 4.07, legend is a closer, 14 Hidden copies | Correct about the engine. It does not say how the list scores once the ambush wins a combat: HOLD 1.75 in second place is the hint. |

Known errors and limits (all reproducible in the output above):

1. **One card can be a closer in several routes** (Thousand-Tailed Watcher appears under ATTRITION, TALL and BURST in the Kai'Sa report). This inflates plan_b. Fix: assign each card to the route where its weight is highest before computing the second route.
2. **Keyword presence is not use.** K'Sante lists score HOLD 4.92 on Shield count although the legend turns Shield into Assault ("I have [Assault] equal to my [Shield]"). Legend text that converts one feature into another needs explicit rules.
3. **HIDDEN is a delivery mechanism.** It should be a second axis ("how the deck wins combats") beside the scoring route, not a competitor to it.
4. **"Folds to" answers repeat across decks** because they come from one pool-wide ranking. They become specific only when crossed with an opponent's actual list; that belongs to the matchup feature.
5. **The removal regex is loose** (120 pool cards): conditional and self-damaging effects count the same as clean answers. It needs the direction analysis that `Untitled/apps/web/src/lib/scoring.ts` already does (`removalDirection`, `damageDirection`).
6. **POINTS, ALTWIN and COMBO are untested on current lists**: no PA-NOV list contains their cards. They fire on PA-SEP only: ALTWIN on a Jhin list (Gutter Palace) and an Ahri list (The Grand Plaza), and POINTS as second route on one Vex list (Ahri, Alluring).
7. **The clock ignores the opponent** and the "two units on turn 1" line; it is a ranking aid between lists, not a prediction.
8. **REF constants are fitted to 86 lists from two different metas.** They must be recomputed whenever the corpus is refreshed (`detect.py calibrate`).
9. **Card data:** 13 RAD cards have an inferred type; pre-Radiance errata other than Tianna were not applied.

## 6. What the app should take from this

- Model `scoreBattlefield` and `gainPoint` as different events (CR-OCT 470.1-470.3); the Final Point rule and Forgotten Monument apply to the first, Tianna Crownguard to the second.
- Show for every deck: ranked routes with the named closers and enablers, closer copies with the turn-5 probability, the three final-point numbers (hold / double conquer / direct), the uncontested clock with its inputs, and the conditional "folds to" lines. Every number above has a formula in section 4, so each can be shown with its reason.
- Mode switch: Victory 8 with 2 battlefields (1v1), Victory 8 with 3 (FFA), Victory 11 with 3 and shared points (2v2), with the mode notes of section 2 attached to the deck's primary route.
- Refresh order: GAL (cards) -> ban list -> deck corpus -> `calibrate`. The detector reads only `cards-current.json`, so a new set needs no code change unless it brings a new keyword (Deploy, Disarm and Show Off are present in the pool but only Disarm is mapped to a feature today).
