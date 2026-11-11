"""Print the text of rule numbers from both Core Rules editions so every citation in the document can be checked.
usage: python3 rules_show.py old|new NUM [NUM...]   (prefix match with trailing '*' prints the subtree)"""
import re, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
OLD = open(os.path.expanduser('~/github_repositories/GameLab/data/rules/core-rules.md')).read()
NEW = open(os.path.join(HERE, '..', 'raw', 'core-rules-2026-10-09.compact.txt')).read()
def index(txt, old):
    d = {}
    rx = re.compile(r'^(?:## |\s*- \*\*)(\d{3}(?:\.[0-9a-z]+)*)\.(?:\*\*)? (.+)$', re.M) if old else re.compile(r'^\s*(\d{3}(?:\.[0-9a-z]+)*)\.\s+(.+)$', re.M)
    for m in rx.finditer(txt):
        d.setdefault(m.group(1), m.group(2).strip())
    return d
IDX = {'old': index(OLD, True), 'new': index(NEW, False)}
if __name__ == '__main__':
    ed = sys.argv[1]; W = 260
    for n in sys.argv[2:]:
        if n.endswith('*'):
            for k, v in IDX[ed].items():
                if k == n[:-1] or k.startswith(n[:-1] + '.'): print(f'{k}: {v[:W]}')
        else:
            print(f'{n}: {(IDX[ed].get(n) or "NOT FOUND")[:W]}')
