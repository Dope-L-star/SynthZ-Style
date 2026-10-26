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

/* ---------- v15: barrita lateral · al abrirla, las palabras del menú de arriba caen en ella (con vidrio) ---------- */
(function(){
  const rail = $('#rail'), tog = $('#railTog'); if (!rail) return;
  const wide = () => matchMedia('(min-width:761px)').matches;
  const KEYS = ['como', 'modos', 'usos', 'faq'];
  const pairs = () => KEYS.map(k => [$('.navlinks a[data-sec="' + k + '"]'), $('.rail .rbtn[data-sec="' + k + '"] .rl')]).filter(p => p[0] && p[1]);
  const store = open => { try{ const o = JSON.parse(localStorage.getItem('synthz:rail')) || {}; o.open = open; localStorage.setItem('synthz:rail', JSON.stringify(o)); }catch(e){} };
  let flying = false;
  function marks(open){ tog.setAttribute('aria-expanded', String(open)); tog.setAttribute('aria-label', open ? 'Cerrar la barra' : 'Abrir la barra'); tog.dataset.tip = open ? 'Cerrar la barra' : 'Abrir la barra'; }
  function ghost(text){ const g = document.createElement('div'); g.className = 'navfly'; g.textContent = text; document.body.appendChild(g); return g; }
  function set(open, animate){
    marks(open);
    const navShown = getComputedStyle($('.navlinks')).display !== 'none';
    if (!animate || !wide() || !navShown || SZ.reduce || root.classList.contains('noanim')){ rail.classList.toggle('open', open); document.body.classList.toggle('railup', open && navShown && wide()); return; }
    if (flying) return; flying = true;
    const P = pairs(), E = 'cubic-bezier(.65,0,.35,1)';
    if (open){
      const from = P.map(([a]) => a.getBoundingClientRect());
      P.forEach(([, l]) => l.classList.add('wait'));
      rail.classList.add('open'); document.body.classList.add('railup');
      P.forEach(([a, l], i) => {
        const br = l.parentElement.getBoundingClientRect(), r0 = from[i], g = ghost(a.textContent), gw = g.offsetWidth, gh = g.offsetHeight;
        const x0 = r0.left + (r0.width - gw) / 2, y0 = r0.top + (r0.height - gh) / 2, x1 = br.left + 32, y1 = br.top + (br.height - gh) / 2;
        const mx = x0 + (x1 - x0) * .55, my = y1 + (y0 - y1) * .25 + 46;
        g.animate([
          { transform:'translate(' + x0 + 'px,' + y0 + 'px) scale(1) rotate(0deg)' },
          { transform:'translate(' + mx + 'px,' + my + 'px) scale(1.1) rotate(' + (i % 2 ? 5 : -5) + 'deg)', offset:.5 },
          { transform:'translate(' + x1 + 'px,' + (y1 + 6) + 'px) scale(.98) rotate(0deg)', offset:.85 },
          { transform:'translate(' + x1 + 'px,' + y1 + 'px) scale(1) rotate(0deg)', background:'rgba(255,255,255,0)', borderColor:'rgba(255,255,255,0)', boxShadow:'0 0 0 rgba(0,0,0,0)' }
        ], { duration:900, delay:i * 95, easing:E, fill:'both' }).onfinish = () => {
          l.classList.remove('wait');
          g.animate([{ opacity:1 }, { opacity:0 }], { duration:260, fill:'forwards' }).onfinish = () => g.remove();
          if (i === P.length - 1) flying = false;
        };
      });
    } else {
      const P2 = P.map(([a, l]) => [a, l, l.getBoundingClientRect()]);
      P2.forEach(([, l]) => l.classList.add('wait'));
      rail.classList.remove('open');
      P2.forEach(([a, l, r0], i) => {
        const g = ghost(a.textContent), gw = g.offsetWidth, gh = g.offsetHeight, ar = a.getBoundingClientRect();
        const x0 = r0.left - 15, y0 = r0.top + (r0.height - gh) / 2, x1 = ar.left + (ar.width - gw) / 2, y1 = ar.top + (ar.height - gh) / 2;
        const mx = x0 + (x1 - x0) * .45, my = Math.min(y0, y1) - 30;
        g.animate([
          { transform:'translate(' + x0 + 'px,' + y0 + 'px) scale(.96)', background:'rgba(255,255,255,0)', borderColor:'rgba(255,255,255,0)' },
          { transform:'translate(' + mx + 'px,' + my + 'px) scale(1.08) rotate(' + (i % 2 ? -4 : 4) + 'deg)', offset:.5 },
          { transform:'translate(' + x1 + 'px,' + y1 + 'px) scale(1)' }
        ], { duration:820, delay:(P2.length - 1 - i) * 80, easing:E, fill:'both' }).onfinish = () => {
          l.classList.remove('wait');
          if (i === 0){ document.body.classList.remove('railup'); flying = false; }
          g.animate([{ opacity:1 }, { opacity:0 }], { duration:300, fill:'forwards' }).onfinish = () => g.remove();
        };
      });
    }
  }
  /* en la portada la barrita siempre empieza cerrada (solo SynthFlow recuerda cómo la dejaste) */
  set(false, false);
  tog.addEventListener('click', () => { const o = !rail.classList.contains('open'); set(o, true); });
  addEventListener('resize', () => { if (!wide()) document.body.classList.remove('railup'); else if (rail.classList.contains('open')) document.body.classList.add('railup'); });
  $('#railCfg').addEventListener('click', () => $('#cfgBtn').click());
  $('#railHelp').addEventListener('click', () => $('#helpBtn').click());
  $('#railMe').addEventListener('click', () => $('#accBtn').click());
  $('#limPill').addEventListener('click', () => { const u = $('#consumo'); if (u) u.scrollIntoView({ behavior:SZ.reduce ? 'auto' : 'smooth' }); });
  function paintMe(){
    const b = $('#railMe'), A = SZ.ACC, u = A.user || {};
    if (A.ready){ b.className = 'rbtn rme'; b.dataset.tip = SZ.accName(); b.innerHTML = SZ.myAvatar() + '<span class="rl"><b>' + esc(SZ.accName().slice(0, 22)) + '</b><small>' + esc((SZ.ROLE_NAME || {})[u.role || 'user'] || 'Synther') + '</small></span>'; }
    else { b.className = 'rbtn rme out'; b.dataset.tip = 'Entrar a tu cuenta'; b.innerHTML = '<span class="av-me" aria-hidden="true"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg></span><span class="rl"><b>Entrar</b><small>guarda tus chats</small></span>'; }
    b.style.setProperty('--i', 4);
  }
  paintMe(); SZ.accHooks.push(paintMe);
})();
})();

/* v2.2 · Ajustes › IAs y memoria en la portada, y el «!» de novedades sobre SynthonIA */
SZ.cfgLinks.push(['Elegir mis IA ideales', () => SZ.surveyModal(), '3 preguntas y te digo cuáles te sirven más'], ['Conectar Puter u otra IA', () => SZ.portalOut('chat.html?conn=1'), 'Tu versión pro de las IAs más usadas, gratis'], ['Abrir SynthFlow', () => { location.href = 'chat.html'; }, 'El chat con todas las IAs']);
if (!SZ.appStandalone()) SZ.cfgLinks.push(['Descargar la app SynthFlow', () => SZ.appPromo(true), 'Se instala desde aquí: pantalla completa y a un toque']);
setTimeout(() => { if (!document.querySelector('.szm, #vintro, #intro')) SZ.whatsNew(false); }, 4000);
