#!/usr/bin/env python3
"""Riftbound Forge - win-condition detector prototype (deterministic, no LLM).

Input : cards-current.json (official gallery, normalised by build_pool.py) and deck lists
        (GameLab sample file from 2026-09-06, or pa-decks-2026-11-11.json from fetch_decks.py).
Output: per deck -> ranked win routes with named closers/enablers, closer redundancy,
        goldfish speed estimate, 'folds to' list, and a 0-1 win-condition sub-score.

Everything here is regex over rules text plus printed stats. Every number is explained in
docs/research/wincons.md section 4. Usage:
    python3 detect.py sept            # all 2026-09-06 lists, one line each
    python3 detect.py nov             # all 2026-11-11 lists, one line each
    python3 detect.py show sept 0 nov 3 ...   # full reports
    python3 detect.py table sept|nov  # legend x route table
"""
import json, math, re, sys, os
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
POOL = json.load(open(os.path.join(HERE, 'cards-current.json')))['cards']
SEPT = os.path.expanduser('~/github_repositories/GameLab/data/decks/samples/piltover-archive-2026-09-06.json')
NOV = os.path.join(HERE, 'pa-decks-2026-11-11.json')

VICTORY = {'1v1': 8, 'ffa': 8, '2v2': 11}  # rules 485.3/486.3/487.3/488.3/489.3 (2026-07-16 numbering)

# ---------------------------------------------------------------- card features
def strip_reminder(t):
    return re.sub(r'\([^()]*\)', '', t or '')

def infer_type(c):
    if c['type'] != '?': return c['type']
    if c['might'] is not None: return 'unit'
    if re.search(r'\[(Equip|Deploy)\]|\[Exhaust\]:', c['text']): return 'gear'
    return 'spell'

R = lambda p: re.compile(p, re.I | re.S)
RX = dict(
    point_any=R(r"score 1 point|gains? 1 point"),
    altwin=R(r"you win the game"),
    denial=R(r"can't score|points needed to win|they draw 1 instead"),
    accel=R(r"\[Accelerate\]"),
    enter_ready=R(r"\bI enter ready\b|units? (you play |played )?[^.]{0,40}enters? ready|friendly units enter ready|tokens enter ready"),
    gank=R(r"\[Ganking\]"),
    move_friendly=R(r"\bmove (me\b|a friendly|another friendly|up to \w+ friendly|any number of (your|friendly)|your|a unit you control|an exhausted friendly|it to)"),
    displace=R(r"\bmove (an?|up to \w+|any number of|all|another) enemy|move [^.]{0,30}enemy units?[^.]{0,40}(base|battlefield)|return (an?|another|all|up to \w+) (enemy )?units?[^.]{0,60}hand|return [^.]{0,40}enemy[^.]{0,40}hand"),
    assault=R(r"\[Assault"),
    pump=R(r"\+\d+ \[Might\] this (turn|combat)|double [^.]{0,30}Might|\+\[Might\] equal"),
    token=R(r"play (a|an|two|three|four|\w+)( ready)? (\d+|\[\d+\]) \[Might\][^.]{0,40}unit tokens?|unit tokens?"),
    multi_token=R(r"play (two|three|four|five|\d+) [^.]{0,40}unit tokens"),
    widepay=R(r"for each (other )?(friendly )?unit|(your|other friendly|friendly) units (here )?have \+|other friendly units have \+\d|\d\+ units|each friendly unit|all friendly units|buff all|move any number of your"),
    scaling=R(r"my might is increased|I have \+\d+ \[Might\] for each|gives? double|\+\d+ \[Might\] for each"),
    mightypay=R(r"\[Mighty\]"),
    buff=R(r"\[Buff\]|\bbuff (a|an|me|it|another|all|each|that)\b"),
    equip=R(r"\[Equip\]"),
    prot=R(r"\[Deflect|can't be chosen|can't be dealt damage|would die[^.]{0,80}instead"),
    holdpay=R(r"when (I|you)( conquer or)? hold|when you or an ally hold|when I conquer or hold"),
    conqpay=R(r"when (I|you) conquer|when I attack"),
    shield=R(r"\[Shield"),
    tank=R(r"\[Tank\]"),
    stun=R(r"\[Stun\]|\bstun (a|an|all|each|up to|that|it)\b"),
    deftrick=R(r"\bdefend(s|er|ers|ing)?\b"),
    removal=R(r"\bkill (a|an|another|up to \w+|that|it\b)[^.]{0,30}(unit|gear)|\bkill it\b|deals? \d+ to (a|an|another|up to \w+|each of up to \w+) (enemy |stunned |damaged )?units?|deals? damage equal to [^.]{0,40} to (a|an) (enemy )?unit|deal \d+ to an enemy|banish (a|an) (enemy )?unit|take control of an enemy unit"),
    sweep=R(r"(kill|deal \d+ to|return) (all|each)( enemy| other)? units|deal \d+ to all enemy units"),
    debuff=R(r"-\d+ \[Might\]|\[Disarm"),
    counter=R(r"\bcounter (a|that|target) (spell|card)"),
    recur=R(r"from your trash|\[Flow\]|\[Deathknell\]|return [^.]{0,40}trash[^.]{0,40}(hand|board|base)"),
    draw=R(r"\bdraw (\d|a card|two|three)"),
    ramp=R(r"channel \d+ runes?|\[Add\]|Gold gear token"),
    doubler=R(r"(conquer|hold) effects[^.]{0,40}trigger an additional time|activate the conquer effects"),   # v2: Deathknell doublers (Karthus, Eternal; Detonation Amplifier) excluded
    temp_token=R(r"unit tokens? with \[Temporary\]|\[Temporary\][^.]{0,60}unit token"),   # v2: tokens that die before scoring (rule 816): they conquer, they never hold
    movepay=R(r"when I move\b|when (a|another) friendly unit moves|when you move a unit"),          # v2: payoffs for moving (Stellacorn Herder, Treasure Hunter, Hwei)
    shield_to_assault=R(r"\[Assault\] equal to (my|its|their) \[Shield\]"),              # v2: K'Sante, Pride of Nazumah
    hidden=R(r"\[Hidden\]"),
    burn_self=R(r"\[Burn \d+\]"),
    ambush=R(r"\[Ambush\]"),
    facedown_pay=R(r"from face ?down|when you hide|facedown card|hide (a|an additional) card"),
    token_engine=R(r"(when|whenever|at the start|the first time|\[Exhaust\]|\]:)[^.]{0,120}unit tokens?"),
)

