# Riftbound deck theory from data: role bands, rune and consistency math, synergy axes, multiplayer valuation, game-plan templates, and 0-100 scores

Research date: 2026-11-11. All web sources below were fetched on 2026-11-11 unless a line says otherwise.

Labels used on every claim:
- **[F]** FACT from a primary source (playriftbound.com, the official PDFs, the official card gallery). Rule numbers are quoted.
- **[D]** DATA measured here from a named dataset, with n.
- **[H]** HEURISTIC: our own judgement, derived from [F] and [D] but not confirmed by either.
- **[C]** COMMUNITY source (not Riot). Useful, not authoritative.
- **UNCONFIRMED** means no primary source was found for it.

Rule citations: "CR" is the Core Rules PDF "Last Updated: 2026-10-09" (https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/5c7946f7c3b8c6e0faff85ab6dadc6d2e721ea94.pdf). "TR" is the Tournament Rules PDF "Last Updated October 9, 2026" (https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/861752822d217edf37d9febaeaf77a7d924c1bb6.pdf). Both are linked from the Rules Hub (https://playriftbound.com/en-us/rules-hub/).

Everything in sections 2-4 can be regenerated with the scripts in `docs/research/analysis/` (section 9).

## 0. Not confirmed, stale, or weak (read first)

1. **Local data is one set behind.** `~/github_repositories/GameLab/data/cards/cards.json` has 931 cards and no Radiance (RAD). The official gallery today has 1,408 printings, 1,237 base codes and 1,103 distinct names, including 195 RAD codes [F: https://playriftbound.com/en-us/card-gallery/]. `GameLab/data/rules/core-rules.md` is the 2026-07-16 edition; the current edition is 2026-10-09 and **its rule numbers moved** (deck construction 103.2 → 103.3, runes 103.3 → 103.4, modes 485-489 → 487-491, Recycle 416 → 417, Channel 430 → 431, Burn Out 431 → 432, Scoring 467 → 469). Do not cite the local file's numbers.
2. **Ban list in `Untitled/config/current-constructed-rules.json` is stale.** It stops at the July update. The Rules Hub ("Last updated: September 18, 2026") adds *Ekko, Recurrent* and *Stacked Deck*; see 1.1.
3. **The deck sample is not a random sample of the metagame.** It is 406 lists that players uploaded to Piltover Archive with a tournament-looking name. 153 of them are "Best of <legend>" lists, which gives every legend roughly one list per event and flattens meta share. A community tracker reports Kai'Sa at about 40% of the RC Europe field [C, UNCONFIRMED: riftdecks.com, seen only as a search snippet because the page returned HTTP 403]; in our Stuttgart-tagged subset Kai'Sa is 12 of 67. Bands are therefore "what a tournament-quality list of this shape looks like", not "what the field looks like".
4. **Placement is parsed from the deck title** with a regex (2.1). Only 106 lists carry a win or top-8 claim. Nothing verifies those claims against official standings.
5. **Uploaded lists can be edited after the event.** We keep the list as it was on 2026-11-11.
6. **Archetype names are ours.** The data produced four composition clusters; none of them is "combo". No Riot source defines archetypes.
7. **Exhausted runes can still be recycled for power.** This follows from CR 164.2.a/b (the recycle ability has no exhaust cost) but no rule sentence says it outright. The rune model in 3.3 depends on it. UNCONFIRMED as an explicit statement.
8. **Start-of-game rules are being playtested.** Riot is testing three go-second bonuses outside premier events and says this is "not a rules update" [F: https://playriftbound.com/en-us/news/organizedplay/testing-start-of-game-rules, published 2026-10-15]. Section 3 uses the current CR only.
9. **Bomb token text** comes from CR 187.12, not from the gallery (the gallery has no Bomb row).
10. **Gallery typing errors.** 15 RAD rows have an empty card type and several `[Deploy]` gear are typed "unit" with no Might. `build-cards.mjs` repairs these by rule (CR 830.1.a: Deploy is present on Gear) and flags them (`inferType`, `typeFixed`). Five rows remain typed "unit" with no Might (Consult the Heavens, Ephemeral Ward, Invigorating Bloom, Runeblade Anvil, Supernova). Deck analysis uses the type printed in the Piltover Archive deck record when a card appears in a list.
    A second group was found while validating section 4 and is **not** repaired in `cards-2026-11-11.json`: seven RAD rows are typed "spell" although five print a Might value (Battlefield Armorer RAD-130, Coalesced Energy RAD-016, Demacian Illuminators RAD-131, Overloaded Traveler RAD-072, Siren of the Shallows RAD-097) and two have gear-style `[Exhaust]:` abilities and no Might (Resplendent Rostrum RAD-046, Scrutinizing Scope RAD-064) [D: gallery fetched 2026-11-11]. Their true types are UNCONFIRMED here (no second primary source was read). Pool-level role and axis counts treat them as spells; deck-level counts are unaffected when the Piltover Archive record carries a type. The card sync must re-check these codes.
11. **Who may act in another pair's showdown in multiplayer** is now read from the rules (5.1): Focus passes to "the next Player in Turn Order" and the showdown ends when "all Players have passed once in sequence" (CR 347.1.b, 347.2.a, 347.2.b, 348). No rule limits Focus to the attacker and defender, but no rule sentence says "players outside the combat may play cards" either; the multipliers in 5.2 assume they may.
12. Synergy-axis regexes (section 4) were hand-checked on two 40-card samples (section 4, "Validation"). The structural tests (type, cost, Might) were not sampled because they cannot misread text; they are the weakest signals and are marked as such.
13. Multiplayer strategy has **no data** here: all 406 lists are 1v1 lists.

## 1. Facts the model must encode

### 1.1 Format state on 2026-11-11

- [F] Sets in the official gallery: OGN (Origins), OGS (Proving Grounds), SFD (Spiritforged), UNL (Unleashed), VEN (Vendetta), RAD (Radiance). Radiance released 2026-10-23, Pre-Rifts 2026-10-16 to 22 (https://playriftbound.com/en-us/news/announcements/the-radiance-overview/, "Updated October 16, 2026").
- [F] "All sets currently produced for Riftbound are legal"; rotation is intended "starting in 2028" (Rules Hub, "Constructed Format Legality, Last updated: September 18, 2026").
- [F] Banned in sanctioned Constructed (Rules Hub): cards *Called Shot; Ekko, Recurrent; Draven, Vanquisher; Fight or Flight; Scrapheap; Stealthy Pursuer; Stacked Deck*. Battlefields *The Arena's Greatest; Aspirant's Climb; Dreaming Tree; Obelisk of Power; Reaver's Row*.
- [F] 2v2 Constructed uses the same list plus the legend *Master Yi, Wuju Bladesman* (Rules Hub, "2v2 Constructed Legality").
- [F] Ekko, Recurrent and Stacked Deck were banned effective 2026-09-18 (https://playriftbound.com/en-us/news/announcements/september-ban-list-updates-effective-september-18-2026).
- [F] Radiance adds keywords Deploy (CR 830), Disarm (CR 831), Show Off (CR 832), Equipment that can become units, and Bomb gear tokens (CR 187.12; overview article above). Radiance has nine new legends in the gallery: Evelynn (body/chaos), Ekko (fury/mind), Jarvan IV (body/order), Ziggs (fury/chaos), Mordekaiser (fury/order), Orianna (calm/mind), K'Sante (calm/body), Seraphine (mind/order), Riven (calm/chaos). The gallery now lists 58 distinct legend names.
- [F] RC Europe took place in Stuttgart; the preview article dated 2026-10-27 calls it "next month" (https://playriftbound.com/en-us/news/organizedplay/all-eyes-on-rc-europe). [C] A community guide gives the dates as November 6-8, 2026 (gamertagmythras.com, via search snippet).
- [F] Nothing newer than this changes deck building: the official news index on 2026-11-11 lists only two November items, "Riftbound World Showcase" (2026-11-05, organized play) and a product-drawing FAQ (2026-11-06); the latest rules, ban and set articles are the October and September ones cited here (https://playriftbound.com/en-us/news/).

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
- [D] Sideboard size in the sample: 8 was normal before the September lists (53 of 97 "VEN-preban" lists have exactly 8), 10 afterwards (240 of 254 RAD-era lists). The TR change itself was not traced to a changelog. UNCONFIRMED which TR edition raised it.

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
- "Play more copies of your Chosen Champion."
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
- **B. Local sample** `~/github_repositories/GameLab/data/decks/samples/piltover-archive-2026-09-06.json` (60 lists from the same site, 2026-09-06). Lists already present in A are skipped. Rows where the legend or the runes had been imported into `main` are repaired by card type.
- **Cards:** the official gallery page (one request, `__NEXT_DATA__`), reduced to one row per name by `build-cards.mjs`. Every card in every list matched a gallery name (0 misses).

Counts [D]:
- 419 lists loaded, **406 valid** (40 main including the Chosen Champion, 12 runes, 3 battlefields, legend known). 351 from A, 55 from B.
- Era: 254 "RAD" (contains a RAD card or edited on or after 2026-10-16), 55 "VEN-postban" (edited 2026-09-18 to 10-15), 97 "VEN-preban". 38 lists contain a card that is banned today; 37 of them are pre-ban, none is RAD-era.
- Placement parsed from the title: 36 win, 70 top 8 (rank 2-8 or "top 4/8"), 22 top 64, 153 "best of <legend>", 125 event name only. So 281 lists carry some placement signal and 106 carry a win/top-8 claim.
- Events named: Stuttgart (RC Europe) 67, Orlando 25K 47, Sacramento 42, Hartford RQ 24, Singapore RQ 19, Los Angeles RQ 17, Utrecht RQ 14, Melbourne 10, Vancouver RQ 8, Chengdu 5, Sydney RQ 4, other or unspecified 149.
- 55 legend champion tags appear. Per-legend rows below need n ≥ 5.

Counting convention: all counts are **copies in the 40**, including the Champion Zone copy.

### 2.2 Role classifier

Rules live in `analysis/roles.mjs`. Reminder text in parentheses is stripped first, so reminder wording never assigns a role. A card can hold several roles. The exact rules:

```js
export const ROLE_RULES = {
  // --- interaction ---
  removal_kill: (t) => sentences(t).some((s) => /\b(kill|banish) (?!me\b|this\b|it\b|them\b)(an? |another |up to \w+ |any number of |all |each |that |those |target |the |one )?(of )?(?!friendly)(\w+ ){0,3}units?\b/i.test(s) && !/\b(kill|banish) (an? |another |up to \w+ |any number of |\d+ )?(other )?friendly\b/i.test(s) && !/as an additional cost/i.test(s) && !/banish (an? |that |target )?(friendly )?unit, then its owner plays it/i.test(s)) || /choose an enemy unit[^.]*\.[^.]*\bkill it\b|each (player|opponent) (must )?kills? one of their units|when any unit takes damage[^.]*kill it|take control of (it|an?|that|target)|\bgive (an?|that|target|up to)[^.]*\b(unit|gear)\b[^.]*\[temporary\]/i.test(t),
  removal_damage: (t) => sentences(t).some((s) => /\bdeals? (\d+|x|damage equal to[^.]*?|that much( damage)?|twice[^.]*?)( damage)? (split (among|between) |divided )?(to|among) (?!me\b)/i.test(s) || /\bdeals? damage equal to (its|my|their) might (split )?(to|among)/i.test(s)),
  removal_bounce: (t) => sentences(t).some((s) => /\breturn (an? |another |all |each |up to \w+ |that |those |target )[^.]*\b(units?|gear)\b[^.]*to (its|their) owners?'s? hands?|to their owners' hands/i.test(s) && !/from (your|a|their) trash/i.test(s) && !/\breturn (an? |another )?friendly\b(?![^.]*\benemy\b)/i.test(s)),
  stun: (t) => /\[stun\]|\bstuns?\b (an?|all|each|up to|that|it|them|target|another)/i.test(t),
  sweeper: (t) => /\b(kill|banish|stun|return|deals? \d+( damage)? to) (all|each)\b(?! friendly)(?! of up to)[^.]*\bunits?\b|kill the rest|split among enemy units/i.test(t),
  debuff: (t) => /-\d+ \[might\]|\[disarm|reduce[^.]*might/i.test(t),
  counterspell: (t) => /\bcounter (an? |that |target |it\b|the )[^.]*?(spell|abilit|unless)|\bcounter (it|that spell)\b|gain control of it and you may make new choices/i.test(t),
  hate_gear: (t) => sentences(t).some((s) => /\b(kill|banish|return) (an? |all |each |up to \w+ |target |another |that )?(enemy )?(unit or )?gear\b/i.test(s) && !/(kill|banish|return) (an? |another )?friendly/i.test(s) && !/as an additional cost|from your trash/i.test(s)) || /choose an enemy gear/i.test(t),
  hate_trash: (t) => /(banish|recycle)[^.]*(opponent|enemy|each player|any player|a player)[^.]*trash|from (an opponent's|any|each player's) trash|opponents' trashes|their owners recycle them/i.test(t),
  hand_attack: (t) => /(opponent|they|each player)[^.]*\bdiscards?\b|reveals? their hand\.[^.]*\b(choose|discard|recycle|banish)\b[^.]*\b(card|it)\b/i.test(t),
  // --- card economy ---
  draw: (t) => sentences(t).some((s) => /\bdraws? (\d+|a card|x\b|that many|cards|it\b)/i.test(s) && (/\byou\b[^.]*\bdraw/i.test(s) || !/\b(they|opponents?|that player|its controller|their owners?)\b[^.]*\bdraws?\b/i.test(s)) && !/would[^.]*draws? 1 instead/i.test(s)) || /until[^.]*you may play (that card|it|them)/i.test(t),
  selection: (t) => /\[predict|look at the top|reveals? the top|reveal cards from the top|from among them/i.test(t),
  recursion: (t) => /(play|return|put|draw)[^.:]*from (your|their|a|any) trash|in your trash[^.]*\.\s*play it|from your trash (to|into)|\[flow\]/i.test(t),
  discard_outlet: (t) => /\bdiscard (\d+|a card|your hand|x\b|any number)/i.test(t) && !/(opponent|they) discards?/i.test(t),
  // --- resources ---
  ramp: (t) => /\bchannel (\d+|a) runes?|\[add\]|\badd \[|gold gear tokens?|\bready (up to )?(\d+|a|your|all your) runes?|\b(your|next|friendly|other)\b[^.]*\bcosts? (\[[^\]]+\])+ less/i.test(t),
  // --- board / tempo ---
  movement: (t) => /\bmove (an? |another |up to \w+ |any number of |all |each |that |those |target |it\b|them\b|me\b)|\[ganking\]|\bswap\b[^.]*\blocations?\b/i.test(t.replace(/can't move[^.]*/gi, '')),
  tempo_ready: (t) => /\bready (me|it|them|an? |another |up to \w+ (friendly |other )?units?|all |each |that |those )(?!runes?)|enters? ready|\[accelerate\]|\[ambush\]/i.test(t.replace(/when you (choose or )?ready me/gi, '')),
  combat_trick: (t, c) => c.type === 'spell' && /(give|gives|gets?|has|have)[^.]*[+-]\d+ \[might\]|\+\[might\] equal|\[(assault|shield|tank|deflect)( \d+)?\][^.]*this turn|\bprevent\b|double[^.]*might|swap the mights|\[buff\]|\bbuff (an?|another|up to|each|all|it)\b/i.test(t),
  protection: (t) => sentences(t).some((s) => !/\bignore \[deflect/i.test(s) && (/can't be chosen|\bprevent\b|can't be (killed|dealt|damaged)|give[^.]*\[(deflect|shield)( \d+)?\]|\[deflect( \d+)?\]/i.test(s.replace(/tokens? with \[deflect\]/gi, '')) || /\b(friendly unit|i|me|unit you control)\b[^.]*would die[^.]*instead/i.test(s))),
  buff: (t) => /\[buff\]|\bbuffs?\b (an?|me|another|it|each|all|up to|that|them|two|three)\b/i.test(t),
  token_maker: (t) => /\bunit tokens?\b/i.test(t),
  // --- win pressure ---
  points: (t) => /\bscores? \d+ points?|\byou score\b|gains? \d+ points?|win the game|take (a|an extra|another) turn/i.test(t.replace(/would score \d+ points?/gi, '')),
  point_denial: (t) => /can't score|would score[^.]*instead|loses? \d+ points?/i.test(t),
  score_trigger: (t) => /when (i|you|a friendly unit|one or more friendly units) (conquers?|holds?)|when you (conquer|hold)|conquer effects|hold effects/i.test(t),
};
export const BUCKETS = {
  removal: ['removal_kill', 'removal_damage', 'removal_bounce', 'stun', 'sweeper'],
  hard_removal: ['removal_kill', 'removal_damage'],
  card_flow: ['draw', 'selection'],
  draw: ['draw'],
  movement: ['movement'],
  tempo: ['movement', 'tempo_ready'],
  combat_tricks: ['combat_trick'],
  counterspells: ['counterspell'],
  protection: ['protection'],
  ramp: ['ramp'],
  finishers: ['points', 'topend'],
  recursion: ['recursion'],
  hate: ['hate_gear', 'hate_trash', 'hand_attack', 'point_denial'],
};
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

Read this as: the last unbiased random round (3) had about 5% label errors, and the cards that matter most for the bands (rounds 4 and 5) were corrected individually. Rounds 4 and 5 were not re-sampled after their fixes.

Known remaining gaps [H]: conditional or pronoun-only removal ("if it is stunned, kill it") is caught only for a few phrasings; `ramp` includes one-shot Gold tokens; `tempo_ready` mixes "enters ready" units with "ready another unit" effects; cards whose value is a static combat bonus (Mask of Foresight) have no role. A sixth check (the section 4 samples) found that `buff` and `combat_trick` matched "spend a buff as an additional cost" (Call to Glory, Wallop, Kraken Hunter) because of a missing word boundary; this was fixed and the analysis re-run. Only the `x_buff` means moved (Call to Glory is in 19 lists); no band, cluster or centroid changed.

### 2.3 Archetypes found in the data

Method [D]: k-means on 12 z-scored composition features, k = 3, 4, 5, 30 seeded restarts (`analyze.mjs`). Inertia 3078 / 2735 / 2513. k = 4 is used because its clusters have a plain reading and k = 5 only splits one of them.

Centroids in raw units (copies per deck), with the z-scale needed to classify a new deck by nearest centroid:

| feature | mean | sd | big-control (n=66) | gear-engine (n=69) | spell-tempo (n=139) | unit-aggro (n=132) |
|---|---|---|---|---|---|---|
| units | 19.039 | 6.459 | 17.56 | 14.04 | 17.19 | 24.33 |
| avgEnergy | 2.909 | 0.577 | 3.93 | 2.56 | 2.65 | 2.85 |
| e01 | 6.938 | 3.347 | 6.3 | 10.19 | 8.09 | 4.35 |
| e2 | 14.953 | 4.014 | 10.67 | 14.64 | 17.33 | 14.76 |
| e6p | 3.675 | 3.666 | 10.71 | 2.41 | 2.68 | 1.86 |
| r_removal | 7.707 | 4.39 | 11.35 | 7.58 | 5.98 | 7.77 |
| r_counterspells | 1.584 | 1.698 | 0.53 | 1.09 | 3.51 | 0.34 |
| r_draw | 8.682 | 3.735 | 10.97 | 9.52 | 10.47 | 5.21 |
| r_combat_tricks | 5.276 | 3.155 | 3.5 | 3.03 | 7.52 | 4.98 |
| r_tempo | 7.682 | 4.564 | 3.32 | 5.07 | 7.83 | 11.08 |
| x_topend | 3.214 | 2.763 | 7.41 | 1.67 | 2.68 | 2.48 |
| gear | 4.869 | 4.371 | 3.3 | 10.67 | 4.64 | 2.86 |

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

| metric | ALL n=406 | unit-aggro n=132 | spell-tempo n=139 | gear-engine n=69 | big-control n=66 | placed win/top8 n=106 | RAD era n=254 |
|---|---|---|---|---|---|---|---|
| units | 16–23 (10–28) | 22–27 (20–30) | 16–20 (12–21) | 8–20 (5–20) | 14–22 (4–30) | 17–23 (11–26) | 17–22 (10–28) |
| spells | 12–20 (8–23) | 10–16 (8–18) | 16–21 (14–22) | 12–21 (7–24) | 17–24 (7–25) | 13–20 (10–22) | 12–19 (8–23) |
| gear | 2–7 (0–10) | 1–4 (0–6) | 2–6 (0–8) | 7–15 (5–18) | 0–5 (0–10) | 2–6 (0–9) | 2–7 (0–11) |
| e01 | 5–9 (3–12) | 3–6 (0–7) | 6–10 (5–12) | 8–12 (8–13) | 4–8 (3–9) | 5–9 (4–12) | 5–9 (2–11) |
| e2 | 13–18 (10–20) | 13–17 (11–19) | 16–19 (14–20) | 13–17 (11–18) | 9–13 (8–14) | 13–18 (10–20) | 12–18 (9–19) |
| e3 | 5–10 (3–13) | 9–13 (6–15) | 4–8 (3–10) | 6–10 (5–12) | 3–6 (0–11) | 5–10 (3–13) | 5–11 (3–14) |
| e4 | 2–6 (1–8) | 3–7 (3–9) | 2–4 (0–6) | 2–4 (1–5) | 3–6 (0–13) | 2–6 (1–8) | 3–6 (1–7) |
| e5 | 1–4 (0–5) | 1–4 (0–5) | 2–3 (1–4) | 0–3 (0–5) | 0–4 (0–6) | 1–3 (0–5) | 1–4 (0–5) |
| e6p | 1–4 (0–10) | 0–3 (0–4) | 1–4 (0–5) | 1–3 (0–3) | 10–11 (9–12) | 1–4 (0–10) | 1–5 (0–10) |
| avgEnergy | 2.55–3.08 (2.33–3.77) | 2.70–2.98 (2.50–3.20) | 2.41–2.88 (2.27–3.00) | 2.38–2.73 (2.20–2.85) | 3.54–4.17 (3.39–4.36) | 2.55–2.99 (2.30–3.77) | 2.66–3.17 (2.45–3.77) |
| units_le2 | 5–9 (1–9) | 8–9 (5–11) | 6–9 (5–9) | 3–8 (0–9) | 0–6 (0–8) | 6–9 (2–9) | 5–8 (1–9) |
| units_le3 | 8–14 (5–17) | 13–18 (11–21) | 8–11 (6–13) | 6–14 (1–15) | 2–10 (0–14) | 8–13 (5–16) | 8–14 (5–17) |
| units_e2to4 | 11–18 (7–22) | 17–23 (15–26) | 11–14 (9–16) | 8–16 (2–17) | 3–14 (0–14) | 12–16 (7–21) | 12–18 (7–24) |
| powerCards | 13–19 (12–21) | 13–19 (11–22) | 13–15 (12–17) | 14–19 (11–21) | 16–21 (13–24) | 13–18 (12–21) | 13–18 (11–21) |
| power2Cards | 2–5 (1–6) | 3–5 (2–6) | 1–3 (0–4) | 2–3 (0–4) | 5–7 (4–10) | 3–5 (1–6) | 2–5 (1–6) |
| powerPips | 16–24 (14–29) | 16–24 (14–28) | 15–18 (14–20) | 17–22 (12–26) | 26–31 (23–34) | 16–24 (14–29) | 16–24 (14–29) |
| maxPower | 2–3 (2–4) | 2–2 (2–3) | 2–2 (1–3) | 2–2 (1–2) | 4–4 (2–4) | 2–3 (2–4) | 2–3 (2–4) |
| runeMajor | 6–7 (6–8) | 6–8 (6–8) | 6–7 (6–7) | 7–8 (6–9) | 7–7 (6–8) | 6–7 (6–8) | 6–7 (6–8) |
| distinct | 17–20 (16–21) | 17–20 (16–23) | 18–20 (17–21) | 17–20 (16–21) | 17–19 (17–20) | 17–20 (16–22) | 17–20 (16–22) |
| x3 | 7–9 (5–11) | 6–9 (5–11) | 6–9 (6–9) | 7–10 (6–11) | 8–9 (7–10) | 7–10 (5–11) | 6–9 (5–11) |
| x2 | 4–7 (2–9) | 4–8 (2–10) | 5–7 (3–8) | 3–7 (2–7) | 4–6 (3–7) | 3–7 (2–8) | 4–7 (2–9) |
| x1 | 3–7 (2–9) | 3–6 (1–10) | 4–7 (3–9) | 3–8 (1–9) | 3–5 (2–7) | 3–7 (2–10) | 3–7 (2–9) |
| chosenCopies | 1–1 (1–1) | 1–1 (1–1) | 1–1 (1–2) | 1–1 (1–1) | 1–1 (1–1) | 1–1 (1–1) | 1–1 (1–1) |
| otherChampionUnits | 1–7 (0–9) | 6–10 (3–13) | 2–5 (1–8) | 0–4 (0–6) | 0–3 (0–6) | 2–7 (0–8) | 1–7 (0–9) |
| championUnits | 3–8 (1–11) | 7–11 (4–14) | 3–7 (2–9) | 1–5 (1–7) | 1–4 (1–7) | 3–8 (1–9) | 2–8 (1–11) |
| signature | 0–3 (0–3) | 0–3 (0–3) | 0–3 (0–3) | 0–3 (0–3) | 0–2 (0–3) | 0–3 (0–3) | 0–3 (0–3) |
| r_removal | 4–11 (2–13) | 5–11 (2–12) | 3–8 (2–10) | 3–11 (0–17) | 10–13 (8–14) | 4–10 (2–13) | 5–11 (3–13) |
| r_hard_removal | 1–9 (0–12) | 2–7 (1–12) | 0–3 (0–5) | 0–9 (0–14) | 9–12 (8–13) | 0–9 (0–11) | 1–10 (0–13) |
| x_removal_kill | 0–2 (0–6) | 0–3 (0–6) | 0–0 (0–0) | 0–2 (0–9) | 0–5 (0–8) | 0–1 (0–7) | 0–2 (0–6) |
| x_removal_damage | 0–6 (0–10) | 2–4 (0–7) | 0–3 (0–5) | 0–6 (0–9) | 6–12 (3–13) | 0–6 (0–9) | 0–7 (0–10) |
| x_removal_bounce | 0–3 (0–6) | 0–2 (0–4) | 0–4 (0–6) | 0–4 (0–6) | 0–0 (0–0) | 0–3 (0–6) | 0–3 (0–6) |
| x_stun | 0–2 (0–3) | 0–2 (0–3) | 1–3 (0–4) | 0–2 (0–3) | 0–0 (0–2) | 0–2 (0–3) | 0–2 (0–3) |
| x_sweeper | 0–0 (0–1) | 0–0 (0–0) | 0–0 (0–1) | 0–0 (0–0) | 0–1 (0–2) | 0–0 (0–1) | 0–0 (0–1) |
| r_card_flow | 7–11 (5–14) | 4–8 (3–9) | 9–12 (8–14) | 8–12 (7–14) | 10–15 (9–18) | 8–12 (6–14) | 7–11 (5–14) |
| r_draw | 6–11 (4–13) | 3–7 (2–8) | 9–12 (7–14) | 7–12 (6–14) | 9–12 (8–16) | 7–11 (5–14) | 6–11 (5–14) |
| r_movement | 0–5 (0–8) | 1–6 (0–10) | 4–6 (3–8) | 0–5 (0–6) | 0–0 (0–0) | 0–5 (0–8) | 0–5 (0–8) |
| r_tempo | 4–10 (3–15) | 6–16 (5–18) | 6–9 (5–10) | 3–7 (2–8) | 2–4 (0–5) | 5–10 (3–14) | 4–10 (3–15) |
| r_combat_tricks | 3–7 (1–10) | 3–6 (2–9) | 5–9 (4–11) | 2–4 (0–6) | 0–5 (0–7) | 3–7 (0–10) | 3–7 (0–9) |
| x_debuff | 0–3 (0–8) | 0–0 (0–3) | 0–4 (0–7) | 0–4 (0–6) | 0–8 (0–9) | 0–3 (0–7) | 0–3 (0–8) |
| r_counterspells | 0–3 (0–4) | 0–1 (0–1) | 3–4 (3–5) | 0–2 (0–3) | 0–0 (0–2) | 0–3 (0–4) | 0–3 (0–4) |
| r_protection | 0–3 (0–5) | 0–3 (0–4) | 2–5 (0–7) | 0–0 (0–2) | 0–0 (0–2) | 0–4 (0–5) | 0–3 (0–5) |
| r_ramp | 1–6 (0–8) | 0–4 (0–6) | 0–5 (0–7) | 2–6 (1–7) | 3–9 (2–11) | 1–6 (0–9) | 2–6 (0–9) |
| r_finishers | 1–4 (0–8) | 1–3 (0–4) | 1–4 (0–5) | 0–3 (0–3) | 6–10 (6–11) | 1–5 (0–9) | 2–5 (0–9) |
| x_points | 0–0 (0–2) | 0–0 (0–0) | 0–0 (0–0) | 0–0 (0–0) | 0–2 (0–2) | 0–0 (0–2) | 0–0 (0–2) |
| x_topend | 1–4 (0–7) | 1–3 (0–4) | 1–4 (0–5) | 0–3 (0–3) | 4–9 (4–11) | 1–4 (0–8) | 2–4 (0–8) |
| r_recursion | 0–3 (0–5) | 0–3 (0–6) | 0–1 (0–3) | 0–3 (0–6) | 0–3 (0–3) | 0–3 (0–4) | 0–3 (0–5) |
| r_hate | 0–1 (0–3) | 0–2 (0–2) | 0–1 (0–1) | 0–2 (0–3) | 0–2 (0–3) | 0–1 (0–2) | 0–1 (0–2) |
| x_token_maker | 0–4 (0–7) | 0–6 (0–9) | 0–1 (0–6) | 0–5 (0–13) | 0–4 (0–5) | 0–3 (0–6) | 0–4 (0–8) |
| x_buff | 0–0 (0–3) | 0–1 (0–3) | 0–1 (0–3) | 0–0 (0–0) | 0–0 (0–0) | 0–1 (0–3) | 0–0 (0–3) |
| x_score_trigger | 0–3 (0–4) | 0–3 (0–5) | 0–2 (0–3) | 0–1 (0–3) | 0–4 (0–4) | 0–3 (0–5) | 0–3 (0–4) |
| interaction | 12–18 (8–21) | 10–15 (7–18) | 15–18 (14–20) | 8–16 (4–22) | 14–20 (12–21) | 12–18 (8–21) | 12–18 (9–21) |
| sp_reaction | 3–9 (1–12) | 1–4 (0–5) | 8–13 (7–14) | 3–6 (2–9) | 5–6 (3–8) | 3–9 (3–12) | 3–8 (0–12) |
| sp_action | 3–7 (1–9) | 3–7 (2–9) | 3–7 (2–8) | 3–6 (0–11) | 2–5 (0–7) | 3–6 (2–9) | 3–6 (1–8) |
| sp_slow | 2–7 (0–10) | 3–6 (2–8) | 0–5 (0–6) | 3–6 (3–8) | 6–13 (2–17) | 2–7 (0–9) | 2–7 (0–10) |
| hiddenCards | 2–6 (0–10) | 1–6 (0–12) | 3–8 (2–10) | 2–8 (0–9) | 1–3 (0–4) | 2–8 (1–10) | 2–7 (0–10) |
| sideTotal | 10–10 (8–10) | 10–10 (8–10) | 10–10 (8–10) | 10–10 (8–10) | 10–10 (8–10) | 10–10 (8–10) | 10–10 (10–10) |

Things worth noticing [D]:
- The curve is low. Cards costing ≤ 2 Energy: p10/p25/p50/p75/p90 = 16/19/22/25/28 of 40. Energy 3: 3/5/7/10/13. Energy 4-5: 3/4/6/8/10. Energy 6+: 0/1/3/4/10.
- 87% of lists run no sweeper; 44% run no counterspell; 23% run no kill or damage removal at all and rely on bounce, stun and tricks.
- Only 15% of lists run a card that scores a point directly or takes an extra turn. Winning is done on battlefields.
- Reaction-speed spells average 6.2 copies, Action 4.9, slow 5.0.
- The "placed win/top 8" column is close to the "ALL" column on every row, so the bands do not depend on trusting titles.
- The RAD-era column is slightly heavier (median average Energy 2.83 against 2.65 pre-ban) with more gear.

### 2.5 Per legend and per domain pair

Cells are p25-p50-p75; `avgEnergy` is the median [D]. Legends with n ≥ 5 only.

**per legend (champion tag), p25-p50-p75**

| group | n | units | spells | gear | avgEnergy | e01 | e2 | e3 | e4 | e5 | e6p | powerPips | runeMajor | chosenCopies | championUnits | signature | r_removal | r_card_flow | r_tempo | r_combat_tricks | r_counterspells | r_finishers | x3 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Kai'Sa | 23 | 18-20-22 | 19-20-21 | 0-0-1 | 3.58 | 7-8-8 | 11-13-14 | 4-5-6 | 4-4-5 | 0-0-0 | 10-11-12 | 28-30-32 | 7-7-7 | 1-1-1 | 1-1-1 | 0-0-0 | 10-11-13 | 10-11-11 | 4-4-4 | 5-5-5 | 0-0-0 | 9-10-10 | 8-9-9 |
| Riven | 22 | 19-20-21 | 13-14-15 | 6-6-6 | 2.95 | 4-5-5 | 18-19-20 | 6-6-7 | 4-4-4 | 2-2-2 | 3-4-4 | 16-17-18 | 6-7-7 | 1-1-1 | 3-3-3 | 3-3-3 | 7-7-9 | 11-11-12 | 8-8-10 | 5-7-7 | 3-3-4 | 3-4-4 | 7-8-8 |
| Kennen | 17 | 19-20-21 | 13-14-14 | 5-6-7 | 2.73 | 8-8-8 | 16-16-16 | 9-10-10 | 3-3-4 | 0-0-0 | 3-3-3 | 19-20-21 | 9-9-9 | 1-1-1 | 5-5-6 | 3-3-3 | 5-7-8 | 10-11-11 | 7-7-8 | 2-2-2 | 1-1-1 | 3-3-3 | 6-6-7 |
| Kha'Zix | 15 | 21-21-23 | 16-16-17 | 0-2-3 | 2.67 | 5-5-5 | 14-14-15 | 11-12-13 | 4-4-5 | 3-4-4 | 0-1-1 | 23-24-24 | 6-6-6 | 1-1-1 | 9-9-11 | 3-3-3 | 5-5-6 | 5-7-8 | 16-16-18 | 6-6-7 | 0-1-1 | 2-3-3 | 5-5-7 |
| Rek'Sai | 15 | 25-27-30 | 6-13-15 | 0-1-4 | 2.75 | 3-4-5 | 16-17-22 | 7-10-15 | 3-3-3 | 0-1-2 | 3-3-3 | 16-16-18 | 6-7-8 | 1-1-1 | 1-2-4 | 0-0-3 | 10-12-12 | 3-3-3 | 4-5-6 | 0-0-2 | 0-0-0 | 3-3-3 | 11-11-12 |
| Master Yi | 14 | 18-19-20 | 17-19-20 | 2-2-3 | 2.45 | 7-12-12 | 14-15-17 | 4-5-6 | 2-3-4 | 3-3-3 | 2-2-4 | 18-19-22 | 7-7-7 | 1-1-1 | 4-5-6 | 0-1-1 | 2-3-4 | 9-9-10 | 7-9-10 | 8-11-11 | 3-3-4 | 5-5-5 | 8-9-9 |
| Lillia | 14 | 10-11-12 | 21-21-22 | 8-8-9 | 2.36 | 9-10-11 | 19-21-21 | 3-4-4 | 0-1-1 | 3-3-3 | 2-2-3 | 14-15-17 | 6-6-7 | 1-1-2 | 2-2-3 | 0-0-0 | 1-2-3 | 10-11-13 | 6-7-8 | 9-9-11 | 3-3-3 | 1-1-2 | 8-9-9 |
| Viktor | 13 | 6-13-15 | 22-23-27 | 3-5-7 | 2.67 | 5-6-9 | 16-18-18 | 4-7-10 | 1-2-2 | 5-5-6 | 1-2-2 | 21-23-25 | 6-7-7 | 1-1-1 | 2-3-6 | 0-0-0 | 16-18-18 | 7-7-7 | 1-2-5 | 3-4-5 | 0-0-0 | 1-1-2 | 8-9-11 |
| Irelia | 13 | 13-14-16 | 20-20-22 | 5-5-6 | 2.20 | 10-11-12 | 16-17-18 | 5-6-8 | 4-5-5 | 1-1-1 | 0-0-0 | 14-14-15 | 6-6-6 | 1-1-1 | 4-4-4 | 3-3-3 | 3-4-4 | 9-10-11 | 8-8-8 | 8-9-9 | 4-5-5 | 0-0-0 | 6-6-7 |
| Vex | 13 | 18-19-20 | 15-16-19 | 2-4-6 | 2.58 | 6-8-8 | 16-18-18 | 8-9-11 | 1-2-4 | 1-1-2 | 1-3-4 | 15-17-19 | 6-7-7 | 1-1-1 | 4-6-8 | 0-0-1 | 7-8-9 | 6-7-7 | 5-7-8 | 4-5-6 | 3-4-4 | 3-3-4 | 6-6-7 |
| Akali | 12 | 18-18-19 | 15-16-17 | 6-6-6 | 2.85 | 6-6-7 | 17-18-18 | 3-3-4 | 7-7-8 | 2-3-3 | 3-3-3 | 18-18-19 | 7-7-7 | 1-1-1 | 6-6-7 | 3-3-3 | 10-10-10 | 11-11-12 | 8-9-9 | 4-4-4 | 4-4-4 | 3-3-3 | 8-9-10 |
| Evelynn | 12 | 20-26-28 | 8-11-16 | 4-4-4 | 3.20 | 0-3-4 | 2-4-10 | 15-25-26 | 5-6-6 | 3-4-4 | 1-2-2 | 13-15-17 | 6-8-8 | 1-1-1 | 12-13-14 | 0-0-1 | 6-6-9 | 5-5-5 | 5-5-8 | 6-7-8 | 0-0-0 | 3-4-4 | 5-5-5 |
| LeBlanc | 11 | 29-30-30 | 7-7-8 | 3-3-3 | 3.95 | 3-3-4 | 9-10-10 | 11-11-12 | 0-0-0 | 5-5-6 | 10-10-10 | 28-29-30 | 8-8-8 | 1-1-1 | 7-7-7 | 2-2-2 | 13-13-14 | 11-13-13 | 4-4-4 | 0-0-1 | 0-0-0 | 10-10-11 | 8-9-10 |
| Orianna | 10 | 11-11-12 | 12-16-17 | 10-14-17 | 2.88 | 9-9-10 | 15-16-20 | 5-6-7 | 0-0-2 | 2-4-5 | 2-5-6 | 16-17-19 | 7-7-8 | 1-1-1 | 1-1-3 | 1-3-3 | 2-5-6 | 12-13-17 | 6-6-7 | 3-6-8 | 3-4-4 | 0-2-5 | 8-9-10 |
| Diana | 10 | 17-17-18 | 20-21-22 | 1-2-3 | 2.45 | 6-6-9 | 16-17-19 | 9-9-10 | 2-3-3 | 3-3-3 | 0-0-0 | 16-18-18 | 6-7-7 | 1-1-1 | 8-9-9 | 3-3-3 | 8-8-9 | 11-11-12 | 9-9-10 | 8-9-9 | 2-2-2 | 0-0-0 | 7-7-9 |
| Rengar | 10 | 30-30-30 | 10-10-10 | 0-0-0 | 2.83 | 4-5-6 | 12-12-13 | 13-14-14 | 6-6-6 | 1-2-2 | 1-3-3 | 14-16-16 | 8-8-8 | 1-1-1 | 7-8-8 | 3-3-3 | 2-2-2 | 8-8-8 | 18-18-19 | 5-5-5 | 0-0-0 | 2-4-4 | 8-9-9 |
| Ivern | 9 | 22-23-25 | 14-17-18 | 0-0-0 | 2.95 | 5-5-6 | 17-18-18 | 6-6-7 | 1-2-4 | 2-3-4 | 2-4-5 | 14-17-17 | 6-6-7 | 2-2-2 | 4-4-6 | 1-1-1 | 4-5-6 | 8-9-10 | 4-5-7 | 5-7-9 | 3-4-4 | 1-2-5 | 6-6-8 |
| Jayce | 9 | 4-4-4 | 24-26-26 | 10-10-12 | 4.17 | 7-8-9 | 9-10-10 | 3-3-3 | 6-6-6 | 1-2-2 | 11-11-11 | 29-29-29 | 7-7-7 | 1-1-1 | 1-1-1 | 0-0-0 | 9-10-10 | 18-18-19 | 0-0-0 | 0-0-0 | 0-1-2 | 6-6-7 | 8-9-11 |
| Sett | 8 | 21-21-23 | 14-16-16 | 3-3-4 | 2.58 | 10-10-11 | 9-10-11 | 9-11-13 | 4-4-5 | 3-4-4 | 0-0-1 | 15-17-21 | 7-7-7 | 1-1-1 | 7-8-8 | 3-3-3 | 4-4-5 | 2-5-7 | 12-14-16 | 10-11-11 | 0-1-1 | 1-3-3 | 8-10-10 |
| Ekko | 8 | 20-20-24 | 12-12-14 | 0-8-8 | 2.50 | 5-13-13 | 13-13-13 | 5-5-6 | 3-3-7 | 2-3-3 | 3-3-5 | 17-17-21 | 6-6-6 | 1-1-1 | 3-3-4 | 0-0-0 | 4-4-7 | 8-9-9 | 8-8-9 | 3-3-3 | 0-0-0 | 3-3-5 | 8-9-9 |
| Mordekaiser | 8 | 30-30-30 | 7-7-7 | 2-3-4 | 3.17 | 0-0-0 | 16-17-17 | 9-9-10 | 7-7-8 | 4-4-4 | 1-2-4 | 29-29-31 | 6-7-7 | 1-1-1 | 10-11-12 | 3-3-3 | 11-12-12 | 6-6-6 | 7-8-10 | 3-3-4 | 0-0-0 | 1-1-3 | 6-8-8 |
| Ornn | 8 | 15-15-16 | 5-6-8 | 17-19-19 | 1.96 | 12-12-13 | 16-17-18 | 8-9-9 | 0-1-2 | 1-1-1 | 0-0-0 | 23-24-24 | 8-8-8 | 1-1-1 | 1-1-1 | 0-0-0 | 0-0-0 | 13-14-14 | 5-5-7 | 0-0-2 | 3-3-3 | 0-0-0 | 10-10-10 |
| Jhin | 8 | 14-14-15 | 24-25-25 | 1-1-1 | 4.11 | 3-4-4 | 8-9-9 | 0-0-2 | 15-15-15 | 2-3-3 | 9-10-10 | 22-23-23 | 7-7-8 | 1-1-1 | 1-1-1 | 3-3-3 | 12-12-13 | 11-12-12 | 2-2-2 | 6-7-7 | 0-0-0 | 6-6-6 | 7-8-8 |
| Azir | 7 | 2-2-4 | 20-21-22 | 16-17-18 | 2.35 | 12-13-14 | 13-13-15 | 6-6-6 | 4-4-4 | 0-0-1 | 3-3-3 | 9-9-10 | 7-7-7 | 1-1-1 | 2-2-3 | 3-3-3 | 6-6-6 | 8-8-9 | 4-5-5 | 6-7-7 | 3-3-3 | 0-0-0 | 10-11-11 |
| Vi | 7 | 23-25-25 | 10-10-11 | 5-5-6 | 2.77 | 2-2-4 | 18-18-19 | 9-9-11 | 7-7-9 | 1-1-3 | 0-1-2 | 15-16-16 | 7-7-8 | 1-1-2 | 10-12-15 | 3-3-3 | 5-7-8 | 7-8-9 | 13-16-21 | 4-4-6 | 0-0-0 | 0-1-2 | 6-7-8 |
| Nasus | 7 | 16-17-18 | 22-22-23 | 0-0-1 | 3.08 | 9-13-14 | 13-14-14 | 3-5-7 | 0-0-1 | 0-2-2 | 8-8-8 | 15-18-19 | 6-6-7 | 1-1-1 | 1-1-1 | 0-0-0 | 3-4-6 | 16-16-18 | 3-4-6 | 6-6-7 | 4-4-4 | 8-8-9 | 9-10-10 |
| Pyke | 7 | 22-24-29 | 11-13-15 | 0-2-4 | 2.95 | 3-4-6 | 13-14-14 | 11-12-14 | 4-6-7 | 0-0-1 | 2-3-4 | 16-21-25 | 6-7-7 | 1-1-1 | 7-8-9 | 0-0-0 | 10-11-12 | 7-8-10 | 4-6-7 | 3-3-3 | 0-0-1 | 2-2-4 | 5-6-8 |
| Ziggs | 6 | 20-20-21 | 9-9-10 | 11-11-13 | 2.40 | 8-9-9 | 13-13-13 | 11-12-12 | 3-3-4 | 1-3-3 | 0-1-2 | 19-19-19 | 7-8-8 | 1-1-1 | 7-8-9 | 0-0-0 | 11-11-12 | 5-5-7 | 3-3-3 | 0-0-0 | 0-0-0 | 0-1-2 | 7-7-7 |
| Poppy | 6 | 8-9-17 | 19-24-25 | 5-7-7 | 4.25 | 6-7-9 | 12-14-16 | 1-3-7 | 3-3-4 | 1-3-5 | 3-11-13 | 20-30-36 | 6-6-7 | 1-1-1 | 1-3-7 | 0-0-1 | 8-10-13 | 6-16-18 | 4-4-9 | 1-4-5 | 0-1-1 | 3-5-8 | 7-9-9 |
| K'Sante | 6 | 16-17-19 | 16-18-19 | 5-6-6 | 2.35 | 10-12-13 | 17-18-18 | 2-3-4 | 2-3-4 | 1-2-3 | 2-3-5 | 16-18-19 | 6-7-7 | 1-1-1 | 2-3-4 | 3-3-3 | 3-4-5 | 7-8-10 | 5-6-6 | 11-12-12 | 3-3-4 | 3-5-5 | 7-9-9 |
| Darius | 5 | 25-25-26 | 9-9-12 | 3-5-5 | 2.98 | 2-3-4 | 14-16-16 | 8-9-9 | 6-6-6 | 4-6-6 | 0-1-1 | 16-26-28 | 7-8-8 | 1-1-1 | 4-6-6 | 0-0-0 | 10-11-12 | 7-8-9 | 4-5-8 | 4-4-6 | 0-0-0 | 0-0-0 | 9-10-10 |
| Zed | 5 | 19-19-21 | 7-12-19 | 0-3-14 | 2.92 | 5-6-9 | 15-16-16 | 5-7-7 | 4-4-5 | 1-3-3 | 3-3-6 | 17-17-24 | 7-7-8 | 1-1-1 | 3-5-8 | 0-0-1 | 3-3-4 | 6-7-8 | 4-11-14 | 1-4-5 | 0-0-1 | 3-3-3 | 3-6-8 |
| Draven | 5 | 23-25-25 | 11-12-14 | 3-3-3 | 2.77 | 1-3-6 | 19-19-19 | 2-3-7 | 9-9-11 | 1-2-4 | 1-1-1 | 20-21-25 | 6-6-6 | 1-1-1 | 13-14-14 | 3-3-3 | 8-8-10 | 3-3-5 | 15-16-16 | 2-3-3 | 0-0-0 | 1-1-1 | 5-6-8 |
| Ambessa | 5 | 22-22-23 | 16-17-17 | 1-1-1 | 2.45 | 6-6-7 | 15-16-16 | 10-11-14 | 2-3-4 | 2-2-5 | 0-0-0 | 15-16-16 | 7-7-8 | 1-1-1 | 10-11-11 | 1-1-3 | 8-10-11 | 2-2-2 | 10-10-14 | 7-9-9 | 1-1-1 | 0-2-2 | 7-7-7 |
| Fiora | 5 | 23-23-24 | 12-13-14 | 3-4-5 | 3.60 | 4-5-6 | 12-13-13 | 5-8-12 | 1-4-6 | 3-4-6 | 2-6-8 | 21-24-34 | 7-7-8 | 1-1-1 | 7-10-10 | 2-2-2 | 7-8-10 | 7-8-9 | 7-8-10 | 7-9-11 | 2-2-3 | 5-8-11 | 8-8-9 |

**per domain pair**

| group | n | units | spells | gear | avgEnergy | e01 | e2 | e3 | e4 | e5 | e6p | powerPips | runeMajor | chosenCopies | championUnits | signature | r_removal | r_card_flow | r_tempo | r_combat_tricks | r_counterspells | r_finishers | x3 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| calm+chaos | 50 | 16-19-20 | 14-16-20 | 5-6-6 | 2.75 | 5-6-9 | 16-18-19 | 6-7-9 | 3-4-4 | 1-2-2 | 1-3-4 | 14-16-18 | 6-6-7 | 1-1-1 | 3-4-6 | 1-3-3 | 4-7-9 | 9-10-11 | 8-8-9 | 5-7-7 | 3-4-4 | 1-3-4 | 6-7-8 |
| calm+mind | 42 | 11-13-15 | 12-21-22 | 6-8-15 | 2.41 | 9-10-12 | 15-18-20 | 3-5-7 | 0-1-2 | 1-2-3 | 1-2-5 | 15-18-20 | 6-7-7 | 1-1-1 | 1-2-3 | 0-0-0 | 1-2-4 | 11-13-16 | 5-6-7 | 3-8-9 | 3-3-4 | 0-2-4 | 8-9-10 |
| fury+mind | 41 | 18-20-21 | 17-20-22 | 0-0-1 | 3.58 | 5-7-8 | 9-13-14 | 4-5-6 | 4-4-8 | 0-0-2 | 9-10-11 | 22-27-30 | 7-7-7 | 1-1-1 | 1-1-3 | 0-0-0 | 8-11-12 | 9-10-11 | 4-4-5 | 4-5-5 | 0-0-0 | 6-9-10 | 7-8-9 |
| fury+order | 35 | 25-26-30 | 7-9-13 | 2-4-5 | 2.77 | 2-3-4 | 16-17-19 | 9-9-11 | 3-6-7 | 1-2-4 | 1-2-3 | 16-17-27 | 6-7-8 | 1-1-1 | 2-6-10 | 0-3-3 | 8-11-12 | 3-6-8 | 5-7-10 | 2-3-4 | 0-0-0 | 1-2-3 | 8-9-11 |
| body+chaos | 32 | 20-21-23 | 14-16-17 | 2-3-4 | 2.83 | 4-5-5 | 9-13-14 | 11-13-19 | 4-5-5 | 2-4-4 | 0-1-2 | 17-22-24 | 6-6-7 | 1-1-1 | 9-10-13 | 0-2-3 | 5-6-7 | 5-6-8 | 5-12-16 | 6-6-7 | 0-0-1 | 2-3-4 | 5-5-7 |
| mind+order | 29 | 9-17-29 | 7-21-24 | 3-3-6 | 2.83 | 3-5-9 | 10-16-18 | 7-10-11 | 0-1-2 | 5-5-6 | 2-3-10 | 24-27-28 | 7-7-8 | 1-1-1 | 3-6-7 | 0-1-2 | 13-15-18 | 7-9-12 | 2-4-4 | 1-3-5 | 0-0-0 | 1-2-10 | 7-9-11 |
| body+order | 28 | 20-22-24 | 12-16-17 | 3-4-7 | 2.70 | 6-7-9 | 11-12-15 | 8-10-13 | 2-4-4 | 2-4-5 | 0-0-4 | 15-18-23 | 6-7-7 | 1-1-1 | 7-9-10 | 1-2-3 | 4-6-10 | 2-6-9 | 8-11-14 | 7-9-11 | 0-1-1 | 2-3-5 | 7-9-10 |
| chaos+fury | 27 | 20-22-25 | 9-12-14 | 3-3-11 | 2.80 | 4-5-9 | 13-15-18 | 7-9-12 | 3-6-9 | 0-1-3 | 1-2-3 | 17-19-24 | 7-7-8 | 1-1-1 | 7-8-9 | 0-0-2 | 5-10-11 | 5-6-9 | 3-7-15 | 1-3-3 | 0-0-1 | 1-2-3 | 5-7-8 |
| body+calm | 25 | 17-18-19 | 16-18-19 | 2-3-6 | 2.48 | 6-11-12 | 15-17-18 | 4-5-6 | 2-2-4 | 3-3-3 | 2-2-4 | 16-18-20 | 6-7-7 | 1-1-1 | 4-5-6 | 0-2-3 | 3-3-4 | 9-9-10 | 6-9-10 | 9-11-11 | 3-3-4 | 4-5-5 | 7-9-9 |
| calm+order | 22 | 5-21-23 | 17-18-20 | 0-2-15 | 2.65 | 5-6-11 | 14-17-18 | 6-6-7 | 3-4-4 | 1-2-3 | 2-3-4 | 10-14-17 | 6-7-7 | 1-1-2 | 2-4-8 | 1-2-3 | 5-6-8 | 8-9-11 | 4-6-9 | 5-7-9 | 3-3-4 | 0-1-3 | 6-8-11 |
| chaos+mind | 20 | 16-17-18 | 20-21-22 | 1-3-5 | 2.55 | 6-8-10 | 14-16-18 | 8-9-12 | 3-4-5 | 0-3-3 | 0-2-3 | 15-18-25 | 6-7-7 | 1-1-1 | 6-8-9 | 0-3-3 | 8-9-11 | 8-11-12 | 4-8-9 | 4-6-9 | 1-2-2 | 0-1-2 | 7-8-9 |
| body+fury | 17 | 25-30-30 | 10-10-10 | 0-0-4 | 2.88 | 4-5-6 | 11-12-13 | 7-12-14 | 4-6-6 | 1-2-3 | 2-3-3 | 15-18-21 | 7-8-8 | 1-1-1 | 6-8-8 | 2-3-3 | 2-2-5 | 7-8-8 | 17-18-19 | 3-5-5 | 0-0-0 | 3-4-5 | 8-9-9 |
| chaos+order | 17 | 19-20-21 | 13-14-14 | 5-6-7 | 2.73 | 8-8-8 | 16-16-16 | 9-10-10 | 3-3-4 | 0-0-0 | 3-3-3 | 19-20-21 | 9-9-9 | 1-1-1 | 5-5-6 | 3-3-3 | 5-7-8 | 10-11-11 | 7-7-8 | 2-2-2 | 1-1-1 | 3-3-3 | 6-6-7 |
| calm+fury | 12 | 18-18-19 | 15-16-17 | 6-6-6 | 2.85 | 6-6-7 | 17-18-18 | 3-3-4 | 7-7-8 | 2-3-3 | 3-3-3 | 18-18-19 | 7-7-7 | 1-1-1 | 6-6-7 | 3-3-3 | 10-10-10 | 11-11-12 | 8-9-9 | 4-4-4 | 4-4-4 | 3-3-3 | 8-9-10 |
| body+mind | 9 | 4-4-4 | 24-26-26 | 10-10-12 | 4.17 | 7-8-9 | 9-10-10 | 3-3-3 | 6-6-6 | 1-2-2 | 11-11-11 | 29-29-29 | 7-7-7 | 1-1-1 | 1-1-1 | 0-0-0 | 9-10-10 | 18-18-19 | 0-0-0 | 0-0-0 | 0-1-2 | 6-6-7 | 8-9-11 |

### 2.6 Chosen champion, champion units, signatures, copies

[D: n = 406]
- **Copies of the Chosen Champion** (zone copy included): 1 copy in 379 lists, 2 in 18, 3 in 9. Only 7% run a second copy.
- Chosen Champion Energy cost: 2 → 15 lists, 3 → 117, 4 → 156, 5 → 87, 6 → 15, 7+ → 16. 67% cost 3 or 4.
- Other champion units (any champion-supertype unit that is not the chosen one): p25–p75 = 1–7, by archetype 6–10 (unit-aggro), 2–5 (spell-tempo), 0–4 (gear-engine), 0–3 (big-control).
- Signature cards: 0 in 163 lists, 1 in 34, 2 in 34, 3 in 175. So 43% play the full three and 40% play none.
- Distinct names: p25–p75 = 17–20. Three-ofs: 7–9 names (21–27 of the 40 cards). Two-ofs: 4–7 names. One-ofs: 3–7 names.
- Most played main-deck cards (share of lists): Defy 37%, Discipline 35%, Star-Crossed 30%, Noxus Hopeful 26%, Stupefy 26%, Falling Star 25%, Gust 24%, Thousand-Tailed Watcher 24%, Switcheroo 24%, Tideturner 23%, Vex, Apathetic 22%, Punch First 22%, Scuttle Crab 21%, Charm 20%.

Per legend: archetype mix, chosen champion, rune split and battlefields.

| legend | n | pair | archetypes | chosen champion (share) | chosen copies p50 | rune splits | top battlefields (share of lists) |
|---|---|---|---|---|---|---|---|
| Kai'Sa | 23 | fury+mind | big-control 23 | Kai'Sa, Survivor 100% | 1 | 7 fury/5 mind ×20; 6 fury/6 mind ×3 | Void Gate 100%; Rockfall Path 96%; Frozen Fortress 96%; Vilemaw's Lair 4% |
| Riven | 22 | calm+chaos | spell-tempo 22 | Riven, Broken Blade 95%; Riven, Deserter 5% | 1 | 7 chaos/5 calm ×12; 6 calm/6 chaos ×9 | Star Spring 100%; Emperor's Dais 73%; Hunters' Circle 59%; Rakelstake 55% |
| Kennen | 17 | chaos+order | gear-engine 16, unit-aggro 1 | Kennen, Storm of Shuriken 100% | 1 | 9 chaos/3 order ×11; 6 chaos/6 order ×2 | Minefield 100%; Zaun Warrens 100%; Veiled Temple 41%; Ruined Monastery 35% |
| Kha'Zix | 15 | body+chaos | unit-aggro 15 | Kha'Zix, Mutating Horror 100% | 1 | 6 body/6 chaos ×14; 7 body/5 chaos ×1 | Star Spring 93%; Forbidding Waste 87%; Sandswept Tomb 87%; Zaun Warrens 20% |
| Rek'Sai | 15 | fury+order | unit-aggro 15 | Rek'Sai, Breacher 100% | 1 | 8 fury/4 order ×6; 6 fury/6 order ×6 | The Candlelit Sanctum 87%; Rockfall Path 40%; Forbidding Waste 40%; Ruined Monastery 33% |
| Master Yi | 14 | body+calm | spell-tempo 14 | Master Yi, Tempered 100% | 1 | 7 body/5 calm ×11; 6 calm/6 body ×2 | Emperor's Dais 64%; Star Spring 50%; Seat of Power 36%; Grove of the God-Willow 36% |
| Lillia | 14 | calm+mind | spell-tempo 14 | Lillia, Fae Fawn 100% | 1 | 6 calm/6 mind ×9; 7 calm/5 mind ×3 | Dusk Rose Lab 100%; Seat of Power 93%; Black Flame Altar 43%; Rockfall Path 29% |
| Viktor | 13 | mind+order | gear-engine 7, unit-aggro 6 | Viktor, Leader 100% | 1 | 7 order/5 mind ×8; 6 mind/6 order ×5 | Rockfall Path 92%; Forbidding Waste 92%; Ravenbloom Conservatory 38%; Seat of Power 15% |
| Irelia | 13 | calm+chaos | spell-tempo 13 | Irelia, Fervent 92%; Irelia, Graceful 8% | 1 | 6 calm/6 chaos ×11; 7 chaos/5 calm ×2 | Abandoned Hall 100%; Targon's Peak 77%; Sunken Temple 77%; Sandswept Tomb 15% |
| Vex | 13 | calm+chaos | spell-tempo 12, gear-engine 1 | Vex, Apathetic 100% | 1 | 7 chaos/5 calm ×7; 6 calm/6 chaos ×3 | Startipped Peak 85%; Fortified Position 38%; Bandle Scouts' Academy 31%; Bandle Tree 31% |
| Akali | 12 | calm+fury | spell-tempo 12 | Akali, Deadly Weapon 100% | 1 | 7 fury/5 calm ×9; 6 fury/6 calm ×3 | Void Gate 100%; Sigil of the Storm 83%; Forgotten Monument 75%; Forbidding Waste 17% |
| Evelynn | 12 | body+chaos | unit-aggro 12 | Evelynn, Entrancing 100% | 1 | 8 chaos/4 body ×6; 6 body/6 chaos ×4 | Bandle Scouts' Academy 100%; Startipped Peak 75%; Rakelstake 75%; Grove of the God-Willow 25% |
| LeBlanc | 11 | mind+order | big-control 10, unit-aggro 1 | LeBlanc, Fragmented 100% | 1 | 8 order/4 mind ×9; 7 order/5 mind ×2 | Windswept Hillock 100%; Star Spring 82%; Dusk Rose Lab 55%; Trifarian War Camp 18% |
| Orianna | 10 | calm+mind | spell-tempo 6, gear-engine 4 | Orianna, Exquisite 90%; Orianna, Mechanical Marvel 10% | 1 | 7 calm/5 mind ×4; 8 calm/4 mind ×2 | Veiled Temple 100%; Ornn's Forge 80%; Rockfall Path 60%; Void Gate 20% |
| Diana | 10 | chaos+mind | spell-tempo 10 | Diana, Lunari 100% | 1 | 7 chaos/5 mind ×5; 6 mind/6 chaos ×4 | Abandoned Hall 90%; Targon's Peak 70%; Ravenbloom Conservatory 50%; Rockfall Path 30% |
| Rengar | 10 | body+fury | unit-aggro 10 | Rengar, Trophy Hunter 100% | 1 | 8 body/4 fury ×9; 7 body/5 fury ×1 | Emperor's Dais 100%; Star Spring 80%; Seat of Power 80%; Black Rose Sanctum 10% |
| Ivern | 9 | calm+order | spell-tempo 7, unit-aggro 2 | Ivern, Nurturer 100% | 2 | 6 calm/6 order ×6; 7 calm/5 order ×2 | Vilemaw's Lair 100%; Rockfall Path 89%; Forbidding Waste 89%; Seat of Power 11% |
| Jayce | 9 | body+mind | big-control 9 | Jayce, Brilliant Inventor 100% | 1 | 7 body/5 mind ×8; 8 body/4 mind ×1 | Forgotten Monument 100%; Sigil of the Storm 100%; Dragon Roost 56%; The Papertree 33% |
| Sett | 8 | body+order | unit-aggro 6, gear-engine 1, spell-tempo 1 | Sett, Kingpin 75%; Sett, Brawler 25% | 1 | 7 body/5 order ×6; 6 body/6 order ×1 | Valley of Idols 88%; Monastery of Hirana 88%; Grove of the God-Willow 75%; Sunken Temple 13% |
| Ekko | 8 | fury+mind | gear-engine 5, unit-aggro 2, big-control 1 | Ekko, Ingenious 100% | 1 | 6 fury/6 mind ×6; 7 fury/5 mind ×2 | Seat of Power 75%; Forbidding Waste 63%; Dusk Rose Lab 63%; Rockfall Path 38% |
| Mordekaiser | 8 | fury+order | unit-aggro 8 | Mordekaiser, Dominating 88%; Mordekaiser, Twice Slain 13% | 1 | 7 order/5 fury ×3; 6 fury/6 order ×3 | Zaun Warrens 88%; Minefield 88%; Ruined Monastery 75%; Black Rose Sanctum 25% |
| Ornn | 8 | calm+mind | gear-engine 8 | Ornn, Blacksmith 88%; Ornn, Forge God 13% | 1 | 8 calm/4 mind ×5; 7 calm/5 mind ×2 | Ornn's Forge 100%; Veiled Temple 75%; Seat of Power 75%; The Arena's Greatest 25% |
| Jhin | 8 | fury+mind | big-control 8 | Jhin, Meticulous Killer 100% | 1 | 7 mind/5 fury ×5; 8 mind/4 fury ×2 | Frozen Fortress 88%; Sigil of the Storm 88%; Rockfall Path 63%; Aspirant's Climb 25% |
| Azir | 7 | calm+order | gear-engine 7 | Azir, Sovereign 100% | 1 | 7 calm/5 order ×7 | Trifarian War Camp 100%; Hall of Legends 100%; Seat of Power 57%; Vilemaw's Lair 29% |
| Vi | 7 | fury+order | unit-aggro 7 | Vi, Peacekeeper 100% | 1 | 7 fury/5 order ×4; 8 fury/4 order ×3 | Forge of the Fluft 57%; Star Spring 57%; Trapping Grounds 29%; Sunken Temple 29% |
| Nasus | 7 | calm+mind | spell-tempo 4, big-control 3 | Nasus, Ascended 57%; Nasus, Guardian of Knowledge 43% | 1 | 6 calm/6 mind ×5; 7 mind/5 calm ×2 | Rockfall Path 71%; Vilemaw's Lair 43%; Ruined Monastery 43%; Ravenbloom Conservatory 29% |
| Pyke | 7 | chaos+fury | unit-aggro 6, gear-engine 1 | Pyke, Dockside Butcher 86%; Pyke, Returned 14% | 1 | 7 fury/5 chaos ×3; 6 fury/6 chaos ×2 | Ripper's Bay 71%; Forbidding Waste 57%; Void Gate 43%; Frozen Fortress 29% |
| Ziggs | 6 | chaos+fury | gear-engine 5, unit-aggro 1 | Ziggs, Explosive 83%; Ziggs, Short-Fused 17% | 1 | 8 fury/4 chaos ×3; 7 fury/5 chaos ×1 | Rakelstake 83%; Void Gate 83%; Forbidding Waste 50%; Sigil of the Storm 17% |
| Poppy | 6 | body+order | big-control 4, unit-aggro 2 | Poppy, Paragon 100% | 1 | 6 body/6 order ×4; 7 body/5 order ×1 | Sigil of the Storm 67%; Threshold of the Gray 50%; Forgotten Monument 50%; Targon's Peak 17% |
| K'Sante | 6 | body+calm | spell-tempo 6 | K'Sante, Courageous 50%; K'Sante, Dauntless 50% | 1 | 6 calm/6 body ×3; 7 calm/5 body ×2 | Fortified Position 67%; Grove of the God-Willow 50%; Amateur Recital 33%; Sandswept Tomb 33% |
| Darius | 5 | fury+order | unit-aggro 5 | Darius, Trifarian 100% | 1 | 8 order/4 fury ×2; 6 fury/6 order ×1 | Emperor's Dais 80%; Seat of Power 60%; Trifarian War Camp 60%; Forbidding Waste 40% |
| Zed | 5 | chaos+fury | unit-aggro 3, gear-engine 2 | Zed, Without a Sound 80%; Zed, From the Shadows 20% | 1 | 7 fury/5 chaos ×2; 8 chaos/4 fury ×2 | Zaun Warrens 100%; Minefield 80%; Forbidding Waste 80%; Sigil of the Storm 20% |
| Draven | 5 | chaos+fury | unit-aggro 5 | Draven, Showboat 100% | 1 | 6 fury/6 chaos ×3; 6 chaos/6 fury ×1 | Grove of the God-Willow 60%; Star Spring 60%; Zaun Warrens 40%; Hunters' Circle 20% |
| Ambessa | 5 | body+order | unit-aggro 5 | Ambessa, The Wolf 100% | 1 | 7 body/5 order ×3; 8 body/4 order ×2 | Risen Altar 100%; Sandswept Tomb 60%; Sunken Temple 60%; Star Spring 40% |
| Fiora | 5 | body+order | big-control 3, unit-aggro 2 | Fiora, Victorious 60%; Fiora, Worthy 40% | 1 | 8 body/4 order ×2; 7 body/5 order ×2 | Sunken Temple 100%; Risen Altar 60%; Amateur Recital 40%; Valley of Idols 40% |
| Ezreal | 4 | chaos+mind | gear-engine 4 | Ezreal, Prodigy 100% | 1 | 7 chaos/5 mind ×3; 6 chaos/6 mind ×1 | Sigil of the Storm 100%; Frozen Fortress 75%; Aspirant's Climb 50%; Forgotten Monument 25% |
| Jarvan IV | 4 | body+order | unit-aggro 3, gear-engine 1 | Jarvan IV, Martial Paragon 75%; Jarvan IV, Royal Heir 25% | 1 | 7 body/5 order ×2; 6 body/6 order ×2 | Monastery of Hirana 100%; Seat of Power 75%; Packed Amphitheater 50%; Ornn's Forge 25% |
| Seraphine | 4 | mind+order | gear-engine 3, big-control 1 | Seraphine, Inspiring 75%; Seraphine, Not Alone 25% | 1 | 7 order/5 mind ×3; 6 mind/6 order ×1 | Void Gate 75%; Forbidding Waste 75%; Vilemaw's Lair 50%; Piltovan Forge 25% |
| Jax | 4 | body+calm | spell-tempo 4 | Jax, Unmatched 100% | 1 | 6 calm/6 body ×3; 6 body/6 calm ×1 | Ornn's Forge 100%; Sunken Temple 100%; Grove of the God-Willow 25%; Forbidding Waste 25% |
| Shen | 4 | calm+order | spell-tempo 4 | Shen, Kinkou 75%; Shen, Scourge of Shadows 25% | 1 | 6 calm/6 order ×3; 7 order/5 calm ×1 | Kinkou Temple 100%; Trifarian War Camp 50%; Packed Amphitheater 25%; Startipped Peak 25% |

### 2.7 Runes against the deck's power costs

**rune split distribution (major-minor)**

- {"7-5":185,"6-6":140,"8-4":62,"9-3":16,"10-2":3}
- non-basic runes in rune deck: {"0":406}

**OLS: runes of domain A (of 12) ~ a + b * share_A, two-domain legends**

- printed power pips share: {"n":406,"a":3.989,"b":4.361,"r2":0.531}
- printed + text-cost pips share: {"n":406,"a":4.041,"b":4.324,"r2":0.561}
- printed + 0.5*text pips share: {"n":406,"a":3.982,"b":4.41,"r2":0.557}
- card-count share: {"n":406,"a":4.163,"b":3.975,"r2":0.28}
- formula k=0.4: exact 47%, within±1 91% (n=406)
- formula k=0.5: exact 49%, within±1 90% (n=406)
- formula k=0.6: exact 45%, within±1 87% (n=406)
- formula k=0.75: exact 35%, within±1 78% (n=406)
- formula k=1: exact 24%, within±1 68% (n=406)

**runes in the higher-demand domain, by that domain's share of (printed+text) pips**

- share 0.50-0.55: n=69, mean 6.03, dist {"5":14,"6":41,"7":12,"8":2}
- share 0.55-0.65: n=133, mean 6.38, dist {"4":1,"5":12,"6":63,"7":49,"8":8}
- share 0.65-0.75: n=94, mean 6.50, dist {"5":17,"6":24,"7":42,"8":11}
- share 0.75-0.85: n=75, mean 7.27, dist {"5":2,"6":10,"7":31,"8":30,"9":2}
- share 0.85-1.00: n=35, mean 8.29, dist {"6":2,"7":6,"8":10,"9":14,"10":3}

**power stats: total printed pips p25/p50/p75 = 16/19/24; max single-card power dist {"1":33,"2":264,"3":45,"4":64}**

Reading [D]:
- Splits: 7-5 in 46% of lists, 6-6 in 34%, 8-4 in 15%, 9-3 or 10-2 in 5%. No list runs a non-basic rune in the Rune Deck.
- "Printed + text pips" means printed Power costs plus domain symbols that appear in rules text outside reminder text (Equip, Accelerate, Empower and activated costs). It predicts the split a little better than printed pips alone (R² 0.56 against 0.53) and far better than counting cards per domain (0.28).
- Players skew less than proportionally. A domain holding 75-85% of the pips gets 7.3 runes on average, not 9-10.
- Most decks top out at Power 2 on a single card (264 of 406); 64 lists run a Power-4 card (Time Warp and similar), almost all big-control.

### 2.8 Battlefields

**battlefields overall (share of valid lists)** [D]

- Rockfall Path: 22%
- Forbidding Waste: 18%
- Star Spring: 18%
- Seat of Power: 15%
- Void Gate: 13%
- Sigil of the Storm: 12%
- Zaun Warrens: 12%
- Emperor's Dais: 10%
- Frozen Fortress: 10%
- Targon's Peak: 9%
- Minefield: 8%
- Sunken Temple: 7%
- Forgotten Monument: 7%
- Grove of the God-Willow: 7%
- Dusk Rose Lab: 7%
- Abandoned Hall: 7%
- Rakelstake: 6%
- Vilemaw's Lair: 6%
- Sandswept Tomb: 6%
- Veiled Temple: 6%
- Hunters' Circle: 6%
- Ornn's Forge: 6%
- Trifarian War Camp: 6%
- Startipped Peak: 6%
- Ruined Monastery: 6%

**battlefields RAD era** [D]

- Rockfall Path: 23%
- Star Spring: 21%
- Forbidding Waste: 18%
- Void Gate: 16%
- Sigil of the Storm: 12%
- Zaun Warrens: 11%
- Emperor's Dais: 11%
- Seat of Power: 11%
- Rakelstake: 10%
- Frozen Fortress: 10%
- Minefield: 10%
- Hunters' Circle: 9%
- Ruined Monastery: 9%
- Forgotten Monument: 9%
- Bandle Scouts' Academy: 8%
- Sandswept Tomb: 7%
- Veiled Temple: 7%
- Grove of the God-Willow: 7%
- Vilemaw's Lair: 7%
- Packed Amphitheater: 6%

- [D] Battlefield choice is legend-specific and very concentrated: for most legends with n ≥ 8 one battlefield is in 85-100% of lists and the top three cover most lists (table in 2.6). A per-legend lookup is a better recommender than any general rule.
- [D] The banned battlefields still show in pre-ban lists (The Arena's Greatest in 2 of 8 Ornn lists, Aspirant's Climb in Jhin and Ezreal lists). Filter by the ban list before recommending.

### 2.9 Sideboards

**sideboard size: {"0":5,"1":1,"5":1,"6":2,"7":2,"8":57,"9":2,"10":336}**

**sideboard slots by category, all lists with a sideboard (n=401)**

- spot removal/stun/bounce: 25.7% of slots, 2.48 cards/deck
- hate (gear/trash/hand/points): 24.7% of slots, 2.38 cards/deck
- unit (threat/body): 12.5% of slots, 1.21 cards/deck
- combat trick/debuff: 11.0% of slots, 1.06 cards/deck
- counterspell: 8.1% of slots, 0.79 cards/deck
- spell (other): 6.2% of slots, 0.60 cards/deck
- protection: 4.9% of slots, 0.48 cards/deck
- sweeper: 2.8% of slots, 0.27 cards/deck
- card flow: 2.2% of slots, 0.21 cards/deck
- gear (other): 1.8% of slots, 0.17 cards/deck
- unit-aggro (n=130): spot removal/stun/bounce 3.0; hate (gear/trash/hand/points) 2.4; unit (threat/body) 1.6; spell (other) 0.7; protection 0.5; combat trick/debuff 0.5
- spell-tempo (n=138): hate (gear/trash/hand/points) 2.4; spot removal/stun/bounce 1.7; combat trick/debuff 1.5; counterspell 1.4; unit (threat/body) 0.9; protection 0.7
- gear-engine (n=69): spot removal/stun/bounce 2.7; hate (gear/trash/hand/points) 2.1; combat trick/debuff 1.4; unit (threat/body) 1.2; counterspell 0.8; spell (other) 0.7
- big-control (n=64): spot removal/stun/bounce 3.0; hate (gear/trash/hand/points) 2.6; unit (threat/body) 1.1; combat trick/debuff 1.0; spell (other) 0.7; sweeper 0.4

**most common sideboard cards (share of lists with a sideboard)**

- Decree of Focus: 23% [combat_trick]
- Not So Fast: 22% [counterspell]
- Salvage: 22% [hate_gear,draw]
- Star-Crossed: 22% [removal_bounce]
- Decree of Insight: 21% [debuff,combat_trick]
- Decree of Unity: 20% [removal_kill]
- Decree of Rage: 18% [removal_damage]
- Ferrous Forerunner: 17% [token_maker,topend]
- An Offer You Can't Refuse: 17% [hate_gear,ramp]
- Disarming Rake: 16% [hate_gear]
- Brittle Steel: 15% [hate_gear,recursion]
- Ravenbloom Prefect: 15% []
- Sabotage: 14% [hand_attack]
- Gust: 13% [removal_bounce]
- Decree of Strength: 12% []
- Hush: 12% [counterspell]
- Thermo Beam: 11% [hate_gear]
- Tomb-Raider Barbara: 11% [hate_gear]
- Unchecked Power: 10% [removal_damage,sweeper]
- Pickpocket: 10% [hate_gear,ramp]
- Ashe, Focused: 9% [hand_attack]
- Vex, Apathetic: 9% [stun,protection]
- Rebuke: 9% [removal_bounce]
- Abandon: 9% [counterspell,selection]
- Unyielding Spirit: 8% [combat_trick,protection]

**most common main-deck cards (share of valid lists)**

- Defy: 37% [counterspell]
- Discipline: 35% [draw,combat_trick]
- Star-Crossed: 30% [removal_bounce]
- Noxus Hopeful: 26% []
- Stupefy: 26% [debuff,draw,combat_trick]
- Falling Star: 25% [removal_damage]
- Gust: 24% [removal_bounce]
- Thousand-Tailed Watcher: 24% [debuff,tempo_ready,topend]
- Switcheroo: 24% [combat_trick]
- Tideturner: 23% [movement]
- Vex, Apathetic: 22% [stun,protection]
- Punch First: 22% [combat_trick]
- Scuttle Crab: 21% [draw]
- Charm: 20% [movement]
- Kai'Sa, Survivor: 20% [draw,tempo_ready,score_trigger]
- Zhonya's Hourglass: 20% [protection]
- Rengar, Trophy Hunter: 19% [tempo_ready,topend]
- Hidden Blade: 19% [removal_kill]
- Fizz, Trickster: 18% [recursion]
- Ride the Wind: 18% [movement,tempo_ready]
- Sabotage: 18% [hand_attack]
- Not So Fast: 18% [counterspell]
- Back Off: 18% [stun,draw]
- Vi, Peacekeeper: 17% [stun,tempo_ready]
- Bellows Breath: 17% [removal_damage]
- Rampage: 17% [removal_damage,combat_trick]
- Traveling Merchant: 16% [draw,discard_outlet]
- Rebuke: 15% [removal_bounce]
- Sprite Fountain: 15% [token_maker]
- Astral Heron: 14% [ramp,topend]

**sideboard: distinct cards p50 7, copies-per-card: {"1":1635,"2":907,"3":139}**

**side champions: lists with a champion unit of the legend's tag in the sideboard: 42/401**

Reading [D]:
- About half of all sideboard slots are answers: 2.5 removal/stun/bounce cards and 2.4 "hate" cards per sideboard.
- The Vendetta "Decree" cycle is the backbone of sideboards. Each is a cheap card that only works against one domain [F: gallery text]: *Decree of Rage* (fury) "Deal 4 to an enemy Calm unit", *Decree of Focus* (calm) protects against Fury, *Decree of Insight* (mind) "-5 Might" to an enemy Body unit, *Decree of Strength* (body) takes a Mind card from hand, *Decree of Discord* (chaos) bounces Order units, *Decree of Unity* (order) "Kill an enemy Chaos unit or gear".
- Gear answers are the next block: Salvage 22%, An Offer You Can't Refuse 17%, Disarming Rake 16%, Brittle Steel 15%, Ravenbloom Prefect 15%, Thermo Beam 11%, Tomb-Raider Barbara 11%.
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

| role / metric | unit-aggro (n=132) | spell-tempo (n=139) | gear-engine (n=69) | big-control (n=66) |
|---|---|---|---|---|
| units | 22–27 (20–30) | 16–20 (12–21) | 8–20 (5–20) | 14–22 (4–30) |
| spells | 10–16 (8–18) | 16–21 (14–22) | 12–21 (7–24) | 17–24 (7–25) |
| gear | 1–4 (0–6) | 2–6 (0–8) | 7–15 (5–18) | 0–5 (0–10) |
| Energy 0-1 | 3–6 (0–7) | 6–10 (5–12) | 8–12 (8–13) | 4–8 (3–9) |
| Energy 2 | 13–17 (11–19) | 16–19 (14–20) | 13–17 (11–18) | 9–13 (8–14) |
| Energy 3 | 9–13 (6–15) | 4–8 (3–10) | 6–10 (5–12) | 3–6 (0–11) |
| Energy 4 | 3–7 (3–9) | 2–4 (0–6) | 2–4 (1–5) | 3–6 (0–13) |
| Energy 5 | 1–4 (0–5) | 2–3 (1–4) | 0–3 (0–5) | 0–4 (0–6) |
| Energy 6+ | 0–3 (0–4) | 1–4 (0–5) | 1–3 (0–3) | 10–11 (9–12) |
| average Energy | 2.70–2.98 (2.50–3.20) | 2.41–2.88 (2.27–3.00) | 2.38–2.73 (2.20–2.85) | 3.54–4.17 (3.39–4.36) |
| units costing ≤ 2 | 8–9 (5–11) | 6–9 (5–9) | 3–8 (0–9) | 0–6 (0–8) |
| units costing 2-4 | 17–23 (15–26) | 11–14 (9–16) | 8–16 (2–17) | 3–14 (0–14) |
| removal, any kind (kill, damage, bounce, stun, sweeper) | 5–11 (2–12) | 3–8 (2–10) | 3–11 (0–17) | 10–13 (8–14) |
| kill or damage removal | 2–7 (1–12) | 0–3 (0–5) | 0–9 (0–14) | 9–12 (8–13) |
| card flow (draw + selection) | 4–8 (3–9) | 9–12 (8–14) | 8–12 (7–14) | 10–15 (9–18) |
| tempo (movement + ready/enter ready) | 6–16 (5–18) | 6–9 (5–10) | 3–7 (2–8) | 2–4 (0–5) |
| combat tricks | 3–6 (2–9) | 5–9 (4–11) | 2–4 (0–6) | 0–5 (0–7) |
| counterspells | 0–1 (0–1) | 3–4 (3–5) | 0–2 (0–3) | 0–0 (0–2) |
| protection | 0–3 (0–4) | 2–5 (0–7) | 0–0 (0–2) | 0–0 (0–2) |
| ramp | 0–4 (0–6) | 0–5 (0–7) | 2–6 (1–7) | 3–9 (2–11) |
| finishers (points, extra turn, 6+ units) | 1–3 (0–4) | 1–4 (0–5) | 0–3 (0–3) | 6–10 (6–11) |
| interaction total | 10–15 (7–18) | 15–18 (14–20) | 8–16 (4–22) | 14–20 (12–21) |
| reaction-speed spells | 1–4 (0–5) | 8–13 (7–14) | 3–6 (2–9) | 5–6 (3–8) |
| printed power pips | 16–24 (14–28) | 15–18 (14–20) | 17–22 (12–26) | 26–31 (23–34) |
| champion units, all | 7–11 (4–14) | 3–7 (2–9) | 1–5 (1–7) | 1–4 (1–7) |
| signature cards | 0–3 (0–3) | 0–3 (0–3) | 0–3 (0–3) | 0–2 (0–3) |
| names played as 3-ofs | 6–9 (5–11) | 6–9 (6–9) | 7–10 (6–11) | 8–9 (7–10) |

Where a legend has n ≥ 8 lists (2.5), prefer that legend's own p25–p75 over the archetype band [H]. With n between 5 and 7, average the two.

### 3.2 Rune split formula

Inputs: for the legend's two domains, `demand_d = printed Power pips on cards of domain d + domain symbols of d in rules text outside reminder text`, summed over the 40 with copies; a multi-domain card splits its printed pips evenly. `s` = share of the larger demand.

Formula [H, fitted to D]:

```
major = clamp( round( 6 + 6 × (s − 0.5) ), 6, 9 )      // s = 0.50 → 6, 0.67 → 7, 0.83 → 8, 1.00 → 9
minor = 12 − major
```

- Fit [D: n = 406]: exact match with the player's choice in 49% of lists, within one rune in 90%. A steeper slope does worse (slope 12: 24% exact, 68% within one).
- Then run the castability check in 3.3 on every card with Power ≥ 2 and on the Chosen Champion. If a card you want on turn `t` is below 80%, move one rune toward its domain and re-check the other domain. Report both numbers, do not optimise silently [H].
- Single-domain demand (s near 1) still gets 3 runes of the other domain in practice (9-3 in 16 lists, 10-2 in 3) because the off-domain's activated costs and sideboard cards need them [D].
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

**A. P(at least one copy seen) by own turn T, 1v1, N=39. "keep" = no mulligan (4+T cards); "dig" = mulligan 2 looking for it (6+T cards)**

| copies | T1 keep | T1 dig | T2 keep | T2 dig | T3 keep | T3 dig | T4 keep | T4 dig | T5 keep | T6 keep | T8 keep |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 13% | 18% | 15% | 21% | 18% | 23% | 21% | 26% | 23% | 26% | 31% |
| 2 | 24% | 33% | 29% | 37% | 33% | 41% | 37% | 45% | 41% | 45% | 53% |
| 3 | 35% | 46% | 40% | 51% | 46% | 56% | 51% | 60% | 56% | 60% | 68% |
| 4 | 44% | 56% | 50% | 62% | 56% | 67% | 62% | 71% | 67% | 71% | 79% |
| 6 | 59% | 72% | 66% | 77% | 72% | 82% | 77% | 85% | 82% | 85% | 91% |
| 9 | 75% | 87% | 82% | 90% | 87% | 93% | 90% | 95% | 93% | 95% | 98% |
| 12 | 86% | 94% | 91% | 96% | 94% | 98% | 96% | 99% | 98% | 99% | 100% |
| 15 | 93% | 98% | 96% | 99% | 98% | 99% | 99% | 100% | 99% | 100% | 100% |
| 18 | 96% | 99% | 98% | 100% | 99% | 100% | 100% | 100% | 100% | 100% | 100% |

**B. Copies needed for P(at least one) >= target by own turn T (no mulligan / with 2-card dig)**

| target | T1 | T2 | T3 | T4 | T5 | T6 |
|---|---|---|---|---|---|---|
| 50% | 5 / 4 | 4 / 3 | 4 / 3 | 3 / 3 | 3 / 3 | 3 / 2 |
| 75% | 9 / 7 | 8 / 6 | 7 / 5 | 6 / 5 | 5 / 4 | 5 / 4 |
| 85% | 12 / 9 | 10 / 8 | 9 / 7 | 8 / 6 | 7 / 6 | 6 / 5 |
| 90% | 14 / 11 | 12 / 9 | 11 / 8 | 9 / 8 | 8 / 7 | 8 / 6 |
| 95% | 17 / 13 | 15 / 12 | 13 / 10 | 12 / 9 | 10 / 9 | 9 / 8 |

**C. Opening hand (4 cards, before mulligan): P(x copies) for a group of K cards**

| K | P(0) | P(1) | P(2) | P(3+) | P(>=1 after a 2-card dig when 0) |
|---|---|---|---|---|---|
| 3 | 72% | 26% | 2% | 0% | 40% |
| 6 | 50% | 40% | 10% | 1% | 66% |
| 9 | 33% | 44% | 19% | 3% | 82% |
| 12 | 21% | 43% | 28% | 8% | 91% |
| 15 | 13% | 37% | 35% | 15% | 96% |
| 18 | 7% | 29% | 39% | 25% | 98% |
| 21 | 4% | 21% | 39% | 36% | 99% |
| 24 | 2% | 13% | 35% | 50% | 100% |

**D. Multiplayer first player (skips first draw: 3+T cards) vs others, P(>=1) by T2 and T3**

| copies | T2 first | T2 other | T3 first | T3 other |
|---|---|---|---|---|
| 3 | 35% | 40% | 40% | 46% |
| 6 | 59% | 66% | 66% | 72% |
| 9 | 75% | 82% | 82% | 87% |
| 12 | 86% | 91% | 91% | 94% |

**E. Runes on board at own turn T (no recycling yet): first player 2T, second player 2T+1, cap 12**

| T | first | second |
|---|---|---|
| 1 | 2 | 3 |
| 2 | 4 | 5 |
| 3 | 6 | 7 |
| 4 | 8 | 9 |
| 5 | 10 | 11 |
| 6 | 12 | 12 |

**F. P(at least P runes of domain A among the r runes channelled), a = runes of A in the 12-card rune deck**

**Power cost 1**

| a | r=2 (T1 first) | r=3 (T1 second) | r=4 (T2 first) | r=5 (T2 second) | r=6 (T3 first) | r=7 (T3 second) | r=8 (T4 first) | r=9 (T4 second) |
|---|---|---|---|---|---|---|---|---|
| 2 | 32% | 45% | 58% | 68% | 77% | 85% | 91% | 95% |
| 3 | 45% | 62% | 75% | 84% | 91% | 95% | 98% | 100% |
| 4 | 58% | 75% | 86% | 93% | 97% | 99% | 100% | 100% |
| 5 | 68% | 84% | 93% | 97% | 99% | 100% | 100% | 100% |
| 6 | 77% | 91% | 97% | 99% | 100% | 100% | 100% | 100% |
| 7 | 85% | 95% | 99% | 100% | 100% | 100% | 100% | 100% |
| 8 | 91% | 98% | 100% | 100% | 100% | 100% | 100% | 100% |
| 9 | 95% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| 10 | 98% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
**Power cost 2**

| a | r=2 (T1 first) | r=3 (T1 second) | r=4 (T2 first) | r=5 (T2 second) | r=6 (T3 first) | r=7 (T3 second) | r=8 (T4 first) | r=9 (T4 second) |
|---|---|---|---|---|---|---|---|---|
| 2 | 2% | 5% | 9% | 15% | 23% | 32% | 42% | 55% |
| 3 | 5% | 13% | 24% | 36% | 50% | 64% | 76% | 87% |
| 4 | 9% | 24% | 41% | 58% | 73% | 85% | 93% | 98% |
| 5 | 15% | 36% | 58% | 75% | 88% | 95% | 99% | 100% |
| 6 | 23% | 50% | 73% | 88% | 96% | 99% | 100% | 100% |
| 7 | 32% | 64% | 85% | 95% | 99% | 100% | 100% | 100% |
| 8 | 42% | 76% | 93% | 99% | 100% | 100% | 100% | 100% |
| 9 | 55% | 87% | 98% | 100% | 100% | 100% | 100% | 100% |
| 10 | 68% | 95% | 100% | 100% | 100% | 100% | 100% | 100% |
**Power cost 3**

| a | r=2 (T1 first) | r=3 (T1 second) | r=4 (T2 first) | r=5 (T2 second) | r=6 (T3 first) | r=7 (T3 second) | r=8 (T4 first) | r=9 (T4 second) |
|---|---|---|---|---|---|---|---|---|
| 2 | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| 3 | 0% | 0% | 2% | 5% | 9% | 16% | 25% | 38% |
| 4 | 0% | 2% | 7% | 15% | 27% | 42% | 59% | 76% |
| 5 | 0% | 5% | 15% | 31% | 50% | 69% | 85% | 95% |
| 6 | 0% | 9% | 27% | 50% | 72% | 88% | 97% | 100% |
| 7 | 0% | 16% | 42% | 69% | 88% | 97% | 100% | 100% |
| 8 | 0% | 25% | 59% | 85% | 97% | 100% | 100% | 100% |
| 9 | 0% | 38% | 76% | 95% | 100% | 100% | 100% | 100% |
| 10 | 0% | 55% | 91% | 100% | 100% | 100% | 100% | 100% |

**G. Minimum runes of a domain for P(pay power cost P on turn T) >= 90% / >= 80% (first player; second player in brackets)**

| P | T1 | T2 | T3 | T4 |
|---|---|---|---|---|
| 1 | 8/7 [6/5] | 5/4 [4/3] | 3/3 [3/2] | 2/2 [2/2] |
| 2 | 12/11 [10/9] | 8/7 [7/6] | 6/5 [5/4] | 4/4 [4/3] |
| 3 | -/- [12/12] | 10/10 [9/8] | 8/7 [7/6] | 6/5 [5/5] |

**H. Expected copies of a K-card group among cards seen by turn T (keep): K*(4+T)/39**

| K | T1 | T2 | T3 | T4 | T5 | T6 |
|---|---|---|---|---|---|---|
| 6 | 0.77 | 0.92 | 1.08 | 1.23 | 1.38 | 1.54 |
| 9 | 1.15 | 1.38 | 1.62 | 1.85 | 2.08 | 2.31 |
| 12 | 1.54 | 1.85 | 2.15 | 2.46 | 2.77 | 3.08 |
| 15 | 1.92 | 2.31 | 2.69 | 3.08 | 3.46 | 3.85 |
| 20 | 2.56 | 3.08 | 3.59 | 4.10 | 4.62 | 5.13 |
| 25 | 3.21 | 3.85 | 4.49 | 5.13 | 5.77 | 6.41 |

Worked answers:
- *Copies needed to see a card by turn N.* A 3-of is seen by turn 3 in 46% of games and by turn 5 in 56%; digging two cards with the mulligan lifts turn 3 to 56%. Even by turn 8 a 3-of has been seen in only 68% of games, so a plan must rest on **groups** of interchangeable cards (table B): 7 copies for 75% by turn 3, 9 for 85%, 11 for 90%.
- *A two-drop on turn 2.* With 9 units costing ≤ 2 (the unit-aggro median) you have at least one by turn 2 in 82% of games without a mulligan and 90% with a two-card dig. With 6 it is 66% and 77%.
- *Opening hands.* With 9 early units, 33% of opening fours have none; throwing back two cards fixes that 82% of the time overall (table C, last column).
- *Runes for Power 1.* Going first, a turn-2 Power-1 card (4 runes on board) is castable 97% of the time on 6 runes of its domain, 93% on 5, 86% on 4. A 7-5 split costs the minor domain four points on turn 2.
- *Runes for Power 2.* Going first on turn 3 (6 runes on board): 96% with 6 runes of that domain, 88% with 5, 73% with 4. To cast a Power-2 card on turn 2, 8 runes give 93% and 6 give 73%. This is why 8-4 appears only when the minor domain has almost no Power-2 cards.
- *Runes for Power 3.* On turn 4 going first (8 runes): 97% with 6, 85% with 5, 59% with 4.
- *Going second* is worth one extra rune in every row; for example Power 2 on turn 2 with 6 runes rises from 73% to 88%.

## 4. Synergy axes

Each axis has an **enabler** pattern (makes the thing happen) and a **payoff** pattern (rewards it). Patterns are the `AXES` table in `analysis/axes.mjs`; counts are over the 953 named main-deck cards, 58 legends and 74 non-token battlefields in the gallery on 2026-11-11 [D]. "Legends" lists champion tags whose legend text matches the payoff pattern.

pool: 953 named main-deck cards, 58 legends, 74 battlefields

| axis | enablers (pool) | payoffs (pool) | both | legends with payoff text | battlefields with payoff text | example payoffs |
|---|---|---|---|---|---|---|
| tokens / go-wide | 51 | 38 | 1 | Lillia, Darius, Master Yi | 2 | Alpha Strike; Azir, Sovereign; Banner of Conquest |
| buffs | 36 | 17 | 8 | Sett | 1 | Albus Ferros; Bilgewater Bully; Call to Glory |
| equipment / attach | 43 | 20 | 1 | Azir, Jax, Lucian | 2 | Akshan, Mischievous; Angle Shot; Aphelios, Exalted |
| gear matters | 132 | 23 | 4 | Jarvan IV, Orianna | 2 | Aspiring Engineer; Battle Preparations; Battlefield Armorer |
| discard | 23 | 4 | 0 | - | 0 | Flame Chompers; Jinx, Rebel; Mask Mother |
| trash / recursion | 56 | 53 | 6 | Mordekaiser | 1 | Annie, Stubborn; Aspiring Engineer; Assembly Rig |
| stun | 28 | 7 | 3 | - | 0 | Leona, Zealot; Monch; Solari Shrine |
| movement | 58 | 30 | 3 | - | 0 | Akali, Silent; Akali, Deadly Weapon; Apprentice Smith |
| enemy displacement | 20 | 3 | 3 | - | 0 |  |
| conquer triggers | 161 | 40 | 8 | Irelia, LeBlanc, Ivern, Garen, Vi, Sett, Rek'Sai | 17 | Adaptatron; Arachnoid Horror; Bloodscent Swarm |
| hold triggers | 102 | 36 | 8 | Poppy | 14 | Ahri, Alluring; Arachnoid Horror; Clocktower Guardian |
| mighty (5+ Might) | 229 | 9 | 3 | Fiora, Volibear | 1 | Fiora, Victorious; Fiora, Worthy; Raving Witness |
| spell-slinging | 146 | 23 | 0 | Kai'Sa, Lux, Jhin | 2 | Annie, Fiery; Annie, Stubborn; Applied Researchers |
| rune ramp / big energy | 69 | 202 | 14 | - | 2 | Alpha Wildclaw; Angler Wyrm; Anivia, Primal |
| XP / Level | 26 | 23 | 11 | Poppy, Kha'Zix, Master Yi | 0 | Bandle Soldier; Combat Experience; Concentrate |
| hidden / facedown | 49 | 16 | 8 | Evelynn, Teemo | 2 | Black Market Broker; Bushwhack Trap; Evelynn, Consuming |
| deathknell / sacrifice | 48 | 26 | 1 | - | 1 | Altar of Memories; Atakhan; Baited Hook |
| empower | 36 | 15 | 7 | Ekko, Yordle, Zed, Ambessa, Mel | 0 | Guttural Roar; Hextech Formula; Lacerate |
| deploy / bombs (RAD) | 19 | 5 | 0 | Jarvan IV | 0 | Battlefield Armorer; Command: Attack; Hexplosive Minefield |
| show off (RAD) | 214 | 6 | 1 | - | 0 | Battle Preparations; Gutter Guardian; Incorrigible Construct |
| disarm / shrink | 31 | 15 | 1 | - | 0 | Angler Beast; Blood Money; Burn Away |
| legion (second card) | 80 | 10 | 0 | Darius | 0 | Battering Ram; Dangerous Duo; Darius, Executioner |
| attack (Assault) | 41 | 41 | 4 | - | 1 | Ahri, Inquisitive; Anivia, Primal; Atakhan |
| defend (Shield/Tank) | 52 | 4 | 0 | - | 1 | Atakhan; Overzealous Fan; Teemo, Strategist |
| deflect / being chosen | 49 | 7 | 1 | Irelia, Ezreal | 0 | Aphelios, Exalted; Hungry Wolf; Jae Medarda |
| top-deck (Vision/Predict) | 21 | 28 | 2 | Rek'Sai | 2 | Akali, Brash; Apprentice Smith; Baited Hook |
| ready / exhaust | 45 | 25 | 2 | - | 0 | Angler Wyrm; Arena Kingpin; Caitlyn, Patrolling |
| solo / alone | 51 | 7 | 2 | Master Yi | 1 | Arachnoid Horror; Isolate; Kha'Zix, Mutating Horror |
| hand size / draw matters | 109 | 6 | 2 | Jinx | 0 | Divine Judgment; Frigid Jewel; Gutter Palace |
| gold | 22 | 4 | 1 | Renata Glasc | 0 | Jayce, Man of Progress; Zaun Punk; Ziggs, Explosive |

**tag axes (members = cards carrying the tag; payoffs = cards whose rules text names the tag)**

| tag | members | payoff cards | legends naming it | battlefields naming it | example payoffs |
|---|---|---|---|---|---|
| Ionia | 83 | 0 | - | - |  |
| Noxus | 56 | 0 | - | - |  |
| Bilgewater | 42 | 2 | - | - | Illaoi, Prophet of the Great Kraken; Up from the Deep |
| Equipment | 41 | 13 | Azir, Jax, Lucian | Forge of the Fluft, Veiled Temple | Akshan, Mischievous; Angle Shot; Aphelios, Exalted |
| Demacia | 39 | 0 | - | - |  |
| Shurima | 38 | 0 | - | - |  |
| Bandle City | 37 | 0 | - | - |  |
| Yordle | 36 | 0 | - | - |  |
| Shadow Isles | 33 | 0 | - | - |  |
| Piltover | 31 | 0 | - | - |  |
| Mount Targon | 31 | 0 | - | - |  |
| Freljord | 29 | 0 | - | - |  |
| Zaun | 27 | 0 | - | - |  |
| Dragon | 21 | 4 | - | Dragon Roost | Direwing; Gentle Gemdragon; Herald of Scales |
| Mech | 17 | 17 | Rumble | - | Antagonistic Apparatus; Assembly Rig; Breakneck Mech |
| Spirit | 17 | 0 | - | - |  |
| Device | 17 | 0 | - | - |  |
| The Void | 15 | 0 | - | - |  |
| Fae | 15 | 0 | - | - |  |
| Dog | 15 | 7 | - | - | Daisy!; Friendship; Ivern, Friend to All |
| Poro | 14 | 8 | - | - | Daisy!; Friendship; Ivern, Friend to All |
| Pirate | 14 | 0 | - | - |  |
| Cat | 13 | 7 | - | - | Daisy!; Friendship; Ivern, Friend to All |
| Trifarian | 12 | 0 | - | - |  |
| Elite | 11 | 0 | - | - |  |
| Bird | 9 | 14 | - | Trapping Grounds | Carrion Dredger; Daisy!; Flurry of Feathers |
| Ixtal | 8 | 0 | - | - |  |
| Neeko | 1 | 1 | - | - | Neeko, Blending In |

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

Read this as 6-7% wrong or missing text-based labels in a fresh sample (7 of 105, then 5 of 86), a little worse than the role classifier's last random round (2.2). Round 2 was not re-sampled after its two fixes. The counts in the table above are the post-fix counts.

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
- 25 cards hit "all" or "each" units; board size roughly doubles at a four-player table.
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
- **Politics.** FFA has no rule that binds deals. The only rules-level political levers are who you attack, who you give a Burn Out point to (CR 432.2.c), and the lead check in CR 474 (a player at 8 who is tied does not win). A score that is "ahead of every opponent" invites two players to attack the leader; cards that gain the last points without combat avoid that.
- **2v2 pairing.** Score a pair of decks together: the two legends must differ, the six battlefields must be six different names, and "friendly" payoffs on one deck count the other deck's units as enablers.

### 5.3 Community sources [C]

"Riftbound Multiplayer Rules - How 2v2, Skirmish and War Actually Work", gamertagmythras.com (published 2026-08-02, updated 2026-11-01), https://gamertagmythras.com/blog/riftbound-tcg/riftbound-multiplayer-2v2-rules:
- Restates the mode table above and the 2v2 scoring clauses; its rule content matches CR 487-491 as read here.
- Argues that 11 points is slow in practice: a team holding all three battlefields scores them only on one teammate's turn per round, about 3 points per four turns, so a game takes at least four full rounds. This is an arithmetic consequence of CR 491.8.b.1 and looks correct, but it is their reasoning, not a Riot statement.
- Says the Master Yi legend was banned in 2v2 effective 2026-07-24 because the +2 Might reaches a teammate's lone defender. The ban is confirmed on the Rules Hub; the stated reason is consistent with the July article (https://playriftbound.com/en-us/news/announcements/july-ban-list-updates) but was not quoted from it here.
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
6. Archetype override [D-based]: big-control (median 0–6 units costing ≤ 2) uses `EARLY ∪ CHEAP_IX ∪ ramp with energy ≤ 2` as its keep class; gear-engine uses `EARLY ∪ ENGINE`.

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
| big-control | 10–11 cards costing 6+, 10–13 removal, 10–15 card flow, 0 counterspells in most lists, sweepers in few | "You are the beatdown. They do little before turn 3 (0–6 units costing ≤ 2): score early holds. Spread across both battlefields; 87% of all lists run no sweeper [D]. Save {counterspell / hand_attack names} for their 6+ cards: {known finishers of that legend from 2.6 data}. Do not hold cards past turn 5 against Time Warp-style finishers." |
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
- Calibration target: for the 20 legends with n ≥ 8, cards in ≥ 50% of that legend's lists should score ≥ 70 and off-identity-theme cards with 0% play should score < 35.

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
- Sideboard size 8 in the September sample → 10 allowed and used (TR 601.1.c.1; 2.9).

Could not verify:
- Items 0.3, 0.4, 0.7, 0.8 (outcome of the playtest); the true card types of the seven RAD rows in 0.10.
- RC Europe dates and metagame shares (community only; riftdecks.com and mobalytics.gg returned HTTP 403 and were not retried).
- api.riftcodex.com timed out on 2026-11-11; the gallery was used instead, so Riftcodex-only fields (TCGplayer ids) were not refreshed.
- Which Tournament Rules edition raised the sideboard from 8 to 10.
- Any multiplayer deck data.
