/* ---------- v2: escritura con brillo, golpe de cristal, portal Z y agua ---------- */
function mirrorType(ta){
  if (!ta || ta._sync || reduce) return;
  const fld = ta.closest('.field'); if (!fld) return;
  const m = document.createElement('div'); m.className = 'mir'; m.setAttribute('aria-hidden', 'true');
  fld.classList.add('mw'); fld.insertBefore(m, ta);
  /* v1.3: el dueño prefirió la rayita normal del navegador (la propia se quitó) */
  let prev = '', kind = '';
  const css = () => { const c = getComputedStyle(ta); ['font', 'padding', 'lineHeight', 'letterSpacing', 'textIndent', 'tabSize'].forEach(k => { m.style[k] = c[k]; }); };
  const spans = s => [...s].map((ch, i) => '<span class="nw" style="animation-delay:' + Math.min(i * 12, 420) + 'ms">' + esc(ch) + '</span>').join('');
  /* dónde queda la letra número «off» dentro del espejo */
  function rectAt(off){
    const w = document.createTreeWalker(m, NodeFilter.SHOW_TEXT); let n, left = off;
    while ((n = w.nextNode())){
      const L = n.nodeValue.length;
      if (left <= L && !(left === L && n.nodeValue !== '​' && w.nextNode && false)){
        const r = document.createRange();
        if (left < L){ r.setStart(n, left); r.setEnd(n, left + 1); const rs = r.getClientRects(); if (rs.length) return { x:rs[0].left, y:rs[0].top, h:rs[0].height }; }
        if (left > 0){ r.setStart(n, left - 1); r.setEnd(n, left); const rs = r.getClientRects(); if (rs.length){ const q = rs[rs.length - 1]; return { x:q.right, y:q.top, h:q.height }; } }
      }
      left -= L; if (left < 0) break;
    }
    const fr = m.getBoundingClientRect(), c = getComputedStyle(ta);
    return { x:fr.left + parseFloat(c.paddingLeft), y:fr.top + parseFloat(c.paddingTop), h:parseFloat(c.lineHeight) || 20 };
  }
  function placeCaret(){}
  /* al borrar: las letras se desprenden, flotan y se desvanecen */
  function ghosts(txt, from){
    if (!txt || root.classList.contains('noanim')) return;
    const fr = fld.getBoundingClientRect(), list = [...txt].slice(-36);
    list.forEach((ch, i) => {
      if (!ch.trim()) return;
      const p = rectAt(from + (txt.length - list.length) + i), g = document.createElement('span');
      g.className = 'mghost'; g.textContent = ch; g.style.font = getComputedStyle(ta).font;
      g.style.left = (p.x - fr.left) + 'px'; g.style.top = (p.y - fr.top) + 'px'; fld.appendChild(g);
      const dx = (Math.random() - .5) * 26, rot = (Math.random() - .5) * 50, d = Math.min(i, 20) * 14;
      g.animate([{ transform:'translate(0,0) rotate(0)', opacity:1, filter:'blur(0)', color:'#ecebe7' }, { transform:'translate(' + (dx * .4) + 'px,-6px) rotate(' + (rot * .3) + 'deg) scale(1.15)', opacity:1, color:'#ff8f7a', offset:.25 }, { transform:'translate(' + dx + 'px,-26px) rotate(' + rot + 'deg) scale(.4)', opacity:0, filter:'blur(4px)', color:'#c9566c' }], { duration:620, delay:d, easing:'cubic-bezier(.22,1,.36,1)', fill:'both' }).onfinish = () => g.remove();
    });
  }
  const sync = () => {
    const v = ta.value;
    if (v === prev){ m.scrollTop = ta.scrollTop; placeCaret(false); return; }
    css();
    let a = 0; while (a < prev.length && a < v.length && prev[a] === v[a]) a++;
    let b = 0; while (b < prev.length - a && b < v.length - a && prev[prev.length - 1 - b] === v[v.length - 1 - b]) b++;
    const mid = v.slice(a, v.length - b), gone = prev.slice(a, prev.length - b);
    if (gone && /^delete/.test(kind)) ghosts(gone, a);
    if (b === 0 && a === prev.length && m.lastChild && m.lastChild.nodeType === 3 && prev){
      const t = document.createElement('template'); t.innerHTML = spans(mid); m.insertBefore(t.content, m.lastChild);
    } else {
      m.innerHTML = esc(v.slice(0, a)) + spans(mid) + esc(v.slice(v.length - b));
      m.appendChild(document.createTextNode('​'));
    }
    prev = v; m.scrollTop = ta.scrollTop; kind = '';
    placeCaret(mid.length > 0 && mid.length < 4);
    /* cuando terminan las animaciones, el espejo vuelve a ser texto normal (corta las palabras igual que la caja) */
    clearTimeout(m._n); m._n = setTimeout(() => { if (ta.value === prev && m.querySelector('.nw')){ m.textContent = prev; m.appendChild(document.createTextNode('\u200b')); m.scrollTop = ta.scrollTop; placeCaret(false); } }, 900);
  };
  ta._sync = sync;
  ta.addEventListener('beforeinput', e => { kind = e.inputType || ''; });
  ta.addEventListener('input', sync);
  ta.addEventListener('scroll', () => { m.scrollTop = ta.scrollTop; placeCaret(false); });
  ['focus', 'click', 'keyup', 'select'].forEach(ev => ta.addEventListener(ev, () => requestAnimationFrame(() => placeCaret(false))));
  /* (sin rayita propia) */
  document.addEventListener('selectionchange', () => { if (document.activeElement === ta) placeCaret(false); });
  addEventListener('resize', () => placeCaret(false));
  m.appendChild(document.createTextNode('​')); sync();
}
/* golpe suave de cristal: como el clic del mouse pero más lento, borroso y con efecto glass */
function thud(x, y){
  if (reduce) return;
  const big = Math.hypot(innerWidth, innerHeight) * 2.2 / 46, ring = 'radial-gradient(circle,transparent 58%,#000 60%,#000 72%,transparent 74%)';
  const base = 'position:fixed;left:' + x + 'px;top:' + y + 'px;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;pointer-events:none;';
  const g = document.createElement('i');
  g.style.cssText = base + 'z-index:9989;mix-blend-mode:screen;filter:blur(7px);background:radial-gradient(circle,rgba(214,204,255,.85),rgba(143,176,255,.42) 36%,rgba(255,143,122,.16) 56%,transparent 70%)';
  const r = document.createElement('i');
  r.style.cssText = base + 'z-index:9990;background:rgba(255,255,255,.1);backdrop-filter:blur(9px) saturate(1.6) brightness(1.18);-webkit-backdrop-filter:blur(9px) saturate(1.6) brightness(1.18);box-shadow:inset 0 0 0 1px rgba(255,255,255,.3);-webkit-mask:' + ring + ';mask:' + ring + ';filter:blur(1.5px)';
  document.body.append(g, r);
  g.animate([{ transform:'scale(.2)', opacity:0 }, { transform:'scale(3.2)', opacity:1, offset:.14 }, { transform:'scale(' + (big * .6).toFixed(1) + ')', opacity:0 }], { duration:2700, easing:'cubic-bezier(.16,.8,.3,1)', fill:'both' }).onfinish = () => g.remove();
  r.animate([{ transform:'scale(.3)', opacity:0 }, { transform:'scale(1.2)', opacity:1, offset:.1 }, { transform:'scale(' + big.toFixed(1) + ')', opacity:0 }], { duration:3000, easing:'cubic-bezier(.16,.8,.3,1)', fill:'both' }).onfinish = () => r.remove();
}
/* portal: la Z carga, se hace zoom hacia adentro y se entra al chat */
const zoomK = () => Math.hypot(innerWidth, innerHeight) / 2 / ((132 / 48) * 4.7) * 1.12;
const portalPaint = (p, k) => p.setAttribute('transform', 'translate(24 24) scale(' + k.toFixed(3) + ') translate(-24 -24)');
function zBox(host){
  const w = document.createElement('div'); w.className = 'pz';
  w.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="' + Z_PATH + '" fill="url(#zgrad)"/></svg>';
  host.appendChild(w); return { w, p: w.querySelector('path') };
}
function portalFill(host){ const z = zBox(host); portalPaint(z.p, zoomK()); return z.p; }
function portalReveal(p){
  if (!p) return; const K = zoomK(), t0 = performance.now(), D = 950;
  (function f(now){ const e = Math.min(1, (now - t0) / D); portalPaint(p, K * Math.pow(2.4, e)); if (e < 1) requestAnimationFrame(f); })(t0);
}
