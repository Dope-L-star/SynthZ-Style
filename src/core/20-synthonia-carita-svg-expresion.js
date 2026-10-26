/* ---------- SynthonIA: su carita (SVG), con una expresión para cada momento ---------- */
const FACE_G = '#f6d9a0';
/* v2.5 · SynthonIA idéntica al boceto «Cuerpo maestro» y «Expresiones»:
   casco de vidrio perlado (rosa, lila y un filo cian abajo), visor negro grande con borde rosa que brilla,
   ojos cian alargados, cuello de anillos, torso con núcleo cian, brazos por partes, base de pedestal y anillo flotante.
   Ondas: azul a la IZQUIERDA cuando escucha, naranja a la DERECHA cuando habla. */
const FACE_EYE = '#3de0ff';
(function faceDefs(){
  if (document.getElementById('szFaceDefs')) return;
  const d = document.createElement('div'); d.id = 'szFaceDefs'; d.setAttribute('aria-hidden', 'true');
  d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML = '<svg width="0" height="0"><defs>'
    /* vidrio perlado: brillo blanco rosado arriba a la izquierda, rosa, lila y violeta en el borde */
    + '<radialGradient id="szPearl" cx=".46" cy=".42" r=".62"><stop offset="0" stop-color="#2b1a6e" stop-opacity=".62"/><stop offset=".58" stop-color="#4630b8" stop-opacity=".5"/><stop offset=".84" stop-color="#78c8ff" stop-opacity=".62"/><stop offset="1" stop-color="#e9fdff" stop-opacity=".95"/></radialGradient>'
    /* filo de luz cian abajo y a los lados (la luz del ambiente rebota en el vidrio) */
    + '<radialGradient id="szRimL" cx=".5" cy=".1" r="1"><stop offset=".66" stop-color="#bff6ff" stop-opacity="0"/><stop offset=".9" stop-color="#9ff0ff" stop-opacity=".5"/><stop offset="1" stop-color="#e6fdff" stop-opacity=".95"/></radialGradient>'
    /* el rosa que se ve a través del vidrio, más fuerte a la derecha */
    + '<radialGradient id="szSub" cx=".7" cy=".86" r=".7"><stop offset="0" stop-color="#5ff4ff" stop-opacity=".55"/><stop offset=".55" stop-color="#ff3d9a" stop-opacity=".16"/><stop offset="1" stop-color="#ff3d9a" stop-opacity="0"/></radialGradient>'
    + '<radialGradient id="szVisor" cx=".42" cy=".32" r=".8"><stop offset="0" stop-color="#1d1236"/><stop offset=".55" stop-color="#0b0719"/><stop offset="1" stop-color="#030209"/></radialGradient>'
    /* piezas cilíndricas (cuello, brazos, base): luz al centro y lila en los bordes */
    + '<linearGradient id="szCyl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f3ecff"/><stop offset=".2" stop-color="#c3aef6"/><stop offset=".42" stop-color="#e9dcfd"/><stop offset=".6" stop-color="#a990f0"/><stop offset=".85" stop-color="#e3a3ea"/><stop offset="1" stop-color="#fbe9ff"/></linearGradient>'
    + '<linearGradient id="szCylV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd1a8"/><stop offset=".5" stop-color="#ff7a45"/><stop offset="1" stop-color="#ff3d9a"/></linearGradient>'
    + '<radialGradient id="szTorso" cx=".5" cy=".62" r=".62"><stop offset="0" stop-color="#f08fdc" stop-opacity=".92"/><stop offset=".45" stop-color="#b39bf2" stop-opacity=".88"/><stop offset=".82" stop-color="#d8c8fa" stop-opacity=".96"/><stop offset="1" stop-color="#f7f0ff"/></radialGradient>'
    + '<linearGradient id="szBase" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6efff"/><stop offset=".18" stop-color="#c2acf6"/><stop offset=".45" stop-color="#e8dafd"/><stop offset=".62" stop-color="#ad94f1"/><stop offset=".85" stop-color="#ee9fe4"/><stop offset="1" stop-color="#fde8ff"/></linearGradient>'
    + '<radialGradient id="szCore" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f2ffff"/><stop offset=".35" stop-color="#7befff"/><stop offset=".7" stop-color="#3de0ff" stop-opacity=".55"/><stop offset="1" stop-color="#3de0ff" stop-opacity="0"/></radialGradient>'
    + '<linearGradient id="szRingG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff7ad0"/><stop offset=".5" stop-color="#bfe9ff"/><stop offset="1" stop-color="#3de0ff"/></linearGradient>'
    /* v2.7 · cuerpo de cristal líquido: vidrio casi transparente, filo de luz cian, borde iridiscente con los colores de la marca */
    + '<radialGradient id="sgGlass" cx=".42" cy=".36" r=".75"><stop offset="0" stop-color="#5a44d0" stop-opacity=".34"/><stop offset=".6" stop-color="#2f2190" stop-opacity=".42"/><stop offset=".86" stop-color="#76d4ff" stop-opacity=".55"/><stop offset="1" stop-color="#eafdff" stop-opacity=".9"/></radialGradient>'
    + '<radialGradient id="sgCaus" cx=".5" cy=".96" r=".62"><stop offset="0" stop-color="#9af7ff" stop-opacity=".85"/><stop offset=".5" stop-color="#3de0ff" stop-opacity=".22"/><stop offset="1" stop-color="#3de0ff" stop-opacity="0"/></radialGradient>'
    + '<linearGradient id="sgIri" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3de0ff"/><stop offset=".38" stop-color="#9b7bff"/><stop offset=".7" stop-color="#ff3d9a"/><stop offset="1" stop-color="#ff7a45"/></linearGradient>'
    + '<linearGradient id="sgArm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e4fbff" stop-opacity=".9"/><stop offset=".22" stop-color="#7d6be8" stop-opacity=".5"/><stop offset=".55" stop-color="#2f2190" stop-opacity=".45"/><stop offset=".82" stop-color="#7fe6ff" stop-opacity=".6"/><stop offset="1" stop-color="#ffffff" stop-opacity=".85"/></linearGradient>'
    + '<linearGradient id="sgSpec" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
    + '<linearGradient id="sgWave" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3de0ff"/><stop offset=".35" stop-color="#7b3ff2"/><stop offset=".7" stop-color="#ff3d9a"/><stop offset="1" stop-color="#ff7a45"/></linearGradient>'
    + '<linearGradient id="sgBeam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#3de0ff" stop-opacity=".55"/><stop offset=".6" stop-color="#7b3ff2" stop-opacity=".16"/><stop offset="1" stop-color="#7b3ff2" stop-opacity="0"/></linearGradient>'
    + '<radialGradient id="sgCoreIn" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#1b1048"/><stop offset=".7" stop-color="#0a0620"/><stop offset="1" stop-color="#05030f"/></radialGradient>'
    + '<radialGradient id="sgHalo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3de0ff" stop-opacity=".55"/><stop offset=".55" stop-color="#7b3ff2" stop-opacity=".18"/><stop offset="1" stop-color="#7b3ff2" stop-opacity="0"/></radialGradient>'
    + '<clipPath id="sgCoreClip"><circle cx="150" cy="256" r="19"/></clipPath>'
    + '<clipPath id="sgTorsoClip"><path d="M150 206C198 206 216 228 214 258C212 290 190 312 150 312C110 312 88 290 86 258C84 228 102 206 150 206Z"/></clipPath>'
    + '<radialGradient id="sgBlobA" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#9b7bff" stop-opacity=".75"/><stop offset="1" stop-color="#9b7bff" stop-opacity="0"/></radialGradient>'
    + '<radialGradient id="sgBlobB" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff3d9a" stop-opacity=".55"/><stop offset=".5" stop-color="#3de0ff" stop-opacity=".25"/><stop offset="1" stop-color="#3de0ff" stop-opacity="0"/></radialGradient>'
    + '<filter id="szBlur3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>'
    + '<filter id="szBlur1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>'
    + '</defs></svg>';
  (document.body || document.documentElement).appendChild(d);
})();
/* ojos del boceto («Piezas de la cara»): alargado, sonriente, estrella, corazón, cerrado, barra, mirando arriba */
const FEYE = {
  cap:(x, y, s) => '<rect x="' + (x - 3.7 * s) + '" y="' + (y - 9.5 * s) + '" width="' + 7.4 * s + '" height="' + 19 * s + '" rx="' + 3.7 * s + '"/>',
  big:(x, y) => '<rect x="' + (x - 5) + '" y="' + (y - 11.5) + '" width="10" height="23" rx="5"/>',
  smile:(x, y) => '<path d="M' + (x - 7) + ' ' + (y + 3) + 'q7-11 14 0" fill="none" stroke-width="4.6" stroke-linecap="round"/>',
  talk:(x, y, d) => '<path d="M' + (x - 7) + ' ' + (y + 1 + d) + 'q7-6 14 ' + (-2 * d) + '" fill="none" stroke-width="4.4" stroke-linecap="round"/>',
  closed:(x, y) => '<path d="M' + (x - 7) + ' ' + y + 'q7 5 14 0" fill="none" stroke-width="3.8" stroke-linecap="round"/>',
  bar:(x, y) => '<rect x="' + (x - 8) + '" y="' + (y - 2.8) + '" width="16" height="5.6" rx="2.8"/>',
  tilt:(x, y, a) => '<rect x="' + (x - 7) + '" y="' + (y - 2.8) + '" width="14" height="5.6" rx="2.8" transform="rotate(' + a + ' ' + x + ' ' + y + ')"/>',
  up:(x, y) => '<circle cx="' + x + '" cy="' + (y - 6) + '" r="3.6"/>',
  star:(x, y) => '<path d="M' + x + ' ' + (y - 8.5) + 'l2.5 5.4 5.9.7-4.4 4 1.2 5.8-5.2-2.9-5.2 2.9 1.2-5.8-4.4-4 5.9-.7z"/>',
  heart:(x, y) => '<path d="M' + x + ' ' + (y + 7) + 'l-7-6.6a4.2 4.2 0 0 1 7-4.6a4.2 4.2 0 0 1 7 4.6z"/>',
  sad:(x, y, k) => '<path d="M' + (x - 7) + ' ' + (y + (k < 0 ? 3 : -1)) + 'q7-7 14 ' + (k < 0 ? -4 : 4) + '" fill="none" stroke-width="4.2" stroke-linecap="round"/>',
  glitch:(x, y) => '<path d="M' + (x - 2) + ' ' + (y - 8) + 'h4v6h6v4h-6v6h-4v-6h-6v-4h6z"/>',
  cross:(x, y, k) => '<path d="M' + (x - 6) + ' ' + (y - 5) + 'l' + (k < 0 ? '12 5-12 5' : '0 0') + '" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
};
const FL0 = 39, FR0 = 61, FY0 = 56;
const FFX = {
  gears:'<g class="fx" fill="#f6c25c" opacity=".95"><circle cx="86" cy="12" r="5"/><circle cx="95" cy="19" r="3.4"/><circle cx="86" cy="12" r="1.8" fill="#0b0820"/><circle cx="95" cy="19" r="1.2" fill="#0b0820"/><circle cx="83" cy="25" r="1.1"/><circle cx="87" cy="25" r="1.1"/><circle cx="91" cy="25" r="1.1"/></g>',
  bulb:'<g class="fx"><circle cx="90" cy="12" r="6.5" fill="#ffd36a"/><rect x="87.5" y="18" width="5" height="4" rx="1" fill="#e9b04a"/><path d="M78 6l2 4M98 4l-2 4M100 14h-3" stroke="#ffd36a" stroke-width="1.6" stroke-linecap="round"/></g><path class="fx" d="M14 10l1.4 3.2 3.2 1.4-3.2 1.4L14 19.2l-1.4-3.2L9.4 14.6l3.2-1.4z" fill="#ffd36a"/>',
  q:'<text class="fx" x="84" y="20" font-size="22" font-weight="800" fill="' + FACE_EYE + '" font-family="system-ui,sans-serif">?</text>',
  zz:'<text class="fx" x="74" y="22" font-size="10" font-weight="800" fill="' + FACE_EYE + '" font-family="system-ui,sans-serif">z<tspan dy="-6" font-size="13">z</tspan><tspan dy="-7" font-size="17">Z</tspan></text>',
  tear:'<path class="fx ftear" d="M61 70q-4 6-1 8.6q4 2 5-2.6q0-2-4-6z" fill="#7fe3ff"/>',
  drop:'<path class="fx" d="M86 24q-5 8-1 11q5 2.2 6-3q0-2.6-5-8z" fill="#8fd3e8" opacity=".9"/>',
  spark:'<g class="fx" fill="#ffd36a"><path d="M10 14l1.6 3.6 3.6 1.6-3.6 1.6L10 24.4l-1.6-3.6L4.8 19.2l3.6-1.6z"/><path d="M90 8l1.2 2.6 2.6 1.2-2.6 1.2L90 15.6l-1.2-2.6-2.6-1.2 2.6-1.2z"/></g>',
  confetti:'<g class="fx"><rect x="6" y="10" width="4" height="2" rx="1" fill="#ff5fb4" transform="rotate(-30 8 11)"/><rect x="88" y="6" width="4" height="2" rx="1" fill="#3de0ff" transform="rotate(25 90 7)"/><rect x="94" y="22" width="4" height="2" rx="1" fill="#ffc857"/><rect x="2" y="26" width="4" height="2" rx="1" fill="#b06bff"/><circle cx="18" cy="4" r="1.3" fill="#ffc857"/><circle cx="80" cy="2" r="1.3" fill="#ff5fb4"/></g>',
  lines:'<g class="fx" stroke="#ff5fb4" stroke-width="2.2" stroke-linecap="round"><path d="M10 14l5 4M50 2v5M90 14l-5 4M24 5l2.5 4.5M76 5l-2.5 4.5"/></g>',
  scan:'<g class="fx" stroke="' + FACE_EYE + '" stroke-width="1.8" fill="none" opacity=".9"><path d="M4 14V4h10M86 4h10v10M96 86v10H86M14 96H4V86"/></g><g class="fx fscan" stroke="' + FACE_EYE + '" stroke-opacity=".22" stroke-width=".8"><path d="M14 30h72M12 40h76M11 50h78M11 60h78M12 70h76M15 80h70"/></g>',
  clock:'<g class="fx" stroke="' + FACE_EYE + '" stroke-width="1.8" fill="none" stroke-linecap="round"><circle cx="89" cy="12" r="6.5"/><path d="M89 8.5V12l2.4 1.6"/></g>',
  glitch:'<g class="fx fglitch"><rect x="8" y="40" width="14" height="3" fill="#ff5fb4" opacity=".7"/><rect x="78" y="62" width="16" height="3" fill="' + FACE_EYE + '" opacity=".7"/><rect x="70" y="30" width="8" height="2" fill="#fff" opacity=".5"/></g>',
  shades:''
};
/* cada expresión: ojos (izquierdo, derecho), extras y si lleva ondas */
const FACE = {
  neutral:{ e:[['cap'], ['cap']] },
  feliz:{ e:[['smile'], ['smile']] },
  riendo:{ e:[['smile'], ['smile']], x:'spark' },
  encantada:{ e:[['heart'], ['heart']], c:'#ff6fae' },
  guino:{ e:[['cap'], ['smile']] },
  escuchando:{ e:[['cap', 1, -2], ['cap', 1, -2]], dx:-3, w:'l' },
  pensando:{ e:[['tilt', 1, -14], ['tilt', 1, -14]], dx:3, dy:-4, x:'gears' },
  analizando:{ e:[['bar'], ['bar']], x:'scan' },
  creando:{ e:[['cap'], ['cap']], dy:-2, x:'bulb' },
  hablando:{ e:[['talk', 1, 0], ['talk', 1, 0]], w:'r' },
  senalando:{ e:[['cap'], ['cap']], dx:4 },
  celebrando:{ e:[['star'], ['star']], x:'confetti' },
  sorprendida:{ e:[['big'], ['big']], x:'lines' },
  confundida:{ e:[['tilt', 1, 72], ['cap', .55]], x:'q' },
  disculpa:{ e:[['sad', 1, -1], ['sad', 1, 1]] },
  preocupada:{ e:[['sad', 1, -1], ['sad', 1, 1]], x:'drop' },
  triste:{ e:[['sad', 1, -1], ['sad', 1, 1]], dy:2, x:'tear' },
  dormida:{ e:[['closed'], ['closed']], dy:2, x:'zz' },
  esperando:{ e:[['up'], ['up']], x:'clock' },
  flow:{ e:[['bar'], ['bar']], dy:-2, x:'spark' },
  auch:{ e:[['cross', 1, -1], ['smile']] },
  error:{ e:[['glitch'], ['glitch']], x:'glitch' }
};
/* nombres del boceto que también se pueden pedir */
FACE.descansando = FACE.dormida;
const FACE_GOOD = ['feliz', 'riendo', 'guino', 'encantada', 'celebrando', 'flow'];
function eyesOf(f){
  const dx = f.dx || 0, dy = f.dy || 0;
  return f.e.map((s, i) => {
    const x = (i ? FR0 : FL0) + dx, y = FY0 + dy, k = s[0];
    if (k === 'cap') return FEYE.cap(x, y + (s[1] && s[1] < 1 ? 3 : 0), s[1] || 1);
    if (k === 'tilt') return FEYE.tilt(x, y, s[2] || 0);
    if (k === 'talk') return FEYE.talk(x, y, i ? -1 : 1);
    if (k === 'sad') return FEYE.sad(x, y, i ? 1 : -1);
    if (k === 'cross') return i ? FEYE.smile(x, y) : FEYE.cross(x, y, -1);
    return FEYE[k](x, y);
  }).join('');
}
/* la cabeza (lo mismo en la bolita, el logo y el cuerpo entero) */
function headSvg(f, big){
  const G = f.c || FACE_EYE;
  return '<ellipse class="fear" cx="11.5" cy="57" rx="4.6" ry="9" fill="url(#szCylV)"/><ellipse class="fear" cx="88.5" cy="57" rx="4.6" ry="9" fill="url(#szCylV)"/>'
    + '<g class="fhead"><ellipse cx="50" cy="53" rx="39.5" ry="37.5" fill="url(#szPearl)"/>'
    + '<ellipse cx="50" cy="53" rx="39.5" ry="37.5" fill="url(#szSub)"/>'
    + '<ellipse cx="50" cy="53" rx="39.5" ry="37.5" fill="url(#szRimL)"/>'
    + '<ellipse cx="50" cy="53" rx="39" ry="37" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width=".7"/><ellipse cx="50" cy="53" rx="39.5" ry="37.5" fill="none" stroke="url(#sgIri)" stroke-width="1.1" stroke-opacity=".75"/></g>'
    + (big ? '<ellipse cx="34" cy="26" rx="14" ry="6" transform="rotate(-26 34 26)" fill="#fff" opacity=".8" filter="url(#szBlur3)"/>' : '<ellipse cx="34" cy="27" rx="11" ry="4.6" transform="rotate(-26 34 27)" fill="#fff" opacity=".6"/>')
    + '<path d="M24.5 37q4-11 15.5-15.5" stroke="#fff" stroke-opacity=".95" stroke-width="2.2" stroke-linecap="round" fill="none"/>'
    + '<ellipse class="frim" cx="50" cy="56" rx="31.4" ry="28.2" fill="none" stroke="#8b5cff" stroke-width="' + (big ? 6 : 4) + '" opacity="' + (big ? .85 : .6) + '"' + (big ? ' filter="url(#szBlur3)"' : '') + '/>'
    + '<ellipse cx="50" cy="56" rx="30.6" ry="27.4" fill="url(#szVisor)" stroke="url(#sgIri)" stroke-width="2.2"/>'
    + (big ? '<ellipse cx="50" cy="56" rx="28.6" ry="25.4" fill="none" stroke="#3de0ff" stroke-width="3" opacity=".3" filter="url(#szBlur3)"/>' : '') + ''
    + '<path d="M28.5 49q5-15 21.5-18" stroke="#fff" stroke-opacity=".13" stroke-width="3.2" stroke-linecap="round" fill="none"/>'
    + '<g class="fe" fill="' + G + '" stroke="' + G + '" stroke-width="0">' + eyesOf(f) + '</g>';
}
function wavesSvg(){
  const W = (x, dir, c, k) => '<g class="' + k + '" stroke="' + c + '" stroke-width="3" stroke-linecap="round" fill="none">'
    + [4.5, 9.5, 14.5].map((r, i) => '<path style="--i:' + i + '" d="M' + x + ' ' + (56 - r) + 'a' + r + ' ' + r + ' 0 0 ' + (dir > 0 ? 1 : 0) + ' 0 ' + (2 * r) + '"/>').join('') + '</g>';
  return W(93, 1, '#ff8a3d', 'fwr') + W(7, -1, FACE_EYE, 'fwl');
}
function face(mood, size, cls){
  const m = FACE[mood] ? mood : 'feliz', f = FACE[m], z = size || 40;
  return '<svg class="szface' + (cls ? ' ' + cls : '') + (f.w ? ' w' + f.w : '') + '" data-mood="' + m + '" viewBox="0 0 100 100" width="' + z + '" height="' + z + '" aria-hidden="true">'
    + wavesSvg() + headSvg(f, z >= 64)
    + '<path class="fm" d="M45 66h10" style="display:none"/>'
    + (f.x ? FFX[f.x] : '')
    + '</svg>';
}
/* ---------- cuerpo entero · v2.7: SynthonIA de cristal líquido, toda en código (SVG) ----------
   La cabeza es la de siempre (casco, visor y ojos cian de la carita); el cuerpo es nuevo:
   cuello de anillos, torso de vidrio con el corazón de SynthFlow (la onda de la marca), brazos por partes
   que giran en el hombro, y un pedestal flotante con su luz. Nada es imagen: se dibuja y se anima en vivo,
   y se pausa solo cuando no se ve. Escenario 300 × 400 (3:4). */
