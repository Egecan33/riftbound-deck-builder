#!/usr/bin/env python3
"""Scan cached community guide pages (analysis/interactions/data/community, analysis/matchups-and-lines/raw) for
paragraphs that co-mention card pairs touched by an official ruling. Output: out/community-scan.json + stdout.
Run: python3 -I community_scan.py"""
import os, re, json, html, glob
here = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(here, '..')
files = glob.glob(os.path.join(A, 'interactions/data/community/pages/*.html')) + glob.glob(os.path.join(A, 'interactions/data/community/*.html')) + glob.glob(os.path.join(A, 'matchups-and-lines/raw/guide-*.txt'))
PAIRS = [
 ('svellsongur', 'aphelios'), ('kato the arm', None), ('portal rescue', 'possession'), ('icathian rain', 'deflect'), ('falling star', 'deflect'),
 ('tianna', None), ('mordekaiser', 'atakhan'), ('zilean', 'deceiver'), ('zilean', 'leblanc'), ('draven', 'point'), ('seraphic wyvern', 'mobilize'), ('seraphic wyvern', 'catalyst of aeons'),
 ('perched grimwyrm', 'dragon roost'), ('reckoner', 'yone'), ('gravity field', None), ('unlicensed armory', 'ekko'), ('immortal phoenix', 'hidden blade'), ('immortal phoenix', 'imperial decree'),
 ('baron nashor', "hunters' circle"), ('baron nashor', 'riven'), ('meticulous restorationist', 'mordekaiser'), ('heimerdinger', 'jayce'), ('hwei', 'patched porobot'), ('swain', 'patched porobot'),
 ('heisho', None), ('cruel patron', None), ('baited hook', None), ('arcane shift', None), ('glasc mixologist', None), ('rek\'sai', 'atakhan'), ('jhin', None), ('repulse', 'alpha strike'),
 ('turn to dust', None), ('gutter guardian', None), ('orianna', 'equipment'), ('neeko', 'kharox'), ('elder dragon', None), ('ki barrier', 'lotus trap'), ('shady spectacles', None), ('symbol of the solari', None),
 ('unyielding spirit', None), ('wraith of echoes', None), ('time warp', None), ('promising future', None), ('nocturne', None), ('zhonya', None), ('hostile takeover', None), ('stormbringer', None), ('find your center', 'temporal portal'),
 ('ezreal', 'deflect'), ('pickpocket', 'gold'), ('rumble', 'mech'), ('astral heron', None), ('fizz', 'flow'), ('kai\'sa', 'flow'), ('abandon', 'flow'), ('rebuttal', None), ('mystic reversal', None), ('crumbling sands', None),
 ('fallen feline', None), ('kayle', None), ('akali, silent', None), ('gangplank', 'switcheroo'), ('gangplank', 'stupefy'), ('mel', 'moonfall'), ('dragon form', 'fiora'), ('temporal breach', None), ('renekton', None),
 ('stand united', None), ('teemo, strategist', None), ('teemo', 'hidden'), ('darius, trifarian', None), ('sun disc', None), ('hallowed tomb', None), ('karma', 'recycle'), ('fox-fire', None), ('dragon\'s rage', None), ('void gate', None),
 ('green father', None), ('brush', 'aspirant'), ('angler wyrm', None), ('charm', 'gravity'), ('possession', 'ekko'), ('runeblade anvil', None), ('chronobreak', None), ('transpositionist', None), ('ahri, confident', None), ('primordial roar', None),
]
def text_of(p):
    s = open(p, encoding='utf-8', errors='ignore').read()
    if p.endswith('.html'):
        s = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', s, flags=re.S)
        s = re.sub(r'</(p|li|h\d|div|tr)>', '\n', s); s = re.sub(r'<[^>]+>', ' ', s); s = html.unescape(s)
    return [re.sub(r'\s+', ' ', l).strip() for l in s.split('\n') if len(l.strip()) > 40]
out = {}
for f in sorted(files):
    paras = text_of(f)
    for a, b in PAIRS:
        for p in paras:
            pl = p.lower().replace('’', "'")
            if a in pl and (b is None or b in pl) and len(p) < 1500:
                out.setdefault(f'{a} + {b}' if b else a, []).append(dict(file=os.path.basename(f), text=p[:700]))
json.dump(out, open(os.path.join(here, 'out', 'community-scan.json'), 'w'), indent=1, ensure_ascii=False)
print(len(files), 'files')
for k, v in sorted(out.items(), key=lambda kv: -len(kv[1])): print(f'{len(v):4d} {k}  [{len({x["file"] for x in v})} files]')
