#!/usr/bin/env python3
"""Normalise the official card gallery (https://playriftbound.com/en-us/card-gallery/, fetched 2026-11-11)
into cards-current.json: one record per distinct card (base printing), plain rules text with the same
bracket tokens that GameLab/data/cards/cards.json uses."""
import json, re, html, sys
src = sys.argv[1] if len(sys.argv) > 1 else 'raw/gallery-2026-11-11.html'
t = open(src, errors='ignore').read()
d = json.loads(re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', t, re.S).group(1))
items = d['props']['pageProps']['page']['blades'][2]['cards']['items']
TOK = {'exhaust': '[Exhaust]', 'might': '[Might]', 'rune_rainbow': '[Any]'}
def tok(m):
    k = m.group(1)
    if k in TOK: return TOK[k]
    e = re.match(r'energy_(\d+)', k)
    if e: return f'[{e.group(1)}]'
    r = re.match(r'rune_(\w+)', k)
    if r: return f'[{r.group(1).capitalize()}]'
    return f'[{k}]'
def plain(body):
    s = re.sub(r'<br\s*/?>', '\n', body or '')
    s = re.sub(r'</p>\s*<p>', '\n', s)
    s = html.unescape(re.sub(r'<[^>]+>', '', s))
    s = re.sub(r':rb_(\w+?):', tok, s)
    return s.replace('’', "'").replace('—', '—').strip()
def val(o):
    try: return o['value']['id']
    except Exception: return None
CHAMPS = {i['name'] for i in items if any(x['id'] == 'champion' for x in i['cardType'].get('superType', [])) and any(x['id'] == 'unit' for x in i['cardType'].get('type', []))}
out = {}
for i in items:
    code = i['publicCode'].split('/')[0]
    ct = i['cardType']
    types = [x['id'] for x in ct.get('type', [])]
    sup = [x['id'] for x in ct.get('superType', [])]
    typ = 'legend' if 'legend' in types else 'battlefield' if 'battlefield' in types else 'rune' if 'rune' in types else 'unit' if 'unit' in types else 'gear' if 'gear' in types else 'spell' if 'spell' in types else (types[0] if types else '?')
    tg = (i.get('tags') or {}).get('tags') or [] if isinstance(i.get('tags'), dict) else []
    if typ == 'legend':            # gallery: name = title, tag = champion  ->  "Riven, The Exile"
        ch = [x for x in tg if x in CHAMPS] or tg
        name = (ch[0] + ', ' if ch else '') + i['name']
    elif 'signature' in sup:       # gallery subtitle of a signature card is its champion, not part of the name
        name = i['name']
    else:
        name = i['name'] + (', ' + i['subtitle'] if i.get('subtitle') else '')
    rec = dict(code=code, name=name, set=i['set']['value']['id'], type=typ, types=types, superTypes=sup,
               domains=[x['id'] for x in (i.get('domain') or {}).get('values', [])],
               tags=[(x.get('label') if isinstance(x, dict) else x) for x in ((i.get('tags') or {}).get('tags') or (i.get('tags') or {}).get('values') or [])] if isinstance(i.get('tags'), dict) else [],
               energy=val(i.get('energy') or {}), power=val(i.get('power') or {}), might=val(i.get('might') or {}),
               text=plain(((i.get('text') or {}).get('richText') or {}).get('body')))
    key = (name, typ)
    base = bool(re.fullmatch(r'[A-Z]{3}-\d{3}', code))
    if key not in out or (base and not out[key]['_base']) or (base == out[key]['_base'] and code < out[key]['code']):
        rec['_base'] = base; rec['printings'] = sorted(set(out.get(key, {}).get('printings', []) + [code])); out[key] = rec
    else:
        out[key]['printings'] = sorted(set(out[key]['printings'] + [code]))
cards = sorted(out.values(), key=lambda r: r['code'])
for r in cards: r.pop('_base')
json.dump(dict(source='https://playriftbound.com/en-us/card-gallery/', fetched='2026-11-11', count=len(cards), cards=cards), open('cards-current.json', 'w'), ensure_ascii=False, indent=0)
from collections import Counter
print(len(items), 'printings ->', len(cards), 'cards', Counter(r['set'] for r in cards), Counter(r['type'] for r in cards))
