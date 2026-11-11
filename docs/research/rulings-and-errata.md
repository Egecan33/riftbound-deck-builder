# Rulings, errata and rules changes as synced data (mechanics ground truth, fetched 2026-11-11)

Scope: everything official that changes what a card does or how cards interact, beyond the printed text: card errata, FAQ rulings, and Core Rules patch notes, for Origins (OGN), Proving Grounds (OGS), Spiritforged (SFD), Unleashed (UNL), Vendetta (VEN) and Radiance (RAD). Deck-construction rules are in `rules.md` and are not repeated here.

Labels: **FACT** = stated by a primary source (URL or rule number given). **DATA** = measured (dataset and n named). **HEURISTIC** = our reading. **UNCONFIRMED** = no primary source found.

Rule numbers are from the current Core Rules, edition 2026-10-09 (CR; URL in `rules.md` section 0; text cached at `analysis/raw/core-rules-2026-10-09.compact.txt`). A number written as "old 735.1.c" is a number quoted inside an older article and is not valid today. Card codes after card names are added by `analysis/rulings-and-errata/assemble.py` from the official gallery snapshot of 2026-11-11 (1408 printings); card text in section 1 is copied by script from the errata articles and the gallery, never typed by hand.

## 0. Sources

All fetched 2026-11-11 with `analysis/rulings-and-errata/fetch-official.mjs` (serial, 2 s apart), text extracted from each page's embedded JSON by `extract.py` into `analysis/rulings-and-errata/raw/*.txt`. `rev` is the CMS revision value in the page data on the fetch date. It is not unique per article (ERR-OGN, PN-OGN and PN-SFD share one value), so change detection must use the hash of the extracted text (`manifest.json`, column `text sha256`, first 16 hex digits).

| Key | Article | Published (UTC) | rev | text sha256 | URL |
|---|---|---|---|---|---|
| ERR-OGN | Riftbound: Origins Card Errata | 2025-10-28 | `P2jdEKc6GZf6O4yCyb7qAi` | `2de3a9131c4d7507` | https://playriftbound.com/en-us/news/rules-and-releases/riftbound-origins-card-errata/ |
| FAQ-OGN | Riftbound Origins FAQ | 2025-10-16 | `K6OBYVD123yLLpF7jBugK5` | `b1752608799f8b83` | https://playriftbound.com/en-us/news/rules-and-releases/riftbound-origins-faq/ |
| PN-OGN | Riftbound Core Rules: Patch Notes | 2025-10-24 | `P2jdEKc6GZf6O4yCyb7qAi` | `990c1763cbe6f3cd` | https://playriftbound.com/en-us/news/rules-and-releases/riftbound-core-rules-patch-notes/ |
| PN-SFD | Riftbound Core Rules: Spiritforged Patch Notes | 2025-12-05 | `P2jdEKc6GZf6O4yCyb7qAi` | `8bee306aa07c402a` | https://playriftbound.com/en-us/news/rules-and-releases/riftbound-core-rules-spiritforged-patch-notes/ |
| ERR-SFD | Riftbound Spiritforged Errata | 2026-01-14 | `lUOsIMoAHmGZdg2cOiAhmD` | `52d6d2ecf9526df6` | https://playriftbound.com/en-us/news/rules-and-releases/riftbound-spiritforged-errata/ |
| FAQ-SFD | Riftbound Spiritforged FAQ | 2026-01-14 | `5xgDHibkxp25pk3FnVT0MH` | `be71c112f0232b0a` | https://playriftbound.com/en-us/news/rules-and-releases/riftbound-spiritforged-faq/ |
| PN-UNL | Riftbound Core Rules: Unleashed Patch Notes | 2026-03-30 | `XCTgZQwSGIOEwOvRbvMYKc` | `e39d2c7225c2a46f` | https://playriftbound.com/en-us/news/rules-and-releases/riftbound-core-rules-unleashed-patch-notes/ |
| ERR-UNL | Unleashed Errata Updates | 2026-04-03 | `CBOnzl0gEDUl3TLD2Ros2W` | `d1770bee0897d244` | https://playriftbound.com/en-us/news/rules-and-releases/unleashed-errata-updates/ |
| FAQ-UNL | Unleashed Rules FAQ and Clarifications | 2026-04-29 | `juolGRHVtjOsRLFYBEaf3Z` | `5a3568b03d532216` | https://playriftbound.com/en-us/news/rules-and-releases/unleashed-rules-faq-and-clarifications/ |
| PN-VEN | Core Rules: Vendetta Patch Notes | 2026-07-17 | `JxwKjQ4plLez7JxHpqarfH` | `5bf07f0a1b432b2c` | https://playriftbound.com/en-us/news/announcements/core-rules-vendetta-patch-notes/ |
| ERR-VEN | Vendetta Errata Updates | 2026-07-23 | `M4hdb3GDOMuirfurf2K1C0` | `e972c20fa36c5c0b` | https://playriftbound.com/en-us/news/announcements/vendetta-errata-updates/ |
| FAQ-VEN | Vendetta Rules FAQ and Clarifications | 2026-08-14 | `xOUhMZ9vc49S6GmzdkrIRK` | `cb24a198c3bcb14c` | https://playriftbound.com/en-us/news/rules-and-releases/vendetta-rules-faq-and-clarifications/ |
| PN-RAD | Core Rules: Radiance Patch Notes (Effective October 16, 2026) | 2026-10-09 | `ry10dByU7EEFU2qpX6EE6c` | `7c9ab9cd21c108c7` | https://playriftbound.com/en-us/news/announcements/core-rules-radiance-patch-notes-effective-october-16-2026/ |
| ERR-RAD | Radiance Errata Updates | 2026-10-09 | `xazD1NydBvxtmIxXWIWiO4` | `6e80353c96b715bb` | https://playriftbound.com/en-us/news/announcements/radiance-errata-updates/ |
| FAQ-RAD | Radiance Rules FAQ and Clarifications | 2026-10-26 | `6LbxA4c5p2VL183RwYVb7m` | `6ed96921760cfbd1` | https://playriftbound.com/en-us/news/organizedplay/radiance-rules-faq-and-clarifications/ |
| HUB | Rules Hub | 2026-07-17 | `T4xYXIZ0qoV31nY2YA0myb` | `eb7630bbb8902c88` | https://playriftbound.com/en-us/rules-hub/ |

