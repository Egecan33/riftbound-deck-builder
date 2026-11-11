"""Side deck shape, categories and exposure over the Radiance-era Piltover Archive lists (10-card cap). Classes: lg2_data.classify."""
from lg2_data import *
R = [d for d in load_decks() if d.era == 'RAD']
S = [d for d in R if sum(d.side.values()) == 10]
print('RAD lists', len(R), 'with a 10-card side deck', len(S), 'legends', len({d.legend_short for d in S}))
slots = collections.Counter(q for d in S for q in d.side.values())
tot = sum(slots.values())
print('slots', tot, {k: f'{v} ({100*v/tot:.0f}%)' for k, v in sorted(slots.items())}, 'mean distinct cards', round(tot/len(S), 2))
extra = sum(q for d in S for n, q in d.side.items() if d.lib.get(n) or n == d.champ['name'])
print('copies that top up a main-deck card', extra, 'of', 10*len(S), f'{100*extra/(10*len(S)):.1f}%')
ty = collections.Counter()
for d in S:
    for n, q in d.side.items(): ty[d.card[n]['type']] += q
print('types', {k: f'{100*v/(10*len(S)):.1f}%' for k, v in ty.items()})
champ_alt = sum(1 for d in S if any(d.card[n]['type'] == 'unit' and 'champion' in str(d.card[n].get('superTypes', d.card[n].get('supertypes', ''))).lower() for n in d.side))
CATS = ['gear_hate', 'removal', 'counter', 'sweeper', 'hand_attack', 'protect', 'stun', 'draw', 'pump']
print('category | side decks with it | mean copies when present | share of side copies | main decks with it | mean main copies')
for c in CATS:
    has = [sum(q for n, q in d.side.items() if c in d.cls[n] and not (c == 'removal' and 'sweeper' in d.cls[n])) for d in S]
    main = [sum(q for n, q in d.lib.items() if c in d.cls[n] and not (c == 'removal' and 'sweeper' in d.cls[n])) for d in S]
    k = sum(1 for h in has if h)
    print(f'{c} | {k}/{len(S)} ({100*k/len(S):.0f}%) | {sum(has)/max(1,k):.2f} | {100*sum(has)/(10*len(S)):.1f}% | {sum(1 for m in main if m)}/{len(S)} | {sum(main)/len(S):.1f}')
top = collections.Counter(); topn = collections.Counter()
for d in S:
    for n, q in d.side.items(): top[n] += q; topn[n] += 1
print('most played side cards (lists, copies, classes):')
for n, q in top.most_common(18):
    c = NAME[n]; print(f'  {n} | {topn[n]} | {q} | {sorted(x for x in classify(c) if not x.startswith("t_"))} | {flat(c)[:110]}')
# exposure in main decks
g = [sum(q for n, q in d.lib.items() if d.card[n]['type'] == 'gear') for d in R]
u = [sum(q for n, q in d.lib.items() if d.card[n]['type'] == 'unit') for d in R]
sp = [sum(q for n, q in d.lib.items() if d.card[n]['type'] == 'spell') for d in R]
n = len(R)
print(f'main decks (n={n}): mean units {sum(u)/n:.1f}, spells {sum(sp)/n:.1f}, gear {sum(g)/n:.1f}; 4+ gear {100*sum(1 for x in g if x>=4)/n:.0f}%, 6+ gear {100*sum(1 for x in g if x>=6)/n:.0f}%, 22+ units {100*sum(1 for x in u if x>=22)/n:.0f}%, 14+ spells {100*sum(1 for x in sp if x>=14)/n:.0f}%')
# per-legend gear-hate copies vs field: does the slot follow the field? gear hate copies by placement class
for cls in ('win', 'top8', 'top64', 'bestof', 'event-only'):
    ds = [d for d in S if d.place == cls]
    if ds: print(f'  placement {cls}: n={len(ds)}, mean gear-hate side copies {sum(sum(q for n_, q in d.side.items() if "gear_hate" in d.cls[n_]) for d in ds)/len(ds):.2f}, mean counter {sum(sum(q for n_, q in d.side.items() if "counter" in d.cls[n_]) for d in ds)/len(ds):.2f}')
# rune splits
rs = collections.Counter(tuple(sorted(d.rune.values(), reverse=True)) for d in R)
print('rune splits', rs.most_common(6))
# who the side deck is aimed at: for the three most played legends, mean side copies that answer >=2.0 expected copies of each top legend
