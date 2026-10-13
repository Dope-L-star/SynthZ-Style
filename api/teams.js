/* GET  /api/teams                       → tus equipos y tus invitaciones
   POST /api/teams { action, ... }        → crear, invitar, aceptar, rechazar, quitar, salir, borrar, llave y ajustes
   La llave de OpenRouter del equipo se guarda cifrada aquí y NUNCA vuelve al navegador de nadie. */
import { route, body, json, fail, auth, getJ, setJ, redis, pipe, rid, enc, cleanEmail, okEmail, cleanUser, okUser, str, today, publicOf, limit } from './_lib.js';

/* a quién va una invitación: «@usuario» o un correo (cuentas de Google) */
const toOf = i => i.to || i.email;
const myIds = me => [me.username && '@' + me.username, me.email].filter(Boolean);
const forMe = (i, me) => myIds(me).includes(toOf(i));

const MAX_TEAMS = 5, MAX_PEOPLE = 20;
const err = (s, m) => Object.assign(new Error(m), { status:s });
async function load(id){ const t = typeof id === 'string' && id.length < 40 ? await getJ('t:' + id) : null; if (!t) throw err(404, 'Ese equipo ya no existe.'); return t; }
const isMember = (t, sub) => t.owner === sub || (t.members || []).some(m => m.sub === sub);

