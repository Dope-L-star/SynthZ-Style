/* ---------- SynthonIA: su carita (SVG), con una expresión para cada momento ---------- */
const FACE_G = '#f6d9a0';
const FACE = (() => {
  const open = (dx, dy) => ['M' + (40 + dx) + ' ' + (48 + dy) + 'v8', 'M' + (60 + dx) + ' ' + (48 + dy) + 'v8'];
  const happy = ['M35 54q5-7 10 0', 'M55 54q5-7 10 0'];
  const heart = x => 'M' + x + ' 58l-5.5-5.5a3.2 3.2 0 0 1 5.5-4a3.2 3.2 0 0 1 5.5 4z';
  const star = x => 'M' + x + ' 45l1.8 3.8 4 .5-3 2.8.8 4-3.6-2-3.6 2 .8-4-3-2.8 4-.5z';
  const ring = x => 'M' + (x - 4.5) + ' 52a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0';
  return {
    feliz:{ e:open(0, 0), m:'M42 64q8 7 16 0', ck:1 },
    neutral:{ e:open(0, 0), m:'M45 66h10' },
    encantada:{ e:[heart(40), heart(60)], ec:'#ef7f93', ew:1.6, ef:'#ef7f93', m:'M41 63q9 10 18 0z', mf:1, ck:1 },
    riendo:{ e:happy, m:'M41 62q9 11 18 0z', mf:1, ck:1 },
    guino:{ e:['M40 48v8', 'M55 54q5-7 10 0'], m:'M42 64q8 7 16 0', ck:1 },
    pensando:{ e:open(3, -3), m:'M45 67q5-3 10-1', x:'M84 26h.1M91 16h.1', xw:5 },
    sorprendida:{ e:[ring(40), ring(60)], ew:3, ef:FACE_G, m:'M47 68a3 3 0 1 0 6 0a3 3 0 1 0-6 0', b:'M34 41l10-1M56 40l10 1' },
    senalando:{ e:open(4, 0), m:'M46 65q6 4 12 0' },
    disculpa:{ e:['M40 51v6', 'M60 51v6'], b:'M34 46l10-4M66 46l-10-4', m:'M43 69q7-6 14 0' },
    confundida:{ e:['M40 48v8', 'M60 51v3'], b:'M54 42l12-3', m:'M41 67q3-3 6 0t6 0t6 0' },
    dormida:{ e:['M35 52q5 4 10 0', 'M55 52q5 4 10 0'], ew:3.4, m:'M47 67h6', x:'M73 15h8l-8 9h8' },
    celebrando:{ e:[star(40), star(60)], ew:1.5, ef:FACE_G, m:'M41 62q9 11 18 0z', mf:1, ck:1, x:'M10 16l4 4M90 14l-4 5M6 32h5M94 30h-5', xw:2.6 },
    esperando:{ e:open(-3, -2), m:'M45 66h10', x:'M84 14a6 6 0 1 0 .01 0M84 11v3.5l2.5 2', xw:2 },
    flow:{ glasses:1, m:'M43 65q8 6 16-1', ck:1 },
    preocupada:{ e:open(0, 2), b:'M33 45l11-5M67 45l-11-5', m:'M42 70q4-4 8-1t8-1', drop:1 }
  };
})();
/* v1.4: caras nuevas: triste (si todo salió mal) y «¡ay!» (si le tocas el ojo) */
FACE.triste = { e:['M40 53v4', 'M60 53v4'], ew:6, b:'M32 47l11-5M68 47l-11-5', m:'M41 72q9-8 18 0' };
FACE.auch = { e:['M34 49l10 4-10 4', 'M55 53q5-4 10 0'], ew:3.4, b:'M32 43l12 5M57 45l10-3', m:'M41 70q4.5-4 9 0q4.5 4 9 0', x:'M78 30l4-6M84 36l6-2' };
const FACE_GOOD = ['feliz', 'riendo', 'guino', 'encantada', 'celebrando', 'flow'];
function face(mood, size, cls){
  const f = FACE[mood] || FACE.feliz, z = size || 40, G = FACE_G;
  const P = (d, st) => d ? '<path d="' + d + '" ' + st + '/>' : '';
  const eyes = f.glasses
    ? '<path d="M27 45h20v6.5a7 7 0 0 1-7 7h-6a7 7 0 0 1-7-7z" fill="#07070a" stroke="#e6b65f" stroke-width="2.2"/><path d="M53 45h20v6.5a7 7 0 0 1-7 7h-6a7 7 0 0 1-7-7z" fill="#07070a" stroke="#e6b65f" stroke-width="2.2"/><path d="M47 47.5q3-2.5 6 0" stroke="#e6b65f" stroke-width="2.2" fill="none"/><path d="M31 49l5-3M57 49l5-3" stroke="rgba(255,255,255,.55)" stroke-width="1.6" stroke-linecap="round"/>'
    : f.e.map(d => P(d, 'stroke="' + (f.ec || G) + '" stroke-width="' + (f.ew || 7) + '" stroke-linecap="round" stroke-linejoin="round" fill="' + (f.ef || 'none') + '"')).join('');
  return '<svg class="szface' + (cls ? ' ' + cls : '') + '" data-mood="' + (FACE[mood] ? mood : 'feliz') + '" viewBox="0 0 100 100" width="' + z + '" height="' + z + '" aria-hidden="true">'
    + '<path class="fa" d="M50 20V10" stroke="#e6b65f" stroke-width="2.5" stroke-linecap="round"/><circle class="fb" cx="50" cy="8" r="4.5" fill="#c9566c"/>'
    + '<rect x="6" y="46" width="8" height="18" rx="4" fill="#c9566c"/><rect x="86" y="46" width="8" height="18" rx="4" fill="#c9566c"/>'
    + '<rect x="12" y="20" width="76" height="70" rx="30" fill="#1d1518" stroke="#e6b65f" stroke-opacity=".55" stroke-width="2"/><rect x="21" y="31" width="58" height="49" rx="21" fill="#110c0e"/>'
    + (f.ck ? '<circle cx="31" cy="64" r="4.5" fill="#c9566c" fill-opacity=".55"/><circle cx="69" cy="64" r="4.5" fill="#c9566c" fill-opacity=".55"/>' : '')
    + P(f.b, 'stroke="' + G + '" stroke-width="2.6" stroke-linecap="round" fill="none"')
    + '<g class="fe">' + eyes + '</g>'
    + P(f.m, 'class="fm" stroke="' + G + '" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" fill="' + (f.mf ? G : 'none') + '"')
    + P(f.x, 'stroke="#e6b65f" stroke-width="' + (f.xw || 2.4) + '" stroke-linecap="round" stroke-linejoin="round" fill="none"')
    + (f.drop ? '<path class="fdrop" d="M83 28q-6 9-1 12.5q6 2.5 7-3.5q0-3-6-9z" fill="#8fd3e8" fill-opacity=".9"/>' : '')
    + '</svg>';
}
/* v1.9 · SynthonIA mueve la boca con cada letra que dice: a (abierta), e/i (ancha), o/u (redonda), m/b/p (cerrada) */
const VIS = { a:['M42 61.5q8-2 16 0q-1 9-8 9q-7 0-8-9z', 1], e:['M40.5 62.5q9.5-1.5 19 0q-2 5.5-9.5 5.5q-7.5 0-9.5-5.5z', 1], o:['M45.5 60.5q4.5-2 9 0q2.5 4.5 0 9q-4.5 2-9 0q-2.5-4.5 0-9z', 1], m:['M43 65h14', 0], c:['M42.5 63q7.5 4.5 15 0', 0] };
function visOf(ch){ const c = String(ch || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); return c === 'a' ? 'a' : (c === 'e' || c === 'i' || c === 'y') ? 'e' : (c === 'o' || c === 'u') ? 'o' : 'mbpfv'.includes(c) && c ? 'm' : /[a-zñ0-9]/.test(c) ? 'c' : 'm'; }
function mouthSet(svgs, v){
  svgs.forEach(s => { const m = s && s.querySelector && s.querySelector('.fm'); if (!m) return;
    if (m._d0 == null){ m._d0 = m.getAttribute('d'); m._f0 = m.getAttribute('fill'); }
    if (v === null){ m.setAttribute('d', m._d0); m.setAttribute('fill', m._f0); return; }
    m.setAttribute('d', VIS[v][0]); m.setAttribute('fill', VIS[v][1] ? FACE_G : 'none'); });
}
/* v2.2 · habla de verdad: la frase se parte en sílabas y la boca las «dice» a ritmo de voz (≈7 por segundo),
   con la forma de cada vocal (a abierta, e/i ancha, o/u redonda), labios cerrados en m/b/p y paso suave entre una y otra.
   Devuelve el «onFrame» para typeIn: arranca al primer cuadro y termina poco después de que se escribe todo. */
