# Riftbound mechanics glossary: keywords, game actions and core systems (ground truth for deterministic card understanding)

Built 2026-11-11 from the current Core Rules (edition 2026-10-09) and the official card gallery (all sets including Radiance). This file is **generated**: every pool count and every card quotation is produced by `docs/research/analysis/mechanics-glossary/render.py` from `template-*.md` + `mechanics.py`. Do not hand-edit numbers; change the detector and re-render.

## 0. Sources, labels, method

| ID | Source | Date |
|---|---|---|
| CR | Core Rules PDF, "Last Updated: 2026-10-09", https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/5c7946f7c3b8c6e0faff85ab6dadc6d2e721ea94.pdf (cached text: `analysis/raw/core-rules-2026-10-09.txt`) | fetched 2026-11-11 |
| GAL | Official card gallery, https://playriftbound.com/en-us/card-gallery/ (1408 printings; cached `analysis/raw/gallery-2026-11-11.html`, normalised to `analysis/cards-2026-11-11.json`) | fetched 2026-11-11 |
| ERR | Official errata articles: Origins https://riftbound.leagueoflegends.com/en-us/news/rules-and-releases/riftbound-origins-card-errata/ , Spiritforged https://riftbound.leagueoflegends.com/en-us/news/rules-and-releases/riftbound-spiritforged-errata/ , Unleashed https://playriftbound.com/en-us/news/rules-and-releases/unleashed-errata-updates/ , Vendetta https://playriftbound.com/en-us/news/announcements/vendetta-errata-updates/ , Radiance https://playriftbound.com/en-us/news/announcements/radiance-errata-updates/ | fetched 2026-11-11 |
| PN-RAD | Core Rules: Radiance Patch Notes, https://playriftbound.com/en-us/news/announcements/core-rules-radiance-patch-notes-effective-october-16-2026/ | fetched 2026-11-11 |
| OV-RAD | Radiance overview article (cached `analysis/mechanics-glossary/raw/radiance-overview.txt`; "Updated October 16, 2026") | fetched 2026-11-11 |
| L-CARDS | `~/github_repositories/GameLab/data/cards/cards.json` (931 cards, no Radiance; has a hand-maintained `keywords` field) | local, stale, used only as a cross-check |
| ENGINE | `~/github_repositories/GameLab/packages/engine` (working rules engine) | local, used only where the rules are silent |

Labels: **FACT** = stated by CR or printed on a card (rule number or card code given). **DATA** = measured (dataset and n named). **HEURISTIC** = our judgement or inference. **UNCONFIRMED** = no primary source found.

**Pool (DATA, GAL + ERR):** {{pool:names}} distinct card names; {{pool:tokens}} token entries and {{pool:runes}} basic runes are excluded from all counts, leaving **n = {{pool:counted}}** counted names: {{pool:units}} units, {{pool:spells}} spells, {{pool:gear}} gear ({{pool:main}} Main Deck names), 58 legends, 74 battlefields. Counts are per distinct name, not per printing.

**How the counts are made (so they can be reproduced in the app):**
- Card text is the gallery's printed text; where an errata article gives a "[NEW TEXT]" that differs from the gallery, the errata text is used. Errata were applied to {{pool:errataApplied}}. Example cards carrying errata text are marked "errata text".
- Equipment have a second text box (Effect Text, CR 136) and a Might Bonus (CR 137) stored in separate gallery fields. The pool appends the effect text as an extra line prefixed `Effect text (active only while attached, CR 136):`. That prefix is our annotation, not card text.
- Reminder text (everything in parentheses) is removed before any detector runs, because "The presence, absence, or exact wording of reminder text has no effect on game function" (FACT, CR 135.2.d.3) and reminder text mentions keywords the card does not have.
- A card **owns** a keyword when the bracketed keyword heads an ability line of its own text (e.g. a line starting `[Assault 2]`, or `[Level 6][>] ...`). A card **references** a keyword when the bracketed keyword appears anywhere else in its text (grants it, checks for it, taxes it). "any" = own + reference.
- DATA (cross-check): on the 909 names shared with L-CARDS, the "own" detector agrees with L-CARDS' hand-maintained `keywords` field for every keyword except 7 names: 5 where the field misses a keyword that is printed (Laurent Bladekeeper Ganking, Windsinger Hidden, Garen, Rugged Shield, Jagged Cutlass Equip, the Gold token's Reaction) and 2 where the field lists Empower although the card only uses "empower me" as a verb (Mournful Witness, Renekton, Brute).
- Gallery defects seen on 2026-11-11 (DATA): the structured card type was wrong or empty for 19 Radiance names and was corrected from the gallery's own image alt text ({{pool:typeFixed}}); four cards print a keyword without brackets (Laurent Bladekeeper "Ganking", Windsinger "Hidden", Nazuman Ntofo and Jagged Cutlass "Equip"), which the detector accepts at the start of a line.

