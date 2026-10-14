/* IA que no funcionan, compartidas entre todos (sin datos personales):
   GET                         → { bad:[{ id, t }] }  modelos escondidos (máx. 12 h)
   POST { id, ok:false }       → «este modelo falló por culpa del modelo» (se cuenta una vez por conexión)
   POST { id, ok:true }        → «este modelo volvió a responder»: se quita de la lista
   Se esconde para todos cuando lo reportan 2 conexiones distintas (o 1 del equipo de SynthZ). */
import { route, body, json, fail, redis, pipe, limit, auth, roleOf, sha } from './_lib.js';

const TTL = 12 * 3600, ID_RX = /^(or|pu|gq):[\w.:/@+-]{2,160}$/;
const ipOf = req => (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();

export default route({
  async GET(){
    const all = await redis('HGETALL', 'mh:bad') || [];
    const now = Date.now(), bad = [], old = [];
    for (let i = 0; i < all.length; i += 2){ const t = +all[i + 1] || 0; if (now - t < TTL * 1000) bad.push({ id:all[i], t }); else old.push(all[i]); }
    if (old.length) await redis('HDEL', 'mh:bad', ...old).catch(() => {});
    return json({ bad:bad.slice(0, 400) });
  },
  async POST(req){
    const b = await body(req, 2000), id = typeof b.id === 'string' ? b.id.trim() : '';
    if (!ID_RX.test(id)) return fail(400, 'Modelo no válido.');
    const ip = ipOf(req);
    await limit('mh:ip:' + ip, 40, 3600);
    if (b.ok === true){ await redis('HDEL', 'mh:bad', id); await redis('DEL', 'mh:r:' + id); return json({ ok:true }); }
    const me = await auth(req, true).catch(() => null), team = roleOf(me) !== 'user';
    const who = sha('ip:' + ip).slice(0, 16), k = 'mh:r:' + id;
    const [, , n] = await pipe([['SADD', k, who], ['EXPIRE', k, String(TTL)], ['SCARD', k]]);
    if (team || +n >= 2) await redis('HSET', 'mh:bad', id, String(Date.now()));
    return json({ ok:true, hidden:team || +n >= 2 });
  }
});
