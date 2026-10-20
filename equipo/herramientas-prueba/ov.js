const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  for (const f of ['index.html', '../index.v8.html']) {
    const p = await (await b.newContext({ viewport:{ width:390, height:844 } })).newPage();
    await p.route('**/*', r => r.request().url().startsWith('http://localhost') ? r.continue() : r.abort());
    await p.goto('http://localhost:8765/' + f); await p.waitForTimeout(9000);
    console.log(f, await p.evaluate(() => { const W = innerWidth; const out = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > W + 1 && r.width > 0 && getComputedStyle(e).position !== 'fixed'; }).slice(0, 8).map(e => e.tagName + '.' + (e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className) + '#' + e.id + ' r=' + Math.round(e.getBoundingClientRect().right)); return JSON.stringify({ sw: document.documentElement.scrollWidth, W, out }); }));
  }
  await b.close();
})();
