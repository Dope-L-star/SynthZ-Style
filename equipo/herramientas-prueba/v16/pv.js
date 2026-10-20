const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const W = +process.argv[2] || 1280, H = +process.argv[3] || 800, tag = process.argv[4] || 'pv';
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const mob = W < 600;
  const ctx = await b.newContext({ viewport:{ width:W, height:H }, isMobile:mob, hasTouch:mob, recordVideo:{ dir:'/home/claude/t/v16/vid-' + tag, size:{ width:W, height:H } } });
  await ctx.addInitScript("try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1');localStorage.setItem('synthz:guide','1');sessionStorage.setItem('synthz:intro','1');sessionStorage.setItem('synthz:blkwarn','1')}catch(e){}");
  await ctx.route('**/*', r => r.request().url().startsWith('http://localhost') ? r.continue() : r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(7000);
  const t0 = Date.now(); await p.evaluate(() => SZ.portalOut('chat.html'));
  await p.waitForTimeout(6500);
  console.log('mark', t0); await ctx.close(); await b.close();
})();
