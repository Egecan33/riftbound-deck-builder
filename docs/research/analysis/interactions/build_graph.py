#!/usr/bin/env python3
"""Prototype card-interaction graph for Riftbound (the local replacement for Commander Spellbook).

Deterministic, stdlib only. Inputs:
  - GameLab data/cards/cards.json (931 cards, September 2026)
  - engine-scripts.json  (GameLab engine CardScript per card, dumped by dump-scripts.mts)
  - data/rad-cards.json  (Radiance, text only, normalised from the official gallery by normalize_rad.py)
Outputs (in out/):
  facets.json      card -> produces / cares-about / is facets, each with the sentence it came from
  edges.json       directed enabler -> payoff edges with rule id, strength, reason
  structures.json  loops, cost cheats, engines, packages, nonbos
Run: python3 build_graph.py
"""
import json, math, os, re, sys
from collections import defaultdict, Counter
from itertools import combinations

HERE = os.path.dirname(os.path.abspath(__file__))
GAMELAB = os.environ.get('GAMELAB', os.path.expanduser('~/github_repositories/GameLab'))
OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)

# ----------------------------------------------------------------------------------------------- load
def load_pool():
    cards = json.load(open(os.path.join(GAMELAB, 'data/cards/cards.json')))['cards']
    scripts = json.load(open(os.path.join(HERE, 'engine-scripts.json')))
    pool = []
    for c in cards:
        pool.append(dict(code=c['cardCode'], gid=c['gameplayId'], name=c['name'], set=c['set'], type=c['type'],
                         superTypes=c['superTypes'], domains=c['domains'], tags=c['tags'], energy=c['energy'],
                         power=c['power'], might=c['might'], text=c['rulesText'] or '',
                         keywords=[k['name'] for k in c['keywords']], script=scripts.get(c['gameplayId'])))
    radp = os.path.join(HERE, 'data/rad-cards.json')
    if os.path.exists(radp):
        for c in json.load(open(radp))['cards']:
            c = dict(c); c['script'] = None; pool.append(c)
    return pool

TOKENS = {  # Core Rules 187.1-187.11 (GameLab data/rules/core-rules.md)
    'recruit': dict(name='Recruit', might=1, tags=['Recruit'], kind='unit', kw=[]),
    'sprite': dict(name='Sprite', might=3, tags=['Fae'], kind='unit', kw=['Temporary']),
    'sand soldier': dict(name='Sand Soldier', might=2, tags=['Shurima'], kind='unit', kw=[]),
    'mech': dict(name='Mech', might=3, tags=['Mech'], kind='unit', kw=[]),
    'gold': dict(name='Gold', might=None, tags=[], kind='gear', kw=[]),
    'reflection': dict(name='Reflection', might=0, tags=[], kind='unit', kw=[]),
    'bird': dict(name='Bird', might=1, tags=['Bird'], kind='unit', kw=['Deflect']),
    'tentacle': dict(name='Tentacle', might=1, tags=['Bilgewater'], kind='unit', kw=[]),
    'shadow clone': dict(name='Shadow Clone', might=0, tags=[], kind='unit', kw=[]),
}

# ------------------------------------------------------------------------------- vocabulary (facets)
# key -> (label, regex used both by the text-only extractor and to locate the sentence shown in reasons)
FR = 'friendly|your|you control|another|me\\b|it\\b|them\\b|a unit\\b|an? [a-z]+ unit you'
V = {
 # ---- PRODUCES
 'P.token':        ('creates unit tokens', r'play (?:an?|two|three|four|five|six|\d+|x|that many)\b[^.]*?\bunit tokens?'),
 'P.gold':         ('creates Gold / gear tokens', r'\bgold gear tokens?|play (?:an?|two|three|\d+)[^.]*gear token'),
 'P.buff':         ('puts buffs on friendly units', r'(?<!\[)\bbuff (?:an?\b|me\b|it\b|them\b|another|each|all|up to|two|three|your|\d|that|this|the|one|friendly|a friendly)|\bbuff\.|\bbuff,'),
 'P.might+':       ('raises Might of a friendly unit', r'\+\d+ \[might\]|\+x \[might\]|double (?:my|its|their) \[?might|might (?:becomes|to the might)'),
 'P.might-':       ('lowers Might of an enemy unit', r'-\d+ \[might\]|-x \[might\]'),
 'P.ready.unit':   ('readies a friendly unit', r'\bready (?!your runes|\d+ runes|a rune|two runes|your legend|.{0,12}gear)(?:an?\b|another|up to \w+|two|your|all|each|it\b|them\b|me\b|that|friendly|the|something)'),
 'P.ready.rune':   ('readies runes', r'\bready (?:your |\d+ |a |an |two |up to \w+ |that |those )?(?:exhausted )?runes?'),
 'P.ready.legend': ('readies your legend', r'\bready (?:your|a) legend|ready something'),
 'P.ready.gear':   ('readies gear', r'\bready (?:an? |your |a friendly |another )?(?:friendly )?(?:gear|equipment)|ready something'),
 'P.enterReady':   ('makes units enter ready', r'enters? ready'),
 'P.stun':         ('stuns enemy units', r'\bstun (?:an?\b|all|each|up to|it\b|them\b|another|enemy|that|the|two)|\[stun\]'),
 'P.move.friendly':('moves a friendly unit', r'\bmove (?:an?\b|another|up to \w+|any number of|your|all|two|it\b|them\b|that|a friendly|friendly)(?![^.]*enemy unit)|swap (?:the )?(?:places|locations)'),
 'P.move.self':    ('moves itself (Ganking or own move effect)', r'\[ganking\]|\bmove me\b|i may (?:be moved|move)'),
 'P.move.enemy':   ('moves an enemy unit', r'\bmove (?:an?|up to \w+|all|each|target)? ?enemy'),
 'P.recall':       ('recalls a friendly unit to base', r'\brecall\b|return (?:it|me|them|a friendly unit) to (?:its|my|your|their) (?:owner\'s )?base'),
 'P.draw':         ('draws cards', r'\bdraw (?:\d+|an?\b|x\b|that many|one|two|three)'),
 'P.discard.self': ('discards your own cards', r'(?<!opponent )(?<!they )(?<!player )\bdiscard (?:\d+|an?\b|your hand|x\b|one|two|that)(?! from (?:their|an opponent))'),
 'P.discard.enemy':('makes the opponent discard', r'(?:opponent|they|player) discards?|discard[^.]*from (?:their|an opponent\'s) hand'),
 'P.mill':         ('puts cards from your deck into your trash (Burn)', r'\[burn(?: \d+)?\]|\bburn \d+'),
 'P.recycle':      ('recycles cards from trash / board into the deck', r'\brecycle\b'),
 'P.kill.enemy':   ('kills enemy units or gear', r'\bkill (?!this\b|me\b|a friendly|another friendly|one of your|a unit you control)(?:an?\b|all|each|up to \w+|it\b|that|target|another|any number|two|them\b|the|enemy)'),
 'P.kill.friendly':('kills one of your own units (sacrifice outlet)', r'\bkill (?:a friendly|another friendly|one of your|a unit you control|any number of friendly|your)|kill (?:it|them) at|sacrifice'),
 'P.selfkill':     ('kills itself as a cost or effect', r'\bkill (?:this|me)\b'),
 'P.damage':       ('deals damage to units', r'\bdeals? (?:\d+|x|damage equal|its might|my might|that much)|damage equal to'),
 'P.channel':      ('channels extra runes', r'\bchannel (?:\d+|an?|x|one|two)\b'),
 'P.add':          ('adds Energy or Power', r'\[add\]'),
 'P.reanimate':    ('plays cards from your trash', r'play [^.]{0,60}from (?:your|a|any|their) trash|\[flow\]'),
 'P.regrowth':     ('returns cards from trash to hand', r'return [^.]{0,60}from (?:your )?trash to (?:your|its owner\'s) hand|put [^.]{0,40}from your trash into your hand'),
 'P.bounce.friendly':('returns a friendly unit/gear to hand', r'return (?:an?\b|another|me\b|it\b|this|up to \w+)?[^.]{0,30}(?:friendly|me\b|this\b|you control)[^.]{0,30}to (?:its|my|their) owner\'s hand|return (?:me|this) to (?:my|its) owner\'s hand|return a unit[^.]{0,20}to its owner\'s hand'),
 'P.bounce.enemy': ('returns enemy permanents to hand', r'return (?:an?|up to \w+|all|each|target)? ?(?:enemy|unit\b|gear\b|unit or gear)[^.]{0,40}to (?:its|their) owner\'s hand'),
 'P.attach':       ('attaches Equipment', r'\battach\b|\[equip\]|\bequip (?:it|an?|this)'),
 'P.point':        ('scores points directly', r'\bscore (?:\d+|an?|one) points?|gain (?:\d+|an?) points?|you score 1'),
 'P.xp':           ('gains XP', r'gain (?:\d+|x) xp|\[hunt(?: \d+)?\]'),
 'P.empower':      ('empowers other things', r'\bempower (?:an?\b|another|it\b|your|something|up to|that|them)'),
 'P.banish':       ('banishes cards', r'\bbanish (?!this\b|me\b)'),
 'P.counter':      ('counters spells', r'\bcounter (?:an?|that|target|it)\b'),
 'P.topdeck':      ('controls the top of the deck', r'\[predict(?: \d+)?\]|look at the top|\[vision\]'),
 'P.costReduce':   ('reduces costs', r'costs? (?:\[?\d+\]?|\[[a-z]+\]) (?:energy )?less|reduce (?:its|the|my) cost|cost[s]? \[\d+\] less'),
 'P.cheat':        ('plays cards without paying their cost', r'ignoring (?:its|their) (?:energy )?cost|without paying|for free|play it\b|play them\b|play (?:an?|that) [^.]{0,50}from (?:your hand|the top|among|your deck)|you may play that card'),
 'P.extraTurn':    ('takes an extra turn', r'take a turn after this one|extra turn'),
 'P.grantkw':      ('grants a keyword', r'(?:give|gives|have|has|gain|gains)\b[^.]{0,60}\[(assault|shield|tank|deflect|ganking|temporary|accelerate|hidden|backline|vision|ambush)'),
 'P.targetsFriendly':('targets a friendly unit', r'(?:choose|give|buff|ready|move|heal) (?:an?|another|up to \w+)? ?(?:friendly unit|unit you control)|give a unit\b|choose a unit\b|ready a unit\b|buff a unit'),
 # ---- CARES ABOUT / TRIGGERS ON
 'C.conquer':      ('triggers when you conquer', r'when (?:you|i) conquer|when you conquer or hold|when you score'),
 'C.hold':         ('triggers when you hold', r'when (?:you|i) hold|conquer or hold|when you score'),
 'C.selfDeath':    ('has a Deathknell / dies-trigger of its own', r'\[deathknell\]|when i die'),
 'C.friendlyDeath':('triggers when friendly units die', r'when (?:an?|another|one of your) (?:other )?(?:friendly )?units? (?:you control )?dies|when (?:a|another) friendly unit dies|friendly units? (?:die|died)|if a (?:friendly )?unit (?:has )?died this turn'),
 'C.spellCast':    ('triggers when you play a spell', r'when(?:ever)? you play (?:an?|your \w+) spell|each time you play a spell|spells? you(?:\'ve| have) played this turn|if you(?:\'ve| have) played a spell'),
 'C.unitCast':     ('triggers when you play a unit', r'when(?:ever)? you play (?:an?|another) (?:\[?[a-z]+\]? )?unit'),
 'C.gearCast':     ('triggers when you play gear', r'when(?:ever)? you play (?:an?|another) (?:gear|equipment)|if you(?:\'ve| have) played (?:an? )?(?:gear|equipment)'),
 'C.cardCast':     ('triggers when you play any card', r'when(?:ever)? you play (?:an?|another|your \w+) card'),
 'C.buffed':       ('needs buffed units / spends buffs', r'\bbuffed\b|spend (?:an?|my|its|their|one|any number of)(?: of)? ?(?:its |my )?buffs?|has a buff|buffs? on me|when you buff'),
 'C.mighty':       ('cares about Mighty (5+ Might) units', r'\[mighty\]|\bmighty\b|might (?:is|becomes) \d+ or more|with \d+ or more \[?might'),
 'C.gear':         ('counts or watches gear / Equipment', r'for each (?:other )?(?:friendly )?(?:gear|equipment)|(?:gear|equipment) you control|each equipment|equipment attached|while (?:i\'m |i am )?equipped|when (?:i\'m|i am) equipped|when you attach|\[weaponmaster\]|\[quick-draw\]|an equipment|your equipment|with (?:an )?equipment|a gear\b'),
 'C.discard':      ('triggers when you discard', r'when(?:ever)? you discard|if you(?:\'ve| have) discarded'),
 'C.selfDiscarded':('wants to be discarded', r'when (?:you discard me|i\'m discarded|i am discarded|this is discarded|you discard this)'),
 'C.xp':           ('spends or checks XP', r'\[level(?: \d+)?\]|spend (?:\d+|x) xp|\bxp\b'),
 'C.empowered':    ('needs to be Empowered', r'\[empowered\]|while (?:i\'m|i am) empowered|when (?:i|this) become[s]? \[?empowered'),
 'C.stun':         ('rewards stunning', r'when you stun|\bstunned\b'),
 'C.readyEvent':   ('triggers on readying', r'when (?:i|this|a friendly unit|one of your units) (?:become|becomes) ready|when you ready|when i\'m readied|when i ready'),
 'C.selfMove':     ('triggers when it moves', r'when i move|when i\'m moved|time i move|if i(?:\'ve| have) moved'),
 'C.moveEvent':    ('triggers when units move', r'when (?:an?|another) (?:friendly |enemy )?unit moves|when you move|moves? (?:to|from) (?:here|my location)'),
 'C.trash':        ('uses your trash as a resource', r'cards? in your trash|from your trash|\[flow\]|in (?:your|a) trash'),
 'C.tokens':       ('cares about tokens', r'(?:for each|each|every|your|a|another|friendly) (?:\w+ )?tokens?\b(?! at| to| here| ready)|tokens? you control|token units'),
 'C.replay':       ('has a when-played effect', r'when you play (?:me|this)\b'),
 'C.attackTrigger':('triggers when it attacks', r'when i attack|when i attack or defend'),
 'C.targeted':     ('triggers when you choose it / a friendly unit', r'when you choose (?:me|a friendly unit|this)|chosen (?:by|with) (?:a|your) spell'),
 'C.enemyDeath':   ('triggers when enemy units die', r'when you kill|when an enemy unit dies|when (?:one or more )?enemy units die|for each (?:enemy )?unit (?:this kills|killed)'),
 'C.multiPlay':    ('rewards playing several cards in a turn', r'\[legion\]|played another card this turn|cards? you(?:\'ve| have) played this turn|second card|third card'),
 'C.hidden':       ('cares about Hidden / facedown cards', r'\[hidden\]|facedown|face-down|from hidden|when you hide'),
 'C.alone':        ('wants to be the only unit', r'\balone\b|only unit|no other (?:friendly )?units'),
 'C.wide':         ('counts your units', r'for each (?:other )?(?:friendly )?unit|each (?:other )?unit you control|other friendly units? here|\d+ or more (?:friendly )?units'),
 'C.runes':        ('counts runes', r'for each rune|runes? you control|\d+ or more runes'),
 'C.draw':         ('triggers when you draw', r'when(?:ever)? you draw'),
 'C.recycleEvent': ('triggers when you recycle', r'when(?:ever)? you recycle'),
 'C.abilityUse':   ('triggers when you use abilities', r'when you (?:use|activate|play) (?:an?|a gear) ability|ability of a gear'),
 'C.banish':       ('triggers when you banish', r'when(?:ever)? you banish'),
 'C.excess':       ('rewards excess combat damage', r'excess damage'),
 'C.bigEnergy':    ('is an Energy sink', r'\[repeat\]|pay any amount|\bx\b'),
 'C.exhaustAbility':('has an [Exhaust] ability (wants to be readied)', r'\[exhaust\](?:,[^:]{0,40})?:|exhaust me(?:,| to|:)|\[exhaust\], '),
 'C.handSize':     ('wants a small or large hand', r'cards? in (?:your )?hand|no cards in hand|hand is empty'),
}

