/* ===== SynthZ · núcleo compartido (datos, llamadas a las IA, escritura suave, cursor) ===== */
(() => {
'use strict';
const root = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const NF = new Intl.NumberFormat('es-CO'), fmt = n => NF.format(Math.round(n || 0));
/* configuración de la página: visuales SynthZ-Style o rendimiento para PCs modestos */
const CFG_KEYS = ['cursor', 'smooth', 'favAnim', 'bg', 'glass', 'anim'];
const cfgPreset = perf => CFG_KEYS.reduce((o, k) => (o[k] = perf !== 'speed', o), {});
const CFG = (() => {
  let c = {}; try{ c = JSON.parse(localStorage.getItem('synthz:cfg')) || {}; }catch(e){}
  if (c.v !== 2) c = Object.assign(cfgPreset(c.perf), { perf:c.perf || 'visual' });   /* migración: los ajustes concuerdan con el modo */
  return Object.assign({ v:2, perf:'visual', intro:'always' }, cfgPreset(c.perf), c);
})();
const PERF = CFG.perf === 'speed';
const reduce = !CFG.anim;
function cfgClasses(){ const r = document.documentElement; r.classList.toggle('nocur', !CFG.cursor); r.classList.toggle('noglass', !CFG.glass); r.classList.toggle('nobg', !CFG.bg); r.classList.toggle('noanim', !CFG.anim); r.classList.remove('perf'); }
cfgClasses();
function saveCfg(){ try{ localStorage.setItem('synthz:cfg', JSON.stringify(CFG)); }catch(e){} }
const today = () => new Date().toLocaleDateString('en-CA');
const sleepRaw = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const est = s => Math.ceil(s.length / 4);

/* rayo-Z: recta, con el inicio (arriba izquierda) y el final (abajo derecha) en forma de rayo */
const Z_PATH = 'M13 4H44V12L18 36H49L39 40H45L35 44H4V36L30 12H-1L9 8H3Z';

/* ---------- logos de cada IA ---------- */
const ICONS = {
  puter: () => `<rect x="1" y="1" width="22" height="22" rx="6" fill="#1e2a4a"/><text x="12" y="16.5" text-anchor="middle" font-family="Geist,system-ui,sans-serif" font-size="13" font-weight="700" fill="#fff">P</text><image href="${PUTER_LOGO}" x="0" y="0" width="24" height="24" preserveAspectRatio="xMidYMid meet" onerror="this.remove()"/>`,
  groq: (c, d) => `<path d="M19.2 7.2A8.6 8.6 0 1 0 20.6 12.9H12.6" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12.6" cy="12.9" r="1.7" fill="${d}"/>`,
  gemini: (c, d) => `<path d="M12 1.5C12.4 7.8 16.2 11.6 22.5 12C16.2 12.4 12.4 16.2 12 22.5C11.6 16.2 7.8 12.4 1.5 12C7.8 11.6 11.6 7.8 12 1.5Z" fill="${c}"/><path d="M19.5 2.5C19.6 4 20.5 4.9 22 5C20.5 5.1 19.6 6 19.5 7.5C19.4 6 18.5 5.1 17 5C18.5 4.9 19.4 4 19.5 2.5Z" fill="${d}"/>`,
  mistral: (c, d) => [[0,0],[4,0],[0,1],[1,1],[3,1],[4,1],[0,2],[2,2],[4,2],[0,3],[4,3],[0,4],[4,4]]
    .map(([x, y]) => `<rect x="${2 + x * 4}" y="${2 + y * 4}" width="3.5" height="3.5" rx=".6" fill="${y < 2 ? c : d}"/>`).join(''),
  openrouter: (c, d) => `<path d="M2 15.5H6.8C10.6 15.5 10.8 8 15 8H19.5" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 15.5H6.8C10.6 15.5 10.8 20.5 15 20.5H19.5" fill="none" stroke="${d}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 4.8L22 8L18 11.2M18 17.3L22 20.5L18 23.7" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  claude: (c, d) => [10, 6.8, 9.2, 6.2, 10.4, 6.6, 9.4, 6.2, 10, 7, 9, 6.4].map((l, i) => {
    const a = (i * 30 - 90) * Math.PI / 180;
    return `<line x1="12" y1="12" x2="${(12 + Math.cos(a) * l).toFixed(2)}" y2="${(12 + Math.sin(a) * l).toFixed(2)}" stroke="${i % 2 ? d : c}" stroke-width="2.3" stroke-linecap="round"/>`;
  }).join(''),
  chatgpt: (c, d) => [0, 1, 2, 3, 4, 5].map(i => `<rect x="8.6" y="1.7" width="6.8" height="12.2" rx="3.4" fill="none" stroke="${i % 2 ? d : c}" stroke-width="1.7" transform="rotate(${i * 60} 12 12)"/>`).join('')
};
const PUTER_LOGO = 'https://developer.puter.com/favicons/ms-icon-144x144.png';
const puterLogo = cls => '<span class="pu-logo ' + (cls || '') + '"><img src="' + PUTER_LOGO + '" alt="Puter" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()"></span>';
const ico = p => `<i class="lg" aria-hidden="true"><svg viewBox="0 0 24 24">${ICONS[p.id](p.c, p.d)}</svg></i>`;
const zWord = (txt = 'Synth') => `${txt}<svg class="zb" viewBox="0 0 48 48" aria-hidden="true"><path d="${Z_PATH}" fill="url(#zgrad)"/></svg>`;

/* ---------- datos ---------- */
const API = [
  { id:'openrouter', name:'OpenRouter', c:'#b69cff', d:'#8fb0ff', kind:'openai', url:'https://openrouter.ai/api/v1', keyUrl:'https://openrouter.ai/keys',
    desc:'Conecta tu llave de OpenRouter y usa sus modelos gratuitos (etiqueta :free), incluido gpt-oss de OpenAI.', models:['openai/gpt-oss-20b:free','meta-llama/llama-3.3-70b-instruct:free'] }
];
const MANUAL = [];
const USAGE_EXTRA = [{ id:'puter', name:'Puter', c:'#6fd3d6', d:'#8fb0ff', est:true }];
const ALL = [...API, ...MANUAL, ...USAGE_EXTRA];
const byId = id => ALL.find(p => p.id === id);

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
function cleanChats(c){
  const out = {};
  if (!c || typeof c !== 'object') return out;
  Object.keys(c).forEach(k => {
    if (!Array.isArray(c[k]) || !(byId(k) || /^openrouter::./.test(k))) return;
    out[k] = c[k].filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map(m => ({ role:m.role, content:m.content, meta: typeof m.meta === 'string' ? m.meta : undefined, model: typeof m.model === 'string' ? m.model : undefined,
        cont: m.cont ? true : undefined, files: Array.isArray(m.files) ? m.files.slice(0, 8).map(f => ({ name:String((f && f.name) || ''), kind:String((f && f.kind) || ''), text: typeof (f && f.text) === 'string' ? f.text : undefined, thumb: typeof (f && f.thumb) === 'string' ? f.thumb : undefined })) : undefined }));
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
  accSchedule();
}
const hooks = { usage: () => {}, chats: () => {} };
/* ---------- cuentas propias de SynthZ (usuario y contraseña, o Google) · Puter solo conecta las IA ---------- */
var ACC = { ready:false, busy:false, user:null, profile:null, t:0, err:'', avail:null, cid:'', google:false, missing:[] };
const accHooks = [];
const hashS = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
var accSent = {}, accT = 0, accDelSent = new Set();
let SESS = ''; try{ SESS = localStorage.getItem('synthz:sess') || ''; }catch(e){}
function setSess(t){ SESS = t || ''; try{ if (SESS) localStorage.setItem('synthz:sess', SESS); else localStorage.removeItem('synthz:sess'); }catch(e){} }
const accFire = k => accHooks.forEach(f => { try{ f(k); }catch(_){} });
async function api(path, o = {}){
  const h = { 'content-type':'application/json' }; if (SESS) h.authorization = 'Bearer ' + SESS;
  let r; try{ r = await fetch('/api/' + path, { method:o.method || 'GET', headers:h, body:o.body ? JSON.stringify(o.body) : undefined, signal:o.signal }); }
  catch(e){ throw Object.assign(new Error('No pude conectar con el servidor de SynthZ.'), { net:true }); }
  let d = {}; try{ d = await r.json(); }catch(e){}
  if (r.status === 401 && SESS && !o.keep){ setSess(''); ACC.ready = false; ACC.user = null; ACC.profile = null; accFire('out'); }
  if (!r.ok) throw Object.assign(new Error(d.error || 'Error ' + r.status), { status:r.status, data:d });
  return d;
}
async function accConfig(){
  if (ACC.avail !== null) return ACC.avail;
  try{ const r = await fetch('/api/config'); const d = r.ok ? await r.json() : {}; ACC.cid = d.googleClientId || ''; ACC.google = !!(d.google && ACC.cid); ACC.missing = d.missing || (r.ok ? [] : ['servidor']); ACC.avail = !!d.ok; }
  catch(e){ ACC.avail = false; }
  return ACC.avail;
}
function slimChat(arr){
  let a = arr.slice(-150).map(m => ({ role:m.role, content:m.content, meta:m.meta, model:m.model, files: Array.isArray(m.files) ? m.files.map(f => ({ name:f.name, kind:f.kind })) : undefined }));
  while (a.length > 4 && JSON.stringify(a).length > 380000) a = a.slice(Math.ceil(a.length / 4));
  return a;
}
function prefsOut(){
  return { v:2, t:Date.now(), model:state.model, fav:state.fav, cmp:state.cmp, sx:state.sx, pinned:state.pinned || '', threads:state.threads || {}, del:(state.del || []).slice(-300),
    arena:state.arena || {}, survey:state.survey || null, useTeam:state.useTeam || '', battle:!!state.battle, cfg:CFG,
    chatKeys:Object.keys(state.chats).filter(k => Array.isArray(state.chats[k]) && state.chats[k].length) };
}
function mergeIn(p, chats){
  if (p && typeof p === 'object'){
    if (Array.isArray(p.fav)) state.fav = [...new Set([...(state.fav || []), ...p.fav.filter(x => typeof x === 'string')])];
    if (p.model && typeof p.model === 'object' && typeof p.model.openrouter === 'string') state.model = Object.assign({}, state.model, { openrouter:p.model.openrouter });
    if (typeof p.pinned === 'string' && p.pinned) state.pinned = p.pinned;
    if (typeof p.useTeam === 'string' && !state.useTeam) state.useTeam = p.useTeam;
    if (Array.isArray(p.del)) state.del = [...new Set([...(state.del || []), ...p.del.filter(x => typeof x === 'string')])].slice(-300);
    if (p.threads && typeof p.threads === 'object'){ state.threads = state.threads || {}; Object.keys(p.threads).forEach(m => { const L = state.threads[m] || (state.threads[m] = []); (Array.isArray(p.threads[m]) ? p.threads[m] : []).forEach(x => { if (!x || typeof x.id !== 'string') return; const e = L.find(y => y.id === x.id); if (!e) L.push({ id:x.id, title:String(x.title || '').slice(0, 80), t:+x.t || 0 }); else if ((+x.t || 0) > (e.t || 0)){ e.title = String(x.title || e.title).slice(0, 80); e.t = +x.t; } }); }); }
    if (Array.isArray(p.cmp) && p.cmp.length) state.cmp = p.cmp.filter(x => typeof x === 'string').slice(0, 4);
    if (p.sx && typeof p.sx === 'object'){ const l = state.sx || {}; state.sx = Object.assign({}, l, p.sx, { saved:Math.max(+l.saved || 0, +p.sx.saved || 0), hits:Math.max(+l.hits || 0, +p.sx.hits || 0) }); }
    if (p.arena && typeof p.arena === 'object'){ state.arena = state.arena || {}; Object.keys(p.arena).forEach(id => { const r = p.arena[id], l = state.arena[id]; if (r && typeof r === 'object' && (!l || (+r.t || 0) > (+l.t || 0))) state.arena[id] = { r:+r.r || 1000, w:+r.w || 0, l:+r.l || 0, t:+r.t || 0 }; }); }
    if (p.survey && typeof p.survey === 'object' && (!state.survey || (+p.survey.t || 0) > (+state.survey.t || 0))) state.survey = p.survey;
    if (p.battle) state.battle = true;
    if (p.ledger && typeof p.ledger === 'object'){ syncLedger(); state.ledger = mergeLedger(state.ledger, cleanLedger(p.ledger)); }
    else if (p.usage && typeof p.usage === 'object' && !state.ledger.ep){ const leg = legacyRow(p.usage); if (Object.keys(leg).length){ syncLedger(); state.ledger = mergeLedger(state.ledger, { ep:state.ledger.ep, dev:{ legacy:leg } }); } }
    state.usage = usageOf(state.ledger); writeLedger();
  }
  (state.del || []).forEach(k => { delete state.chats[k]; delete (chats || {})[k]; });
  Object.keys(chats || {}).forEach(k => { const r = chats[k], l = state.chats[k]; if (Array.isArray(r) && /^openrouter::./.test(k) && (!Array.isArray(l) || r.length > l.length)) state.chats[k] = r.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'); });
}
function takeLedger(L){ if (!L || typeof L !== 'object') return; syncLedger(); state.ledger = mergeLedger(state.ledger, cleanLedger(L)); state.usage = usageOf(state.ledger); writeLedger(); hooks.usage(); }
async function accPull(d){
  mergeIn(d.prefs || null, {});
  takeLedger(d.ledger); ACC.lgT = Date.now();
  const want = (d.chatKeys || []).filter(k => !(state.del || []).includes(k));
  for (let i = 0; i < want.length; i += 20){
    const q = want.slice(i, i + 20).map(k => 'k=' + encodeURIComponent(k)).join('&');
    try{ const r = await api('chats?' + q); mergeIn(null, r.chats || {}); }catch(e){}
  }
  if (d.key && !state.keys.openrouter){ state.keys.openrouter = d.key; state.syncKey = true; }
  (d.chatKeys || []).forEach(k => { const a = state.chats[k]; if (Array.isArray(a)){ const s = JSON.stringify(slimChat(a)); accSent[k] = s.length + ':' + hashS(s); } });
  save();
}
async function accPush(o){
  if (!ACC.ready || !SESS) return;
  o = o || {};
  try{
    syncLedger();
    const L = state.ledger, mine = {}; [DEV, 'legacy'].forEach(id => { if (L.dev[id]) mine[id] = L.dev[id]; });
    const items = [], marks = {};
    Object.keys(state.chats).forEach(k => { const a = state.chats[k]; if (!Array.isArray(a) || !a.length || !/^openrouter::./.test(k)) return; const s = JSON.stringify(slimChat(a)), h = s.length + ':' + hashS(s); if (accSent[k] !== h){ items.push({ k, data:slimChat(a) }); marks[k] = h; } });
    const del = (state.del || []).filter(k => !accDelSent.has(k));
    /* una sola petición lleva preferencias, SynXCoin's y los chats que cambiaron (menos viajes al servidor) */
    const first = items.slice(0, 20), want = o.ledger || Date.now() - (ACC.lgT || 0) > 60000;
    const res = await api('me', { method:'PUT', body:Object.assign({ prefs:prefsOut(), ledger:{ ep:L.ep, dev:mine }, wantLedger:want }, first.length || del.length ? { chats:{ items:first, del } } : {}, state.syncKey ? { key:state.keys.openrouter || '' } : {}) });
    if (res.ledger){ takeLedger(res.ledger); ACC.lgT = Date.now(); }
    first.forEach(x => { accSent[x.k] = marks[x.k]; }); del.forEach(k => { accDelSent.add(k); delete accSent[k]; });
    for (let i = 20; i < items.length; i += 20){
      const part = items.slice(i, i + 20);
      await api('chats', { method:'POST', body:{ items:part, del:[] } });
      part.forEach(x => { accSent[x.k] = marks[x.k]; });
    }
    ACC.t = Date.now(); ACC.err = '';
  }catch(e){ ACC.err = e.message || 'No pude sincronizar.'; if (e.status !== 401){ clearTimeout(accT); accT = setTimeout(accPush, 20000); } }
  accFire('push');
}
/* espera 6 s sin cambios antes de subir (agrupa mensaje y respuesta en una sola subida) y sube al salir de la pestaña */
function accSchedule(){ if (typeof ACC === 'undefined' || !ACC || !ACC.ready) return; clearTimeout(accT); accT = setTimeout(accPush, 6000); }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && ACC && ACC.ready && accT){ clearTimeout(accT); accT = 0; accPush(); } });
/* Los datos de este navegador son de UNA cuenta (state.owner) o de nadie (''): así nunca se mezclan dos cuentas.
   Al cerrar sesión se guardan en la nube y se borran de aquí; si entra otra cuenta y quedaron datos ajenos, se borran antes. */
function wipeAccountData(){
  state.chats = {}; state.threads = {}; state.fav = []; state.cmp = []; state.pinned = ''; state.del = []; state.arena = {}; state.survey = null;
  delete state.useTeam; delete state.intent; state.battle = false;
  state.sx = { daily:0, saver:false, saved:0, hits:0, over:'', warned:'' };
  if (state.syncKey){ delete state.keys.openrouter; state.syncKey = false; }   /* esa llave vive en la cuenta: no se queda en un navegador ajeno */
  state.ledger = { ep:0, dev:{} }; state.usage = {}; writeLedger();
  accSent = {}; accDelSent = new Set();
  if (IDB.ready){ try{ IDB.db.transaction('chats', 'readwrite').objectStore('chats').clear(); }catch(e){} Object.keys(idbHash).forEach(k => delete idbHash[k]); }
  state.owner = ''; save();
}
async function accStart(){
  if (ACC.ready || ACC.busy || !SESS) return;
  try{ await chatsReady; }catch(e){}
  ACC.busy = true; accFire('start');
  try{
    const d = await api('me'); ACC.user = d.user; ACC.profile = d.profile || null;
    if (state.owner && state.owner !== d.user.sub) wipeAccountData();   /* quedaron datos de otra cuenta: no se suben a esta */
    state.owner = d.user.sub;
    await accPull(d); ACC.ready = true; ACC.err = '';
    await accPush();
  }catch(e){ ACC.err = e.status === 401 ? '' : (e.message || 'No pude abrir tu cuenta.'); }
  ACC.busy = false; accFire('pull'); hooks.usage();
}
/* cierra sesión: primero guarda en la nube; si no pudo, avisa (force = cerrar igual) */
async function accSignOut(force){
  if (ACC.ready){ ACC.err = ''; try{ await accPush(); }catch(e){} if (ACC.err && !force) throw Object.assign(new Error(ACC.err), { unsynced:true }); }
  try{ await api('auth', { method:'DELETE', keep:true }); }catch(e){}
  try{ if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect(); }catch(e){}
  setSess(''); ACC.ready = false; ACC.user = null; ACC.profile = null;
  wipeAccountData();
  accFire('out');
}
/* si otra pestaña cerró sesión o cambió de cuenta, esta se recarga para no mostrar ni guardar datos ajenos */
addEventListener('storage', e => { if (e.key === 'synthz:sess' && (e.newValue || '') !== SESS) location.reload(); });
async function accDelete(){
  await api('me', { method:'DELETE' }); setSess(''); ACC.ready = false; ACC.user = null; ACC.profile = null; wipeAccountData(); accFire('out');
}
async function saveProfile(p){ const d = await api('me', { method:'PUT', body:{ profile:p } }); ACC.profile = d.profile; accFire('profile'); return d.profile; }
const accHandle = u => { u = u || ACC.user || {}; return u.username ? '@' + u.username : (u.email || ''); };
const accName = () => (ACC.profile && ACC.profile.name) || (ACC.user && ACC.user.name) || 'Tú';
const TINTS = { aurora:['#8fb0ff', '#b69cff', '#ff8f7a'], azul:['#5b8cff', '#8fb0ff', '#6fd3d6'], violeta:['#7c5cff', '#b69cff', '#ff9ed8'], coral:['#ff8f7a', '#ffb36b', '#ff9ed8'], menta:['#46d6a8', '#6fd3d6', '#8fb0ff'], oro:['#f2c46b', '#ffb36b', '#ff8f7a'], rosa:['#ff9ed8', '#ff8f7a', '#b69cff'], noche:['#3a3f63', '#5b5f8f', '#8fb0ff'] };
const tint = c => TINTS[c] || TINTS.aurora;
const grad = c => 'linear-gradient(135deg,' + tint(c).join(',') + ')';
function avatarHtml(pf, user, cls){
  pf = pf || {}; const a = pf.avatar || { type:user && user.picture ? 'google' : 'initial' }, name = pf.name || (user && user.name) || '?';
  const bg = 'background:' + grad(pf.color);
  if (a.type === 'google' && user && user.picture) return '<span class="av-me ' + (cls || '') + '" style="' + bg + '"><img src="' + esc(user.picture) + '" alt="" referrerpolicy="no-referrer" loading="lazy"></span>';
  if (a.type === 'emoji' && a.emoji) return '<span class="av-me emo ' + (cls || '') + '" style="' + bg + '">' + esc(a.emoji) + '</span>';
  return '<span class="av-me ' + (cls || '') + '" style="' + bg + '">' + esc(String(name).trim().slice(0, 1).toUpperCase() || '?') + '</span>';
}
const myAvatar = cls => avatarHtml(ACC.profile, ACC.user, cls);
if (SESS) setTimeout(accStart, 0);

/* ---------- icono de la pestaña: los 3 círculos como péndulo de Newton ---------- */
function cradleAngles(t, A){
  const u = (t % 1150) / 1150, out = x => 1 - Math.pow(1 - x, 2.4), inn = x => Math.pow(x, 2.4);
  const L = u < .25 ? out(u / .25) : u < .5 ? 1 - inn((u - .25) / .25) : 0;
  const R = u >= .5 && u < .75 ? out((u - .5) / .25) : u >= .75 ? 1 - inn((u - .75) / .25) : 0;
  return [L * A, -R * A];
}
(function favCradle(){
  const link = document.getElementById('favi'); if (!link) return;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); if (!g) return;
  const draw = now => {
    const [a1, a3] = cradleAngles(now, 26 * Math.PI / 180), Lr = 30, py = 4;
    g.clearRect(0, 0, 64, 64);
    g.fillStyle = '#0b0c10'; g.beginPath(); if (g.roundRect) g.roundRect(0, 0, 64, 64, 15); else g.rect(0, 0, 64, 64); g.fill();
    [[20, a1, '#8fb0ff'], [32, 0, '#b69cff'], [44, a3, '#ff8f7a']].forEach(([x, a, col]) => {
      g.globalAlpha = .9; g.fillStyle = col; g.beginPath(); g.arc(x - Lr * Math.sin(a), py + Lr * Math.cos(a), 12, 0, Math.PI * 2); g.fill();
    });
    g.globalAlpha = 1;
    try{ link.href = c.toDataURL('image/png'); }catch(e){}
  };
  let last = 0;
  let on = false;
  const tick = now => { if (!CFG.favAnim){ on = false; draw(0); return; } if (now - last > 50){ last = now; draw(now); } requestAnimationFrame(tick); };
  window.__favStart = () => { if (!on){ on = true; requestAnimationFrame(tick); } };
  window.__favStart();
  setInterval(() => { if (document.hidden && CFG.favAnim) draw(performance.now()); }, 500);
})();

const total = id => { const u = state.usage[id]; return u ? (u.prompt || 0) + (u.completion || 0) : 0; };
const counted = new Set();
/* o: { est:true si es una estimación, free:true si fue a un modelo gratis, rid: id único de la petición } */
function addUsage(id, p = 0, c = 0, countReq = true, o = {}){
  if (!byId(id)) return false;
  if (o.rid){ if (counted.has(o.rid)) return false; counted.add(o.rid); }          /* la misma petición nunca cuenta dos veces */
  p = num(p); c = num(c);
  syncLedger();
  const L = state.ledger, mine = L.dev[DEV] || (L.dev[DEV] = {}), s = mine[id] || (mine[id] = cleanRow({})), d = today();
  s.p += p; s.c += c; s.days[d] = (s.days[d] || 0) + p + c;
  if (o.est){ s.e += p + c; s.de[d] = (s.de[d] || 0) + p + c; }
  if (countReq){ s.r += 1; s.rd[d] = (s.rd[d] || 0) + 1; if (o.free) s.fd[d] = (s.fd[d] || 0) + 1; }
  state.usage = usageOf(L);
  save(); hooks.usage();
  return true;
}
/* «Reiniciar contadores»: empieza una época nueva; los demás dispositivos la respetan al sincronizar */
function resetUsage(){ state.ledger = { ep:Date.now(), dev:{} }; state.usage = {}; writeLedger(); save(); hooks.usage(); }
/* otra pestaña sumó o guardó: lo traemos para no pisarlo */
addEventListener('storage', e => {
  if (e.key === LKEY){ syncLedger(); hooks.usage(); return; }
  if (e.key === KEY && e.newValue){
    try{ const o = JSON.parse(e.newValue); ['fav', 'cmp', 'model', 'models', 'keys', 'threads', 'pinned', 'del', 'arena', 'survey', 'useTeam', 'battle', 'syncKey', 'sx'].forEach(k => { if (k in o) state[k] = o[k]; }); normalizeLite(); hooks.chats(); hooks.usage(); }catch(_){}
  }
});
function normalizeLite(){ state.keys = cleanStrMap(state.keys); state.model = cleanStrMap(state.model); state.models = cleanModels(state.models); state.fav = strList(state.fav, 300); state.cmp = strList(state.cmp, 4); }

/* ---------- avisos ---------- */
let toastT;
function toast(msg){
  let t = $('#toast');
  if (!t){ t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200);
}
function hydrateIcons(scope){
  $$('[data-ico]', scope || document).forEach(el => {
    const p = byId(el.dataset.ico); if (!p) return;
    const t = document.createElement('template'); t.innerHTML = ico(p).trim();
    const n = t.content.firstChild; if (el.id) n.id = el.id;
    el.replaceWith(n);
  });
}

/* ---------- markdown pequeño ---------- */
function inl(h){
  return h.split(/(`[^`\n]+`)/).map((s, i) => i % 2 ? '<code>' + s.slice(1, -1) + '</code>' :
    s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
     .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
     .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')).join('');
}
function md(src){
  return src.split('```').map((seg, i) => {
    if (i % 2){ const nl = seg.indexOf('\n'); const code = nl > -1 ? seg.slice(nl + 1) : seg; return '<pre><code>' + esc(code.replace(/\n$/, '')) + '</code></pre>'; }
    const h = esc(seg);
    let out = '', list = null;
    for (const ln of h.split('\n')){
      const li = ln.match(/^\s*([-*]|\d+\.)\s+(.*)/);
      if (li){
        const t = /\d/.test(li[1]) ? 'ol' : 'ul';
        if (list !== t){ if (list) out += '</' + list + '>'; out += '<' + t + '>'; list = t; }
        out += '<li>' + inl(li[2]) + '</li>'; continue;
      }
      if (list){ out += '</' + list + '>'; list = null; }
      const hd = ln.match(/^#{1,6}\s+(.*)/);
      if (hd){ out += '<h4>' + inl(hd[1]) + '</h4>'; continue; }
      if (ln.trim()) out += '<p>' + inl(ln) + '</p>';
    }
    if (list) out += '</' + list + '>';
    return out;
  }).join('');
}

/* ---------- números que suben ---------- */
function countTo(el, val){
  const from = el._v || 0; el._v = val;
  if (from === val){ el.textContent = fmt(val); return; }
  const t0 = performance.now(), dur = 1100;
  (function tick(now){
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
    el.textContent = fmt(from + (val - from) * e);
    if (k < 1) requestAnimationFrame(tick);
  })(t0);
}

/* ===== escritura suave: cada letra aparece con un resplandor y un cursor la acompaña ===== */
function charify(el){
  if (el._chars) return el._chars;
  if (!el.getAttribute('aria-label') && el.textContent.trim()) el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
  const chars = [];
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3){
        const txt = n.textContent; if (!txt) return;
        const frag = document.createDocumentFragment();
        txt.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(part)); return; }
          const cs = [...part], wrap = cs.length <= 22;
          const holder = wrap ? document.createElement('span') : frag;
          if (wrap) holder.className = 'tw';
          cs.forEach(ch => { const s = document.createElement('span'); s.className = 'tc'; s.setAttribute('aria-hidden', 'true'); s.textContent = ch; holder.appendChild(s); chars.push(s); });
          if (wrap) frag.appendChild(holder);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !/^(SCRIPT|STYLE|SVG|I|BUTTON)$/i.test(n.tagName)) walk(n);
    });
  };
  walk(el);
  chars.forEach(c => { const b = c.closest('li,pre,h4'); if (b && b !== el && el.contains(b)) c._b = b; });
  el._chars = chars; el.setAttribute('data-typed', '');
  return chars;
}
/* cps = letras por segundo; max = segundos máximos que puede tardar */
function typeIn(el, o = {}){
  const cps = o.cps || 70, max = o.max || 4, delay = o.delay || 0, onFrame = o.onFrame;
  const p = new Promise(res => {
    const chars = charify(el), n = chars.length;
    if (!n){ res(); return; }
    if (reduce){ showAll(el); if (onFrame) onFrame(1); res(); return; }
    const caret = document.createElement('i'); caret.className = 'tcaret'; el.appendChild(caret);
    const rate = Math.max(cps, n / max);
    let t0 = null, shown = 0;
    const place = () => {
      const c = chars[Math.max(0, shown - 1)], r = c.getBoundingClientRect(), b = el.getBoundingClientRect();
      const x = shown === 0 ? r.left : r.right;
      caret.style.left = (x - b.left) + 'px'; caret.style.top = (r.top - b.top) + 'px'; caret.style.height = r.height + 'px';
    };
    function step(now){
      if (t0 === null) t0 = now + delay;
      const t = Math.max(0, now - t0) / 1000, ease = Math.min(1, .3 + t * 1.5);
      const target = Math.min(n, Math.floor(t * rate * ease));
      while (shown < target){ const c = chars[shown++]; c.classList.add('on'); if (c._b) c._b.classList.add('sh'); }
      place(); caret.classList.add('on');
      if (onFrame) onFrame(shown / n);
      if (shown < n){ requestAnimationFrame(step); return; }
      caret.classList.remove('on'); setTimeout(() => caret.remove(), 600);
      $$('li,pre,h4', el).forEach(b => b.classList.add('sh'));
      res();
    }
    requestAnimationFrame(step);
  });
  el._typing = p;
  return p;
}
/* muestra todo de golpe (por si se corta una animación) */
function showAll(el){ (el._chars || charify(el)).forEach(c => c.classList.add('on')); $$('li,pre,h4', el).forEach(b => b.classList.add('sh')); $$('.tcaret', el).forEach(c => c.remove()); }

