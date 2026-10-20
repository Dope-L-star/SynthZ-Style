const { open } = require('./v15/h.js');
(async () => {
  const [w,h] = process.argv[2] === 'm' ? [390,844] : [1440,900];
  let { b, p, errs } = await open({ page:'index.html', w, h, wait:3000 });
  await p.keyboard.press('Escape'); await p.waitForTimeout(9000);
  p.on('console', m => console.log('C', m.text().slice(0,150)));
  const t0 = Date.now();
  await p.evaluate(() => SZ.portalOut('chat.html'));
  for (let i = 0; i < 16; i++){ await p.waitForTimeout(380); try{ await p.screenshot({ path:'/tmp/l7-' + i + '.png', scale:'css', type:'jpeg', quality:60 }); console.log(i, Date.now()-t0, p.url().split('/').pop()); }catch(e){ console.log('nav at', Date.now()-t0); break; } }
  console.log(JSON.stringify(errs));
  await b.close();
})();
