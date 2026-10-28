# SymphorIA en Next.js

El paso a Next.js va **por partes**, sin romper nada de lo que ya funciona (api/ en Vercel, sesión por cookie, CSP, Sintéticos, ES/EN, modo compacto, temas, EnerX).

- `node next/armar.mjs` (desde la raíz) arma todo: `build.mjs --dist` → copia `dist/` a `next/public/` → `next build` con `output: 'export'` → **`next/out/`**, la página completa y estática.
- Cloudflare Pages publica `next/out` (lo hace `cloudflare/preparar.mjs`). `/api/…` no pasa por Next: lo sirve la función de Cloudflare / Vercel, con las mismas rutas.
- Las páginas que todavía no pasaron a React se sirven tal cual desde `public/` (mismos nombres `.html`).

## Ya en React (app/)
| Página | Archivo |
|---|---|
| Términos (`/terminos.html`) | `app/terminos/page.jsx` + `contenido/terminos.jsx` |
| Privacidad (`/privacidad.html`) | `app/privacidad/page.jsx` + `contenido/privacidad.jsx` |

Al pasar otra página: crear `app/<nombre>/page.jsx` (sale como `out/<nombre>.html`), agregar el nombre a `HECHAS` en `armar.mjs` y borrar el `.html` viejo de la raíz cuando ya no se use.

Orden propuesto: Pulsem → A.L.I.A.S. → portada → SynthFlow (el más grande; va al final, por piezas).

## Animaciones
Todas las páginas (las de siempre y las de Next) cargan la misma capa: `movimiento.css` / `movimiento.js` (piezas en `src/movimiento*`).
