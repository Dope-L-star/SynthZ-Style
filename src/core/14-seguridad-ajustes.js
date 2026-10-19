/* ---------- seguridad: cambiar contraseña y código de recuperación nuevo ---------- */
function securityModal(){
  if ($('#secm')) return;
  const o = document.createElement('div'); o.id = 'secm'; o.className = 'szm';
  o.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Seguridad"><div class="word">' + zWord('Synth') + '</div><div class="tn">SEGURIDAD · @' + esc((ACC.user && ACC.user.username) || '') + '</div><div class="tb" id="secBox"></div><div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>Cerrar</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const box = $('#secBox', o);
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  $('[data-close]', o).addEventListener('click', close);
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  const paint = () => {
    box.innerHTML = '<h3>Tu contraseña</h3><form class="lform" novalidate>'
      + '<input name="user" autocomplete="username" value="' + esc((ACC.user && ACC.user.username) || '') + '" hidden>'
      + '<label>Contraseña actual<span class="lin"><input name="old" type="password" autocomplete="current-password" required></span></label>'
      + '<label>Contraseña nueva <small>(déjala vacía si solo quieres un código nuevo)</small><span class="lin"><input name="pass" type="password" autocomplete="new-password" maxlength="200"></span></label>'
      + '<p class="lerr" role="alert"></p>'
      + '<div class="aact"><button class="btn sm" type="submit" data-k="change">Cambiar contraseña</button><button class="btn sm ghost" type="button" data-k="code">Código de recuperación nuevo</button></div>'
      + '<p class="cnote">Al cambiar la contraseña, tu cuenta se cierra en los demás dispositivos. Si pides un código nuevo, el anterior deja de servir.</p></form>';
    const f = $('form', box), err = $('.lerr', box);
    const run = async k => {
      err.textContent = '';
      const old = f.elements.old.value, pass = f.elements.pass.value;
      if (!old){ err.textContent = 'Escribe tu contraseña actual.'; f.elements.old.focus(); return; }
      if (k === 'change' && pass.length < 8){ err.textContent = 'La contraseña nueva debe tener al menos 8 caracteres.'; f.elements.pass.focus(); return; }
      try{
        const d = await api('auth', { method:'POST', keep:true, body: k === 'change' ? { mode:'change', old, pass } : { mode:'code', pass:old } });
        if (k === 'change'){ setSess(d.token); toast('Contraseña cambiada. Cerramos tu sesión en los demás dispositivos.'); close(); }
        else recoveryPanel(box, d.recovery, (ACC.user && ACC.user.username) || '', () => { toast('Listo: el código anterior ya no sirve.'); close(); }, true);
      }catch(x){ err.textContent = x.message || 'Algo falló.'; }
    };
    f.addEventListener('submit', e => { e.preventDefault(); run('change'); });
    $('[data-k="code"]', box).addEventListener('click', () => run('code'));
  };
  paint();
}
/* ---------- configuración ---------- */
const lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
const miniPage = kind => '<div class="mp ' + kind + '"><i class="bl"></i><i class="bl"></i><i class="bl"></i><div class="gl"></div><div class="nv"><i></i><b></b><b></b><b></b></div><div class="h1"></div><div class="h2"></div><div class="cds"><b></b><b></b><b></b></div><span class="cu"></span><em>así se verá</em></div>';
function cfgChooser(box, cur, onPick){
  const paint = sel => {
    box.innerHTML = '<div class="cfgo"><button type="button" data-v="visual" aria-pressed="' + (sel === 'visual') + '"><b>Más bonito</b><span>Con todos los efectos: vidrio, fondo que se mueve, cursor propio y animaciones.</span></button>'
      + '<button type="button" data-v="speed" aria-pressed="' + (sel === 'speed') + '">' + (lowEnd ? '<i class="rec">Recomendado</i>' : '') + '<b>Más rápido</b><span>Para computadores o celulares lentos: menos efectos y todo responde al instante.</span></button></div>'
      + miniPage(sel);
    $$('[data-v]', box).forEach(b => b.addEventListener('click', () => { paint(b.dataset.v); if (onPick) onPick(b.dataset.v); }));
  };
  paint(cur);
}
const CFG_ROWS = [['cursor', 'Cursor ' + BRAND(), 'El cursor de vidrio con viento.'], ['smooth', 'Desplazamiento suave', 'La ruedita baja la página sin saltos.'], ['bg', 'Fondo animado', 'Los colores se mueven y giran al bajar.'], ['glass', 'Efecto vidrio', 'Ventanas y paneles que parecen de vidrio.'], ['anim', 'Animaciones', 'Escritura letra por letra, golpe de cristal y agua.'], ['favAnim', 'Icono animado', 'El péndulo (o el destello de Flow) en el icono de la pestaña.'], ['sound', 'Sonidos', 'La voz de SynthonIA, las teclas, las transiciones y los avisos. Apágalos si te molestan.'], ['beginner', 'Modo principiante', 'Las IA te responden con palabras sencillas, paso a paso y con ejemplos.']];
function cfgModal(){
  if ($('#cfgm')) return;
  const draft = Object.assign({}, CFG);
  const o = document.createElement('div'); o.id = 'cfgm'; o.className = 'szm';
  const row = ([k, t, s]) => '<div class="cfgrow"><p>' + t + '<small>' + s + '</small></p><button class="cfgsw" type="button" role="switch" data-k="' + k + '" aria-checked="' + !!draft[k] + '" aria-pressed="' + !!draft[k] + '" aria-label="' + t + '"></button></div>';
  const IN = [['always', 'Cada vez'], ['session', 'Una vez por visita'], ['never', 'Nunca']];
  o.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Configuración"><div class="word">' + zWord('Synth') + '</div><div class="tn">CONFIGURACIÓN</div><div class="tb"><h3>Configuración</h3><p>Elige si lo quieres más bonito o más rápido, y luego ajusta cada detalle a tu gusto.</p></div>'
    + '<div class="cfglbl">Experiencia</div><div id="cfgCh"></div>'
    + '<div class="cfglbl">Detalles</div><div id="cfgRows">' + CFG_ROWS.map(row).join('') + '</div>'
    + '<div class="cfglbl">Intro de la página</div><div class="cfgseg" id="cfgIn">' + IN.map(([v, l]) => '<button type="button" data-in="' + v + '" aria-pressed="' + (draft.intro === v) + '">' + l + '</button>').join('') + '</div><p class="cnote">La animación al entrar al chat siempre se ve.</p>'
    + '<div class="tbtn" style="margin-top:18px"><button class="lnk" type="button" data-close>Cerrar</button><button class="btn sm" type="button" id="cfgOk">Guardar</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  $('.tcard', o).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:600, easing:'cubic-bezier(.22,1,.36,1)' });
  const paintRows = () => $$('.cfgsw', o).forEach(b => { b.setAttribute('aria-pressed', String(!!draft[b.dataset.k])); b.setAttribute('aria-checked', String(!!draft[b.dataset.k])); });
  cfgChooser($('#cfgCh', o), draft.perf, v => { draft.perf = v; Object.assign(draft, cfgPreset(v)); paintRows(); });
  $$('.cfgsw', o).forEach(b => b.addEventListener('click', () => { draft[b.dataset.k] = !draft[b.dataset.k]; paintRows(); }));
  $$('[data-in]', o).forEach(b => b.addEventListener('click', () => { draft.intro = b.dataset.in; $$('[data-in]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 450); };
  $('[data-close]', o).addEventListener('click', close);
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  $('#cfgOk', o).addEventListener('click', () => applyCfg(draft, close));
}
function applyCfg(draft, close){
  const reload = draft.anim !== CFG.anim || (draft.cursor !== CFG.cursor && matchMedia('(pointer: fine)').matches) || (draft.bg && !!$('.aurora') && !$('.aurora .orbit'));
  Object.assign(CFG, draft, { v:2 }); saveCfg(); cfgClasses();
  if (CFG.favAnim && window.__favStart) window.__favStart();
  if (close) close();
  if (reload){ toast('Aplicando tu configuración…'); setTimeout(() => location.reload(), 900); }
  else toast('Configuración guardada.');
}
/* Esc cierra la ventana flotante que esté arriba */
addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const c = [...document.querySelectorAll('.szm [data-close], .szm [data-d="x"], #blk #bClose, #acc #aClose, #sx #sxClose, #conn #cClose, #szChat [data-cx]')].filter(x => x.isConnected && !x.closest('.bye')).pop();
  if (c){ e.preventDefault(); c.click(); }
});

/* el péndulo del logo se frena con suavidad cuando lo señalas y vuelve a moverse al salir */
function calmMark(host, on){
  host.querySelectorAll('.mark .sw').forEach(g => {
    if (on){
      if (g._calm) return; g._calm = true;
      const tf = getComputedStyle(g).transform;
      g.style.animation = 'none';
      if (tf && tf !== 'none' && !reduce) g.animate([{ transform:tf }, { transform:'rotate(0deg)' }], { duration:700, easing:'cubic-bezier(.22,1,.36,1)' });
    } else if (g._calm){ g._calm = false; g.style.animation = ''; }
  });
}
document.addEventListener('pointerover', e => { const h = e.target.closest && e.target.closest('.logo, a, button'); if (h && h.querySelector('.mark .sw')) calmMark(h, true); });
document.addEventListener('pointerout', e => { const h = e.target.closest && e.target.closest('.logo, a, button'); if (h && !(e.relatedTarget && h.contains(e.relatedTarget)) && h.querySelector('.mark .sw')) calmMark(h, false); });

/* clic con el botón del medio: el cursor cambia al de desplazamiento automático */
if (document.getElementById('cm')){
  let midT = 0;
  const midOff = () => root.classList.remove('cursor-mid');
  addEventListener('pointerdown', e => { if (e.button === 1){ if (e.target.closest && e.target.closest('a')) return; root.classList.toggle('cursor-mid'); midT = performance.now(); } else midOff(); }, true);
  addEventListener('pointerup', e => { if (e.button === 1 && performance.now() - midT > 350) midOff(); }, true);
  addEventListener('keydown', midOff); addEventListener('blur', midOff); addEventListener('wheel', e => { if (!e.buttons) midOff(); }, { passive:true });
}

