#!/usr/bin/env python3
"""Card pool loader for the legend-profile generator.

Primary input: GameLab data/cards/cards.json (canonical, built 2026-09-06).
Optional overlay: an official card-gallery snapshot (playriftbound.com __NEXT_DATA__ items) for
sets that are missing from cards.json (e.g. RAD) and for detecting text changes in older sets.
The gallery -> canonical conversion is a Python port of GameLab packages/cards/src/normalize/icons.ts
(richToPlain) and names.ts (normalizeName); it is deliberately minimal (no images, no printings list).
Stdlib only. Deterministic.
"""
import html as _html
import json
import re

DOMAINS = ['fury', 'calm', 'mind', 'body', 'chaos', 'order']


def _icon(m):
    raw = m.group(1)
    if raw == 'rb_might':
        return '[Might]'
    if raw == 'rb_exhaust':
        return '[Exhaust]'
    e = re.match(r'^rb_energy_(\d+)$', raw)
    if e:
        return '[%s]' % e.group(1)
    r = re.match(r'^rb_rune_([a-z]+)$', raw)
    if r:
        d = r.group(1)
        if d == 'rainbow':
            return '[Any]'
        if d in DOMAINS:
            return '[%s]' % d.capitalize()
    raise ValueError('unknown icon token ' + raw)


def rich_to_plain(rich):
    s = re.sub(r'\r?\n', ' ', rich or '')
    s = re.sub(r'<br\b[^>]*/?>', '\n', s, flags=re.I)
    s = re.sub(r'</p>', '\n', s, flags=re.I)
    s = re.sub(r'<p[^>]*>', '', s, flags=re.I)
    s = re.sub(r'<li[^>]*>', '\n- ', s, flags=re.I)
    s = re.sub(r'</li>', '\n', s, flags=re.I)
    s = re.sub(r'</?ul[^>]*>', '\n', s, flags=re.I)
    s = re.sub(r'</?(?:div|h[1-6]|ol|table|tr|td|th|blockquote|section)\b[^>]*>', '\n', s, flags=re.I)
    s = re.sub(r'<[^>]+>', ' ', s)
    s = _html.unescape(s).replace(' ', ' ')
    s = re.sub(r':(rb_[a-z0-9_]+):', _icon, s)
    s = s.replace('[NO TEXT]', '')
    lines = [re.sub(r'\s+', ' ', l).strip() for l in s.split('\n')]
    return '\n'.join(l for l in lines if l)


def normalize_name(name):
    s = re.sub(r'\s*//.*$', '', name)
    s = re.sub(r'\s*\([^)]*\)\s*$', '', s)
    s = s.lower().replace("'", '').replace('’', '')
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def _val(o, *path):
    for p in path:
        if o is None:
            return None
        o = o.get(p) if isinstance(o, dict) else None
    return o


def gallery_item_to_card(it):
    """One gallery printing -> minimal canonical record (same field names as cards.json)."""
    name = it['name'] + (', ' + it['subtitle'] if it.get('subtitle') else '')
    types = [t['id'] for t in (_val(it, 'cardType', 'type') or [])]
    supers = [t['id'] for t in (_val(it, 'cardType', 'superType') or [])]
    type_recovered = False
    if not types:
        # 15 gallery items had an empty cardType on 2026-11-11; the accessibility text still names the type
        m = re.match(r'^Riftbound (Unit|Spell|Gear|Battlefield|Legend|Rune)\b', _val(it, 'cardImage', 'accessibilityText') or '')
        if m:
            types, type_recovered = [m.group(1).lower()], True
    text = rich_to_plain(_val(it, 'text', 'richText', 'body') or '')
    effect = rich_to_plain(_val(it, 'effect', 'richText', 'body') or '')
    if effect:
        text = (text + '\n' + effect).strip() if text else effect
    pub = it['publicCode']
    code = pub.split('/')[0]
    return {
        'gameplayId': it['id'], 'cardCode': code, 'publicCode': pub, 'name': name,
        'set': _val(it, 'set', 'value', 'id'), 'collectorNumber': it.get('collectorNumber'),
        'type': types[0] if types else 'unknown', 'superTypes': supers,
        'domains': [d['id'] for d in (_val(it, 'domain', 'values') or [])],
        'tags': list(_val(it, 'tags', 'tags') or []),
        'energy': _val(it, 'energy', 'value', 'id'), 'power': _val(it, 'power', 'value', 'id'),
        'might': _val(it, 'might', 'value', 'id'), 'mightBonus': _val(it, 'mightBonus', 'value', 'id'),
        'rulesText': text, 'copyLimit': 3,
        # incomplete gallery record: type came from the accessibility text and the domain list cannot be trusted
        'galleryIncomplete': type_recovered,
    }


