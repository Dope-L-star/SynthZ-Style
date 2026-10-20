/* v2.2: todo lo de esta ronda, en PC o celular (argumento: ancho) */
const { open } = require('../v15/h.js');
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 240) : ''));
const B = 'http://localhost:8765/api/';
const call = async (path, body, tok) => (await fetch(B + path, { method:'POST', headers:Object.assign({ 'content-type':'application/json', 'x-forwarded-for':'5.5.5.5' }, tok ? { authorization:'Bearer ' + tok } : {}), body:JSON.stringify(body) })).json();
(async () => {
  const W = +process.argv[2] || 1440, H = W < 600 ? 844 : 900, tag = W < 600 ? 'm' : 'd';
  const own = await call('auth', { mode:'signup', user:'sammuersynth', pass:'luz-de-prime-1', setup:'codigo-de-dueno-123' });
  const tok = own.token || (await call('auth', { mode:'login', user:'sammuersynth', pass:'luz-de-prime-1' })).token;
  let { b, p, errs } = await open({ w:W, h:H, state:{ keys:{} }, init:"localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}));localStorage.setItem('synthz:sess'," + JSON.stringify(tok) + ")", wait:4500 });
  /* 1 · con sesión, mientras la cuenta tarda en cargar, nada de «entra a tu cuenta» */
  await p.route('**/api/me', async r => { await new Promise(o => setTimeout(o, 3500)); try{ await r.continue(); }catch(e){} });
  await p.reload(); await p.waitForTimeout(1500);
  const mid = await p.evaluate(() => ({ gate:!!document.querySelector('#szGate'), entrar:/Entrar/.test((document.querySelector('#accBtn') || {}).textContent || ''), signed:document.documentElement.classList.contains('signed'), guest:SZ.isGuestQ() }));
  ok(tag + ' cargando la cuenta: no pide «Entrar» ni sale el letrero', !mid.gate && !mid.entrar && mid.signed && !mid.guest, mid);
  await p.unroute('**/api/me'); await p.waitForTimeout(4500);
  ok(tag + ' la cuenta queda lista', await p.evaluate(() => SZ.ACC.ready));
  /* 2 · el perfil carga las IAs conectadas (antes se quedaba en «Cargando…») */
  await p.evaluate(() => { const a = document.querySelector('#accBtn'); if (a && a.getClientRects().length) a.click(); else document.querySelector('#tabbar [data-tab="me"]').click(); }); await p.waitForTimeout(3500);
  const tr = await p.evaluate(() => (document.querySelector('#aTrial') || {}).textContent || 'no');
  ok(tag + ' el perfil carga «IAs conectadas» del equipo', tr !== 'no' && !/Cargando las IAs conectadas/.test(tr), tr.slice(0, 120));
  await p.screenshot({ path:__dirname + '/ui-' + tag + '-perfil.png' });
  await p.evaluate(() => { const c = document.querySelector('#aClose'); if (c) c.click(); }); await p.waitForTimeout(600);
  /* 3 · una respuesta y su clic derecho */
  await p.fill('#inp', 'hola'); await p.keyboard.press('Enter'); await p.waitForTimeout(6000);
  if (W > 600){
    const m = await p.$('.m.bot.last .body'), r = await m.boundingBox();
    await p.mouse.click(r.x + 20, r.y + r.height / 2, { button:'right' }); await p.waitForTimeout(400);
    const items = await p.evaluate(() => [...document.querySelectorAll('.ctxm button span')].map(x => x.textContent));
    ok(tag + ' clic derecho en una respuesta: corto y con lo de esa respuesta', items.length <= 9 && items.includes('Copiar respuesta') && items.includes('Ajustes'), items);
    await p.keyboard.press('Escape');
  }
  /* 4 · menú ⋯ corto */
  await p.evaluate(() => document.querySelector('#moreBtn').click()); await p.waitForTimeout(400);
  const mm = await p.evaluate(() => [...document.querySelectorAll('.ctxm.mm button span')].map(x => x.textContent));
  ok(tag + ' menú ⋯: corto, sin «Instalar» ni «Qué hay de nuevo», borrar al final', mm.length <= 8 && !mm.some(x => /Instalar|nuevo/.test(x)) && mm[mm.length - 1] === 'Borrar este chat', mm);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  /* 5 · Ajustes con 2 pestañas */
  await p.evaluate(() => SZ.cfgModal()); await p.waitForTimeout(900);
  const tabs = await p.evaluate(() => [...document.querySelectorAll('#cfgm [role=tab]')].map(x => x.textContent));
  await p.evaluate(() => document.querySelector('#cfgm [data-tab="ia"]').click()); await p.waitForTimeout(500);
  const ia = await p.evaluate(() => ({ vis:!document.querySelector('[data-pane="ia"]').hidden, mem:!!document.querySelector('#cfgm #szMem .memadd'), links:document.querySelectorAll('#cfgm .cfglk').length, rows:[...document.querySelectorAll('[data-pane="ia"] .cfgrow p')].map(x => x.firstChild.textContent) }));
  ok(tag + ' Ajustes: «Página» e «IAs y memoria» (memoria, cómo responden y tus IAs)', tabs.join('|') === 'Página|IAs y memoria' && ia.vis && ia.mem && ia.links >= 3 && ia.rows.includes('Respuestas cortas'), { tabs, ia });
  await p.evaluate(() => { const i = document.querySelector('#cfgm .memadd input'); i.value = 'Me llamo Ana'; document.querySelector('#cfgm .memadd button').click(); }); await p.waitForTimeout(300);
  await p.evaluate(() => { const s = document.querySelector('#cfgm .cfgsw[data-k="saver"]'); s.click(); document.querySelector('#cfgOk').click(); }); await p.waitForTimeout(900);
  const after = await p.evaluate(() => ({ mem:SZ.state.mem.items.map(x => x.text), saver:SZ.state.sx.saver, chip:(document.querySelector('#onChips') || {}).textContent || '' }));
  ok(tag + ' memoria desde Ajustes y «Respuestas cortas» se ve como chip en la caja', after.mem.includes('Me llamo Ana') && after.saver === true && /Cortas/.test(after.chip), after);
  await p.evaluate(() => document.querySelector('#onChips [data-off="saver"]').click()); await p.waitForTimeout(300);
  ok(tag + ' el chip se apaga con un toque', await p.evaluate(() => !SZ.state.sx.saver));
  /* 6 · «+» trae todo */
  await p.evaluate(() => document.querySelector('#attachBtn').click()); await p.waitForTimeout(400);
  const am = await p.evaluate(() => [...document.querySelectorAll('#attMenu button')].filter(x => x.getClientRects().length).map(x => x.dataset.att));
  ok(tag + ' el «+» trae archivos, crear imagen, internet y respuestas cortas', ['file', 'mkimg', 'web', 'saver'].every(k => am.includes(k)), am);
  await p.evaluate(() => document.querySelector('[data-att="web"]').click()); await p.waitForTimeout(400);
  ok(tag + ' internet encendido se ve como chip', await p.evaluate(() => /Internet/.test(document.querySelector('#onChips').textContent)));
  /* 7 · sin instalación */
  const inst = await p.evaluate(async () => ({ man:!!document.querySelector('link[rel=manifest]'), sw:(await navigator.serviceWorker.getRegistrations()).length }));
  ok(tag + ' la instalación está quitada (sin manifest ni service worker)', !inst.man && inst.sw === 0, inst);
  ok(tag + ' sin errores', !errs.length, errs);
  await b.close();
  /* 8 · «!» de novedades: una vez por versión */
  ({ b, p, errs } = await open({ w:W, h:H, state:{ keys:{} }, init:"localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}));if(!sessionStorage.getItem('x')){sessionStorage.setItem('x','1');localStorage.setItem('synthz:newv','2.1')}", wait:5500 }));
  const bang = await p.evaluate(() => ({ bang:!!document.querySelector('#szBot .nwbang'), modal:!!document.querySelector('#szNew') }));
  ok(tag + ' hay novedades: sale un «!» sobre SynthonIA (no se abre sola)', bang.bang && !bang.modal, bang);
  await p.screenshot({ path:__dirname + '/ui-' + tag + '-bang.png' });
  await p.evaluate(() => document.querySelector('#szBot .nwbang').click()); await p.waitForTimeout(1200);
  const nw = await p.evaluate(() => (document.querySelector('#szNew') || {}).textContent || '');
  ok(tag + ' al tocar el «!» SynthonIA cuenta lo nuevo', /Qué hay de nuevo/.test(nw) && /renovó/.test(nw), nw.slice(0, 100));
  /* la boca habla mientras escribe */
  const talk = await p.evaluate(async () => { for (let i = 0; i < 30; i++){ const g = document.querySelector('#szNew .ftalk'); if (g && g.style.opacity === '1') return true; await new Promise(o => setTimeout(o, 60)); } return false; });
  ok(tag + ' SynthonIA mueve la boca al hablar', talk);
  await p.evaluate(() => document.querySelector('#szNew [data-close]').click()); await p.waitForTimeout(600);
  await p.reload(); await p.waitForTimeout(5500);
  ok(tag + ' ya visto: el «!» no vuelve hasta la próxima versión', await p.evaluate(() => !document.querySelector('#szBot .nwbang')));
  ok(tag + ' sin errores (2)', !errs.length, errs);
  await b.close();
})();
