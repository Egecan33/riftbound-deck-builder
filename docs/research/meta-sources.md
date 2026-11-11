# Tournament and meta data sources (researched 2026-11-11)

What this file answers: where Riftbound Forge can get (1) data to anchor a casual / focused / competitive power target, (2) per-legend card inclusion and co-play, (3) matchup data, (4) side deck and rune-split statistics, for 1v1 and whatever exists for 2v2 and FFA; how to fetch each source politely; which tables to sync; how to weight; and what to do when a source is down.

All web sources were fetched on 2026-11-11 with a generic `User-Agent` (`Mozilla/5.0 (compatible; deck-research/1.0)`), serially, 1 to 1.5 s apart, with no personal data in any request. There were two passes on that day: about 10:39-10:47 UTC (an earlier run of this task that was cut off; its raw files were reused) and about 15:20-16:10 UTC. Raw downloads are in `docs/research/analysis/meta-sources/raw/` (git-ignored). Nothing here comes from memory.

Labels:

- **FACT**: stated by a primary source (playriftbound.com, official PDFs, developer.riotgames.com, the official event locator).
- **DATA**: measured from a dataset; the dataset and n are named.
- **HEURISTIC**: our own judgement.
- **UNCONFIRMED**: not confirmed from a primary source, or not tested.

A statement that "site X shows field Y" is DATA about that site (measured from the page fetched). The numbers a community site publishes (win rates, shares) are that site's own computation and are UNCONFIRMED as facts about the game.

Local paths: `GameLab/` = `~/github_repositories/GameLab/`, `Untitled/` = `~/github_repositories/Untitled/`, `raw/` = `docs/research/analysis/meta-sources/raw/`.

Player names appear in every results source. This file prints none, and the sync should store none (section 7.1).

## 1. Headline findings

