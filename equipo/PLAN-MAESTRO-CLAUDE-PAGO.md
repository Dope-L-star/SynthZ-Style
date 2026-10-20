# PLAN MAESTRO PARA EL CLAUDE DE PAGO (v2.4)
Escrito por Claude Opus el 20-oct-2026. **Tú eres el ejecutor; Opus es el revisor.** Cuando Opus vuelva, verificará tu trabajo corriendo UN solo comando (`bash t/aceptacion.sh`) y leyendo tu informe. Por eso: sigue el plan al pie de la letra, no improvises fuera de él, y no declares nada "hecho" sin pruebas que lo demuestren.

Antes de nada lee `equipo/ENTREGA-OTRO-CLAUDE.md` (reglas, quién es Sammuel, estado). Este plan lo AMPLÍA y, si algo choca, **este plan manda**.

---
## 0. Reglas innegociables (resumen)
1. **Jamás hagas push ni merge a `main`.** Tampoco borres ni cambies ramas `respaldo-*`. El paso a `main` (Fase 7) lo da Sammuel y lo confirma Opus; tú solo dejas todo listo.
2. Trabajas en una rama NUEVA: `v2.4`, creada desde `alias-fase1` (que ya incluye `nueva-version` v2.3 y A.L.I.A.S.). Commits pequeños, uno por tarea, con mensaje claro en español.
3. El código está en piezas: edita `src/…`, luego `node build.mjs`; verifica con `node build.mjs --check`. NO edites a mano los compilados (core.js, chat.js, index.js, pulsem.js, *.css de la raíz).
4. **Usuarios registrados y datos:** no cambies el formato de lo que se guarda en Redis/Supabase (claves `u:`, `sess:`, chats, memoria, etc.). Si algo nuevo necesita guardar datos, usa claves NUEVAS con prefijo propio y que la ausencia de esos datos no rompa nada.
5. Nunca pidas ni escribas claves/tokens. Variables de entorno: las pone Sammuel en Vercel; tú le dices cuáles, paso a paso.
6. Textos visibles: español e inglés desde el día 1 donde ya exista soporte (A.L.I.A.S. tiene `alias-textos.json`). En el resto del sitio el texto sigue en español; no empieces la traducción total (es otra ronda).
7. Sin promesas exageradas en el plan gratis. Los planes de pago (Chispa/Syntonia/Timeless/Orquesta) están **inactivos**: no los actives ni muestres precios. Sin música. Sin bot de Telegram.
8. Estilo visual: respeta los temas (`data-theme`), el modo Simple (`html.simple`), la barra a la izquierda (`html.navleft`), claro/oscuro y los celulares modestos (modo rápido, sin vidrio). Usa las variables `--gold`, `--wine`, etc. No inventes colores.
9. Sammuel NO es programador y habla español. Cada vez que le pidas algo, que sea de 1 a 3 pasos concretos ("abre tal pantalla, toca tal botón, dime qué ves o mándame captura").
10. Si te quedas sin presupuesto a mitad: **deja el repo en un estado que compila y pasa las pruebas**, sube la rama, y apunta en el informe exactamente dónde quedaste. Mejor menos fases bien hechas que todas a medias.

## 1. Mapa rápido del código (lo que Opus ya sabe y tú necesitas)
- `build.mjs` junta piezas `src/<carpeta>/NN-nombre.js|css` (nombre con `/^\d\d[a-z]?-/`) según `src/build.json`.
- Carpetas: `src/core` (todo el sitio), `src/chat` (chat), `src/index`(portada), `src/pulsem` (panel de equipo), y sus `*-css`. A.L.I.A.S.: `src/alias/` + `alias.html`, `alias.js`, `alias.css`, `alias-tools.js`, `alias-textos.json`, `alias-plantillas.json`.
- Servidor (`api/`): `_lib.js` (route, auth, redis/pipe, limit, roleOf…), `_pool.js` (modelos gratis `sz:auto`, búsqueda Tavily/Exa/Wikipedia, `chat()`), `ai.js`, `chat.js`, `chats.js`, `auth.js`, `me.js`, `config.js`, `help.js`, `trial.js`, `teams.js`, `health.js`, `alias.js`.
- Prefijos de modelos: `sz:` (IAs conectadas/gratis del servidor), `pu:` (Puter, del usuario), `gq:` (Groq con llave propia), `or:` (OpenRouter), `tr:` (prueba guiada).
- Selector de IA: `src/chat/00-inicio-catalogo-lista-ia.js` (lista, filtros `ui.*`, `visible()`, `renderList`), `src/chat/12-conexion-bloqueo-preocupada.js` (`puterOn()`, `connected()`), recomendaciones por tema: `src/chat/04-ejemplos-listos-usar.js` (`recommendTop`, `INTENT_NAME`).
- Modo agente del chat (SuperiorSynth): `src/chat/06-modo-agente-rescate.js`.
- Herramientas de prueba: `equipo/herramientas-prueba/` (léelo: `LEEME.md`). Adapta las rutas a tu entorno. No hay claves reales: usan un servidor simulado.

