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
    + '<radialGradient id="szPearl" cx=".5" cy=".56" r=".6"><stop offset="0" stop-color="#8a74e4" stop-opacity=".78"/><stop offset=".55" stop-color="#b19cf2" stop-opacity=".86"/><stop offset=".86" stop-color="#d3c2fa" stop-opacity=".95"/><stop offset="1" stop-color="#e9defe"/></radialGradient>'
    /* filo de luz cian abajo y a los lados (la luz del ambiente rebota en el vidrio) */
    + '<radialGradient id="szRimL" cx=".5" cy=".08" r="1"><stop offset=".68" stop-color="#9fe9ff" stop-opacity="0"/><stop offset=".9" stop-color="#9fe9ff" stop-opacity=".45"/><stop offset="1" stop-color="#8ce6ff" stop-opacity=".95"/></radialGradient>'
    /* el rosa que se ve a través del vidrio, más fuerte a la derecha */
    + '<radialGradient id="szSub" cx=".66" cy=".3" r=".75"><stop offset="0" stop-color="#ff9ee6" stop-opacity=".7"/><stop offset=".6" stop-color="#ff86da" stop-opacity=".25"/><stop offset="1" stop-color="#ff86da" stop-opacity="0"/></radialGradient>'
    + '<radialGradient id="szVisor" cx=".42" cy=".32" r=".8"><stop offset="0" stop-color="#1d1236"/><stop offset=".55" stop-color="#0b0719"/><stop offset="1" stop-color="#030209"/></radialGradient>'
    /* piezas cilíndricas (cuello, brazos, base): luz al centro y lila en los bordes */
    + '<linearGradient id="szCyl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f3ecff"/><stop offset=".2" stop-color="#c3aef6"/><stop offset=".42" stop-color="#e9dcfd"/><stop offset=".6" stop-color="#a990f0"/><stop offset=".85" stop-color="#e3a3ea"/><stop offset="1" stop-color="#fbe9ff"/></linearGradient>'
    + '<linearGradient id="szCylV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6efff"/><stop offset=".45" stop-color="#c9b2f6"/><stop offset="1" stop-color="#9a80ef"/></linearGradient>'
    + '<radialGradient id="szTorso" cx=".5" cy=".62" r=".62"><stop offset="0" stop-color="#f08fdc" stop-opacity=".92"/><stop offset=".45" stop-color="#b39bf2" stop-opacity=".88"/><stop offset=".82" stop-color="#d8c8fa" stop-opacity=".96"/><stop offset="1" stop-color="#f7f0ff"/></radialGradient>'
    + '<linearGradient id="szBase" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6efff"/><stop offset=".18" stop-color="#c2acf6"/><stop offset=".45" stop-color="#e8dafd"/><stop offset=".62" stop-color="#ad94f1"/><stop offset=".85" stop-color="#ee9fe4"/><stop offset="1" stop-color="#fde8ff"/></linearGradient>'
    + '<radialGradient id="szCore" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f2ffff"/><stop offset=".35" stop-color="#7befff"/><stop offset=".7" stop-color="#3de0ff" stop-opacity=".55"/><stop offset="1" stop-color="#3de0ff" stop-opacity="0"/></radialGradient>'
    + '<linearGradient id="szRingG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff7ad0"/><stop offset=".5" stop-color="#bfe9ff"/><stop offset="1" stop-color="#3de0ff"/></linearGradient>'
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
    + '<ellipse cx="50" cy="53" rx="39" ry="37" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width=".7"/></g>'
    + (big ? '<ellipse cx="34" cy="26" rx="14" ry="6" transform="rotate(-26 34 26)" fill="#fff" opacity=".8" filter="url(#szBlur3)"/>' : '<ellipse cx="34" cy="27" rx="11" ry="4.6" transform="rotate(-26 34 27)" fill="#fff" opacity=".6"/>')
    + '<path d="M24.5 37q4-11 15.5-15.5" stroke="#fff" stroke-opacity=".95" stroke-width="2.2" stroke-linecap="round" fill="none"/>'
    + '<ellipse class="frim" cx="50" cy="56" rx="31.4" ry="28.2" fill="none" stroke="#ff4fc0" stroke-width="' + (big ? 6 : 4) + '" opacity="' + (big ? .85 : .6) + '"' + (big ? ' filter="url(#szBlur3)"' : '') + '/>'
    + '<ellipse cx="50" cy="56" rx="30.6" ry="27.4" fill="url(#szVisor)" stroke="#ff7ad0" stroke-width="2.2"/>'
    + (big ? '<ellipse cx="50" cy="56" rx="28.6" ry="25.4" fill="none" stroke="#ff4fc0" stroke-width="3" opacity=".35" filter="url(#szBlur3)"/>' : '') + ''
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
/* ---------- cuerpo entero (boceto «Proporciones»: cabeza 45 %, torso 30 %, base 25 %) ----------
   viewBox 0 0 240 320; los brazos son grupos que giran en el hombro y el codo, así se pueden animar. */
