/* IA de SynthZ (beta 2): las llaves de Prime, ZFlow y Symmetrix se juntan y se reparten entre todos.
   · Solo modelos GRATIS: Groq, Mistral y Cloudflare (planes gratis) y los «:free» de OpenRouter. Los de pago se rechazan.
   · Cada persona tiene un tope de SynXCoin's al día (20.000 por defecto). Lo que se usa con Puter no cuenta.
   · Las llaves viven cifradas en el servidor; nunca salen hacia el navegador ni a los registros.
   · Si una llave falla, se pausa un rato y se usa otra; si un proveedor entero falla, responde otro (respaldo limitado). */
import { redis, pipe, getJ, setJ, enc, dec, today, sha } from './_lib.js';

export const PROV = {
  groq:{ name:'Groq', base:() => process.env.TRIAL_GROQ_URL || 'https://api.groq.com/openai/v1', cap:+process.env.POOL_CAP_GROQ || 900,
    best:['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'qwen/qwen3-32b', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant'] },
  mistral:{ name:'Mistral', base:() => process.env.TRIAL_MISTRAL_URL || 'https://api.mistral.ai/v1', cap:+process.env.POOL_CAP_MISTRAL || 400,
    best:['mistral-small-latest', 'mistral-medium-latest', 'open-mistral-nemo', 'ministral-8b-latest'] },
  openrouter:{ name:'OpenRouter', base:() => process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1', cap:+process.env.POOL_CAP_OR || 45,
    best:['openrouter/free'] },
  cloudflare:{ name:'Cloudflare', base:acct => (process.env.TRIAL_CF_URL || 'https://api.cloudflare.com/client/v4') + '/accounts/' + acct + '/ai/v1', cap:+process.env.POOL_CAP_CF || 250,
    best:['@cf/meta/llama-3.3-70b-instruct-fp8-fast', '@cf/meta/llama-3.1-8b-instruct', '@cf/meta/llama-3.2-3b-instruct', '@cf/google/gemma-3-12b-it'] }
};
export const ORDER = ['groq', 'mistral', 'openrouter', 'cloudflare'];
const ENV_KEY = { groq:'GROQ_API_KEY', mistral:'MISTRAL_API_KEY', cloudflare:'CLOUDFLARE_API_TOKEN', openrouter:'POOL_OPENROUTER_KEY' };
export const PLAN_RX = /billing|payment|subscri|upgrade|plan|credit|quota exceeded|insufficient/i;
export const DAY_LIMIT_DEFAULT = 25000;   /* ≈ 30 mensajes al día por persona */
const wait = ms => new Promise(r => setTimeout(r, ms));
const err = (s, m, code) => Object.assign(new Error(m), { status:s, code });
export const mask = k => k ? '••••' + String(k).slice(-4) : '';
export const classify = s => s === 401 || s === 403 ? 'llave inválida o sin permiso' : s === 402 ? 'requiere pago (bloqueado: SynthZ no paga)' : s === 404 ? 'modelo no disponible' : s === 429 ? 'límite gratis alcanzado por ahora' : s >= 500 ? 'el proveedor está fallando' : 'error ' + s;
export const provSaid = t => { let m = String(t || ''); try{ const j = JSON.parse(m); m = (j.error && (j.error.message || j.error)) || j.message || j.detail || m; }catch(e){} return String(typeof m === 'string' ? m : JSON.stringify(m)).replace(/(gsk_|sk-|cfat_|Bearer\s+)[\w-]{6,}/gi, '••').replace(/\s+/g, ' ').trim().slice(0, 160); };

/* si responde 429 por ir muy rápido (no por cuota agotada), espera y reintenta UNA vez */
export async function calm(make){
  let r = await make();
  if (r.status !== 429) return r;
  const txt = await r.text().catch(() => '');
  if (PLAN_RX.test(txt)) return new Response(txt, { status:429 });
  await wait(Math.min(3000, Math.max(1100, (+r.headers.get('retry-after') || 0) * 1000)));
  return make();
}

