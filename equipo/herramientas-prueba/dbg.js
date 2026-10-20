const { chromium } = require('/opt/node-tools/node_modules/playwright');
const PUT = "window.puter={auth:{isSignedIn:()=>true,signIn:async()=>1},ai:{listModels:async()=>[{id:'openai/gpt-5.6-luna',provider:'openai',name:'GPT 5.6 Luna',context:400000}],chat:async()=>({message:{content:'x'}})}};";
const ORM = JSON.stringify({ data:[{ id:'qwen/qwen3-235b-a22b:free', name:'Qwen3', context_length:131072, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:[] }] });
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  for (const delay of [0, 1500]) {
    const ctx = await b.newContext(); await ctx.addInitScript("localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:v1',JSON.stringify({keys:{openrouter:'k'},model:{openrouter:'or:qwen/qwen3-235b-a22b:free'},models:{},usage:{},chats:{},fav:[],cmp:[]}))");
    const p = await ctx.newPage(); const logs = [];
    p.on('console', m => logs.push(m.text().slice(0, 150))); p.on('pageerror', e => logs.push('ERR ' + e.message));
    await p.route('**/*', async r => { const u = r.request().url(); if (u.startsWith('http://localhost')) return r.continue();
      if (u.includes('puter')) { await new Promise(s => setTimeout(s, delay)); return r.fulfill({ contentType:'text/javascript', body:PUT }); }
      if (u.includes('openrouter.ai/api/v1/models')) return r.fulfill({ contentType:'application/json', headers:{ 'access-control-allow-origin':'*' }, body:ORM });
      return r.abort(); });
    await p.goto('http://localhost:8765/chat.html'); await p.waitForTimeout(6000);
    const cat = await p.evaluate(() => [...document.querySelectorAll('.mi')].map(x => x.dataset.id));
    console.log('delay', delay, 'ok', await p.evaluate(() => [!!window.__puterOK, !!window.puter]), 'cat', JSON.stringify(cat), 'items', await p.evaluate(() => document.querySelectorAll('.mi').length), logs.join(' || '));
    await ctx.close();
  }
  await b.close();
})();
