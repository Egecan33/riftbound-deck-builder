
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

Examples for the game actions that have no entry of their own in section 4 (verbatim, DATA GAL):
- **Predict:**
{{ex:sys:predict}}
- **Prevent:**
{{ex:sys:prevent}}
- **Double / Swap:**
{{ex:sys:double}}
- **Heal:**
{{ex:sys:heal}}
- **Reveal:**
{{ex:sys:reveal}}
