const { open } = require('./v15/h.js');
(async () => {
  for (const [w, h, tag] of [[1440, 900, 'pc'], [390, 844, 'mov']]){
    let { b, p, errs } = await open({ page:'index.html', w, h, wait:3000 });
    await p.keyboard.press('Escape'); await p.waitForTimeout(11000);
    await p.screenshot({ path:'/tmp/m-' + tag + '-hero.png' });
    await p.evaluate(() => scrollTo(0, document.querySelector('#como').getBoundingClientRect().top + scrollY - 40)); await p.waitForTimeout(4500);
    await p.screenshot({ path:'/tmp/m-' + tag + '-como.png' });
    await p.goto('http://localhost:8765/chat.html'); await p.waitForTimeout(4000);
    if (tag === 'pc'){ await p.evaluate(() => document.querySelector('#railTog').click()); await p.waitForTimeout(900); }
    else { await p.evaluate(() => document.querySelector('#tabbar [data-tab="chats"]').click()); await p.waitForTimeout(900); }
    await p.screenshot({ path:'/tmp/m-' + tag + '-chat.png' });
    console.log(tag, JSON.stringify(errs));
    await b.close();
  }
})();
