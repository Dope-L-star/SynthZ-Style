const { open } = require('../v15/h.js');
(async () => {
  const W = +process.argv[2] || 1440;
  const { b, p, errs } = await open({ w:W, h:W < 600 ? 844 : 900, page:'index.html', init:"sessionStorage.setItem('synthz:intro','1');localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never'}))", wait:4000 });
  const bb = await p.evaluate(() => { const e = document.querySelector('#startBtn'); const r = e.getBoundingClientRect(); return { x:r.x, y:r.y, w:r.width, h:r.height, html:e.outerHTML.slice(0, 600) }; });
  console.log(JSON.stringify(bb));
  await p.waitForTimeout(4000);
  const clip = { x:Math.max(0, bb.x - 60), y:Math.max(0, bb.y - 50), width:Math.min(W - Math.max(0, bb.x - 60), bb.w + 120), height:bb.h + 100 };
  await p.screenshot({ path:__dirname + '/btn-0.png', clip });
  await p.mouse.move(bb.x + bb.w / 2, bb.y + bb.h / 2);
  for (const t of [300, 900, 2500]){ await p.waitForTimeout(t); await p.screenshot({ path:__dirname + '/btn-h' + t + '.png', clip }); }
  console.log(await p.evaluate(() => { const c = document.querySelector('.cur-hov, #cur .hov, [class*=cur-hov]'); return c ? c.outerHTML.slice(0, 900) : 'sin clon'; }));
  console.log(errs);
  await b.close();
})();