def sentences(text):
    t = re.sub(r'\([^()]*\)', '', text)  # reminder text never creates a facet
    out = []
    for line in t.split('\n'):
        for s in re.split(r'(?<=[.!])\s+', line.strip()):
            s = s.strip()
            if s: out.append(s)
    return out

RX = {k: re.compile(v[1], re.I) for k, v in V.items()}

def locate(card, key):
    """First rules sentence that matches the facet's regex; falls back to the whole (reminder-stripped) text."""
    base = key.split(':')[0]
    rx = RX.get(base)
    ss = card['_sent']
    if rx:
        for s in ss:
            if rx.search(s): return s
    return ' '.join(ss)[:160]

# ------------------------------------------------------------------------------------ text extractor
TAG_WORDS = None
def text_facets(card):
    f = {}
    for s in card['_sent']:
        low = s.lower()
        for k, rx in RX.items():
            if rx.search(low):
                f.setdefault(k, dict(src='text', sent=s, rep=None))
        m = re.search(r'\[(assault|shield|tank|deflect|ganking|temporary|accelerate|hidden|backline|vision|ambush)', low)
        if 'P.grantkw' in f and RX['P.grantkw'].search(low):
            mm = RX['P.grantkw'].search(low)
            f.setdefault('P.grantkw:' + mm.group(1).capitalize(), dict(src='text', sent=s, rep=None))
        for tag in TAG_WORDS:
            if tag in card['tags'] and card['type'] != 'legend':
                # a unit naming its own tag ("other Mechs") still cares; keep it
                pass
            if re.search(r'(?<![A-Za-z\'])' + re.escape(tag) + r's?(?![A-Za-z])', s) and not re.search(re.escape(tag) + r' (?:unit )?token', s):
                f.setdefault('C.tag:' + tag, dict(src='text', sent=s, rep=None))
        for m in re.finditer(r'play (?:an?|two|three|four|five|six|\d+|x|that many)\b[^.]*?(recruit|sprite|sand soldier|mech|reflection|bird|tentacle|shadow clone) unit tokens?', low):
            f.setdefault('P.token:' + m.group(1), dict(src='text', sent=s, rep=None))
    return f

