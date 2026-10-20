const { open } = require('../v15/h.js');
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 260) : ''));
(async () => {
  for (const [w, h, tag] of [[1280, 800, 'pc'], [390, 844, 'movil']]){
    const { b, p, errs } = await open({ w, h, page:'chat.html', state:{ keys:{} }, init:"if(!localStorage.getItem('synthz:cfg'))localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}))", wait:4500 });
    const man = await p.evaluate(async () => { const r = await fetch('/manifest.webmanifest'); return r.json(); });
    ok(tag + ' manifest sin nombres técnicos y con íconos PNG', !/openrouter|puter|groq/i.test(JSON.stringify(man)) && man.name === 'SynthFlow' && man.icons.some(i => i.sizes === '512x512' && i.purpose === 'maskable'));
    const sw = await p.evaluate(async () => { for (let i = 0; i < 30; i++){ const r = await navigator.serviceWorker.getRegistration('/'); if (r && r.active) return r.active.state; await new Promise(o => setTimeout(o, 200)); } return null; });
    ok(tag + ' el «modo app» queda activo', sw === 'activated', sw);
    const btn = await p.evaluate(() => { const m = document.querySelector('#moreBtn'); if (!m) return 'no'; const r = m.getBoundingClientRect(); return r.width > 0 ? 'si' : 'oculto'; });
    ok(tag + ' el botón ⋯ se ve', btn === 'si', btn);
    await p.evaluate(() => document.querySelector('#moreBtn').click()); await p.waitForTimeout(500);
    await p.evaluate(() => { const b = [...document.querySelectorAll('[role="menuitem"], .ctxm button')].find(x => /Instalar la app/.test(x.textContent)); b && b.click(); }); await p.waitForTimeout(700);
    const t = await p.evaluate(() => (document.querySelector('.szm .tcard') || {}).textContent || '');
    ok(tag + ' «Instalar la app» explica cómo', /Instala SynthFlow/.test(t), t.slice(0, 120));
    await p.screenshot({ path:__dirname + '/pwa-' + tag + '.png' });
    const api = await p.evaluate(async () => (await caches.keys()).length ? (await Promise.all((await caches.keys()).map(async k => (await (await caches.open(k)).keys()).map(r => r.url)))).flat().filter(u => /\/api\//.test(u)).length : 0);
    ok(tag + ' nunca guarda nada de /api', api === 0, api);
    require('child_process').execSync('kill $(cat /tmp/dev.pid); sleep 0.5');
    await p.goto('http://localhost:8765/chat.html').catch(() => {}); await p.waitForTimeout(1500);
    const off = await p.evaluate(() => document.title + ' | ' + !!document.querySelector('#inp'));
    ok(tag + ' sin internet abre la copia guardada', /true/.test(off), off);
    await p.goto('http://localhost:8765/nada-aqui.html').catch(() => {}); await p.waitForTimeout(800);
    ok(tag + ' página sin guardar → aviso «sin internet»', /sin internet/i.test(await p.evaluate(() => document.body.innerText)));
    require('child_process').execSync('bash /home/claude/t/srv.sh >/dev/null');
    ok(tag + ' sin errores', !errs.filter(e => !/net::|Failed to fetch|offline|ERR_INTERNET/i.test(String(e))).length, errs);
    await b.close();
  }
  const { b, p } = await open({ w:1280, h:800, page:'index.html', state:{ keys:{} }, wait:4000 });
  const ix = await p.evaluate(async () => ({ man:!!document.querySelector('link[rel=manifest]'), sw:!!(await navigator.serviceWorker.getRegistration('/')) }));
  ok('SynthZ (inicio) no se instala: es solo la web', !ix.man && !ix.sw, ix);
  await b.close();
})();
