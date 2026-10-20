const { open } = require('../v15/h.js');
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 220) : ''));
(async () => {
  for (const W of [1280, 390]){
    const tag = W < 600 ? 'm' : 'd';
    const { b, p, errs } = await open({ w:W, h:W < 600 ? 844 : 800, page:'chat.html', state:{ keys:{} }, init:"if(!localStorage.getItem('synthz:cfg'))localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}))", wait:4500 });
    await p.evaluate(() => { window.SynthFlowTopics(['extras']); }); await p.waitForTimeout(3200);
    const says = [];
    for (let i = 0; i < 3; i++){
      says.push(await p.evaluate(() => (document.querySelector('#szSay.on p') || {}).textContent || ''));
      if (i === 1) await p.screenshot({ path:__dirname + '/extras-' + tag + '.png' });
      await p.evaluate(() => { const b = document.querySelector('#szSay.on [data-sb]'); if (b) b.click(); }); await p.waitForTimeout(2600);
    }
    ok(tag + ' guía «Internet y memoria» en 3 pasos', /internet/i.test(says[0]) && /IAs y memoria/.test(says[1]) && /presentación/.test(says[2]), says);
    ok(tag + ' termina', await p.evaluate(() => !window.SynthFlowGuide.on()));
    ok(tag + ' sin errores', !errs.length, errs);
    await b.close();
  }
})();
