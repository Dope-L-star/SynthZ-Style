/* SynthonIA (ayudante) y ayuda de personas del equipo.
   POST { action:'ask', q, hist? }       → SynthonIA responde con una IA gratis (máx. 15 al día por persona)
   POST { action:'open', text, page? }   → pedir ayuda a una persona del equipo (necesita cuenta)
   POST { action:'say', id, text }       → escribir en la conversación de ayuda (la persona o el equipo)
   POST { action:'close', id }           → terminar la conversación
   GET                                   → tu conversación de ayuda; el equipo además ve la bandeja
   GET ?id=…                             → (equipo) una conversación completa
   Nunca se leen ni se envían tus chats: solo lo que escribes aquí. */
import { route, body, json, fail, redis, pipe, getJ, setJ, limit, auth, roleOf, rid, str, today, sha, sbFeedback } from './_lib.js';
import { trialComplete } from './trial.js';

const ASK_DAY = 15, KEEP = 30 * 86400, URGENT_MS = 15 * 60e3;
const RANK = { owner:'Prime', admin:'ZFlow', staff:'Symmetrix', user:'Synther' };
const ipOf = req => (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
const err = (s, m, code) => Object.assign(new Error(m), { status:s, code });
const SYSTEM = 'Eres SynthonIA, la ayudante de SynthZ y SynthFlow. Eres amable, alegre, breve y hablas sencillo, como a alguien que no sabe nada de tecnología. Responde en el idioma de la pregunta (normalmente español de Colombia) en menos de 70 palabras. '
  + 'SOLO ayudas con: cómo usar SynthZ y SynthFlow, charla sencilla (saludos, cómo estás), chistes cortos y datos curiosos breves. '
  + 'NO haces tareas, código, ensayos, cálculos, traducciones ni explicaciones largas: si te lo piden, di con cariño que eso lo hace mejor una IA del chat de SynthFlow y que solo tienen que escribirlo en la caja de abajo. '
  + 'Datos: SynthFlow es el chat. Es gratis: cada persona tiene un límite gratis al día que se llena otra vez a medianoche (un anillo muestra cómo va; nunca digas un número de mensajes). Las IAs conectadas son IAs gratis que ya vienen listas en la página: no hay que configurar nada ni dar tarjeta. Sin cuenta se pueden probar 5 mensajes al día; para seguir FlowIAndo hay que entrar o crear una cuenta, que es gratis, sin correo ni tarjeta, y da mucho más límite (esto sí lo puedes decir con el número 5).  Puter es opcional: «conecta tu versión pro de las IAs más usadas» (ChatGPT, Claude, Gemini…), gratis, con un límite que se renueva cada mes y se conecta con un clic. Explica siempre QUÉ HACE cada cosa, no su nombre técnico. Nunca uses palabras técnicas como modelo, token, API, servidor o sesión. '
  + 'Arriba se elige la IA (por ejemplo ChatGPT, Gemini, Claude, Llama) y se pueden comparar hasta 4. El modo agente (en la barra de la izquierda) mejora lo que escribes y se lo pasa a la IA que más sabe; luego decides si te quedas con esa IA. '
  + 'Los chats se guardan en el dispositivo, en la cuenta y, si quieres, en Google Drive. La Guía enseña todo paso a paso. '
  + 'Nunca menciones proveedores técnicos ni llaves. Si no sabes algo o es un problema de cuenta, sugiere «Hablar con el equipo». Nunca pidas contraseñas.';

const pub = r => r && { id:r.id, status:r.status, t:r.t, text:r.text, page:r.page, user:r.user, by:r.by, urgent:r.status === 'open' && Date.now() - r.t > URGENT_MS, msgs:(r.msgs || []).slice(-60) };
const summary = r => r && { id:r.id, status:r.status, t:r.t, last:(r.msgs && r.msgs.length ? r.msgs[r.msgs.length - 1].t : r.t), text:String(r.text).slice(0, 140), user:r.user, by:r.by, n:(r.msgs || []).length, urgent:r.status === 'open' && Date.now() - r.t > URGENT_MS };
const isTeam = me => roleOf(me) !== 'user';
const who = me => ({ sub:me.sub, name:String(me.name || me.username || 'Synther').slice(0, 40), username:me.username || '', rank:RANK[roleOf(me)] });

export default route({
  async GET(req){
    const me = await auth(req), u = new URL(req.url), id = u.searchParams.get('id');
    if (id){
      if (!/^[\w-]{8,30}$/.test(id)) return fail(400, 'Conversación no válida.');
      const r = await getJ('hq:' + id); if (!r) return fail(404, 'Esa conversación ya no existe.');
      if (r.sub !== me.sub && !isTeam(me)) return fail(403, 'No puedes ver esta conversación.');
      return json({ item:pub(r) });
    }
    const cur = await redis('GET', 'hq:u:' + me.sub), mine = cur ? await getJ('hq:' + cur) : null;
    const out = { mine:mine && mine.status !== 'done' ? pub(mine) : null, team:isTeam(me) };
    if (out.team){
      const ids = (await redis('LRANGE', 'hq:list', '0', '79')) || [];
      const rows = ids.length ? await pipe(ids.map(x => ['GET', 'hq:' + x])) : [];
      const items = rows.map(v => { try{ return v ? JSON.parse(v) : null; }catch(e){ return null; } }).filter(r => r && (r.status !== 'done' || Date.now() - (r.done || r.t) < 2 * 86400e3)).map(summary);
      out.items = items; out.open = items.filter(r => r.status === 'open').length;
    }
    return json(out);
  },
  async POST(req){
    const b = await body(req, 20000), a = b.action;

    if (a === 'ask'){
      const me = await auth(req, true).catch(() => null);
      const k = 'hp:' + (me ? me.sub : sha('ip:' + ipOf(req)).slice(0, 16)) + ':' + today();
      const q = str(b.q, 600); if (q.length < 2) return fail(400, 'Escribe tu pregunta.');
      const n = await redis('INCR', k); if (+n === 1) await redis('EXPIRE', k, '172800');
      if (+n > ASK_DAY){ await redis('DECR', k); throw err(429, 'Ya me hiciste ' + ASK_DAY + ' preguntas nuevas hoy. Mañana te respondo más; mientras tanto mira la Guía o habla con el equipo.', 'helper_day'); }
      await limit('hp-ip:' + ipOf(req), 40, 86400);
      const hist = (Array.isArray(b.hist) ? b.hist : []).filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').slice(-6).map(m => ({ role:m.role, content:m.content.slice(0, 600) }));
      try{
        const r = await trialComplete([{ role:'system', content:SYSTEM }, ...hist, { role:'user', content:q }], 320, (me ? me.sub : sha('ip:' + ipOf(req)).slice(0, 16)));
        return json({ text:r.text, left:Math.max(0, ASK_DAY - n) });
      }catch(e){ await redis('DECR', k); throw e; }        /* si no respondió, esa pregunta no te cuenta */
    }

    /* «Cuéntanos qué mejorar» (beta): cualquiera puede escribir, con o sin cuenta */
    if (a === 'feedback'){
      const me0 = await auth(req, true).catch(() => null);
      await limit('fb:' + ipOf(req), 8, 3600);
      const text = str(b.text, 1000); if (text.length < 3) return fail(400, 'Cuéntanos un poquito más.');
      const cat = ['idea', 'error', 'confuso', 'otro'].includes(b.cat) ? b.cat : 'otro';
      const r = { id:rid(10), t:Date.now(), cat, text, page:str(b.page, 60), status:'nuevo', who:me0 ? '@' + (me0.username || me0.name || 'synther') : 'Invitado', rank:me0 ? RANK[roleOf(me0)] : 'Invitado', sub:me0 ? me0.sub : '' };
      await pipe([['HSET', 'fbh', r.id, JSON.stringify(r)], ['LPUSH', 'fb', r.id], ['LTRIM', 'fb', '0', '299']]);
      await sbFeedback(r.sub, cat, text, r.page);
      return json({ ok:true });
    }
    const me = await auth(req);
    if (a === 'fbset'){
      if (!isTeam(me)) return fail(403, 'Solo el equipo.');
      const id = typeof b.id === 'string' && /^[\w-]{8,30}$/.test(b.id) ? b.id : '', st = ['nuevo', 'visto', 'resuelto'].includes(b.status) ? b.status : '';
      const raw = id && st ? await redis('HGET', 'fbh', id) : null; if (!raw) return fail(404, 'Ese comentario ya no existe.');
      const r = JSON.parse(raw); r.status = st; r.by = who(me).name; await redis('HSET', 'fbh', id, JSON.stringify(r));
      return json({ ok:true, item:r });
    }
    if (a === 'open'){
      const text = str(b.text, 1000); if (text.length < 3) return fail(400, 'Cuéntale al equipo en qué te ayudamos.');
      const cur = await redis('GET', 'hq:u:' + me.sub), old = cur ? await getJ('hq:' + cur) : null;
      if (old && old.status !== 'done'){
        old.msgs.push({ from:'user', name:who(me).name, text, t:Date.now() }); old.msgs = old.msgs.slice(-60);
        await setJ('hq:' + old.id, old, KEEP); return json({ item:pub(old) });
      }
      await limit('hq-open:' + me.sub, 4, 3600);
      const r = { id:rid(10), sub:me.sub, user:who(me), text, page:str(b.page, 80), t:Date.now(), status:'open', by:null, msgs:[{ from:'user', name:who(me).name, text, t:Date.now() }] };
      await setJ('hq:' + r.id, r, KEEP);
      await pipe([['SET', 'hq:u:' + me.sub, r.id, 'EX', String(KEEP)], ['LPUSH', 'hq:list', r.id], ['LTRIM', 'hq:list', '0', '199']]);
      return json({ item:pub(r) });
    }
    /* el equipo le escribe primero a alguien que vio con dificultades (solo cuentas, nunca invitados) */
    if (a === 'reach'){
      if (!isTeam(me)) return fail(403, 'Solo el equipo puede escribir primero.');
      const sub = typeof b.sub === 'string' && /^p[\w-]{4,30}$/.test(b.sub) ? b.sub : '', text = str(b.text, 1000);
      if (!sub || text.length < 2) return fail(400, 'Falta a quién y qué escribir.');
      const u = await getJ('u:' + sub); if (!u) return fail(404, 'Esa cuenta ya no existe.');
      const w = who(me), cur = await redis('GET', 'hq:u:' + sub), old = cur ? await getJ('hq:' + cur) : null;
      const r = old && old.status !== 'done' ? old : { id:rid(10), sub, user:{ sub, name:String(u.name || u.username || 'Synther').slice(0, 40), username:u.username || '', rank:RANK[roleOf(u)] }, text:'(el equipo te escribió primero)', page:'', t:Date.now(), status:'taken', by:null, msgs:[] };
      r.msgs.push({ from:'team', name:w.name, rank:w.rank, text, t:Date.now() }); r.status = 'taken'; r.by = { name:w.name, rank:w.rank, t:Date.now() };
      await setJ('hq:' + r.id, r, KEEP);
      if (!old || old.status === 'done') await pipe([['SET', 'hq:u:' + sub, r.id, 'EX', String(KEEP)], ['LPUSH', 'hq:list', r.id], ['LTRIM', 'hq:list', '0', '199']]);
      return json({ item:pub(r) });
    }
    const id = typeof b.id === 'string' && /^[\w-]{8,30}$/.test(b.id) ? b.id : '';
    const r = id ? await getJ('hq:' + id) : null;
    if (!r) return fail(404, 'Esa conversación ya no existe.');
    const team = isTeam(me), owner = r.sub === me.sub;
    if (!team && !owner) return fail(403, 'No puedes escribir aquí.');
    if (a === 'say'){
      await limit('hq-say:' + me.sub, 60, 600);
      const text = str(b.text, 1000); if (!text) return fail(400, 'Escribe un mensaje.');
      if (r.status === 'done') return fail(409, 'Esta conversación ya terminó. Abre una nueva si necesitas más ayuda.');
      const w = who(me), fromTeam = team && !owner;
      r.msgs.push({ from:fromTeam ? 'team' : 'user', name:w.name, rank:fromTeam ? w.rank : undefined, text, t:Date.now() }); r.msgs = r.msgs.slice(-60);
      if (fromTeam && r.status === 'open'){ r.status = 'taken'; r.by = { name:w.name, rank:w.rank, t:Date.now() }; }
      await setJ('hq:' + r.id, r, KEEP); return json({ item:pub(r) });
    }
    if (a === 'close'){
      r.status = 'done'; r.done = Date.now(); r.closedBy = team && !owner ? 'team' : 'user';
      await setJ('hq:' + r.id, r, KEEP); if (owner) await redis('DEL', 'hq:u:' + me.sub);
      return json({ item:pub(r) });
    }
    return fail(400, 'Acción desconocida.');
  }
});
