import http from 'node:http';
import crypto from 'node:crypto';
/* ---- Redis falso con la API REST de Upstash ---- */
const db = new Map(), sets = new Map(), hashes = new Map(), exp = new Map();
const S = k => sets.get(k) || (sets.set(k, new Set()), sets.get(k)), Hh = k => hashes.get(k) || (hashes.set(k, new Map()), hashes.get(k));
let CMDS = 0;
const LS = new Map();
function run([c, ...a]){ CMDS++;
  c = c.toUpperCase();
  switch(c){
    case 'GET': return db.has(a[0]) ? db.get(a[0]) : null;
    case 'SET': if (a.slice(2).map(x => String(x).toUpperCase()).includes('NX') && db.has(a[0])) return null; db.set(a[0], String(a[1])); return 'OK';
    case 'DEL': { let n = 0; a.forEach(k => { if (db.delete(k) | sets.delete(k) | hashes.delete(k) | LS.delete(k)) n++; }); return n; }
    case 'INCR': { const v = (+db.get(a[0]) || 0) + 1; db.set(a[0], String(v)); return v; }
    case 'INCRBY': { const v = (+db.get(a[0]) || 0) + +a[1]; db.set(a[0], String(v)); return v; }
    case 'EXPIRE': exp.set(a[0], a[1]); return 1;
    case 'SADD': { const s = S(a[0]); a.slice(1).forEach(x => s.add(x)); return 1; }
    case 'SREM': { const s = S(a[0]); a.slice(1).forEach(x => s.delete(x)); return 1; }
    case 'SMEMBERS': return [...S(a[0])];
    case 'HSET': Hh(a[0]).set(a[1], a[2]); return 1;
    case 'HDEL': { const h = Hh(a[0]); a.slice(1).forEach(x => h.delete(x)); return 1; }
    case 'HGET': return Hh(a[0]).has(a[1]) ? Hh(a[0]).get(a[1]) : null;
    case 'HGETALL': return [].concat(...[...Hh(a[0])].map(([k, v]) => [k, v]));
    case 'HSTRLEN': return Hh(a[0]).has(a[1]) ? Buffer.byteLength(Hh(a[0]).get(a[1])) : 0;
    case 'LPUSH': { const L = LS.get(a[0]) || []; a.slice(1).forEach(x => L.unshift(x)); LS.set(a[0], L); return L.length; }
    case 'LTRIM': { const L = LS.get(a[0]) || []; LS.set(a[0], L.slice(+a[1], +a[2] + 1)); return 'OK'; }
    case 'LRANGE': { const L = LS.get(a[0]) || []; return L.slice(+a[1], +a[2] < 0 ? undefined : +a[2] + 1); }
    case 'LLEN': return (LS.get(a[0]) || []).length;
    case 'EXISTS': return a.filter(k => db.has(k) || sets.has(k) || hashes.has(k)).length;
    case 'DECR': { const v = (+db.get(a[0]) || 0) - 1; db.set(a[0], String(v)); return v; }
    case 'HKEYS': return [...Hh(a[0]).keys()];
    case 'HLEN': return Hh(a[0]).size;
    case 'HMGET': return a.slice(1).map(f => Hh(a[0]).has(f) ? Hh(a[0]).get(f) : null);
    default: throw new Error('cmd ' + c);
  }
}
/* ---- Google falso: llaves RSA y certificados ---- */
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength:2048 });
const jwk = Object.assign(publicKey.export({ format:'jwk' }), { kid:'k1', alg:'RS256', use:'sig' });
const idToken = (sub, email, extra = {}) => {
  const h = Buffer.from(JSON.stringify({ alg:'RS256', kid:'k1', typ:'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify(Object.assign({ iss:'https://accounts.google.com', aud:'test-client.apps.googleusercontent.com', sub, email, email_verified:true, name:email.split('@')[0], picture:'https://x/p.png', exp:Math.floor(Date.now() / 1000) + 3600 }, extra))).toString('base64url');
  return h + '.' + p + '.' + crypto.sign('RSA-SHA256', Buffer.from(h + '.' + p), privateKey).toString('base64url');
};
/* ---- OpenRouter falso ---- */
let lastAuth = '';
const srv = http.createServer((req, res) => {
  let b = ''; req.on('data', d => b += d); req.on('end', () => {
    if (req.url === '/certs'){ res.setHeader('cache-control', 'max-age=60'); return res.end(JSON.stringify({ keys:[jwk] })); }
    if (req.url === '/redis/pipeline'){ const out = JSON.parse(b).map(c => { try{ return { result:run(c) }; }catch(e){ return { error:e.message }; } }); return res.end(JSON.stringify(out)); }
    if (req.url === '/redis'){ try{ return res.end(JSON.stringify({ result:run(JSON.parse(b)) })); }catch(e){ return res.end(JSON.stringify({ error:e.message })); } }
    if (req.url === '/or/key'){ res.statusCode = req.headers.authorization === 'Bearer sk-or-v1-buenaLLAVE123456' ? 200 : 401; return res.end('{}'); }
    if (req.url === '/or/chat/completions'){ lastAuth = req.headers.authorization; res.setHeader('content-type', 'text/event-stream'); res.write('data: {"choices":[{"delta":{"content":"Hola "}}]}\n\n'); res.write('data: {"choices":[{"delta":{"content":"equipo"}}]}\n\n'); res.end('data: {"choices":[],"usage":{"prompt_tokens":30,"completion_tokens":12}}\n\ndata: [DONE]\n\n'); return; }
    res.statusCode = 404; res.end('{}');
  });
});
await new Promise(r => srv.listen(8799, r));
Object.assign(process.env, { KV_REST_API_URL:'http://localhost:8799/redis', KV_REST_API_TOKEN:'t', OPENROUTER_URL:'http://localhost:8799/or' });
delete process.env.GOOGLE_CLIENT_ID; delete process.env.SYNTHZ_SECRET;
const R = '/home/claude/site/api/';
const H = { auth:(await import(R + 'auth.js')).default, me:(await import(R + 'me.js')).default, chats:(await import(R + 'chats.js')).default, teams:(await import(R + 'teams.js')).default, chat:(await import(R + 'chat.js')).default };
let ipn = 0;
const call = async (h, method, path, body, tok) => { const r = await H[h].fetch(new Request('http://synthz.test/api/' + path, { method, headers:Object.assign({ 'content-type':'application/json', 'x-forwarded-for':'10.0.' + ((ipn >> 8) & 255) + '.' + (ipn++ & 255) }, tok ? { authorization:'Bearer ' + tok } : {}), body:body ? JSON.stringify(body) : undefined })); const t = await r.text(); let d; try{ d = JSON.parse(t); }catch(e){ d = t; } return { s:r.status, d }; };
const cost = async (label, fn) => { const c0 = CMDS, t0 = performance.now(); const r = await fn(); console.log(label.padEnd(44), String(CMDS - c0).padStart(3), 'comandos ·', (performance.now() - t0).toFixed(0).padStart(4), 'ms'); return r; };
const day = '2026-10-12';
const row = n => ({ openrouter:{ p:n, c:n, r:1, e:0, days:{ [day]:n * 2 }, de:{}, rd:{ [day]:1 }, fd:{ [day]:1 } } });
console.log('--- costo por acción (Redis falso local; en Upstash cada viaje suma ~5-40 ms de red) ---');
const SU = await cost('crear cuenta (usuario y contraseña)', () => call('auth', 'POST', 'auth', { mode:'signup', user:'carga0', pass:'clave-de-carga-1' }));
await cost('entrar', () => call('auth', 'POST', 'auth', { mode:'login', user:'carga0', pass:'clave-de-carga-1' }));
const tk = SU.d.token;
await cost('abrir la página (GET /api/me)', () => call('me', 'GET', 'me', null, tk));
await cost('sincronizar preferencias + SynXCoin\'s', () => call('me', 'PUT', 'me', { prefs:{ fav:[], t:1 }, ledger:{ ep:0, dev:{ dA:row(10) } } }, tk));
await cost('subir 1 chat cambiado', () => call('chats', 'POST', 'chats', { items:[{ k:'openrouter::or:x', data:[{ role:'user', content:'hola' }] }] }, tk));
await cost('AHORA: una sync con chat (por mensaje)', () => call('me', 'PUT', 'me', { prefs:{ fav:[], t:2 }, ledger:{ ep:0, dev:{ dA:row(12) } }, chats:{ items:[{ k:'openrouter::or:x', data:[{ role:'user', content:'hola' }, { role:'assistant', content:'¿qué tal?' }] }], del:[] } }, tk));
await cost('AHORA: + filas de otros dispositivos (1/min)', () => call('me', 'PUT', 'me', { prefs:{ fav:[], t:3 }, ledger:{ ep:0, dev:{ dA:row(14) } }, wantLedger:true }, tk));
await cost('ver equipos', () => call('teams', 'GET', 'teams', null, tk));
/* tiempo de CPU de las contraseñas */
const t0 = performance.now(); for (let i = 0; i < 10; i++) await call('auth', 'POST', 'auth', { mode:'login', user:'carga0', pass:'clave-de-carga-1' });
console.log('scrypt (entrar) promedio:', ((performance.now() - t0) / 10).toFixed(0), 'ms por inicio de sesión');
/* carga concurrente: 100 usuarios sincronizando 10 veces a la vez */
console.log('--- carga: 100 usuarios × 10 sincronizaciones simultáneas ---');
const users = [];
for (let i = 0; i < 100; i++) users.push((await call('auth', 'POST', 'auth', { mode:'signup', user:'u' + i + 'x', pass:'clave-de-carga-1' })).d.token);
const lat = [], c0 = CMDS; let fails = 0; const T0 = performance.now();
await Promise.all(users.map(async tok => { for (let k = 1; k <= 10; k++){ const a = performance.now(); const r = await call('me', 'PUT', 'me', { prefs:{ t:k }, ledger:{ ep:0, dev:{ dev1:row(k * 10) } } }, tok); lat.push(performance.now() - a); if (r.s !== 200) fails++; } }));
lat.sort((a, b) => a - b);
console.log('peticiones: 1000 · fallidas:', fails, '· tiempo total:', ((performance.now() - T0) / 1000).toFixed(2), 's · p50', lat[500].toFixed(0), 'ms · p95', lat[950].toFixed(0), 'ms · comandos Redis:', CMDS - c0);
const chk = await call('me', 'GET', 'me', null, users[7]);
console.log('consistencia: el contador quedó en', chk.d.ledger.dev.dev1.openrouter.p, '(esperado 100, sin duplicar)');
/* el límite de peticiones frena a quien abusa */
let lim = 0; for (let i = 0; i < 70; i++){ const r = await call('me', 'PUT', 'me', { prefs:{ t:i } }, users[0]); if (r.s === 429) lim++; }
console.log('70 sincronizaciones en un minuto de un mismo usuario → frenadas:', lim);
srv.close();
