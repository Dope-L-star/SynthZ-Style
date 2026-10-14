/* Prueba guiada que paga SynthZ (modalidad C): 5 mensajes por persona, SOLO para aprender en la guía.
   POST { action:'start' }                    → entrega una ficha de prueba (máx. 3 por conexión al día)
   POST { action:'chat', token, messages }     → responde en vivo con Groq, Mistral o Cloudflare (la que esté disponible)
   GET                                         → estado de las IA de la prueba (Prime, ZFlow y Symmetrix)
   POST { action:'keys', groq?, mistral?, cloudflare?, cfAccount? } → guardar llaves cifradas (Prime y ZFlow)
   POST { action:'check' }                     → probar cada llave sin gastar mensajes (Prime y ZFlow)
   Reglas: cero cobros (solo planes gratis y topes diarios propios), las llaves nunca salen del servidor,
   y si una IA falla se intenta con otra sin romper el resto de SynthZ. */
import { route, body, json, fail, auth, redis, pipe, getJ, setJ, rid, enc, dec, limit, today, str, roleOf } from './_lib.js';
import { CID_RX } from './config.js';

export const TRIAL_MAX = 5;
const GLOBAL_DAY = +process.env.TRIAL_DAY_CAP || 300;        /* mensajes de prueba al día entre todos */
const IP_DAY = 12;                                              /* por conexión al día */
const SYSTEM = 'Eres el asistente de la prueba guiada de SynthFlow (SynthZ). Responde en español, claro y amable, en menos de 120 palabras. Si te preguntan por SynthZ: es un espacio para hablar gratis con cientos de modelos de IA (Puter y OpenRouter), compararlos y ver cuánto consumen.';
const P = {
  groq:{ name:'Groq', base:() => process.env.TRIAL_GROQ_URL || 'https://api.groq.com/openai/v1', cap:+process.env.TRIAL_CAP_GROQ || 200,
    models:['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'openai/gpt-oss-20b'] },
  mistral:{ name:'Mistral', base:() => process.env.TRIAL_MISTRAL_URL || 'https://api.mistral.ai/v1', cap:+process.env.TRIAL_CAP_MISTRAL || 150,
    models:['mistral-small-latest', 'open-mistral-nemo', 'ministral-8b-latest'] },
  cloudflare:{ name:'Cloudflare', base:acct => (process.env.TRIAL_CF_URL || 'https://api.cloudflare.com/client/v4') + '/accounts/' + acct + '/ai/v1', cap:+process.env.TRIAL_CAP_CF || 100,
    models:['@cf/meta/llama-3.1-8b-instruct', '@cf/meta/llama-3.1-8b-instruct-fast', '@cf/meta/llama-3.2-3b-instruct', '@cf/meta/llama-3.3-70b-instruct-fp8-fast', '@cf/google/gemma-3-12b-it', '@cf/mistralai/mistral-small-3.1-24b-instruct', '@cf/mistral/mistral-7b-instruct-v0.1'] }
};
const ORDER = ['groq', 'mistral', 'cloudflare'];
const wait = ms => new Promise(r => setTimeout(r, ms));
/* pide algo al proveedor; si responde 429 por ir muy rápido (no por cuota agotada), espera y reintenta UNA vez */
async function calm(make){
  let r = await make();
  if (r.status !== 429) return r;
  const txt = await r.text().catch(() => '');
  if (PLAN_RX.test(txt)) return new Response(txt, { status:429 });
  await wait(Math.min(3000, Math.max(1100, (+r.headers.get('retry-after') || 0) * 1000)));
  return make();
}
const err = (s, m, code) => Object.assign(new Error(m), { status:s, code });
const ipOf = req => (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
const ENV_KEY = { groq:'GROQ_API_KEY', mistral:'MISTRAL_API_KEY', cloudflare:'CLOUDFLARE_API_TOKEN' };

/* llaves: primero las variables de Vercel; si no están, las que guardó Prime/ZFlow (cifradas) */
async function config(){
  const c = (await getJ('cfg:trial')) || {};
  const out = { keys:{}, model:c.model || {}, cfAccount:process.env.CLOUDFLARE_ACCOUNT_ID || c.cfAccount || '', src:{} };
  for (const id of ORDER){
    const e = process.env[ENV_KEY[id]];
    if (e){ out.keys[id] = e; out.src[id] = 'vercel'; continue; }
    if (c.keys && c.keys[id]){ try{ out.keys[id] = dec(c.keys[id]); out.src[id] = 'panel'; }catch(x){ out.src[id] = 'ilegible'; } }
  }
  return out;
}
const mask = k => k ? '••••' + String(k).slice(-4) : '';
/* Cloudflare necesita el «Account ID»: si no está, se busca solo con la llave */
async function cfAccount(cfg){
  if (cfg.cfAccount) return cfg.cfAccount;
  const r = await fetch((process.env.TRIAL_CF_URL || 'https://api.cloudflare.com/client/v4') + '/accounts?per_page=1', { headers:{ Authorization:'Bearer ' + cfg.keys.cloudflare }, signal:AbortSignal.timeout(8000) }).catch(() => null);
  const d = r && r.ok ? await r.json().catch(() => ({})) : {};
  const id = d && Array.isArray(d.result) && d.result[0] && d.result[0].id;
  if (id){ const c = (await getJ('cfg:trial')) || {}; c.cfAccount = id; await setJ('cfg:trial', c); }
  return id || '';
}
const urlOf = async (id, cfg) => id === 'cloudflare' ? P.cloudflare.base(await cfAccount(cfg)) : P[id].base();
/* errores clasificados en español; el detalle técnico solo va al registro (sin llaves ni mensajes del usuario) */
const classify = s => s === 401 || s === 403 ? 'llave inválida o sin permiso' : s === 402 ? 'requiere pago (bloqueado: SynthZ no paga)' : s === 404 ? 'modelo no disponible' : s === 429 ? 'cuota gratis agotada por ahora' : s >= 500 ? 'el proveedor está fallando' : 'error ' + s;
/* resultado de la prueba de llaves en 4 estados claros: funciona · no autorizada · pide un plan · límite */
const PLAN_RX = /billing|payment|subscri|upgrade|plan|credit|quota exceeded|insufficient/i;
function verdict(s, txt){
  if (s === 402 || (s === 403 && PLAN_RX.test(txt || ''))) return { kind:'plan', state:'pide un plan o un pago (SynthZ no lo activa)' };
  if (s === 401 || s === 403) return { kind:'auth', state:'llave no autorizada o sin permiso para este modelo' };
  if (s === 429) return { kind:'limit', state:PLAN_RX.test(txt || '') ? 'cuota gratis agotada: pide un plan para seguir' : 'límite gratis alcanzado por ahora' };
  if (s === 404) return { kind:'model', state:'el modelo no está disponible para esta llave' };
  if (s >= 500) return { kind:'down', state:'el proveedor está fallando ahora' };
  return { kind:'err', state:'respondió con error ' + s };
}

async function checkOne(id, cfg){
  if (!cfg.keys[id]) return { id, ok:false, state:'sin llave' };
  try{
    const base = await urlOf(id, cfg);
    if (id === 'cloudflare' && /accounts\/\/ai/.test(base)) return { id, ok:false, state:'no encontré el Account ID de Cloudflare' };
    const murl = id === 'cloudflare' ? base.replace(/\/ai\/v1$/, '/ai/models/search?per_page=100&task=Text%20Generation') : base + '/models';
    const r = await calm(() => fetch(murl, { headers:{ Authorization:'Bearer ' + cfg.keys[id] }, signal:AbortSignal.timeout(10000) }));
    if (!r.ok){ const v = verdict(r.status, await r.text().catch(() => '')); return { id, ok:false, kind:v.kind, state:v.state, status:r.status }; }
    const d = await r.json().catch(() => ({}));
    /* Cloudflare da «id» (un código) y «name» (@cf/…); Groq y Mistral dan «id»: se guardan los dos */
    const have = new Set(); (Array.isArray(d.data) ? d.data : Array.isArray(d.result) ? d.result : []).forEach(m => { if (m && m.id) have.add(String(m.id)); if (m && m.name) have.add(String(m.name)); });
    const spare = id === 'cloudflare' ? [...have].find(n => /^@cf\/.*(llama-3\.[123]-[38]b|gemma)/i.test(n)) : null;
    const model = (cfg.model[id] && (!have.size || have.has(cfg.model[id])) ? cfg.model[id] : null) || P[id].models.find(m => have.has(m)) || spare || (have.size ? null : P[id].models[0]);
    if (!model) return { id, ok:false, kind:'model', state:'ninguno de los modelos gratis esperados está disponible' };
    /* prueba de verdad: un mensaje mínimo (máx. 4 palabras de respuesta) para confirmar que de verdad contesta */
    /* el plan gratis de Mistral permite ~1 petición por segundo: se espera un poco tras pedir la lista */
    const ask = () => fetch(base + '/chat/completions', { method:'POST', headers:{ Authorization:'Bearer ' + cfg.keys[id], 'Content-Type':'application/json' },
      body:JSON.stringify({ model, messages:[{ role:'user', content:'Responde solo: ok' }], max_tokens:4, temperature:0 }), signal:AbortSignal.timeout(12000) });
    await wait(id === 'mistral' ? 1200 : 150);
    /* un 429 por ir muy rápido no es «límite agotado»: se reintenta una vez con calma */
    let t0 = Date.now(); const c = await calm(() => { t0 = Date.now(); return ask(); });
    if (!c.ok){ const v = verdict(c.status, await c.text().catch(() => '')); return { id, ok:false, kind:v.kind, state:v.state, status:c.status, model }; }
    const j = await c.json().catch(() => ({}));
    const said = j && j.choices && j.choices[0] && j.choices[0].message && typeof j.choices[0].message.content === 'string';
    return said ? { id, ok:true, kind:'ok', state:'funciona · respondió en ' + ((Date.now() - t0) / 1000).toFixed(1).replace('.', ',') + ' s', model }
                : { id, ok:false, kind:'err', state:'respondió, pero en un formato que no entiendo', model };
  }catch(e){ return { id, ok:false, kind:'down', state:'no respondió a tiempo' }; }
}

export default route({
  async GET(req){
    const me = await auth(req);
    if (roleOf(me) === 'user') return fail(403, 'Solo el equipo de SynthZ puede ver esto.');
    const cfg = await config(), d = today();
    const used = await pipe([['GET', 'trial:day:' + d], ...ORDER.map(id => ['GET', 'trial:p:' + id + ':' + d]), ...ORDER.map(id => ['GET', 'trial:down:' + id]), ['GET', 'trial:health']]);
    let health = {}; try{ health = JSON.parse(used[used.length - 1] || '{}'); }catch(e){}
    const dv = (await getJ('cfg:drive').catch(() => null)) || {}, denv = (process.env.GOOGLE_DRIVE_CLIENT_ID || '').trim();
    const drive = { clientId:denv || dv.clientId || '', source:denv ? 'vercel' : dv.clientId ? 'panel' : '' };
    return json({ drive, max:TRIAL_MAX, dayCap:GLOBAL_DAY, today:+used[0] || 0, providers:ORDER.map((id, i) => ({
      id, name:P[id].name, key:mask(cfg.keys[id]), source:cfg.src[id] || '', model:cfg.model[id] || '', used:+used[1 + i] || 0, cap:P[id].cap,
      down:!!used[1 + ORDER.length + i], health:health[id] || null
    })) });
  },
  async POST(req){
    const ip = ipOf(req), b = await body(req, 60_000), a = b.action;

    if (a === 'start'){
      const cfg0 = await config();
      if (!ORDER.some(id => cfg0.keys[id])) throw err(503, 'La prueba todavía no está activada. Mientras tanto, conecta Puter: es gratis y con un clic.', 'trial_off');
      await limit('trial-start:' + ip, 3, 86400);
      const token = rid(18);
      await redis('SET', 'tr:' + token, '0', 'EX', String(7 * 86400));
      return json({ token, left:TRIAL_MAX, max:TRIAL_MAX });
    }

    if (a === 'keys' || a === 'check'){
      const me = await auth(req), role = roleOf(me);
      if (!['owner', 'admin'].includes(role)) return fail(403, 'Solo Prime y ZFlow pueden cambiar las llaves de la prueba.');
      await limit('trial-admin:' + me.sub, 30, 600);
      if (a === 'keys'){
        const c = (await getJ('cfg:trial')) || {}; c.keys = c.keys || {};
        for (const id of ORDER){ if (typeof b[id] === 'string'){ const k = str(b[id], 300); if (k) c.keys[id] = enc(k); else delete c.keys[id]; } }
        if (typeof b.cfAccount === 'string') c.cfAccount = str(b.cfAccount, 64).replace(/[^a-f0-9]/gi, '');
        await setJ('cfg:trial', c);
      }
      const cfg = await config(), res = await Promise.all(ORDER.map(id => checkOne(id, cfg)));
      const c = (await getJ('cfg:trial')) || {}; c.model = c.model || {};
      res.forEach(r => { if (r.model) c.model[r.id] = r.model; });
      await setJ('cfg:trial', c);
      await redis('SET', 'trial:health', JSON.stringify(Object.fromEntries(res.map(r => [r.id, { ok:r.ok, kind:r.kind, state:r.state, t:Date.now() }]))));
      return json({ ok:true, providers:res.map(r => ({ id:r.id, name:P[r.id].name, ok:r.ok, kind:r.kind, state:r.state, model:r.model || '' })) });
    }

    /* Google Drive para los chats: Prime/ZFlow pegan el «ID de cliente» (público) de Google; no hay secretos */
    if (a === 'drive'){
      const me = await auth(req), role = roleOf(me);
      if (!['owner', 'admin'].includes(role)) return fail(403, 'Solo Prime y ZFlow pueden activar Google Drive.');
      await limit('trial-admin:' + me.sub, 30, 600);
      const id = str(b.clientId || '', 120).trim();
      if (id && !CID_RX.test(id)) return fail(400, 'Ese no parece un «ID de cliente» de Google. Termina en .apps.googleusercontent.com');
      await setJ('cfg:drive', id ? { clientId:id, by:me.sub, t:Date.now() } : {});
      return json({ ok:true, clientId:id });
    }

    if (a === 'chat'){
      const token = typeof b.token === 'string' && /^[\w-]{20,40}$/.test(b.token) ? b.token : '';
      if (!token || !(await redis('EXISTS', 'tr:' + token))) throw err(403, 'Tu prueba no es válida. Vuelve a abrir la guía para empezar una.', 'trial_bad');
      await limit('trial-ip:' + ip, IP_DAY, 86400);
      const d = today();
      const [n, g] = await pipe([['INCR', 'tr:' + token], ['INCR', 'trial:day:' + d], ['EXPIRE', 'trial:day:' + d, '172800']]);
      const giveBack = () => pipe([['DECR', 'tr:' + token], ['DECR', 'trial:day:' + d]]).catch(() => {});
      if (+n > TRIAL_MAX){ await giveBack(); throw err(429, 'Se acabaron tus ' + TRIAL_MAX + ' mensajes de prueba. Conecta Puter (gratis, con un clic) u OpenRouter para seguir.', 'trial_done'); }
      if (+g > GLOBAL_DAY){ await giveBack(); throw err(503, 'La prueba gratis ya se usó mucho hoy. Vuelve mañana o conecta Puter, que es gratis.', 'trial_busy'); }
      /* mensajes: solo texto, los últimos 10, máximo 6.000 caracteres en total */
      let msgs = (Array.isArray(b.messages) ? b.messages : []).filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').slice(-10).map(m => ({ role:m.role, content:m.content.slice(0, 3000) }));
      while (msgs.length > 1 && msgs.reduce((s, m) => s + m.content.length, 0) > 6000) msgs = msgs.slice(1);
      if (!msgs.length || msgs[msgs.length - 1].role !== 'user'){ await giveBack(); throw err(400, 'Escribe un mensaje para la prueba.'); }
      const cfg = await config();
      const avail = ORDER.filter(id => cfg.keys[id]);
      if (!avail.length){ await giveBack(); throw err(503, 'La prueba todavía no está activada. Mientras tanto, conecta Puter: es gratis y con un clic.', 'trial_off'); }
      const flags = await pipe(avail.flatMap(id => [['GET', 'trial:p:' + id + ':' + d], ['GET', 'trial:down:' + id]]));
      const ok = avail.filter((id, i) => !flags[i * 2 + 1] && (+flags[i * 2] || 0) < P[id].cap);
      const prefer = ORDER.includes(b.prefer) ? b.prefer : '';
      const order = [...(prefer && ok.includes(prefer) ? [prefer] : []), ...ok.filter(x => x !== prefer)].slice(0, 2);   /* respaldo limitado: máx. 2 intentos */
      for (const id of order){
        let up;
        try{
          const base = await urlOf(id, cfg);
          up = await calm(() => fetch(base + '/chat/completions', {
            method:'POST', signal:AbortSignal.timeout(25000),
            headers:{ Authorization:'Bearer ' + cfg.keys[id], 'content-type':'application/json' },
            body:JSON.stringify(Object.assign({ model:cfg.model[id] || P[id].models[0], messages:[{ role:'system', content:SYSTEM }, ...msgs], stream:true, max_tokens:450, temperature:.6 }, id === 'groq' ? { stream_options:{ include_usage:true } } : {}))
          }));
        }catch(e){ up = null; }
        if (!up || !up.ok || !up.body){
          const s = up ? up.status : 0, txt = up && s === 429 ? await up.text().catch(() => '') : '';
          console.error('[synthz] prueba', id, s ? classify(s) : 'sin respuesta');      /* sin llaves ni contenido */
          /* 429 por ir rápido: pausa de 1 minuto; 429 por cuota gratis agotada: 10 minutos */
          await redis('SET', 'trial:down:' + id, s ? classify(s) : 'sin respuesta', 'EX', s === 429 ? (PLAN_RX.test(txt) ? '600' : '60') : '300');
          continue;
        }
        await pipe([['INCR', 'trial:p:' + id + ':' + d], ['EXPIRE', 'trial:p:' + id + ':' + d, '172800']]);
        return new Response(up.body, { status:200, headers:{ 'content-type':'text/event-stream; charset=utf-8', 'cache-control':'no-store', 'x-trial-left':String(Math.max(0, TRIAL_MAX - n)), 'x-trial-provider':P[id].name, 'access-control-expose-headers':'x-trial-left, x-trial-provider' } });
      }
      await giveBack();                                  /* si ninguna respondió, ese mensaje no te cuenta */
      throw err(503, 'Las IA de la prueba no responden ahora mismo. Intenta en un rato o conecta Puter, que es gratis.', 'trial_down');
    }
    return fail(400, 'Acción desconocida.');
  }
});
