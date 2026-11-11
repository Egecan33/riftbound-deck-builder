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
    doubler=R(r"trigger an additional time|activate the conquer effects"),
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

# ---------------------------------------------------------------- routes
# weight tables: feature -> weight per copy.  role: which features make a card a CLOSER for the route.
ROUTES = {
    'WIDE':   dict(label='Go-wide flood (both battlefields)', w=dict(token=1.0, multi_token=1.0, widepay=1.5, cheap=0.5)),
    'TALL':   dict(label='Go-tall single threat',             w=dict(big=1.0, scaling=1.0, mightypay=1.0, buff=0.75, equip=0.75, pump=0.5, prot=0.5)),
    'HOLD':   dict(label='Hold-and-defend',                   w=dict(holdpay=1.5, shield=1.0, tank=1.0, stun=0.5, deftrick=0.5)),
    'BURST':  dict(label='Burst conquer (ready/haste/move)',  w=dict(haste=1.0, ready=1.0, gank=0.75, move_friendly=0.75, assault=0.5, conqpay=0.5, enter_ready=0.5)),
    'POINTS': dict(label='Direct point gain',                 w=dict(point_self=3.0, doubler=1.0)),
    'HIDDEN': dict(label='Hidden / Ambush tempo (face-down reactions)', w=dict(hidden=0.25, hidden_unit=1.0, ambush=1.0, facedown_pay=1.5)),
    'ATTRITION': dict(label='Attrition / recursion control',  w=dict(removal=1.0, sweep=1.5, counter=0.75, recur=0.75, draw=0.5, displace=0.5, debuff=0.5)),
}
# Reference level per route = 75th percentile of the raw score over the 91 complete lists in the two
# corpora (59 from 2026-09-06, 37 from 2026-11-11; recomputed by `python3 detect.py calibrate`).
REF = {'WIDE': 10.5, 'TALL': 10.0, 'HOLD': 6.0, 'BURST': 12.5, 'POINTS': 6.0, 'ATTRITION': 19.0, 'HIDDEN': 7.5}  # POINTS: p75 is 0, so 6.0 = two copies of a point card
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

META = Counter()   # copies (main + side) of each card across the current corpus: answers are named in order of real play
def _load_meta():
    if META or not os.path.exists(NOV): return
    for d in json.load(open(NOV)):
        for sec in ('maindeck', 'sideboard'):
            for e in d['sections'].get(sec, []): META[_pa_card(e)['name']] += e['count']

def pool_examples(feature, limit=5, typ=None, max_energy=None):
    _load_meta()
    xs = [c for c in POOL if feature in feats(c) and c['type'] not in ('legend', 'battlefield', 'rune') and (typ is None or infer_type(c) == typ) and (max_energy is None or (c.get('energy') or 0) <= max_energy)]
    xs.sort(key=lambda c: (-META[c['name']], (c.get('energy') or 0), c['name']))
    return [f"{c['name']} ({META[c['name']]})" for c in xs[:limit]]

