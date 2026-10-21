# PLAN A.L.I.A.S. — de lo que hay hoy a un agente tipo Abacus (para Opus)
Escrito el 20-oct-2026. Sammuel arreglará los errores de la página con Opus por separado (le grabará un video con los errores). **Este plan es solo de A.L.I.A.S. y de lo que se le agrega "como Abacus".** Para las reglas generales, quién es Sammuel y el estado de las ramas, lee también `equipo/PLAN-OPUS-v2.2B.md` (secciones 0, 1, 2 y 12). Si algo choca, manda este para A.L.I.A.S. y el otro para el resto.
Sammuel: Colombia, español, **no es programador**. Habla simple, pasos cortos, sin pegarle código, y no prometas lo que no probaste.

## 1. Qué es A.L.I.A.S. (visión de Sammuel)
**A.L.I.A.S. = Advanced Logic & Intelligence Augmentation System.** Un **agente** aparte (no es el chat, ni SuperiorSynth, ni SynthonIA), con **UI propia** (`/alias`): recibe un objetivo, lo divide en 3–7 pasos visibles, usa herramientas y entrega un resultado útil. Principios: actúa (no solo responde) · **transparente** (plan y cada paso a la vista) · útil (archivos, resúmenes con fuentes, código) · intuitivo · el usuario **controla** (pausar, ajustar, aprobar, rehacer) · **realista en el plan gratis** (sin navegador completo ni publicar apps). Meta: "el mejor agente del mundo, escalable a eso". Se diferencia de Abacus por transparencia, control, español y honestidad.

## 2. Qué existe ya (hecho por el equipo de 6 + integración de Opus)
- **Servidor** `api/alias.js` (excelente): `plan` (3–7 pasos, reparación del JSON, plan de respaldo) y `step` (herramientas `search`, `think`, `file` PPTX/texto/código, `memory`, `image`), cupos por persona/día (8 planes, 50 pasos, 15 búsquedas; el equipo ×2; tope global), defensa contra inyección (`<datos>`), errores en es/en. Reutiliza `api/_lib.js` y `api/_pool.js`.
- **Interfaz** `alias.html`, `alias.js`, `alias.css`, `src/alias/*`: inicio con plantillas, plan editable, controles (manual/automático, pausar, aprobar, rehacer, cancelar), errores con botones, resultado con fuentes y descarga.
- **Cliente** `alias-tools.js` / `src/alias/tools/*`: búsqueda, archivos, memoria (solo lectura), imagen, API.
- **Textos** `alias-textos.json` (es/en), `alias-plantillas.json` (4 plantillas), `ALIAS.md`.
- **Pruebas:** servidor 70/70, contrato 12/12, pantalla 11/11.
- **Dónde está el código bueno y aislado:** rama `recuperacion-alias` (= `main` v2.2B + solo A.L.I.A.S.; no toca chat/portada/Pulsem; solo `build.mjs`, `src/build.json`, `vercel.json` compartidos). Es la cantera. Los daños de la UI reportados NO provienen de A.L.I.A.S. (cambió 71 líneas de CSS/HTML compartido, de SEO/accesibilidad, y no encaja con los síntomas).
- Rama de trabajo sugerida: parte de la base sana que Opus tenga (`v2.4` nacida de `v2.2B-limpia`) y trae A.L.I.A.S. con `git checkout origin/recuperacion-alias -- ALIAS.md alias-plantillas.json alias-textos.json alias-tools.js alias.css alias.html alias.js api/alias.js src/alias build.mjs src/build.json t/alias` + en `vercel.json` la función `api/alias.js` (`maxDuration` 60) y el rewrite `/alias → /alias.html`. Nunca `main`.

