#!/usr/bin/env python3
"""Assemble docs/research/legend-profiles.md from doc_template.md and the generated fragments / JSON.

    python3 assemble_doc.py --out ../../legend-profiles.md

Only fills {{PLACEHOLDERS}}; every number in the document body that depends on the generated data is
computed here so the prose cannot drift from the files.
"""
import argparse
import json
import os
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import cardpool  # noqa: E402

DOM = {'fury': 'Fury', 'calm': 'Calm', 'mind': 'Mind', 'body': 'Body', 'chaos': 'Chaos', 'order': 'Order'}
ENGINE_KIND = {'passive': 'static', 'costMod': 'static', 'globalMod': 'static'}


def one_line(t):
    return (t or '').replace('\n', ' // ').replace('|', '\\|')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--cards', default=os.path.expanduser('~/github_repositories/GameLab/data/cards/cards.json'))
    a = ap.parse_args()
    T = json.load(open(os.path.join(HERE, 'data/legend-profiles.text.json'), encoding='utf-8'))
    M = json.load(open(os.path.join(HERE, 'data/legend-profiles.meta.json'), encoding='utf-8'))
    md = lambda n: open(os.path.join(HERE, 'data/md', n), encoding='utf-8').read().rstrip('\n')  # noqa: E731
    meta = {l['legendCode']: l for l in M['legends']}
    cards, pool_meta = cardpool.load_pool(a.cards, os.path.join(HERE, 'raw/gallery-2026-11-11.json'))
    name_of = {c['cardCode']: c['name'] for c in cards}
    R = {}

    # Radiance legends
    rows = ['| Code | Legend | Champion tag | Domains | Text (FACT, official gallery 2026-11-11, verbatim) |', '|---|---|---|---|---|']
    for L in T['legends']:
        if L['set'] == 'RAD':
            rows.append('| %s | %s | %s | %s | %s |' % (L['legendCode'], L['name'], L['championTag'],
                                                     '/'.join(DOM[d] for d in L['domains']), one_line(L['rulesText'])))
    R['RAD_TABLE'] = '\n'.join(rows)

    # text differences
    ch = pool_meta['textChangedSinceCardsJson']
    eff = [x for x in ch if x['old'] and x['new'].startswith(x['old']) and x['new'] != x['old']]
    rune = [x for x in ch if not x['new']]
    rest = [x for x in ch if x not in eff and x not in rune]
    R['N_CHANGED'] = str(len(ch))
    R['N_EFFECT'] = str(len(eff))
    R['N_RUNE'] = str(len(rune))
    R['N_WORDING'] = str(len(rest))
    R['EFFECT_EXAMPLES'] = '; '.join('%s %s gains "%s"' % (x['cardCode'], x['name'], one_line(x['new'][len(x['old']):].strip(' /\n')))
                                     for x in eff[:4])
    R['EFFECT_CODES'] = ', '.join(x['cardCode'] for x in eff)
    R['WORDING_TABLE'] = '\n'.join(['| Code | Card | cards.json (2026-09-06) | Official gallery (2026-11-11) |', '|---|---|---|---|'] + [
        '| %s | %s | %s | %s |' % (x['cardCode'], x['name'], one_line(x['old']), one_line(x['new'])) for x in rest])
    inc = pool_meta.get('galleryIncompleteCards', [])
    R['N_INCOMPLETE'] = str(len(inc))
    R['INCOMPLETE_LIST'] = ', '.join('%s %s (%s%s)' % (x['cardCode'], x['name'], x['typeFromAccessibilityText'],
                                                       ', domain missing' if not x['domains'] else '') for x in inc)
    R['N_POOL'] = str(len(cards))
    R['N_RAD'] = str(sum(1 for c in cards if c['set'] == 'RAD'))

    # engine cross-check
    agree, total, diffs = 0, 0, []
    for L in T['legends']:
        e = L.get('engineScript')
        if not e:
            continue
        total += 1
        mine = sorted(x['kind'] for x in L['abilities'])
        eng = sorted(ENGINE_KIND.get(x['kind'], x['kind'] or '?') for x in e['abilities'])
        if mine == eng:
            agree += 1
        else:
            diffs.append('%s (ours %s, engine %s)' % (L['legendCode'], '+'.join(mine), '+'.join(eng)))
    R['ENGINE_AGREE'], R['ENGINE_TOTAL'], R['ENGINE_DIFFS'] = str(agree), str(total), '; '.join(diffs)

    # legends without text battlefields
    R['NO_BF'] = ', '.join('%s %s' % (L['legendCode'], L['championTag']) for L in T['legends']
                           if not [b for b in L['battlefields'] if 'bannedFrom' not in b])
    R['N_AXES'] = str(len(T['axes']))
    R['AXIS_LIST'] = ', '.join('`%s`' % x['axis'] for x in T['axes'])
    R['WEIGHTS'] = json.dumps(T['weights'])

    # Leona example sentence material
    L = next(l for l in T['legends'] if l['legendCode'] == 'OGN-261')
    stun = next(x for x in L['themeAxes'] if x['axis'] == 'stun')
    R['LEONA_POOL_N'] = str(stun['poolSupport']['count'])
    R['LEONA_POOL'] = ', '.join('%s (%s)' % (name_of[c], c) for c in stun['poolSupport']['cardCodes'][:8])

    # data half
    pf = M['datasets']['pa-fetch-2026-11-11']
    R['N_PA_PARSED'], R['N_PA_COMPLETE'] = str(pf['decksParsed']), str(pf['decksComplete'])
    R['N_PA_EVENT'] = str(sum((l['samples']['pa-fetch-2026-11-11'] or {}).get('nEventMarker', 0) for l in M['legends']))
    per = Counter((l['samples']['pa-fetch-2026-11-11'] or {}).get('n', 0) for l in M['legends'])
    R['PER_LEGEND_DIST'] = 'lists per legend: ' + ', '.join('%d (x%d legends)' % (k, v) for k, v in sorted(per.items()))
    pl = M['datasets']['pa-list-2026-11-11']
    R['N_LIST_ROWS'], R['N_LIST_PAGES'], R['N_LIST_RECENT'] = str(pl['rows']), str(pl['pages']), str(pl['rowsSinceRadiance'])
    R['N_LOCAL'] = str(M['datasets']['pa-sample-2026-09-06']['decksWithLegend'])
    R['N_LOCAL_LEGENDS'] = str(sum(1 for l in M['legends'] if l['samples']['pa-sample-2026-09-06']))
    conf = Counter(l['dataConfidence'] for l in M['legends'])
    R['CONF_OK'], R['CONF_THIN'], R['CONF_INSUFF'] = str(conf['ok']), str(conf['thin']), str(conf['insufficient'])

    def tagname(l):
        return '%s %s' % (l['legendCode'], [L for L in T['legends'] if L['legendCode'] == l['legendCode']][0]['championTag'])
    R['CONF_OK_LIST'] = ', '.join(tagname(l) for l in M['legends'] if l['dataConfidence'] == 'ok') or 'none'
    R['CONF_INSUFF_LIST'] = ', '.join(tagname(l) for l in M['legends'] if l['dataConfidence'] == 'insufficient') or 'none'
    scarce = [l for l in M['legends'] if l['dataAvailability'] == 'scarce']
    R['N_SCARCE'] = str(len(scarce))
    R['SCARCE_LIST'] = ', '.join('%s (%d lists, %d event-named)' % (tagname(l), l['popularity']['listsSinceRadiance'],
                                                                  l['popularity']['eventNamedListsSinceRadiance'])
                                 for l in sorted(scarce, key=lambda l: (l['popularity']['listsSinceRadiance'], l['legendCode'])))
    no_results = [l for l in M['legends'] if not l.get('results')]
    R['N_NO_RESULTS'] = str(len(no_results))
    R['NO_RESULTS_LIST'] = ', '.join(tagname(l) for l in no_results)
    both = [l for l in M['legends'] if l['dataAvailability'] == 'scarce' and not (l.get('results') or {}).get('tierList')
            and not ((l.get('results') or {}).get('euRegional') or {}).get('winRatePct')]
    R['N_NO_DATA_ADVICE'] = str(len(both))
    R['NO_DATA_ADVICE_LIST'] = ', '.join(tagname(l) for l in both)
    top = sorted(M['legends'], key=lambda l: l['popularity']['rankSinceRadiance'] or 99)[:8]
    R['TOP_POP'] = ', '.join('%s %d' % (tagname(l).split(' ', 1)[1], l['popularity']['listsSinceRadiance']) for l in top)
    R['UNRESOLVED'] = ', '.join('%s x%d' % kv for kv in M['unresolvedDeckEntries'].items()) or 'none'
    neeko = [(tagname(l), l['asAdditionalLegend']['decks']) for l in M['legends'] if l['asAdditionalLegend']['decks']]
    R['NEEKO_LIST'] = ', '.join('%s x%d' % kv for kv in sorted(neeko, key=lambda kv: -kv[1])) or 'none'

    # sanity: do text-fit battlefields show up in registered lists?
    hit = tot = slots = slot_hit = 0
    axis_hit = axis_tot = 0
    for L in T['legends']:
        smp = meta[L['legendCode']]['samples']['pa-fetch-2026-11-11']
        fit = [b['cardCode'] for b in L['battlefields'] if 'bannedFrom' not in b]
        if not smp or not fit:
            continue
        tot += 1
        played = {b['cardCode']: b['decks'] for b in smp['battlefields']}
        if set(fit[:5]) & set(played):
            hit += 1
        slots += sum(played.values())
        slot_hit += sum(v for c, v in played.items() if c in fit)
    for L in T['legends']:
        smp = meta[L['legendCode']]['samples']['pa-fetch-2026-11-11']
        if not smp:
            continue
        core = {c['cardCode'] for c in smp['coreCards']}
        for x in L['themeAxes']:
            if 'rewards' in x['roles'] or 'needs' in x['roles']:
                axis_tot += 1
                if core & set(x['poolSupport']['cardCodes']):
                    axis_hit += 1
    R['BF_VALID'] = ('%d of %d legends with fetched lists and a text-fit list have at least one of their top-5 text-fit battlefields '
                     'registered in a fetched list; %d of %d registered battlefield slots (%d%%) are battlefields the text fit lists at all'
                     % (hit, tot, slot_hit, slots, round(100 * slot_hit / slots) if slots else 0))
    R['AXIS_VALID'] = ('%d of %d rewarded or needed axes have at least one of their pool cards among that legend\'s core cards (75%%+ of fetched lists)'
                       % (axis_hit, axis_tot))
    bf_all, n_lists = Counter(), 0
    for l in M['legends']:
        smp = l['samples']['pa-fetch-2026-11-11']
        if smp:
            n_lists += smp['n']
            for b in smp['battlefields']:
                bf_all[(b['cardCode'], b['name'])] += b['decks']
    R['BF_TOP'] = ', '.join('%s %s %d/%d' % (c, n, k, n_lists) for (c, n), k in bf_all.most_common(10))
    R['OVERVIEW_TEXT'] = md('overview-text.md')
    R['OVERVIEW_DATA'] = md('overview-data.md')
    R['APPENDIX'] = md('appendix.md')
    R['EXAMPLE_JSON'] = md('example.json')

    doc = open(os.path.join(HERE, 'doc_template.md'), encoding='utf-8').read()
    for k, v in R.items():
        doc = doc.replace('{{%s}}' % k, v)
    import re
    left = sorted(set(re.findall(r'\{\{[A-Z_]+\}\}', doc)))
    if left:
        raise SystemExit('unfilled placeholders: %s' % left)
    open(a.out, 'w', encoding='utf-8').write(doc)
    print('wrote', a.out, len(doc), 'bytes')


if __name__ == '__main__':
    main()
