/* /api/* en Cloudflare Pages: corre las mismas funciones de api/ (las de Vercel) aquí mismo, sin cambiarlas.
   · Necesita en Pages → Settings → Runtime: compatibility flag «nodejs_compat» (usan node:crypto y Buffer).
   · Las variables (KV_REST_API_URL, SYNTHZ_SECRET, llaves…) van en Pages → Settings → Variables and Secrets.
   · Mientras falte la base de datos (KV_REST_API_URL), sigue el puente de antes hacia Vercel: nada se cae a mitad de la mudanza. */
const ORIGEN = 'https://synthz-style.vercel.app';
const RUTAS = {
  ai:() => import('../../api/ai.js'), alias:() => import('../../api/alias.js'), auth:() => import('../../api/auth.js'),
  chat:() => import('../../api/chat.js'), chats:() => import('../../api/chats.js'), config:() => import('../../api/config.js'),
  csp:() => import('../../api/csp.js'), health:() => import('../../api/health.js'), help:() => import('../../api/help.js'),
  me:() => import('../../api/me.js'), teams:() => import('../../api/teams.js'), trial:() => import('../../api/trial.js')
};

/* las funciones leen process.env al cargarse: se llena con las variables de Pages antes del primer import */
let listo = false;
function prepararEnv(env){
  if (listo) return;
  for (const [k, v] of Object.entries(env)) if (typeof v === 'string') process.env[k] = v;
  listo = true;
}

function puente(request, env){
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

export async function onRequest({ request, env, params }) {
  if (!(env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL)) return puente(request, env);
  const p = [].concat(params.path || []);
  const cargar = p.length === 1 && Object.hasOwn(RUTAS, p[0]) ? RUTAS[p[0]] : null;
  if (!cargar) return new Response(JSON.stringify({ error: 'No existe.' }), { status: 404, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
  prepararEnv(env);
  /* la IP la pone Cloudflare (cf-connecting-ip) y nadie la puede inventar; _lib.js la lee de x-real-ip */
  const h = new Headers(request.headers);
  for (const k of [...h.keys()]) if (k.startsWith('x-sz-') || k === 'x-real-ip' || k === 'x-forwarded-for') h.delete(k);
  h.set('x-real-ip', request.headers.get('cf-connecting-ip') || 'x');
  const req = new Request(request, { headers: h });
  return (await cargar()).default.fetch(req);
}
