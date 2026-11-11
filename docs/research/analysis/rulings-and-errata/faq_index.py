#!/usr/bin/env python3
"""Machine index of every question/answer block in the five official FAQ articles (raw/*-faq.txt from extract.py).
A block starts at a bold line ending in '?' (FAQ-OGN: '**Q: ...**') and runs to the next bold question or heading.
Each block gets: article key, published date, section heading, question, answer, 'Relevant rules' numbers as printed
by the article (valid for the CR edition current when the article was published, NOT necessarily today's), and the
gallery cards named in question or answer. Output: out/faq-rulings.json (+ per-card map). Run: python3 -I faq_index.py"""
import re, os, sys, json
from collections import Counter, defaultdict
here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, here)
import gallery
gal = gallery.load()
man = {m['name']: m for m in json.load(open(os.path.join(here, 'manifest.json')))}
KEY = {'origins-faq': 'FAQ-OGN', 'spiritforged-faq': 'FAQ-SFD', 'unleashed-faq': 'FAQ-UNL', 'vendetta-faq': 'FAQ-VEN', 'radiance-faq': 'FAQ-RAD'}
SETORD = {'OGN': 0, 'OGS': 1, 'SFD': 2, 'UNL': 3, 'VEN': 4, 'RAD': 5}
def rank(x):
    c = x['publicCode']; return (0 if re.fullmatch(r'[A-Z]+-\d+/\d+', c) else 1, SETORD.get(x['set']['value']['id'], 9), x.get('collectorNumber') or 0)
names = {}
for x in sorted(gal, key=rank):
    ty = [t['id'] for t in (x['cardType'].get('type') or [])]
    if 'rune' in ty or not ty: continue
    fn = gallery.full_name(x)
    names.setdefault(fn, x['publicCode'])
# short champion names are ambiguous ("Draven" = 3 cards): only full names are matched, longest first
ordered = sorted(names, key=len, reverse=True)
STOP = {'Reflection', 'Gold', 'Recruit', 'Bomb', 'Sprite', 'Warhawk', 'Sand Soldier', 'Challenge', 'Charm', 'Flash', 'Reinforce', 'Salvage', 'Mobilize', 'Abandon', 'Possession', 'Discipline', 'Rebuttal', 'Defy', 'Imperial Decree'}
def cards_in(t):
    t = t.replace('’', "'").replace('ʼ', "'"); out = []
    for n in ordered:
        if len(n) < 5: continue
        for m in re.finditer(r'(?<![\w])' + re.escape(n) + r'(?![\w])', t):
            if n in STOP and not re.search(re.escape(n) + r"(?:'s)?(?= (?:is|reads|says|has|would|will|can|does|resolves|was|on|with|to|and|or|targeting|choosing)\b|[,.?)])", t[m.start():m.start() + len(n) + 14]): continue
            out.append(n); t = t[:m.start()] + ' ' * len(n) + t[m.end():]; break
    return sorted(set(out))
rows = []
for doc, key in KEY.items():
    txt = open(os.path.join(here, 'raw', doc + '.txt'), encoding='utf-8').read().split('\n')
    sec = ''; cur = None
    def flush():
        global cur
        if cur:
            a = '\n'.join(l for l in cur['a'] if l.strip() and l.strip() not in ('[img]', '—')).strip()
            rr = re.findall(r'\d{3}(?:\.[0-9a-z]+)*', ' '.join(re.findall(r'_?Relevant rules?:?_?\s*([^\n]*)', a, re.I)))
            rows.append(dict(id=f"{key}#{sum(1 for r in rows if r['source'] == key) + 1}", source=key, url=man[doc]['url'], published=man[doc]['published'][:10],
                             section=sec, question=cur['q'], answer=a, verdict=(re.match(r'\s*(Yes|No)\b', a) or [None, None])[1],
                             relevantRulesAsPrinted=sorted(set(r.rstrip('.') for r in rr)), cards=cards_in(cur['q'] + '\n' + a)))
        cur = None
    for l in txt[5:]:
        s = l.strip()
        h = re.match(r'#{1,6}\s+(.*)', s)
        if h: flush(); sec = re.sub(r'[*_]', '', h.group(1)).strip(); continue
        b = re.fullmatch(r'\*\*_?(?:Q:\s*)?(.+?\?)\s*_?\*\*\s*', s)
        if b: flush(); cur = dict(q=re.sub(r'[*_]', '', b.group(1)).strip(), a=[]); continue
        if cur is not None: cur['a'].append(l)
    flush()
bycard = defaultdict(list)
for r in rows:
    for c in r['cards']: bycard[c].append(r['id'])
out = dict(generated='2026-11-11', note='relevantRulesAsPrinted are numbers of the CR edition current at publication; only FAQ-RAD numbers are guaranteed valid for CR 2026-10-09',
           counts=dict(Counter(r['source'] for r in rows)), rulings=rows, byCard={c: dict(code=names[c], rulings=v) for c, v in sorted(bycard.items())})
json.dump(out, open(os.path.join(here, 'out', 'faq-rulings.json'), 'w'), indent=1, ensure_ascii=False)
print(out['counts'], 'total', len(rows), '| cards with at least one ruling', len(bycard), '| verdicts', Counter(r['verdict'] for r in rows), '| no card', sum(1 for r in rows if not r['cards']))
if '--list' in sys.argv:
    for r in rows: print(f"{r['id']:11} [{r['verdict'] or '-':3}] {r['question'][:170]} || {', '.join(r['cards'])[:90]}")
