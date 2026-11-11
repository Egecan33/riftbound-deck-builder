#!/usr/bin/env python3
"""Parse the five official errata articles (raw/*-errata.txt, produced by extract.py) plus the hand-entered
FAQ-only errata (faq_only_errata.json), keep the latest event per card, and compare against every printing in the
official gallery snapshot. Output: out/errata.json, out/errata-table.md, out/errata-events.md.
Run: python3 -I build_errata.py"""
import re, json, os, sys, unicodedata
here = os.path.dirname(os.path.abspath(__file__))
GAL = os.path.join(here, '..', 'interactions', 'data', 'gallery-cards-2026-11-11.json')
DOCS = [('origins-errata', '2025-10-28'), ('spiritforged-errata', '2026-01-14'), ('unleashed-errata', '2026-04-03'),
        ('vendetta-errata', '2026-07-23'), ('radiance-errata', '2026-10-09')]
def clean(t):
    t = re.sub(r'\[img[^\]]*\]', '', t)
    t = t.replace('**', '').replace('▲', '')
    t = re.sub(r'^#+\s*$', '', t, flags=re.M)
    t = re.sub(r'_?Note: Text only differs[^\n]*', '', t)
    lines = [l.strip() for l in t.split('\n') if l.strip()]
    return '\n'.join(lines)
def norm(t):
    t = unicodedata.normalize('NFKC', t)
    t = t.replace('’', "'").replace('ʼ', "'").replace('‘', "'").replace('“', '"').replace('”', '"').replace('ˮ', '"').replace('—', '-').replace('–', '-')
    t = t.replace('[S]', '[M]').replace('[T]', '[E]').replace('[Exhaust]', '[E]').replace('[Might]', '[M]')
    t = re.sub(r'_', '', t)
    t = re.sub(r'\s+', ' ', t).strip().lower()
    t = re.sub(r'\s+([.,;:)])', r'\1', t)
    return t
def strip_reminder(t):
    return re.sub(r'\s+', ' ', re.sub(r'\([^()]*\)', '', t)).strip()
events = []
for doc, date in DOCS:
    txt = open(os.path.join(here, 'raw', doc + '.txt'), encoding='utf-8').read()
    url = re.search(r'^URL: (.*)$', txt, re.M).group(1)
    parts = re.split(r'^(#{1,2} .*)$', txt, flags=re.M)
    n = 0
    for i in range(1, len(parts), 2):
        head = re.sub(r'[#*_]', '', parts[i]).strip(); body = parts[i + 1]
        if 'NEW TEXT' not in body: continue
        m = re.search(r'\[NEW TEXT\](.*?)\[OLD TEXT\](.*)', body, re.S)
        n += 1
        events.append(dict(card=head.replace('’', "'"), doc=doc, id=f'{doc}-{n}', date=date, url=url, new=clean(m.group(1)), old=clean(m.group(2))))
faq_only = json.load(open(os.path.join(here, 'faq_only_errata.json'))) if os.path.exists(os.path.join(here, 'faq_only_errata.json')) else []
events += faq_only
events.sort(key=lambda e: e['date'])
latest = {}
hist = {}
for e in events:
    hist.setdefault(e['card'], []).append(e)
    latest[e['card']] = e  # later date wins; a same-day duplicate keeps the later-listed doc
gal = json.load(open(GAL))
def gtext(x):
    at = x['cardImage'].get('accessibilityText') or ''
    at = re.sub(r'^Riftbound [^:]*: [^.]*?\. ', '', at, count=1) if at.startswith('Riftbound') else at
    return at
def fullname(x):
    at = x['cardImage'].get('accessibilityText') or ''
    m = re.match(r'Riftbound [^:]+: (.*)', at, re.S)
    return m.group(1) if m else x['name']
ALIAS = {'Leblanc, Deceiver': 'Deceiver'}
def find(card):
    c = ALIAS.get(card, card)
    out = []
    for x in gal:
        fn = fullname(x).replace('’', "'")
        if fn.startswith(c + '.') or fn == c or (x['name'].replace('’', "'") == c and not fn.startswith(c + ',')): out.append((x, fn[len(c) + 1:].strip() if fn.startswith(c + '.') else ''))
    return out
rows = []
for card, e in sorted(latest.items()):
    pr_out = []
    for x, g in find(card):
        ng, nn, no = norm(g), norm(e['new']), norm(e['old'])
        st = 'NEW' if ng == nn else 'OLD' if ng == no else 'NEW~' if norm(strip_reminder(g)) == norm(strip_reminder(e['new'])) else 'OLD~' if norm(strip_reminder(g)) == norm(strip_reminder(e['old'])) else 'OTHER'
        pr_out.append(dict(code=x['publicCode'], id=x['id'], set=x['set']['value']['id'], status=st, gallery_text=g))
    sts = {p['status'][:3] for p in pr_out}
    overall = 'NOT IN GALLERY' if not pr_out else 'reflects errata' if sts == {'NEW'} else 'printed text (stale)' if sts == {'OLD'} else 'mixed' if sts <= {'NEW', 'OLD'} else 'differs from both'
    rows.append(dict(card=card, errata=e, history=[h['id'] for h in hist[card]], printings=pr_out, gallery=overall))
os.makedirs(os.path.join(here, 'out'), exist_ok=True)
json.dump(dict(generated='2026-11-11', gallery_snapshot='2026-11-11', events=len(events), cards=len(rows), rows=rows), open(os.path.join(here, 'out', 'errata.json'), 'w'), indent=1, ensure_ascii=False)
from collections import Counter
print('events', len(events), 'cards', len(rows), Counter(r['gallery'] for r in rows))
for r in rows:
    if r['gallery'] in ('differs from both', 'NOT IN GALLERY', 'mixed'):
        print('\n##', r['card'], r['gallery'], r['errata']['id'])
        print(' NEW:', r['errata']['new'].replace('\n', ' / ')); print(' OLD:', r['errata']['old'].replace('\n', ' / '))
        for p in r['printings']: print('  ', p['code'], p['status'], '|', p['gallery_text'].replace('\n', ' / '))
def cell(t): return t.replace('\n', ' / ').replace('|', '\\|')
with open(os.path.join(here, 'out', 'errata-table.md'), 'w') as f:
    f.write('| Card | Printings (gallery status) | Printed (old) text | Current (errata) text | Effective | Source |\n|---|---|---|---|---|---|\n')
    for r in rows:
        e = r['errata']
        prs = ', '.join(f"{p['code']} {p['status']}" for p in r['printings']) or '(none)'
        f.write(f"| {r['card']} | {prs} | {cell(e['old'])} | {cell(e['new'])} | {e['date']} | `{e['id']}`{' (history: ' + ', '.join(r['history']) + ')' if len(r['history']) > 1 else ''} |\n")
