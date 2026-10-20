const { open } = require('../v15/h.js');
(async () => {
  const { b, p, errs } = await open({ w:1280, h:800, page:'index.html', wait:7000, init:"sessionStorage.setItem('synthz:intro','1')" });
  await p.click('#helpBtn'); await p.waitForTimeout(700);
  await p.evaluate(() => document.querySelector('#szGch [data-g="a"]').click());
  await p.waitForURL('**/chat.html*', { timeout:10000 });
  await p.waitForTimeout(5500);
  console.log('guía en SynthFlow:', await p.evaluate(() => ({ on:window.SynthFlowGuide.on(), say:(document.querySelector('#szSay.on .st p') || {}).textContent, url:location.href })));
  console.log('ERRORS', JSON.stringify(errs)); await b.close();
})();
