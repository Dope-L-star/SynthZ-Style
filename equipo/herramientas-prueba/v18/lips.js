const { open } = require('../v15/h.js');
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 300) : ''));
(async () => {
  const { b, p, errs } = await open({ w:1280, h:800, page:'chat.html', state:{ keys:{} }, init:"if(!localStorage.getItem('synthz:cfg'))localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}))", wait:4500 });
  await p.evaluate(() => SZ.BOT.open());
  const seen = new Set(); let txt = '';
  for (let i = 0; i < 40; i++){
    await p.waitForTimeout(90);
    const r = await p.evaluate(() => { const L = [...document.querySelectorAll('#szBotP .bm.a')], last = L[L.length - 1]; const m = last && last.querySelector('.ftalk ellipse'); return { d:m && m.parentNode.style.opacity === '1' ? Math.round(+m.getAttribute('rx')) + 'x' + Math.round(+m.getAttribute('ry')) : null, t:last && last.querySelector('p').textContent }; });
    if (r.d) seen.add(r.d); txt = r.t;
  }
  ok('nuevo saludo de SynthonIA', /nunca te pierdas/.test(txt || ''), txt);
  ok('la boca cambia de forma mientras habla (varias formas)', seen.size >= 4, [...seen].length);
  await p.waitForTimeout(3500);
  const end = await p.evaluate(() => { const L = [...document.querySelectorAll('#szBotP .bm.a')], last = L[L.length - 1]; return last.querySelector('.fm').getAttribute('d'); });
  ok('al terminar vuelve a su sonrisa', end === 'M42 64q8 7 16 0', end);
  await p.screenshot({ path:__dirname + '/lips.png' });
  ok('sin errores', !errs.length, errs);
  await b.close();
})();
