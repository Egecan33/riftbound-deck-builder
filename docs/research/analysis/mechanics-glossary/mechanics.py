"""Deterministic mechanic detectors over pool.json. Every count in ../../mechanics-glossary.md comes from this file.
Usage: python3 -I mechanics.py   -> writes out/mechanics.json and prints a summary table."""
import json, re, os, collections, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SET_ORDER = ['OGN', 'OGS', 'SFD', 'UNL', 'VEN', 'RAD']
def strip(t):
    """Remove reminder text (anything in parentheses) so reminder wording never triggers a detector (same idea as ../roles.mjs)."""
    return re.sub(r'[ \t]+', ' ', re.sub(r'\([^)]*\)', ' ', t or '')).strip()
KEYWORDS = [  # (id, printed keyword, CR rule, takes a value)
    ('accelerate', 'Accelerate', '805', False), ('action', 'Action', '806', False), ('assault', 'Assault', '807', True),
    ('deathknell', 'Deathknell', '808', False), ('deflect', 'Deflect', '809', True), ('ganking', 'Ganking', '810', False),
    ('hidden', 'Hidden', '811', False), ('legion', 'Legion', '812', False), ('reaction', 'Reaction', '813', False),
    ('shield', 'Shield', '814', True), ('tank', 'Tank', '815', False), ('temporary', 'Temporary', '816', False),
    ('vision', 'Vision', '817', False), ('equip', 'Equip', '818', False), ('quick-draw', 'Quick-Draw', '819', False),
    ('repeat', 'Repeat', '820', False), ('weaponmaster', 'Weaponmaster', '821', False), ('ambush', 'Ambush', '822', False),
    ('hunt', 'Hunt', '823', True), ('level', 'Level', '824', True), ('unique', 'Unique', '825', False),
    ('backline', 'Backline', '826', False), ('empower', 'Empower', '827', False), ('empowered', 'Empowered', '828', False),
    ('flow', 'Flow', '829', False), ('deploy', 'Deploy', '830', False), ('disarm', 'Disarm', '831', True), ('show-off', 'Show Off', '832', False)]
def kw_any(k):
    # bracketed anywhere, or (gallery typo on 3 cards) unbracketed at the head of a line followed by a cost or nothing
    return re.compile(r'\[%s( \d+)?\]|(?:^|\n)%s(?= ?(?:\[|$|\n))' % (re.escape(k), re.escape(k)), re.I | re.M)
def kw_has(k):
    # the keyword heads an ability: start of a line, optionally after other keyword heads / dependent-keyword prefixes on the same line
    return re.compile(r'(?:^|\n)\s*(?:\[[A-Za-z][A-Za-z -]*(?: \d+)?\](?:\[>+\])?[ ,]*)*?\[%s( \d+)?\]|(?:^|\n)%s(?= ?(?:\[|$|\n))' % (re.escape(k), re.escape(k)), re.I | re.M)
