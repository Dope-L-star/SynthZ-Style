const { open } = require('../v15/h.js');
(async () => {
  const W = +process.argv[2] || 1440, anim = process.argv[3] !== 'noanim', tag = (W < 600 ? 'm' : 'd') + (anim ? '' : '-na');
  const cfg = { v:2, perf:'visual', intro:'never', sound:false, cursor:true, smooth:true, favAnim:true, bg:true, glass:true, anim };
  const { b, p, errs } = await open({ w:W, h:W < 600 ? 844 : 900, page:'chat.html', state:{ keys:{} }, init:"localStorage.setItem('synthz:cfg'," + JSON.stringify(JSON.stringify(cfg)) + ")", wait:4500 });
  await p.evaluate(() => (document.querySelector('#curChip') || document.querySelector('#cPick') || document.querySelector('.modelchip')).click());
  let last = 0; for (const t of [150, 400, 1200]){ await p.waitForTimeout(t - last); last = t; await p.screenshot({ path:__dirname + '/pk-' + tag + '-' + t + '.png' }); }
  console.log(JSON.stringify(errs));
  await b.close();
})();
