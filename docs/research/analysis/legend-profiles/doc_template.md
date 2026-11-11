# Legend profiles: one synced record per Legend (research, 2026-11-11)

Purpose: give the Riftbound Forge builder a per-Legend record it can key on, so that every piece of advice names the cards of the deck in front of it and carries a visible reason. The record has two halves that are synced separately:

- a **text-derived half**, computed from card text only (rewards, needs, enables, Chosen Champion options, signature cards, weighted theme axes, battlefields that interact with the text);
- a **data-derived half**, counted from published decklists and event reports (popularity, results, typical Chosen Champion, rune split, battlefields, core and flex cards, and an explicit confidence flag).

Labels used below: **FACT** = primary source (official card text, official rules, official announcement). **DATA** = measured by us, with dataset and n. **HEURISTIC** = our judgement or a fixed formula of ours. **UNCONFIRMED** = could not be checked against a primary source.

This document is generated: section 9 (the per-legend appendix) and every table come from the scripts in `docs/research/analysis/legend-profiles/`. Re-run instructions are in section 10.

## 1. Result in short

- **58 Legends exist today, not 49.** FACT: the local `cards.json` (built 2026-09-06) has 49. The official card gallery on 2026-11-11 adds the set **Radiance (RAD, released 2026-10-23)** with **9 new Legends** (section 2.1).
- **Every one of the 58 has a text profile.** The generator parsed all 58 ability texts into kind / cost / condition / effect and found at least one theme axis for each. Against the GameLab engine's hand-scripted legends the ability kinds agree for {{ENGINE_AGREE}} of {{ENGINE_TOTAL}} (section 4.5).
- **Data coverage is uneven and must be shown as such.** DATA: {{N_PA_COMPLETE}} complete lists fetched on 2026-11-11 ({{PER_LEGEND_DIST}}). With our thresholds: {{CONF_OK}} `ok`, {{CONF_THIN}} `thin`, {{CONF_INSUFF}} `insufficient`; the fetch was cut at 200 pages for time, so `thin` here mostly means "we fetched 3", not "only 3 exist". Independently of how much we fetched, **{{N_SCARCE}} legends are `scarce`**: the published-list index itself has fewer than 10 Radiance-era lists or fewer than 3 event-named ones for them (section 6).
- **Published-list popularity and tournament share are different things.** DATA: the most-built legends on Piltover Archive since Radiance are {{TOP_POP}} (lists). The Europe Regional Championship field was 43.3% Riven (riftbound.gg report). The app must never present list counts as "meta share".
- **Local card data is incomplete in a way that matters for text analysis.** FACT: for {{N_EFFECT}} Equipment cards `cards.json` holds only the Equip line; the granted effect lives in a separate gallery field (`effect`) that the September build dropped (section 2.3).

## 2. What changed since the local September 2026 snapshot

### 2.1 New Legends (FACT)

Source: official card gallery https://playriftbound.com/en-us/card-gallery/ fetched 2026-11-11 (1,408 printings; RAD has 219 printings, 18 of them legend printings = 9 legends, each with a base and an overnumbered printing). Release date 2026-10-23 and "nine new Legends": https://playriftbound.com/en-us/news/announcements/the-radiance-overview/ (local copy `docs/research/analysis/raw/radiance-overview.html`, fetched 2026-11-11).

{{RAD_TABLE}}

