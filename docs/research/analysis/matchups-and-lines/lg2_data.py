"""Loaders, card classifier and probability helpers for the v2 line generator (linegen2.py).

Inputs (all produced by sibling research scripts in docs/research/analysis/, fetched 2026-11-11):
  ../cards-2026-11-11.json          1,237 cards incl. Radiance (official card gallery)
  ../raw/pa-decks.jsonl             361 Piltover Archive deck pages (main 39 + chosen champion, runes, battlefields, side)
  ../out/results.json               era / event / placement labels per deck id
  ../interactions/out/facets.json   typed produce/consume facets per card (the interaction graph's nodes)
  ../interactions/out/edges.json    typed card-to-card edges with a reason sentence
Nothing here is random. Every class is a regular expression over the printed card text, so it works for cards
the facet file does not cover; the facets and edges are used on top of it where they exist.
"""
import json, re, math, os, collections

HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, '..')

CARDS = json.load(open(os.path.join(A, 'cards-2026-11-11.json')))['cards']
BY = {}
NAME = {}
for _c in CARDS:
    BY.setdefault(_c['code'], _c)
    NAME.setdefault(_c['name'], _c)
FACETS = json.load(open(os.path.join(A, 'interactions', 'out', 'facets.json')))
_E = json.load(open(os.path.join(A, 'interactions', 'out', 'edges.json')))
EDGES = _E['edges']
EDGE_IDX = collections.defaultdict(list)
for _e in EDGES:
    EDGE_IDX[_e['a']].append(_e)
    EDGE_IDX[_e['b']].append(_e)
LABELS = {d['id']: d for d in json.load(open(os.path.join(A, 'out', 'results.json')))['decks']}


def base_code(code):
    m = re.match(r'^([A-Z]+-\d+)', code or '')
    return m.group(1) if m else code


def resolve(entry):
    """Piltover Archive list entry -> card record. Code first, then exact name."""
    c = BY.get(entry.get('code')) or BY.get(base_code(entry.get('code')))
    return c or NAME.get(entry.get('name'))


# ------------------------------------------------------------------ card text helpers
KW = ('Action|Reaction|Hidden|Ambush|Accelerate|Ganking|Legion|Deflect|Tank|Shield|Assault|Deathknell|Hunt|Level|'
      'Quick-Draw|Equip|Deploy|Disarm|Show Off|Temporary|Vision|Backline|Weaponmaster|Repeat|Unique|Flow')
_KW_RX = re.compile(r'\[(%s)(?: (\d+))?\]' % KW)


def text(c):
    return (c.get('text') or '')


def flat(c):
    """Card text on one line with reminder text (parentheses) removed."""
    return re.sub(r'\s+', ' ', re.sub(r'\([^)]*\)', '', text(c).replace('\n', ' / '))).strip()


def own_kw(c):
    """Keywords the card itself has: bracket keywords that open a line of its text (granted keywords sit mid-sentence)."""
    out = {}
    for line in text(c).split('\n'):
        s = line.strip()
        while True:
            m = _KW_RX.match(s)
            if not m:
                break
            out[m.group(1)] = int(m.group(2) or 1)
            s = re.sub(r'^\s*(\([^)]*\))?[\s,.]*', '', s[m.end():])
    return out


def E(c):
    return c.get('energy') or 0


def P(c):
    return c.get('power') or 0


def M(c):
    return c.get('might') or 0


def need(c):
    """Runes that must be on the board to play c. Energy comes from exhausting runes (CR 164.2.a), Power from
    recycling them (CR 164.2.b, a cost with no exhaust), so one rune can pay 1 Energy and then 1 Power."""
    return max(E(c), P(c))


