const { open } = require('../v15/h.js');
(async () => {
  const cfg = { v:2, perf:'visual', intro:'never', sound:false, cursor:true, smooth:true, favAnim:true, bg:true, glass:true, anim:false };
  const { b, p, errs } = await open({ w:1440, h:900, page:'index.html', state:{ keys:{} }, init:"sessionStorage.setItem('synthz:intro','1');localStorage.setItem('synthz:cfg'," + JSON.stringify(JSON.stringify(cfg)) + ")", wait:4500 });
  await p.evaluate(() => document.querySelector('#startBtn').click());
  let last = 0; for (const t of [100, 250, 400, 600, 900, 1400, 2200]){ await p.waitForTimeout(t - last); last = t; await p.screenshot({ path:__dirname + '/nc-' + t + '.png' }).catch(() => {}); console.log(t, p.url(), await p.evaluate(() => document.documentElement.className + ' | ' + [...document.body.children].filter(e => { const r = e.getBoundingClientRect(); return r.width > 1000 && getComputedStyle(e).position === 'fixed'; }).map(e => e.id || e.className).join(',')).catch(() => '-')); }
  await b.close();
})();
