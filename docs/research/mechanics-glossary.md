test own it: **22** (unit 22 / spell 0 / gear 0 / legend 0 / battlefield 0); grant, condition on or reference it without owning it: **22**; total **44**. First set: OGN. Printed values on owners: 1 (no number): 10, 2: 9, 3: 2, 4: 1.
  - **Cleave** (OGN-004, spell · cost 1): "[Action] (Play on your turn or in showdowns.) / Give a unit [Assault 3] this turn. (+3 [Might] while it's an attacker.)"
  - **Daring Poro** (OGN-210, unit · cost 2 · 2 Might): "[Assault] (+1 [Might] while I'm an attacker.)"
  - **Petty Officer** (OGN-215, unit · cost 5 · 5 Might): "[Assault] (+1 [Might] while I'm an attacker.)"
54 (unit 26 / spell 2 / gear 2 / legend 7 / battlefield 17)
| Mechanic (rule) | Keyword field | Text regex (case-insensitive, on reminder-stripped text) | Pool n (own / any) | Role | Axis |
|---|---|---|---|---|---|
| Accelerate (CR 805) | `keywords[].name == "Accelerate"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Accelerate\]`; any: `\[Accelerate( \d+)?\]` | 31 / 32 | tempo_ready | conquer triggers (E) |
| Action (CR 806) | `keywords[].name == "Action"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Action\]`; any: `\[Action( \d+)?\]` | 100 / 104 | speed=action; combat_trick when it changes Might | spell-slinging (E) |
| Assault (CR 807) | `keywords[].name == "Assault"` with `n` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Assault( \d+)?\]`; any: `\[Assault( \d+)?\]` | 22 / 44 | combat stat (attack); combat_trick when granted "this turn" | attack (Assault) (E); conquer triggers (E) |
| Deathknell (CR 808) | `keywords[].name == "Deathknell"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Deathknell\]`; any: `\[Deathknell( \d+)?\]` | 25 / 29 | value on death; sacrifice fodder | deathknell / sacrifice (E) |
| Deflect (CR 809) | `keywords[].name == "Deflect"` with `n` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Deflect( \d+)?\]`; any: `\[Deflect( \d+)?\]` | 28 / 51 | protection | deflect / being chosen (E); hold triggers (E); solo / alone |
| Ganking (CR 810) | `keywords[].name == "Ganking"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Ganking\]`; any: `\[Ganking( \d+)?\]` | 18 / 40 | movement | movement (E); conquer triggers (E) |
| Hidden (CR 811) | `keywords[].name == "Hidden"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Hidden\]`; any: `\[Hidden( \d+)?\]` | 45 / 50 | speed=hidden (reaction from the next turn, base cost ignored) | hidden / facedown (E) |
| Legion (CR 812) | `keywords[].name == "Legion"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Legion\]`; any: `\[Legion( \d+)?\]` | 8 / 10 | sequencing payoff | legion (second card) (P) |
| Reaction (CR 813) | `keywords[].name == "Reaction"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Reaction\]`; any: `\[Reaction( \d+)?\]` | 81 / 97 | speed=reaction; counterspell / protection / combat_trick by effect | spell-slinging (E) |
| Shield (CR 814) | `keywords[].name == "Shield"` with `n` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Shield( \d+)?\]`; any: `\[Shield( \d+)?\]` | 25 / 39 | combat stat (defence); protection when granted | defend (Shield/Tank) (E); hold triggers (E) |
| Tank (CR 815) | `keywords[].name == "Tank"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Tank\]`; any: `\[Tank( \d+)?\]` | 23 / 30 | protection (redirects combat damage) | defend (Shield/Tank) (E); hold triggers (E) |
| Temporary (CR 816) | `keywords[].name == "Temporary"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Temporary\]`; any: `\[Temporary( \d+)?\]` | 5 / 23 | drawback (cannot hold); fodder | deathknell / sacrifice (E) |
| Vision (CR 817) | `keywords[].name == "Vision"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Vision\]`; any: `\[Vision( \d+)?\]` | 8 / 9 | selection | top-deck (Vision/Predict) (E) |
| Equip (CR 818) | `keywords[].name == "Equip"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Equip\]`; any: `\[Equip( \d+)?\]` | 43 / 43 | buff (permanent stat on a unit); gear | equipment / attach (E); gear matters (E) |
| Quick-Draw (CR 819) | `keywords[].name == "Quick-Draw"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Quick-Draw\]`; any: `\[Quick-Draw( \d+)?\]` | 5 / 6 | combat_trick (reaction-speed attach) | equipment / attach (E) |
| Repeat (CR 820) | `keywords[].name == "Repeat"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Repeat\]`; any: `\[Repeat( \d+)?\]` | 20 / 24 | scaling / energy sink | rune ramp / big energy (P); spell-slinging |
| Weaponmaster (CR 821) | `keywords[].name == "Weaponmaster"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Weaponmaster\]`; any: `\[Weaponmaster( \d+)?\]` | 11 / 12 | equipment carrier (discounted re-equip) | equipment / attach (P) |
| Ambush (CR 822) | `keywords[].name == "Ambush"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Ambush\]`; any: `\[Ambush( \d+)?\]` | 15 / 15 | tempo_ready (reaction-speed reinforcement) | attack (Assault) / defend (E) |
| Hunt (CR 823) | `keywords[].name == "Hunt"` with `n` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Hunt( \d+)?\]`; any: `\[Hunt( \d+)?\]` | 12 / 12 | XP source tied to scoring | XP / Level (E); conquer triggers (P); hold triggers (P) |
| Level (CR 824) | `keywords[].name == "Level"` with `n` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Level( \d+)?\]`; any: `\[Level( \d+)?\]` | 14 / 14 | XP threshold payoff | XP / Level (P) |
| Unique (CR 825) | `keywords[].name == "Unique"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Unique\]`; any: `\[Unique( \d+)?\]` | 3 / 3 | deck constraint only (copy limit 1) | none |
| Backline (CR 826) | `keywords[].name == "Backline"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Backline\]`; any: `\[Backline( \d+)?\]` | 4 / 4 | protection of the carrier itself | defend (Shield/Tank) |
| Empower (CR 827) | `keywords[].name == "Empower"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Empower\]`; any: `\[Empower( \d+)?\]` | 40 / 40 | energy sink / upgrade | empower (E); rune ramp / big energy (P) |
| Empowered (CR 828) | `keywords[].name == "Empowered"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Empowered\]`; any: `\[Empowered( \d+)?\]` | 28 / 42 | payoff gated on Empowered status | empower (P) |
| Flow (CR 829) | `keywords[].name == "Flow"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Flow\]`; any: `\[Flow( \d+)?\]` | 15 / 17 | recursion (spell replays itself from trash) | trash / recursion (P); spell-slinging (E) |
| Deploy (CR 830) | `keywords[].name == "Deploy"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Deploy\]`; any: `\[Deploy( \d+)?\]` | 14 / 18 | battlefield aura / board presence without a unit | deploy / bombs (RAD) (E); gear matters (E) |
| Disarm (CR 831) | `keywords[].name == "Disarm"` with `n` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Disarm( \d+)?\]`; any: `\[Disarm( \d+)?\]` | 8 / 9 | debuff | disarm / shrink (E); attack (Assault) (P) |
| Show Off (CR 832) | `keywords[].name == "Show Off"` | own: `(^\|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[Show Off\]`; any: `\[Show Off( \d+)?\]` | 6 / 6 | conditional payoff (reveal or pick) | show off (RAD) (P) |
| Add resources ([Add], CR 430) | none | `\[add\]` | 28 | ramp | rune ramp / big energy (E) |
| Channel runes (CR 431) | none | `\bchannel(s\|ed)?\b` | 32 | ramp | rune ramp / big energy (E) |
| Ready runes | none | `\bready (up to )?(\w+ )?(of your \|friendly \|exhausted )?runes?\b\|ready (your\|all) runes` | 9 | ramp | rune ramp / big energy (E) |
| Rune denial / runes enter exhausted | none | `\bexhaust(s\|ed)? (up to )?(\w+ )?(of your \|friendly \|enemy \|their \|ready )*runes?\b\|runes? (enter\|enters) exhausted\|channel[^.]*exhausted` | 28 | ramp (own) or resource denial (enemy) | rune ramp / big energy |
| Gold gear token | none | `\bgold\b` | 27 | ramp; token_maker (gear) | rune ramp / big energy (E); gear matters (E) |
| Cost reduction | none | `costs? (\[[^\]]+\])+ less\|cost (\[[^\]]+\])+ less\|costs? \d+ less\|reduce (my\|its\|their\|the) cost\|cost[^.]*\bless\b` | 50 | ramp (discount) | rune ramp / big energy; spell-slinging (P) when it names spells |
| Cost increase / tax | none | `costs? (\[[^\]]+\])+ more\|cost[^.]*\bmore\b(?! than)` | 15 | tax (soft lock) | none |
| Play ignoring cost | none | `ignoring (its\|their\|any and all\|the) (base )?costs?\|without paying` | 23 | cheat (mana) | mighty (5+ Might) / top-end support |
| Counter a spell (CR 426) | none | `\bcounter (an?\|that\|it\|the\|target\|all\|each)\b\|\bcounters? (an?\|that) (enemy )?(spell\|abilit)` | 12 | counterspell | spell-slinging (answer side) |
| Gain control / new choices (CR 750) | none | `new choices\|gain control of (it\|that spell\|a spell)` | 2 | counterspell (redirect) | none |
| Showdown reference (CR 341) | none | `\bshowdowns?\b` | 7 | combat_trick / score_trigger context | none |
| Attack trigger | none | `when (i\|a friendly unit\|one or more friendly units\|you\|another friendly unit\|a unit you control\|an? [a-z]+ unit\|it) (attack\|attacks)\b\|when (i\|a friendly unit) attacks? or defends?` | 39 | score pressure; removal when it deals damage | attack (Assault) (P) |
| Defend trigger | none | `when (i\|a friendly unit\|one or more friendly units\|you\|another friendly unit\|it) (defend\|defends)\b\|attacks? or defends?` | 18 | protection of a hold | defend (Shield/Tank) (P) |
| Win a combat | none | `\bwins? a combat\|\bwon a combat\|win combat` | 8 | combat payoff | attack (Assault) (P) |
| Damage assignment override (Tank/Backline text) | none | `assign(ed\|ing\|s)? (combat )?damage\|must be assigned\|ignore \[(tank\|backline)\]` | 3 | protection / anti-protection | defend (Shield/Tank) |
| Excess damage | none | `excess damage` | 5 | overkill payoff | mighty (5+ Might) (P) |
| Deal damage (CR 418) | none | `\bdeals? (\d+\|x\|damage\|that much\|twice\|double\|\[)` | 95 | removal_damage | spell-slinging; Bonus Damage payoff |
| Bonus Damage (CR 712) | none | `bonus damage` | 6 | damage amplifier | spell-slinging (P) |
| Prevent (CR 438) | none | `\bprevent` | 4 | protection | none |
| +Might | none | `\+\d+ \[(might\|m\|s)\]\|\+\[might\]\|\+x \[might\]` | 145 | combat_trick (spell, this turn) / buff (permanent) | mighty (5+ Might) (E) |
| -Might | none | `-\d+ \[(might\|m\|s)\]\|-x \[might\]\|reduce[^.]*might` | 29 | debuff | disarm / shrink (E) |
| Mighty (CR 706) | none | `\[mighty\]\|\bmighty\b` | 12 | payoff for 5+ Might | mighty (5+ Might) (P) |
| Move (CR 421, 447) | none | `\bmov(e\|es\|ed\|ing)\b` | 106 | movement | movement (E/P) |
| Recall (CR 456) | none | `\brecall` | 13 | protection (save) or tempo removal | none |
| Return to hand (bounce) | none | `return[^.]*to (its\|their) owners?'s? hand\|return[^.]*to (your\|their\|its owner's) hand\|to their owners' hands` | 41 | removal_bounce (enemy) / replay enabler (own) | none |
| Ready a unit / legend / gear | none | `\bready (me\|it\|them\|an?\|another\|up to\|all\|each\|that\|those\|your\|two\|a friendly\|something)\b(?![^.]{0,12}runes?)` | 59 | tempo_ready | ready / exhaust (E) |
| Enters ready | none | `enters? ready\|play[^.]*\bready\b[^.]*token\|ready [0-9a-z\[\] ]*unit token` | 46 | tempo_ready | conquer triggers (E) |
| Exhaust as an effect | none | `\bexhaust (an?\|another\|up to\|all\|each\|that\|those\|it\|them\|me\|two\|enemy\|a friendly\|friendly)\b` | 34 | tempo removal (exhaust enemy) / cost | ready / exhaust |
| Exhaust-cost ability ([Exhaust]:) | none | `\[exhaust\]\s*:\|\[e\]\s*:\|, \[exhaust\]` | 91 | repeatable engine | ready / exhaust (P) |
| Battlefield-control reference | none | `battlefields? you control\|battlefield you (don\'t )?control\|control (\w+ ){0,3}battlefields?\|uncontrolled\|open battlefield\|enemy battlefield\|battlefields? (an opponent\|your opponents?) controls?` | 28 | position payoff | hold triggers / conquer triggers |
| Conquer (CR 471.1) | none | `\bconquer` | 54 | score_trigger | conquer triggers (P) |
| Hold (CR 471.2) | none | `\bhold(s\|ing)?\b\|\bheld\b` | 46 | score_trigger | hold triggers (P) |
| Points outside scoring | none | `\bscores? \d+ points?\|gains? \d+ points?\|\byou score\b\|score a point\|\bpoints?\b` | 26 | points | win route (see wincons.md) |
| Buff counter (CR 427, 701) | none | `\[buff\]\|\bbuff(s\|ed)?\b` | 52 | buff | buffs (E) |
| Spend a buff | none | `spend (a\|its\|my\|their\|any number of\|\d+\|one\|that\|your\|x)? ?(of )?(its \|my \|their )?buffs?\|spent a buff\|spending` | 12 | buff payoff | buffs (P) |
| Stun (CR 424) | none | `\[stun\]\|\bstun(s\|ned)?\b` | 34 | stun | stun (E) |
| Can't be chosen (CR 756) | none | `can't be chosen` | 6 | protection | deflect / being chosen |
| Kill (CR 429) | none | `\bkill(s\|ed)?\b` | 81 | removal_kill (enemy) / sacrifice (own) | deathknell / sacrifice |
| Kill your own permanent | none | `\bkill (an? \|another \|\d+ \|any number of \|up to \w+ \|two \|one )?(other )?(of your \|friendly )(units?\|gear)\|kill this\|kill me\b\|sacrifice` | 31 | sacrifice outlet | deathknell / sacrifice (P) |
| Dies / would die | none | `\bdies?\b\|\bdied\b\|would die` | 32 | death payoff or death replacement | deathknell / sacrifice (P) |
| Banish (CR 428) | none | `\bbanish` | 36 | removal_kill (no death trigger) / hate_trash / blink | trash / recursion (answer) |
| Recycle (CR 417) | none | `\brecycl` | 47 | selection / hate_trash / deck refill | trash / recursion |
| Trash reference | none | `\btrash(es)?\b` | 49 | recursion / trash payoff | trash / recursion (P) |
| Discard (CR 423) | none | `\bdiscard` | 40 | discard_outlet (self) / hand_attack (opponent) | discard (E) |
| Burn (CR 441) | none | `\[burn( \d+)?\]\|\bburn(s\|ed)?\b(?! out)` | 9 | self-mill / mill | trash / recursion (E) |
| Play from trash (incl. Flow) | none | `play[^.\n]*from (your\|their\|a\|any\|an opponent\'s\|its owner\'s)[^.\n]*trash\|from your trash[^.\n]*play\|\[flow\]` | 40 | recursion | trash / recursion (P) |
| Return from trash to hand | none | `return[^.\n]*from (your\|a\|any\|their) trash\|from your trash (to\|into) your hand\|draw[^.\n]*from your trash` | 9 | recursion | trash / recursion (P) |
| Facedown / hide reference | none | `face ?down\|\bhide\b\|\bhides\b\|\bhidden\b` | 63 | hidden payoff | hidden / facedown (P) |
| Predict (CR 437) | none | `\[predict( \d+)?\]\|\bpredict` | 14 | selection | top-deck (Vision/Predict) (E) |
| Look at / reveal top of deck | none | `look at the top\|top (\d+ )?cards? of (your\|their\|a\|any) (main )?deck` | 33 | selection | top-deck (Vision/Predict) (P) |
| Draw (CR 414) | none | `\bdraws?\b` | 156 | draw | none |
| Token (any) | none | `\btokens?\b` | 104 | token_maker or token payoff | tokens / go-wide |
| Unit token | none | `unit tokens?\b` | 59 | token_maker | tokens / go-wide (E) |
| Bomb token (RAD) | none | `\bbombs?\b` | 7 | removal_damage (delayed) | deploy / bombs (RAD) |
| Attach / equipped reference | none | `\battach(es\|ed\|ing)?\b\|\bdetach\|\bequipped\b\|\bequips?\b(?!ment)` | 56 | equipment payoff | equipment / attach (P) |
| Gear reference | none | `\bgear\b` | 115 | gear payoff or hate_gear | gear matters (P) |
| Copy (CR 446) | none | `\bcop(y\|ies\|ied)\b` | 6 | clone | none |
| Take control | none | `(take\|gain\|gains\|takes) control of` | 6 | removal (steal) | none |
| XP gain | none | `gains? (\d+\|x\|that much) xp\|\[hunt` | 29 | XP source | XP / Level (E) |
| XP spend | none | `(spend\|pay\|spends) (\d+\|x\|any amount of\|all (of )?your) xp` | 12 | XP sink | XP / Level (P) |
| Spell-matters text | none | `when you play a spell\|whenever you play a spell\|spells you play\|your spells\|next spell\|for each spell\|spell (from\|in) your trash` | 23 | spell payoff | spell-slinging (P) |
| Extra turn (CR 734) | none | `take a turn after\|extra turn\|another turn\|additional turn` | 1 | points / tempo | none |
| Alone / one on one (CR 740.2) | none | `\balone\b\|one on one` | 10 | solo payoff | solo / alone (P) |
| Ally wording (2v2) | none | `\ball(y\|ies)\b\|teammate` | 5 | mode-sensitive | none |
