# Print the trimmed shape of an Inertia page's props (riftbound.org embeds them in <script data-page="app" type="application/json">).
import re,json,sys,html
h=open(sys.argv[1]).read()
m=re.search(r'<script data-page="app" type="application/json">(.*?)</script>',h,re.S)
j=json.loads(m.group(1))
PII=re.compile(r'player|author|user|owner|handle|avatar',re.I)
def trim(v,d=0,k=''):
    if isinstance(v,list): return [trim(v[0],d+1,k),'...(%d items)'%len(v)] if v else []
    if isinstance(v,dict): return '{...}' if d>int(sys.argv[2]) else {kk:trim(x,d+1,kk) for kk,x in list(v.items())[:40]}
    if isinstance(v,str) and PII.search(k): return '<redacted>'
    if isinstance(v,str) and len(v)>70: return v[:70]+'...'
    return v
print(j.get('component'),j.get('url'),list(j['props'].keys()))
skip=set(sys.argv[4:])
print(json.dumps({k:trim(v,0,k) for k,v in j['props'].items() if k not in skip},indent=1)[:int(sys.argv[3])])
