"""Deterministic line generator, version 2 (Radiance-era data, typed interaction edges).

  python3 linegen2.py <deck-id-prefix>:<opponent legend> [...]   -> out/v2-<legend>-vs-<opp>.md
  python3 linegen2.py --examples                                  -> the worked examples + out/v2-variety.txt

No random numbers. Every printed sentence is instantiated with card names from the input deck or from the
opponent profile, and carries the rule number (Core Rules 2026-10-09, "CR") or the data it was computed from.
Weights marked HEURISTIC are judgement calls that the real tool must expose as settings.
"""
from lg2_data import *
import itertools, sys

DECKS = load_decks()
RAD = [d for d in DECKS if d.era == 'RAD']
BYLEG = collections.defaultdict(list)
for _d in RAD:
    BYLEG[_d.legend_short].append(_d)
SEATS = (('play', 'on the play'), ('draw', 'on the draw'))


# ------------------------------------------------------------------ opponent profile and answer model
def profile(legend, exclude=None):
    """Expected copies per list of every card over the Radiance-era lists of `legend` (main incl. the Champion Zone copy; side)."""
    ds = [d for d in BYLEG[legend] if d.id != exclude]
    main, side = collections.Counter(), collections.Counter()
    for d in ds:
        for n, q in d.lib.items():
            main[n] += q
        main[d.champ['name']] += 1
        for n, q in d.side.items():
            side[n] += q
    k = max(1, len(ds))
    return {'n': len(ds), 'main': {n: q / k for n, q in main.items()}, 'side': {n: q / k for n, q in side.items()}}


_PROF = {}


def prof(legend, exclude=None):
    key = (legend, exclude)
    if key not in _PROF:
        _PROF[key] = profile(legend, exclude)
    return _PROF[key]


_ANS = {}


def answers(a, b):
    """Does card a (one side) answer card b (other side)? Parsed from a's printed text only."""
    key = (a['code'], b['code'])
    if key in _ANS:
        return _ANS[key]
    ca, t = classify(a), flat(a)
    r = False
    m = re.search(r'enemy (Fury|Calm|Mind|Body|Chaos|Order) ', t)
    dom_ok = (m.group(1).lower() in b.get('domains', [])) if m else True
    if b['type'] == 'unit':
        hard = "can't be chosen" in flat(b)
        if 'sweeper' in ca:
            n = dmg_n(a)
            r = True if re.search(r'[Kk]ill all units|must kill', t) else M(b) <= (n if n is not None else 4)
        elif hard:
            r = False
        elif 'burn' in ca and a['type'] != 'unit' or ('burn' in ca and re.search(r'When you play me', t)):
            n = dmg_n(a)
            r = M(b) <= (n if n is not None else 4)
        if not r and not hard:
            if 'kill' in ca:
                cap = might_cap(a, '[Kk]ill')
                r = M(b) <= cap if cap is not None else True
            elif 'bounce' in ca:
                cap = might_cap(a, 'eturn')
                r = M(b) <= cap if cap is not None else True
            elif {'banish', 'stun', 'displace', 'fight'} & ca:
                r = True
    elif b['type'] == 'spell':
        if 'counter' in ca:
            r = counter_ok(a, b)
        elif 'protect' in ca and a['type'] != 'unit':
            r = bool({'removal', 'stun', 'displace'} & classify(b)) and 'sweeper' not in classify(b)
        elif "can't be chosen" in t or 'deflect' in ca:
            r = bool({'removal', 'stun', 'displace'} & classify(b)) and 'sweeper' not in classify(b)
        elif 'hand_attack' in ca:
            r = E(b) >= 4
    elif b['type'] == 'gear':
        if 'gear_hate' in ca:
            m2 = re.search(r'gear with Energy cost \[(\d+)\] or less', t)
            r = E(b) <= int(m2.group(1)) if m2 else True
    r = bool(r and dom_ok)
    _ANS[key] = r
    return r


def wt(c):
    """Rune weight of a card as a target: its rune need, capped at 6 (cost-reduced cards are printed far above what is paid)."""
    return max(1, min(6, need(c)))


def conditional(c):
    """True when the sentence carrying the answer effect starts from an 'If' condition (HEURISTIC: such answers count half)."""
    for s_ in re.split(r'(?<=[.])\s+', flat(c)):
        if re.search(r'[Kk]ill|[Rr]eturn|[Dd]eal|[Cc]ounter|[Ss]tun|[Bb]anish|[Mm]ove an enemy', s_) and re.search(r'^If |\bif (you|there|an|a|it|I)\b', s_):
            return True
    return False


def covered(mine, exp):
    """(rune-weighted expected opposing copies my card answers, [(name, copies)]): each answered card counts
    copies x its rune need (capped at 6); halved when my card's effect is conditional."""
    f = 0.5 if conditional(mine) else 1.0
    hit = [(n, q) for n, q in exp.items() if n in NAME and answers(mine, NAME[n])]
    hit.sort(key=lambda x: (-x[1] * wt(NAME[x[0]]), x[0]))
    return f * sum(q * wt(NAME[n]) for n, q in hit), hit


def exposed(mine, exp):
    """(expected opposing copies that answer my card, weighted by my card's rune need, [(name, copies)])."""
    hit = [(n, q * (0.5 if conditional(NAME[n]) else 1.0)) for n, q in exp.items() if n in NAME and answers(NAME[n], mine)]
    hit.sort(key=lambda x: (-x[1], x[0]))
    return wt(mine) * sum(q for _, q in hit), hit


