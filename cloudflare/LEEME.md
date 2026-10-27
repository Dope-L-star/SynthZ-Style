# SynthZ en Cloudflare Pages (gratis, synthz.pages.dev)

Las páginas se sirven desde Cloudflare; `/api/*` lo reenvía `functions/api/[[path]].js` a https://synthz-style.vercel.app, así que las funciones de `api/` siguen en Vercel sin cambios.

## Publicar
```
npm install   # una vez, trae esbuild para minificar
node cloudflare/preparar.mjs
cd cloudflare
npx wrangler pages deploy public --project-name synthz --branch main
```
La primera vez Wrangler pide iniciar sesión (`npx wrangler login`) y crea el proyecto `synthz`.

## Clave del puente (una sola vez)
Para que los límites por IP sigan siendo por persona, el puente manda la IP real firmada con `CF_PROXY_KEY` (32+ caracteres al azar). La misma clave va en dos sitios, nunca en el repo:
- Cloudflare: `npx wrangler pages secret put CF_PROXY_KEY --project-name synthz`
- Vercel: variable de entorno `CF_PROXY_KEY` (Production) y volver a desplegar.

Sin la clave todo funciona, pero todas las visitas de pages.dev comparten el mismo límite.

## Login con Google
Supabase solo vuelve a direcciones permitidas: añade `https://synthz.pages.dev/**` en Supabase → Authentication → URL Configuration → Redirect URLs.
