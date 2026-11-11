"""Build the mechanics-glossary card pool: one record per distinct card name from the official gallery snapshot
(../cards-2026-11-11.json, built by ../build-cards.mjs from the gallery fetched 2026-11-11), with official errata applied.
Read-only inputs; writes pool.json next to this script."""
import json, re, os, collections
HERE = os.path.dirname(os.path.abspath(__file__))
SET_ORDER = ['OGN', 'OGS', 'SFD', 'UNL', 'VEN', 'RAD']
ERRATA = [('origins', 'https://riftbound.leagueoflegends.com/en-us/news/rules-and-releases/riftbound-origins-card-errata/'),
          ('spiritforged', 'https://riftbound.leagueoflegends.com/en-us/news/rules-and-releases/riftbound-spiritforged-errata/'),
          ('unleashed', 'https://playriftbound.com/en-us/news/rules-and-releases/unleashed-errata-updates/'),
          ('vendetta', 'https://playriftbound.com/en-us/news/announcements/vendetta-errata-updates/'),
          ('radiance', 'https://playriftbound.com/en-us/news/announcements/radiance-errata-updates/')]
DOMS = 'Fury|Calm|Mind|Body|Chaos|Order'
def norm(t):
    """Notation-neutral form used only to compare gallery text with errata text."""
    t = t.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"').replace('—', '-').replace('–', '-')
    t = re.sub(r'\[Rainbow\]', '[A]', t); t = re.sub(r'\[Exhaust\]', '[E]', t); t = re.sub(r'\[Might\]', '[M]', t)
    t = re.sub(r'\[(%s)\]' % DOMS, '[C]', t); t = re.sub(r'\[[RGBOPY]\]', '[C]', t)
    t = re.sub(r'\([^)]*\)', ' ', t)            # reminder text is not part of the comparison
    t = re.sub(r'\[>\]|\[>>\]|-', ' ', t)
    return re.sub(r'[^a-z0-9\[\]+]+', ' ', t.lower()).strip()
def parse_errata(path):
    lines = [l.strip() for l in open(path, encoding='utf8').read().split('\n')]
    lines = [l for l in lines if l]
    out = {}; i = 0
    while i < len(lines):
        if lines[i].startswith('[NEW TEXT]') and i > 0:
            name = lines[i - 1]; j = i + 1; new = []
            first = lines[i][len('[NEW TEXT]'):].strip()
            if first: new.append(first)
            while j < len(lines) and not lines[j].startswith('▲') and not lines[j].startswith('[OLD TEXT]'): new.append(lines[j]); j += 1
            while j < len(lines) and not lines[j].startswith('[OLD TEXT]'): j += 1
            k = j + 1; old = []
            while k < len(lines) and not (k + 1 < len(lines) and lines[k + 1].startswith('[NEW TEXT]')): old.append(lines[k]); k += 1
            old = [l for l in old if not re.match(r'^(Origins|Spiritforged|Unleashed|Vendetta|Radiance|Proving Grounds|Arcane)?\s*(Box Set)?\s*Cards$', l)]
            out[name.replace('’', "'")] = {'new': '\n'.join(new), 'old': '\n'.join(old)}
            i = k
        else: i += 1
    return out
def alt_types():
    """Card type as stated by the gallery's own image alt text ("Riftbound Spell: Abandon. ..."). On 2026-11-11 the structured
    cardType field was wrong or empty for 36 Radiance printings; the alt text agrees with Might/keywords in every such case."""
    html = open(os.path.join(HERE, '..', 'raw', 'gallery-2026-11-11.html'), encoding='utf8').read()
    a = html.index('<script id="__NEXT_DATA__"'); b = html.index('>', a) + 1; e = html.index('</script>', b)
    blades = json.loads(html[b:e])['props']['pageProps']['page']['blades']
    items = next(x for x in blades if isinstance(x.get('cards'), dict) and x['cards'].get('items'))['cards']['items']
    out = {}
    for it in items:
        m = re.match(r'^([A-Z0-9]+)-([A-Z]*\d+)', it['publicCode'])
        t = re.match(r'Riftbound ([A-Za-z]+): ', (it.get('cardImage') or {}).get('accessibilityText') or '')
        if m and t and t.group(1).lower() in ('unit', 'spell', 'gear', 'legend', 'battlefield', 'rune'): out.setdefault(m.group(1) + '-' + m.group(2), t.group(1).lower())
    return out
def gtxt(h):
    """Same HTML -> text conversion as ../build-cards.mjs."""
    h = re.sub(r'<br\s*/?>', '\n', h or ''); h = re.sub(r'</p>\s*<p>', '\n', h); h = re.sub(r'<[^>]+>', '', h)
    h = h.replace(':rb_might:', '[Might]').replace(':rb_exhaust:', '[Exhaust]'); h = re.sub(r':rb_energy_(\d+):', r'[\1]', h)
    h = re.sub(r':rb_rune_(\w+):', lambda m: '[' + m.group(1)[0].upper() + m.group(1)[1:] + ']', h)
    for a, b in (('&amp;', '&'), ('&#x27;', "'"), ('&#39;', "'"), ('&quot;', '"'), ('&gt;', '>'), ('&lt;', '<'), ('&nbsp;', ' ')): h = h.replace(a, b)
    return h.strip()
