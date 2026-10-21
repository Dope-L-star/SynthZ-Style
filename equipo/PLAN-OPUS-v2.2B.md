# PLAN PARA OPUS (el ejecutor) — rehacer desde v2.2B, sin romper nada
Escrito el 20-oct-2026 por Claude (el revisor). **Este plan REEMPLAZA a `PLAN-MAESTRO-CLAUDE-PAGO.md` y `ENTREGA-OTRO-CLAUDE.md` en todo lo que choque; esos dos quedan solo como material de consulta** (sus fases de funciones nuevas se reutilizan en la Fase 6).
Quién es Sammuel: Colombia, español, **no es programador**, está cansado y dolido porque la v2.3 dejó la página dañada. Habla simple, un paso a la vez, nada de pegarle código, y no le prometas nada que no hayas probado.

## 0. Decisión de Sammuel (no se discute)
- **Todo se reinicia desde la v2.2B**, que es lo publicado en `main` y "funciona perfecto". Se quita todo lo nuevo (v2.3 y lo de los otros agentes) y se vuelve a meter pieza por pieza SOLO si no daña nada.
- **NO se publica nada en `main` todavía.** Nunca toques `main` ni las ramas `respaldo-*`. El paso a producción lo decide Sammuel con la luz verde del revisor, mucho después.
- **No se pierden usuarios registrados** ni se cambia el formato de sus datos.
- Orden de trabajo que él pidió: **(1) recoger y analizar TODOS los bugs, micro-punto por micro-punto; (2) arreglarlos micro-punto por micro-punto; (3) recién entonces el plan nuevo: A.L.I.A.S. y lo demás.**

## 1. Ramas (ya creadas en https://github.com/Dope-L-star/SynthZ-Style)
| Rama | Qué es | Uso |
|---|---|---|
| `main` | v2.2B publicada (7f7f89e) | **Intocable** |
| **`v2.2B-limpia`** | copia exacta de `main` | **Tu punto de partida.** Crea `v2.4` desde aquí |
| `recuperacion-alias` | `main` + A.L.I.A.S. aislado (7155207). Interfaz/servidor existentes idénticos a main; pruebas 70/70, 12/12, 11/11 | Cantera de A.L.I.A.S. (Fase 5) |
| `nueva-version`, `alias-fase1` | v2.3 (mía) y A.L.I.A.S. integrado | **Solo cantera** (Fase 5); sospechosas de los daños |
| `respaldo-v2.3-20oct`, `respaldo-main-v2.2B-20oct` | respaldos | Intocables |
| `equipo-alias` | carpeta `equipo/` (planes, entregas, herramientas de prueba) | Documentación |
Tu rama de trabajo: `v2.4` creada con `git checkout -b v2.4 origin/v2.2B-limpia`. **Cuidado: asegúrate de que tu rama NO haga seguimiento de `origin/main`** (`git branch --set-upstream-to=origin/v2.4 v2.4` tras el primer push). Un `git push` accidental a `main` sería grave.

## 2. Reglas innegociables
1. Un cambio = un commit = un problema = una prueba. Nada de mezclar. Nada de "ya que estaba".
2. Cambios **mínimos**: no reescribas archivos ni refactorices. Toca solo las líneas del defecto.
3. Código por piezas: edita `src/…` y corre `node build.mjs`; `node build.mjs --check` debe quedar limpio. No edites a mano los compilados.
4. Cada arreglo lleva: **prueba que falla antes y pasa después** + **captura antes/después** (celular 390×844 y escritorio 1440×900) en `equipo/capturas/<id>/`.
5. Nunca pidas ni escribas claves. Variables de entorno: las pone Sammuel en Vercel; tú le dices cuáles, paso a paso.
6. No actives planes de pago (Chispa/Syntonia/Timeless/Orquesta). Sin música. Sin Telegram.
7. No cambies diseño, textos ni colores que no sean parte de un bug.
8. Si te quedas sin presupuesto: deja el repo compilando, con pruebas en verde, rama subida, y anota dónde quedaste en `equipo/INFORME-DEL-RELEVO.md`.
9. Pruebas con datos simulados NO bastan por sí solas: la v2.3 pasó todas sus pruebas y aun así dañó la experiencia real. Por eso la Fase 1 exige reproducir con el estado real de un usuario (ver 3.2).