/* ===== llamadas a las IA ===== */
async function getJSON(url, headers){
  let r;
  try{ r = await fetch(url, { headers }); }catch(e){ throw Object.assign(new Error('net'), { net:true }); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error('http'), { status:r.status, data:d });
  return d;
}
function friendly(status, data, p){
  let m = data && data.error ? (data.error.message || data.error) : '';
  if (typeof m !== 'string') m = JSON.stringify(m);
  if (status === 401 || status === 403 || (status === 400 && /api key/i.test(m))) return 'La llave de ' + p.name + ' no es válida o no tiene permiso. Revísala y vuelve a pegarla.';
  if (status === 402) return p.id === 'openrouter' ? 'Tu saldo de OpenRouter está en negativo o ese modelo no es gratis. Elige un modelo gratis o cambia a Puter.' : 'Ese modelo necesita crédito en ' + p.name + '. Elige uno marcado como gratis.';
  if (status === 404) return 'Ese modelo no está disponible ahora mismo en ' + p.name + '. Elige otro de la lista.';
  if (status === 429) return p.id === 'openrouter' ? 'Llegaste al límite gratis de OpenRouter: 20 mensajes por minuto y 50 al día (1.000 al día si compraste 10 créditos o más). Espera un poco o cambia a Puter.' : 'Llegaste al límite gratuito de ' + p.name + '. Espera un minuto o elige otro modelo.';
  if (status === 408 || status >= 500) return p.name + ' o ese modelo están saturados. Prueba de nuevo en un momento o elige otro.';
  /* lo técnico no se muestra: solo un mensaje corto y entendible */
  const human = m && m.length < 140 && !/[{}<>\[\]]|stack|exception|undefined|null/i.test(m);
  return p.name + ' no pudo responder' + (human ? ': ' + m : ' (código ' + status + ')') + '. Prueba de nuevo o elige otro modelo.';
}
const netMsg = p => 'No pude conectar con ' + p.name + '. Revisa tu conexión a internet y vuelve a intentarlo. Si usas un bloqueador de anuncios, desactívalo para este sitio.';

