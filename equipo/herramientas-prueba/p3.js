const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8765/';
const H = { 'access-control-allow-origin':'*', 'access-control-allow-headers':'*' };
const ORM = JSON.stringify({ data:[
  { id:'apodex/apodex-1.1-mini:free', name:'Apodex: Apodex 1.1 Mini (free)', context_length:262144, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:['reasoning'] },
  { id:'qwen/qwen3-coder:free', name:'Qwen: Qwen3 Coder (free)', context_length:262144, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:[] },
  { id:'google/gemma-3n-e2b-it:free', name:'Google: Gemma 3n 2B (free)', context_length:8192, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text','image'], output_modalities:['text'] }, supported_parameters:[] },
  { id:'mistralai/mistral-small-3.2:free', name:'Mistral: Mistral Small 3.2 (free)', context_length:131072, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text','image'], output_modalities:['text'] }, supported_parameters:[] } ] });
const PUTER = `window.puter = { auth:{ isSignedIn:()=>false, signIn:async()=>({}) }, ai:{ listModels: async () => [], chat: async () => ({}) } };`;
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const errs = [];
  const ctx = await b.newContext({ viewport:{ width:1280, height:860 } });
  await ctx.addInitScript("try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1');localStorage.setItem('synthz:intro','never');if(!localStorage.getItem('synthz:v1'))localStorage.setItem('synthz:v1',JSON.stringify({keys:{openrouter:'sk-or-v1-x'},model:{},models:{},usage:{},chats:{},fav:[],cmp:[]}))}catch(e){}");
  await ctx.route('**/*', r => { const u = r.request().url();
    if (u.startsWith(base)) return r.continue();
    if (u.includes('js.puter.com')) return r.fulfill({ contentType:'text/javascript', body:PUTER });
    if (u.includes('/api/v1/models')) return r.fulfill({ headers:H, contentType:'application/json', body:ORM });
    return r.abort(); });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(base + 'index.html'); await p.waitForTimeout(4500);
  console.log('hero:', await p.evaluate(() => document.querySelector('#h1').textContent + ' | ' + document.querySelector('#heroSub').textContent + ' | botón: ' + document.querySelector('.cta .btn').textContent));
  console.log('usos:', await p.evaluate(() => [...document.querySelectorAll('.use h3')].map(x => x.textContent).join(' · ')), '| menú:', await p.evaluate(() => document.querySelector('[data-sec=chat]').textContent));
  await p.screenshot({ path:'/home/claude/t/P3a.png' });
  await p.click('.use[data-draft=code]'); await p.waitForFunction(() => location.pathname.endsWith('chat.html'), null, { timeout:15000 }); await p.waitForTimeout(4500);
  console.log('borrador desde «Programa»:', JSON.stringify(await p.evaluate(() => ({ url:location.search, caja:document.querySelector('#inp').value.slice(0, 60), mensajes:SZ.state.chats && Object.values(SZ.state.chats).flat().length, modelo:SZ.state.model.openrouter, intent:SZ.state.intent }))));
  await p.evaluate(() => { document.querySelector('#inp').value = ''; });
  await p.evaluate(() => document.querySelector('.sugg button[data-x="2"]').click()); await p.waitForTimeout(1500);
  console.log('ejemplo «Resume»:', JSON.stringify(await p.evaluate(() => ({ caja:document.querySelector('#inp').value, enviado:document.querySelectorAll('.m.user, .m.u').length, clipBrilla:document.querySelector('#attachBtn').classList.contains('pulse'), aviso:document.querySelector('#toast').textContent }))));
  for (const k of ['fast', 'code', 'study', 'deep']){
    await p.evaluate(k => document.querySelector('[data-intent="' + k + '"]').click(), k); await p.waitForTimeout(700);
    console.log('intención ' + k + ':', await p.evaluate(() => { const x = document.querySelector('.ipick'); return x ? x.innerText.replace(/\n+/g, ' | ') : '(nada)'; }));
  }
  await p.screenshot({ path:'/home/claude/t/P3b.png' });
  /* respeta tu elección manual */
  await p.evaluate(() => [...document.querySelectorAll('#mlist .mi')].find(x => /mistral/.test(x.dataset.id)).click()); await p.waitForTimeout(600);
  await p.goto(base + 'chat.html?draft=study'); await p.waitForTimeout(3000);
  console.log('elegido a mano y llega un borrador → sigue en:', await p.evaluate(() => SZ.state.model.openrouter), '| caja:', await p.evaluate(() => document.querySelector('#inp').value.slice(0, 40)));
  console.log('ERRORS', JSON.stringify(errs));
  await b.close();
})().catch(e => { console.log('FATAL', e.message.split('\n')[0]); process.exit(1); });