## 3. FASE 0 — Preparación y diagnóstico clave (corta, obligatoria)
### 3.1 Línea base
Clona, `git checkout -b v2.4 origin/v2.2B-limpia`. Lee `INFORME.md`, `PENDIENTES.md`, `src/LEEME.md`. Instala Playwright+Chromium. Corre `node build.mjs --check`. Trae las herramientas de prueba: `git checkout origin/equipo-alias -- equipo/herramientas-prueba` (lee su `LEEME.md`; adapta rutas fijas de `/home/claude/...` y `/opt/node-tools/...`). Corre las suites de regresión (`v23/suites.sh`); los únicos fallos conocidos de antes son **b2 (Puter/saldo)** y **v19/migra** (arneses viejos). Apunta los números.
### 3.2 Entorno realista (imprescindible)
El servidor simulado `equipo/herramientas-prueba/be/dev.mjs` hoy NO activa las "IAs conectadas" (`szOn()`), por eso no se reprodujo el síntoma de IAs que cambian solas. **Primero mejóralo** para tener estos estados y úsalos en toda la auditoría:
 a) usuario nuevo sin sesión; b) sesión iniciada con chats guardados; c) IAs conectadas activas (`sz:auto` + 5 modelos gratis); d) Puter conectado y no conectado; e) `localStorage` "sucio" (claves `synthz:*` de versiones viejas, `ui.prov` con valores raros, `pinned` huérfano); f) celular táctil (390×844, `pointer:coarse`) y escritorio; g) modo Simple, temas y barra a la izquierda **si existen en v2.2B** (si no existen, no los inventes).
### 3.3 Diagnóstico decisivo (Sammuel te ayuda, 3 pasos simples)
Sammuel dice que la vista previa de `recuperacion-alias` seguía "bugueada" aunque su interfaz es **idéntica a main**. Eso significa una de tres cosas, y debes saber cuál antes de seguir:
 1. Los bugs también están en `main` (v2.2B) y no los había notado → se arreglan en esta fase.
 2. La **vista previa de Vercel se comporta distinto** a producción (variables de entorno de Preview distintas, otro dominio que rompe cookies/sesión/Google/Puter, o caché del navegador).
 3. Estado guardado de su navegador (localStorage/service worker de la v2.3 que quedó instalado).
Pídele: "Abre en una ventana de incógnito (a) `synthz-style.vercel.app` y (b) el enlace de vista previa de la rama `v2.2B-limpia`, y dime si en cada una ocurre lo mismo, con una captura." (La rama `v2.2B-limpia` es idéntica a main: si la vista previa falla y producción no, el problema es del entorno de vistas previas, no del código.) Si el service worker de la v2.3 sigue instalado en su navegador, díselo claro: Chrome → candado → Configuración del sitio → Borrar datos.

## 4. FASE 1 — AUDITORÍA TOTAL: "todos los bugs, micro-punto por micro-punto"
Objetivo: encontrar **absolutamente todos** los defectos de v2.2B ANTES de arreglar ninguno. Resultado: `equipo/AUDITORIA-BUGS.md`.
### 4.1 Método (estático, archivo por archivo)
Recorre **cada pieza** de `src/` en orden (`src/core`, `src/chat`, `src/index`, `src/pulsem` y sus `*-css`) y cada archivo de `api/`, más `chat.html`, `index.html`, `pulsem.html`, `vercel.json`, `sw.js` si existe. Por cada uno, revisa línea a línea y anota (no arregles todavía):
 - errores lógicos, variables no definidas, condiciones invertidas, `await` faltante, promesas sin `catch`, listeners duplicados o sin quitar (fugas), temporizadores (`setInterval/setTimeout`) que nunca se limpian, estados que se pisan entre sí;
 - **selección de IA**: todo lo que escriba `st().pinned`, `st().model.openrouter`, llame `pickModel(`, `recommend(`, `switchProv(`, `connected(`/`szOn()`/`puterOn()` y pueda cambiar el modelo sin clic del usuario (hay pistas en `src/chat/17-arranque.js`, `12-conexion-bloqueo-preocupada.js`, `00-inicio-catalogo-lista-ia.js`, `06-modo-agente-rescate.js`);
 - **catálogo de Puter** (`src/core/09-pulso-synthz-sigo-aqui.js` ~64, `puter.ai.listModels`) y filtros (`#provSeg` "De dónde", `ui.prov`, `visible()`);
 - **capas y z-index**: todo `position:fixed/absolute` que pueda quedar sobre la UI (cursor `#cr`, partículas `burst`, `11-escritura-brillo-golpe-cristal.js`, `.pdot`, `#betaBot`, ventanas `.szm`, guía, recorrido);
 - **SynthonIA**: `face()` (`src/core/20-…`), tutoriales (`10-guia-asistida-synthonia-ensena.js`), huecos vacíos, caritas que desaparecen;
 - **sonidos**: busca `AudioContext`, `Audio(`, `beep`, `tone`, `.play(` y mira cuándo se disparan (ruido del botón BETA);
 - seguridad y datos en `api/`: validación de entradas, límites, errores que filtran detalles, formato de claves en Redis;
 - accesibilidad básica (foco, aria, contraste), rendimiento en celular, y CSS: reglas que nunca aplican, `!important` conflictivos, `@media` mal escritas (ya se halló `max-width:0px` en `prefers-reduced-motion`).