1. **Usable matchup win-rate data exists, and it is machine-readable.** riftbound.org tournament pages embed a legend-versus-legend table of wins, losses and draws per tournament in plain JSON inside the HTML (section 3.1). Example: Regional Championship Europe (Stuttgart, 2026-11-06), 315 players, 1,130 matches, 8 x 8 legend table. This corrects `matchups-and-lines.md` section 4.1, which found only riftdecks.com (HTTP 403) and riftbound.gg (JavaScript loader). The cell values are a community site's computation from official pairings, so they are UNCONFIRMED as facts and small per cell (median non-mirror cell in that event is 8 matches).
2. **The upstream of all of it is official.** The official event locator `locator.riftbound.uvsgames.com` (FACT: linked from playriftbound.com event pages; it runs on UVS Games' platform) publishes registrations with wins, losses, draws, final standing and a `deck_id`, and its event object says `decklist_status: "PUBLISHED"` for RC Europe (section 3.3). Its JavaScript bundle names public-looking endpoints for round matches, standings and public decks. I did not call the API host, because its robots.txt disallows AI agents by name; whether those endpoints answer without login is UNCONFIRMED and needs one manual test by the owner.
3. **riftbound.org is the best single source for the current set.** Radiance window (from 2026-10-23): 1,485 lists with a known legend, 1,179 with a card list, from 19 tournaments, whole fields and not only top cuts. It gives per-legend share, W-L-D, top-cut count, wins; per-card and per-legend-per-card inclusion, average copies, side deck share; standings with records; per-deck match lists.
4. **Piltover Archive is a deck-builder site, not a results site.** Its `/tournaments` section has 141 events and none later than 2026-06-20; the pages carry no data in the HTML. Its value is (a) full, legal, exact 40 + 12 + 3 + side lists with battlefields and chosen champion, which riftbound.org's official-export lists lack, and (b) the community lists that are the only available stand-in for "casual / focused". About 103,600 public decks, 3,605 touched since 2026-10-26.
5. **Official primary data exists but stops before Radiance.** Eleven "Top Decks" articles on playriftbound.com (2026-02-25 to 2026-09-30) give a Day 1 and Day 2 legend count table per Regional Qualifier and 36 to 48 full lists each with "Legend Rank" and "Overall Rank" (459 lists in total). No article for a Radiance event exists yet (news index newest item 2026-11-05).
6. **riftbound.one** (the source the older project used) is top-3 only: 535 lists from 169 events, April to October 2026, only 27 lists dated 10/26. Good as a small, clean fallback.
7. **2v2 and FFA: no results source with decklists was found anywhere.** Only community-named lists on Piltover Archive (a few dozen with "2v2" or "FFA" in the title) and one team-trios event on riftbound.org. Multiplayer statistics will be thin and mostly heuristic.
8. **Terms matter.** Riot's developer policy forbids apps that "publish or retain metagame-defining data"; Piltover Archive's terms forbid using automated systems "to overload or scrape the Service"; several sites block AI crawlers in robots.txt. The owner has decided scraping is acceptable for this local, single-user tool. Section 2 records each restriction as found so the decision is made with the text in view.

## 2. Policy and terms, as found

| Source | Text | Where, fetched |
|---|---|---|
| Riot | Not approved: "Apps that publish or retain metagame-defining data for Riftbound", defined as "play rates for certain decks or cards, win rates for certain decks or cards, or match-up win percentage differentials". Also: "If your product serves players, you must register it with us regardless of whether or not your product uses official documented APIs." | FACT. https://developer.riotgames.com/policies/riftbound, 2026-11-11 (HTTP 200) |
| Piltover Archive | Prohibited: "Using automated systems (e.g., robots or spiders) to overload or scrape the Service." and "Collecting or harvesting any personally identifiable information from the Service." Terms "Last updated: April 14, 2026". | DATA. https://piltoverarchive.com/terms-of-service, 2026-11-11 |
| Piltover Archive robots.txt | `Allow: /`, `Allow: /decks?page=`, `Allow: /cards?page=`; `Disallow: /admin/`, `/api/`, `/decks?`, `/decks?page=*&`, `/cards?`, `/cards?page=*&` | DATA. `raw/robots-piltoverarchive.com.txt` |
| Riftools | "Do not attack, overload, scrape aggressively, or disrupt Riftools." Terms "Last updated: April 22, 2026". robots.txt disallows `/api/`. | DATA. https://www.riftools.app/terms, 2026-11-11 |
| riftdecks.com robots.txt | Comment: scraping "explity not allowed" for six named sites "And any other similar sites building a competing service"; `Disallow: /` for ClaudeBot, anthropic-ai, GPTBot and others. | DATA. `raw/robots-riftdecks.com.txt` |
| riftbound.gg, riftmana.com, riftboundop.com, api.cloudflare.riftbound.uvsgames.com | `Disallow: /` for `anthropic-ai` and `Claude-Web` (and ClaudeBot on two of them). `User-agent: *` is allowed on all four. | DATA. `raw/robots-*.txt` |
| riftbound.org robots.txt | `Allow: /`; disallows `/search`, `/admin`, auth pages, `/meta/*/*/copy`, `/decks/*/*/copy`, `/*/calendar.ics`. No crawl delay. | DATA. `raw/robots-riftbound.org.txt` |
| riftbound.org terms | The page exists (`updated: 2026-11-03` in its props) but its text is rendered in the browser from the script bundle. | UNCONFIRMED: text not read |
| riftbound.one robots.txt | `Allow: /`, `Crawl-delay: 1`; AI crawlers explicitly allowed. | DATA. `raw/robots-www.riftbound.one.txt` |
| locator.riftbound.uvsgames.com robots.txt | `Allow: /`, `Disallow: /players/` | DATA. `raw/robots-locator.riftbound.uvsgames.com.txt` |

Consequences for this research: I am an AI agent, so I did not fetch riftbound.gg, riftmana.com, riftdecks.com, riftboundop.com or the locator's API host. What this file says about those five comes from their robots.txt, from other pages that cite them, or from `matchups-and-lines.md`. The app's own sync is an ordinary script with a generic User-Agent and falls under each site's `User-agent: *` rules.

HEURISTIC, for the owner's decision:

- The Riot policy binds products that use the Riot API or "serve players". Riftbound Forge is local, single-user and unregistered, and the owner has accepted this. Keep derived meta numbers out of anything published: no committed data files, no screenshots of inclusion tables in the repo README, raw and derived data under the git-ignored `data/`.
- Piltover Archive's sentence can be read as "do not overload, and do not scrape". The owner allows scraping it. To stay on the careful side: paged listing and deck pages only (both allowed by robots.txt), never `/api/`, one request every 1.5 s or slower, conditional on `lastmod`, a hard daily cap, and no author names stored.
- Prefer sources whose robots.txt welcomes generic clients and that publish embedded JSON (riftbound.org, riftbound.one, playriftbound.com). Do not use riftdecks.com.

## 3. Sources, one by one

### 3.1 riftbound.org (community; recommended primary for stats)

Server-rendered Inertia app. Every page carries its whole data as JSON in `<script data-page="app" type="application/json">…</script>`; parse `props`. No key, no login. All samples below were fetched 2026-11-11 (files `raw/rorg-*.html`). Card ids are the official gallery ids (`rad-149-167`), which join directly to our card table.

| URL | `component` | What `props` holds |
|---|---|---|
| `/meta` | `Meta/Decks` | `window`, `windows[]`, `rows[]` (one per legend), `lists`, `pool`, `tournaments`, filter `groups[]` |
| `/meta/cards` and `/meta/cards?legend={legend-key}` (plus `?page=N`) | `Meta/Cards` | `cards[]` (100 per page), `total`, `pages`, `legend`, `window` |
| `/meta/{legend-key}` | `Meta/LegendDecks` | `decks[]`: every list of that legend in the window |
| `/meta/{legend-key}/{id}-{player-slug}` | `Meta/Deck` | `deck` (sections, quantities, legality check) and `tournament` (entry record, `matches[]`) |
| `/meta/tournaments` (plus `?page=N`) | `Meta/Tournaments` | `tournaments[]` (about 50 per page), `total`, `players`, `span` |
| `/meta/tournaments/{slug}` (plus `?page=N` for standings) | tournament page | `tournament`, `winner`, `bracket[]`, `field[]`, `matchups`, `standings[]` (100 per page) |
| `/sitemap.xml` → `sitemap-pages.xml` (4,046 URLs), `sitemap-events.xml` (38,685), `sitemap-cards.xml` | | every legend, deck and tournament URL |

Trimmed real samples (DATA; player fields removed):

```json
// /meta  props.window and one of props.rows
{"key":"radiance","name":"Radiance","from":"2026-10-23","to":null,"open":true,"lists":1179,"tournaments":19}
{"id":"rad-149-167","key":"riven-the-exile","name":"Riven, The Exile",
 "meta":{"share":0.2101,"decks":312,"win_rate":0.5578,"wins":1146,"losses":899,"draws":92,
         "cut":23,"cut_share":0.0737,"firsts":7,"price":{"amount":273.4,"currency":"USD"}}}

// /meta/cards?legend=riven-the-exile  one of props.cards (legend has 186 lists with cards)
{"id":"ogn-045-298","number":"OGN-045","name":"Defy","type":"Spell","energy":1,
 "meta":{"section":"deck","share":0.9946,"decks":185,"copies":2.85,"win_rate":0.587,
         "edge":{"win_rate":0.8,"matches":5,"side":null},"side_share":0.0699}}

// /meta/tournaments  one of props.tournaments
{"slug":"riftbound-regional-championship-europe-2026-11-06","kind_label":"Regional Championship",
 "date":"2026-11-06","place":"Stuttgart, Germany","country":{"code":"DE"},"players":315,"decks":309,
 "winner":{"legend":"Kennen, Heart of the Tempest","record":"12-2-1"}}

// /meta/tournaments/{slug}  props.tournament, one props.field row, one props.standings row, props.matchups
{"kind":"championship","date":"2026-11-06","players":315,"decks":307,"swiss_rounds":12,"top_cut":8,
 "matches":1130,"organizer":"UVS Games Organized Play","format":"Constructed","window":{"key":"radiance"}}
{"key":"kaisa-daughter-of-the-void","players":52,"share":0.1651,"cut":1,"wins":175,"losses":182,"draws":21,
 "win_rate":0.4907,"best":5}
{"rank":1,"place":"1st","legend":{"key":"kennen-heart-of-the-tempest"},"record":"12-2-1","wins":12,"losses":2,
 "draws":1,"points":37,"top_cut":true,"deck_url":"/meta/kennen-heart-of-the-tempest/{id}-{slug}","partial":true}
{"legends":[{"key":"riven-the-exile","players":126}, "…8 legends"],
 "cells":{"riven-the-exile":{"kennen-heart-of-the-tempest":{"wins":68,"losses":64,"draws":11}, "…"}, "…"}}

// /meta/{legend}/{id}-{slug}  props.tournament.entry, one of props.tournament.matches, props.deck.rules
{"rank":2,"record":"11-2-2","wins":11,"losses":2,"draws":2,"win_rate":0.8,"top_cut":true}
{"id":318733,"round":"Round 1","stage":"swiss","result":"lost","games":"1-2","opponent":"<removed>"}
{"legal":false,"counts":{"main":39,"rune":12,"battlefield":0,"sideboard":10,"signatures":3},
 "sizes":{"main":40,"rune":12,"battlefield":3,"copies":3,"signatures":3,"sideboard":10},"champion_tag":"Riven"}
```

Fields available: placement (`rank`, `place`, `top_cut`), record, event size (`players`), date, kind, country, format label ("Constructed"), legend, list by section with quantities, side deck, per-match results with game score, a per-tournament matchup table, field table per tournament, price.

Volume (DATA, n as stated by the pages):

- `/meta/tournaments`: `total: 285`, `players: 56459`, `span.from: 2026-02-20`. With the default filter "legends known" the list shows 99 tournaments holding 11,617 lists.
- Since Radiance became legal (2026-10-23): 25 tournaments listed, 19 with lists, 1,490 lists by the list's `decks` column; `/meta` reports 1,485 in `pool` and 1,179 `lists` with cards. The largest: LDXP Sacramento Showdown 25k (2026-10-24, 755 players, 723 lists), RC Europe (315, 309), Convergence IV (2026-10-31, 272, 235).
- 52 legends appear in the window; 13 have at least 30 lists, 33 have at least 10. Riven has 312 (21.0%), Kennen 143, Kai'Sa 141, then a long tail under 60 each.
- Other windows offered: "Vendetta after the bans" (1,365 lists) and "Vendetta" (521). The query parameter that selects a window was not tested (UNCONFIRMED; the tournaments page has a `window` filter key).

Freshness: the newest tournament in the list is dated 2026-11-08, three days before the fetch. The three Stuttgart side events of 2026-11-06 to 11-08 (1,208 to 1,976 players) are listed with 0 lists, so decklists lag standings.

Caveats (DATA):

- Lists that come from the official decklist export are **partial**: the RC Europe list examined has `"partial": true, "missing": {"champion": 1, "battlefield": 3}` and 39 main-deck cards. So battlefield choice and chosen champion cannot be learned from those lists. Rune counts and the side deck are present.
- `/meta/cards` sections are `deck`, `battlefield`, `legend`. Runes are not in the card table, so the rune split needs the deck pages.
- Mirror cells in `matchups.cells` are not symmetric (Riven versus Riven shows 88-112-10). Ignore mirror cells.
- The matchup table covers only the 8 most played legends of that tournament. Other pairings have to be rebuilt from deck-page `matches[]` joined to standings, which costs one request per deck.
- Page weight is high: a deck page is about 500 KB, a legend page about 870 KB, because each card object is repeated in full.
- Legend naming: `rows[].name` is the full "Riven, The Exile"; inside deck pages the legend card has `name: "The Exile"` and tag "Riven", the same split the official gallery now uses (`legality-and-data.md` section 1). Join on the gallery id, never on a name.

Polite recipe:

1. `GET /meta` (1 request). Store `window`, legend rows.
2. `GET /meta/tournaments?page=1..N` until a page is older than the last sync (2 requests today).
3. For each tournament that is new, or whose `decks` count changed: `GET /meta/tournaments/{slug}` and its standings pages (RC Europe has 4). Store tournament, field, standings without names, matchup cells.
4. For each legend in `/meta` rows: `GET /meta/cards?legend={key}&page=1..pages` (Riven: 114 cards, 2 pages; about 110 requests for all 52 legends).
5. Deck pages only where the list is needed: top-cut lists first (85 in the window), then lists of the legend the user is building, in the background, newest first, capped per run. Skip ids already stored; a stored deck never changes.
6. 2 s between requests, stop on any 429 or 5xx and retry next run, at most one full sync per day. Send `If-Modified-Since` or `If-None-Match` when the previous response gave validators (not checked whether it does: UNCONFIRMED).

A first full sync without deck pages is about 130 requests, under 5 minutes. All 1,179 deck pages would be about 600 MB and 40 minutes; do not do that in one go.

### 3.2 Piltover Archive (community deck builder; allowed by the owner)

Next.js App Router. No `__NEXT_DATA__`; data sits in `self.__next_f.push([1,"…"])` chunks that must be concatenated and unescaped (`analysis/pa-lib.mjs`, functions `flight` and `balanced`).

| URL | Result |
|---|---|
| `/decks?page=N` | 24 decks per page; payload has `"total":10000,"totalPages":417`. Page 417 and 418 both return HTTP 200 (`raw/pa-p417.html`, `pa-p418.html`). So the listing is capped at 10,000 rows. Order is a popularity or trending order, not date (average views per deck by page: page 1 = 7,646, page 10 = 2,029, page 100 = 171). |
| `/decks/view/{uuid}` | one deck, about 530 KB |
| `/sitemap.xml` → `/sitemap/decks/1..21`, `/sitemap/pages`, `/sitemap/profiles/1..5`, `/sitemap/teams/1` | deck sitemaps hold 5,000 URLs each with `lastmod` |
| `/tournaments`, `/tournaments/{uuid}` | page shell only; the table is filled in the browser. Title and meta description are server-rendered. |
| `/meta` | HTTP 404. There is no meta or tier page. |
| `/api/…` | disallowed by robots.txt; not called. |

Trimmed real samples (DATA, `raw/pa-decks-p1.html`, `raw/pa-deck-1.html`):

```json
// listing row
{"id":"493c5f53-…","name":"Best of riven …","description":"…","status":"public","views":16901,"likes":99,
 "videoUrl":null,"editedAt":"2026-11-10T17:53:24.608Z","createdAt":"2026-10-08T23:23:16.890Z",
 "legend":{"name":"Riven, The Exile","variantNumber":"RAD-173","colors":[{"name":"Calm"},{"name":"…"}]},
 "sets":[{"prefix":"RAD","name":"Radiance"}, "…"],
 "contentFlags":{"hasVideo":false,"hasGuide":false,"hasMatchups":false},
 "isLegal":true,"bannedCardNames":[],"upcomingBanCards":[]}

// deck page (system-imported tournament list)
{"id":"99f9a2a9-…","authorName":"Piltover Archive (System)",
 "name":"【Regional Qualifier】Hartford - #1 (…)","description":null,"status":"public","featured":false,
 "views":13863,"likes":52,"hasGuide":false,
 "editedAt":"$D2026-06-25T01:22:05.612Z","createdAt":"$D2026-06-21T23:06:49.975Z",
 "legend":{"variantNumber":"OGS-019","card":{"name":"Master Yi, Wuju Bladesman","type":"Legend", "…"}},
 "champions":[{"quantity":1,"card":{"name":"Master Yi, Tempered","super":"Champion","energy":4,"might":4}}],
 "battlefields":[{"quantity":1,"card":{"name":"Emperor's Dais","maxCopies":null,"banEffectiveDate":null}}, "…3"],
 "runes":[{"quantity":5,"card":{"name":"Calm Rune","super":"Basic"}}, "…"],
 "maindeck":[{"quantity":3,"variantId":"…","card":{"…"}}, "…"], "sideboard":["…"]}
```

Fields: full list by zone with quantities (legend, chosen champion, 3 battlefields, 12 runes, main, side deck), author, views, likes, created and edited timestamps, legality flag and banned card names, sets used, guide and matchup-notes flags. **No structured placement, event, record or event size.** For system-imported lists the placement is only in the deck name ("… - #1 (name)", "Best of <legend>", "Top 8"); for user lists it is whatever the author typed.

Volume and freshness (DATA):

- Sitemap: 20 files of 5,000 plus one of 3,605 = 103,605 public deck URLs. In file 21 every `lastmod` falls between 2026-10-26 and 2026-11-11 (1,094 in October, 2,511 in November), and `lastmod` equals the deck's `editedAt` for 1,247 of the 1,249 decks that could be cross-checked. So the sitemap is an edit-ordered feed: the last file is "everything touched in the last two to three weeks".
- A crawl of listing pages 1 to 144 on 2026-11-11 gave 3,456 unique decks (`analysis/raw/pa-list.jsonl`): 2,548 edited on or after 2026-10-23, 2,822 using a RAD card, 3,418 flagged legal, 22 authored by "Piltover Archive (System)". 463 have a tournament-looking name by regex (`analysis/select-tournament.mjs`, HEURISTIC), and 361 of those were fetched in full (`analysis/raw/pa-decks.jsonl`).
- In those 361 lists: side deck size 10 in 342, 8 in 5, 0 in 7; rune split 7-5 in 159, 6-6 in 127, 8-4 in 57, 9-3 in 16, 10-2 in 2.
- `/tournaments`: 141 event pages in the sitemap, all "1v1 format", by type 89 City Challenge, 37 Unofficial, 14 Regional, 1 National; dates 2025-07 to 2026-06-20; **none since**. The site labels the feature "BETA … Data may be incomplete". Meta descriptions give name, date and player count (for example Hartford, June 20, 2026, 1,954 players) and nothing else (`raw/pa-tournaments-meta.tsv`).
- 2v2 and FFA: in the 3,456 listing rows, 62 names match a multiplayer pattern, for example "… RC Stuttgart 2v2 5-0", "FFA Annie", "… MP 2v2 (RAD)". These are self-labelled community lists.

How the local sample was produced: `GameLab/data/decks/samples/piltover-archive-2026-09-06.json` says `"source": "https://piltoverarchive.com/decks (60 most recent, 2026-09-06)"`. It holds 59 decks (49 `complete`, 10 not), each with `name`, `source` (deck URL), `code`, `legend`, `chosenChampion`, `battlefields`, `main`, `runes`, `sideboard`, `counts`. **No script that produced it exists** in GameLab or Untitled: a search of both repositories for `piltoverarchive.com` and for the file name finds only readers (`GameLab/apps/server/src/library.ts`, `GameLab/apps/sim/src/run.ts`) and documents. It was most likely produced in an agent session and saved by hand (HEURISTIC). The scraper has to be written new; `analysis/crawl-list.mjs` and `analysis/fetch-decks.mjs` are working prototypes written today.

Polite recipe:

1. `GET /sitemap.xml`, then only the highest-numbered `/sitemap/decks/N` (and N-1 if the last sync is older than the first `lastmod` in N). Keep `(uuid, lastmod)` pairs newer than the last sync.
2. `GET /decks?page=1..40` for popularity (views, likes) and the name; about 960 decks.
3. Fetch `/decks/view/{uuid}` only for decks that pass a filter: touched since the current window opened, `isLegal`, uses the newest set or was edited after its release, and either views at least 500 or a tournament-looking name. Never refetch a deck whose `lastmod` did not change.
4. 1.5 s between requests, back off 5 s then 10 s on failure, stop the run after three consecutive failures, cap 300 deck pages per day.
5. Do not store `authorName`, avatars or owner handles.

### 3.3 Official event locator (primary; standings, pairings, decklists)

`https://locator.riftbound.uvsgames.com/events/{id}` is the official event page (FACT: Riftools' catalogue and playriftbound.com event articles link to it; the page shows the Riftbound and Riot logos). The HTML embeds a React Query cache in `__next_f` chunks with two filled queries: the event object and the first page of registrations. The API base named in the page is `https://api.cloudflare.riftbound.uvsgames.com/hydraproxy`.

Trimmed real sample (DATA, `raw/uvs-stuttgart.html`, event 1227032, fetched 2026-11-11; identifiers removed):

```json
// event
{"id":1227032,"name":"Riftbound Regional Championship: Europe","start_datetime":"2026-11-06T09:00:00+00:00",
 "starting_player_count":315,"game_type":"RIFTBOUND","display_status":"complete",
 "settings":{"decklist_status":"PUBLISHED","decklists_on_spicerack":true,"event_lifecycle_status":"EVENT_FINISHED",
   "maximum_number_of_game_wins_per_match":2,"minimum_number_of_players_in_match":2,
   "maximum_number_of_players_in_match":2,"is_team_event":false,
   "metagame_analysis_visibility":"SHOW_TO_ORGANIZER"},
 "tournament_phases":[
   {"phase_name":"Phase 1","round_type":"SWISS","number_of_rounds":6,"status":"COMPLETE",
    "rounds":[{"id":1570555,"round_number":1,"pairings_status":"GENERATED","standings_status":"GENERATED"}, "…6"]},
   {"phase_name":"Phase 2","round_type":"SWISS","number_of_rounds":6},
   {"phase_name":"Phase 3","round_type":"RANKED_SINGLE_ELIMINATION","number_of_rounds":3,
    "rank_required_to_enter_phase":8}]}

// registrations, page 1 of 32 (page_size 10, total 315)
{"registration_status":"ELIMINATED","matches_won":2,"matches_lost":4,"matches_drawn":0,
 "total_match_points":6,"final_place_in_standings":200,"deck_id":"a8beb053-…","team_name":null}
```

Fields: event name, dates, player count, phases and rounds (ids), best-of setting (`maximum_number_of_game_wins_per_match: 2` means best of three), team flag and players per match (so 2v2 events are distinguishable), per-player W-L-D, match points, final place, `deck_id`. In the Houston event of December 2025 (`raw/uvs-event.html`, 1,347 registrations) `deck_id` is null, so decklist publication is per event.

Route templates found in the locator's own script chunks (DATA, 54 chunks, 1,067 distinct `/api/v2/…` templates, `raw/uvs-chunks/`):

- `/api/v2/events/`, `/api/v2/events/{id}/`, `/api/v2/events/{id}/registrations/`
- `/api/v2/tournament-rounds/{round_id}/matches/paginated/`, `/api/v2/tournament-rounds/{round_id}/standings/paginated/`, `/api/v2/tournament-rounds/{round_id}/team-standings/`
- `/api/v2/deckbuilder/decks/public/{id}/`, `/api/v2/deckbuilder/deck-submissions/events/{event_id}/`
- admin-only analytics also exist by name (`…/admin/game-metagame-matchup-matrix/{game_slug}/`, `…/game-metagame-event-card-win-rates/…`), which shows the platform computes a matchup matrix for organisers. They are not public (`metagame_analysis_visibility: "SHOW_TO_ORGANIZER"`).

UNCONFIRMED: that the non-admin endpoints answer without a login, their response shapes beyond registrations, and any rate limit. I did not request the API host because its robots.txt lists `anthropic-ai`, `Claude-Web` and `ClaudeBot` under `Disallow: /`. `User-agent: *` is `Allow: /` with `Content-Signal: search=yes,ai-train=no`. The registrations query being pre-filled in a logged-out page is evidence that at least that endpoint is public. Riftools' methodology page says it uses "official match records when available" (https://www.riftools.app/methodology, 2026-11-11), which fits.

Event ids: Riftools publishes a static catalogue at `https://www.riftools.app/data/major-events/catalog.json` (not under its disallowed `/api/`): 72 major events, 53 with a locator URL, `updated_at: 2026-11-05`.

```json
{"id":"rq-houston-2025","title":"Riftbound Regional Qualifier Houston","type":"regional",
 "start_date":"2025-12-05","end_date":"2025-12-07","city":"Houston","region":"North America",
 "tournament_url":"https://locator.riftbound.uvsgames.com/events/291931","official_url":"https://playriftbound.com/…"}
```

Recipe (after the owner confirms with one manual `curl` that `…/hydraproxy/api/v2/events/1227032/registrations/?page=1&page_size=100` returns JSON without a login): for each major event id, page registrations; for each round id, page matches; fetch each distinct `deck_id` once. 2 s apart, majors only (a few dozen events a year). This would make the app independent of community aggregators for standings and matchups. Until confirmed, treat this source as "not available" and use riftbound.org.

### 3.4 playriftbound.com "Top Decks" articles (primary; field composition and best list per legend)

`https://playriftbound.com/en-us/news/organizedplay/{slug}/`, a Next.js Pages app with `__NEXT_DATA__`; the article body is HTML inside `props.pageProps.page.blades[type=articleRichText].richText.body`. robots.txt: `Allow: /`. Index: `/en-us/news/organizedplay/` and `sitemap_index.xml`.

DATA (11 articles parsed with `analysis/meta-sources/official-parse.mjs` into `raw/official-events.json`):

| Published | Slug | Field rows (legends) | Day 1 players (sum of table) | Day 2 | Lists |
|---|---|---|---|---|---|
| 2026-02-25 | the-best-decks-out-of-bologna | 28 | 1,466 | 246 | 36 |
| 2026-03-04 | vegas-top-decks | 28 | 1,417 | 235 | 36 |
| 2026-04-22 | lilles-top-decks | 28 | 1,736 | 319 | 36 |
| 2026-05-01 | atlantas-top-decks | 28 | 1,510 | 295 | 36 |
| 2026-05-21 | sydneys-top-decks | 40 | 1,235 | 193 | 48 |
| 2026-06-04 | vancouvers-top-decks | 40 | 1,496 | 265 | 48 |
| 2026-06-17 | utrechts-top-decks | 40 | 1,812 | 321 | 48 |
| 2026-06-24 | hartfords-top-decks | 40 | 1,663 | 307 | 48 |
| 2026-08-26 | barcelonas-top-decks | 41 | 2,130 | 379 | 41 |
| 2026-09-09 | singapores-top-decks | 43 | 1,893 | 303 | 41 |
| 2026-09-30 | los-angeles-top-decks | 44 | 1,962 | 371 | 41 |

Total 459 lists. A twelfth, older article exists at `/en-us/news/announcements/from-garen-to-annie-rq-houstons-top-decks/` (not parsed).

```json
// field row (Los Angeles)                      // deck (player removed)
{"legend":"Kennen","day1":165,"day1Pct":"8.4%",  {"legendRank":1,"legendField":…,"overallRank":…,
 "day2":63,"day2Pct":"17.0%"}                     "sections":{"legend":[{"qty":1,"name":"Renata Glasc, Chem-Baroness"}],
                                                   "champion":[{"qty":1,"name":"Renata Glasc, Industrialist"}],
                                                   "main deck":[{"qty":3,"name":"Baited Hook"}, "…39 cards"],
                                                   "battlefield":["…3"],"rune pool":[{"qty":5,"name":"Mind Rune"},{"qty":7,"name":"Order Rune"}],
                                                   "sideboard":["…10"]}}
```

What it gives: the only primary-source field composition (legend counts on Day 1 and Day 2, so a Day 2 conversion rate per legend), and the best-finishing list of each legend with its overall rank. Side deck totals are 8 through Hartford and 10 from Barcelona on, matching the rule change recorded in `rules.md` (TR 601.1.c.1, sideboard "10 or fewer"). Cards are given by name, so they must be resolved against the card table; older articles omit the legend line or the battlefields for some lists (see the section counts printed by the parser), so validate each list and keep only complete ones.

Freshness: none for Radiance. The newest organised-play items on 2026-11-11 are "Riftbound World Showcase" (2026-11-05) and "All Eyes on RC Europe" (2026-10-27). The Los Angeles article appeared 4 days after the event; a Stuttgart article may still come (UNCONFIRMED).

Recipe: fetch the index page once per sync; for each unseen slug matching `top-decks` or `best-decks`, fetch and parse it once. About one request per month.

### 3.5 riftbound.one `/decklists` (community; top-3 lists)

One static HTML page of 7.7 MB. Rows are `<tr class="deck-row" id="deck-N">` with cells `col-date` ("10/26", month/year only), `deck-name` (legend), `event-name`, `col-result` ("1ST", "2ND", "3RD"), followed by an expanded row with sections. Two embedded JSON blocks: `<script type="application/json" id="deck-payloads">` and `id="card-pool"`.

```json
// deck-payloads[0]                                   // card-pool[0]
{"idx":0,"cards":[{"id":"RAD-149","qty":1},           {"id":"RAD-136","baseId":"RAD-136","name":"Dockside Lock-Up",
 {"id":"RAD-043","qty":1},{"id":"OGN-067","qty":2},"…"]}  "tcgPlayerId":"721334","price":1.75}
```

DATA (`raw/r1-parsed.json`, fetched 2026-11-11): 535 lists, 169 events, 51 legends; results 183 first, 176 second, 176 third; by month 04/26: 98, 05/26: 157, 06/26: 104, 07/26: 46, 08/26: 68, 09/26: 35, 10/26: 27. In August the same page had 381 lists (`Untitled/docs/META_INGESTION.md`). The most common section shape is legend 1, champion 1, runes 12, battlefields 3, main 39, side deck 10 (130 lists) or 8 (78); about a fifth of rows are incomplete. Events include Chinese City Challenges and Regional Opens that no other English source lists.

Limits: no event size, no exact date, top 3 only, no records. robots.txt: allowed, `Crawl-delay: 1`. Recipe: one GET per sync with `If-None-Match`; reuse the parser in `Untitled/netlify/lib/meta-ingestion-core.mjs` (it already validates the two JSON blocks and maps "1ST" to a rank).

### 3.6 Riftools (community; do not scrape the stats)

https://www.riftools.app. Pages for meta tier list, card stats, winrates, matchup focus, legend breakdown are a single script app (every route returns the same 78 KB shell). Data comes from `/api/v3/analytics/{card-stats,matchup-focus,matrix,meta-map,players,winrates}`, and robots.txt disallows `/api/`. Not called.

Useful without the API: the static events catalogue (section 3.3) and the methodology page, which states how such sites compute things: "Matchup winrates use recorded non-mirror matches where both players can be mapped to known legends"; "Play rate is usage inside the filtered decklist field"; "Some events publish standings before complete decklists". Use Riftools as a cross-check by eye, not as a feed.

### 3.7 Sites not fetched because robots.txt blocks AI agents

- **riftbound.gg** (DotGG). `matchups-and-lines.md` section 4.1 records a `/meta/` page "measured daily from official organised-play results" that is a script loader, and weekly tier-list articles that quote single matchup cells. TCG Panel (below) states it builds on "12.221 listas de 210 torneos de riftbound.gg (DotGG), del 12 oct al 11 nov", which, if accurate, makes riftbound.gg the largest aggregator. UNCONFIRMED: its data endpoints and shapes. For the app's sync, `User-agent: *` permits most paths; a recipe would need a human to look at the network tab first.
- **riftmana.com**. Articles such as the Stuttgart meta report cited in `matchups-and-lines.md` (Riven 43% of the Day 1 field). Prose, not a feed.
- **riftdecks.com**. Publishes a win-rate matrix (page titles on 2026-11-11 per `matchups-and-lines.md`: "11434 Matches Analyzed" for Constructed). Forbids scraping for competing services and answered HTTP 403. Do not use.
- **riftboundop.com**. WordPress site; blocks ClaudeBot and Claude-Web; not examined.

### 3.8 Others examined

| Site | What it is | Result on 2026-11-11 |
|---|---|---|
| RiftAtlas, https://riftatlas.com/events and `/events/{slug}` | Event list (name, date, players, rounds, lists, winner legend) and event pages with top 8 records and a "Metagame" table: legend, share, players, top 8, win rate. Server-rendered text; structured data in `__next_f`. | Convergence IV: 227 players, "6 rounds + top 16", 227 decklists, 36 legends; links to TopDeck.gg as its source. robots.txt allows generic clients, disallows `/api/` (and `/decks/view` for GPTBot only). A workable second source for online events. Shape of the embedded JSON not mapped. |
| TopDeck.gg, https://topdeck.gg | Tournament platform used by Showdown-series and community events ("LDXP Sacramento - Riftbound Showdown 25k" is hosted there per the Riftools catalogue). Has `/metagame/riftbound/constructed`, `/elo/riftbound/constructed`, and a documented API (`/docs/tournaments-v2`, API key needed). | Pages are script-rendered (2 KB of text in the HTML). robots.txt `Allow: /`. Usable only through its API with a key: UNCONFIRMED terms and fields. An event named "The Magma Chamber Presents: Dual Queue" exists there ("Magma Chamber" is the 2v2 mode name, CR 491 per `legality-and-data.md` 3.4); its content was not readable without scripts. |
| Limitless, https://play.limitlesstcg.com | Has Riftbound as game code `RB` and a public JSON API. | `GET /api/tournaments?game=RB&limit=50` returned 10 tournaments in total, 4 to 32 players, newest 2026-07-19. Too small to matter. Sample: `{"game":"RB","name":"…","date":"2026-07-19T10:15:00.000Z","format":null,"id":"6a561db6…","players":7,"organizerId":1481}` |
| TCG Panel, https://tcgpanel.com/riftbound/mejores-mazos/ | Spanish page, server-rendered table: legend, share, win rate, top 8 count, price in euros, "last 30 days". | States its source as riftbound.gg. Riven 13% share and 59% win rate, Kai'Sa 10% and 52%, Kennen 9.5% and 56%. Third-hand; useful only as a sanity check. robots.txt disallows `/riftbound/mazo/` (deck pages). |
| riftboundstats.com | "Riftbound Stats | #1 Competitive Riftbound Database"; sitemap lists `/stats/meta`, `/stats/legends/{name}`, `/stats/cards`. | Home page is an empty script shell; robots.txt disallows `/api/` and has `/get-access` and `/waiting-approval` pages, so data access appears gated. Not usable. |
| Mobalytics, https://mobalytics.gg/riftbound/tier-list | Editorial tier list and guides. | HTTP 403 with a Cloudflare "Just a moment..." challenge on every try. Not usable by a script. |
| TCGplayer Infinite | `infinite.tcgplayer.com/riftbound` redirects (301) to `https://www.tcgplayer.com/content/riftbound/` (HTTP 200). | robots.txt: `Crawl-Delay: 10`, `Disallow: /content/*/deck/` and `/content/*/decks/player`. Deck pages are off limits. Articles only. |
| melee.gg | General tournament platform. | robots.txt: `Crawl-Delay: 5`, disallows `/Decklist/View/`, `/Tournament/Search/`. Official Riftbound events run on the UVS locator, not here. Whether any Riftbound event is on melee.gg is UNCONFIRMED; not pursued. |
| RiftCompare, https://riftcompare.com | Price comparison with an open JSON API (`/api/v1/…`, `llms.txt`). | Prices only, no meta. Relevant to a budget feature, not to this file. |

## 4. Coverage matrix

Y = present and machine-readable, P = partial, N = absent. "RAD n" is lists dated on or after 2026-10-23 as measured above.

| Field | riftbound.org | Piltover Archive | Official locator | playriftbound articles | riftbound.one |
|---|---|---|---|---|---|
| Placement | Y (rank of every entrant) | P (in deck name) | Y | Y (best per legend) | P (1st to 3rd) |
| W-L-D record | Y | N | Y | N | N |
| Event size | Y | P (old tournaments only) | Y | Y (sum of field table) | N |
| Exact date | Y | Y (deck timestamps, not event date) | Y | P (publish date) | N (month) |
| Format (1v1, 2v2) | P ("Constructed") | P (self-labelled) | Y (team flag, players per match) | N | N |
| Legend | Y | Y | UNCONFIRMED | Y | Y |
| Main deck 40 with quantities | P (39 without chosen champion on official exports) | Y | UNCONFIRMED | Y | Y |
| Chosen champion, 3 battlefields | P (missing on official exports) | Y | UNCONFIRMED | P (missing in some older lists) | P |
| 12 runes | Y (deck page) | Y | UNCONFIRMED | Y | P |
| Side deck | Y | Y | UNCONFIRMED | Y | Y |
| Legend win rate, share, top cut | Y | N | derivable | P (Day 1 to Day 2 conversion) | N |
| Card inclusion per legend | Y (ready-made) | derivable | derivable | derivable (small n) | derivable (small n) |
| Matchup matrix | Y (top 8 legends per event) | N | derivable if match endpoint is public | N | N |
| RAD n | 1,179 lists with cards, 19 events | 3,605 decks touched since 10-26 (community, unfiltered) | RC Europe: 315 entrants with deck ids | 0 | 27 |
| Lag | about 3 days | minutes | live | about 4 days, irregular | weeks |

## 5. What is and is not available for each goal

1. **Power target.** There is competitive data (whole fields with standings) and community data (Piltover Archive lists with views and likes). There is **no dataset of casual play**: nobody publishes kitchen-table lists with outcomes. "Casual" will be defined by rule and judgement (section 8).
2. **Per-legend inclusion and co-play.** Inclusion, average copies and side deck share per legend are ready-made on riftbound.org. Co-play (pairs) is not published anywhere; it has to be computed from stored lists, so it is limited to lists we fetched in full.
3. **Matchups.** Per-tournament legend tables on riftbound.org, top 8 legends of each event. Summed over the Radiance events this gives usable n only for the most played pairings (Riven against Kennen at RC Europe alone: 143 matches; median cell 8). There is no archetype-level or list-level matchup data, no play-first or draw-first split, and nothing for pre- versus post-sideboard games.
4. **Side deck and rune split.** Side deck share per card per legend: ready-made. Rune split: from full lists only (Piltover Archive lists, riftbound.org deck pages, official articles). Side deck plans against a named opponent ("what comes in against Riven"): not published anywhere as data.
5. **2v2 and FFA.** No results source. Core Rules define FFA3 "Skirmish" (CR 489), FFA4 "War" (CR 490) and 2v2 "Magma Chamber" (CR 491), and there is a 2v2 ban list (both per `legality-and-data.md` sections 3.3 and 3.4). The data on hand: a few dozen self-labelled Piltover Archive lists, one "Team Trios" event on riftbound.org (2026-08-22, 40 players, 39 lists), and 2v2 side events at Stuttgart that appear only in deck names. The locator can tell team events apart, so official 2v2 results may exist there (UNCONFIRMED). Plan for multiplayer advice to be rules-based with a clearly labelled, small community sample.

## 6. How earlier work treated this

- `Untitled/docs/META_INGESTION.md`: the older public project kept meta ingestion disabled by default because of the Riot policy quoted in section 2, used riftbound.one only, and named its signal `top_list_presence` because "The source is a curated set of top finishes, not a census of the field". That caution was right for a top-3 source. With whole-field data the same word would be wrong: label each statistic by what it measures (field share, top-cut share, win rate).
- Its evidence gates for a public card adjustment: at least 24 domain-eligible decks, effective sample size at least 20, inclusion in at least 8 decks, at least 3 events, at least 2 legends; pair evidence needed at least 8 joint decks, 3 events, 32 eligible decks. Adjustment caps were +0.15 per card and plus or minus 0.35 per pair. Freshness: source verified within 72 hours, observations within 30 days, only the latest three calendar months. Those numbers are that project's HEURISTICs, not rules; they are a sensible starting point.
- Its placement weights (`Untitled/netlify/lib/meta-ingestion-core.mjs`, `placementWeight`): rank 1 = 1.25, rank 2 = 1.15, ranks 3-4 = 1.05, ranks 5-8 = 0.95, other known rank = 0.85, unknown = 0.80.
- Its corpus rules: exclude any deck containing a card banned as of the rules snapshot, whatever the play date; exclude pre-release lists of a set until its legal date. Keep both.
- `Untitled/docs/SCORING_CALIBRATION_RDS_0_8_2.md` insists "This is a theorycraft model, not a tournament win-rate model" and keeps meta as a bounded overlay on a deterministic foundation. Riftbound Forge should keep the same separation: rules and card text decide what a card does; meta data only says what people play and how it fared.
- `docs/research/analysis/out/00-dataset.md` (today): 419 lists loaded, 406 valid (40 main with chosen champion, 12 runes, 3 battlefields), 254 from the Radiance era; 38 contain a currently banned card.

## 7. Proposed synced tables

SQLite, under git-ignored `data/`. Every row traces to a source row and a fetch time.

### 7.1 Raw layer

```sql
source(id TEXT PRIMARY KEY,            -- 'riftbound-org' | 'piltover-archive' | 'official-articles' | 'riftbound-one' | 'uvs-locator' | 'manual'
       base_url TEXT, robots_checked_at TEXT, enabled INTEGER);

sync_run(id INTEGER PRIMARY KEY, source_id TEXT, started_at TEXT, finished_at TEXT,
         status TEXT,                  -- ok | partial | failed | skipped
         requests INTEGER, http_errors INTEGER, rows_added INTEGER, note TEXT);

event(id TEXT PRIMARY KEY,             -- '{source}:{slug-or-id}'
      source_id TEXT, source_url TEXT, name TEXT, kind TEXT,   -- regional_qualifier | championship | showdown | cash_event | store_event | tournament | online
      start_date TEXT, date_precision TEXT,                    -- day | month
      country TEXT, players INTEGER, lists INTEGER,
      format TEXT,                     -- '1v1' | '2v2' | 'ffa3' | 'ffa4' | 'trios' | 'unknown'
      best_of INTEGER, swiss_rounds INTEGER, top_cut INTEGER,
      era TEXT,                        -- section 8.1
      canonical_event_id TEXT,         -- same real event seen in another source
      fetched_at TEXT);

event_field(event_id TEXT, legend_id TEXT, day INTEGER,       -- 0 = whole event, 1, 2
            players INTEGER, wins INTEGER, losses INTEGER, draws INTEGER, cut INTEGER,
            PRIMARY KEY(event_id, legend_id, day));

deck(id TEXT PRIMARY KEY,              -- '{source}:{source deck id}'
     source_id TEXT, source_url TEXT, event_id TEXT NULL,
     origin TEXT,                      -- tournament | community | precon | manual
     legend_id TEXT, chosen_champion_id TEXT NULL,
     rank INTEGER NULL, top_cut INTEGER NULL, wins INTEGER NULL, losses INTEGER NULL, draws INTEGER NULL,
     placement_text TEXT NULL,         -- '1ST', 'Best of Ivern', '#1' when no rank
     played_on TEXT NULL, edited_at TEXT NULL,
     views INTEGER NULL, likes INTEGER NULL,
     main_count INTEGER, rune_count INTEGER, battlefield_count INTEGER, side_count INTEGER,
     complete INTEGER,                 -- passes the validator for its format
     partial_reason TEXT NULL,         -- 'no-battlefields', 'no-champion', ...
     has_banned INTEGER, list_hash TEXT,                       -- hash of the sorted (zone, card, qty) rows, for de-duplication
     fetched_at TEXT);

deck_card(deck_id TEXT, zone TEXT,     -- legend | champion | main | rune | battlefield | side
          card_id TEXT,                -- official gallery gameplay id
          qty INTEGER, PRIMARY KEY(deck_id, zone, card_id));

match(id TEXT PRIMARY KEY, event_id TEXT, round TEXT, stage TEXT,   -- swiss | cut
      deck_a TEXT, deck_b TEXT, result TEXT,                        -- a | b | draw
      games_a INTEGER, games_b INTEGER);                            -- optional; only when deck pages or the locator give it

matchup_cell(event_id TEXT, legend_a TEXT, legend_b TEXT,
             wins INTEGER, losses INTEGER, draws INTEGER,
             PRIMARY KEY(event_id, legend_a, legend_b));            -- as published per event; a < b stored once

source_card_stat(source_id TEXT, era TEXT, legend_id TEXT NULL, card_id TEXT, zone TEXT,
                 decks INTEGER, eligible INTEGER, share REAL, copies REAL,
                 side_decks INTEGER, side_share REAL, win_rate REAL, fetched_at TEXT,
                 PRIMARY KEY(source_id, era, legend_id, card_id, zone));  -- ready-made numbers, kept apart from ours
```

No player column anywhere. `match` rows reference decks, not people. If a de-duplication key for "same player, same event" is ever needed, store a salted hash that never leaves the machine.

### 7.2 Derived layer (rebuilt after every sync; never edited by hand)

```sql
legend_stat(era TEXT, format TEXT, legend_id TEXT,
            lists INTEGER, n_eff REAL, events INTEGER,
            field_share REAL, cut_share REAL, conversion REAL,     -- cut_share / field_share
            wins INTEGER, losses INTEGER, draws INTEGER, win_rate REAL, win_rate_lo REAL, win_rate_hi REAL,
            firsts INTEGER, tier TEXT, computed_at TEXT,
            PRIMARY KEY(era, format, legend_id));

card_legend_stat(era TEXT, format TEXT, legend_id TEXT, card_id TEXT, zone TEXT,   -- main | side | battlefield | champion
                 scope TEXT,                 -- field | cut | community
                 decks INTEGER, n_eff REAL, incl REAL, incl_shrunk REAL,
                 copies_mean REAL, copies_mode INTEGER, events INTEGER,
                 PRIMARY KEY(era, format, legend_id, card_id, zone, scope));

card_pair_stat(era TEXT, format TEXT, legend_id TEXT, card_a TEXT, card_b TEXT,
               joint INTEGER, n_eff REAL, p_a REAL, p_b REAL, p_ab REAL, lift REAL, npmi REAL, events INTEGER,
               PRIMARY KEY(era, format, legend_id, card_a, card_b));

matchup(era TEXT, format TEXT, legend_a TEXT, legend_b TEXT,
        wins INTEGER, losses INTEGER, draws INTEGER, n INTEGER, events INTEGER,
        win_rate REAL, win_rate_shrunk REAL, lo REAL, hi REAL,
        PRIMARY KEY(era, format, legend_a, legend_b));

rune_split_stat(era TEXT, format TEXT, legend_id TEXT, split TEXT,   -- '7-5' with domains named: 'calm7-body5'
                decks INTEGER, share REAL, PRIMARY KEY(era, format, legend_id, split));

side_stat(era TEXT, format TEXT, legend_id TEXT, side_size INTEGER, decks INTEGER,
          PRIMARY KEY(era, format, legend_id, side_size));

power_anchor(era TEXT, format TEXT, legend_id TEXT NULL, level TEXT,  -- competitive | focused | casual
             metric TEXT, p10 REAL, p50 REAL, p90 REAL, n INTEGER,
             PRIMARY KEY(era, format, legend_id, level, metric));     -- section 8.4

meta_snapshot(id INTEGER PRIMARY KEY, computed_at TEXT, era TEXT,
              newest_event_date TEXT, lists INTEGER, events INTEGER, sources TEXT, stale INTEGER);
```

De-duplication: the same real list can arrive from riftbound.org, Piltover Archive (system import) and an official article. Match on `list_hash` first; then on (legend, event, rank). Keep the most complete copy as the counted one and link the others through `canonical_event_id` and a `duplicate_of` note. Without this, top lists are counted two or three times.

## 8. Weighting and definitions

Everything in this section is HEURISTIC unless marked. Each constant should live in one config file with a comment saying so.

### 8.1 Eras

- An era starts on the later of: the newest set's Constructed-legal date and the newest ban effective date. FACT (dates, per `legality-and-data.md` sections 2.1 and 3.1): Radiance legal 2026-10-23; last ban effective 2026-09-18. Current era: `RAD`, from 2026-10-23. Previous: `VEN-postban` (2026-09-18 to 2026-10-22), `VEN-preban` (2026-07-31 to 2026-09-17). riftbound.org cuts its windows the same way.
- A deck belongs to the era of its event date; a community deck to the era of its last edit.
- A deck with a card banned today is dropped from every statistic (kept in raw). A deck with a card not yet legal on its event date is dropped.

### 8.2 Recency

- Inside the current era: weight `r = 0.5 ^ (age_days / 21)`, age measured from the newest event in the data, not from today, so a quiet fortnight does not shrink everything. Half-life 21 days because a set's first three weeks move fastest; revisit when the era is two months old.
- Previous era: used only when the current era has `n_eff < 20` for that legend; then weight `0.25 * r` and only cards still legal. Label any number that used previous-era data in the UI ("includes pre-Radiance lists").
- Month-precision dates (riftbound.one) are taken as the 15th of the month.

### 8.3 Placement and event size

Two cases, because sources differ.

Whole-field sources (riftbound.org, locator), where rank and players are known:

```text
pct     = 1 - (rank - 1) / (players - 1)            # 1.0 = winner, 0.0 = last
p       = 0.25 + 0.75 * pct^2                       # last place still counts a little
size    = clamp(log2(players) / 8, 0.375, 1.25)     # 8 players = 0.375, 256 = 1.0, 1024+ = 1.25
w       = p * size * r
```

Top-list sources (riftbound.one, official best-per-legend lists, Piltover Archive names):

```text
p       = 1.25 / 1.15 / 1.05 / 0.95 / 0.85 / 0.80   # rank 1 / 2 / 3-4 / 5-8 / other known / unknown
          (the ladder already used in Untitled/netlify/lib/meta-ingestion-core.mjs)
size    = as above when players is known, else 0.75
w       = p * size * r
```

Then, for any statistic:

- `n_eff = (sum w)^2 / sum(w^2)`. Gate on `n_eff`, not on the raw count.
- Per-event cap: no single event may supply more than 40% of the total weight for a legend; scale that event's weights down if it does. Otherwise RC Europe (126 Riven lists) defines Riven on its own.
- Keep three scopes side by side instead of one blended number: `field` (every list, weight `size * r` only, no placement term), `cut` (top-cut lists or top 10% of the field, with placement), `community` (Piltover Archive non-event lists, weight `log10(views + 10) * r`). The difference between `cut` and `field` inclusion is itself a signal ("played more by the lists that did well").

Inclusion per legend:

```text
incl        = sum(w * [card in zone]) / sum(w)                 over lists of that legend in scope
incl_shrunk = (sum(w * [card in zone]) + k * prior) / (sum(w) + k),   k = 8
prior       = the same card's inclusion among all eligible legends sharing its domains (0 if none)
```

Show `incl` with n; use `incl_shrunk` for scoring. Below `n_eff = 8` for a legend, show nothing and fall back (section 9).

Co-play: for pairs within a legend, `npmi = ln(p_ab / (p_a * p_b)) / -ln(p_ab)`. Report a pair only with at least 8 joint lists, at least 2 events, and both cards under 90% inclusion (pairs of universal staples carry no information). With 186 Riven lists this is workable; for a legend with 15 lists it is not, and the interaction graph from card text has to carry it.

Matchups: sum cells across events in the era, ignore mirrors, count a draw as half. `win_rate_shrunk = (wins + 0.5 * draws + 10) / (n + 20)`. Show a number only when `n >= 30`, with n and a Wilson interval next to it; between 10 and 29 show a direction word only ("slightly favoured, 17 matches"); below 10 show "no data" and the computed estimate from `matchups-and-lines.md` section 4.3, visibly marked as an estimate.

Rune split and side deck: plain weighted shares per legend, `field` scope; report the mode and the spread. No shrinkage needed.

### 8.4 Casual, focused, competitive

What the data can anchor (DATA once computed; today's counts are in section 3):

- **Competitive**: lists in `cut` scope at events with at least 64 players in the current era. Measured anchors per legend and overall: inclusion profile, curve, interaction counts (from `deck-theory.md` features), side deck use (10 of 10 cards in 342 of 361 tournament-named lists).
- **Focused**: lists in `field` scope that are not in `cut` (the middle and bottom of real tournaments), plus store-level and small online events (under 64 players), plus Piltover Archive lists with a tournament-looking name but no verifiable result. These are decks built to win by people who did not top-cut.
- **Casual**: no outcome data exists. The only observable proxies are Piltover Archive community lists that are not tied to an event, and the preconstructed products (Champion Decks, Proving Grounds), which show what the publisher considers an entry-level deck. Neither is a measurement of casual play.

Stated plainly, the heuristic parts are:

1. The cut-offs themselves: 64 players, top cut or top 10%, "tournament-looking name". They are conventions.
2. The idea that power is one axis. A fifth-place list of a weak legend and a hundredth-place Riven list are not ordered by this scheme; legend strength has to be a separate, visible input (`legend_stat.tier` from field share, win-rate interval and conversion).
3. Treating "what top lists contain" as "what is strong". Inclusion measures popularity among finishers. The only outcome-linked card signal is riftbound.org's per-card win rate, which is confounded by which lists run the card. Use it as a tiebreak at most, never as a card's power.
4. Everything about casual. The definition below is a product decision, not a finding.
5. Mapping a finished deck to a level (the 0-100 "how competitive is this list" figure): a weighted distance to the competitive anchor is a similarity measure, not a prediction of results.

Proposed use in the builder:

| Level | Card pool pressure | Meta weight in card score | Side deck | Rune split |
|---|---|---|---|---|
| Competitive | Prefer cards with `cut` inclusion; flag any main-deck card under 5% `cut` inclusion for that legend as "off-meta" (a note, not a block) | Up to 30% of the card score, from `incl_shrunk` in `cut` scope | 10 cards, chosen against the current field shares (top legends by `field_share`) using side deck shares for this legend | Mode of `cut` lists for the legend |
| Focused | `field` scope; off-meta cards welcome when the interaction graph supports them | Up to 15%, from `field` scope | 10 cards, broader answers | Mode of `field` lists, adjusted by the deck's actual domain costs |
| Casual | No meta pressure. Optional soft limits the owner can toggle: avoid the most played tournament packages, cap copies of cards over 60% `cut` inclusion, prefer theme and tag synergy | 0% (meta shown as information only) | Optional; rules-based | Computed from the deck's own costs (`deck-theory.md`) |

A list's level read-out: `competitive_score = 100 * weighted overlap with the legend's cut profile`, shown together with the legend's tier and with n. If the legend has `n_eff < 8` in `cut` scope the read-out says "not enough tournament data for this legend" instead of a number.

2v2 and FFA: there are no anchors. All three levels are rules-based there; the community sample is shown as examples, with its n, and never drives scores.

## 9. Fallbacks when a source is unreachable

1. **Never block the app on the network.** The builder, validator and rules-based scoring work with zero meta rows. Meta is an overlay.
2. **Per-source health.** Each sync run records status per source. One failed source does not fail the run. Three consecutive failures disable that source until the owner re-enables it (protects against hammering a site that changed or started blocking).
3. **Last good snapshot.** Derived tables are rebuilt only from a complete run of at least one whole-field source. If the newest run is partial, keep the previous `meta_snapshot` and show its date.
4. **Staleness is shown, not hidden.** `stale = 1` when the newest event in the snapshot is more than 21 days old, or when a set release or ban date has passed since it was computed. In the second case the UI says "data predates <set or ban>" on every meta number. Never extrapolate or reuse an old-era number as current.
5. **Order of substitution for each need:**

| Need | First | Then | Then | Last resort |
|---|---|---|---|---|
| Legend field share, win rate | riftbound.org `/meta` | sum of official article field tables (previous era, labelled) | RiftAtlas event metagame tables (if mapped) | none shown; legend tier "unknown" |
| Card inclusion per legend | computed from our stored lists | riftbound.org `/meta/cards?legend=` (`source_card_stat`) | domain-pair aggregate over all stored lists | rules-based only |
| Full lists with battlefields | Piltover Archive | official articles | riftbound.one | bundled seed |
| Matchups | riftbound.org tournament cells | locator matches (if confirmed public) | user-imported CSV (`matchups-and-lines.md` 4.1 recommendation) | computed estimate, marked |
| Rune split, side deck | stored full lists | riftbound.org deck pages for top-cut lists | none | computed from costs |

6. **Bundled seed.** Ship nothing scraped in the repo. On first run with no network, the app has no meta and says so. (The 459 official-article lists and the 59-deck GameLab sample can be imported locally by a one-off command; they are pre-Radiance and get the previous-era label.)
7. **Shape changes.** Every parser validates what it extracted (counts per zone, known card ids, share within 0 to 1, totals that add up) and rejects the page otherwise. A rejected page is a failure for that source, not a row of bad data. Keep one saved fixture per page type under the test folder for parser tests (fixtures stay local, see `.gitignore`).

## 10. What stayed unconfirmed

- Whether the official locator's API endpoints for matches, standings and public decks answer without a login, and their shapes. Not requested (robots.txt disallows AI agents on that host). One manual check by the owner settles it.
- riftbound.org's terms text (rendered client-side), the query parameter for older windows, whether it sends cache validators, and how it computes `win_rate`, `edge` and mirror cells. Its numbers are a community computation; none was cross-checked against the locator.
- riftbound.gg's data endpoints and volumes (the "12,221 lists of 210 tournaments" figure is TCG Panel's statement about it), riftdecks.com's matrix values, riftmana and riftboundop content: none fetched.
- TopDeck.gg API terms and fields for Riftbound; whether "Dual Queue" there is a 2v2 event with decklists.
- Whether any 2v2 or FFA event publishes results with decklists anywhere.
- Whether an official "Top Decks" article will be published for RC Europe or other Radiance events.
- How `GameLab/data/decks/samples/piltover-archive-2026-09-06.json` was produced (no script found; inferred to be hand-saved from an agent session).
- Whether the main-deck count of 39 in official exports always means "chosen champion omitted" (true for the one RC Europe list examined and consistent with the official articles' "Main Deck: 39 + Champion: 1" layout).

## 11. Files

Under `docs/research/analysis/`:

- `pa-lib.mjs`, `crawl-list.mjs`, `fetch-decks.mjs`, `select-tournament.mjs`: Piltover Archive helpers and crawlers (written earlier today for `deck-theory.md`).
- `meta-sources/official-parse.mjs`: playriftbound "Top Decks" article parser → `raw/official-events.json`.
- `meta-sources/r1.mjs`, `r1-parse.mjs`: riftbound.one extractors.
- `meta-sources/uvs.mjs`, `uvs2.mjs`: official locator page readers (names redacted on output).
- `meta-sources/inertia.py`: prints the trimmed props of a riftbound.org page.
- `meta-sources/crawl-pa-tournaments.sh`, `fl.mjs`, `shape.mjs`, `sm.mjs`: Piltover Archive tournament titles, flight-payload grep, shapes, sitemap check.
- `meta-sources/raw/`: every page fetched for this file, with response headers in `*.hdr` (git-ignored).
