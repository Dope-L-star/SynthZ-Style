const { open } = require('../v15/h.js');
const B = 'http://localhost:8765/api/';
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 300) : ''));
const call = async (path, body, tok) => { const r = await fetch(B + path, { method:body ? 'POST' : 'GET', headers:Object.assign({ 'content-type':'application/json', 'x-forwarded-for':'7.7.' + Math.floor(Math.random() * 250) + '.2' }, tok ? { authorization:'Bearer ' + tok } : {}), body:body ? JSON.stringify(body) : undefined }); return { s:r.status, d:await r.json().catch(() => ({})) }; };
(async () => {
  const own = await call('auth', { mode:'signup', user:'sammuersynth', pass:'luz-de-prime-1', setup:'codigo-de-dueno-123' });
  const tok = own.d.token || (await call('auth', { mode:'login', user:'sammuersynth', pass:'luz-de-prime-1' })).d.token;
  await call('trial', { action:'keys', groq:'gsk_prueba', mistral:'mstr_prueba', openrouter:'sk-or-v1-pool' }, tok);
  const u = await call('auth', { mode:'signup', user:'pepito' + Date.now() % 1e5, pass:'clave-larga-1' });
  ok('usuario normal NO puede encender', (await call('trial', { action:'maint', on:true }, u.d.token)).s === 403);
  /* 1 · Pulsem: encender desde la tarjeta */
  let { b, p, errs } = await open({ page:'pulsem.html', state:{ keys:{} }, wait:1500 });
  await p.evaluate(t => localStorage.setItem('synthz:sess', t), tok); await p.reload(); await p.waitForTimeout(4000);
  await p.evaluate(() => { const t = [...document.querySelectorAll('nav button, .tabs button, [data-tab]')].find(x => /ajustes/i.test(x.textContent)); if (t) t.click(); });
  await p.waitForTimeout(600);
  const card = await p.$('#sMaint'); ok('Pulsem tiene la tarjeta del aviso', !!card);
  if (card){ await card.scrollIntoViewIfNeeded(); await p.fill('#sMaint', 'Estamos mejorando SynthFlow para que vaya más rápido. Vuelve en un ratito.'); await p.click('[data-set="maint"][data-on="1"]'); await p.waitForTimeout(1200); }
  await p.screenshot({ path:'pulsem-set.png', fullPage:false });
  ok('Pulsem NO se cubre', !(await p.$('#szMaint')));
  const sm = await p.evaluate(() => document.querySelector('#hUse') && document.querySelector('#hUse').innerText);
  ok('medidor visible en Pulsem', !!sm, sm);
  ok('sin errores Pulsem', !errs.length, errs); await b.close();
  ok('config dice encendido', (await call('config')).d.maint.on === true);
  /* 2 · un visitante en el celular */
  ({ b, p, errs } = await open({ w:390, h:844, page:'chat.html', wait:3500 }));
  ok('el chat queda cubierto', !!(await p.$('#szMaint')));
  ok('sin botón de salida para visitantes', await p.evaluate(() => document.querySelector('.mt-exit').hidden));
  await p.screenshot({ path:'mt-m1.png' });
  await p.fill('.mt-in', 'eres la mejor, te quiero mucho'); await p.keyboard.press('Enter');
  await p.waitForTimeout(300); ok('se encanta con cariño', await p.evaluate(() => document.querySelector('.mt-face .szface').dataset.mood), await p.evaluate(() => document.querySelector('.mt-face .szface').dataset.mood));
  await p.waitForTimeout(600); await p.screenshot({ path:'mt-m2.png' });
  await p.waitForTimeout(4000); await p.screenshot({ path:'mt-m3.png' });
  const msgs = await p.evaluate(() => [...document.querySelectorAll('.mt-m')].map(x => x.className.split(' ')[1] + ': ' + x.innerText));
  ok('responde', msgs.length >= 3, msgs);
  ok('sin errores visitante', !errs.length, errs); await b.close();
  /* 3 · Prime en PC: puede entrar igual */
  ({ b, p, errs } = await open({ w:1440, h:900, page:'chat.html', wait:4500, init:"localStorage.setItem('synthz:sess'," + JSON.stringify(tok) + ")" }));
  await p.screenshot({ path:'mt-d1.png' });
  ok('Prime ve «Entrar igual»', await p.evaluate(() => !document.querySelector('.mt-exit').hidden));
  await p.click('.mt-exit'); await p.waitForTimeout(700);
  ok('Prime entra', !(await p.$('#szMaint')));
  await b.close();
  await call('trial', { action:'maint', on:false }, tok);
  ({ b, p, errs } = await open({ w:390, h:844, page:'chat.html', wait:3000 }));
  ok('apagado: ya no cubre', !(await p.$('#szMaint'))); await b.close();
})();