### 4.2 Método (dinámico, flujo por flujo)
Con los estados de 3.2, recorre y **captura pantalla + consola + red** de cada flujo, en celular y escritorio: portada → entrar → chat vacío → elegir IA (todas las pestañas del selector, buscar, favoritas, comparar) → "Usar automática" → escribir y enviar → respuesta en vivo → regenerar/continuar → nuevo chat → cambiar de chat → Mis chats/Favoritos/Agente (SuperiorSynth) → ajustes y cuenta → conectar/desconectar Puter → límite agotado → sin conexión → Guía asistida y cada tutorial de SynthonIA → botón BETA y ayuda → equipos → Pulsem. Deja `equipo/capturas/auditoria/`.
### 4.3 Bugs que Sammuel ya reportó (verifica si existen en v2.2B y cuáles no)
 B1. Las IAs de Puter no funcionan aunque las conecte y no aparecen al **buscar** en el selector (existe en main).
 B2. El filtro **"De dónde"** (`#provSeg`) tiene un error (existe en main; hipótesis: `ui.prov` guardado en `or`/`gq` sin botón, píldora mal medida si el selector está oculto, pestaña Puter vacía sin explicación).
 B3. **Las IAs se cambian solas**: al elegir una IA o "Usar automática", luego "queda la opción de selección por todo el chat" y al escribir se cambia a "DeepSeek 0813" y sigue cambiando sin parar.
 B4. **"Bolitas" por encima de toda la UI** del chat y de las pantallas.
 B5. **La carita de SynthonIA desaparece** al elegir un tutorial y queda un espacio en blanco ("selecciónalo acá").
 B6. **El botón BETA** a veces desaparece y "hace como ruidos".
 B7. SuperiorSynth no debe ser pestaña junto a "Chats": va en la **sidebar, bajo "Mis chats"** (en v2.2B la barra dice "Chats | Agente | Favoritos"; el cambio de nombre a SuperiorSynth y su ubicación se resuelven en la Fase 5).
 B8. Pendientes viejos: el video de la ventana de instalación (horrible; fuera por ahora), `b2` y `v19/migra` del arnés.
 Para cada uno anota: ¿existe en v2.2B?, ¿cómo se reproduce?, causa raíz, archivo:línea.
### 4.4 Formato de `AUDITORIA-BUGS.md`
Tabla: **ID · severidad (crítica/alta/media/baja) · archivo:línea · síntoma · cómo reproducir · causa raíz · arreglo propuesto (1 línea) · riesgo del arreglo**. Primero los que afectan a usuarios reales (B1–B6), luego el resto. Al final: lista de lo que revisaste y **no encontraste nada** (para saber qué quedó cubierto). **No arregles nada hasta terminar este documento y mostrárselo a Sammuel (resumen de 10 líneas) y al revisor.**

## 5. FASE 2 — ARREGLAR, micro-punto por micro-punto
En el orden de severidad de `AUDITORIA-BUGS.md`. Por cada bug: (1) escribe la prueba que lo reproduce y **falla**; (2) el cambio mínimo; (3) la prueba pasa; (4) corre TODAS las suites y `--check`; (5) captura antes/después; (6) commit `fix(<id>): …`. Reglas extra:
 - **Regla de la selección de IA (B3):** si el usuario elige una IA (incluida "Automática"), **nada** puede cambiarla hasta que el usuario la cambie, salvo el cambio de emergencia por límite agotado, que debe avisar con un mensaje visible. Prueba: 30 s de escritura/envíos/recargas con cada tipo de elección, sin un solo cambio no pedido.
 - **Puter (B1):** catálogo resiliente (lista de respaldo + aviso "Puter no respondió · Reintentar"), que se reconstruya al conectar, y búsqueda que encuentre modelos `pu:`. Prueba con `window.puter` simulado: conectado normal, lista vacía, otra forma de respuesta, error de red. Si desde tu entorno no llegas a Puter real, entrégale a Sammuel un checklist manual de 5 pasos.
 - **Bolitas (B4):** una prueba que falle si existe, en cualquier momento, un elemento `position:fixed` redondo y pequeño inesperado sobre la UI.
 - Cada corrección debe verse igual o mejor que v2.2B: **prueba de regresión visual** (ver 7.2).
