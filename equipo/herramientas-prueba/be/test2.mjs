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
/* como en tu Vercel: solo la base de datos, sin Google y sin SYNTHZ_SECRET */
Object.assign(process.env, { KV_REST_API_URL:'http://localhost:8799/redis', KV_REST_API_TOKEN:'t', OPENROUTER_URL:'http://localhost:8799/or' });
delete process.env.GOOGLE_CLIENT_ID; delete process.env.SYNTHZ_SECRET;
const R = '/home/claude/site/api/';
const H = { config:(await import(R + 'config.js')).default, auth:(await import(R + 'auth.js')).default, me:(await import(R + 'me.js')).default, teams:(await import(R + 'teams.js')).default, chat:(await import(R + 'chat.js')).default };
let ip = 1;
const call = async (h, method, path, body, tok, sameIp) => { const r = await H[h].fetch(new Request('http://synthz.test/api/' + path, { method, headers:Object.assign({ 'content-type':'application/json', 'x-forwarded-for':'9.9.9.' + (sameIp ? 0 : ip++) }, tok ? { authorization:'Bearer ' + tok } : {}), body:body ? JSON.stringify(body) : undefined })); const txt = await r.text(); let d; try{ d = JSON.parse(txt); }catch(e){ d = txt; } return { s:r.status, d }; };
const ok = (name, cond, extra) => console.log((cond ? 'OK   ' : 'FALLA') + ' ' + name + (extra ? '  ' + JSON.stringify(extra).slice(0, 180) : ''));