def analyse(deck):
    main, legend, bfs, champ = deck['main'], deck['legend'], deck['battlefields'], deck['champion']
    n_main = sum(n for _, n in main) or 1
    fc = Counter()                                  # feature -> copies
    for c, n in main:
        for f in feats(c): fc[f] += n
    lf = feats(legend) if legend else set()
    routes = {}
    for r, spec in ROUTES.items():
        raw, closers, enablers = 0.0, [], []
        for c, n in main:
            f = feats(c)
            wsum = sum(w for k, w in spec['w'].items() if k in f)
            if wsum <= 0: continue
            raw += wsum * n
            (closers if is_closer(r, c, f) else enablers).append((c['name'], n, wsum))
        leg_hit = sorted(k for k in spec['w'] if k in lf)
        raw += LEGEND_WEIGHT * sum(spec['w'][k] for k in leg_hit)
        bf_hit = []
        for b in bfs:
            bh = [k for k in spec['w'] if k in feats(b)]
            if bh: raw += BF_WEIGHT * sum(spec['w'][k] for k in bh); bf_hit.append(b['name'])
        ccopies = sum(n for _, n, _ in closers)
        champ_closer = bool(champ and any(nm == champ['name'] for nm, _, _ in closers))
        legend_closer = bool(set(LEGEND_CLOSER.get(r, ())) & lf)
        routes[r] = dict(route=r, label=spec['label'], raw=round(raw, 2), norm=round(raw / REF[r], 2),
                         closers=sorted(closers, key=lambda x: (-x[1] * x[2], x[0])), enablers=sorted(enablers, key=lambda x: (-x[1] * x[2], x[0])),
                         closer_copies=ccopies, closer_names=len(closers), champion_is_closer=champ_closer, legend_is_closer=legend_closer,
                         p_closer_t5=1.0 if (champ_closer or legend_closer) else round(hyper_at_least_one(ccopies, n_main), 3),
                         legend_features=leg_hit, battlefields=bf_hit)
    # special, rule-based routes ------------------------------------------------
    specials = []
    names = {c['name']: n for c, n in main}
    bfn = {b['name'] for b in bfs}
    def has(n): return names.get(n, 0)
    if 'The Grand Plaza' in bfn:
        tok = fc['token'] + fc['cheap']
        specials.append(dict(route='ALTWIN', label='Alternate win: The Grand Plaza (hold with 7+ units there)', strength=round(min(1, tok / 20), 2),
                             cards=['The Grand Plaza'] + [nm for nm, n, _ in routes['WIDE']['closers'][:4]], note=f'{fc["token"]} token-maker copies, {fc["cheap"]} units costing 2 or less; only live in games where this battlefield is the one in play'))
    if has('Gutter Palace'):
        specials.append(dict(route='ALTWIN', label='Alternate win: Gutter Palace (exactly 4 cards in hand and 4 units at battlefields at your Beginning Phase)', strength=round(hyper_at_least_one(has('Gutter Palace'), n_main), 2), cards=['Gutter Palace'], note=f'{has("Gutter Palace")} copies'))
    doublers = [(c['name'], n) for c, n in main if 'doubler' in feats(c)] + [(b['name'], 1) for b in bfs if 'doubler' in feats(b)]
    trig_pts = [(c['name'], n) for c, n in main if 'point_self' in feats(c) and ({'holdpay', 'conqpay'} & feats(c))]
    if doublers and trig_pts:
        specials.append(dict(route='COMBO', label='Combo finisher: trigger doubler + scoring-trigger point card', strength=round(hyper_at_least_one(sum(n for _, n in doublers), n_main) * hyper_at_least_one(sum(n for _, n in trig_pts), n_main), 2), cards=[x for x, _ in doublers + trig_pts], note='each extra trigger is +1 point outside the Final Point restriction (rule 471.1.a.1)'))
    if has('Yasuo, Windrider'):
        mv = fc['move_friendly'] + (LEGEND_WEIGHT if 'move_friendly' in lf else 0)
        specials.append(dict(route='COMBO', label='Combo finisher: Yasuo, Windrider third move (+1 point)', strength=round(min(1, mv / 8), 2), cards=['Yasuo, Windrider'] + [c['name'] for c, n in main if 'move_friendly' in feats(c) and c['name'] != 'Yasuo, Windrider'][:4], note=f'{mv} move-enabler copies (legend counted as {LEGEND_WEIGHT})'))
    pt_bfs = [b['name'] for b in bfs if 'point_self' in feats(b)]
    sym = [b['name'] for b in bfs if 'point_any' in feats(b) and 'point_self' not in feats(b)]
    if sym:
        specials.append(dict(route='BF_SYMMETRIC', label='Symmetric point battlefield (both players +1: the race is to 7)', strength=round(len(sym) / 3, 2), cards=sym, note='shortens the game by one scoring step for everyone; favours the faster deck'))
    if pt_bfs:
        specials.append(dict(route='BF_ENGINE', label='Battlefield point engine', strength=round(len(pt_bfs) / 3, 2), cards=pt_bfs, note='in play in roughly 1 of 3 Bo1 games per listed copy (rule 485.5); chosen in Bo3 (rule 486.5)'))
    if legend and ('point_self' in lf):
        specials.append(dict(route='LEGEND_ENGINE', label='Legend point engine', strength=1.0, cards=[legend['name']], note=''))
    ranked = sorted(routes.values(), key=lambda r: -r['norm'])
    primary, second = ranked[0], ranked[1]
    # speed (goldfish clock, uncontested): see wincons.md 4.4 ------------------
    fast1 = sum(n for c, n in main if 'haste' in feats(c) and (c.get('energy') or 0) <= 1)
    cheap_units = fc['cheap']
    t_first = 1 if fast1 >= 6 else 2 if cheap_units + fast1 >= 8 else 3
    two_bf = min(1.0, (cheap_units + fc['token'] + fc['gank'] + fc['haste'] + fc['ready'] + (LEGEND_WEIGHT if {'token', 'ready', 'gank', 'enter_ready', 'move_friendly'} & lf else 0)) / 20)
    ppt = 1 + two_bf
    bonus = min(2.0, 0.25 * fc['point_self'])
    clock = t_first + math.ceil((VICTORY['1v1'] - 1 - bonus) / ppt)
    speed = 'fast' if clock <= 6 else 'medium' if clock <= 7 else 'slow'
    # final point reach --------------------------------------------------------
    fp_hold = min(1.0, (fc['shield'] + fc['tank'] + fc['holdpay'] + fc['prot'] + (LEGEND_WEIGHT if {'shield', 'tank', 'holdpay', 'deftrick', 'debuff'} & lf else 0)) / 12)
    fp_double = min(1.0, (fc['haste'] + fc['ready'] + fc['gank'] + fc['move_friendly'] + (LEGEND_WEIGHT if {'ready', 'gank', 'move_friendly', 'enter_ready'} & lf else 0)) / 12)
    fp_direct = min(1.0, fc['point_self'] / 4 + (0.34 * len(pt_bfs)))
    final_point = dict(hold=round(fp_hold, 2), double_conquer=round(fp_double, 2), direct=round(fp_direct, 2))
    # folds-to -----------------------------------------------------------------
    folds = []
    units = [(c, n) for c, n in main if 'unit' in feats(c)]
    ucount = sum(n for _, n in units) or 1
    avg_m = sum((c.get('might') or 0) * n for c, n in units) / ucount
    pc = primary['closers']
    prot_share = (sum(n for c, n in main if c['name'] in {x[0] for x in pc} and 'prot' in feats(c)) / primary['closer_copies']) if primary['closer_copies'] else 0
    top_closer = pc[0][0] if pc else None
    if primary['route'] in ('TALL', 'POINTS', 'HOLD') and prot_share < 0.5 and top_closer:
        folds.append(f"single-target removal/bounce on {top_closer} ({round(prot_share * 100)}% of closer copies have Deflect or can't-be-chosen) - e.g. " + ', '.join(pool_examples('removal', 4, 'spell', 3)))
    if avg_m <= 3.2 or primary['route'] == 'WIDE':
        folds.append(f"sweepers (average unit Might {avg_m:.1f}, {fc['token']} token-maker copies) - e.g. " + ', '.join(pool_examples('sweep', 5)))
    if primary['route'] == 'BURST' or second['route'] == 'BURST':
        folds.append("stun on the readied attacker and Shield/Tank defenders (a stunned unit deals no combat damage) - e.g. " + ', '.join(pool_examples('stun', 4, 'spell', 3)))
    if primary['route'] == 'HOLD' or fp_hold >= 0.75:
        folds.append("displacement of the holder before your Beginning Phase - e.g. " + ', '.join(pool_examples('displace', 5, None, 4)))
    if primary['route'] == 'ATTRITION':
        folds.append(f"two-battlefield pressure: {ucount} unit copies to contest 2 battlefields, {fc['removal']} single-target answers vs {fc['sweep']} sweepers; Deflect taxes every targeted answer - e.g. " + ', '.join(pool_examples('prot', 4, 'unit')))
    if primary['route'] == 'HIDDEN' or fc['hidden'] >= 8:
        folds.append(f"Hidden hate ({fc['hidden']} Hidden copies): Noxus Saboteur (your Hidden cards can't be revealed at its battlefield), Mystic Vortex (Reaction cards cost [Any] more in showdowns there); a lost combat removes your face-down cards there (rule 466.5.c)")
    if fc['equip'] >= 5:
        folds.append(f"gear removal ({fc['equip']} Equipment copies carry the Might)")
    if fc['recur'] >= 8:
        folds.append(f"trash hate / banish ({fc['recur']} copies use the trash)")
    if fc['point_self'] or pt_bfs:
        folds.append("point denial - Tianna Crownguard (while she is at a battlefield opponents can't score points)")
    if fc['removal'] + fc['sweep'] + fc['counter'] + fc['stun'] + fc['displace'] < 8:
        folds.append(f"any faster racer: only {fc['removal'] + fc['sweep'] + fc['counter'] + fc['stun'] + fc['displace']} interaction copies in the main deck")
    if primary['closer_copies'] < 6 and not primary['champion_is_closer'] and not primary['legend_is_closer']:
        folds.append(f"discard / counterspell on the few closers ({primary['closer_copies']} copies)")
    # sub-score ------------------------------------------------------------------
    s_closer = primary['p_closer_t5']
    s_depth = min(1.0, primary['norm'] / 1.5)
    s_planb = min(1.0, second['norm'] / max(primary['norm'], 1e-9)) * min(1.0, second['norm'])
    s_final = max(final_point.values())
    s_res = min(1.0, (fc['prot'] + fc['recur'] * 0.5 + fc['counter']) / 8)
    score = round(0.30 * s_closer + 0.25 * s_depth + 0.15 * s_planb + 0.20 * s_final + 0.10 * s_res, 3)
    return dict(deck=deck['name'], src=deck['src'], idx=deck['idx'], url=deck['url'], legend=legend['name'] if legend else None, champion=champ['name'] if champ else None,
                n_main=n_main, routes=ranked, specials=specials, features=dict(fc), speed=dict(t_first=t_first, points_per_turn=round(ppt, 2), bonus_points=bonus, goldfish_turn=clock, label=speed),
                final_point=final_point, folds_to=folds, avg_unit_might=round(avg_m, 2), unit_copies=ucount,
                subscore=score, subscore_parts=dict(closer=round(s_closer, 3), depth=round(s_depth, 3), plan_b=round(s_planb, 3), final_point=round(s_final, 3), resilience=round(s_res, 3)))

