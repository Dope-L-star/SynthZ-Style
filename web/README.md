# SynthZ · rediseño (carpeta `web/`)

Interfaz nueva (Atlas de día, Consola de noche, color de perfil, Energía en %). **No trae backend propio**: habla con el de siempre (`/api/*` del mismo dominio), así que usa las mismas cuentas, llaves y límites. La sesión y el dispositivo se guardan con las mismas claves de `localStorage` que la página de siempre (`synthz:sess`, `synthz:dev`).

Next.js + TypeScript, exportado como páginas estáticas bajo `/nuevo`. La carpeta `nuevo/` de la raíz es el resultado ya armado y es lo que publica Vercel.

```
cd web
npm install
npm run dev        # desarrollo (necesita que /api responda; ver abajo)
npm test           # pruebas
npm run lint       # tipos
npm run publicar   # arma y copia el resultado a ../nuevo
```

## Qué usa del backend
- `GET /api/ai`: límite, gasto de hoy y preguntas de invitado → anillo de Energía.
- `POST /api/ai`: respuesta en vivo (el backend elige la IA y el respaldo).
- `POST /api/auth` (`login`, `signup`, `reset`), `GET /api/me`, `DELETE /api/auth`.

## Hecho en esta entrega
- Chats guardados: en el navegador y, con cuenta, en la nube (`/api/chats`, mismas claves `openrouter::sz:auto::<id>` que la página de siempre).
- Comparar: dos IA lado a lado (requiere cuenta).
- Síntesis: tres IA de proveedores distintos responden en paralelo, una las une y da el «acuerdo» (0–100). Requiere cuenta.

## Pendiente
Herramientas (internet, imágenes), equipos, ayuda y Pulsem.
