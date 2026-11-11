"""HEURISTIC matchup estimate from deck properties, Radiance-era lists. No win-rate data is used to build it;
validate() compares it with the few legend-vs-legend cells that riftbound.gg articles quoted in prose."""
from lg2_data import *

_D = None
_F = {}
FEATS = ('speed', 'spot', 'sweep', 'counter', 'wide', 'tall', 'reach', 'protect', 'spellrel')


def decks():
    global _D
    if _D is None:
        _D = [d for d in load_decks() if d.era == 'RAD']
    return _D


def raw_features(d):
    f = collections.Counter()
    mights = []
    items = list(d.lib.items()) + [(d.champ['name'], 1)]
    for n, q in items:
        c, cl = d.card[n], d.cls[n]
        if c['type'] == 'unit':
            f['wide'] += q
            mights += [M(c)] * q
            if need(c) <= 2:
                f['speed'] += q
            elif need(c) == 3:
                f['speed'] += 0.5 * q
            if 'haste' in cl:
                f['speed'] += q
        if 'token' in cl:
            f['wide'] += q
        if 'sweeper' in cl:
            f['sweep'] += q
        elif {'removal', 'stun', 'displace'} & cl:
            f['spot'] += q
        if 'counter' in cl:
            f['counter'] += q
        if {'ganking', 'haste', 'ready', 'ready_self', 't_ambush'} & cl:
            f['reach'] += q
        if {'protect', 'deflect'} & cl:
            f['protect'] += q
        if {'pump', 'buff'} & cl:
            f['tall'] += 0.25 * q
        if c['type'] == 'spell' and need(c) >= 3:
            f['spellrel'] += q
    mights.sort(reverse=True)
    f['tall'] += sum(mights[:6]) / max(1, len(mights[:6]))
    return f


def features(d):
    """Percentile rank (0..1) of each raw feature among all Radiance-era lists."""
    if not _F:
        raws = {x.id: raw_features(x) for x in decks()}
        for k in FEATS:
            vals = sorted(r[k] for r in raws.values())
            for i, r in raws.items():
                below = sum(1 for v in vals if v < r[k])
                equal = sum(1 for v in vals if v == r[k])
                _F.setdefault(i, {})[k] = (below + 0.5 * equal) / len(vals)
    if d.id not in _F:
        raws = raw_features(d)
        allr = [raw_features(x) for x in decks()]
        _F[d.id] = {k: (sum(1 for r in allr if r[k] < raws[k]) + 0.5 * sum(1 for r in allr if r[k] == raws[k])) / len(allr) for k in FEATS}
    return _F[d.id]


WEIGHTS = (('wide vs sweepers', -6.0), ('tall vs spot removal', -6.0), ('protection vs spot removal', 4.0),
           ('speed vs interaction', 5.0), ('reach', 3.0), ('counters vs key spells', 4.0))


def term_vector(a, b):
    A_, B_ = features(a), features(b)
    ia, ib = (A_['spot'] + A_['sweep']) / 2, (B_['spot'] + B_['sweep']) / 2
    return (A_['wide'] * B_['sweep'] - B_['wide'] * A_['sweep'],
            A_['tall'] * B_['spot'] - B_['tall'] * A_['spot'],
            A_['protect'] * B_['spot'] - B_['protect'] * A_['spot'],
            A_['speed'] * (1 - ib) - B_['speed'] * (1 - ia),
            A_['reach'] - B_['reach'],
            A_['counter'] * B_['spellrel'] - B_['counter'] * A_['spellrel'])


def estimate(a, b, weights=None):
    w = weights or [x[1] for x in WEIGHTS]
    tv = term_vector(a, b)
    terms = [(WEIGHTS[i][0], w[i] * tv[i]) for i in range(6)]
    edge = max(-20.0, min(20.0, sum(v for _, v in terms)))
    return 50 + edge, terms


def estimate_vs_legend(a, legend, weights=None):
    opp = [d for d in decks() if d.legend_short == legend and d.id != a.id]
    if not opp:
        return 50.0, [], 0
    acc = collections.Counter()
    tot = 0.0
    for b in opp:
        e, terms = estimate(a, b, weights)
        tot += e
        for k, v in terms:
            acc[k] += v
    n = len(opp)
    return tot / n, [(k, acc[k] / n) for k, _ in WEIGHTS], n


def legend_vs_legend(la, lb, weights=None):
    A_ = [d for d in decks() if d.legend_short == la]
    B_ = [d for d in decks() if d.legend_short == lb]
    if not A_ or not B_:
        return None, None
    vec = [0.0] * 6
    for a in A_:
        for b in B_:
            tv = term_vector(a, b)
            for i in range(6):
                vec[i] += tv[i]
    vec = [v / (len(A_) * len(B_)) for v in vec]
    w = weights or [x[1] for x in WEIGHTS]
    return 50 + max(-20, min(20, sum(w[i] * vec[i] for i in range(6)))), vec


