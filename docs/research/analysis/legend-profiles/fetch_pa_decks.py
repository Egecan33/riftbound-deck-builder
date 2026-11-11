#!/usr/bin/env python3
"""Polite, serial fetch of a per-legend sample of piltoverarchive.com deck pages.

    python3 fetch_pa_decks.py --list ../raw/pa-list.jsonl --per-legend 6 --out data/pa-decks.jsonl

* robots.txt (fetched 2026-11-11) allows "/" and plain "/decks?page=N"; it disallows /api/ and filtered
  /decks? queries. This script only requests /decks/view/<id> pages, one at a time, 3 s apart, with a
  generic User-Agent and no cookies or personal data.
* The deck LIST (ids, names, legend code, views, dates) comes from ../raw/pa-list.jsonl, which the shared
  list crawler (../crawl-list.mjs) wrote. This script does not crawl list pages itself.
* Already-parsed decks from ../wincons/pa-decks-2026-11-11.json are reused instead of fetched again.
* Raw HTML is never kept; only the compact parsed deck is appended to --out (JSON lines, resumable).

Selection per legend (deterministic): legal lists only; rank
  1. name carries an event marker AND created on/after the Radiance release (2026-10-23)
  2. name carries an event marker AND created on/after 2026-09-15
  3. created on/after 2026-10-23, by views
  4. anything else, by views
and take the first N.
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cardpool  # noqa: E402

UA = 'Mozilla/5.0 (compatible; deck-research/1.0)'
MARK = re.compile(r"stuttgart|sacramento|melbourne|orlando|showdown|regional|\bRC\b|\bRQ\b|best[ -]of|\b1st\b|\b2nd\b|\b3rd\b|"
                  r"top ?\d|win-a-case|#\d|city challenge|skirmish|convergence|rift rumble|qualifier|winner|finalist|"
                  r"champion(?:ship)?s?\b|\bundefeated\b|\b\d-\d(?:-\d)?\b", re.I)
RADIANCE_RELEASE = '2026-10-23'


def has_marker(name):
    return bool(MARK.search(name or ''))


def parse_deck(html, deck_id):
    t = html.replace('\\"', '"')
    pat = re.compile(r'"deckId":"%s","cardId":"[^"]+","variantId":"[^"]*","quantity":(\d+),"card":\{"id":"[^"]+",'
                     r'"name":"((?:[^"\\]|\\.)*)","types":\[[^\]]*\],"type":"([^"]*)","super":("[^"]*"|null)' % re.escape(deck_id))
    keys = [(m.start(), m.group(1)) for m in re.finditer(r'"([A-Za-z]+)":\[\{"deckId"', t)]
    sections = {}
    for m in pat.finditer(t):
        sec = 'unknown'
        for pos, k in keys:
            if pos < m.start():
                sec = k
        vm = re.search(r'"variantNumber":"([A-Z]{2,4}-[0-9A-Za-z*]+)"', t[m.end():m.end() + 3000])
        try:
            name = json.loads('"' + m.group(2) + '"')
        except Exception:
            name = m.group(2)
        sections.setdefault(sec, []).append({'count': int(m.group(1)), 'name': name, 'type': m.group(3),
                                             'super': json.loads(m.group(4)), 'code': vm.group(1) if vm else None})
    return sections


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--list', required=True)
    ap.add_argument('--cards', default=os.path.expanduser('~/github_repositories/GameLab/data/cards/cards.json'))
    ap.add_argument('--gallery', default='raw/gallery-2026-11-11.json')
    ap.add_argument('--seed', default='../wincons/pa-decks-2026-11-11.json')
    ap.add_argument('--per-legend', type=int, default=6)
    ap.add_argument('--out', required=True)
    ap.add_argument('--sleep', type=float, default=3.0)
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()

    cards, _ = cardpool.load_pool(a.cards, a.gallery if os.path.exists(a.gallery) else None)
    base_of = {}
    for c in cards:
        if c['type'] == 'legend':
            for pc in c['printingCodes']:
                base_of[pc] = c['cardCode']
    rows, seen = [], set()
    for line in open(a.list, encoding='utf-8'):
        r = json.loads(line)
        if r['id'] in seen:
            continue
        seen.add(r['id'])
        code = (r.get('legendCode') or '').rstrip('*').rstrip('s')
        r['legendBase'] = base_of.get(r.get('legendCode')) or base_of.get(code)
        rows.append(r)
    unmapped = sorted({r.get('legendCode') for r in rows if not r['legendBase']} - {None})
    print('list rows', len(rows), 'unmapped legend codes', unmapped, file=sys.stderr)

    def rank(r):
        created = (r.get('createdAt') or '')[:10]
        mark = has_marker(r.get('name'))
        tier = 1 if (mark and created >= RADIANCE_RELEASE) else 2 if (mark and created >= '2026-09-15') \
            else 3 if created >= RADIANCE_RELEASE else 4
        return (tier, -(r.get('views') or 0), r['id'])

    by_legend = {}
    for r in rows:
        if r['legendBase'] and r.get('isLegal'):
            by_legend.setdefault(r['legendBase'], []).append(r)
    selected = []
    for code in sorted(by_legend):
        for i, r in enumerate(sorted(by_legend[code], key=rank)[:a.per_legend]):
            r['selectionTier'] = rank(r)[0]
            r['selectionOrder'] = i
            selected.append(r)
    # round-robin: every legend gets its 1st list before any legend gets its 2nd (a partial run stays balanced)
    selected.sort(key=lambda r: (r['selectionOrder'], r['legendBase']))
    print('selected', len(selected), 'decks for', len(by_legend), 'legends', file=sys.stderr)

    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    have = set()
    if os.path.exists(a.out):
        for line in open(a.out, encoding='utf-8'):
            have.add(json.loads(line)['id'])
    seed = {}
    if os.path.exists(a.seed):
        for d in json.load(open(a.seed, encoding='utf-8')):
            if d.get('http') == '200' and d.get('sections', {}).get('maindeck'):
                seed[d['id']] = {k: [{'count': e['count'], 'name': e['name'], 'type': e['type'], 'super': e['super'],
                                      'code': e['code']} for e in v] for k, v in d['sections'].items()}
    todo = [r for r in selected if r['id'] not in have]
    print('to fetch', sum(1 for r in todo if r['id'] not in seed), 'seeded', sum(1 for r in todo if r['id'] in seed), file=sys.stderr)
    if a.dry_run:
        return
    with open(a.out, 'a', encoding='utf-8') as out:
        for i, r in enumerate(todo):
            url = 'https://piltoverarchive.com/decks/view/' + r['id']
            src = 'seed:wincons'
            sections = seed.get(r['id'])
            status = 200
            if sections is None:
                src = 'fetch'
                try:
                    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'text/html'})
                    with urllib.request.urlopen(req, timeout=45) as resp:
                        status = resp.status
                        html = resp.read().decode('utf-8', errors='replace')
                    sections = parse_deck(html, r['id'])
                except Exception as e:  # noqa: BLE001
                    status, sections = str(e)[:80], {}
                time.sleep(a.sleep)
            rec = {'id': r['id'], 'url': url, 'name': r.get('name'), 'author': r.get('author'), 'views': r.get('views'),
                   'likes': r.get('likes'), 'createdAt': r.get('createdAt'), 'editedAt': r.get('editedAt'),
                   'legendCode': r.get('legendCode'), 'legendBase': r['legendBase'], 'eventMarker': has_marker(r.get('name')),
                   'selectionTier': r['selectionTier'], 'fetchedAt': time.strftime('%Y-%m-%d'), 'http': status,
                   'via': src, 'sections': sections}
            out.write(json.dumps(rec, ensure_ascii=False) + '\n')
            out.flush()
            if i % 20 == 0:
                print(i, len(todo), status, (r.get('name') or '')[:40], {k: sum(e['count'] for e in v) for k, v in sections.items()},
                      file=sys.stderr)
    print('done', file=sys.stderr)


if __name__ == '__main__':
    main()
