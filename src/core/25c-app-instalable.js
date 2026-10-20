/* ---------- v2.3 · SynthFlow como app: se instala desde el navegador (sin tiendas) ----------
   - El «trabajador» (sw.js) no guarda la página: todo llega siempre fresco de internet. Solo guarda la pantalla de «sin conexión».
   - En el celular, una vez cada 7 días, sale «Descarga nuestra app SynthFlow» con un video corto.
   - Android/Chrome: botón «Instalar» de verdad. iPhone: pasos con dibujos (Compartir › Agregar a inicio). */
const APP = { evt:null, done:false };
const appStandalone = () => { try{ return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }catch(e){ return false; } };
const appIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const appPhone = () => { try{ return matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) <= 820; }catch(e){ return false; } };
try{
  if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('/sw.js', { scope:'/' }).catch(() => {}));
  if (window.caches) caches.keys().then(ks => ks.filter(k => /^synthz-/.test(k)).forEach(k => caches.delete(k))).catch(() => {});   /* restos de la versión vieja */
}catch(e){}
addEventListener('beforeinstallprompt', e => { e.preventDefault(); APP.evt = e; });
addEventListener('appinstalled', () => { APP.done = true; APP.evt = null; try{ localStorage.setItem('synthz:appok', '1'); }catch(e){} const o = document.getElementById('appPromo'); if (o && o._close) o._close(); toast('¡Listo! SynthFlow quedó en tu pantalla de inicio.'); });
if (appStandalone()) root.classList.add('isapp');

function appSteps(box){
  const ios = appIOS();
  const share = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
  const dots = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="12" cy="5" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="12" cy="19" r="1.9"/></svg>';
  box.innerHTML = '<ol class="ap-steps">' + (ios
    ? '<li><span class="ap-n">1</span><span>Toca <b>Compartir</b> <i class="ap-k">' + share + '</i> abajo en Safari.</span></li><li><span class="ap-n">2</span><span>Baja y toca <b>Agregar a inicio</b>.</span></li><li><span class="ap-n">3</span><span>Toca <b>Agregar</b>. SynthFlow aparece junto a tus apps.</span></li>'
    : '<li><span class="ap-n">1</span><span>Toca el menú <i class="ap-k">' + dots + '</i> de tu navegador (arriba a la derecha).</span></li><li><span class="ap-n">2</span><span>Toca <b>Instalar app</b> o <b>Agregar a la pantalla principal</b>.</span></li><li><span class="ap-n">3</span><span>Confirma. SynthFlow aparece junto a tus apps.</span></li>') + '</ol>';
}
async function appInstall(fromBox){
  if (appStandalone()){ toast('Ya estás usando la app SynthFlow.'); return true; }
  if (APP.evt){
    const e = APP.evt; APP.evt = null;
    try{ e.prompt(); const r = await e.userChoice; if (r && r.outcome === 'accepted') return true; toast('Cuando quieras, la instalas desde aquí.'); return false; }catch(x){}
  }
  if (fromBox){ appSteps(fromBox); return false; }
  appPromo(true); return false;
}
function appPromo(force){
  if ($('#appPromo') || appStandalone()) return;
  if (!force){
    if (!appPhone()) return;
    try{ if (localStorage.getItem('synthz:appok')) return; const t = +localStorage.getItem('synthz:apppromo') || 0; if (Date.now() - t < 7 * 864e5) return; }catch(e){ return; }
    if (document.querySelector('.szm.on, #ptour, #guide, #szMaint, .tcard[role="dialog"]')) return;   /* no interrumpe otra ventana */
  }
  try{ localStorage.setItem('synthz:apppromo', String(Date.now())); }catch(e){}
  const o = document.createElement('div'); o.id = 'appPromo'; o.className = 'appp';
  const ios = appIOS(), canPrompt = !!APP.evt;
  o.innerHTML = '<div class="ap-card" role="dialog" aria-modal="true" aria-label="Descarga la app SynthFlow">'
    + '<div class="ap-vid"><video src="/media/app/synthflow-demo.mp4" poster="/media/app/synthflow-demo.jpg" muted playsinline loop autoplay preload="metadata" aria-label="SynthFlow en acción"></video><span class="ap-badge"><img src="/media/app/sf-192.png" alt="" width="22" height="22">SynthFlow</span></div>'
    + '<div class="ap-body"><span class="ap-kick">App gratis · sin tiendas</span><h3>Descarga nuestra app <em>SynthFlow</em></h3>'
    + '<ul class="ap-why"><li><i>⚡</i><span><b>Va más fluida</b>: a pantalla completa, sin pestañas ni barra del navegador.</span></li><li><i>🌊</i><span><b>Más Flow</b>: tus chats y SuperiorSynth a un toque, desde tu pantalla de inicio.</span></li><li><i>🔒</i><span><b>Pesa casi nada</b> y siempre está al día: se instala desde aquí mismo.</span></li></ul>'
    + '<div class="ap-how"></div>'
    + '<div class="ap-acts"><button type="button" class="lnk" data-ap="no">Ahora no</button><button type="button" class="btn" data-ap="go">' + (canPrompt ? 'Instalar SynthFlow' : ios ? 'Ver cómo instalarla' : 'Instalar SynthFlow') + '</button></div></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const v = $('video', o); if (v){ v.play().catch(() => {}); v.addEventListener('error', () => { const w = $('.ap-vid', o); if (w) w.classList.add('novid'); }); }
  const close = () => { if (!o.isConnected) return; o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  o._close = close;
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  $('[data-ap="no"]', o).addEventListener('click', close);
  $('[data-ap="go"]', o).addEventListener('click', async e => { const ok = await appInstall($('.ap-how', o)); if (ok) close(); else if (!APP.evt){ e.currentTarget.textContent = 'Entendido'; e.currentTarget.dataset.ap = 'no'; e.currentTarget.onclick = close; } });
  addEventListener('keydown', function k(e){ if (e.key === 'Escape'){ close(); removeEventListener('keydown', k); } });
}
/* en el celular, un ratico después de entrar (nunca encima de otra ventana) */
if (!appStandalone() && !/pulsem/.test(location.pathname)) setTimeout(() => { try{ appPromo(false); }catch(e){} }, 24000);