/* ---------- configuración: tope diario y llaves de cada cuenta del equipo ---------- */
export async function settings(){ const s = (await getJ('cfg:pool:set')) || {}; return { dayLimit:Math.max(1000, Math.min(500000, +s.dayLimit || DAY_LIMIT_DEFAULT)) }; }
export async function saveSettings(patch){ const s = (await getJ('cfg:pool:set')) || {}; if (patch.dayLimit != null) s.dayLimit = Math.max(1000, Math.min(500000, Math.round(+patch.dayLimit) || DAY_LIMIT_DEFAULT)); await setJ('cfg:pool:set', s); return settings(); }
/* cfg:pool = { <sub>: { name, rank, keys:{ groq, mistral, cloudflare, openrouter } (cifradas), cfAccount, t } } */
export async function ownersRaw(){ return (await getJ('cfg:pool')) || {}; }
export async function saveOwnerKeys(me, rank, patch){
  const all = await ownersRaw(), o = all[me.sub] || { keys:{} };
  o.name = String(me.username || me.name || 'equipo').slice(0, 40); o.rank = rank; o.t = Date.now(); o.keys = o.keys || {};
  for (const id of ORDER){ if (typeof patch[id] === 'string'){ const k = patch[id].trim().slice(0, 300); if (k) o.keys[id] = enc(k); else delete o.keys[id]; } }
  if (typeof patch.cfAccount === 'string') o.cfAccount = patch.cfAccount.replace(/[^a-f0-9]/gi, '').slice(0, 64);
  all[me.sub] = o; await setJ('cfg:pool', all);
  await redis('DEL', 'pool:models');                       /* la lista de modelos se rehace con las llaves nuevas */
  return o;
}
/* todas las llaves: las de Vercel, las del panel viejo de la prueba y las de cada cuenta del equipo */
export async function loadKeys(){
  const out = [], seen = new Set();
  const add = (prov, key, owner, src, cfAccount) => { if (!key) return; const id = sha(prov + ':' + key).slice(0, 12); if (seen.has(id)) return; seen.add(id); out.push({ id, prov, key, owner, src, cfAccount:cfAccount || '' }); };
  for (const p of ORDER) add(p, process.env[ENV_KEY[p]], { name:'Vercel', rank:'Prime' }, 'vercel', process.env.CLOUDFLARE_ACCOUNT_ID);
  const legacy = (await getJ('cfg:trial')) || {};
  for (const p of ['groq', 'mistral', 'cloudflare']) if (legacy.keys && legacy.keys[p]){ try{ add(p, dec(legacy.keys[p]), { name:'panel de la prueba', rank:'Prime' }, 'panel', legacy.cfAccount); }catch(e){} }
  const all = await ownersRaw();
  for (const [sub, o] of Object.entries(all)){
    for (const p of ORDER) if (o.keys && o.keys[p]){ try{ add(p, dec(o.keys[p]), { sub, name:o.name, rank:o.rank }, 'cuenta', o.cfAccount); }catch(e){} }
  }
  return out;
}
/* Cloudflare necesita el «Account ID»; si no está, se busca con la llave y se recuerda */
async function cfAcct(k){
  if (k.cfAccount) return k.cfAccount;
  const memo = await redis('GET', 'pool:cfacct:' + k.id); if (memo) return memo;
  const r = await fetch((process.env.TRIAL_CF_URL || 'https://api.cloudflare.com/client/v4') + '/accounts?per_page=1', { headers:{ Authorization:'Bearer ' + k.key }, signal:AbortSignal.timeout(8000) }).catch(() => null);
  const d = r && r.ok ? await r.json().catch(() => ({})) : {};
  const id = d && Array.isArray(d.result) && d.result[0] && d.result[0].id;
  if (id) await redis('SET', 'pool:cfacct:' + k.id, id, 'EX', '2592000');
  return id || '';
}
export const baseOf = async k => k.prov === 'cloudflare' ? PROV.cloudflare.base(await cfAcct(k)) : PROV[k.prov].base();

