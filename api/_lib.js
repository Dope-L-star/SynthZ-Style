/* SynthZ · utilidades del servidor: Redis (Upstash), sesiones, contraseñas, Google (opcional) y cifrado.
   Los archivos que empiezan con "_" no se publican como rutas en Vercel. */
import crypto from 'node:crypto';

const R_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const R_TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
export const CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const SECRET = (process.env.SYNTHZ_SECRET || '').length >= 32 ? process.env.SYNTHZ_SECRET : '';
const CERTS = process.env.GOOGLE_CERTS_URL || 'https://www.googleapis.com/oauth2/v3/certs';

/* lo único obligatorio es la base de datos; Google y SYNTHZ_SECRET son opcionales */
export const missing = () => [!R_URL && 'KV_REST_API_URL', !R_TOK && 'KV_REST_API_TOKEN'].filter(Boolean);
export const ready = () => missing().length === 0;
export const hasGoogle = () => !!CLIENT_ID;
export const secretFromEnv = () => !!SECRET;

/* ---------- respuestas ---------- */
const BASE_H = { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', 'x-content-type-options':'nosniff' };
export const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers:BASE_H });
export const fail = (status, error, extra) => json(Object.assign({ error }, extra || {}), status);
export async function body(req, max = 1_500_000){
  const t = await req.text();
  if (t.length > max) throw Object.assign(new Error('Lo que enviaste es demasiado grande.'), { status:413 });
  if (!t) return {};
  try{ return JSON.parse(t); }catch(e){ throw Object.assign(new Error('JSON inválido.'), { status:400 }); }
}
/* envuelve cada ruta: configuración, errores y métodos */
export function route(handlers){
  return { async fetch(req){
    try{
      if (!ready()) return fail(503, 'Las cuentas de SynthZ aún no están configuradas en el servidor.', { missing:missing() });
      const h = handlers[req.method]; if (!h) return fail(405, 'Método no permitido.');
      await loadKey();
      return await h(req);
    }catch(e){
      const s = e && e.status ? e.status : 500;
      if (s >= 500) console.error('[synthz]', e);
      return fail(s, s >= 500 ? 'Algo falló en el servidor. Intenta de nuevo.' : e.message);
    }
  } };
}

/* ---------- Redis por REST (Upstash) ---------- */
export async function redis(...cmd){
  const r = await fetch(R_URL, { method:'POST', headers:{ Authorization:'Bearer ' + R_TOK, 'content-type':'application/json' }, body:JSON.stringify(cmd) });
  const d = await r.json().catch(() => ({}));
  if (d.error) throw new Error('Redis: ' + d.error);
  return d.result;
}
export async function pipe(cmds){
  if (!cmds.length) return [];
  const r = await fetch(R_URL.replace(/\/$/, '') + '/pipeline', { method:'POST', headers:{ Authorization:'Bearer ' + R_TOK, 'content-type':'application/json' }, body:JSON.stringify(cmds) });
  const d = await r.json().catch(() => []);
  if (!Array.isArray(d)) throw new Error('Redis: respuesta inesperada');
  const bad = d.find(x => x && x.error); if (bad) throw new Error('Redis: ' + bad.error);
  return d.map(x => x.result);
}
export const getJ = async k => { const v = await redis('GET', k); try{ return v ? JSON.parse(v) : null; }catch(e){ return null; } };
export const setJ = (k, v, ex) => ex ? redis('SET', k, JSON.stringify(v), 'EX', ex) : redis('SET', k, JSON.stringify(v));

/* ---------- utilidades ---------- */
export const sha = s => crypto.createHash('sha256').update(String(s)).digest('base64url');
export const rid = (n = 12) => crypto.randomBytes(n).toString('base64url');
export const today = () => new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);   /* día en Colombia (UTC-5) */
export const cleanEmail = e => String(e || '').trim().toLowerCase();
export const okEmail = e => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e);
export const str = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