def ready_unit(t):
    """'ready' effects whose object is a unit (not runes/gear/legend only)."""
    for m in re.finditer(r"\bready (me\b|it\b|them\b|[^.,]{0,45})", t, re.I):
        obj = m.group(1).lower()
        if re.search(r"\b(me|it|them|unit|units|something|mech|sand soldier)\b", obj) and not re.fullmatch(r"\s*(\d+ |up to \d+ |your )?(runes?|gear|legend)\s*", obj):
            if 'legend' in obj and 'unit' not in obj: continue
            return True
    return False

_feat_cache = {}
def feats(c):
    k = c['name'] + '|' + c['type']
    if k in _feat_cache: return _feat_cache[k]
    t = strip_reminder(c['text'])
    f = {n for n, rx in RX.items() if rx.search(t)}
    typ = infer_type(c)
    f.add(typ)
    # points: own points vs points handed to an opponent
    own = [m for m in re.finditer(r"score 1 point|gains? 1 point", t, re.I) if not re.search(r"(they|opponent[^.]{0,30}|would)\s*$", t[max(0, m.start() - 40):m.start()], re.I)]
    if own and 'that player gains' not in t: f.add('point_self')
    if re.search(r"(They|opponent[^.]{0,20}) score 1 point", t): f.add('point_gift')
    if ready_unit(t) and not (typ == 'unit' and re.fullmatch(r"\s*I enter ready\.?\s*", t)): f.add('ready')
    e, m = c.get('energy'), c.get('might')
    if typ == 'unit':
        if 'accel' in f or re.search(r"\bI enter ready\b", t): f.add('haste')
        if e is not None and e <= 2: f.add('cheap')
        if m is not None and m >= 5: f.add('mighty')      # rule 708: Mighty = Might 5+
        if m is not None and m >= 6: f.add('big')
        if e is not None and e >= 7: f.add('top_end')
        if 'hidden' in f: f.add('hidden_unit')
    if 'token' in f and re.search(r"opponent[^.]{0,30}play[^.]{0,30}token", t): f.discard('token')
    if 'removal' in f and not any(not re.search(r"friendly|you control|\byour\b", m.group(0), re.I) for m in RX['removal'].finditer(t)): f.discard('removal')   # v2: "kill a friendly unit" is a cost, not an answer
    _feat_cache[k] = f
    return f

# ---------------------------------------------------------------- deck loading
BY_CODE, BY_NAME = {}, {}
for c in POOL:
    for p in c['printings']: BY_CODE[p] = c
    BY_NAME.setdefault(c['name'].lower(), c)
LEGENDS = [c for c in POOL if c['type'] == 'legend']
BY_NOCOMMA = {k.replace(',', ''): v for k, v in BY_NAME.items()}

def norm_name(n):
    return re.sub(r"\s+", ' ', n.replace('’', "'").replace(' - ', ', ')).strip().lower()

def find_legend(champ_name=None, deck_name=''):
    if champ_name:
        base = champ_name.split(',')[0].strip().lower()
        hit = sorted([l for l in LEGENDS if l['name'].split(',')[0].strip().lower() == base], key=lambda l: l['set'] == 'OGS')
        if hit: return hit[0]
    dn = re.sub(r'&#x27;', "'", deck_name).lower()
    hit = [l for l in LEGENDS if re.search(r'\b' + re.escape(l['name'].split(',')[0].strip().lower()) + r'\b', dn)]
    return hit[0] if hit else None

def load_sept():
    out = []
    for i, d in enumerate(json.load(open(SEPT))['decks']):
        main = [(BY_CODE[m['cardCode']], m['count']) for m in d['main'] if m['cardCode'] in BY_CODE]
        champ = BY_CODE.get(d.get('chosenChampion') or '')
        leg = BY_CODE.get(d.get('legend') or '') or find_legend(champ['name'] if champ else None, d['name'])
        out.append(dict(idx=i, src='sept', name=re.sub(r'&#x27;', "'", d['name']), url=d['source'], legend=leg, champion=champ,
                        main=main, battlefields=[BY_CODE[b] for b in d.get('battlefields', []) if b in BY_CODE],
                        side=[(BY_CODE[m['cardCode']], m['count']) for m in d.get('sideboard', []) if m['cardCode'] in BY_CODE],
                        n_main=sum(m['count'] for m in d['main']), complete=d.get('complete')))
    return out

def _pa_card(e):
    c = BY_NAME.get(norm_name(e['name'])) or BY_NOCOMMA.get(norm_name(e['name']).replace(',', ''))
    if c: return c
    return dict(code=e.get('code') or '?', name=e['name'], set='?', type=(e['type'] or '?').lower(), superTypes=[], domains=[], tags=e.get('tags') or [],
                energy=e['energy'], power=e['power'], might=e['might'] if (e['type'] or '').lower() == 'unit' else None, text=e['text'] or '', printings=[])

