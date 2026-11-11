# Riftbound deck theory from data: role bands, rune and consistency math, synergy axes, multiplayer valuation, game-plan templates, and 0-100 scores

Research date: 2026-11-11. All web sources below were fetched on 2026-11-11 unless a line says otherwise. An independent verification pass was run later the same day; its corrections are marked **[V]** inline and listed in "Verification log (2026-11-11)" at the end.

Labels used on every claim:
- **[F]** FACT from a primary source (playriftbound.com, the official PDFs, the official card gallery). Rule numbers are quoted.
- **[D]** DATA measured here from a named dataset, with n.
- **[H]** HEURISTIC: our own judgement, derived from [F] and [D] but not confirmed by either.
- **[C]** COMMUNITY source (not Riot). Useful, not authoritative.
- **UNCONFIRMED** means no primary source was found for it.

Rule citations: "CR" is the Core Rules PDF "Last Updated: 2026-10-09" (https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/5c7946f7c3b8c6e0faff85ab6dadc6d2e721ea94.pdf). "TR" is the Tournament Rules PDF "Last Updated October 9, 2026" (https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/861752822d217edf37d9febaeaf77a7d924c1bb6.pdf). Both are linked from the Rules Hub (https://playriftbound.com/en-us/rules-hub/).

Everything in sections 2-4 can be regenerated with the scripts in `docs/research/analysis/` (section 9).

## 0. Not confirmed, stale, or weak (read first)

1. **Local data is one set behind.** `~/github_repositories/GameLab/data/cards/cards.json` has 931 cards and no Radiance (RAD). The official gallery today has 1,408 printings, 1,237 base codes and 1,103 distinct names, including 195 RAD codes [F: https://playriftbound.com/en-us/card-gallery/]. [V] A re-fetch later the same day returned 1,408 printings, 1,236 base codes and 1,103 names: the printing UNL-224 Mystic Poro was served as a second copy of OGN-171 Mystic Poro, and the item order differed. The gallery payload is not stable between requests, so the card sync must pin a snapshot and diff it. `GameLab/data/rules/core-rules.md` is the 2026-07-16 edition; the current edition is 2026-10-09 and **its rule numbers moved** (deck construction 103.2 → 103.3, runes 103.3 → 103.4, modes 485-489 → 487-491, Recycle 416 → 417, Channel 430 → 431, Burn Out 431 → 432, Scoring 467 → 469). Do not cite the local file's numbers.
2. **Ban list in `Untitled/config/current-constructed-rules.json` is stale.** It stops at the July update. The Rules Hub ("Last updated: September 18, 2026") adds *Ekko, Recurrent* and *Stacked Deck*; see 1.1.
3. **The deck sample is not a random sample of the metagame.** It is 406 lists that players uploaded to Piltover Archive with a tournament-looking name. 153 of them are "Best of <legend>" lists, which gives every legend roughly one list per event and flattens meta share. [V: corrected] Riot's own field breakdown for RC Europe shows how far the sample is from the field: Riven was 126 lists, 40.9% of Day 1 and 49.0% of Day 2; Kai'Sa 16.9% and 17.7%; Kennen 14.6% and 12.5%; the Top 8 was four Riven, three Kennen and one Kai'Sa, and Kennen won [F: https://playriftbound.com/en-us/news/organizedplay/best-ofs-for-the-european-championship, published 2026-11-11]. The first pass quoted a community search snippet (riftdecks.com, page not readable) saying Kai'Sa was about 40% of that field; the official table contradicts it and the line is withdrawn. In this sample Riven is 22 of 406 lists (5%); in the Stuttgart-tagged subset Riven is 7 of 67 and Kai'Sa 12 of 67. 42 of those 67 lists were created before the event began and 58 carry no placement, so they are lists named after the event, not the lists played in it. Bands are therefore "what a tournament-quality list of this shape looks like", not "what the field looks like".
4. **Placement is parsed from the deck title** with a regex (2.1). Only 106 lists carry a win or top-8 claim. Nothing verifies those claims against official standings.
5. **Uploaded lists can be edited after the event.** We keep the list as it was on 2026-11-11.
6. **Archetype names are ours.** The data produced four composition clusters; none of them is "combo". No Riot source defines archetypes.
7. **Exhausted runes can still be recycled for power.** This follows from CR 164.2.a/b (the recycle ability has no exhaust cost) but no rule sentence says it outright. The rune model in 3.3 depends on it. UNCONFIRMED as an explicit statement.
8. **Start-of-game rules are being playtested.** Riot is testing three go-second bonuses outside premier events and answers its own question "Is this a rules update?" with "No" [V: the first pass put a paraphrase in quotation marks]. The same article says going first currently wins more often than Riot wants [F: https://playriftbound.com/en-us/news/organizedplay/testing-start-of-game-rules, published 2026-10-15]. Section 3 uses the current CR only.
9. **Bomb token text** comes from CR 187.12, not from the gallery (the gallery has no Bomb row).
10. **Gallery typing errors.** 15 gallery rows have an empty card type: 13 RAD cards plus the two UNL helper rows Buff (UNL-T04) and XP Tracker (UNL-T08) [V: was "15 RAD rows"]. Four RAD `[Deploy]` gear (Bushwhack Trap, Dockside Lock-Up, Hunting Blind, Portable Portal) are typed "unit" with no Might. `build-cards.mjs` repairs these by rule (CR 830.1.a: Deploy is present on Gear) and flags them (`inferType`, `typeFixed`). Five rows remain typed "unit" with no Might (Consult the Heavens, Ephemeral Ward, Invigorating Bloom, Runeblade Anvil, Supernova). Deck analysis uses the type printed in the Piltover Archive deck record when a card appears in a list.
    A second group was found while validating section 4 and is **not** repaired in `cards-2026-11-11.json`: seven RAD rows are typed "spell" although five print a Might value (Battlefield Armorer RAD-130, Coalesced Energy RAD-016, Demacian Illuminators RAD-131, Overloaded Traveler RAD-072, Siren of the Shallows RAD-097) and two have gear-style `[Exhaust]:` abilities and no Might (Resplendent Rostrum RAD-046, Scrutinizing Scope RAD-064) [D: gallery fetched 2026-11-11]. Their true types are UNCONFIRMED here (no second primary source was read). Pool-level role and axis counts treat them as spells; deck-level counts are unaffected when the Piltover Archive record carries a type. The card sync must re-check these codes.
11. **Who may act in another pair's showdown in multiplayer** is now read from the rules (5.1): Focus passes to "the next Player in Turn Order" and the showdown ends when "all Players have passed once in sequence" (CR 347.1.b, 347.2.a, 347.2.b, 348). No rule limits Focus to the attacker and defender, but no rule sentence says "players outside the combat may play cards" either; the multipliers in 5.2 assume they may.
12. Synergy-axis regexes (section 4) were hand-checked on two 40-card samples (section 4, "Validation"). The structural tests (type, cost, Might) were not sampled because they cannot misread text; they are the weakest signals and are marked as such.
13. Multiplayer strategy has **no data** here: all 406 lists are 1v1 lists.
14. [V] **A ban announcement is pending.** Riot's article of 2026-11-11 says the game team is considering bans, that the decision will be published on Friday 2026-11-13, and that the bans are targeted to take effect on 2026-11-23 (1.1). Which cards are affected is UNCONFIRMED. Every band, most-played list and matchup plan below describes the format before that change.
15. [V] **Source B is older than its label** (2.1). 55 of the 406 lists come from a local sample that the analysis dates 2026-09-06 and files under "VEN-preban", but they are pre-Vendetta lists, mostly from June 2026 Regional Qualifiers, with 8-card sideboards. They are 14% of the sample and 57% of the "VEN-preban" era.
16. [V] **The hand-validation error rates are UNCONFIRMED.** The false-positive and false-negative counts in 2.2 and 4 are the first pass's own reading of sampled cards. No script reproduces them, and this pass did not re-read the samples.

## 1. Facts the model must encode

### 1.1 Format state on 2026-11-11

- [F] Sets in the official gallery: OGN (Origins), OGS (Proving Grounds), SFD (Spiritforged), UNL (Unleashed), VEN (Vendetta), RAD (Radiance). Radiance released 2026-10-23, Pre-Rifts 2026-10-16 to 22 (https://playriftbound.com/en-us/news/announcements/the-radiance-overview/, "Updated October 16, 2026").
- [F] "All sets currently produced for Riftbound are legal"; rotation is intended "starting in 2028" (Rules Hub, "Constructed Format Legality, Last updated: September 18, 2026").
- [F] Banned in sanctioned Constructed (Rules Hub): cards *Called Shot; Ekko, Recurrent; Draven, Vanquisher; Fight or Flight; Scrapheap; Stealthy Pursuer; Stacked Deck*. Battlefields *The Arena's Greatest; Aspirant's Climb; Dreaming Tree; Obelisk of Power; Reaver's Row*.
- [F] 2v2 Constructed uses the same list plus the legend *Master Yi, Wuju Bladesman* (Rules Hub, "2v2 Constructed Legality").
- [F] Ekko, Recurrent and Stacked Deck were banned effective 2026-09-18 (https://playriftbound.com/en-us/news/announcements/september-ban-list-updates-effective-september-18-2026).
- [F] Radiance adds keywords Deploy (CR 830), Disarm (CR 831), Show Off (CR 832), Equipment that can become units, and Bomb gear tokens (CR 187.12; overview article above). Radiance has nine new legends in the gallery: Evelynn (body/chaos), Ekko (fury/mind), Jarvan IV (body/order), Ziggs (fury/chaos), Mordekaiser (fury/order), Orianna (calm/mind), K'Sante (calm/body), Seraphine (mind/order), Riven (calm/chaos). The gallery now lists 58 distinct legend names.
- [F] RC Europe took place in Stuttgart; the preview article dated 2026-10-27 calls it "next month" and lists hall hours from Friday to Sunday (https://playriftbound.com/en-us/news/organizedplay/all-eyes-on-rc-europe). [V] Riot's follow-up of 2026-11-11 says it "took place last weekend", which puts it on the weekend of November 6-8, 2026 (https://playriftbound.com/en-us/news/organizedplay/best-ofs-for-the-european-championship). The exact days are inferred from those two articles; the gamertagmythras.com page cited in 5.3 does not state them.
- [F] [V: corrected] The official news index lists three November items: "Riftbound World Showcase" (2026-11-05), a product-drawing article (2026-11-06) and "Best Ofs for the European Championship" (2026-11-11 17:00 UTC, published after the first pass, which counted two). The rules, ban and set articles in force are still the October and September ones cited here (https://playriftbound.com/en-us/news/).
- [F] [V] **A ban change is pending.** The 2026-11-11 article says the game team is considering bans, that any decision will be shared on Friday (2026-11-13), and that the bans are targeted to take effect on 2026-11-23. The ban list above is valid until then; re-read the Rules Hub after the announcement. The affected cards are UNCONFIRMED (nothing is published).

### 1.2 Deck construction

- [F] A deck is 1 Champion Legend, a Main Deck of at least 40 cards including the Chosen Champion, a 12-card Rune Deck, and battlefields set by the mode (CR 103, 103.2, 103.3, 103.4, 103.5).
- [F] In competition the Main Deck is **exactly 40** (TR 601.1.b).
- [F] Domain identity comes from the legend; a multi-domain card needs all of its domains in the identity; a card with no domain fits any deck (CR 103.2.b.1-103.2.b.5).
- [F] Up to 3 copies of a named card, the Chosen Champion included (CR 103.3.b, 103.3.b.1). Names include the subtitle (CR 132.4), so *Yasuo, Remorseful* and *Yasuo, Windrider* are different cards (CR 103.3.b.2).
- [F] The Chosen Champion must be a champion unit whose champion tag matches the legend (CR 103.3.a.2). It starts in the Champion Zone (CR 112) and is played from there (CR 108.3.d).
- [F] At most 3 Signature cards in total, all with the legend's champion tag (CR 103.3.d.1, 103.3.d.2).
- [F] Rune Deck: exactly 12 runes of the legend's domains (CR 103.4.a, 103.4.a.1, 161.2.a).
- [F] Battlefields: no duplicate names (CR 103.5.c). Every sanctioned mode asks for three (CR 487.4.a, 489.4.a, 490.4.a, 491.4.a).
- [F] Sideboard: 10 or fewer cards, main-deck card types only, copy limits apply across main + side (TR 601.1.c.1-601.1.c.3). Swaps are 1 for 1 (TR 403.4). The Chosen Champion may be changed while sideboarding (TR 403.4.a, 601.1.c.4). Runes, legend and battlefields may not be changed (TR 403.4.b). No sideboarding before game 1 (TR 403.5). Most matches are best of 3 (TR 404.2).
- [F] [V: corrected, was UNCONFIRMED] The sideboard limit rose from "8 or fewer" to "10 or fewer" in the July 2026 Tournament Rules update (edition dated 7/16/2026, effective 2026-07-24, rule 601.1.c.1) [F: https://playriftbound.com/en-us/news/announcements/july-2026-tournament-rules-update-changelog/; the 7/16/2026 TR PDF already reads "10 or fewer"].
- [D] Sideboard size in the sample: 53 of the 97 lists labelled "VEN-preban" have exactly 8, and 240 of 254 RAD-era lists have 10. [V] This is a source effect, not a September change: 52 of those 53 eight-card sideboards are source B lists that predate the July update (2.1). Of the 351 valid lists fetched from Piltover Archive, 334 have 10.

### 1.3 Setup, turn and resources

- [F] Opening hand: "Players each draw 4" (CR 116).
- [F] Mulligan: set aside up to two cards, draw that many, then Recycle the set-aside cards (CR 117.1-117.3). Recycle puts cards on the **bottom** of the deck, in random order if more than one (CR 417.1, 417.5). There is no shuffle, so mulliganed cards are gone until the deck cycles.
- [F] Each turn: ready everything, score holds, **channel 2 runes**, **draw 1** (CR 315.1.b, 315.2.b.2, 315.3.b, 315.4.b).
- [F] 1v1: the player going second channels one extra rune in their first Channel Phase (CR 487.7, 488.7). Nobody skips a draw in 1v1.
- [F] Skirmish, War and 2v2: the first player skips their first draw and the last player channels one extra rune (CR 489.7, 490.7, 491.7).
- [F] A basic rune has two abilities: exhaust to add 1 Energy, and "Recycle this: Add [C]", one Power of its domain (CR 164.2.a, 164.2.b, 164.2.b.1). Energy has no domain (CR 163.1.a). A recycled rune returns to the Rune Deck (CR 161.2.b, 417.1.b). The rune pool empties at the start of each Main Phase and at end of turn (CR 167).
- [F] Channelling takes runes from the top of the shuffled Rune Deck (CR 431.1, 103.4.b).
- [F] Drawing from an empty Main Deck is a Burn Out: recycle your trash into the deck, **choose an opponent to gain 1 point**, then finish the draw (CR 432.2.a-432.2.d).
- [F] Speed keywords: Action lets a card be played in showdowns, including off-turn (CR 806.1.b). Reaction includes Action's permissions (CR 813.1.b). Ambush lets a unit be played as a Reaction to a battlefield where you control units (CR 822.1.b). Hidden lets a card be hidden face down at a battlefield you control for [A] and played later (CR 811.1.b).

### 1.4 Scoring

- [F] Victory Score is 8 by default (CR 194.3); 2v2 uses 11 (CR 491.3).
- [F] You score by Conquer (gain control of a battlefield you have not scored this turn) or Hold (keep control into your Beginning Phase), once per battlefield per turn (CR 471.1, 471.2, 472).
- [F] The Final Point: a point from **Conquer** when you are 1 short only counts if you scored **every** battlefield this turn; otherwise you draw a card instead (CR 473.1.b, 473.1.b.1). Points from other sources are not restricted (CR 473.1.a.1).
- [F] You win when, in a cleanup, you are at or above the Victory Score and ahead of every opponent (CR 474).

### 1.5 Riot's own deck-building advice (primary, but advice, not rules)

[F: "Deckbuilding Primer", Dave Guskin, 2025-07-28, https://playriftbound.com/en-us/news/rules-and-releases/deckbuilding-primer]

- Reserve 3 slots for the signature card unless you have a reason not to.
- Stay at 40 cards.
- "Play more of your champion": it is "generally a good idea to play more copies of your Chosen Champion".
- "Play 9+ small units" (2-4 cost) so you reliably have one by turn one or two.
- "Play 6+ interactive spells."
- "When in doubt, play more units."
- Runes: start 6-6; skew to "something like an 8-4 split" if one domain holds the multi-power cards.
- Battlefields: pick the ones that help you most, hurt you most in enemy hands, or are slightly better for you than for them.

Section 2.10 tests each of these against the lists.

## 2. Data

### 2.1 Dataset and method

Sources:
- **A. Piltover Archive, fetched 2026-11-11.** `robots.txt` allows `/decks?page=N` and `/decks/view/<id>` and disallows `/api/` and filtered listings; we used only the allowed paths. We read listing pages 1-144 (3,456 decks, default "trending" order), kept the 463 whose name matched an event/placement regex, dropped precon and "Champion Deck" names and decks last edited before 2026-08-01, and fetched the remaining 361 deck pages. Requests were serial, 1.2-1.3 s apart, with the User-Agent `Mozilla/5.0 (compatible; deck-research/1.0)` and no personal data. Scripts: `crawl-list.mjs`, `select-tournament.mjs`, `fetch-decks.mjs`.
- **B. Local sample** `~/github_repositories/GameLab/data/decks/samples/piltover-archive-2026-09-06.json` (59 lists in the file; its source line says "60 most recent"; collected from the same site on 2026-09-06). [V] The collection date is not the deck date. `analyze.mjs` stamps every B list with 2026-09-06, but 57 of the 59 contain no Vendetta card, the 21 that also appear in the 2026-11-11 listing crawl were created between 2025-11 and 2026-06, and the four live pages checked (three Hartford RQ lists, one Vancouver RQ list) show June 2026 creation and edit dates and 8-card sideboards. Treat source B as pre-Vendetta lists built under the old 8-card sideboard rule. Lists already present in A are skipped. Rows where the legend or the runes had been imported into `main` are repaired by card type.
- **Cards:** the official gallery page (one request, `__NEXT_DATA__`), reduced to one row per name by `build-cards.mjs`. Every card in every list matched a gallery name (0 misses).

Counts [D]:
- 419 lists loaded, **406 valid** (40 main including the Chosen Champion, 12 runes, 3 battlefields, legend known). 351 from A, 55 from B.
- Era: 254 "RAD" (contains a RAD card or edited on or after 2026-10-16), 55 "VEN-postban" (edited 2026-09-18 to 10-15), 97 "VEN-preban". 38 lists contain a card that is banned today; 37 of them are pre-ban, none is RAD-era. [V] "VEN-preban" is a misleading label: 55 of those 97 are source B lists, which are older than Vendetta. Read it as "before the 2026-09-18 bans". The era comes from the last edit date, not from the event date.
- Placement parsed from the title: 36 win, 70 top 8 (rank 2-8 or "top 4/8"), 22 top 64, 153 "best of <legend>", 125 event name only. So 281 lists carry some placement signal and 106 carry a win/top-8 claim.
- Events named: Stuttgart (RC Europe) 67, Orlando 25K 47, Sacramento 42, Hartford RQ 24, Singapore RQ 19, Los Angeles RQ 17, Utrecht RQ 14, Melbourne 10, Vancouver RQ 8, Chengdu 5, Sydney RQ 4, other or unspecified 149. [V] An event name in a title does not mean the list was played there: 42 of the 67 Stuttgart-tagged lists were created before 2026-11-06 and 58 of the 67 carry no placement.
- 55 legend champion tags appear. Per-legend rows below need n ≥ 5.

Counting convention: all counts are **copies in the 40**, including the Champion Zone copy.

### 2.2 Role classifier

Rules live in `analysis/roles.mjs`. Reminder text in parentheses is stripped first, so reminder wording never assigns a role. A card can hold several roles. The exact rules:

```js
{{INCLUDE:out/12-role-rules.txt}}
```

Other rules in the same file:
- `topend`: a unit with Energy ≥ 6 or Might ≥ 6.
- `speed`: for spells, `reaction` if `[Reaction]` is among the leading keywords, `action` if `[Action]` is, else `slow`; units with `[Ambush]` count as `reaction`, cards with `[Hidden]` as `hidden`.
- `interaction` (used in bands) = any of the `removal` bucket, `counterspell`, `combat_trick`, `debuff`.

Pool counts [D: 953 named main-deck cards in the gallery]: draw 124, tempo_ready 121, ramp 73, movement 93, removal_damage 87, combat_trick 65, protection 61, token_maker 51, score_trigger 49, recursion 44, removal_kill 40, selection 39, buff 36, debuff 34, stun 28, discard_outlet 23, hate_gear 18, sweeper 17, removal_bounce 14, points 14, counterspell 12, hand_attack 8, hate_trash 2, point_denial 2, topend 146. Spells by speed: 70 reaction, 89 action, 113 slow.

Validation by hand [D]. Each round printed 40 cards with their assigned roles (`validate-roles.mjs N seed`), was read card by card, and the errors found were fixed before the next round:

| round | sample | labels | false positives | false negatives | what was fixed afterwards |
|---|---|---|---|---|---|
| 1 | 40 random, seed 20261111 | ~62 | 7 | 4 | gear kills split into `hate_gear`; self cost reduction no longer `ramp`; "recycle N from your trash:" is a cost, not `recursion`; opponent draws excluded; `point_denial` split from `points` |
| 2 | 40 random, seed 777 | ~60 | 2 | 3 | blink ("ignoring its cost") no longer `ramp`; "Kill an enemy Chaos unit", control change and granted `[Temporary]` added to `removal_kill` |
| 3 | 40 random, seed 4242 | ~58 | 2 | 1 | `protection` tightened; spell speed read after reminder stripping |
| 4 | 45 most-played cards in the lists | ~70 | 6 | 0 | Switcheroo is a trick, not movement; "can't move it" excluded; "each of up to 2" is not a sweeper; reveal-only is not hand attack; blink is not removal |
| 5 | most-played cards ranked 46-90 | ~60 | 0 | 4 | extra turn added to `points`; edict and conditional kills added; "in your trash ... play it" added to `recursion` |

[V] UNCONFIRMED: the counts in this table are a hand reading that no script reproduces. Read this as: the last unbiased random round (3) had about 5% label errors, and the cards that matter most for the bands (rounds 4 and 5) were corrected individually. Rounds 4 and 5 were not re-sampled after their fixes.

Known remaining gaps [H]: conditional or pronoun-only removal ("if it is stunned, kill it") is caught only for a few phrasings; `ramp` includes one-shot Gold tokens; `tempo_ready` mixes "enters ready" units with "ready another unit" effects; cards whose value is a static combat bonus (Mask of Foresight) have no role. A sixth check (the section 4 samples) found that `buff` and `combat_trick` matched "spend a buff as an additional cost" (Call to Glory, Wallop, Kraken Hunter) because of a missing word boundary; this was fixed and the analysis re-run. Only the `x_buff` means moved (Call to Glory is in 19 lists); no band, cluster or centroid changed.

### 2.3 Archetypes found in the data

Method [D]: k-means on 12 z-scored composition features, k = 3, 4, 5, 30 seeded restarts (`analyze.mjs`). Inertia 3078 / 2735 / 2513. k = 4 is used because its clusters have a plain reading and k = 5 only splits one of them.

Centroids in raw units (copies per deck), with the z-scale needed to classify a new deck by nearest centroid:

{{INCLUDE:out/11-centroids.md}}

Names [H] and typical legends [D]:

| cluster | n | how it reads | legends with the most lists |
|---|---|---|---|
| **unit-aggro** | 132 | 24 units, few draw spells, most tempo effects | Kha'Zix 15, Rek'Sai 15, Evelynn 12, Rengar 10, Mordekaiser 8, Vi 7, Sett 6, Viktor 6, Pyke 6, Darius 5 |
| **spell-tempo** | 139 | 17 units, 8-13 reaction spells, 3-4 counterspells, most combat tricks | Riven 22, Master Yi 14, Lillia 14, Irelia 13, Akali 12, Vex 12, Diana 10, Ivern 7, Orianna 6, K'Sante 6 |
| **gear-engine** | 69 | about 11 gear, 14 units, cheapest curve | Kennen 16, Ornn 8, Viktor 7, Azir 7, Ziggs 5, Ekko 5, Orianna 4, Ezreal 4 |
| **big-control** | 66 | about eleven 6+ Energy cards, most removal, 26-31 power pips | Kai'Sa 23, LeBlanc 10, Jayce 9, Jhin 8, Poppy 4 |

- [D] No "combo" cluster appeared. The Lux/Ekko infinite named in the September ban article is gone from the legal pool.
- [D] A four-line rule (`e6p ≥ 6 or avgEnergy ≥ 3.4` → big-control; `gear ≥ 8` → gear-engine; `units ≥ 22` → unit-aggro; else spell-tempo) agrees with the clusters on only 72% of lists. **Use nearest centroid in the app**, not the rule.
- [D] Win/top-8 claims by cluster: spell-tempo 44 of 139, unit-aggro 31 of 132, big-control 17 of 66, gear-engine 14 of 69. Because of caveat 0.3 this says nothing reliable about which archetype is strongest.

### 2.4 Distributions

Metric names: `e01` … `e6p` = cards with Energy 0-1, 2, 3, 4, 5, 6+; `units_le2`/`units_le3` = units costing ≤ 2 / ≤ 3; `units_e2to4` = units costing 2-4 (the primer's "small units"); `powerCards` = cards with a printed Power cost; `power2Cards` = cards with Power ≥ 2; `powerPips` = total printed Power; `runeMajor` = runes in the larger domain; `x3`/`x2`/`x1` = number of distinct names played as 3 / 2 / 1 copies; `r_*` = bucket counts and `x_*` = single-role counts from 2.2; `sp_reaction`/`sp_action`/`sp_slow` = spells by speed; `hiddenCards` = cards with `[Hidden]`.

Each cell is **p25–p75 (p10–p90)** in copies per deck [D: n in the header row]:

{{INCLUDE:out/10-bands.md}}

Things worth noticing [D]:
- The curve is low. Cards costing ≤ 2 Energy: p10/p25/p50/p75/p90 = 16/19/22/25/28 of 40. Energy 3: 3/5/7/10/13. Energy 4-5: 3/4/6/8/10. Energy 6+: 0/1/3/4/10.
- 87% of lists run no sweeper; 44% run no counterspell; 23% run no kill or damage removal at all and rely on bounce, stun and tricks.
- Only 15% of lists run a card that scores a point directly or takes an extra turn. Winning is done on battlefields.
- Reaction-speed spells average 6.2 copies, Action 4.9, slow 5.0.
- The "placed win/top 8" column is close to the "ALL" column on every row, so the bands do not depend on trusting titles.
- The RAD-era column is slightly heavier (median average Energy 2.83 against 2.65 for the lists labelled pre-ban; median gear 5 against 3). [V] 55 of the 97 pre-ban lists are pre-Vendetta lists from source B, so this compares Radiance-era lists with a mix of two older card pools, not with Vendetta alone.

### 2.5 Per legend and per domain pair

Cells are p25-p50-p75; `avgEnergy` is the median [D]. Legends with n ≥ 5 only.

{{INCLUDE:out/03-groups-legend-pair.md}}

### 2.6 Chosen champion, champion units, signatures, copies

[D: n = 406]
- **Copies of the Chosen Champion** (zone copy included): 1 copy in 379 lists, 2 in 18, 3 in 9. Only 7% run a second copy.
- Chosen Champion Energy cost: 2 → 15 lists, 3 → 117, 4 → 156, 5 → 87, 6 → 15, 7+ → 16. 67% cost 3 or 4.
- Other champion units (any champion-supertype unit that is not the chosen one): p25–p75 = 1–7, by archetype 6–10 (unit-aggro), 2–5 (spell-tempo), 0–4 (gear-engine), 0–3 (big-control).
- Signature cards: 0 in 163 lists, 1 in 34, 2 in 34, 3 in 175. So 43% play the full three and 40% play none.
- Distinct names: p25–p75 = 17–20. Three-ofs: 7–9 names (21–27 of the 40 cards). Two-ofs: 4–7 names. One-ofs: 3–7 names.
- Most played main-deck cards (share of lists): Defy 37%, Discipline 35%, Star-Crossed 30%, Noxus Hopeful 26%, Stupefy 26%, Falling Star 25%, Gust 24%, Thousand-Tailed Watcher 24%, Switcheroo 24%, Tideturner 23%, Vex, Apathetic 22%, Punch First 22%, Scuttle Crab 21%, Charm 20%.

Per legend: archetype mix, chosen champion, rune split and battlefields.

{{INCLUDE:out/04-legends-detail.md}}

### 2.7 Runes against the deck's power costs

{{INCLUDE:out/05-runes.md}}

Reading [D]:
- Splits: 7-5 in 46% of lists, 6-6 in 34%, 8-4 in 15%, 9-3 or 10-2 in 5%. No list runs a non-basic rune in the Rune Deck.
- "Printed + text pips" means printed Power costs plus domain symbols that appear in rules text outside reminder text (Equip, Accelerate, Empower and activated costs). It predicts the split a little better than printed pips alone (R² 0.56 against 0.53) and far better than counting cards per domain (0.28).
- Players skew less than proportionally. A domain holding 75-85% of the pips gets 7.3 runes on average, not 9-10.
- Most decks top out at Power 2 on a single card (264 of 406); 64 lists run a Power-4 card (Time Warp and similar); 52 of the 64 are big-control [V: was "almost all"].

### 2.8 Battlefields

{{INCLUDE:out/04-battlefields.md}}

- [D] Battlefield choice is legend-specific and very concentrated: for most legends with n ≥ 8 one battlefield is in 85-100% of lists and the top three cover most lists (table in 2.6). A per-legend lookup is a better recommender than any general rule.
- [D] The banned battlefields still show in pre-ban lists (The Arena's Greatest in 2 of 8 Ornn lists, Aspirant's Climb in Jhin and Ezreal lists). Filter by the ban list before recommending.

### 2.9 Sideboards

{{INCLUDE:out/06-sideboard.md}}

Reading [D]:
- About half of all sideboard slots are answers: 2.5 removal/stun/bounce cards and 2.4 "hate" cards per sideboard.
- The Vendetta "Decree" cycle is the backbone of sideboards. Each is a cheap card that only works against one domain [F: gallery text]: *Decree of Rage* (fury) "Deal 4 to an enemy Calm unit", *Decree of Focus* (calm) protects against Fury, *Decree of Insight* (mind) "-5 Might" to an enemy Body unit, *Decree of Strength* (body) takes a Mind card from hand, *Decree of Discord* (chaos) bounces Order units, *Decree of Unity* (order) "Kill an enemy Chaos unit or gear".
- Gear answers are the next block: Salvage 22%, An Offer You Can't Refuse 17%, Disarming Rake 16%, Brittle Steel 15%, Ravenbloom Prefect 15%, Thermo Beam 11%, Tomb-Raider Barbara 11%. [V] Ravenbloom Prefect answers gear by its text (it banishes itself to banish a gear an opponent plays), but the role classifier gives it no role, so it is missing from every `hate_gear` count in this file.
- Sideboards are spread thin: median 7 distinct cards; 1,635 one-ofs, 907 two-ofs, 139 three-ofs.
- 42 of 401 sideboards hold a champion unit of the legend's own tag, the only evidence here of the champion swap that TR 403.4.a allows.

### 2.10 Checks against existing advice

Riot's primer (1.5) against the 406 lists [D]:

| advice | what the lists do |
|---|---|
| 9+ units costing 2-4 | 88% comply; median 14 |
| 6+ interactive spells | 95% run 6+ interaction cards (any type); median 15 |
| "When in doubt, play more units" | units ≥ spells + gear in 52% of lists |
| "Play more copies of your Chosen Champion" | **only 7% do**; 93% run just the Champion Zone copy |
| 3 signature cards | 43% run 3, 40% run 0 |
| stay at 40 | 410 of 419 loaded lists are exactly 40 |
| runes 6-6, skew up to 8-4 | 6-6 34%, 7-5 46%, 8-4 15%, more skewed 5% |

Riftfoundry's current curve targets (`~/github_repositories/Untitled/apps/web/src/lib/scoring.ts`, `DECK_CURVE_TARGETS["standard-1v1"]`: 1-2 Energy ideal 8 (5-11), 3 Energy ideal 8 (5-11), 4-5 Energy ideal 14 (10-18), 6+ ideal 5 (2-8)) do not match tournament lists [D]: measured medians are 22 cards at ≤ 2 Energy, 7 at 3, 6 at 4-5, and 3 at 6+. Do not port those targets.

## 3. Targets, rune formula, consistency model

### 3.1 Target bands per archetype

Rule [H]: the **target band** of a role is p25–p75 of the matching cluster; the **tolerance band** is p10–p90. Inside the target scores 1.0; between target and tolerance falls linearly to 0.5; outside tolerance keeps falling to 0 at a distance of one more band-width. Each cell is target (tolerance), generated by `targets.mjs` from the same data as 2.4 [D].

{{INCLUDE:out/13-targets.md}}

Where a legend has n ≥ 8 lists (2.5), prefer that legend's own p25–p75 over the archetype band [H]. With n between 5 and 7, average the two.

### 3.2 Rune split formula

Inputs: for the legend's two domains, `demand_d = printed Power pips on cards of domain d + domain symbols of d in rules text outside reminder text`, summed over the 40 with copies; a multi-domain card splits its printed pips evenly. `s` = share of the larger demand.

Formula [H, fitted to D]:

```
major = clamp( round( 6 + 6 × (s − 0.5) ), 6, 9 )      // s = 0.50 → 6, 0.67 → 7, 0.83 → 8, 1.00 → 9
minor = 12 − major
```

- Fit [D: n = 406]: exact match with the player's choice in 48-49% of lists, within one rune in 89-90% [V: the script's per-domain variant with a 3-9 clamp gives 49% and 90%; the formula exactly as written above gives 48.3% and 88.9%]. A steeper slope does worse (slope 12: 24% exact, 68% within one).
- Then run the castability check in 3.3 on every card with Power ≥ 2 and on the Chosen Champion. If a card you want on turn `t` is below 80%, move one rune toward its domain and re-check the other domain. Report both numbers, do not optimise silently [H].
- Single-domain demand (s near 1) still gets 3 runes of the other domain in practice (9-3 in 16 lists, 10-2 in 3) [D]. The likely reason is that the off-domain's remaining cards, activated costs and sideboard cards still need them [H; V: the cause was labelled D but was not measured].
- Seals (gear such as *Seal of Unity*: "[Exhaust]: [Reaction] — [Add] [Order]" [F: gallery]) are Main Deck cards, not runes; they raise effective supply. No list in the sample has a non-basic rune. Treat each Seal copy as +0.5 rune of its domain in the check [H].

### 3.3 Consistency model

Assumptions, each tied to a rule:
- Library is **39 cards**: 40 minus the Chosen Champion in the Champion Zone (CR 103.3.a.1, 112). The Chosen Champion is available every game, so its "consistency" is 100%.
- Opening hand 4 (CR 116). A mulligan of `m ≤ 2` cards shows `4 + m` different cards, and the returned cards go to the bottom (CR 117, 417.1).
- One draw per turn (CR 315.4.b). In 1v1 both players draw on turn 1, so by your own turn T you have seen `4 + T` cards without a mulligan and `6 + T` if you threw two cards away looking for something. A multiplayer first player has seen `3 + T` (CR 489.7).
- Runes on board at your turn T before any recycling: `2T` going first, `2T + 1` going second, capped at 12 (CR 315.3.b, 487.7).
- A card with Energy E and Power P of domain A needs at least `max(E, P)` runes on board, at least P of them of domain A: exhaust for Energy, then recycle P of them for Power (CR 164.2.a/b; caveat 0.7). Runes of A among r channelled runes follow a hypergeometric draw from the 12-card Rune Deck with `a` runes of A.
- Not modelled [H]: runes recycled on earlier turns (each Power paid removes a rune from the board until it is channelled again), extra channel effects, Gold tokens, cost reducers, draw spells. The rune table is therefore right for the first power payment and optimistic afterwards.

`P(at least m of K in n) = Σ_{x ≥ m} C(K, x) · C(N − K, n − x) / C(N, n)`. Tables from `consistency.mjs`:

{{INCLUDE:out/08-consistency.md}}

Worked answers:
- *Copies needed to see a card by turn N.* A 3-of is seen by turn 3 in 46% of games and by turn 5 in 56%; digging two cards with the mulligan lifts turn 3 to 56%. Even by turn 8 a 3-of has been seen in only 68% of games, so a plan must rest on **groups** of interchangeable cards (table B): 7 copies for 75% by turn 3, 9 for 85%, 11 for 90%.
- *A two-drop on turn 2.* With 9 units costing ≤ 2 (the unit-aggro p75; the median is 8 [V: was called the median]) you have at least one by turn 2 in 82% of games without a mulligan and 90% with a two-card dig. With 8 it is 77% and 87%; with 6 it is 66% and 77%.
- *Opening hands.* With 9 early units, 33% of opening fours have none. Throwing back two cards then finds one 45% of the time (two draws from the other 35 cards), which leaves 82% of all games with an early unit after the mulligan (table C, last column) [V: the first pass gave 82% as the fix rate].
- *Runes for Power 1.* Going first, a turn-2 Power-1 card (4 runes on board) is castable 97% of the time on 6 runes of its domain, 93% on 5, 86% on 4. A 7-5 split costs the minor domain four points on turn 2.
- *Runes for Power 2.* Going first on turn 3 (6 runes on board): 96% with 6 runes of that domain, 88% with 5, 73% with 4. To cast a Power-2 card on turn 2, 8 runes give 93% and 6 give 73%. The lists agree: 47 of the 55 Piltover Archive lists on 8-4 have no Power-2 card in the minor domain (mean 0.27 copies, against 0.91 on 7-5 and 1.62 on 6-6) [D; V: measured in this pass, the first pass said "only" without a count].
- *Runes for Power 3.* On turn 4 going first (8 runes): 97% with 6, 85% with 5, 59% with 4.
- *Going second* is worth one extra rune in every row; for example Power 2 on turn 2 with 6 runes rises from 73% to 88%.

## 4. Synergy axes

Each axis has an **enabler** pattern (makes the thing happen) and a **payoff** pattern (rewards it). Patterns are the `AXES` table in `analysis/axes.mjs`; counts are over the 953 named main-deck cards, 58 legends and 74 non-token battlefields in the gallery on 2026-11-11 [D]. "Legends" lists champion tags whose legend text matches the payoff pattern.

{{INCLUDE:out/09-axes.md}}

Enabler / payoff definitions in words (the regexes are in the script):

| axis | enabler | payoff | rule reference |
|---|---|---|---|
| tokens / go-wide | "unit token(s)" | "for each (friendly) unit", `[Legion]`-style counts, "your units have/get", "friendly units here have" | tokens CR 185-187 |
| buffs | `[Buff]`, "buff a/another/me" | "buffed", "spend a buff", "has a buff" | Buff CR 427 |
| equipment / attach | tag Equipment, `[Equip]`, `[Quick-Draw]` | `[Weaponmaster]`, "Equipment", "attach(ed)", "equipped" on non-Equipment cards | CR 818, 819, 821 |
| gear matters | any gear | "when you play a gear", "for each gear", "friendly gear", "kill a friendly gear", `[Show Off]` a gear | — |
| discard | "discard N" (yours) | "when you discard", "discarded this turn" | Discard CR 423 |
| trash / recursion | `[Burn N]`, discard, "into your trash", friendly sacrifice | "from your trash", `[Flow]`, "cards in your trash" | Burn CR 441, Flow CR 829 |
| stun | `[Stun]` | "stunned" | Stun CR 424 |
| movement | "move a/another (friendly) unit" (not an enemy unit), `[Ganking]` | "when I move", "when a friendly unit moves", "moved this turn" | Move CR 421, Ganking CR 810 |
| enemy displacement | "move an/up to N/any number of enemy unit(s)" | "when you move an enemy unit", "enemy unit that moved this turn", "enemy unit alone" | Move CR 421 |
| conquer triggers | `[Accelerate]`, "enter ready", "ready a unit", `[Ganking]`, `[Assault]` | "when I/you conquer", "conquer effects", `[Hunt]` | CR 471.1, 473.2.a, Hunt CR 823 |
| hold triggers | `[Shield]`, `[Tank]`, `[Deflect]`, "can't be chosen" | "when I/you hold", "hold effects", `[Hunt]` | CR 471.2, 473.2.b |
| mighty | units with Might ≥ 5, "+3 Might or more", "double Might" | `[Mighty]`, "5 Might or more" | reminder text "I'm Mighty while I have 5+ Might" (Fiora, Victorious) |
| spell-slinging | spells costing ≤ 2 | "when you play a spell", "your spells", "spells cost", "spell from your trash" | — |
| rune ramp / big energy | "channel N runes", Gold tokens, `[Add]`, "ready runes" | Energy ≥ 6, "control N or more runes", "pay any amount", `[Repeat]`, large `[Empower]` | Channel CR 431, Repeat CR 820 |
| XP / Level | "gain N XP", `[Hunt N]` | `[Level N]`, "spend/pay N XP" | XP CR 729-731, Level CR 824 |
| hidden / facedown | `[Hidden]` | "face down", "hide", "a card with [Hidden]" | Hidden CR 811, Hide CR 422 |
| deathknell / sacrifice | `[Deathknell]`, `[Temporary]` | "kill a friendly unit/gear", "when a friendly unit dies", "Deathknell effects" | CR 808, 816 |
| empower | `[Empower]` | "becomes Empowered", "empower something/another", "disempower" | CR 827, 828, 442 |
| deploy / bombs | `[Deploy]`, "Bomb gear token" | "gear with [Deploy]", "Bombs", "gear at a battlefield" | CR 830, 187.12 |
| show off | cards costing ≥ 7 or gear (things that get shown) | `[Show Off]` | CR 832 |
| disarm / shrink | `[Disarm]`, "-N Might" | "when you reduce the Might", "N Might or less" | CR 831 |
| legion | cards costing ≤ 1 | `[Legion]`, "another card this turn" | CR 812 |
| attack | `[Assault]` | "when I attack", "attacker" | CR 807 |
| defend | `[Shield]`, `[Tank]` | "when I defend", "defender" | CR 814, 815 |
| deflect / chosen | `[Deflect]` | "when you choose", "when I'm chosen" | CR 809 |
| top-deck | `[Vision]`, `[Predict]` | "top card of your Main Deck", "look at/reveal the top" | CR 817, 437 |
| ready / exhaust | "ready a unit / it / me" | units with "when I become exhausted", "when you ready", "[Exhaust]:" abilities | CR 415, 416 |
| solo / alone | cheap protection and pump spells | "alone", "only unit" | — |
| hand size | "draw N" | "cards in hand", "when you draw" | — |
| gold | "Gold gear token" | "Gold" as a resource to spend, "kill a friendly gear" | Gold token text (gallery) |

Findings [D]:
- **Region tags are not a synergy axis today.** Ionia (83 cards), Noxus (56), Demacia (39), Shurima (38), Bandle City (37), Yordle (36), Shadow Isles (33), Piltover (31), Mount Targon (31), Freljord (29) and Zaun (27) have **zero** cards, legends or battlefields whose rules text names them. The two Bilgewater "payoffs" in the table only say that a token is "from Bilgewater". Do not build a "Noxus" or "Yordle" theme score; keep the tags as inert metadata until a card references them.
- The tags that do have payoffs are creature-type tags: Mech (17 members, 17 cards naming it, Rumble's legend), Bird (9 / 14), Poro (14 / 8), Dog (15 / 7), Cat (13 / 7), Dragon (21 / 4), plus Equipment (41 / 13; Azir, Jax, Lucian legends).
- Largest two-sided axes: conquer triggers (161 enablers / 40 payoffs, seven legends, 17 battlefields), hold triggers (102 / 36, 14 battlefields), movement of your own units (58 / 30), trash (56 / 53), attack (41 / 41), tokens (51 / 38), gear (132 / 23), equipment (43 / 20), XP (26 / 23).
- Thin payoff sides, so easy to over-count as themes: enemy displacement (20 enablers, 3 payoffs: Blast Cone, Isolate, Siren's Song), discard (4 payoffs), defend (4), gold (4), deploy/bombs (5), show off (6), hand size (6), stun (7), deflect/being chosen (7), solo (7), mighty (9).
- Precision caveat [H]: "rune ramp" payoffs are mostly just expensive cards (202); "show off" enablers are a superset; treat both as weak signals with a low axis weight.

Validation [D]. `validate-axes.mjs N seed` prints N random pool cards with every axis label; each label was read against the card text. Structural labels (any gear, any spell costing ≤ 2, any card costing ≤ 1 or ≥ 7) were not counted.

| round | sample | text labels | false positives | false negatives | what was fixed afterwards |
|---|---|---|---|---|---|
| 1 | 40 random, seed 31337 | 105 | 5 | 2 | "move an enemy unit" split out of movement into its own axis; "chosen by an enemy spell" (hosers, "can't be chosen") no longer a being-chosen payoff; "didn't die alone" and "no other friendly unit" no longer solo payoffs; "spend a buff as…" no longer a buff enabler; "channel that many runes plus 1" added to ramp; "kill a … you control" as a cost added to sacrifice payoffs |
| 2 | 40 random, seed 99, after the round-1 fixes | 86 | 3 | 2 | "gear with [Deploy]" mentioned in text is no longer a Deploy enabler; "spent … to play a spell this turn" added to spell-slinging payoffs. Left as is: `[Ganking]` on a gear (The Ball) counts as a conquer enabler; two errors came from the mistyped RAD rows in caveat 0.10 |

[V] UNCONFIRMED: these counts are a hand reading that no script reproduces. Read this as 6-7% wrong or missing text-based labels in a fresh sample (7 of 105, then 5 of 86), a little worse than the role classifier's last random round (2.2). Round 2 was not re-sampled after its two fixes. The counts in the table above are the post-fix counts.

## 5. How 2v2 and free-for-all change card value

### 5.1 Facts from the rules

| | 1v1 Duel / Match | FFA3 Skirmish | FFA4 War | 2v2 Magma Chamber |
|---|---|---|---|---|
| rule | CR 487, 488 | CR 489 | CR 490 | CR 491 |
| players / opponents each | 2 / 1 | 3 / 2 | 4 / 3 | 4 / 2, plus 1 teammate |
| Victory Score | 8 | 8 | 8 | **11**, shared by the team (491.3, 491.8.d) |
| battlefields in play | 2 | 3 | 3 | 3 |
| who supplies them | both players | all three | everyone except the first player (490.4.b) | everyone except the first player (491.5.b) |
| first-turn rule | second player +1 rune | first player skips first draw; last player +1 rune | same as FFA3 | same as FFA3 |
| format | best of 1 / best of 3 | best of 1 | best of 1 | best of 1 |

More facts that move card value:
- [F] "A Combat can only occur between two players" (CR 316.7.d). With more than two players, a battlefield with a staged or ongoing combat is an invalid destination for moves and for playing units by players who are not in that combat (CR 449.2.a, 464.1, 464.2).
- [F] Burn Out makes the burning player **choose** which opponent gains the point (CR 432.2.c).
- [F] The Final Point from a Conquer needs every battlefield scored that turn (CR 473.1.b.1). That is 2 battlefields in 1v1 and **3** in every larger mode. Hold points and "score 1 point" effects are exempt (CR 473.1.a.1).
- [F] 2v2: "Friendly describes controlled Game Objects by a player or their Teammate" (CR 491.8.e). Control is not shared; you cannot hide cards at a teammate's battlefield or move their units (CR 491.8.c.1, 491.8.c.2).
- [F] 2v2: a battlefield can be scored once per **team** per turn, and battlefields your teammate controlled at your scoring step cannot be scored by your team that turn (CR 491.8.b, 491.8.b.1, 315.2.b.3).
- [F] 2v2: a teammate may play spells and activate abilities on your turn when you invite them, "including ones without Action or Reaction" (CR 316.5.b.1, 491.8.a).
- [F] 2v2: teammates cannot use the same legend or the same battlefields (CR 491.8.h, 491.8.i). Hands may be shown to a teammate (CR 491.8.f).
- [F] 2v2: the Final Point by Conquer needs every battlefield scored that turn except those your ally held at the scoring step (CR 491.8.g.1).
- [F] 2v2 bans *Master Yi, Wuju Bladesman* (Rules Hub). His legend text is "While a friendly unit defends alone, it gets +2 Might" [F: gallery], which reaches a teammate's units through CR 491.8.e.
- [F] Showdowns are not limited to the two fighting players. The player who contested the battlefield gains Focus first (CR 345); after a play or a pass "the next Player in Turn Order gains Focus" (CR 347.1.b, 347.2.b); the showdown ends when "all Players have passed once in sequence" (CR 347.2.a, 348). When combat triggers are ordered, "all non-Defender players in Turn Order" add theirs after the attacker (CR 466.2.d.1). So a third player gets Focus in someone else's showdown and can use it for legally timed cards (Action or Reaction, CR 806.1.b, 813.1.b). UNCONFIRMED only in the sense that no sentence states this for uninvolved players by name.
- [F] "XP is not shared between Allies in Game Modes with Teammates" (CR 732).

Card-pool counts that matter here [D: 953 named main-deck cards]:
- 14 cards scale with the number of opponents ("each opponent", "opponents …"); 12 say "each player".
- 29 cards "choose an opponent" and do not scale.
- 25 cards hit "all" or "each" units [D]; board size roughly doubles at a four-player table [H].
- 167 cards say "friendly"; 14 legend tags have "friendly" in the legend text (Lillia, Irelia, Lee Sin, Pyke, Jarvan IV, Shen, Orianna, K'Sante, Leona, Akali, Seraphine, Yasuo, Kha'Zix, Master Yi).
- 2 cards mention "allies" (Bushwhack Trap, Right of Conquest); 9 of 76 battlefield names mention allies or "each player".
- 21 cards refer to points or the Victory Score.

### 5.2 What follows for valuation [H, derived from 5.1]

Multipliers for the per-card score's mode component (section 7). Baseline 1.00 = 1v1.

| card property | FFA3 / FFA4 | 2v2 | why |
|---|---|---|---|
| "each opponent" / "opponents" effect | ×1.3 / ×1.5 | ×1.3 | two or three targets instead of one |
| "choose an opponent", single-target discard | ×0.8 / ×0.7 | ×0.9 | one of several opponents; the others gain relatively |
| spot removal, one-for-one | ×0.85 / ×0.8 | ×1.0 | one answer, more threats; in 2v2 the teammate shares the work |
| sweepers and "all units" damage | ×1.25 / ×1.4 | ×1.1 (hits the teammate too unless it says "enemy") | more units on three battlefields |
| counterspells | ×0.85 / ×0.8 | ×1.0, playable on the teammate's turn by invitation | more spells than you can counter; they can still be used in other players' showdowns (CR 347) |
| Hold payoffs, Shield, Tank, Deflect, "can't be chosen" | ×1.15 / ×1.25 | ×1.15 | a hold must survive 2-3 enemy turns instead of 1 |
| Conquer payoffs, Accelerate, Ganking, movement | ×1.1 / ×1.1 | ×1.0 | a third battlefield is more often empty or weakly held; but conquer cannot take the last point alone |
| direct point gain ("score 1 point"), extra turn | ×1.3 / ×1.3 | ×1.2 (11 points to cover) | exempt from the Final Point rule, which is harder with 3 battlefields |
| "friendly" buffs, ready effects, protection | ×1.0 | ×1.3 | CR 491.8.e doubles the legal targets |
| point denial ("opponents can't score points") | ×1.2 / ×1.3 | ×1.2 | stops several players at once |
| self-mill, Burn, small-deck draw engines | ×0.9 | ×0.9 | a Burn Out hands a point to an opponent of your choice; fine in 1v1, a kingmaking lever in FFA |
| top-end cards costing 6+ | ×1.1 / ×1.15 | ×1.15 | longer games: 11 points in 2v2; fewer of your own turns per round in FFA |
| cheap aggressive one-drops | ×0.9 / ×0.85 | ×0.95 | you act once per 3-4 turns; early tempo is diluted |
| battlefields with a drawback for whoever holds them | ×1.0 | ×1.0, but −1 pick if the teammate wants the same name | CR 491.8.i |

Deck-level changes [H]:
- **Seat risk.** In FFA4 and 2v2 the first player's battlefields are not used at all (CR 490.4.b, 491.5.b). Value "my battlefield" synergies at about 3/4 in FFA4 and 2v2 when turn order is random. In FFA3 all three are used.
- **Opening consistency.** The multiplayer first player sees one card fewer (table D in 3.3): 9 early units give 75% by turn 2 instead of 82%. Add one early play in multiplayer builds.
- **Bands.** Until multiplayer lists exist, shift the 1v1 bands: +1 to +2 on protection and hold cards, +1 on finishers, −1 to −2 on one-for-one tricks and counterspells in FFA. This is a guess and should be shown as such in the UI.
- **Politics.** The Core Rules have no rule that binds in-game deals in FFA [V: checked by text search of the CR; in sanctioned events TR 704.5 forbids influencing games with out-of-game rewards, and that covers actions within a game (704.5.a, 704.5.a.2)]. The only rules-level political levers are who you attack, who you give a Burn Out point to (CR 432.2.c), and the lead check in CR 474 (a player at 8 who is tied does not win). A score that is "ahead of every opponent" invites two players to attack the leader; cards that gain the last points without combat avoid that.
- **2v2 pairing.** Score a pair of decks together: the two legends must differ, the six battlefields must be six different names, and "friendly" payoffs on one deck count the other deck's units as enablers.

### 5.3 Community sources [C]

"Riftbound Multiplayer Rules - How 2v2, Skirmish and War Actually Work", gamertagmythras.com (published 2026-08-02, updated 2026-11-01), https://gamertagmythras.com/blog/riftbound-tcg/riftbound-multiplayer-2v2-rules:
- Restates the mode table above and the 2v2 scoring clauses; its rule content matches CR 487-491 as read here.
- Argues that 11 points is slow in practice: a team holding all three battlefields scores them only on one teammate's turn per round, about 3 points per four turns, so a game takes at least four full rounds. This is an arithmetic consequence of CR 491.8.b.1 and looks correct, but it is their reasoning, not a Riot statement.
- Says the Master Yi legend was banned in 2v2 effective 2026-07-24 because the +2 Might reaches a teammate's lone defender. The ban is confirmed on the Rules Hub. [V] The July article confirms the date (effective July 24, 2026) and the reason (the defensive bonus extends to both you and your ally) (https://playriftbound.com/en-us/news/announcements/july-ban-list-updates).
- Notes that XP is not shared between teammates. Confirmed: CR 732.

No community tier list or card-by-card multiplayer evaluation was found by search on 2026-11-11.

## 6. Deterministic game-plan templates

Everything below is computed from the deck list, the role tags (2.2), the archetype (2.3), the tables in 3.3 and the per-legend data (2.5-2.9). No free text is generated; each line is a template with slots. Thresholds are [H] unless a rule or a measurement is cited.

### 6.1 Derived quantities

```
N        = 39                                   // library, CR 103.3.a.1 + 112
EARLY    = units with energy ≤ 2 (going second: ≤ 3, because of the extra rune, CR 487.7)
CHEAP_IX = interaction cards with energy ≤ 2
ENGINE   = cards that are enablers on the deck's top axis (section 4) with energy ≤ 3
TOP      = cards with energy ≥ 5 that are not ramp
champTurn(first)  = max( ceil(champEnergy / 2), smallest T with 2T ≥ champPower )
champTurn(second) = max( ceil((champEnergy − 1) / 2), 1 )
pEarly(T, dig)    = P(≥ 1 of |EARLY| in 4 + T (+2 if dig))          // table A
pPower(card, T)   = P(≥ card.power of a_domain in min(12, 2T [+1])) // table F
role              = "beatdown" if myAvgEnergy + 0.25 < oppAvgEnergy or myUnitsLe2 ≥ oppUnitsLe2 + 3, else "control"
```

`oppAvgEnergy` and the other opponent values come from the opponent's archetype centroid (2.3) when the actual list is unknown, or from the legend's medians (2.5) when the opposing legend is known.

### 6.2 Mulligan

Keep rule, evaluated on the opening 4:
1. Count `e = EARLY cards in hand`, `x = CHEAP_IX in hand`, `t = TOP cards in hand`.
2. If `e = 0`: set aside the two worst cards by the order in step 4. Print: "No early unit. Mulligan 2: {p}% to find one" with `p = P(≥ 1 of |EARLY| in the next 2 of 35)`.
3. If `e ≥ 1`: set aside up to two cards from step 4 that satisfy its conditions. If none qualifies, keep.
4. Toss order: (a) TOP cards beyond the first, (b) any card with Power ≥ 2 in the minor rune domain when `pPower(card, 3) < 0.6`, (c) a copy of the Chosen Champion's name (the Champion Zone copy already covers it; only 7% of lists even run a second copy [D]), (d) sideboard-style hate cards in game 1, (e) the third copy of the same name, (f) a 4-Energy card when the hand already has two cards costing ≥ 4.
5. Never toss: the only EARLY unit; in spell-tempo and big-control, the only CHEAP_IX card.
6. Archetype override [D-based]: big-control (p25–p75 of 0–6 units costing ≤ 2, median 5.5 [V: the range was called a median]) uses `EARLY ∪ CHEAP_IX ∪ ramp with energy ≤ 2` as its keep class; gear-engine uses `EARLY ∪ ENGINE`.

Output lines:
- "Keep: at least one of {top 3 EARLY names by copies}. You open with one in {1 − P(0)}% of hands (table C) and reach {pEarly(2, dig)}% by turn 2 if you mulligan for it."
- "Throw back: {names matched by step 4 in this deck, with the reason code}."
- "Your champion {name} costs {E} Energy{, P Power}: earliest turn {champTurn} going first, {champTurn second} going second; power is ready on that turn in {pPower}% of games with your {a}-{12 − a} runes."

### 6.3 Turn-by-turn lines by curve

For T = 1…5 print one line. Energy available is `2T` (first) or `2T + 1` (second) before recycling.

```
T1 (2 / 3 energy): best = most-copied EARLY card castable for ≤ 2 (second: ≤ 3).
                   "Turn 1: {card} ({copies}×). {pEarly(1)}% to have an early unit; otherwise hold {CHEAP_IX name} mana for their turn."
T2 (4 / 5):        options = [two cards costing ≤ 2] or [one costing 3-4] or [champion if champTurn ≤ 2]
                   choose by archetype: unit-aggro → widest board; spell-tempo → one unit + keep {reactionCost} open;
                   gear-engine → ENGINE piece first; big-control → ramp if held, else removal on their best unit.
T3 (6 / 7):        champion line if not yet played; "leave {k} runes ready for {top reaction spell}" when sp_reaction ≥ 6.
T4 (8 / 9):        first TOP card window; print pPower for each TOP card with power ≥ 2.
T5+ (10+):         "Finisher window: {finisher names}. You have seen {4 + T} cards; P(at least one finisher) = {…}%."
```

Rules for the slots:
- A card is offered on turn T only if `energy ≤ runes(T)` and `pPower(card, T) ≥ 0.5`; otherwise the line says "usually turn {first T that passes}".
- When a line spends Power, add "(recycles {P} rune{s}: {runes − P} left next turn before channelling)".
- Scoring reminder on every line from the first turn the deck can contest two battlefields: "Conquer for the point; the last point by conquer needs both battlefields this turn (CR 473.1.b.1)."
- If `|EARLY| < 6`, turn 1 prints "Expect to pass turn 1 in {P(0 early by T1)}% of games."

### 6.4 Matchup plans

Pick the row by the opponent's archetype (nearest centroid of their list, or the legend's most common cluster from 2.6). Slots in braces are filled from **your** deck. Numbers in the "they usually have" column are the cluster's p25–p75 [D, 2.4].

| opponent | they usually have | your plan template |
|---|---|---|
| unit-aggro | 22–27 units, 8–9 costing ≤ 2, 6–16 tempo effects, 1–4 reaction spells, 0–1 counterspells | "You are the control. Trade early: keep {CHEAP_IX names}. Hold one battlefield with {Shield/Tank/Deflect units} rather than racing two. Their tricks are mostly at Action speed (3–7): attack into open runes freely on your turn, block with tricks on theirs. Sweepers are good here: {sweeper names or 'none in list'}." |
| spell-tempo | 16–20 units, 8–13 reaction spells, 3–4 counterspells, 5–9 combat tricks, 2–5 protection | "Play around open runes. Defy counters a spell costing ≤ 4 Energy and ≤ 1 Power and is in 37% of lists [D]: lead with a cheaper spell or use {spells with energy ≥ 5 or power ≥ 2}. Make them act first in showdowns. Prefer units over spells as threats: {top units}. Stun/bounce is their main removal (bounce 0–4, stun 1–3), so re-playable cheap units beat one expensive unit." |
| gear-engine | 7–15 gear, 8–12 cards costing ≤ 1, 8–12 card flow | "Attack the engine: {hate_gear names or 'none: add in sideboard'}. Race before the gear pays off: you are the beatdown if your average Energy is below {their median 2.55}. Kill gear in response to Equip or Deploy value where the card allows it." |
| big-control | 10–11 cards costing 6+, 10–13 removal, 10–15 card flow, 0 counterspells in most lists (51 of 66), a sweeper in 23 of 66 lists (35%) | "You are the beatdown. They do little before turn 3 (0–6 units costing ≤ 2): score early holds. Spread across both battlefields, but expect a sweeper more often than elsewhere: 35% of big-control lists run one, against 13% of all lists [D; V: the first pass cited only the all-lists figure]. Save {counterspell / hand_attack names} for their 6+ cards: {known finishers of that legend from 2.6 data}. Do not hold cards past turn 5 against Time Warp-style finishers." |
| mirror (same cluster) | — | "Mirror: card flow and the first held battlefield decide it. You have {r_card_flow} flow cards against a typical {band}. Going second is one rune ahead on every turn (CR 487.7)." |

When the opposing **legend** is known and has n ≥ 8 lists, append: "Typical {legend} list: chosen champion {name} ({share}%), runes {split}, battlefields {top three}" from the per-legend table.

### 6.5 Sideboard in and out by category

Rules: swaps are 1 for 1 (TR 403.4); copy limits span main and side (TR 601.1.c.3); the Chosen Champion may change (TR 403.4.a); runes and battlefields may not (TR 403.4.b).

**Bring in** (first matching rows, up to the number of copies in the 10):

| condition on the opponent | category to bring in | cards seen in sideboards [D] |
|---|---|---|
| has domain X | the Decree that punishes X: Calm → Decree of Rage; Fury → Decree of Focus; Body → Decree of Insight; Mind → Decree of Strength; Order → Decree of Discord; Chaos → Decree of Unity (only if your identity has the Decree's own domain) | Focus 23%, Insight 21%, Unity 20%, Rage 18%, Strength 12% of sideboards |
| gear ≥ 7 or gear-engine | `hate_gear` | Salvage 22%, An Offer You Can't Refuse 17%, Disarming Rake 16%, Brittle Steel 15%, Ravenbloom Prefect 15% |
| spell-tempo, or ≥ 10 spells that target | `counterspell` that protects (Not So Fast 22%), `protection` | Not So Fast, Hush 12%, Abandon 9%, Unyielding Spirit 8% |
| unit-aggro | cheap `removal`, `sweeper`, defensive tricks | Star-Crossed 22%, Gust 13%, Unchecked Power 10%, Rebuke 9% |
| big-control | `hand_attack`, `counterspell`, extra threats | Sabotage 14%, Ashe, Focused 9%, Ferrous Forerunner 17% |
| relies on one large unit | bounce and stun over damage | Star-Crossed, Gust, Vex, Apathetic 9% |

**Take out**, lowest first, until the swap count is met:
1. Cards whose role is dead in the matchup: `hate_gear` against ≤ 2 gear; `counterspell` against < 10 spells; `sweeper` against big-control; damage removal that cannot kill their typical unit (damage < their median unit Might).
2. Cards with the lowest per-card score (section 7) recomputed with the matchup weights: against beatdown decks weight R toward removal and early units; against control decks toward card flow and threats.
3. Never go below the lower tolerance bound (p10) of your archetype for `units_le2` or for units in total.
4. On the draw (going second), cut the most expensive card first; on the play, cut the slowest reactive card first [H].

Typical sideboard shape to recommend when building [D, 2.9]: 10 cards, about 7 distinct names, 2-3 removal/stun/bounce, 2-3 hate, 1 counterspell, 1 trick, 1-2 extra units, at most one 3-of.

## 7. Per-card score 0-100

Adapted from `~/github_repositories/commander-forge/docs/research/deck-theory.md` §6 and its spec §10. A static part depends on legend and chosen champion; a dynamic part depends on the current list and the mode. All weights are starting values [H].

### 7.1 Hard gates (score 0, show the reason)

- Outside the legend's domain identity (CR 103.2.b.3, 103.2.b.4); cards with no domain pass (CR 103.2.b.5).
- Banned in the selected format (Rules Hub lists; 2v2 adds the Master Yi legend).
- Fourth copy by name across main and sideboard (CR 103.3.b, TR 601.1.c.3). Exceptions come from card text, for example *Spiderling* ("Your deck can have any number of cards named Spiderling") and the Unique keyword (CR 825: one copy per name).
- Signature card with a different champion tag, or a fourth signature card (CR 103.3.d.1, 103.3.d.2).
- Not a Main Deck card type (legend, battlefield, rune, token).
- A champion unit offered as Chosen Champion with the wrong tag (CR 103.3.a.2).

### 7.2 Theme vector

1. Run every axis in section 4 on the legend text, the Chosen Champion and the legend's signature cards. Weight 1.0 if the text matches the payoff pattern, 0.6 if it matches the enabler pattern, 0.3 if only a keyword of the axis appears.
2. Tag axes (Mech, Bird, Cat, Dog, Poro, Dragon, Equipment): 1.0 if the legend or champion names the tag in rules text. Region tags get 0 (section 4 finding).
3. Blend with the list: `w_axis = max(w_legend, 0.5 × min(1, payoffCopiesInDeck / 6))`.
4. Needs profile: champion Energy ≥ 5 raises ramp need; "attacks", "equipped" or "alone" in the champion text raises protection need.
5. The user may adjust weights.

### 7.3 Components

| component | weight | formula |
|---|---|---|
| S synergy | 30 | `max over axes of w_axis × max(e, p)` with e, p ∈ {0, 1} from section 4, plus 0.15 if a second axis with w ≥ 0.5 matches, capped at 1. ×1.15 when the card is on the scarcer side of its axis in the current list. |
| D data co-play | 20 | `0.6 × inclusion + 0.4 × clamp(log2(lift), 0, 1.5) / 1.5`. inclusion = share of that legend's lists containing the card; lift = inclusion ÷ inclusion among all lists whose identity allows the card. Needs n ≥ 8 lists for the legend; with 5-7 use the domain pair; below that move the weight to S and Q. Dataset: 2.1. |
| Q quality | 20 | `0.6 × play + 0.25 × rate + 0.15 × speed`. play = share of identity-eligible lists running it: ≥ 30% → 1.0, ≥ 15% → 0.8, ≥ 5% → 0.6, ≥ 1% → 0.4, else 0.2 (0.35 if the card's set is newer than 30 days at dataset time). rate, units only = clamp(0.5 + (Might − median Might of pool units at that Energy) / 4); non-units 0.5. speed = 1 for Reaction interaction, 0.8 Action, 0.5 slow, 0.5 for non-interaction. |
| R role need | 15 | `max over the card's roles of deficit(role) / target(role)` against the archetype band in 3.1 (legend band when n ≥ 8). 0 when the role is at or above the band top. |
| C castability and curve | 10 | `0.6 × pPower(card, max(2, ceil(Energy / 2)))` with the current runes, plus `0.4 × curveFit`; curveFit = 1 if the card's Energy bucket is under its band, 0.5 inside, 0.2 over. |
| M mode fit | 5 | 1v1: 0.5 for every card. Other modes: `clamp(0.5 × product of matching multipliers in 5.2, 0, 1)`. |

`score = round(100 × (0.30 S + 0.20 D + 0.20 Q + 0.15 R + 0.10 C + 0.05 M))`

- Staple floor: a card with a core role (early unit, removal, card flow) and play ≥ 0.8 scores at least 55.
- Champion and signature bonus: the legend's own signature cards get +8 (43% of lists run all three [D]); the second and third copy of the Chosen Champion get −10 unless the champion costs ≤ 3 (93% run one copy [D]).
- Explanation: store each term, the top axis and the matched text. Example: "+26 synergy: makes unit tokens, legend pays off going wide; +14 data: in 71% of Viktor lists; −4: fifth card at 5 Energy".
- Calibration target: for the 23 legends with n ≥ 8 [V: was 20], cards in ≥ 50% of that legend's lists should score ≥ 70 and off-identity-theme cards with 0% play should score < 35.

## 8. Deck rating 0-100

Adapted from commander-forge `deck-theory.md` §7 and spec §11. Helper: `band(x, lo, hi, tolLo, tolHi)` = 1 inside [lo, hi]; falls linearly to 0.5 at the tolerance bound; falls to 0 one band-width further out. Bands are 3.1 for the deck's cluster (2.3), replaced by the legend's own bands when n ≥ 8.

**Legality gate** (pass/fail; on fail the rating is capped at 40 and each violation is listed):
- Main Deck ≥ 40 including the Chosen Champion (CR 103.3); exactly 40 in tournament mode (TR 601.1.b).
- Exactly 12 runes, all in identity (CR 103.4.a, 103.4.a.1).
- Three battlefields with different names, none banned (CR 103.5.c; Rules Hub).
- Chosen Champion matches the legend tag (CR 103.3.a.2).
- ≤ 3 copies per name across main + side; ≤ 3 signature cards, right tag (CR 103.3.b, 103.3.d).
- No banned card; sideboard ≤ 10 (TR 601.1.c.1).
- 2v2 mode: legend not on the 2v2 list; legend and battlefields differ from the teammate's (CR 491.8.h, 491.8.i).

| sub-score | weight | formula |
|---|---|---|
| Rune base | 14 | `0.6 × castability + 0.4 × splitFit`. castability = copy-weighted mean of `pPower(card, max(2, ceil(Energy / 2)))` over cards with Power ≥ 1. splitFit = 1 if the major count equals the formula in 3.2, 0.7 if off by one, 0.3 if off by two, else 0. |
| Curve | 12 | `0.4 × band(avgEnergy) + 0.3 × mean(band(Energy bucket) over the six buckets) + 0.3 × earlyPlays`, earlyPlays = `P(≥ 1 EARLY by turn 2, no mulligan)` rescaled so 0.6 → 0 and 0.9 → 1. For big-control use `EARLY ∪ CHEAP_IX`. |
| Role coverage | 18 | weighted mean of `band(count)` over: units 3, removal 3, card flow 3, tempo 2, combat tricks 2, counterspells + protection 1.5, finishers 2, ramp 1.5. |
| Synergy density | 14 | `0.6 × min(1, onTheme / 16) + 0.4 × balance`. onTheme = cards with S ≥ 0.5. balance = `min(E, P) / max(E, P)` on the top axis, full credit once min(E, P) ≥ 6. −0.2 if more than 8 cards sit on an axis with w < 0.3. |
| Interaction | 10 | `0.5 × band(interaction total) + 0.25 × band(reaction-speed spells) + 0.25 × coverage`. coverage = share of {unit answer, gear answer, spell answer, wide-board answer} with ≥ 2 copies in main + side. |
| Win plan | 10 | `0.5 × band(finishers) + 0.3 × scoreEngine + 0.2 × champFit`. scoreEngine = min(1, (conquer-or-hold payoffs + tempo cards) / 12). champFit = 1 if the chosen champion is the legend's most played choice or the legend has n < 5, else 0.6. Zero finishers and scoreEngine < 0.3 gives 0 and a warning. |
| Consistency | 12 | `0.35 × P(≥ 1 EARLY in the opening 4 or after a 2-card dig) + 0.25 × P(≥ 1 interaction by turn 3) + 0.25 × redundancy + 0.15 × sizeFit`. redundancy = band(cards in 3-ofs, 21, 27, 15, 33). sizeFit = 1 at 40 cards, −0.25 per extra card. |
| Sideboard and battlefields | 10 | `0.5 × side + 0.5 × bf`. side = `0.4 × (size == 10) + 0.6 × share of {removal ≥ 2, hate ≥ 2, counter-or-protection ≥ 1, a Decree in identity ≥ 1} met`. bf = mean over the three picks of min(1, share of that legend's lists using it / 0.5) when the legend has n ≥ 8, else 0.7 flat. In a best-of-one or casual build with no sideboard, this sub-score is bf only. |

`rating = round(Σ weight × sub-score)`, then the legality cap.

Explanation: each sub-score lists its three largest deficits with a concrete fix ("2 short on units costing ≤ 2 for unit-aggro (have 6, band 8–9): turn-2 play in 66% of games, band gives 82%"). Role deficits feed component R of the card score so suggestions follow from the rating.

Validation plan [H]:
- Score the 406 lists. Median should be ≥ 75 and the 10th percentile ≥ 60. A legend whose lists all score low points at a band that is wrong for that legend, not at bad decks.
- Score the two Radiance preconstructed lists printed in Riot's overview article (Seraphine, Evelynn; mostly 1- and 2-ofs). They should land around 45-60.
- Score a deliberately broken list (20 cards costing 6+, 6-6 runes with Power-3 cards in both domains). It should fall below 35 with the rune and curve sub-scores named as the cause.
- Re-fit after each set release; bands older than one set should be shown with a staleness note.

## 9. Method and reproduction

Files in `docs/research/analysis/` (Node 22, no dependencies):

| file | purpose |
|---|---|
| `get.mjs`, `text.mjs` | fetch one URL to a file; strip HTML to text |
| `build-cards.mjs` → `cards-2026-11-11.json` | official gallery → one row per base code, with type repairs flagged |
| `pa-lib.mjs`, `crawl-list.mjs`, `select-tournament.mjs`, `fetch-decks.mjs` | Piltover Archive listing and deck pages → `raw/pa-list.jsonl`, `raw/pa-tournament-ids.json`, `raw/pa-decks.jsonl` |
| `roles.mjs`, `validate-roles.mjs`, `top-played.mjs` | role rules and the validation samples |
| `validate-axes.mjs` | 40-card samples of the synergy-axis labels (section 4) |
| `analyze.mjs` → `out/00…07, 10, results.json` | features, clusters, bands, legends, runes, sideboards |
| `consistency.mjs` → `out/08-consistency.md` | hypergeometric tables |
| `axes.mjs` → `out/09-axes.md`, `out/axes.json` | synergy axes against the pool |
| `targets.mjs` → `out/13-targets.md` | the band table in 3.1 |
| `extra.mjs` | primer checks and multiplayer text counts |
| `assemble.mjs`, `deck-theory.template.md` | builds this file from the template and the `out/` tables |

Order: `build-cards` → `crawl-list 1 144` → `select-tournament` → `fetch-decks` → `analyze` → `targets` → `consistency` → `axes` → `extra` → `assemble`. The raw HTML and PDFs are git-ignored; their URLs are in this document.

## Verification notes

Confirmed against a primary source on 2026-11-11:
- Rule numbers and wording quoted in section 1, 3.3 and 5.1, read from the CR 2026-10-09 and TR 2026-10-09 PDFs converted with `pdftotext`.
- Ban lists and set legality, read from the Rules Hub page text.
- Radiance dates, mechanics and the two preconstructed lists, read from the overview article.
- Card texts quoted (Decree cycle, Master Yi legend, Fiora reminder text, Defy), read from the official gallery.
- Second pass, same day: CR 345-348 and 466.2.d.1 (who gets Focus in a showdown) and CR 732 (XP not shared), read from the same CR text; the official news index checked for November items; `assemble.mjs` re-run and confirmed to reproduce this file byte for byte before the section 4 fixes were applied.

Corrections to local material (old → new, source):
- Core Rules edition 2026-07-16 → 2026-10-09 (Rules Hub).
- Rule numbers for deck construction, modes, Recycle, Channel, Burn Out, Scoring shifted as listed in 0.1 (CR).
- Banned cards 5 → 7, banned battlefields unchanged at 5, plus a separate 2v2 list (Rules Hub).
- Card pool 931 → 1,237 base codes / 1,103 names (gallery).
- Sideboard size 8 in the local sample (lists from before July 2026) → 10 allowed since the July 2026 TR update, and used (TR 601.1.c.1; July changelog; 1.2, 2.9).

Could not verify:
- Items 0.3, 0.4, 0.7, 0.8 (outcome of the playtest); the true card types of the seven RAD rows in 0.10.
- [V: now verified] RC Europe timing and metagame shares, from Riot's article of 2026-11-11 (0.3, 1.1). riftdecks.com and mobalytics.gg are no longer relied on.
- api.riftcodex.com timed out on 2026-11-11; the gallery was used instead, so Riftcodex-only fields (TCGplayer ids) were not refreshed.
- [V: now verified] The sideboard rose from 8 to 10 in the July 2026 TR update (1.2).
- Any multiplayer deck data.

## Verification log (2026-11-11)

Independent pass over the whole file, run after the first pass on the same day. Inline corrections carry **[V]**. The same edits were applied to `analysis/deck-theory.template.md`, `analysis/consistency.mjs` and `analysis/out/08-consistency.md`, so re-running `assemble.mjs` reproduces this file.

### What was checked

- **Rules.** Both PDFs were downloaded again from the URLs in the header. Their SHA-256 hashes equal the copies in `analysis/raw/` (Core Rules `94d41fee…`, Tournament Rules `ce07da4f…`), and the Rules Hub still links exactly these two files and dates both "October 9, 2026". No newer edition exists. All 150 CR/TR rule numbers cited above the "Verification notes" heading exist in the PDFs; the text of each rule that carries a claim was read against the claim. Result: no wrong rule number and no wrong rule wording.
- **Local rules file.** `GameLab/data/rules/core-rules.md` is the 2026-07-16 edition; the number shifts listed in 0.1 were checked heading by heading and are correct.
- **Rules Hub.** Legality text, both ban lists and the "Last updated: September 18, 2026" stamps match 1.1.
- **Riot articles** re-fetched and read: Radiance overview, September and July ban articles, start-of-game test, Deckbuilding Primer, RC Europe preview, the news index, the July 2026 TR changelog, the October 2026 TR changelog, and the new "Best Ofs for the European Championship" article.
- **Card gallery** re-fetched: printings, names, RAD codes, legends, battlefields, untyped rows, mistyped rows and every card text quoted in this file (Decree cycle, Defy, Seal of Unity, Spiderling, Fiora, Victorious, the Master Yi legend, Blast Cone, Isolate, Siren's Song, the two Bilgewater cards, Time Warp, Ravenbloom Prefect).
- **Local data.** `GameLab/data/cards/cards.json` (931 cards, no RAD), the local deck sample, `Untitled/config/current-constructed-rules.json` (5 banned cards, 5 banned battlefields, last source July 2026) and `DECK_CURVE_TARGETS` in `Untitled/apps/web/src/lib/scoring.ts`.
- **Analysis scripts.** `analyze.mjs`, `targets.mjs`, `consistency.mjs`, `axes.mjs`, `extra.mjs` and `validate-roles.mjs … counts` were re-run on a copy of the saved raw data. Every generated table (`out/00` to `07`, `08`, `09`, `10`, `13`, `axes.json`) came out byte-identical, and `assemble.mjs` rebuilt the pre-correction file byte for byte from the template. The role rules printed in 2.2 are identical to `roles.mjs`.
- **Independent recomputation** (own code, not the scripts): all hypergeometric tables A to H in 3.3 and every worked answer; list validity, sideboard sizes, rune splits and Stuttgart counts from `raw/pa-decks.jsonl`; the rune formula in 3.2 exactly as written; medians and per-cluster counts behind the hand-written sentences in 2.3, 2.4, 2.6, 2.7, 2.10, 3.3, 6.2, 6.4 and 7.3.
- **Piltover Archive.** `robots.txt` is unchanged. Listing page 1 was fetched again (sort is "trending"; all 24 decks are in the saved crawl). Three saved deck pages were fetched again and matched the saved main deck and sideboard exactly; four source B deck pages were fetched to date them. The full 144-page crawl was not repeated.
- **Community page** gamertagmythras.com (5.3) re-fetched: publication and update dates and the three claims attributed to it are as stated.

Counted roughly: about 330 separate claims checked one by one (150 rule citations, about 40 statements from Riot pages and the Rules Hub, about 35 gallery and card-text statements, about 105 hand-written data and arithmetic statements), plus the 11 generated tables reproduced as a whole.

### Corrections made

| # | where | was | now | evidence |
|---|---|---|---|---|
| 1 | 0.3 | A community snippet put Kai'Sa at about 40% of the RC Europe field | Withdrawn. Riven 40.9% Day 1 and 49.0% Day 2, Kai'Sa 16.9% / 17.7%, Kennen 14.6% / 12.5%; Top 8 four Riven, three Kennen, one Kai'Sa; Kennen won | Riot, "Best Ofs for the European Championship", 2026-11-11 |
| 2 | 0.3, 2.1 | Stuttgart-tagged lists read as RC Europe lists | 42 of 67 were created before 2026-11-06 and 58 of 67 carry no placement; Riven is 7 of 67 there and 5% of the whole sample | `raw/pa-decks.jsonl` creation dates; `out/results.json` |
| 3 | 1.1 | "only two November items" on the news index; nothing newer affects deck building | Three items; the third (2026-11-11) announces that bans are being considered, decision on 2026-11-13, target effective date 2026-11-23 | Riot news index and the article above |
| 4 | 1.1 | RC Europe dates from a community search snippet | Riot's two articles place it on the weekend of November 6-8, 2026; the community page cited does not state the dates | RC Europe preview (2026-10-27) and follow-up (2026-11-11) |
| 5 | 1.2, notes | Edition that raised the sideboard to 10 UNCONFIRMED; "8 was normal before the September lists" | Raised from 8 to 10 in the July 2026 TR update, edition 7/16/2026, effective 2026-07-24. The 8-card lists are older lists, not a September effect | Riot, July 2026 TR changelog; 7/16/2026 TR PDF rule 601.1.c.1 |
| 6 | 2.1 | Source B: "60 lists … 2026-09-06", filed as Vendetta-era pre-ban lists | 59 lists; 57 contain no Vendetta card; creation dates 2025-11 to 2026-06 where known; four live pages show June 2026. They are pre-Vendetta lists | sample file; `raw/pa-list.jsonl`; four live deck pages |
| 7 | 2.1, 2.4 | Era label "VEN-preban" and the RAD-against-pre-ban comparison taken at face value | 55 of the 97 are pre-Vendetta lists; the comparison mixes two older pools | same as 6 |
| 8 | 0.1 | 1,237 base codes | 1,237 at the first fetch, 1,236 at the re-fetch (one printing served twice under another code); gallery payload is unstable | two gallery fetches |
| 9 | 0.10 | "15 RAD rows have an empty card type"; "several" Deploy gear mistyped | 13 RAD rows plus 2 UNL helper rows; exactly four Deploy gear, named | gallery `__NEXT_DATA__` |
| 10 | 0.8 | "not a rules update" given as a quotation | The article asks "Is this a rules update?" and answers "No" | Riot, "Testing Start of Game Rules" |
| 11 | 1.5 | Primer heading quoted loosely | Heading and sentence quoted as printed | Riot, "Deckbuilding Primer" |
| 12 | 2.7 | Power-4 lists "almost all big-control" | 52 of 64 | `out/results.json` |
| 13 | 2.9 | Ravenbloom Prefect counted as a gear answer without comment | It is one by text, but the classifier gives it no role, so `hate_gear` counts omit it | gallery text; `roles.mjs` output |
| 14 | 3.2 | Formula fit "49% exact, 90% within one" | 48.3% and 88.9% for the formula as written; 49% and 90% only for the script's per-domain variant | own recomputation; `analyze.mjs` line 257 |
| 15 | 3.2 | Cause of 9-3 splits labelled [D] | Relabelled [H]; the cause was never measured | no measurement exists in the scripts |
| 16 | 3.3 table C | Last column headed "P(>=1 after a 2-card dig when 0)" | It is the overall probability when you dig only on a zero hand; the conditional values are 17, 32, 45, 57, 68, 77, 85, 91% for K = 3 … 24 | own recomputation |
| 17 | 3.3 | "9 units costing ≤ 2 (the unit-aggro median)" | The median is 8; 9 is the p75. With 8: 77% by turn 2, 87% with a dig | `out/results.json`; own recomputation |
| 18 | 3.3 | A two-card mulligan "fixes that 82% of the time" | It finds an early unit 45% of the time; 82% is the overall rate | own recomputation |
| 19 | 3.3 | "8-4 appears only when the minor domain has almost no Power-2 cards" (no count) | 47 of 55 Piltover Archive lists on 8-4 have none | own count from `raw/pa-decks.jsonl` |
| 20 | 5.1 | "board size roughly doubles" inside a [D] bullet | Split into [D] and [H] | not a measurement |
| 21 | 5.2 | "FFA has no rule that binds deals" | True of the Core Rules; TR 704.5 restricts out-of-game incentives in sanctioned play | CR text search; TR 704.5, 704.5.a, 704.5.a.2 |
| 22 | 5.3 | Reason for the Master Yi 2v2 ban "not quoted" | Confirmed, with the effective date July 24, 2026 | Riot, "July Ban List Updates" |
| 23 | 6.2 | "big-control (median 0–6 …)" | 0–6 is p25–p75; the median is 5.5 | `out/results.json` |
| 24 | 6.4 | Against big-control: "87% of all lists run no sweeper"; "sweepers in few" | 23 of 66 big-control lists (35%) run a sweeper | `out/results.json` |
| 25 | 7.3 | "the 20 legends with n ≥ 8" | 23 legends | table in 2.5 |

### Left UNCONFIRMED

- Which cards the pending November ban will hit (announcement due 2026-11-13).
- Whether an exhausted rune may be recycled for Power (0.7). No sentence in the CR, the Radiance patch notes or the how-to-play page states it; it follows only from the absence of an exhaust cost in CR 164.2.b. The rune model in 3.3 and all of tables E to G depend on it.
- The true card types of the seven RAD rows typed "spell" and the five typed "unit" without Might (0.10). No second primary source lists them.
- Whether uninvolved players may play cards in another pair's showdown (0.11, 5.1). The Focus rules imply it; no sentence states it.
- The false-positive and false-negative counts in the validation tables of 2.2 and 4, and the 5% and 6-7% error rates read from them. They are hand counts that no script reproduces.
- Every placement parsed from a deck title (0.4), and whether a list named after an event was played in it.
- The outcome of the start-of-game playtest (0.8).
- "No community tier list or card-by-card multiplayer evaluation was found" (5.3): a negative search result that cannot be reproduced.
- The full Piltover Archive crawl: reproduced from the saved raw files, spot-checked live on 8 pages, not repeated in full.

### What the design must treat as heuristic

- The four archetype names and the whole cluster model (2.3): k-means on an unrepresentative sample. Riven is 5% of this sample and was 41% of the RC Europe field.
- All target and tolerance bands (2.4, 3.1) and the scoring rule built on them. They describe uploaded lists, 14% of which are pre-Vendetta, and the format changes again on 2026-11-23.
- The rune split formula (3.2): it matches the player's choice in under half of the lists, and the Seal adjustment is a guess.
- The castability model (3.3) beyond the first Power payment, and its dependence on the unconfirmed rule reading in 0.7.
- Role and axis labels (2.2, 4): regex output with known misses (Ravenbloom Prefect has no role; mistyped RAD rows).
- Every multiplayer multiplier, band shift and seat-risk factor in 5.2. There is no multiplayer deck data.
- All thresholds and templates in section 6, all weights in sections 7 and 8, and the calibration targets. None has been tested against results.
- Any use of title-parsed placements as a quality signal.
