# Legend profiles: one synced record per Legend (research, 2026-11-11)

Purpose: give the Riftbound Forge builder a per-Legend record it can key on, so that every piece of advice names the cards of the deck in front of it and carries a visible reason. The record has two halves that are synced separately:

- a **text-derived half**, computed from card text only (rewards, needs, enables, Chosen Champion options, signature cards, weighted theme axes, battlefields that interact with the text);
- a **data-derived half**, counted from published decklists and event reports (popularity, results, typical Chosen Champion, rune split, battlefields, core and flex cards, and an explicit confidence flag).

Labels used below: **FACT** = primary source (official card text, official rules, official announcement). **DATA** = measured by us, with dataset and n. **HEURISTIC** = our judgement or a fixed formula of ours. **UNCONFIRMED** = could not be checked against a primary source.

This document is generated: section 9 (the per-legend appendix) and every table come from the scripts in `docs/research/analysis/legend-profiles/`. Re-run instructions are in section 10.

## 1. Result in short

- **58 Legends exist today, not 49.** FACT: the local `cards.json` (built 2026-09-06) has 49. The official card gallery on 2026-11-11 adds the set **Radiance (RAD, released 2026-10-23)** with **9 new Legends** (section 2.1).
- **Every one of the 58 has a text profile.** The generator parsed all 58 ability texts into kind / cost / condition / effect and found at least one theme axis for each. Against the GameLab engine's hand-scripted legends the ability kinds agree for 44 of 49 (section 4.5).
- **Data coverage is uneven and must be shown as such.** DATA: 195 complete lists fetched on 2026-11-11 (lists per legend: 1 (x1 legends), 2 (x3 legends), 3 (x41 legends), 4 (x6 legends), 5 (x1 legends), 6 (x6 legends)). With our thresholds: 1 `ok`, 56 `thin`, 1 `insufficient`; the fetch was cut at 200 pages for time, so `thin` here mostly means "we fetched 3", not "only 3 exist". Independently of how much we fetched, **31 legends are `scarce`**: the published-list index itself has fewer than 10 Radiance-era lists or fewer than 3 event-named ones for them (section 6).
- **Published-list popularity and tournament share are different things.** DATA: the most-built legends on Piltover Archive since Radiance are Evelynn 100, Mordekaiser 77, Riven 76, Orianna 70, Ekko 59, Kai'Sa 49, Kennen 41, Ziggs 40 (lists). The Europe Regional Championship field was 43.3% Riven (riftbound.gg report). The app must never present list counts as "meta share".
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
- **Extra legends.** CR 107.4.d.1: legends added to the Legend Zone by effects are not Champion Legends. RAD-167 Neeko, Blending In lets a deck register up to 3 additional legends (`rules.md` section 8.3). A profile is therefore also relevant when its legend is someone else's extra legend. DATA: in the fetched lists these legends were registered as extra legends: OGN-267 Miss Fortune x3, OGN-269 Sett x3, OGN-257 Lee Sin x2, OGS-017 Annie x2, SFD-185 Draven x2, UNL-193 Vex x2, OGN-261 Leona x1, OGN-265 Viktor x1, RAD-149 Riven x1, SFD-195 Irelia x1, SFD-201 Renata Glasc x1, UNL-181 Jhin x1, UNL-183 Rengar x1, UNL-185 Pyke x1, UNL-199 LeBlanc x1, VEN-147 Shen x1.

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
- DATA (does the text half agree with what people register?): 29 of 55 legends with fetched lists and a text-fit list have at least one of their top-5 text-fit battlefields registered in a fetched list; 96 of 546 registered battlefield slots (18%) are battlefields the text fit lists at all. 56 of 79 rewarded or needed axes have at least one of their pool cards among that legend's core cards (75%+ of fetched lists). Reading: the axis pools do capture cards people actually build around, but **text fit explains only a minority of battlefield choices**. Most registered battlefields are generic picks. Across all fetched lists the most registered battlefields are: SFD-216 Rockfall Path 37/195, UNL-210 Forbidding Waste 30/195, OGN-298 Zaun Warrens 28/195, OGN-296 Void Gate 27/195, OGN-287 Sigil of the Storm 27/195, SFD-217 Seat of Power 27/195, UNL-215 Star Spring 23/195, OGN-280 Grove of the God-Willow 21/195, OGN-295 Vilemaw's Lair 20/195, OGN-282 Monastery of Hirana 19/195. HEURISTIC for the app: rank battlefields by registered frequency first (with n), and use the text fit as the explanation layer and as the tie-breaker, not the other way round.
- HEURISTIC limits that the builder must know about:
  1. Axes overlap (`defend` contains `shield` and `tank`; `movement` contains `ganking`; `gold` is inside `gear-token`). A battlefield matching two overlapping axes is scored twice. Example: RAD-147 Pride of Nazumah with UNL-208 Black Flame Altar scores 2.0.
  2. `unit` enablers are "units costing 2 Energy or less"; `low-hand` and `legion` enablers are "cards costing 1 or less"; `mighty` sources are units with 5+ printed Might or a text mention. These cut-offs are ours.
  3. VEN-163 Risen Altar reduces Empower costs "of your units here". It is listed for legends whose own text says Empower, although the legend's Empower cost is not a unit's. The fit is real only through Empower units in the deck.
  4. Legends whose text has no deck-building condition get few axes: OGS-017 Dark Child (ready 2 runes), OGN-251 Loose Cannon, SFD-185 Glorious Executioner. Their direction comes from champion text and from data.
  5. Reminder text is ignored except for tribe names. If a future legend hides a real condition in reminder text, the parser will miss it.
  6. Conquer and hold are triggers on about half of all battlefields, so legends that reward both (UNL-195 Green Father, UNL-199 Deceiver) get about 30 listed battlefields; only the ranking is useful there.

## 5. The data-derived half

Scripts: `fetch_pa_decks.py` (network, polite, resumable), `build_legend_meta.py` (no network). Output: `data/legend-profiles.meta.json`.

### 5.1 Datasets (DATA)

| Id | What | n | Caveat |
|---|---|---|---|
| `pa-sample-2026-09-06` | `GameLab/data/decks/samples/piltover-archive-2026-09-06.json`: 59 lists saved from https://piltoverarchive.com/decks on 2026-09-06 | 51 lists with a legend, covering 32 legends | Unleashed-era Regional Qualifier "best of" lists; before Radiance and before the 2026-09-18 bans |
| `pa-list-2026-11-11` | Deck index rows (id, name, legend code, views, dates) from https://piltoverarchive.com/decks?page=N, pages 1 to 144 of about 417, crawled 2026-11-11 by the shared `analysis/crawl-list.mjs` | 3456 rows, 1442 created on or after 2026-10-23 | Site default order; published lists, not registrations |
| `pa-fetch-2026-11-11` | Deck pages https://piltoverarchive.com/decks/view/<id> fetched 2026-11-11 | 201 parsed, 195 complete (40+ main, 12 runes), 135 with an event marker in the name | Up to 6 per legend, event-named Radiance-era lists first; placements are whatever the uploader wrote in the name |
| `results` | riftbound.gg "Meta Tier List, Radiance, Week 2" (updated 2026-11-06; 13 tournaments, 2026-10-30 to 2026-11-04) and "Europe Regional Championship" report (updated 2026-11-08) | 21 legends in the tier list; 19 with a win rate over more than 10 matches | Hand-transcribed into `data/results-riftboundgg-2026-11.json` from the copies in `analysis/matchups-and-lines/raw/`. Reported per champion name, so the two Master Yi legends cannot be separated |

Source policy notes (FACT, robots.txt files fetched 2026-11-11):

- piltoverarchive.com allows `/` and plain `/decks?page=`; it disallows `/api/` and filtered `/decks?` queries. Only deck view pages and plain pagination were requested, serially, 3 s apart, generic User-Agent, no cookies.
- riftdecks.com disallows AI crawlers by name (including `ClaudeBot` and `anthropic-ai`) and states that scraping for a competing service is not allowed. **Not fetched, not used.** It has per-legend metagame pages; if the owner wants them, that is a manual decision.
- riftbound.gg disallows the user agents `anthropic-ai` and `Claude-Web` while allowing `*`. This research did not fetch it; it read the two article copies another research task had already saved. HEURISTIC: treat riftbound.gg numbers as hand-entered input, not as a sync source.
- No source gives per-legend win rates for all 58 legends. UNCONFIRMED: whether Piltover Archive's tournaments page exposes structured results (the HTML is rendered client-side; nothing usable was in the page payload).

### 5.2 What is counted per legend

- `popularity`: lists in the index, lists since 2026-10-23, share and rank among the 58, event-named lists since 2026-10-23, summed views.
- `results`: tier, wins and top cuts (week-2 report); win rate and matches (Europe Regional Championship).
- per dataset: Chosen Champion distribution, rune split distribution, battlefield inclusion, `coreCards` (in at least 75% of lists), `flexCards` (25% to 74%), top 25 cards with inclusion rate and average copies, side deck cards, average main-deck type counts, and `variants`: lists grouped by Chosen Champion with the cards that are at least 50 points more common in that group than outside it.
- `dataConfidence` (HEURISTIC thresholds): `ok` = at least 5 complete fetched lists of which at least 3 are event-named; `thin` = 2 to 4 (or 5+ without enough event-named ones); `insufficient` = fewer than 2.
- `dataAvailability` (HEURISTIC thresholds): `enough` if the index shows at least 10 lists and at least 3 event-named lists since 2026-10-23, else `scarce`. This separates "we fetched too little" from "there is too little".
- Deck entries are matched to the pool by printing code, then by name. Unresolved entries in this run: UNL-R02a x1, UNL-R04a x1, UNL-R05a x1.

Archetypes are deliberately not clustered beyond the Chosen Champion split. With at most 6 lists per legend any clustering would be noise (HEURISTIC). The sync should raise the per-legend budget before adding clustering.

## 6. Which legends have too little data

