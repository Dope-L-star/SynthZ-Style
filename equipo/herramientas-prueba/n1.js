/* v1.3: agente, SynthonIA (chiste, dato, fuera de tema, siesta), guía bloqueada, rescate, candado */
const { open } = require('./v15/h.js');
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 240) : ''));
(async () => {
  let { b, p, errs } = await open({ w:1440, h:900, state:{ keys:{} }, wait:4500 });
  /* SynthonIA */
  const ask = async q => { await p.evaluate(q => { SZ.BOT.open(); const i = document.querySelector('#szBotP .bin input'); i.value = q; i.closest('form').requestSubmit(); }, q); await p.waitForTimeout(6200); return p.evaluate(() => { const a = [...document.querySelectorAll('#szBotP .bm.a p')].pop(); return a ? a.textContent : ''; }); };
  const j1 = await ask('cuéntame un chiste'), j2 = await ask('otro chiste');
  ok('chiste y no se repite', j1.length > 10 && j1 !== j2, [j1, j2]);
  const f1 = await ask('dime un dato curioso');
  ok('dato curioso', /Sabías/.test(f1), f1);
  const t1 = await ask('hazme un código en python que ordene una lista');
  ok('no hace tareas: ofrece llevarlo al chat', /trabajo para las IAs/.test(t1), t1);
  await p.click('#szBotP [data-ba="tochat"]').catch(() => {}); await p.waitForTimeout(600);
  ok('lo deja en la caja del chat', /python/.test(await p.evaluate(() => document.querySelector('#inp').value)));
  await p.evaluate(() => { document.querySelector('#inp').value = ''; SZ.BOT.close(); });
  /* modo agente */
  await p.evaluate(() => document.querySelector('#railAgent').click()); await p.waitForTimeout(400);
  ok('modo agente encendido', await p.evaluate(() => document.querySelector('#railAgent').getAttribute('aria-pressed') === 'true'));
  await p.fill('#inp', 'quiero vender tortas por instagram'); await p.keyboard.press('Enter'); await p.waitForTimeout(5000);
  const um = await p.evaluate(() => { const u = [...document.querySelectorAll('.m.user')].pop(); return u ? u.textContent.slice(0, 160) : ''; });
  ok('el agente mandó un pedido (mejorado o tal cual)', um.length > 5, um);
  await p.evaluate(() => document.querySelector('#railAgent').click());
  /* guía: no se puede tocar nada salvo la guía */
  await p.evaluate(() => document.documentElement.classList.add('guiding'));
  const before = await p.evaluate(() => document.querySelector('#side').classList.contains('open'));
  await p.mouse.click(700, 40); await p.waitForTimeout(400);
  const blocked = await p.evaluate(() => document.querySelector('#side').classList.contains('open'));
  ok('durante la guía no se abre nada', before === blocked);
  await p.evaluate(() => document.documentElement.classList.remove('guiding'));
  /* siesta */
  await p.evaluate(() => { const ev = new Event('x'); });
  await p.waitForTimeout(66000);
  ok('al minuto sin moverse se duerme', await p.evaluate(() => document.documentElement.classList.contains('idle-sleep')));
  await p.mouse.move(300, 300); await p.waitForTimeout(500);
  ok('al volver se despierta', await p.evaluate(() => !document.documentElement.classList.contains('idle-sleep')));
  ok('sin errores', !errs.length, errs);
  await b.close();
  /* candado: sin IAs conectadas y sin Puter */
  ({ b, p, errs } = await open({ w:390, h:844, state:{ keys:{} }, init:"localStorage.setItem('mockPuter','0')", wait:3500 }));
  await p.evaluate(() => { SZ.szqSet ? SZ.szqSet({ on:false }) : (SZ.SZQ.on = false); dispatchEvent(new Event('synthz-szq')); }); await p.waitForTimeout(2500);
  ok('sin nada conectado: bloqueado', await p.evaluate(() => document.body.classList.contains('locked')));
  await p.screenshot({ path:'/tmp/n1-lock.png' });
  await b.close();
})();
