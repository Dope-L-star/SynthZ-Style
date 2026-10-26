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
