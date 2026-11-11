#!/usr/bin/env python3
"""Generate the TEXT-DERIVED half of the legend profiles for every Legend in the card pool.

    python3 build_legend_profiles.py \
        --cards ~/github_repositories/GameLab/data/cards/cards.json \
        [--gallery raw/gallery-2026-11-11.json] \
        [--engine-scripts ../interactions/engine-scripts.json] \
        --out data/legend-profiles.text.json

Everything here is computed from card text by regular expressions and set arithmetic. No model, no
network. Same inputs -> byte-identical output. Each derived statement keeps the verbatim text
fragment that produced it, so the app can show the reason.

What it derives per legend
  identity        code, printings, set, domains (rule 103.1.b), champion tag (rule 133.8.b), verbatim text
  abilities       each text line parsed into kind / cost / condition / effect / reminder
  rewards         things the legend's text pays you for doing (found in conditions and "Use only ..." clauses)
  needs           non-resource costs the legend's own abilities consume
  enables         things the legend's effect produces
  champions       every Champion unit that may be the Chosen Champion (rule 103.2.a.2), verbatim text + cost
  signatureCards  Signature cards carrying the champion tag (rule 103.2.d)
  themeAxes       weighted 0..1, with the evidence fragments and the in-identity card pool behind each axis
  battlefields    battlefields whose text shares an axis with the legend, with both text fragments as the reason

Weights are a fixed, documented formula (see WEIGHTS and axis_weight()); they are HEURISTIC, not measured.
"""
import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cardpool  # noqa: E402

SCHEMA_VERSION = 1

