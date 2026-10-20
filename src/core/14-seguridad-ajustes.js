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
/* v2.2 · Ajustes con 2 pestañas: «Página» (cómo se ve y se siente) e «IAs y memoria» (cómo te responden y qué recuerdan de ti) */
const CFG_PAGE = CFG_ROWS.filter(r => r[0] !== 'beginner');
const CFG_IA = [['beginner', 'Modo principiante', 'Te responden con palabras sencillas, paso a paso y con ejemplos.'], ['autoWeb', 'Buscar en internet cuando haga falta', 'Si preguntas por algo de hoy (precios, noticias, el clima…), la IA busca sola y te muestra sus fuentes.'], ['saver', 'Respuestas cortas', 'Respuestas más breves: gastas menos de tu límite de hoy.']];
const memSt0 = () => state.mem || (state.mem = { on:true, t:0, items:[] });
function memTouch(){ const m = memSt0(); m.t = Date.now(); save(); try{ if (ACC.ready) accPush(); }catch(e){} }
function memAddCore(text){
  const m = memSt0(), t = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 300); if (t.length < 3) return false;
  if (!m.items.some(x => x.text.toLowerCase() === t.toLowerCase())) m.items.unshift({ id:'m' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), t:Date.now(), text:t });
  m.items = m.items.slice(0, 40); memTouch(); return true;
}
/* la lista de «Lo que recuerdo de ti»: se ve, se agrega, se olvida */
function memPanel(host){
  const paint = () => {
    const m = memSt0();
    host.innerHTML = '<div class="cfgrow"><p>Usar mi memoria<small>Las IAs usan esto para responderte mejor. Si la apagas, no se usa (pero no se borra).</small></p><button class="cfgsw" type="button" role="switch" data-mem="on" aria-checked="' + m.on + '" aria-pressed="' + m.on + '" aria-label="Usar mi memoria"><i></i></button></div>'
      + '<ul class="meml">' + (m.items.length ? m.items.map(x => '<li><span></span><button type="button" class="lnk" data-del="' + x.id + '">Olvidar</button></li>').join('') : '<li class="memnone">Todavía no recuerdo nada. Escribe «recuerda que…» en el chat o agrégalo aquí.</li>') + '</ul>'
      + '<form class="memadd"><label class="field"><input type="text" maxlength="300" placeholder="Ej.: Me llamo Ana y estudio diseño gráfico" aria-label="Algo para recordar"></label><button class="btn sm" type="submit">Agregar</button></form>'
      + (m.items.length ? '<button class="lnk memclr" type="button" data-mem="clear">Olvidar todo</button>' : '');
    const L = $$('.meml li span', host); m.items.forEach((x, i) => { if (L[i]) L[i].textContent = x.text; });
  };
  paint();
  host.addEventListener('submit', e => { e.preventDefault(); const i = $('.memadd input', host); if (memAddCore(i.value)){ paint(); toast('Agregado a tu memoria.'); } });
  host.addEventListener('click', async e => {
    const d = e.target.closest('[data-del]'); if (d){ const m = memSt0(); m.items = m.items.filter(x => x.id !== d.dataset.del); memTouch(); paint(); return; }
    const t = e.target.closest('[data-mem]'); if (!t) return; const m = memSt0();
    if (t.dataset.mem === 'on'){ m.on = !m.on; memTouch(); paint(); }
    else if (t.dataset.mem === 'clear' && await szConfirm('¿Olvidar todo?', 'Borro todo lo que recuerdo de ti. No se puede deshacer.', 'Olvidar todo', true)){ m.items = []; memTouch(); paint(); }
  });
}
/* cada página agrega aquí sus atajos de «Tus IAs» (elegir IA ideales, conectar, Drive…) */
const cfgLinks = [];
function cfgModal(tab){
  if ($('#cfgm')) return;
  const draft = Object.assign({ autoWeb:true }, CFG); draft.saver = !!(state.sx && state.sx.saver);
  const o = document.createElement('div'); o.id = 'cfgm'; o.className = 'szm';
  const row = ([k, t, s]) => '<div class="cfgrow"><p>' + t + '<small>' + s + '</small></p><button class="cfgsw" type="button" role="switch" data-k="' + k + '" aria-checked="' + !!draft[k] + '" aria-pressed="' + !!draft[k] + '" aria-label="' + t + '"></button></div>';
  const IN = [['always', 'Cada vez'], ['session', 'Una vez por visita'], ['never', 'Nunca']];
  const ia = tab === 'ia' || tab === 'mem';
  o.innerHTML = '<div class="tcard cfgcard" role="dialog" aria-modal="true" aria-label="Ajustes"><div class="cfghead"><h3>Ajustes</h3>'
    + '<div class="cfgtabs" role="tablist"><span class="pill"></span><button type="button" role="tab" data-tab="page" aria-selected="' + !ia + '">Página</button><button type="button" role="tab" data-tab="ia" aria-selected="' + ia + '">IAs y memoria</button></div></div>'
    + '<div class="cfgbody">'
    + '<section class="cfgpane" data-pane="page"' + (ia ? ' hidden' : '') + '>'
    + '<div class="cfglbl">Cómo se ve</div><div id="cfgCh"></div>'
    + '<div class="cfglbl">Detalles</div><div id="cfgRows">' + CFG_PAGE.map(row).join('') + '</div>'
    + '<div class="cfglbl">Intro de la página</div><div class="cfgseg" id="cfgIn">' + IN.map(([v, l]) => '<button type="button" data-in="' + v + '" aria-pressed="' + (draft.intro === v) + '">' + l + '</button>').join('') + '</div><p class="cnote">La animación al entrar al chat siempre se ve.</p>'
    + '</section>'
    + '<section class="cfgpane" data-pane="ia"' + (ia ? '' : ' hidden') + '>'
    + '<div class="cfglbl">Cómo te responden</div>' + CFG_IA.map(row).join('')
    + '<div class="cfglbl" id="cfgMemL">Lo que recuerdo de ti</div><div id="szMem" class="cfgmem"></div>'
    + (cfgLinks.length ? '<div class="cfglbl">Tus IAs</div><div class="cfglinks">' + cfgLinks.map(([l, , d], i) => '<button type="button" class="cfglk" data-lk="' + i + '"><b>' + esc(l) + '</b><small>' + esc(d || '') + '</small><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>').join('') + '</div>' : '')
    + '</section></div>'
    + '<div class="tbtn cfgfoot"><button class="lnk" type="button" data-close>Cerrar</button><button class="btn sm" type="button" id="cfgOk">Guardar</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  $('.tcard', o).animate([{ transform:'scale(.94) translateY(16px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:560, easing:'cubic-bezier(.22,1,.36,1)' });
  const paintRows = () => $$('.cfgsw[data-k]', o).forEach(b => { b.setAttribute('aria-pressed', String(!!draft[b.dataset.k])); b.setAttribute('aria-checked', String(!!draft[b.dataset.k])); });
  cfgChooser($('#cfgCh', o), draft.perf, v => { draft.perf = v; Object.assign(draft, cfgPreset(v)); paintRows(); });
  memPanel($('#szMem', o));
  $$('.cfgsw[data-k]', o).forEach(b => b.addEventListener('click', () => { draft[b.dataset.k] = !draft[b.dataset.k]; paintRows(); }));
  $$('[data-in]', o).forEach(b => b.addEventListener('click', () => { draft.intro = b.dataset.in; $$('[data-in]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  const tabs = $('.cfgtabs', o), pill = $('.pill', tabs);
  const show = k => { $$('[role=tab]', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === k))); $$('.cfgpane', o).forEach(p => { p.hidden = p.dataset.pane !== k; }); const b = $('[data-tab="' + k + '"]', tabs); if (b && pill){ pill.style.width = b.offsetWidth + 'px'; pill.style.transform = 'translateX(' + (b.offsetLeft - 4) + 'px)'; } $('.cfgbody', o).scrollTop = 0; };
  tabs.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) show(b.dataset.tab); });
  requestAnimationFrame(() => show(ia ? 'ia' : 'page'));
  if (tab === 'mem') setTimeout(() => { const l = $('#cfgMemL', o); if (l) l.scrollIntoView({ block:'start', behavior:reduce ? 'auto' : 'smooth' }); }, 350);
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 450); };
  $$('.cfglk', o).forEach(b => b.addEventListener('click', () => { const L = cfgLinks[+b.dataset.lk]; close(); if (L) setTimeout(L[1], 200); }));
  $('[data-close]', o).addEventListener('click', close);
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  $('#cfgOk', o).addEventListener('click', () => { state.sx = state.sx || {}; if (!!state.sx.saver !== !!draft.saver){ state.sx.saver = !!draft.saver; save(); try{ hooks.usage(); }catch(e){} try{ dispatchEvent(new Event('synthz-saver')); }catch(e){} } const d = Object.assign({}, draft); delete d.saver; applyCfg(d, close); });
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

