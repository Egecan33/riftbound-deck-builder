"""Serial, polite fetch of community guide pages to raw/guide-<slug>.txt (text only, headed with URL + date + status).
Checks robots.txt for the generic agent AND for AI-agent names; a site that disallows AI agents by name is skipped.
usage: python3 fetch_guides.py slug=url [slug=url ...]"""
import sys, re, html, time, urllib.request, urllib.robotparser, urllib.parse, os, datetime
UA = 'Mozilla/5.0 (compatible; deck-research/1.0)'
HERE = os.path.dirname(os.path.abspath(__file__))
def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'text/html,*/*'})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status, r.read().decode('utf-8', 'ignore')
    except urllib.error.HTTPError as e:
        return e.code, ''
    except Exception as e:
        return 0, str(e)
def allowed(url):
    p = urllib.parse.urlparse(url); base = f'{p.scheme}://{p.netloc}'
    st, body = get(base + '/robots.txt')
    if st != 200: return True, f'robots {st}'
    rp = urllib.robotparser.RobotFileParser(); rp.parse(body.splitlines())
    ok = all(rp.can_fetch(a, url) for a in ('*', 'anthropic-ai', 'Claude-Web', 'ClaudeBot'))
    return ok, 'robots ok' if ok else 'robots disallow (generic or AI agent)'
def text(h):
    h = re.sub(r'<script.*?</script>|<style.*?</style>|<nav.*?</nav>|<footer.*?</footer>', ' ', h, flags=re.S)
    h = re.sub(r'<(br|/p|/h\d|/li|/tr|/div)[^>]*>', '\n', h)
    h = html.unescape(re.sub(r'<[^>]+>', ' ', h))
    return re.sub(r'\n\s*\n+', '\n', re.sub(r'[ \t]+', ' ', h)).strip()
for a in sys.argv[1:]:
    slug, url = a.split('=', 1)
    ok, why = allowed(url)
    if not ok:
        print(slug, 'SKIP', why); continue
    time.sleep(2)
    st, body = get(url)
    t = text(body) if st == 200 else ''
    open(os.path.join(HERE, 'raw', f'guide-{slug}.txt'), 'w').write(f'URL: {url}\nFETCHED: {datetime.date.today()}\nSTATUS: {st}\n\n{t}')
    print(slug, st, len(t), why)
    time.sleep(2)
