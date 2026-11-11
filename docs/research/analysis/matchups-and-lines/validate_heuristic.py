"""Directional check of the HEURISTIC matchup estimate against matchup statements published by players.
Claims are (A, B, direction for A, source). Lists: 2026-09-06 sample; several claims are from other metas, so this is a smoke test only."""
import sys; sys.argv=['x']
from linegen import *
CLAIMS=[("Kai'Sa",'Master Yi',+1,'riftbound.gg week-2 tier list 2026-11-06 (Radiance lists)'),
        ("Kai'Sa","Rek'Sai",+1,'riftbound.gg week-2 tier list 2026-11-06'),
        ("Kai'Sa","Kha'Zix",+1,'riftbound.gg week-2 tier list 2026-11-06'),
        ('Sivir','Master Yi',-1,'cardsrealm Miracle Sivir 2026-01-18'),
        ('Sivir','Ahri',-1,'cardsrealm Miracle Sivir 2026-01-18'),
        ('Sivir','Ezreal',+1,'cardsrealm Miracle Sivir 2026-01-18'),
        ('Sivir','Draven',-1,'cardsrealm Miracle Sivir 2026-01-18'),
        ('Sivir',"Kai'Sa",-1,'cardsrealm Miracle Sivir 2026-01-18 ("one chance to win")'),
        ('Irelia','Master Yi',+1,'riftmana Irelia guide 2026-02-19'),
        ('Irelia',"Kai'Sa",-1,'riftmana Irelia guide 2026-02-19 (average to difficult)')]
def mean_edge(a,b):
    A=[d for d in DECKS if tag(d)==a]; B=[d for d in DECKS if tag(d)==b]
    es=[edge(features(x)[0],features(y)[0])[0] for x in A for y in B]
    return sum(es)/len(es), len(A), len(B)
hit=0
for a,b,s,src in CLAIMS:
    e,na,nb=mean_edge(a,b)
    ok=(e>0)==(s>0); hit+=ok
    print(f"{a} vs {b}: claim {'favoured' if s>0 else 'unfavoured'} | estimate {50+e:.1f}% (lists {na}x{nb}) | {'AGREE' if ok else 'DISAGREE'} | {src}")
print(f'agreement {hit}/{len(CLAIMS)}')
tags=['Master Yi',"Kai'Sa","Rek'Sai",'Volibear','Irelia','Ornn','Diana','Vex','Rengar','Lux']
print('matrix (row vs column, estimate %):')
print('\t'+'\t'.join(tags))
for a in tags:
    print(a+'\t'+'\t'.join('--' if a==b else f"{50+mean_edge(a,b)[0]:.0f}" for b in tags))
