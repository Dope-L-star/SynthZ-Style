/* /sintetico (los Sintéticos: HTML que crea la IA) lleva sus propias reglas abiertas y la directiva «sandbox».
   El archivo _headers de Pages no puede quitarle las reglas de «/*» (el «! Cabecera» tumba también las suyas),
   así que esta página se sirve desde aquí con sus cabeceras exactas: las de vercel.json, que arma cloudflare/preparar.mjs. */
import CABECERAS from '../cloudflare/generado/sintetico-cabeceras.js';

export async function onRequest({ request, env }) {
  const r = await env.ASSETS.fetch(request);
  if (!r.ok) return r;
  const h = new Headers(r.headers);
  for (const [k, v] of Object.entries(CABECERAS)) h.set(k, v);
  return new Response(r.body, { status: r.status, headers: h });
}
