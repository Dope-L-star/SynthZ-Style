# Herramientas de prueba (hechas por Opus; viven aquí para que otro Claude las use)
Son mis pruebas de navegador (Playwright + Chromium) y un servidor de simulación (`be/dev.mjs`, puerto 8765) que finge Redis, Google y OpenRouter. NINGUNA usa claves reales.
- Rutas fijas de mi entorno que debes ADAPTAR: `/home/claude/t`, `/home/claude/site`, `/opt/node-tools/node_modules/playwright`. Cambia a las tuyas (busca con grep).
- `sync.sh`: copia el repo a una carpeta "site" y reinicia el servidor. `srv.sh`: reinicia el servidor. `v23/suites.sh`: corre las suites de regresión.
- Fallos viejos conocidos (no son tuyos): b2 (Puter/saldo) y v19/migra.
- Nuevas pruebas de v2.3: `v23/maint.js` (mantenimiento), `link.mjs` (vincular cuentas), `app.js` (instalar app), `simple.js`, `ag2.js`, `perf.js`. Úsalas de modelo para las nuevas.
