/* ---------- v2.2 · etiquetas al pasar el mouse: cada botón con ícono dice qué hace (como en Claude) ---------- */
if (matchMedia('(hover: hover) and (pointer: fine)').matches){
  let tipEl = null, tipT = 0, tipFor = null;
  const hide = () => { clearTimeout(tipT); tipFor = null; if (tipEl) tipEl.classList.remove('on'); };
  addEventListener('pointerover', e => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (!t || t === tipFor) return;
    if (t.closest('.rail:not(.open)') || t.closest('.ctxm')) return hide();
    hide(); tipFor = t;
    tipT = setTimeout(() => {
      if (!t.isConnected || tipFor !== t) return;
      if (!tipEl){ tipEl = document.createElement('div'); tipEl.className = 'sztip'; tipEl.setAttribute('role', 'tooltip'); document.body.appendChild(tipEl); }
      tipEl.textContent = t.dataset.tip; tipEl.classList.remove('on');
      const r = t.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
      let y = r.top - h - 8; if (y < 6) y = r.bottom + 8;
      tipEl.style.left = Math.max(6, Math.min(innerWidth - w - 6, r.left + r.width / 2 - w / 2)) + 'px'; tipEl.style.top = y + 'px';
      requestAnimationFrame(() => tipEl && tipEl.classList.add('on'));
    }, 380);
  });
  addEventListener('pointerout', e => { if (tipFor && !(e.relatedTarget && tipFor.contains(e.relatedTarget))) hide(); });
  addEventListener('pointerdown', hide, true); addEventListener('scroll', hide, true); addEventListener('keydown', hide);
}