# ---------------------------------------------------------------------------------- engine extractor
TRIG = {
 'play': 'C.replay', 'attack': 'C.attackTrigger', 'move': 'C.selfMove', 'moveToBattlefield': 'C.selfMove', 'moveFromBattlefield': 'C.selfMove',
 'conquer': 'C.conquer', 'youConquer': 'C.conquer', 'score': 'C.conquer|C.hold', 'youScore': 'C.conquer|C.hold', 'hold': 'C.hold', 'youHold': 'C.hold',
 'die': 'C.selfDeath', 'friendlyUnitDies': 'C.friendlyDeath', 'youPlaySpell': 'C.spellCast', 'youPlayUnit': 'C.unitCast', 'youPlayGear': 'C.gearCast',
 'youPlayCard': 'C.cardCast', 'youDiscard': 'C.discard', 'discarded': 'C.selfDiscarded', 'youDraw': 'C.draw', 'youStun': 'C.stun',
 'youKillUnit': 'C.enemyDeath', 'youKillUnitWithSpell': 'C.enemyDeath', 'enemyUnitDies': 'C.enemyDeath', 'enemyUnitsDie': 'C.enemyDeath',
 'youBuff': 'C.buffed', 'youBuffSelf': 'C.buffed', 'youSpendBuff': 'C.buffed', 'chosenByYou': 'C.targeted', 'chosenByYourSpell': 'C.targeted',
 'youChooseFriendlyUnit': 'C.targeted', 'readiedByYou': 'C.readyEvent', 'youReady': 'C.readyEvent', 'becomesReady': 'C.readyEvent',
 'youBanish': 'C.banish', 'youBanishOwnCard': 'C.banish', 'unitMovesAway': 'C.moveEvent', 'unitMovesHere': 'C.moveEvent', 'youMoveUnit': 'C.moveEvent',
 'becomesEmpowered': 'C.empowered', 'becomesMighty': 'C.mighty', 'friendlyUnitBecomesMighty': 'C.mighty', 'mightBecomesAtLeast': 'C.mighty',
 'youRecycle': 'C.recycleEvent', 'youRecycleRune': 'C.recycleEvent', 'youHide': 'C.hidden', 'youUseGearAbility': 'C.abilityUse', 'youPlayAbility': 'C.abilityUse',
 'equipped': 'C.gear', 'conquerHere': 'C.conquer', 'holdHere': 'C.hold', 'scoreHere': 'C.conquer|C.hold',
}
COND = {
 'empowered': 'C.empowered', 'controlsEmpowered': 'C.empowered', 'xpAtLeast': 'C.xp', 'selfBuffed': 'C.buffed', 'alone': 'C.alone',
 'playedAnotherCardThisTurn': 'C.multiPlay', 'nthCardPlayedThisTurn': 'C.multiPlay', 'nthCardResolvedThisTurn': 'C.multiPlay',
 'unitDiedThisTurn': 'C.friendlyDeath', 'discardedThisTurn': 'C.discard', 'movedThisTurn': 'C.selfMove', 'playedFromHidden': 'C.hidden',
 'eventFromHidden': 'C.hidden', 'controlsFacedown': 'C.hidden', 'excessDamage': 'C.excess', 'gearAbilityPlayedThisTurn': 'C.abilityUse',
 'handSize': 'C.handSize', 'targetStunned': 'C.stun', 'stunnedEnemyHere': 'C.stun', 'gainedXpThisTurn': 'C.xp',
}
PER = {
 'friendlyGear': 'C.gear', 'otherFriendlyGear': 'C.gear', 'friendlyEquipment': 'C.gear', 'gearAttachedToMe': 'C.gear', 'cardsInTrash': 'C.trash',
 'friendlyMightyUnits': 'C.mighty', 'buffedFriendlyUnitsHere': 'C.buffed', 'buffsOnMe': 'C.buffed', 'friendlyTokenUnits': 'C.tokens',
 'friendlyUnits': 'C.wide', 'otherFriendlyUnitsHere': 'C.wide', 'runesControlled': 'C.runes', 'cardsPlayedThisTurn': 'C.multiPlay',
 'highestFriendlyMight': 'C.mighty', 'otherFriendlyUnitsMight': 'C.wide',
}
FILT = {'buffed': 'C.buffed', 'empowered': 'C.empowered', 'token': 'C.tokens', 'equipped': 'C.gear', 'stunned': 'C.stun'}

