const { open } = require('./v15/h.js');
(async () => {
  for (const [w, h, tag] of [[1440, 900, 'pc'], [390, 844, 'mov']]){
    let { b, p, errs } = await open({ page:'index.html', w, h, wait:3000 });
    await p.keyboard.press('Escape'); await p.waitForTimeout(9000);
    await p.screenshot({ path:'/tmp/v-' + tag + '-index.png', fullPage:false });
    await p.evaluate(() => scrollTo(0, innerHeight * 1.2)); await p.waitForTimeout(1500);
    await p.screenshot({ path:'/tmp/v-' + tag + '-index2.png' });
    await p.goto('http://localhost:8765/chat.html'); await p.waitForTimeout(4000);
    await p.fill('#inp', 'Explícame qué es una IA'); await p.keyboard.press('Enter'); await p.waitForTimeout(4500);
    await p.screenshot({ path:'/tmp/v-' + tag + '-chat.png' });
    await p.goto('http://localhost:8765/pulsem.html'); await p.waitForTimeout(3000);
    await p.screenshot({ path:'/tmp/v-' + tag + '-pulsem.png' });
    console.log(tag, JSON.stringify(errs));
    await b.close();
  }
})();
