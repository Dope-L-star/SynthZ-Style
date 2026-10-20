/* IA de SynthZ compartida (beta 2): llaves por cuenta del equipo, solo gratis, tope diario, respaldo, pulso */
const B = 'http://localhost:8765/api/', S = 'http://localhost:8799/';
const seen = [];
const call = async (path, o = {}) => { const r = await fetch(B + path, { method:o.method || (o.body ? 'POST' : 'GET'), headers:Object.assign({ 'content-type':'application/json', 'x-forwarded-for':o.ip || '9.0.0.1' }, o.tok ? { authorization:'Bearer ' + o.tok } : {}, o.dev ? { 'x-sz-device':o.dev } : {}), body:o.body ? JSON.stringify(o.body) : undefined }); const txt = await r.text(); seen.push(txt); let d; try{ d = JSON.parse(txt); }catch(e){ d = { raw:txt }; } return { s:r.status, d, h:r.headers }; };
const ok = (name, cond, extra) => console.log((cond ? 'OK   ' : 'FALLA') + ' ' + name + (extra ? '  ' + JSON.stringify(extra).slice(0, 220) : ''));
const sign = (user, pass, setup) => call('auth', { body:Object.assign({ mode:'signup', user, pass }, setup ? { setup } : {}), ip:'8.8.' + Math.floor(Math.random() * 250) + '.1' });
const fail = (p, s) => fetch(S + 'mockfail?p=' + p + '&s=' + s);
const say = (text, model, o = {}) => call('ai', Object.assign({ body:{ messages:[{ role:'user', content:text }], model } }, o));
(async () => {
  const owner = (await sign('sammuersynth', 'luz-de-prime-1', 'codigo-de-dueno-123')).d.token;
  const staff = (await sign('sammuerbusiness', 'luz-de-staff-1', 'codigo-de-dueno-123')).d.token;
  const user = (await sign('synther' + Date.now().toString(36).slice(-4), 'luz-normal-123')).d.token;
  let r = await call('ai'); ok('sin llaves: no hay modelos', r.s === 200 && r.d.models.length === 0, r.d);
  r = await say('hola', 'sz:auto', { dev:'dispositivo-prueba-0001' }); ok('sin llaves: aviso claro', r.s === 503 && r.d.code === 'sz_off', r.d);
  ok('un Synther no puede agregar llaves', (await call('trial', { body:{ action:'keys', groq:'gsk_prueba' }, tok:user })).s === 403);
  r = await call('trial', { body:{ action:'keys', groq:'gsk_prueba', mistral:'mstr_prueba', openrouter:'sk-or-v1-pool' }, tok:owner });
  ok('Prime agrega sus llaves y se prueban', r.s === 200 && r.d.keys.length === 3 && r.d.keys.every(k => k.ok), r.d.keys);
  r = await call('trial', { body:{ action:'keys', cloudflare:'cfat_prueba' }, tok:staff });
  ok('Symmetrix agrega SU llave (solo ve las suyas al probar)', r.s === 200 && r.d.keys.length === 1 && r.d.keys[0].prov === 'cloudflare' && r.d.keys[0].ok, r.d.keys);
  ok('Symmetrix no puede cambiar el tope', (await call('trial', { body:{ action:'limit', dayLimit:5000 }, tok:staff })).s === 403);
  r = await call('ai');
  const ids = r.d.models.map(m => m.id);
  ok('hay modelos de los 4 proveedores', ['groq', 'mistral', 'openrouter', 'cloudflare'].every(p => r.d.provs.some(x => x.id === p)), r.d.provs);
  ok('solo gratis: GPT-4o (de pago) no aparece', !ids.includes('sz:openrouter:openai/gpt-4o') && ids.includes('sz:openrouter:meta-llama/llama-3.3-70b-instruct:free'), ids.filter(x => /openrouter/.test(x)));
  ok('sin modelos de audio', !ids.some(x => /lyria/.test(x)));
  r = await say('hola', 'sz:openrouter:openai/gpt-4o', { dev:'dispositivo-prueba-0001' });
  ok('pedir un modelo de pago se rechaza', r.s === 400 && r.d.code === 'sz_model', r.d);
  r = await say('hola', 'sz:auto', { dev:'dispositivo-prueba-0001' });
  ok('sin cuenta responde (streaming)', r.s === 200 && /Hola/.test(r.d.raw || '') && /"sz":\{"used"/.test(r.d.raw || ''), (r.d.raw || '').slice(0, 200));
  ok('dice qué modelo respondió', !!r.h.get('x-sz-model') && !!r.h.get('x-sz-prov'), [r.h.get('x-sz-model'), r.h.get('x-sz-prov')]);
  r = await call('ai', { dev:'dispositivo-prueba-0001' }); ok('el gasto queda contado', r.d.used > 0, r.d.used);
  const before = r.d.used;
  r = await say('hola', 'sz:mistral:mistral-small-latest', { tok:user });
  ok('con cuenta: responde el modelo pedido', r.s === 200 && r.h.get('x-sz-prov') === 'Mistral', r.h.get('x-sz-prov'));
  r = await call('ai', { dev:'dispositivo-prueba-0001' }); ok('lo de otra persona no suma al mío', r.d.used === before, [before, r.d.used]);
  /* respaldo: si Groq cae, responde otro proveedor y lo dice */
  await fail('groq', 500);
  r = await say('hola', 'sz:groq:llama-3.1-8b-instant', { tok:user });
  if (r.s !== 200) console.log('   debug', r.s, JSON.stringify(r.d).slice(0, 200));
  ok('Groq cae → responde otro y avisa', r.s === 200 && r.h.get('x-sz-fallback') === '1' && r.h.get('x-sz-prov') !== 'Groq', [r.h.get('x-sz-prov'), r.h.get('x-sz-fallback')]);
  await fail('groq', 0);
  /* tope diario */
  r = await call('trial', { body:{ action:'limit', dayLimit:1000 }, tok:owner }); ok('Prime cambia el tope', r.s === 200 && r.d.dayLimit === 1000, r.d);
  const big = 'x'.repeat(5000);
  for (let i = 0; i < 21; i++) await call('ai', { body:{ messages:[{ role:'user', content:big }], model:'sz:auto' }, tok:user });
  r = await say('hola', 'sz:auto', { tok:user });
  ok('pasado el tope: aviso claro y no responde', r.s === 429 && r.d.code === 'sz_limit', r.d);
  /* sin cuenta: 5 mensajes al día */
  await call('trial', { body:{ action:'limit', dayLimit:25000 }, tok:owner });
  const gd = 'dispositivo-invitado-0003', gip = '9.9.9.' + Math.floor(Math.random() * 200);
  const gs = (turn) => call('ai', { body:{ messages:[{ role:'user', content:'hola' }], model:'sz:auto', turn }, dev:gd, ip:gip });
  let codes = [];
  for (let i = 1; i <= 5; i++){ r = await gs('turno-' + i); codes.push(r.s + ':' + r.h.get('x-sz-guest')); }
  ok('sin cuenta: 5 mensajes funcionan', codes.every(c => /^200:/.test(c)) && /5\/5/.test(codes[4]), codes);
  r = await gs('turno-6'); ok('sin cuenta: el 6.º pide entrar', r.s === 429 && r.d.code === 'sz_guest' && /FlowIAndo/.test(r.d.error), r.d);
  r = await gs('turno-2'); ok('comparar (mismo mensaje) sigue contando como 1', r.s === 200, r.s);
  await gs('turno-2'); await gs('turno-2'); r = await gs('turno-2'); ok('pero repetir el mismo número no salta el límite', r.s === 429 && r.d.code === 'sz_guest', r.s);
  r = await call('ai', { dev:gd, ip:gip }); ok('GET dice cuántos lleva (sin cuenta)', r.d.guest && r.d.guest.used === 5 && r.d.guest.max === 5, r.d.guest);
  r = await call('ai', { body:{ messages:[{ role:'user', content:'hola' }], model:'sz:auto', turn:'turno-x' }, dev:'otro-dispositivo-00009', ip:gip });
  ok('otro dispositivo en la misma conexión sí puede (tope por conexión más alto)', r.s === 200, r.s);
  r = await call('ai', { tok:user }); ok('con cuenta no hay tope de invitado', r.d.guest === null, r.d.guest);
  r = await call('ai', { body:{ messages:[{ role:'user', content:'hola' }], model:'sz:auto' }, tok:user, dev:gd, ip:gip });
  ok('al entrar, sigue FlowIAndo en el mismo equipo', r.s === 200 && !r.h.get('x-sz-guest'), r.s);
  await call('trial', { body:{ action:'limit', dayLimit:20000 }, tok:owner });
  /* pulso */
  await call('health', { body:{ action:'beat', page:'chat', state:{ msgs:2, ai:'sz' } }, tok:user });
  await call('health', { body:{ action:'beat', page:'inicio', state:{} }, dev:'dispositivo-prueba-0001' });
  await call('health', { body:{ action:'ev', kind:'error', page:'chat', detail:'falló con sk-or-v1-secreto123456' }, tok:user });
  ok('un Synther no ve el pulso', (await call('health?panel=1', { tok:user })).s === 403);
  r = await call('health?panel=1', { tok:staff }); if (r.s !== 200) console.log('   debug panel', r.s, JSON.stringify(r.d).slice(0, 300));
  ok('Symmetrix ve el pulso: en línea, errores, llaves', r.s === 200 && r.d.online.length >= 2 && r.d.events.some(e => e.kind === 'error') && r.d.keys.length >= 4, { online:r.d.online.length, ev:r.d.events.length, keys:(r.d.keys || []).length });
  ok('los errores no guardan llaves', !JSON.stringify(r.d.events).includes('secreto123456'));
  ok('el panel no trae llaves completas', !JSON.stringify(r.d).match(/gsk_prueba|mstr_prueba|cfat_prueba|sk-or-v1-pool/));
  r = await call('trial', { tok:staff }); ok('Symmetrix ve sus llaves marcadas', r.s === 200 && r.d.keys.some(k => k.mine && k.prov === 'cloudflare') && r.d.canEdit === false, r.d.mine);
  ok('Google: Symmetrix no lo cambia', (await call('trial', { body:{ action:'google', clientId:'123456789-abcdefghij0123456789.apps.googleusercontent.com' }, tok:staff })).s === 403);
  r = await call('trial', { body:{ action:'google', clientId:'123456789-abcdefghij0123456789.apps.googleusercontent.com' }, tok:owner });
  ok('Google: Prime lo activa desde el panel', r.s === 200);
  ok('ninguna respuesta trae llaves', !seen.some(x => /gsk_prueba|mstr_prueba|cfat_prueba|sk-or-v1-pool/.test(x)));
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });
