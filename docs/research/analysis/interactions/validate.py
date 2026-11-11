#!/usr/bin/env python3
"""Validation of the interaction graph against real deck lists and community co-mentions.

Inputs (read-only):
  out/edges.json, out/facets.json                      (build_graph.py)
  ../raw/pa-decks.jsonl                                (Piltover Archive decks fetched 2026-11-11 by the deck-theory workflow)
  GameLab data/decks/samples/piltover-archive-2026-09-06.json  (60 lists, September 2026)
  data/community/rgg-comentions.json                   (riftbound.gg paragraphs that name 2+ cards)
Output: out/validation.json and a printed summary.  Run: python3 validate.py
Deterministic: fixed seed 20261111.
"""
import json, os, re, random, math
from collections import defaultdict, Counter
from itertools import combinations

HERE = os.path.dirname(os.path.abspath(__file__))
GAMELAB = os.environ.get('GAMELAB', os.path.expanduser('~/github_repositories/GameLab'))
random.seed(20261111)

facets = json.load(open(os.path.join(HERE, 'out/facets.json')))
E = json.load(open(os.path.join(HERE, 'out/edges.json')))
edges, nonbos = E['edges'], E['nonbos']

def base(code):
    m = re.match(r'([A-Z]+-[A-Z]*\d+)', code or '')
    return m.group(1) if m else code
def nkey(name): return re.sub(r'[^a-z0-9]', '', (name or '').lower())

# canonical node = first graph code carrying that name (reprints share a name: Tournament Rules 601.2.a treats them as one card)
canon_by_name = {}; canon_by_base = {}
for code, f in facets.items():
    canon_by_name.setdefault(nkey(f['name']), code)
for code, f in facets.items():
    canon_by_base.setdefault(base(code), canon_by_name[nkey(f['name'])])
# Piltover Archive numbers legends differently from the gallery for some printings (e.g. PA "RAD-153" = "Evelynn, Agony's Embrace";
# gallery RAD-175 "Agony's Embrace", tag Evelynn), so legends are matched by "<champion tag>, <legend name>" first.
cards_meta = {c['cardCode']: c for c in json.load(open(os.path.join(GAMELAB, 'data/cards/cards.json')))['cards']}
rad_meta = {c['code']: c for c in json.load(open(os.path.join(HERE, 'data/rad-cards.json')))['cards']}
legend_by_name = {}
for code, f in facets.items():
    if f['type'] != 'legend': continue
    tags = (cards_meta.get(code) or rad_meta.get(code) or {}).get('tags') or []
    nm = re.sub(r' - Starter$', '', f['name'])
    legend_by_name.setdefault(nkey(nm), code)
    for t in tags: legend_by_name.setdefault(nkey(t + nm), code)
def canon(code, name=None):
    if name and nkey(name) in legend_by_name: return legend_by_name[nkey(name)]
    b = base(code)
    if b in canon_by_base: return canon_by_base[b]
    if name and nkey(name) in canon_by_name: return canon_by_name[nkey(name)]
    return None

# ------------------------------------------------------------------ decks
decks = []; unmapped = Counter(); seen_ids = set()
for line in open(os.path.join(HERE, '../raw/pa-decks.jsonl')):
    d = json.loads(line)
    if d['id'] in seen_ids: continue
    seen_ids.add(d['id'])
    cards = set(); n_main = 0
    leg = canon(d['legend'].get('code'), d['legend'].get('name'))
    if not leg or facets[leg]['type'] != 'legend': unmapped['LEGEND ' + str(d['legend'].get('name'))] += 1; continue
    for zone in ('champions', 'main', 'battlefields'):
        for x in d.get(zone) or []:
            c = canon(x.get('code'), x.get('name'))
            if zone != 'battlefields': n_main += x.get('q', 0)
            if c: cards.add(c)
            else: unmapped[x.get('name')] += 1
    if leg and 38 <= n_main <= 41:
        decks.append(dict(id=d['id'], src='pa-2026-11-11', legend=leg, cards=cards | {leg}, name=d['name']))