# ---------------------------------------------------------------- reporting
def fmt_cards(xs, k=6):
    return ', '.join(f"{n}x {nm}" for nm, n, _ in xs[:k]) + (f" (+{len(xs) - k} more)" if len(xs) > k else '')

def report(a):
    L = [f"### {a['deck']}", f"legend: {a['legend']} | champion: {a['champion']} | main {a['n_main']} | {a['url']}",
         f"win-condition sub-score {a['subscore']}  parts {a['subscore_parts']}",
         f"speed: {a['speed']['label']} - goldfish win turn {a['speed']['goldfish_turn']} (first conquer T{a['speed']['t_first']}, {a['speed']['points_per_turn']} pts/turn, {a['speed']['bonus_points']} bonus pts) | final point reach {a['final_point']}"]
    for i, r in enumerate(a['routes'][:3], 1):
        L.append(f"{i}. {r['route']} {r['label']}  norm {r['norm']} (raw {r['raw']}) | closers {r['closer_copies']} copies / {r['closer_names']} names, P(closer by T5) {r['p_closer_t5']}" + (" [champion]" if r['champion_is_closer'] else '') + (" [legend]" if r['legend_is_closer'] else '') + (f" | legend: {'+'.join(r['legend_features'])}" if r['legend_features'] else '') + (f" | battlefields: {', '.join(r['battlefields'])}" if r['battlefields'] else ''))
        L.append(f"   closers: {fmt_cards(r['closers']) or '-'}")
        L.append(f"   enablers: {fmt_cards(r['enablers']) or '-'}")
    for s in a['specials']:
        L.append(f"*  {s['route']}: {s['label']} strength {s['strength']} | {', '.join(s['cards'])} | {s['note']}")
    L.append("folds to:")
    L += [f"   - {x}" for x in a['folds_to']] or ['   - (nothing flagged)']
    return '\n'.join(L)

