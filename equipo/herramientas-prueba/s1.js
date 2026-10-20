const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8765/';
const H = { 'access-control-allow-origin':'*', 'access-control-allow-headers':'*' };
const ORM = JSON.stringify({ data:[{ id:'apodex/apodex-1.1-mini:free', name:'Apodex: Apodex 1.1 Mini (free)', context_length:262144, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:[] }] });
const SSE = 'data: {"choices":[{"delta":{"content":"Hola."},"finish_reason":"stop"}]}\n\ndata: {"choices":[],"usage":{"prompt_tokens":20,"completion_tokens":6}}\n\ndata: [DONE]\n\n';
const PUTER = `window.puter = { auth:{ isSignedIn:()=>false, signIn:async()=>({}) }, ai:{ listModels: async () => [], chat: async () => ({}) } };`;
(async () => {
  const r = await fetch(base + 'api/auth', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ mode:'signup', user:'med' + Date.now().toString(36).slice(-5), pass:'medir-viajes-1' }) }).then(r => r.json());
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{ width:1280, height:860 } });
  await ctx.addInitScript("try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1');localStorage.setItem('synthz:sess','" + r.token + "');if(!localStorage.getItem('synthz:v1'))localStorage.setItem('synthz:v1',JSON.stringify({keys:{openrouter:'sk-or-v1-x'},model:{openrouter:'or:apodex/apodex-1.1-mini:free'},models:{},usage:{},chats:{},fav:[],cmp:[]}))}catch(e){}");
  let n = 0; const log = [];
  await ctx.route('**/*', rt => { const u = rt.request().url();
    if (u.startsWith(base)){ if (u.includes('/api/')){ n++; log.push(rt.request().method() + ' ' + u.split('/api/')[1].split('?')[0]); } return rt.continue(); }
    if (u.includes('js.puter.com')) return rt.fulfill({ contentType:'text/javascript', body:PUTER });
    if (u.includes('/api/v1/models')) return rt.fulfill({ headers:H, contentType:'application/json', body:ORM });
    if (u.includes('chat/completions')) return rt.fulfill({ headers:H, contentType:'text/event-stream', body:SSE });
    return rt.abort(); });
  const p = await ctx.newPage(); await p.goto(base + 'chat.html'); await p.waitForTimeout(9000);
  console.log('al abrir:', n, 'peticiones →', log.join(', ')); n = 0; log.length = 0;
  for (let i = 0; i < 3; i++){ await p.fill('#inp', 'mensaje ' + i); await p.press('#inp', 'Enter'); await p.waitForTimeout(12000); }
  console.log('3 mensajes (con 12 s entre cada uno):', n, 'peticiones →', log.join(', '));
  await b.close();
})().catch(e => { console.log('FATAL', e.message.split('\n')[0]); process.exit(1); });
