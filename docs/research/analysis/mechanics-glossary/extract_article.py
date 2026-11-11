"""Extract the main rich-text body of a playriftbound.com news article (__NEXT_DATA__) to plain text."""
import re, html, json, sys
def article_text(path):
    s = open(path, encoding='utf8').read()
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', s, re.S)
    j = json.loads(m.group(1)); out = []
    def walk(o):
        if isinstance(o, dict):
            if o.get('type') == 'html' and 'body' in o: out.append(o['body'])
            for v in o.values(): walk(v)
        elif isinstance(o, list):
            for v in o: walk(v)
    walk(j)
    parts = []
    for t in out:
        if len(t) < 400: continue
        t = re.sub(r'<br\s*/?>', '\n', t); t = re.sub(r'</(p|h\d|li|div|tr)>', '\n', t)
        parts.append(html.unescape(re.sub(r'<[^>]+>', '', t)))
    return '\n'.join(parts)
if __name__ == '__main__':
    for src, dst in zip(sys.argv[1::2], sys.argv[2::2]):
        t = article_text(src); open(dst, 'w', encoding='utf8').write(t); print(dst, len(t))