def engine_facets(card):
    s = card['script']
    F = {}  # key -> dict(src, rep, ab, filt)
    def add(key, rep, ab, **kw):
        for k in key.split('|'):
            cur = F.get(k)
            d = dict(src='engine', rep=rep, ab=ab, **kw)
            if cur is None or (cur['rep'] == 'once' and rep != 'once'): F[k] = d
            F.setdefault(k + '@' + str(ab), d)  # ability-level copy, used by the loop detector
    def spec_of(to, targets):
        if to == 'self': return dict(kind='self', controller='friendly')
        for t in targets:
            if t.get('id') == to: return t
        return None
    def scan_filter(flt, controller, rep, ab):
        if not isinstance(flt, str): return
        for part in re.split(r'[,|]', flt):
            part = part.strip()
            if part in FILT and controller != 'enemy': add(FILT[part], rep, ab)
            if part.startswith('tag:') and controller != 'enemy':
                for t in part[4:].split('|'):
                    add('C.gear' if t == 'Equipment' else 'C.tag:' + t.capitalize() if t.islower() else 'C.gear' if t == 'Equipment' else 'C.tag:' + t, rep, ab)
            if part.startswith('mightMin:') and controller == 'friendly' and int(part[9:]) >= 5: add('C.mighty', rep, ab)
            if part.startswith('keyword:Hidden'): add('C.hidden', rep, ab)
    def conds(o, rep, ab):
        if isinstance(o, dict):
            c = o.get('c')
            if isinstance(c, str):
                if c in COND:
                    if not (c == 'handSize' and o.get('who') == 'opponent'): add(COND[c], rep, ab)
                if c == 'controlsTag': add('C.tag:' + str(o.get('tag')).capitalize() if str(o.get('tag')).islower() else 'C.tag:' + str(o.get('tag')), rep, ab)
                if c in ('count',) and isinstance(o.get('of'), str) and o.get('of') in PER: add(PER[o['of']], rep, ab)
                if c == 'playedThisTurn':
                    if o.get('type') == 'gear': add('C.gearCast', rep, ab)
                    elif o.get('type') == 'spell': add('C.spellCast', rep, ab)
                    else: add('C.multiPlay', rep, ab)
                if c in ('units', 'unitsHere') and o.get('controller') == 'friendly' and o.get('cmp') == 'atLeast' and o.get('n', 0) >= 3: add('C.wide', rep, ab)
                if c in ('targetMatches', 'eventMatches'): scan_filter(o.get('filter'), 'friendly' if c == 'targetMatches' and o.get('slot') == 'self' else 'any', rep, ab)
                if c.startswith('eventHasTag') or c == 'eventHasTag': add('C.tag:' + str(o.get('tag')), rep, ab)
            if o.get('src') == 'count' and isinstance(o.get('of'), str) and o['of'] in PER: add(PER[o['of']], rep, ab)
            if o.get('src') == 'count' and isinstance(o.get('of'), dict):
                of = o['of']
                if of.get('of') == 'friendlyUnitsWithKeyword': add('C.kw:' + of['keyword'], rep, ab)
                if of.get('of') == 'distinctTags':
                    for t in of['tags']: add('C.tag:' + t, rep, ab)
            if o.get('src') == 'xp': add('C.xp', rep, ab)
            per = o.get('per')
            if isinstance(per, str) and per in PER: add(PER[per], rep, ab)
            if isinstance(per, dict):
                if per.get('of') == 'friendlyUnitsWithKeyword': add('C.kw:' + per['keyword'], rep, ab)
                if per.get('of') == 'distinctTags':
                    for t in per['tags']: add('C.tag:' + t, rep, ab)
            for k, v in o.items():
                if k in ('effects', 'then', 'else', 'instead', 'modes'): continue
                conds(v, rep, ab)
        elif isinstance(o, list):
            for x in o: conds(x, rep, ab)
    def cost(c, rep, ab):
        if not isinstance(c, dict): return
        if c.get('discard'): add('P.discard.self', rep, ab)
        if c.get('recycleTrash'): add('C.trash', rep, ab); add('P.recycle', rep, ab)
        if c.get('spendBuffSelf'): add('C.buffed', rep, ab)
        if c.get('xp'): add('C.xp', rep, ab)
        if c.get('disempowerSelf'): add('C.empowered', rep, ab)
        if c.get('killSelf'): add('P.selfkill', rep, ab)
        if c.get('exhaustSelf'): add('C.exhaustAbility', rep, ab)
        ch = c.get('choose')
        if isinstance(ch, dict) and c.get('pay') == 'kill' and ch.get('controller') == 'friendly' and ch.get('kind') == 'unit':
            add('P.kill.friendly', rep, ab, filt=ch.get('filter'))
        if isinstance(ch, dict) and c.get('pay') in ('discard',): add('P.discard.self', rep, ab)
        if isinstance(ch, dict) and c.get('pay') in ('returnToHand',) and ch.get('controller') == 'friendly': add('P.bounce.friendly', rep, ab, filt=ch.get('filter'))
        if isinstance(ch, dict) and c.get('pay') == 'recycle': add('P.recycle', rep, ab)
        if isinstance(ch, dict) and c.get('pay') == 'spendBuff': add('C.buffed', rep, ab)
    def fx(effects, targets, rep, ab):
        for e in effects or []:
            if not isinstance(e, dict): continue
            op = e.get('op'); to = e.get('to')
            sp = spec_of(to, targets) if isinstance(to, str) else None
            ctrl = (sp or {}).get('controller', '?'); kind = (sp or {}).get('kind', '?'); flt = (sp or {}).get('filter')
            if sp and kind == 'unit' and ctrl == 'friendly' and op not in ('kill',): add('P.targetsFriendly', rep, ab)
            if sp: scan_filter(flt, ctrl, rep, ab)
            conds({k: v for k, v in e.items() if k not in ('effects', 'then', 'else', 'modes')}, rep, ab)
            if op == 'draw' and e.get('who', 'self') == 'self': add('P.draw', rep, ab)
            elif op == 'deal':
                if ctrl != 'friendly': add('P.damage', rep, ab)
            elif op == 'kill':
                if kind == 'self': add('P.selfkill', rep, ab)
                elif ctrl == 'friendly' and kind in ('unit', '?'): add('P.kill.friendly', rep, ab, filt=flt)
                elif ctrl in ('enemy', 'any'): add('P.kill.enemy', rep, ab)
                elif sp is None: add('P.kill.?', rep, ab)
            elif op == 'stun' and ctrl != 'friendly': add('P.stun', rep, ab)
            elif op in ('buffMight', 'doubleMight', 'setMight'):
                n = e.get('n'); neg = isinstance(n, (int, float)) and n < 0
                if neg: add('P.might-', rep, ab)
                elif ctrl != 'enemy': add('P.might+', rep, ab)
            elif op == 'buff' and ctrl != 'enemy': add('P.buff', rep, ab)
            elif op in ('spendBuff', 'spendBuffs'): add('C.buffed', rep, ab)
            elif op == 'ready':
                if kind == 'rune': add('P.ready.rune', rep, ab, amount=(sp or {}).get('count', 1))
                elif kind == 'legend': add('P.ready.legend', rep, ab)
                elif kind == 'gear': add('P.ready.gear', rep, ab)
                elif kind in ('something', 'legendUnitOrGear', 'any', 'cardOnBoard'):
                    for k in ('P.ready.unit', 'P.ready.legend', 'P.ready.gear'): add(k, rep, ab)
                elif kind == 'self': add('P.ready.self', rep, ab)
                elif ctrl != 'enemy': add('P.ready.unit', rep, ab)
            elif op in ('moveChoose', 'moveTo', 'moveHere', 'swapPlaces'):
                tos = [to] if isinstance(to, str) else []
                if op == 'swapPlaces': tos = [e.get('a'), e.get('b')]
                for t in tos:
                    s2 = spec_of(t, targets) or {}
                    c2 = s2.get('controller', '?'); k2 = s2.get('kind', '?')
                    if k2 == 'self': add('P.move.self', rep, ab)
                    elif c2 == 'enemy': add('P.move.enemy', rep, ab)
                    elif c2 in ('friendly',): add('P.move.friendly', rep, ab)
                    elif c2 == 'any': add('P.move.friendly', rep, ab); add('P.move.enemy', rep, ab)
                    else: add('P.move.?', rep, ab)
            elif op in ('recall', 'moveToBase'):
                if ctrl in ('friendly', 'any') or kind == 'self': add('P.recall', rep, ab)
                if op == 'moveToBase':
                    if ctrl in ('friendly', 'any'): add('P.move.friendly', rep, ab)
                    if ctrl in ('enemy', 'any'): add('P.move.enemy', rep, ab)
            elif op == 'returnToHand':
                if kind == 'cardInTrash': add('P.regrowth', rep, ab, filt=flt)
                elif kind == 'self': add('P.bounce.friendly', rep, ab, selfonly=True)
                elif ctrl == 'friendly': add('P.bounce.friendly', rep, ab, filt=flt, tkind=kind)
                elif ctrl == 'enemy': add('P.bounce.enemy', rep, ab)
                elif ctrl == 'any': add('P.bounce.enemy', rep, ab); add('P.bounce.friendly', rep, ab, filt=flt, tkind=kind)
                else: add('P.bounce.?', rep, ab)
            elif op == 'playFree':
                frm = e.get('from')
                if frm == 'trash' or kind == 'cardInTrash':
                    add('P.reanimate', rep, ab, filt=flt, selfonly=(to == 'self'))
                elif to != 'self': add('P.cheat', rep, ab, filt=flt)
            elif op == 'playLinkedBanished' or op == 'eachPlayerLookAtTopAndPlay': add('P.cheat', rep, ab)
            elif op == 'lookAtTop':
                if e.get('who', 'self') != 'opponent':
                    add('P.topdeck', rep, ab)
                    if e.get('take') == 'play': add('P.cheat', rep, ab, filt=e.get('filter'), discount=e.get('discountEnergy'))
                    if e.get('take') == 'hand' and not e.get('notADraw'): pass
            elif op == 'playToken':
                tk = TOKENS.get(str(e.get('token')).lower())
                if tk and tk['kind'] == 'gear': add('P.gold', rep, ab)
                elif e.get('who', 'self') != 'opponent':
                    add('P.token', rep, ab); add('P.token:' + str(e.get('token')).lower(), rep, ab)
            elif op in ('attach', 'equip'): add('P.attach', rep, ab)
            elif op == 'channel' and e.get('who', 'self') == 'self': add('P.channel', rep, ab)
            elif op == 'add': add('P.add', rep, ab, amount=sum(v for v in (e.get('energy'), e.get('power')) if isinstance(v, (int, float))) or 1)
            elif op == 'discard':
                add('P.discard.self' if e.get('who', 'self') == 'self' else 'P.discard.enemy', rep, ab)
            elif op == 'burn' and e.get('who', 'self') == 'self': add('P.mill', rep, ab)
            elif op == 'recycle':
                add('P.recycle', rep, ab, tkind=kind, selfonly=(to == 'self'))
            elif op == 'gainXp': add('P.xp', rep, ab)
            elif op == 'spendXp': add('C.xp', rep, ab)
            elif op == 'gainPoint' and e.get('who', 'self') == 'self': add('P.point', rep, ab)
            elif op == 'empower' and kind != 'self': add('P.empower', rep, ab)
            elif op == 'disempower': add('C.empowered', rep, ab)
            elif op == 'grantKeyword' and ctrl != 'enemy':
                add('P.grantkw', rep, ab); add('P.grantkw:' + str(e.get('keyword')), rep, ab, filt=flt)
            elif op in ('banish', 'banishFromTrash') and to != 'self': add('P.banish', rep, ab)
            elif op in ('counter', 'counterUnlessPay'): add('P.counter', rep, ab)
            elif op == 'extraTurn': add('P.extraTurn', rep, ab)
            elif op == 'modifyCost':
                en = e.get('energy', 0) or 0
                if e.get('free') or en < 0: add('P.costReduce', rep, ab, ctype=e.get('type'), amount=(99 if e.get('free') else -en), maxEnergy=e.get('maxEnergy'))
            elif op == 'payAny' and e.get('resource') == 'energy': add('C.bigEnergy', rep, ab)
            elif op == 'payAny' and e.get('resource') == 'xp': add('C.xp', rep, ab)
            elif op in ('mayCost',): cost(e.get('cost'), rep, ab)
            elif op == 'trigger' or op == 'delay':
                fx(e.get('effects'), (e.get('targets') or []) + targets, rep, ab)
                continue
            for sub in ('effects', 'then', 'else'):
                if isinstance(e.get(sub), list): fx(e[sub], targets, rep, ab)
            if op == 'chooseOne':
                for m in e.get('modes', []): fx(m.get('effects'), targets, rep, ab)
            if op == 'repeatForEach': fx(e.get('effects'), targets, rep, ab)
            if op == 'installReplacement':
                r = e.get('replacement') or {}
                fx(r.get('instead'), targets, rep, ab)
    ab = 0
    if s.get('spell'):
        fx(s['spell'].get('effects'), s['spell'].get('targets') or [], 'once', 'spell'); conds(s['spell'].get('targets'), 'once', 'spell')
    for c in s.get('additionalCosts') or []: cost(c, 'once', 'spell' if card['type'] == 'spell' else 'play')
    for a in s.get('abilities') or []:
        ab += 1; k = a.get('kind'); abid = f'a{ab}'
        if k == 'triggered':
            t = a.get('trigger'); rep = 'once' if t in ('play',) else ('turn' if a.get('oncePerTurn') else 'repeat')
            if t in TRIG: add(TRIG[t], rep, abid, trigger=t)
            cost(a.get('cost'), rep, abid); conds(a.get('condition'), rep, abid); conds(a.get('targets'), rep, abid)
            fx(a.get('effects'), a.get('targets') or [], rep, abid)
            for m in a.get('modes') or []: fx(m.get('effects'), (m.get('targets') or []) + (a.get('targets') or []), rep, abid)
        elif k == 'activated':
            c = a.get('cost') or {}
            rep = 'turn' if (c.get('exhaustSelf') or a.get('oncePerTurn')) else ('once' if (c.get('killSelf') or c.get('banishSelf')) else 'free')
            cost(c, rep, abid); conds(a.get('condition'), rep, abid); conds(a.get('targets'), rep, abid)
            F[f'_cost@{abid}'] = dict(src='engine', rep=rep, ab=abid, energy=c.get('energy', 0) or 0, power=(c.get('power', 0) or 0) + (c.get('anyPower', 0) or 0), exhaust=bool(c.get('exhaustSelf')), label=a.get('label'))
            if a.get('label') == 'Equip': add('P.attach', rep, abid); continue
            fx(a.get('effects'), a.get('targets') or [], rep, abid)
            for m in a.get('modes') or []: fx(m.get('effects'), (m.get('targets') or []) + (a.get('targets') or []), rep, abid)
        elif k == 'passive':
            conds(a.get('condition'), 'static', abid); conds(a.get('recipient'), 'static', abid); conds({'per': a.get('per')}, 'static', abid)
            if a.get('scope') == 'friendlyUnitsWithTag' and a.get('tag'): add('C.tag:' + a['tag'], 'static', abid)
            for t in a.get('anyTag') or []: add('C.tag:' + t, 'static', abid)
            if a.get('recipientHasKeyword'): add('C.kw:' + a['recipientHasKeyword'], 'static', abid)
            if a.get('scope') in ('friendlyUnits', 'friendlyUnitsHere', 'otherFriendlyUnitsHere', 'friendlyUnitsWithTag'):
                if (a.get('might') or 0) > 0: add('P.might+', 'static', abid)
                for kw in a.get('keywords') or []: add('P.grantkw', 'static', abid); add('P.grantkw:' + kw['name'], 'static', abid)
            if a.get('scope') == 'attachedUnit':
                for kw in a.get('keywords') or []: add('P.grantkw:' + kw['name'], 'static', abid)
            if a.get('gearBonus'): add('C.gear', 'static', abid)
        elif k == 'costMod':
            conds(a.get('condition'), 'static', abid)
            if a.get('who') == 'friendly' and ((a.get('energy') or 0) < 0 or (a.get('power') or 0) < 0) and a.get('applies') in (None, 'play'):
                add('P.costReduce', 'static', abid, ctype=a.get('type'), ctag=a.get('tag'), ckw=a.get('keyword'), amount=-(a.get('energy') or 0))
                if a.get('tag'): add('C.tag:' + a['tag'], 'static', abid)
        elif k == 'replacement':
            conds(a.get('condition'), 'repeat', abid); cost(a.get('cost'), 'repeat', abid)
            if a.get('event') == 'playTokenUnit': add('C.tokens', 'repeat', abid)
            if a.get('entersReady') and a.get('who') == 'friendly': add('P.enterReady', 'static', abid)
            scan_filter(a.get('filter'), a.get('who', 'any'), 'repeat', abid)
            fx(a.get('instead'), [], 'repeat', abid)
        elif k == 'triggerMod' and a.get('who') == 'friendly':
            t = a.get('trigger')
            if t in TRIG: add('P.double:' + TRIG[t].split('|')[0], 'static', abid)
        elif k == 'spellRepeat': add('C.spellCast', 'static', abid)
        elif k == 'playCostGrant' and a.get('tag'): add('C.tag:' + a['tag'], 'static', abid)
        else: conds(a.get('condition'), 'static', abid)
    for cm in s.get('costMods') or []:
        conds(cm.get('condition') if isinstance(cm, dict) else None, 'static', 'self')
    if s.get('empowerCost'): add('P.selfEmpower', 'turn', 'kw')
    if s.get('repeatCost') or s.get('repeatCosts'): add('C.bigEnergy', 'once', 'kw')
    if s.get('flowCost'): add('P.reanimate', 'repeat', 'kw', selfonly=True); add('C.trash', 'repeat', 'kw')
    if s.get('equipCost'): add('P.attach', 'turn', 'kw')
    if s.get('entersReady'): add('P.ready.self', 'once', 'kw')
    return F

