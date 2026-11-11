#!/usr/bin/env python3
"""Third official text source: the Core Rules quote card text in their examples ('X reads "..."').
Extract those quotes from the cached CR 2026-10-09, match each to the gallery card it names, and classify the quote:
 gallery   = substring of a gallery printing's text (after normalisation)
 errata    = substring of the errata 'new' text but of no gallery printing  -> CR confirms the erratum
 old       = substring of the errata 'old' text only                        -> CR still quotes pre-errata text
 neither   = differs from all (paraphrase, template drift, or silent errata) -> review by hand
Output: out/cr-quotes.json. Run: python3 -I cr_quotes.py"""
import re, os, sys, json
from collections import Counter, defaultdict
here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, here)
import gallery
gal = gallery.load()
err = {r['card']: r['errata'] for r in json.load(open(os.path.join(here, 'out', 'errata.json')))['rows']}
ALIAS = {'Deceiver': 'Leblanc, Deceiver'}
def kw(t):
    # the CR writes keywords without brackets and 'might' for [M]; compare bracket-insensitively
    t = re.sub(r'\[([a-z][a-z\- ]*\d*)\]', r'\1', t).replace('[m]', 'might').replace('[>]', ' - ')
    return re.sub(r'\s+', ' ', re.sub(r'\s*[-—]\s*', ' - ', t)).strip()
cards = defaultdict(list)
for x in gal:
    t = gallery.alt_text(x) + ' ' + gallery.rich_text(x) + ' ' + gallery.rich_text(x, 'effect')
    fn = gallery.full_name(x)
    cards[fn].append((x['publicCode'], kw(gallery.norm(t))))
names = sorted(cards, key=len, reverse=True)
def nq(t):
    t = gallery.norm(t)
    t = re.sub(r'^\.\.\.|\.\.\.$|…', '', t).strip()
    return kw(t)
rows = []; lines = open(os.path.join(here, '..', 'raw', 'core-rules-2026-10-09.compact.txt'), encoding='utf-8').read().split('\n')
for ln in lines:
    m0 = re.match(r'\s*(\d{3}(?:\.[0-9a-z]+)*)\.\s', ln)
    if not m0: continue
    rule = m0.group(1); taken = []
    if '“' not in ln: continue
    ln = ln.replace('’', "'")
    for name in names:
        if name not in ln: continue
        for m in re.finditer(re.escape(name) + r'(?![\w])([^“”]{0,110}?)“([^”]{12,})”', ln.replace('’', "'")):
            if any(a <= m.start() < b for a, b in taken): continue
            mid = m.group(1)
            if not re.search(r'read|say|has|ability|text|with', mid): continue
            taken.append((m.start(), m.end()))
            q = nq(m.group(2)); qs = gallery.strip_reminder(q)
            prs = cards[name]
            hit = [c for c, t in prs if q in t or qs in gallery.strip_reminder(t)]
            e = err.get(ALIAS.get(name, name))
            en = e and (q in kw(gallery.norm(e['new'])) or qs in gallery.strip_reminder(kw(gallery.norm(e['new']))))
            eo = e and (q in kw(gallery.norm(e['old'])) or qs in gallery.strip_reminder(kw(gallery.norm(e['old']))))
            if e: cls = 'errata' if en and not eo else 'old' if eo and not en else 'both' if en and eo else 'neither'
            else: cls = 'gallery' if hit else 'neither'
            rows.append(dict(rule=rule, card=name, has_errata=bool(e), cls=cls, gallery_printings_matching=hit, all_printings=[c for c, _ in prs], quote=m.group(2)))
json.dump(rows, open(os.path.join(here, 'out', 'cr-quotes.json'), 'w'), indent=1, ensure_ascii=False)
print(len(rows), 'quotes;', len({r['card'] for r in rows}), 'cards;', Counter((r['has_errata'], r['cls']) for r in rows))
for r in rows:
    if r['has_errata'] or r['cls'] == 'neither':
        print(f"\n[{r['cls']}{' ERRATA-CARD' if r['has_errata'] else ''}] CR {r['rule']} {r['card']} {r['all_printings'][:3]} match={r['gallery_printings_matching'][:3]}\n   CR: {r['quote'][:400]}")
        if r['cls'] == 'neither' and not r['has_errata']:
            print('   GAL:', cards[r['card']][0][1][:400])
