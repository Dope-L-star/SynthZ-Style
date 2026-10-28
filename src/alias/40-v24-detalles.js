/* A.L.I.A.S. · pieza 40 · v2.4: estrellas del fondo, el check que salta al terminar un paso y estrellitas al ver el resultado. Solo adorno. */
(function(){
'use strict';
const reduce = document.documentElement.classList.contains('noanim');   /* v3.1: lo decide Ajustes, no el sistema */

/* estrellas: puntitos que titilan; siempre el mismo cielo para la misma pantalla */
const cv = document.getElementById('alStars');
if (cv){
  const ctx = cv.getContext('2d'); let w = 0, h = 0, S = [], raf = 0, on = true;
  const fit = () => {
    const d = Math.min(devicePixelRatio || 1, 2); w = cv.clientWidth || innerWidth; h = cv.clientHeight || innerHeight;
    cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    S = Array.from({ length: Math.round(w * h / 11000) }, () => { const g = rnd() < .2; return { x: rnd() * w, y: rnd() * h, r: g ? .9 + rnd() : .3 + rnd(), g, ph: rnd() * 6.28, sp: .4 + rnd() * 1.3 }; });
  };
  const draw = now => {
    raf = 0; ctx.clearRect(0, 0, w, h);
    for (const s of S){
      const tw = reduce ? .8 : .5 + .5 * Math.sin(now / 1000 * s.sp + s.ph);
      ctx.globalAlpha = .2 + .7 * tw; ctx.fillStyle = s.g ? '#ffc857' : '#e9e4ff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    }
    if (on && !reduce) raf = requestAnimationFrame(draw);
  };
  fit(); raf = requestAnimationFrame(draw);
  addEventListener('resize', () => { fit(); if (!raf) raf = requestAnimationFrame(draw); });
  document.addEventListener('visibilitychange', () => { on = !document.hidden; if (on && !raf) raf = requestAnimationFrame(draw); });
}

/* el check salta solo en el paso que acaba de terminar (la lista se vuelve a dibujar entera cada vez) */
const list = document.getElementById('stepList');
if (list && 'MutationObserver' in window){
  let was = {};
  new MutationObserver(() => {
    const now = {};
    list.querySelectorAll('.step').forEach(li => {
      const id = li.dataset.id, st = li.dataset.status; now[id] = st;
      if (st === 'done' && was[id] && was[id] !== 'done') li.classList.add('pop');
    });
    was = now;
  }).observe(list, { childList: true });
}

/* al aparecer el resultado, unas estrellitas salen del título */
const res = document.getElementById('vResult');
if (res && !reduce && 'MutationObserver' in window){
  let shown = !res.hidden;
  new MutationObserver(() => {
    const vis = !res.hidden;
    if (vis && !shown){
      const h = document.getElementById('resTitle'), C = ['#3de0ff', '#7b3ff2', '#ff3d9a', '#ff7a45', '#ffc857'];
      const x = h ? h.offsetLeft + h.offsetWidth / 2 : 60, y = h ? h.offsetTop + h.offsetHeight / 2 : 30;
      for (let i = 0; i < 14; i++){
        const s = document.createElement('i'), a = Math.PI * 2 * i / 14 + Math.random() * .4, r = 60 + Math.random() * 70;
        s.className = 'al-star'; s.setAttribute('aria-hidden', 'true');
        s.style.cssText = 'left:' + x + 'px;top:' + y + 'px;--c:' + C[i % C.length] + ';--dx:' + (Math.cos(a) * r).toFixed(0) + 'px;--dy:' + (Math.sin(a) * r * .7).toFixed(0) + 'px';
        res.append(s); setTimeout(() => s.remove(), 1400);
      }
    }
    shown = vis;
  }).observe(res, { attributes: true, attributeFilter: ['hidden'] });
}
})();
