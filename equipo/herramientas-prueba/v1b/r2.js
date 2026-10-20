const { open } = require('../v15/h.js');
(async () => {
  const { b, p } = await open({ w:1280, h:800, page:'index.html', wait:8000, init:"sessionStorage.setItem('synthz:intro','1')" });
  await p.click('#railTog'); await p.waitForTimeout(3000); console.log(await p.evaluate(() => document.querySelector('#rail').className + ' | ' + document.querySelectorAll('.navfly').length));
  console.log(await p.evaluate(() => [...document.querySelectorAll('#rail .rbtn[data-sec] .rl')].map(e => { const c = getComputedStyle(e); return e.className + ' ' + e.textContent + ' op=' + c.opacity + ' mw=' + c.maxWidth + ' vis=' + c.visibility; }).join('\n')));
  const it = (await p.$$('#rail .rbtn[data-sec]'))[1]; const bb = await it.boundingBox();
  await p.mouse.move(bb.x + 40, bb.y + bb.height / 2, { steps:8 }); await p.waitForTimeout(900);
  console.log(await p.evaluate(() => { const c = document.querySelector('#cl'); return c.innerHTML.slice(0, 1500); }));
  await b.close();
})();
