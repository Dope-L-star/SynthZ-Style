const { open } = require('./v15/h.js');
(async () => {
  let { b, p } = await open({ w:1920, h:900, state:{ keys:{} }, wait:4000 });
  await p.evaluate(() => (document.querySelector('#cPick') || document.querySelector('#curChip')).click()); await p.waitForTimeout(1200);
  await p.evaluate(() => document.querySelector('#pLupa') && document.querySelector('#pLupa').click()); await p.waitForTimeout(1200);
  const r = await p.evaluate(() => { const it = [...document.querySelectorAll('#mlist .mi')][2].getBoundingClientRect(); return [it.x + it.width / 2, it.y + it.height / 2]; });
  await p.mouse.move(r[0], r[1], { steps:8 }); await p.waitForTimeout(800);
  const info = await p.evaluate(() => { const av = [...document.querySelectorAll('#mlist .mi')][2].querySelector('.av').getBoundingClientRect(); const x = av.left + 16, y = av.bottom + 8;
    return { av:[av.left, av.bottom], els:document.elementsFromPoint(x, y).slice(0, 6).map(e => e.tagName + '#' + e.id + '.' + String(e.className).slice(0, 40)) }; });
  console.log(JSON.stringify(info));
  await p.screenshot({ path:'/tmp/dot.png', clip:{ x:r[0] - 500, y:r[1] - 60, width:1000, height:120 } });
  await b.close();
})();
