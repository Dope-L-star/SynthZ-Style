const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
(async () => {
  const page = process.argv[2] || 'chat.html', mode = process.argv[3] || 'fresh';
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true, deviceScaleFactor:2.5 });
  await ctx.route('**/*', r => r.request().url().startsWith('http://localhost') ? r.continue() : r.abort());
  await ctx.addInitScript(`try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1');localStorage.setItem('synthz:newv','2.2');sessionStorage.setItem('synthz:blkwarn','1');${mode === 'visual' ? "localStorage.setItem('synthz:cfg',JSON.stringify({v:2,perf:'visual',cursor:true,smooth:true,favAnim:true,bg:true,glass:true,anim:true}))" : ''}}catch(e){}
    window.__lt=0;window.__ltn=0;new PerformanceObserver(l=>l.getEntries().forEach(e=>{window.__lt+=e.duration;window.__ltn++})).observe({type:'longtask',buffered:true});`);
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate:4 });
  const t0 = Date.now(); await p.goto('http://localhost:8765/' + page, { waitUntil:'load' }); const load = Date.now() - t0;
  await p.waitForTimeout(5000);
  const boot = await p.evaluate(() => ({ lt:Math.round(window.__lt), n:window.__ltn }));
  /* cuadros por segundo en reposo (3 s) */
  const fps = await p.evaluate(() => new Promise(res => { let n = 0, t0 = performance.now(), worst = 0, last = t0; const f = now => { n++; worst = Math.max(worst, now - last); last = now; if (now - t0 < 3000) requestAnimationFrame(f); else res({ fps:Math.round(n / ((now - t0) / 1000)), worst:Math.round(worst) }); }; requestAnimationFrame(f); }));
  /* escribir en la caja */
  const inp = await p.$('#inp, textarea'); let typing = null;
  if (inp){ await p.evaluate(() => { window.__lt = 0; }); const t1 = Date.now(); await inp.type('Hola, quiero ideas para un regalo de cumpleaños', { delay:30 }); typing = { ms:Date.now() - t1, lt:Math.round(await p.evaluate(() => window.__lt)) }; }
  const css = await p.evaluate(() => { let bf = 0; document.querySelectorAll('*').forEach(e => { const s = getComputedStyle(e); if (s.backdropFilter && s.backdropFilter !== 'none') bf++; }); return { blur:bf, anims:document.getAnimations().length, nodes:document.querySelectorAll('*').length, cls:document.documentElement.className }; });
  console.log(JSON.stringify({ page, mode, load, boot, fps, typing, css }));
  await b.close();
})();
