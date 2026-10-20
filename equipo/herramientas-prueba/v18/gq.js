/* v2.0: Guía rápida por temas, «¡Descubriste algo nuevo!», «Qué hay de nuevo» */
const { open } = require('../v15/h.js');
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 260) : ''));
(async () => {
  const W = +process.argv[2] || 1280, tag = W < 600 ? 'm' : 'd';
  let { b, p, errs } = await open({ w:W, h:W < 600 ? 844 : 800, page:'chat.html', state:{ keys:{} }, init:"if(!localStorage.getItem('synthz:cfg'))localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}));localStorage.setItem('synthz:newv','2.1')", wait:4500 });
  const gt = await p.evaluate(() => { const g = document.querySelector('#guideTop'); return g ? g.textContent.trim() : ''; });
  ok('el botón dice «Guía rápida»', /Guía rápida/.test(gt), gt);
  await p.evaluate(() => (document.querySelector('#guideTop').getClientRects().length ? document.querySelector('#guideTop') : document.querySelector('#helpBtn')).click()); await p.waitForTimeout(1600);
  const q = await p.evaluate(() => ({ say:(document.querySelector('#szGq .gq-say p') || {}).textContent, chips:document.querySelectorAll('#szGq .gq-c').length, full:!!document.querySelector('#szGq .gq-full') }));
  ok('SynthonIA pregunta «¿completa o qué quieres aprender?» con temas', /completa/.test(q.say || '') && q.chips >= 8 && q.full, q);
  await p.evaluate(() => { document.querySelector('#szGq [data-t="limite"]').click(); document.querySelector('#szGq [data-t="chat"]').click(); });
  const ord = await p.evaluate(() => [...document.querySelectorAll('#szGq .gq-c[aria-pressed="true"]')].map(b => b.dataset.t + ':' + b.querySelector('i').textContent));
  ok('se pueden combinar y quedan numerados en el orden que los tocas', JSON.stringify(ord.sort()) === JSON.stringify(['chat:2', 'limite:1']), ord);
  await p.screenshot({ path:__dirname + '/gq-' + tag + '-1.png' });
  await p.evaluate(() => document.querySelector('#szGq [data-gq="go"]').click()); await p.waitForTimeout(3500);
  const s1 = await p.evaluate(() => ({ hud:(document.querySelector('#szgHud .gh-t') || {}).textContent, say:(document.querySelector('#szSay.on .st p') || {}).textContent }));
  ok('primero muestra «Tu límite gratis»', /1 de 2 · Tu límite/.test(s1.hud || '') && /límite/.test(s1.say || ''), s1);
  await p.screenshot({ path:__dirname + '/gq-' + tag + '-2.png' });
  await p.evaluate(() => { const b = document.querySelector('#szSay.on [data-sb]'); if (b) b.click(); }); await p.waitForTimeout(2600);
  const s2 = await p.evaluate(() => ({ hud:(document.querySelector('#szgHud .gh-t') || {}).textContent, say:(document.querySelector('#szSay.on .st p') || {}).textContent }));
  ok('luego «Escribir y enviar»', /2 de 2 · Escribir/.test(s2.hud || '') && /escribes/.test(s2.say || ''), s2);
  for (let i = 0; i < 4; i++){ await p.evaluate(() => { const b = document.querySelector('#szSay.on [data-sb]'); if (b) b.click(); }); await p.waitForTimeout(2200); }
  ok('la guía termina', await p.evaluate(() => !window.SynthFlowGuide.on()));
  await p.waitForTimeout(2500);
  /* descubrir */
  await p.evaluate(() => { const t = document.querySelector('#cCmp') && document.querySelector('#cCmp').getClientRects().length ? document.querySelector('#cCmp') : document.querySelector('#pickRow [data-add]'); if (t) t.click(); }); await p.waitForTimeout(2200);
  const d = await p.evaluate(() => (document.querySelector('.szdisc') || {}).textContent || '');
  ok('«¡Descubriste algo nuevo!» al usar comparar por primera vez', /Descubriste algo nuevo/.test(d) && /Comparar/.test(d), d);
  await p.screenshot({ path:__dirname + '/gq-' + tag + '-3.png' });
  ok('sin errores', !errs.length, errs);
  await b.close();
  /* qué hay de nuevo */
  ({ b, p, errs } = await open({ w:W, h:W < 600 ? 844 : 800, page:'chat.html', state:{ keys:{} }, init:"if(!localStorage.getItem('synthz:cfg'))localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}));localStorage.setItem('synthz:newv','1.9')", wait:8000 }));
  await p.evaluate(() => { const x = document.querySelector('#szBot .nwbang'); if (x) x.click(); }); await p.waitForTimeout(1500);
  const nw = await p.evaluate(() => (document.querySelector('#szNew') || {}).textContent || '');
  ok('«Qué hay de nuevo» lo cuenta SynthonIA (una vez por versión)', /Qué hay de nuevo/.test(nw) && /renovó/.test(nw), nw.slice(0, 120));
  await p.screenshot({ path:__dirname + '/gq-' + tag + '-4.png' });
  ok('sin errores (2)', !errs.length, errs);
  await b.close();
  /* portada */
  ({ b, p, errs } = await open({ w:W, h:W < 600 ? 844 : 800, page:'index.html', init:"sessionStorage.setItem('synthz:intro','1');localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}))", wait:4500 }));
  await p.evaluate(() => document.querySelector('#helpBtn').click()); await p.waitForTimeout(1200);
  const ix = await p.evaluate(() => ({ portada:!!document.querySelector('#szGq [data-t="portada"]'), n:document.querySelectorAll('#szGq .gq-c').length }));
  ok('en la portada también, con «Esta página»', ix.portada && ix.n >= 9, ix);
  ok('sin errores (3)', !errs.length, errs);
  await b.close();
})();