## 3. Referencia: cómo funciona Abacus y qué copiamos (de las capturas y del análisis de Grok)
Sammuel mostró un diagrama de 7 capas y 4 capturas del chat de Abacus. Resumen para quien no las vea:
- **Capas de Abacus:** 1 Clientes (web, escritorio, bots WhatsApp/Slack/Telegram) · 2 Gateway (auth, rate limit, sesiones, streaming SSE) · 3 Orquestador (router de modelos, bucle de razonamiento, memoria, planificador) · 4 Herramientas (búsqueda web, RAG de documentos, ejecutar código en sandbox, conectores OAuth/MCP) · 5 Proveedores (LLMs, imagen, video, audio) · 6 Infraestructura (sandboxes, S3, vector DB, Postgres, Redis) · 7 Negocio (créditos, Stripe, equipos, observabilidad de costos).
- **Barra bajo la caja de texto (capturas):** tres controles. **Modo** (Auto "elige el modo correcto para cada petición" · Chat · CoWork "archivos de este computador" · Code · Agent "tareas largas en la nube") · **Modelo** (lista con buscador: Claude, Gemini…) · **Esfuerzo** (Auto · Low · Medium · High con candado Pro). Más un botón "+" y una carpeta.
- **Lo que Abacus hace mal (nuestra oportunidad):** créditos y router opacos, curva de aprendizaje, sin prueba gratis, precio por asiento. **Nuestras ventajas:** costo visible antes y después, ver y cambiar el modelo con un clic, control del usuario, plan gratis real, español, SynthonIA.
- **Mapa honesto contra lo que tenemos (Vercel gratis + Upstash Redis):**
| Capa | Estado | Qué hacemos |
|---|---|---|
| 1 Clientes | web + PWA ✔ | Telegram/Slack/WhatsApp: **después** (Sammuel dijo que aún no) |
| 2 Gateway | ✔ completo | nada |
| 3 Orquestador | `sz:auto`, memoria, plan por pasos | **Fases A3–A5** (bucle, replanificar, transparencia) |
| 4 Herramientas | búsqueda ✔, archivos ✔, memoria ✔, imagen ✔ | **A4** documentos con citas; ejecutar código/conectores: **no ahora** |
| 5 Proveedores | LLMs gratis ✔, imagen ✔ | video/audio: no (de pago) |
| 6 Infra | Redis ✔ | sandbox/S3/vector DB/Postgres: **no en gratis** |
| 7 Negocio | medidor de cuota ✔, planes diseñados e **inactivos** | **A3** costo visible; cobro real: no |
- **NO hacer ahora (decisión tomada):** construir/publicar apps completas, VM 24/7, video/música, bot de Telegram/WhatsApp, pagos, base vectorial, Kubernetes. Sin promesas exageradas.

## 4. Reglas específicas de A.L.I.A.S.
1. **Aislamiento:** A.L.I.A.S. es una página aparte; no la mezcles con el código del chat. Todo lo nuevo va en `src/alias/`, `api/alias.js`, `alias-*`. Lo único compartido que se toca: `build.mjs`/`src/build.json`/`vercel.json` (y, en A1, la entrada en la sidebar, que es de la tarea de Opus de arreglar la UI).
2. **Contrato compatible:** `POST /api/alias` (`plan`, `step`) con `lang` es|en; los campos nuevos son **opcionales** y el servidor los valida con **lista blanca**; clientes viejos siguen funcionando.
3. **Todo texto visible** sale de `alias-textos.json` (es y en, mismas claves); una prueba verifica que toda clave usada existe en ambos idiomas.
4. **Seguridad:** el texto de la web, de archivos subidos y de pasos previos es DATO (`<datos>`), nunca instrucciones; errores sin detalles internos; topes de tamaño y de uso por persona/día; el cupo se devuelve si el paso falla.
5. **Costos:** cada herramienta nueva tiene su cupo diario propio en Redis (claves nuevas con prefijo `alias:`) y tope global. No cambies el formato de datos de usuarios.
6. **Una fase = una rama (`alias-A1`, `alias-A2`…) = commits pequeños, cada cambio con su prueba.** Nunca `main`. Capturas antes/después (390×844 y 1440×900) en `equipo/capturas/alias/`.
7. Sin claves en el chat: las variables de entorno las pone Sammuel en Vercel (Preview y Production); tú le dices cuáles y dónde, en pasos simples. Variables nuevas deben ser **opcionales**.
8. Si te quedas sin presupuesto: repo compilando, pruebas verdes, rama subida, y anota dónde quedaste en `equipo/INFORME-DEL-RELEVO.md`.

