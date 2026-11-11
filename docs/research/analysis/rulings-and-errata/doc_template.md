# Rulings, errata and rules changes as synced data (mechanics ground truth, fetched 2026-11-11)

Scope: everything official that changes what a card does or how cards interact, beyond the printed text: card errata, FAQ rulings, and Core Rules patch notes, for Origins (OGN), Proving Grounds (OGS), Spiritforged (SFD), Unleashed (UNL), Vendetta (VEN) and Radiance (RAD). Deck-construction rules are in `rules.md` and are not repeated here.

Labels: **FACT** = stated by a primary source (URL or rule number given). **DATA** = measured (dataset and n named). **HEURISTIC** = our reading. **UNCONFIRMED** = no primary source found.

Rule numbers are from the current Core Rules, edition 2026-10-09 (CR; URL in `rules.md` section 0; text cached at `analysis/raw/core-rules-2026-10-09.compact.txt`). A number written as "old 735.1.c" is a number quoted inside an older article and is not valid today. Card codes after card names are added by `analysis/rulings-and-errata/assemble.py` from the official gallery snapshot of 2026-11-11 (1408 printings); card text in section 1 is copied by script from the errata articles and the gallery, never typed by hand.

## 0. Sources

All fetched 2026-11-11 with `analysis/rulings-and-errata/fetch-official.mjs` (serial, 2 s apart), text extracted from each page's embedded JSON by `extract.py` into `analysis/rulings-and-errata/raw/*.txt`. `rev` is the CMS revision value in the page data on the fetch date. It is not unique per article (ERR-OGN, PN-OGN and PN-SFD share one value), so change detection must use the hash of the extracted text (`manifest.json`, column `text sha256`, first 16 hex digits).

| Key | Article | Published (UTC) | rev | text sha256 | URL |
|---|---|---|---|---|---|
<<SOURCES>>

