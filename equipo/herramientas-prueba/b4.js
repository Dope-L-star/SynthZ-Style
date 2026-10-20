/* primera visita: video de la Z, «Saltar», y luego el tutorial (no el login) */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 220) : ''));
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  for (const [w, h] of [[1440, 900], [390, 844]]){
    const ctx = await b.newContext({ viewport:{ width:w, height:h }, isMobile:w < 600, hasTouch:w < 600 });
    await ctx.route('**/*', r => r.request().url().startsWith('http://localhost') ? r.continue() : r.abort());
    const p = await ctx.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1500);
    const v = await p.evaluate(() => { const o = document.querySelector('#vintro'); const v = o && o.querySelector('video'); return o ? { t:v.currentTime, paused:v.paused, src:v.currentSrc.split('/').pop() } : null; });
    ok(w + 'px: el video de la Z se reproduce', v && !v.paused && v.t > 0, v);
    await p.screenshot({ path:'/tmp/b4-' + w + '-video.png' });
    await p.click('#vintro .vi-skip'); await p.waitForFunction(() => document.querySelector('#szGch') || document.querySelector('#authm'), null, { timeout:15000 }).catch(() => {}); await p.waitForTimeout(800);
    ok(w + 'px: «Saltar» funciona', await p.evaluate(() => !document.querySelector('#vintro')));
    const g = await p.evaluate(() => ({ guide:!!document.querySelector('#szGch'), auth:!!document.querySelector('#authm') }));
    ok(w + 'px: primero sale el tutorial, no el login', g.guide && !g.auth, g);
    await p.screenshot({ path:'/tmp/b4-' + w + '-tutorial.png' });
    await p.evaluate(() => document.querySelector('#szGch [data-close]').click()); await p.waitForTimeout(1200);
    ok(w + 'px: «Ahora no» → luego ofrece entrar', await p.evaluate(() => !!document.querySelector('#authm')));
    ok(w + 'px: sin errores', !errs.length, errs);
    await ctx.close();
  }
  await b.close();
})();
