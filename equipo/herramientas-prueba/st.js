const { open } = require('./v15/h.js');
(async () => {
  let { b, p, errs } = await open({ w:1920, h:900, state:{ keys:{} }, wait:4000 });
  await p.evaluate(() => (document.querySelector('#cPick') || document.querySelector('#curChip')).click()); await p.waitForTimeout(1200);
  await p.evaluate(() => document.querySelector('#pLupa') && document.querySelector('#pLupa').click()); await p.waitForTimeout(1200);
  const pos = sel => p.evaluate(s => { const e = [...document.querySelectorAll('#mlist .mi')][2].querySelector(s).getBoundingClientRect(); return [e.x + e.width / 2, e.y + e.height / 2]; }, sel);
  let s = await pos('.star'); await p.mouse.move(s[0], s[1], { steps:6 }); await p.waitForTimeout(500);
  await p.screenshot({ path:'/tmp/st1.png', clip:{ x:s[0] - 700, y:s[1] - 70, width:900, height:140 } });
  const top = await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e.tagName + '.' + e.className; }, s);
  await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(500);
  const fav = await p.evaluate(() => SZ.state.fav.length);
  s = await pos('.ckb'); await p.mouse.move(s[0], s[1], { steps:6 }); await p.waitForTimeout(500);
  await p.screenshot({ path:'/tmp/st2.png', clip:{ x:s[0] - 700, y:s[1] - 70, width:900, height:140 } });
  await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(500);
  const ck = await p.evaluate(() => [...document.querySelectorAll('#mlist [data-ck]')].filter(x => x.checked).length);
  console.log(JSON.stringify({ top, fav, ck, errs }));
  await b.close();
})();
