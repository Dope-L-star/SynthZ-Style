const { open } = require('../v15/h.js');
const D = '/home/claude/t/v1b/';
(async () => {
  const W = +process.argv[2] || 1440, H = +process.argv[3] || 900, tag = process.argv[4] || 'd';
  const { b, p, errs } = await open({ w:W, h:H });
  await p.waitForTimeout(1500);
  await p.screenshot({ path:D + tag + '-fr1.png' });
  await p.click('[data-topics-more]'); await p.waitForTimeout(250); await p.screenshot({ path:D + tag + '-fr2.png' }); await p.waitForTimeout(800);
  await p.click('.tchip[data-topic="marketing"]'); await p.waitForTimeout(900); await p.screenshot({ path:D + tag + '-fr3.png' });
  await p.fill('#inp', 'Hola, dame 3 ideas'); await p.keyboard.press('Enter'); await p.waitForTimeout(3500);
  await p.screenshot({ path:D + tag + '-fr4.png' });
  console.log('tras enviar:', await p.evaluate(() => ({ fresh:document.body.classList.contains('fresh'), compIn:document.querySelector('#composer').parentElement.className, msgs:document.querySelectorAll('.m').length })));
  console.log('ERRORS', JSON.stringify(errs)); await b.close();
})();
