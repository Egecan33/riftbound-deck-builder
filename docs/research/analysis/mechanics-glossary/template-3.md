
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