CLASS_RULES = [
    ('counter',     r'\b[Cc]ounter (a|an enemy|that) spell'),
    ('sweeper',     r'(to (all|each|ALL)( other)?( enemy)? units|split among|[Kk]ill all units|to each of up to|each other enemy unit|all damaged enemy units|each opponent must kill)'),
    ('kill',        r'\b[Kk]ill (a|an|target|up to \w+|another|that)( \w+)* ?(enemy )?unit|\b[Kk]ill it\b'),
    ('burn',        r'\b[Dd]eals? (\d+|damage equal|that much)[^.]*?(to|among)( \w+)*? ?(unit|them|it\b)'),
    ('fight',       r'deal damage equal to their Mights to each other'),
    ('bounce',      r"[Rr]eturn [^.]*\b(unit|it)\b[^.]*to (its|their) owners?'? ?s? hands?"),
    ('banish',      r'\bBanish (a|an|target)( \w+)* ?unit'),
    ('stun',        r'\b[Ss]tun (a|an|up to|all|it|them|that|each|target)'),
    ('shrink',      r'-(\d+|\[Might\]|X) \[Might\]|-\d+ ?\[M'),
    ('displace',    r'\b[Mm]ove (an|up to \w+) enemy unit|[Mm]ove an enemy'),
    ('gear_hate',   r'[Kk]ill (a|an|all|target|up to \w+)( \w+)* ?gear|[Bb]anish (a|an)( \w+)* ?gear|Give a gear \[Temporary\]|[Dd]etach|\[Disarm'),
    ('hand_attack', r'[Tt]hey discard|discards? (that card|their hand|1)\b.*opponent|choose an opponent\. They reveal their hand|choose a player\. They discard'),
    ('pump',        r'\+(\d+|X) \[Might\]'),
    ('buff',        r'\b[Bb]uff (a|an|me|it|them|another|up to|each|all|target)'),
    ('protect',     r"can't be chosen|\[Deflect|\[Shield|[Pp]revent|doesn't take damage|don't take damage|instead of dying|would die"),
    ('draw',        r'\b[Dd]raw (\d|a card|that many)'),
    ('ramp',        r'\b[Cc]hannel (\d|a) rune'),
    ('reduce',      r'costs? \[?\d+\]? less|cost \[\d+\] less|reduce'),
    ('ready',       r'\b[Rr]eady (a|an|another|up to|it|them|your|all|each|target)( \w+)* ?(unit|units|it\b|them\b)'),
    ('ready_self',  r'\bready me\b|I enter ready'),
    ('token',       r'unit tokens?\b'),
    ('recur',       r'from your trash'),
    ('extra_score', r'[Ss]core (\d|a|an additional) point|gain \d point'),
]


def classify(c):
    t = flat(c)
    k = own_kw(c)
    cls = set()
    for name, rx in CLASS_RULES:
        if re.search(rx, t):
            cls.add(name)
    if c['type'] == 'gear' and 'gear_hate' in cls and not re.search(r'[Kk]ill (a|an|all)( \w+)* ?gear|Give a gear|\[Disarm', t):
        cls.discard('gear_hate')
    # "Kill all gear" is not a unit sweeper; a single-target "kill a friendly unit" cost is not removal
    if 'sweeper' in cls and not re.search(r'unit', t):
        cls.discard('sweeper')
    if re.search(r'[Kk]ill (a|an|another) friendly unit', t) and not re.search(r'[Kk]ill (a|an|target|up to \w+)( enemy)? unit', t):
        cls.discard('kill')
    if 'Reaction' in k or 'Quick-Draw' in k:
        cls.add('t_reaction')
    elif 'Action' in k:
        cls.add('t_action')
    for kk, nm in (('Hidden', 't_hidden'), ('Ambush', 't_ambush'), ('Accelerate', 'haste'), ('Ganking', 'ganking'),
                   ('Legion', 'legion'), ('Deflect', 'deflect'), ('Tank', 'tank'), ('Deathknell', 'deathknell')):
        if kk in k:
            cls.add(nm)
    if {'kill', 'burn', 'fight', 'bounce', 'banish'} & cls:
        cls.add('removal')
    return cls


def dmg_n(c):
    """Fixed damage a 'Deal N' text deals; None when the amount is variable."""
    m = re.search(r'[Dd]eals? (\d+)', flat(c))
    return int(m.group(1)) if m else None


def might_cap(c, verb):
    """Upper Might bound in a 'with N [Might] or less' rider near the verb, else None."""
    m = re.search(verb + r'[^.]*?with (\d+) \[Might\] or less', flat(c))
    return int(m.group(1)) if m else None


def counter_ok(c, target):
    """Can counterspell c stop spell `target`? Parsed from c's own condition text."""
    t = flat(c)
    if target['type'] != 'spell':
        return False
    m = re.search(r'costs no more than \[(\d+)\] and no more than \[Rainbow\]', t)
    if m:
        return E(target) <= int(m.group(1)) and P(target) <= 1
    if re.search(r'Power cost \[Rainbow\]\[Rainbow\] or more', t):
        return P(target) >= 2
    m = re.search(r'Energy cost no more than \[(\d+)\]', t)
    if m:
        return E(target) <= int(m.group(1))
    if re.search(r'chooses (a friendly|it\b)', t):
        return bool({'removal', 'stun', 'displace', 'shrink'} & classify(target)) and 'sweeper' not in classify(target)
    return True


