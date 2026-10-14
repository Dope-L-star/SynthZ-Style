/* GET  /api/chats?k=a&k=b          → esos chats
   POST /api/chats { items:[{k,data}], del:[k] } → guarda los que cambiaron y BORRA de verdad los borrados */
import { route, body, json, fail, auth, redis, pipe, limit, saveChats, okChatKey } from './_lib.js';

const okKey = okChatKey;
export default route({
  async GET(req){
    const u = await auth(req);
    const ks = new URL(req.url).searchParams.getAll('k').filter(okKey).slice(0, 25);
    if (!ks.length) return json({ chats:{} });
    const vals = await redis('HMGET', 'c:' + u.sub, ...ks), chats = {};
    ks.forEach((k, i) => { try{ if (vals[i]) chats[k] = JSON.parse(vals[i]); }catch(e){} });
    return json({ chats });
  },
  async POST(req){
    const u = await auth(req);
    await limit('chats:' + u.sub, 90, 60);
    const b = await body(req, 3_000_000);
    return json(Object.assign({ ok:true }, await saveChats(u.sub, b)));
  }
});