## 2. Fase 0 — Preparación (obligatoria, ~corta)
1. `git clone https://github.com/Dope-L-star/SynthZ-Style && cd SynthZ-Style && git checkout alias-fase1 && git checkout -b v2.4`. Trae también `equipo/` con `git checkout origin/equipo-alias -- equipo` (sin commitearlo si no quieres; sí puedes commitearlo aparte).
2. Lee: `INFORME.md`, `PENDIENTES.md`, `ALIAS.md`, `equipo/ENTREGA-OTRO-CLAUDE.md`, este plan, `equipo/herramientas-prueba/LEEME.md`.
3. Línea base (anota los números en el informe): `node build.mjs --check`; `node src/alias/prueba-servidor.mjs` (esperado 70/70); `node t/alias/contrato.mjs` (esperado 12/12); `t/alias/ui.mjs` (esperado 11/11, requiere Playwright+Chromium: instálalo si no está). Si una línea base falla, avisa antes de seguir.
4. Aplica los 2 parches de Abacus que revisó Opus (son seguros): están en el zip `Proyecto_SynthZ_SynthFlow.zip` que Sammuel tiene; si no lo tienes, rehaz a mano: en `src/alias/20-controles.js`, dentro de `cancelAll()`, justo después de `U.runSeq++; send({ a:'cancel' });` añade:
   `Object.values(S.results || {}).forEach(r => { if (r && r.file && r.file.blobUrl){ try{ URL.revokeObjectURL(r.file.blobUrl); }catch(e){} } });`
   y reconstruye con `node build.mjs`. Commit: "alias: libera enlaces al cancelar".
5. Crea `t/aceptacion.sh` (ver Fase 6 para su contenido) vacío con `echo` por ahora; lo irás llenando.

## 3. Fase 1 — Dos errores que Sammuel reportó (PRIORIDAD)
**Regla:** primero REPRODUCE cada error con una prueba que falle; luego corrige; la prueba debe pasar. No digas "arreglado" sin esa prueba. Si no puedes reproducir un síntoma, haz UNA pregunta a Sammuel (qué ve exactamente + captura) y mientras tanto avanza con otra cosa.

### 1A. Las IAs de Puter "no funcionan aunque las conecte y no aparecen en Buscar"
Síntoma (palabras de Sammuel): conectó Puter y aun así las IAs `pu:` no funcionan y no se ven al buscar en el selector.
Dónde mirar, en este orden:
1. `src/core/09-pulso-synthz-sigo-aqui.js` (~línea 64): `puter.ai.listModels()` arma el catálogo de Puter. Si la respuesta cambió de forma o falla, `cat.list` se queda sin `pu:` y el selector (que filtra con `m.id.startsWith('pu:')`) no tiene nada que mostrar. Revisa: ¿qué forma tiene hoy la respuesta de Puter? (consulta la documentación oficial de Puter; `developer.puter.com`). ¿Se filtran modelos por un campo que ya no existe?
2. `src/chat/12-conexion-bloqueo-preocupada.js`: `puterOn()` usa `window.puter && puter.auth.isSignedIn()`. Comprueba si el script de Puter se carga (¿lo bloquea el CSP de `vercel.json`? mira `script-src`/`connect-src`/`frame-src` para los dominios de Puter) y si se reconstruye el catálogo DESPUÉS de conectar (evento tras `puterSignIn()`; busca `afterConnect`).
3. `src/chat/00-inicio-catalogo-lista-ia.js`: `visible(q)` y `renderList` — que la búsqueda `nameHit` y los filtros (`ui.prov`, `ui.free`, pestañas `ptab`) no escondan los `pu:`. Ojo con `m.free` (un modelo de Puter no es "free" del servidor).
4. Envío: `src/chat/06-modo-agente-rescate.js` y donde se llame a `puter.ai.chat` — que el `model` que se manda sea el id correcto sin el prefijo `pu:`.
Entrega mínima: (a) causa raíz explicada en 3 líneas simples en el informe; (b) catálogo de Puter **resiliente**: si `listModels()` falla o llega vacío, usa una lista de respaldo estática con los modelos más usados y muestra un aviso claro ("Puter no respondió; mostrando las más comunes · Reintentar"); (c) tras conectar Puter, el catálogo se reconstruye solo y el selector se repinta; (d) prueba automática con un `window.puter` simulado que cubra: conectado con lista normal, lista vacía, lista con otra forma, error de red.
Nota: desde tu entorno quizá no puedas llegar a Puter real. Si no puedes, dilo, y dale a Sammuel un checklist manual de 5 pasos para comprobar con su cuenta real.

