const { open } = require('../v15/h.js');
(async () => {
  const { b, p } = await open({ w:1440, h:900, page:'chat.html', state:{ keys:{} }, init:"localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}))", wait:4500 });
  await p.evaluate(() => document.querySelector('#cPick').click()); await p.waitForTimeout(1300);
  console.log(JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => { const c = getComputedStyle(e); return (c.backdropFilter && c.backdropFilter !== 'none') && c.visibility !== 'hidden' && +c.opacity > 0 && e.getBoundingClientRect().width > 300; }).map(e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); return (e.id || e.className).toString().slice(0, 30) + ' x' + Math.round(r.x) + ' w' + Math.round(r.width) + ' h' + Math.round(r.height) + ' bf:' + c.backdropFilter + ' bg:' + c.backgroundColor + ' z:' + c.zIndex; })), null, 1));
  await b.close();
})();
