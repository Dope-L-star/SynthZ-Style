# SymphorIA / SynthFlow · React + Cloudflare Pages

Este proyecto conserva la app y sus funciones y suma una migración de las rutas públicas a Next.js/React con salida estática para Cloudflare Pages. Lee `next/LEEME.md` y `MIGRACION-REACT-CLOUDFLARE.md` antes de desplegar.

## Rutas React

- `/` y `/index.html`: portada.
- `/chat.html`: SynthFlow.
- `/alias.html`: A.L.I.A.S.
- `/ayuda.html`: Ayuda.
- `/offline.html`: página sin conexión.
- `/pulsem.html`: panel privado Pulsem.
- `/privacidad.html` y `/terminos.html`: páginas legales hechas con componentes React propios.

La estructura visual de las páginas principales se crea desde elementos React (no desde una cadena HTML inyectada). Los árboles de componentes se encuentran en `next/contenido/arboles-react/`; las piezas fuente permanecen en `src/`. Los motores de interacción JS se conservan temporalmente como una capa de compatibilidad para no romper login, historial, streaming, IA, adjuntos y herramientas mientras la lógica se migra a hooks por subsistema. Esta capa de lógica aún no está reescrita íntegramente en React.

`/sintetico.html` se mantiene aislado con sus propias cabeceras CSP y su protocolo de `postMessage`; no debe fusionarse con el runtime de la app. Las rutas `/api/*` siguen en el backend existente.

## Comprobaciones rápidas

```bash
npm ci
npm run check
```

Si cambias una página HTML fuente, regenera los árboles React antes de ejecutar los checks:

```bash
python next/generar-arboles-react.py  # requiere beautifulsoup4, solo desarrollo
npm run check
```

## Build para Cloudflare Pages

```bash
npm ci
node cloudflare/preparar.mjs
```

Configuración de Pages: root directory vacío, Build command `npm ci && node cloudflare/preparar.mjs`, Build output directory `cloudflare/public`, variable `NODE_VERSION=22`. Las Pages Functions continúan en `functions/` en la raíz del repositorio.

El build integrado y las pruebas con navegador tienen que ejecutarse en un entorno con acceso a npm y a los servicios reales antes de publicar; en el entorno de creación de este ZIP, npm devolvió `EAI_AGAIN` al resolver `registry.npmjs.org`, por lo que no se afirma que `next build` haya pasado.


## Migración React y Cloudflare Pages

La versión en `next/` usa Next.js App Router con export estático para Cloudflare Pages. Antes de desplegar, ejecutar `node build.mjs --check`, `node next/verificar-migracion.mjs` y `node cloudflare/preparar.mjs` con acceso a npm. Configuración de Pages: build `npm ci && node cloudflare/preparar.mjs`, directorio `cloudflare/public`, Node.js 22. La lógica interactiva del chat y autenticación continúa en módulos JavaScript heredados bajo el adaptador React; revisar `MIGRACION-REACT-CLOUDFLARE.md`.