let r = await call('config', 'GET', 'config');
ok('config sin Google ni secreto', r.d.ok === true && r.d.google === false && r.d.missing.length === 0, r.d);
ok('Google desactivado', (await call('auth', 'POST', 'auth', { credential:'a.b.c' })).s === 400);
ok('usuario inválido', (await call('auth', 'POST', 'auth', { mode:'signup', user:'a b', pass:'clave-segura-1' })).s === 400);
ok('contraseña corta', (await call('auth', 'POST', 'auth', { mode:'signup', user:'sam', pass:'123' })).s === 400);
ok('usuario reservado', (await call('auth', 'POST', 'auth', { mode:'signup', user:'admin', pass:'clave-segura-1' })).s === 400);
const A = await call('auth', 'POST', 'auth', { mode:'signup', user:'@Sam_Z', pass:'clave-segura-1', name:'Sam' });
ok('crear cuenta', A.s === 200 && A.d.token && A.d.user.username === 'sam_z' && A.d.isNew && /^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/.test(A.d.recovery), A.d);
ok('usuario repetido', (await call('auth', 'POST', 'auth', { mode:'signup', user:'SAM_Z', pass:'otra-clave-22' })).s === 409);
const dump = JSON.stringify([...db.entries()]);
ok('ni la contraseña ni el código quedan en la base', !dump.includes('clave-segura-1') && !dump.includes(A.d.recovery));
ok('se creó la clave de cifrado sola', db.has('cfg:secret') && db.get('cfg:secret').length > 40);
ok('contraseña incorrecta', (await call('auth', 'POST', 'auth', { mode:'login', user:'sam_z', pass:'nop-nop-nop' })).s === 401);
ok('usuario que no existe (mismo mensaje)', (await call('auth', 'POST', 'auth', { mode:'login', user:'nadie', pass:'nop-nop-nop' })).d.error === 'Usuario o contraseña incorrectos.');
const L = await call('auth', 'POST', 'auth', { mode:'login', user:'Sam_Z', pass:'clave-segura-1' });
ok('entrar', L.s === 200 && L.d.user.sub === A.d.user.sub && !L.d.recovery);
r = await call('me', 'PUT', 'me', { key:'sk-or-v1-miLLAVEpropia1234' }, L.d.token);
ok('llave cifrada con la clave automática', r.s === 200 && !JSON.stringify([...db.entries()]).includes('miLLAVEpropia') && (await call('me', 'GET', 'me', null, L.d.token)).d.key === 'sk-or-v1-miLLAVEpropia1234');
/* olvidé la contraseña */
ok('código equivocado', (await call('auth', 'POST', 'auth', { mode:'reset', user:'sam_z', code:'AAAA-BBBB-CCCC-DDDD', pass:'nueva-clave-33' })).s === 401);
const RS = await call('auth', 'POST', 'auth', { mode:'reset', user:'sam_z', code:A.d.recovery.toLowerCase().replace(/-/g, ' '), pass:'nueva-clave-33' });
ok('recuperar con el código (sin importar mayúsculas ni guiones)', RS.s === 200 && RS.d.recovery && RS.d.recovery !== A.d.recovery, RS.d);
ok('las sesiones viejas se cierran', (await call('me', 'GET', 'me', null, L.d.token)).s === 401 && (await call('me', 'GET', 'me', null, A.d.token)).s === 401);
ok('el código viejo ya no sirve', (await call('auth', 'POST', 'auth', { mode:'reset', user:'sam_z', code:A.d.recovery, pass:'otra-clave-44' })).s === 401);
ok('la contraseña vieja ya no sirve', (await call('auth', 'POST', 'auth', { mode:'login', user:'sam_z', pass:'clave-segura-1' })).s === 401);
let ta = RS.d.token;
/* cambiar contraseña y código nuevo con sesión */
ok('cambiar con contraseña actual mala', (await call('auth', 'POST', 'auth', { mode:'change', old:'mala-mala-1', pass:'cambio-clave-55' }, ta)).s === 401);
r = await call('auth', 'POST', 'auth', { mode:'change', old:'nueva-clave-33', pass:'cambio-clave-55' }, ta);
ok('cambiar contraseña', r.s === 200 && r.d.token && (await call('me', 'GET', 'me', null, ta)).s === 401);
ta = r.d.token;
r = await call('auth', 'POST', 'auth', { mode:'code', pass:'cambio-clave-55' }, ta);
ok('código de recuperación nuevo', r.s === 200 && /^[A-Z2-9]{4}-/.test(r.d.recovery));
/* equipos por @usuario */
const B = await call('auth', 'POST', 'auth', { mode:'signup', user:'luna', pass:'estrella-66x' });
const tb = B.d.token;
r = await call('teams', 'POST', 'teams', { action:'create', name:'Los Synth' }, ta); const tid = r.d.team.id;
await call('teams', 'POST', 'teams', { action:'key', id:tid, key:'sk-or-v1-buenaLLAVE123456' }, ta);
ok('invitar a alguien que no existe', (await call('teams', 'POST', 'teams', { action:'invite', id:tid, to:'@lunaa' }, ta)).s === 404);
ok('invitarse a sí mismo', (await call('teams', 'POST', 'teams', { action:'invite', id:tid, to:'sam_z' }, ta)).s === 400);
r = await call('teams', 'POST', 'teams', { action:'invite', id:tid, to:'@Luna' }, ta);
ok('invitar por @usuario', r.s === 200 && r.d.to === '@luna', r.d);
r = await call('teams', 'GET', 'teams', null, tb);
ok('Luna ve la invitación', r.d.invites.length === 1 && r.d.invites[0].from.handle === '@sam_z', r.d.invites);
ok('aceptar', (await call('teams', 'POST', 'teams', { action:'accept', id:tid }, tb)).s === 200);
r = await call('chat', 'POST', 'chat', { teamId:tid, model:'apodex/apodex-1.1-mini:free', messages:[{ role:'user', content:'hola' }] }, tb);
ok('Luna chatea con la llave del equipo sin verla', r.s === 200 && lastAuth === 'Bearer sk-or-v1-buenaLLAVE123456' && !JSON.stringify((await call('teams', 'GET', 'teams', null, tb)).d).includes('buenaLLAVE'));
r = await call('teams', 'GET', 'teams', null, ta);
ok('el dueño ve a @luna', r.d.teams[0].members[0].handle === '@luna', r.d.teams[0].members);
/* fuerza bruta */
let last = 0; for (let i = 0; i < 12; i++) last = (await call('auth', 'POST', 'auth', { mode:'login', user:'luna', pass:'adivina-' + i }, null, true)).s;
ok('frena a quien adivina contraseñas', last === 429);
/* borrar cuenta libera el usuario */
ok('borrar cuenta', (await call('me', 'DELETE', 'me', { pass:'estrella-66x' }, tb)).s === 200 && !db.has('n:luna') && ![...db.keys()].some(k => k.startsWith('pw:' + B.d.user.sub)));
ok('el usuario queda libre otra vez', (await call('auth', 'POST', 'auth', { mode:'signup', user:'luna', pass:'estrella-77x' })).s === 200);
/* SynXCoin's en la nube */
const S2 = await call('auth', 'POST', 'auth', { mode:'signup', user:'contador', pass:'cuenta-tokens-1' }); const tk = S2.d.token;
const row = (p, c, d = '2026-10-12') => ({ openrouter:{ p, c, r:1, e:0, days:{ [d]:p + c }, de:{}, rd:{ [d]:1 }, fd:{} } });
await call('me', 'PUT', 'me', { wantLedger:true, ledger:{ ep:0, dev:{ devA:row(20, 6) } } }, tk);
r = await call('me', 'PUT', 'me', { wantLedger:true, ledger:{ ep:0, dev:{ devB:row(20, 6) } } }, tk);
ok('dos dispositivos se suman (no se pisan)', r.d.ledger.dev.devA.openrouter.p === 20 && r.d.ledger.dev.devB.openrouter.p === 20, r.d.ledger);
r = await call('me', 'PUT', 'me', { wantLedger:true, ledger:{ ep:0, dev:{ devA:row(5, 1) } } }, tk);
ok('una copia vieja no baja el contador', r.d.ledger.dev.devA.openrouter.p === 20);
for (let i = 0; i < 3; i++) r = await call('me', 'PUT', 'me', { wantLedger:true, ledger:{ ep:0, dev:{ devA:row(20, 6) } } }, tk);
ok('subir varias veces no duplica', r.d.ledger.dev.devA.openrouter.p === 20);
r = await call('me', 'PUT', 'me', { wantLedger:true, ledger:{ ep:1000, dev:{} } }, tk);
ok('reiniciar borra todas las filas', r.d.ledger.ep === 1000 && Object.keys(r.d.ledger.dev).length === 0, r.d.ledger);
r = await call('me', 'PUT', 'me', { wantLedger:true, ledger:{ ep:0, dev:{ devB:row(99, 1) } } }, tk);
ok('filas de antes del reinicio se ignoran', Object.keys(r.d.ledger.dev).length === 0);
r = await call('me', 'PUT', 'me', { wantLedger:true, ledger:{ ep:1000, dev:{ devB:{ openrouter:{ p:-5, c:'x', r:1e20, days:{ 'mal':3 } }, inventado:{ p:1 } } } } }, tk);
ok('valores raros se limpian', r.d.ledger.dev.devB.openrouter.p === 0 && r.d.ledger.dev.devB.openrouter.r === 1e13 && !r.d.ledger.dev.devB.openrouter.days.mal, r.d.ledger.dev.devB);
const other = await call('me', 'GET', 'me', null, (await call('auth', 'POST', 'auth', { mode:'signup', user:'ajeno', pass:'otra-cuenta-22' })).d.token);
ok('otra cuenta no ve este consumo', Object.keys(other.d.ledger.dev).length === 0);
srv.close();