def load_nov():
    out = []
    for i, d in enumerate(json.load(open(NOV))):
        s = d['sections']
        champ = _pa_card(s['champions'][0]) if s.get('champions') else None
        main = [(_pa_card(e), e['count']) for e in s.get('maindeck', [])]
        if champ: main = main + [(champ, 1)]          # PA lists the Chosen Champion copy separately
        agg = {}
        for c, n in main: agg[c['name']] = (c, agg.get(c['name'], (c, 0))[1] + n)
        main = list(agg.values())
        leg = BY_NAME.get(norm_name(d['legend'] or '')) or find_legend(champ['name'] if champ else None, d['name'])
        out.append(dict(idx=i, src='nov', name=d['name'], url=d['url'], legend=leg, champion=champ, main=main,
                        battlefields=[_pa_card(e) for e in s.get('battlefields', [])],
                        side=[(_pa_card(e), e['count']) for e in s.get('sideboard', [])],
                        n_main=sum(n for _, n in main), complete=sum(n for _, n in main) == 40))
    return out

CORPUS = os.path.join(HERE, '..', 'raw', 'pa-decks.jsonl')      # 361 tournament-named lists fetched 2026-11-11 by the deck-theory workflow (fetch-decks.mjs)
CORPUS_META = os.path.join(HERE, '..', 'out', 'results.json')   # same workflow: era / event / placement class parsed from deck names

PL_ORDER = ['win', 'top8', 'top64', 'bestof', 'event-only']
def load_corpus(era=None, cls=None, dedup=True):
    """v2: the 351 valid Piltover Archive lists of analysis/raw/pa-decks.jsonl joined with era/placement from analysis/out/results.json."""
    meta = {d['id']: d for d in json.load(open(CORPUS_META))['decks']}
    out, seen = [], {}
    for line_ in open(CORPUS):
        d = json.loads(line_)
        m = meta.get(d['id'])
        if not m: continue                           # invalid list (not 40 / 12 / 3): dropped by the sibling workflow
        if era and m['era'] != era: continue
        champ = _pa_card(d['champions'][0]) if d.get('champions') else None
        agg = {}
        for e in list(d.get('main', [])) + list(d.get('champions', [])):
            c = _pa_card(e); agg[c['name']] = (c, agg.get(c['name'], (c, 0))[1] + e['q'])
        main = list(agg.values())
        leg = BY_NAME.get(norm_name(d['legend']['name'])) if d.get('legend') else None
        sig = (d['legend']['name'] if d.get('legend') else '', tuple(sorted((c['name'], n) for c, n in main)))
        if dedup and sig in seen:                    # v2: the same 40 cards uploaded again (often by another user for the same event)
            o = out[seen[sig]]; o['dupes'] += 1
            if PL_ORDER.index(m['placement']['cls']) < PL_ORDER.index(o['placement']): o['placement'] = m['placement']['cls']
            continue
        seen[sig] = len(out)
        out.append(dict(idx=len(out), src='pa', dupes=0, name=d['name'], url='https://piltoverarchive.com/decks/view/' + d['id'], legend=leg or find_legend(champ['name'] if champ else None, d['name']),
                        champion=champ, main=main, battlefields=[_pa_card(e) for e in d.get('battlefields', [])],
                        side=[(_pa_card(e), e['q']) for e in d.get('side', [])], n_main=sum(n for _, n in main), complete=True,
                        era=m['era'], event=m['event'], placement=m['placement']['cls']))
    if cls: out = [d for d in out if d['placement'] in cls]
    for i, d in enumerate(out): d['idx'] = i
    return out

# ---------------------------------------------------------------- routes
# weight tables: feature -> weight per copy.  role: which features make a card a CLOSER for the route.
ROUTES = {
    'WIDE':   dict(label='Go-wide flood (both battlefields)', w=dict(token=1.0, multi_token=1.0, widepay=1.5, cheap=0.5)),
    'TALL':   dict(label='Go-tall single threat',             w=dict(big=1.0, scaling=1.0, mightypay=1.0, buff=0.75, equip=0.75, pump=0.5, prot=0.5)),
    'HOLD':   dict(label='Hold-and-defend',                   w=dict(holdpay=1.5, shield=1.0, tank=1.0, stun=0.5, deftrick=0.5)),
    'BURST':  dict(label='Burst conquer (ready/haste/move)',  w=dict(haste=1.0, ready=1.0, gank=0.75, move_friendly=0.75, assault=0.5, conqpay=0.5, enter_ready=0.5, movepay=0.5)),
    'POINTS': dict(label='Direct point gain',                 w=dict(point_self=3.0, doubler=1.0)),
    'HIDDEN': dict(label='Hidden / Ambush tempo (face-down reactions)', w=dict(hidden=0.25, hidden_unit=1.0, ambush=1.0, facedown_pay=1.5)),
    'ATTRITION': dict(label='Attrition / recursion control',  w=dict(removal=1.0, sweep=1.5, counter=0.75, recur=0.75, draw=0.5, displace=0.5, debuff=0.5)),
}
# Reference level per route = 75th percentile of the raw score over the RAD-era corpus (v1 used 86 lists from two metas).
REF = {'WIDE': 9.0, 'TALL': 11.5, 'HOLD': 6.5, 'BURST': 14.75, 'POINTS': 6.0, 'ATTRITION': 21.5, 'HIDDEN': 8.5}  # v2: p75 over the 201 distinct RAD-era lists (`detect.py calibrate rad`); POINTS p75 is 0, so 6.0 = two copies of a point card
LEGEND_CLOSER = {'HIDDEN': ('facedown_pay',), 'WIDE': ('token', 'widepay'), 'HOLD': ('holdpay',), 'BURST': ('ready', 'gank', 'move_friendly', 'enter_ready'), 'POINTS': ('point_self',)}
LEGEND_WEIGHT = 4      # a legend ability is available every turn: counted as 4 copies
BF_WEIGHT = 1          # each of the 3 listed battlefields: 1 copy (only one is in play per game, rule 485.5)