# ----------------------------------------------------------------------------------------------
# Axis vocabulary. One entry = one thing a deck can be "about".
#   rx    : matched against legend / champion / signature / battlefield text (reminder text removed)
#   pool  : matched against every other card's text to list the cards that DO the thing ("producers")
#   ptype : optional restriction of producers to card types
#   pfn   : optional name of a structural predicate (see POOL_PREDICATES) used instead of / with pool
# Where an id also exists in Untitled/apps/web/src/lib/scoring.ts TRAIT_LABELS the same id is used.
# ----------------------------------------------------------------------------------------------
AXES = [
    ('spell-matters', 'Spells', r'\bspells?\b', None, None, 'is_spell'),
    ('expensive-spells', 'Expensive spells (4+/5+ Energy)', r'spell that costs \[\d\] or more|play a spell, if you spent \[\d\] or more', None, None, 'is_spell_4plus'),
    ('expensive-permanents', 'Expensive units / gear / abilities (7+ Energy)', r'Energy cost \[7\] or more', None, None, 'is_permanent_7plus'),
    ('unit', 'Playing units', r'play a unit\b|play units\b|next unit you play|Units you play|to play units', None, None, 'is_cheap_unit'),
    ('mighty', 'Mighty (5+ Might)', r'\[Mighty\]|5\+ \[Might\]', None, None, 'is_mighty_source'),
    ('wide', 'Go wide (many bodies)', r'\d\+ units|three friendly units|for each (?:other )?friendly unit|each friendly unit', r'unit tokens?\b', None, None),
    ('token', 'Unit tokens', r'unit tokens?\b', r'unit tokens?\b', None, None),
    ('equipment', 'Equipment', r'\bEquipment\b|\[Equip\]|\battach(?:ed)?\b|\bdetach(?:ed)?\b|\[Weaponmaster\]|\[Quick-Draw\]', None, None, 'is_equipment'),
    ('gear', 'Gear (non-Equipment included)', r'(?<!and/or )\bgear\b(?! token)', None, None, 'is_gear'),
    ('gear-token', 'Gear tokens (Gold, Bomb)', r'gear tokens?\b', r'gear tokens?\b|\bGold\b|\bBombs?\b', None, None),
    ('gold', 'Gold tokens', r'\bGold\b', r'\bGold\b', None, None),
    ('buff', 'Buffs', r'\bbuff(?:ed|s)?\b|\[Buff\]', r'\bbuff(?:ed|s)?\b|\[Buff\]', None, None),
    ('stun', 'Stun', r'\bstun(?:s|ned)?\b|\[Stun\]', r'\bstun(?:s|ned)?\b|\[Stun\]', None, None),
    ('hold', 'Holding battlefields', r'\bhold\b', r'\bhold\b', None, None),
    ('conquer', 'Conquering battlefields', r'\bconquer\b', r'\bconquer\b', None, None),
    ('combat-win', 'Winning combats', r'win a combat', r'win a combat|\[Assault|\[Ambush\]', None, None),
    ('excess-damage', 'Excess combat damage', r'excess damage', r'excess damage|\[Assault', None, None),
    ('defend', 'Defending', r'\bdefend(?:s|er|ers|ing)?\b|\[Shield(?: \d+)?\]|\[Tank\]|attacks a battlefield you control', r'\[Shield(?: \d+)?\]|\[Tank\]|\bdefend(?:s|er|ers|ing)?\b', None, None),
    ('defend-alone', 'Lone defender', r'defends? alone|defending alone', r'\[Shield(?: \d+)?\]|\[Tank\]', 'unit', None),
    ('assault', 'Attacking (Assault)', r'\[Assault(?: \d+)?\]|while (?:it\'s|they\'re|I\'m) an attacker', r'\[Assault(?: \d+)?\]', None, None),
    ('shield', 'Shield', r'\[Shield(?: \d+)?\]', r'\[Shield(?: \d+)?\]', None, None),
    ('tank', 'Tank', r'\[Tank\]', r'\[Tank\]', None, None),
    ('movement', 'Moving units', r'\bmoves?\b|\[Ganking\]|\brecall\b', r'\bmoves?\b|\[Ganking\]|\brecall\b', None, None),
    ('ganking', 'Ganking', r'\[Ganking\]', r'\[Ganking\]', None, None),
    ('bounce-own', 'Returning own units to hand', r'Return a friendly unit[^.]*hand|unit you own into your hand|return a unit you control[^.]*hand', r'When you play (?:me|this)\b', 'unit', None),
    ('hidden', 'Hidden / face-down cards', r'\[Hidden\]|\bhide\b|face ?down', r'\[Hidden\]', None, None),
    ('play-from-elsewhere', 'Playing cards from outside the hand', r'from anywhere other than your hand|from face down|reveal the top \d+ cards[^.]*\. You may play', r'\[Hidden\]|\[Flow\]|from your trash|top (?:\d+ )?cards? of your Main Deck[^.]*play', None, None),
    ('ready', 'Readying units', r'\bready (?:it|a unit|them|up to \w+ units)\b|enters? ready|\[Accelerate\]', r'\bready (?:it|a unit|a friendly unit|them|me)\b|enters? ready|\[Accelerate\]', None, None),
    ('ready-runes', 'Readying runes', r'ready (?:up to )?\d+ runes', r'ready (?:up to )?\d+ runes', None, None),
    ('channel-rune', 'Channeling extra runes', r'\bchannel\b', r'\bchannel\b', None, None),
    ('energy-ramp', 'Adding resources', r'\[Add\]', r'\[Add\]', None, None),
    ('draw', 'Card draw', r'\bdraw \d', r'\bdraw \d', None, None),
    ('discard', 'Discard', r'\bdiscard\b', r'\bdiscard\b', None, None),
    ('low-hand', 'Empty hand', r'one or fewer cards in your hand', None, None, 'is_cheap_card'),
    ('banish', 'Banishing own cards', r'\bbanish(?:ed)?\b', r'\bbanish\b', None, None),
    ('trash', 'Trash as a resource', r'\btrash\b', r'\[Burn(?: \d+)?\]|into your trash|from your trash|\[Flow\]', None, None),
    ('empower', 'Empower', r'\bempower\b|\[Empower\]|\[Empowered\]|\bDisempower\b', r'\[Empower\]|\[Empowered\]|\bempower\b', None, None),
    ('level', 'XP / Level', r'\bXP\b|\[Level \d+\]', r'\bXP\b|\[Level \d+\]|\[Hunt', None, None),
    ('temporary', 'Temporary units', r'\[Temporary\]', r'\[Temporary\]', None, None),
    ('legion', 'Multiple cards per turn (Legion)', r'\[Legion\]', r'\[Legion\]', None, 'is_cheap_card'),
    ('choose-friendly', 'Choosing own units', r'choose a friendly unit', r'(?:Give|Buff|Ready|Move|Choose) (?:a|up to \w+) (?:friendly )?units?\b', 'spell', None),
    ('choose-enemy', 'Choosing enemy units / gear', r'chosen enemy units', r'(?:an|target|up to \w+) enemy (?:unit|gear)|(?:a|up to \w+) units? at a battlefield|\bStun a\b|Deal \d+ to a unit', None, None),
    ('showdown', 'Showdown-speed play', r'\bshowdowns?\b', None, None, 'is_fast_card'),
    ('might-reduction', 'Reducing enemy Might', r'-\d+ \[Might\]|reduce the Might', r'-\d+ \[Might\]|\[Disarm\]', None, None),
    # Rule 164.2.b: a Basic Rune has "Recycle this: [Reaction] - Add [C]", so paying Power IS recycling a rune.
    ('recycle', 'Recycling runes (= paying Power, rule 164.2.b)', r'recycle a rune|recycle one of your runes', r'recycle (?:a|one of your|\d+|up to \w+) runes?', None, 'has_power_cost'),
    ('protection', 'Saving own units from death', r'would die', r'would die|\[Deflect\]|prevent', None, None),
    ('death', 'Units dying', r'(?<!would )\bdies?\b|\bkill\b|\[Deathknell\]', r'\[Deathknell\]|\bkill (?:a|an|target|up to \w+) (?:enemy )?unit', None, None),
    ('deploy', 'Deploy gear', r'\[Deploy\]', r'\[Deploy\]', None, None),
    ('score-race', 'Near the Victory Score', r'Victory Score', r'score \d+ points?|gains? \d+ points?', None, None),
    ('card-copy', 'Copying units', r'becomes a copy|copy of another', r'becomes a copy|copy of', None, None),
    ('cost-reduction', 'Cost reduction', r'costs? (?:\[[^\]]+\])+ less|Reduce the cost|reduce the cost|costs \[\d\] less', r'costs? (?:\[[^\]]+\])+ less|reduce (?:my|the|its) cost', None, None),
    ('unit-gear', 'Gear that becomes a unit', r'becomes a unit gear|unit gear', None, None, 'is_costly_gear'),
    ('activated-abilities', 'Activated abilities', r'activated abilit', None, None, 'has_activated_ability'),
    ('self-sacrifice', 'Short-lived units', r'Kill me at end of turn', r'\[Deathknell\]|When you play (?:me|this)\b', 'unit', None),
]