**Puerta 1:** al terminar la Fase 2, informe a Sammuel (5 líneas + enlace a la vista previa de `v2.4` + 5 cosas simples para probar) y al revisor. No sigas a la Fase 3 sin luz verde.

## 6. FASE 3 — A.L.I.A.S., desde la cantera aislada
Trae A.L.I.A.S. de `recuperacion-alias` (no de `alias-fase1`): `git checkout origin/recuperacion-alias -- ALIAS.md alias-plantillas.json alias-textos.json alias-tools.js alias.css alias.html alias.js api/alias.js src/alias build.mjs src/build.json t/alias` y añade a `vercel.json` la función `api/alias.js` (`maxDuration` 60) y el rewrite `/alias → /alias.html` (cámbialo con cuidado, es el único archivo compartido que se toca). Verifica: `node build.mjs --check`, `node src/alias/prueba-servidor.mjs` (70/70), `node t/alias/contrato.mjs` (12/12), `t/alias/ui.mjs` (11/11; necesita Playwright accesible desde el repo).
Luego, y solo luego:
 a) **Entrada visible** en la sidebar, debajo de "Mis chats" (junto a SuperiorSynth, que también vive ahí): ícono + "A.L.I.A.S." + una línea; abre `/alias`. En celular, en el menú, sin añadir pestañas a la barra inferior.
 b) Pendientes de A.L.I.A.S.: presentaciones armadas en dos sitios (`30-resultado.js` `deckBlob()` y `tools/20-file.js` `makePptx()`: deja uno); ~100 textos de `alias-textos.json` y `alias-plantillas.json` sin usar (úsalos o bórralos); `searchWiki` solo español (que reciba `lang`); `PPT_RX` mira `plan.goal` y se activa de más; dos respuestas basura seguidas gastan cupo (`doPlan`: `answered=true` aunque el JSON sea inválido); 503 de `route()` sin `ok:false`; enlace de la imagen sin liberar (al cancelar: `URL.revokeObjectURL` en `cancelAll()`); `inert` en la intro y `aria-live` del envío.
 c) Una **prueba de punta a punta** con sesión simulada, y checklist manual para Sammuel con claves reales en la vista previa (qué variables poner en Vercel → Preview; explícaselo en pasos simples).
**Puerta 2:** revisor + Sammuel.

## 7. FASE 4 — Red de seguridad contra otro desastre (hazla ANTES de re-introducir nada)
### 7.1 Por qué
La v2.3 metió ~15 cambios a la vez, pasó sus pruebas y aun así dañó la UI. Se necesita una red que detecte cambios visuales y de comportamiento no pedidos.
### 7.2 Qué construir
 - **Regresión visual:** un script que abre las pantallas clave (portada, chat vacío, selector de IA, chat con mensajes, ajustes, SynthonIA/guía, Pulsem) en 390×844 y 1440×900, con los estados de 3.2, y **compara píxel a píxel contra capturas "doradas" de v2.2B** (tolerancia pequeña). Cualquier diferencia no esperada hace fallar. `t/visual/…` + `equipo/capturas/doradas/`.
 - **Comportamiento:** una prueba de "sesión larga" (60 s) que escribe, envía, abre y cierra paneles y verifica que modelo elegido, panel abierto y chat actual no cambian solos.
 - **`t/aceptacion.sh`:** un solo comando que corre `--check`, todas las suites, la regresión visual y la prueba de sesión larga, y termina con `TODO OK` o la lista de fallos. El revisor lo usará para confirmar en 2 minutos.

