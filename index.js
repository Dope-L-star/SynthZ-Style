(() => {
'use strict';
const { root, $, $$, clamp, fmt, reduce, today, sleepRaw, esc, est, Z_PATH, ico, zWord, API, MANUAL, ALL, byId, save, total, addUsage, toast, hydrateIcons, countTo, charify, typeIn, showAll, S, coins } = SZ;
const st = () => SZ.state;
root.classList.add('js', 'lock');

/* ---------- piezas fijas ---------- */
$('#navWord').innerHTML = zWord('Synth');
$('#zClipPath').setAttribute('d', Z_PATH); $('#zOutline').setAttribute('d', Z_PATH);
$('#corner').innerHTML = '<svg viewBox="0 0 24 24">' + SZ.ICONS.claude('#d9805f', '#d9805f') + '</svg>';
$('#chips').innerHTML = ALL.filter(p => p.id === 'synthz' || p.id === 'puter').map((p, i) => '<span class="chip" style="--i:' + i + '">' + ico(p) + p.name + '</span>').join('');
$('#track').innerHTML = Array(4).fill('<div class="set">' + [['ChatGPT', 'openai'], ['Gemini', 'google'], ['Claude', 'anthropic'], ['Llama', 'meta-llama'], ['Mistral', 'mistralai'], ['DeepSeek', 'deepseek'], ['Qwen', 'qwen'], ['Grok', 'x-ai'], ['Kimi', 'moonshotai'], ['Gemma', 'gemma'], ['Puter', 'puter']].map(([n, v]) => '<span class="bi">' + SZ.glassIcon({ id:v, vendor:v === 'gemma' ? 'google' : v, name:n }, 'xs') + n + '</span>').join('') + '</div>').join('');
hydrateIcons();

/* ---------- escritura al entrar en pantalla ---------- */
const typeIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(async en => {
  if (!en.isIntersecting) return;
  const el = en.target; typeIO.unobserve(el);
  const after = el.dataset.after && $(el.dataset.after);
  if (after && after._typing) await after._typing;
  typeIn(el, { cps: +el.dataset.cps || 90, max: 3 });
}), { threshold:.4 }) : null;
function armType(el){
  if (!el || el._armed) return; el._armed = true; charify(el);
  if (typeIO) typeIO.observe(el); else showAll(el);
}
const armTypes = scope => $$('[data-type]', scope || document).forEach(armType);

/* ---------- aparición de bloques ---------- */
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => {
  if (!en.isIntersecting) return;
  const el = en.target; el.classList.add('in'); io.unobserve(el);
  if (el.id === 'howMeasure'){ const f = $('#howFace'); if (f) f.innerHTML = SZ.face('senalando', 64); }
}), { threshold:.15, rootMargin:'0px 0px -6% 0px' }) : null;
function observeAll(){
  $$('[data-stagger]').forEach(c => [...c.children].forEach((ch, i) => { ch.setAttribute('data-reveal', ''); ch.style.setProperty('--d', (i * .1) + 's'); }));
  $$('[data-reveal]').forEach(el => { if (el.classList.contains('in')) return; if (io) io.observe(el); else el.classList.add('in'); });
}

/* ---------- tarjetas de conexión ---------- */
const eyeSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
function setStatus(card, text, cls){ const s = $('[data-st]', card); s.textContent = text; s.className = 'status ' + (cls || ''); }
function szCard(){
  const q = SZ.SZQ, on = q.on !== false, left = Math.max(0, (q.limit || 20000) - (q.used || 0));
  return '<article class="card" data-id="synthz" style="--c:#e6b65f"><div class="card-top">' + ico(byId('synthz')) + '<h3>IAs conectadas</h3><span class="status ' + (on ? 'ok' : '') + '" data-st>' + (on ? 'Listas' : 'Descansando') + '</span></div><p class="desc">Las IAs conectadas son IAs gratis que ya vienen listas en SynthZ. No tienes que configurar nada ni dar tarjeta: solo escribes. Sin cuenta pruebas con 5 mensajes al día; con tu cuenta gratis, mucho más. Si una está llena, pasa sola a otra.</p>'
    + SZ.limBar({ small:false }) + '<div class="actions"><button class="btn sm" data-szgo type="button">Abrir SynthFlow</button></div></article>';
}
function paintSzCard(){ const c = $('#cards [data-id="synthz"]'); if (!c) return; c.outerHTML = szCard(); const b = $('#cards [data-szgo]'); if (b) b.addEventListener('click', () => { launchAI = 'synthz'; openChat(); }); }
addEventListener('synthz-szq', () => { paintSzCard(); updateTotals(); renderLaunch(); try{ renderUsage(); }catch(e){} });
function renderCards(){
  const wrap = $('#cards');
  wrap.innerHTML = szCard() + API.filter(p => false).map(p => `   /* v1.3: ya no se muestran cajas de llaves (OpenRouter, Groq…) */
    <article class="card" data-id="${p.id}" style="--c:${p.c}">
      <div class="card-top">${ico(p)}<h3 data-type data-cps="20">${p.name}</h3><span class="status" data-st>Sin llave</span></div>
      <p class="desc" data-type data-cps="130">${p.desc}</p>
      <label class="field"><input type="text" data-sec="1" data-key placeholder="Pega tu llave aquí" autocomplete="off" data-lpignore="true" data-1p-ignore data-form-type="other" spellcheck="false"><button type="button" class="eye" data-eye aria-label="Mostrar u ocultar llave">${eyeSvg}</button></label>
      <div class="actions">
        <button class="btn sm" data-verify>Verificar</button>
        <button class="btn sm ghost" data-refresh>Actualizar la lista de IA</button>
        <a class="lnk" href="${p.keyUrl}" target="_blank" rel="noopener noreferrer">Conseguir llave gratis</a>
      </div>
    </article>`).join('');
  const szb = $('[data-szgo]', wrap); if (szb) szb.addEventListener('click', () => { launchAI = 'synthz'; openChat(); });
  $$('.card', wrap).forEach(card => {
    if (card.dataset.id === 'synthz') return;
    const p = byId(card.dataset.id), inp = $('[data-key]', card);
    inp.value = st().keys[p.id] || '';
    setStatus(card, st().keys[p.id] ? 'Guardada' : 'Sin llave');
    inp.addEventListener('input', () => {
      const v = inp.value.trim();
      if (v) st().keys[p.id] = v; else delete st().keys[p.id];
      save(); setStatus(card, v ? 'Guardada' : 'Sin llave'); renderLaunch(); updateTotals();
    });
    $('[data-eye]', card).addEventListener('click', () => { inp.type = inp.type === 'password' ? 'text' : 'password'; });
    $('[data-verify]', card).addEventListener('click', async e => {
      const b = e.currentTarget; b.disabled = true; setStatus(card, 'Verificando…');
      try{ const n = await SZ.verify(p); setStatus(card, 'Lista, ' + n + ' modelos', 'ok'); toast(p.name + ' conectada.'); try{ const r = $('[data-verify]', card).getBoundingClientRect(); SZ.burst && SZ.burst(r.left + r.width/2, r.top + r.height/2, ['#8fb0ff','#c9566c','#ff8f7a','#7ee0b5'], 22); }catch(_){} setTimeout(() => { if (!leaving) openChat(); }, 1100); }
      catch(err){ setStatus(card, 'Error', 'bad'); toast(err.message); }
      b.disabled = false;
    });
    $('[data-refresh]', card).addEventListener('click', async e => {
      const b = e.currentTarget; b.disabled = true;
      try{ const n = await SZ.refreshModels(p); setStatus(card, 'Lista, ' + n + ' modelos', 'ok'); toast('Modelos de ' + p.name + ' actualizados.'); }
      catch(err){ toast(err.message); }
      b.disabled = false;
    });
  });

  const ext = $('#ext');
  ext.innerHTML = MANUAL.map(p => `
    <article class="card" data-id="${p.id}" style="--c:${p.c}">
      <div class="card-top">${ico(p)}<h3 data-type data-cps="20">${p.name}</h3><span class="status">Registro manual</span></div>
      <p class="desc" data-type data-cps="130">${p.desc}</p>
      <label class="field"><textarea rows="2" data-log placeholder="Pega un texto o escribe un número de mensajes"></textarea></label>
      <div class="actions">
        <button class="btn sm" data-add>Sumar al consumo</button>
        <a class="lnk" href="${p.site}" target="_blank" rel="noopener noreferrer">Abrir ${p.siteName}</a>
        ${p.id === 'chatgpt' ? '<button class="btn sm ghost" data-oss>Probar gpt-oss en SynthFlow</button>' : ''}
      </div>
    </article>`).join('');
  $$('.card', ext).forEach(card => {
    const p = byId(card.dataset.id), ta = $('[data-log]', card);
    $('[data-add]', card).addEventListener('click', () => {
      const v = ta.value.trim(); if (!v){ toast('Escribe un texto o un número de mensajes.'); return; }
      const n = /^\d[\d.,\s]*$/.test(v) ? parseInt(v.replace(/\D/g, ''), 10) : est(v);
      addUsage(p.id, n, 0, false); ta.value = ''; toast('Sumé ' + coins(n) + ' a ' + p.name + '.');
    });
    const oss = $('[data-oss]', card);
    if (oss) oss.addEventListener('click', () => {
      const l = st().models.openrouter || (st().models.openrouter = API[0].models.slice());
      const free = l.find(m => /gpt-oss/.test(m)) || 'openai/gpt-oss-20b:free';
      if (!l.includes(free)) l.push(free);
      st().model.openrouter = free; save(); launchAI = 'openrouter'; renderLaunch(); openChat();
    });
  });
  $$('.card').forEach(card => card.addEventListener('pointermove', e => {
    const b = card.getBoundingClientRect();
    card.style.setProperty('--px', ((e.clientX - b.left) / b.width * 100) + '%'); card.style.setProperty('--py', ((e.clientY - b.top) / b.height * 100) + '%');
  }));
  armTypes(wrap); armTypes(ext);
}

