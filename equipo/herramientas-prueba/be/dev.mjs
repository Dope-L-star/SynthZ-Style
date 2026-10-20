/* Servidor de pruebas: sirve /home/claude/site y ejecuta las funciones reales de /api,
   con Redis, Google y OpenRouter falsos. Uso: node dev.mjs  (puerto 8765, servicios en 8799) */
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
const SITE = '/home/claude/site';
const db = new Map(), sets = new Map(), hashes = new Map();
const S = k => sets.get(k) || (sets.set(k, new Set()), sets.get(k)), Hh = k => hashes.get(k) || (hashes.set(k, new Map()), hashes.get(k));
const LS = new Map(), ZS = new Map();
function run([c, ...a]){
  c = c.toUpperCase();
  switch(c){
    case 'GET': return db.has(a[0]) ? db.get(a[0]) : null;
    case 'SET': if (a.slice(2).map(x => String(x).toUpperCase()).includes('NX') && db.has(a[0])) return null; db.set(a[0], String(a[1])); return 'OK';
    case 'DEL': { let n = 0; a.forEach(k => { if (db.delete(k) | sets.delete(k) | hashes.delete(k) | LS.delete(k)) n++; }); return n; }
    case 'INCR': { const v = (+db.get(a[0]) || 0) + 1; db.set(a[0], String(v)); return v; }
    case 'INCRBY': { const v = (+db.get(a[0]) || 0) + +a[1]; db.set(a[0], String(v)); return v; }
    case 'EXPIRE': return 1;
    case 'SADD': { const s = S(a[0]); a.slice(1).forEach(x => s.add(x)); return 1; }
    case 'SREM': { const s = S(a[0]); a.slice(1).forEach(x => s.delete(x)); return 1; }
    case 'SMEMBERS': return [...S(a[0])];
    case 'HSET': Hh(a[0]).set(a[1], a[2]); return 1;
    case 'SCAN': { const pat = a[a.indexOf('MATCH') + 1] || '*', rx = new RegExp('^' + pat.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'); return ['0', [...db.keys()].filter(k => rx.test(k))]; }
    case 'HSETNX': { const h = Hh(a[0]); if (h.has(a[1])) return 0; h.set(a[1], a[2]); return 1; }
    case 'HDEL': { const h = Hh(a[0]); a.slice(1).forEach(x => h.delete(x)); return 1; }
    case 'HGET': return Hh(a[0]).has(a[1]) ? Hh(a[0]).get(a[1]) : null;
    case 'HGETALL': return [].concat(...[...Hh(a[0])].map(([k, v]) => [k, v]));
    case 'HSTRLEN': return Hh(a[0]).has(a[1]) ? Buffer.byteLength(Hh(a[0]).get(a[1])) : 0;
    case 'LPUSH': { const L = LS.get(a[0]) || []; a.slice(1).forEach(x => L.unshift(x)); LS.set(a[0], L); return L.length; }
    case 'LTRIM': { const L = LS.get(a[0]) || []; LS.set(a[0], L.slice(+a[1], +a[2] + 1)); return 'OK'; }
    case 'LRANGE': { const L = LS.get(a[0]) || []; return L.slice(+a[1], +a[2] < 0 ? undefined : +a[2] + 1); }
    case 'LLEN': return (LS.get(a[0]) || []).length;
    case 'SCARD': return S(a[0]).size;
    case 'SISMEMBER': return S(a[0]).has(a[1]) ? 1 : 0;
    case 'HINCRBY': { const h = Hh(a[0]); const v = (+h.get(a[1]) || 0) + +a[2]; h.set(a[1], String(v)); return v; }
    case 'ZADD': { const z = ZS.get(a[0]) || new Map(); ZS.set(a[0], z); for (let i = 1; i < a.length; i += 2) z.set(a[i + 1], +a[i]); return 1; }
    case 'ZRANGEBYSCORE': { const z = ZS.get(a[0]) || new Map(), lo = a[1] === '-inf' ? -Infinity : +a[1], hi = a[2] === '+inf' ? Infinity : +a[2]; return [...z].filter(([, v]) => v >= lo && v <= hi).sort((x, y) => x[1] - y[1]).map(x => x[0]); }
    case 'ZREMRANGEBYSCORE': { const z = ZS.get(a[0]) || new Map(), lo = +a[1], hi = +a[2]; let n = 0; [...z].forEach(([k, v]) => { if (v >= lo && v <= hi){ z.delete(k); n++; } }); return n; }
    case 'EXISTS': return a.filter(k => db.has(k) || sets.has(k) || hashes.has(k)).length;
    case 'DECR': { const v = (+db.get(a[0]) || 0) - 1; db.set(a[0], String(v)); return v; }
    case 'HKEYS': return [...Hh(a[0]).keys()];
    case 'HLEN': return Hh(a[0]).size;
    case 'MGET': return a.map(k => db.has(k) ? db.get(k) : null);
    case 'ZREM': { const z = ZS.get(a[0]) || new Map(); a.slice(1).forEach(k => z.delete(k)); return 1; }
    case 'HMGET': return a.slice(1).map(f => Hh(a[0]).has(f) ? Hh(a[0]).get(f) : null);
    default: throw new Error('cmd ' + c);
  }
}
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength:2048 });
const jwk = Object.assign(publicKey.export({ format:'jwk' }), { kid:'k1', alg:'RS256', use:'sig' });
export const CID = 'test-client.apps.googleusercontent.com';
const idToken = (sub, email, name) => {
  const h = Buffer.from(JSON.stringify({ alg:'RS256', kid:'k1', typ:'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ iss:'https://accounts.google.com', aud:CID, sub, email, email_verified:true, name, picture:'', exp:Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return h + '.' + p + '.' + crypto.sign('RSA-SHA256', Buffer.from(h + '.' + p), privateKey).toString('base64url');
};
let orLog = [], trialLog = []; const trialFail = {};
const svc = http.createServer((req, res) => {
  let b = ''; req.on('data', d => b += d); req.on('end', () => {
    res.setHeader('access-control-allow-origin', '*'); res.setHeader('access-control-allow-headers', '*');
    if (req.method === 'OPTIONS'){ res.statusCode = 204; return res.end(); }
    if (req.url === '/certs'){ res.setHeader('cache-control', 'max-age=60'); return res.end(JSON.stringify({ keys:[jwk] })); }
    if (req.url.startsWith('/token')){ const u = new URL(req.url, 'http://x'); return res.end(JSON.stringify({ credential:idToken(u.searchParams.get('sub'), u.searchParams.get('email'), u.searchParams.get('name')) })); }
    if (req.url === '/redis/pipeline'){ return res.end(JSON.stringify(JSON.parse(b).map(c => { try{ return { result:run(c) }; }catch(e){ return { error:e.message }; } }))); }
    if (req.url === '/redis'){ try{ return res.end(JSON.stringify({ result:run(JSON.parse(b)) })); }catch(e){ return res.end(JSON.stringify({ error:e.message })); } }
    if (req.url === '/dump'){ return res.end(JSON.stringify({ db:[...db], hashes:[...hashes].map(([k, v]) => [k, [...v.keys()]]), sets:[...sets].map(([k, v]) => [k, [...v]]), orLog })); }
    /* proveedores de la prueba guiada (falsos) */
    const tp = /^\/(groq|mistral|cf|google|ollama|sf|polli)(\/.*)$/.exec(req.url.split('?')[0]);
    if (tp){
      const [, prov, rest] = tp, auth = req.headers.authorization || '', good = { groq:'Bearer gsk_prueba', mistral:'Bearer mstr_prueba', cf:'Bearer cfat_prueba', google:'Bearer AIza_prueba', ollama:'Bearer olla_prueba', sf:'Bearer sk-sf_prueba', polli:'Bearer sk_polli' }[prov];
      trialLog.push({ prov, rest, auth:auth === good ? 'ok' : 'mala', body:b ? JSON.parse(b) : null });
      if (prov === 'polli' && auth === 'Bearer sk_sinpollen'){ if (/^\/image\//.test(rest)){ res.statusCode = 402; return res.end('{"error":"Insufficient pollen balance"}'); } return res.end('{"data":[]}'); }
      if (auth !== good){ res.statusCode = 401; return res.end('{"error":"bad key"}'); }
      if (prov === 'polli' && /^\/image\//.test(rest)){ res.setHeader('content-type', 'image/png'); return res.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')); }
      if (/\/models/.test(rest) && prov === 'google') return res.end(JSON.stringify({ object:'list', data:[{ id:'models/gemini-2.5-flash' }, { id:'models/gemini-2.5-flash-lite' }, { id:'models/gemini-2.5-pro' }, { id:'models/gemini-2.5-flash-image' }, { id:'models/gemma-3-27b-it' }, { id:'models/text-embedding-004' }].concat(svc.gLatest ? [{ id:'models/gemini-flash-latest' }, { id:'models/gemini-3.8-flash' }] : []) }));
      if (/\/models/.test(rest) && prov === 'sf') return res.end(JSON.stringify({ object:'list', data:[{ id:'Qwen/Qwen3-8B' }, { id:'deepseek-ai/DeepSeek-V3' }, { id:'Pro/Qwen/Qwen2.5-7B-Instruct' }, { id:'THUDM/GLM-4-9B-0414' }] }));
      if (/\/models/.test(rest) && prov === 'ollama') return res.end(JSON.stringify({ object:'list', data:[{ id:'gpt-oss:120b' }, { id:'qwen3-coder:480b' }] }));
      if (/\/models/.test(rest) && prov === 'polli') return res.end(JSON.stringify({ data:[{ id:'flux' }] }));
      if (trialFail[prov]){ res.statusCode = trialFail[prov]; return res.end('{"error":"falla simulada"}'); }
      if (prov === 'google' && b && (svc.retired || []).includes(JSON.parse(b).model)){ res.statusCode = 404; return res.end('[{"error":{"code":404,"message":"This model models/' + JSON.parse(b).model + ' is no longer available to new users."}}]'); }
      if (svc.slow && svc.slow[prov] && /chat\/completions$/.test(rest)){ const ms = svc.slow[prov]; return setTimeout(() => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ choices:[{ message:{ role:'assistant', content:'ok' } }], usage:{ prompt_tokens:8, completion_tokens:1 } })); }, ms); }
      /* Mistral gratis: ~1 petición por segundo, como el real */
      if (prov === 'mistral'){ const now = Date.now(); if (now - (svc.mLast || 0) < 1000){ svc.mLast = now; res.statusCode = 429; return res.end('{"message":"Requests rate limit exceeded"}'); } svc.mLast = now; }
      if (rest === '/accounts'){ return res.end(JSON.stringify({ result:[{ id:'acc123' }] })); }
      if (/\/models/.test(rest)){ return res.end(JSON.stringify(prov === 'cf' ? { result:[{ id:'9b9c87c6-d4b7-494c-b177-87feab5904db', name:'@cf/meta/llama-3.1-8b-instruct' }, { id:'1f55679f-009e-4456-aa4f-049a62b4b6a0', name:'@cf/qwen/qwen1.5-0.5b-chat' }] } : { data:[{ id:prov === 'groq' ? 'llama-3.1-8b-instant' : 'mistral-small-latest' }] })); }
      if (/chat\/completions$/.test(rest) && !(b && JSON.parse(b).stream)){ res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ choices:[{ message:{ role:'assistant', content:'ok' } }], usage:{ prompt_tokens:8, completion_tokens:1 } })); }
      if (/chat\/completions$/.test(rest)){ res.setHeader('content-type', 'text/event-stream'); res.write('data: {"choices":[{"delta":{"content":"Hola, soy la prueba (' + prov + ')."},"finish_reason":"stop"}]}\n\n'); return res.end('data: {"choices":[],"usage":{"prompt_tokens":40,"completion_tokens":9}}\n\ndata: [DONE]\n\n'); }
      res.statusCode = 404; return res.end('{}');
    }
    if (req.url === '/tavily/search'){ if (req.headers.authorization !== 'Bearer tvly-prueba'){ res.statusCode = 401; return res.end('{}'); } if (trialFail.tavily){ res.statusCode = trialFail.tavily; return res.end('{"detail":{"error":"This request exceeds your plan usage limit"}}'); } const q = JSON.parse(b).query; return res.end(JSON.stringify({ results:[{ title:'Precio del dólar hoy en Colombia', url:'https://ejemplo.co/dolar', content:'El dólar cerró hoy en 3.950 pesos según el Banco de la República. (' + q + ')' }, { title:'Noticias económicas', url:'https://noticias.ejemplo.com/economia', content:'Resumen del día.' }] })); }
    if (req.url === '/exa/search'){ if (req.headers['x-api-key'] !== 'exa_prueba'){ res.statusCode = 401; return res.end('{}'); } return res.end(JSON.stringify({ results:[{ title:'Desde Exa', url:'https://exa.ejemplo.com/a', text:'Dato de Exa.' }] })); }
    if (req.url.startsWith('/wiki/w/api.php')){ return res.end(JSON.stringify({ query:{ search:[{ title:'Colombia', snippet:'<span>Colombia</span> es un país de América del Sur.' }] } })); }
    if (req.url.startsWith('/mockretire')){ const u = new URL(req.url, 'http://x'); svc.retired = u.searchParams.get('m') ? u.searchParams.get('m').split(',') : []; svc.gLatest = u.searchParams.get('latest') === '1'; return res.end('{}'); }
    if (req.url.startsWith('/mockslow')){ const u = new URL(req.url, 'http://x'); svc.slow = svc.slow || {}; svc.slow[u.searchParams.get('p')] = +u.searchParams.get('ms') || 0; return res.end('{}'); }
    if (req.url.startsWith('/mockfail')){ const u = new URL(req.url, 'http://x'); trialFail[u.searchParams.get('p')] = +u.searchParams.get('s') || 0; return res.end('{}'); }
    if (req.url === '/trialdump'){ return res.end(JSON.stringify(trialLog)); }
    if (req.url === '/or/key'){ res.statusCode = /^Bearer sk-or-v1-/.test(req.headers.authorization || '') ? 200 : 401; return res.end('{"data":{}}'); }
    if (req.url === '/or/models'){ return res.end(JSON.stringify({ data:[
      { id:'openrouter/free', name:'Free Models Router', pricing:{ prompt:'0', completion:'0' }, context_length:128000, architecture:{ output_modalities:['text'] } },
      { id:'meta-llama/llama-3.3-70b-instruct:free', name:'Meta: Llama 3.3 70B (free)', pricing:{ prompt:'0', completion:'0' }, context_length:131072, architecture:{ output_modalities:['text'] } },
      { id:'openai/gpt-4o', name:'GPT-4o', pricing:{ prompt:'0.0000025', completion:'0.00001' }, context_length:128000, architecture:{ output_modalities:['text'] } },
      { id:'google/lyria-3:free', name:'Lyria', pricing:{ prompt:'0', completion:'0' }, architecture:{ output_modalities:['audio'] } } ] })); }
    if (req.url === '/or/chat/completions'){ const j = JSON.parse(b); orLog.push({ auth:req.headers.authorization, model:j.model }); if (!j.stream){ res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ choices:[{ message:{ role:'assistant', content:'ok' } }], usage:{ prompt_tokens:8, completion_tokens:1 } })); } res.setHeader('content-type', 'text/event-stream'); res.write('data: {"choices":[{"delta":{"content":"Hola desde "}}]}\n\n'); res.write('data: {"choices":[{"delta":{"content":"el equipo."},"finish_reason":"stop"}]}\n\n'); return res.end('data: {"choices":[],"usage":{"prompt_tokens":20,"completion_tokens":6}}\n\ndata: [DONE]\n\n'); }
    res.statusCode = 404; res.end('{}');
  });
});
await new Promise(r => svc.listen(8799, r));
Object.assign(process.env, { KV_REST_API_URL:'http://localhost:8799/redis', KV_REST_API_TOKEN:'t', GOOGLE_CLIENT_ID:CID, SYNTHZ_SECRET:'s'.repeat(40), GOOGLE_CERTS_URL:'http://localhost:8799/certs', OPENROUTER_URL:'http://localhost:8799/or' });
process.env.SYNTHZ_SETUP_CODE = process.env.SYNTHZ_SETUP_CODE || 'codigo-de-dueno-123';
Object.assign(process.env, { TRIAL_GROQ_URL:'http://localhost:8799/groq', TRIAL_MISTRAL_URL:'http://localhost:8799/mistral', TRIAL_CF_URL:'http://localhost:8799/cf', POOL_GOOGLE_URL:'http://localhost:8799/google', POOL_OLLAMA_URL:'http://localhost:8799/ollama', POOL_SF_URL:'http://localhost:8799/sf', POOL_POLLI_URL:'http://localhost:8799/polli', POOL_TAVILY_URL:'http://localhost:8799/tavily', POOL_EXA_URL:'http://localhost:8799/exa', POOL_WIKI_URL:'http://localhost:8799/wiki' });
if (process.env.SMALLQ) process.env.SYNTHZ_USER_MB = '0.5';
if (process.env.SIMPLE){ delete process.env.GOOGLE_CLIENT_ID; delete process.env.SYNTHZ_SECRET; }   /* como un Vercel con solo la base de datos */
const handlers = {};
for (const f of fs.readdirSync(SITE + '/api')) if (!f.startsWith('_')) handlers[f.replace(/\.js$/, '')] = (await import(SITE + '/api/' + f)).default;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json', '.json':'application/json' };
const web = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost:8765');
  const m = /^\/api\/([a-z]+)$/.exec(u.pathname);
  if (m){
    const h = handlers[m[1]]; if (!h){ res.statusCode = 404; return res.end('{}'); }
    const chunks = []; for await (const c of req) chunks.push(c);
    const r = await h.fetch(new Request(u.href, { method:req.method, headers:Object.fromEntries(Object.entries(req.headers).filter(([k]) => typeof k === 'string')), body:['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) }));
    res.writeHead(r.status, Object.fromEntries(r.headers));
    if (r.body){ for await (const c of r.body) res.write(c); }
    return res.end();
  }
  let p = path.join(SITE, decodeURIComponent(u.pathname === '/' ? '/index.html' : u.pathname));
  if (!p.startsWith(SITE) || !fs.existsSync(p) || fs.statSync(p).isDirectory()){ res.statusCode = 404; return res.end('no'); }
  res.setHeader('content-type', MIME[path.extname(p)] || 'application/octet-stream');
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => web.listen(8765, r));
console.log('listo');
