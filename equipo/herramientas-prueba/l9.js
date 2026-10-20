const { open } = require('./v15/h.js');
(async () => {
  let { b, p } = await open({ page:'index.html', w:1440, h:900, wait:3000 });
  await p.keyboard.press('Escape'); await p.waitForTimeout(9000);
  await p.evaluate(() => { window.__f = []; let l = performance.now(); (function f(n){ window.__f.push(n - l); l = n; requestAnimationFrame(f); })(l); SZ.portalOut('chat.html'); });
  const out = [];
  for (let i=0;i<14;i++){ await p.waitForTimeout(500); try{ out.push(await p.evaluate(() => { const a = window.__f.splice(0); return a.length + 'f max' + Math.round(Math.max(...a)); })); }catch(e){ out.push('nav'); break; } }
  console.log(out.join(' · '));
  await b.close();
})();
