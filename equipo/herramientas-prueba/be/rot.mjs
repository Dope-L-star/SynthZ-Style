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
import { execFile } from 'node:child_process';
const step = (env, ...args) => new Promise(res => execFile('node', ['/home/claude/t/be/rotstep.mjs', ...args], { env:Object.assign({}, process.env, { KV_REST_API_URL:'http://localhost:8799/redis', KV_REST_API_TOKEN:'t' }, env), encoding:'utf8' }, (e, out) => res(e ? 'ERROR ' + e.message.slice(0, 200) : String(out).trim())));
const ok = (name, cond, extra) => console.log((cond ? 'OK   ' : 'FALLA') + ' ' + name + (extra ? '  ' + extra : ''));
const A = 'A'.repeat(40), B = 'B'.repeat(40);
/* 0) versión anterior: sin SYNTHZ_SECRET → clave automática guardada en la base */
const tok = await step({}, 'save');
ok('guardar llave con la clave automática', tok.length > 20);
const blob0 = db.get('k:' + db.get('n:rotador'));
/* 1) el dueño pone SYNTHZ_SECRET=A: lo viejo se sigue leyendo (clave automática) y se re-cifra con A */
ok('con SYNTHZ_SECRET nuevo se lee lo de antes', await step({ SYNTHZ_SECRET:A }, 'read', tok) === 'sk-or-v1-rotacion123456');
const blob1 = db.get('k:' + db.get('n:rotador'));
ok('y quedó re-cifrada con A (formato v2)', blob1 !== blob0 && blob1.startsWith('v2.'));
/* 2) rota a B guardando A como anterior */
ok('rotar: SYNTHZ_SECRET=B y SYNTHZ_SECRET_OLD=A → se lee', await step({ SYNTHZ_SECRET:B, SYNTHZ_SECRET_OLD:A }, 'read', tok) === 'sk-or-v1-rotacion123456');
const blob2 = db.get('k:' + db.get('n:rotador'));
ok('y quedó re-cifrada con B', blob2 !== blob1 && blob2.startsWith('v2.'));
/* 3) ya sin la anterior: lo re-cifrado se sigue leyendo */
ok('quitar SYNTHZ_SECRET_OLD tras la rotación → se lee', await step({ SYNTHZ_SECRET:B }, 'read', tok) === 'sk-or-v1-rotacion123456');
/* 4) error típico: cambiar la clave sin poner la anterior → no se lee, pero no se rompe nada */
db.set('k:' + db.get('n:rotador'), blob1);                 /* simula una llave que aún estaba con A */
db.delete('cfg:secret');
const r = await step({ SYNTHZ_SECRET:B }, 'read', tok);
ok('sin la clave anterior: la cuenta abre igual y la llave sale vacía (hay que volver a pegarla)', r === '', JSON.stringify(r));
srv.close();
