const { open } = require('./v15/h.js');
(async () => {
  let { b, p, errs } = await open({ page:'chat.html', w:1440, h:900, wait:3000, state:{ keys:{} } });
  p.on('console', m => console.log('C', m.type(), m.text().slice(0,200)));
  p.on('framenavigated', f => { if (f === p.mainFrame()) console.log('NAV', f.url()); });
  await p.waitForTimeout(3000); console.log('before', p.url()); await p.evaluate(() => { setTimeout(() => SZ.portalBack('index.html'), 10); });
  for (let i=0;i<6;i++){ await p.waitForTimeout(400); try{ console.log(i, await p.evaluate(() => !!document.getElementById('portal'))); }catch(e){ console.log('gone'); break; } }
  console.log(errs); await b.close();
})();