const SPOSE = {
  idle:     { l:0,   r:0 },
  saluda:   { l:0,   r:-122, wave:'r' },
  senala:   { l:0,   r:-82 },
  senalaL:  { l:82,  r:0 },
  celebra:  { l:122, r:-122 },
  piensa:   { l:6,   r:-36 },
  escucha:  { l:0,   r:-116 },
  presenta: { l:0,   r:-56 },
  sorpresa: { l:42,  r:-42 },
  escribe:  { l:22,  r:-22, type:1 },
  lee:      { l:30,  r:-30 }
};
/* una pieza de vidrio: relleno casi transparente, luz que se junta abajo, borde iridiscente y filo blanco */
const sgPiece = (d, rim) => '<path d="' + d + '" fill="url(#sgGlass)"/><path d="' + d + '" fill="url(#sgCaus)"/>'
  + '<path d="' + d + '" fill="none" stroke="url(#sgIri)" stroke-width="' + (rim || 1.6) + '" stroke-opacity=".85"/><path d="' + d + '" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width=".7"/>';
const sgOval = (cx, cy, rx, ry) => 'M' + (cx - rx) + ' ' + cy + 'a' + rx + ' ' + ry + ' 0 1 0 ' + 2 * rx + ' 0a' + rx + ' ' + ry + ' 0 1 0 ' + -2 * rx + ' 0z';
/* el brazo izquierdo, colgando desde el hombro (0,0): brazo, codo, antebrazo y mano con pulgar. El derecho es su espejo */
const SG_ARM = '<g transform="rotate(10)"><rect x="-12" y="-6" width="24" height="44" rx="12" fill="url(#sgArm)"/><rect x="-12" y="-6" width="24" height="44" rx="12" fill="none" stroke="url(#sgIri)" stroke-width="1.3" stroke-opacity=".85"/>'
  + '<circle cx="0" cy="38" r="10.5" fill="url(#sgGlass)" stroke="#bff6ff" stroke-opacity=".6" stroke-width="1"/>'
  + '<g transform="translate(0 38) rotate(-14)"><rect x="-11" y="0" width="22" height="32" rx="11" fill="url(#sgArm)"/><rect x="-11" y="0" width="22" height="32" rx="11" fill="none" stroke="url(#sgIri)" stroke-width="1.2" stroke-opacity=".85"/>'
  +   '<g class="syb-hand" transform="translate(0 41) scale(1.18)">' + sgPiece('M-12 -6q0-8 12-8t12 8v8q0 12-12 12t-12-12z', 1.2)
  +     '<path d="M9 -2q9-3 10 4t-7 7" fill="url(#sgArm)" stroke="url(#sgIri)" stroke-width="1"/><path d="M-6 -9q4-3 9-1" stroke="#fff" stroke-opacity=".8" stroke-width="1.6" stroke-linecap="round" fill="none"/></g>'
  + '</g><path d="M-6 0q-2 16 0 30" stroke="#fff" stroke-opacity=".6" stroke-width="2.4" stroke-linecap="round" fill="none"/></g>';
