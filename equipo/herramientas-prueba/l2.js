const { open } = require('./v15/h.js');
(async () => {
  for (const [w, h, tag] of [[1440, 900, 'pc'], [390, 844, 'mov']]){
    let { b, p } = await open({ page:'index.html', w, h, wait:3000 });
    await p.keyboard.press('Escape'); await p.waitForTimeout(9000);
    await p.screenshot({ path:'/tmp/l2-' + tag + '-index.png', clip:{ x:0, y:0, width:w, height:Math.min(h, 420) } });
    await p.goto('http://localhost:8765/chat.html'); await p.waitForTimeout(4000);
    await p.screenshot({ path:'/tmp/l2-' + tag + '-chat.png', clip:{ x:0, y:0, width:w, height:Math.min(h, 420) } });
    await b.close();
  }
})();
