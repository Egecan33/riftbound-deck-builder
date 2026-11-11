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

### 2.14 Equip (CR 818)
- **Class (FACT, 818.1, 818.1.a):** Activated Ability keyword on gear with the Equipment tag.
- **Definition (FACT, 818.1.c.2):** "[Cost]: Attach this gear to a unit you control." The choice is a target (818.1.b.1). The cost may be resources or anything else (818.1.c.3), e.g. "[Equip] — [Order], Kill a friendly unit".
- **Reminder as printed:** "([Body]: Attach this to a unit you control.)" with the card's cost; non-resource costs print "(Pay the cost: Attach this to a unit you control.)".
- **Number:** none; the token after the keyword is a cost, not a value.
- **Zone / timing:** the gear must be on the board (gear is played to base and enters ready, CR 148.1.a.1, 149.1). Default activated-ability timing: your Main Phase, Open state, not in a showdown (CR 151.2). Re-activating moves the Equipment to a new unit (CR 435.1.f). While attached, the gear's own rules text is Inactive, its Effect Text is added to the unit and its Might Bonus applies (CR 718.2-718.4). When the unit leaves the board the Equipment detaches, stays on the board and is recalled to base in the next cleanup (CR 719.5, 459.1).
- **Pool (DATA):** {{kw:equip}} Gear with the Equipment tag: {{pool:equipmentTag}}.
- **Examples:**
{{ex:kw:equip|Doran's Blade|Blade of the Ruined King|Hexdrinker}}
- **Deck-building meaning (HEURISTIC):** role `buff` that outlives its carrier: total cost = play cost + Equip cost, re-payable Equip cost each time the carrier dies. Axis equipment / attach (enabler), gear matters (enabler). Combos with Weaponmaster, Quick-Draw, "equipped"/"attach" payoffs and legends that move Equipment (Grandmaster at Arms SFD-193). Answered by gear removal ("Kill a gear", Detonate SFD-005, Thermo Beam OGN-022 "Kill all gear.") and by killing the carrier in response to the Equip ability (it is a targeted ability on the chain).
- **Modes:** no rule difference. 2v2: Equip says "a unit you control", so it cannot go on a teammate's unit (control is not shared, CR 491.8.c).

### 2.15 Quick-Draw (CR 819)
- **Class (FACT, 819.1, 819.1.a):** Triggered Ability keyword and Permissive keyword, on gear with Equip.
- **Definition (FACT, 819.1.d):** short for "[Reaction]" and "When you play this, attach it to a Unit you control."
- **Reminder as printed:** "(This has [Reaction]. When you play it, attach it to a unit you control.)"
- **Number:** none.
- **Zone / timing:** played from hand at Reaction speed; the attach is a play effect, no Equip cost is paid for it.
- **Pool (DATA):** {{kw:quick-draw}}
- **Examples:**
{{ex:kw:quick-draw|Long Sword|Cloth Armor|Protector's Shield}}
- **Deck-building meaning (HEURISTIC):** an Equipment that doubles as a `combat_trick`: its Might Bonus or Effect Text lands in the middle of a combat and then stays. Axis equipment / attach (enabler). Answered like any Reaction.
- **Modes:** no difference.

### 2.16 Repeat (CR 820)
- **Class (FACT, 820.1, 820.1.a):** Optional Additional Cost keyword on spells and abilities.
- **Definition (FACT, 820.1.d):** "You may pay [Cost] as an additional cost as you play this. If you do, execute the instructions of this chain item one additional time during resolution." Choices for the second execution may differ (820.2.a). The spell is still played only once (820.3.a).
- **Reminder as printed:** "(You may pay the additional cost to repeat this spell's effect.)"
- **Number:** none; the token after the keyword is the cost. Each Repeat cost can be paid once (820.1.c.3).
- **Zone / timing:** decided while playing the spell (finalization). Cost checks on the spell use its printed cost, not printed + Repeat (CR 206: Defy can still counter Rocket Barrage whose Repeat was paid).
- **Pool (DATA):** {{kw:repeat}}
- **Examples:**
{{ex:kw:repeat|Desert's Call|Square Up|Syndra, Transcendent}}
- **Deck-building meaning (HEURISTIC):** a spell with two sizes: cheap early, double effect late. Role: scaling energy sink; it lowers the number of cards a deck needs for late game. Axis rune ramp / big energy (payoff), spell-slinging. Supported by Marai Spire SFD-211 ("friendly [Repeat] costs cost [1] less") and The Academy UNL-216. A counterspell answers both halves at once because only one spell was played.
- **Modes:** no rule difference; longer multiplayer games reach the Repeat cost more often (HEURISTIC).

### 2.17 Weaponmaster (CR 821)
- **Class (FACT, 821.1, 821.1.a):** Triggered Ability keyword on units (a play effect).
- **Definition (FACT, 821.1.c):** "When you play me, you may choose a Card you control with the Equipment tag. … Pay the cost of its Equip ability, reduced by [A], to attach it to this unit." The Equip ability is not activated and the unit is not chosen (821.1.c.6); an Equipment without an Equip cost cannot be attached this way (821.1.c.4).
- **Reminder as printed:** "(When you play me, you may [Equip] one of your Equipment to me for [Rainbow] less, even if it's already attached.)"
- **Number:** none.
- **Zone / timing:** on entering the board; "has no function while on the board" afterwards (821.2). Works on Equipment already attached elsewhere.
- **Pool (DATA):** {{kw:weaponmaster}}
- **Examples:**
{{ex:kw:weaponmaster|Veteran Poro|Lucian, Merciless|Emperor of the Sands}}
- **Deck-building meaning (HEURISTIC):** an Equipment carrier: with the common one-Power Equip costs the re-equip is free. Needs Equipment already on the board, so the deck wants cheap Equipment played first. Axis equipment / attach (payoff). Weak when the opponent kills gear.
- **Modes:** no difference.

### 2.18 Ambush (CR 822)
- **Class (FACT, 822.1, 822.1.a):** Passive Ability keyword, normally on units.
- **Definition (FACT, 822.1.b):** "I may be played to a battlefield where you control Units" and "I have [Reaction] as long as I'm being played to a battlefield where you control Units."
- **Reminder as printed:** "(You may play me as a [Reaction] to a battlefield where you have units.)"
- **Number:** none.
- **Zone / timing:** from hand, at Reaction speed, to a battlefield where you already have a unit (also one you do not control, e.g. where your attackers are). If your units there are gone before the card finalizes, the permission fails (822.3). The unit still enters exhausted (CR 143.4) but gains the Attacker or Defender designation in the next cleanup (CR 466.2.c.3.a, 323.2.a) and adds its Might to combat damage.
- **Pool (DATA):** {{kw:ambush}}
- **Examples:**
{{ex:kw:ambush|Soulspinner|Inferna|Rengar, Trophy Hunter}}
- **Deck-building meaning (HEURISTIC):** a unit that is also a combat trick worth its full Might, held up during the opponent's turn. Role `tempo_ready`-like reinforcement and, when defending, `protection` of a hold. Axis attack / defend. Combos with "when you play a unit during a showdown" (Fresh Beans UNL-011) and play effects that deal damage. Answered by removing the unit already at the battlefield in response (822.3).
- **Modes:** 1v1: needs your unit at the fought battlefield. 2v2: the teammate's units do not enable it ("where you control Units"). FFA: usable in any combat you are part of.

### 2.19 Hunt (CR 823)
- **Class (FACT, 823.1, 823.1.a, 823.1.b):** Triggered Ability keyword on units; "both a Conquer and a Hold effect".
- **Definition (FACT, 823.1.c.1):** "When I Conquer or Hold, my controller gains X XP."
- **Reminder as printed:** "(When I conquer or hold, gain 1 XP.)"
- **Number (FACT, 823.1.c.2, 823.2):** X omitted = 1; summed across sources.
- **Zone / timing:** board; triggers when the battlefield the unit is at is scored by its controller (CR 383.4.c, 383.4.d), at most once per battlefield per turn (CR 472).
- **Pool (DATA):** {{kw:hunt}}
- **Examples:**
{{ex:kw:hunt|Voracious Gromp|Herald of Spring|Hunter's Machete}}
- **Deck-building meaning (HEURISTIC):** XP source tied to scoring: the deck earns XP by doing what wins anyway. Axis XP / Level (enabler); it is also a conquer/hold payoff. Needs Level cards or "Spend N XP" sinks to matter. Answered by denying the score (kill or bounce the unit, contest the battlefield).
- **Modes:** XP is per player: "XP is not shared between Allies" (CR 732), so in 2v2 each player needs their own sources. FFA: holding is harder with more attackers, so Hunt fires less through hold.

### 2.20 Level (CR 824)
- **Class (FACT, 824.1):** Dependent Keyword.
- **Definition (FACT, 824.1.b.1):** "While you have [N] or more XP, this card gains '[Text]'." It switches off as soon as the controller has less than N XP (824.1.d).
- **Reminder as printed:** "(While you have 6+ XP, get the effect.)"
- **Number:** N is a threshold, not a strength; printed thresholds in the pool are 3, 6, 11 and 16 (DATA, see the count line). Several Level lines on one card are separate abilities ("[Level 6][>] … instead").
- **Zone / timing:** wherever the dependent text works (hand for cost reductions, board for static text, legends).
- **Pool (DATA):** {{kw:level}}
- **Examples:**
{{ex:kw:level|Bandle Soldier|Gemhand Hunter|Wuju Master}}
- **Deck-building meaning (HEURISTIC):** threshold payoff. XP is both a threshold and a currency (CR 730): "Spend N XP" costs lower the total and can switch Level text off, so sinks and thresholds compete. Axis XP / Level (payoff). A deck should be scored on XP gained per turn versus the lowest threshold it cares about.
- **Modes:** 2v2: thresholds are checked against your own XP only (CR 732). No other difference.

### 2.21 Unique (CR 825)
- **Class (FACT, 825.1):** Deck Constraint Permission.
- **Definition (FACT, 825.3.a):** "A deck can contain only one card of a given name if the card has Unique". No effect during play (825.4).
- **Reminder as printed:** "(Your deck can have only 1 card with this name.)"
- **Pool (DATA):** {{kw:unique}}
- **Examples:**
{{ex:kw:unique|Forgefire Cape|Rabadon's Deathcrown|Shurelya's Requiem}}
- **Deck-building meaning:** validation only (see `rules.md` section 4). In a 40-card deck a 1-of is in the opening 4 cards about 10% of the time (4/39 with the Chosen Champion set aside, before mulligan), so Unique cards cannot be a plan by themselves (HEURISTIC).
- **Modes:** not applied in Limited (TR 602.4.a.6.a, see `rules.md` 10.1).

### 2.22 Backline (CR 826)
- **Class (FACT, 826.1, 826.2):** Passive Ability keyword on units.
- **Definition (FACT, 826.3):** "I must be assigned lethal damage after any other unit with the same controller as me that does not have [Backline] during the Combat Damage step."
- **Reminder as printed:** "(I must be assigned combat damage last.)" Two older cards print the same sentence as plain text without the keyword (Caitlyn, Patrolling OGN-068; Soraka, Wanderer SFD-173); CR 467.2.c.8 treats Caitlyn's text as Backline.
- **Number:** none.
- **Zone / timing:** board, Combat Damage step. Can be ignored by text ("You ignore Backline while assigning combat damage here.", CR 766 example).
- **Pool (DATA):** {{kw:backline}}
- **Examples:**
{{ex:kw:backline|Enthusiastic Promoter|LeBlanc, Everywhere at Once|Caitlyn, Patrolling}}
- **Deck-building meaning (HEURISTIC):** self-protection in combat for an engine unit; worth nothing when the unit fights alone. Wants bodies in front, so it belongs with go-wide and Tank. Answered by non-combat removal and by killing the front line first.
- **Modes:** no difference.

### 2.23 Empower (CR 827; game action CR 442)
- **Class (FACT, 827.1, 827.1.a):** Activated Ability keyword, normally on permanents and legends.
- **Definition (FACT, 827.1.c.1):** "[Cost]: Empower this. Play only if not Empowered." Empowered is a binary status (CR 442.1.a) unless a card allows several (CR 442.1.c.1, 827.1.c.5; Kayle, Justified VEN-134).
- **Reminder as printed:** "([3]: Empower me. Use only if not Empowered.)"
- **Number:** none; the token after the keyword is the cost (may be "[1] or [Body]", "Discard 1", "[Exhaust]").
- **Zone / timing:** board or Legend Zone; default activated-ability timing (your Main Phase, Open state) unless the text changes it (827.1.c.4). The status is lost when the object leaves the board or when a "Disempower" cost is paid (CR 443).
- **Pool (DATA):** {{kw:empower}}
- **Examples:**
{{ex:kw:empower|Covert Informant|Legion Marauder|Kayle, Justified}}
- **Deck-building meaning (HEURISTIC):** an upgrade bought later: the card is cheap to deploy and has a second cost that turns on its `[Empowered]` text. Role: energy sink. Axis empower (enabler), rune ramp / big energy (payoff). Cards with "Disempower this" costs use the status as a rechargeable battery (Questionable Tome VEN-054). Supported by Risen Altar VEN-163 (cheaper Empower costs). Answered by removing the permanent after the cost was paid (2-for-1 in resources).
- **Modes:** no rule difference.

### 2.24 Empowered (CR 828)
- **Class (FACT, 828.1):** Dependent Keyword.
- **Definition (FACT, 828.1.b.1):** "While I have the Empowered status, this card gains '[Text]'." A dependent "When I become Empowered" trigger fires at that moment (828.1.d).
- **Reminder as printed:** none of its own; the Empower line carries the reminder. Deathknell variant: "(When I die while Empowered, get the effect.)".
- **Pool (DATA):** {{kw:empowered}} (references are mostly "If this is [Empowered]" conditions and "When I become [Empowered]" triggers, HEURISTIC reading).
- **Examples:**
{{ex:kw:empowered|Punching Poro|Mournful Witness|Mel, Newly Awakened}}
- **Deck-building meaning (HEURISTIC):** the payoff half of Empower; a card's rating must be computed in two states (base, empowered) with the Empower cost in between. Some cards become Empowered without the keyword cost (Mournful Witness VEN-028 after a combat). Axis empower (payoff).
- **Modes:** no difference.

### 2.25 Flow (CR 829)
- **Class (FACT, 829.1, 829.1.a):** Passive Ability keyword on spells.
- **Definition (FACT, 829.1.b):** "You may play this from your trash for its flow cost. Then banish it." The Flow cost replaces the base cost (829.1.c.1); timing permissions do not change (829.1.b.2).
- **Reminder as printed:** "(You may play this from your trash for its Flow cost. Then banish it.)"
- **Number:** none; the token after the keyword is the alternate cost.
- **Zone / timing:** trash, at the spell's normal timing. After the Flow play it is banished whatever happens to it (829.1.b.1), so each copy is cast at most twice.
- **Pool (DATA):** {{kw:flow}}
- **Examples:**
{{ex:kw:flow|Dredge Up|Onslaught|Stargazer}}
- **Deck-building meaning (HEURISTIC):** built-in card advantage: one card, two casts. It also works from the trash without ever being cast from hand, so discard and Burn effects (CR 441) turn into card selection. Role `recursion`. Axis trash / recursion (payoff), spell-slinging (enabler). Kennen, Storm of Shuriken VEN-113 grants Flow to another spell. Answered by trash hate (banish or recycle cards from a trash) and by counterspells on the second cast.
- **Modes:** no rule difference.

### 2.26 Deploy (CR 830) — new in Radiance
- **Class (FACT, 830.1, 830.1.a):** Passive Ability and Triggered Ability keyword on gear.
- **Definition (FACT, 830.1.b):** short for "This may be played or created to any battlefield," "Play or create this only to a battlefield," "If this is not a unit, it is not recalled in cleanups," and "When an opponent holds here, kill this."
- **Reminder as printed:** "(Play this only to a battlefield. When an opponent holds here, kill this.)"
- **Number:** none.
- **Zone / timing:** played to **any** battlefield, "including enemy occupied and open battlefields" (830.1.b.1); stays there (normal gear at a battlefield is recalled, CR 323.6); can be moved by effects (830.1.b.2); dies when an opponent Holds that battlefield (not when they merely conquer it).
- **Pool (DATA):** {{kw:deploy}} The Bomb token has it (CR 187.12).
- **Other cards using it (HEURISTIC classification):** {{refs:deploy}}
- **Examples:**
{{ex:kw:deploy|Banner of Conquest|Gravity Field|Jarvan IV, Martial Paragon}}
- **Deck-building meaning (HEURISTIC):** a local aura or trigger attached to a battlefield instead of a unit: it cannot be killed in combat and is removed only by gear removal or by an opponent holding there for a turn. It gives board presence at a battlefield without contesting it (gear does not apply Contested; only units do, CR 190.3.a). Axis deploy / bombs (RAD) enabler, gear matters enabler. Payoffs: Jarvan IV, Martial Paragon RAD-091, legend Exemplar of Demacia RAD-155, Overloaded Traveler RAD-072, Command: Attack RAD-033 (moves one).
- **Modes:** 1v1: with two battlefields the opponent's hold is the usual way it dies. FFA: any opponent holding there kills it, three players can do so. 2v2: only an **opponent's** hold kills it; a teammate holding the battlefield keeps it alive, and "Friendly units here" auras help the teammate's units (CR 740.1.a).

### 2.27 Disarm (CR 831) — new in Radiance
- **Class (FACT, 831.1, 831.1.a, 831.1.b):** Triggered Ability keyword on units; an Attack Trigger.
- **Definition (FACT, 831.1.d):** "When I attack, give an enemy unit here -X [M] this turn."
- **Reminder as printed:** "(When I attack, give an enemy unit here -1 [Might] this turn.)"
- **Number (FACT, 831.1.c.3, 831.1.d.1, 831.2):** X omitted = 1; summed; one trigger with the total value ("Your Mechs have [Disarm]." twice = Disarm 2).
- **Zone / timing:** board; triggers when the unit first gains the Attacker designation in a combat (CR 383.4.e), once per combat. The reduction lasts the whole turn, so it also lowers the damage needed to kill the target (CR 142.4.b).
- **Pool (DATA):** {{kw:disarm}}
- **Examples:**
{{ex:kw:disarm|Trinket Peddler|Disposal Expert|Clanging Sentry}}
- **Deck-building meaning (HEURISTIC):** an attack-only swing of X in both directions: the defender deals X less and dies to X less. Role `debuff`. Axis disarm / shrink (enabler), attack (payoff). Payoff text: "When you reduce the Might of an enemy unit" (Ahri, Confident RAD-038). It chooses an enemy unit, so Deflect taxes it. Useless when defending.
- **Modes:** no rule difference.

### 2.28 Show Off (CR 832) — new in Radiance
- **Class (FACT, 832.1, 832.1.a):** Passive Ability keyword, normally on cards.
- **Definition (FACT, 832.1.c):** "As you play [me/this], you may reveal [Object] from your hand and/or pick [Object] from among friendly game objects on the board." The shown object's information is locked in at that moment (832.1.d.1). A facedown card cannot be shown (PN-RAD ruling on Gutter Guardian).
- **Reminder as printed:** "(As you play this, you may reveal a unit from hand or pick a friendly unit.)"
- **Number:** none; the object description is the parameter ("a Mech", "a gear", "a card with Energy cost [7] or more", "a card with [Hidden]").
- **Zone / timing:** while playing the card (finalization). "Pick" is not targeting (CR 355.7), so Deflect and "can't be chosen" do not apply.
- **Pool (DATA):** {{kw:show-off}}
- **Examples:**
{{ex:kw:show-off|Incorrigible Construct|Primordial Roar|Battle Preparations}}
- **Deck-building meaning (HEURISTIC):** a conditional kicker with no resource cost: it only asks the deck to contain enough cards of the named kind. For a tool: read the object description, count matching cards in the deck (hand reveal) and matching permanents (board pick), and rate the card in "shown" and "not shown" states. Axis show off (RAD) payoff. Cost: reveals hidden information.
- **Modes:** 2v2: the pick is "among friendly game objects on the board", and friendly includes a teammate's objects (CR 740.1.a), so a teammate's board can satisfy it (HEURISTIC reading of the two rules together; no ruling found). No other difference.

## 3. Bracketed terms and game actions that are not keywords

These appear in card text in brackets or as verbs. They are defined in CR 413-446 ("Types of Actions") and CR 700-767.

| Term | Rule | Exact meaning (FACT) | Pool (DATA, n names) | Deck-building meaning (HEURISTIC) |
|---|---|---|---|---|
| `[Mighty]` | CR 706-711 | "A Unit 'is Mighty' as long as its Might is 5 or greater." It "becomes Mighty" when its Might crosses from below 5 to 5+. In non-board zones printed Might is used (711). | {{n:sys:mighty}} cards name it; {{pool:mightyUnits}} units have printed Might 5+ | payoff axis mighty (5+ Might); enablers are big units, +Might effects, Equipment, buffs |
| `[Buff]` | CR 427, 701-705 | place a Buff counter on a unit; "There can only be one Buff on a Unit at a time" (702.3); each Buff gives +1 Might (703); buffs can be spent (702.2.b) | {{n:sys:buff}} | permanent +1 that is also a currency ("spend a buff"); see 4.11 |
| `[Stun]` | CR 424 | binary status; "A Stunned Unit does not contribute its might to damage in the combat damage step" (424.1.b); ends in the end-of-turn cleanup (424.1.a.2) | {{n:sys:stun}} | combat removal for one turn; see 4.12 |
| `[Predict]` / Predict N | CR 437 | look at the top N cards of your Main Deck (N omitted = 1), recycle any number, put the rest back in any order; never causes Burn Out (437.4.a) | {{n:sys:predict}} | `selection` |
| `[Burn N]` | CR 441 | move the top N cards of a player's Main Deck to their trash; too few cards causes a Burn Out (441.4) | {{n:sys:burn}} | self-mill for trash payoffs; aimed at an opponent it speeds their Burn Out |
| `[Add]` | CR 430 | put Energy or Power into your Rune Pool; Add abilities resolve immediately and cannot be reacted to (430.2) | {{n:sys:add}} | `ramp` |
| Empower / Disempower | CR 442, 443 | gain / remove the Empowered status | see 2.23 | see 2.23 |
| Draw | CR 414 | top of Main Deck to hand; drawing from an empty deck causes Burn Out (414.4) | {{n:sys:draw}} | `draw` |
| Exhaust / Ready | CR 415, 416 | turn sideways / upright; an exhausted object cannot be exhausted again as a cost (415.4) | see 4.8 | see 4.8 |
| Recycle | CR 417 | put cards on the bottom of their owner's Main Deck (runes: Rune Deck); 2+ cards go in random order (417.5) | {{n:sys:recycle}} | see 4.13 |
| Deal | CR 418 | mark damage on units; "Deal X … for each …" is one instance (418.8) | {{n:sys:deal-damage}} | `removal_damage`; see 4.6 |
| Heal | CR 419 | clear damage; all units heal at end of every turn and in every combat cleanup (CR 143.3.b) | {{n:sys:heal}} | damage never carries over a turn |
| Play | CR 420 | put a card on the chain and finalize it; default from hand or Champion Zone (420.1.a) | - | see 4.3 |
| Move | CR 421, 447-455 | change location on the board | {{n:sys:move}} | see 4.7 |
| Hide | CR 422 | place a card facedown at a battlefield you control | {{n:sys:facedown}} | see 4.14 |
| Discard | CR 423 | hand to trash, the discarding player chooses (423.1.a) | {{n:sys:discard}} | self: `discard_outlet`; opponent: `hand_attack` |
| Reveal | CR 425 | show cards from a private or secret zone; they stay in their zone | {{n:sys:reveal}} | information; enables "if it's a …" selection |
| Counter | CR 426 | negate a card or ability on the chain; it goes to the trash; costs are not refunded (426.1.c) | {{n:sys:counter-spell}} | `counterspell`; see 4.18 |
| Banish | CR 428 | move a card from any zone to Banishment; "not a subset of Kill" (428.2.a) | {{n:sys:banish}} | see 4.13 |
| Kill | CR 429 | a permanent goes from the board to the trash | {{n:sys:kill}} | see 4.13 |
| Channel | CR 431 | put the top rune(s) of your Rune Deck onto the board, ready by default (431.2.a) | {{n:sys:channel}} | `ramp`; see 4.2 |
| Burn Out | CR 432 | when you must take more cards from your Main Deck than it holds: recycle your trash into the deck, then the player "Chooses an opponent to gain 1 point" (432.2.b, 432.2.c) | - | a deck that draws/burns its whole library gives away points |
| Double | CR 433 | add the attribute's current value to itself for the stated duration | {{n:sys:double}} | `combat_trick` |
| Swap | CR 434 | exchange two numeric values | {{n:sys:swap}} | `combat_trick` |
| Attach / Detach | CR 435, 436, 716-719 | link a non-unit card under a unit / unlink it | {{n:sys:attach}} | see 4.16 |
| Prevent | CR 438 | reduce the next damage by a value or "all" | {{n:sys:prevent}} | `protection` |
| Replace | CR 439 | create a token in place of an object (used by the Brush battlefield token) | - | - |
| Create | CR 440 | bring a new game object into the game | - | see 4.15 |
| Skip | CR 444 | replace an event or phase with nothing | - | - |
| Pay | CR 445 | remove a resource from your Rune Pool | - | see 4.1 |
| Copy | CR 446 | take on another object's copyable traits | {{n:sys:copy}} | see 4.19 |
| Recall | CR 456-460 | relocate a permanent to its base; "Recalls are not Moves" (458) | {{n:sys:recall}} | save a unit from death or remove an attacker without killing it |
| "Pick" | CR 355.7 | a choice that is not a target (new wording from Radiance on, PN-RAD) | printed only in reminder text so far | not taxed by Deflect, not stopped by "can't be chosen" |

## 4. Core systems

Counts are "names whose reminder-stripped text matches the detector in section 6" (DATA, n = {{pool:counted}}), split as unit / spell / gear / legend / battlefield. A text match means the card **mentions** the system; whether it is an enabler, a payoff or an answer is decided by the role rules in section 6.

### 4.1 Costs: Energy and Power (CR 131, 163, 201-206, 356-357, 445)
- **FACT (CR 131.2, 131.3):** a Main Deck card's cost is an Energy number plus zero or more Power symbols. **FACT (CR 163.1, 163.2):** Energy has no domain; Power has a domain; `[A]` is Power of any domain (CR 135.2.e.5), `[C]` is Power of the card's own domain and on a multi-domain card may be paid with either domain (CR 135.2.e.6.c).
- **FACT (CR 204):** four kinds of cost: Base Cost (upper left corner, or the part before ":" of an ability), Additional Costs ("as an additional cost", mandatory or with "may" optional, CR 356.2), Costs within Instructions ("[do X] to [do Y]", paid on resolution), Applied Costs ("must pay … to …", paid as the action happens, no chain).
- **FACT (CR 356):** Total Cost is built in this order: base-cost replacements ("for [Cost]", "ignoring its cost" sets Energy and Power to zero, 356.1.b.1; "ignoring its Energy cost" leaves Power, 356.1.b.2), additional costs, increases, discounts, then "ignoring any and all costs". Costs cannot go below 0 (356.6). A minimum in a discount applies only to that discount (356.4.e).
- **FACT (CR 206):** effects that look at a card's cost "always use its printed … cost", whatever was actually paid. So "a spell that costs [5] or more" and counterspell limits are properties of the printed card and can be precomputed.
- **FACT (CR 166-167, 316.3, 317.2.d):** resources sit in the Rune Pool, which empties at the start of each Main Phase and at the end of each turn. Nothing carries over.
- **FACT (CR 185.3.a.1):** tokens have no cost; it is treated as 0.
- **DATA (GAL, {{pool:main}} Main Deck names):** Energy cost distribution {{pool:energy}}; number of Power symbols {{pool:power}}; {{pool:powerCards}} names need at least one Power.
- **Pool:** cost reduction {{c:sys:cost-reduction}}; cost increase or tax {{c:sys:cost-increase}}; play ignoring cost {{c:sys:ignore-cost}}; "as an additional cost" / "you may pay" {{c:sys:additional-cost}}.
- **Examples (cost reduction):**
{{ex:sys:cost-reduction|Rhasa the Sunderer|Production Surge|Irelia, Graceful}}
- **Examples (ignoring cost):**
{{ex:sys:ignore-cost|Spectral Matron|Portal Rescue|Dazzling Aurora}}
- **Examples (tax):**
{{ex:sys:cost-increase|Helm of Suppression|Mageseeker Investigator|Vex, Cheerless}}
- **Deck-building meaning (HEURISTIC):** the two cost axes are different resources. Energy is renewable (exhaust a rune, it readies next turn). Power paid from a basic rune removes that rune from the board (4.2). A card's real weight is `energy + power` runes on the turn it is played and `power` runes of lasting tempo loss. "Ignoring its cost" effects (role: cheat) are worth the printed cost of the best target, so they pull high-cost units into the deck.
- **Modes:** no rule difference. HEURISTIC: taxes that hit "opponents" (Helm of Suppression VEN-045) scale with the number of opponents in FFA and 2v2.

### 4.2 Runes: channel, exhaust, recycle (CR 160-167, 315.3, 417, 430, 431)
- **FACT (CR 161.2.a, 315.3.b):** the Rune Deck has exactly 12 runes; the turn player channels 2 per turn in the Channel Phase (fewer if the Rune Deck is short). Runes are channeled ready by default (CR 431.2.a); many card effects say "channel 1 rune exhausted".
- **FACT (CR 164.2):** every basic rune has "[Reaction][>] [E]: Add [1]." and "[Reaction][>] Recycle this: Add [C]." So one rune gives 1 Energy per turn by exhausting, and gives 1 Power of its domain **once** by going back to the bottom of the Rune Deck (CR 417.1.b, 417.5.a: owner chooses the order). Both can be done with the same rune in one turn (exhaust for Energy, then recycle for Power), since recycling is a cost that does not need the rune ready (HEURISTIC reading of 164.2; ENGINE implements it this way).
- **FACT (CR 430.2, 430.3):** Add abilities resolve immediately, cannot be reacted to, and Reaction Add abilities may be used in the middle of paying a cost.
- **FACT (first-turn rules):** the second player (1v1, CR 487.7, 488.7) or the last player (FFA and 2v2, CR 489.7, 490.7, 491.7) channels one extra rune on their first Channel Phase.
- **Pool:** channel {{c:sys:channel}}; `[Add]` {{c:sys:add}}; ready runes {{c:sys:rune-ready}}; runes exhausted / enter exhausted {{c:sys:rune-exhaust}}; recycle runes {{c:sys:rune-recycle}}; Gold token {{c:sys:gold}} (Gold: "[Reaction][>] Kill this, [E]: [Add] [A].", CR 187.5).
- **Examples (channel):**
{{ex:sys:channel|Mobilize|Stormclaw Ursine|Startipped Peak}}
- **Examples (Add):**
{{ex:sys:add|Seal of Rage|Dragonsoul Sage|Sneaky Zeebles}}
- **Examples (ready runes):**
{{ex:sys:rune-ready|Gentle Gemdragon|Sona, Harmonious|Battle Preparations}}
- **Examples (Gold):**
{{ex:sys:gold|Treasure Hunter|Honest Broker|Chem-Baroness}}
- **Deck-building meaning (HEURISTIC):** rune count on board is the deck's clock: turn N has about 2N runes minus Power already spent. Power-heavy decks stay low on runes and keep cycling the same 12; Energy-heavy decks reach 12 runes around turn 6 and then need Energy sinks (Repeat, Empower, activated abilities). Role `ramp` = extra channel, Add sources (Seals give Power without recycling a rune), Gold, rune readying. The rune split between the legend's two domains must cover the Power symbols of each domain in the deck (see `rules.md` section 5).
- **Modes:** the extra first-turn rune goes to one player of two in 1v1 but one of three or four in FFA/2v2. No other rule difference.

### 4.3 Turn structure, the chain and priority (CR 301-340)
- **FACT (CR 315-317):** a turn is Awaken (ready everything you control), Beginning (start-of-Beginning-Phase effects, then the Scoring Step where you Hold), Channel (2 runes), Draw (1 card), Main Phase, Ending Phase (heal all units, "this turn" effects expire, Rune Pools empty).
- **FACT (CR 328-331):** playing a card or ability creates the Chain; while a Chain exists the turn is Closed and only Reaction cards and abilities may be added (CR 309.1.a).
- **FACT (CR 337-340, "FEPR"):** Finalize, Execute, Pass, Resolve. The player with priority may add a legally timed item or pass; when all players pass in sequence the **newest** item resolves (340.1).
- **FACT (CR 337.2):** "If, after finalizing the Chain Item, that item is a Unit, Gear, or an ability that Adds resources, it resolves immediately". HEURISTIC consequence: permanents cannot be responded to while being played; printed counterspells read "Counter a spell" (4.18). The permanent's "When you play me" effect is a separate trigger that does use the chain (CR 383.4.a.2).
- **FACT (CR 383.3.d.1):** simultaneous triggers are ordered starting with the turn player, in turn order.
- **FACT (CR 420.4):** "when you play" triggers fire when the card has resolved; a countered card does not trigger them (420.4.a.1), but conditions that check "have you played a card" (Legion) look at finalization (420.4.b).
- **Pool:** "When you play me/this" play effects {{c:sys:trigger-play}}; activated abilities (cost before a colon) {{c:sys:activated-ability}}; "once each turn"/"first time" limits {{c:sys:once-each-turn}}; "would … instead" replacement effects {{c:sys:replacement-would}}; spell-matters text {{c:sys:spell-matters}}.
- **Examples (spell-matters):**
{{ex:sys:spell-matters|Ravenbloom Student|Chemtech Cask|Lady of Luminosity, Starter}}
- **Deck-building meaning (HEURISTIC):** three speeds define when a card can matter: slow (own turn, empty chain), Action (plus showdowns), Reaction (any time). Units and gear are always slow unless they have Reaction, Ambush, Quick-Draw or are hidden. A deck's "interaction on the opponent's turn" = its Reaction cards + hidden cards + Ambush units.
- **Modes:** FFA: priority passes around three or four players before anything resolves, so every spell faces more possible responses. 2v2: "Players may play spells or activate abilities during their Teammate's Turn" when invited (CR 491.8.a, 316.5.b.1), including cards without Action or Reaction, which makes slow cards more flexible than in 1v1.

### 4.4 Showdowns and Focus (CR 311-313, 341-348)
- **FACT (CR 344, 323.7):** a Showdown starts in a cleanup when a battlefield became Contested (a unit moved or was played to a battlefield its controller does not control) and the turn is Neutral Open. With enemy units present it is the first step of a Combat; at an empty battlefield it is a Non-Combat Showdown (CR 316.8.b.1).
- **FACT (CR 345-348):** the player who applied Contested gets Focus; the player with Focus may play one Action/Reaction card or ability (which makes a chain) or pass; Focus then goes to the next player in turn order; when all players pass in sequence the Showdown ends. After a Non-Combat Showdown, the only player with units there takes control and Conquers (348.2.a).
- **Pool:** cards that name showdowns {{c:sys:showdown}}; cards that grant Action or Reaction {{c:sys:grants-timing}}.
- **Examples:**
{{ex:sys:showdown|Fresh Beans|Kai'Sa, Rebel|Mystic Vortex}}
- **Deck-building meaning (HEURISTIC):** even conquering an **empty** battlefield opens a window in which every opponent may play Action and Reaction cards (e.g. an Ambush unit cannot go there unless they have a unit there, but a spell that moves a unit in can turn the showdown into a combat, CR 316.8.b.1.a). Decks that score by walking into open battlefields still need to respect Reaction/Action interaction.
- **Modes:** FFA and 2v2: all players get Focus in turn order, including players with no units at that battlefield.

### 4.5 Battlefield control (CR 188-190, 323.5)
- **FACT (CR 190.2-190.4):** a battlefield is controlled by one player or by nobody. Control is established by being the only player with units there at the end of a showdown or combat; it is kept while you have units there; with no units there and an Open state you lose it in the next cleanup (190.4.c). Only units count: gear, including Deploy gear, does not hold or contest.
- **FACT (CR 190.6):** the controller controls the battlefield's abilities; "you" on a battlefield card means its controller; with no controller, "you" instructions are ignored (190.6.d).
- **FACT (CR 355.2.a):** units may be played only to your base or to a battlefield you control, unless a card says otherwise.
- **Pool:** text naming control of battlefields {{c:sys:battlefield-control-ref}}; text changing where a unit may be played {{c:sys:play-location}}.
- **Examples (play location):**
{{ex:sys:play-location|Sneaky Deckhand|Perched Grimwyrm|Miss Fortune, Buccaneer}}
- **Deck-building meaning (HEURISTIC):** a controlled battlefield is a second deployment zone (units played there are already in position, though exhausted) and the place where Hidden works. Losing your last unit there loses both. "Play me to an open battlefield" text is a conquer without a move (it still opens a showdown).
- **Modes:** 1v1: 2 battlefields. FFA and 2v2: 3 (CR 489.4, 490.4, 491.4). 2v2: "Control is not shared" (CR 491.8.c): you cannot play units to, hide at, or move to a battlefield your teammate occupies (CR 449.2.b).

### 4.6 Combat (CR 461-468)
- **FACT (CR 462-464):** combat happens at a battlefield with units of two opposing players, after a cleanup with an empty chain. "Combat can only occur between Units controlled by exactly two players" (464).
- **FACT (CR 466.2.c):** the **Attacker** is the player whose units applied Contested; the other is the **Defender**; their units at that battlefield get the designation. Attack and defend triggers go on the chain now, attacker's first (466.2.d.1).
- **FACT (CR 466, 347):** the Combat Showdown runs (Action/Reaction window).
- **FACT (CR 467.2):** Combat Damage: sum the Might of each side (stunned units contribute 0, CR 424.1.b; negative Might counts as 0, CR 143.2.c); starting with the attacker, each player **assigns** that much damage among the other side's units; a unit must be assigned lethal damage before the next unit gets any (467.2.c.3); no unit may be assigned more than lethal "unless no further units remain" (467.2.c.4); Tank first, Backline last (467.2.c.6); all damage is dealt simultaneously (467.2.c.1.a).
- **FACT (CR 142.4.b):** lethal damage is a non-zero amount ≥ the unit's current Might. Units with lethal damage die in the next cleanup (CR 323.4).
- **FACT (CR 468):** Resolution: surviving units heal; if defenders are still present, the attackers are **recalled** to base (468.1.a.2); a player has won the combat if they are the only one with units left (468.3.a); the sole survivor establishes control, which is a Conquer if they had not scored that battlefield this turn (468.5.d); facedown cards of a player who lost control are removed (468.5.c). A tie = both still have units (CR 740.3.a).
- **Excess damage (UNCONFIRMED definition):** six cards check "if you assigned N or more excess damage", but the current CR never defines "excess damage" (text search of the 2026-10-09 edition: the phrase does not occur). The only rule that allows it is 467.2.c.4 (damage beyond lethal may be put on the last unit). HEURISTIC, as implemented in ENGINE (`excessDamageThisCombat`): excess = combat damage a player assigned beyond what was needed for lethal on all enemy units in that combat.
- **Pool:** attack triggers {{c:sys:attack-trigger}}; defend triggers {{c:sys:defend-trigger}}; "win a combat" {{c:sys:win-combat}}; excess damage {{c:sys:excess-damage}}; damage-assignment text {{c:sys:damage-assignment}}; deal damage (any) {{c:sys:deal-damage}}; Bonus Damage (CR 712-715) {{c:sys:bonus-damage}}; prevent {{c:sys:prevent}}.
- **Examples (attack triggers):**
{{ex:sys:attack-trigger|Crackshot Corsair|Anivia, Primal|Nine-Tailed Fox}}
- **Examples (defend triggers):**
{{ex:sys:defend-trigger|Overzealous Fan|Loyal Pup|Reaver's Row}}
- **Examples (excess damage):**
{{ex:sys:excess-damage|Tryndamere, Barbarian|Yeti Brawler|Piltover Enforcer}}
- **Examples (win a combat):**
{{ex:sys:win-combat|Corrupt Enforcer|Blossoming Dreamroot|Draven, Audacious}}
- **Examples (damage):**
{{ex:sys:deal-damage|Supernova|Iron Ballista|Avalanche}}
- **Examples (Bonus Damage):**
{{ex:sys:bonus-damage|Annie, Fiery|Ravenborn Tome|Rabadon's Deathcrown}}
- **Deck-building meaning (HEURISTIC):** combat is a comparison of **summed** Might, so many small units and one big unit are equal for dealing damage, but not for taking it: damage must fill units one at a time, so a single big unit either dies or takes nothing, while a wide board loses bodies in order (Tank first). A failed attack costs tempo, not units: attackers that do not clear the defenders go home. Damage does not persist past the turn (CR 143.3.b), so spell damage is only removal if it reaches the unit's Might within one turn, alone or together with combat.
- **Modes:** only two players fight at a time. FFA: a battlefield with a staged or ongoing combat cannot be entered by a third player (CR 449.2.a, 464.2), and no unit may move to a battlefield that already holds units of two other players (CR 451.2), so opponents block each other. 2v2: same two-player limit; a teammate cannot join your combat with units because your battlefield is an invalid destination for them (CR 449.2.b), only with spells.

### 4.7 Movement, Ganking and Recall (CR 144, 421, 447-460)
- **FACT (CR 144):** every unit has the Standard Move: in your Main Phase, Open state, not in a showdown or combat; cost = exhaust the unit; base to battlefield or battlefield to base; several units may move together to one destination (144.3). Ganking adds battlefield to battlefield (2.6).
- **FACT (CR 448.3.c):** a move "does not use the Chain, nor is it able to be Reacted to". The response window is the showdown that follows.
- **FACT (CR 452-454):** moving to a battlefield you do not control makes it Contested and leads to a showdown or combat.
- **FACT (CR 457-460):** a Recall puts a permanent in its base without being a move: it does not trigger "when I move" and cannot be stopped by movement restrictions.
- **Pool:** move text {{c:sys:move}}; "can't move" {{c:sys:cant-move}}; recall {{c:sys:recall}}; return to hand (bounce) {{c:sys:bounce}}.
- **Examples (move):**
{{ex:sys:move|Charm|Stellacorn Herder|Unforgiven}}
- **Examples (recall):**
{{ex:sys:recall|Possession|Zhonya's Hourglass|Highlander, Yi}}
- **Examples (bounce):**
{{ex:sys:bounce|Downwell|Windsinger|Bloodharbor Ripper}}
- **Deck-building meaning (HEURISTIC):** move effects split into four different roles that a parser must separate: move **your** unit (extra attack or retreat, no exhaust cost), move an **enemy** unit to base (removes a defender for the turn, or breaks a hold), move an enemy unit **to** a battlefield (forces a combat), and "when I move" triggers (payoff). Axis movement. Bounce is removal against tokens (they cease to exist off the board, CR 186.1), against buffed or equipped units, and a replay enabler for your own play effects.
- **Modes:** FFA and 2v2 have a third battlefield, which raises the value of Ganking and of "move to any battlefield" text; destination limits as in 4.6.

### 4.8 Ready and exhaust (CR 143.4, 149.1, 315.1, 415, 416)
- **FACT:** units enter exhausted (CR 143.4); gear enters ready (CR 149.1); everything you control readies in your Awaken Phase (CR 315.1.b). Exhausting is the cost of the Standard Move (CR 144.2) and of `[E]:` abilities; an exhausted object cannot pay it again (CR 415.4).
- **FACT:** nothing in CR 461-468 makes exhausted units skip combat: they still get a designation and their Might is summed. Exhaustion only stops moving and `[E]` costs.
- **Pool:** ready a unit, gear or legend {{c:sys:ready-unit}}; enters ready {{c:sys:enters-ready}}; exhaust as an effect {{c:sys:exhaust-effect}}; abilities with an exhaust cost {{c:sys:exhaust-cost-ability}}.
- **Examples (ready):**
{{ex:sys:ready-unit|On the Hunt|Simian Ancestor|Piltover Enforcer}}
- **Examples (enters ready):**
{{ex:sys:enters-ready|Eager Drakehound|Confront|The Exile}}
- **Examples (exhaust-cost abilities):**
{{ex:sys:exhaust-cost-ability|Heart of Dark Ice|Arena Kingpin|Unforgiven}}
- **Deck-building meaning (HEURISTIC):** a ready is an extra action: a second move (attack two battlefields, or attack and retreat) or a second use of an `[E]` ability. Role `tempo_ready`. Exhausting an enemy unit does **not** stop it defending; it stops it moving on its controller's turn only if done after their Awaken Phase. Legends are mostly `[E]` engines (DATA: 28 of 58 legends have an exhaust-cost ability), so "ready your legend" doubles the legend.
- **Modes:** no rule difference.

### 4.9 Scoring: Conquer, Hold, the final point, winning (CR 193-194, 469-474)
- **FACT (CR 471):** **Conquer** = gain control of a battlefield you have not scored this turn. **Hold** = keep control of a battlefield during your Beginning Phase Scoring Step. Each battlefield scores at most once per player per turn (CR 472). Each score gives up to 1 point and triggers Conquer or Hold effects there (CR 473).
- **FACT (CR 473.1.b):** the final point: when a Conquer would give a point and you are 1 point from the Victory Score (or above), you get it only if you have "Scored every Battlefield this turn"; otherwise you draw a card. Points from Hold and from card effects are not restricted (473.1.a.1).
- **FACT (CR 474, 323.1):** you win at a cleanup with points ≥ Victory Score and more than every opponent. Victory Score 8 (CR 194.3), 11 for a 2v2 team (CR 491.3).
- **FACT (CR 470.2):** on cards, "Score N points" means gaining points, not the scoring process.
- **FACT (CR 383.4.c.2.c, 383.4.d.2.c):** Conquer and Hold effects still trigger if the point itself is replaced or prevented.
- **Pool:** conquer text {{c:sys:conquer}}; hold text {{c:sys:hold}}; points from card text {{c:sys:score-points}}; text naming the Victory Score {{c:sys:victory-score}}; alternative win or win-threshold text {{c:sys:win-game}}; extra turn {{c:sys:extra-turn}}.
- **Examples (conquer):**
{{ex:sys:conquer|Plundering Poro|Zaun Warrens|Might of Demacia, Starter}}
- **Examples (hold):**
{{ex:sys:hold|Ahri, Alluring|Grove of the God-Willow|Gloomist}}
- **Examples (points from text):**
{{ex:sys:score-points|Yasuo, Windrider|Bottled Constellation|Draven, Audacious}}
- **Examples (win text):**
{{ex:sys:win-game|Gutter Palace|The Grand Plaza|Aspirant's Climb}}
- **Deck-building meaning (HEURISTIC):** two score engines with opposite needs. Conquer decks want ready attackers, movement, Assault, removal of defenders; Hold decks want Shield, Tank, Deflect, cheap bodies at several battlefields. The last point is the hard one: an aggro deck must conquer **all** battlefields in one turn, so it needs either a hold, or a card that says "score 1 point", to close. A tool should count a deck's "closers": hold-capable defenders plus text points. Details and win routes are in `wincons.md`.
- **Modes:** 1v1: 2 battlefields, so "score every battlefield" = both. FFA: 3 battlefields and Victory Score 8, the final Conquer point needs all three in one turn, which makes Hold and text points the realistic closers. 2v2: Victory Score 11 shared (CR 491.8.d), a battlefield scores once per **team** per turn (CR 491.8.b), battlefields the teammate held at the start of the turn are excepted from the final-point requirement (CR 491.8.g.1). "When you or an ally hold" text exists for this mode ({{n:sys:ally-ref}} names).

### 4.10 Might, +Might, -Might, Mighty (CR 143.2, 706-711, 433, 434)
- **FACT (CR 143.2.a):** printed Might, base Might (trait) and effective Might (after all modifiers; what cards call "Might"). Might below 0 is treated as 0 for references and combat sums (143.2.c). "to a minimum of 1 [Might]" on a card is card text, not a rule.
- **FACT (CR 708, 709):** Mighty = Might 5 or more; "becomes Mighty" is the crossing event.
- **Pool:** +Might text {{c:sys:might-plus}}; -Might text {{c:sys:might-minus}}; Mighty text {{c:sys:mighty}}; double {{c:sys:double}}.
- **Examples (+Might):**
{{ex:sys:might-plus|Soul Shepherd|Raucous Anthem|Heart of Dark Ice}}
- **Examples (-Might):**
{{ex:sys:might-minus|Moonlight Affliction|Orb of Regret|Nine-Tailed Fox}}
- **Examples (Mighty):**
{{ex:sys:mighty|Fiora, Victorious|Kadregrin the Infernal|Relentless Storm}}
- **Deck-building meaning (HEURISTIC):** "+N this turn" on a spell is a `combat_trick` (both more damage dealt and more damage needed to die); a static "+N" is an anthem. "-N this turn" is both a trick and removal together with damage, because lethal is checked against current Might (CR 142.4.b example with Frigid Touch). Mighty payoffs need a count of units that reach 5: printed 5+ ({{pool:mightyUnits}} units in the pool) or 4-Might units plus a buff or Equipment.
- **Modes:** no rule difference. 2v2: "friendly units" anthems cover the teammate's units (CR 740.1.a); "your units" text does not.

### 4.11 Buffs (CR 427, 701-705)
- **FACT:** a Buff is a counter worth +1 Might (CR 703); a unit can have only one (CR 702.3); buffing a buffed unit does nothing and does not count as buffing (CR 427.1.c); buffs can be spent by the unit's controller (CR 702.2.b.2); buffs leave when the unit leaves play (CR 705). Counters are not targeted (CR 742.1).
- **Pool:** buff text {{c:sys:buff}}; spend-a-buff text {{c:sys:buff-spend}}.
- **Examples (buff):**
{{ex:sys:buff|Simian Ancestor|Blind Monk|Monastery of Hirana}}
- **Examples (spend):**
{{ex:sys:buff-spend|Albus Ferros|Sett, Brawler|Wallop}}
- **Deck-building meaning (HEURISTIC):** because of the one-buff cap, buff sources beyond the number of units are wasted unless the deck spends buffs. So the axis has two halves: sources (`buff`) and sinks ("spend a buff", "when you buff"). Go-wide boards use sources best. Answered by anything that removes the unit from the board.
- **Modes:** 2v2: "Buff a friendly unit" may be put on a teammate's unit, but only the unit's controller can spend it (CR 702.2.b.2).

### 4.12 Stun (CR 424)
- **FACT:** stunned is a status; a stunned unit contributes no Might to combat damage (424.1.b) but still needs full damage to die (424.1.c); a stunned unit cannot be stunned again, so "when you stun" does not trigger on it (424.1.a.1); the status ends in the end-of-turn cleanup (424.1.a.2). Stun does not exhaust and does not prevent moving.
- **Reminder as printed:** "(It doesn't deal combat damage this turn.)"
- **Pool:** {{c:sys:stun}}
- **Examples:**
{{ex:sys:stun|Rune Prison|Solari Shieldbearer|Eclipse Herald}}
- **Deck-building meaning (HEURISTIC):** role `stun` = one-turn combat removal: on attack it lets your units take no damage from that defender; on defence it removes an attacker's damage. Works on any Might, so it scales against big units, and it is weak against wide boards. Payoffs name "stunned" units (Solari Shrine OGN-072, Monch UNL-035, Leona, Zealot OGN-079). Stunning chooses a unit, so Deflect taxes it.
- **Modes:** lasts only the current turn in every mode; no difference.

### 4.13 Leaving the board: kill, die, banish, recycle, discard, burn, return to hand, trash
| Word | Rule | From / to | Triggers Deathknell and "dies"? | Card can be reused by its owner? |
|---|---|---|---|---|
| Kill (instruction or cost) | CR 429.1.a.1 | board to owner's trash | yes (CR 808.1.d) | yes, via trash recursion |
| Lethal damage ("dies") | CR 323.4, 429.1.a.2 | board to trash, in a cleanup | yes | yes |
| Banish | CR 428, 108.6 | any zone to Banishment | no ("not a subset of Kill", 428.2.a) | only by the effect that banished it (428.3) |
| Recycle | CR 417 | named zone to bottom of the Main Deck (runes: Rune Deck) | no | yes, by drawing it again |
| Discard | CR 423 | hand to trash | no (it was never on the board) | yes, via trash recursion |
| Burn | CR 441 | top of Main Deck to trash | no | yes, via trash recursion |
| Return to hand | card text only; not in the CR 413 action list | board (or trash) to owner's hand | no (HEURISTIC: it is not a kill) | yes, replay |
| Recall | CR 456-460 | board to its controller's base | no, stays on the board | - |
| Counter | CR 426 | chain to trash | no | yes, via trash recursion |
| Token leaves the board | CR 186.1 | ceases to exist | a killed token still triggers its Deathknell (Bomb, CR 187.12) | no |

- **FACT (CR 124.1):** an object that changes to or from a non-board zone becomes a new object: damage, counters (buffs), granted keywords and statuses are gone. **FACT (CR 719.5):** attached Equipment stays on the board.
- **FACT (CR 108.2.d, 108.6.e):** trash and Banishment are public.
- **Pool:** kill {{c:sys:kill}}; kill your own permanent {{c:sys:kill-own}}; dies / would die {{c:sys:dies-trigger}}; banish {{c:sys:banish}}; recycle {{c:sys:recycle}}; discard {{c:sys:discard}}; burn {{c:sys:burn}}; trash named {{c:sys:trash-ref}}.
- **Examples (kill):**
{{ex:sys:kill|Vengeance|Harnessed Dragon|Thermo Beam}}
- **Examples (kill your own):**
{{ex:sys:kill-own|Cruel Patron|Deathgrip|Poro Snax}}
- **Examples (dies / would die):**
{{ex:sys:dies-trigger|Vicious Snapjaws|Zhonya's Hourglass|Smite}}
- **Examples (banish):**
{{ex:sys:banish|Smite|Ravenbloom Prefect|Burn Away}}
- **Examples (recycle):**
{{ex:sys:recycle|Garbage Grabber|Divine Judgment|Sigil of the Storm}}
- **Examples (discard):**
{{ex:sys:discard|Traveling Merchant|Invert Timelines|Scrapheap}}
- **Examples (burn):**
{{ex:sys:burn|Blade Twirler|Kennen, Storm of Shuriken|Shadow Temple}}
- **Deck-building meaning (HEURISTIC):** removal quality order against a recursion or Deathknell deck: banish > recycle > return to hand > kill > damage. Against tokens, buffs and Equipment carriers, return to hand is as good as a kill. "Kill a friendly unit" is a cost that Deathknell and Temporary units pay for free. "Recycle N from your trash" costs (Garbage Grabber OGN-099) both feed the deck against Burn Out and shrink your own trash, so they conflict with trash payoffs.
- **Modes:** FFA: "each opponent must kill one of their units" style text (Shard of Undoing UNL-174) scales with opponents; single-target removal does not, which shifts value toward sweepers and toward letting opponents trade with each other. Burn Out (CR 432.2.c) lets the burned-out player **choose** which opponent gets the point.

### 4.14 Hidden cards and the Facedown Zone (CR 107.3, 422, 811)
See 2.7 for the keyword. Additional FACTs: each battlefield has a Facedown Zone with "a maximum occupancy of one card" that card text can raise (CR 107.3.b.1); only the battlefield's controller may have a card there (107.3.c); the card's face is private to its controller (107.3.f); a facedown card that changes zones is revealed (CR 422.4).
- **Pool:** facedown / hide / "[Hidden]" named in rules text {{c:sys:facedown}} (includes the cards that own the keyword).
- **Examples (payoffs and answers):**
{{ex:sys:facedown|Noxus Saboteur|Bandle Tree|Agony's Embrace}}
- **Deck-building meaning (HEURISTIC):** count of facedown slots = battlefields you control (+ text). A deck with many Hidden cards but few ways to keep a battlefield cannot use them; rate Hidden density against hold strength.
- **Modes:** see 2.7.

### 4.15 Tokens (CR 179-187)
- **FACT:** tokens are not cards (CR 185); they exist only on the board or the chain (CR 186); cost counts as 0 (185.3.a.1); no domain (185.3.b). Defined tokens (CR 187.1-187.12): 1-Might Recruit; 3-Might Sprite with Temporary (tag Fae); 2-Might Sand Soldier; 3-Might Mech; Gold gear; 0-Might Reflection; 1-Might Bird with Deflect; Brush battlefield; Baron Pit battlefield; 1-Might Tentacle; 0-Might Shadow Clone; Bomb gear with "[Deploy]" and "[Deathknell][>] Deal 2 to an enemy unit here and kill all other Bombs you control here."
- **FACT (CR 440.2.c):** "Play a … token" plays it (it uses the chain and counts as playing a unit for triggers that say so); a unit token enters exhausted unless the effect says "ready".
- **Pool:** any token text {{c:sys:token}}; unit tokens {{c:sys:token-unit}}; by type: Recruit {{n:sys:token-recruit}}, Mech {{n:sys:token-mech}}, Sprite {{n:sys:token-sprite}}, Bird {{n:sys:token-bird}}, Sand Soldier {{n:sys:token-sand-soldier}}, Reflection {{n:sys:token-reflection}}, Shadow Clone {{n:sys:token-shadow-clone}}, Tentacle {{n:sys:token-tentacle}}, Bomb {{n:sys:token-bomb}}, Gold {{n:sys:gold}}.
- **Examples (unit tokens):**
{{ex:sys:token-unit|Industrious Mechsmith|Vanguard Armory|Herald of the Arcane}}
- **Examples (token payoffs):**
{{ex:sys:token|Renata Glasc, Industrialist|Soul Shepherd|Zilean, Time Mage}}
- **Examples (Bomb):**
{{ex:sys:token-bomb|Amateur Demolitionist|Explosimian|Hexplosive Minefield}}
- **Deck-building meaning (HEURISTIC):** role `token_maker`: bodies without spending cards. Bodies matter for summed combat Might, for occupying several battlefields, for "kill a friendly unit" costs and for one-buff-per-unit sources. Tokens are not "cards" (CR 052 and 185), so they do not satisfy Legion or "when you play a card". Weak to sweepers and to bounce.
- **Modes:** FFA and 2v2 have a third battlefield to occupy, which favours go-wide boards.

### 4.16 Gear, Equipment and attachment (CR 147-152, 435-436, 716-725, 818-821)
- **FACT:** gear is played to base (CR 148.1.a.1), enters ready (149.1), and is recalled to base if it is unattached at a battlefield (149.3) unless it has Deploy (2.26). Equipment = gear with the Equipment tag; it has Effect Text and a Might Bonus (CR 150.2) that apply only while attached (CR 718.2-718.4, 724). Only non-units can be attached (718.6); an attached card that becomes a unit detaches (718.6.a). Attached cards keep their own controller and status (718.5.e, 719.4). When the carrier leaves the board the Equipment detaches and stays (719.5).
- **Pool:** gear named in text {{c:sys:gear-ref}}; attach / equipped / detach text {{c:sys:attach}}; "Equipment" named {{c:sys:equipment-ref}}; gear or Equipment that becomes a unit {{c:sys:becomes-unit}}.
- **Examples (gear-matters):**
{{ex:sys:gear-ref|Pit Crew|Detonate|Exemplar of Demacia}}
- **Examples (attach payoffs):**
{{ex:sys:attach|Strike Down|Grandmaster at Arms|Aphelios, Exalted}}
- **Deck-building meaning (HEURISTIC):** gear is the card type that combat cannot remove; only "kill a gear" / "banish … gear" text can (role `hate_gear`). Equipment is a buff that survives its carrier. For Equipment the parser must read **three** fields: rules text (cost to equip, play effects), Effect Text (what the carrier gains, including keywords such as Tank or Hunt) and Might Bonus.
- **Modes:** no rule difference.

### 4.17 Playing from the trash and other recursion (CR 420.1.a, 829)
- **FACT (CR 420.1.a):** "By default, a player can only Play cards from their hand or their Chosen Champion zone." Everything else needs card text: Flow (2.25), "play … from your trash", "return … from your trash to your hand".
- **FACT (CR 108.3):** the Chosen Champion starts in the Champion Zone and can be played from there like a card in hand, so every deck has one guaranteed unit.
- **Pool:** play from trash (including Flow) {{c:sys:play-from-trash}}; return from trash to hand {{c:sys:return-from-trash}}.
- **Examples (play from trash):**
{{ex:sys:play-from-trash|Spectral Matron|Immortal Phoenix|Kai'Sa, Evolutionary}}
- **Examples (return to hand):**
{{ex:sys:return-from-trash|Cemetery Attendant|Morbid Return|Guardian of the Passage}}
- **Deck-building meaning (HEURISTIC):** role `recursion`. Enablers fill the trash (discard, Burn, self-kill); payoffs read it. The answer side is `hate_trash`: banish or recycle cards from a trash. A tool must read the type filter ("a unit", "a spell", "a gear", cost limits) to know which deck cards a recursion card can hit.
- **Modes:** some text reaches "any trash" or an opponent's trash; with more opponents there are more trashes to use (HEURISTIC).

### 4.18 Counter, new choices, "can't be countered" (CR 426, 750-755)
- **FACT (CR 426.1):** a countered card or ability "does nothing and is cleared from the chain", goes to the trash, is "not considered to have been played" for play triggers, and its costs are not refunded.
- **FACT (CR 751-755):** "make new choices" lets a player re-choose targets, modes, destinations and play locations of a finalized chain item; new Deflect costs caused by the new targets are ignored (755).
- **Pool:** counter text {{c:sys:counter-spell}}; gain control of a spell / new choices {{c:sys:new-choices}}; "can't be countered" {{c:sys:cant-be-countered}}.
- **Examples (counter):**
{{ex:sys:counter-spell|Wind Wall|Defy|Not So Fast}}
- **Examples (redirect):**
{{ex:sys:new-choices|Mystic Reversal|Rebuttal}}
- **Deck-building meaning (HEURISTIC):** role `counterspell`. DATA: all {{n:sys:counter-spell}} counter cards are spells with Reaction and each names what it can hit ("a spell", "a spell that costs no more than [4] and no more than [Rainbow]", "an enemy spell or ability that chooses a friendly unit or gear"); the condition must be parsed, using printed costs (CR 206). Units and gear resolve as they are finalized (CR 337.2), so a "Counter a spell" card never stops a permanent; it can stop the spell-speed payload of an opponent's deck only.
- **Modes:** FFA: one counterspell protects against one of several opponents; its relative value drops, while being the third player who can counter gives table influence. 2v2: a teammate can counter for you.

### 4.19 Copy and control change (CR 446, 475-482, 190.3.a.2)
- **FACT (CR 446):** copying replaces or adds the copyable traits of another object (applied in the Copy Effects layer); an object **created as** a copy has those traits as its own printed ones (446.3). **FACT (CR 185.3.a.2):** a Reflection token that copies a unit gets that unit's cost.
- **FACT (CR 190.3.a.2):** a unit that changes controller at a battlefield applies Contested there.
- **Pool:** copy {{c:sys:copy}}; take control of a unit or spell {{c:sys:take-control}}.
- **Examples (copy):**
{{ex:sys:copy|Mirror Image|Shady Spectacles|Zilean, Time Mage}}
- **Examples (control):**
{{ex:sys:take-control|Possession|Hostile Takeover|Conscription}}
- **Deck-building meaning (HEURISTIC):** role `clone`: value = the best unit on the board (yours or, for some cards, anyone's). Clones repeat play effects only if the copy is **played**, not if a token on the board "becomes a copy". Control change is removal plus a body.
- **Modes:** FFA: more boards to copy from or steal from.

### 4.20 XP and Level (CR 728-733, 823, 824)
- **FACT:** XP is a per-player number, public (CR 729.2), gained and spent (CR 730), not a game object (CR 731), unlimited (CR 733), "not shared between Allies" (CR 732). Hunt gains it (2.19); Level reads it (2.20); "Spend N XP" is a cost.
- **Pool:** XP named {{c:sys:xp}}; XP gain (including Hunt) {{c:sys:xp-gain}}; XP spend {{c:sys:xp-spend}}.
- **Examples (gain):**
{{ex:sys:xp-gain|Demacian Diplomat|Keeper of the Hammer|Gardens of Becoming}}
- **Examples (spend):**
{{ex:sys:xp-spend|Blood Rose|Megatusk|Kha'Zix, Evolving Hunter}}
- **Deck-building meaning (HEURISTIC):** a closed sub-economy introduced in Unleashed (DATA: every Hunt and Level card has first set UNL). Rate a deck by XP per turn and by its highest threshold; below roughly 3 XP sources the Level cards are blank text.
- **Modes:** 2v2: each player tracks their own XP.

### 4.21 Choosing (targeting), "can't be chosen", "pick" (CR 355.5-355.9, 383.4.b, 756-758)
- **FACT (CR 355.7):** when a card **chooses** specific objects they are targeted; when it **picks** them they are not. "Kill all gear" chooses nothing (355.5.a).
- **FACT (CR 757-758):** "can't be chosen by enemy spells and abilities" makes the object an illegal target; if it becomes untargetable after being targeted the effect mistargets (758.1).
- **FACT (CR 383.4.b):** "When you choose me / a friendly unit" abilities trigger on targeting.
- **Pool:** "can't be chosen" {{c:sys:untargetable}}; "when you choose" triggers {{c:sys:choose-trigger}}.
- **Examples (can't be chosen):**
{{ex:sys:untargetable|Ruin Runner|Akali, Silent|Twilight Shroud}}
- **Examples (choose triggers):**
{{ex:sys:choose-trigger|Jae Medarda|Spirit Wheel|Blade Dancer}}
- **Deck-building meaning (HEURISTIC):** removal has a "chooses" flag. Targeted removal is stopped by "can't be chosen" and taxed by Deflect; sweepers ("all", "each") and combat are not. A deck built around one protected unit forces the opponent to have sweepers or bigger combat. "When you choose a friendly unit" payoffs want cheap targeted spells of your own.
- **Modes:** "enemy" = controlled by an opponent (CR 740.1.b). 2v2: a teammate's spells are friendly and can choose your protected unit.

### 4.22 What Radiance added (PN-RAD, CR 2026-10-09)
- **FACT:** three keywords: Deploy (CR 830), Disarm (CR 831), Show Off (CR 832); one token: Bomb (CR 187.12); the word "pick" for non-target choices (CR 355.7); the Copy game action (CR 446); "additional deckbuilding choices" (CR 103.1, used by Neeko, Blending In RAD-167); "No Domain" cards allowed in any deck (CR 103.2.b.5); non-Champion legends added to the Legend Zone by effects (CR 107.4.d.1); multiple Empowered statuses (CR 442.1.c.1, 827.1.c.5).
- **FACT (OV-RAD, CR 718.6.a):** "Equipment Units": the legend Lady of Clockwork RAD-145 turns a gear into a unit; an attached Equipment that becomes a unit detaches. A non-unit Deploy gear that becomes a unit can move like a unit (PN-RAD ruling).
- **DATA (GAL, first set RAD):** {{pool:byFirstSet}} names by first set; the RAD keywords' pool sizes are in 2.26-2.28.
- **Examples (legend-related text):**
{{ex:sys:legend-ref|Neeko, Blending In|Heartening Soul|Royal Entourage}}
- **Examples (gear becomes a unit):**
{{ex:sys:becomes-unit|Lady of Clockwork}}

### 4.23 Additional turns (CR 734-738)
- **FACT (CR 735, 737):** "take a turn after this" inserts one extra turn for that player without changing turn order.
- **Pool:** {{c:sys:extra-turn}}
- **Example:**
{{ex:sys:extra-turn|Time Warp}}
- **Deck-building meaning (HEURISTIC):** an extra turn is an extra Hold step, 2 runes, 1 card and a full Main Phase; in multiplayer it also skips two or three opposing turns' worth of responses to your board.

## 5. Mode rules that change what mechanics are worth

All rows FACT from the cited rule; the last column is HEURISTIC.

| Rule difference | 1v1 (CR 487, 488) | FFA3 / FFA4 (CR 489, 490) | 2v2 (CR 491) | Mechanics whose value changes |
|---|---|---|---|---|
| Battlefields on board | 2 | 3 | 3 | Ganking, movement, tokens/go-wide (more places to be), Deploy (more places to put it), Hidden slots |
| Victory Score | 8 | 8 | 11, shared (491.3, 491.8.d) | text points and Hold triggers are a smaller share of 11 than of 8 |
| Final Conquer point needs every battlefield scored this turn (473.1.b) | both | all three | all three, except those the ally occupied at the Scoring Step (491.8.g.1) | Conquer-only decks close worse outside 1v1; Hold effects and "score 1 point" text gain |
| Opponents | 1 | 2 or 3 | 2 | "each opponent" / "opponents" text ({{n:sys:each-opponent}} names) scales; "an opponent" / "choose an opponent" text ({{n:sys:an-opponent}} names) does not; "each player" text ({{n:sys:each-player}} names) hits more boards |
| Who may fight | the two players | exactly two players per combat; third parties cannot enter a staged or ongoing combat (449.2.a, 464) | same; teammates cannot enter each other's battlefields (449.2.b) | Shield/Tank defenders face more attackers per round; Ambush only where you have units |
| "Friendly" (740.1.a, 491.8.e) | your objects | your objects | yours and your teammate's | "friendly unit(s)" buffs, readies, protection and Show Off picks reach the teammate ({{n:sys:friendly-ref}} names say "friendly"); "you control"/"your" text does not |
| Scoring per battlefield per turn | once per player (472) | once per player | once per team (491.8.b) | two players of one team cannot both score the same battlefield in a round of their turns |
| Acting on another player's turn | Action in showdowns, Reaction any time | same, for all players in turn order | plus any card by invitation on the teammate's turn (491.8.a) | slow spells and units become more flexible in 2v2 |
| XP | own | own | not shared (732) | Hunt/Level need per-player density |
| Hide | at battlefields you control | same | not at the teammate's battlefields (491.8.c.1) | Hidden |
| First turn | second player +1 rune | first player skips first draw, last player +1 rune | same as FFA | ramp matters slightly less for the last player |
| Temporary / "until your next turn" bodies | die after 1 opposing turn | after 2 or 3 opposing turns | after 3 other turns | Temporary tokens block or threaten longer |
| Burn Out (432.2.c) | the opponent gets the point | you choose which opponent | point goes to the opposing team | self-mill is slightly safer in FFA (give the point to the player furthest behind) |

DATA: only {{n:sys:ally-ref}} names use the word "ally"/"allies" ({{c:sys:ally-ref}}): text written for 2v2 is rare, so mode value comes almost entirely from the rules above, not from card text.
- **Examples ("ally" wording):**
{{ex:sys:ally-ref|Gloomist|Right of Conquest|Seat of Power}}
- **Examples ("each opponent" wording):**
{{ex:sys:each-opponent|Shard of Undoing|Brynhir Thundersong|Cataclysm}}

## 6. Detection table: mechanic -> detection rule -> role / axis

### 6.1 How to derive the keyword field
GAL has no structured keyword field; L-CARDS has one but lacks Radiance and has the 7 differences listed in section 0. Derive `keywords[]` from text:
1. Normalise: `[Rainbow]` = `[A]`; domain names in brackets = Power of that domain; `[Exhaust]` = `[E]`; `[Might]` = `[M]`; dash or `[>]` after a keyword both mean "keyword ability follows".
2. Remove reminder text: delete every `( … )` group (CR 135.2.d.3). Do this **before** keyword detection; reminder text names keywords the card lacks (e.g. Mystic Vortex's "(Hidden cards have [Reaction].)").
3. Split into lines (abilities). A keyword is **owned** if the bracketed keyword heads a line, possibly after other keyword heads on the same line (`[Assault 2], [Shield 2]`; `[Level 11][>>][Legion][>]`). Also accept the four unbracketed line-initial spellings listed in section 0.
4. Read the parameter: a number inside the bracket for Assault, Deflect, Shield, Hunt, Disarm (missing = 1) and Level (threshold, always present); a **cost** after the bracket for Equip, Repeat, Flow, Empower (resource symbols, or text after a dash such as "Discard 1", "Spend 1 XP", "[1] or [Body]"); an **object description** after `[Show Off]`; the **dependent ability** after `[>]` for Legion, Level, Empowered, Deathknell.
5. For Equipment, run steps 2-4 separately on the Effect Text: keywords found there are **granted to the carrier**, not owned by the gear (e.g. Hexdrinker gives Deflect, Protector's Shield gives Tank, Hunter's Machete gives Hunt).
6. Any other bracketed occurrence is a **reference**; classify by the words around it: "have/has/gain/give … [K]" = grant (to whom: "me" = conditional self, "friendly units", "a unit", "your Mechs"); "with [K]" / "ignore [K]" / "[K] costs" = filter, hate or support.
7. Dependent keywords (Legion, Level, Empowered) make the following ability conditional: store the ability with its condition; do not count its inner keywords as unconditional (e.g. Baccai Sandspinner has Deflect and Assault 2 only while Empowered).

### 6.2 Table
Regexes are JavaScript/Python compatible, case-insensitive, and run on reminder-stripped text. "own / any" = names that own the keyword / names that mention it at all (DATA, n = {{pool:counted}}). Role ids follow `analysis/roles.mjs`, axis names follow `analysis/axes.mjs` (E = enabler side, P = payoff side). The role column says what the mechanic **usually** gives; rows marked with two roles need the direction words (friendly / enemy / me) to decide. HEURISTIC throughout, except the counts.

{{detect_table}}

### 6.3 Known limits of these detectors (DATA, checked by reading matches)
- Text regexes find **mentions**. Direction (your unit or an enemy unit), scope (one target or all) and timing (play effect, attack trigger, static) need the structured parser (`analysis/card-text-parser/`), not this table.
- "Move" covers four different roles (4.7); "kill" covers removal and sacrifice costs; "banish" covers removal, self-exile after use (Time Warp) and blink (Portal Rescue); "discard" covers costs and hand attack.
- "Deal damage" misses damage phrased through Might ("They deal damage equal to their Mights to each other" is matched, "fights" does not exist in the pool).
- The gallery text of a few Radiance cards has formatting debris (e.g. Rousing Display RAD-127 ends "…instead.disa…"; choose-one bullets are concatenated without separators, as in Udyr, Wildman and Command: Attack). Detectors tolerate it; quotations in this file show the data as it is.

## 7. Unconfirmed and open points
1. **Excess damage** has no definition in CR 2026-10-09 (4.6). Six cards depend on it. Our definition is the ENGINE's and is HEURISTIC.
2. **"Return to hand"** is not a named game action in CR 413-446; its consequences (no Deathknell, buffs lost) follow from CR 124.1 and 808.1.d by inference.
3. **Exhaust-then-recycle of one rune in the same turn** (4.2) is an inference from CR 164.2; no explicit rule or ruling was found.
4. **Show Off picking a teammate's object in 2v2** (2.28) follows from the wording "friendly game objects" + CR 740.1.a; no ruling found.
5. **Exhausted units in combat** (4.8): CR has no rule removing them from combat, and the summed-Might rule has no ready condition; stated as FACT by absence, not by an explicit sentence.
6. **Reference classification** (grant / filter / self) in the "Other cards using it" lines is a regex heuristic and was not hand-audited card by card.
7. **Gallery data** for 19 Radiance names had a wrong or empty card type on 2026-11-11 and was corrected from alt text; re-fetch and re-run `pool.py` when the gallery is fixed. Radiance cards without an errata entry are quoted as printed.
8. Mode-value statements are HEURISTIC derivations from the mode rules; none is backed by match data here (see `meta-sources.md` and `deck-theory.md` for data).
