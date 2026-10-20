/* banco de pruebas v15: Puter y OpenRouter simulados, con varias IA y tiempos distintos */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const PUTER = `(function(){
  var signed = localStorage.getItem('mockPuter') !== '0';
  window.__puterCalls = [];
  window.puter = { auth: { isSignedIn: function(){ return signed; }, signIn: function(o){ signed = true; localStorage.setItem('mockPuter','1'); return Promise.resolve({ ok:true }); } },
    ai: { listModels: async function(){ return [
      { id:'openai/gpt-5.6-luna', provider:'openai', name:'GPT 5.6 Luna', context:400000 },
      { id:'gemini-3.5-flash-lite', provider:'google', name:'Gemini 3.5 Flash Lite', context:1000000 },
      { id:'claude-haiku-4-5', provider:'anthropic', name:'Claude Haiku 4.5', context:200000 },
      { id:'mistral-small-latest', provider:'mistral', name:'Mistral Small', context:128000 },
      { id:'deepseek-chat', provider:'deepseek', name:'DeepSeek V3', context:128000 },
      { id:'qwen-coder-plus', provider:'qwen', name:'Qwen Coder Plus', context:128000 } ]; },
      chat: async function(msgs, opts){ window.__puterCalls.push(['chat', opts]); var d = { 'openai/gpt-5.6-luna':900, 'mistral-small-latest':300, 'claude-haiku-4-5':1500 }[opts.model] || 600; await new Promise(function(r){ setTimeout(r, d); }); return { message:{ role:'assistant', content:'**Respuesta de ' + opts.model + '**\\n\\n1. Una idea clara.\\n2. Otra idea útil.\\n3. Un cierre con ejemplo.' } }; } } };
  setTimeout(function(){ window.__puterOK = 1; window.dispatchEvent(new Event('puter-ready')); }, 30);
})();`;
const M = (id, name, ctx, reason) => ({ id, name, context_length:ctx, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters: reason ? ['reasoning'] : [] });
const ORMODELS = { data: [
  M('qwen/qwen3-235b-a22b:free', 'Qwen: Qwen3 235B (free)', 131072, true),
  M('openai/gpt-oss-120b:free', 'OpenAI: gpt-oss-120b (free)', 131072, true),
  M('meta-llama/llama-3.3-70b-instruct:free', 'Meta: Llama 3.3 70B Instruct (free)', 131072),
  M('mistralai/mistral-small-3.2-24b-instruct:free', 'Mistral: Mistral Small 3.2 (free)', 96000),
  M('deepseek/deepseek-r1:free', 'DeepSeek: R1 (free)', 163840, true),
  M('google/gemma-3-27b-it:free', 'Google: Gemma 3 27B (free)', 96000),
  M('qwen/qwen-2.5-coder-32b-instruct:free', 'Qwen2.5 Coder 32B Instruct (free)', 32768) ] };
const DELAY = { 'meta-llama/llama-3.3-70b-instruct:free':250, 'qwen/qwen3-235b-a22b:free':1400, 'openai/gpt-oss-120b:free':800 };
async function open(o = {}){
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const w = o.w || 1440, h = o.h || 900, mob = w < 600;
  const ctx = await b.newContext({ viewport:{ width:w, height:h }, isMobile:mob, hasTouch:mob });
  const init = Object.assign({ keys:{ openrouter:'sk-or-v1-x' }, model:{}, models:{}, usage:{}, chats:{}, fav:[], cmp:[] }, o.state || {});
  if (!o.whatsnew) await ctx.addInitScript("try{if(!localStorage.getItem('synthz:newv'))localStorage.setItem('synthz:newv','2.2')}catch(e){}");
  await ctx.addInitScript("try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1');sessionStorage.setItem('synthz:blkwarn','1');if(!localStorage.getItem('synthz:v1'))localStorage.setItem('synthz:v1'," + JSON.stringify(JSON.stringify(init)) + ");" + (o.init || '') + "}catch(e){}");
  await ctx.route('**/*', async r => {
    const u = r.request().url();
    if (u.startsWith('http://localhost')) return r.continue();
    if (u.includes('js.puter.com')) return r.fulfill({ contentType:'text/javascript', body:PUTER });
    if (u.includes('openrouter.ai/api/v1/models')) return r.fulfill({ contentType:'application/json', body:JSON.stringify(ORMODELS), headers:{ 'access-control-allow-origin':'*' } });
    if (u.includes('openrouter.ai/api/v1/key')) return r.fulfill({ contentType:'application/json', body:'{"data":{"label":"x","limit_remaining":null,"is_free_tier":true}}', headers:{ 'access-control-allow-origin':'*', 'access-control-allow-headers':'*' } });
    if (u.includes('openrouter.ai/api/v1/chat/completions')){
      if (r.request().method() === 'OPTIONS') return r.fulfill({ status:204, headers:{ 'access-control-allow-origin':'*', 'access-control-allow-headers':'*', 'access-control-allow-methods':'POST' } });
      const body = JSON.parse(r.request().postData() || '{}');
      await new Promise(ok => setTimeout(ok, DELAY[body.model] || 500));
      return r.fulfill({ contentType:'application/json', headers:{ 'access-control-allow-origin':'*' }, body:JSON.stringify({ choices:[{ message:{ content:'**' + body.model + '** responde:\n\n- Idea uno para tu pregunta.\n- Idea dos, con más detalle.\n- Idea tres, para cerrar.' }, finish_reason:'stop' }], usage:{ prompt_tokens:12, completion_tokens:30 } }) });
    }
    return r.abort();
  });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PAGEERR ' + (e.stack || e.message).split('\n').slice(0, 3).join(' | ')));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load resource/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto('http://localhost:8765/' + (o.page || 'chat.html')); await p.waitForTimeout(o.wait || 3200);
  return { b, p, errs };
}
module.exports = { open };