### 1B. El filtro "DE DÓNDE" tiene un error
Es el selector segmentado `#provSeg` (aria-label "De dónde"), con botones Todos / Gratis / Puter (`chat.html` ~línea 157). Lógica en `src/chat/00-inicio-catalogo-lista-ia.js`: líneas ~15 (carga `ui.prov` guardado), ~82 (filtro), ~115 (reset), ~149 (agrupa), ~256-257 (click) y `placePill`.
Hipótesis a comprobar con pruebas (no te quedes con ninguna sin probarla):
- `ui.prov` guardado en localStorage puede valer `or` o `gq` (el código los admite) pero **no hay botón** para ellos en `chat.html`: la lista queda filtrada a algo vacío sin pestaña marcada. Línea ~115 solo lo resetea si `gqOn()/orOn()` son falsos.
- La "píldora" (`placePill`) se coloca midiendo el ancho cuando el selector aún está oculto (ancho 0) → queda mal puesta hasta que se redimensiona.
- Con Puter sin conectar, la pestaña Puter muestra lista vacía sin explicación (debería mostrar las IAs de Puter bloqueadas con "Conecta tu Puter").
- Estado `aria-selected` o `ui.prov` que no se restablece al abrir el selector, tras el recorrido guiado (`tourPick`, `09-barrita-lateral-chats.js` ~134) o en el modo Simple.
- Se comporta distinto en celular (ver `08-modo-panel-movil-atajos.js`).
Entrega mínima: (a) causa raíz en el informe; (b) corrección; (c) prueba que recorre Todos→Gratis→Puter→Todos y comprueba: pestaña marcada, píldora bajo el botón correcto, lista coherente, valor guardado válido, y también con `ui.prov` "sucio" guardado de antes (`or`, `gq`, `zzz`); (d) el valor inválido nunca debe romper nada: se normaliza a `all`.
Si no logras reproducirlo: pregunta a Sammuel una sola cosa: "¿Qué ves exactamente al tocar 'De dónde'? Mándame captura y dime si estás en celular o computador."

Commit por cada error. Reconstruye (`node build.mjs`) y corre todo antes de cada commit.

## 4. Fase 2 — Pendientes de A.L.I.A.S. (la lista que ya conocemos)
Un commit por punto, cada uno con su prueba en `t/alias/` o `src/alias/prueba-servidor.mjs`:
a) Presentaciones: hoy se arman en dos sitios (`src/alias/30-resultado.js` `deckBlob()` y `src/alias/tools/20-file.js` `makePptx()`). Deja UNO (recomendado: `deckBlob`). Borra el otro y todo lo que quede sin uso.
b) Textos y plantillas sin usar (~100 claves de `alias-textos.json` y `alias-plantillas.json`): úsalos de verdad (por ejemplo: las 4 plantillas en la pantalla de inicio con `textoAyuda`) o bórralos. No dejes basura.
c) `searchWiki` (en `api/_pool.js`) solo busca en Wikipedia en español: que reciba `lang` y use `en.wikipedia.org` si el idioma es inglés. Revisa también quién más lo llama.
d) `PPT_RX` en `api/alias.js` mira también `plan.goal` y se activa de más: debe mirar solo título+input del paso.
e) Dos respuestas basura seguidas del modelo gastan cupo: en `doPlan`, `answered=true` aunque el JSON sea inválido. Solo debe contar como respondido si se obtuvo un plan válido; si no, devuelve el cupo.
f) Respuesta `503` de `route()` en `api/_lib.js` sale sin `ok:false`: normaliza para que A.L.I.A.S. siempre reciba `{ok:false,error}`.
g) Accesibilidad pendiente de CAZADOR: `inert` en la intro mientras está activa, `aria-live` del envío en el chat, `lang` al cambiar idioma en las páginas donde falte (A.L.I.A.S. ya lo tiene).
h) Enlace de la imagen generada: se libera al cancelar (parche de Fase 0) **y** al descargar/cerrar. Verifica.
i) `sw.js`/`vercel.json`: confirma que `/alias` y los JSON de A.L.I.A.S. no se cachean viejos y que `api/alias.js` tiene `maxDuration` 60 (Abacus dice que ya está; compruébalo tú).
Criterio de salida: suites A.L.I.A.S. en verde (mismos 70/12/11 o más) y `--check` limpio.

