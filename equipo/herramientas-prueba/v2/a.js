const { open } = require('../v15/h.js');
const B = 'http://localhost:8765/api/';
(async () => {
  const r = await fetch(B + 'auth', { method:'POST', headers:{ 'content-type':'application/json', 'x-forwarded-for':'7.7.7.' + Math.floor(Math.random()*200) }, body:JSON.stringify({ mode:'signup', user:'probador' + Date.now().toString(36).slice(-4), pass:'clave-larga-123' }) });
  const d = await r.json();
  const { b, p, errs } = await open({ w:1440, h:900, init:"localStorage.setItem('synthz:sess'," + JSON.stringify(d.token) + ");" });
  await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelector('#accBtn').click()); await p.waitForTimeout(1300);
  await p.screenshot({ path:'v2/acc.png' });
  await p.evaluate(() => document.querySelector('#aClose').click()); await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector('#cPick').click()); await p.waitForTimeout(1000);
  await p.evaluate(() => { document.querySelector('#pMore').open = true; }); await p.waitForTimeout(900);
  await p.screenshot({ path:'v2/pick.png' });
  const g = await p.evaluate(() => { const s = document.querySelector('#side').getBoundingClientRect(), f = document.querySelector('.pfoot').getBoundingClientRect(); return { side:[s.top|0, s.bottom|0], foot:[f.top|0, f.bottom|0], greet: document.querySelector('.greet') && document.querySelector('.greet').textContent }; });
  console.log(JSON.stringify(g), errs);
  await b.close();
})();