def _is_base_printing(card):
    """Base printing = plain numeric collector code not above the set size (RAD-149/167, not RAD-173/167 or RAD-149a)."""
    m = re.match(r'^[A-Z]+-(\d+)/(\d+)$', card.get('publicCode') or '')
    return bool(m) and int(m.group(1)) <= int(m.group(2))


def load_pool(cards_json, gallery_json=None):
    """Returns (cards, meta). cards = canonical list, each with a 'source' field and 'printingCodes'."""
    d = json.load(open(cards_json, encoding='utf-8'))
    cards = []
    for c in d['cards']:
        c = dict(c)
        c['source'] = 'cards.json@' + d['builtAt'][:10]
        c['printingCodes'] = sorted({p['cardCode'] for p in c.get('printings', [])} | {c['cardCode']})
        for k in ('printings', 'image', 'rulesTextRich', 'flavorText', 'artist', 'slug', 'rarity'):
            c.pop(k, None)
        cards.append(c)
    meta = {'cardsJsonBuiltAt': d['builtAt'], 'cardsJsonCount': len(cards), 'galleryFetchedAt': None,
            'gallerySetsAdded': [], 'galleryCardsAdded': 0, 'textChangedSinceCardsJson': []}
    if not gallery_json:
        return cards, meta
    g = json.load(open(gallery_json, encoding='utf-8'))
    meta['galleryFetchedAt'] = g.get('fetchedAt')
    known_sets = {c['set'] for c in cards}
    by_code = {}
    for c in cards:
        for pc in c['printingCodes']:
            by_code[pc] = c
    groups = {}
    for it in g['items']:
        rec = gallery_item_to_card(it)
        if rec['set'] in known_sets:
            old = by_code.get(rec['cardCode'])
            if old is None and rec['type'] != 'unknown':
                # a printing code cards.json does not list (e.g. alternate-art runes UNL-R02a): attach by name + type
                for c in cards:
                    if c['type'] == rec['type'] and normalize_name(c['name']) == normalize_name(rec['name']):
                        if rec['cardCode'] not in c['printingCodes']:
                            c['printingCodes'] = sorted(c['printingCodes'] + [rec['cardCode']])
                        by_code[rec['cardCode']] = c
                        break
            if old is not None and _is_base_printing(rec) and old['cardCode'] == rec['cardCode'] \
                    and rec['rulesText'] != old['rulesText'] and 'token' not in old['superTypes']:
                meta['textChangedSinceCardsJson'].append(
                    {'cardCode': rec['cardCode'], 'name': old['name'], 'old': old['rulesText'], 'new': rec['rulesText']})
            continue
        if rec['type'] == 'unknown':
            continue  # helper pseudo-cards (Buff, XP Tracker)
        if rec['galleryIncomplete']:
            meta.setdefault('galleryIncompleteCards', []).append(
                {'cardCode': rec['cardCode'], 'name': rec['name'], 'typeFromAccessibilityText': rec['type'], 'domains': rec['domains']})
        same = [c for c in cards if c['type'] == rec['type'] and normalize_name(c['name']) == normalize_name(rec['name'])]
        if same and same[0]['source'].startswith('cards.json'):
            # reprint of an existing gameplay card in the new set (e.g. the six basic runes): one more printing code
            if rec['cardCode'] not in same[0]['printingCodes']:
                same[0]['printingCodes'] = sorted(same[0]['printingCodes'] + [rec['cardCode']])
            by_code[rec['cardCode']] = same[0]
            continue
        groups.setdefault((rec['set'], normalize_name(rec['name']), rec['type']), []).append(rec)
    for key in sorted(groups):
        prints = sorted(groups[key], key=lambda r: (not _is_base_printing(r), r['collectorNumber'] or 0, r['cardCode']))
        base = dict(prints[0])
        base['printingCodes'] = sorted({p['cardCode'] for p in prints})
        base['source'] = 'gallery@' + str(g.get('fetchedAt'))
        base.pop('publicCode', None)
        cards.append(base)
        meta['galleryCardsAdded'] += 1
        if base['set'] not in meta['gallerySetsAdded']:
            meta['gallerySetsAdded'].append(base['set'])
    return cards, meta


if __name__ == '__main__':
    import sys
    cards, meta = load_pool(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
    from collections import Counter
    print(len(cards), Counter(c['set'] for c in cards))
    print({k: (v if not isinstance(v, list) or k == 'gallerySetsAdded' else len(v)) for k, v in meta.items()})