Completeness check. **DATA** (official sitemap https://playriftbound.com/sitemap_index.xml, en-us, 138 URLs, fetched 2026-11-11; list in `raw/sitemap-en-us.txt`): the 15 articles above are every en-us news URL whose slug contains errata, faq (rules), or patch-notes. There is no separate Proving Grounds errata article; the two Proving Grounds cards with errata (Dark Child, Starter; Highlander) are inside the Origins errata article. The other rules-relevant articles (ban lists, Tournament Rules changelogs, start-of-game test) are covered in `rules.md`.

Precedence. **FACT** (FAQ-RAD, FAQ-VEN, same wording): "In places where the FAQ differs from the Core Rules Document, the FAQ takes precedence. When a new Core Rules Document is released, it will take precedence over any points that differ from this document." Consequence on 2026-11-11:

1. FAQ-RAD (2026-10-26) is newer than CR 2026-10-09 and wins over it.
2. CR 2026-10-09 wins over every older FAQ (Origins, Spiritforged, Unleashed, Vendetta). Older FAQ rulings are still correct where the CR says the same thing; several were reversed (section 2.10).
3. Card errata are separate from rules precedence: the latest errata text of a card is its text.

Official card text ("Watcher"). **FACT** (TR 420.2): "A player may call a judge at any time to get the Watcher wording for any card". **FACT** (FAQ-OGN, FAQ-SFD): Watcher is the planned database of official wordings; FAQ-SFD (2026-01-14) says "These plans are still in the works". **UNCONFIRMED**: no public Watcher endpoint was found on playriftbound.com on 2026-11-11 (not in the sitemap, not linked from the Rules Hub). Until it exists, the errata articles are the only primary source of corrected text.

Local copies. `~/github_repositories/GameLab/docs/research/official-faq/*` and `docs/research/rulings/*` were fetched 2026-09-06. They contain no Radiance material and their errata ledger (`rulings/errata.md`, 65 cards) misses Keeper of Masks and the four Radiance errata. This file supersedes that ledger.

Third text source. **DATA** (`cr_quotes.py`, `out/cr-quotes.json`): the Core Rules quote card text in their examples ("X reads ..."). 127 such quotes naming 101 gallery cards were extracted from CR 2026-10-09 and compared (keyword brackets and symbols normalised). For the cards with errata, 16 quotes of 12 cards give the errata text and 0 give the pre-errata text: {{Teemo, Strategist}}, {{Rek'Sai, Swarm Queen}}, {{Targon's Peak}}, {{Zhonya's Hourglass}}, {{Deathgrip}}, {{Nocturne, Horrifying}}, {{Wraith of Echoes}}, {{Sona, Harmonious}}, {{Tideturner}}, {{Ravenborn Tome}}, {{Astral Heron}}, {{Rengar, Trophy Hunter}} (rule numbers per quote in the JSON). The CR is therefore usable as a cross-check that an erratum is in force, and as a detector of rewordings that no errata article lists (one found: section 2.1 P14). The 29 quotes on non-errata cards that match no gallery printing were read by hand (recounted in the verification pass): 16 are the script attaching a quote to the wrong card name or cutting the quote short, 8 are symbol or keyword formatting, 3 are small non-functional wording drifts between the CR and the gallery (Here to Help "from your hand" / "from hand"; Lillia, Fae Fawn "Sprite token" / "Sprite unit token"; Loose Cannon "At the start of" / "At start of"), and 2 are the Draven wording of P14. The script's card attribution is therefore wrong for at least 16 of 127 quotes; an independent extraction (verification log) found 202 quoted texts in the CR, 108 of them attributable to a gallery card.

Complete FAQ index. **DATA** (`faq_index.py`, `out/faq-rulings.json`): the five FAQ articles contain 180 question blocks (FAQ-OGN 90, FAQ-SFD 27, FAQ-UNL 13, FAQ-VEN 34, FAQ-RAD 16). Each is stored with article, date, section, question, full answer, the "Relevant rules" numbers as printed, and the gallery cards it names (167 distinct cards; 60 blocks name no card). Card matching is by full card name and is a **HEURISTIC** (legends match by title; a few generic words such as Vilemaw produce false matches). Section 2 summarises the rulings that change an interaction. **The index is not complete** (verification log): it holds only bold question blocks, so it misses the seven "Revised and Clarified Rulings" sections of FAQ-UNL (Triggered Abilities, Control of Battlefields and Showdowns, Mandatory Actions and Private Information, Lethal Damage Modification, Control of Battlefield Abilities, Legion, Results of Combat), one FAQ-UNL question that is not set in bold (rule 187.4.c, hold-on-death examples), and the 10 official ruling blocks at the top of PN-RAD ("Unique Radiance Interactions"). A sync job must diff the extracted article text (`raw/*.txt`), not only this JSON.

## 1. Errata table

**FACT**: 67 errata blocks in the five errata articles (31 + 16 + 8 + 8 + 4), covering 67 distinct cards (no card appears in two errata articles). Three more cards were given revised text only in FAQ-OGN (2025-10-16) and are absent from ERR-OGN (2025-10-28): Unyielding Spirit, Symbol of the Solari, Wraith of Echoes. Total 70 rows.

Standing of those three. **FACT** for Wraith of Echoes: CR 383.1.b (edition 2026-10-09) quotes the card as "The first time another friendly unit dies each turn, draw 1.", so the revised wording is in force. **UNCONFIRMED** for Unyielding Spirit and Symbol of the Solari: ERR-OGN says "the Core Rules FAQ is now obsolete and will be retired on November 4, 2025" and does not list them, and the current CR does not quote either card (0 occurrences of either name), so their revised wording has no standing source after that date. Treat the FAQ text as the working text, flagged `status: "faq-only"`; the article is still online on 2026-11-11.

Effective date. **HEURISTIC**: no errata article states an effective date other than its publication; the table uses the publication date (UTC). FAQ-SFD says its clarifications "take effect immediately". ERR-RAD was published 2026-10-09, two weeks before Radiance released (2026-10-23).

Gallery check. **DATA** (gallery snapshot 2026-11-11, compared by `build_errata.py`; symbols normalised: `[S]`=`[M]`, `[T]`=`[E]`, quotes, whitespace). Status per printing: `NEW` = gallery shows the errata text; `OLD` = gallery shows the pre-errata text exactly; `NEW~` = same as errata text once reminder text in brackets is removed. The comparison uses the image alt text. **Caveat (verification log)**: for 23 printings the alt text and the rich-text field of the same gallery item disagree on Power symbols (alt `[C]`, rich text `:rb_rune_rainbow:` = `[A]`, or symbols missing in the alt text): The Boss (3 printings), Daughter of the Void (3), Swift Scout (3), Bullet Time, Danger Zone, Forgefire Cape, Rabadon's Deathcrown, Shurelya's Requiem, Spinning Axe, Atakhan, the six Decree cards, Twisted Fate. The errata article writes The Boss's cost as `[C]`. **UNCONFIRMED** which gallery field is right for these cards; a parser must not take a Power cost's domain from one field alone.

<<ERRATA_SUMMARY>>

Reading: the gallery is not an errata source. It was corrected in place for <<REFLECT_LIST>>, and otherwise shows corrected text only on printings made after the errata; 56 cards still show only the pre-errata text, including all four Radiance errata. A deterministic tool must apply an errata overlay by full card name to every printing.

Source keys are the article keys of section 0 followed by the block number inside that article. The gallery names a legend by its title only: the errata article's "Leblanc, Deceiver" is gallery "Deceiver", "Dark Child, Starter" is gallery name "Dark Child".

<<ERRATA_TABLE>>

### 1.1 Which errata change behaviour

**HEURISTIC** classification (ours, from reading old against new text plus the FAQ explanation where one exists). `F` = functional: a parser that reads the old text computes a different outcome. `T` = template only: same outcome, different wording, but the new wording moves the card to a different parse pattern.

| Class | Cards | What changes |
|---|---|---|
| F: targets and Deflect | {{Falling Star}}, {{Icathian Rain}} | All targets chosen when played (no reflexive triggers); the same unit may be chosen several times and Deflect is paid per choice (CR 809.1.c) |
| F: "another" added | {{Kato the Arm}}, {{Wraith of Echoes}} (faq-only) | Cannot affect or count itself |
| F: "a friendly unit" (was "another") | {{Elnuk Herd}} | May now give the +3 to itself |
| F: "up to" added | {{Sona, Harmonious}}, {{Targon's Peak}}, {{Dark Child, Starter}}, {{Kinkou Monk}}, {{Janna, Savior}}, {{Salvage}}, {{Relentless Pursuit}}, {{Neeko, Blending In}} | A triggered ability needs every required target to go on the chain (FAQ-SFD, Janna); "up to" lets it trigger with fewer |
| F: owner / base wording | {{Portal Rescue}}, {{The Syren}}, {{Unforgiven}}, {{Tideturner}} | Portal Rescue gives a stolen unit back to its owner; the others clarify "its base" |
| F: banish-then-play | {{Baited Hook}}, {{Blind Fury}}, {{Dazzling Aurora}}, {{Promising Future}}, {{Reinforce}}, {{Rek'Sai, Swarm Queen}}, {{Void Burrower}}, {{Void Rush}}, {{Nocturne, Horrifying}} | A card that cannot be played stays banished instead of going back to the deck; Nocturne also works on "reveal" and is not a triggered ability |
| F: replacement instead of trigger; heals | {{Zhonya's Hourglass}}, {{Highlander}}, {{Unlicensed Armory}}, {{The Boss}} | Saved unit is healed, exhausted, recalled; Zhonya's applies on any turn and anywhere |
| F: reflexive trigger ("do this:") | {{Dragon's Rage}}, {{Disintegrate}}, {{Arise!}}, {{Rell, Magnetic}}, {{Guards!}}, {{Leblanc, Deceiver}}, {{Keeper of Masks}}, {{Mirror Image}}, {{Bone Skewer}}, {{Death from Below}} | Second part is a separate chain item that can be reacted to and only exists if the first part happened |
| F: cost within instructions ("pay X to ...") | {{Draven, Vanquisher}}, {{Emperor's Dais}}, {{Diana, Lunari}} | Payment moves from resolution to finalization (CR 383.3.b); an "if you do" clause no longer exists to be negated |
| F: "this turn" added | {{Convergent Mutation}}, {{Dune Drake}}, {{Ravenborn Tome}}, {{Blood Rush}}, {{Gangplank, Naval}}, {{Astral Heron}} | Effect no longer permanent or open-ended |
| F: scope narrowed | {{Void Gate}} (only units there), {{Karma, Channeler}} (own Main Deck only), {{Teemo, Strategist}} (one target, defend trigger only), {{Ava Achiever}} ("here" only for units), {{Pack of Wonders}} (facedown card on board), {{Symbol of the Solari}} (faq-only: that battlefield only), {{Unyielding Spirit}} (faq-only) | See rows |
| F: scope widened | {{Jax, Unmatched}} (Equipment everywhere), {{Yone, Blademaster}} (any battlefield that was uncontrolled, including surprise defense), {{Rengar, Trophy Hunter}} and {{Stalking Wolf}} (the extra play location now uses Ambush, so it comes with Reaction timing) | See rows |
| F: other | {{Tianna Crownguard}} ("gain points": conquer and hold still happen and still trigger), {{Deathgrip}} (killed unit is a target, bonus only if it died), {{Sigil of the Storm}} ("must": no target, cannot be answered by recycling the rune), {{Fizz, Trickster}} and {{Forbidden Technique}} ("Then recycle/banish" is a replacement effect, CR 829.1.b pattern) | See rows |
| F: other | {{The Dreaming Tree}} | Any player who chooses a friendly unit there with a spell draws, not only the battlefield's controller |
| T | {{Clockwork Keeper}} (now a normal play effect with a condition), {{Edge of Night}}, {{Last Caress}}, {{Resonating Strike}} (reminder text of Reaction corrected), {{Salvage}} wording aside | Same outcome; Clockwork Keeper moves to a different parse pattern |

## 2. Rulings that change interactions or valuation

Columns: **Rule** = current CR number where we found the rule in the 2026-10-09 text, otherwise the article that states it. **Graph** = consequence for the interaction graph: `EDGE+` creates or confirms an edge, `EDGE-` removes a supposed combo, `STR+` / `STR-` changes how strong an interaction is, `PARSE` = a reading rule the text parser must implement.

### 2.1 Reading card text (parser rules)

| ID | Ruling | Rule / source | Graph |
|---|---|---|---|
| P1 | "Card" in card text means Main Deck card. Runes, legends, battlefields and tokens are not cards. Legion is not turned on by playing a token or using an ability; hiding a card is not playing it | CR 052; CR 185; CR 812.1.b.1; FAQ-OGN | PARSE. EDGE- for "token maker enables Legion" |
| P2 | "Play" has three meanings. In a trigger condition ("When you play ...") it means the card resolved; a countered card does not trigger it. In any other check ("for each card you've played", Legion) it means the card was finalized; a countered card still counts. As an instruction ("play a unit") it means put it on the chain | CR 420.4.a, 420.4.a.1, 420.4.b; CR 420.5 (instruction sense); PN-VEN | PARSE. A counterspell stops play triggers but not Legion or cost-reduction counts |
| P3 | "Friendly" = controlled by you or, in 2v2, by your teammate. "Your" = only what you control or own. Control of battlefields is never shared | CR 491.8.e, 491.8.c; FAQ-OGN | PARSE. In 2v2 "friendly unit" effects reach the teammate's units; "your units" effects do not |
| P4 | "Choose" targets. "Pick" does not target (wording introduced in Radiance; older cards still say "choose" for both). Not targets: things in non-public zones, objects named only as a restriction or cost or trigger condition or replacement, "all" objects, objects chosen by other players, anything in a "must" instruction, "your legend" | CR 355.7 (choose targets, pick does not); CR 355.10.a to 355.10.g; PN-RAD "Pick". **DATA**: in the gallery "pick" occurs only in the Show Off reminder text of 6 Radiance cards | PARSE. Deflect, untargetability and Hidden location limits only apply to targets |
| P5 | A triggered ability has up to four leading parts that are not on the chain: trigger condition, an "if" condition right after it, "you may", and a cost ("do X to do Y"). A cost in that position is paid at finalization and is the ability's base cost. The same words later in the sentence are part of the effect and are paid or checked at resolution | CR 383.2.a.1 ("if" part), 383.3.a ("you may"), 383.3.b (cost); FAQ-UNL "Triggered Abilities"; PN-VEN | PARSE. Decides whether the opponent can react before payment |
| P6 | "Pay X to do Y" is a cost: it counts as paid even if the paid action is replaced. "Do X. If you do, Y" is not a cost: if X is replaced or does not happen, Y does not happen | CR 203.2; FAQ-UNL | PARSE. Death-replacement cards (Zhonya's, Unlicensed Armory) keep cost-style effects alive but switch off "if you do" effects |
| P7 | An effect that asks for a card's cost gets the printed cost, never the reduced or increased one. A token's cost is 0 | CR 206; CR 185.3.a.1 | PARSE. "Costs N or more/less" checks are static per card |
| P8 | Unavailable numbers are null, not 0. A unit that left the board has no Might to read | PN-OGN "Null Isn't Zero"; FAQ-OGN (Baited Hook) | EDGE- for Baited Hook plus saving the killed unit |
| P9 | Might below 0 counts as 0 for effects and combat damage, but the real value is kept for later increases. A unit with 0 or less Might does not die by itself; it dies to 1 damage | CR 143.2.c; CR 142.4.b; FAQ-SFD | PARSE. Might reduction is not removal |
| P10 | An ability that references "this battlefield", "here", "my" is read when it resolves. Information taken from the trigger condition itself ("the battlefield I moved to or from", "where I held") is fixed when it triggers | FAQ-VEN (Iascylla, Azir, Akali); CR 359.3.f | PARSE |
| P11 | Dependent keywords (`[Legion][>]`, `[Level N][>]`, `[Empowered][>]`): the whole line after the arrow is switched off until the condition holds, but other effects can still read it | CR 812.1.b; CR 828.1.b, 828.1.c; FAQ-VEN (Heimerdinger) | PARSE. EDGE+ {{Heimerdinger, Inventor}} gains the exhaust ability of an unempowered {{Defender of Tomorrow}} |
| P12 | Printed rules text of an attached Equipment is inactive; text granted to it is active | CR 135.4, 135.4.a; FAQ-UNL (Turn to Dust) | EDGE+ {{Turn to Dust}} kills an attached Equipment at its controller's next Beginning Phase |
| P13 | A facedown card has no readable front: no name, cost, Might or keywords, and it is not "a card with Hidden". It can still be targeted as "a facedown card" because its presence is public | CR 129.4; CR 811.5.a; CR 107.3.f; FAQ-OGN appendix; PN-RAD (Gutter Guardian) | EDGE- {{Gutter Guardian}} cannot Show Off a facedown card. EDGE+ {{Pack of Wonders}} can return one |
| P14 | "Score N point(s)" as a card instruction means gain points by an effect, not Score in the rules sense (conquer or hold). Such points do not need a battlefield, do not trigger conquer or hold abilities, and are exempt from the final-point restriction. **DATA** (list corrected in the verification pass: Trinity Force was missing, and Otterpus was listed although its text is a replacement of rules scoring, "If a player would score 1 point from conquering or holding during their first or second turn, they draw 1 instead"): 15 gallery cards use "score 1 point" as an effect (gallery snapshot 2026-11-11, text search: Ahri, Alluring; Bottled Constellation; Cosmic Vista; Draven, Audacious; Evelynn, In Control; Ivern, Friend to All; Nasus, Ascended; Power Nexus; Renata Glasc, Mastermind; Shen, Leader of the Kinkou Order; Swain, Visionary; Trinity Force (in the Equipment `effect` field); Tryndamere, Barbarian; Yasuo, Windrider; Zero Point Inflection), 1 uses "gains 1 point" (The Arena's Greatest). CR 429.1.a.1.b and 808.1.d.1 quote {{Draven, Audacious}} as "They gain 1 point" where both gallery printings say "They score 1 point": **UNCONFIRMED** whether this is an unpublished rewording; no errata article lists it. Same direction as the Tianna Crownguard erratum ("can't gain points") | CR 194.1.c; CR 473.1.a.1; CR 472; ERR-SFD (Tianna) | PARSE: map card-text "score N point" to the gain-points effect family. STR+ for these cards at Victory Score minus 1 |

### 2.2 Costs: Deflect, discounts, payment

| ID | Ruling | Rule / source | Graph |
|---|---|---|---|
| C1 | Deflect is paid once for each time the spell or ability chooses the unit. Several Deflect sources on one unit add up. Any domain of Power pays it | CR 809.1.c, 809.1.c.1, 809.2 | STR- for multi-choice spells into Deflect: {{Icathian Rain}} choosing one Deflect unit six times costs six Deflect payments |
| C2 | Deflect is a mandatory additional cost, not an optional one. {{Ezreal, Prodigy}} reduces only optional additional costs (Repeat, Accelerate), not Deflect and not Equip | CR 356.2.a.2; CR 809.1.d; FAQ-SFD | EDGE- Ezreal plus Deflect. EDGE+ Ezreal plus Repeat or Accelerate |
| C3 | A triggered ability that would have to pay Deflect can be declined; it then fails to finalize | PN-OGN "Pending and Finalizing" | STR+ for Deflect units against trigger-based removal |
| C4 | While a spell or ability chooses a unit at {{Heisho, Shell of the World}}, Deflect is ignored for that whole spell, including on its other targets elsewhere | CR 766, 767; FAQ-VEN | EDGE+ Heisho plus multi-target spells against Deflect units |
| C5 | Repeat's cost is not reduced by a reduction of the spell's cost, and a self-reduction applies once | FAQ-SFD (Find Your Center with Temporal Portal: final cost 4) | STR- |
| C6 | Discounts that name one cost component apply when that component is added, before general discounts | PN-UNL "Discounts to Cost Components" | PARSE |
| C7 | Paying Energy or Power is always optional when an effect instructs it; declining negates only that instruction | CR 445.2; PN-VEN | PARSE |
| C8 | `[C]` on a card with two domains must be paid with Power of one of those domains (signature cards). Before 2026-07-24 any domain worked | CR 135.2.e.6.c; PN-VEN | STR- for signature cards in decks whose rune split is uneven. Meta discount: see section 3 |
| C9 | Energy and Power are paid before other costs such as "kill a unit" | CR 357.1, 357.2; FAQ-RAD | EDGE- the unit {{Atakhan}} kills as its additional cost is not yet in the trash when his Power is paid, so {{Mordekaiser, Iron Revenant}} cannot banish it for that payment |
| C10 | "Play me for X" is an alternate cost replacing the base cost; resources restricted to "playing units" can pay it | FAQ-RAD | EDGE+ {{Meticulous Restorationist}} from trash paid through Mordekaiser, Iron Revenant |
| C11 | Applied costs ("opponents must pay X to do Y") are paid by whoever performs the action. {{Charm}} moving an enemy unit to your {{Gravity Field}} battlefield costs nobody anything; {{Angler Wyrm}} makes the opponent move, so the opponent pays | CR 204.4; FAQ-RAD | EDGE+ Angler Wyrm plus Gravity Field. EDGE- Charm plus own Gravity Field as a tax |
| C12 | A Standard Move that cannot be completed or paid for is undone entirely; you cannot exhaust a unit by attempting an impossible move | FAQ-RAD | EDGE- "attempt move into Gravity Field to exhaust my own unit" (exhaust-trigger enablers such as {{Riven, Broken Blade}}) |
| C13 | The spent Energy for a spell counts even if the spell is countered | FAQ-UNL ({{Jhin, Meticulous Killer}} with Singularity) | EDGE+ |
| C14 | A cost reduction for "the first unit played here" is fixed when the cost is determined; a later replacement of where the unit enters does not undo it | FAQ-RAD ({{Baron Nashor}} with {{Hunters' Circle}}) | EDGE+ |

### 2.3 Targeting, Hidden, untargetable

| ID | Ruling | Rule / source | Graph |
|---|---|---|---|
| T1 | Targets and move destinations are chosen when the spell or ability is put on the chain. All required targets must exist then. If a target is illegal at resolution, only the instructions about it are skipped | CR 355.8 (all targets needed to put it on the chain), 355.9 (what a valid target is); CR 359.3.e.5; PN-OGN | PARSE |
| T2 | A target that stops being legal and becomes legal again before resolution is hit. A target that left the board and came back is a new object and is not hit | CR 359.3.e.3; FAQ-UNL | STR+ for blink effects as protection |
| T3 | Played from facedown: a unit or gear must be played to that battlefield; every target of a hidden spell or of a hidden permanent's play effect must be at that battlefield, each target checked separately; units it plays enter there. Non-targeting effects are not limited | CR 811.1.d.1, 811.1.d.2, 811.1.d.3; CR 811.1.d.4 (each target separately), 811.1.d.5 (units it plays), 811.2 (other effects unrestricted); PN-VEN "Hidden Targeting" | STR- for hidden removal (one battlefield only). EDGE+ hidden {{Zhonya's Hourglass}} saves a unit anywhere; hidden {{Stand United}} buffs only there but its global part applies everywhere |
| T4 | A card cannot be played the turn it was hidden; from the next turn it has Reaction and can be played at any Reaction timing, not only in showdowns there | CR 811.1.b; FAQ-OGN | PARSE |
| T5 | Untargetable units are illegal targets; if a unit becomes untargetable after being chosen, the spell misses it | CR 758; FAQ-VEN ({{Akali, Silent}} moved out of combat by Flash) | EDGE+ movement as protection |
| T6 | Pending chain items are not legal targets: a spell or ability on the chain is a valid target only once finalized | CR 355.9.a; PN-RAD "Pending Item Target Legality" | PARSE |
| T7 | Effects that count a spell's targets include targets that became illegal but are still on the board, not ones that left the board | PN-VEN "Counting Targets"; FAQ-UNL (Repulse against Alpha Strike) | EDGE- moving two targets to base does not enable {{Repulse}} |
| T8 | Split damage: if less damage is available at resolution than targets, the controller drops targets, and may not keep fewer targets than damage | CR 355.14.h.1 | PARSE |
| T9 | Fox-Fire's targets are legal as a group (total Might 4 or less); if they outgrow it, the controller keeps a subset of the original targets | FAQ-OGN | STR- against Might pump in response |
| T10 | A player cannot be forced to act on a hidden-information card of a specific type; they may ignore it | CR 128.6; FAQ-UNL "Mandatory Actions and Private Information" ({{Rift Herald}}) | STR- for forced-play effects |

### 2.4 Triggers, ordering, the chain

| ID | Ruling | Rule / source | Graph |
|---|---|---|---|
| O1 | Nothing happens simultaneously on the chain. One player's simultaneous triggers go on in the order that player chooses; several players' go on in turn order starting with the turn player. Last on, first to resolve | CR 303.2, 303.2.a; CR 383.3.d, 383.3.d.1 (trigger ordering); PN-RAD (Chronobreak) | PARSE. The turn player's triggers resolve last |
| O2 | Combat start: attacker's triggers first, then other players in turn order, then the defender's. So the defender's "when I defend" triggers resolve first | CR 466.2.d.1 | STR+ for defend triggers that remove an attacker before its attack trigger resolves |
| O3 | Attack and defend triggers fire once per combat per unit, the first time it gets the designation, including when it joins late. Assault and Shield are not triggers and apply whenever the unit is in combat | CR 383.4.e.2.a, 383.4.f.2.a; PN-OGN | EDGE- "move out and back in to re-trigger attack effects". EDGE+ playing a unit into combat triggers its defend effect |
| O4 | Standard Move with several units: exhaust triggers go on the chain before move triggers | FAQ-RAD ({{Riven, Broken Blade}}, {{Stellacorn Herder}}) | PARSE |
| O5 | Units and gear played by an effect are pending, then finalize and resolve at once in the order they were added; their play effects come after | FAQ-OGN "pending items"; PN-RAD (Chronobreak) | PARSE |
| O6 | A unit does not see its own death or deaths simultaneous with its own, unless it has Deathknell or "when I die". "The first time" with several simultaneous events triggers once | FAQ-OGN (Wraith of Echoes); PN-OGN "Nth time" | EDGE- self-death as an enabler for "when a friendly unit dies" on the same unit |
| O7 | A "when you play your Nth card" ability on a permanent triggers only if the permanent is on the board right after that card resolves | FAQ-OGN ({{Darius, Trifarian}}: works as the second card, not as the third) | PARSE |
| O8 | "When my Might becomes N or more" needs a crossing from below N | FAQ-VEN ({{Renekton, Brute}}) | EDGE- re-triggering while already at or above N |
| O9 | Layers are evaluated in one instant: copy, then trait-altering (base Might set), ability-altering, arithmetic. No intermediate value is ever seen | CR 478, 478.1; PN-RAD "Copy Effects Layer"; FAQ-VEN (Dragon Form with Stupefy does not trigger {{Fiora, Grand Duelist}}) | EDGE- |
| O10 | "Reducing a unit's Might" means a new non-zero -Might effect is applied. A -Might that is snapshotted to 0 (for example "to a minimum of 1" on a 1-Might unit) is not a reduction | PN-RAD ({{Ahri, Confident}}); FAQ-VEN (Gangplank, Naval with Stupefy) | PARSE |
| O11 | An instruction that mistargets is ignored and takes its linked instructions with it. An instruction that is prevented, replaced or impossible is negated and its linked instructions still happen | CR 359.3.e.6, 359.3.e.14.a, 359.3.e.14.b | EDGE+ {{Hidden Blade}} on a unit that cannot be killed or is saved by Zhonya's still gives its controller 2 cards. EDGE+ {{Ride the Wind}} on a unit that cannot move still readies it |
| O12 | Making new choices for a spell on the chain: all choices must be remade and be legal; targeting triggers fire again; restrictions on the spell (such as Hidden's location limit) stay | CR 753, 753.1, 753.3 | PARSE ({{Rebuttal}}, {{Mystic Reversal}}). Taking control of a spell is not countering it, so "can't be countered" does not stop it (FAQ-VEN) |
| O13 | Spell stolen with Rebuttal: resolution-based triggers of the new controller fire; finalize-based counts stay with the original player | CR 420.4.a, 420.4.b; FAQ-VEN | PARSE |
| O14 | "Once each turn" triggered abilities with "you may": the choice is made at finalization; declining does not use up the turn's use | CR 383.3.e.2; PN-VEN "Trigger Condition and Effect" | PARSE |

### 2.5 Combat, damage, "excess damage"

| ID | Ruling | Rule / source | Graph |
|---|---|---|---|
| D1 | Lethal damage = non-zero damage at least equal to Might. In combat a unit must be assigned exactly lethal before the next unit gets any; more than lethal may be assigned only when no other unit is left to assign to | CR 142.4.b; CR 467.2.c.3, 467.2.c.4 | PARSE |
| D2 | **"Excess damage" is not defined in the Core Rules.** DATA: the string "excess damage" occurs 0 times in CR 2026-10-09 and appears in the gallery text of: <<EXCESS_CARDS>>. **HEURISTIC** (the reading the GameLab engine implements, `packages/engine/src/engine.ts` near line 6546): excess = sum over the units you assigned to of (assigned minus minimum lethal), which by D1 can only sit on the last unit. **UNCONFIRMED** officially | none | Valuation: excess = your total attacking or defending Might minus the lethal total of the enemy units present. Shield, Tank order, prevention and damage already marked all change it |
| D3 | Replacement and prevention effects on combat damage apply at assignment, so the assigning player must plan around them; a unit that cannot be dealt damage is skipped | CR 467.2.c.5, 467.2.c.10; PN-VEN | STR+ for prevention in combat. Changed 2026-07-24 for damage-increasing effects ({{Lotus Trap}}) |
| D4 | Tank must be assigned lethal first, Backline last; with several of the same kind the assigner chooses the order; a unit with both gets one applied, assigner's choice | CR 815.1.b; CR 467.2.c.6 to 467.2.c.8 | PARSE |
| D5 | After combat damage, dead units are removed, then all units are healed, then attackers are recalled if defenders remain | CR 468.1.a.1, 468.1.a.2; FAQ-OGN | EDGE- "kill the Might-aura unit so damaged units die". Deathknell damage lands after the heal and stays on survivors |
| D6 | Combat result: one side alone left = that side wins; both or neither left = no result (tie). Winning is not conquering. "No result" also when attackers were recalled in the combat cleanup | CR 468.3; FAQ-SFD (Draven, Audacious); FAQ-OGN; FAQ-UNL "Results of Combat" | PARSE |
| D7 | {{Draven, Audacious}}'s point for winning a combat is gained before the conquer point. From 6 points he does not win the game on a single conquer: the conquer then becomes the final point and needs every battlefield scored this turn | FAQ-SFD; CR 468.3 (result is determined before control is established in 468.5.d); CR 473.1.b, 473.1.b.1 | EDGE- "Draven point plus conquer point = win from 6" unless all battlefields are scored |
| D8 | Final point: a conquer at Victory Score minus 1 or higher gives the point only if every battlefield was scored this turn, otherwise draw 1. Points from holds and from card effects are not restricted. You win only with at least the Victory Score and more points than every opponent | CR 473.1.a.1, 473.1.b.1; CR 474 | PARSE. Extra-point effects are worth more than conquers at 7 |
| D9 | "Spell and ability damage" excludes damage a spell tells a unit to deal. Unyielding Spirit stops Void Seeker but not Challenge | FAQ-OGN (faq-only wording, see section 1) | PARSE: split damage effects into "deal N" and "unit deals" |
| D10 | "When you kill a unit with a spell": your spell must itself kill it or deal the damage that kills it in the cleanup right after. Not: a unit dealing damage because of your spell, Might reduction, delayed death, or another player doing the killing. A delayed trigger created by your spell counts | FAQ-OGN ({{Immortal Phoenix}}); FAQ-VEN (Imperial Decree) | EDGE+ Hidden Blade on your own Immortal Phoenix returns it. EDGE+ {{Imperial Decree}}. EDGE- {{Challenge}}, {{Stupefy}} |
| D11 | Bonus Damage adds to each instance of damage; Void Gate's applies only to units at Void Gate | ERR-OGN (Void Gate); PN-OGN | PARSE: multi-instance spells scale per instance |
| D12 | {{Elder Dragon}}: any damage marked by its controller is lethal to enemy units, including damage marked before it arrived; in combat one damage per enemy unit is enough. Fully prevented damage is not dealt | CR 142.4.c; FAQ-UNL | EDGE+ Elder Dragon plus wide small damage. EDGE- against prevention ({{Counter Strike}}) |
| D13 | Hold-on-death timing: control of a battlefield cannot be lost while an item is on the chain or a combat or showdown is ongoing there | CR 190.4.b, 190.4.c, 323.5; FAQ-UNL (old 187.4.c); PN-UNL "Control of Battlefields" | EDGE+ {{Cruel Patron}}, {{Baited Hook}}, {{Arcane Shift}}, {{Glasc Mixologist}}: kill or banish your only unit at a battlefield and play the new unit to that same battlefield |

### 2.6 Replacement effects, copies, tokens, attachments

| ID | Ruling | Rule / source | Graph |
|---|---|---|---|
| X1 | Several simultaneous events: the controller of a replacement effect orders them; different controllers go in turn order; each replacement is applied in one sequence | CR 373, 373.1, 373.2 | PARSE |
| X2 | A replacement inherits the modifications of the event it replaces ("to a minimum of 1", "exhausted", Temporary) | CR 375; FAQ-VEN (Mel with Stupefy) | PARSE |
| X3 | Replacements that key on "a spell or ability that chooses me" do nothing against effects that do not choose, and nothing when the replaced action does not actually happen | FAQ-VEN ({{Gangplank, Naval}} against Blast Cone, Back Off while stunned, Stupefy at 1 Might) | EDGE- |
| X4 | Swap of Might is an increase on one unit and a decrease on the other; a replacement on one side leaves the other side | FAQ-VEN (Switcheroo: 2 becomes 6, Gangplank 6 becomes 9) | EDGE+ |
| X5 | Tokens: created copies get the copied traits as printed traits. A token-doubling replacement applies when the token is played, so a token that later becomes a copy of the doubler does not loop | FAQ-UNL ({{Zilean, Time Mage}} with {{Leblanc, Deceiver}}) | EDGE- infinite Zileans. EDGE+ two copies per trigger |
| X6 | Copy effects copy printed or already-copied traits only; no granted text, buffs, statuses, Empowered. Copy is its own first layer since 2026-10-16 | PN-RAD; FAQ-VEN (Shady Spectacles); FAQ-SFD (Svellsongur) | PARSE |
| X7 | "When attached" effects such as {{Svellsongur}} and {{Shady Spectacles}} apply after the attach event. The copied text arrives too late to see that attach | FAQ-VEN, which reverses FAQ-SFD | EDGE- Svellsongur on {{Aphelios, Exalted}} does not trigger twice. Before 2026-08-14 the official answer was that it does |
| X8 | Re-attaching Svellsongur or Shady Spectacles gives a fresh instance of a copied once-per-turn ability | FAQ-VEN | EDGE+ |
| X9 | Units cannot be attached to anything; an Equipment that becomes a unit detaches. Equipment attached to a gear stays attached when the gear stops being a unit | CR 143.5, 143.5.a, 143.5.b; CR 435.1.h; PN-RAD ({{Orianna, Lady of Clockwork}}) | EDGE- equipping a unit-ified Equipment |
| X10 | A Deploy gear turned into a unit at a battlefield its controller does not control contests it and starts a showdown or combat | PN-RAD (Orianna) | EDGE+ |
| X11 | A unit can never be played to another player's base. If the owner is told to play it to the "same location" and that is someone else's base, it stays banished | FAQ-VEN (Hostile Takeover then Temporal Breach) | EDGE+ as removal of a stolen unit; EDGE- as a way to keep it |
| X12 | A permanent you control but do not own, banished and replayed by its own ability, comes back under the control of whoever is instructed to play it | FAQ-RAD ({{Possession}} on {{Ekko, Revolutionary}}: the thief keeps him) | EDGE+ |
| X13 | "Then banish it" / "Then recycle it" on play-from-trash effects apply however the spell leaves the chain, including when countered or bounced | CR 829.1.b; PN-VEN "New Replacement Effects"; FAQ-VEN (Abandon on a Flow spell) | EDGE- returning a Flow spell to hand for reuse |
| X14 | Permission to play a banished card "until your next Ending Phase" ends when that phase begins | FAQ-RAD ({{Runeblade Anvil}}) | PARSE |
| X15 | "At end of turn" text granted to a unit means the end of this turn only; if its death is replaced it does not die on later turns | PN-RAD ({{Ekko, Boy Who Shattered Time}} with Unlicensed Armory) | EDGE+ keep the temporary unit |
| X16 | Show Off locks in the shown object's values at finalization | CR 832.1.d.1; PN-RAD (Primordial Roar) | PARSE. Later pump or removal does not change the damage |
| X17 | Referencing "if you channeled this way" counts only the action the spell itself instructed, not extra channels added by another effect | FAQ-RAD ({{Seraphic Wyvern}} with {{Mobilize}} / {{Catalyst of Aeons}}; CR 359.3.e.14.c as cited by the FAQ) | EDGE- |

### 2.7 Location rules: where units may be played, "can't beats can"

| ID | Ruling | Rule / source | Graph |
|---|---|---|---|
| L1 | Default: a unit is played to your base or a battlefield you control. Cards may widen or narrow this | PN-SFD "Playing Units to Valid Locations" | PARSE |
| L2 | A restriction ("play me only to ...", "units can't be played here") beats a permission. Two positive location requirements: the player picks one | CR 054, 054.2; CR 355.17.a; FAQ-VEN | EDGE- {{Perched Grimwyrm}} cannot be played to {{Dragon Roost}} unless Dragon Roost itself was conquered this turn. EDGE+ {{Temporal Breach}} on Elder Dragon with Dragon Roost: choose either place |
| L3 | "I enter there" is a replacement on entering and ignores play-location restrictions. Enter-ready replacements stack with it | FAQ-VEN; FAQ-RAD (Baron Nashor with {{Riven, the Exile}}) | EDGE+ |
| L4 | Ambush: may be played to a battlefield where you have units, and has Reaction while being played there | CR 822.1.b | PARSE |
| L5 | Accelerate creates a delayed replacement once paid; the unit enters ready even if it loses the keyword | CR 805.1.b, 805.2.b, 805.6; PN-VEN; FAQ-UNL (Atakhan with {{Rek'Sai, Breacher}}) | EDGE+ |
| L6 | In games with more than two players, a battlefield with a combat staged or in progress cannot be moved to or played to by players not in that combat | CR 464, 464.1, 464.2 | PARSE (FFA, 2v2) |
| L7 | "Activate conquer effects" does not make a conquer; each ability still checks its own extra conditions | FAQ-UNL ({{Reckoner's Arena}} with Yone, Blademaster) | EDGE- |
| L8 | {{Forgotten Monument}} stops scoring there entirely (no conquer or hold triggers); {{Tianna Crownguard}} only stops points. **UNCONFIRMED** for Forgotten Monument under the current CR: the only source is FAQ-SFD (2026-01-14), which the CR outranks, and CR 383.4.c.2.c now says a conquer effect still triggers when the point is negated or replaced; the card text is "Players can't score here until their third turn." | FAQ-SFD; CR 383.4.c.2.c | PARSE |

### 2.8 2v2 and multiplayer

| ID | Ruling | Rule / source | Graph |
|---|---|---|---|
| M1 | Points are shared by the team; Victory Score 11; a battlefield can be scored once per team per turn; a battlefield a teammate controls at the scoring step cannot be scored by the team that turn | CR 491.3, 491.8.b, 491.8.b.1, 491.8.d; PN-RAD "2v2 Scoring" | EDGE- "teammate retreats, I conquer the same battlefield" |
| M2 | Teammates can never both have units at one battlefield | FAQ-OGN; CR 449.2.b (a battlefield a teammate occupies is an invalid move destination; corrected from 464, which is about combat having exactly two players) | PARSE |
| M3 | Moving a unit you do not control "to base" sends it to its controller's base | FAQ-OGN; ERR-OGN (Unforgiven, The Syren) | PARSE |
| M4 | A battlefield ability that has one player make a choice is controlled by that player, whoever controls the battlefield | CR 190.6.c | PARSE ({{Abandoned Hall}}) |
| M5 | "Relevant players" and the invite mechanic were removed from free-for-all; everyone may always act in showdowns | PN-OGN | PARSE |

### 2.9 Further card-specific rulings

Rulings read from the FAQ index that the tables above do not cover. Rule numbers printed inside FAQ-VEN and older articles belong to older editions (for example FAQ-VEN cites 419.4.b for what is CR 420.4.b today) and are not repeated.

| ID | Ruling | Rule / source | Graph |
|---|---|---|---|
| F1 | A player told to move a unit must move one that can move; a unit that cannot move cannot be picked to satisfy the instruction. If none can move the instruction is negated | FAQ-RAD (Angler Wyrm against Hunker Down) | EDGE- "make my unit immovable so the forced move does nothing" unless every unit is immovable |
| F2 | {{Riven, Broken Blade}} spends the buff at resolution, because the cost is not the first part of the effect | CR 383.3.b; FAQ-RAD | PARSE (instance of P5): the opponent can remove the buff in response |
| F3 | Several replacement effects on one unit's combat damage: its controller orders them. Ki Barrier before Lotus Trap leaves prevention unused; the other order uses it up | CR 373; CR 467.2.c.5; FAQ-VEN | STR: order matters for the valuation of prevention plus damage increase |
| F4 | {{Crumbling Sands}} counts spells an opponent finalized, including countered ones, and can counter the first of two spells | CR 420.4.b; FAQ-VEN | EDGE+ |
| F5 | {{Fallen Feline}} names a spell when its play effect resolves; spells already on the chain are unaffected and the opponent must react before the name is known. A named card must exist in Riftbound and be legal in the format | CR 761, 762; FAQ-VEN | STR- for the lock against Reaction-speed answers |
| F6 | {{Kayle, Justified}} holds up to 3 Empowered statuses; disempowering removes one; her Empower can be activated while empowered | CR 002; FAQ-VEN; PN-RAD multi-empower | PARSE: Empowered is a counter on Kayle, a flag elsewhere |
| F7 | You control your own legend, so effects on "something you control" can pick it ({{Profiteer}} disempowering Ambessa's legend to empower another unit) | FAQ-VEN | EDGE+ |
| F8 | {{Mel, Newly Awakened}}: her extra -1 Might applies only to the unit a spell chooses, not to units hit without being chosen (Moonfall: chosen -3, others -2). An uncounterable spell targeted by Abandon is neither countered nor returned | FAQ-VEN | STR- for Mel with area effects. EDGE- Abandon as a bounce for your own uncounterable spell |
| F9 | {{Elder Dragon}}'s play effect has one target slot per location; a unit moved to another location is no longer hit | FAQ-UNL | EDGE+ movement as protection (instance of T1) |
| F10 | Granted Temporary on an attached Equipment is active and kills it (the printed, inactive copy does not matter) | CR 135.4; CR 816.2.a; FAQ-UNL (Spinning Axe) | instance of P12 |
| F11 | A battlefield replaced by a Brush token: when the replacement removes a Victory Score modifier (Aspirant's Climb), both players can sit at the Victory Score without winning; each further conquer point is then a final point | CR 474; CR 473.1.b; FAQ-UNL | PARSE |
| F12 | No cleanup happens during finalization; cleanups run after an item is added, after it is finalized and after it resolves | FAQ-UNL | PARSE |
| F13 | Tokens are recycled to the deck of their type and then cease to exist; the effect can still read the recycled token ({{Rumble, Hotheaded}}). A token's cost is 0, so {{Pickpocket}} can kill a Gold token | CR 185.2.e; CR 185.3.a.1; FAQ-SFD | EDGE+ |
| F14 | {{Kato the Arm}} gives his current keywords and current Might (including gained ones), locked in at resolution | FAQ-SFD | STR+ with Equipment and pump on Kato |
| F15 | Weaponmaster is optional | FAQ-SFD | PARSE |
| F16 | {{Hallowed Tomb}} returns any copy of the exact full card name of the Chosen Champion, not another card with the same champion tag. A played Chosen Champion is an ordinary Main Deck card afterwards | FAQ-OGN | PARSE: "your Chosen Champion" = full name match |
| F17 | {{Sun Disc}}'s activated ability can be used the turn Sun Disc is played: the ability is not Sun Disc, so Sun Disc itself is the other card for Legion | FAQ-OGN; CR 812.1.b.1 | EDGE+ |
| F18 | "Card with Hidden" counts only cards that have the keyword, not cards that mention it (Ember Monk, Noxus Saboteur do not count for {{Teemo, Strategist}}) | FAQ-OGN | PARSE: keyword presence, not word match |
| F19 | Ganking is not an extra move; it widens the Standard Move to battlefield-to-battlefield. Seals produce Power only, by exhausting, and are reusable each turn | FAQ-OGN | PARSE |
| F20 | Combat where both sides survive (stun, damage immunity): attackers are recalled, defender keeps control, nobody scores | FAQ-OGN; CR 468.1.a.2 | PARSE |
| F21 | An effect that returns a unit and then reads "the Might that unit had" reads the unit's current information if the return was replaced and the unit stayed on the board. {{Transpositionist}} on an empowered 6-Might {{Gangplank, Naval}}: the bounce becomes +3 Might, and a unit with less than 9 Might may be played (added in the verification pass) | PN-RAD "Unique Radiance Interactions" (cites 359.3.e.13 of that edition) | EDGE+ |

### 2.10 Official rulings that were later reversed

A tool that stores rulings must store the date range, because guides written between the two dates describe the old behaviour.

| Topic | First ruling | Reversed by | Current |
|---|---|---|---|
| {{Falling Star}}, {{Icathian Rain}} | FAQ-OGN 2025-10-16: no targets, reflexive triggers, Deflect per trigger | FAQ-SFD + ERR-SFD 2026-01-14 | Targets up front, Deflect per choice |
| Attack / defend triggers | FAQ-OGN 2025-10-16: can trigger again after leaving and re-entering combat | PN-OGN 2025-10-24 | Once per combat (CR 383.4.e.2.a) |
| Svellsongur on Aphelios, Exalted | FAQ-SFD 2026-01-14: both instances trigger | FAQ-VEN 2026-08-14 | Does not trigger twice |
| "You may" on triggers | PN-UNL 2026-03-30: decided when it triggers | PN-VEN, effective 2026-07-24 | Decided at finalization |
| Remaking choices (Rebuttal, Mystic Reversal) | FAQ-VEN 2026-08-14: any subset of choices | PN-RAD, effective 2026-10-16 | All choices remade (CR 753) |
| Hostile Takeover / Stormbringer on an empty enemy battlefield | FAQ-SFD 2026-01-14: interim "noncombat showdown" | PN-UNL 2026-03-30 | Control locked by showdown or combat, not by Contested |
| Zhonya's Hourglass / Stand United from facedown | pre-FAQ rulings: only that battlefield | FAQ-OGN 2025-10-16 | Only targeting parts are limited |

## 3. Core Rules timeline: changes that altered a mechanic's power

Use: discount tournament or guide data from before a row's effective date when the deck leaned on that mechanic. "Effective" is the date the article gives; where it gives none the publication date is used and marked.

Design intent. **FACT** (PN-RAD, exact words: "we do not update the rules of Riftbound or introduce card errata to manage the power level of any card or effect"; PN-SFD says the same as "We have no plans to use either rules updates or card errata to balance the power level of cards"; PN-UNL has a similar sentence about rules changes): power is handled by the ban list (`rules.md` section 9). The rows below are side effects.

| # | Effective | Source | Change | Power effect (HEURISTIC) |
|---|---|---|---|---|
| 1 | 2025-10-16 | FAQ-OGN | Hidden restrictions spelled out: hidden unit must go to that battlefield, targets limited to it, same-turn play forbidden; Zhonya's Hourglass and non-targeting parts work anywhere | Hidden removal weaker, hidden protection stronger |
| 2 | 2025-10-16 | FAQ-OGN | Move destinations chosen when the spell is played (Charm) | Move spells easier to play around |
| 3 | 2025-10-16 | FAQ-OGN | Units healed right after combat deaths, before lethal is rechecked; Deathknell damage after the heal | Might-aura units safer to lose in combat; Kog'Maw-style Deathknell stronger |
| 4 | 2025-10-16 | FAQ-OGN | Death-replacement cards heal the saved unit | Those cards work against lethal damage at all |
| 5 | 2025-10-24 (published; no effective date in article) | PN-OGN | Triggered abilities can decline Deflect and fail to finalize; attack/defend triggers once per combat; "can't beats can"; null is not zero; cleanups repeat; control cannot be lost while a battlefield is contested | Deflect stronger; re-trigger loops gone |
| 6 | 2025-10-24 | PN-OGN | Free-for-all "relevant players" removed | FFA only |
| 7 | 2025-10-28 | ERR-OGN | 31 Origins and Proving Grounds errata (section 1) | Per card |
| 8 | 2025-12-12 | PN-SFD | Attachments, Equip, Quick-Draw, Weaponmaster, Repeat, inactive text; Deathknell remembers the dead unit's state; default play locations defined; double and swap defined | New mechanics; Deathknell on big units more reliable |
| 9 | 2026-01-14 ("take effect immediately") | FAQ-SFD, ERR-SFD | Deflect paid per choice (old 735.1.c, now CR 809.1.c); Falling Star and Icathian Rain target up front; win/lose/tie combat defined; token cost 0; negative Might rules; Tianna only stops points | Deflect much stronger against multi-hit spells; Falling Star and Icathian Rain stronger against non-Deflect boards (all hits resolve together) and weaker into Deflect |
| 10 | 2026-03-30 (published; article names the 2026-04-08 China release, no effective date) | PN-UNL | XP, Hunt, Level, Ambush, Backline, Unique, Predict, replace/create; `[>]` dependent keywords; win needs Victory Score and strictly more points than opponents; showdown can turn into combat; resolution step reordered; "you may" triggers optional to put on chain and cost-within-instructions paid on finalization; prevent defined as a shield pool; copy effects defined; control cannot be lost while an item is on the chain; expiration step loops | Sacrifice-and-replay lines stronger (keep the battlefield); "pay X to" triggers cannot be baited; draws by simultaneous 8 points removed |
| 11 | 2026-04-03 | ERR-UNL | 8 errata (section 1) | Per card |
| 12 | 2026-04-29 | FAQ-UNL | Private-information actions cannot be forced; lethal-damage modification (Elder Dragon) unified; battlefield ability control; "no result" after recall | Rift Herald-style forced plays weaker; Elder Dragon stronger |
| 13 | 2026-07-24 | PN-VEN | Empower, Flow, Burn, Skip, naming, ignoring, untargetable; all replacement effects on combat damage apply at assignment; `[C]` on multi-domain cards must match a domain of the card; resource payment always optional; token is intrinsic (copies of tokens stay tokens); "you may" moved to finalization; "when I die" uses last-known information; contested status removal; split-damage and target-counting rules; "play" meanings fixed (trigger = resolve, other checks = finalize); Accelerate is a delayed replacement; best-of-5 battlefield reuse | Signature cards harder to cast off-colour; counterspells stop play triggers but not Legion or play counts; damage-increase effects matter at assignment |
| 14 | 2026-07-23 | ERR-VEN | 8 errata (section 1) | Per card |
| 15 | 2026-08-14 | FAQ-VEN | Svellsongur/Shady Spectacles apply after attach (reversal); ignored vs negated instructions; Dragon Roost and restrictions; Kayle multi-empower; Heisho ignores Deflect for the whole spell; Astral Heron errata restated | Svellsongur on Aphelios weaker; Hidden Blade-style linked draws happen more often |
| 16 | 2026-10-16 | PN-RAD | Deploy, Disarm, Show Off; copy layer; copy action; additional deckbuilding choices (Neeko); units cannot be attached; layer dependencies; "pick" (non-target choice); conditional clause scope; making new choices = all choices; pending items not targetable; 2v2 scoring aligned; multi-empower permission; negated vs ignored codified; mandatory requirements and restrictions codified; instructions that check finalization-time actions ("if you paid") stay true when another player takes control of the spell | Rebuttal and Mystic Reversal less flexible; otherwise codification |
| 17 | 2026-10-09 | ERR-RAD | 4 errata (section 1) | Elnuk Herd may target itself; Neeko needs "up to 3" legends |
| 18 | 2026-10-26 | FAQ-RAD | Standard Move cannot be attempted if it cannot complete; applied move costs paid by the mover; costs order (resources before other costs); Baron Nashor location rulings; Neeko played by an opponent; Runeblade Anvil duration | Removes "fake move to exhaust" lines |
| next | "January" 2027 | PN-RAD "Legacy Updates" | Full rewrite of the rules documents with the Legacy set; "it won't change how Riftbound's mechanics actually work"; many cards will change "choose" to "pick" | Every rule number in this file will change. Store rule references together with the edition date |

Also relevant for discounting meta data but outside this file: ban list dates (2026-03-31, 2026-07-24, 2026-09-18), sideboard 8 to 10 (July 2026), start-of-game test (2026-10-15). See `rules.md`.

## 4. Proposed synced data

### 4.1 File shape

One reviewed JSON snapshot, fail-closed like the legality snapshot in `legality-and-data.md`: the app ships with the last reviewed file and refuses nothing at runtime; the sync job only proposes a diff for review.

```jsonc
// data/rulings/rulings-2026-11-11.json
{
  "schemaVersion": 1,
  "snapshotDate": "2026-11-11",
  "coreRulesEdition": "2026-10-09",          // rule numbers below are only valid for this edition
  "sources": [
    { "key": "ERR-VEN", "kind": "errata", "url": "https://playriftbound.com/en-us/news/announcements/vendetta-errata-updates/",
      "published": "2026-07-23", "effective": "2026-07-23", "rev": "M4hdb3GDOMuirfurf2K1C0", "textSha256": "…" }
  ],
  "errata": [
    { "id": "vendetta-errata-1",
      "cardName": "Draven, Vanquisher",          // full name; overlay applies to every printing with this name
      "printings": { "SFD-020/221": "OLD", "SFD-020a/221": "OLD" },   // gallery status on snapshotDate
      "printedText": "…", "currentText": "…",    // copied verbatim from the article
      "effective": "2026-07-23", "source": "ERR-VEN",
      "status": "official",                       // official | faq-only | superseded
      "class": "functional",                      // functional | template   (HEURISTIC, section 1.1)
      "supersedes": [] }
  ],
  "textOverrides": [                               // non-errata printing differences to normalise (section 4.3)
    { "cardName": "Emperor of the Sands", "canonicalPrinting": null, "status": "unconfirmed" }
  ],
  "rulesEpochs": [                                 // section 3, for discounting older meta data
    { "id": "PN-VEN", "effective": "2026-07-24", "changes": [
      { "mechanic": "multi-domain-power-cost", "direction": "weaker", "rule": "135.2.e.6.c", "note": "…" } ] }
  ],
  "interactionOverrides": [                        // section 2 and 5
    { "id": "X7",
      "cards": ["Svellsongur", "Aphelios, Exalted"],      // names; empty when the ruling is generic
      "pattern": null,                                    // or a parser feature key for generic rulings, e.g. "deflect.multiChoice"
      "effect": "forbid",                                 // forbid | allow | strength | parse
      "summary": "Copied text arrives after the attach event; no second trigger.",
      "rules": [], "sources": ["FAQ-VEN"],                // rule numbers only when located in coreRulesEdition
      "validFrom": "2026-08-14", "validTo": null,
      "reverses": { "source": "FAQ-SFD", "validFrom": "2026-01-14", "effect": "allow" },
      "confidence": "fact" }                              // fact | heuristic | unconfirmed
  ],
  "definitions": [                                  // terms cards use that the rules do not define
    { "term": "excess damage", "status": "unconfirmed", "workingDefinition": "sum(assigned - minimum lethal) over enemy units in that combat", "rules": ["467.2.c.4"] }
  ]
}
```

Rules for the consumer:

- Card text used by any parser = `errata.currentText` if an entry with `status != "superseded"` exists for the card name, else the gallery text of the newest printing.
- `interactionOverrides` are applied after the parser's own inference: `forbid` deletes an inferred edge, `allow` adds one, `strength` scales it, `parse` entries are documentation that a parser test must cover.
- Every entry keeps `sources` and `validFrom`; a deck or guide dated before `validFrom` is evaluated with the entries valid at its date.

### 4.2 Sync source list

| Source | What to read | Change detection |
|---|---|---|
| https://playriftbound.com/sitemap_index.xml (en-us map) | New news URLs whose slug matches `errata`, `faq`, `patch-notes`, `rules`, `ban`, `changelog` | New URL = review needed |
| Each article in section 0 | `__NEXT_DATA__` JSON: `displayedPublishDate`, rich text blades (FAQ-OGN keeps its answers in accordion blades, not in the main rich text) | Hash of extracted text differs from the stored one (`rev` alone is not reliable, see section 0) |
| https://playriftbound.com/en-us/rules-hub/ | Links to the current Core Rules and Tournament Rules PDFs, ban lists | PDF URL hash changes with each edition |
| https://playriftbound.com/en-us/card-gallery/ | Printed text per printing. Note: an Equipment's attached-effect text is in the item's separate `effect` field, not in `text` or the image alt text (example: Hextech Gauntlets' excess-damage trigger); read both | Per-printing text hash; a reprint with new text is a signal of errata |
| ERR-OGN and ERR-SFD PDF downloads | Same content as the articles (checked 2026-11-11: 31 and 16 blocks, same cards) | Hash |
| Watcher | Official wordings | **UNCONFIRMED**: not public on 2026-11-11; add when it appears |
| https://api.riftcodex.com/cards (community) | Secondary cross-check only | Not a source of truth, see 4.3 |

No errata article has a machine-readable format; `build_errata.py` parses the "[NEW TEXT] / [OLD TEXT]" blocks, which have been stable across all five articles. A parse that yields a different block count than the article's number of card headings must fail the sync.

### 4.3 What secondary data sources reflect today

**DATA** (`out/secondary-sources.json`, compared with reminder text removed):

- Official gallery, 2026-11-11: see the summary in section 1.
- riftcodex API dump of 2026-11-11 (1451 items), printings of the 70 errata cards: 16 printings show the errata text, 75 the old text, 4 neither (95 printings of 66 cards; the four Radiance errata cards have no match in the dump; numbers corrected to the output of `secondary_sources.py` in the verification pass). It mirrors the gallery; it does not apply errata.
- GameLab `data/cards/cards.json` (931 cards, built 2026-09-06), 66 of the 70 cards present (no Radiance): 12 errata text, 53 old text, 1 neither (corrected to the output of `secondary_sources.py`). Astral Heron is the only card where it is ahead of the gallery.
- GameLab engine: `packages/engine/src` mentions errata on 54 lines across hand-written card scripts. **UNCONFIRMED**: we did not verify card by card that every functional erratum of section 1.1 is implemented; `analysis/interactions/out/text-vs-engine.json` is the place to check.

Printings of the same card whose gallery text differs although no errata exists (**DATA**, `out/silent-diffs.json`, 17 names, 6 of them basic runes with a "[no text]" placeholder):

| Card | Difference | Reading |
|---|---|---|
| {{Emperor of the Sands}} | one printing "Your Sand Soldiers have [Weaponmaster]", the other "Sand Soldiers you play have [Weaponmaster]" | **UNCONFIRMED** which is current; functionally different for Sand Soldiers that are stolen or already on board. Needs a judge source |
| {{Lux, Crownguard}} | "Use only to play spells" / "Spend this energy only to play spells" | Template |
| {{Sett, Brawler}} | "When I'm played and when I conquer" / "When you play me or when I conquer" | Template (moves to the standard play-effect pattern) |
| {{Viktor, Innovator}} | "in your base" / "to your base" | Template |
| {{Lonely Poro}}, Gold token | `[Deathknell] —` / `[Deathknell][>]`; `[Reaction] —` / `[Reaction][>]` | Template (the `[>]` change of 2026-03-30) |
| {{Renekton, Brute}}, {{Aphelios, Exalted}}, {{Riven, Deserter}}, {{Kai'Sa, Rebel}}, {{Akali, Deadly Weapon}} | keyword order, `[Buff]` backer, "is"/"becomes exhausted", punctuation | Template |

Rule for the tool (**HEURISTIC**): when printings differ and no errata exists, use the newest printing and record the difference in `textOverrides`.

## 5. Supposed combos the rules forbid

Origin of this list. **FACT**: the official FAQs say their questions were "gathered from public discussion, from judges across the world" (FAQ-VEN); each row below is a question an official article answered with "no". **DATA** (our cached community corpus: 84 guide pages when the scan was first run; the corpus is shared with other research files and held 95 files when re-run in the verification pass, so the keyword counts in `out/community-scan.json` drift; the "not recommended anywhere" reading was done by hand on the 84 pages and was not repeated, from riftbound.gg, cardsrealm and others, `out/community-scan.json`): none of these combos is recommended in those 84 pages; where the cards co-occur the guides describe the legal behaviour (for example the riftmana Irelia guide states the Draven 6-point limit correctly). So "popular in community sources" is **UNCONFIRMED** for every row; the evidence is only that the question was asked often enough to get an official answer.

| # | Supposed combo | Why it fails | Rule / source |
|---|---|---|---|
| 1 | {{Svellsongur}} on {{Aphelios, Exalted}} to trigger his attach ability twice | Copied text is added after the attach event | FAQ-VEN (reverses FAQ-SFD); X7 |
| 2 | {{Kato the Arm}} giving himself his own Might and keywords | Errata: "another friendly unit" | ERR-SFD |
| 3 | {{Portal Rescue}} on a unit taken with {{Possession}} to keep it | Errata: "its owner plays it to their base" | ERR-OGN; FAQ-OGN |
| 4 | {{Icathian Rain}} or {{Falling Star}} stacked on one Deflect unit for a single Deflect payment | Deflect is paid for each time the unit is chosen | CR 809.1.c |
| 5 | {{Draven, Audacious}}: win from 6 points with one conquer (Draven point plus conquer point) | Draven's point comes first; the conquer is then the final point and needs every battlefield scored | CR 473.1.b.1; FAQ-SFD |
| 6 | {{Tianna Crownguard}} switching off the opponent's conquer and hold triggers | She only stops gaining points | ERR-SFD; FAQ-SFD |
| 7 | {{Zilean, Time Mage}} plus {{Leblanc, Deceiver}} for unlimited Zilean copies | The doubling applies to the play event; the copies become Zilean afterwards | CR 375; FAQ-UNL |
| 8 | {{Atakhan}} killing a unit for its cost and banishing that unit with {{Mordekaiser, Iron Revenant}} to pay Atakhan's Power | Energy and Power are paid before the kill | CR 357.1, 357.2; FAQ-RAD |
| 9 | {{Seraphic Wyvern}} making {{Mobilize}} or {{Catalyst of Aeons}} draw when the Rune Deck is nearly empty | Only the spell's own channel is checked | FAQ-RAD |
| 10 | {{Perched Grimwyrm}} to {{Dragon Roost}} by paying the Roost cost | "Play me only to a battlefield you've conquered this turn" is a restriction; can't beats can | CR 054, 054.2; FAQ-VEN |
| 11 | {{Reckoner's Arena}} hold to fire {{Yone, Blademaster}}'s conquer damage | His own condition (battlefield was uncontrolled) is still checked | FAQ-UNL |
| 12 | Attempting a Standard Move into {{Gravity Field}} and declining the cost, just to exhaust the unit | The whole move is undone | FAQ-RAD |
| 13 | Playing {{Charm}} to drag an enemy unit into your Gravity Field so they pay | You perform the move, so nobody pays (or you do, on their field) | CR 204.4; FAQ-RAD |
| 14 | {{Gutter Guardian}} showing off a facedown card as a card with Hidden | A facedown card has no readable characteristics | CR 811.5.a, 129.4; PN-RAD |
| 15 | Moving two targets of {{Alpha Strike}} to base to enable {{Repulse}} | Mistargeted units still count as chosen while on the board | PN-VEN; FAQ-UNL |
| 16 | {{Abandon}} returning a Flow spell (or a spell replayed by {{Fizz, Trickster}} / {{Kai'Sa, Evolutionary}}) to hand | "Then banish/recycle it" applies however it leaves the chain | CR 829.1.b; FAQ-VEN |
| 17 | {{Baited Hook}} while saving the sacrificed unit with a death replacement | No killed unit, so its Might is null and nothing can be played | FAQ-OGN; PN-OGN |
| 18 | {{Stupefy}} on your own 1-Might empowered {{Gangplank, Naval}} for +3 | No -Might is actually given | FAQ-VEN |
| 19 | {{Dragon Form}} to trigger {{Fiora, Grand Duelist}} through a unit already carrying -Might | Layers are evaluated at once; the unit never has the higher value | CR 478.1; FAQ-VEN |
| 20 | {{Orianna, Lady of Clockwork}} turning an Equipment into a unit and equipping it | Units cannot be attached | CR 143.5.a, 435.1.h |
| 21 | Opponent's Kharox replaying your {{Neeko, Blending In}} to use your chosen legends | They get only legends they chose themselves, and only if their own deck has Neeko | FAQ-RAD; CR 103.1 |
| 22 | {{Hostile Takeover}} then {{Temporal Breach}} to keep the stolen unit | The owner cannot play it to your base; it stays banished | FAQ-VEN |
| 23 | 2v2: teammate leaves a battlefield so you can conquer it the same turn | Disqualified if the teammate controlled it at the scoring step | CR 491.8.b.1 |
| 24 | Playing a token or using an ability to turn on Legion | Tokens and abilities are not cards | CR 052; CR 812.1.b.1 |
| 25 | Re-entering combat to repeat attack or defend triggers | Checked once per combat | CR 383.4.e.2.a, 383.4.f.2.a |

Forbidden by the ban list, not by the rules: the Time Warp loop with {{Ekko, Recurrent}} described in a cardsrealm Renata Glasc guide in our corpus (`analysis/interactions/data/community/cr-renata.html`). **FACT** (HUB): Ekko, Recurrent is banned since 2026-09-18. Additional turns themselves are legal and defined (PN-UNL "Additional Turn Effects").

Combos the same articles confirm (useful as positive edges, already listed in section 2): C4, C10, C11 (Angler Wyrm), C13, C14, D10, D12, D13, L2 (Temporal Breach), L3, L5, O11, P11, P12, X4, X8, X10, X12, X15; also {{Hwei, Brooding Painter}} discarding a card with two types gets both effects, and {{Swain, Visionary}} counts one card for several of his conditions (FAQ-VEN).

## 6. Open items

- **UNCONFIRMED**: official definition of "excess damage" (section 2.5 D2).
- **UNCONFIRMED**: standing of two FAQ-only errata (Unyielding Spirit, Symbol of the Solari). Wraith of Echoes is confirmed by CR 383.1.b.
- **UNCONFIRMED**: whether Draven, Audacious and the other 14 "score 1 point" cards have been officially reworded to "gain" (section 2.1 P14).
- **UNCONFIRMED**: which Emperor of the Sands wording is current.
- **UNCONFIRMED**: a public Watcher database.
- **UNCONFIRMED**: whether Forgotten Monument still suppresses conquer and hold triggers under the current CR (section 2.7 L8).
- **UNCONFIRMED**: Power symbols of the 23 printings whose two gallery text fields disagree (section 1, Gallery check).
- **UNCONFIRMED**: effective dates of PN-OGN and PN-UNL (articles give none) and of each errata article.
- Not done: card-by-card check that the GameLab engine implements each functional erratum; reading rules cited by FAQ-OGN, FAQ-SFD and FAQ-UNL rulings against the current CR beyond the numbers listed in section 2 (rows that cite only an article were not re-located in the CR and inherit the precedence caveat of section 0).
- The whole numbering changes with the Legacy rules rewrite announced for January 2027.

## Reproduce

```
cd docs/research/analysis/rulings-and-errata
node fetch-official.mjs          # 15 articles + hub + news indexes into raw/
node sitemap.mjs                 # raw/sitemap-en-us.txt
python3 -I extract.py            # raw/*.txt, manifest.json
python3 -I build_errata.py       # out/errata.json, out/errata-table.md
python3 -I community_scan.py     # out/community-scan.json
python3 -I cr_quotes.py          # out/cr-quotes.json: card text quoted in the Core Rules vs gallery and errata
python3 -I faq_index.py          # out/faq-rulings.json: all 180 FAQ question blocks, by card
python3 -I assemble.py           # writes ../../rulings-and-errata.md from doc_template.md
python3 -I check_citations.py    # every CR number cited above must exist in the cached edition (exit 1 if not)
```
