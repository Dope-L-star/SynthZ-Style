const { open } = require('../v15/h.js');
(async () => {
  for (const [w, h, tag] of [[1440, 900, 'd'], [390, 844, 'm']]){
  const { b, p, errs } = await open({ w, h, page:'chat.html?guia=1', wait:1500 });
  const clickSay = async () => { await p.waitForSelector('#szSay.on [data-sb]'); await p.waitForTimeout(500); await p.evaluate(() => document.querySelector('#szSay.on [data-sb]').click()); };
  await clickSay();
  await p.waitForSelector('#szgPanel.on [data-gt]'); await p.waitForTimeout(600);
  await p.evaluate(() => ['escribir', 'codigo'].forEach(k => document.querySelector('#szgPanel [data-gt="' + k + '"]').click()));
  await p.waitForTimeout(2500); await p.evaluate(() => document.querySelector('#szgPanel [data-gnext]').click());
  try{ await p.waitForSelector('#szgPanel.on [data-gback]', { timeout:15000 }); }catch(e){ await p.screenshot({ path:'v1b/'+tag+'-gbx.png' }); console.log(await p.evaluate(() => document.querySelector('#szgPanel') && document.querySelector('#szgPanel').outerHTML.slice(0,300)), errs); throw e; } await p.waitForTimeout(900);
  await p.screenshot({ path:`v1b/${tag}-gb1.png` });
  await p.evaluate(() => document.querySelector('#szgPanel [data-gback]').click());
  await p.waitForTimeout(160); await p.screenshot({ path:`v1b/${tag}-gb2.png` });
  await p.waitForSelector('#szgPanel.on [data-gt]'); await p.waitForTimeout(700);
  const r = await p.evaluate(() => ({ rev:document.querySelector('#szgPanel').classList.contains('rev'), pressed:[...document.querySelectorAll('#szgPanel [data-gt][aria-pressed="true"]')].map(b => b.dataset.gt), next:!document.querySelector('#szgPanel [data-gnext]').disabled, count:document.querySelector('#szgPanel .gp-n').textContent, face:document.querySelector('.gp-say .sf svg') && document.querySelector('.gp-say .sf svg').getBoundingClientRect().width }));
  console.log(tag, JSON.stringify(r));
  await p.screenshot({ path:`v1b/${tag}-gb3.png` });
  await p.waitForTimeout(2500); await p.evaluate(() => document.querySelector('#szgPanel [data-gnext]').click());
  await p.waitForSelector('#szgPanel.on [data-gback]', { timeout:15000 });
  console.log(tag, 'back to step2 ok', errs);
  await b.close();
  }
})();