def is_closer(route, c, f):
    m, e = c.get('might') or 0, c.get('energy') or 0
    if route == 'WIDE':   return 'widepay' in f or 'multi_token' in f or ('token_engine' in f and 'spell' not in f)
    if route == 'TALL':   return 'unit' in f and (m >= 6 or 'scaling' in f or (m >= 5 and ('prot' in f or 'gank' in f)))
    if route == 'HOLD':   return 'unit' in f and ('holdpay' in f or (({'shield', 'tank'} & f) and m >= 4))
    if route == 'BURST':  return ('haste' in f and (m >= 4 or 'assault' in f)) or ('ready' in f and 'unit' not in f) or ('gank' in f and m >= 4) or ('ready' in f and 'unit' in f and m >= 4)
    if route == 'POINTS': return 'point_self' in f
    if route == 'HIDDEN': return 'facedown_pay' in f or ('unit' in f and ({'hidden', 'ambush'} & f) and m >= 3)
    if route == 'ATTRITION': return 'sweep' in f or ('top_end' in f) or ('recur' in f and 'unit' in f and e >= 5)
    return False

def hyper_at_least_one(k, n=40, draws=9):
    """P(at least one of k copies among `draws` cards of an n-card deck). draws=9 = 4 opening (rule 116) + 5 draws."""
    k = max(0, min(k, n))
    if k == 0: return 0.0
    if n - k < draws: return 1.0
    return 1 - math.comb(n - k, draws) / math.comb(n, draws)

META = Counter()   # copies (main + side) of each card across the RAD-era corpus: answers are named in order of real play
_EXP = {}
def _load_meta():
    if META: return
    ds = load_corpus(era='RAD')
    for d in ds:
        for c, n in d['main'] + d['side']: META[c['name']] += n
    for f in ('sweep', 'removal', 'displace', 'stun', 'counter', 'debuff', 'prot', 'shield', 'tank', 'hidden'):
        ks = [sum(q for c, q in d['main'] if f in feats(c)) for d in ds]
        _EXP[f] = (sum(1 for k in ks if k > 0) / len(ds), sum(ks) / len(ds))
    _EXP['n'] = len(ds)

def exposure(f):
    """(share of RAD-era corpus lists with >= 1 main-deck copy of feature f, mean main-deck copies)."""
    _load_meta(); return _EXP[f]

def exp_txt(f):
    s, m = exposure(f)
    return f"main-decked by {round(100 * s)}% of {_EXP['n']} RAD-era lists, mean {m:.1f} copies"

def pool_examples(feature, limit=5, typ=None, max_energy=None):
    _load_meta()
    xs = [c for c in POOL if feature in feats(c) and c['type'] not in ('legend', 'battlefield', 'rune') and (typ is None or infer_type(c) == typ) and (max_energy is None or (c.get('energy') or 0) <= max_energy)]
    xs.sort(key=lambda c: (-META[c['name']], (c.get('energy') or 0), c['name']))
    return [f"{c['name']} ({META[c['name']]})" for c in xs[:limit] if META[c['name']] > 0 or limit <= 2]

SCORING_ROUTES = ('WIDE', 'TALL', 'HOLD', 'BURST', 'POINTS', 'ATTRITION')   # v2: HIDDEN is reported on a separate "delivery" axis