async function fetchModels(p, key){
  let list = [];
  if (p.kind === 'gemini'){
    const d = await getJSON(p.url + '/models?pageSize=200', { 'x-goog-api-key': key });
    list = (d.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => m.name.replace('models/', '')).filter(n => /^gemini/.test(n) && !/embedding|tts|image|live|audio|robotics|computer/.test(n));
  } else {
    const d = await getJSON(p.url + '/models', key ? { Authorization: 'Bearer ' + key } : undefined);
    let arr = d.data || [];
    if (p.id === 'openrouter') arr = arr.filter(m => /:free$/.test(m.id) || (m.pricing && m.pricing.prompt === '0' && m.pricing.completion === '0'));
    list = arr.map(m => m.id);
    if (p.id === 'groq') list = list.filter(n => !/whisper|guard|tts|playai|orpheus/i.test(n));
    if (p.id === 'mistral') list = list.filter(n => !/embed|moderation|ocr|voxtral|transcri/i.test(n));
  }
  return [...new Set(list)].sort().slice(0, 60);
}
async function refreshModels(p){
  const key = state.keys[p.id];
  if (!key && p.id !== 'openrouter') throw new Error('Pega primero tu llave.');
  try{
    const list = await fetchModels(p, key);
    if (list.length){
      state.models[p.id] = list;
      if (p.id !== 'openrouter' && !list.includes(state.model[p.id])) state.model[p.id] = list.includes(p.models[0]) ? p.models[0] : list[0];
      save();
    }
    return list.length;
  }catch(e){
    throw new Error(e.net ? netMsg(p) : friendly(e.status, e.data, p));
  }
}
async function verify(p){
  if (p.id === 'openrouter' && !state.keys.openrouter){
    if (!window.puter) throw new Error('No pude cargar Puter. Revisa tu internet.');
    try{ if (!puter.auth.isSignedIn()) await puter.auth.signIn({ attempt_temp_user_creation:true }); }catch(e){ throw new Error(e && (e.error === 'popup_blocked' || e.code === 'popup_blocked') ? 'Tu navegador bloqueó la ventana de Puter. Permite las ventanas emergentes de este sitio (icono al final de la barra de direcciones) y vuelve a intentar.' : 'No se completó el inicio de sesión de Puter.'); }
    return (await fetchCatalog()).list.length;
  }
  const key = state.keys[p.id];
  if (!key) throw new Error('Pega primero tu llave.');
  if (p.id === 'openrouter'){
    try{ await getJSON(p.url + '/key', { Authorization: 'Bearer ' + key }); }
    catch(e){ throw new Error(e.net ? netMsg(p) : friendly(e.status, e.data, p)); }
  }
  return refreshModels(p);
}
async function ask(p, messages, opts = {}){
  if (/^pu:/.test(String(opts.model || state.model[p.id] || ''))) return askPuter(messages, opts);
  if (p.id === 'openrouter' && !state.keys.openrouter && state.useTeam && SESS && !opts._noTeam) return askStream(p, messages, opts);
  const key = state.keys[p.id];
  const model = String(opts.model || state.model[p.id] || p.models[0]).replace(/^or:/, '');
  if (!key) throw new Error('Falta la llave de ' + p.name + '.');
  let url, headers, body;
  if (p.kind === 'gemini'){
    url = p.url + '/models/' + encodeURIComponent(model) + ':generateContent';
    headers = { 'Content-Type':'application/json', 'x-goog-api-key':key };
    body = { contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts:[{ text:m.content }] })) };
  } else {
    url = p.url + '/chat/completions';
    headers = { 'Content-Type':'application/json', Authorization:'Bearer ' + key };
    body = { model, messages };
    if (opts.maxTokens) body.max_tokens = opts.maxTokens;
  }
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 60000), t0 = performance.now();
  if (opts.signal){ if (opts.signal.aborted) ctl.abort(); else opts.signal.addEventListener('abort', () => ctl.abort(), { once:true }); }
  let res, data;
  try{
    res = await fetch(url, { method:'POST', headers, body:JSON.stringify(body), signal:ctl.signal });
    data = await res.json().catch(() => ({}));
  }catch(e){
    if (opts.signal && opts.signal.aborted) throw Object.assign(new Error('Detenido.'), { aborted:true });
    throw new Error(e && e.name === 'AbortError' ? p.name + ' tardó demasiado en responder. Intenta de nuevo.' : netMsg(p));
  }finally{ clearTimeout(to); }
  if (!res.ok) throw Object.assign(new Error(friendly(res.status, data, p)), { status:res.status, switchTo: p.id === 'openrouter' && (res.status === 429 || res.status === 402) ? 'pu' : null });
  if (data && data.error && !(data.choices && data.choices.length)) throw new Error(friendly(+data.error.code || 502, data, p));
  const ms = performance.now() - t0;
  const inChars = messages.map(m => m.content).join('').length;
  if (p.kind === 'gemini'){
    const text = ((((data.candidates || [])[0] || {}).content || {}).parts || []).map(x => x.text || '').join('') || '(La IA devolvió una respuesta vacía.)';
    const um = data.usageMetadata || {};
    const prompt = um.promptTokenCount || Math.ceil(inChars / 4);
    const tot = um.totalTokenCount || prompt + (um.candidatesTokenCount || est(text));
    return { text, prompt, completion: Math.max(0, tot - prompt), ms, model };
  }
  const msg = ((data.choices || [])[0] || {}).message || {};
  const text = msg.content || '(La IA devolvió una respuesta vacía.)';
  const u = data.usage || {};
  return { text, prompt: u.prompt_tokens != null ? u.prompt_tokens : Math.ceil(inChars / 4), completion: u.completion_tokens != null ? u.completion_tokens : est(text), ms, model };
}
/* SynXCoin's: la moneda de SynthZ. 1 SynXCoin = 1 token */
const MARK_HTML = '<svg class="mark" viewBox="0 0 44 30" fill="none" aria-hidden="true"><g class="sw sw1"><circle class="b1" cx="11" cy="15" r="10" fill="#8fb0ff" fill-opacity=".85"/></g><g class="sw sw2"><circle class="b2" cx="22" cy="15" r="10" fill="#b69cff" fill-opacity=".8"/></g><g class="sw sw3"><circle class="b3" cx="33" cy="15" r="10" fill="#ff8f7a" fill-opacity=".75"/></g><text class="mk-s" x="22" y="21.4" text-anchor="middle">S</text><text class="mk-z" x="28" y="26" text-anchor="middle">z</text></svg>';
const SXC = '<svg class="sxc" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="sxg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fb0ff"/><stop offset=".55" stop-color="#b69cff"/><stop offset="1" stop-color="#ff8f7a"/></linearGradient></defs><circle cx="12" cy="12" r="10.5" fill="url(#sxg)"/><circle cx="12" cy="12" r="7.6" fill="none" stroke="rgba(11,12,16,.32)" stroke-width="1.1"/><path d="M14.7 9.3c-.5-.8-1.5-1.4-2.8-1.4-1.6 0-2.7.8-2.7 2 0 2.7 5.7 1.4 5.7 4.1 0 1.3-1.2 2.2-2.9 2.2-1.3 0-2.5-.6-3-1.6" transform="translate(-1.4 -1.3)" fill="none" stroke="#0b0c10" stroke-width="1.8" stroke-linecap="round"/><path d="M14.7 14.6l2.4 2.4M17.1 14.6l-2.4 2.4" stroke="#0b0c10" stroke-width="1.35" stroke-linecap="round"/></svg>';
const coins = n => fmt(n) + ' SynXCoin' + (Math.round(n) === 1 ? '' : "'s");
const metaOf = r => r.cached ? 'desde caché · 0 SynXCoin\'s' : (r.est ? '≈ ' : '') + coins(r.prompt + r.completion) + ' · ' + (r.ms / 1000).toFixed(1).replace('.', ',') + ' s' + (r.ttft ? ' · empezó en ' + (r.ttft / 1000).toFixed(1).replace('.', ',') + ' s' : '') + (r.completion > 0 && r.ms - (r.ttft || 0) > 300 ? ' · ' + Math.round(r.completion / ((r.ms - (r.ttft || 0)) / 1000)) + '/s' : '');
/* últimos 20 mensajes, siempre empezando por uno del usuario (Gemini y otras APIs lo exigen) */
function history(chat){
  const h = chat.slice(-20).map(m => ({ role:m.role, content:m.content }));
  while (h.length && h[0].role !== 'user') h.shift();
  return h;
}

/* ===== catálogo de modelos de OpenRouter, en vivo (la lista es pública: no necesita llave) ===== */
const CAT_KEY = 'synthz:catalog-v3';
const VENDORS = { 'meta-llama':'Meta', google:'Google', mistralai:'Mistral', openai:'OpenAI', qwen:'Qwen', deepseek:'DeepSeek', nvidia:'NVIDIA', microsoft:'Microsoft', moonshotai:'Moonshot', 'z-ai':'Z.ai', 'x-ai':'xAI', anthropic:'Anthropic', cohere:'Cohere', nousresearch:'Nous', thudm:'THUDM', tngtech:'TNG', minimax:'MiniMax', inception:'Inception', liquid:'Liquid', allenai:'Ai2', ai21:'AI21', amazon:'Amazon', baidu:'Baidu', tencent:'Tencent', bytedance:'ByteDance', 'stepfun-ai':'StepFun', cognitivecomputations:'Cognitive', rekaai:'Reka', arliai:'ArliAI', 'shisa-ai':'Shisa' };
const vendorLabel = v => VENDORS[v] || (v ? v.charAt(0).toUpperCase() + v.slice(1) : 'Otro');
function vendorColor(v){ let h = 0; for (const ch of String(v)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return 'hsl(' + (h % 360) + ' 72% 74%)'; }
function parseModels(data){
  const arr = Array.isArray(data) ? data : (data && data.data) || [];
  const out = [];
  arr.forEach(m => {
    if (!m || typeof m.id !== 'string') return;
    const a = m.architecture || {}, inM = Array.isArray(a.input_modalities) ? a.input_modalities : ['text'], outM = Array.isArray(a.output_modalities) ? a.output_modalities : ['text'];
    if (!outM.includes('text')) return;                       /* el chat es de texto: se omiten los que solo generan imágenes */
    const pr = m.pricing || {};
    const free = /:free$/.test(m.id) || (pr.prompt != null && pr.completion != null && +pr.prompt === 0 && +pr.completion === 0);
    const vendor = m.id.split('/')[0] || 'otro';
    let name = String(m.name || m.id).replace(/\s*\(free\)\s*$/i, '');
    const ci = name.indexOf(': '); if (ci > 0 && ci < 28) name = name.slice(ci + 2);
    const sp = Array.isArray(m.supported_parameters) ? m.supported_parameters : [];
    out.push({ id:m.id, name, vendor, vlabel:vendorLabel(vendor), ctx:num(m.context_length), free, created:num(m.created),
      vision:inM.includes('image'), reasoning:sp.includes('reasoning') || sp.includes('include_reasoning'), tools:sp.includes('tools'),
      desc:String(m.description || '').replace(/\s+/g, ' ').trim().slice(0, 260) });
  });
  return out;
}
function loadCatalog(){
  try{
    const s = JSON.parse(localStorage.getItem(CAT_KEY));
    if (s && Array.isArray(s.list) && s.list.length)
      return { t:num(s.t), list:s.list.filter(m => m && typeof m.id === 'string' && typeof m.name === 'string').map(m => ({ id:m.id, name:m.name, vendor:String(m.vendor || m.id.split('/')[0]), vlabel:String(m.vlabel || vendorLabel(m.vendor)), ctx:num(m.ctx), free:!!m.free, created:num(m.created), vision:!!m.vision, reasoning:!!m.reasoning, tools:!!m.tools, desc:String(m.desc || '') })) };
  }catch(e){}
  return null;
}
async function fetchCatalog(){
  const pu = async () => {
    if (!window.puter) throw new Error('sin puter');
    const arr = await puter.ai.listModels(), seen = new Set(), out = [];
    (Array.isArray(arr) ? arr : []).forEach(m => {
      if (!m || !m.id || seen.has(m.id) || /image|dall|tts|whisper|embed|moderat|video|sora|imagen|flux|stable|transcri|speech|rerank/i.test(m.id)) return;
      seen.add(m.id);
      const vendor = String(m.provider || String(m.id).split('/')[0] || 'otro').replace(/-completion$/, '');
      out.push({ id:'pu:' + m.id, name:String(m.name || m.id), vendor, vlabel:vendorLabel(vendor) + ' · Puter', ctx:num(m.context), free:true, created:0,
        vision:/gpt-4|gpt-5|gemini|claude|vision|pixtral|llava|-vl|grok|llama-4/i.test(m.id), reasoning:/reason|think|r1|o1|o3|o4|gpt-5|gemini-(2\.5|3)|claude|qwq|gpt-oss/i.test(m.id), tools:true, desc:'' });
    });
    if (!out.length) [['gpt-5.4-nano', 'GPT 5.4 Nano', 'openai'], ['gpt-5.6-luna', 'GPT 5.6 Luna', 'openai'], ['gemini-3.5-flash-lite', 'Gemini 3.5 Flash Lite', 'google']].forEach(([id, name, v]) => out.push({ id:'pu:' + id, name, vendor:v, vlabel:vendorLabel(v) + ' · Puter', ctx:0, free:true, created:0, vision:true, reasoning:/gpt-5/.test(id), tools:true, desc:'' }));
    return out;
  };
  const orr = async () => parseModels(await getJSON('https://openrouter.ai/api/v1/models')).map(m => ({ ...m, id:'or:' + m.id, vlabel:m.vlabel + ' · OpenRouter' }));
  const [a, b] = await Promise.allSettled([orr(), pu()]);
  const list = [...(a.status === 'fulfilled' ? a.value : []), ...(b.status === 'fulfilled' ? b.value : [])];
  if (!list.length) throw Object.assign(new Error('vacío'), (a.reason && a.reason.net) ? { net:true } : { empty:true });
  const t = Date.now();
  try{ localStorage.setItem(CAT_KEY, JSON.stringify({ t, list })); }catch(e){}
  return { t, list };
}

/* chispas de color: celebran una acción lograda */
function burst(x, y, cols = ['#8fb0ff', '#b69cff', '#ff8f7a', '#f2b36b', '#7fd6b8'], n = 16){
  if (reduce) return;
  for (let i = 0; i < n; i++){
    const s = document.createElement('i');
    s.style.cssText = 'position:fixed;left:0;top:0;width:6px;height:6px;border-radius:50%;pointer-events:none;z-index:9995;background:' + cols[i % cols.length];
    document.body.appendChild(s);
    const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 80;
    s.animate([{ transform:'translate(' + x + 'px,' + y + 'px) scale(1)', opacity:1 }, { transform:'translate(' + (x + Math.cos(a) * d) + 'px,' + (y + Math.sin(a) * d + 22) + 'px) scale(.2)', opacity:0 }], { duration:700 + Math.random() * 500, easing:'cubic-bezier(.22,1,.36,1)' }).onfinish = () => s.remove();
  }
}

/* ===== cursor: flecha con viento, vidrio y etiqueta nítida, ahora con movimiento más suave ===== */
let busyOn = false, extraY = 0;
const S = { retarget: () => {}, busy: on => { busyOn = !!on; root.classList.toggle('cursor-busy', busyOn); } };
if (matchMedia('(pointer: fine)').matches && CFG.cursor){
  document.body.insertAdjacentHTML('beforeend',
    '<div id="cd"><svg id="ca" viewBox="0 0 22 30" fill="none"><path d="M2.5 2.2V23L8 18.1L11.6 26.4L15.2 24.9L11.7 16.9L19 16.6Z" fill="#0d0e12" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg><svg id="chd" viewBox="0 0 24 28" fill="none" aria-hidden="true"><path d="M9 2.6c1.1 0 2 .9 2 2V12h.6V9.9c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8V12h.5v-1.2c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8V13h.2c.9 0 1.7.8 1.7 1.7v4.4c0 4.5-3.3 7.8-7.6 7.8h-1.5c-2.4 0-4.4-1.2-5.6-3.2l-4.4-7.2c-.5-.9-.2-2 .7-2.5.8-.5 1.9-.2 2.4.6L7 17V4.6c0-1.1.9-2 2-2z" fill="#0d0e12" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg><i id="cs"><svg viewBox="0 0 24 24"><path d="M6 5.5h12"/><path d="M12 9.5v9M8.5 15l3.5 3.5 3.5-3.5"/></svg></i><i id="cw"></i><i id="ci"></i><i id="cm"><svg viewBox="0 0 30 30" fill="none"><circle cx="15" cy="15" r="13" fill="rgba(13,14,18,.55)" stroke="#fff" stroke-width="1.4"/><path d="M15 5.5l3.2 3.6h-6.4zM15 24.5l3.2-3.6h-6.4z" fill="#fff"/><circle cx="15" cy="15" r="2" fill="#b8c4ff"/></svg></i></div><div id="cr"></div><div id="cl"></div>');
  const cd = $('#cd'), ca = $('#ca'), cr = $('#cr'), cl = $('#cl'), cs = $('#cs');
  const TEXT = 'input:not([type=checkbox]):not([type=file]), textarea, [contenteditable=true]';
  const LINK = 'a[href], button, select, summary, .chip, [role=tab], [data-hover]';
  /* menú de configuración: las opciones que se pueden elegir muestran la manita; los switches, sin vidrio encima */
  const HAND = '#cfgm .cfgo button, #cfgm .cfgseg button, #cfgm .cfgsw', NOGLASS = '#cfgm .cfgsw';
  let px = -100, py = -100, ax = -100, ay = -100, rx = -100, ry = -100, rw = 34, rh = 34, rr = 17;
  let cm = 'idle', hov = null, lblEl = null, lx = 0, ly = 0, down = false, active = false, clT = 0;
  let lastX = ax, lastY2 = ay, vx = 0, vy = 0, ang = 0, angV = 0, sc = 1, fl = performance.now();
  let sv = 0, lastSY = scrollY, wasScroll = false, visT = 1, vis = 1;
  let onBar = false, snap = false, chk = 0, lblSync = null, lw = 0, lh = 0;
  /* ¿el mouse está sobre una barra de desplazamiento? (la de la página o la de una lista) */
  function overBar(e){
    const de = document.documentElement;
    if (e.clientX >= de.clientWidth || e.clientY >= de.clientHeight) return true;
    const n = e.target;
    if (!(n instanceof Element) || n === de || n === document.body) return false;
    if (n.scrollHeight <= n.clientHeight && n.scrollWidth <= n.clientWidth) return false;
    const r = n.getBoundingClientRect(), x = e.clientX - r.left - n.clientLeft, y = e.clientY - r.top - n.clientTop;
    return (x >= n.clientWidth && x < r.width) || (y >= n.clientHeight && y < r.height);
  }
  const toIdle = () => { setHover(null); cm = 'idle'; cr.classList.remove('link', 'txt'); visT = 1; cd.classList.remove('mini'); };

  const PROPS = ['color','fontSize','fontWeight','fontFamily','fontStyle','letterSpacing','lineHeight','display','alignItems','justifyContent','gap','flexDirection','paddingTop','paddingRight','paddingBottom','paddingLeft','width','height','backgroundColor','borderRadius','boxShadow','opacity','textDecorationLine','textDecorationColor','textUnderlineOffset','whiteSpace','textAlign','boxSizing','filter','backgroundImage','backgroundSize','textTransform','overflow','textOverflow','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','borderTopStyle','borderRightStyle','borderBottomStyle','borderLeftStyle','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor'];
  function copyStyles(o, c, isRoot){
    const cs = getComputedStyle(o);
    PROPS.forEach(k => { c.style[k] = cs[k]; });
    c.style.margin = '0'; c.style.position = 'static'; c.style.transform = 'none'; c.style.transition = 'none';
    c.style.animation = 'none'; c.style.pointerEvents = 'none'; c.style.visibility = 'visible'; c.style.translate = 'none';
    if (isRoot){
      ['Top','Right','Bottom','Left'].forEach(s => { c.style['border' + s + 'Width'] = cs['border' + s + 'Width']; c.style['border' + s + 'Style'] = cs['border' + s + 'Style']; });
      c.style.borderColor = 'transparent'; c.style.background = 'transparent'; c.style.boxShadow = 'none';
      c.style.backdropFilter = 'none'; c.style.setProperty('-webkit-backdrop-filter', 'none');
      c.style.backgroundImage = 'none'; c.style.color = cs.color;
    }
    const oc = [...o.children], cc = [...c.children];
    oc.forEach((k, i) => { if (cc[i] && !(k instanceof SVGElement && k.tagName.toLowerCase() !== 'svg')) copyStyles(k, cc[i], false); });
  }
  function buildLabel(el){
    cl.innerHTML = ''; lblEl = el;
    let c;
    if (el.tagName === 'SELECT'){
      c = document.createElement('span'); c.textContent = el.selectedOptions[0] ? el.selectedOptions[0].text : '';
      copyStyles(el, c, true); c.style.overflow = 'hidden'; c.style.textOverflow = 'ellipsis'; c.style.whiteSpace = 'nowrap'; c.style.display = 'flex'; c.style.alignItems = 'center';
    } else {
      c = el.cloneNode(true); c.removeAttribute('id'); c.removeAttribute('href'); c.removeAttribute('target');
      copyStyles(el, c, true);
    }
    const b = el.getBoundingClientRect();
    lw = el.offsetWidth || b.width; lh = el.offsetHeight || b.height;
    c.style.width = lw + 'px'; c.style.height = lh + 'px'; c.style.boxSizing = 'border-box';
    cl.appendChild(c);
    /* el logo de la copia imita al original cuadro a cuadro: mismo tamaño y el péndulo frenando igual */
    const om = el.querySelectorAll('.mark, .mark .sw'), cmk = c.querySelectorAll && c.querySelectorAll('.mark, .mark .sw');
    lblSync = om.length && cmk && cmk.length === om.length ? [...om].map((o, i) => { cmk[i].style.animation = 'none'; cmk[i].style.transition = 'none'; return [o, cmk[i]]; }) : null;
  }
  function setHover(el){
    if (el === hov) return;
    if (hov) hov.classList.remove('cur-hov');
    hov = el; clearTimeout(clT);
    if (!el){ cl.style.opacity = '0'; clT = setTimeout(() => { if (!hov){ cl.innerHTML = ''; lblEl = null; lblSync = null; } }, 280); return; }
    buildLabel(el); el.classList.add('cur-hov'); cl.style.opacity = '1'; lx = ly = 0;
  }
  function pick(t){
    let m = 'idle', h = null, hand = false;
    if (t && t.closest){
      if (t.closest(TEXT)) m = 'text';
      else {
        const l = t.closest(LINK);
        if (l && !l.disabled && !l.closest('.hide')){
          hand = l.matches(HAND);
          if (!l.matches(NOGLASS)){ m = 'link'; h = l; }          /* el switch se anima solo: sin vidrio ni copia encima */
        }
      }
    }
    cm = m; cr.classList.toggle('txt', m === 'text'); cr.classList.toggle('link', m === 'link');
    visT = m === 'idle' || hand ? 1 : 0; cd.classList.toggle('mini', visT === 0); cd.classList.toggle('hand', hand);
    setHover(h);
  }
  /* en el menú de configuración, la copia nítida se rehace tras el clic para mostrar el estado nuevo */
  addEventListener('click', () => { const el = hov; if (el && el.closest('#cfgm')) [40, 420].forEach(ms => setTimeout(() => { if (hov === el && el.isConnected){ const tr = el.style.transition; el.style.transition = 'none'; el.classList.remove('cur-hov'); buildLabel(el); el.classList.add('cur-hov'); void el.offsetWidth; el.style.transition = tr; } }, ms)); }, true);
  S.retarget = () => { if (active && Math.abs(sv) <= 3 && !root.classList.contains('lock')) pick(document.elementFromPoint(px, py)); };

  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    if (down && !e.buttons) down = false;                 /* soltaste el botón donde la página no lo vio */
    if (!active){ active = true; ax = rx = lastX = e.clientX; ay = ry = lastY2 = e.clientY; root.classList.add('cursor-on'); }
    px = e.clientX; py = e.clientY;
    /* sobre una barra de desplazamiento o un recuadro de otra página se ve el cursor normal, sin el de SynthZ encima */
    const bar = overBar(e) || (e.target instanceof Element && e.target.tagName === 'IFRAME');
    if (bar !== onBar){ onBar = bar; root.classList.toggle('cursor-bar', bar); if (!bar) snap = true; }
    if (snap){ snap = false; ax = rx = lastX = px; ay = ry = lastY2 = py; vx = vy = angV = 0; }
    if (bar){ if (cm !== 'idle') toIdle(); return; }
    pick(e.target instanceof Element ? e.target : null);
  }, { passive:true });
  /* si arrastras algo (un archivo, un texto) el cursor te sigue igual */
  addEventListener('dragover', e => { if (e.clientX || e.clientY){ px = e.clientX; py = e.clientY; } }, { passive:true });
  addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse') return;
    if (overBar(e)){                                      /* agarraste la barra: nada de golpe ni de cursor encogido */
      snap = true; onBar = true; root.classList.add('cursor-bar'); toIdle();
      ssStop(e.clientX >= document.documentElement.clientWidth || e.clientY >= document.documentElement.clientHeight ? document.scrollingElement : e.target);
      return;
    }
    down = true;
    const r = document.createElement('div'); r.className = 'rip'; document.body.appendChild(r);
    const T = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
    r.animate([{ transform: T + ' scale(1)', opacity: .7 }, { transform: T + ' scale(7)', opacity: 0 }], { duration: 750, easing: 'cubic-bezier(.22,1,.36,1)' }).onfinish = () => r.remove();
  });
  const release = () => { down = false; };
  addEventListener('pointerup', release); addEventListener('mouseup', release); addEventListener('pointercancel', release); addEventListener('dragend', release);
  addEventListener('blur', () => { release(); snap = true; });
  root.addEventListener('mouseleave', () => { root.classList.add('cursor-hide'); snap = true; });
  root.addEventListener('mouseenter', () => root.classList.remove('cursor-hide'));

  /* todos los suavizados dependen del tiempo, así que se sienten igual a 60 o a 144 Hz */
  const ease = (k, dt) => 1 - Math.pow(1 - k, dt);
  (function frame(now){
    const dt = Math.min(2.5, (now - fl) / 16.67 || 1); fl = now;
    /* la flecha va un poco detrás del mouse real y llega con suavidad */
    const nx = ax + (px - ax) * ease(.34, dt), ny = ay + (py - ay) * ease(.34, dt);
    vx += (((nx - lastX) / dt) - vx) * ease(.3, dt); vy += (((ny - lastY2) / dt) - vy) * ease(.3, dt);
    lastX = ax = nx; lastY2 = ay = ny;
    const target = clamp(vx * 1.05 - vy * .3 + 2, -42, 42);
    angV += (-(ang - target) * .085 - angV * .17) * dt;
    ang += angV * dt;
    const speed = Math.hypot(vx, vy);
    /* scroll: la flecha se estira y una flecha de luz marca hacia dónde baja la página; el vidrio se suelta mientras se desplaza */
    const sy = scrollY + extraY; sv += (((sy - lastSY) / dt) - sv) * ease(.18, dt); lastSY = sy;
    const sa = clamp(Math.abs(sv) / 26, 0, 1), scr = Math.abs(sv) > 3;
    cs.style.opacity = sa.toFixed(2);
    cs.style.transform = 'translate(0,' + (Math.sign(sv) * (22 + sa * 14)).toFixed(1) + 'px) rotate(' + (sv < 0 ? 180 : 0) + 'deg) scale(' + (.7 + sa * .5).toFixed(2) + ')';
    if (scr && cm !== 'idle') toIdle();
    if (wasScroll && !scr) S.retarget();
    wasScroll = scr;
    /* cada pocos cuadros revisa qué hay de verdad bajo el mouse: si algo se movió, apareció una ventana o el botón se fue, el vidrio lo suelta */
    if (active && !scr && !down && !onBar && ++chk % 8 === 0) pick(document.elementFromPoint(px, py));
    sc += ((down ? .86 : 1) - sc) * ease(.25, dt); vis += ((busyOn ? 0 : visT) - vis) * ease(.22, dt); ca.style.opacity = vis.toFixed(2);
    ca.style.transform = 'rotate(' + ang.toFixed(2) + 'deg) scale(' + (sc * vis).toFixed(3) + ') scaleY(' + (1 + sa * .2).toFixed(3) + ')';
    cd.style.transform = 'translate3d(' + ax.toFixed(2) + 'px,' + ay.toFixed(2) + 'px,0)';

    /* vidrio que abraza el elemento, con un deslizamiento más lento y sedoso */
    let tgx = px, tgy = py, tw = 34, th = 34, tr = 17, ox = 0, oy = 0;
    if (cm === 'text'){ tw = 3; th = 24; tr = 2; }
    else if (cm === 'link' && hov && hov.isConnected){
      const b = hov.getBoundingClientRect(), pad = 7, cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      if (px < b.left - 3 || px > b.right + 3 || py < b.top - 3 || py > b.bottom + 3){ pick(document.elementFromPoint(px, py)); requestAnimationFrame(frame); return; }
      ox = clamp((px - cx) * .12, -7, 7); oy = clamp((py - cy) * .18, -5, 5);
      tgx = cx + ox; tgy = cy + oy; tw = b.width + pad * 2; th = b.height + pad * 2;
      const br = parseFloat(getComputedStyle(hov).borderRadius) || 0; tr = Math.min(Math.max(br + pad, 12), th / 2);
    } else if (cm === 'link' && hov && !hov.isConnected) toIdle();
    const k = ease(cm === 'idle' ? .17 : .15, dt), ks = ease(.14, dt);
    rx += (tgx - rx) * k; ry += (tgy - ry) * k; rw += (tw - rw) * ks; rh += (th - rh) * ks; rr += (tr - rr) * ks;
    cr.style.width = rw.toFixed(2) + 'px'; cr.style.height = rh.toFixed(2) + 'px'; cr.style.borderRadius = rr.toFixed(2) + 'px';
    cr.style.transform = 'translate3d(' + (rx - rw / 2).toFixed(2) + 'px,' + (ry - rh / 2).toFixed(2) + 'px,0) scale(' + (down ? .94 : 1) + ')';
    /* etiqueta nítida encima del vidrio */
    lx += (ox - lx) * ease(.2, dt); ly += (oy - ly) * ease(.2, dt);
    if (lblEl && lblEl.isConnected){
      const b = lblEl.getBoundingClientRect(), sx = lw ? b.width / lw : 1, sy2 = lh ? b.height / lh : 1;
      cl.style.transform = 'translate3d(' + (b.left + lx).toFixed(2) + 'px,' + (b.top + ly).toFixed(2) + 'px,0)' + (Math.abs(sx - 1) > .002 || Math.abs(sy2 - 1) > .002 ? ' scale(' + sx.toFixed(4) + ',' + sy2.toFixed(4) + ')' : '');
      if (lblSync) for (const [o, k] of lblSync) k.style.transform = getComputedStyle(o).transform;
    }
    requestAnimationFrame(frame);
  })(performance.now());
}


