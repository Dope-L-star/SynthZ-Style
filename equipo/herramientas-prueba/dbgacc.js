const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{ width:1280, height:800 } });
  await ctx.addInitScript("try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1')}catch(e){}");
  await ctx.route('**/*', r => r.request().url().startsWith('http://localhost') ? r.continue() : r.abort());
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('http://localhost:8765/chat.html'); await p.waitForTimeout(4000);
  await p.evaluate(() => document.querySelector('#accBtn').click()); await p.waitForTimeout(1200);
  console.log(await p.evaluate(() => { const a = document.querySelector('#acc'); return a ? a.className + ' | ' + a.innerHTML.slice(0, 600) : 'no #acc'; }));
  console.log('lgo', await p.evaluate(() => !!document.querySelector('#acc .lgo')), 'others', await p.evaluate(() => [...document.querySelectorAll('.lgo')].map(x => x.closest('[id]') && x.closest('[id]').id)));
  await p.screenshot({ path:'/tmp/claude-0/-home-claude/2005f521-c462-52aa-9b36-0bbe4073251e/scratchpad/acc.png' }); await b.close();
})();
