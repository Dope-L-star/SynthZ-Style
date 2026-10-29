import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const nextDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(nextDir, '..');
const routes = [
  { html: 'index.html', route: 'app/(site)/page.jsx', module: 'contenido/legado/index.js', tree: 'contenido/arboles-react/index.json' },
  { html: 'chat.html', route: 'app/(site)/chat/page.jsx', module: 'contenido/legado/chat.js', tree: 'contenido/arboles-react/chat.json' },
  { html: 'alias.html', route: 'app/(site)/alias/page.jsx', module: 'contenido/legado/alias.js', tree: 'contenido/arboles-react/alias.json' },
  { html: 'ayuda.html', route: 'app/(site)/ayuda/page.jsx', module: 'contenido/legado/ayuda.js', tree: 'contenido/arboles-react/ayuda.json' },
  { html: 'offline.html', route: 'app/(site)/offline/page.jsx', module: 'contenido/legado/offline.js', tree: 'contenido/arboles-react/offline.json' },
  { html: 'pulsem.html', route: 'app/(panel)/pulsem/page.jsx', module: 'contenido/legado/pulsem.js', tree: 'contenido/arboles-react/pulsem.json' },
];
function extractJsonModule(file, name) {
  const text = fs.readFileSync(file, 'utf8');
  const marker = `export const ${name} = `;
  const start = text.indexOf(marker);
  assert.notEqual(start, -1, `${file}: falta export ${name}`);
  const at = start + marker.length;
  let i = at;
  assert.equal(text[i], '"', `${file}: ${name} no es una cadena JSON`);
  i++;
  while (i < text.length) {
    if (text[i] === '\\') { i += 2; continue; }
    if (text[i] === '"') { i++; break; }
    i++;
  }
  return JSON.parse(text.slice(at, i));
}
function extractOriginalBody(html) {
  const text = fs.readFileSync(path.join(root, html), 'utf8');
  const match = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  assert.ok(match, `${html}: no se encuentra body`);
  return match[1].replace(/\r\n/g, '\n').trim();
}
function elements(nodes, out = []) {
  for (const n of nodes || []) {
    if (n.type !== 'element') continue;
    out.push(n);
    elements(n.children, out);
  }
  return out;
}
for (const r of routes) {
  const routePath = path.join(nextDir, r.route);
  const modulePath = path.join(nextDir, r.module);
  const treePath = path.join(nextDir, r.tree);
  assert.ok(fs.existsSync(routePath), `falta ruta React ${r.route}`);
  assert.ok(fs.existsSync(modulePath), `falta contenido original ${r.module}`);
  assert.ok(fs.existsSync(treePath), `falta árbol de elementos React ${r.tree}`);
  const route = fs.readFileSync(routePath, 'utf8');
  assert.ok(route.includes('LegacyPage') && route.includes('reactTree'), `${r.route}: no consume el árbol React`);
  const actual = extractJsonModule(modulePath, 'body');
  const original = extractOriginalBody(r.html);
  assert.equal(actual, original, `${r.html}: la fuente del contenido debe mantenerse sincronizada`);
  const tree = JSON.parse(fs.readFileSync(treePath, 'utf8'));
  const hash = createHash('sha256').update(original, 'utf8').digest('hex');
  assert.equal(tree.sourceHash, hash, `${r.html}: regenerar el árbol React tras modificar el marcado`);
  assert.equal(tree.sourceCharacters, original.length, `${r.html}: longitud fuente no coincide`);
  const all = elements(tree.nodes);
  const ids = all.map(n => n.attrs?.id).filter(Boolean);
  assert.equal(ids.length, new Set(ids).size, `${r.html}: IDs repetidos en el árbol React`);
  const sourceIds = [...original.matchAll(/\bid=["']([^"']+)["']/gi)].map(m => m[1]);
  assert.deepEqual([...ids].sort(), [...sourceIds].sort(), `${r.html}: IDs cambiaron al convertir el DOM a React`);
  const masks = {
    'chat.html': ['msgs', 'thList', 'sideFoot', 'accBtn'],
    'index.html': ['launch', 'usagePanel', 'accBtn'],
    'alias.html': ['vPlan', 'vResult'],
  }[r.html] || [];
  for (const id of masks) {
    const masked = all.find(n => n.attrs?.id === id);
    assert.ok(masked, `${r.html}: falta el contenedor sensible #${id}`);
    assert.equal(String(masked.attrs?.['data-clarity-mask']).toLowerCase(), 'true', `${r.html}: #${id} debe enmascararse para analítica`);
  }
  assert.ok(all.every(n => n.tag !== 'script'), `${r.html}: los scripts deben cargarse solo con LegacyRuntime`);
  assert.ok(!/\son[a-z]+\s*=/i.test(JSON.stringify(tree.nodes)), `${r.html}: no deben quedar atributos de evento inline ejecutables`);
  /* <html data-brand> no viaja en el árbol (solo el body): el layout del sitio lo pone por ruta. Sin él, core.js no sabe que es SynthFlow. */
  if (r.route.startsWith('app/(site)/')) {
    const brand = (fs.readFileSync(path.join(root, r.html), 'utf8').match(/<html[^>]*\sdata-brand=["']([^"']+)["']/i) || [])[1] || null;
    const lay = fs.readFileSync(path.join(nextDir, 'app/(site)/layout.jsx'), 'utf8').match(/export const BRAND = (\{[^}]*\})/);
    assert.ok(lay, 'app/(site)/layout.jsx: falta BRAND');
    const map = JSON.parse(lay[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));
    assert.equal(map[r.html.replace(/\.html$/, '')] || null, brand, `${r.html}: data-brand="${brand}" del <html> no coincide con BRAND del layout`);
  }
  console.log(`OK React ${r.html}: ${all.length} elementos, ${ids.length} IDs conservados, árbol actualizado`);
}
const armar = fs.readFileSync(path.join(nextDir, 'armar.mjs'), 'utf8');
for (const {html} of routes) assert.ok(armar.includes(`'${html}'`), `armar.mjs debe retirar ${html} de public/`);
for (const file of ['componentes/LegacyPage.jsx','componentes/LegacyRuntime.jsx','componentes/ReactTree.jsx','app/(site)/layout.jsx']) {
  assert.ok(fs.existsSync(path.join(nextDir, file)), `falta ${file}`);
}
assert.ok(fs.existsSync(path.join(root, 'sintetico.html')));
assert.ok(fs.existsSync(path.join(root, 'functions/sintetico.js')));
const clarityPath = path.join(nextDir, 'componentes/ClarityConsent.jsx');
const clarityCode = fs.readFileSync(clarityPath, 'utf8');
assert.ok(clarityCode.includes('NEXT_PUBLIC_CLARITY_ENABLED') && clarityCode.includes('NEXT_PUBLIC_CLARITY_AUDIENCE_18_PLUS'), 'Clarity debe requerir dos flags explícitos');
assert.ok(clarityCode.includes('consentv2') && clarityCode.includes('https://www.clarity.ms/tag/'), 'Clarity debe usar su loader y Consent V2');
assert.ok(clarityCode.includes("'z5es3kuqoz'"), 'Clarity project id no coincide con la referencia');
const panelLayout = fs.readFileSync(path.join(nextDir, 'app/(panel)/layout.jsx'), 'utf8');
assert.ok(!panelLayout.includes('ClarityConsent'), 'Pulsem es un panel privado y no debe instrumentarse');
const publicLayout = fs.readFileSync(path.join(nextDir, 'app/(site)/layout.jsx'), 'utf8');
const legalLayout = fs.readFileSync(path.join(nextDir, 'app/(legal)/layout.jsx'), 'utf8');
assert.ok(publicLayout.includes('ClarityConsent') && legalLayout.includes('ClarityConsent'), 'Clarity opcional debe montarse solo en la web pública/legal');
const csp = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const cspValue = (csp.headers || []).flatMap(h => h.headers || []).find(h => h.key.toLowerCase() === 'content-security-policy')?.value || '';
assert.ok(cspValue.includes('https://www.clarity.ms') && cspValue.includes('https://*.clarity.ms'), 'CSP debe permitir Clarity únicamente si se habilita en el build');
const clarityEnv = fs.readFileSync(path.join(nextDir, '.env.example'), 'utf8');
assert.ok(clarityEnv.includes('NEXT_PUBLIC_CLARITY_ENABLED=false') && clarityEnv.includes('NEXT_PUBLIC_CLARITY_AUDIENCE_18_PLUS=false'), 'Clarity debe llegar desactivado por defecto');
console.log('OK Clarity opt-in, Consent V2, enmascaramiento de contenido y exclusión del panel privado');
console.log('OK configuración estática de Next, handlers seguros y aislamiento de Sintéticos');