- **By what we fetched** (DATA, thresholds above): `ok` 1 (OGN-247 Kai'Sa); `thin` 56; `insufficient` 1 (VEN-153 Ambessa). The fetch was stopped for time; it was ordered round-robin so every legend got its first list before any got a second. A full run (6 per legend, 348 pages) takes about an hour at the polite rate.
- **By what exists** (DATA, `pa-list-2026-11-11`): 31 legends are `scarce`: OGS-021 Lux (4 lists, 0 event-named), OGS-023 Garen (5 lists, 0 event-named), OGN-253 Darius (8 lists, 2 event-named), SFD-197 Azir (8 lists, 2 event-named), SFD-201 Renata Glasc (8 lists, 0 event-named), SFD-203 Sivir (8 lists, 0 event-named), VEN-153 Ambessa (8 lists, 1 event-named), OGS-017 Annie (9 lists, 0 event-named), UNL-187 Vi (9 lists, 2 event-named), VEN-147 Shen (10 lists, 2 event-named), OGN-251 Jinx (11 lists, 0 event-named), UNL-191 Master Yi (11 lists, 2 event-named), OGN-257 Lee Sin (12 lists, 2 event-named), OGN-259 Yasuo (12 lists, 1 event-named), SFD-183 Lucian (12 lists, 2 event-named), UNL-203 Poppy (12 lists, 2 event-named), SFD-199 Ezreal (13 lists, 0 event-named), UNL-181 Jhin (13 lists, 2 event-named), SFD-181 Rumble (14 lists, 0 event-named), VEN-141 Renekton (14 lists, 1 event-named), SFD-193 Jax (15 lists, 1 event-named), VEN-151 Mel (15 lists, 2 event-named), OGN-267 Miss Fortune (16 lists, 1 event-named), OGN-261 Leona (18 lists, 1 event-named), SFD-185 Draven (18 lists, 0 event-named), UNL-195 Ivern (18 lists, 2 event-named), SFD-205 Fiora (20 lists, 0 event-named), OGN-263 Teemo (24 lists, 2 event-named), UNL-185 Pyke (24 lists, 2 event-named), OGN-255 Ahri (27 lists, 1 event-named), OGN-249 Volibear (28 lists, 1 event-named).
- **No result line in either report** (28 legends): OGN-249 Volibear, OGN-251 Jinx, OGN-253 Darius, OGN-255 Ahri, OGN-259 Yasuo, OGN-261 Leona, OGS-017 Annie, OGS-023 Garen, RAD-139 Ekko, RAD-141 Ziggs, RAD-147 K'Sante, RAD-153 Evelynn, RAD-155 Jarvan IV, SFD-181 Rumble, SFD-185 Draven, SFD-193 Jax, SFD-201 Renata Glasc, SFD-203 Sivir, SFD-205 Fiora, UNL-181 Jhin, UNL-185 Pyke, UNL-187 Vi, UNL-195 Ivern, VEN-141 Renekton, VEN-143 Zed, VEN-147 Shen, VEN-151 Mel, VEN-153 Ambessa.
- **Scarce lists and no results at all** (26 legends): OGN-249 Volibear, OGN-251 Jinx, OGN-253 Darius, OGN-255 Ahri, OGN-257 Lee Sin, OGN-259 Yasuo, OGN-261 Leona, OGN-263 Teemo, OGS-017 Annie, OGS-021 Lux, OGS-023 Garen, SFD-181 Rumble, SFD-185 Draven, SFD-193 Jax, SFD-201 Renata Glasc, SFD-203 Sivir, SFD-205 Fiora, UNL-181 Jhin, UNL-185 Pyke, UNL-187 Vi, UNL-195 Ivern, UNL-203 Poppy, VEN-141 Renekton, VEN-147 Shen, VEN-151 Mel, VEN-153 Ambessa. For these the app should say "not enough tournament data for this legend; the advice below comes from card text only" and show the text half.

HEURISTIC for the app: show data-driven statements only when `dataConfidence` is `ok`; show them with "from n lists" when `thin`; hide them when `insufficient`. Always print n next to any rate.

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

Columns: lists since Radiance in `pa-list-2026-11-11`; riftbound.gg week-2 tier, wins, top cuts; Europe Regional Championship win rate and matches; complete fetched lists and how many are event-named; lists in the September sample.

| Legend | Lists since RAD (rank, share) | Tier / wins / top cuts | EU RC win rate (matches) | Fetched lists (event-named) | Sept sample | Confidence | Typical Chosen Champion | Typical rune split |
|---|---|---|---|---|---|---|---|---|
| OGN-247 Kai'Sa | 49 (#6, 3.4%) | 1 / 0 / 12 | 49% (300) | 6 (6) | 2 | ok | Kai'Sa, Survivor 6/6 | 7 Fury / 5 Mind 5/6 |
| OGN-249 Volibear | 28 (#19, 1.9%) | not listed | not listed | 6 (1) | 1 | thin | Volibear, Furious 6/6 | 7 Body / 5 Fury 3/6 |
| OGN-251 Jinx | 11 (#47, 0.8%) | not listed | not listed | 6 (0) | 1 | thin | Jinx, Rebel 5/6 | 7 Chaos / 5 Fury 3/6 |
| OGN-253 Darius | 8 (#52, 0.5%) | not listed | not listed | 6 (2) | 1 | thin | Darius, Trifarian 6/6 | 6 Fury / 6 Order 5/6 |
| OGN-255 Ahri | 27 (#20, 1.9%) | not listed | not listed | 6 (1) | 2 | thin | Ahri, Confident 5/6 | 6 Calm / 6 Mind 4/6 |
| OGN-257 Lee Sin | 12 (#43, 0.8%) | not listed | <=10 matches | 6 (2) | 0 | thin | Lee Sin, Centered 5/6 | 7 Body / 5 Calm 3/6 |
| OGN-259 Yasuo | 12 (#44, 0.8%) | not listed | not listed | 5 (1) | 0 | thin | Yasuo, Windrider 5/5 | 6 Calm / 6 Chaos 5/5 |
| OGN-261 Leona | 18 (#29, 1.2%) | not listed | not listed | 4 (1) | 0 | thin | Leona, Zealot 4/4 | 6 Calm / 6 Order 3/4 |
| OGN-263 Teemo | 24 (#22, 1.7%) | not listed | <=10 matches | 3 (2) | 1 | thin | Teemo, Strategist 3/3 | 7 Mind / 5 Chaos 3/3 |
| OGN-265 Viktor | 26 (#21, 1.8%) | 3 / 0 / 1 | 32% (25) | 4 (4) | 2 | thin | Viktor, Leader 4/4 | 7 Order / 5 Mind 4/4 |
| OGN-267 Miss Fortune | 16 (#34, 1.1%) | 4 / 0 / 0 | not listed | 4 (1) | 0 | thin | Miss Fortune, Captain 2/4 | 6 Body / 6 Chaos 1/4 |
| OGN-269 Sett | 32 (#14, 2.2%) | 3 / 0 / 4 | 61% (18) | 4 (4) | 2 | thin | Sett, Kingpin 3/4 | 7 Body / 5 Order 4/4 |
| OGS-017 Annie | 9 (#50, 0.6%) | not listed | not listed | 4 (0) | 2 | thin | Annie, Fiery 3/4 | 8 Fury / 4 Chaos 2/4 |
| OGS-019 Master Yi | 19 (#28, 1.3%) | 2 / 2 / 5 (shared with UNL-191) | 46% (106) (shared with UNL-191) | 4 (4) | 2 | thin | Master Yi, Tempered 4/4 | 7 Body / 5 Calm 3/4 |
| OGS-021 Lux | 4 (#58, 0.3%) | not listed | <=10 matches | 3 (0) | 1 | thin | Lux, Crownguard 3/3 | 6 Mind / 6 Order 3/3 |
| OGS-023 Garen | 5 (#57, 0.4%) | not listed | not listed | 3 (0) | 0 | thin | Garen, Rugged 2/3 | 6 Body / 6 Order 1/3 |
| RAD-139 Ekko | 59 (#5, 4.1%) | not listed | not listed | 3 (3) | 0 | thin | Ekko, Ingenious 3/3 | 6 Fury / 6 Mind 2/3 |
| RAD-141 Ziggs | 40 (#8, 2.8%) | not listed | not listed | 3 (3) | 0 | thin | Ziggs, Explosive 3/3 | 8 Fury / 4 Chaos 3/3 |
| RAD-143 Mordekaiser | 77 (#2, 5.3%) | not listed | <=10 matches | 3 (3) | 0 | thin | Mordekaiser, Dominating 3/3 | 6 Fury / 6 Order 2/3 |
| RAD-145 Orianna | 70 (#4, 4.9%) | 4 / 0 / 2 | 50% (24) | 3 (3) | 0 | thin | Orianna, Exquisite 2/3 | 8 Mind / 4 Calm 1/3 |
| RAD-147 K'Sante | 36 (#11, 2.5%) | not listed | not listed | 3 (3) | 0 | thin | K'Sante, Dauntless 2/3 | 6 Calm / 6 Body 2/3 |
| RAD-149 Riven | 76 (#3, 5.3%) | S / 5 / 16 | 54% (524) | 3 (3) | 0 | thin | Riven, Broken Blade 3/3 | 7 Chaos / 5 Calm 3/3 |
| RAD-151 Seraphine | 40 (#9, 2.8%) | 4 / 0 / 0 | not listed | 3 (3) | 0 | thin | Seraphine, Inspiring 3/3 | 7 Order / 5 Mind 3/3 |
| RAD-153 Evelynn | 100 (#1, 6.9%) | not listed | not listed | 3 (3) | 0 | thin | Evelynn, Entrancing 3/3 | 8 Chaos / 4 Body 2/3 |
| RAD-155 Jarvan IV | 36 (#12, 2.5%) | not listed | not listed | 3 (3) | 0 | thin | Jarvan IV, Martial Paragon 2/3 | 6 Body / 6 Order 2/3 |
| SFD-181 Rumble | 14 (#38, 1.0%) | not listed | not listed | 3 (1) | 0 | thin | Rumble, Hotheaded 3/3 | 7 Fury / 5 Mind 2/3 |
| SFD-183 Lucian | 12 (#45, 0.8%) | not listed | 38% (16) | 2 (2) | 0 | thin | Lucian, Merciless 2/2 | 6 Fury / 6 Body 1/2 |
| SFD-185 Draven | 18 (#30, 1.2%) | not listed | not listed | 3 (3) | 2 | thin | Draven, Showboat 3/3 | 6 Fury / 6 Chaos 3/3 |
| SFD-187 Rek'Sai | 37 (#10, 2.6%) | 3 / 0 / 4 | 53% (85) | 3 (3) | 2 | thin | Rek'Sai, Breacher 3/3 | 8 Fury / 4 Order 2/3 |
| SFD-189 Ornn | 15 (#35, 1.0%) | not listed | 50% (12) | 3 (3) | 2 | thin | Ornn, Blacksmith 3/3 | 9 Calm / 3 Mind 2/3 |
| SFD-193 Jax | 15 (#36, 1.0%) | not listed | not listed | 3 (2) | 1 | thin | Jax, Unmatched 3/3 | 6 Calm / 6 Body 3/3 |
| SFD-195 Irelia | 20 (#26, 1.4%) | 2 / 1 / 2 | 38% (45) | 3 (3) | 2 | thin | Irelia, Fervent 2/3 | 6 Calm / 6 Chaos 3/3 |
| SFD-197 Azir | 8 (#53, 0.5%) | 4 / 0 / 2 | 50% (16) | 3 (3) | 1 | thin | Azir, Sovereign 3/3 | 7 Calm / 5 Order 3/3 |
| SFD-199 Ezreal | 13 (#41, 0.9%) | 3 / 0 / 0 | <=10 matches | 3 (1) | 2 | thin | Ezreal, Prodigy 3/3 | 6 Mind / 6 Chaos 2/3 |
| SFD-201 Renata Glasc | 8 (#54, 0.5%) | not listed | not listed | 3 (0) | 0 | thin | Renata Glasc, Mastermind 2/3 | 7 Order / 5 Mind 1/3 |
| SFD-203 Sivir | 8 (#55, 0.5%) | not listed | not listed | 3 (1) | 1 | thin | Sivir, Mercenary 3/3 | 6 Body / 6 Chaos 2/3 |
| SFD-205 Fiora | 20 (#27, 1.4%) | not listed | not listed | 3 (1) | 1 | thin | Fiora, Victorious 3/3 | 8 Body / 4 Order 1/3 |
| UNL-181 Jhin | 13 (#42, 0.9%) | not listed | not listed | 3 (3) | 2 | thin | Jhin, Meticulous Killer 3/3 | 7 Mind / 5 Fury 3/3 |
| UNL-183 Rengar | 14 (#39, 1.0%) | 2 / 0 / 3 | 45% (29) | 3 (3) | 2 | thin | Rengar, Trophy Hunter 3/3 | 8 Body / 4 Fury 3/3 |
| UNL-185 Pyke | 24 (#23, 1.7%) | not listed | not listed | 3 (3) | 2 | thin | Pyke, Returned 2/3 | 7 Chaos / 5 Fury 1/3 |
| UNL-187 Vi | 9 (#51, 0.6%) | not listed | not listed | 3 (3) | 1 | thin | Vi, Peacekeeper 2/3 | 7 Fury / 5 Order 2/3 |
| UNL-189 Lillia | 18 (#31, 1.2%) | 4 / 0 / 1 | <=10 matches | 2 (2) | 1 | thin | Lillia, Fae Fawn 2/2 | 7 Calm / 5 Mind 1/2 |
| UNL-191 Master Yi | 11 (#48, 0.8%) | 2 / 2 / 5 (shared with OGS-019) | 46% (106) (shared with OGS-019) | 2 (2) | 1 | thin | Master Yi, Tempered 2/2 | 6 Calm / 6 Body 1/2 |
| UNL-193 Vex | 29 (#17, 2.0%) | 2 / 1 / 6 | 36% (11) | 3 (3) | 3 | thin | Vex, Apathetic 3/3 | 7 Chaos / 5 Calm 2/3 |
| UNL-195 Ivern | 18 (#32, 1.2%) | not listed | not listed | 3 (3) | 2 | thin | Ivern, Nurturer 3/3 | 6 Calm / 6 Order 2/3 |
| UNL-197 Diana | 22 (#24, 1.5%) | not listed | <=10 matches | 3 (3) | 2 | thin | Diana, Lunari 3/3 | 6 Mind / 6 Chaos 2/3 |
| UNL-199 LeBlanc | 17 (#33, 1.2%) | 3 / 0 / 1 | 36% (28) | 3 (3) | 1 | thin | LeBlanc, Fragmented 3/3 | 8 Order / 4 Mind 3/3 |
| UNL-201 Kha'Zix | 31 (#15, 2.1%) | 3 / 0 / 0 | 55% (11) | 3 (3) | 2 | thin | Kha'Zix, Mutating Horror 3/3 | 6 Body / 6 Chaos 3/3 |
| UNL-203 Poppy | 12 (#46, 0.8%) | not listed | <=10 matches | 3 (3) | 1 | thin | Poppy, Paragon 3/3 | 6 Body / 6 Order 2/3 |
| VEN-139 Akali | 33 (#13, 2.3%) | 2 / 0 / 2 | 44% (16) | 3 (3) | 0 | thin | Akali, Deadly Weapon 3/3 | 7 Fury / 5 Calm 3/3 |
| VEN-141 Renekton | 14 (#40, 1.0%) | not listed | not listed | 3 (1) | 0 | thin | Renekton, Rage Fueled 3/3 | 7 Fury / 5 Body 2/3 |
| VEN-143 Zed | 31 (#16, 2.1%) | not listed | not listed | 3 (3) | 0 | thin | Zed, Without a Sound 2/3 | 7 Fury / 5 Chaos 2/3 |
| VEN-145 Nasus | 21 (#25, 1.5%) | 4 / 0 / 1 | 53% (17) | 3 (3) | 0 | thin | Nasus, Guardian of Knowledge 3/3 | 6 Calm / 6 Mind 2/3 |
| VEN-147 Shen | 10 (#49, 0.7%) | not listed | not listed | 3 (2) | 0 | thin | Shen, Kinkou 3/3 | 6 Calm / 6 Order 1/3 |
| VEN-149 Jayce | 29 (#18, 2.0%) | 2 / 1 / 1 | 68% (47) | 3 (3) | 0 | thin | Jayce, Brilliant Inventor 3/3 | 7 Body / 5 Mind 3/3 |
| VEN-151 Mel | 15 (#37, 1.0%) | not listed | not listed | 3 (3) | 0 | thin | Mel, Defiant Soul 2/3 | 7 Mind / 5 Chaos 1/3 |
| VEN-153 Ambessa | 8 (#56, 0.5%) | not listed | not listed | 1 (1) | 0 | insufficient | Ambessa, The Wolf 1/1 | 8 Body / 4 Order 1/1 |
| VEN-155 Kennen | 41 (#7, 2.8%) | 1 / 0 / 10 | 50% (237) | 3 (3) | 0 | thin | Kennen, Storm of Shuriken 3/3 | 9 Chaos / 3 Order 2/3 |

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
  schemaVersion: 1;
  datasets: Record<string, { source: string; note: string; [k: string]: unknown }>;
  thresholds: Record<string, number>;
  unresolvedDeckEntries: Record<string, number>;
  legends: LegendMeta[];
}
interface LegendMeta {
  legendCode: string; name: string; tags: string[];
  dataConfidence: 'ok' | 'thin' | 'insufficient'; dataConfidenceReasons: string[];
  dataAvailability: 'enough' | 'scarce';
  popularity: { dataset: string; lists: number; listsSinceRadiance: number; eventNamedListsSinceRadiance: number;
                shareSinceRadiance: number | null; rankSinceRadiance: number | null; viewsSum: number };
  results: { tierList?: { tier: string; wins: number; topCuts: number };
             euRegional?: { winRatePct: number | null; matches: number | null; finish?: string; day1FieldSharePct?: number };
             sharedWithLegends: string[] } | null;
  asAdditionalLegend: { dataset: string; decks: number; note: string };
  samples: Record<string, SampleSummary | null>;   // keyed by dataset id
}
interface SampleSummary {
  n: number; nEventMarker: number; nComplete: number;
  chosenChampions: { cardCode: string; name: string; decks: number; share: number }[];
  runeSplits: { split: string; decks: number; share: number }[];
  battlefields: Rate[]; coreCards: Rate[]; flexCards: Rate[]; topCards: Rate[]; sideDeck: Rate[];
  avgMainTypeCounts: Record<string, number>;
  variants: { chosenChampion: string; name: string; decks: number; share: number;
              distinctiveCards: { cardCode: string; name: string; rateHere: number; rateElsewhere: number }[]; deckIds: string[] }[];
  decks: { id: string; name: string; url: string; eventMarker: boolean; createdAt: string | null; complete: boolean }[];
}
interface Rate { cardCode: string; name: string; decks: number; inclusionRate: number; avgCopiesWhenPlayed: number; type?: string }
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
  "dataConfidenceReasons": [
   "4 complete lists in pa-fetch-2026-11-11 (1 with an event marker in the name)",
   "0 lists in pa-sample-2026-09-06"
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
  "results": null,
  "asAdditionalLegend": {
   "dataset": "pa-fetch-2026-11-11",
   "decks": 1,
   "note": "lists that register this legend as one of the extra legends of Neeko, Blending In (RAD-167)"
  },
  "samples": {
   "pa-fetch-2026-11-11": {
    "n": 4,
    "nEventMarker": 1,
    "nComplete": 4,
    "chosenChampions": [
     {
      "cardCode": "OGN-079",
      "name": "Leona, Zealot",
      "decks": 4,
      "share": 1.0
     }
    ],
    "runeSplits": [
     {
      "split": "6 Calm / 6 Order",
      "decks": 3,
      "share": 0.75
     },
     {
      "split": "7 Calm / 5 Order",
      "decks": 1,
      "share": 0.25
     }
    ],
    "battlefields": [
     {
      "cardCode": "OGN-282",
      "name": "Monastery of Hirana",
      "decks": 4,
      "inclusionRate": 1.0,
      "avgCopiesWhenPlayed": 1.0
     },
     "..."
    ],
    "coreCards": [
     {
      "cardCode": "OGN-045",
      "name": "Defy",
      "decks": 4,
      "inclusionRate": 1.0,
      "avgCopiesWhenPlayed": 3.0,
      "type": "spell"
     },
     "..."
    ],
    "flexCards": [
     {
      "cardCode": "UNL-053",
      "name": "Scuttle Crab",
      "decks": 2,
      "inclusionRate": 0.5,
      "avgCopiesWhenPlayed": 3.0,
      "type": "unit"
     },
     "..."
    ],
    "topCards": [
     {
      "cardCode": "OGN-045",
      "name": "Defy",
      "decks": 4,
      "inclusionRate": 1.0,
      "avgCopiesWhenPlayed": 3.0,
      "type": "spell"
     },
     "..."
    ],
    "sideDeck": [
     {
      "cardCode": "SFD-032",
      "name": "Disarming Rake",
      "decks": 3,
      "inclusionRate": 0.75,
      "avgCopiesWhenPlayed": 2.0
     },
     "..."
    ],
    "avgMainTypeCounts": {
     "gear": 1.8,
     "spell": 18.0,
     "unit": 20.2
    },
    "variants": [
     {
      "chosenChampion": "OGN-079",
      "name": "Leona, Zealot",
      "decks": 4,
      "share": 1.0,
      "distinctiveCards": [],
      "deckIds": [
       "f0e744f3-d166-44ca-b724-ec4c1bd69042",
       "dc079e5c-9ed3-4826-ba9d-6533d4004ad6",
       "16fcf2f4-8852-4805-bd4f-8aaba4620efb",
       "1d67b993-61a2-4da8-872d-a48efedbf43f"
      ]
     }
    ],
    "decks": [
     {
      "id": "f0e744f3-d166-44ca-b724-ec4c1bd69042",
      "name": "Leona champion units + raptor",
      "url": "https://piltoverarchive.com/decks/view/f0e744f3-d166-44ca-b724-ec4c1bd69042",
      "eventMarker": true,
      "createdAt": "2026-11-07",
      "complete": true
     },
     "..."
    ]
   },
   "pa-sample-2026-09-06": null
  }
 }
}
```

Changes we recommend before this becomes the app's schema (HEURISTIC):

- Split era out of the dataset id: `samples` should be keyed by `{source, window}` so that a new ban or set opens a new window instead of mixing eras.
- Store `results` per source with its own `scope` and date, and allow several; today's two reports are a week apart and measure different things.
- Add `legality` per legend per format (Wuju Bladesman is banned in 2v2 only) from the legality file rather than from this profile.
- Keep `poolSupport.cardCodes` as codes only (as now); names and text come from the card table.

### 8.1 How the builder should use a profile (HEURISTIC)

- **Reasons are built from the record, not from templates about archetypes.** A sentence is assembled from `evidence.text` (the legend's words), the axis label, and the names of the deck's own cards found in `poolSupport.cardCodes`. Example for a concrete Radiant Dawn deck: "Radiant Dawn pays for stuns ('When you stun one or more enemy units'). This deck stuns with <the deck's cards that are in the stun pool, by name and copies>. <k> of 22 available Calm/Order stun cards are unused: <names>." Two different decks give two different sentences because the card lists differ.
- **Rewards drive counts.** For a `rewards` axis the builder counts the deck's enablers for it and compares with the legal pool; for a `needs` axis a count of zero is an error-level warning (the legend ability is dead); for an `enables` axis it looks for payoffs in the deck.
- **Chosen Champion choice is a comparison of the listed units' own axes** against the deck's axis counts, plus the data half's distribution when `dataConfidence` allows.
- **Battlefields**: offer the text-fit list with both quoted fragments; add the data half's most-registered battlefields with n; drop anything with `bannedFrom` on or before today.
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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=6, 6 event-named):** champion Kai'Sa, Survivor 6/6; runes 7 Fury / 5 Mind 5/6, 6 Fury / 6 Mind 1/6; battlefields Void Gate 6/6, Rockfall Path 6/6, Frozen Fortress 6/6; core (>=75%) Noxus Hopeful 6/6 x3.0, Brynhir Thundersong 6/6 x3.0, Falling Star 6/6 x3.0, Stupefy 6/6 x3.0, Bilgewater Tracker 6/6 x3.0, Temporal Breach 6/6 x3.0, Hextech Ray 6/6 x2.8, Thousand-Tailed Watcher 6/6 x2.8, Lecturing Yordle 6/6 x2.5, Smoke Screen 6/6 x2.0, The Empyrean 6/6 x2.0, Time Warp 6/6 x1.8; flex (25-74%) Brittle Steel 4/6, Plundering Poro 3/6, Watchful Sentry 2/6, Consult the Past 2/6, Orb of Regret 2/6
- **Played lists, pa-sample-2026-09-06 (DATA, n=2, 2 event-named):** champion Kai'Sa, Survivor 2/2; runes 6 Fury / 6 Mind 1/2, 7 Fury / 5 Mind 1/2; battlefields The Arena's Greatest 2/2, Void Gate 2/2, Rockfall Path 1/2, Star Spring 1/2; core (>=75%) Hextech Ray 2/2 x3.0, Falling Star 2/2 x3.0, Stupefy 2/2 x3.0, Watchful Sentry 2/2 x3.0, Thousand-Tailed Watcher 2/2 x3.0, Ferrous Forerunner 2/2 x3.0, Lecturing Yordle 2/2 x2.5, Ravenbloom Student 2/2 x2.5; flex (25-74%) n too small
- **Data confidence: ok** (6 complete lists in pa-fetch-2026-11-11 (6 with an event marker in the name); 2 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=6, 1 event-named):** champion Volibear, Furious 6/6; runes 7 Body / 5 Fury 3/6, 6 Fury / 6 Body 3/6; battlefields Dragon Roost 6/6, Sigil of the Storm 5/6, Vilemaw's Lair 2/6, Forgotten Monument 2/6, Black Market 1/6; core (>=75%) Sky Splitter 6/6 x3.0, Kadregrin the Infernal 6/6 x3.0, Elder Dragon 6/6 x3.0, Gentle Gemdragon 6/6 x2.8, Volibear, Furious 6/6 x1.0, Blazing Scorcher 5/6 x3.0, Bilgewater Tracker 5/6 x3.0, Seraphic Wyvern 5/6 x3.0, Rengar, Trophy Hunter 5/6 x3.0, Dune Drake 5/6 x2.6, Challenge 5/6 x2.0; flex (25-74%) Herald of Scales 4/6, Minotaur Reckoner 4/6, Portable Portal 4/6, Falling Star 4/6, Mobilize 3/6, Kinkou Initiate 3/6, Flurry of Blades 2/6, Dazzling Aurora 2/6
- **Played lists, pa-sample-2026-09-06 (DATA, n=1, 1 event-named):** champion Volibear, Furious 1/1; runes 6 Fury / 6 Body 1/1; battlefields Aspirant's Climb 1/1, Sigil of the Storm 1/1, The Papertree 1/1; core (>=75%) Sky Splitter 1/1 x3.0, Kadregrin the Infernal 1/1 x3.0, Mobilize 1/1 x3.0, Catalyst of Aeons 1/1 x3.0, Sabotage 1/1 x3.0, Dazzling Aurora 1/1 x3.0, Ferrous Forerunner 1/1 x3.0, Gentle Gemdragon 1/1 x3.0; flex (25-74%) n too small
- **Data confidence: thin** (6 complete lists in pa-fetch-2026-11-11 (1 with an event marker in the name); 1 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=6, 0 event-named):** champion Jinx, Rebel 5/6, Jinx, Demolitionist 1/6; runes 7 Chaos / 5 Fury 3/6, 6 Fury / 6 Chaos 2/6, 12 Chaos 1/6; battlefields Zaun Warrens 6/6, Ruined Monastery 5/6, Targon's Peak 2/6, Void Gate 2/6, Minefield 2/6; core (>=75%) Traveling Merchant 6/6 x2.7, Jinx, Rebel 6/6 x1.7, Super Mega Death Rocket! 5/6 x2.0; flex (25-74%) Seal of Discord 4/6, Falling Star 4/6, Detonate 4/6, Ride the Wind 4/6, Gust 4/6, Rhasa the Sunderer 3/6, Treasure Trove 3/6, Punching Poro 3/6
- **Played lists, pa-sample-2026-09-06 (DATA, n=1, 1 event-named):** champion Jinx, Rebel 1/1; runes 7 Fury / 5 Chaos 1/1; battlefields Zaun Warrens 1/1, Minefield 1/1, Rockfall Path 1/1; core (>=75%) Noxus Hopeful 1/1 x3.0, Traveling Merchant 1/1 x3.0, Super Mega Death Rocket! 1/1 x3.0, Punching Poro 1/1 x3.0, Shadow Order Disciple 1/1 x3.0, Cleave 1/1 x2.0, Unlicensed Armory 1/1 x2.0, Falling Star 1/1 x2.0; flex (25-74%) n too small
- **Data confidence: thin** (6 complete lists in pa-fetch-2026-11-11 (0 with an event marker in the name); 1 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=6, 2 event-named):** champion Darius, Trifarian 6/6; runes 6 Fury / 6 Order 5/6, 8 Order / 4 Fury 1/6; battlefields Trifarian War Camp 4/6, Emperor's Dais 3/6, Vilemaw's Lair 2/6, Black Rose Sanctum 2/6, Seat of Power 2/6; core (>=75%) Trifarian Captain 6/6 x2.7, Darius, Trifarian 6/6 x1.2, Noxus Hopeful 5/6 x3.0, Hidden Blade 5/6 x2.6, Imperial Decree 5/6 x2.2; flex (25-74%) Vanguard Captain 4/6, Cleave 4/6, Falling Star 4/6, Baited Hook 3/6, Concert Poster 3/6, Honest Broker 3/6, Trifarian Gloryseeker 3/6, Seal of Unity 3/6
- **Played lists, pa-sample-2026-09-06 (DATA, n=1, 1 event-named):** champion Darius, Trifarian 1/1; runes 8 Order / 4 Fury 1/1; battlefields The Arena's Greatest 1/1, Trifarian War Camp 1/1, Emperor's Dais 1/1; core (>=75%) Noxus Hopeful 1/1 x3.0, Hidden Blade 1/1 x3.0, Vanguard Captain 1/1 x3.0, Spectral Matron 1/1 x3.0, Baited Hook 1/1 x3.0, Honest Broker 1/1 x3.0, Rally the Troops 1/1 x3.0, Xin Zhao, Vigilant 1/1 x3.0; flex (25-74%) n too small
- **Data confidence: thin** (6 complete lists in pa-fetch-2026-11-11 (2 with an event marker in the name); 1 lists in pa-sample-2026-09-06)

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
- **Popularity and results (DATA):** 27 published lists since 2026-10-23 (rank 20 of 58, 1.9%)
- **Played lists, pa-fetch-2026-11-11 (DATA, n=6, 1 event-named):** champion Ahri, Confident 5/6, Ahri, Alluring 1/6; runes 6 Calm / 6 Mind 4/6, 7 Calm / 5 Mind 1/6, 8 Calm / 4 Mind 1/6; battlefields Grove of the God-Willow 3/6, Startipped Peak 3/6, Vilemaw's Lair 2/6, Ravenbloom Conservatory 2/6, Rockfall Path 2/6; core (>=75%) Ravenbloom Student 6/6 x3.0, Defy 6/6 x2.8, Discipline 6/6 x2.8, Stupefy 6/6 x2.8, Stalwart Poro 5/6 x2.0, Ahri, Confident 5/6 x1.4; flex (25-74%) Zhonya's Hourglass 4/6, Back Off 4/6, Charm 4/6, Thousand-Tailed Watcher 4/6, Not So Fast 4/6, Mutated Mouser 3/6, Mournful Witness 3/6, Sona, Harmonious 3/6
- **Played lists, pa-sample-2026-09-06 (DATA, n=2, 2 event-named):** champion Ahri, Inquisitive 2/2; runes 7 Mind / 5 Calm 1/2, 7 Calm / 5 Mind 1/2; battlefields The Arena's Greatest 1/2, The Grand Plaza 1/2, Zaun Warrens 1/2, Abandoned Hall 1/2, Amateur Recital 1/2; core (>=75%) Defy 2/2 x3.0, Discipline 2/2 x3.0, Ravenbloom Student 2/2 x3.0, Charm 2/2 x2.5, Stupefy 2/2 x2.5, Desert's Call 2/2 x2.5, Plundering Poro 2/2 x2.5, Flurry of Feathers 2/2 x2.0; flex (25-74%) n too small
- **Data confidence: thin** (6 complete lists in pa-fetch-2026-11-11 (1 with an event marker in the name); 2 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=6, 2 event-named):** champion Lee Sin, Centered 5/6, Monastery of Hirana 1/6; runes 7 Body / 5 Calm 3/6, 6 Calm / 6 Body 2/6, 8 Body / 4 Calm 1/6; battlefields Monastery of Hirana 4/6, Windswept Hillock 3/6, Sunken Temple 3/6, Forbidding Waste 2/6, Grove of the God-Willow 1/6; core (>=75%) Defy 6/6 x3.0, Discipline 6/6 x3.0, Punch First 6/6 x2.5, Scuttle Crab 6/6 x2.3, Lee Sin, Centered 5/6 x1.0; flex (25-74%) Pit Rookie 4/6, Zhonya's Hourglass 4/6, Charm 4/6, First Mate 3/6, Lonely Poro 3/6, Rampage 3/6, Riven, Broken Blade 3/6, Sett, Brawler 3/6
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (6 complete lists in pa-fetch-2026-11-11 (2 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=5, 1 event-named):** champion Yasuo, Windrider 5/5; runes 6 Calm / 6 Chaos 5/5; battlefields Targon's Peak 4/5, Back-Alley Bar 2/5, Hunters' Circle 2/5, Reckoner's Arena 1/5, Vilemaw's Lair 1/5; core (>=75%) Defy 5/5 x3.0, Discipline 5/5 x3.0, Ride the Wind 5/5 x2.6, Star-Crossed 5/5 x2.0, Yasuo, Windrider 5/5 x1.0, Gust 4/5 x2.5, Akali, Silent 4/5 x1.8, Flash 4/5 x1.5; flex (25-74%) Tideturner 3/5, Scuttle Crab 3/5, En Garde 3/5, Zhonya's Hourglass 3/5, Fizz, Trickster 3/5, Charm 3/5, Mask of Foresight 2/5, Traveling Merchant 2/5
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (5 complete lists in pa-fetch-2026-11-11 (1 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Popularity and results (DATA):** 18 published lists since 2026-10-23 (rank 29 of 58, 1.2%); registered as an extra Neeko legend in 1 fetched lists
- **Played lists, pa-fetch-2026-11-11 (DATA, n=4, 1 event-named):** champion Leona, Zealot 4/4; runes 6 Calm / 6 Order 3/4, 7 Calm / 5 Order 1/4; battlefields Monastery of Hirana 4/4, Sunken Temple 2/4, Grove of the God-Willow 1/4, Windswept Hillock 1/4, Zaun Warrens 1/4; core (>=75%) Defy 4/4 x3.0, Discipline 4/4 x3.0, Back Off 4/4 x2.8, Call to Glory 4/4 x2.5, Leona, Zealot 4/4 x1.0, Vi, Peacekeeper 3/4 x3.0, Ki Burst 3/4 x2.7, Mournful Witness 3/4 x2.7, Zhonya's Hourglass 3/4 x2.3, Riven, Broken Blade 3/4 x2.3, Zenith Blade 3/4 x2.0; flex (25-74%) Scuttle Crab 2/4, Stellacorn Herder 2/4, Nami, Headstrong 2/4, Vex, Mocking 2/4, Kennen, Keeper of Balance 2/4, Charm 2/4, En Garde 2/4, Clockwork Keeper 1/4
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (4 complete lists in pa-fetch-2026-11-11 (1 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 2 event-named):** champion Teemo, Strategist 3/3; runes 7 Mind / 5 Chaos 3/3; battlefields Grove of the God-Willow 3/3, Bandle Scouts' Academy 3/3, Packed Amphitheater 3/3; core (>=75%) Sprite Call 3/3 x3.0, Teemo, Strategist 3/3 x3.0, Nocturne, Horrifying 3/3 x3.0, Teemo, Scout 3/3 x3.0, Switcheroo 3/3 x3.0, Sprite Fountain 3/3 x3.0, Pyke, Returned 3/3 x3.0, The Good Stuff 3/3 x2.7, Sneaky Deckhand 3/3 x2.0, Bedeviling Stranger 3/3 x2.0, Kha'Zix, Mutating Horror 3/3 x2.0, Vex, Apathetic 3/3 x2.0; flex (25-74%) Singularity 2/3, An Offer You Can't Refuse 2/3, Guerilla Warfare 1/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=1, 1 event-named):** champion Teemo, Strategist 1/1; runes 7 Mind / 5 Chaos 1/1; battlefields Grove of the God-Willow 1/1, Startipped Peak 1/1, The Arena's Greatest 1/1; core (>=75%) Consult the Past 1/1 x3.0, Sprite Call 1/1 x3.0, Teemo, Strategist 1/1 x3.0, Nocturne, Horrifying 1/1 x3.0, Teemo, Scout 1/1 x3.0, Tideturner 1/1 x3.0, Windsinger 1/1 x3.0, Switcheroo 1/1 x3.0; flex (25-74%) n too small
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (2 with an event marker in the name); 1 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=4, 4 event-named):** champion Viktor, Leader 4/4; runes 7 Order / 5 Mind 4/4; battlefields Rockfall Path 4/4, Forbidding Waste 4/4, Ravenbloom Conservatory 3/4, Void Gate 1/4; core (>=75%) Stupefy 4/4 x3.0, Cull the Weak 4/4 x3.0, Hidden Blade 4/4 x3.0, Imperial Decree 4/4 x3.0, Wages of Pain 4/4 x3.0, Bellows Breath 4/4 x3.0, Sprite Fountain 4/4 x3.0, Carrion Dredger 4/4 x3.0, Concert Poster 4/4 x2.8, Sprite Burst 4/4 x2.8, Shadow's Call 4/4 x2.8, Thousand-Tailed Watcher 4/4 x1.0; flex (25-74%) Hunting Dog 1/4, Singularity 1/4, Eclipse 1/4, Dragon Form 1/4
- **Played lists, pa-sample-2026-09-06 (DATA, n=2, 2 event-named):** champion Viktor, Leader 2/2; runes 7 Order / 5 Mind 1/2, 6 Mind / 6 Order 1/2; battlefields The Arena's Greatest 2/2, Rockfall Path 2/2, Forbidding Waste 2/2; core (>=75%) Stupefy 2/2 x3.0, Cull the Weak 2/2 x3.0, Hidden Blade 2/2 x3.0, Imperial Decree 2/2 x3.0, Honest Broker 2/2 x3.0, Xin Zhao, Vigilant 2/2 x3.0, Carrion Dredger 2/2 x3.0, Wages of Pain 2/2 x2.5; flex (25-74%) n too small
- **Data confidence: thin** (4 complete lists in pa-fetch-2026-11-11 (4 with an event marker in the name); 2 lists in pa-sample-2026-09-06)

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
- **Popularity and results (DATA):** 16 published lists since 2026-10-23 (rank 34 of 58, 1.1%); riftbound.gg week-2 tier 4, 0 wins, 0 top cuts; registered as an extra Neeko legend in 3 fetched lists
- **Played lists, pa-fetch-2026-11-11 (DATA, n=4, 1 event-named):** champion Miss Fortune, Captain 2/4, Miss Fortune, Buccaneer 2/4; runes 6 Body / 6 Chaos 1/4, 7 Body / 5 Chaos 1/4, 7 Chaos / 5 Body 1/4; battlefields Back-Alley Bar 2/4, Firelights' Hideout 2/4, Sigil of the Storm 1/4, Vilemaw's Lair 1/4, Void Gate 1/4; core (>=75%) Ride the Wind 4/4 x2.5, Bullet Time 4/4 x1.8, Punch First 3/4 x1.7, Miss Fortune, Captain 3/4 x1.0; flex (25-74%) Staunch Survivor 2/4, Bedeviling Stranger 2/4, Flurry of Blades 2/4, Gust 2/4, First Mate 2/4, Reckless Innovator 2/4, Rengar, Trophy Hunter 2/4, Miss Fortune, Buccaneer 2/4
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (4 complete lists in pa-fetch-2026-11-11 (1 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Popularity and results (DATA):** 32 published lists since 2026-10-23 (rank 14 of 58, 2.2%); riftbound.gg week-2 tier 3, 0 wins, 4 top cuts; EU Regional Championship 61% over 18 matches; registered as an extra Neeko legend in 3 fetched lists
- **Played lists, pa-fetch-2026-11-11 (DATA, n=4, 4 event-named):** champion Sett, Kingpin 3/4, Sett, Brawler 1/4; runes 7 Body / 5 Order 4/4; battlefields Monastery of Hirana 4/4, Valley of Idols 3/4, Grove of the God-Willow 2/4, Hunters' Circle 1/4, Packed Amphitheater 1/4; core (>=75%) Pit Rookie 4/4 x3.0, Call to Glory 4/4 x2.8, Pillaged Armory 4/4 x2.8, Rampage 4/4 x2.8, First Mate 4/4 x2.5, Fiora, Victorious 4/4 x2.5, Showstopper 4/4 x2.5, Punch First 4/4 x2.5, Rengar, Trophy Hunter 4/4 x1.8, Vi, Peacekeeper 4/4 x1.5, Trifarian Captain 3/4 x3.0, Kinkou Initiate 3/4 x3.0; flex (25-74%) Irresistible Faefolk 2/4, Cithria of Cloudfield 2/4, Sacrifice 2/4, Sabotage 2/4, Arena Bar 2/4, Hidden Blade 2/4, Nidalee, Cat Form 2/4, Kayle, Justified 1/4
- **Played lists, pa-sample-2026-09-06 (DATA, n=2, 2 event-named):** champion Sett, Kingpin 2/2; runes 7 Body / 5 Order 2/2; battlefields Grove of the God-Willow 2/2, Monastery of Hirana 2/2, Valley of Idols 2/2; core (>=75%) Arena Bar 2/2 x3.0, First Mate 2/2 x3.0, Pit Rookie 2/2 x3.0, Sabotage 2/2 x3.0, Call to Glory 2/2 x3.0, Fiora, Victorious 2/2 x3.0, Showstopper 2/2 x3.0, Punch First 2/2 x3.0; flex (25-74%) n too small
- **Data confidence: thin** (4 complete lists in pa-fetch-2026-11-11 (4 with an event marker in the name); 2 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=4, 0 event-named):** champion Annie, Fiery 3/4, Annie, Stubborn 1/4; runes 8 Fury / 4 Chaos 2/4, 7 Fury / 5 Chaos 1/4, 6 Fury / 6 Chaos 1/4; battlefields Void Gate 3/4, Zaun Warrens 2/4, Frozen Fortress 2/4, Vilemaw's Lair 1/4, Minefield 1/4; core (>=75%) Void Seeker 3/4 x2.7, Falling Star 3/4 x2.7, Traveling Merchant 3/4 x2.7, Bilgewater Tracker 3/4 x2.7, Seal of Rage 3/4 x2.3, Piercing Light 3/4 x2.0, Gust 3/4 x1.7, Flash 3/4 x1.7, Lost to the Sands 3/4 x1.3, Annie, Fiery 3/4 x1.0; flex (25-74%) Immortal Phoenix 2/4, Amateur Demolitionist 2/4, Kai'Sa, Survivor 2/4, Vi, Destructive 2/4, Ride the Wind 2/4, Shimmering Swimmer 2/4, Tibbers 2/4, Siren's Song 2/4
- **Played lists, pa-sample-2026-09-06 (DATA, n=2, 2 event-named):** champion Annie, Stubborn 2/2; runes 7 Fury / 5 Chaos 2/2; battlefields The Arena's Greatest 2/2, Zaun Warrens 2/2, Seat of Power 2/2; core (>=75%) Noxus Hopeful 2/2 x3.0, Kai'Sa, Survivor 2/2 x3.0, Stacked Deck 2/2 x3.0, Traveling Merchant 2/2 x3.0, Flash 2/2 x3.0, Ferrous Forerunner 2/2 x3.0, Long Sword 2/2 x3.0, Rengar, Pouncing 2/2 x3.0; flex (25-74%) n too small
- **Data confidence: thin** (4 complete lists in pa-fetch-2026-11-11 (0 with an event marker in the name); 2 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=4, 4 event-named):** champion Master Yi, Tempered 4/4; runes 7 Body / 5 Calm 3/4, 8 Body / 4 Calm 1/4; battlefields Emperor's Dais 3/4, Seat of Power 3/4, Star Spring 3/4, Grove of the God-Willow 2/4, Abandoned Hall 1/4; core (>=75%) Charm 4/4 x3.0, Discipline 4/4 x3.0, Pit Rookie 4/4 x3.0, Punch First 4/4 x3.0, Rengar, Trophy Hunter 4/4 x3.0, Lonely Poro 4/4 x2.8, Defy 4/4 x2.5, Ruin Runner 4/4 x2.0, Rampage 4/4 x2.0, Zhonya's Hourglass 4/4 x1.8, Master Yi, Tempered 4/4 x1.0, First Mate 3/4 x3.0; flex (25-74%) Repulse 2/4, Legion Marauder 1/4, Mask of Foresight 1/4, Iridescent Avian 1/4, Elnuk Herd 1/4, Brutalizer 1/4, Alpha Strike 1/4, Invigorating Bloom 1/4
- **Played lists, pa-sample-2026-09-06 (DATA, n=2, 2 event-named):** champion Master Yi, Tempered 2/2; runes 7 Body / 5 Calm 2/2; battlefields Emperor's Dais 2/2, Seat of Power 2/2, The Arena's Greatest 1/2, Star Spring 1/2; core (>=75%) Charm 2/2 x3.0, Defy 2/2 x3.0, Discipline 2/2 x3.0, Pit Rookie 2/2 x3.0, Lonely Poro 2/2 x3.0, Punch First 2/2 x3.0, Scuttle Crab 2/2 x3.0, Rengar, Trophy Hunter 2/2 x3.0; flex (25-74%) n too small
- **Data confidence: thin** (4 complete lists in pa-fetch-2026-11-11 (4 with an event marker in the name); 2 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 0 event-named):** champion Lux, Crownguard 3/3; runes 6 Mind / 6 Order 3/3; battlefields Rockfall Path 2/3, Sigil of the Storm 1/3, Void Gate 1/3, Black Rose Sanctum 1/3, Forbidding Waste 1/3; core (>=75%) Singularity 3/3 x2.0, Lux, Crownguard 3/3 x1.7, The Ruination 3/3 x1.7; flex (25-74%) Bellows Breath 2/3, Honest Broker 2/3, Vanguard Armory 2/3, Sprite Burst 2/3, Progress Day 2/3, Imperial Decree 2/3, Drag Under 2/3, Sprite Fountain 2/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=1, 1 event-named):** champion Lux, Crownguard 1/1; runes 7 Mind / 5 Order 1/1; battlefields Aspirant's Climb 1/1, Forgotten Monument 1/1, The Papertree 1/1; core (>=75%) Stupefy 1/1 x3.0, Ekko, Recurrent 1/1 x3.0, Progress Day 1/1 x3.0, Seal of Insight 1/1 x3.0, Time Warp 1/1 x3.0, Forge of the Future 1/1 x3.0, Soaring Scout 1/1 x3.0, Downstage Dramatics 1/1 x3.0; flex (25-74%) n too small
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (0 with an event marker in the name); 1 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 0 event-named):** champion Garen, Rugged 2/3, Garen, Commander 1/3; runes 6 Body / 6 Order 1/3, 8 Body / 4 Order 1/3, 8 Order / 4 Body 1/3; battlefields Trifarian War Camp 2/3, Monastery of Hirana 1/3, The Grand Plaza 1/3, Ruined Monastery 1/3, Rockfall Path 1/3; core (>=75%) -; flex (25-74%) Vanguard Captain 2/3, Seal of Unity 2/3, Trifarian Captain 2/3, Xin Zhao, Vigilant 2/3, Cull the Weak 2/3, Rengar, Trophy Hunter 2/3, Vi, Peacekeeper 2/3, Garen, Rugged 2/3
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (0 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Ekko, Ingenious 3/3; runes 6 Fury / 6 Mind 2/3, 7 Fury / 5 Mind 1/3; battlefields Seat of Power 2/3, Dusk Rose Lab 2/3, Forbidding Waste 2/3, Firelights' Hideout 1/3, Rockfall Path 1/3; core (>=75%) Noxus Hopeful 3/3 x3.0, Stupefy 3/3 x3.0, Thousand-Tailed Watcher 3/3 x2.7, Falling Star 3/3 x2.3, Blood Rush 3/3 x2.0, Shock Blast 3/3 x2.0, Legion Rearguard 3/3 x1.7, Pyke, Dockside Butcher 3/3 x1.7, Ekko, Ingenious 3/3 x1.0; flex (25-74%) Watchful Sentry 2/3, Runeblade Anvil 2/3, Detonate 2/3, Battering Ram 2/3, Forecaster 2/3, Sprite Fountain 2/3, Seal of Rage 2/3, Kai'Sa, Survivor 1/3
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Ziggs, Explosive 3/3; runes 8 Fury / 4 Chaos 3/3; battlefields Void Gate 3/3, Rakelstake 3/3, Forbidding Waste 3/3; core (>=75%) Falling Star 3/3 x3.0, Acceptable Losses 3/3 x3.0, Pack of Wonders 3/3 x3.0, Treasure Trove 3/3 x3.0, Amateur Demolitionist 3/3 x3.0, Bilgewater Tracker 3/3 x3.0, Shimmering Swimmer 3/3 x3.0, Seal of Rage 3/3 x2.0, Ekko, Revolutionary 3/3 x2.0, Detonate 3/3 x2.0, Fizz, Trickster 3/3 x2.0, Ezreal, Prodigy 3/3 x2.0; flex (25-74%) -
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Mordekaiser, Dominating 3/3; runes 6 Fury / 6 Order 2/3, 7 Fury / 5 Order 1/3; battlefields Zaun Warrens 3/3, Ruined Monastery 2/3, Minefield 2/3, Packed Amphitheater 1/3, Seat of Power 1/3; core (>=75%) Kai'Sa, Survivor 3/3 x3.0, Realm of Death 3/3 x3.0, Carrion Dredger 3/3 x3.0, Long Sword 3/3 x2.3, Hidden Blade 3/3 x2.0, Vi, Peacekeeper 3/3 x2.0, Shen, Kinkou 3/3 x1.7, Mordekaiser, Dominating 3/3 x1.0; flex (25-74%) Vanguard Captain 2/3, Trifarian Captain 2/3, Honest Broker 2/3, Falling Star 2/3, Jhin, Murderous Artist 2/3, Rengar, Unseen 2/3, Bilgewater Tracker 2/3, Xin Zhao, Vigilant 2/3
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Orianna, Exquisite 2/3, Orianna, Mechanical Marvel 1/3; runes 8 Mind / 4 Calm 1/3, 7 Calm / 5 Mind 1/3, 8 Calm / 4 Mind 1/3; battlefields Veiled Temple 3/3, Void Gate 2/3, Ornn's Forge 2/3, Rockfall Path 2/3; core (>=75%) Defy 3/3 x3.0, Discipline 3/3 x3.0, Singularity 3/3 x2.0; flex (25-74%) Stupefy 2/3, The Ball 2/3, Plundering Poro 2/3, Wages of Pain 2/3, Ravenbloom Student 2/3, Thousand-Tailed Watcher 2/3, Cloth Armor 2/3, Patched Porobot 2/3
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion K'Sante, Dauntless 2/3, K'Sante, Courageous 1/3; runes 6 Calm / 6 Body 2/3, 7 Calm / 5 Body 1/3; battlefields Fortified Position 2/3, Grove of the God-Willow 2/3, Amateur Recital 2/3, Forgotten Monument 1/3, Seat of Power 1/3; core (>=75%) Discipline 3/3 x3.0, Ntofo Strikes 3/3 x3.0, Mutated Mouser 3/3 x3.0, Defy 3/3 x2.7, Punch First 3/3 x2.7, Nazuman Ntofo 3/3 x2.3, Zhonya's Hourglass 3/3 x2.0, Block 3/3 x1.7; flex (25-74%) Stalwart Poro 2/3, Scuttle Crab 2/3, Astral Heron 2/3, First Mate 2/3, Consult the Heavens 2/3, Ruin Runner 2/3, Hunting Blind 2/3, K'Sante, Dauntless 2/3
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Popularity and results (DATA):** 76 published lists since 2026-10-23 (rank 3 of 58, 5.3%); riftbound.gg week-2 tier S, 5 wins, 16 top cuts; EU Regional Championship 54% over 524 matches; registered as an extra Neeko legend in 1 fetched lists
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Riven, Broken Blade 3/3; runes 7 Chaos / 5 Calm 3/3; battlefields Emperor's Dais 3/3, Star Spring 3/3, Rakelstake 2/3, Windswept Hillock 1/3; core (>=75%) Discipline 3/3 x3.0, Blade of the Exile 3/3 x3.0, Stellacorn Herder 3/3 x3.0, Astral Heron 3/3 x3.0, Defy 3/3 x2.7, Zhonya's Hourglass 3/3 x2.7, Tideturner 3/3 x2.3, Reckless Innovator 3/3 x2.3, Bedeviling Stranger 3/3 x2.3, Gust 3/3 x2.0, Scuttle Crab 3/3 x2.0, Blitzcrank, Impassive 3/3 x1.7; flex (25-74%) Battle Preparations 2/3, Traveling Merchant 1/3, Evelynn, Entrancing 1/3, En Garde 1/3, Ki Burst 1/3, Baron Nashor 1/3
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Seraphine, Inspiring 3/3; runes 7 Order / 5 Mind 3/3; battlefields Forbidding Waste 3/3, Vilemaw's Lair 2/3, Void Gate 2/3, Rockfall Path 1/3, Seat of Power 1/3; core (>=75%) Stupefy 3/3 x3.0, Cull the Weak 3/3 x3.0, Concert Poster 3/3 x3.0, Trifarian Captain 3/3 x2.7, Encore 3/3 x2.7, Bellows Breath 3/3 x2.7, Hidden Blade 3/3 x2.3, Imperial Decree 3/3 x2.3, Carrion Dredger 3/3 x2.3, Seraphine, Inspiring 3/3 x1.0; flex (25-74%) Vanguard Captain 2/3, Thousand-Tailed Watcher 2/3, Faithful Manufactor 2/3, Seal of Unity 2/3, Shadow's Call 2/3, Vi, Peacekeeper 2/3, Mordekaiser, Dominating 2/3, Kennen, Keeper of Balance 2/3
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Popularity and results (DATA):** 100 published lists since 2026-10-23 (rank 1 of 58, 6.9%)
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Evelynn, Entrancing 3/3; runes 8 Chaos / 4 Body 2/3, 6 Body / 6 Chaos 1/3; battlefields Bandle Scouts' Academy 3/3, Startipped Peak 2/3, Rakelstake 2/3, Bandle Tree 1/3, Grove of the God-Willow 1/3; core (>=75%) Gutter Guardian 3/3 x2.7, Pyke, Returned 3/3 x2.7, K'Sante, Courageous 3/3 x2.3, Hold 'Em 3/3 x2.0, Boots of Swiftness 3/3 x2.0, Rengar, Trophy Hunter 3/3 x2.0, Vex, Apathetic 3/3 x2.0, Rampage 3/3 x2.0, Edge of Night 3/3 x1.7, Switcheroo 3/3 x1.3, Evelynn, Entrancing 3/3 x1.0; flex (25-74%) Kinkou Initiate 2/3, Tornado Warrior 2/3, Tail-Cloaked Matriarch 2/3, Fizz, Trickster 2/3, Ezreal, Prodigy 2/3, Star-Crossed 2/3, Baron Nashor 2/3, Onslaught 2/3
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Jarvan IV, Martial Paragon 2/3, Jarvan IV, Royal Heir 1/3; runes 6 Body / 6 Order 2/3, 7 Body / 5 Order 1/3; battlefields Monastery of Hirana 3/3, Seat of Power 3/3, Packed Amphitheater 2/3, Forbidding Waste 1/3; core (>=75%) Pit Rookie 3/3 x3.0, Pillaged Armory 3/3 x3.0, Lucian, Merciless 3/3 x3.0, Irresistible Faefolk 3/3 x3.0, Rengar, Trophy Hunter 3/3 x3.0, Call to Glory 3/3 x2.7, Trifarian Captain 3/3 x2.7, Demacian Standard 3/3 x2.7, Nidalee, Cat Form 3/3 x2.7, First Mate 3/3 x2.0, Sett, Kingpin 3/3 x2.0, Punch First 3/3 x2.0; flex (25-74%) Skystrike Squadron 2/3, Jarvan IV, Martial Paragon 2/3, Kinkou Initiate 1/3, Yone, Blademaster 1/3, Portable Portal 1/3, Jarvan IV, Royal Heir 1/3
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 1 event-named):** champion Rumble, Hotheaded 3/3; runes 7 Fury / 5 Mind 2/3, 8 Fury / 4 Mind 1/3; battlefields Zaun Warrens 3/3, Grove of the God-Willow 1/3, Startipped Peak 1/3, Trifarian War Camp 1/3, Seat of Power 1/3; core (>=75%) Bubble Bot 3/3 x3.0, Forecaster 3/3 x3.0, Patched Porobot 3/3 x3.0, Gem Jammer 3/3 x2.7, Falling Star 3/3 x2.3, Ferrous Forerunner 3/3 x2.0, Long Sword 3/3 x1.7, Rumble, Hotheaded 3/3 x1.7; flex (25-74%) Stupefy 2/3, Incorrigible Construct 2/3, Temporal Breach 2/3, Antagonistic Apparatus 2/3, Consult the Past 1/3, Lecturing Yordle 1/3, Time Warp 1/3, Resource Extractor 1/3
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (1 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=2, 2 event-named):** champion Lucian, Merciless 2/2; runes 6 Fury / 6 Body 1/2, 7 Body / 5 Fury 1/2; battlefields Forge of the Fluft 2/2, Sunken Temple 2/2, The Candlelit Sanctum 1/2, Windswept Hillock 1/2; core (>=75%) Kai'Sa, Survivor 2/2 x3.0, Doran's Blade 2/2 x3.0, Punch First 2/2 x3.0, Irresistible Faefolk 2/2 x3.0, Noxus Hopeful 2/2 x2.5, First Mate 2/2 x2.5, Sabotage 2/2 x2.5, Long Sword 2/2 x2.5, Relentless Pursuit 2/2 x2.5, Kinkou Initiate 2/2 x2.5, Falling Star 2/2 x2.0, Lucian, Merciless 2/2 x1.0; flex (25-74%) n too small
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (2 complete lists in pa-fetch-2026-11-11 (2 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Popularity and results (DATA):** 18 published lists since 2026-10-23 (rank 30 of 58, 1.2%); registered as an extra Neeko legend in 2 fetched lists
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Draven, Showboat 3/3; runes 6 Fury / 6 Chaos 3/3; battlefields Grove of the God-Willow 3/3, Star Spring 3/3, Startipped Peak 1/3, Zaun Warrens 1/3, Hunters' Circle 1/3; core (>=75%) Tideturner 3/3 x3.0, Spinning Axe 3/3 x3.0, Vex, Apathetic 3/3 x3.0, Noxus Hopeful 3/3 x2.3, Kai'Sa, Survivor 3/3 x2.3, Rebuke 3/3 x2.3, Overzealous Fan 3/3 x2.3, Falling Star 3/3 x2.0, Switcheroo 3/3 x2.0, Evelynn, Entrancing 3/3 x2.0, Up from the Deep 3/3 x2.0, Draven, Showboat 3/3 x1.0; flex (25-74%) Inferna 2/3, Kha'Zix, Mutating Horror 2/3, Pyke, Returned 2/3, Blood Rush 2/3, Ferrous Forerunner 2/3, Pyke, Dockside Butcher 2/3, Jhin, Murderous Artist 1/3, Siren's Song 1/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=2, 2 event-named):** champion Draven, Showboat 2/2; runes 7 Fury / 5 Chaos 1/2, 6 Fury / 6 Chaos 1/2; battlefields Targon's Peak 1/2, The Arena's Greatest 1/2, Zaun Warrens 1/2, Rockfall Path 1/2, Treasure Hoard 1/2; core (>=75%) Noxus Hopeful 2/2 x3.0, Darius, Trifarian 2/2 x3.0, Stacked Deck 2/2 x3.0, Tideturner 2/2 x3.0, Overzealous Fan 2/2 x3.0, Spinning Axe 2/2 x3.0, Kai'Sa, Survivor 2/2 x2.5, Vex, Apathetic 2/2 x2.5; flex (25-74%) n too small
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 2 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Rek'Sai, Breacher 3/3; runes 8 Fury / 4 Order 2/3, 7 Fury / 5 Order 1/3; battlefields The Candlelit Sanctum 3/3, Hunters' Circle 2/3, Ruined Monastery 2/3, Vilemaw's Lair 1/3, Rockfall Path 1/3; core (>=75%) Noxus Hopeful 3/3 x3.0, Falling Star 3/3 x3.0, Cull the Weak 3/3 x3.0, Faithful Manufactor 3/3 x3.0, Bilgewater Tracker 3/3 x3.0, Shimmering Swimmer 3/3 x3.0, Concert Poster 3/3 x3.0, Trifarian Captain 3/3 x3.0, Undertitan 3/3 x3.0, Inferna 3/3 x3.0, Carrion Dredger 3/3 x3.0, Rengar, Pouncing 3/3 x2.3; flex (25-74%) Long Sword 2/3, Grim Apothecary 2/3, Imperial Decree 1/3, Banner of Conquest 1/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=2, 2 event-named):** champion Rek'Sai, Breacher 2/2; runes 6 Fury / 6 Order 1/2, 8 Fury / 4 Order 1/2; battlefields The Arena's Greatest 2/2, The Candlelit Sanctum 2/2, Trifarian War Camp 1/2, Hall of Legends 1/2; core (>=75%) Noxus Hopeful 2/2 x3.0, Cull the Weak 2/2 x3.0, Faithful Manufactor 2/2 x3.0, Blood Rush 2/2 x3.0, Honest Broker 2/2 x3.0, Undertitan 2/2 x3.0, Void Rush 2/2 x3.0, Inferna 2/2 x3.0; flex (25-74%) n too small
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 2 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Ornn, Blacksmith 3/3; runes 9 Calm / 3 Mind 2/3, 7 Calm / 5 Mind 1/3; battlefields Seat of Power 3/3, Veiled Temple 3/3, Ornn's Forge 2/3, Dusk Rose Lab 1/3; core (>=75%) Seal of Focus 3/3 x3.0, Pit Crew 3/3 x3.0, Brutalizer 3/3 x3.0, Poro Snax 3/3 x3.0, Sterak's Gage 3/3 x3.0, Scuttle Crab 3/3 x3.0, Sprite Fountain 3/3 x3.0, Patched Porobot 3/3 x3.0, Defy 3/3 x2.7, Charm 3/3 x2.0, Guardian Angel 3/3 x1.7, Aspiring Engineer 3/3 x1.7; flex (25-74%) Lonely Poro 2/3, Battle Preparations 2/3, Command: Attack 2/3, Clockwork Keeper 1/3, Invigorating Bloom 1/3, Mask of Foresight 1/3, Lecturing Yordle 1/3, Hush 1/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=2, 2 event-named):** champion Ornn, Forge God 1/2, Ornn, Blacksmith 1/2; runes 8 Calm / 4 Mind 1/2, 7 Calm / 5 Mind 1/2; battlefields The Arena's Greatest 2/2, Ornn's Forge 2/2, Rockfall Path 1/2, Dusk Rose Lab 1/2; core (>=75%) Charm 2/2 x3.0, Sterak's Gage 2/2 x3.0, Sprite Fountain 2/2 x3.0, Defy 2/2 x2.5, Discipline 2/2 x2.5, Pit Crew 2/2 x2.5, Brutalizer 2/2 x2.5, Poro Snax 2/2 x2.5; flex (25-74%) n too small
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 2 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 2 event-named):** champion Jax, Unmatched 3/3; runes 6 Calm / 6 Body 3/3; battlefields Ornn's Forge 3/3, Sunken Temple 3/3, Grove of the God-Willow 1/3, Monastery of Hirana 1/3, Forbidding Waste 1/3; core (>=75%) Discipline 3/3 x3.0, Defy 3/3 x2.7, Brutalizer 3/3 x2.7, Guardian Angel 3/3 x2.7, Counter Strike 3/3 x2.7, Scuttle Crab 3/3 x2.3, Punch First 3/3 x2.0, Rampage 3/3 x2.0, Jax, Unmatched 3/3 x1.0; flex (25-74%) First Mate 2/3, Lucian, Merciless 2/3, Graves, Blasting Through 2/3, Irelia, Fervent 2/3, Doran's Blade 2/3, Boneshiver 2/3, Clockwork Keeper 1/3, Pit Rookie 1/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=1, 1 event-named):** champion Jax, Unmatched 1/1; runes 6 Calm / 6 Body 1/1; battlefields Zaun Warrens 1/1, Ornn's Forge 1/1, Sunken Temple 1/1; core (>=75%) Defy 1/1 x3.0, Discipline 1/1 x3.0, First Mate 1/1 x3.0, Lonely Poro 1/1 x3.0, Brutalizer 1/1 x3.0, Guardian Angel 1/1 x3.0, Lucian, Merciless 1/1 x3.0, Counter Strike 1/1 x3.0; flex (25-74%) n too small
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (2 with an event marker in the name); 1 lists in pa-sample-2026-09-06)

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
- **Popularity and results (DATA):** 20 published lists since 2026-10-23 (rank 26 of 58, 1.4%); riftbound.gg week-2 tier 2, 1 wins, 2 top cuts; EU Regional Championship 38% over 45 matches; registered as an extra Neeko legend in 1 fetched lists
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Irelia, Fervent 2/3; runes 6 Calm / 6 Chaos 3/3; battlefields Targon's Peak 3/3, Sunken Temple 3/3, Abandoned Hall 3/3; core (>=75%) Defy 3/3 x3.0, Discipline 3/3 x3.0, Defiant Dance 3/3 x3.0, Tideturner 3/3 x2.7, Stellacorn Herder 3/3 x2.7, Boots of Swiftness 3/3 x2.3, Ride the Wind 3/3 x2.0, Guardian Angel 3/3 x2.0, Scuttle Crab 3/3 x1.7, En Garde 3/3 x1.3, Battle Preparations 3/3 x1.3, Irelia, Fervent 3/3 x1.3; flex (25-74%) Orianna, Exquisite 2/3, Charm 2/3, Edge of Night 2/3, Rebuke 2/3, Hunker Down 2/3, Lonely Poro 2/3, Not So Fast 2/3, Gust Monk 2/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=2, 2 event-named):** champion Irelia, Fervent 2/2; runes 6 Calm / 6 Chaos 2/2; battlefields Targon's Peak 2/2, Sunken Temple 2/2, Abandoned Hall 2/2; core (>=75%) Defy 2/2 x3.0, Discipline 2/2 x3.0, Tideturner 2/2 x3.0, Defiant Dance 2/2 x3.0, Scuttle Crab 2/2 x3.0, Charm 2/2 x2.5, Boots of Swiftness 2/2 x2.5, En Garde 2/2 x2.0; flex (25-74%) n too small
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 2 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Azir, Sovereign 3/3; runes 7 Calm / 5 Order 3/3; battlefields Trifarian War Camp 3/3, Hall of Legends 3/3, Seat of Power 2/3, Vilemaw's Lair 1/3; core (>=75%) Discipline 3/3 x3.0, Doran's Shield 3/3 x3.0, Brutalizer 3/3 x3.0, Eye of the Herald 3/3 x3.0, Guards! 3/3 x3.0, B.F. Sword 3/3 x3.0, Arise! 3/3 x3.0, Defy 3/3 x2.7, Hidden Blade 3/3 x2.7, Hand Hammer 3/3 x2.7, Back Off 3/3 x2.3, Deathgrip 3/3 x1.7; flex (25-74%) Soul Sword 2/3, Battle Preparations 2/3, Kennen, Keeper of Balance 2/3, Trifarian Captain 1/3, En Garde 1/3, Charm 1/3, Vi, Peacekeeper 1/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=1, 1 event-named):** champion Azir, Sovereign 1/1; runes 7 Calm / 5 Order 1/1; battlefields Trifarian War Camp 1/1, Hall of Legends 1/1, Seat of Power 1/1; core (>=75%) Defy 1/1 x3.0, En Garde 1/1 x3.0, Discipline 1/1 x3.0, Hidden Blade 1/1 x3.0, Doran's Shield 1/1 x3.0, Brutalizer 1/1 x3.0, Eye of the Herald 1/1 x3.0, B.F. Sword 1/1 x3.0; flex (25-74%) n too small
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 1 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 1 event-named):** champion Ezreal, Prodigy 3/3; runes 6 Mind / 6 Chaos 2/3, 7 Chaos / 5 Mind 1/3; battlefields Sigil of the Storm 3/3, Void Gate 2/3, Frozen Fortress 2/3, Vilemaw's Lair 1/3, Forgotten Monument 1/3; core (>=75%) Stupefy 3/3 x3.0, Wages of Pain 3/3 x3.0, Bellows Breath 3/3 x3.0, Gust 3/3 x2.3, Fizz, Trickster 3/3 x2.3, Thousand-Tailed Watcher 3/3 x2.0, Singularity 3/3 x1.7, Ezreal, Prodigy 3/3 x1.7; flex (25-74%) Pack of Wonders 2/3, Deadly Flourish 2/3, Bewitching Spirit 2/3, Treasure Trove 2/3, Star-Crossed 2/3, The List 2/3, Ravenbloom Student 1/3, Plundering Poro 1/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=2, 2 event-named):** champion Ezreal, Prodigy 2/2; runes 7 Chaos / 5 Mind 2/2; battlefields Aspirant's Climb 2/2, Sigil of the Storm 2/2, Rockfall Path 1/2, Frozen Fortress 1/2; core (>=75%) Stupefy 2/2 x3.0, Stacked Deck 2/2 x3.0, Bellows Breath 2/2 x3.0, Fizz, Trickster 2/2 x3.0, Deadly Flourish 2/2 x3.0, Bewitching Spirit 2/2 x3.0, Gust 2/2 x2.5, Pack of Wonders 2/2 x2.5; flex (25-74%) n too small
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (1 with an event marker in the name); 2 lists in pa-sample-2026-09-06)

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
- **Popularity and results (DATA):** 8 published lists since 2026-10-23 (rank 54 of 58, 0.5%); registered as an extra Neeko legend in 1 fetched lists
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 0 event-named):** champion Renata Glasc, Mastermind 2/3, Renata Glasc, Industrialist 1/3; runes 7 Order / 5 Mind 1/3, 8 Mind / 4 Order 1/3, 6 Mind / 6 Order 1/3; battlefields Power Nexus 2/3, Treasure Hoard 2/3, Fortified Position 1/3, Grove of the God-Willow 1/3, Navori Fighting Pit 1/3; core (>=75%) Patched Porobot 3/3 x3.0, Stupefy 3/3 x2.7; flex (25-74%) Resource Extractor 2/3, Honest Broker 2/3, Plaza Guardian 2/3, Time Warp 2/3, Singularity 2/3, Thousand-Tailed Watcher 2/3, Renata Glasc, Mastermind 2/3, Lecturing Yordle 1/3
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (0 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 1 event-named):** champion Sivir, Mercenary 3/3; runes 6 Body / 6 Chaos 2/3, 7 Chaos / 5 Body 1/3; battlefields Sigil of the Storm 2/3, Vilemaw's Lair 1/3, Zaun Warrens 1/3, Black Market 1/3, Sunken Temple 1/3; core (>=75%) Punch First 3/3 x2.7, Star-Crossed 3/3 x2.3, Sivir, Mercenary 3/3 x1.0; flex (25-74%) First Mate 2/3, Tideturner 2/3, Ezreal, Prodigy 2/3, Tail-Cloaked Matriarch 2/3, Edge of Night 2/3, Confront 1/3, Pack of Wonders 1/3, Traveling Merchant 1/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=1, 1 event-named):** champion Sivir, Mercenary 1/1; runes 6 Body / 6 Chaos 1/1; battlefields Aspirant's Climb 1/1, Sigil of the Storm 1/1, Forgotten Monument 1/1; core (>=75%) Challenge 1/1 x3.0, Mobilize 1/1 x3.0, Catalyst of Aeons 1/1 x3.0, Dazzling Aurora 1/1 x3.0, Ride the Wind 1/1 x3.0, Stacked Deck 1/1 x3.0, Punch First 1/1 x3.0, Scryer's Bloom 1/1 x3.0; flex (25-74%) n too small
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (1 with an event marker in the name); 1 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 1 event-named):** champion Fiora, Victorious 3/3; runes 8 Body / 4 Order 1/3, 7 Body / 5 Order 1/3, 6 Body / 6 Order 1/3; battlefields Sunken Temple 3/3, Monastery of Hirana 2/3, Risen Altar 2/3, Hunters' Circle 1/3, Amateur Recital 1/3; core (>=75%) Pit Rookie 3/3 x3.0, Rampage 3/3 x3.0, Punch First 3/3 x2.7, Riposte 3/3 x2.3, Kinkou Initiate 3/3 x2.3, Rengar, Trophy Hunter 3/3 x2.3, Kayle, Justified 3/3 x2.3, Fiora, Victorious 3/3 x1.0; flex (25-74%) Trifarian Captain 2/3, Call to Glory 2/3, Pillaged Armory 2/3, Sacrifice 2/3, Vi, Peacekeeper 2/3, Hidden Blade 2/3, Harnessed Dragon 2/3, Akshan, Mischievous 1/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=1, 1 event-named):** champion Fiora, Victorious 1/1; runes 7 Body / 5 Order 1/1; battlefields Monastery of Hirana 1/1, Sunken Temple 1/1, Valley of Idols 1/1; core (>=75%) Pit Rookie 1/1 x3.0, Call to Glory 1/1 x3.0, Sea Monkey 1/1 x3.0, B.F. Sword 1/1 x3.0, Unsung Hero 1/1 x3.0, Sacrifice 1/1 x3.0, Rift Herald 1/1 x3.0, Challenge 1/1 x2.0; flex (25-74%) n too small
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (1 with an event marker in the name); 1 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Jhin, Meticulous Killer 3/3; runes 7 Mind / 5 Fury 3/3; battlefields Sigil of the Storm 3/3, Frozen Fortress 3/3, Rockfall Path 2/3, Forbidding Waste 1/3; core (>=75%) Noxus Hopeful 3/3 x3.0, Consult the Past 3/3 x3.0, Stupefy 3/3 x3.0, Forecaster 3/3 x3.0, Plundering Poro 3/3 x3.0, Deadly Flourish 3/3 x3.0, Curtain Call 3/3 x3.0, Sprite Burst 3/3 x2.3, Singularity 3/3 x2.0, Thousand-Tailed Watcher 3/3 x2.0, Time Warp 3/3 x2.0, Ferrous Forerunner 3/3 x2.0; flex (25-74%) Orb of Regret 2/3, Progress Day 2/3, Downstage Dramatics 2/3, Bilgewater Tracker 1/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=2, 2 event-named):** champion Jhin, Meticulous Killer 2/2; runes 10 Mind / 2 Fury 1/2, 7 Mind / 5 Fury 1/2; battlefields Aspirant's Climb 2/2, Sigil of the Storm 1/2, Void Gate 1/2, Forgotten Monument 1/2, Frozen Fortress 1/2; core (>=75%) Consult the Past 2/2 x3.0, Deadly Flourish 2/2 x3.0, Curtain Call 2/2 x3.0, Progress Day 2/2 x2.0, Time Warp 2/2 x2.0, Downstage Dramatics 2/2 x2.0, Sprite Burst 2/2 x1.5, Jhin, Meticulous Killer 2/2 x1.0; flex (25-74%) n too small
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 2 lists in pa-sample-2026-09-06)

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
- **Popularity and results (DATA):** 14 published lists since 2026-10-23 (rank 39 of 58, 1.0%); riftbound.gg week-2 tier 2, 0 wins, 3 top cuts; EU Regional Championship 45% over 29 matches; registered as an extra Neeko legend in 1 fetched lists
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Rengar, Trophy Hunter 3/3; runes 8 Body / 4 Fury 3/3; battlefields Emperor's Dais 3/3, Seat of Power 3/3, Star Spring 3/3; core (>=75%) Pit Rookie 3/3 x3.0, Inferna 3/3 x3.0, Kinkou Initiate 3/3 x3.0, Irresistible Faefolk 3/3 x3.0, Thrill of the Hunt 3/3 x3.0, Noxus Hopeful 3/3 x2.7, Kai'Sa, Survivor 3/3 x2.7, Punch First 3/3 x2.7, Grim Apothecary 3/3 x2.3, First Mate 3/3 x2.0, Sabotage 3/3 x2.0, Elnuk Herd 3/3 x2.0; flex (25-74%) Darius, Trifarian 1/3, Hold 'Em 1/3, Mischievous Marai 1/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=2, 2 event-named):** champion Rengar, Trophy Hunter 2/2; runes 8 Body / 4 Fury 2/2; battlefields Emperor's Dais 2/2, Targon's Peak 1/2, The Arena's Greatest 1/2, Seat of Power 1/2, Star Spring 1/2; core (>=75%) Kai'Sa, Survivor 2/2 x3.0, Pit Rookie 2/2 x3.0, Punch First 2/2 x3.0, Inferna 2/2 x3.0, Determined Sentry 2/2 x3.0, Irresistible Faefolk 2/2 x3.0, Nidalee, Cat Form 2/2 x3.0, Thrill of the Hunt 2/2 x3.0; flex (25-74%) n too small
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 2 lists in pa-sample-2026-09-06)

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
- **Popularity and results (DATA):** 24 published lists since 2026-10-23 (rank 23 of 58, 1.7%); registered as an extra Neeko legend in 1 fetched lists
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Pyke, Returned 2/3, Pyke, Dockside Butcher 1/3; runes 7 Chaos / 5 Fury 1/3, 6 Fury / 6 Chaos 1/3, 7 Fury / 5 Chaos 1/3; battlefields Ripper's Bay 2/3, Vilemaw's Lair 1/3, Void Gate 1/3, Zaun Warrens 1/3, Bandle Scouts' Academy 1/3; core (>=75%) Traveling Merchant 3/3 x3.0, Falling Star 3/3 x2.3, Ezreal, Prodigy 3/3 x2.3, Tail-Cloaked Matriarch 3/3 x2.3, Star-Crossed 3/3 x2.0, Vex, Apathetic 3/3 x2.0, Switcheroo 3/3 x1.7, Tideturner 3/3 x1.3, Fizz, Trickster 3/3 x1.3, Pyke, Dockside Butcher 3/3 x1.0; flex (25-74%) Tornado Warrior 2/3, Reckless Innovator 2/3, Blood Rush 2/3, Kharox 2/3, Cleave 2/3, Rengar, Pouncing 2/3, Hard Bargain 2/3, Pyke, Returned 2/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=2, 2 event-named):** champion Pyke, Dockside Butcher 2/2; runes 7 Fury / 5 Chaos 2/2; battlefields Forbidding Waste 2/2, Ripper's Bay 2/2, Aspirant's Climb 1/2, Void Gate 1/2; core (>=75%) Falling Star 2/2 x3.0, Treasure Hunter 2/2 x3.0, Bewitching Spirit 2/2 x3.0, Stacked Deck 2/2 x2.5, Tideturner 2/2 x2.5, Fizz, Trickster 2/2 x2.5, Void Seeker 2/2 x2.0, Star-Crossed 2/2 x2.0; flex (25-74%) n too small
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 2 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Vi, Peacekeeper 2/3; runes 7 Fury / 5 Order 2/3, 8 Fury / 4 Order 1/3; battlefields Packed Amphitheater 2/3, Star Spring 2/3, Reckoner's Arena 1/3, Vilemaw's Lair 1/3, Zaun Warrens 1/3; core (>=75%) Kai'Sa, Survivor 3/3 x3.0, Hextech Gauntlets 3/3 x3.0, Gem Jammer 3/3 x2.7, Hidden Blade 3/3 x2.3, Long Sword 3/3 x2.0, Deathgrip 3/3 x2.0, Kennen, Keeper of Balance 3/3 x1.3, Vi, Peacekeeper 3/3 x1.0; flex (25-74%) Trifarian Captain 2/3, Honest Broker 2/3, Jhin, Murderous Artist 2/3, Pyke, Dockside Butcher 2/3, Cleave 2/3, Falling Star 2/3, Rek'Sai, Breacher 2/3, Fiora, Victorious 2/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=1, 1 event-named):** champion Vi, Peacekeeper 1/1; runes 7 Fury / 5 Order 1/1; battlefields The Arena's Greatest 1/1, Forge of the Fluft 1/1, Star Spring 1/1; core (>=75%) Noxus Hopeful 1/1 x3.0, Pouty Poro 1/1 x3.0, Kai'Sa, Survivor 1/1 x3.0, Faithful Manufactor 1/1 x3.0, Hidden Blade 1/1 x3.0, Gem Jammer 1/1 x3.0, Honest Broker 1/1 x3.0, Hextech Gauntlets 1/1 x3.0; flex (25-74%) n too small
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 1 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=2, 2 event-named):** champion Lillia, Fae Fawn 2/2; runes 7 Calm / 5 Mind 1/2, 6 Calm / 6 Mind 1/2; battlefields Seat of Power 2/2, Dusk Rose Lab 2/2, Abandoned Hall 1/2, Black Flame Altar 1/2; core (>=75%) Defy 2/2 x3.0, Discipline 2/2 x3.0, Mask of Foresight 2/2 x3.0, Ravenbloom Student 2/2 x3.0, Sprite Burst 2/2 x3.0, Sprite Fountain 2/2 x3.0, Charm 2/2 x2.5, En Garde 2/2 x2.5, Stupefy 2/2 x2.5, Smoke and Mirrors 2/2 x2.5, Lonely Poro 2/2 x2.0, Brutalizer 2/2 x2.0; flex (25-74%) n too small
- **Played lists, pa-sample-2026-09-06 (DATA, n=1, 1 event-named):** champion Lillia, Fae Fawn 1/1; runes 6 Calm / 6 Mind 1/1; battlefields The Arena's Greatest 1/1, Seat of Power 1/1, Dusk Rose Lab 1/1; core (>=75%) Defy 1/1 x3.0, En Garde 1/1 x3.0, Discipline 1/1 x3.0, Mask of Foresight 1/1 x3.0, Stupefy 1/1 x3.0, Ravenbloom Student 1/1 x3.0, Sprite Burst 1/1 x3.0, Sprite Fountain 1/1 x3.0; flex (25-74%) n too small
- **Data confidence: thin** (2 complete lists in pa-fetch-2026-11-11 (2 with an event marker in the name); 1 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=2, 2 event-named):** champion Master Yi, Tempered 2/2; runes 6 Calm / 6 Body 1/2, 7 Body / 5 Calm 1/2; battlefields Reckoner's Arena 1/2, Targon's Peak 1/2, Rockfall Path 1/2, Gardens of Becoming 1/2, Star Spring 1/2; core (>=75%) Defy 2/2 x3.0, Discipline 2/2 x3.0, Punch First 2/2 x3.0, Wuju Apprentice 2/2 x3.0, Master Yi, Unstoppable 2/2 x3.0, Gemhand Hunter 2/2 x3.0, Zhonya's Hourglass 2/2 x2.5, Scuttle Crab 2/2 x2.5, Grim Resolve 2/2 x2.5, Back Off 2/2 x2.0, Voracious Gromp 2/2 x2.0, Arachnoid Horror 2/2 x2.0; flex (25-74%) n too small
- **Played lists, pa-sample-2026-09-06 (DATA, n=1, 1 event-named):** champion Master Yi, Tempered 1/1; runes 6 Calm / 6 Body 1/1; battlefields Reckoner's Arena 1/1, Amateur Recital 1/1, Gardens of Becoming 1/1; core (>=75%) Defy 1/1 x3.0, Discipline 1/1 x3.0, Wuju Apprentice 1/1 x3.0, Master Yi, Unstoppable 1/1 x3.0, Gemhand Hunter 1/1 x3.0, Grim Resolve 1/1 x3.0, Voracious Gromp 1/1 x3.0, Emperor's Divide 1/1 x2.0; flex (25-74%) n too small
- **Data confidence: thin** (2 complete lists in pa-fetch-2026-11-11 (2 with an event marker in the name); 1 lists in pa-sample-2026-09-06)

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
- **Popularity and results (DATA):** 29 published lists since 2026-10-23 (rank 17 of 58, 2.0%); riftbound.gg week-2 tier 2, 1 wins, 6 top cuts; EU Regional Championship 36% over 11 matches; registered as an extra Neeko legend in 2 fetched lists
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Vex, Apathetic 3/3; runes 7 Chaos / 5 Calm 2/3, 6 Calm / 6 Chaos 1/3; battlefields Bandle Scouts' Academy 3/3, Bandle Tree 2/3, Startipped Peak 2/3, Targon's Peak 1/3, Hunters' Circle 1/3; core (>=75%) Defy 3/3 x3.0, Zhonya's Hourglass 3/3 x3.0, Steel Paws 3/3 x3.0, Astral Heron 3/3 x3.0, Tornado Warrior 3/3 x3.0, Bedeviling Stranger 3/3 x2.3, Boots of Swiftness 3/3 x2.3, Switcheroo 3/3 x2.3, Tideturner 3/3 x1.7, Rebuke 3/3 x1.3, Star-Crossed 3/3 x1.3, Blitzcrank, Impassive 3/3 x1.0; flex (25-74%) Discipline 2/3, Gust 2/3, Charm 2/3, Edge of Night 2/3, Sneaky Deckhand 1/3, Reckless Innovator 1/3, Irelia, Fervent 1/3, Scuttle Crab 1/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=3, 3 event-named):** champion Vex, Apathetic 3/3; runes 7 Calm / 5 Chaos 2/3, 6 Calm / 6 Chaos 1/3; battlefields Startipped Peak 3/3, Ravenbloom Conservatory 2/3, Grove of the God-Willow 1/3, The Papertree 1/3, Abandoned Hall 1/3; core (>=75%) Defy 3/3 x3.0, Discipline 3/3 x3.0, Sona, Harmonious 3/3 x3.0, Overzealous Fan 3/3 x3.0, Mutated Mouser 3/3 x3.0, Back Off 3/3 x3.0, Gust 3/3 x2.0, Charm 3/3 x1.7; flex (25-74%) Evelynn, Entrancing 2/3, Ahri, Alluring 2/3, Boots of Swiftness 2/3, Shadow 2/3, Rebuke 2/3, Vex, Cheerless 2/3, Ride the Wind 2/3, Switcheroo 2/3
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 3 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Ivern, Nurturer 3/3; runes 6 Calm / 6 Order 2/3, 7 Calm / 5 Order 1/3; battlefields Vilemaw's Lair 3/3, Rockfall Path 3/3, Forbidding Waste 3/3; core (>=75%) Defy 3/3 x3.0, Stalwart Poro 3/3 x3.0, Discipline 3/3 x3.0, Trusty Ramhound 3/3 x3.0, Mutated Mouser 3/3 x3.0, Back Off 3/3 x2.0, Ivern, Nurturer 3/3 x1.7, Frisky Hunter 3/3 x1.3, Daisy! 3/3 x1.0; flex (25-74%) Raucous Anthem 2/3, Affectionate Poro 2/3, Iridescent Avian 2/3, Emperor's Divide 2/3, Friendship 2/3, Fallen Feline 2/3, Block 2/3, Call to Glory 2/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=2, 2 event-named):** champion Ivern, Nurturer 2/2; runes 5 Order 1/2, 6 Calm / 6 Order 1/2; battlefields Vilemaw's Lair 2/2, Rockfall Path 2/2, Forbidding Waste 1/2, Vaults of Helia 1/2; core (>=75%) Defy 2/2 x3.0, Stalwart Poro 2/2 x3.0, Hidden Blade 2/2 x3.0, Trusty Ramhound 2/2 x3.0, Frisky Hunter 2/2 x3.0, Mutated Mouser 2/2 x3.0, Discipline 2/2 x2.5, Azir, Sovereign 2/2 x2.5; flex (25-74%) n too small
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 2 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Diana, Lunari 3/3; runes 6 Mind / 6 Chaos 2/3, 8 Chaos / 4 Mind 1/3; battlefields Targon's Peak 3/3, Ravenbloom Conservatory 2/3, Abandoned Hall 2/3, Minefield 1/3, Rockfall Path 1/3; core (>=75%) Stupefy 3/3 x3.0, Ride the Wind 3/3 x3.0, Hwei, Brooding Painter 3/3 x3.0, Moonfall 3/3 x3.0, Gust 3/3 x2.7, Tideturner 3/3 x2.7, Traveling Merchant 3/3 x2.3, Hard Bargain 3/3 x2.0, Star-Crossed 3/3 x2.0, Eclipse 3/3 x1.7, Fizz, Trickster 3/3 x1.3, Smoke Screen 3/3 x1.0; flex (25-74%) Ravenbloom Student 2/3, Sprite Fountain 2/3, Vex, Apathetic 2/3, Rebuke 2/3, Rhasa the Sunderer 1/3, Shadow Order Disciple 1/3, Kennen, Storm of Shuriken 1/3, Flash 1/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=2, 2 event-named):** champion Diana, Lunari 2/2; runes 7 Chaos / 5 Mind 2/2; battlefields Abandoned Hall 2/2, Targon's Peak 1/2, The Arena's Greatest 1/2, Rockfall Path 1/2, Seat of Power 1/2; core (>=75%) Stupefy 2/2 x3.0, Ravenbloom Student 2/2 x3.0, Stacked Deck 2/2 x3.0, Tideturner 2/2 x3.0, Traveling Merchant 2/2 x2.5, Hwei, Brooding Painter 2/2 x2.5, Vex, Apathetic 2/2 x2.5, Moonfall 2/2 x2.5; flex (25-74%) n too small
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 2 lists in pa-sample-2026-09-06)

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
- **Popularity and results (DATA):** 17 published lists since 2026-10-23 (rank 33 of 58, 1.2%); riftbound.gg week-2 tier 3, 0 wins, 1 top cuts; EU Regional Championship 36% over 28 matches; registered as an extra Neeko legend in 1 fetched lists
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion LeBlanc, Fragmented 3/3; runes 8 Order / 4 Mind 3/3; battlefields Windswept Hillock 3/3, Star Spring 3/3, Dusk Rose Lab 2/3, Trifarian War Camp 1/3; core (>=75%) Soaring Scout 3/3 x3.0, Harnessed Dragon 3/3 x3.0, Karthus, Eternal 3/3 x3.0, Baited Hook 3/3 x3.0, Glasc Mixologist 3/3 x3.0, Ruined Rex 3/3 x3.0, Sacrifice 3/3 x3.0, Vi, Peacekeeper 3/3 x2.7, Honest Broker 3/3 x2.3, Rift Herald 3/3 x2.3, Mirror Image 3/3 x1.7, LeBlanc, Fragmented 3/3 x1.0; flex (25-74%) Black Rose Dignitary 2/3, Watchful Sentry 2/3, Thousand-Tailed Watcher 2/3, Deathgrip 2/3, Hidden Blade 2/3, Trifarian Captain 1/3, Shen, Kinkou 1/3, Dune Devourer 1/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=1, 1 event-named):** champion LeBlanc, Fragmented 1/1; runes 8 Order / 4 Mind 1/1; battlefields Aspirant's Climb 1/1, Windswept Hillock 1/1, Star Spring 1/1; core (>=75%) Watchful Sentry 1/1 x3.0, Soaring Scout 1/1 x3.0, Harnessed Dragon 1/1 x3.0, Karthus, Eternal 1/1 x3.0, Baited Hook 1/1 x3.0, Glasc Mixologist 1/1 x3.0, Ruined Rex 1/1 x3.0, Black Rose Dignitary 1/1 x3.0; flex (25-74%) n too small
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 1 lists in pa-sample-2026-09-06)

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
- **Popularity and results (DATA):** 31 published lists since 2026-10-23 (rank 15 of 58, 2.1%); riftbound.gg week-2 tier 3, 0 wins, 0 top cuts; EU Regional Championship 55% over 11 matches
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Kha'Zix, Mutating Horror 3/3; runes 6 Body / 6 Chaos 3/3; battlefields Forbidding Waste 3/3, Star Spring 3/3, Sandswept Tomb 3/3; core (>=75%) Punch First 3/3 x3.0, Irresistible Faefolk 3/3 x3.0, Void Assault 3/3 x3.0, Fizz, Trickster 3/3 x2.3, Shadow Order Disciple 3/3 x2.3, Traveling Merchant 3/3 x2.0, Rengar, Trophy Hunter 3/3 x2.0, Vex, Apathetic 3/3 x2.0, Up from the Deep 3/3 x2.0, Sabotage 3/3 x1.3, Star-Crossed 3/3 x1.3, Rampage 3/3 x1.3; flex (25-74%) Reckless Innovator 2/3, The Good Stuff 2/3, Zed, Without a Sound 2/3, Gust 2/3, Ride the Wind 2/3, Tideturner 2/3, Bloodscent Swarm 2/3, Onslaught 2/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=2, 2 event-named):** champion Kha'Zix, Evolving Hunter 1/2, Kha'Zix, Mutating Horror 1/2; runes 7 Body / 5 Chaos 1/2; battlefields Zaun Warrens 1/2, Forge of the Fluft 1/2, Sunken Temple 1/2, Forbidding Waste 1/2, Star Spring 1/2; core (>=75%) Void Assault 2/2 x3.0, Rengar, Trophy Hunter 2/2 x2.5, Punch First 2/2 x2.0; flex (25-74%) n too small
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 2 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Poppy, Paragon 3/3; runes 6 Body / 6 Order 2/3, 7 Body / 5 Order 1/3; battlefields Sigil of the Storm 2/3, Threshold of the Gray 2/3, Targon's Peak 1/3, Trifarian War Camp 1/3, Packed Amphitheater 1/3; core (>=75%) Poppy, Paragon 3/3 x1.0; flex (25-74%) Catalyst of Aeons 2/3, Dazzling Aurora 2/3, Forge of the Future 2/3, Elder Dragon 2/3, Sacrifice 2/3, Mobilize 2/3, Rampage 2/3, Flurry of Blades 2/3
- **Played lists, pa-sample-2026-09-06 (DATA, n=1, 1 event-named):** champion Poppy, Paragon 1/1; runes 6 Body / 6 Order 1/1; battlefields Aspirant's Climb 1/1, Sigil of the Storm 1/1, Forgotten Monument 1/1; core (>=75%) Confront 1/1 x3.0, Flurry of Blades 1/1 x3.0, Mobilize 1/1 x3.0, Catalyst of Aeons 1/1 x3.0, Sabotage 1/1 x3.0, Dazzling Aurora 1/1 x3.0, Blood Money 1/1 x3.0, Elder Dragon 1/1 x3.0; flex (25-74%) n too small
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 1 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Akali, Deadly Weapon 3/3; runes 7 Fury / 5 Calm 3/3; battlefields Sigil of the Storm 3/3, Void Gate 3/3, Forgotten Monument 3/3; core (>=75%) Falling Star 3/3 x3.0, Defy 3/3 x3.0, Discipline 3/3 x3.0, Zhonya's Hourglass 3/3 x3.0, Stellacorn Herder 3/3 x3.0, Astral Heron 3/3 x3.0, Shuriken Flip 3/3 x3.0, Long Sword 3/3 x2.7, Back Off 3/3 x2.0, Blitzcrank, Impassive 3/3 x1.7, Not So Fast 3/3 x1.0, Mischievous Marai 3/3 x1.0; flex (25-74%) Kai'Sa, Survivor 2/3, Mournful Witness 2/3, Noxus Hopeful 2/3, Block 2/3, Riven, Broken Blade 1/3, Scuttle Crab 1/3, Charm 1/3, Ferrous Forerunner 1/3
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 1 event-named):** champion Renekton, Rage Fueled 3/3; runes 7 Fury / 5 Body 2/3, 8 Fury / 4 Body 1/3; battlefields Black Market 3/3, Protective Sands 2/3, Sigil of the Storm 1/3, The Candlelit Sanctum 1/3, Zaun Warrens 1/3; core (>=75%) Kai'Sa, Survivor 3/3 x3.0, Punch First 3/3 x3.0, Falling Star 3/3 x2.7, Kinkou Initiate 3/3 x2.7, Rengar, Trophy Hunter 3/3 x2.7, Nidalee, Cat Form 3/3 x2.0, Rampage 3/3 x2.0, Renekton, Rage Fueled 3/3 x1.0; flex (25-74%) Noxus Hopeful 2/3, Pit Rookie 2/3, Coalesced Energy 2/3, Irresistible Faefolk 2/3, First Mate 2/3, Inferna 2/3, Sabotage 2/3, Long Sword 2/3
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (1 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Zed, Without a Sound 2/3, Zed, From the Shadows 1/3; runes 7 Fury / 5 Chaos 2/3, 7 Chaos / 5 Fury 1/3; battlefields Zaun Warrens 3/3, Minefield 2/3, Forbidding Waste 2/3, Sigil of the Storm 1/3, Rockfall Path 1/3; core (>=75%) Noxus Hopeful 3/3 x3.0, Runeblade Anvil 3/3 x3.0, Bedeviling Stranger 3/3 x2.0, Tideturner 3/3 x1.3, Switcheroo 3/3 x1.0; flex (25-74%) Pack of Wonders 2/3, Traveling Merchant 2/3, Rhasa the Sunderer 2/3, Detonate 2/3, Battering Ram 2/3, Treasure Trove 2/3, Last Rites 2/3, Ride the Wind 2/3
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Nasus, Guardian of Knowledge 3/3; runes 6 Calm / 6 Mind 2/3, 7 Mind / 5 Calm 1/3; battlefields Ruined Monastery 3/3, Rockfall Path 3/3, Sigil of the Storm 2/3, Frozen Fortress 1/3; core (>=75%) Defy 3/3 x3.0, Discipline 3/3 x3.0, Stupefy 3/3 x3.0, Ravenbloom Student 3/3 x3.0, Thousand-Tailed Watcher 3/3 x3.0, Bellows Breath 3/3 x3.0, Scuttle Crab 3/3 x3.0, Find Your Center 3/3 x2.7, Lonely Poro 3/3 x2.3, Sprite Burst 3/3 x1.0, Tomb-Raider Barbara 3/3 x1.0, Nasus, Guardian of Knowledge 3/3 x1.0; flex (25-74%) Wages of Pain 2/3, Astral Heron 2/3, Back Off 2/3, Sprite Queen 2/3, Not So Fast 2/3, Life from Stone 1/3, The Empyrean 1/3, Temporal Breach 1/3
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 2 event-named):** champion Shen, Kinkou 3/3; runes 6 Calm / 6 Order 1/3, 7 Order / 5 Calm 1/3, 7 Calm / 5 Order 1/3; battlefields Kinkou Temple 3/3, Startipped Peak 1/3, Trifarian War Camp 1/3, Bandle Scouts' Academy 1/3, Packed Amphitheater 1/3; core (>=75%) Defy 3/3 x3.0, Discipline 3/3 x3.0, Charm 3/3 x2.3, Vi, Peacekeeper 3/3 x2.3, Hidden Blade 3/3 x2.0, Emperor's Divide 3/3 x1.3, Shen, Kinkou 3/3 x1.0; flex (25-74%) Mournful Witness 2/3, Stellacorn Herder 2/3, Scuttle Crab 2/3, Blitzcrank, Impassive 2/3, Kennen, Keeper of Balance 2/3, Salvage 2/3, Disciple of Shen 2/3, Stalwart Poro 1/3
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (2 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Jayce, Brilliant Inventor 3/3; runes 7 Body / 5 Mind 3/3; battlefields Sigil of the Storm 3/3, Forgotten Monument 3/3, Dragon Roost 2/3, The Papertree 1/3; core (>=75%) Catalyst of Aeons 3/3 x3.0, Dazzling Aurora 3/3 x3.0, Bellows Breath 3/3 x3.0, Elder Dragon 3/3 x3.0, Dredge Up 3/3 x3.0, Clairvoyance 3/3 x3.0, Platewyrm Egg 3/3 x3.0, Garbage Grabber 3/3 x2.3, Flurry of Blades 3/3 x2.3, Gutter Palace 3/3 x2.0, Sabotage 3/3 x1.7, Progress Day 3/3 x1.0; flex (25-74%) Mobilize 2/3, Sprite Burst 2/3, Rocket Barrage 2/3, Repulse 2/3, Temporal Breach 2/3, Wages of Pain 1/3, Deadly Flourish 1/3, Avalanche 1/3
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Mel, Defiant Soul 2/3, Mel, Newly Awakened 1/3; runes 7 Mind / 5 Chaos 1/3, 8 Mind / 4 Chaos 1/3, 6 Mind / 6 Chaos 1/3; battlefields Ravenbloom Conservatory 2/3, Frozen Fortress 2/3, Threshold of the Gray 2/3, Targon's Peak 1/3, Rockfall Path 1/3; core (>=75%) Stupefy 3/3 x3.0, Ravenbloom Student 3/3 x3.0, Traveling Merchant 3/3 x3.0, Dredge Up 3/3 x3.0, Applied Researchers 3/3 x3.0, Rebuttal 3/3 x3.0, Time Warp 3/3 x2.7, Shock Blast 3/3 x2.7, Star-Crossed 3/3 x1.3, Smoke Screen 3/3 x1.0, Switcheroo 3/3 x1.0; flex (25-74%) Up from the Deep 2/3, Singularity 2/3, Thousand-Tailed Watcher 2/3, Vex, Apathetic 2/3, Gust 2/3, Mel, Defiant Soul 2/3, Tideturner 1/3, Hwei, Brooding Painter 1/3
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=1, 1 event-named):** champion Ambessa, The Wolf 1/1; runes 8 Body / 4 Order 1/1; battlefields Star Spring 1/1, Risen Altar 1/1, Sandswept Tomb 1/1; core (>=75%) Punch First 1/1 x3.0, Irresistible Faefolk 1/1 x3.0, Vi, Peacekeeper 1/1 x3.0, Legion Marauder 1/1 x3.0, Rampage 1/1 x3.0, First Mate 1/1 x2.0, Lucian, Merciless 1/1 x2.0, Rengar, Trophy Hunter 1/1 x2.0, Tactical Retreat 1/1 x2.0, Guttural Roar 1/1 x2.0, Onslaught 1/1 x2.0, Ambessa, The Wolf 1/1 x2.0; flex (25-74%) n too small
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: insufficient** (1 complete lists in pa-fetch-2026-11-11 (1 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

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
- **Played lists, pa-fetch-2026-11-11 (DATA, n=3, 3 event-named):** champion Kennen, Storm of Shuriken 3/3; runes 9 Chaos / 3 Order 2/3, 10 Chaos / 2 Order 1/3; battlefields Zaun Warrens 3/3, Minefield 3/3, Ruined Monastery 1/3, Sandswept Tomb 1/3, Shadow Temple 1/3; core (>=75%) Nocturne, Horrifying 3/3 x3.0, Rhasa the Sunderer 3/3 x3.0, Seal of Discord 3/3 x3.0, Trifarian Captain 3/3 x3.0, Lightning Rush 3/3 x3.0, Ride the Wind 3/3 x2.7, Traveling Merchant 3/3 x2.7, Gust 3/3 x2.0, Last Rites 3/3 x2.0, Switcheroo 3/3 x1.7, Fizz, Trickster 3/3 x1.3, Star-Crossed 3/3 x1.3; flex (25-74%) Reckless Innovator 2/3, Ezreal, Prodigy 2/3, Tideturner 2/3, Bedeviling Stranger 2/3, Flash 2/3, An Offer You Can't Refuse 2/3, Tornado Warrior 1/3, Rebuke 1/3
- **Played lists, pa-sample-2026-09-06 (DATA):** n=0
- **Data confidence: thin** (3 complete lists in pa-fetch-2026-11-11 (3 with an event marker in the name); 0 lists in pa-sample-2026-09-06)

## 10. Files and how to re-run

All under `docs/research/analysis/legend-profiles/`:

| File | Role |
|---|---|
| `cardpool.py` | Loads `cards.json`, overlays a gallery snapshot (new sets, changed text, alias printing codes) |
| `build_legend_profiles.py` | Text half: `data/legend-profiles.text.json` |
| `fetch_pa_decks.py` | Network: per-legend sample of Piltover Archive deck pages into `data/pa-decks.jsonl` (resumable, round-robin) |
| `build_legend_meta.py` | Data half: `data/legend-profiles.meta.json` |
| `report.py`, `assemble_doc.py`, `doc_template.md` | Render this document |
| `run_all.sh` | Rebuild both halves and the fragments without network |
| `data/bans-known.json` | Ban flags used here (source: `Untitled/config/current-constructed-rules.json` plus the 2026-09-18 announcement) |
| `data/results-riftboundgg-2026-11.json` | Hand-transcribed results |
| `raw/gallery-2026-11-11.json` | Official gallery items as fetched (input) |
| `raw/riftcodex-p*.json` | Riftcodex pages as fetched (only used to show it is stale) |

```
cd docs/research/analysis/legend-profiles
python3 fetch_pa_decks.py --list ../raw/pa-list.jsonl --per-legend 6 --out data/pa-decks.jsonl   # optional, network
sh run_all.sh
python3 assemble_doc.py --out ../../legend-profiles.md
```

## 11. Open items

- UNCONFIRMED: domains of the 11 RAD cards whose gallery record has no domain list. Until fixed they are outside every pool.
- UNCONFIRMED: the parse of the 9 RAD legends has no engine script to check against. They were read by eye once (section 2.1 table against section 9).
- UNCONFIRMED: placements written in list names ("1st", "Top 8", "Best of") are self-reported by uploaders. No structured tournament source was reachable.
- UNCONFIRMED: which Master Yi legend the riftbound.gg "Master Yi" lines refer to.
- UNCONFIRMED: whether the `pa-list` default order biases the popularity counts (only the first 144 of about 417 pages were crawled).
- Not done: clustering into archetypes beyond the Chosen Champion split; matchup data; side deck advice (other research tasks).
- Not done: a port of the generator to the app's language. The Python scripts are the reference behaviour; the regular expressions and constants are the specification.
