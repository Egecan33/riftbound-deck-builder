#!/usr/bin/env python3
"""Normalises the Radiance (RAD) cards from the official card gallery snapshot into the minimal shape build_graph.py reads.
Source: https://playriftbound.com/en-us/card-gallery/ (__NEXT_DATA__ blade 'cards.items'), fetched 2026-11-11.
Text only: there is no engine script for these cards yet. Run: python3 normalize_rad.py"""
import json, re, html, os
HERE = os.path.dirname(os.path.abspath(__file__))
items = json.load(open(os.path.join(HERE, 'data/gallery-cards-2026-11-11.json')))
DOM = {'fury', 'calm', 'mind', 'body', 'chaos', 'order'}
def icon(m):
    raw = m.group(1)
    if raw == 'rb_might': return '[Might]'
    if raw == 'rb_exhaust': return '[Exhaust]'
    e = re.match(r'rb_energy_(\d+)$', raw)
    if e: return f'[{e.group(1)}]'
    r = re.match(r'rb_rune_([a-z]+)$', raw)
    if r: return '[Any]' if r.group(1) == 'rainbow' else f'[{r.group(1).capitalize()}]'
    return f'[{raw}]'
def plain(body):
    t = re.sub(r'<br\s*/?>', '\n', body or ''); t = re.sub(r'</p>\s*<p>', '\n', t); t = re.sub(r'<[^>]+>', '', t)
    t = html.unescape(t); t = re.sub(r':(rb_[a-z0-9_]+):', icon, t)
    return t.strip()
KW = ['Action', 'Reaction', 'Equip', 'Empower', 'Hidden', 'Empowered', 'Accelerate', 'Deflect', 'Deathknell', 'Repeat', 'Tank', 'Level', 'Assault', 'Shield', 'Flow', 'Ganking', 'Ambush', 'Hunt', 'Weaponmaster', 'Legion', 'Vision', 'Temporary', 'Quick-Draw', 'Backline', 'Unique']
seen = {}; out = []
for c in items:
    if c['set']['value']['id'] != 'RAD': continue
    tl = c['cardType']['type']
    # 13 RAD entries have an empty type list in the gallery snapshot: infer it (unit if it has Might, gear if it equips or exhausts, else spell)
    body0 = (c.get('text') or {}).get('richText', {}).get('body') or ''
    typ = tl[0]['id'] if tl else ('unit' if c.get('might') else ('gear' if re.search(r'\[Equip\]|rb_exhaust', body0) else 'spell'))
    inferred = not tl
    sup = [s['id'] for s in c['cardType'].get('superType') or []]
    name = c['name']; sub = c.get('subtitle')
    full = sub if typ == 'legend' and sub else (f'{name}, {sub}' if sub else name)
    text = plain((c.get('text') or {}).get('richText', {}).get('body'))
    key = (full, typ)
    if key in seen: continue   # showcase / alternate printings of the same card
    seen[key] = 1
    code = c['publicCode'].split('/')[0]
    # keyword = bracketed keyword at the start of a line or sentence that is not inside a "give ... [K]" grant
    kws = [k for k in KW if re.search(r'(?:^|\n|\. )\[' + k + r'(?: \d+)?\]', text)]
    out.append(dict(code=code, gid=c['id'], name=full, set='RAD', type=typ, superTypes=sup, domains=[d['id'] for d in c['domain']['values'] if d['id'] in DOM],
                    tags=(c.get('tags') or {}).get('tags') or [], energy=(c.get('energy') or {}).get('value', {}).get('id'), power=(c.get('power') or {}).get('value', {}).get('id'),
                    might=(c.get('might') or {}).get('value', {}).get('id'), text=text, keywords=kws, typeInferred=inferred))
json.dump(dict(source='https://playriftbound.com/en-us/card-gallery/', fetchedAt='2026-11-11', cards=out), open(os.path.join(HERE, 'data/rad-cards.json'), 'w'), indent=1)
from collections import Counter
print(len(out), Counter(c['type'] for c in out), Counter(len(c['domains']) for c in out))
print([c['name'] for c in out if c['type'] == 'legend']); print('type inferred:', [(c['name'], c['type']) for c in out if c['typeInferred']])