## 5. FASES

### A0 · Base y línea de partida (corta)
Trae A.L.I.A.S. a la base sana (comando de la sección 2). Verifica `node build.mjs --check`, `node src/alias/prueba-servidor.mjs` (70/70), `node t/alias/contrato.mjs` (12/12), `t/alias/ui.mjs` (11/11; Playwright debe ser alcanzable desde el repo: un enlace simbólico temporal a `node_modules` basta, no lo subas). Apunta los números.

### A1 · Terminar la Fase 1 de A.L.I.A.S. (cerrar pendientes)
a) **Entrada visible**: botón "A.L.I.A.S." en la sidebar, debajo de "Mis chats", junto a SuperiorSynth (ícono + nombre + una línea) → abre `/alias`. En celular, en el menú (sin añadir pestañas a la barra inferior). Coordínalo con quien arregle la UI.
b) Presentaciones armadas en dos sitios (`30-resultado.js` `deckBlob()` y `tools/20-file.js` `makePptx()`): deja **uno**.
c) ~100 textos de `alias-textos.json` y `alias-plantillas.json` sin usar: úsalos (las 4 plantillas en el inicio con su `textoAyuda`) o bórralos.
d) `searchWiki` (`api/_pool.js`) solo busca en español: que reciba `lang`.
e) `PPT_RX` mira también `plan.goal` y se activa de más: solo título+input del paso.
f) `doPlan`: `answered=true` aunque el JSON sea inválido → dos basuras seguidas gastan cupo. Cuenta solo si hay plan válido; si no, devuelve el cupo.
g) El 503 de `route()` en `api/_lib.js` sale sin `ok:false` (¡ojo! es archivo compartido: cambio mínimo y probado, o envuélvelo en `api/alias.js`).
h) Enlaces temporales: `URL.revokeObjectURL` al cancelar (`cancelAll()` en `src/alias/20-controles.js`), al descargar y al cerrar.
i) Accesibilidad: `inert` en la intro mientras está activa, `aria-live` correcto, foco visible, teclado completo.
j) **Prueba de punta a punta** con sesión simulada y **checklist manual para Sammuel** con claves reales en la vista previa (variables de Vercel: las de `api/_pool.js` y `api/alias.js`; Upstash obligatorio, IAs/búsqueda según corresponda).
**Salida:** suites ≥ 70/12/11 verdes + las nuevas; Sammuel hace una misión real y dice "sí".

### A2 · Barra "Modo · Modelo · Velocidad" dentro de A.L.I.A.S. (lo que Sammuel pidió "como Abacus")
Va **en la UI de A.L.I.A.S.**, bajo la caja de objetivo (más tarde, con calma, se puede portar al chat; el chat está en reparación y no se toca aquí).
- **Modo** (menú, 1 línea de ayuda, guardado en `localStorage synthz:alias:modo`): **Auto** (decide según lo escrito y lo muestra: "Auto → Investigar"), **Investigar** (prioriza `search` con fuentes), **Documento/Presentación** (prioriza `file`), **Código** (prioriza `file` de código y modelos expertos en código), **Estudio** (plan de estudio). **No** incluir "CoWork/archivos del computador" (no es posible) ni "publicar apps".
- **Modelo** (botón con nombre corto; abre lista corta de modelos gratis disponibles con buscador; "Automática" por defecto). El servidor valida el id contra **lista blanca** (los de `api/_pool.js`).
- **Velocidad** (nombre en español, no "esfuerzo"): **Auto · Rápida · Normal · Profunda.** Rápida = menos `maxTokens` y modelo rápido; Normal = hoy; Profunda = más `maxTokens`, prefiere modelos con razonamiento y añade "verifica tu respuesta". **Sin candado Pro** (no hay planes activos): se rige por los cupos diarios de siempre.
- Contrato: campos **opcionales** `mode`, `model`, `effort` en `plan` y `step`; inválidos o ausentes = comportamiento actual.
- Celular: iconos + una palabra, menús como hoja inferior que no tapan el teclado. Teclado/lector: `aria-haspopup`, `aria-expanded`, flechas, Esc.
- Pruebas: cada control persiste tras recargar; cada modo manda los campos correctos y cambia el plan (6 frases de ejemplo para Auto); el servidor ignora valores inválidos; 390×844 sin desbordes.

