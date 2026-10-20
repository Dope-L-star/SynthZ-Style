/* Diagnóstico de cuentas: ¿se mezclan datos entre dos cuentas en el mismo navegador? */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8765/';
const H = { 'access-control-allow-origin':'*', 'access-control-allow-headers':'*' };
const ORM = JSON.stringify({ data:[{ id:'apodex/apodex-1.1-mini:free', name:'Apodex: Apodex 1.1 Mini (free)', context_length:262144, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:[] }] });
const OR_SSE = 'data: {"choices":[{"delta":{"content":"Hola."},"finish_reason":"stop"}]}\n\ndata: {"choices":[],"usage":{"prompt_tokens":20,"completion_tokens":6}}\n\ndata: [DONE]\n\n';
const PUTER = `window.puter = { auth:{ isSignedIn:()=>false, signIn:async()=>({}) }, ai:{ listModels: async () => [], chat: async () => ({}) } };`;
const api = (b, tok) => fetch(base + 'api/' + (b ? 'auth' : 'me'), b ? { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify(b) } : { headers:{ authorization:'Bearer ' + tok } }).then(r => r.json());
(async () => {
  const id = Date.now().toString(36).slice(-5);
  const A = await api({ mode:'signup', user:'ana' + id, pass:'clave-de-ana-1' }), B = await api({ mode:'signup', user:'beto' + id, pass:'clave-de-beto-1' });
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{ width:1280, height:800 } });
  await ctx.addInitScript("try{if(!localStorage.getItem('synthz:v1'))localStorage.setItem('synthz:v1',JSON.stringify({keys:{openrouter:'sk-or-v1-x'},model:{},models:{},usage:{},chats:{},fav:[],cmp:[]}));localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1')}catch(e){}");
  await ctx.route('**/*', r => { const u = r.request().url();
    if (u.startsWith(base)) return r.continue();
    if (u.includes('js.puter.com')) return r.fulfill({ contentType:'text/javascript', body:PUTER });
    if (u.includes('/api/v1/models')) return r.fulfill({ headers:H, contentType:'application/json', body:ORM });
    if (u.includes('chat/completions')) return r.fulfill({ headers:H, contentType:'text/event-stream', body:OR_SSE });
    return r.abort(); });
  const p = await ctx.newPage();
  await p.goto(base + 'chat.html'); await p.waitForTimeout(3000);
  /* Ana entra, escribe un secreto y marca un favorito */
  await p.evaluate(t => localStorage.setItem('synthz:sess', t), A.token); await p.reload(); await p.waitForTimeout(3500);
  await p.evaluate(() => [...document.querySelectorAll('#mlist .mi')].find(x => /apodex/.test(x.dataset.id)).click());
  await p.fill('#inp', 'secreto de Ana'); await p.press('#inp', 'Enter'); await p.waitForTimeout(2500);
  await p.evaluate(() => { SZ.state.fav.push('or:apodex/apodex-1.1-mini:free'); SZ.save(); });
  await p.evaluate(() => SZ.accPush());
  /* Ana cierra sesión y Beto entra en el mismo navegador */
  await p.evaluate(() => SZ.accSignOut()); await p.waitForTimeout(800);
  console.log('tras cerrar sesión, en este navegador queda:', await p.evaluate(() => JSON.stringify({ chats:Object.keys(SZ.state.chats).filter(k => SZ.state.chats[k].length).length, fav:SZ.state.fav.length, uso:SZ.totalAll() })));
  await p.evaluate(t => localStorage.setItem('synthz:sess', t), B.token); await p.reload(); await p.waitForTimeout(4000);
  await p.evaluate(() => SZ.accPush()); await p.waitForTimeout(500);
  const mb = await api(null, B.token);
  const chatsB = mb.chatKeys.length ? await fetch(base + 'api/chats?' + mb.chatKeys.map(k => 'k=' + encodeURIComponent(k)).join('&'), { headers:{ authorization:'Bearer ' + B.token } }).then(r => r.json()) : { chats:{} };
  console.log('la cuenta de Beto tiene: chats de Ana:', JSON.stringify(chatsB.chats).includes('secreto de Ana'), '· favoritos:', (mb.prefs || {}).fav, '· SynXCoin\'s:', JSON.stringify(Object.keys(mb.ledger.dev)));
  console.log('Beto ve en pantalla el chat de Ana:', await p.evaluate(() => document.body.innerText.includes('secreto de Ana')));
  /* Beto sale; Ana vuelve a entrar y recupera lo suyo desde la nube */
  await p.evaluate(() => SZ.accSignOut()); const A2 = await api({ mode:'login', user:A.user.username, pass:'clave-de-ana-1' }); await p.evaluate(t => localStorage.setItem('synthz:sess', t), A2.token); await p.reload(); await p.waitForTimeout(4500);
  console.log('Ana recupera lo suyo:', await p.evaluate(() => JSON.stringify({ secreto:JSON.stringify(SZ.state.chats).includes('secreto de Ana'), fav:SZ.state.fav.length, uso:SZ.totalAll() })));
  /* sesión en dos pestañas: cerrar en una recarga la otra */
  const p2 = await ctx.newPage(); await p2.goto(base + 'chat.html'); await p2.waitForTimeout(3500);
  await p.evaluate(() => SZ.accSignOut()); await p2.waitForTimeout(2500);
  console.log('la otra pestaña ya no muestra a Ana:', await p2.evaluate(() => !document.body.innerText.includes('secreto de Ana') && !SZ.ACC.ready));
  await b.close();
})().catch(e => { console.log('FATAL', e.message.split('\n')[0]); process.exit(1); });
