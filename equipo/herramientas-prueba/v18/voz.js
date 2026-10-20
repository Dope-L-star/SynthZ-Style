const { open } = require('../v15/h.js');
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 300) : ''));
(async () => {
  const { b, p, errs } = await open({ w:1280, h:800, page:'chat.html', state:{ keys:{} }, init:"if(!localStorage.getItem('synthz:cfg'))localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}));localStorage.setItem('synthz:newv','2.0')", wait:4500 });
  await p.evaluate(() => { window.__said = []; speechSynthesis.speak = u => { window.__said.push({ t:u.text, pitch:u.pitch, rate:u.rate }); setTimeout(() => u.onend && u.onend(), 50); }; speechSynthesis.cancel = () => {}; });
  await p.evaluate(() => { const i = document.querySelector('#inp'); i.value = 'hola'; i.dispatchEvent(new Event('input', { bubbles:true })); document.querySelector('#sendBtn').click(); });
  await p.waitForTimeout(6000);
  const fam = await p.evaluate(() => { const m = [...document.querySelectorAll('.m.bot')].pop(); return m.dataset.brand; });
  await p.evaluate(() => [...document.querySelectorAll('[data-a="voice"]')].pop().click()); await p.waitForTimeout(400);
  const a = await p.evaluate(() => window.__said.slice());
  await p.evaluate(() => { window.__said = []; const m = [...document.querySelectorAll('.m.bot')].pop(); m.dataset.brand = 'mistral'; m.querySelector('[data-a="voice"]').click(); }); await p.waitForTimeout(400);
  const c = await p.evaluate(() => window.__said.slice());
  ok('«Escuchar» lee la respuesta en voz alta', a.length > 0 && /Respuesta|idea/i.test(a.map(x => x.t).join(' ')), { fam, a:a.slice(0, 2) });
  ok('cada familia suena distinto (GPT vs Mistral)', a[0] && c[0] && (a[0].pitch !== c[0].pitch || a[0].rate !== c[0].rate), { gpt:a[0] && [a[0].pitch, a[0].rate], mistral:c[0] && [c[0].pitch, c[0].rate] });
  ok('sin errores', !errs.length, errs);
  await b.close();
})();
