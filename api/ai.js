/* IA de SynthZ para todos (beta 2)
   GET                       → { models, provs, limit, used } modelos gratis disponibles y lo que llevas hoy
   POST { messages, model?, maxTokens? } → respuesta en vivo (streaming), con el gasto al final
   Sin cuenta también funciona: se cuenta por dispositivo y por conexión. */
import { route, body, json, auth, sha } from './_lib.js';
import { models, chat, settings, usedToday, PROV } from './_pool.js';

const ipOf = req => (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
async function whoOf(req){
  const me = await auth(req, true).catch(() => null);
  const dev = String(req.headers.get('x-sz-device') || ''), ipKey = 'ip:' + sha('ip:' + ipOf(req)).slice(0, 16);
  if (me) return { who:'u:' + me.sub, ipKey, me };
  return { who:/^[\w-]{12,48}$/.test(dev) ? 'd:' + sha('dev:' + dev).slice(0, 16) : ipKey, ipKey, me:null };
}
export default route({
  async GET(req){
    const [{ who }, cat, set] = await Promise.all([whoOf(req), models(false), settings()]);
    return json({ provs:cat.provs.map(p => ({ id:p, name:PROV[p].name })), models:cat.list.map(m => ({ id:m.id, name:m.name, prov:m.prov, ctx:m.ctx })), limit:set.dayLimit, used:await usedToday(who) });
  },
  async POST(req){
    const b = await body(req, 600000), { who, ipKey } = await whoOf(req);
    const r = await chat({ who, ipKey, messages:b.messages, model:typeof b.model === 'string' ? b.model : 'sz:auto', maxTokens:b.maxTokens, stream:true });
    return new Response(r.stream, { status:200, headers:{ 'content-type':'text/event-stream; charset=utf-8', 'cache-control':'no-store',
      'x-sz-model':r.meta.model, 'x-sz-name':encodeURIComponent(r.meta.name), 'x-sz-prov':r.meta.provName, 'x-sz-fallback':r.meta.fallback ? '1' : '0', 'x-sz-used':String(r.used), 'x-sz-limit':String(r.limit),
      'access-control-expose-headers':'x-sz-model,x-sz-name,x-sz-prov,x-sz-fallback,x-sz-used,x-sz-limit' } });
  }
});
