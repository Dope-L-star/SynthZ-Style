const { open } = require('../v15/h.js');
(async () => {
  const { b, p, errs } = await open({ w:1440, h:900, page:'index.html', wait:9000, init:"sessionStorage.setItem('synthz:intro','1')" });
  p.on('console', m => { if (!/ERR_FAILED/.test(m.text())) console.log('C', m.type(), m.text().slice(0, 200)); });
  p.on('framenavigated', f => { if (f === p.mainFrame()) console.log('NAV', Date.now() - t0, f.url()); });
  var t0 = Date.now();
  await p.evaluate(() => SZ.portalOut('chat.html'));
  for (const t of [300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700]){
    await p.waitForTimeout(300);
    const st = await p.evaluate(() => { const w = document.querySelector('.pfw'); return w ? getComputedStyle(w).opacity + ' ' + w.style.transform.slice(0, 50) + ' | ' + (document.querySelector('.pff').getAnimations().length) : 'none'; }).catch(e => 'x');
    console.log(Date.now() - t0, st);
    await p.screenshot({ path:'/home/claude/t/v16/q-' + t + '.png' }).catch(() => {});
  }
  await b.close();
})();
