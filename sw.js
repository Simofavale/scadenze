/* Scadenze · funziona anche senza rete. Prima prova la rete (così gli aggiornamenti arrivano subito), poi la copia salvata. */
const V="scadenze-v1";
const FILES=["./","index.html","styles.css","core.js","sync.js","app.js","manifest.webmanifest","icone/icon-192.png","icone/apple-touch-icon.png","icone/mac-512.png","icone/favicon.svg"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET"||u.origin!==location.origin)return;
e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match("index.html"))))});
