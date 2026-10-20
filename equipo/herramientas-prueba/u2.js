const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8765/';
const H = { 'access-control-allow-origin':'*', 'access-control-allow-headers':'*' };
const ORM = JSON.stringify({ data:[{ id:'apodex/apodex-1.1-mini:free', name:'Apodex: Apodex 1.1 Mini (free)', context_length:262144, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:[] }] });
const OR_SSE = 'data: {"choices":[{"delta":{"content":"Hola."},"finish_reason":"stop"}]}\n\ndata: {"choices":[],"usage":{"prompt_tokens":20,"completion_tokens":6}}\n\ndata: [DONE]\n\n';
const PUTER = `window.puter = { auth:{ isSignedIn:()=>true, signIn:async()=>({}) }, ai:{ listModels: async () => [], chat: async () => ({}) } };`;
async function dev(b, tok){
  const ctx = await b.newContext({ viewport:{ width:1280, height:800 } });
  await ctx.addInitScript("try{if(!localStorage.getItem('synthz:v1'))localStorage.setItem('synthz:v1',JSON.stringify({keys:{openrouter:'sk-or-v1-x'},model:{openrouter:'or:apodex/apodex-1.1-mini:free'},models:{},usage:{},chats:{},fav:[],cmp:[]}));localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1');localStorage.setItem('synthz:sess','" + tok + "')}catch(e){}");
  await ctx.route('**/*', r => { const u = r.request().url();
    if (u.startsWith(base) || u.startsWith('http://localhost:8799')) return r.continue();
    if (u.includes('js.puter.com')) return r.fulfill({ contentType:'text/javascript', body:PUTER });
    if (u.includes('openrouter.ai/api/v1/models')) return r.fulfill({ headers:H, contentType:'application/json', body:ORM });
    if (u.includes('chat/completions')) return r.fulfill({ headers:H, contentType:'text/event-stream', body:OR_SSE });
    return r.abort(); });
  const p = await ctx.newPage(); await p.goto(base + 'chat.html'); await p.waitForTimeout(4500); return p;
}
const usage = p => p.evaluate(() => { const u = SZ.state.usage.openrouter; return u ? u.prompt + u.completion : 0; });
const send = async (p, t) => { await p.evaluate(() => [...document.querySelectorAll('#mlist .mi')].find(x => /apodex/.test(x.dataset.id)).click()); await p.fill('#inp', t); await p.press('#inp', 'Enter'); await p.waitForTimeout(2500); };
(async () => {
  const r = await fetch(base + 'api/auth', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ mode:'signup', user:'u' + Date.now().toString(36).slice(-6), pass:'clave-larga-123' }) }).then(r => r.json());
  const s2 = await fetch(base + 'api/auth', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ mode:'login', user:r.user.username, pass:'clave-larga-123' }) }).then(r => r.json());
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const A = await dev(b, r.token), B = await dev(b, s2.token);
  await send(A, 'desde A'); await send(B, 'desde B');
  await A.evaluate(() => SZ.accPush({ ledger:true })); await B.evaluate(() => SZ.accPush({ ledger:true }));
  const C = await dev(b, s2.token);
  console.log('B. dos dispositivos con 26 cada uno → esperado 52 en un tercer dispositivo; quedó:', await usage(C));
  await C.evaluate(() => SZ.resetUsage()); await C.evaluate(() => SZ.accPush({ ledger:true }));
  await A.evaluate(() => SZ.accPush({ ledger:true }));                      /* A todavía tenía 26 de antes del reinicio */
  const D = await dev(b, s2.token);
  console.log('C. tras «Reiniciar» en C y que A vuelva a sincronizar → esperado 0 en D y en A; quedó D:', await usage(D), '· A:', await usage(A));
  await send(D, 'después del reinicio'); await D.evaluate(() => SZ.accPush({ ledger:true })); await A.evaluate(() => SZ.accPush({ ledger:true }));
  console.log('C2. un mensaje nuevo en D (26) → esperado 26 en A; quedó:', await usage(A));
  /* sincronizar muchas veces no duplica */
  for (let i = 0; i < 5; i++){ await A.evaluate(() => SZ.accPush({ ledger:true })); await D.evaluate(() => SZ.accPush({ ledger:true })); }
  console.log('E. 10 sincronizaciones más → sigue en 26:', await usage(A), await usage(D));
  /* la misma petición contada dos veces se ignora */
  console.log('F. misma petición dos veces:', await D.evaluate(() => [SZ.addUsage('openrouter', 10, 5, true, { rid:'x1' }), SZ.addUsage('openrouter', 10, 5, true, { rid:'x1' })].join(',')), '→', await usage(D));
  await b.close();
})().catch(e => { console.log('FATAL', e.message.split('\n')[0]); process.exit(1); });
