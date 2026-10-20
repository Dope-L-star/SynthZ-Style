const { open } = require('../v15/h.js');
(async () => {
  const { b, p } = await open({ w:960, h:600, page:'index.html', wait:7000, init:"sessionStorage.setItem('synthz:intro','1')" });
  await p.route('**/chat.html', r => r.fulfill({ status:204, body:'' }));
  await p.evaluate(() => { window.__log = []; SZ.portalOut('chat.html'); const t0 = performance.now(); (function f(){ const i = document.querySelector('.szpin'), o = document.querySelector('.szpo'); if (i){ const r = i.getBoundingClientRect(), q = o.getBoundingClientRect(); window.__log.push([Math.round(performance.now() - t0), Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2), Math.round(r.width), Math.round(q.left + q.width / 2), document.querySelector('.szpw').style.transform.slice(0, 60)]); } if (performance.now() - t0 < 4000) requestAnimationFrame(f); })(); });
  await p.waitForTimeout(4200);
  const L = await p.evaluate(() => window.__log);
  L.filter((x, i) => i % 6 === 0).forEach(x => console.log(JSON.stringify(x)));
  await b.close();
})();
