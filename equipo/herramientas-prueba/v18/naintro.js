const { open } = require('../v15/h.js');
(async () => {
  const W = +process.argv[2] || 1440, tag = W < 600 ? 'm' : 'd', pg = process.argv[3] || 'index.html';
  const cfg = { v:2, perf:'visual', intro:'always', sound:false, cursor:true, smooth:true, favAnim:true, bg:true, glass:true, anim:false };
  const { b, p, errs } = await open({ w:W, h:W < 600 ? 844 : 900, page:pg, state:{ keys:{} }, init:"localStorage.setItem('synthz:cfg'," + JSON.stringify(JSON.stringify(cfg)) + ")", wait:300 });
  let last = 0; for (const t of [800, 2000, 4000, 7000, 11000]){ await p.waitForTimeout(t - last); last = t; await p.screenshot({ path:__dirname + '/ni-' + tag + '-' + pg[0] + '-' + t + '.png' }); }
  console.log(JSON.stringify(errs));
  await b.close();
})();
