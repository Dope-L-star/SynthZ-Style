/* ---------- ejemplos listos para usar ---------- */
const EXAMPLES = [
  ['Explícame una función de JavaScript', 'Explícame paso a paso qué hace esta función de JavaScript y cómo podría mejorarla:\n\n'],
  ['Ayúdame a estudiar un tema difícil', 'Ayúdame a estudiar este tema. Explícamelo como a un principiante, con un ejemplo y 3 preguntas para repasar. El tema es: '],
  ['Resume este documento', 'Resume este documento en 5 puntos clave y dime qué es lo más importante.', 'file'],
  ['Compara dos soluciones para un problema', 'Compara estas dos soluciones para el mismo problema. Dime ventajas, desventajas y cuál conviene:\n\nSolución A:\n\nSolución B:\n']
];
const DRAFTS = { study:[1, 'study'], code:[0, 'code'], create:[null, 'fast', 'Ayúdame a desarrollar esta idea. Hazme preguntas para aterrizarla y propón un plan en pasos. Mi idea es: '] };
function useExample(i){
  const x = EXAMPLES[i]; if (!x) return;
  typeIntoComposer(x[1], () => {
    if (x[2] === 'file' && !files.length){
      const a = $('#attachBtn'); a.classList.remove('pulse'); void a.offsetWidth; a.classList.add('pulse');
      toast('Adjunta el documento con el «+» y luego envía.');
    } else toast('Completa el mensaje y envíalo cuando quieras.');
  });
}
/* ---------- modo principiante: eliges qué quieres hacer y te sugiero un modelo con datos reales ---------- */
const INTENTS = [['fast', '⚡', 'Rápido'], ['code', '💻', 'Programar'], ['study', '📚', 'Estudiar'], ['deep', '🧠', 'Tareas complejas']];
const INTENT_NAME = Object.fromEntries(INTENTS.map(([k, , l]) => [k, l]));
function factsOf(m){
  const ex = SZ.expertOf(m).tags, F = [];
  if (m.reasoning) F.push(['reason', 'Piensa antes de responder', 'catálogo']);
  else if (ex.includes('reason')) F.push(['reason', 'Hecha para pensar con calma', 'su nombre o descripción']);
  if (ex.includes('code')) F.push(['code', 'Pensado para programar', 'su nombre o descripción']);
  if (ex.includes('fast')) F.push(['fast', 'Versión ligera', 'su nombre (no hay medición de velocidad)']);
  if (ex.includes('math')) F.push(['math', 'Matemáticas', 'su nombre o descripción']);
  if (ex.includes('lang')) F.push(['lang', 'Buen soporte de español', 'su familia de IA']);
  if (m.ctx) F.push(['ctx', kfmt(m.ctx) + ' de contexto', 'catálogo']);
  return F;
}
function recommend(k){
  const avail = cat.list.filter(m => connected(m.id) && (m.free || /^pu:/.test(m.id)) && !m.stub);
  if (!avail.length) return { none:'conn' };
  const W = { fast:{ fast:30, reason:-8 }, code:{ code:40, reason:8 }, study:{ reason:18, lang:10, ctx:0, write:6 }, deep:{ reason:40, code:6, math:6 } }[k];
  const sc = m => {
    const F = factsOf(m), has = x => F.some(f => f[0] === x), ex = SZ.expertOf(m).tags;
    let s = 0; Object.keys(W).forEach(x => { if (has(x) || (x === 'write' && ex.includes('write'))) s += W[x]; });
    if ((k === 'deep' || k === 'study') && m.ctx >= 120000) s += k === 'deep' ? 12 : 8;
    if (m.reasoning && W.reason > 0) s += 4;                       /* dato del catálogo: pesa un poco más que el nombre */
    if (/apodex/i.test(m.id)) s += 3;
    s += Math.min(6, SZ.surveyScore(m, st().survey) / 10);
    return s;
  };
  const best = avail.map(m => [m, sc(m)]).sort((a, b) => b[1] - a[1] || (b[0].ctx || 0) - (a[0].ctx || 0))[0];
  if (!best || best[1] < 20) return { none:'data' };
  return { m:best[0] };
}
function limitsOf(m){
  const L = [];
  if (/^sz:/.test(m.id)) L.push('Gratis: usa tu EnerX de hoy');
  else if (/^pu:/.test(m.id)) L.push('Con tu cuenta gratis de Puter');

  L.push(m.vision ? 'Acepta imágenes y PDF' : /^pu:/.test(m.id) ? 'No sabemos si esta IA ve fotos; los PDF y textos sí los lee' : 'No ve imágenes; los PDF y textos se leen como texto');
  return L;
}
function intentHtml(){
  const cur = st().intent && st().intent.id === selId() ? st().intent : null;
  let h = '<div class="intent"><p class="ilbl">¿Qué quieres hacer? Te sugiero una IA</p><div class="iseg" role="group" aria-label="Qué quieres hacer">'
    + INTENTS.map(([k, e, l]) => '<button type="button" data-intent="' + k + '" aria-pressed="' + !!(cur && cur.k === k) + '"><span aria-hidden="true">' + e + '</span>' + l + '</button>').join('') + '</div>';
  if (cur && cur.none) h += '<div class="ipick"><p>' + esc(cur.none) + '</p></div>';
  else if (cur){
    const m = info(cur.id);
    h += '<div class="ipick"><p>Para <b>' + esc(INTENT_NAME[cur.k]) + '</b> elegí <b>' + esc(m.name) + '</b>.</p>'
      + '<ul class="ifacts">' + factsOf(m).slice(0, 4).map(f => '<li><b>' + esc(f[1]) + '</b><small>según ' + esc(f[2]) + '</small></li>').join('') + '</ul>'
      + '<p class="ilim">' + limitsOf(m).map(esc).join(' · ') + '</p>'
      + '<button type="button" class="lnk" data-ichange>Cambiar de IA</button></div>';
  }
  return h + '</div>';
}
function chooseIntent(k){
  const r = recommend(k);
  if (r.none){
    st().intent = { k, id:selId(), none: r.none === 'conn' ? 'Conecta Puter para que pueda recomendarte una.' : 'Todavía no sé qué IA recomendarte para «' + INTENT_NAME[k] + '». Sigues con ' + info(selId()).name + '; puedes cambiarlo en la lista.' };
    save(); renderMsgs(); if (r.none === 'conn') openConnect(); return;
  }
  st().intent = { k, id:r.m.id };
  if (r.m.id !== selId()) pickModel(r.m.id); else { save(); renderMsgs(); }
  toast('Elegí ' + r.m.name + ' para ' + INTENT_NAME[k].toLowerCase() + '.');
}