KW_FACETS = {  # keyword on the card itself (cards.json keywords) -> facet
 'Deathknell': ('C.selfDeath', 'repeat'), 'Legion': ('C.multiPlay', 'once'), 'Hunt': ('P.xp', 'repeat'), 'Level': ('C.xp', 'static'),
 'Ganking': ('P.move.self', 'repeat'), 'Weaponmaster': ('C.gear', 'once'), 'Quick-Draw': ('C.gear', 'once'), 'Hidden': ('C.hidden', 'once'),
 'Repeat': ('C.bigEnergy', 'once'), 'Vision': ('P.topdeck', 'once'), 'Empowered': ('C.empowered', 'static'), 'Flow': ('C.trash', 'repeat'),
}

def build_facets(pool):
    global TAG_WORDS
    region = {'Ionia', 'Noxus', 'Bilgewater', 'Demacia', 'Shurima', 'Bandle City', 'Shadow Isles', 'Mount Targon', 'Freljord', 'Piltover', 'Zaun', 'Ixtal', 'The Void'}
    alltags = Counter(t for c in pool for t in c['tags'])
    TAG_WORDS = sorted(t for t in alltags if t != 'Equipment')
    agree = Counter()
    for c in pool:
        c['_sent'] = sentences(c['text'])
        tf = text_facets(c)
        # a card mentioning its own champion tag in its name line is not a tribal payoff; drop self-name-only tags for legends handled below
        if c['script'] is not None:
            ef = engine_facets(c)
            for k, (fk, rep) in KW_FACETS.items():
                if k in c['keywords'] and fk not in ef: ef[fk] = dict(src='keyword', rep=rep, ab='kw')
            # tag cares only seen by text (the engine hides them in manual scripts' filters): accept text tags as supplements
            for k, v in tf.items():
                if k.startswith('C.tag:') and k not in ef: ef[k] = dict(src='text', rep='static', ab='txt')
            base_e = {k for k in ef if '@' not in k and ':' not in k and not k.startswith('_')}
            base_t = {k for k in tf if ':' not in k}
            for k in V:
                agree[(k, k in base_e, k in base_t)] += 1
            c['facets'] = ef
        else:
            for k, v in tf.items(): v['rep'] = 'repeat' if re.search(r'^when|\[exhaust\]|whenever|each time', v['sent'], re.I) and not re.search(r'when you play (me|this)', v['sent'], re.I) else 'once'; v['ab'] = 'txt'
            for k, (fk, rep) in KW_FACETS.items():
                if k in c['keywords'] and fk not in tf: tf[fk] = dict(src='keyword', rep=rep, ab='kw')
            c['facets'] = tf
        # intrinsic facts used by rules
        c['is'] = set()
        c['is'].add('type:' + c['type'])
        for t in c['tags']: c['is'].add('tag:' + t)
        for k in c['keywords']: c['is'].add('kw:' + k)
        if c['type'] == 'unit' and (c['might'] or 0) >= 5: c['is'].add('mighty')
        if 'Equipment' in c['tags']: c['is'].add('equipment')
        if 'token' in c['superTypes']: c['is'].add('token')
        for k, v in c['facets'].items():
            if 'sent' not in v: v['sent'] = locate(c, k.split('@')[0])
    return agree

# ------------------------------------------------------------------------------------- legality gate
def legality(pool):
    legends = [c for c in pool if c['type'] == 'legend']
    pairs = {frozenset(l['domains']) for l in legends}
    def together(a, b):
        """Core Rules 103.1.b: a deck's Domain Identity is its Champion Legend's domains; 103.2.d: Signature cards need the legend's champion tag."""
        for x, y in ((a, b), (b, a)):
            if x['type'] == 'legend':
                if y['type'] == 'legend': return False
                if not set(y['domains']) <= set(x['domains']): return False
                if 'signature' in y['superTypes'] and not (set(y['tags']) & set(x['tags'])): return False
                return True
        need = set(a['domains']) | set(b['domains'])
        if not any(need <= p for p in pairs): return False
        sa = 'signature' in a['superTypes']; sb = 'signature' in b['superTypes']
        if sa or sb:
            ok = False
            for l in legends:
                if need <= set(l['domains']) and (not sa or set(a['tags']) & set(l['tags'])) and (not sb or set(b['tags']) & set(l['tags'])): ok = True; break
            if not ok: return False
        return True
    return together, legends

# ------------------------------------------------------------------------------------------- rules
MAIN = ('unit', 'spell', 'gear')
def filt_ok(flt, card):
    """Does `card` satisfy an engine target filter, judged by printed values (Core Rules 711 for non-board zones)? None = unknown."""
    if not flt: return None
    ok = True
    for part in flt.split(','):
        part = part.strip()
        if part.startswith('type:'): ok &= card['type'] in part[5:].split('|')
        elif part == 'spell': ok &= card['type'] == 'spell'
        elif part.startswith('mightMin:'): ok &= (card['might'] or 0) >= int(part[9:])
        elif part.startswith('mightMax:'): ok &= card['might'] is not None and card['might'] <= int(part[9:])
        elif part.startswith('costMax:'): ok &= (card['energy'] or 0) <= int(part[8:])
        elif part.startswith('powerMax:'): ok &= (card['power'] or 0) <= int(part[9:])
        elif part.startswith('tag:'): ok &= bool(set(part[4:].split('|')) & set(card['tags']))
        elif part.startswith('!keyword:'): ok &= part[9:] not in card['keywords']
        elif part.startswith('keyword:'): ok &= part[8:] in card['keywords']
        elif part.startswith('!tag:'): ok &= part[5:] not in card['tags']
    return ok

def has(c, k): return k in c['facets']
def fa(c, k): return c['facets'].get(k)

# Each rule: id, base weight, enabler test(card)->facet key or None, payoff test(card)->facet key or None, extra(a,b)->(ok, mult, note), template
def R(id, w, en, pay, why, extra=None, cls='specific'):
    return dict(id=id, w=w, en=en, pay=pay, why=why, extra=extra, cls=cls)

def P(*keys):
    def f(c):
        if c['type'] in ('battlefield',) and False: return None
        for k in keys:
            if k in c['facets']: return k
        return None
    return f
def IS(pred, key='is'):
    def f(c): return key if pred(c) else None
    return f

def x_death(a, b):
    f = a['facets'].get('P.kill.friendly') or {}
    if b['type'] != 'unit': return (False, 1, '')
    ok = filt_ok(f.get('filt'), b)
    if ok is False: return (False, 1, '')
    return (True, 1.2 if ok else 1.0, 'its printed stats satisfy the kill requirement' if ok else '')
def x_unit(a, b): return (b['type'] == 'unit', 1, '')
def x_bounce(a, b):
    f = a['facets'].get('P.bounce.friendly') or a['facets'].get('P.reanimate') or {}
    if f.get('selfonly'): return (False, 1, '')
    if b['type'] not in ('unit', 'gear'): return (False, 1, '')
    tk = f.get('tkind')
    if tk in ('unit', 'gear') and b['type'] != tk: return (False, 1, '')
    ok = filt_ok(f.get('filt'), b)
    if ok is False: return (False, 1, '')
    return (True, 1.15 if ok else 1, '')
def x_ready_unit(a, b): return (b['type'] == 'unit' and fa(b, 'C.exhaustAbility') is not None, 1, '')
def x_ready_legend(a, b): return (b['type'] == 'legend', 1.25, '')
def x_ready_gear(a, b): return (b['type'] == 'gear', 1, '')
def x_notself_emp(a, b): return (not has(b, 'P.selfEmpower') or True, 1, '')
def x_cheat(a, b):
    f = a['facets'].get('P.cheat') or a['facets'].get('P.costReduce') or {}
    if b['type'] not in MAIN or (b['energy'] or 0) < 5: return (False, 1, '')
    ct = f.get('ctype')
    if ct and b['type'] not in str(ct).split('|'): return (False, 1, '')
    if f.get('ctag') and f['ctag'] not in b['tags'] and f['ctag'].capitalize() not in b['tags']: return (False, 1, '')
    if f.get('ckw') and f['ckw'] not in b['keywords']: return (False, 1, '')
    if f.get('maxEnergy') is not None and (b['energy'] or 0) > f['maxEnergy']: return (False, 1, '')
    ok = filt_ok(f.get('filt'), b)
    if ok is False: return (False, 1, '')
    return (True, 1 + min(0.5, ((b['energy'] or 0) - 5) * 0.1), f"saves up to {b['energy']} Energy" )
