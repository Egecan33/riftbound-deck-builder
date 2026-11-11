#!/usr/bin/env python3
"""Generate the DATA-DERIVED half of the legend profiles (what people actually register).

    python3 build_legend_meta.py \
        --local-sample ~/github_repositories/GameLab/data/decks/samples/piltover-archive-2026-09-06.json \
        --pa-list ../raw/pa-list.jsonl --pa-decks data/pa-decks.jsonl \
        --results data/results-riftboundgg-2026-11.json \
        --out data/legend-profiles.meta.json

Deterministic counting only. Every number carries its dataset id and n. A legend whose n is below the
thresholds gets dataConfidence 'thin' or 'insufficient' so the app can say so instead of guessing.
"""
import argparse
import json
import os
import re
import sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cardpool  # noqa: E402
from fetch_pa_decks import has_marker  # noqa: E402  (same event-name pattern as the fetch selection)

SCHEMA_VERSION = 2
RADIANCE_RELEASE = '2026-10-23'
SET_ORDER = ['OGN', 'OGS', 'SFD', 'UNL', 'VEN', 'RAD']  # release order; OGS shipped with OGN
BANS = {}  # cardCode -> {'effectiveFrom': ...}, filled in main()
# dataConfidence thresholds (HEURISTIC): complete lists in the newest dataset
OK_MIN_LISTS, OK_MIN_EVENT_LISTS, THIN_MIN_LISTS = 5, 3, 2
CORE_RATE, FLEX_RATE = 0.75, 0.25
AVAIL_MIN_LISTS, AVAIL_MIN_EVENT_LISTS = 10, 3
OFFICIAL_RECENT_EVENTS, OFFICIAL_MIN_DAY1 = 3, 30  # field-table window; minimum Day 1 pilots before a conversion rate is shown


def load_index(cards):
    by_code, by_name = {}, {}
    for c in cards:
        for pc in c['printingCodes']:
            by_code[pc] = c
        by_name.setdefault((cardpool.normalize_name(c['name']), c['type']), c)
        by_name.setdefault((cardpool.normalize_name(c['name']), None), c)
    return by_code, by_name


RUNE_PRINTING = re.compile(r'^[A-Z]{3}-R0([1-6])[a-z]?$')


def rune_by_showcase_code(code, by_name):
    """<SET>-R01..R06 are alternate rune printings in the fixed domain order Fury, Calm, Mind, Body, Chaos, Order.
    The gallery snapshot lists the VEN ones (checked in main()); the UNL ones are missing there, so map by number."""
    m = RUNE_PRINTING.match(code or '')
    if not m:
        return None
    return by_name.get((cardpool.normalize_name(cardpool.DOMAINS[int(m.group(1)) - 1] + ' Rune'), 'rune'))


def resolve(entry, by_code, by_name):
    """Deck entry -> pool card. Tries printing code, then code without variant suffix, then name."""
    code = entry.get('cardCode') or entry.get('code') or ''
    for k in (code, entry.get('base') or '', re.sub(r'[a-z*]+$', '', code)):
        if k in by_code:
            return by_code[k]
    r = rune_by_showcase_code(code, by_name)
    if r:
        return r
    if entry.get('name'):
        n = cardpool.normalize_name(entry['name'])
        t = (entry.get('type') or '').lower() or None
        return by_name.get((n, t)) or by_name.get((n, None))
    return None


def norm_deck(dataset, did, name, url, legend, champion, main, runes, bfs, side, extra):
    return dict(dataset=dataset, id=did, name=name, url=url, legend=legend, champion=champion, main=main, runes=runes,
                battlefields=bfs, side=side, **extra)


def set_of(code):
    return code.split('-', 1)[0] if '-' in code and not code.startswith('UNRESOLVED') else None


def finish(d):
    """Derived fields every deck gets, whatever its source: newest set, era, ban flag, duplicate key."""
    codes = [d['legend']] + list(d['main']) + list(d['battlefields']) + list(d['side'])
    sets = [s for s in (set_of(c) for c in codes) if s in SET_ORDER]
    d['newestSet'] = max(sets, key=SET_ORDER.index) if sets else None
    created = d.get('createdAt') or ''
    # Radiance era = the list holds a Radiance card, or the source dates it on/after the release day
    d['era'] = 'radiance' if (d['newestSet'] == 'RAD' or created >= RADIANCE_RELEASE) else 'pre-radiance'
    d['bannedCards'] = sorted(c for c in list(d['main']) + list(d['battlefields']) + list(d['side']) if c in BANS)
    d['dupKey'] = json.dumps([d['legend'], sorted(d['main'].items()), sorted(d['runes'].items()), sorted(d['battlefields'].items())])
    d.setdefault('placement', None)
    d.setdefault('event', None)
    return d