/* ---------- v2: escritura con brillo, golpe de cristal, portal Z y agua ---------- */
function mirrorType(ta){
  if (!ta || ta._sync || reduce) return;
  const fld = ta.closest('.field'); if (!fld) return;
  const m = document.createElement('div'); m.className = 'mir'; m.setAttribute('aria-hidden', 'true');
  fld.classList.add('mw'); fld.insertBefore(m, ta);
  let prev = '';
  const css = () => { const c = getComputedStyle(ta); ['font', 'padding', 'lineHeight', 'letterSpacing', 'textIndent', 'tabSize'].forEach(k => { m.style[k] = c[k]; }); };
  const spans = s => [...s].map((ch, i) => '<span class="nw" style="animation-delay:' + Math.min(i * 12, 420) + 'ms">' + esc(ch) + '</span>').join('');
  const sync = () => {
    const v = ta.value;
    if (v === prev){ m.scrollTop = ta.scrollTop; return; }
    css();
    let a = 0; while (a < prev.length && a < v.length && prev[a] === v[a]) a++;
    let b = 0; while (b < prev.length - a && b < v.length - a && prev[prev.length - 1 - b] === v[v.length - 1 - b]) b++;
    const mid = v.slice(a, v.length - b);
    if (b === 0 && a === prev.length && m.lastChild && m.lastChild.nodeType === 3 && prev){
      const t = document.createElement('template'); t.innerHTML = spans(mid); m.insertBefore(t.content, m.lastChild);
    } else {
      m.innerHTML = esc(v.slice(0, a)) + spans(mid) + esc(v.slice(v.length - b));
      m.appendChild(document.createTextNode('​'));
    }
    prev = v; m.scrollTop = ta.scrollTop;
  };
  ta._sync = sync;
  ta.addEventListener('input', sync);
  ta.addEventListener('scroll', () => { m.scrollTop = ta.scrollTop; });
  m.appendChild(document.createTextNode('​')); sync();
}
/* golpe suave de cristal: como el clic del mouse pero más lento, borroso y con efecto glass */
function thud(x, y){
  if (reduce) return;
  const big = Math.hypot(innerWidth, innerHeight) * 2.2 / 46, ring = 'radial-gradient(circle,transparent 58%,#000 60%,#000 72%,transparent 74%)';
  const base = 'position:fixed;left:' + x + 'px;top:' + y + 'px;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;pointer-events:none;';
  const g = document.createElement('i');
  g.style.cssText = base + 'z-index:9989;mix-blend-mode:screen;filter:blur(7px);background:radial-gradient(circle,rgba(214,204,255,.85),rgba(143,176,255,.42) 36%,rgba(255,143,122,.16) 56%,transparent 70%)';
  const r = document.createElement('i');
  r.style.cssText = base + 'z-index:9990;background:rgba(255,255,255,.1);backdrop-filter:blur(9px) saturate(1.6) brightness(1.18);-webkit-backdrop-filter:blur(9px) saturate(1.6) brightness(1.18);box-shadow:inset 0 0 0 1px rgba(255,255,255,.3);-webkit-mask:' + ring + ';mask:' + ring + ';filter:blur(1.5px)';
  document.body.append(g, r);
  g.animate([{ transform:'scale(.2)', opacity:0 }, { transform:'scale(3.2)', opacity:1, offset:.14 }, { transform:'scale(' + (big * .6).toFixed(1) + ')', opacity:0 }], { duration:2700, easing:'cubic-bezier(.16,.8,.3,1)', fill:'both' }).onfinish = () => g.remove();
  r.animate([{ transform:'scale(.3)', opacity:0 }, { transform:'scale(1.2)', opacity:1, offset:.1 }, { transform:'scale(' + big.toFixed(1) + ')', opacity:0 }], { duration:3000, easing:'cubic-bezier(.16,.8,.3,1)', fill:'both' }).onfinish = () => r.remove();
}
/* portal: la Z carga, se hace zoom hacia adentro y se entra al chat */
const zoomK = () => Math.hypot(innerWidth, innerHeight) / 2 / ((132 / 48) * 4.7) * 1.12;
const portalPaint = (p, k) => p.setAttribute('transform', 'translate(24 24) scale(' + k.toFixed(3) + ') translate(-24 -24)');
function zBox(host){
  const w = document.createElement('div'); w.className = 'pz';
  w.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="' + Z_PATH + '" fill="url(#zgrad)"/></svg>';
  host.appendChild(w); return { w, p: w.querySelector('path') };
}
function portalFill(host){ const z = zBox(host); portalPaint(z.p, zoomK()); return z.p; }
function portalReveal(p){
  if (!p) return; const K = zoomK(), t0 = performance.now(), D = 950;
  (function f(now){ const e = Math.min(1, (now - t0) / D); portalPaint(p, K * Math.pow(2.4, e)); if (e < 1) requestAnimationFrame(f); })(t0);
}
function portalOut(href){
  const o = document.createElement('div'); o.id = 'portal'; o.innerHTML = '<i class="pg"></i>'; document.body.appendChild(o);
  const z = zBox(o), K = zoomK(); root.classList.add('leaving'); S.busy(true);
  let gone = false; const go = () => { if (gone) return; gone = true; location.href = href; };
  setTimeout(go, 6500);
  z.p.setAttribute('pathLength', '1'); z.p.setAttribute('stroke', 'url(#zgrad)'); z.p.setAttribute('stroke-width', '1.4'); z.p.style.strokeDasharray = '1'; z.p.style.strokeDashoffset = '1'; z.p.style.fillOpacity = '0';
  o.animate([{ opacity:0 }, { opacity:1 }], { duration:380, fill:'forwards', easing:'ease-out' });
  const t0 = performance.now(), A = 1500, H = 380, Z = 1150;
  (function f(now){
    const t = now - t0; let k, op = 1, bl = 0;
    if (t < A){ const e = t / A; k = .85 + .15 * (1 - Math.pow(1 - e, 3)); z.p.style.strokeDashoffset = (1 - Math.min(1, e / .6)).toFixed(3); z.p.style.fillOpacity = Math.max(0, (e - .45) / .55).toFixed(3); }
    else if (t < A + H){ k = 1 + Math.sin((t - A) / H * Math.PI) * .045; z.p.style.strokeDashoffset = '0'; z.p.style.fillOpacity = '1'; }
    else { const e = Math.min(1, (t - A - H) / Z), q = e < .5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2; k = Math.exp(Math.log(K) * q); }
    portalPaint(z.p, k); z.w.style.opacity = op; z.w.style.filter = bl > .2 ? 'blur(' + bl.toFixed(1) + 'px)' : 'none';
    if (t < A + H + Z) requestAnimationFrame(f); else go();
  })(t0);
}
/* al salir del portal la pantalla ondula como si saliera del agua (sin gotas) */
function waterIn(el){
  if (!el || reduce) return;
  document.body.insertAdjacentHTML('beforeend', '<svg id="szwsvg" width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="szwater" x="-6%" y="-6%" width="112%" height="112%"><feTurbulence id="szturb" type="fractalNoise" baseFrequency="0.006 0.011" numOctaves="2" seed="7" result="n"/><feDisplacementMap id="szdisp" in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></svg>');
  const turb = $('#szturb'), disp = $('#szdisp'), t0 = performance.now(), D = 1700;
  el.style.filter = 'url(#szwater)';
  (function f(now){
    const e = Math.min(1, (now - t0) / D), amp = Math.pow(1 - e, 2.2) * 70;
    disp.setAttribute('scale', amp.toFixed(1));
    turb.setAttribute('baseFrequency', (0.006 + e * 0.002).toFixed(4) + ' ' + (0.011 - e * 0.004 + Math.sin(e * 9) * 0.0015).toFixed(4));
    if (e < 1) requestAnimationFrame(f); else { el.style.filter = ''; const s = $('#szwsvg'); if (s) s.remove(); }
  })(t0);
}

