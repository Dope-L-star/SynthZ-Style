/* Arma cloudflare/public/ desde dist/ (lo mismo que publica Vercel) y traduce vercel.json a _headers y _redirects.
   Uso (desde la raíz del repo): node cloudflare/preparar.mjs
   Luego: cd cloudflare && npx wrangler pages deploy public --project-name synthz --branch main */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sale = path.join(raiz, 'cloudflare', 'public');

execFileSync(process.execPath, ['build.mjs', '--dist'], { cwd: raiz, stdio: 'inherit' });
fs.rmSync(sale, { recursive: true, force: true });
fs.cpSync(path.join(raiz, 'dist'), sale, { recursive: true });

const v = JSON.parse(fs.readFileSync(path.join(raiz, 'vercel.json'), 'utf8'));
const ruta = s => s.replace(/\(\.\*\)/g, '*');
/* «/((?!x$).*)» = todo menos /x: en Pages es «/*», y a /x se le quitan esas cabeceras con «! Nombre» antes de poner las suyas */
const quitar = {};
const bloques = (v.headers || []).map(b => {
  const m = /^\/\(\(\?!(.+)\$\)\.\*\)$/.exec(b.source);
  if (m) { quitar['/' + m[1].replace(/\\/g, '')] = b.headers.map(x => x.key); return { source: '/*', headers: b.headers }; }
  return { source: ruta(b.source), headers: b.headers };
});
fs.writeFileSync(path.join(sale, '_headers'), bloques.map(b =>
  b.source + '\n' + [...(quitar[b.source] || []).map(k => '  ! ' + k), ...b.headers.map(x => '  ' + x.key + ': ' + x.value)].join('\n')
).join('\n\n') + '\n');
fs.writeFileSync(path.join(sale, '_redirects'), [
  ...(v.redirects || []).map(r => ruta(r.source) + ' ' + ruta(r.destination) + ' ' + (r.permanent ? 301 : 302)),
  /* /x → /x.html ya lo hace Pages solo; repetirlo crea un bucle con su redirección /x.html → /x */
  ...(v.rewrites || []).filter(r => !r.source.startsWith('/api') && r.destination !== r.source + '.html').map(r => ruta(r.source) + ' ' + ruta(r.destination) + ' 200')
].join('\n') + '\n');
console.log('Listo: cloudflare/public (' + fs.readdirSync(sale).length + ' entradas)');