Completeness check. **DATA** (official sitemap https://playriftbound.com/sitemap_index.xml, en-us, 138 URLs, fetched 2026-11-11; list in `raw/sitemap-en-us.txt`): the 15 articles above are every en-us news URL whose slug contains errata, faq (rules), or patch-notes. There is no separate Proving Grounds errata article; the two Proving Grounds cards with errata (Dark Child, Starter; Highlander) are inside the Origins errata article. The other rules-relevant articles (ban lists, Tournament Rules changelogs, start-of-game test) are covered in `rules.md`.

Precedence. **FACT** (FAQ-RAD, FAQ-VEN, same wording): "In places where the FAQ differs from the Core Rules Document, the FAQ takes precedence. When a new Core Rules Document is released, it will take precedence over any points that differ from this document." Consequence on 2026-11-11:

1. FAQ-RAD (2026-10-26) is newer than CR 2026-10-09 and wins over it.
2. CR 2026-10-09 wins over every older FAQ (Origins, Spiritforged, Unleashed, Vendetta). Older FAQ rulings are still correct where the CR says the same thing; several were reversed (section 2.9).
3. Card errata are separate from rules precedence: the latest errata text of a card is its text.

Official card text ("Watcher"). **FACT** (TR 420.2): "A player may call a judge at any time to get the Watcher wording for any card". **FACT** (FAQ-OGN, FAQ-SFD): Watcher is the planned database of official wordings; FAQ-SFD (2026-01-14) says "These plans are still in the works". **UNCONFIRMED**: no public Watcher endpoint was found on playriftbound.com on 2026-11-11 (not in the sitemap, not linked from the Rules Hub). Until it exists, the errata articles are the only primary source of corrected text.

Local copies. `~/github_repositories/GameLab/docs/research/official-faq/*` and `docs/research/rulings/*` were fetched 2026-09-06. They contain no Radiance material and their errata ledger (`rulings/errata.md`, 65 cards) misses Keeper of Masks and the four Radiance errata. This file supersedes that ledger.

## 1. Errata table

**FACT**: 67 errata blocks in the five errata articles (31 + 16 + 8 + 8 + 4), covering 67 distinct cards (no card appears in two errata articles). Three more cards were given revised text only in FAQ-OGN (2025-10-16) and are absent from ERR-OGN (2025-10-28): Unyielding Spirit, Symbol of the Solari, Wraith of Echoes. Total 70 rows.

**UNCONFIRMED** for those three: ERR-OGN says "the Core Rules FAQ is now obsolete and will be retired on November 4, 2025" and does not list them, so their revised wording has no standing source after that date. The rulings behind two of them survive in the rules anyway (a unit does not see its own death unless it has Deathknell; Symbol of the Solari's scope is explained in the same FAQ). Treat the FAQ text as the working text, flagged `status: "faq-only"`.

Effective date. **HEURISTIC**: no errata article states an effective date other than its publication; the table uses the publication date (UTC). FAQ-SFD says its clarifications "take effect immediately". ERR-RAD was published 2026-10-09, two weeks before Radiance released (2026-10-23).

Gallery check. **DATA** (gallery snapshot 2026-11-11, compared by `build_errata.py`; symbols normalised: `[S]`=`[M]`, `[T]`=`[E]`, quotes, whitespace). Status per printing: `NEW` = gallery shows the errata text; `OLD` = gallery shows the pre-errata text exactly; `NEW~` = same as errata text once reminder text in brackets is removed.

- Cards: 10 of 70 have every gallery printing on the errata text, 4 have some printings on it, 56 have none.
- Printings: 92 gallery printings belong to these cards: 15 show the errata text (1 of them only after removing reminder text), 77 show the pre-errata text (4 of them a short-reminder variant of it), 0 match neither.
- Cards with only some printings on the errata text: Sona, Harmonious (VEN-SP2/006 updated); Unforgiven (OGN-305/298, OGN-305*/298 updated); Void Burrower (SFD-243/221 updated); Yone, Blademaster (RAD-181/167 updated).

Reading: the gallery is not an errata source. It was corrected in place for 10 cards (Baited Hook, Blind Fury, Convergent Mutation, Dune Drake, Falling Star, Icathian Rain, Kinkou Monk, Ravenborn Tome, Reinforce, The Dreaming Tree), and otherwise shows corrected text only on printings made after the errata; 56 cards still show only the pre-errata text, including all four Radiance errata. A deterministic tool must apply an errata overlay by full card name to every printing.

Source keys are the article keys of section 0 followed by the block number inside that article. The gallery names a legend by its title only: the errata article's "Leblanc, Deceiver" is gallery "Deceiver", "Dark Child, Starter" is gallery name "Dark Child".

| Card | Printings: gallery status | Printed text (pre-errata) | Current text (errata) | Effective | Source | Gallery reflects errata? |
|---|---|---|---|---|---|---|
| Arise! | SFD-198/221 OLD | Play a 2 [M] Sand Soldier unit token for each Equipment you control. Then ready two of them. | Play a 2 [M] Sand Soldier unit token for each Equipment you control. Then do this: Ready up to two of them. | 2026-01-14 | ERR-SFD #4 | no |
| Astral Heron | VEN-044/166 OLD | When you play your first card each turn, if I'm at a battlefield, your next card costs [2][A][A] less. | When you play your first card each turn, if I'm at a battlefield, the next card you play this turn costs [2][A][A] less. | 2026-07-23 | ERR-VEN #6 | no |
| Ava Achiever | OGN-107/298 OLD | When I attack, you may pay [C] to play a card with [Hidden] from your hand here, ignoring its cost. | When I attack, you may pay [C] to play a card with [Hidden] from your hand, ignoring its cost. If it’s a unit, play it here. | 2025-10-28 | ERR-OGN #1 | no |
| Baited Hook | OGN-242/298 NEW | [1][C], [E]: Kill a friendly unit. Look at the top 5 cards of your Main Deck. You may play a unit from among them that has Might up to 1 more than the killed unit, ignoring its cost. Then recycle the rest. | [1][C], [E]: Kill a friendly unit. Look at the top 5 cards of your Main Deck. You may banish a unit from among them that has Might up to 1 more than the killed unit and play it, ignoring its cost. Then recycle the rest. | 2025-10-28 | ERR-OGN #2 | yes |
| Blind Fury | OGN-025/298 NEW | [Action] (Play on your turn or in showdowns.) / Each opponent reveals the top card of their Main Deck. Choose one and play it, ignoring its cost. Then recycle the rest. | [Action] (Play on your turn or in showdowns.) / Each opponent reveals the top card of their Main Deck. Choose one and banish it, then play it, ignoring its cost. Then recycle the rest. | 2025-10-28 | ERR-OGN #3 | yes |
| Blood Rush | SFD-003/221 OLD | [Action] (Play on your turn or in showdowns.) / [Repeat] [1] (You may pay the additional cost to repeat this spell's effect.) / Give a unit [Assault 2]. (+2 [M] while it's an attacker.) | [Action] (Play on your turn or in showdowns.) / [Repeat] [1] (You may pay the additional cost to repeat this spell's effect.) / Give a unit [Assault 2] this turn. (+2 [M] while it's an attacker.) | 2026-01-14 | ERR-SFD #5 | no |
| Bone Skewer | UNL-139/219 OLD | [Hidden] (Hide now for [A] to react with later for [0].) / Choose a battlefield. An opponent reveals their hand. You may choose a unit from it. They play that unit to that battlefield, ignoring any and all costs. When they do, [Stun] it. (It doesn't deal combat damage this turn.) | [Hidden] (Hide now for [A] to react with later for [0].) / Choose a battlefield. An opponent reveals their hand. You may choose a unit from it. They play that unit to that battlefield, ignoring any and all costs. If they do, then do this: [Stun] it. (It doesn't deal combat damage this turn.) | 2026-04-03 | ERR-UNL #4 | no |
| Clockwork Keeper | OGN-044/298 OLD | As you play me, you may pay [C] as an additional cost. If you do, draw 1. | You may pay [C] as an additional cost to play me. / When you play me, if you paid the additional cost, draw 1. | 2025-10-28 | ERR-OGN #4 | no |
| Convergent Mutation | OGN-108/298 NEW | [Reaction] (Play any time, even before spells and abilities resolve.) / Choose a friendly unit. Increase its Might until it equals the Might of another friendly unit. | [Reaction] (Play any time, even before spells and abilities resolve.) / Choose a friendly unit. This turn, increase its Might to the Might of another friendly unit. | 2025-10-28 | ERR-OGN #5 | yes |
| Dark Child, Starter | OGS-017/024 OLD | At the end of your turn, ready 2 runes. | At the end of your turn, ready up to 2 runes. | 2025-10-28 | ERR-OGN #6 | no |
| Dazzling Aurora | OGN-160/298 OLD | At the end of your turn, reveal cards from the top of your Main Deck until you reveal a unit. Play it, ignoring its cost, and recycle the rest. | At the end of your turn, reveal cards from the top of your Main Deck until you reveal a unit and banish it. Play it, ignoring its cost, and recycle the rest. | 2025-10-28 | ERR-OGN #7 | no |
| Death from Below | UNL-186/219 OLD | Kill a unit at a battlefield. Then, if it had 3 [M] or less, you may play this from your trash for [A]. | Kill a unit at a battlefield. Then, if it had 3 [M] or less, do this: You may play this from your trash for [A]. | 2026-04-03 | ERR-UNL #3 | no |
| Deathgrip | SFD-163/221 OLD | [Reaction] (Play any time, even before spells and abilities resolve.) / Kill a friendly unit to give +[M] equal to its Might to another friendly unit this turn. Draw 1. | [Reaction] (Play any time, even before spells and abilities resolve.) / Kill a friendly unit. If you do, give +[M] equal to its Might to another friendly unit this turn. / Draw 1. | 2026-01-14 | ERR-SFD #6 | no |
| Diana, Lunari | UNL-079/219 OLD, UNL-079a/219 OLD~ | When a showdown begins here, you may pay [1]. If you do, [Predict], then reveal the top card of your Main Deck. If it's a spell, draw it. (To Predict, look at the top card of your Main Deck. You may recycle it.) | When a showdown begins here, you may pay [1] to [Predict], then reveal the top card of your Main Deck. If it's a spell, draw it. (To Predict, look at the top card of your Main Deck. You may recycle it.) | 2026-07-23 | ERR-VEN #4 | no |
| Disintegrate | OGN-005/298 OLD | [Action] (Play on your turn or in showdowns.) / Deal 3 to a unit at a battlefield. If this kills it, draw 1. | Action (Play on your turn or in showdowns.) / Deal 3 to a unit at a battlefield. If this kills it, do this: draw 1. | 2025-10-28 | ERR-OGN #8 | no |
| Dragon's Rage | OGN-258/298 OLD | Move an enemy unit. Then choose another enemy unit at its destination. They deal damage equal to their Mights to each other. | Move an enemy unit. Then do this: Choose another enemy unit at its destination. They deal damage equal to their Mights to each other. | 2025-10-28 | ERR-OGN #9 | no |
| Draven, Vanquisher | SFD-020a/221 OLD, SFD-020/221 OLD | When I win a combat, play a Gold gear token exhausted. / When I attack or defend, you may pay [C]. If you do, give me +2 [M] this turn. | When I win a combat, play a Gold gear token exhausted. / When I attack or defend, you may pay [C] to give me +2 [M] this turn. | 2026-07-23 | ERR-VEN #1 | no |
| Dune Drake | OGN-131/298 NEW | When I attack, give me +2 [M] if there is a ready enemy unit here. | When I attack, give me +2 [M] this turn if there is a ready enemy unit here. | 2025-10-28 | ERR-OGN #10 | yes |
| Edge of Night | SFD-139/221 OLD | [Hidden] (Hide now for [A] to react with later for [0].) / When you play this from face down, attach it to a unit you control here. / [Equip] [C] ([C]: Attach this to a unit you control.) | [Hidden] (Hide now for [A] to react with later for [0].) / When you play this from face down, attach it to a unit you control _(here)_. / [Equip] [C] ([C]: Attach this to a unit you control.) | 2026-01-14 | ERR-SFD #7 | no |
| Elnuk Herd | RAD-081/167 OLD | [Hidden] (Hide now for [A] to react with later for [0].) / When you play me, give another friendly unit +3 [M] this turn, then recycle me if I was played from face down. | [Hidden] (Hide now for [A] to react with later for [0].) / When you play me, give a friendly unit +3 [M] this turn, then recycle me if I was played from face down. | 2026-10-09 | ERR-RAD #1 | no |
| Emperor's Dais | SFD-207/221 OLD | When you conquer here, you may pay [1] and return a unit you control here to its owner's hand. If you do, play a 2 [M] Sand Soldier unit token here. | When you conquer here, you may pay [1] and return a unit you control here to its owner's hand to play a 2 [M] Sand Soldier unit token here. | 2026-07-23 | ERR-VEN #2 | no |
| Falling Star | OGN-029/298 NEW | Do this twice: / Deal 3 to a unit. (You can choose different units.) | Deal 3 to a unit. / Deal 3 to a unit. | 2026-01-14 | ERR-SFD #1 | yes |
| Fizz, Trickster | SFD-140/221 OLD | When you play me, you may play a spell from your trash with Energy cost no more than [3], ignoring its Energy cost. Recycle that spell after you play it. (You must still pay its Power cost.) | When you play me, you may play a spell from your trash with Energy cost no more than [3], ignoring its Energy cost. Then recycle it. (You must still pay its Power cost.) | 2026-07-23 | ERR-VEN #3 | no |
| Forbidden Technique | RAD-010/167 OLD | Ready a unit. / When you play a card with Energy cost [7] or more, you may play this from your trash for [1][C][C]. Banish this. | Ready a unit. / When you play a card with Energy cost [7] or more, you may play this from your trash for [1][C][C]. Then banish this. | 2026-10-09 | ERR-RAD #3 | no |
| Gangplank, Naval | VEN-086/166 OLD, VEN-181/166 OLD~ | [Empower] [C][C] ([C][C]: Empower me. Use only if not Empowered.) / [Empowered][>] If a spell or ability that chooses me would stun me, give me -[M], or return me to hand, give me +3 [M] instead. | [Empower] [C][C] ([C][C]: Empower me. Use only if not Empowered.) / [Empowered][>] If a spell or ability that chooses me would stun me, give me -[M], or return me to hand, give me +3 [M] this turn instead. | 2026-07-23 | ERR-VEN #7 | no |
| Guards! | SFD-154/221 OLD | [Hidden] (Hide now for [A] to react with later for [0].) / Play a 2 [M] Sand Soldier unit token. You may pay [C] to ready it. | [Hidden] (Hide now for [A] to react with later for [0].) / Play a 2 [M] Sand Soldier unit token. Then do this: You may pay [C] to ready it. | 2026-04-03 | ERR-UNL #1 | no |
| Highlander | OGS-020/024 OLD | [Reaction] (Play any time, even before spells and abilities resolve.) / Choose a friendly unit. The next time it dies this turn, recall it exhausted instead. (Send it to base. This isn't a move.) | [Reaction] (Play any time, even before spells and abilities resolve.) / Choose a friendly unit. The next time it would die this turn, heal it, exhaust it, and recall it instead. (Send it to base. This isn't a move.) | 2025-10-28 | ERR-OGN #11 | no |
| Icathian Rain | OGN-248/298 NEW | Do this 6 times: / Deal 2 to a unit. (You can choose different units.) | Deal 2 to a unit. / Deal 2 to a unit. / Deal 2 to a unit. / Deal 2 to a unit. / Deal 2 to a unit. / Deal 2 to a unit. | 2026-01-14 | ERR-SFD #2 | yes |
| Janna, Savior | SFD-053/221 OLD | [Reaction] (Play any time, even before spells and abilities resolve, including to a battlefield you control.) / When you play me, heal your units here, then move an enemy unit from here to its base. | [Reaction] (Play any time, even before spells and abilities resolve, including to a battlefield you control.) / When you play me, heal your units here, then move up to one enemy unit from here to its base. | 2026-01-14 | ERR-SFD #8 | no |
| Jax, Unmatched | SFD-054a/221 OLD | [Deflect] (Opponents must pay [A] to choose me with a spell or ability.) / Each Equipment in your hand has [Quick-Draw]. (It gains [Reaction]. When you play it, attach it to a unit you control.) | [Deflect] (Opponents must pay [A] to choose me with a spell or ability.) / Your Equipment everywhere have [Quick-Draw]. (Each gains [Reaction]. When you play it, attach it to a unit you control.) | 2026-01-14 | ERR-SFD #9 | no |
| Karma, Channeler | OGN-235/298 OLD, SFD-237*/221 OLD, SFD-237/221 OLD | [Vision] (When you play me, look at the top card of your Main Deck. You may recycle it.) / When you recycle one or more cards, buff a friendly unit. (If it doesn't have a buff, it gets a +1 [M] buff. Runes aren't cards.) | [Vision] (When you play me, look at the top card of your Main Deck. You may recycle it.) / When you recycle one or more cards to your Main Deck, buff a friendly unit. (If it doesn't have a buff, it gets a +1 [M] buff. Runes aren't cards.) | 2025-10-28 | ERR-OGN #12 | no |
| Kato the Arm | SFD-112/221 OLD | [Deflect] (Opponents must pay [A] to choose me with a spell or ability.) / When I move to a battlefield, give a friendly unit my keywords and +[M] equal to my Might this turn. | [Deflect] (Opponents must pay [A] to choose me with a spell or ability.) / When I move to a battlefield, give another friendly unit my keywords and +[M] equal to my Might this turn. | 2026-01-14 | ERR-SFD #10 | no |
| Keeper of Masks | UNL-081/219 OLD | [Hidden] (Hide now for [A] to react with later for [0].) / [Temporary] (Kill me at the start of my controller's Beginning Phase, before scoring.) / When you play me, play two Reflection unit tokens here. They become copies of me. | [Hidden] (Hide now for [A] to react with later for [0].) / [Temporary] (Kill me at the start of my controller's Beginning Phase, before scoring.) / When you play me, play two Reflection unit tokens here. Then do this: They become copies of me. | 2026-04-03 | ERR-UNL #7 | no |
| Kinkou Monk | OGN-141/298 NEW | When you play me, buff two other friendly units. (Each one that doesn't have a buff gets a +1 [M] buff.) | When you play me, buff up to two other friendly units. (Each one that doesn't have a buff gets a +1 [M] buff.) | 2025-10-28 | ERR-OGN #13 | yes |
| Last Caress | RAD-154/167 OLD | [Reaction] (Play any time, even before spells and abilities resolve.) / The next unit you play this turn (even from face down) can be played to any battlefield. When you play it, [Buff] it. (Give it a +1 [M] buff if it doesn't have one.) | [Reaction] (Play any time, even before spells and abilities resolve.) / The next unit you play this turn, even from face down, can be played to any battlefield. When you play it, [Buff] it. (Give it a +1 [M] buff if it doesn't have one.) | 2026-10-09 | ERR-RAD #2 | no |
| Leblanc, Deceiver | UNL-199/219 OLD, UNL-235*/219 OLD, UNL-235/219 OLD | When you conquer or hold, you may discard 1 and exhaust me to play a ready Reflection unit token there. It becomes a copy of another unit there. Give it [Temporary]. | When you conquer or hold, you may discard 1 and exhaust me to play a ready Reflection unit token there. Then do this: It becomes a copy of another unit there. Give it [Temporary]. | 2026-04-03 | ERR-UNL #5 | no |
| Mirror Image | UNL-200/219 OLD | Choose a unit. Play a ready Reflection unit token to your base. It becomes a copy of that unit. Give it [Temporary]. (Kill it at the start of its controller's Beginning Phase, before scoring.) | Choose a unit. Play a ready Reflection unit token to your base. Then do this: It becomes a copy of that unit. Give it [Temporary]. (Kill it at the start of its controller's Beginning Phase, before scoring.) | 2026-04-03 | ERR-UNL #6 | no |
| Neeko, Blending In | RAD-167/167 OLD | (Neutral cards can go in decks of any Domain.) / If Neeko is in your deck, choose 3 different legends in addition to your starting legend. (Different means none match names.) / When you play me, choose one of those Legends and add it to your Legend Zone while I'm on the board. | (Neutral cards can go in decks of any Domain.) / If Neeko is in your deck, choose up to 3 different legends in addition to your starting legend. (Different means none match names.) / When you play me, choose one of those Legends and add it to your Legend Zone while I'm on the board. | 2026-10-09 | ERR-RAD #4 | no |
| Nocturne, Horrifying | OGN-194/298 OLD | [Ganking] (I can move from battlefield to battlefield.) / When you look at cards from the top of your deck (and don't draw them) and see me, you may play me for [A]. | [Ganking] (I can move from battlefield to battlefield.) / As you look at or reveal me from the top of your deck, you may banish me. If you do, you may play me for [A]. | 2025-10-28 | ERR-OGN #14 | no |
| Pack of Wonders | OGN-181/298 OLD | [E]: Return another friendly gear, unit, or [Hidden] card to its owner's hand. | [E]: Return another friendly gear, unit, or facedown card to its owner's hand. | 2025-10-28 | ERR-OGN #15 | no |
| Portal Rescue | OGN-102/298 OLD | [Action] (Play on your turn or in showdowns.) / Banish a friendly unit, then play it to base, ignoring its cost. | [Action] (Play on your turn or in showdowns.) / Banish a friendly unit, then its owner plays it to their base, ignoring its cost. | 2025-10-28 | ERR-OGN #16 | no |
| Promising Future | OGN-115/298 OLD | Each player looks at the top 5 cards of their Main Deck, chooses one, then recycles the rest. Starting with the next player, each player plays those cards, ignoring Energy costs. (They must still pay Power costs.) | Each player looks at the top 5 cards of their Main Deck, banishes one of them, then recycles the rest. Starting with the next player, each player plays those cards, ignoring Energy costs. (They must still pay Power costs.) | 2025-10-28 | ERR-OGN #17 | no |
| Ravenborn Tome | OGN-032/298 NEW | [E]: The next spell you play deals 1 Bonus Damage. (Each instance of damage the spell deals is increased by 1.) | [E]: The next spell you play this turn deals 1 Bonus Damage. (Each instance of damage the spell deals is increased by 1.) | 2025-10-28 | ERR-OGN #18 | yes |
| Reinforce | OGN-062/298 NEW | Look at the top 5 cards of your Main Deck. You may play a unit from among them. Its Energy cost is reduced by [5]. Then recycle the remaining cards. | Look at the top 5 cards of your Main Deck. You may banish a unit from among them, then play it, reducing its cost by [5]. Recycle the remaining cards. | 2026-01-14 | ERR-SFD #3 | yes |
| Rek'Sai, Swarm Queen | SFD-170a/221 OLD, SFD-170/221 OLD | When I attack, you may reveal the top 2 cards of your Main Deck. You may play one. Then recycle the rest. If the played card is a unit, you may play it here. | When I attack, you may reveal the top 2 cards of your Main Deck. You may banish one, then play it. If it is a unit, you may play it here. Recycle the rest. | 2026-01-14 | ERR-SFD #11 | no |
| Relentless Pursuit | SFD-184/221 OLD | [Action] (Play on your turn or in showdowns.) / Move a friendly unit. You may attach an Equipment with the same controller to it. This turn, that unit has "When I conquer, you may move me to my base." | [Action] (Play on your turn or in showdowns.) / Move a friendly unit. You may attach up to one Equipment with the same controller to it. This turn, that unit has "When I conquer, you may move me to my base." | 2026-04-03 | ERR-UNL #2 | no |
| Rell, Magnetic | SFD-024/221 OLD | [Tank] (I must be assigned combat damage first.) / When I attack, you may play an Equipment with Energy cost no more than [2], ignoring its cost, and attach it to me. | [Tank] (I must be assigned combat damage first.) / When I attack, you may play an Equipment with Energy cost no more than [2], ignoring its cost. If you do, then do this: Attach it to me. | 2026-01-14 | ERR-SFD #12 | no |
| Rengar, Trophy Hunter | VEN-179/166 OLD~, UNL-120a/219 OLD~, UNL-120/219 OLD | [Ambush] (You may play me as a [Reaction] to a battlefield where you have units.) / I can be played to a battlefield where there are enemy units (even if you don't have units there). | [Ambush] (You may play me as a [Reaction] to a battlefield where you have units.) / I can [Ambush] to a battlefield where there are enemy units, even if you don't have units there. | 2026-04-03 | ERR-UNL #8 | no |
| Resonating Strike | VEN-034/166 OLD | [Hidden] (Hide now for [A] to react with later for [0].) / [Reaction] (Play on your turn or in showdowns.) / Choose a battlefield you control and a unit you control at a different location. Move that unit to that battlefield and give it +2 [S] this turn. | [Hidden] (Hide now for [A] to react with later for [0].) / [Reaction] (Play any time, even before spells and abilities resolve.) / Choose a battlefield you control and a unit you control at a different location. Move that unit to that battlefield and give it +2 [S] this turn. | 2026-07-23 | ERR-VEN #8 | no |
| Salvage | OGN-224/298 OLD | [Action] (Play on your turn or in showdowns.) / You may kill a gear. Draw 1. | [Action] (Play on your turn or in showdowns.) / You may kill up to one gear. Draw 1. | 2025-10-28 | ERR-OGN #19 | no |
| Sigil of the Storm | OGN-287/298 OLD | When you conquer here, recycle one of your runes. | When you conquer here, you must recycle one of your runes. (This doesn’t choose anything.) | 2025-10-28 | ERR-OGN #20 | no |
| Sona, Harmonious | OGN-073/298 OLD, VEN-SP2/006 NEW | While I'm at a battlefield, ready 4 friendly runes at the end of your turn. | At the end of your turn, if I'm at a battlefield, ready up to 4 friendly runes. | 2025-10-28 | ERR-OGN #21 | partly |
| Stalking Wolf | UNL-166/219 OLD | [Ambush] (You may play me as a [Reaction] to a battlefield where you have units.) / As an additional cost to play me, kill a Bird, Cat, Dog, or Poro you control. You may play me to its battlefield (even if you don't have other units there). | [Ambush] (You may play me as a [Reaction] to a battlefield where you have units.) / As an additional cost to play me, kill a Bird, Cat, Dog, or Poro you control. You may [Ambush] me to its battlefield, even if you don't have other units there. | 2026-07-23 | ERR-VEN #5 | no |
| Symbol of the Solari | OGN-227/298 OLD | If a combat where you are the attacker ends in a tie, recall ALL units instead. (Send them to base. This isn't a move. Ties are calculated after combat damage is dealt.) | If a combat where you are the attacker ends in a tie that would recall any of your units, recall all units at that battlefield instead. (Send them to base. This isn't a move. Ties are calculated after combat damage is dealt.) | 2025-10-16 | FAQ-OGN (faq-only) | no |
| Targon's Peak | OGN-289/298 OLD | When you conquer here, ready 2 runes at the end of this turn. | When you conquer here, ready up to 2 runes at the end of this turn. | 2025-10-28 | ERR-OGN #22 | no |
| Teemo, Strategist | OGN-121/298 OLD, OGN-121a/298 OLD, SFD-230*/221 OLD, SFD-230/221 OLD | [Hidden] (Hide now for [A] to react with later for [0].) / When I defend or I'm played from [Hidden], reveal the top 5 cards of your Main Deck. Deal 1 to an enemy unit here for each card with [Hidden], then recycle them. | [Hidden] (Hide now for [A] to react with later for [0].) / When I defend, choose an enemy unit here and reveal the top 5 cards of your Main Deck. Deal 1 to that unit for each card with [Hidden] revealed this way, then recycle the revealed cards. | 2025-10-28 | ERR-OGN #23 | no |
| The Boss | OGN-269/298 OLD, OGN-310*/298 OLD, OGN-310/298 OLD | When a buffed unit you control would die, you may pay [C] and exhaust me to spend its buff and recall it exhausted instead. (Send it to base. This isn't a move.) / When you conquer, ready me. | If a buffed unit you control would die, you may pay [C], exhaust me, and spend its buff to heal it, exhaust it, and recall it instead. (Send it to base. This isn't a move.) / When you conquer, ready me. | 2025-10-28 | ERR-OGN #24 | no |
| The Dreaming Tree | OGN-292/298 NEW | The first time you choose a friendly unit with a spell here each turn, draw 1. | When a player chooses a friendly unit here with a spell for the first time each turn, they draw 1. | 2025-10-28 | ERR-OGN #25 | yes |
| The Syren | OGN-184/298 OLD | [1], [E]: Move a friendly unit at a battlefield to your base. | [1], [E]: Move a friendly unit at a battlefield to its base. | 2025-10-28 | ERR-OGN #26 | no |
| Tianna Crownguard | SFD-060/221 OLD | [Deflect] (Opponents must pay [A] to choose me with a spell or ability.) / While I'm at a battlefield, opponents can't score points. | [Deflect] (Opponents must pay [A] to choose me with a spell or ability.) / While I'm at a battlefield, opponents can't gain points. | 2026-01-14 | ERR-SFD #13 | no |
| Tideturner | OGN-199/298 OLD | [Hidden] (Hide now for [A] to react with later for [0].) / When you play me, you may choose a friendly unit. Move me to its location and it to my original location. | [Hidden] (Hide now for [A] to react with later for [0].) / When you play me, you may choose a unit you control at another location. Move me to its location and it to my original location. | 2025-10-28 | ERR-OGN #27 | no |
| Unforgiven | OGN-305/298 NEW, OGN-259/298 OLD, OGN-305*/298 NEW | [2], [E]: Move a friendly unit to or from your base. | [2], [E]: Move a friendly unit to or from its base. | 2025-10-28 | ERR-OGN #28 | partly |
| Unlicensed Armory | OGN-023/298 OLD | Discard 1, [E]: Choose a friendly unit. The next time it dies this turn, you may pay [C] to recall it exhausted instead. (Send it to base. This isn't a move.) | Discard 1, [E]: Choose a friendly unit. The next time it would die this turn, you may pay [C] to heal it, exhaust it, and recall it instead. (Send it to base. This isn't a move.) | 2025-10-28 | ERR-OGN #29 | no |
| Unyielding Spirit | OGN-145/298 OLD | [Reaction] (Play any time, even before spells and abilities resolve.) / Prevent all spell and ability damage this turn. | [Reaction] (Play any time, even before spells and abilities resolve.) / Prevent all damage that would be dealt this turn by spells and abilities. | 2025-10-16 | FAQ-OGN (faq-only) | no |
| Void Burrower | SFD-187/221 OLD, SFD-243/221 NEW | When you conquer, you may exhaust me to reveal the top 2 cards of your Main Deck. You may play one. Then recycle the rest. | When you conquer, you may exhaust me to reveal the top 2 cards of your Main Deck. You may banish one, then play it. Recycle the rest. | 2026-01-14 | ERR-SFD #14 | partly |
| Void Gate | OGN-296/298 OLD | Spells and abilities affecting units here each deal 1 Bonus Damage. (Each instance of damage the spell deals is increased by 1.) | Spells and abilities deal 1 Bonus Damage to units here. (Each instance of damage the spell deals to a unit here is increased by 1.) | 2025-10-28 | ERR-OGN #30 | no |
| Void Rush | SFD-188/221 OLD | Reveal the top 2 cards of your Main Deck. You may play one of them, reducing its cost by [2]. Draw any you did not play this way. | Reveal the top 2 cards of your Main Deck. You may banish one, then play it, reducing its cost by [2]. Draw any you didn't banish. | 2026-01-14 | ERR-SFD #15 | no |
| Wraith of Echoes | OGN-118/298 OLD | The first time a friendly unit dies each turn, draw 1. | The first time another friendly unit dies each turn, draw 1. | 2025-10-16 | FAQ-OGN (faq-only) | no |
| Yone, Blademaster | RAD-181/167 NEW~, SFD-116/221 OLD, SFD-233/221 OLD, SFD-233*/221 OLD | [Weaponmaster] (When you play me, you may [Equip] one of your Equipment to me for [A] less, even if it's already attached.) / When I conquer an open battlefield, deal damage equal to my Might to an enemy unit in a base. | [Weaponmaster] (When you play me, you may [Equip] one of your Equipment to me for [A] less, even if it's already attached.) / When I conquer a battlefield that was uncontrolled, deal damage equal to my Might to an enemy unit in a base. | 2026-01-14 | ERR-SFD #16 | partly |
| Zhonya's Hourglass | OGN-077/298 OLD | [Hidden] (Hide now for [A] to react with later for [0].) / The next time a friendly unit would die, kill this instead. Recall that unit exhausted. (Send it to base. This isn't a move.) | [Hidden] (Hide now for [A] to react with later for [0].) / If a friendly unit would die, kill this instead. Heal that unit, exhaust it, and recall it. (Send it to base. This isn't a move.) | 2025-10-28 | ERR-OGN #31 | no |

### 1.1 Which errata change behaviour

**HEURISTIC** classification (ours, from reading old against new text plus the FAQ explanation where one exists). `F` = functional: a parser that reads the old text computes a different outcome. `T` = template only: same outcome, different wording, but the new wording moves the card to a different parse pattern.

| Class | Cards | What changes |
|---|---|---|
| F: targets and Deflect | Falling Star (OGN-029/298), Icathian Rain (OGN-248/298) | All targets chosen when played (no reflexive triggers); the same unit may be chosen several times and Deflect is paid per choice (CR 809.1.c) |
| F: "another" added | Kato the Arm (SFD-112/221), Wraith of Echoes (OGN-118/298) (faq-only) | Cannot affect or count itself |
| F: "a friendly unit" (was "another") | Elnuk Herd (RAD-081/167) | May now give the +3 to itself |
| F: "up to" added | Sona, Harmonious (OGN-073/298), Targon's Peak (OGN-289/298), Dark Child, Starter (OGS-017/024), Kinkou Monk (OGN-141/298), Janna, Savior (SFD-053/221), Salvage (OGN-224/298), Relentless Pursuit (SFD-184/221), Neeko, Blending In (RAD-167/167) | A triggered ability needs every required target to go on the chain (FAQ-SFD, Janna); "up to" lets it trigger with fewer |
| F: owner / base wording | Portal Rescue (OGN-102/298), The Syren (OGN-184/298), Unforgiven (OGN-259/298), Tideturner (OGN-199/298) | Portal Rescue gives a stolen unit back to its owner; the others clarify "its base" |
| F: banish-then-play | Baited Hook (OGN-242/298), Blind Fury (OGN-025/298), Dazzling Aurora (OGN-160/298), Promising Future (OGN-115/298), Reinforce (OGN-062/298), Rek'Sai, Swarm Queen (SFD-170/221), Void Burrower (SFD-187/221), Void Rush (SFD-188/221), Nocturne, Horrifying (OGN-194/298) | A card that cannot be played stays banished instead of going back to the deck; Nocturne also works on "reveal" and is not a triggered ability |
| F: replacement instead of trigger; heals | Zhonya's Hourglass (OGN-077/298), Highlander (OGS-020/024), Unlicensed Armory (OGN-023/298), The Boss (OGN-269/298) | Saved unit is healed, exhausted, recalled; Zhonya's applies on any turn and anywhere |
| F: reflexive trigger ("do this:") | Dragon's Rage (OGN-258/298), Disintegrate (OGN-005/298), Arise! (SFD-198/221), Rell, Magnetic (SFD-024/221), Guards! (SFD-154/221), Leblanc, Deceiver (UNL-199/219), Keeper of Masks (UNL-081/219), Mirror Image (UNL-200/219), Bone Skewer (UNL-139/219), Death from Below (UNL-186/219) | Second part is a separate chain item that can be reacted to and only exists if the first part happened |
| F: cost within instructions ("pay X to ...") | Draven, Vanquisher (SFD-020/221), Emperor's Dais (SFD-207/221), Diana, Lunari (UNL-079/219) | Payment moves from resolution to finalization (CR 383.3.b); an "if you do" clause no longer exists to be negated |
| F: "this turn" added | Convergent Mutation (OGN-108/298), Dune Drake (OGN-131/298), Ravenborn Tome (OGN-032/298), Blood Rush (SFD-003/221), Gangplank, Naval (VEN-086/166), Astral Heron (VEN-044/166) | Effect no longer permanent or open-ended |
| F: scope narrowed | Void Gate (OGN-296/298) (only units there), Karma, Channeler (OGN-235/298) (own Main Deck only), Teemo, Strategist (OGN-121/298) (one target, defend trigger only), Ava Achiever (OGN-107/298) ("here" only for units), Pack of Wonders (OGN-181/298) (facedown card on board), Symbol of the Solari (OGN-227/298) (faq-only: that battlefield only), Unyielding Spirit (OGN-145/298) (faq-only) | See rows |
| F: scope widened | Jax, Unmatched (SFD-054a/221) (Equipment everywhere), Yone, Blademaster (SFD-116/221) (any battlefield that was uncontrolled, including surprise defense), Rengar, Trophy Hunter (UNL-120/219) and Stalking Wolf (UNL-166/219) (the extra play location now uses Ambush, so it comes with Reaction timing) | See rows |
| F: other | Tianna Crownguard (SFD-060/221) ("gain points": conquer and hold still happen and still trigger), Deathgrip (SFD-163/221) (killed unit is a target, bonus only if it died), Sigil of the Storm (OGN-287/298) ("must": no target, cannot be answered by recycling the rune), Fizz, Trickster (SFD-140/221) and Forbidden Technique (RAD-010/167) ("Then recycle/banish" is a replacement effect, CR 829.1.b pattern) | See rows |
| F: other | The Dreaming Tree (OGN-292/298) | Any player who chooses a friendly unit there with a spell draws, not only the battlefield's controller |
| T | Clockwork Keeper (OGN-044/298) (now a normal play effect with a condition), Edge of Night (SFD-139/221), Last Caress (RAD-154/167), Resonating Strike (VEN-034/166) (reminder text of Reaction corrected), Salvage (OGN-224/298) wording aside | Same outcome; Clockwork Keeper moves to a different parse pattern |

## 2. Rulings that change interactions or valuation

Columns: **Rule** = current CR number where we found the rule in the 2026-10-09 text, otherwise the article that states it. **Graph** = consequence for the interaction graph: `EDGE+` creates or confirms an edge, `EDGE-` removes a supposed combo, `STR+` / `STR-` changes how strong an interaction is, `PARSE` = a reading rule the text parser must implement.

### 2.1 Reading card text (parser rules)

| ID | Ruling | Rule / source | Graph |
|---|---|---|---|
| P1 | "Card" in card text means Main Deck card. Runes, legends, battlefields and tokens are not cards. Legion is not turned on by playing a token or using an ability; hiding a card is not playing it | CR 052; CR 812.1.b.1; FAQ-OGN | PARSE. EDGE- for "token maker enables Legion" |
| P2 | "Play" has three meanings. In a trigger condition ("When you play ...") it means the card resolved; a countered card does not trigger it. In any other check ("for each card you've played", Legion) it means the card was finalized; a countered card still counts. As an instruction ("play a unit") it means put it on the chain | CR 420.4.a, 420.4.a.1, 420.4.b; PN-VEN | PARSE. A counterspell stops play triggers but not Legion or cost-reduction counts |
| P3 | "Friendly" = controlled by you or, in 2v2, by your teammate. "Your" = only what you control or own. Control of battlefields is never shared | CR 491.8.e, 491.8.c; FAQ-OGN | PARSE. In 2v2 "friendly unit" effects reach the teammate's units; "your units" effects do not |
| P4 | "Choose" targets. "Pick" does not target (wording introduced in Radiance; older cards still say "choose" for both). Not targets: things in non-public zones, objects named only as a restriction or cost or trigger condition or replacement, "all" objects, objects chosen by other players, anything in a "must" instruction, "your legend" | CR 355.10.a to 355.10.g; PN-RAD "Pick" | PARSE. Deflect, untargetability and Hidden location limits only apply to targets |
| P5 | A triggered ability has up to four leading parts that are not on the chain: trigger condition, an "if" condition right after it, "you may", and a cost ("do X to do Y"). A cost in that position is paid at finalization and is the ability's base cost. The same words later in the sentence are part of the effect and are paid or checked at resolution | CR 383.3.b; FAQ-UNL "Triggered Abilities"; PN-VEN | PARSE. Decides whether the opponent can react before payment |
| P6 | "Pay X to do Y" is a cost: it counts as paid even if the paid action is replaced. "Do X. If you do, Y" is not a cost: if X is replaced or does not happen, Y does not happen | CR 203.2; FAQ-UNL | PARSE. Death-replacement cards (Zhonya's, Unlicensed Armory) keep cost-style effects alive but switch off "if you do" effects |
| P7 | An effect that asks for a card's cost gets the printed cost, never the reduced or increased one. A token's cost is 0 | CR 206; CR 185.3.a.1 | PARSE. "Costs N or more/less" checks are static per card |
| P8 | Unavailable numbers are null, not 0. A unit that left the board has no Might to read | PN-OGN "Null Isn't Zero"; FAQ-OGN (Baited Hook) | EDGE- for Baited Hook plus saving the killed unit |
| P9 | Might below 0 counts as 0 for effects and combat damage, but the real value is kept for later increases. A unit with 0 or less Might does not die by itself; it dies to 1 damage | CR 143.2.c; CR 142.4.b; FAQ-SFD | PARSE. Might reduction is not removal |
| P10 | An ability that references "this battlefield", "here", "my" is read when it resolves. Information taken from the trigger condition itself ("the battlefield I moved to or from", "where I held") is fixed when it triggers | FAQ-VEN (Iascylla, Azir, Akali); CR 359.3.f | PARSE |
| P11 | Dependent keywords (`[Legion][>]`, `[Level N][>]`, `[Empowered][>]`): the whole line after the arrow is switched off until the condition holds, but other effects can still read it | CR 812.1.b; CR 828.1.b, 828.1.c; FAQ-VEN (Heimerdinger) | PARSE. EDGE+ Heimerdinger, Inventor (OGN-111/298) gains the exhaust ability of an unempowered Defender of Tomorrow (VEN-149/166) |
| P12 | Printed rules text of an attached Equipment is inactive; text granted to it is active | CR 135.4, 135.4.a; FAQ-UNL (Turn to Dust) | EDGE+ Turn to Dust (UNL-070/219) kills an attached Equipment at its controller's next Beginning Phase |
| P13 | A facedown card has no readable front: no name, cost, Might or keywords, and it is not "a card with Hidden". It can still be targeted as "a facedown card" because its presence is public | CR 129.4; CR 811.5.a; CR 107.3.f; FAQ-OGN appendix; PN-RAD (Gutter Guardian) | EDGE- Gutter Guardian (RAD-103/167) cannot Show Off a facedown card. EDGE+ Pack of Wonders (OGN-181/298) can return one |

### 2.2 Costs: Deflect, discounts, payment

| ID | Ruling | Rule / source | Graph |
|---|---|---|---|
| C1 | Deflect is paid once for each time the spell or ability chooses the unit. Several Deflect sources on one unit add up. Any domain of Power pays it | CR 809.1.c, 809.1.c.1, 809.2 | STR- for multi-choice spells into Deflect: Icathian Rain (OGN-248/298) choosing one Deflect unit six times costs six Deflect payments |
| C2 | Deflect is a mandatory additional cost, not an optional one. Ezreal, Prodigy (SFD-149/221) reduces only optional additional costs (Repeat, Accelerate), not Deflect and not Equip | CR 356.2.a.2; CR 809.1.d; FAQ-SFD | EDGE- Ezreal plus Deflect. EDGE+ Ezreal plus Repeat or Accelerate |
| C3 | A triggered ability that would have to pay Deflect can be declined; it then fails to finalize | PN-OGN "Pending and Finalizing" | STR+ for Deflect units against trigger-based removal |
| C4 | While a spell or ability chooses a unit at Heisho, Shell of the World (VEN-158/166), Deflect is ignored for that whole spell, including on its other targets elsewhere | CR 766, 767; FAQ-VEN | EDGE+ Heisho plus multi-target spells against Deflect units |
| C5 | Repeat's cost is not reduced by a reduction of the spell's cost, and a self-reduction applies once | FAQ-SFD (Find Your Center with Temporal Portal: final cost 4) | STR- |
| C6 | Discounts that name one cost component apply when that component is added, before general discounts | PN-UNL "Discounts to Cost Components" | PARSE |
| C7 | Paying Energy or Power is always optional when an effect instructs it; declining negates only that instruction | CR 445.2; PN-VEN | PARSE |
| C8 | `[C]` on a card with two domains must be paid with Power of one of those domains (signature cards). Before 2026-07-24 any domain worked | CR 135.2.e.6.c; PN-VEN | STR- for signature cards in decks whose rune split is uneven. Meta discount: see section 3 |
| C9 | Energy and Power are paid before other costs such as "kill a unit" | CR 357.1, 357.2; FAQ-RAD | EDGE- the unit Atakhan (UNL-170/219) kills as its additional cost is not yet in the trash when his Power is paid, so Mordekaiser, Iron Revenant (RAD-143/167) cannot banish it for that payment |
| C10 | "Play me for X" is an alternate cost replacing the base cost; resources restricted to "playing units" can pay it | FAQ-RAD | EDGE+ Meticulous Restorationist (RAD-120/167) from trash paid through Mordekaiser, Iron Revenant |
| C11 | Applied costs ("opponents must pay X to do Y") are paid by whoever performs the action. Charm (OGN-043/298) moving an enemy unit to your Gravity Field (RAD-062/167) battlefield costs nobody anything; Angler Wyrm (RAD-113/167) makes the opponent move, so the opponent pays | CR 204.4; FAQ-RAD | EDGE+ Angler Wyrm plus Gravity Field. EDGE- Charm plus own Gravity Field as a tax |
| C12 | A Standard Move that cannot be completed or paid for is undone entirely; you cannot exhaust a unit by attempting an impossible move | FAQ-RAD | EDGE- "attempt move into Gravity Field to exhaust my own unit" (exhaust-trigger enablers such as Riven, Broken Blade (RAD-043/167)) |
| C13 | The spent Energy for a spell counts even if the spell is countered | FAQ-UNL (Jhin, Meticulous Killer (UNL-089/219) with Singularity) | EDGE+ |
| C14 | A cost reduction for "the first unit played here" is fixed when the cost is determined; a later replacement of where the unit enters does not undo it | FAQ-RAD (Baron Nashor (UNL-147/219) with Hunters' Circle (RAD-163/167)) | EDGE+ |

### 2.3 Targeting, Hidden, untargetable

| ID | Ruling | Rule / source | Graph |
|---|---|---|---|
| T1 | Targets and move destinations are chosen when the spell or ability is put on the chain. All required targets must exist then. If a target is illegal at resolution, only the instructions about it are skipped | CR 355.9; CR 359.3.e.5; PN-OGN | PARSE |
| T2 | A target that stops being legal and becomes legal again before resolution is hit. A target that left the board and came back is a new object and is not hit | CR 359.3.e.3; FAQ-UNL | STR+ for blink effects as protection |
| T3 | Played from facedown: a unit or gear must be played to that battlefield; every target of a hidden spell or of a hidden permanent's play effect must be at that battlefield, each target checked separately; units it plays enter there. Non-targeting effects are not limited | CR 811.1.d.1, 811.1.d.2, 811.1.d.3; PN-VEN "Hidden Targeting" | STR- for hidden removal (one battlefield only). EDGE+ hidden Zhonya's Hourglass (OGN-077/298) saves a unit anywhere; hidden Stand United (OGN-053/298) buffs only there but its global part applies everywhere |
| T4 | A card cannot be played the turn it was hidden; from the next turn it has Reaction and can be played at any Reaction timing, not only in showdowns there | CR 811.1.b; FAQ-OGN | PARSE |
| T5 | Untargetable units are illegal targets; if a unit becomes untargetable after being chosen, the spell misses it | CR 758; FAQ-VEN (Akali, Silent (VEN-038/166) moved out of combat by Flash) | EDGE+ movement as protection |
| T6 | Pending chain items are not legal targets | PN-RAD "Pending Item Target Legality" (rule number not located by text search: **UNCONFIRMED** number) | PARSE |
| T7 | Effects that count a spell's targets include targets that became illegal but are still on the board, not ones that left the board | PN-VEN "Counting Targets"; FAQ-UNL (Repulse against Alpha Strike) | EDGE- moving two targets to base does not enable Repulse (UNL-106/219) |
| T8 | Split damage: if less damage is available at resolution than targets, the controller drops targets, and may not keep fewer targets than damage | CR 355.14.h.1 | PARSE |
| T9 | Fox-Fire's targets are legal as a group (total Might 4 or less); if they outgrow it, the controller keeps a subset of the original targets | FAQ-OGN | STR- against Might pump in response |
| T10 | A player cannot be forced to act on a hidden-information card of a specific type; they may ignore it | FAQ-UNL "Mandatory Actions and Private Information" (Rift Herald (UNL-179/219)) | STR- for forced-play effects |

### 2.4 Triggers, ordering, the chain

| ID | Ruling | Rule / source | Graph |
|---|---|---|---|
| O1 | Nothing happens simultaneously on the chain. One player's simultaneous triggers go on in the order that player chooses; several players' go on in turn order starting with the turn player. Last on, first to resolve | CR 303.2, 303.2.a; PN-RAD (Chronobreak) | PARSE. The turn player's triggers resolve last |
| O2 | Combat start: attacker's triggers first, then other players in turn order, then the defender's. So the defender's "when I defend" triggers resolve first | CR 466.2.d.1 | STR+ for defend triggers that remove an attacker before its attack trigger resolves |
| O3 | Attack and defend triggers fire once per combat per unit, the first time it gets the designation, including when it joins late. Assault and Shield are not triggers and apply whenever the unit is in combat | CR 383.4.e.2.a, 383.4.f.2.a; PN-OGN | EDGE- "move out and back in to re-trigger attack effects". EDGE+ playing a unit into combat triggers its defend effect |
| O4 | Standard Move with several units: exhaust triggers go on the chain before move triggers | FAQ-RAD (Riven, Broken Blade (RAD-043/167), Stellacorn Herder (SFD-048/221)) | PARSE |
| O5 | Units and gear played by an effect are pending, then finalize and resolve at once in the order they were added; their play effects come after | FAQ-OGN "pending items"; PN-RAD (Chronobreak) | PARSE |
| O6 | A unit does not see its own death or deaths simultaneous with its own, unless it has Deathknell or "when I die". "The first time" with several simultaneous events triggers once | FAQ-OGN (Wraith of Echoes); PN-OGN "Nth time" | EDGE- self-death as an enabler for "when a friendly unit dies" on the same unit |
| O7 | A "when you play your Nth card" ability on a permanent triggers only if the permanent is on the board right after that card resolves | FAQ-OGN (Darius, Trifarian (OGN-027/298): works as the second card, not as the third) | PARSE |
| O8 | "When my Might becomes N or more" needs a crossing from below N | FAQ-VEN (Renekton, Brute (VEN-092/166)) | EDGE- re-triggering while already at or above N |
| O9 | Layers are evaluated in one instant: copy, then trait-altering (base Might set), ability-altering, arithmetic. No intermediate value is ever seen | CR 478, 478.1; PN-RAD "Copy Effects Layer"; FAQ-VEN (Dragon Form with Stupefy does not trigger Fiora, Grand Duelist (SFD-205/221)) | EDGE- |
| O10 | "Reducing a unit's Might" means a new non-zero -Might effect is applied. A -Might that is snapshotted to 0 (for example "to a minimum of 1" on a 1-Might unit) is not a reduction | PN-RAD (Ahri, Confident (RAD-038/167)); FAQ-VEN (Gangplank, Naval with Stupefy) | PARSE |
| O11 | An instruction that mistargets is ignored and takes its linked instructions with it. An instruction that is prevented, replaced or impossible is negated and its linked instructions still happen | CR 359.3.e.6, 359.3.e.14.a, 359.3.e.14.b | EDGE+ Hidden Blade (OGN-213/298) on a unit that cannot be killed or is saved by Zhonya's still gives its controller 2 cards. EDGE+ Ride the Wind (OGN-173/298) on a unit that cannot move still readies it |
| O12 | Making new choices for a spell on the chain: all choices must be remade and be legal; targeting triggers fire again; restrictions on the spell (such as Hidden's location limit) stay | CR 753, 753.1, 753.3 | PARSE (Rebuttal (VEN-152/166), Mystic Reversal (OGN-080/298)). Taking control of a spell is not countering it, so "can't be countered" does not stop it (FAQ-VEN) |
| O13 | Spell stolen with Rebuttal: resolution-based triggers of the new controller fire; finalize-based counts stay with the original player | CR 420.4.a, 420.4.b; FAQ-VEN | PARSE |
| O14 | "Once each turn" triggered abilities with "you may": the choice is made at finalization; declining does not use up the turn's use | PN-VEN "Trigger Condition and Effect" | PARSE |

### 2.5 Combat, damage, "excess damage"

| ID | Ruling | Rule / source | Graph |
|---|---|---|---|
| D1 | Lethal damage = non-zero damage at least equal to Might. In combat a unit must be assigned exactly lethal before the next unit gets any; more than lethal may be assigned only when no other unit is left to assign to | CR 142.4.b; CR 467.2.c.3, 467.2.c.4 | PARSE |
| D2 | **"Excess damage" is not defined in the Core Rules.** DATA: the string "excess damage" occurs 0 times in CR 2026-10-09 and appears in the gallery text of: Tryndamere, Barbarian (OGN-034/298), Sivir, Ambitious (SFD-120/221), Yeti Brawler (UNL-018/219), Piltover Enforcer (UNL-187/219), Hextech Gauntlets (UNL-188/219), Trapping Grounds (UNL-217/219). **HEURISTIC** (the reading the GameLab engine implements, `packages/engine/src/engine.ts` near line 6546): excess = sum over the units you assigned to of (assigned minus minimum lethal), which by D1 can only sit on the last unit. **UNCONFIRMED** officially | none | Valuation: excess = your total attacking or defending Might minus the lethal total of the enemy units present. Shield, Tank order, prevention and damage already marked all change it |
| D3 | Replacement and prevention effects on combat damage apply at assignment, so the assigning player must plan around them; a unit that cannot be dealt damage is skipped | CR 467.2.c.5, 467.2.c.10; PN-VEN | STR+ for prevention in combat. Changed 2026-07-24 for damage-increasing effects (Lotus Trap (UNL-013/219)) |
| D4 | Tank must be assigned lethal first, Backline last; with several of the same kind the assigner chooses the order; a unit with both gets one applied, assigner's choice | CR 815.1.b; CR 467.2.c.6 to 467.2.c.8 | PARSE |
| D5 | After combat damage, dead units are removed, then all units are healed, then attackers are recalled if defenders remain | CR 468.1.a.1, 468.1.a.2; FAQ-OGN | EDGE- "kill the Might-aura unit so damaged units die". Deathknell damage lands after the heal and stays on survivors |
| D6 | Combat result: one side alone left = that side wins; both or neither left = no result (tie). Winning is not conquering | FAQ-SFD (Draven, Audacious); FAQ-OGN | PARSE |
| D7 | Draven, Audacious (SFD-148/221)'s point for winning a combat is gained before the conquer point. From 6 points he does not win the game on a single conquer: the conquer then becomes the final point and needs every battlefield scored this turn | FAQ-SFD; CR 473.1.b, 473.1.b.1 | EDGE- "Draven point plus conquer point = win from 6" unless all battlefields are scored |
| D8 | Final point: a conquer at Victory Score minus 1 or higher gives the point only if every battlefield was scored this turn, otherwise draw 1. Points from holds and from card effects are not restricted. You win only with at least the Victory Score and more points than every opponent | CR 473.1.a.1, 473.1.b.1; CR 474 | PARSE. Extra-point effects are worth more than conquers at 7 |
| D9 | "Spell and ability damage" excludes damage a spell tells a unit to deal. Unyielding Spirit stops Void Seeker but not Challenge | FAQ-OGN (faq-only wording, see section 1) | PARSE: split damage effects into "deal N" and "unit deals" |
| D10 | "When you kill a unit with a spell": your spell must itself kill it or deal the damage that kills it in the cleanup right after. Not: a unit dealing damage because of your spell, Might reduction, delayed death, or another player doing the killing. A delayed trigger created by your spell counts | FAQ-OGN (Immortal Phoenix (OGN-037/298)); FAQ-VEN (Imperial Decree) | EDGE+ Hidden Blade on your own Immortal Phoenix returns it. EDGE+ Imperial Decree (OGN-221/298). EDGE- Challenge (OGN-128/298), Stupefy (OGN-095/298) |
| D11 | Bonus Damage adds to each instance of damage; Void Gate's applies only to units at Void Gate | ERR-OGN (Void Gate); PN-OGN | PARSE: multi-instance spells scale per instance |
| D12 | Elder Dragon (UNL-118/219): any damage marked by its controller is lethal to enemy units, including damage marked before it arrived; in combat one damage per enemy unit is enough. Fully prevented damage is not dealt | CR 142.4.c; FAQ-UNL | EDGE+ Elder Dragon plus wide small damage. EDGE- against prevention (Counter Strike (SFD-194/221)) |
| D13 | Hold-on-death timing: control of a battlefield cannot be lost while an item is on the chain or a combat or showdown is ongoing there | FAQ-UNL (old 187.4.c); PN-UNL "Control of Battlefields" | EDGE+ Cruel Patron (OGN-208/298), Baited Hook (OGN-242/298), Arcane Shift (SFD-200/221), Glasc Mixologist (SFD-165/221): kill or banish your only unit at a battlefield and play the new unit to that same battlefield |

### 2.6 Replacement effects, copies, tokens, attachments

| ID | Ruling | Rule / source | Graph |
|---|---|---|---|
| X1 | Several simultaneous events: the controller of a replacement effect orders them; different controllers go in turn order; each replacement is applied in one sequence | CR 373, 373.1, 373.2 | PARSE |
| X2 | A replacement inherits the modifications of the event it replaces ("to a minimum of 1", "exhausted", Temporary) | CR 375; FAQ-VEN (Mel with Stupefy) | PARSE |
| X3 | Replacements that key on "a spell or ability that chooses me" do nothing against effects that do not choose, and nothing when the replaced action does not actually happen | FAQ-VEN (Gangplank, Naval (VEN-086/166) against Blast Cone, Back Off while stunned, Stupefy at 1 Might) | EDGE- |
| X4 | Swap of Might is an increase on one unit and a decrease on the other; a replacement on one side leaves the other side | FAQ-VEN (Switcheroo: 2 becomes 6, Gangplank 6 becomes 9) | EDGE+ |
| X5 | Tokens: created copies get the copied traits as printed traits. A token-doubling replacement applies when the token is played, so a token that later becomes a copy of the doubler does not loop | FAQ-UNL (Zilean, Time Mage (UNL-086/219) with Leblanc, Deceiver (UNL-199/219)) | EDGE- infinite Zileans. EDGE+ two copies per trigger |
| X6 | Copy effects copy printed or already-copied traits only; no granted text, buffs, statuses, Empowered. Copy is its own first layer since 2026-10-16 | PN-RAD; FAQ-VEN (Shady Spectacles); FAQ-SFD (Svellsongur) | PARSE |
| X7 | "When attached" effects such as Svellsongur (SFD-059/221) and Shady Spectacles (VEN-137/166) apply after the attach event. The copied text arrives too late to see that attach | FAQ-VEN, which reverses FAQ-SFD | EDGE- Svellsongur on Aphelios, Exalted (SFD-049/221) does not trigger twice. Before 2026-08-14 the official answer was that it does |
| X8 | Re-attaching Svellsongur or Shady Spectacles gives a fresh instance of a copied once-per-turn ability | FAQ-VEN | EDGE+ |
| X9 | Units cannot be attached to anything; an Equipment that becomes a unit detaches. Equipment attached to a gear stays attached when the gear stops being a unit | CR 143.5, 143.5.a, 143.5.b; CR 435.1.h; PN-RAD (Orianna, Lady of Clockwork (RAD-145/167)) | EDGE- equipping a unit-ified Equipment |
| X10 | A Deploy gear turned into a unit at a battlefield its controller does not control contests it and starts a showdown or combat | PN-RAD (Orianna) | EDGE+ |
| X11 | A unit can never be played to another player's base. If the owner is told to play it to the "same location" and that is someone else's base, it stays banished | FAQ-VEN (Hostile Takeover then Temporal Breach) | EDGE+ as removal of a stolen unit; EDGE- as a way to keep it |
| X12 | A permanent you control but do not own, banished and replayed by its own ability, comes back under the control of whoever is instructed to play it | FAQ-RAD (Possession (OGN-203/298) on Ekko, Revolutionary (RAD-021/167): the thief keeps him) | EDGE+ |
| X13 | "Then banish it" / "Then recycle it" on play-from-trash effects apply however the spell leaves the chain, including when countered or bounced | CR 829.1.b; PN-VEN "New Replacement Effects"; FAQ-VEN (Abandon on a Flow spell) | EDGE- returning a Flow spell to hand for reuse |
| X14 | Permission to play a banished card "until your next Ending Phase" ends when that phase begins | FAQ-RAD (Runeblade Anvil (RAD-012/167)) | PARSE |
| X15 | "At end of turn" text granted to a unit means the end of this turn only; if its death is replaced it does not die on later turns | PN-RAD (Ekko, Boy Who Shattered Time (RAD-139/167) with Unlicensed Armory) | EDGE+ keep the temporary unit |
| X16 | Show Off locks in the shown object's values at finalization | CR 832.1.d.1; PN-RAD (Primordial Roar) | PARSE. Later pump or removal does not change the damage |
| X17 | Referencing "if you channeled this way" counts only the action the spell itself instructed, not extra channels added by another effect | FAQ-RAD (Seraphic Wyvern (RAD-092/167) with Mobilize (OGN-134/298) / Catalyst of Aeons (OGN-138/298); CR 359.3.e.14.c as cited by the FAQ) | EDGE- |

### 2.7 Location rules: where units may be played, "can't beats can"

| ID | Ruling | Rule / source | Graph |
|---|---|---|---|
| L1 | Default: a unit is played to your base or a battlefield you control. Cards may widen or narrow this | PN-SFD "Playing Units to Valid Locations" | PARSE |
| L2 | A restriction ("play me only to ...", "units can't be played here") beats a permission. Two positive location requirements: the player picks one | CR 054, 054.2; CR 355.17.a; FAQ-VEN | EDGE- Perched Grimwyrm (SFD-015/221) cannot be played to Dragon Roost (VEN-157/166) unless Dragon Roost itself was conquered this turn. EDGE+ Temporal Breach (VEN-066/166) on Elder Dragon with Dragon Roost: choose either place |
| L3 | "I enter there" is a replacement on entering and ignores play-location restrictions. Enter-ready replacements stack with it | FAQ-VEN; FAQ-RAD (Baron Nashor with Riven, the Exile (RAD-149/167)) | EDGE+ |
| L4 | Ambush: may be played to a battlefield where you have units, and has Reaction while being played there | CR 822.1.b | PARSE |
| L5 | Accelerate creates a delayed replacement once paid; the unit enters ready even if it loses the keyword | CR 805.1.b; PN-VEN; FAQ-UNL (Atakhan with Rek'Sai, Breacher (SFD-029/221)) | EDGE+ |
| L6 | In games with more than two players, a battlefield with a combat staged or in progress cannot be moved to or played to by players not in that combat | CR 464, 464.1, 464.2 | PARSE (FFA, 2v2) |
| L7 | "Activate conquer effects" does not make a conquer; each ability still checks its own extra conditions | FAQ-UNL (Reckoner's Arena (OGN-286/298) with Yone, Blademaster) | EDGE- |
| L8 | Forgotten Monument (SFD-209/221) stops scoring there entirely (no conquer or hold triggers); Tianna Crownguard (SFD-060/221) only stops points | FAQ-SFD | PARSE |

### 2.8 2v2 and multiplayer

| ID | Ruling | Rule / source | Graph |
|---|---|---|---|
| M1 | Points are shared by the team; Victory Score 11; a battlefield can be scored once per team per turn; a battlefield a teammate controls at the scoring step cannot be scored by the team that turn | CR 491.3, 491.8.b, 491.8.b.1; PN-RAD "2v2 Scoring" | EDGE- "teammate retreats, I conquer the same battlefield" |
| M2 | Teammates can never both have units at one battlefield | FAQ-OGN; CR 464 | PARSE |
| M3 | Moving a unit you do not control "to base" sends it to its controller's base | FAQ-OGN; ERR-OGN (Unforgiven, The Syren) | PARSE |
| M4 | A battlefield ability that has one player make a choice is controlled by that player, whoever controls the battlefield | CR 190.6.c | PARSE (Abandoned Hall (UNL-205/219)) |
| M5 | "Relevant players" and the invite mechanic were removed from free-for-all; everyone may always act in showdowns | PN-OGN | PARSE |

### 2.9 Official rulings that were later reversed

A tool that stores rulings must store the date range, because guides written between the two dates describe the old behaviour.

| Topic | First ruling | Reversed by | Current |
|---|---|---|---|
| Falling Star (OGN-029/298), Icathian Rain (OGN-248/298) | FAQ-OGN 2025-10-16: no targets, reflexive triggers, Deflect per trigger | FAQ-SFD + ERR-SFD 2026-01-14 | Targets up front, Deflect per choice |
| Attack / defend triggers | FAQ-OGN 2025-10-16: can trigger again after leaving and re-entering combat | PN-OGN 2025-10-24 | Once per combat (CR 383.4.e.2.a) |
| Svellsongur on Aphelios, Exalted | FAQ-SFD 2026-01-14: both instances trigger | FAQ-VEN 2026-08-14 | Does not trigger twice |
| "You may" on triggers | PN-UNL 2026-03-30: decided when it triggers | PN-VEN, effective 2026-07-24 | Decided at finalization |
| Remaking choices (Rebuttal, Mystic Reversal) | FAQ-VEN 2026-08-14: any subset of choices | PN-RAD, effective 2026-10-16 | All choices remade (CR 753) |
| Hostile Takeover / Stormbringer on an empty enemy battlefield | FAQ-SFD 2026-01-14: interim "noncombat showdown" | PN-UNL 2026-03-30 | Control locked by showdown or combat, not by Contested |
| Zhonya's Hourglass / Stand United from facedown | pre-FAQ rulings: only that battlefield | FAQ-OGN 2025-10-16 | Only targeting parts are limited |

## 3. Core Rules timeline: changes that altered a mechanic's power

Use: discount tournament or guide data from before a row's effective date when the deck leaned on that mechanic. "Effective" is the date the article gives; where it gives none the publication date is used and marked.

Design intent. **FACT** (PN-SFD, PN-UNL, PN-RAD): rules updates and errata are not used "to manage the power level of any card"; power is handled by the ban list (`rules.md` section 9). The rows below are side effects.

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
| 16 | 2026-10-16 | PN-RAD | Deploy, Disarm, Show Off; copy layer; copy action; additional deckbuilding choices (Neeko); units cannot be attached; layer dependencies; "pick" (non-target choice); conditional clause scope; making new choices = all choices; pending items not targetable; 2v2 scoring aligned; multi-empower permission; negated vs ignored codified; mandatory requirements and restrictions codified | Rebuttal and Mystic Reversal less flexible; otherwise codification |
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
- riftcodex API dump of 2026-11-11 (1451 items), printings of the 70 errata cards: 14 printings show the errata text, 59 the old text, 12 neither (wording or symbol differences not reviewed by hand). It mirrors the gallery; it does not apply errata.
- GameLab `data/cards/cards.json` (931 cards, built 2026-09-06), 65 of the 70 cards present (no Radiance): 13 errata text, 51 old text, 1 neither. Astral Heron is the only card where it is ahead of the gallery.
- GameLab engine: `packages/engine/src` mentions errata on 54 lines across hand-written card scripts. **UNCONFIRMED**: we did not verify card by card that every functional erratum of section 1.1 is implemented; `analysis/interactions/out/text-vs-engine.json` is the place to check.

Printings of the same card whose gallery text differs although no errata exists (**DATA**, `out/silent-diffs.json`, 17 names, 6 of them basic runes with a "[no text]" placeholder):

| Card | Difference | Reading |
|---|---|---|
| Emperor of the Sands (SFD-197/221) | one printing "Your Sand Soldiers have [Weaponmaster]", the other "Sand Soldiers you play have [Weaponmaster]" | **UNCONFIRMED** which is current; functionally different for Sand Soldiers that are stolen or already on board. Needs a judge source |
| Lux, Crownguard (OGS-014/024) | "Use only to play spells" / "Spend this energy only to play spells" | Template |
| Sett, Brawler (OGN-164/298) | "When I'm played and when I conquer" / "When you play me or when I conquer" | Template (moves to the standard play-effect pattern) |
| Viktor, Innovator (OGN-117/298) | "in your base" / "to your base" | Template |
| Lonely Poro (SFD-036/221), Gold token | `[Deathknell] —` / `[Deathknell][>]`; `[Reaction] —` / `[Reaction][>]` | Template (the `[>]` change of 2026-03-30) |
| Renekton, Brute (VEN-092/166), Aphelios, Exalted (SFD-049/221), Riven, Deserter (RAD-114/167), Kai'Sa, Rebel (RAD-063/167), Akali, Deadly Weapon (VEN-021/166) | keyword order, `[Buff]` backer, "is"/"becomes exhausted", punctuation | Template |

Rule for the tool (**HEURISTIC**): when printings differ and no errata exists, use the newest printing and record the difference in `textOverrides`.

## 5. Supposed combos the rules forbid

Origin of this list. **FACT**: the official FAQs say their questions were "gathered from public discussion, from judges across the world" (FAQ-VEN); each row below is a question an official article answered with "no". **DATA** (our cached community corpus: 84 guide pages from riftbound.gg, cardsrealm and others, `out/community-scan.json`): none of these combos is recommended in those 84 pages; where the cards co-occur the guides describe the legal behaviour (for example the riftmana Irelia guide states the Draven 6-point limit correctly). So "popular in community sources" is **UNCONFIRMED** for every row; the evidence is only that the question was asked often enough to get an official answer.

| # | Supposed combo | Why it fails | Rule / source |
|---|---|---|---|
| 1 | Svellsongur (SFD-059/221) on Aphelios, Exalted (SFD-049/221) to trigger his attach ability twice | Copied text is added after the attach event | FAQ-VEN (reverses FAQ-SFD); X7 |
| 2 | Kato the Arm (SFD-112/221) giving himself his own Might and keywords | Errata: "another friendly unit" | ERR-SFD |
| 3 | Portal Rescue (OGN-102/298) on a unit taken with Possession (OGN-203/298) to keep it | Errata: "its owner plays it to their base" | ERR-OGN; FAQ-OGN |
| 4 | Icathian Rain (OGN-248/298) or Falling Star (OGN-029/298) stacked on one Deflect unit for a single Deflect payment | Deflect is paid for each time the unit is chosen | CR 809.1.c |
| 5 | Draven, Audacious (SFD-148/221): win from 6 points with one conquer (Draven point plus conquer point) | Draven's point comes first; the conquer is then the final point and needs every battlefield scored | CR 473.1.b.1; FAQ-SFD |
| 6 | Tianna Crownguard (SFD-060/221) switching off the opponent's conquer and hold triggers | She only stops gaining points | ERR-SFD; FAQ-SFD |
| 7 | Zilean, Time Mage (UNL-086/219) plus Leblanc, Deceiver (UNL-199/219) for unlimited Zilean copies | The doubling applies to the play event; the copies become Zilean afterwards | CR 375; FAQ-UNL |
| 8 | Atakhan (UNL-170/219) killing a unit for its cost and banishing that unit with Mordekaiser, Iron Revenant (RAD-143/167) to pay Atakhan's Power | Energy and Power are paid before the kill | CR 357.1, 357.2; FAQ-RAD |
| 9 | Seraphic Wyvern (RAD-092/167) making Mobilize (OGN-134/298) or Catalyst of Aeons (OGN-138/298) draw when the Rune Deck is nearly empty | Only the spell's own channel is checked | FAQ-RAD |
| 10 | Perched Grimwyrm (SFD-015/221) to Dragon Roost (VEN-157/166) by paying the Roost cost | "Play me only to a battlefield you've conquered this turn" is a restriction; can't beats can | CR 054, 054.2; FAQ-VEN |
| 11 | Reckoner's Arena (OGN-286/298) hold to fire Yone, Blademaster (SFD-116/221)'s conquer damage | His own condition (battlefield was uncontrolled) is still checked | FAQ-UNL |
| 12 | Attempting a Standard Move into Gravity Field (RAD-062/167) and declining the cost, just to exhaust the unit | The whole move is undone | FAQ-RAD |
| 13 | Playing Charm (OGN-043/298) to drag an enemy unit into your Gravity Field so they pay | You perform the move, so nobody pays (or you do, on their field) | CR 204.4; FAQ-RAD |
| 14 | Gutter Guardian (RAD-103/167) showing off a facedown card as a card with Hidden | A facedown card has no readable characteristics | CR 811.5.a, 129.4; PN-RAD |
| 15 | Moving two targets of Alpha Strike (UNL-192/219) to base to enable Repulse (UNL-106/219) | Mistargeted units still count as chosen while on the board | PN-VEN; FAQ-UNL |
| 16 | Abandon (UNL-131/219) returning a Flow spell (or a spell replayed by Fizz, Trickster (SFD-140/221) / Kai'Sa, Evolutionary (OGN-112/298)) to hand | "Then banish/recycle it" applies however it leaves the chain | CR 829.1.b; FAQ-VEN |
| 17 | Baited Hook (OGN-242/298) while saving the sacrificed unit with a death replacement | No killed unit, so its Might is null and nothing can be played | FAQ-OGN; PN-OGN |
| 18 | Stupefy (OGN-095/298) on your own 1-Might empowered Gangplank, Naval (VEN-086/166) for +3 | No -Might is actually given | FAQ-VEN |
| 19 | Dragon Form (VEN-116/166) to trigger Fiora, Grand Duelist (SFD-205/221) through a unit already carrying -Might | Layers are evaluated at once; the unit never has the higher value | CR 478.1; FAQ-VEN |
| 20 | Orianna, Lady of Clockwork (RAD-145/167) turning an Equipment into a unit and equipping it | Units cannot be attached | CR 143.5.a, 435.1.h |
| 21 | Opponent's Kharox replaying your Neeko, Blending In (RAD-167/167) to use your chosen legends | They get only legends they chose themselves, and only if their own deck has Neeko | FAQ-RAD; CR 103.1 |
| 22 | Hostile Takeover (SFD-202/221) then Temporal Breach (VEN-066/166) to keep the stolen unit | The owner cannot play it to your base; it stays banished | FAQ-VEN |
| 23 | 2v2: teammate leaves a battlefield so you can conquer it the same turn | Disqualified if the teammate controlled it at the scoring step | CR 491.8.b.1 |
| 24 | Playing a token or using an ability to turn on Legion | Tokens and abilities are not cards | CR 052; CR 812.1.b.1 |
| 25 | Re-entering combat to repeat attack or defend triggers | Checked once per combat | CR 383.4.e.2.a, 383.4.f.2.a |

Forbidden by the ban list, not by the rules: the Time Warp loop with Ekko, Recurrent (OGN-110/298) described in a cardsrealm Renata Glasc guide in our corpus (`analysis/interactions/data/community/cr-renata.html`). **FACT** (HUB): Ekko, Recurrent is banned since 2026-09-18. Additional turns themselves are legal and defined (PN-UNL "Additional Turn Effects").

Combos the same articles confirm (useful as positive edges, already listed in section 2): C4, C10, C11 (Angler Wyrm), C13, C14, D10, D12, D13, L2 (Temporal Breach), L3, L5, O11, P11, P12, X4, X8, X10, X12, X15; also Hwei, Brooding Painter (UNL-080/219) discarding a card with two types gets both effects, and Swain, Visionary (VEN-065/166) counts one card for several of his conditions (FAQ-VEN).

## 6. Open items

- **UNCONFIRMED**: official definition of "excess damage" (section 2.5 D2).
- **UNCONFIRMED**: standing of the three FAQ-only errata (Unyielding Spirit, Symbol of the Solari, Wraith of Echoes).
- **UNCONFIRMED**: which Emperor of the Sands wording is current.
- **UNCONFIRMED**: a public Watcher database.
- **UNCONFIRMED**: effective dates of PN-OGN and PN-UNL (articles give none) and of each errata article.
- **UNCONFIRMED**: rule number for "pending items are not legal targets" in CR 2026-10-09.
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
python3 -I assemble.py           # writes ../../rulings-and-errata.md from doc_template.md
```
