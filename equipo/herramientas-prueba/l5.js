const { open } = require('./v15/h.js');
(async () => {
  for (const sel of ['#backLink', '#railWord']){
    let { b, p, errs } = await open({ w:1440, h:900, state:{ keys:{} }, wait:4000 });
    if (sel === '#railWord'){ await p.evaluate(() => { const r = document.querySelector('#rail'); if (!r.classList.contains('open')) document.querySelector('#railTog').click(); }); await p.waitForTimeout(1200); }
    const info = await p.evaluate(s => { const e = document.querySelector(s), r = e.getBoundingClientRect(); const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return { r:[r.x, r.y, r.width, r.height], top:top && (top.id || top.className || top.tagName), inside:e.contains(top) }; }, sel);
    console.log(sel, JSON.stringify(info));
    await p.click(sel).catch(e => console.log('click err', e.message.slice(0, 200)));
    await p.waitForTimeout(1200);
    console.log(sel, 'portal?', await p.evaluate(() => !!document.getElementById('portal')), errs);
    await b.close();
  }
})();
