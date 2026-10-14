/* SynthonIA (ayudante) y ayuda de personas del equipo.
   POST { action:'ask', q, hist? }       → SynthonIA responde con una IA gratis (máx. 15 al día por persona)
   POST { action:'open', text, page? }   → pedir ayuda a una persona del equipo (necesita cuenta)
   POST { action:'say', id, text }       → escribir en la conversación de ayuda (la persona o el equipo)
   POST { action:'close', id }           → terminar la conversación
   GET                                   → tu conversación de ayuda; el equipo además ve la bandeja
   GET ?id=…                             → (equipo) una conversación completa
   Nunca se leen ni se envían tus chats: solo lo que escribes aquí. */
import { route, body, json, fail, redis, pipe, getJ, setJ, limit, auth, roleOf, rid, str, today, sha } from './_lib.js';
import { trialComplete } from './trial.js';

const ASK_DAY = 15, KEEP = 30 * 86400, URGENT_MS = 15 * 60e3;
const RANK = { owner:'Prime', admin:'ZFlow', staff:'Symmetrix', user:'Synther' };
const ipOf = req => (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
const err = (s, m, code) => Object.assign(new Error(m), { status:s, code });
const SYSTEM = 'Eres SynthonIA, la ayudante de SynthZ y SynthFlow. Eres amable, breve y clara. Responde en el idioma de la pregunta (normalmente español de Colombia), en menos de 110 palabras, sin inventar funciones. '
  + 'Datos de SynthZ: SynthFlow es el chat. Se conecta con Puter (gratis, un clic, sin llave), OpenRouter (llave gratis propia, modelos «free») o Groq (llave propia opcional, muy rápida). '
  + 'Arriba o junto a la caja de escribir se elige la IA y se puede comparar hasta 4 IA (cada una gasta por su cuenta: comparar, no unir). '
  + 'SynXCoin\'s son la medida de consumo (1 = 1 token); SynthZ nunca cobra. La Guía (botón «Guía») enseña todo paso a paso, con 5 mensajes de prueba. '
  + 'Los chats se guardan en el dispositivo, en la cuenta de SynthZ y opcionalmente en Google Drive (⋯ › Google Drive). Ajustes tiene el modo Rendimiento. '
  + 'Si no sabes algo o es un problema de cuenta, sugiere «Hablar con el equipo». Nunca pidas contraseñas ni llaves.';

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
        const r = await trialComplete([{ role:'system', content:SYSTEM }, ...hist, { role:'user', content:q }], 320);
        return json({ text:r.text, left:Math.max(0, ASK_DAY - n) });
      }catch(e){ await redis('DECR', k); throw e; }        /* si no respondió, esa pregunta no te cuenta */
    }

    const me = await auth(req);
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
