#!/usr/bin/env python3
"""Polite serial fetch of selected piltoverarchive.com deck pages (generic UA, 2.5 s gap).
Selection: decks in pa-deck-index.json whose name carries a tournament marker, plus the
most-viewed deck of each legend not otherwise covered. Raw HTML is parsed to compact JSON
(pa-decks-2026-11-11.json) and then deleted."""
import json, re, subprocess, time, os, sys
idx = json.load(open('pa-deck-index.json'))
MARK = re.compile(r"stuttgart|sacramento|melbourne|orlando|showdown|regional|\bRC\b|\bRQ\b|best[ -]of|1st|2nd|3rd|top ?\d|win-a-case|#\d", re.I)
sel = [d for d in idx if MARK.search(d['name']) and (d['created'] or '') >= '2026-09-15']
have = {d['legend'] for d in sel}
for d in sorted(idx, key=lambda d: -(d['views'] or 0)):
    if d['legend'] not in have and (d['created'] or '') >= '2026-09-01':
        sel.append(d); have.add(d['legend'])
print(len(sel), 'decks selected', file=sys.stderr)
out = []
for d in sel:
    f = f"raw/deck-{d['id']}.html"
    url = f"https://piltoverarchive.com/decks/view/{d['id']}"
    r = subprocess.run(['curl', '-s', '--max-time', '40', '-A', 'Mozilla/5.0 (compatible; deck-research/1.0)', url, '-o', f, '-w', '%{http_code}'], capture_output=True, text=True)
    t = open(f, errors='ignore').read().replace('\\\\\\"', "''").replace('\\\\n', ' // ').replace('\\"', '"') if os.path.exists(f) else ''
    deck = dict(id=d['id'], url=url, name=d['name'], legend=d['legend'], legendCode=d['legendCode'], created=d['created'], views=d['views'], fetched='2026-11-11', http=r.stdout, sections={})
    # every deck card entry: {"deckId":..,"cardId":..,"variantId":..,"quantity":N,"card":{"id":..,"name":..,"types":[..],"type":..,"super":..,"description":..,"energy":..,"might":..,"power":..,"tags":..
    pat = re.compile(r'"deckId":"%s","cardId":"[^"]+","variantId":"[^"]*","quantity":(\d+),"card":\{"id":"[^"]+","name":"((?:[^"\\]|\\.)*)","types":\[[^\]]*\],"type":"([^"]*)","super":("[^"]*"|null),"description":("(?:[^"\\]|\\.)*"|null),"energy":(\d+|null),"might":(\d+|null),"power":(\d+|null),"tags":(\[[^\]]*\]|null)' % d['id'])
    # section boundaries by key position
    keys = [(m.start(), m.group(1)) for m in re.finditer(r'"([A-Za-z]+)":\[\{"deckId"', t)]
    for m in pat.finditer(t):
        sec = 'unknown'
        for pos, k in keys:
            if pos < m.start(): sec = k
        vm = re.search(r'"variantNumber":"([A-Z]{2,4}-[0-9A-Za-z*]+)"', t[m.end():m.end() + 1500])
        deck['sections'].setdefault(sec, []).append(dict(count=int(m.group(1)), name=json.loads('"' + m.group(2) + '"'), type=m.group(3), super=json.loads(m.group(4)), text=json.loads(m.group(5)), energy=json.loads(m.group(6)), might=json.loads(m.group(7)), power=json.loads(m.group(8)), tags=json.loads(m.group(9)), code=vm.group(1) if vm else None))
    out.append(deck)
    print(r.stdout, d['name'][:50], {k: sum(c['count'] for c in v) for k, v in deck['sections'].items()}, file=sys.stderr)
    json.dump(out, open('pa-decks-2026-11-11.json', 'w'), ensure_ascii=False, indent=0)
    if os.path.exists(f): os.remove(f)
    time.sleep(2.5)
