"""Prototype of the deterministic line generator specified in docs/research/matchups-and-lines.md.

Pure functions of (deck, card data, sample lists). No randomness, no free text that is not
instantiated from named cards of the deck. Rule numbers = Core Rules 2026-07-16 (GameLab data/rules/core-rules.md).
Run: python3 linegen.py            -> writes out/lines-<slug>.md for the three worked examples + out/variety.txt
"""
from common import *
import itertools, sys

cards, by = load_cards()
DECKS = load_decks(by)
NAME = {c['name']: c for c in cards}


def tag(d):
    return (d['legend'].get('tags') or ['?'])[0]


def need(c):
    """Runes that must be on board to play c: E runes exhausted + P recycled; an exhausted rune may still be
    recycled (rule 164.2.b has no exhaust cost; engine.ts:1525), so the requirement is max(E, P)."""
    return max(E(c), P(c))


def runes(t, seat):
    """Rule 315.3.b (channel 2 per turn) + 485.7/486.7 (second player +1 on first Channel Phase), cap 12 (103.3.a)."""
    return min(12, 2 * t + (1 if seat == 'draw' else 0))


def first_turn(c, seat):
    for t in range(1, 8):
        if runes(t, seat) >= need(c):
            return t
    return 7


class Deck:
    def __init__(self, d):
        self.d = d
        self.legend, self.champ = d['legend'], d['champion']
        self.lib = collections.Counter()
        self.card = {}
        for c, n in d['main']:
            self.lib[c['name']] += n
            self.card[c['name']] = c
        # rule 112 / 103.2.a.1: one Chosen Champion copy starts in the Champion Zone, not in the library
        self.lib[self.champ['name']] -= 1
        if self.lib[self.champ['name']] <= 0:
            del self.lib[self.champ['name']]
        self.card[self.champ['name']] = self.champ
        self.N = sum(self.lib.values())
        self.side = collections.Counter({c['name']: n for c, n in d['side']})
        for c, n in d['side']:
            self.card.setdefault(c['name'], c)
        self.rune = collections.Counter()
        for c, n, code in d['runes']:
            if c:
                self.rune[c['domains'][0]] += n
        self.cls = {nm: classify(c) for nm, c in self.card.items()}

    def names(self, pred, zone='lib'):
        src = self.lib if zone == 'lib' else self.side
        return sorted([nm for nm in src if pred(self.card[nm], self.cls[nm])], key=lambda nm: (need(self.card[nm]), -src[nm], nm))

    def K(self, names):
        return sum(self.lib[n] for n in names)

    def p_any(self, names, seen):
        return p_at_least(self.N, self.K(names), seen)

    def p_both(self, a, b, seen):
        """P(>=1 of set a AND >=1 of set b) by inclusion-exclusion (a, b disjoint name sets)."""
        Ka, Kb = self.K(a), self.K(b)
        n = min(seen, self.N)
        tot = comb(self.N, n)
        pa0 = comb(self.N - Ka, n) / tot
        pb0 = comb(self.N - Kb, n) / tot
        pab0 = comb(self.N - Ka - Kb, n) / tot
        return 1 - pa0 - pb0 + pab0

    def p_power(self, c, t, seat):
        """P(enough runes of c's domain among the runes channelled by turn t). Rune deck is shuffled (rule 114)."""
        if not P(c) or len(c['domains']) != 1 or sum(self.rune.values()) != 12:
            return 1.0
        return p_at_least(12, self.rune[c['domains'][0]], runes(t, seat), P(c))


def fmt(names, dk, lim=4):
    return ', '.join((f"{n} x{dk.lib[n]}" if dk.lib[n] else f"{n} (Champion Zone)") for n in names[:lim]) + (f" (+{len(names) - lim} more)" if len(names) > lim else '')


# ----------------------------------------------------------------- opponent model
def opp_profile(optag, exclude=None):
    lists = [d for d in DECKS if tag(d) == optag and d is not exclude]
    inc = collections.defaultdict(lambda: [0, 0])
    for d in lists:
        for c, n in d['main']:
            inc[c['name']][0] += 1
            inc[c['name']][1] += n
    n = len(lists)
    # expected copies per list
    exp = {nm: v[1] / n for nm, v in inc.items()} if n else {}
    return dict(tag=optag, n=n, exp=exp, share={nm: v[0] / n for nm, v in inc.items()} if n else {})


