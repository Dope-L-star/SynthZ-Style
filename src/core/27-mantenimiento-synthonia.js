/* ---------- aviso de mantenimiento: cubre la página y SynthonIA charla un rato ----------
   Lo enciende Prime o ZFlow desde Pulsem › Ajustes. Solo muestra; el servidor no lo bloquea. */
const MT = { shown:false, el:null, hist:[], timer:null };
const MT_KIND = /\b(gracias|te quiero|te amo|eres (?:muy )?(?:genial|linda|lindo|buena|bueno|bonita|bonito)|lind[oa]s?|bonit[oa]s?|genial|excelente|me encantas?|te adoro|muy bien|cari[ñn]o)\b/i;
const mtIsAdmin = () => typeof ACC !== 'undefined' && ACC.user && ['owner', 'admin'].includes(ACC.user.role);
const mtSkipped = () => { try{ return sessionStorage.getItem('synthz:mtskip') === '1'; }catch(e){ return false; } };

function mtFace(happy){
  return '<svg class="mt-face' + (happy ? ' happy' : '') + '" viewBox="0 0 120 120" aria-hidden="true">'
    + '<defs><radialGradient id="mtG" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ffe9b8"/><stop offset="1" stop-color="#c98a3d"/></radialGradient></defs>'
    + '<g class="mt-body"><circle cx="60" cy="60" r="46" fill="url(#mtG)"/>'
    + '<g class="mt-eyes"><ellipse class="mt-eye" cx="45" cy="54" rx="5" ry="6.5" fill="#2a1d0e"/><ellipse class="mt-eye" cx="75" cy="54" rx="5" ry="6.5" fill="#2a1d0e"/></g>'
    + '<path class="mt-mouth" d="M46 74 Q60 84 74 74" fill="none" stroke="#2a1d0e" stroke-width="3.5" stroke-linecap="round"/></g>'
    + '<text class="mt-heart" x="92" y="28">♥</text></svg>';
}

function mtPaint(){
  if (!MT.el) return;
  MT.el.querySelector('.mt-msgs').innerHTML = MT.hist.map(m => '<div class="mt-m ' + (m.role === 'user' ? 'me' : 'ia') + '">' + mtEsc(m.content) + '</div>').join('');
  const box = MT.el.querySelector('.mt-msgs'); box.scrollTop = box.scrollHeight;
}
const mtEsc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

function mtHappy(on){
  if (!MT.el) return;
  const f = MT.el.querySelector('.mt-face'); if (!f) return;
  f.outerHTML = mtFace(on);
  if (on){ clearTimeout(MT.hm); MT.hm = setTimeout(() => mtHappy(false), 3200); }
}

async function mtSend(){
  const inp = MT.el.querySelector('.mt-in'), q = inp.value.trim(); if (!q) return;
  inp.value = ''; MT.hist.push({ role:'user', content:q }); mtPaint();
  if (MT_KIND.test(q)) mtHappy(true);
  const bt = MT.el.querySelector('.mt-send'); bt.disabled = true;
  try{
    const r = await fetch('/api/help', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ action:'ask', q, hist:MT.hist.slice(-8, -1) }) });
    const d = await r.json().catch(() => ({}));
    MT.hist.push({ role:'assistant', content:r.ok && d.text ? d.text : (d.error || 'Ahorita no puedo responder, pero aquí estoy. Intenta de nuevo en un momento.') });
  }catch(e){ MT.hist.push({ role:'assistant', content:'Se cortó la conexión. Vuelve a intentar.' }); }
  bt.disabled = false; mtPaint();
  if (!MT_KIND.test(q) && /\b(hola|jaja|jeje|feliz|bien)\b/i.test(q)) mtHappy(true);
}

function mtOpen(text){
  if (MT.el) { MT.el.querySelector('.mt-text').textContent = text; return; }
  const el = document.createElement('div');
  el.id = 'szMaint'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
  el.innerHTML = '<div class="mt-card"><div class="mt-top">' + mtFace(false)
    + '<h2>Un momento, SynthZ está en mantenimiento</h2><p class="mt-text"></p></div>'
    + '<div class="mt-chat"><p class="mt-hint">Mientras tanto, charla un rato con SynthonIA.</p><div class="mt-msgs"></div>'
    + '<form class="mt-form" autocomplete="off"><input class="mt-in" maxlength="300" placeholder="Escríbele algo a SynthonIA…" aria-label="Escribir a SynthonIA"><button class="mt-send" type="submit">Enviar</button></form></div>'
    + (mtIsAdmin() ? '<button class="mt-exit" type="button">Entrar igual (solo equipo)</button>' : '') + '</div>';
  document.body.appendChild(el); document.documentElement.classList.add('mt-on');
  el.querySelector('.mt-text').textContent = text;
  el.querySelector('.mt-form').addEventListener('submit', e => { e.preventDefault(); mtSend(); });
  const ex = el.querySelector('.mt-exit');
  if (ex) ex.addEventListener('click', () => { try{ sessionStorage.setItem('synthz:mtskip', '1'); }catch(e){} mtClose(); });
  MT.el = el; if (!MT.hist.length) MT.hist.push({ role:'assistant', content:'¡Hola! Qué bueno verte por aquí. Mientras se arregla todo, ¿quieres contarme algo o preguntarme cómo va SynthZ?' }); mtPaint();
  setTimeout(() => el.querySelector('.mt-in').focus({ preventScroll:true }), 300);
}

function mtClose(){
  if (MT.el) MT.el.remove(); MT.el = null; document.documentElement.classList.remove('mt-on');
}

async function mtCheck(){
  try{
    const r = await fetch('/api/config', { cache:'no-store' }); const d = r.ok ? await r.json() : {};
    const m = d.maint || {};
    if (m.on && !mtSkipped()) mtOpen(m.text || 'Estamos presentando fallas o actualizaciones. Espera un momento.');
    else if (!m.on) mtClose();
  }catch(e){}
}

(function mtStart(){
  const go = () => { mtCheck(); MT.timer = setInterval(mtCheck, 60000); document.addEventListener('visibilitychange', () => { if (!document.hidden) mtCheck(); }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
