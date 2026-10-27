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
    + '<radialGradient id="sgGlass" cx=".42" cy=".34" r=".78"><stop offset="0" stop-color="#3a2340" stop-opacity=".38"/><stop offset=".6" stop-color="#1d1518" stop-opacity=".55"/><stop offset=".86" stop-color="#c98a6a" stop-opacity=".45"/><stop offset="1" stop-color="#fff1d6" stop-opacity=".9"/></radialGradient>'
    + '<radialGradient id="sgCaus" cx=".5" cy=".96" r=".62"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".7"/><stop offset=".5" stop-color="#c9566c" stop-opacity=".22"/><stop offset="1" stop-color="#c9566c" stop-opacity="0"/></radialGradient>'
    + '<linearGradient id="sgIri" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1d6"/><stop offset=".3" stop-color="#e6b65f"/><stop offset=".68" stop-color="#e0607e"/><stop offset="1" stop-color="#9b7bff"/></linearGradient>'
    + '<linearGradient id="sgArm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff1d6" stop-opacity=".9"/><stop offset=".22" stop-color="#8a5a4a" stop-opacity=".55"/><stop offset=".55" stop-color="#1d1518" stop-opacity=".6"/><stop offset=".82" stop-color="#e6b65f" stop-opacity=".55"/><stop offset="1" stop-color="#ffffff" stop-opacity=".85"/></linearGradient>'
    + '<linearGradient id="sgSpec" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
    + '<linearGradient id="sgWave" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3de0ff"/><stop offset=".35" stop-color="#7b3ff2"/><stop offset=".7" stop-color="#ff3d9a"/><stop offset="1" stop-color="#ff7a45"/></linearGradient>'
    + '<linearGradient id="sgBeam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".5"/><stop offset=".6" stop-color="#c9566c" stop-opacity=".14"/><stop offset="1" stop-color="#c9566c" stop-opacity="0"/></linearGradient>'
    + '<radialGradient id="sgCoreIn" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#1b1048"/><stop offset=".7" stop-color="#0a0620"/><stop offset="1" stop-color="#05030f"/></radialGradient>'
    + '<radialGradient id="sgHalo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffc857" stop-opacity=".5"/><stop offset=".55" stop-color="#ff3d9a" stop-opacity=".16"/><stop offset="1" stop-color="#ff3d9a" stop-opacity="0"/></radialGradient>'
    + '<clipPath id="sgCoreClip"><circle cx="150" cy="256" r="19"/></clipPath>'
    + '<clipPath id="sgTorsoClip"><path d="M150 206C198 206 216 228 214 258C212 290 190 312 150 312C110 312 88 290 86 258C84 228 102 206 150 206Z"/></clipPath>'
    + '<radialGradient id="sgBlobA" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e6b65f" stop-opacity=".55"/><stop offset="1" stop-color="#e6b65f" stop-opacity="0"/></radialGradient>'
    + '<radialGradient id="sgBlobB" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#c9566c" stop-opacity=".6"/><stop offset=".5" stop-color="#9b7bff" stop-opacity=".22"/><stop offset="1" stop-color="#9b7bff" stop-opacity="0"/></radialGradient>'
    + '<filter id="szBlur3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>'
    + '<filter id="szBlur1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>'
    + '</defs></svg>';
  (document.body || document.documentElement).appendChild(d);
})();
/* ---------- v2.8 · SynthonIA vuelve a ser la de main (pedido de Sammuel, 27 oct) ----------
   Cabeza cuadradita oscura con filo dorado, antena y orejas rosadas, pantalla negra con ojos, boca y cachetes dorados.
   Todas las caras de main siguen igual; las nuevas (escuchando, analizando, creando, hablando, error) usan el mismo dibujo.
   Lo nuevo es el cuerpo de cristal (más abajo) y los detalles que se mueven (engranes, foco, escáner, ondas de voz). */