def read_shared_pa(path, by_code, by_name, unresolved):
    """../raw/pa-decks.jsonl written by the shared ../fetch-decks.mjs (event-named Piltover Archive lists)."""
    out = []
    if not path or not os.path.exists(path):
        return out
    for line in open(path, encoding='utf-8'):
        d = json.loads(line)
        leg = by_code.get((d.get('legend') or {}).get('code') or '') or by_code.get(re.sub(r'[a-z*]+$', '', (d.get('legend') or {}).get('code') or ''))
        if not leg or leg['type'] != 'legend':
            continue

        def conv(entries):
            res = Counter()
            for e in entries or []:
                c = resolve(e, by_code, by_name)
                if c:
                    res[c['cardCode']] += e.get('q') or 0
                else:
                    unresolved[e.get('name')] += 1
            return res
        champs = conv(d.get('champions'))
        main = conv(d.get('main')) + champs
        runes = conv(d.get('runes'))
        out.append(norm_deck('pa-fetch-2026-11-11', d['id'], d['name'], 'https://piltoverarchive.com/decks/view/' + d['id'],
                             leg['cardCode'], next(iter(champs), None), main, runes, conv(d.get('battlefields')), conv(d.get('side')),
                             {'additionalLegends': [], 'eventMarker': True, 'createdAt': (d.get('createdAt') or '')[:10],
                              'editedAt': (d.get('editedAt') or '')[:10], 'views': d.get('views'), 'via': 'shared-event-fetch',
                              'complete': sum(main.values()) >= 40 and sum(runes.values()) == 12}))
    return out


def read_r1(parsed_path, qty_path, by_code, by_name, unresolved):
    """riftbound.one /decklists: top-3 lists per event. parsed = sections (ids only), qty = flat id+qty list in page order."""
    out = []
    if not parsed_path or not os.path.exists(parsed_path) or not os.path.exists(qty_path):
        return out
    P = json.load(open(parsed_path, encoding='utf-8'))
    Q = json.load(open(qty_path, encoding='utf-8'))
    for p, q in zip(P, Q):
        leg = by_code.get(re.sub(r'_p\d+$', '', p.get('legendCode') or ''))
        if not leg or leg['type'] != 'legend':
            continue
        flat, i, secs, ok = q['cards'], 0, {}, True
        for k in ('legend', 'champion', 'main', 'battlefields', 'runes', 'sideboard'):
            ids = [c['id'] for c in (p['sections'].get(k) or {}).get('cards', [])]
            part = flat[i:i + len(ids)]
            if sorted(c['id'] for c in part) != sorted(ids):
                ok = False
                break
            i += len(ids)
            res = Counter()
            for c in part:
                cid = re.sub(r'_p\d+$', '', c['id'])  # the site marks alternate printings as <code>_pN
                card = by_code.get(cid) or by_code.get(re.sub(r'[a-z*]+$', '', cid)) or rune_by_showcase_code(cid, by_name)
                if card:
                    res[card['cardCode']] += c['qty'] or 0
                else:
                    unresolved[c['id']] += 1
            secs[k] = res
        if not ok:
            continue
        main = secs['main'] + secs['champion']
        mm, yy = (p.get('date') or '00/00').split('/')
        out.append(norm_deck('r1-top3-2026-11-11', 'r1-' + p['key'], '%s, %s (%s)' % (p['event'], p['result'], p['date']),
                             'https://www.riftbound.one/decklists', leg['cardCode'], next(iter(secs['champion']), None), main,
                             secs['runes'], secs['battlefields'], secs['sideboard'],
                             {'additionalLegends': [], 'eventMarker': True, 'createdAt': '20%s-%s' % (yy, mm), 'event': p['event'],
                              'placement': {'1ST': 1, '2ND': 2, '3RD': 3}.get(p['result']),
                              'complete': sum(main.values()) >= 40 and sum(secs['runes'].values()) == 12}))
    return out