function ctxMenu(getItems){
  let m = null; const close = () => { if (m){ m.remove(); m = null; } };
  addEventListener('contextmenu', e => {
    if (e.target.closest && e.target.closest('input,textarea')) return;
    e.preventDefault(); close();
    const sel = String(getSelection() || '').trim();
    const items = [...(sel ? [{ label:'Copiar selección', fn:() => navigator.clipboard && navigator.clipboard.writeText(sel) }] : []), ...getItems(e)];
    m = document.createElement('div'); m.className = 'ctxm'; m.setAttribute('role', 'menu');
    items.forEach(it => { const b = document.createElement('button'); b.type = 'button'; b.textContent = it.label; b.addEventListener('click', ev => { ev.stopPropagation(); close(); it.fn(); }); m.appendChild(b); });
    document.body.appendChild(m);
    m.style.left = Math.max(8, Math.min(e.clientX, innerWidth - m.offsetWidth - 10)) + 'px'; m.style.top = Math.max(8, Math.min(e.clientY, innerHeight - m.offsetHeight - 10)) + 'px';
    m.animate([{ opacity:0, transform:'scale(.9) translateY(6px)', filter:'blur(6px)' }, { opacity:1, transform:'none', filter:'blur(0)' }], { duration:380, easing:'cubic-bezier(.22,1,.36,1)' });
  });
  addEventListener('pointerdown', e => { if (m && !m.contains(e.target)) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  addEventListener('scroll', close, true); addEventListener('resize', close);
}
if (matchMedia('(pointer: fine)').matches && !reduce){ let ax = 0, ay = 0, aq = 0; addEventListener('pointermove', e => { ax = e.clientX; ay = e.clientY; if (aq) return; aq = requestAnimationFrame(() => { aq = 0; const a = $('.aurora'); if (!a) return; a.style.setProperty('--mx', ((ax / innerWidth - .5) * 70).toFixed(1)); a.style.setProperty('--my', ((ay / innerHeight - .5) * 70).toFixed(1)); }); }, { passive:true }); }
addEventListener('scroll', e => { const t = e.target; if (t && t !== document && t.scrollTop != null){ extraY += t.scrollTop - (t._lt || 0); t._lt = t.scrollTop; } }, true);
if (matchMedia('(pointer: fine)').matches){
  const TXT = 'p,h1,h2,h3,h4,h5,h6,li,td,th,blockquote,pre,code,small,label,em,strong,b,span,.bub,.md';
  const NOT = 'a,button,[role=button],input,textarea,select,summary,.tg,.word,.logo';
  /* la barrita de texto solo aparece mientras seleccionas (arrastrando sobre texto) */
  let selDown = null;
  const hasSel = () => { const s = getSelection(); return !!(s && !s.isCollapsed && String(s).trim()); };
  addEventListener('pointerdown', e => { const t = e.target; selDown = e.button === 0 && t && t.closest && !t.closest(NOT) ? [e.clientX, e.clientY, !!t.closest(TXT)] : null; }, { passive:true });
  addEventListener('pointermove', e => { root.classList.remove('cursor-typing'); if (selDown && (e.buttons & 1) && Math.hypot(e.clientX - selDown[0], e.clientY - selDown[1]) > 4 && (selDown[2] || hasSel())) root.classList.add('cursor-text'); }, { passive:true });
  document.addEventListener('selectionchange', () => { if (selDown && hasSel()) root.classList.add('cursor-text'); });
  const selEnd = () => { selDown = null; root.classList.remove('cursor-text'); };
  addEventListener('pointerup', selEnd); addEventListener('pointercancel', selEnd); addEventListener('blur', selEnd);
  addEventListener('keydown', e => { if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') root.classList.add('cursor-typing'); });
}
{ const au = $('.aurora'); if (au && au.children.length < 4) au.appendChild(document.createElement('i')); }
const errText = e => typeof e === 'string' ? e : !e ? '' : (e.message || e.msg || (e.error && (typeof e.error === 'string' ? e.error : e.error.message || e.error.code)) || e.code || '');
async function askPuter(messages, opts){
  if (!window.puter) throw new Error('No pude cargar Puter. Revisa tu internet o desactiva el bloqueador de anuncios para esta página.');
  if (!puter.auth.isSignedIn()) throw Object.assign(new Error('Conecta tu cuenta de Puter para usar este modelo.'), { needLogin:true });
  const model = String(opts.model || state.model.openrouter).replace(/^pu:/, ''), t0 = performance.now();
  const inChars = messages.reduce((n, m) => n + (typeof m.content === 'string' ? m.content.length : 200), 0);
  let resp;
  try{ resp = await Promise.race([new Promise((_, no) => { const s = opts.signal; if (s){ if (s.aborted) no(Object.assign(new Error('Detenido.'), { aborted:true })); else s.addEventListener('abort', () => no(Object.assign(new Error('Detenido.'), { aborted:true })), { once:true }); } }), puter.ai.chat(messages, Object.assign({ model, normalize:true }, opts.maxTokens ? { max_tokens:opts.maxTokens } : {})), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 120000))]); }
  catch(e){
    if (e && e.aborted) throw e;
    const m = errText(e), code = String((e && (e.code || (e.error && e.error.code) || e.status)) || '') + ' ' + m;
    if (/insufficient_funds|402/i.test(code)) throw Object.assign(new Error('Se acabaron tus créditos gratis de Puter. Se renuevan cada mes (también puedes comprar créditos en puter.com). Mientras tanto, usa un modelo de OpenRouter.'), { switchTo:'or', limit:true });
    if (/too_many_requests|429|rate.?limit/i.test(code)) throw Object.assign(new Error('Puter te pidió ir más despacio: máximo 30 mensajes cada 10 segundos y 3 a la vez. Espera unos segundos y vuelve a intentar.'), { limit:true });
    if (/auth|token|sign.?in|login|401|403/i.test(m)) throw Object.assign(new Error('Tu sesión de Puter expiró. Conéctala otra vez.'), { needLogin:true });
    throw new Error(m === 'timeout' ? 'El modelo tardó demasiado. Intenta de nuevo.' : 'Puter: ' + (m || 'no pudo responder con este modelo. Prueba con otro.'));
  }
  const c = resp && resp.message ? resp.message.content : resp;
  const text = (typeof c === 'string' ? c : Array.isArray(c) ? c.map(x => (x && x.text) || '').join('') : String(c || '')).trim() || '(La IA devolvió una respuesta vacía.)';
  return { text, prompt: Math.ceil(inChars / 4), completion: est(text), ms: performance.now() - t0, model };
}

/* ---------- desplazamiento suave con la ruedita (sin saltos bruscos) ---------- */
let ssOn = false;
const ssState = new WeakMap();
function canScroll(n, dy){
  if (!n || n.nodeType !== 1) return false;
  const st = ssState.get(n), top = st && st.raf ? st.target : n.scrollTop, max = n.scrollHeight - n.clientHeight;
  if (max < 2) return false;
  if (n !== document.scrollingElement && n !== document.documentElement && n !== document.body){ const oy = getComputedStyle(n).overflowY; if (!/auto|scroll|overlay/.test(oy)) return false; }
  return dy > 0 ? top < max - 1 : top > 1;
}
function ssAnimate(se, px){
  let st = ssState.get(se); if (!st){ st = { target:se.scrollTop, cur:se.scrollTop, raf:0, last:0 }; ssState.set(se, st); }
  const max = se.scrollHeight - se.clientHeight;
  if (!st.raf){ st.target = st.cur = se.scrollTop; se.style.scrollBehavior = 'auto'; }
  st.target = Math.max(0, Math.min(max, st.target + px));
  if (st.raf) return;
  const tick = now => {
    const dt = st.last ? Math.min(3, (now - st.last) / 16.67) : 1; st.last = now;
    st.cur += (st.target - st.cur) * (1 - Math.pow(1 - .14, dt));
    if (Math.abs(st.target - st.cur) < .6) st.cur = st.target;
    se.scrollTop = st.cur;
    if (st.cur !== st.target && Math.abs(se.scrollTop - st.cur) < 3) st.raf = requestAnimationFrame(tick); else { st.raf = 0; st.last = 0; se.style.scrollBehavior = ''; }
  };
  st.raf = requestAnimationFrame(tick);
}
function ssStop(n){ const st = n && ssState.get(n); if (st && st.raf){ cancelAnimationFrame(st.raf); st.raf = 0; st.last = 0; n.style.scrollBehavior = ''; st.target = st.cur = n.scrollTop; } }
function smoothWheel(){
  if (ssOn) return; ssOn = true;
  addEventListener('wheel', e => {
    if (!CFG.smooth || e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (e.deltaMode === 0 && Math.abs(e.deltaY) < 40) return;     /* touchpad: ya es suave */
    if (root.classList.contains('lock') && !(e.target.closest && e.target.closest('.szm,#tour,#blk,#acc,#sx,#conn,#thPop,#ptour,#svm'))) return;
    const dy = e.deltaY, px = e.deltaMode === 1 ? dy * 40 : e.deltaMode === 2 ? dy * innerHeight : dy;
    let n = e.target && e.target.nodeType === 1 ? e.target : e.target && e.target.parentElement;
    for (; n && n !== document.body && n !== document.documentElement; n = n.parentElement){
      if (/^(TEXTAREA|SELECT)$/.test(n.tagName) || n.dataset.nosmooth != null) return;
      if (canScroll(n, dy)){ e.preventDefault(); ssAnimate(n, px * 1.05); return; }
      if (/fixed/.test(getComputedStyle(n).position) && !n.closest('.ctxm')) { if (n.matches('.szm,#tour,#blk,#acc,#sx,#conn,#ptour,#svm')){ e.preventDefault(); return; } }
    }
    const se = document.scrollingElement || document.documentElement;
    if (canScroll(se, dy)){ e.preventDefault(); ssAnimate(se, px * 1.1); }
  }, { passive:false });
  addEventListener('scroll', ev => { const n = ev.target === document ? document.scrollingElement : ev.target; const st = n && ssState.get(n); if (st && !st.raf){ st.target = st.cur = n.scrollTop; } }, { passive:true, capture:true });
}
/* ---------- el fondo gira suave mientras bajas ---------- */
function orbitBg(src){
  const au = $('.aurora'); if (!au || !CFG.bg || $('.orbit', au)) return;
  const wrap = document.createElement('div'); wrap.className = 'orbit';
  [...au.querySelectorAll(':scope > i')].forEach(i => wrap.appendChild(i)); au.prepend(wrap);
  let q = 0;
  const upd = () => { q = 0; const se = src || document.scrollingElement || document.documentElement; const h = se.scrollHeight - se.clientHeight; au.style.setProperty('--sp', (h > 0 ? Math.min(1, se.scrollTop / h) : 0).toFixed(4)); };
  (src || window).addEventListener('scroll', () => { if (!q) q = requestAnimationFrame(upd); }, { passive:true });
  upd();
}
/* ---------- entrar a SynthZ: usuario y contraseña (y Google, si el servidor lo tiene activado) ---------- */
const isBlocked = e => !!(e && (e.error === 'popup_blocked' || e.code === 'popup_blocked'));
let gsiP = null, gsiDone = null;
function loadGsi(){ return gsiP || (gsiP = new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = () => ok(window.google); s.onerror = () => { gsiP = null; no(new Error('gsi')); }; document.head.appendChild(s); })); }
async function signedIn(d){
  setSess(d.token); ACC.user = d.user; ACC.profile = d.profile || null; ACC.ready = false;
  await accStart();
  toast(d.isNew ? '¡Bienvenido a SynthZ, ' + accName() + '!' : '¡Hola de nuevo, ' + accName() + '!');
}
async function onGoogle(resp){
  try{ const d = await api('auth', { method:'POST', body:{ credential:resp.credential } }); await signedIn(d); if (gsiDone) gsiDone(d.isNew ? 'new' : 'in'); }
  catch(e){ toast(e.message || 'No pude entrar. Intenta de nuevo.'); }
}
const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
function passStrength(p, u){
  if (!p) return 0; let s = Math.min(4, Math.floor(p.length / 4));
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^\w]/.test(p)) s++;
  if (p.length < 8 || (u && p.toLowerCase().includes(u))) s = Math.min(s, 1);
  if (/^(.)\1+$|^(12345678|password|contraseña|qwerty)/i.test(p)) s = 1;
  return Math.max(1, Math.min(4, Math.round(s * 4 / 7)));
}
/* muestra el código de recuperación y no deja seguir hasta que confirmes que lo guardaste */
function recoveryPanel(box, code, user, onOk, again){
  box.innerHTML = '<div class="rcv"><div class="rcico">🔑</div><h4>' + (again ? 'Tu nuevo código de recuperación' : 'Guarda tu código de recuperación') + '</h4>'
    + '<p>Si olvidas tu contraseña, este código es la <b>única</b> forma de volver a entrar. Solo lo verás esta vez.</p>'
    + '<div class="rccode" tabindex="0">' + esc(code) + '</div>'
    + '<div class="rcact"><button class="btn sm ghost" type="button" data-cp>Copiar</button><button class="btn sm ghost" type="button" data-dl>Descargar .txt</button></div>'
    + '<label class="rcchk"><input type="checkbox"> Ya lo guardé en un lugar seguro</label>'
    + '<button class="btn" type="button" data-go disabled>Continuar</button></div>';
  const go = $('[data-go]', box), chk = $('.rcchk input', box);
  chk.addEventListener('change', () => { go.disabled = !chk.checked; });
  $('[data-cp]', box).addEventListener('click', e => { (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => { e.target.textContent = '¡Copiado!'; }).catch(() => { const r = document.createRange(); r.selectNodeContents($('.rccode', box)); getSelection().removeAllRanges(); getSelection().addRange(r); toast('Selecciónalo y cópialo con Ctrl+C.'); }); });
  $('[data-dl]', box).addEventListener('click', () => {
    const txt = 'SynthZ · código de recuperación\r\n\r\nUsuario: @' + user + '\r\nCódigo: ' + code + '\r\n\r\nÚsalo en «¿Olvidaste tu contraseña?» si no recuerdas tu contraseña.\r\nNo se lo compartas a nadie.\r\n';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type:'text/plain' })); a.download = 'synthz-recuperacion-' + user + '.txt'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });
  go.addEventListener('click', onOk);
  box.animate([{ opacity:0, transform:'translateY(10px)', filter:'blur(6px)' }, { opacity:1, transform:'none', filter:'blur(0)' }], { duration:450, easing:'cubic-bezier(.22,1,.36,1)' });
}
function authBox(box, done, onBlocked){
  let mode = 'login';
  const say = h => { box.innerHTML = '<p class="gmsg">' + h + '</p>'; };
  box.innerHTML = '<div class="gbox"><span class="gload">Preparando…</span></div>';
  accConfig().then(ok => {
    if (!ok){ say(location.protocol === 'file:' ? 'Las cuentas funcionan cuando la página está publicada (por ejemplo en Vercel).' : 'Las cuentas de SynthZ aún no están activadas: falta conectar la base de datos en Vercel.' + (ACC.missing.length ? '<br><small>Faltan: ' + ACC.missing.map(esc).join(', ') + '</small>' : '')); return; }
    paint();
  });
  function paint(){
    const L = mode === 'login', N = mode === 'signup', R = mode === 'reset';
    box.innerHTML = '<div class="lbox">'
      + (R ? '<div class="ltop"><button class="lnk" type="button" data-back>← Volver</button><b>Recuperar tu cuenta</b></div>'
           : '<div class="lseg" role="tablist"><button type="button" role="tab" data-m="login" aria-selected="' + L + '">Entrar</button><button type="button" role="tab" data-m="signup" aria-selected="' + N + '">Crear cuenta</button><i></i></div>')
      + '<form class="lform" novalidate>'
      + '<label>Usuario<span class="lin"><span class="at">@</span><input name="user" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="21" placeholder="' + (N ? 'elige-uno' : 'tu usuario') + '" required></span></label>'
      + (N ? '<label>Tu nombre <small>(opcional)</small><span class="lin"><input name="name" autocomplete="nickname" maxlength="40" placeholder="Cómo quieres que te llamen"></span></label>' : '')
      + (R ? '<label>Código de recuperación<span class="lin"><input name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="24" placeholder="XXXX-XXXX-XXXX-XXXX" required></span></label>' : '')
      + '<label>' + (R ? 'Contraseña nueva' : 'Contraseña') + '<span class="lin"><input name="pass" type="password" autocomplete="' + (L ? 'current-password' : 'new-password') + '" maxlength="200" placeholder="' + (L ? 'Tu contraseña' : 'Mínimo 8 caracteres') + '" required><button class="eye" type="button" aria-label="Mostrar contraseña" aria-pressed="false">' + EYE + '</button></span></label>'
      + (L ? '' : '<div class="lstr" aria-hidden="true"><i></i><i></i><i></i><i></i><span></span></div>')
      + '<p class="lerr" role="alert"></p>'
      + '<button class="btn lgo" type="submit">' + (L ? 'Entrar' : N ? 'Crear mi cuenta' : 'Cambiar contraseña y entrar') + '</button>'
      + (L ? '<button class="lnk lforgot" type="button" data-forgot>¿Olvidaste tu contraseña?</button>' : '')
      + '</form>'
      + (ACC.google && !R ? '<div class="lor"><span>o</span></div><div class="gbtn" aria-live="polite"><span class="gload">Cargando Google…</span></div>' : '')
      + '<p class="cnote">' + (N ? 'No necesitas correo. Tu contraseña se guarda protegida (ni SynthZ puede leerla). Al crear la cuenta te damos un código para recuperarla.' : R ? 'Es el código que guardaste al crear tu cuenta. Al cambiar la contraseña se cierra tu sesión en los demás dispositivos.' : 'Tus chats, favoritos y SynXCoin\'s te siguen a cualquier dispositivo.') + '</p>'
      + '</div>';
    const f = $('.lform', box), err = $('.lerr', box), go = $('.lgo', box), uIn = f.elements.user, pIn = f.elements.pass;
    $$('[data-m]', box).forEach(b => b.addEventListener('click', () => { if (b.dataset.m !== mode){ const u = uIn.value; mode = b.dataset.m; paint(); $('.lform', box).elements.user.value = u; } }));
    const back = $('[data-back]', box); if (back) back.addEventListener('click', () => { const u = uIn.value; mode = 'login'; paint(); $('.lform', box).elements.user.value = u; });
    const fg = $('[data-forgot]', box); if (fg) fg.addEventListener('click', () => { const u = uIn.value; mode = 'reset'; paint(); $('.lform', box).elements.user.value = u; });
    $('.eye', box).addEventListener('click', e => { const on = pIn.type === 'password'; pIn.type = on ? 'text' : 'password'; e.currentTarget.setAttribute('aria-pressed', String(on)); e.currentTarget.setAttribute('aria-label', on ? 'Ocultar contraseña' : 'Mostrar contraseña'); });
    uIn.addEventListener('input', () => { const v = uIn.value.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_.]/g, ''); if (v !== uIn.value) uIn.value = v; err.textContent = ''; });
    const str = $('.lstr', box);
    if (str) pIn.addEventListener('input', () => { const s = passStrength(pIn.value, uIn.value), W = ['', 'Débil', 'Regular', 'Buena', 'Fuerte']; str.dataset.s = pIn.value ? s : 0; $('span', str).textContent = pIn.value ? W[s] : ''; err.textContent = ''; });
    f.addEventListener('submit', async e => {
      e.preventDefault(); err.textContent = '';
      const user = uIn.value.trim().replace(/^@/, '').toLowerCase(), pass = pIn.value;
      if (!/^[a-z0-9_.]{3,20}$/.test(user)){ err.textContent = 'Tu usuario debe tener de 3 a 20 letras, números, puntos o guiones bajos.'; uIn.focus(); return; }
      if (!L && pass.length < 8){ err.textContent = 'La contraseña debe tener al menos 8 caracteres.'; pIn.focus(); return; }
      if (!pass){ err.textContent = 'Escribe tu contraseña.'; pIn.focus(); return; }
      const bodyOut = { mode, user, pass };
      if (N) bodyOut.name = f.elements.name.value.trim();
      if (R){ bodyOut.code = f.elements.code.value.trim(); if (bodyOut.code.replace(/[^a-z0-9]/gi, '').length < 16){ err.textContent = 'El código tiene 16 letras y números.'; f.elements.code.focus(); return; } }
      go.disabled = true; const label = go.textContent; go.textContent = L ? 'Entrando…' : N ? 'Creando…' : 'Cambiando…';
      try{
        const d = await api('auth', { method:'POST', body:bodyOut, keep:true });
        const finish = async () => { await signedIn(d); if (done) done(d.isNew ? 'new' : 'in'); };
        if (d.recovery){ setSess(d.token); recoveryPanel(box, d.recovery, user, () => finish(), R); }
        else await finish();
      }catch(x){
        go.disabled = false; go.textContent = label;
        err.textContent = x.net ? 'No pude conectar con SynthZ. Revisa tu internet.' : (x.message || 'Algo falló. Intenta de nuevo.');
        box.querySelector('.lbox').animate([{ transform:'translateX(0)' }, { transform:'translateX(-7px)' }, { transform:'translateX(6px)' }, { transform:'translateX(-3px)' }, { transform:'none' }], { duration:380 });
      }
    });
    if (ACC.google && !R) googleBtn($('.gbtn', box), done, onBlocked);
  }
}
async function googleBtn(slot, done, onBlocked){
  try{ await loadGsi(); }catch(e){ slot.innerHTML = '<p class="gmsg">No pude cargar el botón de Google. Puedes entrar con usuario y contraseña.</p>'; if (onBlocked) onBlocked('script'); return; }
  gsiDone = done;
  google.accounts.id.initialize({ client_id:ACC.cid, callback:onGoogle, auto_select:false, cancel_on_tap_outside:true, context:'signin', itp_support:true });
  slot.innerHTML = '';
  google.accounts.id.renderButton(slot, { theme:'filled_black', size:'large', shape:'pill', text:'continue_with', logo_alignment:'left', locale:'es', width:Math.max(220, Math.min(340, (slot.clientWidth || 320) - 4)) });
}
/* ---------- seguridad: cambiar contraseña y código de recuperación nuevo ---------- */
function securityModal(){
  if ($('#secm')) return;
  const o = document.createElement('div'); o.id = 'secm'; o.className = 'szm';
  o.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Seguridad"><div class="word">' + zWord('Synth') + '</div><div class="tn">SEGURIDAD · @' + esc((ACC.user && ACC.user.username) || '') + '</div><div class="tb" id="secBox"></div><div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>Cerrar</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const box = $('#secBox', o);
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  $('[data-close]', o).addEventListener('click', close);
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  const paint = () => {
    box.innerHTML = '<h3>Tu contraseña</h3><form class="lform" novalidate>'
      + '<input name="user" autocomplete="username" value="' + esc((ACC.user && ACC.user.username) || '') + '" hidden>'
      + '<label>Contraseña actual<span class="lin"><input name="old" type="password" autocomplete="current-password" required></span></label>'
      + '<label>Contraseña nueva <small>(déjala vacía si solo quieres un código nuevo)</small><span class="lin"><input name="pass" type="password" autocomplete="new-password" maxlength="200"></span></label>'
      + '<p class="lerr" role="alert"></p>'
      + '<div class="aact"><button class="btn sm" type="submit" data-k="change">Cambiar contraseña</button><button class="btn sm ghost" type="button" data-k="code">Código de recuperación nuevo</button></div>'
      + '<p class="cnote">Cambiar la contraseña cierra tu sesión en los demás dispositivos. Un código nuevo invalida el anterior.</p></form>';
    const f = $('form', box), err = $('.lerr', box);
    const run = async k => {
      err.textContent = '';
      const old = f.elements.old.value, pass = f.elements.pass.value;
      if (!old){ err.textContent = 'Escribe tu contraseña actual.'; f.elements.old.focus(); return; }
      if (k === 'change' && pass.length < 8){ err.textContent = 'La contraseña nueva debe tener al menos 8 caracteres.'; f.elements.pass.focus(); return; }
      try{
        const d = await api('auth', { method:'POST', keep:true, body: k === 'change' ? { mode:'change', old, pass } : { mode:'code', pass:old } });
        if (k === 'change'){ setSess(d.token); toast('Contraseña cambiada. Cerramos tu sesión en los demás dispositivos.'); close(); }
        else recoveryPanel(box, d.recovery, (ACC.user && ACC.user.username) || '', () => { toast('Listo: el código anterior ya no sirve.'); close(); }, true);
      }catch(x){ err.textContent = x.message || 'Algo falló.'; }
    };
    f.addEventListener('submit', e => { e.preventDefault(); run('change'); });
    $('[data-k="code"]', box).addEventListener('click', () => run('code'));
  };
  paint();
}
/* ---------- configuración ---------- */
const lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
const miniPage = kind => '<div class="mp ' + kind + '"><i class="bl"></i><i class="bl"></i><i class="bl"></i><div class="gl"></div><div class="nv"><i></i><b></b><b></b><b></b></div><div class="h1"></div><div class="h2"></div><div class="cds"><b></b><b></b><b></b></div><span class="cu"></span><em>así se verá</em></div>';
function cfgChooser(box, cur, onPick){
  const paint = sel => {
    box.innerHTML = '<div class="cfgo"><button type="button" data-v="visual" aria-pressed="' + (sel === 'visual') + '"><b>Priorizar visuales</b><span>SynthZ-Style completo: vidrio, fondo vivo, cursor propio y animaciones.</span></button>'
      + '<button type="button" data-v="speed" aria-pressed="' + (sel === 'speed') + '">' + (lowEnd ? '<i class="rec">Recomendado</i>' : '') + '<b>Priorizar rendimiento</b><span>Para PCs modestos: sin desenfoques, fondo quieto y respuestas al instante.</span></button></div>'
      + miniPage(sel);
    $$('[data-v]', box).forEach(b => b.addEventListener('click', () => { paint(b.dataset.v); if (onPick) onPick(b.dataset.v); }));
  };
  paint(cur);
}
const CFG_ROWS = [['cursor', 'Cursor SynthZ', 'El cursor de vidrio con viento.'], ['smooth', 'Desplazamiento suave', 'La ruedita baja la página sin saltos.'], ['bg', 'Fondo animado', 'Los colores se mueven y giran al bajar.'], ['glass', 'Efecto vidrio', 'Desenfoques en ventanas y paneles.'], ['anim', 'Animaciones', 'Escritura letra por letra, golpe de cristal y agua.'], ['favAnim', 'Icono animado', 'El péndulo en el icono de la pestaña.']];
function cfgModal(){
  if ($('#cfgm')) return;
  const draft = Object.assign({}, CFG);
  const o = document.createElement('div'); o.id = 'cfgm'; o.className = 'szm';
  const row = ([k, t, s]) => '<div class="cfgrow"><p>' + t + '<small>' + s + '</small></p><button class="cfgsw" type="button" role="switch" data-k="' + k + '" aria-checked="' + !!draft[k] + '" aria-pressed="' + !!draft[k] + '" aria-label="' + t + '"></button></div>';
  const IN = [['always', 'Cada vez'], ['session', 'Una vez por sesión'], ['never', 'Nunca']];
  o.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Configuración"><div class="word">' + zWord('Synth') + '</div><div class="tn">CONFIGURACIÓN</div><div class="tb"><h3>Configuración</h3><p>Elige un punto de partida y ajusta cada detalle a tu gusto, también en modo rendimiento.</p></div>'
    + '<div class="cfglbl">Experiencia</div><div id="cfgCh"></div>'
    + '<div class="cfglbl">Detalles</div><div id="cfgRows">' + CFG_ROWS.map(row).join('') + '</div>'
    + '<div class="cfglbl">Intro de la página</div><div class="cfgseg" id="cfgIn">' + IN.map(([v, l]) => '<button type="button" data-in="' + v + '" aria-pressed="' + (draft.intro === v) + '">' + l + '</button>').join('') + '</div><p class="cnote">El portal hacia el chat siempre se muestra.</p>'
    + '<div class="tbtn" style="margin-top:18px"><button class="lnk" type="button" data-close>Cerrar</button><button class="btn sm" type="button" id="cfgOk">Guardar</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  $('.tcard', o).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:600, easing:'cubic-bezier(.22,1,.36,1)' });
  const paintRows = () => $$('.cfgsw', o).forEach(b => { b.setAttribute('aria-pressed', String(!!draft[b.dataset.k])); b.setAttribute('aria-checked', String(!!draft[b.dataset.k])); });
  cfgChooser($('#cfgCh', o), draft.perf, v => { draft.perf = v; Object.assign(draft, cfgPreset(v)); paintRows(); });
  $$('.cfgsw', o).forEach(b => b.addEventListener('click', () => { draft[b.dataset.k] = !draft[b.dataset.k]; paintRows(); }));
  $$('[data-in]', o).forEach(b => b.addEventListener('click', () => { draft.intro = b.dataset.in; $$('[data-in]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 450); };
  $('[data-close]', o).addEventListener('click', close);
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  $('#cfgOk', o).addEventListener('click', () => applyCfg(draft, close));
}
function applyCfg(draft, close){
  const reload = draft.anim !== CFG.anim || (draft.cursor && !document.getElementById('cd') && matchMedia('(pointer: fine)').matches) || (draft.bg && !!$('.aurora') && !$('.aurora .orbit'));
  Object.assign(CFG, draft, { v:2 }); saveCfg(); cfgClasses();
  if (CFG.favAnim && window.__favStart) window.__favStart();
  if (close) close();
  if (reload){ toast('Aplicando tu configuración…'); setTimeout(() => location.reload(), 900); }
  else toast('Configuración guardada.');
}
/* Esc cierra la ventana flotante que esté arriba */
addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const c = [...document.querySelectorAll('.szm [data-close], #blk #bClose, #acc #aClose, #sx #sxClose, #conn #cClose')].pop();
  if (c){ e.preventDefault(); c.click(); }
});

/* el péndulo del logo se frena con suavidad cuando lo señalas y vuelve a moverse al salir */
function calmMark(host, on){
  host.querySelectorAll('.mark .sw').forEach(g => {
    if (on){
      if (g._calm) return; g._calm = true;
      const tf = getComputedStyle(g).transform;
      g.style.animation = 'none';
      if (tf && tf !== 'none' && !reduce) g.animate([{ transform:tf }, { transform:'rotate(0deg)' }], { duration:700, easing:'cubic-bezier(.22,1,.36,1)' });
    } else if (g._calm){ g._calm = false; g.style.animation = ''; }
  });
}
document.addEventListener('pointerover', e => { const h = e.target.closest && e.target.closest('.logo, a, button'); if (h && h.querySelector('.mark .sw')) calmMark(h, true); });
document.addEventListener('pointerout', e => { const h = e.target.closest && e.target.closest('.logo, a, button'); if (h && !(e.relatedTarget && h.contains(e.relatedTarget)) && h.querySelector('.mark .sw')) calmMark(h, false); });

/* clic con el botón del medio: el cursor cambia al de desplazamiento automático */
if (document.getElementById('cm')){
  let midT = 0;
  const midOff = () => root.classList.remove('cursor-mid');
  addEventListener('pointerdown', e => { if (e.button === 1){ if (e.target.closest && e.target.closest('a')) return; root.classList.toggle('cursor-mid'); midT = performance.now(); } else midOff(); }, true);
  addEventListener('pointerup', e => { if (e.button === 1 && performance.now() - midT > 350) midOff(); }, true);
  addEventListener('keydown', midOff); addEventListener('blur', midOff); addEventListener('wheel', e => { if (!e.buttons) midOff(); }, { passive:true });
}

/* ---------- respuestas en vivo (streaming) ---------- */
let ridN = 0;
const newRid = () => DEV + ':' + Date.now().toString(36) + ':' + (++ridN);
async function askStream(p, messages, opts = {}, onDelta){
  const sig = opts.signal, t0 = performance.now(); let acc = '', ttft = 0, usage = null, fin = '', cut = '';
  const push = d => { if (!d) return; if (!ttft) ttft = performance.now() - t0; acc += d; if (onDelta) onDelta(acc); };
  const inChars = messages.reduce((n, m) => n + (typeof m.content === 'string' ? m.content.length : 200), 0);
  const done = aborted => {
    if (!acc && aborted) throw Object.assign(new Error('Detenido.'), { aborted:true });
    const text = acc.trim() || '(La IA devolvió una respuesta vacía.)';
    const prompt = usage && usage.prompt_tokens != null ? usage.prompt_tokens : Math.ceil(inChars / 4);
    const completion = usage && usage.completion_tokens != null ? usage.completion_tokens : est(text);
    return { text, prompt, completion, ms:performance.now() - t0, ttft, model:opts.model, aborted:!!aborted, est:!usage, finish:fin, cut, rid:newRid() };
  };
  const model0 = String(opts.model || state.model[p.id] || '');
  if (/^pu:/.test(model0)){
    if (!window.puter) throw new Error('No pude cargar Puter. Revisa tu internet o desactiva el bloqueador de anuncios para esta página.');
    if (!puter.auth.isSignedIn()) throw Object.assign(new Error('Conecta tu cuenta de Puter para usar este modelo.'), { needLogin:true });
    let resp;
    const stop = new Promise(res => { if (sig){ if (sig.aborted) res({ stop:true }); else sig.addEventListener('abort', () => res({ stop:true }), { once:true }); } });
    try{
      try{ resp = await Promise.race([puter.ai.chat(messages, Object.assign({ model:model0.replace(/^pu:/, ''), stream:true }, opts.maxTokens ? { max_tokens:opts.maxTokens } : {})), stop]); }
      catch(e){ if (/stream/i.test(errText(e))) return askPuter(messages, opts).then(r => { push(r.text); return Object.assign(r, { ttft:ttft || r.ms, est:true, rid:newRid() }); }); throw e; }
      if (resp && resp.stop) return done(true);
      if (!resp || typeof resp[Symbol.asyncIterator] !== 'function'){ const c = resp && resp.message ? resp.message.content : resp; push(typeof c === 'string' ? c : String(c || '')); return done(false); }
      const it = resp[Symbol.asyncIterator]();
      while (true){
        const n = await Promise.race([it.next(), stop]);
        if (n.stop) return done(true);
        if (n.done) break;
        const part = n.value || {};
        if (part.type === 'error'){ if (acc){ cut = part.message || 'error'; return done(false); } throw new Error('Puter: ' + (part.message || 'el modelo falló a mitad de la respuesta.')); }
        if (part.finish_reason) fin = part.finish_reason;
        if (part.usage) usage = { prompt_tokens:part.usage.input_tokens ?? part.usage.prompt_tokens, completion_tokens:part.usage.output_tokens ?? part.usage.completion_tokens };
        if ((!part.type || part.type === 'text') && typeof part.text === 'string') push(part.text);
      }
    }catch(e){
      if (e && e.aborted) throw e;
      const m = errText(e), code = String((e && (e.code || (e.error && e.error.code))) || '') + ' ' + m;
      if (/insufficient_funds|402/i.test(code)) throw Object.assign(new Error('Se acabaron tus créditos gratis de Puter. Se renuevan cada mes (también puedes comprar créditos en puter.com). Mientras tanto, usa un modelo de OpenRouter.'), { switchTo:'or', limit:true });
      if (/too_many_requests|429/i.test(code)) throw Object.assign(new Error('Puter te pidió ir más despacio: máximo 30 mensajes cada 10 segundos y 3 a la vez. Espera unos segundos.'), { limit:true });
      if (/auth|token|sign.?in|login|401|403/i.test(m)) throw Object.assign(new Error('Tu sesión de Puter expiró. Conéctala otra vez.'), { needLogin:true });
      if (acc) return done(false);
      throw new Error('Puter: ' + (m || 'no pudo responder con este modelo. Prueba con otro.'));
    }
    return done(false);
  }
  if (p.kind !== 'openai'){ const r = await ask(p, messages, opts); push(r.text); return Object.assign(r, { ttft:r.ms, rid:newRid() }); }
  const viaTeam = p.id === 'openrouter' && !state.keys.openrouter && !!state.useTeam && !!SESS;
  const key = state.keys[p.id];
  if (!key && !viaTeam) throw new Error('Falta la llave de ' + p.name + '.');
  const body = { model:model0.replace(/^or:/, ''), messages, stream:true, usage:{ include:true } };
  if (viaTeam) body.teamId = state.useTeam;
  if (opts.maxTokens) body.max_tokens = opts.maxTokens;
  const ctl = new AbortController(); let idle = 0;
  const bump = () => { clearTimeout(idle); idle = setTimeout(() => ctl.abort(), 70000); };
  if (sig){ if (sig.aborted) ctl.abort(); else sig.addEventListener('abort', () => ctl.abort(), { once:true }); }
  let res; bump();
  try{ res = viaTeam ? await fetch('/api/chat', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + SESS }, body:JSON.stringify(body), signal:ctl.signal })
                     : await fetch(p.url + '/chat/completions', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + key }, body:JSON.stringify(body), signal:ctl.signal }); }
  catch(e){ clearTimeout(idle); if (sig && sig.aborted) throw Object.assign(new Error('Detenido.'), { aborted:true }); throw new Error(e && e.name === 'AbortError' ? p.name + ' tardó demasiado en responder. Intenta de nuevo.' : netMsg(p)); }
  if (!res.ok){ clearTimeout(idle); const data = await res.json().catch(() => ({})); if (viaTeam && typeof data.error === 'string') throw Object.assign(new Error('Equipo: ' + data.error), { status:res.status, switchTo:res.status === 429 ? 'pu' : null }); throw Object.assign(new Error(friendly(res.status, data, p)), { status:res.status, switchTo: p.id === 'openrouter' && (res.status === 429 || res.status === 402) ? 'pu' : null }); }
  if (!/event-stream/.test(res.headers.get('content-type') || '') || !res.body){
    clearTimeout(idle); const data = await res.json().catch(() => ({}));
    if (data && data.error) throw new Error(friendly(+data.error.code || 502, data, p));
    push((((data.choices || [])[0] || {}).message || {}).content || ''); usage = data.usage || null; return done(false);
  }
  const rd = res.body.getReader(), dec = new TextDecoder(); let buf = '';
  try{
    while (true){
      const { value, done:end } = await rd.read(); if (end) break; bump();
      buf += dec.decode(value, { stream:true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0){
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line.startsWith('data:')) continue;
        const d = line.slice(5).trim(); if (d === '[DONE]') continue;
        let j; try{ j = JSON.parse(d); }catch(e){ continue; }
        if (j.error){ if (acc){ cut = String(j.error.message || 'error'); return done(false); } throw new Error(friendly(+j.error.code || 502, j, p)); }
        if (j.usage) usage = j.usage;
        const ch = (j.choices || [])[0]; if (ch && ch.delta && typeof ch.delta.content === 'string') push(ch.delta.content);
        if (ch && ch.finish_reason) fin = ch.finish_reason;
      }
    }
  }catch(e){
    clearTimeout(idle);
    if (sig && sig.aborted) return done(true);
    if (acc){ cut = (e && e.message) || 'conexión'; return done(false); }
    if (e && e.name === 'AbortError') throw new Error(p.name + ' dejó de responder. Intenta de nuevo.');
    throw e;
  }
  clearTimeout(idle);
  return done(false);
}
/* muestra el texto que llega con un ritmo suave de escritura; Detener lo completa al instante */
const reveals = new Set();
function mkReveal(body, onPaint){
  let full = '', shown = 0, raf = 0, ended = false, skip = false, endRes; const fin = new Promise(r => { endRes = r; });
  const R = {
    push(t){ full = t; if (!raf) raf = requestAnimationFrame(frame); },
    end(){ ended = true; if (!raf){ if (shown >= full.length){ reveals.delete(R); endRes(); } else raf = requestAnimationFrame(frame); } return fin; },
    skip(){ skip = true; if (!raf) raf = requestAnimationFrame(frame); },
    get full(){ return full; }
  };
  reveals.add(R);
  let lastPaint = 0, painted = -1;
  function frame(now){
    raf = 0;
    if (!skip && !ended && now - lastPaint < 33){ raf = requestAnimationFrame(frame); return; }
    lastPaint = now || performance.now();
    const back = full.length - shown;
    shown = skip || reduce ? full.length : Math.min(full.length, shown + Math.max(3, Math.ceil(back / 6)));
    if (shown === painted && !(ended && shown >= full.length)){ if (shown < full.length) raf = requestAnimationFrame(frame); return; }
    painted = shown;
    body.innerHTML = md(full.slice(0, shown));
    if (!(ended && shown >= full.length)){ const last = body.lastElementChild; (last && !/^(PRE|UL|OL|TABLE)$/.test(last.tagName) ? last : body).insertAdjacentHTML('beforeend', '<i class="scaret"></i>'); }
    if (onPaint) onPaint(shown, full.length);
    if (shown < full.length) raf = requestAnimationFrame(frame);
    else if (ended){ reveals.delete(R); endRes(); }
  }
  return R;
}
/* ---------- guardado robusto: un registro por conversación en IndexedDB ---------- */
const IDB = { db:null, ready:false };
const idbHash = {}; let idbT = 0;
function idbOpen(){ return new Promise(res => { try{ const r = indexedDB.open('synthz', 1); r.onupgradeneeded = () => { try{ r.result.createObjectStore('chats'); }catch(e){} }; r.onsuccess = () => { IDB.db = r.result; res(true); }; r.onerror = () => res(false); r.onblocked = () => res(false); }catch(e){ res(false); } }); }
function idbAll(){ return new Promise(res => { const out = {}; try{ const req = IDB.db.transaction('chats').objectStore('chats').openCursor(); req.onsuccess = () => { const c = req.result; if (c){ out[c.key] = c.value; c.continue(); } else res(out); }; req.onerror = () => res(out); }catch(e){ res(out); } }); }
function idbFlush(){
  if (!IDB.ready) return;
  try{
    const tx = IDB.db.transaction('chats', 'readwrite'), os = tx.objectStore('chats');
    Object.keys(state.chats).forEach(k => { const a = state.chats[k]; if (!Array.isArray(a)) return; const L = a[a.length - 1], h = a.length + ':' + (L ? (L.content || '').length + ':' + hashS(String(L.content || '').slice(-200)) + ':' + (L.meta || '') : ''); if (idbHash[k] !== h){ if (a.length) os.put(a, k); else os.delete(k); idbHash[k] = h; } });
    Object.keys(idbHash).forEach(k => { if (!(k in state.chats)){ os.delete(k); delete idbHash[k]; } });
    tx.onerror = () => toast('No pude guardar tus chats: el almacenamiento del navegador está lleno. Exporta o borra conversaciones viejas.');
  }catch(e){}
}
const chatsReady = idbOpen().then(async ok => {
  if (!ok) return false;
  const stored = await idbAll();
  Object.keys(stored).forEach(k => { const a = stored[k]; if (Array.isArray(a) && (!Array.isArray(state.chats[k]) || a.length >= state.chats[k].length)) state.chats[k] = a; });
  state.chats = cleanChats(state.chats);
  IDB.ready = true; idbFlush();
  try{ localStorage.setItem(KEY, JSON.stringify(Object.assign({}, state, { chats:{}, ledger:undefined, usage:undefined }))); }catch(e){}
  try{ if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}
  try{ hooks.chats(); }catch(e){}
  return true;
});
/* ---------- consumo por proveedor ---------- */
const provOf = id => /^pu:/.test(String(id)) ? 'puter' : 'openrouter';
const totalAll = () => Object.keys(state.usage || {}).reduce((a, k) => a + total(k), 0);
const estAll = () => Object.keys(state.usage || {}).reduce((a, k) => a + ((state.usage[k] || {}).est || 0), 0);
const todayEst = () => { const d = today(); return Object.keys(state.usage || {}).reduce((a, k) => a + (((state.usage[k] || {}).estDays || {})[d] || 0), 0); };
const todayReq = (pid, freeOnly) => { const u = (state.usage || {})[pid] || {}; return ((freeOnly ? u.freeDays : u.reqDays) || {})[today()] || 0; };
const todayAll = () => { const d = today(); return Object.keys(state.usage || {}).reduce((a, k) => a + (((state.usage[k] || {}).days || {})[d] || 0), 0); };
/* ---------- SynXCoin's: lo disponible según cada proveedor + desglose honesto del consumo ---------- */
let balC = null, balT = 0;
async function providerBalance(force){
  if (!force && balC && Date.now() - balT < 60000) return balC;
  const out = {};
  const jobs = [];
  if (window.puter && puter.auth && typeof puter.auth.isSignedIn === 'function' && puter.auth.isSignedIn() && typeof puter.auth.getMonthlyUsage === 'function')
    jobs.push(puter.auth.getMonthlyUsage().then(u => { const a = u && u.allowanceInfo; out.puter = a && +a.monthUsageAllowance > 0 ? { pct:Math.max(0, Math.min(1, +a.remaining / +a.monthUsageAllowance)) } : { na:true }; }).catch(() => { out.puter = { err:true }; }));
  const k = state.keys.openrouter;
  if (k) jobs.push(fetch('https://openrouter.ai/api/v1/key', { headers:{ Authorization:'Bearer ' + k } }).then(async r => {
    if (!r.ok){ out.openrouter = { err:r.status }; return; }
    const d = ((await r.json()) || {}).data || {};
    out.openrouter = { freeTier:!!d.is_free_tier, limit:d.limit == null ? null : +d.limit, left:d.limit_remaining == null ? null : +d.limit_remaining };
  }).catch(() => { out.openrouter = { err:true }; }));
  await Promise.all(jobs);
  balC = out; balT = Date.now();
  return out;
}
/* bloque «Disponible»: solo datos que da el proveedor; lo que no se sabe, se dice */
function balanceHtml(b, extra){
  const row = (ico, name, main, sub) => '<div class="bl-row">' + ico + '<div><b>' + name + '</b><span>' + main + '</span>' + (sub ? '<small>' + sub + '</small>' : '') + '</div></div>';
  let h = '';
  const pu = b.puter;
  h += row(puterLogo(), 'Puter', pu && pu.pct != null ? 'Te queda <em>' + Math.round(pu.pct * 100) + '%</em> de tu crédito gratis de este mes' : pu && pu.err ? 'Puter no respondió con tu saldo. Intenta más tarde.' : window.puter && puter.auth && puter.auth.isSignedIn && puter.auth.isSignedIn() ? 'Puter no informó tu saldo.' : 'Conecta Puter para ver tu saldo.', 'Dato de Puter · se renueva cada mes');
  const or = b.openrouter, fr = todayReq('openrouter', true);
  const orMain = or && !or.err
    ? 'Modelos gratis: <em>' + fmt(fr) + '</em> de ' + (or.freeTier ? '50' : '50 (o 1.000 si compraste 10 créditos o más)') + ' mensajes hoy'
    : or && or.err === 401 ? 'OpenRouter dice que tu llave no es válida.' : or && or.err ? 'OpenRouter no respondió con tu saldo.' : state.useTeam ? 'Usas el OpenRouter de tu equipo (mira el límite abajo).' : 'Pega tu llave de OpenRouter para ver tus límites.';
  const orSub = or && !or.err ? (or.limit != null && or.left != null ? 'Crédito de tu llave: quedan $' + or.left.toFixed(2) + ' de $' + or.limit.toFixed(2) + ' · ' : 'Tu llave no tiene tope de crédito · ') + 'los mensajes de hoy los cuenta SynthZ en tus dispositivos' : '';
  h += row('<span class="bl-ico or">OR</span>', 'OpenRouter', orMain, orSub);
  if (extra) h += extra;
  return '<div class="bl">' + h + '</div>';
}
/* desglose: confirmado (lo reportó el proveedor) vs estimado (≈, SynthZ lo calculó por el largo del texto) */
function splitHtml(){
  const tot = totalAll(), e = estAll(), d = today(), tdy = todayAll(), te = todayEst();
  return '<div class="sxsplit">'
    + '<div><b>' + fmt(tot - e) + '</b><span>confirmados</span><small>los reportó el proveedor</small></div>'
    + '<div><b>≈ ' + fmt(e) + '</b><span>estimados</span><small>el proveedor no dio el número</small></div>'
    + '<div><b>' + fmt(tdy) + '</b><span>hoy</span><small>' + (te ? '≈ ' + fmt(te) + ' estimados' : 'todos confirmados') + '</small></div></div>';
}
function syncNote(){
  if (!ACC.ready) return '<p class="cnote">Se guardan en este navegador. Entra a tu cuenta para sumarlos entre tus dispositivos.</p>';
  if (ACC.err) return '<p class="sxerr">⚠ No pude sincronizar tus SynXCoin\'s (' + esc(ACC.err) + '). Siguen guardados aquí y se suben solos cuando vuelva la conexión.</p>';
  return '<p class="cnote">Sumados entre todos tus dispositivos' + (ACC.t ? ' · sincronizado hace ' + Math.max(1, Math.round((Date.now() - ACC.t) / 1000)) + ' s' : '') + '.</p>';
}