def analyse(deck):
    main, legend, bfs, champ = deck['main'], deck['legend'], deck['battlefields'], deck['champion']
    n_main = sum(n for _, n in main) or 1
    fc = Counter()                                  # feature -> copies
    for c, n in main:
        for f in feats(c): fc[f] += n
    lf = feats(legend) if legend else set()
    s2a = 'shield_to_assault' in lf                 # legend turns Shield into Assault: Shield bodies also attack
    routes = {}
    for r, spec in ROUTES.items():
        w = dict(spec['w'])
        if r == 'BURST' and s2a: w['shield'] = 0.75
        raw, closers, enablers = 0.0, [], []
        for c, n in main:
            f = feats(c)
            wsum = sum(x for k, x in w.items() if k in f)
            if wsum <= 0: continue
            if r == 'POINTS' and champ and c['name'] == champ['name'] and 'point_self' in f: raw += wsum * 3   # v2: a point card as Chosen Champion is always available (103.2.a.1): counted as 4 copies
            raw += wsum * n
            cl = is_closer(r, c, f) or (r == 'BURST' and s2a and 'unit' in f and 'shield' in f and (c.get('might') or 0) >= 4)
            (closers if cl else enablers).append((c['name'], n, wsum))
        leg_hit = sorted(k for k in w if k in lf)
        raw += LEGEND_WEIGHT * sum(w[k] for k in leg_hit)
        if r == 'BURST' and s2a: raw += LEGEND_WEIGHT * 0.5; leg_hit.append('shield_to_assault')
        if r == 'BURST' and 'enter_ready' in lf: raw += LEGEND_WEIGHT * 0.5      # a legend that readies what you play is worth a full haste weight (1.0), not 0.5
        bf_hit = []
        for b in bfs:
            bh = [k for k in w if k in feats(b)]
            if bh: raw += BF_WEIGHT * sum(w[k] for k in bh); bf_hit.append(b['name'])
        key = lambda x: (not (champ and x[0] == champ['name']), -x[1] * x[2], x[0])   # v2: Chosen Champion first, then weight x copies
        routes[r] = dict(route=r, label=spec['label'], raw=round(raw, 2), norm=round(raw / REF[r], 2),
                         closers=sorted(closers, key=key), enablers=sorted(enablers, key=key), shared=[],
                         legend_is_closer=bool(set(LEGEND_CLOSER.get(r, ())) & lf) or (r == 'BURST' and s2a),
                         legend_features=leg_hit, battlefields=bf_hit)
        rr = routes[r]
        p0 = 1.0 if (rr['legend_is_closer'] or (champ and any(x[0] == champ['name'] for x in closers))) else hyper_at_least_one(sum(n for _, n, _ in closers), n_main)
        rr['rank_score'] = round(rr['norm'] * (0.6 + 0.4 * p0), 3)      # v2: a route nobody in the list can close is demoted (up to -40%)
    delivery = routes['HIDDEN']
    ranked = sorted((routes[r] for r in SCORING_ROUTES), key=lambda r: (-r['rank_score'], SCORING_ROUTES.index(r['route'])))
    # v2: a card closes for the highest-ranked route that wants it; lower routes list it as "shared" and do not count it
    claimed = {}
    for r in ranked + [delivery]:
        if r is not delivery:
            r['shared'] = [(nm, n, claimed[nm]) for nm, n, _ in r['closers'] if nm in claimed]
            r['closers'] = [x for x in r['closers'] if x[0] not in claimed]
            for nm, _, _ in r['closers']: claimed[nm] = r['route']
        r['closer_copies'] = sum(n for _, n, _ in r['closers']); r['closer_names'] = len(r['closers'])
        r['champion_is_closer'] = bool(champ and any(nm == champ['name'] for nm, _, _ in r['closers']))
        r['p_closer_t5'] = 1.0 if (r['champion_is_closer'] or r['legend_is_closer']) else round(hyper_at_least_one(r['closer_copies'], n_main), 3)
    # special, rule-based routes ------------------------------------------------
    specials = []
    names = {c['name']: n for c, n in main}
    bfn = {b['name'] for b in bfs}
    def has(n): return names.get(n, 0)
    if 'The Grand Plaza' in bfn:
        tok = fc['token'] + fc['cheap']
        specials.append(dict(route='ALTWIN', label='Alternate win: The Grand Plaza (hold with 7+ units there)', strength=round(min(1, tok / 20), 2),
                             cards=['The Grand Plaza'] + [nm for nm, n, _ in routes['WIDE']['closers'][:4]], note=f'{fc["token"]} token-maker copies ({fc["temp_token"]} of them make Temporary tokens, which die before the hold), {fc["cheap"]} units costing 2 or less; only live in games where this battlefield is the one in play'))
    if has('Gutter Palace'):
        specials.append(dict(route='ALTWIN', label='Alternate win: Gutter Palace (exactly 4 cards in hand and 4 units at battlefields at your Beginning Phase)', strength=round(hyper_at_least_one(has('Gutter Palace'), n_main), 2), cards=['Gutter Palace'], note=f'{has("Gutter Palace")} copies'))
    doublers = [(c['name'], n) for c, n in main if 'doubler' in feats(c)] + [(b['name'], 1) for b in bfs if 'doubler' in feats(b)]
    trig_pts = [(c['name'], n) for c, n in main if 'point_self' in feats(c) and ({'holdpay', 'conqpay'} & feats(c))]
    if doublers and trig_pts:
        specials.append(dict(route='COMBO', label='Combo finisher: trigger doubler + scoring-trigger point card', strength=round(hyper_at_least_one(sum(n for _, n in doublers), n_main) * hyper_at_least_one(sum(n for _, n in trig_pts), n_main), 2), cards=[x for x, _ in doublers + trig_pts], note='each extra trigger is +1 point outside the Final Point restriction (rule 471.1.a.1)'))
    if has('Yasuo, Windrider'):
        mv = fc['move_friendly'] + fc['ready'] + (LEGEND_WEIGHT if {'move_friendly', 'ready'} & lf else 0)
        specials.append(dict(route='COMBO', label='Combo finisher: Yasuo, Windrider third move in a turn (+1 point, not a conquer)', strength=round(min(1, mv / 12), 2), cards=['Yasuo, Windrider'] + [f"{n}x {c['name']}" for c, n in main if ({'move_friendly', 'ready'} & feats(c)) and c['name'] != 'Yasuo, Windrider'][:6], note=f'{mv} move / ready enabler copies (legend counted as {LEGEND_WEIGHT}); needs 2 extra moves after his own'))
    pt_bfs = [b['name'] for b in bfs if 'point_self' in feats(b)]
    sym = [b['name'] for b in bfs if 'point_any' in feats(b) and 'point_self' not in feats(b)]
    if sym:
        specials.append(dict(route='BF_SYMMETRIC', label='Symmetric point battlefield (both players +1: the race is to 7)', strength=round(len(sym) / 3, 2), cards=sym, note='shortens the game by one scoring step for everyone; favours the faster deck'))
    if pt_bfs:
        specials.append(dict(route='BF_ENGINE', label='Battlefield point engine', strength=round(len(pt_bfs) / 3, 2), cards=pt_bfs, note='in play in roughly 1 of 3 Bo1 games per listed copy (rule 485.5); chosen in Bo3 (rule 486.5)'))
    if legend and ('point_self' in lf):
        specials.append(dict(route='LEGEND_ENGINE', label='Legend point engine', strength=1.0, cards=[legend['name']], note=''))
    primary, second = ranked[0], ranked[1]
    # speed (goldfish clock, uncontested): see wincons.md 4.4 ------------------
    fast1 = sum(n for c, n in main if 'haste' in feats(c) and (c.get('energy') or 0) <= 1)
    cheap_units = fc['cheap']
    t_first = 1 if fast1 >= 6 else 2 if cheap_units + fast1 >= 8 else 3
    leg_two = LEGEND_WEIGHT if ({'token', 'ready', 'gank', 'enter_ready', 'move_friendly'} & lf) else 0
    two_bf = min(1.0, (cheap_units + fc['token'] + fc['gank'] + fc['haste'] + fc['ready'] + fc['ambush'] + leg_two) / 20)   # v2: Ambush units arrive at a battlefield directly (822.1.b)
    ppt = 1 + two_bf
    pt_copies = fc['point_self'] + (3 if champ and 'point_self' in feats(champ) else 0)
    bonus = min(2.0, 0.25 * pt_copies)
    clock = t_first + math.ceil((VICTORY['1v1'] - 1 - bonus) / ppt)
    speed = 'fast' if clock <= 6 else 'medium' if clock <= 7 else 'slow'
    # final point reach --------------------------------------------------------
    movers = fc['haste'] + fc['ready'] + fc['gank'] + fc['move_friendly'] + (LEGEND_WEIGHT if ({'ready', 'gank', 'move_friendly', 'enter_ready'} & lf) or s2a else 0)
    fp_hold = min(1.0, (fc['shield'] + fc['tank'] + fc['holdpay'] + fc['prot'] + (LEGEND_WEIGHT if {'shield', 'tank', 'holdpay', 'deftrick', 'debuff'} & lf else 0)) / 12)
    fp_double = min(1.0, movers / 12)
    fp_direct = min(1.0, pt_copies / 4 + (0.34 * len(pt_bfs)))
    final_point = dict(hold=round(fp_hold, 2), double_conquer=round(fp_double, 2), direct=round(fp_direct, 2))
    fp_triple = round(min(1.0, movers / 18), 2)     # FFA: the final conquer needs all 3 battlefields in one turn (471.1.b.1)
    # folds-to: (meta exposure 0-1, text); sorted by exposure -----------------
    folds = []
    units = [(c, n) for c, n in main if 'unit' in feats(c)]
    ucount = sum(n for _, n in units) or 1
    avg_m = sum((c.get('might') or 0) * n for c, n in units) / ucount
    pc = primary['closers']
    prot_share = (sum(n for c, n in main if c['name'] in {x[0] for x in pc} and 'prot' in feats(c)) / primary['closer_copies']) if primary['closer_copies'] else 0
    top_closer = pc[0][0] if pc else None
    interaction = fc['removal'] + fc['sweep'] + fc['counter'] + fc['stun'] + fc['displace']
    if primary['route'] in ('TALL', 'POINTS', 'HOLD') and prot_share < 0.5 and top_closer:
        folds.append((exposure('removal')[0], f"single-target removal/bounce on {top_closer} ({round(prot_share * 100)}% of the {primary['closer_copies']} closer copies have Deflect or can't-be-chosen; {exp_txt('removal')}) - e.g. " + ', '.join(pool_examples('removal', 4, 'spell', 3))))
    if avg_m <= 3.2 or primary['route'] == 'WIDE':
        folds.append((exposure('sweep')[0], f"sweepers (average unit Might {avg_m:.1f}, {fc['token']} token-maker copies; {exp_txt('sweep')}) - e.g. " + ', '.join(pool_examples('sweep', 5))))
    if fc['temp_token'] >= 3 and 'WIDE' in (primary['route'], second['route']):
        folds.append((1.0, f"its own tokens at 7 points: {fc['temp_token']} of {fc['token']} token-maker copies make Temporary tokens, which are killed at the start of your Beginning Phase before scoring, so they never hold; the last point needs a double conquer (reach {fp_double:.2f}) or a non-token holder (hold reach {fp_hold:.2f})"))
    if primary['route'] == 'BURST' or second['route'] == 'BURST':
        folds.append((exposure('stun')[0], f"stun on the readied attacker and Shield/Tank defenders (a stunned unit deals no combat damage; stun {exp_txt('stun')}; Shield {exp_txt('shield')}) - e.g. " + ', '.join(pool_examples('stun', 4, 'spell', 3))))
    if primary['route'] == 'HOLD' or fp_hold >= 0.75:
        folds.append((exposure('displace')[0], f"displacement of the holder before your Beginning Phase ({exp_txt('displace')}) - e.g. " + ', '.join(pool_examples('displace', 5, None, 4))))
    if primary['route'] == 'ATTRITION':
        folds.append((exposure('prot')[0], f"two-battlefield pressure: {ucount} unit copies to contest 2 battlefields; answers are {fc['removal']} kill/damage, {fc['displace']} displacement, {fc['debuff']} Might-reduction, {fc['counter']} counterspell, {fc['sweep']} sweeper copies; Deflect / can't-be-chosen taxes every targeted answer ({exp_txt('prot')}) - e.g. " + ', '.join(pool_examples('prot', 4, 'unit'))))
    if delivery['norm'] >= 1.0 or fc['hidden'] >= 8:
        folds.append((0.05, f"Hidden hate ({fc['hidden']} Hidden copies): Noxus Saboteur ({META['Noxus Saboteur']}) stops reveals at its battlefield, Mystic Vortex ({META['Mystic Vortex']}) taxes Reaction cards in showdowns there; losing control of the battlefield removes your face-down cards there (rule 466.5.c)"))
    if fc['equip'] >= 5:
        folds.append((0.3, f"gear removal ({fc['equip']} Equipment copies carry the Might)"))
    if fc['recur'] >= 8:
        folds.append((0.1, f"trash hate / banish ({fc['recur']} copies use the trash)"))
    if fc['point_self'] or pt_bfs:
        folds.append((0.02, f"point denial - Tianna Crownguard ({META['Tianna Crownguard']}): while she is at a battlefield opponents can't gain points (errata wording)"))
    if interaction < 8:
        folds.append((0.5, f"any faster racer: only {interaction} interaction copies in the main deck"))
    if primary['closer_copies'] < 6 and not primary['champion_is_closer'] and not primary['legend_is_closer']:
        folds.append((exposure('counter')[0], f"counterspell / removal on the few closers ({primary['closer_copies']} copies, no champion or legend closer; counterspells {exp_txt('counter')})"))
    folds = [t for _, t in sorted(folds, key=lambda x: -x[0])]
    # mode notes (2v2 / FFA) ---------------------------------------------------------
    ps, pr = exposure('sweep')[0], exposure('removal')[1]
    p2, p3 = 1 - (1 - ps) ** 2, 1 - (1 - ps) ** 3
    R = primary['route']
    mode = dict(
        WIDE=(f"2v2: a unit can't move to a battlefield a teammate occupies (447.2.b), so {ucount} unit copies + {fc['token']} token makers share the battlefields your partner leaves free",
              f"FFA: P(at least one opponent main-decks a sweeper) = {p2:.2f} with 2 opponents, {p3:.2f} with 3 (from {round(100 * ps)}% per list)"),
        TALL=(f"2v2: the partner covers the other battlefields; friendly buffs may target a teammate's unit (489.8.e)",
              f"FFA: {primary['closer_copies']} closer copies face about {2 * pr:.0f}-{3 * pr:.0f} single-target answers across 2-3 opposing main decks (mean {pr:.1f} per list)"),
        HOLD=(f"2v2: a battlefield is held only by its controller on that controller's turn; teammate-controlled battlefields can't be scored by you that turn (469.1.a)",
              f"FFA: the holder must survive 2-3 opposing turns per round; hold reach {fp_hold:.2f} is computed for one"),
        BURST=(f"2v2: Ganking and move effects lose every teammate-occupied destination (447.2.b); {fc['gank']} Ganking copies, {fc['move_friendly']} move copies",
               f"FFA: the final conquer needs all 3 battlefields in one turn (471.1.b.1): triple-conquer reach {fp_triple:.2f} vs {fp_double:.2f} in 1v1; a battlefield with a pending combat between two other players can't be entered (447.2.a)"),
        POINTS=(f"2v2: points are shared (489.8.d) and Victory is 11: {fc['point_self']} point-card copies work for the team",
                f"FFA: gained points ignore the 3-battlefield final-point condition (471.1.a.1)"),
        ATTRITION=(f"2v2: Victory 11 lengthens the game; spells may be played on the teammate's turn when invited (489.8.a)",
                   f"FFA: {fc['removal']} one-for-one answers against 2-3 boards; only {fc['sweep']} sweeper copies scale with the number of opponents"),
    )[R]
    # sub-score ------------------------------------------------------------------
    s_closer = primary['p_closer_t5']
    s_depth = min(1.0, primary['norm'] / 1.5)
    s_planb = min(1.0, second['norm']) * second['p_closer_t5']       # v2: second route needs its own (unshared) closer
    s_final = max(final_point.values())
    s_res = min(1.0, (fc['prot'] + fc['recur'] * 0.5 + fc['counter']) / 8)
    score = round(0.30 * s_closer + 0.25 * s_depth + 0.15 * s_planb + 0.20 * s_final + 0.10 * s_res, 3)
    return dict(deck=deck['name'], src=deck['src'], idx=deck['idx'], url=deck['url'], legend=legend['name'] if legend else None, champion=champ['name'] if champ else None,
                era=deck.get('era'), event=deck.get('event'), placement=deck.get('placement'),
                n_main=n_main, routes=ranked, delivery=delivery, specials=specials, features=dict(fc), speed=dict(t_first=t_first, points_per_turn=round(ppt, 2), bonus_points=bonus, goldfish_turn=clock, label=speed),
                final_point=final_point, final_point_ffa=fp_triple, folds_to=folds, mode_notes=mode, avg_unit_might=round(avg_m, 2), unit_copies=ucount, interaction=interaction,
                subscore=score, subscore_parts=dict(closer=round(s_closer, 3), depth=round(s_depth, 3), plan_b=round(s_planb, 3), final_point=round(s_final, 3), resilience=round(s_res, 3)))

