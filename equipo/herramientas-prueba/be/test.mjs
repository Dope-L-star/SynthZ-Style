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
Object.assign(process.env, { KV_REST_API_URL:'http://localhost:8799/redis', KV_REST_API_TOKEN:'t', GOOGLE_CLIENT_ID:'test-client.apps.googleusercontent.com', SYNTHZ_SECRET:'x'.repeat(40), GOOGLE_CERTS_URL:'http://localhost:8799/certs', OPENROUTER_URL:'http://localhost:8799/or' });
const R = '/home/claude/site/api/';
const H = { config:(await import(R + 'config.js')).default, auth:(await import(R + 'auth.js')).default, me:(await import(R + 'me.js')).default, chats:(await import(R + 'chats.js')).default, teams:(await import(R + 'teams.js')).default, chat:(await import(R + 'chat.js')).default };
const call = async (h, method, path, body, tok) => { const r = await H[h].fetch(new Request('http://synthz.test/api/' + path, { method, headers:Object.assign({ 'content-type':'application/json', 'x-forwarded-for':'1.2.3.4' }, tok ? { authorization:'Bearer ' + tok } : {}), body:body ? JSON.stringify(body) : undefined })); const txt = await r.text(); let d; try{ d = JSON.parse(txt); }catch(e){ d = txt; } return { s:r.status, d }; };
const ok = (name, cond, extra) => console.log((cond ? 'OK   ' : 'FALLA') + ' ' + name + (extra ? '  ' + JSON.stringify(extra).slice(0, 160) : ''));