/* ---------- guía breve: panel lateral que no tapa la conversación; se abre con el botón «?» ---------- */
function helpGuide(opts){
  opts = opts || {};
  const old = $('#szHelp'); if (old){ old.classList.remove('on'); setTimeout(() => old.remove(), 380); return; }
  const back = document.activeElement;
  const S = [
    ['¿Qué es SynthZ?', 'Tu espacio para explorar la IA: hablas con cientos de modelos gratis (de Puter y OpenRouter), los comparas y ves cuánto gastas. Todo desde un solo lugar.'],
    ['Cómo usar SynthFlow', 'SynthFlow es la conversación. Escribe abajo y pulsa Enter (Mayús + Enter para otra línea). Si no sabes qué pedir, toca un ejemplo: se escribe en la caja y tú decides cuándo enviarlo. «Otra vez» pide una respuesta nueva y «Chats» guarda cada conversación aparte.'],
    ['Cómo elegir un modelo', 'En «¿Qué quieres hacer?» eliges Rápido, Programar, Estudiar o Tareas complejas y te sugiero uno, diciendo de dónde sale cada dato. También puedes elegir a mano en la lista, con filtros, y en «Comparar» preguntarle lo mismo a hasta 4.'],
    ['Archivos', 'Con el clip 📎 adjuntas hasta 6 archivos por mensaje. Los PDF y archivos de texto se leen como texto; las imágenes solo las ven los modelos con «Visión».'],
    ['SynXCoin\'s', '1 SynXCoin = 1 token, lo que la IA lee y escribe. Los «confirmados» los reporta el proveedor; los «≈ estimados» los calcula SynthZ cuando el proveedor no da el número. No son dinero: tu saldo real lo da cada proveedor y lo ves en el panel de SynXCoin\'s.'],
    ['Configuración', 'El botón de ajustes (las dos barritas) cambia entre «Priorizar visuales» y «Priorizar rendimiento», y enciende o apaga cada detalle: cursor, fondo, vidrio, animaciones e intro.']
  ];
  const o = document.createElement('aside'); o.id = 'szHelp'; o.setAttribute('aria-label', 'Guía rápida de SynthZ');
  o.innerHTML = '<div class="hh"><b>Guía rápida</b><button type="button" class="hx" data-hclose aria-label="Cerrar la guía">✕</button></div>'
    + '<div class="hb">' + S.map(([q, a], i) => '<details' + (i === (opts.open || 0) ? ' open' : '') + '><summary>' + q + '</summary><p>' + a + '</p></details>').join('')
    + (opts.extra ? '<div class="hx2">' + opts.extra.map(([l], i) => '<button type="button" class="btn sm ghost" data-hx="' + i + '">' + l + '</button>').join('') + '</div>' : '')
    + '<p class="cnote">Puedes volver a abrir esta guía cuando quieras con el botón «?».</p></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 380); document.removeEventListener('keydown', key, true); if (back && back.focus) try{ back.focus(); }catch(e){} };
  const key = e => { if (e.key === 'Escape' && !document.querySelector('.szm')){ e.stopPropagation(); close(); } };
  document.addEventListener('keydown', key, true);
  $('[data-hclose]', o).addEventListener('click', close);
  $$('[data-hx]', o).forEach(b => b.addEventListener('click', () => { close(); opts.extra[+b.dataset.hx][1](); }));
  setTimeout(() => { const s = $('summary', o); if (s) s.focus(); }, 60);
}

