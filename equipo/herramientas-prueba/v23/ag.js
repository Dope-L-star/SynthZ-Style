const { open } = require('../v15/h.js');
(async () => {
  for (const W of [390, 1440]){
    const tag = W < 600 ? 'm' : 'd';
    let { b, p, errs } = await open({ w:W, h:W < 600 ? 844 : 900, page:'chat.html', state:{ agent:true }, wait:3500 });
    await p.screenshot({ path:tag + '-ag0.png' });
    await p.fill('#inp', 'Dame 3 ideas para un regalo'); await p.keyboard.press('Enter'); await p.waitForTimeout(6000);
    await p.screenshot({ path:tag + '-ag1.png' });
    if (W < 600){ await p.click('#tabbar [data-tab="chats"]').catch(() => {}); await p.waitForTimeout(900); await p.screenshot({ path:tag + '-ag2.png' }); }
    console.log(tag, errs); await b.close();
  }
})();
