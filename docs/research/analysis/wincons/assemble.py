#!/usr/bin/env python3
"""Rebuilds ../../wincons.md from wincons.head.md (sections 0-1), wincons.body.md (sections 2-6) and the out-*.txt files.
Placeholders in the .md parts: {{file:NAME}} (whole file) and {{file:NAME:WIDTH}} (each line cut to WIDTH chars)."""
import re, os, sys
# Guard added by the 2026-11-11 verification pass: ../../wincons.md now carries hand-applied corrections
# ("CORRECTED (verification 2026-11-11)") and a "Verification log" that are NOT in wincons.head.md / wincons.body.md.
# Re-assembling would silently delete them. Port them into the parts first, then run with --force.
if '--force' not in sys.argv:
    sys.exit('assemble.py: refusing to overwrite wincons.md (it contains verification corrections that are not in the .head/.body parts). Port them, then re-run with --force.')
H = os.path.dirname(os.path.abspath(__file__))
def sub(m):
    name, _, w = m.group(1).partition(':')
    ls = open(os.path.join(H, name)).read().rstrip('\n').split('\n')
    return '\n'.join(l[:int(w)].rstrip() if w else l for l in ls)
txt = open(os.path.join(H, 'wincons.head.md')).read() + open(os.path.join(H, 'wincons.body.md')).read()
open(os.path.join(H, '..', '..', 'wincons.md'), 'w').write(re.sub(r'\{\{file:([^}]+)\}\}', sub, txt))
print('written', len(txt))