n_pa = len(decks)
S = json.load(open(os.path.join(GAMELAB, 'data/decks/samples/piltover-archive-2026-09-06.json')))['decks']
for d in S:
    leg = canon(d['legend']); cards = set()
    for x in d['main']:
        c = canon(x['cardCode'], x.get('name'))
        if c: cards.add(c)
    for b in d.get('battlefields') or []:
        c = canon(b)
        if c: cards.add(c)
    cc = canon(d.get('chosenChampion') or '')
    if cc: cards.add(cc)
    if leg: decks.append(dict(id=d['source'], src='gamelab-2026-09-06', legend=leg, cards=cards | {leg}, name=d['name']))
# de-duplicate identical lists (the same list is often posted more than once)
uniq = {}
for d in decks: uniq.setdefault((d['legend'], frozenset(d['cards'])), d)
decks = list(uniq.values())
N = len(decks)
by_leg = defaultdict(list)
for d in decks: by_leg[d['legend']].append(d)
cnt = Counter(c for d in decks for c in d['cards'])
cntL = {L: Counter(c for d in ds for c in d['cards']) for L, ds in by_leg.items()}
co = Counter()
for d in decks:
    for a, b in combinations(sorted(d['cards']), 2): co[(a, b)] += 1
def cooc(a, b): return co.get((a, b) if a < b else (b, a), 0)

def dom(c): return set(facets[c]['domains'])
leg_dom = {L: dom(L) for L in by_leg}
def eligible_legends(a, b):
    need = set()
    for x in (a, b):
        if facets[x]['type'] not in ('legend',): need |= dom(x)
    out = []
    for L in by_leg:
        if facets[a]['type'] == 'legend' and a != L: continue
        if facets[b]['type'] == 'legend' and b != L: continue
        if need <= leg_dom[L]: out.append(L)
    return out

def expected(a, b):
    """(global expectation under independence over eligible decks, within-legend expectation, eligible decks).
    Card-card pair: eligible decks are those whose legend's Domain Identity holds both cards.
    Legend-card pair: the legend is in every one of its own decks, so the comparison is the card's play rate under this legend
    against its play rate over every deck that could hold the card; no within-legend figure exists."""
    la, lb = facets[a]['type'] == 'legend', facets[b]['type'] == 'legend'
    if la or lb:
        L, c = (a, b) if la else (b, a)
        if L not in by_leg or not dom(c) <= leg_dom[L]: return 0.0, None, 0
        Ls = [x for x in by_leg if dom(c) <= leg_dom[x]]
        n = sum(len(by_leg[x]) for x in Ls)
        return len(by_leg[L]) * sum(cntL[x][c] for x in Ls) / n, None, n
    Ls = eligible_legends(a, b)
    n = sum(len(by_leg[L]) for L in Ls)
    if n == 0: return 0.0, 0.0, 0
    ca = sum(cntL[L][a] for L in Ls); cb = sum(cntL[L][b] for L in Ls)
    eg = ca * cb / n
    ew = sum(cntL[L][a] * cntL[L][b] / len(by_leg[L]) for L in Ls)
    return eg, ew, n

# ------------------------------------------------------------------ pair table (undirected, strongest specific edge per pair)
pair = {}
for e in edges:
    a, b = canon(e['a']), canon(e['b'])
    if not a or not b or a == b: continue
    k = (a, b) if a < b else (b, a)
    cur = pair.get(k)
    if cur is None or e['s'] > cur['s']: pair[k] = dict(s=e['s'], rule=e['rule'].split(':')[0], cls=e['cls'], reason=e['reason'], a=e['a'], b=e['b'])
played = [c for c in cnt if cnt[c] >= 3 and facets[c]['type'] in ('unit', 'spell', 'gear', 'legend')]
PLAYED = set(played)

