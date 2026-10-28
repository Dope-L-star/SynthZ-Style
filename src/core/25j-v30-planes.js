/* ---------- v3.0 · Planes (Chispa, Syntonia, Timeless y Orquesta) ----------
   Los pagos están APAGADOS (PENDIENTES.md › Plan de pagos): nadie puede pagar todavía y nada se cobra.
   Esta ventana solo muestra qué traerá cada plan y en cuál estás. Hoy todos están en Chispa (gratis, con las IAs gratis de siempre)
   y el equipo (Prime, ZFlow y Symmetrix) en Orquesta: sin límite de EnerX, búsquedas ni imágenes, y con los colores Aurora y Oro negro.
   El servidor es quien decide el límite (api/_pool.js › free); aquí solo se muestra. */
const PLANS = [
  { id:'chispa', n:'Chispa', p:'Gratis', c:'#e6b65f', L:['Las IAs gratis de hoy: Groq, Gemini Flash, Mistral y más', 'Tu EnerX diaria, que se carga a medianoche', 'Imágenes con límite, internet y memoria', 'Proyectos, Sintéticos y A.L.I.A.S.'] },
  { id:'syntonia', n:'Syntonia', p:'US$7,99 al mes', c:'#9fffd6', L:['Todo lo de Chispa con un límite mucho más amplio', '400 mensajes al mes con IAs pro (GPT, Claude, Grok, Gemini Pro)', '30 imágenes pro', 'Los colores Aurora y Oro negro'] },
  { id:'timeless', n:'Timeless', p:'US$17,99 al mes', c:'#a98bff', L:['Todo lo de Syntonia', '900 mensajes pro y 50 con lo más potente', '80 imágenes y 2 videos cortos', 'SynthFlow en WhatsApp y Telegram'] },
  { id:'orquesta', n:'Orquesta', p:'US$8,99 por persona', c:'#ffd27a', L:['Para equipos (desde 3 personas)', 'Lo de Syntonia para cada persona', 'Chats y panel de equipo', 'Hoy lo usan Prime, ZFlow y Symmetrix, sin límites, para probar todo'] }
];
let szTeam = false; try{ szTeam = localStorage.getItem('synthz:team') === '1'; }catch(e){}
const planOf = () => szTeam ? 'orquesta' : 'chispa';
/* el equipo estrena los colores de pago (Aurora y Oro negro): se quita el «Pronto» y se vuelve a pintar el tema */
function planPerks(){
  THEMES.forEach(t => { if (t[0] === 'aurora' || t[0] === 'oro') t[3] = szTeam ? 0 : 1; });
  try{ cfgClasses(); }catch(e){}
}
planPerks();
addEventListener('synthz-szq', e => {
  const d = e.detail || {}; if (d.team == null) return;
  const t = !!d.team; if (t === szTeam) return;
  szTeam = t; try{ t ? localStorage.setItem('synthz:team', '1') : localStorage.removeItem('synthz:team'); }catch(er){}
  planPerks();
});
function plansModal(){
  if ($('#szPlans')) return;
  const me = planOf(), o = document.createElement('div'); o.id = 'szPlans'; o.className = 'szm';
  o.innerHTML = '<div class="tcard plans" role="dialog" aria-modal="true" aria-label="Planes de SymphorIA"><div class="word">' + zWord('Synth') + '</div><div class="tn">PLANES</div><div class="tb">'
    + '<h3>Elige cómo FlowIAr</h3><p>Las IAs gratis siempre van a estar. Los planes de pago llegan pronto: hoy nadie puede pagar y no se cobra nada.</p>'
    + '<div class="pl-grid">' + PLANS.map((P, i) => '<article class="pl-card' + (P.id === me ? ' me' : '') + '" style="--pc:' + P.c + ';--i:' + i + '"><header><b>' + esc(P.n) + '</b>' + (P.id === me ? '<em>Tu plan</em>' : '') + '</header><span class="pl-p">' + esc(P.p) + '</span><ul>' + P.L.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>'
      + (P.id === me ? '<span class="pl-on">Activo</span>' : P.id === 'chispa' ? '' : '<button type="button" class="btn sm ghost" disabled aria-disabled="true">Pronto</button>') + '</article>').join('') + '</div>'
    + '<p class="cnote">' + (me === 'orquesta' ? 'Eres del equipo: tienes todo como en Orquesta, sin límite de EnerX, para probar la página.' : 'Cuando lleguen los pagos verás aquí cuánto te queda de cada cosa, y podrás cancelar con un clic.') + '</p>'
    + '<div class="tbtn"><button class="btn sm" type="button" data-close>Listo</button></div></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  $('[data-close]', o).addEventListener('click', close); o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  addEventListener('keydown', function k(e){ if (e.key === 'Escape'){ close(); removeEventListener('keydown', k); } });
}
