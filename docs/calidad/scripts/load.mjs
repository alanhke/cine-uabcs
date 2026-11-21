// Prueba de carga: N usuarios virtuales concurrentes durante D segundos por endpoint; reporta p50/p95/p99.
const VU=20, D=30_000, B="http://localhost:3000";
const eps=["/api/funciones/192141","/api/funciones/192141/butacas","/api/compras/900001"];
const pct=(a,p)=>a[Math.min(a.length-1,Math.ceil(p/100*a.length)-1)];
const rows=["| Endpoint | Peticiones | Errores | p50 (ms) | p95 (ms) | p99 (ms) | Req/s |","|---|---|---|---|---|---|---|"];
for(const ep of eps){ for(let i=0;i<5;i++) await fetch(B+ep).then(r=>r.arrayBuffer()); // calentamiento
  const lat=[];let err=0;const end=Date.now()+D;
  await Promise.all(Array.from({length:VU},async()=>{while(Date.now()<end){const t=performance.now();try{const r=await fetch(B+ep);await r.arrayBuffer();if(!r.ok)err++;}catch{err++}lat.push(performance.now()-t);}}));
  lat.sort((a,b)=>a-b);rows.push(`| GET ${ep} | ${lat.length} | ${err} | ${Math.round(pct(lat,50))} | ${Math.round(pct(lat,95))} | ${Math.round(pct(lat,99))} | ${(lat.length/(D/1000)).toFixed(1)} |`);}
console.log(`Configuración: ${VU} usuarios virtuales concurrentes, ${D/1000} s por endpoint, servidor local \`next start\` (build de producción) contra TiDB Cloud.\n`);
console.log(rows.join("\n"));