# Cells quoted in prose by riftbound.gg (week-2 tier list 2026-11-06; Kennen guide 2026-11-09); row legend's win rate.
CELLS = [('Riven', "Kai'Sa", 53), ('Kennen', 'Riven', 49.5), ('Jayce', 'Riven', 64), ("Kai'Sa", 'Kennen', 52), ('Rengar', 'Riven', 31),
         ('Rengar', 'Kennen', 28), ('Akali', 'Kennen', 53), ('Kennen', 'Jayce', 73), ('Kennen', "Rek'Sai", 45)]


def solve(Am, y, lam):
    """Ridge least squares by Gaussian elimination (no numpy)."""
    k = len(Am[0])
    G = [[sum(r[i] * r[j] for r in Am) + (lam if i == j else 0) for j in range(k)] for i in range(k)]
    v = [sum(r[i] * yy for r, yy in zip(Am, y)) for i in range(k)]
    for i in range(k):
        piv = max(range(i, k), key=lambda r: abs(G[r][i]))
        G[i], G[piv] = G[piv], G[i]
        v[i], v[piv] = v[piv], v[i]
        for r in range(i + 1, k):
            f = G[r][i] / G[i][i]
            for c in range(i, k):
                G[r][c] -= f * G[i][c]
            v[r] -= f * v[i]
    x = [0.0] * k
    for i in reversed(range(k)):
        x[i] = (v[i] - sum(G[i][c] * x[c] for c in range(i + 1, k))) / G[i][i]
    return x


def validate():
    rows, X, Y = [], [], []
    for a, b, wr in CELLS:
        est, vec = legend_vs_legend(a, b)
        if est is None:
            continue
        na = sum(1 for d in decks() if d.legend_short == a)
        nb = sum(1 for d in decks() if d.legend_short == b)
        rows.append((a, b, wr, est, na, nb))
        X.append(vec)
        Y.append(wr - 50)
    print('row | col | published | estimate (hand weights) | lists row/col | same side of 50')
    agree = dec = 0
    for a, b, wr, est, na, nb in rows:
        s = '-' if abs(wr - 50) < 2.5 else ('yes' if (wr - 50) * (est - 50) > 0 else 'NO')
        if s != '-':
            dec += 1
            agree += s == 'yes'
        print(f'{a} | {b} | {wr} | {est:.1f} | {na}/{nb} | {s}')
    n = len(rows)
    mae_hand = sum(abs(r[2] - r[3]) for r in rows) / n
    mae_50 = sum(abs(r[2] - 50) for r in rows) / n
    print(f'cells={n}; sign agreement on cells at least 2.5 points from 50: {agree}/{dec}; MAE hand weights {mae_hand:.1f}, MAE of always-50 {mae_50:.1f}')
    my = sum(Y) / n
    ex = [r[3] - 50 for r in rows]
    mx = sum(ex) / n
    den = (sum((e - mx) ** 2 for e in ex) * sum((y - my) ** 2 for y in Y)) ** 0.5
    print(f'Pearson r(estimate, published) = {sum((e - mx) * (y - my) for e, y in zip(ex, Y)) / den:.2f}' if den else 'r undefined')
    # leave-one-out ridge fit of the six weights on the published cells (each cell also used mirrored)
    errs = []
    for i in range(n):
        Xt = [X[j] for j in range(n) if j != i] + [[-v for v in X[j]] for j in range(n) if j != i]
        Yt = [Y[j] for j in range(n) if j != i] + [-Y[j] for j in range(n) if j != i]
        w = solve(Xt, Yt, 0.05)
        pred = sum(w[k] * X[i][k] for k in range(6))
        errs.append(abs(pred - Y[i]))
    print(f'leave-one-out ridge fit (lambda 0.05) of the six weights on these cells: MAE {sum(errs) / n:.1f} (always-50: {mae_50:.1f})')
    w = solve(X + [[-v for v in r] for r in X], Y + [-y for y in Y], 0.05)
    print('weights fitted on all cells: ' + ', '.join(f'{WEIGHTS[k][0]} {w[k]:+.1f}' for k in range(6)))
    ests = []
    legs = sorted({d.legend_short for d in decks()})
    for a in legs:
        for b in legs:
            if a < b:
                e, _ = legend_vs_legend(a, b)
                ests.append(e)
    ests.sort()
    print(f'spread of the hand-weight estimate over all {len(ests)} legend pairs: min {ests[0]:.1f}, median {ests[len(ests) // 2]:.1f}, max {ests[-1]:.1f}')


if __name__ == '__main__':
    validate()