/* ---------- catálogo: solo modelos gratis de texto ---------- */
const DROP = /whisper|guard|tts|orpheus|safeguard|allam|compound|distil|playai|embed|moderation|ocr|voxtral|transcri|lora|vision-preview|lyria|music|audio|image|flux|stable|dall/i;
async function listFor(prov, k){
  const base = await baseOf(k), H = { Authorization:'Bearer ' + k.key };
  if (prov === 'openrouter'){
    const d = await (await fetch(base + '/models', { signal:AbortSignal.timeout(10000) })).json();
    return (d.data || []).filter(m => m && m.id && /:free$/.test(m.id) && !/^openrouter\//.test(m.id) && m.pricing && +m.pricing.prompt === 0 && +m.pricing.completion === 0
      && (!m.architecture || !Array.isArray(m.architecture.output_modalities) || m.architecture.output_modalities.includes('text')) && !DROP.test(m.id))
      .map(m => ({ mid:m.id, name:String(m.name || m.id).replace(/\s*\(free\)\s*$/i, ''), ctx:+m.context_length || 0 }));
  }
  if (prov === 'cloudflare'){
    const r = await fetch(base.replace(/\/ai\/v1$/, '/ai/models/search?per_page=100&task=Text%20Generation'), { headers:H, signal:AbortSignal.timeout(10000) });
    const d = await r.json().catch(() => ({}));
    return (d.result || []).map(m => String(m.name || '')).filter(n => /^@cf\//.test(n) && !DROP.test(n)).map(n => ({ mid:n, name:n.replace(/^@cf\/[^/]+\//, ''), ctx:0 }));
  }
  const d = await (await fetch(base + '/models', { headers:H, signal:AbortSignal.timeout(10000) })).json();
  let L = (d.data || []).filter(m => m && m.id && m.active !== false && !DROP.test(m.id));
  if (prov === 'mistral') L = L.filter(m => !m.capabilities || m.capabilities.completion_chat !== false).filter(m => !m.deprecation && (/-latest$/.test(m.id) || /nemo/.test(m.id)));
  return L.map(m => ({ mid:m.id, name:m.id, ctx:+m.context_window || +m.max_context_length || 0 }));
}
const nice = s => String(s).replace(/^[^/]+\//, '').replace(/-latest$/, '').split(/[-_]/).map(w => /^gpt$/i.test(w) ? 'GPT' : /^oss$/i.test(w) ? 'OSS' : /^\d+(\.\d+)?b$/i.test(w) ? w.toUpperCase() : /^[a-z]/.test(w) ? w[0].toUpperCase() + w.slice(1) : w).join(' ');
export async function models(force){
  if (!force){ const c = await getJ('pool:models'); if (c && Date.now() - c.t < 6 * 3600e3) return c; }
  const keys = await loadKeys(), out = [], provs = [];
  for (const p of ORDER){
    const ks = keys.filter(k => k.prov === p); if (!ks.length) continue;
    let got = null;
    for (const k of ks.slice(0, 2)){ try{ got = await listFor(p, k); if (got && got.length) break; }catch(e){} }
    if (!got || !got.length) got = PROV[p].best.map(mid => ({ mid, name:mid, ctx:0 }));
    provs.push(p);
    got.slice(0, 40).forEach(m => out.push({ id:'sz:' + p + ':' + m.mid, prov:p, mid:m.mid, name:m.name && m.name !== m.mid ? m.name : nice(m.mid), ctx:m.ctx }));
  }
  const bad = (await redis('HGETALL', 'pool:badm').catch(() => [])) || [], gone = new Set();
  for (let i = 0; i < bad.length; i += 2) if (Date.now() - (+bad[i + 1] || 0) < 6 * 3600e3) gone.add(bad[i]);
  const c = { t:Date.now(), provs, list:out.filter(m => !gone.has(m.id)) };
  await setJ('pool:models', c, 21600);
  return c;
}

/* ---------- elegir llave: la menos usada hoy, sin pausas y bajo su tope ---------- */
async function pickKeys(prov){
  const d = today(), ks = (await loadKeys()).filter(k => k.prov === prov); if (!ks.length) return [];
  const r = await pipe(ks.flatMap(k => [['GET', 'pk:n:' + k.id + ':' + d], ['GET', 'pk:down:' + k.id]]));
  return ks.map((k, i) => Object.assign(k, { n:+r[i * 2] || 0, down:r[i * 2 + 1] })).filter(k => !k.down && k.n < PROV[prov].cap).sort((a, b) => a.n - b.n);
}
/* orden de respaldo: el modelo pedido y, si su proveedor no responde, el mejor de los otros */
async function plan(model){
  const cat = await models(false), want = cat.list.find(m => m.id === model);
  const alts = [];
  for (const p of ORDER){ const m = PROV[p].best.map(b => cat.list.find(x => x.prov === p && x.mid === b)).find(Boolean) || cat.list.find(x => x.prov === p); if (m) alts.push(m); }
  if (model && model !== 'sz:auto' && !want) throw err(400, 'Ese modelo no es de los gratis de SynthZ.', 'sz_model');
  return want ? [want, ...alts.filter(a => a.prov !== want.prov)].slice(0, 3) : alts.slice(0, 3);
}

/* ---------- cuota de cada persona ---------- */
export const quotaKey = who => 'q:' + who + ':' + today();
export async function usedToday(who){ return +(await redis('GET', quotaKey(who))) || 0; }

/* ---------- conversar (con streaming) ---------- */
const est = s => Math.ceil(String(s || '').length / 4);
export async function chat({ who, ipKey, messages, model, maxTokens, system, stream = true, onDone }){
  const { dayLimit } = await settings();
  const [used, usedIp] = (await pipe([['GET', quotaKey(who)], ['GET', quotaKey(ipKey)]])).map(x => +x || 0);
  if (used >= dayLimit) throw err(429, 'Llegaste al límite de hoy. Se renueva a medianoche. Si quieres seguir ya, conecta Puter (gratis, opcional).', 'sz_limit');
  if (usedIp >= dayLimit * 3) throw err(429, 'Desde esta conexión ya se usó mucho hoy. Se renueva a medianoche, o conecta Puter (gratis, opcional).', 'sz_limit_ip');
  let msgs = (Array.isArray(messages) ? messages : []).filter(m => m && ['user', 'assistant', 'system'].includes(m.role) && typeof m.content === 'string').slice(-24).map(m => ({ role:m.role, content:m.content.slice(0, 12000) }));
  while (msgs.length > 1 && msgs.reduce((s, m) => s + m.content.length, 0) > 48000) msgs = msgs.slice(1);
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') throw err(400, 'Escribe un mensaje.', 'sz_empty');
  if (system) msgs = [{ role:'system', content:system }, ...msgs.filter(m => m.role !== 'system')];
  const inTok = msgs.reduce((s, m) => s + est(m.content), 0);
  const steps = await plan(model || 'sz:auto');
  if (!steps.length) throw err(503, 'Las IAs están descansando un momento. Mientras tanto, puedes conectar Puter.', 'sz_off');
  const d = today(), t0 = Date.now(), tried = [];
  for (const m of steps){
    const keys = (await pickKeys(m.prov)).slice(0, 2);
    for (const k of keys){
      let up;
      try{
        const base = await baseOf(k);
        const body = { model:m.mid, messages:msgs, stream, max_tokens:Math.min(1600, +maxTokens || 1200), temperature:.6 };
        if (stream && (m.prov === 'groq' || m.prov === 'mistral')) body.stream_options = { include_usage:true };
        if (stream && m.prov === 'openrouter') body.usage = { include:true };
        up = await calm(() => fetch(base + '/chat/completions', { method:'POST', signal:AbortSignal.timeout(30000),
          headers:Object.assign({ Authorization:'Bearer ' + k.key, 'content-type':'application/json' }, m.prov === 'openrouter' ? { 'HTTP-Referer':'https://synthz.app', 'X-Title':'SynthZ' } : {}), body:JSON.stringify(body) }));
      }catch(e){ up = null; }
      if (!up || !up.ok || (stream && !up.body)){
        const s = up ? up.status : 0, txt = up ? await up.text().catch(() => '') : '';
        tried.push(m.prov + ':' + (s || 'sin respuesta'));
        console.error('[synthz] ia', m.prov, k.id, s ? classify(s) : 'sin respuesta');      /* sin llaves ni mensajes */
        const ttl = s === 429 ? (PLAN_RX.test(txt) ? 1800 : 60) : s === 401 || s === 403 || s === 402 ? 3600 : 120;
        /* alerta: si el modelo ya no existe, se esconde para todos 6 h y la lista se rehace */
        if (s === 404 || (s === 400 && /model/i.test(txt))) await pipe([['HSET', 'pool:badm', m.id, String(Date.now())], ['DEL', 'pool:models'], ['LPUSH', 'evl', JSON.stringify({ t:Date.now(), kind:'error', who:'Servidor', rank:'Alerta', sub:'', page:'ia', detail:'Modelo sin servicio: ' + m.name + ' (' + m.prov + ')' })], ['LTRIM', 'evl', '0', '299']]).catch(() => {});
        await pipe([['SET', 'pk:down:' + k.id, (s ? classify(s) : 'sin respuesta') + (txt ? ' · ' + provSaid(txt) : ''), 'EX', String(ttl)], ['HINCRBY', 'st:' + d, 'err', '1']]);
        continue;
      }
      await pipe([['INCR', 'pk:n:' + k.id + ':' + d], ['EXPIRE', 'pk:n:' + k.id + ':' + d, '172800']]);
      const account = async (tok, outChars) => {
        const total = Math.max(1, tok || 0);
        await pipe([['INCRBY', quotaKey(who), String(total)], ['EXPIRE', quotaKey(who), '172800'], ['INCRBY', quotaKey(ipKey), String(total)], ['EXPIRE', quotaKey(ipKey), '172800'],
          ['INCRBY', 'pk:t:' + k.id + ':' + d, String(total)], ['EXPIRE', 'pk:t:' + k.id + ':' + d, '172800'],
          ['INCR', 'stm:' + Math.floor(Date.now() / 60e3)], ['EXPIRE', 'stm:' + Math.floor(Date.now() / 60e3), '3600'],
          ['HINCRBY', 'st:' + d, 'req', '1'], ['HINCRBY', 'st:' + d, 'tok', String(total)], ['HINCRBY', 'st:' + d, 'ms', String(Date.now() - t0)], ['EXPIRE', 'st:' + d, '1209600']]).catch(() => {});
        if (onDone) try{ await onDone(total); }catch(e){}
        return total;
      };
      const meta = { prov:m.prov, provName:PROV[m.prov].name, model:m.id, name:m.name, fallback:m.id !== (steps[0] || {}).id };
      if (!stream){
        const j = await up.json().catch(() => ({})), text = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
        if (typeof text !== 'string' || !text.trim()) continue;
        const u = j.usage || {}, tok = (u.prompt_tokens || 0) + (u.completion_tokens || 0) || inTok + est(text);
        const total = await account(tok);
        return { text:text.trim(), meta, used:used + total, limit:dayLimit };
      }
      /* streaming: se pasa tal cual y al final se suma lo gastado (lo que dijo el proveedor o una estimación) */
      const dec2 = new TextDecoder(), enc2 = new TextEncoder(); let buf = '', usage = null, outChars = 0;
      const ts = new TransformStream({
        transform(chunk, ctl){
          ctl.enqueue(chunk);
          buf += dec2.decode(chunk, { stream:true }); let i;
          while ((i = buf.indexOf('\n')) >= 0){
            const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
            if (!line.startsWith('data:')) continue; const x = line.slice(5).trim(); if (x === '[DONE]') continue;
            try{ const j = JSON.parse(x); const u = j.usage || (j.x_groq && j.x_groq.usage); if (u) usage = u; const c = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content; if (typeof c === 'string') outChars += c.length; }catch(e){}
          }
        },
        async flush(ctl){
          const tok = usage ? (usage.prompt_tokens || 0) + (usage.completion_tokens || 0) : inTok + Math.ceil(outChars / 4);
          const total = await account(tok);
          ctl.enqueue(enc2.encode('data: ' + JSON.stringify({ sz:{ used:used + total, limit:dayLimit, spent:total, est:!usage } }) + '\n\n'));
        }
      });
      return { stream:up.body.pipeThrough(ts), meta, used, limit:dayLimit };
    }
  }
  await redis('HINCRBY', 'st:' + d, 'fail', '1').catch(() => {});
  throw err(503, 'Las IAs están muy ocupadas ahora mismo. Intenta en un momento o conecta Puter.', 'sz_down');
}

/* ---------- estado para el panel: cada llave con su uso de hoy ---------- */
export async function status(){
  const d = today(), keys = await loadKeys();
  const r = keys.length ? await pipe(keys.flatMap(k => [['GET', 'pk:n:' + k.id + ':' + d], ['GET', 'pk:t:' + k.id + ':' + d], ['GET', 'pk:down:' + k.id], ['GET', 'pk:chk:' + k.id]])) : [];
  return keys.map((k, i) => { let chk = null; try{ chk = JSON.parse(r[i * 4 + 3] || 'null'); }catch(e){} return { id:k.id, prov:k.prov, provName:PROV[k.prov].name, key:mask(k.key), owner:k.owner, src:k.src, n:+r[i * 4] || 0, tok:+r[i * 4 + 1] || 0, cap:PROV[k.prov].cap, down:r[i * 4 + 2] || '', check:chk }; });
}
/* probar una llave con un mensaje mínimo (máx. 4 palabras de respuesta) */
export async function checkKey(k){
  try{
    const base = await baseOf(k);
    if (k.prov === 'cloudflare' && /accounts\/\/ai/.test(base)) return { ok:false, kind:'auth', state:'no encontré el Account ID de Cloudflare' };
    const list = await listFor(k.prov, k).catch(() => []);
    const mid = PROV[k.prov].best.find(b => list.some(m => m.mid === b)) || (list[0] && list[0].mid) || PROV[k.prov].best[0];
    await wait(k.prov === 'mistral' ? 1200 : 100);
    const t0 = Date.now();
    const c = await calm(() => fetch(base + '/chat/completions', { method:'POST', headers:{ Authorization:'Bearer ' + k.key, 'Content-Type':'application/json' }, body:JSON.stringify({ model:mid, messages:[{ role:'user', content:'Responde solo: ok' }], max_tokens:4, temperature:0 }), signal:AbortSignal.timeout(12000) }));
    let out;
    if (c.ok){ const j = await c.json().catch(() => ({})); out = j && j.choices ? { ok:true, kind:'ok', state:'funciona · respondió en ' + ((Date.now() - t0) / 1000).toFixed(1).replace('.', ',') + ' s', model:mid } : { ok:false, kind:'err', state:'respondió en un formato raro', model:mid }; }
    else { const tx = await c.text().catch(() => ''), s = c.status;
      out = s === 402 || (s === 403 && PLAN_RX.test(tx)) ? { ok:false, kind:'plan', state:'pide un plan o un pago (SynthZ no lo activa)' } : s === 401 || s === 403 ? { ok:false, kind:'auth', state:'llave no autorizada' } : s === 429 ? { ok:false, kind:'limit', state:'límite gratis alcanzado por ahora' } : { ok:false, kind:'down', state:classify(s) };
      out.detail = provSaid(tx); out.model = mid; }
    await redis('SET', 'pk:chk:' + k.id, JSON.stringify(Object.assign({ t:Date.now() }, out)), 'EX', '604800');
    if (out.ok) await redis('DEL', 'pk:down:' + k.id);
    return out;
  }catch(e){ return { ok:false, kind:'down', state:'no respondió a tiempo' }; }
}
