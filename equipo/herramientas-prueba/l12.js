const { open } = require('./v15/h.js');
(async () => {
  let { b, p, errs } = await open({ page:'chat.html', w:1440, h:900, wait:3000, state:{ keys:{} } });
  await p.waitForTimeout(3000);
  p.on('console', m => console.log('C', m.type(), m.text().slice(0,200)));
  await p.clock.install();
  await p.evaluate(() => { setTimeout(() => SZ.portalBack('index.html'), 5); });
  for (let i=0;i<14;i++){ await p.clock.runFor(600); console.log(i, p.url()); try{ console.log(await p.evaluate(() => (()=>{const P=document.getElementById('portal'); if(!P) return 'no'; return P.querySelector('.szps').style.width+' '+P.querySelector('.szpw').style.transform.slice(0,50)+' o='+getComputedStyle(P).opacity})())); }catch(e){ console.log('x', e.message.slice(0,80)); break; } }
  await b.close();
})();