const MOUTH = { a:[7.2, 6.4], e:[9, 3.6], i:[8.4, 2.8], o:[4.8, 5.6], u:[3.8, 4.4], m:[7, .5], f:[6.4, 1.6], c:[6, 2.4], r:[5.4, 0] };
function syllables(text){
  const t = String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zñ\s]/g, ' ');
  const out = [];
  for (const w of t.split(/\s+/).filter(Boolean)){
    const parts = w.match(/[^aeiou]*[aeiou]+/g) || [w];
    for (const s of parts){
      const v = (s.match(/[aeiou]/) || ['a'])[0], c = s.replace(/[aeiou]+$/, '').slice(-1);
      if (c && 'mbp'.includes(c)) out.push('m'); else if (c && 'fv'.includes(c)) out.push('f');
      out.push(v);
    }
    out.push('r');                                   /* respiro entre palabras */
  }
  return out;
}
function talkEls(svg){
  if (svg._talk) return svg._talk;
  const NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'ftalk');
  const mo = document.createElementNS(NS, 'ellipse'), tg = document.createElementNS(NS, 'ellipse');
  mo.setAttribute('cx', '50'); mo.setAttribute('cy', '65'); mo.setAttribute('fill', '#2a0d18'); mo.setAttribute('stroke', FACE_G); mo.setAttribute('stroke-width', '3');
  tg.setAttribute('cx', '50'); tg.setAttribute('fill', '#e07a93');
  g.appendChild(mo); g.appendChild(tg); svg.appendChild(g);
  return (svg._talk = { g, mo, tg });
}
function lipSync(svgs, text){
  svgs = (svgs || []).filter(Boolean); if (!svgs.length || reduce) return undefined;
  const seq = syllables(text); if (!seq.length) return undefined;
  let raf = 0, t0 = 0, doneAt = 0, rx = 6, ry = 0, i = 0;
  const fm = svg => svg.querySelector('.fm');
  const L = svgs.map(el => ({ el, ball:!!(el.closest && el.closest('#szBot')) }));
  const live = () => L.map(o => { if (!o.el.isConnected && o.ball) o.el = ballFace() || o.el; return o.el; }).filter(e => e.isConnected);
  const paint = () => live().forEach(svg => { const T = talkEls(svg), m = fm(svg);
    if (m) m.style.opacity = '0';
    T.mo.setAttribute('rx', rx.toFixed(2)); T.mo.setAttribute('ry', Math.max(.4, ry).toFixed(2));
    T.tg.setAttribute('rx', (rx * .55).toFixed(2)); T.tg.setAttribute('ry', Math.max(0, ry * .32).toFixed(2)); T.tg.setAttribute('cy', (65 + ry * .55).toFixed(2));
    T.g.style.opacity = '1'; });
  const stop = () => { cancelAnimationFrame(raf); raf = 0; L.map(o => o.el).forEach(svg => { const T = svg._talk, m = fm(svg); if (T) T.g.style.opacity = '0'; if (m) m.style.opacity = ''; }); };
  const SYL = 140;                                    /* ms por sílaba: ritmo de voz */
  function loop(now){
    if (!t0) t0 = now;
    i = Math.floor((now - t0) / SYL);
    const ending = doneAt && (now - doneAt > 1100 || i >= seq.length);
    const v = ending ? 'r' : seq[Math.min(i, seq.length - 1)], tgt = MOUTH[v] || MOUTH.c;
    const ph = ((now - t0) % SYL) / SYL, open = v === 'r' || v === 'm' ? 1 : Math.sin(Math.min(1, ph * 1.6) * Math.PI) * .35 + .75;
    rx += (tgt[0] - rx) * .35; ry += (tgt[1] * open - ry) * .38;
    paint();
    if (ending && ry < .6){ stop(); return; }
    raf = requestAnimationFrame(loop);
  }
  return k => {
    if (!raf && !doneAt) raf = requestAnimationFrame(loop);
    if (k >= 1 && !doneAt) doneAt = performance.now();
  };
}
const ballFace = () => { const b = document.getElementById('szBot'); return b ? (b.querySelector('.bf > :last-child .szface') || b.querySelector('.bf .szface')) : null; };
const randomGoodFace = (not) => { const L = FACE_GOOD.filter(m => !(not && not.has && not.has(m))); return L[Math.floor(Math.random() * L.length)] || 'feliz'; };

