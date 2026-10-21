/* Pruebas del servidor que no necesitan Redis ni internet.  Uso:  npm test */
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.SYNTHZ_SECRET = 'x'.repeat(40);
process.env.SYNTHZ_SETUP_CODE = 'CODIGO-DE-PRUEBA-123';
process.env.KV_REST_API_URL = 'http://redis.falso.test';
process.env.KV_REST_API_TOKEN = 'token-falso';
/* Redis falso: siempre responde «sin datos», para no salir a internet */
const fetchReal = globalThis.fetch;
globalThis.fetch = async (u, o) => String(u).startsWith('http://redis.falso.test') ? new Response(JSON.stringify({ result: null })) : fetchReal(u, o);
const L = await import('../api/_lib.js');
/* la clave de cifrado se carga al atender cualquier ruta */
await L.route({ GET: () => L.json({ ok: true }) }).fetch(new Request('http://x.test/api/x'));

test('cifrado: ida y vuelta, y cada vez sale distinto', () => {
  const a = L.enc('llave-secreta'), b = L.enc('llave-secreta');
  assert.notEqual(a, b);
  assert.equal(L.dec(a), 'llave-secreta');
  assert.equal(L.needsReenc(a), false);
});

test('cifrado: un texto alterado no se abre', () => {
  const a = L.enc('hola');
  const roto = a.slice(0, -4) + (a.endsWith('AAAA') ? 'BBBB' : 'AAAA');
  assert.throws(() => L.dec(roto));
});

test('contraseñas: la correcta pasa, la incorrecta no, y no se guarda en claro', async () => {
  const h = await L.hashPass('mi-clave-larga-1');
  assert.ok(h.startsWith('s2$'));
  assert.ok(!h.includes('mi-clave-larga-1'));
  assert.equal(await L.checkPass('mi-clave-larga-1', h), true);
  assert.equal(await L.checkPass('otra-clave', h), false);
  assert.equal(L.passNeedsUpgrade(h), false);
});

test('usuarios y correos: reglas de formato', () => {
  assert.equal(L.okUser('ana_lucia'), true);
  for (const x of ['ab', '.ana', 'ana.', 'a..b', 'Ana Lucia', 'a'.repeat(21), '<script>']) assert.equal(L.okUser(x), false, x);
  assert.equal(L.cleanUser('@Ana'), 'ana');
  assert.equal(L.okEmail('a@b.co'), true);
  assert.equal(L.okEmail('a@b'), false);
  assert.equal(L.okEmail('a b@c.com'), false);
});

test('str: quita caracteres de control y recorta', () => {
  assert.equal(L.str('  hola\u0000\u0007 mundo  ', 8), 'hola   m');
  assert.equal(L.str(null, 5), '');
});

test('código de activación: solo sirve el correcto', () => {
  assert.equal(L.setupOk('CODIGO-DE-PRUEBA-123'), true);
  assert.equal(L.setupOk('codigo-de-prueba-123'), true);   // no distingue mayúsculas
  assert.equal(L.setupOk('CODIGO-DE-PRUEBA-124'), false);
  assert.equal(L.setupOk('corto'), false);
  assert.equal(L.setupOk(undefined), false);
  assert.equal(L.setupOk({ toString: () => 'CODIGO-DE-PRUEBA-123' }), false);
});

test('rangos: un correo sin verificar nunca recibe rango', () => {
  assert.equal(L.roleForEmail('sammuel.loaiza10@gmail.com', false), '');
  assert.equal(L.roleForEmail('sammuel.loaiza10@gmail.com', true), 'owner');
  assert.equal(L.roleForEmail('cualquiera@gmail.com', true), '');
  assert.equal(L.topRole('staff', 'admin'), 'admin');
  assert.equal(L.topRole('owner', 'staff'), 'owner');
});

test('comparación de huellas: iguales sí, distintas no', () => {
  assert.equal(L.sameHash(L.sha('a'), L.sha('a')), true);
  assert.equal(L.sameHash(L.sha('a'), L.sha('b')), false);
  assert.equal(L.sameHash('corto', 'largo-distinto'), false);
});

test('código de recuperación: formato y huella estable', () => {
  const c = L.recoveryCode();
  assert.match(c.replace(/[^A-Z0-9]/g, ''), /^[A-HJ-NP-Z2-9]{16}$/);
  assert.equal(L.codeHash(c), L.codeHash(c.toLowerCase()));
});

test('registro de consumo: se limpia lo raro y al juntar nunca baja', () => {
  const sucio = L.cleanLedgerRow({ openrouter: { p: -5, c: 'abc', r: 3, e: 1e99, days: { '2026-10-20': 7, 'mal': 9 } }, '<x>': { p: 1 } });
  assert.deepEqual(Object.keys(sucio), ['openrouter']);
  assert.equal(sucio.openrouter.p, 0);
  assert.equal(sucio.openrouter.c, 0);
  assert.deepEqual(sucio.openrouter.days, { '2026-10-20': 7 });
  const a = L.cleanLedgerRow({ pu: { p: 10, c: 1, days: { '2026-10-20': 5 } } });
  const b = L.cleanLedgerRow({ pu: { p: 4, c: 9, days: { '2026-10-20': 2, '2026-10-21': 6 } } });
  const m = L.mergeLedgerRow(a, b).pu;
  assert.equal(m.p, 10); assert.equal(m.c, 9);
  assert.deepEqual(m.days, { '2026-10-20': 5, '2026-10-21': 6 });
});

test('rutas: método no permitido y errores sin datos internos', async () => {
  const r = L.route({ GET: () => { throw new Error('secreto interno'); } });
  const a = await r.fetch(new Request('http://x.test/api/x', { method: 'DELETE' }));
  assert.equal(a.status, 405);
  const b = await r.fetch(new Request('http://x.test/api/x'));
  assert.equal(b.status, 500);
  assert.ok(!(await b.text()).includes('secreto interno'));
});

test('día de hoy: formato AAAA-MM-DD', () => {
  assert.match(L.today(), /^\d{4}-\d{2}-\d{2}$/);
});