const SG_TORSO = 'M150 206C198 206 216 228 214 258C212 290 190 312 150 312C110 312 88 290 86 258C84 228 102 206 150 206Z';
function synHead(mood){
  const m = FACE[mood] ? mood : 'feliz', f = FACE[m];
  return '<svg class="szface syb-hsvg' + (f.w ? ' w' + f.w : '') + '" data-mood="' + m + '" x="50" y="14" width="200" height="200" viewBox="0 0 100 100" overflow="visible">'
    + wavesSvg() + headSvg(f, true) + '<path class="fm" d="M45 66h10" style="display:none"/>' + (f.x ? FFX[f.x] : '') + '</svg>';
}
function synBody(mood, pose, size){
  const m = FACE[mood] ? mood : 'feliz', p = SPOSE[pose] ? pose : 'idle', P = SPOSE[p];
  const torso = SG_TORSO;
  return '<div class="szbody" data-mood="' + m + '" data-pose="' + p + '" style="--al:' + P.l + 'deg;--ar:' + P.r + 'deg' + (size ? ';--sz:' + size + 'px' : '') + '" aria-hidden="true">'
    + '<i class="syb-glow"></i>'
    + '<svg class="syb-svg" viewBox="0 0 300 400" overflow="visible" aria-hidden="true">'
    /* piso: anillo que late y la luz del pedestal */
    + '<g class="syb-floor"><ellipse class="syb-ring" cx="150" cy="380" rx="86" ry="13" fill="none" stroke="url(#sgIri)" stroke-width="2.2"/><ellipse cx="150" cy="380" rx="62" ry="8" fill="url(#sgHalo)"/></g>'
    + '<path class="syb-beam" d="M112 340L128 300H172L188 340Z" fill="url(#sgBeam)"/>'
    + '<g class="syb-dots" fill="#bff6ff"><circle cx="136" cy="330" r="1.6"/><circle cx="150" cy="336" r="1.2"/><circle cx="163" cy="328" r="1.8"/><circle cx="144" cy="322" r="1"/><circle cx="158" cy="340" r="1.3"/></g>'
    /* pedestal flotante de vidrio */
    + '<g class="syb-base">' + sgPiece('M96 340a54 12 0 0 1 108 0v14a54 12 0 0 1 -108 0z', 1.4)
    +   '<ellipse cx="150" cy="340" rx="54" ry="12" fill="url(#sgGlass)" stroke="url(#sgIri)" stroke-width="1.6"/><ellipse cx="150" cy="340" rx="34" ry="6.5" fill="none" stroke="#9ff0ff" stroke-opacity=".8" stroke-width="1.4"/>'
    +   '<path d="M104 350q46 10 92 0" stroke="#fff" stroke-opacity=".35" stroke-width="1.2" fill="none"/></g>'
    /* todo lo de arriba flota sobre el pedestal */
    + '<g class="syb-up">'
    +   '<g class="syb-arm al"><g class="syb-sway"><g transform="translate(100 222)">' + SG_ARM + '</g></g></g>'
    +   '<g class="syb-arm ar' + (P.wave === 'r' ? ' wave' : '') + '"><g class="syb-sway"><g transform="translate(200 222) scale(-1 1)">' + SG_ARM + '</g></g></g>'
    +   '<g class="syb-torso">' + sgPiece(torso, 1.8)
    +     '<g clip-path="url(#sgTorsoClip)" opacity=".75"><circle class="syb-liq a" cx="120" cy="240" r="46" fill="url(#sgBlobA)"/><circle class="syb-liq b" cx="182" cy="284" r="42" fill="url(#sgBlobB)"/></g>'
    +     '<path d="M108 236q10-20 38-24" stroke="url(#sgSpec)" stroke-width="5" stroke-linecap="round" fill="none" opacity=".7"/>'
    +     '<path d="M118 304q32 11 64 0" stroke="#9ff0ff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round" fill="none"/>'
    /*    el corazón: la esfera de SynthFlow con su onda de colores */
    +     '<circle cx="150" cy="256" r="30" fill="url(#sgHalo)" class="syb-halo"/>'
    +     '<circle cx="150" cy="256" r="19" fill="url(#sgCoreIn)" stroke="url(#sgIri)" stroke-width="1.6"/>'
    +     '<g clip-path="url(#sgCoreClip)"><path class="syb-wave" d="M100 256q6.5-11 13 0t13 0t13 0t13 0t13 0t13 0t13 0t13 0" stroke="url(#sgWave)" stroke-width="3.6" stroke-linecap="round" fill="none"/></g>'
    +     '<ellipse cx="143" cy="246" rx="7" ry="3.4" transform="rotate(-30 143 246)" fill="#fff" opacity=".55"/>'
    +     '<path d="M126 318q24 9 48 0" stroke="url(#sgIri)" stroke-width="5" stroke-linecap="round" fill="none" opacity=".75"/></g>'
    /*    cuello de anillos */
    +   '<g class="syb-neck">' + sgPiece(sgOval(150, 208, 26, 7), 1.3) + sgPiece(sgOval(150, 200, 21, 6), 1.2) + '</g>'
    +   '<g class="syb-head"><g class="syb-hd">' + synHead(m) + '</g></g>'
    + '</g></svg></div>';
}
/* las animaciones de SynthonIA se pausan cuando no está en pantalla (cero trabajo de más) */
const synIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('syb-off', !e.isIntersecting)), { rootMargin:'80px' }) : null;
function synWatch(host){ if (!synIO || !host) return; host.querySelectorAll('.szbody').forEach(b => { if (!b._sw){ b._sw = 1; synIO.observe(b); } }); }
if (synIO) new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1){ if (n.classList.contains('szbody')){ if (!n._sw){ n._sw = 1; synIO.observe(n); } } else if (n.querySelector) synWatch(n); } }))).observe(document.documentElement, { childList:true, subtree:true });
/* cambia la cara y la pose de un cuerpo que ya está en pantalla (los brazos se mueven suave); si no hay, lo dibuja */
function synSet(host, mood, pose, size){
  const b = host && host.querySelector('.szbody'); if (!host) return;
  if (!b){ host.innerHTML = synBody(mood, pose, size); return; }
  const m = FACE[mood] ? mood : 'feliz', p = SPOSE[pose] ? pose : 'idle', P = SPOSE[p];
  if (b.dataset.mood !== m){ const hd = b.querySelector('.syb-hd'); hd.innerHTML = synHead(m); b.dataset.mood = m; }
  if (b.dataset.pose !== p){ b.dataset.pose = p; b.style.setProperty('--al', P.l + 'deg'); b.style.setProperty('--ar', P.r + 'deg'); b.querySelector('.syb-arm.ar').classList.toggle('wave', P.wave === 'r'); }
  if (size) b.style.setProperty('--sz', size + 'px');
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
  return (svg._talk = { g:svg.querySelector('.fwr') });
}
function lipSync(svgs, text){
  svgs = (svgs || []).filter(Boolean); if (!svgs.length || reduce) return undefined;
  const seq = syllables(text); if (!seq.length) return undefined;
  let raf = 0, t0 = 0, doneAt = 0, rx = 6, ry = 0, i = 0;
  const fm = svg => svg.querySelector('.fm');
  const L = svgs.map(el => ({ el, ball:!!(el.closest && el.closest('#szBot')) }));
  const live = () => L.map(o => { if (!o.el.isConnected && o.ball) o.el = ballFace() || o.el; return o.el; }).filter(e => e.isConnected);
  const paint = () => live().forEach(svg => { const T = talkEls(svg); if (!T.g) return;
    svg.classList.add('talking'); T.g.style.setProperty('--amp', Math.min(1, ry / 6).toFixed(2)); });
  const stop = () => { cancelAnimationFrame(raf); raf = 0; L.map(o => o.el).forEach(svg => { svg.classList.remove('talking'); const T = svg._talk; if (T && T.g) T.g.style.removeProperty('--amp'); }); };
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

/* v2.4 · SynthonIA te escucha: mientras escribes (en el chat o en su ventanita) le salen ondas azules a la izquierda */
(function listen(){
  let t = 0;
  addEventListener('input', e => {
    const el = e.target; if (!el || !el.matches || !el.matches('textarea, input[type=text], input:not([type]), [contenteditable=true]')) return;
    document.documentElement.classList.add('szlisten'); clearTimeout(t);
    t = setTimeout(() => document.documentElement.classList.remove('szlisten'), 1300);
  }, true);
})();