const SPOSE = {
  idle:     { r:[-14, -10, 'open'], l:[14, 10, 'open'] },
  saluda:   { r:[-128, -42, 'wave'], l:[12, 10, 'open'] },
  senala:   { r:[-84, -4, 'point'], l:[14, 10, 'open'] },
  senalaL:  { r:[-14, -10, 'open'], l:[84, 4, 'point'] },
  celebra:  { r:[-140, -12, 'open'], l:[140, 12, 'open'] },
  piensa:   { r:[-14, -10, 'open'], l:[22, -168, 'point'] },
  escucha:  { r:[-36, -150, 'open'], l:[14, 10, 'open'] },
  presenta: { r:[-52, -58, 'open'], l:[14, 10, 'open'] },
  sorpresa: { r:[-128, -30, 'open'], l:[128, 30, 'open'] },
  escribe:  { r:[-22, -70, 'open'], l:[22, 70, 'open'] }
};
function handSvg(kind, side){
  const s = side;   /* 1 derecha (en pantalla), -1 izquierda */
  if (kind === 'point') return '<g class="hand"><ellipse cx="0" cy="8" rx="8.5" ry="9.5" fill="url(#szCyl)"/><rect x="-3.2" y="10" width="6.4" height="17" rx="3.2" fill="url(#szCyl)"/><ellipse cx="' + (6 * s) + '" cy="6" rx="3" ry="5" fill="url(#szCyl)" transform="rotate(' + (-30 * s) + ' ' + (6 * s) + ' 6)"/></g>';
  if (kind === 'wave') return '<g class="hand"><ellipse cx="0" cy="9" rx="9.5" ry="10.5" fill="url(#szCyl)"/>' + [-6, -2, 2, 6].map((x, i) => '<rect x="' + (x - 2.2) + '" y="' + (12 + Math.abs(i - 1.5) * 1.5) + '" width="4.4" height="' + (11 - Math.abs(i - 1.5) * 2) + '" rx="2.2" fill="url(#szCyl)"/>').join('') + '<ellipse cx="' + (-10 * s) + '" cy="6" rx="3" ry="5.5" fill="url(#szCyl)" transform="rotate(' + (40 * s) + ' ' + (-10 * s) + ' 6)"/></g>';
  return '<g class="hand"><ellipse cx="0" cy="9" rx="9" ry="10.5" fill="url(#szCyl)"/><path d="M-6 15q6 8 12 0" stroke="#a487ef" stroke-opacity=".5" stroke-width="1.2" fill="none"/><ellipse cx="' + (8 * s) + '" cy="6" rx="3" ry="5.4" fill="url(#szCyl)" transform="rotate(' + (-26 * s) + ' ' + (8 * s) + ' 6)"/></g>';
}
function armSvg(side, a1, a2, hand){
  const sx = side > 0 ? 160 : 80, sy = 176;
  return '<g class="arm ' + (side > 0 ? 'ar' : 'al') + '" style="--a1:' + a1 + 'deg;--a2:' + a2 + 'deg" transform="translate(' + sx + ' ' + sy + ')">'
    + '<g class="up" transform="rotate(' + a1 + ')"><circle r="15" fill="url(#szCylV)"/>'
    + '<rect x="-12.5" y="2" width="25" height="38" rx="12.5" fill="url(#szCyl)"/>'
    + '<circle cy="40" r="10.5" fill="url(#szCylV)"/>'
    + '<g class="lo" transform="translate(0 40) rotate(' + a2 + ')">' + (hand === 'wave' && !reduce ? '<g><animateTransform attributeName="transform" type="rotate" values="0;-24;6;-24;0" keyTimes="0;.25;.5;.75;1" dur="1.5s" repeatCount="indefinite"/>' : '<g>') + '<rect x="-11" y="0" width="22" height="34" rx="11" fill="url(#szCyl)"/><path d="M-10.5 10h21" stroke="#9a80ef" stroke-opacity=".45" stroke-width="1.4"/>'
    + '<g transform="translate(0 30) scale(1.45)">' + handSvg(hand, side) + '</g></g></g></g></g>';
}
function synBody(mood, pose, size){
  const f = FACE[mood] || FACE.feliz, P = SPOSE[pose] || SPOSE.idle, z = size || 240;
  return '<svg class="szbody" data-mood="' + (FACE[mood] ? mood : 'feliz') + '" data-pose="' + (SPOSE[pose] ? pose : 'idle') + '" viewBox="0 0 240 320" width="' + z + '" height="' + Math.round(z * 4 / 3) + '" aria-hidden="true">'
    /* anillo flotante y su luz en el piso */
    + '<g class="syb-ring"><ellipse cx="120" cy="306" rx="58" ry="9" fill="none" stroke="url(#szRingG)" stroke-width="5" opacity=".5" filter="url(#szBlur3)"/><ellipse cx="120" cy="306" rx="58" ry="9" fill="none" stroke="url(#szRingG)" stroke-width="2.4"/></g>'
    /* base de pedestal: campana que se abre con borde rosa brillante */
    + '<g class="syb-base"><path d="M98 250h44l4 10q16 8 22 22q3 9-8 11H74q-11-2-8-11q6-14 22-22z" fill="url(#szBase)"/>'
    + '<path d="M70 286q50 12 100 0" stroke="#ff5fb4" stroke-width="3" stroke-linecap="round" fill="none" opacity=".85"/><path d="M84 268q36 8 72 0M76 278q44 10 88 0" stroke="#fff" stroke-opacity=".35" stroke-width="1.4" fill="none"/>'
    + '<path d="M86 270q16-8 32-8" stroke="#fff" stroke-opacity=".6" stroke-width="2.4" stroke-linecap="round" fill="none"/>'
    + '<rect x="100" y="236" width="40" height="18" rx="7" fill="url(#szCyl)"/></g>'
    /* brazo de atrás (izquierdo en pantalla) */
    + armSvg(-1, P.l[0], P.l[1], P.l[2])
    /* torso: barril de vidrio con el núcleo cian */
    + '<g class="syb-torso"><path d="M80 176q0-20 40-21q40 1 40 21l-5 44q-3 22-35 22t-35-22z" fill="url(#szTorso)"/>'
    + '<path d="M80 176q0-20 40-21q40 1 40 21l-5 44q-3 22-35 22t-35-22z" fill="url(#szRimL)"/>'
    + '<path d="M89 176q4-11 19-13" stroke="#fff" stroke-opacity=".85" stroke-width="3" stroke-linecap="round" fill="none"/>'
    + '<circle class="syb-core" cx="120" cy="200" r="13" fill="url(#szCore)" opacity=".85"/><circle cx="120" cy="200" r="4" fill="#e9ffff" opacity=".8"/></g>'
    /* cuello de anillos */
    + '<g class="syb-neck"><rect x="104" y="140" width="32" height="20" rx="8" fill="url(#szCyl)"/><path d="M106 147h28M106 153h28" stroke="#9f86f2" stroke-opacity=".55" stroke-width="1.4"/></g>'
    /* brazo de adelante (derecho en pantalla) */
    + armSvg(1, P.r[0], P.r[1], P.r[2])
    /* cabeza */
    + '<g class="syb-head" transform="translate(26.5 -27) scale(1.87)"><g>' + (reduce ? '' : '<animateTransform attributeName="transform" type="rotate" values="0 50 90;-3 50 90;0 50 90;2.5 50 90;0 50 90" dur="7s" repeatCount="indefinite"/>') + wavesSvg() + headSvg(f, true) + (f.x ? FFX[f.x] : '') + '</g></g>'
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
