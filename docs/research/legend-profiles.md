# Legend profiles: one synced record per Legend (research, 2026-11-11)

Purpose: give the Riftbound Forge builder a per-Legend record it can key on, so that every piece of advice names the cards of the deck in front of it and carries a visible reason. The record has two halves that are synced separately:

- a **text-derived half**, computed from card text only (rewards, needs, enables, Chosen Champion options, signature cards, weighted theme axes, battlefields that interact with the text);
- a **data-derived half**, counted from published decklists and event reports (popularity, results, typical Chosen Champion, rune split, battlefields, core and flex cards, and an explicit confidence flag).

Labels used below: **FACT** = primary source (official card text, official rules, official announcement). **DATA** = measured by us, with dataset and n. **HEURISTIC** = our judgement or a fixed formula of ours. **UNCONFIRMED** = could not be checked against a primary source.

This document is generated: section 9 (the per-legend appendix) and every table come from the scripts in `docs/research/analysis/legend-profiles/`. Re-run instructions are in section 10.

## 1. Result in short

- **58 Legends exist today, not 49.** FACT: the local `cards.json` (built 2026-09-06) has 49. The official card gallery on 2026-11-11 adds the set **Radiance (RAD, released 2026-10-23)** with **9 new Legends** (section 2.1).
- **Every one of the 58 has a text profile.** The generator parsed all 58 ability texts into kind / cost / condition / effect and found at least one theme axis for each. Against the GameLab engine's hand-scripted legends the ability kinds agree for 44 of 49 (section 4.5).
- **Data coverage is uneven and must be shown as such.** DATA: 1143 distinct complete lists from four sources (547 Radiance-era, 596 older; section 5.1). Radiance-era lists per legend: 4 (x2 legends), 6 (x2 legends), 7 (x5 legends), 8 (x12 legends), 9 (x12 legends), 10 (x15 legends), 11 (x4 legends), 12 (x3 legends), 14 (x1 legends), 18 (x1 legends), 26 (x1 legends). With our thresholds on Radiance-era lists: 32 `ok`, 26 `thin`, 0 `insufficient`. So for 26 of 58 legends the app must print n and say that current-format evidence is thin (section 6).
- **Three different popularity measures exist and they disagree.** DATA: most-built on Piltover Archive since Radiance (lists): Evelynn 100, Mordekaiser 77, Riven 76, Orianna 70, Ekko 59, Kai'Sa 49, Kennen 41, Ziggs 40. FACT counts: largest Day 1 share over the last three official Regional Qualifier field tables (Barcelona, Singapore, Los Angeles; all before Radiance): Kennen 10.9%, Irelia 8.3%, Master Yi 6.7%, Rengar 5.1%, LeBlanc 5.0%, Jayce 4.7%, Rek'Sai 4.2%, Azir 4.2%. DATA: most first places in riftbound.one's top-3 archive: Master Yi 32, Irelia 24, Diana 20, LeBlanc 11, Azir 9, Ezreal 8, Fiora 7, Viktor 6. The Europe Regional Championship field was 43.3% Riven (riftbound.gg report). The app must never present list counts as "meta share", and must date every share.
- **Official results exist per legend, but only up to 2026-09-30.** FACT: eleven official "Top Decks" articles give Day 1 and Day 2 pilot counts per legend; best Day 2 conversion over the last three (30+ pilots): Kennen 31% (653 pilots), Azir 24% (250 pilots), LeBlanc 24% (298 pilots), Ezreal 23% (150 pilots), Jayce 23% (282 pilots), Rengar 23% (305 pilots), Master Yi 22% (398 pilots), Kha'Zix 22% (190 pilots); whole field 18%. No official field table for a Radiance-era event was published by 2026-11-11 (UNCONFIRMED whether one will be for the Europe Regional Championship).
- **Local card data is incomplete in a way that matters for text analysis.** FACT: for 32 Equipment cards `cards.json` holds only the Equip line; the granted effect lives in a separate gallery field (`effect`) that the September build dropped (section 2.3).

## 2. What changed since the local September 2026 snapshot

### 2.1 New Legends (FACT)

Source: official card gallery https://playriftbound.com/en-us/card-gallery/ fetched 2026-11-11 (1,408 printings; RAD has 219 printings, 18 of them legend printings = 9 legends, each with a base and an overnumbered printing). Release date 2026-10-23 and "nine new Legends": https://playriftbound.com/en-us/news/announcements/the-radiance-overview/ (local copy `docs/research/analysis/raw/radiance-overview.html`, fetched 2026-11-11).

| Code | Legend | Champion tag | Domains | Text (FACT, official gallery 2026-11-11, verbatim) |
|---|---|---|---|---|
| RAD-139 | Boy Who Shattered Time | Ekko | Fury/Mind | [Empower] — [1], [Exhaust] (Use only if not Empowered.) // Disempower me, [Exhaust]: Reduce the cost of the next unit you play this turn by [2][Any] and give it "Kill me at end of turn." |
| RAD-141 | Hexplosives Expert | Ziggs | Fury/Chaos | [1][Any], [Exhaust]: Play a Bomb gear token to a battlefield. (It has [Deploy]. When it dies, deal 2 to an enemy there and kill your other Bombs there.) |
| RAD-143 | Iron Revenant | Mordekaiser | Fury/Order | [Reaction][>] Banish a unit or gear from your trash, [Exhaust]: [Add] [Any]. Spend this Power only to play units or gear. (Abilities that add resources can't be reacted to.) |
| RAD-145 | Lady of Clockwork | Orianna | Calm/Mind | At the start of your Main Phase, you may pay [1] to choose a friendly gear. It becomes a unit gear with Might equal to its Energy cost until you choose another gear with me. |
| RAD-147 | Pride of Nazumah | K'Sante | Calm/Body | [1], [Exhaust]: Give a friendly unit "I have [Assault] equal to my [Shield]" this turn. (+1 [Might] for each instance of Assault while it's an attacker.) |
| RAD-149 | The Exile | Riven | Calm/Chaos | Units you play to battlefields you control enter ready. |
| RAD-151 | Starry-Eyed Songstress | Seraphine | Mind/Order | As an additional cost to play a spell, you may exhaust me and three friendly units to reduce the cost of that spell by [2]. |
| RAD-153 | Agony's Embrace | Evelynn | Body/Chaos | Once each turn, when you play a card from face down, draw 1. Then, if it's not your turn, discard 1. |
| RAD-155 | Exemplar of Demacia | Jarvan IV | Body/Order | When you play a gear with [Deploy], you may exhaust me and pay [Any] to move a friendly unit to that battlefield. |

- DATA: after grouping printings, the pool used here is 1098 gameplay cards (167 of them RAD). This matches the 167 numbered RAD cards reported in `legality-and-data.md`.
- DATA: 13 RAD gallery records had an empty card type on 2026-11-11 and most have an empty domain list: RAD-009 Antagonistic Apparatus (unit, domain missing), RAD-026 Entrenched Boar (unit, domain missing), RAD-047 Fanfare (spell, domain missing), RAD-034 Hunker Down (spell), RAD-041 Hush (spell, domain missing), RAD-049 Industrious Mechsmith (unit, domain missing), RAD-121 One-Two Punch (spell, domain missing), RAD-104 Pitiless Stalker (unit, domain missing), RAD-123 Protector's Shield (gear, domain missing), RAD-134 Raucous Anthem (spell, domain missing), RAD-127 Rousing Display (spell), RAD-006 Scorched Earth (spell, domain missing), RAD-022 Whirling Twirligig (gear, domain missing). The type is recovered from the image accessibility text; where the domain is missing the card is **never counted as inside a Domain Identity** (so axis pools for every legend are undercounted by up to 11 cards until the gallery is fixed). Hush is one of them and appears in many fetched lists.
- FACT (re-check): the official gallery JSON endpoints (`riftbound_gallery_sets` and `riftbound_gallery_cards`, see `legality-and-data.md` section 5.1) were queried again on 2026-11-11 at 20:16 UTC: still 6 sets (OGN, OGS, SFD, UNL, VEN, RAD), 1,408 items, 145 legend printings of which 18 are RAD. No Legend newer than Radiance is public.
- UNCONFIRMED (not checked by us against a primary page): later sets. `legality-and-data.md` section 2.3 lists Legacy (2027-01-29) and The Reckoning (2027-04-30) from the official products article; no Legend of those sets is public in the gallery today.
- DATA: Riftcodex (https://api.riftcodex.com/cards, fetched 2026-11-11, 15 pages) returned 1,451 printings, the same ids as the local copy of 2026-09-06, newest `updated_on` 2026-07-21, no RAD. It cannot be the source for new legends.

### 2.2 A Legend's own text changed (FACT)

`cards.json` and the gallery differ on 11 cards in wording. One of them is a Legend: OGN-259 Unforgiven now reads "to or from **your** base" instead of "its base". Full list:

| Code | Card | cards.json (2026-09-06) | Official gallery (2026-11-11) |
|---|---|---|---|
| OGS-001 | Annie, Fiery | Your spells and abilities deal 1 Bonus Damage. (Each instance of damage the spell deals is increased by 1.) | Your spells and abilities deal 1 Bonus Damage. (Each instance of damage they deal is increased by 1.) |
| VEN-044 | Astral Heron | When you play your first card each turn, if I'm at a battlefield, the next card you play this turn costs [2][Any][Any] less. | When you play your first card each turn, if I'm at a battlefield, your next card costs [2][Any][Any] less. |
| OGN-002 | Brazen Buccaneer | As you play me, you may discard 1 as an additional cost. If you do, reduce my cost by [2]. | As you play me, you may discard a card as an additional cost. If you do, reduce my cost by [2]. |
| UNL-044 | Flurry of Feathers | [Reaction] // Choose one — // - Counter a spell. // - Play four 1 [Might] Bird unit tokens with [Deflect]. (Opponents must pay [Any] to choose them with a spell or ability.) | [Reaction] (Play any time, even before spells and abilities resolve.) // Choose one — // - Counter a spell. // - Play four 1 [Might] Bird unit tokens with [Deflect]. (Opponents must pay [Any] to choose them with a spell or ability.) |
| OGN-264 | Guerilla Warfare | Return up to two cards with [Hidden] from your trash to your hand. You can hide cards ignoring costs this turn. | Return up to two cards with [Hidden] from your trash to your hand. You can hide ignoring costs this turn. |
| SFD-217 | Seat of Power | When you conquer here, draw 1 for each other battlefield you or allies control.. | When you conquer here, draw 1 for each other battlefield you or allies control. |
| SFD-145 | Switcheroo | [Hidden] (Hide now for [Any] to react with later for [0].) // [Action] (Play on your turn or in showdowns.) // Swap the Might of two units at the same battlefield this turn. | [Hidden] (Hide now for [Any] to react with later for [0].) // [Action] (Play on your turn or in showdowns.) // Swap the Mights of two units at the same battlefield this turn. |
| UNL-160 | Ultrasoft Poro | [Exhaust]: Play two [1] [Might] Bird unit tokens with [Deflect]. Use this ability only while I'm at a battlefield. (Opponents must pay [Any] to choose a [Deflect] unit with a spell or ability.) | [Exhaust]: Play two 1 [Might] Bird unit tokens with [Deflect]. Use this ability only while I'm at a battlefield. (Opponents must pay [Any] to choose a [Deflect] unit with a spell or ability.) |
| OGN-123 | Unchecked Power | Exhaust all friendly units, then deal 12 to ALL units at battlefields. | Exhaust all friendly units, then deal 12 to all units at battlefields. |
| OGN-259 | Unforgiven | [2], [Exhaust]: Move a friendly unit to or from its base. | [2], [Exhaust]: Move a friendly unit to or from your base. |
| OGN-158 | Volibear, Imposing | [Shield 3] (+3 [Might] while I'm a defender.) // [Tank] (I must be assigned combat damage first.) // When an opponent moves to a battlefield other than mine, draw 1. (Bases are not battlefield.) | [Shield 3] (+3 [Might] while I'm a defender.) // [Tank] (I must be assigned combat damage first.) // When an opponent moves to a battlefield other than mine, draw 1. (Bases are not battlefields.) |

The generator keeps the `cards.json` text in `rulesText` and puts the newer gallery text in `rulesTextCurrent`; axis detection uses the newer one.

### 2.3 Equipment effect text is missing from cards.json (FACT)

For 32 Equipment cards the gallery has a second text field (`effect`) that `cards.json` does not carry. Examples: UNL-019 Blighted Battleaxe gains "At the end of your turn, if I didn't conquer this turn, unattach this and deal 4 to me."; SFD-118 Boneshiver gains "When I conquer, channel 1 rune exhausted."; SFD-133 Boots of Swiftness gains "[Ganking] (I can move from battlefield to battlefield.)"; SFD-042 Brutalizer gains "If this was attached to me this turn, I have an additional +2 [Might].". Codes: UNL-019, SFD-118, SFD-133, SFD-042, SFD-064, SFD-134, SFD-124, SFD-033, SFD-073, SFD-153, SFD-190, SFD-051, VEN-027, SFD-102, UNL-188, UNL-096, VEN-073, SFD-150, VEN-011, SFD-191, SFD-016, SFD-172, SFD-009, VEN-103, VEN-137, SFD-192, SFD-030, UNL-039, SFD-090, SFD-115, SFD-108, SFD-086.

Consequence: any trait or axis derived from `cards.json` `rulesText` alone misses what these Equipment do (conquer triggers, Gold, Ganking, Shield). That includes `Untitled/apps/web/src/lib/scoring.ts` if it reads only `rulesText` (HEURISTIC: not verified in that code). The generator here merges the gallery `effect` text for those cards. A further 11 differences are the six basic runes and five units without rules text, where `cards.json` holds a placeholder sentence ("Riftbound Rune: Body Rune.", "Riftbound Unit: Mega-Mech.") and the gallery holds nothing. Those placeholders must not be fed to text analysis.

### 2.4 Bans that touch profiles (FACT, from `rules.md` section 9 and `legality-and-data.md` section 3)

- Battlefields banned in Standard: OGN-292 The Dreaming Tree, OGN-284 Obelisk of Power, OGN-285 Reaver's Row (2026-03-31), OGN-290 The Arena's Greatest, OGN-276 Aspirant's Climb (2026-07-24). The generator keeps them in each legend's battlefield list but flags `bannedFrom` and sorts them last.
- SFD-020 Draven, Vanquisher is banned (2026-03-31). It still appears among Draven's Chosen Champion options with the flag; the builder must not offer it.
- OGN-110 Ekko, Recurrent and OGN-183 Stacked Deck were banned on 2026-09-18, after the local decklist sample (2026-09-06). The September sample therefore contains cards that are illegal today.
- OGS-019 Wuju Bladesman (Master Yi) is banned as a Legend in 2v2 only.

## 3. Rules that define what a profile may say (FACT)

Rule numbers are from the current Core Rules, edition 2026-10-09 (`docs/research/analysis/raw/core-rules-2026-10-09.txt`). The local file `GameLab/data/rules/core-rules.md` is the 2026-07-16 edition, where deck-construction rules are numbered one lower (103.2 there is 103.3 now); see `rules.md` section 0.1.

- **Domains.** CR 103.2.b: the Champion Legend dictates the deck's Domain Identity. CR 103.2.b.3: a single-domain card is allowed if that domain is in the identity. CR 103.2.b.4: a multi-domain card needs all of its domains in the identity. CR 103.2.b.5: a card with no domain is allowed anywhere. The generator's `in_identity()` implements exactly these three.
- **Champion tag.** CR 133.8.b: "Tags used to link Legends, Champion Units, and Signature cards are known as Champion Tags." A legend can carry other tags too (FACT, cards.json: VEN-155 Heart of the Tempest has tags Yordle and Kennen; RAD-141 has Yordle and Ziggs). The generator picks the tag for which a Champion unit with that short name exists.
- **Chosen Champion.** CR 103.3.a.2: it "must be a champion unit with a champion tag that matches the tag on your Champion Legend". It is also subject to Domain Identity (CR 103.3.c in the current numbering). The profile lists every such unit; a unit with the right tag but outside the identity goes to `championsOutsideIdentity`. Today that list is empty for all 58 legends (DATA).
- **Signature cards.** CR 103.3.d: at most 3 Signature cards in total, all with the legend's champion tag. CR 103.3.d.3: they are not Champion units.
- **Battlefields.** CR 103.5.c: no two battlefields of the same name. Three are registered in every sanctioned mode (`rules.md` section 6). Battlefields have no domain, so any legend may take any battlefield that is not banned.
- **Costs inside triggered abilities.** CR 383.3.b: a cost at the start of a triggered ability's effect, or right after "you may", is the base cost of that ability. This is why the parser moves "you may exhaust me to ..." and "you may pay [1] to ..." out of the effect and into `cost`.
- **Paying Power is recycling a rune.** CR 164.2.b: a Basic Rune has "[Reaction][>] Recycle this: Add [C]". So a legend that triggers on "When you recycle a rune" (SFD-203 Battle Mistress) triggers whenever a rune is recycled for Power. The axis `recycle` therefore counts every card with a Power cost as an enabler.
- **Extra legends.** CR 107.4.d.1: legends added to the Legend Zone by effects are not Champion Legends. RAD-167 Neeko, Blending In lets a deck register up to 3 additional legends (`rules.md` section 8.3). A profile is therefore also relevant when its legend is someone else's extra legend. DATA: in the fetched lists these legends were registered as extra legends: OGN-269 Sett x5, OGN-267 Miss Fortune x4, SFD-185 Draven x4, UNL-193 Vex x3, UNL-199 LeBlanc x3, OGN-255 Ahri x2, OGN-257 Lee Sin x2, OGN-261 Leona x2, OGS-017 Annie x2, RAD-149 Riven x2, SFD-195 Irelia x2, SFD-201 Renata Glasc x2, UNL-183 Rengar x2, UNL-185 Pyke x2, OGN-265 Viktor x1, RAD-153 Evelynn x1, UNL-181 Jhin x1, UNL-201 Kha'Zix x1, VEN-147 Shen x1.

## 4. The text-derived half

Script: `docs/research/analysis/legend-profiles/build_legend_profiles.py` (Python 3 standard library, no network, deterministic). Card loading: `cardpool.py` (reads `cards.json`, overlays an official gallery snapshot for sets and text that `cards.json` lacks; a port of GameLab's `richToPlain`). Output: `data/legend-profiles.text.json` (about 0.8 MB).

### 4.1 Ability parsing (HEURISTIC parser over FACT text)

Each line of the legend text becomes one ability record:

- reminder text in parentheses is removed first and kept in `reminder`;
- leading gates `[Action]`, `[Reaction]`, `[Level N]`, `[Empowered]` become `timing` or `gate`;
- `<cost>: <effect>` is `activated`; "When / At / The first time ..." is `triggered`; "While / As ..." and "Your X have ..." are `static`; "would ... instead" is `replacement`;
- the trigger clause and any following "if ..." clause go to `condition`; the rest is `effect`;
- "Use only ..." and "Spend this Energy only ..." sentences go to `restriction`;
- costs embedded after "you may" move to `cost` (CR 383.3.b).

### 4.2 Rewards, needs, enables (HEURISTIC)

- **rewards** = an axis found in a `condition`, a `restriction` or a `gate`, or in an effect fragment that scales ("equal to ...", "for each ..."). Meaning: the legend pays you for doing this, so the deck should do it often.
- **needs** = an axis found in a non-resource cost ("Banish a unit or gear from your trash", "Spend 2 XP", "discard 1", "three friendly units"), or an own object the effect acts on ("Ready a gear", "Equipment you control"). Meaning: the legend's ability does nothing without it.
- **enables** = an axis found in the `effect`. Meaning: the legend produces this for free, so cards that profit from it get better.

Every entry stores the verbatim fragment that produced it.

### 4.3 Theme axes and weights (HEURISTIC formula)

55 axes: `spell-matters`, `expensive-spells`, `expensive-permanents`, `unit`, `mighty`, `wide`, `token`, `equipment`, `gear`, `gear-token`, `gold`, `buff`, `stun`, `hold`, `conquer`, `combat-win`, `excess-damage`, `defend`, `defend-alone`, `assault`, `shield`, `tank`, `movement`, `ganking`, `bounce-own`, `hidden`, `play-from-elsewhere`, `ready`, `ready-runes`, `channel-rune`, `energy-ramp`, `draw`, `discard`, `low-hand`, `banish`, `trash`, `empower`, `level`, `temporary`, `legion`, `choose-friendly`, `choose-enemy`, `showdown`, `might-reduction`, `recycle`, `protection`, `death`, `deploy`, `score-race`, `card-copy`, `cost-reduction`, `unit-gear`, `activated-abilities`, `self-sacrifice`, `legend-ready`. Ids follow `Untitled/apps/web/src/lib/scoring.ts` `TRAIT_LABELS` where the same concept exists there. Tags and token names that the legend text names (Mech, Sand Soldier, Recruit, Bomb, and through Brush's reminder text Bird, Cat, Dog, Poro) become `tag:<Name>` axes.

Weight of an axis for a legend, fixed constants {"rewards": 1.0, "needs": 0.8, "enables": 0.6, "championShare": 0.2, "signatureShare": 0.1, "championOnly": 0.35, "signatureOnly": 0.15}:

- base = 1.0 if the legend text rewards it, 0.8 if it needs it, 0.6 if it only enables it;
- plus 0.2 x (share of the legend's Chosen Champion options whose text mentions the axis) plus 0.1 x (share of its signature cards that do), capped at 1.0;
- if the legend text does not mention the axis at all: 0.35 x champion share + 0.15 x signature share (so at most 0.5).

Each axis also carries `poolSupport`: the main-deck cards inside the legend's Domain Identity that do the thing (by text pattern or by a structural test such as "spell costing 4 or more"). This is what turns an axis into named cards. Example (DATA, generated): Radiant Dawn rewards Stun ("When you stun one or more enemy units"); inside Calm/Order there are 22 cards with a stun in their text, starting with Ki Burst (RAD-028), Rune Prison (OGN-050), Facebreaker (OGN-220), Thwonk! (SFD-040), Skyward Strike (UNL-038), Solari Shieldbearer (OGN-051), Solari Shrine (OGN-072), Zenith Blade (OGN-262).

### 4.4 Battlefields by text (HEURISTIC)

For every non-token battlefield the same axis patterns run over its text, split into its trigger ("When you hold here") and its effect. A battlefield is listed for a legend when:

- it **gives** something the legend rewards or needs, or it **asks for** something the legend produces (complementary, score 1.0 x axis weight); or
- it triggers on the same event the legend rewards (shared trigger such as conquer or hold, score 0.5 x axis weight); or
- it says "ready your legend" and the legend's ability exhausts the legend (+0.6; today only SFD-210 Hall of Legends).

Two texts that merely produce the same thing do not count. Each reason stores both verbatim fragments. Legends with no text-fit battlefield at all: OGN-251 Jinx, OGS-017 Annie, SFD-185 Draven. For those the app must fall back to the data half or say that the legend text gives no battlefield preference.

### 4.5 Checks and known misreads

- DATA (cross-check against the engine): `docs/research/analysis/interactions/engine-scripts.json` is a dump of the GameLab engine's scripted cards (`GameLab/packages/cards`). After mapping the engine's `passive`, `costMod` and `globalMod` to our `static`, the multiset of ability kinds is identical for 44 of the 49 legends the engine scripts. Differences: UNL-191 (ours static+static, engine replacement+static); UNL-199 (ours triggered, engine triggered+triggered); VEN-139 (ours activated+activated, engine activated); VEN-145 (ours triggered, engine triggered+triggered+triggered); VEN-149 (ours activated+activated+activated, engine activated+activated). All are counting conventions (the engine splits "conquer or hold" into two triggers and "unit, gear, or activated ability" into three, and treats the `[Empower]` cost line as a keyword rather than an ability), not different readings of the text. The 9 RAD legends have no engine script, so their parse is unchecked.
- DATA (does the text half agree with what people register?): 41 of 55 legends with fetched lists and a text-fit list have at least one of their top-5 text-fit battlefields registered in a fetched list; 321 of 1556 registered battlefield slots (21%) are battlefields the text fit lists at all. 56 of 79 rewarded or needed axes have at least one of their pool cards among that legend's core cards (75%+ of fetched lists). Reading: the axis pools do capture cards people actually build around, but **text fit explains only a minority of battlefield choices**. Most registered battlefields are generic picks. Across all fetched lists the most registered battlefields are: SFD-216 Rockfall Path 91/547, UNL-215 Star Spring 76/547, OGN-298 Zaun Warrens 73/547, OGN-296 Void Gate 65/547, SFD-217 Seat of Power 64/547, OGN-287 Sigil of the Storm 56/547, SFD-218 Sunken Temple 55/547, UNL-210 Forbidding Waste 54/547, OGN-280 Grove of the God-Willow 54/547, UNL-212 Frozen Fortress 49/547. HEURISTIC for the app: rank battlefields by registered frequency first (with n), and use the text fit as the explanation layer and as the tie-breaker, not the other way round.
- HEURISTIC limits that the builder must know about:
  1. Axes overlap (`defend` contains `shield` and `tank`; `movement` contains `ganking`; `gold` is inside `gear-token`). A battlefield matching two overlapping axes is scored twice. Example: RAD-147 Pride of Nazumah with UNL-208 Black Flame Altar scores 2.0.
  2. `unit` enablers are "units costing 2 Energy or less"; `low-hand` and `legion` enablers are "cards costing 1 or less"; `mighty` sources are units with 5+ printed Might or a text mention. These cut-offs are ours.
  3. VEN-163 Risen Altar reduces Empower costs "of your units here". It is listed for legends whose own text says Empower, although the legend's Empower cost is not a unit's. The fit is real only through Empower units in the deck.
  4. Legends whose text has no deck-building condition get few axes: OGS-017 Dark Child (ready 2 runes), OGN-251 Loose Cannon, SFD-185 Glorious Executioner. Their direction comes from champion text and from data.
  5. Reminder text is ignored except for tribe names. If a future legend hides a real condition in reminder text, the parser will miss it.
  6. Conquer and hold are triggers on about half of all battlefields, so legends that reward both (UNL-195 Green Father, UNL-199 Deceiver) get about 30 listed battlefields; only the ranking is useful there.

## 5. The data-derived half

Scripts: `fetch_pa_decks.py` (network, polite, resumable), `build_legend_meta.py` (no network). Output: `data/legend-profiles.meta.json`.

### 5.1 Datasets (DATA unless marked)

| Id | What | n | Caveat |
|---|---|---|---|
| `official-rq-2026` | FACT source: eleven official "Top Decks" articles on playriftbound.com (table below), parsed by the shared `analysis/meta-sources/official-parse.mjs`; local copy `raw/official-rq-top-decks-2026-11-11.json` | per-legend Day 1 and Day 2 pilot counts for 11 Regional Qualifiers; 409 printed lists with a resolvable legend, 401 complete | All before Radiance (newest: Los Angeles, published 2026-09-30). One list per legend per event: that legend's best-placed pilot, not a top-8 list. Lists in the Bologna article print no legend or champion line and are skipped unless resolvable |
| `r1-top3-2026-11-11` | https://www.riftbound.one/decklists, one page fetched 2026-11-11 by the meta-sources task; local copies `raw/riftbound-one-decklists-*.json` | 534 first, second and third place lists (2026-04 to 2026-10), 238 complete (the others have no rune section) | Community archive; many small events (Chinese City Challenges are the largest group); dates are month and year only; UNCONFIRMED how the site collects placements |
| `pa-fetch-2026-11-11` | Deck pages https://piltoverarchive.com/decks/view/<id> fetched 2026-11-11 | 703 parsed (577 from the per-legend fetch of this task, 126 more from the shared event-named fetch `analysis/raw/pa-decks.jsonl`), 694 complete (40+ main, 12 runes) | Published lists; placements are whatever the uploader wrote in the name. Per-legend fetch: up to 10 per legend, event-named Radiance-era lists first, round-robin |
| `pa-sample-2026-09-06` | `GameLab/data/decks/samples/piltover-archive-2026-09-06.json`: 59 lists saved from https://piltoverarchive.com/decks on 2026-09-06 | 51 lists with a legend, 49 complete | Unleashed-era Regional Qualifier "best of" lists; before Radiance and before the 2026-09-18 bans |
| `pa-list-2026-11-11` | Deck index rows (id, name, legend code, views, dates) from https://piltoverarchive.com/decks?page=N, pages 1 to 144 of about 417, crawled 2026-11-11 by the shared `analysis/crawl-list.mjs` | 3456 rows, 1442 created on or after 2026-10-23 | Site default order; published lists, not registrations |
| `results` | riftbound.gg "Meta Tier List, Radiance, Week 2" (updated 2026-11-06; 13 tournaments, 2026-10-30 to 2026-11-04) and "Europe Regional Championship" report (updated 2026-11-08) | 21 legends in the tier list; 19 with a win rate over more than 10 matches | Hand-transcribed into `data/results-riftboundgg-2026-11.json` from the copies in `analysis/matchups-and-lines/raw/`. Reported per champion name, so legends that share a champion cannot be separated |

Official field tables used (FACT, fetched 2026-11-11 by the meta-sources task; counts are sums of the per-legend rows):

| Published | Article (FACT source) | Legends in field table | Day 1 pilots | Day 2 pilots | Lists printed |
|---|---|---|---|---|---|
| 2026-02-25 | [The Best Decks out of Bologna](https://playriftbound.com/en-us/news/organizedplay/the-best-decks-out-of-bologna/) | 28 | 1466 | 246 | 36 |
| 2026-03-04 | [Vegas' Top Decks](https://playriftbound.com/en-us/news/organizedplay/vegas-top-decks/) | 28 | 1417 | 235 | 36 |
| 2026-04-22 | [Lille's Top Decks](https://playriftbound.com/en-us/news/organizedplay/lilles-top-decks/) | 28 | 1736 | 319 | 36 |
| 2026-05-01 | [Atlanta's Top Decks](https://playriftbound.com/en-us/news/organizedplay/atlantas-top-decks/) | 28 | 1510 | 295 | 36 |
| 2026-05-21 | [Sydney's Top Decks](https://playriftbound.com/en-us/news/organizedplay/sydneys-top-decks/) | 40 | 1235 | 193 | 48 |
| 2026-06-04 | [Vancouver's Top Decks](https://playriftbound.com/en-us/news/organizedplay/vancouvers-top-decks/) | 40 | 1496 | 265 | 48 |
| 2026-06-17 | [Utrecht's Top Decks](https://playriftbound.com/en-us/news/organizedplay/utrechts-top-decks/) | 40 | 1812 | 321 | 48 |
| 2026-06-24 | [Hartford's Top Decks](https://playriftbound.com/en-us/news/hartfords-top-decks/) | 40 | 1663 | 307 | 48 |
| 2026-08-26 | [Barcelona's Top Decks](https://playriftbound.com/en-us/news/organizedplay/barcelonas-top-decks/) | 41 | 2130 | 379 | 41 |
| 2026-09-09 | [Singapore's Top Decks](https://playriftbound.com/en-us/news/organizedplay/singapores-top-decks/) | 43 | 1893 | 303 | 41 |
| 2026-09-30 | [Los Angeles' Top Decks](https://playriftbound.com/en-us/news/organizedplay/los-angeles-top-decks/) | 44 | 1962 | 371 | 41 |

Not included: the Houston article (https://playriftbound.com/en-us/news/announcements/from-garen-to-annie-rq-houstons-top-decks/, December 2025) was not parsed.

**Pooling (DATA).** 1382 complete lists in total; 239 are exact duplicates of another list of the same legend (same main deck, runes and battlefields, usually the same list on two sites) and are dropped, leaving 1143. Each list gets an era by a fixed rule: `radiance` if it holds a RAD card or its source date is on or after 2026-10-23, otherwise `pre-radiance`. Result: 547 Radiance-era, 596 older. HEURISTIC limit: riftbound.one gives only the month, so an October list without a RAD card counts as older even if it was played after the release. When a dropped duplicate had tournament provenance and the kept copy did not, the kept copy inherits it (`eventMarkerFrom` names the duplicate), so fetching more lists can never lower a legend's provenance count. HEURISTIC: "tournament provenance" on Piltover Archive means the list name matches an event pattern, either `MARK` in `fetch_pa_decks.py` or `EVENT_RE` in the shared `analysis/select-tournament.mjs` (which is broader, e.g. it accepts "worlds"-style names); a list fetched by both tasks counts if either pattern matched.

Source policy notes (FACT, robots.txt files fetched 2026-11-11, copies in `analysis/meta-sources/raw/robots-*.txt`):

- playriftbound.com: official site; the articles are public news pages.
- piltoverarchive.com allows `/` and plain `/decks?page=`; it disallows `/api/` and filtered `/decks?` queries. Only deck view pages and plain pagination were requested, serially, 2.5 to 3 s apart, generic User-Agent, no cookies.
- riftbound.one: `User-agent: * Allow: /`, `Crawl-delay: 1`. One page was fetched once.
- riftdecks.com disallows AI crawlers by name (including `ClaudeBot` and `anthropic-ai`) and states that scraping for a competing service is not allowed. **Not fetched, not used.** It has per-legend metagame pages; if the owner wants them, that is a manual decision.
- riftbound.gg disallows the user agents `anthropic-ai` and `Claude-Web` while allowing `*`. This research did not fetch it; it read the two article copies another research task had already saved. HEURISTIC: treat riftbound.gg numbers as hand-entered input, not as a sync source.
- No source gives per-legend win rates for all 58 legends. UNCONFIRMED: whether Piltover Archive's tournament pages expose structured standings (the saved page `analysis/meta-sources/raw/pa-tourn-1.html` has no placement fields in its payload).

### 5.2 What is counted per legend

- `popularity`: lists in the Piltover Archive index, lists since 2026-10-23, share and rank among the 58, event-named lists since 2026-10-23, summed views.
- `officialField`: for every official field table the legend appears in: Day 1 pilots, Day 2 pilots, shares, Day 2 conversion and the whole field's conversion; plus `recent`, the sum over the last 3 tables. A conversion rate is only flagged usable from 30 Day 1 pilots (HEURISTIC threshold).
- `podiums`: first, second and third places in `r1-top3-2026-11-11`, for all lists and for Radiance-era lists.
- `results`: tier, wins and top cuts (week-2 report); win rate and matches (Europe Regional Championship).
- `samples.radiance` and `samples.preRadiance`, each over the pooled lists of that era: source mix, newest set per list, how many lists hold a card that is banned today, Chosen Champion distribution, rune split distribution, battlefield inclusion, `coreCards` (in at least 75% of lists), `flexCards` (25% to 74%), top 25 cards with inclusion rate and average copies, side deck cards, average main-deck type counts, `variants` (lists grouped by Chosen Champion with the cards that are at least 50 points more common in that group than outside it; only for groups of 2+ lists), and `archetypeLabels` (below). A card that is banned today keeps its row and gets `bannedFrom`.
- `dataConfidence` (HEURISTIC thresholds, **Radiance-era lists only**): `ok` = at least 5 complete lists of which at least 3 have tournament provenance (event-named on Piltover Archive, a riftbound.one podium, or an official list); `thin` = 2 to 4 (or 5+ without enough provenance); `insufficient` = fewer than 2.
- `adviceBasis`: `radiance-lists` when `dataConfidence` is `ok` or `thin`; `pre-radiance-lists-only` when it is `insufficient` but at least 2 older lists exist; `text-only` otherwise.
- `dataAvailability` (HEURISTIC thresholds): `enough` if the Piltover Archive index shows at least 10 lists and at least 3 event-named lists since 2026-10-23, else `scarce`. This separates "we fetched too little" from "there is too little".
- Deck entries are matched to the pool by printing code, then by name. Showcase rune printings `<SET>-R01` to `R06` are mapped by number in the order Fury, Calm, Mind, Body, Chaos, Order (the gallery lists the VEN ones; the script stops if they contradict the order). Unresolved entries in this run: official:Master Yi, Honed x5, official:Trapping Ground x3, official:Ruin Runner2 Se x1, official:Factory Recall1 x1, official:Si vir, Mercenary x1. A list with an unresolved main-deck or rune entry falls below 40 or 12 and is not counted as complete.

**Archetypes (DATA join, HEURISTIC labels).** This task does not cluster. `archetypeLabels` joins, by deck id, the four shape labels (`unit-aggro`, `spell-tempo`, `gear-engine`, `big-control`) that the deck-theory task assigned with k-means over role counts (`analysis/out/results.json`, see `deck-theory.md`). Only Piltover Archive lists that are in both datasets have a label (199 of the 547 Radiance-era lists). Inside one legend the useful split is the Chosen Champion split (`variants`) together with core and flex cards; the shape label says which of the four broad shapes those lists fall in. With most legends under 10 Radiance-era lists, finer clustering inside a legend would be noise (HEURISTIC).

## 6. Which legends have too little data

Thresholds are in section 5.2. Counts are Radiance-era lists unless stated.

- **`ok` (32 legends):** OGN-247 Kai'Sa, OGN-253 Darius, OGN-259 Yasuo, OGN-265 Viktor, OGN-269 Sett, OGS-019 Master Yi, RAD-139 Ekko, RAD-141 Ziggs, RAD-143 Mordekaiser, RAD-145 Orianna, RAD-147 K'Sante, RAD-149 Riven, RAD-151 Seraphine, RAD-153 Evelynn, RAD-155 Jarvan IV, SFD-189 Ornn, SFD-195 Irelia, SFD-197 Azir, UNL-181 Jhin, UNL-183 Rengar, UNL-185 Pyke, UNL-187 Vi, UNL-189 Lillia, UNL-193 Vex, UNL-197 Diana, UNL-199 LeBlanc, UNL-201 Kha'Zix, UNL-203 Poppy, VEN-139 Akali, VEN-143 Zed, VEN-145 Nasus, VEN-155 Kennen.
- **`thin` (26 legends):** OGN-249 Volibear (11 RAD-era, 2 with provenance; 6 older), OGN-251 Jinx (10 RAD-era, 0 with provenance; 8 older), OGN-255 Ahri (10 RAD-era, 1 with provenance; 8 older), OGN-257 Lee Sin (10 RAD-era, 2 with provenance; 7 older), OGN-261 Leona (10 RAD-era, 1 with provenance; 6 older), OGN-263 Teemo (8 RAD-era, 1 with provenance; 6 older), OGN-267 Miss Fortune (10 RAD-era, 1 with provenance; 7 older), OGS-017 Annie (10 RAD-era, 0 with provenance; 7 older), OGS-021 Lux (7 RAD-era, 0 with provenance; 12 older), OGS-023 Garen (8 RAD-era, 0 with provenance; 8 older), SFD-181 Rumble (9 RAD-era, 1 with provenance; 8 older), SFD-183 Lucian (8 RAD-era, 1 with provenance; 11 older), SFD-185 Draven (8 RAD-era, 1 with provenance; 20 older), SFD-187 Rek'Sai (4 RAD-era, 4 with provenance; 17 older), SFD-193 Jax (9 RAD-era, 1 with provenance; 11 older), SFD-199 Ezreal (10 RAD-era, 1 with provenance; 18 older), SFD-201 Renata Glasc (8 RAD-era, 0 with provenance; 11 older), SFD-203 Sivir (9 RAD-era, 1 with provenance; 8 older), SFD-205 Fiora (9 RAD-era, 0 with provenance; 15 older), UNL-191 Master Yi (8 RAD-era, 1 with provenance; 8 older), UNL-195 Ivern (6 RAD-era, 2 with provenance; 11 older), VEN-141 Renekton (10 RAD-era, 1 with provenance; 5 older), VEN-147 Shen (10 RAD-era, 2 with provenance; 3 older), VEN-149 Jayce (4 RAD-era, 3 with provenance; 7 older), VEN-151 Mel (8 RAD-era, 2 with provenance; 5 older), VEN-153 Ambessa (7 RAD-era, 0 with provenance; 5 older).
- **`insufficient` (0):** none.
- **Advice basis:** 58 legends `radiance-lists`, 0 `pre-radiance-lists-only`, 0 `text-only`.
- **By what exists on Piltover Archive** (DATA, `pa-list-2026-11-11`): 31 legends are `scarce`, so a bigger fetch will not help them: OGS-021 Lux (4 lists, 0 event-named), OGS-023 Garen (5 lists, 0 event-named), OGN-253 Darius (8 lists, 2 event-named), SFD-197 Azir (8 lists, 2 event-named), SFD-201 Renata Glasc (8 lists, 0 event-named), SFD-203 Sivir (8 lists, 0 event-named), VEN-153 Ambessa (8 lists, 1 event-named), OGS-017 Annie (9 lists, 0 event-named), UNL-187 Vi (9 lists, 2 event-named), VEN-147 Shen (10 lists, 2 event-named), OGN-251 Jinx (11 lists, 0 event-named), UNL-191 Master Yi (11 lists, 2 event-named), OGN-257 Lee Sin (12 lists, 2 event-named), OGN-259 Yasuo (12 lists, 1 event-named), SFD-183 Lucian (12 lists, 2 event-named), UNL-203 Poppy (12 lists, 2 event-named), SFD-199 Ezreal (13 lists, 0 event-named), UNL-181 Jhin (13 lists, 2 event-named), SFD-181 Rumble (14 lists, 0 event-named), VEN-141 Renekton (14 lists, 1 event-named), SFD-193 Jax (15 lists, 1 event-named), VEN-151 Mel (15 lists, 2 event-named), OGN-267 Miss Fortune (16 lists, 1 event-named), OGN-261 Leona (18 lists, 1 event-named), SFD-185 Draven (18 lists, 0 event-named), UNL-195 Ivern (18 lists, 2 event-named), SFD-205 Fiora (20 lists, 0 event-named), OGN-263 Teemo (24 lists, 2 event-named), UNL-185 Pyke (24 lists, 2 event-named), OGN-255 Ahri (27 lists, 1 event-named), OGN-249 Volibear (28 lists, 1 event-named).
- **No official field data at all** (9 legends, i.e. the Radiance legends): RAD-139 Ekko, RAD-141 Ziggs, RAD-143 Mordekaiser, RAD-145 Orianna, RAD-147 K'Sante, RAD-149 Riven, RAD-151 Seraphine, RAD-153 Evelynn, RAD-155 Jarvan IV. Legends that exist in older tables but are absent from the last three: OGN-251 Jinx, OGN-253 Darius, OGN-259 Yasuo (UNCONFIRMED whether absent means zero pilots or an omitted row). Fewer than 30 Day 1 pilots over the last three tables, so no conversion rate (Day 1 pilots in brackets): OGN-249 Volibear (2), OGN-255 Ahri (1), OGN-257 Lee Sin (1), OGN-261 Leona (1), OGN-263 Teemo (7), OGN-267 Miss Fortune (5), OGN-269 Sett (8), OGS-017 Annie (9), OGS-021 Lux (29), OGS-023 Garen (1).
- **No podium in the riftbound.one archive:** 23 legends.
- **No result line in either riftbound.gg report** (28 legends): OGN-249 Volibear, OGN-251 Jinx, OGN-253 Darius, OGN-255 Ahri, OGN-259 Yasuo, OGN-261 Leona, OGS-017 Annie, OGS-023 Garen, RAD-139 Ekko, RAD-141 Ziggs, RAD-147 K'Sante, RAD-153 Evelynn, RAD-155 Jarvan IV, SFD-181 Rumble, SFD-185 Draven, SFD-193 Jax, SFD-201 Renata Glasc, SFD-203 Sivir, SFD-205 Fiora, UNL-181 Jhin, UNL-185 Pyke, UNL-187 Vi, UNL-195 Ivern, VEN-141 Renekton, VEN-143 Zed, VEN-147 Shen, VEN-151 Mel, VEN-153 Ambessa.
- **Not `ok` and no Radiance-era result line** (20 legends; Radiance-era lists in brackets): OGN-249 Volibear (11), OGN-251 Jinx (10), OGN-255 Ahri (10), OGN-257 Lee Sin (10), OGN-261 Leona (10), OGN-263 Teemo (8), OGS-017 Annie (10), OGS-021 Lux (7), OGS-023 Garen (8), SFD-181 Rumble (9), SFD-185 Draven (8), SFD-193 Jax (9), SFD-201 Renata Glasc (8), SFD-203 Sivir (9), SFD-205 Fiora (9), UNL-195 Ivern (6), VEN-141 Renekton (10), VEN-147 Shen (10), VEN-151 Mel (8), VEN-153 Ambessa (7). For these the app should say "not enough current tournament data for this legend" and show (a) the text half, (b) the few current lists with n, and (c) older lists labelled with their date range and the banned cards struck out.

HEURISTIC for the app: show data-driven statements without a warning only when `dataConfidence` is `ok`; show them with "from n lists" when `thin`; when `insufficient`, show only the text half plus, if `adviceBasis` is `pre-radiance-lists-only`, the older sample under a "before Radiance" heading. Always print n and the sample's era next to any rate. Never mix the two eras in one rate.


## 7. Overview tables (generated)

### 7.1 Text half (HEURISTIC axes and battlefield fit, from FACT text)

Role abbreviations: rew = rewards, nee = needs, ena = enables.

| Legend | Champion tag | Domains | Champs | Sig. | Top text axes (weight, role) | Best text-fit battlefields (not banned) |
|---|---|---|---|---|---|---|
| OGN-247 Daughter of the Void | Kai'Sa | Fury/Mind | 3 | 1 | spell-matters 1.00 rew; energy-ramp 0.60 ena | Void Gate (1.0), Ravenbloom Conservatory (1.0), The Academy (1.0) |
| OGN-249 Relentless Storm | Volibear | Fury/Body | 2 | 1 | mighty 1.00 rew; channel-rune 0.60 ena | Hall of Legends (0.6), Sunken Temple (0.5) |
| OGN-251 Loose Cannon | Jinx | Fury/Chaos | 2 | 1 | low-hand 1.00 rew; draw 0.60 ena | (none from text) |
| OGN-253 Hand of Noxus | Darius | Fury/Order | 2 | 1 | legion 1.00 rew; energy-ramp 0.60 ena | Hall of Legends (0.6), Threshold of the Gray (0.6) |
| OGN-255 Nine-Tailed Fox | Ahri | Calm/Mind | 3 | 1 | defend 1.00 rew; might-reduction 0.73 ena | Black Flame Altar (1.0), Kinkou Temple (1.0), Fortified Position (0.5) |
| OGN-257 Blind Monk | Lee Sin | Calm/Body | 2 | 1 | buff 0.80 ena | Monastery of Hirana (0.8), Hall of Legends (0.6) |
| OGN-259 Unforgiven | Yasuo | Calm/Chaos | 2 | 1 | movement 0.70 ena | Back-Alley Bar (0.7), Altar of Blood (0.7), Hall of Legends (0.6) |
| OGN-261 Radiant Dawn | Leona | Calm/Order | 2 | 1 | stun 1.00 rew; buff 0.60 ena | Monastery of Hirana (0.6) |
| OGN-263 Swift Scout | Teemo | Mind/Chaos | 2 | 1 | hidden 1.00 ena+nee; bounce-own 0.80 ena+nee | Bandle Tree (1.0), Emperor's Dais (0.8), Hall of Legends (0.6) |
| OGN-265 Herald of the Arcane | Viktor | Mind/Order | 2 | 1 | token 0.80 ena; tag:Recruit 0.60 ena | Hall of Legends (0.6) |
| OGN-267 Bounty Hunter | Miss Fortune | Body/Chaos | 2 | 1 | ganking 0.70 ena; movement 0.70 ena | Back-Alley Bar (0.7), Altar of Blood (0.7), Hall of Legends (0.6) |
| OGN-269 The Boss | Sett | Body/Order | 2 | 1 | buff 1.00 ena+rew; conquer 1.00 rew; protection 1.00 rew; movement 0.70 ena | Altar of Blood (1.2), Hall of Legends (1.1), Monastery of Hirana (1.0) |
| OGS-017 Dark Child - Starter | Annie | Fury/Chaos | 2 | 1 | ready-runes 0.60 ena | (none from text) |
| OGS-019 Wuju Bladesman - Starter | Master Yi | Calm/Body | 4 | 2 | defend 1.00 rew; defend-alone 1.00 rew | Black Flame Altar (1.0), Forbidding Waste (1.0), Kinkou Temple (1.0) |
| OGS-021 Lady of Luminosity - Starter | Lux | Mind/Order | 2 | 1 | expensive-spells 1.00 rew; spell-matters 1.00 rew; draw 0.60 ena | Void Gate (1.0), Ravenbloom Conservatory (1.0), Forgotten Library (1.0) |
| OGS-023 Might of Demacia - Starter | Garen | Body/Order | 2 | 1 | conquer 1.00 rew; wide 1.00 rew; draw 0.60 ena | Monastery of Hirana (0.5), Reckoner's Arena (0.5), Sigil of the Storm (0.5) |
| RAD-139 Boy Who Shattered Time | Ekko | Fury/Mind | 3 | 1 | empower 0.80 ena+nee; death 0.67 ena; cost-reduction 0.60 ena; self-sacrifice 0.60 ena | Risen Altar (0.8), Black Rose Sanctum (0.7), Hunters' Circle (0.6) |
| RAD-141 Hexplosives Expert | Ziggs | Fury/Chaos | 2 | 1 | gear-token 0.80 ena; tag:Bomb 0.60 ena | Hall of Legends (0.6) |
| RAD-143 Iron Revenant | Mordekaiser | Fury/Order | 2 | 1 | gear 1.00 nee+rew; unit 1.00 rew; banish 0.80 nee; trash 0.80 nee | Firelights' Hideout (1.0), Rakelstake (1.0), Veiled Temple (1.0) |
| RAD-145 Lady of Clockwork | Orianna | Calm/Mind | 2 | 1 | gear 1.00 ena+nee+rew; unit-gear 0.60 ena | Veiled Temple (1.0), Hunters' Circle (0.5), Rakelstake (0.5) |
| RAD-147 Pride of Nazumah | K'Sante | Calm/Body | 2 | 1 | defend 1.00 ena+rew; shield 1.00 ena+rew; assault 0.60 ena | Black Flame Altar (2.0), Fortified Position (1.0), Kinkou Temple (1.0) |
| RAD-149 The Exile | Riven | Calm/Chaos | 3 | 1 | unit 1.00 rew; ready 0.67 ena | Firelights' Hideout (1.0), Rakelstake (0.5) |
| RAD-151 Starry-Eyed Songstress | Seraphine | Mind/Order | 2 | 1 | spell-matters 1.00 ena+rew; wide 0.80 nee; cost-reduction 0.60 ena | Void Gate (1.0), Ravenbloom Conservatory (1.0), The Academy (1.0) |
| RAD-153 Agony's Embrace | Evelynn | Body/Chaos | 3 | 1 | hidden 1.00 rew; play-from-elsewhere 1.00 rew; discard 0.60 ena; draw 0.60 ena | Bandle Tree (1.0), Bandle Scouts' Academy (0.5) |
| RAD-155 Exemplar of Demacia | Jarvan IV | Body/Order | 2 | 1 | deploy 1.00 rew; gear 1.00 rew; movement 0.70 ena | Veiled Temple (1.0), Back-Alley Bar (0.7), Altar of Blood (0.7) |
| SFD-181 Mechanized Menace | Rumble | Fury/Mind | 2 | 1 | tag:Mech 1.00 rew; defend 0.60 ena; shield 0.60 ena | Fortified Position (1.2), Durand Memorial (0.6), Ravenbloom Conservatory (0.6) |
| SFD-183 Purifier | Lucian | Fury/Body | 2 | 1 | equipment 1.00 rew; assault 0.70 ena | Veiled Temple (1.0), Forge of the Fluft (0.5) |
| SFD-185 Glorious Executioner | Draven | Fury/Chaos | 3 | 1 | combat-win 1.00 rew; draw 0.60 ena | (none from text) |
| SFD-187 Void Burrower | Rek'Sai | Fury/Order | 2 | 1 | conquer 1.00 rew; play-from-elsewhere 0.80 ena | Hall of Legends (1.1), Monastery of Hirana (0.5), Reckoner's Arena (0.5) |
| SFD-189 Fire Below the Mountain | Ornn | Calm/Mind | 2 | 3 | gear 1.00 rew; energy-ramp 0.60 ena | Veiled Temple (1.0), Hall of Legends (0.6), Threshold of the Gray (0.6) |
| SFD-193 Grandmaster at Arms | Jax | Calm/Body | 2 | 1 | equipment 1.00 ena+nee | Veiled Temple (1.0), Hall of Legends (0.6), Forge of the Fluft (0.5) |
| SFD-195 Blade Dancer | Irelia | Calm/Chaos | 2 | 1 | choose-friendly 1.00 rew; conquer 1.00 rew; ready 0.60 ena | Hall of Legends (1.1), Monastery of Hirana (0.5), Reckoner's Arena (0.5) |
| SFD-197 Emperor of the Sands | Azir | Calm/Order | 2 | 1 | equipment 1.00 ena+rew; tag:Sand Soldier 1.00 rew; token 0.70 ena | Veiled Temple (1.0), Hall of Legends (0.6), Forge of the Fluft (0.5) |
| SFD-199 Prodigal Explorer | Ezreal | Mind/Chaos | 2 | 1 | choose-enemy 1.00 rew; spell-matters 1.00 rew; draw 0.70 ena | Void Gate (1.0), Ravenbloom Conservatory (1.0), The Academy (1.0) |
| SFD-201 Chem-Baroness | Renata Glasc | Mind/Order | 2 | 1 | hold 1.00 rew; score-race 1.00 rew; energy-ramp 0.60 ena; gear-token 0.60 ena | Hall of Legends (0.6), Threshold of the Gray (0.6), Altar to Unity (0.5) |
| SFD-203 Battle Mistress | Sivir | Body/Chaos | 2 | 1 | death 1.00 rew; recycle 1.00 rew; gear-token 0.60 ena; gold 0.60 ena | Sigil of the Storm (1.0), Dusk Rose Lab (1.0), Hall of Legends (0.6) |
| SFD-205 Grand Duelist | Fiora | Body/Order | 3 | 1 | mighty 1.00 rew; channel-rune 0.60 ena | Hall of Legends (0.6), Sunken Temple (0.5) |
| UNL-181 Virtuoso | Jhin | Fury/Mind | 2 | 1 | expensive-spells 1.00 rew; spell-matters 1.00 ena+rew; draw 0.70 ena; banish 0.60 ena | Void Gate (1.0), Ravenbloom Conservatory (1.0), Forgotten Library (1.0) |
| UNL-183 Pridestalker | Rengar | Fury/Body | 3 | 1 | unit 1.00 rew | Firelights' Hideout (1.0), Rakelstake (0.5) |
| UNL-185 Bloodharbor Ripper | Pyke | Fury/Chaos | 2 | 1 | gear-token 0.70 ena; gold 0.70 ena; bounce-own 0.60 ena | Hall of Legends (0.6) |
| UNL-187 Piltover Enforcer | Vi | Fury/Order | 4 | 1 | conquer 1.00 rew; excess-damage 1.00 rew; ready 0.60 ena | Hall of Legends (1.1), Trapping Grounds (1.0), Monastery of Hirana (0.5) |
| UNL-189 Bashful Bloom | Lillia | Calm/Mind | 2 | 1 | temporary 1.00 ena+rew; wide 1.00 ena+rew; token 0.70 ena; cost-reduction 0.60 ena | Black Flame Altar (1.0), Hunters' Circle (0.6), Hall of Legends (0.6) |
| UNL-191 Wuju Master | Master Yi | Calm/Body | 4 | 2 | level 1.00 rew; ready 0.65 ena | Gardens of Becoming (1.0) |
| UNL-193 Gloomist | Vex | Calm/Chaos | 3 | 1 | hold 1.00 rew; draw 0.60 ena | Hall of Legends (0.6), Altar to Unity (0.5), Grove of the God-Willow (0.5) |
| UNL-195 Green Father | Ivern | Calm/Order | 2 | 1 | conquer 1.00 rew; hold 1.00 rew; tag:Bird 0.60 ena; tag:Cat 0.60 ena | Hall of Legends (1.1), Reckoner's Arena (1.0), Altar to Unity (0.5) |
| UNL-197 Scorn of the Moon | Diana | Mind/Chaos | 2 | 1 | showdown 1.00 rew; energy-ramp 0.60 ena | Mystic Vortex (1.0), Hall of Legends (0.6), Threshold of the Gray (0.6) |
| UNL-199 Deceiver | LeBlanc | Mind/Order | 2 | 1 | conquer 1.00 rew; hold 1.00 rew; discard 0.80 nee; temporary 0.80 ena | Zaun Warrens (1.3), Ruined Monastery (1.3), Hall of Legends (1.1) |
| UNL-201 Voidreaver | Kha'Zix | Body/Chaos | 2 | 1 | combat-win 1.00 rew; level 1.00 ena+nee; movement 0.70 ena; buff 0.60 ena | Gardens of Becoming (1.0), Back-Alley Bar (0.7), Altar of Blood (0.7) |
| UNL-203 Keeper of the Hammer | Poppy | Body/Order | 2 | 1 | hold 1.00 rew; level 1.00 ena+nee; draw 0.60 ena | Gardens of Becoming (1.0), Hall of Legends (0.6), Altar to Unity (0.5) |
| VEN-139 Rogue Assassin | Akali | Fury/Calm | 3 | 1 | movement 0.90 ena; empower 0.67 ena; ready 0.60 ena; showdown 0.60 ena | Back-Alley Bar (0.9), Altar of Blood (0.9), Hall of Legends (0.6) |
| VEN-141 Butcher of the Sands | Renekton | Fury/Body | 2 | 1 | activated-abilities 1.00 rew; unit 1.00 rew; energy-ramp 0.60 ena | Firelights' Hideout (1.0), Hall of Legends (0.6), Threshold of the Gray (0.6) |
| VEN-143 Master of Shadows | Zed | Fury/Chaos | 2 | 1 | banish 1.00 rew; empower 0.80 ena+nee; discard 0.70 ena; draw 0.60 ena | Risen Altar (0.8), Hall of Legends (0.6) |
| VEN-145 Curator of the Sands | Nasus | Calm/Mind | 2 | 1 | expensive-permanents 1.00 rew; ready-runes 0.60 ena | Hall of Legends (0.6) |
| VEN-147 Eye of Twilight | Shen | Calm/Order | 3 | 1 | defend 0.73 ena; tank 0.67 ena | Durand Memorial (1.4), Fortified Position (0.7), Ravenbloom Conservatory (0.7) |
| VEN-149 Defender of Tomorrow | Jayce | Mind/Body | 3 | 1 | empower 1.00 ena+rew; gear 1.00 ena+nee | Veiled Temple (1.0), Risen Altar (1.0), Hall of Legends (0.6) |
| VEN-151 Soul's Reflection | Mel | Mind/Chaos | 2 | 1 | empower 1.00 ena+nee+rew; might-reduction 0.70 ena | Risen Altar (1.0), Hall of Legends (0.6) |
| VEN-153 Matriarch of War | Ambessa | Body/Order | 2 | 1 | empower 1.00 ena+nee+rew; ready 0.60 ena | Risen Altar (1.0), Hall of Legends (0.6) |
| VEN-155 Heart of the Tempest | Kennen | Order/Chaos | 2 | 1 | play-from-elsewhere 1.00 rew; empower 0.80 ena+nee; assault 0.60 ena | Risen Altar (0.8), Hall of Legends (0.6) |

### 7.2 Data half (DATA)

Columns: lists since Radiance in `pa-list-2026-11-11`; official Regional Qualifier field over the last three tables (Barcelona, Singapore, Los Angeles; before Radiance); riftbound.one podiums; riftbound.gg week-2 tier, wins, top cuts; Europe Regional Championship win rate and matches; pooled Radiance-era lists and how many have tournament provenance; pooled older lists.

| Legend | PA lists since RAD (rank, share) | Official RQ field, last 3 events: Day 1 pilots (share); Day 2 conversion | riftbound.one podiums 1st/2nd/3rd: all (RAD era) | Tier / wins / top cuts | EU RC win rate (matches) | RAD-era lists (with provenance) | Pre-RAD lists | Confidence, basis | Typical Chosen Champion (RAD era) | Typical rune split (RAD era) |
|---|---|---|---|---|---|---|---|---|---|---|
| OGN-247 Kai'Sa | 49 (#6, 3.4%) | 38 (0.6%); 13% vs field 18% | 3/10/5 (0/2/1) | 1 / 0 / 12 | 49% (300) | 18 (18) | 15 | ok, radiance-lists | Kai'Sa, Survivor 18/18 | 7 Fury / 5 Mind 15/18 |
| OGN-249 Volibear | 28 (#19, 1.9%) | 2 (0.0%); n<30 | 0/0/0 (0/0/0) | not listed | not listed | 11 (2) | 6 | thin, radiance-lists | Volibear, Furious 11/11 | 6 Fury / 6 Body 6/11 |
| OGN-251 Jinx | 11 (#47, 0.8%) | not in the last 3 tables | 0/0/1 (0/0/0) | not listed | not listed | 10 (0) | 8 | thin, radiance-lists | Jinx, Demolitionist 5/10 | 6 Fury / 6 Chaos 5/10 |
| OGN-253 Darius | 8 (#52, 0.5%) | not in the last 3 tables | 0/0/0 (0/0/0) | not listed | not listed | 9 (3) | 10 | ok, radiance-lists | Darius, Trifarian 8/9 | 6 Fury / 6 Order 5/9 |
| OGN-255 Ahri | 27 (#20, 1.9%) | 1 (0.0%); n<30 | 0/0/0 (0/0/0) | not listed | not listed | 10 (1) | 8 | thin, radiance-lists | Ahri, Confident 6/10 | 6 Calm / 6 Mind 7/10 |
| OGN-257 Lee Sin | 12 (#43, 0.8%) | 1 (0.0%); n<30 | 0/0/0 (0/0/0) | not listed | <=10 matches | 10 (2) | 7 | thin, radiance-lists | Lee Sin, Centered 8/10 | 7 Body / 5 Calm 4/10 |
| OGN-259 Yasuo | 12 (#44, 0.8%) | not in the last 3 tables | 0/0/1 (0/0/1) | not listed | not listed | 11 (3) | 7 | ok, radiance-lists | Yasuo, Windrider 11/11 | 6 Calm / 6 Chaos 9/11 |
| OGN-261 Leona | 18 (#29, 1.2%) | 1 (0.0%); n<30 | 0/0/0 (0/0/0) | not listed | not listed | 10 (1) | 6 | thin, radiance-lists | Leona, Zealot 7/10 | 6 Calm / 6 Order 7/10 |
| OGN-263 Teemo | 24 (#22, 1.7%) | 7 (0.1%); n<30 | 0/0/0 (0/0/0) | not listed | <=10 matches | 8 (1) | 6 | thin, radiance-lists | Teemo, Strategist 7/8 | 6 Mind / 6 Chaos 5/8 |
| OGN-265 Viktor | 26 (#21, 1.8%) | 56 (0.9%); 11% vs field 18% | 6/5/9 (1/0/0) | 3 / 0 / 1 | 32% (25) | 9 (8) | 16 | ok, radiance-lists | Viktor, Leader 9/9 | 7 Order / 5 Mind 6/9 |
| OGN-267 Miss Fortune | 16 (#34, 1.1%) | 5 (0.1%); n<30 | 2/1/3 (0/0/0) | 4 / 0 / 0 | not listed | 10 (1) | 7 | thin, radiance-lists | Miss Fortune, Captain 7/10 | 6 Body / 6 Chaos 5/10 |
| OGN-269 Sett | 32 (#14, 2.2%) | 8 (0.1%); n<30 | 5/0/3 (0/0/0) | 3 / 0 / 4 | 61% (18) | 12 (6) | 5 | ok, radiance-lists | Sett, Kingpin 10/12 | 7 Body / 5 Order 6/12 |
| OGS-017 Annie | 9 (#50, 0.6%) | 9 (0.1%); n<30 | 6/5/4 (0/0/0) | not listed | not listed | 10 (0) | 7 | thin, radiance-lists | Annie, Stubborn 6/10 | 6 Fury / 6 Chaos 4/10 |
| OGS-019 Master Yi | 19 (#28, 1.3%) | 398 (6.7%); 22% vs field 18% | 32/22/33 (0/0/1) | 2 / 2 / 5 (shared with UNL-191) | 46% (106) (shared with UNL-191) | 12 (6) | 82 | ok, radiance-lists | Master Yi, Tempered 12/12 | 7 Body / 5 Calm 11/12 |
| OGS-021 Lux | 4 (#58, 0.3%) | 29 (0.5%); n<30 | 2/0/2 (0/0/0) | not listed | <=10 matches | 7 (0) | 12 | thin, radiance-lists | Lux, Crownguard 7/7 | 6 Mind / 6 Order 6/7 |
| OGS-023 Garen | 5 (#57, 0.4%) | 1 (0.0%); n<30 | 0/0/0 (0/0/0) | not listed | not listed | 8 (0) | 8 | thin, radiance-lists | Garen, Commander 5/8 | 6 Body / 6 Order 2/8 |
| RAD-139 Ekko | 59 (#5, 4.1%) | not in any table | 0/0/0 (0/0/0) | not listed | not listed | 7 (5) | 0 | ok, radiance-lists | Ekko, Ingenious 5/7 | 6 Fury / 6 Mind 4/7 |
| RAD-141 Ziggs | 40 (#8, 2.8%) | not in any table | 0/0/0 (0/0/0) | not listed | not listed | 8 (6) | 0 | ok, radiance-lists | Ziggs, Explosive 5/7 | 6 Fury / 6 Chaos 3/8 |
| RAD-143 Mordekaiser | 77 (#2, 5.3%) | not in any table | 0/0/0 (0/0/0) | not listed | <=10 matches | 12 (10) | 0 | ok, radiance-lists | Mordekaiser, Dominating 11/12 | 7 Fury / 5 Order 4/12 |
| RAD-145 Orianna | 70 (#4, 4.9%) | not in any table | 0/0/0 (0/0/0) | 4 / 0 / 2 | 50% (24) | 10 (10) | 0 | ok, radiance-lists | Orianna, Exquisite 8/10 | 7 Calm / 5 Mind 4/10 |
| RAD-147 K'Sante | 36 (#11, 2.5%) | not in any table | 0/0/0 (0/0/0) | not listed | not listed | 11 (7) | 0 | ok, radiance-lists | K'Sante, Dauntless 6/11 | 6 Calm / 6 Body 8/11 |
| RAD-149 Riven | 76 (#3, 5.3%) | not in any table | 5/2/1 (5/2/1) | S / 5 / 16 | 54% (524) | 26 (26) | 0 | ok, radiance-lists | Riven, Broken Blade 25/26 | 7 Chaos / 5 Calm 13/26 |
| RAD-151 Seraphine | 40 (#9, 2.8%) | not in any table | 0/0/0 (0/0/0) | 4 / 0 / 0 | not listed | 9 (5) | 0 | ok, radiance-lists | Seraphine, Not Alone 6/9 | 7 Order / 5 Mind 4/9 |
| RAD-153 Evelynn | 100 (#1, 6.9%) | not in any table | 0/0/0 (0/0/0) | not listed | not listed | 10 (10) | 0 | ok, radiance-lists | Evelynn, Entrancing 9/10 | 6 Body / 6 Chaos 5/10 |
| RAD-155 Jarvan IV | 36 (#12, 2.5%) | not in any table | 0/0/0 (0/0/0) | not listed | not listed | 10 (4) | 0 | ok, radiance-lists | Jarvan IV, Martial Paragon 8/10 | 7 Body / 5 Order 4/10 |
| SFD-181 Rumble | 14 (#38, 1.0%) | 77 (1.3%); 5% vs field 18% | 0/0/0 (0/0/0) | not listed | not listed | 9 (1) | 8 | thin, radiance-lists | Rumble, Hotheaded 8/9 | 8 Fury / 4 Mind 3/9 |
| SFD-183 Lucian | 12 (#45, 0.8%) | 88 (1.5%); 12% vs field 18% | 0/1/0 (0/0/0) | not listed | 38% (16) | 8 (1) | 11 | thin, radiance-lists | Lucian, Merciless 8/8 | 6 Fury / 6 Body 5/8 |
| SFD-185 Draven | 18 (#30, 1.2%) | 181 (3.0%); 10% vs field 18% | 6/6/7 (0/0/0) | not listed | not listed | 8 (1) | 20 | thin, radiance-lists | Draven, Showboat 7/8 | 6 Fury / 6 Chaos 6/8 |
| SFD-187 Rek'Sai | 37 (#10, 2.6%) | 252 (4.2%); 18% vs field 18% | 4/4/4 (0/0/0) | 3 / 0 / 4 | 53% (85) | 4 (4) | 17 | thin, radiance-lists | Rek'Sai, Breacher 4/4 | 6 Fury / 6 Order 2/4 |
| SFD-189 Ornn | 15 (#35, 1.0%) | 140 (2.3%); 16% vs field 18% | 1/0/2 (0/0/0) | not listed | 50% (12) | 9 (4) | 9 | ok, radiance-lists | Ornn, Blacksmith 8/9 | 7 Calm / 5 Mind 3/9 |
| SFD-193 Jax | 15 (#36, 1.0%) | 68 (1.1%); 6% vs field 18% | 0/0/1 (0/0/0) | not listed | not listed | 9 (1) | 11 | thin, radiance-lists | Jax, Unmatched 9/9 | 6 Calm / 6 Body 5/9 |
| SFD-195 Irelia | 20 (#26, 1.4%) | 500 (8.3%); 21% vs field 18% | 24/25/18 (0/2/0) | 2 / 1 / 2 | 38% (45) | 9 (7) | 50 | ok, radiance-lists | Irelia, Fervent 7/8 | 6 Calm / 6 Chaos 8/9 |
| SFD-197 Azir | 8 (#53, 0.5%) | 250 (4.2%); 24% vs field 18% | 9/9/7 (0/0/0) | 4 / 0 / 2 | 50% (16) | 8 (3) | 16 | ok, radiance-lists | Azir, Sovereign 7/7 | 7 Calm / 5 Order 7/8 |
| SFD-199 Ezreal | 13 (#41, 0.9%) | 150 (2.5%); 23% vs field 18% | 8/5/4 (0/0/0) | 3 / 0 / 0 | <=10 matches | 10 (1) | 18 | thin, radiance-lists | Ezreal, Prodigy 10/10 | 6 Mind / 6 Chaos 5/10 |
| SFD-201 Renata Glasc | 8 (#54, 0.5%) | 60 (1.0%); 0% vs field 18% | 0/0/0 (0/0/0) | not listed | not listed | 8 (0) | 11 | thin, radiance-lists | Renata Glasc, Mastermind 7/8 | 7 Mind / 5 Order 3/8 |
| SFD-203 Sivir | 8 (#55, 0.5%) | 53 (0.9%); 13% vs field 18% | 5/5/4 (0/0/0) | not listed | not listed | 9 (1) | 8 | thin, radiance-lists | Sivir, Mercenary 9/9 | 6 Body / 6 Chaos 7/9 |
| SFD-205 Fiora | 20 (#27, 1.4%) | 140 (2.3%); 12% vs field 18% | 7/6/9 (0/0/0) | not listed | not listed | 9 (0) | 15 | thin, radiance-lists | Fiora, Victorious 5/9 | 6 Body / 6 Order 5/9 |
| UNL-181 Jhin | 13 (#42, 0.9%) | 56 (0.9%); 9% vs field 18% | 0/0/0 (0/0/0) | not listed | not listed | 9 (3) | 7 | ok, radiance-lists | Jhin, Meticulous Killer 8/9 | 7 Mind / 5 Fury 6/9 |
| UNL-183 Rengar | 14 (#39, 1.0%) | 305 (5.1%); 23% vs field 18% | 5/6/5 (0/0/0) | 2 / 0 / 3 | 45% (29) | 7 (4) | 12 | ok, radiance-lists | Rengar, Trophy Hunter 7/7 | 8 Body / 4 Fury 6/7 |
| UNL-185 Pyke | 24 (#23, 1.7%) | 92 (1.5%); 5% vs field 18% | 0/0/1 (0/0/0) | not listed | not listed | 8 (3) | 10 | ok, radiance-lists | Pyke, Dockside Butcher 5/8 | 6 Fury / 6 Chaos 4/8 |
| UNL-187 Vi | 9 (#51, 0.6%) | 105 (1.8%); 0% vs field 18% | 0/0/0 (0/0/0) | not listed | not listed | 11 (6) | 6 | ok, radiance-lists | Vi, Peacekeeper 7/10 | 7 Fury / 5 Order 6/11 |
| UNL-189 Lillia | 18 (#31, 1.2%) | 152 (2.5%); 14% vs field 18% | 3/3/3 (0/0/0) | 4 / 0 / 1 | <=10 matches | 6 (4) | 12 | ok, radiance-lists | Lillia, Fae Fawn 6/6 | 6 Calm / 6 Mind 5/6 |
| UNL-191 Master Yi | 11 (#48, 0.8%) | 77 (1.3%); 6% vs field 18% | 0/1/1 (0/0/0) | 2 / 2 / 5 (shared with OGS-019) | 46% (106) (shared with OGS-019) | 8 (1) | 8 | thin, radiance-lists | Master Yi, Tempered 5/6 | 6 Calm / 6 Body 5/8 |
| UNL-193 Vex | 29 (#17, 2.0%) | 165 (2.8%); 19% vs field 18% | 4/7/7 (0/0/0) | 2 / 1 / 6 | 36% (11) | 9 (6) | 12 | ok, radiance-lists | Vex, Apathetic 9/9 | 7 Chaos / 5 Calm 5/9 |
| UNL-195 Ivern | 18 (#32, 1.2%) | 81 (1.4%); 4% vs field 18% | 0/0/0 (0/0/0) | not listed | not listed | 6 (2) | 11 | thin, radiance-lists | Ivern, Nurturer 5/6 | 7 Calm / 5 Order 3/6 |
| UNL-197 Diana | 22 (#24, 1.5%) | 190 (3.2%); 19% vs field 18% | 20/25/14 (0/0/1) | not listed | <=10 matches | 10 (5) | 17 | ok, radiance-lists | Diana, Lunari 10/10 | 6 Mind / 6 Chaos 7/10 |
| UNL-199 LeBlanc | 17 (#33, 1.2%) | 298 (5.0%); 24% vs field 18% | 11/8/10 (0/0/0) | 3 / 0 / 1 | 36% (28) | 10 (7) | 9 | ok, radiance-lists | LeBlanc, Fragmented 10/10 | 8 Order / 4 Mind 7/10 |
| UNL-201 Kha'Zix | 31 (#15, 2.1%) | 190 (3.2%); 22% vs field 18% | 0/2/3 (0/0/0) | 3 / 0 / 0 | 55% (11) | 7 (7) | 8 | ok, radiance-lists | Kha'Zix, Mutating Horror 7/7 | 6 Body / 6 Chaos 7/7 |
| UNL-203 Poppy | 12 (#46, 0.8%) | 51 (0.9%); 6% vs field 18% | 0/1/1 (0/0/0) | not listed | <=10 matches | 8 (3) | 6 | ok, radiance-lists | Poppy, Paragon 8/8 | 6 Body / 6 Order 3/8 |
| VEN-139 Akali | 33 (#13, 2.3%) | 220 (3.7%); 12% vs field 18% | 4/1/0 (1/0/0) | 2 / 0 / 2 | 44% (16) | 10 (8) | 5 | ok, radiance-lists | Akali, Deadly Weapon 10/10 | 7 Fury / 5 Calm 6/10 |
| VEN-141 Renekton | 14 (#40, 1.0%) | 50 (0.8%); 2% vs field 18% | 0/0/1 (0/0/0) | not listed | not listed | 10 (1) | 5 | thin, radiance-lists | Renekton, Rage Fueled 9/10 | 6 Fury / 6 Body 5/10 |
| VEN-143 Zed | 31 (#16, 2.1%) | 78 (1.3%); 3% vs field 18% | 0/0/0 (0/0/0) | not listed | not listed | 9 (3) | 4 | ok, radiance-lists | Zed, Without a Sound 5/9 | 7 Fury / 5 Chaos 3/9 |
| VEN-145 Nasus | 21 (#25, 1.5%) | 207 (3.5%); 11% vs field 18% | 3/1/0 (0/0/0) | 4 / 0 / 1 | 53% (17) | 8 (3) | 9 | ok, radiance-lists | Nasus, Ascended 6/8 | 7 Mind / 5 Calm 4/8 |
| VEN-147 Shen | 10 (#49, 0.7%) | 65 (1.1%); 0% vs field 18% | 0/0/0 (0/0/0) | not listed | not listed | 10 (2) | 3 | thin, radiance-lists | Shen, Kinkou 9/10 | 6 Calm / 6 Order 6/10 |
| VEN-149 Jayce | 29 (#18, 2.0%) | 282 (4.7%); 23% vs field 18% | 1/2/1 (0/0/0) | 2 / 1 / 1 | 68% (47) | 4 (3) | 7 | thin, radiance-lists | Jayce, Brilliant Inventor 4/4 | 7 Body / 5 Mind 3/4 |
| VEN-151 Mel | 15 (#37, 1.0%) | 56 (0.9%); 5% vs field 18% | 0/0/2 (0/0/0) | not listed | not listed | 8 (2) | 5 | thin, radiance-lists | Mel, Defiant Soul 5/8 | 7 Mind / 5 Chaos 4/8 |
| VEN-153 Ambessa | 8 (#56, 0.5%) | 97 (1.6%); 4% vs field 18% | 0/0/0 (0/0/0) | not listed | not listed | 7 (0) | 5 | thin, radiance-lists | Ambessa, The Wolf 5/6 | 7 Body / 5 Order 3/7 |
| VEN-155 Kennen | 41 (#7, 2.8%) | 653 (10.9%); 31% vs field 18% | 6/13/9 (1/0/1) | 1 / 0 / 10 | 50% (237) | 14 (14) | 31 | ok, radiance-lists | Kennen, Storm of Shuriken 13/14 | 9 Chaos / 3 Order 9/14 |

## 8. JSON output shape (proposal)

Two files, joined on `legendCode` (the base printing code; `printingCodes` lists every alias so that deck sites' codes such as `RAD-173` or `OGN-299*` resolve). Keeping them apart lets the card sync rebuild the text half without touching meta data and the meta sync rebuild the data half without touching card logic.

```ts
// legend-profiles.text.json  (rebuilt whenever card data changes)
interface TextFile {
  schemaVersion: 1;
  inputs: { cardsJsonBuiltAt: string; galleryFetchedAt: string | null; gallerySetsAdded: string[];
            galleryCardsAdded: number; cardsWithChangedText: number; bansFlagged: string[] };
  weights: Record<string, number>;            // the constants of section 4.3
  axes: { axis: string; label: string }[];    // vocabulary
  legends: LegendText[];
}
interface LegendText {
  legendCode: string; printingCodes: string[]; name: string; set: string; source: string;
  championTag: string; tags: string[]; domains: string[];
  rulesText: string;                 // verbatim
  rulesTextCurrent: string | null;   // newer official text if it differs
  abilities: { text: string; kind: 'activated' | 'triggered' | 'static' | 'replacement'; timing: 'action' | 'reaction' | null;
               gate: string[]; cost: string[]; condition: string; effect: string; restriction: string; reminder: string[] }[];
  usesExhaust: boolean;
  rewards: AxisQuote[]; needs: AxisQuote[]; enables: AxisQuote[];
  champions: CardRef[];              // + rulesText, tags, set, source, bannedFrom?
  championsOutsideIdentity: CardRef[];
  signatureCards: CardRef[];         // + rulesText
  otherLegendsSameChampion: string[];
  themeAxes: { axis: string; label: string; weight: number;           // 0..1
               roles: ('rewards' | 'needs' | 'enables')[];
               championShare: number; signatureShare: number;
               evidence: { role: string; source: string; match: string; text: string }[];
               poolSupport: { count: number; cardCodes: string[] } }[];
  battlefields: { cardCode: string; name: string; score: number; bannedFrom?: string;
                  reasons: { axis: string; label: string; fit: string; complementary?: boolean;
                             legendText: string; battlefieldText: string }[] }[];
  identityPool: { unit: number; spell: number; gear: number };
  engineScript: { source: string; flagged: boolean; abilities: { kind: string; trigger?: string; timing?: string }[] } | null;
  textConfidence: 'parsed' | 'unparsed';
}
interface AxisQuote { axis: string; label: string; text: string }
interface CardRef { cardCode: string; name: string; type: string; energy: number | null; power: number | null;
                    might: number | null; domains: string[]; bannedFrom?: string }

// legend-profiles.meta.json  (rebuilt on every meta sync)
interface MetaFile {
  schemaVersion: 2;
  datasets: Record<string, { source: string; note: string; [k: string]: unknown }>;
  pooling: { completeLists: number; duplicatesDropped: number; pooledLists: number;
             radianceEra: number; preRadiance: number; eraRule: string };
  thresholds: Record<string, number>;
  unresolvedDeckEntries: Record<string, number>;
  legends: LegendMeta[];
}
interface LegendMeta {
  legendCode: string; name: string; tags: string[];
  dataConfidence: 'ok' | 'thin' | 'insufficient'; dataConfidenceReasons: string[];
  adviceBasis: 'radiance-lists' | 'pre-radiance-lists-only' | 'text-only';
  dataAvailability: 'enough' | 'scarce';
  popularity: { dataset: string; lists: number; listsSinceRadiance: number; eventNamedListsSinceRadiance: number;
                shareSinceRadiance: number | null; rankSinceRadiance: number | null; viewsSum: number };
  officialField: { dataset: string; events: FieldRow[];
                   recent: { events: string[]; day1: number; day2: number; day1Share: number | null; day2Share: number | null;
                             day2Conversion: number | null; fieldDay2Conversion: number | null;
                             enoughForConversion: boolean } | null } | null;
  podiums: { dataset: string; all: Podium; radianceEra: Podium };
  results: { tierList?: { tier: string; wins: number; topCuts: number };
             euRegional?: { winRatePct: number | null; matches: number | null; finish?: string; day1FieldSharePct?: number };
             sharedWithLegends: string[] } | null;
  asAdditionalLegend: { dataset: string; decks: number; note: string };
  samples: { radiance: SampleSummary | null; preRadiance: SampleSummary | null };
}
interface FieldRow { event: string; publishedAt: string; day1: number | null; day2: number | null; day1Share: number | null;
                     day2Share: number | null; day2Conversion: number | null; fieldDay2Conversion: number | null }
interface Podium { first: number; second: number; third: number }
interface SampleSummary {
  n: number; nEventMarker: number; nComplete: number;
  sources: Record<string, number>;               // dataset id -> lists
  newestSetInList: Record<string, number>;       // set code -> lists
  nWithCurrentlyBannedCard: number;
  podiums: Podium & { dataset: string };
  archetypeLabels: { dataset: string; nLabelled: number; labels: { label: string; decks: number }[] };
  chosenChampions: { cardCode: string; name: string; decks: number; share: number }[]; nChosenChampionKnown: number;
  runeSplits: { split: string; decks: number; share: number }[];
  battlefields: Rate[]; nWithBattlefields: number;
  coreCards: Rate[]; flexCards: Rate[]; topCards: Rate[];
  sideDeck: Rate[]; nWithSideDeck: number;
  avgMainTypeCounts: Record<string, number>;
  variants: { chosenChampion: string; name: string; decks: number; share: number;
              distinctiveCards: { cardCode: string; name: string; rateHere: number; rateElsewhere: number }[]; deckIds: string[] }[];
  decks: { id: string; dataset: string; name: string; url: string; eventMarker: boolean; placement: 1 | 2 | 3 | null;
           createdAt: string | null; newestSet: string | null; bannedCards: string[] }[];
}
interface Rate { cardCode: string; name: string; decks: number; inclusionRate: number; avgCopiesWhenPlayed: number;
                 type?: string; bannedFrom?: string }
```

Real excerpt (OGN-261 Radiant Dawn, lists truncated with "..."), file `data/md/example.json`:

```json
{
 "text": {
  "legendCode": "OGN-261",
  "printingCodes": [
   "OGN-261",
   "OGN-306",
   "OGN-306*",
   "OGN-306s",
   "OPP-261"
  ],
  "name": "Radiant Dawn",
  "set": "OGN",
  "source": "cards.json@2026-09-06",
  "championTag": "Leona",
  "tags": [
   "Leona"
  ],
  "domains": [
   "calm",
   "order"
  ],
  "rulesText": "When you stun one or more enemy units, buff a friendly unit. (If it doesn't have a buff, it gets a +1 [Might] buff.)",
  "rulesTextCurrent": null,
  "abilities": [
   {
    "text": "When you stun one or more enemy units, buff a friendly unit. (If it doesn't have a buff, it gets a +1 [Might] buff.)",
    "kind": "triggered",
    "timing": null,
    "gate": [],
    "cost": [],
    "condition": "When you stun one or more enemy units",
    "effect": "buff a friendly unit.",
    "restriction": "",
    "reminder": [
     "If it doesn't have a buff, it gets a +1 [Might] buff."
    ]
   }
  ],
  "usesExhaust": false,
  "rewards": [
   {
    "axis": "stun",
    "label": "Stun",
    "text": "When you stun one or more enemy units"
   }
  ],
  "needs": [],
  "enables": [
   {
    "axis": "buff",
    "label": "Buffs",
    "text": "buff a friendly unit."
   }
  ],
  "champions": [
   {
    "cardCode": "OGN-238",
    "name": "Leona, Determined",
    "type": "unit",
    "energy": 4,
    "power": 1,
    "might": 4,
    "domains": [
     "order"
    ],
    "rulesText": "[Shield] (+1 [Might] while I'm a defender.)\nWhen I attack, stun an enemy unit here. (It doesn't deal combat damage this turn.)",
    "tags": [
     "Leona",
     "Mount Targon"
    ],
    "set": "OGN",
    "source": "cards.json@2026-09-06"
   }
  ],
  "championsOutsideIdentity": [],
  "signatureCards": [
   {
    "cardCode": "OGN-262",
    "name": "Zenith Blade",
    "type": "spell",
    "energy": 3,
    "power": 2,
    "might": null,
    "domains": [
     "calm",
     "order"
    ],
    "rulesText": "[Action] (Play on your turn or in showdowns.)\nStun an enemy unit at a battlefield. You may move a friendly unit to that enemy unit's battlefield. (A stunned unit doesn't deal combat damage this turn.)",
    "set": "OGN",
    "source": "cards.json@2026-09-06"
   }
  ],
  "otherLegendsSameChampion": [],
  "themeAxes": [
   {
    "axis": "stun",
    "label": "Stun",
    "weight": 1.0,
    "roles": [
     "rewards"
    ],
    "championShare": 1.0,
    "signatureShare": 1.0,
    "evidence": [
     {
      "role": "rewards",
      "source": "OGN-261",
      "match": "stun",
      "text": "When you stun one or more enemy units"
     },
     {
      "role": "championText",
      "source": "OGN-238",
      "match": "stun",
      "text": "[Shield] When I attack, stun an enemy unit here."
     }
    ],
    "poolSupport": {
     "count": 22,
     "cardCodes": [
      "RAD-028",
      "OGN-050",
      "OGN-220",
      "SFD-040",
      "..."
     ]
    }
   },
   {
    "axis": "buff",
    "label": "Buffs",
    "weight": 0.6,
    "roles": [
     "enables"
    ],
    "championShare": 0.0,
    "signatureShare": 0.0,
    "evidence": [
     {
      "role": "enables",
      "source": "OGN-261",
      "match": "buff",
      "text": "buff a friendly unit."
     }
    ],
    "poolSupport": {
     "count": 24,
     "cardCodes": [
      "RAD-073",
      "OGN-063",
      "OGN-217",
      "OGN-228",
      "..."
     ]
    }
   }
  ],
  "battlefields": [
   {
    "cardCode": "OGN-282",
    "name": "Monastery of Hirana",
    "score": 0.6,
    "reasons": [
     {
      "axis": "buff",
      "label": "Buffs",
      "fit": "battlefield asks for it, legend enables it",
      "complementary": true,
      "legendText": "buff a friendly unit.",
      "battlefieldText": "When you conquer here, you may spend a buff to draw 1."
     }
    ]
   }
  ],
  "identityPool": {
   "unit": 187,
   "spell": 72,
   "gear": 39
  },
  "engineScript": {
   "source": "compiled",
   "flagged": false,
   "abilities": [
    {
     "kind": "triggered",
     "trigger": "youStun",
     "timing": null
    }
   ]
  },
  "textConfidence": "parsed"
 },
 "meta": {
  "legendCode": "OGN-261",
  "name": "Radiant Dawn",
  "tags": [
   "Leona"
  ],
  "dataConfidence": "thin",
  "adviceBasis": "radiance-lists",
  "dataConfidenceReasons": [
   "10 complete Radiance-era lists (1 with tournament provenance: event-named, podium or official)",
   "6 complete pre-Radiance lists"
  ],
  "dataAvailability": "scarce",
  "popularity": {
   "dataset": "pa-list-2026-11-11",
   "lists": 59,
   "listsSinceRadiance": 18,
   "eventNamedListsSinceRadiance": 1,
   "shareSinceRadiance": 0.0125,
   "rankSinceRadiance": 29,
   "viewsSum": 71963
  },
  "officialField": {
   "dataset": "official-rq-2026",
   "events": [
    {
     "event": "los-angeles-top-decks",
     "publishedAt": "2026-09-30",
     "day1": 1,
     "day2": 0,
     "day1Share": 0.0005,
     "day2Share": 0.0,
     "day2Conversion": 0.0,
     "fieldDay2Conversion": 0.189
    },
    "..."
   ],
   "recent": {
    "events": [
     "barcelonas-top-decks",
     "singapores-top-decks",
     "los-angeles-top-decks"
    ],
    "day1": 1,
    "day2": 0,
    "day1Share": 0.0002,
    "day2Share": 0.0,
    "day2Conversion": 0.0,
    "fieldDay2Conversion": 0.176,
    "enoughForConversion": false
   }
  },
  "podiums": {
   "dataset": "r1-top3-2026-11-11",
   "all": {
    "first": 0,
    "second": 0,
    "third": 0
   },
   "radianceEra": {
    "first": 0,
    "second": 0,
    "third": 0
   }
  },
  "results": null,
  "asAdditionalLegend": {
   "dataset": "pa-fetch-2026-11-11",
   "decks": 2,
   "note": "lists that register this legend as one of the extra legends of Neeko, Blending In (RAD-167)"
  },
  "samples": {
   "radiance": {
    "n": 10,
    "nEventMarker": 1,
    "nComplete": 10,
    "sources": {
     "pa-fetch-2026-11-11": 10
    },
    "newestSetInList": {
     "RAD": 10
    },
    "nWithCurrentlyBannedCard": 0,
    "podiums": {
     "dataset": "r1-top3-2026-11-11",
     "first": 0,
     "second": 0,
     "third": 0
    },
    "archetypeLabels": {
     "dataset": "deck-theory k-means labels (../out/results.json)",
     "nLabelled": 1,
     "labels": [
      {
       "label": "spell-tempo",
       "decks": 1
      }
     ]
    },
    "chosenChampions": [
     {
      "cardCode": "OGN-079",
      "name": "Leona, Zealot",
      "decks": 7,
      "share": 0.7
     },
     {
      "cardCode": "OGN-238",
      "name": "Leona, Determined",
      "decks": 3,
      "share": 0.3
     }
    ],
    "nChosenChampionKnown": 10,
    "runeSplits": [
     {
      "split": "6 Calm / 6 Order",
      "decks": 7,
      "share": 0.7
     },
     {
      "split": "7 Calm / 5 Order",
      "decks": 1,
      "share": 0.1
     },
     {
      "split": "8 Calm / 4 Order",
      "decks": 1,
      "share": 0.1
     },
     {
      "split": "7 Order / 5 Calm",
      "decks": 1,
      "share": 0.1
     }
    ],
    "battlefields": [
     {
      "cardCode": "OGN-282",
      "name": "Monastery of Hirana",
      "decks": 6,
      "inclusionRate": 0.6,
      "avgCopiesWhenPlayed": 1.0
     },
     "..."
    ],
    "nWithBattlefields": 10,
    "coreCards": [
     {
      "cardCode": "UNL-042",
      "name": "Back Off",
      "decks": 10,
      "inclusionRate": 1.0,
      "avgCopiesWhenPlayed": 2.5,
      "type": "spell"
     },
     "..."
    ],
    "flexCards": [
     {
      "cardCode": "VEN-028",
      "name": "Mournful Witness",
      "decks": 7,
      "inclusionRate": 0.7,
      "avgCopiesWhenPlayed": 2.71,
      "type": "unit"
     },
     "..."
    ],
    "topCards": [
     {
      "cardCode": "UNL-042",
      "name": "Back Off",
      "decks": 10,
      "inclusionRate": 1.0,
      "avgCopiesWhenPlayed": 2.5,
      "type": "spell"
     },
     "..."
    ],
    "sideDeck": [
     {
      "cardCode": "OGN-043",
      "name": "Charm",
      "decks": 4,
      "inclusionRate": 0.44,
      "avgCopiesWhenPlayed": 2.0
     },
     "..."
    ],
    "nWithSideDeck": 9,
    "avgMainTypeCounts": {
     "gear": 1.7,
     "spell": 18.7,
     "unit": 19.6
    },
    "variants": [
     {
      "chosenChampion": "OGN-079",
      "name": "Leona, Zealot",
      "decks": 7,
      "share": 0.7,
      "distinctiveCards": [
       {
        "cardCode": "OGN-207",
        "name": "Call to Glory",
        "rateHere": 1.0,
        "rateElsewhere": 0.33
       }
      ],
      "deckIds": [
       "f0e744f3-d166-44ca-b724-ec4c1bd69042",
       "..."
      ]
     },
     "..."
    ],
    "decks": [
     {
      "id": "f0e744f3-d166-44ca-b724-ec4c1bd69042",
      "dataset": "pa-fetch-2026-11-11",
      "name": "Leona champion units + raptor",
      "url": "https://piltoverarchive.com/decks/view/f0e744f3-d166-44ca-b724-ec4c1bd69042",
      "eventMarker": true,
      "placement": null,
      "createdAt": "2026-11-07",
      "newestSet": "RAD",
      "bannedCards": []
     },
     "..."
    ]
   },
   "preRadiance": {
    "n": 6,
    "nEventMarker": 6,
    "nComplete": 6,
    "sources": {
     "official-rq-2026": 6
    },
    "newestSetInList": {
     "SFD": 3,
     "UNL": 3
    },
    "nWithCurrentlyBannedCard": 3,
    "podiums": {
     "dataset": "r1-top3-2026-11-11",
     "first": 0,
     "second": 0,
     "third": 0
    },
    "archetypeLabels": {
     "dataset": "deck-theory k-means labels (../out/results.json)",
     "nLabelled": 0,
     "labels": []
    },
    "chosenChampions": [
     {
      "cardCode": "OGN-238",
      "name": "Leona, Determined",
      "decks": 3,
      "share": 0.5
     },
     {
      "cardCode": "OGN-079",
      "name": "Leona, Zealot",
      "decks": 3,
      "share": 0.5
     }
    ],
    "nChosenChampionKnown": 6,
    "runeSplits": [
     {
      "split": "6 Calm / 6 Order",
      "decks": 3,
      "share": 0.5
     },
     {
      "split": "7 Calm / 5 Order",
      "decks": 3,
      "share": 0.5
     }
    ],
    "battlefields": [
     {
      "cardCode": "SFD-218",
      "name": "Sunken Temple",
      "decks": 5,
      "inclusionRate": 1.0,
      "avgCopiesWhenPlayed": 1.0
     },
     "..."
    ],
    "nWithBattlefields": 5,
    "coreCards": [
     {
      "cardCode": "OGN-058",
      "name": "Discipline",
      "decks": 6,
      "inclusionRate": 1.0,
      "avgCopiesWhenPlayed": 2.67,
      "type": "spell"
     },
     "..."
    ],
    "flexCards": [
     {
      "cardCode": "SFD-057",
      "name": "Irelia, Fervent",
      "decks": 4,
      "inclusionRate": 0.67,
      "avgCopiesWhenPlayed": 2.0,
      "type": "unit"
     },
     "..."
    ],
    "topCards": [
     {
      "cardCode": "OGN-058",
      "name": "Discipline",
      "decks": 6,
      "inclusionRate": 1.0,
      "avgCopiesWhenPlayed": 2.67,
      "type": "spell"
     },
     "..."
    ],
    "sideDeck": [
     {
      "cardCode": "OGN-224",
      "name": "Salvage",
      "decks": 4,
      "inclusionRate": 0.67,
      "avgCopiesWhenPlayed": 1.75
     },
     "..."
    ],
    "nWithSideDeck": 6,
    "avgMainTypeCounts": {
     "gear": 4.7,
     "spell": 16.5,
     "unit": 18.8
    },
    "variants": [
     {
      "chosenChampion": "OGN-238",
      "name": "Leona, Determined",
      "decks": 3,
      "share": 0.5,
      "distinctiveCards": [
       {
        "cardCode": "SFD-045",
        "name": "Not So Fast",
        "rateHere": 1.0,
        "rateElsewhere": 0.0
       }
      ],
      "deckIds": [
       "vegas-top-decks-3",
       "..."
      ]
     },
     "..."
    ],
    "decks": [
     {
      "id": "vegas-top-decks-3",
      "dataset": "official-rq-2026",
      "name": "Vegas’ Top Decks: best Radiant Dawn (Lafinte)",
      "url": "https://playriftbound.com/en-us/news/organizedplay/vegas-top-decks/",
      "eventMarker": true,
      "placement": null,
      "createdAt": "2026-03-04",
      "newestSet": "SFD",
      "bannedCards": [
       "OGN-284"
      ]
     },
     "..."
    ]
   }
  }
 }
}
```

Changes we recommend before this becomes the app's schema (HEURISTIC):

- Eras are two fixed buckets here (`radiance`, `preRadiance`). The app should key samples by `{window}` where a window opens at every set release and every ban date, so that the next ban does not silently mix formats. `newestSetInList` and `nWithCurrentlyBannedCard` are the stopgap that lets the UI warn today.
- Store `results` per source with its own `scope` and date, and allow several; today's two riftbound.gg reports are a week apart and measure different things, and `officialField` is a third, older measure.
- `officialField.events[].event` is the article slug; add the event's own date and player count from an events table (the meta-sources task has one) instead of the publication date.
- Add `legality` per legend per format (Wuju Bladesman is banned in 2v2 only) from the legality file rather than from this profile.
- Keep `poolSupport.cardCodes` as codes only (as now); names and text come from the card table.

### 8.1 How the builder should use a profile (HEURISTIC)

- **Reasons are built from the record, not from templates about archetypes.** A sentence is assembled from `evidence.text` (the legend's words), the axis label, and the names of the deck's own cards found in `poolSupport.cardCodes`. Example for a concrete Radiant Dawn deck: "Radiant Dawn pays for stuns ('When you stun one or more enemy units'). This deck stuns with <the deck's cards that are in the stun pool, by name and copies>. <k> of 22 available Calm/Order stun cards are unused: <names>." Two different decks give two different sentences because the card lists differ.
- **Rewards drive counts.** For a `rewards` axis the builder counts the deck's enablers for it and compares with the legal pool; for a `needs` axis a count of zero is an error-level warning (the legend ability is dead); for an `enables` axis it looks for payoffs in the deck.
- **Chosen Champion choice is a comparison of the listed units' own axes** against the deck's axis counts, plus the data half's distribution when `dataConfidence` allows.
- **Battlefields**: offer the text-fit list with both quoted fragments; add the data half's most-registered battlefields with n; drop anything with `bannedFrom` on or before today.
- **Data sentences name the era and n.** Example built from the record, not a template about archetypes: "13 of 14 Radiance-era Heart of the Tempest lists choose Kennen, Storm of Shuriken; 9 of 14 run 9 Chaos / 3 Order; your list runs <its own split>." When `adviceBasis` is `pre-radiance-lists-only` the same sentence must start with "Before Radiance (n lists, newest set VEN)" and must strike out cards with `bannedFrom`.
- **Rune split advice** = compare the deck's own split with `runeSplits` of the era sample, then explain the difference from the deck's own Power costs per domain (computed from its cards), never from the sample alone.
- **Field numbers are context, not advice.** `officialField.recent.day2Conversion` against `fieldDay2Conversion` tells how the legend did before Radiance; show it with the event names and only when `enoughForConversion` is true.
- **Never** print a rate without its n and dataset, and never call list counts "meta share".

## 9. Per-legend profiles (generated from the two JSON files)

Reading guide: "Text" is verbatim from the named source. "Parsed ability", "Rewards / Needs / Enables", "Theme axes" and "Battlefields by text" are HEURISTIC derivations from that text. "Chosen Champion options" and "Signature cards" are FACT (card data plus the cited rule); costs are Energy, Power, Might as printed. "Popularity and results" and "Played lists" are DATA with n. Core and flex lists show `decks/n` and, for core cards, average copies.

### OGN-247 Daughter of the Void (Kai'Sa), Fury/Mind

- **Text (FACT, cards.json@2026-09-06):** "[Exhaust]: [Reaction] — [Add] [Any]. Use only to play spells. (Abilities that add resources can't be reacted to.)"
- Printing codes: OGN-247, OGN-299, OGN-299*, OGN-299s, OPP-247
- Parsed ability 1 (HEURISTIC parse): activated; reaction speed; cost [Exhaust]; restriction "Use only to play spells."; effect "[Add] [Any]."
- **Rewards (HEURISTIC, from the quoted text):** Spells ["Use only to play spells."]
- **Enables (HEURISTIC, from the quoted text):** Adding resources ["[Add] [Any]."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - OGN-039 Kai'Sa, Survivor (4 Energy, 4 Might): "[Accelerate] (You may pay [1][Fury] as an additional cost to have me enter ready.) // When I conquer, draw 1."
  - RAD-063 Kai'Sa, Rebel (5 Energy, 1 Power, 5 Might): "[Disarm] (When I attack, give an enemy unit here -1 [Might] this turn). // While I'm in a showdown, your spells have [Reaction]. (Play them any time, even before spells and abilities resolve.)"
  - OGN-112 Kai'Sa, Evolutionary (6 Energy, 1 Power, 6 Might): "[Ganking] (I can move from battlefield to battlefield.) // When I conquer, you may play a spell from your trash with Energy cost less than your points without paying its Energy cost. Then recycle it. (You must still pay its Power cost.)"
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** OGN-248 Icathian Rain (spell, 7 Energy, 3 Power): "Deal 2 to a unit. // Deal 2 to a unit. // Deal 2 to a unit. // Deal 2 to a unit. // Deal 2 to a unit. // Deal 2 to a unit."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** spell-matters 1.00 [rewards] pool 75; energy-ramp 0.60 [enables] pool 8
- **Battlefields by text (HEURISTIC):** OGN-296 Void Gate (1.0; Spells); SFD-215 Ravenbloom Conservatory (1.0; Spells); UNL-216 The Academy (1.0; Spells); VEN-158 Heisho, Shell of the World (1.0; Spells); VEN-164 Sandswept Tomb (1.0; Spells)
- **Popularity and results (DATA):** 49 published lists since 2026-10-23 (rank 6 of 58, 3.4%); riftbound.gg week-2 tier 1, 0 wins, 12 top cuts; EU Regional Championship 49% over 300 matches
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 11 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 38 Day 1 pilots = 0.6% of the field, 5 in Day 2 = 0.5% of Day 2; Day 2 conversion 13% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 3 first, 10 second, 5 third; with a Radiance card in the list: 0 / 2 / 1
- **Radiance-era lists (DATA, n=18, 18 with tournament provenance; sources: pa-fetch 16, r1-top3 2):** champion Kai'Sa, Survivor 18/18; runes 7 Fury / 5 Mind 15/18, 6 Fury / 6 Mind 3/18; battlefields Void Gate 18/18, Frozen Fortress 18/18, Rockfall Path 17/18, Vilemaw's Lair 1/18; core (>=75%) Brynhir Thundersong 18/18 x3.0, Stupefy 18/18 x3.0, Temporal Breach 18/18 x3.0, Falling Star 18/18 x2.9, Thousand-Tailed Watcher 18/18 x2.9, Noxus Hopeful 18/18 x2.7, Bilgewater Tracker 18/18 x2.6, Hextech Ray 18/18 x2.6, Lecturing Yordle 18/18 x2.1, Smoke Screen 18/18 x2.0, The Empyrean 18/18 x1.8, Kai'Sa, Survivor 18/18 x1.0; flex (25-74%) Watchful Sentry 13/18, Singularity 8/18, Orb of Regret 7/18, Brittle Steel 6/18, Lost to the Sands 5/18; side deck Decree of Rage 17/18, Brittle Steel 17/18, Ferrous Forerunner 16/18, Decree of Insight 14/18, Icathian Rain 10/18; shape labels from the deck-theory clustering (15 labelled): big-control 15
- **Pre-Radiance lists (DATA, n=15, 15 with tournament provenance; sources: official-rq 7, pa-fetch 2, pa-sample 1, r1-top3 5; newest set in list: SFD 3, UNL 5, VEN 7; 6 of them hold a card that is banned today):** champion Kai'Sa, Survivor 15/15; runes 7 Fury / 5 Mind 11/15, 6 Fury / 6 Mind 3/15, 7 Mind / 5 Fury 1/15; battlefields Void Gate 14/14, Rockfall Path 8/14, Frozen Fortress 6/14, The Arena's Greatest 5/14 (BANNED since 2026-07-24), The Candlelit Sanctum 2/14; core (>=75%) Falling Star 15/15 x3.0, Stupefy 15/15 x3.0, Watchful Sentry 15/15 x3.0, Thousand-Tailed Watcher 15/15 x2.9, Lecturing Yordle 15/15 x2.8, Noxus Hopeful 15/15 x2.4, Time Warp 15/15 x1.9, Kai'Sa, Survivor 15/15 x1.0; flex (25-74%) Plundering Poro 11/15, Bellows Breath 11/15, Brynhir Thundersong 8/15, Retreat 8/15, Temporal Breach 7/15, Ravenbloom Student 7/15, Smoke Screen 7/15, Smite 5/15; side deck Thermo Beam 11/15, Bellows Breath 8/15, Progress Day 7/15, Decree of Rage 6/15, Decree of Insight 6/15; shape labels from the deck-theory clustering (3 labelled): big-control 3
- **Data confidence: ok; advice basis: radiance-lists** (18 complete Radiance-era lists (18 with tournament provenance: event-named, podium or official); 15 complete pre-Radiance lists)

### OGN-249 Relentless Storm (Volibear), Fury/Body

- **Text (FACT, cards.json@2026-09-06):** "When you play a [Mighty] unit, you may exhaust me to channel 1 rune exhausted. (A unit is Mighty while it has 5+ [Might].)"
- Printing codes: OGN-249, OGN-300, OGN-300*, OGN-300s, OPP-249
- Parsed ability 1 (HEURISTIC parse): triggered; cost exhaust me; condition "When you play a [Mighty] unit"; effect "channel 1 rune exhausted."
- **Rewards (HEURISTIC, from the quoted text):** Mighty (5+ Might) ["When you play a [Mighty] unit"]
- **Enables (HEURISTIC, from the quoted text):** Channeling extra runes ["channel 1 rune exhausted."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - OGN-041 Volibear, Furious (10 Energy, 2 Power, 9 Might): "[Deflect 2] (Opponents must pay [Any][Any] to choose me with a spell or ability.) // When I attack, deal 5 damage split among any number of enemy units here."
  - OGN-158 Volibear, Imposing (12 Energy, 2 Power, 10 Might): "[Shield 3] (+3 [Might] while I'm a defender.) // [Tank] (I must be assigned combat damage first.) // When an opponent moves to a battlefield other than mine, draw 1. (Bases are not battlefield.)"
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** OGN-250 Stormbringer (spell, 6 Energy, 2 Power): "Choose a friendly unit in your base. Deal damage equal to its Might to all enemy units at a battlefield, then move your unit there."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** mighty 1.00 [rewards] pool 77; channel-rune 0.60 [enables] pool 9; movement 0.32 [champion or signature text only] pool 42
- **Battlefields by text (HEURISTIC):** SFD-210 Hall of Legends (0.6; Readies the legend); SFD-218 Sunken Temple (0.5; Mighty (5+ Might))
- **Popularity and results (DATA):** 28 published lists since 2026-10-23 (rank 19 of 58, 1.9%)
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 10 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 2 Day 1 pilots = 0.0% of the field, 1 in Day 2 = 0.1% of Day 2; fewer than 30 Day 1 pilots, so no conversion rate is shown
- **Radiance-era lists (DATA, n=11, 2 with tournament provenance; sources: pa-fetch 11):** champion Volibear, Furious 11/11; runes 6 Fury / 6 Body 6/11, 7 Body / 5 Fury 5/11; battlefields Dragon Roost 10/11, Sigil of the Storm 9/11, Forgotten Monument 5/11, Cosmic Vista 3/11, Vilemaw's Lair 2/11; core (>=75%) Sky Splitter 11/11 x2.9, Gentle Gemdragon 11/11 x2.9, Kadregrin the Infernal 11/11 x2.8, Volibear, Furious 11/11 x1.0, Blazing Scorcher 10/11 x3.0, Elder Dragon 10/11 x3.0, Seraphic Wyvern 9/11 x2.9, Dune Drake 9/11 x2.7, Herald of Scales 9/11 x2.4; flex (25-74%) Bilgewater Tracker 8/11, Challenge 8/11, Rengar, Trophy Hunter 7/11, Minotaur Reckoner 7/11, Kinkou Initiate 6/11, Stormbringer 6/11, Portable Portal 6/11, Falling Star 6/11; side deck Repulse 9/11, Thermo Beam 8/11, Avalanche 7/11, Minotaur Reckoner 5/11, Punch First 4/11; shape labels from the deck-theory clustering (2 labelled): big-control 2
- **Pre-Radiance lists (DATA, n=6, 6 with tournament provenance; sources: official-rq 6; newest set in list: SFD 3, UNL 3; 5 of them hold a card that is banned today):** champion Volibear, Furious 6/6; runes 6 Fury / 6 Body 6/6; battlefields Aspirant's Climb 5/5 (BANNED since 2026-07-24), Sigil of the Storm 4/5, The Papertree 3/5, Vilemaw's Lair 2/5, Obelisk of Power 1/5 (BANNED since 2026-03-31); core (>=75%) Kadregrin the Infernal 6/6 x3.0, Mobilize 6/6 x3.0, Dazzling Aurora 6/6 x3.0, Sky Splitter 6/6 x2.8, Catalyst of Aeons 6/6 x2.8, Challenge 6/6 x2.3, Ferrous Forerunner 6/6 x2.3, Stormbringer 6/6 x1.8; flex (25-74%) Deadbloom Predator 4/6, Falling Star 4/6, Get Excited! 4/6, Gentle Gemdragon 3/6, Elder Dragon 3/6, Rengar, Trophy Hunter 3/6, Void Seeker 3/6, Confront 2/6; side deck Unyielding Spirit 4/6, Punch First 4/6, Akshan, Mischievous 3/6, Repulse 3/6, Thermo Beam 3/6
- **Data confidence: thin; advice basis: radiance-lists** (11 complete Radiance-era lists (2 with tournament provenance: event-named, podium or official); 6 complete pre-Radiance lists)

### OGN-251 Loose Cannon (Jinx), Fury/Chaos

- **Text (FACT, cards.json@2026-09-06):** "At start of your Beginning Phase, draw 1 if you have one or fewer cards in your hand."
- Printing codes: OGN-251, OGN-301, OGN-301*, OGN-301s, OPP-251
- Parsed ability 1 (HEURISTIC parse): triggered; condition "At start of your Beginning Phase, if you have one or fewer cards in your hand"; effect "draw 1."
- **Rewards (HEURISTIC, from the quoted text):** Empty hand ["At start of your Beginning Phase, if you have one or fewer cards in your hand"]
- **Enables (HEURISTIC, from the quoted text):** Card draw ["draw 1."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - OGN-030 Jinx, Demolitionist (3 Energy, 1 Power, 4 Might): "[Accelerate] (You may pay [1][Fury] as an additional cost to have me enter ready.) // [Assault 2] (+2 [Might] while I'm an attacker.) // When you play me, discard 2."
  - OGN-202 Jinx, Rebel (5 Energy, 1 Power, 5 Might): "When you discard one or more cards, ready me and give me +1 [Might] this turn."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** OGN-252 Super Mega Death Rocket! (spell, 4 Energy, 1 Power): "Deal 5 to a unit. // When you conquer, you may discard 1 to return this from your trash to your hand."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** low-hand 1.00 [rewards] pool 25; draw 0.60 [enables] pool 30; discard 0.50 [champion or signature text only] pool 26
- **Battlefields by text (HEURISTIC):** no battlefield text interacts with this legend text; use the data below
- **Popularity and results (DATA):** 11 published lists since 2026-10-23 (rank 47 of 58, 0.8%)
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 8 of the 11 official field tables (first 2026-02-25, last 2026-06-24); not listed in the last 3 tables
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 0 first, 0 second, 1 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=10, 0 with tournament provenance; sources: pa-fetch 10):** champion Jinx, Demolitionist 5/10, Jinx, Rebel 5/10; runes 6 Fury / 6 Chaos 5/10, 7 Chaos / 5 Fury 3/10, 12 Chaos 1/10; battlefields Zaun Warrens 7/10, Ruined Monastery 6/10, Minefield 3/10, Bandle Tree 2/10, Targon's Peak 2/10; core (>=75%) Super Mega Death Rocket! 9/10 x1.7, Traveling Merchant 8/10 x2.6, Falling Star 8/10 x2.1; flex (25-74%) Ride the Wind 7/10, Jinx, Rebel 7/10, Rhasa the Sunderer 5/10, Punching Poro 5/10, Seal of Discord 5/10, Vi, Destructive 5/10, Gust 5/10, Jinx, Demolitionist 5/10; side deck Star-Crossed 4/8, Thermo Beam 4/8, Decree of Discord 3/8, Super Mega Death Rocket! 3/8, Switcheroo 3/8
  - Builds by Chosen Champion (DATA): Jinx, Demolitionist 5/10 sets itself apart with Seal of Rage, Pyke, Dockside Butcher; Jinx, Rebel 5/10 sets itself apart with Detonate, Seal of Discord, Treasure Trove, Treasure Hunter
- **Pre-Radiance lists (DATA, n=8, 8 with tournament provenance; sources: official-rq 6, pa-fetch 1, pa-sample 1; newest set in list: SFD 3, UNL 4, VEN 1; 6 of them hold a card that is banned today):** champion Jinx, Demolitionist 5/8, Jinx, Rebel 3/8; runes 6 Fury / 6 Chaos 3/8, 9 Fury / 3 Chaos 2/8, 8 Chaos / 4 Fury 1/8; battlefields Zaun Warrens 6/7, The Arena's Greatest 4/7 (BANNED since 2026-07-24), Minefield 3/7, The Candlelit Sanctum 2/7, Trifarian War Camp 1/7; core (>=75%) Noxus Hopeful 8/8 x3.0, Traveling Merchant 8/8 x3.0, Stacked Deck 6/8 x2.8 (BANNED since 2026-09-18), Falling Star 6/8 x1.5, Gust 6/8 x1.5; flex (25-74%) Cleave 5/8, Jinx, Demolitionist 5/8, Overzealous Fan 4/8, Tideturner 4/8, Rebuke 4/8, Switcheroo 4/8, Hard Bargain 4/8, Seal of Rage 3/8; side deck Brynhir Thundersong 6/8, Gust 5/8, Switcheroo 5/8, Hard Bargain 4/8, Star-Crossed 4/8; shape labels from the deck-theory clustering (2 labelled): unit-aggro 2
- **Data confidence: thin; advice basis: radiance-lists** (10 complete Radiance-era lists (0 with tournament provenance: event-named, podium or official); 8 complete pre-Radiance lists)

### OGN-253 Hand of Noxus (Darius), Fury/Order

- **Text (FACT, cards.json@2026-09-06):** "[Exhaust]: [Reaction], [Legion] — [Add] [1]. (Abilities that add resources can't be reacted to. Get the effect if you've played a card this turn.)"
- Printing codes: OGN-253, OGN-302, OGN-302*, OGN-302s, OPP-253
- Parsed ability 1 (HEURISTIC parse): activated; reaction speed; gate Legion; cost [Exhaust]; effect "[Add] [1]."
- **Rewards (HEURISTIC, from the quoted text):** Multiple cards per turn (Legion) ["[Legion]"]
- **Enables (HEURISTIC, from the quoted text):** Adding resources ["[Add] [1]."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - OGN-027 Darius, Trifarian (5 Energy, 1 Power, 5 Might): "When you play your second card in a turn, give me +2 [Might] this turn and ready me."
  - OGN-243 Darius, Executioner (6 Energy, 1 Power, 6 Might): "[Legion] — When you play me, ready me. (Get the effect if you've played another card this turn) // Other friendly units have +1 [Might] here."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** OGN-254 Noxian Guillotine (spell, 4 Energy, 1 Power): "[Action] (Play on your turn or in showdowns.) // Choose a unit. Kill it the next time it takes damage this turn. // [Legion] — Kill it now instead. (Get the effect if you've played another card this turn.)"
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** legion 1.00 [rewards] pool 26; energy-ramp 0.60 [enables] pool 6
- **Battlefields by text (HEURISTIC):** SFD-210 Hall of Legends (0.6; Readies the legend); VEN-166 Threshold of the Gray (0.6; Adding resources)
- **Popularity and results (DATA):** 8 published lists since 2026-10-23 (rank 52 of 58, 0.5%)
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 8 of the 11 official field tables (first 2026-02-25, last 2026-06-24); not listed in the last 3 tables
- **Radiance-era lists (DATA, n=9, 3 with tournament provenance; sources: pa-fetch 9):** champion Darius, Trifarian 8/9, Darius, Executioner 1/9; runes 6 Fury / 6 Order 5/9, 8 Order / 4 Fury 2/9, 7 Fury / 5 Order 1/9; battlefields Trifarian War Camp 6/9, Seat of Power 5/9, Emperor's Dais 4/9, Vilemaw's Lair 2/9, Zaun Warrens 2/9; core (>=75%) Trifarian Captain 9/9 x2.8, Noxus Hopeful 8/9 x3.0, Darius, Trifarian 8/9 x1.1, Hidden Blade 7/9 x2.6; flex (25-74%) Vanguard Captain 6/9, Imperial Decree 6/9, Baited Hook 5/9, Cleave 5/9, Seal of Unity 5/9, Falling Star 5/9, Concert Poster 4/9, Honest Broker 4/9; side deck Salvage 6/8, Decree of Unity 4/8, Decree of Rage 3/8, Imperial Decree 3/8, Burn Away 2/8; shape labels from the deck-theory clustering (3 labelled): unit-aggro 3
- **Pre-Radiance lists (DATA, n=10, 8 with tournament provenance; sources: official-rq 7, pa-fetch 3; newest set in list: SFD 3, UNL 5, VEN 2; 4 of them hold a card that is banned today):** champion Darius, Trifarian 10/10; runes 8 Order / 4 Fury 3/10, 7 Order / 5 Fury 2/10, 6 Fury / 6 Order 2/10; battlefields Seat of Power 7/9, Trifarian War Camp 5/9, The Arena's Greatest 3/9 (BANNED since 2026-07-24), Monastery of Hirana 2/9, Zaun Warrens 2/9; core (>=75%) Darius, Trifarian 10/10 x1.1, Noxus Hopeful 9/10 x2.8, Honest Broker 9/10 x2.8, Hidden Blade 9/10 x2.7, Ferrous Forerunner 8/10 x1.8; flex (25-74%) Vanguard Captain 6/10, Falling Star 6/10, Baited Hook 5/10, Seal of Unity 5/10, Rally the Troops 5/10, Spectral Matron 5/10, Shadow's Call 5/10, Deathgrip 5/10; side deck Salvage 10/10, Ashe, Focused 5/10, Brynhir Thundersong 4/10, Ferrous Forerunner 4/10, Falling Star 4/10; shape labels from the deck-theory clustering (1 labelled): unit-aggro 1
- **Data confidence: ok; advice basis: radiance-lists** (9 complete Radiance-era lists (3 with tournament provenance: event-named, podium or official); 10 complete pre-Radiance lists)

### OGN-255 Nine-Tailed Fox (Ahri), Calm/Mind

- **Text (FACT, cards.json@2026-09-06):** "When an enemy unit attacks a battlefield you control, give it -1 [Might] this turn, to a minimum of 1 [Might]."
- Printing codes: OGN-255, OGN-303, OGN-303*, OGN-303s, OPP-255
- Parsed ability 1 (HEURISTIC parse): triggered; condition "When an enemy unit attacks a battlefield you control"; effect "give it -1 [Might] this turn, to a minimum of 1 [Might]."
- **Rewards (HEURISTIC, from the quoted text):** Defending ["When an enemy unit attacks a battlefield you control"]
- **Enables (HEURISTIC, from the quoted text):** Reducing enemy Might ["give it -1 [Might] this turn, to a minimum of 1 [Might]."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - OGN-119 Ahri, Inquisitive (3 Energy, 1 Power, 3 Might): "When I attack or defend, give an enemy unit here -2 [Might] this turn, to a minimum of 1 [Might]."
  - RAD-038 Ahri, Confident (4 Energy, 1 Power, 4 Might): "[Disarm] (When I attack, give an enemy unit here -1 [Might] this turn.) // When you reduce the Might of an enemy unit here by 1 or more, give me +1 [Might] this turn."
  - OGN-066 Ahri, Alluring (5 Energy, 1 Power, 4 Might): "When I hold, you score 1 point."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** OGN-256 Fox-Fire (spell, 3 Energy): "[Hidden] (Hide now for [Any] to react with later for [0].) // [Action] (Play on your turn or in showdowns.) // Kill any number of units at a battlefield with total Might 4 or less."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** defend 1.00 [rewards] pool 32; might-reduction 0.73 [enables] pool 20
- **Battlefields by text (HEURISTIC):** UNL-208 Black Flame Altar (1.0; Defending); VEN-159 Kinkou Temple (1.0; Defending); OGN-279 Fortified Position (0.5; Defending); RAD-161 Durand Memorial (0.5; Defending); SFD-215 Ravenbloom Conservatory (0.5; Defending)
- **Popularity and results (DATA):** 27 published lists since 2026-10-23 (rank 20 of 58, 1.9%); registered as an extra Neeko legend in 2 fetched lists
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 9 of the 11 official field tables (first 2026-02-25, last 2026-09-09); last 3 events (Barcelona, Singapore, Los Angeles): 1 Day 1 pilots = 0.0% of the field, 0 in Day 2 = 0.0% of Day 2; fewer than 30 Day 1 pilots, so no conversion rate is shown
- **Radiance-era lists (DATA, n=10, 1 with tournament provenance; sources: pa-fetch 10):** champion Ahri, Confident 6/10, Ahri, Inquisitive 3/10, Ahri, Alluring 1/10; runes 6 Calm / 6 Mind 7/10, 7 Calm / 5 Mind 1/10, 8 Calm / 4 Mind 1/10; battlefields Grove of the God-Willow 4/10, Startipped Peak 4/10, Ravenbloom Conservatory 3/10, The Papertree 3/10, Vilemaw's Lair 2/10; core (>=75%) Defy 10/10 x2.8, Stupefy 10/10 x2.8, Ravenbloom Student 9/10 x3.0, Discipline 9/10 x2.9, Ahri, Confident 9/10 x1.6; flex (25-74%) Stalwart Poro 7/10, Thousand-Tailed Watcher 7/10, Charm 7/10, Not So Fast 7/10, Back Off 6/10, Zhonya's Hourglass 6/10, Sona, Harmonious 5/10, Fox-Fire 5/10; side deck Disarming Rake 6/8, Decree of Insight 5/8, Hush 4/8, Singularity 3/8, Allay, Eager Admirer 2/8; shape labels from the deck-theory clustering (1 labelled): spell-tempo 1
  - Builds by Chosen Champion (DATA): Ahri, Confident 6/10 sets itself apart with Mournful Witness; Ahri, Inquisitive 3/10 sets itself apart with Mel, Newly Awakened
- **Pre-Radiance lists (DATA, n=8, 8 with tournament provenance; sources: official-rq 7, pa-sample 1; newest set in list: SFD 3, UNL 5; 2 of them hold a card that is banned today):** champion Ahri, Inquisitive 6/8, Ahri, Alluring 2/8; runes 6 Calm / 6 Mind 4/8, 7 Calm / 5 Mind 2/8, 7 Mind / 5 Calm 2/8; battlefields Grove of the God-Willow 4/7, Trifarian War Camp 3/7, Marai Spire 2/7, Power Nexus 2/7, Aspirant's Climb 1/7 (BANNED since 2026-07-24); core (>=75%) Discipline 8/8 x3.0, Defy 8/8 x2.8, Thousand-Tailed Watcher 8/8 x2.0, Desert's Call 7/8 x2.7, Charm 7/8 x2.1, Ravenbloom Student 6/8 x3.0, Sona, Harmonious 6/8 x2.0, Emperor's Divide 6/8 x1.8; flex (25-74%) Back Off 5/8, Zhonya's Hourglass 5/8, Time Warp 5/8, Not So Fast 5/8, Blitzcrank, Impassive 4/8, Sunlit Guardian 3/8, Stupefy 3/8, Plundering Poro 3/8; side deck Disarming Rake 6/8, Not So Fast 4/8, Ahri, Alluring 4/8, Wind Wall 3/8, Unchecked Power 2/8; shape labels from the deck-theory clustering (1 labelled): spell-tempo 1
- **Data confidence: thin; advice basis: radiance-lists** (10 complete Radiance-era lists (1 with tournament provenance: event-named, podium or official); 8 complete pre-Radiance lists)

### OGN-257 Blind Monk (Lee Sin), Calm/Body

- **Text (FACT, cards.json@2026-09-06):** "[1], [Exhaust]: Buff a friendly unit. (If it doesn't have a buff, it gets a +1 [Might] buff.)"
- Printing codes: OGN-257, OGN-304, OGN-304*, OGN-304s, OPP-257
- Parsed ability 1 (HEURISTIC parse): activated; cost [1] + [Exhaust]; effect "Buff a friendly unit."
- **Enables (HEURISTIC, from the quoted text):** Buffs ["Buff a friendly unit."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - OGN-078 Lee Sin, Ascetic (5 Energy, 1 Power, 5 Might): "[Shield] (+1 [Might] while I'm a defender.) // [Exhaust]: Buff me. (I get a +1 [Might] buff.) // I can have any number of buffs."
  - OGN-151 Lee Sin, Centered (6 Energy, 6 Might): "[Accelerate] (You may pay [1][Body] as an additional cost to have me enter ready.) // Other buffed friendly units at my battlefield have +2 [Might]."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** OGN-258 Dragon's Rage (spell, 4 Energy, 1 Power): "Move an enemy unit. Then choose another enemy unit at its destination. They deal damage equal to their Mights to each other."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** buff 0.80 [enables] pool 32
- **Battlefields by text (HEURISTIC):** OGN-282 Monastery of Hirana (0.8; Buffs); SFD-210 Hall of Legends (0.6; Readies the legend)
- **Popularity and results (DATA):** 12 published lists since 2026-10-23 (rank 43 of 58, 0.8%); registered as an extra Neeko legend in 2 fetched lists
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 9 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 1 Day 1 pilots = 0.0% of the field, 0 in Day 2 = 0.0% of Day 2; fewer than 30 Day 1 pilots, so no conversion rate is shown
- **Radiance-era lists (DATA, n=10, 2 with tournament provenance; sources: pa-fetch 10):** champion Lee Sin, Centered 8/10, Monastery of Hirana 1/10, Lee Sin, Ascetic 1/10; runes 7 Body / 5 Calm 4/10, 6 Calm / 6 Body 3/10, 8 Body / 4 Calm 2/10; battlefields Monastery of Hirana 8/10, Grove of the God-Willow 3/10, Targon's Peak 3/10, Windswept Hillock 3/10, Sunken Temple 3/10; core (>=75%) Discipline 10/10 x2.9, Defy 10/10 x2.8, Punch First 10/10 x2.6, Pit Rookie 8/10 x2.8, Lee Sin, Centered 8/10 x1.0; flex (25-74%) Scuttle Crab 7/10, Charm 7/10, Lonely Poro 6/10, Zhonya's Hourglass 6/10, Riven, Broken Blade 5/10, First Mate 4/10, Iridescent Avian 4/10, Irresistible Faefolk 4/10; side deck Decree of Strength 5/9, Hush 4/9, Decree of Focus 4/9, Adaptatron 3/9, Ruin Runner 3/9; shape labels from the deck-theory clustering (1 labelled): spell-tempo 1
- **Pre-Radiance lists (DATA, n=7, 7 with tournament provenance; sources: official-rq 7; newest set in list: SFD 3, UNL 4; 2 of them hold a card that is banned today):** champion Lee Sin, Centered 7/7; runes 7 Body / 5 Calm 4/7, 6 Calm / 6 Body 3/7; battlefields Monastery of Hirana 5/6, Sunken Temple 3/6, Star Spring 2/6, Aspirant's Climb 1/6 (BANNED since 2026-07-24), Grove of the God-Willow 1/6; core (>=75%) Defy 7/7 x3.0, Discipline 7/7 x2.7, Charm 7/7 x2.6, Lee Sin, Centered 7/7 x1.0, Zhonya's Hourglass 6/7 x2.3; flex (25-74%) Punch First 5/7, First Mate 5/7, Lonely Poro 5/7, Irelia, Fervent 5/7, Sabotage 5/7, Challenge 4/7, Not So Fast 4/7, Doran's Blade 4/7; side deck Sabotage 7/7, Akshan, Mischievous 6/7, Not So Fast 5/7, Unyielding Spirit 4/7, Disarming Rake 3/7
- **Data confidence: thin; advice basis: radiance-lists** (10 complete Radiance-era lists (2 with tournament provenance: event-named, podium or official); 7 complete pre-Radiance lists)

### OGN-259 Unforgiven (Yasuo), Calm/Chaos

- **Text (FACT, cards.json@2026-09-06):** "[2], [Exhaust]: Move a friendly unit to or from its base."
- **Text in the official gallery on 2026-11-11 differs (FACT):** "[2], [Exhaust]: Move a friendly unit to or from your base."
- Printing codes: OGN-259, OGN-305, OGN-305*, OGN-305s, OPP-259
- Parsed ability 1 (HEURISTIC parse): activated; cost [2] + [Exhaust]; effect "Move a friendly unit to or from your base."
- **Enables (HEURISTIC, from the quoted text):** Moving units ["Move a friendly unit to or from your base."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - OGN-205 Yasuo, Windrider (5 Energy, 1 Power, 4 Might): "[Ganking] (I can move from battlefield to battlefield.) // The third time I move in a turn, you score 1 point."
  - OGN-076 Yasuo, Remorseful (6 Energy, 2 Power, 6 Might): "When I attack, deal damage equal to my Might to an enemy unit here."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** OGN-260 Last Breath (spell, 3 Energy, 2 Power): "[Action] (Play on your turn or in showdowns.) // Ready a friendly unit. It deals damage equal to its Might to an enemy unit at a battlefield."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** movement 0.70 [enables] pool 63
- **Battlefields by text (HEURISTIC):** OGN-277 Back-Alley Bar (0.7; Moving units); UNL-206 Altar of Blood (0.7; Moving units); SFD-210 Hall of Legends (0.6; Readies the legend)
- **Popularity and results (DATA):** 12 published lists since 2026-10-23 (rank 44 of 58, 0.8%)
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 8 of the 11 official field tables (first 2026-02-25, last 2026-06-24); not listed in the last 3 tables
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 0 first, 0 second, 1 third; with a Radiance card in the list: 0 / 0 / 1
- **Radiance-era lists (DATA, n=11, 3 with tournament provenance; sources: pa-fetch 10, r1-top3 1):** champion Yasuo, Windrider 11/11; runes 6 Calm / 6 Chaos 9/11, 7 Chaos / 5 Calm 2/11; battlefields Targon's Peak 5/11, Back-Alley Bar 3/11, Rockfall Path 3/11, Star Spring 3/11, Vilemaw's Lair 2/11; core (>=75%) Yasuo, Windrider 11/11 x1.0, Defy 10/11 x2.8, Star-Crossed 10/11 x1.9, Discipline 9/11 x3.0, Ride the Wind 9/11 x2.4; flex (25-74%) Charm 8/11, Gust 7/11, Flash 7/11, Lonely Poro 6/11, Scuttle Crab 6/11, En Garde 6/11, Zhonya's Hourglass 6/11, Stellacorn Herder 5/11; side deck Decree of Focus 4/8, Angler Beast 3/8, Hush 3/8, Ravenbloom Prefect 3/8, Disarming Rake 2/8; shape labels from the deck-theory clustering (2 labelled): spell-tempo 2
- **Pre-Radiance lists (DATA, n=7, 7 with tournament provenance; sources: official-rq 7; newest set in list: SFD 3, UNL 4; 4 of them hold a card that is banned today):** champion Yasuo, Remorseful 4/7, Yasuo, Windrider 3/7; runes 6 Calm / 6 Chaos 6/7, 7 Calm / 5 Chaos 1/7; battlefields Targon's Peak 5/6, Rockfall Path 2/6, Seat of Power 2/6, Sunken Temple 2/6, Aspirant's Climb 1/6 (BANNED since 2026-07-24); core (>=75%) Discipline 7/7 x3.0, Defy 7/7 x2.9, Stellacorn Herder 7/7 x2.7, En Garde 7/7 x2.6, Zhonya's Hourglass 7/7 x2.1, Ride the Wind 7/7 x1.9; flex (25-74%) Tideturner 5/7, Lonely Poro 5/7, Mask of Foresight 4/7, Charm 4/7, Irelia, Fervent 4/7, Stacked Deck 4/7 (BANNED since 2026-09-18), Star-Crossed 4/7, Vex, Apathetic 4/7; side deck Adaptatron 5/7, Irelia, Fervent 3/7, Zhonya's Hourglass 3/7, Rebuke 2/7, Sneaky Deckhand 2/7
- **Data confidence: ok; advice basis: radiance-lists** (11 complete Radiance-era lists (3 with tournament provenance: event-named, podium or official); 7 complete pre-Radiance lists)

### OGN-261 Radiant Dawn (Leona), Calm/Order

- **Text (FACT, cards.json@2026-09-06):** "When you stun one or more enemy units, buff a friendly unit. (If it doesn't have a buff, it gets a +1 [Might] buff.)"
- Printing codes: OGN-261, OGN-306, OGN-306*, OGN-306s, OPP-261
- Parsed ability 1 (HEURISTIC parse): triggered; condition "When you stun one or more enemy units"; effect "buff a friendly unit."
- **Rewards (HEURISTIC, from the quoted text):** Stun ["When you stun one or more enemy units"]
- **Enables (HEURISTIC, from the quoted text):** Buffs ["buff a friendly unit."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - OGN-238 Leona, Determined (4 Energy, 1 Power, 4 Might): "[Shield] (+1 [Might] while I'm a defender.) // When I attack, stun an enemy unit here. (It doesn't deal combat damage this turn.)"
  - OGN-079 Leona, Zealot (6 Energy, 1 Power, 6 Might): "If an opponent's score is within 3 points of the Victory Score, I enter ready. // Stunned enemy units here have -8 [Might], to a minimum of 1 [Might]."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** OGN-262 Zenith Blade (spell, 3 Energy, 2 Power): "[Action] (Play on your turn or in showdowns.) // Stun an enemy unit at a battlefield. You may move a friendly unit to that enemy unit's battlefield. (A stunned unit doesn't deal combat damage this turn.)"
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** stun 1.00 [rewards] pool 22; buff 0.60 [enables] pool 24
- **Battlefields by text (HEURISTIC):** OGN-282 Monastery of Hirana (0.6; Buffs)
- **Popularity and results (DATA):** 18 published lists since 2026-10-23 (rank 29 of 58, 1.2%); registered as an extra Neeko legend in 2 fetched lists
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 9 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 1 Day 1 pilots = 0.0% of the field, 0 in Day 2 = 0.0% of Day 2; fewer than 30 Day 1 pilots, so no conversion rate is shown
- **Radiance-era lists (DATA, n=10, 1 with tournament provenance; sources: pa-fetch 10):** champion Leona, Zealot 7/10, Leona, Determined 3/10; runes 6 Calm / 6 Order 7/10, 7 Calm / 5 Order 1/10, 8 Calm / 4 Order 1/10; battlefields Monastery of Hirana 6/10, Packed Amphitheater 5/10, Sunken Temple 3/10, Vilemaw's Lair 2/10, Rockfall Path 2/10; core (>=75%) Back Off 10/10 x2.5, Defy 9/10 x2.7, Discipline 9/10 x2.7, Zenith Blade 9/10 x2.1, Vi, Peacekeeper 8/10 x2.5, Call to Glory 8/10 x2.2, Zhonya's Hourglass 8/10 x2.1; flex (25-74%) Mournful Witness 7/10, Ki Burst 7/10, Riven, Broken Blade 7/10, Kennen, Keeper of Balance 7/10, Leona, Zealot 7/10, Vex, Mocking 6/10, Scuttle Crab 5/10, Nami, Headstrong 5/10; side deck Charm 4/9, Salvage 4/9, Not So Fast 4/9, Decree of Unity 4/9, Hush 4/9; shape labels from the deck-theory clustering (1 labelled): spell-tempo 1
  - Builds by Chosen Champion (DATA): Leona, Zealot 7/10 sets itself apart with Call to Glory, Mournful Witness; Leona, Determined 3/10 sets itself apart with Heroic Charge
- **Pre-Radiance lists (DATA, n=6, 6 with tournament provenance; sources: official-rq 6; newest set in list: SFD 3, UNL 3; 3 of them hold a card that is banned today):** champion Leona, Determined 3/6, Leona, Zealot 3/6; runes 6 Calm / 6 Order 3/6, 7 Calm / 5 Order 3/6; battlefields Sunken Temple 5/5, Monastery of Hirana 4/5, The Arena's Greatest 2/5 (BANNED since 2026-07-24), Trifarian War Camp 2/5, Obelisk of Power 1/5 (BANNED since 2026-03-31); core (>=75%) Discipline 6/6 x2.7, Defy 6/6 x2.5, Fiora, Victorious 6/6 x2.5, Zenith Blade 6/6 x2.0, Lonely Poro 5/6 x3.0, Call to Glory 5/6 x2.2, Zhonya's Hourglass 5/6 x2.0, Emperor's Divide 5/6 x1.8; flex (25-74%) Irelia, Fervent 4/6, Charm 4/6, Stalwart Poro 3/6, Back Off 3/6, Nami, Headstrong 3/6, Vi, Peacekeeper 3/6, Leona, Determined 3/6, Stellacorn Herder 3/6; side deck Salvage 4/6, Ashe, Focused 3/6, Disarming Rake 3/6, Solari Shieldbearer 3/6, Not So Fast 3/6
- **Data confidence: thin; advice basis: radiance-lists** (10 complete Radiance-era lists (1 with tournament provenance: event-named, podium or official); 6 complete pre-Radiance lists)

### OGN-263 Swift Scout (Teemo), Mind/Chaos

- **Text (FACT, cards.json@2026-09-06):** "You may pay [1] to hide a card with [Hidden] instead of [Any]. // [1], [Exhaust]: Put a Teemo unit you own into your hand from your Champion Zone or the board."
- Printing codes: OGN-263, OGN-307, OGN-307*, OGN-307s, OPP-263, PR-263a
- Parsed ability 1 (HEURISTIC parse): static; cost pay [1]; effect "hide a card with [Hidden] instead of [Any]."
- Parsed ability 2 (HEURISTIC parse): activated; cost [1] + [Exhaust]; effect "Put a Teemo unit you own into your hand from your Champion Zone or the board."
- **Needs (HEURISTIC, from the quoted text):** Hidden / face-down cards ["hide a card with [Hidden] instead of [Any]."]; Returning own units to hand ["Put a Teemo unit you own into your hand from your Champion Zone or the board."]
- **Enables (HEURISTIC, from the quoted text):** Hidden / face-down cards ["hide a card with [Hidden] instead of [Any]."]; Returning own units to hand ["Put a Teemo unit you own into your hand from your Champion Zone or the board."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - OGN-121 Teemo, Strategist (2 Energy, 1 Power, 2 Might): "[Hidden] (Hide now for [Any] to react with later for [0].) // When I defend or I'm played from [Hidden], reveal the top 5 cards of your Main Deck. Deal 1 to an enemy unit here for each card with [Hidden], then recycle them."
  - OGN-197 Teemo, Scout (2 Energy, 1 Might): "[Hidden] (Hide now for [Any] to react with later for [0].) // When you play me, give me +3 [Might] this turn."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** OGN-264 Guerilla Warfare (spell, 2 Energy, 1 Power): "Return up to two cards with [Hidden] from your trash to your hand. You can hide ignoring costs this turn."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** hidden 1.00 [enables/needs] pool 26; bounce-own 0.80 [enables/needs] pool 55
- **Battlefields by text (HEURISTIC):** OGN-278 Bandle Tree (1.0; Hidden / face-down cards); SFD-207 Emperor's Dais (0.8; Returning own units to hand); SFD-210 Hall of Legends (0.6; Readies the legend); RAD-157 Bandle Scouts' Academy (0.5; Hidden / face-down cards)
- **Popularity and results (DATA):** 24 published lists since 2026-10-23 (rank 22 of 58, 1.7%)
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 11 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 7 Day 1 pilots = 0.1% of the field, 1 in Day 2 = 0.1% of Day 2; fewer than 30 Day 1 pilots, so no conversion rate is shown
- **Radiance-era lists (DATA, n=8, 1 with tournament provenance; sources: pa-fetch 8):** champion Teemo, Strategist 7/8, Teemo, Scout 1/8; runes 6 Mind / 6 Chaos 5/8, 7 Mind / 5 Chaos 2/8, 7 Chaos / 5 Mind 1/8; battlefields Bandle Tree 6/8, Grove of the God-Willow 6/8, Bandle Scouts' Academy 6/8, Packed Amphitheater 2/8, Trifarian War Camp 1/8; core (>=75%) Bedeviling Stranger 7/8 x2.6, Switcheroo 7/8 x2.6, Consult the Past 7/8 x2.3, Teemo, Strategist 7/8 x2.1, Sprite Fountain 6/8 x3.0, Sprite Call 6/8 x2.7, Thousand-Tailed Watcher 6/8 x1.3; flex (25-74%) Teemo, Scout 5/8, The Good Stuff 5/8, Kha'Zix, Mutating Horror 5/8, Nocturne, Horrifying 4/8, Pyke, Returned 4/8, Bushwhack Trap 4/8, Vex, Apathetic 4/8, Temporal Breach 4/8; side deck Baron Nashor 6/8, An Offer You Can't Refuse 4/8, Singularity 3/8, Star-Crossed 3/8, Ember Monk 2/8; shape labels from the deck-theory clustering (1 labelled): unit-aggro 1
- **Pre-Radiance lists (DATA, n=6, 6 with tournament provenance; sources: official-rq 5, pa-sample 1; newest set in list: SFD 3, UNL 3; 5 of them hold a card that is banned today):** champion Teemo, Scout 4/6, Teemo, Strategist 2/6; runes 7 Chaos / 5 Mind 3/6, 7 Mind / 5 Chaos 2/6, 6 Mind / 6 Chaos 1/6; battlefields Bandle Tree 3/5, Grove of the God-Willow 2/5, The Arena's Greatest 2/5 (BANNED since 2026-07-24), Obelisk of Power 1/5 (BANNED since 2026-03-31), Startipped Peak 1/5; core (>=75%) Switcheroo 6/6 x2.8, Tideturner 6/6 x2.5, Teemo, Scout 6/6 x1.8, Guerilla Warfare 5/6 x1.4; flex (25-74%) Consult the Past 4/6, Sprite Call 4/6, Teemo, Strategist 4/6, Stacked Deck 4/6 (BANNED since 2026-09-18), Nocturne, Horrifying 4/6, Edge of Night 4/6, Ride the Wind 4/6, Sprite Fountain 3/6; side deck Rebuke 6/6, Acceptable Losses 3/6, Turn to Dust 3/6, Singularity 3/6, Unchecked Power 3/6; shape labels from the deck-theory clustering (1 labelled): unit-aggro 1
- **Data confidence: thin; advice basis: radiance-lists** (8 complete Radiance-era lists (1 with tournament provenance: event-named, podium or official); 6 complete pre-Radiance lists)

### OGN-265 Herald of the Arcane (Viktor), Mind/Order

- **Text (FACT, cards.json@2026-09-06):** "[1], [Exhaust]: Play a 1 [Might] Recruit unit token."
- Printing codes: OGN-265, OGN-308, OGN-308*, OGN-308s, OPP-265
- Parsed ability 1 (HEURISTIC parse): activated; cost [1] + [Exhaust]; effect "Play a 1 [Might] Recruit unit token."
- **Enables (HEURISTIC, from the quoted text):** Unit tokens ["Play a 1 [Might] Recruit unit token."]; Recruit cards ["[1], [Exhaust]: Play a 1 [Might] Recruit unit token."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - OGN-117 Viktor, Innovator (4 Energy, 1 Power, 3 Might): "When you play a card on an opponent's turn, play a 1 [Might] Recruit unit token in your base."
  - OGN-246 Viktor, Leader (4 Energy, 1 Power, 4 Might): "When another non-Recruit unit you control dies, play a 1 [Might] Recruit unit token into your base."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** OGN-266 Siphon Power (spell, 2 Energy, 1 Power): "[Reaction] (Play any time, even before spells and abilities resolve.) // Choose a battlefield. Give friendly units there +1 [Might] this turn and enemy units there -1 [Might] this turn, to a minimum of 1 [Might]."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** token 0.80 [enables] pool 32; tag:Recruit 0.60 [enables] pool 14
- **Battlefields by text (HEURISTIC):** SFD-210 Hall of Legends (0.6; Readies the legend)
- **Popularity and results (DATA):** 26 published lists since 2026-10-23 (rank 21 of 58, 1.8%); riftbound.gg week-2 tier 3, 0 wins, 1 top cuts; EU Regional Championship 32% over 25 matches; registered as an extra Neeko legend in 1 fetched lists
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 11 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 56 Day 1 pilots = 0.9% of the field, 6 in Day 2 = 0.6% of Day 2; Day 2 conversion 11% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 6 first, 5 second, 9 third; with a Radiance card in the list: 1 / 0 / 0
- **Radiance-era lists (DATA, n=9, 8 with tournament provenance; sources: pa-fetch 8, r1-top3 1):** champion Viktor, Leader 9/9; runes 7 Order / 5 Mind 6/9, 6 Mind / 6 Order 3/9; battlefields Rockfall Path 8/9, Forbidding Waste 8/9, Trifarian War Camp 2/9, Vilemaw's Lair 2/9, Ravenbloom Conservatory 2/9; core (>=75%) Imperial Decree 9/9 x3.0, Cull the Weak 9/9 x2.9, Carrion Dredger 9/9 x2.8, Hidden Blade 9/9 x2.6, Bellows Breath 9/9 x2.6, Viktor, Leader 9/9 x1.0, Stupefy 8/9 x3.0, Sprite Fountain 8/9 x3.0, Salvage 8/9 x1.0, Shadow's Call 7/9 x2.3, Sprite Burst 7/9 x2.0, Thousand-Tailed Watcher 7/9 x1.4; flex (25-74%) Wages of Pain 6/9, Concert Poster 6/9, Eclipse 6/9, Facebreaker 6/9, B.F. Sword 6/9, Blood Money 5/9, Kennen, Keeper of Balance 5/9, Xin Zhao, Vigilant 4/9; side deck Decree of Insight 9/9, Salvage 8/9, Decree of Unity 7/9, Pickpocket 5/9, Dockside Lock-Up 4/9; shape labels from the deck-theory clustering (6 labelled): gear-engine 4, unit-aggro 2
- **Pre-Radiance lists (DATA, n=16, 16 with tournament provenance; sources: official-rq 7, pa-fetch 2, r1-top3 7; newest set in list: SFD 4, UNL 6, VEN 6; 6 of them hold a card that is banned today):** champion Viktor, Leader 15/16, Viktor, Innovator 1/16; runes 6 Mind / 6 Order 11/16, 7 Order / 5 Mind 5/16; battlefields Forbidding Waste 12/15, Rockfall Path 11/15, The Arena's Greatest 6/15 (BANNED since 2026-07-24), Void Gate 6/15, Treasure Hoard 5/15; core (>=75%) Cull the Weak 16/16 x3.0, Hidden Blade 16/16 x3.0, Stupefy 16/16 x2.9, Imperial Decree 16/16 x2.9, Bellows Breath 16/16 x2.5, Wages of Pain 15/16 x2.9, Xin Zhao, Vigilant 15/16 x2.8, Viktor, Leader 15/16 x1.0; flex (25-74%) Carrion Dredger 11/16, Vi, Peacekeeper 11/16, Salvage 11/16, Shadow's Call 9/16, Thousand-Tailed Watcher 8/16, Eclipse 7/16, Plundering Poro 5/16, Blood Money 5/16; side deck Salvage 16/16, Pickpocket 10/16, Thousand-Tailed Watcher 7/16, Decree of Insight 6/16, Bellows Breath 6/16; shape labels from the deck-theory clustering (2 labelled): unit-aggro 2
- **Data confidence: ok; advice basis: radiance-lists** (9 complete Radiance-era lists (8 with tournament provenance: event-named, podium or official); 16 complete pre-Radiance lists)

### OGN-267 Bounty Hunter (Miss Fortune), Body/Chaos

- **Text (FACT, cards.json@2026-09-06):** "[Exhaust]: Give a unit [Ganking] this turn. (It can move from battlefield to battlefield.)"
- Printing codes: OGN-267, OGN-309, OGN-309*, OGN-309s, OPP-267
- Parsed ability 1 (HEURISTIC parse): activated; cost [Exhaust]; effect "Give a unit [Ganking] this turn."
- **Enables (HEURISTIC, from the quoted text):** Ganking ["Give a unit [Ganking] this turn."]; Moving units ["Give a unit [Ganking] this turn."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - OGN-193 Miss Fortune, Buccaneer (4 Energy, 1 Power, 4 Might): "You may play me to an open battlefield. // Friendly units may be played to open battlefields."
  - OGN-162 Miss Fortune, Captain (5 Energy, 1 Power, 5 Might): "[Accelerate] (You may pay [1][Body] as an additional cost to have me enter ready.) // [Ganking] (I can move from battlefield to battlefield.) // The first time I move each turn, you may ready something else that's exhausted."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** OGN-268 Bullet Time (spell, 1 Energy): "[Action] (Play on your turn or in showdowns.) // Pay any amount of [Any] to deal that much damage to all enemy units at a battlefield."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** ganking 0.70 [enables] pool 19; movement 0.70 [enables] pool 63
- **Battlefields by text (HEURISTIC):** OGN-277 Back-Alley Bar (0.7; Moving units); UNL-206 Altar of Blood (0.7; Moving units); SFD-210 Hall of Legends (0.6; Readies the legend)
- **Popularity and results (DATA):** 16 published lists since 2026-10-23 (rank 34 of 58, 1.1%); riftbound.gg week-2 tier 4, 0 wins, 0 top cuts; registered as an extra Neeko legend in 4 fetched lists
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 10 of the 11 official field tables (first 2026-02-25, last 2026-09-09); last 3 events (Barcelona, Singapore, Los Angeles): 5 Day 1 pilots = 0.1% of the field, 0 in Day 2 = 0.0% of Day 2; fewer than 30 Day 1 pilots, so no conversion rate is shown
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 2 first, 1 second, 3 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=10, 1 with tournament provenance; sources: pa-fetch 10):** champion Miss Fortune, Captain 7/10, Miss Fortune, Buccaneer 3/10; runes 6 Body / 6 Chaos 5/10, 7 Chaos / 5 Body 2/10, 8 Body / 4 Chaos 2/10; battlefields Back-Alley Bar 4/10, Grove of the God-Willow 2/10, Sigil of the Storm 2/10, Zaun Warrens 2/10, Firelights' Hideout 2/10; core (>=75%) Ride the Wind 8/10 x2.4, Miss Fortune, Captain 8/10 x1.0; flex (25-74%) First Mate 7/10, The Good Stuff 6/10, Punch First 6/10, Gust 6/10, Traveling Merchant 5/10, Rampage 5/10, Lucian, Merciless 4/10, Elder Dragon 4/10; side deck Hard Bargain 5/8, An Offer You Can't Refuse 3/8, Ruin Runner 3/8, Star-Crossed 3/8, Decree of Strength 3/8; shape labels from the deck-theory clustering (1 labelled): gear-engine 1
  - Builds by Chosen Champion (DATA): Miss Fortune, Captain 7/10; Miss Fortune, Buccaneer 3/10 sets itself apart with Edge of Night, Graves, Blasting Through, Staunch Survivor, Treasure Hunter
- **Pre-Radiance lists (DATA, n=7, 7 with tournament provenance; sources: official-rq 7; newest set in list: SFD 3, UNL 4; 7 of them hold a card that is banned today):** champion Miss Fortune, Captain 7/7; runes 6 Body / 6 Chaos 5/7, 7 Body / 5 Chaos 2/7; battlefields Aspirant's Climb 6/6 (BANNED since 2026-07-24), Sigil of the Storm 5/6, Vilemaw's Lair 2/6, Forgotten Monument 2/6, Obelisk of Power 1/6 (BANNED since 2026-03-31); core (>=75%) Mobilize 7/7 x3.0, Catalyst of Aeons 7/7 x3.0, Dazzling Aurora 7/7 x3.0, Stacked Deck 7/7 x3.0 (BANNED since 2026-09-18), Gust 7/7 x2.7, Mindsplitter 7/7 x2.1, Last Rites 7/7 x2.0, Bullet Time 7/7 x1.9; flex (25-74%) Sabotage 5/7, Invert Timelines 5/7, Elder Dragon 4/7, Scryer's Bloom 4/7, Lunar Boon 4/7, Challenge 4/7, Flurry of Blades 4/7, Volibear, Imposing 3/7; side deck Unyielding Spirit 7/7, Fading Memories 5/7, Factory Recall 4/7, Sabotage 3/7, Miss Fortune, Buccaneer 3/7
- **Data confidence: thin; advice basis: radiance-lists** (10 complete Radiance-era lists (1 with tournament provenance: event-named, podium or official); 7 complete pre-Radiance lists)

### OGN-269 The Boss (Sett), Body/Order

- **Text (FACT, cards.json@2026-09-06):** "When a buffed unit you control would die, you may pay [Any] and exhaust me to spend its buff and recall it exhausted instead. (Send it to base. This isn't a move.) // When you conquer, ready me."
- Printing codes: OGN-269, OGN-310, OGN-310*, OGN-310s, OPP-269
- Parsed ability 1 (HEURISTIC parse): replacement; cost pay [Any] + exhaust me; condition "When a buffed unit you control would die"; effect "spend its buff and recall it exhausted instead."
- Parsed ability 2 (HEURISTIC parse): triggered; condition "When you conquer"; effect "ready me."
- **Rewards (HEURISTIC, from the quoted text):** Buffs ["When a buffed unit you control would die"]; Conquering battlefields ["When you conquer"]; Saving own units from death ["When a buffed unit you control would die"]
- **Enables (HEURISTIC, from the quoted text):** Buffs ["spend its buff and recall it exhausted instead."]; Moving units ["spend its buff and recall it exhausted instead."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - OGN-240 Sett, Kingpin (4 Energy, 1 Power, 5 Might): "[Tank] (I must be assigned combat damage first.) // I get +1 [Might] for each buffed friendly unit at my battlefield."
  - OGN-164 Sett, Brawler (5 Energy, 1 Power, 4 Might): "When I'm played and when I conquer, buff me. (If I don't have a buff, I get a +1 [Might] buff.) // Spend my buff: Give me +4 [Might] this turn."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** OGN-270 Showstopper (spell, 1 Energy, 1 Power): "Buff a friendly unit in your base, then move it to a battlefield. (If it doesn't have a buff, it gets a +1 [Might] buff.)"
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** buff 1.00 [enables/rewards] pool 29; conquer 1.00 [rewards] pool 12; protection 1.00 [rewards] pool 20; movement 0.70 [enables] pool 39
- **Battlefields by text (HEURISTIC):** UNL-206 Altar of Blood (1.2; Moving units, Saving own units from death); SFD-210 Hall of Legends (1.1; Conquering battlefields, Readies the legend); OGN-282 Monastery of Hirana (1.0; Buffs, Conquering battlefields); OGN-283 Navori Fighting Pit (1.0; Buffs); UNL-218 Valley of Idols (1.0; Buffs)
- **Popularity and results (DATA):** 32 published lists since 2026-10-23 (rank 14 of 58, 2.2%); riftbound.gg week-2 tier 3, 0 wins, 4 top cuts; EU Regional Championship 61% over 18 matches; registered as an extra Neeko legend in 5 fetched lists
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 11 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 8 Day 1 pilots = 0.1% of the field, 0 in Day 2 = 0.0% of Day 2; fewer than 30 Day 1 pilots, so no conversion rate is shown
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 5 first, 0 second, 3 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=12, 6 with tournament provenance; sources: pa-fetch 12):** champion Sett, Kingpin 10/12, Sett, Brawler 2/12; runes 7 Body / 5 Order 6/12, 6 Body / 6 Order 4/12, 8 Body / 4 Order 1/12; battlefields Monastery of Hirana 11/12, Valley of Idols 10/12, Grove of the God-Willow 5/12, Packed Amphitheater 3/12, Hunters' Circle 2/12; core (>=75%) Pit Rookie 12/12 x2.9, Pillaged Armory 12/12 x2.9, Showstopper 12/12 x2.8, Punch First 12/12 x2.7, Call to Glory 11/12 x2.9, First Mate 11/12 x2.5, Rampage 11/12 x2.5, Sett, Kingpin 11/12 x1.1, Fiora, Victorious 10/12 x2.7, Vi, Peacekeeper 10/12 x1.8, Rengar, Trophy Hunter 9/12 x2.0; flex (25-74%) Kinkou Initiate 8/12, Cithria of Cloudfield 8/12, Sabotage 8/12, Irresistible Faefolk 7/12, Trifarian Captain 7/12, Nidalee, Cat Form 6/12, Arena Bar 4/12, Repulse 4/12; side deck Salvage 9/12, Repulse 7/12, Decree of Unity 5/12, Decree of Strength 5/12, Sabotage 5/12; shape labels from the deck-theory clustering (6 labelled): unit-aggro 4, spell-tempo 1, gear-engine 1
  - Builds by Chosen Champion (DATA): Sett, Kingpin 10/12 sets itself apart with Irresistible Faefolk, Call to Glory, Rampage; Sett, Brawler 2/12 sets itself apart with Hold 'Em, Ki Barrier, Arena Bar, Repulse, Challenge
- **Pre-Radiance lists (DATA, n=5, 5 with tournament provenance; sources: official-rq 5; newest set in list: SFD 2, UNL 3; 0 of them hold a card that is banned today):** champion Sett, Kingpin 4/5, Sett, Brawler 1/5; runes 7 Body / 5 Order 4/5, 9 Body / 3 Order 1/5; battlefields Monastery of Hirana 4/4, Grove of the God-Willow 3/4, Sunken Temple 2/4, Valley of Idols 2/4, Seat of Power 1/4; core (>=75%) First Mate 5/5 x3.0, Pit Rookie 5/5 x3.0, Fiora, Victorious 5/5 x3.0, Showstopper 5/5 x3.0, Punch First 5/5 x3.0, Sabotage 5/5 x2.6, Call to Glory 5/5 x2.6, Challenge 5/5 x2.2; flex (25-74%) Irresistible Faefolk 3/5, Lucian, Merciless 3/5, Repulse 3/5, Vi, Peacekeeper 3/5, Rengar, Trophy Hunter 2/5, Akshan, Mischievous 2/5; side deck Akshan, Mischievous 5/5, Ashe, Focused 3/5, Repulse 3/5, Vi, Peacekeeper 3/5, Lucian, Merciless 2/5
- **Data confidence: ok; advice basis: radiance-lists** (12 complete Radiance-era lists (6 with tournament provenance: event-named, podium or official); 5 complete pre-Radiance lists)

### OGS-017 Dark Child - Starter (Annie), Fury/Chaos

- **Text (FACT, cards.json@2026-09-06):** "At the end of your turn, ready 2 runes."
- Printing codes: OGS-017, OPP-017
- Parsed ability 1 (HEURISTIC parse): triggered; condition "At the end of your turn"; effect "ready 2 runes."
- **Enables (HEURISTIC, from the quoted text):** Readying runes ["ready 2 runes."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - OGS-010 Annie, Stubborn (4 Energy, 1 Power, 3 Might): "When you play me, return a spell from your trash to your hand."
  - OGS-001 Annie, Fiery (5 Energy, 1 Power, 4 Might): "Your spells and abilities deal 1 Bonus Damage. (Each instance of damage the spell deals is increased by 1.)"
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** OGS-018 Tibbers (unit, 8 Energy, 2 Power, 7 Might): "When you play me, deal 3 to all units at battlefields."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** ready-runes 0.60 [enables] pool 0; spell-matters 0.35 [champion or signature text only] pool 72
- **Battlefields by text (HEURISTIC):** no battlefield text interacts with this legend text; use the data below
- **Popularity and results (DATA):** 9 published lists since 2026-10-23 (rank 50 of 58, 0.6%); registered as an extra Neeko legend in 2 fetched lists
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 11 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 9 Day 1 pilots = 0.1% of the field, 2 in Day 2 = 0.2% of Day 2; fewer than 30 Day 1 pilots, so no conversion rate is shown
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 6 first, 5 second, 4 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=10, 0 with tournament provenance; sources: pa-fetch 10):** champion Annie, Stubborn 6/10, Annie, Fiery 4/10; runes 6 Fury / 6 Chaos 4/10, 7 Fury / 5 Chaos 2/10, 8 Fury / 4 Chaos 2/10; battlefields Zaun Warrens 7/10, Void Gate 4/10, Seat of Power 4/10, Hunters' Circle 3/10, Vilemaw's Lair 2/10; core (>=75%) Traveling Merchant 8/10 x2.9, Annie, Stubborn 8/10 x1.1; flex (25-74%) Gust 7/10, Flash 7/10, Kai'Sa, Survivor 6/10, Falling Star 6/10, Noxus Hopeful 5/10, Inferna 5/10, Void Seeker 5/10, Long Sword 5/10; side deck Decree of Rage 4/6, An Offer You Can't Refuse 2/6, Switcheroo 2/6, Rebuke 2/6, Acceptable Losses 1/6
  - Builds by Chosen Champion (DATA): Annie, Stubborn 6/10 sets itself apart with Sneaky Deckhand, Reckless Innovator, Kai'Sa, Survivor, Tideturner, Bedeviling Stranger; Annie, Fiery 4/10 sets itself apart with Bilgewater Tracker, Tibbers, Piercing Light, Seal of Rage, Amateur Demolitionist
- **Pre-Radiance lists (DATA, n=7, 7 with tournament provenance; sources: official-rq 6, r1-top3 1; newest set in list: SFD 3, UNL 4; 7 of them hold a card that is banned today):** champion Annie, Stubborn 7/7; runes 6 Fury / 6 Chaos 3/7, 7 Fury / 5 Chaos 3/7, 12 Chaos 1/7; battlefields Zaun Warrens 6/6, The Arena's Greatest 5/6 (BANNED since 2026-07-24), Seat of Power 5/6, Reaver's Row 1/6 (BANNED since 2026-03-31), Minefield 1/6; core (>=75%) Stacked Deck 7/7 x3.0 (BANNED since 2026-09-18), Noxus Hopeful 7/7 x2.9, Annie, Stubborn 7/7 x1.0, Kai'Sa, Survivor 6/7 x3.0, Traveling Merchant 6/7 x3.0, Flash 6/7 x3.0, Rengar, Pouncing 6/7 x3.0, Long Sword 6/7 x2.0; flex (25-74%) Ferrous Forerunner 5/7, Overzealous Fan 5/7, Hard Bargain 5/7, Inferna 4/7, Vex, Apathetic 4/7, Star-Crossed 4/7, Rebuke 4/7, Abandon 4/7; side deck Thermo Beam 6/7, Factory Recall 6/7, Switcheroo 6/7, Against the Odds 4/7, Falling Star 3/7
- **Data confidence: thin; advice basis: radiance-lists** (10 complete Radiance-era lists (0 with tournament provenance: event-named, podium or official); 7 complete pre-Radiance lists)

### OGS-019 Wuju Bladesman - Starter (Master Yi), Calm/Body

- **Text (FACT, cards.json@2026-09-06):** "While a friendly unit defends alone, it gets +2 [Might]."
- Printing codes: OGS-019, OPP-019
- Other legend with the same champion tag: UNL-191
- Parsed ability 1 (HEURISTIC parse): static; condition "While a friendly unit defends alone"; effect "it gets +2 [Might]."
- **Rewards (HEURISTIC, from the quoted text):** Defending ["While a friendly unit defends alone"]; Lone defender ["While a friendly unit defends alone"]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - UNL-113 Master Yi, Tempered (4 Energy, 4 Might): "[Hunt 2] (When I conquer or hold, gain 2 XP.) // [Level 6][>] I have [Deflect] and [Ganking]. (While you have 6+ XP, opponents must pay [Any] to choose me with a spell or ability and I can move from battlefield to battlefield.)"
  - OGS-004 Yi, Meditative (5 Energy, 1 Power, 4 Might): "While you have 8+ runes, I have +4 [Might]."
  - OGS-009 Yi, Honed (7 Energy, 1 Power, 6 Might): "[Ganking] (I can move from battlefield to battlefield.) // I enter ready."
  - UNL-059 Master Yi, Unstoppable (12 Energy, 3 Power, 12 Might): "[Level 3][>] I cost [2][Calm] less. (While you have 3+ XP, get the effect.) // [Level 6][>] I cost [4][Calm][Calm] less instead. // [Level 11][>] I cost [6][Calm][Calm][Calm] less instead. // [Level 16][>] I can't be chosen by enemy spells and abilities."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** OGS-020 Highlander (spell, 4 Energy): "[Reaction] (Play any time, even before spells and abilities resolve.) // Choose a friendly unit. The next time it dies this turn, recall it exhausted instead. (Send it to base. This isn't a move.)"; UNL-192 Alpha Strike (spell, 3 Energy, 1 Power): "[Action] (Play on your turn or in showdowns.) // Choose a friendly unit. It deals damage equal to its Might split among enemy units at battlefields. Then for each unit this kills, do this: Gain 1 XP."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** defend 1.00 [rewards] pool 35; defend-alone 1.00 [rewards] pool 28
- **Battlefields by text (HEURISTIC):** UNL-208 Black Flame Altar (1.0; Defending); UNL-210 Forbidding Waste (1.0; Defending, Lone defender); VEN-159 Kinkou Temple (1.0; Defending); OGN-279 Fortified Position (0.5; Defending); RAD-161 Durand Memorial (0.5; Defending)
- **Popularity and results (DATA):** 19 published lists since 2026-10-23 (rank 28 of 58, 1.3%); riftbound.gg week-2 tier 2, 2 wins, 5 top cuts; EU Regional Championship 46% over 106 matches; results are per champion name and cannot be split from UNL-191
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 11 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 398 Day 1 pilots = 6.7% of the field, 89 in Day 2 = 8.5% of Day 2; Day 2 conversion 22% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 32 first, 22 second, 33 third; with a Radiance card in the list: 0 / 0 / 1
- **Radiance-era lists (DATA, n=12, 6 with tournament provenance; sources: pa-fetch 11, r1-top3 1):** champion Master Yi, Tempered 12/12; runes 7 Body / 5 Calm 11/12, 8 Body / 4 Calm 1/12; battlefields Emperor's Dais 10/12, Seat of Power 9/12, Star Spring 9/12, Grove of the God-Willow 5/12, Fortified Position 1/12; core (>=75%) Discipline 12/12 x3.0, Pit Rookie 12/12 x3.0, Punch First 12/12 x2.9, Rengar, Trophy Hunter 12/12 x2.9, Lonely Poro 12/12 x2.8, Charm 12/12 x2.7, Defy 12/12 x2.6, Rampage 12/12 x2.0, Master Yi, Tempered 12/12 x1.0, Ruin Runner 11/12 x2.1, Zhonya's Hourglass 11/12 x1.9, Scuttle Crab 10/12 x2.9; flex (25-74%) Tomb-Raider Barbara 7/12, Graves, Blasting Through 5/12, Legion Marauder 3/12, Not So Fast 3/12, Repulse 3/12, Alpha Strike 3/12; side deck Decree of Focus 9/12, Hush 9/12, Graves, Blasting Through 9/12, Decree of Strength 9/12, Tomb-Raider Barbara 7/12; shape labels from the deck-theory clustering (4 labelled): spell-tempo 4
- **Pre-Radiance lists (DATA, n=82, 82 with tournament provenance; sources: official-rq 4, pa-fetch 3, pa-sample 1, r1-top3 74; newest set in list: SFD 3, UNL 63, VEN 16; 18 of them hold a card that is banned today):** champion Master Yi, Tempered 69/76, Yi, Honed 7/76; runes 6 Calm / 6 Body 42/82, 7 Body / 5 Calm 40/82; battlefields Star Spring 59/81, Emperor's Dais 29/81, Seat of Power 28/81, Vilemaw's Lair 26/81, Amateur Recital 15/81; core (>=75%) Defy 82/82 x3.0, Charm 82/82 x2.9, Discipline 81/82 x3.0, Punch First 79/82 x2.5, Zhonya's Hourglass 78/82 x2.6, Lonely Poro 76/82 x3.0, Master Yi, Tempered 74/82 x1.0, En Garde 73/82 x2.2; flex (25-74%) Ruin Runner 49/82, Back Off 43/82, Vilemaw 40/82, Sabotage 40/82, Challenge 34/82, Whiteflame Protector 32/82, Tasty Faefolk 31/82, Pit Rookie 28/82; side deck Sabotage 62/82, Akshan, Mischievous 55/82, Not So Fast 39/82, Disarming Rake 35/82, Ruin Runner 31/82; shape labels from the deck-theory clustering (4 labelled): spell-tempo 4
- **Data confidence: ok; advice basis: radiance-lists** (12 complete Radiance-era lists (6 with tournament provenance: event-named, podium or official); 82 complete pre-Radiance lists)

### OGS-021 Lady of Luminosity - Starter (Lux), Mind/Order

- **Text (FACT, cards.json@2026-09-06):** "When you play a spell that costs [5] or more, draw 1."
- Printing codes: OGS-021, OPP-021
- Parsed ability 1 (HEURISTIC parse): triggered; condition "When you play a spell that costs [5] or more"; effect "draw 1."
- **Rewards (HEURISTIC, from the quoted text):** Expensive spells (4+/5+ Energy) ["When you play a spell that costs [5] or more"]; Spells ["When you play a spell that costs [5] or more"]
- **Enables (HEURISTIC, from the quoted text):** Card draw ["draw 1."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - OGS-014 Lux, Crownguard (4 Energy, 2 Might): "[Exhaust]: [Reaction] — [Add] [2]. Use only to play spells. (Abilities that add resources can't be reacted to.)"
  - OGS-006 Lux, Illuminated (6 Energy, 1 Power, 5 Might): "When you play a spell that costs [5] or more, give me +3 [Might] this turn."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** OGS-022 Final Spark (spell, 8 Energy): "[Action] (Play on your turn or in showdowns.) // Deal 8 to a unit."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** expensive-spells 1.00 [rewards] pool 28; spell-matters 1.00 [rewards] pool 75; draw 0.60 [enables] pool 37
- **Battlefields by text (HEURISTIC):** OGN-296 Void Gate (1.0; Spells); SFD-215 Ravenbloom Conservatory (1.0; Spells); UNL-211 Forgotten Library (1.0; Expensive spells (4+/5+ Energy), Spells); UNL-216 The Academy (1.0; Spells); VEN-158 Heisho, Shell of the World (1.0; Spells)
- **Popularity and results (DATA):** 4 published lists since 2026-10-23 (rank 58 of 58, 0.3%)
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 11 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 29 Day 1 pilots = 0.5% of the field, 6 in Day 2 = 0.6% of Day 2; fewer than 30 Day 1 pilots, so no conversion rate is shown
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 2 first, 0 second, 2 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=7, 0 with tournament provenance; sources: pa-fetch 7):** champion Lux, Crownguard 7/7; runes 6 Mind / 6 Order 6/7, 8 Mind / 4 Order 1/7; battlefields Rockfall Path 3/7, Forgotten Library 3/7, Sigil of the Storm 2/7, Void Gate 2/7, Trifarian War Camp 1/7; core (>=75%) Lux, Crownguard 7/7 x1.4, Singularity 6/7 x2.0; flex (25-74%) Imperial Decree 5/7, Progress Day 5/7, Rousing Display 5/7, The Ruination 5/7, Bellows Breath 4/7, Honest Broker 4/7, Sprite Burst 4/7, Drag Under 4/7; side deck Salvage 5/6, Decree of Unity 3/6, Raucous Anthem 2/6, Dockside Lock-Up 2/6, Wages of Pain 2/6
- **Pre-Radiance lists (DATA, n=12, 9 with tournament provenance; sources: official-rq 6, pa-fetch 3, r1-top3 3; newest set in list: SFD 4, UNL 7, VEN 1; 7 of them hold a card that is banned today):** champion Lux, Crownguard 12/12; runes 6 Mind / 6 Order 6/12, 7 Mind / 5 Order 6/12; battlefields Aspirant's Climb 6/11 (BANNED since 2026-07-24), Vilemaw's Lair 5/11, Forgotten Monument 5/11, The Papertree 5/11, Sigil of the Storm 4/11; core (>=75%) Lux, Crownguard 12/12 x1.1, Time Warp 11/12 x2.2, Progress Day 10/12 x2.6, Stupefy 9/12 x2.8; flex (25-74%) Cull the Weak 8/12, Wages of Pain 8/12, Singularity 8/12, Seal of Insight 8/12, The Ruination 8/12, Soaring Scout 7/12, Plundering Poro 6/12, Sprite Burst 6/12; side deck Salvage 8/12, Wages of Pain 6/12, Ashe, Focused 6/12, Garbage Grabber 4/12, Turn to Dust 4/12
- **Data confidence: thin; advice basis: radiance-lists** (7 complete Radiance-era lists (0 with tournament provenance: event-named, podium or official); 12 complete pre-Radiance lists)

### OGS-023 Might of Demacia - Starter (Garen), Body/Order

- **Text (FACT, cards.json@2026-09-06):** "When you conquer, if you have 4+ units at that battlefield, draw 2."
- Printing codes: OGS-023, OPP-023
- Parsed ability 1 (HEURISTIC parse): triggered; condition "When you conquer, if you have 4+ units at that battlefield"; effect "draw 2."
- **Rewards (HEURISTIC, from the quoted text):** Conquering battlefields ["When you conquer, if you have 4+ units at that battlefield"]; Go wide (many bodies) ["When you conquer, if you have 4+ units at that battlefield"]
- **Enables (HEURISTIC, from the quoted text):** Card draw ["draw 2."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - OGS-007 Garen, Rugged (6 Energy, 1 Power, 5 Might): "[Assault 2], [Shield 2] (+2 [Might] while I'm an attacker or defender.)"
  - OGS-013 Garen, Commander (6 Energy, 1 Power, 5 Might): "Other friendly units have +1 [Might] here."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** OGS-024 Decisive Strike (spell, 5 Energy, 1 Power): "[Action] (Play on your turn or in showdowns.) // Give friendly units +2 [Might] this turn."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** conquer 1.00 [rewards] pool 12; wide 1.00 [rewards] pool 21; draw 0.60 [enables] pool 27
- **Battlefields by text (HEURISTIC):** OGN-282 Monastery of Hirana (0.5; Conquering battlefields); OGN-286 Reckoner's Arena (0.5; Conquering battlefields); OGN-287 Sigil of the Storm (0.5; Conquering battlefields); OGN-289 Targon's Peak (0.5; Conquering battlefields); OGN-291 The Candlelit Sanctum (0.5; Conquering battlefields)
- **Popularity and results (DATA):** 5 published lists since 2026-10-23 (rank 57 of 58, 0.4%)
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 9 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 1 Day 1 pilots = 0.0% of the field, 0 in Day 2 = 0.0% of Day 2; fewer than 30 Day 1 pilots, so no conversion rate is shown
- **Radiance-era lists (DATA, n=8, 0 with tournament provenance; sources: pa-fetch 8):** champion Garen, Commander 5/8, Garen, Rugged 3/8; runes 6 Body / 6 Order 2/8, 8 Order / 4 Body 2/8, 12 Order 2/8; battlefields Trifarian War Camp 6/8, Monastery of Hirana 2/8, The Grand Plaza 2/8, Black Rose Sanctum 2/8, Ruined Monastery 2/8; core (>=75%) Vanguard Captain 6/8 x3.0, Cull the Weak 6/8 x2.5; flex (25-74%) Seal of Unity 5/8, Trifarian Captain 5/8, Hidden Blade 5/8, Garen, Commander 5/8, Xin Zhao, Vigilant 4/8, Galio, Indefatigable 4/8, Vi, Peacekeeper 4/8, Confront 3/8; side deck Salvage 4/6, Decree of Strength 3/6, Unyielding Spirit 3/6, Forge of the Future 2/6, Decree of Unity 2/6
  - Builds by Chosen Champion (DATA): Garen, Commander 5/8 sets itself apart with Galio, Indefatigable, Cull the Weak, Vanguard Captain, Confront, Concert Poster; Garen, Rugged 3/8 sets itself apart with Rengar, Trophy Hunter, Vi, Peacekeeper, Pit Rookie, Call to Glory, Pillaged Armory
- **Pre-Radiance lists (DATA, n=8, 7 with tournament provenance; sources: official-rq 7, pa-fetch 1; newest set in list: OGS 1, SFD 3, UNL 4; 6 of them hold a card that is banned today):** champion Garen, Commander 4/8, Garen, Rugged 4/8; runes 6 Body / 6 Order 6/8, 7 Body / 5 Order 2/8; battlefields Aspirant's Climb 6/7 (BANNED since 2026-07-24), Forgotten Monument 4/7, The Papertree 4/7, Sigil of the Storm 2/7, The Grand Plaza 2/7; core (>=75%) Mobilize 7/8 x3.0, Catalyst of Aeons 7/8 x3.0, Dazzling Aurora 7/8 x3.0, Confront 7/8 x2.9, Forge of the Future 7/8 x2.9, Vanguard Armory 7/8 x2.6, Harnessed Dragon 6/8 x2.7; flex (25-74%) Rally the Troops 5/8, Cull the Weak 5/8, Garen, Rugged 5/8, Elder Dragon 4/8, Deadbloom Predator 4/8, Blood Money 4/8, Sabotage 4/8, Garen, Commander 4/8; side deck Salvage 7/7, Sabotage 6/7, Unyielding Spirit 5/7, Divine Judgment 3/7, Rengar, Trophy Hunter 1/7
- **Data confidence: thin; advice basis: radiance-lists** (8 complete Radiance-era lists (0 with tournament provenance: event-named, podium or official); 8 complete pre-Radiance lists)

### RAD-139 Boy Who Shattered Time (Ekko), Fury/Mind

- **Text (FACT, gallery@2026-11-11):** "[Empower] — [1], [Exhaust] (Use only if not Empowered.) // Disempower me, [Exhaust]: Reduce the cost of the next unit you play this turn by [2][Any] and give it "Kill me at end of turn.""
- Printing codes: RAD-139, RAD-168
- Parsed ability 1 (HEURISTIC parse): activated; cost [1] + [Exhaust]; restriction "Use only if not Empowered."; effect "Empower this."
- Parsed ability 2 (HEURISTIC parse): activated; cost Disempower me + [Exhaust]; effect "Reduce the cost of the next unit you play this turn by [2][Any] and give it "Kill me at end of turn.""
- **Needs (HEURISTIC, from the quoted text):** Empower ["Disempower me"]
- **Enables (HEURISTIC, from the quoted text):** Empower ["Empower this."]; Units dying ["Reduce the cost of the next unit you play this turn by [2][Any] and give it "Kill me at end of turn.""]; Cost reduction ["Reduce the cost of the next unit you play this turn by [2][Any] and give it "Kill me at end of turn.""]; Short-lived units ["Reduce the cost of the next unit you play this turn by [2][Any] and give it "Kill me at end of turn.""]; Playing units ["Reduce the cost of the next unit you play this turn by [2][Any] and give it "Kill me at end of turn.""]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - RAD-061 Ekko, Ingenious (3 Energy, 4 Might): "As an additional cost to play me, return a friendly unit to its owner's hand. // [Ganking] (I can move from battlefield to battlefield.)"
  - OGN-110 Ekko, Recurrent (5 Energy, 1 Power, 5 Might) **banned from 2026-09-18**: "[Accelerate] (You may pay [1][Mind] as an additional cost to have me enter ready.) // [Deathknell] — Recycle me to ready your runes. (When I die, get the effect.)"
  - RAD-021 Ekko, Revolutionary (5 Energy, 1 Power, 4 Might): "I enter ready. // [Assault] (+1 [Might] while I'm an attacker.) // [Action][>] Discard 1, [1][Fury]: Banish me, then play me to your base, ignoring my cost."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** RAD-140 Chronobreak (spell, 2 Energy): "As an additional cost to play this, pay any amount of Power. // Banish that many units you control, then for each, its owner plays that unit back to the same location or to their base, ignoring its cost. (You choose the order.)"
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** empower 0.80 [enables/needs] pool 13; death 0.67 [enables] pool 9; cost-reduction 0.60 [enables] pool 11; self-sacrifice 0.60 [enables] pool 53; unit 0.60 [enables] pool 26
- **Battlefields by text (HEURISTIC):** VEN-163 Risen Altar (0.8; Empower); RAD-159 Black Rose Sanctum (0.7; Units dying); RAD-163 Hunters' Circle (0.6; Cost reduction); RAD-165 Rakelstake (0.6; Playing units); SFD-210 Hall of Legends (0.6; Readies the legend)
- **Popularity and results (DATA):** 59 published lists since 2026-10-23 (rank 5 of 58, 4.1%)
- **Official Regional Qualifier field:** not in any official field table (the last one is Los Angeles, published 2026-09-30)
- **Radiance-era lists (DATA, n=7, 5 with tournament provenance; sources: pa-fetch 7):** champion Ekko, Ingenious 5/7, Ekko, Revolutionary 2/7; runes 6 Fury / 6 Mind 4/7, 7 Fury / 5 Mind 3/7; battlefields Rockfall Path 3/7, Seat of Power 3/7, Ripper's Bay 3/7, Void Gate 2/7, Firelights' Hideout 2/7; core (>=75%) Stupefy 6/7 x3.0, Thousand-Tailed Watcher 6/7 x2.3, Falling Star 6/7 x2.2, Shock Blast 6/7 x2.2, Ekko, Ingenious 6/7 x1.2; flex (25-74%) Noxus Hopeful 5/7, Bilgewater Tracker 5/7, Temporal Breach 5/7, Plundering Poro 4/7, Brynhir Thundersong 4/7, Pyke, Dockside Butcher 4/7, Ekko, Revolutionary 4/7, Chronobreak 4/7; side deck Decree of Insight 6/6, Decree of Rage 5/6, Unchecked Power 4/6, Brittle Steel 3/6, Bilgewater Tracker 3/6; shape labels from the deck-theory clustering (4 labelled): unit-aggro 2, gear-engine 1, big-control 1
  - Builds by Chosen Champion (DATA): Ekko, Ingenious 5/7 sets itself apart with Time Warp, Falling Star, Stupefy, Thousand-Tailed Watcher, Shock Blast; Ekko, Revolutionary 2/7 sets itself apart with Chronobreak, Unlicensed Armory, Riptide Rex, Banner of Conquest, Lingering Animus
- **Pre-Radiance lists (DATA):** n=0
- **Data confidence: ok; advice basis: radiance-lists** (7 complete Radiance-era lists (5 with tournament provenance: event-named, podium or official); 0 complete pre-Radiance lists)

### RAD-141 Hexplosives Expert (Ziggs), Fury/Chaos

- **Text (FACT, gallery@2026-11-11):** "[1][Any], [Exhaust]: Play a Bomb gear token to a battlefield. (It has [Deploy]. When it dies, deal 2 to an enemy there and kill your other Bombs there.)"
- Printing codes: RAD-141, RAD-169
- Parsed ability 1 (HEURISTIC parse): activated; cost [1][Any] + [Exhaust]; effect "Play a Bomb gear token to a battlefield."
- **Enables (HEURISTIC, from the quoted text):** Gear tokens (Gold, Bomb) ["Play a Bomb gear token to a battlefield."]; Bomb cards ["[1][Any], [Exhaust]: Play a Bomb gear token to a battlefield."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - RAD-112 Ziggs, Explosive (4 Energy, 4 Might): "[1], [Exhaust]: Play a Bomb gear token to a battlefield. (It has [Deploy]. When it dies, deal 2 to an enemy there and kill your other Bombs there.) // When I defend, you may kill a friendly gear to give me +2 [Might] this turn."
  - RAD-023 Ziggs, Short-Fused (5 Energy, 1 Power, 5 Might): "When you play me, play a Bomb gear token to a battlefield. (It has [Deploy]. When it dies, deal 2 to an enemy there and kill your other Bombs there.) // Abilities of friendly gear deal 1 Bonus Damage."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** RAD-142 Hexplosive Minefield (spell, 2 Energy, 1 Power): "[Action] (Play on your turn or in showdowns.) // Kill any number of friendly Bomb tokens. At end of turn, play that many Bomb tokens to a single battlefield."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** gear-token 0.80 [enables] pool 16; tag:Bomb 0.60 [enables] pool 6; death 0.32 [champion or signature text only] pool 6
- **Battlefields by text (HEURISTIC):** SFD-210 Hall of Legends (0.6; Readies the legend)
- **Popularity and results (DATA):** 40 published lists since 2026-10-23 (rank 8 of 58, 2.8%)
- **Official Regional Qualifier field:** not in any official field table (the last one is Los Angeles, published 2026-09-30)
- **Radiance-era lists (DATA, n=8, 6 with tournament provenance; sources: pa-fetch 8):** champion Ziggs, Explosive 5/7, Ziggs, Short-Fused 2/7; runes 6 Fury / 6 Chaos 3/8, 7 Fury / 5 Chaos 2/8, 8 Fury / 4 Chaos 1/8; battlefields Void Gate 6/8, Rakelstake 4/8, Sigil of the Storm 2/8, Frozen Fortress 2/8, Heisho, Shell of the World 2/8; core (>=75%) Detonate 8/8 x2.5, Pack of Wonders 6/8 x2.8, Shimmering Swimmer 6/8 x2.7, Ziggs, Explosive 6/8 x1.5; flex (25-74%) Amateur Demolitionist 5/8, Falling Star 5/8, Seal of Rage 5/8, Treasure Trove 5/8, Bilgewater Tracker 5/8, Acceptable Losses 5/8, Runeblade Anvil 4/8, The Good Stuff 4/8; side deck Star-Crossed 5/6, Decree of Rage 4/6, Kha'Zix, Mutating Horror 3/6, Acceptable Losses 3/6, Vex, Apathetic 3/6; shape labels from the deck-theory clustering (4 labelled): gear-engine 3, unit-aggro 1
  - Builds by Chosen Champion (DATA): Ziggs, Explosive 5/7 sets itself apart with Fizz, Trickster, The List, Vex, Apathetic; Ziggs, Short-Fused 2/7 sets itself apart with Runeblade Anvil, Detonation Amplifier, Iron Ballista, Annie, Fiery, Amateur Demolitionist
- **Pre-Radiance lists (DATA):** n=0
- **Data confidence: ok; advice basis: radiance-lists** (8 complete Radiance-era lists (6 with tournament provenance: event-named, podium or official); 0 complete pre-Radiance lists)

### RAD-143 Iron Revenant (Mordekaiser), Fury/Order

- **Text (FACT, gallery@2026-11-11):** "[Reaction][>] Banish a unit or gear from your trash, [Exhaust]: [Add] [Any]. Spend this Power only to play units or gear. (Abilities that add resources can't be reacted to.)"
- Printing codes: RAD-143, RAD-170
- Parsed ability 1 (HEURISTIC parse): activated; reaction speed; cost Banish a unit or gear from your trash + [Exhaust]; restriction "Spend this Power only to play units or gear."; effect "[Add] [Any]."
- **Rewards (HEURISTIC, from the quoted text):** Gear (non-Equipment included) ["Spend this Power only to play units or gear."]; Playing units ["Spend this Power only to play units or gear."]
- **Needs (HEURISTIC, from the quoted text):** Gear (non-Equipment included) ["Banish a unit or gear from your trash"]; Banishing own cards ["Banish a unit or gear from your trash"]; Trash as a resource ["Banish a unit or gear from your trash"]
- **Enables (HEURISTIC, from the quoted text):** Adding resources ["[Add] [Any]."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - RAD-020 Mordekaiser, Twice Slain (7 Energy, 1 Power, 5 Might): "[Accelerate] (You may pay [1][Fury] as an additional cost to have me enter ready.) // [Assault 3] (+3 [Might] while I'm an attacker.) // Once each turn, if I would die, you may kill a friendly unit to heal me, exhaust me, and recall me instead."
  - RAD-137 Mordekaiser, Dominating (9 Energy, 2 Power, 8 Might): "When you play me or when I attack, you may discard 1 to kill a unit or gear."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** RAD-144 Realm of Death (spell, 2 Energy, 1 Power): "Give an enemy unit -2 [Might] this turn and a friendly unit +2 [Might] this turn. They deal damage equal to their Mights to each other."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** gear 1.00 [needs/rewards] pool 37; unit 1.00 [rewards] pool 26; banish 0.80 [needs] pool 11; trash 0.80 [needs] pool 18; energy-ramp 0.60 [enables] pool 6; death 0.35 [champion or signature text only] pool 29
- **Battlefields by text (HEURISTIC):** RAD-162 Firelights' Hideout (1.0; Playing units); RAD-165 Rakelstake (1.0; Gear (non-Equipment included), Playing units); SFD-221 Veiled Temple (1.0; Gear (non-Equipment included)); OGN-281 Hallowed Tomb (0.8; Trash as a resource); SFD-212 Minefield (0.8; Trash as a resource)
- **Popularity and results (DATA):** 77 published lists since 2026-10-23 (rank 2 of 58, 5.3%)
- **Official Regional Qualifier field:** not in any official field table (the last one is Los Angeles, published 2026-09-30)
- **Radiance-era lists (DATA, n=12, 10 with tournament provenance; sources: pa-fetch 12):** champion Mordekaiser, Dominating 11/12, Mordekaiser, Twice Slain 1/12; runes 7 Fury / 5 Order 4/12, 7 Order / 5 Fury 4/12, 6 Fury / 6 Order 3/12; battlefields Zaun Warrens 10/12, Ruined Monastery 7/12, Minefield 7/12, Trifarian War Camp 3/12, Black Rose Sanctum 3/12; core (>=75%) Realm of Death 12/12 x2.8, Carrion Dredger 11/12 x2.8, Mordekaiser, Dominating 11/12 x1.0, Kai'Sa, Survivor 10/12 x2.8, Long Sword 9/12 x2.3; flex (25-74%) Honest Broker 8/12, Vanguard Captain 8/12, Bilgewater Tracker 8/12, Hidden Blade 8/12, Vi, Peacekeeper 8/12, Trifarian Captain 7/12, Shen, Kinkou 7/12, Imperial Decree 7/12; side deck Decree of Unity 9/11, Salvage 9/11, Ferrous Forerunner 9/11, Decree of Rage 8/11, Falling Star 6/11; shape labels from the deck-theory clustering (7 labelled): unit-aggro 7
- **Pre-Radiance lists (DATA):** n=0
- **Data confidence: ok; advice basis: radiance-lists** (12 complete Radiance-era lists (10 with tournament provenance: event-named, podium or official); 0 complete pre-Radiance lists)

### RAD-145 Lady of Clockwork (Orianna), Calm/Mind

- **Text (FACT, gallery@2026-11-11):** "At the start of your Main Phase, you may pay [1] to choose a friendly gear. It becomes a unit gear with Might equal to its Energy cost until you choose another gear with me."
- Printing codes: RAD-145, RAD-171
- Parsed ability 1 (HEURISTIC parse): triggered; cost pay [1]; condition "At the start of your Main Phase"; effect "choose a friendly gear. It becomes a unit gear with Might equal to its Energy cost until you choose another gear with me."
- **Rewards (HEURISTIC, from the quoted text):** Gear (non-Equipment included) ["choose a friendly gear. It becomes a unit gear with Might equal to its Energy cost until you choose another gear with me."]
- **Needs (HEURISTIC, from the quoted text):** Gear (non-Equipment included) ["choose a friendly gear. It becomes a unit gear with Might equal to its Energy cost until you choose another gear with me."]
- **Enables (HEURISTIC, from the quoted text):** Gear (non-Equipment included) ["choose a friendly gear. It becomes a unit gear with Might equal to its Energy cost until you choose another gear with me."]; Gear that becomes a unit ["choose a friendly gear. It becomes a unit gear with Might equal to its Energy cost until you choose another gear with me."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - RAD-042 Orianna, Exquisite (3 Energy, 4 Might): "[Shield] (+1 [Might] while I'm a defender.) // I don't deal combat damage unless there's a friendly gear here."
  - RAD-068 Orianna, Mechanical Marvel (5 Energy, 5 Might): "Once each turn, while I'm at a battlefield, you may pay [1][Any] less to play a gear."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** RAD-146 The Ball (gear, 5 Energy, 1 Power): "[Deploy] (Play this only to a battlefield. When an opponent holds here, kill this.) // [Ganking] (While this is a unit, it can move from battlefield to battlefield.) // When you play or move this, choose one — // - Draw 1. // - Deal 2 to enemy units here."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** gear 1.00 [enables/needs/rewards] pool 42; unit-gear 0.60 [enables] pool 16
- **Battlefields by text (HEURISTIC):** SFD-221 Veiled Temple (1.0; Gear (non-Equipment included)); RAD-163 Hunters' Circle (0.5; Gear (non-Equipment included)); RAD-165 Rakelstake (0.5; Gear (non-Equipment included)); SFD-213 Ornn's Forge (0.5; Gear (non-Equipment included)); VEN-161 Piltovan Forge (0.5; Gear (non-Equipment included))
- **Popularity and results (DATA):** 70 published lists since 2026-10-23 (rank 4 of 58, 4.9%); riftbound.gg week-2 tier 4, 0 wins, 2 top cuts; EU Regional Championship 50% over 24 matches
- **Official Regional Qualifier field:** not in any official field table (the last one is Los Angeles, published 2026-09-30)
- **Radiance-era lists (DATA, n=10, 10 with tournament provenance; sources: pa-fetch 10):** champion Orianna, Exquisite 8/10, Orianna, Mechanical Marvel 2/10; runes 7 Calm / 5 Mind 4/10, 8 Calm / 4 Mind 2/10, 6 Calm / 6 Mind 2/10; battlefields Veiled Temple 10/10, Ornn's Forge 8/10, Rockfall Path 5/10, Void Gate 3/10, Targon's Peak 1/10; core (>=75%) Defy 10/10 x3.0, Discipline 10/10 x2.9, Cloth Armor 8/10 x2.6, Orianna, Exquisite 8/10 x1.0; flex (25-74%) The Ball 7/10, Mask of Foresight 6/10, Stupefy 6/10, Patched Porobot 6/10, Sterak's Gage 6/10, Singularity 6/10, Ravenbloom Student 5/10, Blossoming Dreamroot 5/10; side deck Not So Fast 10/10, Decree of Insight 9/10, Decree of Focus 7/10, Hush 7/10, Disarming Rake 6/10; shape labels from the deck-theory clustering (9 labelled): spell-tempo 5, gear-engine 4
  - Builds by Chosen Champion (DATA): Orianna, Exquisite 8/10 sets itself apart with Cloth Armor, Sterak's Gage, Patched Porobot, Not So Fast, Zhonya's Hourglass; Orianna, Mechanical Marvel 2/10 sets itself apart with Lecturing Yordle, Orb of Regret, Stupefy, Energy Conduit, Invigorating Bloom
- **Pre-Radiance lists (DATA):** n=0
- **Data confidence: ok; advice basis: radiance-lists** (10 complete Radiance-era lists (10 with tournament provenance: event-named, podium or official); 0 complete pre-Radiance lists)

### RAD-147 Pride of Nazumah (K'Sante), Calm/Body

- **Text (FACT, gallery@2026-11-11):** "[1], [Exhaust]: Give a friendly unit "I have [Assault] equal to my [Shield]" this turn. (+1 [Might] for each instance of Assault while it's an attacker.)"
- Printing codes: RAD-147, RAD-172
- Parsed ability 1 (HEURISTIC parse): activated; cost [1] + [Exhaust]; effect "Give a friendly unit "I have [Assault] equal to my [Shield]" this turn."
- **Rewards (HEURISTIC, from the quoted text):** Defending ["Give a friendly unit "I have [Assault] equal to my [Shield]" this turn."]; Shield ["Give a friendly unit "I have [Assault] equal to my [Shield]" this turn."]
- **Enables (HEURISTIC, from the quoted text):** Defending ["Give a friendly unit "I have [Assault] equal to my [Shield]" this turn."]; Shield ["Give a friendly unit "I have [Assault] equal to my [Shield]" this turn."]; Attacking (Assault) ["Give a friendly unit "I have [Assault] equal to my [Shield]" this turn."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - RAD-045 K'Sante, Dauntless (4 Energy, 1 Power, 4 Might): "[Shield] (+1 [Might] while I'm a defender.) // When I attack or defend, double the [Shield] of a unit you control here this turn."
  - RAD-086 K'Sante, Courageous (5 Energy, 4 Might): "[Accelerate] (You may pay [1][Body] as an additional cost to have me enter ready.) // [Shield 2] (+2 [Might] while I'm a defender.) // When I hold, channel 1 rune."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** RAD-148 Ntofo Strikes (spell, 2 Energy, 1 Power): "[Action] (Play on your turn or in showdowns.) // Give a friendly unit [Shield 2] this turn, then deal damage equal to its [Shield] to an enemy unit. (A unit with Shield has +1 [Might] for each instance of Shield while it's a defender.)"
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** defend 1.00 [enables/rewards] pool 36; shield 1.00 [enables/rewards] pool 25; assault 0.60 [enables] pool 5
- **Battlefields by text (HEURISTIC):** UNL-208 Black Flame Altar (2.0; Defending, Shield); OGN-279 Fortified Position (1.0; Defending, Shield); VEN-159 Kinkou Temple (1.0; Defending); SFD-210 Hall of Legends (0.6; Readies the legend); RAD-161 Durand Memorial (0.5; Defending)
- **Popularity and results (DATA):** 36 published lists since 2026-10-23 (rank 11 of 58, 2.5%)
- **Official Regional Qualifier field:** not in any official field table (the last one is Los Angeles, published 2026-09-30)
- **Radiance-era lists (DATA, n=11, 7 with tournament provenance; sources: pa-fetch 11):** champion K'Sante, Dauntless 6/11, K'Sante, Courageous 5/11; runes 6 Calm / 6 Body 8/11, 7 Calm / 5 Body 2/11, 7 Body / 5 Calm 1/11; battlefields Fortified Position 8/11, Grove of the God-Willow 7/11, Amateur Recital 4/11, Durand Memorial 3/11, Seat of Power 2/11; core (>=75%) Mutated Mouser 11/11 x2.9, Ntofo Strikes 11/11 x2.6, Defy 10/11 x2.9, Discipline 10/11 x2.7, Nazuman Ntofo 10/11 x2.5, Punch First 10/11 x2.3, Block 9/11 x2.0; flex (25-74%) Stalwart Poro 8/11, Scuttle Crab 8/11, Consult the Heavens 7/11, K'Sante, Dauntless 7/11, K'Sante, Courageous 7/11, Stoic Ferryman 6/11, Charm 6/11, Ruin Runner 5/11; side deck Decree of Focus 6/9, Ruin Runner 5/9, Tomb-Raider Barbara 5/9, Sabotage 5/9, Hush 5/9; shape labels from the deck-theory clustering (6 labelled): spell-tempo 6
  - Builds by Chosen Champion (DATA): K'Sante, Dauntless 6/11 sets itself apart with Sabotage; K'Sante, Courageous 5/11 sets itself apart with Stalwart Poro
- **Pre-Radiance lists (DATA):** n=0
- **Data confidence: ok; advice basis: radiance-lists** (11 complete Radiance-era lists (7 with tournament provenance: event-named, podium or official); 0 complete pre-Radiance lists)

### RAD-149 The Exile (Riven), Calm/Chaos

- **Text (FACT, gallery@2026-11-11):** "Units you play to battlefields you control enter ready."
- Printing codes: RAD-149, RAD-173
- Parsed ability 1 (HEURISTIC parse): static; condition "Units you play to battlefields you control"; effect "enter ready."
- **Rewards (HEURISTIC, from the quoted text):** Playing units ["Units you play to battlefields you control"]
- **Enables (HEURISTIC, from the quoted text):** Readying units ["enter ready."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - VEN-041 Riven, Shattered (3 Energy, 1 Power, 3 Might): "[Weaponmaster] (When you play me, you may [Equip] one of your Equipment to me for [Any] less, even if it's already attached.) // When I attack, choose an enemy unit here. Deal 2 to it for each Equipment attached to me."
  - RAD-043 Riven, Broken Blade (4 Energy, 4 Might): "When I become exhausted, choose one that hasn't been chosen this turn — // - [Buff] me. (Give me a +1 [Might] buff if I don't have one.) // - Spend my buff to [Stun] an enemy unit. (It doesn't deal combat damage this turn.) // - Spend my buff to ready me."
  - RAD-114 Riven, Deserter (5 Energy, 1 Power, 5 Might): "When another friendly unit becomes exhausted, give me +1 [Might] this turn. // Exhaust a friendly unit: Ready a unit. Use this ability only once each turn."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** RAD-150 Blade of the Exile (gear, 3 Energy, 1 Power, 3 Might): "[Equip] — [Any] or exhaust a friendly unit. (Pay the cost: Attach this to a unit you control.) // [Ganking] (I can move from battlefield to battlefield.)"
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** unit 1.00 [rewards] pool 26; ready 0.67 [enables] pool 19
- **Battlefields by text (HEURISTIC):** RAD-162 Firelights' Hideout (1.0; Playing units); RAD-165 Rakelstake (0.5; Playing units)
- **Popularity and results (DATA):** 76 published lists since 2026-10-23 (rank 3 of 58, 5.3%); riftbound.gg week-2 tier S, 5 wins, 16 top cuts; EU Regional Championship 54% over 524 matches; registered as an extra Neeko legend in 2 fetched lists
- **Official Regional Qualifier field:** not in any official field table (the last one is Los Angeles, published 2026-09-30)
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 5 first, 2 second, 1 third; with a Radiance card in the list: 5 / 2 / 1
- **Radiance-era lists (DATA, n=26, 26 with tournament provenance; sources: pa-fetch 19, r1-top3 7):** champion Riven, Broken Blade 25/26, Riven, Deserter 1/26; runes 7 Chaos / 5 Calm 13/26, 6 Calm / 6 Chaos 13/26; battlefields Star Spring 26/26, Hunters' Circle 19/26, Emperor's Dais 19/26, Rakelstake 8/26, Windswept Hillock 3/26; core (>=75%) Blade of the Exile 26/26 x2.9, Stellacorn Herder 26/26 x2.9, Defy 26/26 x2.6, Reckless Innovator 26/26 x2.6, Riven, Broken Blade 26/26 x1.1, Discipline 25/26 x2.9, Tideturner 25/26 x2.5, Bedeviling Stranger 25/26 x2.4, Blitzcrank, Impassive 23/26 x1.8, Star-Crossed 23/26 x1.3, Zhonya's Hourglass 22/26 x2.9, Astral Heron 21/26 x3.0; flex (25-74%) Scuttle Crab 17/26, Switcheroo 17/26, Not So Fast 17/26, Traveling Merchant 11/26, Ki Burst 11/26; side deck An Offer You Can't Refuse 24/26, Decree of Focus 23/26, Hush 22/26, Vex, Apathetic 20/26, Not So Fast 15/26; shape labels from the deck-theory clustering (18 labelled): spell-tempo 18
- **Pre-Radiance lists (DATA):** n=0
- **Data confidence: ok; advice basis: radiance-lists** (26 complete Radiance-era lists (26 with tournament provenance: event-named, podium or official); 0 complete pre-Radiance lists)

### RAD-151 Starry-Eyed Songstress (Seraphine), Mind/Order

- **Text (FACT, gallery@2026-11-11):** "As an additional cost to play a spell, you may exhaust me and three friendly units to reduce the cost of that spell by [2]."
- Printing codes: RAD-151, RAD-174
- Parsed ability 1 (HEURISTIC parse): static; cost exhaust me + three friendly units; condition "As an additional cost to play a spell"; effect "reduce the cost of that spell by [2]."
- **Rewards (HEURISTIC, from the quoted text):** Spells ["As an additional cost to play a spell"]
- **Needs (HEURISTIC, from the quoted text):** Go wide (many bodies) ["three friendly units"]
- **Enables (HEURISTIC, from the quoted text):** Spells ["reduce the cost of that spell by [2]."]; Cost reduction ["reduce the cost of that spell by [2]."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - RAD-065 Seraphine, Inspiring (4 Energy, 1 Power, 3 Might): "[Disarm 2] (When I attack, give an enemy unit here -2 [Might] this turn.) // Once each turn, when you exhaust three or more friendly units at the same time, you may draw 1."
  - RAD-138 Seraphine, Not Alone (5 Energy, 1 Power, 1 Might): "When you play me or when I become exhausted, play a 1 [Might] Recruit unit token to your base. // I have +1 [Might] for each other exhausted unit you control."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** RAD-152 Encore (spell, 3 Energy, 1 Power): "Choose two — // - Deal 2 to a unit. // - Play two 1 [Might] Recruit unit tokens. // - Give up to two units each +1 [Might] this turn. // - Look at the top 2 cards of your Main Deck, draw 1 and recycle the other."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** spell-matters 1.00 [enables/rewards] pool 75; wide 0.80 [needs] pool 33; cost-reduction 0.60 [enables] pool 13; draw 0.32 [champion or signature text only] pool 38; token 0.32 [champion or signature text only] pool 33
- **Battlefields by text (HEURISTIC):** OGN-296 Void Gate (1.0; Spells); SFD-215 Ravenbloom Conservatory (1.0; Spells); UNL-216 The Academy (1.0; Spells); VEN-158 Heisho, Shell of the World (1.0; Spells); VEN-164 Sandswept Tomb (1.0; Spells)
- **Popularity and results (DATA):** 40 published lists since 2026-10-23 (rank 9 of 58, 2.8%); riftbound.gg week-2 tier 4, 0 wins, 0 top cuts
- **Official Regional Qualifier field:** not in any official field table (the last one is Los Angeles, published 2026-09-30)
- **Radiance-era lists (DATA, n=9, 5 with tournament provenance; sources: pa-fetch 9):** champion Seraphine, Not Alone 6/9, Seraphine, Inspiring 3/9; runes 7 Order / 5 Mind 4/9, 6 Mind / 6 Order 4/9, 8 Order / 4 Mind 1/9; battlefields Forbidding Waste 6/9, Trifarian War Camp 5/9, Vilemaw's Lair 3/9, Void Gate 2/9, Black Rose Sanctum 2/9; core (>=75%) Encore 9/9 x2.3, Concert Poster 8/9 x3.0, Cull the Weak 7/9 x2.3; flex (25-74%) Imperial Decree 6/9, Hidden Blade 6/9, Vanguard Captain 6/9, Bellows Breath 6/9, Raucous Anthem 6/9, Seraphine, Not Alone 6/9, Wages of Pain 5/9, Seraphine, Inspiring 5/9; side deck Decree of Insight 5/5, Salvage 4/5, Decree of Unity 4/5, Pickpocket 2/5, Singularity 2/5; shape labels from the deck-theory clustering (3 labelled): gear-engine 2, big-control 1
  - Builds by Chosen Champion (DATA): Seraphine, Not Alone 6/9 sets itself apart with Heimerdinger, Academy Instructor, Strigian Oracle; Seraphine, Inspiring 3/9 sets itself apart with Carrion Dredger, Trifarian Captain, Stupefy, Eclipse, Hidden Blade
- **Pre-Radiance lists (DATA):** n=0
- **Data confidence: ok; advice basis: radiance-lists** (9 complete Radiance-era lists (5 with tournament provenance: event-named, podium or official); 0 complete pre-Radiance lists)

### RAD-153 Agony's Embrace (Evelynn), Body/Chaos

- **Text (FACT, gallery@2026-11-11):** "Once each turn, when you play a card from face down, draw 1. Then, if it's not your turn, discard 1."
- Printing codes: RAD-153, RAD-175
- Parsed ability 1 (HEURISTIC parse): triggered; condition "Once each turn, when you play a card from face down"; effect "draw 1. Then, if it's not your turn, discard 1."
- **Rewards (HEURISTIC, from the quoted text):** Hidden / face-down cards ["Once each turn, when you play a card from face down"]; Playing cards from outside the hand ["Once each turn, when you play a card from face down"]
- **Enables (HEURISTIC, from the quoted text):** Discard ["draw 1. Then, if it's not your turn, discard 1."]; Card draw ["draw 1. Then, if it's not your turn, discard 1."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - UNL-141 Evelynn, Entrancing (2 Energy, 2 Might): "[Hidden] (Hide now for [Any] to react with later for [0].) // [Backline] (I must be assigned combat damage last.) // When you play me from face down on your turn, you may move an enemy unit at a different location to my battlefield."
  - RAD-109 Evelynn, In Control (4 Energy, 1 Power, 4 Might): "[Disarm] (When I attack, give an enemy unit here -1 [Might] this turn.) // When I hold, if you control a facedown card here, score 1 point."
  - RAD-090 Evelynn, Consuming (5 Energy, 1 Power, 5 Might): "[Ambush] (You may play me as a [Reaction] to a battlefield where you have units.) // When you play a card from face down, ready me and give me +1 [Might] this turn."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** RAD-154 Last Caress (spell, 2 Energy): "[Reaction] (Play any time, even before spells and abilities resolve.) // The next unit you play this turn (even from face down) can be played to any battlefield. When you play it, [Buff] it. (Give it a +1 [Might] buff if it doesn't have one.)"
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** hidden 1.00 [rewards] pool 18; play-from-elsewhere 1.00 [rewards] pool 32; discard 0.60 [enables] pool 14; draw 0.60 [enables] pool 35
- **Battlefields by text (HEURISTIC):** OGN-278 Bandle Tree (1.0; Hidden / face-down cards); RAD-157 Bandle Scouts' Academy (0.5; Hidden / face-down cards)
- **Popularity and results (DATA):** 100 published lists since 2026-10-23 (rank 1 of 58, 6.9%); registered as an extra Neeko legend in 1 fetched lists
- **Official Regional Qualifier field:** not in any official field table (the last one is Los Angeles, published 2026-09-30)
- **Radiance-era lists (DATA, n=10, 10 with tournament provenance; sources: pa-fetch 10):** champion Evelynn, Entrancing 9/10, Evelynn, Consuming 1/10; runes 6 Body / 6 Chaos 5/10, 8 Chaos / 4 Body 3/10, 7 Chaos / 5 Body 1/10; battlefields Bandle Scouts' Academy 9/10, Rakelstake 7/10, Startipped Peak 6/10, Bandle Tree 3/10, Grove of the God-Willow 3/10; core (>=75%) Hold 'Em 10/10 x2.2, Evelynn, Entrancing 10/10 x1.1, Gutter Guardian 9/10 x2.6, Pyke, Returned 9/10 x2.4, Rengar, Trophy Hunter 9/10 x1.9, Switcheroo 9/10 x1.7, Rampage 8/10 x2.2, Vex, Apathetic 8/10 x2.1, Boots of Swiftness 8/10 x2.0; flex (25-74%) Edge of Night 7/10, Star-Crossed 7/10, Momentary Companion 6/10, Punch First 6/10, K'Sante, Courageous 6/10, Bedeviling Stranger 5/10, Fizz, Trickster 5/10, Last Caress 5/10; side deck Graves, Blasting Through 7/9, An Offer You Can't Refuse 5/9, Ravenbloom Prefect 4/9, Rampage 4/9, Decree of Strength 3/9; shape labels from the deck-theory clustering (9 labelled): unit-aggro 9
- **Pre-Radiance lists (DATA):** n=0
- **Data confidence: ok; advice basis: radiance-lists** (10 complete Radiance-era lists (10 with tournament provenance: event-named, podium or official); 0 complete pre-Radiance lists)

### RAD-155 Exemplar of Demacia (Jarvan IV), Body/Order

- **Text (FACT, gallery@2026-11-11):** "When you play a gear with [Deploy], you may exhaust me and pay [Any] to move a friendly unit to that battlefield."
- Printing codes: RAD-155, RAD-176
- Parsed ability 1 (HEURISTIC parse): triggered; cost exhaust me + pay [Any]; condition "When you play a gear with [Deploy]"; effect "move a friendly unit to that battlefield."
- **Rewards (HEURISTIC, from the quoted text):** Deploy gear ["When you play a gear with [Deploy]"]; Gear (non-Equipment included) ["When you play a gear with [Deploy]"]
- **Enables (HEURISTIC, from the quoted text):** Moving units ["move a friendly unit to that battlefield."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - RAD-091 Jarvan IV, Martial Paragon (4 Energy, 1 Power, 4 Might): "Your gear with [Deploy] have [Action]. (They can be played on your turn or in showdowns.) // When I conquer, if there is a friendly gear with [Deploy] here, channel 1 rune exhausted."
  - RAD-133 Jarvan IV, Royal Heir (7 Energy, 1 Power, 7 Might): "[Assault] (+1 [Might] while I'm attacking.) // [Tank] (I must be assigned combat damage first.) // When I attack, you may move a unit you control to my battlefield."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** RAD-156 Demacian Standard (gear, 2 Energy, 1 Power): "[Deploy] (Play this only to a battlefield. When an opponent holds here, kill this.) // When one or more friendly units attack here, give one of them +2 [Might] this turn. // When you hold here, you may return this to its owner's hand."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** deploy 1.00 [rewards] pool 7; gear 1.00 [rewards] pool 41; movement 0.70 [enables] pool 38
- **Battlefields by text (HEURISTIC):** SFD-221 Veiled Temple (1.0; Gear (non-Equipment included)); OGN-277 Back-Alley Bar (0.7; Moving units); UNL-206 Altar of Blood (0.7; Moving units); SFD-210 Hall of Legends (0.6; Readies the legend); RAD-163 Hunters' Circle (0.5; Gear (non-Equipment included))
- **Popularity and results (DATA):** 36 published lists since 2026-10-23 (rank 12 of 58, 2.5%)
- **Official Regional Qualifier field:** not in any official field table (the last one is Los Angeles, published 2026-09-30)
- **Radiance-era lists (DATA, n=10, 4 with tournament provenance; sources: pa-fetch 10):** champion Jarvan IV, Martial Paragon 8/10, Jarvan IV, Royal Heir 2/10; runes 7 Body / 5 Order 4/10, 6 Body / 6 Order 3/10, 8 Body / 4 Order 3/10; battlefields Hunters' Circle 8/10, Monastery of Hirana 6/10, Rakelstake 3/10, Ornn's Forge 3/10, Forbidding Waste 3/10; core (>=75%) Pillaged Armory 10/10 x3.0, Demacian Standard 10/10 x2.5, Trifarian Captain 9/10 x2.9, Pit Rookie 9/10 x2.7, Skystrike Squadron 9/10 x2.6, Rampage 9/10 x2.4, Punch First 9/10 x2.3, Concert Poster 9/10 x2.1, Nidalee, Cat Form 8/10 x2.6, Call to Glory 8/10 x2.4, Jarvan IV, Martial Paragon 8/10 x1.0; flex (25-74%) Rengar, Trophy Hunter 7/10, Lucian, Merciless 5/10, Irresistible Faefolk 5/10, Kinkou Initiate 4/10, First Mate 4/10, Vi, Peacekeeper 4/10, Overloaded Traveler 3/10, Sabotage 3/10; side deck Salvage 8/9, Repulse 6/9, Decree of Strength 6/9, Ruin Runner 5/9, Decree of Unity 5/9; shape labels from the deck-theory clustering (3 labelled): unit-aggro 2, gear-engine 1
  - Builds by Chosen Champion (DATA): Jarvan IV, Martial Paragon 8/10 sets itself apart with Skystrike Squadron; Jarvan IV, Royal Heir 2/10 sets itself apart with Lucian, Merciless, Irresistible Faefolk, Yone, Blademaster, Boneshiver
- **Pre-Radiance lists (DATA):** n=0
- **Data confidence: ok; advice basis: radiance-lists** (10 complete Radiance-era lists (4 with tournament provenance: event-named, podium or official); 0 complete pre-Radiance lists)

### SFD-181 Mechanized Menace (Rumble), Fury/Mind

- **Text (FACT, cards.json@2026-09-06):** "Your Mechs have [Shield]. (+1 [Might] while they're defenders.)"
- Printing codes: OPP-181, SFD-181, SFD-240
- Parsed ability 1 (HEURISTIC parse): static; condition "Your Mechs"; effect "have [Shield]."
- **Rewards (HEURISTIC, from the quoted text):** Mech cards ["Your Mechs have [Shield]."]
- **Enables (HEURISTIC, from the quoted text):** Defending ["have [Shield]."]; Shield ["have [Shield]."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - SFD-026 Rumble, Hotheaded (4 Energy, 4 Might): "Your Mechs each have [Assault]. (+1 [Might] while we're attackers.) // When I conquer, you may recycle another friendly unit to play a Mech from your trash. Reduce its Energy cost by the Might of the unit you recycled."
  - SFD-089 Rumble, Scrapper (5 Energy, 1 Power, 4 Might): "Your Mechs have +1 [Might] (including me). // When I hold, play a 3 [Might] Mech unit token to your base."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** SFD-182 Danger Zone (spell, 1 Energy, 1 Power): "[Reaction] (Play any time, even before spells and abilities resolve.) // [Repeat] [1][Any] (You may pay the additional cost to repeat this spell's effect.) // Give your Mechs +1 [Might] this turn."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** tag:Mech 1.00 [rewards] pool 20; defend 0.60 [enables] pool 13; shield 0.60 [enables] pool 5
- **Battlefields by text (HEURISTIC):** OGN-279 Fortified Position (1.2; Defending, Shield); RAD-161 Durand Memorial (0.6; Defending); SFD-215 Ravenbloom Conservatory (0.6; Defending); UNL-210 Forbidding Waste (0.6; Defending); VEN-166 Threshold of the Gray (0.6; Defending)
- **Popularity and results (DATA):** 14 published lists since 2026-10-23 (rank 38 of 58, 1.0%)
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 11 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 77 Day 1 pilots = 1.3% of the field, 4 in Day 2 = 0.4% of Day 2; Day 2 conversion 5% against 18% for the whole field
- **Radiance-era lists (DATA, n=9, 1 with tournament provenance; sources: pa-fetch 9):** champion Rumble, Hotheaded 8/9, Rumble, Scrapper 1/9; runes 8 Fury / 4 Mind 3/9, 7 Fury / 5 Mind 2/9, 6 Fury / 6 Mind 2/9; battlefields Zaun Warrens 7/9, Rockfall Path 4/9, Seat of Power 4/9, Startipped Peak 2/9, The Candlelit Sanctum 2/9; core (>=75%) Stupefy 9/9 x3.0, Forecaster 9/9 x3.0, Incorrigible Construct 9/9 x2.9, Bubble Bot 9/9 x2.9, Gem Jammer 9/9 x2.8, Rumble, Hotheaded 9/9 x1.8, Antagonistic Apparatus 8/9 x2.6, Falling Star 8/9 x2.0, Ferrous Forerunner 8/9 x1.8, Cleave 7/9 x2.3, Long Sword 7/9 x2.0; flex (25-74%) Temporal Breach 6/9, Consult the Past 6/9, Clanging Sentry 6/9, Patched Porobot 5/9, Thousand-Tailed Watcher 5/9, Rumble, Scrapper 5/9, Cloth Armor 4/9, Eclipse 3/9; side deck Decree of Insight 7/9, Thermo Beam 7/9, Brittle Steel 6/9, Decree of Rage 6/9, Against the Odds 5/9; shape labels from the deck-theory clustering (1 labelled): unit-aggro 1
- **Pre-Radiance lists (DATA, n=8, 8 with tournament provenance; sources: official-rq 7, pa-fetch 1; newest set in list: SFD 3, UNL 2, VEN 3; 1 of them hold a card that is banned today):** champion Rumble, Hotheaded 7/8, Rumble, Scrapper 1/8; runes 6 Fury / 6 Mind 5/8, 7 Fury / 5 Mind 3/8; battlefields Zaun Warrens 3/7, Trifarian War Camp 2/7, Seat of Power 2/7, Grove of the God-Willow 1/7, Hallowed Tomb 1/7; core (>=75%) Forecaster 8/8 x3.0, Gem Jammer 8/8 x2.9, Bubble Bot 8/8 x2.9, Ferrous Forerunner 8/8 x2.8, Rumble, Hotheaded 8/8 x2.8, Falling Star 8/8 x2.1, Thousand-Tailed Watcher 7/8 x2.6, Stupefy 6/8 x3.0; flex (25-74%) Plundering Poro 5/8, Kai'Sa, Survivor 4/8, Cleave 4/8, Cloth Armor 4/8, Production Surge 3/8, Retreat 3/8, Patched Porobot 3/8, Temporal Breach 3/8; side deck Brynhir Thundersong 6/8, Thermo Beam 5/8, Bellows Breath 4/8, Brittle Steel 3/8, Unchecked Power 3/8; shape labels from the deck-theory clustering (1 labelled): unit-aggro 1
- **Data confidence: thin; advice basis: radiance-lists** (9 complete Radiance-era lists (1 with tournament provenance: event-named, podium or official); 8 complete pre-Radiance lists)

### SFD-183 Purifier (Lucian), Fury/Body

- **Text (FACT, cards.json@2026-09-06):** "Your Equipment each give [Assault]. (+1 [Might] while equipped unit is an attacker.)"
- Printing codes: OPP-183, SFD-183, SFD-241
- Parsed ability 1 (HEURISTIC parse): static; condition "Your Equipment"; effect "each give [Assault]."
- **Rewards (HEURISTIC, from the quoted text):** Equipment ["Your Equipment"]
- **Enables (HEURISTIC, from the quoted text):** Attacking (Assault) ["each give [Assault]."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - SFD-028 Lucian, Gunslinger (3 Energy, 2 Might): "[Assault] (+1 [Might] while I'm an attacker.) // When I attack, deal damage equal to my [Assault] to an enemy unit here."
  - SFD-113 Lucian, Merciless (3 Energy, 3 Might): "[Weaponmaster] (When you play me, you may [Equip] one of your Equipment to me for [Any] less, even if it's already attached.) // The first time I conquer each turn, ready me."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** SFD-184 Relentless Pursuit (spell, 2 Energy, 1 Power): "[Action] (Play on your turn or in showdowns.) // Move a friendly unit. You may attach an Equipment with the same controller to it. This turn, that unit has "When I conquer, you may move me to my base.""
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** equipment 1.00 [rewards] pool 25; assault 0.70 [enables] pool 32; conquer 0.32 [champion or signature text only] pool 20
- **Battlefields by text (HEURISTIC):** SFD-221 Veiled Temple (1.0; Equipment); SFD-208 Forge of the Fluft (0.5; Equipment)
- **Popularity and results (DATA):** 12 published lists since 2026-10-23 (rank 45 of 58, 0.8%); EU Regional Championship 38% over 16 matches
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 11 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 88 Day 1 pilots = 1.5% of the field, 11 in Day 2 = 1.0% of Day 2; Day 2 conversion 12% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 0 first, 1 second, 0 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=8, 1 with tournament provenance; sources: pa-fetch 8):** champion Lucian, Merciless 8/8; runes 6 Fury / 6 Body 5/8, 7 Fury / 5 Body 2/8, 7 Body / 5 Fury 1/8; battlefields Forge of the Fluft 6/8, Sunken Temple 5/8, Windswept Hillock 4/8, Reckoner's Arena 2/8, Trapping Grounds 2/8; core (>=75%) Relentless Pursuit 8/8 x2.8, Lucian, Merciless 8/8 x1.4, Kai'Sa, Survivor 7/8 x2.7, Punch First 7/8 x2.4, First Mate 6/8 x3.0, Long Sword 6/8 x2.8; flex (25-74%) Trinity Force 5/8, Skyfall of Areion 5/8, Portable Portal 5/8, Kinkou Initiate 4/8, Irresistible Faefolk 4/8, Falling Star 4/8, Brynhir Thundersong 4/8, Rampage 4/8; side deck Sabotage 5/8, Rampage 4/8, Ruin Runner 4/8, Akshan, Mischievous 3/8, Decree of Rage 3/8; shape labels from the deck-theory clustering (1 labelled): unit-aggro 1
- **Pre-Radiance lists (DATA, n=11, 11 with tournament provenance; sources: official-rq 10, pa-fetch 1; newest set in list: SFD 3, UNL 4, VEN 4; 1 of them hold a card that is banned today):** champion Lucian, Merciless 11/11; runes 7 Body / 5 Fury 6/11, 6 Fury / 6 Body 4/11, 8 Body / 4 Fury 1/11; battlefields Forge of the Fluft 9/10, Sunken Temple 6/10, The Candlelit Sanctum 4/10, Zaun Warrens 4/10, Windswept Hillock 3/10; core (>=75%) Kai'Sa, Survivor 11/11 x3.0, First Mate 11/11 x2.7, Relentless Pursuit 11/11 x2.7, Punch First 11/11 x2.5, Lucian, Merciless 11/11 x1.4, Doran's Blade 10/11 x3.0, Trinity Force 9/11 x2.6, Sabotage 9/11 x2.0; flex (25-74%) Long Sword 8/11, Ruin Runner 8/11, Irresistible Faefolk 7/11, Skyfall of Areion 7/11, Kinkou Initiate 7/11, Gem Jammer 6/11, Noxus Hopeful 6/11, Blighted Battleaxe 6/11; side deck Ferrous Forerunner 8/11, Akshan, Mischievous 7/11, Unyielding Spirit 7/11, Sabotage 7/11, Rampage 4/11; shape labels from the deck-theory clustering (1 labelled): unit-aggro 1
- **Data confidence: thin; advice basis: radiance-lists** (8 complete Radiance-era lists (1 with tournament provenance: event-named, podium or official); 11 complete pre-Radiance lists)

### SFD-185 Glorious Executioner (Draven), Fury/Chaos

- **Text (FACT, cards.json@2026-09-06):** "When you win a combat, draw 1. (You win if only your units remain after combat.)"
- Printing codes: OPP-185, SFD-185, SFD-242
- Parsed ability 1 (HEURISTIC parse): triggered; condition "When you win a combat"; effect "draw 1."
- **Rewards (HEURISTIC, from the quoted text):** Winning combats ["When you win a combat"]
- **Enables (HEURISTIC, from the quoted text):** Card draw ["draw 1."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - SFD-020 Draven, Vanquisher (4 Energy, 4 Might) **banned from 2026-03-31**: "When I win a combat, play a Gold gear token exhausted. // When I attack or defend, you may pay [Fury]. If you do, give me +2 [Might] this turn."
  - OGN-028 Draven, Showboat (5 Energy, 1 Power, 3 Might): "My Might is increased by your points."
  - SFD-148 Draven, Audacious (6 Energy, 1 Power, 6 Might): "[Deflect] (Opponents must pay [Any] to choose me with a spell or ability.) // The first time I win a combat each turn, you score 1 point. // When I die in combat, choose an opponent. They score 1 point."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** SFD-186 Spinning Axe (gear, 2 Energy, 1 Power): "[Quick-Draw] (This has [Reaction]. When you play it, attach it to a unit you control.) // [Equip] [Any] ([Any]: Attach this to a unit you control.) // [Temporary] (If this is unattached, kill it at the start of its controller's Beginning Phase, before scoring.)"
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** combat-win 1.00 [rewards] pool 38; draw 0.60 [enables] pool 30
- **Battlefields by text (HEURISTIC):** no battlefield text interacts with this legend text; use the data below
- **Popularity and results (DATA):** 18 published lists since 2026-10-23 (rank 30 of 58, 1.2%); registered as an extra Neeko legend in 4 fetched lists
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 11 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 181 Day 1 pilots = 3.0% of the field, 18 in Day 2 = 1.7% of Day 2; Day 2 conversion 10% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 6 first, 6 second, 7 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=8, 1 with tournament provenance; sources: pa-fetch 8):** champion Draven, Showboat 7/8, Draven, Audacious 1/8; runes 6 Fury / 6 Chaos 6/8, 8 Chaos / 4 Fury 1/8, 7 Chaos / 5 Fury 1/8; battlefields Grove of the God-Willow 3/8, Targon's Peak 3/8, Zaun Warrens 2/8, Bandle Scouts' Academy 2/8, Rakelstake 2/8; core (>=75%) Spinning Axe 8/8 x2.9, Overzealous Fan 7/8 x2.6, Vex, Apathetic 7/8 x2.3, Tideturner 7/8 x2.1, Draven, Showboat 7/8 x1.0, Bedeviling Stranger 6/8 x2.5, Siren's Song 6/8 x1.8, Gust 6/8 x1.7, Rebuke 6/8 x1.7; flex (25-74%) Noxus Hopeful 5/8, Kai'Sa, Survivor 5/8, Falling Star 5/8, Ride the Wind 4/8, Switcheroo 4/8, Evelynn, Entrancing 4/8, Kha'Zix, Mutating Horror 4/8, Ferrous Forerunner 4/8; side deck Ravenbloom Prefect 6/8, An Offer You Can't Refuse 4/8, Ferrous Forerunner 4/8, Decree of Rage 3/8, Brynhir Thundersong 3/8; shape labels from the deck-theory clustering (1 labelled): unit-aggro 1
- **Pre-Radiance lists (DATA, n=20, 20 with tournament provenance; sources: official-rq 15, pa-fetch 2, pa-sample 1, r1-top3 2; newest set in list: SFD 9, UNL 5, VEN 6; 18 of them hold a card that is banned today):** champion Draven, Showboat 15/20, Draven, Vanquisher 5/20; runes 6 Fury / 6 Chaos 14/20, 7 Fury / 5 Chaos 3/20, 7 Chaos / 5 Fury 2/20; battlefields Zaun Warrens 14/19, Targon's Peak 8/19, Obelisk of Power 5/19 (BANNED since 2026-03-31), Star Spring 5/19, Aspirant's Climb 4/19 (BANNED since 2026-07-24); core (>=75%) Spinning Axe 20/20 x2.8, Rebuke 20/20 x1.9, Stacked Deck 18/20 x2.9 (BANNED since 2026-09-18), Noxus Hopeful 18/20 x2.8, Tideturner 17/20 x2.9, Kai'Sa, Survivor 17/20 x2.6, Falling Star 17/20 x1.8, Overzealous Fan 16/20 x2.8; flex (25-74%) Cleave 14/20, Darius, Trifarian 13/20, Ferrous Forerunner 13/20, Ride the Wind 12/20, Hard Bargain 12/20, Vex, Apathetic 11/20, Rek'Sai, Breacher 11/20, Evelynn, Entrancing 9/20; side deck Brynhir Thundersong 16/20, Ferrous Forerunner 11/20, Hard Bargain 11/20, Thermo Beam 10/20, Switcheroo 7/20; shape labels from the deck-theory clustering (3 labelled): unit-aggro 3
- **Data confidence: thin; advice basis: radiance-lists** (8 complete Radiance-era lists (1 with tournament provenance: event-named, podium or official); 20 complete pre-Radiance lists)

### SFD-187 Void Burrower (Rek'Sai), Fury/Order

- **Text (FACT, cards.json@2026-09-06):** "When you conquer, you may exhaust me to reveal the top 2 cards of your Main Deck. You may play one. Then recycle the rest."
- Printing codes: OPP-187, SFD-187, SFD-243
- Parsed ability 1 (HEURISTIC parse): triggered; cost exhaust me; condition "When you conquer"; effect "reveal the top 2 cards of your Main Deck. You may play one. Then recycle the rest."
- **Rewards (HEURISTIC, from the quoted text):** Conquering battlefields ["When you conquer"]
- **Enables (HEURISTIC, from the quoted text):** Playing cards from outside the hand ["reveal the top 2 cards of your Main Deck. You may play one. Then recycle the rest."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - SFD-029 Rek'Sai, Breacher (3 Energy, 3 Might): "[Accelerate] (You may pay [1][Fury] as an additional cost to have me enter ready.) // [Assault] (+1 [Might] while I'm an attacker.) // Friendly units played from anywhere other than a player's hand have [Accelerate]."
  - SFD-170 Rek'Sai, Swarm Queen (5 Energy, 1 Power, 5 Might): "When I attack, you may reveal the top 2 cards of your Main Deck. You may play one. Then recycle the rest. If the played card is a unit, you may play it here."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** SFD-188 Void Rush (spell, 2 Energy, 1 Power): "Reveal the top 2 cards of your Main Deck. You may play one of them, reducing its cost by [2]. Draw any you did not play this way."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** conquer 1.00 [rewards] pool 11; play-from-elsewhere 0.80 [enables] pool 30
- **Battlefields by text (HEURISTIC):** SFD-210 Hall of Legends (1.1; Conquering battlefields, Readies the legend); OGN-282 Monastery of Hirana (0.5; Conquering battlefields); OGN-286 Reckoner's Arena (0.5; Conquering battlefields); OGN-287 Sigil of the Storm (0.5; Conquering battlefields); OGN-289 Targon's Peak (0.5; Conquering battlefields)
- **Popularity and results (DATA):** 37 published lists since 2026-10-23 (rank 10 of 58, 2.6%); riftbound.gg week-2 tier 3, 0 wins, 4 top cuts; EU Regional Championship 53% over 85 matches
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 11 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 252 Day 1 pilots = 4.2% of the field, 44 in Day 2 = 4.2% of Day 2; Day 2 conversion 18% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 4 first, 4 second, 4 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=4, 4 with tournament provenance; sources: pa-fetch 4):** champion Rek'Sai, Breacher 4/4; runes 6 Fury / 6 Order 2/4, 8 Fury / 4 Order 1/4, 7 Fury / 5 Order 1/4; battlefields The Candlelit Sanctum 4/4, Rockfall Path 3/4, Forbidding Waste 2/4, Vilemaw's Lair 1/4, Hunters' Circle 1/4; core (>=75%) Noxus Hopeful 4/4 x3.0, Falling Star 4/4 x3.0, Cull the Weak 4/4 x3.0, Faithful Manufactor 4/4 x3.0, Bilgewater Tracker 4/4 x3.0, Inferna 4/4 x3.0, Carrion Dredger 4/4 x3.0, Undertitan 4/4 x2.8, Hunting Dog 4/4 x2.0, Rek'Sai, Breacher 4/4 x1.0, Trifarian Captain 3/4 x2.7, Imperial Decree 3/4 x2.3; flex (25-74%) Shimmering Swimmer 2/4, Concert Poster 2/4, Blood Rush 2/4, Noxian Emissary 2/4, Rengar, Pouncing 2/4, Long Sword 2/4, Cleave 1/4, Pouty Poro 1/4; side deck Decree of Rage 4/4, Decree of Unity 4/4, Salvage 3/4, Ashe, Focused 2/4, Brittle Steel 2/4; shape labels from the deck-theory clustering (4 labelled): unit-aggro 4
- **Pre-Radiance lists (DATA, n=17, 17 with tournament provenance; sources: official-rq 8, pa-fetch 3, pa-sample 1, r1-top3 5; newest set in list: SFD 3, UNL 5, VEN 9; 7 of them hold a card that is banned today):** champion Rek'Sai, Breacher 16/17, Rek'Sai, Swarm Queen 1/17; runes 6 Fury / 6 Order 7/17, 7 Fury / 5 Order 6/17, 12 Order 1/17; battlefields The Candlelit Sanctum 13/16, Trifarian War Camp 9/16, Forbidding Waste 8/16, The Arena's Greatest 7/16 (BANNED since 2026-07-24), Mystic Vortex 4/16; core (>=75%) Noxus Hopeful 17/17 x2.9, Undertitan 16/17 x2.9, Void Rush 16/17 x2.9, Cull the Weak 16/17 x2.8, Rek'Sai, Breacher 16/17 x1.0, Faithful Manufactor 15/17 x3.0, Inferna 14/17 x2.6, Blood Rush 13/17 x2.9; flex (25-74%) Honest Broker 12/17, Falling Star 12/17, Cleave 11/17, Hidden Blade 11/17, Noxian Emissary 7/17, Daring Poro 6/17, Vi, Peacekeeper 6/17, Salvage 6/17; side deck Salvage 11/17, Forge of the Future 9/17, Brittle Steel 9/17, Ferrous Forerunner 8/17, Vi, Peacekeeper 6/17; shape labels from the deck-theory clustering (4 labelled): unit-aggro 4
- **Data confidence: thin; advice basis: radiance-lists** (4 complete Radiance-era lists (4 with tournament provenance: event-named, podium or official); 17 complete pre-Radiance lists)

### SFD-189 Fire Below the Mountain (Ornn), Calm/Mind

- **Text (FACT, cards.json@2026-09-06):** "[Exhaust]: [Reaction] — [Add] [Any]. Use only to play gear or use gear abilities. (Abilities that add resources can't be reacted to.)"
- Printing codes: OPP-189, SFD-189, SFD-244
- Parsed ability 1 (HEURISTIC parse): activated; reaction speed; cost [Exhaust]; restriction "Use only to play gear or use gear abilities."; effect "[Add] [Any]."
- **Rewards (HEURISTIC, from the quoted text):** Gear (non-Equipment included) ["Use only to play gear or use gear abilities."]
- **Enables (HEURISTIC, from the quoted text):** Adding resources ["[Add] [Any]."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - SFD-058 Ornn, Blacksmith (5 Energy, 1 Power, 5 Might): "When you play me or when I hold, look at the top 4 cards of your Main Deck. You may reveal a gear from among them and draw it. Then recycle the rest."
  - SFD-085 Ornn, Forge God (6 Energy, 4 Might): "[Deflect 2] (Opponents must pay [Any][Any] to choose me with a spell or ability.) // [Weaponmaster] (When you play me, you may [Equip] one of your Equipment to me for [Any] less, even if it's already attached.) // I have +1 [Might] for each friendly gear."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** SFD-190 Forgefire Cape (gear, 4 Energy, 2 Power): "[Unique] (Your deck can have only 1 card with this name.) // [Equip] [Any] ([Any]: Attach this to a unit you control.) // When I attack or defend, deal 2 to all enemy units here."; SFD-191 Rabadon's Deathcrown (gear, 4 Energy, 2 Power): "[Unique] (Your deck can have only 1 card with this name.) // [Equip] [Any] ([Any]: Attach this to a unit you control.) // Your spells and abilities deal 3 Bonus Damage (while this is attached)."; SFD-192 Shurelya's Requiem (gear, 4 Energy, 2 Power): "[Unique] (Your deck can have only 1 card with this name.) // [Equip] [Any] ([Any]: Attach this to a unit you control.) // When you play this, ready your units. // Your units here have [Ganking]. (We can move from battlefield to battlefield.)"
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** gear 1.00 [rewards] pool 44; energy-ramp 0.60 [enables] pool 7; equipment 0.32 [champion or signature text only] pool 20
- **Battlefields by text (HEURISTIC):** SFD-221 Veiled Temple (1.0; Gear (non-Equipment included)); SFD-210 Hall of Legends (0.6; Readies the legend); VEN-166 Threshold of the Gray (0.6; Adding resources); RAD-163 Hunters' Circle (0.5; Gear (non-Equipment included)); RAD-165 Rakelstake (0.5; Gear (non-Equipment included))
- **Popularity and results (DATA):** 15 published lists since 2026-10-23 (rank 35 of 58, 1.0%); EU Regional Championship 50% over 12 matches
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 11 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 140 Day 1 pilots = 2.3% of the field, 22 in Day 2 = 2.1% of Day 2; Day 2 conversion 16% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 1 first, 0 second, 2 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=9, 4 with tournament provenance; sources: pa-fetch 9):** champion Ornn, Blacksmith 8/9, Ornn, Forge God 1/9; runes 7 Calm / 5 Mind 3/9, 8 Calm / 4 Mind 3/9, 9 Calm / 3 Mind 2/9; battlefields Ornn's Forge 8/9, Seat of Power 7/9, Veiled Temple 7/9, Hallowed Tomb 1/9, Forgotten Monument 1/9; core (>=75%) Patched Porobot 9/9 x3.0, Seal of Focus 9/9 x2.8, Poro Snax 8/9 x3.0, Sterak's Gage 8/9 x3.0, Sprite Fountain 8/9 x3.0, Defy 8/9 x2.8, Guardian Angel 8/9 x1.8, Ornn, Blacksmith 8/9 x1.1, Pit Crew 7/9 x3.0, Brutalizer 7/9 x3.0, Charm 7/9 x1.9; flex (25-74%) Scuttle Crab 6/9, Clockwork Keeper 6/9, Cloth Armor 6/9, Mask of Foresight 5/9, Command: Attack 4/9, Aspiring Engineer 4/9, Lonely Poro 3/9, Orianna, Exquisite 3/9; side deck Disarming Rake 6/9, Decree of Focus 5/9, Decree of Insight 5/9, Charm 5/9, Twilight Shroud 4/9; shape labels from the deck-theory clustering (2 labelled): gear-engine 2
- **Pre-Radiance lists (DATA, n=9, 9 with tournament provenance; sources: official-rq 6, pa-fetch 2, pa-sample 1; newest set in list: SFD 3, UNL 4, VEN 2; 4 of them hold a card that is banned today):** champion Ornn, Forge God 5/9, Ornn, Blacksmith 4/9; runes 8 Calm / 4 Mind 4/9, 7 Calm / 5 Mind 4/9, 6 Calm / 6 Mind 1/9; battlefields Ornn's Forge 8/8, The Arena's Greatest 3/8 (BANNED since 2026-07-24), Rockfall Path 2/8, Seat of Power 2/8, Treasure Hoard 2/8; core (>=75%) Pit Crew 9/9 x2.8, Poro Snax 9/9 x2.7, Defy 9/9 x2.4, Sterak's Gage 8/9 x3.0, Seal of Focus 7/9 x2.9, Charm 7/9 x2.4, Shurelya's Requiem 7/9 x1.0; flex (25-74%) Sprite Fountain 6/9, Brutalizer 6/9, Clockwork Keeper 5/9, Lonely Poro 5/9, Guardian Angel 5/9, Discipline 5/9, Ornn, Forge God 5/9, Thousand-Tailed Watcher 4/9; side deck Disarming Rake 7/9, Not So Fast 5/9, Singularity 4/9, Charm 4/9, Wind Wall 3/9; shape labels from the deck-theory clustering (3 labelled): gear-engine 3
- **Data confidence: ok; advice basis: radiance-lists** (9 complete Radiance-era lists (4 with tournament provenance: event-named, podium or official); 9 complete pre-Radiance lists)

### SFD-193 Grandmaster at Arms (Jax), Calm/Body

- **Text (FACT, cards.json@2026-09-06):** "[1], [Exhaust]: Attach a detached Equipment you control to a unit you control. // [Exhaust]: Attach an attached Equipment you control to a unit you control."
- Printing codes: OPP-193, SFD-193, SFD-245
- Parsed ability 1 (HEURISTIC parse): activated; cost [1] + [Exhaust]; effect "Attach a detached Equipment you control to a unit you control."
- Parsed ability 2 (HEURISTIC parse): activated; cost [Exhaust]; effect "Attach an attached Equipment you control to a unit you control."
- **Needs (HEURISTIC, from the quoted text):** Equipment ["Attach a detached Equipment you control to a unit you control."]; Equipment ["Attach an attached Equipment you control to a unit you control."]
- **Enables (HEURISTIC, from the quoted text):** Equipment ["Attach a detached Equipment you control to a unit you control."]; Equipment ["Attach an attached Equipment you control to a unit you control."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - SFD-119 Jax, Unrelenting (4 Energy, 1 Power, 3 Might): "[Weaponmaster] (When you play me, you may [Equip] one of your Equipment to me for [Any] less, even if it's already attached.) // When you attach an Equipment to me, you may pay [1] to draw 1."
  - SFD-054 Jax, Unmatched (5 Energy, 1 Power, 5 Might): "[Deflect] (Opponents must pay [Any] to choose me with a spell or ability.) // Each Equipment in your hand has [Quick-Draw]. (It gains [Reaction]. When you play it, attach it to a unit you control.)"
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** SFD-194 Counter Strike (spell, 2 Energy, 1 Power): "[Reaction] (Play any time, even before spells and abilities resolve.) // Choose a unit. The next time that unit would be dealt damage this turn, prevent it. Draw 1."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** equipment 1.00 [enables/needs] pool 25; draw 0.32 [champion or signature text only] pool 40
- **Battlefields by text (HEURISTIC):** SFD-221 Veiled Temple (1.0; Equipment); SFD-210 Hall of Legends (0.6; Readies the legend); SFD-208 Forge of the Fluft (0.5; Equipment)
- **Popularity and results (DATA):** 15 published lists since 2026-10-23 (rank 36 of 58, 1.0%)
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 11 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 68 Day 1 pilots = 1.1% of the field, 4 in Day 2 = 0.4% of Day 2; Day 2 conversion 6% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 0 first, 0 second, 1 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=9, 1 with tournament provenance; sources: pa-fetch 9):** champion Jax, Unmatched 9/9; runes 6 Calm / 6 Body 5/9, 7 Calm / 5 Body 2/9, 7 Body / 5 Calm 2/9; battlefields Ornn's Forge 8/9, Sunken Temple 6/9, Monastery of Hirana 2/9, Fortified Position 1/9, Grove of the God-Willow 1/9; core (>=75%) Brutalizer 9/9 x2.8, Defy 9/9 x2.7, Counter Strike 9/9 x2.4, Jax, Unmatched 9/9 x1.0, Guardian Angel 8/9 x2.8, Discipline 7/9 x3.0, First Mate 7/9 x2.6, Scuttle Crab 7/9 x2.3, Punch First 7/9 x2.0, Rampage 7/9 x1.9; flex (25-74%) Lonely Poro 5/9, Lucian, Merciless 5/9, Graves, Blasting Through 5/9, Doran's Blade 5/9, Portable Portal 5/9, Charm 4/9, Rengar, Trophy Hunter 4/9, Pit Rookie 3/9; side deck Decree of Focus 5/9, Not So Fast 5/9, Hush 5/9, Sabotage 4/9, Akshan, Mischievous 4/9; shape labels from the deck-theory clustering (1 labelled): spell-tempo 1
- **Pre-Radiance lists (DATA, n=11, 11 with tournament provenance; sources: official-rq 9, pa-fetch 2; newest set in list: SFD 3, UNL 5, VEN 3; 4 of them hold a card that is banned today):** champion Jax, Unmatched 11/11; runes 6 Calm / 6 Body 7/11, 7 Body / 5 Calm 3/11, 7 Calm / 5 Body 1/11; battlefields Sunken Temple 7/9, Ornn's Forge 5/9, Targon's Peak 4/9, Aspirant's Climb 3/9 (BANNED since 2026-07-24), Monastery of Hirana 1/9; core (>=75%) Defy 11/11 x2.8, Discipline 11/11 x2.6, Jax, Unmatched 11/11 x1.0, Brutalizer 10/11 x3.0, Guardian Angel 10/11 x3.0, Counter Strike 10/11 x3.0, First Mate 10/11 x2.8, Lucian, Merciless 10/11 x2.5; flex (25-74%) Challenge 8/11, Lonely Poro 7/11, Stellacorn Herder 7/11, Scuttle Crab 7/11, Doran's Blade 7/11, Rengar, Trophy Hunter 6/11, Ruin Runner 6/11, Not So Fast 5/11; side deck Ruin Runner 8/11, Not So Fast 8/11, Akshan, Mischievous 7/11, Sabotage 6/11, Unyielding Spirit 3/11; shape labels from the deck-theory clustering (2 labelled): spell-tempo 2
- **Data confidence: thin; advice basis: radiance-lists** (9 complete Radiance-era lists (1 with tournament provenance: event-named, podium or official); 11 complete pre-Radiance lists)

### SFD-195 Blade Dancer (Irelia), Calm/Chaos

- **Text (FACT, cards.json@2026-09-06):** "When you choose a friendly unit, you may exhaust me and pay [Any] to ready it. // When you conquer, you may pay [1] to ready me."
- Printing codes: OPP-195, SFD-195, SFD-246
- Parsed ability 1 (HEURISTIC parse): triggered; cost exhaust me + pay [Any]; condition "When you choose a friendly unit"; effect "ready it."
- Parsed ability 2 (HEURISTIC parse): triggered; cost pay [1]; condition "When you conquer"; effect "ready me."
- **Rewards (HEURISTIC, from the quoted text):** Choosing own units ["When you choose a friendly unit"]; Conquering battlefields ["When you conquer"]
- **Enables (HEURISTIC, from the quoted text):** Readying units ["ready it."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - SFD-141 Irelia, Graceful (4 Energy, 1 Power, 4 Might): "Your spells that choose me cost [1] or [Any] less."
  - SFD-057 Irelia, Fervent (5 Energy, 4 Might): "[Deflect] (Opponents must pay [Any] to choose me with a spell or ability.) // When you choose or ready me, give me +1 [Might] this turn."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** SFD-196 Defiant Dance (spell, 1 Energy, 1 Power): "[Reaction] (Play any time, even before spells and abilities resolve.) // Give a unit +2 [Might] this turn and another unit -2 [Might] this turn."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** choose-friendly 1.00 [rewards] pool 22; conquer 1.00 [rewards] pool 8; ready 0.60 [enables] pool 19
- **Battlefields by text (HEURISTIC):** SFD-210 Hall of Legends (1.1; Conquering battlefields, Readies the legend); OGN-282 Monastery of Hirana (0.5; Conquering battlefields); OGN-286 Reckoner's Arena (0.5; Conquering battlefields); OGN-287 Sigil of the Storm (0.5; Conquering battlefields); OGN-289 Targon's Peak (0.5; Conquering battlefields)
- **Popularity and results (DATA):** 20 published lists since 2026-10-23 (rank 26 of 58, 1.4%); riftbound.gg week-2 tier 2, 1 wins, 2 top cuts; EU Regional Championship 38% over 45 matches; registered as an extra Neeko legend in 2 fetched lists
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 11 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 500 Day 1 pilots = 8.3% of the field, 105 in Day 2 = 10.0% of Day 2; Day 2 conversion 21% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 24 first, 25 second, 18 third; with a Radiance card in the list: 0 / 2 / 0
- **Radiance-era lists (DATA, n=9, 7 with tournament provenance; sources: pa-fetch 8, r1-top3 1):** champion Irelia, Fervent 7/8, Irelia, Graceful 1/8; runes 6 Calm / 6 Chaos 8/9, 7 Chaos / 5 Calm 1/9; battlefields Abandoned Hall 9/9, Targon's Peak 7/9, Sunken Temple 6/9, Sandswept Tomb 2/9, Sigil of the Storm 1/9; core (>=75%) Discipline 9/9 x3.0, Defiant Dance 9/9 x3.0, Defy 9/9 x2.9, Tideturner 9/9 x2.8, Stellacorn Herder 9/9 x2.8, Boots of Swiftness 9/9 x2.4, Scuttle Crab 8/9 x2.6, Ride the Wind 8/9 x1.9, Irelia, Fervent 8/9 x1.2, Star-Crossed 8/9 x1.1, Not So Fast 8/9 x1.0, Charm 7/9 x1.6; flex (25-74%) Zhonya's Hourglass 6/9, Battle Preparations 6/9, Akali, Silent 6/9, Twilight Shroud 6/9, En Garde 5/9, Gust 5/9, Flash 5/9, Reckless Innovator 4/9; side deck Adaptatron 7/9, Vex, Apathetic 7/9, Star-Crossed 7/9, Ravenbloom Prefect 4/9, Hush 4/9; shape labels from the deck-theory clustering (4 labelled): spell-tempo 4
- **Pre-Radiance lists (DATA, n=50, 50 with tournament provenance; sources: official-rq 13, pa-fetch 3, pa-sample 1, r1-top3 33; newest set in list: SFD 9, UNL 23, VEN 18; 29 of them hold a card that is banned today):** champion Irelia, Fervent 49/49; runes 6 Calm / 6 Chaos 45/50, 7 Chaos / 5 Calm 5/50; battlefields Sunken Temple 43/48, Targon's Peak 39/48, Abandoned Hall 36/48, Zaun Warrens 6/48, Aspirant's Climb 4/48 (BANNED since 2026-07-24); core (>=75%) Discipline 50/50 x3.0, Defiant Dance 50/50 x3.0, Stellacorn Herder 50/50 x2.9, Defy 50/50 x2.8, Boots of Swiftness 50/50 x2.5, Irelia, Fervent 50/50 x1.1, Ride the Wind 48/50 x1.9, Tideturner 47/50 x2.8; flex (25-74%) Scuttle Crab 37/50, Star-Crossed 33/50, Stacked Deck 27/50 (BANNED since 2026-09-18), Zhonya's Hourglass 27/50, Flash 27/50, Gust 22/50, Rebuke 19/50, Fizz, Trickster 19/50; side deck Adaptatron 47/49, Star-Crossed 31/49, Gust 27/49, Not So Fast 24/49, Vex, Apathetic 21/49; shape labels from the deck-theory clustering (4 labelled): spell-tempo 4
- **Data confidence: ok; advice basis: radiance-lists** (9 complete Radiance-era lists (7 with tournament provenance: event-named, podium or official); 50 complete pre-Radiance lists)

### SFD-197 Emperor of the Sands (Azir), Calm/Order

- **Text (FACT, cards.json@2026-09-06):** "Your Sand Soldiers have [Weaponmaster]. // [1], [Exhaust]: Play a 2 [Might] Sand Soldier unit token to your base. Use only if you've played an Equipment this turn."
- Printing codes: OPP-197, SFD-197, SFD-247
- Parsed ability 1 (HEURISTIC parse): static; condition "Your Sand Soldiers"; effect "have [Weaponmaster]."
- Parsed ability 2 (HEURISTIC parse): activated; cost [1] + [Exhaust]; restriction "Use only if you've played an Equipment this turn."; effect "Play a 2 [Might] Sand Soldier unit token to your base."
- **Rewards (HEURISTIC, from the quoted text):** Equipment ["Use only if you've played an Equipment this turn."]; Sand Soldier cards ["Your Sand Soldiers have [Weaponmaster]."]
- **Enables (HEURISTIC, from the quoted text):** Equipment ["have [Weaponmaster]."]; Unit tokens ["Play a 2 [Might] Sand Soldier unit token to your base."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - SFD-177 Azir, Sovereign (4 Energy, 4 Might): "[Accelerate] (You may pay [1][Order] as an additional cost to have me enter ready.) // When I attack, you may move any number of your token units to this battlefield."
  - SFD-050 Azir, Ascendant (6 Energy, 1 Power, 6 Might): "[Calm]: [Action] — Choose a unit you control. Move me to its location and it to my original location. If it's equipped, you may attach one of its Equipment to me. Use only once per turn."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** SFD-198 Arise! (spell, 6 Energy, 1 Power): "Play a 2 [Might] Sand Soldier unit token for each Equipment you control. Then ready two of them."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** equipment 1.00 [enables/rewards] pool 18; tag:Sand Soldier 1.00 [rewards] pool 4; token 0.70 [enables] pool 25; movement 0.35 [champion or signature text only] pool 38
- **Battlefields by text (HEURISTIC):** SFD-221 Veiled Temple (1.0; Equipment); SFD-210 Hall of Legends (0.6; Readies the legend); SFD-208 Forge of the Fluft (0.5; Equipment)
- **Popularity and results (DATA):** 8 published lists since 2026-10-23 (rank 53 of 58, 0.5%); riftbound.gg week-2 tier 4, 0 wins, 2 top cuts; EU Regional Championship 50% over 16 matches
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 11 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 250 Day 1 pilots = 4.2% of the field, 60 in Day 2 = 5.7% of Day 2; Day 2 conversion 24% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 9 first, 9 second, 7 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=8, 3 with tournament provenance; sources: pa-fetch 8):** champion Azir, Sovereign 7/7; runes 7 Calm / 5 Order 7/8, 6 Calm / 6 Order 1/8; battlefields Hall of Legends 8/8, Trifarian War Camp 7/8, Seat of Power 3/8, Vilemaw's Lair 2/8, Ornn's Forge 2/8; core (>=75%) Discipline 8/8 x3.0, Doran's Shield 8/8 x3.0, Brutalizer 8/8 x3.0, Eye of the Herald 8/8 x3.0, B.F. Sword 8/8 x3.0, Arise! 8/8 x2.9, Defy 8/8 x2.6, Guards! 8/8 x2.5, Hand Hammer 8/8 x2.4, Back Off 8/8 x2.2, Deathgrip 8/8 x1.8, Azir, Sovereign 8/8 x1.0; flex (25-74%) Vi, Peacekeeper 5/8, Kennen, Keeper of Balance 4/8, Trifarian Captain 2/8, En Garde 2/8, Charm 2/8; side deck Decree of Unity 7/8, Decree of Focus 7/8, Salvage 7/8, Charm 6/8, Hush 5/8; shape labels from the deck-theory clustering (2 labelled): gear-engine 2
- **Pre-Radiance lists (DATA, n=16, 16 with tournament provenance; sources: official-rq 7, pa-fetch 2, r1-top3 7; newest set in list: SFD 3, UNL 5, VEN 8; 1 of them hold a card that is banned today):** champion Azir, Sovereign 16/16; runes 7 Calm / 5 Order 9/16, 6 Calm / 6 Order 7/16; battlefields Trifarian War Camp 15/15, Hall of Legends 14/15, Seat of Power 7/15, Ornn's Forge 6/15, Grove of the God-Willow 1/15; core (>=75%) Discipline 16/16 x3.0, Doran's Shield 16/16 x3.0, Brutalizer 16/16 x3.0, Eye of the Herald 16/16 x3.0, B.F. Sword 16/16 x3.0, Arise! 16/16 x3.0, Defy 16/16 x2.8, Guards! 16/16 x2.5; flex (25-74%) Vi, Peacekeeper 11/16, Back Off 10/16, Hand Hammer 8/16, Salvage 7/16, Sacrifice 6/16, Charm 6/16, Shadow's Call 5/16, Cull the Weak 5/16; side deck Salvage 14/16, Ashe, Focused 12/16, Charm 11/16, Vi, Peacekeeper 8/16, Cull the Weak 7/16; shape labels from the deck-theory clustering (2 labelled): gear-engine 2
- **Data confidence: ok; advice basis: radiance-lists** (8 complete Radiance-era lists (3 with tournament provenance: event-named, podium or official); 16 complete pre-Radiance lists)

### SFD-199 Prodigal Explorer (Ezreal), Mind/Chaos

- **Text (FACT, cards.json@2026-09-06):** "[Exhaust]: [Reaction] — Draw 1. Use only if you've chosen enemy units and/or gear twice this turn with spells or unit abilities."
- Printing codes: OPP-199, SFD-199, SFD-248
- Parsed ability 1 (HEURISTIC parse): activated; reaction speed; cost [Exhaust]; restriction "Use only if you've chosen enemy units and/or gear twice this turn with spells or unit abilities."; effect "Draw 1."
- **Rewards (HEURISTIC, from the quoted text):** Choosing enemy units / gear ["Use only if you've chosen enemy units and/or gear twice this turn with spells or unit abilities."]; Spells ["Use only if you've chosen enemy units and/or gear twice this turn with spells or unit abilities."]
- **Enables (HEURISTIC, from the quoted text):** Card draw ["Draw 1."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - SFD-149 Ezreal, Prodigy (3 Energy, 1 Power, 3 Might): "When you play me, discard 1, then draw 2. // Optional additional costs you pay cost [1] or [Any] less."
  - SFD-082 Ezreal, Dashing (4 Energy, 1 Power, 3 Might): "When I attack or defend, deal damage equal to my Might to an enemy unit here. // I don't deal combat damage. // [Mind]: [Action] — Move me to your base."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** SFD-200 Arcane Shift (spell, 3 Energy, 1 Power): "[Action] (Play on your turn or in showdowns.) // Banish a friendly unit, then its owner plays it, ignoring its cost. Deal 3 to an enemy unit at a battlefield. Banish this."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** choose-enemy 1.00 [rewards] pool 37; spell-matters 1.00 [rewards] pool 77; draw 0.70 [enables] pool 45
- **Battlefields by text (HEURISTIC):** OGN-296 Void Gate (1.0; Spells); SFD-215 Ravenbloom Conservatory (1.0; Spells); UNL-216 The Academy (1.0; Spells); VEN-158 Heisho, Shell of the World (1.0; Spells); VEN-164 Sandswept Tomb (1.0; Spells)
- **Popularity and results (DATA):** 13 published lists since 2026-10-23 (rank 41 of 58, 0.9%); riftbound.gg week-2 tier 3, 0 wins, 0 top cuts
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 11 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 150 Day 1 pilots = 2.5% of the field, 35 in Day 2 = 3.3% of Day 2; Day 2 conversion 23% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 8 first, 5 second, 4 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=10, 1 with tournament provenance; sources: pa-fetch 10):** champion Ezreal, Prodigy 10/10; runes 6 Mind / 6 Chaos 5/10, 7 Chaos / 5 Mind 4/10, 7 Mind / 5 Chaos 1/10; battlefields Sigil of the Storm 8/10, Frozen Fortress 7/10, Void Gate 6/10, Forgotten Monument 3/10, Rockfall Path 3/10; core (>=75%) Stupefy 10/10 x3.0, Bellows Breath 10/10 x3.0, Gust 10/10 x2.6, Fizz, Trickster 10/10 x2.3, Ezreal, Prodigy 10/10 x1.5, Wages of Pain 9/10 x2.9, Star-Crossed 9/10 x2.3, Deadly Flourish 8/10 x2.8, Thousand-Tailed Watcher 8/10 x1.9, Singularity 8/10 x1.5; flex (25-74%) Pack of Wonders 7/10, Bewitching Spirit 7/10, Vex, Apathetic 6/10, Treasure Trove 6/10, The List 6/10, An Offer You Can't Refuse 6/10, Hard Bargain 5/10, Sprite Fountain 4/10; side deck An Offer You Can't Refuse 9/10, Pickpocket 8/10, Singularity 6/10, Kha'Zix, Mutating Horror 5/10, Hard Bargain 5/10; shape labels from the deck-theory clustering (1 labelled): gear-engine 1
- **Pre-Radiance lists (DATA, n=18, 18 with tournament provenance; sources: official-rq 9, pa-fetch 1, pa-sample 1, r1-top3 7; newest set in list: SFD 3, UNL 8, VEN 7; 16 of them hold a card that is banned today):** champion Ezreal, Prodigy 18/18; runes 6 Mind / 6 Chaos 10/18, 7 Chaos / 5 Mind 8/18; battlefields Sigil of the Storm 17/17, Frozen Fortress 13/17, Aspirant's Climb 7/17 (BANNED since 2026-07-24), Void Gate 5/17, Heisho, Shell of the World 3/17; core (>=75%) Stupefy 18/18 x3.0, Bellows Breath 18/18 x2.9, Fizz, Trickster 18/18 x2.8, Ezreal, Prodigy 18/18 x1.1, Wages of Pain 17/18 x2.5, Gust 17/18 x2.2, Thousand-Tailed Watcher 17/18 x1.9, Stacked Deck 16/18 x3.0 (BANNED since 2026-09-18); flex (25-74%) Deadly Flourish 13/18, Treasure Trove 13/18, Singularity 13/18, Hard Bargain 11/18, Sprite Fountain 8/18, Ravenbloom Student 5/18, Arcane Shift 5/18, Rebuke 5/18; side deck Turn to Dust 15/18, Kha'Zix, Mutating Horror 12/18, Acceptable Losses 12/18, Mindsplitter 11/18, Angler Beast 9/18; shape labels from the deck-theory clustering (2 labelled): gear-engine 2
- **Data confidence: thin; advice basis: radiance-lists** (10 complete Radiance-era lists (1 with tournament provenance: event-named, podium or official); 18 complete pre-Radiance lists)

### SFD-201 Chem-Baroness (Renata Glasc), Mind/Order

- **Text (FACT, cards.json@2026-09-06):** "When you or an ally hold, you may exhaust me to play a Gold gear token exhausted. // While your score is within 3 points of the Victory Score, your Gold [Add] an additional [1]."
- Printing codes: OPP-201, SFD-201, SFD-249
- Parsed ability 1 (HEURISTIC parse): triggered; cost exhaust me; condition "When you or an ally hold"; effect "play a Gold gear token exhausted."
- Parsed ability 2 (HEURISTIC parse): static; condition "While your score is within 3 points of the Victory Score"; effect "your Gold [Add] an additional [1]."
- **Rewards (HEURISTIC, from the quoted text):** Holding battlefields ["When you or an ally hold"]; Near the Victory Score ["While your score is within 3 points of the Victory Score"]
- **Enables (HEURISTIC, from the quoted text):** Adding resources ["your Gold [Add] an additional [1]."]; Gear tokens (Gold, Bomb) ["play a Gold gear token exhausted."]; Gold tokens ["play a Gold gear token exhausted."]; Gold tokens ["your Gold [Add] an additional [1]."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - SFD-171 Renata Glasc, Industrialist (4 Energy, 1 Power, 4 Might): "Your tokens enter ready."
  - SFD-088 Renata Glasc, Mastermind (5 Energy, 4 Might): "[1][Mind]: Draw 1. // [4][Mind][Mind][Mind][Mind], [Exhaust]: Score 1 point. // Use my abilities only while I'm at a battlefield."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** SFD-202 Hostile Takeover (spell, 5 Energy, 2 Power): "[Hidden] (Hide now for [Any] to react with later for [0].) // Take control of an enemy unit at a battlefield. Ready it. (Start a combat if other enemies are there. Otherwise, conquer.) // Lose control of that unit and recall it at end of turn. (Send it to base. This isn't a move.)"
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** hold 1.00 [rewards] pool 8; score-race 1.00 [rewards] pool 7; energy-ramp 0.60 [enables] pool 8; gear-token 0.60 [enables] pool 12; gold 0.60 [enables] pool 12; ready 0.32 [champion or signature text only] pool 20
- **Battlefields by text (HEURISTIC):** SFD-210 Hall of Legends (0.6; Readies the legend); VEN-166 Threshold of the Gray (0.6; Adding resources); OGN-275 Altar to Unity (0.5; Holding battlefields); OGN-280 Grove of the God-Willow (0.5; Holding battlefields); OGN-281 Hallowed Tomb (0.5; Holding battlefields)
- **Popularity and results (DATA):** 8 published lists since 2026-10-23 (rank 54 of 58, 0.5%); registered as an extra Neeko legend in 2 fetched lists
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 11 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 60 Day 1 pilots = 1.0% of the field, 0 in Day 2 = 0.0% of Day 2; Day 2 conversion 0% against 18% for the whole field
- **Radiance-era lists (DATA, n=8, 0 with tournament provenance; sources: pa-fetch 8):** champion Renata Glasc, Mastermind 7/8, Renata Glasc, Industrialist 1/8; runes 7 Mind / 5 Order 3/8, 7 Order / 5 Mind 2/8, 6 Mind / 6 Order 2/8; battlefields Treasure Hoard 6/8, Power Nexus 5/8, Bandle Scouts' Academy 3/8, Grove of the God-Willow 2/8, Black Market 2/8; core (>=75%) Patched Porobot 7/8 x2.9, Renata Glasc, Mastermind 7/8 x1.0, Honest Broker 6/8 x2.7, Hostile Takeover 6/8 x2.5, Time Warp 6/8 x1.8; flex (25-74%) Stupefy 5/8, Resource Extractor 5/8, The Empyrean 5/8, Singularity 5/8, Card Sharp 4/8, Plundering Poro 4/8, Plaza Guardian 4/8, Thousand-Tailed Watcher 4/8; side deck Salvage 5/7, Decree of Unity 3/7, Singularity 3/7, Pickpocket 2/7, Bellows Breath 2/7
- **Pre-Radiance lists (DATA, n=11, 9 with tournament provenance; sources: official-rq 9, pa-fetch 2; newest set in list: SFD 4, UNL 4, VEN 3; 3 of them hold a card that is banned today):** champion Renata Glasc, Mastermind 10/11, Renata Glasc, Industrialist 1/11; runes 7 Mind / 5 Order 5/11, 6 Mind / 6 Order 3/11, 8 Mind / 4 Order 2/11; battlefields Treasure Hoard 6/10, Trifarian War Camp 4/10, Grove of the God-Willow 2/10, Startipped Peak 2/10, Vilemaw's Lair 2/10; core (>=75%) Renata Glasc, Mastermind 11/11 x1.0, Hidden Blade 10/11 x2.9, Hostile Takeover 10/11 x2.5, Plundering Poro 9/11 x2.9; flex (25-74%) Honest Broker 8/11, Stupefy 8/11, Wages of Pain 8/11, Time Warp 8/11, Thousand-Tailed Watcher 7/11, Card Sharp 6/11, Vanguard Armory 5/11, Singularity 5/11; side deck Salvage 8/10, Bellows Breath 6/10, Pickpocket 5/10, Cull the Weak 5/10, Imperial Decree 5/10
- **Data confidence: thin; advice basis: radiance-lists** (8 complete Radiance-era lists (0 with tournament provenance: event-named, podium or official); 11 complete pre-Radiance lists)

### SFD-203 Battle Mistress (Sivir), Body/Chaos

- **Text (FACT, cards.json@2026-09-06):** "When you recycle a rune, you may exhaust me to play a Gold gear token exhausted. // When one or more enemy units die, ready me."
- Printing codes: OPP-203, SFD-203, SFD-250
- Parsed ability 1 (HEURISTIC parse): triggered; cost exhaust me; condition "When you recycle a rune"; effect "play a Gold gear token exhausted."
- Parsed ability 2 (HEURISTIC parse): triggered; condition "When one or more enemy units die"; effect "ready me."
- **Rewards (HEURISTIC, from the quoted text):** Units dying ["When one or more enemy units die"]; Recycling runes (= paying Power, rule 164.2.b) ["When you recycle a rune"]
- **Enables (HEURISTIC, from the quoted text):** Gear tokens (Gold, Bomb) ["play a Gold gear token exhausted."]; Gold tokens ["play a Gold gear token exhausted."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - SFD-143 Sivir, Mercenary (4 Energy, 1 Power, 4 Might): "[Accelerate] (You may pay [1][Chaos] as an additional cost to have me enter ready.) // If you've spent at least [Any][Any] this turn, I have +2 [Might] and [Ganking]. (I can move from battlefield to battlefield.)"
  - SFD-120 Sivir, Ambitious (6 Energy, 3 Power, 7 Might): "[Deflect 2] (Opponents must pay [Any][Any] to choose me with a spell or Ability.) // When I conquer after an attack, if you assigned 5 or more excess damage to enemy units, you may deal that much to an enemy unit."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** SFD-204 On the Hunt (spell, 1 Energy, 2 Power): "Ready your units."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** death 1.00 [rewards] pool 4; recycle 1.00 [rewards] pool 158; gear-token 0.60 [enables] pool 12; gold 0.60 [enables] pool 8
- **Battlefields by text (HEURISTIC):** OGN-287 Sigil of the Storm (1.0; Recycling runes (= paying Power, rule 164.2.b)); UNL-209 Dusk Rose Lab (1.0; Units dying); SFD-210 Hall of Legends (0.6; Readies the legend); RAD-159 Black Rose Sanctum (0.5; Units dying)
- **Popularity and results (DATA):** 8 published lists since 2026-10-23 (rank 55 of 58, 0.5%)
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 11 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 53 Day 1 pilots = 0.9% of the field, 7 in Day 2 = 0.7% of Day 2; Day 2 conversion 13% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 5 first, 5 second, 4 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=9, 1 with tournament provenance; sources: pa-fetch 9):** champion Sivir, Mercenary 9/9; runes 6 Body / 6 Chaos 7/9, 7 Chaos / 5 Body 1/9, 7 Body / 5 Chaos 1/9; battlefields Sigil of the Storm 5/9, Zaun Warrens 3/9, Black Market 3/9, Sandswept Tomb 3/9, Sunken Temple 2/9; core (>=75%) Sivir, Mercenary 9/9 x1.0, Punch First 8/9 x2.6, Star-Crossed 7/9 x2.3; flex (25-74%) The Good Stuff 6/9, Ride the Wind 6/9, Reckless Innovator 5/9, First Mate 5/9, Rampage 5/9, Treasure Trove 4/9, Pack of Wonders 4/9, Tideturner 4/9; side deck An Offer You Can't Refuse 8/9, Hard Bargain 5/9, Akshan, Mischievous 4/9, Sabotage 4/9, Unyielding Spirit 4/9; shape labels from the deck-theory clustering (1 labelled): gear-engine 1
- **Pre-Radiance lists (DATA, n=8, 8 with tournament provenance; sources: official-rq 7, pa-fetch 1; newest set in list: SFD 2, UNL 4, VEN 2; 7 of them hold a card that is banned today):** champion Sivir, Mercenary 8/8; runes 6 Body / 6 Chaos 6/8, 7 Chaos / 5 Body 1/8, 8 Chaos / 4 Body 1/8; battlefields Sigil of the Storm 6/7, Aspirant's Climb 4/7 (BANNED since 2026-07-24), Forgotten Monument 4/7, Zaun Warrens 2/7, Obelisk of Power 1/7 (BANNED since 2026-03-31); core (>=75%) Sivir, Mercenary 8/8 x1.0, Stacked Deck 7/8 x3.0 (BANNED since 2026-09-18), Sabotage 7/8 x2.7, Last Rites 7/8 x1.7, Catalyst of Aeons 6/8 x3.0, Dazzling Aurora 6/8 x3.0, Gust 6/8 x2.5; flex (25-74%) Mobilize 5/8, Scryer's Bloom 5/8, Lunar Boon 5/8, Treasure Trove 5/8, Elder Dragon 5/8, Punch First 5/8, Flurry of Blades 4/8, Challenge 4/8; side deck Akshan, Mischievous 6/8, Mindsplitter 4/8, Pack of Wonders 4/8, Challenge 3/8, Sabotage 3/8; shape labels from the deck-theory clustering (1 labelled): unit-aggro 1
- **Data confidence: thin; advice basis: radiance-lists** (9 complete Radiance-era lists (1 with tournament provenance: event-named, podium or official); 8 complete pre-Radiance lists)

### SFD-205 Grand Duelist (Fiora), Body/Order

- **Text (FACT, cards.json@2026-09-06):** "When one of your units becomes [Mighty], you may exhaust me to channel 1 rune exhausted. (A unit is Mighty while it has 5+ [Might].)"
- Printing codes: OPP-205, SFD-205, SFD-251
- Parsed ability 1 (HEURISTIC parse): triggered; cost exhaust me; condition "When one of your units becomes [Mighty]"; effect "channel 1 rune exhausted."
- **Rewards (HEURISTIC, from the quoted text):** Mighty (5+ Might) ["When one of your units becomes [Mighty]"]
- **Enables (HEURISTIC, from the quoted text):** Channeling extra runes ["channel 1 rune exhausted."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - SFD-110 Fiora, Peerless (3 Energy, 1 Power, 3 Might): "When I attack or defend one on one, double my Might this combat."
  - SFD-180 Fiora, Worthy (3 Energy, 3 Might): "When a unit you control becomes [Mighty], you may pay [Order] to ready it. (A unit is Mighty while it has 5+ [Might].)"
  - OGN-232 Fiora, Victorious (4 Energy, 4 Might): "While I'm [Mighty], I have [Deflect], [Ganking], and [Shield]. (I'm Mighty while I have 5+ [Might].)"
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** SFD-206 Riposte (spell, 2 Energy, 2 Power): "[Reaction] (Play any time, even before spells and abilities resolve.) // Choose a friendly unit and a spell. Counter that spell and give that unit +[Might] equal to that spell's Energy cost this turn."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** mighty 1.00 [rewards] pool 85; channel-rune 0.60 [enables] pool 13
- **Battlefields by text (HEURISTIC):** SFD-210 Hall of Legends (0.6; Readies the legend); SFD-218 Sunken Temple (0.5; Mighty (5+ Might))
- **Popularity and results (DATA):** 20 published lists since 2026-10-23 (rank 27 of 58, 1.4%)
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 11 of the 11 official field tables (first 2026-02-25, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 140 Day 1 pilots = 2.3% of the field, 17 in Day 2 = 1.6% of Day 2; Day 2 conversion 12% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 7 first, 6 second, 9 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=9, 0 with tournament provenance; sources: pa-fetch 9):** champion Fiora, Victorious 5/9, Fiora, Worthy 4/9; runes 6 Body / 6 Order 5/9, 7 Order / 5 Body 2/9, 7 Body / 5 Order 1/9; battlefields Sunken Temple 9/9, Monastery of Hirana 5/9, Trifarian War Camp 3/9, Packed Amphitheater 3/9, Valley of Idols 3/9; core (>=75%) Punch First 9/9 x2.7, Riposte 9/9 x2.2, Hidden Blade 8/9 x1.8, Pit Rookie 7/9 x3.0, Unsung Hero 7/9 x2.9, Rampage 7/9 x2.9, B.F. Sword 7/9 x2.7, First Mate 7/9 x2.3, Fiora, Victorious 7/9 x1.7; flex (25-74%) Kayle, Justified 6/9, Call to Glory 5/9, Sett, Brawler 5/9, Pillaged Armory 5/9, Sacrifice 5/9, Fiora, Worthy 5/9, Kinkou Initiate 4/9, Vi, Peacekeeper 4/9; side deck Decree of Strength 6/9, Salvage 6/9, Decree of Unity 4/9, Unyielding Spirit 4/9, Akshan, Mischievous 4/9
  - Builds by Chosen Champion (DATA): Fiora, Victorious 5/9 sets itself apart with Rengar, Trophy Hunter, Call to Glory, Pillaged Armory, Pit Rookie; Fiora, Worthy 4/9
- **Pre-Radiance lists (DATA, n=15, 15 with tournament provenance; sources: official-rq 8, pa-fetch 4, pa-sample 1, r1-top3 2; newest set in list: SFD 3, UNL 5, VEN 7; 4 of them hold a card that is banned today):** champion Fiora, Worthy 9/14, Fiora, Victorious 5/14; runes 8 Body / 4 Order 5/15, 7 Body / 5 Order 5/15, 6 Body / 6 Order 3/15; battlefields Sunken Temple 11/14, Monastery of Hirana 7/14, Amateur Recital 5/14, Trifarian War Camp 4/14, Risen Altar 4/14; core (>=75%) Riposte 15/15 x2.5, Punch First 13/15 x2.4; flex (25-74%) Sacrifice 11/15, Fiora, Victorious 11/15, Pit Rookie 9/15, Sett, Brawler 9/15, Challenge 9/15, Hidden Blade 9/15, Harnessed Dragon 9/15, Fiora, Worthy 9/15; side deck Salvage 14/15, Sabotage 11/15, Akshan, Mischievous 7/15, Unyielding Spirit 6/15, Ashe, Focused 4/15; shape labels from the deck-theory clustering (5 labelled): big-control 3, unit-aggro 2
- **Data confidence: thin; advice basis: radiance-lists** (9 complete Radiance-era lists (0 with tournament provenance: event-named, podium or official); 15 complete pre-Radiance lists)

### UNL-181 Virtuoso (Jhin), Fury/Mind

- **Text (FACT, cards.json@2026-09-06):** "When you play a spell, if you spent [4] or more, you may banish it. Then, if there are four spells banished with me, put each in its trash, channel 4 runes, and draw 1."
- Printing codes: UNL-181, UNL-226, UNL-226*, UNL-226s
- Parsed ability 1 (HEURISTIC parse): triggered; condition "When you play a spell, if you spent [4] or more"; effect "you may banish it. Then, if there are four spells banished with me, put each in its trash, channel 4 runes, and draw 1."
- **Rewards (HEURISTIC, from the quoted text):** Expensive spells (4+/5+ Energy) ["When you play a spell, if you spent [4] or more"]; Spells ["When you play a spell, if you spent [4] or more"]
- **Enables (HEURISTIC, from the quoted text):** Spells ["you may banish it. Then, if there are four spells banished with me, put each in its trash, channel 4 runes, and draw 1."]; Card draw ["you may banish it. Then, if there are four spells banished with me, put each in its trash, channel 4 runes, and draw 1."]; Banishing own cards ["you may banish it. Then, if there are four spells banished with me, put each in its trash, channel 4 runes, and draw 1."]; Channeling extra runes ["you may banish it. Then, if there are four spells banished with me, put each in its trash, channel 4 runes, and draw 1."]; Trash as a resource ["you may banish it. Then, if there are four spells banished with me, put each in its trash, channel 4 runes, and draw 1."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - UNL-022 Jhin, Murderous Artist (4 Energy, 1 Power, 4 Might): "[Deflect] (Opponents must pay [Any] to choose me with a spell or ability.) // [Ganking] (I can move from battlefield to battlefield.) // When I move, [Add] [1][Any]. (Abilities that add resources can't be reacted to.)"
  - UNL-089 Jhin, Meticulous Killer (4 Energy, 4 Might): "[Vision] (When you play me, look at the top card of your Main Deck. You may recycle it.) // If you've spent [4] or more to play a spell this turn, you may play me for [Mind]."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** UNL-182 Curtain Call (spell, 4 Energy): "[Repeat] — [1] / [Any] / [1][Any] (You may pay each additional cost to repeat this spell's effect.) // Choose one you haven't already chosen — // - Draw 1. // - Deal 2 to a unit at a battlefield. // - Deal 3 to a unit at a base. // - Give a unit at a battlefield -4 [Might] this turn."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** expensive-spells 1.00 [rewards] pool 23; spell-matters 1.00 [enables/rewards] pool 75; draw 0.70 [enables] pool 38; banish 0.60 [enables] pool 12; channel-rune 0.60 [enables] pool 2; trash 0.60 [enables] pool 16
- **Battlefields by text (HEURISTIC):** OGN-296 Void Gate (1.0; Spells); SFD-215 Ravenbloom Conservatory (1.0; Spells); UNL-211 Forgotten Library (1.0; Expensive spells (4+/5+ Energy), Spells); UNL-216 The Academy (1.0; Spells); VEN-158 Heisho, Shell of the World (1.0; Spells)
- **Popularity and results (DATA):** 13 published lists since 2026-10-23 (rank 42 of 58, 0.9%); registered as an extra Neeko legend in 1 fetched lists
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 7 of the 11 official field tables (first 2026-05-21, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 56 Day 1 pilots = 0.9% of the field, 5 in Day 2 = 0.5% of Day 2; Day 2 conversion 9% against 18% for the whole field
- **Radiance-era lists (DATA, n=9, 3 with tournament provenance; sources: pa-fetch 9):** champion Jhin, Meticulous Killer 8/9, Jhin, Murderous Artist 1/9; runes 7 Mind / 5 Fury 6/9, 6 Fury / 6 Mind 2/9, 7 Fury / 5 Mind 1/9; battlefields Frozen Fortress 8/9, Sigil of the Storm 7/9, Rockfall Path 4/9, Void Gate 3/9, Heisho, Shell of the World 2/9; core (>=75%) Deadly Flourish 9/9 x3.0, Curtain Call 9/9 x3.0, Singularity 9/9 x1.9, Rocket Barrage 9/9 x1.8, Noxus Hopeful 8/9 x3.0, Sprite Burst 8/9 x2.8, Jhin, Meticulous Killer 8/9 x1.2, Plundering Poro 7/9 x2.9, Consult the Past 7/9 x2.7, Thousand-Tailed Watcher 7/9 x2.0; flex (25-74%) Stupefy 6/9, Time Warp 6/9, Frigid Touch 6/9, Bilgewater Tracker 5/9, Progress Day 5/9, Falling Star 5/9, Forecaster 4/9, The Empyrean 4/9; side deck Brynhir Thundersong 6/7, Temporal Breach 5/7, Decree of Insight 5/7, Decree of Rage 4/7, Falling Star 3/7; shape labels from the deck-theory clustering (3 labelled): big-control 3
- **Pre-Radiance lists (DATA, n=7, 7 with tournament provenance; sources: official-rq 4, pa-fetch 3; newest set in list: UNL 4, VEN 3; 2 of them hold a card that is banned today):** champion Jhin, Meticulous Killer 6/7, Jhin, Murderous Artist 1/7; runes 7 Mind / 5 Fury 3/7, 8 Mind / 4 Fury 2/7, 6 Fury / 6 Mind 1/7; battlefields Frozen Fortress 5/6, Sigil of the Storm 4/6, Aspirant's Climb 2/6 (BANNED since 2026-07-24), Void Gate 2/6, Rockfall Path 2/6; core (>=75%) Curtain Call 7/7 x3.0, Deadly Flourish 7/7 x2.9, Consult the Past 7/7 x2.6, Sprite Burst 7/7 x2.1, Time Warp 7/7 x1.9, Jhin, Meticulous Killer 7/7 x1.6, Plundering Poro 6/7 x3.0, Singularity 6/7 x2.2; flex (25-74%) Noxus Hopeful 5/7, Stupefy 5/7, Rocket Barrage 5/7, Watchful Sentry 4/7, Ferrous Forerunner 4/7, Progress Day 4/7, Frigid Touch 4/7, Falling Star 4/7; side deck Ferrous Forerunner 5/7, Thermo Beam 4/7, Unchecked Power 4/7, Decree of Insight 3/7, Sprite Burst 3/7; shape labels from the deck-theory clustering (3 labelled): big-control 3
- **Data confidence: ok; advice basis: radiance-lists** (9 complete Radiance-era lists (3 with tournament provenance: event-named, podium or official); 7 complete pre-Radiance lists)

### UNL-183 Pridestalker (Rengar), Fury/Body

- **Text (FACT, cards.json@2026-09-06):** "When you play a unit, give a unit +1 [Might] this turn."
- Printing codes: UNL-183, UNL-227, UNL-227*, UNL-227s
- Parsed ability 1 (HEURISTIC parse): triggered; condition "When you play a unit"; effect "give a unit +1 [Might] this turn."
- **Rewards (HEURISTIC, from the quoted text):** Playing units ["When you play a unit"]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - SFD-025 Rengar, Pouncing (3 Energy, 1 Power, 3 Might): "[Reaction] (Play any time, even before spells and abilities resolve, including to a battlefield you control.) // [Assault 2] (+2 [Might] while I'm an attacker.) // I can be played to a battlefield you're attacking."
  - UNL-024 Rengar, Unseen (4 Energy, 1 Power, 4 Might): "[Accelerate] (You may pay [1][Fury] as an additional cost to have me enter ready.) // [Assault 2] (+2 [Might] while I'm an attacker.) // [Deflect] (Opponents must pay [Any] to choose me with a spell or ability.) // [Ganking] (I can move from battlefield to battlefield.)"
  - UNL-120 Rengar, Trophy Hunter (5 Energy, 1 Power, 6 Might): "[Ambush] (You may play me as a [Reaction] to a battlefield where you have units.) // I can be played to a battlefield where there are enemy units (even if you don't have units there)."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** UNL-184 Thrill of the Hunt (spell, 2 Energy, 1 Power): "[Reaction] (Play any time, even before spells and abilities resolve.) // Banish a friendly unit, then its owner plays it to any battlefield, ignoring its cost."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** unit 1.00 [rewards] pool 28
- **Battlefields by text (HEURISTIC):** RAD-162 Firelights' Hideout (1.0; Playing units); RAD-165 Rakelstake (0.5; Playing units)
- **Popularity and results (DATA):** 14 published lists since 2026-10-23 (rank 39 of 58, 1.0%); riftbound.gg week-2 tier 2, 0 wins, 3 top cuts; EU Regional Championship 45% over 29 matches; registered as an extra Neeko legend in 2 fetched lists
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 7 of the 11 official field tables (first 2026-05-21, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 305 Day 1 pilots = 5.1% of the field, 69 in Day 2 = 6.6% of Day 2; Day 2 conversion 23% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 5 first, 6 second, 5 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=7, 4 with tournament provenance; sources: pa-fetch 7):** champion Rengar, Trophy Hunter 7/7; runes 8 Body / 4 Fury 6/7, 7 Body / 5 Fury 1/7; battlefields Emperor's Dais 5/7, Seat of Power 5/7, Star Spring 5/7, Sandswept Tomb 2/7, Grove of the God-Willow 1/7; core (>=75%) Pit Rookie 7/7 x3.0, Kinkou Initiate 7/7 x3.0, Noxus Hopeful 7/7 x2.9, Kai'Sa, Survivor 7/7 x2.9, Thrill of the Hunt 7/7 x2.9, Grim Apothecary 7/7 x2.7, Elnuk Herd 7/7 x2.4, Rampage 7/7 x2.4, Rengar, Trophy Hunter 7/7 x1.0, Inferna 6/7 x3.0, Irresistible Faefolk 6/7 x3.0, Punch First 6/7 x2.8; flex (25-74%) Pyke, Dockside Butcher 5/7, Ferrous Forerunner 5/7, Sabotage 4/7, Hold 'Em 3/7, Mischievous Marai 2/7, Repulse 2/7; side deck Ferrous Forerunner 7/7, Decree of Strength 5/7, Sabotage 5/7, Stalwart Goatherd 4/7, Brynhir Thundersong 4/7; shape labels from the deck-theory clustering (3 labelled): unit-aggro 3
- **Pre-Radiance lists (DATA, n=12, 12 with tournament provenance; sources: official-rq 4, pa-fetch 2, pa-sample 1, r1-top3 5; newest set in list: UNL 6, VEN 6; 4 of them hold a card that is banned today):** champion Rengar, Trophy Hunter 11/12, Rengar, Pouncing 1/12; runes 8 Body / 4 Fury 9/12, 7 Body / 5 Fury 2/12, 6 Fury / 6 Body 1/12; battlefields Emperor's Dais 11/11, Star Spring 9/11, Seat of Power 7/11, The Arena's Greatest 4/11 (BANNED since 2026-07-24), Targon's Peak 1/11; core (>=75%) Thrill of the Hunt 12/12 x2.8, Rengar, Trophy Hunter 12/12 x1.2, Irresistible Faefolk 11/12 x3.0, Pit Rookie 11/12 x2.9, Punch First 11/12 x2.9, Inferna 11/12 x2.9, Kai'Sa, Survivor 11/12 x2.8, Kinkou Initiate 11/12 x2.8; flex (25-74%) Noxus Hopeful 7/12, Determined Sentry 7/12, Ferrous Forerunner 7/12, Challenge 6/12, First Mate 6/12, Rampage 5/12, Brynhir Thundersong 3/12, Pakaa Cub 3/12; side deck Brynhir Thundersong 8/12, Unyielding Spirit 8/12, Akshan, Mischievous 7/12, Ferrous Forerunner 6/12, Sabotage 6/12; shape labels from the deck-theory clustering (3 labelled): unit-aggro 3
- **Data confidence: ok; advice basis: radiance-lists** (7 complete Radiance-era lists (4 with tournament provenance: event-named, podium or official); 12 complete pre-Radiance lists)

### UNL-185 Bloodharbor Ripper (Pyke), Fury/Chaos

- **Text (FACT, cards.json@2026-09-06):** "[1], [Exhaust]: Return a friendly unit at a battlefield to its owner's hand. Play a Gold gear token exhausted. (It has "[Reaction][>] Kill this, [Exhaust]: [Add] [Any].")"
- Printing codes: UNL-185, UNL-228, UNL-228*, UNL-228s
- Parsed ability 1 (HEURISTIC parse): activated; cost [1] + [Exhaust]; effect "Return a friendly unit at a battlefield to its owner's hand. Play a Gold gear token exhausted."
- **Enables (HEURISTIC, from the quoted text):** Gear tokens (Gold, Bomb) ["Return a friendly unit at a battlefield to its owner's hand. Play a Gold gear token exhausted."]; Gold tokens ["Return a friendly unit at a battlefield to its owner's hand. Play a Gold gear token exhausted."]; Returning own units to hand ["Return a friendly unit at a battlefield to its owner's hand. Play a Gold gear token exhausted."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - UNL-028 Pyke, Dockside Butcher (3 Energy, 2 Might): "[Hidden] (Hide now for [Any] to react with later for [0].) // [Ganking] (I can move from battlefield to battlefield.) // You may pay [Fury] as an additional cost to play me. // When you play me, if you paid the additional cost, ready me and give me +2 [Might] this turn."
  - UNL-145 Pyke, Returned (3 Energy, 3 Might): "[Hidden] (Hide now for [Any] to react with later for [0].) // [Backline] (I must be assigned combat damage last.) // Once each turn, when an enemy unit dies while I'm at a battlefield, play a Gold gear token exhausted. (It has "[Reaction][>] Kill this, [Exhaust]: [Add] [Any].")"
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** UNL-186 Death from Below (spell, 4 Energy, 1 Power): "Kill a unit at a battlefield. Then, if it had 3 [Might] or less, you may play this from your trash for [Any]."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** gear-token 0.70 [enables] pool 15; gold 0.70 [enables] pool 10; bounce-own 0.60 [enables] pool 52; hidden 0.35 [champion or signature text only] pool 24; death 0.32 [champion or signature text only] pool 7
- **Battlefields by text (HEURISTIC):** SFD-210 Hall of Legends (0.6; Readies the legend)
- **Popularity and results (DATA):** 24 published lists since 2026-10-23 (rank 23 of 58, 1.7%); registered as an extra Neeko legend in 2 fetched lists
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 7 of the 11 official field tables (first 2026-05-21, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 92 Day 1 pilots = 1.5% of the field, 5 in Day 2 = 0.5% of Day 2; Day 2 conversion 5% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 0 first, 0 second, 1 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=8, 3 with tournament provenance; sources: pa-fetch 8):** champion Pyke, Dockside Butcher 5/8, Pyke, Returned 3/8; runes 6 Fury / 6 Chaos 4/8, 7 Chaos / 5 Fury 2/8, 7 Fury / 5 Chaos 2/8; battlefields Void Gate 5/8, Ripper's Bay 5/8, Vilemaw's Lair 3/8, Forbidding Waste 3/8, Zaun Warrens 2/8; core (>=75%) Falling Star 8/8 x2.6, Bilgewater Tracker 7/8 x2.4, Vex, Apathetic 7/8 x2.1, Star-Crossed 7/8 x2.0, Fizz, Trickster 7/8 x1.4, Pyke, Dockside Butcher 7/8 x1.0; flex (25-74%) Traveling Merchant 5/8, Reckless Innovator 5/8, The List 5/8, Noxus Hopeful 5/8, Pack of Wonders 5/8, Ezreal, Prodigy 5/8, Lost to the Sands 5/8, Gust 5/8; side deck Decree of Rage 7/8, Ferrous Forerunner 5/8, Hard Bargain 5/8, Kha'Zix, Mutating Horror 4/8, An Offer You Can't Refuse 4/8; shape labels from the deck-theory clustering (2 labelled): unit-aggro 2
  - Builds by Chosen Champion (DATA): Pyke, Dockside Butcher 5/8 sets itself apart with Amateur Demolitionist, Shimmering Swimmer, Lingering Animus, Detonate; Pyke, Returned 3/8 sets itself apart with Tideturner, Switcheroo, Reckless Innovator
- **Pre-Radiance lists (DATA, n=10, 10 with tournament provenance; sources: official-rq 6, pa-fetch 2, pa-sample 2; newest set in list: UNL 6, VEN 4; 8 of them hold a card that is banned today):** champion Pyke, Dockside Butcher 10/10; runes 7 Fury / 5 Chaos 6/10, 6 Fury / 6 Chaos 4/10; battlefields Ripper's Bay 8/9, Forbidding Waste 7/9, Void Gate 6/9, Frozen Fortress 3/9, Aspirant's Climb 2/9 (BANNED since 2026-07-24); core (>=75%) Falling Star 10/10 x3.0, Fizz, Trickster 10/10 x2.2, Star-Crossed 10/10 x1.9, Pyke, Dockside Butcher 10/10 x1.0, Bewitching Spirit 9/10 x3.0, Treasure Hunter 9/10 x2.9, Ezreal, Prodigy 9/10 x1.3, Stacked Deck 8/10 x2.5 (BANNED since 2026-09-18); flex (25-74%) Noxus Hopeful 7/10, Traveling Merchant 6/10, Vex, Apathetic 5/10, Ferrous Forerunner 5/10, Baron Nashor 5/10, Darius, Trifarian 5/10, Kai'Sa, Survivor 5/10, Mindsplitter 5/10; side deck Thermo Beam 7/10, Star-Crossed 7/10, Gust 6/10, Brynhir Thundersong 6/10, Switcheroo 5/10; shape labels from the deck-theory clustering (4 labelled): unit-aggro 4
- **Data confidence: ok; advice basis: radiance-lists** (8 complete Radiance-era lists (3 with tournament provenance: event-named, podium or official); 10 complete pre-Radiance lists)

### UNL-187 Piltover Enforcer (Vi), Fury/Order

- **Text (FACT, cards.json@2026-09-06):** "When you conquer, if you assigned 3 or more excess damage, you may exhaust me to ready a unit."
- Printing codes: UNL-187, UNL-229, UNL-229*, UNL-229s
- Parsed ability 1 (HEURISTIC parse): triggered; cost exhaust me; condition "When you conquer, if you assigned 3 or more excess damage"; effect "ready a unit."
- **Rewards (HEURISTIC, from the quoted text):** Conquering battlefields ["When you conquer, if you assigned 3 or more excess damage"]; Excess combat damage ["When you conquer, if you assigned 3 or more excess damage"]
- **Enables (HEURISTIC, from the quoted text):** Readying units ["ready a unit."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - OGN-036 Vi, Destructive (2 Energy, 1 Power, 3 Might): "[Ganking] (I can move from battlefield to battlefield.) // Recycle 1 from your trash: Give me +1 [Might] this turn."
  - UNL-030 Vi, Hotheaded (4 Energy, 3 Might): "[Deflect] (Opponents must pay [Any] to choose me with a spell or ability.) // [2][Fury]: Double my Might this turn."
  - UNL-176 Vi, Peacekeeper (5 Energy, 1 Power, 5 Might): "[Ambush] (You may play me as a [Reaction] to a battlefield where you have units.) // When I attack, [Stun] an enemy unit here. (It doesn't deal combat damage this turn.)"
  - OGN-235 Karma, Channeler (6 Energy, 1 Power, 6 Might): "[Vision] (When you play me, look at the top card of your Main Deck. You may recycle it.) // When you recycle one or more cards, buff a friendly unit. (If it doesn't have a buff, it gets a +1 [Might] buff. Runes aren't cards.)"
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** UNL-188 Hextech Gauntlets (gear, 3 Energy): "[Equip] [3][Any]. This ability's Energy cost is reduced by the Might of the unit you choose. (Pay the cost: Attach this to a unit you control.) // When I conquer, if you assigned 3 or more excess damage, draw 1."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** conquer 1.00 [rewards] pool 12; excess-damage 1.00 [rewards] pool 37; ready 0.60 [enables] pool 45
- **Battlefields by text (HEURISTIC):** SFD-210 Hall of Legends (1.1; Conquering battlefields, Readies the legend); UNL-217 Trapping Grounds (1.0; Conquering battlefields, Excess combat damage); OGN-282 Monastery of Hirana (0.5; Conquering battlefields); OGN-286 Reckoner's Arena (0.5; Conquering battlefields); OGN-287 Sigil of the Storm (0.5; Conquering battlefields)
- **Popularity and results (DATA):** 9 published lists since 2026-10-23 (rank 51 of 58, 0.6%)
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 7 of the 11 official field tables (first 2026-05-21, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 105 Day 1 pilots = 1.8% of the field, 0 in Day 2 = 0.0% of Day 2; Day 2 conversion 0% against 18% for the whole field
- **Radiance-era lists (DATA, n=11, 6 with tournament provenance; sources: pa-fetch 11):** champion Vi, Peacekeeper 7/10, Vi, Hotheaded 2/10, Vi, Destructive 1/10; runes 7 Fury / 5 Order 6/11, 8 Fury / 4 Order 4/11, 6 Fury / 6 Order 1/11; battlefields Sunken Temple 6/11, Star Spring 6/11, Packed Amphitheater 5/11, Vilemaw's Lair 4/11, Forge of the Fluft 3/11; core (>=75%) Hextech Gauntlets 11/11 x2.9, Vi, Peacekeeper 10/11 x1.6, Trifarian Captain 9/11 x2.7, Gem Jammer 9/11 x2.7; flex (25-74%) Inferna 8/11, Hidden Blade 8/11, Falling Star 8/11, Long Sword 8/11, Kai'Sa, Survivor 7/11, Rengar, Unseen 7/11, Deathgrip 7/11, Jhin, Murderous Artist 6/11; side deck Decree of Rage 9/11, Decree of Unity 9/11, Salvage 8/11, Brittle Steel 8/11, Ashe, Focused 4/11; shape labels from the deck-theory clustering (5 labelled): unit-aggro 5
  - Builds by Chosen Champion (DATA): Vi, Peacekeeper 7/10 sets itself apart with Long Sword, Rek'Sai, Breacher, Rengar, Unseen; Vi, Hotheaded 2/10 sets itself apart with Vault Breaker, Tactical Retreat, Fiora, Victorious, Tryndamere, Barbarian, Brawl
- **Pre-Radiance lists (DATA, n=6, 6 with tournament provenance; sources: official-rq 5, pa-fetch 1; newest set in list: UNL 3, VEN 3; 2 of them hold a card that is banned today):** champion Vi, Peacekeeper 5/6, Vi, Destructive 1/6; runes 7 Fury / 5 Order 4/6, 8 Fury / 4 Order 1/6, 6 Fury / 6 Order 1/6; battlefields Forge of the Fluft 3/5, The Arena's Greatest 2/5 (BANNED since 2026-07-24), Vilemaw's Lair 2/5, Sunken Temple 2/5, Star Spring 2/5; core (>=75%) Hextech Gauntlets 6/6 x3.0, Kai'Sa, Survivor 6/6 x2.8, Honest Broker 6/6 x2.8, Deathgrip 6/6 x2.5, Hidden Blade 5/6 x2.4, Long Sword 5/6 x2.0, Rek'Sai, Breacher 5/6 x1.8, Vi, Peacekeeper 5/6 x1.0; flex (25-74%) Rengar, Unseen 4/6, Gem Jammer 3/6, Noxus Hopeful 3/6, Unsung Hero 3/6, Jhin, Murderous Artist 3/6, Ferrous Forerunner 3/6, Kennen, Keeper of Balance 3/6, Cleave 3/6; side deck Ashe, Focused 6/6, Salvage 6/6, Falling Star 4/6, Decree of Unity 2/6, Brynhir Thundersong 2/6; shape labels from the deck-theory clustering (1 labelled): unit-aggro 1
- **Data confidence: ok; advice basis: radiance-lists** (11 complete Radiance-era lists (6 with tournament provenance: event-named, podium or official); 6 complete pre-Radiance lists)

### UNL-189 Bashful Bloom (Lillia), Calm/Mind

- **Text (FACT, cards.json@2026-09-06):** "[4], [Exhaust]: Play a ready 3 [Might] Sprite unit token with [Temporary]. This ability costs [1] less for each friendly unit with [Temporary]."
- Printing codes: UNL-189, UNL-230, UNL-230*, UNL-230s
- Parsed ability 1 (HEURISTIC parse): activated; cost [4] + [Exhaust]; effect "Play a ready 3 [Might] Sprite unit token with [Temporary]. This ability costs [1] less for each friendly unit with [Temporary]."
- **Rewards (HEURISTIC, from the quoted text):** Temporary units ["Play a ready 3 [Might] Sprite unit token with [Temporary]. This ability costs [1] less for each friendly unit with [Temporary]."]; Go wide (many bodies) ["Play a ready 3 [Might] Sprite unit token with [Temporary]. This ability costs [1] less for each friendly unit with [Temporary]."]
- **Enables (HEURISTIC, from the quoted text):** Temporary units ["Play a ready 3 [Might] Sprite unit token with [Temporary]. This ability costs [1] less for each friendly unit with [Temporary]."]; Go wide (many bodies) ["Play a ready 3 [Might] Sprite unit token with [Temporary]. This ability costs [1] less for each friendly unit with [Temporary]."]; Unit tokens ["Play a ready 3 [Might] Sprite unit token with [Temporary]. This ability costs [1] less for each friendly unit with [Temporary]."]; Cost reduction ["Play a ready 3 [Might] Sprite unit token with [Temporary]. This ability costs [1] less for each friendly unit with [Temporary]."]; Sprite cards ["[4], [Exhaust]: Play a ready 3 [Might] Sprite unit token with [Temporary]."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - UNL-082 Lillia, Fae Fawn (3 Energy, 3 Might): "[Accelerate] (You may pay [1][Mind] as an additional cost to have me enter ready.) // When I move from a location, play a 3 [Might] Sprite unit token with [Temporary] there. (Kill it at the start of its controller's Beginning Phase, before scoring.)"
  - UNL-058 Lillia, Protector of Dreams (5 Energy, 4 Might): "When you play a token unit, give me +1 [Might] this turn. // Your token units have [Tank]. (They must be assigned combat damage first.)"
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** UNL-190 Lilting Lullaby (spell, 2 Energy, 2 Power): "[Reaction] (Play any time, even before spells and abilities resolve.) // Counter a spell. Its controller can't play spells this turn."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** temporary 1.00 [enables/rewards] pool 14; wide 1.00 [enables/rewards] pool 16; token 0.70 [enables] pool 16; cost-reduction 0.60 [enables] pool 11; tag:Sprite 0.60 [enables] pool 7
- **Battlefields by text (HEURISTIC):** UNL-208 Black Flame Altar (1.0; Temporary units); RAD-163 Hunters' Circle (0.6; Cost reduction); SFD-210 Hall of Legends (0.6; Readies the legend); SFD-211 Marai Spire (0.6; Cost reduction); SFD-213 Ornn's Forge (0.6; Cost reduction)
- **Popularity and results (DATA):** 18 published lists since 2026-10-23 (rank 31 of 58, 1.2%); riftbound.gg week-2 tier 4, 0 wins, 1 top cuts
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 7 of the 11 official field tables (first 2026-05-21, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 152 Day 1 pilots = 2.5% of the field, 22 in Day 2 = 2.1% of Day 2; Day 2 conversion 14% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 3 first, 3 second, 3 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=6, 4 with tournament provenance; sources: pa-fetch 6):** champion Lillia, Fae Fawn 6/6; runes 6 Calm / 6 Mind 5/6, 7 Calm / 5 Mind 1/6; battlefields Dusk Rose Lab 6/6, Seat of Power 5/6, Black Flame Altar 3/6, Vilemaw's Lair 1/6, Black Rose Sanctum 1/6; core (>=75%) Defy 6/6 x3.0, Discipline 6/6 x3.0, Mask of Foresight 6/6 x3.0, Ravenbloom Student 6/6 x3.0, Sprite Fountain 6/6 x3.0, Stupefy 6/6 x2.7, Sprite Burst 6/6 x2.7, Smoke and Mirrors 6/6 x2.5, Brutalizer 6/6 x2.2, Charm 6/6 x1.8, Battle Preparations 6/6 x1.8, Lillia, Fae Fawn 6/6 x1.3; flex (25-74%) Thousand-Tailed Watcher 4/6, En Garde 3/6, Smoke Screen 3/6, Unchecked Power 3/6, Scuttle Crab 2/6, Disarming Rake 2/6, Janna, Savior 2/6; side deck Disarming Rake 5/6, Unchecked Power 5/6, Decree of Insight 4/6, Akali, Silent 4/6, Charm 4/6; shape labels from the deck-theory clustering (3 labelled): spell-tempo 3
- **Pre-Radiance lists (DATA, n=12, 12 with tournament provenance; sources: official-rq 4, pa-fetch 7, r1-top3 1; newest set in list: UNL 4, VEN 8; 3 of them hold a card that is banned today):** champion Lillia, Fae Fawn 12/12; runes 6 Calm / 6 Mind 7/12, 7 Mind / 5 Calm 3/12, 7 Calm / 5 Mind 2/12; battlefields Dusk Rose Lab 11/11, Seat of Power 10/11, Rockfall Path 4/11, Black Flame Altar 4/11, The Arena's Greatest 3/11 (BANNED since 2026-07-24); core (>=75%) Defy 12/12 x3.0, Discipline 12/12 x3.0, Ravenbloom Student 12/12 x3.0, Sprite Fountain 12/12 x3.0, Stupefy 12/12 x2.8, Smoke and Mirrors 12/12 x2.4, Charm 12/12 x1.7, Lillia, Fae Fawn 12/12 x1.3; flex (25-74%) Heart of Dark Ice 8/12, Janna, Savior 6/12, Lonely Poro 5/12, Disarming Rake 5/12, Riptide Rex 4/12, Brutalizer 4/12, Akali, Silent 4/12, Plundering Poro 3/12; side deck Lilting Lullaby 11/12, Disarming Rake 9/12, Unchecked Power 8/12, Charm 8/12, Decree of Insight 7/12; shape labels from the deck-theory clustering (7 labelled): spell-tempo 7
- **Data confidence: ok; advice basis: radiance-lists** (6 complete Radiance-era lists (4 with tournament provenance: event-named, podium or official); 12 complete pre-Radiance lists)

### UNL-191 Wuju Master (Master Yi), Calm/Body

- **Text (FACT, cards.json@2026-09-06):** "[Level 6][>] Your units have +1 [Might]. (While you have 6+ XP, get the effect.) // [Level 11][>] Your units enter ready."
- Printing codes: UNL-191, UNL-231, UNL-231*, UNL-231s
- Other legend with the same champion tag: OGS-019
- Parsed ability 1 (HEURISTIC parse): static; gate Level 6; condition "Your units"; effect "have +1 [Might]."
- Parsed ability 2 (HEURISTIC parse): static; gate Level 11; condition "Your units"; effect "enter ready."
- **Rewards (HEURISTIC, from the quoted text):** XP / Level ["[Level 6]"]; XP / Level ["[Level 11]"]
- **Enables (HEURISTIC, from the quoted text):** Readying units ["enter ready."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - UNL-113 Master Yi, Tempered (4 Energy, 4 Might): "[Hunt 2] (When I conquer or hold, gain 2 XP.) // [Level 6][>] I have [Deflect] and [Ganking]. (While you have 6+ XP, opponents must pay [Any] to choose me with a spell or ability and I can move from battlefield to battlefield.)"
  - OGS-004 Yi, Meditative (5 Energy, 1 Power, 4 Might): "While you have 8+ runes, I have +4 [Might]."
  - OGS-009 Yi, Honed (7 Energy, 1 Power, 6 Might): "[Ganking] (I can move from battlefield to battlefield.) // I enter ready."
  - UNL-059 Master Yi, Unstoppable (12 Energy, 3 Power, 12 Might): "[Level 3][>] I cost [2][Calm] less. (While you have 3+ XP, get the effect.) // [Level 6][>] I cost [4][Calm][Calm] less instead. // [Level 11][>] I cost [6][Calm][Calm][Calm] less instead. // [Level 16][>] I can't be chosen by enemy spells and abilities."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** OGS-020 Highlander (spell, 4 Energy): "[Reaction] (Play any time, even before spells and abilities resolve.) // Choose a friendly unit. The next time it dies this turn, recall it exhausted instead. (Send it to base. This isn't a move.)"; UNL-192 Alpha Strike (spell, 3 Energy, 1 Power): "[Action] (Play on your turn or in showdowns.) // Choose a friendly unit. It deals damage equal to its Might split among enemy units at battlefields. Then for each unit this kills, do this: Gain 1 XP."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** level 1.00 [rewards] pool 26; ready 0.65 [enables] pool 34
- **Battlefields by text (HEURISTIC):** UNL-213 Gardens of Becoming (1.0; XP / Level)
- **Popularity and results (DATA):** 11 published lists since 2026-10-23 (rank 48 of 58, 0.8%); riftbound.gg week-2 tier 2, 2 wins, 5 top cuts; EU Regional Championship 46% over 106 matches; results are per champion name and cannot be split from OGS-019
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 7 of the 11 official field tables (first 2026-05-21, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 77 Day 1 pilots = 1.3% of the field, 5 in Day 2 = 0.5% of Day 2; Day 2 conversion 6% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 0 first, 1 second, 1 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=8, 1 with tournament provenance; sources: pa-fetch 8):** champion Master Yi, Tempered 5/6, Master Yi, Unstoppable 1/6; runes 6 Calm / 6 Body 5/8, 8 Calm / 4 Body 2/8, 7 Body / 5 Calm 1/8; battlefields Gardens of Becoming 6/8, Reckoner's Arena 4/8, Packed Amphitheater 2/8, Sunken Temple 2/8, Star Spring 2/8; core (>=75%) Master Yi, Tempered 8/8 x1.8, Gemhand Hunter 7/8 x3.0, Wuju Apprentice 7/8 x2.7, Grim Resolve 7/8 x2.6, Master Yi, Unstoppable 7/8 x2.0, Defy 6/8 x2.7, Voracious Gromp 6/8 x2.5, Concentrate 6/8 x2.2; flex (25-74%) Skyward Strike 5/8, Punch First 5/8, Zhonya's Hourglass 5/8, Scuttle Crab 5/8, Rampage 5/8, Discipline 4/8, Combat Experience 4/8, Herald of Spring 4/8; side deck Disarming Rake 3/4, Sabotage 3/4, Decree of Strength 3/4, Skyward Strike 2/4, Alpha Strike 2/4; shape labels from the deck-theory clustering (1 labelled): spell-tempo 1
- **Pre-Radiance lists (DATA, n=8, 8 with tournament provenance; sources: official-rq 3, pa-fetch 2, pa-sample 1, r1-top3 2; newest set in list: UNL 5, VEN 3; 0 of them hold a card that is banned today):** champion Master Yi, Tempered 8/8; runes 6 Calm / 6 Body 4/8, 7 Body / 5 Calm 3/8, 7 Calm / 5 Body 1/8; battlefields Gardens of Becoming 7/7, Reckoner's Arena 6/7, Targon's Peak 3/7, Amateur Recital 3/7, Rockfall Path 1/7; core (>=75%) Defy 8/8 x3.0, Discipline 8/8 x3.0, Wuju Apprentice 8/8 x3.0, Gemhand Hunter 8/8 x3.0, Master Yi, Unstoppable 8/8 x2.9, Zhonya's Hourglass 8/8 x2.5, Back Off 8/8 x2.4, Concentrate 8/8 x2.4; flex (25-74%) Skyward Strike 5/8, Alpha Strike 4/8, Arachnoid Horror 4/8, Hunter's Machete 2/8, Not So Fast 2/8; side deck Sabotage 7/8, Disarming Rake 7/8, Unyielding Spirit 5/8, Not So Fast 4/8, Rampage 3/8; shape labels from the deck-theory clustering (3 labelled): spell-tempo 3
- **Data confidence: thin; advice basis: radiance-lists** (8 complete Radiance-era lists (1 with tournament provenance: event-named, podium or official); 8 complete pre-Radiance lists)

### UNL-193 Gloomist (Vex), Calm/Chaos

- **Text (FACT, cards.json@2026-09-06):** "When you or an ally hold, you may exhaust me to draw 1."
- Printing codes: UNL-193, UNL-232, UNL-232*, UNL-232s
- Parsed ability 1 (HEURISTIC parse): triggered; cost exhaust me; condition "When you or an ally hold"; effect "draw 1."
- **Rewards (HEURISTIC, from the quoted text):** Holding battlefields ["When you or an ally hold"]
- **Enables (HEURISTIC, from the quoted text):** Card draw ["draw 1."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - UNL-150 Vex, Apathetic (4 Energy, 4 Might): "[Deflect] (Opponents must pay [Any] to choose me with a spell or ability.) // When an opponent plays a unit while I'm at a battlefield, [Stun] it. They can't move it this turn. (It doesn't deal combat damage this turn.)"
  - SFD-146 Vex, Cheerless (5 Energy, 1 Power, 5 Might): "While I'm in combat, friendly spells cost [1][Any] less to a minimum of [1], and enemy spells cost [1][Any] more."
  - UNL-055 Vex, Mocking (5 Energy, 1 Power, 5 Might): "[Shield] (+1 [Might] while I'm a defender.) // [Tank] (I must be assigned combat damage first.) // When you [Stun] an enemy unit at a battlefield, you may move me to that battlefield."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** UNL-194 Shadow (unit, 3 Energy, 3 Might): "If you play me to a battlefield, I enter ready. // [Action][>] [1][Any], [Exhaust]: [Stun] an enemy unit attacking here. (It doesn't deal combat damage this turn.)"
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** hold 1.00 [rewards] pool 14; draw 0.60 [enables] pool 42; stun 0.38 [champion or signature text only] pool 20
- **Battlefields by text (HEURISTIC):** SFD-210 Hall of Legends (0.6; Readies the legend); OGN-275 Altar to Unity (0.5; Holding battlefields); OGN-280 Grove of the God-Willow (0.5; Holding battlefields); OGN-281 Hallowed Tomb (0.5; Holding battlefields); OGN-283 Navori Fighting Pit (0.5; Holding battlefields)
- **Popularity and results (DATA):** 29 published lists since 2026-10-23 (rank 17 of 58, 2.0%); riftbound.gg week-2 tier 2, 1 wins, 6 top cuts; EU Regional Championship 36% over 11 matches; registered as an extra Neeko legend in 3 fetched lists
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 7 of the 11 official field tables (first 2026-05-21, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 165 Day 1 pilots = 2.8% of the field, 32 in Day 2 = 3.0% of Day 2; Day 2 conversion 19% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 4 first, 7 second, 7 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=9, 6 with tournament provenance; sources: pa-fetch 9):** champion Vex, Apathetic 9/9; runes 7 Chaos / 5 Calm 5/9, 6 Calm / 6 Chaos 4/9; battlefields Startipped Peak 7/9, Bandle Scouts' Academy 7/9, Bandle Tree 4/9, Grove of the God-Willow 2/9, Hunters' Circle 2/9; core (>=75%) Defy 9/9 x2.9, Switcheroo 9/9 x2.2, Vex, Apathetic 9/9 x1.0, Discipline 8/9 x2.9, Bedeviling Stranger 8/9 x2.6, Boots of Swiftness 8/9 x2.0, Star-Crossed 8/9 x1.5, Rebuke 8/9 x1.2, Back Off 7/9 x2.0, Evelynn, Entrancing 7/9 x1.4; flex (25-74%) Steel Paws 6/9, Tornado Warrior 6/9, Astral Heron 6/9, Scuttle Crab 6/9, Gust 6/9, Tideturner 6/9, Charm 6/9, Zhonya's Hourglass 5/9; side deck Star-Crossed 8/9, Decree of Focus 6/9, Not So Fast 6/9, Tomb-Raider Barbara 5/9, An Offer You Can't Refuse 5/9; shape labels from the deck-theory clustering (5 labelled): spell-tempo 4, gear-engine 1
- **Pre-Radiance lists (DATA, n=12, 12 with tournament provenance; sources: official-rq 3, pa-fetch 5, pa-sample 3, r1-top3 1; newest set in list: UNL 5, VEN 7; 2 of them hold a card that is banned today):** champion Vex, Apathetic 11/12, Vex, Cheerless 1/12; runes 7 Chaos / 5 Calm 8/12, 6 Calm / 6 Chaos 2/12, 7 Calm / 5 Chaos 2/12; battlefields Startipped Peak 8/11, Fortified Position 6/11, Targon's Peak 4/11, Bandle Tree 3/11, Ravenbloom Conservatory 3/11; core (>=75%) Discipline 12/12 x2.8, Defy 12/12 x2.8, Back Off 12/12 x1.9, Vex, Apathetic 12/12 x1.5, Switcheroo 11/12 x2.4, Boots of Swiftness 10/12 x2.2, Star-Crossed 10/12 x1.8, Rebuke 10/12 x1.6; flex (25-74%) Evelynn, Entrancing 8/12, Gust 8/12, Charm 8/12, Mutated Mouser 7/12, Astral Heron 7/12, Tideturner 7/12, Zhonya's Hourglass 6/12, Pyke, Returned 6/12; side deck Disarming Rake 8/12, Not So Fast 7/12, Star-Crossed 7/12, Gust 5/12, Decree of Focus 5/12; shape labels from the deck-theory clustering (8 labelled): spell-tempo 8
- **Data confidence: ok; advice basis: radiance-lists** (9 complete Radiance-era lists (6 with tournament provenance: event-named, podium or official); 12 complete pre-Radiance lists)

### UNL-195 Green Father (Ivern), Calm/Order

- **Text (FACT, cards.json@2026-09-06):** "When you conquer or hold, you may exhaust me to replace that battlefield with a Brush battlefield token. (Bird, Cat, Dog, Poro, and Ivern units have +1 [Might] in Brush. It can be swapped back when scored.)"
- Printing codes: UNL-195, UNL-233, UNL-233*, UNL-233s
- Parsed ability 1 (HEURISTIC parse): triggered; cost exhaust me; condition "When you conquer or hold"; effect "replace that battlefield with a Brush battlefield token."
- **Rewards (HEURISTIC, from the quoted text):** Conquering battlefields ["When you conquer or hold"]; Holding battlefields ["When you conquer or hold"]
- **Enables (HEURISTIC, from the quoted text):** Bird cards ["Bird, Cat, Dog, Poro, and Ivern units have +1 [Might] in Brush."]; Cat cards ["Bird, Cat, Dog, Poro, and Ivern units have +1 [Might] in Brush."]; Dog cards ["Bird, Cat, Dog, Poro, and Ivern units have +1 [Might] in Brush."]; Poro cards ["Bird, Cat, Dog, Poro, and Ivern units have +1 [Might] in Brush."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - UNL-051 Ivern, Nurturer (5 Energy, 1 Power, 4 Might): "When you play me or when I hold, look at the top 3 cards of your Main Deck. You may reveal a unit from among them and draw it. Recycle the rest. Then if you revealed a Bird, Cat, Dog, or Poro, do this: [Buff] a friendly unit. (Give it a +1 [Might] buff if it doesn't have one.)"
  - UNL-177 Ivern, Friend to All (6 Energy, 6 Might): "As you play me, choose Bird, Cat, Dog, or Poro. I gain that tag. // When I conquer or hold, score 1 point if your units have all of the following tags among them — Bird, Cat, Dog, and Poro."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** UNL-196 Daisy! (unit, 9 Energy, 2 Power, 8 Might): "I enter ready. // Reduce my cost by [1] for each of the following tags among your units — Bird, Cat, Dog, and Poro. // When I attack while your units have all 4 tags, [Stun] an enemy unit here. (It doesn't deal combat damage this turn.)"
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** conquer 1.00 [rewards] pool 5; hold 1.00 [rewards] pool 16; tag:Bird 0.60 [enables] pool 20; tag:Cat 0.60 [enables] pool 14; tag:Dog 0.60 [enables] pool 12; tag:Poro 0.60 [enables] pool 15
- **Battlefields by text (HEURISTIC):** SFD-210 Hall of Legends (1.1; Conquering battlefields, Readies the legend); OGN-286 Reckoner's Arena (1.0; Conquering battlefields, Holding battlefields); OGN-275 Altar to Unity (0.5; Holding battlefields); OGN-280 Grove of the God-Willow (0.5; Holding battlefields); OGN-281 Hallowed Tomb (0.5; Holding battlefields)
- **Popularity and results (DATA):** 18 published lists since 2026-10-23 (rank 32 of 58, 1.2%)
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 7 of the 11 official field tables (first 2026-05-21, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 81 Day 1 pilots = 1.4% of the field, 3 in Day 2 = 0.3% of Day 2; Day 2 conversion 4% against 18% for the whole field
- **Radiance-era lists (DATA, n=6, 2 with tournament provenance; sources: pa-fetch 6):** champion Ivern, Nurturer 5/6, Ivern, Friend to All 1/6; runes 7 Calm / 5 Order 3/6, 6 Calm / 6 Order 3/6; battlefields Vilemaw's Lair 6/6, Rockfall Path 5/6, Forbidding Waste 3/6, Vaults of Helia 2/6, Targon's Peak 1/6; core (>=75%) Defy 6/6 x2.8, Mutated Mouser 6/6 x2.8, Daisy! 6/6 x1.2, Discipline 5/6 x3.0, Trusty Ramhound 5/6 x3.0, Stalwart Poro 5/6 x2.8, Raucous Anthem 5/6 x2.6, Back Off 5/6 x1.8, Emperor's Divide 5/6 x1.6, Ivern, Nurturer 5/6 x1.4; flex (25-74%) Hidden Blade 4/6, Iridescent Avian 4/6, Frisky Hunter 4/6, Friendship 3/6, Hunting Dog 3/6, Fallen Feline 3/6, Blitzcrank, Impassive 3/6, Not So Fast 3/6; side deck Hush 5/6, Disarming Rake 4/6, Vilemaw 4/6, Tomb-Raider Barbara 3/6, Not So Fast 3/6; shape labels from the deck-theory clustering (2 labelled): spell-tempo 2
- **Pre-Radiance lists (DATA, n=11, 11 with tournament provenance; sources: official-rq 5, pa-fetch 5, pa-sample 1; newest set in list: UNL 6, VEN 5; 0 of them hold a card that is banned today):** champion Ivern, Nurturer 11/11; runes 6 Calm / 6 Order 5/11, 7 Calm / 5 Order 4/11, 8 Calm / 4 Order 2/11; battlefields Vilemaw's Lair 9/10, Rockfall Path 8/10, Forbidding Waste 8/10, Vaults of Helia 3/10, Seat of Power 2/10; core (>=75%) Defy 11/11 x3.0, Stalwart Poro 11/11 x3.0, Trusty Ramhound 11/11 x3.0, Mutated Mouser 11/11 x3.0, Discipline 11/11 x2.5, Frisky Hunter 11/11 x2.5, Ivern, Nurturer 11/11 x1.6, Back Off 11/11 x1.4; flex (25-74%) Friendship 8/11, Call to Glory 7/11, Azir, Sovereign 6/11, Vi, Peacekeeper 6/11, Blitzcrank, Impassive 6/11, Vilemaw 6/11, Daring Poro 5/11, Astral Heron 5/11; side deck Disarming Rake 8/11, Not So Fast 6/11, Cull the Weak 5/11, Flurry of Feathers 5/11, Salvage 4/11; shape labels from the deck-theory clustering (6 labelled): spell-tempo 4, unit-aggro 2
- **Data confidence: thin; advice basis: radiance-lists** (6 complete Radiance-era lists (2 with tournament provenance: event-named, podium or official); 11 complete pre-Radiance lists)

### UNL-197 Scorn of the Moon (Diana), Mind/Chaos

- **Text (FACT, cards.json@2026-09-06):** "[Reaction][>] [Exhaust]: [Add] [1]. Spend this Energy only during showdowns. (Abilities that add resources can't be reacted to.)"
- Printing codes: UNL-197, UNL-234, UNL-234*, UNL-234s
- Parsed ability 1 (HEURISTIC parse): activated; reaction speed; cost [Exhaust]; restriction "Spend this Energy only during showdowns."; effect "[Add] [1]."
- **Rewards (HEURISTIC, from the quoted text):** Showdown-speed play ["Spend this Energy only during showdowns."]
- **Enables (HEURISTIC, from the quoted text):** Adding resources ["[Add] [1]."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - UNL-079 Diana, Lunari (3 Energy, 3 Might): "When a showdown begins here, you may pay [1]. If you do, [Predict], then reveal the top card of your Main Deck. If it's a spell, draw it. (To Predict, look at the top card of your Main Deck. You may recycle it.)"
  - UNL-149 Diana, No Longer Human (4 Energy, 1 Power, 3 Might): "[Ambush] (You may play me as a [Reaction] to a battlefield where you have units.) // When you play a spell, give me +2 [Might] this turn."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** UNL-198 Moonfall (spell, 3 Energy, 1 Power): "[Action] (Play on your turn or in showdowns.) // Choose a battlefield where you have units. You may move up to one enemy unit to that battlefield. Then give enemy units there -2 [Might] this turn."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** showdown 1.00 [rewards] pool 67; energy-ramp 0.60 [enables] pool 7; spell-matters 0.35 [champion or signature text only] pool 77
- **Battlefields by text (HEURISTIC):** VEN-160 Mystic Vortex (1.0; Showdown-speed play); SFD-210 Hall of Legends (0.6; Readies the legend); VEN-166 Threshold of the Gray (0.6; Adding resources)
- **Popularity and results (DATA):** 22 published lists since 2026-10-23 (rank 24 of 58, 1.5%)
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 7 of the 11 official field tables (first 2026-05-21, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 190 Day 1 pilots = 3.2% of the field, 36 in Day 2 = 3.4% of Day 2; Day 2 conversion 19% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 20 first, 25 second, 14 third; with a Radiance card in the list: 0 / 0 / 1
- **Radiance-era lists (DATA, n=10, 5 with tournament provenance; sources: pa-fetch 9, r1-top3 1):** champion Diana, Lunari 10/10; runes 6 Mind / 6 Chaos 7/10, 7 Chaos / 5 Mind 2/10, 8 Chaos / 4 Mind 1/10; battlefields Targon's Peak 7/10, Abandoned Hall 6/10, Ravenbloom Conservatory 5/10, Rockfall Path 4/10, Packed Amphitheater 2/10; core (>=75%) Stupefy 10/10 x3.0, Moonfall 10/10 x3.0, Ride the Wind 10/10 x2.7, Star-Crossed 10/10 x2.0, Eclipse 10/10 x1.9, Fizz, Trickster 10/10 x1.5, Diana, Lunari 10/10 x1.0, Hwei, Brooding Painter 9/10 x3.0, Tideturner 9/10 x2.7, Gust 9/10 x2.3, Hard Bargain 9/10 x1.7, Ravenbloom Student 8/10 x3.0; flex (25-74%) Traveling Merchant 7/10, An Offer You Can't Refuse 6/10, Switcheroo 5/10, Smoke Screen 5/10, Sprite Fountain 4/10, Retreat 3/10, Flash 3/10; side deck Decree of Insight 9/10, An Offer You Can't Refuse 9/10, Star-Crossed 6/10, Gust 5/10, Fizz, Trickster 4/10; shape labels from the deck-theory clustering (4 labelled): spell-tempo 4
- **Pre-Radiance lists (DATA, n=17, 17 with tournament provenance; sources: official-rq 10, pa-fetch 2, r1-top3 5; newest set in list: UNL 10, VEN 7; 15 of them hold a card that is banned today):** champion Diana, Lunari 17/17; runes 7 Chaos / 5 Mind 14/17, 6 Mind / 6 Chaos 3/17; battlefields Abandoned Hall 15/15, Targon's Peak 10/15, Rockfall Path 7/15, Seat of Power 5/15, Ravenbloom Conservatory 3/15; core (>=75%) Stupefy 17/17 x3.0, Ravenbloom Student 17/17 x3.0, Tideturner 17/17 x3.0, Hwei, Brooding Painter 17/17 x2.9, Moonfall 17/17 x2.6, Ride the Wind 17/17 x2.4, Star-Crossed 17/17 x2.0, Diana, Lunari 17/17 x1.0; flex (25-74%) Acceptable Losses 12/17, Traveling Merchant 11/17, Eclipse 10/17, Smoke Screen 10/17, Sprite Fountain 7/17, Kha'Zix, Mutating Horror 7/17, Vex, Cheerless 5/17; side deck Turn to Dust 14/17, Star-Crossed 14/17, Singularity 12/17, Baron Nashor 8/17, Decree of Insight 7/17; shape labels from the deck-theory clustering (2 labelled): spell-tempo 2
- **Data confidence: ok; advice basis: radiance-lists** (10 complete Radiance-era lists (5 with tournament provenance: event-named, podium or official); 17 complete pre-Radiance lists)

### UNL-199 Deceiver (LeBlanc), Mind/Order

- **Text (FACT, cards.json@2026-09-06):** "When you conquer or hold, you may discard 1 and exhaust me to play a ready Reflection unit token there. It becomes a copy of another unit there. Give it [Temporary]."
- Printing codes: UNL-199, UNL-235, UNL-235*, UNL-235s
- Parsed ability 1 (HEURISTIC parse): triggered; cost discard 1 + exhaust me; condition "When you conquer or hold"; effect "play a ready Reflection unit token there. It becomes a copy of another unit there. Give it [Temporary]."
- **Rewards (HEURISTIC, from the quoted text):** Conquering battlefields ["When you conquer or hold"]; Holding battlefields ["When you conquer or hold"]
- **Needs (HEURISTIC, from the quoted text):** Discard ["discard 1"]
- **Enables (HEURISTIC, from the quoted text):** Temporary units ["play a ready Reflection unit token there. It becomes a copy of another unit there. Give it [Temporary]."]; Copying units ["play a ready Reflection unit token there. It becomes a copy of another unit there. Give it [Temporary]."]; Unit tokens ["play a ready Reflection unit token there. It becomes a copy of another unit there. Give it [Temporary]."]; Reflection cards ["When you conquer or hold, you may discard 1 and exhaust me to play a ready Reflection unit token there."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - UNL-172 LeBlanc, Fragmented (3 Energy, 1 Power, 3 Might): "[Assault] (+1 [Might] while I'm an attacker.) // [Deathknell][>] Draw 1. If it's your Beginning Phase, draw 2 instead. (When I die, get the effect.)"
  - UNL-090 LeBlanc, Everywhere at Once (4 Energy, 4 Might): "[Backline] (I must be assigned combat damage last.) // Your [Temporary] effects at my battlefield don't trigger."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** UNL-200 Mirror Image (spell, 3 Energy, 2 Power): "Choose a unit. Play a ready Reflection unit token to your base. It becomes a copy of that unit. Give it [Temporary]. (Kill it at the start of its controller's Beginning Phase, before scoring.)"
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** conquer 1.00 [rewards] pool 5; hold 1.00 [rewards] pool 8; discard 0.80 [needs] pool 5; temporary 0.80 [enables] pool 14; card-copy 0.70 [enables] pool 3; token 0.70 [enables] pool 33; tag:Reflection 0.60 [enables] pool 2
- **Battlefields by text (HEURISTIC):** OGN-298 Zaun Warrens (1.3; Conquering battlefields, Discard); RAD-166 Ruined Monastery (1.3; Conquering battlefields, Discard); SFD-210 Hall of Legends (1.1; Conquering battlefields, Readies the legend); OGN-286 Reckoner's Arena (1.0; Conquering battlefields, Holding battlefields); OGN-275 Altar to Unity (0.5; Holding battlefields)
- **Popularity and results (DATA):** 17 published lists since 2026-10-23 (rank 33 of 58, 1.2%); riftbound.gg week-2 tier 3, 0 wins, 1 top cuts; EU Regional Championship 36% over 28 matches; registered as an extra Neeko legend in 3 fetched lists
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 7 of the 11 official field tables (first 2026-05-21, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 298 Day 1 pilots = 5.0% of the field, 71 in Day 2 = 6.7% of Day 2; Day 2 conversion 24% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 11 first, 8 second, 10 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=10, 7 with tournament provenance; sources: pa-fetch 10):** champion LeBlanc, Fragmented 10/10; runes 8 Order / 4 Mind 7/10, 7 Order / 5 Mind 3/10; battlefields Windswept Hillock 10/10, Dusk Rose Lab 7/10, Star Spring 7/10, Trifarian War Camp 2/10, Black Rose Sanctum 1/10; core (>=75%) Soaring Scout 10/10 x3.0, Karthus, Eternal 10/10 x3.0, Ruined Rex 10/10 x3.0, Glasc Mixologist 10/10 x2.8, Sacrifice 10/10 x2.7, Mirror Image 10/10 x1.8, LeBlanc, Fragmented 10/10 x1.2, Harnessed Dragon 9/10 x3.0, Baited Hook 9/10 x3.0, Vi, Peacekeeper 9/10 x2.2, Thousand-Tailed Watcher 9/10 x2.1, Honest Broker 9/10 x2.1; flex (25-74%) Rift Herald 7/10, Watchful Sentry 7/10, Black Rose Dignitary 6/10, Deathgrip 6/10, Hidden Blade 6/10, Seal of Unity 3/10; side deck Decree of Unity 10/10, Salvage 9/10, Bellows Breath 5/10, LeBlanc, Everywhere at Once 5/10, Decree of Insight 4/10; shape labels from the deck-theory clustering (6 labelled): big-control 6
- **Pre-Radiance lists (DATA, n=9, 9 with tournament provenance; sources: official-rq 4, pa-fetch 3, pa-sample 1, r1-top3 1; newest set in list: UNL 5, VEN 4; 4 of them hold a card that is banned today):** champion LeBlanc, Fragmented 9/9; runes 8 Order / 4 Mind 9/9; battlefields Windswept Hillock 8/8, Star Spring 8/8, Aspirant's Climb 4/8 (BANNED since 2026-07-24), Dusk Rose Lab 2/8, Forbidding Waste 2/8; core (>=75%) Soaring Scout 9/9 x3.0, Karthus, Eternal 9/9 x3.0, Glasc Mixologist 9/9 x3.0, Ruined Rex 9/9 x3.0, Watchful Sentry 9/9 x2.8, Sacrifice 9/9 x2.8, Black Rose Dignitary 9/9 x2.6, Vi, Peacekeeper 9/9 x2.3; flex (25-74%) Honest Broker 4/9; side deck LeBlanc, Everywhere at Once 7/8, Ashe, Focused 6/8, Atakhan 6/8, Thousand-Tailed Watcher 5/8, Turn to Dust 5/8; shape labels from the deck-theory clustering (4 labelled): big-control 3, unit-aggro 1
- **Data confidence: ok; advice basis: radiance-lists** (10 complete Radiance-era lists (7 with tournament provenance: event-named, podium or official); 9 complete pre-Radiance lists)

### UNL-201 Voidreaver (Kha'Zix), Body/Chaos

- **Text (FACT, cards.json@2026-09-06):** "When you win a combat, gain 1 XP. // Spend 1 XP, [Exhaust]: [Buff] a unit. // Spend 2 XP, [Exhaust]: Move an exhausted friendly unit from a battlefield to its base."
- Printing codes: UNL-201, UNL-236, UNL-236*, UNL-236s
- Parsed ability 1 (HEURISTIC parse): triggered; condition "When you win a combat"; effect "gain 1 XP."
- Parsed ability 2 (HEURISTIC parse): activated; cost Spend 1 XP + [Exhaust]; effect "[Buff] a unit."
- Parsed ability 3 (HEURISTIC parse): activated; cost Spend 2 XP + [Exhaust]; effect "Move an exhausted friendly unit from a battlefield to its base."
- **Rewards (HEURISTIC, from the quoted text):** Winning combats ["When you win a combat"]
- **Needs (HEURISTIC, from the quoted text):** XP / Level ["Spend 1 XP"]; XP / Level ["Spend 2 XP"]
- **Enables (HEURISTIC, from the quoted text):** XP / Level ["gain 1 XP."]; Moving units ["Move an exhausted friendly unit from a battlefield to its base."]; Buffs ["[Buff] a unit."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - UNL-143 Kha'Zix, Mutating Horror (4 Energy, 1 Power, 4 Might): "[Ambush] (You may play me as a [Reaction] to a battlefield where you have units.) // When I attack or defend, if an enemy unit is alone here, give me +2 [Might] this turn and gain 2 XP."
  - UNL-119 Kha'Zix, Evolving Hunter (5 Energy, 1 Power, 5 Might): "[Hunt] (When I conquer or hold, gain 1 XP.) // When I attack, you may spend 3 XP to deal damage equal to my Might to an enemy unit here."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** UNL-202 Void Assault (spell, 2 Energy, 1 Power): "Move a friendly unit, then move an enemy unit. (If they both move to a battlefield you don't control, you're the attacker.)"
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** combat-win 1.00 [rewards] pool 16; level 1.00 [enables/needs] pool 23; movement 0.70 [enables] pool 64; buff 0.60 [enables] pool 18
- **Battlefields by text (HEURISTIC):** UNL-213 Gardens of Becoming (1.0; XP / Level); OGN-277 Back-Alley Bar (0.7; Moving units); UNL-206 Altar of Blood (0.7; Moving units); OGN-282 Monastery of Hirana (0.6; Buffs); SFD-210 Hall of Legends (0.6; Readies the legend)
- **Popularity and results (DATA):** 31 published lists since 2026-10-23 (rank 15 of 58, 2.1%); riftbound.gg week-2 tier 3, 0 wins, 0 top cuts; EU Regional Championship 55% over 11 matches; registered as an extra Neeko legend in 1 fetched lists
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 7 of the 11 official field tables (first 2026-05-21, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 190 Day 1 pilots = 3.2% of the field, 41 in Day 2 = 3.9% of Day 2; Day 2 conversion 22% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 0 first, 2 second, 3 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=7, 7 with tournament provenance; sources: pa-fetch 7):** champion Kha'Zix, Mutating Horror 7/7; runes 6 Body / 6 Chaos 7/7; battlefields Star Spring 7/7, Sandswept Tomb 7/7, Forbidding Waste 6/7, Packed Amphitheater 1/7; core (>=75%) Punch First 7/7 x3.0, Irresistible Faefolk 7/7 x3.0, Void Assault 7/7 x3.0, Rengar, Trophy Hunter 7/7 x1.9, Star-Crossed 7/7 x1.7, Rampage 7/7 x1.6, Kha'Zix, Mutating Horror 7/7 x1.3, Fizz, Trickster 6/7 x2.3, Shadow Order Disciple 6/7 x2.3, Sabotage 6/7 x1.3, Switcheroo 6/7 x1.2; flex (25-74%) Reckless Innovator 5/7, Vex, Apathetic 5/7, Traveling Merchant 5/7, Ride the Wind 5/7, Up from the Deep 4/7, Zed, Without a Sound 4/7, Gust 4/7, Hard Bargain 4/7; side deck Decree of Strength 7/7, Sabotage 6/7, An Offer You Can't Refuse 5/7, Ravenbloom Prefect 5/7, Star-Crossed 5/7; shape labels from the deck-theory clustering (7 labelled): unit-aggro 7
- **Pre-Radiance lists (DATA, n=8, 8 with tournament provenance; sources: official-rq 5, pa-fetch 2, r1-top3 1; newest set in list: UNL 4, VEN 4; 6 of them hold a card that is banned today):** champion Kha'Zix, Mutating Horror 6/7, Rengar, Trophy Hunter 1/7; runes 6 Body / 6 Chaos 5/8, 7 Body / 5 Chaos 2/8, 7 Chaos / 5 Body 1/8; battlefields Forbidding Waste 6/7, Zaun Warrens 5/7, Star Spring 4/7, Sandswept Tomb 4/7, The Arena's Greatest 2/7 (BANNED since 2026-07-24); core (>=75%) Kha'Zix, Mutating Horror 8/8 x1.0, Irresistible Faefolk 7/8 x3.0, Void Assault 7/8 x3.0, Rengar, Trophy Hunter 7/8 x2.7, Punch First 7/8 x2.6, Star-Crossed 7/8 x2.3, Sabotage 7/8 x2.1, Stacked Deck 6/8 x3.0 (BANNED since 2026-09-18); flex (25-74%) Traveling Merchant 5/8, Up from the Deep 4/8, Zed, Without a Sound 4/8, Switcheroo 4/8, Shadow Order Disciple 3/8, Mister Root 3/8, Akshan, Mischievous 3/8, Rampage 3/8; side deck Sabotage 7/8, Gust 4/8, Akshan, Mischievous 4/8, Unyielding Spirit 3/8, Decree of Strength 3/8; shape labels from the deck-theory clustering (1 labelled): unit-aggro 1
- **Data confidence: ok; advice basis: radiance-lists** (7 complete Radiance-era lists (7 with tournament provenance: event-named, podium or official); 8 complete pre-Radiance lists)

### UNL-203 Keeper of the Hammer (Poppy), Body/Order

- **Text (FACT, cards.json@2026-09-06):** "When you hold, gain 1 XP. // Spend 3 XP, [Exhaust]: Draw 1."
- Printing codes: UNL-203, UNL-237, UNL-237*, UNL-237s
- Parsed ability 1 (HEURISTIC parse): triggered; condition "When you hold"; effect "gain 1 XP."
- Parsed ability 2 (HEURISTIC parse): activated; cost Spend 3 XP + [Exhaust]; effect "Draw 1."
- **Rewards (HEURISTIC, from the quoted text):** Holding battlefields ["When you hold"]
- **Needs (HEURISTIC, from the quoted text):** XP / Level ["Spend 3 XP"]
- **Enables (HEURISTIC, from the quoted text):** XP / Level ["gain 1 XP."]; Card draw ["Draw 1."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - UNL-116 Poppy, Paragon (5 Energy, 5 Might): "[Deflect] (Opponents must pay [Any] to choose me with a spell or ability.) // When you play me, if an opponent's score is within 3 points of the Victory Score, ready me and gain 3 XP."
  - UNL-178 Poppy, Defender of the Meek (6 Energy, 1 Power, 5 Might): "You may spend 3 XP as an additional cost to play me. If you do, I cost [3] less. // [Ambush] (You may play me as a [Reaction] to a battlefield where you have units.) // [Tank] (I must be assigned combat damage first.)"
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** UNL-204 Keeper's Verdict (spell, 2 Energy, 2 Power): "[Action] (Play on your turn or in showdowns.) // Choose an enemy unit at a battlefield. Its owner places it on the top or bottom of their Main Deck."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** hold 1.00 [rewards] pool 8; level 1.00 [enables/needs] pool 22; draw 0.60 [enables] pool 27
- **Battlefields by text (HEURISTIC):** UNL-213 Gardens of Becoming (1.0; XP / Level); SFD-210 Hall of Legends (0.6; Readies the legend); OGN-275 Altar to Unity (0.5; Holding battlefields); OGN-280 Grove of the God-Willow (0.5; Holding battlefields); OGN-281 Hallowed Tomb (0.5; Holding battlefields)
- **Popularity and results (DATA):** 12 published lists since 2026-10-23 (rank 46 of 58, 0.8%)
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 7 of the 11 official field tables (first 2026-05-21, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 51 Day 1 pilots = 0.9% of the field, 3 in Day 2 = 0.3% of Day 2; Day 2 conversion 6% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 0 first, 1 second, 1 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=8, 3 with tournament provenance; sources: pa-fetch 8):** champion Poppy, Paragon 8/8; runes 6 Body / 6 Order 3/8, 7 Body / 5 Order 3/8, 8 Body / 4 Order 2/8; battlefields Gardens of Becoming 4/8, Sandswept Tomb 4/8, Sunken Temple 3/8, Sigil of the Storm 2/8, Threshold of the Gray 2/8; core (>=75%) Poppy, Paragon 8/8 x1.0, Rampage 7/8 x2.7, Sabotage 7/8 x2.1, Punch First 6/8 x2.8, Rengar, Trophy Hunter 6/8 x2.3; flex (25-74%) Grim Resolve 5/8, Shepherd's Heirloom 5/8, Irresistible Faefolk 5/8, Kinkou Initiate 5/8, Keeper's Verdict 5/8, Repulse 5/8, Demacian Diplomat 4/8, Master Yi, Tempered 4/8; side deck Salvage 5/8, Sabotage 5/8, Graves, Blasting Through 4/8, Repulse 4/8, Vi, Peacekeeper 4/8; shape labels from the deck-theory clustering (3 labelled): big-control 2, unit-aggro 1
- **Pre-Radiance lists (DATA, n=6, 6 with tournament provenance; sources: official-rq 4, pa-fetch 1, pa-sample 1; newest set in list: UNL 3, VEN 3; 2 of them hold a card that is banned today):** champion Poppy, Paragon 6/6; runes 6 Body / 6 Order 3/6, 7 Body / 5 Order 3/6; battlefields Forgotten Monument 5/5, Sigil of the Storm 4/5, Aspirant's Climb 2/5 (BANNED since 2026-07-24), Threshold of the Gray 2/5, The Papertree 1/5; core (>=75%) Confront 6/6 x3.0, Mobilize 6/6 x3.0, Catalyst of Aeons 6/6 x3.0, Dazzling Aurora 6/6 x3.0, Elder Dragon 6/6 x3.0, Flurry of Blades 6/6 x2.7, Blood Money 6/6 x2.7, Harnessed Dragon 6/6 x2.5; flex (25-74%) Cull the Weak 4/6, The Ruination 4/6, Salvage 3/6, Challenge 2/6, Divine Judgment 2/6, Grand Strategem 2/6; side deck Salvage 6/6, Rengar, Trophy Hunter 4/6, Sabotage 4/6, Divine Judgment 3/6, Challenge 1/6; shape labels from the deck-theory clustering (2 labelled): big-control 2
- **Data confidence: ok; advice basis: radiance-lists** (8 complete Radiance-era lists (3 with tournament provenance: event-named, podium or official); 6 complete pre-Radiance lists)

### VEN-139 Rogue Assassin (Akali), Fury/Calm

- **Text (FACT, cards.json@2026-09-06):** "[Empower] [3][Any] ([3][Any]: Empower this. Use only if not Empowered.) // [Action][>] [Exhaust]: If it's your turn, move a friendly unit in a showdown to base and if I'm [Empowered], ready it."
- Printing codes: VEN-139, VEN-189, VEN-189*, VEN-189s
- Parsed ability 1 (HEURISTIC parse): activated; cost [3][Any]; restriction "Use only if not Empowered."; effect "Empower this."
- Parsed ability 2 (HEURISTIC parse): activated; action speed; cost [Exhaust]; condition "If it's your turn"; effect "move a friendly unit in a showdown to base and if I'm [Empowered], ready it."
- **Enables (HEURISTIC, from the quoted text):** Moving units ["move a friendly unit in a showdown to base and if I'm [Empowered], ready it."]; Empower ["Empower this."]; Empower ["move a friendly unit in a showdown to base and if I'm [Empowered], ready it."]; Readying units ["move a friendly unit in a showdown to base and if I'm [Empowered], ready it."]; Showdown-speed play ["move a friendly unit in a showdown to base and if I'm [Empowered], ready it."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - VEN-021 Akali, Deadly Weapon (3 Energy, 3 Might): "[Empower] [2][Fury] ([2][Fury]: Empower me. Use only if not Empowered.) // When I move, you may deal 1 to a unit at a battlefield I moved to or from. If I'm [Empowered], deal 2 instead. // [Empowered][>] I have +1 [Might]."
  - VEN-038 Akali, Silent (4 Energy, 1 Power, 4 Might): "I can't be chosen by enemy spells and abilities unless I'm in combat. // When I move to a battlefield, give me +2 [Might] this turn."
  - RAD-015 Akali, Brash (5 Energy, 1 Power, 5 Might): "The first time I move each turn, [Add] [1][Any]. // The second time I move each turn, banish the top card of your Main Deck. Until your next Ending Phase, you may play that card. (You still pay its costs.)"
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** VEN-140 Shuriken Flip (spell, 1 Energy, 1 Power): "Deal 2 to up to one enemy unit at a battlefield, then move a friendly unit. // [Flow] [3][Any] (You may play this from your trash for its Flow cost. Then banish it.)"
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** movement 0.90 [enables] pool 42; empower 0.67 [enables] pool 13; ready 0.60 [enables] pool 46; showdown 0.60 [enables] pool 60
- **Battlefields by text (HEURISTIC):** OGN-277 Back-Alley Bar (0.9; Moving units); UNL-206 Altar of Blood (0.9; Moving units); SFD-210 Hall of Legends (0.6; Readies the legend)
- **Popularity and results (DATA):** 33 published lists since 2026-10-23 (rank 13 of 58, 2.3%); riftbound.gg week-2 tier 2, 0 wins, 2 top cuts; EU Regional Championship 44% over 16 matches
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 3 of the 11 official field tables (first 2026-08-26, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 220 Day 1 pilots = 3.7% of the field, 26 in Day 2 = 2.5% of Day 2; Day 2 conversion 12% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 4 first, 1 second, 0 third; with a Radiance card in the list: 1 / 0 / 0
- **Radiance-era lists (DATA, n=10, 8 with tournament provenance; sources: pa-fetch 9, r1-top3 1):** champion Akali, Deadly Weapon 10/10; runes 7 Fury / 5 Calm 6/10, 6 Fury / 6 Calm 3/10, 8 Fury / 4 Calm 1/10; battlefields Void Gate 8/10, Forgotten Monument 7/10, Sigil of the Storm 6/10, Back-Alley Bar 1/10, Targon's Peak 1/10; core (>=75%) Defy 10/10 x2.9, Discipline 10/10 x2.9, Stellacorn Herder 10/10 x2.9, Shuriken Flip 10/10 x2.9, Long Sword 10/10 x2.3, Back Off 10/10 x1.8, Akali, Deadly Weapon 10/10 x1.0, Zhonya's Hourglass 9/10 x2.9, Falling Star 9/10 x2.4, Mournful Witness 8/10 x2.4, Not So Fast 8/10 x1.0; flex (25-74%) Astral Heron 7/10, Kai'Sa, Survivor 7/10, Blitzcrank, Impassive 7/10, Mischievous Marai 6/10, Scuttle Crab 5/10, Charm 5/10, Noxus Hopeful 5/10, Irelia, Fervent 5/10; side deck Not So Fast 7/8, Decree of Rage 6/8, Decree of Focus 6/8, Akali, Silent 6/8, Ferrous Forerunner 5/8; shape labels from the deck-theory clustering (7 labelled): spell-tempo 7
- **Pre-Radiance lists (DATA, n=5, 5 with tournament provenance; sources: official-rq 2, pa-fetch 2, r1-top3 1; newest set in list: VEN 5; 0 of them hold a card that is banned today):** champion Akali, Deadly Weapon 5/5; runes 6 Fury / 6 Calm 3/5, 7 Fury / 5 Calm 2/5; battlefields Void Gate 4/5, Sigil of the Storm 3/5, Forgotten Monument 2/5, Back-Alley Bar 1/5, Targon's Peak 1/5; core (>=75%) Defy 5/5 x3.0, Discipline 5/5 x3.0, Stellacorn Herder 5/5 x3.0, Shuriken Flip 5/5 x3.0, Zhonya's Hourglass 5/5 x2.8, Falling Star 5/5 x2.6, Akali, Deadly Weapon 5/5 x1.0, Astral Heron 4/5 x3.0; flex (25-74%) Kai'Sa, Survivor 3/5, Scuttle Crab 3/5, Mischievous Marai 3/5, Blitzcrank, Impassive 3/5, Not So Fast 3/5, En Garde 2/5, Lonely Poro 2/5, Irelia, Fervent 2/5; side deck Ferrous Forerunner 5/5, Against the Odds 5/5, Not So Fast 5/5, Akali, Silent 5/5, Decree of Focus 3/5; shape labels from the deck-theory clustering (2 labelled): spell-tempo 2
- **Data confidence: ok; advice basis: radiance-lists** (10 complete Radiance-era lists (8 with tournament provenance: event-named, podium or official); 5 complete pre-Radiance lists)

### VEN-141 Butcher of the Sands (Renekton), Fury/Body

- **Text (FACT, cards.json@2026-09-06):** "[Reaction][>] [Any][Any], [Exhaust]: [Add] [2]. Spend this Energy only to play units or activated abilities of units."
- Printing codes: VEN-141, VEN-190, VEN-190*, VEN-190s
- Parsed ability 1 (HEURISTIC parse): activated; reaction speed; cost [Any][Any] + [Exhaust]; restriction "Spend this Energy only to play units or activated abilities of units."; effect "[Add] [2]."
- **Rewards (HEURISTIC, from the quoted text):** Activated abilities ["Spend this Energy only to play units or activated abilities of units."]; Playing units ["Spend this Energy only to play units or activated abilities of units."]
- **Enables (HEURISTIC, from the quoted text):** Adding resources ["[Add] [2]."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - VEN-092 Renekton, Brute (5 Energy, 4 Might): "[1]: Give me +1 [Might] this turn. // When my Might becomes 10 or more, empower me. (I become Empowered if I'm not already.) // [Empowered][>] I have [Deflect] and [Ganking]. (Opponents must pay [Any] to choose me with a spell or ability. I can move from battlefield to battlefield.)"
  - VEN-019 Renekton, Rage Fueled (6 Energy, 6 Might): "[Accelerate] (You may pay [1][Fury] as an additional cost to have me enter ready.) // When I attack, if you control 4 or fewer runes, deal 2 to all enemy units here."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** VEN-142 Dominus (spell, 4 Energy): "[Action] (Play on your turn or in showdowns.) // This turn, double a unit's Might and give it "[Any][Any]: Ready me.""
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** activated-abilities 1.00 [rewards] pool 15; unit 1.00 [rewards] pool 28; energy-ramp 0.60 [enables] pool 8
- **Battlefields by text (HEURISTIC):** RAD-162 Firelights' Hideout (1.0; Playing units); SFD-210 Hall of Legends (0.6; Readies the legend); VEN-166 Threshold of the Gray (0.6; Adding resources); RAD-165 Rakelstake (0.5; Playing units); VEN-161 Piltovan Forge (0.5; Activated abilities)
- **Popularity and results (DATA):** 14 published lists since 2026-10-23 (rank 40 of 58, 1.0%)
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 3 of the 11 official field tables (first 2026-08-26, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 50 Day 1 pilots = 0.8% of the field, 1 in Day 2 = 0.1% of Day 2; Day 2 conversion 2% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 0 first, 0 second, 1 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=10, 1 with tournament provenance; sources: pa-fetch 10):** champion Renekton, Rage Fueled 9/10, Renekton, Brute 1/10; runes 6 Fury / 6 Body 5/10, 7 Fury / 5 Body 3/10, 8 Fury / 4 Body 2/10; battlefields Black Market 8/10, Protective Sands 5/10, Sigil of the Storm 2/10, Ruined Monastery 2/10, Seat of Power 2/10; core (>=75%) Kai'Sa, Survivor 10/10 x3.0, Coalesced Energy 9/10 x2.9, Rampage 9/10 x2.2, Renekton, Rage Fueled 9/10 x1.0, Punch First 8/10 x2.8; flex (25-74%) Noxus Hopeful 7/10, Falling Star 7/10, Kinkou Initiate 6/10, Rengar, Trophy Hunter 6/10, Irresistible Faefolk 5/10, Inferna 5/10, First Mate 5/10, Ferrous Forerunner 5/10; side deck Decree of Rage 7/8, Brittle Steel 5/8, Thermo Beam 5/8, Decree of Strength 4/8, Unyielding Spirit 4/8; shape labels from the deck-theory clustering (1 labelled): unit-aggro 1
- **Pre-Radiance lists (DATA, n=5, 5 with tournament provenance; sources: official-rq 3, pa-fetch 1, r1-top3 1; newest set in list: VEN 5; 0 of them hold a card that is banned today):** champion Renekton, Rage Fueled 4/4; runes 7 Body / 5 Fury 3/5, 6 Fury / 6 Body 1/5, 8 Body / 4 Fury 1/5; battlefields Star Spring 4/5, Seat of Power 3/5, Protective Sands 3/5, Sigil of the Storm 1/5, Vilemaw's Lair 1/5; core (>=75%) Punch First 5/5 x2.8, Renekton, Rage Fueled 5/5 x1.0, Irresistible Faefolk 4/5 x3.0, Rengar, Trophy Hunter 4/5 x3.0, Noxus Hopeful 4/5 x2.8, Kai'Sa, Survivor 4/5 x2.8, Inferna 4/5 x2.8, Nidalee, Cat Form 4/5 x2.8; flex (25-74%) First Mate 3/5, Kinkou Initiate 3/5, Dominus 3/5, Cleave 3/5, Grim Apothecary 3/5, Ruin Runner 2/5, Challenge 2/5, Brittle Steel 2/5; side deck Decree of Strength 4/5, Brittle Steel 4/5, Ferrous Forerunner 3/5, Sabotage 3/5, Decree of Rage 3/5; shape labels from the deck-theory clustering (1 labelled): unit-aggro 1
- **Data confidence: thin; advice basis: radiance-lists** (10 complete Radiance-era lists (1 with tournament provenance: event-named, podium or official); 5 complete pre-Radiance lists)

### VEN-143 Master of Shadows (Zed), Fury/Chaos

- **Text (FACT, cards.json@2026-09-06):** "When you banish a card you own, empower me. (I become Empowered if I'm not already.) // [Action][>] Disempower me, [Exhaust]: Discard 1, then draw 1."
- Printing codes: VEN-143, VEN-191, VEN-191*, VEN-191s
- Parsed ability 1 (HEURISTIC parse): triggered; condition "When you banish a card you own"; effect "empower me."
- Parsed ability 2 (HEURISTIC parse): activated; action speed; cost Disempower me + [Exhaust]; effect "Discard 1, then draw 1."
- **Rewards (HEURISTIC, from the quoted text):** Banishing own cards ["When you banish a card you own"]
- **Needs (HEURISTIC, from the quoted text):** Empower ["Disempower me"]
- **Enables (HEURISTIC, from the quoted text):** Empower ["empower me."]; Discard ["Discard 1, then draw 1."]; Card draw ["Discard 1, then draw 1."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - VEN-023 Zed, From the Shadows (4 Energy, 1 Power, 4 Might): "You may discard 1 as an additional cost to play me. // When you play me, if you paid the additional cost, play a 0 [Might] Shadow Clone unit token. (It has "When I attack, you may banish a unit from your trash. If you do, give me [Assault 4] this turn.")"
  - VEN-112 Zed, Without a Sound (5 Energy, 5 Might): "When I conquer, play a 0 [Might] Shadow Clone unit token to your base. (It has "When I attack, you may banish a unit from your trash. If you do, give me [Assault 4] this turn.") // [Action][>] [1][Chaos]: Move me and a Shadow Clone you control to each other's locations."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** VEN-144 Death Mark (spell, 2 Energy, 1 Power): "[Burn 3]. (Put the top 3 cards of your Main Deck into your trash.) // Play a 0 [Might] Shadow Clone unit token. (It has "When I attack, you may banish a unit from your trash. If you do, give me [Assault 4] this turn.") // [Flow] [1][Any][Any] (You may play this from your trash for its Flow cost. Then banish it.)"
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** banish 1.00 [rewards] pool 14; empower 0.80 [enables/needs] pool 10; discard 0.70 [enables] pool 25; draw 0.60 [enables] pool 30; token 0.50 [champion or signature text only] pool 9
- **Battlefields by text (HEURISTIC):** VEN-163 Risen Altar (0.8; Empower); SFD-210 Hall of Legends (0.6; Readies the legend)
- **Popularity and results (DATA):** 31 published lists since 2026-10-23 (rank 16 of 58, 2.1%)
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 3 of the 11 official field tables (first 2026-08-26, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 78 Day 1 pilots = 1.3% of the field, 2 in Day 2 = 0.2% of Day 2; Day 2 conversion 3% against 18% for the whole field
- **Radiance-era lists (DATA, n=9, 3 with tournament provenance; sources: pa-fetch 9):** champion Zed, Without a Sound 5/9, Zed, From the Shadows 4/9; runes 7 Fury / 5 Chaos 3/9, 7 Chaos / 5 Fury 2/9, 6 Fury / 6 Chaos 2/9; battlefields Zaun Warrens 9/9, Minefield 6/9, Sigil of the Storm 3/9, Forbidding Waste 3/9, Ruined Monastery 2/9; core (>=75%) Runeblade Anvil 9/9 x2.9, Traveling Merchant 8/9 x3.0, Noxus Hopeful 8/9 x2.8, Rhasa the Sunderer 8/9 x2.8, Battering Ram 7/9 x2.9, Bedeviling Stranger 7/9 x1.9, Bushwhack 7/9 x1.4, Switcheroo 7/9 x1.1; flex (25-74%) Detonate 6/9, Treasure Trove 6/9, Ride the Wind 6/9, Last Rites 6/9, Pack of Wonders 5/9, Fizz, Trickster 5/9, Zed, Without a Sound 5/9, Seal of Discord 4/9; side deck Hard Bargain 6/8, Gust 4/8, Abandon 4/8, Star-Crossed 4/8, Vex, Apathetic 4/8; shape labels from the deck-theory clustering (3 labelled): gear-engine 2, unit-aggro 1
  - Builds by Chosen Champion (DATA): Zed, Without a Sound 5/9 sets itself apart with Ride the Wind, Switcheroo; Zed, From the Shadows 4/9 sets itself apart with Pack of Wonders, Treasure Trove, Detonate, Last Rites, Seal of Rage
- **Pre-Radiance lists (DATA, n=4, 4 with tournament provenance; sources: official-rq 2, pa-fetch 2; newest set in list: VEN 4; 2 of them hold a card that is banned today):** champion Zed, Without a Sound 4/4; runes 8 Chaos / 4 Fury 3/4, 7 Chaos / 5 Fury 1/4; battlefields Zaun Warrens 4/4, Minefield 4/4, Forbidding Waste 3/4, Forge of the Fluft 1/4; core (>=75%) Traveling Merchant 4/4 x3.0, Tideturner 4/4 x2.2, Switcheroo 4/4 x2.0, Perfect Execution 4/4 x2.0, Death Mark 4/4 x2.0, Up from the Deep 4/4 x1.8, Zed, Without a Sound 4/4 x1.0, Kai'Sa, Survivor 3/4 x3.0; flex (25-74%) Stacked Deck 2/4 (BANNED since 2026-09-18), Vi, Destructive 2/4, Star-Crossed 2/4, Gust 2/4, Flash 2/4, Hard Bargain 2/4, Boots of Swiftness 1/4, Tornado Warrior 1/4; side deck Ravenbloom Prefect 4/4, Brittle Steel 4/4, Star-Crossed 3/4, Up from the Deep 3/4, Pyke, Returned 2/4; shape labels from the deck-theory clustering (2 labelled): unit-aggro 2
- **Data confidence: ok; advice basis: radiance-lists** (9 complete Radiance-era lists (3 with tournament provenance: event-named, podium or official); 4 complete pre-Radiance lists)

### VEN-145 Curator of the Sands (Nasus), Calm/Mind

- **Text (FACT, cards.json@2026-09-06):** "When you play a unit, gear, or activated ability with Energy cost [7] or more, you may exhaust me to ready up to 2 runes."
- Printing codes: VEN-145, VEN-192, VEN-192*, VEN-192s
- Parsed ability 1 (HEURISTIC parse): triggered; cost exhaust me; condition "When you play a unit, gear, or activated ability with Energy cost [7] or more"; effect "ready up to 2 runes."
- **Rewards (HEURISTIC, from the quoted text):** Expensive units / gear / abilities (7+ Energy) ["When you play a unit, gear, or activated ability with Energy cost [7] or more"]
- **Enables (HEURISTIC, from the quoted text):** Readying runes ["ready up to 2 runes."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - VEN-063 Nasus, Guardian of Knowledge (5 Energy, 1 Power, 6 Might): "Once each turn, when an enemy unit here dies, channel 1 rune exhausted."
  - VEN-046 Nasus, Ascended (8 Energy, 1 Power, 8 Might): "[Deflect 2] (Opponents must pay [Any][Any] to choose me with a spell or ability.) // [Empower] [8] ([8]: Empower me. Use only if not Empowered.) // [Empowered][>] When I conquer, you score 1 point."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** VEN-146 Siphoning Strike (spell, 4 Energy): "Deal 4 to a unit at a battlefield. If you control 7 or more runes, deal 7 to it instead. When it dies this turn, channel 1 rune exhausted."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** expensive-permanents 1.00 [rewards] pool 20; ready-runes 0.60 [enables] pool 3; channel-rune 0.32 [champion or signature text only] pool 10; death 0.32 [champion or signature text only] pool 10
- **Battlefields by text (HEURISTIC):** SFD-210 Hall of Legends (0.6; Readies the legend)
- **Popularity and results (DATA):** 21 published lists since 2026-10-23 (rank 25 of 58, 1.5%); riftbound.gg week-2 tier 4, 0 wins, 1 top cuts; EU Regional Championship 53% over 17 matches
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 3 of the 11 official field tables (first 2026-08-26, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 207 Day 1 pilots = 3.5% of the field, 22 in Day 2 = 2.1% of Day 2; Day 2 conversion 11% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 3 first, 1 second, 0 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=8, 3 with tournament provenance; sources: pa-fetch 8):** champion Nasus, Ascended 6/8, Nasus, Guardian of Knowledge 2/8; runes 7 Mind / 5 Calm 4/8, 6 Calm / 6 Mind 4/8; battlefields Rockfall Path 7/8, Ruined Monastery 5/8, Vilemaw's Lair 3/8, Cosmic Vista 2/8, The Papertree 2/8; core (>=75%) Thousand-Tailed Watcher 8/8 x2.9, Defy 8/8 x2.8, Bellows Breath 8/8 x2.6, Scuttle Crab 8/8 x2.6, Temporal Breach 7/8 x2.3, Discipline 6/8 x3.0, Ravenbloom Student 6/8 x3.0, Stupefy 6/8 x2.8, Lonely Poro 6/8 x2.7, Find Your Center 6/8 x2.5, Nasus, Ascended 6/8 x1.0; flex (25-74%) Life from Stone 5/8, The Empyrean 4/8, Sprite Queen 4/8, Zhonya's Hourglass 4/8, Time Warp 4/8, Hush 4/8, Not So Fast 4/8, Retreat 3/8; side deck Tomb-Raider Barbara 8/8, Hush 6/8, Decree of Insight 5/8, Decree of Focus 5/8, Twilight Shroud 4/8; shape labels from the deck-theory clustering (3 labelled): spell-tempo 2, big-control 1
  - Builds by Chosen Champion (DATA): Nasus, Ascended 6/8 sets itself apart with Zhonya's Hourglass, Tasty Faefolk, Lecturing Yordle, Retreat, Piltovan Guidebot; Nasus, Guardian of Knowledge 2/8 sets itself apart with Sprite Burst, Tomb-Raider Barbara
- **Pre-Radiance lists (DATA, n=9, 9 with tournament provenance; sources: official-rq 2, pa-fetch 3, r1-top3 4; newest set in list: VEN 9; 0 of them hold a card that is banned today):** champion Nasus, Ascended 9/9; runes 6 Calm / 6 Mind 6/9, 7 Mind / 5 Calm 3/9; battlefields Vilemaw's Lair 6/9, Forgotten Monument 3/9, Rockfall Path 3/9, Sunken Temple 3/9, The Papertree 3/9; core (>=75%) Defy 9/9 x3.0, Discipline 9/9 x3.0, Stupefy 9/9 x2.9, Find Your Center 9/9 x2.8, Thousand-Tailed Watcher 9/9 x2.8, Nasus, Ascended 9/9 x1.0, Ravenbloom Student 8/9 x3.0, Bellows Breath 8/9 x2.1; flex (25-74%) Astral Heron 6/9, Zhonya's Hourglass 6/9, Retreat 5/9, Steel Paws 5/9, Tasty Faefolk 5/9, Charm 5/9, Time Warp 5/9, Back Off 5/9; side deck Not So Fast 9/9, Singularity 7/9, Tomb-Raider Barbara 6/9, Pickpocket 5/9, Helm of Suppression 4/9; shape labels from the deck-theory clustering (3 labelled): spell-tempo 2, big-control 1
- **Data confidence: ok; advice basis: radiance-lists** (8 complete Radiance-era lists (3 with tournament provenance: event-named, podium or official); 9 complete pre-Radiance lists)

### VEN-147 Eye of Twilight (Shen), Calm/Order

- **Text (FACT, cards.json@2026-09-06):** "[Action][>] [Exhaust]: Give a friendly unit [Tank] this turn. (It must be assigned combat damage first.)"
- Printing codes: VEN-147, VEN-193, VEN-193*, VEN-193s
- Parsed ability 1 (HEURISTIC parse): activated; action speed; cost [Exhaust]; effect "Give a friendly unit [Tank] this turn."
- **Enables (HEURISTIC, from the quoted text):** Defending ["Give a friendly unit [Tank] this turn."]; Tank ["Give a friendly unit [Tank] this turn."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - OGN-241 Shen, Kinkou (3 Energy, 1 Power, 3 Might): "[Reaction] (Play any time, even before spells and abilities resolve, including to a battlefield you control.) // [Shield 2] (+2 [Might] while I'm a defender.) // [Tank] (I must be assigned combat damage first.)"
  - VEN-042 Shen, Scourge of Shadows (5 Energy, 1 Power, 6 Might): "When I hold, if there is exactly one other unit you control here, draw 1."
  - VEN-138 Shen, Leader of the Kinkou Order (6 Energy, 2 Power, 7 Might): "[Shield] (+1 [Might] while I'm a defender.) // When I hold, if there is exactly one other unit you control here, you score 1 point."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** VEN-148 Shadow Dash (spell, 2 Energy, 1 Power): "Move an enemy unit to a battlefield where you have units. If you have exactly two units there, they each get +1 [Might] this turn. // [Flow] [5][Any][Any] (You may play this from your trash for its Flow cost. Then banish it.)"
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** defend 0.73 [enables] pool 39; tank 0.67 [enables] pool 20
- **Battlefields by text (HEURISTIC):** RAD-161 Durand Memorial (1.4; Defending, Tank); OGN-279 Fortified Position (0.7; Defending); SFD-215 Ravenbloom Conservatory (0.7; Defending); UNL-210 Forbidding Waste (0.7; Defending); VEN-166 Threshold of the Gray (0.7; Defending)
- **Popularity and results (DATA):** 10 published lists since 2026-10-23 (rank 49 of 58, 0.7%); registered as an extra Neeko legend in 1 fetched lists
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 3 of the 11 official field tables (first 2026-08-26, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 65 Day 1 pilots = 1.1% of the field, 0 in Day 2 = 0.0% of Day 2; Day 2 conversion 0% against 18% for the whole field
- **Radiance-era lists (DATA, n=10, 2 with tournament provenance; sources: pa-fetch 10):** champion Shen, Kinkou 9/10, Shen, Leader of the Kinkou Order 1/10; runes 6 Calm / 6 Order 6/10, 7 Calm / 5 Order 3/10, 7 Order / 5 Calm 1/10; battlefields Kinkou Temple 10/10, Grove of the God-Willow 5/10, Trifarian War Camp 3/10, Packed Amphitheater 2/10, Threshold of the Gray 2/10; core (>=75%) Shen, Kinkou 10/10 x1.1, Discipline 9/10 x2.7, Defy 8/10 x2.9, Charm 8/10 x2.1; flex (25-74%) Mournful Witness 7/10, Kennen, Keeper of Balance 7/10, Vi, Peacekeeper 6/10, Disciple of Shen 6/10, Shadow Dash 5/10, Hidden Blade 5/10, Emperor's Divide 5/10, Ki Barrier 5/10; side deck Decree of Unity 5/6, Salvage 5/6, Decree of Focus 5/6, Not So Fast 4/6, Janna, Savior 3/6; shape labels from the deck-theory clustering (2 labelled): spell-tempo 2
- **Pre-Radiance lists (DATA, n=3, 3 with tournament provenance; sources: official-rq 1, pa-fetch 2; newest set in list: VEN 3; 0 of them hold a card that is banned today):** champion Shen, Scourge of Shadows 1/3, Shen, Kinkou 1/3, Shen, Leader of the Kinkou Order 1/3; runes 6 Calm / 6 Order 2/3, 7 Calm / 5 Order 1/3; battlefields Kinkou Temple 3/3, Fortified Position 1/3, Grove of the God-Willow 1/3, Trifarian War Camp 1/3, Forgotten Monument 1/3; core (>=75%) Defy 3/3 x3.0, Discipline 3/3 x3.0, Back Off 3/3 x1.7, Ki Barrier 3/3 x1.7; flex (25-74%) Scuttle Crab 2/3, Fiora, Victorious 2/3, Shadow Dash 2/3, Hidden Blade 2/3, Vi, Peacekeeper 2/3, Kennen, Keeper of Balance 2/3, Charm 2/3, Shen, Leader of the Kinkou Order 2/3; side deck Decree of Focus 3/3, Decree of Unity 3/3, Salvage 2/3, Vengeance 1/3, Disarming Rake 1/3; shape labels from the deck-theory clustering (2 labelled): spell-tempo 2
- **Data confidence: thin; advice basis: radiance-lists** (10 complete Radiance-era lists (2 with tournament provenance: event-named, podium or official); 3 complete pre-Radiance lists)

### VEN-149 Defender of Tomorrow (Jayce), Mind/Body

- **Text (FACT, cards.json@2026-09-06):** "[Empower] [2][Any][Any] ([2][Any][Any]: Empower me. Use only if not Empowered.) // [1], [Exhaust]: Ready a gear. // [Empowered][>] [1], [Exhaust]: Ready 2 gear."
- Printing codes: VEN-149, VEN-194, VEN-194*, VEN-194s
- Parsed ability 1 (HEURISTIC parse): activated; cost [2][Any][Any]; restriction "Use only if not Empowered."; effect "Empower this."
- Parsed ability 2 (HEURISTIC parse): activated; cost [1] + [Exhaust]; effect "Ready a gear."
- Parsed ability 3 (HEURISTIC parse): activated; gate Empowered; cost [1] + [Exhaust]; effect "Ready 2 gear."
- **Rewards (HEURISTIC, from the quoted text):** Empower ["[Empowered]"]
- **Needs (HEURISTIC, from the quoted text):** Gear (non-Equipment included) ["Ready a gear."]; Gear (non-Equipment included) ["Ready 2 gear."]
- **Enables (HEURISTIC, from the quoted text):** Empower ["Empower this."]; Gear (non-Equipment included) ["Ready a gear."]; Gear (non-Equipment included) ["Ready 2 gear."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - SFD-084 Jayce, Man of Progress (4 Energy, 4 Might): "When you play me, you may kill a friendly gear. If you do, you may play a gear with Energy cost no more than [7] from hand this turn, ignoring its Energy cost. (You must still pay its Power cost.)"
  - VEN-088 Jayce, Hammer in Hand (4 Energy, 1 Power, 5 Might): "When I become ready, choose one to give me this turn — // - [Assault 2] (+2 [Might] while I'm an attacker.) // - [Deflect 2] (Opponents must pay [Any][Any] to choose me with a spell or ability.) // - [Ganking] (I can move from battlefield to battlefield.)"
  - VEN-068 Jayce, Brilliant Inventor (6 Energy, 1 Power, 6 Might): "When you play me or the first time you play a non-token gear each turn, you may ready something besides me that's exhausted."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** VEN-150 Acceleration Gate (spell, 3 Energy, 1 Power): "Ready up to 4 units, gear, and/or runes."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** empower 1.00 [enables/rewards] pool 21; gear 1.00 [enables/needs] pool 42
- **Battlefields by text (HEURISTIC):** SFD-221 Veiled Temple (1.0; Gear (non-Equipment included)); VEN-163 Risen Altar (1.0; Empower); SFD-210 Hall of Legends (0.6; Readies the legend); RAD-163 Hunters' Circle (0.5; Gear (non-Equipment included)); RAD-165 Rakelstake (0.5; Gear (non-Equipment included))
- **Popularity and results (DATA):** 29 published lists since 2026-10-23 (rank 18 of 58, 2.0%); riftbound.gg week-2 tier 2, 1 wins, 1 top cuts; EU Regional Championship 68% over 47 matches
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 3 of the 11 official field tables (first 2026-08-26, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 282 Day 1 pilots = 4.7% of the field, 64 in Day 2 = 6.1% of Day 2; Day 2 conversion 23% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 1 first, 2 second, 1 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=4, 3 with tournament provenance; sources: pa-fetch 4):** champion Jayce, Brilliant Inventor 4/4; runes 7 Body / 5 Mind 3/4, 6 Mind / 6 Body 1/4; battlefields Sigil of the Storm 4/4, Forgotten Monument 4/4, Dragon Roost 3/4, The Papertree 1/4; core (>=75%) Platewyrm Egg 4/4 x3.0, Catalyst of Aeons 4/4 x2.8, Dredge Up 4/4 x2.8, Elder Dragon 4/4 x2.5, Garbage Grabber 4/4 x2.2, Progress Day 4/4 x1.0, Jayce, Brilliant Inventor 4/4 x1.0, Dazzling Aurora 3/4 x3.0, Bellows Breath 3/4 x3.0, Clairvoyance 3/4 x3.0, Mobilize 3/4 x2.7, Flurry of Blades 3/4 x2.3; flex (25-74%) Sprite Burst 2/4, Rocket Barrage 2/4, Repulse 2/4, Temporal Breach 2/4, Retreat 1/4, Herald of Scales 1/4, The Empyrean 1/4, Wages of Pain 1/4; side deck Deadly Flourish 4/4, Rocket Barrage 3/4, Repulse 3/4, Gutter Palace 2/4, Sabotage 2/4; shape labels from the deck-theory clustering (3 labelled): big-control 3
- **Pre-Radiance lists (DATA, n=7, 7 with tournament provenance; sources: official-rq 1, pa-fetch 2, r1-top3 4; newest set in list: VEN 7; 0 of them hold a card that is banned today):** champion Jayce, Brilliant Inventor 5/7, Jayce, Hammer in Hand 2/7; runes 7 Body / 5 Mind 3/7, 6 Mind / 6 Body 3/7, 8 Body / 4 Mind 1/7; battlefields Sigil of the Storm 7/7, Forgotten Monument 6/7, The Papertree 4/7, Dragon Roost 2/7, Rockfall Path 1/7; core (>=75%) Mobilize 7/7 x3.0, Dazzling Aurora 7/7 x3.0, Elder Dragon 7/7 x3.0, Clairvoyance 7/7 x3.0, Catalyst of Aeons 7/7 x2.9, Dredge Up 7/7 x2.9, Platewyrm Egg 7/7 x2.7, Promising Future 7/7 x2.6; flex (25-74%) Gutter Palace 5/7, Jayce, Brilliant Inventor 5/7, Rocket Barrage 4/7, Deadly Flourish 4/7, Temporal Breach 3/7, Downstage Dramatics 2/7, Sprite Fountain 2/7, Jayce, Hammer in Hand 2/7; side deck Sabotage 6/7, Sprite Burst 5/7, Turn to Dust 5/7, Deadly Flourish 4/7, Flurry of Blades 3/7; shape labels from the deck-theory clustering (2 labelled): big-control 2
- **Data confidence: thin; advice basis: radiance-lists** (4 complete Radiance-era lists (3 with tournament provenance: event-named, podium or official); 7 complete pre-Radiance lists)

### VEN-151 Soul's Reflection (Mel), Mind/Chaos

- **Text (FACT, cards.json@2026-09-06):** "When you empower something else, empower me. (I become Empowered if I'm not already.) // Disempower me, [Exhaust]: Give a unit at a battlefield -2 [Might] this turn."
- Printing codes: VEN-151, VEN-195, VEN-195*, VEN-195s
- Parsed ability 1 (HEURISTIC parse): triggered; condition "When you empower something else"; effect "empower me."
- Parsed ability 2 (HEURISTIC parse): activated; cost Disempower me + [Exhaust]; effect "Give a unit at a battlefield -2 [Might] this turn."
- **Rewards (HEURISTIC, from the quoted text):** Empower ["When you empower something else"]
- **Needs (HEURISTIC, from the quoted text):** Empower ["Disempower me"]
- **Enables (HEURISTIC, from the quoted text):** Empower ["empower me."]; Reducing enemy Might ["Give a unit at a battlefield -2 [Might] this turn."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - VEN-069 Mel, Newly Awakened (4 Energy, 1 Power, 4 Might): "When you play me, draw 1. // [Empower] [3] ([3]: Empower me. Use only if not Empowered.) // [Empowered][>] Your spells and abilities can't be countered. If a spell or ability you control would give -[Might] to a unit it chooses, it gives an additional -1 [Might]."
  - VEN-110 Mel, Defiant Soul (5 Energy, 4 Might): "[Empower] — Discard a spell (Pay the cost: Empower me. Use only if not Empowered.) // When I become [Empowered], banish an enemy unit at a battlefield with 3 [Might] or less."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** VEN-152 Rebuttal (spell, 1 Energy, 1 Power): "[Reaction] (Play any time, even before spells and abilities resolve.) // Choose a spell with Energy cost no more than [4]. You may pay [Any]. If you do, gain control of it and you may make new choices for it. Otherwise, counter it."
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** empower 1.00 [enables/needs/rewards] pool 13; might-reduction 0.70 [enables] pool 21; spell-matters 0.50 [champion or signature text only] pool 77
- **Battlefields by text (HEURISTIC):** VEN-163 Risen Altar (1.0; Empower); SFD-210 Hall of Legends (0.6; Readies the legend)
- **Popularity and results (DATA):** 15 published lists since 2026-10-23 (rank 37 of 58, 1.0%)
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 3 of the 11 official field tables (first 2026-08-26, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 56 Day 1 pilots = 0.9% of the field, 3 in Day 2 = 0.3% of Day 2; Day 2 conversion 5% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 0 first, 0 second, 2 third; with a Radiance card in the list: 0 / 0 / 0
- **Radiance-era lists (DATA, n=8, 2 with tournament provenance; sources: pa-fetch 8):** champion Mel, Defiant Soul 5/8, Mel, Newly Awakened 3/8; runes 7 Mind / 5 Chaos 4/8, 6 Mind / 6 Chaos 3/8, 8 Mind / 4 Chaos 1/8; battlefields Ravenbloom Conservatory 5/8, Frozen Fortress 4/8, Threshold of the Gray 4/8, Rockfall Path 3/8, Targon's Peak 2/8; core (>=75%) Stupefy 8/8 x3.0, Rebuttal 8/8 x3.0, Applied Researchers 8/8 x2.9, Dredge Up 7/8 x3.0, Shock Blast 7/8 x2.6, Ravenbloom Student 6/8 x3.0, Vex, Apathetic 6/8 x1.8, Singularity 6/8 x1.5, Thousand-Tailed Watcher 6/8 x1.5, Smoke Screen 6/8 x1.2, Switcheroo 6/8 x1.2, Mel, Defiant Soul 6/8 x1.0; flex (25-74%) Traveling Merchant 5/8, Up from the Deep 5/8, Time Warp 5/8, Gust 5/8, Star-Crossed 5/8, Bellows Breath 5/8, Lecturing Yordle 3/8, Kai'Sa, Rebel 3/8; side deck Decree of Insight 6/8, An Offer You Can't Refuse 6/8, Star-Crossed 5/8, Unchecked Power 5/8, Mel, Newly Awakened 5/8; shape labels from the deck-theory clustering (1 labelled): big-control 1
  - Builds by Chosen Champion (DATA): Mel, Defiant Soul 5/8 sets itself apart with Vex, Apathetic; Mel, Newly Awakened 3/8 sets itself apart with Kai'Sa, Rebel, Ride the Wind, Riptide Mage
- **Pre-Radiance lists (DATA, n=5, 5 with tournament provenance; sources: official-rq 2, pa-fetch 1, r1-top3 2; newest set in list: VEN 5; 4 of them hold a card that is banned today):** champion Mel, Newly Awakened 3/5, Mel, Defiant Soul 2/5; runes 6 Mind / 6 Chaos 2/5, 7 Mind / 5 Chaos 2/5, 7 Chaos / 5 Mind 1/5; battlefields Ravenbloom Conservatory 3/5, Rockfall Path 2/5, Forbidding Waste 2/5, Threshold of the Gray 2/5, Targon's Peak 1/5; core (>=75%) Stupefy 5/5 x3.0, Ravenbloom Student 5/5 x3.0, Rebuttal 5/5 x3.0, Shock Blast 5/5 x2.8, Star-Crossed 5/5 x1.8, Stacked Deck 4/5 x3.0 (BANNED since 2026-09-18), Applied Researchers 4/5 x3.0, Dredge Up 4/5 x2.8; flex (25-74%) Traveling Merchant 3/5, Time Warp 3/5, Fizz, Trickster 3/5, Singularity 3/5, Ride the Wind 3/5, Switcheroo 3/5, Mel, Newly Awakened 3/5, Hwei, Brooding Painter 2/5; side deck Turn to Dust 4/5, Decree of Insight 4/5, Pickpocket 3/5, Ravenbloom Prefect 3/5, Acceptable Losses 3/5; shape labels from the deck-theory clustering (1 labelled): spell-tempo 1
- **Data confidence: thin; advice basis: radiance-lists** (8 complete Radiance-era lists (2 with tournament provenance: event-named, podium or official); 5 complete pre-Radiance lists)

### VEN-153 Matriarch of War (Ambessa), Body/Order

- **Text (FACT, cards.json@2026-09-06):** "When you empower something else, empower me. (I become Empowered if I'm not already.) // Disempower me, [Any], [Exhaust]: Ready a unit."
- Printing codes: VEN-153, VEN-196, VEN-196*, VEN-196s
- Parsed ability 1 (HEURISTIC parse): triggered; condition "When you empower something else"; effect "empower me."
- Parsed ability 2 (HEURISTIC parse): activated; cost Disempower me + [Any] + [Exhaust]; effect "Ready a unit."
- **Rewards (HEURISTIC, from the quoted text):** Empower ["When you empower something else"]
- **Needs (HEURISTIC, from the quoted text):** Empower ["Disempower me"]
- **Enables (HEURISTIC, from the quoted text):** Empower ["empower me."]; Readying units ["Ready a unit."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - VEN-084 Ambessa, The Wolf (4 Energy, 4 Might): "[Empower] [3][Body] ([3][Body]: Empower me. Use only if not Empowered.) // [Empowered][>] I have +3 [Might] and can't be dealt damage unless I'm in combat."
  - VEN-136 Ambessa, Respected and Feared (5 Energy, 5 Might): "[Empower] [1][Order][Order] ([1][Order][Order]: Empower me. Use only if not Empowered.) // [Empowered][>] I have [Assault 2]. (+2 [Might] while I'm an attacker.) // [Empowered][>] When I attack, kill an enemy unit here with less Might than me."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** VEN-154 Public Execution (spell, 2 Energy, 1 Power): "Choose a friendly unit. Kill an enemy unit with less Might than it. // [Flow] [5][Any][Any] (You may play this from your trash for its Flow cost. Then banish it.)"
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** empower 1.00 [enables/needs/rewards] pool 21; ready 0.60 [enables] pool 33; death 0.32 [champion or signature text only] pool 28
- **Battlefields by text (HEURISTIC):** VEN-163 Risen Altar (1.0; Empower); SFD-210 Hall of Legends (0.6; Readies the legend)
- **Popularity and results (DATA):** 8 published lists since 2026-10-23 (rank 56 of 58, 0.5%)
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 3 of the 11 official field tables (first 2026-08-26, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 97 Day 1 pilots = 1.6% of the field, 4 in Day 2 = 0.4% of Day 2; Day 2 conversion 4% against 18% for the whole field
- **Radiance-era lists (DATA, n=7, 0 with tournament provenance; sources: pa-fetch 7):** champion Ambessa, The Wolf 5/6, Ambessa, Respected and Feared 1/6; runes 7 Body / 5 Order 3/7, 8 Body / 4 Order 2/7, 6 Body / 6 Order 2/7; battlefields Risen Altar 7/7, Sunken Temple 4/7, Sandswept Tomb 4/7, Mystic Vortex 2/7, Windswept Hillock 1/7; core (>=75%) Legion Marauder 7/7 x2.9, Punch First 7/7 x2.6, Ambessa, The Wolf 7/7 x1.4, Rampage 6/7 x2.5, Public Execution 6/7 x1.5; flex (25-74%) Kayle, Justified 5/7, Guttural Roar 5/7, Kinkou Initiate 4/7, Irresistible Faefolk 4/7, Trifarian Captain 4/7, Hidden Blade 4/7, Portable Portal 4/7, Rengar, Trophy Hunter 4/7; side deck Salvage 4/5, Decree of Strength 3/5, Decree of Unity 3/5, Sabotage 2/5, Ruin Runner 2/5
- **Pre-Radiance lists (DATA, n=5, 5 with tournament provenance; sources: official-rq 1, pa-fetch 4; newest set in list: VEN 5; 0 of them hold a card that is banned today):** champion Ambessa, The Wolf 5/5; runes 7 Body / 5 Order 3/5, 8 Body / 4 Order 2/5; battlefields Risen Altar 5/5, Sunken Temple 3/5, Sandswept Tomb 3/5, Star Spring 2/5, Seat of Power 1/5; core (>=75%) Punch First 5/5 x3.0, Legion Marauder 5/5 x2.8, Rampage 5/5 x2.4, Sabotage 5/5 x2.0, Guttural Roar 5/5 x2.0, Public Execution 5/5 x2.0, Ambessa, The Wolf 5/5 x1.4, Irresistible Faefolk 4/5 x3.0; flex (25-74%) Tactical Retreat 3/5, Kennen, Keeper of Balance 3/5, Hidden Blade 3/5, Onslaught 3/5, Solari Sunhawk 2/5, Challenge 2/5, Lucian, Merciless 2/5, Nidalee, Cat Form 2/5; side deck Salvage 5/5, Ruin Runner 4/5, Decree of Strength 3/5, Repulse 3/5, Divine Judgment 2/5; shape labels from the deck-theory clustering (4 labelled): unit-aggro 4
- **Data confidence: thin; advice basis: radiance-lists** (7 complete Radiance-era lists (0 with tournament provenance: event-named, podium or official); 5 complete pre-Radiance lists)

### VEN-155 Heart of the Tempest (Kennen), Order/Chaos

- **Text (FACT, cards.json@2026-09-06):** "When you play a card from anywhere other than your hand, empower me. // [Action][>] Disempower me, [Exhaust]: Give a unit [Assault 2] this turn. (+2 [Might] while it's an attacker.)"
- Printing codes: VEN-155, VEN-197, VEN-197*, VEN-197s
- Parsed ability 1 (HEURISTIC parse): triggered; condition "When you play a card from anywhere other than your hand"; effect "empower me."
- Parsed ability 2 (HEURISTIC parse): activated; action speed; cost Disempower me + [Exhaust]; effect "Give a unit [Assault 2] this turn."
- **Rewards (HEURISTIC, from the quoted text):** Playing cards from outside the hand ["When you play a card from anywhere other than your hand"]
- **Needs (HEURISTIC, from the quoted text):** Empower ["Disempower me"]
- **Enables (HEURISTIC, from the quoted text):** Empower ["empower me."]; Attacking (Assault) ["Give a unit [Assault 2] this turn."]
- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**
  - VEN-113 Kennen, Storm of Shuriken (3 Energy, 1 Power, 4 Might): "When you play me, [Burn 2]. (Put the top 2 cards of your Main Deck into your trash.) // When I conquer, give a spell in your trash [Flow] equal to its cost this turn. (You may play it from your trash for its Flow cost. Then banish it.)"
  - VEN-135 Kennen, Keeper of Balance (3 Energy, 2 Might): "[Hidden] (Hide now for [Any] to react with later for [0].) // When you play me or I attack, you may pay [2] to [Stun] a unit. (It doesn't deal combat damage this turn.) // While there's a stunned enemy unit here, I have +2 [Might]."
- **Signature cards (FACT, rule 103.3.d; max 3 in total):** VEN-156 Lightning Rush (spell, 1 Energy): "Look at the top 3 cards of your Main Deck. You may choose a card from among them and draw it. Put the rest into your trash. // [Flow] [2][Any] (You may play this from your trash for its Flow cost. Then banish it.)"
- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** play-from-elsewhere 1.00 [rewards] pool 43; empower 0.80 [enables/needs] pool 13; assault 0.60 [enables] pool 10; trash 0.32 [champion or signature text only] pool 25
- **Battlefields by text (HEURISTIC):** VEN-163 Risen Altar (0.8; Empower); SFD-210 Hall of Legends (0.6; Readies the legend)
- **Popularity and results (DATA):** 41 published lists since 2026-10-23 (rank 7 of 58, 2.8%); riftbound.gg week-2 tier 1, 0 wins, 10 top cuts; EU Regional Championship 50% over 237 matches
- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** in 3 of the 11 official field tables (first 2026-08-26, last 2026-09-30); last 3 events (Barcelona, Singapore, Los Angeles): 653 Day 1 pilots = 10.9% of the field, 202 in Day 2 = 19.2% of Day 2; Day 2 conversion 31% against 18% for the whole field
- **Podiums (DATA, riftbound.one top-3 lists, n=534 lists, events 2026-04 to 2026-10):** 6 first, 13 second, 9 third; with a Radiance card in the list: 1 / 0 / 1
- **Radiance-era lists (DATA, n=14, 14 with tournament provenance; sources: pa-fetch 12, r1-top3 2):** champion Kennen, Storm of Shuriken 13/14, Kennen, Keeper of Balance 1/14; runes 9 Chaos / 3 Order 9/14, 8 Chaos / 4 Order 2/14, 10 Chaos / 2 Order 1/14; battlefields Zaun Warrens 14/14, Minefield 13/14, Ruined Monastery 7/14, Veiled Temple 3/14, The Candlelit Sanctum 1/14; core (>=75%) Nocturne, Horrifying 14/14 x3.0, Trifarian Captain 14/14 x3.0, Lightning Rush 14/14 x3.0, Switcheroo 14/14 x1.8, Rhasa the Sunderer 13/14 x3.0, Seal of Discord 13/14 x3.0, Traveling Merchant 13/14 x2.9, Ride the Wind 13/14 x2.1, Last Rites 13/14 x1.9, Fizz, Trickster 13/14 x1.5, Star-Crossed 13/14 x1.4, Kennen, Storm of Shuriken 13/14 x1.0; flex (25-74%) Reckless Innovator 10/14, Flash 9/14, Edge of Night 8/14, Tail-Cloaked Matriarch 7/14, Hard Bargain 7/14, Rebuke 5/14, Tornado Warrior 4/14, Ezreal, Prodigy 4/14; side deck Decree of Unity 13/14, Ravenbloom Prefect 12/14, An Offer You Can't Refuse 12/14, Star-Crossed 9/14, Abandon 8/14; shape labels from the deck-theory clustering (11 labelled): gear-engine 10, unit-aggro 1
- **Pre-Radiance lists (DATA, n=31, 31 with tournament provenance; sources: official-rq 4, pa-fetch 2, r1-top3 25; newest set in list: VEN 31; 28 of them hold a card that is banned today):** champion Kennen, Storm of Shuriken 29/31, Kennen, Keeper of Balance 2/31; runes 9 Chaos / 3 Order 20/31, 8 Chaos / 4 Order 9/31, 10 Chaos / 2 Order 1/31; battlefields Minefield 31/31, Zaun Warrens 29/31, Veiled Temple 9/31, The Candlelit Sanctum 7/31, Forbidding Waste 6/31; core (>=75%) Lightning Rush 31/31 x3.0, Rhasa the Sunderer 31/31 x3.0, Ride the Wind 31/31 x2.7, Seal of Discord 30/31 x3.0, Kennen, Storm of Shuriken 30/31 x1.0, Traveling Merchant 29/31 x2.9, Fizz, Trickster 29/31 x2.0, Stacked Deck 28/31 x3.0 (BANNED since 2026-09-18); flex (25-74%) Gust 20/31, Treasure Hunter 18/31, Tideturner 18/31, Up from the Deep 17/31, Shadow Order Disciple 14/31, Salvage 12/31, Rebuke 11/31, Flash 11/31; side deck Salvage 29/31, Abandon 23/31, Decree of Unity 21/31, Ravenbloom Prefect 14/31, Rebuke 12/31; shape labels from the deck-theory clustering (2 labelled): gear-engine 2
- **Data confidence: ok; advice basis: radiance-lists** (14 complete Radiance-era lists (14 with tournament provenance: event-named, podium or official); 31 complete pre-Radiance lists)

## 10. Files and how to re-run

All under `docs/research/analysis/legend-profiles/`:

| File | Role |
|---|---|
| `cardpool.py` | Loads `cards.json`, overlays a gallery snapshot (new sets, changed text, alias printing codes) |
| `build_legend_profiles.py` | Text half: `data/legend-profiles.text.json` |
| `fetch_pa_decks.py` | Network: per-legend sample of Piltover Archive deck pages into `data/pa-decks.jsonl` (resumable, round-robin) |
| `build_legend_meta.py` | Data half: `data/legend-profiles.meta.json` |
| `report.py`, `assemble_doc.py`, `doc_template.md` | Render this document |
| `run_all.sh` | Rebuild both halves, the fragments and this document without network |
| `data/bans-known.json` | Ban flags used here (source: `Untitled/config/current-constructed-rules.json` plus the 2026-09-18 announcement) |
| `data/results-riftboundgg-2026-11.json` | Hand-transcribed results |
| `raw/official-rq-top-decks-2026-11-11.json` | Copy of `analysis/meta-sources/raw/official-events.json` (official field tables and printed lists, input) |
| `raw/riftbound-one-decklists-parsed-2026-11-11.json`, `raw/riftbound-one-decklists-qty-2026-11-11.json` | Copies of `analysis/meta-sources/raw/r1-parsed.json` and `r1-decks.json` (riftbound.one top-3 lists, input) |
| `../raw/pa-decks.jsonl`, `../out/results.json` | Shared inputs read in place: event-named Piltover Archive lists; deck-theory shape labels |
| `raw/gallery-2026-11-11.json` | Official gallery items as fetched (input) |
| `raw/riftcodex-p*.json` | Riftcodex pages as fetched (only used to show it is stale) |

```
cd docs/research/analysis/legend-profiles
python3 fetch_pa_decks.py --list ../raw/pa-list.jsonl --per-legend 10 --out data/pa-decks.jsonl   # optional, network, resumable
sh run_all.sh    # text half, data half, fragments, ../../legend-profiles.md
```

## 11. Open items

- UNCONFIRMED: domains of the RAD cards whose gallery record has no domain list. Until fixed they are outside every pool.
- UNCONFIRMED: the parse of the 9 RAD legends has no engine script to check against. They were read by eye once (section 2.1 table against section 9).
- UNCONFIRMED: placements written in Piltover Archive list names ("1st", "Top 8", "Best of") are self-reported by uploaders; how riftbound.one collects its podium lists is not documented on the page we saved.
- UNCONFIRMED: no official field table or official list exists yet for any Radiance-era event, so every Radiance-era number here comes from community sites.
- UNCONFIRMED: which Master Yi legend the riftbound.gg "Master Yi" lines refer to. The official tables do split them from Sydney (2026-05-21) on; before that only OGS-019 existed.
- UNCONFIRMED: why OGN-251 Jinx, OGN-253 Darius and OGN-259 Yasuo have no row in the last three official tables (zero pilots or omitted).
- UNCONFIRMED: whether the `pa-list` default order biases the popularity counts (only the first 144 of about 417 pages were crawled).
- Not done: the Houston 2025 official article; matchup data; side deck advice beyond inclusion counts (other research tasks).
- Not done: a per-ban-window split of the older sample. Older lists are flagged, not separated.
- Not done: a port of the generator to the app's language. The Python scripts are the reference behaviour; the regular expressions and constants are the specification.
