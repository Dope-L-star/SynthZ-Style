/* ---------- modo, panel móvil y atajos ---------- */
function setMode(m){
  mode = m; document.body.classList.toggle('cmpm', m === 'cmp');
  if (m !== 'cmp') cmpLast = null;
  inp.placeholder = m === 'cmp' ? 'Una pregunta para todas las IA…' : 'Escribe tu mensaje…';
  paintSel(); renderTop(); renderMsgs(); renderNow(); renderFoot(); updateHint(); paintAccent();
}
/* ---------- selector de IA flotante (computador) u hoja que sube (celular) ---------- */
const side = $('#side'), scrim = $('#scrim');
/* ---------- selector en dos paneles: «Filtros» (en el centro) y «Las IA» (se abre a la derecha) ---------- */
const LUPA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
(function twoPanels(){
  const L = document.createElement('div'); L.className = 'pf-l'; L.setAttribute('role', 'group'); L.setAttribute('aria-label', 'Filtros');
  const R = document.createElement('div'); R.className = 'pf-r'; R.setAttribute('role', 'group'); R.setAttribute('aria-label', 'Las IA');
  const head = $('.phead', side), fw = $('.fwrap', side) || $('#filters'), prov = $('#provSeg'), sortr = $('.sortrow', side), more = $('#pMore'), pfoot = $('.pfoot', side);
  const lbl = t => { const e = document.createElement('p'); e.className = 'plbl'; e.textContent = t; return e; };
  head.insertAdjacentHTML('beforeend', '<button type="button" class="plupa" id="pLupa" aria-label="Buscar una IA" data-tip="Buscar una IA">' + LUPA + '</button>');
  const go = document.createElement('div'); go.className = 'pl-go';
  go.innerHTML = '<button type="button" class="btn sm flow" id="pSee">Ver las IA <span aria-hidden="true">→</span></button>';
  L.append(head, lbl('Qué mostrar'), $('#pTabs'), lbl('¿Para qué la quieres?'), $('#pTopics'), lbl('En qué son buenas'), fw, lbl('De dónde'), prov, sortr, go);
  const rh = document.createElement('div'); rh.className = 'pr-head';
  rh.innerHTML = '<button type="button" class="pr-back" id="pBack" aria-label="Volver a los filtros"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg><span>Filtros</span></button><b>Las IA</b><span class="pr-n" id="prN"></span>';
  R.append(rh, $('#searchBox'), $('#pNote'), $('#mlist'), pfoot);
  if (more) more.remove();
  side.append(L, R); side.classList.add('two-p');
})();
const sideL = $('.pf-l', side), sideR = $('.pf-r', side);
const wide2 = () => matchMedia('(min-width:900px)').matches;
function sideShift(){ const w = side.offsetWidth, lw = sideL.offsetWidth;   /* v1.8: medidas sin la animación de entrada (antes quedaba corrido a la izquierda) */ side.style.setProperty('--shift', Math.max(0, (w - lw) / 2).toFixed(0) + 'px'); }
function sideStage(two, o = {}){
  requestAnimationFrame(() => { try{ placePill($('#provSeg')); placePill($('#sortSeg')); placePill($('#pTabs')); }catch(e){} });
  if (two === side.classList.contains('two')){ if (two && o.focus) setTimeout(() => $('#q').focus(), 50); return; }
  sideShift(); side.classList.toggle('two', two); SZ.SND.expand && two && SZ.SND.expand();
  if (two){ requestAnimationFrame(() => { V.hM = 0; renderList({ keep:true, animate:true }); }); if (o.focus) setTimeout(() => $('#q').focus(), wide2() ? 520 : 120); }
}
addEventListener('resize', () => { if (side.classList.contains('open')) sideShift(); });
$('#pLupa').addEventListener('click', () => sideStage(true, { focus:true }));
$('#pSee').addEventListener('click', () => sideStage(true));
$('#pBack').addEventListener('click', () => sideStage(false));
/* elegir cualquier cosa en «Filtros» abre «Las IA» */
sideL.addEventListener('click', e => { if (e.target.closest('[data-ptk],.fchip,#pTabs button,#provSeg button,#sortSeg button')) setTimeout(() => sideStage(true), 260); });
/* el selector se amplía desde donde lo tocaste hasta el centro, y al cerrarlo vuelve allí (animación al revés) */
let sideFrom = null;
function sideFlip(open){
  if (SZ.reduce) return Promise.resolve();
  const r = side.getBoundingClientRect(), a = sideFrom;
  const cx = a ? a.left + a.width / 2 : r.left + r.width / 2, cy = a ? a.top + a.height / 2 : r.top + r.height / 2;
  const dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2), sx = a ? Math.max(.12, a.width / r.width) : .9, sy = a ? Math.max(.08, a.height / r.height) : .9;
  const A = { transform:'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')', opacity:0, filter:'blur(10px)', borderRadius:'999px' }, B = { transform:'none', opacity:1, filter:'blur(0)', borderRadius:'28px' };
  if (isMobile()){ A.transform = 'translateY(70px)'; A.borderRadius = B.borderRadius = '26px 26px 0 0'; }
  /* si el navegador pausa la animación (pestaña en segundo plano), igual se termina: nunca queda la ventana trabada */
  const D = open ? 620 : 420;
  return Promise.race([side.animate(open ? [A, B] : [B, A], { duration:D, easing:open ? 'cubic-bezier(.22,1,.36,1)' : 'cubic-bezier(.55,0,.75,.2)' }).finished.catch(() => {}), new Promise(r => setTimeout(r, D + 180))]);
}
function placeSide(){}
function openSide(kind, anchor){
  if (isLocked()){ lockNudge(); toast('Primero conecta Puter: es gratis y con un clic.'); return; }
  if (agentOn() && mode === 'solo' && kind !== 'add'){ toast('En modo agente la IA la elige el agente. Si quieres elegirla tú, apaga el modo agente.'); return; }
  pickMode = kind === 'add' || mode === 'cmp' ? 'add' : 'set';
  $('#pTitle').textContent = pickMode === 'add' ? 'Suma otra IA a la mesa' : '¿Con quién fluyes hoy?';
  const a = anchor && anchor.isConnected ? anchor : $('#curChip') || $('#cPick') || $('#pickRow');
  sideFrom = a ? a.getBoundingClientRect() : null;
  if (pickMode === 'set' && !ptopic && curTopic) ptopic = curTopic;
  renderPTopics(); paintPNote(); paintPGo();
  const wasOpen = side.classList.contains('open');
  if (!wasOpen) side.classList.toggle('two', !!(pickMode === 'add' && !wide2()));
  side.classList.add('open'); { sideL.style.transition = 'none'; sideShift(); void sideL.offsetWidth; sideL.style.transition = ''; } requestAnimationFrame(sideShift);   /* v1.8: abre ya centrado, sin saltar desde la izquierda */ side.setAttribute('aria-hidden', 'false'); scrim.classList.add('on', 'pick');
  $$('#pickRow .mchip').forEach(c => c.setAttribute('aria-expanded', String(pickMode === 'set')));
  setTab(isMobile() ? 'ia' : null);
  renderList({ keep:true });
  requestAnimationFrame(() => placePill($('#pTabs')));
  if (!wasOpen) sideFlip(true);
  if (pickMode === 'set') setTimeout(() => scrollToSel(), 60);
}
/* al abrir la lista, se ve la IA que estás usando (con su proveedor elegido) */
function scrollToSel(){
  const id = selId(); if (!V.rows) return;
  const i = V.rows.findIndex(r => r.t === 'm' && r.m.id === id); if (i < 0) return;
  listEl.scrollTop = Math.max(0, V.tops[i] - 80); vPaint(true);
}
let sideClosing = false;
function closeSide(){
  if (!side.classList.contains('open') || sideClosing) return;
  sideClosing = true;
  const fin = () => {
    sideClosing = false;
    side.classList.remove('open'); side.setAttribute('aria-hidden', 'true');
    if (!$('#chats').classList.contains('msheet')) scrim.classList.remove('on');
    scrim.classList.remove('pick');
    pickMode = 'set'; $$('#pickRow .mchip').forEach(c => c.setAttribute('aria-expanded', 'false'));
    setTab(null); paintSel();
  };
  scrim.classList.remove('pick');
  sideFlip(false).then(fin);
}
$('#sideClose').addEventListener('click', closeSide);
$('#sideDone').addEventListener('click', closeSide);
scrim.addEventListener('click', () => { closeSide(); closeChatsSheet(); });
document.addEventListener('pointerdown', e => {
  if (!side.classList.contains('open') || isMobile()) return;
  if (side.contains(e.target) || e.target.closest('.mchip, .addb, [data-pick], [data-add-cmp], .szm, .ctxm, #tour, #conn, #blk, #svm')) return;
  closeSide();
});
addEventListener('resize', () => { if (side.classList.contains('open') && !isMobile()) placeSide(); });
addEventListener('keydown', e => {
  const tag = e.target.tagName || '', typing = /INPUT|TEXTAREA|SELECT/.test(tag);
  if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')){ e.preventDefault(); openSide('set'); setTimeout(() => { $('#q').focus(); $('#q').select(); }, 60); }
  else if (e.key === 'Escape'){ if (document.activeElement === $('#q') && $('#q').value){ clearQuery(); } else if (side.classList.contains('open')){ closeSide(); const c = $('#curChip'); if (c) c.focus(); } else closeChatsSheet(); }
});