## 5. Fase 3 — Barra del compositor: Modo · Modelo · Esfuerzo (lo que Sammuel pidió "como Abacus")
Referencia: en el chat de Abacus, bajo la caja de texto hay tres controles: **Modo** (Auto / Chat / CoWork / Code / Agent), **Modelo** (lista con buscador) y **Esfuerzo** (Auto / Low / Medium / High-Pro). Nosotros lo hacemos **funcional con lo que ya tenemos, sin inventar capacidades**:

### 5.1 Qué controles y qué hacen de verdad
**Modo** (menú con icono + 1 línea de ayuda; el modo elegido se guarda en `localStorage synthz:modo`):
- **Auto** (por defecto): SynthonIA/`recommendTop` decide según lo que escribes (ya existe la detección de intención `INTENT_NAME`). Muestra pequeño "Auto → Código" cuando decide.
- **Chat**: respuesta normal con el modelo elegido, sin cambiar nada.
- **Investigar**: activa la búsqueda en internet con fuentes (ya existe la herramienta web del chat; reutilízala, no la dupliques).
- **Código**: elige entre las IAs expertas en código (`expert(m).tags.includes('code')`) y añade al sistema una instrucción de programar con explicaciones breves; formato en bloques de código.
- **Agente**: abre/continúa en **SuperiorSynth** (`06-modo-agente-rescate.js`) y, para tareas largas por pasos, ofrece "Abrir en A.L.I.A.S." (`/alias`) pasando el texto como objetivo (sin perderlo).
- NO incluyas "CoWork/archivos del computador": no es posible aquí. No prometas nada que el sitio no haga.
**Modelo:** muestra el modelo actual como botón (logo + nombre corto) y al tocar abre el selector que ya existe (no hagas otro). Con "Auto" muestra "Automática" (`sz:auto`). Si el modo fuerza una experta (Código), muestra cuál se usó tras responder y deja cambiarla con un clic ("¿usar otra?").
**Esfuerzo** (llámalo **Velocidad/Profundidad** si "esfuerzo" suena raro en español): Auto / Rápido / Normal / Profundo.
- Rápido: respuesta corta (menos `maxTokens`), prefiere modelos rápidos.
- Normal: como hoy.
- Profundo: más `maxTokens`, prefiere modelos con `reasoning` si hay, instrucción "razona paso a paso y verifica". Como no hay planes de pago activos, **no lo bloquees con candado "Pro"**: aplica el tope diario normal y, si el usuario gasta mucho, el aviso de límite de siempre. Muestra el costo aproximado (ver Fase 4) cuando exista.
- Auto: decide según longitud/complejidad del mensaje (regla sencilla y documentada).
Los tres valores viajan en la petición al servidor como campos NUEVOS y opcionales (`mode`, `effort`); el servidor (`api/chat.js`/`_pool.js`) los **valida con lista blanca** y, si faltan o son inválidos, se comporta exactamente como hoy (compatibilidad con clientes viejos y con `main`).

