const { open } = require('../v15/h.js');
(async () => {
  for (const W of [1440, 390]){
    const tag = W < 600 ? 'm' : 'd';
    let { b, p, errs } = await open({ w:W, h:W < 600 ? 844 : 900, page:'chat.html', wait:3500 });
    if (W < 600){ await p.click('#tabbar [data-tab="chats"]'); await p.waitForTimeout(700); await p.click('#cSeg [data-v="agents"]', { force:true }); await p.waitForTimeout(600); await p.screenshot({ path:tag + '-ag2.png' }); await p.click('#chatsClose').catch(() => {}); }
    else await p.click('#railAgent');
    await p.waitForTimeout(1500); await p.screenshot({ path:tag + '-ag0.png' });
    await p.fill('#inp', 'Dame 3 ideas para un regalo'); await p.keyboard.press('Enter'); await p.waitForTimeout(2500);
    await p.screenshot({ path:tag + '-ag1a.png' });
    await p.waitForTimeout(6000);
    await p.screenshot({ path:tag + '-ag1.png' });
    console.log(tag, errs); await b.close();
  }
})();