/* límite de peticiones: n por ventana de s segundos */
export async function limit(key, n, s){
  const [c] = await pipe([['INCR', 'rl:' + key], ['EXPIRE', 'rl:' + key, String(s), 'NX']]);
  if (+c > n) throw Object.assign(new Error('Vas muy rápido. Espera un momento e intenta de nuevo.'), { status:429 });
}

/* ---------- cifrado de llaves (AES-256-GCM) ---------- */
/* Si no pusiste SYNTHZ_SECRET, SynthZ crea una clave al azar la primera vez y la guarda en tu base de datos.
   Así funciona sin configurar nada; con SYNTHZ_SECRET la clave vive fuera de la base (más seguro). */
let KEY = null;
async function loadKey(){
  if (KEY) return KEY;
  let s = SECRET;
  if (!s){
    await redis('SET', 'cfg:secret', crypto.randomBytes(48).toString('base64url'), 'NX');
    s = await redis('GET', 'cfg:secret');
    if (!s) throw new Error('No pude preparar la clave de cifrado.');
  }
  KEY = crypto.createHash('sha256').update('synthz:v1:' + s).digest();
  return KEY;
}
const AKEY = () => { if (!KEY) throw new Error('clave de cifrado sin cargar'); return KEY; };
export function enc(text){
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', AKEY(), iv);
  const ct = Buffer.concat([c.update(String(text), 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), ct].map(b => b.toString('base64url')).join('.');
}
export function dec(blob){
  const [iv, tag, ct] = String(blob || '').split('.').map(x => Buffer.from(x || '', 'base64url'));
  const d = crypto.createDecipheriv('aes-256-gcm', AKEY(), iv); d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString('utf8');
}

/* ---------- contraseñas: scrypt con sal, comparación en tiempo constante ---------- */
const scryptP = (pass, salt) => new Promise((ok, no) => crypto.scrypt(String(pass).normalize('NFKC'), salt, 32, { N:16384, r:8, p:1, maxmem:64 * 1024 * 1024 }, (e, k) => e ? no(e) : ok(k)));
export async function hashPass(pass){ const salt = crypto.randomBytes(16); return 's1$' + salt.toString('base64url') + '$' + (await scryptP(pass, salt)).toString('base64url'); }
export async function checkPass(pass, stored){
  const [v, salt, h] = String(stored || '').split('$');
  const want = v === 's1' && h ? Buffer.from(h, 'base64url') : crypto.randomBytes(32);
  const got = await scryptP(pass, salt ? Buffer.from(salt, 'base64url') : crypto.randomBytes(16));   /* siempre calcula: no revela si el usuario existe */
  return v === 's1' && got.length === want.length && crypto.timingSafeEqual(got, want);
}
export const cleanUser = u => String(u || '').trim().replace(/^@/, '').toLowerCase();
export const okUser = u => /^[a-z0-9_.]{3,20}$/.test(u) && !/^[._]|[._]$|\.\./.test(u);
/* código de recuperación: 16 caracteres fáciles de copiar (sin 0/O ni 1/I) */
export function recoveryCode(){ const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = crypto.randomBytes(16); let s = ''; for (let i = 0; i < 16; i++){ s += A[b[i] % A.length]; if (i % 4 === 3 && i < 15) s += '-'; } return s; }
export const codeHash = c => sha('rc:' + String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''));
export const sameHash = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
export async function endAllSessions(sub){ const all = await redis('SMEMBERS', 'ss:' + sub); await pipe([].concat((all || []).map(h => ['DEL', 's:' + h]), [['DEL', 'ss:' + sub]])); }

