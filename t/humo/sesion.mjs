/* Prueba de la sesión en cookie (v2.9.1), contra el api/auth.js y api/me.js reales con un Redis de mentira.
   Revisa: crear cuenta deja una cookie HttpOnly; con solo la cookie se entra; un dispositivo viejo (Bearer) pide su cookie;
   cerrar sesión borra la cookie y la sesión. No sale a internet.
   Se corre desde la raíz del repo:  node t/humo/sesion.mjs */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let fails = 0;
const check = (name, cond, why) => { if (cond) console.log('OK    ' + name); else { fails++; console.log('FALLO ' + name + ' — ' + String(why || 'no se cumple').slice(0, 300)); } };

/* ---------- Redis de mentira (REST de Upstash) ---------- */
const kv = new Map(), sets = new Map();
function run(c){
  const op = String(c[0]).toUpperCase(), k = String(c[1] ?? '');
  if (op === 'GET') return kv.has(k) ? kv.get(k) : null;
  if (op === 'SET'){ if (c.slice(3).map(x => String(x).toUpperCase()).includes('NX') && kv.has(k)) return null; kv.set(k, String(c[2])); return 'OK'; }
  if (op === 'DEL'){ let n = 0; for (const x of c.slice(1)){ if (kv.delete(String(x))) n++; if (sets.delete(String(x))) n++; } return n; }
  if (op === 'INCR' || op === 'INCRBY'){ const n = (+kv.get(k) || 0) + (op === 'INCR' ? 1 : +c[2]); kv.set(k, String(n)); return n; }
  if (op === 'EXPIRE' || op === 'PEXPIRE') return 1;
  if (op === 'SADD'){ const s = sets.get(k) || new Set(); c.slice(2).forEach(x => s.add(String(x))); sets.set(k, s); return 1; }
  if (op === 'SREM'){ const s = sets.get(k); if (s) c.slice(2).forEach(x => s.delete(String(x))); return 1; }
  if (op === 'SMEMBERS') return [...(sets.get(k) || [])];
  if (op === 'EXISTS') return kv.has(k) ? 1 : 0;
  if (op === 'TTL' || op === 'PTTL') return 100;
  return null;
}
process.env.KV_REST_API_URL = 'http://redis.test'; process.env.KV_REST_API_TOKEN = 't';
for (const k of ['SYNTHZ_SETUP_CODE', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']) delete process.env[k];
globalThis.fetch = async (url, o = {}) => {
  const u = String(url);
  if (!u.startsWith('http://redis.test')) return new Response('{}', { status:404 });
  const b = JSON.parse(o.body || '[]');
  const out = u.endsWith('/pipeline') ? b.map(c => ({ result:run(c) })) : { result:run(b) };
  return new Response(JSON.stringify(out), { headers:{ 'content-type':'application/json' } });
};

const auth = (await import(path.join(ROOT, 'api/auth.js'))).default;
const me = (await import(path.join(ROOT, 'api/me.js'))).default;
const req = (p, method, body, headers = {}) => new Request('https://synthz.test/api/' + p, { method, headers:Object.assign({ 'content-type':'application/json', 'x-real-ip':'10.0.0.' + (1 + Math.floor(Math.random() * 200)) }, headers), body:body ? JSON.stringify(body) : undefined });
const cookieOf = r => { const c = r.headers.get('set-cookie') || ''; const m = /__Host-szs=([^;]*)/.exec(c); return { raw:c, val:m ? m[1] : null }; };

/* crear cuenta */
const user = 'humo' + Math.random().toString(36).slice(2, 8);
const r1 = await auth.fetch(req('auth', 'POST', { mode:'signup', user, pass:'Una-clave-larga-de-prueba-9' }));
const d1 = await r1.json().catch(() => ({}));
const c1 = cookieOf(r1);
check('crear cuenta responde bien', r1.status === 200 && d1.user, r1.status + ' ' + JSON.stringify(d1));
check('crear cuenta deja la cookie HttpOnly; Secure; SameSite=Strict', c1.val && c1.val.length > 20 && /HttpOnly/.test(c1.raw) && /Secure/.test(c1.raw) && /SameSite=Strict/.test(c1.raw) && /Path=\//.test(c1.raw), c1.raw);
check('la respuesta avisa que hay cookie', d1.cookie === true);

/* solo con la cookie (y la marca corta que guarda la página) */
const r2 = await me.fetch(req('me', 'GET', null, { cookie:'__Host-szs=' + c1.val, authorization:'Bearer cabc123' }));
const d2 = await r2.json().catch(() => ({}));
check('con solo la cookie se entra a la cuenta', r2.status === 200 && d2.user && d2.user.username === user, r2.status + ' ' + JSON.stringify(d2).slice(0, 200));
const r3 = await me.fetch(req('me', 'GET', null, { authorization:'Bearer cabc123' }));
check('sin cookie ni sesión: 401', r3.status === 401, r3.status);

/* dispositivo viejo: tenía el token en el navegador y pide su cookie */
const r4 = await auth.fetch(req('auth', 'POST', { mode:'cookie' }, { authorization:'Bearer ' + d1.token }));
const c4 = cookieOf(r4);
check('un dispositivo viejo recibe su cookie', r4.status === 200 && c4.val === d1.token, r4.status + ' ' + c4.raw);
const r4b = await auth.fetch(req('auth', 'POST', { mode:'cookie' }, { authorization:'Bearer ' + 'x'.repeat(43) }));
check('una sesión falsa no recibe cookie', r4b.status === 401 && !cookieOf(r4b).val, r4b.status);

/* cerrar sesión */
const r5 = await auth.fetch(req('auth', 'DELETE', null, { cookie:'__Host-szs=' + c1.val }));
const c5 = cookieOf(r5);
check('cerrar sesión borra la cookie', r5.status === 200 && c5.val === '' && /Max-Age=0/.test(c5.raw), c5.raw);
const r6 = await me.fetch(req('me', 'GET', null, { cookie:'__Host-szs=' + c1.val }));
check('después de cerrar, la cookie vieja ya no sirve', r6.status === 401, r6.status);

console.log(fails ? '\n' + fails + ' prueba(s) fallaron.' : '\nTodo bien.');
process.exit(fails ? 1 : 0);
