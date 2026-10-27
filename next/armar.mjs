/* Arma SymphorIA con Next.js. Uso (desde la raíz del repo):  node next/armar.mjs
   1. node build.mjs --dist  → dist/ (las páginas de siempre, minificadas)
   2. dist/ → next/public/   (menos las páginas que ya están hechas en Next: ver HECHAS)
   3. instala Next si falta (npm ci dentro de next/) y corre «next build»
   Resultado: next/out/ = la página completa, estática, lista para Cloudflare Pages (o cualquier hosting).
   /api no está aquí: lo sirve Vercel o la función de Cloudflare, con las mismas rutas /api/… */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url)), raiz = path.resolve(aqui, '..');
/* páginas que ya pasaron a Next.js (app/<nombre>/page.jsx → out/<nombre>.html). Al pasar otra, se agrega aquí. */
const HECHAS = ['terminos.html', 'privacidad.html'];
const corre = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit' });

corre(process.execPath, ['build.mjs', '--dist'], raiz);
const pub = path.join(aqui, 'public');
fs.rmSync(pub, { recursive: true, force: true });
fs.cpSync(path.join(raiz, 'dist'), pub, { recursive: true });
for (const f of HECHAS) fs.rmSync(path.join(pub, f), { force: true });

if (!fs.existsSync(path.join(aqui, 'node_modules', 'next'))) corre('npm', ['ci', '--no-audit', '--no-fund'], aqui);
fs.rmSync(path.join(aqui, 'out'), { recursive: true, force: true });
corre(process.execPath, [path.join(aqui, 'node_modules', 'next', 'dist', 'bin', 'next'), 'build'], aqui);
for (const f of HECHAS) if (!fs.existsSync(path.join(aqui, 'out', f))) throw new Error('Next no generó ' + f);
console.log('Listo: next/out (' + fs.readdirSync(path.join(aqui, 'out')).length + ' entradas)');
