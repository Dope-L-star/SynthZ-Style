const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8765/';
const mkPuter = (opts) => `(function(){
  var signed = ${opts.signed ? 'true' : "localStorage.getItem('mockPuter') === '1'"};
  window.__puterCalls = [];
  window.puter = { ui: { authenticateWithPuter: async function(){ window.__puterCalls.push(['authUI']); signed = true; return true; } },
    auth: { isSignedIn: function(){ return signed; }, signIn: function(o){ window.__puterCalls.push(['signIn', o]); ${opts.popupBlocked ? "return Promise.reject({ error:'popup_blocked', msg:'blocked' });" : "signed = true; localStorage.setItem('mockPuter','1'); return Promise.resolve({ ok:true });"} } },
    ai: { listModels: async function(){ return [{ id:'openai/gpt-5.6-luna', provider:'openai', name:'GPT 5.6 Luna', context:400000 }, { id:'gemini-3.5-flash-lite', provider:'google', name:'Gemini 3.5 Flash Lite', context:1000000 }]; },
      chat: async function(msgs, o){ window.__puterCalls.push(['chat', o.model]); ${opts.funds ? "throw { success:false, error:{ code:'insufficient_funds', message:'Insufficient funds' } };" : "return { message:{ role:'assistant', content:'Respuesta de Puter' } };"} } } };
})();`;
const ORMODELS = { data: [
  { id:'qwen/qwen3-235b-a22b:free', name:'Qwen: Qwen3 235B (free)', context_length:131072, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:['reasoning'] },
  { id:'openai/gpt-oss-120b:free', name:'OpenAI: gpt-oss-120b (free)', context_length:131072, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:['reasoning'] } ] };