/* ---------- confirmación con vidrio (en vez del confirm() del navegador) ---------- */
function szConfirm(title, text, ok, danger){
  return new Promise(res => {
    const o = document.createElement('div'); o.className = 'szm szc';
    o.innerHTML = '<div class="tcard" role="alertdialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="word">' + zWord('Synth') + '</div><div class="tb"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p></div><div class="tbtn" style="margin-top:16px"><button class="lnk" type="button" data-close>Cancelar</button><button class="btn sm' + (danger ? ' warn' : '') + '" type="button" data-ok>' + esc(ok || 'Aceptar') + '</button></div></div>';
    document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
    const back = document.activeElement; let gone = false;
    const out = v => { if (gone) return; gone = true; removeEventListener('keydown', key, true); o.classList.remove('on'); setTimeout(() => o.remove(), 400); try{ if (back && back.focus) back.focus(); }catch(e){} res(v); };
    const key = e => { if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); out(false); } else if (e.key === 'Tab'){ const f = [...o.querySelectorAll('button')]; const i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus(); } };
    addEventListener('keydown', key, true);
    $('[data-close]', o).addEventListener('click', () => out(false));
    $('[data-ok]', o).addEventListener('click', () => out(true));
    o.addEventListener('pointerdown', e => { if (e.target === o) out(false); });
    setTimeout(() => { const b = $(danger ? '[data-close]' : '[data-ok]', o); if (b) b.focus(); }, 50);
  });
}