def x_sink(a, b): return (b['type'] in MAIN and ((b['energy'] or 0) >= 7 or has(b, 'C.bigEnergy')), 1, '')
def x_mighty(a, b): return (True, 1, '')
def x_tag_factory(tag):
    return lambda a, b: (True, 1, '')

RULES = [
 R('sac->deathknell', 3.0, P('P.kill.friendly'), P('C.selfDeath'), 'kills its own unit on demand, which fires the Deathknell', x_death),
 R('sac->deathwatch', 2.6, P('P.kill.friendly', 'P.selfkill'), P('C.friendlyDeath'), 'makes a friendly unit die, which the watcher rewards'),
 R('temporary->deathwatch', 2.0, lambda c: 'P.grantkw:Temporary' if has(c, 'P.grantkw:Temporary') else ('is' if 'Temporary' in c['keywords'] and c['type'] == 'unit' else ('P.token:sprite' if has(c, 'P.token:sprite') else None)), P('C.friendlyDeath'), 'supplies a unit that dies on schedule ([Temporary]) for the death watcher'),
 R('temporary->deathknell', 2.2, P('P.grantkw:Temporary'), P('C.selfDeath'), 'can give the Deathknell unit [Temporary] so it dies at your next Beginning Phase', x_unit),
 R('token->deathwatch', 1.2, P('P.token'), P('C.friendlyDeath'), 'creates expendable unit tokens whose deaths the watcher counts'),
 R('token->sac', 1.6, P('P.token'), P('P.kill.friendly'), 'creates tokens to pay the "kill a friendly unit" cost', lambda a, b: (filt_ok((fa(b, 'P.kill.friendly') or {}).get('filt'), dict(type='unit', might=1, energy=0, power=0, tags=[], keywords=[])) is not False, 1, '')),
 R('token->tokenpayoff', 2.6, P('P.token'), P('C.tokens'), 'creates the tokens the payoff counts'),
 R('token->wide', 1.6, P('P.token'), P('C.wide'), 'adds bodies for a count-your-units payoff'),
 R('buff->buffpayoff', 2.8, P('P.buff'), P('C.buffed'), 'puts the buff counter that the payoff needs or spends'),
 R('might->mighty', 1.5, P('P.buff', 'P.might+'), P('C.mighty'), 'pushes a unit to 5+ Might for the Mighty payoff'),
 R('ready->exhaust-unit', 3.0, P('P.ready.unit'), P('C.exhaustAbility'), 'readies the unit so its [Exhaust] ability can be used again', x_ready_unit),
 R('ready->exhaust-legend', 3.0, P('P.ready.legend'), P('C.exhaustAbility'), 'readies the legend so its [Exhaust] ability can be used again', x_ready_legend),
 R('ready->exhaust-gear', 2.8, P('P.ready.gear'), P('C.exhaustAbility'), 'readies the gear so its [Exhaust] ability can be used again', x_ready_gear),
 R('ready->readytrigger', 2.8, P('P.ready.unit', 'P.ready.legend', 'P.ready.gear'), P('C.readyEvent'), 'readies a permanent, which is the event the payoff triggers on'),
 R('ready->attacker', 1.4, P('P.ready.unit'), P('C.attackTrigger'), 'readies the attacker so its attack trigger can happen a second time in a turn', x_unit),
 R('move->selfmove', 2.6, P('P.move.friendly'), P('C.selfMove'), 'moves the unit, which fires its when-I-move trigger', x_unit),
 R('move->movewatch', 2.6, P('P.move.friendly', 'P.move.self'), P('C.moveEvent'), 'produces the unit movement the watcher triggers on'),
 R('discard->discardpayoff', 3.0, P('P.discard.self'), P('C.discard', 'C.selfDiscarded'), 'discards from your own hand, which the payoff rewards'),
 R('trashfill->trash', 1.5, P('P.discard.self', 'P.mill'), P('C.trash'), 'fills your trash for a card that uses the trash'),
 R('replay->etb', 2.2, P('P.bounce.friendly'), P('C.replay'), 'returns the permanent to hand so its when-played effect happens again', x_bounce),
 R('reanimate->etb', 2.0, P('P.reanimate'), P('C.replay'), 'replays the card from the trash, repeating its when-played effect', x_bounce),
 R('gear->gearpayoff', 2.2, lambda c: 'is' if c['type'] == 'gear' else ('P.gold' if has(c, 'P.gold') else None), P('C.gear', 'C.gearCast'), 'is / makes a gear that the payoff counts or triggers on',
   lambda a, b: ((a['type'] == 'gear' and 'Equipment' in a['tags']) or not re.search(r'equipment|\[weaponmaster\]|\[quick-draw\]|equipped', (fa(b, 'C.gear') or fa(b, 'C.gearCast'))['sent'], re.I), 1, '')),
 R('xp->xppayoff', 2.6, P('P.xp'), P('C.xp'), 'gains the XP that the payoff checks or spends'),
 R('empower->empowered', 2.2, P('P.empower'), P('C.empowered'), 'empowers it without paying its own [Empower] cost'),
 R('stun->stunpayoff', 3.0, P('P.stun'), P('C.stun'), 'stuns, which the payoff rewards'),
 R('spell->spellpayoff', 1.0, IS(lambda c: c['type'] == 'spell'), P('C.spellCast'), 'is a spell to trigger the play-a-spell payoff', cls='class'),
 R('unit->unitpayoff', 0.8, IS(lambda c: c['type'] == 'unit'), P('C.unitCast'), 'is a unit to trigger the play-a-unit payoff', cls='class'),
 R('cheap->multiplay', 1.0, IS(lambda c: c['type'] in MAIN and (c['energy'] or 0) <= 1 and not (c['power'] or 0)), P('C.multiPlay'), 'costs 1 or less, so it is an easy extra card for the played-another-card condition', cls='class'),
 R('draw->drawpayoff', 2.6, P('P.draw'), P('C.draw'), 'draws cards, which the payoff triggers on'),
 R('cheat->expensive', 2.4, P('P.cheat'), IS(lambda c: True, 'cost'), 'puts it into play without paying its full cost', x_cheat),
 R('reduce->expensive', 1.6, P('P.costReduce'), IS(lambda c: True, 'cost'), 'makes it cheaper', x_cheat),
 R('ramp->sink', 1.2, P('P.channel', 'P.ready.rune', 'P.add'), IS(lambda c: True, 'cost'), 'produces extra Energy for an expensive or scalable card', x_sink, cls='class'),
 R('removal->killpayoff', 2.0, P('P.kill.enemy', 'P.damage'), P('C.enemyDeath'), 'kills enemy units, which the payoff triggers on'),
 R('recycle->recyclepayoff', 2.6, P('P.recycle'), P('C.recycleEvent'), 'recycles cards, which the payoff triggers on'),
 R('hidden->hiddenpayoff', 2.4, IS(lambda c: 'Hidden' in c['keywords']), lambda c: 'C.hidden' if has(c, 'C.hidden') and 'Hidden' not in c['keywords'] else None, 'is a [Hidden] card for the facedown payoff'),
 R('target->targeted', 2.6, lambda c: 'P.targetsFriendly' if has(c, 'P.targetsFriendly') and c['type'] in ('spell', 'gear', 'legend', 'unit') else None, P('C.targeted'), 'chooses a friendly unit, which is the trigger', x_unit),
 R('extraturn->hold', 2.2, P('P.extraTurn'), P('C.hold'), 'gives another Beginning Phase, so the hold trigger happens again'),
 R('gearability->abilitypayoff', 2.0, lambda c: 'C.exhaustAbility' if c['type'] == 'gear' and has(c, 'C.exhaustAbility') else ('P.gold' if has(c, 'P.gold') else None), P('C.abilityUse'), 'has a gear ability to activate for the payoff'),
 R('banish->banishpayoff', 2.4, P('P.banish'), P('C.banish'), 'banishes cards, which the payoff triggers on'),
 R('double->trigger', 2.4, lambda c: next((k for k in c['facets'] if k.startswith('P.double:')), None), lambda c: None, ''),  # expanded below
 R('equipment->unit-keyword', 0.0, lambda c: None, lambda c: None, ''),
]

def edge_strength(rule, nE, nP, a, b, fe, fp, mult):
    """nE = how many enablers this payoff has under the rule, nP = how many payoffs this enabler has under the rule.
    An edge between a narrow enabler and a narrow payoff keeps its full weight; 'any spell -> any spell payoff' is damped."""
    spec = 1.0 / (1.0 + max(0.0, math.log10(max(1, nE * nP) / 25.0)))
    spec = max(0.25, min(1.0, spec))
    rep = 1.0
    if fe and fe.get('rep') in ('repeat', 'turn', 'free', 'static'): rep *= 1.2
    if fp and fp.get('rep') in ('repeat', 'turn', 'free', 'static'): rep *= 1.2
    return round(rule['w'] * spec * rep * mult, 2), round(spec, 2)

