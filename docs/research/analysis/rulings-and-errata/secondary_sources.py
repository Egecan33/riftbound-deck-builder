#!/usr/bin/env python3
"""Reproduces out/secondary-sources.json and out/silent-diffs.json (script added by the verification pass 2026-11-11;
the first author produced these two files ad hoc). Run after build_errata.py: python3 -I secondary_sources.py
Reads (read-only): ../interactions/data/riftcodex-2026-11-11.json, ~/github_repositories/GameLab/data/cards/cards.json."""
import json, os, re, sys, collections, html
here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, here)
import gallery as G
C = collections.Counter
err = json.load(open(os.path.join(here, 'out', 'errata.json')))
def status(text, e):
    n, new, old = G.norm(text), G.norm(e['new']), G.norm(e['old'])
    s = G.strip_reminder
    return 'NEW' if n == new else 'OLD' if n == old else 'NEW' if G.norm(s(text)) == G.norm(s(e['new'])) else 'OLD' if G.norm(s(text)) == G.norm(s(e['old'])) else 'OTHER'
ALIAS = {'Leblanc, Deceiver': {'Deceiver'}, 'Dark Child, Starter': {'Dark Child', 'Dark Child - Starter'}}
names = lambda card: {card} | ALIAS.get(card, set())
# riftcodex: one item per printing; full name is in media.accessibility_text
rc = json.load(open(os.path.join(here, '..', 'interactions', 'data', 'riftcodex-2026-11-11.json')))['items']
def rc_name_text(it):
    at = (it.get('media') or {}).get('accessibility_text') or ''
    m = re.match(r'Riftbound [^:]+: (.*)', at.replace('’', "'"), re.S)
    rich = (it.get('text') or {}).get('rich') or ''   # 'plain' has no line separators; use the rich field
    rich = html.unescape(re.sub(r'<[^>]+>', '', re.sub(r'<br\s*/?>|</p>|</li>', '\n', rich))).strip()
    return (m.group(1) if m else it['name']), rich
gl = json.load(open(os.path.expanduser('~/github_repositories/GameLab/data/cards/cards.json')))['cards']
out = {}; tot = {'riftcodex': C(), 'gamelab': C()}; glcards = C()
for r in err['rows']:
    card, e = r['card'], r['errata']
    a = C(); seen = set()
    for it in rc:
        if it['riftbound_id'] in seen: continue
        fn, plain = rc_name_text(it)
        if any(fn == n or fn.startswith(n + '.') for n in names(card)): a[status(plain, e)] += 1; seen.add(it['riftbound_id'])
    b = C()
    for c in gl:
        if c['name'].replace('’', "'") in names(card): b[status(c.get('rulesText') or '', e)] += 1
    out[card] = {'riftcodex': dict(a), 'gamelab': dict(b)}
    tot['riftcodex'] += a; tot['gamelab'] += b; glcards[bool(b)] += 1
json.dump(out, open(os.path.join(here, 'out', 'secondary-sources.json'), 'w'), ensure_ascii=False)
print('riftcodex items', len(rc), 'distinct ids', len({it['riftbound_id'] for it in rc}), 'printings of errata cards', dict(tot['riftcodex']), 'cards without a match', [k for k, v in out.items() if not v['riftcodex']])
print('gamelab cards', len(gl), 'errata cards present', glcards[True], dict(tot['gamelab']), 'absent', [k for k, v in out.items() if not v['gamelab']])
print('gamelab ahead of gallery:', [r['card'] for r in err['rows'] if out[r['card']]['gamelab'].get('NEW') and r['gallery'] == 'printed text (stale)'])
# silent diffs: same full name + same card type, different normalised text with reminder text removed (alt text + effect text) across printings, no errata
g = G.load(); by = collections.defaultdict(dict)
errn = set().union(*[names(r['card']) for r in err['rows']])
for x in g:
    t = (x['cardType']['type'] or [{'label': '?'}])[0]['label']
    by[(t, G.full_name(x))][x['publicCode']] = G.norm(G.strip_reminder(G.alt_text(x) + ' ' + G.rich_text(x, 'effect')))
sil = [dict(type=t, name=n, printings=p) for (t, n), p in sorted(by.items()) if len(set(p.values())) > 1 and n not in errn]
json.dump(sil, open(os.path.join(here, 'out', 'silent-diffs.json'), 'w'), ensure_ascii=False)
print('silent diffs', len(sil), 'names;', sum(1 for s in sil if s['type'] == 'Rune'), 'runes:', [s['name'] for s in sil])
# same test on the rich-text field (independent of the alt text)
by2 = collections.defaultdict(dict)
for x in g:
    t = (x['cardType']['type'] or [{'label': '?'}])[0]['label']
    by2[(t, G.full_name(x))][x['publicCode']] = G.norm(G.strip_reminder(G.rich_text(x) + ' ' + G.rich_text(x, 'effect')))
sil2 = sorted(n for (t, n), p in by2.items() if len(set(p.values())) > 1 and n not in errn)
print('silent diffs by rich text', len(sil2), 'only-rich', sorted(set(sil2) - {s['name'] for s in sil}), 'only-alt', sorted({s['name'] for s in sil} - set(sil2)))
