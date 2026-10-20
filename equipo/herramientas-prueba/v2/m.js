const { open } = require('../v15/h.js');
(async () => {
  for (const [pg, w, h, tag] of [['chat.html', 390, 844, 'mc'], ['index.html', 390, 844, 'mi'], ['index.html', 1440, 900, 'di']]){
    const { b, p, errs } = await open({ w, h, page:pg, wait:pg === 'index.html' ? 6000 : 3200, init:"sessionStorage.setItem('synthz:intro','1');" });
    await p.waitForTimeout(800);
    await p.screenshot({ path:'v2/' + tag + '1.png' });
    const has = await p.evaluate(() => { const b = document.querySelector('#szBot'); if (!b) return 'no'; const r = b.getBoundingClientRect(); return [r.left|0, r.top|0, r.width|0, b.className, b.parentElement.id || b.parentElement.className]; });
    console.log(tag, JSON.stringify(has));
    if (has !== 'no'){ await p.evaluate(() => document.querySelector('#szBot').click()); await p.waitForTimeout(1000); await p.screenshot({ path:'v2/' + tag + '2.png' }); }
    console.log(tag, errs);
    await b.close();
  }
})();
