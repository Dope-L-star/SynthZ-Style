const { open } = require('./h.js');
const D = '/home/claude/t/v15/';
(async () => {
  const { b, p, errs } = await open({ page:'index.html', wait:8000 });
  await p.screenshot({ path:D + 'i1.png' });
  await p.click('#railTog'); await p.waitForTimeout(450); await p.screenshot({ path:D + 'i2-volando.png' });
  await p.waitForTimeout(1100); await p.screenshot({ path:D + 'i3-abierta.png' });
  await p.click('#railTog'); await p.waitForTimeout(420); await p.screenshot({ path:D + 'i4-volviendo.png' });
  await p.waitForTimeout(1100); await p.screenshot({ path:D + 'i5-cerrada.png' });
  console.log('fantasmas que quedaron:', await p.$$eval('.navfly', x => x.length), '| railup:', await p.evaluate(() => document.body.classList.contains('railup')));
  console.log('ERRORS', JSON.stringify(errs)); await b.close();
})();