def field_mean(fn, mine, exclude_legend, which='main'):
    """Mean of fn(mine, profile) over the other Radiance legends, weighted by their number of lists in the dataset."""
    tot = w = 0.0
    for leg, ds in BYLEG.items():
        if leg == exclude_legend or not ds:
            continue
        p = prof(leg)
        tot += len(ds) * fn(mine, p[which])[0]
        w += len(ds)
    return tot / w if w else 0.0


def names(hit, k=4):
    return ', '.join(f'{n} ({q:.1f})' for n, q in hit[:k]) or 'nothing'


# ------------------------------------------------------------------ the generator
class Gen:
    def __init__(self, deck, opp=None):
        self.d, self.opp = deck, opp
        self.out, self.sig = [], set()
        self.codes = {base_code(c['code']): n for n, c in deck.card.items() if n in deck.lib or n == deck.champ['name']}
        self.codes[base_code(deck.legend['code'])] = deck.legend['name'] + ' (legend)'
        self.split = dict(deck.rune)

    def w(self, s=''):
        self.out.append(s)

    def fact(self, *k):
        self.sig.add(k)

    # ---- helpers
    def pool(self):
        d = self.d
        return sorted(set(d.lib) | {d.champ['name']})

    def k(self, n):
        return self.d.lib.get(n, 0)

    def p_have(self, ns, t, extra=0):
        """P(holding every named card by turn t). The Chosen Champion is in the Champion Zone (CR 103.3.a.1): certain."""
        ks = [self.k(n) for n in ns if n != self.d.champ['name']]
        if any(k == 0 for k in ks):
            return 0.0
        return p_all(self.d.N, ks, 4 + t + extra)

    def demand(self, ns):
        dm = collections.Counter()
        for n in ns:
            c = self.d.card[n]
            if P(c):
                dm[(c.get('domains') or ['?'])[0]] += P(c)
        return dm

    def cost(self, ns):
        return sum(E(self.d.card[n]) for n in ns), sum(P(self.d.card[n]) for n in ns)

    def var_cost(self, n):
        return re.search(r'I cost \[(\d+)\] less for each ([^.]+)\.', flat(self.d.card[n]))

    # ---- sections
    def header(self):
        d = self.d
        self.w(f'# Lines for "{d.name}" ({d.legend_short}{", versus " + self.opp if self.opp else ""})')
        self.w()
        self.w(f'List: {d.url()} (era {d.era}, event "{d.event}", placement class {d.place}). Legend {d.legend["name"]} ({d.legend["code"]}): "{flat(d.legend)}"')
        c = d.champ
        self.w(f'Chosen Champion {c["name"]} ({c["code"]}): {E(c)} Energy + {P(c)} Power, Might {M(c)}. "{flat(c)}"')
        hist = collections.Counter()
        for n, q in d.lib.items():
            hist[min(7, need(d.card[n]))] += q
        types = collections.Counter()
        for n, q in d.lib.items():
            types[d.card[n]['type']] += q
        self.w(f'Runes {" / ".join(f"{q} {dom}" for dom, q in d.rune.most_common())}. Library {d.N}: {types["unit"]} units, {types["spell"]} spells, {types["gear"]} gear. '
               f'Curve by rune need {", ".join(f"{k if k < 7 else chr(55) + chr(43)}:{hist[k]}" for k in sorted(hist))}. Battlefields: {", ".join(b["name"] for b in d.bfs)}.')
        self.w()
        self.types = types

    def keep(self):
        d = self.d
        self.w('## Opening hand')
        early_n = sum(q for n, q in d.lib.items() if d.card[n]['type'] == 'unit' and need(d.card[n]) <= 2)
        ramp = [n for n in d.lib if 'ramp' in d.cls[n] and need(d.card[n]) <= 4]
        for seat, lab in SEATS:
            cover = need(d.champ) <= runes_at(1, seat)
            r1 = runes_at(2 if cover else 1, seat)
            units = sorted(n for n in d.lib if d.card[n]['type'] == 'unit' and need(d.card[n]) <= r1 and not self.var_cost(n))
            inter = sorted(n for n in d.lib if d.card[n]['type'] != 'unit' and need(d.card[n]) <= r1 and ({'removal', 'stun', 'displace', 'gear_hate'} & d.cls[n]))
            gear = sorted(n for n in d.lib if d.card[n]['type'] == 'gear' and need(d.card[n]) <= r1)
            ku = sum(self.k(n) for n in units)
            if ku >= 8:
                rule, ns = 'BOARD', units
            elif sum(self.k(n) for n in ramp) >= 5:
                rule, ns = 'RAMP-OR-BOARD', sorted(set(units) | set(ramp))
            elif ku + sum(self.k(n) for n in inter) >= 8:
                rule, ns = 'BOARD-OR-INTERACTION', sorted(set(units) | set(inter))
            else:
                rule, ns = 'ANY-EARLY-PLAY', sorted(set(units) | set(inter) | set(gear) | set(ramp))
            K = sum(self.k(n) for n in ns)
            p4, p6 = p_at_least(d.N, K, 4), p_at_least(d.N, K, 6)
            why = (f'{d.champ["name"]} is castable from the Champion Zone on turn 1, so the hand has to supply turn 2 ({r1} runes)' if cover
                   else f'{r1} runes on turn 1 and the champion needs {need(d.champ)}, so the hand has to supply turn 1')
            self.w(f'- {lab} ({why}), rule {rule}: keep any hand with {", ".join(ns) or "(no card qualifies)"} (K={K} of {d.N}). '
                   f'P(in 4 cards) {pct(p4)}; P(after setting aside 2 and drawing 2, CR 117) {pct(p6)}.')
            self.fact('keep', seat, rule, tuple(ns), pct(p4))
        ship = sorted((n for n in d.lib if need(d.card[n]) >= 6 and not self.var_cost(n)), key=lambda n: -need(d.card[n]))
        if ship:
            self.w(f'- Set aside first: {", ".join(f"{n} x{self.k(n)} (needs {need(d.card[n])} runes)" for n in ship[:6])}.')
            self.fact('ship', tuple(ship[:6]))
        if self.k(d.champ['name']):
            self.w(f'- {d.champ["name"]}: {self.k(d.champ["name"])} more in the library. While the Champion Zone copy is unplayed (CR 103.3.a.1) a second copy in the opening hand is a set-aside card.')
        # the two non-champion cards with the highest interaction weight inside this deck
        deg = collections.Counter()
        for code, n in self.codes.items():
            for e in EDGE_IDX.get(code, []):
                other = e['b'] if e['a'] == code else e['a']
                if other in self.codes and other != code and e.get('cls') == 'specific':
                    deg[n] += e['s'] * min(3, self.d.copies(self.codes[other].replace(' (legend)', '')) or 1)
        key = [n for n, _ in deg.most_common() if n in d.lib and need(d.card[n]) <= 4 and n != d.champ['name']][:3]
        if key:
            self.w(f'- Never set aside (highest interaction weight inside this list, from the edge graph): {", ".join(f"{n} ({deg[n]:.1f})" for n in key)}.')
            self.fact('core', tuple(key))
        self.deg = deg

    def value(self, ns, t):
        """HEURISTIC tempo value of playing the set `ns` in one turn: runes used, weighted by card type, plus the
        strength of typed edges among the cards (and with the legend), plus 1 for the Champion Zone card (it costs no hand card)."""
        d = self.d
        v, why = 0.0, []
        for n in ns:
            c = d.card[n]
            cl = d.cls[n]
            f = 1.0 if c['type'] == 'unit' else 0.9 if c['type'] == 'gear' else 0.9 if ({'draw', 'ramp', 'token'} & cl and not ({'removal', 'counter'} & cl)) else 0.6
            v += f * max(1, need(c)) + (1.0 if n == d.champ['name'] else 0.0)
        cs = {base_code(d.card[n]['code']): n for n in ns}
        lg = base_code(d.legend['code'])
        seen = set()
        bonus = 0.0
        for code in cs:
            for e in EDGE_IDX.get(code, []):
                o = e['b'] if e['a'] == code else e['a']
                if (o in cs or o == lg) and o != code and e.get('cls') == 'specific':
                    kk = (min(e['a'], e['b']), max(e['a'], e['b']), e['rule'])
                    if kk in seen:
                        continue
                    seen.add(kk)
                    bonus += 0.5 * e['s']
                    why.append(e['rule'])
        return v + min(3.0, bonus), sorted(set(why))

    def turn_lines(self):
        d = self.d
        self.w('## Turn 1 to 6, best lines per seat')
        self.w()
        self.w('Runes: 2 per turn (CR 315.3.b), +1 for the second player on turn 1 (CR 488.7), minus Power already recycled (CR 164.2.b, 161). '
               'Cards seen by turn t: 4 + t for both seats (CR 116, 315.4.b). "P" is P(all named cards in hand) x P(the channelled runes can pay the Power).')
        self.w()
        pool = self.pool()
        self.primary = {}
        for seat, lab in SEATS:
            self.w(f'**{lab}**')
            self.w()
            self.w('| Turn | Runes | Line (value, P) | Alternative | Alternative |')
            self.w('|---|---|---|---|---|')
            used, tax, champ_out, bonus = collections.Counter(), 0, False, 0
            prim = []
            for t in range(1, 7):
                R = max(0, runes_at(t, seat) - tax + bonus)
                cands = []
                avail = [n for n in pool if need(d.card[n]) <= R and not (n == d.champ['name'] and champ_out and self.k(n) == 0)
                         and used[n] < d.copies(n) and not self.var_cost(n)]
                for size in (1, 2, 3):
                    for ns in itertools.combinations(avail, size):
                        e, p = self.cost(ns)
                        if max(e, p) > R:
                            continue
                        if not any(d.card[n]['type'] in ('unit', 'gear') or ({'draw', 'ramp', 'token'} & d.cls[n]) for n in ns):
                            continue  # a line needs at least one proactive card; pure reactive turns are listed under "hold"
                        pc = self.p_have([n for n in ns if not (n == d.champ['name'] and not champ_out)], t)
                        pp = p_power(self.split, R, self.demand(ns))
                        v, why = self.value(ns, t)
                        v -= 0.5 * (R - max(e, p))
                        cands.append((v * pc * pp, v, pc * pp, ns, e, p, why))
                cands.sort(key=lambda x: (-x[0], x[3]))
                cells = []
                for sc, v, pr, ns, e, p, why in cands[:3]:
                    tag = (' [' + ', '.join(why) + ']') if why else ''
                    cells.append(f'{" + ".join(ns)} ({e}E{"+" + str(p) + "P" if p else ""}; {v:.1f}, {pct(pr)}){tag}')
                while len(cells) < 3:
                    cells.append('-')
                self.w(f'| {t} | {R} | {cells[0]} | {cells[1]} | {cells[2]} |')
                if cands:
                    sc, v, pr, ns, e, p, why = cands[0]
                    prim.append((t, R, ns, pr))
                    tax += p
                    for n in ns:
                        used[n] += 1
                        if n == d.champ['name']:
                            champ_out = True
                        m = re.search(r'[Cc]hannel (\d) runes?', flat(d.card[n]))
                        if m and 'When you play' in flat(d.card[n]) or (m and d.card[n]['type'] == 'spell'):
                            bonus += int(m.group(1))
                    self.fact('line', seat, t, ns)
            self.primary[seat] = prim
            self.w()
            if tax or bonus:
                self.w(f'Rune ledger of the first-choice line {lab}: {tax} Power recycled by turn 6 (each one is a rune returned to the Rune Deck), {bonus} extra runes channelled by named cards.')
                self.w()

    def spikes(self):
        d = self.d
        self.w('## Power spikes')
        c = d.champ
        ts = {s: next((t for t in range(1, 8) if runes_at(t, s) >= need(c)), 7) for s, _ in SEATS}
        pp = {s: p_power(self.split, runes_at(ts[s], s), self.demand([c['name']])) for s, _ in SEATS}
        self.w(f'- {c["name"]} from the Champion Zone: turn {ts["play"]} on the play (Power available {pct(pp["play"])}), turn {ts["draw"]} on the draw ({pct(pp["draw"])}).')
        self.fact('spike', ts['play'], ts['draw'])
        self.champ_turn = ts
        top = sorted((n for n in d.lib if not self.var_cost(n) and need(d.card[n]) >= 5), key=lambda n: (-need(d.card[n]), n))[:3]
        for n in top:
            cc = d.card[n]
            tt = {s: next((t for t in range(1, 8) if runes_at(t, s) >= need(cc)), 7) for s, _ in SEATS}
            self.w(f'- {n} x{self.k(n)} ({E(cc)}E+{P(cc)}P): turn {tt["play"]} / {tt["draw"]}; drawn by then {pct(self.p_have([n], tt["play"]))} / {pct(self.p_have([n], tt["draw"]))}.')
        for n in sorted(d.lib):
            m = self.var_cost(n)
            if m:
                cc = d.card[n]
                step = int(m.group(1))
                rows = []
                for t in (2, 3, 4):
                    rows.append(f'turn {t}: {max(0, -(-(E(cc) - runes_at(t, "play")) // step))} / {max(0, -(-(E(cc) - runes_at(t, "draw")) // step))}')
                fill = sorted(x for x in d.lib if re.search(r'\[Burn|into your trash|discard', flat(d.card[x])))
                if re.search(r'\[Burn|into your trash|discard', flat(d.champ)):
                    fill.append(d.champ['name'] + ' (champion)')
                self.w(f'- {n} x{self.k(n)} costs [{step}] less for each {m.group(2)}: number of those needed on the play / on the draw: {"; ".join(rows)}. Fillers in this list: {", ".join(fill) or "none found"}.')
                self.fact('varcost', n)
        lv = [(n, d.kw[n]['Level']) for n in self.pool() if 'Level' in d.kw[n]]
        lvt = sorted({int(x) for n in self.pool() for x in re.findall(r'\[Level (\d+)\]', text(d.card[n]))})
        if lvt:
            hunt = sorted(((n, int(x)) for n in self.pool() for x in re.findall(r'\[Hunt (\d+)\]', text(d.card[n]))), key=lambda x: -x[1])
            src = sorted(n for n in self.pool() if re.search(r'[Gg]ain \d+ XP', flat(d.card[n])))
            if hunt:
                self.w(f'- Level thresholds {lvt}: best Hunt is {hunt[0][0]} (Hunt {hunt[0][1]}, XP on conquer or hold, CR 823): {", ".join(f"Level {L} after {-(-L // hunt[0][1])} triggers" for L in lvt)}. Other XP sources: {", ".join(src) or "none"}.')
            else:
                self.w(f'- Level thresholds {lvt}; XP sources: {", ".join(src) or "none in the list"}.')
            self.fact('level', tuple(lvt))

    def sequencing(self):
        d = self.d
        self.w('## Sequencing (card A before card B, with the rule)')
        rows = []
        # 1. typed edges inside the deck
        per_rule = collections.Counter()
        cand = []
        seen = set()
        for code, n in self.codes.items():
            for e in EDGE_IDX.get(code, []):
                if e['a'] in self.codes and e['b'] in self.codes and e['a'] != e['b'] and e.get('cls') == 'specific':
                    kk = (e['a'], e['b'], e['rule'])
                    if kk not in seen:
                        seen.add(kk)
                        cand.append(e)
        cand.sort(key=lambda e: (-e['s'], e['a'], e['b']))
        for e in cand:
            if per_rule[e['rule']] >= 2 or len(rows) >= 9:
                continue
            a, b = self.codes[e['a']], self.codes[e['b']]
            sent = ((FACETS.get(e['b']) or {}).get('facets', {}).get(e['fb']) or {}).get('sent', '')
            cb = BY.get(e['b'], {})
            watcher = cb.get('type') in ('unit', 'gear', 'legend') and re.search(r'\b(When|Whenever|While|Each time|The first time)\b', sent) \
                and not re.search(r'When you play me|As you play me|additional cost|I cost', sent)
            if watcher:
                first, second, rule = b, a, 'CR 384.2: a permanent\'s trigger is only checked while it is on the board'
            elif e['rule'].startswith('ready'):
                first, second, rule = b, a, 'CR 143.4: units enter exhausted, so the target has to be on the board (and used) before the readier'
            elif e['rule'] == 'cheap->multiplay':
                first, second, rule = a, b, 'CR 812: Legion checks that another card was played this turn'
            else:
                first, second, rule = a, b, 'card text: the second card reads the state the first one creates'
            per_rule[e['rule']] += 1
            rows.append(f'- [{e["rule"]}] {first} before {second}. "{sent}" ({rule}).')
            self.fact('edge', e['rule'], first, second)
        # 2. timing detectors bound to rules
        pool = self.pool()
        sp = lambda pred: sorted(n for n in pool if pred(n))
        notiming = sp(lambda n: d.card[n]['type'] == 'spell' and not ({'t_action', 't_reaction'} & d.cls[n]) and ({'removal', 'displace', 'pump', 'stun', 'shrink', 'hand_attack', 'gear_hate'} & d.cls[n]))
        if notiming:
            rows.append(f'- [main-phase only] {", ".join(notiming)} have neither Action nor Reaction: cast them before the move that opens the showdown, they cannot be played once it is open (CR 310, 308.1.a).')
            self.fact('det', 'main-phase', tuple(notiming))
        act = sp(lambda n: 't_action' in d.cls[n] and d.card[n]['type'] != 'unit')
        if act:
            rows.append(f'- [action window] {", ".join(act)} are Action (CR 806): attacking, you hold Focus first (CR 345) and get one play before the defender; if both players pass in sequence the showdown ends (CR 347.2.a), so a held Action card is lost for this combat once you pass.')
            self.fact('det', 'action', tuple(act))
        rea = sp(lambda n: 't_reaction' in d.cls[n])
        if rea:
            cheap = min(rea, key=lambda n: (need(d.card[n]), n))
            rows.append(f'- [reaction hold] {", ".join(rea)} are Reaction (CR 813): playable on a chain without Focus (CR 309.1.a). Cheapest hold is {cheap} ({E(d.card[cheap])}E+{P(d.card[cheap])}P); the runes must still be ready because the pool empties at the start of each Main Phase and at end of turn (CR 167).')
            self.fact('det', 'reaction', tuple(rea))
        hid = sp(lambda n: 't_hidden' in d.cls[n])
        if hid:
            rows.append(f'- [hidden] {", ".join(hid)}: hide the turn before you need it, for one Power of any domain, at a battlefield you control (CR 811); from the next turn it has Reaction and costs 0, and it can only choose targets at that battlefield.')
            self.fact('det', 'hidden', tuple(hid))
        amb = sp(lambda n: 't_ambush' in d.cls[n])
        if amb:
            rows.append(f'- [ambush] {", ".join(amb)}: keep {min(need(d.card[n]) for n in amb)} runes ready and play it as a Reaction to a battlefield where you already have a unit (CR 822).')
            self.fact('det', 'ambush', tuple(amb))
        acc = sp(lambda n: 'haste' in d.cls[n])
        if acc:
            rows.append(f'- [accelerate] {", ".join(f"{n} ({E(d.card[n]) + 1}E+{P(d.card[n]) + 1}P to enter ready)" for n in acc)} (CR 805): the only units in the list that can move on the turn they are played, besides ready effects.')
            self.fact('det', 'accelerate', tuple(acc))
        eq = sp(lambda n: 'Equip' in d.kw[n])
        if eq:
            car = sorted((n for n in pool if d.card[n]['type'] == 'unit' and need(d.card[n]) <= 3), key=lambda n: (need(d.card[n]), n))[:4]
            rows.append(f'- [equip] {", ".join(eq)}: a carrier first ({", ".join(car)}); unattached Equipment at a battlefield is recalled to base at the next cleanup (CR 459.1).')
            self.fact('det', 'equip', tuple(eq))
        dep = sp(lambda n: 'Deploy' in d.kw[n])
        if dep:
            rows.append(f'- [deploy] {", ".join(dep)} have Deploy (CR 830): played to any battlefield and not recalled, but killed when an opponent holds there; place them where you expect to keep control through the opponent\'s Beginning Phase.')
            self.fact('det', 'deploy', tuple(dep))
        leg = sp(lambda n: 'legion' in d.cls[n])
        if leg:
            en = sorted((n for n in pool if n not in leg), key=lambda n: (need(d.card[n]), n))[:3]
            rows.append(f'- [legion] {", ".join(leg)}: play {", ".join(en)} first in the same turn (CR 812).')
            self.fact('det', 'legion', tuple(leg))
        tax = sp(lambda n: P(d.card[n]) >= 2)
        if tax:
            rows.append(f'- [power tax] {", ".join(f"{n} ({P(d.card[n])}P)" for n in tax)}: each Power is a rune recycled to the Rune Deck (CR 164.2.b), so every one of these sets the next turn back by that many runes.')
            self.fact('det', 'power-tax', tuple(tax))
        dk = sp(lambda n: 'deathknell' in d.cls[n])
        if dk:
            rows.append(f'- [deathknell] {", ".join(dk)} trigger on death (CR 808): preferred lone defenders and trade pieces; damage is assigned by the opponent (CR 467.2.c), so pair them with a [Tank] if you want to choose which unit dies first.')
            self.fact('det', 'deathknell', tuple(dk))
        tk = sp(lambda n: 'tank' in d.cls[n])
        if tk:
            rows.append(f'- [tank] {", ".join(tk)}: lethal damage must be assigned to Tank units first (CR 467.2.c.6); move one together with the unit you need to survive.')
            self.fact('det', 'tank', tuple(tk))
        lt = flat(d.legend)
        if re.search(r'alone', lt) or any(re.search(r'alone|only unit', flat(d.card[n])) for n in pool):
            al = sp(lambda n: re.search(r'alone|only unit', flat(d.card[n])))
            rows.append(f'- [alone] {", ".join(al + ([d.legend["name"] + " (legend)"] if "alone" in lt else []))} check for a single unit: one unit per battlefield, the second unit goes to the other battlefield (2 battlefields in 1v1, CR 487.4).')
            self.fact('det', 'alone', tuple(al))
        if re.search(r'conquer', lt):
            rows.append(f'- [legend: conquer] {d.legend["name"]} triggers on conquer: conquering an empty battlefield also counts (CR 316.8.b.1, 348), so the cheapest trigger is a move to the battlefield nobody holds.')
            self.fact('det', 'legend-conquer')
        if re.search(r'hold', lt):
            rows.append(f'- [legend: hold] {d.legend["name"]} triggers on hold: holds are scored in your Beginning Phase before you channel or draw (CR 315.2.b), so the unit has to survive the opponent\'s whole turn at the battlefield.')
            self.fact('det', 'legend-hold')
        if re.search(r'\[Exhaust\]|\[Tap\]', lt):
            rows.append(f'- [legend: exhaust] {d.legend["name"]} has an exhaust ability: it readies in your Awaken Phase (CR 315.1.b), so one use per own turn unless a card readies it; using it in the opponent\'s turn spends your next use only if it is a Reaction-speed ability.')
            self.fact('det', 'legend-exhaust')
        for r in rows:
            self.w(r)
        if not rows:
            self.w('- none fired')

    def reactions(self):
        d = self.d
        rea = sorted(n for n in self.pool() if {'t_reaction', 't_hidden', 't_ambush'} & d.cls[n])
        self.w('## What to hold runes for')
        if not rea:
            self.w('- This list has no Reaction, Hidden or Ambush card: spend every rune in your own Main Phase; the opponent can read an untapped rune as nothing.')
            self.fact('hold', 'none')
            return
        for n in rea:
            c = d.card[n]
            line = f'- {n} x{d.copies(n)} ({E(c)}E+{P(c)}P): "{flat(c)[:150]}"'
            if self.opp:
                p = prof(self.opp, d.id)
                s, hit = covered(c, p['main'])
                if hit:
                    line += f' Against {self.opp} it answers {s:.1f} expected copies: {names(hit)}.'
                else:
                    line += f' Against {self.opp} it has no computed target.'
            first = {s: next((t for t in range(1, 8) if runes_at(t, s) >= need(d.champ) + need(c)), 7) for s, _ in SEATS}
            line += f' First turn you can deploy {d.champ["name"]} and still pay for it: {first["play"]} on the play, {first["draw"]} on the draw.'
            self.w(line)
            self.fact('hold', n)

    def battlefields(self):
        d = self.d
        self.w('## Battlefields (one chosen per game in a match, CR 488.5; a battlefield used in a won game is gone)')
        preds = [(r'spell', 'spells', lambda c: c['type'] == 'spell'), (r'gear|Equipment', 'gear', lambda c: c['type'] == 'gear'),
                 (r'\[Mighty\]|Mighty', 'units with Might 5+', lambda c: c['type'] == 'unit' and M(c) >= 5),
                 (r'[Hh]idden|facedown', 'Hidden cards', lambda c: 'Hidden' in own_kw(c)),
                 (r'alone', 'units (alone clause)', lambda c: c['type'] == 'unit'),
                 (r'token', 'token makers', lambda c: 'token' in classify(c)),
                 (r'trash|discard', 'cards that use the trash (Flow, "from your trash", "in your trash")', lambda c: bool(re.search(r'trash|\[Flow', flat(c)))),
                 (r'[Bb]uff', 'buff cards', lambda c: 'buff' in classify(c)),
                 (r'XP', 'Level or XP cards', lambda c: bool(re.search(r'XP|\[Level|\[Hunt', text(c)))),
                 (r'[Rr]ecycle (a|one of your) rune|runes?\b', 'cards costing 2+ Power', lambda c: P(c) >= 2),
                 (r"can't be played here|Units can't", 'units', lambda c: c['type'] == 'unit')]
        opp = prof(self.opp, d.id)['main'] if self.opp else None
        for b in d.bfs:
            t = re.sub(r'\s+', ' ', re.sub(r'\([^)]*\)', '', (b.get('text') or ''))).strip()
            t = re.sub(r'^.*?Card Errata:?\s*', '', t) if 'rrata' in t[:60] else t
            hit = [(lab, f) for rx, lab, f in preds if re.search(rx, t)]
            line = f'- {b["name"]}: "{t[:170]}"'
            if hit:
                lab, f = hit[0]
                mine = sum(q for n, q in d.lib.items() if f(d.card[n])) + (1 if f(d.champ) else 0)
                line += f' Reads {lab}: you run {mine}'
                if opp is not None:
                    theirs = sum(q for n, q in opp.items() if n in NAME and f(NAME[n]))
                    line += f', {self.opp} lists average {theirs:.1f} ({"you have more of what it reads" if mine > theirs + 1 else "they have more of what it reads" if theirs > mine + 1 else "even"})'
                    self.fact('bf', b['name'], mine > theirs + 1, theirs > mine + 1)
                line += '.'
            else:
                line += ' No computed fit (text matches none of the generator\'s predicates).'
            self.w(line)

    def versus(self):
        d, o = self.d, self.opp
        p = prof(o, d.id)
        if not p['n']:
            self.w(f'## Versus {o}: no Radiance-era list in the dataset')
            return
        self.w(f'## Versus {o} (profile: {p["n"]} Radiance-era lists; numbers are expected copies per opposing list)')
        self.w()
        self.w('**Your answers and their targets**')
        rows = []
        for n in self.pool():
            s, hit = covered(d.card[n], p['main'])
            if s > 0 and ({'removal', 'sweeper', 'counter', 'gear_hate', 'stun', 'displace', 'protect', 'hand_attack', 'deflect'} & d.cls[n] or "can't be chosen" in flat(d.card[n])):
                fm = field_mean(covered, d.card[n], o)
                rows.append((s - fm, n, s, fm, hit))
        rows.sort(key=lambda x: (-x[2], x[1]))
        for delta, n, s, fm, hit in rows[:9]:
            self.w(f'- {n} x{d.copies(n)}: answers {s:.1f} (field mean {fm:.1f}): {names(hit)}.')
            self.fact('ans', n, tuple(h[0] for h in hit[:3]))
        if not rows:
            self.w('- no main-deck card has a computed target in their lists.')
        self.w()
        self.w('**Play around** (their cards that answer yours; turn = first turn they can pay for it from the other seat)')
        pa = []
        for n, q in p['main'].items():
            c = NAME.get(n)
            if not c or q < 0.4:
                continue
            cl = classify(c)
            mine = [(m, d.copies(m)) for m in self.pool() if answers(c, d.card[m])]
            cnt = sum(k for _, k in mine)
            if cnt and ({'sweeper', 'counter', 'gear_hate', 'removal', 'stun', 'displace', 'hand_attack'} & cl):
                kind = next(k for k in ('sweeper', 'counter', 'gear_hate', 'hand_attack', 'removal', 'stun', 'displace') if k in cl)
                timing = 'Reaction' if 't_reaction' in cl else 'Hidden' if 't_hidden' in cl else 'Action' if 't_action' in cl else 'main phase'
                w = q * cnt * (2.0 if kind == 'sweeper' else 1.5 if timing in ('Reaction', 'Hidden') else 1.0)
                pa.append((w, n, q, kind, timing, need(c), cnt, mine))
        pa.sort(key=lambda x: (-x[0], x[1]))
        for w, n, q, kind, timing, nd, cnt, mine in pa[:7]:
            mine.sort(key=lambda x: (-x[1], x[0]))
            tt = {s: next((t for t in range(1, 8) if runes_at(t, s) >= nd), 7) for s in ('play', 'draw')}
            self.w(f'- {n} ({q:.1f} copies, {kind}, {timing}, {nd} runes: their turn {tt["draw"]} when you are on the play, {tt["play"]} when you are on the draw) hits {cnt} of your cards: {", ".join(f"{m} x{k}" for m, k in mine[:5])}.')
            self.fact('around', n, tuple(m for m, _ in mine[:3]))
        if not pa:
            self.w('- nothing in their main decks answers a card of yours at 0.4+ copies.')
        self.side_plan(p)
        self.estimate(o)

    def net(self, c, p, o):
        """HEURISTIC: (copies answered here - field mean) - (copies that answer it here - field mean). Units: expected opposing copies."""
        s, hit = covered(c, p['main'])
        post = {n: p['main'].get(n, 0) + 0.5 * p['side'].get(n, 0) for n in set(p['main']) | set(p['side'])}
        v, vh = exposed(c, post)
        fs = field_mean(covered, c, o)
        fv = field_mean(exposed, c, o)
        return (s - fs) - (v - fv), s, fs, hit, v, fv, vh

    def side_plan(self, p):
        d, o = self.d, self.opp
        self.w()
        self.w('**Games 2 and 3** (exchanges are 1 for 1, TR 403.4; net = answers above field mean minus exposure above field mean, their sideboard counted at half weight; HEURISTIC thresholds: bring in at net >= +1.0, swap only when the gap is >= 1.5)')
        ins = []
        for n, q in d.side.items():
            r = self.net(d.card[n], p, o)
            ins.append((r[0], n, q, r))
        ins.sort(key=lambda x: (-x[0], x[1]))
        outs = []
        for n, q in d.lib.items():
            r = self.net(d.card[n], p, o)
            outs.append((r[0], n, q, r))
        outs.sort(key=lambda x: (x[0], x[1]))
        slots_in = [(net, n, r) for net, n, q, r in ins for _ in range(q) if net >= 1.0]
        slots_out = [(net, n, r) for net, n, q, r in outs for _ in range(q)]
        swaps = collections.OrderedDict()
        for (ni, a, ra), (no, b, rb) in zip(slots_in, slots_out):
            if ni - no >= 1.5:
                swaps.setdefault((a, b), [0, ra, rb, ni, no])[0] += 1
        if swaps:
            agg_in, agg_out = collections.OrderedDict(), collections.OrderedDict()
            for (a, b), (k, ra, rb, ni, no) in swaps.items():
                agg_in.setdefault(a, [0, ra, ni])[0] += k
                agg_out.setdefault(b, [0, rb, no])[0] += k
            for a, (k, r, ni) in agg_in.items():
                why = f'answers {r[1]:.1f} here vs {r[2]:.1f} field: {names(r[3], 3)}' if r[1] > r[2] else f'exposed to only {r[4]:.1f} of their answers vs {r[5]:.1f} field'
                self.w(f'- IN +{k} {a} (net {ni:+.1f}): {why}.')
                self.fact('in', a, k)
            for b, (k, r, no) in agg_out.items():
                why = []
                if r[2] - r[1] > 0.3:
                    why.append(f'answers {r[1]:.1f} here vs {r[2]:.1f} field')
                if r[4] - r[5] > 0.3:
                    why.append(f'{r[4]:.1f} of their cards answer it vs {r[5]:.1f} field: {names(r[6], 3)}')
                self.w(f'- OUT -{k} {b} (net {no:+.1f}): {"; ".join(why) or "lowest net in the main deck"}.')
                self.fact('out', b, k)
        else:
            best = ins[0] if ins else None
            self.w(f'- No swap clears the thresholds. Best sideboard card here: {best[1]} (net {best[0]:+.1f}).' if best else '- The list has no sideboard.')
            self.fact('noswap')
        stay = [(net, n) for net, n, q, r in ins if net < 1.0]
        if stay:
            self.w(f'- Stay in the sideboard: {", ".join(f"{n} ({net:+.1f})" for net, n in stay)}.')
        # their likely sideboard cards against you
        th = []
        for n, q in p['side'].items():
            c = NAME.get(n)
            if c and q >= 0.4:
                mine = [(m, d.copies(m)) for m in self.pool() if answers(c, d.card[m])]
                if mine:
                    th.append((q * sum(k for _, k in mine), n, q, mine))
        th.sort(key=lambda x: (-x[0], x[1]))
        if th:
            self.w('- Expect from their sideboard: ' + '; '.join(f'{n} ({q:.1f}) at {", ".join(m for m, _ in sorted(mine, key=lambda x: (-x[1], x[0]))[:3])}' for w, n, q, mine in th[:4]) + '.')
            self.fact('theirside', tuple(n for _, n, _, _ in th[:3]))
        alt = sorted({n for n in list(d.lib) + list(d.side) if 'champion' in d.card[n].get('superTypes', []) and n != d.champ['name']
                      and d.legend_short in (d.card[n].get('tags') or [])})
        if alt:
            self.w(f'- Chosen Champion may be swapped while sideboarding (TR 601.1.c.4): {", ".join(f"{n} ({E(d.card[n])}E+{P(d.card[n])}P, turn {next((t for t in range(1, 8) if runes_at(t, chr(112) + chr(108) + chr(97) + chr(121)) >= need(d.card[n])), 7)} on the play)" for n in alt)} instead of {d.champ["name"]} (turn {self.champ_turn["play"]}).')
            self.fact('altchamp', tuple(alt))

    def estimate(self, o):
        import matchup2
        est, terms, n = matchup2.estimate_vs_legend(self.d, o)
        self.w()
        self.w(f'**Matchup estimate (HEURISTIC, uncalibrated; mean over {n} {o} lists): {est:.1f}%**. Terms in points: ' + ', '.join(f'{k} {v:+.1f}' for k, v in terms) + '.')
        self.fact('est', round(est))

    def run(self):
        self.header()
        self.keep()
        self.w()
        self.turn_lines()
        self.spikes()
        self.w()
        self.sequencing()
        self.w()
        self.reactions()
        self.w()
        self.battlefields()
        self.w()
        if self.opp:
            self.versus()
        return '\n'.join(self.out)


