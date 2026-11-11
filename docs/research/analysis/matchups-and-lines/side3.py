"""Domain-hate ('Decree') slots against the measured field share of each domain; corrected hand-attack and gear-hate counts."""
from lg2_data import *
import json
R = [d for d in load_decks() if d.era == 'RAD']; S = [d for d in R if sum(d.side.values()) == 10]
J = json.load(open(os.path.join(HERE, 'raw', 'rorg-matchups.json')))
field = collections.Counter()
for t in J['tournaments']:
    for f in t['field']:
        if f['key'] != 'legend-not-published': field[f['key']] += f['players'] or 0
tot = sum(field.values())
# legend key -> domains via our lists (legend_short lowercased, punctuation stripped, is the key prefix)
dom = {}
for d in R:
    k = re.sub(r"[^a-z]", '', d.legend_short.lower())
    dom.setdefault(k, set(x.lower() for x in d.legend.get('domains', [])))
share = collections.Counter(); unk = 0
for key, n in field.items():
    k2 = re.sub(r'[^a-z]', '', key)
    m = [v for k, v in dom.items() if k2.startswith(k)]
    if not m: unk += n; continue
    for x in m[0]: share[x] += n
print('players with a published legend', tot, 'not mapped to domains', unk)
print('share of players whose legend has the domain:', {k: f'{100*v/tot:.1f}%' for k, v in share.most_common()})
print('decree | text | side decks | side copies | main decks | main copies')
for n, c in sorted(NAME.items()):
    if n.startswith('Decree of'):
        sd = sum(1 for d in S if d.side.get(n)); sc = sum(d.side.get(n, 0) for d in S)
        md = sum(1 for d in S if d.lib.get(n)); mc = sum(d.lib.get(n, 0) for d in S)
        print(f'{n} | {flat(c)[:150]} | {sd}/{len(S)} | {sc} | {md} | {mc}')
HA = r'reveal their hand|[Tt]hey discard|discards'
GH = r'[Kk]ill (a|an|all|an enemy \w+ unit or)( \w+)* ?gear|banish it|Give a gear \[Temporary\]|\[Disarm|enemy gear'
for lab, rx in (('hand attack (corrected regex)', HA), ('gear hate (corrected regex)', GH)):
    has = [sum(q for n, q in d.side.items() if re.search(rx, flat(d.card[n]))) for d in S]
    main = [sum(q for n, q in d.lib.items() if re.search(rx, flat(d.card[n]))) for d in S]
    k = sum(1 for h in has if h)
    print(f'{lab}: side decks {k}/{len(S)} ({100*k/len(S):.0f}%), mean copies when present {sum(has)/max(1,k):.2f}, share of side copies {100*sum(has)/(10*len(S)):.1f}%, main decks with it {sum(1 for m in main if m)}, mean main copies {sum(main)/len(S):.2f}')
# by own legend: side copies of top-3 legends
for leg in ('Riven', "Kai'Sa", 'Kennen'):
    ds = [d for d in S if d.legend_short == leg]
    c = collections.Counter()
    for d in ds:
        for n, q in d.side.items(): c[n] += q
    print(leg, len(ds), 'lists; side (mean copies):', ', '.join(f'{n} {q/len(ds):.1f}' for n, q in c.most_common(9)))
print('decree | own domain | hits | eligible lists | eligible lists running it | mean copies when run | field share of the hit domain')
for n, c in sorted(NAME.items()):
    if n.startswith('Decree of'):
        own = [x.lower() for x in c.get('domains', [])]
        m = re.search(r'(Fury|Calm|Mind|Body|Chaos|Order)', flat(c)); hit = m.group(1).lower() if m else '?'
        el = [d for d in S if set(own) <= set(x.lower() for x in d.legend.get('domains', []))]
        run = [d for d in el if d.side.get(n) or d.lib.get(n)]
        print(f'{n} | {"/".join(own)} | {hit} | {len(el)} | {len(run)} ({100*len(run)/max(1,len(el)):.0f}%) | {sum(d.side.get(n,0)+d.lib.get(n,0) for d in run)/max(1,len(run)):.2f} | {100*share[hit]/tot:.1f}%')
