/* ---------- detener la respuesta (botón o Esc) ---------- */
const ctls = new Set();
function stopNow(){ let did = false; if (ctls.size){ ctls.forEach(c => c.abort()); ctls.clear(); did = true; } if (SZ.reveals.size){ SZ.reveals.forEach(r => r.skip()); did = true; } if (did) toast('Respuesta detenida.'); return did; }
addEventListener('keydown', e => { if (e.key === 'Escape' && !document.querySelector('.szm,#blk,#acc,#sx,#conn,#tour') && stopNow()) e.preventDefault(); });

/* borrar el chat actual (antes era el botón «Limpiar»; ahora vive en el menú «⋯») */
async function clearChat(ask){
  if (mode === 'cmp'){ stopNow(); cmpRun++; cmpLast = null; Object.keys(busy).forEach(k => delete busy[k]); renderMsgs(); renderNow(); return; }
  if (!chatArr().length) return;
  if (ask && !(await SZ.szConfirm('¿Borrar este chat?', 'Se borran sus mensajes de este dispositivo y de tu cuenta. No se puede deshacer.', 'Borrar', true))) return;
  gen++; Object.keys(busy).forEach(k => delete busy[k]);
  st().chats[ckey()] = []; save(); renderMsgs(); renderNow(); renderChats();
}
/* ---------- favoritos: la estrella vuela dorada hasta tu colección ---------- */
function toggleStar(el, btn){
  const chat = st().chats[el._ck], m = chat && chat[el._ci];
  if (!m || m.role !== 'assistant' || m.content !== el._raw){ toast('Esta respuesta cambió; vuelve a intentarlo.'); return; }
  m.star = !m.star || undefined; save();
  btn.setAttribute('aria-pressed', String(!!m.star)); $('span', btn).textContent = m.star ? 'Favorita' : 'Guardar';
  el.classList.toggle('starred', !!m.star);
  if (m.star){ flyStar(btn); toast('Guardada en tus favoritos ★'); } else toast('Quitada de tus favoritos.');
  if (cView === 'favs') renderChats();
}
function flyStar(from){
  const t = isMobile() ? $('#tabbar [data-tab="chats"]') : $('#railFav');
  const ping = () => { if (!t) return; t.classList.remove('got'); void t.offsetWidth; t.classList.add('got'); };
  if (!t || root.classList.contains('noanim') || SZ.reduce){ ping(); return; }
  const a = from.getBoundingClientRect(), b = t.getBoundingClientRect();
  const x0 = a.left + 16, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
  const cx = (x0 + x1) / 2 + (x1 < x0 ? 40 : -40), cy = Math.min(y0, y1) - Math.min(220, Math.abs(x1 - x0) * .4 + 80);
  const s = document.createElement('div'); s.className = 'flystar'; s.innerHTML = STAR; document.body.appendChild(s);
  const D = 950, t0 = performance.now(); let f = 0;
  const step = now => {
    const k = Math.min(1, (now - t0) / D), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, u = 1 - e;
    const x = u * u * x0 + 2 * u * e * cx + e * e * x1, y = u * u * y0 + 2 * u * e * cy + e * e * y1;
    s.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + (1 + Math.sin(e * Math.PI) * .9) + ') rotate(' + (e * 400) + 'deg)';
    if (++f % 2 === 0){ const d = document.createElement('i'); d.className = 'flytrail'; d.style.transform = 'translate(' + x + 'px,' + y + 'px)'; document.body.appendChild(d); d.animate([{ opacity:.9, transform:'translate(' + x + 'px,' + y + 'px) scale(1)' }, { opacity:0, transform:'translate(' + (x + (Math.random() * 10 - 5)) + 'px,' + (y + 8) + 'px) scale(.2)' }], { duration:620, easing:'ease-out' }).onfinish = () => d.remove(); }
    if (k < 1) requestAnimationFrame(step); else { s.remove(); ping(); burst(x1, y1, ['#e6b65f', '#ffe2a8', '#c9566c'], 10); }
  };
  requestAnimationFrame(step);
}

