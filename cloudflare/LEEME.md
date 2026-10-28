# SymphorIA en Cloudflare Pages (gratis, symphoria.pages.dev)

La página completa vive en Cloudflare Pages. `/api/*` lo atiende `functions/api/[[path]].js` (en la raíz del repo), que corre las mismas funciones de `api/` dentro de Cloudflare. Mientras Pages no tenga `KV_REST_API_URL`, sigue reenviando a https://synthz-style.vercel.app como antes.

## Pasar la API a Cloudflare (una sola vez)
1. Pages → symphoria → Settings → Runtime → Compatibility flags: `nodejs_compat` (Production y Preview) y Compatibility date `2025-09-01` o más nueva.
2. Settings → Variables and Secrets (Production), tipo Secret: `KV_REST_API_URL` y `KV_REST_API_TOKEN` (los mismos de Vercel; se ven en la consola de Upstash → la base → REST API). Si algún día pones `SYNTHZ_SECRET`, `SUPABASE_SECRET_KEY`, `GOOGLE_CLIENT_ID`, etc., van aquí también.
3. Deployments → último de producción → Retry deployment.
4. Comprueba: `/api/health` ya no trae la cabecera `x-vercel-id`.

Ojo: la base de Redis se creó desde Vercel (Marketplace de Upstash). No borres esa integración en Vercel o se borra la base.
Ojo 2: el plan gratis de Workers da 10 ms de CPU por petición; crear cuenta y entrar con contraseña (scrypt) gastan ~150 ms. Si fallan con «Error 1102», hace falta Workers Paid (5 USD/mes). Vercel ya solo muestra la página del video (`vercel-portal/`) con el link a la nueva.

## Conectar (una sola vez, en el panel de Cloudflare)
Workers & Pages → Create → Pages → Connect to Git → `Dope-L-star/SynthZ-Style`:
- Project name: `symphoria` (da symphoria.pages.dev)
- Production branch: `main`
- Build command: `npm ci && node cloudflare/preparar.mjs`
- Build output directory: `cloudflare/public`
- Root directory: vacío (raíz del repo)
- Variable de entorno: `NODE_VERSION` = `22`

Desde ahí cada push a `main` se publica solo, y cada rama tiene su vista previa.

La primera build de `main` falla mientras `cloudflare/preparar.mjs` no esté en main; la vista previa de la rama del PR sí construye. Al fusionar, Pages publica la producción sola.

## A mano (opcional, con Wrangler)
```
npm ci
node cloudflare/preparar.mjs
npx wrangler pages deploy cloudflare/public --project-name symphoria --branch vista-previa
```
(desde la raíz, para que Wrangler encuentre `functions/`).

## Clave del puente
Para que los límites por IP sigan siendo por persona, el puente manda la IP real firmada con `CF_PROXY_KEY` (32+ caracteres al azar). La misma clave va en dos sitios, nunca en el repo:
- Cloudflare: Pages → symphoria → Settings → Variables and Secrets → `CF_PROXY_KEY` (tipo Secret).
- Vercel: variable de entorno `CF_PROXY_KEY` (Production) y volver a desplegar.

Sin la clave todo funciona, pero todas las visitas comparten el mismo límite.

## Login con Google
Supabase solo vuelve a direcciones permitidas: añade `https://symphoria.pages.dev/**` en Supabase → Authentication → URL Configuration → Redirect URLs (y cámbiala como Site URL).

## Si el nombre cambia
Si `symphoria` estaba ocupado, cambia `SITIO` en `cloudflare/preparar.mjs`, el destino del último redirect de `vercel.json` y los links de `vercel-portal/index.html` y del README.
