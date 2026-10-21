// Hecho por: AUDITOR
// t/api/criticos.mjs — pruebas de rutas críticas con Redis simulado (sin claves reales)
// Uso: node t/api/criticos.mjs
// Simula Redis REST como en equipo/herramientas-prueba/be/dev.mjs

import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

// --- Mock Redis mínimo (compatible con los comandos usados por la API) ---
const db = new Map();
const sets = new Map();
const hashes = new Map();
const lists = new Map();
const S = k => sets.get(k) || (sets.set(k, new Set()), sets.get(k));
const H = k => hashes.get(k) || (hashes.set(k, new Map()), hashes.get(k));
const L = k => lists.get(k) || (lists.set(k, []), lists.get(k));

function runCmd(cmd) {
  const [c, ...a] = cmd;
  const C = String(c).toUpperCase();
  try {
    switch (C) {
      case 'GET': return db.has(a[0]) ? db.get(a[0]) : null;
      case 'SET': {
        const opts = a.slice(2).map(x => String(x).toUpperCase());
        if (opts.includes('NX') && db.has(a[0])) return null;
        db.set(a[0], String(a[1]));
        return 'OK';
      }
      case 'DEL': { let n = 0; a.forEach(k => { if (db.delete(k) || sets.delete(k) || hashes.delete(k) || lists.delete(k)) n++; }); return n; }
      case 'INCR': { const v = (+db.get(a[0]) || 0) + 1; db.set(a[0], String(v)); return v; }
      case 'INCRBY': { const v = (+db.get(a[0]) || 0) + +a[1]; db.set(a[0], String(v)); return v; }
      case 'DECR': { const v = (+db.get(a[0]) || 0) - 1; db.set(a[0], String(v)); return v; }
      case 'EXPIRE': return 1;
      case 'EXISTS': return db.has(a[0]) ? 1 : 0;
      case 'SADD': { const s = S(a[0]); a.slice(1).forEach(x => s.add(String(x))); return 1; }
      case 'SREM': { const s = S(a[0]); a.slice(1).forEach(x => s.delete(String(x))); return 1; }
      case 'SMEMBERS': return [...S(a[0])];
      case 'SISMEMBER': return S(a[0]).has(String(a[1])) ? 1 : 0;
      case 'SCARD': return S(a[0]).size;
      case 'HSET': H(a[0]).set(a[1], a[2]); return 1;
      case 'HSETNX': { const h = H(a[0]); if (h.has(a[1])) return 0; h.set(a[1], a[2]); return 1; }
      case 'HGET': return H(a[0]).has(a[1]) ? H(a[0]).get(a[1]) : null;
      case 'HGETALL': return [].concat(...[...H(a[0])].map(([k, v]) => [k, v]));
      case 'HMGET': return a.slice(1).map(k => H(a[0]).has(k) ? H(a[0]).get(k) : null);
      case 'HDEL': { const h = H(a[0]); a.slice(1).forEach(x => h.delete(x)); return 1; }
      case 'HKEYS': return [...H(a[0]).keys()];
      case 'HSTRLEN': return H(a[0]).has(a[1]) ? Buffer.byteLength(H(a[0]).get(a[1])) : 0;
      case 'LPUSH': { const lst = L(a[0]); a.slice(1).forEach(x => lst.unshift(x)); return lst.length; }
      case 'LTRIM': { const lst = L(a[0]); lists.set(a[0], lst.slice(+a[1], +a[2] + 1)); return 'OK'; }
      case 'LRANGE': { const lst = L(a[0]); return lst.slice(+a[1], +a[2] < 0 ? undefined : +a[2] + 1); }
      case 'SCAN': return ['0', [...db.keys()]];
      case 'ZADD': return 1; // simplificado
      case 'ZRANGEBYSCORE': return [];
      case 'ZREM': return 1;
      case 'MGET': return a.map(k => db.has(k) ? db.get(k) : null);
      case 'HINCRBY': { const h = H(a[0]); const v = (+h.get(a[1]) || 0) + +a[2]; h.set(a[1], String(v)); return v; }
      default: return null;
    }
  } catch (e) { return null; }
}

const redisServer = http.createServer((req, res) => {
  if (req.method !== 'POST') { res.writeHead(405); return res.end(); }
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    try {
      const cmds = JSON.parse(body);
      const isPipe = Array.isArray(cmds[0]);
      const results = (isPipe ? cmds : [cmds]).map(runCmd);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(isPipe ? results.map(r => ({ result: r })) : { result: results[0] }));
    } catch (e) {
      res.writeHead(400); res.end(JSON.stringify({ error: String(e) }));
    }
  });
});

await new Promise(r => redisServer.listen(0, '127.0.0.1', r));
const redisPort = redisServer.address().port;
process.env.KV_REST_API_URL = `http://127.0.0.1:${redisPort}`;
process.env.KV_REST_API_TOKEN = 'test-token';
process.env.SYNTHZ_SECRET = 'a'.repeat(40);
process.env.SYNTHZ_SETUP_CODE = 'TESTSETUPCODE123';
process.env.OPENROUTER_URL = 'http://127.0.0.1:9'; // no usado

