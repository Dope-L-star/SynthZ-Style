const { open } = require('./v15/h.js');
(async () => {
  let { b, p } = await open({ page:'index.html', w:1440, h:900, wait:3000 });
  await p.keyboard.press('Escape'); await p.waitForTimeout(8000);
  console.log(await p.evaluate(() => [...document.body.children].filter(e => e.getClientRects().length && getComputedStyle(e).position === 'fixed').map(e => e.id || e.className).join(' | ')));
  console.log(await p.evaluate(() => [...document.querySelectorAll('[data-key]')].filter(e => e.getClientRects().length).length));
  await p.evaluate(() => scrollTo(0, document.querySelector('#conectar').getBoundingClientRect().top + scrollY - 40)); await p.waitForTimeout(4000);
  await p.screenshot({ path:'/tmp/k-con.png' });
  await p.evaluate(() => scrollTo(0, document.querySelector('#consumo').getBoundingClientRect().top + scrollY - 40)); await p.waitForTimeout(4000);
  await p.screenshot({ path:'/tmp/k-uso.png' });
  await b.close();
})();