# article URLs that are not under /news/organizedplay/ (from the site's sitemap, 2026-11-11)
OFFICIAL_URLS = {'hartfords-top-decks': 'https://playriftbound.com/en-us/news/hartfords-top-decks/'}


def official_legend_code(label, legends_by_tag):
    """Legend label in an official field table -> legend code. Master Yi is the only tag with two pre-Radiance legends."""
    t = (label or '').replace('\u2019', "'").strip()
    low = t.lower()
    if low.startswith('master yi'):
        return 'UNL-191' if ('wm' in low.split() or 'wuju master' in low) else 'OGS-019'
    if low == 'renata':
        low = 'renata glasc'
    for tag, codes in legends_by_tag.items():
        if tag.lower() == low:
            pre = [c for c in codes if not c.startswith('RAD-')]
            return pre[0] if len(pre) == 1 else None
    return None


def read_official(path, by_code, by_name, legends_by_tag, unresolved):
    """Official playriftbound.com 'Top Decks' articles: field table per legend + the best-placed list of each legend."""
    decks, field = [], defaultdict(list)
    if not path or not os.path.exists(path):
        return decks, field, []
    events = json.load(open(path, encoding='utf-8'))
    ev_meta = []
    for e in events:
        date = (e.get('publishedAt') or '')[:10]
        d1 = sum(r.get('day1') or 0 for r in e['field'])
        d2 = sum(r.get('day2') or 0 for r in e['field'])
        ev_meta.append({'slug': e['slug'], 'title': e['title'], 'publishedAt': date, 'legendsInTable': len(e['field']),
                        'day1Players': d1, 'day2Players': d2, 'lists': len(e['decks']),
                        'url': OFFICIAL_URLS.get(e['slug'], 'https://playriftbound.com/en-us/news/organizedplay/%s/' % e['slug'])})
        for r in e['field']:
            code = official_legend_code(r['legend'], legends_by_tag)
            if not code:
                unresolved['official-field:' + r['legend']] += 1
                continue
            field[code].append({'event': e['slug'], 'publishedAt': date, 'day1': r.get('day1'), 'day2': r.get('day2'),
                                'day1Share': round((r.get('day1') or 0) / d1, 4) if d1 else None,
                                'day2Share': round((r.get('day2') or 0) / d2, 4) if d2 and r.get('day2') is not None else None,
                                'day2Conversion': round(r['day2'] / r['day1'], 3) if r.get('day1') and r.get('day2') is not None else None,
                                'fieldDay2Conversion': round(d2 / d1, 3) if d1 else None})
        for n, d in enumerate(e['decks']):
            s = d['sections']

            def conv(entries, typ=None):
                res = Counter()
                for x in entries or []:
                    nm = cardpool.normalize_name(x['name'].replace('\u2019', "'"))
                    c = by_name.get((nm, typ)) or by_name.get((nm, None))
                    if c:
                        res[c['cardCode']] += x['qty']
                    else:
                        unresolved['official:' + x['name']] += 1
                return res
            legs = Counter()
            for x in s.get('legend') or []:
                # official spelling is "<Champion>, <Legend name>"; cards.json names the legend without the champion
                nm = x['name'].replace('\u2019', "'")
                tail = cardpool.normalize_name(nm.split(', ', 1)[-1])
                c = by_name.get((cardpool.normalize_name(nm), 'legend')) or by_name.get((tail, 'legend')) \
                    or by_name.get((cardpool.normalize_name(nm.split(', ', 1)[-1] + ' - Starter'), 'legend'))
                if c:
                    legs[c['cardCode']] += 1
                else:
                    unresolved['official-legend:' + x['name']] += 1
            champs = conv(s.get('champion'), 'unit')
            leg = next(iter(legs), None)
            if not leg and champs:
                tags = by_code[next(iter(champs))]['tags']
                cands = [c for t in tags for c in legends_by_tag.get(t, []) if not c.startswith('RAD-')]
                leg = cands[0] if len(cands) == 1 else None
            if not leg or by_code[leg]['type'] != 'legend':
                continue
            main = conv(s.get('main deck')) + champs
            runes = conv(s.get('rune pool'), 'rune')
            decks.append(norm_deck('official-rq-2026', '%s-%d' % (e['slug'], n), '%s: best %s (%s)' % (e['title'], by_code[leg]['name'], d.get('player') or '?'),
                                   OFFICIAL_URLS.get(e['slug'], 'https://playriftbound.com/en-us/news/organizedplay/%s/' % e['slug']), leg, next(iter(champs), None), main,
                                   runes, conv(s.get('battlefield'), 'battlefield'), conv(s.get('sideboard')),
                                   {'additionalLegends': [], 'eventMarker': True, 'createdAt': date, 'event': e['title'],
                                    'legendRank': d.get('legendRank'), 'legendField': d.get('legendField'), 'overallRank': d.get('overallRank'),
                                    'complete': sum(main.values()) >= 40 and sum(runes.values()) == 12}))
    return decks, field, ev_meta


