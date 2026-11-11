#!/usr/bin/env python3
"""List every Core Rules number cited in ../../rulings-and-errata.md (or doc_template.md) with the rule's text from the
cached CR 2026-10-09, so each citation can be read against the claim. Missing numbers are reported and fail the run.
Run: python3 -I check_citations.py [--template] [--width N]"""
import re, os, sys, json
here = os.path.dirname(os.path.abspath(__file__))
cr = open(os.path.join(here, '..', 'raw', 'core-rules-2026-10-09.compact.txt'), encoding='utf-8').read().split('\n')
rules = {}
for ln in cr:
    m = re.match(r'\s*(\d{3}(?:\.\d+)?(?:\.[a-z0-9]+)*)\.\s+(.*)', ln)
    if m: rules.setdefault(m.group(1), m.group(2))
src = 'doc_template.md' if '--template' in sys.argv else os.path.join('..', '..', 'rulings-and-errata.md')
w = int(sys.argv[sys.argv.index('--width') + 1]) if '--width' in sys.argv else 230
doc = open(os.path.join(here, src), encoding='utf-8').read()
cited = []
for m in re.finditer(r'(?<!old )(?:CR|rules": \[)\s*((?:"?\d{3}(?:\.[0-9a-z]+)*"?(?:, | to | and )?)+)', doc):
    line = doc.count('\n', 0, m.start()) + 1
    for n in re.findall(r'\d{3}(?:\.[0-9a-z]+)*', m.group(1)):
        cited.append((n, line))
miss = []
seen = set()
for n, line in cited:
    if n in seen: continue
    seen.add(n)
    if n in rules: print(f"{n:16} L{line:<4} {rules[n][:w]}")
    else: miss.append((n, line)); print(f"{n:16} L{line:<4} *** NOT FOUND ***")
json.dump({'edition': '2026-10-09', 'cited': sorted(seen), 'missing': miss}, open(os.path.join(here, 'out', 'citations.json'), 'w'), indent=1)
print(len(seen), 'distinct rule numbers cited;', len(miss), 'missing', miss, file=sys.stderr)
sys.exit(1 if miss else 0)
