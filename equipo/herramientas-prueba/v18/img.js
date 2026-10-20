/* v2.0: crear imágenes en el chat y modo alerta */
const { open } = require('../v15/h.js');
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 260) : ''));
const B = 'http://localhost:8765/api/';
const call = async (path, body, tok) => (await fetch(B + path, { method:body ? 'POST' : 'GET', headers:Object.assign({ 'content-type':'application/json', 'x-forwarded-for':'4.4.4.' + Math.floor(Math.random() * 200) }, tok ? { authorization:'Bearer ' + tok } : {}), body:body ? JSON.stringify(body) : undefined })).json();
(async () => {
  const W = +process.argv[2] || 1280, tag = W < 600 ? 'm' : 'd';
  const own = await call('auth', { mode:'signup', user:'sammuersynth', pass:'luz-de-prime-1', setup:'codigo-de-dueno-123' });
  const otok = own.token || (await call('auth', { mode:'login', user:'sammuersynth', pass:'luz-de-prime-1' })).token;
  await call('trial', { action:'keys', groq:'gsk_prueba', pollinations:'sk_polli' }, otok);
  const u = await call('auth', { mode:'signup', user:'pinta' + Date.now().toString(36).slice(-5), pass:'clave-larga-123' });
  let { b, p, errs } = await open({ w:W, h:W < 600 ? 844 : 800, page:'chat.html', state:{ keys:{} }, init:"localStorage.setItem('synthz:sess'," + JSON.stringify(u.token) + ");if(!localStorage.getItem('synthz:cfg'))localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}));localStorage.setItem('synthz:newv','2.0')", wait:5000 });
  ok('botón «Crear imagen» junto al clip', await p.evaluate(() => !!document.querySelector('#imgBtn')));
  await p.evaluate(() => document.querySelector('#imgBtn').click()); await p.waitForTimeout(400);
  ok('modo imagen: la caja pide describir la imagen', /Describe la imagen/.test(await p.evaluate(() => document.querySelector('#inp').placeholder)));
  await p.evaluate(() => { const i = document.querySelector('#inp'); i.value = 'un gato astronauta en la luna'; i.dispatchEvent(new Event('input', { bubbles:true })); document.querySelector('#sendBtn').click(); });
  await p.waitForTimeout(3500);
  const r = await p.evaluate(() => ({ img:!!document.querySelector('.szimg img'), cap:(document.querySelector('.szimg figcaption') || {}).textContent, dl:!!document.querySelector('[data-imgdl]') }));
  ok('la imagen aparece en el chat con «Descargar»', r.img && /gato astronauta/.test(r.cap || '') && r.dl, r);
  await p.screenshot({ path:__dirname + '/img-' + tag + '-1.png' });
  await p.reload(); await p.waitForTimeout(4500);
  console.log(await p.evaluate(() => ({ msgs:[...document.querySelectorAll('.m')].map(x => x.className + ':' + x.textContent.slice(0, 40)), fresh:!!document.querySelector('.hello'), threads:Object.keys(SZ.state.chats).filter(k => SZ.state.chats[k].length) })));
  ok('al volver a abrir, la imagen sigue ahí (guardada en este equipo)', await p.evaluate(() => !!document.querySelector('.szimg img')));
  ok('sin errores', !errs.length, errs);
  await b.close();
  /* modo alerta */
  ({ b, p, errs } = await open({ w:W, h:W < 600 ? 844 : 800, page:'chat.html', state:{ keys:{} }, init:"localStorage.setItem('mockPuter','0');if(!localStorage.getItem('synthz:cfg'))localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}))", wait:4000 }));
  await p.evaluate(() => SZ.szqSet({ alert:true })); await p.waitForTimeout(1200);
  const al = await p.evaluate(() => (document.querySelector('#szAlert') || {}).textContent || '');
  ok('modo alerta: «Error: no podemos continuar… te redirigimos»', /no podemos continuar/.test(al) && /redirigimos/.test(al), al.slice(0, 120));
  await p.screenshot({ path:__dirname + '/img-' + tag + '-2-alerta.png' });
  await p.evaluate(() => SZ.szqSet({ alert:false })); await p.waitForTimeout(900);
  ok('cuando vuelve: «¡Volvimos!» y recarga', /Volvimos/.test(await p.evaluate(() => (document.querySelector('#szAlert') || {}).textContent || '')));
  await b.close();
})();
