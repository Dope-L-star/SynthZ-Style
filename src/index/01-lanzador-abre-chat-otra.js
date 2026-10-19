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
  { label:'Abrir SynthFlow', fn:() => openChat() },
  { label:'Mis IA', fn:() => go('conectar') },
  { label:'Ver mi consumo', fn:() => go('consumo') },
  { label:'Volver arriba', fn:() => scrollTo({ top:0, behavior:'smooth' }) },
  { label:'Guía rápida', fn:() => openHelp() },
  { label:'Recorrido por la página', fn:() => pageTour() },
  { label:'Elegir mis IA (3 preguntas)', fn:() => SZ.surveyModal() },
  { label:'Configuración', fn:() => SZ.cfgModal() },
  { label:'Recargar', fn:() => location.reload() }]);
document.addEventListener('click', e => { const u = e.target.closest && e.target.closest('a[data-draft]'); if (!u || e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); SZ.portalOut(u.getAttribute('href')); });
document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href="chat.html"]'); if (!a || e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); openChat(); });
$('#launchInp').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing){ e.preventDefault(); openChat(); } });
/* al volver con "atrás" se recarga para mostrar los datos al día */
addEventListener('pageshow', e => {
  if (e.persisted){ location.reload(); return; }
  leaving = false; root.classList.remove('leaving'); $$('.expand,#portal').forEach(x => x.remove()); SZ.S.busy(false); const lg = $('#nav .logo'); if (lg) lg.style.visibility = '';
});

