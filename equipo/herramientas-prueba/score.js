const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const p = await b.newPage();
  await p.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://localhost')) return r.continue();
    if (u.includes('puter')) return r.fulfill({ contentType:'text/javascript', body:"window.puter={auth:{isSignedIn:()=>false,signIn:async()=>1},ai:{listModels:async()=>[{id:'openai/gpt-5.6-luna',provider:'openai',name:'GPT 5.6 Luna',context:400000},{id:'gemini-3.5-flash-lite',provider:'google',name:'Gemini 3.5 Flash Lite',context:1000000}],chat:async()=>({})}}" });
    return r.abort(); });
  await p.goto('http://localhost:8765/chat.html'); await p.waitForTimeout(5000);
  console.log(await p.evaluate(() => [...document.querySelectorAll('.mi')].map(x => x.textContent.replace(/\s+/g,' ').slice(0,70)).join(' || ')));
  await b.close();
})();