const H = { 'access-control-allow-origin':'*', 'access-control-allow-headers':'*', 'access-control-allow-methods':'POST,GET' };
async function page(b, errs, opts){
  const ctx = await b.newContext({ viewport:{ width:1280, height:800 } });
  if (opts.seed) await ctx.addInitScript(opts.seed);
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERROR ' + (e.stack || e.message).split('\n').slice(0, 2).join(' | ')));
  await p.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith(base)) return r.continue();
    if (u.includes('js.puter.com')) return opts.puterBlocked ? r.abort() : r.fulfill({ contentType:'text/javascript', body:mkPuter(opts) });
    if (u.includes('openrouter.ai/api/v1/models')) return r.fulfill({ contentType:'application/json', headers:H, body:JSON.stringify(ORMODELS) });
    if (u.includes('openrouter.ai/api/v1/key')) return r.fulfill({ contentType:'application/json', headers:H, body:'{"data":{}}' });
    if (u.includes('openrouter.ai/api/v1/chat/completions')) {
      if (r.request().method() === 'OPTIONS') return r.fulfill({ status:204, headers:H });
      if (opts.or429) return r.fulfill({ status:429, contentType:'application/json', headers:H, body:'{"error":{"message":"Rate limit exceeded: free-models-per-day","code":429}}' });
      return r.fulfill({ contentType:'application/json', headers:H, body:JSON.stringify({ choices:[{ message:{ content:'Respuesta de OpenRouter' } }], usage:{ prompt_tokens:5, completion_tokens:6 } }) });
    }
    return r.abort();
  });
  return p;
}
const seedTour = "try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1')}catch(e){}";
const seedKey = sel => "try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:v1',JSON.stringify({keys:{openrouter:'sk-or-x'},model:{openrouter:'" + sel + "'},models:{},usage:{},chats:{},fav:[],cmp:[]}))}catch(e){}";
const info = p => p.evaluate(() => ({ model: (JSON.parse(localStorage.getItem('synthz:v1') || '{}').model || {}).openrouter, blk: document.querySelector('#blk') ? document.querySelector('#blk h3').textContent : null, conn: !!document.querySelector('#conn'), last: [...document.querySelectorAll('.m')].slice(-1).map(x => x.textContent.replace(/\s+/g, ' ').slice(0, 170))[0], calls: window.__puterCalls }));
async function send(p, text){ await p.fill('#inp', text); await p.press('#inp', 'Enter'); await p.waitForTimeout(2500); }
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const errs = [];
  let p;
  // E: ventana bloqueada
  p = await page(b, errs, { popupBlocked:true, seed:seedTour });
  await p.goto(base + 'chat.html'); await p.waitForTimeout(5000);
  await p.evaluate(() => document.querySelector('#lockCard [data-lk="pu"]').click()); await p.waitForTimeout(1500);
  console.log('E-popup', JSON.stringify(await info(p)));
  await p.screenshot({ path:'/home/claude/t/E.png' });
  await p.evaluate(() => document.querySelector('#bAsk').click()); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('#bYes').click()); await p.waitForTimeout(1200);
  console.log('E-forzar', JSON.stringify(await info(p)));
  await p.context().close();
  // F: extensión bloquea Puter
  p = await page(b, errs, { puterBlocked:true, seed:seedTour });
  await p.goto(base + 'chat.html'); await p.waitForTimeout(5500);
  console.log('F-script', JSON.stringify(await info(p)));
  await p.screenshot({ path:'/home/claude/t/F.png' });
  await p.context().close();
  // G: créditos de Puter agotados → botón cambiar a OpenRouter
  p = await page(b, errs, { signed:true, funds:true, seed:seedKey('pu:openai/gpt-5.6-luna') });
  await p.goto(base + 'chat.html'); await p.waitForTimeout(5000);
  await send(p, 'hola');
  console.log('G-funds', JSON.stringify(await info(p)));
  await p.evaluate(() => { const x = document.querySelector('.m.err .swb'); x && x.click(); }); await p.waitForTimeout(900);
  console.log('G-switch', JSON.stringify(await info(p)));
  await p.context().close();
  // H: límite de OpenRouter → cambiar a Puter
  p = await page(b, errs, { signed:true, or429:true, seed:seedKey('or:qwen/qwen3-235b-a22b:free') });
  await p.goto(base + 'chat.html'); await p.waitForTimeout(5000);
  await send(p, 'hola');
  console.log('H-or429', JSON.stringify(await info(p)));
  await p.evaluate(() => { const x = document.querySelector('.m.err .swb'); x && x.click(); }); await p.waitForTimeout(900);
  console.log('H-switch', JSON.stringify(await info(p)));
  // I: proveedores separados
  const grp = () => p.evaluate(() => ({ heads: [...document.querySelectorAll('#list .mgrp b, .mgrp b')].map(x => x.textContent), items: [...document.querySelectorAll('.mi')].map(x => x.dataset.id) }));
  console.log('I-todos', JSON.stringify(await grp()));
  await p.evaluate(() => document.querySelector('#provSeg [data-p="or"]').click()); await p.waitForTimeout(500);
  console.log('I-or', JSON.stringify(await grp()));
  await p.evaluate(() => document.querySelector('#provSeg [data-p="pu"]').click()); await p.waitForTimeout(500);
  console.log('I-pu', JSON.stringify(await grp()));
  await p.evaluate(() => document.querySelector('#provSeg [data-p="all"]').click()); await p.waitForTimeout(500);
  await p.evaluate(() => { const s = document.querySelector('#sideToggle, #openSide, [data-side]'); s && s.click(); });
  await p.waitForTimeout(600);
  await p.screenshot({ path:'/home/claude/t/I.png' });
  // J: cursor solo al seleccionar
  await p.evaluate(() => { const x = document.querySelector('#sxClose'); x && x.click(); }); await p.waitForTimeout(600);
  await send(p, 'texto para seleccionar con el mouse'); const tb = (await p.$$('.m')).slice(-1)[0]; const bb = await tb.boundingBox();
  await p.mouse.move(bb.x + 8, bb.y + 10); await p.waitForTimeout(200);
  const hover = await p.evaluate(() => document.documentElement.classList.contains('cursor-text'));
  await p.mouse.down(); await p.mouse.move(bb.x + 40, bb.y + 12, { steps:5 }); await p.waitForTimeout(150);
  const drag = await p.evaluate(() => document.documentElement.classList.contains('cursor-text'));
  await p.mouse.up(); await p.waitForTimeout(150);
  const after = await p.evaluate(() => document.documentElement.classList.contains('cursor-text'));
  console.log('J-cursor', JSON.stringify({ hover, drag, after }));
  await p.context().close();
  // K: index sin errores + fondo
  p = await page(b, errs, {});
  await p.goto(base + 'index.html'); await p.waitForTimeout(11000);
  console.log('K-index', JSON.stringify(await p.evaluate(() => ({ cls: document.documentElement.className, puter: !!window.__puterOK }))));
  await p.screenshot({ path:'/home/claude/t/K.png' });
  console.log('ERRORS', JSON.stringify(errs, null, 1));
  await b.close();
})().catch(e => { console.log('FATAL', e.message.split('\n').slice(0, 3).join(' | ')); process.exit(1); });