def line(a):
    r = a['routes']
    sp = '+'.join(sorted({s['route'] for s in a['specials']}))
    return f"{a['src']}{a['idx']:>3} | {(a['legend'] or '?')[:30]:30} | {r[0]['route']:9} {r[0]['norm']:>4} | {r[1]['route']:9} {r[1]['norm']:>4} | cl {r[0]['closer_copies']:>2} | T{a['speed']['goldfish_turn']} {a['speed']['label']:6} | {a['subscore']:.2f} | {sp:18} | {a['deck'][:44]}"

if __name__ == '__main__':
    args = sys.argv[1:] or ['sept']
    decks = {'sept': load_sept, 'nov': load_nov}
    if args[0] in decks:
        for d in decks[args[0]](): print(line(analyse(d)))
    elif args[0] == 'show':
        cache = {}
        for src, i in zip(args[1::2], args[2::2]):
            cache.setdefault(src, decks[src]())
            print(report(analyse(cache[src][int(i)]))); print()
    elif args[0] == 'calibrate':
        al = [analyse(d) for k in decks for d in decks[k]() if d['complete']]
        print(len(al), 'complete lists')
        for r in ROUTES:
            v = sorted(next(x['raw'] for x in a['routes'] if x['route'] == r) for a in al)
            print(r, 'p25', v[len(v) // 4], 'p50', v[len(v) // 2], 'p75', v[(3 * len(v)) // 4], 'max', v[-1])
    elif args[0] == 'table':
        al = [analyse(d) for d in decks[args[1]]() if d['complete']]
        t = defaultdict(Counter)
        for a in al: t[(a['legend'] or '?')][a['routes'][0]['route']] += 1
        for leg in sorted(t): print(f"{leg:40} " + ', '.join(f"{k} {v}" for k, v in t[leg].most_common()))
        print('primary route totals', Counter(a['routes'][0]['route'] for a in al).most_common(), 'n', len(al))
        print('secondary route totals', Counter(a['routes'][1]['route'] for a in al).most_common())
        print('specials', Counter(s['route'] for a in al for s in a['specials']).most_common())
    elif args[0] == 'json':
        cache = {}
        out = []
        for src, i in zip(args[1::2], args[2::2]):
            cache.setdefault(src, decks[src]()); out.append(analyse(cache[src][int(i)]))
        print(json.dumps(out, ensure_ascii=False, indent=1))
