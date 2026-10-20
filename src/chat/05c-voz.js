/* ---------- v2.0 · voz: cada familia de IA habla con su propia voz (GPT una, Mistral otra, Gemini otra…) ----------
   Usa la voz que ya trae tu navegador o tu celular: gratis y sin enviar nada a internet. */
const VOZ_FAM = {
  openai:[1.0, 1.02], gemini:[1.18, 1.05], gemma:[1.28, 1.08], google:[1.18, 1.05], anthropic:[.9, .96], claude:[.9, .96], meta:[.82, 1.0], llama:[.82, 1.0],
  mistral:[1.32, 1.1], mistralai:[1.32, 1.1], deepseek:[.74, .94], qwen:[1.4, 1.12], xai:[.66, 1.04], grok:[.66, 1.04], moonshot:[1.08, .92], kimi:[1.08, .92],
  microsoft:[.96, 1.06], nvidia:[.88, 1.02], cohere:[1.12, .98], synthz:[1.06, 1.0], imagen:[1.06, 1.0]
};
const famOfEl = el => String((el && el.dataset.brand) || 'synthz').toLowerCase();
let vozCur = null;
function vocesEs(){ const V = (window.speechSynthesis && speechSynthesis.getVoices()) || []; const es = V.filter(v => /^es/i.test(v.lang)); return es.length ? es : V; }
/* a cada familia le toca siempre la misma voz (si tu equipo tiene varias en español) y su propio tono y velocidad */
function vozDe(fam){
  const V = vocesEs(), keys = Object.keys(VOZ_FAM), i = Math.max(0, keys.indexOf(fam));
  const [pitch, rate] = VOZ_FAM[fam] || [1, 1];
  return { voice:V.length ? V[i % V.length] : null, pitch, rate };
}
const textoParaLeer = el => { const b = $('.body', el); if (!b) return ''; const c = b.cloneNode(true); $$('pre, .fcard, .cnv, .szimg, .katex-mathml, math', c).forEach(x => x.replaceWith(document.createTextNode(' (aquí hay un código o un archivo) '))); return c.textContent.replace(/\s+/g, ' ').trim().slice(0, 4000); };
function vozParar(){ try{ speechSynthesis.cancel(); }catch(e){} if (vozCur){ vozCur.classList.remove('on'); const s = $('span', vozCur); if (s) s.textContent = 'Escuchar'; vozCur = null; } }
function vozLeer(btn){
  if (!('speechSynthesis' in window)){ toast('Tu navegador no tiene voz. Prueba con Chrome, Edge o Safari.'); return; }
  if (vozCur === btn){ vozParar(); return; }
  vozParar();
  const el = btn.closest('.m.bot'), txt = textoParaLeer(el); if (!txt) return;
  const fam = famOfEl(el), V = vozDe(fam);
  /* se lee por frases (así no se corta en textos largos) */
  const parts = txt.match(/[^.!?¡¿\n]{1,220}[.!?]*|.+$/g) || [txt];
  vozCur = btn; btn.classList.add('on'); const s = $('span', btn); if (s) s.textContent = 'Detener';
  parts.forEach((t, i) => { const u = new SpeechSynthesisUtterance(t.trim()); if (V.voice) u.voice = V.voice; u.lang = (V.voice && V.voice.lang) || 'es-ES'; u.pitch = V.pitch; u.rate = V.rate; if (i === parts.length - 1) u.onend = () => { if (vozCur === btn) vozParar(); }; u.onerror = () => { if (vozCur === btn) vozParar(); }; speechSynthesis.speak(u); });
}
if ('speechSynthesis' in window){ try{ speechSynthesis.getVoices(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', () => {}); }catch(e){} }
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-a="voice"]'); if (b){ e.stopPropagation(); vozLeer(b); } }, true);
addEventListener('pagehide', vozParar);