def targets_of(c, cls, opp):
    """Named opposing cards (with expected copies) that card c answers. Parsed from c's own rulesText."""
    t = strip_reminder(text(c))
    oc = {nm: NAME[nm] for nm in opp['exp'] if nm in NAME}
    ocl = {nm: classify(x) for nm, x in oc.items()}
    out = {}

    def add(pred):
        for nm, x in oc.items():
            if pred(x, ocl[nm]):
                out[nm] = opp['exp'][nm]
    if 'counter' in cls:
        m = re.search(r'costs no more than \[(\d+)\] and no more than \[Any\]', t)
        if m:
            add(lambda x, k: x['type'] == 'spell' and E(x) <= int(m.group(1)) and P(x) <= 1)
        elif re.search(r'chooses (a friendly|it)', t):
            add(lambda x, k: x['type'] == 'spell' and k & {'removal', 'displace', 'stun', 'shrink'} and 'sweeper' not in k)
        else:
            add(lambda x, k: x['type'] == 'spell')
    if 'gear_hate' in cls:
        add(lambda x, k: x['type'] == 'gear')
    if 'hand_attack' in cls:
        add((lambda x, k: x['type'] != 'unit') if 'non-unit' in t else (lambda x, k: True))
    if 'burn' in cls and 'sweeper' not in cls:
        m = re.search(r'[Dd]eals? (\d+)', t)
        if m:
            add(lambda x, k: x['type'] == 'unit' and (x.get('might') or 0) <= int(m.group(1)) and not re.search(r"can't be chosen", text(x)))
    if 'bounce' in cls or 'kill' in cls or 'banish' in cls or 'fight' in cls or 'displace' in cls or 'stun' in cls:
        m = re.search(r'with (\d+) \[Might\] or less', t)
        lim = int(m.group(1)) if m else 99
        add(lambda x, k: x['type'] == 'unit' and (x.get('might') or 0) <= lim and not re.search(r"can't be chosen", text(x)))
    if 'sweeper' in cls:
        add(lambda x, k: x['type'] == 'unit')
    if re.search(r"can't be chosen|\[Deflect", t) or ('protect' in cls and c['type'] != 'unit'):
        add(lambda x, k: x['type'] == 'spell' and k & {'removal', 'displace', 'stun', 'shrink'} and 'sweeper' not in k)
    return out


def top(d, k=3):
    return ', '.join(f"{n} ({v:.1f})" for n, v in sorted(d.items(), key=lambda kv: -kv[1])[:k])


# ----------------------------------------------------------------- features for the HEURISTIC matchup estimate
def raw_features(d):
    dk = Deck(d)
    f = collections.Counter()
    mights = []
    for nm, n in dk.lib.items():
        c, k = dk.card[nm], dk.cls[nm]
        if c['type'] == 'unit':
            f['wide'] += n
            mights += [c.get('might') or 0] * n
            if need(c) <= 2: f['speed'] += n
            elif need(c) == 3: f['speed'] += 0.5 * n
        if 'token' in k: f['wide'] += n
        if 'sweeper' in k: f['sweep'] += n
        if (k & {'removal', 'displace', 'stun'}) and 'sweeper' not in k: f['spot'] += n
        if 'counter' in k: f['counter'] += n
        if 'protect' in k: f['protect'] += n
        if k & {'ganking', 'haste', 'ready', 't_ambush'}: f['reach'] += n
        if 'haste' in k: f['speed'] += n
        if 'pump' in k or 'buff' in k: f['tall'] += n / 4
        if c['type'] == 'spell' and need(c) >= 3: f['spellrel'] += n
    mights.sort(reverse=True)
    f['tall'] += sum(mights[:6]) / 6 if mights else 0
    return f


FEATS = ['speed', 'spot', 'sweep', 'counter', 'wide', 'tall', 'reach', 'protect', 'spellrel']
_RAW = [raw_features(d) for d in DECKS]


def pct_rank(feat, v):
    arr = [r[feat] for r in _RAW]
    return (sum(1 for x in arr if x < v) + 0.5 * sum(1 for x in arr if x == v)) / len(arr)


def features(d):
    r = raw_features(d)
    return {k: pct_rank(k, r[k]) for k in FEATS}, r


def edge(fa, fb):
    """HEURISTIC, uncalibrated. Percentage points for A; antisymmetric: edge(a,b) == -edge(b,a)."""
    inter = lambda f: (f['spot'] + f['sweep']) / 2
    terms = {
        'wide_vs_sweepers': -6 * (fa['wide'] * fb['sweep'] - fb['wide'] * fa['sweep']),
        'tall_vs_single_removal': -6 * (fa['tall'] * fb['spot'] - fb['tall'] * fa['spot']),
        'protection_vs_single_removal': 4 * (fa['protect'] * fb['spot'] - fb['protect'] * fa['spot']),
        'speed_vs_interaction': 5 * (fa['speed'] * (1 - inter(fb)) - fb['speed'] * (1 - inter(fa))),
        'reach': 3 * (fa['reach'] - fb['reach']),
        'counters_vs_key_spells': 4 * (fa['counter'] * fb['spellrel'] - fb['counter'] * fa['spellrel']),
    }
    return sum(terms.values()), terms


ANSWER = {'counter', 'gear_hate', 'hand_attack', 'removal', 'sweeper', 'displace', 'stun', 'protect'}


# ----------------------------------------------------------------- generator
def generate(d, optag=None):
    dk = Deck(d)
    L = []
    w = L.append
    fired = []          # detector ids that fired (used for the variety proof)
    leg, ch = dk.legend, dk.champ
    w(f"### {d['name']}")
    w(f"Source list: {d['source']} (in GameLab sample 2026-09-06). Legend {leg['name']} ({leg['cardCode']}): \"{strip_reminder(text(leg)).strip()}\"")
    w(f"Chosen Champion {ch['name']} ({ch['cardCode']}), {E(ch)} Energy{' + ' + str(P(ch)) + ' Power' if P(ch) else ''}, Might {ch.get('might')}: \"{strip_reminder(text(ch)).strip()[:220]}\"")
    rs = ' / '.join(f"{n} {dom}" for dom, n in dk.rune.most_common())
    w(f"Runes {rs}. Library N={dk.N} (40 minus the Champion Zone copy, rules 103.2.a.1 and 112).")
    hist = collections.Counter()
    for nm, n in dk.lib.items():
        hist[min(need(dk.card[nm]), 7)] += n
    w('Curve (runes needed = max(Energy, Power)): ' + ' '.join(f"{k}{'+' if k == 7 else ''}:{hist[k]}" for k in range(0, 8)))

    # ---- opening hand
    w('\n**Opening hand (rule 116: draw 4; rule 117: set aside up to 2, draw that many, recycle them)**')
    unit_n = dk.K(dk.names(lambda c, k: c['type'] == 'unit'))
    for seat in ('play', 'draw'):
        r1, r2 = runes(1, seat), runes(2, seat)
        t1 = dk.names(lambda c, k: c['type'] == 'unit' and need(c) <= r1)
        t2 = dk.names(lambda c, k: c['type'] == 'unit' and r1 < need(c) <= r2)
        cheap_int = dk.names(lambda c, k: c['type'] != 'unit' and need(c) <= r1 and k & {'removal', 'counter', 'hand_attack', 'displace'})
        board_first = unit_n >= 16 and dk.K(t1) >= 5
        keep = t1 if board_first else sorted(set(t1) | set(cheap_int), key=lambda nm: need(dk.card[nm]))
        kind = 'BOARD' if board_first else 'BOARD-OR-INTERACTION'
        if seat == 'play':
            fired.append('keep:' + kind)
        K = dk.K(keep)
        w(f"- On the {seat} ({r1} runes turn 1, {r2} turn 2). Keep rule [{kind}]: keep any hand holding one of {fmt(keep, dk, 6)} "
          f"(K={K}). P(natural 4) = {pct(p_at_least(dk.N, K, 4))}; set aside the 2 most expensive cards otherwise: P(after mulligan, 6 looks) = {pct(p_at_least(dk.N, K, 6))}.")
        if t2:
            w(f"  Turn-2 follow-ups ({r2} runes): {fmt(t2, dk, 5)}; P(turn-1 play and a turn-2 follow-up by turn 2, 6 cards) = {pct(dk.p_both(t1, t2, 6))}.")
    ship = dk.names(lambda c, k: need(c) >= 7)
    ship5 = dk.names(lambda c, k: 5 <= need(c) < 7)
    if ship or ship5:
        w(f"- Set aside first: {fmt(list(reversed(ship + ship5))[:5] if not ship else ship, dk)} "
          f"(not castable before turn {first_turn(dk.card[(ship or ship5)[0]], 'play')} on the play).")
    if dk.lib.get(ch['name']):
        w(f"- {ch['name']}: {dk.lib[ch['name']]} more in the library; the Champion Zone copy is always available, so extra copies are mulligan fodder until it is played or dies.")
    key3 = [nm for nm in dk.lib if dk.lib[nm] == 3]
    w(f"- Any single 3-of by turn 3: {pct(p_at_least(dk.N, 3, 7))} natural, {pct(p_at_least(dk.N, 3, 9))} if both mulligan slots dug for it; a 2-of: {pct(p_at_least(dk.N, 2, 7))}; a 1-of: {pct(p_at_least(dk.N, 1, 7))}.")

    # ---- turn plan
    w('\n**Turn 1-6 plan (cards seen = 4 + turn number in 1v1; both seats draw on turn 1, rule 315.4 with 485.7 changing only the rune count)**')
    w('| Turn | Seat | Runes | On-curve named plays | P(have one) | Best two-card turn | P(both) | Power check |')
    w('|---|---|---|---|---|---|---|---|')
    spikes = {}
    for t in range(1, 7):
        for seat in ('play', 'draw'):
            R = runes(t, seat)
            seen = 4 + t
            on = dk.names(lambda c, k: c['type'] in ('unit', 'gear') and need(c) in (R, R - 1) and need(c) > 0)
            on = sorted(on, key=lambda nm: (-need(dk.card[nm]), dk.card[nm]['type'] != 'unit', -dk.lib[nm]))
            champ_now = need(ch) <= R and first_turn(ch, seat) == t
            single = (f"**{ch['name']} (Champion Zone, 100%)**; " if champ_now else '') + (fmt(on, dk, 3) if on else '-')
            if champ_now:
                spikes[seat] = t
            p1 = pct(dk.p_any(on, seen)) if on else '-'
            # best pair: maximise joint probability among distinct names with summed need == R (unit + anything first)
            best = None
            if t >= 2:
                nms = [nm for nm in dk.lib if 0 < need(dk.card[nm]) < R]
                for a, b in itertools.combinations(nms, 2):
                    ca, cb = dk.card[a], dk.card[b]
                    if E(ca) + E(cb) > R or max(E(ca) + E(cb), P(ca) + P(cb)) != R:
                        continue
                    if ca['type'] != 'unit' and cb['type'] != 'unit':
                        continue
                    p = dk.p_both([a], [b], seen)
                    key = (p, a, b)
                    if best is None or key > best:
                        best = key
                # champion + one card
                if need(ch) < R and first_turn(ch, seat) <= t:
                    rest = [nm for nm in dk.lib if E(dk.card[nm]) + E(ch) <= R and max(E(dk.card[nm]) + E(ch), P(dk.card[nm]) + P(ch)) == R]
                    if rest:
                        p = dk.p_any(rest, seen)
                        if best is None or p > best[0]:
                            best = (p, ch['name'] + ' (zone)', ' or '.join(sorted(rest, key=lambda nm: -dk.lib[nm])[:3]))
            pair = f"{best[1]} + {best[2]}" if best else '-'
            p2 = pct(best[0]) if best else '-'
            pw = [nm for nm in on if P(dk.card[nm]) and len(dk.card[nm]['domains']) == 1]
            pwtxt = '; '.join(f"{nm} needs {P(dk.card[nm])} {dk.card[nm]['domains'][0]}: {pct(dk.p_power(dk.card[nm], t, seat))}, leaves {R - P(dk.card[nm])}+2 runes next turn" for nm in pw[:2]) or '-'
            w(f"| {t} | {seat} | {R} | {single} | {p1} | {pair} | {p2} | {pwtxt} |")

    # ---- sequencing
    w('\n**Sequencing interactions found in this list**')
    seq = []

    def S(i, msg):
        fired.append(i)
        seq.append(f"- [{i}] {msg}")
    allc = lambda pred: dk.names(pred)
    units = allc(lambda c, k: c['type'] == 'unit')
    cheapest = sorted(dk.lib, key=lambda nm: (need(dk.card[nm]), -dk.lib[nm]))[:3]
    leg_cards = allc(lambda c, k: 'legion' in k)
    if leg_cards:
        S('legion', f"Play {' / '.join(cheapest)} BEFORE {fmt(leg_cards, dk)}: Legion text is active only if another card was already finalized by you this turn (rule 812.1.c).")
    readiers = allc(lambda c, k: re.search(r'ready another unit|ready a(nother)? (friendly )?unit|ready (it|them)', strip_reminder(text(c))) is not None)
    if readiers:
        big = sorted([u for u in units if u not in readiers], key=lambda nm: -(dk.card[nm].get('might') or 0))[:2]
        tgt = [ch['name']] + [b for b in big if b != ch['name']]
        r = dk.card[readiers[0]]
        tot = E(ch) + E(r)
        tp = next((t for t in range(1, 8) if runes(t, 'play') >= tot), 7)
        td = next((t for t in range(1, 8) if runes(t, 'draw') >= tot), 7)
        S('ready-after', f"{tgt[0]} first, THEN {readiers[0]}: units enter exhausted (rule 359.2.c) and the Standard Move costs an exhaust (rule 144.2), so the readier must resolve second to buy a same-turn move. "
                         f"{tgt[0]} + {readiers[0]} = {tot} Energy: turn {tp} on the play, turn {td} on the draw; P({readiers[0]} seen by then) = {pct(dk.p_any([readiers[0]], 4 + tp))} / {pct(dk.p_any([readiers[0]], 4 + td))}. Other targets: {', '.join(tgt[1:]) or '-'}.")
    needs_body = allc(lambda c, k: c['type'] == 'unit' and re.search(r'When you play me, [^.]*(another friendly unit|another unit you control)', strip_reminder(text(c))) is not None)
    if needs_body:
        S('needs-body', f"{fmt(needs_body, dk)} want a friendly unit already on board (their play effect needs another unit): lead with {', '.join([u for u in units if u not in needs_body][:3])}.")
    slow = allc(lambda c, k: c['type'] == 'spell' and not (k & {'t_action', 't_reaction', 't_hidden'}) and k & {'displace', 'pump', 'removal', 'shrink', 'stun', 'sweeper', 'hand_attack', 'buff'})
    if slow:
        S('pre-combat', f"Cast {fmt(slow, dk)} BEFORE the move that starts the showdown: they have neither Action nor Reaction, so they are unplayable in a Showdown State (rules 308.1.a, 310.1.a).")
    act = allc(lambda c, k: 't_action' in k and c['type'] != 'unit')
    rea = allc(lambda c, k: 't_reaction' in k and c['type'] != 'unit')
    if act:
        S('action-window', f"{fmt(act, dk)} are Action speed: playable only when you hold Focus in a showdown (rules 313.1, 347.1). As attacker you receive Focus first (rule 464.2.d), so passing with these in hand lets the defender close the showdown (rule 347.2.a); as defender you act after the attacker's first play.")
    if rea:
        cheap_r = min(need(dk.card[n]) for n in rea)
        S('reaction-hold', f"{fmt(rea, dk)} are Reaction speed: they can answer a chain item without Focus (rules 309.1.a, 312.2.d, 813.1.c). Cheapest hold needs {cheap_r} ready rune(s); runes are spent when the pool is filled, and the pool empties at end of turn (rule 167), so the runes must be left ready.")
    hid = allc(lambda c, k: 't_hidden' in k)
    if hid:
        S('hidden', f"Hide {fmt(hid, dk)} the turn BEFORE you need it: hiding costs [A] (one rune recycled, rule 164.2.b), needs a battlefield you control with no facedown card, and the card gains Reaction at cost 0 only from the next turn (rule 811.1.b). Its targets must be at that battlefield (rule 811.1.d.2).")
    amb = allc(lambda c, k: 't_ambush' in k)
    if amb:
        S('ambush', f"{fmt(amb, dk)}: hold the runes and play during the showdown as a Reaction to a battlefield where you already have a unit (rule 822.1.b); the opponent assigns nothing to it before it arrives.")
    alone = [nm for nm in list(dk.lib) + [leg['name']] if re.search(r'\balone\b|one on one|only unit you control', text(dk.card.get(nm, leg)))]
    if alone:
        S('alone', f"One unit per battlefield: {', '.join(alone)} check 'alone / one on one'. Reinforcing a held battlefield turns these off; send the second unit to the other battlefield instead (two battlefields in 1v1, rule 485.4).")
    hunt = [(nm, int(m.group(1))) for nm in list(dk.lib) + [ch['name']] for m in [re.search(r'\[Hunt ?(\d*)\]', text(dk.card[nm]).replace('[Hunt]', '[Hunt 1]'))] if m and m.group(1)]
    lvl = sorted({int(x) for nm in list(dk.lib) + [ch['name'], leg['name']] for x in re.findall(r'\[Level (\d+)\]', text(dk.card.get(nm, leg)))})
    if lvl:
        hv = max([h for _, h in hunt], default=0)
        xp_other = allc(lambda c, k: re.search(r'[Gg]ain \d+ XP', strip_reminder(text(c))) is not None)
        S('xp', f"Level thresholds in list: {lvl}. Best Hunt value {hv} ({', '.join(sorted({n for n, _ in hunt})) or 'none'}): Level {lvl[0]} needs {math.ceil(lvl[0] / hv) if hv else '?'} conquer/hold triggers from that unit (rule 823.1.c.1), i.e. not before that unit's scoring turn number {math.ceil(lvl[0] / hv) if hv else '?'}; other XP sources: {', '.join(xp_other) or 'none'}.")
    tax = allc(lambda c, k: P(c) >= 2)
    if tax:
        c0 = dk.card[tax[0]]
        S('power-tax', f"{fmt(tax, dk)} cost 2+ Power: each Power recycles a rune to the Rune Deck (rules 164.2.b, 161.2.b). {tax[0]} on turn 3 on the play leaves {runes(3, 'play') - P(c0)} runes, so turn 4 has {runes(3, 'play') - P(c0) + 2} instead of {runes(4, 'play')}"
                       + (f": {ch['name']} ({need(ch)}) slips a turn" if runes(3, 'play') - P(c0) + 2 < need(ch) <= runes(4, 'play') else '') + '.')
    haste = allc(lambda c, k: 'haste' in k)
    if 'haste' in dk.cls[ch['name']] and ch['name'] not in haste:
        haste = haste + [ch['name']]
        dk.lib[ch['name']] += 0
    if haste:
        c0 = dk.card[haste[-1]]
        S('accelerate', f"{fmt(haste, dk)}: Accelerate adds [1][C] to enter ready (rule 805.1.a). {haste[-1]} accelerated needs {E(c0) + 1} Energy and {P(c0) + 1} Power: turn {next(t for t in range(1, 8) if runes(t, 'play') >= E(c0) + 1)} on the play / {next(t for t in range(1, 8) if runes(t, 'draw') >= E(c0) + 1)} on the draw.")
    burn = allc(lambda c, k: k & {'burn', 'sweeper', 'fight'})
    if burn:
        S('damage-heals', f"{fmt(burn, dk)} deal damage, and all units heal in the Combat Cleanup (rule 466.1.a.1) and at end of turn (rule 317.2.b): stack them with combat damage inside the same showdown or finish the unit outright.")
    gearq = allc(lambda c, k: c['type'] == 'gear' and ('Equip' in kw(c) or 'Quick-Draw' in kw(c)))
    if gearq:
        S('equip', f"Equipment {fmt(gearq, dk)}: unattached gear is recalled to base in the next Cleanup (rule 457.1) and equip is its own payment; play the carrier first, equip before the move (Quick-Draw gear may attach at Reaction speed, rule 819.1.c).")
    tok = allc(lambda c, k: 'token' in k)
    dk_kn = allc(lambda c, k: 'Deathknell' in kw(c))
    if dk_kn:
        S('deathknell', f"Deathknell carriers {fmt(dk_kn, dk)}: trade them or leave them as the lone defender on purpose; the trigger is the value.")
    L += seq or ['- none of the detectors fired']

    # ---- spikes
    w('\n**Power spikes**')
    w(f"- {ch['name']} from the Champion Zone: turn {spikes.get('play', first_turn(ch, 'play'))} on the play, turn {spikes.get('draw', first_turn(ch, 'draw'))} on the draw (probability 100%, not a draw).")
    topend = sorted(dk.lib, key=lambda nm: -need(dk.card[nm]))[:2]
    for nm in topend:
        c = dk.card[nm]
        w(f"- Top end {nm} x{dk.lib[nm]} ({need(c)}): castable turn {first_turn(c, 'play')} play / {first_turn(c, 'draw')} draw; P(drawn by then) = {pct(dk.p_any([nm], 4 + first_turn(c, 'play')))} / {pct(dk.p_any([nm], 4 + first_turn(c, 'draw')))}.")
    if rea:
        cr = min(need(dk.card[n]) for n in rea)
        for seat in ('play', 'draw'):
            t = next((t for t in range(1, 8) if runes(t, seat) >= need(ch) + cr), 7)
            w(f"- First turn {ch['name']} can be deployed with a Reaction still up ({need(ch)} + {cr}): turn {t} on the {seat}.")
    fired.append(f"spike:{spikes.get('play', first_turn(ch, 'play'))}/{spikes.get('draw', first_turn(ch, 'draw'))}")

    # ---- opponent
    res = dict(deck=dk, lines=L, fired=fired)
    if optag:
        opp = opp_profile(optag, exclude=d)
        w(f"\n**Versus {optag} (DATA: {opp['n']} {optag} list(s) in the 2026-09-06 sample; expected copies per list in brackets)**")
        answers = {}
        for nm in list(dk.lib) + list(dk.side):
            tg = targets_of(dk.card[nm], dk.cls[nm], opp)
            if tg:
                answers[nm] = tg
        for nm in sorted(dk.lib, key=lambda x: -sum(answers.get(x, {}).values())):
            if nm in answers:
                w(f"- {nm} x{dk.lib[nm]} answers {sum(answers[nm].values()):.1f} expected copies: {top(answers[nm], 4)}.")
        oc = {nm: NAME[nm] for nm in opp['exp'] if nm in NAME}
        ocl = {nm: classify(x) for nm, x in oc.items()}

        def olist(pred, k=4):
            xs = sorted([nm for nm in oc if pred(oc[nm], ocl[nm])], key=lambda nm: -opp['exp'][nm])
            return ', '.join(f"{nm} ({opp['exp'][nm]:.1f}; {need(oc[nm])} runes)" for nm in xs[:k])
        pa = []
        for lab, pred in [('sweepers', lambda c, k: 'sweeper' in k), ('counterspells', lambda c, k: 'counter' in k),
                          ('Reaction tricks/removal', lambda c, k: 't_reaction' in k and c['type'] == 'spell' and 'counter' not in k),
                          ('Hidden cards', lambda c, k: 't_hidden' in k), ('Ambush units', lambda c, k: 't_ambush' in k),
                          ('gear removal', lambda c, k: 'gear_hate' in k), ('hand attack', lambda c, k: 'hand_attack' in k)]:
            s = olist(pred)
            if s:
                pa.append(f"- Play around {lab}: {s}.")
        L += pa
        # my spells inside their counter range
        for onm in oc:
            if 'counter' in ocl[onm]:
                mine = targets_of(oc[onm], ocl[onm], dict(exp={nm: dk.lib[nm] for nm in dk.lib}))
                if mine:
                    w(f"- Their {onm} ({opp['exp'][onm]:.1f}) can stop: {', '.join(sorted(mine, key=lambda x: -mine[x])[:5])}.")
        # side plan: relative value = expected copies answered vs this opponent / mean over every other legend in the sample
        others = sorted({tag(x) for x in DECKS} - {optag, tag(d)})
        profs = [opp_profile(o) for o in others]

        def rel(nm):
            here = sum(answers.get(nm, {}).values())
            fld = [sum(targets_of(dk.card[nm], dk.cls[nm], p).values()) for p in profs]
            mean = sum(fld) / len(fld) if fld else 0
            return here, mean, (here / mean if mean > 0 else (9.9 if here > 0 else 0))
        scored_side = sorted(((rel(nm), nm) for nm in dk.side if dk.cls[nm] & ANSWER), key=lambda x: -x[0][2])
        scored_main = sorted(((rel(nm), nm) for nm in dk.lib if dk.cls[nm] & ANSWER), key=lambda x: x[0][2])
        ins = [(r, nm) for r, nm in scored_side if r[2] >= 1.2 and r[0] >= 2.0]
        outs = [(r, nm) for r, nm in scored_main if r[2] <= 0.8]
        w("- Side plan (1-for-1, Tournament Rules 403.4). Score = expected opposing copies answered here / mean over the other "
          f"{len(profs)} legends in the sample; IN at ratio >= 1.2 (and >= 2.0 copies), OUT at ratio <= 0.8:")
        n_in = sum(dk.side[nm] for _, nm in ins); n_out = sum(dk.lib[nm] for _, nm in outs)
        k = min(n_in, n_out)
        for r, nm in scored_side[:4]:
            w(f"  side candidate {nm} x{dk.side[nm]}: {r[0]:.1f} here vs {r[1]:.1f} field mean (ratio {r[2]:.2f})" + (f"; hits {top(answers[nm], 3)}" if nm in answers else ''))
        if k == 0:
            w("  no swap: " + ('no sideboard answer beats its field average here' if not ins else 'no main-deck answer underperforms its field average here') + '.')
        else:
            rem = k
            for r, nm in ins:
                q = min(dk.side[nm], rem); rem -= q
                if q:
                    w(f"  IN  +{q} {nm}: {r[0]:.1f} vs {r[1]:.1f} field mean ({top(answers[nm], 3)}).")
            rem = k
            for r, nm in outs:
                q = min(dk.lib[nm], rem); rem -= q
                if q:
                    w(f"  OUT -{q} {nm}: {r[0]:.1f} vs {r[1]:.1f} field mean" + (f" (only {top(answers[nm], 2)})" if nm in answers else ' (no relevant target in their lists)') + '.')
        fired.append('side:' + ','.join(sorted(nm for _, nm in ins)) + '|' + ','.join(sorted(nm for _, nm in outs)))
        # heuristic matchup
        opl = [x for x in DECKS if tag(x) == optag and x is not d]
        if opl:
            fa, _ = features(d)
            es = [edge(fa, features(o)[0]) for o in opl]
            e = sum(x[0] for x in es) / len(es)
            terms = {k: sum(x[1][k] for x in es) / len(es) for k in es[0][1]}
            w(f"- HEURISTIC matchup estimate vs {optag}: {50 + max(-20, min(20, e)):.0f}% (uncalibrated; terms: " + ', '.join(f"{k} {v:+.1f}" for k, v in terms.items()) + ').')
    return res