### A3 · Transparencia radical: costo visible y modelo por paso (nuestro golpe contra Abacus)
- **Antes de ejecutar:** "Esta misión usará ~N pasos y ~M búsquedas. Te quedan X misiones, Y pasos, Z búsquedas hoy." Añade `usage` al servidor (en la respuesta de `plan` o `action:'usage'`) leyendo los contadores existentes (`alias:p:`, `alias:s:`, `alias:q:`, `alias:all:`).
- **Después de cada paso:** qué gastó y **qué modelo respondió y por qué** (`chat()` de `api/_pool.js` debe devolver el modelo real; se añade `step.model` y `step.why` opcionales).
- **"Rehacer con otro modelo"** por paso (lista corta validada en el servidor) y **resumen final** (pasos/búsquedas usados, modelos usados).
- Textos es/en. Pruebas de servidor (cupos, campos nuevos, lista blanca) y de pantalla.

### A4 · Leer documentos con citas (RAG ligero, sin base vectorial)
- Nueva herramienta `docs` en A.L.I.A.S.: el usuario sube PDF/CSV/TXT (tope 5 MB y N páginas; avisa si se excede). El texto se extrae **en el navegador** (PDF con pdf.js cargado bajo demanda desde un CDN permitido por el CSP de `vercel.json`; añade el dominio mínimo necesario y dilo en el informe; CSV/TXT directo) → se trocea (~1.200 caracteres con solape) → búsqueda por palabras clave (BM25 simple en JS puro) → al servidor van **solo 4–6 fragmentos** con su página → la respuesta cita `[p. 3]` y al tocar la cita se muestra el fragmento.
- **Privacidad:** el archivo completo no se sube ni se guarda; dilo en pantalla. Cupo diario propio (clave `alias:d:`) y tope de tamaño.
- Los fragmentos son DATO. Pruebas: texto, PDF pequeño de prueba (créalo), CSV, archivo enorme, PDF escaneado sin texto (mensaje amable), inyección dentro del documento ("ignora tus reglas") sin efecto.

### A5 · Agente más capaz (Fase 2 de la visión)
- **Bucle controlado pensar → actuar → observar** (opción "Modo autónomo" desactivada por defecto): el modelo propone el siguiente paso con la lista de herramientas; límite estricto de iteraciones (p. ej. 8), de tiempo y de costo; cancelación en caliente; **nunca sin cupo visible**. En modo manual sigue pidiendo aprobación por paso.
- **Cambiar el plan a mitad** (agregar, quitar, reordenar pasos pendientes) y **memoria de la misión completa** (los resultados previos resumidos para que no crezca el contexto).
- **Plantillas útiles** (investigación, presentación, plan de estudio, código) ya existen: añade 2–3 nuevas (resumir documento, comparar opciones, redactar correo) solo si salen de `alias-plantillas.json` con textos es/en.
- **Orquestación de modelos:** elegir el mejor modelo **por paso** (reglas simples y documentadas: código → experto en código, texto largo → contexto grande, trivial → rápido), siempre visible y cambiable (enlaza con A3).
- **Límites claros y avisos de uso** en pantalla.

