const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8765/';
const mkPuter = funds => `(function(){
  window.__calls = [];
  window.puter = { auth:{ isSignedIn:()=>true, signIn:async()=>1 },
    ai:{ listModels: async () => [{ id:'openai/gpt-5.6-luna', provider:'openai', name:'GPT 5.6 Luna', context:400000 }],
      chat: async (msgs, o) => { window.__calls.push({ msgs: JSON.parse(JSON.stringify(msgs)), o }); ${funds ? "throw { error:{ code:'insufficient_funds', message:'Insufficient funds' } };" : "return { message:{ content:'Respuesta número ' + window.__calls.length + ' ' + 'x'.repeat(200) } };"} } } };
})();`;
async function page(b, errs, funds){
  const ctx = await b.newContext({ viewport:{ width:1280, height:800 } });
  await ctx.addInitScript("try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1')}catch(e){}");
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERROR ' + (e.stack || e.message).split('\n').slice(0, 2).join(' | ')));
  p.on('dialog', d => d.accept());
  await p.route('**/*', r => { const u = r.request().url(); if (u.startsWith(base)) return r.continue();
    if (u.includes('js.puter.com')) return r.fulfill({ contentType:'text/javascript', body:mkPuter(funds) });
    return r.abort(); });
  await p.goto(base + 'chat.html'); await p.waitForTimeout(5000);
  return p;
}
const send = async (p, t) => { await p.fill('#inp', t); await p.press('#inp', 'Enter'); await p.waitForTimeout(2600); };
const calls = p => p.evaluate(() => window.__calls.map(c => ({ n: c.msgs.length, roles: c.msgs.map(m => m.role).join(','), chars: JSON.stringify(c.msgs).length, hasFile: JSON.stringify(c.msgs).includes('LINEA-DEL-ARCHIVO'), max: c.o.max_tokens || 0 })));
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const errs = [];
  let p = await page(b, errs, false);
  console.log('foot0', await p.evaluate(() => document.querySelector('#sideFoot').textContent));
  // L: archivo solo se envía completo en su último mensaje
  await p.setInputFiles('#fileIn', { name:'notas.txt', mimeType:'text/plain', buffer: Buffer.from(('LINEA-DEL-ARCHIVO ' + 'contenido '.repeat(40) + '\n').repeat(60)) });
  await p.waitForTimeout(800);
  await p.fill('#inp', 'resume el archivo'); await p.waitForTimeout(300);
  console.log('hint', await p.evaluate(() => document.querySelector('#hintRight').textContent));
  await p.press('#inp', 'Enter'); await p.waitForTimeout(2600);
  await send(p, 'y ahora dame un título');
  await p.setInputFiles('#fileIn', { name:'otro.txt', mimeType:'text/plain', buffer: Buffer.from('OTRO archivo distinto') }); await p.waitForTimeout(600);
  await send(p, 'compara con este');
  console.log('L-archivos', JSON.stringify(await calls(p)));
  // M: caché — limpiar y repetir la misma pregunta inicial
  await p.evaluate(() => document.querySelector('#moreBtn').click()); await p.waitForTimeout(400); await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Borrar este chat' && b.offsetParent).click()); await p.waitForTimeout(400); await p.evaluate(() => document.querySelector('.szc [data-ok]').click()); await p.waitForTimeout(800);
  await send(p, 'pregunta repetida');
  await p.evaluate(() => document.querySelector('#moreBtn').click()); await p.waitForTimeout(400); await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Borrar este chat' && b.offsetParent).click()); await p.waitForTimeout(400); await p.evaluate(() => document.querySelector('.szc [data-ok]').click()); await p.waitForTimeout(800);
  await send(p, 'pregunta repetida');
  const nCalls = (await calls(p)).length;
  console.log('M-cache', JSON.stringify({ llamadas: nCalls, meta: await p.evaluate(() => [...document.querySelectorAll('.m')].slice(-1)[0].textContent.slice(-60)) }));
  // N: modo ahorro
  await p.evaluate(() => document.querySelector('#saverBtn').click()); await p.waitForTimeout(300);
  for (let i = 0; i < 5; i++) await send(p, 'mensaje de prueba ' + i);
  const c = await calls(p);
  console.log('N-ahorro', JSON.stringify(c.slice(-1)));
  // O: límite diario
  await p.evaluate(() => document.querySelector('#sxBtn').click()); await p.waitForTimeout(800);
  console.log('O-panel', await p.evaluate(() => document.querySelector('#sx .tcard').textContent.replace(/\s+/g, ' ').slice(0, 260)));
  await p.screenshot({ path:'/home/claude/t/O.png' });
  await p.evaluate(() => document.querySelector('#sxPre [data-v="20000"]').click()); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('#sxClose').click()); await p.waitForTimeout(600);
  await p.evaluate(() => { const L = JSON.parse(localStorage.getItem('synthz:ledger')); const dev = Object.values(L.dev)[0]; const u0 = Object.values(dev)[0]; Object.keys(u0.days).forEach(k => u0.days[k] = 25000); localStorage.setItem('synthz:ledger', JSON.stringify(L)); });
  await p.reload(); await p.waitForTimeout(5000);
  const before = (await calls(p)).length;
  await send(p, 'esto pasa el límite');
  console.log('O-budget', JSON.stringify({ modal: await p.evaluate(() => document.querySelector('#sx h3') && document.querySelector('#sx h3').textContent), llamadas: (await calls(p)).length - before, foot: await p.evaluate(() => document.querySelector('#sideFoot').textContent) }));
  await p.screenshot({ path:'/home/claude/t/O2.png' });
  await p.evaluate(() => document.querySelector('#sxGo').click()); await p.waitForTimeout(700);
  await send(p, 'esto pasa el límite');
  console.log('O-seguir', (await calls(p)).length - before);
  await p.context().close();
  // P: Puter sin créditos → aviso grande
  p = await page(b, errs, true);
  await send(p, 'hola');
  await p.waitForTimeout(600);
  console.log('P-funds', await p.evaluate(() => document.querySelector('#sx h3') && document.querySelector('#sx h3').textContent));
  await p.context().close();
  // Q: index
  p = await (await b.newContext()).newPage(); p.on('pageerror', e => errs.push('INDEX ' + e.message));
  await p.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  await p.goto(base + 'index.html'); await p.waitForTimeout(10000);
  console.log('Q-index', await p.evaluate(() => document.querySelector('.pill-total').textContent + ' | ' + document.querySelector('.hero-meta').textContent));
  console.log('ERRORS', JSON.stringify(errs, null, 1));
  await b.close();
})().catch(e => { console.log('FATAL', e.message.split('\n').slice(0, 3).join(' | ')); process.exit(1); });