ok('config', (await call('config', 'GET', 'config')).d.ok === true);
const forged = idToken('1', 'a@x.com').replace(/\.[^.]+$/, '.' + Buffer.from('falsa').toString('base64url'));
ok('token falsificado rechazado', (await call('auth', 'POST', 'auth', { credential:forged })).s === 401);
ok('aud de otra app rechazado', (await call('auth', 'POST', 'auth', { credential:idToken('1', 'a@x.com', { aud:'otra' }) })).s === 401);
ok('token vencido rechazado', (await call('auth', 'POST', 'auth', { credential:idToken('1', 'a@x.com', { exp:1000 }) })).s === 401);
const A = await call('auth', 'POST', 'auth', { credential:idToken('111', 'Sam@Gmail.com') });
ok('entrar con Google', A.s === 200 && A.d.token && A.d.user.email === 'sam@gmail.com' && A.d.isNew, { user:A.d.user });
const B = await call('auth', 'POST', 'auth', { credential:idToken('222', 'luna@gmail.com') });
const ta = A.d.token, tb = B.d.token;
ok('sin sesión → 401', (await call('me', 'GET', 'me')).s === 401);
let r = await call('me', 'PUT', 'me', { profile:{ name:'Sammy', bio:'Hola <b>', color:'coral', avatar:{ type:'emoji', emoji:'🚀' } }, prefs:{ fav:['x'] }, key:'sk-or-v1-miLLAVEpropia1234' }, ta);
ok('guardar perfil, preferencias y llave', r.s === 200 && r.d.profile.name === 'Sammy' && r.d.profile.color === 'coral', r.d);
ok('la llave se guarda cifrada', !JSON.stringify([...db.entries()]).includes('miLLAVEpropia'));
r = await call('me', 'GET', 'me', null, ta);
ok('leer mi cuenta', r.d.profile.avatar.emoji === '🚀' && r.d.prefs.fav[0] === 'x' && r.d.key === 'sk-or-v1-miLLAVEpropia1234');
r = await call('chats', 'POST', 'chats', { items:[{ k:'openrouter::pu:gpt', data:[{ role:'user', content:'hola' }] }, { k:'openrouter::or:x::t1', data:[{ role:'user', content:'otro' }] }] }, ta);
ok('subir chats', r.d.saved === 2);
r = await call('chats', 'POST', 'chats', { del:['openrouter::or:x::t1'] }, ta);
const left = (await call('me', 'GET', 'me', null, ta)).d.chatKeys;
ok('borrar chat de verdad en la nube', left.length === 1 && left[0] === 'openrouter::pu:gpt', left);
ok('otro usuario no ve mis chats', JSON.stringify((await call('chats', 'GET', 'chats?k=openrouter::pu:gpt', null, tb)).d.chats) === '{}');
/* equipos */
r = await call('teams', 'POST', 'teams', { action:'create', name:'Los Synth' }, ta); const tid = r.d.team.id;
ok('crear equipo', !!tid);
ok('miembro no puede poner llave', (await call('teams', 'POST', 'teams', { action:'key', id:tid, key:'sk-or-v1-buenaLLAVE123456' }, tb)).s === 403);
ok('llave inválida rechazada', (await call('teams', 'POST', 'teams', { action:'key', id:tid, key:'sk-or-v1-malaLLAVE9999999' }, ta)).s === 400);
ok('poner llave del equipo', (await call('teams', 'POST', 'teams', { action:'key', id:tid, key:'sk-or-v1-buenaLLAVE123456' }, ta)).d.hasKey === true);
ok('invitar por correo', (await call('teams', 'POST', 'teams', { action:'invite', id:tid, email:'LUNA@gmail.com' }, ta)).d.known === true);
ok('sin aceptar no puede usarla', (await call('chat', 'POST', 'chat', { teamId:tid, model:'apodex/apodex-1.1-mini:free', messages:[{ role:'user', content:'hola' }] }, tb)).s === 403);
r = await call('teams', 'GET', 'teams', null, tb);
ok('ver invitación', r.d.invites.length === 1 && r.d.invites[0].from.name === 'Sammy', r.d.invites);
ok('aceptar', (await call('teams', 'POST', 'teams', { action:'accept', id:tid }, tb)).s === 200);
r = await call('teams', 'GET', 'teams', null, tb);
ok('la llave NO llega al miembro', !JSON.stringify(r.d).includes('buenaLLAVE') && r.d.teams[0].hasKey && r.d.teams[0].keyLabel === '', r.d.teams[0]);
ok('modelo de pago bloqueado (solo gratis)', (await call('chat', 'POST', 'chat', { teamId:tid, model:'openai/gpt-5', messages:[{ role:'user', content:'hola' }] }, tb)).s === 403);
r = await call('chat', 'POST', 'chat', { teamId:tid, model:'apodex/apodex-1.1-mini:free', messages:[{ role:'user', content:'hola' }] }, tb);
ok('el miembro chatea con la llave del equipo', r.s === 200 && /Hola /.test(r.d) && lastAuth === 'Bearer sk-or-v1-buenaLLAVE123456');
await new Promise(x => setTimeout(x, 50));
const used = [...db.entries()].find(([k]) => k.startsWith('tu:' + tid + ':g222'));
ok('cuenta el uso real del miembro', used && +used[1] === 42, used);
await call('teams', 'POST', 'teams', { action:'settings', id:tid, daily:1000 }, ta);
db.set(used[0], '1000');
ok('límite diario del miembro', (await call('chat', 'POST', 'chat', { teamId:tid, model:'apodex/apodex-1.1-mini:free', messages:[{ role:'user', content:'hola' }] }, tb)).s === 429);
r = await call('teams', 'GET', 'teams', null, ta);
ok('el dueño ve uso de cada miembro', r.d.teams[0].members[0].used === 1000 && r.d.teams[0].keyLabel === 'sk-or-…3456', r.d.teams[0].members);
ok('quitar miembro', (await call('teams', 'POST', 'teams', { action:'remove', id:tid, sub:'g222' }, ta)).s === 200);
ok('quitado ya no puede usarla', (await call('chat', 'POST', 'chat', { teamId:tid, model:'apodex/apodex-1.1-mini:free', messages:[{ role:'user', content:'hola' }] }, tb)).s === 403);
ok('cerrar sesión', (await call('auth', 'DELETE', 'auth', null, tb)).s === 200 && (await call('me', 'GET', 'me', null, tb)).s === 401);
ok('borrar cuenta de Google sin confirmar → no', (await call('me', 'DELETE', 'me', {}, ta)).s === 400);
ok('borrar cuenta', (await call('me', 'DELETE', 'me', { confirm:'sam@gmail.com' }, ta)).s === 200 && (await call('me', 'GET', 'me', null, ta)).s === 401 && !db.has('t:' + tid));
srv.close();
