/* SynthonIA: saludo, SynXCoin's con la barrita abierta/cerrada, ventana «Chat con…», pantallas bajitas */
const { open } = require('./v15/h.js');
const B = 'http://localhost:8765/api/';
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 240) : ''));
const call = async (path, body, tok) => { const r = await fetch(B + path, { method:body ? 'POST' : 'GET', headers:Object.assign({ 'content-type':'application/json', 'x-forwarded-for':'5.5.' + Math.floor(Math.random() * 250) + '.9' }, tok ? { authorization:'Bearer ' + tok } : {}), body:body ? JSON.stringify(body) : undefined }); return { s:r.status, d:await r.json().catch(() => ({})) }; };
(async () => {
  const own = (await call('auth', { mode:'signup', user:'sammueladmin', pass:'luz-de-zflow-1', setup:'codigo-de-dueno-123' })).d.token || (await call('auth', { mode:'login', user:'sammueladmin', pass:'luz-de-zflow-1' })).d.token;
  const usr = (await call('auth', { mode:'signup', user:'synther' + Date.now().toString(36).slice(-5), pass:'luz-normal-123' })).d;
  await call('trial', { action:'keys', groq:'gsk_prueba' }, own);
  let { b, p, errs } = await open({ state:{ keys:{} }, wait:4000 });
  /* «¿Dónde están los SynXCoin's?» con la barrita cerrada */
  await p.evaluate(() => { const r = document.querySelector('#rail'); if (r.classList.contains('open')) document.querySelector('#railTog').click(); });
  await p.waitForTimeout(900);
  ok('barrita cerrada: el SynXCoin se ve abajo', await p.evaluate(() => { const r = document.querySelector('#railCoin').getBoundingClientRect(); return r.height > 30 && r.width > 30; }));
  const t0 = Date.now(); await p.evaluate(() => SZ.BOT.open()); await p.waitForTimeout(600);
  await p.evaluate(() => { const i = document.querySelector('#szBotP .bin input'); i.value = '¿Dónde están los SynXCoin\'s?'; i.closest('form').requestSubmit(); });
  const seen = { closed:false, open:false };
  for (let i = 0; i < 30; i++){ await p.waitForTimeout(400); const s = await p.evaluate(() => ({ hand:!!document.querySelector('#szHand.on'), open:document.querySelector('#rail').classList.contains('open'), say:(document.querySelector('#szSay.on p') || {}).textContent || '' })); if (s.hand && /cerrada/.test(s.say)) seen.closed = true; if (s.hand && s.open && /abres/.test(s.say)) seen.open = true; const nb = await p.$('#szSay.on [data-sb]'); if (nb && i % 3 === 2) await nb.click().catch(() => {}); }
  ok('la manita señala con la barrita cerrada y abierta', seen.closed && seen.open, seen);
  await p.waitForTimeout(1500);
  ok('al final la barrita queda como estaba (cerrada)', await p.evaluate(() => !document.querySelector('#rail').classList.contains('open')));
  /* saludo */
  await p.evaluate(() => SZ.BOT.open()); await p.waitForTimeout(400);
  await p.evaluate(() => { const i = document.querySelector('#szBotP .bin input'); i.value = 'hola'; i.closest('form').requestSubmit(); });
  await p.waitForTimeout(6000);
  ok('la manita saluda (mano abierta)', await p.evaluate(() => document.querySelector('#szHand') && document.querySelector('#szHand').dataset.s === 'palm'));
  await p.waitForTimeout(3500);
  /* ventana «Chat con…» */
  await p.evaluate(t => { localStorage.setItem('synthz:sess', t); }, usr.token); await p.reload(); await p.waitForTimeout(4500);
  await p.evaluate(() => SZ.BOT.team()); await p.waitForTimeout(1200);
  const cw = await p.evaluate(() => { const w = document.querySelector('#szChat'); return w ? { on:w.classList.contains('on'), title:w.querySelector('.cwt b').textContent, x:w.getBoundingClientRect().right } : null; });
  ok('«Hablar con el equipo» abre la ventana desde la derecha', cw && cw.on && /Chat con/.test(cw.title), cw);
  await p.fill('#szChat .cwin input', 'Hola, no encuentro mis chats'); await p.press('#szChat .cwin input', 'Enter'); await p.waitForTimeout(1500);
  const list = (await call('help', null, own)).d.items || [];
  const it = list.find(x => /no encuentro/.test(x.text));
  ok('el pedido llega a la bandeja del equipo', !!it);
  await call('help', { action:'say', id:it.id, text:'¡Hola! Te ayudo ya mismo.' }, own);
  await p.evaluate(() => SZ.BOT.sync()); await p.waitForTimeout(1500);
  const t2 = await p.evaluate(() => document.querySelector('#szChat .cwt b').textContent + ' | ' + document.querySelector('#szChat .cwl').textContent.slice(-60));
  ok('el título dice quién te atiende', /Chat con @?sammueladmin/.test(t2) && /Te ayudo/.test(t2), t2);
  await p.screenshot({ path:'/tmp/b5-chatcon.png' });
  await p.keyboard.press('Escape'); await p.waitForTimeout(800);
  ok('Esc cierra la ventana', await p.evaluate(() => !document.querySelector('#szChat').classList.contains('on')));
  ok('sin errores', !errs.length, errs);
  await b.close();
  /* pantallas bajitas */
  ({ b, p, errs } = await open({ state:{ keys:{} }, w:1366, h:620, wait:4000 }));
  await p.screenshot({ path:'/tmp/b5-bajita.png' });
  await p.evaluate(() => (document.querySelector('#cPick') || document.querySelector('#curChip')).click()); await p.waitForTimeout(1200);
  const n = await p.evaluate(() => [...document.querySelectorAll('#mlist .mi')].filter(e => { const r = e.getBoundingClientRect(), L = document.querySelector('#mlist').getBoundingClientRect(); return r.bottom <= L.bottom + 2 && r.top >= L.top - 2; }).length);
  ok('pantalla bajita: el selector muestra varias IA', n >= 2, n);
  await p.screenshot({ path:'/tmp/b5-bajita-selector.png' });
  await b.close();
})();
