/* IA de SynthZ para todos (beta 2)
   GET                       → { models, provs, limit, used } modelos gratis disponibles y lo que llevas hoy
   POST { messages, model?, maxTokens? } → respuesta en vivo (streaming), con el gasto al final
   Sin cuenta también funciona: se cuenta por dispositivo y por conexión. */
import { route, body, json, auth, sha, redis, pipe, today, ipOf } from './_lib.js';
import { models, chat, settings, usedToday, PROV } from './_pool.js';

/* sin cuenta: solo unos pocos mensajes al día (por dispositivo y, para que no se salte, también por conexión) */
const GUEST_MAX = Math.max(1, Math.min(50, +process.env.SYNTHZ_GUEST_MSGS || 5));
const gKey = w => 'gm:' + w + ':' + today();
/* un «mensaje» = lo que la persona escribe una vez. Si compara 3 IA o el agente piensa antes, sigue siendo 1 mensaje
   (cada mensaje deja hasta 4 llamadas; así nadie se salta el límite repitiendo el mismo número) */
const PER_TURN = 4;
async function guestUsed(who, ipKey){ const [a, b] = (await pipe([['SCARD', gKey(who)], ['SCARD', gKey(ipKey)]])).map(x => +x || 0); return { used:a, usedIp:b }; }
const guestErr = () => Object.assign(new Error('Para seguir FlowIAndo, entra o crea tu cuenta. Es gratis y tienes mucho más límite cada día.'), { status:429, code:'sz_guest' });
async function whoOf(req){
  const me = await auth(req, true).catch(() => null);
  const dev = String(req.headers.get('x-sz-device') || ''), ipKey = 'ip:' + sha('ip:' + ipOf(req)).slice(0, 16);
  if (me) return { who:'u:' + me.sub, ipKey, me };
  return { who:/^[\w-]{12,48}$/.test(dev) ? 'd:' + sha('dev:' + dev).slice(0, 16) : ipKey, ipKey, me:null };
}
export default route({
  async GET(req){
    const [{ who, ipKey, me }, cat, set] = await Promise.all([whoOf(req), models(false), settings()]);
    const g = me ? null : await guestUsed(who, ipKey);
    return json({ provs:cat.provs.map(p => ({ id:p, name:PROV[p].name })), models:cat.list.map(m => ({ id:m.id, name:m.name, prov:m.prov, ctx:m.ctx })), limit:set.dayLimit, used:await usedToday(who), guest:g ? { used:Math.max(g.used, Math.min(g.usedIp, GUEST_MAX)), max:GUEST_MAX } : null });
  },
  async POST(req){
    const b = await body(req, 600000), { who, ipKey, me } = await whoOf(req); let guest = null;
    if (!me){
      const turn = /^[\w-]{4,40}$/.test(String(b.turn || '')) ? String(b.turn) : 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const [inDev, inIp, g, n] = await Promise.all([redis('SISMEMBER', gKey(who), turn), redis('SISMEMBER', gKey(ipKey), turn), guestUsed(who, ipKey), redis('GET', 'gt:' + who + ':' + turn)]);
      const isNew = !(+inDev);
      if (isNew && (g.used >= GUEST_MAX || g.usedIp >= GUEST_MAX * 3)) throw guestErr();
      if (!isNew && (+n || 0) >= PER_TURN) throw guestErr();
      guest = { turn, isNew, ipNew:!(+inIp) };
    }
    const r = await chat({ who, ipKey, messages:b.messages, model:typeof b.model === 'string' ? b.model : 'sz:auto', maxTokens:b.maxTokens, stream:true });
    let gu = '';
    if (guest){
      const tk = 'gt:' + who + ':' + guest.turn;
      const pr = await pipe([['SADD', gKey(who), guest.turn], ['EXPIRE', gKey(who), '172800'], ['SADD', gKey(ipKey), guest.turn], ['EXPIRE', gKey(ipKey), '172800'], ['INCR', tk], ['EXPIRE', tk, '172800'], ['SCARD', gKey(who)]]);
      gu = (+pr[6] || 0) + '/' + GUEST_MAX;
    }
    return new Response(r.stream, { status:200, headers:{ 'content-type':'text/event-stream; charset=utf-8', 'cache-control':'no-store',
      'x-sz-model':r.meta.model, 'x-sz-name':encodeURIComponent(r.meta.name), 'x-sz-prov':r.meta.provName, 'x-sz-fallback':r.meta.fallback ? '1' : '0', 'x-sz-used':String(r.used), 'x-sz-limit':String(r.limit), 'x-sz-guest':gu,
      'access-control-expose-headers':'x-sz-model,x-sz-name,x-sz-prov,x-sz-fallback,x-sz-used,x-sz-limit,x-sz-guest' } });
  }
});