# Things that only a battlefield text can offer back to a legend.
BATTLEFIELD_ONLY = [
    ('legend-ready', 'Readies the legend', r'ready your legend'),
]

AXIS_LABEL = {a[0]: a[1] for a in AXES}
AXIS_LABEL.update({a[0]: a[1] for a in BATTLEFIELD_ONLY})

# Role weights (HEURISTIC, fixed). See axis_weight().
WEIGHTS = {'rewards': 1.0, 'needs': 0.8, 'enables': 0.6, 'championShare': 0.2, 'signatureShare': 0.1,
           'championOnly': 0.35, 'signatureOnly': 0.15}

RESOURCE_COST = re.compile(r'^(?:\[(?:\d+|Any|Fury|Calm|Mind|Body|Chaos|Order|Exhaust)\])+$')


def strip_reminder(text):
    """Remove parenthesised reminder text. Returns (clean, [reminders])."""
    rem = re.findall(r'\(([^()]*)\)', text)
    clean = re.sub(r'\s*\([^()]*\)', '', text)
    return re.sub(r'\s+', ' ', clean).strip(), rem


def is_main_deck(c):
    return c['type'] in ('unit', 'spell', 'gear') and 'token' not in c['superTypes']


POOL_PREDICATES = {
    'is_spell': lambda c: c['type'] == 'spell',
    'is_spell_4plus': lambda c: c['type'] == 'spell' and (c.get('energy') or 0) >= 4,
    'is_permanent_7plus': lambda c: c['type'] in ('unit', 'gear') and (c.get('energy') or 0) >= 7,
    'is_cheap_unit': lambda c: c['type'] == 'unit' and (c.get('energy') or 0) <= 2,
    'is_mighty_source': lambda c: (c['type'] == 'unit' and (c.get('might') or 0) >= 5)
    or bool(re.search(r'\[Mighty\]', c['rulesText'])),
    'is_equipment': lambda c: 'Equipment' in c['tags'] or bool(re.search(r'\bEquipment\b|\[Weaponmaster\]', strip_reminder(c['rulesText'])[0])),
    'is_gear': lambda c: c['type'] == 'gear',
    'is_costly_gear': lambda c: c['type'] == 'gear' and (c.get('energy') or 0) >= 3,
    'is_cheap_card': lambda c: (c.get('energy') or 0) <= 1,
    'has_power_cost': lambda c: (c.get('power') or 0) >= 1 or bool(
        re.search(r'\[(?:Any|Fury|Calm|Mind|Body|Chaos|Order)\]', strip_reminder(c['rulesText'])[0])),
    'is_fast_card': lambda c: bool(re.match(r'^\[(?:Action|Reaction)\]', c['rulesText'])) or '[Hidden]' in c['rulesText'],
    'has_activated_ability': lambda c: c['type'] in ('unit', 'gear') and bool(
        re.search(r'(?m)^(?:\[(?:Action|Reaction)\]\[>\] )?(?:[^:(\n]{0,40})\[Exhaust\][^:(\n]{0,40}:', c['rulesText'])),
}


