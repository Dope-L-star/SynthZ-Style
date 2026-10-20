/* ---------- estado guardado (con limpieza por si el archivo viene dañado) ---------- */
const KEY = 'synthz:v1', OLD = 'coro:v1';
let memState = null;
function load(){
  try{ const s = localStorage.getItem(KEY) || localStorage.getItem(OLD); return s ? JSON.parse(s) : null; }
  catch(e){ return memState; }
}
const num = v => (Number.isFinite(+v) && +v > 0) ? Math.round(+v) : 0;
function cleanUsage(u){
  const out = {};
  if (!u || typeof u !== 'object') return out;
  ALL.forEach(p => {
    const s = u[p.id]; if (!s || typeof s !== 'object') return;
    const days = {};
    if (s.days && typeof s.days === 'object') Object.keys(s.days).forEach(k => { if (/^\d{4}-\d{2}-\d{2}$/.test(k)) days[k] = num(s.days[k]); });
    out[p.id] = { prompt:num(s.prompt), completion:num(s.completion), requests:num(s.requests), days };
  });
  return out;
}
/* ---------- SynXCoin's: un registro por dispositivo ----------
   Cada navegador suma solo en su propia fila (DEV). El total es la SUMA de todas las filas, y al juntar dos copias
   de la misma fila se toma el mayor valor (cada fila solo crece). Así dos dispositivos o dos pestañas nunca se pisan,
   sincronizar varias veces no duplica, y «Reiniciar» (una nueva época) se respeta en todos los dispositivos. */
