#!/usr/bin/env python3
"""Reproduces every DATA number quoted in docs/research/rules.md (verification pass 2026-11-11).
usage: python3 verify-rules.py [saved-card-gallery.html]
Without an argument it fetches https://playriftbound.com/en-us/card-gallery/ (generic UA).
Reads (read-only) ~/github_repositories/GameLab/data/cards/cards.json and
~/github_repositories/GameLab/data/decks/samples/piltover-archive-2026-09-06.json."""
import json, re, sys, os, collections, urllib.request
C = collections.Counter
H = os.path.expanduser('~/github_repositories/GameLab/data')
if len(sys.argv) > 1:
    html = open(sys.argv[1]).read()
else:
    req = urllib.request.Request('https://playriftbound.com/en-us/card-gallery/', headers={'User-Agent': 'Mozilla/5.0 (compatible; deck-research/1.0)'})
    html = urllib.request.urlopen(req, timeout=60).read().decode()
nd = json.loads(re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S).group(1))
items = next(b['cards']['items'] for b in nd['props']['pageProps']['page']['blades'] if isinstance(b, dict) and 'cards' in b)
G = [dict(code=i.get('publicCode'), name=i['name'], sub=i.get('subtitle'), set=i['set']['value']['id'],
          type=[t['id'] for t in i['cardType'].get('type', [])], sup=[t['id'] for t in i['cardType'].get('superType', []) or []],
          dom=[t['id'] for t in i['domain'].get('values', [])], tags=(i.get('tags') or {}).get('tags') or [],
          text=re.sub(r'<[^>]+>', ' ', (i.get('text') or {}).get('richText', {}).get('body', ''))) for i in items]
print('== GAL ==')
print('printings', len(G), dict(C(s['set'] for s in G)))
rad_nt = [s for s in G if s['set'] == 'RAD' and not s['type']]
print('RAD printings without type', len(rad_nt), '| of those with empty domain list', sum(1 for s in rad_nt if not s['dom']))
L = [s for s in G if 'legend' in s['type']]
print('legend printings', len(L), 'distinct', len({s['name'] for s in L}), 'domain counts', dict(C(len(s['dom']) for s in L)))
print('legend subtitles', dict(C(str(s['sub']) for s in L)), '| legend printings with champion supertype', len([s for s in L if 'champion' in s['sup']]))
print('legends with != 1 tag', sorted({(s['name'], tuple(s['tags'])) for s in L if len(s['tags']) != 1}))
B = [s for s in G if 'battlefield' in s['type']]
print('non-token battlefields', len({s['name'] for s in B if 'token' not in s['sup']}), 'domains', dict(C(tuple(s['dom']) for s in B)), 'token battlefields', sorted({s['name'] for s in B if 'token' in s['sup']}))
U = [s for s in G if s['type'] == ['unit'] and 'champion' in s['sup']]
cu = {s['name'] + ', ' + s['sub']: s for s in U}
shorts = {s['name'] for s in U}
print('distinct champion units', len(cu), '| short name is a tag for', sum(1 for s in cu.values() if s['name'] in s['tags']))
ln = {}
for s in L: ln.setdefault(s['name'], set()).update(s['tags'])
print('legends by number of tags equal to a champion short name', dict(C(len(t & shorts) for t in ln.values())))
withleg = set().union(*[t & shorts for t in ln.values()])
print('champion short names', len(shorts), 'without a legend', len(shorts - withleg))
print('champion tags with 2+ legends', [(k, v) for k, v in C(x for t in ln.values() for x in t & shorts).items() if v > 1])
print('Yordle champions', sorted({s['name'] for s in U if 'Yordle' in s['tags']}))
ld = {}
for s in L:
    for t in s['tags']:
        if t in shorts: ld.setdefault(t, set()).add(frozenset(s['dom']))
print('champion units outside their legend domains', [n for n, s in cu.items() for d in ld.get(s['name'], []) if not set(s['dom']) - {'colorless'} <= d])
SG = {}
for s in G:
    if 'signature' in s['sup']: SG.setdefault(s['name'], s)
