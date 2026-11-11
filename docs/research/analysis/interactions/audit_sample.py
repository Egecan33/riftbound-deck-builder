#!/usr/bin/env python3
"""Draws the 40-edge hand-audit sample (deterministic, seed 40) and prints both cards' full rules text.
Stratum A: 20 edges from the 500 strongest specific edges. Stratum B: 20 from the remaining specific edges with strength >= 1.2.
At most 2 sampled edges per payoff card and 3 per rule per stratum, so one legend or rule cannot fill the sample.
Sample 1 (pre-suppression graph): EDGES=out-pre/edges.json python3 audit_sample.py > out/audit-sample.txt
Sample 2 (post-suppression graph): SEED=41 python3 audit_sample.py > out/audit-sample-2.txt ; verdicts are recorded by hand in audit-verdicts.json"""
import json, os, random, re
from collections import Counter
HERE = os.path.dirname(os.path.abspath(__file__))
GAMELAB = os.environ.get('GAMELAB', os.path.expanduser('~/github_repositories/GameLab'))
txt = {c['cardCode']: (c['name'], c['type'], c['energy'], c['might'], c['rulesText'] or '') for c in json.load(open(os.path.join(GAMELAB, 'data/cards/cards.json')))['cards']}
txt.update({c['code']: (c['name'], c['type'], c['energy'], c['might'], c['text']) for c in json.load(open(os.path.join(HERE, 'data/rad-cards.json')))['cards']})
E = [e for e in json.load(open(os.path.join(HERE, os.environ.get('EDGES', 'out/edges.json'))))['edges'] if e['cls'] == 'specific']
E.sort(key=lambda e: (-e['s'], e['a'], e['b'], e['rule']))
rnd = random.Random(int(os.environ.get('SEED', '40')))
def draw(pool, n):
    pool = pool[:]; rnd.shuffle(pool); out = []; pc = Counter(); rc = Counter()
    for e in pool:
        r = e['rule'].split(':')[0]
        if pc[e['b']] >= 2 or rc[r] >= 3: continue
        pc[e['b']] += 1; rc[r] += 1; out.append(e)
        if len(out) == n: break
    return out
A = draw(E[:500], 20); B = draw([e for e in E[500:] if e['s'] >= 1.2], 20)
strip = lambda t: re.sub(r'\([^()]*\)', '', t).replace('\n', ' / ')
for i, (st, e) in enumerate([('A', e) for e in A] + [('B', e) for e in B], 1):
    a, b = txt[e['a']], txt[e['b']]
    print(f"#{i} [{st}] s={e['s']} rule={e['rule']}\n  A {e['a']} {a[0]} ({a[1]}, E{a[2]}, M{a[3]}): {strip(a[4])}\n  B {e['b']} {b[0]} ({b[1]}, E{b[2]}, M{b[3]}): {strip(b[4])}")
