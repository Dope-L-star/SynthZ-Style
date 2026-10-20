const { open } = require('../v15/h.js');
(async () => {
  const pg = process.argv[2] || 'index.html';
  const { b, p } = await open({ w:1280, h:800, page:pg, wait:pg === 'index.html' ? 8000 : 3500, init:"sessionStorage.setItem('synthz:intro','1')" });
  const it = (await p.$$('#rail .rbtn[data-sec], #rail [data-r]'))[1]; const bb = await it.boundingBox();
  await p.mouse.move(bb.x + 25, bb.y + bb.height / 2, { steps:5 }); await p.waitForTimeout(300);
  await p.click('#railTog'); await p.mouse.move(bb.x + 40, bb.y + bb.height / 2, { steps:3 }); await p.waitForTimeout(2600);
  await p.screenshot({ path:'/home/claude/t/v1b/r3-' + pg.replace('.html', '') + '.png', clip:{ x:0, y:0, width:420, height:300 } });
  await b.close();
})();