/* ---------- lanzador: abre el chat en otra página con una expansión suave ---------- */
let launchAI = 'synthz', leaving = false;
function placePill(seg){
  const a = $('[aria-selected="true"]', seg), pill = $('.pill', seg);
  if (!a || !pill) return;
  pill.style.width = a.offsetWidth + 'px'; pill.style.transform = 'translateX(' + a.offsetLeft + 'px)';
}
function renderLaunch(){
  const seg = $('#launchSeg');
  $$('button', seg).forEach(b => b.remove());
  const items = [{ id:'synthz', label:'Gratis', p:byId('synthz') }];
  items.forEach(it => {
    const b = document.createElement('button');
    b.setAttribute('role', 'tab'); b.dataset.id = it.id;
    b.setAttribute('aria-selected', String(it.id === launchAI));
    if (it.p && st().keys[it.id]) b.classList.add('has');
    b.innerHTML = (it.p ? ico(it.p) : '') + it.label;
    b.addEventListener('click', () => { launchAI = it.id; renderLaunch(); });
    seg.appendChild(b);
  });
  placePill(seg);
  const p = byId(launchAI), hint = $('#launchHint');
  if (launchAI === 'cmp'){
    const n = API.filter(x => st().keys[x.id]).length;
    hint.textContent = n ? 'Tu pregunta le llega a ' + n + (n === 1 ? ' IA conectada.' : ' IAs conectadas.') : 'Aún no hay IAs conectadas.';
  } else hint.textContent = SZ.SZQ.on !== false ? 'Lista para chatear, gratis.' : (window.puter && puter.auth && puter.auth.isSignedIn()) ? 'Lista: puedes chatear con tu cuenta de Puter.' : 'Las IAs gratis están descansando un rato. Conecta Puter para seguir ya.';
  $('#launch').style.setProperty('--lc', p ? p.c + '2e' : 'rgba(184,196,255,.2)');
}
function expandTo(card, href, color){ return SZ.portalOut(href); }
function expandToOld(card, href, color){
  const r = card.getBoundingClientRect(), ov = document.createElement('div');
  ov.className = 'expand'; ov.style.setProperty('--lc', color + '55');
  ov.style.left = r.left + 'px'; ov.style.top = r.top + 'px'; ov.style.width = r.width + 'px'; ov.style.height = r.height + 'px'; ov.style.borderRadius = '30px';
  document.body.appendChild(ov); root.classList.add('leaving');
  let done = false; const go = () => { if (done) return; done = true; location.href = href; };
  const a = ov.animate([
    { left:r.left + 'px', top:r.top + 'px', width:r.width + 'px', height:r.height + 'px', borderRadius:'30px' },
    { left:'0px', top:'0px', width:innerWidth + 'px', height:innerHeight + 'px', borderRadius:'0px' }
  ], { duration:950, easing:'cubic-bezier(.77,0,.18,1)', fill:'forwards' });
  a.onfinish = () => setTimeout(go, 60);
  setTimeout(go, 1500);
}
function openChat(){
  if (leaving) return; leaving = true;
  const q = $('#launchInp').value.trim(), params = new URLSearchParams({ from:'home' });
  if (launchAI === 'cmp') params.set('mode', 'cmp'); else params.set('ai', launchAI);
  if (q) params.set('q', q);
  try{ if (q) sessionStorage.setItem('synthz:q', JSON.stringify({ q, t:Date.now() })); }catch(e){}
  const p = byId(launchAI);
  expandTo($('#launch'), 'chat.html?' + params.toString(), p ? p.c : '#b8c4ff');
}
$('#launchGo').addEventListener('click', openChat);

/* pasos que se animan con el scroll */
const hows = $$('.how-card');
function howScroll(){
  const vh = innerHeight;
  hows.forEach(c => {
    const r = c.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (vh * .98 - r.top) / (vh * .3)));
    const q = Math.min(1, Math.max(0, (vh * .85 - r.top) / (vh * .6)));
    c.style.setProperty('--p', p.toFixed(3)); c.style.setProperty('--q', q.toFixed(3));
    if (c.id === 'howMeasure'){ const f = $('#howFace'); if (f && !f.firstChild) f.innerHTML = SZ.face('senalando', 64); }
  });
}
let hsQ = 0; const howQ = () => { if (!hsQ) hsQ = requestAnimationFrame(() => { hsQ = 0; howScroll(); }); };
addEventListener('scroll', howQ, { passive:true }); addEventListener('resize', howQ); howScroll();
const sprog = document.createElement('i'); sprog.id = 'sprog'; document.body.appendChild(sprog);
let spQ = 0; addEventListener('scroll', () => { if (spQ) return; spQ = requestAnimationFrame(() => { spQ = 0; const h = document.documentElement.scrollHeight - innerHeight; sprog.style.transform = 'scaleX(' + (h > 0 ? scrollY / h : 0).toFixed(4) + ')'; }); }, { passive:true });
const go = id => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior:'smooth' }); };
SZ.ctxMenu(() => [
  { label:'Abrir SynthFlow', ico:'open', fn:() => openChat() },
  { label:'Ver mi consumo', ico:'chart', fn:() => go('consumo') },
  { label:'Volver arriba', ico:'up', fn:() => scrollTo({ top:0, behavior:'smooth' }) }, '—',
  { label:'Ajustes', ico:'cog', fn:() => SZ.cfgModal() },
  { label:'Guía rápida', ico:'help', fn:() => openHelp() }]);
document.addEventListener('click', e => { const u = e.target.closest && e.target.closest('a[data-draft]'); if (!u || e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); SZ.portalOut(u.getAttribute('href')); });
document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href="chat.html"]'); if (!a || e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); openChat(); });
$('#launchInp').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing){ e.preventDefault(); openChat(); } });
/* al volver con "atrás" se recarga para mostrar los datos al día */
addEventListener('pageshow', e => {
  if (e.persisted){ location.reload(); return; }
  leaving = false; root.classList.remove('leaving'); $$('.expand,#portal').forEach(x => x.remove()); SZ.S.busy(false); const lg = $('#nav .logo'); if (lg) lg.style.visibility = '';
});

/* ---------- consumo ---------- */
function updateTotals(){
  const on = SZ.SZQ.on !== false;
  $('#limRing').innerHTML = SZ.limRing(18); $('#navTotal').innerHTML = '<span class="nt-l">' + SZ.limShort() + '</span>';
  $('#limPill').className = 'pill-total lim ' + SZ.limLvl();
  $('#heroConn').textContent = on ? 'Listo para chatear' : 'Las IAs están descansando';
  $('#heroTotal').textContent = on ? SZ.limTxt().toLowerCase() : 'vuelve en un momento';
}
function renderUsage(){
  const U = st().usage || {}, d = today();
  $('#bigRing').innerHTML = SZ.limRing(76); $('#bigTotal').textContent = SZ.limShort();
  $('#useSplit').innerHTML = SZ.limBar({ title:'IAs conectadas', puter:true }); $('#useSync').innerHTML = SZ.syncNote();
  if (!renderUsage._b || Date.now() - renderUsage._b > 60000){ renderUsage._b = Date.now(); SZ.providerBalance().then(b => { $('#useBal').innerHTML = SZ.balanceHtml(b); }); }
  const req = id => ((U[id] || {}).reqDays || {});
  const SRC = [['synthz', 'IAs conectadas', '#e6b65f'], ['puter', 'Puter', '#6fd3d6']];
  const tot = id => (U[id] || {}).requests || 0, max = Math.max(1, ...SRC.map(([id]) => tot(id)));
  $('#rows').innerHTML = SRC.map(([id, n, c], i) => '<div style="--c:' + c + '"><div class="row-h">' + SZ.glassIcon({ id, vendor:id }, 'sm') + '<b>' + n + '</b><small>' + fmt(req(id)[d] || 0) + ' hoy</small><em>' + fmt(tot(id)) + '</em></div><div class="bar"><i style="--i:' + i + ';--w:' + (tot(id) / max).toFixed(4) + '"></i></div></div>').join('') + '<p class="cnote" style="margin-top:6px">Mensajes en total desde que usas SynthZ.</p>';
  const chart = $('#chart');
  if (!chart.children.length) chart.innerHTML = Array.from({ length:14 }, (_, i) => '<div class="col"><div class="tr"><div class="stack" style="--i:' + i + '"></div></div><span></span></div>').join('');
  const days = [];
  for (let k = 13; k >= 0; k--){ const dt = new Date(); dt.setDate(dt.getDate() - k); days.push(dt.toLocaleDateString('en-CA')); }
  const per = days.map(day => SRC.map(([id, , c]) => ({ c, v:req(id)[day] || 0 })));
  const dmax = Math.max(1, ...per.map(a => a.reduce((s2, x) => s2 + x.v, 0)));
  per.forEach((arr, i) => {
    const col = chart.children[i], sum = arr.reduce((s2, x) => s2 + x.v, 0), st2 = $('.stack', col);
    col.title = days[i] + ': ' + sum + (sum === 1 ? ' mensaje' : ' mensajes'); col.classList.toggle('today', i === 13);
    $('span', col).textContent = days[i].slice(8);
    st2.style.setProperty('--h', (sum / dmax * 100).toFixed(1) + '%');
    st2.innerHTML = arr.filter(x => x.v).map(x => '<u style="flex:' + x.v + ' 1 0;background:' + x.c + '"></u>').join('');
  });
  /* «día más activo»: siempre es la barra más alta (si hay empate, el más reciente) */
  const sums = per.map(a => a.reduce((s2, x) => s2 + x.v, 0)), top = sums.lastIndexOf(Math.max(...sums)), k = $('#chartKpi');
  [...chart.children].forEach((c, i) => c.classList.toggle('top', sums[top] > 0 && i === top));
  if (k){ const dl = s => new Date(s + 'T12:00').toLocaleDateString('es', { weekday:'long', day:'numeric' }), all = sums.reduce((a, b) => a + b, 0);
    k.innerHTML = '<span><b>' + fmt(sums[13]) + '</b> hoy</span><span><b>' + fmt(all) + '</b> en 14 días</span>' + (sums[top] > 0 ? '<span class="ck-top"><b>' + esc(dl(days[top])) + '</b> tu día más activo · ' + fmt(sums[top]) + (sums[top] === 1 ? ' mensaje' : ' mensajes') + '</span>' : '<span>Aún sin día más activo</span>'); }
}
SZ.hooks.usage = () => { renderUsage(); updateTotals(); };