## 8. FASE 5 — Re-introducir lo bueno de la v2.3 (cantera), UNA pieza por commit
Cantera: `origin/nueva-version` (qué cambió: `INFORME.md` entrada v2.3). Método por pieza: traerla (`git checkout origin/nueva-version -- <archivos>` o reescribirla a mano), `node build.mjs`, correr `t/aceptacion.sh` (incl. regresión visual: los únicos cambios visuales permitidos son los de esa pieza), captura, commit. **Si una pieza reintroduce un síntoma de la Fase 1, se aísla y NO entra** hasta arreglarla (anótalo en el informe). Orden, de menor a mayor riesgo visual:
 1. Servidor puro: roles por correo verificado (`emailRole` en `api/_lib.js`), medidor mensual de Redis (`_lib.js`+`health.js`+tarjeta de Pulsem), API de mantenimiento (`config.js`, `trial.js`, `help.js`), vincular Google en el servidor (`auth.js` modos `link`/`addpass`).
 2. Textos de SynthonIA al día (`22-synthonia…`: nombres, pasos de Puter, app, temas).
 3. Aviso de mantenimiento con SynthonIA (`src/core/25e-mantenimiento-synthonia.js` + `08-mantenimiento.css`): solo existe en el DOM si hay mantenimiento activo.
 4. Seguridad/vincular Google (UI, `14-seguridad-ajustes.js`).
 5. SuperiorSynth en la **sidebar bajo "Mis chats"** (NO pestaña superior), con el nombre nuevo; el ícono animado (`06-modo-agente-rescate.js` `ssIco`) **al final y con la prueba de bolitas**.
 6. App instalable (PWA): `synthflow.webmanifest`, `sw.js`, `offline.html`, íconos, promo a los 24 s solo en celular, que SIEMPRE se pueda cerrar. **El video queda fuera** (Sammuel lo calificó de horrible; se rehace aparte).
 7. Temas de color (`00a-v23-colores.css`, `THEMES`), estilo Simple, barra a la izquierda.
 Lo de rendimiento en celular (modo rápido por defecto, sin vidrio) revísalo contra la regresión visual antes de aceptarlo.
**Puerta 3:** revisor + Sammuel prueban la vista previa.

## 9. FASE 6 — Funciones nuevas (solo si 1–5 están verdes)
Reutiliza, adaptadas, las secciones 5, 6 y 7 de `PLAN-MAESTRO-CLAUDE-PAGO.md`: barra del compositor **Modo · Modelo · Velocidad** (inspirada en Abacus, solo con lo que realmente tenemos), **costo visible y modelo por paso en A.L.I.A.S.**, **leer PDF/CSV con citas** sin base vectorial. Misma disciplina: pieza pequeña, prueba, captura, regresión visual.

## 10. FASE 7 — Cierre y paso a `main` (NO lo ejecutas tú)
 - `t/aceptacion.sh` en verde; `INFORME.md` (entrada v2.4, para humanos) y `PENDIENTES.md` actualizados; `equipo/INFORME-DEL-RELEVO.md` con: qué se hizo por fase, números reales de pruebas, qué NO se hizo y por qué, decisiones propias, riesgos.
 - PR `v2.4 → nueva-version`... **no**: abre el PR `v2.4 → v2.2B-limpia` (nunca a `main`). Si el permiso de GitHub no deja abrirlo, dale a Sammuel el enlace de comparación `…/compare/v2.2B-limpia...v2.4`.
 - Para producción, lo hará el revisor con Sammuel: respaldo nuevo de `main`, comprobar que no cambió el formato de datos de usuarios, merge, revisar Vercel, plan de vuelta atrás.

## 11. Cómo reportarle a Sammuel
Tras cada fase, máx. 5 líneas en español simple: qué quedó, qué probar (1–3 pasos) y qué sigue. Capturas, no código. Si necesitas una decisión, 2 opciones con tu recomendación.

## 12. Anti-errores (lecciones reales de este proyecto)
 - Una IA ya dañó cosas por tocar de más. **Toca solo lo que el bug pide.**
 - Que las pruebas pasen no significa que esté bien: mira capturas y usa estados reales.
 - "Ya estaba bien" se demuestra con una prueba, no con una frase.
 - No marques nada como hecho sin números reales de pruebas.
 - Las claves de texto `t('clave')` deben existir antes de usarse; verifícalo con una prueba.

## 13. Mensaje para pegar al abrir el chat con Opus
"Eres el ejecutor del proyecto SynthZ/SynthFlow de Sammuel (hispanohablante, no programador). Clona https://github.com/Dope-L-star/SynthZ-Style, trae la carpeta `equipo/` de la rama `equipo-alias` (`git checkout origin/equipo-alias -- equipo`) y lee COMPLETO `equipo/PLAN-OPUS-v2.2B.md`. Parte de la rama `v2.2B-limpia` (igual a `main` v2.2B), crea `v2.4`, y sigue las fases en orden: Fase 0 (diagnóstico), Fase 1 (auditoría total de bugs, sin arreglar nada hasta terminar), Fase 2 (arreglos micro-punto), y no avances de las puertas sin luz verde de Sammuel. Nunca toques `main` ni ramas `respaldo-*`. Si te quedas sin presupuesto, deja el repo compilando con pruebas en verde y anota dónde quedaste en `equipo/INFORME-DEL-RELEVO.md`."
