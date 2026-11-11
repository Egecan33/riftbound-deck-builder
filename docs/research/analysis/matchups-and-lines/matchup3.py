"""Validate computed matchup estimates against the aggregated riftbound.org matrix (out/matrix.json, built by matrix.py).
Estimators, all per legend pair, averaged over our Radiance-era Piltover Archive lists of both legends:
  hand   : matchup2.estimate with the hand weights (HEURISTIC, no win data used)
  fit    : the same six terms with weights fitted by ridge least squares, leave-one-pair-out (uses win data)
  answer : net rune-weighted answer coverage from linegen2 (covered(A->B) - covered(B->A)), scaled (HEURISTIC)
  bt     : Bradley-Terry legend strength fitted on the matrix, leave-one-pair-out (pure DATA, no deck property)"""
import json, os, math, collections, sys
import matchup2 as M2
from lg2_data import *
HERE = os.path.dirname(os.path.abspath(__file__))
KEY = {'riven': 'Riven', 'kaisa': "Kai'Sa", 'kennen': 'Kennen', 'rengar': 'Rengar', 'master-yi-wuju-bladesman': 'Master Yi', 'reksai': "Rek'Sai",
       'viktor': 'Viktor', 'jayce': 'Jayce', 'akali': 'Akali', 'irelia': 'Irelia', 'vex': 'Vex', 'leblanc': 'LeBlanc', 'lillia': 'Lillia',
       'khazix': "Kha'Zix", 'azir': 'Azir', 'ornn': 'Ornn', 'evelynn': 'Evelynn', 'orianna': 'Orianna', 'diana': 'Diana', 'mordekaiser': 'Mordekaiser',
       'sett': 'Sett', 'ekko': 'Ekko', 'seraphine': 'Seraphine', 'shen': 'Shen', 'ivern': 'Ivern'}
def short(k):
    for p, v in KEY.items():
        if k.startswith(p): return v
    return None
cells = []
for c in json.load(open(os.path.join(HERE, 'out', 'matrix.json')))['cells']:
    a, b = short(c['a']), short(c['b'])
    n = c['w'] + c['l'] + c['d']
    if a and b and n >= int(os.environ.get('MIN_N', 30)):
        wr = 100 * (c['w'] + c['d'] / 2) / n
        if a > b: a, b, wr = b, a, 100 - wr
        cells.append((a, b, wr, n))
have = collections.Counter(d.legend_short for d in M2.decks())
cells = [c for c in cells if have[c[0]] >= 3 and have[c[1]] >= 3]
print('cells with n>=30 and at least 3 lists per legend:', len(cells), 'matches', sum(c[3] for c in cells))

def wstats(est, label):
    y = [c[2] - 50 for c in cells]; w = [c[3] for c in cells]; e = [x - 50 for x in est]
    W = sum(w); my = sum(a*b for a, b in zip(w, y))/W; me = sum(a*b for a, b in zip(w, e))/W
    cov = sum(wi*(ei-me)*(yi-my) for wi, ei, yi in zip(w, e, y)); ve = sum(wi*(ei-me)**2 for wi, ei in zip(w, e)); vy = sum(wi*(yi-my)**2 for wi, yi in zip(w, y))
    r = cov/math.sqrt(ve*vy) if ve*vy > 0 else float('nan')
    mae = sum(wi*abs(ei-yi) for wi, ei, yi in zip(w, e, y))/W; mae0 = sum(wi*abs(yi) for wi, yi in zip(w, y))/W
    # unweighted on cells whose published rate is at least 5 points from 50
    big = [(ei, yi) for ei, yi, c in zip(e, y, cells) if abs(yi) > 196*math.sqrt(0.25/c[3])]
    sg = sum(1 for ei, yi in big if ei*yi > 0)
    ur = None
    n = len(y); uy = sum(y)/n; ue = sum(e)/n
    d = math.sqrt(sum((a-ue)**2 for a in e)*sum((b-uy)**2 for b in y))
    ur = sum((a-ue)*(b-uy) for a, b in zip(e, y))/d if d else float('nan')
    print(f'{label:7s} weighted r {r:+.2f} | unweighted r {ur:+.2f} | weighted MAE {mae:.1f} (always-50: {mae0:.1f}) | sign on cells whose 95% interval excludes 50: {sg}/{len(big)}')

