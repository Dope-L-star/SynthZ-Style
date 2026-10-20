const { open } = require('../v15/h.js');
(async () => {
  const W = +process.argv[2] || 1280, Hh = +process.argv[3] || 800, tag = process.argv[4] || 'ck';
  const { b, p, errs } = await open({ w:W, h:Hh, page:'index.html', wait:7000, init:"sessionStorage.setItem('synthz:intro','1')" });
  await p.clock.install();
  await p.evaluate(() => { window.__nav = null; const L = SZ.portalOut; });
  await p.route('**/chat.html', r => r.fulfill({ status:204, body:'' }));
  await p.evaluate(() => SZ.portalOut('chat.html'));
  const T = [400, 900, 1300, 1700, 1900, 2050, 2200, 2350, 2500, 2650, 2800, 2950];
  let last = 0;
  for (const t of T){ await p.clock.runFor(t - last); last = t; await p.screenshot({ path:'/home/claude/t/v16/' + tag + '-' + t + '.png' }); }
  console.log('ERRORS', JSON.stringify(errs)); await b.close();
})();
