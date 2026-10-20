const { open } = require('./v15/h.js');
(async () => {
  const mob = process.argv[2] === 'm'; const [w,h] = mob ? [390,844] : [1440,900];
  let { b, p } = await open({ page:'chat.html', w, h, wait:3000, state:{ keys:{} } });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { setTimeout(() => SZ.portalBack('index.html'), 5); });
  for (let i=0;i<16;i++){ await p.waitForTimeout(250); try{ await p.screenshot({ path:'/tmp/q-' + i + '.png', type:'jpeg', quality:70, timeout:8000 }); }catch(e){ console.log('fail', i, p.url(), e.message.slice(0,60)); break; } }
  await b.close();
})();
