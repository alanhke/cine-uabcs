const fs=require("fs"),path=require("path");const d=process.argv[2];
const med=a=>{a=a.filter(x=>x!=null).sort((x,y)=>x-y);return a[Math.floor(a.length/2)]};
const pages=["inicio","cartelera","pelicula","butacas","login"];const out=[];
out.push("| Página | Performance | Accessibility | Best Practices | SEO | LCP (s) | TBT (ms) | CLS | Fallos a11y (auditorías) |");out.push("|---|---|---|---|---|---|---|---|---|");
const fails={};
for(const p of pages){const runs=[1,2,3].map(r=>{try{return JSON.parse(fs.readFileSync(path.join(d,`${p}-${r}.json`)))}catch{return null}}).filter(Boolean);
 const c=k=>med(runs.map(j=>j.categories[k]?.score!=null?Math.round(j.categories[k].score*100):null));
 const a=k=>med(runs.map(j=>j.audits[k]?.numericValue));
 const j=runs[0];const fa=Object.values(j.audits).filter(x=>x.score===0&&j.categories.accessibility.auditRefs.some(r=>r.id===x.id&&r.weight>0));
 fa.forEach(x=>{fails[x.id]=fails[x.id]||{t:x.title,p:[],n:0};fails[x.id].p.push(p);fails[x.id].n+=(x.details?.items?.length||0)});
 out.push(`| ${p} | ${c("performance")} | ${c("accessibility")} | ${c("best-practices")} | ${c("seo")} | ${(a("largest-contentful-paint")/1000).toFixed(1)} | ${Math.round(a("total-blocking-time"))} | ${a("cumulative-layout-shift").toFixed(3)} | ${fa.length} |`);}
out.push("","Corridas por página: 3 (se reporta la mediana). Perfil: móvil por defecto de Lighthouse 12.2.1 (Moto G Power, 4G lenta, CPU x4).","","## Auditorías de accesibilidad que fallan","","| Auditoría | Elementos afectados | Páginas |","|---|---|---|");
for(const [id,v] of Object.entries(fails))out.push(`| ${v.t} (\`${id}\`) | ${v.n} | ${v.p.join(", ")} |`);
console.log(out.join("\n"));
