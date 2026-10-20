const { open } = require('../v15/h.js');
(async () => {
  const { b, p, errs } = await open({ w:1280, h:800, page:'chat.html', state:{ keys:{} }, init:"localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}))", wait:4500 });
  await p.evaluate(() => document.querySelector('#szBot').click()); await p.waitForTimeout(300);
  const shapes = [];
  for (let i = 0; i < 16; i++){
    shapes.push(await p.evaluate(() => { const e = document.querySelector('#szBot .ftalk ellipse'); return e ? (+e.getAttribute('rx')).toFixed(1) + 'x' + (+e.getAttribute('ry')).toFixed(1) + (e.parentNode.style.opacity === '1' ? '' : '(off)') : 'none'; }));
    if (i === 4 || i === 7) { const bb = await (await p.$('#szBot')).boundingBox(); await p.screenshot({ path:__dirname + '/lips-' + i + '.png', clip:{ x:bb.x - 330, y:bb.y - 260, width:420, height:340 } }); }
    await p.waitForTimeout(120);
  }
  console.log(shapes.join(' '));
  await p.waitForTimeout(5000);
  console.log('al final:', await p.evaluate(() => { const g = document.querySelector('#szBot .ftalk'); const m = document.querySelector('#szBot .fm'); return (g ? g.style.opacity : 'nog') + ' fm:' + (m ? m.style.opacity : '?'); }), errs);
  await b.close();
})();