async function view(t, me){
  const owner = t.owner === me.sub, d = today();
  const subs = [t.owner, ...(t.members || []).map(m => m.sub)];
  const [people, used] = await Promise.all([Promise.all(subs.map(publicOf)), pipe(subs.map(s => ['GET', 'tu:' + t.id + ':' + s + ':' + d]))]);
  return {
    id:t.id, name:t.name, owner, ownerInfo:people[0], created:t.created,
    hasKey:!!t.keyEnc, keyLabel: owner ? t.keyLabel || '' : '', freeOnly:t.freeOnly !== false, daily:+t.daily || 0,
    members:(t.members || []).map((m, i) => Object.assign({}, people[i + 1], { joined:m.joined, used:+used[i + 1] || 0 })),
    invites: owner ? (t.invites || []).map(i => ({ to:toOf(i), email:toOf(i), at:i.at })) : [],
    myUse:+used[subs.indexOf(me.sub)] || 0
  };
}
async function checkKey(k){
  const r = await fetch((process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1') + '/key', { headers:{ Authorization:'Bearer ' + k } }).catch(() => null);
  if (!r) throw err(502, 'No pude comprobar la llave con OpenRouter. Intenta de nuevo.');
  if (r.status === 401 || r.status === 403) throw err(400, 'OpenRouter dice que esa llave no es válida.');
}

export default route({
  async GET(req){
    const me = await auth(req);
    const [ids, ...invL] = await Promise.all([redis('SMEMBERS', 'ut:' + me.sub), ...myIds(me).map(x => redis('SMEMBERS', 'inv:' + x))]);
    const invIds = [...new Set([].concat(...invL.map(l => l || [])))];
    const teams = [];
    for (const id of ids || []){ const t = await getJ('t:' + id); if (t && isMember(t, me.sub)) teams.push(await view(t, me)); }
    const invites = [];
    for (const id of invIds || []){ const t = await getJ('t:' + id); if (t && (t.invites || []).some(i => forMe(i, me))) invites.push({ id:t.id, name:t.name, from:await publicOf(t.owner), hasKey:!!t.keyEnc }); }
    return json({ teams, invites });
  },
  async POST(req){
    const me = await auth(req);
    await limit('teams:' + me.sub, 40, 60);
    const b = await body(req, 20_000), a = b.action;
    if (a === 'create'){
      const name = str(b.name, 40); if (!name) throw err(400, 'Ponle un nombre a tu equipo.');
      const mine = await redis('SMEMBERS', 'ut:' + me.sub); let owned = 0;
      for (const id of mine || []){ const t = await getJ('t:' + id); if (t && t.owner === me.sub) owned++; }
      if (owned >= MAX_TEAMS) throw err(400, 'Puedes tener hasta ' + MAX_TEAMS + ' equipos propios.');
      const t = { id:rid(9), name, owner:me.sub, members:[], invites:[], keyEnc:'', keyLabel:'', freeOnly:true, daily:20000, created:Date.now() };
      await setJ('t:' + t.id, t); await redis('SADD', 'ut:' + me.sub, t.id);
      return json({ team:await view(t, me) });
    }
    const t = await load(b.id), owner = t.owner === me.sub;
    if (a === 'accept' || a === 'decline'){
      const mine = (t.invites || []).filter(i => forMe(i, me));
      if (!mine.length) throw err(404, 'Esa invitación ya no está.');
      t.invites = t.invites.filter(i => !forMe(i, me));
      if (a === 'accept' && !isMember(t, me.sub)) t.members.push({ sub:me.sub, joined:Date.now() });
      await setJ('t:' + t.id, t);
      await pipe(mine.map(i => ['SREM', 'inv:' + toOf(i), t.id]).concat(a === 'accept' ? [['SADD', 'ut:' + me.sub, t.id]] : []));
      return json({ ok:true });
    }
    if (a === 'leave'){
      if (owner) throw err(400, 'Eres el dueño: borra el equipo en lugar de salir.');
      t.members = (t.members || []).filter(m => m.sub !== me.sub); await setJ('t:' + t.id, t); await redis('SREM', 'ut:' + me.sub, t.id);
      return json({ ok:true });
    }
    if (!owner) throw err(403, 'Solo el dueño del equipo puede hacer eso.');
    if (a === 'invite'){
      const raw = String(b.to || b.email || '').trim();
      let to, sub = null;
      if (raw.includes('@') && !raw.startsWith('@')){
        to = cleanEmail(raw); if (!okEmail(to)) throw err(400, 'Escribe un @usuario o un correo válido.');
        sub = await redis('GET', 'e:' + to);
      } else {
        const u = cleanUser(raw); if (!okUser(u)) throw err(400, 'Escribe el @usuario de tu amigo.');
        sub = await redis('GET', 'n:' + u);
        if (!sub) throw err(404, 'No hay ninguna cuenta con el usuario @' + u + '. Revisa cómo se escribe.');
        to = '@' + u;
      }
      if (myIds(me).includes(to) || sub === me.sub) throw err(400, 'Esa es tu propia cuenta.');
      if ((t.invites || []).some(i => toOf(i) === to)) throw err(400, 'Ya invitaste a ' + to + '.');
      if (sub && isMember(t, sub)) throw err(400, to + ' ya está en tu equipo.');
      if ((t.members || []).length + (t.invites || []).length >= MAX_PEOPLE) throw err(400, 'Un equipo puede tener hasta ' + MAX_PEOPLE + ' personas.');
      t.invites.push({ to, at:Date.now() }); await setJ('t:' + t.id, t); await redis('SADD', 'inv:' + to, t.id);
      return json({ ok:true, known:!!sub, to });
    }
    if (a === 'uninvite'){
      const to = String(b.to || b.email || '').trim().toLowerCase(); t.invites = (t.invites || []).filter(i => toOf(i) !== to);
      await setJ('t:' + t.id, t); await redis('SREM', 'inv:' + to, t.id); return json({ ok:true });
    }
    if (a === 'remove'){
      t.members = (t.members || []).filter(m => m.sub !== b.sub); await setJ('t:' + t.id, t); await redis('SREM', 'ut:' + b.sub, t.id);
      return json({ ok:true });
    }
    if (a === 'delete'){
      await pipe([].concat((t.members || []).map(m => ['SREM', 'ut:' + m.sub, t.id]), (t.invites || []).map(i => ['SREM', 'inv:' + toOf(i), t.id]), [['SREM', 'ut:' + me.sub, t.id], ['DEL', 't:' + t.id]]));
      return json({ ok:true });
    }
    if (a === 'key'){
      const k = str(b.key, 200);
      if (k){ if (!/^sk-or-[\w-]{10,}$/.test(k)) throw err(400, 'Esa no parece una llave de OpenRouter (empieza por sk-or-).'); await checkKey(k); t.keyEnc = enc(k); t.keyLabel = 'sk-or-…' + k.slice(-4); }
      else { t.keyEnc = ''; t.keyLabel = ''; }
      await setJ('t:' + t.id, t); return json({ ok:true, hasKey:!!k });
    }
    if (a === 'settings'){
      if ('freeOnly' in b) t.freeOnly = !!b.freeOnly;
      if ('daily' in b){ const d = Math.round(+b.daily || 0); t.daily = d <= 0 ? 0 : Math.min(5_000_000, Math.max(1000, d)); }
      if ('name' in b){ const n = str(b.name, 40); if (n) t.name = n; }
      await setJ('t:' + t.id, t); return json({ ok:true });
    }
    return fail(400, 'Acción desconocida.');
  }
});
