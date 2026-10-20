/* v2.0: proveedores nuevos (Google, Ollama, SiliconFlow) solo con lo gratis, imágenes con límite y alerta de pago */
const B = 'http://localhost:8765/api/', S = 'http://localhost:8799/';
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 240) : ''));
const call = async (path, o = {}) => { const r = await fetch(B + path, { method:o.method || (o.body ? 'POST' : 'GET'), headers:Object.assign({ 'content-type':'application/json', 'x-forwarded-for':o.ip || '5.5.5.' + Math.floor(Math.random() * 200) }, o.tok ? { authorization:'Bearer ' + o.tok } : {}, o.dev ? { 'x-sz-device':o.dev } : {}), body:o.body ? JSON.stringify(o.body) : undefined }); const t = await r.text(); let d = {}; try{ d = JSON.parse(t); }catch(e){ d = { raw:t }; } return { s:r.status, d, h:r.headers }; };
const sign = (user, pass, setup) => call('auth', { body:Object.assign({ mode:'signup', user, pass }, setup ? { setup } : {}) });
(async () => {
  const owner = (await sign('sammuersynth', 'luz-de-prime-1', 'codigo-de-dueno-123')).d.token || (await call('auth', { body:{ mode:'login', user:'sammuersynth', pass:'luz-de-prime-1' } })).d.token;
  const user = (await sign('synther' + Date.now().toString(36).slice(-5), 'luz-normal-123')).d.token;
  let r = await call('trial', { body:{ action:'keys', google:'AIza_prueba', ollama:'olla_prueba', siliconflow:'sk-sf_prueba', pollinations:'sk_polli' }, tok:owner });
  ok('Pulsem guarda y prueba las 4 llaves nuevas', r.s === 200 && r.d.keys.length === 4 && r.d.keys.every(k => k.ok), r.d.keys && r.d.keys.map(k => k.prov + ':' + k.state));
  r = await call('ai');
  const ids = r.d.models.map(m => m.id);
  ok('Google: solo Flash y Gemma (sin Pro, imagen ni embeddings)', ids.includes('sz:google:gemini-2.5-flash') && ids.includes('sz:google:gemma-3-27b-it') && !ids.some(x => /gemini-2\.5-pro|flash-image|embedding/.test(x)), ids.filter(x => /google/.test(x)));
  ok('SiliconFlow: solo los gratis (sin DeepSeek-V3 ni «Pro/»)', ids.includes('sz:siliconflow:Qwen/Qwen3-8B') && ids.includes('sz:siliconflow:THUDM/GLM-4-9B-0414') && !ids.some(x => /DeepSeek-V3|Pro\//.test(x)), ids.filter(x => /siliconflow/.test(x)));
  ok('Ollama aparece', ids.includes('sz:ollama:gpt-oss:120b'), ids.filter(x => /ollama/.test(x)));
  ok('Pollinations no sale como IA de chat', !ids.some(x => /polli/.test(x)));
  r = await call('ai', { body:{ messages:[{ role:'user', content:'hola' }], model:'sz:siliconflow:deepseek-ai/DeepSeek-V3' }, tok:user });
  ok('pedir un modelo de pago de SiliconFlow se rechaza', r.s === 400 && r.d.code === 'sz_model', r.d);
  r = await call('ai', { body:{ messages:[{ role:'user', content:'hola' }], model:'sz:google:gemini-2.5-flash' }, tok:user });
  ok('Google responde', r.s === 200 && /google/.test(r.d.raw || ''), (r.d.raw || '').slice(0, 80));
  /* imágenes */
  r = await call('ai', { body:{ action:'image', prompt:'un gato astronauta' } });
  ok('imágenes: sin cuenta pide entrar', r.s === 401 && r.d.code === 'img_login', r.d);
  r = await call('ai', { body:{ action:'image', prompt:'un gato astronauta' }, tok:user });
  ok('imágenes: con cuenta crea la imagen', r.s === 200 && /^data:image\/png;base64,/.test(r.d.img || '') && r.d.max === 3, { s:r.s, left:r.d.left, max:r.d.max });
  await call('ai', { body:{ action:'image', prompt:'otra' }, tok:user }); await call('ai', { body:{ action:'image', prompt:'otra más' }, tok:user });
  r = await call('ai', { body:{ action:'image', prompt:'la cuarta' }, tok:user });
  ok('imágenes: respeta el límite del día (3)', r.s === 429 && r.d.code === 'img_limit', r.d);
  r = await call('trial', { body:{ action:'limit', imgDay:5 }, tok:owner });
  ok('Pulsem cambia el límite de imágenes', r.d.imgDay === 5, r.d);
  /* alerta: Pollinations sin saldo → alerta para el equipo, nada se cobra */
  await call('trial', { body:{ action:'keys', pollinations:'sk_sinpollen' }, tok:owner });
  r = await call('ai', { body:{ action:'image', prompt:'gato' }, tok:user });
  const p1 = await call('health?panel=1', { tok:owner });
  ok('sin saldo en Pollinations: no se cobra nada y Pulsem muestra la ALERTA', r.s === 503 && (p1.d.alerts || []).some(a => a.prov === 'pollinations'), { s:r.s, alerts:(p1.d.alerts || []).map(a => a.name) });
  /* alerta global: todas las IAs de chat piden pago → modo alerta */
  for (const p of ['google', 'ollama', 'sf']) await fetch(S + 'mockfail?p=' + p + '&s=402');
  for (let i = 0; i < 3; i++) await call('ai', { body:{ messages:[{ role:'user', content:'hola ' + i }], model:'sz:auto' }, tok:user });
  r = await call('ai', { tok:user });
  ok('si TODAS las IAs gratis piden pago: la página entra en modo alerta', r.d.alert === true, { alert:r.d.alert });
  for (const p of ['google', 'ollama', 'sf']) await fetch(S + 'mockfail?p=' + p + '&s=0');
  r = await call('trial', { body:{ action:'check' }, tok:owner });
  r = await call('ai', { tok:user });
  ok('cuando vuelven a funcionar, sale del modo alerta', r.d.alert === false, { alert:r.d.alert });
  r = await call('ai', { tok:owner });
  ok('la alerta de Pollinations sigue hasta que vuelva a funcionar (el equipo ve 1 aviso)', r.d.alertN === 1, r.d.alertN);
  const u = await call('ai', { tok:user });
  ok('una persona normal no ve el detalle', u.d.alertN === 0);
})();