def pooled(keys):
    O = Eg = Ew = Ow = Egcc = 0.0; n = 0; anyco = 0; ncc = 0
    for (a, b) in keys:
        eg, ew, ne = expected(a, b)
        if ne == 0: continue
        o = cooc(a, b); O += o; Eg += eg; n += 1; anyco += 1 if o else 0
        if ew is not None: Ew += ew; Ow += o; ncc += 1; Egcc += eg
    return dict(pairs=n, observed=int(O), exp_global=round(Eg, 1), exp_within_legend=round(Ew, 1),
                pairs_card_card=ncc, observed_card_card=int(Ow), lift_global_card_card=round(Ow / Egcc, 2) if Egcc else None,
                lift_global=round(O / Eg, 2) if Eg else None, lift_within_legend=round(Ow / Ew, 2) if Ew else None,
                share_cooccurring=round(anyco / n, 3) if n else None)

res = dict(dataset=dict(decks_unique=N, pa=n_pa, legends=len(by_leg), distinct_cards=len(cnt), played_ge3=len(played), unmapped_names=len(unmapped), unmapped_top=unmapped.most_common(8)))
# 1) all legal pairs among played cards, split by edge / no edge
all_pairs = [(a, b) for a, b in combinations(sorted(played), 2) if eligible_legends(a, b)]
edge_pairs = [k for k in all_pairs if k in pair]
spec_pairs = [k for k in edge_pairs if pair[k]['cls'] == 'specific']
class_pairs = [k for k in edge_pairs if pair[k]['cls'] == 'class']
none_pairs = [k for k in all_pairs if k not in pair]
res['played_pairs'] = dict(all=pooled(all_pairs), no_edge=pooled(none_pairs), class_edge=pooled(class_pairs), specific_edge=pooled(spec_pairs))
ss = sorted(spec_pairs, key=lambda k: -pair[k]['s'])
res['by_strength'] = {}
for lab, lo, hi in (('s>=3.0', 3.0, 99), ('2.4<=s<3.0', 2.4, 3.0), ('1.8<=s<2.4', 1.8, 2.4), ('1.2<=s<1.8', 1.2, 1.8), ('s<1.2', 0, 1.2)):
    res['by_strength'][lab] = pooled([k for k in spec_pairs if lo <= pair[k]['s'] < hi])
res['top_n'] = {str(n): pooled(ss[:n]) for n in (50, 100, 250, 500, 1000)}
byrule = defaultdict(list)
for k in edge_pairs: byrule[pair[k]['rule']].append(k)
res['by_rule'] = {r: pooled(v) for r, v in sorted(byrule.items(), key=lambda x: -len(x[1])) if len(v) >= 15}
# random baseline: 200 draws of len(top250) non-edge played legal pairs
draws = []
for i in range(200):
    samp = random.sample(none_pairs, min(250, len(none_pairs)))
    p = pooled(samp)
    if p['lift_within_legend'] is not None: draws.append((p['lift_global'], p['lift_within_legend'], p['share_cooccurring']))
