const { open } = require('./v15/h.js');
(async () => {
  for (const [w, h, tag] of [[1440, 900, 'pc'], [390, 844, 'mov']]){
    let { b, p, errs } = await open({ w, h, state:{ keys:{} }, wait:4000 });
    await p.evaluate(() => (document.querySelector('#cPick') || document.querySelector('#curChip')).click()); await p.waitForTimeout(1500);
    await p.screenshot({ path:'/tmp/l3-' + tag + '-1.png' });
    /* abrir panel derecho */
    await p.evaluate(() => { const l = document.querySelector('#pLupa'); if (l) l.click(); }); await p.waitForTimeout(1200);
    await p.screenshot({ path:'/tmp/l3-' + tag + '-2.png' });
    /* elegir una IA (la 3ª) */
    const nm = await p.evaluate(() => { const it = [...document.querySelectorAll('#mlist .mi')][2]; if (!it) return null; it.click(); return it.dataset.id; }); await p.waitForTimeout(1500);
    console.log(tag, 'picked', nm, JSON.stringify(errs));
    await p.screenshot({ path:'/tmp/l3-' + tag + '-3.png' });
    await b.close();
  }
})();
