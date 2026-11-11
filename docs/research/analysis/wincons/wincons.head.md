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

