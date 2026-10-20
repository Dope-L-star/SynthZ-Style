const { open } = require('./h.js');
const D = '/home/claude/t/v15/';
(async () => {
  let { b, p, errs } = await open({ w:1440, h:900 });
  await p.click('#railTog'); await p.waitForTimeout(900);
  await p.reload(); await p.waitForTimeout(3000);
  console.log('se recuerda abierta (computador):', await p.evaluate(() => document.getElementById('rail').classList.contains('open')));
  await p.click('#railTog'); await p.waitForTimeout(900);
  await p.goto('http://localhost:8765/chat.html?bienvenida=1'); await p.waitForTimeout(3500);
  await p.screenshot({ path:D + 'w1-bienvenida.png' });
  console.log('bienvenida:', await p.evaluate(() => { const w = document.querySelector('#szWelcome'); return w ? w.innerText.replace(/\n+/g, ' | ') : 'no'; }));
  await b.close();
  ({ b, p, errs } = await open({ w:390, h:844 }));
  await p.fill('#inp', 'Hola, dame una idea'); await p.keyboard.press('Enter'); await p.waitForTimeout(3500);
  await p.screenshot({ path:D + 'm5-enchat.png' });
  console.log('header móvil:', await p.evaluate(() => { const t = document.querySelector('#top'); const r = t.getBoundingClientRect(); return { alto:Math.round(r.height), anchoDoc:document.documentElement.scrollWidth, pay:(document.querySelector('#payM')||{}).textContent }; }));
  console.log('ERRORS', JSON.stringify(errs)); await b.close();
})();