$('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ ledger:st().ledger, usage:st().usage, chats:st().chats, model:st().model }, null, 2)], { type:'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'synthz-datos-' + today() + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Listo: descargué una copia de tus datos.');
});
$('#importBtn').addEventListener('click', () => $('#importFile').click());
$('#importFile').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try{
      const d = JSON.parse(r.result);
      if (!d || typeof d !== 'object') throw new Error('x');
      if (d.ledger || d.usage){ SZ.state.ledger = d.ledger ? SZ.cleanLedger(Object.assign({}, d.ledger, { ep:Date.now() })) : { ep:Date.now(), dev:{ legacy:SZ.legacyRow(d.usage) } }; try{ localStorage.setItem('synthz:ledger', JSON.stringify(SZ.state.ledger)); }catch(_){} SZ.normalize(); }
      if (d.chats) st().chats = SZ.cleanChats(d.chats);
      if (d.model) st().model = SZ.cleanStrMap(d.model);
      save(); renderUsage(); updateTotals(); toast('Datos importados.');
    }catch(err){ toast('Ese archivo no es válido.'); }
  };
  r.readAsText(f); e.target.value = '';
});
false && $('#resetBtn').addEventListener('click', async () => { if (await SZ.szConfirm('¿Reiniciar tus contadores?', 'Tu historial de uso vuelve a cero.', 'Reiniciar', true)){ SZ.resetUsage(); renderUsage(); updateTotals(); toast('Contadores en cero.'); } });
$('#wipeBtn').addEventListener('click', async () => { if (await SZ.szConfirm('¿Borrar todo de este navegador?', 'Se borran tus chats y ajustes de este equipo. Lo que está guardado en tu cuenta de SynthZ no se toca.', 'Borrar todo', true)){ SZ.state = { keys:{}, model:{}, models:{}, usage:{}, chats:{}, fav:[], cmp:[], ledger:{ ep:Date.now(), dev:{} } }; try{ localStorage.setItem('synthz:ledger', JSON.stringify(SZ.state.ledger)); }catch(_){} save(); renderCards(); observeAll(); renderLaunch(); renderUsage(); updateTotals(); toast('Todo borrado.'); } });

/* ---------- scroll: solo lo esencial (barra, navegación y sección activa) ---------- */
const bar = $('#progress'), nav = $('#nav');
const secs = ['como', 'modos', 'usos', 'comparar', 'conectar', 'chat', 'consumo', 'faq'].map(id => document.getElementById(id));
let ticking = false;
function update(){
  ticking = false;
  const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';
  nav.classList.toggle('scrolled', y > 30);
  let act = null; secs.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .45) act = s.id; });
  $$('.navlinks a, .rail .rbtn[data-sec]').forEach(a => a.classList.toggle('on', a.dataset.sec === act));
  S.retarget();
}
addEventListener('scroll', () => { if (!ticking){ ticking = true; requestAnimationFrame(update); } }, { passive:true });
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href').length < 2) return;
  e.preventDefault();
  const id = a.getAttribute('href').slice(1), el = document.getElementById(id); if (!el) return;
  scrollTo({ top: id === 'top' ? 0 : el.getBoundingClientRect().top + scrollY - 20, behavior:'smooth' });
});

/* ---------- movimiento ambiental: resplandores que siguen al mouse y cinta continua ---------- */
const blobs = $$('#aurora i'), bf = [[40, 40], [-50, -30], [30, 20], [-30, 25]];
let mxT = 0, myT = 0, mx = 0, my = 0, tx = 0, setW = 0, lastT = performance.now();
const track = $('#track');
let trackOn = true; if ('IntersectionObserver' in window) new IntersectionObserver(es => { trackOn = es[0].isIntersecting; }).observe(track);
const measure = () => { setW = track.scrollWidth / 4; };
addEventListener('pointermove', e => { mxT = e.clientX / innerWidth - .5; myT = e.clientY / innerHeight - .5; }, { passive:true });
function loop(now){
  requestAnimationFrame(loop);
  const dt = Math.min(3, (now - lastT) / 16.67 || 1); lastT = now;
  const k = 1 - Math.pow(1 - .05, dt); mx += (mxT - mx) * k; my += (myT - my) * k;
  if (!reduce && setW > 0 && trackOn){ tx -= .55 * dt; if (tx <= -setW) tx += setW; track.style.transform = 'translate3d(' + tx.toFixed(2) + 'px,0,0)'; }
}

/* ---------- hero: se escribe y luego aparece lo demás ---------- */
let heroDone = false;
async function heroSeq(){
  if (heroDone) return; heroDone = true;
  await typeIn($('#h1'), { cps:22, max:2.8 });
  await typeIn($('#heroSub'), { cps:120, max:2.4 });
  $$('.hero-fade').forEach((el, i) => setTimeout(() => el.classList.add('show'), i * 160));
}