const LKEY = 'synthz:ledger', DEV_KEY = 'synthz:dev';
let DEV = 'dmem';
try{ DEV = localStorage.getItem(DEV_KEY) || ''; if (!/^[\w-]{4,40}$/.test(DEV)){ DEV = 'd' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); localStorage.setItem(DEV_KEY, DEV); } }catch(e){ DEV = 'dmem'; }
const DAYRE = /^\d{4}-\d{2}-\d{2}$/, FIELDS = ['p', 'c', 'r', 'e'], DAYMAPS = ['days', 'de', 'rd', 'fd'];
function cleanRow(s){
  const o = {}; FIELDS.forEach(f => { o[f] = num(s && s[f]); });
  DAYMAPS.forEach(m => { o[m] = {}; const src = s && s[m]; if (src && typeof src === 'object') Object.keys(src).forEach(d => { if (DAYRE.test(d)){ const v = num(src[d]); if (v) o[m][d] = v; } }); });
  return o;
}
function cleanLedger(L){
  const out = { ep:num(L && L.ep), dev:{} };
  const dev = L && L.dev && typeof L.dev === 'object' ? L.dev : {};
  Object.keys(dev).slice(0, 200).forEach(id => {
    if (!/^[\w-]{1,40}$/.test(id) || !dev[id] || typeof dev[id] !== 'object') return;
    const r = {}; ALL.forEach(p => { if (dev[id][p.id] && typeof dev[id][p.id] === 'object') r[p.id] = cleanRow(dev[id][p.id]); });
    if (Object.keys(r).length) out.dev[id] = r;
  });
  return out;
}
function mergeRows(a, b){
  const o = cleanRow(a); FIELDS.forEach(f => { o[f] = Math.max(o[f], num(b[f])); });
  DAYMAPS.forEach(m => { Object.keys(b[m] || {}).forEach(d => { o[m][d] = Math.max(o[m][d] || 0, num(b[m][d])); }); });
  return o;
}
function mergeLedger(a, b){
  a = a || { ep:0, dev:{} }; b = b || { ep:0, dev:{} };
  if ((b.ep || 0) > (a.ep || 0)) return cleanLedger(b);          /* el otro lado reinició después: su época manda */
  if ((b.ep || 0) < (a.ep || 0)) return a;
  const out = { ep:a.ep || 0, dev:Object.assign({}, a.dev) };
  Object.keys(b.dev || {}).forEach(id => {
    const mine = out.dev[id] || {}, r = Object.assign({}, mine);
    Object.keys(b.dev[id]).forEach(pid => { r[pid] = mine[pid] ? mergeRows(mine[pid], b.dev[id][pid]) : cleanRow(b.dev[id][pid]); });
    out.dev[id] = r;
  });
  return out;
}
/* el total por proveedor que muestra la página sale de sumar las filas */
function usageOf(L){
  const out = {};
  Object.keys(L.dev).forEach(id => Object.keys(L.dev[id]).forEach(pid => {
    const s = L.dev[id][pid], u = out[pid] || (out[pid] = { prompt:0, completion:0, requests:0, est:0, days:{}, estDays:{}, reqDays:{}, freeDays:{} });
    u.prompt += s.p; u.completion += s.c; u.requests += s.r; u.est += s.e;
    [['days', 'days'], ['de', 'estDays'], ['rd', 'reqDays'], ['fd', 'freeDays']].forEach(([a, b]) => Object.keys(s[a]).forEach(d => { u[b][d] = (u[b][d] || 0) + s[a][d]; }));
  }));
  return out;
}
/* datos de versiones anteriores: un solo total sin dispositivos → fila «legacy» (Puter siempre fue estimado) */
function legacyRow(usage){
  const u = cleanUsage(usage), r = {};
  Object.keys(u).forEach(pid => { const s = u[pid], t = s.prompt + s.completion; if (!t && !s.requests) return; r[pid] = cleanRow({ p:s.prompt, c:s.completion, r:s.requests, e:pid === 'puter' ? t : 0, days:s.days, de:pid === 'puter' ? s.days : {} }); });
  return r;
}
function readLedger(){ try{ const s = localStorage.getItem(LKEY); return s ? cleanLedger(JSON.parse(s)) : null; }catch(e){ return null; } }
function writeLedger(){ try{ localStorage.setItem(LKEY, JSON.stringify(state.ledger)); }catch(e){} }
function cleanWork(w){
  if (!w || typeof w !== 'object') return undefined;
  return { ms:num(w.ms), words:num(w.words), real:typeof w.real === 'string' ? w.real.slice(0, 80) : '', reason:typeof w.reason === 'string' ? w.reason.slice(0, 4000) : undefined,
    steps:Array.isArray(w.steps) ? w.steps.slice(0, 12).filter(x => Array.isArray(x) && typeof x[1] === 'string').map(x => [num(x[0]), x[1].slice(0, 80)]) : [] };
}
function cleanChats(c){
  const out = {};
  if (!c || typeof c !== 'object') return out;
  Object.keys(c).forEach(k => {
    if (!Array.isArray(c[k]) || !(byId(k) || /^openrouter::./.test(k))) return;
    out[k] = c[k].filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map(m => ({ role:m.role, content:m.content, meta: typeof m.meta === 'string' ? m.meta : undefined, model: typeof m.model === 'string' ? m.model : undefined,
        imgId: typeof m.imgId === 'string' && /^i[\w]{4,40}$/.test(m.imgId) ? m.imgId : undefined, imgReq: m.imgReq ? true : undefined, ask: typeof m.ask === 'string' ? m.ask.slice(0, 4000) : undefined,
        agent: m.agent && typeof m.agent === 'object' ? { pick:String(m.agent.pick || '').slice(0, 160), name:String(m.agent.name || '').slice(0, 80), tl:String(m.agent.tl || '').slice(0, 60), ask:String(m.agent.ask || '').slice(0, 4000) } : undefined,
        cont: m.cont ? true : undefined, star: m.star ? true : undefined, again: m.again ? true : undefined, work: cleanWork(m.work), files: Array.isArray(m.files) ? m.files.slice(0, 8).map(f => ({ name:String((f && f.name) || ''), kind:String((f && f.kind) || ''), text: typeof (f && f.text) === 'string' ? f.text : undefined, thumb: typeof (f && f.thumb) === 'string' ? f.thumb : undefined })) : undefined }));
  });
  return out;
}
function cleanStrMap(o){
  const out = {};
  if (!o || typeof o !== 'object') return out;
  Object.keys(o).forEach(k => { if (typeof o[k] === 'string') out[k] = o[k]; });
  return out;
}
function cleanModels(o){
  const out = {};
  if (!o || typeof o !== 'object') return out;
  Object.keys(o).forEach(k => { if (Array.isArray(o[k]) && o[k].every(x => typeof x === 'string')) out[k] = o[k]; });
  return out;
}
let state = Object.assign({ keys:{}, model:{}, models:{}, usage:{}, chats:{}, fav:[], cmp:[] }, load() || {});
state.sx = Object.assign({ daily:0, saver:false, saved:0, hits:0, over:'', warned:'' }, state.sx && typeof state.sx === 'object' ? state.sx : {});
const strList = (a, max) => Array.isArray(a) ? [...new Set(a.filter(x => typeof x === 'string' && x))].slice(0, max) : [];
function normalize(){
  state.keys = cleanStrMap(state.keys); state.model = cleanStrMap(state.model); state.models = cleanModels(state.models);
  state.chats = cleanChats(state.chats);
  const stored = readLedger(), given = state.ledger && typeof state.ledger === 'object' ? cleanLedger(state.ledger) : null;
  let L = stored && given ? mergeLedger(stored, given) : (stored || given);
  if (!L){ L = { ep:0, dev:{} }; const leg = legacyRow(state.usage); if (Object.keys(leg).length) L.dev.legacy = leg; }
  state.ledger = L; state.usage = usageOf(L); writeLedger();
  state.fav = strList(state.fav, 300); state.cmp = strList(state.cmp, 4);
}
normalize();
function syncLedger(){ const s = readLedger(); if (s){ state.ledger = mergeLedger(state.ledger, s); state.usage = usageOf(state.ledger); } }
function save(){
  syncLedger(); writeLedger();
  const blob = Object.assign({}, state, { ledger:undefined, usage:undefined }, IDB.ready ? { chats:{} } : {});
  try{ localStorage.setItem(KEY, JSON.stringify(blob)); }catch(e){ memState = state; }
  if (IDB.ready){ clearTimeout(idbT); idbT = setTimeout(idbFlush, 300); }
  accSchedule(); try{ driveSchedule(); }catch(e){}
}
const hooks = { usage: () => {}, chats: () => {} };
