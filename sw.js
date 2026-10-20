/* SynthZ como app: guarda una copia de la página para abrir rápido y para cuando no hay internet.
   Siempre intenta primero lo más nuevo de internet; nunca guarda tus chats ni nada de /api. */
const V = 'synthz-v2.1';
const BASE = ['/chat.html', '/index.html', '/core.js', '/core.css', '/chat.js', '/chat.css', '/index.js', '/index.css', '/icon.svg', '/media/icon-192.png', '/offline.html'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(BASE.map(u => c.add(new Request(u, { cache:'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname.startsWith('/api/') || u.pathname === '/sw.js' || /pulsem|pulso/.test(u.pathname)) return;
  e.respondWith((async () => {
    try{
      const res = await fetch(r);
      if (res.ok && res.type === 'basic'){ const c = await caches.open(V); c.put(r, res.clone()).catch(() => {}); }
      return res;
    }catch(err){
      const hit = await caches.match(r, { ignoreSearch:r.mode === 'navigate' });
      if (hit) return hit;
      if (r.mode === 'navigate') return (await caches.match('/offline.html')) || Response.error();
      return Response.error();
    }
  })());
});
