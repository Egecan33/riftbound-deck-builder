#!/usr/bin/env python3
"""Assemble ../../rulings-and-errata.md from doc_template.md: fill the source table, the errata table and summary,
and expand {{Card Name}} to "Card Name (CODE)" using the gallery snapshot. Run: python3 -I assemble.py"""
import json, os, re, sys
from collections import Counter
here = os.path.dirname(os.path.abspath(__file__))
gal = json.load(open(os.path.join(here, '..', 'interactions', 'data', 'gallery-cards-2026-11-11.json')))
man = {m['name']: m for m in json.load(open(os.path.join(here, 'manifest.json')))}
err = json.load(open(os.path.join(here, 'out', 'errata.json')))
KEYS = [('ERR-OGN', 'origins-errata'), ('FAQ-OGN', 'origins-faq'), ('PN-OGN', 'patch-notes-origins'), ('PN-SFD', 'patch-notes-spiritforged'),
        ('ERR-SFD', 'spiritforged-errata'), ('FAQ-SFD', 'spiritforged-faq'), ('PN-UNL', 'patch-notes-unleashed'), ('ERR-UNL', 'unleashed-errata'),
        ('FAQ-UNL', 'unleashed-faq'), ('PN-VEN', 'patch-notes-vendetta'), ('ERR-VEN', 'vendetta-errata'), ('FAQ-VEN', 'vendetta-faq'),
        ('PN-RAD', 'patch-notes-radiance'), ('ERR-RAD', 'radiance-errata'), ('FAQ-RAD', 'radiance-faq'), ('HUB', 'rules-hub')]
doc2key = {d: k for k, d in KEYS}
q = lambda s: s.replace('’', "'")
def fullname(x):
    m = re.match(r'Riftbound [^:]+: (.*)', x['cardImage'].get('accessibilityText') or '', re.S)
    return q(m.group(1)) if m else q(x['name'])
SETORD = {'OGN': 0, 'OGS': 1, 'SFD': 2, 'UNL': 3, 'VEN': 4, 'RAD': 5}
def rank(x):
    c = x['publicCode']; base = re.fullmatch(r'[A-Z]+-\d+/\d+', c) is not None
    return (0 if base else 1, SETORD.get(x['set']['value']['id'], 9), x.get('collectorNumber') or 0)
ALIAS = {'Leblanc, Deceiver': 'Deceiver'}
def code(name):
    n = q(ALIAS.get(name, name))
    c = [x for x in gal if fullname(x).startswith(n + '.') or fullname(x) == n]
    if not c: c = [x for x in gal if q(x['name']) == n]
    if not c and ', ' in n:  # legends: articles say "Champion, Title", the gallery names the legend by its title only
        t = n.split(', ', 1)[1].lower()
        c = [x for x in gal if x['cardType']['type'] and x['cardType']['type'][0]['id'] == 'legend' and fullname(x).lower().startswith(t + '.')]
    if not c: return None
    return sorted(c, key=rank)[0]['publicCode']
tpl = open(os.path.join(here, 'doc_template.md'), encoding='utf-8').read()
# sources
rows = []
for k, d in KEYS:
    m = man[d]; rows.append(f"| {k} | {m['title']} | {m['published'][:10]} | `{m['rev']}` | `{m['sha256']}` | {m['url']} |")
tpl = tpl.replace('<<SOURCES>>', '\n'.join(rows))
# errata
cell = lambda t: t.replace('\n', ' / ').replace('|', '\\|')
def sid(e):
    m = re.match(r'(.*)-(\d+)$', e['id'])
    return f"{doc2key[m.group(1)]} #{m.group(2)}" if m else f"{doc2key[e['doc']]} (faq-only)"
lines = ['| Card | Printings: gallery status | Printed text (pre-errata) | Current text (errata) | Effective | Source | Gallery reflects errata? |', '|---|---|---|---|---|---|---|']
pc = Counter(); cc = Counter()
for r in err['rows']:
    e = r['errata']
    prs = ', '.join(f"{p['code']} {p['status']}" for p in r['printings'])
    for p in r['printings']: pc[p['status']] += 1
    cc[r['gallery']] += 1
    yn = {'reflects errata': 'yes', 'printed text (stale)': 'no', 'mixed': 'partly'}[r['gallery']]
    lines.append(f"| {r['card']} | {prs} | {cell(e['old'])} | {cell(e['new'])} | {e['date']} | {sid(e)} | {yn} |")
tpl = tpl.replace('<<ERRATA_TABLE>>', '\n'.join(lines))
summ = (f"- Cards: {cc['reflects errata']} of {len(err['rows'])} have every gallery printing on the errata text, {cc['mixed']} have some printings on it, {cc['printed text (stale)']} have none.\n"
        f"- Printings: {sum(pc.values())} gallery printings belong to these cards: {pc['NEW'] + pc['NEW~']} show the errata text ({pc['NEW~']} of them only after removing reminder text), {pc['OLD'] + pc['OLD~']} show the pre-errata text ({pc['OLD~']} of them a short-reminder variant of it), {pc['OTHER']} match neither.\n"
        f"- Cards with only some printings on the errata text: " + '; '.join(f"{r['card']} ({', '.join(p['code'] for p in r['printings'] if p['status'].startswith('NEW'))} updated)" for r in err['rows'] if r['gallery'] == 'mixed') + '.')
tpl = tpl.replace('<<ERRATA_SUMMARY>>', summ)
refl = [r for r in err['rows'] if r['gallery'] == 'reflects errata']
tpl = tpl.replace('<<REFLECT_LIST>>', f"{len(refl)} cards (" + ', '.join(r['card'] for r in refl) + ')')
# excess damage cards
seen = {}
for x in sorted(gal, key=rank):
    t = (x['cardImage'].get('accessibilityText') or '') + ' ' + ((x.get('text') or {}).get('richText') or {}).get('body', '') + ' ' + json.dumps(x.get('effect') or '')
    if re.search(r'excess', t, re.I):
        fn = fullname(x); nm = next((k for k in [fn.split('. ')[0].rstrip('.')]), fn)
        seen.setdefault(nm, x['publicCode'])
tpl = tpl.replace('<<EXCESS_CARDS>>', ', '.join(f'{n} ({c})' for n, c in seen.items()))
# card codes
missing = []
def sub(m):
    c = code(m.group(1))
    if not c: missing.append(m.group(1)); return m.group(1) + ' (code not found)'
    return f"{m.group(1)} ({c})"
out = re.sub(r'\{\{([^}]+)\}\}', sub, tpl)
assert '<<' not in out, re.findall(r'<<[A-Z_]+>>', out)
dst = os.path.join(here, '..', '..', 'rulings-and-errata.md')
open(dst, 'w', encoding='utf-8').write(out)
print('written', os.path.abspath(dst), len(out), 'chars;', len(lines) - 2, 'errata rows; printings', dict(pc), 'cards', dict(cc))
print('excess:', seen)
print('MISSING CODES:', sorted(set(missing)))
