"""Aggregate the riftbound.org per-tournament matchup cells (raw/rorg-matchups.json) into one legend-vs-legend matrix.
Mirror cells dropped; a draw counts half; Wilson 95% interval; shrunk rate = (w + d/2 + 10) / (n + 20)."""
import json, os, math, collections
HERE = os.path.dirname(os.path.abspath(__file__))
J = json.load(open(os.path.join(HERE, 'raw', 'rorg-matchups.json')))

def wilson(p, n, z=1.96):
    if not n: return (0, 1)
    d = 1 + z*z/n; c = p + z*z/(2*n); s = z*math.sqrt(p*(1-p)/n + z*z/(4*n*n))
    return ((c - s)/d, (c + s)/d)

def aggregate(fmt='Constructed'):
    cell = collections.defaultdict(lambda: [0, 0, 0]); players = collections.Counter(); used = []
    for t in J['tournaments']:
        if fmt and t.get('format') != fmt: continue
        used.append(t)
        for f in t['field']: players[f['key']] += f['players'] or 0
        for a, row in t['cells'].items():
            for b, c in row.items():
                if a == b: continue
                x = cell[(a, b)]; x[0] += c['wins']; x[1] += c['losses']; x[2] += c['draws']
    return cell, players, used

def short(k):
    return k.split('-')[0].replace('kaisa', "Kai'Sa").replace('reksai', "Rek'Sai").title().replace("Kai'Sa".title(), "Kai'Sa").replace("Rek'Sai".title(), "Rek'Sai")

if __name__ == '__main__':
    fm = collections.Counter(t.get('format') for t in J['tournaments'])
    print('formats', dict(fm))
    cell, players, used = aggregate()
    print('tournaments used', len(used), 'matches', sum(t['matches'] or 0 for t in used), 'players', sum(t['players'] or 0 for t in used))
    tot = sum(players.values())
    print('field (players with legend, all used tournaments):', ', '.join(f'{short(k)} {v} ({100*v/tot:.1f}%)' for k, v in players.most_common(14)))
    # asymmetry check
    bad = 0; pairs = set()
    for (a, b), (w, l, d) in cell.items():
        r = cell.get((b, a))
        if r and (r[0] != l or r[1] != w): bad += 1
        pairs.add(tuple(sorted((a, b))))
    print('directed cells', len(cell), 'unordered pairs', len(pairs), 'asymmetric directed cells', bad)
    rows = []
    for a, b in sorted(pairs):
        w, l, d = cell.get((a, b)) or [cell[(b, a)][1], cell[(b, a)][0], cell[(b, a)][2]]
        n = w + l + d
        if not n: continue
        p = (w + d/2)/n
        if p < .5: a, b, w, l, p = b, a, l, w, 1 - p
        lo, hi = wilson(p, n)
        rows.append((n, a, b, w, l, d, p, lo, hi))
    rows.sort(reverse=True)
    ns = sorted(r[0] for r in rows)
    print('pairs with n>=30:', sum(1 for n in ns if n >= 30), ' n>=100:', sum(1 for n in ns if n >= 100), ' median n', ns[len(ns)//2])
    print('favoured | versus | W-L-D | n | rate | Wilson 95% | shrunk')
    for n, a, b, w, l, d, p, lo, hi in rows:
        if n >= 30:
            print(f'{short(a)} | {short(b)} | {w}-{l}-{d} | {n} | {100*p:.1f} | {100*lo:.1f}-{100*hi:.1f} | {100*(w+d/2+10)/(n+20):.1f}')
    json.dump({'fetched': J['fetched'], 'cells': [{'a': a, 'b': b, 'w': w, 'l': l, 'd': d} for n, a, b, w, l, d, p, lo, hi in rows]}, open(os.path.join(HERE, 'out', 'matrix.json'), 'w'))
