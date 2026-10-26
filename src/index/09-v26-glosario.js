/* ===== v2.6 · la burbujita que explica cada nombre propio (las palabras se marcan en 00-aa-glosario.js) ===== */
(() => {
/* una sola burbujita para todos: se acomoda arriba de la palabra y nunca se sale de la pantalla */
const tip = document.createElement('div'); tip.id = 'szTip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip);
let on = null, at = 0;
const show = el => {
  if (on !== el) at = Date.now();
  on = el; tip.textContent = el.dataset.def; tip.classList.add('on');
  const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
  const x = Math.max(10, Math.min(innerWidth - w - 10, r.left + r.width / 2 - w / 2)), up = r.top - h - 10 > 70;
  tip.style.left = x + 'px'; tip.style.top = (up ? r.top - h - 10 : r.bottom + 10) + 'px'; tip.dataset.up = up ? '1' : '0';
  tip.style.setProperty('--ax', Math.max(14, Math.min(w - 14, r.left + r.width / 2 - x)) + 'px');
};
const hide = () => { on = null; tip.classList.remove('on'); };
document.addEventListener('pointerover', e => { const t = e.target.closest && e.target.closest('.term'); if (t && e.pointerType === 'mouse') show(t); });
document.addEventListener('pointerout', e => { const t = e.target.closest && e.target.closest('.term'); if (t && e.pointerType === 'mouse' && !t.contains(e.relatedTarget)) hide(); });
document.addEventListener('focusin', e => { if (e.target.classList && e.target.classList.contains('term')) show(e.target); });
document.addEventListener('focusout', e => { if (e.target.classList && e.target.classList.contains('term')) hide(); });
document.addEventListener('click', e => { const t = e.target.closest && e.target.closest('.term'); if (t){ e.preventDefault(); on === t && Date.now() - at > 400 ? hide() : show(t); }  /* al tocar, el foco ya la abrió: el mismo toque no la cierra */ else if (on) hide(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && on) hide(); });
addEventListener('scroll', () => { if (on) hide(); }, { passive:true });
})();
