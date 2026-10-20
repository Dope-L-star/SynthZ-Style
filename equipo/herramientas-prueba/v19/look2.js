const { open } = require('../v15/h.js');
(async () => {
  for (const [W, H, tag] of [[1440, 900, 'd'], [390, 844, 'm']]){
    const { b, p } = await open({ w:W, h:H, page:'chat.html', state:{ keys:{} }, init:"localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}))", wait:5000 });
    await p.screenshot({ path:__dirname + '/e-' + tag + '-vacio.png' });
    if (tag === 'm'){ await p.fill('#inp', 'hola'); await p.keyboard.press('Enter'); await p.waitForTimeout(6000); await p.screenshot({ path:__dirname + '/e-m-resp.png' }); }
    await b.close();
  }
})();