# ---------------------------------------------------------------- reporting
def fmt_cards(xs, k=6):
    return ', '.join(f"{n}x {nm}" for nm, n, _ in xs[:k]) + (f" (+{len(xs) - k} more)" if len(xs) > k else '')

def route_lines(r, tag):
    L = [f"{tag} {r['route']} {r['label']}  norm {r['norm']} (raw {r['raw']}, rank {r['rank_score']}) | closers {r['closer_copies']} copies / {r['closer_names']} names, P(closer by T5) {r['p_closer_t5']}" + (" [champion]" if r['champion_is_closer'] else '') + (" [legend]" if r['legend_is_closer'] else '') + (f" | legend: {'+'.join(r['legend_features'])}" if r['legend_features'] else '') + (f" | battlefields: {', '.join(r['battlefields'])}" if r['battlefields'] else '')]
    L.append(f"   closers: {fmt_cards(r['closers']) or '-'}" + (f" | shared, counted above: {', '.join(f'{nm} ({o})' for nm, _, o in r['shared'])}" if r['shared'] else ''))
    L.append(f"   enablers: {fmt_cards(r['enablers']) or '-'}")
    return L

def report(a):
    r0, dl = a['routes'][0], a['delivery']
    head = (f"{dl['route']} tempo that scores by {r0['route']}" if dl['norm'] >= 1.0 and dl['norm'] > r0['norm'] else r0['route']) + (f" + {a['routes'][1]['route']}" if a['routes'][1]['norm'] >= 1.0 else '')
    L = [f"### {a['deck']}", f"identity: {head}", f"legend: {a['legend']} | champion: {a['champion']} | main {a['n_main']} | {a.get('era') or ''} {a.get('placement') or ''} | {a['url']}",
         f"win-condition sub-score {a['subscore']}  parts {a['subscore_parts']}",
         f"speed: {a['speed']['label']} - goldfish win turn {a['speed']['goldfish_turn']} (first conquer T{a['speed']['t_first']}, {a['speed']['points_per_turn']} pts/turn, {a['speed']['bonus_points']} bonus pts) | final point reach {a['final_point']} | FFA triple conquer {a['final_point_ffa']}"]
    for i, r in enumerate(a['routes'][:3], 1): L += route_lines(r, f"{i}.")
    d = a['delivery']
    if d['norm'] >= 0.5: L += route_lines(d, "delivery:")
    for s in a['specials']:
        L.append(f"*  {s['route']}: {s['label']} strength {s['strength']} | {', '.join(s['cards'])} | {s['note']}")
    L.append("folds to (most common answer class in the RAD-era corpus first):")
    L += [f"   - {x}" for x in a['folds_to']] or ['   - (nothing flagged)']
    L.append("modes:"); L += [f"   - {x}" for x in a['mode_notes']]
    return '\n'.join(L)

