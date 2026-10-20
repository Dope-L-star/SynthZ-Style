const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{ width:390, height:844 }, hasTouch:true, isMobile:true });
  await ctx.addInitScript("try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1')}catch(e){}");
  await ctx.route('**/*', r => r.request().url().startsWith('http://localhost') ? r.continue() : r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(14000);
  await p.screenshot({ path:'/home/claude/t/M3.png' });
  await p.tap('#navMenu'); await p.waitForTimeout(700); await p.screenshot({ path:'/home/claude/t/M4.png' });
  await b.close();
})();
