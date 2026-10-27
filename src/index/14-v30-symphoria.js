/* ===== v3.0 · SymphorIA: la S se dibuja cuando se ve la sección, la chispa recorre la órbita (portador)
   y los puntos sueltos (el caos del ábaco) se ordenan en una onda (la sintonía). Quieto cuando no se ve. ===== */
(() => {
const { $ } = SZ;
/* ES / EN: el botón de la barra cambia el idioma de toda la página (lo guarda 00b-idioma) */
const lb = $('#langBtn'); if (lb && SZ.setLang) lb.addEventListener('click', () => SZ.setLang(SZ.lang() === 'es' ? 'en' : 'es'));
const nd = $('#navDrop'); if (nd && SZ.setLang) nd.addEventListener('click', e => { if (e.target.closest('[data-nd="lang"]')) SZ.setLang(SZ.lang() === 'es' ? 'en' : 'es'); });
const sec = $('#nombre'), flow = $('#syFlow'), svg = $('.sy-svg', sec || document);
if (!sec || !flow) return;
const COLS = ['#3de0ff', '#7b3ff2', '#ff3d9a', '#ff7a45', '#ffc857'];
const N = 26;
const draw = () => {
  const w = flow.clientWidth || 300, h = flow.clientHeight || 150;
  flow.querySelectorAll('i').forEach(x => x.remove());
  let rnd = 7;
  const r = () => (rnd = (rnd * 9301 + 49297) % 233280) / 233280;      /* siempre el mismo «caos» */
  for (let i = 0; i < N; i++){
    const t = i / (N - 1), d = document.createElement('i');
    d.style.cssText = '--c:' + COLS[i % COLS.length] + ';--x0:' + (r() * w * .42 + 10).toFixed(0) + 'px;--y0:' + (r() * (h - 30) + 12).toFixed(0) + 'px;--x1:'
      + (w * .14 + t * w * .8).toFixed(0) + 'px;--y1:' + (h * .46 + Math.sin(t * Math.PI * 2.2) * h * .26).toFixed(0) + 'px;--dl:' + (t * .5).toFixed(2) + 's';
    flow.append(d);
  }
};
draw();
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(draw, 200); });
const pause = on => { try{ if (svg && svg.pauseAnimations) on ? svg.unpauseAnimations() : svg.pauseAnimations(); }catch(e){} };
pause(false);
if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) sec.classList.add('on'); pause(en.isIntersecting); }), { threshold:.25 }).observe(sec);
else sec.classList.add('on');
})();
