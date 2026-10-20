/* ===== v2.3 · en el celular, la barra puede ir a la izquierda: se abre con ☰ y se cierra al elegir ===== */
{
  const nb = $('#navBtn'), tb = $('#tabbar');
  let scrim = null;
  const isOpen = () => root.classList.contains('navopen');
  const setNav = on => {
    if (!root.classList.contains('navleft')) on = false;
    root.classList.toggle('navopen', on); nb.setAttribute('aria-expanded', String(on));
    if (on){ if (!scrim){ scrim = document.createElement('div'); scrim.className = 'navscrim'; scrim.addEventListener('click', () => setNav(false)); document.body.appendChild(scrim); } requestAnimationFrame(() => scrim.classList.add('on')); const f = $('button', tb); if (f) f.focus({ preventScroll:true }); }
    else if (scrim){ const s = scrim; scrim = null; s.classList.remove('on'); setTimeout(() => s.remove(), 320); }
  };
  nb.addEventListener('click', () => setNav(!isOpen()));
  tb.addEventListener('click', e => { if (isOpen() && e.target.closest('[data-tab]')) setTimeout(() => setNav(false), 60); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()){ setNav(false); nb.focus(); } });
  addEventListener('resize', () => { if (!isMobile()) setNav(false); });
  /* arriba del menú: el nombre de SynthFlow, para que se sienta un cajón de verdad */
  if (!$('.tb-head', tb)) tb.insertAdjacentHTML('afterbegin', '<div class="tb-head" aria-hidden="true"><span class="tbw"></span></div>');
  const w = $('.tbw', tb); if (w) w.innerHTML = SZ.zWord('Synth');
}
