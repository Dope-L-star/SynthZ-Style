/* ---------- v2.1 · memoria: SynthFlow recuerda lo que tú le pides (tu nombre, a qué te dedicas, cómo te gustan las respuestas)
   Solo guarda lo que tú apruebas, lo ves y lo borras cuando quieras. Con cuenta, te sigue a todos tus equipos. ---------- */
const MEM_RX = /\b(recuerda|recu[eé]rdalo|acu[eé]rdate|no (te )?olvides|ten en cuenta|guarda en tu memoria)\b\s*(que|de|esto|:)?\s*/i;
const memSt = () => st().mem || (st().mem = { on:true, t:0, items:[] });
function memAdd(text){
  const m = memSt(), t = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 300); if (t.length < 3) return false;
  if (m.items.some(x => x.text.toLowerCase() === t.toLowerCase())) return true;
  m.items.unshift({ id:'m' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), t:Date.now(), text:t }); m.items = m.items.slice(0, 40); m.t = Date.now(); save();
  try{ SZ.accPush && SZ.accPush(); }catch(e){} return true;
}
/* lo que la IA recibe (solo si la memoria está encendida) */
function memSystem(){ const m = memSt(); if (!m.on || !m.items.length) return ''; return 'Datos que la persona te pidió recordar (úsalos cuando sirvan, sin repetirlos todo el tiempo): ' + m.items.slice(0, 25).map(x => '- ' + x.text).join(' '); }
/* «¿Quieres que lo recuerde?» después de un mensaje que lo pide */
function memOffer(text){
  const i = text.search(MEM_RX); if (i < 0) return;
  let fact = text.slice(i).replace(MEM_RX, '').replace(/^[,.:;\s]+/, '').split(/(?<=[.!?])\s/)[0].trim();
  if (fact.length < 3) fact = text.trim(); fact = fact.slice(0, 300);
  $$('.memoff', lane).forEach(x => x.remove());
  const d = document.createElement('div'); d.className = 'agkeep memoff';
  d.innerHTML = '<span>¿Quieres que lo recuerde para tus próximos chats? «<b></b>»</span><div class="agk-b"><button type="button" class="btn sm" data-mm="yes">Recordar</button><button type="button" class="btn sm ghost" data-mm="no">No</button></div><small>Lo ves y lo borras cuando quieras en «⋯ › Lo que recuerdo de ti».</small>';
  $('span b', d).textContent = fact; lane.appendChild(d); follow();
  d.addEventListener('click', e => { const b = e.target.closest('[data-mm]'); if (!b) return; d.remove(); if (b.dataset.mm === 'yes' && memAdd(fact)) toast('¡Listo! Lo voy a recordar.'); });
}
function memModal(){
  if ($('#szMem')) return;
  const w = document.createElement('div'); w.id = 'szMem'; w.className = 'szm';
  const paint = () => {
    const m = memSt();
    w.innerHTML = '<div class="tcard gq" role="dialog" aria-modal="true" aria-label="Lo que recuerdo de ti"><div class="gq-say"><span class="gq-f">' + SZ.face('guino', 64) + '</span><div><b>Memoria</b><p>Esto es lo que recuerdo de ti. Lo uso para responderte mejor en todos tus chats.</p></div></div>'
      + '<div class="cfgrow"><p>Usar mi memoria<small>Si la apagas, no la uso (pero no se borra).</small></p><button class="cfgsw" type="button" role="switch" data-mem="on" aria-checked="' + m.on + '" aria-pressed="' + m.on + '" aria-label="Usar mi memoria"><i></i></button></div>'
      + '<ul class="meml">' + (m.items.length ? m.items.map(x => '<li><span></span><button type="button" class="lnk" data-del="' + x.id + '" aria-label="Olvidar">Olvidar</button></li>').join('') : '<li class="memnone">Todavía no recuerdo nada. Escribe «recuerda que…» en el chat o agrégalo aquí.</li>') + '</ul>'
      + '<form class="memadd"><label class="field"><input type="text" maxlength="300" placeholder="Ej.: Me llamo Ana y estudio diseño gráfico" aria-label="Algo para recordar"></label><button class="btn sm" type="submit">Agregar</button></form>'
      + '<div class="tbtn gq-b"><button class="lnk" type="button" data-mem="clear"' + (m.items.length ? '' : ' hidden') + '>Olvidar todo</button><button class="btn sm" type="button" data-close>Listo</button></div></div>';
    const L = $$('.meml li span', w); m.items.forEach((x, i) => { if (L[i]) L[i].textContent = x.text; });
    $('.memadd', w).addEventListener('submit', e => { e.preventDefault(); const v = $('.memadd input', w).value; if (memAdd(v)){ paint(); toast('Agregado a tu memoria.'); } });
  };
  paint(); document.body.appendChild(w); requestAnimationFrame(() => w.classList.add('on'));
  const close = () => { w.classList.remove('on'); setTimeout(() => w.remove(), 420); };
  w.addEventListener('click', async e => {
    if (e.target === w || e.target.closest('[data-close]')) return close();
    const d = e.target.closest('[data-del]'); if (d){ const m = memSt(); m.items = m.items.filter(x => x.id !== d.dataset.del); m.t = Date.now(); save(); try{ SZ.accPush && SZ.accPush(); }catch(x){} paint(); return; }
    const t = e.target.closest('[data-mem]'); if (!t) return;
    const m = memSt();
    if (t.dataset.mem === 'on'){ m.on = !m.on; m.t = Date.now(); save(); try{ SZ.accPush && SZ.accPush(); }catch(x){} paint(); }
    else if (t.dataset.mem === 'clear' && await SZ.szConfirm('¿Olvidar todo?', 'Borro todo lo que recuerdo de ti. No se puede deshacer.', 'Olvidar todo', true)){ m.items = []; m.t = Date.now(); save(); try{ SZ.accPush && SZ.accPush(); }catch(x){} paint(); }
  });
}
