# Third-pass verification helper: load an Inertia page's props (riftbound.org).
import re,json,sys
def props(path):
    h=open(path,encoding='utf-8',errors='replace').read()
    m=re.search(r'<script data-page="app" type="application/json">(.*?)</script>',h,re.S)
    return json.loads(m.group(1)) if m else None
if __name__=='__main__':
    j=props(sys.argv[1]); p=j['props']
    print(j['component'],j['url'],list(p.keys()))
