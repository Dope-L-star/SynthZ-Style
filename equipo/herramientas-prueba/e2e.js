const { chromium } = require('/opt/node-tools/node_modules/playwright');
const PUTER = `(function(){
  var signed = localStorage.getItem('mockPuter') === '1';
  window.__puterCalls = [];
  window.puter = { auth: { isSignedIn: function(){ return signed; }, signIn: function(o){ window.__puterCalls.push(['signIn', o]); signed = true; localStorage.setItem('mockPuter','1'); return Promise.resolve({ ok:true }); } },
    ai: { listModels: async function(){ return [{ id:'openai/gpt-5.6-luna', provider:'openai', name:'GPT 5.6 Luna', context:400000 }, { id:'gemini-3.5-flash-lite', provider:'google', name:'Gemini 3.5 Flash Lite', context:1000000 }, { id:'dall-e-3', provider:'openai' }]; },
      chat: async function(msgs, opts){ window.__puterCalls.push(['chat', opts]); if (!signed) throw { error:{ message:'token_auth_failed' } }; return { message:{ role:'assistant', content:'Respuesta de Puter con ' + opts.model } }; } } };
})();`;
const ORMODELS = { data: [
  { id:'qwen/qwen3-235b-a22b:free', name:'Qwen: Qwen3 235B (free)', context_length:131072, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:['reasoning'] },
  { id:'openai/gpt-oss-120b:free', name:'OpenAI: gpt-oss-120b (free)', context_length:131072, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:['reasoning'] } ] };
const base = 'http://localhost:8765/';
async function newPage(b, errs){
  const p = await b.newPage({ viewport:{ width:1280, height:800 } });
  p.on('pageerror', e => errs.push('PAGEERROR ' + (e.stack || e.message).split('\n').slice(0, 2).join(' | ')));
  p.on('dialog', d => d.dismiss());
  await p.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith(base)) return r.continue();
    if (u.includes('js.puter.com')) return r.fulfill({ contentType:'text/javascript', body:PUTER });
    if (u.includes('openrouter.ai/api/v1/models')) return r.fulfill({ contentType:'application/json', body:JSON.stringify(ORMODELS), headers:{ 'access-control-allow-origin':'*' } });
    if (u.includes('openrouter.ai/api/v1/key')) return r.fulfill({ contentType:'application/json', body:'{"data":{"label":"x"}}', headers:{ 'access-control-allow-origin':'*', 'access-control-allow-headers':'*' } });
    if (u.includes('openrouter.ai/api/v1/chat/completions')) {
      if (r.request().method() === 'OPTIONS') return r.fulfill({ status:204, headers:{ 'access-control-allow-origin':'*', 'access-control-allow-headers':'*', 'access-control-allow-methods':'POST' } });
      const body = JSON.parse(r.request().postData() || '{}');
      return r.fulfill({ contentType:'application/json', headers:{ 'access-control-allow-origin':'*' }, body:JSON.stringify({ choices:[{ message:{ content:'Respuesta de OpenRouter con ' + body.model } }], usage:{ prompt_tokens:5, completion_tokens:6 } }) });
    }
    return r.abort();
  });
  return p;
}
const state = p => p.evaluate(() => ({ model: (JSON.parse(localStorage.getItem('synthz:v1') || localStorage.getItem('synthz') || '{}').model || {}).openrouter, conn: !!document.querySelector('#conn'), msgs: [...document.querySelectorAll('.m')].map(x => x.textContent.replace(/\s+/g, ' ').slice(0, 90)), calls: window.__puterCalls }));
async function send(p, text){ await p.fill('#inp', text); await p.press('#inp', 'Enter'); await p.waitForTimeout(3500); }
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const errs = [];
  const p = await newPage(b, errs);
  // A: primera visita, nada conectado
  await p.goto(base + 'chat.html'); await p.waitForTimeout(6000);
  await p.evaluate(() => { const s = document.querySelector('#tSkip'); if (s) s.click(); }); await p.waitForTimeout(700);
  console.log('A-inicio', JSON.stringify(await state(p)));
  console.log('A-empty', await p.evaluate(() => (document.querySelector('.empty, #empty, .lane') || {}).textContent.replace(/\s+/g,' ').slice(0, 160)));
  console.log('A-bloqueo', JSON.stringify(await p.evaluate(() => ({ locked:document.body.classList.contains('locked'), ro:document.querySelector('#inp').readOnly, card:!document.querySelector('#lockCard').hidden }))));
  await p.evaluate(() => document.querySelector('#lockCard [data-lk="pu"]').click()); await p.waitForTimeout(1500);
  await send(p, 'hola');
  console.log('A-envio', JSON.stringify(await state(p)));
  await p.screenshot({ path:'/home/claude/t/A.png' });
  // B: recargar, sigue conectado y no pide conectar
  await p.reload(); await p.waitForTimeout(6000);
  await send(p, 'otra vez');
  console.log('B-recarga', JSON.stringify(await state(p)));
  // C: conectar OpenRouter desde la ventana flotante y usar un modelo de OpenRouter
  await p.evaluate(() => document.dispatchEvent(new MouseEvent('contextmenu', { clientX:400, clientY:300, bubbles:true, cancelable:true })));
  await p.evaluate(() => { const x = [...document.querySelectorAll('.ctxm button')].find(b => /Conectar IA/.test(b.textContent)); x && x.click(); });
  await p.waitForTimeout(900);
  await p.fill('#cKey', 'sk-or-test'); await p.evaluate(() => document.querySelector('#cOR').click()); await p.waitForTimeout(2500);
  console.log('C-llave', JSON.stringify(await state(p)), 'url', p.url());
  await p.evaluate(() => { const items = [...document.querySelectorAll('.mi')]; const q = items.find(x => /Qwen3/.test(x.textContent)); q && q.click(); });
  await p.waitForTimeout(800);
  await send(p, 'hola openrouter');
  console.log('C-or', JSON.stringify(await state(p)));
  await p.screenshot({ path:'/home/claude/t/C.png' });
  // D: página principal sin errores
  const p2 = await newPage(b, errs); await p2.goto(base + 'index.html'); await p2.waitForTimeout(9000);
  console.log('D-index', JSON.stringify(await p2.evaluate(() => ({ cls: document.documentElement.className, cards: [...document.querySelectorAll('.card h3, .card b')].slice(0, 3).map(x => x.textContent) }))));
  console.log('ERRORS', JSON.stringify(errs, null, 1));
  await b.close();
})().catch(e => { console.log('FATAL', e.message.split('\n')[0]); process.exit(1); });