# ----------------------------------------------------------------------------------------------
# Ability parsing
# ----------------------------------------------------------------------------------------------
EFFECT_START = (r'you may|you |give |draw |buff |ready |channel |play |put |empower |deal |gain |then|it |that |they |'
                r'your |the next |reduce |kill |move |score |return |look |reveal |recycle |discard |\[Predict\]|\[Burn|\[Buff\]|each ')
TRIGGER_HEAD = re.compile(r'^(?:Once each turn, )?(?:When|Whenever|At|While|As|The first time|If|For each)\b', re.I)
GATE = re.compile(r'^((?:\[(?:Action|Reaction|Empowered|Level \d+)\](?:\[>\])?\s*(?:—\s*)?)+)(.*)$')
RESTRICTION = re.compile(r'(Use (?:this ability )?only[^.]*\.|Spend this (?:Energy|Power) only[^.]*\.)')


def split_condition(body):
    """'When X, [if Y,] Z' -> (condition, effect)."""
    m = re.search(r', (?=(?:%s))' % EFFECT_START, body)
    if not m:
        return body, ''
    cond, eff = body[:m.start()], body[m.end():]
    m2 = re.match(r'^(if [^,]+), (.*)$', eff)
    if m2:
        cond, eff = cond + ', ' + m2.group(1), m2.group(2)
    return cond, eff


def parse_ability(line):
    clean, reminders = strip_reminder(line)
    ab = {'text': line, 'kind': None, 'timing': None, 'gate': [], 'cost': [], 'condition': '', 'effect': '',
          'restriction': '', 'reminder': reminders}
    body = clean
    g = GATE.match(body)
    if g and g.group(2):
        gates = [x for x in re.findall(r'\[([^\]]+)\]', g.group(1)) if x != '>']
        body = g.group(2).strip()
        for x in gates:
            if x in ('Action', 'Reaction'):
                ab['timing'] = x.lower()
            else:
                ab['gate'].append(x)
    # "[Empower] [3][Any]" / "[Empower] — [1], [Exhaust]"
    m = re.match(r'^\[Empower\]\s*(?:—\s*)?(.+)$', body)
    if m:
        ab['kind'] = 'activated'
        ab['cost'] = [c.strip() for c in m.group(1).split(',')]
        ab['effect'] = 'Empower this.'
        ab['restriction'] = 'Use only if not Empowered.'
        return ab
    r = RESTRICTION.findall(body)
    if r:
        ab['restriction'] = ' '.join(r)
        body = RESTRICTION.sub('', body).strip()
    # activated:  <cost>: <effect>
    m = re.match(r'^([^:]{1,70}): (.+)$', body)
    if m and not TRIGGER_HEAD.match(body):
        ab['kind'] = 'activated'
        ab['cost'] = [c.strip() for c in m.group(1).split(',')]
        eff = m.group(2)
        m2 = re.match(r'^\[(Action|Reaction)\](?:, \[(Legion)\])?\s*—\s*(.+)$', eff)
        if m2:
            ab['timing'] = m2.group(1).lower()
            if m2.group(2):
                ab['gate'].append(m2.group(2))
            eff = m2.group(3)
        m3 = re.match(r'^(If [^,]+), (.+)$', eff)
        if m3:
            ab['condition'], eff = m3.group(1), m3.group(2)
        ab['effect'] = eff
        return ab
    if TRIGGER_HEAD.match(body):
        cond, eff = split_condition(body)
        head = re.match(r'^(?:Once each turn, )?(\w+)', body).group(1).lower()
        ab['kind'] = 'static' if head in ('while', 'as', 'if', 'for') else 'triggered'
        m5 = re.match(r'^(.*?) (if you have [^.]*)\.(.*)$', eff)
        if m5:
            cond, eff = cond + ', ' + m5.group(2), (m5.group(1) + '.' + m5.group(3)).strip()
        ab['condition'], ab['effect'] = cond, eff
        # "you may exhaust me [and pay X] to <effect>"  -> cost moves out of the effect
        m4 = re.match(r'^you may ((?:exhaust me|pay|discard|spend)[^.]*?) to (.+)$', eff)
        if m4:
            ab['cost'] = [c.strip() for c in re.split(r' and |, ', m4.group(1))]
            ab['effect'] = m4.group(2)
        return ab
    ab['kind'] = 'static'
    # "Your Mechs have [Shield]." / "Your Equipment each give [Assault]." / "Units you play to ... enter ready."
    m = re.match(r'^(Your [^.]*?|Units you play[^.]*?) (have|each give|enter|enters|\[Add\]) (.*)$', body)
    if m:
        ab['condition'] = m.group(1)
        ab['effect'] = (m.group(2) + ' ' + m.group(3)).strip()
    else:
        m = re.match(r'^You may (pay [^ ]+) to (.*)$', body)
        if m:
            ab['cost'] = [m.group(1)]
            ab['effect'] = m.group(2)
        else:
            ab['effect'] = body
    return ab