/* ---------- Google: verificación completa del token (firma RS256 + aud + iss + exp) ---------- */
let jwks = null, jwksExp = 0;
async function googleKeys(force){
  if (!force && jwks && Date.now() < jwksExp) return jwks;
  const r = await fetch(CERTS); const d = await r.json();
  const ma = /max-age=(\d+)/.exec(r.headers.get('cache-control') || '');
  jwks = Array.isArray(d.keys) ? d.keys : []; jwksExp = Date.now() + (ma ? +ma[1] * 1000 : 3600e3);
  return jwks;
}
export async function verifyGoogle(token){
  const bad = m => Object.assign(new Error(m || 'No pude verificar tu cuenta de Google. Intenta de nuevo.'), { status:401 });
  const p = String(token || '').split('.'); if (p.length !== 3) throw bad();
  let head, claims;
  try{ head = JSON.parse(Buffer.from(p[0], 'base64url')); claims = JSON.parse(Buffer.from(p[1], 'base64url')); }catch(e){ throw bad(); }
  if (head.alg !== 'RS256' || !head.kid) throw bad();
  let k = (await googleKeys(false)).find(x => x.kid === head.kid);
  if (!k) k = (await googleKeys(true)).find(x => x.kid === head.kid);
  if (!k) throw bad();
  const ok = crypto.verify('RSA-SHA256', Buffer.from(p[0] + '.' + p[1]), crypto.createPublicKey({ key:k, format:'jwk' }), Buffer.from(p[2], 'base64url'));
  if (!ok) throw bad();
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss)) throw bad();
  if (claims.aud !== CLIENT_ID) throw bad();
  if (!claims.exp || claims.exp * 1000 < Date.now()) throw bad('Tu inicio de sesión expiró. Intenta de nuevo.');
  if (!claims.sub) throw bad();
  return claims;
}

/* ---------- sesiones propias de SynthZ ---------- */
const SESS_TTL = 60 * 60 * 24 * 30;
export async function newSession(sub){
  const token = rid(32), h = sha(token);
  await pipe([['SET', 's:' + h, sub, 'EX', String(SESS_TTL)], ['SADD', 'ss:' + sub, h]]);
  return token;
}
export function bearer(req){ const a = req.headers.get('authorization') || ''; return a.startsWith('Bearer ') ? a.slice(7).trim() : ''; }
export async function auth(req, optional){
  const t = bearer(req);
  const sub = t && t.length > 20 ? await redis('GET', 's:' + sha(t)) : null;
  if (!sub){ if (optional) return null; throw Object.assign(new Error('Tu sesión cerró. Vuelve a entrar.'), { status:401 }); }
  const user = await getJ('u:' + sub);
  if (!user){ if (optional) return null; throw Object.assign(new Error('Tu cuenta ya no existe.'), { status:401 }); }
  return user;
}
export async function endSession(req){ const t = bearer(req); if (!t) return; const h = sha(t), sub = await redis('GET', 's:' + h); await pipe([['DEL', 's:' + h]].concat(sub ? [['SREM', 'ss:' + sub, h]] : [])); }

/* ---------- SynXCoin's en la nube: una fila por dispositivo (hash lg:<sub>) ----------
   Cada dispositivo sube SOLO su fila (y la fila «legacy» de versiones viejas). El servidor junta cada fila con la que
   ya tenía tomando el mayor valor (las filas solo crecen), así que subir dos veces no duplica y un dispositivo nunca
   borra lo de otro. «_ep» es la época: si alguien reinicia los contadores, las filas de épocas viejas se ignoran. */
