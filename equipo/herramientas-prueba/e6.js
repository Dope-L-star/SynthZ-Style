const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8765/';
const H = { 'access-control-allow-origin':'*', 'access-control-allow-headers':'*', 'access-control-allow-methods':'GET,POST' };
const ORM = JSON.stringify({ data:[
  { id:'apodex/apodex-1.1-mini:free', name:'Apodex: Apodex 1.1 Mini (free)', context_length:262144, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:['reasoning'] },
  { id:'qwen/qwen3-235b-a22b:free', name:'Qwen: Qwen3 235B (free)', context_length:131072, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:[] } ] });
const PUTER = `(function(){
  window.__calls = [];
  window.puter = { auth:{ isSignedIn:()=>true, signIn:async()=>({}), getUser:async()=>({ username:'sammy' }) },
    kv:{ get: async () => null, set: async () => true },
    ai:{ listModels: async () => [{ id:'openai/gpt-5.6-luna', provider:'openai', name:'GPT 5.6 Luna', context:400000 }, { id:'gemini-3.5-flash-lite', provider:'google', name:'Gemini 3.5 Flash Lite', context:1000000 }],
      chat: async (msgs, o) => {
        window.__calls.push({ model:o.model, stream:!!o.stream });
        const words = ('Hola, esta respuesta llega en vivo palabra por palabra para probar el streaming de SynthZ. ').repeat(4).split(' ');
        if (!o.stream) return { message:{ content:words.join(' ') } };
        return { [Symbol.asyncIterator]: async function*(){ for (const w of words){ await new Promise(r => setTimeout(r, 70)); yield { type:'text', text:w + ' ' }; } } };
      } } };
})();`;
const SSE = 'data: {"choices":[{"delta":{"content":"Respuesta "}}]}\n\ndata: {"choices":[{"delta":{"content":"en vivo "}}]}\n\n: OPENROUTER PROCESSING\n\ndata: {"choices":[{"delta":{"content":"de OpenRouter."}}]}\n\ndata: {"choices":[],"usage":{"prompt_tokens":12,"completion_tokens":5}}\n\ndata: [DONE]\n\n';
async function page(b, errs, o = {}){
  const ctx = await b.newContext({ viewport:{ width:1280, height:800 } });
  if (o.seed) await ctx.addInitScript(o.seed);
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push((o.tag || '') + ' PAGEERROR ' + (e.stack || e.message).split('\n').slice(0, 2).join(' | ')));
  await p.route('**/*', async r => {
    const u = r.request().url();
    if (u.startsWith(base)) return r.continue();
    if (u.includes('js.puter.com')) return r.fulfill({ contentType:'text/javascript', body:PUTER });
    if (u.includes('openrouter.ai/api/v1/models')) return r.fulfill({ headers:H, contentType:'application/json', body:ORM });
    if (u.includes('openrouter.ai/api/v1/chat/completions')){ if (r.request().method() === 'OPTIONS') return r.fulfill({ status:204, headers:H }); const bd = JSON.parse(r.request().postData()); return r.fulfill({ headers:Object.assign({ 'content-type':'text/event-stream' }, H), body: bd.stream ? SSE : '{}' }); }
    return r.abort();
  });
  return p;
}
const seen = (extra = '') => "try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1');" + extra + "}catch(e){}";
const last = p => p.evaluate(() => { const m = [...document.querySelectorAll('.m')].slice(-1)[0]; return m ? m.textContent.replace(/\s+/g, ' ').slice(0, 140) : ''; });
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const errs = [];
  // A: streaming de Puter: aparece mientras llega
  let p = await page(b, errs, { tag:'A', seed:seen() });
  await p.goto(base + 'chat.html'); await p.waitForTimeout(5000);
  await p.fill('#inp', 'cuéntame algo'); await p.press('#inp', 'Enter'); await p.waitForTimeout(900);
  const mid = await p.evaluate(() => { const b = document.querySelector('.m.bot.writing .body'); return b ? b.textContent.length : -1; });
  await p.waitForTimeout(4000);
  const fin = await p.evaluate(() => { const b = [...document.querySelectorAll('.m.bot .body')].slice(-1)[0]; return b ? b.textContent.length : -1; });
  console.log('A-en-vivo', JSON.stringify({ aMitad: mid, final: fin, llamada: await p.evaluate(() => window.__calls.slice(-1)[0]), meta: await p.evaluate(() => ([...document.querySelectorAll('.m.bot .meta')].slice(-1)[0] || {}).textContent) }));
  // B: detener a mitad: se queda lo que llegó
  await p.fill('#inp', 'otra larga'); await p.press('#inp', 'Enter'); await p.waitForTimeout(1200);
  await p.evaluate(() => document.querySelector('#sendBtn').click()); await p.waitForTimeout(800);
  console.log('B-detener-parcial', JSON.stringify({ ultimo: await last(p), boton: await p.evaluate(() => document.querySelector('#sendBtn').classList.contains('stop')) }));
  // C: consumo por proveedor e IndexedDB
  const st1 = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('synthz:v1')); return { proveedores:Object.keys(SZ.state.usage), chatsEnLocalStorage:Object.keys(s.chats || {}).length }; });
  const idb = await p.evaluate(() => new Promise(res => { const r = indexedDB.open('synthz', 1); r.onsuccess = () => { const q = r.result.transaction('chats').objectStore('chats').getAllKeys(); q.onsuccess = () => res(q.result); }; }));
  console.log('C-guardado', JSON.stringify({ ...st1, idb }));
  // D: conversaciones
  console.log('D-lista', await p.evaluate(() => [...document.querySelectorAll('#thList .thg, #thList .thi b')].map(x => x.textContent).join(' | ')));
  await p.evaluate(() => document.querySelector('[data-r=new]').click()); await p.waitForTimeout(600);
  console.log('D-nueva', JSON.stringify({ mensajes: await p.evaluate(() => document.querySelectorAll('.m').length), hilos: await p.evaluate(() => document.querySelectorAll('#thList .thi').length) }));
  await p.fill('#inp', 'segundo hilo de prueba'); await p.press('#inp', 'Enter'); await p.waitForTimeout(5000);
  await p.waitForTimeout(300);
  console.log('D-dos-hilos', await p.evaluate(() => [...document.querySelectorAll('#thList .thi')].map(x => x.querySelector('b').textContent + (x.classList.contains('cur') ? ' (actual)' : '')).join(' | ')));
  await p.evaluate(() => { const it = [...document.querySelectorAll('#thList .thi')].find(x => !x.classList.contains('cur')); it.querySelector('.tt').click(); }); await p.waitForTimeout(800);
  console.log('D-cambiar', await p.evaluate(() => [...document.querySelectorAll('.m.user')].map(x => x.textContent.replace(/\s+/g, ' ').slice(0, 30)).join(' | ')));
  await p.waitForTimeout(300);
  await p.evaluate(() => { const it = [...document.querySelectorAll('#thList .thi')].find(x => !x.classList.contains('cur')); it.querySelector('[data-del]').click(); }); await p.waitForTimeout(600);
  console.log('D-borrar-aviso', await p.evaluate(() => document.querySelector('.szc h3') && document.querySelector('.szc h3').textContent));
  await p.evaluate(() => document.querySelector('.szc [data-ok]').click()); await p.waitForTimeout(700);
  console.log('D-tras-borrar', await p.evaluate(() => document.querySelectorAll('#thList .thi').length), 'del:', await p.evaluate(() => (JSON.parse(localStorage.getItem('synthz:v1')).del || []).length));
  await p.reload(); await p.waitForTimeout(5000);
  console.log('D-recarga', JSON.stringify({ mensajes: await p.evaluate(() => document.querySelectorAll('.m.user').length), hilos: await p.evaluate(() => document.querySelectorAll('#thList .thi').length) }));
  // E: cursor del botón del medio
  await p.mouse.move(600, 400); await p.waitForTimeout(200);
  await p.mouse.down({ button:'middle' }); await p.waitForTimeout(100); await p.mouse.up({ button:'middle' }); await p.waitForTimeout(200);
  const on = await p.evaluate(() => document.documentElement.classList.contains('cursor-mid'));
  await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(100);
  console.log('E-clic-medio', JSON.stringify({ activo: on, trasClic: await p.evaluate(() => document.documentElement.classList.contains('cursor-mid')) }));
  // F: batalla ciega
  await p.evaluate(() => { document.querySelector('[data-add]').click(); }); await p.waitForTimeout(700);
  await p.evaluate(() => { [...document.querySelectorAll('#mlist .mi:not(.cmpd)')][0].click(); }); await p.waitForTimeout(700);
  await p.evaluate(() => { const s = document.querySelector('#sideDone'); if (s && s.offsetParent) s.click(); }); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('#btTog').click()); await p.waitForTimeout(300);
  await p.waitForFunction(() => !document.querySelector('#sendBtn').classList.contains('stop'), null, { timeout:20000 }); await p.fill('#inp', 'pregunta de batalla'); await p.press('#inp', 'Enter'); await p.waitForTimeout(6500);
  console.log('F-ciega', await p.evaluate(() => [...document.querySelectorAll('.cmp-card .who b')].map(x => x.textContent).join(' | ') + ' || ' + (document.querySelector('.vote') ? document.querySelector('.vote').textContent : 'sin votación')));
  await p.screenshot({ path:'/home/claude/t/F6.png' });
  await p.evaluate(() => document.querySelector('.vote [data-w]').click()); await p.waitForTimeout(600);
  console.log('F-revelado', await p.evaluate(() => [...document.querySelectorAll('.cmp-card .who b')].map(x => x.textContent).join(' | ')), 'ranking:', await p.evaluate(() => JSON.stringify(Object.keys(JSON.parse(localStorage.getItem('synthz:v1')).arena || {}))));
  await p.evaluate(() => document.querySelector('#moreBtn').click()); await p.waitForTimeout(400); await p.evaluate(() => [...document.querySelectorAll('button')].find(b => /ranking/i.test(b.textContent) && b.offsetParent).click()); await p.waitForTimeout(600);
  console.log('F-ranking', await p.evaluate(() => [...document.querySelectorAll('.rank div')].map(x => x.textContent).join(' | ')));
  await p.context().close();
  // G: streaming de OpenRouter con uso real
  p = await page(b, errs, { tag:'G', seed:seen("localStorage.setItem('synthz:v1',JSON.stringify({keys:{openrouter:'k'},model:{openrouter:'or:apodex/apodex-1.1-mini:free'},models:{},usage:{},chats:{},fav:[],cmp:[]}));") });
  await p.goto(base + 'chat.html'); await p.waitForTimeout(5000);
  await p.fill('#inp', 'hola OR'); await p.press('#inp', 'Enter'); await p.waitForTimeout(3000);
  console.log('G-openrouter', await last(p), '| uso:', await p.evaluate(() => JSON.stringify(SZ.state.usage.openrouter)));
  await p.context().close();
  // H: configuración: rendimiento con detalles activables, intro "Nunca", pregunta por sessionStorage
  p = await page(b, errs, { tag:'H', seed:seen("localStorage.setItem('synthz:cfg', JSON.stringify({v:2,perf:'speed',intro:'never',cursor:true,smooth:false,favAnim:false,bg:false,glass:false,anim:false}));") });
  await p.goto(base + 'index.html'); await p.waitForTimeout(2500);
  console.log('H-intro-nunca', JSON.stringify(await p.evaluate(() => ({ intro: !!document.querySelector('#intro'), cursor: !!document.querySelector('#cd'), clases: document.documentElement.className }))));
  await p.evaluate(() => document.querySelector('#cfgBtn').click()); await p.waitForTimeout(700);
  console.log('H-config', await p.evaluate(() => [...document.querySelectorAll('#cfgm .cfgsw')].map(x => x.dataset.k + '=' + x.getAttribute('aria-pressed')).join(' ') + ' | intro: ' + document.querySelector('#cfgm [data-in][aria-pressed="true"]').textContent));
  await p.screenshot({ path:'/home/claude/t/H6.png' });
  await p.evaluate(() => document.querySelector('#cfgm [data-close]').click()); await p.waitForTimeout(500);
  await p.fill('#launchInp', 'pregunta desde la portada'); await p.evaluate(() => document.querySelector('#launchGo').click()); await p.waitForTimeout(9000);
  console.log('H-pregunta', JSON.stringify({ url: p.url().split('/').pop().slice(0, 40), mensajes: await p.evaluate(() => [...document.querySelectorAll('.m.user')].map(x => x.textContent.replace(/\s+/g, ' ')).join(' | ')) }));
  await p.context().close();
  // I: primera visita: el logo aterriza en la bienvenida
  p = await page(b, errs, { tag:'I' });
  await p.goto(base + 'index.html');
  for (let i = 0; i < 30 && !(await p.$('#authm')); i++) await p.waitForTimeout(400);
  await p.waitForTimeout(1500);
  await p.screenshot({ path:'/home/claude/t/I6.png' });
  console.log('I-bienvenida', JSON.stringify(await p.evaluate(() => ({ intro: !!document.querySelector('#intro'), palabra: getComputedStyle(document.querySelector('#authm .word')).visibility, pagina: getComputedStyle(document.querySelector('main')).opacity }))));
  await p.context().close();
  console.log('ERRORS', JSON.stringify(errs, null, 1));
  await b.close();
})().catch(e => { console.log('FATAL', e.message.split('\n').slice(0, 3).join(' | ')); process.exit(1); });
