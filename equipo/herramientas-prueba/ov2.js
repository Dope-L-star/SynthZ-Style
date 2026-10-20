const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  for (const f of ['index.html']) {
    const p = await (await b.newContext({ viewport:{ width:390, height:844 } })).newPage();
    await p.route('**/*', r => r.request().url().startsWith('http://localhost') ? r.continue() : r.abort());
    await p.goto('http://localhost:8765/' + f); await p.waitForTimeout(9000);
    console.log(f, await p.evaluate(() => {
      const W = innerWidth, clipped = e => { for (let a = e.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement){ const s = getComputedStyle(a); if (/hidden|clip/.test(s.overflowX) || s.position === 'fixed') return true; } return false; };
      const out = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > W + 1 && r.width > 0 && getComputedStyle(e).position !== 'fixed' && !clipped(e); }).slice(0, 6).map(e => e.tagName + '.' + (typeof e.className === 'string' ? e.className : '') + '#' + e.id + ' r=' + Math.round(e.getBoundingClientRect().right));
      return JSON.stringify({ sw: document.documentElement.scrollWidth, out });
    }));
  }
  await b.close();
})();
