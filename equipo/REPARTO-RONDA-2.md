# REPARTO RONDA 2 (21-oct-2026) — sustituye lo visual de REPARTO-2-CLAUDES-3-GROKS.md
Reglas: ver `equipo/MEGA-PROMPT-CONTEXTO.md` (pegarlo siempre primero). Claude (GOD) NO hace estas tareas: solo confirma y arregla errores pequeños.

## Estado de entregas
| Rol | Estado |
|---|---|
| SERVIDOR (Grok 1) | ENTREGADO: api/alias.js (75/75). Mi revisión: bien. 1 corrección pedida (ver S2). |
| DOCUMENTOS (Grok 2) | ENTREGADO: _docs.js + 50-docs.js (14/14). Falta enchufarlo (S2). |
| DISEÑADOR (Claude 1) y INGENIERO (Claude 2) | Se quedaron sin límite al empezar (solo montaron entorno). Sin código. Se reanudan con el prompt "CONTINUAR" cuando vuelvan, o los toma la IA nueva. |
| AUDITOR (Grok 3) | Pendiente de enviar. |

## QUIÉN HACE QUÉ (6 puestos, cada IA hace solo uno a la vez)
Visual (necesita ojo para el diseño → Claude primero; si no hay Claude, la IA nueva "VISUAL" con capturas obligatorias):
- **V1 TARJETAS** · **V2 ÍCONOS** · **V3 ALIAS-UI** · **V4 PORTADA**
Lógica/servidor (Grok):
- **S2 SERVIDOR-2** (Grok 1) · **AUD AUDITOR** (Grok 3) · **ING INGENIERO** (Claude 2 o IA nueva)
Orden sugerido: V1 → V2 → V4 → V3 (V3 depende de que A.L.I.A.S. esté en la base: ING-A0). En paralelo S2 y AUD. Para no chocar, cada visual tiene archivos propios.

## V1 TARJETAS — rama `tarjetas-archivo`
Dueño de: `src/chat-css/25-v232-tarjetas-archivo.css` (nuevo), la parte de tarjeta de `src/chat/02-mensajes.js`, `src/chat/05e-presentaciones.js`, `src/chat/05b-imagenes.js` (solo el botón de descarga), y para A.L.I.A.S. `alias.css` + `src/alias/30-resultado.js` (solo `resFiles`).
```
[MEGA-PROMPT] Rol: V1 TARJETAS. Hay que cambiar cómo se ven TODOS los archivos que entrega la IA en: chat normal, SuperiorSynth (usa el mismo chat) y A.L.I.A.S.
DISEÑO (como las capturas que Sammuel adjunta): tarjeta ancha, esquinas ~16px, borde fino claro, fondo oscuro azulado. IZQUIERDA: cuadrito 56-64px, esquinas ~12px, con ÍCONO SVG propio. CENTRO: nombre del archivo (blanco, 16px semi-negrita, "…" si es largo) y debajo el TIPO en MAYÚSCULAS pequeñas y grises (PATCH, PPTX, PY, MD, CSV, JSON, HTML…). DERECHA: píldora «Descargar». Alto 72-80px. Junto a «Descargar», botón pequeño de ícono «Ver» solo si ya existía.
NUEVO (pedido de Sammuel): el cuadrito cambia de COLOR e ÍCONO según el tipo, todos con el mismo estilo de degradado y brillo suave:
 · código (js ts py html css sql sh json yaml xml) → azul, ícono "</>"
 · documento de texto (md txt doc) → gris azulado, hoja con rayitas
 · presentación (pptx) → naranja/ámbar, ícono de diapositiva con gráfico
 · hoja de cálculo (csv xlsx) → verde, ícono de tabla/cuadrícula
 · PDF → rojo suave, hoja con "PDF"
 · imagen (png jpg svg webp) → morado/rosa, ícono de montaña y sol
 · patch/diff (patch diff) → azul con ícono de ramas "+/-"
 · comprimido (zip) → dorado, ícono de caja
 · otro → azul neutro, hoja con esquina doblada
Una función única `fileKind(nombre, mime)` devuelve {tipo, etiqueta, color, svg}; la usan los tres sitios (en A.L.I.A.S. copia la función a su archivo, que corre aparte). Mapa en un solo objeto para poder añadir tipos.
Pequeña animación: al aparecer, la tarjeta sube 6px y se desvanece 200ms; en hover el cuadrito brilla un poco; respeta prefers-reduced-motion.
Accesible: botón con aria-label «Descargar <nombre>», foco visible, teclado completo. Tema claro/oscuro, modo Simple, celular 390px (nombre se acorta, botón a la derecha).
NO cambies la lógica de descarga. PRUEBAS: capturas antes/después de un archivo de cada tipo en chat y en A.L.I.A.S.; build --check; suites b3 b4 b5 v18/*.
```

