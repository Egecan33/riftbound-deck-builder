"""Serial fetch of riftbound.org tournament pages; keeps only the legend-vs-legend matchup cells and the field table.
No player data is stored. robots.txt of riftbound.org: Allow: / (see ../meta-sources/raw/robots-riftbound.org.txt).
usage: python3 fetch_matrix.py [since=2026-10-23]   -> raw/rorg-matchups.json"""
import re, json, sys, time, html, os, urllib.request, datetime
UA = 'Mozilla/5.0 (compatible; deck-research/1.0)'
HERE = os.path.dirname(os.path.abspath(__file__))
SINCE = (sys.argv[1].split('=')[1] if len(sys.argv) > 1 else '2026-10-23')

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'text/html'})
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            return r.status, r.read().decode('utf-8', 'ignore')
    except urllib.error.HTTPError as e:
        return e.code, ''
    except Exception as e:
        return 0, str(e)

def props(h):
    m = re.search(r'<script data-page="app" type="application/json">(.*?)</script>', h, re.S)
    return json.loads(m.group(1))['props'] if m else None

tours, page = [], 1
while True:
    st, h = get(f'https://riftbound.org/meta/tournaments?page={page}')
    p = props(h) if st == 200 else None
    if not p:
        print('list page', page, st); break
    rows = p['tournaments']
    tours += rows
    print('list page', page, len(rows), rows[-1]['date'] if rows else None)
    if not rows or rows[-1]['date'] < SINCE or page >= 8:
        break
    page += 1; time.sleep(2)
out = {'fetched': str(datetime.date.today()), 'since': SINCE, 'source': 'https://riftbound.org/meta/tournaments/{slug}', 'tournaments': []}
for t in tours:
    if t['date'] < SINCE:
        continue
    time.sleep(2)
    st, h = get('https://riftbound.org/meta/tournaments/' + t['slug'])
    if st in (429,) or st >= 500:
        print('STOP', st); break
    p = props(h) if st == 200 else None
    if not p:
        print(t['slug'], st, 'no props'); continue
    mu = p.get('matchups') or {}
    tt = p.get('tournament') or {}
    out['tournaments'].append({
        'slug': t['slug'], 'date': t['date'], 'kind': tt.get('kind'), 'format': tt.get('format'), 'players': tt.get('players'),
        'decks': tt.get('decks'), 'matches': tt.get('matches'),
        'field': [{k: f.get(k) for k in ('key', 'players', 'share', 'cut', 'wins', 'losses', 'draws')} for f in (p.get('field') or [])],
        'legends': [{'key': l.get('key'), 'players': l.get('players')} for l in (mu.get('legends') or [])],
        'cells': mu.get('cells') or {}})
    print(t['slug'], st, tt.get('players'), tt.get('matches'), len(mu.get('legends') or []))
json.dump(out, open(os.path.join(HERE, 'raw', 'rorg-matchups.json'), 'w'))
print('tournaments', len(out['tournaments']))
