/* Puente de Cloudflare Pages: todo /api/* sigue corriendo en Vercel (las funciones de api/ no cambian).
   Se pasa la IP real firmada con CF_PROXY_KEY para que los límites por IP de api/_lib.js sigan siendo por persona. */
const ORIGEN = 'https://synthz-style.vercel.app';

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const h = new Headers(request.headers);
  for (const k of [...h.keys()]) if (k.startsWith('x-sz-proxy') || k === 'x-sz-ip') h.delete(k);
  if (env.CF_PROXY_KEY) {
    h.set('x-sz-proxy', env.CF_PROXY_KEY);
    h.set('x-sz-ip', request.headers.get('cf-connecting-ip') || '');
  }
  return fetch(ORIGEN + url.pathname + url.search, {
    method: request.method,
    headers: h,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual'
  });
}