def build_edges(pool, together):
    edges = []
    deckable = [c for c in pool if c['type'] in MAIN + ('legend', 'battlefield') and 'token' not in c['superTypes']]
    stats = {}
    for r in RULES:
        if r['id'] in ('double->trigger', 'equipment->unit-keyword'): continue
        E = [(c, r['en'](c)) for c in deckable]; E = [(c, k) for c, k in E if k]
        Pp = [(c, r['pay'](c)) for c in deckable]; Pp = [(c, k) for c, k in Pp if k]
        raw = []
        for a, ka in E:
            for b, kb in Pp:
                if a['code'] == b['code']: continue
                if not together(a, b): continue
                ok, mult, note = r['extra'](a, b) if r['extra'] else (True, 1, '')
                if not ok: continue
                raw.append((a, ka, b, kb, mult, note))
        nE = len({x[0]['code'] for x in raw}); nP = len({x[2]['code'] for x in raw})
        stats[r['id']] = dict(enablers=nE, payoffs=nP, edges=len(raw), cls=r['cls'])
        outdeg = Counter(x[0]['code'] for x in raw); indeg = Counter(x[2]['code'] for x in raw)
        for a, ka, b, kb, mult, note in raw:
            fe = a['facets'].get(ka) if ka in a['facets'] else None
            fp = b['facets'].get(kb) if kb in b['facets'] else None
            if a['type'] == 'legend' or b['type'] == 'legend': mult *= 1.25
            s, spec = edge_strength(r, indeg[b['code']], outdeg[a['code']], a, b, fe, fp, mult)
            sa = fe['sent'] if fe else locate(a, ka)
            sb = fp['sent'] if fp else ' '.join(b['_sent'])[:140]
            if kb == 'cost': sb = f"costs {b['energy']} Energy" + (f" + {b['power']} Power" if b['power'] else '')
            reason = f"{a['name']} ({a['code']}: \"{sa}\") {r['why']}: {b['name']} ({b['code']}: \"{sb}\")" + (f" [{note}]" if note else '')
            edges.append(dict(a=a['code'], b=b['code'], rule=r['id'], cls=r['cls'], s=s, spec=spec, fa=ka, fb=kb,
                              repA=(fe or {}).get('rep'), repB=(fp or {}).get('rep'), abA=(fe or {}).get('ab'), abB=(fp or {}).get('ab'), reason=reason))
    # tribal edges: unit with tag X / token maker of tag X -> card that cares about tag X
    tagcare = defaultdict(list)
    for c in deckable:
        for k in c['facets']:
            if k.startswith('C.tag:') and '@' not in k: tagcare[k[6:]].append(c)
    raw = []
    for tag, payoffs in tagcare.items():
        members = [c for c in deckable if tag in c['tags'] and c['type'] in MAIN]
        makers = [c for c in deckable if any(k.startswith('P.token:') and '@' not in k and tag in TOKENS.get(k[8:], {}).get('tags', []) for k in c['facets'])]
        for b in payoffs:
            for a in members + makers:
                if a['code'] == b['code'] or not together(a, b): continue
                # a legend / signature naming its own champion is deck-construction (103.2), not a tribal payoff
                raw.append((a, b, tag, a in makers and a not in members))
    by_tag = Counter(t for _, _, t, _ in raw)
    for a, b, tag, maker in raw:
        n = by_tag[tag]
        spec = max(0.25, min(1.0, 1.0 / (1.0 + max(0.0, math.log10(max(1, n) / 25.0)))))
        fp = b['facets']['C.tag:' + tag]
        mult = 1.25 if 'legend' in (a['type'], b['type']) else 1.0
        s = round(2.6 * spec * (1.2 if fp.get('rep') != 'once' else 1.0) * mult, 2)
        what = f"creates {tag} tokens" if maker else f"is a {tag}"
        edges.append(dict(a=a['code'], b=b['code'], rule='tribal:' + tag, cls='specific', s=s, spec=round(spec, 2), fa='tag:' + tag, fb='C.tag:' + tag,
                          repA='static', repB=fp.get('rep'), abA=None, abB=fp.get('ab'),
                          reason=f"{a['name']} ({a['code']}) {what}, which {b['name']} ({b['code']}: \"{fp['sent']}\") names"))
    stats['tribal'] = dict(enablers=len({x[0]['code'] for x in raw}), payoffs=len({x[1]['code'] for x in raw}), edges=len(raw), cls='specific')
    # keyword-holder edges: unit with keyword K / granter of K -> card that counts units with K
    for c in deckable:
        for k in list(c['facets']):
            if k.startswith('C.kw:') and '@' not in k:
                K = k[5:]
                for a in deckable:
                    if a['code'] == c['code'] or not together(a, c): continue
                    src = None
                    if K in a['keywords'] and a['type'] == 'unit': src = f"has [{K}]"
                    elif has(a, 'P.grantkw:' + K): src = f"grants [{K}] (\"{fa(a, 'P.grantkw:' + K)['sent']}\")"
                    elif K == 'Temporary' and has(a, 'P.token:sprite'): src = 'creates Sprite tokens with [Temporary]'
                    if src:
                        edges.append(dict(a=a['code'], b=c['code'], rule='keyword:' + K, cls='specific', s=2.6, spec=1.0, fa='kw:' + K, fb=k, repA='static', repB=c['facets'][k].get('rep'), abA=None, abB=c['facets'][k].get('ab'),
                                          reason=f"{a['name']} ({a['code']}) {src}, which {c['name']} ({c['code']}: \"{c['facets'][k]['sent']}\") counts"))
    # trigger doublers: "your X triggers happen an additional time" -> cards with that trigger
    for a in deckable:
        for k in list(a['facets']):
            if k.startswith('P.double:') and '@' not in k:
                ck = k[9:]
                for b in deckable:
                    if b['code'] != a['code'] and has(b, ck) and together(a, b) and b['type'] in ('unit', 'gear', 'legend'):
                        edges.append(dict(a=a['code'], b=b['code'], rule='double->trigger', cls='specific', s=2.4, spec=1.0, fa=k, fb=ck, repA='static', repB=fa(b, ck).get('rep'), abA=None, abB=fa(b, ck).get('ab'),
                                          reason=f"{a['name']} ({a['code']}: \"{' '.join(a['_sent'])[:140]}\") makes this trigger happen an additional time: {b['name']} ({b['code']}: \"{fa(b, ck)['sent']}\")"))
    return edges, stats

# ---------------------------------------------------------------------------------------- nonbos
def build_nonbos(pool, together):
    out = []
    deckable = [c for c in pool if c['type'] in MAIN + ('legend',) and 'token' not in c['superTypes']]
    def pairs(A, B, id, w, why):
        for a in A:
            for b in B:
                if a['code'] != b['code'] and together(a, b):
                    out.append(dict(a=a['code'], b=b['code'], rule=id, s=-w, reason=why(a, b)))
    alone = [c for c in deckable if has(c, 'C.alone')]
    tok = [c for c in deckable if has(c, 'P.token')]
    pairs(tok, alone, 'nonbo:wide-vs-alone', 2.0, lambda a, b: f"{a['name']} ({a['code']}: \"{fa(a,'P.token')['sent']}\") adds units, but {b['name']} ({b['code']}: \"{fa(b,'C.alone')['sent']}\") wants to be alone")
    eaters = [c for c in deckable if c['script'] and re.search(r'banish[^.]*from (?:your|all|each) trash|banish (?:your|all) trash|recycle (?:your|all|\d+ cards from your) trash', c['text'], re.I)]
    trash = [c for c in deckable if has(c, 'C.trash') and c not in eaters]
    pairs(eaters, trash, 'nonbo:trash-contention', 1.5, lambda a, b: f"{a['name']} ({a['code']}: \"{locate(a,'P.banish')}\") removes cards from your trash that {b['name']} ({b['code']}: \"{fa(b,'C.trash')['sent']}\") also needs")
    dumpers = [c for c in deckable if re.search(r'discard your hand|discard (?:2|two|3|three)', c['text'], re.I)]
    hand = [c for c in deckable if has(c, 'C.handSize') and re.search(r'(\d+|four|five|six) or more cards in (your )?hand|for each card in your hand', c['text'], re.I)]
    pairs(dumpers, hand, 'nonbo:discard-vs-handsize', 1.5, lambda a, b: f"{a['name']} ({a['code']}: \"{locate(a,'P.discard.self')}\") empties the hand that {b['name']} ({b['code']}: \"{fa(b,'C.handSize')['sent']}\") counts")
    sweep = [c for c in deckable if re.search(r'(?:kill|deal \d+ to|deals? \d+ to) (?:all|each) units?\b(?! an opponent| enemy)', c['text'], re.I) and not re.search(r'(?:all|each) enemy', c['text'], re.I)]
    wide = [c for c in deckable if has(c, 'P.token') or has(c, 'C.wide')]
    pairs(sweep, wide, 'nonbo:sweeper-vs-wide', 1.5, lambda a, b: f"{a['name']} ({a['code']}: \"{' '.join(a['_sent'])[:120]}\") hits your own board too, which punishes {b['name']} ({b['code']})'s go-wide plan")
    bounce = [c for c in deckable if has(c, 'P.bounce.friendly') and not (fa(c, 'P.bounce.friendly') or {}).get('selfonly')]
    buffp = [c for c in deckable if has(c, 'P.buff') and c['type'] != 'unit']
    pairs(bounce, buffp, 'nonbo:bounce-loses-buffs', 0.8, lambda a, b: f"{a['name']} ({a['code']}: \"{fa(a,'P.bounce.friendly')['sent']}\") returns a unit to hand, which removes the buff {b['name']} ({b['code']}) put on it (Core Rules 705)")
    return out

