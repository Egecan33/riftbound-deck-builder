"""Check ../../mechanics-glossary.md against the Core Rules text and the pool:
 1. every cited rule number exists in CR 2026-10-09;
 2. every quotation (>= 18 chars) outside the generated example lines is found verbatim (whitespace/quote-normalised)
    in the Core Rules, in a pool card text, or in one of the cached official articles; for CR quotes, the rule that
    contains the quote is printed next to the rule numbers cited on the same line.
Usage: python3 -I verify.py"""
import re, os, json, glob
HERE = os.path.dirname(os.path.abspath(__file__))
def n(t):
    t = t.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"').replace('—', '-').replace('–', '-').replace('…', '...')
    return re.sub(r'\s+', ' ', t).strip().lower()
raw = open(os.path.join(HERE, '..', 'raw', 'core-rules-2026-10-09.txt'), encoding='utf8').read()
rules = {}; cur = None
for line in raw.replace('\x0c', '').split('\n'):
    m = re.match(r'^\s*(\d{3}(?:\.[0-9a-z]+)*)\.\s+(.*)$', line)
    if m: cur = m.group(1); rules[cur] = m.group(2)
    elif cur and line.strip(): rules[cur] += ' ' + line.strip()
nr = {k: n(v) for k, v in rules.items()}
crall = n(raw)
pool = json.load(open(os.path.join(HERE, 'pool.json')))['cards']
cardall = n(' || '.join(c['text'].replace('\n', ' / ') + ' || ' + c['text'].replace('\n', ' ') + ' || ' + c['printedText'].replace('\n', ' ') for c in pool))
arts = ''
for p in glob.glob(os.path.join(HERE, 'raw', '*.txt')) + glob.glob(os.path.join(HERE, '..', 'raw', '*.txt')):
    if 'core-rules' not in p: arts += n(open(p, encoding='utf8', errors='ignore').read()) + ' || '
doc = open(os.path.join(HERE, '..', '..', 'mechanics-glossary.md'), encoding='utf8').read()
bad_rule = set(); nq = 0; miss = []; mism = []
for ln, line in enumerate(doc.split('\n'), 1):
    cited = set()
    for m in re.finditer(r'(?<![\w.-])(\d{3}(?:\.\d+)?(?:\.[a-z](?:\.\d+)?(?:\.[a-z])?)?)(?![\w])', line):
        r = m.group(1)
        if re.match(r'^[1-8]\d\d', r) and ('CR' in line or 'FACT' in line):
            pre = line[max(0, m.start() - 12):m.start()]
            if re.search(r'(OGN|OGS|SFD|UNL|VEN|RAD|TR|cost|n =|\d{4})[- ]?$', pre) or re.search(r'^(-\d|\s*names|\s*units| Main)', line[m.end():m.end() + 8]): continue
            cited.add(r)
            if r not in rules and not any(k.startswith(r + '.') for k in rules): bad_rule.add((ln, r))
    if line.startswith('  - **'): continue          # generated example line (text comes from pool.json)
    for q in re.findall(r'"([^"]{18,})"', line):
        nq += 1; qq = n(q).replace('\\|', '|')
        parts = [p.strip(' .,;') for p in re.split(r'\.\.\.|…| … ', qq) if len(p.strip()) > 8]
        def has(h): return all(p in h for p in parts)
        if has(crall):
            where = [k for k, v in nr.items() if all(p in v for p in parts)]
            if cited and where and not any(w == c or w.startswith(c + '.') or c.startswith(w + '.') for w in where for c in cited): mism.append((ln, q[:70], where[:4], sorted(cited)))
        elif has(cardall) or has(arts): pass
        else: miss.append((ln, q[:110]))
print('rules parsed', len(rules), 'quotes checked', nq)
print('cited rule numbers not in CR:', sorted(bad_rule))
print('quotes not found anywhere (%d):' % len(miss)); [print('  L%d: %s' % m) for m in miss]
print('CR quotes whose containing rule is not among the rules cited on the line (%d):' % len(mism)); [print('  L%d: %s -> in %s, cited %s' % m) for m in mism]