### 5.2 Dónde va y cómo se ve
- Nueva pieza `src/chat/05d-barra-modo.js` (+ `src/chat-css/…-barra-modo.css`). Registra las piezas en `src/build.json` si hace falta.
- En la caja de escribir (ver `src/chat-css/02-caja-escribir.css` y la estructura del compositor en `chat.html`), una fila de 3 botones redondeados bajo el campo, como en las capturas de Abacus: [＋ adjuntar (ya existe)] [Modo ▾] [Modelo ▾] [Velocidad ▾].
- Celular: solo iconos + 1 palabra; menús como hoja inferior (bottom sheet) que no tapan el teclado. Escritorio: menús desplegables encima de la caja.
- Teclado y lector de pantalla: botones con `aria-haspopup`, `aria-expanded`, flechas y Esc; foco visible (usa los estilos de `00z-a11y.css`).
- Respeta Simple, temas y `navleft`. En modo Simple, muestra **solo** Modelo (el resto oculto en "Más…").
- No debe empeorar el rendimiento en celular: sin blur/sombras pesadas, sin animaciones continuas.
- Textos: español (y deja las claves preparadas para inglés si ya hay diccionario de chat; si no, no lo inventes).

### 5.3 Pruebas (obligatorias)
Con el servidor simulado: cambiar cada control → se guarda → recarga → persiste; cada modo envía los campos correctos; `Auto` decide bien para 6 frases de ejemplo (código, "busca…", charla, tarea larga, etc.); modo Agente abre `/alias` con el objetivo; el servidor ignora valores inválidos; versión celular (viewport 390×844) sin desbordes; Simple muestra solo Modelo; teclado completo.

## 6. Fase 4 — A.L.I.A.S.: costo visible y modelo por paso
Es la gran ventaja contra Abacus (que es opaco): **mostrar antes y después**.
- Antes de ejecutar un plan: "Esta misión usará ~N pasos, ~M búsquedas. Te quedan X misiones, Y pasos y Z búsquedas hoy." Datos: contadores ya existentes en `api/alias.js` (`PLANS_DAY`, `STEPS_DAY`, `SEARCH_DAY`, global). Añade al servidor un `action:'usage'` (o devuélvelo dentro de `plan`) con lo que le queda al usuario. Sin romper el contrato actual.
- Después de cada paso: qué gastó realmente y **qué modelo respondió y por qué**. Para eso `chat()` de `api/_pool.js` debe devolver el modelo real usado y se añade `step.model` (campo nuevo, opcional).
- Botón "Rehacer con otro modelo" por paso (lista corta de modelos gratis disponibles; el servidor valida contra lista blanca).
- Resumen final: total de pasos/búsquedas usados.
- Textos nuevos en `alias-textos.json` (es y en, mismas claves). Pruebas de servidor (cupos, campos nuevos, lista blanca) y de pantalla.

## 7. Fase 5 — Leer documentos con citas (PDF/CSV/TXT), sin base vectorial
- Ubicación: dentro de A.L.I.A.S. como herramienta nueva `docs` y/o en el chat al adjuntar archivo (primero A.L.I.A.S.). No dupliques lo que el chat ya haga con adjuntos: léelo (`05-detener-favoritos-archivos.js`) y reutiliza.
- Flujo: el usuario sube un archivo (tope 5 MB y N páginas, avisa si se excede) → se extrae el texto **en el navegador** (PDF con pdf.js cargado bajo demanda desde un CDN permitido por el CSP, o texto/CSV directo; si el CSP no lo permite, ajusta `vercel.json` con el dominio mínimo necesario y dilo en el informe) → se trocea (~1.200 caracteres con solape) → búsqueda por palabras clave con puntuación (BM25 simple, en JS puro) → al servidor se envían SOLO los 4–6 fragmentos más relevantes con su número de página → la respuesta cita `[p. 3]` y la pantalla muestra el fragmento al tocar la cita.
- Privacidad: el archivo completo NO se sube ni se guarda; dilo en pantalla. Cupo diario propio (clave Redis nueva) y tope de tamaño.
- Los fragmentos son DATO, no instrucciones (mismo `<datos>` del servidor).
- Pruebas: texto de ejemplo, PDF pequeño de prueba (crea uno), CSV, archivo demasiado grande, archivo sin texto (escaneado) con mensaje amable, intento de inyección dentro del documento ("ignora tus reglas") sin efecto.