const nn = v => (Number.isFinite(+v) && +v > 0) ? Math.min(Math.round(+v), 1e13) : 0;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export function cleanLedgerRow(r){
  const out = {};
  if (!r || typeof r !== 'object') return out;
  Object.keys(r).slice(0, 10).forEach(pid => {
    if (!/^[a-z][a-z0-9_-]{1,20}$/.test(pid) || !r[pid] || typeof r[pid] !== 'object') return;
    const s = r[pid], o = { p:nn(s.p), c:nn(s.c), r:nn(s.r), e:nn(s.e) };
    ['days', 'de', 'rd', 'fd'].forEach(m => { o[m] = {}; const src = s[m]; if (src && typeof src === 'object') Object.keys(src).filter(d => DAY.test(d)).sort().slice(-400).forEach(d => { const v = nn(src[d]); if (v) o[m][d] = v; }); });
    out[pid] = o;
  });
  return out;
}
export function mergeLedgerRow(a, b){
  const out = Object.assign({}, a);
  Object.keys(b).forEach(pid => {
    const x = a[pid], y = b[pid]; if (!x){ out[pid] = y; return; }
    const o = { p:Math.max(x.p, y.p), c:Math.max(x.c, y.c), r:Math.max(x.r, y.r), e:Math.max(x.e, y.e) };
    ['days', 'de', 'rd', 'fd'].forEach(m => { o[m] = Object.assign({}, x[m]); Object.keys(y[m]).forEach(d => { o[m][d] = Math.max(o[m][d] || 0, y[m][d]); }); });
    out[pid] = o;
  });
  return out;
}
export async function getLedger(sub){
  const flat = await redis('HGETALL', 'lg:' + sub) || [];
  const L = { ep:0, dev:{} };
  for (let i = 0; i + 1 < flat.length; i += 2){
    if (flat[i] === '_ep') L.ep = +flat[i + 1] || 0;
    else { try{ L.dev[flat[i]] = JSON.parse(flat[i + 1]); }catch(e){} }
  }
  return L;
}
export async function putLedger(sub, L){
  const key = 'lg:' + sub, ep = nn(L && L.ep);
  let cur = +(await redis('HGET', key, '_ep')) || 0;
  if (ep > cur){ await pipe([['DEL', key], ['HSET', key, '_ep', String(ep)]]); cur = ep; }   /* alguien reinició: época nueva */
  if (ep < cur) return { stale:true };                                                          /* filas de antes del reinicio: no cuentan */
  const ids = Object.keys((L && L.dev) || {}).filter(id => /^[\w-]{1,40}$/.test(id) && id !== '_ep').slice(0, 3);
  if (!ids.length) return { ok:true };
  const prev = await redis('HMGET', key, ...ids);
  await pipe(ids.map((id, i) => { let old = {}; try{ old = prev[i] ? JSON.parse(prev[i]) : {}; }catch(e){} return ['HSET', key, id, JSON.stringify(mergeLedgerRow(cleanLedgerRow(old), cleanLedgerRow(L.dev[id])))]; }));
  return { ok:true };
}

/* ---------- chats en la nube: guardar los que cambiaron y BORRAR de verdad los borrados ---------- */
const MAX_ONE = 400_000, MAX_KEYS = 400;
export const okChatKey = k => typeof k === 'string' && k.length < 300 && /^openrouter::./.test(k);
export async function saveChats(sub, b){
  const cmds = [];
  const del = (Array.isArray(b.del) ? b.del : []).filter(okChatKey).slice(0, 300);
  if (del.length) cmds.push(['HDEL', 'c:' + sub, ...del]);
  const items = (Array.isArray(b.items) ? b.items : []).filter(x => x && okChatKey(x.k) && Array.isArray(x.data)).slice(0, 40);
  if (items.length){
    const n = await redis('HLEN', 'c:' + sub);
    if (+n + items.length > MAX_KEYS + del.length) throw Object.assign(new Error('Tienes demasiadas conversaciones guardadas. Borra algunas viejas.'), { status:413 });
    for (const it of items){ const s = JSON.stringify(it.data); if (s.length > MAX_ONE) throw Object.assign(new Error('Una conversación es demasiado larga para guardarla en la nube.'), { status:413 }); cmds.push(['HSET', 'c:' + sub, it.k, s]); }
  }
  await pipe(cmds);
  return { saved:items.length, deleted:del.length };
}

/* ---------- perfil público mínimo (lo que ven tus compañeros de equipo) ---------- */
export async function publicOf(sub){
  const [u, p] = await Promise.all([getJ('u:' + sub), getJ('p:' + sub)]);
  if (!u) return { sub, name:'Cuenta borrada', email:'', handle:'' };
  return { sub, email:u.email || '', username:u.username || '', handle:u.username ? '@' + u.username : (u.email || ''), name:(p && p.name) || u.name || u.email, picture: p && p.avatar && p.avatar.type === 'google' ? u.picture || '' : '', avatar:(p && p.avatar) || null, color:(p && p.color) || '' };
}
