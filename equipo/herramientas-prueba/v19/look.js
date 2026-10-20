/* fotos de todo, con cuenta (después de gastar los 5 de prueba sin cuenta) */
const { open } = require('../v15/h.js');
const B = 'http://localhost:8765/api/';
const call = async (path, body, tok) => (await fetch(B + path, { method:'POST', headers:Object.assign({ 'content-type':'application/json', 'x-forwarded-for':'127.0.0.1' }, tok ? { authorization:'Bearer ' + tok } : {}), body:JSON.stringify(body) })).json();
(async () => {
  const W = +process.argv[2] || 1440, H = W < 600 ? 844 : 900, tag = W < 600 ? 'm' : 'd', D = __dirname + '/look-' + tag + '-';
  const own = await call('auth', { mode:'signup', user:'sammuersynth', pass:'luz-de-prime-1', setup:'codigo-de-dueno-123' });
  const tok = own.token || (await call('auth', { mode:'login', user:'sammuersynth', pass:'luz-de-prime-1' })).token;
  await call('trial', { action:'keys', groq:'gsk_prueba', mistral:'mstr_prueba' }, tok);
  let { b, p, errs } = await open({ w:W, h:H, state:{ keys:{} }, init:"localStorage.setItem('mockPuter','0');localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}))", wait:4500 });
  for (let i = 1; i <= 5; i++){ await p.fill('#inp', 'hola ' + i); await p.keyboard.press('Enter'); await p.waitForTimeout(5000); }
  await p.waitForTimeout(1500); await p.screenshot({ path:D + '0-guest-lleno.png' });
  await p.evaluate(t => localStorage.setItem('synthz:sess', t), tok); await p.reload(); await p.waitForTimeout(6000);
  await p.screenshot({ path:D + '1-con-cuenta.png' });
  console.log('signed', await p.evaluate(() => ({ ready:SZ.ACC.ready, locked:document.body.classList.contains('locked'), gate:!!document.querySelector('#szGate'), ph:document.querySelector('#inp').placeholder, guest:JSON.stringify(SZ.SZQ.guest) })));
  await p.fill('#inp', '¿qué es la fotosíntesis?'); await p.keyboard.press('Enter'); await p.waitForTimeout(6000);
  await p.screenshot({ path:D + '2-respuesta.png' });
  const m = await p.$('.m.bot .body'); if (m){ const r = await m.boundingBox(); await p.mouse.click(r.x + 40, r.y + 10, { button:'right' }); await p.waitForTimeout(600); await p.screenshot({ path:D + '3-clic-derecho.png' }); await p.keyboard.press('Escape'); }
  await p.evaluate(() => document.querySelector('#moreBtn').click()); await p.waitForTimeout(600); await p.screenshot({ path:D + '4-menu.png' }); await p.keyboard.press('Escape');
  await p.evaluate(() => SZ.cfgModal()); await p.waitForTimeout(1200); await p.screenshot({ path:D + '5-ajustes.png' }); await p.keyboard.press('Escape'); await p.waitForTimeout(600);
  await p.evaluate(() => { const a = document.querySelector('#accBtn') ; if (a && a.getClientRects().length) a.click(); else document.querySelector('#tabbar [data-tab="me"]').click(); }); await p.waitForTimeout(2500); await p.screenshot({ path:D + '6-cuenta.png' });
  console.log('errs', errs);
  await b.close();
  ({ b, p, errs } = await open({ w:W, h:H, page:'index.html', state:{ keys:{} }, init:"localStorage.setItem('synthz:sess'," + JSON.stringify(tok) + ");localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}))", wait:5000 }));
  await p.screenshot({ path:D + '7-inicio.png' }); await p.screenshot({ path:D + '8-inicio-todo.png', fullPage:true });
  console.log('errs2', errs);
  await b.close();
})();
