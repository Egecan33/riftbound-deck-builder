"""Deterministic example picker: for a list of matching cards, prefer main-deck cards, vary card type, then shortest text."""
def pick(cards, n=3, prefer=None):
    cs = [c for c in cards if not c['token'] and not c['rune']]
    byname = {c['name']: c for c in cs}; out = []
    for p in (prefer or []):
        if p in byname and byname[p] not in out: out.append(byname[p])
    cs = sorted(cs, key=lambda c: (not c['main'], len(c['text']), c['name']))
    seen = {c['type'] for c in out}
    for c in cs:                      # first pass: new types
        if len(out) >= n: break
        if c not in out and c['type'] not in seen: out.append(c); seen.add(c['type'])
    for c in cs:
        if len(out) >= n: break
        if c not in out: out.append(c)
    return out[:n]
def fmt(c):
    cost = '' if c['energy'] is None else ' · cost %s%s' % (c['energy'], ('+%s power' % c['power']) if c.get('power') else '')
    might = '' if c['might'] is None else (' · %s Might bonus' % (c.get('mightBonus') or ('+%s' % c['might'])) if c['type'] == 'gear' else ' · %s Might' % c['might'])
    err = ' · **errata text** (%s errata)' % c['errata']['source'] if c['errata'] and c['errata'].get('applied', True) else ''
    return '**%s** (%s, %s%s%s%s): "%s"' % (c['name'], c['code'], c['type'], cost, might, err, c['text'].replace('\n', ' / '))
