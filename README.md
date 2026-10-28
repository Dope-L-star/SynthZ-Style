# SymphorIA

SymphorIA es una página para hablar gratis con varias inteligencias artificiales desde un solo lugar, compararlas y guardar tus chats. Hecha en Colombia por Sammuel.

- **SynthFlow** (`chat.html`): el chat. Tiene Proyectos y Sintéticos (lo que la IA crea se abre al lado, como en Claude), permite comparar IAs y tiene modo agente.
- **SynthonIA**: la ayudante flotante. Conoce toda la página, señala dónde está cada cosa y te pasa con una persona del equipo.
- **A.L.I.A.S.** (`alias.html`): un agente que cumple un objetivo paso a paso. Con Síntesis, 4 IAs hacen el último paso y se combinan en una sola respuesta.
- **Pulsem** (`pulsem.html`): el panel del equipo (Prime, ZFlow y Symmetrix).
- **EnerX**: la batería diaria para usar las IAs conectadas. Se carga a medianoche. El equipo no tiene límite.
- Toda la página funciona en español y en inglés.

## Cómo está hecha

No usa framework: es JavaScript y CSS sin dependencias en el navegador. Las funciones del servidor viven en `api/`.

| Carpeta o archivo | Qué es |
| --- | --- |
| `src/core`, `src/chat`, `src/index`, `src/alias`, `src/pulsem` (y sus `-css`) | Las piezas. **Se edita aquí**, nunca en los archivos armados. |
| `core.js`, `chat.js`, `index.js`, `*.css` | Los archivos armados. Se generan con `node build.mjs` y se suben al repo. |
| `*.html` | Las páginas. Se editan directamente. |
| `idioma-en.json` | El diccionario de español a inglés que traduce la página cuando el idioma es inglés. |
| `api/` | Funciones del servidor: cuentas, IA, ayuda, A.L.I.A.S. y equipo. Guardan los datos en Upstash Redis. |
| `t/` | Pruebas automáticas con Playwright. |
| `media/` | Imágenes, íconos y el video de la app. |

Las piezas de cada archivo se juntan en orden alfabético (`src/build.json` dice cuál va a cuál). Para agregar algo nuevo, crea una pieza con el número que le toque, por ejemplo `src/chat/14d-mi-cosa.js`.

## Correrla en tu computador

```bash
npm ci
node build.mjs            # arma core.js, chat.js, etc. desde src/
node build.mjs --check    # revisa que lo armado esté al día (lo corre GitHub)
node build.mjs --dist     # arma dist/: lo que se publica, minificado
```

Para ver la página basta con un servidor de archivos estáticos en la carpeta, por ejemplo `npx serve .`. Sin las funciones de `api/`, el chat funciona con Puter.

## Pruebas

```bash
npm install --no-save playwright@1.48.2 && npx playwright install chromium
node t/humo/humo.mjs          # que todo cargue y responda (también: node t/humo/humo.mjs dist)
node t/humo/sesion.mjs        # cuentas y cookie de sesión
node t/portada/calidad.mjs    # portada: nada se sale, nada salta, botones de 24 px, cero errores
node t/alias/contrato.mjs     # A.L.I.A.S.
```

GitHub corre todas estas pruebas en cada PR (`.github/workflows`).

## Publicar

- Vercel publica `main` solo: corre `node build.mjs --dist` y sirve `dist/` con las funciones de `api/`. Cada rama tiene su vista previa.
- Las variables del servidor se ponen en Vercel, nunca en el código. Las importantes son `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `SYNTHZ_SECRET`, `SYNTHZ_SETUP_CODE` (de 20 caracteres o más), `GOOGLE_CLIENT_ID` y las de Supabase. Los límites (`SYNTHZ_GUEST_MSGS`, `SYNTHZ_IMG_GLOBAL`, `SYNTHZ_ALIAS_*`…) son opcionales.
- Las llaves de las IAs no van en variables: el equipo las agrega desde Pulsem y se reparten entre todos.
- La seguridad de las páginas (CSP y demás cabeceras) está en `vercel.json`. Los Sintéticos se abren en `sintetico.html`, aislados, para que la CSP no dañe sus vistas previas.

## Reglas del repo

- `main` solo se toca cuando Sammuel lo pide.
- Nada de llaves ni contraseñas en el código.
- Antes de subir algo: `node build.mjs --check` y las pruebas.
