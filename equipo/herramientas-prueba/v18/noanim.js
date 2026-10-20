const { open } = require('../v15/h.js');
(async () => {
  const W = +process.argv[2] || 1440, tag = W < 600 ? 'm' : 'd';
  const cfg = { v:2, perf:'visual', intro:'never', sound:false, cursor:true, smooth:true, favAnim:true, bg:true, glass:true, anim:false };
  const { b, p, errs } = await open({ w:W, h:W < 600 ? 844 : 900, page:'index.html', state:{ keys:{} }, init:"sessionStorage.setItem('synthz:intro','1');localStorage.setItem('synthz:cfg'," + JSON.stringify(JSON.stringify(cfg)) + ")", wait:4500 });
  await p.screenshot({ path:__dirname + '/na-' + tag + '-1-index.png' });
  if (W >= 600){ await p.click('#railTog').catch(() => {}); await p.waitForTimeout(1200); await p.screenshot({ path:__dirname + '/na-' + tag + '-2-index-barra.png' }); await p.click('#railTog').catch(() => {}); await p.waitForTimeout(800); }
  await p.evaluate(() => document.querySelector('#startBtn').click());
  for (const t of [400, 900, 1600, 2600]){ await p.waitForTimeout(t === 400 ? 400 : t - [400, 900, 1600, 2600][[400, 900, 1600, 2600].indexOf(t) - 1]); await p.screenshot({ path:__dirname + '/na-' + tag + '-3-portal-' + t + '.png' }); }
  await p.waitForTimeout(3500);
  await p.screenshot({ path:__dirname + '/na-' + tag + '-4-chat.png' });
  if (W >= 600){ await p.click('#railTog').catch(() => {}); await p.waitForTimeout(1200); await p.screenshot({ path:__dirname + '/na-' + tag + '-5-chat-barra.png' }); }
  const r = await p.evaluate(() => [...document.querySelectorAll('.rword, .flw-w, img.zb, img.flwi')].map(e => (e.className.baseVal ?? e.className) + ':' + getComputedStyle(e).opacity + ':' + getComputedStyle(e).visibility + ':' + Math.round(e.getBoundingClientRect().width)));
  console.log(p.url(), JSON.stringify(r), JSON.stringify(errs));
  await b.close();
})();