function autoGrow(){ if (inp._sync) inp._sync(); inp.style.height = 'auto'; inp.style.height = Math.min(inp.scrollHeight, 170) + 'px'; }
function updateHint(){
  const h = $('#hintRight'); let rf = []; try{ rf = files.filter(f => f.state === 'ok'); }catch(e){}
  const has = inp.value.trim() || rf.length;
  let n = 0;
  if (has && mode === 'cmp') n = est(inp.value) * Math.max(1, st().cmp.length);
  else if (has){ try{ const draft = { role:'user', content:inp.value }; if (rf.length) draft.files = rf.map(f => ({ name:f.name, kind:f.kind, text:f.text })); n = msgCost(apiMsgs([...chatArr(), draft], info(selId()).vision)); }catch(e){ n = est(inp.value); } }
  const c = st().sx.saver && n ? 'respuestas cortas' : '';
  h.innerHTML = mode === 'cmp' ? (st().cmp.length ? 'Se envía a ' + st().cmp.length + (st().cmp.length === 1 ? ' modelo' : ' modelos') : 'Elige IA en la lista') + (c ? ' · ' + c : '')
    : (!needsConn() ? c : '<a href="#" data-conn>Conecta una IA para empezar</a>');
}
inp.addEventListener('input', () => { autoGrow(); updateHint(); });
/* en el celular (pantalla táctil) «Enter» da un salto de línea y se envía con el botón de enviar; en el computador Enter envía y Shift+Enter baja de línea */
const touchKb = () => { try{ return matchMedia('(hover: none) and (pointer: coarse)').matches; }catch(e){ return false; } };
{ const kh = document.querySelector('.kbdh'); if (kh && touchKb()) kh.textContent = 'Enter salta de línea · envía con la flecha'; }
inp.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
  if (touchKb() && !(e.ctrlKey || e.metaKey)) return;     /* deja el salto de línea normal */
  e.preventDefault(); send();
});
sendBtn.addEventListener('click', () => { if (Object.keys(busy).length) stopNow(); else send(); });

