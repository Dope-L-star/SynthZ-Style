
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