R = lambda p: re.compile(p, re.I)
SYSTEMS = collections.OrderedDict([
    # resources
    ('add', R(r'\[add\]')),
    ('cost-reduction', R(r'costs? (\[[^\]]+\])+ less|cost (\[[^\]]+\])+ less|costs? \d+ less|reduce (my|its|their|the) cost|cost[^.]*\bless\b')),
    ('cost-increase', R(r'costs? (\[[^\]]+\])+ more|cost[^.]*\bmore\b(?! than)')),
    ('ignore-cost', R(r'ignoring (its|their|any and all|the) (base )?costs?|without paying')),
    ('additional-cost', R(r'as an additional cost|you may pay (\[[^\]]+\])+')),
    ('pay-any-amount', R(r'pay any amount|\bx\b')),
    ('channel', R(r'\bchannel(s|ed)?\b')),
    ('rune-ready', R(r'\bready (up to )?(\w+ )?(of your |friendly |exhausted )?runes?\b|ready (your|all) runes')),
    ('rune-exhaust', R(r'\bexhaust(s|ed)? (up to )?(\w+ )?(of your |friendly |enemy |their |ready )*runes?\b|runes? (enter|enters) exhausted|channel[^.]*exhausted')),
    ('rune-recycle', R(r'\brecycles? [^.]*\brunes?\b')),
    ('rune-any', R(r'\brunes?\b')),
    ('gold', R(r'\bgold\b')),
    # chain / timing
    ('counter-spell', R(r'\bcounter (an?|that|it|the|target|all|each)\b|\bcounters? (an?|that) (enemy )?(spell|abilit)')),
    ('cant-be-countered', R(r"can't be countered")),
    ('showdown', R(r'\bshowdowns?\b')),
    ('grants-timing', R(r'(have|has|gains?|give[^.]*|with) \[(action|reaction)\]')),
    ('new-choices', R(r'new choices|gain control of (it|that spell|a spell)')),
    # combat
    ('attack-trigger', R(r'when (i|a friendly unit|one or more friendly units|you|another friendly unit|a unit you control|an? [a-z]+ unit|it) (attack|attacks)\b|when (i|a friendly unit) attacks? or defends?')),
    ('defend-trigger', R(r'when (i|a friendly unit|one or more friendly units|you|another friendly unit|it) (defend|defends)\b|attacks? or defends?')),
    ('attacker-ref', R(r'\battack(s|er|ers|ing|ed)?\b')),
    ('defender-ref', R(r'\bdefen(d|ds|der|ders|ding|ded)\b')),
    ('combat-ref', R(r'\bcombats?\b')),
    ('win-combat', R(r'\bwins? a combat|\bwon a combat|win combat')),
    ('combat-damage-ref', R(r'combat damage')),
    ('damage-assignment', R(r'assign(ed|ing|s)? (combat )?damage|must be assigned|ignore \[(tank|backline)\]')),
    ('excess-damage', R(r'excess damage')),
    ('deal-damage', R(r'\bdeals? (\d+|x|damage|that much|twice|double|\[)')),
    ('split-damage', R(r'split (among|between)')),
    ('bonus-damage', R(r'bonus damage')),
    ('prevent', R(r'\bprevent')),
    ('heal', R(r'\bheal')),
    ('takes-damage', R(r'takes? (\d+ |combat |non-combat |any )?damage|is dealt damage|would be dealt damage|damaged')),
    ('might-plus', R(r'\+\d+ \[(might|m|s)\]|\+\[might\]|\+x \[might\]')),
    ('might-minus', R(r'-\d+ \[(might|m|s)\]|-x \[might\]|reduce[^.]*might')),
    ('mighty', R(r'\[mighty\]|\bmighty\b')),
    ('double', R(r'\bdouble')),
    ('swap', R(r'\bswap')),
    ('alone', R(r'\balone\b|one on one')),
    # movement / position
    ('move', R(r'\bmov(e|es|ed|ing)\b')),
    ('cant-move', R(r"can't move|can't be moved|skip the next time[^.]*move")),
    ('recall', R(r'\brecall')),
    ('bounce', R(r"return[^.]*to (its|their) owners?'s? hand|return[^.]*to (your|their|its owner's) hand|to their owners' hands")),
    ('ready-unit', R(r'\bready (me|it|them|an?|another|up to|all|each|that|those|your|two|a friendly|something)\b(?![^.]{0,12}runes?)')),
    ('enters-ready', R(r'enters? ready|play[^.]*\bready\b[^.]*token|ready [0-9a-z\[\] ]*unit token')),
    ('exhaust-effect', R(r'\bexhaust (an?|another|up to|all|each|that|those|it|them|me|two|enemy|a friendly|friendly)\b')),
    ('exhaust-cost-ability', R(r'\[exhaust\]\s*:|\[e\]\s*:|, \[exhaust\]')),
    ('exhausted-ref', R(r'\bexhausted\b')),
    ('play-location', R(r'(play|played) (me|it|this|that unit|them)? ?(to|at) (any|an open|an enemy|a|that|the) battlefield|can be played to|play me only to|to any battlefield')),
    ('base-ref', R(r'\bbase\b')),
    # control / scoring
    ('battlefield-control-ref', R(r'battlefields? you control|battlefield you (don\'t )?control|control (\w+ ){0,3}battlefields?|uncontrolled|open battlefield|enemy battlefield|battlefields? (an opponent|your opponents?) controls?')),
    ('conquer', R(r'\bconquer')),
    ('hold', R(r'\bhold(s|ing)?\b|\bheld\b')),
    ('score-points', R(r'\bscores? \d+ points?|gains? \d+ points?|\byou score\b|score a point|\bpoints?\b')),
    ('score-ref', R(r'\bscor(e|es|ed|ing)\b')),
    ('victory-score', R(r'victory score')),
    ('win-game', R(r'win the game|wins the game|lose the game')),
    ('extra-turn', R(r'take a turn after|extra turn|another turn|additional turn')),
    # states
    ('buff', R(r'\[buff\]|\bbuff(s|ed)?\b')),
    ('buff-spend', R(r'spend (a|its|my|their|any number of|\d+|one|that|your|x)? ?(of )?(its |my |their )?buffs?|spent a buff|spending')),
    ('stun', R(r'\[stun\]|\bstun(s|ned)?\b')),
    ('untargetable', R(r"can't be chosen")),
    ('choose-trigger', R(r'when (you|an opponent|a player) chooses?|when i(\'m| am) chosen|chosen by')),
    # removal words
    ('kill', R(r'\bkill(s|ed)?\b')),
    ('kill-own', R(r'\bkill (an? |another |\d+ |any number of |up to \w+ |two |one )?(other )?(of your |friendly )(units?|gear)|kill this|kill me\b|sacrifice')),
    ('dies-trigger', R(r'\bdies?\b|\bdied\b|would die')),
    ('banish', R(r'\bbanish')),
    ('recycle', R(r'\brecycl')),
    ('trash-ref', R(r'\btrash(es)?\b')),
    ('discard', R(r'\bdiscard')),
    ('burn', R(r'\[burn( \d+)?\]|\bburn(s|ed)?\b(?! out)')),
    ('burn-out', R(r'burn(s|ed)? out')),
    ('play-from-trash', R(r'play[^.\n]*from (your|their|a|any|an opponent\'s|its owner\'s)[^.\n]*trash|from your trash[^.\n]*play|\[flow\]')),
    ('return-from-trash', R(r'return[^.\n]*from (your|a|any|their) trash|from your trash (to|into) your hand|draw[^.\n]*from your trash')),
    ('play-from-deck-or-banish', R(r'play[^.\n]*from (among them|your main deck|the top|banishment)|you may play (that card|it|them|those cards)\b|play it\b')),
    # hidden information / facedown
    ('facedown', R(r'face ?down|\bhide\b|\bhides\b|\bhidden\b')),
    ('reveal', R(r'\breveal')),
    ('look-top', R(r'look at the top|top (\d+ )?cards? of (your|their|a|any) (main )?deck')),
    ('predict', R(r'\[predict( \d+)?\]|\bpredict')),
    ('draw', R(r'\bdraws?\b')),
    # objects
    ('token', R(r'\btokens?\b')),
    ('token-unit', R(r'unit tokens?\b')),
    ('token-recruit', R(r'\brecruit\b')), ('token-sprite', R(r'\bsprite\b')), ('token-sand-soldier', R(r'sand soldier')),
    ('token-mech', R(r'mech (unit )?token')), ('token-reflection', R(r'\breflection\b')), ('token-bird', R(r'\bbird (unit )?token')),
    ('token-tentacle', R(r'\btentacle')), ('token-shadow-clone', R(r'shadow clone')), ('token-bomb', R(r'\bbombs?\b')),
    ('token-brush', R(r'\bbrush\b')), ('token-baron-pit', R(r'baron pit')),
    ('gear-ref', R(r'\bgear\b')),
    ('equipment-ref', R(r'\bequipment\b')),
    ('attach', R(r'\battach(es|ed|ing)?\b|\bdetach|\bequipped\b|\bequips?\b(?!ment)')),
    ('copy', R(r'\bcop(y|ies|ied)\b')),
    ('take-control', R(r'(take|gain|gains|takes) control of')),
    ('xp', R(r'\bxp\b')),
    ('xp-spend', R(r'(spend|pay|spends) (\d+|x|any amount of|all (of )?your) xp')),
    ('xp-gain', R(r'gains? (\d+|x|that much) xp|\[hunt')),
    ('legend-ref', R(r'\blegends?\b')),
    ('champion-ref', R(r'\bchampions?\b')),
    ('spell-matters', R(r'when you play a spell|whenever you play a spell|spells you play|your spells|next spell|for each spell|spell (from|in) your trash')),
    ('once-each-turn', R(r'once each turn|only once (a|each|per) turn|first time')),
    ('replacement-would', R(r'\bwould\b[^.]*\binstead\b')),
    ('neutral', R(r'\bneutral\b')),
    ('pick', R(r'\bpick(s|ed)?\b')),
    ('ally-ref', R(r'\ball(y|ies)\b|teammate')),
    ('each-opponent', R(r'each opponent|\bopponents\b|each other player')),
    ('each-player', R(r'each player|all players|any player')),
    ('an-opponent', R(r'\ban opponent\b|choose an opponent|that opponent')),
    ('friendly-ref', R(r'\bfriendly\b')),
    ('here-ref', R(r'\bhere\b')),
    ('activated-ability', R(r'(^|\n|"|— ?|\[>\] ?)[^.\n"]{0,60}?(\[[^\]]+\]|\b(kill this|discard \d+|spend \d+ xp|recycle [^:]{0,30}|disempower (me|this)|exhaust [^:]{0,20}))\s*:(?!\s*$)')),
    ('trigger-play', R(r'when you play (me|this)\b')),
    ('becomes-unit', R(r'becomes? an? [^.]*\bunit\b|is also a unit|are also units')),
])
def classify_ref(kw, t):
    """How a card that does not own the keyword uses it: 'self' (conditional own), 'filter' (looks for it), 'grant' (gives it)."""
    k = r'\[%s( \d+)?\]' % re.escape(kw)
    if re.search(r'\b(i|i\'m|me|this|it)\b[^.\n]*\b(have|has|gain|gains|get|gets)\b[^.\n]*' + k, t, re.I) and not re.search(r'(give|gives|friendly|other|your|units? here)[^.\n]*' + k, t, re.I): return 'self'
    if re.search(r'(with|without|ignore|ignores|each|a|an|your|friendly|enemy|of|play|hide|opponents can only) ' + k + r'|' + k + r' (costs?|effects?|abilit|units?|cards?|gear|spells?|equal)|' + r'%ss?\b[^.\n]*(don\'t|doesn\'t) trigger' % re.escape(kw), t, re.I): return 'filter'
    return 'grant'