hand, vecs = [], []
for a, b, wr, n in cells:
    e, v = M2.legend_vs_legend(a, b); hand.append(e); vecs.append(v)
wstats(hand, 'hand')
# leave-one-pair-out ridge fit, weighted by sqrt(n)
fit = []
for i in range(len(cells)):
    X, Y = [], []
    for j in range(len(cells)):
        if j == i: continue
        s = math.sqrt(cells[j][3])
        X += [[s*v for v in vecs[j]], [-s*v for v in vecs[j]]]; Y += [s*(cells[j][2]-50), -s*(cells[j][2]-50)]
    w = M2.solve(X, Y, 5.0)
    fit.append(50 + sum(w[k]*vecs[i][k] for k in range(6)))
wstats(fit, 'fit')
X, Y = [], []
for j in range(len(cells)):
    s = math.sqrt(cells[j][3]); X += [[s*v for v in vecs[j]], [-s*v for v in vecs[j]]]; Y += [s*(cells[j][2]-50), -s*(cells[j][2]-50)]
w = M2.solve(X, Y, 5.0)
print('  weights fitted on all cells (ridge 5.0): ' + ', '.join(f'{M2.WEIGHTS[k][0]} {w[k]:+.1f}' for k in range(6)))
# answer-coverage estimator
import linegen2 as L
def cov_total(la, lb):
    pa, pb = L.prof(la)['main'], L.prof(lb)['main']
    return sum(q * L.covered(NAME[n], pb)[0] for n, q in pa.items() if n in NAME)
ans_raw = [cov_total(a, b) - cov_total(b, a) for a, b, wr, n in cells]
sc = max(abs(x) for x in ans_raw) or 1
ans = [50 + 10 * x / sc for x in ans_raw]
wstats(ans, 'answer')
# Bradley-Terry leave-one-pair-out
def bt(train):
    """Bradley-Terry by the MM iteration; 1 pseudo-match of 0.5 wins against every other legend keeps strengths finite."""
    legs = sorted({x for c in train for x in c[:2]}); p = {l: 1.0 for l in legs}
    wins = collections.Counter(); nn = collections.Counter()
    for a, b, wr, n in train:
        wins[a] += n*wr/100; wins[b] += n*(1-wr/100); nn[(a, b)] += n; nn[(b, a)] += n
    for a in legs:
        for b in legs:
            if a != b: wins[a] += 0.5; nn[(a, b)] += 1
    for _ in range(500):
        q = {}
        for a in legs:
            den = sum(nn[(a, b)]/(p[a]+p[b]) for b in legs if b != a)
            q[a] = wins[a]/den if den else p[a]
        g = math.exp(sum(math.log(v) for v in q.values())/len(q)); p = {l: v/g for l, v in q.items()}
    return {l: math.log(v) for l, v in p.items()}
btp = []
for i, (a, b, wr, n) in enumerate(cells):
    s = bt([c for j, c in enumerate(cells) if j != i])
    btp.append(100/(1+math.exp(-(s.get(a, 0)-s.get(b, 0)))))
wstats(btp, 'bt')
s = bt(cells)
print('  Bradley-Terry strengths (all cells): ' + ', '.join(f'{l} {v:+.2f}' for l, v in sorted(s.items(), key=lambda x: -x[1])))
print('A | B | n | measured | hand | fit(LOO) | answer | bt(LOO)')
for (a, b, wr, n), h, f, an, t in zip(cells, hand, fit, ans, btp):
    print(f'{a} | {b} | {n} | {wr:.1f} | {h:.1f} | {f:.1f} | {an:.1f} | {t:.1f}')
