/* v3.5 · Pulsem › Usuarios: buscar cuentas, ver su ficha y cambiarle a cada una lo suyo (va por /api/trial: Vercel gratis = 12 rutas)
   POST /api/trial { action:'users', q?, cursor? }   → (equipo) lista de cuentas, 200 por vuelta
   POST /api/trial { action:'user', sub }            → (equipo) ficha: datos, lo que usó hoy, lo propio y lo que vale
   POST /api/trial { action:'uset', sub, ux }        → (Prime/ZFlow) límites y funciones propias de esa cuenta
   POST /api/trial { action:'ublock', sub, on }      → (Prime/ZFlow) suspender o reactivar (nunca una cuenta del equipo)
   POST /api/trial { action:'uall', f }              → (Prime/ZFlow) el interruptor «para todos» de cada función
   Sin chats ni contraseñas: solo lo que hace falta para ayudar a esa persona. */
import { redis, pipe, getJ, setJ, today, str, roleOf, endAllSessions, cleanEmail, cleanUser } from './_lib.js';
import { settings } from './_pool.js';
import { FEATS, cleanUx, resolve, uxGet, uxSave, allGet, allSave } from './_ux.js';

const RANK = { owner:'Prime', admin:'ZFlow', staff:'Symmetrix', user:'Synther' };
const err = (s, m) => Object.assign(new Error(m), { status:s });
const boss = me => ['owner', 'admin'].includes(roleOf(me));
const parse = v => { try{ return v ? JSON.parse(v) : null; }catch(e){ return null; } };
const row = (u, p, ux) => ({ sub:u.sub, handle:u.username ? '@' + u.username : '', email:u.email || '', name:(p && p.name) || u.name || u.username || u.email || '', rank:RANK[roleOf(u)], created:u.created || 0, seen:u.seen || 0, blocked:!!u.blocked, own:!!ux });
const okSub = s => typeof s === 'string' && /^[\w:.@-]{1,120}$/.test(s);
async function account(sub){ if (!okSub(sub)) throw err(400, 'Cuenta no válida.'); const u = await getJ('u:' + sub); if (!u || u.mergedInto) throw err(404, 'Esa cuenta ya no existe.'); return u; }
/* Prime solo lo cambia Prime; ZFlow cambia a todos los demás */
const canTouch = (me, u) => boss(me) && (roleOf(u) !== 'owner' || roleOf(me) === 'owner');

async function list(b){
  const q = String(b.q || '').trim().toLowerCase().replace(/^@/, '').slice(0, 80);
  /* búsqueda exacta primero (1 consulta): @usuario o correo */
  if (q){
    const sub = await redis('GET', q.includes('@') ? 'e:' + cleanEmail(q) : 'n:' + cleanUser(q));
    if (sub){ const [u, p, ux] = await pipe([['GET', 'u:' + sub], ['GET', 'p:' + sub], ['GET', 'ux:' + sub]]); const U = parse(u); if (U && !U.mergedInto) return { users:[row(U, parse(p), ux)], cursor:'0', done:true }; }
  }
  const r = await redis('SCAN', String(+b.cursor || 0), 'MATCH', 'u:*', 'COUNT', '200'), ks = (r && r[1]) || [];
  if (!ks.length) return { users:[], cursor:r ? r[0] : '0', done:!r || r[0] === '0' };
  const subs = ks.map(k => k.slice(2));
  const [us, ps, uxs] = await pipe([['MGET', ...ks], ['MGET', ...subs.map(s => 'p:' + s)], ['MGET', ...subs.map(s => 'ux:' + s)]]);
  const users = ks.map((k, i) => { const u = parse(us[i]); return u && u.sub && !u.mergedInto ? row(u, parse(ps[i]), uxs[i]) : null; }).filter(Boolean)
    .filter(x => !q || [x.handle, x.email, x.name].some(v => String(v).toLowerCase().includes(q)));
  return { users, cursor:r[0], done:r[0] === '0' };
}

async function card(me, sub){
  const u = await account(sub), d = today();
  const [p, own, all, set] = await Promise.all([getJ('p:' + sub), uxGet(sub), allGet(), settings()]);
  const used = await pipe([['GET', 'q:u:' + sub + ':' + d], ['GET', 'img:' + sub + ':' + d], ['GET', 'srch:u:' + sub + ':' + d], ['GET', 'alias:s:' + sub + ':' + d], ['SCARD', 'ss:' + sub]]);
  const team = roleOf(u) !== 'user', now = resolve(own, all, team);
  return {
    user:row(u, p, Object.keys(own).length ? 1 : 0), kind:u.kind || (u.email ? 'google' : 'pass'), sessions:+used[4] || 0,
    used:{ day:+used[0] || 0, img:+used[1] || 0, search:+used[2] || 0, alias:+used[3] || 0 },
    own:{ day:own.day ?? null, img:own.img ?? null, search:own.search ?? null, aliasX:own.aliasX ?? null, f:own.f || {}, note:own.note || '', by:own.by || '', t:own.t || 0 },
    now:{ f:now.f, day:now.day === -1 || team ? -1 : now.day || set.dayLimit, img:now.img ?? (team ? 5000 : set.imgDay), search:now.search ?? (team ? 5000 : 30), aliasX:now.aliasX || (team ? 100 : 1) },
    base:{ day:set.dayLimit, img:set.imgDay, search:30, aliasX:1, f:resolve({}, all, false).f },
    canEdit:canTouch(me, u), canBlock:boss(me) && !team && u.sub !== me.sub, team
  };
}

export async function usersAction(me, b){
  const a = b.action;
  if (a === 'users'){ const r = await list(b); const all = await allGet(); return Object.assign(r, { canEdit:boss(me), feats:Object.keys(FEATS), all:resolve({}, all, false).f }); }
  if (a === 'user') return card(me, b.sub);
  if (!boss(me)) throw err(403, 'Solo Prime y ZFlow pueden cambiar esto.');
  const by = RANK[roleOf(me)] + ' @' + (me.username || me.email || '');
  if (a === 'uall'){ await allSave(b.f, by); const all = await allGet(); return { ok:true, all:resolve({}, all, false).f }; }
  const u = await account(b.sub);
  if (a === 'uset'){
    if (!canTouch(me, u)) throw err(403, 'Solo Prime puede cambiar la cuenta de Prime.');
    await uxSave(u.sub, cleanUx(b.ux || {}), by);
    return Object.assign({ ok:true }, await card(me, u.sub));
  }
  if (a === 'ublock'){
    if (u.sub === me.sub) throw err(400, 'No puedes suspender tu propia cuenta.');
    if (roleOf(u) !== 'user') throw err(403, 'Las cuentas del equipo no se suspenden desde aquí.');
    const on = !!b.on;
    if (on){ u.blocked = { by, t:Date.now(), why:str(b.why, 200) }; } else delete u.blocked;
    await setJ('u:' + u.sub, u);
    if (on) await endAllSessions(u.sub);                       /* sale de todos sus dispositivos al instante */
    return Object.assign({ ok:true }, await card(me, u.sub));
  }
  throw err(400, 'Acción desconocida.');
}
export const USERS_ACTIONS = new Set(['users', 'user', 'uset', 'ublock', 'uall']);
