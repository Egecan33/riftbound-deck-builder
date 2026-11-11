#!/usr/bin/env python3
"""Feature audit: which pool cards carry which detector feature. Usage: audit.py feat1 feat2 ... (no args = counts)."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import detect as D
from collections import Counter
cnt, by = Counter(), {}
for c in D.POOL:
    if c['type'] == 'rune': continue
    for f in D.feats(c): cnt[f] += 1; by.setdefault(f, []).append(f"{c['name']} [{c['code']}]" )
if len(sys.argv) == 1: print(dict(cnt))
for f in sys.argv[1:]:
    print('\n##', f, len(by.get(f, [])), '::', '; '.join(by.get(f, [])))