def read_local(path, by_code, by_name, unresolved):
    out = []
    for d in json.load(open(path, encoding='utf-8'))['decks']:
        leg = by_code.get(d.get('legend') or '')
        if not leg:
            continue

        def conv(entries):
            res = Counter()
            for e in entries or []:
                e = e if isinstance(e, dict) else {'cardCode': e, 'count': 1}
                c = resolve(e, by_code, by_name)
                if c:
                    res[c['cardCode']] += e.get('count', 1)
                else:
                    unresolved[e.get('cardCode') or e.get('name')] += 1
            return res
        champ = by_code.get(d.get('chosenChampionBase') or d.get('chosenChampion') or '')
        out.append(norm_deck('pa-sample-2026-09-06', d['source'].rsplit('/', 1)[-1], d['name'], d['source'], leg['cardCode'],
                             champ['cardCode'] if champ else None, conv(d.get('main')), conv(d.get('runes')),
                             conv(d.get('battlefields')), conv(d.get('sideboard')),
                             {'eventMarker': True, 'createdAt': None, 'complete': bool(d.get('complete'))}))
    return out


def read_pa(path, by_code, by_name, unresolved):
    out = []
    if not os.path.exists(path):
        return out
    for line in open(path, encoding='utf-8'):
        d = json.loads(line)
        s = d.get('sections') or {}
        if not s.get('maindeck'):
            continue

        def conv(entries):
            res = Counter()
            for e in entries or []:
                c = resolve(e, by_code, by_name)
                if c:
                    res[c['cardCode']] += e['count']
                else:
                    unresolved[e.get('name')] += 1
                    key = 'UNRESOLVED:' + (e.get('name') or '?')
                    UNRESOLVED_TYPES[key] = (e.get('type') or 'unknown').lower()
                    res[key] += e['count']
            return res
        champs = conv(s.get('champions'))
        main = conv(s.get('maindeck')) + champs
        champ = next(iter(champs), None)
        n_main = sum(main.values())
        out.append(norm_deck('pa-fetch-2026-11-11', d['id'], d['name'], d['url'], d['legendBase'], champ, main,
                             conv(s.get('runes')), conv(s.get('battlefields')), conv(s.get('sideboard')),
                             {'additionalLegends': sorted(conv(s.get('additionalLegends'))),
                              'eventMarker': bool(d.get('eventMarker')), 'createdAt': (d.get('createdAt') or '')[:10],
                              'editedAt': (d.get('editedAt') or '')[:10], 'views': d.get('views'),
                              'complete': n_main >= 40 and sum(conv(s.get('runes')).values()) == 12}))
    return out


UNRESOLVED_TYPES = {}


def rate_table(decks, field, name_of, top=None):
    n = len(decks)
    if not n:
        return []
    inc, copies = Counter(), Counter()
    for d in decks:
        for code, cnt in d[field].items():
            inc[code] += 1
            copies[code] += cnt
    rows = [{'cardCode': c, 'name': name_of(c), 'decks': inc[c], 'inclusionRate': round(inc[c] / n, 2),
             'avgCopiesWhenPlayed': round(copies[c] / inc[c], 2)} for c in inc]
    for r in rows:
        if r['cardCode'] in BANS:
            r['bannedFrom'] = BANS[r['cardCode']].get('effectiveFrom')
    rows.sort(key=lambda r: (-r['decks'], -r['avgCopiesWhenPlayed'], r['cardCode']))
    return rows[:top] if top else rows