def load():
    cards = json.load(open(os.path.join(HERE, 'pool.json')))['cards']
    for c in cards:
        c['t'] = strip(c['text']); c['token'] = 'token' in c['superTypes']; c['rune'] = c['type'] == 'rune'
        c['main'] = c['type'] in ('unit', 'spell', 'gear') and not c['token']
    return cards
def bucket(c):
    return 'token' if c['token'] else c['type']
def summarize(cs):
    cs = [c for c in cs if not c['token'] and not c['rune']]
    by = collections.Counter(bucket(c) for c in cs)
    return {'total': len(cs), 'main': sum(by[k] for k in ('unit', 'spell', 'gear')), 'unit': by['unit'], 'spell': by['spell'], 'gear': by['gear'],
            'legend': by['legend'], 'battlefield': by['battlefield'], 'bySet': dict(collections.Counter(c['firstSet'] for c in cs)),
            'names': sorted(c['name'] for c in cs)}
def run():
    cards = load(); out = {'pool': {}, 'keywords': {}, 'systems': {}}
    live = [c for c in cards if not c['token'] and not c['rune']]
    out['pool'] = {'names': len(cards), 'tokens': sum(c['token'] for c in cards), 'runes': sum(c['rune'] for c in cards), 'counted': len(live),
                   'byType': dict(collections.Counter(c['type'] for c in live)), 'byFirstSet': dict(collections.Counter(c['firstSet'] for c in live)),
                   'main': sum(c['main'] for c in cards), 'errataApplied': sorted(c['name'] for c in cards if c['errata'] and c['errata'].get('applied', True)),
                   'typeFixed': sorted('%s %s' % (c['code'], c['typeFixed']) for c in cards if c.get('typeFixed')),
                   'energy': {str(k): v for k, v in sorted(collections.Counter(c['energy'] for c in cards if c['main']).items(), key=lambda kv: (kv[0] is None, kv[0] or 0))},
                   'power': {str(k): v for k, v in sorted(collections.Counter(c['power'] or 0 for c in cards if c['main']).items())},
                   'units': sum(c['type'] == 'unit' and c['main'] for c in cards), 'spells': sum(c['type'] == 'spell' and c['main'] for c in cards), 'gear': sum(c['type'] == 'gear' and c['main'] for c in cards),
                   'mightyUnits': sum(c['type'] == 'unit' and c['main'] and (c['might'] or 0) >= 5 for c in cards),
                   'equipmentTag': sum(c['type'] == 'gear' and c['main'] and 'Equipment' in c['tags'] for c in cards),
                   'spellAction': sum(c['type'] == 'spell' and c['main'] and bool(kw_has('Action').search(c['t'])) and not kw_has('Reaction').search(c['t']) for c in cards),
                   'spellReaction': sum(c['type'] == 'spell' and c['main'] and bool(kw_has('Reaction').search(c['t'])) for c in cards),
                   'spellSlow': sum(c['type'] == 'spell' and c['main'] and not kw_has('Reaction').search(c['t']) and not kw_has('Action').search(c['t']) for c in cards),
                   'powerCards': sum(c['main'] and (c['power'] or 0) > 0 for c in cards),
                   'errataLog': sorted('%s [%s] %s' % (c['name'], c['errata']['source'], c['errata']['galleryStatus']) for c in cards if c['errata'])}
    for kid, kw, rule, valued in KEYWORDS:
        has = [c for c in cards if kw_has(kw).search(c['t'])]
        anyc = [c for c in cards if kw_any(kw).search(c['t']) or (kid in ('equip',) and False)]
        hasn = {c['name'] for c in has}
        ref = [c for c in anyc if c['name'] not in hasn]
        vals = collections.Counter()
        for c in has:
            if c['token'] or c['rune']: continue
            for m in kw_has(kw).finditer(c['t']): vals[m.group(1).strip() if m.group(1) else '1 (no number)'] += 1
        rem = collections.Counter()
        for c in cards:
            for m in re.finditer(r'\[%s(?: \d+)?\](?: \[[^\]]+\])*(?:\[>\])? ?(\([^)]*\))' % re.escape(kw), c['printedText'], re.I): rem[m.group(1)] += 1
        first = min((SET_ORDER.index(c['firstSet']) for c in anyc if not c['token']), default=None)
        cls = collections.defaultdict(list)
        for c in ref:
            if not c['token'] and not c['rune']: cls[classify_ref(kw, c['t'])].append(c['name'])
        out['keywords'][kid] = {'keyword': kw, 'rule': rule, 'has': summarize(has), 'ref': summarize(ref), 'any': summarize(anyc), 'values': dict(vals), 'refClass': {k: sorted(v) for k, v in cls.items()},
                                'reminders': rem.most_common(6), 'firstSet': SET_ORDER[first] if first is not None else None,
                                'tokensWith': sorted(c['name'] for c in has if c['token'])}
    for sid, rx in SYSTEMS.items():
        m = [c for c in cards if rx.search(c['t'])]
        out['systems'][sid] = dict(summarize(m), regex=rx.pattern)
    os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
    json.dump(out, open(os.path.join(HERE, 'out', 'mechanics.json'), 'w'), ensure_ascii=False, indent=1)
    return cards, out
if __name__ == '__main__':
    cards, out = run()
    print(json.dumps({k: v for k, v in out['pool'].items() if k != 'errataApplied'}))
    print('%-14s %4s %4s %4s | u/s/g/L/B (any) | first | values' % ('keyword', 'has', 'ref', 'any'))
    for k, v in out['keywords'].items():
        a = v['any']; print('%-14s %4d %4d %4d | %d/%d/%d/%d/%d | %s | %s | tok=%s' % (k, v['has']['total'], v['ref']['total'], a['total'], a['unit'], a['spell'], a['gear'], a['legend'], a['battlefield'], v['firstSet'], v['values'], v['tokensWith']))
    for k, v in out['systems'].items(): print('%-26s %4d | %d/%d/%d/%d/%d' % (k, v['total'], v['unit'], v['spell'], v['gear'], v['legend'], v['battlefield']))