draws.sort(key=lambda x: x[1])
res['random_250_pairs_global_p95'] = sorted(d[0] for d in draws)[int(len(draws) * .95)]
res['random_250_pairs'] = dict(n_draws=len(draws), lift_within_median=draws[len(draws) // 2][1], lift_within_p95=draws[int(len(draws) * .95)][1],
                               lift_global_median=sorted(d[0] for d in draws)[len(draws) // 2], share_cooccurring_median=sorted(d[2] for d in draws)[len(draws) // 2])
# 2) nonbos
nb = set()
for e in nonbos:
    a, b = canon(e['a']), canon(e['b'])
    if a and b and a in PLAYED and b in PLAYED and a != b: nb.add((a, b) if a < b else (b, a))
res['nonbo_pairs'] = pooled([k for k in nb if eligible_legends(*k)])
nbr = defaultdict(set)
for e in nonbos:
    a, b = canon(e['a']), canon(e['b'])
    if a and b and a in PLAYED and b in PLAYED and a != b: nbr[e['rule']].add((a, b) if a < b else (b, a))
res['nonbo_by_rule'] = {r: pooled([k for k in v if eligible_legends(*k)]) for r, v in nbr.items()}

# 3) deck-level density: specific edge strength inside a real deck vs a random legal pile of the same size
adj = defaultdict(dict)
for (a, b), v in pair.items():
    if v['cls'] == 'specific': adj[a][b] = v['s']; adj[b][a] = v['s']
def density(cards):
    cs = [c for c in cards if facets[c]['type'] != 'battlefield']
    tot = 0.0
    for a, b in combinations(cs, 2): tot += adj.get(a, {}).get(b, 0.0)
    return tot
legal_pool = {L: [c for c in cnt if facets[c]['type'] in ('unit', 'spell', 'gear') and dom(c) <= leg_dom[L]] for L in by_leg}
leg_pool = {L: [c for c in cntL[L] if facets[c]['type'] in ('unit', 'spell', 'gear')] for L in by_leg}
rows = []
for d in decks:
    L = d['legend']; body = [c for c in d['cards'] if facets[c]['type'] in ('unit', 'spell', 'gear')]
    k = len(body); real = density(d['cards'])
    r1 = []; r2 = []
    for i in range(30):
        if len(legal_pool[L]) >= k: r1.append(density(set(random.sample(legal_pool[L], k)) | {L}))
        # stricter null: sample from cards this legend's decks actually play, weighted by how often
        w = leg_pool[L]; ws = [cntL[L][c] for c in w]; pick = set()
        while len(pick) < min(k, len(w)): pick.add(random.choices(w, ws)[0])
        r2.append(density(pick | {L}))
    rows.append((real, sum(r1) / len(r1) if r1 else None, sum(r2) / len(r2)))
def med(x): x = sorted(x); return round(x[len(x) // 2], 1)
res['deck_density'] = dict(decks=len(rows), real_median=med([r[0] for r in rows]), random_legal_played_median=med([r[1] for r in rows if r[1] is not None]),
                           random_same_legend_weighted_median=med([r[2] for r in rows]),
                           share_real_above_random_legal=round(sum(1 for r in rows if r[1] is not None and r[0] > r[1]) / len(rows), 3),
                           share_real_above_same_legend=round(sum(1 for r in rows if r[0] > r[2]) / len(rows), 3))

# 3b) density variants, with rule selection on one half of the legends and the test on the other half (no leakage)
legs_sorted = sorted(by_leg)
train_L = set(legs_sorted[0::2]); test_L = set(legs_sorted[1::2])
def rule_lift_on(Lset):
    O = defaultdict(float); Ex = defaultdict(float)
    for (a, b), v in pair.items():
        if a not in PLAYED or b not in PLAYED: continue
        la, lb = facets[a]['type'] == 'legend', facets[b]['type'] == 'legend'
        if la or lb:
            L, c = (a, b) if la else (b, a)
            if L not in Lset or L not in by_leg or not dom(c) <= leg_dom[L]: continue
            Ls = [x for x in by_leg if dom(c) <= leg_dom[x]]; n = sum(len(by_leg[x]) for x in Ls)
            O[v['rule']] += cntL[L][c]; Ex[v['rule']] += len(by_leg[L]) * sum(cntL[x][c] for x in Ls) / n
        else:
            Ls = [L for L in eligible_legends(a, b) if L in Lset]; n = sum(len(by_leg[L]) for L in Ls)
            if not n: continue
            O[v['rule']] += sum(1 for L in Ls for d in by_leg[L] if a in d['cards'] and b in d['cards'])
            Ex[v['rule']] += sum(cntL[L][a] for L in Ls) * sum(cntL[L][b] for L in Ls) / n
    return {r: (O[r] / Ex[r] if Ex[r] >= 5 else None) for r in Ex}
rl = rule_lift_on(train_L)
good_rules = sorted(r for r, v in rl.items() if v is not None and v >= 1.3)
def dens_variant(pred, deckset):
    adjv = defaultdict(dict)
    for (a, b), v in pair.items():
        if pred(v): adjv[a][b] = v['s']; adjv[b][a] = v['s']
    def dn(cards):
        cs = [c for c in cards if facets[c]['type'] != 'battlefield']
        return sum(adjv.get(a, {}).get(b, 0.0) for a, b in combinations(cs, 2))
    rnd = random.Random(7); wins = wins2 = 0; reals = []; nulls = []; nulls2 = []
    for d in deckset:
        L = d['legend']; body = [c for c in d['cards'] if facets[c]['type'] in ('unit', 'spell', 'gear')]; k = len(body)
        if len(legal_pool[L]) < k: continue
        real = dn(d['cards']); null = [dn(set(rnd.sample(legal_pool[L], k)) | {L}) for i in range(30)]
        m = sum(null) / len(null); wins += real > m; reals.append(real); nulls.append(m)
        # second null: same size, drawn from the same legal pool but weighted by how many decks (any legend) play each card
        w = legal_pool[L]; ws = [cnt[c] for c in w]; nn = []
        for i in range(30):
            pick = set()
            while len(pick) < k: pick.add(rnd.choices(w, ws)[0])
            nn.append(dn(pick | {L}))
        m2 = sum(nn) / len(nn); wins2 += real > m2; nulls2.append(m2)
    return dict(decks=len(reals), real_median=med(reals), uniform_random_median=med(nulls), share_real_above_uniform=round(wins / len(reals), 3),
                popularity_weighted_random_median=med(nulls2), share_real_above_popularity_weighted=round(wins2 / len(reals), 3))
test_decks = [d for d in decks if d['legend'] in test_L]
res['density_variants'] = dict(
    train_legends=len(train_L), test_legends=len(test_L), rules_kept_from_train=good_rules,
    all_specific_test=dens_variant(lambda v: v['cls'] == 'specific', test_decks),
    specific_s_ge_1_8_test=dens_variant(lambda v: v['cls'] == 'specific' and v['s'] >= 1.8, test_decks),
    kept_rules_test=dens_variant(lambda v: v['rule'] in good_rules, test_decks),
    kept_rules_s_ge_1_2_test=dens_variant(lambda v: v['rule'] in good_rules and v['s'] >= 1.2, test_decks))

# 4) community co-mentions: does the graph contain the pairs that riftbound.gg writers put in one paragraph?
C = json.load(open(os.path.join(HERE, 'data/community/rgg-comentions.json')))
def comention_pairs(filter_url=None):
    P = set()
    for a in C['articles']:
        if filter_url and not re.search(filter_url, a['url']): continue
        for s in a['sections']:
            for p in s['paragraphs']:
                cs = sorted({canon(c) for c in p['codes']} - {None})
                if 2 <= len(cs) <= 3:
                    for x, y in combinations(cs, 2): P.add((x, y))
    return P
def recall(P):
    P = [k for k in P if facets[k[0]]['type'] != 'battlefield' and facets[k[1]]['type'] != 'battlefield']
    hit = [k for k in P if k in pair]; spec = [k for k in hit if pair[k]['cls'] == 'specific']
    return dict(pairs=len(P), any_edge=len(hit), specific_edge=len(spec), recall_any=round(len(hit) / len(P), 3) if P else None, recall_specific=round(len(spec) / len(P), 3) if P else None), [k for k in P if k not in pair]
r_all, miss_all = recall(comention_pairs())
r_combo, miss_combo = recall(comention_pairs(r'combos|synerg'))
# base rate: share of random legal pairs (over all deckable cards) that carry an edge
deckable = [c for c, f in facets.items() if f['type'] in ('unit', 'spell', 'gear', 'legend') and canon(c) == c]
doms = {c: frozenset(facets[c]['domains']) for c in deckable}
legsets = {frozenset(f['domains']) for c, f in facets.items() if f['type'] == 'legend'}
tot = hit = hs = 0
for i in range(60000):
    a, b = random.sample(deckable, 2)
    if facets[a]['type'] == 'legend' and facets[b]['type'] == 'legend': continue
    if not any((doms[a] | doms[b]) <= L for L in legsets): continue
    tot += 1; k = (a, b) if a < b else (b, a)
    if k in pair: hit += 1; hs += pair[k]['cls'] == 'specific'
res['community'] = dict(all_articles=r_all, combo_synergy_articles=r_combo, base_rate_any=round(hit / tot, 3), base_rate_specific=round(hs / tot, 3), base_n=tot,
                        missed_sample=[[facets[a]['name'] + ' (' + a + ')', facets[b]['name'] + ' (' + b + ')'] for a, b in sorted(miss_combo)[:60]])
json.dump(res, open(os.path.join(HERE, 'out/validation.json'), 'w'), indent=1)
show = {k: v for k, v in res.items() if k != 'community'}
print(json.dumps(show, indent=1)); print(json.dumps({k: v for k, v in res['community'].items() if k != 'missed_sample'}, indent=1))

if '--top' in __import__('sys').argv:
    for k in ss[:60]:
        eg, ew, n = expected(*k)
        print(pair[k]['s'], pair[k]['rule'], facets[k[0]]['name'], '|', facets[k[1]]['name'], 'co', cooc(*k), 'cntA', cnt[k[0]], 'cntB', cnt[k[1]], 'elig', n, 'expG', round(eg, 1))

# 5) distribution of strong-edge density per deck and per legend (is the signal concentrated in a few archetypes?)
adjs = defaultdict(dict)
for (a, b), v in pair.items():
    if v['cls'] == 'specific' and v['s'] >= 1.8: adjs[a][b] = v['s']; adjs[b][a] = v['s']
def dstrong(cards):
    cs = [c for c in cards if facets[c]['type'] != 'battlefield']
    return sum(adjs.get(a, {}).get(b, 0.0) for a, b in combinations(cs, 2))
rnd = random.Random(11); perleg = defaultdict(list); reals = []; nulls = []
for d in decks:
    L = d['legend']; k = len([c for c in d['cards'] if facets[c]['type'] in ('unit', 'spell', 'gear')])
    w = legal_pool[L]; ws = [cnt[c] for c in w]
    if len(w) < k: continue
    nn = []
    for i in range(30):
        pick = set()
        while len(pick) < k: pick.add(rnd.choices(w, ws)[0])
        nn.append(dstrong(pick | {L}))
    r = dstrong(d['cards']); reals.append(r); nulls.append(sum(nn) / len(nn)); perleg[L].append((r, sum(nn) / len(nn)))
rows = sorted(((facets[L]['name'], len(v), round(sum(x[0] for x in v) / len(v), 1), round(sum(x[1] for x in v) / len(v), 1)) for L, v in perleg.items()), key=lambda x: -(x[2] - x[3]))
res['strong_density'] = dict(decks=len(reals), real_mean=round(sum(reals) / len(reals), 2), null_mean=round(sum(nulls) / len(nulls), 2), real_median=med(reals), null_median=med(nulls),
                             share_decks_zero=round(sum(1 for r in reals if r == 0) / len(reals), 3), share_decks_ge_10=round(sum(1 for r in reals if r >= 10) / len(reals), 3),
                             legends_real_above_null=sum(1 for r in rows if r[2] > r[3]), legends=len(rows), per_legend=rows)
json.dump(res, open(os.path.join(HERE, 'out/validation.json'), 'w'), indent=1)
