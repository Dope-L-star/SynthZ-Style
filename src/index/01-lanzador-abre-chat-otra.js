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
  const items = [{ id:'synthz', label:SZ.t('ix.046'), p:byId('synthz') }];
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
    hint.textContent = n ? SZ.t(n === 1 ? 'ix.hint1' : 'ix.hintN', { n }) : SZ.t('ix.hint0');
  } else hint.textContent = SZ.t(SZ.SZQ.on !== false ? 'ix.hintOn' : (window.puter && puter.auth && puter.auth.isSignedIn()) ? 'ix.hintPu' : 'ix.hintOff');
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
function openChat(from){
  if (leaving) return; leaving = true;
  const box = from && from.nodeType ? from : $('#launch'), inp = box.id === 'heroAsk' ? $('#heroInp') : $('#launchInp');
  const q = inp.value.trim(), params = new URLSearchParams({ from:'home' });
  if (launchAI === 'cmp') params.set('mode', 'cmp'); else params.set('ai', launchAI);
  if (q) params.set('q', q);
  try{ if (q) sessionStorage.setItem('synthz:q', JSON.stringify({ q, t:Date.now() })); }catch(e){}
  const p = byId(launchAI);
  expandTo(box, 'chat.html?' + params.toString(), p ? p.c : '#b8c4ff');
}
$('#launchGo').addEventListener('click', () => openChat());
/* v2.6: en la portada misma se puede preguntar: el cuadro se agranda y SynthFlow abre con la pregunta ya enviada */
const hask = $('#heroAsk');
if (hask){
  hask.addEventListener('submit', e => { e.preventDefault(); if (!$('#heroInp').value.trim()){ $('#heroInp').focus(); hask.classList.remove('nudge'); void hask.offsetWidth; hask.classList.add('nudge'); return; } openChat(hask); });
  /* ideas que se van turnando en el cuadro vacío, para que se vea qué se puede pedir */
  const ideas = () => [SZ.t('ix.hold'), SZ.t('ix.idea1'), SZ.t('ix.idea2'), SZ.t('ix.idea3'), SZ.t('ix.idea4')];
  let ii = 0;
  if (!reduce) setInterval(() => { const i = $('#heroInp'); if (document.hidden || i.value || document.activeElement === i) return; const L = ideas(); ii = (ii + 1) % L.length; i.placeholder = L[ii]; }, 3200);
}

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
  { get label(){ return SZ.t('ix.qOpen'); }, ico:'open', fn:() => openChat() },
  { get label(){ return SZ.t('ix.qUse'); }, ico:'chart', fn:() => go('consumo') },
  { get label(){ return SZ.t('ix.qUp'); }, ico:'up', fn:() => scrollTo({ top:0, behavior:'smooth' }) }, '—',
  { get label(){ return SZ.t('ix.qCfg'); }, ico:'cog', fn:() => SZ.cfgModal() },
  { get label(){ return SZ.t('ix.qHelp'); }, ico:'help', fn:() => openHelp() }]);
document.addEventListener('click', e => { const u = e.target.closest && e.target.closest('a[data-draft]'); if (!u || e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); SZ.portalOut(u.getAttribute('href')); });
document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href="chat.html"]'); if (!a || e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); openChat(); });
$('#launchInp').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing){ e.preventDefault(); openChat(); } });
/* al volver con "atrás" se recarga para mostrar los datos al día */
addEventListener('pageshow', e => {
  if (e.persisted){ location.reload(); return; }
  leaving = false; root.classList.remove('leaving'); $$('.expand,#portal').forEach(x => x.remove()); SZ.S.busy(false); const lg = $('#nav .logo'); if (lg) lg.style.visibility = '';
});

