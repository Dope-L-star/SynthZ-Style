const { open } = require('../v15/h.js');
(async () => {
  const W = +process.argv[2] || 390, tag = W < 600 ? 'm' : 'd';
  const { b, p, errs } = await open({ w:W, h:W < 600 ? 844 : 900, page:'index.html', wait:1500, init:"localStorage.removeItem('synthz:visited');localStorage.removeItem('synthz:tour');" });
  const sk = await p.$('text=Saltar'); if (sk) await sk.click().catch(() => {});
  await p.waitForSelector('#ptour', { timeout:20000 }).catch(() => {}); await p.waitForTimeout(1200);
  await p.screenshot({ path:tag + '-t0.png' });
  for (let i = 1; i < 14; i++){
    const n = await p.$('#ptour [data-next]'); if (!n) break;
    const t = await p.evaluate(() => document.querySelector('#ptour h3').textContent + ' | ' + document.querySelector('#ptour [data-next]').textContent);
    console.log(i, t);
    if (/Iniciar|Empezar/.test(t)){ await p.screenshot({ path:tag + '-tlast.png' }); await n.click({ force:true }); await p.waitForTimeout(1500); await p.screenshot({ path:tag + '-tauth.png' }); break; }
    await n.click({ force:true }); await p.waitForTimeout(1100);
  }
  console.log(errs);
  await b.close();
})();