## 1. How keywords are written and classified

- **FACT (CR 801, 801.2):** a keyword is shorthand for an effect or ability and is printed with a coloured highlight; the colour "has no effect on gameplay". In data it is the bracketed token, e.g. `[Tank]`, `[Assault 2]`.
- **FACT (CR 135.2.e.7):** "A keyword associated with an ability is indicated by the [>] symbol." Older printings use a dash instead (`[Deathknell] — Draw 1.`); both forms exist in GAL (DATA).
- **FACT (CR 135.2.e):** symbol shorthand: `[E]` exhaust this, `[M]` Might, `[A]` one Power of any domain (GAL prints it as `[Rainbow]`), `[C]` one Power of this card's domain (GAL prints the domain name, e.g. `[Fury]`), `[1]`..`[n]` Energy.
- **FACT (CR 801.3.a.3):** a granted keyword with no stated duration lasts as long as the object stays on the board or in its current non-board zone.
- **FACT (CR 722.1):** a card whose text is Inactive (e.g. an attached Equipment) "still [has] keywords for the sake of Game Effects that want to reference or see if a card has a keyword".
- **FACT (CR 805-832):** the Keyword Glossary of the current edition has exactly **28** keywords. Classes as the rules name them:

| Class (CR wording) | Keywords |
|---|---|
| Permissive (timing permission) | Action (806), Reaction (813), Quick-Draw (819, also triggered) |
| Optional Additional Cost | Accelerate (805), Repeat (820) |
| Passive Ability | Assault (807), Deflect (809), Ganking (810), Shield (814), Tank (815), Ambush (822), Backline (826), Flow (829), Deploy (830, also triggered), Show Off (832) |
| Triggered Ability | Deathknell (808), Temporary (816), Vision (817), Weaponmaster (821), Hunt (823), Disarm (831) |
| Activated Ability | Equip (818), Empower (827) |
| Dependent Keyword (condition + ability, CR 726-727) | Legion (812), Level (824), Empowered (828) |
| Prerequisite for the Hide action | Hidden (811) |
| Deck Constraint Permission | Unique (825) |

- **Stacking (FACT, rule in brackets):** values are **summed** for Assault (807.2), Deflect (809.2), Shield (814.2), Hunt (823.2), Disarm (831.2, one trigger with the total). Extra copies are **redundant** for Accelerate (805.4), Ganking (810.2), Hidden (811.4), Tank (815.2), Temporary (816.2), Quick-Draw (819.2), Ambush (822.2), Backline (826.5), Deploy (830.2). Each instance works **separately** for Deathknell (808.2), Vision (817.2), Equip (818.4), Repeat (820.3), Weaponmaster (821.1.c.7), Empower (827.3), Show Off (832.2). One played card satisfies **all** Legion abilities (812.2).
- **Bracketed terms that are not keywords (FACT):** `[Mighty]` is a description (CR 706-711); `[Buff]`, `[Stun]`, `[Predict]`, `[Burn]`, `[Add]` are game actions (CR 427, 424, 437, 441, 430); "Empower"/"Disempower" also exist as actions (CR 442, 443). They are covered in section 3.
- **Timing vocabulary used below (FACT, CR 307-310):** Neutral Open = no showdown/combat and no chain (the default window: "cards can be played and abilities activated only when a player has priority on their turn in a Neutral Open state", 310.1.a). Showdown state: "Only cards and abilities with the Action or Reaction keywords can be played or activated" (308.1.a). Closed state (a chain exists): "Only cards and abilities with the Reaction keyword" (309.1.a).

## 2. Keyword glossary (CR 805-832)

Each entry: rule and class, definition quoted from CR, reminder text as printed (DATA, GAL, most common wording), behaviour with a number, zone and timing, pool count, three example cards with verbatim text, deck-building meaning (HEURISTIC), and mode differences (HEURISTIC derived from the FACT mode rules in section 5).

