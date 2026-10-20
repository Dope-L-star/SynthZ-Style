const { chromium } = require('/opt/node-tools/node_modules/playwright');
const H = { 'access-control-allow-origin':'*', 'access-control-allow-headers':'*' };
const ORM = JSON.stringify({ data:[
  { id:'apodex/apodex-1.1-mini:free', name:'Apodex: Apodex 1.1 Mini (free)', context_length:262144, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:['reasoning'] },
  { id:'qwen/qwen3-coder:free', name:'Qwen: Qwen3 Coder (free)', context_length:262144, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:[] },
  { id:'mistralai/mistral-small-3.2:free', name:'Mistral: Mistral Small 3.2 (free)', context_length:131072, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text','image'], output_modalities:['text'] }, supported_parameters:[] } ] });
const PUTER = `window.puter = { auth:{ isSignedIn:()=>false, signIn:async()=>({}) }, ai:{ listModels: async () => [], chat: async () => ({}) } };`;
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{ width:1280, height:860 } }); const errs = [];
  await ctx.addInitScript("try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1');if(!localStorage.getItem('synthz:v1'))localStorage.setItem('synthz:v1',JSON.stringify({keys:{openrouter:'sk-or-v1-x'},model:{},models:{},usage:{},chats:{},fav:[],cmp:[]}))}catch(e){}");
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://localhost')) return r.continue(); if (u.includes('js.puter.com')) return r.fulfill({ contentType:'text/javascript', body:PUTER }); if (u.includes('/api/v1/models')) return r.fulfill({ headers:H, contentType:'application/json', body:ORM }); return r.abort(); });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/chat.html'); await p.waitForTimeout(3500);
  console.log('sin encuesta → aviso arriba:', await p.evaluate(() => (document.querySelector('.pask') || {}).textContent));
  await p.evaluate(() => { SZ.state.survey = { a:{ uses:['code'], pace:'deep', lang:'es', key:'yes' }, t:Date.now() }; SZ.save(); }); await p.reload(); await p.waitForTimeout(3500);
  console.log('con encuesta → orden:', await p.evaluate(() => [...document.querySelectorAll('#mlist .mi')].map(x => x.dataset.id.split('/').pop() + (x.querySelector('.pti') ? '✦' : '')).join(', ')), '| modelos visibles:', await p.evaluate(() => document.querySelectorAll('#mlist .mi').length));
  /* guía suave */
  await p.click('#helpBtn'); await p.waitForTimeout(800); console.log('elige:', await p.evaluate(() => [...document.querySelectorAll('#szGch .gco b')].map(x => x.textContent).join(' / '))); await p.evaluate(() => document.querySelector('#szGch [data-g="l"]').click()); await p.waitForTimeout(900);
  await p.evaluate(() => document.querySelectorAll('#szHelp summary')[2].click());
  const hs = []; for (let i = 0; i < 6; i++){ hs.push(await p.evaluate(() => Math.round(document.querySelectorAll('#szHelp details')[2].getBoundingClientRect().height))); await p.waitForTimeout(90); }
  console.log('guía: alto de la sección mientras se abre:', hs.join(' → '));
  /* modo rendimiento: sin destellos */
  console.log('destellos (visual):', await p.evaluate(() => getComputedStyle(document.querySelector('.flw .sp')).display));
  await p.evaluate(() => { localStorage.setItem('synthz:cfg', JSON.stringify(Object.assign({}, SZ.CFG, { perf:'speed' }))); }); await p.reload(); await p.waitForTimeout(2500);
  console.log('destellos (rendimiento):', await p.evaluate(() => getComputedStyle(document.querySelector('.flw .sp')).display), '| brillo:', await p.evaluate(() => getComputedStyle(document.querySelector('.flw')).animationName));
  console.log('ERRORS', JSON.stringify(errs));
  await b.close();
})();