/* ---------- intro: la Z se dibuja y se pinta de arriba-derecha a abajo-izquierda ---------- */
let pulsed = false;
const afterHero = () => { if (FIRST && !$('#authm') && !$('#ptour')) setTimeout(welcomed ? pageTour : firstRun, 700); else if (!FIRST && SZ.wasAway()) setTimeout(() => SZ.welcomeBack({ learn:openGuide }), 600); };
function pulseThenHero(){
  if (pulsed) return; pulsed = true;
  try{
    if (reduce){ root.classList.add('pulsed'); heroSeq().then(afterHero); return; }
    const nb = $('#navWord').getBoundingClientRect();
    if (!FIRST) SZ.thud(nb.left + nb.width / 2, nb.top + nb.height / 2);
    setTimeout(() => root.classList.add('pulsed'), 380);
    setTimeout(() => heroSeq().then(afterHero), 1400);
  }catch(e){ root.classList.add('pulsed'); heroSeq().then(afterHero); }
}
function finishIntro(){
  const o = $('#intro'); if (o) o.remove(); SZ.S.busy(false);
  root.classList.add('ready', 'landed'); root.classList.remove('lock');
  update(); pulseThenHero();
}
/* ---------- intro en video: la Z de vidrio líquido se forma (sin sonido, con «Saltar») ---------- */
function videoIntro(){
  return new Promise(done => {
    const nc = navigator.connection || {}, slow = nc.saveData || /(^|-)2g/.test(nc.effectiveType || '');
    if (slow || matchMedia('(prefers-reduced-motion: reduce)').matches || !document.createElement('video').canPlayType){ done(false); return; }
    const o = document.createElement('div'); o.id = 'vintro';
    o.innerHTML = '<video muted playsinline preload="auto" poster="media/intro-z.jpg" aria-hidden="true"><source src="media/intro-z.webm" type="video/webm"><source src="media/intro-z.mp4" type="video/mp4"></video><div class="vi-glow" aria-hidden="true"></div><button type="button" class="vi-skip">Saltar <kbd>Esc</kbd></button><div class="vi-bar" aria-hidden="true"><i></i></div>';
    document.body.appendChild(o);
    const v = $('video', o), bar = $('.vi-bar i', o); let end = false, t0 = 0;
    const finish = (skipped) => { if (end) return; end = true; if (skipped && v.currentTime > .05) try{ localStorage.setItem('synthz:introSkip', '1'); }catch(e){} removeEventListener('keydown', key, true); o.classList.add('out'); setTimeout(() => o.remove(), 900); done(!skipped); };
    const key = e => { if (e.key === 'Escape' || e.key === 'Enter' || e.code === 'Space'){ e.preventDefault(); finish(true); } };
    addEventListener('keydown', key, true);
    $('.vi-skip', o).addEventListener('click', () => finish(true));
    if (!FIRST) v.currentTime = 2.6;              /* quien ya vino ve solo el final: la Z formándose */
    v.addEventListener('timeupdate', () => { if (v.duration) bar.style.transform = 'scaleX(' + (v.currentTime / v.duration).toFixed(3) + ')'; });
    v.addEventListener('ended', () => finish(false));
    v.addEventListener('error', () => finish(true));
    requestAnimationFrame(() => o.classList.add('on'));
    const p = v.play(); if (p && p.catch) p.catch(() => finish(true));
    setTimeout(() => { if (!end && v.currentTime < .05) finish(true); }, 2500);   /* si no arrancó, no se espera */
    setTimeout(() => finish(false), 11000);
  });
}
async function intro(o = {}){
  SZ.S.busy(true);
  const ov = $('#intro'), row = $('#intRow'), txt = $('#intText'), caret = $('#intCaret'), bolt = $('#bolt');
  const outline = $('#zOutline'), gloss = $('#zGloss'), skipEl = $('#intSkip'), holdBar = $('#intHold');
  const stp = { a:$('#pw1'), b:$('#pw2'), h1:$('#pw3a'), h2:$('#pw3b'), h3:$('#pw3c') };
  let skip = !!o.fast;
  const sleep = ms => sleepRaw(skip ? 0 : ms);
  if (matchMedia('(pointer: coarse)').matches) $('span', skipEl).textContent = 'Mantén presionado 1,5 s para saltar';
  const anim = (dur, fn) => new Promise(res => {
    const d = skip ? 1 : dur, t0 = performance.now();
    (function step(now){
      const k = clamp((now - t0) / d, 0, 1); fn(k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, k);
      k < 1 ? requestAnimationFrame(step) : res();
    })(t0);
  });
  /* se salta manteniendo la barra espaciadora 1,5 s (en pantallas táctiles, manteniendo el dedo) */
  const HOLD = 1500; let holdT0 = 0, holding = false;
  function holdTick(now){
    if (!holding || skip) return;
    const k = clamp((now - holdT0) / HOLD, 0, 1);
    holdBar.style.transform = 'scaleX(' + k + ')';
    if (k >= 1){ skip = true; return; }
    requestAnimationFrame(holdTick);
  }
  const startHold = () => { if (holding || FIRST) return; holding = true; holdT0 = performance.now(); skipEl.style.opacity = '1'; requestAnimationFrame(holdTick); };
  const stopHold = () => { holding = false; holdBar.style.transform = 'scaleX(0)'; };
  addEventListener('keydown', e => { if (e.code === 'Space' && $('#intro')){ e.preventDefault(); if (!e.repeat) startHold(); } });
  addEventListener('keyup', e => { if (e.code === 'Space') stopHold(); });
  if (matchMedia('(pointer: coarse)').matches){ ov.addEventListener('pointerdown', startHold); ov.addEventListener('pointerup', stopHold); ov.addEventListener('pointercancel', stopHold); }

  txt.innerHTML = 'Synth'.split('').map(c => '<span class="ch">' + c + '</span>').join('');
  const letters = $$('.ch', txt);
  letters[0].classList.add('gS');                       /* la S de vidrio */
  /* v1.4: después del video de la Z, la Z de vidrio se queda y se escribe «Synth» como antes */
  let zimg = null;
  if (o.afterVideo){
    const r = bolt.getBoundingClientRect();
    zimg = document.createElement('img'); zimg.src = 'media/z-glass.webp'; zimg.alt = ''; zimg.className = 'bolt zgimg';
    zimg.style.cssText = 'height:' + Math.max(40, r.height || 0) + 'px;width:auto;opacity:0;transform:scale(1.25);filter:blur(6px);transition:opacity .6s ease,transform .9s cubic-bezier(.22,1,.36,1),filter .6s ease';
    bolt.style.display = 'none'; bolt.after(zimg);
    requestAnimationFrame(() => { zimg.style.opacity = '1'; zimg.style.transform = 'none'; zimg.style.filter = 'none'; });
  }
  const paint = k => {
    const f = .32, a = (.083 - f) + (.917 - .083 + f) * k, c = v => clamp(v, 0, 1);
    stp.a.setAttribute('offset', c(a)); stp.b.setAttribute('offset', c(a + f));
    stp.h1.setAttribute('offset', c(a + f * .25 - .09)); stp.h2.setAttribute('offset', c(a + f * .25)); stp.h3.setAttribute('offset', c(a + f * .25 + .09));
  };
  paint(0); gloss.style.opacity = '1';

  await Promise.race([document.fonts ? document.fonts.ready : sleepRaw(0), sleepRaw(1200)]);
  await sleep(150);
  setTimeout(() => { if (!skip && !FIRST) skipEl.style.opacity = '1'; }, 900);

  if (!o.afterVideo){
  /* 1. el contorno de la Z se traza */
  outline.style.transition = 'stroke-dashoffset ' + (skip ? 0 : .9) + 's cubic-bezier(.65,0,.35,1)';
  outline.style.strokeDashoffset = '0';
  await sleep(750);
  /* 2. la pintura la recorre de arriba-derecha a abajo-izquierda */
  await anim(2500, (e, k) => { paint(.5 - .5 * Math.cos(Math.PI * k)); });
  gloss.style.transition = 'opacity .5s'; gloss.style.opacity = '0';
  bolt.classList.add('flash');
  await sleep(250);
  } else await sleep(700);
  /* 3. la Z se asienta y se escribe el nombre */
  bolt.style.transition = 'transform .8s cubic-bezier(.22,1,.36,1)'; bolt.style.transform = 'scale(1)';
  caret.classList.add('blink');
  await sleep(250);
  for (const l of letters){ l.classList.add('on'); await sleep(95); }
  await sleep(250);
  caret.classList.remove('blink'); caret.style.width = '0'; caret.style.margin = '0';
  /* 4. vuela hasta la barra de arriba */
  skipEl.style.opacity = '0';
  /* primera vez: primero el tutorial (después se ofrece entrar o crear cuenta) */
  const wel = null, tw = null;
  if (tw){ tw.style.visibility = 'hidden'; ov.style.zIndex = '9800'; }
  const a = row.getBoundingClientRect(), b = (tw || $('#navWord')).getBoundingClientRect();
  const s = a.width ? b.width / a.width : 1, dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height / 2) - (a.top + a.height / 2);
  const dur = skip ? .4 : 1;
  row.style.transition = 'transform ' + dur + 's cubic-bezier(.77,0,.18,1)';
  row.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')';
  ov.classList.add('out');
  await sleepRaw(dur * 1000 + 40);
  try{ sessionStorage.setItem('synthz:intro', '1'); }catch(e){}
  if (tw){ tw.style.visibility = ''; const io = $('#intro'); if (io) io.remove(); SZ.S.busy(false); return; }
  finishIntro();
}