print('signature cards', len(SG), dict(C(s['type'][0] for s in SG.values())), 'units:', sorted(n for n, s in SG.items() if s['type'] == ['unit']), '| with subtitle', sum(1 for s in SG.values() if s['sub']))
bad = [n for n, s in SG.items() if len([t for t in s['tags'] if t in shorts]) != 1 or any(frozenset(s['dom']) != d for d in ld.get([t for t in s['tags'] if t in shorts][0], [None]))]
print('signature cards whose domains differ from their legend(s)', bad)
print('Unique', sorted({(s['name'], s['code']) for s in G if '[Unique]' in s['text']}))
print('deck-building text', sorted({(s['name'], s['code']) for s in G if re.search(r'your deck can|is in your deck|in decks of', s['text'], re.I)}))
print('typed non-token non-battlefield cards with colorless domain', sorted({(s['name'], s['sub'], s['code']) for s in G if s['dom'] == ['colorless'] and s['type'] and 'token' not in s['sup'] and 'battlefield' not in s['type']}))
print('runes', len([s for s in G if 'rune' in s['type']]), sorted({s['name'] for s in G if 'rune' in s['type']}))
print('untyped pseudo-cards outside RAD', [(s['code'], s['name']) for s in G if not s['type'] and s['set'] != 'RAD'])
print('multi-domain cards that are neither legend nor signature', len([s for s in G if len(s['dom']) > 1 and 'legend' not in s['type'] and 'signature' not in s['sup']]))
print('== L-CARDS ==')
d = json.load(open(H + '/cards/cards.json')); cards = d['cards']
print(len(cards), d['builtAt'], dict(C(c['set'] for c in cards)))
print('type', dict(C(c['type'] for c in cards)))
print('superTypes', dict(C(','.join(c['superTypes']) or 'none' for c in cards)), '| champion by type', dict(C(c['type'] for c in cards if 'champion' in c['superTypes'])))
print('domain count', dict(C(len(c['domains']) for c in cards)), '| two-domain', dict(C(c['type'] + ('/sig' if 'signature' in c['superTypes'] else '') for c in cards if len(c['domains']) == 2)))
print('copyLimit', dict(C(c['copyLimit'] for c in cards)), [c['name'] for c in cards if c['copyLimit'] != 3])
print('printing variants', dict(C(p['variant'] for c in cards for p in c['printings'])))
print('printing sets', dict(C(p['set'] for c in cards for p in c['printings'])))
print('== L-DECKS ==')
ds = json.load(open(H + '/decks/samples/piltover-archive-2026-09-06.json'))['decks']
by = {c['cardCode']: c for c in cards}
comp = [x for x in ds if x['complete']]
print('decks', len(ds), 'complete', len(comp), '| main sizes', dict(C(x['counts']['main'] for x in ds)))
print('sideboard size among complete', dict(C(x['counts']['sideboard'] for x in comp)))
def card(e): return by.get(e.get('base') or e['cardCode']) or by.get(e['cardCode'])
print('signature cards main+side among complete', sorted(C(sum(e['count'] for e in x['main'] + x['sideboard'] if card(e) and 'signature' in card(e)['superTypes']) for x in comp).items()))
r12 = [x for x in ds if sum(e['count'] for e in x['runes']) == 12]
print('12-rune lists', len(r12), dict(C('/'.join(map(str, sorted((e['count'] for e in x['runes']), reverse=True))) for x in r12)))
BAN = {'SFD-122', 'SFD-020', 'OGN-168', 'OGN-182', 'OGN-177', 'OGN-110', 'OGN-183', 'OGN-292', 'OGN-284', 'OGN-285', 'OGN-290', 'OGN-276'}
bn = {by[b]['name'] for b in BAN}
def names(x): return {card(e)['name'] for e in x['main'] + x['sideboard'] if card(e)} | {by[b]['name'] for b in x['battlefields'] if b in by}
print('complete decks containing a card banned on 2026-11-11', sum(1 for x in comp if names(x) & bn), 'of', len(comp))