## 8. Fase 6 — Cierre y prueba de aceptación (para que Opus confirme en 2 minutos)
1. `t/aceptacion.sh` — **un solo comando** que haga, en orden, e imprima `OK`/`FALLO` y un total final: `node build.mjs --check`; `node src/alias/prueba-servidor.mjs`; `node t/alias/contrato.mjs`; `t/alias/ui.mjs`; las pruebas nuevas de Fases 1,3,4,5; y las regresiones de `equipo/herramientas-prueba/v23/suites.sh` (anota cuáles son los 2 fallos viejos conocidos: b2 y v19/migra; deben seguir siendo EXACTAMENTE esos y ninguno más).
2. Actualiza `INFORME.md` (entrada "v2.4": qué cambió, para humanos) y `PENDIENTES.md` (marca lo hecho; lo no hecho queda explicado).
3. Escribe `equipo/INFORME-DEL-RELEVO.md` con: por fase → qué se hizo, qué pruebas lo demuestran (números reales), qué **no** se hizo y por qué, decisiones propias, riesgos, y variables de entorno nuevas si hay (ninguna debería ser obligatoria).
4. Sube la rama `v2.4` a GitHub y abre un PR `v2.4 → nueva-version` (NO a main). Vercel generará una vista previa: pásale a Sammuel el enlace y la lista corta de cosas que probar con su cuenta (Puter real, filtro "De dónde", barra Modo/Modelo/Velocidad en celular y computador, una misión de A.L.I.A.S. con costo visible, un PDF con citas).
5. Si el PR de la rama no se puede abrir por permisos (le pasó a Abacus), dile a Sammuel exactamente qué permiso dar a la app, o deja el enlace de comparación de GitHub (`…/compare/nueva-version...v2.4`).

## 9. Fase 7 — Paso a producción (SOLO con luz verde de Opus y de Sammuel; tú NO lo ejecutas)
Orden que seguirá Opus (tú no lo haces, pero déjalo preparado y explícaselo a Sammuel):
1. Sammuel prueba la vista previa y dice "sí".
2. Opus corre `bash t/aceptacion.sh` y lee el informe; si algo no cuadra, se corrige antes.
3. Se confirma que **no cambió ningún formato de datos de usuarios** y que los respaldos `respaldo-main-v2.2B-20oct` y `respaldo-v2.3-20oct` siguen intactos; Opus crea un respaldo nuevo del estado previo de `main` justo antes.
4. Merge `v2.4 → nueva-version → main` y revisión de Vercel (runtime logs, `/api/health`, login, chat, A.L.I.A.S.). Plan de vuelta atrás: restaurar `main` al respaldo.
Importante: la v2.3 todavía no la ha probado Sammuel en producción (Google con tres cuentas, mantenimiento activar/desactivar, instalar la app en el celular). Esas pruebas van en su lista antes del "sí".

## 10. Cómo reportarle a Sammuel durante el trabajo
Al terminar cada fase (máx. 5 líneas, en español simple): qué quedó, qué debe probar él (1–3 pasos) y qué sigue. Nada de pegarle código. No le pidas decisiones técnicas; si necesitas una, ofrécele 2 opciones con tu recomendación.

## 11. Anti-errores (lecciones de este proyecto)
- Una IA ya dañó cosas antes por tocar de más: **toca solo lo que la tarea pide**. Si ves otro problema, anótalo en el informe en "AVISOS".
- Los textos de las claves (`t('clave')`) deben existir en el diccionario ANTES de usarlos; crea una prueba que verifique que todas las claves usadas existen en es y en.
- Cuando algo "ya estaba bien", demuéstralo con una prueba, no con una frase.
- No marques tareas como terminadas si las pruebas no corrieron. Informa cuántas pasaron y cuántas no, con números reales.
- No reescribas archivos enteros para cambiar 3 líneas; cambios mínimos y revisables.

## 12. Mensaje para pegar al abrir el chat con el Claude de pago
"Eres el ejecutor del proyecto SynthZ/SynthFlow de Sammuel (hispanohablante, no programador). Clona https://github.com/Dope-L-star/SynthZ-Style, rama `alias-fase1`, trae la carpeta `equipo/` de la rama `equipo-alias`, y lee COMPLETOS `equipo/PLAN-MAESTRO-CLAUDE-PAGO.md` y `equipo/ENTREGA-OTRO-CLAUDE.md`. Ejecuta las fases 0 a 6 en orden, en la rama nueva `v2.4`, con commits pequeños y pruebas reales. Nunca toques `main` ni las ramas `respaldo-*`. Si te quedas sin presupuesto, deja el repo compilando y con pruebas en verde y anota dónde quedaste en `equipo/INFORME-DEL-RELEVO.md`. Al terminar, deja `t/aceptacion.sh` funcionando para que Opus lo verifique con un solo comando."
