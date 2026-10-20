/* Diagnóstico de SynXCoins: ¿qué bugs existen de verdad? */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8765/';
const H = { 'access-control-allow-origin':'*', 'access-control-allow-headers':'*' };
const ORM = JSON.stringify({ data:[{ id:'apodex/apodex-1.1-mini:free', name:'Apodex: Apodex 1.1 Mini (free)', context_length:262144, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:[] }] });
const OR_SSE = 'data: {"choices":[{"delta":{"content":"Hola."},"finish_reason":"stop"}]}\n\ndata: {"choices":[],"usage":{"prompt_tokens":20,"completion_tokens":6}}\n\ndata: [DONE]\n\n';
const PUTER = `window.puter = { auth:{ isSignedIn:()=>true, signIn:async()=>({}) }, ai:{ listModels: async () => [{ id:'openai/gpt-5.6-luna', provider:'openai', name:'GPT 5.6 Luna', context:400000 }], chat: async () => ({ [Symbol.asyncIterator]: async function*(){ yield { type:'text', text:'Respuesta de Puter.' }; } }) } };`;
const seed = "try{if(!localStorage.getItem('synthz:v1'))localStorage.setItem('synthz:v1',JSON.stringify({keys:{openrouter:'sk-or-v1-x'},model:{openrouter:'or:apodex/apodex-1.1-mini:free'},models:{},usage:{},chats:{},fav:[],cmp:[]}));localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1')}catch(e){}";
async function ctxOf(b){
  const ctx = await b.newContext({ viewport:{ width:1280, height:800 } }); await ctx.addInitScript(seed);
  await ctx.route('**/*', r => { const u = r.request().url();
    if (u.startsWith(base) || u.startsWith('http://localhost:8799')) return r.continue();
    if (u.includes('js.puter.com')) return r.fulfill({ contentType:'text/javascript', body:PUTER });
    if (u.includes('openrouter.ai/api/v1/models')) return r.fulfill({ headers:H, contentType:'application/json', body:ORM });
    if (u.includes('openrouter.ai/api/v1/chat/completions')) return r.fulfill({ headers:H, contentType:'text/event-stream', body:OR_SSE });
    return r.abort(); });
  return ctx;
}
const send = async (p, t) => { await p.fill('#inp', t); await p.press('#inp', 'Enter'); await p.waitForTimeout(2500); };
const usage = p => p.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(SZ.state.usage).map(([k, v]) => [k, v.prompt + v.completion]))));
const pickModel = (p, re) => p.evaluate(re => { const m = [...document.querySelectorAll('#mlist .mi')].find(x => new RegExp(re).test(x.dataset.id)); m.click(); }, re);
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  /* A. dos pestañas del mismo navegador */
  const ctx = await ctxOf(b);
  const t1 = await ctx.newPage(); await t1.goto(base + 'chat.html'); await t1.waitForTimeout(4000);
  const t2 = await ctx.newPage(); await t2.goto(base + 'chat.html'); await t2.waitForTimeout(4000);
  await pickModel(t1, 'apodex'); await send(t1, 'pestaña uno');
  await pickModel(t2, 'apodex'); await send(t2, 'pestaña dos');
  const t3 = await ctx.newPage(); await t3.goto(base + 'chat.html'); await t3.waitForTimeout(3000);
  console.log('A. dos pestañas, 26 cada una → esperado openrouter 52; quedó:', await usage(t3));
  /* D. exacto vs estimado */
  await pickModel(t3, 'gpt-5.6-luna'); await send(t3, 'hola puter');
  console.log('D. tras un mensaje de Puter (estimado):', await usage(t3), '| ¿guarda cuánto es estimado?', await t3.evaluate(() => JSON.stringify(SZ.state.usage.puter)));
  await ctx.close();
  console.log('B/C se comprueban en el servidor (ver u2)');
  await b.close();
})().catch(e => { console.log('FATAL', e.message.split('\n')[0]); process.exit(1); });
