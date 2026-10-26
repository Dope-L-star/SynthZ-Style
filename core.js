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
/* v2.3 · temas de color de SynthFlow: [id, nombre, color 1, bloqueado (llega con Syntonia)] */
const THEMES = [['synthz', 'SynthZ', '#e6b65f', 0, '#c9566c'], ['oceano', 'Océano', '#7cc9e3', 0, '#5a7bd6'], ['bosque', 'Bosque', '#9bd68f', 0, '#3fa58a'], ['lavanda', 'Lavanda', '#bfa9f2', 0, '#d46fb0'], ['aurora', 'Aurora', '#9fffd6', 1, '#a46bff'], ['oro', 'Oro negro', '#ffd27a', 1, '#2b2b2b']];
const cfgPreset = perf => CFG_KEYS.reduce((o, k) => (o[k] = perf !== 'speed', o), {});
const CFG = (() => {
  let c = {}; try{ c = JSON.parse(localStorage.getItem('synthz:cfg')) || {}; }catch(e){}
  if (c.v !== 2) c = Object.assign(cfgPreset(c.perf), { perf:c.perf || 'visual' });   /* migración: los ajustes concuerdan con el modo */
  /* v2.3 · en el celular lo que más pesa es el vidrio (desenfoque detrás de cada panel) y el fondo animado.
     Primera visita: modo rápido. Quien ya tenía SynthZ: se le apagan solo esas dos cosas una vez (las vuelve a encender en Ajustes). */
  let fresh = false; try{ fresh = localStorage.getItem('synthz:cfg') === null; }catch(e){}
  const phone = (() => { try{ return matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) <= 820; }catch(e){ return false; } })();
  if (phone && fresh) c = Object.assign(cfgPreset('speed'), { perf:'speed', anim:true, lite:1 });
  else if (phone && !c.lite){ c = Object.assign({}, cfgPreset(c.perf), c, { glass:false, bg:false, cursor:false, lite:1 }); try{ localStorage.setItem('synthz:cfg', JSON.stringify(Object.assign({ v:2 }, c))); }catch(e){} }
  return Object.assign({ v:2, perf:'visual', intro:'always', sound:true }, cfgPreset(c.perf), c);
})();
const PERF = CFG.perf === 'speed';
const reduce = !CFG.anim;
function cfgClasses(){ const r = document.documentElement; r.classList.toggle('nocur', !CFG.cursor); if (!CFG.cursor) r.classList.remove('cursor-on'); r.classList.toggle('noglass', !CFG.glass); r.classList.toggle('nobg', !CFG.bg); r.classList.toggle('noanim', !CFG.anim); r.classList.remove('perf'); r.classList.toggle('pmode', CFG.perf === 'speed');
  /* v2.3 · solo en SynthFlow: estilo Simple, color del tema y barra del celular a la izquierda */
  const chat = !!document.getElementById('composer') || /chat(\.html)?$/.test(location.pathname), simple = chat && CFG.ui === 'simple';
  r.classList.toggle('simple', simple); if (simple){ r.classList.add('noglass', 'nobg'); } r.classList.toggle('navleft', chat && CFG.nav === 'left');
  if (chat && !simple && THEMES.some(t => t[0] === CFG.theme && !t[3])) r.dataset.theme = CFG.theme; else delete r.dataset.theme; }
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
  synthz: () => `<defs><linearGradient id="szig" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fb0ff"/><stop offset=".55" stop-color="#c9566c"/><stop offset="1" stop-color="#e6b65f"/></linearGradient></defs><rect x="1" y="1" width="22" height="22" rx="7" fill="#15121c"/><path d="${Z_PATH}" transform="translate(4.4 4.4) scale(.32)" fill="url(#szig)"/>`,
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
const ico = p => (typeof BRANDS !== 'undefined' && BRANDS[p.id === 'mistral' ? 'mistralai' : p.id]) ? glassIcon({ id:p.id, vendor:p.id === 'mistral' ? 'mistralai' : p.id }, 'lgi') : `<i class="lg" aria-hidden="true"><svg viewBox="0 0 24 24">${ICONS[p.id](p.c, p.d)}</svg></i>`;
/* marca: en SynthFlow (html[data-brand=flow]) el logotipo es «SynthFlow» con destellos; en el resto, «Synth» + la Z */
const isFlow = () => document.documentElement.dataset.brand === 'flow';
const BRAND = () => isFlow() ? 'SynthFlow' : 'SynthZ';
const SPARKS = '<i class="sp s1" aria-hidden="true"></i><i class="sp s2" aria-hidden="true"></i><i class="sp s3" aria-hidden="true"></i>';
const GS = '<span class="gS">S</span>ynth';
const flowWord = () => '<span class="flw-w">' + GS + '<span class="flwg"><img class="flwi" src="media/flow-glass.webp" alt="Flow" draggable="false">' + SPARKS + '</span></span>';
const zMark = (txt = 'Synth') => (txt === 'Synth' ? GS : txt) + '<img class="zb zg" src="media/z-glass.webp" alt="Z" draggable="false">';
const zWord = (txt = 'Synth') => isFlow() && txt === 'Synth' ? flowWord() : zMark(txt);

/* ---------- datos ---------- */
const API = [
  { id:'openrouter', name:'OpenRouter', c:'#c9566c', d:'#8fb0ff', kind:'openai', url:'https://openrouter.ai/api/v1', keyUrl:'https://openrouter.ai/keys',
    desc:'Conecta tu llave de OpenRouter y usa sus modelos gratuitos (etiqueta :free), incluido gpt-oss de OpenAI.', models:['openai/gpt-oss-20b:free','meta-llama/llama-3.3-70b-instruct:free'] }
];
const MANUAL = [];
const USAGE_EXTRA = [{ id:'synthz', name:'IAs conectadas', c:'#e6b65f', d:'#c9566c' }, { id:'puter', name:'Puter', c:'#6fd3d6', d:'#8fb0ff', est:true }, { id:'groq', name:'Groq', c:'#f55036', d:'#ffb36b', hidden:true }];
/* IA de SynthZ: las llaves gratis del equipo, compartidas con todos (nunca salen del servidor; cero cobros) */
const SZ_P = { id:'synthz', name:'Las IAs conectadas', kind:'openai', url:'/api/ai', models:['sz:auto'] };
/* Groq con la llave propia de cada persona (opcional): va directo del navegador a Groq, nunca pasa por SynthZ */
const GROQ_P = { id:'groq', name:'Groq', kind:'openai', url:'https://api.groq.com/openai/v1', keyUrl:'https://console.groq.com/keys', models:[] };
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
        sources: Array.isArray(m.sources) ? m.sources.slice(0, 8).map(x => ({ t:String((x && x.t) || '').slice(0, 200), u:/^https?:\/\//.test(String(x && x.u)) ? String(x.u).slice(0, 500) : '' })).filter(x => x.u) : undefined, web: typeof m.web === 'string' ? m.web.slice(0, 20) : undefined,
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
/* v2.1 · memoria: lo que la persona le pidió a SynthFlow que recuerde (máx. 40 cosas cortas) */
function cleanMem(m){
  m = m && typeof m === 'object' ? m : {};
  const items = (Array.isArray(m.items) ? m.items : []).filter(x => x && typeof x.text === 'string' && x.text.trim()).slice(0, 40)
    .map(x => ({ id:/^m[\w]{3,30}$/.test(x.id) ? x.id : 'm' + Math.random().toString(36).slice(2, 10), t:+x.t || Date.now(), text:x.text.replace(/\s+/g, ' ').trim().slice(0, 300) }));
  return { on:m.on !== false, t:+m.t || 0, items };
}
function normalize(){
  state.keys = cleanStrMap(state.keys); state.model = cleanStrMap(state.model); state.models = cleanModels(state.models);
  state.chats = cleanChats(state.chats);
  const stored = readLedger(), given = state.ledger && typeof state.ledger === 'object' ? cleanLedger(state.ledger) : null;
  let L = stored && given ? mergeLedger(stored, given) : (stored || given);
  if (!L){ L = { ep:0, dev:{} }; const leg = legacyRow(state.usage); if (Object.keys(leg).length) L.dev.legacy = leg; }
  state.ledger = L; state.usage = usageOf(L); writeLedger();
  state.fav = strList(state.fav, 300); state.cmp = strList(state.cmp, 4);
  state.mem = cleanMem(state.mem);
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
/* ---------- cuentas propias de SynthZ (usuario y contraseña, o Google) · Puter solo conecta las IA ---------- */
var ACC = { ready:false, busy:false, user:null, profile:null, t:0, err:'', avail:null, cid:'', dcid:'', google:false, missing:[] };
const accHooks = [];
const hashS = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
var accSent = {}, accT = 0, accDelSent = new Set();
let SESS = ''; try{ SESS = localStorage.getItem('synthz:sess') || ''; }catch(e){}
if (SESS) document.documentElement.classList.add('signed');   /* con sesión: nada de «entra a tu cuenta» */
function setSess(t){ SESS = t || ''; try{ if (SESS) localStorage.setItem('synthz:sess', SESS); else localStorage.removeItem('synthz:sess'); }catch(e){} }
const accFire = k => accHooks.forEach(f => { try{ f(k); }catch(_){} });
async function api(path, o = {}){
  const h = { 'content-type':'application/json' }; if (SESS) h.authorization = 'Bearer ' + SESS;
  let r; try{ r = await fetch('/api/' + path, { method:o.method || 'GET', headers:h, body:o.body ? JSON.stringify(o.body) : undefined, signal:o.signal }); }
  catch(e){ throw Object.assign(new Error('No pude comunicarme con ' + BRAND() + '.'), { net:true }); }
  let d = {}; try{ d = await r.json(); }catch(e){}
  if (r.status === 401 && SESS && !o.keep){ setSess(''); ACC.ready = false; ACC.user = null; ACC.profile = null; accFire('out'); }
  if (!r.ok) throw Object.assign(new Error(d.error || 'Error ' + r.status), { status:r.status, data:d });
  return d;
}
async function accConfig(){
  if (ACC.avail !== null) return ACC.avail;
  try{ const r = await fetch('/api/config'); const d = r.ok ? await r.json() : {}; ACC.cid = d.googleClientId || ''; ACC.dcid = d.driveClientId || ''; ACC.sbg = !!d.sbGoogle; ACC.sb = d.sb || null; ACC.google = !!((d.google && ACC.cid) || ACC.sbg); ACC.missing = d.missing || (r.ok ? [] : ['servidor']); ACC.avail = !!d.ok; }
  catch(e){ ACC.avail = false; }
  return ACC.avail;
}
function slimChat(arr){
  let a = arr.slice(-150).map(m => ({ role:m.role, content:m.content, meta:m.meta, model:m.model, star:m.star || undefined, files: Array.isArray(m.files) ? m.files.map(f => ({ name:f.name, kind:f.kind })) : undefined }));
  while (a.length > 4 && JSON.stringify(a).length > 380000) a = a.slice(Math.ceil(a.length / 4));
  return a;
}
function prefsOut(){
  return { v:2, t:Date.now(), model:state.model, fav:state.fav, cmp:state.cmp, sx:state.sx, pinned:state.pinned || '', threads:state.threads || {}, del:(state.del || []).slice(-300),
    arena:state.arena || {}, survey:state.survey || null, useTeam:state.useTeam || '', battle:!!state.battle, cfg:CFG, mem:state.mem,
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
    if (p.mem && typeof p.mem === 'object'){ const m = cleanMem(p.mem); if ((+m.t || 0) > (+(state.mem && state.mem.t) || 0)) state.mem = m; }
    if (p.ledger && typeof p.ledger === 'object'){ syncLedger(); state.ledger = mergeLedger(state.ledger, cleanLedger(p.ledger)); }
    else if (p.usage && typeof p.usage === 'object' && !state.ledger.ep){ const leg = legacyRow(p.usage); if (Object.keys(leg).length){ syncLedger(); state.ledger = mergeLedger(state.ledger, { ep:state.ledger.ep, dev:{ legacy:leg } }); } }
    state.usage = usageOf(state.ledger); writeLedger();
  }
  (state.del || []).forEach(k => { delete state.chats[k]; delete (chats || {})[k]; });
  Object.keys(chats || {}).forEach(k => { const r = chats[k], l = state.chats[k]; if (Array.isArray(r) && /^openrouter::./.test(k) && (!Array.isArray(l) || r.length > l.length)) state.chats[k] = r.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'); });
}
/* ---------- Google Drive (opcional): una copia de tus chats en TU Drive, en la carpeta privada de la app ----------
   · Solo pide permiso para la carpeta oculta de SynthFlow (drive.appdata): no puede ver ni tocar tus otros archivos.
   · El permiso dura ~1 hora y vive solo en memoria; nunca se guarda ni se envía a SynthZ.
   · Al traer la copia se MEZCLA con lo que tienes: nunca se borra un chat. Tus llaves no van en la copia. */
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata', DRIVE_FILE = 'synthflow-chats.json', DRIVE_API = 'https://www.googleapis.com';
const DRV = { tok:'', exp:0, fileId:'', busy:false, t:0, tc:null, cid:'' };
const driveMeta = () => { try{ return JSON.parse(localStorage.getItem('synthz:drive') || 'null'); }catch(e){ return null; } };
function driveSetMeta(v){ try{ if (v) localStorage.setItem('synthz:drive', JSON.stringify(v)); else localStorage.removeItem('synthz:drive'); }catch(e){} try{ dispatchEvent(new CustomEvent('synthz-drive', { detail:v })); }catch(e){} }
async function driveCid(){ await accConfig(); return ACC.dcid || ''; }
const driveLive = () => !!(DRV.tok && Date.now() < DRV.exp - 60000);
/* pide el permiso (debe llamarse dentro de un clic: Google abre una ventanita) */
function driveToken(prompt){
  return new Promise((ok, no) => {
    if (!window.google || !google.accounts || !google.accounts.oauth2) return no(Object.assign(new Error('No pude abrir el botón de Google. Revisa tu internet o tu bloqueador de anuncios.'), { gsi:true }));
    DRV.tc = google.accounts.oauth2.initTokenClient({ client_id:DRV.cid, scope:DRIVE_SCOPE, include_granted_scopes:false,
      callback:r => { if (r && r.access_token && google.accounts.oauth2.hasGrantedAllScopes(r, DRIVE_SCOPE)){ DRV.tok = r.access_token; DRV.exp = Date.now() + (+r.expires_in || 3600) * 1000; ok(true); } else no(new Error('No diste permiso para la carpeta de SynthFlow en tu Drive.')); },
      error_callback:e => no(new Error(e && e.type === 'popup_closed' ? 'Cerraste la ventana de Google antes de terminar.' : e && e.type === 'popup_failed_to_open' ? 'Tu navegador no dejó abrir la ventanita de Google. Permite las ventanitas de este sitio.' : 'Google no completó el permiso.')) });
    DRV.tc.requestAccessToken({ prompt:prompt == null ? '' : prompt });
  });
}
async function dfetch(path, o = {}){
  const r = await fetch(DRIVE_API + path, Object.assign({}, o, { headers:Object.assign({ Authorization:'Bearer ' + DRV.tok }, o.headers || {}) })).catch(() => null);
  if (!r) throw new Error('No pude hablar con Google Drive. Revisa tu conexión.');
  if (r.status === 401){ DRV.tok = ''; throw Object.assign(new Error('El permiso de Drive venció. Toca «Sincronizar» otra vez.'), { expired:true }); }
  if (r.status === 403){ const t = await r.text().catch(() => ''); throw new Error(/storageQuota|quota/i.test(t) ? 'Tu Google Drive está lleno.' : /accessNotConfigured|has not been used|disabled/i.test(t) ? 'Falta activar la «Google Drive API» en el proyecto de Google de SynthZ (lo hace Prime una sola vez).' : 'Google Drive no dio permiso para guardar.'); }
  if (!r.ok) throw new Error('Google Drive respondió con un error (' + r.status + '). Intenta más tarde.');
  return r;
}
async function driveFind(){
  if (DRV.fileId) return DRV.fileId;
  const q = encodeURIComponent("name='" + DRIVE_FILE + "' and trashed=false");
  const d = await (await dfetch('/drive/v3/files?spaces=appDataFolder&fields=files(id,modifiedTime,size)&q=' + q)).json();
  const f = (d.files || [])[0]; DRV.fileId = f ? f.id : ''; return DRV.fileId;
}
async function drivePull(){
  const id = await driveFind(); if (!id) return 0;
  const d = await (await dfetch('/drive/v3/files/' + id + '?alt=media')).json().catch(() => null);
  if (!d || d.app !== 'SynthFlow' || typeof d.chats !== 'object') return 0;
  const before = Object.keys(state.chats).length;
  mergeIn(d.prefs || null, d.chats || {}); save();
  try{ hooks.chats(); }catch(e){}
  return Object.keys(state.chats).length - before;
}
async function drivePush(){
  const chats = {}; Object.keys(state.chats).forEach(k => { const a = state.chats[k]; if (Array.isArray(a) && a.length) chats[k] = a.map(m => ({ role:m.role, content:m.content, meta:m.meta, model:m.model, star:m.star || undefined, files:Array.isArray(m.files) ? m.files.map(f => ({ name:f.name, kind:f.kind })) : undefined })); });
  const prefs = prefsOut(); delete prefs.cfg;
  const body = JSON.stringify({ app:'SynthFlow', v:1, t:Date.now(), prefs, chats });
  const id = await driveFind();
  if (id) await dfetch('/upload/drive/v3/files/' + id + '?uploadType=media', { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body });
  else {
    const B = 'szb' + Math.random().toString(36).slice(2);
    const mp = '--' + B + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify({ name:DRIVE_FILE, parents:['appDataFolder'], mimeType:'application/json' }) + '\r\n--' + B + '\r\nContent-Type: application/json\r\n\r\n' + body + '\r\n--' + B + '--';
    const d = await (await dfetch('/upload/drive/v3/files?uploadType=multipart&fields=id', { method:'POST', headers:{ 'Content-Type':'multipart/related; boundary=' + B }, body:mp })).json();
    DRV.fileId = d.id || '';
  }
  const m = driveMeta() || {}; driveSetMeta(Object.assign(m, { linked:true, last:Date.now(), size:body.length, n:Object.keys(chats).length }));
  return body.length;
}
/* vincular o sincronizar (dentro de un clic): trae lo que haya en tu Drive, lo mezcla y sube la copia al día */
async function driveSync(o = {}){
  if (DRV.busy) return { busy:true };
  DRV.cid = await driveCid();
  if (!DRV.cid) throw Object.assign(new Error('Guardar en Google Drive todavía no está disponible. Muy pronto.'), { off:true });
  await loadGsi();
  if (!driveLive()) await driveToken(driveMeta() ? '' : 'consent');
  DRV.busy = true;
  try{ const got = await drivePull(); const size = await drivePush(); return { got, size }; }
  finally{ DRV.busy = false; }
}
/* con el permiso vivo, cada cambio se sube solo (cada 30 s como mucho) */
function driveSchedule(){ if (!driveLive() || !(driveMeta() || {}).linked) return; clearTimeout(DRV.t); DRV.t = setTimeout(() => { if (driveLive() && !DRV.busy){ DRV.busy = true; drivePush().catch(() => {}).finally(() => { DRV.busy = false; }); } }, 30000); }
function driveUnlink(){ try{ if (DRV.tok && window.google && google.accounts && google.accounts.oauth2) google.accounts.oauth2.revoke(DRV.tok, () => {}); }catch(e){} DRV.tok = ''; DRV.exp = 0; DRV.fileId = ''; driveSetMeta(null); }
const DRIVE = { sync:driveSync, unlink:driveUnlink, meta:driveMeta, live:driveLive, cid:driveCid, preload:() => loadGsi().catch(() => {}) };
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
    if (res.chats && res.chats.max) ACC.space = { used:res.chats.used, max:res.chats.max }; ACC.full = false;
    first.forEach(x => { accSent[x.k] = marks[x.k]; }); del.forEach(k => { accDelSent.add(k); delete accSent[k]; });
    for (let i = 20; i < items.length; i += 20){
      const part = items.slice(i, i + 20);
      await api('chats', { method:'POST', body:{ items:part, del:[] } });
      part.forEach(x => { accSent[x.k] = marks[x.k]; });
    }
    ACC.t = Date.now(); ACC.err = '';
  }catch(e){
    ACC.err = e.message || 'No pude guardar en tu cuenta.';
    if (e.status === 413){ if (!ACC.full) toast(ACC.err); ACC.full = true; }                     /* nube llena: no reintenta hasta que liberes espacio */
    else if (e.status !== 401){ clearTimeout(accT); accT = setTimeout(accPush, 20000); }
  }
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
    const d = await api('me'); ACC.user = d.user; ACC.profile = d.profile || null; ACC.space = d.space || null;
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
/* cerrar sesión en TODOS tus dispositivos (este incluido) */
async function accSignOutAll(force){
  if (ACC.ready){ ACC.err = ''; try{ await accPush(); }catch(e){} if (ACC.err && !force) throw Object.assign(new Error(ACC.err), { unsynced:true }); }
  await api('auth?all=1', { method:'DELETE', keep:true });
  setSess(''); ACC.ready = false; ACC.user = null; ACC.profile = null; wipeAccountData(); accFire('out');
}
async function accClaim(setup){ const d = await api('auth', { method:'POST', body:{ mode:'claim', setup }, keep:true }); if (ACC.user){ ACC.user.role = d.role; ACC.user.claimable = false; } accFire('profile'); return d.role; }
/* rangos de SynthZ */
const ROLE_NAME = { owner:'Prime', admin:'ZFlow', staff:'Symmetrix', user:'Synther' };
/* si otra pestaña cerró sesión o cambió de cuenta, esta se recarga para no mostrar ni guardar datos ajenos */
addEventListener('storage', e => { if (e.key === 'synthz:sess' && (e.newValue || '') !== SESS) location.reload(); });
async function accDelete(confirm){
  await api('me', { method:'DELETE', body:confirm || {}, keep:true }); setSess(''); ACC.ready = false; ACC.user = null; ACC.profile = null; wipeAccountData(); accFire('out');
}
async function saveProfile(p){ const d = await api('me', { method:'PUT', body:{ profile:p } }); ACC.profile = d.profile; accFire('profile'); return d.profile; }
const accHandle = u => { u = u || ACC.user || {}; return u.username ? '@' + u.username : (u.email || ''); };
const accName = () => (ACC.profile && ACC.profile.name) || (ACC.user && ACC.user.name) || 'Tú';
const TINTS = { aurora:['#8fb0ff', '#c9566c', '#ff8f7a'], azul:['#5b8cff', '#8fb0ff', '#6fd3d6'], violeta:['#7c5cff', '#a98bff', '#ff9ed8'], coral:['#ff8f7a', '#ffb36b', '#ff9ed8'], menta:['#46d6a8', '#6fd3d6', '#8fb0ff'], oro:['#f2c46b', '#ffb36b', '#ff8f7a'], rosa:['#ff9ed8', '#ff8f7a', '#c9566c'], noche:['#3a3f63', '#5b5f8f', '#8fb0ff'] };
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
/* «Pulsem» en la barrita: solo para Prime, ZFlow y Symmetrix */
const paintPulse = () => { const b = document.getElementById('railPulse'); if (b) b.hidden = !(ACC.ready && ACC.user && ['owner', 'admin', 'staff'].includes(ACC.user.role)); };
accHooks.push(paintPulse);

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
  /* SynthFlow tiene su propio logito: la «F» de Flow en cursiva, con su destello */
  const drawFlow = now => {
    g.clearRect(0, 0, 64, 64);
    g.fillStyle = '#0b0c10'; g.beginPath(); if (g.roundRect) g.roundRect(0, 0, 64, 64, 15); else g.rect(0, 0, 64, 64); g.fill();
    const gr = g.createLinearGradient(10, 8, 54, 58); gr.addColorStop(0, '#c9566c'); gr.addColorStop(.62, '#e6b65f'); gr.addColorStop(1, '#ffd9a0');
    g.fillStyle = gr; g.font = 'italic 54px "Instrument Serif", Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText('F', 29, 51);
    const k = now ? .55 + .45 * Math.abs(Math.sin(now / 900)) : 1, sx = 50, sy = 14, r = 7.5 * k;
    g.fillStyle = '#ffe7b0'; g.globalAlpha = .55 + .45 * k; g.beginPath(); g.moveTo(sx, sy - r); g.quadraticCurveTo(sx, sy, sx + r, sy); g.quadraticCurveTo(sx, sy, sx, sy + r); g.quadraticCurveTo(sx, sy, sx - r, sy); g.quadraticCurveTo(sx, sy, sx, sy - r); g.fill(); g.globalAlpha = 1;
    try{ link.href = c.toDataURL('image/png'); }catch(e){}
  };
  const draw = now => {
    if (isFlow()) return drawFlow(now);
    const [a1, a3] = cradleAngles(now, 26 * Math.PI / 180), Lr = 30, py = 4;
    g.clearRect(0, 0, 64, 64);
    g.fillStyle = '#0b0c10'; g.beginPath(); if (g.roundRect) g.roundRect(0, 0, 64, 64, 15); else g.rect(0, 0, 64, 64); g.fill();
    [[20, a1, '#8fb0ff'], [32, 0, '#c9566c'], [44, a3, '#ff8f7a']].forEach(([x, a, col]) => {
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
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw(CFG.favAnim ? performance.now() : 0));
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
/* ---------- markdown completo (tablas, citas, listas anidadas, títulos) y matemáticas bien escritas ----------
   Usa marked + DOMPurify + Temml (carpeta lib/). Si no cargan, queda el markdown pequeño de siempre. */
const MDLIB = { ok:false, p:null };
function mdLoad(){
  if (MDLIB.p) return MDLIB.p;
  const js = src => new Promise(res => { const s = document.createElement('script'); s.src = src; s.async = true; s.onload = () => res(true); s.onerror = () => res(false); document.head.appendChild(s); });
  if (!document.querySelector('link[href="lib/temml.css"]')){ const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'lib/temml.css'; document.head.appendChild(l); }
  MDLIB.p = Promise.all([js('lib/marked.min.js'), js('lib/purify.min.js'), js('lib/temml.min.js')]).then(() => {
    MDLIB.ok = !!(window.marked && window.DOMPurify);
    if (MDLIB.ok){
      try{ marked.setOptions({ gfm:true, breaks:true, headerIds:false, mangle:false }); }catch(e){}
      DOMPurify.addHook('afterSanitizeAttributes', n => { if (n.tagName === 'A'){ n.setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener noreferrer'); } });
    }
    try{ hooks.md && hooks.md(); }catch(e){}
    return MDLIB.ok;
  });
  return MDLIB.p;
}
if (document.readyState !== 'loading') setTimeout(mdLoad, 300); else document.addEventListener('DOMContentLoaded', () => setTimeout(mdLoad, 300));
const MCACHE = new Map();
function texHtml(tex, display){
  const k = (display ? 'D' : 'I') + tex; if (MCACHE.has(k)) return MCACHE.get(k);
  let h;
  try{ h = window.temml ? temml.renderToString(tex.trim(), { displayMode:display, throwOnError:false, annotate:true }) : null; }catch(e){ h = null; }
  if (!h) h = '<code class="tex">' + esc(tex) + '</code>';
  if (display) h = '<div class="mathd">' + h + '</div>';
  if (MCACHE.size > 400) MCACHE.clear(); MCACHE.set(k, h); return h;
}
function md(src){
  src = String(src || '');
  if (!MDLIB.ok) return mdLite(src);
  /* 1) el código se aparta (ahí no se toca nada) */
  const code = [];
  let t = src.replace(/```[\s\S]*?(```|$)|`[^`\n]+`/g, m => { code.push(m); return '\u0001C' + (code.length - 1) + '\u0001'; });
  /* 2) las fórmulas se apartan: \[ \], $$ $$, \( \), $ $ */
  const math = [];
  const keep = (tex, d) => { math.push([tex, d]); return d ? '\n\n\u0002M' + (math.length - 1) + '\u0002\n\n' : '\u0002M' + (math.length - 1) + '\u0002'; };
  t = t.replace(/\$\$([\s\S]+?)\$\$/g, (m, x) => keep(x, true))
       .replace(/\\\[([\s\S]+?)\\\]/g, (m, x) => keep(x, true))
       .replace(/\\\(([\s\S]+?)\\\)/g, (m, x) => keep(x, false))
       .replace(/(^|[^\\$\w])\$(?!\s)([^$\n]{1,200}?[^\s\\])\$(?![\w$])/g, (m, pre, x) => /^\d+([.,]\d+)?$/.test(x) ? m : pre + keep(x, false));
  /* sin cerrar todavía (mientras llega en vivo): se muestra como texto tranquilo, sin barras raras */
  t = t.replace(/\\\(([^\n]*)$/, (m, x) => x).replace(/\\\[([\s\S]*)$/, (m, x) => x);
  t = t.replace(/\u0001C(\d+)\u0001/g, (m, i) => code[+i]);
  let h;
  try{ h = marked.parse(t); }catch(e){ return mdLite(src); }
  h = h.replace(/\u0002M(\d+)\u0002/g, (m, i) => texHtml(math[+i][0], math[+i][1]));
  h = h.replace(/<p>\s*(<div class="mathd">[\s\S]*?<\/div>)\s*<\/p>/g, '$1');
  h = h.replace(/<table>/g, '<div class="tbw"><table>').replace(/<\/table>/g, '</table></div>');
  return DOMPurify.sanitize(h, { ADD_TAGS:['math', 'semantics', 'annotation', 'mrow', 'mi', 'mn', 'mo', 'msup', 'msub', 'msubsup', 'mfrac', 'msqrt', 'mroot', 'mtext', 'mspace', 'mtable', 'mtr', 'mtd', 'munder', 'mover', 'munderover', 'mstyle', 'mpadded', 'menclose', 'mphantom', 'merror'], ADD_ATTR:['target', 'display', 'mathvariant', 'stretchy', 'fence', 'separator', 'lspace', 'rspace', 'columnalign', 'rowspacing', 'columnspacing', 'displaystyle', 'scriptlevel', 'encoding', 'accent', 'accentunder', 'movablelimits', 'notation', 'width', 'height', 'depth', 'voffset', 'linethickness', 'minsize', 'maxsize', 'symmetric', 'largeop'] });
}
function mdLite(src){
  src = src.replace(/\\[()[\]]/g, '').replace(/\\sqrt\{([^}]*)\}/g, '√$1').replace(/\\(times|cdot)/g, (m, k) => k === 'times' ? '×' : '·');
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

/* =====================================================================
   Identidad de cada IA: su icono real (vidrio líquido) y sus colores en el chat
   ===================================================================== */
const BRANDS = {
  openai:['openai', 'OpenAI', '#10a37f', '#7fe0c4'], anthropic:['claude-color', 'Claude (Anthropic)', '#d97757', '#f4b48f'], google:['gemini-color', 'Google Gemini', '#4c8df6', '#b39cff'],
  gemma:['gemma-color', 'Google Gemma', '#4c8df6', '#7fd6f0'], 'meta-llama':['meta-color', 'Meta Llama', '#0866ff', '#7fb0ff'], mistralai:['mistral-color', 'Mistral', '#fa520f', '#ffc06b'],
  deepseek:['deepseek-color', 'DeepSeek', '#4d6bfe', '#93a6ff'], qwen:['qwen-color', 'Qwen', '#6c5cf0', '#b5aaff'], 'x-ai':['grok', 'xAI Grok', '#d9d9de', '#8e8e96'],
  moonshotai:['kimi-color', 'Kimi (Moonshot)', '#1d7bff', '#8fc0ff'], nvidia:['nvidia-color', 'NVIDIA', '#76b900', '#c3f06b'], microsoft:['microsoft-color', 'Microsoft', '#22a6f0', '#ffb900'],
  'z-ai':['zhipu-color', 'Z.ai (GLM)', '#3859ff', '#8aa0ff'], ai21:['ai21', 'AI21', '#f3a6c8', '#ffd1e4'], cohere:['cohere-color', 'Cohere', '#d18ee2', '#ff9d7a'], nousresearch:['nousresearch', 'Nous', '#c9c9cf', '#8e8e96'],
  ibm:['ibm', 'IBM Granite', '#4589ff', '#a6c8ff'], minimax:['minimax-color', 'MiniMax', '#f23f5d', '#ff9e7a'], inception:['inception', 'Inception', '#a3a3ff', '#d6d6ff'], liquid:['liquid', 'Liquid', '#5b8cff', '#9fd0ff'],
  baidu:['baidu-color', 'Baidu', '#2932e1', '#7a82ff'], tencent:['tencent-color', 'Tencent', '#0052d9', '#6fa0ff'], bytedance:['bytedance-color', 'ByteDance', '#3c8cff', '#00c8d2'], 'stepfun-ai':['stepfun-color', 'StepFun', '#22c1c3', '#8ff0e6'],
  perplexity:['perplexity-color', 'Perplexity', '#20b8cd', '#9ff0f6'], allenai:['ai2-color', 'Ai2', '#f0529c', '#ff9fc8'], groq:['groq', 'Groq', '#f55036', '#ffb36b'], cloudflare:['cloudflare-color', 'Cloudflare', '#f6821f', '#ffc46b'],
  openrouter:['openrouter', 'OpenRouter', '#6467f2', '#a5a7ff'], synthz:['', 'SynthZ', '#e6b65f', '#c9566c'], puter:['', 'Puter', '#3b82f6', '#6fd3d6']
};
const BALIAS = { meta:'meta-llama', llama:'meta-llama', mistral:'mistralai', claude:'anthropic', xai:'x-ai', grok:'x-ai', moonshot:'moonshotai', kimi:'moonshotai', zhipu:'z-ai', thudm:'z-ai', glm:'z-ai', stepfun:'stepfun-ai', ai2:'allenai', gemini:'google', 'openai-completion':'openai', 'ibm-granite':'ibm', 'nous':'nousresearch' };
function brandOf(m){
  if (!m) return BRANDS.synthz;
  const id = String(m.id || ''), v = String(m.vendor || '').toLowerCase().replace(/-completion$/, '');
  if (id === 'sz:auto' || v === 'synthz') return BRANDS.synthz;
  let k = BALIAS[v] || v;
  if (k === 'google' && /gemma/i.test(id)) k = 'gemma';
  if (!BRANDS[k]){ const g = Object.keys(BRANDS).find(b => new RegExp(b.replace(/-.*/, ''), 'i').test(id.split(':').pop())) || Object.keys(BALIAS).find(a => new RegExp('\\b' + a, 'i').test(id)); k = BRANDS[g] ? g : BALIAS[g] || ''; }
  return BRANDS[k] || null;
}
const ZMINI = '<svg viewBox="-4 -4 56 56" aria-hidden="true"><defs><linearGradient id="gzm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fb0ff"/><stop offset=".55" stop-color="#c9566c"/><stop offset="1" stop-color="#e6b65f"/></linearGradient></defs><path d="' + Z_PATH + '" fill="url(#gzm)"/></svg>';
/* icono de vidrio líquido: baldosa translúcida con brillo especular y el logo real adentro */
function glassIcon(m, cls){
  const b = brandOf(m), c1 = b ? b[2] : vendorColor(m && m.vendor), c2 = b ? b[3] : '#ffffff';
  const inner = b && b[0] ? '<img src="ico/' + b[0] + '.svg" alt="" loading="lazy" decoding="async" onerror="this.replaceWith(document.createTextNode(\'' + esc(((m && (m.vlabel || m.name)) || '?').charAt(0).toUpperCase()).replace(/'/g, '') + '\'))">'
    : b === BRANDS.synthz ? ZMINI : b === BRANDS.puter ? '<img src="' + PUTER_LOGO + '" alt="" referrerpolicy="no-referrer" loading="lazy">' : '<b>' + esc(((m && (m.vlabel || m.name)) || '?').charAt(0).toUpperCase()) + '</b>';
  return '<span class="gico' + (cls ? ' ' + cls : '') + '" style="--b1:' + c1 + ';--b2:' + c2 + '" title="' + esc(b ? b[1] : (m && m.vlabel) || '') + '">' + inner + '</span>';
}

/* =====================================================================
   Carga de las IA: un cuadradito de 8×8 píxeles de vidrio que va armando 10 dibujos
   mientras la IA trabaja, y al lado lo que está haciendo (con flechita para ver el detalle)
   ===================================================================== */
const PIXART = [
  ['Corazón', '.11..11.|11111111|11111111|11111111|.111111.|..1111..|...11...|........'],
  ['Rayo', '....111.|...111..|..111...|.111111.|...111..|..111...|.111....|.1......'],
  ['Estrella', '...11...|...11...|11111111|.111111.|..1111..|.111111.|.11..11.|11....11'],
  ['Idea', '..1111..|.111111.|.112211.|.112211.|..1111..|..2222..|..2222..|...22...'],
  ['Cohete', '...11...|..1111..|..1221..|..1111..|.111111.|11.11.11|...22...|..2..2..'],
  ['Gatito', '1......1|11....11|11111111|12111121|11111111|1112 111|.111111.|..1111..'],
  ['Nota', '...11111|...11111|...1...1|...1...1|...1...1|.111.111|1111.111|.11...1.'],
  ['Planeta', '........|..1111..|.111111.|22222222|.111111.|..1111..|........|........'],
  ['SynthonIA', '..1111..|.111111.|11211211|11111111|12111121|11222211|.111111.|..1111..'],
  ['Z', '11111111|11111111|.....111|....111.|...111..|..111...|11111111|11111111']
].map(([n, s]) => [n, s.split('|').join('').replace(/ /g, '.')]);
const WORDS = ['Leyendo tu mensaje', 'Pensando', 'Sopesando ideas', 'Aclarando', 'Ordenando las ideas', 'Buscando las palabras', 'Revisando', 'Casi listo'];
const pixelGrid = () => '<span class="pxg" aria-hidden="true">' + '<i></i>'.repeat(64) + '</span>';
/* motor del dibujo: se enciende píxel a píxel; al completarse brilla, se deshace y empieza otro */
function pixelRun(host, startAt){
  const cells = [...host.querySelectorAll('.pxg i')]; if (!cells.length) return { stop(){}, speed(){} };
  let art = (startAt == null ? Math.floor(Math.random() * PIXART.length) : startAt) % PIXART.length, order = [], k = 0, hold = 0, fast = 1, stopped = false, t = 0;
  const load = () => { const s = PIXART[art][1]; order = []; for (let i = 0; i < 64; i++) if (s[i] !== '.') order.push(i); order.sort(() => Math.random() - .5); k = 0; host.dataset.art = PIXART[art][0]; cells.forEach(c => { c.className = ''; }); };
  load();
  const tick = () => {
    if (stopped) return;
    if (hold > 0){ hold--; if (!hold){ cells.forEach(c => { if (c.className) c.className += ' out'; }); setTimeout(() => { art = (art + 1) % PIXART.length; load(); }, 260); } }
    else if (k < order.length){ for (let n = 0; n < fast && k < order.length; n++, k++){ const i = order[k]; cells[i].className = 'on c' + PIXART[art][1][i]; } if (k >= order.length){ hold = 7; host.classList.remove('done'); void host.offsetWidth; host.classList.add('done'); } }
    t = setTimeout(tick, 70);
  };
  t = setTimeout(tick, 60);
  return { stop(){ stopped = true; clearTimeout(t); }, speed(n){ fast = Math.max(1, Math.min(4, n | 0)); }, get art(){ return art; } };
}
/* «qué está haciendo la IA»: frases que cambian, segundos, palabras y el detalle real (si la IA lo comparte) */
function workView(o = {}){
  const el = document.createElement('div'); el.className = 'work';
  el.innerHTML = '<button type="button" class="wk-row" aria-expanded="false"><span class="pxw">' + pixelGrid() + '</span><span class="wk-t"><b class="wk-w">Leyendo tu mensaje</b><small class="wk-s"></small></span><svg class="wk-c" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button><div class="wk-d" hidden><ol class="wk-steps"></ol><div class="wk-r" hidden><b>Lo que pensó la IA</b><p></p></div></div>';
  const S = { t0:performance.now(), phase:'read', words:0, reason:'', steps:[], wi:0, done:false };
  const px = pixelRun($('.pxw', el), o.art);
  const w = $('.wk-w', el), sm = $('.wk-s', el), row = $('.wk-row', el), det = $('.wk-d', el);
  const secs = () => ((performance.now() - S.t0) / 1000).toFixed(1).replace('.', ',') + ' s';
  const step = txt => { S.steps.push([performance.now() - S.t0, txt]); if (!det.hidden) paintSteps(); };
  const paintSteps = () => { $('.wk-steps', el).innerHTML = S.steps.map(([ms, x]) => '<li><em>' + (ms / 1000).toFixed(1).replace('.', ',') + ' s</em>' + esc(x) + '</li>').join(''); const r = $('.wk-r', el); r.hidden = !S.reason; if (S.reason) $('p', r).textContent = S.reason.slice(-4000); };
  const setW = (txt) => { if (w.textContent === txt) return; w.classList.remove('sw'); void w.offsetWidth; w.textContent = txt; w.classList.add('sw'); };
  let iv = setInterval(() => {
    if (S.done) return;
    if (S.phase === 'read' && performance.now() - S.t0 > 700){ S.phase = 'think'; step('Leyó tu mensaje'); }
    if (S.phase === 'think'){ const n = Math.floor((performance.now() - S.t0 - 700) / 1700); setW(WORDS[1 + (n % (WORDS.length - 1))]); }
    sm.textContent = S.phase === 'write' ? secs() + ' · ' + fmt(S.words) + (S.words === 1 ? ' palabra' : ' palabras') : S.phase === 'reason' ? secs() + ' · pensando antes de responder' : secs();
  }, 250);
  row.addEventListener('click', () => { const on = det.hidden; det.hidden = !on; row.setAttribute('aria-expanded', String(on)); el.classList.toggle('open', on); if (on) paintSteps(); });
  if (o.model) step('Eligió ' + o.model);
  return {
    el, state:S,
    reason(txt){ if (S.done) return; if (!S.reason) step('Empezó a razonar'); S.reason = txt; if (S.phase !== 'write'){ S.phase = 'reason'; setW('Razonando'); } px.speed(2); if (!det.hidden) paintSteps(); },
    write(txt){ if (S.done) return; if (S.phase !== 'write'){ step('Empezó a escribir'); S.phase = 'write'; setW('Escribiendo'); } S.words = (String(txt).match(/\S+/g) || []).length; px.speed(1 + Math.floor(S.words / 120)); },
    note(txt){ step(txt); },
    finish(r = {}){
      if (S.done) return; S.done = true; clearInterval(iv); px.stop();
      step(r.error ? 'No pudo responder' : r.aborted ? 'La detuviste' : 'Terminó');
      const t = ((r.ms != null ? r.ms : performance.now() - S.t0) / 1000).toFixed(1).replace('.', ',');
      w.textContent = r.error ? 'No respondió' : S.reason ? 'Pensó y respondió en ' + t + ' s' : 'Respondió en ' + t + ' s';
      sm.textContent = fmt(S.words) + (S.words === 1 ? ' palabra' : ' palabras') + (r.real ? ' · ' + r.real : '');
      el.classList.add('fin'); if (!det.hidden) paintSteps();
    },
    stop(){ S.done = true; clearInterval(iv); px.stop(); }
  };
}

/* resumen guardado de una respuesta vieja: «Respondió en 2,1 s · 120 palabras ▸» con su detalle */
function workSaved(sum){
  const el = document.createElement('div'); el.className = 'work fin';
  const t = ((sum.ms || 0) / 1000).toFixed(1).replace('.', ',');
  el.innerHTML = '<button type="button" class="wk-row" aria-expanded="false"><span class="wk-t"><b class="wk-w">' + (sum.reason ? 'Pensó y respondió en ' : 'Respondió en ') + t + ' s</b><small class="wk-s">' + fmt(sum.words || 0) + ((sum.words || 0) === 1 ? ' palabra' : ' palabras') + (sum.real ? ' · ' + esc(sum.real) : '') + '</small></span><svg class="wk-c" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button><div class="wk-d" hidden><ol class="wk-steps">' + (sum.steps || []).map(([ms, x]) => '<li><em>' + (ms / 1000).toFixed(1).replace('.', ',') + ' s</em>' + esc(x) + '</li>').join('') + '</ol><div class="wk-r"' + (sum.reason ? '' : ' hidden') + '><b>Lo que pensó la IA</b><p></p></div></div>';
  if (sum.reason) $('.wk-r p', el).textContent = sum.reason;
  const row = $('.wk-row', el), det = $('.wk-d', el);
  row.addEventListener('click', () => { const on = det.hidden; det.hidden = !on; row.setAttribute('aria-expanded', String(on)); el.classList.toggle('open', on); });
  return el;
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
  if (p.id === 'openrouter' && /data policy|guardrail|ZDR|privacy/i.test(m)) return 'OpenRouter bloqueó los modelos gratis por la privacidad de tu cuenta. Entra a openrouter.ai/settings/privacy y activa los modelos gratis (los que pueden guardar datos); apaga «solo ZDR». Luego vuelve a intentarlo.';
  if (status === 401 || status === 403 || (status === 400 && /api key/i.test(m))) return 'La llave de ' + p.name + ' no es válida o no tiene permiso. Revísala y vuelve a pegarla.';
  if (status === 402) return p.id === 'openrouter' ? 'Tu saldo de OpenRouter está en negativo o ese modelo no es gratis. Elige un modelo gratis o cambia a Puter.' : 'Ese modelo necesita crédito en ' + p.name + '. Elige uno marcado como gratis.';
  if (status === 404) return 'Ese modelo no está disponible ahora mismo en ' + p.name + '. Elige otro de la lista.';
  if (status === 429) return p.id === 'openrouter' ? 'Llegaste al límite gratis de OpenRouter: 20 mensajes por minuto y 50 al día (1.000 al día si compraste 10 créditos o más). Espera un poco o cambia a Puter.' : 'Llegaste al límite gratuito de ' + p.name + '. Espera un minuto o elige otra IA.';
  if (status === 408 || status >= 500) return p.name + ' o esa IA están muy ocupadas. Prueba de nuevo en un momento o elige otra.';
  /* lo técnico no se muestra: solo un mensaje corto y entendible */
  const human = m && m.length < 140 && !/[{}<>\[\]]|stack|exception|undefined|null/i.test(m);
  return p.name + ' no pudo responder' + (human ? ': ' + m : ' (código ' + status + ')') + '. Prueba de nuevo o elige otra IA.';
}
const netMsg = p => 'No pude conectar con ' + p.name + '. Revisa tu internet y vuelve a intentarlo. Si usas un bloqueador de anuncios, apágalo para este sitio.';

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
    try{ if (!puter.auth.isSignedIn()) await puter.auth.signIn({ attempt_temp_user_creation:true }); }catch(e){ throw new Error(e && (e.error === 'popup_blocked' || e.code === 'popup_blocked') ? 'Tu navegador no dejó abrir la ventanita de Puter. Permite las ventanitas de este sitio (el icono al final de la barra de arriba) y vuelve a intentar.' : 'No terminaste de entrar a Puter. Inténtalo otra vez.'); }
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
const MARK_HTML = '<svg class="mark" viewBox="0 0 44 30" fill="none" aria-hidden="true"><g class="sw sw1"><circle class="b1" cx="11" cy="15" r="10" fill="#8fb0ff" fill-opacity=".85"/></g><g class="sw sw2"><circle class="b2" cx="22" cy="15" r="10" fill="#c9566c" fill-opacity=".8"/></g><g class="sw sw3"><circle class="b3" cx="33" cy="15" r="10" fill="#ff8f7a" fill-opacity=".75"/></g><text class="mk-s" x="22" y="21.4" text-anchor="middle">S</text><text class="mk-z" x="28" y="26" text-anchor="middle">z</text></svg>';
const SXC = '<svg class="sxc" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="sxg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fb0ff"/><stop offset=".55" stop-color="#c9566c"/><stop offset="1" stop-color="#e6b65f"/></linearGradient></defs><circle cx="12" cy="12" r="10.5" fill="url(#sxg)"/><circle cx="12" cy="12" r="7.6" fill="none" stroke="rgba(11,12,16,.32)" stroke-width="1.1"/><path d="M14.7 9.3c-.5-.8-1.5-1.4-2.8-1.4-1.6 0-2.7.8-2.7 2 0 2.7 5.7 1.4 5.7 4.1 0 1.3-1.2 2.2-2.9 2.2-1.3 0-2.5-.6-3-1.6" transform="translate(-1.4 -1.3)" fill="none" stroke="#0b0c10" stroke-width="1.8" stroke-linecap="round"/><path d="M14.7 14.6l2.4 2.4M17.1 14.6l-2.4 2.4" stroke="#0b0c10" stroke-width="1.35" stroke-linecap="round"/></svg>';
const coins = n => fmt(n);   /* v1.3: ya no existen las monedas; queda solo el número */
const metaOf = r => r.cached ? 'respuesta guardada · no gastó nada' : 'tardó ' + (r.ms / 1000).toFixed(1).replace('.', ',') + ' s';
/* últimos 20 mensajes, siempre empezando por uno del usuario (Gemini y otras APIs lo exigen) */
function history(chat){
  const h = chat.slice(-20).map(m => ({ role:m.role, content:m.content }));
  while (h.length && h[0].role !== 'user') h.shift();
  return h;
}

/* ---------- IA que no funcionan: se esconden para que nadie choque con ellas ----------
   Cada navegador recuerda las que fallaron por culpa del modelo (no de tu llave) y las comparte con SynthZ.
   Si varias personas reportan la misma, se esconde para todos unas horas; si vuelve a responder, reaparece. */
const BAD_KEY = 'synthz:bad', BAD_MS = 12 * 3600e3;
let BAD = {}; try{ BAD = JSON.parse(localStorage.getItem(BAD_KEY)) || {}; }catch(e){ BAD = {}; }
const saveBad = () => { try{ localStorage.setItem(BAD_KEY, JSON.stringify(BAD)); }catch(e){} };
function isBad(id){ const t = BAD[id]; return !!t && Date.now() - t < BAD_MS; }
/* ¿el error es culpa del modelo? (y no de la llave, el saldo, el límite o la privacidad de la cuenta) */
function modelGone(status, msg){
  msg = String(msg || '');
  if (/data policy|guardrail|ZDR|privacy|api key|unauthor|credit|insufficient|rate.?limit|too many|quota/i.test(msg)) return false;
  return status === 404 || /not a valid model|unavailable for free|no endpoints found|model.{0,20}(not found|does not exist|decommission|deprecat)|model_not_found|no longer (available|supported)/i.test(msg);
}
function markBad(id, share){
  if (!id || /^tr:/.test(id)) return;
  BAD[id] = Date.now(); saveBad();
  if (share !== false) fetch('/api/health', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ id, ok:false }), keepalive:true }).catch(() => {});
}
function markGood(id){
  if (BAD[id]){ delete BAD[id]; saveBad(); }
  try{ const k = 'synthz:good:' + id; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1'); }catch(e){}
  if (SRV_BAD.has(id)) fetch('/api/health', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ id, ok:true }), keepalive:true }).catch(() => {});
}
const SRV_BAD = new Set();
const badReady = fetch('/api/health').then(r => r.ok ? r.json() : { bad:[] }).then(d => { (d.bad || []).forEach(x => { if (x && typeof x.id === 'string'){ SRV_BAD.add(x.id); if (!BAD[x.id]) BAD[x.id] = +x.t || Date.now(); } }); saveBad(); return SRV_BAD; }).catch(() => SRV_BAD);
const groqName = id => String(id).replace(/^[^/]+\//, '').split(/[-_]/).map(w => /^gpt$/i.test(w) ? 'GPT' : /^oss$/i.test(w) ? 'OSS' : /^\d+(\.\d+)?b$/i.test(w) ? w.toUpperCase() : /^[a-z]/.test(w) ? w[0].toUpperCase() + w.slice(1) : w).join(' ');
/* ===== IA de SynthZ: modelos gratis compartidos, con un tope diario por persona ===== */
const DEVH = (/^[\w-]{12,48}$/.test(DEV) ? DEV : (String(DEV).replace(/[^\w-]/g, '') + 'synthzdevice').slice(0, 24));
const SZQ = { on:null, used:0, limit:20000, n:0, t:0, guest:null };
function szqSet(o){ Object.assign(SZQ, o); try{ dispatchEvent(new CustomEvent('synthz-szq', { detail:SZQ })); }catch(e){} }
const szHeaders = () => { const h = { 'content-type':'application/json', 'x-sz-device':DEVH }; if (SESS) h.authorization = 'Bearer ' + SESS; return h; };
const SZ_VEND = [[/llama|meta/i, 'meta-llama'], [/gemma|gemini/i, 'google'], [/mistral|mixtral|codestral|ministral|magistral|devstral|pixtral|open-mi/i, 'mistralai'], [/qwen|qwq/i, 'qwen'], [/deepseek/i, 'deepseek'], [/gpt-oss|openai/i, 'openai'], [/kimi|moonshot/i, 'moonshotai'], [/glm|z-ai/i, 'z-ai'], [/nemotron|nvidia/i, 'nvidia'], [/phi-|microsoft/i, 'microsoft'], [/granite|ibm/i, 'ibm'], [/hermes|nous/i, 'nousresearch']];
const szVendor = (mid, prov) => (SZ_VEND.find(([rx]) => rx.test(mid)) || [0, prov])[1];
const SZ_AUTO = { id:'sz:auto', name:'Automática', vendor:'synthz', vlabel:'Elige sola la mejor', ctx:0, free:true, created:4e9, vision:false, reasoning:true, tools:false, desc:'Elige sola la mejor IA que esté libre en este momento. Si una se llena, pasa a otra sin que hagas nada.' };
/* ---------- límite de hoy: se muestra en mensajes (más fácil que contar «tokens») ---------- */
const MSG_TOK = 800;
/* sin cuenta: unos pocos mensajes de prueba al día; luego hay que entrar (gratis) */
/* con sesión guardada (o volviendo de Google) ya cuentas como persona con cuenta, aunque tu cuenta tarde un segundo en cargar */
const signedish = () => !!(ACC && (ACC.ready || ACC.joining || (SESS && !ACC.err)));
const isGuestQ = () => !!(SZQ.guest && !signedish());
const guestFull = () => isGuestQ() && (SZQ.guest.used || 0) >= (SZQ.guest.max || 5);
const limPct = () => Math.max(SZQ.limit ? Math.min(1, (SZQ.used || 0) / SZQ.limit) : 0, isGuestQ() ? Math.min(1, (SZQ.guest.used || 0) / (SZQ.guest.max || 5)) : 0);
const msgsLeft = () => Math.max(0, Math.floor(((SZQ.limit || 25000) - (SZQ.used || 0)) / MSG_TOK));
const msgsTotal = () => Math.max(1, Math.round((SZQ.limit || 25000) / MSG_TOK));
/* v2.4: vuelven las SynXCoin's. 1 SynXCoin = 1 palabra (lo que escribes y lo que te responde). El servidor cuenta en tokens; una palabra son unos 4/3 de token */
const WORD_TOK = 4 / 3;
const coinsOf = tok => Math.max(0, Math.round((+tok || 0) / WORD_TOK));
const coinsLeft = () => coinsOf((SZQ.limit || 25000) - (SZQ.used || 0));
const coinsTotal = () => coinsOf(SZQ.limit || 25000);
const coinsFmt = n => Math.round(n).toLocaleString('es');
const coinsShort = n => n >= 10000 ? (Math.floor(n / 100) / 10).toLocaleString('es') + ' mil' : coinsFmt(n);
/* recibo de cada respuesta: cuántas SynXCoin's gastó y cuántas te quedan (solo con las IAs conectadas; Puter no gasta SynXCoin's) */
const coinNote = (mid, r) => /^sz:/.test(String(mid)) && r && !r.cached && ((r.prompt || 0) + (r.completion || 0)) > 0 ? ' · gastó ' + coinsFmt(Math.max(1, coinsOf((r.prompt || 0) + (r.completion || 0)))) + ' SynXCoin\'s · te quedan ' + coinsFmt(coinsLeft()) : '';
const limTxt = () => SZQ.on === false ? 'Las IAs gratis están descansando' : guestFull() ? 'Entra a tu cuenta para seguir FlowIAndo' : isGuestQ() ? 'Te quedan ' + Math.max(0, (SZQ.guest.max || 5) - (SZQ.guest.used || 0)) + ' mensajes de prueba' : limPct() >= 1 ? 'Usaste tus SynXCoin\'s de hoy' : 'Te quedan ' + coinsFmt(coinsLeft()) + ' SynXCoin\'s';
const limShort = () => SZQ.on === false ? 'Descansando' : guestFull() ? 'Entra para seguir' : isGuestQ() ? Math.max(0, (SZQ.guest.max || 5) - (SZQ.guest.used || 0)) + ' de prueba' : limPct() >= 1 ? 'Agotado por hoy' : coinsShort(coinsLeft()) + ' SynXCoin\'s';
const limLvl = () => { const k = limPct(); return k >= 1 ? 'full' : k >= .8 ? 'warn' : 'ok'; };
/* anillo de vidrio que se va vaciando */
function limRing(size){ const k = 1 - limPct(), r = 15.5, c = 2 * Math.PI * r; return '<svg class="lring ' + limLvl() + '" viewBox="0 0 36 36" width="' + (size || 22) + '" height="' + (size || 22) + '" aria-hidden="true"><circle cx="18" cy="18" r="' + r + '" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="4"/><circle cx="18" cy="18" r="' + r + '" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - k)).toFixed(1) + '" transform="rotate(-90 18 18)"/></svg>'; }
function limBar(o = {}){
  const k = 1 - limPct();
  return '<div class="lbar ' + limLvl() + '"><div class="lb-h"><b>' + (o.title || 'Tu límite de hoy') + '</b><span>' + limTxt() + '</span></div><div class="lb-t"><i style="transform:scaleX(' + k.toFixed(3) + ')"></i></div>' + (o.small === false ? '' : '<small>' + (isGuestQ() ? 'Sin cuenta tienes ' + (SZQ.guest.max || 5) + ' mensajes de prueba al día. Con tu cuenta gratis tienes mucho más. ' : '') + 'Gratis. 1 SynXCoin = 1 palabra, contando lo que escribes y lo que te responde. A medianoche se llenan otra vez.' + (o.puter ? ' Si se acaba, puedes seguir con Puter: tu versión pro de las IAs más usadas.' : '') + '</small>') + '</div>';
}
async function szCatalog(){
  let r; try{ r = await fetch('/api/ai', { headers:szHeaders() }); }catch(e){ throw Object.assign(new Error('net'), { net:true }); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok){ szqSet({ on:false, t:Date.now() }); return []; }
  const arr = Array.isArray(d.models) ? d.models : [];
  szqSet({ on:arr.length > 0, used:+d.used || 0, limit:+d.limit || 20000, guest:d.guest && d.guest.max ? { used:+d.guest.used || 0, max:+d.guest.max } : null, img:d.img || null, alert:!!d.alert, alertN:+d.alertN || 0, n:arr.length, t:Date.now() });
  if (!arr.length) return [];
  const out = arr.filter(m => m && typeof m.id === 'string' && /^sz:/.test(m.id) && !/allam|infron|openrouter\/(free|auto)|models?[-_ ]router/i.test(m.id) && !/free models router|router/i.test(String(m.name || ''))).map(m => {
    const mid = m.id.split(':').slice(2).join(':'), vendor = szVendor(mid, m.prov);
    return { id:m.id, name:String(m.name || mid).replace(/\s*\(free\)\s*$/i, ''), vendor, vlabel:vendorLabel(vendor) + ' · SynthZ', ctx:num(m.ctx), free:true, created:0, vision:false,
      reasoning:/gpt-oss|qwen3|qwq|r1|reason|think|magistral|kimi|deepseek/i.test(mid), tools:false, desc:'Gratis: no necesitas cuenta ni nada.' };
  });
  return [SZ_AUTO, ...out];
}
/* créditos de Puter: si ya no te quedan, ni lo intento (así Puter no muestra su ventana de «saldo bajo») */
let puC = { t:0, out:false };
async function puterOut(force){
  if (!force && Date.now() - puC.t < 300000) return puC.out;
  try{
    if (!(window.puter && puter.auth && typeof puter.auth.getMonthlyUsage === 'function' && puter.auth.isSignedIn())) return false;
    const u = await Promise.race([puter.auth.getMonthlyUsage(), sleepRaw(2500).then(() => null)]); if (!u) return puC.out;
    const a = u.allowanceInfo || {}, tot = +a.monthUsageAllowance || 0, rem = +a.remaining;
    puC = { t:Date.now(), out:tot > 0 && Number.isFinite(rem) && rem < Math.max(1, tot * .01) };
  }catch(e){ puC = { t:Date.now(), out:puC.out }; }
  return puC.out;
}
const puterSetOut = () => { puC = { t:Date.now(), out:true }; };
let puOutNoted = false;
function puterOutNote(){ if (puOutNoted) return; puOutNoted = true; toast('Usaste el saldo de este mes de Puter: sigo con las IAs conectadas'); telEv('puter_out', ''); try{ dispatchEvent(new CustomEvent('synthz-puter-out')); }catch(e){} }
/* Puter abre su propia ventana de «Low Balance / Upgrade Now»: en SynthZ no se muestra (pasamos a las IAs conectadas sin cobrar nada) */
(function noPuterUpsell(){
  const RX = /low balance|upgrade now|insufficient funds|out of credits|add credits|top.?up/i;
  const txt = n => { try{ return (n.textContent || '') + ' ' + (n.shadowRoot ? n.shadowRoot.textContent || '' : ''); }catch(e){ return ''; } };
  const STRONG = /low balance|upgrade now/i;
  const check = n => { if (!n || n.nodeType !== 1 || !n.isConnected || n.closest('#szBotP,.szm,#portal')) return; const tag = n.tagName || '', t = txt(n), theirs = /^PUTER|DIALOG/.test(tag) || /puter/i.test(n.id || '') || /puter/i.test(String(n.className || '')); if (STRONG.test(t) || (theirs && RX.test(t))){ n.remove(); puterSetOut(); } };
  const start = () => { try{ new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { check(n); [60, 300, 1200].forEach(t => setTimeout(() => check(n), t)); }))).observe(document.body, { childList:true }); }catch(e){} };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();

/* ===== pulso de SynthZ: «sigo aquí» cada 3 min y avisos cortos cuando algo falla (sin mensajes ni chats) ===== */
const TEL = { since:Date.now(), msgs:0, errs:0, ai:'', locked:false, last:{} };
const telPage = () => (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
function telEv(kind, detail){
  try{
    const now = Date.now(); if (now - (TEL.last[kind] || 0) < 60000) return; TEL.last[kind] = now;
    if (kind === 'error' || kind === 'jserror') TEL.errs++;
    fetch('/api/health', { method:'POST', headers:szHeaders(), body:JSON.stringify({ action:'ev', kind, page:telPage(), detail:String(detail || '').slice(0, 160) }), keepalive:true }).catch(() => {});
  }catch(e){}
}
let beatT = 0, beatAt = 0;
async function telBeat(){
  clearTimeout(beatT); beatT = setTimeout(telBeat, 180000);
  if (document.hidden) return; beatAt = Date.now();
  try{
    const r = await fetch('/api/health', { method:'POST', headers:szHeaders(), body:JSON.stringify({ action:'beat', page:telPage(), state:{ since:TEL.since, msgs:TEL.msgs, ai:TEL.ai, locked:TEL.locked, mobile:matchMedia('(max-width:760px)').matches, errs:TEL.errs } }) });
    const d = r.ok ? await r.json() : {};
    if (d.help) try{ dispatchEvent(new CustomEvent('synthz-help-ping')); }catch(e){}
  }catch(e){}
}
setTimeout(telBeat, 4000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - beatAt > 170000) telBeat(); });
addEventListener('error', e => { if (!e || !e.message || /ResizeObserver|Script error/i.test(e.message)) return; telEv('jserror', e.message + ' @' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || 0)); });
addEventListener('unhandledrejection', e => { const m = e && e.reason && (e.reason.message || String(e.reason)); if (!m || /abort|Detenido|net|Failed to fetch|NetworkError|load failed/i.test(m)) return; telEv('jserror', 'promesa: ' + m); });
try{ const nv = performance.getEntriesByType('navigation')[0]; if (nv && nv.type === 'reload') setTimeout(() => telEv('reload', 'recargó la página'), 2500); }catch(e){}

/* ===== catálogo de modelos de OpenRouter, en vivo (la lista es pública: no necesita llave) ===== */
const CAT_KEY = 'synthz:catalog-v6';
/* «Qwen: Qwen3 235B (free)» → «Qwen3 235B»: solo el nombre */
/* «OpenAI: GPT-5» → «GPT-5», pero «Deepseek V4 Pro:0813» → «Deepseek V4 Pro 0813» (antes quedaba solo «0813») */
const cleanName = n => String(n || '').replace(/\s*\([^)]*\)\s*/g, ' ').replace(/^[^:]{1,24}:\s+/, '').replace(/:(?=\S)/g, ' ').replace(/\s+/g, ' ').trim() || String(n || '');
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
      return { t:num(s.t), list:s.list.filter(m => m && typeof m.id === 'string' && typeof m.name === 'string').map(m => ({ id:m.id, name:m.name, vendor:String(m.vendor || m.id.split('/')[0]), vlabel:String(m.vlabel || vendorLabel(m.vendor)), ctx:num(m.ctx), free:!!m.free, created:num(m.created), vision:!!m.vision, reasoning:!!m.reasoning, tools:!!m.tools, spend:Math.max(0, Math.min(3, num(m.spend))), desc:String(m.desc || '') })) };
  }catch(e){}
  return null;
}
async function fetchCatalog(){
  const pu = async () => {
    if (!window.puter) throw new Error('sin puter');
    const arr = await puter.ai.listModels(), seen = new Set(), out = [];
    (Array.isArray(arr) ? arr : []).forEach(m => {
      if (!m || !m.id || seen.has(m.id) || /image|dall|tts|whisper|embed|moderat|video|sora|imagen|flux|stable|transcri|speech|rerank|lyria|music|audio/i.test(m.id) || /:(batch|flex|priority)$/i.test(m.id)) return;
      seen.add(m.id);
      const vendor = String(m.provider || String(m.id).split('/')[0] || 'otro').replace(/-completion$/, '');
      /* cuánto gasta de tu Puter: según su precio por millón de palabras (input + output) */
      const c = m.cost || {}, per = +c.tokens > 0 ? 1e6 / +c.tokens : 1, price = ((+c.output || 0) * 3 + (+c.input || 0)) / 4 * per;   /* centavos de dólar por millón (más peso a lo que responde) */
      const spend = !c.output && !c.input ? 0 : price <= 120 ? 1 : price <= 1000 ? 2 : 3;
      out.push({ id:'pu:' + m.id, name:String(m.name || m.id), vendor, vlabel:vendorLabel(vendor) + ' · Puter', ctx:num(m.context), free:true, created:0, spend,
        vision:/gpt-4|gpt-5|gemini|claude|vision|pixtral|llava|-vl|grok|llama-4/i.test(m.id), reasoning:/reason|think|r1|o1|o3|o4|gpt-5|gemini-(2\.5|3)|claude|qwq|gpt-oss/i.test(m.id), tools:true, desc:'' });
    });
    if (!out.length) [['gpt-5.4-nano', 'GPT 5.4 Nano', 'openai'], ['gpt-5.6-luna', 'GPT 5.6 Luna', 'openai'], ['gemini-3.5-flash-lite', 'Gemini 3.5 Flash Lite', 'google']].forEach(([id, name, v]) => out.push({ id:'pu:' + id, name, vendor:v, vlabel:vendorLabel(v) + ' · Puter', ctx:0, free:true, created:0, vision:true, reasoning:/gpt-5/.test(id), tools:true, desc:'' }));
    return out;
  };
  const orr = async () => parseModels(await getJSON('https://openrouter.ai/api/v1/models')).filter(m => !/lyria|music|audio/i.test(m.id)).map(m => ({ ...m, id:'or:' + m.id, vlabel:m.vlabel + ' · OpenRouter' }));
  /* Groq: solo si la persona pegó su llave (la lista pide llave) */
  const gq = async () => {
    const k = state.keys.groq; if (!k) return [];
    const d = await getJSON(GROQ_P.url + '/models', { Authorization:'Bearer ' + k });
    return (d.data || []).filter(m => m && m.id && m.active !== false && !/whisper|guard|tts|playai|orpheus|distil|prompt-guard|safeguard|compound/i.test(m.id)).map(m => {
      const vendor = String(m.owned_by || m.id.split('/')[0] || 'groq').toLowerCase().replace(/\s+.*$/, '').replace('meta', 'meta-llama');
      return { id:'gq:' + m.id, name:groqName(m.id), vendor, vlabel:vendorLabel(vendor) + ' · Groq', ctx:num(m.context_window), free:true, created:num(m.created), vision:/vision|llama-4|scout|maverick/i.test(m.id), reasoning:/gpt-oss|qwen3|r1|reason|kimi/i.test(m.id), tools:true, desc:'Muy rápida: corre en los chips de Groq con tu propia llave.' };
    });
  };
  /* beta 2: nadie tiene que pegar llaves. OpenRouter y Groq solo aparecen si ya tenías tu llave (o tu equipo) de antes */
  const legacyOr = false;          /* beta 2: OpenRouter y Groq nunca se muestran a las personas */
  const [s, a, b, g] = await Promise.allSettled([szCatalog(), legacyOr ? orr() : Promise.resolve([]), pu(), Promise.resolve([])]);
  const list = [...(s.status === 'fulfilled' ? s.value : []), ...(g.status === 'fulfilled' ? g.value : []), ...(a.status === 'fulfilled' ? a.value : []), ...(b.status === 'fulfilled' ? b.value : [])].filter(m => !isBad(m.id) && !/allam|infron/i.test(m.id + ' ' + m.vendor + ' ' + m.name)).map(m => Object.assign(m, { name:cleanName(m.name) }));
  if (!list.length) throw Object.assign(new Error('vacío'), ((s.reason && s.reason.net) || (a.reason && a.reason.net)) ? { net:true } : { empty:true });
  const t = Date.now();
  try{ localStorage.setItem(CAT_KEY, JSON.stringify({ t, list })); }catch(e){}
  return { t, list };
}

/* chispas de color: celebran una acción lograda */
function burst(x, y, cols = ['#8fb0ff', '#c9566c', '#ff8f7a', '#f2b36b', '#7fd6b8'], n = 16){
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
  const LINK = 'a[href], button, select, summary, label.ckb, input[type=checkbox], input[type=radio], .chip, [role=tab], [data-hover]';
  /* en toda la web lo que se puede tocar muestra la manita; los switches van sin vidrio encima para que se vea su animación */
  const NOGLASS = '#curChip, #curChip *, .mchip, .mchip *, .cfgsw, .sxsw, [role=switch], .sfb, #szBot, .mi, .mi *, .rcard, .rcard *, input[type=checkbox], label.ckb, .cnv-b, .flowbtn, .flowbtn *';   /* v1.8: «Empezar a FlowIA’r» tiene su propio efecto (la copia de vidrio lo partía en dos y escondía la carita) */   /* v1.4: en la lista de IA el vidrio tapaba «Comparar» y la estrella */
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

  const PROPS = ['color','fontSize','fontWeight','fontFamily','fontStyle','letterSpacing','lineHeight','display','alignItems','justifyContent','gap','flexDirection','paddingTop','paddingRight','paddingBottom','paddingLeft','width','height','backgroundColor','borderRadius','boxShadow','opacity','textDecorationLine','textDecorationColor','textUnderlineOffset','whiteSpace','textAlign','boxSizing','filter','backgroundImage','backgroundSize','textTransform','overflow','textOverflow','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','borderTopStyle','borderRightStyle','borderBottomStyle','borderLeftStyle','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','maxWidth','maxHeight','minWidth','flexShrink','flexGrow','flexBasis'];
  function copyStyles(o, c, isRoot){
    const cs = getComputedStyle(o);
    PROPS.forEach(k => { c.style[k] = cs[k]; });
    c.style.margin = '0'; c.style.position = 'static'; c.style.transform = 'none'; c.style.transition = 'none';
    /* las piezas escondidas o puestas encima (p. ej. el numerito de comparar, en escala 0) se copian igual: si no, salía una «bolita blanca» debajo del icono */
    if (!isRoot){
      if ((cs.position === 'absolute' || cs.position === 'fixed') && (/^matrix\(0, 0, 0, 0/.test(cs.transform) || +cs.opacity === 0 || cs.display === 'none')) c.style.display = 'none';
    }
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
          hand = true;
          if (!l.matches(NOGLASS)){ m = 'link'; h = l; }          /* el switch se anima solo: sin vidrio ni copia encima */
        }
      }
    }
    cm = m; cr.classList.toggle('txt', m === 'text'); cr.classList.toggle('link', m === 'link');
    visT = m === 'idle' || hand ? 1 : 0; cd.classList.toggle('mini', visT === 0); cd.classList.toggle('hand', hand);
    setHover(h);
  }
  /* en el menú de configuración, la copia nítida se rehace tras el clic para mostrar el estado nuevo */
  addEventListener('click', () => { const el = hov; if (el) [40, 420].forEach(ms => setTimeout(() => { if (hov === el && el.isConnected){ const tr = el.style.transition; el.style.transition = 'none'; el.classList.remove('cur-hov'); buildLabel(el); el.classList.add('cur-hov'); void el.offsetWidth; el.style.transition = tr; } }, ms)); }, true);
  /* si lo que está bajo el cursor termina de aparecer (p. ej. los nombres de la barrita al abrirse), la copia nítida se rehace */
  addEventListener('transitionend', e => {
    const el = hov; if (!el || e.target === el || !el.contains(e.target) || !/opacity|max-width|filter/.test(e.propertyName)) return;
    clearTimeout(el._rb); el._rb = setTimeout(() => { if (hov !== el || !el.isConnected) return; const tr = el.style.transition; el.style.transition = 'none'; el.classList.remove('cur-hov'); buildLabel(el); el.classList.add('cur-hov'); void el.offsetWidth; el.style.transition = tr; }, 30);
  }, true);
  S.retarget = () => { if (active && Math.abs(sv) <= 3 && !root.classList.contains('lock')) pick(document.elementFromPoint(px, py)); };

  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    if (!CFG.cursor){ if (active){ active = false; root.classList.remove('cursor-on', 'cursor-bar'); } return; }   /* v1.8: apagado en Ajustes → vuelve el cursor normal al instante */
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
    /* v2.3: si lo que tenía el vidrio se rehizo en el DOM (p. ej. la IA de la caja al elegir otra), se suelta la copia vieja y se busca lo que hay debajo */
    if (hov && !hov.isConnected){ cl.style.opacity = '0'; cl.innerHTML = ''; lblEl = null; lblSync = null; hov = null; pick(document.elementFromPoint(px, py)); }
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
  /* v1.3: el dueño prefirió la rayita normal del navegador (la propia se quitó) */
  let prev = '', kind = '';
  let cssOk = false;   /* v2.3: copiar el estilo de la caja solo cuando cambia (antes, en cada letra: frenaba el celular) */
  const css = () => { if (cssOk) return; cssOk = true; const c = getComputedStyle(ta); ['font', 'padding', 'lineHeight', 'letterSpacing', 'textIndent', 'tabSize'].forEach(k => { m.style[k] = c[k]; }); };
  const spans = s => [...s].map((ch, i) => '<span class="nw" style="animation-delay:' + Math.min(i * 12, 420) + 'ms">' + esc(ch) + '</span>').join('');
  /* dónde queda la letra número «off» dentro del espejo */
  function rectAt(off){
    const w = document.createTreeWalker(m, NodeFilter.SHOW_TEXT); let n, left = off;
    while ((n = w.nextNode())){
      const L = n.nodeValue.length;
      if (left <= L && !(left === L && n.nodeValue !== '​' && w.nextNode && false)){
        const r = document.createRange();
        if (left < L){ r.setStart(n, left); r.setEnd(n, left + 1); const rs = r.getClientRects(); if (rs.length) return { x:rs[0].left, y:rs[0].top, h:rs[0].height }; }
        if (left > 0){ r.setStart(n, left - 1); r.setEnd(n, left); const rs = r.getClientRects(); if (rs.length){ const q = rs[rs.length - 1]; return { x:q.right, y:q.top, h:q.height }; } }
      }
      left -= L; if (left < 0) break;
    }
    const fr = m.getBoundingClientRect(), c = getComputedStyle(ta);
    return { x:fr.left + parseFloat(c.paddingLeft), y:fr.top + parseFloat(c.paddingTop), h:parseFloat(c.lineHeight) || 20 };
  }
  function placeCaret(){}
  /* al borrar: las letras se desprenden, flotan y se desvanecen */
  function ghosts(txt, from){
    if (!txt || root.classList.contains('noanim')) return;
    const fr = fld.getBoundingClientRect(), list = [...txt].slice(-36);
    list.forEach((ch, i) => {
      if (!ch.trim()) return;
      const p = rectAt(from + (txt.length - list.length) + i), g = document.createElement('span');
      g.className = 'mghost'; g.textContent = ch; g.style.font = getComputedStyle(ta).font;
      g.style.left = (p.x - fr.left) + 'px'; g.style.top = (p.y - fr.top) + 'px'; fld.appendChild(g);
      const dx = (Math.random() - .5) * 26, rot = (Math.random() - .5) * 50, d = Math.min(i, 20) * 14;
      g.animate([{ transform:'translate(0,0) rotate(0)', opacity:1, filter:'blur(0)', color:'#ecebe7' }, { transform:'translate(' + (dx * .4) + 'px,-6px) rotate(' + (rot * .3) + 'deg) scale(1.15)', opacity:1, color:'#ff8f7a', offset:.25 }, { transform:'translate(' + dx + 'px,-26px) rotate(' + rot + 'deg) scale(.4)', opacity:0, filter:'blur(4px)', color:'#c9566c' }], { duration:620, delay:d, easing:'cubic-bezier(.22,1,.36,1)', fill:'both' }).onfinish = () => g.remove();
    });
  }
  const sync = () => {
    const v = ta.value;
    if (v === prev){ m.scrollTop = ta.scrollTop; placeCaret(false); return; }
    css();
    let a = 0; while (a < prev.length && a < v.length && prev[a] === v[a]) a++;
    let b = 0; while (b < prev.length - a && b < v.length - a && prev[prev.length - 1 - b] === v[v.length - 1 - b]) b++;
    const mid = v.slice(a, v.length - b), gone = prev.slice(a, prev.length - b);
    if (gone && /^delete/.test(kind)) ghosts(gone, a);
    if (b === 0 && a === prev.length && m.lastChild && m.lastChild.nodeType === 3 && prev){
      const t = document.createElement('template'); t.innerHTML = spans(mid); m.insertBefore(t.content, m.lastChild);
    } else {
      m.innerHTML = esc(v.slice(0, a)) + spans(mid) + esc(v.slice(v.length - b));
      m.appendChild(document.createTextNode('​'));
    }
    prev = v; m.scrollTop = ta.scrollTop; kind = '';
    placeCaret(mid.length > 0 && mid.length < 4);
    /* cuando terminan las animaciones, el espejo vuelve a ser texto normal (corta las palabras igual que la caja) */
    clearTimeout(m._n); m._n = setTimeout(() => { if (ta.value === prev && m.querySelector('.nw')){ m.textContent = prev; m.appendChild(document.createTextNode('\u200b')); m.scrollTop = ta.scrollTop; placeCaret(false); } }, 900);
  };
  ta._sync = sync;
  ta.addEventListener('beforeinput', e => { kind = e.inputType || ''; });
  ta.addEventListener('input', sync);
  ta.addEventListener('scroll', () => { m.scrollTop = ta.scrollTop; placeCaret(false); });
  ['focus', 'click', 'keyup', 'select'].forEach(ev => ta.addEventListener(ev, () => requestAnimationFrame(() => placeCaret(false))));
  /* (sin rayita propia) */
  document.addEventListener('selectionchange', () => { if (document.activeElement === ta) placeCaret(false); });
  addEventListener('resize', () => { cssOk = false; placeCaret(false); });
  ta.addEventListener('focus', () => { cssOk = false; });
  m.appendChild(document.createTextNode('​')); sync();
}
/* golpe suave de cristal: como el clic del mouse pero más lento, borroso y con efecto glass */
function thud(x, y){
  if (reduce || !CFG.glass) return;   /* v2.3: sin vidrio (celulares) no hay golpe de cristal: era de lo más pesado al tocar */
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
/* ---------- portal SynthZ ⇄ SynthFlow (v1.3: en tiempo real, con los logos de vidrio) ----------
   ida:   «SynthZ» sale de su esquina y llega al centro → la Z de vidrio se derrite en vivo y se vuelve «Flow»
          (queda «SynthFlow») → la barrita de luz se come «Synth» → la cámara entra en la «o»
   vuelta: lo mismo al revés y «SynthZ» vuelve a su esquina
   mientras dura, la página no se puede tocar (ni con el ratón ni con el teclado) */
const FO = { x:.517, y:.62, w:.085 };      /* el hueco de la «o» dentro de la imagen «Flow» */
const glassS = t => t === 'Synth' ? '<span class="gS">S</span>ynth' : esc(t);
const MELT_SVG = '<svg class="szpdefs" width="0" height="0" aria-hidden="true"><filter id="szMelt" x="-20%" y="-30%" width="140%" height="160%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';
function portalStage(){
  const o = document.createElement('div'); o.id = 'portal'; o.className = 'szportal';
  o.innerHTML = MELT_SVG + '<i class="pg"></i><div class="szpw"><span class="szps"><span>' + glassS('Synth') + '</span></span><span class="szpslot">'
    + '<span class="szpm"><img class="szpz" src="media/z-glass.webp" alt="" draggable="false"><img class="szpfl" src="media/flow-glass.webp" alt="" draggable="false"></span><i class="szpbar"></i></span></div>';
  document.body.appendChild(o);
  const q = c => o.querySelector(c), W = q('.szpw'), SY = q('.szps'), SL = q('.szpslot'), M = q('.szpm'), ZZ = q('.szpz'), FL = q('.szpfl'), BAR = q('.szpbar'), PG = q('.pg');
  const DM = q('feDisplacementMap'), TB = q('feTurbulence');
  const fs = parseFloat(getComputedStyle(W).fontSize) || 120;
  const wS = SY.firstChild.getBoundingClientRect().width;
  const wZ = fs * .84 * (284 / 256) + fs * .1, wF = fs * .8 * (412 / 200) + fs * .12;
  SY.style.width = wS + 'px'; SL.style.width = wZ + 'px';
  return { o, W, SY, SL, M, ZZ, FL, BAR, PG, DM, TB, fs, wS, wZ, wF };
}
/* la Z se derrite y se vuelve «Flow» (o al revés), en vivo: el vidrio se ondula, cambia de forma y se aquieta */
function melt(P, toFlow, D){
  P.M.style.filter = 'url(#szMelt)';
  P.SL.style.transition = 'width ' + (D * .55 / 1000).toFixed(2) + 's ' + PE; P.SL.style.width = (toFlow ? P.wF : P.wZ) + 'px';
  const a = toFlow ? P.ZZ : P.FL, b = toFlow ? P.FL : P.ZZ, s0 = Math.random() * 50;
  return tween(D, (e, k) => {
    const w = Math.sin(Math.PI * k);                                  /* sube y baja la ola */
    P.DM.setAttribute('scale', (w * P.fs * .42).toFixed(1));
    P.TB.setAttribute('baseFrequency', (0.010 + w * .006).toFixed(4) + ' ' + (0.028 + w * .02).toFixed(4));
    P.TB.setAttribute('seed', String(Math.round(s0 + k * 14)));
    const m = Math.min(1, Math.max(0, (k - .32) / .36));             /* el cambio de forma, en el medio */
    a.style.opacity = (1 - m).toFixed(3); b.style.opacity = m.toFixed(3);
    a.style.transform = 'scale(' + (1 + w * .06).toFixed(3) + ',' + (1 - w * .1).toFixed(3) + ')';
    b.style.transform = 'scale(' + (1 + w * .04).toFixed(3) + ',' + (1 - w * .06).toFixed(3) + ')';
    P.M.style.setProperty('--glow', w.toFixed(3));
  }).then(() => { P.M.style.filter = 'none'; P.DM.setAttribute('scale', '0'); a.style.transform = b.style.transform = 'none'; });
}
/* bloquea ratón, toque y teclado mientras se ve la transición */
let lockOff = null;
function portalLock(on){
  if (lockOff){ lockOff(); lockOff = null; }
  if (!on) return;
  const stop = e => { if (e.key === 'F5' || (e.key === 'r' && (e.ctrlKey || e.metaKey))) return; e.preventDefault(); e.stopPropagation(); };
  const ev = ['keydown', 'keypress', 'wheel', 'touchmove', 'mousedown', 'click', 'pointerdown'];
  ev.forEach(t => addEventListener(t, stop, { capture:true, passive:false }));
  lockOff = () => ev.forEach(t => removeEventListener(t, stop, { capture:true }));
}
const PE = 'cubic-bezier(.65,0,.35,1)', PEO = 'cubic-bezier(.22,1,.36,1)';
const tween = (D, fn, ease) => new Promise(res => { const t0 = performance.now(); (function f(now){ const k = Math.min(1, (now - t0) / D); fn(ease ? ease(k) : k, k); if (k < 1) requestAnimationFrame(f); else res(); })(t0); });
const eio = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, eout = k => 1 - Math.pow(1 - k, 3);
/* entra (o sale) por el hueco de la «o» de «Flow» */
function zoomO(P, into, D){
  P.W.style.transform = 'none'; P.W.style.transformOrigin = '0 0';
  const r = P.FL.getBoundingClientRect(), wr = P.W.getBoundingClientRect();
  const cx = r.left + r.width * FO.x, cy = r.top + r.height * FO.y, d = Math.max(6, r.width * FO.w);
  P.W.style.transformOrigin = (cx - wr.left).toFixed(1) + 'px ' + (cy - wr.top).toFixed(1) + 'px';
  const K = Math.min(60, Math.hypot(innerWidth, innerHeight) / d * 2.2), tx = innerWidth / 2 - cx, ty = innerHeight / 2 - cy;
  P.o.classList.add('zooming');      /* sin sombras ni brillos mientras se agranda: así no se traba en celulares */
  const at = q => { const z = Math.exp(Math.log(K) * q), m = Math.min(1, q * 1.6); P.W.style.transform = 'translate(' + (tx * m).toFixed(1) + 'px,' + (ty * m).toFixed(1) + 'px) scale(' + z.toFixed(4) + ')'; P.W.style.opacity = q > .82 ? Math.max(0, 1 - (q - .82) / .18).toFixed(3) : '1'; };
  return tween(D, e => at(into ? e : 1 - e), eio).then(() => { if (!into) P.o.classList.remove('zooming'); });
}
function logoRect(){
  const n = document.querySelector('#navWord');
  if (n && n.getClientRects().length){ const r = n.getBoundingClientRect(); if (r.width) return { x:r.left, y:r.top, w:r.width, h:r.height }; }
  try{ const s = JSON.parse(sessionStorage.getItem('synthz:logo') || 'null'); if (s && s.h) return s; }catch(e){}
  return { x:innerWidth < 600 ? 62 : 78, y:innerWidth < 600 ? 16 : 22, w:112, h:28 };
}
/* FLIP: la palabra completa (Synth + Z) desde/hacia el logo de la esquina */
function flyWord(P, toCorner, D){
  const R = logoRect(), W = P.W;
  W.style.transform = 'none'; W.style.transformOrigin = '0 0';
  const r = W.getBoundingClientRect(), s = R.h / (P.fs * 1.0);
  const dx = R.x - r.left, dy = R.y + R.h / 2 - (r.top + r.height / 2 * s);
  const at = q => { const k = toCorner ? q : 1 - q, sc = 1 + (s - 1) * k; W.style.transform = 'translate(' + (dx * k).toFixed(1) + 'px,' + (dy * k).toFixed(1) + 'px) scale(' + sc.toFixed(4) + ')'; W.style.filter = k > .02 && k < .98 ? 'blur(' + (Math.sin(Math.PI * k) * 1.2).toFixed(2) + 'px)' : 'none'; };
  at(0);
  return tween(D, e => at(e), eio).then(() => { W.style.filter = 'none'; });
}
const imgsReady = P => Promise.race([Promise.all([P.ZZ, P.FL].map(i => i.decode ? i.decode().catch(() => {}) : Promise.resolve())), sleepRaw(1500)]);
/* el portal es la animación del logo: se ve siempre, también en modo Rendimiento */
const PCALM = false;
/* v1.8: con «Animaciones» apagado no hay película: un fundido corto y listo (los logos siempre se ven) */
function quickGo(href, back){
  if (document.getElementById('portal')) return;
  try{ sessionStorage.setItem(back ? 'synthz:back' : 'synthz:portal', 'fade'); }catch(e){}
  const v = document.createElement('div'); v.id = 'portal'; v.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:#0b0c10;opacity:0;transition:opacity .18s ease';
  document.body.appendChild(v); requestAnimationFrame(() => { v.style.opacity = '1'; });
  setTimeout(() => { location.href = href; }, 200);
}
async function portalOut(href){
  if (document.getElementById('portal')) return;
  if (reduce && !(typeof EV !== 'undefined' && EV.pending())) return quickGo(href, false);
  let gone = false; const go = () => { if (gone) return; gone = true; location.href = href; };
  root.classList.add('leaving'); S.busy(true); portalLock(true); setTimeout(go, 12000);
  try{ const R = logoRect(); sessionStorage.setItem('synthz:logo', JSON.stringify(R)); }catch(e){}
  try{ sessionStorage.setItem('synthz:portal', 'o'); }catch(e){}
  try{
    const P = portalStage(), nav = document.querySelector('#nav .logo');
    P.o.classList.add('clear'); await imgsReady(P);
    await new Promise(r => requestAnimationFrame(r));
    /* 1 · «SynthZ» sale de su esquina, crece y llega al centro */
    if (nav) nav.style.visibility = 'hidden';
    P.o.animate([{ backgroundColor:'rgba(11,12,16,0)' }, { backgroundColor:'rgba(11,12,16,1)' }], { duration:900, easing:'ease-out', fill:'forwards' });
    await flyWord(P, false, 1100);
    /* evento especial: en vez del portal normal, la página «se reprograma» y luego carga el chat */
    const evn = typeof EV !== 'undefined' && EV.pending();
    if (evn){ await EV.play(evn); portalLock(true); go(); return; }
    P.W.style.transition = 'transform .5s ' + PEO; P.W.style.transform = 'none';
    await sleepRaw(200); P.W.style.transition = '';
    /* 2 · la Z de vidrio se derrite y se vuelve «Flow»: queda «SynthFlow» */
    SND.shimmer(); await melt(P, true, 1500);
    P.M.classList.add('shine'); await sleepRaw(520);
    /* 3 · la barrita de luz se come «Synth» */
    P.BAR.classList.add('on'); await sleepRaw(160);
    P.SY.style.transition = 'width .85s ' + PE; P.SY.style.width = '0px';
    await sleepRaw(880); P.BAR.classList.remove('on');
    await sleepRaw(180);
    /* 4 · la cámara entra en la «o» */
    P.PG.animate([{ opacity:0 }, { opacity:.5 }, { opacity:0 }], { duration:1200, easing:'ease-out' }); SND.warp();
    await zoomO(P, true, 1300);
    go();
  }catch(e){
    console.error('[synthz] portal', e && e.message);
    const p = document.getElementById('portal'); if (p){ p.style.background = '#0b0c10'; p.style.opacity = '1'; }
    setTimeout(go, 200);
  }
}
/* de vuelta a SynthZ: la misma película al revés */
async function portalBack(href){
  if (document.getElementById('portal')) return;
  if (reduce) return quickGo(href, true);
  let gone = false; const go = () => { if (gone) return; gone = true; location.href = href; };
  S.busy(true); portalLock(true); setTimeout(go, 12000);
  try{ sessionStorage.setItem('synthz:back', 'o'); }catch(e){}
  try{
    const P = portalStage();
    /* empieza como terminó la ida: «Flow» sin «Synth», dentro de la «o» */
    P.SY.style.width = '0px'; P.SL.style.width = P.wF + 'px'; P.ZZ.style.opacity = '0'; P.FL.style.opacity = '1';
    await imgsReady(P);
    await new Promise(r => requestAnimationFrame(r));
    await zoomO(P, true, 1);
    P.o.animate([{ opacity:0 }, { opacity:1 }], { duration:380, easing:'ease-out', fill:'forwards' }); await sleepRaw(380);
    await zoomO(P, false, 1200);
    P.W.style.transform = 'none';
    await sleepRaw(140);
    /* la barrita devuelve «Synth» */
    P.BAR.classList.add('on'); await sleepRaw(140);
    P.SY.style.transition = 'width .8s ' + PE; P.SY.style.width = P.wS + 'px';
    await sleepRaw(840); P.BAR.classList.remove('on'); await sleepRaw(200);
    /* «Flow» se derrite y vuelve a ser la Z */
    SND.shimmer(); await melt(P, false, 1400);
    await sleepRaw(260);
    /* «SynthZ» vuelve a su esquina */
    await flyWord(P, true, 1000);
    go();
  }catch(e){
    console.error('[synthz] portal', e && e.message);
    try{ sessionStorage.setItem('synthz:back', 'fade'); }catch(x){}
    setTimeout(go, 200);
  }
}
/* llegada a SynthFlow desde el portal: el hueco de la «o» se abre y deja ver el chat */
function portalArrive(veil){
  if (!veil) return;
  const R = Math.hypot(innerWidth, innerHeight) / 2 + 60, t0 = performance.now(), D = 1100;
  const ring = document.createElement('i'); ring.className = 'szpring'; document.body.appendChild(ring);
  veil.style.transition = 'none'; veil.style.opacity = '1'; veil.style.background = '#0b0c10';
  (function f(now){
    const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3), rr = (R * e).toFixed(1);
    const m = 'radial-gradient(circle at 50% 50%, transparent ' + rr + 'px, #000 ' + (R * e + 34).toFixed(1) + 'px)';
    veil.style.webkitMaskImage = m; veil.style.maskImage = m;
    ring.style.width = ring.style.height = (R * e * 2 + 8).toFixed(1) + 'px'; ring.style.opacity = (1 - k).toFixed(3);
    if (k < 1) requestAnimationFrame(f);
    else { veil.style.opacity = '0'; veil.style.webkitMaskImage = veil.style.maskImage = ''; ring.remove(); }
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

/* v2.2 · menús limpios: íconos, grupos (separados con «—»), atajos y lo peligroso en rojo. Se usan con el clic derecho y con «⋯» */
const MI = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
const MICO = {
  copy:MI('<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
  new:MI('<path d="M12 20h8"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  search:MI('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  cog:MI('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
  help:MI('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/>'),
  star:MI('<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z"/>'),
  sound:MI('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6"/>'),
  regen:MI('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>'),
  trash:MI('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  down:MI('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  quote:MI('<path d="M7 7h4v4H7zM13 7h4v4h-4z"/><path d="M9 11c0 3-1 5-3 6M15 11c0 3-1 5-3 6"/>'),
  home:MI('<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>'),
  brain:MI('<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h1V4z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3h-1V4z"/>'),
  chats:MI('<path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>'),
  ai:MI('<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/>'),
  up:MI('<path d="M12 19V5M5 12l7-7 7 7"/>'),
  user:MI('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  open:MI('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  chart:MI('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  reload:MI('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>'),
  stop:MI('<rect x="6" y="6" width="12" height="12" rx="2"/>'),
  cmp:MI('<rect x="3" y="5" width="7.5" height="14" rx="2"/><rect x="13.5" y="5" width="7.5" height="14" rx="2"/>'),
  trophy:MI('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8"/>'),
  exit:MI('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>')
};
/* arma un menú (para el clic derecho o para un botón) en la posición x, y */
function menuBuild(items, x, y, cls){
  const m = document.createElement('div'); m.className = 'ctxm ' + (cls || ''); m.setAttribute('role', 'menu');
  items.filter(Boolean).forEach((it, i, L) => {
    if (it === '—'){ if (i && i < L.length - 1 && L[i - 1] !== '—') m.appendChild(document.createElement('hr')); return; }
    if (it.head){ const h = document.createElement('div'); h.className = 'mhd'; h.textContent = it.head; m.appendChild(h); return; }
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); if (it.danger) b.className = 'dng';
    b.innerHTML = '<i class="mico">' + (MICO[it.ico] || '') + '</i><span></span>' + (it.key ? '<kbd>' + esc(it.key) + '</kbd>' : '') + (it.on != null ? '<em class="mck" aria-hidden="true">' + (it.on ? '✓' : '') + '</em>' : '');
    $('span', b).textContent = it.label; if (it.on != null) b.setAttribute('aria-checked', String(!!it.on));
    b.addEventListener('click', ev => { ev.stopPropagation(); menuClose(); it.fn(); });
    m.appendChild(b);
  });
  document.body.appendChild(m);
  m.style.left = Math.max(8, Math.min(x, innerWidth - m.offsetWidth - 10)) + 'px'; m.style.top = Math.max(8, Math.min(y, innerHeight - m.offsetHeight - 10)) + 'px';
  if (!reduce) m.animate([{ opacity:0, transform:'scale(.94) translateY(4px)', filter:'blur(4px)' }, { opacity:1, transform:'none', filter:'blur(0)' }], { duration:260, easing:'cubic-bezier(.22,1,.36,1)' });
  m.addEventListener('keydown', e => { const B = $$('button', m), i = B.indexOf(document.activeElement); if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); B[(i + (e.key === 'ArrowDown' ? 1 : B.length - 1)) % B.length].focus(); } });
  return m;
}
let MENU = null;
function menuClose(){ if (!MENU) return; const m = MENU; MENU = null; if (reduce){ m.remove(); return; } m.animate([{ opacity:1 }, { opacity:0, transform:'scale(.97)' }], { duration:140 }).onfinish = () => m.remove(); }
function menuOpen(items, x, y, cls){ menuClose(); MENU = menuBuild(items, x, y, cls); return MENU; }
addEventListener('pointerdown', e => { if (MENU && !MENU.contains(e.target) && !(e.target.closest && e.target.closest('[data-menu-owner]'))) menuClose(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && MENU){ e.preventDefault(); menuClose(); } });
addEventListener('scroll', e => { if (MENU && !(e.target && e.target.nodeType === 1 && MENU.contains(e.target))) menuClose(); }, true); addEventListener('resize', () => menuClose());
/* clic derecho: getItems(e, sel) arma lo que corresponde según dónde hiciste clic */
function ctxMenu(getItems){
  addEventListener('contextmenu', e => {
    if (e.target.closest && e.target.closest('input,textarea,[contenteditable],a[href]')) return;
    const sel = String(getSelection() || '').trim();
    const items = [...(sel ? [{ label:'Copiar', ico:'copy', key:'Ctrl+C', fn:() => { navigator.clipboard && navigator.clipboard.writeText(sel); toast('Copiado.'); } }] : []), ...(getItems(e, sel) || [])];
    if (!items.length) return;
    e.preventDefault(); menuOpen(items, e.clientX, e.clientY);
  });
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
  if (!window.puter) throw new Error('No pude abrir Puter. Revisa tu internet o apaga el bloqueador de anuncios para esta página.');
  if (!puter.auth.isSignedIn()) throw Object.assign(new Error('Conecta tu cuenta de Puter para usar esta IA.'), { needLogin:true });
  const model = String(opts.model || state.model.openrouter).replace(/^pu:/, ''), t0 = performance.now();
  const inChars = messages.reduce((n, m) => n + (typeof m.content === 'string' ? m.content.length : 200), 0);
  let resp;
  try{ resp = await Promise.race([new Promise((_, no) => { const s = opts.signal; if (s){ if (s.aborted) no(Object.assign(new Error('Detenido.'), { aborted:true })); else s.addEventListener('abort', () => no(Object.assign(new Error('Detenido.'), { aborted:true })), { once:true }); } }), puter.ai.chat(messages, Object.assign({ model, normalize:true }, opts.maxTokens ? { max_tokens:opts.maxTokens } : {})), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 120000))]); }
  catch(e){
    if (e && e.aborted) throw e;
    const m = errText(e), code = String((e && (e.code || (e.error && e.error.code) || e.status)) || '') + ' ' + m;
    if (/insufficient_funds|insufficient funds|low balance|402/i.test(code)){ puterSetOut(); throw Object.assign(new Error('Usaste el saldo de este mes de Puter. Se llena otra vez el próximo mes; mientras tanto sigue con las IAs conectadas, que son gratis.'), { switchTo:'sz', limit:true }); }
    if (/too_many_requests|429|rate.?limit/i.test(code)) throw Object.assign(new Error('Vas muy rápido para Puter. Espera unos segundos y vuelve a intentar.'), { limit:true });
    if (/auth|token|sign.?in|login|401|403/i.test(m)) throw Object.assign(new Error('Se cerró tu cuenta de Puter. Entra otra vez.'), { needLogin:true });
    throw new Error(m === 'timeout' ? 'La IA tardó demasiado. Intenta de nuevo.' : 'Puter: ' + (m || 'no pudo responder con esta IA. Prueba con otra.'));
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
  try{ dispatchEvent(new Event('synthz-acc')); }catch(e){}
  toast(d.isNew ? '¡Bienvenido a ' + BRAND() + ', ' + accName() + '!' : '¡Hola de nuevo, ' + accName() + '!');
}
/* al volver de Google por Supabase: el token llega en la dirección (#access_token=…), se cambia por tu sesión de SynthZ y se borra de la barra */
(async function sbReturn(){
  const h = location.hash || ''; if (!/access_token=|error_description=/.test(h)) return;
  const p = new URLSearchParams(h.slice(1)); try{ history.replaceState(null, '', location.pathname + location.search); }catch(e){}
  if (p.get('access_token')){ ACC.joining = true; root.classList.add('joining'); }
  let linking = false; try{ linking = sessionStorage.getItem('synthz:link') === '1'; sessionStorage.removeItem('synthz:link'); }catch(e){}
  if (p.get('error_description')){ ACC.joining = false; root.classList.remove('joining'); setTimeout(() => toast('No se pudo ' + (linking ? 'vincular' : 'entrar con') + ' Google: ' + p.get('error_description')), 800); return; }
  if (linking && SESS){ ACC.joining = false; root.classList.remove('joining'); setTimeout(() => linkGoogleDone({ token:p.get('access_token') }), 600); return; }
  try{ const d = await api('auth', { method:'POST', body:{ mode:'supabase', token:p.get('access_token') } }); await signedIn(d); askDrive(); }
  catch(e){ ACC.joining = false; root.classList.remove('joining'); setTimeout(() => toast((e && e.message) || 'No pude entrar con Google. Intenta de nuevo.'), 800); }
})();
async function onGoogle(resp){
  try{ const d = await api('auth', { method:'POST', body:{ credential:resp.credential } }); await signedIn(d); if (gsiDone) gsiDone(d.isNew ? 'new' : 'in'); askDrive(); }
  catch(e){ toast(e.message || 'No pude entrar. Intenta de nuevo.'); }
}
/* después de entrar con Google: «¿Quieres conectar Drive?» sí / no (una sola vez por dispositivo) */
async function askDrive(){
  try{
    if (!(await driveCid())) return;
    const m = driveMeta(); if (m && m.linked) return;
    try{ if (localStorage.getItem('synthz:askdrive')) return; localStorage.setItem('synthz:askdrive', String(Date.now())); }catch(e){}
    await sleepRaw(900);
    const ok = await szConfirm('¿Quieres conectar tu Google Drive?', 'Guardo una copia de tus chats en una carpeta privada dentro de tu Google Drive, para que tengas más espacio. No puedo ver ni tocar tus otros archivos. Puedes cambiarlo cuando quieras.', 'Sí, conectar', false, 'No, gracias');
    if (!ok){ toast('Listo. Si cambias de idea, está en Ajustes › IAs y memoria › Google Drive.'); return; }
    const r = await DRIVE.sync(); if (r && !r.busy) toast('¡Listo! Tus chats también quedan en tu Google Drive.');
  }catch(e){ toast((e && e.message) || 'No pude conectar tu Drive. Inténtalo luego en Ajustes › IAs y memoria › Google Drive.'); }
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
function authBox(box, done, onBlocked, start){
  let mode = start === 'signup' ? 'signup' : 'login';
  const say = h => { box.innerHTML = '<p class="gmsg">' + h + '</p>'; };
  box.innerHTML = '<div class="gbox"><span class="gload">Preparando…</span></div>';
  accConfig().then(ok => {
    if (!ok){ say(location.protocol === 'file:' ? 'Las cuentas funcionan cuando la página está publicada (por ejemplo en Vercel).' : 'Las cuentas de ' + BRAND() + ' aún no están activadas: falta conectar la base de datos en Vercel.' + (ACC.missing.length ? '<br><small>Faltan: ' + ACC.missing.map(esc).join(', ') + '</small>' : '')); return; }
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
      + '<p class="cnote">' + (N ? 'No necesitas correo. Tu contraseña se guarda protegida (ni ' + BRAND() + ' puede leerla). Al crear la cuenta te damos un código para recuperarla.' : R ? 'Es el código que guardaste al crear tu cuenta. Al cambiar la contraseña, tu cuenta se cierra en los demás dispositivos.' : 'Tus chats y favoritos te siguen a cualquier dispositivo.') + ' Al entrar aceptas los <a href="terminos.html" target="_blank" rel="noopener">Términos</a> y la <a href="privacidad.html" target="_blank" rel="noopener">Privacidad</a>.</p>'
      + '</div>';
    const f = $('.lform', box), err = $('.lerr', box), go = $('.lgo', box), uIn = f.elements.user, pIn = f.elements.pass;
    $$('[data-m]', box).forEach(b => b.addEventListener('click', () => { if (b.dataset.m !== mode){ const u = uIn.value; mode = b.dataset.m; paint(); $('.lform', box).elements.user.value = u; } }));
    const back = $('[data-back]', box); if (back) back.addEventListener('click', () => { const u = uIn.value; swapDir(box, -1, () => { mode = 'login'; paint(); $('.lform', box).elements.user.value = u; }); });
    const fg = $('[data-forgot]', box); if (fg) fg.addEventListener('click', () => { const u = uIn.value; swapDir(box, 1, () => { mode = 'reset'; paint(); $('.lform', box).elements.user.value = u; }); });
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
      if (N && f.elements.setup) bodyOut.setup = f.elements.setup.value.trim();
      if (R){ bodyOut.code = f.elements.code.value.trim(); if (bodyOut.code.replace(/[^a-z0-9]/gi, '').length < 16){ err.textContent = 'El código tiene 16 letras y números.'; f.elements.code.focus(); return; } }
      go.disabled = true; const label = go.textContent; go.textContent = L ? 'Entrando…' : N ? 'Creando…' : 'Cambiando…';
      try{
        const d = await api('auth', { method:'POST', body:bodyOut, keep:true });
        const finish = async () => { await signedIn(d); if (done) done(d.isNew ? 'new' : 'in'); };
        if (d.recovery){ setSess(d.token); recoveryPanel(box, d.recovery, user, () => finish(), R); }
        else await finish();
      }catch(x){
        go.disabled = false; go.textContent = label;
        if (x.data && x.data.code === 'reserved' && !f.elements.setup){
          const l = document.createElement('label'); l.innerHTML = 'Código de configuración<span class="lin"><input name="setup" type="text" data-sec="1" autocomplete="off" data-lpignore="true" data-1p-ignore data-form-type="other" spellcheck="false" placeholder="Solo para el equipo de SynthZ"></span>';
          f.insertBefore(l, err); l.animate([{ opacity:0, transform:'translateY(-6px)' }, { opacity:1, transform:'none' }], { duration:400, easing:'cubic-bezier(.22,1,.36,1)' }); l.querySelector('input').focus();
        }
        err.textContent = x.net ? 'No pude conectar con ' + BRAND() + '. Revisa tu internet.' : (x.message || 'Algo falló. Intenta de nuevo.');
        box.querySelector('.lbox').animate([{ transform:'translateX(0)' }, { transform:'translateX(-7px)' }, { transform:'translateX(6px)' }, { transform:'translateX(-3px)' }, { transform:'none' }], { duration:380 });
      }
    });
    if (ACC.google && !R) googleBtn($('.gbtn', box), done, onBlocked);
  }
}
async function googleBtn(slot, done, onBlocked){
  /* v1.4: si Supabase tiene Google activado, se entra por Supabase (sin ventanitas que los navegadores bloquean) */
  if (ACC.sbg && ACC.sb && ACC.sb.url){
    slot.innerHTML = '<button type="button" class="sbg"><svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Continuar con Google</button>';
    slot.querySelector('.sbg').addEventListener('click', () => {
      try{ sessionStorage.setItem('synthz:sbback', location.pathname + location.search); }catch(e){}
      location.href = ACC.sb.url + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(location.origin + location.pathname);
    });
    return;
  }
  try{ await loadGsi(); }catch(e){ slot.innerHTML = '<p class="gmsg">No pude cargar el botón de Google. Puedes entrar con usuario y contraseña.</p>'; if (onBlocked) onBlocked('script'); return; }
  gsiDone = done;
  google.accounts.id.initialize({ client_id:ACC.cid, callback:onGoogle, auto_select:false, cancel_on_tap_outside:true, context:'signin', itp_support:true });
  slot.innerHTML = '';
  google.accounts.id.renderButton(slot, { theme:'filled_black', size:'large', shape:'pill', text:'continue_with', logo_alignment:'left', locale:'es', width:Math.max(220, Math.min(340, (slot.clientWidth || 320) - 4)) });
}
/* ---------- v2.3 · seguridad y acceso: cómo entras (usuario y contraseña, Google), vincular y cambiar contraseña ---------- */
const hasPass = u => !!(u && (u.kind === 'pass' || u.username));
const hasGoogle = u => !!(u && (u.google || u.kind === 'google' || u.sbUid || u.gsub));
/* al volver de Google para VINCULAR (no para entrar) */
async function linkGoogleDone(body){
  try{ const d = await api('auth', { method:'POST', keep:true, body:Object.assign({ mode:'link' }, body) }); if (d.user) ACC.user = Object.assign({}, ACC.user, d.user); await accStart(); toast('¡Listo! Tu Google quedó vinculado: ya puedes entrar con él o con tu usuario.'); }
  catch(e){ toast((e && e.message) || 'No pude vincular tu Google. Intenta de nuevo.'); }
}
function securityModal(){
  if ($('#secm')) return;
  const o = document.createElement('div'); o.id = 'secm'; o.className = 'szm';
  o.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Seguridad y acceso"><div class="word">' + zWord('Synth') + '</div><div class="tn">SEGURIDAD Y ACCESO</div><div class="tb" id="secBox"></div><div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>Cerrar</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const box = $('#secBox', o);
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  $('[data-close]', o).addEventListener('click', close);
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  const GICO = '<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  const paint = () => {
    const u = ACC.user || {}, P = hasPass(u), G = hasGoogle(u);
    box.innerHTML = '<h3>Cómo entras</h3><div class="sacc">'
      + '<div class="sa-r' + (P ? ' on' : '') + '"><span class="sa-i">🔑</span><span class="sa-t"><b>Usuario y contraseña</b><small>' + (P ? '@' + esc(u.username || '') : 'Aún no tienes') + '</small></span>' + (P ? '<em class="sa-ok">✓ Activo</em>' : '<button class="btn sm" type="button" data-k="addp">Agregar</button>') + '</div>'
      + '<div class="sa-r' + (G ? ' on' : '') + '"><span class="sa-i">' + GICO + '</span><span class="sa-t"><b>Google</b><small>' + (G ? esc(u.email || 'Vinculado') : 'Sin vincular') + '</small></span>' + (G ? '<em class="sa-ok">✓ Vinculado</em>' : (ACC.google ? '<span class="sa-g"><button class="btn sm" type="button" data-k="link">Vincular</button></span>' : '<small class="sa-no">No disponible ahora</small>')) + '</div>'
      + '</div><p class="cnote">Con las dos formas entras a la <b>misma</b> cuenta, con tus chats y tu perfil. Nunca se juntan dos cuentas distintas.</p><div id="secForm"></div>';
    const add = $('[data-k="addp"]', box); if (add) add.addEventListener('click', () => addPassForm());
    const ln = $('[data-k="link"]', box); if (ln) ln.addEventListener('click', () => linkGoogle(ln.parentNode));
    if (P) passForm();
  };
  /* vincular Google: por Supabase (vuelve a esta página) o con el botón de Google */
  const linkGoogle = async slot => {
    if (ACC.sbg && ACC.sb && ACC.sb.url){
      try{ sessionStorage.setItem('synthz:link', '1'); sessionStorage.setItem('synthz:sbback', location.pathname + location.search); }catch(e){}
      location.href = ACC.sb.url + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(location.origin + location.pathname); return;
    }
    try{ await loadGsi(); }catch(e){ toast('No pude cargar Google. Revisa si un bloqueador lo está frenando.'); return; }
    google.accounts.id.initialize({ client_id:ACC.cid, callback:async r => { await linkGoogleDone({ credential:r.credential }); paint(); }, auto_select:false, cancel_on_tap_outside:true, context:'use', itp_support:true });
    slot.innerHTML = ''; google.accounts.id.renderButton(slot, { theme:'filled_black', size:'medium', shape:'pill', text:'continue_with', locale:'es' });
  };
  const addPassForm = () => {
    const f0 = $('#secForm', box);
    f0.innerHTML = '<h3 style="margin-top:14px">Ponle usuario y contraseña</h3><form class="lform" novalidate>'
      + '<label>Usuario<span class="lin"><span class="at">@</span><input name="user" autocomplete="username" maxlength="20" required></span></label>'
      + '<label>Contraseña<span class="lin"><input name="pass" type="password" autocomplete="new-password" maxlength="200" required></span></label>'
      + '<p class="lerr" role="alert"></p><div class="aact"><button class="btn sm" type="submit">Guardar</button></div></form>';
    const f = $('form', f0), err = $('.lerr', f0); f.elements.user.focus();
    f.elements.user.addEventListener('input', () => { const v = f.elements.user.value.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_.]/g, ''); if (v !== f.elements.user.value) f.elements.user.value = v; });
    f.addEventListener('submit', async e => { e.preventDefault(); err.textContent = '';
      const user = f.elements.user.value.trim(), pass = f.elements.pass.value;
      if (user.length < 3){ err.textContent = 'Tu usuario debe tener al menos 3 letras o números.'; return; }
      if (pass.length < 8){ err.textContent = 'La contraseña debe tener al menos 8 caracteres.'; return; }
      try{ const d = await api('auth', { method:'POST', keep:true, body:{ mode:'addpass', user, pass } }); ACC.user = Object.assign({}, ACC.user, d.user); accFire('pull');
        recoveryPanel(box, d.recovery, user, () => { toast('¡Listo! Ya puedes entrar con @' + user + ' o con Google.'); paint(); }, false); }
      catch(x){ err.textContent = x.message || 'Algo falló.'; }
    });
  };
  const passForm = () => {
    const f0 = $('#secForm', box);
    f0.innerHTML = '<h3 style="margin-top:14px">Tu contraseña</h3><form class="lform" novalidate>'
      + '<input name="user" autocomplete="username" value="' + esc((ACC.user && ACC.user.username) || '') + '" hidden>'
      + '<label>Contraseña actual<span class="lin"><input name="old" type="password" autocomplete="current-password" required></span></label>'
      + '<label>Contraseña nueva <small>(déjala vacía si solo quieres un código nuevo)</small><span class="lin"><input name="pass" type="password" autocomplete="new-password" maxlength="200"></span></label>'
      + '<p class="lerr" role="alert"></p>'
      + '<div class="aact"><button class="btn sm" type="submit" data-k="change">Cambiar contraseña</button><button class="btn sm ghost" type="button" data-k="code">Código de recuperación nuevo</button></div>'
      + '<p class="cnote">Al cambiar la contraseña, tu cuenta se cierra en los demás dispositivos. Si pides un código nuevo, el anterior deja de servir.</p></form>';
    const f = $('form', f0), err = $('.lerr', f0);
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
    $('[data-k="code"]', f0).addEventListener('click', () => run('code'));
  };
  paint();
}
/* ---------- configuración ---------- */
const lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
const miniPage = kind => '<div class="mp ' + kind + '"><i class="bl"></i><i class="bl"></i><i class="bl"></i><div class="gl"></div><div class="nv"><i></i><b></b><b></b><b></b></div><div class="h1"></div><div class="h2"></div><div class="cds"><b></b><b></b><b></b></div><span class="cu"></span><em>así se verá</em></div>';
function cfgChooser(box, cur, onPick){
  const paint = sel => {
    box.innerHTML = '<div class="cfgo"><button type="button" data-v="visual" aria-pressed="' + (sel === 'visual') + '"><b>Más bonito</b><span>Con todos los efectos: vidrio, fondo que se mueve, cursor propio y animaciones.</span></button>'
      + '<button type="button" data-v="speed" aria-pressed="' + (sel === 'speed') + '">' + (lowEnd ? '<i class="rec">Recomendado</i>' : '') + '<b>Más rápido</b><span>Para computadores o celulares lentos: menos efectos y todo responde al instante.</span></button></div>'
      + miniPage(sel);
    $$('[data-v]', box).forEach(b => b.addEventListener('click', () => { paint(b.dataset.v); if (onPick) onPick(b.dataset.v); }));
  };
  paint(cur);
}
const CFG_ROWS = [['cursor', 'Cursor ' + BRAND(), 'El cursor de vidrio con viento.'], ['smooth', 'Desplazamiento suave', 'La ruedita baja la página sin saltos.'], ['bg', 'Fondo animado', 'Los colores se mueven y giran al bajar.'], ['glass', 'Efecto vidrio', 'Ventanas y paneles que parecen de vidrio.'], ['anim', 'Animaciones', 'Escritura letra por letra, golpe de cristal y agua.'], ['favAnim', 'Icono animado', 'El péndulo (o el destello de Flow) en el icono de la pestaña.'], ['sound', 'Sonidos', 'La voz de SynthonIA, las teclas, las transiciones y los avisos. Apágalos si te molestan.'], ['beginner', 'Modo principiante', 'Las IA te responden con palabras sencillas, paso a paso y con ejemplos.']];
/* v2.2 · Ajustes con 2 pestañas: «Página» (cómo se ve y se siente) e «IAs y memoria» (cómo te responden y qué recuerdan de ti) */
const CFG_PAGE = CFG_ROWS.filter(r => r[0] !== 'beginner');
const CFG_IA = [['beginner', 'Modo principiante', 'Te responden con palabras sencillas, paso a paso y con ejemplos.'], ['autoWeb', 'Buscar en internet cuando haga falta', 'Si preguntas por algo de hoy (precios, noticias, el clima…), la IA busca sola y te muestra sus fuentes.'], ['saver', 'Respuestas cortas', 'Respuestas más breves: gastas menos de tu límite de hoy.']];
const memSt0 = () => state.mem || (state.mem = { on:true, t:0, items:[] });
function memTouch(){ const m = memSt0(); m.t = Date.now(); save(); try{ if (ACC.ready) accPush(); }catch(e){} }
function memAddCore(text){
  const m = memSt0(), t = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 300); if (t.length < 3) return false;
  if (!m.items.some(x => x.text.toLowerCase() === t.toLowerCase())) m.items.unshift({ id:'m' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), t:Date.now(), text:t });
  m.items = m.items.slice(0, 40); memTouch(); return true;
}
/* la lista de «Lo que recuerdo de ti»: se ve, se agrega, se olvida */
function memPanel(host){
  const paint = () => {
    const m = memSt0();
    host.innerHTML = '<div class="cfgrow"><p>Usar mi memoria<small>Las IAs usan esto para responderte mejor. Si la apagas, no se usa (pero no se borra).</small></p><button class="cfgsw" type="button" role="switch" data-mem="on" aria-checked="' + m.on + '" aria-pressed="' + m.on + '" aria-label="Usar mi memoria"><i></i></button></div>'
      + '<ul class="meml">' + (m.items.length ? m.items.map(x => '<li><span></span><button type="button" class="lnk" data-del="' + x.id + '">Olvidar</button></li>').join('') : '<li class="memnone">Todavía no recuerdo nada. Escribe «recuerda que…» en el chat o agrégalo aquí.</li>') + '</ul>'
      + '<form class="memadd"><label class="field"><input type="text" maxlength="300" placeholder="Ej.: Me llamo Ana y estudio diseño gráfico" aria-label="Algo para recordar"></label><button class="btn sm" type="submit">Agregar</button></form>'
      + (m.items.length ? '<button class="lnk memclr" type="button" data-mem="clear">Olvidar todo</button>' : '');
    const L = $$('.meml li span', host); m.items.forEach((x, i) => { if (L[i]) L[i].textContent = x.text; });
  };
  paint();
  host.addEventListener('submit', e => { e.preventDefault(); const i = $('.memadd input', host); if (memAddCore(i.value)){ paint(); toast('Agregado a tu memoria.'); } });
  host.addEventListener('click', async e => {
    const d = e.target.closest('[data-del]'); if (d){ const m = memSt0(); m.items = m.items.filter(x => x.id !== d.dataset.del); memTouch(); paint(); return; }
    const t = e.target.closest('[data-mem]'); if (!t) return; const m = memSt0();
    if (t.dataset.mem === 'on'){ m.on = !m.on; memTouch(); paint(); }
    else if (t.dataset.mem === 'clear' && await szConfirm('¿Olvidar todo?', 'Borro todo lo que recuerdo de ti. No se puede deshacer.', 'Olvidar todo', true)){ m.items = []; memTouch(); paint(); }
  });
}
/* cada página agrega aquí sus atajos de «Tus IAs» (elegir IA ideales, conectar, Drive…) */
const cfgLinks = [];
function cfgModal(tab){
  if ($('#cfgm')) return;
  const draft = Object.assign({ autoWeb:true }, CFG); draft.saver = !!(state.sx && state.sx.saver);
  const o = document.createElement('div'); o.id = 'cfgm'; o.className = 'szm';
  const row = ([k, t, s]) => '<div class="cfgrow"><p>' + t + '<small>' + s + '</small></p><button class="cfgsw" type="button" role="switch" data-k="' + k + '" aria-checked="' + !!draft[k] + '" aria-pressed="' + !!draft[k] + '" aria-label="' + t + '"></button></div>';
  const IN = [['always', 'Cada vez'], ['session', 'Una vez por visita'], ['never', 'Nunca']];
  const ia = tab === 'ia' || tab === 'mem';
  o.innerHTML = '<div class="tcard cfgcard" role="dialog" aria-modal="true" aria-label="Ajustes"><div class="cfghead"><h3>Ajustes</h3>'
    + '<div class="cfgtabs" role="tablist"><span class="pill"></span><button type="button" role="tab" data-tab="page" aria-selected="' + !ia + '">Página</button><button type="button" role="tab" data-tab="ia" aria-selected="' + ia + '">IAs y memoria</button></div></div>'
    + '<div class="cfgbody">'
    + '<section class="cfgpane" data-pane="page"' + (ia ? ' hidden' : '') + '>'
    + '<div class="cfglbl">Cómo se ve</div><div id="cfgCh"></div>'
    + '<div class="cfglbl">Estilo de SynthFlow</div><div class="cfgseg" id="cfgUi"><button type="button" data-ui="full" aria-pressed="' + (draft.ui !== 'simple') + '">SynthFlow</button><button type="button" data-ui="simple" aria-pressed="' + (draft.ui === 'simple') + '">Simple</button></div><p class="cnote">Simple: solo tus chats, la caja de escribir y las respuestas, con un diseño tranquilo y sin efectos.</p>'
    + '<div class="cfglbl">Color de SynthFlow</div><div class="cfgth" id="cfgTh">' + THEMES.map(([id, nm, c1, lock, c2]) => '<button type="button" data-th="' + id + '" aria-pressed="' + ((draft.theme || 'synthz') === id) + '"' + (lock ? ' disabled aria-disabled="true"' : '') + ' style="--t1:' + c1 + ';--t2:' + c2 + '"><i></i><span>' + esc(nm) + '</span>' + (lock ? '<em>Pronto</em>' : '') + '</button>').join('') + '</div><p class="cnote" id="cfgThN"></p>'
    + (matchMedia('(pointer:coarse), (max-width:820px)').matches ? '<div class="cfglbl">Barra del celular</div><div class="cfgseg" id="cfgNav"><button type="button" data-nav="bottom" aria-pressed="' + (draft.nav !== 'left') + '">Abajo</button><button type="button" data-nav="left" aria-pressed="' + (draft.nav === 'left') + '">A la izquierda</button></div><p class="cnote">A la izquierda: la barra se esconde y la abres con el botón ☰ de arriba.</p>' : '')
    + '<div class="cfglbl">Detalles</div><div id="cfgRows">' + CFG_PAGE.map(row).join('') + '</div>'
    + '<div class="cfglbl">Intro de la página</div><div class="cfgseg" id="cfgIn">' + IN.map(([v, l]) => '<button type="button" data-in="' + v + '" aria-pressed="' + (draft.intro === v) + '">' + l + '</button>').join('') + '</div><p class="cnote">La animación al entrar al chat siempre se ve.</p>'
    + '</section>'
    + '<section class="cfgpane" data-pane="ia"' + (ia ? '' : ' hidden') + '>'
    + '<div class="cfglbl">Cómo te responden</div>' + CFG_IA.map(row).join('')
    + '<div class="cfglbl" id="cfgMemL">Lo que recuerdo de ti</div><div id="szMem" class="cfgmem"></div>'
    + (cfgLinks.length ? '<div class="cfglbl">Tus IAs</div><div class="cfglinks">' + cfgLinks.map(([l, , d], i) => '<button type="button" class="cfglk" data-lk="' + i + '"><b>' + esc(l) + '</b><small>' + esc(d || '') + '</small><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>').join('') + '</div>' : '')
    + '</section></div>'
    + '<div class="tbtn cfgfoot"><button class="lnk" type="button" data-close>Cerrar</button><button class="btn sm" type="button" id="cfgOk">Guardar</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  $('.tcard', o).animate([{ transform:'scale(.94) translateY(16px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:560, easing:'cubic-bezier(.22,1,.36,1)' });
  const paintRows = () => $$('.cfgsw[data-k]', o).forEach(b => { b.setAttribute('aria-pressed', String(!!draft[b.dataset.k])); b.setAttribute('aria-checked', String(!!draft[b.dataset.k])); });
  cfgChooser($('#cfgCh', o), draft.perf, v => { draft.perf = v; Object.assign(draft, cfgPreset(v)); paintRows(); });
  memPanel($('#szMem', o));
  $$('.cfgsw[data-k]', o).forEach(b => b.addEventListener('click', () => { draft[b.dataset.k] = !draft[b.dataset.k]; paintRows(); }));
  $$('[data-in]', o).forEach(b => b.addEventListener('click', () => { draft.intro = b.dataset.in; $$('[data-in]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  const thNote = () => { const n = $('#cfgThN', o); if (n) n.textContent = draft.ui === 'simple' ? 'El estilo Simple usa sus propios colores: el color se ve en el estilo SynthFlow.' : 'Cambia el dorado y el rosado de SynthFlow. Aurora y Oro negro llegan con Syntonia.'; };
  thNote();
  $$('[data-ui]', o).forEach(b => b.addEventListener('click', () => { draft.ui = b.dataset.ui; $$('[data-ui]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); thNote(); }));
  $$('[data-th]', o).forEach(b => b.addEventListener('click', () => { if (b.disabled) return; draft.theme = b.dataset.th; $$('[data-th]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  $$('[data-nav]', o).forEach(b => b.addEventListener('click', () => { draft.nav = b.dataset.nav; $$('[data-nav]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  const tabs = $('.cfgtabs', o), pill = $('.pill', tabs);
  const show = k => { $$('[role=tab]', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === k))); $$('.cfgpane', o).forEach(p => { p.hidden = p.dataset.pane !== k; }); const b = $('[data-tab="' + k + '"]', tabs); if (b && pill){ pill.style.width = b.offsetWidth + 'px'; pill.style.transform = 'translateX(' + (b.offsetLeft - 4) + 'px)'; } $('.cfgbody', o).scrollTop = 0; };
  tabs.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) show(b.dataset.tab); });
  requestAnimationFrame(() => show(ia ? 'ia' : 'page'));
  if (tab === 'mem') setTimeout(() => { const l = $('#cfgMemL', o); if (l) l.scrollIntoView({ block:'start', behavior:reduce ? 'auto' : 'smooth' }); }, 350);
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 450); };
  $$('.cfglk', o).forEach(b => b.addEventListener('click', () => { const L = cfgLinks[+b.dataset.lk]; close(); if (L) setTimeout(L[1], 200); }));
  $('[data-close]', o).addEventListener('click', close);
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  $('#cfgOk', o).addEventListener('click', () => { state.sx = state.sx || {}; if (!!state.sx.saver !== !!draft.saver){ state.sx.saver = !!draft.saver; save(); try{ hooks.usage(); }catch(e){} try{ dispatchEvent(new Event('synthz-saver')); }catch(e){} } const d = Object.assign({}, draft); delete d.saver; applyCfg(d, close); });
}
function applyCfg(draft, close){
  const reload = draft.anim !== CFG.anim || (draft.cursor !== CFG.cursor && matchMedia('(pointer: fine)').matches) || (draft.bg && !!$('.aurora') && !$('.aurora .orbit'));
  Object.assign(CFG, draft, { v:2 }); saveCfg(); cfgClasses();
  if (CFG.favAnim && window.__favStart) window.__favStart();
  if (close) close();
  if (reload){ toast('Aplicando tu configuración…'); setTimeout(() => location.reload(), 900); }
  else toast('Configuración guardada.');
}
/* Esc cierra la ventana flotante que esté arriba */
addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const c = [...document.querySelectorAll('.szm [data-close], .szm [data-d="x"], #blk #bClose, #acc #aClose, #sx #sxClose, #conn #cClose, #szChat [data-cx]')].filter(x => x.isConnected && !x.closest('.bye')).pop();
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
  const sig = opts.signal, t0 = performance.now(); let acc = '', ttft = 0, usage = null, fin = '', cut = '', via = '', provX = '', real = '';
  /* lo que la IA «piensa» (campo reasoning o etiquetas <think>) se separa de la respuesta y se muestra aparte */
  let raw = '', tagR = '', fieldR = '';
  const emitR = () => { if (opts.onReason) try{ opts.onReason(fieldR + tagR); }catch(e){} };
  const push = d => {
    if (!d) return; raw += d; let vis = raw;
    const lead = raw.replace(/^\s+/, ''), i = raw.indexOf('<think>');
    if (i >= 0){ const j = raw.indexOf('</think>', i), r = raw.slice(i + 7, j < 0 ? undefined : j); if (r !== tagR){ tagR = r; emitR(); } vis = raw.slice(0, i) + (j < 0 ? '' : raw.slice(j + 8).replace(/^\s+/, '')); }
    else if (lead.length < 7 && '<think>'.startsWith(lead)) vis = '';
    if (vis === acc) return;
    if (!ttft && vis) ttft = performance.now() - t0; acc = vis; if (onDelta) onDelta(acc);
  };
  const pushR = d => { if (!d || typeof d !== 'string') return; fieldR += d; emitR(); };
  const inChars = messages.reduce((n, m) => n + (typeof m.content === 'string' ? m.content.length : 200), 0);
  const done = aborted => {
    if (!acc && aborted) throw Object.assign(new Error('Detenido.'), { aborted:true });
    const text = acc.trim() || '(La IA devolvió una respuesta vacía.)';
    const prompt = usage && usage.prompt_tokens != null ? usage.prompt_tokens : Math.ceil(inChars / 4);
    const completion = usage && usage.completion_tokens != null ? usage.completion_tokens : est(text);
    return { text, prompt, completion, ms:performance.now() - t0, ttft, model:opts.model, aborted:!!aborted, est:!usage, finish:fin, cut, rid:newRid(), via, prov:provX || undefined, real, reasoning:(fieldR + tagR).trim().slice(0, 8000) };
  };
  const model0 = String(opts.model || state.model[p.id] || '');
  /* sin créditos de Puter: pasa sola a las IAs conectadas (el único aviso es «Usaste el saldo de este mes de Puter: sigo con las IAs conectadas») */
  const flat = ms => ms.map(m => typeof m.content === 'string' ? m : { role:m.role, content:(m.content || []).map(x => x.type === 'text' ? x.text : '[imagen]').join('\n') });
  const fallSz = () => { puterOutNote(); return askStream(SZ_P, flat(messages), Object.assign({}, opts, { model:'sz:auto', _noFall:true }), onDelta).then(r => Object.assign(r, { swapped:true })); };
  if (/^pu:/.test(model0)){
    if (!window.puter) throw new Error('No pude abrir Puter. Revisa tu internet o apaga el bloqueador de anuncios para esta página.');
    if (!puter.auth.isSignedIn()) throw Object.assign(new Error('Conecta tu cuenta de Puter para usar esta IA.'), { needLogin:true });
    if (!opts._noFall && SZQ.on !== false && await puterOut()) return fallSz();
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
        else if (part.type === 'reasoning') pushR(part.reasoning || part.text);
      }
    }catch(e){
      if (e && e.aborted) throw e;
      const m = errText(e), code = String((e && (e.code || (e.error && e.error.code))) || '') + ' ' + m;
      if (/insufficient_funds|insufficient funds|low balance|402/i.test(code)){ puterSetOut(); if (!acc && !opts._noFall && SZQ.on !== false) return fallSz(); if (acc) return done(false); throw Object.assign(new Error('Usaste el saldo de este mes de Puter. Se llena otra vez el próximo mes; mientras tanto sigue con las IAs conectadas, que son gratis.'), { switchTo:'sz', limit:true }); }
      if (/too_many_requests|429/i.test(code)) throw Object.assign(new Error('Vas muy rápido para Puter. Espera unos segundos y vuelve a intentar.'), { limit:true });
      if (/auth|token|sign.?in|login|401|403/i.test(m)) throw Object.assign(new Error('Se cerró tu cuenta de Puter. Entra otra vez.'), { needLogin:true });
      if (acc) return done(false);
      throw Object.assign(new Error('Puter: ' + (m || 'no pudo responder con esta IA. Prueba con otra.')), { raw:m, gone:/model.{0,30}(not found|not available|does not exist|unknown|unsupported|invalid)|no (such|valid) model|model_not_found/i.test(m) });
    }
    return done(false);
  }
  const viaSz = /^sz:/.test(model0); if (viaSz){ p = SZ_P; provX = 'synthz'; }
  const viaGroq = /^gq:/.test(model0); if (viaGroq) p = GROQ_P;
  if (p.kind !== 'openai'){ const r = await ask(p, messages, opts); push(r.text); return Object.assign(r, { ttft:r.ms, rid:newRid() }); }
  const viaTrial = /^tr:/.test(model0);
  const viaTeam = !viaTrial && !viaGroq && p.id === 'openrouter' && !state.keys.openrouter && !!state.useTeam && !!SESS;
  const key = state.keys[p.id];
  if (!key && !viaTeam && !viaTrial && !viaSz) throw new Error('Falta la llave de ' + p.name + '.');
  const body = viaSz ? { messages:flat(messages), model:model0, turn:opts.turn || (TURN && Date.now() - TURN.at < 120000 ? TURN.id : turnId(messages)) } : viaGroq ? { model:model0.replace(/^gq:/, ''), messages, stream:true, stream_options:{ include_usage:true } } : { model:model0.replace(/^or:/, ''), messages, stream:true, usage:{ include:true } };
  if (viaTeam) body.teamId = state.useTeam;
  if (opts.maxTokens) body.max_tokens = opts.maxTokens;
  const ctl = new AbortController(); let idle = 0;
  const bump = () => { clearTimeout(idle); idle = setTimeout(() => ctl.abort(), 70000); };
  if (sig){ if (sig.aborted) ctl.abort(); else sig.addEventListener('abort', () => ctl.abort(), { once:true }); }
  let res; bump();
  try{ res = viaSz ? await fetch('/api/ai', { method:'POST', headers:szHeaders(), body:JSON.stringify(body), signal:ctl.signal })
     : viaTrial ? await fetch('/api/trial', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ action:'chat', token:(trialGet() || {}).token || '', messages }), signal:ctl.signal })
     : viaTeam ? await fetch('/api/chat', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + SESS }, body:JSON.stringify(body), signal:ctl.signal })
                     : await fetch(p.url + '/chat/completions', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + key }, body:JSON.stringify(body), signal:ctl.signal }); }
  catch(e){ clearTimeout(idle); if (sig && sig.aborted) throw Object.assign(new Error('Detenido.'), { aborted:true }); throw new Error(e && e.name === 'AbortError' ? p.name + ' tardó demasiado en responder. Intenta de nuevo.' : netMsg(p)); }
  if (!res.ok && viaTrial){
    clearTimeout(idle); const data = await res.json().catch(() => ({}));
    if (data.code === 'trial_done' || data.code === 'trial_bad'){ const t = trialGet() || {}; t.left = 0; if (data.code === 'trial_bad') t.token = ''; trialSet(t); }
    throw Object.assign(new Error(typeof data.error === 'string' ? data.error : 'La prueba no respondió. Intenta de nuevo.'), { status:res.status, trial:data.code || 'trial_err', limit:data.code === 'trial_done' });
  }
  if (!res.ok && viaSz){
    clearTimeout(idle); const data = await res.json().catch(() => ({})), code = data.code || '';
    if (code === 'sz_guest'){ szqSet({ guest:{ max:(SZQ.guest && SZQ.guest.max) || 5, used:(SZQ.guest && SZQ.guest.max) || 5 } }); telEv('limit', code); setTimeout(() => guestGate(), 350); }
    else if (/^sz_limit/.test(code)){ szqSet({ used:SZQ.limit }); telEv('limit', code); }
    else if (code === 'sz_off'){ szqSet({ on:false }); telEv('noai', 'las IAs conectadas no tienen llaves'); }
    else telEv('error', 'IAs conectadas ' + res.status + ' ' + code);
    throw Object.assign(new Error(typeof data.error === 'string' ? data.error : 'La IA no respondió. Intenta de nuevo en un momento.'), { status:res.status, sz:code || 'sz_err', limit:/^sz_limit/.test(code) || code === 'sz_guest', guest:code === 'sz_guest', raw:code, gone:code === 'sz_model' && model0 !== 'sz:auto', switchTo:code === 'sz_down' || code === 'sz_off' ? 'pu' : null });
  }
  if (viaSz){ try{ real = decodeURIComponent(res.headers.get('x-sz-name') || ''); }catch(e){ real = ''; } const u = +res.headers.get('x-sz-used'), l = +res.headers.get('x-sz-limit'), gq = /^(\d+)\/(\d+)$/.exec(res.headers.get('x-sz-guest') || ''); if (l) szqSet(Object.assign({ on:true, used:u || 0, limit:l }, gq ? { guest:{ used:+gq[1], max:+gq[2] } } : {})); }
  if (viaTrial){ const t = trialGet() || {}; const l = res.headers.get('x-trial-left'); if (l != null){ t.left = +l; trialSet(t); } via = res.headers.get('x-trial-provider') || ''; }
  if (!res.ok){ clearTimeout(idle); const data = await res.json().catch(() => ({})); if (viaTeam && typeof data.error === 'string') throw Object.assign(new Error('Equipo: ' + data.error), { status:res.status, switchTo:res.status === 429 ? 'pu' : null }); const raw = data && data.error ? String(data.error.message || data.error) : ''; throw Object.assign(new Error(friendly(res.status, data, p)), { status:res.status, raw, gone:modelGone(res.status, raw), switchTo: p.id === 'openrouter' && (res.status === 429 || res.status === 402) ? 'pu' : null }); }
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
        if (j.sz){ szqSet({ used:+j.sz.used || SZQ.used, limit:+j.sz.limit || SZQ.limit }); if (!usage && j.sz.spent) usage = { prompt_tokens:Math.ceil(inChars / 4), completion_tokens:Math.max(0, j.sz.spent - Math.ceil(inChars / 4)) }; continue; }
        if (j.error){ if (acc){ cut = String(j.error.message || 'error'); return done(false); } const raw = String(j.error.message || ''); throw Object.assign(new Error(friendly(+j.error.code || 502, j, p)), { status:+j.error.code || 502, raw, gone:modelGone(+j.error.code || 502, raw) }); }
        if (j.usage) usage = j.usage; else if (j.x_groq && j.x_groq.usage) usage = j.x_groq.usage;
        const ch = (j.choices || [])[0]; if (ch && ch.delta){ pushR(ch.delta.reasoning); pushR(ch.delta.reasoning_content); if (typeof ch.delta.content === 'string') push(ch.delta.content); }
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
    tx.onerror = () => toast('No pude guardar tus chats: se llenó el espacio en este equipo. Borra chats viejos o descarga una copia.');
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
const provOf = id => /^sz:/.test(String(id)) ? 'synthz' : /^pu:/.test(String(id)) ? 'puter' : /^tr:/.test(String(id)) ? 'trial' : /^gq:/.test(String(id)) ? 'groq' : 'openrouter';
/* ---------- prueba guiada que paga SynthZ: 5 mensajes, solo para aprender en la guía ---------- */
const TRIAL_KEY = 'synthz:trial';
function trialGet(){ try{ return JSON.parse(localStorage.getItem(TRIAL_KEY) || 'null'); }catch(e){ return null; } }
function trialSet(v){ try{ localStorage.setItem(TRIAL_KEY, JSON.stringify(v)); }catch(e){} try{ dispatchEvent(new CustomEvent('synthz-trial', { detail:v })); }catch(e){} }
async function trialStart(){
  const t = trialGet(); if (t && t.token) return t;
  const d = await api('trial', { method:'POST', body:{ action:'start' }, keep:true });
  const v = { token:d.token, left:d.left, max:d.max }; trialSet(v); return v;
}
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
  h += row(puterLogo(), 'Puter', pu && pu.pct != null ? 'Te queda <em>' + Math.round(pu.pct * 100) + '%</em> de tu crédito gratis de este mes' : pu && pu.err ? 'Puter no respondió con tu saldo. Intenta más tarde.' : window.puter && puter.auth && puter.auth.isSignedIn && puter.auth.isSignedIn() ? 'Puter todavía no nos dice cuánto saldo te queda.' : 'Puter es opcional. Conecta tu versión pro de las IAs más usadas.', 'Saldo de Puter · se llena otra vez cada mes');
  const or = b.openrouter, fr = todayReq('openrouter', true);
  const orMain = or && !or.err
    ? 'Modelos gratis: <em>' + fmt(fr) + '</em> de ' + (or.freeTier ? '50' : '50 (o 1.000 si compraste 10 créditos o más)') + ' mensajes hoy'
    : or && or.err === 401 ? 'OpenRouter dice que tu llave no es válida.' : or && or.err ? 'OpenRouter no respondió con tu saldo.' : state.useTeam ? 'Usas el OpenRouter de tu equipo (mira el límite abajo).' : 'Pega tu llave de OpenRouter para ver tus límites.';
  const orSub = or && !or.err ? (or.limit != null && or.left != null ? 'Crédito de tu llave: quedan $' + or.left.toFixed(2) + ' de $' + or.limit.toFixed(2) + ' · ' : 'Tu llave no tiene tope de crédito · ') + 'los mensajes de hoy los cuenta SynthZ en tus dispositivos' : '';
  void orMain; void orSub;
  if (extra) h += extra;
  return '<div class="bl">' + h + '</div>';
}
/* desglose: confirmado (lo reportó el proveedor) vs estimado (≈, SynthZ lo calculó por el largo del texto) */
function splitHtml(){ return limBar({ puter:true }); }
function syncNote(){
  if (!ACC.ready) return signedish() ? '<p class="cnote">Abriendo tu cuenta…</p>' : '<p class="cnote">Tus chats se guardan en este equipo. Entra a tu cuenta para verlos también en tu celular o en otro computador.</p>';
  if (ACC.full) return '<p class="sxerr">⚠ ' + esc(ACC.err) + '</p>';
  if (ACC.err) return '<p class="sxerr">⚠ No pude guardar en tu cuenta (' + esc(ACC.err) + '). Todo sigue aquí y se sube solo cuando vuelva la conexión.</p>';
  return '<p class="cnote">Guardado en tu cuenta' + (ACC.t ? ' · guardado hace ' + Math.max(1, Math.round((Date.now() - ACC.t) / 1000)) + ' s' : '') + '.</p>';
}

/* secciones que se abren y cierran suave (alto + desenfoque), SynthZ Style */
function smoothDetails(scope){
  $$('details', scope).forEach(d => {
    const s = $('summary', d), body = () => [...d.children].filter(x => x !== s);
    s.addEventListener('click', e => {
      if (reduce || !CFG.anim) return;                       /* modo rendimiento: abre al instante */
      e.preventDefault();
      if (d._anim) d._anim.cancel();
      const from = d.offsetHeight, opening = !d.open;
      if (opening) d.open = true;
      const to = opening ? d.scrollHeight : s.offsetHeight + parseFloat(getComputedStyle(d).borderTopWidth || 0);
      d.style.overflow = 'hidden';
      d._anim = d.animate([{ height:from + 'px' }, { height:to + 'px' }], { duration:opening ? 520 : 380, easing:'cubic-bezier(.22,1,.36,1)' });
      body().forEach(x => x.animate(opening ? [{ opacity:0, filter:'blur(6px)', transform:'translateY(-6px)' }, { opacity:1, filter:'blur(0)', transform:'none' }] : [{ opacity:1, filter:'blur(0)' }, { opacity:0, filter:'blur(4px)' }], { duration:opening ? 520 : 260, easing:'cubic-bezier(.22,1,.36,1)', fill:'both' }));
      d._anim.onfinish = () => { d._anim = null; d.style.overflow = ''; if (!opening) d.open = false; body().forEach(x => x.getAnimations().forEach(a => a.cancel())); };
    });
  });
}
/* ---------- guía breve: panel lateral que no tapa la conversación; se abre con el botón «?» ---------- */
function helpGuide(opts){
  opts = opts || {};
  const old = $('#szHelp'); if (old){ old.classList.remove('on'); setTimeout(() => old.remove(), 380); return; }
  const back = document.activeElement;
  const S = [
    ['¿Qué es SynthZ?', 'Un lugar para hablar con muchas IA, gratis. Escribes lo que necesitas y una IA te responde. No tienes que configurar nada.'],
    ['¿Cómo lo uso?', 'Entra a SynthFlow, escribe tu pregunta abajo y pulsa Enter. Si no sabes qué pedir, toca un ejemplo. Tus chats quedan en la barrita de la izquierda (en el celular, abajo).'],
    ['¿Qué son las IAs conectadas?', 'Las IAs conectadas son IAs gratis que ya vienen listas en SynthZ. No tienes que configurar nada ni dar tarjeta: solo escribes. Sin cuenta pruebas con 5 mensajes al día; con tu cuenta gratis, mucho más.'],
    ['¿Qué es el límite de hoy?', 'Cada día tienes un límite gratis para usar las IAs conectadas. A medianoche se vuelve a llenar. El anillo se va vaciando mientras chateas.'],
    ['¿Qué es Puter y cómo lo conecto?', 'Puter: conecta tu versión pro de las IAs más usadas, como ChatGPT, Claude o Gemini. Es gratis y tiene un saldo que se renueva cada mes. Se conecta en Ajustes › IAs y memoria › «Conectar Puter u otra IA» › «Conectar con Puter».'],
    ['Varias IA a la vez', 'Con «+» sumas otra IA (hasta 4). Todas responden lo mismo y tú eliges la que más te gusta con «Esta tiene más Flow».'],
    ['Archivos', 'Con el «+» agregas un archivo, un PDF o una foto (hasta 6 por mensaje). Todas las IA leen textos y PDF; las fotos solo las entienden las IA que «ven fotos». También puedes arrastrarlos o pegarlos.'],
    ['Modo principiante', 'En Ajustes puedes activar el modo principiante: las IA te responden con palabras sencillas, paso a paso y con ejemplos.'],
    ['SuperiorSynth', 'Arriba de tus chats, «SuperiorSynth»: una IA entiende lo que escribiste, lo mejora y se lo pasa a la IA que más sabe de ese tema. Luego decides si te quedas con esa IA. Esos chats se guardan aparte.'],
    ['Configuración', 'En Ajustes eliges si lo quieres «Más bonito» o «Más rápido», y enciendes o apagas cada detalle: cursor, fondo, vidrio, animaciones, sonidos e intro.']
  ];
  const o = document.createElement('aside'); o.id = 'szHelp'; o.setAttribute('aria-label', 'Guía rápida de SynthZ');
  o.innerHTML = '<div class="hh"><b>Guía rápida</b><button type="button" class="hx" data-hclose aria-label="Cerrar la guía">✕</button></div>'
    + '<div class="hb">' + S.map(([q, a], i) => '<details' + (i === (opts.open || 0) ? ' open' : '') + '><summary>' + q + '</summary><p>' + a + '</p></details>').join('')
    + (opts.extra ? '<div class="hx2">' + opts.extra.map(([l], i) => '<button type="button" class="btn sm ghost" data-hx="' + i + '">' + l + '</button>').join('') + '</div>' : '')
    + '<p class="cnote">Puedes volver a abrir esta guía cuando quieras con el botón «Guía».</p></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 380); document.removeEventListener('keydown', key, true); if (back && back.focus) try{ back.focus(); }catch(e){} };
  const key = e => { if (e.key === 'Escape' && !document.querySelector('.szm')){ e.stopPropagation(); close(); } };
  document.addEventListener('keydown', key, true);
  $('[data-hclose]', o).addEventListener('click', close);
  $$('[data-hx]', o).forEach(b => b.addEventListener('click', () => { close(); opts.extra[+b.dataset.hx][1](); }));
  smoothDetails(o);
  setTimeout(() => { const s = $('summary', o); if (s) s.focus(); }, 60);
}

/* cambia el contenido de un bloque con dirección: «siguiente» sube, «atrás» baja (la misma animación al revés) */
function swapDir(el, dir, set){
  if (!el || reduce || root.classList.contains('noanim')){ set(); return; }
  const d = dir < 0 ? -1 : 1;
  el.animate([{ opacity:1, transform:'none', filter:'blur(0)' }, { opacity:0, transform:'translateY(' + (-12 * d) + 'px)', filter:'blur(8px)' }], { duration:200, easing:'cubic-bezier(.55,0,.75,.2)', fill:'forwards' }).onfinish = () => {
    set(); el.animate([{ opacity:0, transform:'translateY(' + (14 * d) + 'px)', filter:'blur(8px)' }, { opacity:1, transform:'none', filter:'blur(0)' }], { duration:380, easing:'cubic-bezier(.22,1,.36,1)', fill:'forwards' });
  };
}
/* ---------- pedir un dato con vidrio (contraseña, código…) ---------- */
function szPrompt(title, text, ok, o){
  o = o || {};
  return new Promise(res => {
    const w = document.createElement('div'); w.className = 'szm szc';
    w.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="word">' + zWord('Synth') + '</div><div class="tb"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p></div>'
      + '<form class="lform" novalidate><span class="lin"><input name="v" type="' + (o.type || 'text') + '"' + (o.sec ? ' data-sec="1" data-lpignore="true" data-1p-ignore data-form-type="other"' : '') + ' autocomplete="' + (o.ac || 'off') + '" placeholder="' + esc(o.placeholder || '') + '" aria-label="' + esc(o.label || title) + '"></span><p class="lerr" role="alert"></p>'
      + '<div class="tbtn" style="margin-top:6px"><button class="lnk" type="button" data-close>Cancelar</button><button class="btn sm' + (o.danger ? ' danger' : '') + '" type="submit">' + esc(ok) + '</button></div></form></div>';
    document.body.appendChild(w); requestAnimationFrame(() => w.classList.add('on'));
    const back = document.activeElement, inp = $('input', w); let gone = false;
    const out = v => { if (gone) return; gone = true; removeEventListener('keydown', key, true); w.classList.remove('on'); setTimeout(() => w.remove(), 400); try{ if (back && back.focus) back.focus(); }catch(e){} res(v); };
    const key = e => { if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); out(null); } };
    addEventListener('keydown', key, true);
    $('[data-close]', w).addEventListener('click', () => out(null));
    $('form', w).addEventListener('submit', e => { e.preventDefault(); const v = inp.value.trim(); if (!v){ $('.lerr', w).textContent = o.empty || 'Escribe algo para seguir.'; inp.focus(); return; } out(v); });
    w.addEventListener('pointerdown', e => { if (e.target === w) out(null); });
    setTimeout(() => inp.focus(), 60);
  });
}

/* ---------- confirmación con vidrio (en vez del confirm() del navegador) ---------- */
/* un «mensaje» = lo que escribes una vez (comparar 3 IA o que el agente piense antes sigue siendo 1) */
let TURN = null;
const setTurn = text => { TURN = { id:turnId([{ role:'user', content:String(text || '') }]), at:Date.now() }; };
function turnId(messages){
  const u = [...(messages || [])].reverse().find(m => m && m.role === 'user'); let t = u ? (typeof u.content === 'string' ? u.content : JSON.stringify(u.content)) : '';
  let h = 5381; for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0;
  return 't' + (h >>> 0).toString(36) + '-' + Math.floor(Date.now() / 600000).toString(36);
}
/* sin cuenta, después de los mensajes de prueba: «Para seguir FlowIAndo, entra o crea tu cuenta» */
let gateOpen = false;
function guestGate(o = {}){
  if (gateOpen || signedish() || document.querySelector('#authm,#acc,#szGate')) return;
  gateOpen = true;
  const g = SZQ.guest || { max:5 }, pu = !!(window.puter && puter.auth && puter.auth.isSignedIn && (() => { try{ return puter.auth.isSignedIn(); }catch(e){ return false; } })());
  const el = document.createElement('div'); el.id = 'szGate'; el.className = 'szm';
  el.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Entra para seguir"><div class="word">' + zWord('Synth') + '</div><div class="tn">SIGUE FLOWIANDO</div>'
    + '<div class="tb"><div class="gtface" aria-hidden="true">' + face('guino', 64) + '</div><h3>Para seguir FlowIAndo, entra a tu cuenta</h3>'
    + '<p>Ya usaste tus ' + (g.max || 5) + ' mensajes de prueba de hoy sin cuenta. Crear tu cuenta es <b>gratis</b>, no pide correo ni tarjeta, y te da mucho más límite cada día. Además tus chats te siguen a cualquier celular o computador.</p>'
    + '<div id="gateBox"></div></div><div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>Ahora no</button>' + (pu ? '<button class="lnk" type="button" data-pu>Seguir con mi Puter</button>' : '') + '</div></div>';
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('on'));
  $('.tcard', el).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:650, easing:'cubic-bezier(.22,1,.36,1)' });
  const out = () => { gateOpen = false; el.classList.remove('on'); setTimeout(() => el.remove(), 450); };
  $('[data-close]', el).addEventListener('click', () => { out(); if (o.onClose) o.onClose(); });
  const pb = $('[data-pu]', el); if (pb) pb.addEventListener('click', () => { out(); try{ dispatchEvent(new CustomEvent('synthz-useputer')); }catch(e){} });
  el.addEventListener('pointerdown', e => { if (e.target === el){ out(); if (o.onClose) o.onClose(); } });
  authBox($('#gateBox', el), () => { out(); szqSet({ guest:null }); szCatalog().catch(() => {}); toast('¡Listo! Ya puedes seguir FlowIAndo.'); if (o.done) o.done(); }, () => {}, o.mode || 'signup');
}
/* apenas tu cuenta está lista: se cierra todo lo que te pedía entrar */
function accSettled(){
  if (!(ACC && ACC.ready)) return;
  szqSet({ guest:null }); szCatalog().catch(() => {});
  document.querySelectorAll('#szGate').forEach(g => { gateOpen = false; g.classList.remove('on'); setTimeout(() => g.remove(), 450); });
  ACC.joining = false; root.classList.add('signed'); root.classList.remove('joining');
}
accHooks.push(k => { if (k === 'out') root.classList.remove('signed'); });
addEventListener('synthz-acc', accSettled); accHooks.push(k => { if (k === 'pull') accSettled(); });
function szConfirm(title, text, ok, danger, no){
  return new Promise(res => {
    const o = document.createElement('div'); o.className = 'szm szc';
    o.innerHTML = '<div class="tcard" role="alertdialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="word">' + zWord('Synth') + '</div><div class="tb"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p></div><div class="tbtn" style="margin-top:16px"><button class="lnk" type="button" data-close>' + esc(no || 'Cancelar') + '</button><button class="btn sm' + (danger ? ' warn' : '') + '" type="button" data-ok>' + esc(ok || 'Aceptar') + '</button></div></div>';
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
  ['reason', 'pensar con calma antes de responder', /r1\b|reason|think|qwq|\bo[134]\b|o[34]-|gpt-oss|apodex|magistral|sonar-reasoning|deepseek-r/i],
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
  { k:'uses', get q(){ return '¿Para qué vas a usar ' + BRAND() + '?'; }, sub:'Elige todas las que quieras.', multi:true, o:[['code', '💻', 'Programar'], ['write', '✍️', 'Escribir y redactar'], ['study', '📚', 'Estudiar y tareas'], ['ideas', '💡', 'Ideas y trabajo'], ['vision', '🖼️', 'Imágenes y PDF'], ['chat', '💬', 'Charlar']] },
  { k:'pace', q:'¿Qué prefieres?', o:[['fast', '⚡', 'Respuestas al instante'], ['mid', '⚖️', 'Equilibrio'], ['deep', '🧠', 'Que piense bien antes']] },
  { k:'lang', q:'¿En qué idioma vas a hablar más?', o:[['es', '🇨🇴', 'Español'], ['en', '🇺🇸', 'Inglés'], ['both', '🌎', 'Los dos']] },
  { k:'key', q:'¿Tienes cuenta de Puter?', sub:'Conecta tu versión pro de las IAs más usadas, como ChatGPT, Claude o Gemini.', o:[['pu', '✨', 'Sí, o quiero conectarla'], ['no', '🙅', 'No, por ahora no'], ['idk', '🤔', 'No sé qué es']] }
];
function surveyScore(m, s){
  if (!s || !s.a) return 0;
  const a = s.a, ex = expertOf(m).tags, has = k => ex.includes(k);
  let sc = 0;
  (a.uses || []).forEach(u => { if (u === 'code' && has('code')) sc += 30; if (u === 'write' && has('write')) sc += 18; if (u === 'study' && (has('reason') || has('long'))) sc += 14; if (u === 'ideas' && (has('write') || has('reason'))) sc += 10; if (u === 'vision' && has('vision')) sc += 30; if (u === 'chat' && (has('fast') || has('write'))) sc += 10; });
  if (a.pace === 'fast' && has('fast')) sc += 22; if (a.pace === 'fast' && has('reason')) sc -= 6;
  if (a.pace === 'deep' && has('reason')) sc += 22; if (a.pace === 'deep' && has('fast')) sc -= 8;
  if ((a.lang === 'es' || a.lang === 'both') && has('lang')) sc += 8;
  if (a.key === 'no' && /^pu:/.test(m.id)) sc -= 20;
  if (a.key === 'pu' && /^pu:/.test(m.id)) sc += 8;
  if (/^sz:/.test(m.id)) sc += 6;
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
  const show = (anim, dir) => {
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
    swapDir($('.tb', card), dir || 1, set);
  };
  $('.svo', card).addEventListener('click', e => {
    const b = e.target.closest('.svb'); if (!b) return; const s = SURVEY[i], v = b.dataset.v;
    if (s.multi){ const L = ans[s.k] || (ans[s.k] = []); const j = L.indexOf(v); if (j > -1) L.splice(j, 1); else L.push(v); b.setAttribute('aria-pressed', String(j < 0)); }
    else { ans[s.k] = v; $$('.svb', card).forEach(x => x.setAttribute('aria-pressed', String(x === b))); setTimeout(() => { if (i < SURVEY.length - 1){ i++; show(true); } }, 260); }
  });
  const close = saved => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); if (done) done(saved); };
  $('[data-skip]', card).addEventListener('click', () => close(false));
  $('[data-back]', card).addEventListener('click', () => { if (i > 0){ i--; show(true, -1); } });
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
    + step(3, 'Cópiala y pégala aquí', 'Empieza por <code>sk-or-</code>. Solo se muestra una vez, guárdala.', '<div class="cbox"><input id="ogKey" type="text" data-sec="1" placeholder="sk-or-…" autocomplete="off" data-lpignore="true" data-1p-ignore data-form-type="other" spellcheck="false"><button class="btn sm" id="ogGo" type="button">Conectar</button></div>')
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
    $('.pfprev', o).innerHTML = '<div class="pfban" style="background:' + grad(d.banner) + '"></div><div class="pfme">' + avatarHtml(d, u, 'xl') + '<div><b>' + esc(d.name || 'Tu nombre') + '</b>' + (d.pronouns ? '<i>' + esc(d.pronouns) + '</i>' : '') + '<span>' + esc(u.email || '') + '</span></div></div>' + (d.status ? '<p class="szps">' + esc(d.status) + '</p>' : '') + (d.bio ? '<p class="pfb">' + esc(d.bio) + '</p>' : '');
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
/* ---------- el navegador no debe rellenar tu usuario o contraseña en buscadores ni en las cajas de llaves ----------
   Solo los campos de entrar/crear cuenta (autocomplete username / current-password / new-password) aceptan autorrelleno. */
(function noAutofill(){
  const CRED = /^(username|current-password|new-password|email)$/;
  const isCred = el => CRED.test(el.getAttribute('autocomplete') || '');
  const tame = el => {
    if (el._szAf || isCred(el) || !/^(INPUT|TEXTAREA)$/.test(el.tagName) || /^(checkbox|radio|file|hidden|range|color|submit|button)$/i.test(el.type)) return;
    el._szAf = 1;
    if (!el.hasAttribute('autocomplete')) el.setAttribute('autocomplete', 'off');
    el.setAttribute('data-lpignore', 'true'); el.setAttribute('data-1p-ignore', ''); el.setAttribute('data-form-type', 'other');
    let typed = false;
    el.addEventListener('keydown', () => { typed = true; });
    el.addEventListener('paste', () => { typed = true; });
    /* si Chrome lo rellena solo, se borra (no fue la persona) */
    el.addEventListener('animationstart', e => { if (e.animationName === 'szAutofill' && !typed){ el.value = ''; el.dispatchEvent(new Event('input', { bubbles:true })); } });
  };
  const scan = root => { if (root.querySelectorAll) root.querySelectorAll('input,textarea').forEach(tame); if (root.tagName) tame(root); };
  const go = () => { scan(document); new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => n.nodeType === 1 && scan(n)))).observe(document.documentElement, { childList:true, subtree:true }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  const st = document.createElement('style');
  st.textContent = '@keyframes szAutofill{from{opacity:1}to{opacity:1}}input:-webkit-autofill:not([autocomplete=username]):not([autocomplete=current-password]):not([autocomplete=new-password]):not([autocomplete=email]){animation:szAutofill .01s}input[data-sec]{-webkit-text-security:disc;text-security:disc}';
  (document.head || document.documentElement).appendChild(st);
})();
/* ---------- SynthonIA: su carita (SVG), con una expresión para cada momento ---------- */
const FACE_G = '#f6d9a0';
const FACE = (() => {
  const open = (dx, dy) => ['M' + (40 + dx) + ' ' + (48 + dy) + 'v8', 'M' + (60 + dx) + ' ' + (48 + dy) + 'v8'];
  const happy = ['M35 54q5-7 10 0', 'M55 54q5-7 10 0'];
  const heart = x => 'M' + x + ' 58l-5.5-5.5a3.2 3.2 0 0 1 5.5-4a3.2 3.2 0 0 1 5.5 4z';
  const star = x => 'M' + x + ' 45l1.8 3.8 4 .5-3 2.8.8 4-3.6-2-3.6 2 .8-4-3-2.8 4-.5z';
  const ring = x => 'M' + (x - 4.5) + ' 52a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0';
  return {
    feliz:{ e:open(0, 0), m:'M42 64q8 7 16 0', ck:1 },
    neutral:{ e:open(0, 0), m:'M45 66h10' },
    encantada:{ e:[heart(40), heart(60)], ec:'#ef7f93', ew:1.6, ef:'#ef7f93', m:'M41 63q9 10 18 0z', mf:1, ck:1 },
    riendo:{ e:happy, m:'M41 62q9 11 18 0z', mf:1, ck:1 },
    guino:{ e:['M40 48v8', 'M55 54q5-7 10 0'], m:'M42 64q8 7 16 0', ck:1 },
    pensando:{ e:open(3, -3), m:'M45 67q5-3 10-1', x:'M84 26h.1M91 16h.1', xw:5 },
    sorprendida:{ e:[ring(40), ring(60)], ew:3, ef:FACE_G, m:'M47 68a3 3 0 1 0 6 0a3 3 0 1 0-6 0', b:'M34 41l10-1M56 40l10 1' },
    senalando:{ e:open(4, 0), m:'M46 65q6 4 12 0' },
    disculpa:{ e:['M40 51v6', 'M60 51v6'], b:'M34 46l10-4M66 46l-10-4', m:'M43 69q7-6 14 0' },
    confundida:{ e:['M40 48v8', 'M60 51v3'], b:'M54 42l12-3', m:'M41 67q3-3 6 0t6 0t6 0' },
    dormida:{ e:['M35 52q5 4 10 0', 'M55 52q5 4 10 0'], ew:3.4, m:'M47 67h6', x:'M73 15h8l-8 9h8' },
    celebrando:{ e:[star(40), star(60)], ew:1.5, ef:FACE_G, m:'M41 62q9 11 18 0z', mf:1, ck:1, x:'M10 16l4 4M90 14l-4 5M6 32h5M94 30h-5', xw:2.6 },
    esperando:{ e:open(-3, -2), m:'M45 66h10', x:'M84 14a6 6 0 1 0 .01 0M84 11v3.5l2.5 2', xw:2 },
    flow:{ glasses:1, m:'M43 65q8 6 16-1', ck:1 },
    preocupada:{ e:open(0, 2), b:'M33 45l11-5M67 45l-11-5', m:'M42 70q4-4 8-1t8-1', drop:1 }
  };
})();
/* v1.4: caras nuevas: triste (si todo salió mal) y «¡ay!» (si le tocas el ojo) */
FACE.triste = { e:['M40 53v4', 'M60 53v4'], ew:6, b:'M32 47l11-5M68 47l-11-5', m:'M41 72q9-8 18 0' };
FACE.auch = { e:['M34 49l10 4-10 4', 'M55 53q5-4 10 0'], ew:3.4, b:'M32 43l12 5M57 45l10-3', m:'M41 70q4.5-4 9 0q4.5 4 9 0', x:'M78 30l4-6M84 36l6-2' };
const FACE_GOOD = ['feliz', 'riendo', 'guino', 'encantada', 'celebrando', 'flow'];
/* v2.4 · cara nueva del boceto: casco de vidrio perlado, visor oscuro con borde que brilla y ojos alargados cian; sin boca.
   Cuando habla salen ondas naranjas a la DERECHA; cuando escucha, ondas azules a la IZQUIERDA. */
const FACE_EYE = '#3de0ff';
(function faceDefs(){
  if (document.getElementById('szFaceDefs')) return;
  const d = document.createElement('div'); d.id = 'szFaceDefs'; d.setAttribute('aria-hidden', 'true');
  d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML = '<svg width="0" height="0"><defs>'
    + '<radialGradient id="szHead" cx=".35" cy=".28" r=".85"><stop offset="0" stop-color="#fff4fb"/><stop offset=".35" stop-color="#f3b9e6"/><stop offset=".7" stop-color="#b48cf0"/><stop offset="1" stop-color="#7a54d8"/></radialGradient>'
    + '<linearGradient id="szRim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5fb4"/><stop offset=".5" stop-color="#b06bff"/><stop offset="1" stop-color="#ff7a45"/></linearGradient>'
    + '<radialGradient id="szVisor" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#1c1240"/><stop offset="1" stop-color="#07041a"/></radialGradient>'
    + '</defs></svg>';
  (document.body || document.documentElement).appendChild(d);
})();
function face(mood, size, cls){
  const f = FACE[mood] || FACE.feliz, z = size || 40, G = FACE_EYE;
  const P = (d, st) => d ? '<path d="' + d + '" ' + st + '/>' : '';
  /* los ojos de antes (rayitas verticales) se estiran un poco: así quedan alargados como en el boceto */
  const tall = d => d.replace(/^M(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)v(\d+)$/, (m, x, y, l) => 'M' + x + ' ' + (+y - 2) + 'v' + (+l + 4));
  const eyes = f.glasses
    ? '<path d="M28 46h18v6a7 7 0 0 1-7 7h-4a7 7 0 0 1-7-7z" fill="#05030f" stroke="' + G + '" stroke-width="2.2"/><path d="M54 46h18v6a7 7 0 0 1-7 7h-4a7 7 0 0 1-7-7z" fill="#05030f" stroke="' + G + '" stroke-width="2.2"/><path d="M46 48q4-2.5 8 0" stroke="' + G + '" stroke-width="2.2" fill="none"/>'
    : f.e.map(d => P(tall(d), 'stroke="' + (f.ec || G) + '" stroke-width="' + (f.ew || 7.5) + '" stroke-linecap="round" stroke-linejoin="round" fill="' + (f.ef === FACE_G ? G : (f.ef || 'none')) + '"')).join('');
  const W = (x, dir, c, k) => '<g class="' + k + '" stroke="' + c + '" stroke-width="2.6" stroke-linecap="round" fill="none">'
    + [5, 10.5, 16].map((r, i) => '<path style="--i:' + i + '" d="M' + x + ' ' + (55 - r) + 'a' + r + ' ' + r + ' 0 0 ' + (dir > 0 ? 1 : 0) + ' 0 ' + (2 * r) + '"/>').join('') + '</g>';
  return '<svg class="szface' + (cls ? ' ' + cls : '') + '" data-mood="' + (FACE[mood] ? mood : 'feliz') + '" viewBox="0 0 100 100" width="' + z + '" height="' + z + '" aria-hidden="true">'
    + W(83, 1, '#ff8a3d', 'fwr') + W(17, -1, '#3de0ff', 'fwl')
    + '<rect x="9" y="47" width="7" height="16" rx="3.5" fill="url(#szRim)"/><rect x="84" y="47" width="7" height="16" rx="3.5" fill="url(#szRim)"/>'
    + '<rect class="fhead" x="13" y="16" width="74" height="74" rx="35" fill="url(#szHead)"/>'
    + '<path d="M26 24q14-8 32-6" stroke="#fff" stroke-opacity=".75" stroke-width="3" stroke-linecap="round" fill="none"/>'
    + '<rect x="21" y="30" width="58" height="48" rx="22" fill="url(#szVisor)" stroke="url(#szRim)" stroke-width="2.4"/>'
    + P(f.b, 'stroke="' + G + '" stroke-opacity=".8" stroke-width="2.4" stroke-linecap="round" fill="none"')
    + '<g class="fe">' + eyes + '</g>'
    + (f.m ? '<path class="fm" d="' + f.m + '" style="display:none"/>' : '')
    + P(f.x, 'stroke="' + G + '" stroke-width="' + (f.xw || 2.4) + '" stroke-linecap="round" stroke-linejoin="round" fill="none"')
    + (f.drop ? '<path class="fdrop" d="M83 28q-6 9-1 12.5q6 2.5 7-3.5q0-3-6-9z" fill="#8fd3e8" fill-opacity=".9"/>' : '')
    + '</svg>';
}
/* v1.9 · SynthonIA mueve la boca con cada letra que dice: a (abierta), e/i (ancha), o/u (redonda), m/b/p (cerrada) */
const VIS = { a:['M42 61.5q8-2 16 0q-1 9-8 9q-7 0-8-9z', 1], e:['M40.5 62.5q9.5-1.5 19 0q-2 5.5-9.5 5.5q-7.5 0-9.5-5.5z', 1], o:['M45.5 60.5q4.5-2 9 0q2.5 4.5 0 9q-4.5 2-9 0q-2.5-4.5 0-9z', 1], m:['M43 65h14', 0], c:['M42.5 63q7.5 4.5 15 0', 0] };
function visOf(ch){ const c = String(ch || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); return c === 'a' ? 'a' : (c === 'e' || c === 'i' || c === 'y') ? 'e' : (c === 'o' || c === 'u') ? 'o' : 'mbpfv'.includes(c) && c ? 'm' : /[a-zñ0-9]/.test(c) ? 'c' : 'm'; }
function mouthSet(svgs, v){
  svgs.forEach(s => { const m = s && s.querySelector && s.querySelector('.fm'); if (!m) return;
    if (m._d0 == null){ m._d0 = m.getAttribute('d'); m._f0 = m.getAttribute('fill'); }
    if (v === null){ m.setAttribute('d', m._d0); m.setAttribute('fill', m._f0); return; }
    m.setAttribute('d', VIS[v][0]); m.setAttribute('fill', VIS[v][1] ? FACE_G : 'none'); });
}
/* v2.2 · habla de verdad: la frase se parte en sílabas y la boca las «dice» a ritmo de voz (≈7 por segundo),
   con la forma de cada vocal (a abierta, e/i ancha, o/u redonda), labios cerrados en m/b/p y paso suave entre una y otra.
   Devuelve el «onFrame» para typeIn: arranca al primer cuadro y termina poco después de que se escribe todo. */
const MOUTH = { a:[7.2, 6.4], e:[9, 3.6], i:[8.4, 2.8], o:[4.8, 5.6], u:[3.8, 4.4], m:[7, .5], f:[6.4, 1.6], c:[6, 2.4], r:[5.4, 0] };
function syllables(text){
  const t = String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zñ\s]/g, ' ');
  const out = [];
  for (const w of t.split(/\s+/).filter(Boolean)){
    const parts = w.match(/[^aeiou]*[aeiou]+/g) || [w];
    for (const s of parts){
      const v = (s.match(/[aeiou]/) || ['a'])[0], c = s.replace(/[aeiou]+$/, '').slice(-1);
      if (c && 'mbp'.includes(c)) out.push('m'); else if (c && 'fv'.includes(c)) out.push('f');
      out.push(v);
    }
    out.push('r');                                   /* respiro entre palabras */
  }
  return out;
}
function talkEls(svg){
  if (svg._talk) return svg._talk;
  return (svg._talk = { g:svg.querySelector('.fwr') });
}
function lipSync(svgs, text){
  svgs = (svgs || []).filter(Boolean); if (!svgs.length || reduce) return undefined;
  const seq = syllables(text); if (!seq.length) return undefined;
  let raf = 0, t0 = 0, doneAt = 0, rx = 6, ry = 0, i = 0;
  const fm = svg => svg.querySelector('.fm');
  const L = svgs.map(el => ({ el, ball:!!(el.closest && el.closest('#szBot')) }));
  const live = () => L.map(o => { if (!o.el.isConnected && o.ball) o.el = ballFace() || o.el; return o.el; }).filter(e => e.isConnected);
  const paint = () => live().forEach(svg => { const T = talkEls(svg); if (!T.g) return;
    svg.classList.add('talking'); T.g.style.setProperty('--amp', Math.min(1, ry / 6).toFixed(2)); });
  const stop = () => { cancelAnimationFrame(raf); raf = 0; L.map(o => o.el).forEach(svg => { svg.classList.remove('talking'); const T = svg._talk; if (T && T.g) T.g.style.removeProperty('--amp'); }); };
  const SYL = 140;                                    /* ms por sílaba: ritmo de voz */
  function loop(now){
    if (!t0) t0 = now;
    i = Math.floor((now - t0) / SYL);
    const ending = doneAt && (now - doneAt > 1100 || i >= seq.length);
    const v = ending ? 'r' : seq[Math.min(i, seq.length - 1)], tgt = MOUTH[v] || MOUTH.c;
    const ph = ((now - t0) % SYL) / SYL, open = v === 'r' || v === 'm' ? 1 : Math.sin(Math.min(1, ph * 1.6) * Math.PI) * .35 + .75;
    rx += (tgt[0] - rx) * .35; ry += (tgt[1] * open - ry) * .38;
    paint();
    if (ending && ry < .6){ stop(); return; }
    raf = requestAnimationFrame(loop);
  }
  return k => {
    if (!raf && !doneAt) raf = requestAnimationFrame(loop);
    if (k >= 1 && !doneAt) doneAt = performance.now();
  };
}
const ballFace = () => { const b = document.getElementById('szBot'); return b ? (b.querySelector('.bf > :last-child .szface') || b.querySelector('.bf .szface')) : null; };
const randomGoodFace = (not) => { const L = FACE_GOOD.filter(m => !(not && not.has && not.has(m))); return L[Math.floor(Math.random() * L.length)] || 'feliz'; };

/* ---------- sonidos SynthZ: sintetizados en vivo (Web Audio), sin archivos; se apagan en Ajustes ---------- */
const SND = (() => {
  let ac = null, out = null, noiseBuf = null, armed = false;
  const on = () => CFG.sound !== false;
  function ctx(){
    if (!ac){
      const A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
      try{ ac = new A(); }catch(e){ return null; }
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
      out = ac.createGain(); out.gain.value = .5; out.connect(comp); comp.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return ac;
  }
  /* el navegador solo deja sonar después de un toque o una tecla */
  const arm = () => { armed = true; if (on()) ctx(); };
  ['pointerdown', 'keydown', 'touchend'].forEach(ev => addEventListener(ev, arm, { once:true, passive:true, capture:true }));
  const noise = c => { if (!noiseBuf){ noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } const s = c.createBufferSource(); s.buffer = noiseBuf; return s; };
  const amp = (c, t, a, peak, d) => { const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); return g; };
  const play = fn => { if (!on() || !armed) return; const c = ctx(); if (!c) return; try{ fn(c, c.currentTime + .01); }catch(e){} };
  const tone = (c, t, type, f0, f1, a, peak, d, dest) => { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + a + d); const g = amp(c, t, a, peak, d); o.connect(g); g.connect(dest || out); o.start(t); o.stop(t + a + d + .05); return o; };
  const hiss = (c, t, kind, f, q, a, peak, d, f2) => { const s = noise(c), b = c.createBiquadFilter(); b.type = kind; b.frequency.setValueAtTime(f, t); if (f2) b.frequency.exponentialRampToValueAtTime(f2, t + a + d); b.Q.value = q; const g = amp(c, t, a, peak, d); s.connect(b); b.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + a + d + .05); };
  let lastKey = 0;
  return {
    /* tecla mecánica «brown»: golpe táctil suave y un «thock» grave */
    key(){ const now = performance.now(); if (now - lastKey < 28) return; lastKey = now; play((c, t) => { const v = Math.random(); hiss(c, t, 'bandpass', 1700 + v * 700, 1.1, .002, .28, .03); tone(c, t, 'triangle', 150 + v * 35, 85, .002, .22, .06); hiss(c, t + .018, 'highpass', 4200, .7, .001, .08, .012); }); },
    /* destello de Flow: campanita brillante, aguda, sin voz */
    flow(){ play((c, t) => { [[1568, .16], [2349, .1], [3136, .06], [4186, .035]].forEach(([f, p], i) => tone(c, t + i * .035, 'sine', f, f * 1.003, .008, p, 1.3 - i * .18)); hiss(c, t, 'highpass', 7000, .5, .02, .045, .5); }); },
    /* papel que se desliza (cuando «Synth» se esconde detrás de «Flow») */
    paper(){ play((c, t) => { hiss(c, t, 'bandpass', 650, .8, .07, .2, .32, 2800); hiss(c, t + .05, 'highpass', 3000, .5, .05, .05, .25); }); },
    /* «woauu» al entrar en la «o», y el golpe al llegar */
    woauu(){ play((c, t) => {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(330, t + .3); o.frequency.exponentialRampToValueAtTime(240, t + .62);
      const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 5; f1.frequency.setValueAtTime(420, t); f1.frequency.exponentialRampToValueAtTime(820, t + .32); f1.frequency.exponentialRampToValueAtTime(600, t + .62);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(700, t); lp.frequency.exponentialRampToValueAtTime(3200, t + .5);
      const g = amp(c, t, .12, .22, .55); o.connect(f1); f1.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + .75);
      tone(c, t, 'sine', 220, 660, .1, .07, .55);
      hiss(c, t, 'bandpass', 500, .7, .25, .08, .4, 3000);
    }); },
    impact(){ play((c, t) => { tone(c, t, 'sine', 78, 36, .004, .55, .42); hiss(c, t, 'lowpass', 900, .7, .003, .25, .28); tone(c, t + .02, 'triangle', 220, 110, .003, .06, .2); }); },
    /* SynthonIA: un «bip» amable (sube si está contenta, baja si se disculpa) */
    blip(mood){ play((c, t) => { const sad = mood === 'disculpa' || mood === 'confundida' || mood === 'preocupada'; tone(c, t, 'sine', sad ? 620 : 640, sad ? 430 : 980, .006, .09, .1); tone(c, t + .07, 'sine', sad ? 470 : 990, sad ? 360 : 1320, .006, .06, .09); }); },
    /* la manita hace clic */
    tap(){ play((c, t) => { tone(c, t, 'sine', 1300, 900, .002, .07, .045); hiss(c, t, 'highpass', 3500, .6, .001, .05, .02); }); },
    /* llegó ayuda / aviso del panel: se expande */
    expand(){ play((c, t) => { hiss(c, t, 'bandpass', 300, .9, .25, .1, .35, 4200); [523, 659, 784].forEach((f, i) => tone(c, t + .12 + i * .04, 'sine', f, f, .05, .07, .7)); }); },
    /* terminó la guía: arpegio corto */
    done(){ play((c, t) => { [523, 659, 784, 1047].forEach((f, i) => tone(c, t + i * .085, 'triangle', f, f, .006, .1, .35)); hiss(c, t + .3, 'highpass', 6000, .5, .02, .03, .4); }); },
    /* v1.4 · sonidos de transición futuristas y suaves: un brillo de cristal que respira (sin golpes) */
    shimmer(){ play((c, t) => {
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(5200, t + 1.1); lp.frequency.exponentialRampToValueAtTime(1800, t + 2.2); lp.Q.value = .7; lp.connect(out);
      [[392, .045], [587.3, .035], [880, .025], [1174.7, .018], [1760, .01]].forEach(([f, p], i) => { tone(c, t + i * .06, 'sine', f, f * 1.004, .5, p, 1.6, lp); tone(c, t + i * .06 + .02, 'sine', f * 1.006, f * 1.01, .55, p * .6, 1.5, lp); });
      hiss(c, t + .1, 'bandpass', 5200, 3, .6, .012, 1.2, 9000);
    }); },
    /* entrar por la «o»: un aire que sube, muy bajito */
    warp(){ play((c, t) => { hiss(c, t, 'lowpass', 300, .8, .9, .05, .6, 4200); tone(c, t, 'sine', 196, 392, .8, .03, .5); tone(c, t + .05, 'sine', 294, 588, .8, .02, .5); }); },
    get enabled(){ return on(); }
  };
})();

/* v2.4 · SynthonIA te escucha: mientras escribes (en el chat o en su ventanita) le salen ondas azules a la izquierda */
(function listen(){
  let t = 0;
  addEventListener('input', e => {
    const el = e.target; if (!el || !el.matches || !el.matches('textarea, input[type=text], input:not([type]), [contenteditable=true]')) return;
    document.documentElement.classList.add('szlisten'); clearTimeout(t);
    t = setTimeout(() => document.documentElement.classList.remove('szlisten'), 1300);
  }, true);
})();
/* ---------- la manita robótica de SynthonIA: señala, hace clic, escribe y explica ---------- */
const HAND_SVG = {
  arrow:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 3l20 11.2-8.6 2.2L12 25.5z" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.6" stroke-linejoin="round"/><path d="M8.6 8.3l11.3 6.3" stroke="#fff4d6" stroke-opacity=".7" stroke-width="1.2" stroke-linecap="round"/><circle cx="12.6" cy="17.6" r="1.6" fill="#c9566c" stroke="#1a0f08" stroke-width=".8"/></svg>',
  point:'<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="14.6" y="10.6" width="3.9" height="7" rx="1.95" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.3"/><rect x="18.3" y="11.6" width="3.7" height="6.4" rx="1.85" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.3"/><rect x="21.8" y="13" width="3.4" height="5.6" rx="1.7" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.3"/><path d="M7.4 17.4c0-1.8 1.3-3 3-3h11.6c2 0 3.4 1.4 3.4 3.4v3.4c0 4.2-3.2 7.4-7.4 7.4h-3.2c-4.2 0-7.4-3.2-7.4-7.4z" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.4" stroke-linejoin="round"/><path d="M7.6 18.6c-1.9-1.2-4-.2-3.9 1.7.1 1.3 1.3 2.2 3 3.4l2.8 1.6" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><rect x="9.2" y="1.4" width="5.4" height="17.4" rx="2.7" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.4"/><path d="M10 7h3.8M10 11.6h3.8" stroke="#1a0f08" stroke-opacity=".45" stroke-width="1" stroke-linecap="round"/><path d="M10.6 3.4v2" stroke="#fff4d6" stroke-opacity=".75" stroke-width="1.1" stroke-linecap="round"/><rect x="10" y="26.6" width="12.6" height="3.6" rx="1.6" fill="#c9566c" stroke="#1a0f08" stroke-width="1.2"/><circle cx="18.6" cy="21.6" r="1.5" fill="#c9566c"/></svg>',
  grab:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7.4 13.6c0-1.8 1.4-3 3-3h10.8c2.6 0 4.4 1.8 4.4 4.4v5.6c0 4.4-3.4 7.8-7.8 7.8h-2.6c-4.4 0-7.8-3.4-7.8-7.8z" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.4"/><path d="M11 10.8v4M14.8 10.6v4.4M18.6 10.6v4.4M22.2 11.2v4" stroke="#1a0f08" stroke-opacity=".55" stroke-width="1.1" stroke-linecap="round"/><rect x="10.2" y="26.2" width="12.6" height="3.6" rx="1.6" fill="#c9566c" stroke="#1a0f08" stroke-width="1.2"/></svg>',
  palm:'<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="8.4" y="4.2" width="3.7" height="12.6" rx="1.85" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.3"/><rect x="12.4" y="1.6" width="3.8" height="15" rx="1.9" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.3"/><rect x="16.5" y="2.4" width="3.7" height="14.4" rx="1.85" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.3"/><rect x="20.4" y="5.2" width="3.4" height="11.8" rx="1.7" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.3"/><path d="M7.8 15.2c0-1.5 1.1-2.5 2.6-2.5h11.6c1.8 0 3 1.2 3 3v4.6c0 4.3-3.3 7.6-7.6 7.6h-2.6c-4.2 0-7-3.3-7-7.6z" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 17.6c-1.6-2-4.4-1.6-4.3.4.1 1.4 1.5 2.4 3.3 3.6l2.2 1.4" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.2 4v2.2M17.3 4.6v2" stroke="#fff4d6" stroke-opacity=".75" stroke-width="1.1" stroke-linecap="round"/><rect x="10" y="26.6" width="12.6" height="3.6" rx="1.6" fill="#c9566c" stroke="#1a0f08" stroke-width="1.2"/><circle cx="18.4" cy="20.6" r="1.5" fill="#c9566c"/></svg>',
  text:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M11 4.5c2.4 0 4 .8 5 2 1-1.2 2.6-2 5-2M11 27.5c2.4 0 4-.8 5-2 1 1.2 2.6 2 5 2M16 6.5v19M13.2 16h5.6" fill="none" stroke="#1a0f08" stroke-width="4" stroke-linecap="round"/><path d="M11 4.5c2.4 0 4 .8 5 2 1-1.2 2.6-2 5-2M11 27.5c2.4 0 4-.8 5-2 1 1.2 2.6 2 5 2M16 6.5v19M13.2 16h5.6" fill="none" stroke="url(#hgd)" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="16" r="1.4" fill="#c9566c"/></svg>'
};
const HAND_HOT = { arrow:[5, 3], point:[11.9, 1.8], grab:[16, 12], text:[16, 16], palm:[16, 14] };
const HAND = (() => {
  let el = null, spot = null, say = null, x = -80, y = -80, shape = 'arrow', alive = false, raf = 0, sayTok = 0, wraf = 0, wArea = null;
  const fast = () => !CFG.anim || PERF;
  function build(){
    if (el) return;
    el = document.createElement('div'); el.id = 'szHand'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="hgd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe7b0"/><stop offset=".45" stop-color="#e6b65f"/><stop offset="1" stop-color="#b8743f"/></linearGradient></defs></svg><div class="hs"></div><span class="hl">SynthonIA</span>';
    spot = document.createElement('div'); spot.id = 'szSpot'; spot.setAttribute('aria-hidden', 'true');
    say = document.createElement('div'); say.id = 'szSay'; say.setAttribute('role', 'status'); say.setAttribute('aria-live', 'polite');
    document.body.append(spot, el, say);
    setShape('arrow'); paint();
  }
  function setShape(s){ if (!el || (s === shape && $('.hs', el).firstChild)) return; shape = s; $('.hs', el).innerHTML = HAND_SVG[s] || HAND_SVG.arrow; el.dataset.s = s; }
  function paint(rot){ if (!el) return; const [hx, hy] = HAND_HOT[shape] || [0, 0]; el.style.transform = 'translate3d(' + (x - hx * 1.25).toFixed(1) + 'px,' + (y - hy * 1.25).toFixed(1) + 'px,0)' + (rot ? ' rotate(' + rot.toFixed(2) + 'deg)' : ''); }
  const rectOf = t => { const n = typeof t === 'string' ? $(t) : t; if (!n) return null; if (n.getBoundingClientRect){ const r = n.getBoundingClientRect(); return r.width || r.height ? r : null; } return { left:t.x, top:t.y, width:0, height:0, right:t.x, bottom:t.y }; };
  const visible = t => { const n = typeof t === 'string' ? $(t) : t; return !!(n && n.getBoundingClientRect && n.getClientRects().length && getComputedStyle(n).visibility !== 'hidden'); };
  function show(from){ build(); alive = true; if (from){ x = from.x; y = from.y; } paint(); el.classList.add('on'); spot.classList.add('ready'); }
  function hide(){ alive = false; cancelAnimationFrame(raf); stopWander(); if (!el) return; el.classList.remove('on'); spot.classList.remove('on'); say.classList.remove('on'); const a = el, b = spot, c = say; el = spot = say = null; setTimeout(() => { a.remove(); b.remove(); c.remove(); }, 600); }
  /* se mueve en una curva suave, con un poquito de inclinación según la velocidad */
  function moveTo(t, o = {}){
    build(); const r = rectOf(t); if (!r) return Promise.resolve(false);
    const tx = o.x != null ? o.x : r.left + r.width * (o.fx != null ? o.fx : .5), ty = o.y != null ? o.y : r.top + r.height * (o.fy != null ? o.fy : .5);
    if (o.shape) setShape(o.shape);
    if (!o._w) stopWander();
    const x0 = x, y0 = y, d = Math.hypot(tx - x0, ty - y0);
    const D = fast() ? Math.min(380, 160 + d * .25) : Math.min(1150, 380 + d * .55);
    const bend = fast() ? 0 : Math.min(90, d * .18) * (o.bend || (tx > x0 ? -1 : 1));
    const mx = (x0 + tx) / 2 + (-(ty - y0) / (d || 1)) * bend, my = (y0 + ty) / 2 + ((tx - x0) / (d || 1)) * bend;
    cancelAnimationFrame(raf);
    return new Promise(res => {
      const t0 = performance.now(); let px = x, py = y;
      (function f(now){
        if (!el){ res(false); return; }
        const k = Math.min(1, (now - t0) / D), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, u = 1 - e;
        x = u * u * x0 + 2 * u * e * mx + e * e * tx; y = u * u * y0 + 2 * u * e * my + e * e * ty;
        const vx = x - px; px = x; py = y;
        paint(fast() ? 0 : clamp(vx * .9, -14, 14));
        if (k < 1) raf = requestAnimationFrame(f); else { paint(0); res(true); }
      })(t0);
    });
  }
  /* aro de luz alrededor de lo que explica; el resto se oscurece un poco */
  let spotT = null;
  function spotOn(t, pad){
    build(); if (spotT && spotT.removeAttribute) spotT.removeAttribute('data-guide-ok'); spotT = t && t.nodeType === 1 ? t : null; if (spotT) spotT.setAttribute('data-guide-ok', '');
    const r = rectOf(t); if (!r){ spot.classList.remove('on'); return; }
    const p = pad == null ? 8 : pad, rad = Math.min(26, (r.height + p * 2) / 2);
    Object.assign(spot.style, { left:(r.left - p) + 'px', top:(r.top - p) + 'px', width:(r.width + p * 2) + 'px', height:(r.height + p * 2) + 'px', borderRadius:rad + 'px' });
    spot.classList.add('on');
  }
  const spotOff = () => { if (spot) spot.classList.remove('on'); if (spotT && spotT.removeAttribute) spotT.removeAttribute('data-guide-ok'); spotT = null; };
  /* clic con la manita: se aprieta, sale una onda y (si se pide) hace el clic de verdad */
  async function click(t, o = {}){
    if (t && !(await moveTo(t, Object.assign({ shape:'point' }, o)))) return false;
    setShape('point'); el.classList.add('press'); SND.tap();
    const w = document.createElement('i'); w.className = 'szripple'; w.style.left = x + 'px'; w.style.top = y + 'px'; document.body.appendChild(w); setTimeout(() => w.remove(), 700);
    await sleepRaw(140); if (el) el.classList.remove('press');
    if (o.real){ const n = typeof t === 'string' ? $(t) : t; if (n && n.click) n.click(); }
    await sleepRaw(160); return true;
  }
  /* escribe en una caja de texto, letra por letra, con sonido de tecla */
  async function type(t, text, o = {}){
    const n = typeof t === 'string' ? $(t) : t; if (!n) return false;
    await moveTo(n, { shape:'text', fx:.12, fy:.5 });
    n.focus({ preventScroll:true }); n.value = '';
    const cps = fast() ? 400 : (o.cps || 38), step = fast() ? 6 : 1;
    for (let i = 0; i < text.length && el; i += step){
      n.value = text.slice(0, i + step); n.dispatchEvent(new Event('input', { bubbles:true }));
      if (!fast() && text[i] !== ' ') SND.key();
      await sleepRaw(1000 / cps * (/[.,!?]/.test(text[i]) ? 3 : 1));
    }
    n.value = text; n.dispatchEvent(new Event('input', { bubbles:true }));
    if (el) setShape('arrow'); return true;
  }
  /* SynthonIA habla en una burbuja junto a la manita (con botones opcionales) */
  function talk(text, o = {}){
    build(); const tok = ++sayTok;
    const mood = o.mood || 'feliz', btns = o.buttons || [];
    say.innerHTML = '<span class="sf">' + face(mood, 56) + '</span><div class="st"><b>SynthonIA</b><p></p>' + (btns.length ? '<div class="sb">' + btns.map((b, i) => '<button type="button" class="btn sm' + (b.ghost ? ' ghost' : '') + '" data-sb="' + i + '">' + esc(b.label) + '</button>').join('') + '</div>' : '') + '</div>';
    const p = $('p', say); p.textContent = text;
    say.classList.remove('on'); void say.offsetWidth;
    /* lo más cerca posible de lo que explica, sin salirse de la pantalla */
    const W = Math.min(340, innerWidth - 24), r = o.near ? rectOf(o.near) : null;
    say.style.width = W + 'px';
    let lx, ly; const H = say.offsetHeight || 120;
    if (r){
      lx = clamp(r.left + r.width / 2 - W / 2, 12, innerWidth - W - 12);
      ly = r.bottom + 18 + H < innerHeight - 12 ? r.bottom + 18 : r.top - H - 18 > 12 ? r.top - H - 18 : clamp(innerHeight / 2 - H / 2, 12, innerHeight - H - 12);
      if (o.side && r.right + 24 + W < innerWidth - 12){ lx = r.right + 24; ly = clamp(r.top + r.height / 2 - H / 2, 12, innerHeight - H - 12); }
    } else { lx = clamp(innerWidth / 2 - W / 2, 12, innerWidth - W - 12); ly = clamp(innerHeight * .34 - H / 2, 12, innerHeight - H - 12); }
    say.style.left = lx + 'px'; say.style.top = ly + 'px';
    requestAnimationFrame(() => say && say.classList.add('on'));
    SND.blip(mood);
    if (!fast()) typeIn(p, { cps:48, max:4, onFrame:lipSync([$('.sf .szface', say), ballFace()], text) }).catch(() => { p.textContent = text; });
    return new Promise(res => {
      if (!btns.length){ res(-1); return; }
      $$('[data-sb]', say).forEach(b => b.addEventListener('click', () => { if (tok === sayTok) res(+b.dataset.sb); }));
      if (o.auto) setTimeout(() => { if (tok === sayTok) res(-2); }, o.auto);
    });
  }
  const quiet = () => { if (say) say.classList.remove('on'); };
  /* mientras eliges algo (p. ej. los temas), la manita no se queda quieta tapando opciones:
     flota suave por fuera del panel, arriba y abajo, sin ponerse encima de nada */
  function stopWander(){ cancelAnimationFrame(wraf); wraf = 0; wArea = null; }
  function spotFor(r){
    const W = innerWidth, Hh = innerHeight, m = 46;
    if (r.right + m + 30 < W) return { x:r.right + m, y:r.top + r.height * .45, ax:'y', amp:Math.min(120, r.height * .3) };
    if (r.left - m - 30 > 0) return { x:r.left - m, y:r.top + r.height * .45, ax:'y', amp:Math.min(120, r.height * .3) };
    if (r.bottom + 56 < Hh) return { x:r.left + r.width * .5, y:r.bottom + 34, ax:'x', amp:Math.min(140, r.width * .3) };
    if (r.top - 56 > 0) return { x:r.left + r.width * .5, y:r.top - 30, ax:'x', amp:Math.min(140, r.width * .3) };
    return { x:clamp(r.right - 28, 30, W - 30), y:clamp(r.bottom - 22, 30, Hh - 30), ax:'y', amp:16 };
  }
  async function wander(area){
    stopWander(); if (!area) return; build(); wArea = area;
    const r0 = rectOf(area); if (!r0) return;
    const s0 = spotFor(r0); setShape('arrow');
    await moveTo({ x:s0.x, y:s0.y }, { shape:'arrow', _w:true });
    if (wArea !== area || !el) return;
    const t0 = performance.now(); let last = 0;
    (function f(now){
      if (wArea !== area || !el || !area.isConnected){ wraf = 0; return; }
      wraf = requestAnimationFrame(f);
      if (fast() && now - last < 50) return; last = now;
      const r = rectOf(area); if (!r) return; const sp = spotFor(r), t = (now - t0) / 1000;
      const a = Math.sin(t * .55) * sp.amp + Math.sin(t * 1.3) * 10, b = Math.sin(t * .9 + 1) * 12;
      const nx = sp.ax === 'y' ? sp.x + b : sp.x + a, ny = sp.ax === 'y' ? sp.y + a : sp.y + b;
      const vx = nx - x; x += (nx - x) * .08; y += (ny - y) * .08;
      paint(clamp(vx * .4, -8, 8) + Math.sin(t * 1.7) * 4);
    })(t0);
  }
  /* «¡hola!»: la manita se abre y saluda */
  async function wave(n){
    build(); stopWander(); const prev = shape; setShape('palm');
    const hs = $('.hs', el); if (!hs) return;
    hs.style.transformOrigin = '50% 92%';
    const a = hs.animate([{ transform:'rotate(0)' }, { transform:'rotate(-20deg)' }, { transform:'rotate(18deg)' }, { transform:'rotate(-16deg)' }, { transform:'rotate(14deg)' }, { transform:'rotate(-8deg)' }, { transform:'rotate(0)' }], { duration:(n || 1) * 1300, easing:'ease-in-out' });
    SND.blip('feliz');
    await new Promise(r => { a.onfinish = r; a.oncancel = r; setTimeout(r, (n || 1) * 1300 + 200); });
    if (el && shape === 'palm') setShape(prev === 'palm' ? 'arrow' : prev);
  }
  return { show, hide, moveTo, click, type, talk, quiet, wander, wave, spot:spotOn, unspot:spotOff, shape:setShape, visible, get alive(){ return alive; }, get pos(){ return { x, y }; } };
})();

/* =====================================================================
   SynthonIA, la ayudante: bolita flotante (en el celular, junto al logo del chat)
   1) respuestas guardadas: no gastan nada y, si es un «¿dónde está…?», te lo señala con su manita
   2) si no la sabe, piensa con una IA gratis de SynthZ (máx. 15 preguntas nuevas al día)
   3) «Hablar con el equipo»: una persona (Prime, ZFlow o Symmetrix) te responde aquí mismo
   ===================================================================== */
const BOT_FAQ = [
  { k:'conectar conecto conexion conecta llave key activar bloqueado bloqueo desbloquear funciona', a:'Para chatear no tienes que configurar nada: escribe y listo. Las IAs conectadas son IAs gratis que ya vienen listas en SynthZ. No tienes que configurar nada ni dar tarjeta: solo escribes. Sin cuenta pruebas con 5 mensajes al día; con tu cuenta gratis, mucho más. Si un día usas todos tus mensajes, puedes seguir con Puter.', go:['#payPill', '#payL', '#payM', '#cPick', '#curChip'] },
  { k:'ias conectadas que son las ias conectadas gratis listas', a:'Las IAs conectadas son IAs gratis que ya vienen listas en SynthZ. No tienes que configurar nada ni dar tarjeta: solo escribes. Sin cuenta pruebas con 5 mensajes al día; con tu cuenta gratis, mucho más. Cada día tienes un límite gratis para usar las IAs conectadas. A medianoche se vuelve a llenar.', mood:'feliz' },
  { k:'puter que es puter creditos personales cuenta', a:'Puter: conecta tu versión pro de las IAs más usadas, como ChatGPT, Claude o Gemini. Es gratis, tiene un saldo que se renueva cada mes y se conecta en Ajustes › IAs y memoria › «Conectar Puter u otra IA». Al lado de cada IA de Puter verás rayitas: verdes gasta poco, amarillas normal y rojas gasta mucho.', act:'conn', lbl:'Conectar mi Puter' },
  { k:'puter conectar conecto conecta conectarlo vincular vinculo', need:'puter', a:'Así conectas Puter: abre Ajustes › pestaña «IAs y memoria» › «Conectar Puter u otra IA» y toca «Conectar con Puter». Se abre una ventanita: entra o crea tu cuenta de Puter (es gratis) y listo. También se conecta solo si eliges una IA que diga «Conecta tu Puter» y le escribes. Con Puter usas la versión pro de IAs como ChatGPT, Claude o Gemini, con un saldo gratis que se renueva cada mes.', act:'conn', lbl:'Conectar mi Puter', go:['[data-tab="cfg"]', '#railCfg', '#cfgBtn'] },
  { k:'cambiar elegir escoger ia modelo cual otra seleccionar', a:'Toca el nombre de la IA que estás usando y se abre «¿Con quién fluyes hoy?». Primero eliges para qué la quieres y luego aparecen las IA. Tocas «Usar» y listo.', go:['#cPick', '#curChip', '[data-tab="ia"]'] },
  { k:'comparar comparacion varias dos lado mismo tiempo', a:'Con «Comparar con otra IA» sumas hasta 4. Todas responden lo mismo y aparecen en el orden en que llegan.', go:['#cCmp', '#pickRow [data-add]'] },
  { k:'guia tutorial aprender enseñar como funciona', a:'En la Guía rápida te pregunto si la quieres completa o qué quieres ver: eliges uno o varios temas y te los muestro con mi manita, en ese orden.', go:['#guideTop', '#helpBtn'], act:'guide', lbl:'Abrir la Guía' },
  { k:'limite cuanto queda quedan mensajes barra uso gasto consumo synxcoin coins', a:'Cada día tienes SynXCoin\'s gratis para usar las IAs conectadas: 1 SynXCoin es 1 palabra, contando lo que escribes y lo que la IA te responde. A medianoche se vuelven a llenar. Sin cuenta son 5 mensajes de prueba al día; con tu cuenta gratis tienes miles de SynXCoin\'s. El anillo se va vaciando mientras chateas: te muestro dónde está.', go:['#railCoin', '#tabCoin', '#navTotal', '.pill-total'], tour:'coins' },
  { k:'pagar cobro cobran gratis precio plata dinero costo tarjeta', a:'SynthZ es gratis y nunca te cobra. Las IAs conectadas son gratis, y Puter también tiene su parte gratis cada mes.' },
  { k:'chats historial conversaciones anteriores guardados donde estan mis', a:'Tus chats están en «Mis chats», en la barrita (en el celular, la pestaña Chats). Se guardan en tu dispositivo y en tu cuenta si entras.', go:['#railChats', '[data-r="chats"]', '[data-tab="chats"]'] },
  { k:'drive google espacio guardar copia respaldo conectar conecto', a:'En Ajustes › IAs y memoria › Google Drive vinculas tu Drive y guardo una copia de tus chats en una carpeta privada. No puedo ver tus otros archivos.', go:['#moreBtn'] },
  { k:'adjuntar archivo pdf imagen foto subir documento clip', a:'Con el «+» agregas archivos, PDF o fotos (también puedes arrastrarlos). Para fotos elige una IA que «ve fotos».', go:['#attachBtn'] },
  { k:'cuenta registrar registro entrar iniciar sesion perfil usuario contraseña', a:'Crear tu cuenta es gratis y no pide correo ni tarjeta. Sin cuenta puedes probar con 5 mensajes al día; con cuenta tienes mucho más, y tus chats y favoritos te siguen a cualquier dispositivo. Entra desde tu foto en la barrita.', go:['#accBtn', '[data-tab="me"]'] },
  { k:'ajustes rendimiento lento animaciones configuracion sonido sonidos cursor principiante', a:'En Ajustes puedes poner la página «más rápida», activar el modo principiante o apagar mis sonidos.', go:['#cfgBtn', '[data-tab="cfg"]'] },
  { k:'favorito favoritos estrella guardar mensaje', a:'Con la estrella guardas un mensaje en favoritos. Están en la barrita, en la estrella.', go:['[data-r="fav"]', '#railFav'] },
  { k:'error no responde falla lenta demora', a:'Si una IA falla, te ofrezco una parecida que sí funcione, con tu mensaje listo para reenviar.' },
  { k:'agente modo agente superiorsynth superior mejorar prompt', a:'Con SuperiorSynth no eliges IA: tú escribes, él entiende tu pedido, lo mejora, elige la IA que más sabe de eso y te muestra cada paso. Al final decides si te quedas con esa IA o sigues con él. Lo activas arriba de tus chats, en «SuperiorSynth», junto a «Chats» (en el celular: pestaña Chats › SuperiorSynth).', go:['#cSeg [data-v="agents"]', '#railAgent', '[data-tab="chats"]'] },
  { k:'app instalar descargar aplicacion celular pantalla inicio', a:'SynthFlow se instala como app desde aquí mismo, sin tiendas: Ajustes › IAs y memoria › «Descargar la app SynthFlow». En Android toca «Instalar»; en iPhone: Compartir › Agregar a inicio. Queda a pantalla completa y a un toque.', go:['[data-tab="cfg"]', '#cfgBtn'] },
  { k:'tema temas color colores cambiar simple estilo oscuro barra izquierda', a:'En Ajustes › Página eliges el estilo («SynthFlow» o «Simple», más tranquilo), el color de SynthFlow (Océano, Bosque, Lavanda…) y, en el celular, si la barra va abajo o a la izquierda.', go:['[data-tab="cfg"]', '#cfgBtn'] },
  { k:'vincular google correo usuario contraseña juntar unir cuentas', a:'En Tu cuenta › «Seguridad y acceso» vinculas tu Google a tu cuenta con usuario, o le pones usuario y contraseña a tu cuenta de Google. Así entras a la misma cuenta de las dos formas.', go:['#accBtn', '[data-tab="me"]'] },
  { k:'synth synthetism nombre significa synthonia sintonia por que llama', a:'«Synth» viene del synthetism, un arte. Sammuel, el creador, lo lleva a un arte nuevo de hacer páginas: SynthetismZ y SynthetismFlow. Y yo me llamo SynthonIA porque te sintonizo con la IA. ✨', mood:'encantada' },
  /* charla sencilla */
  { k:'hola buenas hey saludos holi buenos dias tardes noches', a:'¡Hola! Soy SynthonIA 😊 ¿En qué te ayudo con SynthZ?', wave:true },
  { k:'como estas andas va todo bien que tal', a:'¡Muy bien, gracias por preguntar! Aquí, lista para ayudarte. ¿Y tú cómo vas?', mood:'encantada' },
  { k:'como te llamas quien eres tu nombre eres', a:'Me llamo SynthonIA. Soy la ayudante de SynthZ: te explico la página, te muestro dónde están las cosas y, de vez en cuando, te cuento un dato curioso.', mood:'guino' },
  { k:'chiste broma cuentame algo gracioso risa', a:'', joke:true, mood:'riendo' },
  { k:'dato curioso sabias algo interesante', a:'', fact:true, mood:'sorprendida' },
  { k:'gracias genial perfecto listo vale chevere bacano', a:'¡Con gusto! Aquí estoy cuando me necesites. ✨', mood:'encantada' },
  { k:'adios chao nos vemos hasta luego', a:'¡Chao! Que tengas un día con mucho Flow. 👋', wave:true }
];
const BOT_QUICK = [['ias conectadas que', '¿Qué son las IAs conectadas?'], ['puter que es', '¿Qué es Puter?'], ['puter conectar', '¿Cómo conecto Puter?'], ['cambiar elegir', '¿Cómo cambio de IA?'], ['limite cuanto', '¿Qué son las SynXCoin\'s?'], ['chiste', 'Cuéntame un chiste']].map(([k, t]) => [BOT_FAQ.findIndex(f => f.k.startsWith(k)), t]);
const fold = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ\s]/g, ' ');
function botMatch(q){
  const STOP = /^(que|como|donde|cual|para|por|con|una|uno|los|las|del|mis|tus|sus|esta|este|esto|eso|hay|hago|hacer|puedo|quiero|tengo|necesito|sobre|algo|the|and|how|can|what|where|synthflow|synthz|pagina|favor|porfa|ayuda|ayudame)$/;
  const w = fold(q).split(/\s+/).filter(x => (x.length > 2 || /^(ia|ai)$/.test(x)) && !STOP.test(x)); if (!w.length) return /ayuda|help/i.test(q) ? BOT_FAQ.find(f => f.k.startsWith('guia')) : null;
  let best = null, bs = 0;
  BOT_FAQ.forEach(f => { if (f.need && !w.includes(f.need)) return; const K = fold(f.k).split(/\s+/); let sc = 0; w.forEach(x => { if (K.includes(x)) sc += 1; else if (K.some(k => k.length > 4 && (k.startsWith(x) || x.startsWith(k)))) sc += .6; }); if (sc > bs){ bs = sc; best = f; } });
  return bs >= Math.max(.6, w.length * .45) ? best : null;
}
const BOT = { el:null, panel:null, open:false, hist:[], help:null, poll:0, seen:0, team:null, inbox:[], cur:null, mode:'chat', teamSeen:{} };
const vis = sel => (Array.isArray(sel) ? sel : [sel]).map(x => $(x)).find(n => n && n.getClientRects().length && n.getBoundingClientRect().width > 0) || null;
function botMount(){
  if (BOT.el || !document.body) return;
  try{ if (sessionStorage.getItem('synthz:bothide') === '1') return; }catch(e){}
  const b = document.createElement('button'); b.id = 'szBot'; b.type = 'button'; b.setAttribute('aria-label', 'SynthonIA'); b.dataset.tip = 'SynthonIA';
  b.innerHTML = '<span class="bf">' + face('feliz', 40) + '</span><i class="bdot" hidden></i>';
  const mLogo = $('#mLogo');
  if (isFlow() && mLogo && matchMedia('(max-width:760px)').matches){
    b.classList.add('inhead'); mLogo.after(b);
    /* justo a la derecha del logo «SynthFlow», en la misma línea */
    const put = () => { const h = mLogo.offsetParent; if (h && getComputedStyle(h).position === 'static') h.style.position = 'relative'; b.style.left = (mLogo.offsetLeft + mLogo.offsetWidth + 10) + 'px'; b.style.top = (mLogo.offsetTop + (mLogo.offsetHeight - 40) / 2) + 'px'; };
    put(); addEventListener('resize', put); if (document.fonts) document.fonts.ready.then(put);
  }
  else {
    document.body.appendChild(b);
    try{ const pos = JSON.parse(localStorage.getItem('synthz:botpos') || 'null'); if (pos && pos.x > 0 && pos.y > 0){ b.style.right = 'auto'; b.style.bottom = 'auto'; b.style.left = Math.min(innerWidth - 70, pos.x) + 'px'; b.style.top = Math.min(innerHeight - 70, pos.y) + 'px'; } }catch(e){}
  }
  BOT.el = b;
  requestAnimationFrame(() => { b.classList.add('on'); betaBot(); });
  /* se puede arrastrar (en computador); un toque la abre */
  let drag = null;
  b.addEventListener('pointerdown', e => { if (b.classList.contains('inhead') || e.button) return; drag = { x:e.clientX, y:e.clientY, l:b.getBoundingClientRect().left, t:b.getBoundingClientRect().top, moved:false }; b.setPointerCapture(e.pointerId); });
  b.addEventListener('pointermove', e => { if (!drag) return; if (BOT.betaPut) requestAnimationFrame(BOT.betaPut); const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!drag.moved && Math.hypot(dx, dy) < 6) return; drag.moved = true; b.classList.add('drag'); b.style.right = 'auto'; b.style.bottom = 'auto'; b.style.left = clamp(drag.l + dx, 6, innerWidth - 66) + 'px'; b.style.top = clamp(drag.t + dy, 6, innerHeight - 66) + 'px'; if (BOT.open) botPlace(); });
  b.addEventListener('pointerup', () => { if (BOT.betaPut) setTimeout(BOT.betaPut, 50); if (!drag) return; const m = drag.moved; drag = null; b.classList.remove('drag'); if (m){ const r = b.getBoundingClientRect(); try{ localStorage.setItem('synthz:botpos', JSON.stringify({ x:r.left, y:r.top })); }catch(e){} b._skip = true; setTimeout(() => { b._skip = false; }, 50); } });
  b.addEventListener('click', e => {
    if (b._skip) return;
    BOT.lostN = 0; b.classList.remove('g1', 'g2');
    /* según dónde la toques, hace una cara distinta */
    const z = e.detail ? botZone(e) : '';
    if (z === 'eye'){ SND.blip('auch'); botFace('auch', true); botBubble('¡Ay! Ese es mi ojo.', 2200); setTimeout(() => botFace('feliz', true), 1900); return; }
    if (z === 'top'){ botFace('sorprendida', true); botBubble('¡Uy, mi antena! Me haces cosquillas.', 2200); setTimeout(() => botFace('feliz', true), 1900); return; }
    if (z === 'cheek'){ botFace('encantada', true); setTimeout(() => botFace('feliz'), 1600); }
    else if (z === 'mouth'){ botFace('riendo', true); setTimeout(() => botFace('feliz'), 1600); }
    botToggle();
  });
  setTimeout(botSync, 1200);
}
/* v1.4: la carita cambia suave (una se desvanece y la otra aparece), y si está «pegada» (triste) no cambia */
function botZone(e){
  const r = BOT.el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  const fx = (x - .5) / .667 + .5, fy = (y - .5) / .667 + .5;          /* a coordenadas de la carita (0–1) */
  if (Math.hypot(fx - .40, fy - .52) < .085 || Math.hypot(fx - .60, fy - .52) < .085) return 'eye';
  if (fy < .22) return 'top';
  if (fy > .58 && fy < .72 && (fx < .38 || fx > .62)) return 'cheek';
  if (fy > .6 && fy < .8) return 'mouth';
  return '';
}
function botFace(mood, force){
  if (!BOT.el) return;
  if (BOT.sticky && !force && mood !== BOT.sticky) return;
  if (BOT.el.classList.contains('pix') && !force){ BOT.mood = mood; return; }
  const bf = $('.bf', BOT.el); if (!bf) return;
  if (BOT.mood === mood && !force && bf.querySelector('.szface')) return;
  BOT.mood = mood;
  const old = [...bf.children], n = document.createElement('span'); n.className = 'bfl in'; n.innerHTML = face(FACE[mood] ? mood : 'feliz', 40); bf.appendChild(n);
  old.forEach(o => { o.classList.add('out'); setTimeout(() => o.remove(), 380); });
  requestAnimationFrame(() => requestAnimationFrame(() => n.classList.remove('in')));
}
/* las caras las hace ella: los emojis de sus frases se quitan y se vuelven su expresión */
const EMO = [[/[😂🤣😄😆😁😅😹]/u, 'riendo'], [/[😴💤]/u, 'dormida'], [/[👀😮😲🤯✨]/u, 'sorprendida'], [/[😕😔😢🙏]/u, 'disculpa'], [/[😎💪🔥]/u, 'flow'], [/[💛❤️😍🥰]/u, 'encantada'], [/[😉😜]/u, 'guino'], [/[⏳🤔]/u, 'pensando'], [/[👋🙂😊]/u, 'feliz']];
function demoji(t){ let mood = null; for (const [rx, m] of EMO) if (rx.test(t)){ mood = m; break; } const E = '(?:\\p{Extended_Pictographic}|\\p{Emoji_Presentation}|[\\u2600-\\u27BF])(?:\\uFE0F|\\u20E3|\\u200D(?:\\p{Extended_Pictographic}|[\\u2600-\\u27BF])\\uFE0F?)*';
  t = String(t).replace(new RegExp('([^\\s.!?…:,;])\\s*(?:' + E + ')+\\s+(?=[A-ZÁÉÍÓÚÑ¿¡])', 'gu'), '$1. ');
  return { text:String(t).replace(/\s*(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u2600-\u27BF])(?:\uFE0F|\u20E3|\u200D(?:\p{Extended_Pictographic}|[\u2600-\u27BF])\uFE0F?)*/gu, '').replace(/[ \t]{2,}/g, ' ').replace(/\s+([.,!?…])/g, '$1').trim(), mood }; }
/* mientras piensa, su carita se vuelve píxeles y dibuja 2 o 3 pixel arts */
function pixFace(on){
  if (!BOT.el) return;
  if (BOT.pxb){ BOT.pxb.stop(); BOT.pxb = null; }
  const bf = $('.bf', BOT.el);
  if (on){ BOT.el.classList.add('pix'); const n = document.createElement('span'); n.className = 'bfl pxface in'; n.innerHTML = pixelGrid(); [...bf.children].forEach(o => { o.classList.add('out'); setTimeout(() => o.remove(), 380); }); bf.appendChild(n); requestAnimationFrame(() => requestAnimationFrame(() => n.classList.remove('in'))); BOT.pxb = pixelRun(n); BOT.pxb.speed(3); }
  else { BOT.el.classList.remove('pix'); const m = BOT.mood || 'feliz'; BOT.mood = null; botFace(m, true); }
}
async function botThink(work){
  const ms = 3000 + Math.random() * 2000;
  BOT.think = true; BOT.zen = false; pixFace(true); botRender();
  try{ const [r] = await Promise.all([work ? work() : Promise.resolve(null), sleepRaw(ms)]); return r; }
  finally{ BOT.think = false; if (BOT.pxm){ BOT.pxm.stop(); BOT.pxm = null; } pixFace(false); }
}
function botBubble(text, ms){
  if (!BOT.el || BOT.open || document.querySelector('#vintro,#intro,#portal')) return; let bb = $('#szBotB'); if (!bb){ bb = document.createElement('div'); bb.id = 'szBotB'; document.body.appendChild(bb); }
  const D = demoji(text), md = D.mood || BOT.mood || 'feliz';
  bb.innerHTML = '<span class="bbf">' + face(md, 52) + '</span><p></p>'; $('p', bb).textContent = D.text;
  bb.classList.toggle('big', BOT.el.classList.contains('g2'));
  const r = BOT.el.getBoundingClientRect(), W = Math.min(BOT.el.classList.contains('g2') ? 380 : 330, innerWidth - 24);
  bb.style.width = W + 'px'; bb.style.left = clamp(r.left + r.width / 2 - W / 2, 12, innerWidth - W - 12) + 'px';
  const up = r.top > 140; bb.style.top = up ? 'auto' : (r.bottom + 12) + 'px'; bb.style.bottom = up ? (innerHeight - r.top + 12) + 'px' : 'auto'; bb.classList.toggle('dn', !up);
  bb.classList.remove('on'); void bb.offsetWidth; bb.classList.add('on'); clearTimeout(bb._t); bb._t = setTimeout(() => bb.classList.remove('on'), (ms || 5200) + Math.min(3000, D.text.length * 18));
  typeIn($('p', bb), { cps:45, max:4, onFrame:lipSync([$('.bbf .szface', bb), ballFace()], D.text) }).catch(() => {});
}
function botPlace(){
  const P = BOT.panel, b = BOT.el; if (!P || !b) return;
  if (matchMedia('(max-width:760px)').matches){ P.classList.add('sheet'); P.style.left = P.style.top = P.style.right = P.style.bottom = ''; return; }
  P.classList.remove('sheet');
  const r = b.getBoundingClientRect(), W = Math.min(390, innerWidth - 24), H = Math.min(560, innerHeight - 40);
  P.style.width = W + 'px'; P.style.height = H + 'px';
  P.style.left = clamp(r.right - W, 12, innerWidth - W - 12) + 'px';
  P.style.top = (r.top - H - 14 > 12 ? r.top - H - 14 : clamp(r.bottom + 14, 12, innerHeight - H - 12)) + 'px';
}
function botToggle(force){ const on = force == null ? !BOT.open : force; if (on) botOpen(); else botClose(); }
function botOpen(){
  if (!BOT.el) botMount(); if (!BOT.el) return;
  if (BOT.panel){ BOT.open = true; BOT.panel.classList.add('on'); botPlace(); return; }
  const P = document.createElement('div'); P.id = 'szBotP'; P.setAttribute('role', 'dialog'); P.setAttribute('aria-label', 'SynthonIA');
  P.innerHTML = '<div class="bh"><span class="bhf">' + face('feliz', 56) + '</span><div><b>SynthonIA</b><small><i></i>Siempre disponible</small></div><button type="button" class="bx" data-b="min" aria-label="Cerrar">×</button></div>'
    + '<div class="btabs" hidden><button type="button" data-bt="chat" aria-selected="true">Pregúntame</button><button type="button" data-bt="inbox" aria-selected="false">Bandeja <em class="bn"></em></button></div>'
    + '<div class="bl" aria-live="polite"></div><div class="bq"></div>'
    + '<form class="bin"><input type="text" maxlength="600" placeholder="Pregúntame lo que quieras…" aria-label="Pregúntale a SynthonIA" autocomplete="off"><button type="submit" class="bs" aria-label="Enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button></form>'
    + '<div class="bfoot"><button type="button" class="lnk" data-b="team">Hablar con el equipo</button><button type="button" class="lnk" data-b="fb">Cuéntanos qué mejorar</button><button type="button" class="lnk" data-b="hide">Esconder</button></div>';
  document.body.appendChild(P); BOT.panel = P; BOT.open = true; botPlace();
  requestAnimationFrame(() => P.classList.add('on'));
  P.addEventListener('click', botClick);
  $('.bin', P).addEventListener('submit', e => { e.preventDefault(); const i = $('.bin input', P), v = i.value.trim(); if (!v) return; i.value = ''; BOT.mode === 'team' || BOT.mode === 'reply' ? botTeamSay(v) : botAsk(v); });
  addEventListener('resize', botPlace);
  botRender();
  if (!BOT.hist.length) botSay('¡Hola! Soy SynthonIA. Estoy aquí para que nunca te pierdas: pregúntame cómo se hace algo o dónde está, y te lo explico fácil o te lo señalo con mi manita.', 'feliz');
}
function botClose(){ BOT.open = false; if (BOT.think) BOT.zen = true; if (BOT.panel) BOT.panel.classList.remove('on'); }
function botMsgHtml(m){
  if (m.role === 'user') return '<div class="bm u"><p>' + esc(m.content) + '</p></div>';
  if (m.role === 'team') return '<div class="bm t"><span class="rk r-' + esc(String(m.rank || '').toLowerCase()) + '">' + esc(m.rank || 'Equipo') + '</span><b>' + esc(m.name || '') + '</b><p>' + esc(m.content) + '</p></div>';
  return '<div class="bm a"><span class="mf">' + face(m.mood || 'feliz', 36) + '</span><div><p>' + esc(m.content) + '</p>' + (m.btn ? '<button type="button" class="btn sm ghost" data-ba="' + esc(m.btn[0]) + '">' + esc(m.btn[1]) + '</button>' : '') + '</div></div>';
}
function botRender(){
  const P = BOT.panel; if (!P) return;
  const team = BOT.team;
  $('.btabs', P).hidden = !team; $$('.btabs button', P).forEach(x => x.setAttribute('aria-selected', String(x.dataset.bt === (BOT.mode === 'inbox' || BOT.mode === 'reply' ? 'inbox' : 'chat'))));
  const nOpen = BOT.inbox.filter(r => r.status === 'open').length; const bn = $('.bn', P); if (bn) bn.textContent = nOpen ? nOpen : '';
  const L = $('.bl', P), Q = $('.bq', P), inp = $('.bin input', P);
  if (BOT.mode === 'inbox'){
    L.innerHTML = BOT.inbox.length ? BOT.inbox.map(r => '<button type="button" class="bi' + (r.urgent ? ' urg' : '') + '" data-bi="' + esc(r.id) + '"><b>@' + esc(r.user.username || r.user.name) + '</b><span>' + esc(r.text) + '</span><small>' + (r.status === 'open' ? (r.urgent ? '⏰ esperando +15 min' : 'nuevo') : r.status === 'taken' ? 'con ' + esc((r.by || {}).name || '') : 'terminado') + ' · ' + agoS(r.last) + '</small></button>').join('') : '<p class="bempty">No hay pedidos de ayuda. ✨</p>';
    Q.innerHTML = ''; $('.bin', P).hidden = true; return;
  }
  $('.bin', P).hidden = false;
  if (BOT.mode === 'reply' && BOT.cur){
    const r = BOT.cur;
    L.innerHTML = '<div class="bctx"><button type="button" class="lnk" data-b="back">← Bandeja</button><span>@' + esc(r.user.username || r.user.name) + (r.page ? ' · ' + esc(r.page) : '') + '</span>' + (r.status !== 'done' ? '<button type="button" class="lnk" data-b="done">Terminar</button>' : '') + '</div>'
      + r.msgs.map(m => botMsgHtml(m.from === 'team' ? { role:'team', name:m.name, rank:m.rank, content:m.text } : { role:'user', content:m.text })).join('');
    Q.innerHTML = ''; inp.placeholder = 'Responde como ' + (SZ_RANK() || 'equipo') + '…';
  } else if (BOT.mode === 'team' && BOT.help && !CW.el){
    const r = BOT.help;
    L.innerHTML = '<div class="bctx"><button type="button" class="lnk" data-b="ia">← SynthonIA</button><span>' + (r.status === 'open' ? (r.urgent ? 'Contactando a un Prime, ZFlow o Symmetrix…' : 'El equipo ya recibió tu mensaje') : r.status === 'taken' ? 'Te atiende ' + esc((r.by || {}).name || '') + ' (' + esc((r.by || {}).rank || '') + ')' : 'Conversación terminada') + '</span>' + (r.status !== 'done' ? '<button type="button" class="lnk" data-b="end">Terminar</button>' : '') + '</div>'
      + r.msgs.map(m => botMsgHtml(m.from === 'team' ? { role:'team', name:m.name, rank:m.rank, content:m.text } : { role:'user', content:m.text })).join('')
      + (r.status === 'open' ? botMsgHtml({ role:'assistant', mood:r.urgent ? 'pensando' : 'esperando', content:r.urgent ? 'Ya pasaron más de 15 minutos: estoy avisando otra vez a un Prime, ZFlow o Symmetrix. ¡No te vas a quedar sin respuesta!' : 'Le avisé al equipo. Siempre hay alguien disponible; te respondo aquí mismo apenas escriban (puedes seguir usando SynthFlow).' }) : '');
    Q.innerHTML = ''; inp.placeholder = r.status === 'done' ? 'Escribe para abrir una conversación nueva…' : 'Escríbele al equipo…';
  } else {
    BOT.mode = 'chat';
    L.innerHTML = BOT.hist.map(botMsgHtml).join('') + (BOT.think ? '<div class="bm a"><span class="mf pxmf">' + pixelGrid() + '</span><div><p class="dots"><i></i><i></i><i></i></p></div></div>' : '');
    Q.innerHTML = BOT.hist.length > 6 ? '' : BOT_QUICK.map(([i, l]) => '<button type="button" data-bf="' + i + '">' + esc(l) + '</button>').join('');
    inp.placeholder = 'Pregúntame lo que quieras…';
  }
  L.scrollTop = L.scrollHeight;
  if (BOT.pxm){ BOT.pxm.stop(); BOT.pxm = null; }
  const pm = BOT.think && $('.pxmf', L); if (pm){ BOT.pxm = pixelRun(pm); BOT.pxm.speed(3); }
}
const SZ_RANK = () => { const r = ACC.user && ACC.user.role; return { owner:'Prime', admin:'ZFlow', staff:'Symmetrix' }[r] || ''; };
const agoS = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'ahora' : m < 60 ? 'hace ' + m + ' min' : m < 1440 ? 'hace ' + Math.round(m / 60) + ' h' : 'hace ' + Math.round(m / 1440) + ' d'; };
function botSay(text, mood, btn){
  const D = demoji(text); mood = mood || D.mood || 'feliz';
  BOT.hist.push({ role:'assistant', content:D.text, mood, btn }); BOT.hist = BOT.hist.slice(-30); botFace(mood); SND.blip(mood); botRender();
  /* en la ventanita, su último mensaje se escribe mientras mueve la boca */
  if (BOT.open && BOT.panel){ const L = $$('.bl .bm.a', BOT.panel), last = L[L.length - 1], p = last && $('p', last); if (p) setTimeout(() => typeIn(p, { cps:45, max:4.5, onFrame:lipSync([$('.mf .szface', last), ballFace()], D.text) }).catch(() => {}), 80); }
  /* si cerraste la ventanita mientras pensaba: «Ten paciencia… modo zen…» y luego la respuesta */
  if (!BOT.open && BOT.zen){ BOT.zen = false; botFace('dormida', true); botBubble('Ten paciencia… modo zen…', 1900); setTimeout(() => { botFace(mood, true); botBubble(D.text.length > 240 ? D.text.slice(0, 236) + '…' : D.text, 8000); }, 2000); }
}
/* respuesta guardada: si dice «dónde», la manita lo señala */
async function botAnswer(f){
  if (f.joke || f.fact){ const t = await botThink(() => f.joke ? BOTAPI.joke() : BOTAPI.fact()); return botSay((f.fact ? '¿Sabías que…? ' : '') + t, f.joke ? 'riendo' : 'sorprendida'); }
  await botThink();
  botSay(f.a, f.mood || (f.go ? 'senalando' : 'feliz'), f.act ? [f.act, f.lbl] : null);
  if (f.wave && HAND && BOT.el){ const r0 = BOT.el.getBoundingClientRect(); HAND.show({ x:r0.left + r0.width / 2, y:r0.top - 10 }); await HAND.moveTo({ x:clamp(r0.left - 40, 40, innerWidth - 40), y:clamp(r0.top - 50, 40, innerHeight - 40) }, { shape:'palm' }); await HAND.wave(2); HAND.hide(); return; }
  if (f.tour === 'coins' && HAND && $('#railTog') && $('#railCoin') && !matchMedia('(max-width:760px)').matches) return coinsTour();
  const t = f.go && vis(f.go);
  if (t && HAND){
    await sleepRaw(500);
    const wasOpen = BOT.open; if (matchMedia('(max-width:760px)').matches) botClose();
    const r0 = BOT.el ? BOT.el.getBoundingClientRect() : { left:innerWidth / 2, top:innerHeight / 2, width:0, height:0 };
    HAND.show({ x:r0.left + r0.width / 2, y:r0.top + r0.height / 2 });
    await HAND.moveTo(t, { shape:'point' }); HAND.spot(t, 6); await HAND.click(null);
    await sleepRaw(1700); HAND.unspot(); HAND.hide();
    if (wasOpen && !BOT.open) botOpen();
  }
}
/* «¿Dónde están los SynXCoin's?»: con la barrita cerrada están abajo (solo el icono); al abrirla se ve cuántos llevas */
async function coinsTour(){
  const tog = $('#railTog'), coin = $('#railCoin'), rail = $('#rail'), wasOpen = rail && rail.classList.contains('open');
  await sleepRaw(500);
  const wasBot = BOT.open; botClose();
  const r0 = BOT.el ? BOT.el.getBoundingClientRect() : { left:innerWidth / 2, top:innerHeight / 2, width:0, height:0 };
  HAND.show({ x:r0.left + r0.width / 2, y:r0.top + r0.height / 2 });
  const point = async (txt, mood) => { await sleepRaw(80); HAND.spot(coin, 6); await HAND.moveTo(coin, { shape:'point', fx:wasOpenNow() ? .2 : .5 }); await HAND.click(null); await HAND.talk(txt, { near:coin, side:true, mood:mood || 'senalando', buttons:[{ label:'Siguiente' }], auto:5200 }); HAND.unspot(); };
  const wasOpenNow = () => rail && rail.classList.contains('open');
  const flip = async () => { HAND.quiet(); await HAND.moveTo(tog, { shape:'point' }); await HAND.click(tog, { real:true }); await sleepRaw(720); };
  if (!wasOpen){
    await point('Con la barrita cerrada, tu límite de hoy está aquí abajo: el anillo se va vaciando mientras chateas.');
    await flip(); await point('Y si abres la barrita, lo ves con palabras. Tócalo para ver el detalle.', 'guino');
    await flip();
  } else {
    await point('Aquí, en la barrita, ves cómo va tu límite de hoy. Tócalo para ver el detalle.');
    await flip(); await point('Y con la barrita cerrada sigue aquí abajo: el anillo se va vaciando.', 'guino');
    await flip();
  }
  HAND.quiet(); HAND.hide();
  if (wasBot && !BOT.open) botOpen();
}
const TASKY = /\b(escrib[ea]me|redacta|resuelve|resolver|calcula|codigo|programa(me)?|funcion|script|python|javascript|html|css|sql|tarea|deberes|ensayo|resumen de|resume|traduce|traducir|corrige|ecuacion|derivada|integral|examen|plan de|haz(me)? un|crea(me)? un|genera)\b/;
async function botAsk(q){
  BOT.hist.push({ role:'user', content:q }); botRender();
  const f = botMatch(q); if (f) return botAnswer(f);
  /* SynthonIA no hace tareas, código ni trabajos: eso es para las IAs del chat */
  if (TASKY.test(fold(q)) || q.length > 220){ BOT.pendingQ = q; await botThink(); return botSay('Eso es trabajo para las IAs de SynthFlow 💪 Yo te ayudo con la página, y con chistes o datos curiosos. ¿Te lo dejo listo en la caja del chat?', 'guino', ['tochat', 'Sí, llévalo al chat']); }
  try{
    const res = await botThink(async () => { const r = await fetch('/api/help', { method:'POST', headers:Object.assign({ 'content-type':'application/json' }, SESS ? { authorization:'Bearer ' + SESS } : {}), body:JSON.stringify({ action:'ask', q, hist:BOT.hist.slice(-7, -1).filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role:m.role, content:m.content })) }) });
    const d = await r.json().catch(() => ({})); return { r, d }; });
    const { r, d } = res;
    if (!r.ok) return botSay(d.error || 'No pude pensar una respuesta ahora. Mira la Guía o habla con el equipo.', 'disculpa', ['team', 'Hablar con el equipo']);
    botSay(d.text + (d.left <= 3 ? '\n\n(Te quedan ' + d.left + ' preguntas nuevas hoy.)' : ''), 'feliz');
  }catch(e){ botSay('No pude conectarme. Revisa tu internet e intenta otra vez.', 'disculpa'); }
}
function botAct(a){
  if (BOT.acts && BOT.acts[a]){ const fn = BOT.acts[a]; delete BOT.acts[a]; botClose(); try{ fn(); }catch(e){} return; }
  if (a === 'tochat'){ const q = BOT.pendingQ || ''; botClose(); if (isFlow()){ const i = document.getElementById('inp'); if (i){ i.value = q; i.dispatchEvent(new Event('input', { bubbles:true })); i.focus(); } } else { try{ sessionStorage.setItem('synthz:q', JSON.stringify({ q, t:Date.now() })); }catch(e){} portalOut('chat.html'); } return; }
  if (a === 'guide'){ botClose(); const g = $('#guideTop') || $('#helpBtn'); if (g) g.click(); }
  else if (a === 'conn' && !/chat\.html/.test(location.pathname)){ botClose(); SZ.portalOut ? SZ.portalOut('chat.html?conn=1') : (location.href = 'chat.html?conn=1'); }
  else if (a === 'conn'){ botClose(); const x = document.createElement('a'); x.setAttribute('data-conn', ''); document.body.appendChild(x); x.click(); x.remove(); }
  else if (a === 'team') botTeam();
  else if (a === 'login'){ botClose(); const b = $('#accBtn') || $('[data-tab="me"]'); if (b) b.click(); }
}
/* ---- ayuda de personas ---- */
async function helpApi(o){ return api('help' + (o && o.q ? o.q : ''), o && o.body ? { method:'POST', body:o.body, keep:true } : { keep:true }); }
async function botTeam(){
  if (!ACC.ready){ if (!BOT.open) botOpen(); botSay('Para hablar con una persona del equipo necesitas tu cuenta de SynthZ (es gratis). Así te pueden responder aunque cierres la página.', 'guino', ['login', 'Entrar o crear cuenta']); return; }
  if (!(BOT.help && BOT.help.status !== 'done')) BOT.help = { status:'new', msgs:[] };
  BOT.mode = 'chat'; botClose(); chatOpen();
}
/* ---- «Chat con …»: ventana aparte que entra de derecha a izquierda (la persona que te atiende y su rango) ---- */
const CW = { el:null };
function chatTitle(r){ return r && r.by && r.by.name ? 'Chat con ' + r.by.name : 'Chat con el equipo de SynthZ'; }
function chatOpen(){
  if (!CW.el){
    const w = document.createElement('aside'); w.id = 'szChat'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', 'Chat con el equipo');
    w.innerHTML = '<div class="cwh"><span class="cwa"></span><div class="cwt"><b></b><small></small></div><button type="button" class="cwx" data-cx aria-label="Cerrar">×</button></div><div class="cwl" aria-live="polite"></div>'
      + '<form class="cwin"><input type="text" maxlength="1000" placeholder="Escríbele al equipo…" aria-label="Escríbele al equipo" autocomplete="off"><button type="submit" class="bs" aria-label="Enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button></form>'
      + '<div class="cwf"><span>Nadie ve tus chats: solo lo que escribes aquí.</span><button type="button" class="lnk" data-cend>Terminar</button></div>';
    document.body.appendChild(w); CW.el = w;
    $('[data-cx]', w).addEventListener('click', chatClose);
    $('[data-cend]', w).addEventListener('click', async () => { const r = BOT.help; if (!r || !r.id || r.status === 'done'){ chatClose(); return; } try{ const d = await helpApi({ body:{ action:'close', id:r.id } }); BOT.help = d.item; chatRender(); toast('Terminaste la conversación con el equipo.'); setTimeout(chatClose, 900); }catch(er){ toast(er.message); } });
    $('.cwin', w).addEventListener('submit', async e => { e.preventDefault(); const i = $('.cwin input', w), v = i.value.trim(); if (!v) return; i.value = ''; const r = BOT.help; if (r && r.status === 'done') BOT.help = { status:'new', msgs:[] }; BOT.mode = 'team'; await botTeamSay(v); BOT.mode = 'chat'; chatRender(); });
  }
  chatRender(); SND.expand && SND.expand();
  requestAnimationFrame(() => requestAnimationFrame(() => CW.el && CW.el.classList.add('on')));
  setTimeout(() => { const i = CW.el && $('.cwin input', CW.el); if (i && matchMedia('(pointer: fine)').matches) i.focus(); }, 520);
  if (BOT.el){ const dot = $('.bdot', BOT.el); if (dot && !BOT.team) dot.hidden = true; }
}
function chatClose(){ if (CW.el) CW.el.classList.remove('on'); }
const chatIsOpen = () => !!(CW.el && CW.el.classList.contains('on'));
function chatRender(){
  const w = CW.el; if (!w) return; const r = BOT.help || { status:'new', msgs:[] };
  $('.cwt b', w).textContent = chatTitle(r);
  $('.cwt small', w).innerHTML = r.by && r.by.rank ? '<span class="rk r-' + esc(String(r.by.rank).toLowerCase()) + '">' + esc(r.by.rank) + '</span> te está atendiendo' : r.status === 'open' ? (r.urgent ? 'Avisando otra vez a un Prime, ZFlow o Symmetrix…' : 'Esperando a un Prime, ZFlow o Symmetrix…') : r.status === 'done' ? 'Conversación terminada' : 'Un Prime, ZFlow o Symmetrix te responde aquí';
  $('.cwa', w).innerHTML = r.by && r.by.name ? '<i class="cwi r-' + esc(String(r.by.rank || '').toLowerCase()) + '">' + esc(String(r.by.name).replace(/^@/, '').charAt(0).toUpperCase()) + '</i>' : face(r.status === 'open' ? 'esperando' : 'feliz', 40);
  const L = $('.cwl', w);
  const intro = botMsgHtml({ role:'assistant', mood:'feliz', content:'Cuéntame en qué te ayudamos y se lo paso a un Prime, ZFlow o Symmetrix. Te responden aquí mismo, aunque cierres la página.' });
  L.innerHTML = (!(r.msgs || []).length ? intro : '') + (r.msgs || []).map(m => botMsgHtml(m.from === 'team' ? { role:'team', name:m.name, rank:m.rank, content:m.text } : { role:'user', content:m.text })).join('')
    + (r.status === 'open' ? botMsgHtml({ role:'assistant', mood:r.urgent ? 'pensando' : 'esperando', content:r.urgent ? 'Ya pasaron más de 15 minutos: estoy avisando otra vez al equipo. ¡No te vas a quedar sin respuesta!' : 'Le avisé al equipo. Te respondo aquí apenas escriban (puedes seguir usando SynthZ).' }) : '')
    + (r.status === 'done' ? '<p class="bempty">Conversación terminada. Escribe para abrir una nueva.</p>' : '');
  $('[data-cend]', w).hidden = !r.id || r.status === 'done';
  L.scrollTop = L.scrollHeight;
}
async function botTeamSay(text){
  if (CW.el && BOT.mode !== 'reply') BOT.mode = 'team';
  try{
    if (BOT.mode === 'reply' && BOT.cur){ const d = await helpApi({ body:{ action:'say', id:BOT.cur.id, text } }); BOT.cur = d.item; botRender(); botSyncSoon(); return; }
    const r = BOT.help;
    const d = r && r.id && r.status !== 'done' ? await helpApi({ body:{ action:'say', id:r.id, text } }) : await helpApi({ body:{ action:'open', text, page:document.title.slice(0, 60) } });
    BOT.help = d.item; BOT.mode = CW.el ? 'chat' : 'team'; BOT.seen = (d.item.msgs || []).length; if (CW.el) chatRender(); else botRender(); botSyncSoon();
  }catch(e){ toast(e.message || 'No pude enviar tu mensaje.'); }
}
function botSyncSoon(){ clearTimeout(BOT.poll); BOT.poll = setTimeout(botSync, 1500); }
async function botSync(){
  clearTimeout(BOT.poll);
  if (!ACC.ready || !SESS){ BOT.poll = setTimeout(botSync, 30000); return; }
  try{
    const d = await helpApi();
    const prev = BOT.help, mine = d.mine;
    if (mine){
      const newTeam = (mine.msgs || []).filter(m => m.from === 'team').length;
      let seenN = 0; try{ seenN = +localStorage.getItem('synthz:hseen:' + mine.id) || 0; }catch(e){}
      if (prev && prev.id === mine.id && prev.msgs) seenN = Math.max(seenN, prev.msgs.filter(m => m.from === 'team').length);
      if (newTeam > seenN){
        try{ localStorage.setItem('synthz:hseen:' + mine.id, String(newTeam)); }catch(e){}
        const m = mine.msgs.filter(x => x.from === 'team').pop();
        SND.expand(); botFace('dormida');
        if (!chatIsOpen()) botBubble(seenN ? m.name + ' (' + m.rank + ') te respondió.' : '¡Llegó ' + m.name + ' (' + m.rank + ')! Me tomo una siestita 😴 mientras te ayuda.', 7000);
        BOT.help = mine;
        if (!document.documentElement.classList.contains('guiding') && !document.querySelector('.szm')) chatOpen();
        else if (BOT.el){ const dot = $('.bdot', BOT.el); dot.hidden = false; }
      }
      if (prev && prev.status === 'open' && !prev.urgent && mine.urgent) botBubble('Estoy contactando a un Prime, ZFlow o Symmetrix… ¡ya casi!', 6000);
      BOT.help = mine;
    } else if (prev && prev.id){ BOT.help = Object.assign({}, prev, { status:'done' }); }
    BOT.team = !!d.team;
    if (d.team){
      const before = new Set(BOT.inbox.map(r => r.id + ':' + r.n));
      const fresh = (d.items || []).filter(r => r.status !== 'done' && !before.has(r.id + ':' + r.n) && !BOT.teamSeen[r.id + ':' + r.n]);
      BOT.inbox = d.items || [];
      fresh.forEach(r => { BOT.teamSeen[r.id + ':' + r.n] = 1; });
      if (fresh.length && BOT.synced){ SND.expand(); const r = fresh[0]; toast('@' + (r.user.username || r.user.name) + ' necesita ayuda: «' + r.text.slice(0, 60) + '»'); botBubble('@' + (r.user.username || r.user.name) + ' necesita ayuda. Toca para responder.', 7000); }
      BOT.synced = true;
      if (BOT.el){ const n = BOT.inbox.filter(r => r.status === 'open').length, dot = $('.bdot', BOT.el); dot.hidden = !n; dot.textContent = n || ''; }
      if (BOT.mode === 'reply' && BOT.cur){ const s = BOT.inbox.find(r => r.id === BOT.cur.id); if (s && s.n !== BOT.cur.msgs.length){ const x = await helpApi({ q:'?id=' + encodeURIComponent(BOT.cur.id) }); BOT.cur = x.item; } }
    }
    if (BOT.open) botRender();
    if (CW.el) chatRender();
  }catch(e){}
  const active = (BOT.help && BOT.help.status && BOT.help.status !== 'done') || BOT.team;
  /* sin conversación abierta no se pregunta cada rato (ahorra Redis): el «sigo aquí» de cada 3 min avisa si el equipo te escribió */
  if (!active){ BOT.poll = 0; return; }
  BOT.poll = setTimeout(botSync, document.hidden ? 60000 : BOT.open ? 8000 : 20000);
}
addEventListener('synthz-help-ping', () => { if (!BOT.poll) botSyncSoon(); });
async function botClick(e){
  const t = e.target;
  const bf = t.closest('[data-bf]'); if (bf){ const f = BOT_FAQ[+bf.dataset.bf]; BOT.hist.push({ role:'user', content:bf.textContent }); botRender(); await sleepRaw(300); return botAnswer(f); }
  const ba = t.closest('[data-ba]'); if (ba) return botAct(ba.dataset.ba);
  const tab = t.closest('[data-bt]'); if (tab){ BOT.mode = tab.dataset.bt === 'inbox' ? 'inbox' : 'chat'; return botRender(); }
  const bi = t.closest('[data-bi]'); if (bi){ try{ const d = await helpApi({ q:'?id=' + encodeURIComponent(bi.dataset.bi) }); BOT.cur = d.item; BOT.mode = 'reply'; botRender(); }catch(er){ toast(er.message); } return; }
  const b = t.closest('[data-b]'); if (!b) return;
  const k = b.dataset.b;
  if (k === 'min') botClose();
  else if (k === 'hide'){ botClose(); try{ sessionStorage.setItem('synthz:bothide', '1'); }catch(er){} const el = BOT.el; BOT.el = null; if (el){ el.classList.remove('on'); setTimeout(() => el.remove(), 400); } toast('SynthonIA se escondió hasta que vuelvas a abrir la página.'); }
  else if (k === 'team') botTeam();
  else if (k === 'fb'){ botClose(); feedbackModal(); }
  else if (k === 'ia'){ BOT.mode = 'chat'; botRender(); }
  else if (k === 'back'){ BOT.mode = 'inbox'; botRender(); }
  else if (k === 'end' || k === 'done'){ const id = k === 'end' ? BOT.help && BOT.help.id : BOT.cur && BOT.cur.id; if (!id) return; try{ const d = await helpApi({ body:{ action:'close', id } }); if (k === 'end'){ BOT.help = d.item; botFace('feliz'); } else BOT.cur = d.item; botRender(); }catch(er){ toast(er.message); } }
}
/* ---------- BETA: «Cuéntanos qué mejorar» (llega a Pulsem) ---------- */
function feedbackModal(){
  if ($('#szFb')) return;
  const o = document.createElement('div'); o.id = 'szFb'; o.className = 'szm';
  const C = [['idea', '💡', 'Una idea'], ['error', '🐞', 'Algo falló'], ['confuso', '🤔', 'No entendí algo'], ['otro', '💬', 'Otra cosa']];
  o.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Cuéntanos qué mejorar"><div class="word">' + zWord('Synth') + '</div><div class="tn">BETA · TU OPINIÓN</div><div class="tb"><h3>Cuéntanos qué mejorar</h3><p>Lo lee el equipo de SynthZ. No hace falta saber de tecnología: escríbelo como se lo dirías a un amigo.</p></div>'
    + '<div class="fbc" role="radiogroup">' + C.map(([k, e, l], i) => '<button type="button" role="radio" data-c="' + k + '" aria-checked="' + (i === 0) + '"><span>' + e + '</span>' + l + '</button>').join('') + '</div>'
    + '<label class="fbt"><textarea maxlength="1000" rows="4" placeholder="Por ejemplo: no encontré dónde cambiar de IA…"></textarea></label>'
    + '<div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>Cancelar</button><button class="btn sm" type="button" data-send>Enviar</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  let cat = 'idea';
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  $('[data-close]', o).addEventListener('click', close); o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  $$('[data-c]', o).forEach(b => b.addEventListener('click', () => { cat = b.dataset.c; $$('[data-c]', o).forEach(x => x.setAttribute('aria-checked', String(x === b))); SND.tap(); }));
  setTimeout(() => $('textarea', o).focus(), 120);
  $('[data-send]', o).addEventListener('click', async e => {
    const t = $('textarea', o).value.trim(); if (t.length < 3){ toast('Cuéntanos un poquito más.'); return; }
    e.currentTarget.disabled = true;
    try{ await api('help', { method:'POST', body:{ action:'feedback', cat, text:t, page:telPage() }, keep:true }); close(); toast('¡Gracias! El equipo ya lo recibió. 💛'); SND.done(); }
    catch(er){ e.currentTarget.disabled = false; toast(er.message || 'No pude enviarlo. Intenta de nuevo.'); }
  });
}
function betaMk(){
  const t = document.createElement('button'); t.type = 'button'; t.className = 'beta-tag'; t.textContent = 'BETA'; t.title = 'Estamos en beta: cuéntanos qué mejorar'; t.dataset.tip = 'Cuéntanos qué mejorar';
  t.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); feedbackModal(); });
  return t;
}
/* SynthZ: el BETA va al lado del logo pero FUERA del enlace (antes a veces no se podía tocar) */
function betaTags(){
  if (isFlow()) return betaBot();
  const a = document.querySelector('#nav .logo'); if (!a || document.querySelector('#nav .beta-tag')) return;
  const w = document.createElement('div'); w.className = 'logow'; a.before(w); w.append(a, betaMk());
}
/* SynthFlow: el BETA va pegadito a la bolita de SynthonIA y la sigue si la mueves */
function betaBot(){
  const b = BOT.el; if (!b || !isFlow()) return;
  let t = document.getElementById('betaBot');
  if (!t){ t = betaMk(); t.id = 'betaBot'; t.classList.add('bb'); (b.classList.contains('inhead') ? b.parentNode : document.body).appendChild(t); }
  const put = () => {
    const r = b.getBoundingClientRect(); if (!r.width) return;
    if (b.classList.contains('inhead')){ t.style.position = 'absolute'; t.style.zIndex = '3'; t.style.left = (b.offsetLeft + b.offsetWidth + 8) + 'px'; t.style.top = (b.offsetTop + b.offsetHeight / 2 - t.offsetHeight / 2) + 'px'; return; }
    const w = t.offsetWidth || 46, h = t.offsetHeight || 18, left = r.left - w - 10 < 8 ? r.right + 10 : r.left - w - 10;
    t.style.left = left.toFixed(0) + 'px'; t.style.top = (r.top + r.height / 2 - h / 2).toFixed(0) + 'px';
  };
  BOT.betaPut = put; put(); requestAnimationFrame(put); setTimeout(put, 700); setTimeout(put, 1600);
  if (!t._w){ t._w = 1; addEventListener('resize', put); if (document.fonts) document.fonts.ready.then(put); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(betaTags, 400)); else setTimeout(betaTags, 400);
addEventListener('synthz-ready-bot', botMount);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(botMount, 900)); else setTimeout(botMount, 900);
const BOTAPI = { open:botOpen, close:botClose, mount:botMount, say:botSay, sync:botSync, team:botTeam, chatOpen, chatClose, match:q => { const f = botMatch(q); return f ? BOT_FAQ.indexOf(f) : -1; }, get el(){ return BOT.el; } };
/* ---------- Guía: elegir cómo aprender (Asistida con SynthonIA o Lectura) ---------- */
function guideChooser(o = {}){
  if ($('#szGch')) return;
  const w = document.createElement('div'); w.id = 'szGch'; w.className = 'szm';
  w.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Guía"><div class="word">' + zWord('Synth') + '</div><div class="tn">GUÍA</div><div class="tb"><h3>¿Cómo quieres aprender?</h3><p>' + esc(o.lead || 'Te muestro ' + (isFlow() ? 'SynthFlow' : 'SynthZ') + ' como prefieras. Puedes volver aquí cuando quieras con el botón «Guía».') + '</p></div>'
    + '<div class="gch"><button type="button" class="gco a" data-g="a"><span class="gf">' + face('senalando', 54) + '</span><b>Asistida</b><small>SynthonIA te lo muestra con su manita, paso a paso: temas, IA recomendadas, comparar 2 y ' + (o.trial === false ? 'cómo conectar.' : 'tu primer chat con las IAs conectadas.') + '</small><em>Unos 2 minutos</em></button>'
    + '<button type="button" class="gco l" data-g="l"><span class="gf"><svg viewBox="0 0 48 48" width="54" height="54" aria-hidden="true"><path d="M8 11c6-2 12-1 16 3 4-4 10-5 16-3v26c-6-2-12-1-16 3-4-4-10-5-16-3z" fill="rgba(184,196,255,.12)" stroke="#b8c4ff" stroke-width="2" stroke-linejoin="round"/><path d="M24 14v26" stroke="#b8c4ff" stroke-width="2"/><path d="M12 18h7M12 23h7M29 18h7M29 23h7" stroke="#b8c4ff" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/></svg></span><b>Lectura</b><small>Una guía corta para leer a tu ritmo, con todo lo importante.</small><em>A tu ritmo</em></button></div>'
    + '<div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>Ahora no</button></div></div>';
  document.body.appendChild(w); requestAnimationFrame(() => w.classList.add('on'));
  $('.tcard', w).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:600, easing:'cubic-bezier(.22,1,.36,1)' });
  SND.blip('feliz');
  const close = then => { w.classList.remove('on'); setTimeout(() => w.remove(), 420); if (then) setTimeout(then, 260); };
  $('[data-close]', w).addEventListener('click', () => close(o.later));
  w.addEventListener('pointerdown', e => { if (e.target === w) close(o.later); });
  $$('[data-g]', w).forEach(b => b.addEventListener('click', () => close(b.dataset.g === 'a' ? o.asistida : o.lectura)));
  setTimeout(() => { const b = $('[data-g="a"]', w); if (b) b.focus(); }, 80);
}

/* ---------- bienvenida tras 12 horas: «Ya tengo el Flow» o «Soy nuevo, quiero aprender» ---------- */
const SEEN_KEY = 'synthz:lastSeen', AWAY_MS = 12 * 3600e3;
let lastSeen0 = 0; try{ lastSeen0 = +localStorage.getItem(SEEN_KEY) || 0; }catch(e){}
const markSeen = () => { try{ localStorage.setItem(SEEN_KEY, String(Date.now())); }catch(e){} };
markSeen(); setInterval(markSeen, 5 * 60e3);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') markSeen(); });
let welcomeShown = false;
function wasAway(){ let force = false; try{ force = new URLSearchParams(location.search).get('bienvenida') === '1'; }catch(e){} return force || (lastSeen0 > 0 && Date.now() - lastSeen0 >= AWAY_MS); }
function welcomeBack(opts){
  opts = opts || {};
  if (welcomeShown || $('#szWelcome')) return null;
  welcomeShown = true;
  const who = ACC.ready ? accName() : '';
  const o = document.createElement('div'); o.id = 'szWelcome'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Bienvenida');
  o.innerHTML = '<div class="wbface">' + face('flow', 64) + '</div>'
    + '<div class="wbtx"><b>' + (who ? '¡Hola de nuevo! ¿Sigues siendo tú?' : '¡Hola! ¿Ya conoces ' + (isFlow() ? 'SynthFlow' : 'SynthZ') + '?') + '</b><p>' + (who ? 'La sesión de <em>' + esc(who) + '</em> está abierta en este dispositivo. Si eres nuevo, te muestro cómo funciona todo.' : 'Pasaron más de 12 horas. Si es tu primera vez, te muestro cómo funciona todo en un minuto.') + '</p></div>'
    + '<div class="wbbtn"><button type="button" class="btn sm flow" data-wb="flow">' + face('flow', 22, 'wbmini') + (who ? 'Ya tengo el Flow · continuar' : 'Ya tengo el Flow') + '</button><button type="button" class="btn sm ghost" data-wb="new">Soy nuevo, quiero aprender</button></div>'
    + '<button type="button" class="wbx" data-wb="x" aria-label="Cerrar">✕</button>';
  document.body.appendChild(o);
  requestAnimationFrame(() => requestAnimationFrame(() => o.classList.add('on')));
  const close = kind => {
    if (!o.isConnected) return;
    o.classList.remove('on'); o.classList.add('bye');
    if (kind === 'flow' && !reduce && !root.classList.contains('noanim')){ const r = $('.wbface', o).getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, ['#e6b65f', '#ffe2a8', '#c9566c'], 14); }
    setTimeout(() => o.remove(), 650);
  };
  o.addEventListener('click', e => {
    const b = e.target.closest('[data-wb]'); if (!b) return;
    const k = b.dataset.wb; close(k);
    if (k === 'new' && opts.learn) setTimeout(opts.learn, 420);
    if (k === 'flow' && opts.flow) opts.flow();
  });
  addEventListener('keydown', function esc1(e){ if (e.key === 'Escape' && o.isConnected){ close('x'); removeEventListener('keydown', esc1); } });
  return o;
}

/* ===== v1.3: mientras corre una guía o un recorrido, solo se puede tocar la guía y «Saltar guía» ===== */
(function guideLock(){
  const OK = '#szgHud,#szgPanel,#szSay,#szHand,#ptour,#tour,.szm,#toast,#szChat,.tcard,[data-guide-ok]';
  const on = () => root.classList.contains('guiding') || !!document.getElementById('ptour') || !!document.getElementById('tour');
  let warnT = 0;
  const stop = e => {
    if (!e.isTrusted || !on()) return;
    const t = e.target, el = t && t.nodeType === 1 ? t : t && t.parentElement;
    if (el && el.closest && el.closest(OK)) return;
    if (e.type === 'keydown'){
      if (e.key === 'Escape' || e.key === 'Tab' || e.key === 'F5') return;
      const a = document.activeElement; if (a && a.closest && a.closest(OK)) return;
    }
    if (e.type === 'wheel' || e.type === 'touchmove') return;      /* mirar (desplazarse) sí se puede */
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if ((e.type === 'pointerdown' || e.type === 'keydown') && Date.now() - warnT > 2600){ warnT = Date.now(); try{ toast('Estás en la guía. Sigue con los botones de SynthonIA o toca «Saltar guía».'); }catch(x){} const h = document.querySelector('#szgHud .gh-x'); if (h){ h.classList.remove('nudge'); void h.offsetWidth; h.classList.add('nudge'); } }
  };
  ['pointerdown', 'mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu', 'keydown', 'submit'].forEach(t => addEventListener(t, stop, { capture:true, passive:false }));
})();
/* ===== v1.3 · en el celular, cada toque deja una onda de vidrio ===== */
addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch' || reduce || root.classList.contains('noanim') || document.getElementById('portal')) return;
  const r = document.createElement('i'); r.className = 'tapr'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
  document.body.appendChild(r); setTimeout(() => r.remove(), 600);
}, { capture:true, passive:true });
/* ===== v1.3 · SynthonIA con vida: chistes, datos curiosos que no se repiten, siesta, reacciones y ayuda si te pierdes ===== */
(function botLife(){
  const JOKES = [
    '¿Por qué la computadora fue al médico? Porque tenía un virus… y no quería compartirlo. 🤒',
    '¿Qué le dijo un bit a otro bit? «Nos vemos en el bus». 🚌',
    'Le pedí a una IA que me contara un chiste de memoria… y se le olvidó. 😅',
    '¿Cuál es el colmo de un programador? Que su perro se llame «Error 404»… y nunca lo encuentre. 🐶',
    '¿Por qué el libro de matemáticas estaba triste? Porque tenía demasiados problemas. 📘',
    '¿Qué hace una abeja en el gimnasio? ¡Zumba! 🐝',
    'Mi wifi y yo tenemos algo en común: los dos nos desconectamos los lunes. 📶',
    '¿Qué le dice un semáforo a otro? «No me mires, que me estoy cambiando». 🚦',
    'Intenté hacer un chiste sobre la nube… pero se fue volando. ☁️',
    '¿Cuál es el café más peligroso del mundo? El ex-preso. ☕',
    '¿Qué le dijo el 0 al 8? «¡Qué buen cinturón!» 0️⃣',
    'Soy SynthonIA y no duermo… bueno, solo cuando te vas. 😴',
    '¿Qué hace un pez en internet? Navega. 🐟',
    '¿Cómo se despiden los químicos? Ácido un placer. 🧪',
    '¿Qué le dijo una impresora a otra? «¿Ese papel es tuyo o es impresión mía?» 🖨️',
    '¿Por qué la escoba llegó tarde? Porque se quedó barriendo. 🧹',
    'Mi contraseña es «incorrecta»: así, cuando la olvido, la página me la recuerda. 🔐',
    '¿Por qué el tomate se puso rojo? Porque vio a la ensalada sin aderezo. 🍅',
    '¿Cuál es el animal más antiguo? La cebra, porque está en blanco y negro. 🦓',
    'Le dije a mi IA que era graciosa… y me respondió con una tabla de 5 columnas. 📊',
    '¿Qué hace una vaca pensando? Leche concentrada. 🐄',
    '¿Por qué el mar es tan amable? Porque siempre te saluda con una ola. 🌊',
    '¿Qué le dijo la luna al sol? «Tú tan grande y no te dejan salir de noche». 🌙',
    '¿Cómo se llama el campeón de buceo japonés? Tokofondo. 🤿',
    '¿Qué le dijo el café al azúcar? «Sin ti mi vida es amarga». ☕'
  ];
  const FACTS = [
    'SynthFlow puede poner varias IA a responder la misma pregunta al mismo tiempo. Así ves cuál lo explica mejor.',
    'Si tocas «Otra vez» en una respuesta, la IA lo intenta de nuevo con otras palabras.',
    'Tus chats se guardan en tu dispositivo, y si entras con tu cuenta también te siguen a tu celular.',
    'Con SuperiorSynth, una IA mejora lo que escribes y se lo pasa a la IA que más sabe de ese tema.',
    'La «Automática» elige sola una IA que esté funcionando bien en ese momento.',
    'Puedes adjuntar fotos y PDF: algunas IA los leen y te los explican.',
    'Los pulpos tienen tres corazones y sangre azul. 🐙',
    'La miel bien guardada casi no se daña: se ha encontrado miel comestible de miles de años. 🍯',
    'Un día en Venus dura más que un año en Venus. 🪐',
    'Los flamencos son rosados por lo que comen: algas y camarones. 🦩',
    'Las nutrias se toman de la mano al dormir para no separarse con la corriente. 🦦',
    'El corazón de una ballena azul es tan grande como un carro pequeño. 🐋',
    'La Torre Eiffel puede crecer unos centímetros en verano por el calor. 🗼',
    'Las abejas pueden reconocer caras humanas. 🐝',
    'Un rayo es unas cinco veces más caliente que la superficie del Sol. ⚡',
    'Los caracoles pueden dormir hasta tres años seguidos. 🐌',
    'Las vacas tienen mejores amigas y se estresan si las separan. 🐄',
    'El ojo del avestruz es más grande que su cerebro. 👁️',
    'Hay más árboles en la Tierra que estrellas en la Vía Láctea. 🌳',
    'Al primer error de computador se le dijo «bug» porque una polilla de verdad se metió en una máquina en 1947. 🦋',
    'Los koalas duermen hasta 20 horas al día. 🐨',
    'La Gran Muralla China no se ve a simple vista desde el espacio: es un mito. 🧱',
    'Las jirafas solo duermen unos minutos seguidos, y a veces de pie. 🦒',
    'Colombia es uno de los países con más especies de aves del mundo. 🐦',
    'Los delfines se llaman entre sí con silbidos que funcionan como nombres. 🐬',
    'La palabra «robot» viene del checo y significa «trabajo forzado». 🤖',
    'Las estrellas de mar no tienen cerebro… ¡y aun así se las arreglan! ⭐',
    'Los gatos pasan cerca del 70 % de su vida durmiendo. 🐈',
    'El sonido viaja unas cuatro veces más rápido en el agua que en el aire. 🔊',
    'Una cucharadita de una estrella de neutrones pesaría millones de toneladas. ✨'
  ];
  const K = 'synthz:botseen';
  const seen = () => { try{ return Object.assign({ j:[], f:[], x:[] }, JSON.parse(localStorage.getItem(K)) || {}); }catch(e){ return { j:[], f:[], x:[] }; } };
  const keep = s => { try{ localStorage.setItem(K, JSON.stringify(s)); }catch(e){} };
  const hash = t => { let h = 0; for (const c of String(t)) h = (h * 31 + c.charCodeAt(0)) | 0; return String(h); };
  /* nunca repite: cuando se acaban los guardados, le pide uno nuevo a la IA y recuerda lo que ya dijo */
  async function next(kind){
    const s = seen(), L = kind === 'j' ? JOKES : FACTS, used = new Set(s[kind]);
    const left = L.map((t, i) => i).filter(i => !used.has(i));
    if (left.length){ const i = left[Math.floor(Math.random() * left.length)]; s[kind] = [...used, i]; keep(s); return L[i]; }
    for (let k = 0; k < 2; k++){
      try{
        const q = kind === 'j' ? 'Cuéntame un chiste corto, blanco y nuevo, de una o dos líneas.' : 'Dime un dato curioso corto y verdadero del mundo, de una línea.';
        const r = await fetch('/api/help', { method:'POST', headers:Object.assign({ 'content-type':'application/json' }, SESS ? { authorization:'Bearer ' + SESS } : {}), body:JSON.stringify({ action:'ask', q, hist:[] }) });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.text && !s.x.includes(hash(d.text))){ s.x = [...s.x, hash(d.text)].slice(-500); keep(s); return d.text; }
      }catch(e){ break; }
    }
    return kind === 'j' ? 'Ya te conté todos mis chistes… ¡estoy escribiendo nuevos! 😄' : 'Ya te conté todos mis datos curiosos por ahora. Vuelve luego y tendré más. ✨';
  }
  BOTAPI.joke = () => next('j'); BOTAPI.fact = () => next('f');

  /* ---- actividad: ¿la persona está aquí? ---- */
  let last = Date.now(), asleep = false;
  const active = () => Date.now() - last < 25000 && !document.hidden;
  const busyUI = () => root.classList.contains('guiding') || root.classList.contains('lock') || root.classList.contains('leaving') || !root.classList.contains('ready') && !isFlow() || !!document.querySelector('#ptour,#tour,.szm,#vintro,#intro,#portal,.hackev') || BOT.open;
  function wake(){
    last = Date.now();
    if (!asleep) return; asleep = false;
    root.classList.remove('idle-sleep');
    if (BOT.el){ botFace('sorprendida'); try{ SND.blip('sorprendida'); }catch(e){} if (!busyUI()) botBubble(['¡Ah! ¡Volviste! 👀', '¡Uy, me quedé dormida! Ya estoy aquí.', '¡Hola otra vez! Te estaba esperando.'][Math.floor(Math.random() * 3)], 3200); setTimeout(() => { if (!asleep) botFace('feliz'); }, 2200); }
  }
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(t => addEventListener(t, wake, { capture:true, passive:true }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  /* 1 minuto sin moverte: SynthonIA se duerme y la página baja el ritmo para ahorrar batería */
  setInterval(() => {
    if (asleep || Date.now() - last < 60000 || busyUI()) return;
    if (document.querySelector('.work:not(.fin)')) return;     /* no se duerme mientras una IA responde */
    asleep = true; root.classList.add('idle-sleep'); if (BOT.el) botFace('dormida');
  }, 5000);
  BOTAPI.sleeping = () => asleep;

  /* ---- de vez en cuando (solo si estás activo): un dato curioso o un chiste ---- */
  let lastTalk = Date.now();
  setInterval(async () => {
    if (!BOT.el || asleep || !active() || busyUI() || Date.now() - lastTalk < 240000) return;
    const a = document.activeElement; if (a && /INPUT|TEXTAREA/.test(a.tagName) && a.value) return;   /* no interrumpe si estás escribiendo */
    if (Math.random() > .35) return;
    lastTalk = Date.now();
    const j = Math.random() < .4, t = await next(j ? 'j' : 'f');
    botFace(j ? 'riendo' : 'sorprendida'); botBubble((j ? '' : '¿Sabías que…? ') + t, 7500); setTimeout(() => { if (!asleep) botFace('feliz'); }, 7600);
  }, 30000);

  /* ---- reacciones que la página le pide (respuestas, lentitud, límite…) ---- */
  const said = {};
  BOTAPI.react = (kind, o = {}) => {
    if (!BOT.el || asleep || busyUI() || !active()) return;
    const now = Date.now(); if (said[kind] && now - said[kind] < (o.cool || 90000)) return;
    if (kind === 'done' && !o.text && Math.random() > .25) return;
    said[kind] = now; lastTalk = now;
    const M = {
      slow:['pensando', 'Esta IA se está tomando su tiempo… ⏳ Si se demora mucho, prueba la «Automática».'],
      done:['feliz', ['¡Listo! ¿Te sirvió?', '¡Eso tiene mucho Flow! ✨', 'Si quieres otra versión, toca «Otra vez».'][Math.floor(Math.random() * 3)]],
      limit:['preocupada', 'Te queda poco de tu límite de hoy. Si se acaba, puedes seguir con Puter: tu versión pro de las IAs más usadas.'],
      lost:['confundida', '¿Te ayudo a encontrar algo? Tócame y pregúntame. 🙂']
    };
    if (kind === 'lost'){ BOT.lostN = (BOT.lostN || 0) + 1; BOT.el.classList.toggle('g1', BOT.lostN === 1); BOT.el.classList.toggle('g2', BOT.lostN >= 2); clearTimeout(BOT.gT); BOT.gT = setTimeout(() => BOT.el && BOT.el.classList.remove('g1', 'g2'), 25000); BOTAPI.problem('lost'); }
    const m = o.text ? [o.mood || 'feliz', o.text] : M[kind]; if (!m) return;
    botFace(m[0]); botBubble(m[1], o.ms || 5200); setTimeout(() => { if (!asleep) botFace('feliz'); }, (o.ms || 5200) + 200);
  };
  /* un mensaje con botón dentro del panel de SynthonIA (rescatar un error, cambiar de IA…) */
  BOT.acts = BOT.acts || {};
  BOTAPI.offer = (text, mood, label, fn) => { const id = 'x' + Date.now().toString(36); BOT.acts[id] = fn; if (!BOT.open) botOpen(); botSay(text, mood || 'feliz', label ? [id, label] : null); };

  /* ---- demasiados problemas seguidos: saca su manita, pide perdón y señala el botón para contarnos qué pasó ---- */
  let probs = [], sorryAt = 0;
  BOTAPI.problem = kind => {
    const now = Date.now(); probs = probs.filter(t => now - t < 600000); probs.push(now);
    if (probs.length >= 4 && now - sorryAt > 1800000 && BOT.el && !root.classList.contains('guiding')){ sorryAt = now; probs = []; setTimeout(sorry, 900); }
  };
  async function sorry(){
    const t = document.querySelector('#betaBot') || [...document.querySelectorAll('.beta-tag')].find(x => x.getClientRects().length);
    BOT.sticky = 'triste'; botFace('triste', true); if (BOT.open) botClose();
    const unstick = e => { if (e.target.closest && e.target.closest('#szSay,#szHand,#szBot,.szm')) return; if (e.type === 'pointerdown' && e.pointerType === 'mouse' && e.button) return; BOT.sticky = null; botFace('feliz', true); removeEventListener('keydown', unstick, true); removeEventListener('pointerdown', unstick, true); };
    setTimeout(() => { addEventListener('keydown', unstick, true); addEventListener('pointerdown', unstick, true); }, 2500);
    if (!t || !HAND){ botBubble('Perdónanos por tu mala experiencia. Toca «BETA» para contarnos cuál fue el problema.', 9000); return; }
    const r0 = BOT.el.getBoundingClientRect(); HAND.show({ x:r0.left + r0.width / 2, y:r0.top + r0.height / 2 });
    await HAND.moveTo(t, { shape:'point' }); HAND.spot(t, 8);
    const k = await HAND.talk('Perdónanos por tu mala experiencia. Aquí está nuestro botón para que nos cuentes cuál fue el problema.', { near:t, mood:'triste', buttons:[{ label:'Contarles' }, { label:'Ahora no', ghost:true }], auto:14000 });
    HAND.unspot(); HAND.quiet(); HAND.hide();
    if (k === 0) feedbackModal();
  }
  /* ---- ¿perdido? muchos clics que no hacen nada o subir y bajar sin parar ---- */
  let clicks = [], dirs = [], lastY = scrollY, lastDir = 0;
  addEventListener('pointerdown', e => {
    if (!e.isTrusted || busyUI()) return;
    const dead = !(e.target.closest && e.target.closest('button,a,input,textarea,select,label,[role=button],[data-hover],.mi,.hex,.tchip,.m'));
    const now = Date.now(); clicks = clicks.filter(c => now - c.t < 5000); clicks.push({ t:now, x:e.clientX, y:e.clientY, dead });
    const near = clicks.filter(c => Math.hypot(c.x - e.clientX, c.y - e.clientY) < 60).length, deadN = clicks.filter(c => c.dead).length;
    if (near >= 6 || deadN >= 4){ clicks = []; BOTAPI.react('lost', { cool:40000 }); }
  }, { capture:true, passive:true });
  addEventListener('scroll', () => {
    const y = scrollY, d = Math.sign(y - lastY); lastY = y; if (!d || d === lastDir) return; lastDir = d;
    const now = Date.now(); dirs = dirs.filter(t => now - t < 9000); dirs.push(now);
    if (dirs.length >= 8 && !busyUI()){ dirs = []; BOTAPI.react('lost', { cool:40000 }); }
  }, { passive:true });
})();

/* ===== v2.0 · Guía rápida con SynthonIA: «¿La quieres completa o qué quieres ver?»
   Eliges uno o varios temas (en el orden que los toques) y te los muestra con su manita.
   Además: «¡Descubriste algo nuevo!» la primera vez que usas algo, y «Qué hay de nuevo» contado por ella ===== */
const GTOPICS = [
  ['chat', 'Escribir y enviar', 'Dónde escribes y cómo envías.'],
  ['ia', 'Elegir la IA', 'Cambiar de IA y ver para qué sirve cada una.'],
  ['comparar', 'Comparar IAs', 'Varias IA responden lo mismo, lado a lado.'],
  ['agente', 'SuperiorSynth', 'Escribes y SuperiorSynth elige la IA por ti.'],
  ['archivos', 'Archivos y vista previa', 'Adjuntar archivos y ver los que te da la IA.'],
  ['extras', 'Internet y memoria', 'Buscar datos de hoy y que la IA te recuerde.'],
  ['chats', 'Mis chats y favoritos', 'Dónde quedan tus conversaciones.'],
  ['limite', 'Tu límite gratis', 'Cuánto te queda hoy y cuándo se llena.'],
  ['cuenta', 'Tu cuenta y Puter', 'Guardar tus chats y la versión pro de las IA.'],
  ['ajustes', 'Ajustes', 'Más bonito, más rápido, sonidos y más.'],
  ['synthonia', 'SynthonIA', 'Cómo pedirme ayuda cuando quieras.']
];
function guideAsk(o = {}){
  if ($('#szGq')) return;
  const L = (o.topics || GTOPICS), picked = [];
  const w = document.createElement('div'); w.id = 'szGq'; w.className = 'szm';
  w.innerHTML = '<div class="tcard gq" role="dialog" aria-modal="true" aria-label="Guía rápida">'
    + '<div class="gq-say"><span class="gq-f">' + face('feliz', 64) + '</span><div><b>SynthonIA</b><p></p></div></div>'
    + '<button type="button" class="gq-full" data-gq="full"><span>Completa</span><small>' + esc(o.fullTxt || 'Te muestro todo, paso a paso (unos 2 minutos).') + '</small></button>'
    + '<p class="gq-or">o elige lo que quieres ver <small>(puedes elegir varios; los veremos en el orden en que los toques)</small></p>'
    + '<div class="gq-chips">' + L.map(t => '<button type="button" class="gq-c" data-t="' + t[0] + '" aria-pressed="false" title="' + esc(t[2]) + '"><i></i>' + esc(t[1]) + '</button>').join('') + '</div>'
    + '<div class="tbtn gq-b"><button class="lnk" type="button" data-close>Ahora no</button>' + (o.read ? '<button class="lnk" type="button" data-gq="read">Leer a mi ritmo</button>' : '') + '<button class="btn sm flow" type="button" data-gq="go" disabled>Muéstrame lo que elegí</button></div></div>';
  document.body.appendChild(w); requestAnimationFrame(() => w.classList.add('on'));
  $('.tcard', w).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:600, easing:'cubic-bezier(.22,1,.36,1)' });
  const say = '¡Hola! ¿Quieres ver la guía completa o qué quieres aprender?';
  const p = $('.gq-say p', w); p.textContent = say; SND.blip('feliz');
  typeIn(p, { cps:46, max:3, onFrame:lipSync([$('.gq-f .szface', w), ballFace()], say) }).catch(() => {});
  const go = $('[data-gq="go"]', w);
  const paint = () => { $$('.gq-c', w).forEach(b => { const i = picked.indexOf(b.dataset.t); b.setAttribute('aria-pressed', String(i >= 0)); $('i', b).textContent = i >= 0 ? String(i + 1) : ''; }); go.disabled = !picked.length; go.textContent = picked.length ? 'Muéstrame ' + (picked.length === 1 ? 'eso' : 'estos ' + picked.length) : 'Muéstrame lo que elegí'; };
  const close = then => { w.classList.remove('on'); setTimeout(() => w.remove(), 420); if (then) setTimeout(then, 280); };
  w.addEventListener('click', e => {
    const c = e.target.closest('.gq-c');
    if (c){ const k = c.dataset.t, i = picked.indexOf(k); if (i >= 0) picked.splice(i, 1); else picked.push(k); SND.tap && SND.tap(); paint(); return; }
    const b = e.target.closest('[data-gq]');
    if (b){ const a = b.dataset.gq; if (a === 'full') close(o.full); else if (a === 'read') close(o.read); else if (a === 'go' && picked.length) close(() => o.pick && o.pick(picked.slice())); return; }
    if (e.target === w || e.target.closest('[data-close]')) close(o.later);
  });
  setTimeout(() => { const b = $('.gq-full', w); if (b) b.focus(); }, 80);
}

/* «¡Descubriste algo nuevo!»: la primera vez que usas algo, SynthonIA te cuenta en una línea para qué sirve */
const DISC = [
  ['#cCmp, #pickRow [data-add], [data-add-cmp]', 'comparar', 'Comparar IAs', 'Ahora varias IA responden lo mismo y ves cuál lo hace mejor.'],
  ['#railAgent, #cSeg [data-v="agents"]', 'agente', 'SuperiorSynth', 'Tú escribes; SuperiorSynth mejora tu pedido y elige la IA que más sabe de eso.'],
  ['.fcard [data-fv]', 'archivos', 'Archivos de la IA', 'Puedes ver el código, su vista previa y descargarlo con su nombre.'],
  ['[data-a="star"]', 'favoritos', 'Favoritos', 'Las respuestas que guardas con la estrella quedan en «Favoritos».'],
  ['#attachBtn', 'adjuntar', 'Adjuntar archivos', 'Le puedes dar a la IA fotos, PDF o archivos de texto para que los lea.'],
  ['.tchip[data-topic]', 'temas', 'Temas', 'Cada tema te recomienda las IA que mejor lo hacen.'],
  ['[data-r="search"], #thQ', 'buscar', 'Buscar en tus chats', 'Busco dentro de todos tus mensajes, no solo en los títulos.'],
  ['[data-a="regen"]', 'otra', 'Otra vez', 'La IA vuelve a responder lo mismo, con otras palabras.'],
  ['#ssTop', 'agente-off', 'Salir de SuperiorSynth', 'Toca su sello arriba y «Elegir yo la IA».']
];
const DISC_KEY = 'synthz:disc';
let discSeen = {}; try{ discSeen = JSON.parse(localStorage.getItem(DISC_KEY) || '{}') || {}; }catch(e){}
let discQ = [], discOn = false;
function discShow(){
  if (discOn || !discQ.length) return;
  if (document.querySelector('#szgHud, #szGq, #szWelcome, #vintro, #intro, #portal, .hackev') || root.classList.contains('guiding')){ setTimeout(discShow, 2500); return; }
  discOn = true; const [, , name, text] = discQ.shift();
  const d = document.createElement('div'); d.className = 'szdisc'; d.setAttribute('role', 'status');
  d.innerHTML = '<span class="dc-f">' + face('sorprendida', 46) + '</span><div><small>¡Descubriste algo nuevo!</small><b></b><p></p></div><button type="button" class="dc-x" aria-label="Cerrar">✕</button>';
  $('b', d).textContent = name; $('p', d).textContent = text;
  document.body.appendChild(d); requestAnimationFrame(() => d.classList.add('on')); SND.blip && SND.blip('sorprendida');
  typeIn($('p', d), { cps:44, max:3, onFrame:lipSync([$('.dc-f .szface', d)], text) }).catch(() => {});
  const bye = () => { if (!d.isConnected) return; d.classList.remove('on'); setTimeout(() => { d.remove(); discOn = false; setTimeout(discShow, 600); }, 400); };
  $('.dc-x', d).addEventListener('click', bye); setTimeout(bye, 6500);
}
document.addEventListener('click', e => {
  if (!e.target.closest) return;
  for (const D of DISC){
    if (discSeen[D[1]] || !e.target.closest(D[0])) continue;
    discSeen[D[1]] = Date.now(); try{ localStorage.setItem(DISC_KEY, JSON.stringify(discSeen)); }catch(x){}
    discQ.push(D); setTimeout(discShow, 900); break;
  }
}, true);

/* «Qué hay de nuevo»: SynthonIA te lo cuenta una vez por versión (y está en el menú cuando quieras) */
const WHATSNEW = { v:'2.2', items:[
  ['chat', 'SynthFlow se renovó: más limpio y fácil. Todo para escribir está en una sola caja, y el «+» trae archivos, crear imagen, buscar en internet y respuestas cortas.'],
  ['extras', 'Busca en internet: «+» › «Buscar en internet». La IA responde con datos de hoy y te muestra sus fuentes (y si preguntas algo de hoy, busca sola).'],
  ['archivos', 'Pídele «hazme una presentación de…» y te la entrega lista para descargar en PowerPoint.'],
  ['ajustes', 'Ajustes ahora tiene 2 pestañas: «Página» e «IAs y memoria» (lo que recuerdo de ti, respuestas cortas, tus IA ideales y más).'],
  ['synthonia', '¡Y ahora hablo de verdad: muevo la boca con cada sílaba! Cuando haya novedades verás un «!» sobre mi cabeza.']
] };
function newsBang(onShow){
  const b = $('#szBot'); if (!b){ setTimeout(() => newsBang(onShow), 600); return; }
  if ($('.nwbang', b)) return;
  const x = document.createElement('span'); x.className = 'nwbang'; x.setAttribute('role', 'button'); x.setAttribute('tabindex', '0'); x.setAttribute('aria-label', '¿Qué hay de nuevo?'); x.dataset.tip = '¿Qué hay de nuevo?'; x.textContent = '!';
  const go = e => { e.preventDefault(); e.stopPropagation(); whatsNew(true, onShow); };
  x.addEventListener('click', go); x.addEventListener('pointerdown', e => e.stopPropagation()); x.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') go(e); });
  b.appendChild(x); b.setAttribute('aria-label', 'SynthonIA · hay novedades');
  try{ SND.blip('celebrando'); }catch(e){}
}
function whatsNew(force, onShow){
  let seen = ''; try{ seen = localStorage.getItem('synthz:newv') || ''; }catch(e){}
  const visited = (() => { try{ return !!localStorage.getItem('synthz:visited'); }catch(e){ return false; } })();
  if (!force && (seen === WHATSNEW.v || !visited)){ try{ localStorage.setItem('synthz:newv', WHATSNEW.v); }catch(e){} return false; }
  /* v2.2 · ya no se abre sola: sale un «!» sobre la cabeza de SynthonIA (una vez por versión) y se abre al tocarlo */
  if (!force){ newsBang(onShow); return false; }
  try{ localStorage.setItem('synthz:newv', WHATSNEW.v); }catch(e){}
  $$('.nwbang').forEach(x => { x.classList.add('out'); setTimeout(() => x.remove(), 400); }); const sb = $('#szBot'); if (sb) sb.setAttribute('aria-label', 'SynthonIA');
  if ($('#szNew')) return true;
  const w = document.createElement('div'); w.id = 'szNew'; w.className = 'szm';
  w.innerHTML = '<div class="tcard gq" role="dialog" aria-modal="true" aria-label="Qué hay de nuevo"><div class="gq-say"><span class="gq-f">' + face('celebrando', 64) + '</span><div><b>SynthonIA · Qué hay de nuevo</b><p></p></div></div>'
    + '<ul class="nw-l">' + WHATSNEW.items.map((x, i) => '<li style="--i:' + i + '">' + esc(x[1]) + '</li>').join('') + '</ul>'
    + '<div class="tbtn gq-b"><button class="lnk" type="button" data-close>Luego</button>' + (onShow ? '<button class="btn sm flow" type="button" data-nw="show">Muéstramelo</button>' : '') + '</div></div>';
  document.body.appendChild(w); requestAnimationFrame(() => w.classList.add('on'));
  const say = '¡Hay cosas nuevas en ' + BRAND() + '! Te cuento rapidito:';
  const p = $('.gq-say p', w); p.textContent = say; SND.blip('celebrando');
  typeIn(p, { cps:44, max:3, onFrame:lipSync([$('.gq-f .szface', w), ballFace()], say) }).catch(() => {});
  const close = then => { w.classList.remove('on'); setTimeout(() => w.remove(), 420); if (then) setTimeout(then, 280); };
  w.addEventListener('click', e => { if (e.target.closest('[data-nw="show"]')) return close(() => onShow(WHATSNEW.items.map(x => x[0]).filter((k, i, a) => a.indexOf(k) === i && GTOPICS.some(t => t[0] === k)))); if (e.target === w || e.target.closest('[data-close]')) close(); });
  return true;
}

/* ===== v2.0 · MODO ALERTA: si los proveedores dejan de ser gratis (todas las IAs conectadas piden pago),
   la página lo dice claro y espera; apenas vuelvan, te lleva de nuevo solita ===== */
let alertEl = null, alertT = 0;
function alertMode(on){
  if (on && !alertEl){
    if (document.querySelector('#vintro, #intro, #portal')){ setTimeout(() => alertMode(!!SZQ.alert), 3000); return; }
    const pu = (() => { try{ return !!(window.puter && puter.auth && puter.auth.isSignedIn()); }catch(e){ return false; } })();
    const o = document.createElement('div'); o.id = 'szAlert'; o.setAttribute('role', 'alertdialog'); o.setAttribute('aria-live', 'assertive');
    o.innerHTML = '<div class="al-in"><span class="al-f">' + face('preocupada', 84) + '</span><b class="al-t">Error: no podemos continuar</b>'
      + '<p>Las IAs gratis dejaron de responder por un cambio de los servicios que usamos. No es tu culpa y nadie te va a cobrar nada.</p>'
      + '<p class="al-w"><i></i>En cuanto volvamos a estar en línea, te redirigimos solito. No cierres la página.</p>'
      + (pu ? '<button type="button" class="btn sm flow" data-al="pu">Mientras tanto, seguir con mi Puter</button>' : '') + '</div>';
    document.body.appendChild(o); alertEl = o; requestAnimationFrame(() => o.classList.add('on'));
    const pb = $('[data-al="pu"]', o); if (pb) pb.addEventListener('click', () => { alertDismissed = true; alertMode(false); try{ dispatchEvent(new CustomEvent('synthz-useputer')); }catch(e){} });
    try{ telEv('noai', 'modo alerta: ninguna IA gratis responde'); }catch(e){}
    clearInterval(alertT); alertT = setInterval(async () => { try{ await szCatalog(); }catch(e){} if (!SZQ.alert) alertBack(); }, 30000);
  } else if (!on && alertEl){ const o = alertEl; alertEl = null; clearInterval(alertT); o.classList.remove('on'); setTimeout(() => o.remove(), 500); }
}
let alertDismissed = false;
function alertBack(){
  if (!alertEl) return; clearInterval(alertT);
  const o = alertEl; $('.al-f', o).innerHTML = face('celebrando', 84); $('.al-t', o).textContent = '¡Volvimos!'; $$('p, button', o).forEach(x => x.remove());
  o.querySelector('.al-in').insertAdjacentHTML('beforeend', '<p>Ya todo funciona. Te llevo de vuelta…</p>');
  setTimeout(() => location.reload(), 1800);
}
addEventListener('synthz-szq', () => {
  if (SZQ.alert && !alertDismissed) alertMode(true); else if (!SZQ.alert && alertEl) alertBack();
  /* al equipo: SynthonIA avisa una vez por sesión que hay alertas en Pulsem */
  if (SZQ.alertN > 0 && ACC && ACC.user && ['owner', 'admin', 'staff'].includes(ACC.user.role)){
    let seen = false; try{ seen = sessionStorage.getItem('synthz:alertn') === String(SZQ.alertN); sessionStorage.setItem('synthz:alertn', String(SZQ.alertN)); }catch(e){}
    if (!seen) setTimeout(() => { try{ BOTAPI.offer && BOTAPI.offer('Ojo, equipo: hay ' + SZQ.alertN + (SZQ.alertN === 1 ? ' alerta' : ' alertas') + ' de las IAs (un proveedor pidió pago o cambió su plan gratis). Nada se cobró. Revísalo en Pulsem.', 'preocupada', 'Abrir Pulsem', () => { location.href = 'pulsem.html'; }); }catch(e){} }, 4000);
  }
});
/* ---------- v2.3 · SynthFlow como app: se instala desde el navegador (sin tiendas) ----------
   - El «trabajador» (sw.js) no guarda la página: todo llega siempre fresco de internet. Solo guarda la pantalla de «sin conexión».
   - En el celular, una vez cada 7 días, sale «Descarga nuestra app SynthFlow» con un video corto.
   - Android/Chrome: botón «Instalar» de verdad. iPhone: pasos con dibujos (Compartir › Agregar a inicio). */
const APP = { evt:null, done:false };
const appStandalone = () => { try{ return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }catch(e){ return false; } };
const appIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const appPhone = () => { try{ return matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) <= 820; }catch(e){ return false; } };
try{
  if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('/sw.js', { scope:'/' }).catch(() => {}));
  if (window.caches) caches.keys().then(ks => ks.filter(k => /^synthz-/.test(k)).forEach(k => caches.delete(k))).catch(() => {});   /* restos de la versión vieja */
}catch(e){}
addEventListener('beforeinstallprompt', e => { e.preventDefault(); APP.evt = e; });
addEventListener('appinstalled', () => { APP.done = true; APP.evt = null; try{ localStorage.setItem('synthz:appok', '1'); }catch(e){} const o = document.getElementById('appPromo'); if (o && o._close) o._close(); toast('¡Listo! SynthFlow quedó en tu pantalla de inicio.'); });
if (appStandalone()) root.classList.add('isapp');

function appSteps(box){
  const ios = appIOS();
  const share = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
  const dots = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="12" cy="5" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="12" cy="19" r="1.9"/></svg>';
  box.innerHTML = '<ol class="ap-steps">' + (ios
    ? '<li><span class="ap-n">1</span><span>Toca <b>Compartir</b> <i class="ap-k">' + share + '</i> abajo en Safari.</span></li><li><span class="ap-n">2</span><span>Baja y toca <b>Agregar a inicio</b>.</span></li><li><span class="ap-n">3</span><span>Toca <b>Agregar</b>. SynthFlow aparece junto a tus apps.</span></li>'
    : '<li><span class="ap-n">1</span><span>Toca el menú <i class="ap-k">' + dots + '</i> de tu navegador (arriba a la derecha).</span></li><li><span class="ap-n">2</span><span>Toca <b>Instalar app</b> o <b>Agregar a la pantalla principal</b>.</span></li><li><span class="ap-n">3</span><span>Confirma. SynthFlow aparece junto a tus apps.</span></li>') + '</ol>';
}
async function appInstall(fromBox){
  if (appStandalone()){ toast('Ya estás usando la app SynthFlow.'); return true; }
  if (APP.evt){
    const e = APP.evt; APP.evt = null;
    try{ e.prompt(); const r = await e.userChoice; if (r && r.outcome === 'accepted') return true; toast('Cuando quieras, la instalas desde aquí.'); return false; }catch(x){}
  }
  if (fromBox){ appSteps(fromBox); return false; }
  appPromo(true); return false;
}
function appPromo(force){
  if ($('#appPromo') || appStandalone()) return;
  if (!force){
    if (!appPhone()) return;
    try{ if (localStorage.getItem('synthz:appok')) return; const t = +localStorage.getItem('synthz:apppromo') || 0; if (Date.now() - t < 7 * 864e5) return; }catch(e){ return; }
    if (document.querySelector('.szm.on, #ptour, #guide, #szMaint, .tcard[role="dialog"]')) return;   /* no interrumpe otra ventana */
  }
  try{ localStorage.setItem('synthz:apppromo', String(Date.now())); }catch(e){}
  const o = document.createElement('div'); o.id = 'appPromo'; o.className = 'appp';
  const ios = appIOS(), canPrompt = !!APP.evt;
  o.innerHTML = '<div class="ap-card" role="dialog" aria-modal="true" aria-label="Descarga la app SynthFlow">'
    + '<div class="ap-vid"><video poster="/media/app/synthflow-demo.jpg" muted playsinline loop autoplay preload="metadata" aria-label="SynthFlow en acción"><source src="/media/app/synthflow-demo.webm" type="video/webm"><source src="/media/app/synthflow-demo.mp4" type="video/mp4"></video><span class="ap-badge"><img src="/media/app/sf-192.png" alt="" width="22" height="22">SynthFlow</span></div>'
    + '<div class="ap-body"><span class="ap-kick">App gratis · sin tiendas</span><h3>Descarga nuestra app <em>SynthFlow</em></h3>'
    + '<ul class="ap-why"><li><i>⚡</i><span><b>Va más fluida</b>: a pantalla completa, sin pestañas ni barra del navegador.</span></li><li><i>🌊</i><span><b>Más Flow</b>: tus chats y SuperiorSynth a un toque, desde tu pantalla de inicio.</span></li><li><i>🪶</i><span><b>Pesa casi nada</b> y siempre está al día: se instala desde aquí mismo.</span></li></ul>'
    + '<div class="ap-how"></div>'
    + '<div class="ap-acts"><button type="button" class="lnk" data-ap="no">Ahora no</button><button type="button" class="btn" data-ap="go">' + (canPrompt ? 'Instalar SynthFlow' : ios ? 'Ver cómo instalarla' : 'Instalar SynthFlow') + '</button></div></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const v = $('video', o); if (v){ v.play().catch(() => {}); v.addEventListener('error', () => { const w = $('.ap-vid', o); if (w) w.classList.add('novid'); }); }
  const close = () => { if (!o.isConnected) return; o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  o._close = close;
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  $('[data-ap="no"]', o).addEventListener('click', close);
  $('[data-ap="go"]', o).addEventListener('click', async e => { const ok = await appInstall($('.ap-how', o)); if (ok) close(); else if (!APP.evt){ e.currentTarget.textContent = 'Entendido'; e.currentTarget.dataset.ap = 'no'; e.currentTarget.onclick = close; } });
  addEventListener('keydown', function k(e){ if (e.key === 'Escape'){ close(); removeEventListener('keydown', k); } });
}
/* en el celular, un ratico después de entrar (nunca encima de otra ventana) */
if (!appStandalone() && !/pulsem/.test(location.pathname)) setTimeout(() => { try{ appPromo(false); }catch(e){} }, 24000);
/* ---------- v2.2 · etiquetas al pasar el mouse: cada botón con ícono dice qué hace (como en Claude) ---------- */
if (matchMedia('(hover: hover) and (pointer: fine)').matches){
  let tipEl = null, tipT = 0, tipFor = null;
  const hide = () => { clearTimeout(tipT); tipFor = null; if (tipEl) tipEl.classList.remove('on'); };
  addEventListener('pointerover', e => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (!t || t === tipFor) return;
    if (t.closest('.rail:not(.open)') || t.closest('.ctxm')) return hide();
    hide(); tipFor = t;
    tipT = setTimeout(() => {
      if (!t.isConnected || tipFor !== t) return;
      if (!tipEl){ tipEl = document.createElement('div'); tipEl.className = 'sztip'; tipEl.setAttribute('role', 'tooltip'); document.body.appendChild(tipEl); }
      tipEl.textContent = t.dataset.tip; tipEl.classList.remove('on');
      const r = t.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
      let y = r.top - h - 8; if (y < 6) y = r.bottom + 8;
      tipEl.style.left = Math.max(6, Math.min(innerWidth - w - 6, r.left + r.width / 2 - w / 2)) + 'px'; tipEl.style.top = y + 'px';
      requestAnimationFrame(() => tipEl && tipEl.classList.add('on'));
    }, 380);
  });
  addEventListener('pointerout', e => { if (tipFor && !(e.relatedTarget && tipFor.contains(e.relatedTarget))) hide(); });
  addEventListener('pointerdown', hide, true); addEventListener('scroll', hide, true); addEventListener('keydown', hide);
}
/* ---------- v2.3 · aviso de mantenimiento: cubre la página y SynthonIA (la de verdad) charla un rato ----------
   Lo encienden Prime o ZFlow en Pulsem › Ajustes. Pulsem nunca se cubre (desde ahí se apaga).
   SynthonIA cambia de cara según lo que le dicen: con cariño se encanta, con chistes se ríe, si piensa pone cara de pensar.
   Si la IA no responde (puede ser justo la falla), contesta con frases propias para que la charla nunca se corte. */
const MT = { el:null, hist:[], timer:0, mood:'feliz', busy:false, since:0, idle:0 };
const MT_LOVE = /(gracias|te quiero|te amo|te adoro|eres (muy |la |una )?(linda|bonita|hermosa|genial|la mejor|incre[ií]ble|tierna|buena|top)|qu[eé] (linda|bonita|tierna|genial)|me (caes|encantas|gustas)|eres lo m[aá]ximo|abrazo|besito|❤|♥|💖|😍|🥰)/i;
const MT_FUN = /(ja(ja)+|je(je)+|xd|😂|🤣|chiste|gracios)/i;
const MT_SAD = /(fe[ao]|tonta|in[uú]til|odio|aburr|mala|est[uú]pida)/i;
const mtOff = () => /pulsem/.test(location.pathname);
const mtAdmin = () => !!(ACC && ACC.user && ['owner', 'admin'].includes(ACC.user.role));
const mtSkipped = () => { try{ return sessionStorage.getItem('synthz:mtskip') === '1'; }catch(e){ return false; } };

/* frases propias por si la IA no está (la falla puede ser justo esa) */
const MT_LOCAL = {
  love:['¡Ay, me sonrojé! 💛 Gracias, de verdad. Tú también eres lo máximo.', '¡Me hiciste el día! Ya casi vuelvo con todo, gracias por esperarme.', 'Awww 🥰 Con gente como tú da gusto arreglar cosas.'],
  fun:['¡Jajaja! Me dio risa hasta en los circuitos.', 'Jaja, ¿te sabes otro? Mientras tanto el equipo sigue arreglando.', '¡Me hiciste reír! Eso me recarga más que la electricidad.'],
  sad:['Uy… tienes razón en estar molesto. Estamos trabajando para que vuelva pronto y mejor.', 'Perdón por la espera. El equipo está en ello, te lo prometo.'],
  any:['¡Te escucho! Ahora mismo no puedo pensar muy profundo porque estamos arreglando cosas, pero aquí sigo contigo.', 'Mientras se arregla todo, cuéntame: ¿qué es lo primero que quieres hacer cuando vuelva SynthFlow?', 'Buena pregunta. En cuanto termine el mantenimiento te respondo mejor. ¿Me cuentas algo más?']
};
const mtPick = L => L[Math.floor(Math.random() * L.length)];
const mtKind = q => MT_LOVE.test(q) ? 'love' : MT_FUN.test(q) ? 'fun' : MT_SAD.test(q) ? 'sad' : 'any';
const MT_MOOD_OF = { love:'encantada', fun:'riendo', sad:'disculpa', any:'feliz' };

function mtSetMood(m, hop){
  if (!MT.el) return;
  MT.mood = FACE[m] ? m : 'feliz';
  const w = $('.mt-face', MT.el); w.innerHTML = face(MT.mood, 168, 'mt-sz');
  if (hop && !reduce) w.animate([{ transform:'translateY(0) scale(1)' }, { transform:'translateY(-18px) scale(1.06)' }, { transform:'translateY(0) scale(.97)' }, { transform:'none' }], { duration:620, easing:'cubic-bezier(.3,1.6,.5,1)' });
}
function mtBurst(kind){
  if (!MT.el || reduce) return;
  const box = $('.mt-face', MT.el), ch = kind === 'love' ? ['💛', '💖', '✨', '💗'] : ['✨', '⭐', '😄'];
  for (let i = 0; i < 9; i++){
    const s = document.createElement('i'); s.className = 'mt-pt'; s.textContent = ch[i % ch.length];
    const a = (Math.PI * 2 * i) / 9 + Math.random() * .5, d = 70 + Math.random() * 60;
    box.appendChild(s);
    s.animate([{ transform:'translate(-50%,-50%) scale(.4)', opacity:0 }, { opacity:1, offset:.2 }, { transform:'translate(calc(-50% + ' + Math.cos(a) * d + 'px), calc(-50% + ' + (Math.sin(a) * d - 30) + 'px)) scale(1.15)', opacity:0 }], { duration:1300 + Math.random() * 500, easing:'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => s.remove();
  }
}
function mtAdd(role, text, mood){
  const L = $('.mt-msgs', MT.el), d = document.createElement('div');
  d.className = 'mt-m ' + (role === 'user' ? 'me' : 'ia');
  d.innerHTML = '<p></p>'; $('p', d).textContent = text; L.appendChild(d);
  L.scrollTo({ top:L.scrollHeight, behavior:reduce ? 'auto' : 'smooth' });
  MT.hist.push({ role, content:text });
  if (role !== 'user'){
    if (mood) mtSetMood(mood);
    typeIn($('p', d), { cps:42, max:4, onFrame:lipSync([$('.mt-face .szface', MT.el)], text) }).catch(() => {});
  }
}
async function mtSend(q){
  q = String(q || '').trim(); if (!q || MT.busy) return;
  const inp = $('.mt-in', MT.el); inp.value = '';
  mtAdd('user', q);
  const kind = mtKind(q);
  if (kind === 'love' || kind === 'fun'){ mtSetMood(MT_MOOD_OF[kind], true); mtBurst(kind); try{ SND.flow(); }catch(e){} }
  else mtSetMood('pensando');
  MT.busy = true; $('.mt-send', MT.el).disabled = true; MT.el.classList.add('thinking');
  let text = '', mood = MT_MOOD_OF[kind];
  try{
    const r = await fetch('/api/help', { method:'POST', headers:Object.assign({ 'content-type':'application/json' }, SESS ? { authorization:'Bearer ' + SESS } : {}), body:JSON.stringify({ action:'ask', ctx:'maint', q, hist:MT.hist.slice(-7, -1) }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok && d.text){ text = d.text; if (d.mood && FACE[d.mood]) mood = d.mood; }
  }catch(e){}
  if (!text) text = mtPick(MT_LOCAL[kind]);
  await sleepRaw(kind === 'love' ? 650 : 250);
  MT.busy = false; $('.mt-send', MT.el).disabled = false; MT.el.classList.remove('thinking');
  mtAdd('assistant', text, mood);
  clearTimeout(MT.back); MT.back = setTimeout(() => { if (MT.el && !MT.busy) mtSetMood('feliz'); }, 7000);
}
function mtExit(){
  const x = MT.el && $('.mt-exit', MT.el); if (!x) return;
  x.hidden = !mtAdmin();
}
function mtAgo(){
  if (!MT.el || !MT.since) return;
  const m = Math.max(1, Math.round((Date.now() - MT.since) / 60e3));
  $('.mt-ago', MT.el).textContent = m < 60 ? 'Trabajando en ello desde hace ' + m + ' min' : 'Trabajando en ello desde hace ' + Math.round(m / 60) + ' h';
}
function mtOpen(m){
  MT.since = m.t || MT.since || Date.now();
  if (MT.el){ $('.mt-text', MT.el).textContent = m.text; mtAgo(); return; }
  const el = document.createElement('div');
  el.id = 'szMaint'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'SynthZ está en mantenimiento');
  el.innerHTML = '<div class="mt-bg" aria-hidden="true"><i></i><i></i><i></i></div>'
    + '<div class="mt-wrap"><div class="mt-face" title="¡Tócame!"></div>'
    + '<div class="mt-head"><span class="mt-chip"><i></i>Mantenimiento</span><h2>Volvemos en un momento</h2><p class="mt-text"></p><small class="mt-ago"></small></div>'
    + '<div class="mt-chat"><div class="mt-msgs" aria-live="polite"></div>'
    + '<div class="mt-sugs">' + ['Cuéntame un chiste', '¿Qué estás arreglando?', 'Eres la mejor 💛'].map(s => '<button type="button" class="mt-sug">' + esc(s) + '</button>').join('') + '</div>'
    + '<form class="mt-form" autocomplete="off"><input class="mt-in" maxlength="300" placeholder="Charla con SynthonIA…" aria-label="Escribir a SynthonIA"><button class="mt-send" type="submit" aria-label="Enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button></form></div>'
    + '<button class="mt-exit" type="button" hidden>Entrar igual · solo Prime y ZFlow</button></div>';
  document.body.appendChild(el); document.documentElement.classList.add('mt-on');
  MT.el = el;
  $('.mt-text', el).textContent = m.text;
  mtSetMood('feliz'); mtAgo(); mtExit();
  $('.mt-form', el).addEventListener('submit', e => { e.preventDefault(); mtSend($('.mt-in', el).value); });
  $('.mt-sugs', el).addEventListener('click', e => { const b = e.target.closest('.mt-sug'); if (b){ mtSend(b.textContent); b.remove(); } });
  $('.mt-face', el).addEventListener('click', () => { const k = MT.mood === 'riendo' ? 'encantada' : 'riendo'; mtSetMood(k, true); mtBurst(k === 'encantada' ? 'love' : 'fun'); });
  $('.mt-exit', el).addEventListener('click', () => { try{ sessionStorage.setItem('synthz:mtskip', '1'); }catch(e){} mtClose(); });
  if (!reduce) el.animate([{ opacity:0 }, { opacity:1 }], { duration:500 });
  setTimeout(() => { if (MT.el && !MT.hist.length) mtAdd('assistant', '¡Hola! Soy SynthonIA. Estamos dejando todo mejor para ti. Mientras tanto, ¿charlamos un rato?', 'feliz'); }, 650);
  /* de vez en cuando hace un gesto, para que se sienta viva */
  clearInterval(MT.idle); MT.idle = setInterval(() => { if (MT.el && !MT.busy && MT.mood === 'feliz' && !document.hidden){ const g = mtPick(['guino', 'flow', 'riendo']); mtSetMood(g); setTimeout(() => { if (MT.el && MT.mood === g) mtSetMood('feliz'); }, 1800); } }, 9000);
  if (matchMedia('(hover:hover)').matches) setTimeout(() => { const i = MT.el && $('.mt-in', MT.el); if (i) i.focus({ preventScroll:true }); }, 500);
}
function mtClose(){
  if (!MT.el) return;
  const el = MT.el; MT.el = null; clearInterval(MT.idle);
  document.documentElement.classList.remove('mt-on');
  if (reduce) el.remove(); else el.animate([{ opacity:1 }, { opacity:0 }], { duration:380 }).onfinish = () => el.remove();
}
async function mtCheck(){
  try{
    const r = await fetch('/api/config', { cache:'no-store' }); if (!r.ok) return;
    const m = (await r.json()).maint || {};
    if (m.on && !mtSkipped()) mtOpen({ text:m.text || 'Estamos presentando fallas o actualizaciones. Espera un momento.', t:m.t });
    else if (!m.on){ mtClose(); try{ sessionStorage.removeItem('synthz:mtskip'); }catch(e){} }
  }catch(e){}
}
if (!mtOff()){
  const go = () => { mtCheck(); MT.timer = setInterval(() => { if (!document.hidden) mtCheck(); mtAgo(); }, 45000); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  addEventListener('synthz-acc', mtExit); accHooks.push(() => setTimeout(mtExit, 0));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) mtCheck(); });
}
/* ===== v2.4 · fondo espacial: brillos grandes, estrellas con destellos dorados, cintas de neón y burbujas de vidrio =====
   Vive dentro de .aurora (así «Fondo animado» en Ajustes lo apaga igual que antes). Cada página tiene su variante. */
const SPACE = (() => {
  const au = document.querySelector('.aurora'); if (!au) return null;
  const path = location.pathname;
  const kind = /chat(\.html)?$/.test(path) || document.getElementById('composer') ? 'chat'
    : /pulsem/.test(path) ? 'pulsem' : /alias/.test(path) ? 'alias' : 'home';
  /* x, y en vw/vh; c = color del tema; s = escala */
  const V = {
    home:   { glows:[{ x:100, y:0, c:'light' }, { x:0, y:100, c:'secondary' }, { x:58, y:42, c:'primary', s:.7 }], ribbon:'mid', bubbles:[{ x:4, y:62, d:110 }, { x:63, y:8, d:70 }, { x:92, y:46, d:52 }, { x:46, y:82, d:30 }] },
    chat:   { glows:[{ x:100, y:0, c:'primary' }, { x:0, y:100, c:'light', s:.8 }], ribbon:'low', dim:.55, density:.6, bubbles:[{ x:94, y:78, d:46 }] },
    alias:  { glows:[{ x:50, y:50, c:'primary', s:1.1 }, { x:0, y:100, c:'secondary' }, { x:100, y:0, c:'light' }], ribbon:'mid', dim:.8, bubbles:[{ x:22, y:22, d:60 }, { x:80, y:70, d:80 }] },
    pulsem: { glows:[{ x:100, y:0, c:'primary' }, { x:0, y:100, c:'light' }], ribbon:'none', dim:.45, density:.5, bubbles:[] }
  }[kind];

  const root = document.createElement('div');
  root.className = 'sb-root'; root.setAttribute('aria-hidden', 'true'); root.dataset.kind = kind;
  root.style.setProperty('--dim', V.dim || 1);
  const pos = o => '--x:' + o.x + ';--y:' + o.y + ';--s:' + (o.s || 1);
  /* cintas: 5 tiras paralelas que cruzan la pantalla como en el boceto (violeta, rosa, naranja, oro y una línea cian fina) */
  const RIB = [['primary', 0, 13], ['secondary', 14, 11], ['warm', 26, 9], ['spark', 36, 6], ['light', 44, 2.4]];
  const ribbon = y0 => RIB.map(([c, o, w], i) => {
    const y = y0 + o;
    const d = 'M-120 ' + (y + 120) + 'C220 ' + (y + 40) + ' 420 ' + (y + 190) + ' 760 ' + (y + 90) + 'S1240 ' + (y - 130) + ' 1600 ' + (y - 40);
    return '<path class="rb rb' + i + '" d="' + d + '" stroke="var(--sb-' + c + ')" stroke-width="' + w + '"/>';
  }).join('');
  const ribY = { mid:330, low:470 }[V.ribbon];
  root.innerHTML = '<div class="sb-base"></div>'
    + '<div class="sb-layer" style="--k:.35">' + V.glows.map((g, i) => '<div class="sb-pos" style="' + pos(g) + '"><div class="sb-glow" style="--c:var(--sb-' + g.c + ');animation-delay:' + (-i * 7) + 's"></div></div>').join('') + '</div>'
    + '<canvas class="sb-canvas"></canvas>'
    + (ribY ? '<div class="sb-layer sb-rib" style="--k:.7"><svg viewBox="0 0 1440 700" preserveAspectRatio="xMidYMid slice" fill="none" stroke-linecap="round"><g class="rb-glow">' + ribbon(ribY) + '</g><g class="rb-sharp">' + ribbon(ribY) + '</g></svg></div>' : '')
    + '<div class="sb-layer" style="--k:1.4">' + V.bubbles.map((b, i) => '<div class="sb-pos" style="' + pos(b) + '"><div class="sb-bubble" style="--d:' + b.d + 'px;animation-delay:' + (-i * 3) + 's"></div></div>').join('') + '</div>';
  au.appendChild(root);

  /* estrellas: puntitos que titilan y unos pocos destellos dorados que suben muy despacio */
  const cv = root.querySelector('.sb-canvas'), ctx = cv.getContext('2d');
  let w = 0, h = 0, S = [], raf = 0, sc = 0, still = reduce || PERF;
  const col = n => getComputedStyle(document.documentElement).getPropertyValue('--sb-' + n).trim() || '#fff';
  let pal = [], gold = '#ffc857';
  const paint = () => { pal = [col('text'), col('light')]; gold = col('spark'); S.forEach(s => { s.c = s.g ? gold : pal[s.k % pal.length]; }); };
  const init = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = cv.clientWidth || innerWidth; h = cv.clientHeight || innerHeight; cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* determinístico: siempre el mismo cielo para la misma pantalla */
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const n = Math.round(w * h / 9000 * (V.density || 1));
    S = Array.from({ length:n }, (_, k) => { const g = rnd() < .22; return { x:rnd() * w, y:rnd() * h, z:.25 + rnd() * .75, g, k, r:g ? .8 + rnd() * 1.2 : .3 + rnd() * 1.1, ph:rnd() * 6.28, sp:.4 + rnd() * 1.4 }; });
    paint();
  };
  const draw = t => {
    raf = 0; ctx.clearRect(0, 0, w, h);
    for (const s of S){
      const y = (((s.y - sc * s.z * .12 - (s.g ? t * .004 : 0)) % h) + h) % h;
      const tw = still ? .8 : .5 + .5 * Math.sin(t / 1000 * s.sp + s.ph);
      ctx.globalAlpha = (.2 + .8 * tw) * s.z;
      ctx.fillStyle = s.c;
      ctx.beginPath(); ctx.arc(s.x, y, s.r * s.z * 1.3, 0, 6.283); ctx.fill();
      if (s.g && tw > .92 && s.r > 1.4){ ctx.globalAlpha *= .5; ctx.fillRect(s.x - 4, y - .4, 8, .8); ctx.fillRect(s.x - .4, y - 4, .8, 8); }
    }
    if (!still && !document.hidden && CFG.bg) raf = requestAnimationFrame(draw);
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(draw); };
  init(); go();
  addEventListener('resize', () => { init(); go(); });
  addEventListener('scroll', () => { sc = scrollY; if (still) go(); }, { passive:true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) go(); });

  /* paralaje leve con el mouse y el scroll: un solo cuadro por evento, solo variables CSS */
  let pr = 0, mx = 0, my = 0;
  const push = () => { pr = 0; const max = Math.max(1, document.documentElement.scrollHeight - innerHeight); root.style.setProperty('--sy', scrollY); root.style.setProperty('--p', Math.min(1, scrollY / max).toFixed(3)); root.style.setProperty('--mx', mx.toFixed(2)); root.style.setProperty('--my', my.toFixed(2)); };
  const req = () => { if (!pr) pr = requestAnimationFrame(push); };
  addEventListener('scroll', req, { passive:true });
  if (!reduce && matchMedia('(pointer: fine)').matches) addEventListener('pointermove', e => { mx = (e.clientX / innerWidth - .5) * 14; my = (e.clientY / innerHeight - .5) * 2; req(); }, { passive:true });
  push();
  return { root, repaint:() => { paint(); go(); } };
})();
/* ===== v1.4 · eventos especiales: a las 50, 100 y 500 visitas la página «se hackea» y das un logro ===== */
const EV = (() => {
  const K = 'synthz:visits', A = 'synthz:ach';
  let visits = 0; try{ visits = +localStorage.getItem(K) || 0; if (!sessionStorage.getItem('synthz:vcount')){ visits++; localStorage.setItem(K, String(visits)); sessionStorage.setItem('synthz:vcount', '1'); } }catch(e){}
  const ach = () => { try{ return JSON.parse(localStorage.getItem(A)) || {}; }catch(e){ return {}; } };
  const force = (() => { try{ return new URLSearchParams(location.search).get('evento'); }catch(e){ return null; } })();
  const pending = () => { if (force && /^(50|100|500)$/.test(force)) return +force; const a = ach(); return [500, 100, 50].find(n => visits >= n && !a[n]) || 0; };
  const mark = n => { const a = ach(); a[n] = Date.now(); try{ localStorage.setItem(A, JSON.stringify(a)); }catch(e){} push(); };
  /* si tienes cuenta, el logro queda guardado en ella (así cuenta para los descuentos de 100 y 500) */
  const push = () => { const a = ach(); if (!SESS || !Object.keys(a).length) return; api('me', { method:'PUT', body:{ ach:a }, keep:true }).catch(() => {}); };
  addEventListener('synthz-acc', push);
  const CODE = ['import { flow } from "synthz/core"', 'const z = await vidrio.fundir("Z")', 'synthonia.despertar({ modo:"hack" })', 'for (const ia of IAs_conectadas) ia.sincronizar()', '[OK] compilando SynthFlow…', 'reconstruyendo vidrio líquido ████████░░', 'flow.calibrar(0.9998)', 'if (usuario.visitas > LIMITE) desbloquear(logro)', '[OK] núcleo de Flow estable', 'cargando la página otra vez…', 'z.render({ brillo:true })', 'SynthZ.reiniciar() // no te asustes 😉'];
  function overlay(kind){
    const o = document.createElement('div'); o.className = 'hackev k' + kind; o.setAttribute('aria-hidden', 'true');
    o.innerHTML = '<canvas></canvas><div class="hk-code"></div><div class="hk-bar"><i></i></div><div class="hk-t"></div>';
    document.body.appendChild(o); return o;
  }
  /* lluvia de código (verde o roja) o viaje por las estrellas (500) */
  function sky(o, kind){
    const c = $('canvas', o), x = c.getContext('2d'); let W, H, run = true;
    const fit = () => { W = c.width = innerWidth * (devicePixelRatio > 1 ? 1.5 : 1); H = c.height = innerHeight * (devicePixelRatio > 1 ? 1.5 : 1); c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px'; };
    fit();
    if (kind === 500){
      const S = Array.from({ length:420 }, () => ({ a:Math.random() * Math.PI * 2, r:Math.random() * 40, v:.6 + Math.random() * 3.4, h:Math.random() < .5 ? 42 : Math.random() < .5 ? 300 : 340 }));
      (function f(){ if (!run) return; x.fillStyle = 'rgba(6,4,14,.24)'; x.fillRect(0, 0, W, H); const cx = W / 2, cy = H / 2;
        S.forEach(s => { const r0 = s.r; s.r += s.v * (1 + s.r / 80); if (s.r > Math.hypot(W, H) / 1.6){ s.r = Math.random() * 20; s.a = Math.random() * Math.PI * 2; }
          x.strokeStyle = 'hsla(' + s.h + ',90%,72%,' + Math.min(1, s.r / 200) + ')'; x.lineWidth = 1 + s.r / 300; x.beginPath(); x.moveTo(cx + Math.cos(s.a) * r0, cy + Math.sin(s.a) * r0); x.lineTo(cx + Math.cos(s.a) * s.r, cy + Math.sin(s.a) * s.r); x.stroke(); });
        requestAnimationFrame(f); })();
    } else {
      const fs = 16, cols = Math.ceil(W / fs), drops = Array.from({ length:cols }, () => Math.random() * -40), col = kind === 100 ? '255,70,70' : '80,255,140';
      (function f(){ if (!run) return; x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(0, 0, W, H); x.font = fs + 'px monospace';
        drops.forEach((d, i) => { x.fillStyle = 'rgba(' + col + ',' + (.35 + Math.random() * .65) + ')'; x.fillText(String.fromCharCode(0x30A0 + Math.random() * 96 | 0), i * fs, d * fs); drops[i] = d * fs > H && Math.random() > .975 ? 0 : d + 1; });
        requestAnimationFrame(f); })();
    }
    return () => { run = false; };
  }
  async function typeCode(o, kind){
    const box = $('.hk-code', o), bar = $('.hk-bar i', o), lines = kind === 100 ? ['⚠ ALERTA: el núcleo de Flow se sobrecalentó', 'desviando energía a SynthonIA…', ...CODE.slice(2, 9), '[OK] temperatura normal'] : CODE;
    for (let i = 0; i < lines.length; i++){
      const ln = document.createElement('div'); box.appendChild(ln);
      for (const ch of lines[i]){ ln.textContent += ch; if (Math.random() < .5) await sleepRaw(6); }
      bar.style.transform = 'scaleX(' + ((i + 1) / lines.length).toFixed(3) + ')';
      await sleepRaw(90);
      if (box.children.length > 14) box.firstChild.remove();
    }
  }
  /* el «error»: la página se distorsiona un momento */
  async function glitch(ms, kind){
    root.classList.add('glitching'); if (kind === 100) root.classList.add('glitch-red');
    await sleepRaw(ms); root.classList.remove('glitching', 'glitch-red');
  }
  function botBig(on, mood){ const b = BOT.el; if (!b) return; b.classList.toggle('g2', on); b.classList.toggle('evfront', on); if (on){ BOT.sticky = null; botFace(mood || 'sorprendida', true); } else botFace('feliz', true); }
  async function play(n){
    mark(n);
    try{ sessionStorage.setItem('synthz:achShow', String(n)); }catch(e){}
    portalLock(true); botBig(true, 'sorprendida');
    await glitch(n === 500 ? 500 : 1100, n);
    const o = overlay(n); requestAnimationFrame(() => o.classList.add('on'));
    const stop = sky(o, n);
    if (n === 500){
      $('.hk-t', o).innerHTML = '<img src="media/z-glass.webp" alt=""><b>MODO GALAXIA</b><small>Viajaste 500 veces por SynthZ</small>';
      botFace('encantada', true); await sleepRaw(4200);
    } else {
      $('.hk-t', o).textContent = n === 100 ? 'SISTEMA SOBRECARGADO' : 'SYNTHZ SE ESTÁ REPROGRAMANDO';
      botFace(n === 100 ? 'preocupada' : 'pensando', true); await typeCode(o, n); await sleepRaw(400);
    }
    o.classList.add('out'); botFace('celebrando', true);
    await sleepRaw(700); stop(); o.remove(); portalLock(false); setTimeout(() => botBig(false), 2500);
  }
  /* el logro: entra deslizándose por arriba a la derecha */
  function badge(n){
    const t = { 50:['50', 'Has entrado más de 50 veces a la página.', ''], 100:['100', 'Has entrado más de 100 veces a la página.', 'Se te tendrá en cuenta para descuentos exclusivos cuando lleguen los pagos.'], 500:['500', 'Has entrado más de 500 veces. Eres leyenda de SynthZ.', 'Se te tendrá en cuenta para descuentos exclusivos cuando lleguen los pagos.'] }[n];
    const b = document.createElement('div'); b.className = 'achv a' + n; b.setAttribute('role', 'status');
    b.innerHTML = '<span class="ac-i">' + (n === 500 ? '<img src="media/z-glass.webp" alt="">' : '<b>' + t[0] + '</b>') + '</span><div><small>EVENTO ESPECIAL DESBLOQUEADO</small><h4>' + esc(t[1]) + '</h4><p>Este logro es 1 en un millón.</p>' + (t[2] ? '<p class="ac-d">' + esc(t[2]) + '</p>' : '') + '</div><button type="button" aria-label="Cerrar">×</button>';
    document.body.appendChild(b); requestAnimationFrame(() => requestAnimationFrame(() => b.classList.add('on')));
    try{ SND.done(); }catch(e){}
    const close = () => { b.classList.remove('on'); setTimeout(() => b.remove(), 700); };
    $('button', b).addEventListener('click', close); setTimeout(close, n === 50 ? 9000 : 14000);
  }
  /* de vez en cuando (muy raro) solo un «error» corto, sin logro */
  function maybeGlitch(){ if (Math.random() < 1 / 120 || force === 'glitch') setTimeout(() => { if (!document.querySelector('#vintro,#intro,#portal,.szm')) glitch(900); }, 6000 + Math.random() * 20000); }
  /* al llegar con un logro pendiente de mostrar */
  function onLoad(){
    let show = 0; try{ show = +sessionStorage.getItem('synthz:achShow') || 0; sessionStorage.removeItem('synthz:achShow'); }catch(e){}
    if (show) setTimeout(() => badge(show), 1600);
    else if (isFlow() && pending()) setTimeout(async () => { if (document.querySelector('.szm,#portal') || root.classList.contains('guiding')) return; const n = pending(); await play(n); badge(n); try{ sessionStorage.removeItem('synthz:achShow'); }catch(e){} }, 3500);
    maybeGlitch();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onLoad); else setTimeout(onLoad, 50);
  return { pending, play, badge, get visits(){ return visits; } };
})();
window.SZ = { root, $, $$, clamp, fmt, reduce, today, sleepRaw, esc, est, Z_PATH, ICONS, ico, zWord, API, MANUAL, ALL, byId,
  get state(){ return state; }, set state(v){ state = v; normalize(); },
  normalize, cleanUsage, cleanChats, cleanStrMap, save, total, addUsage, resetUsage, estAll, todayEst, todayReq, providerBalance, balanceHtml, splitHtml, syncNote, helpGuide, smoothDetails, szPrompt, swapDir, swapDir, face, FACE_GOOD, randomGoodFace, welcomeBack, wasAway, accSignOutAll, accClaim, ROLE_NAME, trialGet, trialSet, trialStart, legacyRow, cleanLedger, mergeLedger, DEV, hooks, toast, hydrateIcons, md, countTo,
  BRAND, isFlow, flowWord, zMark, charify, typeIn, showAll, getJSON, parseModels, loadCatalog, fetchCatalog, vendorLabel, vendorColor, burst, friendly, netMsg, fetchModels, refreshModels, verify, ask, metaOf, history, S, mirrorType, thud, portalOut, portalBack, portalArrive, portalFill, portalReveal, waterIn, ctxMenu, SXC, coins, ACC, accHooks, accStart, accPush, accSignOut, accName, accHandle, securityModal, recoveryPanel, MARK_HTML, expertOf, EXP_LABEL, surveyModal, surveyPicks, surveyScore, orGuide, profileModal, puterLogo, PUTER_LOGO, api, accConfig, accDelete, saveProfile, avatarHtml, myAvatar, grad, tint, TINTS, loadGsi, SESS_get:() => SESS, CFG, PERF, saveCfg, cfgModal, cfgChooser, applyCfg, smoothWheel, orbitBg, authBox, isBlocked, lowEnd, askStream, mkReveal, reveals, chatsReady, IDB, provOf, totalAll, todayAll, BRANDS, brandOf, glassIcon, PIXART, pixelRun, pixelGrid, workView, workSaved, mdLoad, MDLIB, SZ_P, SZQ, SZ_AUTO, szqSet, msgsLeft, msgsTotal, coinsOf, coinsLeft, coinsTotal, coinsFmt, coinsShort, coinNote, limTxt, limShort, limLvl, limPct, limRing, limBar, szCatalog, szHeaders, guestGate, guestFull, isGuestQ, setTurn, puterOut, puterOutNote, TEL, telEv, telBeat, DEVH, szConfirm, cfgPreset, CFG_KEYS, cfgClasses, SND, HAND, feedbackModal, guideChooser, DRIVE, isBad, markBad, markGood, modelGone, badReady, GROQ_P, BOT:BOTAPI, EV, lipSync, ballFace, guideAsk, GTOPICS, whatsNew, signedish, cfgLinks, memAddCore, memPanel, menuOpen, menuClose, MICO, appInstall, appPromo, appStandalone, appPhone };
})();
