/* Arma los archivos de la página a partir de sus piezas (carpeta src/).
   Uso:  node build.mjs          → vuelve a escribir core.js, chat.js, chat.css…
         node build.mjs --check  → solo revisa que estén al día (falla si alguien editó el archivo armado a mano)
   Las piezas de cada archivo se unen en orden (00, 01, 02…). No cambian nada del código: solo lo ordenan. */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const map = JSON.parse(readFileSync(join(here, 'src/build.json'), 'utf8'));
const check = process.argv.includes('--check');
let bad = 0;
for (const [target, dir] of Object.entries(map)){
  let names = []; try{ names = readdirSync(join(here, dir)); }catch(e){ if (e.code !== 'ENOENT') throw e; }
  const parts = names.filter(f => /^\d\d[a-z]?-/.test(f)).sort();
  const path = join(here, target);
  /* objetivo nuevo sin piezas todavía (p. ej. A.L.I.A.S. antes de recibir su código): no se crea un archivo vacío.
     Si el archivo armado ya existía, sigue la comprobación normal (así --check avisa si se perdieron sus piezas). */
  if (!parts.length && !existsSync(path)){ console.log('  sin piezas  ' + target + '  (' + dir + ' aún sin piezas NN-: no se arma)'); continue; }
  const out = parts.map(f => readFileSync(join(here, dir, f), 'utf8')).join('');
  let cur = ''; try{ cur = readFileSync(path, 'utf8'); }catch(e){}
  if (cur === out){ console.log('  igual   ' + target + '  (' + parts.length + ' piezas)'); continue; }
  if (check){ console.log('  CAMBIÓ  ' + target + '  → corre «node build.mjs»'); bad++; continue; }
  writeFileSync(path, out); console.log('  armado  ' + target + '  (' + parts.length + ' piezas)');
}
if (bad) process.exit(1);