### 2.1 Accelerate (CR 805)
- **Class (FACT, 805.1, 805.1.a):** Optional Additional Cost keyword, present on units.
- **Definition (FACT, 805.1.b):** "As you play me, you may pay [1][C] as an additional cost. If you do, I enter ready." The Power must match one of the unit's domains; a unit with no domain pays `[A]` (805.1.b.1-.2).
- **Reminder as printed:** "(You may pay [1][Fury] as an additional cost to have me enter ready.)" with the unit's own domain.
- **Number:** none. Cost is always 1 Energy + 1 Power.
- **Zone / timing (FACT, 805.2.a, 805.3, 805.6):** only while the unit is being played; "has no function while on the board". It is a replacement of "enter exhausted" (units enter exhausted by default, CR 143.4), so it does not count as "becoming ready" (805.6.a). The extra cost is still owed when the base cost is ignored (CR 356.1.b.3 example).
- **Pool (DATA):** {{kw:accelerate}}
- **Examples:**
{{ex:kw:accelerate|Legion Rearguard|Kai'Sa, Survivor|War Scout}}
- **Deck-building meaning (HEURISTIC):** role `tempo_ready`; axis conquer triggers (enabler). A ready unit can use its Standard Move the turn it is played, so it converts Energy into an immediate attack or conquer. Real cost of the card = printed cost + 1 Energy + 1 Power (one recycled rune, section 4.2) when used as haste. Combos with conquer effects and with "when I attack" text; answered by cheap blockers, stun, and Reaction removal in the showdown it starts.
- **Modes:** 1v1: strongest, a ready attacker onto the single enemy-held battlefield is a point swing. FFA: three battlefields and more open ones, so ready units convert to conquers more often, but two opponents can answer. 2v2: same as 1v1, plus the teammate's battlefields are not valid move targets (CR 449.2.b), which narrows where the ready unit can go.

### 2.2 Action (CR 806)
- **Class (FACT, 806.1, 806.1.a):** Permissive keyword on cards, rune abilities, legend abilities or permanent abilities.
- **Definition (FACT, 806.1.c):** on cards "This can be played during showdowns on any player's turn."; on activated abilities "This can be activated during showdowns on any player's turn." It adds to the default timing, it does not restrict to showdowns (806.2). A unit with Action still may only be played to base or a controlled battlefield (806.3).
- **Reminder as printed:** "(Play on your turn or in showdowns.)"
- **Number:** none.
- **Zone / timing:** hand (or wherever the card may be played from) and board abilities; Neutral Open on your turn, plus Showdown Open on any turn when you have Focus (CR 313). Not during a chain.
- **Pool (DATA):** {{kw:action}} Spells by speed (DATA): {{pool:spellAction}} Action-only, {{pool:spellReaction}} Reaction, {{pool:spellSlow}} neither.
- **Examples:**
{{ex:kw:action|Hextech Ray|Primal Strength|Divining Shells}}
- **Deck-building meaning (HEURISTIC):** this is the `speed=action` field of a card, not a role by itself. An Action spell that changes Might or kills is a `combat_trick` / removal usable inside a combat; a spell with neither Action nor Reaction can never affect a combat that is already open. Axis: spell-slinging. Answered by Reaction spells (they resolve first, CR 159.2.b.3) and counterspells.
- **Modes:** 1v1: usable in every showdown you are part of. FFA: showdown Focus passes "to the next Player in Turn Order" (CR 347.1.b) and all players can act, so a third player can interfere in a combat they are not in. 2v2: same, and your Action spells can support the teammate's combat.

### 2.3 Assault (CR 807)
- **Class (FACT, 807.1, 807.1.a):** Passive Ability keyword on units.
- **Definition (FACT, 807.1.c):** "While I am an attacker, I have +X [M]."
- **Reminder as printed:** "(+1 [Might] while I'm an attacker.)", "(+2 [Might] while I'm an attacker.)".
- **Number (FACT, 807.1.b.3, 807.2):** X omitted = 1. Several sources are summed: Petty Officer (Assault) + Cleave ("Give a unit [Assault 3] this turn.") = Assault 4.
- **Zone / timing:** board, only while the unit holds the Attacker designation in a combat (CR 466.2.c). The attacker is the player whose units applied Contested to the battlefield (466.2.c.1).
- **Pool (DATA):** {{kw:assault}}
- **Other cards using it (HEURISTIC classification):** {{refs:assault}}
- **Examples:**
{{ex:kw:assault|Daring Poro|Laurent Duelist|Cleave}}
- **Deck-building meaning (HEURISTIC):** effective Might when attacking = Might + X, 0 extra when defending or holding. Role: combat stat for aggro; as a granted "this turn" effect it is a `combat_trick`. Axis attack (Assault) enabler, conquer triggers enabler. Combos with Accelerate/ready effects (attack the turn it lands), "when I attack" triggers, excess-damage payoffs (section 4.6). Answered by Shield/Tank defenders, -Might effects, stun (a stunned unit contributes no combat damage, CR 424.1.b).
- **Modes:** identical rules. FFA: more battlefields to attack, and attacking one opponent leaves you open to the other. 2v2: no change.

### 2.4 Deathknell (CR 808)
- **Class (FACT, 808.1, 808.1.a):** Triggered Ability keyword on permanents (units and gear).
- **Definition (FACT, 808.1.c):** "When I die, [Effect]." The trigger is "the Permanent being Killed and sent to the Trash" (808.1.d). If the death is replaced (e.g. by a recall) the trigger is removed (808.1.d.1).
- **Reminder as printed:** "(When I die, get the effect.)"
- **Number:** none. Several Deathknells on one permanent trigger separately (808.2).
- **Zone / timing:** triggers from the board at the moment of death; resolves on the chain (can be responded to with Reactions).
- **Pool (DATA):** {{kw:deathknell}}
- **Examples:**
{{ex:kw:deathknell|Watchful Sentry|Ruined Rex|Honest Broker}}
- **Deck-building meaning (HEURISTIC):** value that survives removal; the card is good fodder for "kill a friendly unit" costs. Axis deathknell / sacrifice (enabler). Combos with self-kill costs (e.g. Cruel Patron OGN-208 "As an additional cost to play me, kill a friendly unit."), Temporary, and "trigger again" text. **Not triggered** by banish (CR 428.2.a "Banish is not a subset of Kill"), by return to hand, or by recycle, so those are the answers (e.g. Smite UNL-007 "If it would die this turn, banish it instead."). Tokens also trigger it (the Bomb token is a Deathknell gear, CR 187.12).
- **Modes:** 1v1 and 2v2 the same. FFA: "an enemy unit" / "an opponent" Deathknells let you choose which opponent to hit; combat happens more often between other players, so your units die less on other players' turns.

### 2.5 Deflect (CR 809)
- **Class (FACT, 809.1, 809.1.a):** Passive Ability keyword, normally on permanents.
- **Definition (FACT, 809.1.c):** "Spells and abilities an opponent controls that target [me/this] cost an amount of Power equal to [Deflect Value] more to play as an additional cost for each time they choose [me/this]." The Power may be of any domain (809.1.c.1). It is a Mandatory Additional Cost (809.1.d, CR 356.2.a.2).
- **Reminder as printed:** "(Opponents must pay [Rainbow] to choose me with a spell or ability.)"; Deflect 2: "[Rainbow][Rainbow]".
- **Number (FACT, 809.1.b.3, 809.2):** X omitted = 1; sources are summed.
- **Zone / timing:** board; applies when an opponent's spell or ability **targets** the object (chooses it). Effects that do not choose ("Kill all gear", "Deal 3 to all units in bases") ignore it (CR 355.5.a). Some cards say "Ignore Deflect" (CR 765-767).
- **Pool (DATA):** {{kw:deflect}}
- **Other cards using it (HEURISTIC classification):** {{refs:deflect}}
- **Examples:**
{{ex:kw:deflect|Pouty Poro|Sivir, Ambitious|Petricite Monument}}
- **Deck-building meaning (HEURISTIC):** role `protection`. Each Power an opponent pays is normally one of their runes recycled (section 4.2), so Deflect taxes tempo, not only resources. Axis deflect / being chosen (enabler), hold triggers (enabler). Best on units that must survive to score (hold effects, win conditions). Answered by untargeted sweepers, combat, and "ignore Deflect" text.
- **Modes:** 1v1: taxes the one opponent. FFA: taxes every opponent separately, value rises with the number of opponents holding targeted removal. 2v2: "Friendly units have [Deflect]" style grants reach the teammate's units too, because friendly includes a teammate's objects (CR 740.1.a, 491.8.e).

### 2.6 Ganking (CR 810)
- **Class (FACT, 810.1, 810.1.a):** Passive Ability keyword on units.
- **Definition (FACT, 810.1.b):** "I may move to a battlefield from another battlefield with a standard move." It adds an option to the Standard Move and gives no extra moves (810.1.c.3).
- **Reminder as printed:** "(I can move from battlefield to battlefield.)"
- **Number:** none.
- **Zone / timing:** board; the Standard Move is a Discretionary Action in your Main Phase, not in a Closed state and not during a showdown or combat, and it exhausts the unit (CR 144.1, 144.2). Without Ganking a unit may only move base to battlefield or battlefield to base (144.4).
- **Pool (DATA):** {{kw:ganking}}
- **Other cards using it (HEURISTIC classification):** {{refs:ganking}}
- **Examples:**
{{ex:kw:ganking|Yasuo, Windrider|Kayn, Unleashed|Boots of Swiftness}}
- **Deck-building meaning (HEURISTIC):** role `movement`. Saves one turn and one ready-up when re-positioning (battlefield to battlefield directly instead of via base). Still needs the unit to be ready, so it pairs with ready effects ("Move a friendly unit and ready it", Ride the Wind OGN-173) and "when I move" triggers. Axis movement (enabler), conquer triggers (enabler). Answered by exhaust/stun effects and "can't move" text.
- **Modes:** 1v1: two battlefields, so Ganking only means "hop to the other one". FFA and 2v2: three battlefields on board (CR 489.4, 490.4, 491.4), so there are two possible destinations and the keyword is worth more; in 2v2 a teammate-occupied battlefield is not a valid destination (CR 449.2.b); in FFA a battlefield with a staged or ongoing combat between two other players is not either (CR 449.2.a).

### 2.7 Hidden (CR 811)
- **Class (FACT, 811.1, 811.1.a):** prerequisite for the Hide Discretionary Action; present on spells, units and gear.
- **Definition (FACT, 811.1.b):** "While this card is in your hand or in your Champion Zone on your turn during an Open State, you may pay [A] to hide this facedown at a battlefield you control that doesn't already have a facedown card hidden there for as long as you control that battlefield. Beginning on the next turn, this gains [Reaction] and you may play this, ignoring its base cost."
- **Reminder as printed:** "(Hide now for [Rainbow] to react with later for [0].)"
- **Number:** none.
- **Zone / timing (FACT):** hide from hand or Champion Zone, your turn, Open state, at a battlefield **you control**, one facedown card per battlefield (Facedown Zone occupancy 1, CR 107.3.b). Hiding does not open a chain (811.1.c.2); playing from facedown does (811.1.c.3). From the next turn it is a Reaction with base cost ignored (811.6). A hidden permanent must be played to that battlefield, including gear (811.1.d.1); targets of a hidden spell or of a hidden permanent's play effect must be at that battlefield unless that is impossible (811.1.d.2-.3). The card may instead be played normally for its cost (811.3). A facedown card is not "a card with Hidden" (811.5.a). Losing control of the battlefield sends the facedown card to its owner's trash in the next cleanup (CR 107.3.d, 323.6.a, 468.5.c).
- **Pool (DATA):** {{kw:hidden}}
- **Examples:**
{{ex:kw:hidden|Pakaa Cub|Block|Zhonya's Hourglass}}
- **Deck-building meaning (HEURISTIC):** `speed=hidden`: pay 1 Power now, get the card later for free at Reaction speed. It shifts cost from the turn you need the effect to an earlier turn, and makes any holder of a battlefield threatening. Needs a controlled battlefield, so it rewards decks that hold. Axis hidden / facedown (enabler); payoffs read "when you play a card from face down" (e.g. Black Market Broker SFD-121, Evelynn, Consuming RAD-090, legend Agony's Embrace RAD-153) or add facedown slots (Bandle Tree OGN-278, Bushwhack Trap RAD-108). Answered by taking the battlefield (the card is trashed unseen), and by Mystic Vortex VEN-160 ("During showdowns here, cards with [Reaction] cost [Rainbow] more to play.").
- **Modes:** 1v1: full value. FFA: three battlefields but each player usually controls fewer, and two opponents can evict you. 2v2: "Players may not Hide cards at Battlefields controlled by their Teammate" (CR 491.8.c.1), so only your own battlefields count.

### 2.8 Legion (CR 812)
- **Class (FACT, 812.1):** Dependent Keyword.
- **Definition (FACT, 812.1.b.1):** "If you have played another card this turn, this card gains [Text]." The condition is met once a different card "has been Finalized by you on the same turn" (812.1.c); a countered card still counts (CR 420.4.b example).
- **Reminder as printed:** "(Get the effect if you've played another card this turn.)"
- **Number:** none.
- **Zone / timing:** wherever the dependent ability works: in hand for cost reductions ("[Legion] — I cost [2] less."), on play for play effects, on the board for static or activated text.
- **Pool (DATA):** {{kw:legion}}
- **Examples:**
{{ex:kw:legion|Noxus Hopeful|Vanguard Captain|Sun Disc}}
- **Deck-building meaning (HEURISTIC):** sequencing payoff: the card wants a cheap card played first. Axis legion (second card): enablers are cards costing 0-1 Energy and free plays (hidden cards, tokens do not count as cards: "Tokens are not cards", CR 185). Curve consequence: a Legion deck needs a high count of 1-cost cards. No direct answer; it is weakest when the deck is top-decking one card per turn.
- **Modes:** no rule difference. In 2v2 only cards **you** played count ("Finalized by you", 812.1.c), not the teammate's.

### 2.9 Reaction (CR 813)
- **Class (FACT, 813.1, 813.1.a):** Permissive keyword on cards, rune abilities, legend abilities and permanent abilities.
- **Definition (FACT, 813.1.b, 813.1.c):** grants "all abilities and permissions of Action" and additionally "This can be played during Closed States on any player's turn." / "This can be activated during Closed States on any player's turn."
- **Reminder as printed:** "(Play any time, even before spells and abilities resolve.)"; on units "(…, including to a battlefield you control.)".
- **Number:** none.
- **Zone / timing:** any time you have priority, including while a chain exists; the newest item resolves first (CR 340.1), so a Reaction resolves before what it responds to (CR 159.2.b.3). Reaction abilities that Add resources can be used whenever a cost is being paid and cannot be responded to (CR 430.2, 430.3).
- **Pool (DATA):** {{kw:reaction}}
- **Other cards using it (HEURISTIC classification):** {{refs:reaction}}
- **Examples:**
{{ex:kw:reaction|Wind Wall|Discipline|Dragonsoul Sage}}
- **Deck-building meaning (HEURISTIC):** `speed=reaction`. The role comes from the effect: `counterspell` ("Counter a spell."), `protection`, `combat_trick`, instant draw. Reactions are the only way to act in an opponent's Neutral turn window, so the count of Reaction cards a deck can hold up is its interaction density. Hidden cards and Quick-Draw gear also have Reaction (811.6, 819.1.b). Answered by taxes on Reactions (Mystic Vortex VEN-160) and "can't be countered" (Decree of Rage VEN-015).
- **Modes:** 1v1: one opponent to respond to. FFA: priority passes around the whole table (CR 339), so a spell can be answered by any opponent and your Reactions have more targets but your own plays face more responders. 2v2: both opponents can respond; a teammate can also react.

### 2.10 Shield (CR 814)
- **Class (FACT, 814.1, 814.1.a):** Passive Ability keyword on units.
- **Definition (FACT, 814.1.c):** "While I am a defender, I have +X [M]."
- **Reminder as printed:** "(+1 [Might] while I'm a defender.)"; with Assault on one line: "(+2 [Might] while I'm an attacker or defender.)".
- **Number (FACT, 814.1.b.3, 814.2):** X omitted = 1; summed across sources (Stalwart Poro + Block's Shield 3 = Shield 4).
- **Zone / timing:** board, only while the unit has the Defender designation (CR 466.2.c.2-.3). The extra Might also raises the damage needed to kill it in that combat, because lethal damage is measured against current Might (CR 142.4.b).
- **Pool (DATA):** {{kw:shield}}
- **Other cards using it (HEURISTIC classification):** {{refs:shield}}
- **Examples:**
{{ex:kw:shield|Stalwart Poro|Wrath of the Freljord|Cloth Armor}}
- **Deck-building meaning (HEURISTIC):** effective Might when defending = Might + X. Role: defensive combat stat; granted "this turn" it is a `combat_trick` / `protection`. Axis defend (Shield/Tank) enabler, hold triggers enabler. No effect against spell damage outside combat. Answered by non-combat removal, by moving the unit away, by -Might.
- **Modes:** 1v1: one attacker per turn cycle. FFA: a held battlefield can be attacked by two or three different opponents before your next Beginning Phase, so defensive stats are used more often per round. 2v2: same as FFA with two attackers.

### 2.11 Tank (CR 815)
- **Class (FACT, 815.1, 815.1.a):** Passive Ability keyword on units.
- **Definition (FACT, 815.1.b):** "I must be assigned lethal damage before any other unit with the same controller as me that does not have [Tank] during the Combat Damage step."
- **Reminder as printed:** "(I must be assigned combat damage first.)"
- **Number:** none.
- **Zone / timing:** board, Combat Damage step only (CR 467.2.c.6-.9). Works both when attacking and when defending. With several Tanks the assigning player picks the order among them (815.1.c.2). A unit with both Tank and Backline lets the assigning player choose which to obey (CR 467.2.c.8).
- **Pool (DATA):** {{kw:tank}}
- **Other cards using it (HEURISTIC classification):** {{refs:tank}}
- **Examples:**
{{ex:kw:tank|Lecturing Yordle|Mutated Mouser|Dune Surfer}}
- **Deck-building meaning (HEURISTIC):** role `protection` for the rest of the stack: the opponent's combat damage is soaked by the Tank first, so high-value low-Might units survive combat. Value scales with Tank's Might (+ Shield). Axis defend (Shield/Tank) enabler, hold triggers enabler. Answered by Dune Surfer VEN-004 ("You ignore [Tank] while assigning combat damage here."), by removing the Tank before damage with an Action/Reaction spell, and by non-combat damage.
- **Modes:** no rule difference; see Shield for how often defence is tested in multiplayer.

### 2.12 Temporary (CR 816)
- **Class (FACT, 816.1, 816.1.a):** Triggered Ability keyword on permanents.
- **Definition (FACT, 816.1.b):** "At the start of this permanent's controller's Beginning Phase, before scoring, kill this."
- **Reminder as printed:** "(Kill this at the start of its controller's Beginning Phase, before scoring.)"
- **Number:** none.
- **Zone / timing:** board; triggers in the controller's Beginning Step, which is before the Scoring Step (CR 315.2.a, 315.2.b). So a Temporary unit can conquer on the turn it arrives but can never hold.
- **Pool (DATA):** {{kw:temporary}} The Sprite token has it (CR 187.2).
- **Other cards using it (HEURISTIC classification):** {{refs:temporary}}
- **Examples:**
{{ex:kw:temporary|Sumpworks Map|Sprite Mother|Last Stand}}
- **Deck-building meaning (HEURISTIC):** a drawback that marks one-turn bodies (Sprites, Reflections, borrowed copies). Because it is a kill, it triggers Deathknell and "when a friendly unit dies" text; it is fodder. Axis deathknell / sacrifice (enabler). LeBlanc, Everywhere at Once UNL-090 turns it off ("Your [Temporary] effects at my battlefield don't trigger."). As a text given to an enemy or to your own doubled unit (Last Stand OGN-069) it is a delayed kill.
- **Modes:** the kill waits for the **controller's** next Beginning Phase. In FFA4 and 2v2 three other turns pass first, so a Temporary body blocks or threatens through three opposing turns instead of one.

### 2.13 Vision (CR 817)
- **Class (FACT, 817.1, 817.1.a):** Triggered Ability keyword on permanents.
- **Definition (FACT, 817.1.b):** "When this is played, [Predict]." Predict = look at the top card of your Main Deck, you may recycle it (CR 437.1).
- **Reminder as printed:** "(When you play me, look at the top card of your Main Deck. You may recycle it.)"
- **Number:** none. Multiple instances trigger separately (817.2).
- **Zone / timing:** on entering the board (817.1.c).
- **Pool (DATA):** {{kw:vision}}
- **Examples:**
{{ex:kw:vision|Mystic Poro|Gemcraft Seer|Divining Shells}}
- **Deck-building meaning (HEURISTIC):** role `selection` (about a quarter of a card of quality). Axis top-deck (Vision/Predict) enabler; payoffs reveal or play the top card (e.g. Raving Witness RAD-074, Apprentice Smith SFD-041). No answer needed.
- **Modes:** no difference.
