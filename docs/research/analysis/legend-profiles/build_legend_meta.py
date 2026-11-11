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

SCHEMA_VERSION = 1
RADIANCE_RELEASE = '2026-10-23'
# dataConfidence thresholds (HEURISTIC): complete lists in the newest dataset
OK_MIN_LISTS, OK_MIN_EVENT_LISTS, THIN_MIN_LISTS = 5, 3, 2
CORE_RATE, FLEX_RATE = 0.75, 0.25
AVAIL_MIN_LISTS, AVAIL_MIN_EVENT_LISTS = 10, 3


def load_index(cards):
    by_code, by_name = {}, {}
    for c in cards:
        for pc in c['printingCodes']:
            by_code[pc] = c
        by_name.setdefault((cardpool.normalize_name(c['name']), c['type']), c)
        by_name.setdefault((cardpool.normalize_name(c['name']), None), c)
    return by_code, by_name


def resolve(entry, by_code, by_name):
    """Deck entry -> pool card. Tries printing code, then code without variant suffix, then name."""
    code = entry.get('cardCode') or entry.get('code') or ''
    for k in (code, entry.get('base') or '', re.sub(r'[a-z*]+$', '', code)):
        if k in by_code:
            return by_code[k]
    if entry.get('name'):
        n = cardpool.normalize_name(entry['name'])
        t = (entry.get('type') or '').lower() or None
        return by_name.get((n, t)) or by_name.get((n, None))
    return None


