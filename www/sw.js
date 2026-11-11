const V='habit-v3',SHELL=['./','index.html','js/ext.js','js/analytics.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.pathname.startsWith('/api/'))return;
e.respondWith(caches.match(e.request).then(h=>{const n=fetch(e.request).then(r=>{if(r.ok||r.type==='opaque')caches.open(V).then(c=>c.put(e.request,r.clone()));return r}).catch(()=>h);return h||n}))});
