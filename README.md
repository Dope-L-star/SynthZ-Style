# SynthZ-Style
SynthZ AI Page made by Sammuel.
Is free IA for all of u.
SO MANY IA'S OMG.

## Qué es
SynthZ (portada) y SynthFlow (el chat): chatea gratis con cientos de IA, compáralas a ciegas y trabaja con tu equipo. Página estática + funciones de Vercel en `api/` + Redis (Upstash).

## Cómo se trabaja
- Se editan las piezas de `src/` y luego `node build.mjs` arma `core.js`, `chat.js`, `chat.css`… (ver `src/LEEME.md`).
- Vercel corre `node build.mjs --dist`: copia solo lo público a `dist/` y minifica el JS y el CSS. El repo queda legible.
- Pruebas (necesitan `playwright`): `node t/humo/humo.mjs`, `node t/portada/calidad.mjs`, `node t/alias/contrato.mjs`. GitHub las corre solas en cada Pull Request.
- Nada se pasa a `main` sin revisar antes la vista previa de Vercel de la rama.

## Variables de Vercel (sin valores aquí: el repo es público)
`KV_REST_API_URL`, `KV_REST_API_TOKEN` (obligatorias), `SYNTHZ_SECRET`, `SYNTHZ_SETUP_CODE`, `SYNTHZ_RESERVED_EMAILS`, `SYNTHZ_RESERVED`, `GOOGLE_CLIENT_ID`. Detalle en `GUIA.md`.
