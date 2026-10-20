const { chromium } = require('/opt/node-tools/node_modules/playwright');
const [,, url, out, wait, scroll] = process.argv;
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{ width:1280, height:860 } });
  await ctx.addInitScript("try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1')}catch(e){}");
  await ctx.route('**/*', r => r.request().url().startsWith('http://localhost') ? r.continue() : r.abort());
  const p = await ctx.newPage(); await p.goto(url); await p.waitForTimeout(+wait || 9000);
  if (scroll) { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.scrollIntoView(); else scrollTo(0, +s); }, scroll); await p.waitForTimeout(2500); }
  await p.screenshot({ path:out }); await b.close();
})();
