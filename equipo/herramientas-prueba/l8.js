const { open } = require('./v15/h.js');
(async () => {
  let { b, p, errs } = await open({ page:'index.html', w:1440, h:900, wait:3000 });
  await p.keyboard.press('Escape'); await p.waitForTimeout(9000);
  p.on('console', m => console.log('C', m.type(), m.text().slice(0,200)));
  p.on('framenavigated', f => { if (f === p.mainFrame()) console.log('NAV', f.url()); });
  await p.evaluate(() => { window.__t0 = performance.now(); const o = SZ.portalOut('chat.html'); });
  for (let i=0;i<10;i++){ await p.waitForTimeout(300); try{ console.log(i, await p.evaluate(() => { const P = document.getElementById('portal'); return P ? (P.querySelector('.szps').style.width + ' | ' + P.querySelector('.szpslot').style.width + ' | ' + P.querySelector('.szpw').style.transform.slice(0,60)) : 'none'; })); }catch(e){ console.log('gone'); break; } }
  await b.close();
})();
