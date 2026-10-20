/* SynthFlow · app instalable (v2.3).
   No guarda la página ni el código (así nunca te quedas con una versión vieja): todo se pide siempre a internet.
   Solo guarda una pantallita para cuando no hay conexión. */
const OFF = 'synthflow-off-v1';
self.addEventListener('install', e => { e.waitUntil(caches.open(OFF).then(c => c.add('/offline.html')).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== OFF) await caches.delete(k);   /* borra lo de versiones viejas */
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.mode !== 'navigate') return;          /* solo las páginas; lo demás va directo */
  e.respondWith(fetch(r).catch(async () => (await caches.match('/offline.html')) || new Response('Sin conexión', { status:503, headers:{ 'content-type':'text/plain; charset=utf-8' } })));
});