/* ---------- entrar, ayuda con bloqueadores, configuración y recorrido ---------- */
let FIRST = false, welcomed = false; try{ FIRST = !localStorage.getItem('synthz:visited'); }catch(e){}
const markVisited = () => { try{ localStorage.setItem('synthz:visited', '1'); }catch(e){} };
function puterSignIn(opts){
  if (!window.puter){ showBlockHelp('script'); return Promise.reject(Object.assign(new Error('sin puter'), { shown:true })); }
  return puter.auth.signIn(opts || {}).catch(e => { if (SZ.isBlocked(e)){ showBlockHelp('popup'); throw Object.assign(new Error('popup'), { shown:true }); } throw e; });
}
function afterConnect(msg){ toast(msg); updateTotals(); }
function openConnect(){ const c = document.getElementById('conectar'); if (c) scrollTo({ top:c.getBoundingClientRect().top + scrollY - 80, behavior:'smooth' }); }
function browserName(){ const u = navigator.userAgent; if (navigator.brave) return 'Brave'; if (/Edg\//.test(u)) return 'Edge'; if (/OPR\//.test(u)) return 'Opera'; if (/Firefox\//.test(u)) return 'Firefox'; if (/Safari\//.test(u) && !/Chrome\//.test(u)) return 'Safari'; return 'Chrome'; }
const ICO = {
  pop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18"/><path d="M10 12.5l4 4M14 12.5l-4 4" stroke="#ff8f7a"/></svg>',
  ext:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4a2 2 0 0 1 4 0v2h3a1 1 0 0 1 1 1v3h-1.5a2 2 0 0 0 0 4H18v3a1 1 0 0 1-1 1h-3v-1.5a2 2 0 0 0-4 0V20H7a1 1 0 0 1-1-1v-3h1.5a2 2 0 0 0 0-4H6V7a1 1 0 0 1 1-1h3z"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg>',
  lock:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
};
let blkEl = null;
function showBlockHelp(kind){
  if (blkEl) return;
  const br = browserName(), pop = kind === 'popup', brave = br === 'Brave';
  const steps = pop
    ? (br === 'Firefox' ? ['Arriba aparece una barra amarilla: <b>Firefox impidió que este sitio abriera una ventana</b>.', 'Pulsa <b>Preferencias</b> y elige <b>Permitir ventanas emergentes</b> para este sitio.', 'Vuelve aquí y pulsa <b>Reintentar</b>.']
      : br === 'Safari' ? ['En el menú <b>Safari</b>, abre <b>Ajustes para este sitio web</b>.', 'En <b>Ventanas emergentes</b>, elige <b>Permitir</b>.', 'Vuelve aquí y pulsa <b>Reintentar</b>.']
      : ['Al final de la barra de direcciones apareció un icono de <b>ventana con una ✕</b> (el número 1).', 'Haz clic y elige <b>Permitir siempre ventanas emergentes</b> de este sitio.', 'Pulsa <b>Reintentar</b>. Si no ves el icono, revisa tu bloqueador de anuncios en <b>extensiones</b> (el paso 2).'])
    : (brave ? ['Haz clic en el <b>león de Brave Shields</b> en la barra (el número 1).', 'Baja los escudos para este sitio.', 'Pulsa <b>Recargar</b>.']
      : ['Haz clic en el icono de <b>extensiones</b>, la pieza de puzle a la derecha (el número 1).', 'Abre tu bloqueador (uBlock, AdBlock, AdGuard…) y <b>desactívalo para este sitio</b>.', 'Pulsa <b>Recargar</b>.']);
  const bi = (ico, n) => '<span class="bi' + (n ? ' hl' : '') + '">' + ico + (n ? '<i class="nb">' + n + '</i>' : '') + '</span>';
  const icons = pop ? bi(ICO.pop, br === 'Firefox' || br === 'Safari' ? 0 : 1) + bi(ICO.ext, br === 'Firefox' || br === 'Safari' ? 0 : 2) : (brave ? bi(ICO.shield, 1) + bi(ICO.ext, 0) : bi(ICO.ext, 1));
  blkEl = document.createElement('div'); blkEl.id = 'blk';
  blkEl.innerHTML = '<div class="tcard" role="dialog" aria-modal="true"><div class="word" id="bWord"></div><div class="tn">AVISO · ' + esc(br.toUpperCase()) + '</div><div class="tb"><h3>' + (pop ? 'Tu navegador no dejó abrir la ventanita de Puter' : 'Tu bloqueador de anuncios está frenando a Puter') + '</h3><p>' + (pop ? 'Para entrar a Puter se abre una ventanita, y ' + esc(br) + ' no la dejó abrir. Así la permites:' : 'Un bloqueador de anuncios no deja cargar Puter. Las IAs conectadas siguen funcionando. Así lo arreglas:') + '</p></div>'
    + '<div class="bbar" aria-hidden="true"><span class="dots"><i></i><i></i><i></i></span><span class="url">' + ICO.lock + esc(location.host || 'tu-sitio') + '</span>' + icons + '</div>'
    + '<ol class="bsteps">' + steps.map(s => '<li>' + s + '</li>').join('') + '</ol>'
    + (pop ? '<div class="bforce" id="bForce"><b>¿Lo intento de otra forma?</b> Pruebo entrar a Puter por otro camino. Puede que tampoco funcione si el bloqueo es muy fuerte.<div class="tbtn"><button class="lnk" id="bNo" type="button">No</button><button class="btn sm" id="bYes" type="button">Sí, forzar</button></div></div>' : '')
    + '<div class="tbtn" style="margin-top:16px"><button class="lnk" id="bClose" type="button">' + (pop ? 'Cerrar' : 'Seguir sin Puter') + '</button>' + (pop ? '<button class="lnk" id="bAsk" type="button">Forzar</button>' : '') + '<button class="btn sm" id="bGo" type="button">' + (pop ? 'Reintentar' : 'Recargar') + '</button></div></div>';
  document.body.appendChild(blkEl); $('#bWord').innerHTML = zWord('Synth');
  requestAnimationFrame(() => blkEl.classList.add('on'));
  $('.tcard', blkEl).animate([{ transform:'scale(.9) translateY(24px)', opacity:0, filter:'blur(10px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:700, easing:'cubic-bezier(.22,1,.36,1)' });
  const close = () => { if (!blkEl) return; const el = blkEl; blkEl = null; el.classList.remove('on'); setTimeout(() => el.remove(), 470); };
  $('#bClose').addEventListener('click', () => { close(); if (!pop) openConnect(); });
  blkEl.addEventListener('pointerdown', e => { if (e.target === blkEl) close(); });
  $('#bGo').addEventListener('click', () => {
    if (!pop){ location.reload(); return; }
    close(); puterSignIn().then(() => afterConnect('¡Puter conectado!')).catch(() => {});
  });
  if (pop){
    $('#bAsk').addEventListener('click', () => $('#bForce').classList.add('on'));
    $('#bNo').addEventListener('click', () => $('#bForce').classList.remove('on'));
    $('#bYes').addEventListener('click', () => {
      const ui2 = window.puter && puter.ui && puter.ui.authenticateWithPuter;
      if (!ui2){ toast('Ese camino no funcionó. Permite las ventanitas de este sitio y pulsa Reintentar.'); return; }
      close(); puter.ui.authenticateWithPuter().then(() => afterConnect('¡Puter conectado!')).catch(() => toast('Tampoco funcionó. Permite las ventanitas de este sitio y pulsa Reintentar.'));
    });
  }
}

function authModal(first, next, opts){
  opts = opts || {};
  if ($('#authm')) return $('#authm');
  const o = document.createElement('div'); o.id = 'authm'; o.className = 'szm';
  o.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Entrar a SynthZ"><div class="word">' + zWord('Synth') + '</div><div class="tn">' + (first ? 'BIENVENIDO' : 'TU CUENTA') + '</div><div class="tb"><h3>' + (first ? 'Bienvenido a SynthZ' : 'Entra a SynthZ') + '</h3><p>Crea tu cuenta gratis con un usuario y una contraseña: tus chats y favoritos te siguen a cualquier dispositivo y personalizas tu perfil.</p><div id="authBox"></div></div><div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>' + (first ? 'Continuar sin cuenta' : 'Cerrar') + '</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  if (!opts.hold) $('.tcard', o).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:650, easing:'cubic-bezier(.22,1,.36,1)' });
  let done = false;
  const out = ok => { o.classList.remove('on'); setTimeout(() => o.remove(), 450); if (!done){ done = true; if (next) next(ok); } };
  $('[data-close]', o).addEventListener('click', () => out(false));
  SZ.authBox($('#authBox', o), m => { toast(m === 'tmp' ? '¡Listo! Estás en una cuenta temporal.' : '¡Bienvenido a tu cuenta de SynthZ!'); updateTotals(); out(true); }, k => showBlockHelp(k));
  return o;
}
function openHelp(){ SZ.helpGuide({ extra:[['Recorrido por la página', () => pageTour()], ['Abrir SynthFlow', () => openChat()]] }); }
/* Guía: Asistida (SynthonIA en SynthFlow, con la cinemática y 5 mensajes de prueba) o Lectura (aquí mismo) */
function openGuide(){ pageTour(() => setTimeout(() => { if (!SZ.ACC.ready) authModal(false, () => updateTotals()); }, 400)); }
$('#helpBtn').addEventListener('click', openGuide);
/* menú del celular */
{
  const nb = $('#navMenu'), nd = $('#navDrop');
  const setOpen = on => { nb.setAttribute('aria-expanded', String(on)); if (on){ nd.hidden = false; requestAnimationFrame(() => nd.classList.add('on')); } else { nd.classList.remove('on'); setTimeout(() => { if (!nd.classList.contains('on')) nd.hidden = true; }, 380); } };
  nb.addEventListener('click', e => { e.stopPropagation(); setOpen(nb.getAttribute('aria-expanded') !== 'true'); });
  nd.addEventListener('click', e => { const b = e.target.closest('[data-nd]'); setOpen(false); if (b){ if (b.dataset.nd === 'help') openGuide(); else if (b.dataset.nd === 'acc') $('#accBtn').click(); else $('#cfgBtn').click(); } });
  document.addEventListener('click', e => { if (!nd.hidden && !e.target.closest('#navDrop')) setOpen(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !nd.hidden){ setOpen(false); nb.focus(); } });
}
/* primera vez: primero el tutorial; entrar o crear cuenta viene después (o con «Ahora no») */
function firstRun(){ pageTour(() => setTimeout(() => { if (!SZ.ACC.ready) authModal(true, () => updateTotals()); }, 500)); }
function pageTour(onEnd){
  if ($('#ptour')) return;
  let pick = SZ.CFG.perf;
  const vis = sel => { const e = sel && document.querySelector(sel); return !sel || !!(e && e.offsetWidth && e.getClientRects().length); };
  const first = (...L) => L.find(x => vis(x)) || L[L.length - 1];
  const steps = [
    { s:'.logo', t:'Este es SynthZ', p:'El lugar para usar muchas IA gratis, desde un solo sitio. Toca el logo cuando quieras volver arriba.' },
    { s:'.navlinks', t:'El menú', p:'Desde aquí vas a tus IA, al chat (SynthFlow) o a ver cuánto has usado, en un toque.' },
    { s:'.pill-total', t:'Tu límite de hoy', p:'Cada día tienes un límite gratis para usar las IAs conectadas. Este anillo se va vaciando mientras chateas. A medianoche se vuelve a llenar.' },
    { s:first('#railMe', '#accBtn', '#navMenu'), t:'Tu cuenta', p:'Entra a tu cuenta de SynthZ: tus chats quedan guardados y los ves en cualquier celular o computador, personalizas tu perfil y hablas con el equipo si necesitas ayuda.' },
    { s:first('#railCfg', '#cfgBtn', '#navMenu'), t:'Configuración', p:'¿Lo quieres más bonito o más rápido? Elige y mira abajo cómo se verá. Puedes cambiarlo cuando quieras desde este botón.', x:'cfg' },
    { s:'#como', t:'Así de fácil', p:'Preguntas, comparas y SynthonIA te acompaña. Baja despacio y mira cómo se animan.' },
    { s:'#conectar', t:'Tu IA ya está lista', p:'Ya puedes chatear gratis. Puter: conecta tu versión pro de las IAs más usadas, como ChatGPT, Claude o Gemini. Es gratis, tiene un límite que se renueva cada mes y se conecta con un clic.' },
    { s:'#chat', t:'Pregunta desde aquí', p:'Escribe tu pregunta aquí y te llevo al chat (SynthFlow) con tu pregunta lista.' },
    { s:'#consumo', t:'Tu uso', p:'Cómo va tu límite de hoy y cuánto chateaste estos días.' },
    { s:null, t:'¡Todo listo!', p:'Ya sabes qué es SynthZ y por dónde empezar: escribe tu pregunta o abre SynthFlow. Inicia sesión para que no tengas límites.' }
  ].filter(x => vis(x.s));
  const o = document.createElement('div'); o.id = 'ptour';
  o.innerHTML = '<div class="catch"></div><div class="hole"></div><div class="pcard tcard" role="dialog" aria-modal="true" aria-label="Recorrido por SynthZ"><div class="tn"></div><div class="tb"><h3></h3><p></p><div class="tx"></div></div><div class="tdots">' + steps.map(() => '<i></i>').join('') + '</div><div class="tbtn"><button class="lnk" type="button" data-skip>Saltar</button><span style="flex:1"></span><button class="lnk" type="button" data-back>Atrás</button><button class="btn sm" type="button" data-next>Siguiente</button></div></div>';
  document.body.appendChild(o);
  const hole = $('.hole', o), card = $('.pcard', o);
  let i = 0, target = null, follow = 0;
  const gc = document.createElement('div'); gc.id = 'gcur';
  gc.innerHTML = '<i></i><svg viewBox="0 0 22 30" fill="none"><path d="M2.5 2.2V23L8 18.1L11.6 26.4L15.2 24.9L11.7 16.9L19 16.6Z" fill="#0d0e12" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  document.body.appendChild(gc);
  let gx = innerWidth / 2, gy = innerHeight / 2, gT = 0;
  const guide = () => {
    if (!target){ gc.classList.remove('on'); return; }
    const r = target.getBoundingClientRect(), x = Math.min(innerWidth - 30, Math.max(10, r.left + Math.min(r.width / 2, 120))), y = Math.min(innerHeight - 30, Math.max(10, r.top + Math.min(r.height / 2, 60)));
    gc.classList.add('on');
    if (Math.abs(x - gx) > 2 || Math.abs(y - gy) > 2){ gx = x; gy = y; gc.style.transform = 'translate(' + x + 'px,' + y + 'px)'; clearTimeout(gT); gT = setTimeout(() => { gc.classList.remove('tap'); void gc.offsetWidth; gc.classList.add('tap'); }, 900); }
  };
  gc.style.transform = 'translate(' + gx + 'px,' + gy + 'px)';
  const place = () => {
    const W = innerWidth, H = innerHeight, sec = target && target.tagName === 'SECTION';
    const r = target ? target.getBoundingClientRect() : { left:W / 2, top:H / 2, width:0, height:0 }, pad = target ? 10 : 0;
    const x = Math.max(8, r.left - pad), y = Math.max(8, r.top - pad), w = Math.min(W - 16 - x, r.width + pad * 2);
    let h = Math.min(r.height + pad * 2, H - 8 - y); if (sec) h = Math.min(h, H * .42);
    hole.style.left = x + 'px'; hole.style.top = y + 'px'; hole.style.width = Math.max(0, w) + 'px'; hole.style.height = Math.max(0, h) + 'px'; hole.style.opacity = target ? '1' : '0';
    const cw = card.offsetWidth, ch = card.offsetHeight;
    let cy = y + h + 16; if (cy + ch > H - 10) cy = y - ch - 16; if (cy < 10) cy = Math.max(10, H - ch - 12);
    if (!target) cy = (H - ch) / 2;
    const cx = target ? Math.min(W - cw - 10, Math.max(10, x + w / 2 - cw / 2)) : (W - cw) / 2;
    card.style.left = cx + 'px'; card.style.top = cy + 'px';
  };
  const chase = () => { const t0 = performance.now(); cancelAnimationFrame(follow); const f = now => { place(); if (now - t0 < 1100) follow = requestAnimationFrame(f); }; follow = requestAnimationFrame(f); };
  const show = () => {
    const x = steps[i], last = i === steps.length - 1;
    target = x.s ? document.querySelector(x.s) : null;
    if (target){ const r = target.getBoundingClientRect(); if (r.top < 70 || r.bottom > innerHeight - 40 || target.tagName === 'SECTION'){ if (getComputedStyle(target.closest('nav') || document.body).position !== 'fixed') scrollTo({ top:r.top + scrollY - (target.tagName === 'SECTION' ? 84 : innerHeight / 3), behavior:'smooth' }); } }
    $('.tn', card).textContent = String(i + 1).padStart(2, '0') + ' / ' + String(steps.length).padStart(2, '0');
    $('h3', card).textContent = x.t; $('p', card).textContent = x.p;
    const tx = $('.tx', card); tx.innerHTML = '';
    if (x.x === 'cfg') SZ.cfgChooser(tx, pick, v => { pick = v; requestAnimationFrame(place); });
    $$('.tdots i', card).forEach((d, k) => d.classList.toggle('on', k === i));
    $('[data-back]', card).style.visibility = i ? 'visible' : 'hidden';
    $('[data-skip]', card).style.visibility = last ? 'hidden' : 'visible';
    $('[data-next]', card).textContent = last ? (SZ.ACC.ready ? 'Empezar' : 'Iniciar sesión') : 'Siguiente';
    card.animate([{ opacity:.2, filter:'blur(6px)' }, { opacity:1, filter:'blur(0)' }], { duration:450, easing:'cubic-bezier(.22,1,.36,1)' });
    chase(); setTimeout(guide, 450);
  };
  const onMove = () => { place(); guide(); };
  addEventListener('scroll', onMove, { passive:true }); addEventListener('resize', onMove);
  const end = () => {
    gc.classList.remove('on'); setTimeout(() => gc.remove(), 400);
    removeEventListener('scroll', onMove); removeEventListener('resize', onMove); cancelAnimationFrame(follow);
    o.animate([{ opacity:1 }, { opacity:0 }], { duration:350 }).onfinish = () => o.remove();
    markVisited();
    if (pick !== SZ.CFG.perf) SZ.applyCfg(Object.assign({}, SZ.CFG, SZ.cfgPreset(pick), { perf:pick }));
    if (typeof onEnd === 'function') try{ onEnd(); }catch(e){}
  };
  $('[data-skip]', card).addEventListener('click', end);
  $('[data-back]', card).addEventListener('click', () => { if (i > 0){ i--; show(); } });
  $('[data-next]', card).addEventListener('click', () => { if (i < steps.length - 1){ i++; show(); } else { end(); toast('¡A disfrutar SynthZ!'); } });
  o.animate([{ opacity:0 }, { opacity:1 }], { duration:400 });
  show();
}

/* ---------- arranque ---------- */
function boot(){
  renderCards(); puterCard(); renderLaunch(); renderUsage(); updateTotals(); measure(); SZ.mirrorType($('#launchInp'));
  SZ.szCatalog().catch(() => {});        /* estado de las IAs conectadas y el límite de hoy */
/* tarjeta de Puter + botón de cuenta */
function puterCard(){
  const wrap = $('#cards'); if (!wrap || $('[data-id="puter"]', wrap)) return;
  wrap.insertAdjacentHTML('beforeend', '<article class="card" data-id="puter" style="--c:#6fd3d6"><div class="card-top">' + SZ.puterLogo('lg') + '<h3>Puter</h3><span class="status" data-st>Sin conectar</span></div><p class="desc">Opcional. Puter: conecta tu versión pro de las IAs más usadas, como ChatGPT, Claude o Gemini. Es gratis, tiene un límite que se renueva cada mes y se conecta con un clic.</p><div class="actions"><button class="btn sm" data-pu type="button">Conectar con Puter</button></div></article>');
  const card = $('[data-id="puter"]', wrap), b = $('[data-pu]', card);
  const paint = () => { const on = !!(window.puter && puter.auth && puter.auth.isSignedIn()); setStatus(card, on ? 'Conectada' : 'Sin conectar', on ? 'ok' : ''); b.textContent = on ? 'Abrir SynthFlow' : 'Conectar con Puter'; };
  paint(); addEventListener('puter-ready', paint);
  b.addEventListener('click', () => {
    if (window.puter && puter.auth.isSignedIn()){ openChat(); return; }
    b.textContent = 'Conectando…';
    puterSignIn({}).then(() => { paint(); updateTotals(); toast('Puter conectado.'); setTimeout(() => { if (!leaving) openChat(); }, 1000); }).catch(e => { paint(); if (!(e && e.shown)) toast('No terminaste de entrar a Puter. Inténtalo otra vez.'); });
  });
}
function renderAccIdx(){
  const b = $('#accBtn'); if (!b) return; const A = SZ.ACC;
  if (A.ready){ b.className = 'accb'; b.innerHTML = SZ.myAvatar() + '<span>' + esc(SZ.accName().slice(0, 14)) + '</span><i class="sy' + (A.err ? ' bad' : '') + '"></i>'; }
  else if (A.busy || SZ.signedish()){ b.className = 'accb'; b.innerHTML = '<span class="av-me">…</span><span>Abriendo</span><i class="sy wait"></i>'; }
  else { b.className = 'accb out'; b.textContent = 'Entrar'; }
}
$('#accBtn').addEventListener('click', () => {
  if (SZ.ACC.ready){ SZ.portalOut('chat.html?acc=1'); return; }
  authModal(false, () => updateTotals());
});

$('#cfgBtn').addEventListener('click', () => SZ.cfgModal());
SZ.smoothWheel(); SZ.orbitBg();
SZ.accHooks.push(kind => { renderAccIdx(); if (kind === 'pull'){ updateTotals(); try{ renderUsage(); }catch(e){} } });
renderAccIdx();

  armTypes(); charify($('#h1')); charify($('#heroSub'));
  observeAll(); update();
  requestAnimationFrame(loop);
  addEventListener('resize', () => { placePill($('#launchSeg')); measure(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { placePill($('#launchSeg')); measure(); });
  if (!st().models.openrouter) SZ.refreshModels(API[0]).catch(() => {});
}
boot();
/* «Empezar a FlowIA'r»: SynthonIA guiña el ojo y luego se pone fachera (gafas de Flow) con brillitos */
(function startFace(){
  const f = $('#startFace'), b = $('#startBtn'); if (!f || !b) return;
  const put = m => { f.innerHTML = '<span class="fl">' + SZ.face(m, 38) + '</span>'; };
  const cycle = () => { b.classList.remove('cool'); put('guino'); setTimeout(() => { put('flow'); b.classList.add('cool'); }, 1300); };
  cycle(); setInterval(() => { if (!document.hidden && !root.classList.contains('idle-sleep')) cycle(); }, 9000);
  b.addEventListener('mouseenter', () => { put('flow'); b.classList.add('cool'); });
})();
let seen = false, backIn = '';
/* v2.4: la intro sale una vez por visita; si alguien la saltó, ya no se le vuelve a mostrar (salvo que pida «Siempre» en Ajustes) */
try{ const im = SZ.CFG.intro || 'session', skipped = localStorage.getItem('synthz:introSkip') === '1'; seen = !FIRST && (!SZ.CFG.anim || im === 'never' || (im !== 'always' && skipped) || (im === 'session' && sessionStorage.getItem('synthz:intro') === '1')); }catch(e){}
/* de vuelta desde SynthFlow: «SynthZ» ya llegó volando a su esquina; sin intro, la página aparece suave */
try{ backIn = sessionStorage.getItem('synthz:back') || ''; sessionStorage.removeItem('synthz:back'); }catch(e){}
if (backIn){ seen = !FIRST; requestAnimationFrame(() => requestAnimationFrame(() => { root.classList.add('backout'); setTimeout(() => root.classList.remove('backin', 'backout'), 950); })); }
if (seen) finishIntro();
else {
  const failsafe = setTimeout(finishIntro, 26000);
  videoIntro().then(played => intro({ afterVideo:played })).catch(finishIntro).finally(() => clearTimeout(failsafe));
}

/* v2.5 · ya no hay barrita lateral en la portada: todo está en el menú de arriba */
$('#limPill').addEventListener('click', () => { const u = $('#consumo'); if (u) u.scrollIntoView({ behavior:SZ.reduce ? 'auto' : 'smooth' }); });
})();

/* v2.2 · Ajustes › IAs y memoria en la portada, y el «!» de novedades sobre SynthonIA */
SZ.cfgLinks.push(['Elegir mis IA ideales', () => SZ.surveyModal(), '3 preguntas y te digo cuáles te sirven más'], ['Conectar Puter u otra IA', () => SZ.portalOut('chat.html?conn=1'), 'Tu versión pro de las IAs más usadas, gratis'], ['Abrir SynthFlow', () => { location.href = 'chat.html'; }, 'El chat con todas las IAs']);
if (!SZ.appStandalone()) SZ.cfgLinks.push(['Descargar la app SynthFlow', () => SZ.appPromo(true), 'Se instala desde aquí: pantalla completa y a un toque']);
setTimeout(() => { if (!document.querySelector('.szm, #vintro, #intro')) SZ.whatsNew(false); }, 4000);

/* ===== v2.4 · portada del boceto: SynthonIA de cuerpo entero, onda «synthonized», compáralas a ciegas y detalles ===== */
(() => {
const { $, $$, reduce } = SZ;
const q = s => document.querySelector(s);

/* v2.5 · SynthonIA de cuerpo entero, igual al boceto (cabeza 45 %, torso 30 %, base 25 %) */
const body = (mood, pose, size) => SZ.synBody(mood, pose, size);
const hb = q('#heroBot');
if (hb){
  hb.innerHTML = body('feliz', 'saluda', 300);
  /* después del saludo, señala la tarjeta de ejemplo (como en el boceto) */
  const calm = () => { if (!hb.matches(':hover')) hb.innerHTML = body('neutral', innerWidth > 980 ? 'senalaL' : 'presenta', 300); };
  setTimeout(calm, 3800);
  /* detalle: si la tocas, se emociona, celebra y suelta un destello */
  hb.parentElement.style.pointerEvents = 'auto';
  hb.addEventListener('click', () => {
    hb.innerHTML = body('celebrando', 'celebra', 300); hb.classList.remove('boop'); void hb.offsetWidth; hb.classList.add('boop');
    try{ SZ.SND && SZ.SND.blip && SZ.SND.blip('feliz'); SZ.burst && SZ.burst(hb); }catch(e){}
    setTimeout(() => { hb.innerHTML = body('feliz', 'saluda', 300); setTimeout(calm, 2600); }, 1600);
  });
  /* detalle: los ojos y la cabeza siguen al mouse */
  if (!reduce && matchMedia('(pointer: fine)').matches){
    let raf = 0, ex = 0, ey = 0;
    addEventListener('pointermove', e => { const r = hb.getBoundingClientRect(); ex = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / 500)); ey = Math.max(-1, Math.min(1, (e.clientY - r.top - 90) / 500)); if (!raf) raf = requestAnimationFrame(() => { raf = 0; hb.style.setProperty('--ex', (ex * 3.2).toFixed(2) + 'px'); hb.style.setProperty('--ey', (ey * 2.4).toFixed(2) + 'px'); hb.style.setProperty('--tilt', (ex * 4).toFixed(2) + 'deg'); }); }, { passive:true });
  }
}
/* chispitas doradas que flotan alrededor de SynthonIA */
const dust = q('#heroDust');
if (dust && !reduce) dust.innerHTML = Array.from({ length:26 }, (_, i) => '<i style="--x:' + (Math.random() * 100).toFixed(1) + '%;--y:' + (Math.random() * 100).toFixed(1) + '%;--t:' + (3 + Math.random() * 5).toFixed(1) + 's;--dl:-' + (Math.random() * 6).toFixed(1) + 's;--s:' + (1.5 + Math.random() * 2.5).toFixed(1) + 'px"></i>').join('');
const rf = q('#readyFace'); if (rf) rf.innerHTML = body('celebrando', 'celebra', 230);

/* «¿Qué es estar synthonized?»: una onda de estática que, al pasar, se vuelve una onda limpia */
const cv = q('#szWave');
if (cv){
  const ctx = cv.getContext('2d'); let w = 0, h = 0, raf = 0, on = false;
  const fit = () => { const d = Math.min(devicePixelRatio || 1, 2); w = cv.clientWidth; h = cv.clientHeight; cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const noise = (x, t) => Math.sin(x * .31 + t * 3.1) * Math.sin(x * .07 - t) + Math.sin(x * 1.7 + t * 5) * .45;
  const draw = now => {
    raf = 0; const t = now / 1000; ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#3de0ff'); g.addColorStop(.45, '#7b3ff2'); g.addColorStop(.75, '#ff3d9a'); g.addColorStop(1, '#ff7a45');
    for (let k = 0; k < 3; k++){
      ctx.beginPath(); ctx.lineWidth = k ? 1.2 : 2.4; ctx.strokeStyle = g; ctx.globalAlpha = k ? .45 : 1;
      for (let x = 0; x <= w; x += 2){
        const u = x / w, clean = Math.sin(u * 14 - t * 2 + k * .6) * h * .28, dirty = noise(x, t + k) * h * .3 * (1 - u);
        const y = h / 2 + clean * Math.min(1, u * 1.6) + dirty * (1 - Math.min(1, u * 1.6));
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (on && !reduce) raf = requestAnimationFrame(draw);
  };
  fit(); addEventListener('resize', fit);
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { on = es[0].isIntersecting; if (on && !raf) raf = requestAnimationFrame(draw); }).observe(cv);
  else { on = true; raf = requestAnimationFrame(draw); }
}

/* Compáralas a ciegas: eliges la que tiene más Flow y SynthonIA te cuenta quién respondió (son IAs de ejemplo) */
const bf = q('#blFace'); if (bf) bf.innerHTML = SZ.face('guino', 44);
$$('.bl-v').forEach((b, i) => b.addEventListener('click', () => {
  $$('.bl-c').forEach((c, j) => { c.classList.toggle('won', i === j); c.classList.add('shown'); const n = c.querySelector('b'); if (n && !n.dataset.was){ n.dataset.was = n.textContent; n.textContent = 'IA de ejemplo ' + (j + 1); } });
  if (bf) bf.innerHTML = SZ.face('celebrando', 44);
  const say = q('#blSay'); if (say) say.textContent = '¡Elegiste a la IA de ejemplo ' + (i + 1) + '! En SynthFlow lo haces con IAs de verdad.';
  try{ SZ.burst && SZ.burst(b); }catch(e){}
}));

/* el centro «Todas las IAs»: las etiquetas se acomodan en círculo alrededor de la onda */
const hub = q('.hub');
if (hub){ const place = () => { const r = hub.getBoundingClientRect(), R = Math.min(r.width * .38, 300); $$('.hub-i', hub).forEach(el => { const a = parseFloat(el.style.getPropertyValue('--a')) * Math.PI / 180; el.style.transform = 'translate(-50%,-50%) translate(' + (Math.cos(a) * R).toFixed(1) + 'px,' + (Math.sin(a) * R * .55).toFixed(1) + 'px)'; }); }; place(); addEventListener('resize', place); }

/* detalle: el «Ver demo» baja con suavidad hasta «Así de fácil» y lo hace brillar un momento */
const demo = q('#demoBtn');
if (demo) demo.addEventListener('click', e => { const c = q('#como'); if (!c) return; e.preventDefault(); c.scrollIntoView({ behavior:reduce ? 'auto' : 'smooth' }); setTimeout(() => { c.classList.remove('glint'); void c.offsetWidth; c.classList.add('glint'); }, 650); });
})();
/* ===== v2.5 · SynthonIA viva: cuando sales de la portada te acompaña por toda la página.
   Vuela de un lado al otro según la sección, cambia de cara y de pose, dice una frase corta,
   te mira con los ojos y, si la tocas, abre su ventanita para hablar contigo. ===== */
(() => {
const { $, reduce } = SZ;
if (!SZ.synBody) return;
const STOPS = {
  como:     { side:'r', mood:'feliz',      pose:'saluda',   say:'¡Así de fácil! Pregunta lo que sea.' },
  modos:    { side:'l', mood:'neutral',    pose:'senala',   say:'Si no sabes cuál elegir, déjalo en Automático.' },
  usos:     { side:'r', mood:'creando',    pose:'presenta', say:'Estudia, programa o crea ideas conmigo.' },
  comparar: { side:'l', mood:'pensando',   pose:'piensa',   say:'¿Cuál tiene más Flow? Tú decides.', at:'.blind h3' },
  conectar: { side:'r', mood:'feliz',      pose:'presenta', say:'Tu IA ya está lista, sin configurar nada.' },
  chat:     { side:'l', mood:'hablando',   pose:'senala',   say:'Escribe aquí y te llevo a SynthFlow.' },
  consumo:  { side:'r', mood:'analizando', pose:'escribe',  say:'Aquí ves cuánto te queda hoy.' },
  faq:      { side:'l', mood:'escuchando', pose:'escucha',  say:'¿Tienes dudas? Tócame y pregúntame.' }
};
const el = document.createElement('div');
el.id = 'szRoam'; el.className = 'szroam'; el.setAttribute('role', 'button'); el.tabIndex = 0;
el.setAttribute('aria-label', 'SynthonIA: tócala para hablar con ella');
el.innerHTML = '<span class="rb-fig"></span><span class="rb-say" aria-live="polite"></span>';
document.body.appendChild(el);
const fig = el.querySelector('.rb-fig'), bub = el.querySelector('.rb-say');
const hero = document.getElementById('top');
let cur = '', said = new Set(), sayT = 0, heroOn = true, posed = '';
const small = () => matchMedia('(max-width:760px)').matches;
function paint(k){
  const S = STOPS[k]; if (!S) return;
  const side = el.dataset.side || S.side, key = S.mood + S.pose + side;
  if (key !== posed){ fig.innerHTML = SZ.synBody(S.mood, S.pose === 'senala' ? (side === 'l' ? 'senala' : 'senalaL') : S.pose, small() ? 96 : 132); posed = key; }
}
/* en PC se para junto al título de cada sección (del lado con más espacio); en el celular, en una esquina */
function anchor(k){
  const S = STOPS[k], sec = document.getElementById(k); if (!S || !sec) return;
  if (small()){ el.classList.remove('abs'); el.style.left = el.style.top = ''; el.dataset.side = S.side; return; }
  const h = (S.at && sec.querySelector(S.at)) || sec.querySelector('.head h2') || sec.querySelector('h2'); if (!h) return;
  /* el título se escribe letra por letra: se mide el texto completo (no lo que ya se ve) */
  const cs = getComputedStyle(h), R = h.getBoundingClientRect(), fs = parseFloat(cs.fontSize) || 40;
  const cx = (anchor.cv || (anchor.cv = document.createElement('canvas'))).getContext('2d'); cx.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
  const txt = h.textContent.trim(), ls = parseFloat(cs.letterSpacing) || 0, tw = Math.min(R.width, cx.measureText(txt).width + ls * txt.length);
  const lh = Math.min(R.height, parseFloat(cs.lineHeight) || fs * 1.1), al = cs.textAlign;
  const l0 = al === 'center' ? R.left + (R.width - tw) / 2 : al === 'right' || al === 'end' ? R.right - tw : R.left;
  const t = { left:l0, right:l0 + tw, top:R.top, height:lh };
  const w = el.offsetWidth || 132, H = el.offsetHeight || 176, gap = 26;
  const roomR = innerWidth - t.right - gap, roomL = t.left - gap;
  let side = S.side === 'r' ? (roomR >= w ? 'r' : roomL >= w ? 'l' : 'r') : (roomL >= w ? 'l' : roomR >= w ? 'r' : 'l');
  let x = side === 'r' ? t.right + gap : t.left - gap - w;
  x = Math.max(8, Math.min(innerWidth - w - 8, x));
  el.classList.add('abs'); el.dataset.side = side;
  el._x = Math.round(x + scrollX); el._top = Math.round(t.top + scrollY + t.height / 2 - H * .42); stick();
}
/* si el título ya subió, se queda flotando arriba (debajo del menú) en vez de esconderse */
function stick(){
  if (!el.classList.contains('abs') || el._top == null) return;
  const lim = 92, up = el._top - scrollY < lim;
  el.classList.toggle('stick', up);
  el.style.left = (up ? el._x - scrollX : el._x) + 'px'; el.style.top = (up ? lim : el._top) + 'px';
}
function place(k, fly){
  const S = STOPS[k]; if (!S) return;
  const from = el.getBoundingClientRect();
  anchor(k); paint(k);
  if (fly && !reduce && from.width){
    const to = el.getBoundingClientRect(), dx = from.left - to.left, dy = from.top - to.top;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4)
      el.animate([
        { transform:'translate(' + dx + 'px,' + dy + 'px) rotate(0deg)' },
        { transform:'translate(' + dx * .5 + 'px,' + (dy * .5 - 90) + 'px) rotate(' + (dx > 0 ? -14 : 14) + 'deg) scale(1.06)', offset:.5 },
        { transform:'translate(0,0) rotate(0deg)' }
      ], { duration:1100, easing:'cubic-bezier(.45,0,.2,1)' });
  }
  if (!said.has(k)){ said.add(k); say(S.say, fly ? 1100 : 300); }
}
function say(t, delay){
  clearTimeout(sayT);
  sayT = setTimeout(() => {
    bub.textContent = t; el.classList.add('talk');
    const f = el.querySelector('.szbody'); if (f) f.classList.add('talking');
    sayT = setTimeout(() => { el.classList.remove('talk'); const g = el.querySelector('.szbody'); if (g) g.classList.remove('talking'); }, 3600);
  }, delay || 0);
}
function update(){
  heroOn = !!hero && hero.getBoundingClientRect().bottom > innerHeight * .45;
  const mid = innerHeight * .45; let best = '';
  for (const k of Object.keys(STOPS)){ const s = document.getElementById(k); if (!s) continue; const r = s.getBoundingClientRect(); if (r.top < mid && r.bottom > mid * .6){ best = k; } }
  const rd = document.querySelector('#faq .ready'), rr = rd && rd.getBoundingClientRect(), readyOn = rr && rr.top < innerHeight * .8 && rr.bottom > 0;
  const show = !heroOn && !readyOn && !!best && !document.querySelector('.szm.on, #intro, #vintro');
  el.classList.toggle('on', show);
  if (show && best !== cur){ const first = !cur; cur = best; place(best, !first); }
}

let raf = 0;
addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); stick(); }); }, { passive:true, capture:true });
addEventListener('resize', () => { posed = ''; if (cur){ paint(cur); anchor(cur); } update(); });
/* los títulos se escriben letra por letra: cuando cambian de tamaño, se vuelve a acomodar */
if ('ResizeObserver' in window){ const ro = new ResizeObserver(() => { if (cur) anchor(cur); }); Object.keys(STOPS).forEach(k => { const h = document.querySelector('#' + k + ' .head h2'); if (h) ro.observe(h); }); }
/* los ojos la siguen: el puntero */
if (!reduce && matchMedia('(pointer: fine)').matches){
  let r2 = 0;
  addEventListener('pointermove', e => { if (r2 || !el.classList.contains('on')) return; r2 = requestAnimationFrame(() => { r2 = 0; const r = el.getBoundingClientRect(); const ex = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / 420)), ey = Math.max(-1, Math.min(1, (e.clientY - r.top - 40) / 420)); el.style.setProperty('--ex', (ex * 3.2).toFixed(2) + 'px'); el.style.setProperty('--ey', (ey * 2.4).toFixed(2) + 'px'); el.style.setProperty('--tilt', (ex * 5).toFixed(2) + 'deg'); }); }, { passive:true });
}
/* tocarla: se pone contenta y abre su ventanita */
const open = () => {
  posed = ''; fig.innerHTML = SZ.synBody('celebrando', 'celebra', small() ? 96 : 132);
  try{ SZ.SND && SZ.SND.blip && SZ.SND.blip('feliz'); }catch(e){}
  setTimeout(() => { if (cur) paint(cur); }, 1500);
  try{ SZ.BOT && SZ.BOT.open && SZ.BOT.open(); }catch(e){}
};
el.addEventListener('click', open);
el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(); } });
/* de vez en cuando parpadea distinto o mira a su alrededor para que se sienta viva */
if (!reduce) setInterval(() => {
  if (!el.classList.contains('on') || el.classList.contains('talk') || document.hidden) return;
  const k = cur, S = STOPS[k]; if (!S) return;
  const alt = ['guino', 'feliz', 'sorprendida', 'pensando'][Math.floor(Math.random() * 4)];
  fig.innerHTML = SZ.synBody(alt, S.pose, small() ? 96 : 132); posed = '';
  setTimeout(() => { if (cur === k) paint(k); }, 1400);
}, 9000);
update();
})();