- DATA: after grouping printings, the pool used here is {{N_POOL}} gameplay cards ({{N_RAD}} of them RAD). This matches the 167 numbered RAD cards reported in `legality-and-data.md`.
- DATA: {{N_INCOMPLETE}} RAD gallery records had an empty card type on 2026-11-11 and most have an empty domain list: {{INCOMPLETE_LIST}}. The type is recovered from the image accessibility text; where the domain is missing the card is **never counted as inside a Domain Identity** (so axis pools for every legend are undercounted by up to 11 cards until the gallery is fixed). Hush is one of them and appears in many fetched lists.
- UNCONFIRMED (not checked by us against a primary page): later sets. `legality-and-data.md` section 2.3 lists Legacy (2027-01-29) and The Reckoning (2027-04-30) from the official products article; no Legend of those sets is public in the gallery today.
- DATA: Riftcodex (https://api.riftcodex.com/cards, fetched 2026-11-11, 15 pages) returned 1,451 printings, the same ids as the local copy of 2026-09-06, newest `updated_on` 2026-07-21, no RAD. It cannot be the source for new legends.

### 2.2 A Legend's own text changed (FACT)

`cards.json` and the gallery differ on {{N_WORDING}} cards in wording. One of them is a Legend: OGN-259 Unforgiven now reads "to or from **your** base" instead of "its base". Full list:

{{WORDING_TABLE}}

The generator keeps the `cards.json` text in `rulesText` and puts the newer gallery text in `rulesTextCurrent`; axis detection uses the newer one.

### 2.3 Equipment effect text is missing from cards.json (FACT)

For {{N_EFFECT}} Equipment cards the gallery has a second text field (`effect`) that `cards.json` does not carry. Examples: {{EFFECT_EXAMPLES}}. Codes: {{EFFECT_CODES}}.

Consequence: any trait or axis derived from `cards.json` `rulesText` alone misses what these Equipment do (conquer triggers, Gold, Ganking, Shield). That includes `Untitled/apps/web/src/lib/scoring.ts` if it reads only `rulesText` (HEURISTIC: not verified in that code). The generator here merges the gallery `effect` text for those cards. A further {{N_RUNE}} differences are the six basic runes and five units without rules text, where `cards.json` holds a placeholder sentence ("Riftbound Rune: Body Rune.", "Riftbound Unit: Mega-Mech.") and the gallery holds nothing. Those placeholders must not be fed to text analysis.

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
- **Extra legends.** CR 107.4.d.1: legends added to the Legend Zone by effects are not Champion Legends. RAD-167 Neeko, Blending In lets a deck register up to 3 additional legends (`rules.md` section 8.3). A profile is therefore also relevant when its legend is someone else's extra legend. DATA: in the fetched lists these legends were registered as extra legends: {{NEEKO_LIST}}.

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

{{N_AXES}} axes: {{AXIS_LIST}}. Ids follow `Untitled/apps/web/src/lib/scoring.ts` `TRAIT_LABELS` where the same concept exists there. Tags and token names that the legend text names (Mech, Sand Soldier, Recruit, Bomb, and through Brush's reminder text Bird, Cat, Dog, Poro) become `tag:<Name>` axes.

Weight of an axis for a legend, fixed constants {{WEIGHTS}}:

- base = 1.0 if the legend text rewards it, 0.8 if it needs it, 0.6 if it only enables it;
- plus 0.2 x (share of the legend's Chosen Champion options whose text mentions the axis) plus 0.1 x (share of its signature cards that do), capped at 1.0;
- if the legend text does not mention the axis at all: 0.35 x champion share + 0.15 x signature share (so at most 0.5).

Each axis also carries `poolSupport`: the main-deck cards inside the legend's Domain Identity that do the thing (by text pattern or by a structural test such as "spell costing 4 or more"). This is what turns an axis into named cards. Example (DATA, generated): Radiant Dawn rewards Stun ("When you stun one or more enemy units"); inside Calm/Order there are {{LEONA_POOL_N}} cards with a stun in their text, starting with {{LEONA_POOL}}.

### 4.4 Battlefields by text (HEURISTIC)

For every non-token battlefield the same axis patterns run over its text, split into its trigger ("When you hold here") and its effect. A battlefield is listed for a legend when:

- it **gives** something the legend rewards or needs, or it **asks for** something the legend produces (complementary, score 1.0 x axis weight); or
- it triggers on the same event the legend rewards (shared trigger such as conquer or hold, score 0.5 x axis weight); or
- it says "ready your legend" and the legend's ability exhausts the legend (+0.6; today only SFD-210 Hall of Legends).

Two texts that merely produce the same thing do not count. Each reason stores both verbatim fragments. Legends with no text-fit battlefield at all: {{NO_BF}}. For those the app must fall back to the data half or say that the legend text gives no battlefield preference.

### 4.5 Checks and known misreads

- DATA (cross-check against the engine): `docs/research/analysis/interactions/engine-scripts.json` is a dump of the GameLab engine's scripted cards (`GameLab/packages/cards`). After mapping the engine's `passive`, `costMod` and `globalMod` to our `static`, the multiset of ability kinds is identical for {{ENGINE_AGREE}} of the {{ENGINE_TOTAL}} legends the engine scripts. Differences: {{ENGINE_DIFFS}}. All are counting conventions (the engine splits "conquer or hold" into two triggers and "unit, gear, or activated ability" into three, and treats the `[Empower]` cost line as a keyword rather than an ability), not different readings of the text. The 9 RAD legends have no engine script, so their parse is unchecked.
- DATA (does the text half agree with what people register?): {{BF_VALID}}. {{AXIS_VALID}}. Reading: the axis pools do capture cards people actually build around, but **text fit explains only a minority of battlefield choices**. Most registered battlefields are generic picks. Across all fetched lists the most registered battlefields are: {{BF_TOP}}. HEURISTIC for the app: rank battlefields by registered frequency first (with n), and use the text fit as the explanation layer and as the tie-breaker, not the other way round.
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
| `pa-sample-2026-09-06` | `GameLab/data/decks/samples/piltover-archive-2026-09-06.json`: 59 lists saved from https://piltoverarchive.com/decks on 2026-09-06 | {{N_LOCAL}} lists with a legend, covering {{N_LOCAL_LEGENDS}} legends | Unleashed-era Regional Qualifier "best of" lists; before Radiance and before the 2026-09-18 bans |
| `pa-list-2026-11-11` | Deck index rows (id, name, legend code, views, dates) from https://piltoverarchive.com/decks?page=N, pages 1 to {{N_LIST_PAGES}} of about 417, crawled 2026-11-11 by the shared `analysis/crawl-list.mjs` | {{N_LIST_ROWS}} rows, {{N_LIST_RECENT}} created on or after 2026-10-23 | Site default order; published lists, not registrations |
| `pa-fetch-2026-11-11` | Deck pages https://piltoverarchive.com/decks/view/<id> fetched 2026-11-11 | {{N_PA_PARSED}} parsed, {{N_PA_COMPLETE}} complete (40+ main, 12 runes), {{N_PA_EVENT}} with an event marker in the name | Up to 6 per legend, event-named Radiance-era lists first; placements are whatever the uploader wrote in the name |
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
- Deck entries are matched to the pool by printing code, then by name. Unresolved entries in this run: {{UNRESOLVED}}.

Archetypes are deliberately not clustered beyond the Chosen Champion split. With at most 6 lists per legend any clustering would be noise (HEURISTIC). The sync should raise the per-legend budget before adding clustering.

## 6. Which legends have too little data

- **By what we fetched** (DATA, thresholds above): `ok` {{CONF_OK}} ({{CONF_OK_LIST}}); `thin` {{CONF_THIN}}; `insufficient` {{CONF_INSUFF}} ({{CONF_INSUFF_LIST}}). The fetch was stopped for time; it was ordered round-robin so every legend got its first list before any got a second. A full run (6 per legend, 348 pages) takes about an hour at the polite rate.
- **By what exists** (DATA, `pa-list-2026-11-11`): {{N_SCARCE}} legends are `scarce`: {{SCARCE_LIST}}.
- **No result line in either report** ({{N_NO_RESULTS}} legends): {{NO_RESULTS_LIST}}.
- **Scarce lists and no results at all** ({{N_NO_DATA_ADVICE}} legends): {{NO_DATA_ADVICE_LIST}}. For these the app should say "not enough tournament data for this legend; the advice below comes from card text only" and show the text half.

HEURISTIC for the app: show data-driven statements only when `dataConfidence` is `ok`; show them with "from n lists" when `thin`; hide them when `insufficient`. Always print n next to any rate.

## 7. Overview tables (generated)

### 7.1 Text half (HEURISTIC axes and battlefield fit, from FACT text)

Role abbreviations: rew = rewards, nee = needs, ena = enables.

{{OVERVIEW_TEXT}}

### 7.2 Data half (DATA)

Columns: lists since Radiance in `pa-list-2026-11-11`; riftbound.gg week-2 tier, wins, top cuts; Europe Regional Championship win rate and matches; complete fetched lists and how many are event-named; lists in the September sample.

{{OVERVIEW_DATA}}

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
{{EXAMPLE_JSON}}
```

Changes we recommend before this becomes the app's schema (HEURISTIC):

- Split era out of the dataset id: `samples` should be keyed by `{source, window}` so that a new ban or set opens a new window instead of mixing eras.
- Store `results` per source with its own `scope` and date, and allow several; today's two reports are a week apart and measure different things.
- Add `legality` per legend per format (Wuju Bladesman is banned in 2v2 only) from the legality file rather than from this profile.
- Keep `poolSupport.cardCodes` as codes only (as now); names and text come from the card table.

### 8.1 How the builder should use a profile (HEURISTIC)

- **Reasons are built from the record, not from templates about archetypes.** A sentence is assembled from `evidence.text` (the legend's words), the axis label, and the names of the deck's own cards found in `poolSupport.cardCodes`. Example for a concrete Radiant Dawn deck: "Radiant Dawn pays for stuns ('When you stun one or more enemy units'). This deck stuns with <the deck's cards that are in the stun pool, by name and copies>. <k> of {{LEONA_POOL_N}} available Calm/Order stun cards are unused: <names>." Two different decks give two different sentences because the card lists differ.
- **Rewards drive counts.** For a `rewards` axis the builder counts the deck's enablers for it and compares with the legal pool; for a `needs` axis a count of zero is an error-level warning (the legend ability is dead); for an `enables` axis it looks for payoffs in the deck.
- **Chosen Champion choice is a comparison of the listed units' own axes** against the deck's axis counts, plus the data half's distribution when `dataConfidence` allows.
- **Battlefields**: offer the text-fit list with both quoted fragments; add the data half's most-registered battlefields with n; drop anything with `bannedFrom` on or before today.
- **Never** print a rate without its n and dataset, and never call list counts "meta share".

## 9. Per-legend profiles (generated from the two JSON files)

Reading guide: "Text" is verbatim from the named source. "Parsed ability", "Rewards / Needs / Enables", "Theme axes" and "Battlefields by text" are HEURISTIC derivations from that text. "Chosen Champion options" and "Signature cards" are FACT (card data plus the cited rule); costs are Energy, Power, Might as printed. "Popularity and results" and "Played lists" are DATA with n. Core and flex lists show `decks/n` and, for core cards, average copies.

{{APPENDIX}}

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
- UNCONFIRMED: whether the `pa-list` default order biases the popularity counts (only the first {{N_LIST_PAGES}} of about 417 pages were crawled).
- Not done: clustering into archetypes beyond the Chosen Champion split; matchup data; side deck advice (other research tasks).
- Not done: a port of the generator to the app's language. The Python scripts are the reference behaviour; the regular expressions and constants are the specification.
