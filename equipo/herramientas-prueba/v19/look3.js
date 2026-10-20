const { open } = require('../v15/h.js');
(async () => {
  for (const [W, H, tag] of [[1440, 900, 'd'], [390, 844, 'm']]){
    const D = __dirname + '/l3-' + tag + '-';
    const { b, p, errs } = await open({ w:W, h:H, page:'chat.html', state:{ keys:{} }, init:"localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}));localStorage.setItem('synthz:newv','1.0')", wait:4500 });
    await p.fill('#inp', 'recuerda que me llamo Ana'); await p.keyboard.press('Enter'); await p.waitForTimeout(6500);
    await p.waitForTimeout(2000);
    console.log(tag, 'bang', await p.evaluate(() => !!document.querySelector('#szBot .nwbang')));
    await p.screenshot({ path:D + '1-chat.png' });
    if (tag === 'd'){
      const m = await p.$('.m.bot.last .body'); const r = await m.boundingBox(); await p.mouse.click(r.x + 30, r.y + r.height / 2, { button:'right' }); await p.waitForTimeout(500);
      await p.screenshot({ path:D + '2-clic.png' }); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    }
    await p.evaluate(() => document.querySelector('#moreBtn').click()); await p.waitForTimeout(500); await p.screenshot({ path:D + '3-menu.png' });
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    await p.evaluate(() => document.querySelector('#attachBtn').click()); await p.waitForTimeout(500); await p.screenshot({ path:D + '4-mas.png' });
    await p.evaluate(() => document.querySelector('[data-att="web"]').click()); await p.waitForTimeout(800); await p.screenshot({ path:D + '5-web.png' });
    await p.evaluate(() => SZ.cfgModal('ia')); await p.waitForTimeout(1000); await p.screenshot({ path:D + '6-ajustes-ia.png' });
    await p.keyboard.press('Escape'); await p.waitForTimeout(500);
    await p.evaluate(() => document.querySelector('#szBot .nwbang') && document.querySelector('#szBot .nwbang').click()); await p.waitForTimeout(1500); await p.screenshot({ path:D + '7-nuevo.png' });
    console.log(tag, 'errs', errs);
    await b.close();
  }
})();
