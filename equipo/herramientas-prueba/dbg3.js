const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const ctx = await b.newContext(); await ctx.addInitScript("localStorage.setItem('synthz:visited','1')");
  const p = await ctx.newPage();
  await p.route('**/*', r => r.request().url().startsWith('http://localhost') ? r.continue() : r.abort());
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(9000);
  await p.evaluate(() => scrollTo(0, 2000)); await p.waitForTimeout(1500);
  console.log(await p.evaluate(() => JSON.stringify({ y: scrollY, st: document.scrollingElement.scrollTop, bodyST: document.body.scrollTop, sh: document.scrollingElement.scrollHeight, ch: document.scrollingElement.clientHeight, sp: document.querySelector('.aurora').style.getPropertyValue('--sp'), lock: document.documentElement.className })));
  await b.close();
})();
