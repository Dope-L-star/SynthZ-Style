/* ===== v2.6 · un solo fondo liviano: cada sección solo se mueve mientras la ves
   y el fondo espacial de arriba se apaga cuando ya bajaste de la portada ===== */
(() => {
const bgs = [...document.querySelectorAll('.secbg')];
if (!('IntersectionObserver' in window)){ bgs.forEach(b => b.classList.add('run')); return; }
const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('run', e.isIntersecting)), { rootMargin:'60px 0px' });
bgs.forEach(b => io.observe(b));
const hero = document.getElementById('top'), H = document.documentElement;
/* el espacio de arriba (cinta de neón, estrellas, brillos) mide lo que mide la portada y baja con la página */
const fitHero = () => { if (hero) H.style.setProperty('--heroH', (hero.offsetHeight + 180) + 'px'); };
fitHero(); addEventListener('resize', fitHero); addEventListener('load', fitHero);
if (hero) new IntersectionObserver(([e]) => {
  H.classList.toggle('sb-off', !e.isIntersecting);
  if (e.isIntersecting && SZ.SPACE && SZ.SPACE.wake) SZ.SPACE.wake();
}).observe(hero);
})();
