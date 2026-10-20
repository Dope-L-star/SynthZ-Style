const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const p = await b.newPage();
  p.on('pageerror', e => console.log('ERR', (e.stack || e.message).split('\n').slice(0, 3).join(' | ')));
  await p.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://localhost')) return r.continue(); if (u.includes('puter')) return r.fulfill({ contentType:'text/javascript', body:"window.puter={auth:{isSignedIn:()=>true},ai:{listModels:async()=>[],chat:async()=>({})}}" }); return r.abort(); });
  await p.goto('http://localhost:8765/chat.html'); await p.waitForTimeout(4000);
  await b.close();
})();