# ------------------------------------------------------------------ decks
class Deck:
    def __init__(self, raw):
        self.raw = raw
        self.id = raw['id']
        self.name = raw['name'].strip()
        lab = LABELS.get(self.id, {})
        self.era, self.event = lab.get('era'), lab.get('event')
        self.place = (lab.get('placement') or {}).get('cls')
        self.legend_short = lab.get('legend')
        self.legend = BY.get(base_code(raw['legend']['code'])) or NAME.get(raw['legend']['name'])
        ch = raw['champions'][0] if raw.get('champions') else None
        self.champ = resolve(ch) if ch else None
        self.card, self.lib, self.side = {}, collections.Counter(), collections.Counter()
        for e in raw['main']:
            c = resolve(e)
            if c and c['type'] in ('unit', 'spell', 'gear'):
                self.lib[c['name']] += e['q']
                self.card[c['name']] = c
        for e in raw.get('side') or []:
            c = resolve(e)
            if c and c['type'] in ('unit', 'spell', 'gear'):
                self.side[c['name']] += e['q']
                self.card.setdefault(c['name'], c)
        if self.champ:
            self.card.setdefault(self.champ['name'], self.champ)
        self.N = sum(self.lib.values())
        self.rune = collections.Counter()
        for e in raw.get('runes') or []:
            dom = (e.get('colors') or ['?'])[0].lower()
            self.rune[dom] += e['q']
        self.bfs = [resolve(e) or {'name': e['name'], 'text': e.get('text') or '', 'code': e.get('code')} for e in raw.get('battlefields') or []]
        self.cls = {n: classify(c) for n, c in self.card.items()}
        self.kw = {n: own_kw(c) for n, c in self.card.items()}

    def valid(self):
        return bool(self.legend and self.champ and 38 <= self.N <= 40 and sum(self.rune.values()) == 12)

    def copies(self, n):
        """Copies available over a game: library copies, plus the Champion Zone copy for the Chosen Champion."""
        return self.lib.get(n, 0) + (1 if self.champ and n == self.champ['name'] else 0)

    def url(self):
        return 'https://piltoverarchive.com/decks/view/' + self.id


def load_decks():
    out = []
    for line in open(os.path.join(A, 'raw', 'pa-decks.jsonl')):
        d = Deck(json.loads(line))
        if d.valid() and d.id in LABELS:
            out.append(d)
    return out


# ------------------------------------------------------------------ probability
def comb(n, k):
    return math.comb(n, k) if 0 <= k <= n else 0


def p_at_least(N, K, n, k=1):
    """P(X >= k), X ~ Hypergeometric(population N, successes K, draws n)."""
    n = min(n, N)
    tot = comb(N, n)
    return sum(comb(K, i) * comb(N - K, n - i) for i in range(k, min(K, n) + 1)) / tot if tot else 0.0


def p_all(N, Ks, n):
    """P(at least one copy of EACH named card among n of N cards); inclusion-exclusion over the named cards."""
    n = min(n, N)
    tot = comb(N, n)
    p = 0.0
    for mask in range(1 << len(Ks)):
        miss = sum(Ks[i] for i in range(len(Ks)) if mask >> i & 1)
        p += (-1) ** bin(mask).count('1') * comb(N - miss, n) / tot
    return max(0.0, p)


def p_power(split, runes_out, demand):
    """P(the runes channelled so far can pay `demand` = {domain: Power}). Rune Deck = 12 cards with `split`
    ({domain: count}); `runes_out` of them are on the board, a uniformly random subset (the Rune Deck is shuffled)."""
    demand = {d: n for d, n in demand.items() if n}
    if not demand:
        return 1.0
    doms = list(split)
    if any(d not in split for d in demand):
        return 0.0
    tot_r = sum(split.values())
    r = min(runes_out, tot_r)
    if len(doms) == 1:
        return 1.0 if r >= sum(demand.values()) else 0.0
    a, b = doms[0], doms[1]
    tot = comb(tot_r, r)
    ok = 0
    for x in range(0, r + 1):
        y = r - x
        if x <= split[a] and y <= split[b] and x >= demand.get(a, 0) and y >= demand.get(b, 0):
            ok += comb(split[a], x) * comb(split[b], y)
    return ok / tot if tot else 0.0


def pct(x):
    return f'{100 * x:.1f}%'


def runes_at(t, seat):
    """CR 315.3.b (channel 2 per turn), CR 487.7 / 488.7 (second player +1 in the first Channel Phase), 12-card Rune Deck (CR 103.4.a)."""
    return min(12, 2 * t + (1 if seat == 'draw' else 0))
