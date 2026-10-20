const { open } = require('../v15/h.js');
(async () => {
  for (const [W, mode] of [[1440, 'simple'], [390, 'simple'], [1440, 'oceano'], [390, 'left']]){
    const tag = (W < 600 ? 'm' : 'd') + '-' + mode;
    const cfg = mode === 'simple' ? { ui:'simple' } : mode === 'oceano' ? { theme:'oceano' } : { nav:'left' };
    const init = "localStorage.setItem('synthz:cfg', JSON.stringify(Object.assign({v:2,perf:'visual',cursor:false,smooth:true,favAnim:true,bg:true,glass:true,anim:true,lite:1}, " + JSON.stringify(cfg) + ")));";
    const { b, p, errs } = await open({ w:W, h:W < 600 ? 844 : 900, page:'chat.html', wait:3200, init });
    await p.screenshot({ path:tag + '-0.png' });
    await p.fill('#inp', 'Explícame en 3 puntos qué es la fotosíntesis'); await p.keyboard.press('Enter'); await p.waitForTimeout(3500);
    await p.screenshot({ path:tag + '-1.png' });
    if (mode === 'left'){ await p.click('#navBtn'); await p.waitForTimeout(600); await p.screenshot({ path:tag + '-2.png' }); await p.click('#tabbar [data-tab="cfg"]'); await p.waitForTimeout(900); await p.screenshot({ path:tag + '-3.png' }); }
    console.log(tag, await p.evaluate(() => document.documentElement.className + ' theme=' + (document.documentElement.dataset.theme || '')), errs);
    await b.close();
  }
})();
