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
