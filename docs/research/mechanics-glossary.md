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

**Pool (DATA, GAL + ERR):** 1103 distinct card names; 12 token entries and 6 basic runes are excluded from all counts, leaving **n = 1085** counted names: 550 units, 271 spells, 132 gear (953 Main Deck names), 58 legends, 74 battlefields. Counts are per distinct name, not per printing.

**How the counts are made (so they can be reproduced in the app):**
- Card text is the gallery's printed text; where an errata article gives a "[NEW TEXT]" that differs from the gallery, the errata text is used. Errata were applied to ["Arise!", "Astral Heron", "Ava Achiever", "Blood Rush", "Bone Skewer", "Clockwork Keeper", "Dark Child, Starter", "Dazzling Aurora", "Death from Below", "Deathgrip", "Deceiver", "Diana, Lunari", "Disintegrate", "Dragon's Rage, Lee Sin", "Draven, Vanquisher", "Edge of Night", "Elnuk Herd", "Emperor's Dais", "Fizz, Trickster", "Forbidden Technique", "Gangplank, Naval", "Guards!", "Highlander, Yi", "Janna, Savior", "Jax, Unmatched", "Karma, Channeler", "Kato the Arm", "Keeper of Masks", "Last Caress", "Mirror Image", "Neeko, Blending In", "Nocturne, Horrifying", "Pack of Wonders", "Portal Rescue", "Promising Future", "Rek'Sai, Swarm Queen", "Relentless Pursuit", "Rell, Magnetic", "Rengar, Trophy Hunter", "Resonating Strike", "Salvage", "Sigil of the Storm", "Stalking Wolf", "Targon's Peak", "Teemo, Strategist", "The Boss", "The Syren", "Tianna Crownguard", "Tideturner", "Unforgiven", "Unlicensed Armory", "Void Gate", "Void Rush", "Yone, Blademaster", "Zhonya's Hourglass"]. Example cards carrying errata text are marked "errata text".
- Equipment have a second text box (Effect Text, CR 136) and a Might Bonus (CR 137) stored in separate gallery fields. The pool appends the effect text as an extra line prefixed `Effect text (active only while attached, CR 136):`. That prefix is our annotation, not card text.
- Reminder text (everything in parentheses) is removed before any detector runs, because "The presence, absence, or exact wording of reminder text has no effect on game function" (FACT, CR 135.2.d.3) and reminder text mentions keywords the card does not have.
- A card **owns** a keyword when the bracketed keyword heads an ability line of its own text (e.g. a line starting `[Assault 2]`, or `[Level 6][>] ...`). A card **references** a keyword when the bracketed keyword appears anywhere else in its text (grants it, checks for it, taxes it). "any" = own + reference.
- DATA (cross-check): on the 909 names shared with L-CARDS, the "own" detector agrees with L-CARDS' hand-maintained `keywords` field for every keyword except 7 names: 5 where the field misses a keyword that is printed (Laurent Bladekeeper Ganking, Windsinger Hidden, Garen, Rugged Shield, Jagged Cutlass Equip, the Gold token's Reaction) and 2 where the field lists Empower although the card only uses "empower me" as a verb (Mournful Witness, Renekton, Brute).
- Gallery defects seen on 2026-11-11 (DATA): the structured card type was wrong or empty for 19 Radiance names and was corrected from the gallery's own image alt text (["RAD-007 gear->spell (gallery alt text)", "RAD-012 unit->gear (gallery alt text)", "RAD-016 spell->unit (gallery alt text)", "RAD-025 unit->spell (gallery alt text)", "RAD-033 gear->spell (gallery alt text)", "RAD-035 unit->gear (gallery alt text)", "RAD-039 unit->gear (gallery alt text)", "RAD-046 spell->gear (gallery alt text)", "RAD-056 gear->spell (gallery alt text)", "RAD-059 unit->spell (gallery alt text)", "RAD-064 spell->gear (gallery alt text)", "RAD-069 spell->gear (gallery alt text)", "RAD-072 spell->unit (gallery alt text)", "RAD-097 spell->unit (gallery alt text)", "RAD-101 gear->spell (gallery alt text)", "RAD-120 gear->unit (gallery alt text)", "RAD-124 gear->spell (gallery alt text)", "RAD-130 spell->unit (gallery alt text)", "RAD-131 spell->unit (gallery alt text)"]); four cards print a keyword without brackets (Laurent Bladekeeper "Ganking", Windsinger "Hidden", Nazuman Ntofo and Jagged Cutlass "Equip"), which the detector accepts at the start of a line.

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
- **Pool (DATA):** own it: **31** (unit 31 / spell 0 / gear 0 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **1**; total **32**. First set: OGN.
- **Examples:**
  - **Legion Rearguard** (OGN-010, unit · cost 2 · 2 Might): "[Accelerate] (You may pay [1][Fury] as an additional cost to have me enter ready.)"
  - **Kai'Sa, Survivor** (OGN-039, unit · cost 4 · 4 Might): "[Accelerate] (You may pay [1][Fury] as an additional cost to have me enter ready.) / When I conquer, draw 1."
  - **War Scout** (RAD-008, unit · cost 3 · 2 Might): "[Accelerate] (You may pay [1][Fury] as an additional cost to have me enter ready.) / When you play me, give a unit +2 [Might] this turn."
- **Deck-building meaning (HEURISTIC):** role `tempo_ready`; axis conquer triggers (enabler). A ready unit can use its Standard Move the turn it is played, so it converts Energy into an immediate attack or conquer. Real cost of the card = printed cost + 1 Energy + 1 Power (one recycled rune, section 4.2) when used as haste. Combos with conquer effects and with "when I attack" text; answered by cheap blockers, stun, and Reaction removal in the showdown it starts.
- **Modes:** 1v1: strongest, a ready attacker onto the single enemy-held battlefield is a point swing. FFA: three battlefields and more open ones, so ready units convert to conquers more often, but two opponents can answer. 2v2: same as 1v1, plus the teammate's battlefields are not valid move targets (CR 449.2.b), which narrows where the ready unit can go.

### 2.2 Action (CR 806)
- **Class (FACT, 806.1, 806.1.a):** Permissive keyword on cards, rune abilities, legend abilities or permanent abilities.
- **Definition (FACT, 806.1.c):** on cards "This can be played during showdowns on any player's turn."; on activated abilities "This can be activated during showdowns on any player's turn." It adds to the default timing, it does not restrict to showdowns (806.2). A unit with Action still may only be played to base or a controlled battlefield (806.3).
- **Reminder as printed:** "(Play on your turn or in showdowns.)"
- **Number:** none.
- **Zone / timing:** hand (or wherever the card may be played from) and board abilities; Neutral Open on your turn, plus Showdown Open on any turn when you have Focus (CR 313). Not during a chain.
- **Pool (DATA):** own it: **100** (unit 3 / spell 91 / gear 2 / legend 4 / battlefield 0); grant, condition on or reference it without owning it: **4**; total **104**. First set: OGN. Spells by speed (DATA): 91 Action-only, 71 Reaction, 109 neither.
- **Examples:**
  - **Hextech Ray** (OGN-009, spell · cost 1+1 power): "[Action] (Play on your turn or in showdowns.) / Deal 3 to a unit at a battlefield."
  - **Primal Strength** (OGN-154, spell · cost 4+1 power): "[Action] (Play on your turn or in showdowns.) / Give a unit +7 [Might] this turn."
  - **Divining Shells** (UNL-161, gear · cost 2): "[Vision] (When you play this, look at the top card of your Main Deck. You may recycle it.) / [Action][>] Kill this, [Exhaust]: Give a unit +2 [Might] this turn."
- **Deck-building meaning (HEURISTIC):** this is the `speed=action` field of a card, not a role by itself. An Action spell that changes Might or kills is a `combat_trick` / removal usable inside a combat; a spell with neither Action nor Reaction can never affect a combat that is already open. Axis: spell-slinging. Answered by Reaction spells (they resolve first, CR 159.2.b.3) and counterspells.
- **Modes:** 1v1: usable in every showdown you are part of. FFA: showdown Focus passes "to the next Player in Turn Order" (CR 347.1.b) and all players can act, so a third player can interfere in a combat they are not in. 2v2: same, and your Action spells can support the teammate's combat.

### 2.3 Assault (CR 807)
- **Class (FACT, 807.1, 807.1.a):** Passive Ability keyword on units.
- **Definition (FACT, 807.1.c):** "While I am an attacker, I have +X [M]."
- **Reminder as printed:** "(+1 [Might] while I'm an attacker.)", "(+2 [Might] while I'm an attacker.)".
- **Number (FACT, 807.1.b.3, 807.2):** X omitted = 1. Several sources are summed: Petty Officer (Assault) + Cleave ("Give a unit [Assault 3] this turn.") = Assault 4.
- **Zone / timing:** board, only while the unit holds the Attacker designation in a combat (CR 466.2.c). The attacker is the player whose units applied Contested to the battlefield (466.2.c.1).
- **Pool (DATA):** own it: **22** (unit 22 / spell 0 / gear 0 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **23**; total **45**. First set: OGN. Printed values on owners: 1 (no number): 10, 2: 9, 3: 2, 4: 1.
- **Other cards using it (HEURISTIC classification):** grant it (16): Baccai Reaper, Banner of Conquest, Blood Rush, Brawl, Captain Farron, Cleave, Gust Monk, …; gain it conditionally (6): Ambessa, Respected and Feared, Ancient Warmonger, Baccai Sandspinner, Raging Soul, Repair Specialist, Shadow Fiend; look for / tax / ignore it (1): Pride of Nazumah
- **Examples:**
  - **Daring Poro** (OGN-210, unit · cost 2 · 2 Might): "[Assault] (+1 [Might] while I'm an attacker.)"
  - **Laurent Duelist** (SFD-156, unit · cost 4 · 3 Might): "[Assault 2] (+2 [Might] while I'm an attacker.)"
  - **Cleave** (OGN-004, spell · cost 1): "[Action] (Play on your turn or in showdowns.) / Give a unit [Assault 3] this turn. (+3 [Might] while it's an attacker.)"
- **Deck-building meaning (HEURISTIC):** effective Might when attacking = Might + X, 0 extra when defending or holding. Role: combat stat for aggro; as a granted "this turn" effect it is a `combat_trick`. Axis attack (Assault) enabler, conquer triggers enabler. Combos with Accelerate/ready effects (attack the turn it lands), "when I attack" triggers, excess-damage payoffs (section 4.6). Answered by Shield/Tank defenders, -Might effects, stun (a stunned unit contributes no combat damage, CR 424.1.b).
- **Modes:** identical rules. FFA: more battlefields to attack, and attacking one opponent leaves you open to the other. 2v2: no change.

### 2.4 Deathknell (CR 808)
- **Class (FACT, 808.1, 808.1.a):** Triggered Ability keyword on permanents (units and gear).
- **Definition (FACT, 808.1.c):** "When I die, [Effect]." The trigger is "the Permanent being Killed and sent to the Trash" (808.1.d). If the death is replaced (e.g. by a recall) the trigger is removed (808.1.d.1).
- **Reminder as printed:** "(When I die, get the effect.)"
- **Number:** none. Several Deathknells on one permanent trigger separately (808.2).
- **Zone / timing:** triggers from the board at the moment of death; resolves on the chain (can be responded to with Reactions).
- **Pool (DATA):** own it: **25** (unit 23 / spell 0 / gear 2 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **6**; total **31**. First set: OGN.
- **Examples:**
  - **Watchful Sentry** (OGN-096, unit · cost 2 · 1 Might): "[Deathknell] — Draw 1. (When I die, get the effect.)"
  - **Ruined Rex** (UNL-067, unit · cost 6+1 power · 6 Might): "[Deathknell][>] Deal 4 to an enemy unit. (When I die, get the effect.)"
  - **Honest Broker** (SFD-155, unit · cost 2 · 2 Might): "[Deathknell] — Play a Gold gear token exhausted. (When I die, get the effect.)"
- **Deck-building meaning (HEURISTIC):** value that survives removal; the card is good fodder for "kill a friendly unit" costs. Axis deathknell / sacrifice (enabler). Combos with self-kill costs (e.g. Cruel Patron OGN-208 "As an additional cost to play me, kill a friendly unit."), Temporary, and "trigger again" text. **Not triggered** by banish (CR 428.2.a "Banish is not a subset of Kill"), by return to hand, or by recycle, so those are the answers (e.g. Smite UNL-007 "If it would die this turn, banish it instead."). Tokens also trigger it (the Bomb token is a Deathknell gear, CR 187.12).
- **Modes:** 1v1 and 2v2 the same. FFA: "an enemy unit" / "an opponent" Deathknells let you choose which opponent to hit; combat happens more often between other players, so your units die less on other players' turns.

### 2.5 Deflect (CR 809)
- **Class (FACT, 809.1, 809.1.a):** Passive Ability keyword, normally on permanents.
- **Definition (FACT, 809.1.c):** "Spells and abilities an opponent controls that target [me/this] cost an amount of Power equal to [Deflect Value] more to play as an additional cost for each time they choose [me/this]." The Power may be of any domain (809.1.c.1). It is a Mandatory Additional Cost (809.1.d, CR 356.2.a.2).
- **Reminder as printed:** "(Opponents must pay [Rainbow] to choose me with a spell or ability.)"; Deflect 2: "[Rainbow][Rainbow]".
- **Number (FACT, 809.1.b.3, 809.2):** X omitted = 1; sources are summed.
- **Zone / timing:** board; applies when an opponent's spell or ability **targets** the object (chooses it). Effects that do not choose ("Kill all gear", "Deal 3 to all units in bases") ignore it (CR 355.5.a). Some cards say "Ignore Deflect" (CR 765-767).
- **Pool (DATA):** own it: **28** (unit 28 / spell 0 / gear 0 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **24**; total **52**. First set: OGN. Printed values on owners: 1 (no number): 24, 2: 4. Tokens that have it (not counted): Bird.
- **Other cards using it (HEURISTIC classification):** grant it (6): Breakneck Mech, Hexdrinker, Jayce, Hammer in Hand, Petricite Monument, Spirit's Refuge, Watchful Curator; gain it conditionally (9): Baccai Sandspinner, Fiora, Victorious, Grumpy Rockbear, Kayle, Justified, Master Yi, Tempered, Mosstomper, Renekton, Brute, …; look for / tax / ignore it (9): Carrion Dredger, Decree of Insight, Flurry of Feathers, Frisky Hunter, Gutter Palace, Heisho, Shell of the World, Hunting Dog, …
- **Examples:**
  - **Pouty Poro** (OGN-013, unit · cost 2 · 2 Might): "[Deflect] (Opponents must pay [Rainbow] to choose me with a spell or ability.)"
  - **Sivir, Ambitious** (SFD-120, unit · cost 6+3 power · 7 Might): "[Deflect 2] (Opponents must pay [Rainbow][Rainbow] to choose me with a spell or Ability.) / When I conquer after an attack, if you assigned 5 or more excess damage to enemy units, you may deal that much to an enemy unit."
  - **Petricite Monument** (SFD-104, gear · cost 2): "[Temporary] (Kill this at the start of its controller's Beginning Phase, before scoring.) / Friendly units have [Deflect]. (Opponents must pay [Rainbow] to choose them with a spell or ability.)"
- **Deck-building meaning (HEURISTIC):** role `protection`. Each Power an opponent pays is normally one of their runes recycled (section 4.2), so Deflect taxes tempo, not only resources. Axis deflect / being chosen (enabler), hold triggers (enabler). Best on units that must survive to score (hold effects, win conditions). Answered by untargeted sweepers, combat, and "ignore Deflect" text.
- **Modes:** 1v1: taxes the one opponent. FFA: taxes every opponent separately, value rises with the number of opponents holding targeted removal. 2v2: "Friendly units have [Deflect]" style grants reach the teammate's units too, because friendly includes a teammate's objects (CR 740.1.a, 491.8.e).

### 2.6 Ganking (CR 810)
- **Class (FACT, 810.1, 810.1.a):** Passive Ability keyword on units.
- **Definition (FACT, 810.1.b):** "I may move to a battlefield from another battlefield with a standard move." It adds an option to the Standard Move and gives no extra moves (810.1.c.3).
- **Reminder as printed:** "(I can move from battlefield to battlefield.)"
- **Number:** none.
- **Zone / timing:** board; the Standard Move is a Discretionary Action in your Main Phase, not in a Closed state and not during a showdown or combat, and it exhausts the unit (CR 144.1, 144.2). Without Ganking a unit may only move base to battlefield or battlefield to base (144.4).
- **Pool (DATA):** own it: **18** (unit 17 / spell 0 / gear 1 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **25**; total **43**. First set: OGN.
- **Other cards using it (HEURISTIC classification):** grant it (14): Blade of the Exile, Boots of Swiftness, Bounty Hunter, Breakneck Mech, Demon Shade, Gem Jammer, Jayce, Hammer in Hand, …; gain it conditionally (11): Bilgewater Bully, Brutal Hunter, Fiora, Victorious, Gustwalker, Kayle, Justified, Kinkou Lifeblade, Master Yi, Tempered, …
- **Examples:**
  - **Yasuo, Windrider** (OGN-205, unit · cost 5+1 power · 4 Might): "[Ganking] (I can move from battlefield to battlefield.) / The third time I move in a turn, you score 1 point."
  - **Kayn, Unleashed** (OGN-189, unit · cost 6+1 power · 6 Might): "[Ganking] (I can move from battlefield to battlefield.) / If I have moved twice this turn, I don't take damage."
  - **Boots of Swiftness** (SFD-133, gear · cost 3 · +2 Might bonus): "[Equip] [Chaos] ([Chaos]: Attach this to a unit you control.) / Effect text (active only while attached, CR 136): [Ganking] (I can move from battlefield to battlefield.)"
- **Deck-building meaning (HEURISTIC):** role `movement`. Saves one turn and one ready-up when re-positioning (battlefield to battlefield directly instead of via base). Still needs the unit to be ready, so it pairs with ready effects ("Move a friendly unit and ready it", Ride the Wind OGN-173) and "when I move" triggers. Axis movement (enabler), conquer triggers (enabler). Answered by exhaust/stun effects and "can't move" text.
- **Modes:** 1v1: two battlefields, so Ganking only means "hop to the other one". FFA and 2v2: three battlefields on board (CR 489.4, 490.4, 491.4), so there are two possible destinations and the keyword is worth more; in 2v2 a teammate-occupied battlefield is not a valid destination (CR 449.2.b); in FFA a battlefield with a staged or ongoing combat between two other players is not either (CR 449.2.a).

### 2.7 Hidden (CR 811)
- **Class (FACT, 811.1, 811.1.a):** prerequisite for the Hide Discretionary Action; present on spells, units and gear.
- **Definition (FACT, 811.1.b):** "While this card is in your hand or in your Champion Zone on your turn during an Open State, you may pay [A] to hide this facedown at a battlefield you control that doesn't already have a facedown card hidden there for as long as you control that battlefield. Beginning on the next turn, this gains [Reaction] and you may play this, ignoring its base cost."
- **Reminder as printed:** "(Hide now for [Rainbow] to react with later for [0].)"
- **Number:** none.
- **Zone / timing (FACT):** hide from hand or Champion Zone, your turn, Open state, at a battlefield **you control**, one facedown card per battlefield (Facedown Zone occupancy 1, CR 107.3.b). Hiding does not open a chain (811.1.c.2); playing from facedown does (811.1.c.3). From the next turn it is a Reaction with base cost ignored (811.6). A hidden permanent must be played to that battlefield, including gear (811.1.d.1); targets of a hidden spell or of a hidden permanent's play effect must be at that battlefield unless that is impossible (811.1.d.2-.3). The card may instead be played normally for its cost (811.3). A facedown card is not "a card with Hidden" (811.5.a). Losing control of the battlefield sends the facedown card to its owner's trash in the next cleanup (CR 107.3.d, 323.6.a, 468.5.c).
- **Pool (DATA):** own it: **45** (unit 19 / spell 24 / gear 2 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **5**; total **50**. First set: OGN.
- **Examples:**
  - **Pakaa Cub** (OGN-135, unit · cost 3 · 3 Might): "[Hidden] (Hide now for [Rainbow] to react with later for [0].)"
  - **Block** (OGN-057, spell · cost 2): "[Hidden] (Hide now for [Rainbow] to react with later for [0].) / [Action] (Play on your turn or in showdowns.) / Give a unit [Shield 3] and [Tank] this turn. (+3 [Might] while it's a defender. It must be assigned combat damage first.)"
  - **Zhonya's Hourglass** (OGN-077, gear · cost 2 · **errata text** (origins errata)): "[Hidden] (Hide now for [A] to react with later for [0].) / If a friendly unit would die, kill this instead. Heal that unit, exhaust it, and recall it. (Send it to base. This isn't a move.)"
- **Deck-building meaning (HEURISTIC):** `speed=hidden`: pay 1 Power now, get the card later for free at Reaction speed. It shifts cost from the turn you need the effect to an earlier turn, and makes any holder of a battlefield threatening. Needs a controlled battlefield, so it rewards decks that hold. Axis hidden / facedown (enabler); payoffs read "when you play a card from face down" (e.g. Black Market Broker SFD-121, Evelynn, Consuming RAD-090, legend Agony's Embrace RAD-153) or add facedown slots (Bandle Tree OGN-278, Bushwhack Trap RAD-108). Answered by taking the battlefield (the card is trashed unseen), and by Mystic Vortex VEN-160 ("During showdowns here, cards with [Reaction] cost [Rainbow] more to play.").
- **Modes:** 1v1: full value. FFA: three battlefields but each player usually controls fewer, and two opponents can evict you. 2v2: "Players may not Hide cards at Battlefields controlled by their Teammate" (CR 491.8.c.1), so only your own battlefields count.

### 2.8 Legion (CR 812)
- **Class (FACT, 812.1):** Dependent Keyword.
- **Definition (FACT, 812.1.b.1):** "If you have played another card this turn, this card gains [Text]." The condition is met once a different card "has been Finalized by you on the same turn" (812.1.c); a countered card still counts (CR 420.4.b example).
- **Reminder as printed:** "(Get the effect if you've played another card this turn.)"
- **Number:** none.
- **Zone / timing:** wherever the dependent ability works: in hand for cost reductions ("[Legion] — I cost [2] less."), on play for play effects, on the board for static or activated text.
- **Pool (DATA):** own it: **8** (unit 7 / spell 1 / gear 0 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **2**; total **10**. First set: OGN.
- **Examples:**
  - **Noxus Hopeful** (OGN-012, unit · cost 4 · 4 Might): "[Legion] — I cost [2] less. (Get the effect if you've played another card this turn.)"
  - **Vanguard Captain** (OGN-218, unit · cost 3+1 power · 3 Might): "[Legion] — When you play me, play two 1 [Might] Recruit unit tokens here. (Get the effect if you've played another card this turn.)"
  - **Sun Disc** (OGN-021, gear · cost 2+1 power): "[Exhaust]: [Legion] — The next unit you play this turn enters ready. (Get the effect if you've played another card this turn.)"
- **Deck-building meaning (HEURISTIC):** sequencing payoff: the card wants a cheap card played first. Axis legion (second card): enablers are cards costing 0-1 Energy and free plays (hidden cards, tokens do not count as cards: "Tokens are not cards", CR 185). Curve consequence: a Legion deck needs a high count of 1-cost cards. No direct answer; it is weakest when the deck is top-decking one card per turn.
- **Modes:** no rule difference. In 2v2 only cards **you** played count ("Finalized by you", 812.1.c), not the teammate's.

### 2.9 Reaction (CR 813)
- **Class (FACT, 813.1, 813.1.a):** Permissive keyword on cards, rune abilities, legend abilities and permanent abilities.
- **Definition (FACT, 813.1.b, 813.1.c):** grants "all abilities and permissions of Action" and additionally "This can be played during Closed States on any player's turn." / "This can be activated during Closed States on any player's turn."
- **Reminder as printed:** "(Play any time, even before spells and abilities resolve.)"; on units "(…, including to a battlefield you control.)".
- **Number:** none.
- **Zone / timing:** any time you have priority, including while a chain exists; the newest item resolves first (CR 340.1), so a Reaction resolves before what it responds to (CR 159.2.b.3). Reaction abilities that Add resources can be used whenever a cost is being paid and cannot be responded to (CR 430.2, 430.3).
- **Pool (DATA):** own it: **81** (unit 4 / spell 71 / gear 3 / legend 3 / battlefield 0); grant, condition on or reference it without owning it: **16**; total **97**. First set: OGN. Tokens that have it (not counted): Gold.
- **Other cards using it (HEURISTIC classification):** grant it (15): Ancient Henge, Daughter of the Void, Energy Conduit, Fire Below the Mountain, Hand of Noxus, Hextech Anomaly, Kai'Sa, Rebel, …; look for / tax / ignore it (1): Mystic Vortex
- **Examples:**
  - **Wind Wall** (OGN-064, spell · cost 3+2 power): "[Reaction] (Play any time, even before spells and abilities resolve.) / Counter a spell."
  - **Discipline** (OGN-058, spell · cost 2): "[Reaction] (Play any time, even before spells and abilities resolve.) / Give a unit +2 [Might] this turn. Draw 1."
  - **Dragonsoul Sage** (UNL-093, unit · cost 2 · 1 Might): "[Reaction][>] [Exhaust]: [Add] [1]. (Abilities that add resources can't be reacted to.)"
- **Deck-building meaning (HEURISTIC):** `speed=reaction`. The role comes from the effect: `counterspell` ("Counter a spell."), `protection`, `combat_trick`, instant draw. Reactions are the only way to act in an opponent's Neutral turn window, so the count of Reaction cards a deck can hold up is its interaction density. Hidden cards and Quick-Draw gear also have Reaction (811.6, 819.1.b). Answered by taxes on Reactions (Mystic Vortex VEN-160) and "can't be countered" (Decree of Rage VEN-015).
- **Modes:** 1v1: one opponent to respond to. FFA: priority passes around the whole table (CR 339), so a spell can be answered by any opponent and your Reactions have more targets but your own plays face more responders. 2v2: both opponents can respond; a teammate can also react.

### 2.10 Shield (CR 814)
- **Class (FACT, 814.1, 814.1.a):** Passive Ability keyword on units.
- **Definition (FACT, 814.1.c):** "While I am a defender, I have +X [M]."
- **Reminder as printed:** "(+1 [Might] while I'm a defender.)"; with Assault on one line: "(+2 [Might] while I'm an attacker or defender.)".
- **Number (FACT, 814.1.b.3, 814.2):** X omitted = 1; summed across sources (Stalwart Poro + Block's Shield 3 = Shield 4).
- **Zone / timing:** board, only while the unit has the Defender designation (CR 466.2.c.2-.3). The extra Might also raises the damage needed to kill it in that combat, because lethal damage is measured against current Might (CR 142.4.b).
- **Pool (DATA):** own it: **25** (unit 25 / spell 0 / gear 0 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **16**; total **41**. First set: OGN. Printed values on owners: 1 (no number): 12, 2: 8, 3: 4, 5: 1.
- **Other cards using it (HEURISTIC classification):** grant it (11): Black Flame Altar, Block, Chakram Dancer, Cloth Armor, Consult the Heavens, For Demacia!, Hunting Blind, …; gain it conditionally (5): Disciple of Shen, Fiora, Victorious, Fortified Position, Grumpy Rockbear, Serene Ascetic
- **Examples:**
  - **Stalwart Poro** (OGN-052, unit · cost 2 · 2 Might): "[Shield] (+1 [Might] while I'm a defender.)"
  - **Wrath of the Freljord** (RAD-077, unit · cost 9 · 7 Might): "I enter ready. / [Shield 3] (+3 [Might] while I'm a defender.)"
  - **Cloth Armor** (SFD-064, gear · cost 1 · +0 Might bonus): "[Quick-Draw] (This has [Reaction]. When you play it, attach it to a unit you control.) / [Equip] [Mind] ([Mind]: Attach this to a unit you control.) / Effect text (active only while attached, CR 136): [Shield 2] (+2 [Might] while I'm a defender.)"
- **Deck-building meaning (HEURISTIC):** effective Might when defending = Might + X. Role: defensive combat stat; granted "this turn" it is a `combat_trick` / `protection`. Axis defend (Shield/Tank) enabler, hold triggers enabler. No effect against spell damage outside combat. Answered by non-combat removal, by moving the unit away, by -Might.
- **Modes:** 1v1: one attacker per turn cycle. FFA: a held battlefield can be attacked by two or three different opponents before your next Beginning Phase, so defensive stats are used more often per round. 2v2: same as FFA with two attackers.

### 2.11 Tank (CR 815)
- **Class (FACT, 815.1, 815.1.a):** Passive Ability keyword on units.
- **Definition (FACT, 815.1.b):** "I must be assigned lethal damage before any other unit with the same controller as me that does not have [Tank] during the Combat Damage step."
- **Reminder as printed:** "(I must be assigned combat damage first.)"
- **Number:** none.
- **Zone / timing:** board, Combat Damage step only (CR 467.2.c.6-.9). Works both when attacking and when defending. With several Tanks the assigning player picks the order among them (815.1.c.2). A unit with both Tank and Backline lets the assigning player choose which to obey (CR 467.2.c.8).
- **Pool (DATA):** own it: **23** (unit 23 / spell 0 / gear 0 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **9**; total **32**. First set: OGN.
- **Other cards using it (HEURISTIC classification):** grant it (7): Block, Doran's Shield, Durand Memorial, Eye of Twilight, Lillia, Protector of Dreams, Protector's Shield, Yuumi, Magical Cat; look for / tax / ignore it (2): Dune Surfer, Kinkou Temple
- **Examples:**
  - **Lecturing Yordle** (OGN-087, unit · cost 3 · 2 Might): "[Tank] (I must be assigned combat damage first.) / When you play me, draw 1."
  - **Mutated Mouser** (UNL-036, unit · cost 2 · 1 Might): "[Shield 2] (+2 [Might] while I'm a defender.) / [Tank] (I must be assigned combat damage first.)"
  - **Dune Surfer** (VEN-004, unit · cost 3 · 3 Might): "You ignore [Tank] while assigning combat damage here."
- **Deck-building meaning (HEURISTIC):** role `protection` for the rest of the stack: the opponent's combat damage is soaked by the Tank first, so high-value low-Might units survive combat. Value scales with Tank's Might (+ Shield). Axis defend (Shield/Tank) enabler, hold triggers enabler. Answered by Dune Surfer VEN-004 ("You ignore [Tank] while assigning combat damage here."), by removing the Tank before damage with an Action/Reaction spell, and by non-combat damage.
- **Modes:** no rule difference; see Shield for how often defence is tested in multiplayer.

### 2.12 Temporary (CR 816)
- **Class (FACT, 816.1, 816.1.a):** Triggered Ability keyword on permanents.
- **Definition (FACT, 816.1.b):** "At the start of this permanent's controller's Beginning Phase, before scoring, kill this."
- **Reminder as printed:** "(Kill this at the start of its controller's Beginning Phase, before scoring.)"
- **Number:** none.
- **Zone / timing:** board; triggers in the controller's Beginning Step, which is before the Scoring Step (CR 315.2.a, 315.2.b). So a Temporary unit can conquer on the turn it arrives but can never hold.
- **Pool (DATA):** own it: **5** (unit 1 / spell 0 / gear 4 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **18**; total **23**. First set: OGN. Tokens that have it (not counted): Sprite. The Sprite token has it (CR 187.2).
- **Other cards using it (HEURISTIC classification):** grant it (7): Deceiver, Fading Memories, Last Stand, Mirror Image, Momentary Companion, Smoke and Mirrors, Turn to Dust; look for / tax / ignore it (11): Bashful Bloom, Black Flame Altar, LeBlanc, Everywhere at Once, Lillia, Fae Fawn, Petal Pixie, Shadow's Call, Sprite Burst, …
- **Examples:**
  - **Sumpworks Map** (UNL-085, gear · cost 2): "[Reaction] (Play any time, even before spells and abilities resolve.) / [Temporary] (Kill this at the start of its controller's Beginning Phase, before scoring.) / When an opponent scores, draw 1."
  - **Sprite Mother** (OGN-106, unit · cost 4+1 power · 3 Might): "When you play me, play a ready 3 [Might] Sprite unit token with [Temporary] here. (Kill it at the start of its controller's Beginning Phase, before scoring.)"
  - **Last Stand** (OGN-069, spell · cost 3+1 power): "[Action] (Play on your turn or in showdowns.) / Double a friendly unit's Might this turn. Give it [Temporary]. (Kill it at the start of its controller's Beginning Phase, before scoring.)"
- **Deck-building meaning (HEURISTIC):** a drawback that marks one-turn bodies (Sprites, Reflections, borrowed copies). Because it is a kill, it triggers Deathknell and "when a friendly unit dies" text; it is fodder. Axis deathknell / sacrifice (enabler). LeBlanc, Everywhere at Once UNL-090 turns it off ("Your [Temporary] effects at my battlefield don't trigger."). As a text given to an enemy or to your own doubled unit (Last Stand OGN-069) it is a delayed kill.
- **Modes:** the kill waits for the **controller's** next Beginning Phase. In FFA4 and 2v2 three other turns pass first, so a Temporary body blocks or threatens through three opposing turns instead of one.

### 2.13 Vision (CR 817)
- **Class (FACT, 817.1, 817.1.a):** Triggered Ability keyword on permanents.
- **Definition (FACT, 817.1.b):** "When this is played, [Predict]." Predict = look at the top card of your Main Deck, you may recycle it (CR 437.1).
- **Reminder as printed:** "(When you play me, look at the top card of your Main Deck. You may recycle it.)"
- **Number:** none. Multiple instances trigger separately (817.2).
- **Zone / timing:** on entering the board (817.1.c).
- **Pool (DATA):** own it: **8** (unit 7 / spell 0 / gear 1 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **1**; total **9**. First set: OGN.
- **Examples:**
  - **Mystic Poro** (OGN-171, unit · cost 2 · 2 Might): "[Vision] (When you play me, look at the top card of your Main Deck. You may recycle it.)"
  - **Gemcraft Seer** (OGN-100, unit · cost 3+1 power · 3 Might): "[Vision] (When you play me, look at the top card of your Main Deck. You may recycle it.) / Other friendly units have [Vision]."
  - **Divining Shells** (UNL-161, gear · cost 2): "[Vision] (When you play this, look at the top card of your Main Deck. You may recycle it.) / [Action][>] Kill this, [Exhaust]: Give a unit +2 [Might] this turn."
- **Deck-building meaning (HEURISTIC):** role `selection` (about a quarter of a card of quality). Axis top-deck (Vision/Predict) enabler; payoffs reveal or play the top card (e.g. Raving Witness RAD-074, Apprentice Smith SFD-041). No answer needed.
- **Modes:** no difference.

### 2.14 Equip (CR 818)
- **Class (FACT, 818.1, 818.1.a):** Activated Ability keyword on gear with the Equipment tag.
- **Definition (FACT, 818.1.c.2):** "[Cost]: Attach this gear to a unit you control." The choice is a target (818.1.b.1). The cost may be resources or anything else (818.1.c.3), e.g. "[Equip] — [Order], Kill a friendly unit".
- **Reminder as printed:** "([Body]: Attach this to a unit you control.)" with the card's cost; non-resource costs print "(Pay the cost: Attach this to a unit you control.)".
- **Number:** none; the token after the keyword is a cost, not a value.
- **Zone / timing:** the gear must be on the board (gear is played to base and enters ready, CR 148.1.a.1, 149.1). Default activated-ability timing: your Main Phase, Open state, not in a showdown (CR 151.2). Re-activating moves the Equipment to a new unit (CR 435.1.f). While attached, the gear's own rules text is Inactive, its Effect Text is added to the unit and its Might Bonus applies (CR 718.2-718.4). When the unit leaves the board the Equipment detaches, stays on the board and is recalled to base in the next cleanup (CR 719.5, 459.1).
- **Pool (DATA):** own it: **43** (unit 0 / spell 0 / gear 43 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **0**; total **43**. First set: SFD. Gear with the Equipment tag: 41.
- **Examples:**
  - **Doran's Blade** (SFD-095, gear · cost 2 · +2 Might bonus): "[Equip] [Body] ([Body]: Attach this to a unit you control.)"
  - **Blade of the Ruined King** (SFD-178, gear · cost 3+1 power · +4 Might bonus): "[Equip] — [Order], Kill a friendly unit (Pay the cost: Attach this to a unit you control.)"
  - **Hexdrinker** (SFD-102, gear · cost 2 · +1 Might bonus): "[Equip] [Body] ([Body]: Attach this to a unit you control.) / Effect text (active only while attached, CR 136): [Deflect] (Opponents must pay [Rainbow] to choose me with a spell or ability.)"
- **Deck-building meaning (HEURISTIC):** role `buff` that outlives its carrier: total cost = play cost + Equip cost, re-payable Equip cost each time the carrier dies. Axis equipment / attach (enabler), gear matters (enabler). Combos with Weaponmaster, Quick-Draw, "equipped"/"attach" payoffs and legends that move Equipment (Grandmaster at Arms SFD-193). Answered by gear removal ("Kill a gear", Detonate SFD-005, Thermo Beam OGN-022 "Kill all gear.") and by killing the carrier in response to the Equip ability (it is a targeted ability on the chain).
- **Modes:** no rule difference. 2v2: Equip says "a unit you control", so it cannot go on a teammate's unit (control is not shared, CR 491.8.c).

### 2.15 Quick-Draw (CR 819)
- **Class (FACT, 819.1, 819.1.a):** Triggered Ability keyword and Permissive keyword, on gear with Equip.
- **Definition (FACT, 819.1.d):** short for "[Reaction]" and "When you play this, attach it to a Unit you control."
- **Reminder as printed:** "(This has [Reaction]. When you play it, attach it to a unit you control.)"
- **Number:** none.
- **Zone / timing:** played from hand at Reaction speed; the attach is a play effect, no Equip cost is paid for it.
- **Pool (DATA):** own it: **5** (unit 0 / spell 0 / gear 5 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **1**; total **6**. First set: SFD.
- **Examples:**
  - **Long Sword** (SFD-022, gear · cost 2+1 power · +2 Might bonus): "[Quick-Draw] (This has [Reaction]. When you play it, attach it to a unit you control.) / [Equip] [Fury] ([Fury]: Attach this to a unit you control.)"
  - **Cloth Armor** (SFD-064, gear · cost 1 · +0 Might bonus): "[Quick-Draw] (This has [Reaction]. When you play it, attach it to a unit you control.) / [Equip] [Mind] ([Mind]: Attach this to a unit you control.) / Effect text (active only while attached, CR 136): [Shield 2] (+2 [Might] while I'm a defender.)"
  - **Protector's Shield** (RAD-123, gear · cost 2+1 power · +1 Might bonus): "[Quick-Draw] (This has [Reaction]. When you play it, attach it to a unit you control.) / [Equip] [1] ([1]: Attach this to a unit you control.) / Effect text (active only while attached, CR 136): [Tank] (I must be assigned combat damage first.)"
- **Deck-building meaning (HEURISTIC):** an Equipment that doubles as a `combat_trick`: its Might Bonus or Effect Text lands in the middle of a combat and then stays. Axis equipment / attach (enabler). Answered like any Reaction.
- **Modes:** no difference.

### 2.16 Repeat (CR 820)
- **Class (FACT, 820.1, 820.1.a):** Optional Additional Cost keyword on spells and abilities.
- **Definition (FACT, 820.1.d):** "You may pay [Cost] as an additional cost as you play this. If you do, execute the instructions of this chain item one additional time during resolution." Choices for the second execution may differ (820.2.a). The spell is still played only once (820.3.a).
- **Reminder as printed:** "(You may pay the additional cost to repeat this spell's effect.)"
- **Number:** none; the token after the keyword is the cost. Each Repeat cost can be paid once (820.1.c.3).
- **Zone / timing:** decided while playing the spell (finalization). Cost checks on the spell use its printed cost, not printed + Repeat (CR 206: Defy can still counter Rocket Barrage whose Repeat was paid).
- **Pool (DATA):** own it: **20** (unit 0 / spell 20 / gear 0 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **4**; total **24**. First set: SFD.
- **Examples:**
  - **Desert's Call** (SFD-031, spell · cost 2): "[Repeat] [2] (You may pay the additional cost to repeat this spell's effect.) / Play a 2 [Might] Sand Soldier unit token."
  - **Square Up** (UNL-017, spell · cost 4): "[Repeat] — Discard 1 (You may pay the additional cost to repeat this spell's effect.) / Give a unit [Assault 4] this turn. (+4 [Might] while it's an attacker.)"
  - **Syndra, Transcendent** (UNL-146, unit · cost 6+1 power · 6 Might): "While I'm in a showdown, your spells have [Repeat] [2][Chaos]. (You may pay the additional cost to repeat the spell's effect.)"
- **Deck-building meaning (HEURISTIC):** a spell with two sizes: cheap early, double effect late. Role: scaling energy sink; it lowers the number of cards a deck needs for late game. Axis rune ramp / big energy (payoff), spell-slinging. Supported by Marai Spire SFD-211 ("friendly [Repeat] costs cost [1] less") and The Academy UNL-216. A counterspell answers both halves at once because only one spell was played.
- **Modes:** no rule difference; longer multiplayer games reach the Repeat cost more often (HEURISTIC).

### 2.17 Weaponmaster (CR 821)
- **Class (FACT, 821.1, 821.1.a):** Triggered Ability keyword on units (a play effect).
- **Definition (FACT, 821.1.c):** "When you play me, you may choose a Card you control with the Equipment tag. … Pay the cost of its Equip ability, reduced by [A], to attach it to this unit." The Equip ability is not activated and the unit is not chosen (821.1.c.6); an Equipment without an Equip cost cannot be attached this way (821.1.c.4).
- **Reminder as printed:** "(When you play me, you may [Equip] one of your Equipment to me for [Rainbow] less, even if it's already attached.)"
- **Number:** none.
- **Zone / timing:** on entering the board; "has no function while on the board" afterwards (821.2). Works on Equipment already attached elsewhere.
- **Pool (DATA):** own it: **11** (unit 11 / spell 0 / gear 0 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **1**; total **12**. First set: SFD.
- **Examples:**
  - **Veteran Poro** (SFD-099, unit · cost 2 · 2 Might): "[Weaponmaster] (When you play me, you may [Equip] one of your Equipment to me for [Rainbow] less, even if it's already attached.)"
  - **Lucian, Merciless** (SFD-113, unit · cost 3 · 3 Might): "[Weaponmaster] (When you play me, you may [Equip] one of your Equipment to me for [Rainbow] less, even if it's already attached.) / The first time I conquer each turn, ready me."
  - **Emperor of the Sands** (SFD-247, legend): "Sand Soldiers you play have [Weaponmaster]. (When they're played, you may [Equip] one of your Equipment to them for [Rainbow] less.) / [1], [Exhaust]: Play a 2 [Might] Sand Soldier unit token to your base. Use only if you've played an Equipment this turn."
- **Deck-building meaning (HEURISTIC):** an Equipment carrier: with the common one-Power Equip costs the re-equip is free. Needs Equipment already on the board, so the deck wants cheap Equipment played first. Axis equipment / attach (payoff). Weak when the opponent kills gear.
- **Modes:** no difference.

### 2.18 Ambush (CR 822)
- **Class (FACT, 822.1, 822.1.a):** Passive Ability keyword, normally on units.
- **Definition (FACT, 822.1.b):** "I may be played to a battlefield where you control Units" and "I have [Reaction] as long as I'm being played to a battlefield where you control Units."
- **Reminder as printed:** "(You may play me as a [Reaction] to a battlefield where you have units.)"
- **Number:** none.
- **Zone / timing:** from hand, at Reaction speed, to a battlefield where you already have a unit (also one you do not control, e.g. where your attackers are). If your units there are gone before the card finalizes, the permission fails (822.3). The unit still enters exhausted (CR 143.4) but gains the Attacker or Defender designation in the next cleanup (CR 466.2.c.3.a, 323.2.a) and adds its Might to combat damage.
- **Pool (DATA):** own it: **15** (unit 15 / spell 0 / gear 0 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **0**; total **15**. First set: UNL.
- **Examples:**
  - **Soulspinner** (VEN-123, unit · cost 3 · 3 Might): "[Ambush] (You may play me as a [Reaction] to a battlefield where you have units.)"
  - **Inferna** (UNL-002, unit · cost 2 · 1 Might): "[Ambush] (You may play me as a [Reaction] to a battlefield where you have units.) / [Assault 2] (+2 [Might] while I'm an attacker.)"
  - **Rengar, Trophy Hunter** (UNL-120, unit · cost 5+1 power · 6 Might · **errata text** (unleashed errata)): "[Ambush] (You may play me as a [Reaction] to a battlefield where you have units.) / I can [Ambush] to a battlefield where there are enemy units, even if you don't have units there."
- **Deck-building meaning (HEURISTIC):** a unit that is also a combat trick worth its full Might, held up during the opponent's turn. Role `tempo_ready`-like reinforcement and, when defending, `protection` of a hold. Axis attack / defend. Combos with "when you play a unit during a showdown" (Fresh Beans UNL-011) and play effects that deal damage. Answered by removing the unit already at the battlefield in response (822.3).
- **Modes:** 1v1: needs your unit at the fought battlefield. 2v2: the teammate's units do not enable it ("where you control Units"). FFA: usable in any combat you are part of.

### 2.19 Hunt (CR 823)
- **Class (FACT, 823.1, 823.1.a, 823.1.b):** Triggered Ability keyword on units; "both a Conquer and a Hold effect".
- **Definition (FACT, 823.1.c.1):** "When I Conquer or Hold, my controller gains X XP."
- **Reminder as printed:** "(When I conquer or hold, gain 1 XP.)"
- **Number (FACT, 823.1.c.2, 823.2):** X omitted = 1; summed across sources.
- **Zone / timing:** board; triggers when the battlefield the unit is at is scored by its controller (CR 383.4.c, 383.4.d), at most once per battlefield per turn (CR 472).
- **Pool (DATA):** own it: **12** (unit 12 / spell 0 / gear 0 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **1**; total **13**. First set: UNL. Printed values on owners: 1 (no number): 6, 2: 5, 3: 1.
- **Examples:**
  - **Voracious Gromp** (UNL-100, unit · cost 5 · 5 Might): "[Hunt 3] (When I conquer or hold, gain 3 XP.)"
  - **Herald of Spring** (UNL-034, unit · cost 4+1 power · 4 Might): "[Hunt] (When I conquer or hold, gain 1 XP.) / When you play me, gain 2 XP."
  - **Hunter's Machete** (UNL-096, gear · cost 3 · +2 Might bonus): "[Equip] [Body] ([Body]: Attach this to a unit you control.) / Effect text (active only while attached, CR 136): [Hunt] (When I conquer or hold, gain 1 XP.)"
- **Deck-building meaning (HEURISTIC):** XP source tied to scoring: the deck earns XP by doing what wins anyway. Axis XP / Level (enabler); it is also a conquer/hold payoff. Needs Level cards or "Spend N XP" sinks to matter. Answered by denying the score (kill or bounce the unit, contest the battlefield).
- **Modes:** XP is per player: "XP is not shared between Allies" (CR 732), so in 2v2 each player needs their own sources. FFA: holding is harder with more attackers, so Hunt fires less through hold.

### 2.20 Level (CR 824)
- **Class (FACT, 824.1):** Dependent Keyword.
- **Definition (FACT, 824.1.b.1):** "While you have [N] or more XP, this card gains '[Text]'." It switches off as soon as the controller has less than N XP (824.1.d).
- **Reminder as printed:** "(While you have 6+ XP, get the effect.)"
- **Number:** N is a threshold, not a strength; printed thresholds in the pool are 3, 6, 11 and 16 (DATA, see the count line). Several Level lines on one card are separate abilities ("[Level 6][>] … instead").
- **Zone / timing:** wherever the dependent text works (hand for cost reductions, board for static text, legends).
- **Pool (DATA):** own it: **14** (unit 9 / spell 3 / gear 1 / legend 1 / battlefield 0); grant, condition on or reference it without owning it: **1**; total **15**. First set: UNL. Printed values on owners: 11: 4, 16: 1, 3: 5, 6: 9.
- **Examples:**
  - **Bandle Soldier** (UNL-151, unit · cost 4+1 power · 5 Might): "[Level 3][>] I enter ready. (While you have 3+ XP, get the effect.)"
  - **Gemhand Hunter** (UNL-094, unit · cost 2 · 2 Might): "[Hunt] (When I conquer or hold, gain 1 XP.) / [Level 6][>] I have +1 [Might]. (While you have 6+ XP, get the effect.)"
  - **Wuju Master** (UNL-191, legend): "[Level 6][>] Your units have +1 [Might]. (While you have 6+ XP, get the effect.) / [Level 11][>] Your units enter ready."
- **Deck-building meaning (HEURISTIC):** threshold payoff. XP is both a threshold and a currency (CR 730): "Spend N XP" costs lower the total and can switch Level text off, so sinks and thresholds compete. Axis XP / Level (payoff). A deck should be scored on XP gained per turn versus the lowest threshold it cares about.
- **Modes:** 2v2: thresholds are checked against your own XP only (CR 732). No other difference.

### 2.21 Unique (CR 825)
- **Class (FACT, 825.1):** Deck Constraint Permission.
- **Definition (FACT, 825.3.a):** "A deck can contain only one card of a given name if the card has Unique". No effect during play (825.4).
- **Reminder as printed:** "(Your deck can have only 1 card with this name.)"
- **Pool (DATA):** own it: **3** (unit 0 / spell 0 / gear 3 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **0**; total **3**. First set: SFD.
- **Examples:**
  - **Forgefire Cape** (SFD-190, gear · cost 4+2 power · +3 Might bonus): "[Unique] (Your deck can have only 1 card with this name.) / [Equip] [Rainbow] ([Rainbow]: Attach this to a unit you control.) / Effect text (active only while attached, CR 136): When I attack or defend, deal 2 to all enemy units here."
  - **Rabadon's Deathcrown** (SFD-191, gear · cost 4+2 power · +3 Might bonus): "[Unique] (Your deck can have only 1 card with this name.) / [Equip] [Rainbow] ([Rainbow]: Attach this to a unit you control.) / Effect text (active only while attached, CR 136): Your spells and abilities deal 3 Bonus Damage (while this is attached)."
  - **Shurelya's Requiem** (SFD-192, gear · cost 4+2 power · +2 Might bonus): "[Unique] (Your deck can have only 1 card with this name.) / [Equip] [Rainbow] ([Rainbow]: Attach this to a unit you control.) / When you play this, ready your units. / Effect text (active only while attached, CR 136): Your units here have [Ganking]. (We can move from battlefield to battlefield.)"
- **Deck-building meaning:** validation only (see `rules.md` section 4). In a 40-card deck a 1-of is in the opening 4 cards about 10% of the time (4/39 with the Chosen Champion set aside, before mulligan), so Unique cards cannot be a plan by themselves (HEURISTIC).
- **Modes:** not applied in Limited (TR 602.4.a.6.a, see `rules.md` 10.1).

### 2.22 Backline (CR 826)
- **Class (FACT, 826.1, 826.2):** Passive Ability keyword on units.
- **Definition (FACT, 826.3):** "I must be assigned lethal damage after any other unit with the same controller as me that does not have [Backline] during the Combat Damage step."
- **Reminder as printed:** "(I must be assigned combat damage last.)" Two older cards print the same sentence as plain text without the keyword (Caitlyn, Patrolling OGN-068; Soraka, Wanderer SFD-173); CR 467.2.c.8 treats Caitlyn's text as Backline.
- **Number:** none.
- **Zone / timing:** board, Combat Damage step. Can be ignored by text ("You ignore Backline while assigning combat damage here.", CR 766 example).
- **Pool (DATA):** own it: **4** (unit 4 / spell 0 / gear 0 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **0**; total **4**. First set: UNL.
- **Examples:**
  - **Enthusiastic Promoter** (UNL-043, unit · cost 3 · 2 Might): "[Backline] (I must be assigned combat damage last.) / When I hold, [Buff] all units here. (Give each a +1 [Might] buff if it doesn't have one.)"
  - **LeBlanc, Everywhere at Once** (UNL-090, unit · cost 4 · 4 Might): "[Backline] (I must be assigned combat damage last.) / Your [Temporary] effects at my battlefield don't trigger."
  - **Caitlyn, Patrolling** (OGN-068, unit · cost 3+1 power · 3 Might): "I must be assigned combat damage last. / [Exhaust]: Deal damage equal to my Might to a unit at a battlefield. Use this ability only while I'm at a battlefield."
- **Deck-building meaning (HEURISTIC):** self-protection in combat for an engine unit; worth nothing when the unit fights alone. Wants bodies in front, so it belongs with go-wide and Tank. Answered by non-combat removal and by killing the front line first.
- **Modes:** no difference.

### 2.23 Empower (CR 827; game action CR 442)
- **Class (FACT, 827.1, 827.1.a):** Activated Ability keyword, normally on permanents and legends.
- **Definition (FACT, 827.1.c.1):** "[Cost]: Empower this. Play only if not Empowered." Empowered is a binary status (CR 442.1.a) unless a card allows several (CR 442.1.c.1, 827.1.c.5; Kayle, Justified VEN-134).
- **Reminder as printed:** "([3]: Empower me. Use only if not Empowered.)"
- **Number:** none; the token after the keyword is the cost (may be "[1] or [Body]", "Discard 1", "[Exhaust]").
- **Zone / timing:** board or Legend Zone; default activated-ability timing (your Main Phase, Open state) unless the text changes it (827.1.c.4). The status is lost when the object leaves the board or when a "Disempower" cost is paid (CR 443).
- **Pool (DATA):** own it: **40** (unit 29 / spell 0 / gear 7 / legend 3 / battlefield 1); grant, condition on or reference it without owning it: **0**; total **40**. First set: VEN.
- **Examples:**
  - **Covert Informant** (VEN-057, unit · cost 3+1 power · 4 Might): "[Empower] [3] ([3]: Empower me. Use only if not Empowered.) / [Empowered][>] When I move, draw 1."
  - **Legion Marauder** (VEN-074, unit · cost 2 · 2 Might): "[Empower] — [1] or [Body] (Pay either cost: Empower me. Use only if not Empowered.) / [Empowered][>] I have +1 [Might]."
  - **Kayle, Justified** (VEN-134, unit · cost 3 · 3 Might): "[Empower] [3] ([3]: Empower me.) / I can be [Empowered] up to three times. / I have +2 [Might] for each time I'm [Empowered]. / While I'm [Empowered] three times, I have [Deflect 3] and [Ganking]."
- **Deck-building meaning (HEURISTIC):** an upgrade bought later: the card is cheap to deploy and has a second cost that turns on its `[Empowered]` text. Role: energy sink. Axis empower (enabler), rune ramp / big energy (payoff). Cards with "Disempower this" costs use the status as a rechargeable battery (Questionable Tome VEN-054). Supported by Risen Altar VEN-163 (cheaper Empower costs). Answered by removing the permanent after the cost was paid (2-for-1 in resources).
- **Modes:** no rule difference.

### 2.24 Empowered (CR 828)
- **Class (FACT, 828.1):** Dependent Keyword.
- **Definition (FACT, 828.1.b.1):** "While I have the Empowered status, this card gains '[Text]'." A dependent "When I become Empowered" trigger fires at that moment (828.1.d).
- **Reminder as printed:** none of its own; the Empower line carries the reminder. Deathknell variant: "(When I die while Empowered, get the effect.)".
- **Pool (DATA):** own it: **28** (unit 27 / spell 0 / gear 0 / legend 1 / battlefield 0); grant, condition on or reference it without owning it: **14**; total **42**. First set: VEN. (references are mostly "If this is [Empowered]" conditions and "When I become [Empowered]" triggers, HEURISTIC reading).
- **Examples:**
  - **Punching Poro** (VEN-007, unit · cost 2 · 2 Might): "[Empower] — Discard 1 (Pay the cost: Empower me. Use only if not Empowered.) / [Empowered][>] I have +1 [Might]."
  - **Mournful Witness** (VEN-028, unit · cost 2 · 2 Might): "When a combat that I was in ends, empower me. (I become Empowered if I'm not already.) / [Empowered][>] I have +2 [Might]."
  - **Mel, Newly Awakened** (VEN-069, unit · cost 4+1 power · 4 Might): "When you play me, draw 1. / [Empower] [3] ([3]: Empower me. Use only if not Empowered.) / [Empowered][>] Your spells and abilities can't be countered. If a spell or ability you control would give -[Might] to a unit it chooses, it gives an additional -1 [Might]."
- **Deck-building meaning (HEURISTIC):** the payoff half of Empower; a card's rating must be computed in two states (base, empowered) with the Empower cost in between. Some cards become Empowered without the keyword cost (Mournful Witness VEN-028 after a combat). Axis empower (payoff).
- **Modes:** no difference.

### 2.25 Flow (CR 829)
- **Class (FACT, 829.1, 829.1.a):** Passive Ability keyword on spells.
- **Definition (FACT, 829.1.b):** "You may play this from your trash for its flow cost. Then banish it." The Flow cost replaces the base cost (829.1.c.1); timing permissions do not change (829.1.b.2).
- **Reminder as printed:** "(You may play this from your trash for its Flow cost. Then banish it.)"
- **Number:** none; the token after the keyword is the alternate cost.
- **Zone / timing:** trash, at the spell's normal timing. After the Flow play it is banished whatever happens to it (829.1.b.1), so each copy is cast at most twice.
- **Pool (DATA):** own it: **15** (unit 0 / spell 15 / gear 0 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **2**; total **17**. First set: VEN.
- **Examples:**
  - **Dredge Up** (VEN-049, spell · cost 2): "Draw 1. / [Flow] [2] (You may play this from your trash for its Flow cost. Then banish it.)"
  - **Onslaught** (VEN-081, spell · cost 4): "Give a unit +6 [Might] this turn. / [Flow] [4] (You may play this from your trash for its Flow cost. Then banish it.)"
  - **Stargazer** (VEN-098, unit · cost 5 · 4 Might): "Spells with [Flow] you play from your trash cost [2] less, to a minimum of [1]."
- **Deck-building meaning (HEURISTIC):** built-in card advantage: one card, two casts. It also works from the trash without ever being cast from hand, so discard and Burn effects (CR 441) turn into card selection. Role `recursion`. Axis trash / recursion (payoff), spell-slinging (enabler). Kennen, Storm of Shuriken VEN-113 grants Flow to another spell. Answered by trash hate (banish or recycle cards from a trash) and by counterspells on the second cast.
- **Modes:** no rule difference.

### 2.26 Deploy (CR 830) — new in Radiance
- **Class (FACT, 830.1, 830.1.a):** Passive Ability and Triggered Ability keyword on gear.
- **Definition (FACT, 830.1.b):** short for "This may be played or created to any battlefield," "Play or create this only to a battlefield," "If this is not a unit, it is not recalled in cleanups," and "When an opponent holds here, kill this."
- **Reminder as printed:** "(Play this only to a battlefield. When an opponent holds here, kill this.)"
- **Number:** none.
- **Zone / timing:** played to **any** battlefield, "including enemy occupied and open battlefields" (830.1.b.1); stays there (normal gear at a battlefield is recalled, CR 323.6); can be moved by effects (830.1.b.2); dies when an opponent Holds that battlefield (not when they merely conquer it).
- **Pool (DATA):** own it: **14** (unit 0 / spell 0 / gear 14 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **4**; total **18**. First set: RAD. The Bomb token has it (CR 187.12).
- **Other cards using it (HEURISTIC classification):** look for / tax / ignore it (4): Command: Attack, Exemplar of Demacia, Jarvan IV, Martial Paragon, Overloaded Traveler
- **Examples:**
  - **Banner of Conquest** (RAD-002, gear · cost 1+1 power): "[Deploy] (Play this only to a battlefield. When an opponent holds here, kill this.) / Friendly units here have [Assault]. (+1 [Might] while they're attackers.)"
  - **Gravity Field** (RAD-062, gear · cost 5+1 power): "[Deploy] (Play this only to a battlefield. When an opponent holds here, kill this.) / Opponents must pay [1][Rainbow] to move one or more units to this battlefield. / [Deathknell][>] Draw 1. (When I die, get the effect.)"
  - **Jarvan IV, Martial Paragon** (RAD-091, unit · cost 4+1 power · 4 Might): "Your gear with [Deploy] have [Action]. (They can be played on your turn or in showdowns.) / When I conquer, if there is a friendly gear with [Deploy] here, channel 1 rune exhausted."
- **Deck-building meaning (HEURISTIC):** a local aura or trigger attached to a battlefield instead of a unit: it cannot be killed in combat and is removed only by gear removal or by an opponent holding there for a turn. It gives board presence at a battlefield without contesting it (gear does not apply Contested; only units do, CR 190.3.a). Axis deploy / bombs (RAD) enabler, gear matters enabler. Payoffs: Jarvan IV, Martial Paragon RAD-091, legend Exemplar of Demacia RAD-155, Overloaded Traveler RAD-072, Command: Attack RAD-033 (moves one).
- **Modes:** 1v1: with two battlefields the opponent's hold is the usual way it dies. FFA: any opponent holding there kills it, three players can do so. 2v2: only an **opponent's** hold kills it; a teammate holding the battlefield keeps it alive, and "Friendly units here" auras help the teammate's units (CR 740.1.a).

### 2.27 Disarm (CR 831) — new in Radiance
- **Class (FACT, 831.1, 831.1.a, 831.1.b):** Triggered Ability keyword on units; an Attack Trigger.
- **Definition (FACT, 831.1.d):** "When I attack, give an enemy unit here -X [M] this turn."
- **Reminder as printed:** "(When I attack, give an enemy unit here -1 [Might] this turn.)"
- **Number (FACT, 831.1.c.3, 831.1.d.1, 831.2):** X omitted = 1; summed; one trigger with the total value ("Your Mechs have [Disarm]." twice = Disarm 2).
- **Zone / timing:** board; triggers when the unit first gains the Attacker designation in a combat (CR 383.4.e), once per combat. The reduction lasts the whole turn, so it also lowers the damage needed to kill the target (CR 142.4.b).
- **Pool (DATA):** own it: **8** (unit 8 / spell 0 / gear 0 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **1**; total **9**. First set: RAD. Printed values on owners: 1 (no number): 5, 2: 3.
- **Examples:**
  - **Trinket Peddler** (RAD-054, unit · cost 3 · 3 Might): "[Disarm] (When I attack, give an enemy unit here -1 [Might] this turn.)"
  - **Disposal Expert** (RAD-093, unit · cost 4 · 3 Might): "I enter ready if you control no other units. / [Disarm 2] (When I attack, give an enemy unit here -2 [Might] this turn.)"
  - **Clanging Sentry** (RAD-055, unit · cost 3 · 2 Might): "Your Mechs have [Disarm]. (When each of us attacks, give an enemy unit there -1 [Might] this turn.)"
- **Deck-building meaning (HEURISTIC):** an attack-only swing of X in both directions: the defender deals X less and dies to X less. Role `debuff`. Axis disarm / shrink (enabler), attack (payoff). Payoff text: "When you reduce the Might of an enemy unit" (Ahri, Confident RAD-038). It chooses an enemy unit, so Deflect taxes it. Useless when defending.
- **Modes:** no rule difference.

### 2.28 Show Off (CR 832) — new in Radiance
- **Class (FACT, 832.1, 832.1.a):** Passive Ability keyword, normally on cards.
- **Definition (FACT, 832.1.c):** "As you play [me/this], you may reveal [Object] from your hand and/or pick [Object] from among friendly game objects on the board." The shown object's information is locked in at that moment (832.1.d.1). A facedown card cannot be shown (PN-RAD ruling on Gutter Guardian).
- **Reminder as printed:** "(As you play this, you may reveal a unit from hand or pick a friendly unit.)"
- **Number:** none; the object description is the parameter ("a Mech", "a gear", "a card with Energy cost [7] or more", "a card with [Hidden]").
- **Zone / timing:** while playing the card (finalization). "Pick" is not targeting (CR 355.7), so Deflect and "can't be chosen" do not apply.
- **Pool (DATA):** own it: **6** (unit 3 / spell 3 / gear 0 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **0**; total **6**. First set: RAD.
- **Examples:**
  - **Incorrigible Construct** (RAD-011, unit · cost 4 · 4 Might): "[Show Off] a Mech. (As you play me, you may reveal a Mech from hand or pick another friendly Mech.) / I enter ready if you showed off."
  - **Primordial Roar** (RAD-082, spell · cost 4+2 power): "[Show Off] a unit. (As you play this, you may reveal a unit from hand or pick a friendly unit.) / If you showed off a unit, deal damage equal to that unit's Might to a unit."
  - **Battle Preparations** (RAD-032, spell · cost 2): "[Reaction] (Play any time, even before spells and abilities resolve.) / [Show Off] a gear. (As you play this, you may reveal a gear from hand or pick a friendly gear.) / Give a unit +2 [Might] this turn. If you showed off, ready up to 2 runes."
- **Deck-building meaning (HEURISTIC):** a conditional kicker with no resource cost: it only asks the deck to contain enough cards of the named kind. For a tool: read the object description, count matching cards in the deck (hand reveal) and matching permanents (board pick), and rate the card in "shown" and "not shown" states. Axis show off (RAD) payoff. Cost: reveals hidden information.
- **Modes:** 2v2: the pick is "among friendly game objects on the board", and friendly includes a teammate's objects (CR 740.1.a), so a teammate's board can satisfy it (HEURISTIC reading of the two rules together; no ruling found). No other difference.

## 3. Bracketed terms and game actions that are not keywords

These appear in card text in brackets or as verbs. They are defined in CR 413-446 ("Types of Actions") and CR 700-767.

| Term | Rule | Exact meaning (FACT) | Pool (DATA, n names) | Deck-building meaning (HEURISTIC) |
|---|---|---|---|---|
| `[Mighty]` | CR 706-711 | "A Unit 'is Mighty' as long as its Might is 5 or greater." It "becomes Mighty" when its Might crosses from below 5 to 5+. In non-board zones printed Might is used (711). | 12 cards name it; 198 units have printed Might 5+ | payoff axis mighty (5+ Might); enablers are big units, +Might effects, Equipment, buffs |
| `[Buff]` | CR 427, 701-705 | place a Buff counter on a unit; "There can only be one Buff on a Unit at a time" (702.3); each Buff gives +1 Might (703); buffs can be spent (702.2.b) | 53 | permanent +1 that is also a currency ("spend a buff"); see 4.11 |
| `[Stun]` | CR 424 | binary status; "A Stunned Unit does not contribute its might to damage in the combat damage step" (424.1.b); ends in the end-of-turn cleanup (424.1.a.2) | 34 | combat removal for one turn; see 4.12 |
| `[Predict]` / Predict N | CR 437 | look at the top N cards of your Main Deck (N omitted = 1), recycle any number, put the rest back in any order; never causes Burn Out (437.4.a) | 14 | `selection` |
| `[Burn N]` | CR 441 | move the top N cards of a player's Main Deck to their trash; too few cards causes a Burn Out (441.4) | 10 | self-mill for trash payoffs; aimed at an opponent it speeds their Burn Out |
| `[Add]` | CR 430 | put Energy or Power into your Rune Pool; Add abilities resolve immediately and cannot be reacted to (430.2) | 28 | `ramp` |
| Empower / Disempower | CR 442, 443 | gain / remove the Empowered status | see 2.23 | see 2.23 |
| Draw | CR 414 | top of Main Deck to hand; drawing from an empty deck causes Burn Out (414.4) | 159 | `draw` |
| Exhaust / Ready | CR 415, 416 | turn sideways / upright; an exhausted object cannot be exhausted again as a cost (415.4) | see 4.8 | see 4.8 |
| Recycle | CR 417 | put cards on the bottom of their owner's Main Deck (runes: Rune Deck); 2+ cards go in random order (417.5) | 47 | see 4.13 |
| Deal | CR 418 | mark damage on units; "Deal X … for each …" is one instance (418.8) | 99 | `removal_damage`; see 4.6 |
| Heal | CR 419 | clear damage; all units heal at end of every turn and in every combat cleanup (CR 143.3.b) | 10 | damage never carries over a turn |
| Play | CR 420 | put a card on the chain and finalize it; default from hand or Champion Zone (420.1.a) | - | see 4.3 |
| Move | CR 421, 447-455 | change location on the board | 109 | see 4.7 |
| Hide | CR 422 | place a card facedown at a battlefield you control | 63 | see 4.14 |
| Discard | CR 423 | hand to trash, the discarding player chooses (423.1.a) | 41 | self: `discard_outlet`; opponent: `hand_attack` |
| Reveal | CR 425 | show cards from a private or secret zone; they stay in their zone | 33 | information; enables "if it's a …" selection |
| Counter | CR 426 | negate a card or ability on the chain; it goes to the trash; costs are not refunded (426.1.c) | 12 | `counterspell`; see 4.18 |
| Banish | CR 428 | move a card from any zone to Banishment; "not a subset of Kill" (428.2.a) | 36 | see 4.13 |
| Kill | CR 429 | a permanent goes from the board to the trash | 82 | see 4.13 |
| Channel | CR 431 | put the top rune(s) of your Rune Deck onto the board, ready by default (431.2.a) | 33 | `ramp`; see 4.2 |
| Burn Out | CR 432 | when you must take more cards from your Main Deck than it holds: recycle your trash into the deck, then the player "Chooses an opponent to gain 1 point" (432.2.b, 432.2.c) | - | a deck that draws/burns its whole library gives away points |
| Double | CR 433 | add the attribute's current value to itself for the stated duration | 7 | `combat_trick` |
| Swap | CR 434 | exchange two numeric values | 1 | `combat_trick` |
| Attach / Detach | CR 435, 436, 716-719 | link a non-unit card under a unit / unlink it | 56 | see 4.16 |
| Prevent | CR 438 | reduce the next damage by a value or "all" | 4 | `protection` |
| Replace | CR 439 | create a token in place of an object (used by the Brush battlefield token) | - | - |
| Create | CR 440 | bring a new game object into the game | - | see 4.15 |
| Skip | CR 444 | replace an event or phase with nothing | - | - |
| Pay | CR 445 | remove a resource from your Rune Pool | - | see 4.1 |
| Copy | CR 446 | take on another object's copyable traits | 6 | see 4.19 |
| Recall | CR 456-460 | relocate a permanent to its base; "Recalls are not Moves" (458) | 14 | save a unit from death or remove an attacker without killing it |
| "Pick" | CR 355.7 | a choice that is not a target (new wording from Radiance on, PN-RAD) | printed only in reminder text so far | not taxed by Deflect, not stopped by "can't be chosen" |

## 4. Core systems

Counts are "names whose reminder-stripped text matches the detector in section 6" (DATA, n = 1085), split as unit / spell / gear / legend / battlefield. A text match means the card **mentions** the system; whether it is an enabler, a payoff or an answer is decided by the role rules in section 6.

### 4.1 Costs: Energy and Power (CR 131, 163, 201-206, 356-357, 445)
- **FACT (CR 131.2, 131.3):** a Main Deck card's cost is an Energy number plus zero or more Power symbols. **FACT (CR 163.1, 163.2):** Energy has no domain; Power has a domain; `[A]` is Power of any domain (CR 135.2.e.5), `[C]` is Power of the card's own domain and on a multi-domain card may be paid with either domain (CR 135.2.e.6.c).
- **FACT (CR 204):** four kinds of cost: Base Cost (upper left corner, or the part before ":" of an ability), Additional Costs ("as an additional cost", mandatory or with "may" optional, CR 356.2), Costs within Instructions ("[do X] to [do Y]", paid on resolution), Applied Costs ("must pay … to …", paid as the action happens, no chain).
- **FACT (CR 356):** Total Cost is built in this order: base-cost replacements ("for [Cost]", "ignoring its cost" sets Energy and Power to zero, 356.1.b.1; "ignoring its Energy cost" leaves Power, 356.1.b.2), additional costs, increases, discounts, then "ignoring any and all costs". Costs cannot go below 0 (356.6). A minimum in a discount applies only to that discount (356.4.e).
- **FACT (CR 206):** effects that look at a card's cost "always use its printed … cost", whatever was actually paid. So "a spell that costs [5] or more" and counterspell limits are properties of the printed card and can be precomputed.
- **FACT (CR 166-167, 316.3, 317.2.d):** resources sit in the Rune Pool, which empties at the start of each Main Phase and at the end of each turn. Nothing carries over.
- **FACT (CR 185.3.a.1):** tokens have no cost; it is treated as 0.
- **DATA (GAL, 953 Main Deck names):** Energy cost distribution {"0": 7, "1": 73, "2": 214, "3": 211, "4": 166, "5": 113, "6": 84, "7": 35, "8": 27, "9": 11, "10": 9, "12": 3}; number of Power symbols {"0": 510, "1": 348, "2": 80, "3": 12, "4": 3}; 443 names need at least one Power.
- **Pool:** cost reduction 50 (unit 33 / spell 8 / gear 0 / legend 3 / battlefield 6); cost increase or tax 6 (unit 2 / spell 0 / gear 2 / legend 0 / battlefield 2); play ignoring cost 23 (unit 9 / spell 10 / gear 4 / legend 0 / battlefield 0); "as an additional cost" / "you may pay" 75 (unit 43 / spell 14 / gear 6 / legend 5 / battlefield 7).
- **Examples (cost reduction):**
  - **Rhasa the Sunderer** (OGN-195, unit · cost 10+1 power · 6 Might): "I cost [1] less for each card in your trash."
  - **Production Surge** (SFD-076, spell · cost 4+1 power): "This costs [2] less if you control a Mech. / Play a 3 [Might] Mech unit token to your base. / Draw 1."
  - **Irelia, Graceful** (SFD-141, unit · cost 4+1 power · 4 Might): "Your spells that choose me cost [1] or [Rainbow] less."
- **Examples (ignoring cost):**
  - **Spectral Matron** (OGN-226, unit · cost 4+2 power · 4 Might): "When you play me, you may play a unit costing no more than [3] and no more than [Rainbow] from your trash, ignoring its cost."
  - **Portal Rescue** (OGN-102, spell · cost 3+1 power · **errata text** (origins errata)): "[Action] (Play on your turn or in showdowns.) / Banish a friendly unit, then its owner plays it to their base, ignoring its cost."
  - **Dazzling Aurora** (OGN-160, gear · cost 9+2 power · **errata text** (origins errata)): "At the end of your turn, reveal cards from the top of your Main Deck until you reveal a unit and banish it. Play it, ignoring its cost, and recycle the rest."
- **Examples (tax):**
  - **Helm of Suppression** (VEN-045, gear · cost 4+1 power): "[Empower] [4][Calm] ([4][Calm]: Empower this. Use only if not Empowered.) / Opponents' spells cost [1] more. If this is [Empowered], they cost [1][Rainbow] more instead."
  - **Mageseeker Investigator** (UNL-163, unit · cost 4 · 4 Might): "Opponents must pay [Rainbow] for each unit beyond the first to move multiple units to my battlefield at the same time."
  - **Vex, Cheerless** (SFD-146, unit · cost 5+1 power · 5 Might): "While I'm in combat, friendly spells cost [1][Rainbow] less to a minimum of [1], and enemy spells cost [1][Rainbow] more."
- **Deck-building meaning (HEURISTIC):** the two cost axes are different resources. Energy is renewable (exhaust a rune, it readies next turn). Power paid from a basic rune removes that rune from the board (4.2). A card's real weight is `energy + power` runes on the turn it is played and `power` runes of lasting tempo loss. "Ignoring its cost" effects (role: cheat) are worth the printed cost of the best target, so they pull high-cost units into the deck.
- **Modes:** no rule difference. HEURISTIC: taxes that hit "opponents" (Helm of Suppression VEN-045) scale with the number of opponents in FFA and 2v2.

### 4.2 Runes: channel, exhaust, recycle (CR 160-167, 315.3, 417, 430, 431)
- **FACT (CR 161.2.a, 315.3.b):** the Rune Deck has exactly 12 runes; the turn player channels 2 per turn in the Channel Phase (fewer if the Rune Deck is short). Runes are channeled ready by default (CR 431.2.a); many card effects say "channel 1 rune exhausted".
- **FACT (CR 164.2):** every basic rune has "[Reaction][>] [E]: Add [1]." and "[Reaction][>] Recycle this: Add [C]." So one rune gives 1 Energy per turn by exhausting, and gives 1 Power of its domain **once** by going back to the bottom of the Rune Deck (CR 417.1.b, 417.5.a: owner chooses the order). Both can be done with the same rune in one turn (exhaust for Energy, then recycle for Power), since recycling is a cost that does not need the rune ready (HEURISTIC reading of 164.2; ENGINE implements it this way).
- **FACT (CR 430.2, 430.3):** Add abilities resolve immediately, cannot be reacted to, and Reaction Add abilities may be used in the middle of paying a cost.
- **FACT (first-turn rules):** the second player (1v1, CR 487.7, 488.7) or the last player (FFA and 2v2, CR 489.7, 490.7, 491.7) channels one extra rune on their first Channel Phase.
- **Pool:** channel 33 (unit 14 / spell 8 / gear 3 / legend 3 / battlefield 5); `[Add]` 28 (unit 9 / spell 0 / gear 11 / legend 7 / battlefield 1); ready runes 9 (unit 5 / spell 1 / gear 0 / legend 2 / battlefield 1); runes exhausted / enter exhausted 29 (unit 12 / spell 8 / gear 3 / legend 2 / battlefield 4); recycle runes 4 (unit 2 / spell 0 / gear 0 / legend 1 / battlefield 1); Gold token 29 (unit 13 / spell 6 / gear 5 / legend 3 / battlefield 2) (Gold: "[Reaction][>] Kill this, [E]: [Add] [A].", CR 187.5).
- **Examples (channel):**
  - **Mobilize** (OGN-134, spell · cost 2): "Channel 1 rune exhausted. If you can't, draw 1."
  - **Stormclaw Ursine** (OGN-137, unit · cost 7 · 6 Might): "[Tank] (I must be assigned combat damage first.) / When you play me, channel 1 rune exhausted."
  - **Startipped Peak** (OGN-288, battlefield): "When you hold here, you may channel 1 rune exhausted."
- **Examples (Add):**
  - **Seal of Rage** (OGN-040, gear · cost 0+1 power): "[Exhaust]: [Reaction] — [Add] [Fury]. (Abilities that add resources can't be reacted to.)"
  - **Dragonsoul Sage** (UNL-093, unit · cost 2 · 1 Might): "[Reaction][>] [Exhaust]: [Add] [1]. (Abilities that add resources can't be reacted to.)"
  - **Sneaky Zeebles** (RAD-076, unit · cost 2 · 1 Might): "When I conquer, [Add] [Rainbow]. (Abilities that add resources can't be reacted to.)"
- **Examples (ready runes):**
  - **Gentle Gemdragon** (UNL-104, unit · cost 8 · 8 Might): "When you play me or another Dragon, ready up to 2 runes."
  - **Sona, Harmonious** (VEN-SP2, unit · cost 4+1 power · 4 Might): "At the end of your turn, if I'm at a battlefield, ready up to 4 friendly runes."
  - **Battle Preparations** (RAD-032, spell · cost 2): "[Reaction] (Play any time, even before spells and abilities resolve.) / [Show Off] a gear. (As you play this, you may reveal a gear from hand or pick a friendly gear.) / Give a unit +2 [Might] this turn. If you showed off, ready up to 2 runes."
- **Examples (Gold):**
  - **Treasure Hunter** (SFD-130, unit · cost 2 · 1 Might): "When I move, play a Gold gear token exhausted."
  - **Honest Broker** (SFD-155, unit · cost 2 · 2 Might): "[Deathknell] — Play a Gold gear token exhausted. (When I die, get the effect.)"
  - **Chem-Baroness** (SFD-201, legend): "When you or an ally hold, you may exhaust me to play a Gold gear token exhausted. / While your score is within 3 points of the Victory Score, your Gold [Add] an additional [1]."
- **Deck-building meaning (HEURISTIC):** rune count on board is the deck's clock: turn N has about 2N runes minus Power already spent. Power-heavy decks stay low on runes and keep cycling the same 12; Energy-heavy decks reach 12 runes around turn 6 and then need Energy sinks (Repeat, Empower, activated abilities). Role `ramp` = extra channel, Add sources (Seals give Power without recycling a rune), Gold, rune readying. The rune split between the legend's two domains must cover the Power symbols of each domain in the deck (see `rules.md` section 5).
- **Modes:** the extra first-turn rune goes to one player of two in 1v1 but one of three or four in FFA/2v2. No other rule difference.

### 4.3 Turn structure, the chain and priority (CR 301-340)
- **FACT (CR 315-317):** a turn is Awaken (ready everything you control), Beginning (start-of-Beginning-Phase effects, then the Scoring Step where you Hold), Channel (2 runes), Draw (1 card), Main Phase, Ending Phase (heal all units, "this turn" effects expire, Rune Pools empty).
- **FACT (CR 328-331):** playing a card or ability creates the Chain; while a Chain exists the turn is Closed and only Reaction cards and abilities may be added (CR 309.1.a).
- **FACT (CR 337-340, "FEPR"):** Finalize, Execute, Pass, Resolve. The player with priority may add a legally timed item or pass; when all players pass in sequence the **newest** item resolves (340.1).
- **FACT (CR 337.2):** "If, after finalizing the Chain Item, that item is a Unit, Gear, or an ability that Adds resources, it resolves immediately". HEURISTIC consequence: permanents cannot be responded to while being played; printed counterspells read "Counter a spell" (4.18). The permanent's "When you play me" effect is a separate trigger that does use the chain (CR 383.4.a.2).
- **FACT (CR 383.3.d.1):** simultaneous triggers are ordered starting with the turn player, in turn order.
- **FACT (CR 420.4):** "when you play" triggers fire when the card has resolved; a countered card does not trigger them (420.4.a.1), but conditions that check "have you played a card" (Legion) look at finalization (420.4.b).
- **Pool:** "When you play me/this" play effects 161 (unit 141 / spell 0 / gear 20 / legend 0 / battlefield 0); activated abilities (cost before a colon) 107 (unit 30 / spell 1 / gear 45 / legend 28 / battlefield 3); "once each turn"/"first time" limits 22 (unit 16 / spell 0 / gear 1 / legend 1 / battlefield 4); "would … instead" replacement effects 16 (unit 7 / spell 3 / gear 4 / legend 1 / battlefield 1); spell-matters text 24 (unit 16 / spell 0 / gear 4 / legend 2 / battlefield 2).
- **Examples (spell-matters):**
  - **Ravenbloom Student** (OGN-103, unit · cost 2 · 2 Might): "When you play a spell, give me +1 [Might] this turn."
  - **Chemtech Cask** (SFD-063, gear · cost 1): "When you play a spell on an opponent's turn, you may exhaust me to play a Gold gear token exhausted."
  - **Lady of Luminosity, Starter** (OGS-021, legend): "When you play a spell that costs [5] or more, draw 1."
- **Deck-building meaning (HEURISTIC):** three speeds define when a card can matter: slow (own turn, empty chain), Action (plus showdowns), Reaction (any time). Units and gear are always slow unless they have Reaction, Ambush, Quick-Draw or are hidden. A deck's "interaction on the opponent's turn" = its Reaction cards + hidden cards + Ambush units.
- **Modes:** FFA: priority passes around three or four players before anything resolves, so every spell faces more possible responses. 2v2: "Players may play spells or activate abilities during their Teammate's Turn" when invited (CR 491.8.a, 316.5.b.1), including cards without Action or Reaction, which makes slow cards more flexible than in 1v1.

### 4.4 Showdowns and Focus (CR 311-313, 341-348)
- **FACT (CR 344, 323.7):** a Showdown starts in a cleanup when a battlefield became Contested (a unit moved or was played to a battlefield its controller does not control) and the turn is Neutral Open. With enemy units present it is the first step of a Combat; at an empty battlefield it is a Non-Combat Showdown (CR 316.8.b.1).
- **FACT (CR 345-348):** the player who applied Contested gets Focus; the player with Focus may play one Action/Reaction card or ability (which makes a chain) or pass; Focus then goes to the next player in turn order; when all players pass in sequence the Showdown ends. After a Non-Combat Showdown, the only player with units there takes control and Conquers (348.2.a).
- **Pool:** cards that name showdowns 7 (unit 3 / spell 0 / gear 1 / legend 2 / battlefield 1); cards that grant Action or Reaction 3 (unit 2 / spell 0 / gear 0 / legend 0 / battlefield 1).
- **Examples:**
  - **Fresh Beans** (UNL-011, gear · cost 2): "When you play a unit during a showdown, you may exhaust this to draw 1."
  - **Kai'Sa, Rebel** (RAD-063, unit · cost 5+1 power · 5 Might): "[Disarm] (When I attack, give an enemy unit here -1 [Might] this turn). / While I'm in a showdown, your spells have [Reaction]. (Play them any time, even before spells and abilities resolve.)"
  - **Mystic Vortex** (VEN-160, battlefield): "During showdowns here, cards with [Reaction] cost [Rainbow] more to play. (Hidden cards have [Reaction].)"
- **Deck-building meaning (HEURISTIC):** even conquering an **empty** battlefield opens a window in which every opponent may play Action and Reaction cards (e.g. an Ambush unit cannot go there unless they have a unit there, but a spell that moves a unit in can turn the showdown into a combat, CR 316.8.b.1.a). Decks that score by walking into open battlefields still need to respect Reaction/Action interaction.
- **Modes:** FFA and 2v2: all players get Focus in turn order, including players with no units at that battlefield.

### 4.5 Battlefield control (CR 188-190, 323.5)
- **FACT (CR 190.2-190.4):** a battlefield is controlled by one player or by nobody. Control is established by being the only player with units there at the end of a showdown or combat; it is kept while you have units there; with no units there and an Open state you lose it in the next cleanup (190.4.c). Only units count: gear, including Deploy gear, does not hold or contest.
- **FACT (CR 190.6):** the controller controls the battlefield's abilities; "you" on a battlefield card means its controller; with no controller, "you" instructions are ignored (190.6.d).
- **FACT (CR 355.2.a):** units may be played only to your base or to a battlefield you control, unless a card says otherwise.
- **Pool:** text naming control of battlefields 28 (unit 13 / spell 6 / gear 2 / legend 2 / battlefield 5); text changing where a unit may be played 14 (unit 11 / spell 3 / gear 0 / legend 0 / battlefield 0).
- **Examples (play location):**
  - **Sneaky Deckhand** (OGN-176, unit · cost 3 · 2 Might): "You may play me to an open battlefield."
  - **Perched Grimwyrm** (SFD-015, unit · cost 4 · 5 Might): "Play me only to a battlefield you conquered this turn. (You can't play me anywhere else.)"
  - **Miss Fortune, Buccaneer** (OGN-193, unit · cost 4+1 power · 4 Might): "You may play me to an open battlefield. / Friendly units may be played to open battlefields."
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
- **Pool:** attack triggers 41 (unit 36 / spell 0 / gear 4 / legend 1 / battlefield 0); defend triggers 20 (unit 13 / spell 0 / gear 3 / legend 0 / battlefield 4); "win a combat" 8 (unit 4 / spell 1 / gear 1 / legend 2 / battlefield 0); excess damage 6 (unit 3 / spell 0 / gear 1 / legend 1 / battlefield 1); damage-assignment text 3 (unit 3 / spell 0 / gear 0 / legend 0 / battlefield 0); deal damage (any) 99 (unit 34 / spell 55 / gear 8 / legend 0 / battlefield 2); Bonus Damage (CR 712-715) 7 (unit 2 / spell 2 / gear 2 / legend 0 / battlefield 1); prevent 4 (unit 1 / spell 3 / gear 0 / legend 0 / battlefield 0).
- **Examples (attack triggers):**
  - **Crackshot Corsair** (OGN-130, unit · cost 3 · 3 Might): "When I attack, deal 1 to an enemy unit here."
  - **Anivia, Primal** (OGN-148, unit · cost 7+2 power · 8 Might): "When I attack, deal 3 to all enemy units here."
  - **Nine-Tailed Fox** (OGN-255, legend): "When an enemy unit attacks a battlefield you control, give it -1 [Might] this turn, to a minimum of 1 [Might]."
- **Examples (defend triggers):**
  - **Overzealous Fan** (SFD-128, unit · cost 2 · 2 Might): "When I defend, you may kill me to move an attacking unit to its base."
  - **Loyal Pup** (SFD-126, unit · cost 3 · 3 Might): "When you defend at a battlefield, you may move me there."
  - **Reaver's Row** (OGN-285, battlefield): "When you defend here, you may move a friendly unit here to base."
- **Examples (excess damage):**
  - **Tryndamere, Barbarian** (OGN-034, unit · cost 7+2 power · 8 Might): "When I conquer after an attack, if you assigned 5 or more excess damage to enemy units, you score 1 point."
  - **Yeti Brawler** (UNL-018, unit · cost 6 · 6 Might): "When I conquer, if you assigned 3 or more excess damage, play two Gold gear tokens exhausted. (They have "[Reaction][>] Kill this, [Exhaust]: [Add] [Rainbow].")"
  - **Piltover Enforcer** (UNL-187, legend): "When you conquer, if you assigned 3 or more excess damage, you may exhaust me to ready a unit."
- **Examples (win a combat):**
  - **Corrupt Enforcer** (SFD-123, unit · cost 3+1 power · 4 Might): "When I move to a battlefield, discard 1. / When I win a combat, draw 1."
  - **Blossoming Dreamroot** (RAD-024, gear · cost 2): "[Deploy] (Play this only to a battlefield. When an opponent holds here, kill this.) / When you win a combat here, draw 1."
  - **Draven, Audacious** (SFD-148, unit · cost 6+1 power · 6 Might): "[Deflect] (Opponents must pay [Rainbow] to choose me with a spell or ability.) / The first time I win a combat each turn, you score 1 point. / When I die in combat, choose an opponent. They score 1 point."
- **Examples (damage):**
  - **Supernova** (RAD-059, spell · cost 9+1 power): "Deal 10 to a unit. Draw 2."
  - **Iron Ballista** (OGN-017, gear · cost 3): "This enters exhausted. / [Exhaust]: Deal 2 to a unit at a battlefield."
  - **Avalanche** (RAD-079, spell · cost 5+2 power): "Deal 3 to all units in bases."
- **Examples (Bonus Damage):**
  - **Annie, Fiery** (OGS-001, unit · cost 5+1 power · 4 Might): "Your spells and abilities deal 1 Bonus Damage. (Each instance of damage they deal is increased by 1.)"
  - **Ravenborn Tome** (OGN-032, gear · cost 3): "[Exhaust]: The next spell you play this turn deals 1 Bonus Damage. (Each instance of damage the spell deals is increased by 1.)"
  - **Rabadon's Deathcrown** (SFD-191, gear · cost 4+2 power · +3 Might bonus): "[Unique] (Your deck can have only 1 card with this name.) / [Equip] [Rainbow] ([Rainbow]: Attach this to a unit you control.) / Effect text (active only while attached, CR 136): Your spells and abilities deal 3 Bonus Damage (while this is attached)."
- **Deck-building meaning (HEURISTIC):** combat is a comparison of **summed** Might, so many small units and one big unit are equal for dealing damage, but not for taking it: damage must fill units one at a time, so a single big unit either dies or takes nothing, while a wide board loses bodies in order (Tank first). A failed attack costs tempo, not units: attackers that do not clear the defenders go home. Damage does not persist past the turn (CR 143.3.b), so spell damage is only removal if it reaches the unit's Might within one turn, alone or together with combat.
- **Modes:** only two players fight at a time. FFA: a battlefield with a staged or ongoing combat cannot be entered by a third player (CR 449.2.a, 464.2), and no unit may move to a battlefield that already holds units of two other players (CR 451.2), so opponents block each other. 2v2: same two-player limit; a teammate cannot join your combat with units because your battlefield is an invalid destination for them (CR 449.2.b), only with spells.

### 4.7 Movement, Ganking and Recall (CR 144, 421, 447-460)
- **FACT (CR 144):** every unit has the Standard Move: in your Main Phase, Open state, not in a showdown or combat; cost = exhaust the unit; base to battlefield or battlefield to base; several units may move together to one destination (144.3). Ganking adds battlefield to battlefield (2.6).
- **FACT (CR 448.3.c):** a move "does not use the Chain, nor is it able to be Reacted to". The response window is the showdown that follows.
- **FACT (CR 452-454):** moving to a battlefield you do not control makes it Contested and leads to a showdown or combat.
- **FACT (CR 457-460):** a Recall puts a permanent in its base without being a move: it does not trigger "when I move" and cannot be stopped by movement restrictions.
- **Pool:** move text 109 (unit 62 / spell 29 / gear 9 / legend 4 / battlefield 5); "can't move" 7 (unit 4 / spell 1 / gear 1 / legend 0 / battlefield 1); recall 14 (unit 2 / spell 5 / gear 5 / legend 1 / battlefield 1); return to hand (bounce) 32 (unit 14 / spell 13 / gear 3 / legend 1 / battlefield 1).
- **Examples (move):**
  - **Charm** (OGN-043, spell · cost 1+1 power): "Move an enemy unit."
  - **Stellacorn Herder** (SFD-048, unit · cost 4 · 3 Might): "When I move, draw 1."
  - **Unforgiven** (OGN-259, legend · **errata text** (origins errata)): "[2], [E]: Move a friendly unit to or from its base."
- **Examples (recall):**
  - **Possession** (OGN-203, spell · cost 8+3 power): "[Action] (Play on your turn or in showdowns.) / Choose an enemy unit at a battlefield. Take control of it and recall it. (Send it to your base. This isn't a move.)"
  - **Zhonya's Hourglass** (OGN-077, gear · cost 2 · **errata text** (origins errata)): "[Hidden] (Hide now for [A] to react with later for [0].) / If a friendly unit would die, kill this instead. Heal that unit, exhaust it, and recall it. (Send it to base. This isn't a move.)"
  - **Highlander, Yi** (OGS-020, spell · cost 4 · **errata text** (origins errata)): "[Reaction] (Play any time, even before spells and abilities resolve.) / Choose a friendly unit. The next time it would die this turn, heal it, exhaust it, and recall it instead. (Send it to base. This isn't a move.)"
- **Examples (bounce):**
  - **Downwell** (SFD-147, spell · cost 8+2 power): "Return all units and gear to their owners' hands."
  - **Windsinger** (SFD-138, unit · cost 2 · 1 Might): "Hidden (Hide now for [Rainbow] to react with later for [0].) / When you play me, you may return another unit at a battlefield with 3 [Might] or less to its owner's hand."
  - **Bloodharbor Ripper** (UNL-185, legend): "[1], [Exhaust]: Return a friendly unit at a battlefield to its owner's hand. Play a Gold gear token exhausted. (It has "[Reaction][>] Kill this, [Exhaust]: [Add] [Rainbow].")"
- **Deck-building meaning (HEURISTIC):** move effects split into four different roles that a parser must separate: move **your** unit (extra attack or retreat, no exhaust cost), move an **enemy** unit to base (removes a defender for the turn, or breaks a hold), move an enemy unit **to** a battlefield (forces a combat), and "when I move" triggers (payoff). Axis movement. Bounce is removal against tokens (they cease to exist off the board, CR 186.1), against buffed or equipped units, and a replay enabler for your own play effects.
- **Modes:** FFA and 2v2 have a third battlefield, which raises the value of Ganking and of "move to any battlefield" text; destination limits as in 4.6.

### 4.8 Ready and exhaust (CR 143.4, 149.1, 315.1, 415, 416)
- **FACT:** units enter exhausted (CR 143.4); gear enters ready (CR 149.1); everything you control readies in your Awaken Phase (CR 315.1.b). Exhausting is the cost of the Standard Move (CR 144.2) and of `[E]:` abilities; an exhausted object cannot pay it again (CR 415.4).
- **FACT:** nothing in CR 461-468 makes exhausted units skip combat: they still get a designation and their Might is summed. Exhaustion only stops moving and `[E]` costs.
- **Pool:** ready a unit, gear or legend 59 (unit 30 / spell 15 / gear 5 / legend 7 / battlefield 2); enters ready 46 (unit 34 / spell 6 / gear 2 / legend 4 / battlefield 0); exhaust as an effect 35 (unit 4 / spell 7 / gear 9 / legend 14 / battlefield 1); abilities with an exhaust cost 91 (unit 17 / spell 0 / gear 44 / legend 28 / battlefield 2).
- **Examples (ready):**
  - **On the Hunt** (SFD-204, spell · cost 1+2 power): "Ready your units."
  - **Simian Ancestor** (SFD-047, unit · cost 5+1 power · 5 Might): "When you buff me, ready me."
  - **Piltover Enforcer** (UNL-187, legend): "When you conquer, if you assigned 3 or more excess damage, you may exhaust me to ready a unit."
- **Examples (enters ready):**
  - **Eager Drakehound** (SFD-006, unit · cost 3+1 power · 3 Might): "I enter ready."
  - **Confront** (OGN-129, spell · cost 2): "[Action] (Play on your turn or in showdowns.) / Units you play this turn enter ready. Draw 1."
  - **The Exile** (RAD-149, legend): "Units you play to battlefields you control enter ready."
- **Examples (exhaust-cost abilities):**
  - **Heart of Dark Ice** (SFD-052, gear · cost 3+1 power): "[Exhaust]: Give a unit +3 [Might] this turn."
  - **Arena Kingpin** (UNL-001, unit · cost 5 · 3 Might): "I enter ready. / [Exhaust]: Give a unit +3 [Might] this turn."
  - **Unforgiven** (OGN-259, legend · **errata text** (origins errata)): "[2], [E]: Move a friendly unit to or from its base."
- **Deck-building meaning (HEURISTIC):** a ready is an extra action: a second move (attack two battlefields, or attack and retreat) or a second use of an `[E]` ability. Role `tempo_ready`. Exhausting an enemy unit does **not** stop it defending; it stops it moving on its controller's turn only if done after their Awaken Phase. Legends are mostly `[E]` engines (DATA: 28 of 58 legends have an exhaust-cost ability), so "ready your legend" doubles the legend.
- **Modes:** no rule difference.

### 4.9 Scoring: Conquer, Hold, the final point, winning (CR 193-194, 469-474)
- **FACT (CR 471):** **Conquer** = gain control of a battlefield you have not scored this turn. **Hold** = keep control of a battlefield during your Beginning Phase Scoring Step. Each battlefield scores at most once per player per turn (CR 472). Each score gives up to 1 point and triggers Conquer or Hold effects there (CR 473).
- **FACT (CR 473.1.b):** the final point: when a Conquer would give a point and you are 1 point from the Victory Score (or above), you get it only if you have "Scored every Battlefield this turn"; otherwise you draw a card. Points from Hold and from card effects are not restricted (473.1.a.1).
- **FACT (CR 474, 323.1):** you win at a cleanup with points ≥ Victory Score and more than every opponent. Victory Score 8 (CR 194.3), 11 for a 2v2 team (CR 491.3).
- **FACT (CR 470.2):** on cards, "Score N points" means gaining points, not the scoring process.
- **FACT (CR 383.4.c.2.c, 383.4.d.2.c):** Conquer and Hold effects still trigger if the point itself is replaced or prevented.
- **Pool:** conquer text 62 (unit 26 / spell 2 / gear 10 / legend 7 / battlefield 17); hold text 50 (unit 24 / spell 0 / gear 7 / legend 5 / battlefield 14); points from card text 17 (unit 11 / spell 0 / gear 3 / legend 0 / battlefield 3); text naming the Victory Score 5 (unit 3 / spell 1 / gear 0 / legend 1 / battlefield 0); alternative win or win-threshold text 3 (unit 0 / spell 0 / gear 1 / legend 0 / battlefield 2); extra turn 1 (unit 0 / spell 1 / gear 0 / legend 0 / battlefield 0).
- **Examples (conquer):**
  - **Plundering Poro** (SFD-069, unit · cost 2 · 2 Might): "When I conquer, play a Gold gear token exhausted."
  - **Zaun Warrens** (OGN-298, battlefield): "When you conquer here, discard 1, then draw 1."
  - **Might of Demacia, Starter** (OGS-023, legend): "When you conquer, if you have 4+ units at that battlefield, draw 2."
- **Examples (hold):**
  - **Ahri, Alluring** (OGN-066, unit · cost 5+1 power · 4 Might): "When I hold, you score 1 point."
  - **Grove of the God-Willow** (OGN-280, battlefield): "When you hold here, draw 1."
  - **Gloomist** (UNL-193, legend): "When you or an ally hold, you may exhaust me to draw 1."
- **Examples (points from text):**
  - **Yasuo, Windrider** (OGN-205, unit · cost 5+1 power · 4 Might): "[Ganking] (I can move from battlefield to battlefield.) / The third time I move in a turn, you score 1 point."
  - **Bottled Constellation** (VEN-067, gear · cost 10+2 power): "At the start of your Main Phase, you may kill 3 other friendly units and/or gear to score 1 point."
  - **Draven, Audacious** (SFD-148, unit · cost 6+1 power · 6 Might): "[Deflect] (Opponents must pay [Rainbow] to choose me with a spell or ability.) / The first time I win a combat each turn, you score 1 point. / When I die in combat, choose an opponent. They score 1 point."
- **Examples (win text):**
  - **Gutter Palace** (UNL-088, gear · cost 4): "At the start of your Beginning Phase, if you have exactly 4 cards in hand and exactly 4 units at battlefields, you win the game. / Discard 1, [Exhaust]: Play a 1 [Might] Bird unit token with [Deflect]. (Opponents must pay [Rainbow] to choose it with a spell or ability.)"
  - **The Grand Plaza** (OGN-293, battlefield): "When you hold here, if you have 7+ units here, you win the game."
  - **Aspirant's Climb** (OGN-276, battlefield): "Increase the points needed to win the game by 1."
- **Deck-building meaning (HEURISTIC):** two score engines with opposite needs. Conquer decks want ready attackers, movement, Assault, removal of defenders; Hold decks want Shield, Tank, Deflect, cheap bodies at several battlefields. The last point is the hard one: an aggro deck must conquer **all** battlefields in one turn, so it needs either a hold, or a card that says "score 1 point", to close. A tool should count a deck's "closers": hold-capable defenders plus text points. Details and win routes are in `wincons.md`.
- **Modes:** 1v1: 2 battlefields, so "score every battlefield" = both. FFA: 3 battlefields and Victory Score 8, the final Conquer point needs all three in one turn, which makes Hold and text points the realistic closers. 2v2: Victory Score 11 shared (CR 491.8.d), a battlefield scores once per **team** per turn (CR 491.8.b), battlefields the teammate held at the start of the turn are excepted from the final-point requirement (CR 491.8.g.1). "When you or an ally hold" text exists for this mode (5 names).

### 4.10 Might, +Might, -Might, Mighty (CR 143.2, 706-711, 433, 434)
- **FACT (CR 143.2.a):** printed Might, base Might (trait) and effective Might (after all modifiers; what cards call "Might"). Might below 0 is treated as 0 for references and combat sums (143.2.c). "to a minimum of 1 [Might]" on a card is card text, not a rule.
- **FACT (CR 708, 709):** Mighty = Might 5 or more; "becomes Mighty" is the crossing event.
- **Pool:** +Might text 149 (unit 92 / spell 33 / gear 16 / legend 3 / battlefield 5); -Might text 29 (unit 10 / spell 13 / gear 3 / legend 2 / battlefield 1); Mighty text 12 (unit 6 / spell 2 / gear 1 / legend 2 / battlefield 1); double 7 (unit 4 / spell 3 / gear 0 / legend 0 / battlefield 0).
- **Examples (+Might):**
  - **Soul Shepherd** (UNL-077, unit · cost 5 · 3 Might): "Your token units have +1 [Might]."
  - **Raucous Anthem** (RAD-134, spell · cost 7+1 power): "Ready your units and give them +3 [Might] this turn."
  - **Heart of Dark Ice** (SFD-052, gear · cost 3+1 power): "[Exhaust]: Give a unit +3 [Might] this turn."
- **Examples (-Might):**
  - **Moonlight Affliction** (UNL-066, spell · cost 7): "[Reaction] (Play any time, even before spells and abilities resolve.) / Give a unit -10 [Might] this turn."
  - **Orb of Regret** (OGN-090, gear · cost 1): "[Exhaust]: Give a unit -1 [Might] this turn, to a minimum of 1 [Might]."
  - **Nine-Tailed Fox** (OGN-255, legend): "When an enemy unit attacks a battlefield you control, give it -1 [Might] this turn, to a minimum of 1 [Might]."
- **Examples (Mighty):**
  - **Fiora, Victorious** (OGN-232, unit · cost 4 · 4 Might): "While I'm [Mighty], I have [Deflect], [Ganking], and [Shield]. (I'm Mighty while I have 5+ [Might].)"
  - **Kadregrin the Infernal** (OGN-038, unit · cost 9+2 power · 9 Might): "When you play me, draw 1 for each of your [Mighty] units. (A unit is Mighty while it has 5+ [Might].)"
  - **Relentless Storm** (OGN-249, legend): "When you play a [Mighty] unit, you may exhaust me to channel 1 rune exhausted. (A unit is Mighty while it has 5+ [Might].)"
- **Deck-building meaning (HEURISTIC):** "+N this turn" on a spell is a `combat_trick` (both more damage dealt and more damage needed to die); a static "+N" is an anthem. "-N this turn" is both a trick and removal together with damage, because lethal is checked against current Might (CR 142.4.b example with Frigid Touch). Mighty payoffs need a count of units that reach 5: printed 5+ (198 units in the pool) or 4-Might units plus a buff or Equipment.
- **Modes:** no rule difference. 2v2: "friendly units" anthems cover the teammate's units (CR 740.1.a); "your units" text does not.

### 4.11 Buffs (CR 427, 701-705)
- **FACT:** a Buff is a counter worth +1 Might (CR 703); a unit can have only one (CR 702.3); buffing a buffed unit does nothing and does not count as buffing (CR 427.1.c); buffs can be spent by the unit's controller (CR 702.2.b.2); buffs leave when the unit leaves play (CR 705). Counters are not targeted (CR 742.1).
- **Pool:** buff text 53 (unit 32 / spell 8 / gear 6 / legend 4 / battlefield 3); spend-a-buff text 12 (unit 7 / spell 3 / gear 0 / legend 1 / battlefield 1).
- **Examples (buff):**
  - **Simian Ancestor** (SFD-047, unit · cost 5+1 power · 5 Might): "When you buff me, ready me."
  - **Blind Monk** (OGN-257, legend): "[1], [Exhaust]: Buff a friendly unit. (If it doesn't have a buff, it gets a +1 [Might] buff.)"
  - **Monastery of Hirana** (OGN-282, battlefield): "When you conquer here, you may spend a buff to draw 1."
- **Examples (spend):**
  - **Albus Ferros** (OGN-230, unit · cost 4 · 3 Might): "When you play me, spend any number of buffs. For each buff spent, channel 1 rune exhausted."
  - **Sett, Brawler** (OGN-164, unit · cost 5+1 power · 4 Might): "When I'm played and when I conquer, buff me. (If I don't have a buff, I get a +1 [Might] buff.) / Spend my buff: Give me +4 [Might] this turn."
  - **Wallop** (OGN-146, spell · cost 2): "[Action] (Play on your turn or in showdowns.) / As you play this, you may spend a buff as an additional cost. If you do, ignore this spell's cost. / Ready a unit."
- **Deck-building meaning (HEURISTIC):** because of the one-buff cap, buff sources beyond the number of units are wasted unless the deck spends buffs. So the axis has two halves: sources (`buff`) and sinks ("spend a buff", "when you buff"). Go-wide boards use sources best. Answered by anything that removes the unit from the board.
- **Modes:** 2v2: "Buff a friendly unit" may be put on a teammate's unit, but only the unit's controller can spend it (CR 702.2.b.2).

### 4.12 Stun (CR 424)
- **FACT:** stunned is a status; a stunned unit contributes no Might to combat damage (424.1.b) but still needs full damage to die (424.1.c); a stunned unit cannot be stunned again, so "when you stun" does not trigger on it (424.1.a.1); the status ends in the end-of-turn cleanup (424.1.a.2). Stun does not exhaust and does not prevent moving.
- **Reminder as printed:** "(It doesn't deal combat damage this turn.)"
- **Pool:** 34 (unit 20 / spell 11 / gear 2 / legend 1 / battlefield 0)
- **Examples:**
  - **Rune Prison** (OGN-050, spell · cost 2+1 power): "[Action] (Play on your turn or in showdowns.) / Stun a unit. (It doesn't deal combat damage this turn.)"
  - **Solari Shieldbearer** (OGN-051, unit · cost 3 · 2 Might): "When you play me, stun a unit. (It doesn't deal combat damage this turn.)"
  - **Eclipse Herald** (OGN-059, unit · cost 7+1 power · 7 Might): "When you stun an enemy unit, ready me and give me +1 [Might] this turn."
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
- **Pool:** kill 82 (unit 29 / spell 31 / gear 20 / legend 1 / battlefield 1); kill your own permanent 31 (unit 12 / spell 2 / gear 16 / legend 1 / battlefield 0); dies / would die 33 (unit 17 / spell 6 / gear 6 / legend 2 / battlefield 2); banish 36 (unit 10 / spell 15 / gear 7 / legend 4 / battlefield 0); recycle 47 (unit 21 / spell 13 / gear 8 / legend 2 / battlefield 3); discard 41 (unit 24 / spell 6 / gear 6 / legend 3 / battlefield 2); burn 10 (unit 4 / spell 2 / gear 2 / legend 0 / battlefield 2); trash named 49 (unit 25 / spell 14 / gear 6 / legend 2 / battlefield 2).
- **Examples (kill):**
  - **Vengeance** (OGN-229, spell · cost 4+2 power): "Kill a unit."
  - **Harnessed Dragon** (OGN-234, unit · cost 8+2 power · 6 Might): "When you play me, kill an enemy unit."
  - **Thermo Beam** (OGN-022, spell · cost 5+2 power): "[Action] (Play on your turn or in showdowns.) / Kill all gear."
- **Examples (kill your own):**
  - **Cruel Patron** (OGN-208, unit · cost 4 · 6 Might): "As an additional cost to play me, kill a friendly unit."
  - **Deathgrip** (SFD-163, spell · cost 2 · **errata text** (spiritforged errata)): "[Reaction] (Play any time, even before spells and abilities resolve.) / Kill a friendly unit. If you do, give +[M] equal to its Might to another friendly unit this turn. / Draw 1."
  - **Poro Snax** (SFD-046, gear · cost 1+1 power): "When you play this, draw 1. / [1][Calm], [Exhaust], Kill this: Draw 1."
- **Examples (dies / would die):**
  - **Vicious Snapjaws** (UNL-129, unit · cost 5 · 5 Might): "When another friendly unit dies, gain 1 XP."
  - **Zhonya's Hourglass** (OGN-077, gear · cost 2 · **errata text** (origins errata)): "[Hidden] (Hide now for [A] to react with later for [0].) / If a friendly unit would die, kill this instead. Heal that unit, exhaust it, and recall it. (Send it to base. This isn't a move.)"
  - **Smite** (UNL-007, spell · cost 2+1 power): "[Action] (Play on your turn or in showdowns.) / Deal 3 to a unit at a battlefield. If it would die this turn, banish it instead."
- **Examples (banish):**
  - **Smite** (UNL-007, spell · cost 2+1 power): "[Action] (Play on your turn or in showdowns.) / Deal 3 to a unit at a battlefield. If it would die this turn, banish it instead."
  - **Ravenbloom Prefect** (VEN-102, unit · cost 3 · 3 Might): "When an opponent plays a gear, you may banish me to banish it."
  - **Burn Away** (RAD-124, spell · cost 3+1 power): "Banish a unit with 3 [Might] or less or a gear. [Burn 2]. (Put the top 2 cards of your Main Deck into your trash.)"
- **Examples (recycle):**
  - **Garbage Grabber** (OGN-099, gear · cost 2): "Recycle 3 from your trash, [1], [Exhaust]: Draw 1."
  - **Divine Judgment** (OGN-244, spell · cost 7+2 power): "Each player chooses 2 units, 2 gear, 2 runes, and 2 cards in their hands. Recycle the rest."
  - **Sigil of the Storm** (OGN-287, battlefield · **errata text** (origins errata)): "When you conquer here, you must recycle one of your runes. (This doesn’t choose anything.)"
- **Examples (discard):**
  - **Traveling Merchant** (OGN-185, unit · cost 2 · 2 Might): "When I move, discard 1, then draw 1."
  - **Invert Timelines** (OGN-201, spell · cost 3+1 power): "Each player discards their hand, then draws 4."
  - **Scrapheap** (OGN-182, gear · cost 2): "When this is played, discarded, or killed, draw 1."
- **Examples (burn):**
  - **Blade Twirler** (VEN-002, unit · cost 4 · 4 Might): "The first time I move each turn, choose a player. They [Burn 1]. (They put the top card of their Main Deck into their trash.)"
  - **Kennen, Storm of Shuriken** (VEN-113, unit · cost 3+1 power · 4 Might): "When you play me, [Burn 2]. (Put the top 2 cards of your Main Deck into your trash.) / When I conquer, give a spell in your trash [Flow] equal to its cost this turn. (You may play it from your trash for its Flow cost. Then banish it.)"
  - **Shadow Temple** (VEN-165, battlefield): "When you hold here, [Burn 3]. (Put the top 3 cards of your Main Deck into your trash.)"
- **Deck-building meaning (HEURISTIC):** removal quality order against a recursion or Deathknell deck: banish > recycle > return to hand > kill > damage. Against tokens, buffs and Equipment carriers, return to hand is as good as a kill. "Kill a friendly unit" is a cost that Deathknell and Temporary units pay for free. "Recycle N from your trash" costs (Garbage Grabber OGN-099) both feed the deck against Burn Out and shrink your own trash, so they conflict with trash payoffs.
- **Modes:** FFA: "each opponent must kill one of their units" style text (Shard of Undoing UNL-174) scales with opponents; single-target removal does not, which shifts value toward sweepers and toward letting opponents trade with each other. Burn Out (CR 432.2.c) lets the burned-out player **choose** which opponent gets the point.

### 4.14 Hidden cards and the Facedown Zone (CR 107.3, 422, 811)
See 2.7 for the keyword. Additional FACTs: each battlefield has a Facedown Zone with "a maximum occupancy of one card" that card text can raise (CR 107.3.b.1); only the battlefield's controller may have a card there (107.3.c); the card's face is private to its controller (107.3.f); a facedown card that changes zones is revealed (CR 422.4).
- **Pool:** facedown / hide / "[Hidden]" named in rules text 63 (unit 27 / spell 27 / gear 5 / legend 2 / battlefield 2) (includes the cards that own the keyword).
- **Examples (payoffs and answers):**
  - **Noxus Saboteur** (OGN-018, unit · cost 3 · 3 Might): "Your opponents' [Hidden] cards can't be revealed here."
  - **Bandle Tree** (OGN-278, battlefield): "You may hide an additional card here."
  - **Agony's Embrace** (RAD-153, legend): "Once each turn, when you play a card from face down, draw 1. Then, if it's not your turn, discard 1."
- **Deck-building meaning (HEURISTIC):** count of facedown slots = battlefields you control (+ text). A deck with many Hidden cards but few ways to keep a battlefield cannot use them; rate Hidden density against hold strength.
- **Modes:** see 2.7.

### 4.15 Tokens (CR 179-187)
- **FACT:** tokens are not cards (CR 185); they exist only on the board or the chain (CR 186); cost counts as 0 (185.3.a.1); no domain (185.3.b). Defined tokens (CR 187.1-187.12): 1-Might Recruit; 3-Might Sprite with Temporary (tag Fae); 2-Might Sand Soldier; 3-Might Mech; Gold gear; 0-Might Reflection; 1-Might Bird with Deflect; Brush battlefield; Baron Pit battlefield; 1-Might Tentacle; 0-Might Shadow Clone; Bomb gear with "[Deploy]" and "[Deathknell][>] Deal 2 to an enemy unit here and kill all other Bombs you control here."
- **FACT (CR 440.2.c):** "Play a … token" plays it (it uses the chain and counts as playing a unit for triggers that say so); a unit token enters exhausted unless the effect says "ready".
- **Pool:** any token text 107 (unit 53 / spell 23 / gear 13 / legend 9 / battlefield 9); unit tokens 60 (unit 28 / spell 15 / gear 9 / legend 4 / battlefield 4); by type: Recruit 21, Mech 10, Sprite 8, Bird 8, Sand Soldier 6, Reflection 3, Shadow Clone 3, Tentacle 2, Bomb 7, Gold 29.
- **Examples (unit tokens):**
  - **Industrious Mechsmith** (RAD-049, unit · cost 4 · 1 Might): "When you play me, play a 3 [Might] Mech unit token here."
  - **Vanguard Armory** (SFD-168, gear · cost 7+1 power): "[Exhaust]: Play three 1 [Might] Recruit unit tokens. (You may play them to different locations.)"
  - **Herald of the Arcane** (OGN-265, legend): "[1], [Exhaust]: Play a 1 [Might] Recruit unit token."
- **Examples (token payoffs):**
  - **Renata Glasc, Industrialist** (SFD-171, unit · cost 4+1 power · 4 Might): "Your tokens enter ready."
  - **Soul Shepherd** (UNL-077, unit · cost 5 · 3 Might): "Your token units have +1 [Might]."
  - **Zilean, Time Mage** (UNL-086, unit · cost 5+1 power · 5 Might): "Once each turn, if you would play a token unit while I'm at a battlefield, you may play that token and an additional copy of it instead."
- **Examples (Bomb):**
  - **Amateur Demolitionist** (RAD-001, unit · cost 2 · 1 Might): "When you play me, play a Bomb gear token to a battlefield. (It has [Deploy]. When it dies, deal 2 to an enemy there and kill your other Bombs there.)"
  - **Explosimian** (RAD-094, unit · cost 6 · 6 Might): "When I hold, play three Bomb gear tokens to a single battlefield. (They have [Deploy]. When each dies, deal 2 to an enemy there and kill your other Bombs there.)"
  - **Hexplosive Minefield** (RAD-142, spell · cost 2+1 power): "[Action] (Play on your turn or in showdowns.) / Kill any number of friendly Bomb tokens. At end of turn, play that many Bomb tokens to a single battlefield."
- **Deck-building meaning (HEURISTIC):** role `token_maker`: bodies without spending cards. Bodies matter for summed combat Might, for occupying several battlefields, for "kill a friendly unit" costs and for one-buff-per-unit sources. Tokens are not "cards" (CR 052 and 185), so they do not satisfy Legion or "when you play a card". Weak to sweepers and to bounce.
- **Modes:** FFA and 2v2 have a third battlefield to occupy, which favours go-wide boards.

### 4.16 Gear, Equipment and attachment (CR 147-152, 435-436, 716-725, 818-821)
- **FACT:** gear is played to base (CR 148.1.a.1), enters ready (149.1), and is recalled to base if it is unattached at a battlefield (149.3) unless it has Deploy (2.26). Equipment = gear with the Equipment tag; it has Effect Text and a Might Bonus (CR 150.2) that apply only while attached (CR 718.2-718.4, 724). Only non-units can be attached (718.6); an attached card that becomes a unit detaches (718.6.a). Attached cards keep their own controller and status (718.5.e, 719.4). When the carrier leaves the board the Equipment detaches and stays (719.5).
- **Pool:** gear named in text 117 (unit 60 / spell 29 / gear 10 / legend 11 / battlefield 7); attach / equipped / detach text 56 (unit 7 / spell 3 / gear 43 / legend 1 / battlefield 2); "Equipment" named 18 (unit 8 / spell 4 / gear 1 / legend 3 / battlefield 2); gear or Equipment that becomes a unit 4 (unit 0 / spell 1 / gear 1 / legend 2 / battlefield 0).
- **Examples (gear-matters):**
  - **Pit Crew** (OGN-091, unit · cost 3 · 3 Might): "When you play a gear, ready me."
  - **Detonate** (SFD-005, spell · cost 1+1 power): "Kill a gear. Its controller draws 2."
  - **Exemplar of Demacia** (RAD-155, legend): "When you play a gear with [Deploy], you may exhaust me and pay [Rainbow] to move a friendly unit to that battlefield."
- **Examples (attach payoffs):**
  - **Strike Down** (SFD-107, spell · cost 3+1 power): "Choose an equipped friendly unit. It deals damage equal to its Might to an enemy unit. Then detach an Equipment from it."
  - **Grandmaster at Arms** (SFD-193, legend): "[1], [Exhaust]: Attach a detached Equipment you control to a unit you control. / [Exhaust]: Attach an attached Equipment you control to a unit you control."
  - **Aphelios, Exalted** (RAD-179, unit · cost 4+1 power · 4 Might): "When you attach an Equipment to me, choose one that hasn't been chosen this turn —Ready 2 runes.Channel 1 rune exhausted.[Buff] a friendly unit."
- **Deck-building meaning (HEURISTIC):** gear is the card type that combat cannot remove; only "kill a gear" / "banish … gear" text can (role `hate_gear`). Equipment is a buff that survives its carrier. For Equipment the parser must read **three** fields: rules text (cost to equip, play effects), Effect Text (what the carrier gains, including keywords such as Tank or Hunt) and Might Bonus.
- **Modes:** no rule difference.

### 4.17 Playing from the trash and other recursion (CR 420.1.a, 829)
- **FACT (CR 420.1.a):** "By default, a player can only Play cards from their hand or their Chosen Champion zone." Everything else needs card text: Flow (2.25), "play … from your trash", "return … from your trash to your hand".
- **FACT (CR 108.3):** the Chosen Champion starts in the Champion Zone and can be played from there like a card in hand, so every deck has one guaranteed unit.
- **Pool:** play from trash (including Flow) 35 (unit 11 / spell 21 / gear 3 / legend 0 / battlefield 0); return from trash to hand 9 (unit 5 / spell 3 / gear 0 / legend 0 / battlefield 1).
- **Examples (play from trash):**
  - **Spectral Matron** (OGN-226, unit · cost 4+2 power · 4 Might): "When you play me, you may play a unit costing no more than [3] and no more than [Rainbow] from your trash, ignoring its cost."
  - **Immortal Phoenix** (OGN-037, unit · cost 3+1 power · 3 Might): "[Assault 2] (+2 [Might] while I'm an attacker.) / When you kill a unit with a spell, you may pay [1][Fury] to play me from your trash."
  - **Kai'Sa, Evolutionary** (OGN-112, unit · cost 6+1 power · 6 Might): "[Ganking] (I can move from battlefield to battlefield.) / When I conquer, you may play a spell from your trash with Energy cost less than your points without paying its Energy cost. Then recycle it. (You must still pay its Power cost.)"
- **Examples (return to hand):**
  - **Cemetery Attendant** (OGN-165, unit · cost 3+1 power · 3 Might): "When you play me, return a unit from your trash to your hand."
  - **Morbid Return** (OGN-170, spell · cost 2): "[Action] (Play on your turn or in showdowns.) / Return a unit from your trash to your hand."
  - **Guardian of the Passage** (SFD-035, unit · cost 6 · 6 Might): "When I hold, you may return a unit or gear from your trash to your hand."
- **Deck-building meaning (HEURISTIC):** role `recursion`. Enablers fill the trash (discard, Burn, self-kill); payoffs read it. The answer side is `hate_trash`: banish or recycle cards from a trash. A tool must read the type filter ("a unit", "a spell", "a gear", cost limits) to know which deck cards a recursion card can hit.
- **Modes:** some text reaches "any trash" or an opponent's trash; with more opponents there are more trashes to use (HEURISTIC).

### 4.18 Counter, new choices, "can't be countered" (CR 426, 750-755)
- **FACT (CR 426.1):** a countered card or ability "does nothing and is cleared from the chain", goes to the trash, is "not considered to have been played" for play triggers, and its costs are not refunded.
- **FACT (CR 751-755):** "make new choices" lets a player re-choose targets, modes, destinations and play locations of a finalized chain item; new Deflect costs caused by the new targets are ignored (755).
- **Pool:** counter text 12 (unit 0 / spell 12 / gear 0 / legend 0 / battlefield 0); gain control of a spell / new choices 2 (unit 0 / spell 2 / gear 0 / legend 0 / battlefield 0); "can't be countered" 2 (unit 1 / spell 1 / gear 0 / legend 0 / battlefield 0).
- **Examples (counter):**
  - **Wind Wall** (OGN-064, spell · cost 3+2 power): "[Reaction] (Play any time, even before spells and abilities resolve.) / Counter a spell."
  - **Defy** (OGN-045, spell · cost 1+1 power): "[Reaction] (Play any time, even before spells and abilities resolve.) / Counter a spell that costs no more than [4] and no more than [Rainbow]."
  - **Not So Fast** (SFD-045, spell · cost 2+1 power): "[Reaction] (Play any time, even before spells and abilities resolve.) / Counter an enemy spell or ability that chooses a friendly unit or gear."
- **Examples (redirect):**
  - **Mystic Reversal** (OGN-080, spell · cost 4+3 power): "[Reaction] (Play any time, even before spells and abilities resolve.) / Gain control of a spell. You may make new choices for it."
  - **Rebuttal** (VEN-152, spell · cost 1+1 power): "[Reaction] (Play any time, even before spells and abilities resolve.) / Choose a spell with Energy cost no more than [4].  You may pay [Rainbow]. If you do, gain control of it and you may make new choices for it. Otherwise, counter it."
- **Deck-building meaning (HEURISTIC):** role `counterspell`. DATA: all 12 counter cards are spells with Reaction and each names what it can hit ("a spell", "a spell that costs no more than [4] and no more than [Rainbow]", "an enemy spell or ability that chooses a friendly unit or gear"); the condition must be parsed, using printed costs (CR 206). Units and gear resolve as they are finalized (CR 337.2), so a "Counter a spell" card never stops a permanent; it can stop the spell-speed payload of an opponent's deck only.
- **Modes:** FFA: one counterspell protects against one of several opponents; its relative value drops, while being the third player who can counter gives table influence. 2v2: a teammate can counter for you.

### 4.19 Copy and control change (CR 446, 475-482, 190.3.a.2)
- **FACT (CR 446):** copying replaces or adds the copyable traits of another object (applied in the Copy Effects layer); an object **created as** a copy has those traits as its own printed ones (446.3). **FACT (CR 185.3.a.2):** a Reflection token that copies a unit gets that unit's cost.
- **FACT (CR 190.3.a.2):** a unit that changes controller at a battlefield applies Contested there.
- **Pool:** copy 6 (unit 2 / spell 1 / gear 2 / legend 1 / battlefield 0); take control of a unit or spell 6 (unit 0 / spell 5 / gear 1 / legend 0 / battlefield 0).
- **Examples (copy):**
  - **Mirror Image** (UNL-200, spell · cost 3+2 power · **errata text** (unleashed errata)): "Choose a unit. Play a ready Reflection unit token to your base. Then do this: It becomes a copy of that unit. Give it [Temporary]. (Kill it at the start of its controller's Beginning Phase, before scoring.)"
  - **Shady Spectacles** (VEN-137, gear · cost 4 · +0 Might bonus): "[Equip] [1][Order] ([1][Order]: Attach this to a unit you control.) / As this is attached to a unit, choose another friendly unit. The equipped unit becomes a copy of that unit for as long as this is attached to it. / Effect text (active only while attached, CR 136): (I am a copy of the chosen unit.)"
  - **Zilean, Time Mage** (UNL-086, unit · cost 5+1 power · 5 Might): "Once each turn, if you would play a token unit while I'm at a battlefield, you may play that token and an additional copy of it instead."
- **Examples (control):**
  - **Possession** (OGN-203, spell · cost 8+3 power): "[Action] (Play on your turn or in showdowns.) / Choose an enemy unit at a battlefield. Take control of it and recall it. (Send it to your base. This isn't a move.)"
  - **Hostile Takeover** (SFD-202, spell · cost 5+2 power): "[Hidden] (Hide now for [Rainbow] to react with later for [0].) / Take control of an enemy unit at a battlefield. Ready it. (Start a combat if other enemies are there. Otherwise, conquer.) / Lose control of that unit and recall it at end of turn. (Send it to base. This isn't a move.)"
  - **Conscription** (UNL-140, spell · cost 5+2 power): "You may spend 5 XP as an additional cost to play this. / Choose an enemy unit at a battlefield with 3 [Might] or less. If you paid the additional cost, choose any enemy unit at a battlefield instead. Take control of it, exhaust it, and recall it."
- **Deck-building meaning (HEURISTIC):** role `clone`: value = the best unit on the board (yours or, for some cards, anyone's). Clones repeat play effects only if the copy is **played**, not if a token on the board "becomes a copy". Control change is removal plus a body.
- **Modes:** FFA: more boards to copy from or steal from.

### 4.20 XP and Level (CR 728-733, 823, 824)
- **FACT:** XP is a per-player number, public (CR 729.2), gained and spent (CR 730), not a game object (CR 731), unlimited (CR 733), "not shared between Allies" (CR 732). Hunt gains it (2.19); Level reads it (2.20); "Spend N XP" is a cost.
- **Pool:** XP named 27 (unit 17 / spell 4 / gear 3 / legend 2 / battlefield 1); XP gain (including Hunt) 30 (unit 20 / spell 3 / gear 4 / legend 2 / battlefield 1); XP spend 12 (unit 7 / spell 1 / gear 2 / legend 2 / battlefield 0).
- **Examples (gain):**
  - **Demacian Diplomat** (UNL-092, unit · cost 2 · 2 Might): "When you play me, gain 1 XP."
  - **Keeper of the Hammer** (UNL-203, legend): "When you hold, gain 1 XP. / Spend 3 XP, [Exhaust]: Draw 1."
  - **Gardens of Becoming** (UNL-213, battlefield): "Units here have "[Exhaust]: Gain 1 XP.""
- **Examples (spend):**
  - **Blood Rose** (UNL-109, gear · cost 1): "When you play a unit, you may pay [1] to gain 1 XP. / Spend 3 XP, [Exhaust]: Ready a unit."
  - **Megatusk** (UNL-126, unit · cost 6 · 6 Might): "Spend 3 XP: Give your units here [Ganking] this turn. (We can move from battlefield to battlefield.)"
  - **Kha'Zix, Evolving Hunter** (UNL-119, unit · cost 5+1 power · 5 Might): "[Hunt] (When I conquer or hold, gain 1 XP.) / When I attack, you may spend 3 XP to deal damage equal to my Might to an enemy unit here."
- **Deck-building meaning (HEURISTIC):** a closed sub-economy introduced in Unleashed (DATA: every Hunt and Level card has first set UNL). Rate a deck by XP per turn and by its highest threshold; below roughly 3 XP sources the Level cards are blank text.
- **Modes:** 2v2: each player tracks their own XP.

### 4.21 Choosing (targeting), "can't be chosen", "pick" (CR 355.5-355.9, 383.4.b, 756-758)
- **FACT (CR 355.7):** when a card **chooses** specific objects they are targeted; when it **picks** them they are not. "Kill all gear" chooses nothing (355.5.a).
- **FACT (CR 757-758):** "can't be chosen by enemy spells and abilities" makes the object an illegal target; if it becomes untargetable after being targeted the effect mistargets (758.1).
- **FACT (CR 383.4.b):** "When you choose me / a friendly unit" abilities trigger on targeting.
- **Pool:** "can't be chosen" 6 (unit 5 / spell 1 / gear 0 / legend 0 / battlefield 0); "when you choose" triggers 12 (unit 7 / spell 2 / gear 1 / legend 1 / battlefield 1).
- **Examples (can't be chosen):**
  - **Ruin Runner** (SFD-105, unit · cost 6 · 5 Might): "I can't be chosen by enemy spells and abilities."
  - **Akali, Silent** (VEN-038, unit · cost 4+1 power · 4 Might): "I can't be chosen by enemy spells and abilities unless I'm in combat. / When I move to a battlefield, give me +2 [Might] this turn."
  - **Twilight Shroud** (VEN-031, spell · cost 1): "Give a friendly unit +1 [Might] this turn. It can't be chosen by enemy spells and abilities this turn. / [Flow] [2] (You may play this from your trash for its Flow cost. Then banish it.)"
- **Examples (choose triggers):**
  - **Jae Medarda** (SFD-142, unit · cost 5+2 power · 5 Might): "When you choose me with a spell, draw 1."
  - **Spirit Wheel** (SFD-144, gear · cost 2): "When you choose a friendly unit, you may pay [1] and exhaust this to draw 1."
  - **Blade Dancer** (SFD-195, legend): "When you choose a friendly unit, you may exhaust me and pay [Rainbow] to ready it. / When you conquer, you may pay [1] to ready me."
- **Deck-building meaning (HEURISTIC):** removal has a "chooses" flag. Targeted removal is stopped by "can't be chosen" and taxed by Deflect; sweepers ("all", "each") and combat are not. A deck built around one protected unit forces the opponent to have sweepers or bigger combat. "When you choose a friendly unit" payoffs want cheap targeted spells of your own.
- **Modes:** "enemy" = controlled by an opponent (CR 740.1.b). 2v2: a teammate's spells are friendly and can choose your protected unit.

### 4.22 What Radiance added (PN-RAD, CR 2026-10-09)
- **FACT:** three keywords: Deploy (CR 830), Disarm (CR 831), Show Off (CR 832); one token: Bomb (CR 187.12); the word "pick" for non-target choices (CR 355.7); the Copy game action (CR 446); "additional deckbuilding choices" (CR 103.1, used by Neeko, Blending In RAD-167); "No Domain" cards allowed in any deck (CR 103.2.b.5); non-Champion legends added to the Legend Zone by effects (CR 107.4.d.1); multiple Empowered statuses (CR 442.1.c.1, 827.1.c.5).
- **FACT (OV-RAD, CR 718.6.a):** "Equipment Units": the legend Lady of Clockwork RAD-145 turns a gear into a unit; an attached Equipment that becomes a unit detaches. A non-unit Deploy gear that becomes a unit can move like a unit (PN-RAD ruling).
- **DATA (GAL, first set RAD):** {"UNL": 219, "VEN": 166, "OGN": 288, "SFD": 221, "RAD": 167, "OGS": 24} names by first set; the RAD keywords' pool sizes are in 2.26-2.28.
- **Examples (legend-related text):**
  - **Neeko, Blending In** (RAD-167, unit · cost 6+1 power · 4 Might · **errata text** (radiance errata)): "(Neutral cards can go in decks of any Domain.) / If Neeko is in your deck, choose up to 3 different legends in addition to your starting legend. (Different means none match names.) / When you play me, choose one of those Legends and add it to your Legend Zone while I'm on the board."
  - **Heartening Soul** (RAD-040, unit · cost 7+1 power · 7 Might): "When you play me, ready a friendly legend. / Friendly legends have "[Exhaust]: Give a unit +3 [Might] this turn.""
  - **Royal Entourage** (SFD-039, unit · cost 3+1 power · 4 Might): "When you play me, ready or exhaust a legend."
- **Examples (gear becomes a unit):**
  - **Lady of Clockwork** (RAD-145, legend): "At the start of your Main Phase, you may pay [1] to choose a friendly gear. It becomes a unit gear with Might equal to its Energy cost until you choose another gear with me."
  - **Mirror Image** (UNL-200, spell · cost 3+2 power · **errata text** (unleashed errata)): "Choose a unit. Play a ready Reflection unit token to your base. Then do this: It becomes a copy of that unit. Give it [Temporary]. (Kill it at the start of its controller's Beginning Phase, before scoring.)"
  - **Shady Spectacles** (VEN-137, gear · cost 4 · +0 Might bonus): "[Equip] [1][Order] ([1][Order]: Attach this to a unit you control.) / As this is attached to a unit, choose another friendly unit. The equipped unit becomes a copy of that unit for as long as this is attached to it. / Effect text (active only while attached, CR 136): (I am a copy of the chosen unit.)"

### 4.23 Additional turns (CR 734-738)
- **FACT (CR 735, 737):** "take a turn after this" inserts one extra turn for that player without changing turn order.
- **Pool:** 1 (unit 0 / spell 1 / gear 0 / legend 0 / battlefield 0)
- **Example:**
  - **Time Warp** (OGN-122, spell · cost 10+4 power): "Take a turn after this one. Banish this."
- **Deck-building meaning (HEURISTIC):** an extra turn is an extra Hold step, 2 runes, 1 card and a full Main Phase; in multiplayer it also skips two or three opposing turns' worth of responses to your board.

## 5. Mode rules that change what mechanics are worth

All rows FACT from the cited rule; the last column is HEURISTIC.

| Rule difference | 1v1 (CR 487, 488) | FFA3 / FFA4 (CR 489, 490) | 2v2 (CR 491) | Mechanics whose value changes |
|---|---|---|---|---|
| Battlefields on board | 2 | 3 | 3 | Ganking, movement, tokens/go-wide (more places to be), Deploy (more places to put it), Hidden slots |
| Victory Score | 8 | 8 | 11, shared (491.3, 491.8.d) | text points and Hold triggers are a smaller share of 11 than of 8 |
| Final Conquer point needs every battlefield scored this turn (473.1.b) | both | all three | all three, except those the ally occupied at the Scoring Step (491.8.g.1) | Conquer-only decks close worse outside 1v1; Hold effects and "score 1 point" text gain |
| Opponents | 1 | 2 or 3 | 2 | "each opponent" / "opponents" text (16 names) scales; "an opponent" / "choose an opponent" text (29 names) does not; "each player" text (20 names) hits more boards |
| Who may fight | the two players | exactly two players per combat; third parties cannot enter a staged or ongoing combat (449.2.a, 464) | same; teammates cannot enter each other's battlefields (449.2.b) | Shield/Tank defenders face more attackers per round; Ambush only where you have units |
| "Friendly" (740.1.a, 491.8.e) | your objects | your objects | yours and your teammate's | "friendly unit(s)" buffs, readies, protection and Show Off picks reach the teammate (188 names say "friendly"); "you control"/"your" text does not |
| Scoring per battlefield per turn | once per player (472) | once per player | once per team (491.8.b) | two players of one team cannot both score the same battlefield in a round of their turns |
| Acting on another player's turn | Action in showdowns, Reaction any time | same, for all players in turn order | plus any card by invitation on the teammate's turn (491.8.a) | slow spells and units become more flexible in 2v2 |
| XP | own | own | not shared (732) | Hunt/Level need per-player density |
| Hide | at battlefields you control | same | not at the teammate's battlefields (491.8.c.1) | Hidden |
| First turn | second player +1 rune | first player skips first draw, last player +1 rune | same as FFA | ramp matters slightly less for the last player |
| Temporary / "until your next turn" bodies | die after 1 opposing turn | after 2 or 3 opposing turns | after 3 other turns | Temporary tokens block or threaten longer |
| Burn Out (432.2.c) | the opponent gets the point | you choose which opponent | point goes to the opposing team | self-mill is slightly safer in FFA (give the point to the player furthest behind) |

DATA: only 5 names use the word "ally"/"allies" (5 (unit 0 / spell 1 / gear 1 / legend 2 / battlefield 1)): text written for 2v2 is rare, so mode value comes almost entirely from the rules above, not from card text.
- **Examples ("ally" wording):**
  - **Gloomist** (UNL-193, legend): "When you or an ally hold, you may exhaust me to draw 1."
  - **Right of Conquest** (UNL-015, spell · cost 3+1 power): "Draw 1, then draw 1 for each battlefield you or allies control."
  - **Seat of Power** (SFD-217, battlefield): "When you conquer here, draw 1 for each other battlefield you or allies control."
- **Examples ("each opponent" wording):**
  - **Shard of Undoing** (UNL-174, gear · cost 6): "The first time a friendly unit dies during your Beginning Phase each turn, each opponent must kill one of their units."
  - **Brynhir Thundersong** (OGN-026, unit · cost 6 · 5 Might): "When you play me, opponents can't play cards this turn."
  - **Cataclysm** (RAD-084, spell · cost 4+1 power): "Opponents can't play spells this turn. / Move a friendly unit to an occupied enemy battlefield."

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
Regexes are JavaScript/Python compatible, case-insensitive, and run on reminder-stripped text. "own / any" = names that own the keyword / names that mention it at all (DATA, n = 1085). Role ids follow `analysis/roles.mjs`, axis names follow `analysis/axes.mjs` (E = enabler side, P = payoff side). The role column says what the mechanic **usually** gives; rows marked with two roles need the direction words (friendly / enemy / me) to decide. HEURISTIC throughout, except the counts.

| Mechanic (rule) | Keyword field (derived, see 6.1) | Text regex (case-insensitive, on reminder-stripped text) | Pool n (own / any) | Role | Axis |
|---|---|---|---|---|---|
| Accelerate (CR 805) | `keywords[].name == "Accelerate"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Accelerate\]`; any: `\[Accelerate( \d+)?\]` | 31 / 32 | tempo_ready | conquer triggers (E) |
| Action (CR 806) | `keywords[].name == "Action"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Action\]`; any: `\[Action( \d+)?\]` | 100 / 104 | speed=action; combat_trick when it changes Might | spell-slinging (E) |
| Assault (CR 807) | `keywords[].name == "Assault"` with `n` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Assault( \d+)?\]`; any: `\[Assault( \d+)?\]` | 22 / 45 | combat stat (attack); combat_trick when granted "this turn" | attack (Assault) (E); conquer triggers (E) |
| Deathknell (CR 808) | `keywords[].name == "Deathknell"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Deathknell\]`; any: `\[Deathknell( \d+)?\]` | 25 / 31 | value on death; sacrifice fodder | deathknell / sacrifice (E) |
| Deflect (CR 809) | `keywords[].name == "Deflect"` with `n` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Deflect( \d+)?\]`; any: `\[Deflect( \d+)?\]` | 28 / 52 | protection | deflect / being chosen (E); hold triggers (E); solo / alone |
| Ganking (CR 810) | `keywords[].name == "Ganking"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Ganking\]`; any: `\[Ganking( \d+)?\]` | 18 / 43 | movement | movement (E); conquer triggers (E) |
| Hidden (CR 811) | `keywords[].name == "Hidden"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Hidden\]`; any: `\[Hidden( \d+)?\]` | 45 / 50 | speed=hidden (reaction from the next turn, base cost ignored) | hidden / facedown (E) |
| Legion (CR 812) | `keywords[].name == "Legion"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Legion\]`; any: `\[Legion( \d+)?\]` | 8 / 10 | sequencing payoff | legion (second card) (P) |
| Reaction (CR 813) | `keywords[].name == "Reaction"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Reaction\]`; any: `\[Reaction( \d+)?\]` | 81 / 97 | speed=reaction; counterspell / protection / combat_trick by effect | spell-slinging (E) |
| Shield (CR 814) | `keywords[].name == "Shield"` with `n` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Shield( \d+)?\]`; any: `\[Shield( \d+)?\]` | 25 / 41 | combat stat (defence); protection when granted | defend (Shield/Tank) (E); hold triggers (E) |
| Tank (CR 815) | `keywords[].name == "Tank"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Tank\]`; any: `\[Tank( \d+)?\]` | 23 / 32 | protection (redirects combat damage) | defend (Shield/Tank) (E); hold triggers (E) |
| Temporary (CR 816) | `keywords[].name == "Temporary"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Temporary\]`; any: `\[Temporary( \d+)?\]` | 5 / 23 | drawback (cannot hold); fodder | deathknell / sacrifice (E) |
| Vision (CR 817) | `keywords[].name == "Vision"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Vision\]`; any: `\[Vision( \d+)?\]` | 8 / 9 | selection | top-deck (Vision/Predict) (E) |
| Equip (CR 818) | `keywords[].name == "Equip"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Equip\]`; any: `\[Equip( \d+)?\]` | 43 / 43 | buff (permanent stat on a unit); gear | equipment / attach (E); gear matters (E) |
| Quick-Draw (CR 819) | `keywords[].name == "Quick-Draw"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Quick-Draw\]`; any: `\[Quick-Draw( \d+)?\]` | 5 / 6 | combat_trick (reaction-speed attach) | equipment / attach (E) |
| Repeat (CR 820) | `keywords[].name == "Repeat"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Repeat\]`; any: `\[Repeat( \d+)?\]` | 20 / 24 | scaling / energy sink | rune ramp / big energy (P); spell-slinging |
| Weaponmaster (CR 821) | `keywords[].name == "Weaponmaster"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Weaponmaster\]`; any: `\[Weaponmaster( \d+)?\]` | 11 / 12 | equipment carrier (discounted re-equip) | equipment / attach (P) |
| Ambush (CR 822) | `keywords[].name == "Ambush"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Ambush\]`; any: `\[Ambush( \d+)?\]` | 15 / 15 | tempo_ready (reaction-speed reinforcement) | attack (Assault) / defend (E) |
| Hunt (CR 823) | `keywords[].name == "Hunt"` with `n` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Hunt( \d+)?\]`; any: `\[Hunt( \d+)?\]` | 12 / 13 | XP source tied to scoring | XP / Level (E); conquer triggers (P); hold triggers (P) |
| Level (CR 824) | `keywords[].name == "Level"` with `n` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Level( \d+)?\]`; any: `\[Level( \d+)?\]` | 14 / 15 | XP threshold payoff | XP / Level (P) |
| Unique (CR 825) | `keywords[].name == "Unique"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Unique\]`; any: `\[Unique( \d+)?\]` | 3 / 3 | deck constraint only (copy limit 1) | none |
| Backline (CR 826) | `keywords[].name == "Backline"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Backline\]`; any: `\[Backline( \d+)?\]` | 4 / 4 | protection of the carrier itself | defend (Shield/Tank) |
| Empower (CR 827) | `keywords[].name == "Empower"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Empower\]`; any: `\[Empower( \d+)?\]` | 40 / 40 | energy sink / upgrade | empower (E); rune ramp / big energy (P) |
| Empowered (CR 828) | `keywords[].name == "Empowered"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Empowered\]`; any: `\[Empowered( \d+)?\]` | 28 / 42 | payoff gated on Empowered status | empower (P) |
| Flow (CR 829) | `keywords[].name == "Flow"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Flow\]`; any: `\[Flow( \d+)?\]` | 15 / 17 | recursion (spell replays itself from trash) | trash / recursion (P); spell-slinging (E) |
| Deploy (CR 830) | `keywords[].name == "Deploy"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Deploy\]`; any: `\[Deploy( \d+)?\]` | 14 / 18 | battlefield aura / board presence without a unit | deploy / bombs (RAD) (E); gear matters (E) |
| Disarm (CR 831) | `keywords[].name == "Disarm"` with `n` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Disarm( \d+)?\]`; any: `\[Disarm( \d+)?\]` | 8 / 9 | debuff | disarm / shrink (E); attack (Assault) (P) |
| Show Off (CR 832) | `keywords[].name == "Show Off"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Show Off\]`; any: `\[Show Off( \d+)?\]` | 6 / 6 | conditional payoff (reveal or pick) | show off (RAD) (P) |
| Add resources ([Add], CR 430) | none | `\[add\]` | 28 | ramp | rune ramp / big energy (E) |
| Channel runes (CR 431) | none | `\bchannel(s\|ed)?\b` | 33 | ramp | rune ramp / big energy (E) |
| Ready runes | none | `\bready (up to )?(\w+ )?(of your \|friendly \|exhausted )?runes?\b\|ready (your\|all) runes` | 9 | ramp | rune ramp / big energy (E) |
| Rune denial / runes enter exhausted | none | `\bexhaust(s\|ed)? (up to )?(\w+ )?(of your \|friendly \|enemy \|their \|ready )*runes?\b\|runes? (enter\|enters) exhausted\|channel[^.]*exhausted` | 29 | ramp (own) or resource denial (enemy) | rune ramp / big energy |
| Gold gear token | none | `\bgold\b` | 29 | ramp; token_maker (gear) | rune ramp / big energy (E); gear matters (E) |
| Cost reduction | none | `costs? (\[[^\]]+\])+ less\|cost (\[[^\]]+\])+ less\|costs? \d+ less\|reduce (my\|its\|their\|the) cost\|cost[^.]*\bless\b` | 50 | ramp (discount) | rune ramp / big energy; spell-slinging (P) when it names spells |
| Cost increase / tax | none | `costs? (\[[^\]]+\])+( or (\[[^\]]+\])+)? more\b(?! than)\|costs? \d+ more\b\|must pay (\[[^\]]+\])+` | 6 | tax (soft lock) | none |
| Play ignoring cost | none | `ignoring (its\|their\|any and all\|the) (base )?costs?\|without paying` | 23 | cheat (mana) | mighty (5+ Might) / top-end support |
| Counter a spell (CR 426) | none | `\bcounter (an?\|that\|it\|the\|target\|all\|each)\b\|\bcounters? (an?\|that) (enemy )?(spell\|abilit)` | 12 | counterspell | spell-slinging (answer side) |
| Gain control / new choices (CR 750) | none | `new choices\|gain control of (it\|that spell\|a spell)` | 2 | counterspell (redirect) | none |
| Showdown reference (CR 341) | none | `\bshowdowns?\b` | 7 | combat_trick / score_trigger context | none |
| Attack trigger | none | `when (i\|a friendly unit\|one or more friendly units\|you\|another friendly unit\|a unit you control\|an? [a-z]+ unit\|it) (attack\|attacks)\b\|when (i\|a friendly unit) attacks? or defends?` | 41 | score pressure; removal when it deals damage | attack (Assault) (P) |
| Defend trigger | none | `when (i\|a friendly unit\|one or more friendly units\|you\|another friendly unit\|it) (defend\|defends)\b\|attacks? or defends?` | 20 | protection of a hold | defend (Shield/Tank) (P) |
| Win a combat | none | `\bwins? a combat\|\bwon a combat\|win combat` | 8 | combat payoff | attack (Assault) (P) |
| Damage assignment override (Tank/Backline text) | none | `assign(ed\|ing\|s)? (combat )?damage\|must be assigned\|ignore \[(tank\|backline)\]` | 3 | protection / anti-protection | defend (Shield/Tank) |
| Excess damage | none | `excess damage` | 6 | overkill payoff | mighty (5+ Might) (P) |
| Deal damage (CR 418) | none | `\bdeals? (\d+\|x\|damage\|that much\|twice\|double\|\[)` | 99 | removal_damage | spell-slinging; Bonus Damage payoff |
| Bonus Damage (CR 712) | none | `bonus damage` | 7 | damage amplifier | spell-slinging (P) |
| Prevent (CR 438) | none | `\bprevent` | 4 | protection | none |
| +Might | none | `\+\d+ \[(might\|m\|s)\]\|\+\[might\]\|\+x \[might\]` | 149 | combat_trick (spell, this turn) / buff (permanent) | mighty (5+ Might) (E) |
| -Might | none | `-\d+ \[(might\|m\|s)\]\|-x \[might\]\|reduce[^.]*might` | 29 | debuff | disarm / shrink (E) |
| Mighty (CR 706) | none | `\[mighty\]\|\bmighty\b` | 12 | payoff for 5+ Might | mighty (5+ Might) (P) |
| Move (CR 421, 447) | none | `\bmov(e\|es\|ed\|ing)\b` | 109 | movement | movement (E/P) |
| Recall (CR 456) | none | `\brecall` | 14 | protection (save) or tempo removal | none |
| Return to hand (bounce) | none | `return (?![^.]*\btrash\b)[^.]*to (its\|their) owners?'s? hand\|return (?![^.]*\btrash\b)[^.]*to (your\|their\|its owner's) hand\|to their owners' hands` | 32 | removal_bounce (enemy) / replay enabler (own) | none |
| Ready a unit / legend / gear | none | `\bready (me\|it\|them\|an?\|another\|up to\|all\|each\|that\|those\|your\|two\|a friendly\|something)\b(?![^.]{0,12}runes?)` | 59 | tempo_ready | ready / exhaust (E) |
| Enters ready | none | `enters? ready\|play[^.]*\bready\b[^.]*token\|ready [0-9a-z\[\] ]*unit token` | 46 | tempo_ready | conquer triggers (E) |
| Exhaust as an effect | none | `\bexhaust (an?\|another\|up to\|all\|each\|that\|those\|it\|them\|me\|two\|enemy\|a friendly\|friendly)\b` | 35 | tempo removal (exhaust enemy) / cost | ready / exhaust |
| Exhaust-cost ability ([Exhaust]:) | none | `\[exhaust\]\s*:\|\[e\]\s*:\|, \[exhaust\]` | 91 | repeatable engine | ready / exhaust (P) |
| Battlefield-control reference | none | `battlefields? you control\|battlefield you (don\'t )?control\|control (\w+ ){0,3}battlefields?\|uncontrolled\|open battlefield\|enemy battlefield\|battlefields? (an opponent\|your opponents?) controls?` | 28 | position payoff | hold triggers / conquer triggers |
| Conquer (CR 471.1) | none | `\bconquer` | 62 | score_trigger | conquer triggers (P) |
| Hold (CR 471.2) | none | `\bhold(s\|ing)?\b\|\bheld\b` | 50 | score_trigger | hold triggers (P) |
| Points outside scoring | none | `\bscores? \d+ points?\|gains? \d+ points?\|score a point` | 17 | points | win route (see wincons.md) |
| Buff counter (CR 427, 701) | none | `\[buff\]\|\bbuff(s\|ed)?\b` | 53 | buff | buffs (E) |
| Spend a buff | none | `spend (a\|its\|my\|their\|any number of\|\d+\|one\|that\|your\|x)? ?(of )?(its \|my \|their )?buffs?\|spent a buff\|spending` | 12 | buff payoff | buffs (P) |
| Stun (CR 424) | none | `\[stun\]\|\bstun(s\|ned)?\b` | 34 | stun | stun (E) |
| Can't be chosen (CR 756) | none | `can't be chosen` | 6 | protection | deflect / being chosen |
| Kill (CR 429) | none | `\bkill(s\|ed)?\b` | 82 | removal_kill (enemy) / sacrifice (own) | deathknell / sacrifice |
| Kill your own permanent | none | `\bkill (an? \|another \|\d+ \|any number of \|up to \w+ \|two \|one )?(other )?(of your \|friendly )(units?\|gear)\|kill this\|kill me\b\|sacrifice` | 31 | sacrifice outlet | deathknell / sacrifice (P) |
| Dies / would die | none | `\bdies?\b\|\bdied\b\|would die` | 33 | death payoff or death replacement | deathknell / sacrifice (P) |
| Banish (CR 428) | none | `\bbanish` | 36 | removal_kill (no death trigger) / hate_trash / blink | trash / recursion (answer) |
| Recycle (CR 417) | none | `\brecycl` | 47 | selection / hate_trash / deck refill | trash / recursion |
| Trash reference | none | `\btrash(es)?\b` | 49 | recursion / trash payoff | trash / recursion (P) |
| Discard (CR 423) | none | `\bdiscard` | 41 | discard_outlet (self) / hand_attack (opponent) | discard (E) |
| Burn (CR 441) | none | `\[burn( \d+)?\]\|\bburn(s\|ed)?\b(?! out)(?! away)\|put the top (\d+ )?cards? of (your\|their) main deck into (your\|their) trash` | 10 | self-mill / mill | trash / recursion (E) |
| Play from trash (incl. Flow) | none | `\bplay(ed)? [^.,\n]*from (your\|their\|a\|any\|an opponent\'s\|its owner\'s)[^.,\n]*trash\|from your trash[^.\n]*\bplay\b\|\bplay cards from your trash\|\[flow\]\|play (it\|this\|me)( again)? from (your\|the\|their) trash` | 35 | recursion | trash / recursion (P) |
| Return from trash to hand | none | `return[^.\n]*from (your\|a\|any\|their) trash\|from your trash (to\|into) your hand\|draw[^.\n]*from your trash` | 9 | recursion | trash / recursion (P) |
| Facedown / hide reference | none | `face ?down\|\bhide\b\|\bhides\b\|\bhidden\b` | 63 | hidden payoff | hidden / facedown (P) |
| Predict (CR 437) | none | `\[predict( \d+)?\]\|\bpredict` | 14 | selection | top-deck (Vision/Predict) (E) |
| Look at / reveal top of deck | none | `look at the top\|top (\d+ )?cards? of (your\|their\|a\|any) (main )?deck` | 33 | selection | top-deck (Vision/Predict) (P) |
| Draw (CR 414) | none | `\bdraws?\b` | 159 | draw | none |
| Token (any) | none | `\btokens?\b` | 107 | token_maker or token payoff | tokens / go-wide |
| Unit token | none | `unit tokens?\b` | 60 | token_maker | tokens / go-wide (E) |
| Bomb token (RAD) | none | `\bbombs?\b` | 7 | removal_damage (delayed) | deploy / bombs (RAD) |
| Attach / equipped reference | none | `\battach(es\|ed\|ing)?\b\|\bdetach\|\bequipped\b\|\bequips?\b(?!ment)` | 56 | equipment payoff | equipment / attach (P) |
| Gear reference | none | `\bgear\b` | 117 | gear payoff or hate_gear | gear matters (P) |
| Copy (CR 446) | none | `\bcop(y\|ies\|ied)\b` | 6 | clone | none |
| Take control | none | `(take\|gain\|gains\|takes) control of` | 6 | removal (steal) | none |
| XP gain | none | `gains? (\d+\|x\|that much) xp\|\[hunt` | 30 | XP source | XP / Level (E) |
| XP spend | none | `(spend\|pay\|spends) (\d+\|x\|any amount of\|all (of )?your) xp` | 12 | XP sink | XP / Level (P) |
| Spell-matters text | none | `when you play a spell\|whenever you play a spell\|spells you play\|your spells\|next spell\|for each spell\|spell (from\|in) your trash` | 24 | spell payoff | spell-slinging (P) |
| Extra turn (CR 734) | none | `take a turn after\|extra turn\|another turn\|additional turn` | 1 | points / tempo | none |
| Alone / one on one (CR 740.2) | none | `\balone\b\|one on one` | 10 | solo payoff | solo / alone (P) |
| Ally wording (2v2) | none | `\ball(y\|ies)\b\|teammate` | 5 | mode-sensitive | none |

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