def line(a):
    r = a['routes']
    sp = '+'.join(sorted({s['route'] for s in a['specials']}))
    return f"{a['src']}{a['idx']:>3} | {(a['legend'] or '?')[:30]:30} | {r[0]['route']:9} {r[0]['norm']:>4} | {r[1]['route']:9} {r[1]['norm']:>4} | hid {a['delivery']['norm']:>4} | cl {r[0]['closer_copies']:>2} | T{a['speed']['goldfish_turn']} {a['speed']['label']:6} | {a['subscore']:.2f} | {(a.get('placement') or ''):10} | {sp:14} | {a['deck'][:40]}"

def mean(xs): return sum(xs) / len(xs) if xs else float('nan')

if __name__ == '__main__':
    args = sys.argv[1:] or ['rad']
    decks = {'sept': load_sept, 'nov': load_nov, 'pa': load_corpus, 'rad': lambda: load_corpus(era='RAD'),
             'radtop': lambda: load_corpus(era='RAD', cls=('win', 'top8'))}
    if args[0] in decks:
        for d in decks[args[0]](): print(line(analyse(d)))
    elif args[0] == 'show':
        cache = {}
        for src, i in zip(args[1::2], args[2::2]):
            cache.setdefault(src, decks[src]())
            print(report(analyse(cache[src][int(i)]))); print()
    elif args[0] == 'calibrate':
        al = [analyse(d) for d in decks[args[1] if len(args) > 1 else 'rad']() if d['complete']]
        print(len(al), 'complete lists')
        allr = lambda a: a['routes'] + [a['delivery']]
        for r in ROUTES:
            v = sorted(next(x['raw'] for x in allr(a) if x['route'] == r) for a in al)
            print(r, 'p25', v[len(v) // 4], 'p50', v[len(v) // 2], 'p75', v[(3 * len(v)) // 4], 'max', v[-1])
    elif args[0] == 'table':
        al = [analyse(d) for d in decks[args[1]]() if d['complete']]
        t = defaultdict(Counter); sc = defaultdict(list)
        for a in al: t[(a['legend'] or '?')][a['routes'][0]['route']] += 1; sc[a['legend'] or '?'].append(a)
        for leg in sorted(t, key=lambda l: -sum(t[l].values())):
            x = sc[leg]
            print(f"{leg[:34]:34} n {len(x):>2} | " + f"{', '.join(f'{k} {v}' for k, v in t[leg].most_common()):34} | delivery>=1: {sum(1 for a in x if a['delivery']['norm'] >= 1):>2} | clock {mean([a['speed']['goldfish_turn'] for a in x]):.1f} | closers {mean([a['routes'][0]['closer_copies'] for a in x]):.1f} | score {mean([a['subscore'] for a in x]):.2f}")
        print('primary route totals', Counter(a['routes'][0]['route'] for a in al).most_common(), 'n', len(al))
        print('secondary route totals', Counter(a['routes'][1]['route'] for a in al).most_common())
        print('hidden delivery (norm >= 1):', sum(1 for a in al if a['delivery']['norm'] >= 1))
        print('specials', Counter(s['route'] for a in al for s in a['specials']).most_common())
        print('point cards in main decks:', Counter(nm for a in al for r in a['routes'] if r['route'] == 'POINTS' for nm, n, _ in r['closers'] + r['shared']).most_common())
        print('by primary route: n, mean clock, median closers, median interaction, mean sub-score')
        for r in SCORING_ROUTES:
            x = [a for a in al if a['routes'][0]['route'] == r]
            if x:
                med = lambda v: sorted(v)[len(v) // 2]
                print(f"  {r:9} n {len(x):>3} | clock {mean([a['speed']['goldfish_turn'] for a in x]):.1f} ({min(a['speed']['goldfish_turn'] for a in x)}-{max(a['speed']['goldfish_turn'] for a in x)}) | closers {med([a['routes'][0]['closer_copies'] for a in x])} | interaction {med([a['interaction'] for a in x])} | score {mean([a['subscore'] for a in x]):.2f}")
    elif args[0] == 'placement':
        al = [analyse(d) for d in load_corpus(era='RAD')]
        for cls in ('win', 'top8', 'top64', 'bestof', 'event-only'):
            x = [a for a in al if a['placement'] == cls]
            print(f"{cls:10} n {len(x):>3} | sub-score mean {mean([a['subscore'] for a in x]):.3f} | clock {mean([a['speed']['goldfish_turn'] for a in x]):.2f} | interaction {mean([a['interaction'] for a in x]):.1f} | primary " + ', '.join(f"{k} {v}" for k, v in Counter(a['routes'][0]['route'] for a in x).most_common()))
        top = [a for a in al if a['placement'] in ('win', 'top8')]; rest = [a for a in al if a['placement'] not in ('win', 'top8')]
        for k in ('closer', 'depth', 'plan_b', 'final_point', 'resilience'):
            print(f"  part {k:11} win/top8 {mean([a['subscore_parts'][k] for a in top]):.3f} (n {len(top)}) vs rest {mean([a['subscore_parts'][k] for a in rest]):.3f} (n {len(rest)})")
        print(f"  sub-score   win/top8 {mean([a['subscore'] for a in top]):.3f} vs rest {mean([a['subscore'] for a in rest]):.3f}")
    elif args[0] == 'json':
        cache = {}
        out = []
        for src, i in zip(args[1::2], args[2::2]):
            cache.setdefault(src, decks[src]()); out.append(analyse(cache[src][int(i)]))
        print(json.dumps(out, ensure_ascii=False, indent=1))
