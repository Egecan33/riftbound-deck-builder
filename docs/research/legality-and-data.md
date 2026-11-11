# Legality, ban list and card-data sources (fact-checked 2026-11-11)

Every web source below was fetched live on 2026-11-11 with a generic `User-Agent`, serially, with about one second between requests. Nothing here comes from memory. An independent second pass re-fetched every source and re-ran every measurement on 2026-11-11; its corrections are applied in place and listed in the Verification log at the end. Labels used throughout:

- **FACT**: stated by a primary source (playriftbound.com, official PDFs, developer.riotgames.com).
- **DATA**: measured from a dataset; the dataset and n are named.
- **HEURISTIC**: our own judgement.
- **UNCONFIRMED**: not confirmed from a primary source.

Local paths are abbreviated: `GameLab/` = `~/github_repositories/GameLab/`, `Untitled/` = `~/github_repositories/Untitled/`.

## 1. Headline findings

- **The local ban snapshot is stale.** `Untitled/config/current-constructed-rules.json` (reviewed 2026-08-10) has 10 entries. All 10 are confirmed, but it is missing **Ekko, Recurrent** and **Stacked Deck** (banned effective 2026-09-18) and it has no 2v2 list at all (**Master Yi, Wuju Bladesman** legend, banned in 2v2 since 2026-07-24).
- **A fifth booster set is out: Radiance (RAD), released 2026-10-23**, 167 numbered cards, 219 printings in the gallery. The local card file (931 cards, built 2026-09-06) has none of it.
- **New rules editions**: Core Rules and Tournament Rules both "Last Updated October 9, 2026" (local copy is the 2026-07-16 edition). Core Rules deck-construction numbering shifted (Main Deck is now 103.3, was 103.2 in the local edition), so rule numbers must be read from the current PDF.
- **The gallery's item shape changed.** Champion units now carry `name: "Ekko"` plus `subtitle: "Recurrent"`; in September the same card was `name: "Ekko, Recurrent"`. GameLab's `canonicalize.ts` groups printings by `name`, so run unmodified it would merge every unit of the same champion into one card. This is the single biggest trap in reusing the pipeline.
- **There is a plain JSON endpoint behind the gallery**: `https://content.publishing.riotgames.com/publishing-content/v2.0/public/channel/riftbound_website/list/riftbound_gallery_cards?locale=en_US&from=0&limit=2000` returned all 1,408 printings in one request, no key. It returns the same 1,408 printings as the HTML `__NEXT_DATA__` blob (both have 1,408 unique ids on re-check) without the 3.99 MB page download.
- **Riftcodex has no Radiance cards** (total 1,451, identical to the September snapshot; `set_id=RAD` returns 0). It is still useful only for promo printings, TCGplayer ids and flavour text.
- **An official Riot API exists** (`riftbound-content-v1`) but needs an approved API key; unauthenticated calls return 401.
- **Rotation**: none yet. The Rules Hub says rotation is intended "Starting in 2028".

## 2. Sets and set legality

### 2.1 What is legal now

- FACT: "All sets currently produced for Riftbound are legal to be played in sanctioned tournaments at your local game store as well as at larger tournaments." Rules Hub, section "Constructed Format Legality", "Last updated: September 18, 2026". https://playriftbound.com/en-us/rules-hub/
- FACT: Tournament Rules (Last Updated October 9, 2026) rule 601.3.c lists the current Standard: OGS (601.3.c.1), OGN (601.3.c.2), SFD (601.3.c.3), UNL (601.3.c.4), VEN (601.3.c.5), RAD (601.3.c.6, "Release Date: October 23rd, 2026", 601.3.c.6.a). PDF: https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/861752822d217edf37d9febaeaf77a7d924c1bb6.pdf (sha256 `ce07da4f...3d07`).
- FACT: TR 601.2.a: "A card may only be included in a deck if it is from a set that is legal in that format or it has the same name as a card from a set that is legal in that format."
- FACT: TR 601.2.b: "Until set release parity is reached, regional limitations on the legality of cards will be enforced according to the official product launch date in the region where an event is being held." So a set's Constructed-legal date is its regional launch date. For English that equals the release date.
- FACT: TR 601.2.c: a reprint whose collector number is outside the set's normal numbering "does not affect the card's format legality" (example 601.2.c.1: "300/250 is not automatically legal").

| Code | Name | Numbered cards (gallery `collectorNumberMax`) | English release = Constructed-legal date | Source for the date |
|---|---|---|---|---|
| OGN | Origins | 298 | 2025-10-31 | FACT (indirect wording): "ensuring players can get their hands on cards on October 31", https://playriftbound.com/en-us/news/announcements/how-to-buy-riftbound-worlds-bundle-2025-and-origins-restock-news/ (2025-10-07). Riftcodex `/sets` `published_on` agrees |
| OGS | Proving Grounds | 24 | 2025-10-31 | UNCONFIRMED: no primary page found that dates the Proving Grounds product; only Riftcodex `/sets` `published_on` 2025-10-31. TR 601.3.c.1 calls it "The Origins supplemental set contained in Proving Grounds" |
| SFD | Spiritforged | 221 | 2026-02-13 | FACT (indirect): "Happy Spiritforged Launch Day, players!" in an article published 2026-02-13, https://playriftbound.com/en-us/news/announcements/spiritforged-precons-fiora-rumble/. An earlier article says only "February 2026 in English" |
| UNL | Unleashed | 219 | 2026-05-08 | FACT: "the English version will release on 5/8", https://playriftbound.com/en-us/news/announcements/the-unleashed-overview/ (2026-03-16) |
| VEN | Vendetta | 166 | 2026-07-31 | FACT: "Release : July 31 for English and Chinese; Oct. 23 for French", https://playriftbound.com/en-us/news/announcements/the-vendetta-overview/ (2026-07-07) |
| RAD | Radiance | 167 | 2026-10-23 | FACT: TR 601.3.c.6.a; also "Pre-Rift : October 16-22, 2026 / Release : October 23, 2026", https://playriftbound.com/en-us/news/announcements/products-and-sets-into-2027/ (2026-08-03) |

- DATA: `collectorNumberMax` values come from the live gallery sets list (`.../list/riftbound_gallery_sets`, 6 items).
- The one UNCONFIRMED date (OGS) does not affect legality today, since every released set is legal. It only matters for a "legal as of date X" view. Store it with `"confirmed": false`. The OGN and SFD dates rest on indirect wording in primary articles (see the table), not on a dated release line.
- Promo set codes on Riftcodex (OPP 133, PR 13, JDG 3 printings) are not sets for legality purposes; under TR 601.2.a they are legal by name.

### 2.2 Rotation policy

- FACT: "Starting in 2028, we intend to introduce rotation of legal sets for play in Standard Constructed (our primary constructed format.)" Rules Hub, same section.
- FACT: TR 601.3.a: "Standard is a format consisting of the most recent 5-8 sets." TR 601.3.b: "Each Standard consists of the current year's sets plus the previous year's sets."
- HEURISTIC: read together, the first rotation would drop the 2025 sets (OGN, OGS) at the start of 2028. Riot has not said so in those words; do not encode it.

### 2.3 Announced future sets

Source for all rows: https://playriftbound.com/en-us/news/announcements/products-and-sets-into-2027/ (2026-08-03), cross-checked with the roadmap https://playriftbound.com/en-us/news/announcements/august-2026-roadmap/ ("Last Updated: October 26, 2026").

| Code | Name | Cards | Pre-Rift | Release |
|---|---|---|---|---|
| LGC | Legacy (Set 6) | 239 (93 Showcase) | 2027-01-22 to 01-28 | 2027-01-29 |
| PG2 | Proving Grounds, 2nd Edition | "will not contain any cards which you cannot get out of booster packs" | n/a | 2027-02-19 |
| REC | The Reckoning (Set 7) | 264 (67 Showcase) | 2027-04-23 to 04-29 | 2027-04-30 |
| ? | Set 8 | not given | not given | "Arriving Q3 2027" |