# When the left axis matches a fragment, the right ones are only part of its wording, not themes of their own.
SUPPRESS = {'expensive-permanents': {'unit', 'gear', 'activated-abilities'}, 'choose-enemy': {'gear'},
            'gear-token': {'gear'}, 'unit-gear': set(), 'token': {'unit'}}

# Own objects the legend's effect acts on: the legend NEEDS them on the table (role 'needs').
NEEDS_IN_EFFECT = [
    (r'friendly gear|Ready (?:a|\d+) gear', 'gear'),
    (r'Equipment you control', 'equipment'),
    (r'card with \[Hidden\]', 'hidden'),
    (r'Teemo unit you own', 'bounce-own'),
]
# "... equal to my [Shield]" / "... for each friendly unit with [Temporary]": the effect scales with X -> X is rewarded.
SCALING = re.compile(r'(?:equal to|for each)[^."]*')


def axis_hits(text):
    out = []
    for aid, _label, rx, _pool, _ptype, _pfn in AXES:
        m = re.search(rx, text, re.I)
        if m:
            out.append((aid, m.group(0)))
    drop = set()
    for aid, _frag in out:
        drop |= SUPPRESS.get(aid, set())
    return [(aid, frag) for aid, frag in out if aid not in drop]


def sentence_around(text, frag):
    for s in re.split(r'(?<=[.])\s+|\n', text):
        if frag in s:
            return s.strip()
    return text.strip()


# ----------------------------------------------------------------------------------------------
# Legend-level derivations
# ----------------------------------------------------------------------------------------------
def champion_tag(legend, cards):
    """Rule 133.8.b / 103.2.a.2: the tag that links the legend to champion units."""
    best = None
    for tag in legend['tags']:
        n = cardpool.normalize_name(tag)
        for c in cards:
            if c['type'] == 'unit' and 'champion' in c['superTypes'] and tag in c['tags'] \
                    and cardpool.normalize_name(c['name'].split(',')[0]) == n:
                best = tag
                break
        if best:
            break
    return best or (legend['tags'][-1] if legend['tags'] else None)


def in_identity(card, legend):
    """Rule 103.1.b.3 / 103.1.b.4: every domain of the card must be in the legend's domains."""
    doms = [d for d in card['domains'] if d != 'colorless']
    return all(d in legend['domains'] for d in doms)


def signature_ok(card, tag):
    return 'signature' not in card['superTypes'] or tag in card['tags']


BANS = {}  # cardCode -> {effectiveFrom, source}; filled from --bans


def card_ref(c):
    ref = {'cardCode': c['cardCode'], 'name': c['name'], 'type': c['type'], 'energy': c.get('energy'),
           'power': c.get('power'), 'might': c.get('might'), 'domains': c['domains']}
    if c['cardCode'] in BANS:
        ref['bannedFrom'] = BANS[c['cardCode']]['effectiveFrom']
    return ref


def pool_for_axis(axis, legend, tag, cards):
    aid, _label, _rx, pool, ptype, pfn = axis
    out = []
    for c in cards:
        if not is_main_deck(c) or not in_identity(c, legend) or not signature_ok(c, tag):
            continue
        if ptype and c['type'] != ptype:
            continue
        text = strip_reminder(c.get('rulesTextCurrent') or c['rulesText'])[0]
        ok = False
        if pfn:
            ok = POOL_PREDICATES[pfn](c)
        if not ok and pool:
            ok = bool(re.search(pool, text, re.I))
        if ok:
            out.append(c)
    out.sort(key=lambda c: ((c.get('energy') or 0), c['cardCode']))
    return out


def axis_weight(roles, champ_share, sig_share):
    base = max([WEIGHTS[r] for r in roles if r in ('rewards', 'needs', 'enables')] or [0.0])
    if base > 0:
        w = base + WEIGHTS['championShare'] * champ_share + WEIGHTS['signatureShare'] * sig_share
    else:
        w = WEIGHTS['championOnly'] * champ_share + WEIGHTS['signatureOnly'] * sig_share
    return round(min(1.0, w), 2)


