import http from 'node:http';
import crypto from 'node:crypto';
/* ---- Redis falso con la API REST de Upstash ---- */
const db = new Map(), sets = new Map(), hashes = new Map(), exp = new Map();
const S = k => sets.get(k) || (sets.set(k, new Set()), sets.get(k)), Hh = k => hashes.get(k) || (hashes.set(k, new Map()), hashes.get(k));
const LS = new Map();
function run([c, ...a]){
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
Object.assign(process.env, { KV_REST_API_URL:'http://localhost:8799/redis', KV_REST_API_TOKEN:'t', OPENROUTER_URL:'http://localhost:8799/or', SYNTHZ_SETUP_CODE:'codigo-de-dueno-123', SYNTHZ_USER_MB:'0.5', SYNTHZ_SECRET:'A'.repeat(40) });
delete process.env.GOOGLE_CLIENT_ID;
const R = '/home/claude/site/api/';
const H = { auth:(await import(R + 'auth.js')).default, me:(await import(R + 'me.js')).default, chats:(await import(R + 'chats.js')).default, teams:(await import(R + 'teams.js')).default, csp:(await import(R + 'csp.js')).default };
const call = async (h, method, path, body, tok, ip) => { const r = await H[h].fetch(new Request('http://synthz.test/api/' + path, { method, headers:Object.assign({ 'content-type':'application/json', 'x-forwarded-for':ip || '7.7.7.' + Math.floor(Math.random() * 250) }, tok ? { authorization:'Bearer ' + tok } : {}), body:body ? JSON.stringify(body) : undefined })); const txt = await r.text(); let d; try{ d = JSON.parse(txt); }catch(e){ d = txt; } return { s:r.status, d }; };
const ok = (name, cond, extra) => console.log((cond ? 'OK   ' : 'FALLA') + ' ' + name + (extra ? '  ' + JSON.stringify(extra).slice(0, 200) : ''));
const sign = (user, pass, extra) => call('auth', 'POST', 'auth', Object.assign({ mode:'signup', user, pass }, extra || {}));

/* 1. cuentas reservadas del equipo */
let r = await sign('SammuerSynth', 'clave-del-dueno-1');
ok('reservada sin código → bloqueada', r.s === 403 && r.d.code === 'reserved', r.d);
ok('reservada con código malo → bloqueada', (await sign('sammuersynth', 'clave-del-dueno-1', { setup:'nop' })).s === 403);
r = await sign('sammuersynth', 'clave-del-dueno-1', { setup:'codigo-de-dueno-123' });
ok('reservada con el código → Dueño', r.s === 200 && r.d.user.role === 'owner', r.d.user);
const owner = r.d.token;
ok('el rango sale en /api/me', (await call('me', 'GET', 'me', null, owner)).d.user.role === 'owner');
r = await sign('cuentavieja', 'clave-vieja-12');
const oldSub = r.d.user.sub; db.delete('n:cuentavieja'); db.set('n:sammuerbusiness', oldSub); { const u = JSON.parse(db.get('u:' + oldSub)); u.username = 'sammuerbusiness'; db.set('u:' + oldSub, JSON.stringify(u)); }
ok('reclamar rango con código malo', (await call('auth', 'POST', 'auth', { mode:'claim', setup:'x' }, r.d.token)).s === 403);
ok('reclamar rango con el código → Staff', (await call('auth', 'POST', 'auth', { mode:'claim', setup:'codigo-de-dueno-123' }, r.d.token)).d.role === 'staff');
ok('una cuenta normal no puede reclamar', (await call('auth', 'POST', 'auth', { mode:'claim', setup:'codigo-de-dueno-123' }, (await sign('normalita', 'clave-normal-12')).d.token)).s === 400);

/* 2. nadie te bloquea desde otra conexión */
await sign('victima', 'sol-de-agosto-9');
let last; for (let i = 0; i < 12; i++) last = (await call('auth', 'POST', 'auth', { mode:'login', user:'victima', pass:'mala-' + i }, null, '6.6.6.6')).s;
ok('el atacante queda frenado', last === 429);
r = await call('auth', 'POST', 'auth', { mode:'login', user:'victima', pass:'sol-de-agosto-9' }, null, '1.1.1.1'); ok('la víctima entra desde su conexión', r.s === 200, r.d);

/* 3. contraseña vieja (s1) sube a s2 al entrar */
{
  const crypto = await import('node:crypto'), salt = crypto.randomBytes(16);
  const h = await new Promise(ok2 => crypto.scrypt('clave-antigua-1', salt, 32, { N:16384, r:8, p:1, maxmem:64 * 1024 * 1024 }, (e, k) => ok2(k)));
  const s = await sign('antigua', 'otra-clave-123'); const sub = s.d.user.sub;
  const pw = JSON.parse(db.get('pw:' + sub)); pw.h = 's1$' + salt.toString('base64url') + '$' + h.toString('base64url'); db.set('pw:' + sub, JSON.stringify(pw));
  r = await call('auth', 'POST', 'auth', { mode:'login', user:'antigua', pass:'clave-antigua-1' });
  ok('entra con la contraseña vieja y queda en s2', r.s === 200 && JSON.parse(db.get('pw:' + sub)).h.startsWith('s2$'));
  ok('y sigue entrando después', (await call('auth', 'POST', 'auth', { mode:'login', user:'antigua', pass:'clave-antigua-1' })).s === 200);
}

/* 4. espacio por usuario (0,5 MB en esta prueba) */
const big = n => [{ role:'user', content:'x'.repeat(n) }];
const qq = await sign('llena', 'luna-roja-77x'); console.log('alta llena', qq.s, JSON.stringify(qq.d).slice(0, 120)); const q = qq.d.token;
r = await call('chats', 'POST', 'chats', { items:[{ k:'openrouter::a', data:big(200000) }, { k:'openrouter::b', data:big(200000) }] }, q);
ok('guardar 0,4 MB', r.s === 200 && r.d.used > 400000, r.d);
r = await call('chats', 'POST', 'chats', { items:[{ k:'openrouter::c', data:big(200000) }] }, q);
ok('pasarse del espacio → 413 con mensaje claro', r.s === 413 && r.d.code === 'quota' && /lleno/.test(r.d.error), r.d);
r = await call('chats', 'POST', 'chats', { items:[{ k:'openrouter::a', data:big(10) }] }, q);
ok('achicar un chat libera espacio', r.s === 200 && r.d.used < 250000, r.d);
r = await call('chats', 'POST', 'chats', { del:['openrouter::b'] }, q);
const real = [...hashes.get('c:' + JSON.parse(db.get('n:llena') ? '"' + db.get('n:llena') + '"' : '""')) || new Map()].reduce((a, [, v]) => a + Buffer.byteLength(v), 0);
ok('borrar libera y el contador cuadra con lo guardado', r.d.used === real, { contador:r.d.used, real });
ok('el espacio sale en /api/me', (await call('me', 'GET', 'me', null, q)).d.space.max === 524288);

/* 5. cerrar sesión en todos lados */
const a1 = (await call('auth', 'POST', 'auth', { mode:'login', user:'llena', pass:'luna-roja-77x' })).d.token;
ok('cerrar en todos lados', (await call('auth', 'DELETE', 'auth?all=1', null, a1)).s === 200 && (await call('me', 'GET', 'me', null, a1)).s === 401 && (await call('me', 'GET', 'me', null, q)).s === 401);

/* 6. borrar la cuenta pide la contraseña */
const del = (await sign('borrable', 'clave-borrar-1')).d.token;
ok('sin contraseña no se borra', (await call('me', 'DELETE', 'me', { pass:'mala-mala-1' }, del)).s === 401);
ok('con la contraseña sí', (await call('me', 'DELETE', 'me', { pass:'clave-borrar-1' }, del)).s === 200 && !db.has('n:borrable'));

/* 7. equipos: 12 invitaciones a la vez no se pisan */
for (let i = 0; i < 12; i++) await sign('amigo' + i, 'clave-amigo-12');
const tid = (await call('teams', 'POST', 'teams', { action:'create', name:'Carrera' }, owner)).d.team.id;
await Promise.all(Array.from({ length:12 }, (_, i) => call('teams', 'POST', 'teams', { action:'invite', id:tid, to:'@amigo' + i }, owner)));
ok('12 invitaciones simultáneas quedan todas', JSON.parse(db.get('t:' + tid)).invites.length === 12, JSON.parse(db.get('t:' + tid)).invites.length);

/* 8. cuentas suspendidas */
{ const sub = db.get('n:normalita'); const u = JSON.parse(db.get('u:' + sub)); u.blocked = true; db.set('u:' + sub, JSON.stringify(u)); }
ok('una cuenta suspendida no entra', (await call('auth', 'POST', 'auth', { mode:'login', user:'normalita', pass:'clave-normal-12' })).s === 403);

/* 9. avisos de la CSP */
await call('csp', 'POST', 'csp', { 'csp-report':{ 'document-uri':'https://synthz.app/chat.html?token=secreto', 'violated-directive':'connect-src', 'blocked-uri':'https://malo.example/robar?x=1' } });
const row = JSON.parse((LS.get('csp') || [])[0] || '{}');
ok('el aviso se guarda limpio (sin rutas ni datos de la URL)', row.b === 'https://malo.example' && row.p === '/chat.html' && row.d === 'connect-src', row);
srv.close();