- The roadmap page lists the Reckoning Pre-Rift and launch under its June heading, while the products article says April 23-29 and April 30 and the Reckoning Regionals start 2027-05-14. Treat April 30 as the date; the June placement looks like a layout slip (HEURISTIC).
- FACT (same products article): starting with Legacy, card templating changes. Token creation uses "Create" instead of "Play"; "When you play me" becomes "When I enter"; a grey backer marks targets; an arrow separates trigger condition from effect. Expect rules text across the pool to be re-issued as errata, so the sync must always re-pull text and never cache it by card id forever.

## 3. Ban list as of 2026-11-11

### 3.1 Announcements (primary sources)

| # | Title | Published | Effective | URL |
|---|---|---|---|---|
| A | Announcing Riftbound's First Bans | 2026-03-30 | 2026-03-31 | https://playriftbound.com/en-us/news/announcements/announcing-riftbounds-first-bans/ |
| B | July Ban List Updates | 2026-07-17 | 2026-07-24 | https://playriftbound.com/en-us/news/announcements/july-ban-list-updates/ |
| C | September Ban List Updates (Effective September 18, 2026) | 2026-09-15 | 2026-09-18 | https://playriftbound.com/en-us/news/announcements/september-ban-list-updates-effective-september-18-2026/ |

The consolidated list lives on the Rules Hub ("The complete ban lists can always be found on the Riftbound Rules Hub", article B). TR 601.2.d.1 also points there (its "here" link targets the old domain, https://riftbound.leagueoflegends.com/en-us/rules-hub/). No ban announcement newer than C exists in the news index as of 2026-11-11 (the news index lists 135 items back to 2025-06-06, all scanned; newest item 2026-11-06).

### 3.2 Standard (1v1 Constructed)

Card codes and ids are DATA: resolved by name against the live gallery (n = 1,408 printings).

| Card | Zone | gameplayId | cardCode | Effective | Source |
|---|---|---|---|---|---|
| Called Shot | main | `sfd-122-221` | SFD-122 | 2026-03-31 | A |
| Draven, Vanquisher | main | `sfd-020-221` | SFD-020 | 2026-03-31 | A |
| Fight or Flight | main | `ogn-168-298` | OGN-168 | 2026-03-31 | A |
| Scrapheap | main | `ogn-182-298` | OGN-182 | 2026-03-31 | A |
| Stealthy Pursuer | main | `ogn-177-298` | OGN-177 | 2026-07-24 | B |
| **Ekko, Recurrent** | main | `ogn-110-298` | OGN-110 | 2026-09-18 | C |
| **Stacked Deck** | main | `ogn-183-298` | OGN-183 | 2026-09-18 | C |
| Dreaming Tree (gallery name "The Dreaming Tree") | battlefield | `ogn-292-298` | OGN-292 | 2026-03-31 | A |
| Obelisk of Power | battlefield | `ogn-284-298` | OGN-284 | 2026-03-31 | A |
| Reaver's Row | battlefield | `ogn-285-298` | OGN-285 | 2026-03-31 | A |
| The Arena's Greatest | battlefield | `ogn-290-298` | OGN-290 | 2026-07-24 | B |
| Aspirant's Climb | battlefield | `ogn-276-298` | OGN-276 | 2026-07-24 | B |

- FACT: this is exactly the Rules Hub list ("Cards: Called Shot, Ekko, Recurrent, Draven, Vanquisher, Fight or Flight, Scrapheap, Stealthy Pursuer, Stacked Deck. Battlefields: The Arena's Greatest, Aspirant's Climb, Dreaming Tree, Obelisk of Power, Reaver's Row").
- A ban applies to the card name, so every printing (alt art, signature, promo) of a banned card is banned. HEURISTIC, following TR 601.2.a's name-based legality and Core Rules name identity; the ban articles list names only.
- Draven, Vanquisher has an alt-art printing `SFD-020a`; it collapses to the same gameplay card.

### 3.3 2v2 Constructed

- FACT (article B): "we are introducing a 2v2 ban list. It is comprised of the entirety Standard ban list plus the following. Any future ban updates will explicitly note if they apply to both formats. Legend: Master Yi, Wuju Bladesman".
- FACT (article C): the two September cards are "added to the Standard and 2v2 Constructed ban list".
- FACT: the Rules Hub "2v2 Constructed Legality" block (Last updated September 18, 2026) lists Legends: Master Yi, Wuju Bladesman, then the same 7 cards and 5 battlefields.
- DATA: the legend resolves to gallery id `ogs-019-024`, code OGS-019, gallery `name: "Wuju Bladesman"`, `subtitle: "Starter"`, tag `Master Yi`. It is the only printing with that legend name in the gallery.

So 2v2 = Standard list + one legend-zone entry (`ogs-019-024`, effective 2026-07-24, source B).

### 3.4 Other formats and exceptions

- **Free-for-all**: Core Rules (Last Updated 2026-10-09) define FFA3 "Skirmish" (rule 489) and FFA4 "War" (rule 490) as game modes, and 2v2 "Magma Chamber" (rule 491). No FFA ban list is published on the Rules Hub or in any of the three ban articles. UNCONFIRMED whether FFA events use the Standard list; default the app to the Standard list for FFA and say so in the UI (HEURISTIC).
- **Restricted lists**: none. FACT (article A): on restricting or limiting cards, "We do not have any plans to pursue these in the foreseeable future."
- **Limited**: FACT, TR 602.1.b: "Even if a card is banned in constructed, it is legal to use in a limited deck as long as it is not also banned in that limited format."
- **Preconstructed exception**: FACT, TR 601.2.d.2: at low OPL, a player using the exact configuration of a preconstructed deck product may play its banned cards (example 601.2.d.2.a names the Jinx Champion Deck with Fight or Flight, Scrapheap and Reaver's Row). Not worth modelling in v1; mention it in a tooltip.
- **Event addenda**: FACT, TR 601.1.d: "In some competitions, the legal battlefields are different from the format-legal battlefields."
- **Ban philosophy / cadence**: no fixed schedule is published. Article A lists three questions (overrepresentation, getting worse over time, unhealthy play patterns). The August State of the Game says "We will continue to ban cards which we see as active problems" (https://playriftbound.com/en-us/news/announcements/august-2026-state-of-the-game/, 2026-08-03). The local config's `observationWindowMonths: 3` is the old project's own heuristic, not an official window.

### 3.5 Verification of `Untitled/config/current-constructed-rules.json`

| Local entry | Verdict |
|---|---|
| 5 main-zone ids (`sfd-122-221`, `sfd-020-221`, `ogn-168-298`, `ogn-182-298`, `ogn-177-298`) with their dates and source ids | Confirmed against A, B and the Hub |
| 5 battlefield ids (`ogn-292-298`, `ogn-284-298`, `ogn-285-298`, `ogn-290-298`, `ogn-276-298`) | Confirmed |
| `setLegalFrom.VEN = 2026-07-31` | Confirmed (Vendetta Overview) |
| Both source URLs | Live, HTTP 200 |
| Missing | `ogn-110-298` and `ogn-183-298` (source C); the whole 2v2 list; RAD in set legality; source C itself |
| `policyVersion`, `rulesSnapshotDate` | Stale (2026-07-24 / 2026-08-10) |

### 3.6 Upcoming or pending changes

- No pending ban is announced. (Article B shows Riot does sometimes pre-announce: it had "shared our intent to ban" Stealthy Pursuer during Vendetta previews.)
- "Testing Start of Game Rules" (2026-10-15, https://playriftbound.com/en-us/news/organizedplay/testing-start-of-game-rules/): three candidate changes to go-first/go-second balance are being playtested at select events. FACT: "Is this a rules update? ... No." Not a deck-building change, nothing to encode.
- Legacy (2027-01-29) will add a set and re-template text (section 2.3).

## 4. Other current rules that the legality file must carry

Not the focus of this file, but the sync file needs these numbers and they changed edition.

- FACT: TR 402.1: "In a constructed event, players must use a Main Deck of exactly 40 cards (including a chosen champion), 1 Legend, 12 runes, and exactly 3 battlefields each with a unique name." TR 601.1.b repeats "exactly 40". Core Rules 103.3 says "A Main Deck of at least 40 cards". The tournament number is the one a deck builder should enforce for Constructed, with the Core Rules minimum as the casual mode.
- FACT: TR 601.1.c.1: a sideboard "can include 10 or fewer cards"; 601.1.c.2: only valid Main Deck cards; 601.1.c.3: copy limits apply to main deck plus sideboard combined; 601.1.c.4 and 403.4.a: the Chosen Champion may be swapped during sideboarding. DATA: the first deck in the local Piltover Archive sample (created 2026-06-21) decodes to 40 main + 8 sideboard, which fits under this limit. The number was verified programmatically against the PDF text (ten), because it is easy to assume eight from older decklists: 55 of the 59 sample decks carry exactly 8 sideboard cards (3 carry 10, 1 carries 7). The 2026-07-16 edition of the Tournament Rules already said "10 or fewer" (601.1.c.1); whether any edition before that said 8 is UNCONFIRMED.
- FACT: Core Rules 103.3.b: "up to 3 copies of the same named card"; 103.3.d: "3 total Signature cards"; 103.4.a: "12 Rune Cards".
- Core Rules PDF (Last Updated 2026-10-09): https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/5c7946f7c3b8c6e0faff85ab6dadc6d2e721ea94.pdf (sha256 `94d41fee...1fec`, 8,508 text lines). `GameLab/data/rules/meta.json` still points at the 2026-07-16 PDFs (`e9ac8e3d...` and `503da656...`). GameLab's `pnpm rules:check` exists for exactly this drift (`GameLab/packages/cards/scripts/rules-check.ts`).
- Changelogs: https://playriftbound.com/en-us/news/announcements/october-2026-tournament-rules-changelog/ (effective with the Radiance Pre-Rift, 2026-10-16) and https://playriftbound.com/en-us/news/announcements/core-rules-radiance-patch-notes-effective-october-16-2026/.
- Errata: https://playriftbound.com/en-us/news/announcements/radiance-errata-updates/ (2026-10-09).

## 5. Card data sources

### 5.1 Official gallery JSON endpoint (recommended primary)

- URL: `https://content.publishing.riotgames.com/publishing-content/v2.0/public/channel/riftbound_website/list/riftbound_gallery_cards?locale=en_US&from=0&limit=200`
- Found in the gallery page's own `cards.async.linkdata`. No key, no cookie. `Cache-Control: no-cache, private`. No rate-limit headers observed over 9 serial requests.
- Response shape (live): `{ data: [card...], metadata: { totalItems, totalPages, from, limit, locale, resultsUpdatedAt }, linkdata: { first, last, next, self } }`.
- DATA: paging with `limit=200` returned 8 pages, 1,408 items, 1,408 unique ids. `limit=2000` returned all 1,408 in one response. `metadata.totalItems` says 1,416, which does not match the rows returned (pages are short by one or two); count the rows, do not trust `totalItems`.
- Sets list: same path with `riftbound_gallery_sets` returns `[{id, name, collectorNumberMax}]` for the 6 sets.
- Card fields (count of items carrying each, n = 1,408): `id`, `collectorNumber`, `name`, `set{value{id,label}}`, `cardType{type[], superType[]}`, `publicCode`, `rarity`, `domain{values[]}`, `cardImage{url, accessibilityText, dimensions{width,height}, colors}`, `orientation`, `illustrator` (all 1,408); `text.richText.body` 1,375; `energy` 1,144; `tags.tags` 936; `might` 787; `power` 576; `subtitle` 369; `mightBonus` 43; `effect` 35.
- Value sets (DATA): sets OGN 352, UNL 288, SFD 288, VEN 237, RAD 219, OGS 24. Rarity: common 331, uncommon 305, rare 302, showcase 290, epic 180. Domains: fury, calm, mind, body, chaos, order, colorless. Super types (ids are lower-case in the data): champion 353, signature 60, basic 30, token 14. Types: unit 742, spell 265, legend 145, gear 134, battlefield 77, rune 30, empty 15.
- `publicCode` examples: `OGN-110/298`, `SFD-020a/221` (alt art), `OGN-304*/298` (signature), `RAD-172/167` (overnumbered), `RAD-SP1/005` (special), `RAD-R01` and `RAD-R01a` (runes), `UNL-T04` (token).

Things that changed since the September snapshot (DATA: live vs `GameLab/data/raw/gallery-latest.json`, fetched 2026-09-06, n = 1,189):

- 219 printings added, all RAD; none removed. (An earlier draft said `sfd-119-221` was missing from the HTML blob; on re-check it is present in both the HTML blob and the JSON endpoint.)
- `subtitle` is new (369 items carry it). 299 items changed `name`; 292 of them are exactly `old name == name + ", " + subtitle`, the other 7 are the 4 starter legends, the 2 Master Yi units and `Recruit (NX)` below.
  - Champion units (349 items, i.e. every unit with super type champion): the card's printed name is `name, subtitle`, e.g. `Ekko` + `Recurrent`. The ban articles use this form.
  - Signature cards (16 items: 15 spells plus one unit, `Tibbers` + `Annie`, OGS-018): `subtitle` is the champion (`Bullet Time` + `Miss Fortune`); the old name was just `Bullet Time`. Do not append it to the name.
  - Starter legends (4 items): `subtitle` is `Starter`; the old name was `Wuju Bladesman - Starter`.
  - Real renames: `Yi, Meditative` and `Yi, Honed` are now `Master Yi` + subtitle; `Recruit (NX)` is now `Recruit`.
- `energy`, `might`, `power` gained a top-level `label`; `might` and `power` also gained `value.icon` (`energy` has no icon). The value is still at `.value.id`. GameLab's zod schema is a loose object, so this parses.
- 15 items have an empty `cardType.type` array (13 RAD, 2 UNL). For the 13 RAD items the type is still recoverable from `cardImage.accessibilityText` ("Riftbound Unit: Antagonistic Apparatus. ..."), which `canonicalize.ts` `cardTypesOf` already does. The 2 UNL items are not recoverable that way (`UNL-T04` Buff reads "Riftbound : Buff.", `UNL-T08` XP Tracker reads "Riftbound None: XP Tracker."); `canonicalize.ts` would drop them as "no card type", so give them an explicit type in data.
- `effect` (35 items, 33 of them gear) holds the equip/attached effect text separately from `text`. It is not new: 32 items in the September snapshot already had it.
- 17 printings changed rules text (errata), 6 changed image URL.

### 5.2 Official gallery HTML (what the local repos used)

- URL: https://playriftbound.com/en-us/card-gallery/ (3.99 MB HTML). Cards are in `<script id="__NEXT_DATA__">` at `props.pageProps.page.blades[type=riftboundCardGallery].cards.items`.
- DATA: 1,408 items and 1,408 unique ids today, the same id set as the JSON endpoint (re-checked on a fresh fetch and on the HTML saved at `analysis/raw/gallery-2026-11-11.html`; the duplicate `sfd-054-221` / missing `sfd-119-221` reported in an earlier draft is not reproducible). Prefer 5.1 anyway: it is the gallery's own data feed and needs no HTML parsing.

### 5.3 Riot API `riftbound-content-v1` (official, key required)

- FACT: `GET /riftbound/content/v1/contents` on `americas|asia|europe.api.riotgames.com`, optional `locale` ("During beta only en available"). Returns `RiftboundContentDTO { game, version, lastUpdated, sets: [SetDTO { id, name, cards: [CardDTO] }] }`; `CardDTO { id, collectorNumber, set, name, description, type, rarity, faction, stats { energy, might, cost, power }, art { thumbnailURL, fullURL, artist }, flavorText, tags, subtitle, effect }`. Source: https://developer.riotgames.com/apis#riftbound-content-v1
- DATA: live call without a key returned HTTP 401 `"Cannot process request apikey or authorization header is empty"`. Response body shape with a key is UNCONFIRMED.
- FACT: Riot's policy lists "Apps with a small, personal audience" among use cases that will not be approved for a key (https://developer.riotgames.com/policies/riftbound). So this source is not available to a personal tool in practice.

### 5.4 Riftcodex (community)

- Base URL `https://api.riftcodex.com`; OpenAPI at `/openapi.json` (title "Riftcodex", version 0.2.0); Swagger UI at `/docs`.
- Endpoints (from the OpenAPI document): `GET /cards` (`sort`, `dir`, `set_id`, `new`, `page`, `size` default 50, max 100), `/cards/search?query=`, `/cards/name?exact=|fuzzy=`, `/cards/{id}`, `/cards/riftbound/{id}`, `/cards/tcgplayer/{tcgplayer_id}`, `/sets`, `/sets/set-id/{set_id}`, `/sets/tcgplayer/{id}`, `/sets/cardmarket/{id}`, `/sets/{id}`, `/index/{keywords|card-names|card-types|card-supertypes|domains|rarities|artists|energy|might|power|tags}`, `/health`, `/metrics`.
- Live response shape, `GET /cards?page=1&size=100`: `{ items: [...], total: 1451, page: 1, size: 100, pages: 15 }`. `size=500` returns HTTP 422 ("Input should be less than or equal to 100").
- Item fields: `id`, `name`, `riftbound_id` (e.g. `unl-229*-219`), `tcgplayer_id`, `collector_number`, `attributes{energy,might,power}`, `classification{type,supertype,rarity,domain[]}`, `text{rich,plain,flavour}`, `set{set_id,label}`, `media{image_url,artist,accessibility_text}`, `tags[]`, `orientation`, `metadata{clean_name,updated_on,alternate_art,overnumbered,signature}`, `new`.
- `GET /sets`: 8 sets with `set_id`, `name`, `card_count`, `tcgplayer_id`, `cardmarket_id[]`, `published_on`. OPP 133, PR 13, VEN 358, SFD 288, UNL 280, JDG 3, OGS 24, OGN 352.
- **Completeness**: DATA: total 1,451 today, the same as the local snapshot of 2026-09-06. `GET /cards?set_id=RAD` returns `total: 0`. Its changelog's latest entry is "v0.2.1 Jul 10, 2026 ... Support for Vendetta cards added" (https://riftcodex.com/changelog).
- **Rate limit**: "Up to 100 requests per minute per IP. Exceeding this returns 429 Too Many Requests with a Retry-After header." No API key. (https://riftcodex.com/faq)
- **Terms**: no terms-of-use page found. The FAQ says "Riftcodex is an unofficial fan project. We operate under Riot's fan content policy." Contact support@riftcodex.com.
- Text uses its own icon tokens (`:rb_exhaust:`, `:rb_energy_1:`, `:rb_rune_fury:`), different from the gallery's. Image URLs point at the same Riot CDN as the gallery.
- Naming style differs ("Vi - Piltover Enforcer (Signature)"), so never join on name; join on `riftbound_id` after normalising `*` to `s` (`GameLab/packages/cards/src/scrape/riftcodex.ts`, `riftcodexKey`).

### 5.5 Piltover Archive (community; the owner allows scraping it for this local tool)

- `robots.txt` (live): `Allow: /`, `Allow: /decks?page=`, `Allow: /cards?page=`; `Disallow: /admin/`, `/api/`, `/decks?`, `/cards?` and paged URLs with extra parameters. So plain paging is allowed, filtered listings and `/api/` are not. Sitemap at `/sitemap.xml`.
- Pages are Next.js App Router HTML. There is no `__NEXT_DATA__`; data is in `self.__next_f.push([1,"..."])` flight chunks that must be concatenated and unescaped.
- Deck page `https://piltoverarchive.com/decks/view/{uuid}` (live, 529 KB): the deck object has `id`, `authorName`, `name`, `status`, `views`, `likes`, `editedAt`, `createdAt`, `updatedAt`, and sections `legend`, `champions[]`, `battlefields[]`, `runes[]`, `maindeck[]` and `sideboard[]`. Each list entry is `{ deckId, cardId, variantId, quantity, card{...} }`; `legend` is a single variant object (`variantNumber`, `imageUrl`, `rarity`, ...) with a nested `card{...}`.
- Card object inside a deck: `id`, `name` (full form, e.g. "Master Yi, Wuju Bladesman"), `types[]`, `type`, `super`, `description`, `energy`, `might`, `power`, `tags[]`, **`maxCopies`**, **`banEffectiveDate`**, `cardVariants[{ variantNumber: "OGS-019", imageUrl, rarity, tcgplayerId, artist, variantType }]`, `cardColors[]`.
- DATA: in the sample deck (the Hartford Regional Qualifier winner, created 2026-06-21), The Arena's Greatest carries `maxCopies: 0` and `banEffectiveDate: "2026-07-24"`. That matches the official date. It is a useful cross-check for our own ban file, not a source of truth. It also explains why that deck contains a now-banned battlefield.
- The deck code is not in the flight payload (no `deckCode` field), but it is in the server-rendered HTML: the page has a link `href="/deckbuilder?code={code}"`, and for the sample deck that value equals the 165-character `code` stored in the local sample file. So the code can be read from that href, or derived locally with the library in section 7 as a cross-check.
- Images: `https://cdn.piltoverarchive.com/cards/{CODE}.webp` (e.g. `OGN-001.webp`, `OGN-007a.webp`, `RAD-139.webp`).
- DATA: `GameLab/data/decks/samples/piltover-archive-2026-09-06.json` holds 59 decks with `name`, `source`, `code`, `legend`, `chosenChampion`, `battlefields[]`, `main[]`, `runes[]`, `sideboard[]` (plus `counts`, `legendName`, `chosenChampionBase`, `complete`). No script that produced it exists in either repo (grep for `piltoverarchive.com` finds only the data file, `docs/CODEX_HANDOFF.md` and `apps/server/README.md` in GameLab, and nothing in Untitled), so the scraper must be written fresh.

### 5.6 Policy notes

- FACT (https://developer.riotgames.com/policies/riftbound): approved use cases include "Deck builders" and "Card libraries". Not approved: "Apps that publish or retain metagame-defining data for Riftbound" ("play rates for certain decks or cards, win rates ..., or match-up win percentage differentials"); automated rules enforcement of gameplay; custom banlists on an official format. Apps must show the official English card text and include the line: "[The title of your Project] was created under Riot Games' "Legal Jibber Jabber" policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project."
- FACT: the same policy says "Your App may only use Riftbound assets (including cards) provided by the Riot API."
- HEURISTIC: this is a single-user local tool that is never distributed, and the owner has explicitly accepted scraping for it. Keep it that way: never publish the synced data, the images, or any deck-frequency numbers derived from scraped decklists; put the Legal Jibber Jabber line in the About screen anyway. `Untitled/docs/META_INGESTION.md` records the same restriction for the older public project.

## 6. Images

DATA unless marked. Source: live gallery (n = 1,408) and live HEAD/GET tests on one card.

- Native sizes declared by the gallery: 744 wide for 1,305 items (744x1039 for 1,292; 744x1040 for 12, nine RAD and three VEN; 744x1038 for 1); landscape battlefields 1039x744 (53), 1038x744 (23) or 1040x744 (1); **26 OGN printings are 1488x2078** (the 6 alt-art basic runes such as `OGN-126a/298`, the 12 overnumbered legends `OGN-299/298` to `OGN-310/298`, and 8 signature legends such as `OGN-304*/298`). No RAD printing is larger than the 744x1040 class (1040x744 for landscape).
- So 744x1039 PNG is the real ceiling for almost every card. The gallery declares nothing larger apart from those 26 OGN printings.
- URL form: `https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/{hash}-{W}x{H}.png?accountingTag=RB`. The hash is content-addressed: a changed image gets a new URL (6 did since September).
- The CDN accepts Sanity transform parameters (tested on `ogn-001-298`):
  - no parameters: PNG 744x1039, 778,682 bytes (identical to the local file `GameLab/data/images/ogn-001-298.png`).
  - `&w=1488`: PNG 1488x2078, 3,140,413 bytes. This is an upscale of the 744 original, not extra detail.
  - `&w=372`: PNG 372x520, 289,094 bytes.
  - `&fm=webp&q=85`: WebP 744x1039, 97,778 bytes (8 times smaller than the PNG).
- Piltover Archive CDN: `OGN-001.webp` is 1030x1438, 82,946 bytes. UNCONFIRMED whether this is a genuinely higher-resolution source or an upscale of Riot's 744 image.
- Local stock: `GameLab/data/images/` has 1,320 PNGs, 1.2 GB, one per printing id, zero missing against `cards.json` (checked). It includes 133 promo printings whose URLs came from Riftcodex.
- HEURISTIC: store originals as fetched; serve a WebP derivative. Either request `fm=webp&q=85` from the CDN at sync time or convert locally. For a card-zoom view, 744 px is what there is; do not pay 3 MB per card for the upscale.

## 7. Card identity and deck codes

### 7.1 Keys

- FACT: copy limits and legality are by card name (Core Rules 103.3.b "same named card"; 103.3.b.2 "Cards have different names even if they represent the same character"; TR 601.2.a).
- GameLab's scheme (`GameLab/packages/cards/README.md`, `src/ids.ts`, `src/build/canonicalize.ts`):
  - `printingId`: one per physical printing, filesystem-safe, derived from `publicCode`: `ogn-066a-298`, `sfd-227s-221` (signature `*` becomes `s`), `ven-sp3-006`, `unl-t01`.
  - `gameplayId`: the `printingId` of the primary printing of a name group. Primary = base variant first, then earliest set in `SET_ORDER`, then lowest collector number.
  - `cardCode`: deck-code form, `OGN-110`, `OGN-066a`, `SFD-227s`, `VEN-SP3`, `UNL-T01`.
  - Alt art, signature, overnumbered, `SP`, promo-set and cross-set reprints are `printings[]` of one gameplay card.
- DATA (`GameLab/data/cards/cards.json`, built 2026-09-06): 931 gameplay cards, 1,320 printings. Printings per card: 671 have one, 166 two, 64 three, 25 four, 5 five. Variants: base 928, promo 133, alt 102, overnumbered 92, signature 45, token 8, rune 6, special 6. Copy limits: 927 cards at 3, 3 cards at 1, 1 card at 10 (Spiderling, "any number", capped by the old project).
- **Recommendation**: key everything in the app (decks, bans, tags, notes) by `gameplayId`. Keep `cardCode` for import/export and `printingId` for images and the user's preferred art. Store the card name next to every ban entry and have the sync assert `cards[gameplayId].name == ban.name`, so an id drift fails loudly.
- **Name rule for the new gallery shape** (HEURISTIC, derived from the 299 observed renames): group key = `name + ", " + subtitle` when the item is a unit with super type Champion; otherwise `name` alone. Keep `subtitle` as its own field for signature spells and starter legends. Legend display name in official prose is `{champion tag}, {name}` ("Master Yi, Wuju Bladesman").
- `SET_ORDER` in `src/ids.ts` is `['OGN','OGS','SFD','UNL','VEN']` and `TOTAL_TO_SET` in `canonicalize.ts` maps `298, 024, 221, 219, 166`. Both need RAD (`167`), and `167` vs VEN's `166` are close enough to deserve a test. These tables belong in the synced sets file, not in code.

### 7.2 Completeness of the local file against today

- DATA: live gallery, grouped with the name rule above: **1,103 gameplay cards** across **1,408 gallery printings** (primary set: OGN 298, OGS 24, SFD 222, UNL 225, VEN 167, RAD 167). Local: 931 gameplay cards.
- The gap: 178 gallery name groups are not in the local file (the 167 Radiance cards, 6 renamed cards, and 5 token/tracker names: `Buff`, `XP Tracker`, `Recruit`, `Recruit (NX)`, `Recruit (ZN)`), and 6 local names no longer appear in the gallery (931 - 6 + 178 = 1,103). The 6 are renames described in 5.1, not removed cards: the four `... - Starter` legends and `Yi, Honed` / `Yi, Meditative`. Signature spells are not among them; their `name` did not change. Grouping the live gallery by `name` alone would give 1,030 groups instead of 1,103.
- RAD breakdown (219 printings): 167 base, 17 overnumbered (RAD-168 to RAD-184), 18 alt art, 12 runes (6 basic runes, each with an `a` variant), 5 special (`RAD-SP1/005` to `RAD-SP5/005`). 9 new legends, each with a base and an overnumbered printing. The 6 RAD runes are reprints of the basic runes, not new cards.
- `Untitled/apps/web/src/data/riot-cards.json` (imported 2026-07-24) is older still: 928 base printings only, no alt arts, through VEN.

### 7.3 Deck code format

- The `code` field in the Piltover Archive sample is produced by `@piltoverarchive/riftbound-deck-codes` (Apache-2.0, https://github.com/Piltover-Archive/RiftboundDeckCodes). Neither local repo contains its own encoder; both wrap the library:
  - `GameLab/apps/server/src/library.ts`: `deckFromCode` (decode, then split by card type) and `codeForDeck` (encode). Library 1.4.0 is in `GameLab/node_modules/.pnpm/@piltoverarchive+riftbound-deck-codes@1.4.0/`.
  - `Untitled/apps/web/src/lib/deck-code.ts`: `encodeUniversalDeck` / decode, pinned to 1.2.0 with `SET_MAP.VEN = 5; SET_MAP.RAD = 6` patched in by hand.
- npm (live): latest **1.5.0** (2026-09-19); earlier 1.0.0 2025-11-20, 1.1.0 2026-01-10, 1.2.0 2026-03-04, 1.3.0 2026-07-06, 1.4.0 2026-07-15.
- API: `getCodeFromDeck(mainDeck, sideboard, chosenChampion, additionalLegends?)` and `getDeckFromCode(code)` returning `{ mainDeck: [{cardCode,count}], sideboard: [...], chosenChampion, additionalLegends? }`. Also exports `SET_MAP`, `VARIANT_MAP`.
- Wire format (library README): base32 of little-endian varints (LEB128 style, least-significant 7-bit group first). First byte is 4 bits format + 4 bits version. Cards are grouped by copy count, then by set + variant, then listed by number.
  - v1 main deck; v2 sideboard (counts 3..1 only); v3 chosen-champion trailer; v4 a flag byte per card number (`0x00` normal, `0x01` rune `R`); v5 sparse counts for cards above 12 main / 3 side, `SP` flag `0x02`, deck-level prefix bit; v6 (library 1.5.0) a legends block for "additional legends" (e.g. the three a Neeko deck chooses).
  - Set ids: OGN 0, OGS 1, ARC 2, SFD 3, UNL 4, VEN 5, RAD 6. **No id for LGC yet.** The changelog shows set ids are added without a format-version bump (1.3.0 appended VEN and RAD), and the 1.5.0 README says unknown set identifiers throw on decode, so a January code from a newer library can fail on an older one (the consequence is HEURISTIC; no LGC code exists to test).
  - Variant ids: 0 base, 1 `a`, 2 `s` or `*` (decodes to `s`), 3 `b`.
- **The "main deck" in a code is everything**: legend, three battlefields, runes and the 40 main cards in one list. Card type must be looked up to split them. DATA: decoding the first sample deck with 1.4.0 gives 23 entries totalling 56 cards (1 + 3 + 12 + 40), a sideboard of 5 entries totalling 8 cards, `chosenChampion: "UNL-113"`, and re-encoding returns the identical string.
- A code can list two printings of one card (base and alt art). Merge counts by `gameplayId` after decoding; `GameLab/apps/server/src/library.ts` does this in `deckFromCode`, calling `mergeCounts` imported from `@gamelab/engine`.
- **Recommendation**: depend on the npm package at `^1.5.0`; do not copy or re-implement the codec. Wrap it in one module that maps `cardCode` to and from `gameplayId` using the synced card file, and surface "unknown set in deck code, update the library" as a specific error.

## 8. How the existing repos ingest (what to reuse)

Note: `GameLab/scripts/` contains only `card-fleet.mjs` (a Codex job runner for implementing card behaviour), its test, and `deploy.sh`. None of them fetch card data. The ingestion lives in `GameLab/packages/cards/`.

| File | What it does | Reuse? |
|---|---|---|
| `GameLab/packages/cards/src/scrape/gallery.ts` | Fetches the gallery HTML with UA `Mozilla/5.0 (GameLab card pipeline)`, extracts `__NEXT_DATA__`, zod-validates each item, writes `data/raw/gallery-{date}.html` and `gallery-latest.json` | Copy the schema; switch the fetch to the JSON endpoint (5.1); add `subtitle` and `effect` |
| `.../src/scrape/riftcodex.ts` | Pages `https://api.riftcodex.com/cards?page=N&size=100` with 150 ms delay, zod-validates, writes `riftcodex-latest.json` | Copy as is; optional source |
| `.../scripts/scrape.ts`, `build.ts`, `images.ts` | `pnpm cards:scrape`, `cards:build [--allow-shrink]`, `cards:images` | Copy the flow |
| `.../src/build/canonicalize.ts` | Groups printings by normalised name, picks the primary printing, derives `copyLimit` from rules text, merges Riftcodex promo printings (OPP/PR/JDG) by collector number + origin total, records text mismatches between printings | Copy, then fix the name key (7.1) and move the set tables to data |
| `.../src/build/report.ts` | Diff against the previous snapshot; `assertNoShrink` refuses a build that loses cards | Copy; this is the fail-closed guard |
| `.../src/scrape/images.ts` | Downloads every printing's PNG to `data/images/{printingId}.png`, concurrency 6, 3 retries, skips existing non-empty files | Copy; lower concurrency to 2 |
| `.../src/ids.ts`, `schema.ts`, `normalize/*`, `tokens.ts` | Code parsing, card schema, icon/keyword normalisation, rules-defined tokens | Copy |
| `.../scripts/rules-import.ts`, `rules-check.ts` | Core Rules PDF to markdown (needs poppler); exits 2 when the Hub lists an unknown PDF | Copy `rules-check` into the sync as a staleness warning |
| `Untitled/scripts/import-riot-card-gallery.mjs` | Older importer: reads a saved gallery HTML, keeps base printings only, writes `apps/web/src/data/riot-cards.json` | Superseded by GameLab's; do not reuse |
| `Untitled/scripts/bootstrap-private-poc-catalog.mjs` | Loads the 928-card file into Supabase with hard-coded per-set expected counts | Not needed locally |
| `Untitled/config/current-constructed-rules.json` | Ban + set legality snapshot with source URLs, imported by `apps/web/src/lib/scoring.ts` and `netlify/lib/meta-ingestion-core.mjs` | Reuse the idea and the field names; extend per section 9 |

The `set-adaptation` skill in the Untitled project encodes the same "reviewed snapshot, fail closed" workflow for the older app.

## 9. Recommended sync pipeline

### 9.1 Seed once from local repos (no network)

1. Copy `GameLab/packages/cards/src/**` and its tests as the starting `sync` module.
2. Copy `GameLab/data/images/*.png` (1,320 files, 1.2 GB) into the app's image store, keyed by `printingId`. Hard-link if on the same volume.
3. Copy `GameLab/data/raw/riftcodex-latest.json` (promo printings, TCGplayer ids, flavour text; Riftcodex has not changed since).
4. Copy `GameLab/data/decks/samples/piltover-archive-2026-09-06.json` as test fixtures only.
5. Do not copy `cards.json`; rebuild it, because names and text changed.

### 9.2 `sync` command (network; serial, about 1 request per second, generic UA, no personal data in any request)

1. **Cards**: GET the gallery JSON endpoint with `limit=2000` (fall back to paging by 200 via `linkdata.next`). Save raw to `data/raw/gallery-{date}.json`. Count rows; ignore `metadata.totalItems`.
2. **Sets**: GET `riftbound_gallery_sets`. Any set id not present in `data/legality.json` stops the build with "new set X: add it to legality.json with a source URL".
3. **Riftcodex** (optional): page `/cards` at `size=100` (15 requests, well under 100/min). Used only to attach promo printings, `tcgplayer_id` and flavour text.
4. **Canonicalise** with the fixed name key. Run `assertNoShrink` and write a diff report (added, removed, text changed, image changed).
5. **Images**: download only printing ids whose file is missing or whose URL hash changed (today: 219 RAD + 6 changed). Keep the PNG; generate a WebP derivative.
6. **Staleness checks, warn only**: fetch the Rules Hub, compare the Core Rules and Tournament Rules PDF URLs and both "Last updated" strings in the legality blocks with the values stored in `data/legality.json`. If either differs, print "legality data may be stale: Rules Hub changed" and list the news items newer than `reviewedOn` whose title contains "Ban". Never auto-edit bans from scraped prose.
7. **Decklists** (optional, later): Piltover Archive `/decks?page=N` then `/decks/view/{uuid}`, parsing the flight payload. Local use only.

### 9.3 `data/legality.json`: bans and set legality as data, never code

Hand-reviewed, with a source URL on every entry. The app reads this file at start; no card name or set code appears in application code.

```json
{
  "schemaVersion": 1,
  "reviewedOn": "2026-11-11",
  "hub": {
    "url": "https://playriftbound.com/en-us/rules-hub/",
    "constructedLastUpdated": "September 18, 2026",
    "coreRulesPdf": "https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/5c7946f7c3b8c6e0faff85ab6dadc6d2e721ea94.pdf",
    "tournamentRulesPdf": "https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/861752822d217edf37d9febaeaf77a7d924c1bb6.pdf",
    "rulesEdition": "2026-10-09"
  },
  "sources": {
    "bans-2026-03": { "title": "Announcing Riftbound's First Bans", "url": "https://playriftbound.com/en-us/news/announcements/announcing-riftbounds-first-bans/", "published": "2026-03-30" },
    "bans-2026-07": { "title": "July Ban List Updates", "url": "https://playriftbound.com/en-us/news/announcements/july-ban-list-updates/", "published": "2026-07-17" },
    "bans-2026-09": { "title": "September Ban List Updates (Effective September 18, 2026)", "url": "https://playriftbound.com/en-us/news/announcements/september-ban-list-updates-effective-september-18-2026/", "published": "2026-09-15" },
    "tr-601": { "title": "Tournament Rules 601.3.c", "url": "https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/861752822d217edf37d9febaeaf77a7d924c1bb6.pdf" },
    "origins-restock-2025-10": { "title": "How to buy Riftbound Worlds Bundle 2025 and Origins Restock News!", "url": "https://playriftbound.com/en-us/news/announcements/how-to-buy-riftbound-worlds-bundle-2025-and-origins-restock-news/", "published": "2025-10-07" }
  },
  "sets": [
    { "code": "OGN", "name": "Origins", "numbered": 298, "releaseDate": "2025-10-31", "legalFrom": "2025-10-31", "confirmed": true, "sourceId": "origins-restock-2025-10" },
    { "code": "OGS", "name": "Proving Grounds", "numbered": 24, "releaseDate": "2025-10-31", "legalFrom": "2025-10-31", "confirmed": false, "sourceId": "tr-601" },
    { "code": "RAD", "name": "Radiance", "numbered": 167, "releaseDate": "2026-10-23", "legalFrom": "2026-10-23", "confirmed": true, "sourceId": "tr-601" }
  ],
  "rotation": { "active": false, "note": "Rules Hub: rotation intended starting in 2028", "sourceUrl": "https://playriftbound.com/en-us/rules-hub/" },
  "formats": {
    "standard": { "inherits": null, "sideboardMax": 10, "mainDeckSize": 40 },
    "2v2": { "inherits": "standard" },
    "ffa": { "inherits": "standard", "confirmed": false }
  },
  "bans": [
    { "gameplayId": "ogn-110-298", "name": "Ekko, Recurrent", "zone": "main", "formats": ["standard"], "effectiveFrom": "2026-09-18", "sourceId": "bans-2026-09" },
    { "gameplayId": "ogs-019-024", "name": "Master Yi, Wuju Bladesman", "zone": "legend", "formats": ["2v2"], "effectiveFrom": "2026-07-24", "sourceId": "bans-2026-07" }
  ]
}
```

Rules for this file:

- A format's effective ban list = its own entries plus those of the format it `inherits`.
- `zone` is `main`, `battlefield` or `legend`. A main-zone ban also covers the sideboard and the Chosen Champion slot (HEURISTIC: the sideboard may hold only valid Main Deck cards, TR 601.1.c.2).
- Build-time validation: every `gameplayId` exists in the card file, its name matches, every `sourceId` resolves, every set in the card file has a `sets` row. Any failure stops the build.
- Entries with `"confirmed": false` render with a small "unconfirmed" marker in the UI.
- Section 3.2 and 3.3 of this document are the complete content to load: 12 Standard entries and 1 2v2-only entry.

## 10. What stayed unconfirmed

- The English release date of Proving Grounds (OGS) from a primary page (Riftcodex says 2025-10-31). UNL is now confirmed outright; OGN and SFD are confirmed only through indirect wording in primary articles (section 2.1 table).
- Whether any Tournament Rules edition before 2026-07-16 had a sideboard limit other than 10.
- Whether FFA (Skirmish/War) events use the Standard ban list; no FFA list is published.
- The authenticated response body of `riftbound-content-v1`.
- Whether Piltover Archive's 1030x1438 WebP images carry more real detail than Riot's 744x1039 PNGs.
- Riftcodex's terms beyond its FAQ, and whether it will add Radiance.
- Why the gallery endpoint's `metadata.totalItems` (1,416) exceeds the 1,408 rows returned.
- The exact first-rotation date and which sets leave in 2028.

## Verification log (2026-11-11)

Independent second pass. Every URL was re-fetched (generic User-Agent, serial, about one second apart), both rules PDFs were re-downloaded and converted with `pdftotext -layout`, and every number labelled DATA was recomputed from the live gallery endpoint, `GameLab/data/cards/cards.json`, `GameLab/data/raw/*.json` and the local sample decks. About 190 discrete claims were checked. This file cites no script under `docs/research/analysis/`; the only artefact there that it touches, `analysis/raw/gallery-2026-11-11.html`, was re-parsed.

### Corrections made (all applied in place above)

1. **HTML blob duplicate / missing printing (sections 1, 5.1, 5.2): wrong.** A fresh fetch of the gallery page and the saved `analysis/raw/gallery-2026-11-11.html` both hold 1,408 items with 1,408 unique ids, identical to the JSON endpoint's id set. `sfd-054-221` is not duplicated and `sfd-119-221` is present. The JSON endpoint is still the better source, but not because the HTML is incomplete.
2. **Rename counts (5.1, 7.1): 298 / 295 were wrong.** Live vs `gallery-latest.json` (n = 1,189): 299 names changed, 292 are exactly `name + ", " + subtitle`; the other 7 are 4 starter legends, `Yi, Honed`, `Yi, Meditative`, `Recruit (NX)`.
3. **Subtitle breakdown (5.1): 350 champion units was wrong.** 369 items carry `subtitle`: 349 champion units, 15 signature spells, 1 signature unit (`Tibbers` + `Annie`, OGS-018), 4 starter legends. All 349 units with super type champion have a subtitle.
4. **`energy` / `might` / `power` shape (5.1): imprecise.** All three gained `label`; only `might` and `power` gained `value.icon`.
5. **Empty `cardType.type` (5.1): partly wrong.** 15 items (13 RAD, 2 UNL) confirmed, but only the 13 RAD items are recoverable from `accessibilityText`. `UNL-T04` Buff and `UNL-T08` XP Tracker are not, and `canonicalize.ts` line 132 would exclude them.
6. **`effect` (5.1): clarified.** 35 items, 33 gear; 32 items already had it in the September snapshot, so it is not a new field.
7. **Local names missing from the gallery (7.2): 18 was wrong, it is 6**, and signature spells are not among them (their `name` never changed). Gap restated with reproduced numbers: 178 new groups (167 RAD, 6 renames, 5 token/tracker names), 6 vanished names, 931 - 6 + 178 = 1,103. Added: grouping by `name` alone gives 1,030 groups.
8. **Image sizes (6): incomplete.** Reproduced distribution: 744x1039 1,292; 744x1040 12 (9 RAD, 3 VEN); 744x1038 1; 1039x744 53; 1038x744 23; 1040x744 1; 1488x2078 26. The 26 large OGN printings are 6 alt-art runes, 12 overnumbered legends (OGN-299 to 310) and 8 signature legends; `OGN-126a/298` is a rune, not a legend. "No RAD printing is larger than 744 wide" was false as written (RAD battlefields are landscape) and was reworded.
9. **Deck-code wire format (7.3): "big-endian varints" was wrong.** The library README says little endian, "least-significant 7-bit group first, as in LEB128".
10. **`mergeCounts` (7.3): wrong location.** It is imported from `@gamelab/engine` and called inside `deckFromCode` in `GameLab/apps/server/src/library.ts`.
11. **Sample deck file (5.5): 60 decks was wrong, it is 59.** Extra fields listed.
12. **Deck code on Piltover Archive deck pages (5.5): wrong.** The code is absent from the flight payload but present in the server-rendered HTML as `href="/deckbuilder?code=..."`; for the sample deck it equals the stored `code`.
13. **Piltover Archive deck shape (5.5): imprecise.** The main-deck key is `maindeck[]`; `legend` is a variant object with a nested `card`, not a `{deckId, cardId, variantId, quantity, card}` entry.
14. **Release dates (2.1, 9.3, 10): three of four "UNCONFIRMED" upgraded.** UNL 2026-05-08 is stated outright in The Unleashed Overview ("the English version will release on 5/8"). SFD 2026-02-13 follows from "Happy Spiritforged Launch Day" in an article published that day. OGN 2025-10-31 follows from "get their hands on cards on October 31" (2025-10-07 article). OGS stays UNCONFIRMED.
15. **Sideboard history (4): narrowed.** The 2026-07-16 Tournament Rules (`503da656...pdf`, re-downloaded) already say "10 or fewer" at 601.1.c.1. Added the measured sideboard sizes of the 59 sample decks (55 at 8, 3 at 10, 1 at 7).
16. **News index scan (3.1): understated.** The index lists 135 items back to 2025-06-06; all were scanned and no ban article newer than 2026-09-15 exists.
17. **Sideboard of the first sample deck (7.3): clarified** as 5 entries totalling 8 cards.
18. **Super-type values (5.1): clarified** as lower-case ids; type counts added.

### Confirmed without change (evidence)

- Rules Hub: both legality blocks "Last updated: September 18, 2026"; the "All sets currently produced..." and "Starting in 2028..." sentences verbatim; Standard list of 7 cards and 5 battlefields; 2v2 list adds Legends: Master Yi, Wuju Bladesman (the Hub's 2v2 block spells one entry "Draven Vanquisher" without the comma); Core Rules and Tournament Rules both "last updated: October 9, 2026" with the two PDF URLs given here.
- PDFs: sha256 `94d41fee86f88b61c4157c0389c0595d990b98e5b42555c99d9f649ee64d1fec` (Core Rules, 8,508 text lines, "Last Updated: 2026-10-09") and `ce07da4fb632526afbbce7f058287a57e7444fa6bde17b0938ff52ce3fab3d07` (Tournament Rules, "Last Updated October 9, 2026"). No newer edition is linked from the Rules Hub.
- Tournament Rules wording and numbers: 402.1, 403.4.a, 601.1.b, 601.1.c.1 to c.4, 601.1.d, 601.2.a to d, 601.2.d.2.a, 601.3.a to c.6.a, 602.1.b, all verbatim as quoted.
- Core Rules: 103.3 "A Main Deck of at least 40 cards", 103.3.b, 103.3.b.2, 103.3.d, 103.4.a; modes at 489 (FFA3 Skirmish), 490 (FFA4 War), 491 (2v2 Magma Chamber). Local 2026-07-16 copy has Main Deck at 103.2 and the modes at 487 to 489, so the renumbering claim holds.
- Ban articles A, B, C: titles, publication dates (2026-03-30, 2026-07-17, 2026-09-15), effective dates (2026-03-31, 2026-07-24, 2026-09-18), card lists, and every quotation (2v2 list introduction, "We do not have any plans to pursue these in the foreseeable future", "shared our intent to ban", "added to the Standard and 2v2 Constructed ban list").
- All 12 Standard ids/codes and the 2v2 legend id resolve by name in the live gallery exactly as tabled; `SFD-020a` is the only extra printing of a banned card; the battlefield's gallery name is "The Dreaming Tree".
- `Untitled/config/current-constructed-rules.json`: 10 entries, ids, dates, source ids, `setLegalFrom.VEN`, `policyVersion`, `rulesSnapshotDate`, `observationWindowMonths: 3`; both source URLs return 200.
- Future sets: codes, card counts, Pre-Rift and release dates for RAD, LGC, PG2, REC; Set 8 "Arriving Q3 2027"; the templating changes; roadmap "Last Updated: October 26, 2026" and its June placement of the Reckoning Pre-Rift (23-29th) and launch (30th); Reckoning Regional #1 on May 14-16, 2027.
- Vendetta Overview release line; August State of the Game quotation; Testing Start of Game Rules (2026-10-15, "No", three candidate changes, select events); changelog, patch-notes and errata URLs and dates.
- Gallery endpoint: 200, no key, `Cache-Control: no-cache, private`, response shape, `limit=2000` returns 1,408 rows / 1,408 unique ids, paging by 200 gives 8 non-empty pages (200, 199, 199, 198, 200, 198, 198, 16), `totalItems` 1,416; sets list of 6 with the tabled `collectorNumberMax`; every per-field count; set, rarity and domain value counts; `publicCode` examples; 219 RAD printings added; 17 text changes and 6 image-URL changes since September.
- Grouping with the stated name rule: 1,103 gameplay cards, primary-set split OGN 298, OGS 24, SFD 222, UNL 225, VEN 167, RAD 167. RAD breakdown 167 / 17 / 18 / 12 / 5 and 9 legends with two printings each.
- `cards.json`: 931 cards, 1,320 printings, printings-per-card histogram, variant counts, copy limits; 1,320 PNGs, 1.2 GB, none missing.
- Image CDN tests on `ogn-001-298`: byte counts and dimensions for all four variants; local file byte-identical; Piltover Archive `OGN-001.webp` 1030x1438, 82,946 bytes.
- Riot API: 401 body verbatim; DTO field lists; "During beta only en available"; policy quotations (approved and unapproved use cases, Legal Jibber Jabber line, "may only use Riftbound assets (including cards) provided by the Riot API", no custom banlists on official formats).
- Riftcodex: OpenAPI title/version and endpoint list, `size` max 100 (422 on 500), total 1,451 (same as the local snapshot), `set_id=RAD` total 0, `/sets` counts, changelog v0.2.1 Jul 10, 2026, FAQ rate-limit and fan-project wording, `/terms` 404.
- Piltover Archive: `robots.txt` verbatim; no `__NEXT_DATA__`; deck page 529 KB; card fields including `maxCopies` and `banEffectiveDate`; The Arena's Greatest `maxCopies: 0`, `banEffectiveDate: "2026-07-24"`; deck `createdAt` 2026-06-21; CDN image URLs.
- Deck-code library: npm versions and dates, Apache-2.0, API signatures, exports, set and variant ids, version table; first sample deck decodes with 1.4.0 to 23 entries / 56 cards, `chosenChampion: "UNL-113"`, and re-encodes to the identical string; Untitled pins 1.2.0 with `SET_MAP.VEN = 5; SET_MAP.RAD = 6`.
- GameLab pipeline facts in section 8: user agent string, 150 ms Riftcodex delay, image concurrency 6 / 3 retries / skip non-empty, `assertNoShrink`, `rules-check` exit code 2, poppler requirement, `SET_ORDER`, `TOTAL_TO_SET`, `cardTypesOf`, grouping by `normalizeName(item.name)`, `GameLab/scripts/` contents; `riot-cards.json` 928 base printings imported 2026-07-24.

### Left UNCONFIRMED

- English release date of Proving Grounds (OGS) from a primary page.
- Whether FFA (Skirmish / War) events use the Standard ban list; no FFA list is published.
- The authenticated response body of `riftbound-content-v1` (no key).
- Whether Piltover Archive's 1030x1438 WebP is a genuinely higher-resolution source.
- Why `metadata.totalItems` (1,416) exceeds the 1,408 rows returned.
- Whether any Tournament Rules edition before 2026-07-16 had a different sideboard limit.
- Riftcodex terms beyond its FAQ, and whether it will add Radiance.
- First-rotation date and which sets leave in 2028.
- Not exercised: Piltover Archive `/decks?page=N` listing pages (only `robots.txt` and one deck page were fetched), and the behaviour of `Untitled/scripts/import-riot-card-gallery.mjs` beyond its output file.

### Must be treated as heuristic by the design

- Bans apply to every printing of a name (inferred from TR 601.2.a and Core Rules 103.3.b; the ban articles list names only).
- A main-zone ban also covers the sideboard and the Chosen Champion slot.
- FFA defaulting to the Standard ban list.
- The gallery name rule (`name + ", " + subtitle` for champion units only). It reproduces 1,103 groups today, but it is our inference from observed renames, not a published contract; the gallery shape has already changed once.
- The first rotation dropping the 2025 sets at the start of 2028.
- Treating April 30, 2027 as the Reckoning date over the roadmap's June placement.
- OGN and SFD release dates rest on indirect wording, and "regional launch date = Constructed-legal date" for English is our reading of TR 601.2.b.
- A newer library's deck code failing on an older library when a set id is added.
- The single-user, non-distributed reading of Riot's developer policy, and the WebP / download-concurrency choices.