/* ---------- en qué es experta cada IA (con lo que dice el catálogo y su nombre) ---------- */
const EXP = [
  ['code', 'código', /coder|code|codestral|devstral|starcoder|qwen.?3.*coder|deepseek.?(v3|v4|coder)|claude|gpt-?5|kimi|glm|grok.*code/i],
  ['reason', 'razonar paso a paso', /r1\b|reason|think|qwq|\bo[134]\b|o[34]-|gpt-oss|apodex|magistral|sonar-reasoning|deepseek-r/i],
  ['write', 'escribir y redactar', /claude|mistral|hermes|llama|gpt-?[45]|gemini.*pro|kimi|nova|command|gemma|writer|palmyra/i],
  ['fast', 'respuestas rápidas', /mini|nano|flash|lite|small|haiku|\b[1-9]b\b|instant|fast|mercury|tiny/i],
  ['vision', 'ver imágenes y PDF', null],
  ['long', 'textos muy largos', null],
  ['lang', 'español y otros idiomas', /qwen|aya|mistral|gemma|glm|deepseek|llama-4|gemini|command-a/i],
  ['math', 'matemáticas', /math|qwq|deepseek-r|\bo4\b|minerva|mathstral/i]
];
const EXP_LABEL = Object.fromEntries(EXP.map(([k, l]) => [k, l]));
function expertOf(m){
  if (!m) return { tags:[], line:'' };
  const hay = (m.id + ' ' + m.name + ' ' + (m.desc || '')).toLowerCase(), tags = [];
  EXP.forEach(([k, , re]) => {
    if (k === 'vision' ? m.vision : k === 'long' ? m.ctx >= 200000 : k === 'reason' ? (m.reasoning || re.test(hay)) : re.test(hay)) tags.push(k);
  });
  if (!tags.length) return { tags, line:'Uso general' };          /* sin datos de especialidad: no inventamos una */
  const order = ['code', 'reason', 'vision', 'math', 'write', 'long', 'fast', 'lang'];
  tags.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const top = tags.slice(0, 2).map(k => EXP_LABEL[k]);
  return { tags, line:'Experta en ' + (top.length > 1 ? top[0] + ' y ' + top[1] : top[0]) };
}
/* ---------- encuesta: elige las IA que mejor te sirven ---------- */
const SURVEY = [
  { k:'uses', q:'¿Para qué vas a usar SynthZ?', sub:'Elige todas las que quieras.', multi:true, o:[['code', '💻', 'Programar'], ['write', '✍️', 'Escribir y redactar'], ['study', '📚', 'Estudiar y tareas'], ['ideas', '💡', 'Ideas y trabajo'], ['vision', '🖼️', 'Imágenes y PDF'], ['chat', '💬', 'Charlar']] },
  { k:'pace', q:'¿Qué prefieres?', o:[['fast', '⚡', 'Respuestas al instante'], ['mid', '⚖️', 'Equilibrio'], ['deep', '🧠', 'Que piense bien antes']] },
  { k:'lang', q:'¿En qué idioma vas a hablar más?', o:[['es', '🇨🇴', 'Español'], ['en', '🇺🇸', 'Inglés'], ['both', '🌎', 'Los dos']] },
  { k:'key', q:'¿Tienes llave de OpenRouter?', sub:'Si no sabes qué es, elige «No»: empiezas con Puter y te explico después.', o:[['yes', '🔑', 'Sí, ya tengo'], ['no', '🙅', 'No'], ['team', '👥', 'Mi equipo me comparte']] }
];
function surveyScore(m, s){
  if (!s || !s.a) return 0;
  const a = s.a, ex = expertOf(m).tags, has = k => ex.includes(k);
  let sc = 0;
  (a.uses || []).forEach(u => { if (u === 'code' && has('code')) sc += 30; if (u === 'write' && has('write')) sc += 18; if (u === 'study' && (has('reason') || has('long'))) sc += 14; if (u === 'ideas' && (has('write') || has('reason'))) sc += 10; if (u === 'vision' && has('vision')) sc += 30; if (u === 'chat' && (has('fast') || has('write'))) sc += 10; });
  if (a.pace === 'fast' && has('fast')) sc += 22; if (a.pace === 'fast' && has('reason')) sc -= 6;
  if (a.pace === 'deep' && has('reason')) sc += 22; if (a.pace === 'deep' && has('fast')) sc -= 8;
  if ((a.lang === 'es' || a.lang === 'both') && has('lang')) sc += 8;
  if (a.key === 'no' && !/^pu:/.test(m.id)) sc -= 60;
  if (/apodex|gpt-5\.6-luna/i.test(m.id)) sc += 6;
  return sc;
}
function surveyPicks(list, s, n){ if (!s || !s.a || !list.length) return []; return list.filter(m => m.free || /^pu:/.test(m.id)).map(m => [m, surveyScore(m, s)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, n || 6).map(x => x[0].id); }
function surveyModal(done, opts){
  opts = opts || {};
  if ($('#svm')) return;
  const ans = Object.assign({ uses:[] }, (state.survey && state.survey.a) || {});
  let i = 0;
  const o = document.createElement('div'); o.id = 'svm'; o.className = 'szm';
  o.innerHTML = '<div class="tcard sv" role="dialog" aria-modal="true" aria-label="Encuesta"><div class="word">' + zWord('Synth') + '</div><div class="tn"></div><div class="tb"><h3></h3><p class="svsub"></p><div class="svo"></div></div><div class="tdots">' + SURVEY.map(() => '<i></i>').join('') + '</div><div class="tbtn"><button class="lnk" type="button" data-skip>' + (opts.first ? 'Ahora no' : 'Cerrar') + '</button><span style="flex:1"></span><button class="lnk" type="button" data-back>Atrás</button><button class="btn sm" type="button" data-next>Siguiente</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const card = $('.tcard', o);
  card.animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:650, easing:'cubic-bezier(.22,1,.36,1)' });
  const show = anim => {
    const s = SURVEY[i], last = i === SURVEY.length - 1;
    const set = () => {
      $('.tn', card).textContent = 'TUS IA · ' + (i + 1) + ' / ' + SURVEY.length;
      $('h3', card).textContent = s.q; $('.svsub', card).textContent = s.sub || ''; $('.svsub', card).style.display = s.sub ? '' : 'none';
      $('.svo', card).innerHTML = s.o.map(([v, e, l]) => { const on = s.multi ? (ans[s.k] || []).includes(v) : ans[s.k] === v; return '<button type="button" class="svb" data-v="' + v + '" aria-pressed="' + on + '"><span class="e">' + e + '</span><span>' + l + '</span></button>'; }).join('');
      $$('.tdots i', card).forEach((d, k) => d.classList.toggle('on', k === i));
      $('[data-back]', card).style.visibility = i ? 'visible' : 'hidden';
      $('[data-next]', card).textContent = last ? 'Ver mis IA' : 'Siguiente';
    };
    if (!anim){ set(); return; }
    const b = $('.tb', card);
    b.animate([{ opacity:1, filter:'blur(0)' }, { opacity:0, filter:'blur(8px)', transform:'translateY(-10px)' }], { duration:200, fill:'forwards' }).onfinish = () => { set(); b.animate([{ opacity:0, filter:'blur(8px)', transform:'translateY(12px)' }, { opacity:1, filter:'blur(0)', transform:'none' }], { duration:380, easing:'cubic-bezier(.22,1,.36,1)', fill:'forwards' }); };
  };
  $('.svo', card).addEventListener('click', e => {
    const b = e.target.closest('.svb'); if (!b) return; const s = SURVEY[i], v = b.dataset.v;
    if (s.multi){ const L = ans[s.k] || (ans[s.k] = []); const j = L.indexOf(v); if (j > -1) L.splice(j, 1); else L.push(v); b.setAttribute('aria-pressed', String(j < 0)); }
    else { ans[s.k] = v; $$('.svb', card).forEach(x => x.setAttribute('aria-pressed', String(x === b))); setTimeout(() => { if (i < SURVEY.length - 1){ i++; show(true); } }, 260); }
  });
  const close = saved => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); if (done) done(saved); };
  $('[data-skip]', card).addEventListener('click', () => close(false));
  $('[data-back]', card).addEventListener('click', () => { if (i > 0){ i--; show(true); } });
  $('[data-next]', card).addEventListener('click', () => {
    if (i < SURVEY.length - 1){ i++; show(true); return; }
    state.survey = { a:ans, t:Date.now() }; save(); toast('¡Listo! Ya sé qué IA te van a servir más.'); close(true);
  });
  show(false);
}
/* ---------- guía: cómo conseguir y pegar tu llave de OpenRouter ---------- */
function orGuide(onKey){
  if ($('#org')) return;
  const o = document.createElement('div'); o.id = 'org'; o.className = 'szm';
  const step = (n, t, d, art) => '<div class="ogs"><i class="ogn">' + n + '</i><div><b>' + t + '</b><p>' + d + '</p>' + (art || '') + '</div></div>';
  o.innerHTML = '<div class="tcard og" role="dialog" aria-modal="true" aria-label="Cómo conectar OpenRouter"><div class="word">' + zWord('Synth') + '</div><div class="tn">OPENROUTER · 3 MINUTOS</div><div class="tb"><h3>Desbloquea OpenRouter</h3><p>OpenRouter te da cientos de IA gratis con una llave personal. Así la consigues:</p></div>'
    + step(1, 'Crea tu cuenta gratis', 'Entra a openrouter.ai y regístrate (puedes usar Google).', '<a class="lnk" href="https://openrouter.ai" target="_blank" rel="noopener noreferrer">Abrir openrouter.ai ↗</a>')
    + step(2, 'Crea una llave', 'Ve a <b>Keys</b> y pulsa <b>Create Key</b>. Ponle de nombre «SynthZ» y, si quieres, un límite de crédito de 0.', '<div class="ogk"><span>Keys</span><span class="pr">+ Create Key</span></div>')
    + step(3, 'Cópiala y pégala aquí', 'Empieza por <code>sk-or-</code>. Solo se muestra una vez, guárdala.', '<div class="cbox"><input id="ogKey" type="password" placeholder="sk-or-…" autocomplete="off" spellcheck="false"><button class="btn sm" id="ogGo" type="button">Conectar</button></div>')
    + '<p class="cnote">Tu llave se guarda en este navegador y solo viaja a OpenRouter. ¿No quieres crear una? Pídele a alguien de tu equipo que te comparta su OpenRouter desde «Tu cuenta».</p>'
    + '<div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>Ahora no</button><a class="btn sm ghost" href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">Ir a mis llaves ↗</a></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  $('.tcard', o).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:650, easing:'cubic-bezier(.22,1,.36,1)' });
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  $('[data-close]', o).addEventListener('click', close);
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  const go = async () => {
    const k = $('#ogKey', o).value.trim(), b = $('#ogGo', o);
    if (!/^sk-or-/.test(k)){ toast('La llave empieza por sk-or-. Revisa que la copiaste completa.'); return; }
    const prev = state.keys.openrouter; state.keys.openrouter = k; b.textContent = 'Verificando…'; b.disabled = true;
    try{ await verify(byId('openrouter')); save(); close(); toast('¡OpenRouter desbloqueado!'); if (onKey) onKey(); }
    catch(e){ if (prev) state.keys.openrouter = prev; else delete state.keys.openrouter; save(); b.textContent = 'Conectar'; b.disabled = false; toast(e.message || 'No pude verificar la llave.'); }
  };
  $('#ogGo', o).addEventListener('click', go);
  $('#ogKey', o).addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); go(); } });
}
/* ---------- perfil personalizado ---------- */
const EMOJIS = ['✨', '🚀', '🦊', '🐼', '🌙', '🔥', '🎧', '🎮', '🌸', '🧠', '⚡', '🐉', '🍀', '🎨', '🛸', '👾'];
function profileModal(onSave){
  if ($('#pfm') || !ACC.ready) return;
  const u = ACC.user || {}, p0 = ACC.profile || {};
  const d = { name:p0.name || u.name || '', bio:p0.bio || '', pronouns:p0.pronouns || '', status:p0.status || '', color:p0.color || 'aurora', banner:p0.banner || p0.color || 'aurora', avatar:p0.avatar || { type:u.picture ? 'google' : 'initial' } };
  const o = document.createElement('div'); o.id = 'pfm'; o.className = 'szm';
  o.innerHTML = '<div class="tcard pf" role="dialog" aria-modal="true" aria-label="Editar perfil"><div class="pfprev"></div>'
    + '<div class="pfgrid"><label>Nombre<input id="pfName" maxlength="40"></label><label>Pronombres<input id="pfPro" maxlength="20" placeholder="opcional"></label></div>'
    + '<label class="pfl">Estado<input id="pfSt" maxlength="60" placeholder="Ej: aprendiendo a programar 🧑‍💻"></label>'
    + '<label class="pfl">Sobre ti<textarea id="pfBio" maxlength="160" rows="2" placeholder="Algo corto sobre ti"></textarea></label>'
    + '<div class="cfglbl">Foto</div><div class="pfav">' + (u.picture ? '<button type="button" data-av="google">Mi foto de Google</button>' : '') + '<button type="button" data-av="initial">Mi inicial</button></div><div class="pfemo">' + EMOJIS.map(e => '<button type="button" data-emo="' + e + '">' + e + '</button>').join('') + '</div>'
    + '<div class="cfglbl">Color</div><div class="pfcol">' + Object.keys(TINTS).map(k => '<button type="button" data-col="' + k + '" style="background:' + grad(k) + '" aria-label="' + k + '" title="' + k + '"></button>').join('') + '</div>'
    + '<div class="tbtn" style="margin-top:16px"><button class="lnk" type="button" data-close>Cancelar</button><button class="btn sm" type="button" id="pfOk">Guardar perfil</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  $('.tcard', o).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:650, easing:'cubic-bezier(.22,1,.36,1)' });
  const prev = () => {
    $('.pfprev', o).innerHTML = '<div class="pfban" style="background:' + grad(d.banner) + '"></div><div class="pfme">' + avatarHtml(d, u, 'xl') + '<div><b>' + esc(d.name || 'Tu nombre') + '</b>' + (d.pronouns ? '<i>' + esc(d.pronouns) + '</i>' : '') + '<span>' + esc(u.email || '') + '</span></div></div>' + (d.status ? '<p class="pfs">' + esc(d.status) + '</p>' : '') + (d.bio ? '<p class="pfb">' + esc(d.bio) + '</p>' : '');
    $$('[data-col]', o).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.col === d.color)));
    $$('[data-av]', o).forEach(b => b.setAttribute('aria-pressed', String(d.avatar.type === b.dataset.av)));
    $$('[data-emo]', o).forEach(b => b.setAttribute('aria-pressed', String(d.avatar.type === 'emoji' && d.avatar.emoji === b.dataset.emo)));
  };
  [['#pfName', 'name'], ['#pfPro', 'pronouns'], ['#pfSt', 'status'], ['#pfBio', 'bio']].forEach(([s, k]) => { const el = $(s, o); el.value = d[k]; el.addEventListener('input', () => { d[k] = el.value; prev(); }); });
  o.addEventListener('click', e => {
    const c = e.target.closest('[data-col]'); if (c){ d.color = d.banner = c.dataset.col; prev(); return; }
    const a = e.target.closest('[data-av]'); if (a && !a.disabled){ d.avatar = { type:a.dataset.av }; prev(); return; }
    const m = e.target.closest('[data-emo]'); if (m){ d.avatar = { type:'emoji', emoji:m.dataset.emo }; prev(); }
  });
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  $('[data-close]', o).addEventListener('click', close);
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  $('#pfOk', o).addEventListener('click', async () => {
    const b = $('#pfOk', o); b.textContent = 'Guardando…'; b.disabled = true;
    try{ await saveProfile(d); toast('Perfil guardado.'); close(); if (onSave) onSave(); }catch(e){ b.textContent = 'Guardar perfil'; b.disabled = false; toast(e.message || 'No pude guardar tu perfil.'); }
  });
  prev();
}
window.SZ = { root, $, $$, clamp, fmt, reduce, today, sleepRaw, esc, est, Z_PATH, ICONS, ico, zWord, API, MANUAL, ALL, byId,
  get state(){ return state; }, set state(v){ state = v; normalize(); },
  normalize, cleanUsage, cleanChats, cleanStrMap, save, total, addUsage, resetUsage, estAll, todayEst, todayReq, providerBalance, balanceHtml, splitHtml, syncNote, helpGuide, legacyRow, cleanLedger, mergeLedger, DEV, hooks, toast, hydrateIcons, md, countTo,
  charify, typeIn, showAll, getJSON, parseModels, loadCatalog, fetchCatalog, vendorLabel, vendorColor, burst, friendly, netMsg, fetchModels, refreshModels, verify, ask, metaOf, history, S, mirrorType, thud, portalOut, portalFill, portalReveal, waterIn, ctxMenu, SXC, coins, ACC, accHooks, accStart, accPush, accSignOut, accName, accHandle, securityModal, recoveryPanel, MARK_HTML, expertOf, EXP_LABEL, surveyModal, surveyPicks, surveyScore, orGuide, profileModal, puterLogo, PUTER_LOGO, api, accConfig, accDelete, saveProfile, avatarHtml, myAvatar, grad, tint, TINTS, loadGsi, SESS_get:() => SESS, CFG, PERF, saveCfg, cfgModal, cfgChooser, applyCfg, smoothWheel, orbitBg, authBox, isBlocked, lowEnd, askStream, mkReveal, reveals, chatsReady, IDB, provOf, totalAll, todayAll, szConfirm, cfgPreset, CFG_KEYS, cfgClasses };
})();