const FFX_C = '#f6d9a0';
const FFX = {
  bulb:'<g class="fx"><circle cx="90" cy="12" r="6.5" fill="#ffd36a"/><rect x="87.5" y="18" width="5" height="4" rx="1" fill="#e9b04a"/><path d="M78 6l2 4M98 4l-2 4M100 14h-3" stroke="#ffd36a" stroke-width="1.6" stroke-linecap="round"/></g>',
  scan:'<g class="fx fscan" stroke="' + FFX_C + '" stroke-opacity=".28" stroke-width=".8"><path d="M24 40h52M23 48h54M23 56h54M23 64h54M24 72h52"/></g><g class="fx" stroke="' + FFX_C + '" stroke-width="1.8" fill="none" opacity=".9"><path d="M4 18V8h10M86 8h10v10M96 86v10H86M14 96H4V86"/></g>',
  glitch:'<g class="fx fglitch"><rect x="8" y="40" width="14" height="3" fill="#ff5fb4" opacity=".7"/><rect x="78" y="62" width="16" height="3" fill="#3de0ff" opacity=".7"/><rect x="70" y="30" width="8" height="2" fill="#fff" opacity=".5"/></g>'
};
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
    preocupada:{ e:open(0, 2), b:'M33 45l11-5M67 45l-11-5', m:'M42 70q4-4 8-1t8-1', drop:1 },
    triste:{ e:['M40 53v4', 'M60 53v4'], ew:6, b:'M32 47l11-5M68 47l-11-5', m:'M41 72q9-8 18 0' },
    auch:{ e:['M34 49l10 4-10 4', 'M55 53q5-4 10 0'], ew:3.4, b:'M32 43l12 5M57 45l10-3', m:'M41 70q4.5-4 9 0q4.5 4 9 0', x:'M78 30l4-6M84 36l6-2' },
    /* las de la v2.4 en adelante, con el dibujo de main: escucha mirando a un lado (ondas azules), analiza con ojos de barra
       y su escáner, crea con el foco encendido, habla con la boca abierta (ondas naranjas), y se «cuelga» cuando hay un error */
    escuchando:{ e:open(-4, -1), m:'M46 66h8', w:'l' },
    analizando:{ e:['M34 52h12', 'M54 52h12'], ew:5, m:'M45 66h10', fx:'scan' },
    creando:{ e:open(0, -2), m:'M42 64q8 7 16 0', ck:1, fx:'bulb' },
    hablando:{ e:open(0, 0), m:'M42 61.5q8-2 16 0q-1 9-8 9q-7 0-8-9z', mf:1, ck:1, w:'r' },
    error:{ e:['M35 47l10 10M45 47l-10 10', 'M55 47l10 10M65 47l-10 10'], ew:3.6, m:'M41 68q4.5-4 9 0q4.5 4 9 0', fx:'glitch' }
  };
})();
FACE.descansando = FACE.dormida;
const FACE_GOOD = ['feliz', 'riendo', 'guino', 'encantada', 'celebrando', 'flow'];
/* la cabeza de main (lo mismo en la bolita, los botones y el cuerpo entero) */
function headSvg(f){
  const G = FACE_G, P = (d, st) => d ? '<path d="' + d + '" ' + st + '/>' : '';
  const eyes = f.glasses
    ? '<path d="M27 45h20v6.5a7 7 0 0 1-7 7h-6a7 7 0 0 1-7-7z" fill="#07070a" stroke="#e6b65f" stroke-width="2.2"/><path d="M53 45h20v6.5a7 7 0 0 1-7 7h-6a7 7 0 0 1-7-7z" fill="#07070a" stroke="#e6b65f" stroke-width="2.2"/><path d="M47 47.5q3-2.5 6 0" stroke="#e6b65f" stroke-width="2.2" fill="none"/><path d="M31 49l5-3M57 49l5-3" stroke="rgba(255,255,255,.55)" stroke-width="1.6" stroke-linecap="round"/>'
    : f.e.map(d => P(d, 'stroke="' + (f.ec || G) + '" stroke-width="' + (f.ew || 7) + '" stroke-linecap="round" stroke-linejoin="round" fill="' + (f.ef || 'none') + '"')).join('');
  return '<path class="fa" d="M50 20V10" stroke="#e6b65f" stroke-width="2.5" stroke-linecap="round"/><circle class="fb" cx="50" cy="8" r="4.5" fill="#c9566c"/>'
    + '<rect x="6" y="46" width="8" height="18" rx="4" fill="#c9566c"/><rect x="86" y="46" width="8" height="18" rx="4" fill="#c9566c"/>'
    + '<rect x="12" y="20" width="76" height="70" rx="30" fill="#1d1518" stroke="#e6b65f" stroke-opacity=".55" stroke-width="2"/><rect x="21" y="31" width="58" height="49" rx="21" fill="#110c0e"/>'
    + (f.ck ? '<circle cx="31" cy="64" r="4.5" fill="#c9566c" fill-opacity=".55"/><circle cx="69" cy="64" r="4.5" fill="#c9566c" fill-opacity=".55"/>' : '')
    + P(f.b, 'stroke="' + G + '" stroke-width="2.6" stroke-linecap="round" fill="none"')
    + '<g class="fe">' + eyes + '</g>'
    + P(f.m, 'class="fm" stroke="' + G + '" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" fill="' + (f.mf ? G : 'none') + '"')
    + P(f.x, 'class="fx" stroke="#e6b65f" stroke-width="' + (f.xw || 2.4) + '" stroke-linecap="round" stroke-linejoin="round" fill="none"')
    + (f.drop ? '<path class="fdrop" d="M83 28q-6 9-1 12.5q6 2.5 7-3.5q0-3-6-9z" fill="#8fd3e8" fill-opacity=".9"/>' : '')
    + (f.fx ? FFX[f.fx] : '');
}
/* ondas de voz: naranja a la DERECHA cuando habla, azul a la IZQUIERDA cuando escucha (por fuera de las orejas) */
function wavesSvg(){
  const W = (x, dir, c, k) => '<g class="' + k + '" stroke="' + c + '" stroke-width="3" stroke-linecap="round" fill="none">'
    + [4.5, 9.5, 14.5].map((r, i) => '<path style="--i:' + i + '" d="M' + x + ' ' + (55 - r) + 'a' + r + ' ' + r + ' 0 0 ' + (dir > 0 ? 1 : 0) + ' 0 ' + (2 * r) + '"/>').join('') + '</g>';
  return W(97, 1, '#ff8a3d', 'fwr') + W(3, -1, '#3de0ff', 'fwl');
}
function face(mood, size, cls){
  const m = FACE[mood] ? mood : 'feliz', f = FACE[m], z = size || 40;
  return '<svg class="szface' + (cls ? ' ' + cls : '') + (f.w ? ' w' + f.w : '') + '" data-mood="' + m + '" viewBox="0 0 100 100" width="' + z + '" height="' + z + '" aria-hidden="true">'
    + wavesSvg() + headSvg(f) + '</svg>';
}
/* ---------- cuerpo entero · v2.7: SynthonIA de cristal líquido, toda en código (SVG) ----------
   v2.8: la cabeza es la de main (cuadradita, dorada y rosada); el cuerpo es de cristal ahumado que combina con ella:
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
  + '<circle cx="0" cy="-2" r="11" fill="#c9566c" stroke="#e6b65f" stroke-opacity=".7" stroke-width="1.3"/><circle cx="-3.5" cy="-5.5" r="3" fill="#fff" opacity=".35"/>'
  + '<circle cx="0" cy="38" r="9.5" fill="#c9566c" stroke="#e6b65f" stroke-opacity=".7" stroke-width="1.2"/><circle cx="-3" cy="35" r="2.6" fill="#fff" opacity=".35"/>'
  + '<g transform="translate(0 38) rotate(-14)"><rect x="-11" y="0" width="22" height="32" rx="11" fill="url(#sgArm)"/><rect x="-11" y="0" width="22" height="32" rx="11" fill="none" stroke="url(#sgIri)" stroke-width="1.2" stroke-opacity=".85"/>'
  +   '<g class="syb-hand" transform="translate(0 41) scale(1.18)">' + sgPiece('M-12 -6q0-8 12-8t12 8v8q0 12-12 12t-12-12z', 1.2)
  +     '<path d="M9 -2q9-3 10 4t-7 7" fill="url(#sgArm)" stroke="url(#sgIri)" stroke-width="1"/><path d="M-6 -9q4-3 9-1" stroke="#fff" stroke-opacity=".8" stroke-width="1.6" stroke-linecap="round" fill="none"/></g>'
  + '</g><path d="M-6 0q-2 16 0 30" stroke="#fff" stroke-opacity=".6" stroke-width="2.4" stroke-linecap="round" fill="none"/></g>';
const SG_TORSO = 'M150 206C198 206 216 228 214 258C212 290 190 312 150 312C110 312 88 290 86 258C84 228 102 206 150 206Z';
function synHead(mood){
  const m = FACE[mood] ? mood : 'feliz', f = FACE[m];
  return '<svg class="szface syb-hsvg' + (f.w ? ' w' + f.w : '') + '" data-mood="' + m + '" x="50" y="14" width="200" height="200" viewBox="0 0 100 100" overflow="visible">'
    + wavesSvg() + headSvg(f) + '</svg>';
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
    + '<g class="syb-dots" fill="#ffe2a8"><circle cx="136" cy="330" r="1.6"/><circle cx="150" cy="336" r="1.2"/><circle cx="163" cy="328" r="1.8"/><circle cx="144" cy="322" r="1"/><circle cx="158" cy="340" r="1.3"/></g>'
    /* pedestal flotante de vidrio */
    + '<g class="syb-base">' + sgPiece('M96 340a54 12 0 0 1 108 0v14a54 12 0 0 1 -108 0z', 1.4)
    +   '<ellipse cx="150" cy="340" rx="54" ry="12" fill="url(#sgGlass)" stroke="url(#sgIri)" stroke-width="1.6"/><ellipse cx="150" cy="340" rx="34" ry="6.5" fill="none" stroke="#e6b65f" stroke-opacity=".85" stroke-width="1.4"/>'
    +   '<path d="M104 350q46 10 92 0" stroke="#fff" stroke-opacity=".35" stroke-width="1.2" fill="none"/></g>'
    /* todo lo de arriba flota sobre el pedestal */
    + '<g class="syb-up">'
    +   '<g class="syb-arm al"><g class="syb-sway"><g transform="translate(100 222)">' + SG_ARM + '</g></g></g>'
    +   '<g class="syb-arm ar' + (P.wave === 'r' ? ' wave' : '') + '"><g class="syb-sway"><g transform="translate(200 222) scale(-1 1)">' + SG_ARM + '</g></g></g>'
    +   '<g class="syb-torso">' + sgPiece(torso, 1.8)
    +     '<g clip-path="url(#sgTorsoClip)" opacity=".75"><circle class="syb-liq a" cx="120" cy="240" r="46" fill="url(#sgBlobA)"/><circle class="syb-liq b" cx="182" cy="284" r="42" fill="url(#sgBlobB)"/></g>'
    +     '<path d="M108 236q10-20 38-24" stroke="url(#sgSpec)" stroke-width="5" stroke-linecap="round" fill="none" opacity=".7"/>'
    +     '<path d="M118 304q32 11 64 0" stroke="#ffd9a0" stroke-opacity=".5" stroke-width="2" stroke-linecap="round" fill="none"/>'
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
  const NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'ftalk');
  const mo = document.createElementNS(NS, 'ellipse'), tg = document.createElementNS(NS, 'ellipse');
  mo.setAttribute('cx', '50'); mo.setAttribute('cy', '65'); mo.setAttribute('fill', '#2a0d18'); mo.setAttribute('stroke', FACE_G); mo.setAttribute('stroke-width', '3');
  tg.setAttribute('cx', '50'); tg.setAttribute('fill', '#e07a93');
  g.appendChild(mo); g.appendChild(tg); svg.appendChild(g);
  return (svg._talk = { g, mo, tg, w:svg.querySelector('.fwr') });
}
function lipSync(svgs, text){
  svgs = (svgs || []).filter(Boolean); if (!svgs.length || reduce) return undefined;
  const seq = syllables(text); if (!seq.length) return undefined;
  let raf = 0, t0 = 0, doneAt = 0, rx = 6, ry = 0, i = 0;
  const fm = svg => svg.querySelector('.fm');
  const L = svgs.map(el => ({ el, ball:!!(el.closest && el.closest('#szBot')) }));
  const live = () => L.map(o => { if (!o.el.isConnected && o.ball) o.el = ballFace() || o.el; return o.el; }).filter(e => e.isConnected);
  /* la boca de main dice cada sílaba; las ondas naranjas laten con ella */
  const paint = () => live().forEach(svg => { const T = talkEls(svg), m = fm(svg);
    if (m) m.style.opacity = '0';
    T.mo.setAttribute('rx', rx.toFixed(2)); T.mo.setAttribute('ry', Math.max(.4, ry).toFixed(2));
    T.tg.setAttribute('rx', (rx * .55).toFixed(2)); T.tg.setAttribute('ry', Math.max(0, ry * .32).toFixed(2)); T.tg.setAttribute('cy', (65 + ry * .55).toFixed(2));
    T.g.style.opacity = '1'; svg.classList.add('talking'); if (T.w) T.w.style.setProperty('--amp', Math.min(1, ry / 6).toFixed(2)); });
  const stop = () => { cancelAnimationFrame(raf); raf = 0; L.map(o => o.el).forEach(svg => { const T = svg._talk, m = fm(svg); svg.classList.remove('talking'); if (T){ T.g.style.opacity = '0'; if (T.w) T.w.style.removeProperty('--amp'); } if (m) m.style.opacity = ''; }); };
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
