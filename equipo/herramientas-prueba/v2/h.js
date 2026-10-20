const { open } = require('../v15/h.js');
const B = 'http://localhost:8765/api/';
const call = (path, body, tok) => fetch(B + path, { method:body ? 'POST' : 'GET', headers:Object.assign({ 'content-type':'application/json', 'x-forwarded-for':'9.9.' + Math.floor(Math.random() * 250) + '.1' }, tok ? { authorization:'Bearer ' + tok } : {}), body:body ? JSON.stringify(body) : undefined }).then(r => r.json().then(d => ({ s:r.status, d })));
(async () => {
  const own = (await call('auth', { mode:'signup', user:'sammuersynth', pass:'luz-de-prime-1', setup:'codigo-de-dueno-123' })).d.token;
  await call('trial', { action:'keys', groq:'gsk_prueba', mistral:'mstr_prueba', cloudflare:'cfat_prueba' }, own);
  const usr = (await call('auth', { mode:'signup', user:'ana' + Date.now().toString(36).slice(-4), pass:'clave-larga-123' })).d.token;
  const U = await open({ w:1440, h:900, init:"localStorage.setItem('synthz:sess'," + JSON.stringify(usr) + ");" });
  const p = U.p; await p.waitForTimeout(1200);
  await p.screenshot({ path:'v2/h1.png' });
  console.log('match', JSON.stringify(await p.evaluate(() => ['¿Puedo usar SynthFlow para escribir poemas en inglés?', 'como conecto puter', 'donde cambio la ia', 'no puedo escribir nada', 'que son los synxcoins', 'quiero comparar dos ias', 'donde estan mis chats', 'hola', 'ayuda', 'me cobran?', 'cual es la capital de francia'].map(q => q + ' => ' + SZ.BOT.match(q)))));
  await p.click('#szBot'); await p.waitForTimeout(1200);
  await p.screenshot({ path:'v2/h2.png' });
  await p.evaluate(() => document.querySelector('#szBotP [data-bf="2"]').click()); await p.waitForTimeout(1500);
  await p.screenshot({ path:'v2/h3.png' });
  await p.waitForTimeout(3500);
  await p.fill('#szBotP .bin input', '¿Puedo usar SynthFlow para escribir poemas en inglés?'); await p.press('#szBotP .bin input', 'Enter'); await p.waitForTimeout(2500);
  console.log('ia:', await p.evaluate(() => [...document.querySelectorAll('#szBotP .bm.a p')].pop().textContent));
  await p.evaluate(() => document.querySelector('#szBotP [data-b="team"]').click()); await p.waitForTimeout(600);
  await p.fill('#szBotP .bin input', 'No me deja conectar Puter, ayuda'); await p.press('#szBotP .bin input', 'Enter'); await p.waitForTimeout(1500);
  await p.screenshot({ path:'v2/h4.png' });
  // dueño responde desde su bandeja
  const O = await open({ w:1440, h:900, init:"localStorage.setItem('synthz:sess'," + JSON.stringify(own) + ");" });
  const q = O.p; await q.waitForTimeout(3500);
  console.log('dot owner:', await q.evaluate(() => (document.querySelector('#szBot .bdot') || {}).textContent));
  await q.click('#szBot'); await q.waitForTimeout(900);
  await q.evaluate(() => document.querySelector('#szBotP [data-bt="inbox"]').click()); await q.waitForTimeout(600);
  await q.screenshot({ path:'v2/h5.png' });
  await q.evaluate(() => document.querySelector('#szBotP [data-bi]').click()); await q.waitForTimeout(1200);
  await q.fill('#szBotP .bin input', 'Hola, soy Sam. Permite las ventanas emergentes y vuelve a tocar Conectar.'); await q.press('#szBotP .bin input', 'Enter'); await q.waitForTimeout(1500);
  await q.screenshot({ path:'v2/h6.png' });
  // la persona ve la respuesta
  await p.evaluate(() => SZ.BOT.sync()); await p.waitForTimeout(2500);
  await p.screenshot({ path:'v2/h7.png' });
  console.log('user sees:', await p.evaluate(() => [...document.querySelectorAll('#szBotP .bm.t')].map(x => x.textContent).join(' | ')), '| face:', await p.evaluate(() => document.querySelector('#szBot .szface').dataset.mood));
  console.log(U.errs, O.errs);
  await U.b.close(); await O.b.close();
})();