def norm_deck(dataset, did, name, url, legend, champion, main, runes, bfs, side, extra):
    return dict(dataset=dataset, id=did, name=name, url=url, legend=legend, champion=champion, main=main, runes=runes,
                battlefields=bfs, side=side, **extra)


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
    inc, copies = Counter(), Counter()
    for d in decks:
        for code, cnt in d[field].items():
            inc[code] += 1
            copies[code] += cnt
    rows = [{'cardCode': c, 'name': name_of(c), 'decks': inc[c], 'inclusionRate': round(inc[c] / n, 2),
             'avgCopiesWhenPlayed': round(copies[c] / inc[c], 2)} for c in inc]
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
                          key=lambda x: (-x[0], x[1]))[:8] if others else []
        variants.append({'chosenChampion': champ, 'name': name_of(champ), 'decks': k, 'share': round(k / n, 2),
                         'distinctiveCards': [{'cardCode': c, 'name': name_of(c), 'rateHere': sub_rates[c]['inclusionRate'],
                                               'rateElsewhere': oth_rates.get(c, 0.0)} for _d, c in distinct],
                         'deckIds': [d['id'] for d in sub]})
    return {
        'n': n, 'nEventMarker': sum(1 for d in decks if d['eventMarker']), 'nComplete': sum(1 for d in decks if d['complete']),
        'chosenChampions': [{'cardCode': c, 'name': name_of(c), 'decks': k, 'share': round(k / n, 2)} for c, k in champs.most_common()],
        'runeSplits': [{'split': s, 'decks': k, 'share': round(k / n, 2)} for s, k in splits.most_common()],
        'battlefields': rate_table(decks, 'battlefields', name_of),
        'coreCards': [r for r in main if r['inclusionRate'] >= CORE_RATE],
        'flexCards': [r for r in main if FLEX_RATE <= r['inclusionRate'] < CORE_RATE],
        'topCards': main[:25],
        'sideDeck': rate_table(decks, 'side', name_of, top=12),
        'avgMainTypeCounts': {t: round(v / n, 1) for t, v in sorted(type_mix.items())},
        'variants': variants,
        'decks': [{'id': d['id'], 'name': d['name'], 'url': d['url'], 'eventMarker': d['eventMarker'],
                   'createdAt': d.get('createdAt'), 'complete': d['complete']} for d in decks],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cards', default=os.path.expanduser('~/github_repositories/GameLab/data/cards/cards.json'))
    ap.add_argument('--gallery', default='raw/gallery-2026-11-11.json')
    ap.add_argument('--local-sample', required=True)
    ap.add_argument('--pa-list')
    ap.add_argument('--pa-decks')
    ap.add_argument('--results')
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    cards, _meta = cardpool.load_pool(a.cards, a.gallery if os.path.exists(a.gallery) else None)
    by_code, by_name = load_index(cards)
    base = {c['cardCode']: c for c in cards}
    legends = sorted([c for c in cards if c['type'] == 'legend'], key=lambda c: c['cardCode'])
    unresolved = Counter()
    local = read_local(os.path.expanduser(a.local_sample), by_code, by_name, unresolved)
    pa = read_pa(a.pa_decks, by_code, by_name, unresolved) if a.pa_decks else []

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
    tag_legends = defaultdict(list)
    for l in legends:
        for t in l['tags']:
            tag_legends[t].append(l['cardCode'])

    out_legends = []
    for l in legends:
        code = l['cardCode']
        loc = [d for d in local if d['legend'] == code]
        new = [d for d in pa if d['legend'] == code]
        new_complete = [d for d in new if d['complete']]
        n_ok, n_event = len(new_complete), sum(1 for d in new_complete if d['eventMarker'])
        conf = 'ok' if (n_ok >= OK_MIN_LISTS and n_event >= OK_MIN_EVENT_LISTS) else 'thin' if n_ok >= THIN_MIN_LISTS else 'insufficient'
        reasons = ['%d complete lists in pa-fetch-2026-11-11 (%d with an event marker in the name)' % (n_ok, n_event),
                   '%d lists in pa-sample-2026-09-06' % len(loc)]
        res = None
        if results:
            tag = next((t for t in l['tags'] if t in results['byChampion']), None)
            if tag:
                res = dict(results['byChampion'][tag])
                res['sharedWithLegends'] = [c for c in tag_legends[tag] if c != code]
        out_legends.append({
            'legendCode': code, 'name': l['name'], 'tags': l['tags'],
            'dataConfidence': conf, 'dataConfidenceReasons': reasons,
            # could a bigger fetch fix it? 'scarce' = even the published-list index has too few recent lists
            'dataAvailability': 'enough' if (pop_recent.get(code, 0) >= AVAIL_MIN_LISTS
                                             and pop_recent_event.get(code, 0) >= AVAIL_MIN_EVENT_LISTS) else 'scarce',
            'popularity': {'dataset': 'pa-list-2026-11-11', 'lists': pop.get(code, 0),
                           'listsSinceRadiance': pop_recent.get(code, 0),
                           'eventNamedListsSinceRadiance': pop_recent_event.get(code, 0),
                           'shareSinceRadiance': round(pop_recent.get(code, 0) / recent_total, 4) if recent_total else None,
                           'rankSinceRadiance': rank_recent.get(code), 'viewsSum': views.get(code, 0)},
            'results': res,
            'asAdditionalLegend': {'dataset': 'pa-fetch-2026-11-11', 'decks': sum(1 for d in pa if code in d.get('additionalLegends', [])),
                                   'note': 'lists that register this legend as one of the extra legends of Neeko, Blending In (RAD-167)'},
            'samples': {
                'pa-fetch-2026-11-11': summarize(new_complete, base, code) if new_complete else None,
                'pa-sample-2026-09-06': summarize(loc, base, code) if loc else None,
            },
        })
    out = {
        'schemaVersion': SCHEMA_VERSION,
        'generator': 'docs/research/analysis/legend-profiles/build_legend_meta.py',
        'datasets': {
            'pa-sample-2026-09-06': {'source': 'https://piltoverarchive.com/decks (60 most recent, 2026-09-06), local copy GameLab/data/decks/samples/piltover-archive-2026-09-06.json',
                                     'decksWithLegend': len(local), 'note': 'Unleashed-era Regional Qualifier "best of" lists; predates Radiance and the later bans'},
            'pa-fetch-2026-11-11': {'source': 'https://piltoverarchive.com/decks/view/<id>, fetched 2026-11-11 by fetch_pa_decks.py',
                                    'decksParsed': len(pa), 'decksComplete': sum(1 for d in pa if d['complete']),
                                    'note': 'up to 6 lists per legend, event-named Radiance-era lists first; placements are self-reported in list names'},
            'pa-list-2026-11-11': {'source': 'https://piltoverarchive.com/decks?page=N (site default order), crawled 2026-11-11 by ../crawl-list.mjs',
                                   'rows': list_rows, 'pages': len(pages), 'rowsSinceRadiance': recent_total,
                                   'note': 'published lists, not tournament registrations; popularity here means builder interest'},
            'results': results['source'] if results else None,
        },
        'thresholds': {'availMinLists': AVAIL_MIN_LISTS, 'availMinEventLists': AVAIL_MIN_EVENT_LISTS, 'okMinLists': OK_MIN_LISTS, 'okMinEventLists': OK_MIN_EVENT_LISTS, 'thinMinLists': THIN_MIN_LISTS,
                       'coreRate': CORE_RATE, 'flexRate': FLEX_RATE},
        'unresolvedDeckEntries': dict(unresolved.most_common(40)),
        'legends': out_legends,
    }
    json.dump(out, open(a.out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    c = Counter(l['dataConfidence'] for l in out_legends)
    print('legends %d  confidence %s  unresolved entries %d -> %s' % (len(out_legends), dict(c), sum(unresolved.values()), a.out))


if __name__ == '__main__':
    main()
