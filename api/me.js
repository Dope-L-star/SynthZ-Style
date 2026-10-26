/* GET    /api/me                     → tu usuario, perfil, preferencias y la lista de chats guardados
   PUT    /api/me  { profile?, prefs?, key? } → guarda perfil / preferencias / tu llave (cifrada)
   DELETE /api/me                     → borra tu cuenta y todo lo guardado */
import { route, body, json, fail, auth, getJ, setJ, redis, pipe, enc, dec, needsReenc, str, limit, getLedger, putLedger, saveChats, cloudUsed, QUOTA, checkPass, roleOf, SEED_ROLES, sbProfile, sbPrefs, sbAch, sbDelete, sbAccount } from './_lib.js';

const COLORS = ['aurora', 'azul', 'violeta', 'coral', 'menta', 'oro', 'rosa', 'noche'];
function cleanProfile(p, prev){
  const a = p.avatar || {};
  const avatar = a.type === 'google' ? { type:'google' } : a.type === 'emoji' ? { type:'emoji', emoji:str(a.emoji, 8) || '✨' } : { type:'initial' };
  return { name:str(p.name, 40) || (prev && prev.name) || '', bio:str(p.bio, 160), pronouns:str(p.pronouns, 20), avatar, color:COLORS.includes(p.color) ? p.color : 'aurora', banner:COLORS.includes(p.banner) ? p.banner : (p.color && COLORS.includes(p.color) ? p.color : 'aurora'), status:str(p.status, 60), t:Date.now() };
}
export default route({
  async GET(req){
    const u = await auth(req);
    const [profile, prefs, keys, keyEnc, ledger, achF] = await Promise.all([getJ('p:' + u.sub), getJ('pr:' + u.sub), redis('HKEYS', 'c:' + u.sub), redis('GET', 'k:' + u.sub), getLedger(u.sub), redis('HGETALL', 'ach:' + u.sub)]);
    const ach = {}; for (let i = 0; achF && i + 1 < achF.length; i += 2) ach[achF[i]] = +achF[i + 1] || 0;
    let key = ''; try{ if (keyEnc){ key = dec(keyEnc); if (needsReenc(keyEnc)) await redis('SET', 'k:' + u.sub, enc(key)); } }catch(e){}   /* rotación perezosa */
    const used = await cloudUsed(u.sub);
    return json({ user:Object.assign({}, u, { role:roleOf(u), claimable:!!SEED_ROLES[u.username || ''] && !u.role }), profile, prefs, chatKeys:keys || [], key, ledger, ach, space:{ used, max:QUOTA } });
  },
  async PUT(req){
    const u = await auth(req);
    await limit('me:' + u.sub, 60, 60);
    const b = await body(req, 3_000_000), out = {};
    if (b.profile && typeof b.profile === 'object'){ out.profile = cleanProfile(b.profile, await getJ('p:' + u.sub)); await setJ('p:' + u.sub, out.profile); await sbProfile(u.sub, out.profile); }
    if (b.prefs && typeof b.prefs === 'object'){
      const s = JSON.stringify(b.prefs); if (s.length > 250_000) return fail(413, 'Tus preferencias son demasiado grandes.');
      await redis('SET', 'pr:' + u.sub, s); out.prefs = true;
      await sbPrefs(u.sub, b.prefs);
    }
    if (b.ledger && typeof b.ledger === 'object'){ const r = await putLedger(u.sub, b.ledger); if (b.wantLedger || r.stale) out.ledger = await getLedger(u.sub); }   /* las filas de los demás, solo cuando se piden */
    if (b.chats && typeof b.chats === 'object') out.chats = await saveChats(u.sub, b.chats);
    /* logros de los eventos especiales (50, 100, 500 visitas): quedan en tu cuenta (los de 100 y 500 cuentan para descuentos futuros) */
    if (b.ach && typeof b.ach === 'object'){ const codes = Object.keys(b.ach).filter(c => ['50', '100', '500'].includes(c)).slice(0, 3); for (const c of codes){ const was = await redis('HSETNX', 'ach:' + u.sub, c, String(Date.now())); if (was) await sbAch(u.sub, c); } out.ach = codes.length; }              /* chats en la misma petición: menos viajes */
    if ('key' in b){
      const k = str(b.key, 200);
      if (k){ if (!/^sk-or-[\w-]{10,}$/.test(k)) return fail(400, 'Esa no parece una llave de OpenRouter.'); await redis('SET', 'k:' + u.sub, enc(k)); }
      else await redis('DEL', 'k:' + u.sub);
      out.key = !!k;
    }
    return json(Object.assign({ ok:true }, out));
  },
  async DELETE(req){
    const u = await auth(req);
    await limit('del:' + u.sub, 8, 3600);
    const b = await body(req, 4000);
    /* confirmar: con contraseña (cuentas de usuario) o escribiendo tu usuario/correo (cuentas de Google) */
    const pw = await getJ('pw:' + u.sub);
    if (pw){ if (!(await checkPass(String(b.pass || ''), pw.h))) return fail(401, 'Tu contraseña no es correcta.'); }
    else if (String(b.confirm || '').trim().toLowerCase() !== String(u.email || u.username || '').toLowerCase()) return fail(400, 'Escribe tu correo para confirmar.');
    const [sess, teams] = await Promise.all([redis('SMEMBERS', 'ss:' + u.sub), redis('SMEMBERS', 'ut:' + u.sub)]);
    for (const id of teams || []){
      const t = await getJ('t:' + id); if (!t) continue;
      if (t.owner === u.sub){
        await pipe([].concat((t.members || []).map(m => ['SREM', 'ut:' + m.sub, id]), (t.invites || []).map(i => ['SREM', 'inv:' + (i.to || i.email), id]), [['DEL', 't:' + id]]));
      } else { t.members = (t.members || []).filter(m => m.sub !== u.sub); await setJ('t:' + id, t); }
    }
    await sbDelete(u.sub);
    await pipe([].concat((sess || []).map(h => ['DEL', 's:' + h]), [['DEL', 'ach:' + u.sub]], [['DEL', 'ss:' + u.sub], ['DEL', 'u:' + u.sub], ['DEL', 'p:' + u.sub], ['DEL', 'pr:' + u.sub], ['DEL', 'c:' + u.sub], ['DEL', 'k:' + u.sub], ['DEL', 'ut:' + u.sub], ['DEL', 'lg:' + u.sub], ['DEL', 'cz:' + u.sub]], [['DEL', 'pw:' + u.sub]], u.email ? [['DEL', 'e:' + u.email]] : [], (Array.isArray(u.links) ? u.links : []).filter(x => x && x.email).map(x => ['DEL', 'e:' + x.email]), u.username ? [['DEL', 'n:' + u.username]] : []));
    return json({ ok:true });
  }
});
