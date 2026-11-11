"""Render ../../mechanics-glossary.md from template.md + detector output. Placeholders:
  {{kw:ID}}                 -> pool-count sentence for a keyword
  {{ex:kw:ID|Name|Name}}    -> 3 example cards (named ones first, rest auto-picked from cards that own the keyword)
  {{ex:sys:ID|Name|Name}}   -> 3 example cards for a system detector
  {{c:sys:ID}}              -> "N (unit U / spell S / gear G / legend L / battlefield B)"
  {{n:sys:ID}} {{n:kw:ID}}  -> bare totals;  {{pool:KEY}} -> pool statistic
  {{rx:sys:ID}}             -> the detector regex
"""
import json, re, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import mechanics as M, examples as X, detect_table as D
cards, out = M.run(); byname = {c['name']: c for c in cards}
KW = {k[0]: k for k in M.KEYWORDS}
def cnt(s): return '%d (unit %d / spell %d / gear %d / legend %d / battlefield %d)' % (s['total'], s['unit'], s['spell'], s['gear'], s['legend'], s['battlefield'])
def kwline(kid):
    v = out['keywords'][kid]; vals = ', '.join('%s: %d' % (k, n) for k, n in sorted(v['values'].items()))
    tok = (' Tokens that have it (not counted): %s.' % ', '.join(v['tokensWith'])) if v['tokensWith'] else ''
    line = 'own it: **%d** (unit %d / spell %d / gear %d / legend %d / battlefield %d); grant, condition on or reference it without owning it: **%d**; total **%d**. First set: %s.' % (
        v['has']['total'], v['has']['unit'], v['has']['spell'], v['has']['gear'], v['has']['legend'], v['has']['battlefield'], v['ref']['total'], v['any']['total'], v['firstSet'])
    if KW[kid][3] or len(v['values']) > 1: line += ' Printed values on owners: %s.' % vals
    return line + tok
def exlist(matches, names):
    miss = [n for n in names if n not in byname]
    if miss: raise SystemExit('unknown example card: %r' % miss)
    forced = [byname[n] for n in names]
    pool = forced + [c for c in matches if c not in forced]
    return '\n'.join('  - ' + X.fmt(c) for c in X.pick(pool, 3, prefer=names))
def esc(rx): return '`' + rx.replace('|', '\\|') + '`'
def detect_table():
    rows = ['| Mechanic (rule) | Keyword field | Text regex (case-insensitive, on reminder-stripped text) | Pool n (own / any) | Role | Axis |', '|---|---|---|---|---|---|']
    for kid, role, axis in D.KW_ROWS:
        _, kw, rule, valued = KW[kid]; v = out['keywords'][kid]
        k = re.escape(kw).replace('\\ ', ' ').replace('\\-', '-')
        own = r'(^|\n)(\[[A-Za-z -]+( \d+)?\](\[>+\])?[ ,]*)*\[%s%s\]' % (k, r'( \d+)?' if valued else '')
        rows.append('| %s (CR %s) | `keywords[].name == "%s"`%s | own: %s; any: %s | %d / %d | %s | %s |' % (kw, rule, kw, ' with `n`' if valued else '', esc(own), esc(r'\[%s( \d+)?\]' % k), v['has']['total'], v['any']['total'], role, axis))
    for label, sid, role, axis in D.SYS_ROWS:
        v = out['systems'][sid]
        rows.append('| %s | none | %s | %d | %s | %s |' % (label, esc(v['regex']), v['total'], role, axis))
    return '\n'.join(rows)
def sub(m):
    if m.group(1) == 'detect_table': return detect_table()
    parts = m.group(1).split('|'); head = parts[0].split(':'); names = [p.strip() for p in parts[1:]]
    if head[0] == 'kw': return kwline(head[1])
    if head[0] == 'ex' and head[1] == 'kw': return exlist([c for c in cards if M.kw_has(KW[head[2]][1]).search(c['t'])], names)
    if head[0] == 'ex' and head[1] == 'sys': return exlist([c for c in cards if M.SYSTEMS[head[2]].search(c['t'])], names)
    if head[0] == 'c': return cnt(out['systems'][head[2]])
    if head[0] == 'n' and head[1] == 'sys': return str(out['systems'][head[2]]['total'])
    if head[0] == 'n' and head[1] == 'kw': return str(out['keywords'][head[2]]['any']['total'])
    if head[0] == 'rx': return '`' + out['systems'][head[2]]['regex'].replace('|', '\\|') + '`'
    if head[0] == 'pool': 
        v = out['pool'][head[1]]
        return json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else str(v)
    raise SystemExit('bad placeholder ' + m.group(0))
tpl = open(os.path.join(HERE, 'template.md'), encoding='utf8').read()
doc = re.sub(r'\{\{([^{}]+)\}\}', sub, tpl)
dst = os.path.join(HERE, '..', '..', 'mechanics-glossary.md')
open(dst, 'w', encoding='utf8').write(doc)
print('wrote', os.path.abspath(dst), len(doc), 'chars', doc.count('\n'), 'lines')
