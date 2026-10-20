const { open } = require('../v15/h.js');
(async () => {
  const W = +process.argv[2] || 1440;
  const { b, p } = await open({ w:W, h:W < 600 ? 844 : 900, page:'chat.html', state:{ keys:{} }, init:"localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}))", wait:4500 });
  await p.evaluate(() => document.querySelector('#cPick').click()); await p.waitForTimeout(1300);
  console.log(JSON.stringify(await p.evaluate(() => ['#side', '#side .pf-l', '#side .pf-r', '#side .sin', '#side > *'].flatMap(s => [...document.querySelectorAll(s)].slice(0, 6).map(e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); return s + ' ' + (e.className || e.id).toString().slice(0, 30) + ' x' + Math.round(r.x) + ' y' + Math.round(r.y) + ' w' + Math.round(r.width) + ' h' + Math.round(r.height) + ' bg:' + c.backgroundColor + ' sh:' + c.boxShadow.slice(0, 60) + ' op:' + c.opacity + ' ' + c.transform.slice(0, 40); }))), null, 1));
  await b.close();
})();
