#!/usr/bin/env python3
"""Per-route pool census: closers / enablers / favouring battlefields / legends, ordered by copies played in the 2026-11-11 corpus."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import detect as D
D._load_meta()
def nm(c): return f"{c['name']} [{c['code']}]({D.META[c['name']]})"
main = [c for c in D.POOL if D.infer_type(c) in ('unit', 'spell', 'gear') and c['type'] != 'rune' and not c['code'].split('-')[1].startswith('T')]
for r, spec in D.ROUTES.items():
    cl = sorted([c for c in main if D.is_closer(r, c, D.feats(c))], key=lambda c: (-D.META[c['name']], c['code']))
    en = sorted([c for c in main if not D.is_closer(r, c, D.feats(c)) and any(k in D.feats(c) for k in spec['w'])], key=lambda c: (-D.META[c['name']], c['code']))
    bf = [c for c in D.POOL if c['type'] == 'battlefield' and any(k in D.feats(c) for k in spec['w'])]
    lg = [c for c in D.POOL if c['type'] == 'legend' and any(k in D.feats(c) for k in spec['w'])]
    print(f"\n## {r}: closers {len(cl)}, enablers {len(en)}")
    print(' closers:', '; '.join(nm(c) for c in cl[:10]))
    print(' enablers:', '; '.join(nm(c) for c in en[:8]))
    print(' battlefields:', '; '.join(c['name'] for c in bf))
    print(' legends:', '; '.join(c['name'] for c in lg))
for f in ('sweep', 'stun', 'displace', 'removal', 'counter', 'prot', 'debuff'):
    xs = sorted([c for c in main if f in D.feats(c)], key=lambda c: (-D.META[c['name']], c['code']))
    print(f"\n## answers:{f} n={len(xs)}:", '; '.join(nm(c) for c in xs[:9]))
