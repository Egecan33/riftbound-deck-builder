#!/usr/bin/env python3
"""Rebuilds ../../wincons.md from wincons.head.md (sections 0-1), wincons.body.md (sections 2-6) and the out-*.txt files.
Placeholders in the .md parts: {{file:NAME}} (whole file) and {{file:NAME:WIDTH}} (each line cut to WIDTH chars)."""
import re, os
H = os.path.dirname(os.path.abspath(__file__))
def sub(m):
    name, _, w = m.group(1).partition(':')
    ls = open(os.path.join(H, name)).read().rstrip('\n').split('\n')
    return '\n'.join(l[:int(w)].rstrip() if w else l for l in ls)
txt = open(os.path.join(H, 'wincons.head.md')).read() + open(os.path.join(H, 'wincons.body.md')).read()
open(os.path.join(H, '..', '..', 'wincons.md'), 'w').write(re.sub(r'\{\{file:([^}]+)\}\}', sub, txt))
print('written', len(txt))
