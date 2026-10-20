const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const p = await b.newPage();
  p.on('pageerror', e => console.log('ERR', (e.stack || e.message).split('\n').slice(0, 3).join(' | ')));
  await p.route('**/*', r => r.request().url().startsWith('http://localhost') ? r.continue() : r.abort());
  await p.goto('http://localhost:8765/index.html');
  for (let i = 0; i < 12; i++){ await p.waitForTimeout(2000); console.log(i * 2 + 2, 's', await p.evaluate(() => JSON.stringify({ intro: !!document.querySelector('#intro'), cls: document.documentElement.className, authm: !!document.querySelector('#authm'), shown: document.querySelectorAll('.hero-fade.show').length }))); }
  await b.close();
})();