/* ---------- sonidos SynthZ: sintetizados en vivo (Web Audio), sin archivos; se apagan en Ajustes ---------- */
const SND = (() => {
  let ac = null, out = null, noiseBuf = null, armed = false;
  const on = () => CFG.sound !== false;
  function ctx(){
    if (!ac){
      const A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
      try{ ac = new A(); }catch(e){ return null; }
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
      out = ac.createGain(); out.gain.value = .5; out.connect(comp); comp.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return ac;
  }
  /* el navegador solo deja sonar después de un toque o una tecla */
  const arm = () => { armed = true; if (on()) ctx(); };
  ['pointerdown', 'keydown', 'touchend'].forEach(ev => addEventListener(ev, arm, { once:true, passive:true, capture:true }));
  const noise = c => { if (!noiseBuf){ noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } const s = c.createBufferSource(); s.buffer = noiseBuf; return s; };
  const amp = (c, t, a, peak, d) => { const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); return g; };
  const play = fn => { if (!on() || !armed) return; const c = ctx(); if (!c) return; try{ fn(c, c.currentTime + .01); }catch(e){} };
  const tone = (c, t, type, f0, f1, a, peak, d, dest) => { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + a + d); const g = amp(c, t, a, peak, d); o.connect(g); g.connect(dest || out); o.start(t); o.stop(t + a + d + .05); return o; };
  const hiss = (c, t, kind, f, q, a, peak, d, f2) => { const s = noise(c), b = c.createBiquadFilter(); b.type = kind; b.frequency.setValueAtTime(f, t); if (f2) b.frequency.exponentialRampToValueAtTime(f2, t + a + d); b.Q.value = q; const g = amp(c, t, a, peak, d); s.connect(b); b.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + a + d + .05); };
  let lastKey = 0;
  return {
    /* tecla mecánica «brown»: golpe táctil suave y un «thock» grave */
    key(){ const now = performance.now(); if (now - lastKey < 28) return; lastKey = now; play((c, t) => { const v = Math.random(); hiss(c, t, 'bandpass', 1700 + v * 700, 1.1, .002, .28, .03); tone(c, t, 'triangle', 150 + v * 35, 85, .002, .22, .06); hiss(c, t + .018, 'highpass', 4200, .7, .001, .08, .012); }); },
    /* destello de Flow: campanita brillante, aguda, sin voz */
    flow(){ play((c, t) => { [[1568, .16], [2349, .1], [3136, .06], [4186, .035]].forEach(([f, p], i) => tone(c, t + i * .035, 'sine', f, f * 1.003, .008, p, 1.3 - i * .18)); hiss(c, t, 'highpass', 7000, .5, .02, .045, .5); }); },
    /* papel que se desliza (cuando «Synth» se esconde detrás de «Flow») */
    paper(){ play((c, t) => { hiss(c, t, 'bandpass', 650, .8, .07, .2, .32, 2800); hiss(c, t + .05, 'highpass', 3000, .5, .05, .05, .25); }); },
    /* «woauu» al entrar en la «o», y el golpe al llegar */
    woauu(){ play((c, t) => {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(330, t + .3); o.frequency.exponentialRampToValueAtTime(240, t + .62);
      const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 5; f1.frequency.setValueAtTime(420, t); f1.frequency.exponentialRampToValueAtTime(820, t + .32); f1.frequency.exponentialRampToValueAtTime(600, t + .62);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(700, t); lp.frequency.exponentialRampToValueAtTime(3200, t + .5);
      const g = amp(c, t, .12, .22, .55); o.connect(f1); f1.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + .75);
      tone(c, t, 'sine', 220, 660, .1, .07, .55);
      hiss(c, t, 'bandpass', 500, .7, .25, .08, .4, 3000);
    }); },
    impact(){ play((c, t) => { tone(c, t, 'sine', 78, 36, .004, .55, .42); hiss(c, t, 'lowpass', 900, .7, .003, .25, .28); tone(c, t + .02, 'triangle', 220, 110, .003, .06, .2); }); },
    /* SynthonIA: un «bip» amable (sube si está contenta, baja si se disculpa) */
    blip(mood){ play((c, t) => { const sad = mood === 'disculpa' || mood === 'confundida' || mood === 'preocupada'; tone(c, t, 'sine', sad ? 620 : 640, sad ? 430 : 980, .006, .09, .1); tone(c, t + .07, 'sine', sad ? 470 : 990, sad ? 360 : 1320, .006, .06, .09); }); },
    /* la manita hace clic */
    tap(){ play((c, t) => { tone(c, t, 'sine', 1300, 900, .002, .07, .045); hiss(c, t, 'highpass', 3500, .6, .001, .05, .02); }); },
    /* llegó ayuda / aviso del panel: se expande */
    expand(){ play((c, t) => { hiss(c, t, 'bandpass', 300, .9, .25, .1, .35, 4200); [523, 659, 784].forEach((f, i) => tone(c, t + .12 + i * .04, 'sine', f, f, .05, .07, .7)); }); },
    /* terminó la guía: arpegio corto */
    done(){ play((c, t) => { [523, 659, 784, 1047].forEach((f, i) => tone(c, t + i * .085, 'triangle', f, f, .006, .1, .35)); hiss(c, t + .3, 'highpass', 6000, .5, .02, .03, .4); }); },
    /* v1.4 · sonidos de transición futuristas y suaves: un brillo de cristal que respira (sin golpes) */
    shimmer(){ play((c, t) => {
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(5200, t + 1.1); lp.frequency.exponentialRampToValueAtTime(1800, t + 2.2); lp.Q.value = .7; lp.connect(out);
      [[392, .045], [587.3, .035], [880, .025], [1174.7, .018], [1760, .01]].forEach(([f, p], i) => { tone(c, t + i * .06, 'sine', f, f * 1.004, .5, p, 1.6, lp); tone(c, t + i * .06 + .02, 'sine', f * 1.006, f * 1.01, .55, p * .6, 1.5, lp); });
      hiss(c, t + .1, 'bandpass', 5200, 3, .6, .012, 1.2, 9000);
    }); },
    /* entrar por la «o»: un aire que sube, muy bajito */
    warp(){ play((c, t) => { hiss(c, t, 'lowpass', 300, .8, .9, .05, .6, 4200); tone(c, t, 'sine', 196, 392, .8, .03, .5); tone(c, t + .05, 'sine', 294, 588, .8, .02, .5); }); },
    get enabled(){ return on(); }
  };
})();

