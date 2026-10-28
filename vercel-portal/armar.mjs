/* Vercel publica solo esto: la página del video con el link a Cloudflare. Las funciones de api/ siguen en Vercel aparte.
   Lo corre Vercel (vercel.json buildCommand). La página completa la arma cloudflare/preparar.mjs. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url)), raiz = path.resolve(aqui, '..'), sale = path.join(raiz, 'dist');
fs.rmSync(sale, { recursive: true, force: true });
fs.mkdirSync(sale);
for (const f of ['index.html', 'portal.css', 'portal.js', 'sw.js', 'robots.txt', 'v']) fs.cpSync(path.join(aqui, f), path.join(sale, f), { recursive: true });
for (const f of ['icon.svg']) if (fs.existsSync(path.join(raiz, f))) fs.cpSync(path.join(raiz, f), path.join(sale, f), { recursive: true });
fs.cpSync(path.join(raiz, 'media', 'og-synthz.jpg'), path.join(sale, 'og-synthz.jpg'));
/* el video de Sammuel (media/app) va primero; si aún no está en la rama, queda la grabación de la página en v/ */
const suyo = path.join(raiz, 'media', 'app', 'synthflow-app.mp4');
if (fs.existsSync(suyo)) {
  fs.cpSync(suyo, path.join(sale, 'v', 'synthz.mp4'));
  const poster = path.join(raiz, 'media', 'app', 'synthflow-app.webp');
  if (fs.existsSync(poster)) { fs.cpSync(poster, path.join(sale, 'v', 'synthz.webp')); fs.rmSync(path.join(sale, 'v', 'synthz.jpg')); }
  const html = path.join(sale, 'index.html');
  fs.writeFileSync(html, fs.readFileSync(html, 'utf8').replace('/v/synthz.jpg', fs.existsSync(poster) ? '/v/synthz.webp' : '/v/synthz.jpg'));
}
console.log('dist/ listo: página del video para Vercel');
