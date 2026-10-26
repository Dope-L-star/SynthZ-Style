/* ---------- v2.3.1 · esfuerzo: cuánto piensa la IA antes de responder (Auto · Bajo · Medio · Alto) ----------
   Cómo se aplica: (1) una pista en el mensaje de sistema, que sirve con cualquier IA; (2) «Bajo» además limita el largo;
   (3) con OpenRouter (llave propia o de equipo) también se manda reasoning.effort. «Alto» pide cuenta (es gratis). */
const EFF = {
  auto:   { n:'Auto',  d:'La IA decide cuánto pensar.',            hint:'',  tok:0, ico:'<path d="M4.5 16a8 8 0 1 1 15 0"/><path d="M12 14l3.5-4"/>' },
  low:    { n:'Bajo',  d:'Respuestas rápidas y cortas.',           hint:'Responde rápido y directo, en pocas frases y sin rodeos.', tok:700, ico:'<path d="M5 19c8 0 13-5 14-14-9 0-14 5-14 14z"/><path d="M5 19l8-8"/>' },
  medium: { n:'Medio', d:'Equilibrio entre rapidez y detalle.',    hint:'Responde con una explicación clara y equilibrada: lo importante primero y un poco de detalle.', tok:0, ico:'<path d="M4.5 16a8 8 0 1 1 15 0"/><path d="M12 14l0-6"/>' },
  high:   { n:'Alto',  d:'Piensa con calma y revisa su respuesta.', hint:'Razona con cuidado antes de responder: analiza el problema paso a paso, revisa tu respuesta y entrega una respuesta completa y bien fundamentada.', tok:0, ico:'<path d="M5 15c0-5 3-9 9-11 1 6-1 10-5 12l-2 3z"/><path d="M9 16l-3 1 1-3"/>' }
};
const EFF_KEYS = ['auto', 'low', 'medium', 'high'];
function effKey(){ const e = st().sx && st().sx.effort; return EFF[e] ? e : 'auto'; }
function effortHint(){ return EFF[effKey()].hint; }
function effortOpts(saver){ const k = effKey(); if (k === 'auto') return {}; const o = { effort:k }; if (EFF[k].tok && !saver) o.maxTokens = EFF[k].tok; return o; }
(function esfuerzo(){
  const btn = $('#cEffort'), menu = $('#effMenu'), lab = $('#cEffortL'); if (!btn || !menu) return;
  const svg = k => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + EFF[k].ico + '</svg>';
  const locked = k => k === 'high' && !SZ.ACC.ready;
  function paint(){
    const k = effKey(); lab.textContent = k === 'auto' ? '' : EFF[k].n; btn.classList.toggle('on', k !== 'auto');
    btn.title = 'Esfuerzo: ' + EFF[k].n + ' · cuánto piensa la IA antes de responder';
    menu.innerHTML = EFF_KEYS.map(x => '<button type="button" role="menuitemradio" data-eff="' + x + '" aria-checked="' + (x === k) + '"' + (locked(x) ? ' class="lk"' : '') + '><i aria-hidden="true">' + svg(x) + '</i><span><b>' + EFF[x].n + '</b><small>' + EFF[x].d + '</small></span>' + (locked(x) ? '<em>Con cuenta</em>' : x === k ? '<em class="ck">✓</em>' : '') + '</button>').join('');
  }
  function place(){ const r = btn.getBoundingClientRect(), w = Math.min(270, innerWidth - 16); menu.style.width = w + 'px'; menu.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px'; menu.style.bottom = (innerHeight - r.top + 10) + 'px'; }
  function open(on){ menu.hidden = !on; btn.setAttribute('aria-expanded', String(on)); if (on){ paint(); place(); const c = $('[aria-checked="true"]', menu); if (c) c.focus(); } }
  btn.addEventListener('click', e => { e.stopPropagation(); open(menu.hidden); });
  menu.addEventListener('click', e => {
    const b = e.target.closest('[data-eff]'); if (!b) return; const k = b.dataset.eff;
    if (locked(k)){ open(false); toast('El esfuerzo Alto es para cuentas (entrar es gratis).'); SZ.guestGate({ mode:'signup' }); return; }
    st().sx.effort = k; save(); paint(); open(false); btn.focus(); toast('Esfuerzo: ' + EFF[k].n + (k === 'auto' ? '' : ' · ' + EFF[k].d));
  });
  document.addEventListener('pointerdown', e => { if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) open(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden){ open(false); btn.focus(); } });
  addEventListener('resize', () => { if (!menu.hidden) place(); });
  paint();
})();
