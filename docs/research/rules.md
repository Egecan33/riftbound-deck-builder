# Riftbound deck-construction rules as a validation spec (fact-checked 2026-11-11; independently re-verified 2026-11-11, see the Verification log at the end)

Scope: every official mode that changes how a deck is built or what a deck is worth: 1v1 Constructed (best-of-1 "Duel", best-of-3 "Match"), 2v2, free-for-all with 3 or 4 players, and Limited (Sealed / Draft) as an optional extra.

Labels used throughout:
- **FACT** = stated by a primary source (playriftbound.com, official PDFs). Rule number given.
- **DATA** = measured from a dataset; dataset and n are named.
- **HEURISTIC** = our own judgement or reading; not an official statement.
- **UNCONFIRMED** = could not be confirmed from a primary source.

## 0. Sources and how far to trust them

| ID | Source | Date |
|---|---|---|
| CR | Core Rules PDF, "Last Updated: 2026-10-09", https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/5c7946f7c3b8c6e0faff85ab6dadc6d2e721ea94.pdf (linked from HUB). sha256 `94d41fee…4d1fec` | fetched 2026-11-11 |
| TR | Tournament Rules PDF, "Last Updated October 9, 2026", https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/861752822d217edf37d9febaeaf77a7d924c1bb6.pdf (linked from HUB). sha256 `ce07da4f…fab3d07` | fetched 2026-11-11 |
| HUB | Rules Hub, https://playriftbound.com/en-us/rules-hub/ (ban lists "Last updated: September 18, 2026"; both PDFs "last updated: October 9, 2026") | fetched 2026-11-11 |
| GAL | Official card gallery, https://playriftbound.com/en-us/card-gallery/ (embedded JSON, 1408 printings). Shows the **printed** text; errata are not applied (Neeko, Blending In still shows the pre-errata wording) | fetched 2026-11-11 |
| BAN-MAR | https://playriftbound.com/en-us/news/announcements/announcing-riftbounds-first-bans/ (published 2026-03-30, effective 2026-03-31) | fetched 2026-11-11 |
| BAN-JUL | https://playriftbound.com/en-us/news/announcements/july-ban-list-updates/ (published 2026-07-17, effective 2026-07-24) | fetched 2026-11-11 |
| BAN-SEP | https://playriftbound.com/en-us/news/announcements/september-ban-list-updates-effective-september-18-2026/ (published 2026-09-15) | fetched 2026-11-11 |
| PN-RAD | Core Rules: Radiance Patch Notes, https://playriftbound.com/en-us/news/announcements/core-rules-radiance-patch-notes-effective-october-16-2026/ (published 2026-10-09, effective 2026-10-16) | fetched 2026-11-11 |
| ERR-RAD | Radiance Errata Updates, https://playriftbound.com/en-us/news/announcements/radiance-errata-updates/ (published 2026-10-09; linked from HUB). Changes the text of Neeko, Blending In, see 8.3 | fetched 2026-11-11 |
| FAQ-RAD | https://playriftbound.com/en-us/news/organizedplay/radiance-rules-faq-and-clarifications/ (published 2026-10-26) | fetched 2026-11-11 |
| TRC-OCT | https://playriftbound.com/en-us/news/announcements/october-2026-tournament-rules-changelog/ (published 2026-10-09) | fetched 2026-11-11 |
| TRC-JUL | https://playriftbound.com/en-us/news/announcements/july-2026-tournament-rules-update-changelog/ (published 2026-07-17) | fetched 2026-11-11 |
| TEST-SOG | https://playriftbound.com/en-us/news/organizedplay/testing-start-of-game-rules/ (published 2026-10-15) | fetched 2026-11-11 |
| PRIMER | https://playriftbound.com/en-us/news/rules-and-releases/deckbuilding-primer/ (published 2025-07-28) | fetched 2026-11-11 |
| SETS-27 | https://playriftbound.com/en-us/news/announcements/products-and-sets-into-2027/ (published 2026-08-03) | fetched 2026-11-11 |
| L-CR | Local copy of the Core Rules, edition 2026-07-16: `~/github_repositories/GameLab/data/rules/core-rules.md` | **STALE**, see 0.1 |
| L-CARDS | `~/github_repositories/GameLab/data/cards/cards.json` (931 cards, built 2026-09-06, sets OGN/OGS/SFD/UNL/VEN) | **STALE**, no Radiance |
| L-BAN | `~/github_repositories/Untitled/config/current-constructed-rules.json` (snapshot 2026-08-10) | **STALE**, see 9 |
| L-DECKS | `~/github_repositories/GameLab/data/decks/samples/piltover-archive-2026-09-06.json` (59 decklists, 49 flagged complete; source https://piltoverarchive.com/decks) | community data, September 2026 |

### 0.1 What is stale in the local material (all FACT, compared on 2026-11-11)

- **Core Rules have a newer edition.** Local is 2026-07-16; current is 2026-10-09 (effective 2026-10-16). Rule numbers moved, so numbers quoted from the local file are wrong today:

  | Topic | Local edition (2026-07-16) | Current edition (2026-10-09) |
  |---|---|---|
  | Additional deckbuilding choices | (did not exist) | 103.1 |
  | Champion Legend / Domain Identity | 103.1 | 103.2 |
  | "No Domain" cards allowed anywhere | (did not exist) | 103.2.b.5 |
  | Main Deck / Chosen Champion / copies / Signature | 103.2 | 103.3 |
  | Rune Deck | 103.3 | 103.4 |
  | Battlefields | 103.4 | 103.5 |
  | Modes of Play | 481-489 | 483-491 |
  | 1v1 Duel / 1v1 Match / FFA3 / FFA4 / 2v2 | 485 / 486 / 487 / 488 / 489 | 487 / 488 / 489 / 490 / 491 |
  | Win check at cleanup | 472 ("more points than any opponent") | 474 ("more points than every opponent") |
  | Unique keyword | 825 | 825 (unchanged) |

  The current CR still contains cross-references that were not renumbered (CR 133.7.a points at "103.2.a. Chosen Champion", CR 133.7.b at "103.2.d", CR 161.2.a at "103.3. Rune Deck"). They mean 103.3.a, 103.3.d and 103.4. This document cites the current numbers.
- **Tournament Rules have a newer edition** (2026-10-09). Hash `861752…` replaces the local `503da6…` listed in `GameLab/data/rules/meta.json`.
- **A new set, Radiance (RAD), released 2026-10-23** and is Standard-legal (TR 601.3.c.6, 601.3.c.6.a). L-CARDS has no RAD cards. GAL lists 219 RAD printings, of which 13 had no card type filled in on the fetch date, and 11 of those 13 also had an empty domain list (gallery data incomplete; an empty domain list there means "missing", not "no Domain").
- **Two more cards were banned on 2026-09-18** (Ekko, Recurrent; Stacked Deck) and **a separate 2v2 ban list exists since 2026-07-24**. L-BAN has neither (it is 1v1 only and stops at July).
- **Sideboard maximum is 10**, raised from 8 in the July 2026 Tournament Rules (TRC-JUL: "Updated constructed sideboard size from 8 or fewer to 10 or fewer. Updated 601.1.c.1."). DATA: 47 of 49 complete decks in L-DECKS still have exactly 8, so sample lists under-use the current limit.

## 1. What a deck is

- **FACT (CR 103):** "a player must have a Main Deck, a Rune Deck, a Champion Legend, and a number of Battlefields determined by the Mode of Play. These are collectively referred to as a player's deck."
- **FACT (CR 103.1):** cards or game modes "may indicate additional choices to be made while building the deck". DATA (GAL text search): today the only card that does so is Neeko, Blending In (see 8.3).
- **FACT (TR 104.1):** where the Tournament Rules contradict or add to the Core Rules, the Tournament Rules win "for competitions". So there are two rule sets for a deck builder: **Core (casual)** and **Tournament Constructed**. The differences are main-deck size (minimum vs exact), sideboard, and ban lists.

## 2. Champion Legend and Domain Identity

- **FACT (CR 103.2):** exactly 1 Champion Legend. It starts in the Legend Zone (103.2.a) and dictates the deck's Domain Identity (103.2.b).
- **FACT (CR 103.2.b.2):** the Domain Identity is the set of domains of the Champion Legend.
- **FACT (CR 176):** "Legends may have one or more Domains."
- **DATA (GAL, 58 distinct legends, 145 legend printings):** every legend has exactly 2 domains. No one-domain or three-domain legend exists as of 2026-11-11. The validator must still work for any count, because the rule allows it.
- **FACT (CR 134.1-134.2):** six domains: Fury [R], Calm [G], Mind [B], Body [O], Chaos [P], Order [Y].
- **FACT (CR 103.2.b.1, .3, .4, .5):**
  - every card in the deck must abide by the Domain Identity;
  - a single-domain card is allowed if that domain is in the identity;
  - a multi-domain card is allowed only if **all** its domains are in the identity;
  - "If a card has no Domain, then that card is permitted in decks of any Domain Identity." (new in the 2026-10-09 edition)
- **FACT (CR 103.2.b.6):** an effect may let a player add cards irrespective of domain; such cards then count as inside the identity. DATA (GAL text search, 2026-11-11): no printed card does this yet.
- **Where the identity applies:**
  - Main Deck (CR 103.3.c) and therefore the Chosen Champion and the sideboard (TR 601.1.c.2: a sideboard "can consist only of valid Main Deck cards").
  - Rune Deck (CR 103.4.a.1).
  - Battlefields "if applicable" (CR 103.5.b). DATA (GAL): all 74 non-token battlefields have no domain (stored as `colorless`), so this never restricts anything today.
- **Dataset encoding (DATA, L-CARDS and GAL):** "no domain" is stored as the pseudo-domain `colorless`. Treat `domains == ["colorless"]` as "no Domain". Never require `colorless` to be in the legend's domains. **Do not treat an empty domain list as "no Domain"** (corrected 2026-11-11): in GAL, 11 unfinished Radiance entries (e.g. RAD-009 Antagonistic Apparatus, RAD-041 Hush) have an empty list because the data is missing; L-CARDS has no card with an empty list. An empty list must raise `DATA_STALE`, not pass the domain check.
- **Neutral main-deck cards:** FACT (GAL): Neeko, Blending In (RAD-167) carries the reminder "(Neutral cards can go in decks of any Domain.)". DATA (GAL): it is the only non-token, non-battlefield card stored with the `colorless` domain. (11 untyped Radiance entries have an empty domain list; that is missing data, see above, so whether Radiance has other neutral cards is UNCONFIRMED until GAL is complete.)

## 3. Chosen Champion

- **FACT (CR 103.3):** "A Main Deck of at least 40 cards: A Chosen Champion Unit, as well as Units, Gear, and Spells". The Chosen Champion is **part of the Main Deck and counts toward its total**. Confirmed by TR 402.1: "a Main Deck of exactly 40 cards (including a chosen champion)".
- **FACT (CR 103.3.a.1):** it starts the game in the Champion Zone, not shuffled into the deck.
- **FACT (CR 103.3.a.2):** it "Must be a champion unit with a champion tag that matches the tag on your Champion Legend." Examples in the rule: legend Loose Cannon has tag Jinx, so Jinx, Rebel or Jinx, Demolitionist qualify; Tibbers has tag Annie but is a signature unit, so it cannot be the Chosen Champion.
- **FACT (CR 133.7.a):** Champion is a supertype "that applies exclusively to units".
- **FACT (CR 133.8.b):** "Tags used to link Legends, Champion Units, and Signature cards are known as Champion Tags."
- **FACT (CR 103.3.b.1):** the Chosen Champion counts toward the 3-copy limit ("A deck could include Volibear, Furious as its Chosen Champion and still include 2 more copies").
- **FACT (CR 103.3.a.3, CR 132.4):** Chosen Champion status follows the full name. Other champion units of the same character with a different subtitle are ordinary Main Deck cards and have their own 3-copy limit.
- **FACT (CR 103.3.c):** subject to Domain Identity like any Main Deck card.
- **Which tag is the "champion tag" (HEURISTIC, backed by DATA):** the rules do not mark which tag on a card is the champion tag. Some legends carry extra tags: Heart of the Tempest has `[Yordle, Kennen]`, Hexplosives Expert `[Yordle, Ziggs]`, Curator of the Sands `[Dog, Shurima, Nasus]` (GAL). Eight champions carry the `Yordle` tag (Fizz, Heimerdinger, Kennen, Lulu, Poppy, Rumble, Teemo, Vex). Read literally, "a champion tag that matches the tag on your Champion Legend" must not let Teemo lead a Kennen deck through `Yordle`; CR 133.8.b limits champion tags to the linking tags. Our rule:
  - champion tag of a champion unit = the tag equal to its short name (the part of the name before the comma). DATA (GAL): true for 177 of 177 distinct champion units.
  - champion tag of a legend = the one tag that equals some champion unit's short name. DATA (GAL): exactly one such tag for 58 of 58 legends.
  - UNCONFIRMED: no official ruling was found that states this explicitly for `Yordle`.
- **One champion tag, two legends (DATA, GAL):** Master Yi has two legends, Wuju Bladesman (OGS-019) and Wuju Master (UNL-191), both Calm/Body. All four Master Yi champion units qualify under either.
- **Champions without a legend (DATA, GAL):** 47 champion short names have no legend (e.g. Heimerdinger, Nocturne, Neeko, Tryndamere). They can be played in the Main Deck but can never be a Chosen Champion in Constructed.
- **Off-domain champion (DATA, GAL):** no champion unit that matches a legend's champion tag falls outside that legend's domains. The check is still needed (data errors, future cards).

## 4. Main Deck

- **Size, Core Rules. FACT (CR 103.3):** at least 40 cards, Chosen Champion included. No maximum. PRIMER confirms: "You can go higher than 40 if you really want to".
- **Size, tournaments. FACT (TR 402.1, TR 601.1.b):** "a player's Main Deck must be exactly 40 cards", Chosen Champion included. After sideboarding the Main Deck must still meet the size requirement (TR 403.4.c).
- **Contents. FACT (CR 103.3, CR 133.4):** only Units, Gear and Spells. Runes, battlefields and legends are not Main Deck cards (CR 133.5, 133.6, 161.1). Tokens are not cards (CR 185) and cannot be in a deck.
- **Copy limit. FACT (CR 103.3.b):** "up to 3 copies of the same named card".
  - Keyed on **name**, not card code or printing. CR 132.4: the name of a card with a subtitle is "[Short Name], [Subtitle]". CR 103.3.b.2: Yasuo, Remorseful and Yasuo, Windrider are different cards, 3 of each allowed.
  - CR 132.3: the same card in another language has the same name. Alternate art, promo, overnumbered and signature-variant printings are the same card. DATA (L-CARDS `printings[].variant`): base 928, promo 133, alt 102, overnumbered 92, signature 45, token 8, rune 6, special 6. Note: the printing variant called "signature" (a signed alternate printing) has nothing to do with the Signature supertype.
  - With a sideboard, the limit applies to Main Deck + sideboard combined (TR 403.3, TR 601.1.c.3).
- **Unique. FACT (CR 825.3.a):** "A deck can contain only one card of a given name if the card has Unique". Reminder text on the cards: "(Your deck can have only 1 card with this name.)". DATA (GAL): three cards have it: Forgefire Cape (SFD-190), Rabadon's Deathcrown (SFD-191), Shurelya's Requiem (SFD-192), all Ornn signature gear. L-CARDS stores this as `copyLimit: 1` and keyword `Unique`.
  - HEURISTIC: with a sideboard, the one copy is counted across Main Deck + sideboard. Basis: the card says "Your deck", and TR 403.3 combines named-copy limits across both.
- **Card text that raises the limit. FACT (GAL):** Spiderling (VEN-097): "Your deck can have any number of cards named Spiderling." Card text beats rules text (CR 002). L-CARDS stores `copyLimit: 10` for it; that 10 is a dataset placeholder, not a rule. Treat it as unlimited. Deck size and sideboard size still apply.
- **Signature cards. FACT (CR 103.3.d, .d.1, .d.2, .d.3):**
  - a deck may contain at most **3 Signature cards in total**, "Regardless of name";
  - every Signature card must have the champion tag of the deck's Champion Legend;
  - Signature cards are not champion units and cannot be the Chosen Champion.
  - FACT (CR 133.7.b): Signature is a supertype that can sit on any card type. DATA (GAL): 60 distinct signature cards = 49 spells, 8 gear, 3 units (Tibbers, Shadow, Daisy!).
  - FACT (CR 825.3.b): Unique signature cards still count toward the total of 3, and each Unique one is limited to 1. So an Ornn deck can run Forgefire Cape + Rabadon's Deathcrown + Shurelya's Requiem (3 signature, 1 each) but not 2 Forgefire Cape.
  - DATA (GAL): every signature card has exactly the two domains of its champion's legend(s), so the tag rule and the domain rule agree today.
  - UNCONFIRMED: whether the total of 3 counts Main Deck + sideboard together. TR 403.3 only mentions "copies of named cards". HEURISTIC: count them together (CR 103.3.d says "Your deck may only contain 3 total"). DATA (L-DECKS, 49 complete lists): signature cards in main + sideboard = 3 in 21 decks, 2 in 7, 1 in 3, 0 in 18; none above 3.
- **Legality. FACT (CR 103.3.e):** "Subject to card legality of the Format being played." See 9.

## 5. Rune Deck

- **FACT (CR 103.4.a, CR 161.2.a):** exactly 12 Rune cards.
- **FACT (CR 103.4.a.1):** every rune must be inside the Champion Legend's Domain Identity.
- **FACT (CR 164.1):** there are six Basic Runes, one per domain. DATA (GAL): those six are the only rune cards that exist (Radiance only adds new printings, RAD-R01..R06 and "a" variants).
- **Split freedom:** no rule sets a ratio between the legend's domains, and CR 103.3.b's 3-copy limit is written for the Main Deck only. HEURISTIC (reading by absence): any split is legal, including 12/0. DATA (L-DECKS, 55 lists with 12 runes): 7/5 in 29, 6/6 in 18, 8/4 in 7, 10/2 in 1.
- **FACT (TR 403.4.b):** in Constructed the Rune Deck cannot be changed after deck registration, so there are no runes in a sideboard.

## 6. Battlefields

- **FACT (CR 103.5.a, CR 172):** the number is set by the Mode of Play.
- **FACT (CR 487.4.a, 488.4.a, 489.4.a, 490.4.a, 491.4.a):** every sanctioned mode asks each player to provide **three (3)** battlefields. TR 402.1: "exactly 3 battlefields each with a unique name".
- **FACT (CR 103.5.c):** no two battlefields with the same name.
- **FACT (CR 103.5.b):** subject to Domain Identity "if applicable" (never applicable today, see 2).
- **FACT (CR 187.8, 187.9; GAL):** Brush and Baron Pit are battlefield **tokens**; they cannot be chosen as deck battlefields.
- **FACT (TR 403.4.b):** battlefields cannot be changed after registration; they are not sideboard cards.
- **FACT (TR 601.1.d):** an event may restrict battlefields further through its own addenda.
- **How many are used and how they are picked:**

  | Mode | On board | Selection (FACT) |
  |---|---|---|
  | 1v1 Duel, Bo1 (CR 487) | 2 (one per player) | each player **randomly** selects 1 of their 3 (487.5) |
  | 1v1 Match, Bo3 (CR 488) | 2 (one per player) | each player **chooses** 1 of 3 (488.5). After a game somebody won, the used battlefields are removed and cannot be picked again in that match (488.5, 488.6). If nobody won, they may be reused (488.5.a; TR 406.1.b: after a draw the same battlefields must be used). Bo5 variant: in games 4 and 5 a removed battlefield may be reused once each of the three has been presented, and none more than twice (488.6.a) |
  | FFA3 Skirmish (CR 489) | 3 (one per player) | each player randomly selects 1 of 3 (489.5) |
  | FFA4 War (CR 490) | 3 | the player taking the first turn contributes none (490.4.b); the other three each randomly select 1 of 3 (490.5) |
  | 2v2 Magma Chamber (CR 491) | 3 | the player taking the first turn contributes none (491.5.b); the other three each randomly select 1 of 3 (491.5.a) |

- HEURISTIC (deck-building value): in Bo3 a player will show at least two and often all three battlefields, so all three slots matter. In Bo1, FFA and 2v2 one random battlefield of three is used (or none, if you go first in a 4-player game), so each slot is worth one third of a game at most and the set should be three independently good picks.

## 7. Sideboard and best-of-3 procedure

Sideboards exist only in the Tournament Rules; the Core Rules do not mention them.

- **FACT (TR 403.1, 403.2):** a sideboard is an extra group of cards outside the starting configuration; size and contents are set by the format.
- **FACT (TR 601.1.c.1):** Constructed: "A player's sideboard can include 10 or fewer cards." So 0 to 10. (8 before July 2026, see 0.1.)
- **FACT (TR 601.1.c.2):** "A sideboard can consist only of valid Main Deck cards." So units, gear and spells that are inside the Domain Identity, format-legal, and (for signature cards) carry the legend's champion tag. No runes, battlefields, legends or tokens.
- **FACT (TR 403.3, 601.1.c.3):** copy limits apply to Main Deck + sideboard combined.
- **FACT (TR 403.4):** between games, "sideboard cards must be exchanged 1 for 1 with Main Deck cards" in Constructed. Main Deck stays at exactly 40 (TR 403.4.c).
- **FACT (TR 601.1.c.4; TR 403.4.a):** while sideboarding, a player may change their Chosen Champion "to one from their sideboard or main deck that matches their Legend" (wording of 601.1.c.4; 403.4.a says "to one from their sideboard or Main Deck that meets the deckbuilding rules of the competition format"). So a second eligible champion unit may sit in the Main Deck or the sideboard as an alternative Chosen Champion.
- **FACT (TR 403.4.b):** "In constructed formats, a player may not change their Runes, Legend, or Battlefields at any point after deck registration."
- **FACT (TR 403.5, 403.8, 403.9, 403.10):** no sideboard cards in game 1; deck and sideboard return to the registered state before the next match; no sideboarding after a game skipped by a penalty or after a drawn game.
- **FACT (TR 404.2):** "Most matches of Riftbound are 'best of 3'".
- **FACT (TR 407.4):** after game 1 the loser of the previous game chooses to play first or last.
- **Best-of-1 with a sideboard. FACT (TR 406.1.h):** the head judge **may** use an altered setup for Bo1 events: legend revealed, battlefield randomly selected, turn order decided, then players "have the opportunity to sideboard as if they were in between games of a 'best of 3' match", then the Chosen Champion is placed. So a sideboard can matter in Bo1 too, at the head judge's option. It does not apply to Limited (TR 602.3.g).
- **FACT (TR 401.2):** a registered decklist records Champion Legend, battlefields, Main Deck including Chosen Champion, Rune Deck, and sideboard. TR 401.2.a: plus "any cards selected for special additional deckbuilding rules" (the legends selected for Neeko).
- **Not in effect (FACT, TEST-SOG):** Riot is playtesting a changed start-of-game order (turn order decided before battlefields, extra perk for the second player) at selected non-premier events during the Radiance season. The article says "Is this a rules update? ... No." A decision is announced for the Legacy patch notes (Legacy is set 6, "Arriving in January 2027" per SETS-27). Do not implement it; re-check in January 2027.

## 8. Things that are not ordinary deck cards

### 8.1 Tokens
- **FACT (CR 180, 185, 186):** tokens are created during play, "are not cards", and exist only on the board or the chain. They are never part of a deck, never counted, and have no copy limit. They may be represented by anything (CR 181).
- **FACT (CR 187.1-187.12):** defined tokens: Recruit, Sprite, Sand Soldier, Mech, Gold, Reflection, Bird, Brush (battlefield), Baron Pit (battlefield), Tentacle, Shadow Clone, Bomb (Bomb is new in the 2026-10-09 edition).
- **DATA (L-CARDS):** 7 entries have `superTypes: ["token"]`; GAL also lists helper pseudo-cards "Buff" and "XP Tracker" (UNL-T04, UNL-T08) with no card type. The deck builder must exclude all of them from every deck zone and may show them as a "tokens this deck creates" reminder list.

### 8.2 Legends in the card pool
- DATA: L-CARDS marks 9 legends, and GAL 4 legend printings, with `superTypes: ["champion"]`. This contradicts CR 133.7.a (Champion applies only to units) and is a data quirk. Never use `superTypes` to decide Chosen Champion eligibility without also checking `type == "unit"`.
- DATA: L-CARDS names starter legends with a suffix, e.g. "Wuju Bladesman - Starter". GAL has `name: "Wuju Bladesman"` with `subtitle: "Starter"`; HUB calls the card "Master Yi, Wuju Bladesman". Match legends by card code, not by display name.

### 8.3 Neeko, Blending In (additional deckbuilding choice)
- **FACT (GAL, RAD-167, champion unit, no domain, tags Ixtal + Neeko), printed text:** "If Neeko is in your deck, choose 3 different legends in addition to your starting legend. (Different means none match names.)"
- **FACT (ERR-RAD), current text after errata (corrected 2026-11-11):** "If Neeko is in your deck, choose **up to 3** different legends in addition to your starting legend. (Different means none match names.)" So 0, 1, 2 or 3 extra legends are legal; 3 is a maximum, not a requirement. PN-RAD (same day) still says "you pick three legends"; the errata is the card's text and card text wins (CR 002).
- **FACT (CR 103.1; PN-RAD "So how does Neeko, Blending In actually work?"):**
  - the choice is made during deck building;
  - it applies if the Main Deck **or the sideboard** has one or more copies;
  - the three legends "must be different from each other and from your Champion Legend";
  - it is one set of (up to) three legends in total no matter how many Neekos are in the deck ("The 3 legends are shared by all Neekos in your deck");
  - at competitive level they must be registered (also TR 401.2.a) and "you can store them with your sideboard";
  - they do not need to be revealed until added to the Legend Zone.
- **FACT (CR 107.4.d.1, current edition):** legends added to the Legend Zone by effects "are not Champion Legends", so they do not change the Domain Identity.
- **UNCONFIRMED:** whether the three extra legends must be format-legal (e.g. the 2v2-banned Wuju Bladesman), and whether in 2v2 they may duplicate a teammate's Champion Legend (CR 491.8.h only speaks of the Champion Legend). HEURISTIC: warn, do not block.
- HEURISTIC: the three legends do not count toward the 10 sideboard cards. Basis: a sideboard "can consist only of valid Main Deck cards" (TR 601.1.c.2) and legends are not Main Deck cards; "store them with your sideboard" is a physical-storage remark.
- DATA (GAL): there is no Neeko legend, so Neeko cannot be a Chosen Champion today.

## 9. Format legality and ban lists (as of 2026-11-11)

- **FACT (TR 601.3.c):** current Standard = Proving Grounds supplemental (OGS), Origins (OGN), Spiritforged (SFD), Unleashed (UNL), Vendetta (VEN), Radiance (RAD, released 2026-10-23).
- **FACT (HUB):** "All sets currently produced for Riftbound are legal"; rotation is intended to start in 2028.
- **FACT (TR 601.2.a):** a card is legal "if it is from a set that is legal in that format or it has the same name as a card from a set that is legal". So promo printings are legal by name. DATA (L-CARDS `printings[].set`): besides the five main sets there are OPP (117), PR (13), JDG (3) printings.
- **FACT (TR 601.2.c):** a reprint numbered outside a set's normal range (e.g. 300/250) does not by itself make the card legal in that set's Standard.
- **FACT (TR 601.2.b):** until release parity, legality follows the regional launch date. HEURISTIC: ignore for a personal tool.
- **FACT (TR 601.2.d):** a banned card "may not be included in a deck" (main or sideboard; banned battlefields may not be among the three; a banned legend may not be the Champion Legend).
- **FACT (TR 601.2.d.2):** at low organized-play level an unmodified preconstructed product deck may keep its banned cards; any change or adding a sideboard removes that exception.

**Standard (1v1) Constructed ban list. FACT (HUB, "Last updated: September 18, 2026"):**

| Card | Zone | Code (DATA: L-CARDS / GAL) | Effective | Source |
|---|---|---|---|---|
| Called Shot | main | SFD-122 | 2026-03-31 | BAN-MAR |
| Draven, Vanquisher | main | SFD-020 | 2026-03-31 | BAN-MAR |
| Fight or Flight | main | OGN-168 | 2026-03-31 | BAN-MAR |
| Scrapheap | main | OGN-182 | 2026-03-31 | BAN-MAR |
| Stealthy Pursuer | main | OGN-177 | 2026-07-24 | BAN-JUL |
| Ekko, Recurrent | main | OGN-110 | 2026-09-18 | BAN-SEP |
| Stacked Deck | main | OGN-183 | 2026-09-18 | BAN-SEP |
| Dreaming Tree ("The Dreaming Tree" in GAL) | battlefield | OGN-292 | 2026-03-31 | BAN-MAR |
| Obelisk of Power | battlefield | OGN-284 | 2026-03-31 | BAN-MAR |
| Reaver's Row | battlefield | OGN-285 | 2026-03-31 | BAN-MAR |
| The Arena's Greatest | battlefield | OGN-290 | 2026-07-24 | BAN-JUL |
| Aspirant's Climb | battlefield | OGN-276 | 2026-07-24 | BAN-JUL |

**2v2 Constructed ban list. FACT (HUB; BAN-JUL: "the entirety Standard ban list plus the following"; BAN-SEP: both September bans apply to "Standard and 2v2 Constructed"):** everything above, plus

| Card | Zone | Code | Effective | Source |
|---|---|---|---|---|
| Master Yi, Wuju Bladesman | legend | OGS-019 | 2026-07-24 | BAN-JUL |

The other Master Yi legend, Wuju Master (UNL-191), is not banned.

- HEURISTIC (inference, not a quoted rule): bans are by name. Basis: HUB and the ban articles list names only, CR 132.1/132.3 identify a card by its name, and TR 601.2.a makes legality name-based. Ban every printing of a banned name.
- **UNCONFIRMED:** no official ban list or tournament section exists for free-for-all (TR section 600 has 601 Constructed, 602 Limited, 603 2v2 and 604 round time limits; the words "free-for-all", "FFA" and "Skirmish" do not occur anywhere in TR). HEURISTIC: use the Standard list for FFA and let the user switch it off.
- DATA (L-DECKS, 49 complete lists from 2026-09-06): 32 contain at least one card that is banned today. Old sample decks must be re-validated before being used as templates.

## 10. Modes of play: what changes

Deck construction in CR 103 is the same for all sanctioned modes; only the items below differ. All rows are FACT from the cited rule.

| | 1v1 Duel | 1v1 Match | FFA3 Skirmish | FFA4 War | 2v2 Magma Chamber |
|---|---|---|---|---|---|
| Rule | CR 487 | CR 488 | CR 489 | CR 490 | CR 491 |
| Players | 2 | 2 | 3 | 4 | 4, two teams |
| Victory Score | 8 | 8 | 8 | 8 | 11, shared by the team (491.3, 491.8.d) |
| Structure | best of 1 | best of 3 (Bo5 possible, 488.6.a) | best of 1 | best of 1 | best of 1 (491.6) |
| Battlefields brought | 3 | 3 | 3 | 3 | 3 |
| Battlefields on board | 2 | 2 | 3 | 3 | 3 |
| Selection | random | chosen, no reuse after a win | random | random; first player's unused | random; first player's unused |
| First-turn rule | second player channels 1 extra rune (487.7) | same (488.7) | first player skips first draw; last player channels 1 extra rune (489.7) | same (490.7) | same (491.7) |
| Extra deck constraints | none | sideboard matters (TR) | none | none | teammates may not use the same Champion Legend (491.8.h) nor the same Battlefields (491.8.i); separate ban list |

More FACTs that affect card value rather than legality:
- **Winning (CR 474):** at a cleanup, a player with points >= the Victory Score and more points than every opponent wins.
- **Final point (CR 473.1.b):** when one point short, a Conquer only gives the final point if the player has scored **every** battlefield that turn; otherwise they draw a card. With 3 battlefields on board (FFA, 2v2) this is harder than with 2. 2v2 adjusts it: battlefields occupied by the ally at that turn's beginning-phase scoring step are excepted (491.8.g.1).
- **2v2 (CR 491.8):** a battlefield scores once per team per turn (491.8.b); control is not shared (491.8.c); "Friendly" includes the teammate's objects (491.8.e), which makes "friendly unit" effects stronger; players may act on a teammate's turn by invitation (491.8.a); turn order alternates teams (491.5.c, TR 603.7.a).
- **2v2 in tournaments (TR 603):** a 2v2 competition "can be either constructed or sealed" (603.6); in sealed the team shares 8 packs. Each player brings a full deck of their own. UNCONFIRMED: whether sanctioned 2v2 Constructed uses sideboards or multi-game matches. CR 491.6 says best of 1; TR 603.7.c.1 mentions "games after the first game of a match". HEURISTIC: allow an optional 0-10 sideboard in 2v2, default empty.
- **"Same Battlefields" for teammates (CR 491.8.i):** HEURISTIC: read as "no battlefield name may appear in both teammates' sets of three". UNCONFIRMED whether a looser reading (not the identical set) is intended.
- **Hypothetical modes:** CR 103.1 gives an example of a mode rule that adds a second Chosen Champion with a different tag and domain and widens the Domain Identity. No sanctioned mode in CR 487-491 does this. Not implemented; noted so the data model keeps `chosenChampions` as a list and `domainIdentity` as a computed set.

### 10.1 Limited (Sealed / Draft): optional mode, different deck rules
FACT, all from TR 602:
- Main Deck minimum 25 in Sealed (602.4.a.2), 20 in Draft (602.4.b.3); may be larger.
- Domain Identity = any three domains, or any one domain plus the legend's domains (602.4.a.3, 602.4.b.4).
- Any champion unit inside that identity may be the Chosen Champion, tag match not required (602.4.a.3.a; draft 602.4.b.4.a).
- Signature **spells** are allowed if fully inside the identity, without the matching champion (602.4.a.3.b; draft 602.4.b.4.b). The rule names spells only; signature gear and units are UNCONFIRMED.
- A deck is legal without a Champion Legend and/or Chosen Champion; the player then draws one card at the start of their first Beginning Phase each game, one card even if both are missing (602.4.a.5, 602.4.a.5.b; draft 602.4.b.6, 602.4.b.6.b).
- No copy limits, no signature limit, Unique does not apply (602.4.a.6, 602.4.a.6.a; draft 602.4.b.7, 602.4.b.7.a).
- Any number of basic runes from any source, matching the identity (602.1.a.2, 602.4.a.4). Rune Deck size is not changed by TR 602, so CR 103.4.a (12) stands.
- "Blank" battlefields with no text may fill any battlefield slot (602.3.d). Bo1 at high OPL: register three (602.3.e.3).
- Sideboard = the rest of the pool; identity, runes, legend and Chosen Champion may change between games (602.4.a.7, 602.4.a.7.a; draft 602.4.b.8, 602.4.b.8.a).
- Constructed bans do not apply unless also banned in that limited format (602.1.b).
HEURISTIC: out of scope for v1 of a constructed deck builder; keep the format switch so it can be added.

## 11. Card types, supertypes and the fields the rules key on

**Card types (FACT, CR 133.4-133.6):** Main Deck cards: Unit, Gear (both permanents), Spell. Rune Deck cards: Rune. Other cards: Battlefield, Legend. A game object can have several types (CR 178), e.g. a gear that becomes a unit in play; printed cards in GAL have one type each.

**Supertypes (FACT, CR 133.7):** Champion (units only), Signature (any type). Also in data: Basic (the six runes, CR 164) and Token (not a card, CR 185).

**Deck-construction keywords:** Unique (CR 825, "Deck Constraint Permission").

**DATA: counts in L-CARDS (931 cards, no Radiance):** type: unit 470, spell 233, gear 107, battlefield 66, legend 49, rune 6. superTypes: none 706, champion 161 (152 units + 9 legends, see 8.2), signature 51, token 7, basic 6. Domain count: 831 one-domain, 100 two-domain (49 legends + 51 signature cards; every multi-domain Main Deck card is a signature card). `copyLimit`: 3 for 927, 1 for 3 (Unique), 10 for 1 (Spiderling).

| Field in `cards.json` | Used by | Notes |
|---|---|---|
| `type` | zone assignment | `unit`/`gear`/`spell` -> main or sideboard; `rune` -> rune deck; `battlefield` -> battlefields; `legend` -> legend slot |
| `superTypes` | Chosen Champion, signature limit, token exclusion | `champion` only meaningful with `type == "unit"`; `signature`; `token` -> never deckable; `basic` |
| `domains` | Domain Identity | `["colorless"]` means no domain: always allowed |
| `tags` | champion tag match | champion tag = tag equal to a champion short name (section 3) |
| `name` | copy limits, bans, battlefield uniqueness, Neeko "different legends" | full name including subtitle ("Ekko, Recurrent"); strip the " - Starter" suffix on OGS legends or use codes |
| `copyLimit` | copy limit | 3 default, 1 = Unique; treat Spiderling's 10 as unlimited |
| `keywords` | Unique | cross-check with `copyLimit == 1` |
| `rulesText` | deckbuilding text | "Your deck can have any number of cards named X"; "If [Name] is in your deck, choose 3 different legends" (printed) / "choose up to 3 different legends" (ERR-RAD). Match both wordings; card data carries printed text, so keep an errata override table |
| `set`, `printings[].set`, `printings[].variant` | format legality | legality is by name; any printing of a legal name is fine |
| `cardCode`, `gameplayId` | identity, ban list keys | L-BAN keys bans by lowercase `gameplayId` (e.g. `ogn-110-298`) |

GAL equivalents (needed to ingest Radiance): `cardType.type[].id`, `cardType.superType[].id`, `domain.values[].id`, `tags.tags[]`, `name` + `subtitle`, `publicCode`, `set.value.id`, `text.richText.body` (printed text, no errata). **Name rule (corrected 2026-11-11, DATA GAL):** `name + ", " + subtitle` is the rules name only for champion units (349 printings, all have a subtitle). On the 16 signature cards that have a subtitle it is the owning champion ("Tibbers" / subtitle "Annie"; "Super Mega Death Rocket!" / subtitle "Jinx"), and on the 4 OGS legends it is "Starter"; in both cases the rules name is `name` alone (CR 103.3.a.2 calls the cards "Tibbers" and "Loose Cannon").

## 12. validateDeck must check

Input: `{ format, legend, chosenChampion, main[] (including the Chosen Champion copy), runes[], battlefields[], sideboard[], extraLegends[], teammate? }`, `format` in `standard-bo1 | standard-bo3 | 2v2 | ffa3 | ffa4 | casual` (+ `sealed | draft` later). "Combined" = main + sideboard. Severity E = illegal deck, W = warning.

| # | Code | Sev | Rule | Check |
|---|---|---|---|---|
| 1 | `LEGEND_MISSING` | E | CR 103.2 | exactly one legend chosen |
| 2 | `LEGEND_NOT_LEGEND` | E | CR 103.2, 133.6.b | `legend.type == "legend"` and not a token |
| 3 | `LEGEND_BANNED` | E | TR 601.2.d, HUB | legend name not on the format's ban list (2v2: Wuju Bladesman) |
| 4 | `CHAMPION_MISSING` | E | CR 103.3 | a Chosen Champion is set |
| 5 | `CHAMPION_NOT_CHAMPION_UNIT` | E | CR 103.3.a.2, 103.3.d.3 | `type == "unit"` and `superTypes` has `champion` (signature units fail) |
| 6 | `CHAMPION_TAG_MISMATCH` | E | CR 103.3.a.2, 133.8.b | champion's champion tag == legend's champion tag (not region/species tags) |
| 7 | `CHAMPION_NOT_IN_MAIN` | E | CR 103.3, TR 402.1 | the Chosen Champion is one of the counted Main Deck cards (at least 1 copy of that name in `main`) |
| 8 | `MAIN_TOO_SMALL` | E | CR 103.3 | `count(main) >= 40` |
| 9 | `MAIN_NOT_EXACT_40` | E (tournament formats) / off (casual) | TR 402.1, 601.1.b | `count(main) == 40` |
| 10 | `MAIN_WRONG_TYPE` | E | CR 103.3, 133.4 | every main card is unit, gear or spell |
| 11 | `TOKEN_IN_DECK` | E | CR 185 | no card with `token` supertype in any zone |
| 12 | `DOMAIN_VIOLATION` | E | CR 103.2.b.1-.5, 103.3.c, 103.4.a.1, 103.5.b | for every card in main, sideboard, runes, battlefields: `domains` is `["colorless"]` or a subset of the legend's domains. An empty list is missing data -> `DATA_STALE`, not a pass |
| 13 | `COPY_LIMIT_EXCEEDED` | E | CR 103.3.b, 132.3, 132.4; TR 403.3, 601.1.c.3 | per full name, combined count <= 3, unless card text lifts it (Spiderling) |
| 14 | `UNIQUE_LIMIT_EXCEEDED` | E | CR 825.3.a | per Unique name, combined count <= 1 |
| 15 | `SIGNATURE_TOTAL_EXCEEDED` | E | CR 103.3.d.1, 825.3.b | combined count of signature cards <= 3 (combined is HEURISTIC, section 4) |
| 16 | `SIGNATURE_WRONG_CHAMPION` | E | CR 103.3.d.2 | every signature card's champion tag == legend's champion tag |
| 17 | `RUNE_COUNT` | E | CR 103.4.a, 161.2.a | `count(runes) == 12` |
| 18 | `RUNE_WRONG_TYPE` | E | CR 103.4, 133.5 | every rune-deck card has `type == "rune"`; no rune in main/sideboard |
| 19 | `BATTLEFIELD_COUNT` | E | CR 487.4.a-491.4.a, TR 402.1 | exactly 3 |
| 20 | `BATTLEFIELD_DUPLICATE` | E | CR 103.5.c | 3 different names |
| 21 | `BATTLEFIELD_WRONG_TYPE` | E | CR 133.6.a, 187.8-9 | `type == "battlefield"`, not a token |
| 22 | `CARD_BANNED` | E | TR 601.2.d, HUB | no banned name in main, sideboard or battlefields for the selected format |
| 23 | `CARD_NOT_IN_FORMAT` | E | CR 103.3.e, TR 601.2.a, 601.3.c | every card name has a printing in a Standard-legal set |
| 24 | `SIDEBOARD_TOO_LARGE` | E | TR 601.1.c.1 | `count(sideboard) <= 10` |
| 25 | `SIDEBOARD_WRONG_TYPE` | E | TR 601.1.c.2, 403.4.b | only unit/gear/spell; no runes, battlefields, legends |
| 26 | `SIDEBOARD_NOT_ALLOWED` | W | CR (no sideboard), HEURISTIC | sideboard non-empty in `ffa3`, `ffa4`, `casual` |
| 27 | `NEEKO_LEGENDS_COUNT` | E if more than 3; W if fewer than 3 | CR 103.1, ERR-RAD ("up to 3"), PN-RAD | if combined contains Neeko, Blending In: at most 3 extra legends; fewer than 3 is legal but wastes the card (warning). Corrected 2026-11-11, was "exactly 3" |
| 28 | `NEEKO_LEGENDS_NOT_DIFFERENT` | E | Neeko text, PN-RAD | the extra legends and the Champion Legend all have different names |
| 29 | `NEEKO_LEGENDS_UNUSED` | W | HEURISTIC | extra legends listed but no Neeko in the deck |
| 30 | `NEEKO_LEGEND_BANNED` | W | UNCONFIRMED (8.3) | an extra legend is on the format's ban list |
| 31 | `TEAM_SAME_LEGEND` | E (2v2 with teammate deck) | CR 491.8.h | teammates' Champion Legends differ (by name) |
| 32 | `TEAM_SAME_BATTLEFIELD` | E (2v2 with teammate deck) | CR 491.8.i | no battlefield name in both teammates' sets (reading is HEURISTIC, section 10) |
| 33 | `ALT_CHAMPION_AVAILABLE` | info | TR 403.4.a | list other eligible champion units in combined that could become Chosen Champion while sideboarding |
| 34 | `DATA_STALE` | W | 0.1 | card not found in the local card data (e.g. Radiance cards) or ban snapshot older than HUB date |

Not checks (HEURISTIC, deliberately absent): rune split, minimum unit count, energy curve, presence of all three signature copies. Those belong to deck-quality scoring, not legality.

## 13. Worked edge cases

1. **Two different champion units of the same champion.** Legend Daughter of the Void (Kai'Sa). Chosen Champion Kai'Sa, Survivor x3 in main, plus Kai'Sa, Evolutionary x3 in main. Legal: different names, 3 each (CR 103.3.b.2, 132.4). Only Kai'Sa, Survivor is the Chosen Champion (CR 132.4: "If one of them is your Chosen Champion, the other is not"). In Bo3 the player may switch the Chosen Champion to Kai'Sa, Evolutionary between games (TR 403.4.a).
2. **Chosen Champion copy counting.** Chosen Champion Volibear, Furious + 3 more Volibear, Furious in main = 4 copies -> `COPY_LIMIT_EXCEEDED` (CR 103.3.b.1). The Champion Zone copy is one of the 40 and one of the 3.
3. **Signature card of another champion.** A Jinx (Fury/Chaos) deck adds Annie's Fury/Chaos signature unit Tibbers. Domains fit, but the champion tag is Annie -> `SIGNATURE_WRONG_CHAMPION` (CR 103.3.d.2). `DOMAIN_VIOLATION` does not fire, which is why check 16 is separate from check 12.
4. **Signature total.** 3 copies of the legend's signature spell + 1 signature gear of the same champion = 4 -> `SIGNATURE_TOTAL_EXCEEDED` even though each name is within 3 (CR 103.3.d.1). With 2 in main and 2 in sideboard we also flag it (HEURISTIC, combined counting).
5. **Unique signature gear.** Ornn deck: Forgefire Cape x1, Rabadon's Deathcrown x1, Shurelya's Requiem x1 -> legal (CR 825.3.b). Forgefire Cape x2 -> `UNIQUE_LIMIT_EXCEEDED`. All three plus any fourth signature card -> `SIGNATURE_TOTAL_EXCEEDED`.
6. **Signature unit as Chosen Champion.** Legend Dark Child (Annie) with Tibbers as Chosen Champion -> `CHAMPION_NOT_CHAMPION_UNIT` (CR 103.3.a.2 example, 103.3.d.3).
7. **Shared non-champion tag.** Legend Heart of the Tempest (tags Yordle, Kennen; Order/Chaos) with Teemo or Vex as Chosen Champion: both share the tag Yordle. -> `CHAMPION_TAG_MISMATCH` under our champion-tag rule (HEURISTIC + CR 133.8.b; official confirmation UNCONFIRMED). Heimerdinger, Inventor (Mind) would also fail `DOMAIN_VIOLATION`; Heimerdinger, Academy Instructor (RAD-132, Order), Teemo, Scout (Chaos) and Vex, Apathetic (Chaos) are inside the domains, so for them the champion-tag check is the only guard (DATA, GAL).
8. **Two-domain card vs legend domains.** A Fury/Chaos signature card in a Fury/Mind legend's deck -> `DOMAIN_VIOLATION`: all of the card's domains must be in the identity (CR 103.2.b.4).
9. **Legend with one domain.** None exists (DATA, GAL). If one is printed: identity = that single domain; all 12 runes must be that domain's rune; multi-domain cards are never legal; no-domain cards stay legal (CR 103.2.b.3-.5, 103.4.a.1, 176). The validator handles this with the same subset test.
10. **No-domain main-deck card.** Neeko, Blending In in any deck: passes `DOMAIN_VIOLATION` (CR 103.2.b.5). It then triggers checks 27-28. 3 Neekos still mean one shared set of up to 3 extra legends (PN-RAD, ERR-RAD); listing only 2 is legal (ERR-RAD "up to 3"). A Neeko only in the sideboard still requires the legends (PN-RAD: "Main Deck or sideboard").
11. **Banned battlefield.** Battlefields = The Arena's Greatest, Vilemaw's Lair, Windswept Hillock in `standard-*` -> `CARD_BANNED` on The Arena's Greatest (HUB, BAN-JUL). In `casual` the ban check is off. DATA: the first L-DECKS sample (Hartford #1, 2026) uses OGN-290 and is illegal today.
12. **Duplicate battlefield.** Two copies of one battlefield name + one other -> `BATTLEFIELD_DUPLICATE` (CR 103.5.c), also when the two are different printings.
13. **Format-dependent legend.** Legend Wuju Bladesman (OGS-019): legal in `standard-bo1/bo3`, `LEGEND_BANNED` in `2v2` (HUB). Switching to Wuju Master (UNL-191) fixes it without touching the 40 cards, because both are Calm/Body with the Master Yi tag (DATA, GAL).
14. **Main deck of 41.** `casual`/`ffa*`: legal (CR 103.3 "at least 40"). `standard-*`/`2v2` tournament: `MAIN_NOT_EXACT_40` (TR 601.1.b). DATA (L-DECKS): 6 of 59 scraped lists have 41 main cards and are flagged incomplete by the importer (cause not investigated).
15. **Sideboard overflow of copies.** 3 Defy in main + 1 Defy in sideboard -> `COPY_LIMIT_EXCEEDED` (TR 601.1.c.3).
16. **Spiderling.** 12 Spiderling in main -> legal (card text, CR 002). 40-card and 10-card limits still apply.
17. **Rune split 12/0.** Legend Fury/Chaos with 12 Fury Runes -> legal (no rule restricts the split). A Calm Rune -> `DOMAIN_VIOLATION` (CR 103.4.a.1). 11 or 13 runes -> `RUNE_COUNT`.
18. **Token in list.** An imported list containing "Recruit" or "Gold" -> `TOKEN_IN_DECK`; the importer should drop tokens with a notice.
19. **2v2 team.** Both teammates on the same Champion Legend -> `TEAM_SAME_LEGEND` (CR 491.8.h). Same champion via different legends (Wuju Master + Wuju Bladesman) is a different card name; Wuju Bladesman is banned in 2v2 anyway. Both lists containing the same battlefield name -> `TEAM_SAME_BATTLEFIELD` (CR 491.8.i).
20. **Stale card data.** A list with Ekko, Revolutionary (RAD-021) fails lookup in L-CARDS -> `DATA_STALE`, not an illegal-card error. Radiance must be ingested from GAL before validation is trustworthy.

## 14. Open items

| Item | Status |
|---|---|
| Signature total of 3: main only or main + sideboard | UNCONFIRMED; we count combined |
| Unique across main + sideboard | HEURISTIC (card says "Your deck"; TR 403.3) |
| Champion tag vs shared tags such as Yordle | HEURISTIC from CR 133.8.b; no explicit ruling found |
| Neeko's extra legends: format legality, teammate overlap, sideboard count | UNCONFIRMED (their number is settled: up to 3, ERR-RAD) |
| FFA ban list and FFA tournament structure | UNCONFIRMED; TR has no FFA section |
| Sideboard / match length in sanctioned 2v2 Constructed | UNCONFIRMED |
| Exact meaning of "same Battlefields" for teammates (CR 491.8.i) | UNCONFIRMED; we forbid any shared name |
| Start-of-game playtest (TEST-SOG) | not a rule; decision due with the Legacy patch notes, January 2027 |
| Radiance card data | GAL had 13 RAD entries without a type (11 also without domains) on 2026-11-11; re-fetch before ingest. GAL text is printed text; apply ERR-RAD and earlier errata on top |

## Verification log (2026-11-11)

Independent pass by a second agent. Method: every source was fetched again on 2026-11-11 (not read from `analysis/raw/`), both PDFs were converted with `pdftotext -layout` and each cited rule was read in full, and every DATA number was recomputed from the live gallery JSON, L-CARDS and L-DECKS. The recomputation is saved as `analysis/verify-rules.py` (run: `python3 analysis/verify-rules.py`); its output matched every number left in this document. About 215 separate claims were checked (source rows, rule citations and quotes, ban rows, table cells, data counts, edge cases).

### Corrections made

| # | Where | Was | Now | Evidence |
|---|---|---|---|---|
| 1 | 8.3, check 27, check 28, edge case 10, `rulesText` row, section 14, source table | Neeko, Blending In requires **exactly 3** extra legends (`NEEKO_LEGENDS_MISSING`, error) | **Up to 3** (0-3). Check renamed `NEEKO_LEGENDS_COUNT`: error above 3, warning below 3. New source row ERR-RAD | Radiance Errata Updates (playriftbound.com, 2026-10-09, linked from HUB): NEW TEXT "choose up to 3 different legends in addition to your starting legend"; OLD TEXT "choose 3 different legends". The gallery still shows the old printed text. PN-RAD says "you pick three legends"; card text wins (CR 002) |
| 2 | Section 2 (dataset encoding), check 12 | An empty domain list may be treated as "no Domain" | Only `["colorless"]` means no Domain; an empty list is missing data and must raise `DATA_STALE` | GAL 2026-11-11: 11 untyped Radiance entries (RAD-006, 009, 022, 026, 041, 047, 049, 104, 121, 123, 134) have `domain.values == []`. Passing them would let unfinished cards into any deck. L-CARDS has no empty list (831 one-domain, 100 two-domain) |
| 3 | Section 2 (neutral cards), 0.1, section 14 | Neeko is "the only non-token, non-battlefield card with no domain" | Only such card stored as `colorless`; other neutral Radiance cards cannot be ruled out until the 13 incomplete entries are filled | Same GAL data as #2 |
| 4 | Section 11, GAL equivalents; 8.2 | "the full rules name is `name + ", " + subtitle`" for GAL records; "GAL calls the card Wuju Bladesman" | True for champion units only. Signature cards with a subtitle carry the champion's name there (16 cards); the 4 OGS legends carry "Starter". Rules name is `name` alone for those | GAL: subtitles by type = 349 champion-unit printings, 15 signature spells, 1 signature unit (Tibbers / "Annie"), 4 legends ("Starter"). CR 103.3.a.2 names the cards "Tibbers" and "Loose Cannon". Applying the old rule would produce "Tibbers, Annie" and break copy-limit and ban matching |
| 5 | Section 7 | Quote "to one from their sideboard or main deck that matches their Legend" attributed to TR 403.4.a first | That wording is TR 601.1.c.4. TR 403.4.a reads "...that meets the deckbuilding rules of the competition format" | TR 2026-10-09 |
| 6 | Section 9 (FFA) | "TR section 600 covers Constructed, Limited and 2v2 only" | 600 also has 604 (round time limits). Conclusion unchanged: TR never mentions FFA | TR headings 601-604; text search for "free-for-all", "FFA", "Skirmish" returns nothing |
| 7 | 10.1 Limited | "draws one extra card at their first Beginning Phase (602.4.a.5)"; "Signature spells" without scope; "Bo1: register three" | Rule is 602.4.a.5.b, "at the start of their first Beginning Phase each game", one card even if both are missing; the allowance names signature **spells** only (gear/units UNCONFIRMED); the three-battlefield registration is a high-OPL rule. Draft rule numbers added | TR 602.3.e, 602.4.a.3.b, 602.4.a.5.b, 602.4.b.4-602.4.b.8 |
| 8 | Section 9 | "Bans are by name" stated without a label | Labelled HEURISTIC (inference) | No rule says so in those words; HUB lists names; CR 132.1, 132.3; TR 601.2.a |
| 9 | Edge case 3 | Title "Signature spell of another champion" (example is a unit) | "Signature card of another champion" | GAL: Tibbers is unit + signature |
| 10 | 0.1 table | Win check 472 -> 474 with no note | Wording also changed: "any opponent" -> "every opponent" | L-CR 472 vs CR 474 |
| 11 | Section 1 | "the only card that does so is Neeko" presented under a FACT label | Marked DATA (GAL text search) | Search of all 1408 GAL texts for deck-building wording finds Neeko, Spiderling and the three Unique cards only |

Additions that are not corrections: edge case 7 now names the three Yordle champions that are inside Kennen's domains (so only the tag check stops them); GAL source row notes that the gallery shows printed text without errata.

### Confirmed without change

- **Editions.** HUB links Core Rules `5c7946f7...pdf` ("Last Updated: 2026-10-09") and Tournament Rules `861752...pdf` ("Last Updated October 9, 2026"); sha256 of fresh downloads = `94d41fee86f88b61c4157c0389c0595d990b98e5b42555c99d9f649ee64d1fec` and `ce07da4fb632526afbbce7f058287a57e7444fa6bde17b0938ff52ce3fab3d07`. No newer edition exists on HUB on 2026-11-11. The local copy is 2026-07-16 and every row of the renumbering table in 0.1 is right (old 103.1-103.4, 472, 481-489 read from L-CR; new 103.1-103.5, 474, 483-491 read from CR). The three stale cross-references (133.7.a, 133.7.b, 161.2.a) are in the current PDF as described. Bomb (187.12) and 103.2.b.5 are absent from L-CR.
- **Core Rules citations**, read in full: 002, 103 to 103.5.c, 107.4.d.1, 132.3, 132.4, 133.4-133.8.b, 134.1-134.2, 161.1, 161.2.a, 164.1, 172, 176, 178, 180, 181, 185, 186, 187.1-187.12, 473.1.b, 474, 483-491 (every cell of both mode tables), 491.8.a-i, 825.1-825.3.b. All quotes match. The Core Rules contain no occurrence of "sideboard".
- **Tournament Rules citations**, read in full: 104.1, 401.2, 401.2.a, 402.1, 403.1-403.10, 404.2, 406.1.b, 406.1.h, 407.4, 601.1.b-d, 601.2.a-d.2, 601.3.c (incl. 601.3.c.6.a "Release Date: October 23rd, 2026"), 602.1.a.2, 602.1.b, 602.3.d, 602.3.g, 602.4.a.2-a.7.a, 602.4.b.3-b.4, 603.6, 603.7.a, 603.7.c.1.
- **Ban lists.** HUB (both lists "Last updated: September 18, 2026"), BAN-MAR (2026-03-30, effective March 31), BAN-JUL (timestamp 2026-07-17T00:30Z, effective July 24, 2v2 list = Standard list plus Master Yi, Wuju Bladesman), BAN-SEP (2026-09-15, Ekko, Recurrent and Stacked Deck, both formats). All 12 + 1 names, zones, dates and card codes match HUB, the articles, GAL and L-CARDS. No ban or rules article newer than FAQ-RAD (2026-10-26) is in the news index.
- **Other articles.** PN-RAD (2026-10-09, effective October 16; Neeko section and "Relevant rules: 103.1."), FAQ-RAD (2026-10-26), TRC-JUL (sideboard 8 -> 10, quote exact), TRC-OCT ("Added 401.2.a.", "Added 601.3.c.6. - 601.3.c.6.a.", "Added 602.3.g."), TEST-SOG (2026-10-15; "Is this a rules update? ... No."; decision in the Legacy patch notes), PRIMER (2025-07-28; "You can go higher than 40 if you really want to"), SETS-27 (2026-08-03; "Set 6: Legacy", "Arriving in January 2027").
- **GAL numbers (recomputed):** 1408 printings; RAD 219, 13 untyped; 145 legend printings, 58 distinct, all two-domain; 4 legend printings with `champion`; three legends with extra tags (Heart of the Tempest, Hexplosives Expert, Curator of the Sands); 8 Yordle champions; 74 non-token battlefields, all `colorless`; Brush and Baron Pit tokens; 177 distinct champion units, short name is a tag on 177; exactly one champion tag on 58 of 58 legends; 47 champion short names without a legend; Master Yi the only tag with two legends, 4 Master Yi units, all Calm or Body; no off-domain champion; 60 signature cards = 49 spells, 8 gear, 3 units, all matching their legends' domains; 3 Unique cards; 6 rune names (30 printings); Buff and XP Tracker untyped; no multi-domain card outside legends and signature cards; Spiderling and Neeko texts as quoted.
- **L-CARDS numbers (recomputed):** 931 cards, built 2026-09-06, type / superType / domain-count / `copyLimit` / printing-variant / printing-set counts all as stated; 9 legends with `champion`; 4 " - Starter" names; 7 tokens.
- **L-DECKS numbers (recomputed):** 59 lists, 49 complete; sideboard 8 in 47 of 49 (the other two: 7 and 10); signature totals 21 / 7 / 3 / 18; rune splits 29 / 18 / 7 / 1 over 55 lists; 32 of 49 complete lists contain a card banned today; 6 lists with 41 main cards, all flagged incomplete; first sample uses OGN-290.
- **L-BAN:** snapshot date 2026-08-10, 10 entries, lowercase `gameplayId` keys, no September bans, no 2v2 list.

### Left UNCONFIRMED (no primary source found)

1. Whether the limit of 3 Signature cards counts Main Deck + sideboard together (TR 403.3 and 601.1.c.3 speak of "copies of named cards" only; TR 703.3.a lists no signature example).
2. Whether Unique's "one card of a given name" counts Main Deck + sideboard together.
3. That a shared non-champion tag (Yordle) cannot satisfy "a champion tag that matches the tag on your Champion Legend". No patch note, FAQ or errata addresses it; CR 133.8.b is the only support.
4. Neeko's extra legends: must they be format-legal, may they equal a 2v2 teammate's Champion Legend, do they count toward the 10 sideboard cards.
5. Any ban list or tournament structure for free-for-all.
6. Sideboards and match length in sanctioned 2v2 Constructed (CR 491.6 "Best of 1" vs TR 603.7.c.1 "games after the first game of a match").
7. Exact scope of "Teammates may not utilize the same Battlefields" (CR 491.8.i).
8. Whether Radiance contains neutral cards other than Neeko, and the types/domains of the 13 incomplete gallery entries.
9. Whether signature gear or units get the Limited allowance that TR 602.4.a.3.b gives to signature spells.
10. Why 6 scraped lists show 41 main cards (not investigated by either pass).

### What the design must treat as heuristic

- The champion-tag derivation (tag equal to a champion unit's short name). It fits 177 of 177 units and 58 of 58 legends today but is our rule, not Riot's.
- Combined main + sideboard counting for the Signature total and for Unique.
- Bans keyed by name across all printings.
- Any rune split being legal (reading by absence of a rule).
- FFA using the Standard ban list; optional sideboard in 2v2 and none in FFA/casual.
- "No battlefield name shared between 2v2 teammates".
- Neeko's extra legends: warn rather than block on banned legends or teammate overlap; not counted in the sideboard.
- `copyLimit: 10` for Spiderling is a dataset placeholder (card text says "any number"); card data carries printed text, so errata (Neeko today) need an override layer.
- Every deck-quality statement (battlefield slot value, sideboard usage in sample lists) is judgement or September 2026 community data, not rules.

### Not re-run

`analysis/crawl-list.mjs`, `fetch-cards.mjs` and the other scripts in `analysis/` are not cited by this document and were not executed. `raw/pa-list.jsonl` and the riftcodex endpoint are not used by any claim here.