/* ---------- archivos: imágenes, PDF y texto/código ---------- */
const files = []; let fid = 0;
const TEXTX = /\.(txt|md|markdown|csv|tsv|json|jsonl|xml|html?|css|scss|js|mjs|jsx|ts|tsx|py|java|c|h|cpp|hpp|cs|go|rs|rb|php|sh|bat|sql|yml|yaml|toml|ini|log|tex|swift|kt|r|lua|vue|svelte)$/i;
const CAP = 40000, clip = t => t.length > CAP ? t.slice(0, CAP) + '\n…(archivo recortado)' : t;
function readImg(file){
  return new Promise((ok, no) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const mk = max => { const s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * s)); c.height = Math.max(1, Math.round(im.height * s)); const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); return c; };
      const r = { dataUrl: mk(1568).toDataURL('image/jpeg', .85), thumb: mk(96).toDataURL('image/jpeg', .7) };
      URL.revokeObjectURL(url); ok(r);
    };
    im.onerror = () => { URL.revokeObjectURL(url); no(new Error('No pude leer la imagen ' + file.name + '.')); };
    im.src = url;
  });
}
let pdfP;
function loadPdf(){
  return pdfP || (pdfP = (async () => {
    const B = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
    await new Promise((ok, no) => { const s = document.createElement('script'); s.src = B + 'pdf.min.js'; s.onload = ok; s.onerror = () => no(new Error('No pude cargar el lector de PDF. Revisa tu internet.')); document.head.appendChild(s); });
    const w = await (await fetch(B + 'pdf.worker.min.js')).text();
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([w], { type:'text/javascript' }));
    return window.pdfjsLib;
  })().catch(e => { pdfP = null; throw e; }));
}
async function readPdf(file){
  const lib = await loadPdf(), pdf = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  let t = '';
  for (let i = 1; i <= Math.min(pdf.numPages, 60) && t.length < CAP; i++){
    const tc = await (await pdf.getPage(i)).getTextContent();
    t += '\n--- página ' + i + ' ---\n' + tc.items.map(x => x.str).join(' ');
  }
  if (t.replace(/--- página \d+ ---/g, '').trim().length < 20) throw new Error('Ese PDF parece escaneado (sin texto). Prueba subiéndolo como imagen.');
  return clip(t.trim());
}
function renderTray(){
  $('#tray').innerHTML = files.map(f => '<span class="fc ' + f.state + '" data-id="' + f.id + '">' + (f.thumb ? '<img src="' + esc(f.thumb) + '" alt="">' : '<i class="ic">' + esc((f.name.split('.').pop() || 'file').slice(0, 4)) + '</i>') + '<b>' + esc(f.name) + '</b><button class="x" type="button" aria-label="Quitar archivo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></span>').join('');
}
async function addFiles(list){
  if (mode === 'cmp'){ toast('Los archivos funcionan en el modo Individual.'); return; }
  for (const file of [...list]){
    if (files.length >= 6){ toast('Máximo 6 archivos por mensaje.'); break; }
    const f = { id:++fid, name:file.name || 'archivo', state:'load', kind:'text' }; files.push(f); renderTray();
    try{
      if (/^image\//.test(file.type)){ f.kind = 'img'; Object.assign(f, await readImg(file)); }
      else if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf'){ f.kind = 'pdf'; f.text = await readPdf(file); }
      else if (TEXTX.test(file.name) || /^text\//.test(file.type) || file.type === 'application/json'){ f.text = clip(await file.text()); }
      else throw new Error('Tipo de archivo no compatible: ' + f.name);
      f.state = 'ok';
    }catch(e){
      f.state = 'err'; toast(f.kind === 'pdf' && !/compatible/.test(e.message || '') ? 'No pude leer el PDF «' + f.name + '». Puede estar dañado o protegido con contraseña.' : f.kind === 'img' && !/compatible/.test(e.message || '') ? 'No pude abrir la imagen «' + f.name + '».' : e.message);
      setTimeout(() => { const i = files.indexOf(f); if (i > -1){ files.splice(i, 1); renderTray(); } }, 2200);
    }
    renderTray();
  }
}
$('#tray').addEventListener('click', e => { const x = e.target.closest('.x'); if (!x) return; const i = files.findIndex(f => f.id === +x.closest('.fc').dataset.id); if (i > -1){ files.splice(i, 1); renderTray(); } });
/* el clip ya no abre el buscador de golpe: muestra un menú con lo que puedes adjuntar */
const attMenu = $('#attMenu'), attBtn = $('#attachBtn');
function attOpen(){ attMenu.hidden = false; attMenu.classList.remove('bye'); attBtn.setAttribute('aria-expanded', 'true'); }
function attClose(){ if (attMenu.hidden) return; attBtn.setAttribute('aria-expanded', 'false'); attMenu.classList.add('bye'); setTimeout(() => { if (attMenu.classList.contains('bye')){ attMenu.hidden = true; attMenu.classList.remove('bye'); } }, 260); }
attBtn.addEventListener('click', () => { if (mode === 'cmp'){ toast('Los archivos funcionan con una sola IA. Quita las demás para adjuntar.'); return; } if (attMenu.hidden) attOpen(); else attClose(); });
attMenu.addEventListener('click', e => { const b = e.target.closest('[data-att]'); if (!b) return; attClose(); const k = b.dataset.att; if (k === 'mkimg') return setImgMode(!imgMode); if (k === 'web'){ if (imgMode) setImgMode(false); return setWeb(!webOn); } $({ file:'#fileIn', img:'#imgIn', cam:'#camIn' }[k]).click(); });
document.addEventListener('pointerdown', e => { if (!attMenu.hidden && !e.target.closest('.attw')) attClose(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !attMenu.hidden){ e.preventDefault(); attClose(); attBtn.focus(); } });
['#fileIn', '#imgIn', '#camIn'].forEach(s => $(s).addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; }));
let dragN = 0; const hasF = e => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
addEventListener('dragenter', e => { if (hasF(e)){ dragN++; document.body.classList.add('drag'); } });
addEventListener('dragleave', () => { dragN = Math.max(0, dragN - 1); if (!dragN) document.body.classList.remove('drag'); });
addEventListener('dragover', e => { if (hasF(e)) e.preventDefault(); });
addEventListener('drop', e => { dragN = 0; document.body.classList.remove('drag'); if (hasF(e)){ e.preventDefault(); addFiles(e.dataTransfer.files); } });
inp.addEventListener('paste', e => { const fl = [...((e.clipboardData && e.clipboardData.files) || [])]; if (fl.length){ e.preventDefault(); addFiles(fl); } });
SZ.mirrorType(inp);
/* mensajes que viajan a la IA. Para ahorrar SynXCoin's: los archivos solo se reenvían
   completos en el último mensaje que los trajo, y el modo ahorro manda menos historial */
