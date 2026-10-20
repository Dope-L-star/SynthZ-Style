const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const W = +process.argv[2] || 1280, H = +process.argv[3] || 800, tag = process.argv[4] || 'pv', dir = process.argv[5] || 'fwd';
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const mob = W < 600;
  const ctx = await b.newContext({ viewport:{ width:W, height:H }, isMobile:mob, hasTouch:mob, recordVideo:{ dir:'/home/claude/t/v1b/vid-' + tag, size:{ width:W, height:H } } });
  await ctx.addInitScript("try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1');localStorage.setItem('synthz:guide','1');localStorage.setItem('synthz:cfg',JSON.stringify({v:2,perf:'" + (process.env.PERF||'visual') + "',intro:'never'}));sessionStorage.setItem('synthz:blkwarn','1')}catch(e){}");
  await ctx.route('**/*', r => r.request().url().startsWith('http://localhost') ? r.continue() : r.abort());
  const p = await ctx.newPage(); p.on('console', m => { if (/portal/.test(m.text())) console.log('C', m.text()); });
  if (dir === 'fwd'){ await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(4500); await p.evaluate(() => SZ.portalOut('chat.html')); await p.waitForTimeout(9000); }
  else { await p.goto('http://localhost:8765/chat.html'); await p.waitForTimeout(4500); await p.evaluate(() => SZ.portalBack('index.html')); await p.waitForTimeout(9000); }
  await ctx.close(); await b.close();
})();
