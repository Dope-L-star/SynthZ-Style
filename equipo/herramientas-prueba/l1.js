/* logos de vidrio + portal nuevo */
const { open } = require('./v15/h.js');
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 260) : ''));
(async () => {
  for (const [w, h, tag] of [[1440, 900, 'pc'], [390, 844, 'mov']]){
    let { b, p, errs } = await open({ page:'index.html', w, h, wait:3000, init:"sessionStorage.setItem('synthz:intro','1');localStorage.setItem('synthz:cfg',JSON.stringify({intro:'never'}))" });
    await p.waitForTimeout(1500);
    await p.screenshot({ path:'/tmp/l1-' + tag + '-index.png', clip:{ x:0, y:0, width:w, height:Math.min(h, 300) } });
    ok(tag + ' index: Z de vidrio y S de vidrio', await p.evaluate(() => !!document.querySelector('#navWord img.zg') && !!document.querySelector('#navWord .gS')));
    /* portal */
    const link = await p.evaluate(() => { const a = [...document.querySelectorAll('a[href*="chat.html"]')].find(a => a.getClientRects().length); if (a){ a.click(); return a.textContent.trim().slice(0, 30); } return null; });
    ok(tag + ' hay enlace a SynthFlow', !!link, link);
    const frames = [];
    for (let i = 0; i < 14; i++){ await p.waitForTimeout(500); try{ await p.screenshot({ path:'/tmp/l1-' + tag + '-p' + i + '.png' }); frames.push(await p.evaluate(() => { return document.getElementById('portal') ? 'portal' : location.pathname; })); }catch(e){ frames.push('nav'); } }
    console.log(JSON.stringify(frames));
    await p.waitForTimeout(3000);
    ok(tag + ' llegó a SynthFlow', /chat/.test(p.url()), p.url());
    await p.screenshot({ path:'/tmp/l1-' + tag + '-chat.png' });
    ok(tag + ' SynthFlow: «Flow» de vidrio', await p.evaluate(() => [...document.querySelectorAll('img.flwi')].some(i => i.getClientRects().length && i.naturalWidth > 0)));
    ok(tag + ' sin errores', !errs.length, errs);
    await b.close();
  }
})();
