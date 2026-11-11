#!/usr/bin/env python3
"""Render markdown fragments for docs/research/legend-profiles.md from the two generated JSON files.

    python3 report.py --text data/legend-profiles.text.json --meta data/legend-profiles.meta.json --out-dir data/md

Writes overview-text.md, overview-data.md, coverage.md, appendix.md, example.json. Pure formatting, no analysis.
"""
import argparse
import json
import os

EVENT_NAMES = {'barcelonas-top-decks': 'Barcelona', 'singapores-top-decks': 'Singapore', 'los-angeles-top-decks': 'Los Angeles'}
DOM = {'fury': 'Fury', 'calm': 'Calm', 'mind': 'Mind', 'body': 'Body', 'chaos': 'Chaos', 'order': 'Order'}


def one_line(t):
    return (t or '').replace('\n', ' // ').replace('|', '\\|')


def cost(c):
    parts = []
    if c.get('energy') is not None:
        parts.append('%s Energy' % c['energy'])
    if c.get('power'):
        parts.append('%s Power' % c['power'])
    if c.get('might') is not None:
        parts.append('%s Might' % c['might'])
    return ', '.join(parts) or '-'


def legend_axes(L, k=4):
    ax = [a for a in L['themeAxes'] if a['roles']]
    return ax[:k]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--text', required=True)
    ap.add_argument('--meta', required=True)
    ap.add_argument('--out-dir', required=True)
    a = ap.parse_args()
    T = json.load(open(a.text, encoding='utf-8'))
    M = json.load(open(a.meta, encoding='utf-8'))
    meta = {l['legendCode']: l for l in M['legends']}
    os.makedirs(a.out_dir, exist_ok=True)

    # ---- overview: text half
    rows = ['| Legend | Champion tag | Domains | Champs | Sig. | Top text axes (weight, role) | Best text-fit battlefields (not banned) |',
            '|---|---|---|---|---|---|---|']
    for L in T['legends']:
        ax = '; '.join('%s %.2f %s' % (x['axis'], x['weight'], '+'.join(r[:3] for r in x['roles'])) for x in legend_axes(L))
        bfs = [b for b in L['battlefields'] if 'bannedFrom' not in b][:3]
        rows.append('| %s %s | %s | %s | %d | %d | %s | %s |' % (
            L['legendCode'], L['name'], L['championTag'], '/'.join(DOM[d] for d in L['domains']), len(L['champions']),
            len(L['signatureCards']), ax or '(none)', ', '.join('%s (%.1f)' % (b['name'], b['score']) for b in bfs) or '(none from text)'))
    open(os.path.join(a.out_dir, 'overview-text.md'), 'w', encoding='utf-8').write('\n'.join(rows) + '\n')

    # ---- overview: data half
    def pct(x, d=1):
        return ('%.' + str(d) + 'f%%') % (100 * x) if x is not None else '-'

    def official_cell(m):
        o = (m.get('officialField') or {}).get('recent')
        if not m.get('officialField'):
            return 'not in any table'
        if not o:
            return 'not in the last 3 tables'
        conv = ('%s vs field %s' % (pct(o['day2Conversion'], 0), pct(o['fieldDay2Conversion'], 0))) if o['enoughForConversion'] else 'n<30'
        return '%d (%s); %s' % (o['day1'], pct(o['day1Share']), conv)

    rows = ['| Legend | PA lists since RAD (rank, share) | Official RQ field, last 3 events: Day 1 pilots (share); Day 2 conversion | riftbound.one podiums 1st/2nd/3rd: all (RAD era) | Tier / wins / top cuts | EU RC win rate (matches) | RAD-era lists (with provenance) | Pre-RAD lists | Confidence, basis | Typical Chosen Champion (RAD era) | Typical rune split (RAD era) |',
            '|---|---|---|---|---|---|---|---|---|---|---|']
    for L in T['legends']:
        m = meta[L['legendCode']]
        p = m['popularity']
        r = m.get('results') or {}
        tl, eu = r.get('tierList'), r.get('euRegional')
        s = m['samples']['radiance']
        s0 = m['samples']['preRadiance']
        pa, pr = m['podiums']['all'], m['podiums']['radianceEra']
        shared = ' (shared with %s)' % ', '.join(r['sharedWithLegends']) if r.get('sharedWithLegends') else ''
        rows.append('| %s %s | %s | %s | %s | %s | %s | %s | %s | %s | %s | %s |' % (
            L['legendCode'], L['championTag'],
            '%d (#%s, %.1f%%)' % (p['listsSinceRadiance'], p['rankSinceRadiance'] or '-', 100 * (p['shareSinceRadiance'] or 0)),
            official_cell(m),
            '%d/%d/%d (%d/%d/%d)' % (pa['first'], pa['second'], pa['third'], pr['first'], pr['second'], pr['third']),
            ('%s / %d / %d%s' % (tl['tier'], tl['wins'], tl['topCuts'], shared)) if tl else 'not listed',
            ('%s%% (%s)%s' % (eu['winRatePct'], eu['matches'], shared) if eu and eu.get('winRatePct') is not None
             else ('<=10 matches' if eu else 'not listed')),
            ('%d (%d)' % (s['n'], s['nEventMarker'])) if s else '0',
            str(s0['n']) if s0 else '0', '%s, %s' % (m['dataConfidence'], m['adviceBasis']),
            ('%s %d/%d' % (s['chosenChampions'][0]['name'], s['chosenChampions'][0]['decks'], s['nChosenChampionKnown'])) if s and s['chosenChampions'] else '-',
            ('%s %d/%d' % (s['runeSplits'][0]['split'], s['runeSplits'][0]['decks'], s['n'])) if s and s['runeSplits'] else '-'))
    open(os.path.join(a.out_dir, 'overview-data.md'), 'w', encoding='utf-8').write('\n'.join(rows) + '\n')

    # ---- coverage
    out = []
    for level in ('insufficient', 'thin', 'ok'):
        ls = [l for l in M['legends'] if l['dataConfidence'] == level]
        out.append('- **%s (%d):** %s' % (level, len(ls), ', '.join('%s %s (%s)' % (
            l['legendCode'], next(t for t in reversed(l['tags'])), l['dataConfidenceReasons'][0].split(' complete')[0] + ' Radiance-era lists') for l in ls) or 'none'))
    open(os.path.join(a.out_dir, 'coverage.md'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')

    # ---- appendix
    ap_lines = []
    for L in T['legends']:
        m = meta[L['legendCode']]
        ap_lines.append('### %s %s (%s), %s' % (L['legendCode'], L['name'], L['championTag'], '/'.join(DOM[d] for d in L['domains'])))
        ap_lines.append('')
        ap_lines.append('- **Text (FACT, %s):** "%s"' % (L['source'], one_line(L['rulesText'])))
        if L.get('rulesTextCurrent'):
            ap_lines.append('- **Text in the official gallery on 2026-11-11 differs (FACT):** "%s"' % one_line(L['rulesTextCurrent']))
        if len(L['printingCodes']) > 1:
            ap_lines.append('- Printing codes: %s' % ', '.join(L['printingCodes']))
        if L['otherLegendsSameChampion']:
            ap_lines.append('- Other legend with the same champion tag: %s' % ', '.join(L['otherLegendsSameChampion']))
        for i, ab in enumerate(L['abilities'], 1):
            bits = [ab['kind']]
            if ab['timing']:
                bits.append(ab['timing'] + ' speed')
            if ab['gate']:
                bits.append('gate ' + ', '.join(ab['gate']))
            if ab['cost']:
                bits.append('cost ' + ' + '.join(ab['cost']))
            if ab['condition']:
                bits.append('condition "%s"' % ab['condition'])
            if ab['restriction']:
                bits.append('restriction "%s"' % ab['restriction'])
            bits.append('effect "%s"' % ab['effect'])
            ap_lines.append('- Parsed ability %d (HEURISTIC parse): %s' % (i, '; '.join(bits)))
        for key, label in (('rewards', 'Rewards'), ('needs', 'Needs'), ('enables', 'Enables')):
            if L[key]:
                ap_lines.append('- **%s (HEURISTIC, from the quoted text):** %s' % (label, '; '.join(
                    '%s ["%s"]' % (x['label'], one_line(x['text'])) for x in L[key])))
        ap_lines.append('- **Chosen Champion options (FACT, rule 103.3.a.2; text verbatim):**')
        for c in L['champions']:
            ap_lines.append('  - %s %s (%s)%s: "%s"' % (c['cardCode'], c['name'], cost(c),
                                                      ' **banned from %s**' % c['bannedFrom'] if c.get('bannedFrom') else '',
                                                      one_line(c['rulesText'])))
        if not L['champions']:
            ap_lines.append('  - none found in the pool')
        if L['championsOutsideIdentity']:
            ap_lines.append('  - outside the Domain Identity (not legal as Chosen Champion here): %s' % ', '.join(
                '%s %s' % (c['cardCode'], c['name']) for c in L['championsOutsideIdentity']))
        ap_lines.append('- **Signature cards (FACT, rule 103.3.d; max 3 in total):** %s' % ('; '.join(
            '%s %s (%s, %s): "%s"' % (c['cardCode'], c['name'], c['type'], cost(c), one_line(c['rulesText'])) for c in L['signatureCards']) or 'none'))
        ap_lines.append('- **Theme axes (HEURISTIC weights; pool = cards of that kind inside the Domain Identity):** %s' % '; '.join(
            '%s %.2f [%s] pool %d' % (x['axis'], x['weight'], '/'.join(x['roles']) or 'champion or signature text only', x['poolSupport']['count'])
            for x in L['themeAxes'] if x['roles'] or x['weight'] >= 0.3))
        bf = L['battlefields'][:5]
        if bf:
            ap_lines.append('- **Battlefields by text (HEURISTIC):** %s' % '; '.join(
                '%s %s (%.1f%s; %s)' % (b['cardCode'], b['name'], b['score'], ', BANNED %s' % b['bannedFrom'] if b.get('bannedFrom') else '',
                                         ', '.join(sorted({r['label'] for r in b['reasons']}))) for b in bf))
        else:
            ap_lines.append('- **Battlefields by text (HEURISTIC):** no battlefield text interacts with this legend text; use the data below')
        p = m['popularity']
        res = m.get('results') or {}
        bits = ['%d published lists since 2026-10-23 (rank %s of 58, %.1f%%)' % (p['listsSinceRadiance'], p['rankSinceRadiance'] or '-', 100 * (p['shareSinceRadiance'] or 0))]
        if res.get('tierList'):
            bits.append('riftbound.gg week-2 tier %s, %d wins, %d top cuts' % (res['tierList']['tier'], res['tierList']['wins'], res['tierList']['topCuts']))
        if res.get('euRegional') and res['euRegional'].get('winRatePct') is not None:
            bits.append('EU Regional Championship %d%% over %d matches' % (res['euRegional']['winRatePct'], res['euRegional']['matches']))
        if res.get('sharedWithLegends'):
            bits.append('results are per champion name and cannot be split from %s' % ', '.join(res['sharedWithLegends']))
        if m['asAdditionalLegend']['decks']:
            bits.append('registered as an extra Neeko legend in %d fetched lists' % m['asAdditionalLegend']['decks'])
        ap_lines.append('- **Popularity and results (DATA):** %s' % '; '.join(bits))
        of = m.get('officialField')
        if of:
            ev = of['events']
            o = of['recent']
            line = 'in %d of the 11 official field tables (first %s, last %s)' % (len(ev), ev[0]['publishedAt'], ev[-1]['publishedAt'])
            if o:
                line += '; last 3 events (%s): %d Day 1 pilots = %s of the field, %d in Day 2 = %s of Day 2' % (
                    ', '.join(EVENT_NAMES.get(x, x) for x in o['events']), o['day1'], pct(o['day1Share']), o['day2'], pct(o['day2Share']))
                line += ('; Day 2 conversion %s against %s for the whole field' % (pct(o['day2Conversion'], 0), pct(o['fieldDay2Conversion'], 0))
                         if o['enoughForConversion'] else '; fewer than 30 Day 1 pilots, so no conversion rate is shown')
            else:
                line += '; not listed in the last 3 tables'
            ap_lines.append('- **Official Regional Qualifier field (FACT counts from playriftbound.com, all before Radiance):** %s' % line)
        else:
            ap_lines.append('- **Official Regional Qualifier field:** not in any official field table (the last one is Los Angeles, published 2026-09-30)')
        pa_, pr_ = m['podiums']['all'], m['podiums']['radianceEra']
        if sum(pa_.values()):
            ap_lines.append('- **Podiums (DATA, riftbound.one top-3 lists, n=%d lists, events 2026-04 to 2026-10):** %d first, %d second, %d third; with a Radiance card in the list: %d / %d / %d' % (
                M['datasets']['r1-top3-2026-11-11']['decksParsed'],
                pa_['first'], pa_['second'], pa_['third'], pr_['first'], pr_['second'], pr_['third']))

        def crd(c, n, copies=False):
            return '%s %d/%d%s%s' % (c['name'], c['decks'], n, ' x%.1f' % c['avgCopiesWhenPlayed'] if copies else '',
                                     ' (BANNED since %s)' % c['bannedFrom'] if c.get('bannedFrom') else '')
        for ds, label in (('radiance', 'Radiance-era lists'), ('preRadiance', 'Pre-Radiance lists')):
            s = m['samples'][ds]
            if not s:
                ap_lines.append('- **%s (DATA):** n=0' % label)
                continue
            src = ', '.join('%s %d' % (k.replace('-2026-11-11', '').replace('-2026-09-06', '').replace('-2026', ''), v) for k, v in s['sources'].items())
            extra = ''
            if ds == 'preRadiance':
                extra = '; newest set in list: %s; %d of them hold a card that is banned today' % (
                    ', '.join('%s %d' % kv for kv in s['newestSetInList'].items()), s['nWithCurrentlyBannedCard'])
            arch = s['archetypeLabels']
            ap_lines.append('- **%s (DATA, n=%d, %d with tournament provenance; sources: %s%s):** champion %s; runes %s; battlefields %s; core (>=75%%) %s; flex (25-74%%) %s; side deck %s%s' % (
                label, s['n'], s['nEventMarker'], src, extra,
                ', '.join('%s %d/%d' % (c['name'], c['decks'], s['nChosenChampionKnown']) for c in s['chosenChampions'][:4]) or '-',
                ', '.join('%s %d/%d' % (r['split'], r['decks'], s['n']) for r in s['runeSplits'][:3]) or '-',
                ', '.join(crd(b_, s['nWithBattlefields']) for b_ in s['battlefields'][:5]) or '-',
                ', '.join(crd(c, s['n'], True) for c in s['coreCards'][:(12 if ds == 'radiance' else 8)]) or '-',
                (', '.join(crd(c, s['n']) for c in s['flexCards'][:8]) or '-') if s['n'] >= 3 else 'n too small',
                (', '.join(crd(c, s['nWithSideDeck']) for c in s['sideDeck'][:5]) or '-') if s['nWithSideDeck'] >= 3 else 'n too small',
                ('; shape labels from the deck-theory clustering (%d labelled): %s' % (arch['nLabelled'], ', '.join('%s %d' % (x['label'], x['decks']) for x in arch['labels']))) if arch['nLabelled'] else ''))
            if ds == 'radiance' and len([v for v in s['variants'] if v['decks'] >= 2]) >= 2:
                ap_lines.append('  - Builds by Chosen Champion (DATA): %s' % '; '.join(
                    '%s %d/%d%s' % (v['name'], v['decks'], s['nChosenChampionKnown'],
                                    (' sets itself apart with ' + ', '.join(x['name'] for x in v['distinctiveCards'][:5])) if v['distinctiveCards'] else '')
                    for v in s['variants'] if v['decks'] >= 2))
        ap_lines.append('- **Data confidence: %s; advice basis: %s** (%s)' % (m['dataConfidence'], m['adviceBasis'], '; '.join(m['dataConfidenceReasons'])))
        ap_lines.append('')
    open(os.path.join(a.out_dir, 'appendix.md'), 'w', encoding='utf-8').write('\n'.join(ap_lines) + '\n')

    # ---- compact example for the shape proposal (one legend, lists truncated)
    L = next(l for l in T['legends'] if l['legendCode'] == 'OGN-261')
    ex = json.loads(json.dumps(L))
    ex['themeAxes'] = ex['themeAxes'][:2]
    for x in ex['themeAxes']:
        x['poolSupport']['cardCodes'] = x['poolSupport']['cardCodes'][:4] + ['...']
        x['evidence'] = x['evidence'][:2]
    ex['champions'] = ex['champions'][:1]
    ex['battlefields'] = ex['battlefields'][:1]
    ex['engineScript'] = ex['engineScript']
    mm = json.loads(json.dumps(meta['OGN-261']))
    for ds, s in mm['samples'].items():
        if s:
            for k in ('coreCards', 'flexCards', 'topCards', 'sideDeck', 'battlefields', 'decks', 'variants'):
                s[k] = s[k][:1] + (['...'] if len(s[k]) > 1 else [])
            for v in s['variants']:
                if isinstance(v, dict):
                    v['deckIds'] = v['deckIds'][:1] + ['...']
                    v['distinctiveCards'] = v['distinctiveCards'][:1]
    if mm.get('officialField'):
        mm['officialField']['events'] = mm['officialField']['events'][-1:] + ['...']
    json.dump({'text': ex, 'meta': mm}, open(os.path.join(a.out_dir, 'example.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('written to', a.out_dir)


if __name__ == '__main__':
    main()
