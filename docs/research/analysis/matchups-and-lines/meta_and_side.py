"""DATA tables for matchups-and-lines.md: legend field, per-legend inclusion, sideboard statistics.
Dataset: GameLab data/decks/samples/piltover-archive-2026-09-06.json (n=59 lists, piltoverarchive.com, 2026-09-06).
Run: python3 meta_and_side.py > out/meta_and_side.txt
"""
from common import *

cards, by = load_cards()
decks = load_decks(by)
n = len(decks)


def copies(lst):
    return sum(k for _, k in lst)


print(f'# lists={n}')
legs = collections.Counter(d['legend']['name'] if d['legend'] else '?' for d in decks)
# group by champion tag (legend tags) so alt-art legends merge
def champ_tag(d):
    return (d['legend'].get('tags') or ['?'])[0] if d['legend'] else '?'
tagc = collections.Counter(champ_tag(d) for d in decks)
print('## field by legend champion tag (count, share)')
for t, k in tagc.most_common():
    print(f'{t}\t{k}\t{pct(k / n)}')

# ---------------- sideboard stats
print('\n## sideboard size distribution', dict(collections.Counter(copies(d['side']) for d in decks)))
slot_sizes = collections.Counter(k for d in decks for _, k in d['side'])
print('copies per sideboard slot (1-of/2-of/3-of):', dict(slot_sizes))
print('distinct cards per sideboard: mean %.2f' % (sum(len(d['side']) for d in decks) / n))
ext = 0; tot = 0; types = collections.Counter()
for d in decks:
    mainset = {c['cardCode'] for c, _ in d['main']}
    for c, k in d['side']:
        tot += k
        types[c['type']] += k
        if c['cardCode'] in mainset:
            ext += k
print(f'side copies that are extra copies of a main-deck card: {ext}/{tot} = {pct(ext / tot)}')
print('side copies by type:', dict(types), {t: pct(v / tot) for t, v in types.items()})
print('side energy cost mean %.2f vs main %.2f' % (
    sum(E(c) * k for d in decks for c, k in d['side']) / tot,
    sum(E(c) * k for d in decks for c, k in d['main']) / sum(copies(d['main']) for d in decks)))

CATS = ['gear_hate', 'counter', 'sweeper', 'removal', 'hand_attack', 'protect', 'displace', 'stun', 'draw', 'pump', 'ramp']
print('\n## sideboard categories: lists with >=1 slot, mean copies among those lists, share of all side copies; same for main')
print('category\tside_lists\tside_mean_copies\tside_share\tmain_lists\tmain_mean_copies')
for cat in CATS:
    sl = [sum(k for c, k in d['side'] if cat in classify(c)) for d in decks]
    ml = [sum(k for c, k in d['main'] if cat in classify(c)) for d in decks]
    sn = [x for x in sl if x]; mn = [x for x in ml if x]
    print(f'{cat}\t{len(sn)}/{n}\t{(sum(sn) / len(sn) if sn else 0):.2f}\t{pct(sum(sl) / tot)}\t{len(mn)}/{n}\t{(sum(mn) / len(mn) if mn else 0):.2f}')
unit_side = [sum(k for c, k in d['side'] if c['type'] == 'unit') for d in decks]
print('units in side: mean %.2f' % (sum(unit_side) / n))

print('\n## top sideboard cards (lists, total copies, classes, text)')
sc = collections.Counter(); scc = collections.Counter()
for d in decks:
    for c, k in d['side']:
        sc[c['name']] += 1; scc[c['name']] += k
name2 = {c['name']: c for c in cards}
for nm, k in sc.most_common(22):
    c = name2[nm]
    print(f"{nm}\t{c['cardCode']}\t{k}/{n}\t{scc[nm]}\t{'/'.join(c['domains'])}\t{','.join(sorted(x for x in classify(c) if not x.startswith('t_')))}\t{strip_reminder(text(c))[:150].strip()}")

# ---------------- what does the field expose to each hate category
print('\n## field exposure (share of lists whose MAIN deck is vulnerable)')
gear_ct = [sum(k for c, k in d['main'] if c['type'] == 'gear') for d in decks]
spell_ct = [sum(k for c, k in d['main'] if c['type'] == 'spell') for d in decks]
unit_ct = [sum(k for c, k in d['main'] if c['type'] == 'unit') for d in decks]
small = [sum(k for c, k in d['main'] if c['type'] == 'unit' and (c.get('might') or 0) <= 3) for d in decks]
big = [sum(k for c, k in d['main'] if c['type'] == 'unit' and (c.get('might') or 0) >= 5) for d in decks]
for lab, arr, thr in [('gear copies>=4', gear_ct, 4), ('gear copies>=6', gear_ct, 6), ('spell copies>=14', spell_ct, 14),
                      ('unit copies>=22', unit_ct, 22), ('units with Might<=3 >=12 copies', small, 12), ('units with Might>=5 >=8 copies', big, 8)]:
    print(f'{lab}\t{sum(1 for x in arr if x >= thr)}/{n}\t{pct(sum(1 for x in arr if x >= thr) / n)}')
print('mean main composition: units %.1f spells %.1f gear %.1f' % (sum(unit_ct) / n, sum(spell_ct) / n, sum(gear_ct) / n))
print('gear-hate copies main+side per list: mean %.2f; lists with any: %d/%d' % (
    sum(sum(k for c, k in d['main'] + d['side'] if 'gear_hate' in classify(c)) for d in decks) / n,
    sum(1 for d in decks if any('gear_hate' in classify(c) for c, _ in d['main'] + d['side'])), n))

# ---------------- rune splits
print('\n## rune splits (two-domain legends)')
splits = collections.Counter()
for d in decks:
    cnt = collections.Counter()
    for c, k, code in d['runes']:
        if c: cnt[c['domains'][0]] += k
    if sum(cnt.values()) == 12:
        splits[tuple(sorted(cnt.values(), reverse=True))] += 1
print(dict(splits))
# correlation: power demand share vs rune share for the first domain
rows = []
for d in decks:
    cnt = collections.Counter()
    for c, k, code in d['runes']:
        if c: cnt[c['domains'][0]] += k
    if sum(cnt.values()) != 12 or len(cnt) != 2: continue
    dem = collections.Counter()
    for c, k in d['main']:
        if P(c) and len(c['domains']) == 1:
            dem[c['domains'][0]] += P(c) * k
    (a, ra), (b, rb) = cnt.most_common()
    if dem[a] + dem[b] == 0: continue
    rows.append((ra / 12, dem[a] / (dem[a] + dem[b])))
mx = sum(x for x, _ in rows) / len(rows); my = sum(y for _, y in rows) / len(rows)
cov = sum((x - mx) * (y - my) for x, y in rows); vx = sum((x - mx) ** 2 for x, _ in rows); vy = sum((y - my) ** 2 for _, y in rows)
print(f'lists usable={len(rows)}; majority-rune share mean {mx:.3f}; majority-domain power-demand share mean {my:.3f}; Pearson r={cov / math.sqrt(vx * vy):.2f}')
agree = sum(1 for x, y in rows if (y >= 0.5))
print(f'lists where the majority rune is also the majority power-demand domain: {agree}/{len(rows)}')
