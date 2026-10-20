const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8765/';
const PUTER = `window.puter = { auth:{ isSignedIn:()=>false, signIn:async()=>({}) }, ai:{ listModels: async () => [], chat: async () => ({}) } };`;
async function page(b, errs, tag, seed){
  const ctx = await b.newContext({ viewport:{ width:1280, height:860 } });
  await ctx.addInitScript("try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1');" + (seed || '') + "}catch(e){}");
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ' ' + e.message));
  await p.route('**/*', r => { const u = r.request().url(); if (u.startsWith(base)) return r.continue(); if (u.includes('js.puter.com')) return r.fulfill({ contentType:'text/javascript', body:PUTER }); return r.abort(); });
  return p;
}
const click = (p, s) => p.evaluate(s => { const e = document.querySelector(s); if (!e) throw new Error('no hay ' + s); e.click(); }, s);
const txt = (p, s) => p.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, ' ').trim() : '(no hay ' + s + ')'; }, s);
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const errs = [];
  const own = await fetch(base + 'api/auth', { method:'POST', headers:{ 'content-type':'application/json', 'x-forwarded-for':'5.5.5.5' }, body:JSON.stringify({ mode:'signup', user:'sammueladmin', pass:'zflow-brilla-12', setup:'codigo-de-dueno-123' }) }).then(r => r.json());
  /* ZFlow pega las llaves desde su cuenta */
  let p = await page(b, errs, 'A', "localStorage.setItem('synthz:sess','" + own.token + "');");
  await p.goto(base + 'chat.html'); await p.waitForTimeout(4000);
  await p.evaluate(() => { const c = document.querySelector('#conn #cClose, #conn [data-close]'); if (c) c.click(); }); await p.waitForTimeout(500);
  await click(p, '#accBtn'); await p.waitForSelector('#aTrial .trow2', { timeout:10000 });
  console.log('A-antes:', await txt(p, '#aTrial'));
  await click(p, '#aTrial summary'); await p.waitForTimeout(700);
  await p.fill('[data-tk2=groq]', 'gsk_prueba'); await p.fill('[data-tk2=mistral]', 'mstr_prueba'); await p.fill('[data-tk2=cloudflare]', 'cfat_prueba');
  await click(p, '[data-tr=save]'); await p.waitForTimeout(2500);
  console.log('A-después:', await txt(p, '#aTrial'), '| rango:', await txt(p, '#acc .rolep'));
  await p.screenshot({ path:'/home/claude/t/T1.png' });
  await p.context().close();
  /* una persona nueva, sin cuenta ni IA conectada, en la prueba guiada */
  p = await page(b, errs, 'B');
  await p.goto(base + 'chat.html?prueba=1'); await p.waitForTimeout(4000);
  await p.evaluate(() => { const c = document.querySelector('#conn #cClose, #conn [data-close]'); if (c) c.click(); }); await p.waitForTimeout(600);
  console.log('B-barra:', await txt(p, '#trialBar'), '| estado:', await txt(p, '#now'), '| modelo:', await txt(p, '#curName'));
  for (let i = 0; i < 5; i++){ await p.fill('#inp', 'pregunta ' + i); await p.press('#inp', 'Enter'); await p.waitForTimeout(2200); }
  console.log('B-respuesta:', await p.evaluate(() => { const m = [...document.querySelectorAll('.m')].filter(x => !x.classList.contains('err')).pop(); return m.innerText.replace(/\s+/g, ' ').slice(0, 160); }));
  console.log('B-barra al final:', await txt(p, '#trialBar'), '| SynXCoin\'s personales:', await p.evaluate(() => SZ.totalAll()));
  await p.screenshot({ path:'/home/claude/t/T2.png' });
  await p.waitForTimeout(1800);
  console.log('B-6º (bloqueo):', JSON.stringify(await p.evaluate(() => ({ locked:document.body.classList.contains('locked'), ro:document.querySelector('#inp').readOnly, titulo:document.querySelector('#lockT').textContent }))));
  await p.evaluate(() => window.SynthFlowTrial.exit(true)); await p.waitForTimeout(800);
  console.log('B-salir:', await p.evaluate(() => document.querySelector('#trialBar').hidden), '| modelo:', await txt(p, '#curName'));
  console.log('ERRORS', JSON.stringify(errs));
  await b.close();
})().catch(e => { console.log('FATAL', e.message.split('\n').slice(0, 2).join(' | ')); process.exit(1); });
