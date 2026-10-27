/* ===== v3.0 · SymphorIA: la S se dibuja cuando se ve la sección, la chispa recorre la órbita (portador). Quieto cuando no se ve. ===== */
(() => {
const { $ } = SZ;
/* ES / EN: el botón de la barra cambia el idioma de toda la página (lo guarda 00b-idioma) */
const lb = $('#langBtn'); if (lb && SZ.setLang) lb.addEventListener('click', () => SZ.setLang(SZ.lang() === 'es' ? 'en' : 'es'));
const nd = $('#navDrop'); if (nd && SZ.setLang) nd.addEventListener('click', e => { if (e.target.closest('[data-nd="lang"]')) SZ.setLang(SZ.lang() === 'es' ? 'en' : 'es'); });
/* título y descripción de la pestaña en el idioma elegido */
const meta = () => { document.title = SZ.t('ix.title'); const d = document.querySelector('meta[name="description"]'); if (d) d.content = SZ.t('ix.metaDesc'); };
meta(); if (SZ.onLang) SZ.onLang(meta);
const sec = $('#nombre'), svg = $('.sy-svg', sec || document);
if (!sec) return;
const pause = on => { try{ if (svg && svg.pauseAnimations) on ? svg.unpauseAnimations() : svg.pauseAnimations(); }catch(e){} };
pause(false);
if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) sec.classList.add('on'); pause(en.isIntersecting); }), { threshold:.25 }).observe(sec);
else sec.classList.add('on');
})();