def pick(tagname, idx=0):
    xs = [d for d in DECKS if tag(d) == tagname and sum(n for _, n, _ in d['runes']) == 12]
    return xs[idx]


if __name__ == '__main__':
    os.makedirs('out', exist_ok=True)
    examples = [('Master Yi', "Kai'Sa"), ("Rek'Sai", "Kai'Sa"), ('Volibear', 'Master Yi'), ('Master Yi', 'Ornn')]
    if len(sys.argv) > 1:
        examples = [tuple(a.split(':')) for a in sys.argv[1:]]
    results = []
    for me, op in examples:
        d = pick(me)
        r = generate(d, op)
        slug = re.sub(r'[^a-z]+', '-', (me + ' vs ' + op).lower()).strip('-')
        open(f'out/lines-{slug}.md', 'w').write('\n'.join(r['lines']) + '\n')
        results.append((me + ' (vs ' + op + ')', r))
        print(me, 'lines', len(r['lines']), 'fired', r['fired'])
    # variety
    out = []
    for (a, ra), (b, rb) in itertools.combinations(results, 2):
        la, lb = set(ra['lines']), set(rb['lines'])
        fa, fb = set(ra['fired']), set(rb['fired'])
        na, nb = set(ra['deck'].lib), set(rb['deck'].lib)
        out.append(f"{a} vs {b}: identical output lines {len(la & lb)}/{len(la | lb)}; shared main-deck card names {len(na & nb)}/{len(na | nb)}; "
                   f"detector signature overlap {len(fa & fb)}/{len(fa | fb)}; only in {a}: {sorted(fa - fb)}; only in {b}: {sorted(fb - fa)}")
    open('out/variety.txt', 'w').write('\n'.join(out) + '\n')
    print('\n'.join(out))