function apiMsgs(chat, vision, o = {}){
  const saver = !o.naive && st().sx.saver, keepN = saver ? 6 : 20;
  let lastF = -1;
  if (!o.naive) for (let i = chat.length - 1; i >= 0; i--) if (chat[i].role === 'user' && chat[i].files && chat[i].files.length){ lastF = i; break; }
  const start = Math.max(0, chat.length - keepN);
  const h = chat.slice(start).map((m, j) => {
    if (m.imgId) return null;
    if (m.role !== 'user' || !m.files || !m.files.length) return { role:m.role, content:(m.role === 'user' && m.ask) || m.content };
    const full = o.naive || start + j === lastF;
    let t = m.ask || m.content || '';
    m.files.forEach(f => {
      if (f.text) t += full ? '\n\n[Archivo adjunto: ' + f.name + ']\n```\n' + (saver && f.text.length > 12000 ? f.text.slice(0, 12000) + '\n…(recortado por el modo ahorro)' : f.text) + '\n```' : '\n\n[Archivo adjunto antes: ' + f.name + ' (no se reenvía para ahorrar SynXCoin\'s)]';
      else if (f.kind === 'img' && !(vision && m._imgs && full)) t += '\n\n[Imagen adjunta: ' + f.name + (full ? ' (ya no está disponible)' : ' (no se reenvía)') + ']';
    });
    const imgs = vision && m._imgs && full ? m._imgs : [];
    t = t.trim() || 'Mira la imagen.';
    return imgs.length ? { role:m.role, content:[{ type:'text', text:t }, ...imgs.map(u => ({ type:'image_url', image_url:{ url:u } }))] } : { role:m.role, content:t };
  }).filter(Boolean);
  while (h.length && h[0].role !== 'user') h.shift();
  const sys = [];
  if (saver) sys.push('Responde en el idioma del usuario, de forma clara y breve, sin relleno.');
  { const ef = effortHint(); if (ef && !o.naive) sys.push(ef); }   /* v2.3.1 · esfuerzo */
  { const mm = memSystem(); if (mm && !o.naive) sys.push(mm); }
  if (SZ.CFG.beginner) sys.push('Modo principiante: la persona no sabe nada del tema. Usa palabras sencillas y frases cortas, explica paso a paso, evita los tecnicismos (si usas uno, explícalo) y pon un ejemplo de la vida diaria.');
  if (sys.length) h.unshift({ role:'system', content:sys.join(' ') });
  return h;
}
function msgCost(msgs){ return msgs.reduce((n, m) => n + 4 + (typeof m.content === 'string' ? est(m.content) : m.content.reduce((k, x) => k + (x.type === 'text' ? est(x.text) : 800), 0)), 0); }
/* caché: la misma pregunta al mismo modelo no se vuelve a pagar */
const CACHE_KEY = 'synthz:cache';
function hashStr(s){ let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + s.length.toString(36); }
function cacheAll(){ try{ return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; }catch(e){ return {}; } }
function cacheGet(k){ const c = cacheAll()[k]; return c && Date.now() - c.t < 7 * 864e5 ? c : null; }
function cachePut(k, r){
  const c = cacheAll(); c[k] = { t:Date.now(), text:r.text, prompt:r.prompt, completion:r.completion, model:r.model };
  const ks = Object.keys(c).sort((a, b) => c[b].t - c[a].t); ks.slice(60).forEach(x => delete c[x]);
  try{ localStorage.setItem(CACHE_KEY, JSON.stringify(c)); }catch(e){}
}
