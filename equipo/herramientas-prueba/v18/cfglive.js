/* apagar UN ajuste en vivo desde Ajustes (como lo hizo Sammuel) */
const { open } = require('../v15/h.js');
(async () => {
  const page = process.argv[2] || 'chat.html', k = process.argv[3] || 'cursor';
  const { b, p, errs } = await open({ w:1440, h:900, page, state:{ keys:{} }, init:"sessionStorage.setItem('synthz:intro','1');if(!localStorage.getItem('synthz:cfg'))localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}))", wait:5000 });
  await p.evaluate(() => SZ.cfgModal()); await p.waitForTimeout(1200);
  await p.evaluate(k => document.querySelector('.cfgsw[data-k="' + k + '"]').click(), k); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('#cfgOk').click()); await p.waitForTimeout(4500);
  await p.mouse.move(700, 450); await p.waitForTimeout(300); await p.mouse.move(720, 470); await p.waitForTimeout(800);
  const r = await p.evaluate(() => {
    const at = document.elementFromPoint(720, 470);
    const imgs = [...document.querySelectorAll('img')].filter(e => e.offsetParent).map(e => (e.className || e.src.split('/').pop().slice(0, 24)) + ':' + (e.complete && e.naturalWidth ? 'ok' : 'NOLOAD') + ':' + getComputedStyle(e).opacity);
    const cd = document.querySelector('#cd');
    return { url:location.href.split('/').pop(), cls:document.documentElement.className, cursorAt:getComputedStyle(at || document.body).cursor, cd:cd ? getComputedStyle(cd).display + '/' + getComputedStyle(cd).opacity : 'no #cd', cfg:JSON.parse(localStorage.getItem('synthz:cfg')), imgs:imgs.slice(0, 10) };
  });
  console.log('== ' + page + ' en vivo sin ' + k, JSON.stringify(r), errs.length ? 'ERRORES ' + JSON.stringify(errs).slice(0, 400) : '');
  await p.screenshot({ path:__dirname + '/live-' + page.replace('.html', '') + '-' + k + '.png' });
  await b.close();
})();