EXTRA_TOKEN_NAMES = ['Sand Soldier', 'Mech', 'Bomb', 'Sprite', 'Reflection', 'Recruit', 'Bird']


def tribe_tags(legend_text, cards, champion_tags):
    """Non-champion tags and token names (Mech, Sand Soldier, Poro ...) named in the legend text."""
    tags = set(EXTRA_TOKEN_NAMES)
    for c in cards:
        for t in c['tags']:
            if t not in champion_tags and t != 'Equipment':
                tags.add(t)
    found = []
    for t in sorted(tags, key=lambda x: (-len(x), x)):
        if re.search(r'\b%ss?\b' % re.escape(t), legend_text):
            found.append(t)
    return found


def battlefield_profile(bf):
    text, _ = strip_reminder(bf.get('rulesTextCurrent') or bf['rulesText'])
    hits = axis_hits(text)
    for aid, _label, rx in BATTLEFIELD_ONLY:
        m = re.search(rx, text, re.I)
        if m:
            hits.append((aid, m.group(0)))
    cond, eff = split_condition(text) if TRIGGER_HEAD.match(text) else ('', text)
    prof = {}
    for aid, frag in hits:
        prof[aid] = 'condition' if frag in cond and frag not in eff else 'effect'
    return text, prof


def build_profile(legend, cards, engine):
    tag = champion_tag(legend, cards)
    text_now = legend.get('rulesTextCurrent') or legend['rulesText']
    abilities = [parse_ability(l) for l in text_now.split('\n') if l.strip()]
    evidence = {}  # axis -> list of {role, source, text}

    def add(aid, role, source, frag, sentence):
        evidence.setdefault(aid, []).append({'role': role, 'source': source, 'match': frag, 'text': sentence})

    uses_exhaust = False
    for ab in abilities:
        if any(re.search(r'\[Exhaust\]|exhaust me', c, re.I) for c in ab['cost']) or 'exhaust me' in ab['text']:
            uses_exhaust = True
        for part, role in ((ab['condition'], 'rewards'), (ab['restriction'], 'rewards'), (ab['effect'], 'enables')):
            for aid, frag in axis_hits(part):
                add(aid, role, legend['cardCode'], frag, part)
        for rx, aid in NEEDS_IN_EFFECT:
            m = re.search(rx, ab['effect'])
            if m:
                add(aid, 'needs', legend['cardCode'], m.group(0), ab['effect'])
        for frag_m in SCALING.finditer(ab['effect']):
            for aid, frag in axis_hits(frag_m.group(0)):
                add(aid, 'rewards', legend['cardCode'], frag, ab['effect'])
        for gate in ab['gate']:
            for aid, frag in axis_hits('[' + gate + ']'):
                add(aid, 'rewards', legend['cardCode'], frag, '[' + gate + ']')
        for cost in ab['cost']:
            if RESOURCE_COST.match(cost.replace(' ', '')) or re.match(r'^(?:exhaust me|pay (?:\[[^\]]+\])+|\[Exhaust\])$', cost, re.I):
                continue
            for aid, frag in axis_hits(cost):
                add(aid, 'needs', legend['cardCode'], frag, cost)

    champion_tags = {t for c in cards if c['type'] == 'legend' for t in c['tags']}
    own_champion_tags = champion_tags - {'Yordle'}
    tribes = tribe_tags(strip_reminder(text_now)[0], cards, own_champion_tags)
    reminder_text = ' '.join(r for ab in abilities for r in ab['reminder'])
    reminder_tribes = [t for t in tribe_tags(reminder_text, cards, own_champion_tags) if t not in tribes and t != 'Gold']

    champs = sorted([c for c in cards if c['type'] == 'unit' and 'champion' in c['superTypes'] and tag in c['tags']
                     and in_identity(c, legend)], key=lambda c: ((c.get('energy') or 0), c['cardCode']))
    champs_off = sorted([c for c in cards if c['type'] == 'unit' and 'champion' in c['superTypes'] and tag in c['tags']
                         and not in_identity(c, legend)], key=lambda c: c['cardCode'])
    sigs = sorted([c for c in cards if 'signature' in c['superTypes'] and tag in c['tags']], key=lambda c: c['cardCode'])

    champ_axes, sig_axes = {}, {}
    for group, store in ((champs, champ_axes), (sigs, sig_axes)):
        for c in group:
            t = strip_reminder(c.get('rulesTextCurrent') or c['rulesText'])[0]
            for aid, frag in axis_hits(t):
                store.setdefault(aid, []).append((c, frag, sentence_around(t, frag)))

    axes_out = []
    for axis in AXES:
        aid = axis[0]
        ev = list(evidence.get(aid, []))
        cs = len({c['cardCode'] for c, _f, _s in champ_axes.get(aid, [])}) / len(champs) if champs else 0.0
        ss = len({c['cardCode'] for c, _f, _s in sig_axes.get(aid, [])}) / len(sigs) if sigs else 0.0
        roles = sorted({e['role'] for e in ev})
        w = axis_weight(roles, cs, ss)
        if w <= 0:
            continue
        for c, frag, sent in champ_axes.get(aid, []):
            ev.append({'role': 'championText', 'source': c['cardCode'], 'match': frag, 'text': sent})
        for c, frag, sent in sig_axes.get(aid, []):
            ev.append({'role': 'signatureText', 'source': c['cardCode'], 'match': frag, 'text': sent})
        pool = pool_for_axis(axis, legend, tag, cards)
        axes_out.append({
            'axis': aid, 'label': axis[1], 'weight': w, 'roles': roles,
            'championShare': round(cs, 2), 'signatureShare': round(ss, 2), 'evidence': ev,
            'poolSupport': {'count': len(pool), 'cardCodes': [c['cardCode'] for c in pool]},
        })
    axes_out.sort(key=lambda a: (-a['weight'], a['axis']))

    # tribes become their own axes (weight 1.0 if in a condition/subject, 0.6 if only produced)
    for t in tribes + reminder_tribes:
        role = 'enables'
        for ab in abilities:
            if re.search(r'\b%ss?\b' % re.escape(t), ab['condition'] + ' ' + ab['restriction']):
                role = 'rewards'
        src_text = reminder_text if t in reminder_tribes else strip_reminder(text_now)[0]
        members = [c for c in cards if is_main_deck(c) and in_identity(c, legend) and signature_ok(c, tag)
                   and (t in c['tags'] or re.search(r'\b%ss?\b' % re.escape(t), strip_reminder(c['rulesText'])[0]))]
        members.sort(key=lambda c: ((c.get('energy') or 0), c['cardCode']))
        axes_out.append({'axis': 'tag:' + t, 'label': t + ' cards', 'weight': WEIGHTS[role], 'roles': [role],
                         'championShare': 0.0, 'signatureShare': 0.0,
                         'evidence': [{'role': role, 'source': legend['cardCode'], 'match': t,
                                       'fromReminderText': t in reminder_tribes,
                                       'text': sentence_around(src_text, t)}],
                         'poolSupport': {'count': len(members), 'cardCodes': [c['cardCode'] for c in members]}})
    axes_out.sort(key=lambda a: (-a['weight'], a['axis']))

    def by_role(role):
        seen, out = set(), []
        for a in axes_out:
            for e in a['evidence']:
                if e['role'] == role and e['source'] == legend['cardCode'] and (a['axis'], e['text']) not in seen:
                    seen.add((a['axis'], e['text']))
                    out.append({'axis': a['axis'], 'label': a['label'], 'text': e['text']})
        return out

    # battlefields
    weight_of = {a['axis']: a for a in axes_out}
    bfs = []
    for bf in cards:
        if bf['type'] != 'battlefield' or 'token' in bf['superTypes'] or bf['cardCode'].split('-')[1].startswith('T'):
            continue
        btext, bprof = battlefield_profile(bf)
        score, reasons = 0.0, []
        for aid, brole in sorted(bprof.items()):
            if aid == 'legend-ready':
                if uses_exhaust:
                    score += 0.6
                    reasons.append({'axis': aid, 'label': AXIS_LABEL[aid], 'fit': 'legend ability exhausts the legend',
                                    'legendText': next(a['text'] for a in abilities if 'xhaust' in a['text']),
                                    'battlefieldText': btext})
                continue
            a = weight_of.get(aid)
            if not a or not [r for r in a['roles'] if r in ('rewards', 'needs', 'enables')]:
                continue
            lrole = 'rewards' if 'rewards' in a['roles'] else ('needs' if 'needs' in a['roles'] else 'enables')
            # battlefield produces what the legend rewards/needs, or asks for what the legend produces -> full fit
            feeds = (brole == 'effect' and lrole in ('rewards', 'needs')) or (brole == 'condition' and lrole == 'enables')
            shared_trigger = brole == 'condition' and lrole in ('rewards', 'needs')
            if not feeds and not shared_trigger:
                continue  # both merely produce the same thing: no interaction
            fit = 1.0 if feeds else 0.5
            score += fit * a['weight']
            ltext = next(e['text'] for e in a['evidence'] if e['source'] == legend['cardCode'])
            reasons.append({'axis': aid, 'label': a['label'],
                            'fit': ('battlefield %s it, legend %s it' % ('gives' if brole == 'effect' else 'triggers on', lrole)),
                            'complementary': feeds, 'legendText': ltext, 'battlefieldText': btext})
        if reasons:
            entry = {'cardCode': bf['cardCode'], 'name': bf['name'], 'score': round(score, 2), 'reasons': reasons}
            if bf['cardCode'] in BANS:
                entry['bannedFrom'] = BANS[bf['cardCode']]['effectiveFrom']
            bfs.append(entry)
    bfs.sort(key=lambda b: ('bannedFrom' in b, -b['score'], b['cardCode']))

    eng = None
    if engine is not None:
        e = engine.get(legend.get('gameplayId'))
        if e is not None:
            eng = {'source': e.get('source'), 'flagged': e.get('flagged'),
                   'abilities': [{'kind': a.get('kind'), 'trigger': a.get('trigger'), 'timing': a.get('timing')}
                                 for a in e.get('abilities', [])]}

    same = sorted(c['cardCode'] for c in cards if c['type'] == 'legend' and c['cardCode'] != legend['cardCode']
                  and tag in c['tags'])
    return {
        'legendCode': legend['cardCode'], 'printingCodes': legend['printingCodes'], 'name': legend['name'],
        'set': legend['set'], 'source': legend['source'], 'championTag': tag, 'tags': legend['tags'],
        'domains': legend['domains'], 'rulesText': legend['rulesText'],
        'rulesTextCurrent': legend.get('rulesTextCurrent'),
        'abilities': abilities, 'usesExhaust': uses_exhaust,
        'rewards': by_role('rewards'), 'needs': by_role('needs'), 'enables': by_role('enables'),
        'champions': [dict(card_ref(c), rulesText=c['rulesText'], tags=c['tags'], set=c['set'], source=c['source'])
                      for c in champs],
        'championsOutsideIdentity': [card_ref(c) for c in champs_off],
        'signatureCards': [dict(card_ref(c), rulesText=c.get('rulesTextCurrent') or c['rulesText'], set=c['set'],
                                source=c['source']) for c in sigs],
        'otherLegendsSameChampion': same,
        'themeAxes': axes_out,
        'battlefields': bfs,
        'identityPool': {k: sum(1 for c in cards if is_main_deck(c) and in_identity(c, legend) and signature_ok(c, tag)
                                and c['type'] == k) for k in ('unit', 'spell', 'gear')},
        'engineScript': eng,
        'textConfidence': 'parsed' if axes_out and any(a['roles'] for a in axes_out) else 'unparsed',
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cards', required=True)
    ap.add_argument('--gallery')
    ap.add_argument('--engine-scripts')
    ap.add_argument('--bans', help='JSON {cards: {cardCode: {effectiveFrom, source}}}; banned cards are flagged, never hidden')
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    cards, meta = cardpool.load_pool(os.path.expanduser(a.cards), a.gallery)
    changed = {x['cardCode']: x['new'] for x in meta['textChangedSinceCardsJson'] if x['new']}
    for c in cards:
        if c['cardCode'] in changed:
            c['rulesTextCurrent'] = changed[c['cardCode']]
    if a.bans and os.path.exists(a.bans):
        BANS.update(json.load(open(a.bans, encoding='utf-8'))['cards'])
    engine = None
    if a.engine_scripts and os.path.exists(a.engine_scripts):
        engine = json.load(open(a.engine_scripts, encoding='utf-8'))
    legends = sorted([c for c in cards if c['type'] == 'legend' and 'token' not in c['superTypes']],
                     key=lambda c: c['cardCode'])
    out = {
        'schemaVersion': SCHEMA_VERSION,
        'generator': 'docs/research/analysis/legend-profiles/build_legend_profiles.py',
        'inputs': {'cardsJsonBuiltAt': meta['cardsJsonBuiltAt'], 'galleryFetchedAt': meta['galleryFetchedAt'],
                   'gallerySetsAdded': meta['gallerySetsAdded'], 'galleryCardsAdded': meta['galleryCardsAdded'],
                   'cardsWithChangedText': len(changed), 'bansFlagged': sorted(BANS)},
        'weights': WEIGHTS,
        'axes': [{'axis': x[0], 'label': x[1]} for x in AXES] + [{'axis': x[0], 'label': x[1]} for x in BATTLEFIELD_ONLY],
        'legends': [build_profile(l, cards, engine) for l in legends],
    }
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    json.dump(out, open(a.out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1, sort_keys=False)
    print('legends: %d  -> %s' % (len(out['legends']), a.out))


if __name__ == '__main__':
    main()
