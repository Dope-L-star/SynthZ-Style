/* /api/* en Cloudflare Pages. Las funciones de api/ son las mismas que corren en Vercel (reciben un Request y devuelven un Response):
   aquí solo se les presta el entorno (process.env) y la IP real.
   - Si Cloudflare tiene las llaves de Redis (KV_REST_API_URL o UPSTASH_REDIS_REST_URL), el motor corre aquí.
   - Si no, o con API_EN_VERCEL=1 (para volver atrás al instante), se reenvía a Vercel con la IP firmada con CF_PROXY_KEY.
   - Las contraseñas usan scrypt (~100 ms de procesador) y el plan gratis de Workers da 10 ms: esas llamadas siguen en Vercel
     hasta que se ponga API_TODO_EN_CLOUDFLARE=1 (plan Workers de pago). */
const VERCEL = 'https://synthz-style.vercel.app';

const RUTAS = {
  ai: () => import('../../api/ai.js'),
  alias: () => import('../../api/alias.js'),
  auth: () => import('../../api/auth.js'),
  chat: () => import('../../api/chat.js'),
  chats: () => import('../../api/chats.js'),
  config: () => import('../../api/config.js'),
  csp: () => import('../../api/csp.js'),
  health: () => import('../../api/health.js'),
  help: () => import('../../api/help.js'),
  me: () => import('../../api/me.js'),
  teams: () => import('../../api/teams.js'),
  trial: () => import('../../api/trial.js')
};
/* modos de /api/auth que calculan o comprueban una contraseña */
const CON_CONTRASENA = new Set(['signup', 'login', 'reset', 'change', 'code', 'addpass']);

let pasado = false;
function prestarEntorno(env) {
  if (pasado) return;
  for (const [k, v] of Object.entries(env)) if (typeof v === 'string' && !(k in process.env)) process.env[k] = v;
  pasado = true;
}

async function pesada(nombre, request) {
  if (nombre === 'me') return request.method === 'DELETE';
  if (nombre !== 'auth' || request.method !== 'POST') return false;
  try { return CON_CONTRASENA.has(String((JSON.parse((await request.clone().text()).slice(0, 8000)) || {}).mode || '')); }
  catch (e) { return false; }
}

function aVercel(request, env) {
  const url = new URL(request.url);
  const h = new Headers(request.headers);
  for (const k of [...h.keys()]) if (k.startsWith('x-sz-proxy') || k === 'x-sz-ip') h.delete(k);
  if (env.CF_PROXY_KEY) {
    h.set('x-sz-proxy', env.CF_PROXY_KEY);
    h.set('x-sz-ip', request.headers.get('cf-connecting-ip') || '');
  }
  return fetch(VERCEL + url.pathname + url.search, {
    method: request.method,
    headers: h,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual'
  });
}

export async function onRequest({ request, env, params }) {
  const nombre = String((params.path || [])[0] || '');
  const aqui = !!(env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL) && env.API_EN_VERCEL !== '1';
  if (!aqui || (env.API_TODO_EN_CLOUDFLARE !== '1' && await pesada(nombre, request))) return aVercel(request, env);
  const cargar = RUTAS[nombre];
  if (!cargar) return new Response(JSON.stringify({ ok: false, error: 'No existe.' }), { status: 404, headers: { 'content-type': 'application/json; charset=utf-8' } });
  prestarEntorno(env);
  const h = new Headers(request.headers);
  for (const k of ['x-sz-proxy', 'x-sz-ip', 'x-forwarded-for']) h.delete(k);
  h.set('x-real-ip', request.headers.get('cf-connecting-ip') || 'x');   /* api/_lib.js ipOf lee x-real-ip (en Vercel lo pone la plataforma; aquí no se acepta el del cliente) */
  const mod = (await cargar()).default;
  return mod.fetch(new Request(request, { headers: h }));
}
