const { open } = require('../v15/h.js');
(async () => {
  const { b, p, errs } = await open({ w:1280, h:800, page:'chat.html', state:{ keys:{} }, init:"if(!localStorage.getItem('synthz:cfg'))localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}))", wait:4500 });
  p.evaluate(() => window.SynthFlowGuide.run()).catch(e => console.log('run err', e.message));
  for (let i = 0; i < 14; i++){
    await p.waitForTimeout(1200);
    const st = await p.evaluate(() => ({ g:window.SynthFlowGuide.on(), say:((document.querySelector('#szSay.on .st p') || {}).textContent || '').slice(0, 60), sb:[...document.querySelectorAll('#szSay.on [data-sb]')].map(x => x.textContent), panel:(document.querySelector('#szgPanel') || {}).className, btns:[...document.querySelectorAll('#szgPanel button')].map(x => (x.getAttribute('data-gnext') != null ? 'NEXT:' : '') + x.textContent.slice(0, 20)).slice(0, 8), hud:(document.querySelector('#szgHud .gh-t') || {}).textContent }));
    console.log(i, JSON.stringify(st));
    if (i === 3) await p.evaluate(() => { const g = document.querySelector('#szgPanel.on [data-gnext]'); if (g) g.click(); const s = document.querySelector('#szSay.on [data-sb]'); if (s) s.click(); });
  }
  console.log(errs); await b.close();
})();
