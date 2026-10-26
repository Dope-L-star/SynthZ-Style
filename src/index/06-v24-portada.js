
/* ===== v2.4 · portada del boceto: SynthonIA de cuerpo entero, onda «synthonized», compáralas a ciegas y detalles ===== */
(() => {
const { $, $$, reduce } = SZ;
const q = s => document.querySelector(s);

/* SynthonIA de cuerpo entero: cabeza (su carita de siempre), torso de vidrio con el núcleo cian, brazo que saluda y su anillo de luz */
function body(mood, size){
  return '<div class="sb-h">' + SZ.face(mood || 'feliz', size || 150) + '</div>'
    + '<svg class="sb-t" viewBox="0 0 200 170" aria-hidden="true">'
    + '<defs><radialGradient id="sbTor" cx=".38" cy=".25" r=".9"><stop offset="0" stop-color="#fff2fb"/><stop offset=".4" stop-color="#f0b3e4"/><stop offset=".78" stop-color="#a47ff0"/><stop offset="1" stop-color="#6c48cf"/></radialGradient>'
    + '<radialGradient id="sbCore" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e9ffff"/><stop offset=".45" stop-color="#3de0ff"/><stop offset="1" stop-color="#3de0ff" stop-opacity="0"/></radialGradient></defs>'
    + '<rect x="82" y="0" width="36" height="16" rx="8" fill="#c79cf2"/>'
    + '<path class="sb-arm l" d="M64 34q-26 16-30 52" stroke="url(#sbTor)" stroke-width="20" stroke-linecap="round" fill="none"/>'
    + '<g class="sb-arm r"><path d="M136 34q26-14 38-46" stroke="url(#sbTor)" stroke-width="20" stroke-linecap="round" fill="none"/><circle cx="175" cy="-14" r="13" fill="url(#sbTor)"/></g>'
    + '<rect x="56" y="12" width="88" height="96" rx="40" fill="url(#sbTor)"/>'
    + '<path d="M70 30q12-10 30-10" stroke="#fff" stroke-opacity=".7" stroke-width="5" stroke-linecap="round" fill="none"/>'
    + '<circle class="sb-core" cx="100" cy="62" r="20" fill="url(#sbCore)"/>'
    + '<path d="M72 112h56l-6 22H78z" fill="#b48cf0"/>'
    + '</svg><i class="sb-ring"></i><i class="sb-ring r2"></i>';
}
const hb = q('#heroBot');
if (hb){
  hb.innerHTML = body('feliz', 150);
  /* detalle: si la tocas, guiña y suelta un destello */
  hb.parentElement.style.pointerEvents = 'auto';
  hb.addEventListener('click', () => {
    hb.querySelector('.sb-h').innerHTML = SZ.face('guino', 150); hb.classList.remove('boop'); void hb.offsetWidth; hb.classList.add('boop');
    try{ SZ.SND && SZ.SND.blip && SZ.SND.blip('feliz'); }catch(e){}
    setTimeout(() => { hb.querySelector('.sb-h').innerHTML = SZ.face('feliz', 150); }, 1400);
  });
  /* detalle: los ojos siguen al mouse (muy poquito) */
  if (!reduce && matchMedia('(pointer: fine)').matches){
    let raf = 0, ex = 0, ey = 0;
    addEventListener('pointermove', e => { const r = hb.getBoundingClientRect(); ex = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / 500)); ey = Math.max(-1, Math.min(1, (e.clientY - r.top - 80) / 500)); if (!raf) raf = requestAnimationFrame(() => { raf = 0; hb.style.setProperty('--ex', (ex * 4).toFixed(2) + 'px'); hb.style.setProperty('--ey', (ey * 3).toFixed(2) + 'px'); }); }, { passive:true });
  }
}
const rf = q('#readyFace'); if (rf) rf.innerHTML = body('celebrando', 120);

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
