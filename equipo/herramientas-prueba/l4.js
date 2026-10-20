const { open } = require('./v15/h.js');
(async () => {
  let { b, p } = await open({ w:1440, h:900, state:{ keys:{} }, wait:4000 });
  await p.evaluate(() => (document.querySelector('#cPick') || document.querySelector('#curChip')).click()); await p.waitForTimeout(1200);
  await p.evaluate(() => document.querySelector('#pLupa').click()); await p.waitForTimeout(1200);
  const box = await p.evaluate(() => { const r = [...document.querySelectorAll('#mlist .mi')][3].querySelector('[data-use]').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  await p.mouse.move(box[0], box[1]); await p.waitForTimeout(300); await p.mouse.down(); await p.mouse.up();
  for (let i = 0; i < 6; i++){ await p.waitForTimeout(150); await p.screenshot({ path:'/tmp/l4-' + i + '.png' }); }
  await p.waitForTimeout(1500); await p.screenshot({ path:'/tmp/l4-9.png' });
  await b.close();
})();
