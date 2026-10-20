const { open } = require('./v15/h.js');
(async () => {
  let { b, p } = await open({ page:'pulsem.html', w:390, h:844, wait:3000 });
  console.log(await p.evaluate(() => { const r = document.querySelector('.gate .tcard').getBoundingClientRect(); return [r.left, r.right, document.documentElement.scrollWidth]; }));
  await p.screenshot({ path:'/tmp/v14-p.png' });
  await p.goto('http://localhost:8765/index.html'); await p.keyboard.press('Escape'); await p.waitForTimeout(10000);
  console.log(await p.evaluate(() => [...document.querySelectorAll('#nav > *, #nav .navr > *')].map(e => { const r = e.getBoundingClientRect(); return (e.id || e.className).toString().slice(0,12) + ':' + Math.round(r.left) + '-' + Math.round(r.right); }).join(' ')));
  await p.screenshot({ path:'/tmp/v14-i.png', clip:{ x:0, y:0, width:390, height:90 } });
  await b.close();
})();