/* v1.9 · la caja de escribir va mostrando ejemplos (todos distintos) para que se note que ahí se escribe */
const PH_EX = ['Escribe un correo para pedir un día libre', 'Dame 3 ideas de regalo por menos de 50.000 pesos', 'Explícame la fotosíntesis como a un niño', 'Resume este texto en 5 puntos', 'Hazme una rutina de ejercicio en casa', 'Corrige la ortografía de mi párrafo', 'Dame 5 nombres para una panadería', 'Traduce «buenos días, equipo» al inglés', 'Planea un viaje de 3 días a Cartagena', 'Escribe un post de Instagram para mi tienda', '¿Cómo saco el 20 % de 85.000?', 'Haz una lista de compras para la semana', 'Escribe un poema corto para mi mamá', 'Explícame qué es una tasa de interés', 'Hazme 10 preguntas para estudiar historia', 'Dame una receta con arroz, huevo y tomate', 'Escribe un mensaje para cobrarle a un cliente', 'Crea una página web sencilla de un portafolio', 'Explícame este error de Python', 'Dame ideas para un cumpleaños en casa', 'Escribe la descripción de un producto', 'Ayúdame a preparar una entrevista de trabajo', '¿Qué estudiar si me gustan los números?', 'Haz un horario para estudiar en la tarde', 'Escribe un cuento corto de miedo', 'Ordena estas tareas de la más urgente a la menos', 'Dame un plan para ahorrar 500.000 pesos', 'Explícame cómo funciona internet', 'Escribe un saludo para un grupo de WhatsApp', 'Hazme un guion para un video de 30 segundos', 'Compara dos celulares para comprar', 'Escribe una carta de renuncia amable', 'Dame frases para motivar a mi equipo', 'Diseña el logo de mi marca con palabras', 'Ayúdame a entender una factura', 'Haz un resumen de la Segunda Guerra Mundial'];
let phOrder = [], phT = 0, phIdx = 0;
function phNext(){
  if (!phOrder.length){ phOrder = PH_EX.map((_, i) => i).sort(() => Math.random() - .5); try{ const last = +localStorage.getItem('synthz:phlast'); if (phOrder[0] === last) phOrder.push(phOrder.shift()); }catch(e){} }
  const i = phOrder.shift(); try{ localStorage.setItem('synthz:phlast', String(i)); }catch(e){} return PH_EX[i];
}
function phFree(){ return mode === 'solo' && !isLocked() && !trialOn && !inp.value && !inp.readOnly; }
function phTick(){
  clearTimeout(phT);
  if (document.hidden || !phFree()){ phT = setTimeout(phTick, 1500); return; }
  const full = 'Ej.: ' + phNext(); let k = 0;
  const type = () => {
    if (!phFree()){ phT = setTimeout(phTick, 1500); return; }
    k++; inp.placeholder = full.slice(0, k) + (k < full.length ? '▍' : '');
    if (k < full.length) phT = setTimeout(type, SZ.reduce ? 0 : 34); else phT = setTimeout(phTick, 4200);
  };
  if (SZ.reduce){ inp.placeholder = full; phT = setTimeout(phTick, 5000); } else type();
}
setTimeout(phTick, 2500);
