/* v3.5 · lo que cada persona tiene prendido y cuánto puede usar (Pulsem › Usuarios). Pedido de Sammuel, 29 oct.
   ux:<sub> → { day, img, search, aliasX, f:{ alias, image, search, review, aurora, oro }, note, by, t }   lo propio de esa cuenta
   cfg:ux   → { f:{ …las mismas funciones } }                                                         el interruptor «para todos»
   Lo que no está en ux:<sub> usa el de todos, y lo que no está en cfg:ux usa el de siempre (FEATS).
   El equipo (Prime, ZFlow y Symmetrix) tiene todo prendido salvo que alguien se lo apague a mano.
   El servidor decide siempre: la página solo muestra lo que le llega en /api/ai › perks. */
import { redis, getJ, setJ, str, roleOf } from './_lib.js';

/* funciones que se pueden prender o apagar, y cómo vienen si nadie las toca */
export const FEATS = { alias:true, image:true, search:true, review:true, aurora:false, oro:false };
/* límites propios: null = el de todos. day -1 = sin límite de EnerX */
const LIM = { day:[1000, 5_000_000], img:[0, 500], search:[0, 2000], aliasX:[1, 100] };

const parse = v => { try{ const o = v ? JSON.parse(v) : null; return o && typeof o === 'object' ? o : {}; }catch(e){ return {}; } };
const bools = f => { const o = {}; if (f && typeof f === 'object') for (const k of Object.keys(FEATS)) if (typeof f[k] === 'boolean') o[k] = f[k]; return o; };
function num(v, k){
  if (v === null || v === '' || v === undefined) return null;
  if (k === 'day' && +v === -1) return -1;
  const n = Math.round(+v); if (!Number.isFinite(n)) return null;
  return Math.max(LIM[k][0], Math.min(LIM[k][1], n));
}
/* lo que se guarda: solo lo que alguien cambió */
export function cleanUx(b){
  const o = { f:bools(b && b.f) };
  for (const k of Object.keys(LIM)){ const n = num(b && b[k], k); if (n !== null) o[k] = n; }
  const note = str(b && b.note, 200); if (note) o.note = note;
  return o;
}
export const isEmpty = o => !Object.keys(o.f || {}).length && !Object.keys(LIM).some(k => o[k] != null) && !o.note;

/* lo que vale para esta persona ahora (una sola consulta a Redis) */
export async function perksOf(me){
  if (!me || !me.sub) return null;
  const [a, g] = (await redis('MGET', 'ux:' + me.sub, 'cfg:ux')) || [];
  return resolve(parse(a), parse(g), roleOf(me) !== 'user');
}
export function resolve(own, all, team){
  const mine = bools(own.f), every = bools(all.f), f = {};
  for (const k of Object.keys(FEATS)) f[k] = k in mine ? mine[k] : team ? true : k in every ? every[k] : FEATS[k];
  const out = { team, f };
  for (const k of Object.keys(LIM)) out[k] = num(own[k], k);
  return out;
}
/* lo que ve la página (sin notas ni quién lo cambió) */
export const publicPerks = p => p ? { f:p.f, unl:p.day === -1, own:{ day:p.day, img:p.img, search:p.search, aliasX:p.aliasX } } : null;
/* EnerX: { free, dayLimit } para chat() en _pool.js */
export const enerOf = p => ({ free:!!(p && (p.team || p.day === -1)), dayLimit:p && p.day > 0 ? p.day : 0 });
export const offErr = (msg, code) => Object.assign(new Error(msg), { status:403, code });

export const uxGet = async sub => parse(await redis('GET', 'ux:' + sub));
export async function uxSave(sub, o, by){
  if (isEmpty(o)){ await redis('DEL', 'ux:' + sub); return {}; }
  const v = Object.assign({}, o, { by, t:Date.now() }); await setJ('ux:' + sub, v); return v;
}
export const allGet = async () => (await getJ('cfg:ux')) || {};
export async function allSave(f, by){ const v = { f:bools(f), by, t:Date.now() }; await setJ('cfg:ux', v); return v; }
