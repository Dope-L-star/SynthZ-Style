/* v1.9: en la guía, tocar lo que señala SynthonIA → «¡Muy bien!» y se cierra lo que se abrió */
const { open } = require('../v15/h.js');
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 260) : ''));
(async () => {
  const W = +process.argv[2] || 1280;
  const { b, p, errs } = await open({ w:W, h:W < 600 ? 844 : 800, page:'chat.html', state:{ keys:{} }, init:"if(!localStorage.getItem('synthz:cfg'))localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}))", wait:4500 });
  p.evaluate(() => window.SynthFlowGuide.run()).catch(() => {});
  const next = async () => { for (let i = 0; i < 40; i++){ const n = await p.evaluate(() => { const b = document.querySelector('#szgPanel.on [data-gnext]'); if (b){ b.click(); return 1; } return 0; }); if (n) return; await p.waitForTimeout(300); } };
  /* avanza hasta el paso 3 (señala «elegir IA») tocando «Siguiente»/«Empezar» */
  let say = '';
  for (let i = 0; i < 120; i++){
    say = await p.evaluate(() => (document.querySelector('#szSay.on .st p') || {}).textContent || '');
    if (/eliges con qué IA/.test(say)) break;
    await p.evaluate(() => { const t = document.querySelector('#szgPanel.on [data-gt]'); if (t && !document.querySelector('#szgPanel.on [data-gt][aria-pressed="true"]')) t.click(); const g = document.querySelector('#szgPanel.on [data-gnext]'); if (g){ g.click(); return; } const s = document.querySelector('#szSay.on [data-sb]'); if (s) s.click(); });
    await p.waitForTimeout(700);
  }
  ok('la guía señala «Aquí eliges con qué IA hablas»', /eliges con qué IA/.test(say), say);
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const t = document.querySelector('#cPick') && document.querySelector('#cPick').getClientRects().length ? document.querySelector('#cPick') : document.querySelector('#curChip'); t.click(); });
  await p.waitForTimeout(1200);
  const mid = await p.evaluate(() => ({ say:(document.querySelector('#szSay.on .st p') || {}).textContent, side:document.querySelector('#side').classList.contains('open') }));
  ok('al tocarlo: «¡Muy bien, ya aprendiste!»', /Muy bien|aprendiste/.test(mid.say || ''), mid);
  await p.evaluate(() => { const b = document.querySelector('#szSay.on [data-sb]'); if (b) b.click(); }); await p.waitForTimeout(1500);
  const after = await p.evaluate(() => ({ side:document.querySelector('#side').classList.contains('open'), say:(document.querySelector('#szSay.on .st p') || {}).textContent }));
  ok('y se cerró la ventana que se abrió; sigue con lo siguiente', !after.side && /sumas otra IA/.test(after.say || ''), after);
  await p.screenshot({ path:__dirname + '/gu-1.png' });
  /* paso «sumar otra IA»: lo toca, se abre comparar; luego «Siguiente» → se cierra */
  await p.waitForTimeout(1200);
  await p.evaluate(() => { const t = document.querySelector('#cCmp') && document.querySelector('#cCmp').getClientRects().length ? document.querySelector('#cCmp') : document.querySelector('#pickRow [data-add]'); t.click(); });
  await p.waitForTimeout(1200);
  await p.evaluate(() => { const b = document.querySelector('#szSay.on [data-sb]'); if (b) b.click(); }); await p.waitForTimeout(1500);
  const a2 = await p.evaluate(() => ({ side:document.querySelector('#side').classList.contains('open'), say:(document.querySelector('#szSay.on .st p') || {}).textContent }));
  ok('comparar abierto por el usuario se cierra y la guía sigue sin quedar tapada', !a2.side && /límite/.test(a2.say || ''), a2);
  await p.screenshot({ path:__dirname + '/gu-2.png' });
  await p.evaluate(() => window.SynthFlowGuide.end());
  ok('sin errores', !errs.length, errs);
  await b.close();
})();