def summarize(decks, cards_by_code, legend_code):
    def name_of(code):
        return cards_by_code[code]['name'] if code in cards_by_code else code.split(':', 1)[1] + ' (not in card pool)'

    def type_of(code):
        return cards_by_code[code]['type'] if code in cards_by_code else UNRESOLVED_TYPES.get(code, 'unknown')
    n = len(decks)
    champs = Counter(d['champion'] for d in decks if d['champion'])
    splits = Counter()
    for d in decks:
        key = ' / '.join('%d %s' % (cnt, name_of(c).replace(' Rune', '')) for c, cnt in
                         sorted(d['runes'].items(), key=lambda kv: (-kv[1], kv[0])))
        if key:
            splits[key] += 1
    main = rate_table(decks, 'main', name_of)
    for r in main:
        r['type'] = type_of(r['cardCode'])
    type_mix = Counter()
    for d in decks:
        for c, cnt in d['main'].items():
            type_mix[type_of(c)] += cnt
    variants = []
    for champ, k in champs.most_common():
        sub = [d for d in decks if d['champion'] == champ]
        others = [d for d in decks if d['champion'] != champ]
        sub_rates = {r['cardCode']: r for r in rate_table(sub, 'main', name_of)}
        oth_rates = {r['cardCode']: r['inclusionRate'] for r in rate_table(others, 'main', name_of)} if others else {}
        distinct = sorted([(r['inclusionRate'] - oth_rates.get(c, 0.0), c) for c, r in sub_rates.items()
                           if r['inclusionRate'] >= 0.5 and r['inclusionRate'] - oth_rates.get(c, 0.0) >= 0.5 and c != champ],
                          key=lambda x: (-x[0], x[1]))[:8] if (others and k >= 2) else []
        variants.append({'chosenChampion': champ, 'name': name_of(champ), 'decks': k, 'share': round(k / n, 2),
                         'distinctiveCards': [{'cardCode': c, 'name': name_of(c), 'rateHere': sub_rates[c]['inclusionRate'],
                                               'rateElsewhere': oth_rates.get(c, 0.0)} for _d, c in distinct],
                         'deckIds': [d['id'] for d in sub]})
    arch = Counter(ARCH_LABELS[d['id']] for d in decks if d['id'] in ARCH_LABELS)
    podium = Counter(d['placement'] for d in decks if d.get('placement'))
    return {
        'n': n, 'nEventMarker': sum(1 for d in decks if d['eventMarker']), 'nComplete': sum(1 for d in decks if d['complete']),
        'sources': dict(sorted(Counter(d['dataset'] for d in decks).items())),
        'newestSetInList': dict(sorted(Counter(d['newestSet'] or '?' for d in decks).items())),
        'nWithCurrentlyBannedCard': sum(1 for d in decks if d['bannedCards']),
        'podiums': {'dataset': 'r1-top3-2026-11-11', 'first': podium[1], 'second': podium[2], 'third': podium[3]},
        'archetypeLabels': {'dataset': 'deck-theory k-means labels (../out/results.json)', 'nLabelled': sum(arch.values()),
                            'labels': [{'label': k, 'decks': v} for k, v in arch.most_common()]},
        'chosenChampions': [{'cardCode': c, 'name': name_of(c), 'decks': k, 'share': round(k / n, 2)} for c, k in champs.most_common()],
        'nChosenChampionKnown': sum(champs.values()),
        'runeSplits': [{'split': s, 'decks': k, 'share': round(k / n, 2)} for s, k in splits.most_common()],
        'battlefields': rate_table([d for d in decks if d['battlefields']], 'battlefields', name_of),
        'nWithBattlefields': sum(1 for d in decks if d['battlefields']),
        'coreCards': [r for r in main if r['inclusionRate'] >= CORE_RATE],
        'flexCards': [r for r in main if FLEX_RATE <= r['inclusionRate'] < CORE_RATE],
        'topCards': main[:25],
        'sideDeck': rate_table([d for d in decks if d['side']], 'side', name_of, top=12),
        'nWithSideDeck': sum(1 for d in decks if d['side']),
        'avgMainTypeCounts': {t: round(v / n, 1) for t, v in sorted(type_mix.items())},
        'variants': variants,
        'decks': [{'id': d['id'], 'dataset': d['dataset'], 'name': d['name'], 'url': d['url'], 'eventMarker': d['eventMarker'],
                   'placement': d.get('placement'), 'createdAt': d.get('createdAt'), 'newestSet': d['newestSet'],
                   'bannedCards': d['bannedCards']} for d in decks],
    }


ARCH_LABELS = {}


