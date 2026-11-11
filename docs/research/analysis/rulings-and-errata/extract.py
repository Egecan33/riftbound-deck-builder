#!/usr/bin/env python3
"""Turn each raw/<name>.html article into raw/<name>.txt (plain text with light structure) and print a manifest.
Run: python3 -I extract.py"""
import re, json, html, os, hashlib, sys
here = os.path.dirname(os.path.abspath(__file__))
raw = os.path.join(here, 'raw')
def to_text(h):
    h = re.sub(r'<img[^>]*alt="([^"]*)"[^>]*>', lambda m: f'[img:{m.group(1)}]', h)
    h = re.sub(r'<img[^>]*>', '[img]', h)
    h = re.sub(r'<h([1-6])[^>]*>', lambda m: '\n\n' + '#' * int(m.group(1)) + ' ', h)
    h = re.sub(r'</h[1-6]>', '\n\n', h)
    h = re.sub(r'<li[^>]*>', '\n- ', h)
    h = re.sub(r'<(br|/p|/div|/tr|/ul|/ol|/blockquote|hr)[^>]*>', '\n', h)
    h = re.sub(r'</t[dh]>', ' | ', h)
    h = re.sub(r'<(strong|b)>', '**', h); h = re.sub(r'</(strong|b)>', '**', h)
    h = re.sub(r'<(em|i)>', '_', h); h = re.sub(r'</(em|i)>', '_', h)
    h = re.sub(r'<a [^>]*href="([^"]*)"[^>]*>(.*?)</a>', lambda m: f'{m.group(2)} <{m.group(1)}>' if 'cms.riotgames' not in m.group(1) else m.group(2), h, flags=re.S)
    h = re.sub(r'<[^>]+>', '', h)
    h = html.unescape(h).replace('\xa0', ' ')
    h = re.sub(r'[ \t]+\n', '\n', h); h = re.sub(r'\n{3,}', '\n\n', h)
    return h.strip()
man = []
for f in sorted(os.listdir(raw)):
    if not f.endswith('.html'): continue
    s = open(os.path.join(raw, f), encoding='utf-8').read()
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', s, re.S)
    if not m: continue
    page = json.loads(m.group(1))['props']['pageProps']['page']
    if page.get('type') != 'article': continue
    bodies = []
    for b in page['blades']:
        if b.get('type') == 'articleRichText': bodies.append(to_text(b['richText']['body']))
        elif b.get('type') == 'articleRichTextAccordion':
            hd = b.get('header') or {}
            out = []
            if hd.get('title'): out.append('# ' + hd['title'])
            if hd.get('subtitle'): out.append('## ' + hd['subtitle'])
            for g in b.get('groups', []):
                out.append('**' + to_text(g.get('label', '')) + '**')
                out.append(to_text((g.get('content') or {}).get('body', '')))
            bodies.append('\n\n'.join(out))
        elif b.get('type') not in ('riotbar', 'articleMasthead', 'articleCardCarousel'): bodies.append(f"[blade:{b.get('type')}] " + json.dumps(b)[:400])
    txt = f"TITLE: {page['title']}\nURL: {page['url']}\nPUBLISHED: {page.get('displayedPublishDate')}\nREV: {page.get('analytics',{}).get('rev')}\n\n" + '\n\n'.join(bodies)
    open(os.path.join(raw, f[:-5] + '.txt'), 'w', encoding='utf-8').write(txt)
    man.append(dict(name=f[:-5], title=page['title'], url=page['url'], published=page.get('displayedPublishDate'), rev=page.get('analytics',{}).get('rev'), chars=len(txt), sha256=hashlib.sha256(txt.encode()).hexdigest()[:16]))
json.dump(man, open(os.path.join(here, 'manifest.json'), 'w'), indent=1)
for x in man: print(x['name'], x['published'], x['chars'], x['title'])
