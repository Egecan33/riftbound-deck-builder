# Matchups, sideboarding and turn-by-turn lines, generated from data

Research for Riftbound Forge. Written 2026-11-11. All web sources fetched 2026-11-11 unless a different date is given.

Labels: **FACT** = primary source (rules document, card data, the site that owns the number). **DATA** = measured by a script in `docs/research/analysis/matchups-and-lines/`, with dataset and n. **HEURISTIC** = our judgement or a model we defined. **UNCONFIRMED** = could not be verified.

Rule numbers are Core Rules edition 2026-07-16 (`~/github_repositories/GameLab/data/rules/core-rules.md`), written `CR n`. The current edition is 2026-10-09; section 2.9 maps every number that moved. Tournament Rules are edition 2026-10-09, written `TR n`. Card names and texts are copied by script from `GameLab/data/cards/cards.json`.

## 0. Read this first: what is stale

- FACT: a fifth main set, Radiance (RAD), released 2026-10-23 and is Standard-legal (TR 601.3.c.6, https://www.riftboundfaq.com/rules-documents/tournament-rules/2026-10-09). `cards.json` has 931 cards from OGN, OGS, SFD, UNL, VEN and no RAD card. Every worked example below is therefore a pre-Radiance list. The generator is set-agnostic; the examples are not the current meta.
- FACT: Core Rules were updated 2026-10-09 (Rules Hub, https://playriftbound.com/en-us/news/organizedplay/riftbound-tournament-rules/). The local copy is 2026-07-16. 49 of the 83 rule numbers cited here moved or were reworded (mostly +1 or +2 from CR 416 on); none of the mechanics used here changed in substance except the 2v2 scoring wording (2.8). New keywords Deploy (830), Disarm (831), Show Off (832) exist in the new edition and are not modelled.
- DATA: the deck sample (`GameLab/data/decks/samples/piltover-archive-2026-09-06.json`, 59 lists in the file; its header says "60 most recent") is mostly "Best of <legend>" lists from the Hartford, Utrecht, Vancouver and Sydney Regional Qualifiers: 33 legends, at most 3 lists each. It is flat by construction, so it measures what tuned lists contain, not how often a legend is played. Only 7 of 1,070 resolved main-deck card slots are VEN cards.
- FACT: the Radiance field is dominated by legends that are not in our card file. RiftMana reports Riven at 43% of the Day 1 field at the Stuttgart Regional Championship (https://riftmana.com/stuttgart-regional-championship-meta-report-radiance/, published 2026-11-05).

## 1. What players actually say

Collected from primers, guides and tournament reports. Each row is one extractable rule with its source. These are the claims the generator must be able to reproduce from data, or be seen to contradict.

### 1.1 Mulligan and opening rules

| Claim (paraphrased, short quotes marked) | Source | Label |
|---|---|---|
| Riven: do not mulligan for Blade of the Exile; keep a 2-cost unit, take the first battlefield, play Riven from the Champion Zone on turn 2. A 3-of shows up by turn 3 only 42% of the time under their keep policy. | Shonen TCG, Riven deck guide, published 2026-10-31, https://www.shonentcg.com/blog/riftbound-riven-deck-guide | DATA (their 200,000-hand simulation) |
| Riven: "Take a battlefield first"; the legend does nothing until one is controlled. | same | HEURISTIC (theirs) |
| Kai'Sa: keep any hand with a 2-cost unit or a battlefield removal spell, otherwise set aside the two most expensive cards. Seat does not change cards seen because both players draw on turn 1. | Shonen TCG, Kai'Sa deck guide, published 2026-11-02, https://www.shonentcg.com/blog/riftbound-kaisa-deck-guide | DATA / FACT (rules part) |
| Irelia: mulligan aggressively for the champion in slower matchups. | Anime Alley, Irelia Blade Dancer guide, undated, https://animealley.ca/blogs/the-synergy-lab/irelia-blade-dancer-riftbound-deck-guide | HEURISTIC (theirs) |
| Miss Fortune ramp: the 4-Energy ramp spell is wanted in the opening hand against any non-aggro deck and is the first cut against aggro. | Anime Alley, Miss Fortune guide, undated, https://animealley.ca/blogs/the-synergy-lab/miss-fortune-bounty-hunter-riftbound-deck-guide | HEURISTIC (theirs) |

### 1.2 Sequencing rules

| Claim | Source | Label |
|---|---|---|
| Rune arithmetic: champion costing 4 comes down on turn 2 from either seat; a 7-cost on turn 3 going second, turn 4 going first. | Shonen TCG Riven guide (above) | FACT (follows CR 315.3.b, 485.7) |
| Riven: count exhaust triggers before attacking (move, a spell cost, an equip can each trigger). | same | HEURISTIC (theirs) |
| Riven: keep Defy up when ahead so a lead survives one opposing turn. | same | HEURISTIC (theirs) |
| Master Yi: Lonely Poro defends at 4 Might and Scuttle Crab ties 2-Might units because of the legend; hold first, and once at 6 runes reactive spells become easy to keep up. | riftbound.gg, Master Yi Wuju Bladesman guide, published 2026-08-20, https://riftbound.gg/master-yi-wuju-bladesman-guide/ | HEURISTIC (theirs) |
| Irelia: Obelisk of Power is the battlefield to pick when going first, to catch up on runes and land the champion on turn 2. | RiftMana, Irelia guide, modified 2026-02-19, https://riftmana.com/?p=21926 | HEURISTIC (theirs) |
| Irelia: save the counterspell for spells that win the game, not a cantrip. | Anime Alley Irelia guide (above) | HEURISTIC (theirs) |
| Charm is used both to drag an enemy into a battlefield you hold with a bigger unit and to clear a defender before you attack. | RiftMana Irelia guide (above) | HEURISTIC (theirs) |

### 1.3 Matchup advice

| Claim | Source | Label |
|---|---|---|
| Kai'Sa is "the best legend in order to remove units sitting at a battlefield through spells"; versus Riven, limit the board first. Riven answers with untargetable units (Baron Nashor, Akali, Silent). | riftbound.gg Radiance Day 1 report (2026-10-22) as quoted by Shonen TCG Kai'Sa guide | HEURISTIC (theirs) |
| Kennen beats Kai'Sa because reactive decks struggle with several Rhasa the Sunderer at once. | same | HEURISTIC (theirs) |
| Hush counters spells with Power cost 2+, so it hits Falling Star and Time Warp but not Hextech Ray or Stupefy. | Shonen TCG Kai'Sa guide (above), citing a Reddit thread | FACT (card text; RAD card not in our file, so UNCONFIRMED locally) |
| Master Yi: opponents play around the legend with spells, which costs them runes they need for units; answer with Ruin Runner against spell-reliant opponents. | riftbound.gg Master Yi guide (above) | HEURISTIC (theirs) |
| Sivir (purple) struggles against green decks such as Master Yi and Ahri because of their counters; is ahead of Ezreal because it presents few targets; is behind Draven; versus Kai'Sa "you only have one chance to win". | Cards Realm, Miracle Sivir, 2026-01-18, https://riftbound.cardsrealm.com/en-au/articles/riftbound-deck-tech-miracle-sivir | HEURISTIC (theirs) |
| Irelia has an edge on Master Yi but must respect Punch First; Kai'Sa is average to difficult. | RiftMana Irelia guide (above; via search summary for the Kai'Sa half) | HEURISTIC (theirs) |

### 1.4 Sideboard plans

| Claim | Source | Label |
|---|---|---|
| Riven (Sithis, 9-0-1): 10-card sideboard of two 2-ofs and six 1-ofs. | Shonen TCG Riven guide (above) | FACT (list) |
| Kai'Sa (piorro): sideboard is three 2-ofs and four 1-ofs. | Shonen TCG Kai'Sa guide (above) | FACT (list) |
| Master Yi (Schorn, Lille): takes his gear out for game 2 because opponents bring gear removal then, and puts it all back for game 3 when they have sided the removal out again. | Piltover Archive news, 2026-04-24, "How Schorn won Lille's Best Of Master Yi" (piltoverarchive.com/news) | HEURISTIC (theirs); a level-2 sideboarding line no static table can give |
| Diana: 8-card sideboard of extra copies of main-deck cards plus two Singularity and two Baron Nashor. | Riftbound Guide, Diana deck guide, modified 2026-09-08, https://riftboundguide.com/2026/06/08/riftbound-diana-champion-deck-guide/ | FACT (list) |
| Sivir: gear-removal sideboard cards "brick your hand" outside the one matchup; do not bring them in elsewhere. | Cards Realm (above) | HEURISTIC (theirs) |
| Kennen is built to beat Riven in game 1 while Riven's side deck is mostly aimed at Kai'Sa. | riftbound.gg tier list week 2, 2026-11-06, https://riftbound.gg/riftbound-meta-tier-list-best-decks-for-radiance-week-2/ | HEURISTIC (theirs) |

### 1.5 What could not be collected

- UNCONFIRMED: Piltover Archive guide and matchup tabs. The deck page HTML only contains loading skeletons for the "Guide" and "Matchups" sections; the content is loaded from `/api/`, which `https://piltoverarchive.com/robots.txt` disallows. Decks flagged `hasGuide` or `hasMatchups` on the 2026-11-11 listing: Jarvan IV (b33fdf40), Zed (3dd908f7), Vex (036928c8), Volibear (770c1902), Lillia (03373976). The owner can open these by hand.
- UNCONFIRMED: mobalytics.gg (HTTP 403), tcgplayer articles, Reddit threads and YouTube transcripts were not fetched. Reddit and YouTube statements above are second-hand through the Shonen TCG articles.
- Scraping note: `riftbound.gg/robots.txt` allows `User-agent: *` but disallows AI crawlers by name (anthropic-ai, Claude-Web, GPTBot). Seven riftbound.gg article pages were fetched once each with a generic User-Agent before that file was read. Recommendation: the app should not automate riftbound.gg; cite it by hand. `riftdecks.com/robots.txt` forbids scraping by competing services and by the same AI agents, and returned HTTP 403; nothing was taken from it.

## 2. Mechanics that drive sequencing (all FACT, Core Rules 2026-07-16)

### 2.1 Setup, mulligan, hand

- CR 103.2: main deck of at least 40 including the Chosen Champion; TR 601.1.b makes it exactly 40 in competition. CR 103.2.a.1 and 112: one Chosen Champion copy starts in the Champion Zone, so the library is 39 cards. CR 103.3.a: 12 runes. CR 114: both decks are shuffled.
- CR 116: each player draws 4. CR 117: in turn order, set aside up to 2 cards, draw that many, then recycle the set-aside cards (to the bottom, CR 416.1; random order if two, CR 416.5). One mulligan, no penalty card. Consequence: a full mulligan looks at exactly 6 distinct cards and cannot redraw the two it shipped.
- Hand size: neither edition of the Core Rules contains a maximum hand size or a discard-to-hand-size step (text search for "hand size" and "maximum hand" returns nothing in both). UNCONFIRMED as an explicit statement; treated as "no limit".

### 2.2 Turn structure and runes

- CR 315: Awaken (ready everything), Beginning (CR 315.2.b: the turn player Holds every battlefield they control), Channel (CR 315.3.b: channel 2 runes), Draw (CR 315.4.b: draw 1), then Main Phase. Hold points are scored before the turn player channels or draws.
- CR 485.7 and 486.7 (1v1 Duel and Match): the player going second channels one extra rune in their first Channel Phase. Nothing removes the first player's draw in 1v1. Runes available: 2, 4, 6, 8, 10, 12 on the play and 3, 5, 7, 9, 11, 12 on the draw. Cards seen by turn t are 4 + t from either seat.
- CR 164.2: a basic rune has `[E]: Add [1]` and `Recycle this: Add [C]` of its domain. Recycling returns the rune to the Rune Deck (CR 161.2.b). Two consequences: (a) a card costing E Energy and P Power needs max(E, P) runes on board, because an exhausted rune can still be recycled (the cost of 164.2.b has no exhaust symbol; the GameLab engine pays exactly this way, `packages/engine/src/engine.ts` line 1525, "recycle already-exhausted runes first"); (b) every Power spent shrinks next turn's rune count by one.
- CR 167: rune pools empty at the start of each Main Phase and at end of turn, so nothing carries over.
- CR 359.2.c: units enter exhausted at the chosen location. CR 806.3: a unit can only be played to your base or a battlefield you control. CR 144.2: the Standard Move costs exhausting the unit. So a unit normally cannot move the turn it is played; CR 805.1.a (Accelerate: pay `[1][C]` extra to enter ready) and "ready" effects are the exceptions.

### 2.3 Timing: states, Action, Reaction, Priority, Focus

- CR 310: four states. Neutral Open is the only state in which cards without a timing keyword can be played (CR 310.1.a). CR 308.1.a: in a Showdown State only Action or Reaction cards and abilities. CR 309.1.a: in a Closed State (a chain exists) only Reaction.
- CR 806.1.b: Action = playable in showdowns on any player's turn. CR 813.1.b-c: Reaction = everything Action allows plus Closed States.
- CR 312.2: Priority is given to the turn player in Neutral Open, to whoever gains Focus in a showdown, and around the table when a chain is open (CR 312.2.d). CR 313: Focus is the right to act in Showdown Open.
- CR 345 and 464.2.d: the player who contested the battlefield (the attacker) gets Focus first. CR 347: with Focus you play one legally timed card (Focus passes when that chain closes, CR 347.1.b) or pass; when all players pass in sequence the showdown ends (CR 347.2.a). CR 346.1: Focus does not pass when the chain was opened by a triggered ability.
- CR 446.3.c: a move does not use the chain and cannot be reacted to.

### 2.4 Movement, showdowns, combat, damage

- CR 144.4: base to battlefield or battlefield to base; battlefield to battlefield only with Ganking (CR 144.4.c.1). CR 144.3: several units may move together to one destination as one action.
- CR 450 and 344: moving to a battlefield you do not control contests it and opens a showdown, even if it is empty (CR 316.8.b.1, non-combat showdown; if it closes with only your units there you conquer, CR 348.2.a).
- CR 465.2: when the combat showdown closes, each side sums the Might of its units; the attacker assigns first; lethal damage must be assigned in full to one unit before the next (CR 465.2.c.3); Tank first and Backline last (CR 465.2.c.6); damage is dealt simultaneously.
- CR 466.1.a: after damage, all units heal and surviving attackers are recalled if defenders remain. Units also heal at end of turn (CR 317.2.b). Damage never persists across a combat.
- CR 466.5.d: the side left alone at the battlefield establishes control, which is a Conquer if it has not scored that battlefield this turn.

### 2.5 Scoring

- CR 469: Conquer (gain control) or Hold (keep control into your Beginning Phase). CR 470: once per battlefield per turn. CR 485.3: 8 points wins 1v1.
- CR 471.1.b.1: at 7 points a Conquer only scores the final point if you have scored every battlefield this turn; otherwise you draw a card. CR 471.1.a.1: points from anything that is not a Conquer are exempt, so a Hold at 7 wins outright.
- CR 431.2.c: burning out gives an opponent of your choice 1 point.

### 2.6 Keywords the generator reads

Hidden (CR 811.1.b: pay `[A]` to place it facedown at a battlefield you control with no facedown card; from the next turn it has Reaction and costs 0; CR 811.1.d.2: its targets must be at that battlefield), Ambush (CR 822.1.b: playable as a Reaction to a battlefield where you have units), Legion (CR 812.1.c: active if another card was finalized by you this turn), Quick-Draw (CR 819.1.c), Hunt (CR 823.1.c.1: XP on conquer or hold), Level (CR 824.1.b.1), and CR 457.1 (unattached gear at a battlefield is recalled to base at the next cleanup).

### 2.7 Best of three and sideboarding

- CR 486.5: in a Match each player selects (not randomly) one of their three battlefields per game; battlefields used in a game that someone won are removed for the rest of the match. CR 485.5: in a best-of-one Duel the battlefield is random.
- TR 404.2: most matches are best of 3. TR 407.1 and 407.4: a designated player chooses first or last in game 1; afterwards the loser of the previous game chooses.
- TR 601.1.c.1: sideboard of 10 or fewer cards (raised from 8, effective 2026-07-24, https://playriftbound.com/en-us/news/announcements/july-2026-tournament-rules-update-changelog/). TR 601.1.c.3 and 403.3: the 3-copy limit spans main deck plus sideboard. TR 403.5: no sideboard cards in game 1. TR 403.4: exchanges are 1-for-1 in constructed. TR 403.4.a and 601.1.c.4: the Chosen Champion may be changed while sideboarding. TR 403.4.b: runes, legend and battlefields may not change. TR 403.10: no sideboarding after a drawn game.
- TR 406.1.h: a head judge may run best-of-one with a pre-game sideboard step after the battlefield and the turn order are known. UNCONFIRMED: whether, between games of a best-of-3, the battlefield is chosen before or after sideboarding; the Tournament Rules text read here does not fix the order.
- FACT: a banned list exists (TR 601.2.d names Fight or Flight, Scrapheap and Reaver's Row as banned in an example). The generator must filter by the legality data.

### 2.8 What differs in FFA and 2v2

| Topic | 1v1 (CR 485, 486) | FFA3 Skirmish / FFA4 War (CR 487, 488) | 2v2 Magma Chamber (CR 489) |
|---|---|---|---|
| Victory score | 8 | 8 | 11, shared by the team (489.3, 489.8.d) |
| Battlefields in play | 2 | 3; in FFA4 the first player contributes none (488.4.b) | 3; the first player contributes none (489.5.b) |
| First turn | second player +1 rune | first player skips the first draw, last player +1 rune (487.7, 488.7) | same as FFA (489.7) |
| Turn order | alternating | clockwise from first player (115.1.b) | alternates teams: A1, B1, A2, B2 (489.5.c.1; TR 603.7.a) |
| Who fights | two players | exactly two players per combat (462); a battlefield with a staged or running combat is an invalid destination for everyone else (447.2.a), and a unit cannot be played there by a third player (462.2) | same, plus battlefields occupied by a teammate are invalid destinations (447.2.b) |
| Showdown Focus | attacker, then defender | passes around all players in turn order (347.2.b), so a third player can cast Action or Reaction spells into a showdown they are not part of | teammates included; a teammate may also play any spell in your Main Phase when you invite them with your Priority (316.5.b.1, 489.8.a) |
| Scoring limits | once per battlefield per turn | same | a battlefield your teammate controlled in your Beginning Phase cannot be scored by your team that turn (489.8.b); final point: every battlefield except those your ally occupied (489.8.g.1) |
| Control and targets | - | several combats: the turn player picks the order (461.1); burn-out point goes to an opponent of your choice (431.2.c) | control is not shared, no moving a teammate's units (489.8.c); "friendly" includes the teammate's objects (489.8.e); teammates may not share a legend or battlefields (489.8.h, i) |

Design consequence (HEURISTIC): the 1v1 turn table in section 3 needs three changes for multiplayer: cards seen is 3 + t for the first player; "play around" must be taken over every opponent's Action and Reaction cards, not only the combatant's; and in 2v2 pump or protection cards gain the teammate's units as targets.

### 2.9 Rule number map, 2026-07-16 to 2026-10-09

DATA (`rule_map.py`, text match of 83 cited rules, 34 unchanged). Recycle 416 -> 417; Channel 430 -> 431; Burn Out 431 -> 432; Movement 446-447 -> 448-449; gear recall 457.1 -> 459.1 (now "without deploy"); Combat 460-466 -> 462-468 (attacker Focus 464.2.d is now 466.2.c.1.a); Scoring 469-472 -> 471-474; Duel 485 -> 487; Match 486 -> 488; Skirmish 487 -> 489; War 488 -> 490; Magma Chamber 489 -> 491; Champion Zone 103.2.a.1 -> 103.3.a.1; rune deck 103.3.a -> 103.4.a; Accelerate 805.1.a -> 805.1.b; hidden targets 811.1.d.2 -> 811.1.d.5. Substantive change found: 2v2 scoring now says a battlefield can be scored once per team per turn (491.8.b) and the final-point rule applies "during their or a teammate's turn" (491.8.g.1). Full list: `analysis/matchups-and-lines/out/rule_map.txt`.

## 3. The deterministic line generator

A working prototype is in `analysis/matchups-and-lines/linegen.py` (Python standard library, about 400 lines). It has no random numbers and no sentence that is not filled with card names from the input deck.

### 3.1 Inputs

1. The deck: main (40), Chosen Champion, legend, runes (12, by domain), battlefields (3), sideboard (up to 10).
2. Card data: type, Energy, Power, domains, Might, keywords, rulesText.
3. The interaction graph. The prototype substitutes 22 regex classes over rulesText (`common.py`: counter, sweeper, kill, burn, bounce, gear_hate, hand_attack, protect, ready, ...). The real tool should take typed edges from the engine scripts (`GameLab/packages/cards`) instead; regexes were wrong three times during this work (a "Kill all gear" spell counted as a unit sweeper, a Deathknell reveal counted as hand attack, counterspells worded "Counter an enemy spell" missed).
4. Optional opponent legend: turned into an opponent profile = expected copies per list of every card over all lists of that legend in the meta dataset.

### 3.2 Core formulas

- Library N = 39. P(at least k of K copies in n cards) = hypergeometric tail. Opening hand n = 4; after a full mulligan n = 6; by turn t, n = 4 + t (add 2 if both mulligan slots were spent digging).
- Runes at turn t: min(12, 2t) on the play, min(12, 2t + 1) on the draw, minus Power already spent.
- Card is castable when runes >= max(E, P). P(Power available) for a single-domain card = hypergeometric tail over the 12-card Rune Deck with the deck's own split and n = runes channelled. Example DATA: Punch First needs 2 Body; with a 7/5 split that is 31.8% on turn 1 on the play (2 runes), 63.6% on turn 1 on the draw (3), 84.8% with 4 runes, 95.5% with 5 and 99.2% with 6.
- Joint probability of two different named cards = 1 - P(no A) - P(no B) + P(neither).

### 3.3 Outputs and how each is computed

| Output | Computation |
|---|---|
| Keep rule | Named set = units castable with turn-1 runes for this seat. If the deck has at least 16 units and at least 5 of them qualify, the rule is BOARD (keep any hand with one of them). Otherwise BOARD-OR-INTERACTION adds interaction cards castable on turn 1. Prints K, P(natural 4), P(after mulligan). |
| Set-aside list | Named cards whose rune need is 7+ (or 5-6 when nothing costs 7), with the first turn they could be cast. |
| Champion note | Extra copies of the Chosen Champion in the library are flagged as mulligan fodder while the Champion Zone copy is available. |
| Turn 1-6 table, both seats | Per turn: named units and gear whose rune need equals the runes available or one less, with P(have one); the Chosen Champion is listed at 100% on the first turn it is castable; the best two-card turn is the pair of different cards (at least one unit, or champion plus a card) that exactly spends the runes and has the highest joint probability; Power check per named card including the rune count it leaves for next turn. |
| Sequencing interactions | Fifteen detectors, each bound to a rule number: legion, ready-after, needs-body, pre-combat, action-window, reaction-hold, hidden, ambush, alone, xp, power-tax, accelerate, damage-heals, equip, deathknell (3.4). A detector prints only if the deck holds a matching named card. |
| Power spikes | First turn the champion is castable per seat; the two highest-cost cards with castable turn and P(drawn by then); first turn the champion can be deployed with the cheapest Reaction still payable. |
| What to hold reactions for | reaction-hold lists the deck's Reaction cards and the cheapest hold cost; versus an opponent, each counterspell's own condition is parsed and matched against the opponent's expected cards (for Defy: spells costing at most 4 Energy and at most 1 Power). |
| Per-opponent answers | For each of my cards, the opponent cards it answers, parsed from my card's text: "Deal N" hits units with Might <= N that can be chosen; "with N Might or less" caps bounce; gear hate lists their gear; hand attack lists their non-units if the text says non-unit; "can't be chosen" and Deflect list their targeted spells. Output is expected copies answered plus the top names. |
| Play around | The opponent's sweepers, counterspells, Reaction spells, Hidden cards, Ambush units, gear removal and hand attack, each with expected copies and rune need; plus which of my spells fall inside each of their counterspells' conditions. |
| Side in / side out | Score(card, opponent) = expected opposing copies answered here / mean of the same quantity over every other legend in the dataset. Side in when the ratio is at least 1.2 and it answers at least 2.0 copies; side out main-deck answer cards with ratio at most 0.8; pair them 1-for-1 (TR 403.4). Reasons are the named targets. |
| Matchup estimate | Section 4.3. |

### 3.4 Sequencing detectors (rule-backed, instantiated per deck)

| Id | Fires when the deck has | Line template (names filled from the deck) | Rule |
|---|---|---|---|
| legion | a Legion card | play one of the deck's cheapest cards before the Legion card | CR 812.1.c |
| ready-after | a "ready another unit" card | champion first, readier second, with combined cost, turn per seat and P(readier drawn) | CR 359.2.c, 144.2 |
| needs-body | a unit whose play effect needs another friendly unit | lead with the named cheap units | card text |
| pre-combat | spells with no Action or Reaction that move, pump, remove or strip the hand | cast before the move that opens the showdown | CR 308.1.a, 310.1.a |
| action-window | Action spells | attacker holds Focus first; passing lets the defender end the showdown; as defender you act after the attacker's first play | CR 464.2.d, 347.1, 347.2.a |
| reaction-hold | Reaction spells | can answer a chain without Focus; name the cheapest hold cost; runes must be left ready | CR 309.1.a, 312.2.d, 167 |
| hidden | Hidden cards | hide the turn before; costs one recycled rune; needs a controlled battlefield; targets must be there | CR 811.1.b, 811.1.d.2, 164.2.b |
| ambush | Ambush units | hold runes, play into the showdown where you already have a unit | CR 822.1.b |
| alone | cards or a legend that say alone, one on one, only unit | one unit per battlefield; send the second unit to the other battlefield | card text, CR 485.4 |
| xp | Level thresholds | triggers needed = ceil(Level / best Hunt value); other XP sources named | CR 823.1.c.1, 824.1.b.1 |
| power-tax | cards costing 2+ Power | rune count left next turn; flags when the champion slips a turn | CR 164.2.b, 161.2.b |
| accelerate | Accelerate units | total cost to enter ready and the turn per seat | CR 805.1.a |
| damage-heals | damage spells | combine with combat damage in the same showdown or kill outright | CR 466.1.a.1, 317.2.b |
| equip | Equipment | carrier first; unattached gear returns to base | CR 457.1, 819.1.c |
| deathknell | Deathknell units | named carriers are the preferred lone defender or trade | CR 808 |

Detectors still to write for the real tool (HEURISTIC list): scoring-race lines from CR 471.1.b (at 7 points hold wins, conquer needs both battlefields), damage-assignment lines for Tank and Backline (CR 465.2.c.6), ramp-aware rune counts ("channel 1 rune" effects such as Volibear's legend), legend activations, battlefield-specific lines, and Radiance keywords.

### 3.5 Worked example 1: Master Yi (Body/Calm, hold with single defenders)

List: "Regional Qualifier Hartford #1 (Factor)", https://piltoverarchive.com/decks/view/99f9a2a9-b0fd-4399-bdfd-4327a030c6e3. Legend Wuju Bladesman - Starter (OGS-019): "While a friendly unit defends alone, it gets +2 [Might]." Champion Master Yi, Tempered (UNL-113), 4 Energy, Might 4. Runes 7 Body / 5 Calm. Curve by rune need 1:11, 2:18, 3:4, 4:1, 5:3, 6:2. All numbers DATA (`out/lines-master-yi-vs-kai-sa.md`).

- Keep, on the play: any hand with Lonely Poro, Pit Rookie or Scuttle Crab (K=9): 66.7% in 4 cards, 81.8% after mulligan. On the draw the 3-rune turn adds Fiora, Peerless and First Mate (K=13): 81.8% and 92.9%.
- Set aside first: Ruin Runner x2, Rengar, Trophy Hunter x3.
- Turn 2: Master Yi, Tempered from the Champion Zone (100%) on either seat. On the draw the fifth rune pays for Master Yi plus Charm, Defy or Sabotage: 94.6% to hold one. On the play, Master Yi with a Reaction up is turn 3.
- Turn 3 on the play (6 runes): Master Yi + Discipline, Pit Rookie or Lonely Poro 97.7%; or Rengar, Trophy Hunter / Ruin Runner on curve, 65.0%.
- [ready-after] Master Yi, Tempered first, then First Mate ("When you play me, ready another unit."): 7 Energy, turn 4 on the play, turn 3 on the draw; First Mate drawn by then 37.2% / 33.1%.
- [needs-body] Pit Rookie x3 buffs "another friendly unit": lead with Lonely Poro or Scuttle Crab.
- [pre-combat] Charm x3 and Sabotage x3 have no timing keyword: cast them before the move.
- [alone] Lonely Poro, En Garde, Fiora, Peerless and the legend all check alone or one on one: one unit per battlefield.
- [xp] Level 6 with Hunt 2: three conquer or hold triggers from Master Yi before Deflect and Ganking switch on; Scuttle Crab is the only other XP source.
- [power-tax] Punch First (1 Energy, 2 Power) on turn 3 on the play leaves 4 runes, so turn 4 has 6 instead of 8.
- [hidden] Zhonya's Hourglass x2: hide a turn early, costs one rune.
- Versus Kai'Sa (2 lists): Defy x3 covers 12.5 expected copies (Hextech Ray 3.0, Stupefy 3.0, Void Seeker 1.0, Smoke Screen 1.0) and does not cover Falling Star (2 Power). Play around Singularity (1.5 copies, 6 runes) and Stupefy (3.0, 1 rune). Best sideboard card is Ruin Runner ("I can't be chosen by enemy spells and abilities."): 14.5 expected copies blanked against a field mean of 5.8, ratio 2.49; Disarming Rake scores 0.0 (Kai'Sa lists run no gear). No swap is printed because no main-deck answer underperforms; the 1-for-1 partner has to come from the non-answer cards, which the prototype does not rank (defect, 3.9).
- Versus Ornn (2 lists): IN +3 Disarming Rake (14.0 expected gear copies: Sterak's Gage 3.0, Sprite Fountain 3.0, Brutalizer 2.5; field mean 4.3). OUT -3 Charm (ratio 0.79). Their Defy (2.5) can stop Charm, Defy, Discipline, Sabotage and En Garde.

Cross-check against players (HEURISTIC agreement): the riftbound.gg guide names Ruin Runner as the answer to spell-reliant opponents and Lonely Poro and Scuttle Crab as the opening holders; the generator reaches both from card text and list data alone.

### 3.6 Worked example 2: Rek'Sai (Fury/Order, wide and fast)

List: "S3RQ Utrecht Top 8 Rek'Sai", https://piltoverarchive.com/decks/view/6e1ffac2-c2ec-40fe-af0e-081782630403. Legend Void Burrower (SFD-187): "When you conquer, you may exhaust me to reveal the top 2 cards of your Main Deck. You may play one. Then recycle the rest." Champion Rek'Sai, Breacher (SFD-029), 3 Energy, Might 3, Accelerate. Runes 6/6. Curve 1:3, 2:20, 3:8, 4:3, 5:2, 6:3. DATA (`out/lines-rek-sai-vs-kai-sa.md`).

- Keep, on the play: Carrion Dredger, Honest Broker, Inferna or Daring Poro (K=11): 75.1%, 88.5% after mulligan. On the draw K=19: 94.1% and 98.8%.
- Turn-1 unit plus a turn-2 follow-up by turn 2 on the play: 77.3% (Master Yi: 39.1%).
- The champion is castable on turn 1 on the draw (3 runes) and turn 2 on the play: the seat changes this deck's first spike, which it does not for Master Yi.
- [legion] Blood Rush, Cull the Weak or Hidden Blade before Noxus Hopeful x3.
- [hidden] Hidden Blade x3 and Pyke, Dockside Butcher x3; [ambush] Inferna x3 and Vi, Peacekeeper x2; [accelerate] the champion.
- Not fired: reaction-hold (no Reaction spells), pre-combat, alone, xp, power-tax, needs-body, ready-after.
- Versus Kai'Sa: only two main-deck cards have opponent-dependent targets (Hidden Blade, Carrion Dredger). Sideboard Salvage scores 0.0 here against a field mean of 4.8, so it stays out; Falling Star is neutral (ratio 1.06). Estimate 45%, the largest single term being wide_vs_sweepers -3.8.

### 3.7 Worked example 3: Volibear (Fury/Body, ramp to a 10-cost champion)

List: "RQ Utrecht Best of Volibear", https://piltoverarchive.com/decks/view/cb96a8b2-e481-4309-9b7c-374683673c7d. Legend Relentless Storm (OGN-249): "When you play a [Mighty] unit, you may exhaust me to channel 1 rune exhausted." Champion Volibear, Furious (OGN-041), 10 Energy + 2 Power, Might 9. Runes 6/6. Curve 1:3, 2:9, 4:3, 5:3, 6:5, 7+:16. DATA (`out/lines-volibear-vs-master-yi.md`).

- Keep rule switches to BOARD-OR-INTERACTION because no unit is castable on turn 1: keep Sabotage, Challenge or Falling Star (K=7): 56.3%, 72.2% after mulligan.
- Set aside first: Gentle Gemdragon x3, Sky Splitter x3, Deadbloom Predator, Dazzling Aurora x3 and two more.
- Turn 2 on the play: no on-curve board play exists in the list. Turn 4 on the draw (9 runes): Kadregrin the Infernal, Dazzling Aurora or Gentle Gemdragon, 93.0%.
- Champion spike turn 5 on both seats without ramp. This is an upper bound: the prototype does not simulate the legend's extra channel or Mobilize and Catalyst of Aeons (defect, 3.9).
- [power-tax] seven different cards cost 2+ Power; Elder Dragon needs 4 Body. [pre-combat] Sabotage, Falling Star, Stormbringer. Not fired: reaction-hold, hidden, legion, alone, xp.
- Versus Master Yi (3 lists): their Defy (3.0 copies) can stop Mobilize, Catalyst of Aeons, Sabotage, Challenge and Get Excited!; play around Zhonya's Hourglass (1.7, Hidden) and Rengar, Trophy Hunter (2.0, Ambush, 5 runes). Thermo Beam in the sideboard hits only Zhonya's Hourglass (1.7 copies, ratio 0.36) and stays out; Unyielding Spirit and Repulse (ratio 0.49) stay out because Master Yi lists run few targeted spells (Charm 2.0, Challenge 0.7, Skyward Strike 0.3).

### 3.8 How variety is guaranteed

Dimensions on which two decks differ, each of which changes at least one printed line:

1. Legend text (alone, conquer trigger, ramp trigger) and which detector it feeds.
2. Chosen Champion cost: sets the 100% spike turn per seat (2/2, 2/1 and 5/5 in the examples).
3. Rune split: changes every Power check.
4. Curve histogram: changes K of the keep set, the on-curve sets and the best two-card turns.
5. Unit share: flips the keep rule between BOARD and BOARD-OR-INTERACTION.
6. Timing mix (none, Action, Reaction, Hidden, Ambush, Quick-Draw): decides which timing detectors print.
7. Power-heavy cards: power-tax and its knock-on effect on the champion turn.
8. Mechanic keywords (Legion, Accelerate, Hunt and Level, Deathknell, Equip): one detector each.
9. Battlefields (3 per deck; chosen per game in a Match): not yet used by the prototype.
10. Sideboard contents: change the side candidates.
11. Opponent profile: changes every answer list, play-around list and the swap.
12. Seat: every table row exists twice.

Proof with the three lists (DATA, `out/variety.txt`):

| Pair | Identical output lines | Shared main-deck card names | Detector signatures shared | Fired only in the first | Fired only in the second |
|---|---|---|---|---|---|
| Master Yi vs Rek'Sai (both against Kai'Sa) | 15 of 99 | 0 of 31 | 5 of 19 | alone, damage-heals, needs-body, power-tax, pre-combat, reaction-hold, ready-after, xp, spike 2/2 | accelerate, legion, spike 2/1 |
| Master Yi vs Volibear | 9 of 115 | 4 of 28 | 6 of 18 | alone, hidden, keep BOARD, needs-body, reaction-hold, ready-after, xp, spike 2/2 | keep BOARD-OR-INTERACTION, spike 5/5 |
| Rek'Sai vs Volibear | 9 of 100 | 0 of 30 | 3 of 14 | hidden, keep BOARD, legion, spike 2/1 | damage-heals, keep BOARD-OR-INTERACTION, power-tax, pre-combat |
| Same Master Yi list, Kai'Sa vs Ornn as opponent | 47 of 81 | 16 of 16 | 14 of 16 | side candidate Ruin Runner | IN Disarming Rake, OUT Charm |

The identical lines are headings, the table header, the two play-around lines that both lists print against the same Kai'Sa profile, and the constant "any 3-of by turn 3" line. The last row shows the opponent input alone changes 34 of 81 distinct lines for the same deck. Differences are substantive in three ways: different keep sets and probabilities (66.7%, 75.1%, 56.3% on the play), different spike turns, and disjoint sets of rule-backed sequencing lines.

### 3.9 Known defects of the prototype (to fix in the real tool)

- The best two-card turn maximises probability, not strength; it needs a value term (the heuristic bot in `GameLab/packages/ai` has action values to borrow).
- Side-out only ranks answer-class cards. Cards with no opponent-dependent target (bodies, draw) are never cut, so many matchups print "no swap" although a good side-in exists.
- Rune counts ignore ramp, cost reduction (Legion discounts, Astral Heron-style reductions), legend activations and tokens.
- Opponent profiles rest on 1 to 3 lists per legend; a sweeper answer is counted against every unit regardless of its damage cap.
- The regex classes over-match: Carrion Dredger is counted as protection because its Deathknell token has Deflect, and Unyielding Spirit (prevents damage) is scored against non-damage spells such as Charm.
- No battlefield logic, no multiplayer mode, no Radiance cards.

## 4. Matchup data

### 4.1 Is there a win-rate matrix? Yes, twice, and neither is freely machine-readable

- FACT: riftdecks.com publishes a legend-versus-legend win-rate matrix and a matchup analysis. Page titles on 2026-11-11: "Winrate Matrix - 11434 Matches Analyzed" for Constructed (https://riftdecks.com/stats/winrate/constructed) and "124335 Matches Analyzed" for all formats; per-tournament matrices also exist. Search snippets state the win rates exclude mirror matches, byes and draws. Its robots.txt forbids scraping by competing services and by AI agents and the server answered HTTP 403, so no cell values were read. UNCONFIRMED: every cell value.
- FACT: riftbound.gg has a meta page "measured daily from official organised-play results" (https://riftbound.gg/meta/); the HTML is a JavaScript loader with no data in it. Its weekly tier-list articles quote individual cells.
- FACT: Vex list "76.86% Win Rate" on Piltover Archive carries a self-reported record in its title only.

Cells quoted in prose (FACT that the article states them; n per cell is not given, window is "the past 7 days" before 2026-11-06 unless noted):

| Row legend | Versus | Win rate for row | Source |
|---|---|---|---|
| Riven | Kai'Sa | 53% | riftbound.gg week-2 tier list, 2026-11-06 |
| Kennen | Riven | 51% | same |
| Jayce | Riven | 64% | same |
| Kai'Sa | Kennen | 52% | same |
| Rengar | Riven | 31% | same |
| Rengar | Kennen | 28% | same |
| Akali | Kennen | 53% | same |
| Kennen | Jayce | 73% | riftbound.gg Kennen guide, 2026-11-09, https://riftbound.gg/kennen-heart-of-the-tempest-guide/ |
| Kennen | Riven, Kai'Sa | 48% each | same |
| Kennen | Rek'Sai | 45% | same |
| Riven, Kennen, Kai'Sa overall | field | 54%, 50%, 49% after 12 Swiss rounds | riftbound.gg Europe Regional Championship tracker, 2026-11-08 |

Note the two Kennen-versus-Riven numbers (51% and 48%) come from different windows of the same site: published cells move by several points week to week.

Recommendation: the app stores a matchup matrix as an optional user-imported CSV (legend A, legend B, win rate, n, source, date) and shows the computed estimate next to it, clearly separated.

### 4.2 Features for a computed estimate (HEURISTIC)

Each feature is a count over the 39-card library, then converted to a percentile rank among all lists in the meta dataset, so every feature lies in 0..1.

| Feature | Raw count |
|---|---|
| speed | units needing <= 2 runes, plus half the 3-rune units, plus Accelerate units |
| spot | single-target removal, displacement and stun (not sweepers) |
| sweep | sweepers |
| counter | counterspells |
| wide | units plus token makers |
| tall | mean Might of the six biggest units plus a quarter of the pump and buff cards |
| reach | Ganking, Accelerate, ready effects, Ambush |
| protect | untargetable, Deflect, Shield, prevention, death replacement |
| spellrel | spells needing 3+ runes (the deck's own exposure to counterspells) |

### 4.3 The estimate (HEURISTIC, uncalibrated)

With inter = (spot + sweep) / 2, for deck A against deck B, in percentage points:

```
edge(A,B) = -6 * (wideA*sweepB  - wideB*sweepA)        wide versus sweepers
            -6 * (tallA*spotB   - tallB*spotA)         tall versus single removal
            +4 * (protectA*spotB - protectB*spotA)     protection blanks single removal
            +5 * (speedA*(1-interB) - speedB*(1-interA))   speed versus interaction
            +3 * (reachA - reachB)                     reach
            +4 * (counterA*spellrelB - counterB*spellrelA) counters versus key spells
estimate = 50 + clamp(edge, -20, +20)
```

The formula is antisymmetric (estimate(A,B) + estimate(B,A) = 100) and prints its six terms, so the user sees why. The weights are placeholders chosen by hand; they are to be fitted by least squares the day a matrix is imported.

Smoke test (DATA, `validate_heuristic.py`, `out/validate_heuristic.txt`): against ten directional statements from section 1.3 the sign agrees in 8 of 10. It disagrees on Sivir versus Ezreal (claimed favoured, estimate 47.9%) and Irelia versus Kai'Sa (claimed difficult, estimate 51.4%). Caveats: 1 to 3 lists per legend, three of the claims come from Radiance-era lists, and all estimates fall between 45% and 55% while published cells range from 28% to 73%. The estimate is a direction indicator, not a number to quote. It must be labelled HEURISTIC in the UI.

## 5. Side deck construction, backed by the lists

Dataset: the 59 lists of 2026-09-06, all with a sideboard, built under the 8-card limit; classes by `common.py` regexes. All rows DATA (`meta_and_side.py`, `out/meta_and_side.txt`) unless marked.

### 5.1 Shape

- Size: 55 of 59 lists use exactly the cap (8); 3 show 10; 1 shows 7. HEURISTIC: always fill the cap, now 10.
- Slots: 327 distinct slots = 200 one-ofs (61%), 104 two-ofs (32%), 23 three-ofs (7%); mean 5.5 different cards per 8-card sideboard. The two Radiance lists in 1.4 keep the shape at 10 cards (2+2+six 1-ofs; three 2-ofs + four 1-ofs).
- 27.0% of sideboard copies (129 of 477) are additional copies of a main-deck card; 73% are cards the main deck does not play.
- Types: spells 56.2%, units 40.9% (mean 3.3 units per sideboard), gear 2.9%. Sideboard cards cost more: mean Energy 3.37 against 2.83 in main decks.

### 5.2 Categories

| Category | Sideboards with it | Mean copies when present | Share of all sideboard copies | Main decks with it | Reading |
|---|---|---|---|---|---|
| Gear hate | 51/59 (86%) | 2.27 | 24.3% | 19/59 | the one near-universal sideboard job |
| Extra single-target removal or bounce | 41/59 (69%) | 2.02 | 17.4% | 56/59 | top-ups of a main-deck role |
| Hand attack | 22/59 (37%) | 1.73 | 8.0% | 17/59 | anti-combo, anti-control |
| Card draw attached to another job | 21/59 | 1.76 | 7.8% | 55/59 | e.g. Salvage |
| Counterspells | 22/59 (37%) | 1.41 | 6.5% | 32/59 | usually the third copy |
| Sweepers | 21/59 (36%) | 1.43 | 6.3% | 12/59 | anti-wide |
| Protection | 17/59 (29%) | 1.65 | 5.9% | 48/59 | anti-removal, e.g. Unyielding Spirit |
| Pump | 17/59 | 1.53 | 5.5% | 49/59 | |

Most played sideboard cards (lists, total copies): Disarming Rake 15, 35 ("When you play me, you may kill a gear."); Turn to Dust 13, 21 ("Give a gear [Temporary]."); Star-Crossed 13, 17; Salvage 11, 22; Ashe, Focused 10, 20; Gust 10, 14; Akshan, Mischievous 9, 16; Thermo Beam 9, 13 ("Kill all gear."); Singularity 8, 11; Kha'Zix, Mutating Horror 8, 12; Rebuke 8, 9; Brynhir Thundersong 8, 11; Unyielding Spirit 8, 13; Sabotage 8, 13. Six of the top eight by copies answer gear.

### 5.3 What share of the field triggers a slot

Exposure in the same 59 main decks: 37.3% run 4 or more gear (22.0% run 6 or more); 76.3% run 14 or more spells; 32.2% run 22 or more units; 40.7% run 12 or more units with Might 3 or less; 11.9% run 8 or more units with Might 5 or more. Mean main deck: 18.5 units, 17.5 spells, 4.0 gear.

Rules of thumb (HEURISTIC, fitted to the DATA above by eye; the sample is flat by legend, so "share" must be recomputed with real play rates from the meta-sources document before use):

1. Gear hate: about 2 sideboard copies were played while 37% of lists were gear-exposed, with almost none in main decks (19/59). Trigger: at least 2 copies once gear-heavy decks (4+ gear) pass roughly a third of the field; a third copy or a mass effect (Thermo Beam) when 6+ gear decks pass roughly a fifth.
2. Removal top-up: 2 copies, taken as the 3rd copies of the deck's own best removal (27% of all sideboard copies are such top-ups).
3. Anti-wide: 1 to 2 sweepers when lists with 22+ units pass about 30% (21/59 sideboards carry them at 32% exposure).
4. Anti-spell: 1 to 2 counterspells or hand attack when the deck's spellrel exposure to the field is high; 37% of sideboards carry each.
5. Anti-removal: 1 to 2 protection or untargetable cards when the field's spot removal percentile is high (Ruin Runner against Kai'Sa in 3.5 is the computed instance).
6. Scaled to the 10-card cap by the measured shares: gear hate 2-3, removal 2, hand attack or counter 1-2, sweeper 1, protection 1, free 1-2.
7. Keep 1-ofs as the default slot size (61% of slots) and 3-ofs for one job only.
8. A card belongs in the sideboard, not the main, when its answer score has high variance across the field: computed as the standard deviation over legends of "expected copies answered" divided by its mean. Disarming Rake: 14.0 against Ornn, 0.0 against Kai'Sa, field mean 4.3.
9. Level-2 plan (Schorn, 1.4): after game 1 the opponent has seen your deck. The tool can list which of your card types their typical sideboard answers and offer "side out the targets" as an alternative plan for game 2. This needs opponent sideboard inclusion data, which the dataset has.
10. The Chosen Champion can be swapped between games (TR 403.4.a): the generator should rerun the spike and detector analysis for each legal champion in the 50 cards and report the delta.

### 5.4 Rune split (context for the Power checks)

DATA: of 56 lists with 12 resolvable runes, 29 run 7/5, 19 run 6/6, 7 run 8/4, 1 runs 10/2. The majority rune is the majority Power-demand domain in 43 of 56 lists; Pearson r between majority-rune share and that domain's share of Power demand is 0.59. Rune split advice itself belongs to the deck-theory document.

## 6. Unconfirmed, in one place

- Win-rate matrix cell values (riftdecks.com not readable; riftbound.gg page is script-loaded).
- Piltover Archive guide and matchup tabs; Reddit, YouTube, mobalytics, tcgplayer primary texts.
- An explicit rule or ruling that an exhausted rune may be recycled for Power (inferred from CR 164.2.b and the GameLab engine).
- Absence of a maximum hand size as a positive statement.
- Order of battlefield selection and sideboarding between games of a best-of-3.
- Everything about Radiance cards: no card text was available locally, so no RAD list could be run through the generator.
- Whether the heuristic matchup weights generalise; they were not fitted.

## 7. Files

- `docs/research/analysis/matchups-and-lines/common.py`: loaders, classifier, hypergeometric.
- `.../linegen.py`: generator prototype; `python3 linegen.py "Legend:Opponent" ...` writes `out/lines-*.md` and `out/variety.txt`.
- `.../meta_and_side.py`: sections 5.1 to 5.4. `.../validate_heuristic.py`: section 4.3. `.../rule_map.py`: section 2.9.
- `.../raw/`: text copies of the fetched guides (each headed with URL and fetch date), Tournament Rules 2026-10-09 as text, the riftdecks robots file.
