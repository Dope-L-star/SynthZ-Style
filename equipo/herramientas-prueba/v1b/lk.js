const { open } = require('../v15/h.js');
(async () => {
  for (const [w, h, tag] of [[1440, 900, 'd'], [390, 844, 'm']]){
    const { b, p, errs } = await open({ w, h, state:{ keys:{} }, init:"localStorage.setItem('mockPuter','0');" });
    await p.waitForTimeout(800);
    const st = await p.evaluate(() => ({ locked:document.body.classList.contains('locked'), ro:document.querySelector('#inp').readOnly, card:!document.querySelector('#lockCard').hidden, pick:!!document.querySelector('#cPick') && document.querySelector('#cPick').getClientRects().length }));
    console.log(tag, JSON.stringify(st));
    await p.screenshot({ path:`v1b/${tag}-lk1.png` });
    await p.click('#inp', { force:true }); await p.keyboard.type('hola'); 
    console.log(tag, 'value after typing:', JSON.stringify(await p.$eval('#inp', e => e.value)));
    // random clicks in empty space
    for (let i = 0; i < 6; i++){ await p.mouse.click(100 + i * 37 % (w - 200), 200 + (i * 91) % (h - 400)); await p.waitForTimeout(120); }
    await p.waitForTimeout(1200); await p.screenshot({ path:`v1b/${tag}-lk2.png` });
    await p.waitForTimeout(3500); await p.screenshot({ path:`v1b/${tag}-lk3.png` });
    await p.waitForTimeout(6000); await p.screenshot({ path:`v1b/${tag}-lk4.png` });
    const q = await p.$('#szWorry [data-wq="0"]'); if (q){ await q.click(); await p.waitForTimeout(2500); await p.screenshot({ path:`v1b/${tag}-lk5.png` }); }
    await p.click('#szWorry [data-w="x"]').catch(e => console.log('no x'));
    await p.waitForTimeout(800);
    await p.click('[data-lk="pu"]'); await p.waitForTimeout(1500);
    console.log(tag, 'after puter:', JSON.stringify(await p.evaluate(() => ({ locked:document.body.classList.contains('locked'), ro:document.querySelector('#inp').readOnly }))));
    await p.screenshot({ path:`v1b/${tag}-lk6.png` });
    console.log(tag, errs);
    await b.close();
  }
})();
