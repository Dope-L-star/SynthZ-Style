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
      toast('Adjunta el documento con el clip 📎 y luego envía.');
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
  if (/^sz:/.test(m.id)) L.push('Gratis: usa tus mensajes de hoy');
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
inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing){ e.preventDefault(); send(); } });
sendBtn.addEventListener('click', () => { if (Object.keys(busy).length) stopNow(); else send(); });