# -------------------------------------------------------------------------------------- structures
REFUND = ('P.ready.rune', 'P.add', 'P.channel')
def build_structures(pool, edges, together):
    by = {c['code']: c for c in pool}
    S = dict(loops=[], cost_cheats=[], engines=[], pairs=[], triples=[])
    spec_edges = [e for e in edges if e['cls'] == 'specific' and e['s'] >= 1.0]
    out = defaultdict(list)
    for e in spec_edges: out[e['a']].append(e)
    pairset = {(e['a'], e['b']): e for e in sorted(spec_edges, key=lambda e: e['s'])}
    def cost_of(c): return (c['energy'] or 0, c['power'] or 0)
    def ability_outputs(c, ab):
        return sorted({k.split('@')[0] for k in c['facets'] if k.endswith('@' + str(ab)) and k.startswith('P.')})
    # ---- self loops: the card's own output re-enables its own trigger (505.2.a.1 example: Grim Apothecary)
    for c in pool:
        if c['script'] is None: continue
        f = c['facets']
        rp = f.get('C.replay')
        if rp and c['type'] == 'unit':
            outs = ability_outputs(c, rp.get('ab'))
            if 'P.bounce.friendly' in outs and not (f.get('P.bounce.friendly') or {}).get('selfonly'):
                S['loops'].append(dict(kind='self-replay', cards=[c['code']], per_iteration=dict(energy=c['energy'] or 0, power=c['power'] or 0), limiter='its own play cost each iteration',
                                       line=f"Play {c['name']} ({c['code']}: \"{rp['sent']}\"), return itself to hand with its own trigger, replay. Each iteration costs {c['energy']} Energy" + (f" + {c['power']} Power" if c['power'] else '') + '.'))
    # ---- two-card ability loops: A's ability output fires B's ability, whose output fires A's ability again
    seen = set()
    for (a, b), e1 in pairset.items():
        e2 = pairset.get((b, a))
        if not e2 or (b, a) in seen: continue
        seen.add((a, b))
        A, B = by[a], by[b]
        # ability-level check: the produced facet of each edge must come from the ability the other edge triggers
        ok1 = e2['abB'] is not None and (e1['fa'] + '@' + str(e2['abB'])) in A['facets']
        ok2 = e1['abB'] is not None and (e2['fa'] + '@' + str(e1['abB'])) in B['facets']
        lim = []
        for X, e in ((A, e2), (B, e1)):
            f = X['facets'].get(e['fb']) or {}
            if f.get('rep') == 'turn': lim.append(f"{X['name']}: once per turn / needs readying")
            if f.get('rep') == 'once': lim.append(f"{X['name']}: one-shot (needs replaying)")
        S['loops'].append(dict(kind='mutual' if (ok1 and ok2) else 'mutual-card-level', cards=[a, b], strength=round(e1['s'] + e2['s'], 2), limiter='; '.join(lim) or 'none found by the model',
                               line=f"{e1['reason']}  AND BACK  {e2['reason']}"))
    # ---- refund loops: payoff B gives resources back (readies runes / adds Energy) each time enabler A triggers it
    for e in spec_edges:
        A, B = by[e['a']], by[e['b']]
        if e['abB'] is None or e['fb'] in ('C.replay',) or e['rule'] in ('cheat->expensive', 'reduce->expensive'): continue
        outs = ability_outputs(B, e['abB'])
        refund = [o for o in outs if o in ('P.ready.rune', 'P.add')]
        if not refund: continue
        amt = 0
        for o in refund:
            v = (B['facets'].get(o + '@' + str(e['abB'])) or {}).get('amount') or 1
            amt += v if isinstance(v, (int, float)) else 1
        aE, aP = cost_of(A)
        spent = aE if (A['type'] == 'spell' or e['repA'] == 'once') else 0
        for k, v in A['facets'].items():
            if k.startswith('_cost@') and v['ab'] == e['abA']: spent = v['energy']
        need = []
        if A['type'] == 'spell' or e['repA'] == 'once': need.append('a way to get ' + A['name'] + ' back (it is used up each time)')
        if e['repA'] == 'turn': need.append('a way to ready ' + A['name'] + ' (its ability exhausts it)')
        if e['fb'] == 'C.selfDeath': need.append('a way to get ' + B['name'] + ' back (it dies each time)')
        fB = B['facets'].get(e['fb']) or {}
        if fB.get('rep') == 'turn': need.append(B['name'] + ' only does this once per turn')
        closers = []
        for z in pool:
            if z['code'] in (A['code'], B['code']) or z['type'] not in MAIN + ('legend',) or z['script'] is None: continue
            if not (together(z, A) and together(z, B)): continue
            if (has(z, 'P.recycle') and not (fa(z, 'P.recycle') or {}).get('selfonly') and (fa(z, 'P.recycle') or {}).get('tkind') == 'cardInTrash') or has(z, 'P.regrowth'):
                closers.append(z['code'])
        S['loops'].append(dict(kind='refund', cards=[e['a'], e['b']], strength=e['s'], refund=refund, refund_amount=('all runes' if amt >= 40 else amt), enabler_energy=spent,
                               net=('positive' if amt >= 40 or amt > spent else 'neutral' if amt == spent else 'negative'), needs=need, closers=closers[:12], n_closers=len(closers),
                               line=f"{e['reason']}  REFUND: the same ability gives back {'all your runes' if amt >= 40 else str(amt) + ' resource(s)'}; the enabler spends {spent} Energy."))
    # ---- cost cheats
    for e in edges:
        if e['rule'] in ('cheat->expensive',):
            S['cost_cheats'].append(dict(cards=[e['a'], e['b']], s=e['s'], saved=by[e['b']]['energy'], reason=e['reason']))
    S['cost_cheats'].sort(key=lambda x: -x['s'])
    # ---- repeatable engines: both ends repeat (not once), specific
    for e in spec_edges:
        if e['repA'] in ('repeat', 'turn', 'free', 'static') and e['repB'] in ('repeat', 'turn', 'free') and e['rule'] not in ('cheat->expensive', 'reduce->expensive'):
            S['engines'].append(dict(cards=[e['a'], e['b']], s=e['s'], rule=e['rule'], reason=e['reason']))
    S['engines'].sort(key=lambda x: -x['s'])
    # ---- packages: best undirected pair score and triangles
    und = defaultdict(float); why = defaultdict(list)
    for e in spec_edges:
        k = tuple(sorted((e['a'], e['b']))); und[k] += e['s']; why[k].append(e['rule'])
    S['pairs'] = [dict(cards=list(k), s=round(v, 2), rules=sorted(set(why[k]))) for k, v in sorted(und.items(), key=lambda x: -x[1])[:400]]
    strong = {k: v for k, v in und.items() if v >= 1.8}
    nb = defaultdict(set)
    for (a, b) in strong: nb[a].add(b); nb[b].add(a)
    tri = []
    for a in nb:
        for b in nb[a]:
            if b <= a: continue
            for c in nb[a] & nb[b]:
                if c <= b: continue
                rules = set(why[tuple(sorted((a, b)))]) | set(why[tuple(sorted((a, c)))]) | set(why[tuple(sorted((b, c)))])
                if len(rules) < 2: continue  # three cards joined by one generic rule are a theme, not a package
                # all three must share one legal Domain Identity
                dom = set(by[a]['domains']) | set(by[b]['domains']) | set(by[c]['domains'])
                if len(dom) > 2: continue
                tri.append((round(strong[tuple(sorted((a, b)))] + strong[tuple(sorted((a, c)))] + strong[tuple(sorted((b, c)))], 2), [a, b, c], sorted(rules)))
    tri.sort(key=lambda x: -x[0])
    S['triples'] = [dict(cards=t[1], s=t[0], rules=t[2]) for t in tri[:600]]
    S['counts'] = dict(loops=Counter(l['kind'] for l in S['loops']), cost_cheats=len(S['cost_cheats']), engines=len(S['engines']), strong_pairs=len(strong), triples=len(tri))
    return S

def main():
    pool = load_pool()
    agree = build_facets(pool)
    together, legends = legality(pool)
    edges, stats = build_edges(pool, together)
    nonbos = build_nonbos(pool, together)
    S = build_structures(pool, edges, together)
    by = {c['code']: c for c in pool}
    facets_out = {c['code']: dict(name=c['name'], type=c['type'], set=c['set'], domains=c['domains'], energy=c['energy'], might=c['might'], source='engine' if c['script'] is not None else 'text',
                                  facets={k: dict(rep=v.get('rep'), src=v.get('src'), sent=v.get('sent')) for k, v in c['facets'].items() if '@' not in k and not k.startswith('_')}) for c in pool}
    json.dump(facets_out, open(os.path.join(OUT, 'facets.json'), 'w'), indent=0)
    json.dump(dict(edges=edges, nonbos=nonbos, rule_stats=stats), open(os.path.join(OUT, 'edges.json'), 'w'))
    json.dump(S, open(os.path.join(OUT, 'structures.json'), 'w'), indent=0, default=lambda o: dict(o))
    # agreement of the text-only extractor with the engine-derived facets (931 scripted cards)
    rows = []
    for k in V:
        tp = agree[(k, True, True)]; fn = agree[(k, True, False)]; fp = agree[(k, False, True)]
        if tp + fn + fp == 0: continue
        rows.append((k, tp, fp, fn, round(tp / (tp + fp), 2) if tp + fp else None, round(tp / (tp + fn), 2) if tp + fn else None))
    json.dump(rows, open(os.path.join(OUT, 'text-vs-engine.json'), 'w'))
    print('pool', len(pool), 'engine-scripted', sum(1 for c in pool if c['script'] is not None), 'text-only', sum(1 for c in pool if c['script'] is None))
    print('cards with >=1 produces facet', sum(1 for c in pool if any(k.startswith('P.') and '@' not in k for k in c['facets'])), 'with >=1 cares facet', sum(1 for c in pool if any(k.startswith('C.') and '@' not in k for k in c['facets'])))
    print('edges', len(edges), 'specific', sum(1 for e in edges if e['cls'] == 'specific'), 'class', sum(1 for e in edges if e['cls'] == 'class'), 'nonbos', len(nonbos))
    print('structures', json.dumps(S['counts'], default=dict))
    if '-v' in sys.argv:
        for k, v in sorted(stats.items(), key=lambda x: -x[1]['edges']): print(f"  {k:28s} enablers {v['enablers']:4d} payoffs {v['payoffs']:4d} edges {v['edges']:6d} {v['cls']}")
        print('text-vs-engine (facet, tp, fp, fn, precision, recall)')
        for r in rows: print('  ', r)

if __name__ == '__main__':
    main()