def find(prefix):
    m = [d for d in DECKS if d.id.startswith(prefix)]
    if not m:
        raise SystemExit('no deck ' + prefix)
    return m[0]


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


EXAMPLES = ['485a5ee2:Riven', '8e8dd2b6:Riven', '339dad89:Kai\'Sa', '485a5ee2:Kai\'Sa']

if __name__ == '__main__':
    args = EXAMPLES if '--examples' in sys.argv else [a for a in sys.argv[1:] if ':' in a]
    gens = []
    for a in args:
        pre, opp = a.split(':', 1)
        g = Gen(find(pre), opp or None)
        txt = g.run()
        fn = os.path.join(HERE, 'out', f'v2-{slug(g.d.legend_short)}-vs-{slug(opp)}.md')
        open(fn, 'w').write(txt + '\n')
        gens.append((a, g))
        print('wrote', fn, len(g.out), 'lines', len(g.sig), 'facts')
    if '--examples' in sys.argv:
        rows = []
        for (a, g), (b, h) in itertools.combinations(gens, 2):
            la, lb = set(x for x in g.out if x.strip()), set(x for x in h.out if x.strip())
            fa, fb = g.sig, h.sig
            ca, cb = set(g.pool()), set(h.pool())
            kinds = lambda s: {x[:2] if x[0] in ('det', 'keep') else x[:1] for x in s}
            rows.append(f'{a} | {b} | identical lines {len(la & lb)} of {len(la | lb)} | shared facts {len(fa & fb)} of {len(fa | fb)} | shared card names {len(ca & cb)} of {len(ca | cb)}'
                        f' | detectors only in first: {sorted(x[1] for x in fa - fb if x[0] == "det" and not any(y[0] == "det" and y[1] == x[1] for y in fb))}'
                        f' | only in second: {sorted(x[1] for x in fb - fa if x[0] == "det" and not any(y[0] == "det" and y[1] == x[1] for y in fa))}')
        open(os.path.join(HERE, 'out', 'v2-variety.txt'), 'w').write('\n'.join(rows) + '\n')
        print('\n'.join(rows))