## V2 ÍCONOS — rama `iconos-agentes`
Dueño de: `src/chat-css/26-v232-iconos-agentes.css` (nuevo), `src/chat/16f-v232-iconos.js` (nuevo, solo define los SVG), y la línea `agent:{…ico…}` de `src/chat/16e-v231-modo.js` (hoy es una estrellita simple `M12 3l2 7 7 2…`; `ssIco()` no existe aún y se usa si está definida). Para A.L.I.A.S.: ícono en `alias.html`/`alias.css` y `icon` propio.
```
[MEGA-PROMPT] Rol: V2 ÍCONOS.
1) SuperiorSynth: ícono mucho más bonito y con animación. Idea: estrella/chispa de 4 puntas con núcleo luminoso y 2-3 destellos pequeños orbitando; degradado dorado→morado suave; cuando el modo está ACTIVO late despacio (brillo y escala 1→1.06, 3s) y los destellos giran lento; en reposo queda estático. Define `window.ssIco()` (devuelve el SVG, usa el id único por instancia para degradados) para que la píldora de modo lo use sin tocar más lógica. Debe verse bien a 16px, 20px y 32px. Respeta prefers-reduced-motion.
2) A.L.I.A.S.: ícono tipo ESPACIAL inspirado en Gargantúa (el agujero negro de Interestelar): disco de acreción dorado-naranja visto de canto con halo curvado por arriba y por abajo (efecto lente), centro negro, resplandor suave. Hazlo como SVG propio con degradados y un brillo que "respira"; versión pequeña (favicon/botón, simplificada y legible a 16px) y versión grande (cabecera de /alias, con partículas muy sutiles girando lento). Entrega también `ico/alias.svg` y `ico/alias-512.png` si puedes exportarlo. NO copies imágenes de la película: dibujo original en SVG.
PRUEBAS: capturas del ícono a 16/32/64px en tema claro y oscuro; que la píldora de modo no cambie de tamaño; build --check; suites v18/*.
```

## V3 ALIAS-UI — rama `alias-ui` (requiere ING-A0 hecho)
Dueño de: `alias.html`, `alias.css`, `src/alias/10-vista.js`, `20-controles.js`, `30-resultado.js` (solo presentación; NO la lógica de llamadas en 90-api.js ni api/alias.js).
```
[MEGA-PROMPT] Rol: V3 ALIAS-UI. Rediseña la pantalla /alias para que sea espectacular y a la vez clara: tema ESPACIAL (fondo azul casi negro con estrellas muy sutiles, ícono tipo Gargantúa de V2), vidrio translúcido, dorado/morado de la marca. Estructura: cabecera con el ícono y «A.L.I.A.S.»; caja grande «¿Qué misión te doy?» con ejemplos clicables; al lanzar, línea de PASOS animada (cada paso: ícono de su herramienta —buscar, archivo, memoria, imagen, pensar—, estado pendiente/en curso/listo/error, tiempo); panel de resultado con fuentes citadas y archivos con la tarjeta de V1 (misma función fileKind); franja pequeña «Te quedan N misiones hoy» usando el campo `usage` que ya manda el servidor, y por paso el modelo usado (`model`, `why`) en letra pequeña si existe. Estados vacío/cargando/error/límite diario bien explicados. Español e inglés con alias-textos.json (no escribas textos sueltos; claves nuevas en AVISOS). Celular primero (390px), luego escritorio. prefers-reduced-motion. Cuida el rendimiento: nada de animaciones pesadas, máx. 60 estrellas por CSS o canvas ligero.
PRUEBAS: capturas de cada estado en 390 y 1440; contrato 12/12 y pantalla 11/11 (adapta las pruebas de pantalla SOLO si cambian los selectores y dilo).
```

