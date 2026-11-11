"""Map rule numbers cited from Core Rules 2026-07-16 (GameLab) to Core Rules 2026-10-09 (current) by matching rule text."""
import re, os
old = open(os.path.expanduser('~/github_repositories/GameLab/data/rules/core-rules.md')).read()
new = open('../raw/core-rules-2026-10-09.compact.txt').read()
CITED = ['103.2.a.1','103.3.a','112','114','116','117.1','117.3','144.2','144.4.c.1','161.2.b','164.2.b','167','308.1.a','309.1.a','310.1.a','312.2.d','313.1','315.2.b.2','315.3.b','315.4.b','316.5.b.1','317.2.b','346','346.1','347.1.b','347.2.a','348.2.a','359.2.c','416.1','416.5','430.4.a','431.2.c','446.3.c','447.2.a','447.2.b','457.1','460','461.1','464.2.c.1','464.2.d','465.2.c','465.2.c.3','465.2.c.6','466.1.a.1','466.1.a.2','466.3.d.1','466.5.d','469.1','469.2','470','471.1.b.1','472','485.3','485.4','485.5','485.7','486.5','486.6','486.7','487.3','487.7','488.4.b','488.7','489.3','489.5.c.1','489.7','489.8.a','489.8.b','489.8.c.2','489.8.d','489.8.e','489.8.g.1','489.8.h','805.1.a','806.1.b','811.1.b','811.1.d.2','812.1.c','813.1.c','819.1.c','822.1.b','823.1.c.1','824.1.b.1']
def old_text(num):
    m = re.search(r'^(?:## |\s*- \*\*)' + re.escape(num) + r'\.(?:\*\*)? (.+)$', old, re.M)
    return m.group(1).strip() if m else None
rows = []
for n in CITED:
    t = old_text(n)
    if not t: rows.append((n, 'NOT FOUND IN OLD', '')); continue
    key = re.sub(r'\s+', ' ', t)[:70]
    key = re.sub(r'See rule \d+.*', '', key)[:60]
    m = re.search(r'(?:^|\n)\s*(\d{3}(?:\.[0-9a-z]+)*)\.\s+' + re.escape(key[:45]), new)
    rows.append((n, m.group(1) if m else 'TEXT CHANGED/NOT FOUND', key[:50]))
same = sum(1 for a, b, _ in rows if a == b)
print(f'cited={len(rows)} unchanged={same}')
for a, b, k in rows:
    if a != b: print(f'{a} -> {b} | {k}')
