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
  /* v2.6: SynthonIA saluda mientras se escribe el título (antes aparecía 5 segundos después) */
  $$('.hstage.hero-fade').forEach(el => setTimeout(() => el.classList.add('show'), 350));
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

