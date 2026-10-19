# Piezas de SynthZ

Cada archivo grande de la página está partido en piezas pequeñas aquí.
**Se editan las piezas, nunca el archivo armado.** Luego: `node build.mjs`.

| Archivo armado | Piezas |
|---|---|
| core.js (lo compartido: datos, IA, cursor, portal, SynthonIA…) | src/core/ |
| core.css | src/core-css/ |
| chat.js / chat.css (SynthFlow) | src/chat/ · src/chat-css/ |
| index.js / index.css (portada SynthZ) | src/index/ · src/index-css/ |
| pulsem.js / pulsem.css (panel del equipo) | src/pulsem/ · src/pulsem-css/ |

Las piezas de core.js comparten todo entre sí (son un solo bloque de código partido en orden),
por eso una pieza sola no funciona: siempre se unen con `node build.mjs`.
`node build.mjs --check` avisa si alguien cambió un archivo armado a mano.
