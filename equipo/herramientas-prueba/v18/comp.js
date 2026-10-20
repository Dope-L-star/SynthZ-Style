const { open } = require('../v15/h.js');
(async () => {
  const { b, p } = await open({ w:1280, h:800, page:'chat.html', state:{ keys:{} }, init:"if(!localStorage.getItem('synthz:cfg'))localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}))", wait:4500 });
  await p.screenshot({ path:__dirname + '/comp-fresh.png', clip:{ x:340, y:480, width:940, height:220 } });
  await b.close();
})();
