#!/usr/bin/env python3
"""Prototype: deck-specific lines, 'one card away' suggestions and nonbos from the interaction graph.

Inputs (read-only): out/edges.json, out/facets.json, out/structures.json (build_graph.py), ../raw/pa-decks.jsonl (Piltover Archive, 2026-11-11).
Usage:  python3 lines.py <deck-id-or-name-substring> [<second deck> ...]     (no argument: three default decks)
Everything printed is assembled from graph edges; each sentence is an edge's stored reason, so it names both cards and quotes their text.
HEURISTIC parts are marked in comments. Deterministic (no randomness, ties broken on card codes).
"""
import json, os, re, sys, math
from collections import defaultdict, Counter
from itertools import combinations

HERE = os.path.dirname(os.path.abspath(__file__))
F = json.load(open(os.path.join(HERE, 'out/facets.json')))
G = json.load(open(os.path.join(HERE, 'out/edges.json')))
S = json.load(open(os.path.join(HERE, 'out/structures.json')))
EDGES = [e for e in G['edges'] if e['cls'] == 'specific']
NONBOS = G['nonbos']

def nkey(s): return re.sub(r'[^a-z0-9]', '', (s or '').lower())
BY_NAME = {}
for code in sorted(F):
    BY_NAME.setdefault(nkey(F[code]['name']), code)
    BY_NAME.setdefault(nkey(re.sub(r' - Starter$', '', F[code]['name'])), code)
def canon(x):
    n = x.get('name') or ''
    for cand in (n, n.split(', ', 1)[-1]):          # PA writes legends as "<Champion>, <Legend name>"
        if nkey(cand) in BY_NAME: return BY_NAME[nkey(cand)]
    return None

def load_decks():
    out = []
    for line in open(os.path.join(HERE, '../raw/pa-decks.jsonl')):
        d = json.loads(line)
        leg = canon(d['legend'])
        if not leg or F[leg]['type'] != 'legend': continue
        cards = {}
        for zone in ('champions', 'main', 'battlefields'):
            for x in d.get(zone) or []:
                c = canon(x)
                if c: cards[c] = cards.get(c, 0) + (x.get('q') or 1)
        cards[leg] = 1
        out.append(dict(id=d['id'], name=d['name'], legend=leg, cards=cards))
    return out
DECKS = load_decks()
# how many corpus decks hold both ends of an edge, per legend (used for the distinctiveness weight)
PAIR_DECKS = Counter(); LEG_OF = defaultdict(set)
for d in DECKS:
    for a, b in combinations(sorted(d['cards']), 2):
        PAIR_DECKS[(a, b)] += 1; LEG_OF[(a, b)].add(d['legend'])

def nm(c): return f"{F[c]['name']} ({c})"

def analyse(deck, k=6):
    cards = deck['cards']; L = deck['legend']
    inn = [e for e in EDGES if e['a'] in cards and e['b'] in cards]
    # HEURISTIC weight: strength x copies factor x distinctiveness (pairs that every legend's decks contain say little about THIS deck)
    def w(e):
        key = tuple(sorted((e['a'], e['b'])))
        other = len(LEG_OF.get(key, set()) - {L})
        copies = min(cards[e['a']], 3) + min(cards[e['b']], 3)
        return e['s'] * (0.7 + 0.1 * copies) / (1 + 0.25 * other)
    out_of = defaultdict(list)
    for e in inn: out_of[e['a']].append(e)
    lines = []
    for e1 in inn:
        for e2 in out_of.get(e1['b'], []):
            if e2['b'] in (e1['a'], e1['b']): continue
            chained = e1['abB'] is not None and e1['abB'] == e2['abA']      # the ability e1 switches on is the one that feeds e2
            lines.append(dict(kind='chain' if chained else 'pivot', cards=[e1['a'], e1['b'], e2['b']], rules=[e1['rule'], e2['rule']],
                              score=round((w(e1) + w(e2)) * (1.3 if chained else 1.0), 2), steps=[e1['reason'], e2['reason']]))
    for e in inn:   # two-card lines keep decks with a short graph from producing nothing
        lines.append(dict(kind='pair', cards=[e['a'], e['b']], rules=[e['rule']], score=round(w(e) * 1.2, 2), steps=[e['reason']]))
    for l in S['loops']:
        if all(c in cards for c in l['cards']) and l['kind'] in ('mutual', 'refund', 'self-replay'):
            if l['kind'] == 'refund' and l.get('net') != 'positive': continue
            lines.append(dict(kind='loop:' + l['kind'], cards=l['cards'], rules=['loop:' + l['kind']], score=round((l.get('strength') or 2.0) * 2.0, 2), steps=[l['line']],
                              needs=l.get('needs'), closers_in_deck=[c for c in l.get('closers', []) if c in cards]))
    lines.sort(key=lambda x: (-x['score'], x['cards']))
    picked = []; used_rules = Counter(); used_cards = Counter()
    for ln in lines:                                   # diversity: a line may share at most one card with any picked line; a rule family appears at most twice
        fam = tuple(r.split(':')[0] for r in ln['rules'])
        if any(len(set(ln['cards']) & set(p['cards'])) > 1 for p in picked): continue
        if any(used_rules[r] >= 2 for r in fam): continue
        picked.append(ln)
        for r in fam: used_rules[r] += 1
        if len(picked) == k: break
    # one card away: score of a candidate = sum of specific edge strengths between it and the cards already in the deck
    ldom = set(F[L]['domains']); add = defaultdict(lambda: [0.0, []])
    for e in EDGES:
        for x, y in ((e['a'], e['b']), (e['b'], e['a'])):
            if y in cards and x not in cards and F[x]['type'] in ('unit', 'spell', 'gear') and set(F[x]['domains']) <= ldom:
                add[x][0] += e['s'] * min(cards[y], 3) / 3; add[x][1].append((e['s'], e['reason']))
    away = sorted(((round(v[0], 2), c, sorted(v[1], key=lambda t: (-t[0], t[1]))[:2]) for c, v in add.items()), key=lambda t: (-t[0], t[1]))[:5]
    nb = [n for n in NONBOS if n['a'] in cards and n['b'] in cards]
    return dict(n_edges=len(inn), density=round(sum(e['s'] for e in inn), 1), lines=picked, away=away, nonbos=nb, n_candidates=len(lines))

