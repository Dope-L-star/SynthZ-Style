/* ---------- v3.4 · respuestas de primer nivel (pedido de Sammuel, 28 oct) ----------
   1) Todas las IAs reciben las mismas reglas de calidad: entender bien, pensar con lógica, revisar datos y cálculos, no inventar, ir al grano.
   2) «Revisión de lógica» (Ajustes › IAs, encendida de inicio): cuando la respuesta llega, la misma IA la relee como revisora.
      Si está bien dice APROBADA y no se toca; si encuentra errores o le falta algo, la respuesta se cambia por la corregida.
      Todo dentro de 30 s contando la respuesta; si no alcanza, se queda la primera. */
const QUALITY = 'Eres una IA de primer nivel dentro de SymphorIA. Antes de responder, entiende qué te piden y qué necesita de verdad la persona. Razona paso a paso por dentro, y en la respuesta muestra solo lo útil. Sé exacta: revisa cálculos, fechas, unidades y la lógica de cada paso; si algo no lo sabes o puede haber cambiado, dilo en vez de inventar. Empieza por la respuesta directa y luego explica. Usa estructura clara (títulos cortos, listas, tablas o bloques de código) solo cuando ayude. Si hay imágenes o archivos, básate en lo que muestran. Si la pregunta se puede entender de varias formas, elige la más probable, dilo en una línea y responde. Escribe en el idioma de la persona, con tono cercano y sin relleno.';
const REV_SYS = 'Eres el revisor de calidad de SymphorIA. Recibes la pregunta de una persona y la respuesta que le dio una IA. Revísala con cuidado: ¿responde lo que se pidió?, ¿los datos, cálculos y la lógica son correctos?, ¿falta algo importante?, ¿se entiende? Si la respuesta está bien, escribe solo la palabra APROBADA y nada más. Si tiene errores, le falta algo importante o no responde lo pedido, escribe SOLO la respuesta corregida y completa, lista para la persona: mismo idioma, mismo formato (markdown, código) y sin mencionar que hubo una revisión.';
const REV_MAX = 30000;
function reviewWorth(q, a, r){
  if (SZ.CFG.review === false || st().sx.saver || !r || r.cached || r.aborted || r.cut || r.finish === 'length') return false;
  const qt = String((q && (q.ask || q.content)) || '').trim();
  if (a.length < 160 || a.length > 7000 || (r.ms || 0) > REV_MAX - 7000) return false;
  if (qt.length < 40 && /^(hola|holi|buenas|gracias|ok|vale|chao|adi[oó]s|hi|hello|hey|thanks|thank you)\b/i.test(qt)) return false;
  return true;
}
async function reviewAfter(el, msg, chat, mid, r, onFix){
  const i = chat.indexOf(msg), q = i > 0 ? chat[i - 1] : null, a = String(msg.content || '');
  if (!q || q.role !== 'user' || !reviewWorth(q, a, r)) return;
  if ((q.files || []).some(f => f.kind === 'img' && !f.seen)) return;   /* la revisora no ve la foto: no corrige lo que dependa de ella */
  let qt = String(q.ask || q.content || '');
  (q.files || []).forEach(f => { qt += f.seen ? '\n[Imagen adjunta ' + f.name + ', descrita así:] ' + f.seen.slice(0, 3000) : f.text ? '\n[Archivo adjunto ' + f.name + ':]\n' + f.text.slice(0, 3000) : ''; });
  const tag = document.createElement('div'); tag.className = 'rvw'; tag.setAttribute('role', 'status');
  tag.innerHTML = '<i aria-hidden="true"></i><span>Revisando la lógica…</span>';
  const body = $('.body', el); if (body) body.after(tag);
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), Math.max(6000, REV_MAX - (r.ms || 0))); ctls.add(ctl);
  let rr = null;
  try{ rr = await SZ.askStream(OR, [{ role:'system', content:REV_SYS }, { role:'user', content:'PREGUNTA DE LA PERSONA:\n' + qt.slice(0, 9000) + '\n\nRESPUESTA A REVISAR:\n' + a }], { model:mid, maxTokens:4000, signal:ctl.signal }); }
  catch(e){ rr = null; }
  finally{ clearTimeout(tm); ctls.delete(ctl); }
  if (rr && !rr.cached) addUsage(rr.prov || SZ.provOf(mid), rr.prompt, rr.completion, true, { est:rr.est, free:/:free$/.test(mid) || rr.prov === 'synthz', rid:rr.rid });
  const t = String((rr && rr.text) || '').trim();
  const fixed = rr && !rr.aborted && !rr.cut && rr.finish !== 'length' && t && !/^\W*(APROBADA|APPROVED)\b/i.test(t) && !/^\(La IA devolvió una respuesta vacía\.\)$/.test(t) && t.length >= a.length * .35 && t !== a;
  const bye = (txt, cls) => { $('span', tag).textContent = txt; tag.classList.add(cls); setTimeout(() => { tag.classList.add('out'); setTimeout(() => tag.remove(), 600); }, cls === 'ok' ? 2600 : 6000); };
  if (!fixed) return rr && !rr.aborted ? bye('✓ Lógica revisada', 'ok') : tag.remove();
  msg.content = t; msg.reviewed = true; msg.meta = String(msg.meta || '') + ' · ✓ revisada y mejorada'; touchThread(); save();
  try{ onFix && onFix(t); }catch(e){}
  if (el.isConnected && body){
    el._raw = t; body.classList.add('rvw-swap'); body.innerHTML = md(t); codeButtons(body); if (el._sources) citeLinks(body, el._sources);
    setTimeout(() => body.classList.remove('rvw-swap'), 900);
    const m = $('.meta', el); if (m) m.textContent = msg.meta;
  }
  bye('✨ Revisada: corregí y mejoré la respuesta', 'fix');
}