def dedupe(decks):
    """Same legend, main deck, runes and battlefields = one list, whatever site it came from. First source wins."""
    seen, out = set(), []
    for d in decks:
        if d['dupKey'] in seen:
            continue
        seen.add(d['dupKey'])
        out.append(d)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cards', default=os.path.expanduser('~/github_repositories/GameLab/data/cards/cards.json'))
    ap.add_argument('--gallery', default='raw/gallery-2026-11-11.json')
    ap.add_argument('--local-sample', required=True)
    ap.add_argument('--pa-list')
    ap.add_argument('--pa-decks')
    ap.add_argument('--pa-shared', help='../raw/pa-decks.jsonl from the shared event-list fetch')
    ap.add_argument('--r1-parsed')
    ap.add_argument('--r1-qty')
    ap.add_argument('--official')
    ap.add_argument('--arch-labels', help='../out/results.json (deck-theory clustering); only used to join labels by deck id')
    ap.add_argument('--bans', default='data/bans-known.json')
    ap.add_argument('--results')
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    cards, _meta = cardpool.load_pool(a.cards, a.gallery if os.path.exists(a.gallery) else None)
    by_code, by_name = load_index(cards)
    base = {c['cardCode']: c for c in cards}
    legends = sorted([c for c in cards if c['type'] == 'legend'], key=lambda c: c['cardCode'])
    if a.bans and os.path.exists(a.bans):
        BANS.update(json.load(open(a.bans, encoding='utf-8'))['cards'])
    if a.arch_labels and os.path.exists(a.arch_labels):
        for d in json.load(open(a.arch_labels, encoding='utf-8'))['decks']:
            if d.get('arch'):
                ARCH_LABELS[d['id']] = d['arch']
    tag_legends = defaultdict(list)
    champ_names = {t for c in cards if c['type'] == 'unit' and 'champion' in [x.lower() for x in c.get('superTypes') or []] for t in c['tags']}
    for l in legends:
        for t in l['tags']:
            tag_legends[t].append(l['cardCode'])
    champ_tag_legends = {t: v for t, v in tag_legends.items() if t in champ_names}

    unresolved = Counter()
    local = read_local(os.path.expanduser(a.local_sample), by_code, by_name, unresolved)
    pa_own = read_pa(a.pa_decks, by_code, by_name, unresolved) if a.pa_decks else []
    pa_shared = read_shared_pa(a.pa_shared, by_code, by_name, unresolved)
    own_ids = {d['id'] for d in pa_own}
    pa = pa_own + [d for d in pa_shared if d['id'] not in own_ids]
    r1 = read_r1(a.r1_parsed, a.r1_qty, by_code, by_name, unresolved)
    rune_check = [(k, by_code[k]['name']) for k in sorted(by_code) if RUNE_PRINTING.match(k) and by_code[k] is not rune_by_showcase_code(k, by_name)]
    if rune_check:
        raise SystemExit('rune printing order assumption broken: %s' % rune_check)
    official, official_field, official_events = read_official(a.official, by_code, by_name, champ_tag_legends, unresolved)
    for d in local:
        d.setdefault('additionalLegends', [])
    everything = [finish(d) for d in pa + r1 + official + local]
    parsed_by_ds = Counter(d['dataset'] for d in everything)
    complete = [d for d in everything if d['complete']]
    complete_by_ds = Counter(d['dataset'] for d in complete)
    pooled = dedupe(complete)  # order = pa, r1, official, local: the richer record wins
    dropped_dupes = len(complete) - len(pooled)

    # popularity among published lists
    pop, pop_recent, pop_recent_event, views = Counter(), Counter(), Counter(), Counter()
    list_rows = 0
    pages = set()
    if a.pa_list and os.path.exists(a.pa_list):
        seen = set()
        for line in open(a.pa_list, encoding='utf-8'):
            r = json.loads(line)
            if r['id'] in seen:
                continue
            seen.add(r['id'])
            pages.add(r.get('page'))
            leg = by_code.get(r.get('legendCode') or '') or by_code.get((r.get('legendCode') or '').rstrip('*'))
            if not leg or leg['type'] != 'legend':
                continue
            list_rows += 1
            pop[leg['cardCode']] += 1
            views[leg['cardCode']] += r.get('views') or 0
            if (r.get('createdAt') or '')[:10] >= RADIANCE_RELEASE:
                pop_recent[leg['cardCode']] += 1
                if has_marker(r.get('name')):
                    pop_recent_event[leg['cardCode']] += 1
    recent_total = sum(pop_recent.values())
    rank_recent = {c: i + 1 for i, (c, _k) in enumerate(sorted(pop_recent.items(), key=lambda kv: (-kv[1], kv[0])))}

    results = json.load(open(a.results, encoding='utf-8')) if a.results and os.path.exists(a.results) else None
    last3 = [e['slug'] for e in official_events[-OFFICIAL_RECENT_EVENTS:]]

    out_legends = []
    for l in legends:
        code = l['cardCode']
        mine = [d for d in pooled if d['legend'] == code]
        rad = [d for d in mine if d['era'] == 'radiance']
        pre = [d for d in mine if d['era'] != 'radiance']
        n_ok, n_event = len(rad), sum(1 for d in rad if d['eventMarker'])
        conf = 'ok' if (n_ok >= OK_MIN_LISTS and n_event >= OK_MIN_EVENT_LISTS) else 'thin' if n_ok >= THIN_MIN_LISTS else 'insufficient'
        basis = 'radiance-lists' if conf != 'insufficient' else 'pre-radiance-lists-only' if len(pre) >= THIN_MIN_LISTS else 'text-only'
        reasons = ['%d complete Radiance-era lists (%d with tournament provenance: event-named, podium or official)' % (n_ok, n_event),
                   '%d complete pre-Radiance lists' % len(pre)]
        res = None
        if results:
            tag = next((t for t in l['tags'] if t in results['byChampion']), None)
            if tag:
                res = dict(results['byChampion'][tag])
                res['sharedWithLegends'] = [c for c in champ_tag_legends.get(tag, []) if c != code]
        fld = official_field.get(code, [])
        recent = [f for f in fld if f['event'] in last3]
        off = None
        if fld:
            d1 = sum(f['day1'] or 0 for f in recent)
            d2 = sum(f['day2'] or 0 for f in recent)
            tot1 = sum(e['day1Players'] for e in official_events if e['slug'] in last3)
            tot2 = sum(e['day2Players'] for e in official_events if e['slug'] in last3)
            off = {'dataset': 'official-rq-2026', 'events': fld,
                   'recent': {'events': last3, 'day1': d1, 'day2': d2,
                              'day1Share': round(d1 / tot1, 4) if tot1 else None, 'day2Share': round(d2 / tot2, 4) if tot2 else None,
                              'day2Conversion': round(d2 / d1, 3) if d1 else None,
                              'fieldDay2Conversion': round(tot2 / tot1, 3) if tot1 else None,
                              'enoughForConversion': d1 >= OFFICIAL_MIN_DAY1} if recent else None}
        allpod = Counter(d['placement'] for d in r1 if d['legend'] == code and d.get('placement'))
        radpod = Counter(d['placement'] for d in r1 if d['legend'] == code and d.get('placement') and d['era'] == 'radiance')
        out_legends.append({
            'legendCode': code, 'name': l['name'], 'tags': l['tags'],
            'dataConfidence': conf, 'adviceBasis': basis, 'dataConfidenceReasons': reasons,
            # could a bigger fetch fix it? 'scarce' = even the published-list index has too few recent lists
            'dataAvailability': 'enough' if (pop_recent.get(code, 0) >= AVAIL_MIN_LISTS
                                             and pop_recent_event.get(code, 0) >= AVAIL_MIN_EVENT_LISTS) else 'scarce',
            'popularity': {'dataset': 'pa-list-2026-11-11', 'lists': pop.get(code, 0),
                           'listsSinceRadiance': pop_recent.get(code, 0),
                           'eventNamedListsSinceRadiance': pop_recent_event.get(code, 0),
                           'shareSinceRadiance': round(pop_recent.get(code, 0) / recent_total, 4) if recent_total else None,
                           'rankSinceRadiance': rank_recent.get(code), 'viewsSum': views.get(code, 0)},
            'officialField': off,
            'podiums': {'dataset': 'r1-top3-2026-11-11', 'all': {'first': allpod[1], 'second': allpod[2], 'third': allpod[3]},
                        'radianceEra': {'first': radpod[1], 'second': radpod[2], 'third': radpod[3]}},
            'results': res,
            'asAdditionalLegend': {'dataset': 'pa-fetch-2026-11-11', 'decks': sum(1 for d in pa if code in d.get('additionalLegends', [])),
                                   'note': 'lists that register this legend as one of the extra legends of Neeko, Blending In (RAD-167)'},
            'samples': {
                'radiance': summarize(rad, base, code) if rad else None,
                'preRadiance': summarize(pre, base, code) if pre else None,
            },
        })
    out = {
        'schemaVersion': SCHEMA_VERSION,
        'generator': 'docs/research/analysis/legend-profiles/build_legend_meta.py',
        'datasets': {
            'pa-fetch-2026-11-11': {'source': 'https://piltoverarchive.com/decks/view/<id>, fetched 2026-11-11 by fetch_pa_decks.py (per-legend sample) and by the shared ../fetch-decks.mjs (event-named lists)',
                                    'decksParsed': parsed_by_ds['pa-fetch-2026-11-11'], 'decksComplete': complete_by_ds['pa-fetch-2026-11-11'],
                                    'fromPerLegendFetch': len(pa_own), 'addedFromSharedEventFetch': len(pa) - len(pa_own),
                                    'note': 'published lists; placements are self-reported in list names'},
            'r1-top3-2026-11-11': {'source': 'https://www.riftbound.one/decklists (one page, fetched 2026-11-11), local copies raw/riftbound-one-decklists-*.json',
                                   'decksParsed': parsed_by_ds['r1-top3-2026-11-11'], 'decksComplete': complete_by_ds['r1-top3-2026-11-11'],
                                   'note': 'first, second and third place lists per event as recorded by the site; dates are month/year only'},
            'official-rq-2026': {'source': 'official "Top Decks" articles on playriftbound.com, local copy raw/official-rq-top-decks-2026-11-11.json',
                                 'events': official_events, 'decksParsed': parsed_by_ds['official-rq-2026'],
                                 'decksComplete': complete_by_ds['official-rq-2026'], 'recentEvents': last3,
                                 'note': 'Regional Qualifiers February to September 2026, all before Radiance; one list per legend (its best-placed pilot)'},
            'pa-sample-2026-09-06': {'source': 'https://piltoverarchive.com/decks (60 most recent, 2026-09-06), local copy GameLab/data/decks/samples/piltover-archive-2026-09-06.json',
                                     'decksWithLegend': len(local), 'decksComplete': complete_by_ds['pa-sample-2026-09-06'],
                                     'note': 'Unleashed-era Regional Qualifier "best of" lists; predates Radiance and the later bans'},
            'pa-list-2026-11-11': {'source': 'https://piltoverarchive.com/decks?page=N (site default order), crawled 2026-11-11 by ../crawl-list.mjs',
                                   'rows': list_rows, 'pages': len(pages), 'rowsSinceRadiance': recent_total,
                                   'note': 'published lists, not tournament registrations; popularity here means builder interest'},
            'results': results['source'] if results else None,
        },
        'pooling': {'completeLists': len(complete), 'duplicatesDropped': dropped_dupes, 'pooledLists': len(pooled),
                    'radianceEra': sum(1 for d in pooled if d['era'] == 'radiance'),
                    'preRadiance': sum(1 for d in pooled if d['era'] != 'radiance'),
                    'eraRule': 'radiance = list holds a RAD card or its source date is on/after 2026-10-23; otherwise pre-radiance'},
        'thresholds': {'availMinLists': AVAIL_MIN_LISTS, 'availMinEventLists': AVAIL_MIN_EVENT_LISTS, 'okMinLists': OK_MIN_LISTS, 'okMinEventLists': OK_MIN_EVENT_LISTS, 'thinMinLists': THIN_MIN_LISTS,
                       'coreRate': CORE_RATE, 'flexRate': FLEX_RATE, 'officialRecentEvents': OFFICIAL_RECENT_EVENTS, 'officialMinDay1': OFFICIAL_MIN_DAY1},
        'unresolvedDeckEntries': dict(unresolved.most_common(40)),
        'legends': out_legends,
    }
    json.dump(out, open(a.out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    c = Counter(l['dataConfidence'] for l in out_legends)
    b = Counter(l['adviceBasis'] for l in out_legends)
    print('legends %d  confidence %s  basis %s  pooled %d (rad %d)  dupes %d  unresolved %d %s -> %s' % (
        len(out_legends), dict(c), dict(b), len(pooled), out['pooling']['radianceEra'], dropped_dupes,
        sum(unresolved.values()), dict(unresolved.most_common(8)), a.out))


if __name__ == '__main__':
    main()
