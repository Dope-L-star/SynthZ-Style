const { open } = require('../v15/h.js');
const D = '/home/claude/t/v16/';
(async () => {
  const W = +process.argv[2] || 1440, Hh = +process.argv[3] || 900, tag = process.argv[4] || 'pd';
  const { b, p, errs } = await open({ w:W, h:Hh, page:'index.html', wait:9000, init:"sessionStorage.setItem('synthz:intro','1')" });
  await p.evaluate(() => SZ.portalOut('chat.html'));
  const T = [250, 700, 1150, 1500, 1900, 2250, 2550, 2800, 3000];
  let last = 0;
  for (const t of T){ await p.waitForTimeout(t - last); last = t; try{ await p.screenshot({ path:D + tag + '-' + t + '.png' }); }catch(e){} }
  await p.waitForURL('**/chat.html', { timeout:8000 }).catch(() => {});
  const A = [80, 350, 700, 1100, 1800]; last = 0;
  for (const t of A){ await p.waitForTimeout(t - last); last = t; await p.screenshot({ path:D + tag + '-llega-' + t + '.png' }); }
  console.log('url', p.url(), 'ERRORS', JSON.stringify(errs));
  await b.close();
})();