def effect_texts():
    """Equipment Effect Text (CR 136) and Might Bonus (CR 137) live in separate gallery fields ('effect', 'mightBonus') that
    ../build-cards.mjs does not read. Returned per base code so the pool text can carry them."""
    html = open(os.path.join(HERE, '..', 'raw', 'gallery-2026-11-11.html'), encoding='utf8').read()
    a = html.index('<script id="__NEXT_DATA__"'); b = html.index('>', a) + 1; e = html.index('</script>', b)
    blades = json.loads(html[b:e])['props']['pageProps']['page']['blades']
    items = next(x for x in blades if isinstance(x.get('cards'), dict) and x['cards'].get('items'))['cards']['items']
    out = {}
    for it in items:
        m = re.match(r'^([A-Z0-9]+)-([A-Z]*\d+)', it['publicCode'])
        if not m: continue
        eff = gtxt(((it.get('effect') or {}).get('richText') or {}).get('body'))
        mb = ((it.get('mightBonus') or {}).get('value') or {}).get('label')
        if eff or mb: out.setdefault(m.group(1) + '-' + m.group(2), {'effect': eff, 'mightBonus': mb})
    return out
def build():
    src = json.load(open(os.path.join(HERE, '..', 'cards-2026-11-11.json')))
    alt = alt_types(); eff = effect_texts()
    by = collections.OrderedDict()
    for c in src['cards']: by.setdefault(c['name'], []).append(c)
    errata = {}
    for key, url in ERRATA:
        for name, e in parse_errata(os.path.join(HERE, 'raw', key + '-errata.txt')).items():
            e['source'] = key; e['url'] = url; errata[name] = e   # later articles win
    pool = []; log = []
    for name, ps in by.items():
        ps = sorted(ps, key=lambda c: (SET_ORDER.index(c['set']), c['code']))
        canon = max(ps, key=lambda c: len(c['text']))                     # printing that carries the reminder text
        rec = {k: canon[k] for k in ('name', 'type', 'superTypes', 'domains', 'energy', 'power', 'might', 'tags', 'text')}
        rec['code'] = canon['code']; rec['codes'] = [c['code'] for c in ps]; rec['firstSet'] = ps[0]['set']; rec['sets'] = sorted({c['set'] for c in ps}, key=SET_ORDER.index)
        rec['printedText'] = canon['text']; rec['errata'] = None
        # Gallery data error (seen 2026-11-11): some RAD rows carry a Might value but are typed 'spell'. CR 143.2: only units have Might; gear Might bonus is on Equipment.
        at = alt.get(canon['code'])
        if at and at != rec['type']: rec['typeFixed'] = '%s->%s (gallery alt text)' % (canon['type'], at); rec['type'] = at
        if rec['type'] == 'spell' and rec['might'] is not None: rec['typeFixed'] = 'spell->unit (has Might)'; rec['type'] = 'unit'
        e = errata.get(name.replace('’', "'"))
        if not e:   # gallery names signature spells "Name, Champion" and legends by title only; errata uses "Name" / "Champion, Title"
            for en, ev in errata.items():
                if name.startswith(en + ', ') and 'signature' in canon['superTypes'] or (canon['type'] == 'legend' and en.endswith(', ' + name)): e = ev; ev['matched'] = True
        if e:
            g = norm(canon['text']); n = norm(e['new']); o = norm(e['old'])
            status = 'gallery=new' if g == n else 'gallery=old' if g == o else 'gallery=neither'
            log.append((name, e['source'], status))
            if status != 'gallery=new':
                rec['text'] = e['new']; rec['errata'] = {'source': e['source'], 'url': e['url'], 'galleryStatus': status}
            else: rec['errata'] = {'source': e['source'], 'url': e['url'], 'galleryStatus': status, 'applied': False}
        ef = next((eff[c] for c in rec['codes'] if c in eff and eff[c]['effect']), None) or eff.get(rec['code'])
        rec['effectText'] = (ef or {}).get('effect') or None; rec['mightBonus'] = (ef or {}).get('mightBonus')
        if rec['effectText']:      # appended on its own line so detectors see it; never counted as a keyword the gear itself "owns"
            rec['text'] = rec['text'] + '\nEffect text (active only while attached, CR 136): ' + rec['effectText'].replace('\n', ' ')
        pool.append(rec)
    missing = [n for n in errata if n not in {r['name'].replace('’', "'") for r in pool} and not errata[n].get('matched')]
    return pool, log, missing
if __name__ == '__main__':
    pool, log, missing = build()
    json.dump({'source': 'https://playriftbound.com/en-us/card-gallery/', 'fetched': '2026-11-11', 'cards': pool}, open(os.path.join(HERE, 'pool.json'), 'w'), ensure_ascii=False, indent=0)
    print('names', len(pool)); print(collections.Counter(s for _, _, s in log)); print('errata names not in pool:', missing)
    for l in log: print(l)