// Importar después de setear env
const { default: health } = await import(ROOT + '/api/health.js');
const { default: config } = await import(ROOT + '/api/config.js');
const { default: me } = await import(ROOT + '/api/me.js');
const { default: auth } = await import(ROOT + '/api/auth.js');
const { default: ai } = await import(ROOT + '/api/ai.js');
const { default: chat } = await import(ROOT + '/api/chat.js');

let pass = 0, fail = 0;
const assert = (cond, msg) => { if (cond) { pass++; console.log('  OK', msg); } else { fail++; console.error('  FAIL', msg); } };

async function call(handler, method, path, body, headers = {}) {
  const req = new Request('http://localhost' + path, {
    method,
    headers: { 'content-type': 'application/json', 'x-real-ip': '127.0.0.1', ...headers },
    body: body != null ? JSON.stringify(body) : undefined
  });
  const res = await handler.fetch(req);
  const txt = await res.text();
  let json; try { json = JSON.parse(txt); } catch { json = txt; }
  return { status: res.status, json, headers: res.headers };
}

console.log('\n=== health ===');
{
  const r = await call(health, 'GET', '/api/health');
  assert(r.status === 200 && Array.isArray(r.json.bad), 'GET /api/health devuelve {bad}');
}

console.log('\n=== config ===');
{
  const r = await call(config, 'GET', '/api/config');
  assert(r.status === 200 && typeof r.json.ok === 'boolean', 'GET /api/config ok');
}

console.log('\n=== auth signup/login + límites ===');
{
  const su = await call(auth, 'POST', '/api/auth', { mode: 'signup', user: 'auditor1', pass: 'password123', name: 'Aud' });
  assert(su.status === 200 && su.json.token && su.json.recovery, 'signup crea cuenta y devuelve recovery');
  const token = su.json.token;

  const bad = await call(auth, 'POST', '/api/auth', { mode: 'login', user: 'auditor1', pass: 'wrongpass' });
  assert(bad.status === 401, 'login con pass incorrecta → 401');

  const ok = await call(auth, 'POST', '/api/auth', { mode: 'login', user: 'auditor1', pass: 'password123' });
  assert(ok.status === 200 && ok.json.token, 'login correcto');

  // límite por IP (signup)
  let limited = false;
  for (let i = 0; i < 12; i++) {
    const rr = await call(auth, 'POST', '/api/auth', { mode: 'signup', user: 'limit' + i, pass: 'password123' }, { 'x-real-ip': '203.0.113.5' });
    if (rr.status === 429) { limited = true; break; }
  }
  assert(limited, 'rate-limit signup por IP activa');
}

console.log('\n=== me (con token) ===');
{
  const su = await call(auth, 'POST', '/api/auth', { mode: 'signup', user: 'auditor2', pass: 'password123' }, { 'x-real-ip': '192.168.1.10' });
  const token = su.json.token;
  const r = await call(me, 'GET', '/api/me', null, { authorization: 'Bearer ' + token });
  assert(r.status === 200 && r.json.user && r.json.user.username === 'auditor2', 'GET /api/me con token válido');

  const no = await call(me, 'GET', '/api/me');
  assert(no.status === 401, 'GET /api/me sin token → 401');

  const badTok = await call(me, 'GET', '/api/me', null, { authorization: 'Bearer invalidtoken12345678901234567890' });
  assert(badTok.status === 401, 'token inválido → 401');
}

console.log('\n=== casos malos (JSON roto, cuerpo enorme, token inválido) ===');
{
  const broken = await call(auth, 'POST', '/api/auth', null, { 'content-type': 'application/json' });
  // body null se serializa? forzar texto malo
  const reqBroken = new Request('http://localhost/api/auth', { method: 'POST', headers: { 'content-type': 'application/json', 'x-real-ip': '1.1.1.1' }, body: '{broken json' });
  const rb = await auth.fetch(reqBroken);
  assert(rb.status === 400, 'JSON roto → 400');

  const huge = 'x'.repeat(2_000_000);
  const reqHuge = new Request('http://localhost/api/auth', { method: 'POST', headers: { 'content-type': 'application/json', 'x-real-ip': '1.1.1.2' }, body: JSON.stringify({ mode: 'login', user: 'a', pass: huge }) });
  const rh = await auth.fetch(reqHuge);
  assert(rh.status === 413 || rh.status === 400, 'cuerpo enorme → 413 o 400');
}

console.log('\n=== ai / chat (modelos simulados — solo validación de entrada) ===');
{
  // Sin cuenta, guest
  const r = await call(ai, 'GET', '/api/ai');
  assert(r.status === 200 && Array.isArray(r.json.models), 'GET /api/ai (guest) devuelve models');

  const badMsg = await call(ai, 'POST', '/api/ai', { messages: 'no array' });
  assert(badMsg.status === 400 || badMsg.status === 429, 'POST /api/ai messages inválidos rechazado');

  // chat requiere auth + team
  const noAuth = await call(chat, 'POST', '/api/chat', { teamId: 'x', model: 'test:free', messages: [{ role: 'user', content: 'hi' }] });
  assert(noAuth.status === 401, 'POST /api/chat sin auth → 401');
}

console.log('\n=== RESUMEN ===');
console.log(`Pasaron: ${pass}  Fallaron: ${fail}`);
if (fail) process.exit(1);
console.log('t/api/criticos.mjs OK');

redisServer.close();
process.exit(0);
