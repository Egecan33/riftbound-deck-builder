// Third-pass fetch helper: serial GETs with a generic User-Agent, 2 s apart. Usage: node v3-get.mjs out1 url1 [out2 url2 ...]
import fs from 'node:fs';
const UA='Mozilla/5.0 (compatible; deck-research/1.0)';
const a=process.argv.slice(2);
for(let i=0;i<a.length;i+=2){
  if(i) await new Promise(r=>setTimeout(r,2000));
  try{
    const method=a[i]==='HEAD'?'HEAD':'GET';
    const r=await fetch(a[i+1],{method,headers:{'User-Agent':UA},redirect:'manual'});
    const h=Object.fromEntries([...r.headers].filter(([k])=>/^(etag|last-modified|cache-control|content-type|content-length|location|age)$/.test(k)));
    let n=0; if(method==='GET'){const b=Buffer.from(await r.arrayBuffer());n=b.length;fs.writeFileSync('raw/'+a[i],b);}
    console.log(a[i],r.status,n,JSON.stringify(h));
  }catch(e){console.log(a[i],'ERR',String(e.cause||e))}
}