def find(q):
    for d in DECKS:
        if d['id'] == q: return d
    for d in DECKS:
        if q.lower() in d['name'].lower(): return d
    for d in DECKS:
        if q.lower() in F[d['legend']]['name'].lower(): return d
    raise SystemExit('no deck matches ' + q)

def show(deck, res):
    print(f"\n=== {deck['name']}  [{nm(deck['legend'])}]  https://piltoverarchive.com/decks/view/{deck['id']}")
    print(f"    {len(deck['cards'])} distinct cards, {res['n_edges']} specific edges inside the deck (sum of strength {res['density']}), {res['n_candidates']} candidate lines")
    for i, ln in enumerate(res['lines'], 1):
        print(f"  LINE {i} [{ln['kind']}, score {ln['score']}]: " + ' -> '.join(nm(c) for c in ln['cards']))
        for s in ln['steps']: print('      - ' + s)
        if ln.get('needs'): print('      needs: ' + '; '.join(ln['needs']) + (' | in this deck: ' + ', '.join(nm(c) for c in ln['closers_in_deck']) if ln.get('closers_in_deck') else ' | no closer in this deck'))
    print('  ONE CARD AWAY (not in the list, legal in the legend\'s domains; bans not applied here):')
    for sc, c, why in res['away']:
        print(f"    +{sc} {nm(c)}"); [print('        - ' + r) for _, r in why]
    print(f"  NONBOS inside the deck: {len(res['nonbos'])}")
    for n in res['nonbos'][:3]: print('      ! ' + n['reason'])

if __name__ == '__main__':
    qs = sys.argv[1:] or ['Stuttgart Viktor', 'Daughter of the Void', 'Blade Dancer']
    results = []
    for q in qs:
        d = find(q); r = analyse(d); show(d, r); results.append((d, r))
    print('\n=== overlap between the line sets (Jaccard on card sets / on rule sequences)')
    for (d1, r1), (d2, r2) in combinations(results, 2):
        c1 = {c for l in r1['lines'] for c in l['cards']}; c2 = {c for l in r2['lines'] for c in l['cards']}
        q1 = {tuple(l['rules']) for l in r1['lines']}; q2 = {tuple(l['rules']) for l in r2['lines']}
        j = lambda a, b: round(len(a & b) / len(a | b), 2) if a | b else 0.0
        print(f"  {d1['name']} vs {d2['name']}: cards {j(c1, c2)}, rule sequences {j(q1, q2)}")
    # corpus-wide check: do two decks of DIFFERENT legends ever get the same top line? and how different are same-legend decks?
    if '--corpus' in sys.argv or len(sys.argv) == 1:
        top = [(d, analyse(d, k=5)) for d in DECKS]
        sig = lambda r: frozenset(tuple(l['cards']) for l in r['lines'])
        diff = same = 0; nd = ns = 0; jd = []; js = []
        for (d1, r1), (d2, r2) in combinations(top, 2):
            if set(d1['cards']) == set(d2['cards']): continue
            a, b = sig(r1), sig(r2)
            if not a or not b: continue
            jj = len(a & b) / len(a | b)
            if d1['legend'] == d2['legend']: ns += 1; js.append(jj); same += a == b
            else: nd += 1; jd.append(jj); diff += a == b
        mean = lambda x: round(sum(x) / len(x), 3) if x else None
        print(f"\n=== corpus ({len(top)} decks, top-5 lines each): decks with zero lines {sum(1 for _, r in top if not r['lines'])}")
        print(f"  different-legend deck pairs {nd}: identical line sets {diff}, mean Jaccard of line sets {mean(jd)}")
        print(f"  same-legend, different-list deck pairs {ns}: identical line sets {same}, mean Jaccard of line sets {mean(js)}")
