/* ===== v2.6 · cada nombre propio se explica solo: pasas el mouse (o lo tocas) y dice qué es en pocas palabras.
   Se marca la primera vez que aparece en cada sección; los títulos, botones y enlaces quedan como están.
   Va antes que todo: la escritura letra por letra parte el texto en letras sueltas y ya no se podría encontrar la palabra. ===== */
(() => {
const DEF = {
  'SynthFlow':     'El chat de SymphorIA: ahí hablas con las IAs.',
  'SuperiorSynth': 'El modo que piensa mejor tu pedido y elige la IA que más sabe.',
  'SynthonIA':     'Tu ayudante: la robot que te guía por SymphorIA.',
  'EnerX':         'Tu energía gratis del día, como una batería: baja un poco con cada mensaje y se carga al 100 % a medianoche.',
  'A.L.I.A.S.':    'Un agente que cumple un objetivo paso a paso, y tú apruebas cada paso.',
  'Puter':         'Un servicio gratis: con tu cuenta usas ChatGPT, Claude y Gemini.',
  'IAs conectadas':'IAs gratis que ya vienen listas, sin cuenta ni tarjeta.'
};
const words = Object.keys(DEF).sort((a, b) => b.length - a.length);
const rx = new RegExp('(' + words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ")(?:'s)?", 'g');
const SKIP = 'h1,h2,h3,a,button,summary,label,input,textarea,.term,#szRoam,.hub,.band,.ready,.v24foot';
document.querySelectorAll('main > section').forEach(sec => {
  const done = new Set(), walker = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest(SKIP) || !n.nodeValue.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(n => {
    const t = n.nodeValue; rx.lastIndex = 0; let m, last = 0, frag = null;
    while ((m = rx.exec(t))){
      const w = m[1]; if (done.has(w)) continue; done.add(w);
      frag = frag || document.createDocumentFragment();
      frag.appendChild(document.createTextNode(t.slice(last, m.index)));
      const s = document.createElement('span'); s.className = 'term'; s.tabIndex = 0; s.dataset.def = DEF[w]; s.setAttribute('aria-description', DEF[w]); s.textContent = m[0];
      frag.appendChild(s); last = m.index + m[0].length;
    }
    if (frag){ frag.appendChild(document.createTextNode(t.slice(last))); n.replaceWith(frag); }
  });
});
})();