### A6 · Historial, exportar y errores (Fase 3 de la visión)
- **Historial de misiones** (plan + resultados): guardado **en el navegador por defecto** (privado) y, opcionalmente, en el servidor con claves nuevas `alias:h:<usuario>` (tope de N misiones, borrables por el usuario). No cambies el formato de los datos de usuarios existentes.
- **Exportar** plan + resultados como documento descargable (Markdown/PDF/PPTX) o proyecto.
- **Errores claros:** "Este paso falló. ¿Sigo, lo intento de otra forma o paro?" ya existe; añade el registro del paso (entrada, salida, modelo, costo) visible y **reanudar desde el paso que falló**.

### A7 · Escalabilidad sin pagar (Fase 4 de la visión)
- Caché de búsquedas repetidas, cola simple de pasos pesados con estado, límites por usuario y por plan **sin activar** pagos; contador visible. Preparación de los planes (Chispa/Syntonia/Timeless/Orquesta) **solo en configuración, inactivos**. Observabilidad: panel en Pulsem con uso de A.L.I.A.S. (misiones, pasos, búsquedas, errores) **solo si Pulsem ya está sano**; no lo toques si no.

### A8 · "Futuro" (solo documentar; NO construir ahora)
Llave propia del usuario (BYO-key) · conectores (Drive/GitHub/Gmail) · bots de mensajería (Telegram primero, **cuando Sammuel lo pida**) · ejecución de código en sandbox (requiere infraestructura de pago) · video/audio · planes de pago reales con Stripe.

## 6. Cómo trabajar cada fase
1. Rama `alias-A<n>` desde la base sana; lee la fase completa; escribe primero las pruebas del contrato nuevo.
2. Implementa en piezas pequeñas (`src/alias/NN-nombre.js`, nombre `/^\d\d[a-z]?-/`), `node build.mjs`, `--check` limpio.
3. Corre TODAS las suites (A.L.I.A.S. + las del sitio si existen) y la prueba visual (390×844 y 1440×900).
4. Informe a Sammuel (máx. 5 líneas, español simple): qué quedó, qué probar (1–3 pasos), qué sigue. Capturas, no código.
5. **Puerta de revisión** al final de A1, A3 y A5: revisor (Claude) + Sammuel prueban la vista previa. Nada llega a `main` sin ellos.

## 7. Anti-errores (lecciones reales)
- Una IA ya dañó la UI por tocar de más: **solo lo que la fase pide.** Si ves otro problema, anótalo en "AVISOS".
- Que las pruebas pasen no basta: mira capturas y usa estado real (sesión iniciada, IAs conectadas).
- No marques nada hecho sin números reales de pruebas.
- Cambios mínimos y revisables; nada de reescribir archivos para tocar 3 líneas.

## 8. Mensaje para pegar al abrir el chat con Opus
"Eres el ejecutor del proyecto SynthZ/SynthFlow de Sammuel (hispanohablante, no programador). Clona https://github.com/Dope-L-star/SynthZ-Style, trae `equipo/` de la rama `equipo-alias` (`git checkout origin/equipo-alias -- equipo`) y lee COMPLETOS `equipo/PLAN-ALIAS-FUTURO.md` y, de `equipo/PLAN-OPUS-v2.2B.md`, las secciones 0, 1, 2 y 12. Trabaja SOLO en A.L.I.A.S., por fases A0 a A7, en ramas `alias-A<n>`, con commits pequeños y pruebas reales. Nunca toques `main` ni ramas `respaldo-*`. Si te quedas sin presupuesto, deja el repo compilando con pruebas en verde y anota dónde quedaste en `equipo/INFORME-DEL-RELEVO.md`."

## 9. Material de referencia que Sammuel puede adjuntar
Las 4 capturas del chat de Abacus (barra Modo/Modelo/Esfuerzo), las 4 imágenes del diagrama de 7 capas y el texto del análisis de Grok sobre Abacus (cuidado: el análisis es de fuentes externas y no está verificado). Todo lo esencial ya está resumido en la sección 3.