## V4 PORTADA — rama `portada-simple`
Dueño de: `index.html`, `src/index-css/*` (archivos nuevos `05-portada-v3.css`), `src/index/*` (solo animaciones). Referencias: `equipo/referencias/landing-referencia-1.jpg` y `-2.jpg` (son maquetas de INSPIRACIÓN: el nombre «Sintonía IA» de la imagen NO se usa: se conserva el nombre y logo actuales de SynthZ/SynthFlow).
```
[MEGA-PROMPT] Rol: V4 PORTADA. Haz la página principal MÁS SENCILLA y con animaciones, manteniendo nombre, logo, colores y todas las funciones actuales (botón de entrar al chat, iniciar sesión, enlaces legales, instalar la app si existe).
Mira las 2 imágenes: (1) portada: titular grande de 2 líneas con una palabra en dorado y otra en morado, línea corta dorada, una frase, UN botón principal degradado dorado→morado con flecha, enlace secundario «Ir directo al chat», barra superior mínima (logo, 3 enlaces, Iniciar sesión), a la derecha una pieza visual de vidrio con una burbuja de chat brillante y estela morada, y al pie dos garantías de privacidad. (2) tras entrar: «¿Qué quieres hacer hoy?» con 4 tarjetas de vidrio (Estudiar, Código, Escribir, Ideas), cada una con su color e ícono, y debajo una franja «Ya sé qué IA quiero → Ir al chat».
HAZ: portada de UNA pantalla (sin secciones largas), texto adaptado al español y a lo que SynthZ realmente hace (no inventes funciones ni cifras). Animaciones: entrada escalonada del titular y botón (fade+subida 20px), burbuja flotando (6s), brillo que respira, fondo con 2-3 manchas de luz suaves que se mueven lento, hover del botón con brillo. Todo con CSS (transform/opacity), 60fps en celular medio, y prefers-reduced-motion lo apaga. Celular 390px: el visual pasa abajo o se reduce, un solo botón grande. Conserva las etiquetas de temas del chat (no tocar el chat).
PRUEBAS: capturas 390×844 y 1440×900 oscuro y claro; carga < 1 s sin librerías nuevas; el botón abre el chat; build --check; suites de la portada si existen.
```

## S2 SERVIDOR-2 (Grok 1) — rama `alias-servidor-2`
Dueño de: `api/alias.js`, `src/alias/prueba-servidor.mjs`, `alias-textos.json` (solo claves nuevas `srv.docs*` y `alias_docs_*`).
```
[MEGA-PROMPT] Rol: SERVIDOR-2. 
1) Corrige tu searchWikiLang: cambia process.env.POOL_WIKI_URL temporalmente y con 2 peticiones a la vez en la misma instancia se pisan. Hazlo sin tocar process.env (pasa la URL por parámetro propio o copia mínima de la búsqueda dentro de alias.js).
2) Enchufa DOCUMENTOS: trae equipo/recibido/DOCUMENTOS-entrega.txt (archivos api/_docs.js, src/alias/tools/50-docs.js, t/alias/docs.mjs). En alias.js: si el step trae `frags`, llama cupoDocs(me.sub), mete bloqueDatos(frags) en el mensaje del usuario (nunca en system) y devuelve `limit:true` con srv.docsLimite sin contar ese paso. Agrega las 11 claves de texto es/en a alias-textos.json. Pruebas nuevas dentro de prueba-servidor.mjs (inyección dentro del documento, 7 fragmentos, límite).
3) Entrega prueba-servidor.mjs COMPLETO (la vez pasada solo mandaste un resumen). Todas las pruebas deben seguir pasando; da el número real.
```

## ING INGENIERO — rama `arreglos-ingeniero` (Claude 2 o IA nueva)
Mismo prompt de la sección 2 de `REPARTO-2-CLAUDES-3-GROKS.md` (B1 Puter, B3 IAs que cambian solas, B4-B6 si existen, y A0: traer A.L.I.A.S. de `recuperacion-alias` con vercel.json). Prompt "CONTINUAR": «Ya montaste el entorno. Sigue desde ahí: entrega AUDITORIA-BUGS.md y arregla B1 y B3, un commit por bug».

## AUD AUDITOR (Grok 3)
Mismo prompt de la sección 5 de REPARTO-2-CLAUDES-3-GROKS.md.

## Prompt "CONTINUAR" (para un Claude que se quedó sin límite y vuelve)
`[MEGA-PROMPT] Continúa tu rol <V1/V2/V3/V4/ING> de equipo/REPARTO-RONDA-2.md. Revisa tu rama (git log) y haz lo que falte; no rehagas lo hecho.`

## Cuando entreguen
Claude (GOD) revisa regla por regla, corre pruebas, pega capturas a Sammuel, arregla fallos pequeños, junta ramas en este orden: ING → V1 → V2 → S2 → V4 → V3 → AUD, y sube a `main` solo con el "sí" de Sammuel.
