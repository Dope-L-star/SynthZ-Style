const { open } = require('../v15/h.js');
(async () => {
  const { b, p } = await open({ w:700, h:260, page:'chat.html', wait:2500 });
  await p.evaluate(() => {
    const d = document.createElement('div'); d.id = 'icotest';
    d.style.cssText = 'position:fixed;inset:0;z-index:999999;background:#0d0c10;display:flex;align-items:center;justify-content:space-around;padding:20px';
    const src = document.querySelector('#railAgent .ssi').outerHTML;
    [160, 64, 26, 18].forEach(s => { const w = document.createElement('div'); w.innerHTML = src; const v = w.firstChild; v.style.width = v.style.height = s + 'px'; d.appendChild(w); });
    document.body.appendChild(d);
  });
  await p.waitForTimeout(500); await p.screenshot({ path:'ico1.png' });
  await p.waitForTimeout(1200); await p.screenshot({ path:'ico2.png' });
  await b.close();
})();
