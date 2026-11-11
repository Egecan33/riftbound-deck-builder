"""Print Core Rules passages by rule-number prefix. Usage: python3 -I showrule.py 347 491.8 [--len 300]"""
import re, sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
raw = open(os.path.join(HERE, '..', 'raw', 'core-rules-2026-10-09.txt'), encoding='utf8').read().replace('\x0c', '')
rules = {}; order = []; cur = None
for line in raw.split('\n'):
    m = re.match(r'^\s*(\d{3}(?:\.[0-9a-z]+)*)\.\s+(.*)$', line)
    if m: cur = m.group(1); rules[cur] = m.group(2); order.append(cur)
    elif cur and line.strip(): rules[cur] += ' ' + line.strip()
args = sys.argv[1:]; L = 300
if '--len' in args: i = args.index('--len'); L = int(args[i + 1]); del args[i:i + 2]
for p in args:
    for k in order:
        if k == p or k.startswith(p + '.'): print(k, rules[k][:L])
    print('---')
