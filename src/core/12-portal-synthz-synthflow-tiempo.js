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

