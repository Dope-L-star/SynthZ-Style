/* cada ajuste apagado por separado: la página debe verse y funcionar */
const { open } = require('../v15/h.js');
const KEYS = ['cursor', 'smooth', 'favAnim', 'bg', 'glass', 'anim'];
(async () => {
  const page = process.argv[2] || 'chat.html', only = process.argv[3];
  for (const k of (only ? [only] : KEYS)){
    const cfg = { v:2, perf:'visual', intro:'never', sound:false, cursor:true, smooth:true, favAnim:true, bg:true, glass:true, anim:true }; cfg[k] = false;
    const { b, p, errs } = await open({ w:1440, h:900, page, state:{ keys:{} }, init:"sessionStorage.setItem('synthz:intro','1');localStorage.setItem('synthz:cfg'," + JSON.stringify(JSON.stringify(cfg)) + ")", wait:5000 });
    await p.mouse.move(700, 450); await p.waitForTimeout(300); await p.mouse.move(720, 470); await p.waitForTimeout(600);
    const r = await p.evaluate(() => {
      const at = document.elementFromPoint(720, 470), cs = getComputedStyle(at || document.body).cursor;
      const logos = [...document.querySelectorAll('img.zb, img.flwi, .rword, .brand, #hLogo, .logo')].filter(e => e.offsetParent).map(e => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return (e.className || e.id || e.tagName).toString().slice(0, 20) + ':' + (+s.opacity).toFixed(2) + ':' + Math.round(r.width) + 'x' + Math.round(r.height) + (e.tagName === 'IMG' ? ':' + (e.complete && e.naturalWidth ? 'ok' : 'NOLOAD') : ''); });
      const cd = document.querySelector('#cd'), cdv = cd ? getComputedStyle(cd).display + '/' + getComputedStyle(cd).opacity : 'no #cd';
      return { cls:document.documentElement.className, cursorAt:cs, cd:cdv, logos:logos.slice(0, 8) };
    });
    console.log('== ' + page + ' sin ' + k, JSON.stringify(r), errs.length ? 'ERRORES ' + JSON.stringify(errs).slice(0, 300) : '');
    await p.screenshot({ path:__dirname + '/cfg-' + page.replace('.html', '') + '-' + k + '.png' });
    await b.close();
  }
})();
