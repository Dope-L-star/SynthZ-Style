# SynthZ-Style
SynthZ AI Page made by Sammuel.
Is free IA for all of u.
SO MANY IA'S OMG.

## 👉 La nueva página: **[symphoria.pages.dev](https://symphoria.pages.dev)**

[![Así se ve SymphorIA](.github/readme/synthz.gif)](https://symphoria.pages.dev)

SynthZ ahora es SymphorIA y vive en Cloudflare (gratis). [synthz-style.vercel.app](https://synthz-style.vercel.app) ahora solo muestra este video y el link a la página nueva.

## Qué es
SynthZ (portada) y SynthFlow (el chat): chatea gratis con cientos de IA, compáralas a ciegas y trabaja con tu equipo. Página estática en Cloudflare Pages + funciones de Vercel en `api/` (Cloudflare se las pasa con `functions/api/`) + Redis (Upstash).

## Cómo se trabaja
- Se editan las piezas de `src/` y luego `node build.mjs` arma `core.js`, `chat.js`, `chat.css`… (ver `src/LEEME.md`).
- Cloudflare Pages corre `npm ci && node cloudflare/preparar.mjs` en cada push a `main` (salida `cloudflare/public`): arma `dist/` con `node build.mjs --dist`, minifica y traduce las cabeceras de `vercel.json`. Ver `cloudflare/LEEME.md`.
- Vercel corre `node vercel-portal/armar.mjs`: solo la página del video con el link, y las funciones de `api/`.
- Pruebas (necesitan `playwright`): `node t/humo/humo.mjs`, `node t/portada/calidad.mjs`, `node t/alias/contrato.mjs`. GitHub las corre solas en cada Pull Request.
- Nada se pasa a `main` sin revisar antes la vista previa de Vercel de la rama.

## Variables de Vercel (sin valores aquí: el repo es público)
`KV_REST_API_URL`, `KV_REST_API_TOKEN` (obligatorias), `SYNTHZ_SECRET`, `SYNTHZ_SETUP_CODE`, `SYNTHZ_RESERVED`, `GOOGLE_CLIENT_ID`. Detalle en `GUIA.md`.
