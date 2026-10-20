/* ---------- v2.1 · SynthFlow es la app (SynthZ es solo la página de inicio en la web): se instala en el celular o el computador ---------- */
let installEvt = null;
const isStandalone = () => { try{ return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }catch(e){ return false; } };
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (isFlow() && 'serviceWorker' in navigator && (location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))){
  addEventListener('load', () => { try{ navigator.serviceWorker && navigator.serviceWorker.register('/sw.js', { scope:'/' }).catch(() => {}); }catch(e){} });
}
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; root.classList.add('can-install'); });
addEventListener('appinstalled', () => { installEvt = null; root.classList.remove('can-install'); toast('¡Listo! SynthFlow ya está instalada como app.'); try{ SND.done(); }catch(e){} });
if (isStandalone()) root.classList.add('is-app');
function installModal(title, steps){
  const o = document.createElement('div'); o.className = 'szm szc';
  o.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="word">' + zWord('Synth') + '</div><div class="tb"><h3>' + esc(title) + '</h3><ol class="inst-ol">' + steps.map(s => '<li>' + s + '</li>').join('') + '</ol><p class="inst-p">Así SynthFlow queda con su propio ícono, abre en pantalla completa y carga más rápido.</p></div><div class="tbtn" style="margin-top:16px"><button class="btn sm" type="button" data-close>Entendido</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const out = () => { removeEventListener('keydown', key, true); o.classList.remove('on'); setTimeout(() => o.remove(), 400); };
  const key = e => { if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); out(); } };
  addEventListener('keydown', key, true);
  $('[data-close]', o).addEventListener('click', out);
  o.addEventListener('pointerdown', e => { if (e.target === o) out(); });
  setTimeout(() => { const b = $('[data-close]', o); if (b) b.focus(); }, 50);
}
async function installApp(){
  if (!isFlow()){ location.href = 'chat.html'; return; }
  if (isStandalone()) return toast('Ya estás usando la app de SynthFlow.');
  if (installEvt){
    const e = installEvt; installEvt = null; root.classList.remove('can-install');
    try{ e.prompt(); const r = await e.userChoice; if (r && r.outcome !== 'accepted') toast('Cuando quieras, la instalas desde este mismo menú.'); }catch(err){}
    return;
  }
  const share = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
  if (isIOS()) return installModal('Instala SynthFlow en tu iPhone', ['Abre esta página en <b>Safari</b>.', 'Toca el botón de compartir ' + share + ' (abajo o arriba).', 'Elige <b>«Agregar a inicio»</b> y toca <b>«Agregar»</b>.']);
  if (/android/i.test(navigator.userAgent)) return installModal('Instala SynthFlow en tu celular', ['Toca el menú <b>⋮</b> de tu navegador (arriba a la derecha).', 'Elige <b>«Instalar app»</b> o <b>«Agregar a la pantalla principal»</b>.', 'Confirma con <b>«Instalar»</b>.']);
  installModal('Instala SynthFlow en tu computador', ['Usa <b>Chrome</b> o <b>Edge</b>.', 'Busca el ícono de instalar en la barra de direcciones (una pantalla con una flecha) o abre el menú <b>⋮</b>.', 'Elige <b>«Instalar SynthFlow»</b>.']);
}
