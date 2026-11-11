"""Shared loaders + deterministic card classifier for the matchups-and-lines research.

Read-only inputs (GameLab repo):
  data/cards/cards.json                              (931 cards, built 2026-09, no RAD set)
  data/decks/samples/piltover-archive-2026-09-06.json (59 lists)
Everything here is regex over rulesText + keyword list: no hand-written per-card table.
The classes are HEURISTIC approximations of what a real interaction graph would hold.
"""
import json, re, math, collections, os

GL = os.path.expanduser('~/github_repositories/GameLab')
CARDS_PATH = GL + '/data/cards/cards.json'
DECKS_PATH = GL + '/data/decks/samples/piltover-archive-2026-09-06.json'


def load_cards():
    cards = json.load(open(CARDS_PATH))['cards']
    by = {}
    for c in cards:
        by[c['cardCode']] = c
        for p in c.get('printings', []):
            by.setdefault(p.get('cardCode'), c)
    return cards, by


def resolve(by, code):
    if code in by:
        return by[code]
    m = re.match(r'^([A-Z]+-[A-Z]?\d+)', code or '')
    if m and m.group(1) in by:
        return by[m.group(1)]
    return None


def load_decks(by):
    raw = json.load(open(DECKS_PATH))['decks']
    out = []
    for d in raw:
        leg = resolve(by, d.get('legend') or '')
        champ = resolve(by, d.get('chosenChampion') or '')
        main, side, runes, unresolved = [], [], [], 0
        for e in d['main']:
            c = resolve(by, e['cardCode'])
            if c is None:
                unresolved += e['count']
                continue
            main.append((c, e['count']))
        for e in d['sideboard']:
            c = resolve(by, e['cardCode'])
            if c is None:
                unresolved += e['count']
                continue
            side.append((c, e['count']))
        for e in d['runes']:
            c = resolve(by, e['cardCode'])
            runes.append((c, e['count'], e['cardCode']))
        # main lists sometimes carry runes/legend under alt-art codes: split them out
        real_main = [(c, n) for c, n in main if c['type'] in ('unit', 'spell', 'gear')]
        extra_runes = [(c, n, c['cardCode']) for c, n in main if c['type'] == 'rune']
        if not runes and extra_runes:
            runes = extra_runes
        if leg is None:
            for c, n in main:
                if c['type'] == 'legend':
                    leg = c
        bfs = [resolve(by, b) for b in d.get('battlefields', [])]
        bfs += [c for c, n in main if c['type'] == 'battlefield']
        out.append(dict(name=d['name'].replace('&#x27;', "'"), source=d['source'], legend=leg, champion=champ,
                        main=real_main, side=[(c, n) for c, n in side if c['type'] in ('unit', 'spell', 'gear')],
                        runes=runes, battlefields=[b for b in bfs if b], unresolved=unresolved))
    return out


# ---------------------------------------------------------------- classifier
def kw(c):
    return {k['name'] for k in c.get('keywords', [])}


def text(c):
    return (c.get('rulesText') or '').replace('\n', ' ')


def strip_reminder(t):
    return re.sub(r'\([^)]*\)', '', t)


CLASS_RULES = [
    # (class, regex on reminder-stripped text)
    ('counter',      r'\bCounter (a|an enemy) spell'),
    ('sweeper',      r'(Deal \d+ to (all|each)|[Kk]ill (all|each) (enemy |other )?units?|to each (enemy )?unit|all (enemy )?units (here|at)|split among|each enemy unit|to ALL units)'),
    ('kill',         r'\b[Kk]ill (a|an|target|up to \w+|another)( \w+)* ?(enemy )?unit'),
    ('burn',         r'\b[Dd]eals? (\d+|damage equal)[^.]*to (a|an|up to \w+|each of up to \w+)( \w+)* ?unit'),
    ('fight',        r'deal damage equal to their Mights to each other'),
    ('bounce',       r"[Rr]eturn [^.]*\bunit[^.]*to (its|their) owners?'? ?s? hands?"),
    ('banish',       r'\bBanish (a|an|target)( \w+)* ?unit'),
    ('stun',         r'\b[Ss]tun '),
    ('shrink',       r'-\d+ \[Might\]'),
    ('displace',     r'\bMove an enemy unit|move an enemy unit'),
    ('gear_hate',    r'[Kk]ill (a|an|all|target|up to \w+)( \w+)* ?gear|[Bb]anish (a|an)( \w+)* ?gear|Give a gear \[Temporary\]|move an enemy gear'),
    ('lockout',      r"can't play cards"),
    ('hand_attack',  r'reveal their hand\. Choose [^.]*(recycle|banish|discard)|[Oo]pponents? discards?|They discard'),
    ('pump',         r'\+\d+ \[Might\]'),
    ('buff',         r'\b[Bb]uff '),
    ('protect',      r"can't be chosen|\[Deflect|\[Shield|[Pp]revent|would die|doesn't take damage|don't take damage"),
    ('draw',         r'\b[Dd]raw \d'),
    ('ramp',         r'\b[Cc]hannel \d'),
    ('ready',        r'\b[Rr]eady (a|an|another|up to|me|it|them|your)'),
    ('token',        r'unit token|\btoken\b'),
    ('recur',        r'from your trash'),
    ('extra_score',  r'gains? \d+ points?|[Ss]core \d'),
]


def classify(c):
    t = strip_reminder(text(c))
    k = kw(c)
    cls = set()
    for name, rx in CLASS_RULES:
        if re.search(rx, t):
            cls.add(name)
    if 'Reaction' in k or 'Quick-Draw' in k:
        cls.add('t_reaction')
    elif 'Action' in k:
        cls.add('t_action')
    if 'Hidden' in k:
        cls.add('t_hidden')
    if 'Ambush' in k:
        cls.add('t_ambush')
    if 'Accelerate' in k:
        cls.add('haste')
    if 'Ganking' in k or re.search(r'\[Ganking', t):
        cls.add('ganking')
    if 'Legion' in k:
        cls.add('legion')
    if {'kill', 'burn', 'fight', 'bounce', 'banish'} & cls:
        cls.add('removal')
    return cls


def E(c):
    return c.get('energy') or 0


def P(c):
    return c.get('power') or 0


# ---------------------------------------------------------------- probability
def comb(n, k):
    return math.comb(n, k) if 0 <= k <= n else 0


def p_at_least(N, K, n, k=1):
    """P(X >= k), X ~ Hypergeometric(population N, successes K, draws n)."""
    n = min(n, N)
    tot = comb(N, n)
    return sum(comb(K, i) * comb(N - K, n - i) for i in range(k, min(K, n) + 1)) / tot if tot else 0.0


def pct(x):
    return f'{100 * x:.1f}%'
