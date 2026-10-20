const { open } = require('../v15/h.js');
(async () => {
  const { b, p } = await open({ w:960, h:600, page:'index.html', wait:7000, init:"sessionStorage.setItem('synthz:intro','1')" });
  await p.route('**/chat.html', r => r.fulfill({ status:204, body:'' }));
  await p.evaluate(() => SZ.portalOut('chat.html'));
  await p.waitForFunction(() => window.__pz, null, { timeout:8000 });
  console.log(JSON.stringify(await p.evaluate(() => window.__pz)));
  console.log(JSON.stringify(await p.evaluate(() => { const o = document.querySelector('.szpo'), f = document.querySelector('.szpf'), r = o.getBoundingClientRect(), rf = f.getBoundingClientRect(); return { o:[r.left, r.width], f:[rf.left, rf.width], tr:getComputedStyle(document.querySelector('.szpw')).transformOrigin }; })));
  await b.close();
})();
