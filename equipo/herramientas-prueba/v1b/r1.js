const { open } = require('../v15/h.js');
(async () => {
  const pg = process.argv[2] || 'index.html';
  const { b, p, errs } = await open({ w:1280, h:800, page:pg, wait:pg === 'index.html' ? 8000 : 3500, init:"sessionStorage.setItem('synthz:intro','1')" });
  await p.click('#railTog'); await p.waitForTimeout(1200);
  const items = await p.$$('#rail .rbtn[data-sec], #rail [data-r]');
  const it = items[1]; const bb = await it.boundingBox();
  await p.mouse.move(bb.x + 40, bb.y + bb.height / 2, { steps:8 }); await p.waitForTimeout(900);
  await p.screenshot({ path:'/home/claude/t/v1b/r1-' + pg.replace('.html', '') + '.png', clip:{ x:0, y:0, width:420, height:300 } });
  console.log(JSON.stringify(await p.evaluate(() => { const g = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height), getComputedStyle(e).opacity]; }; return { cr:g('#cr'), cl:g('#cl'), html:document.documentElement.className }; })));
  await b.close();
})();
