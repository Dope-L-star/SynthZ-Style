const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8765/';
const PUTER = `window.puter = { auth:{ isSignedIn:()=>true, signIn:async()=>({}) }, ai:{ listModels: async () => [{ id:'openai/gpt-5.6-luna', provider:'openai', name:'GPT 5.6 Luna', context:400000 }, { id:'openai/gpt-5.4-nano', provider:'openai', name:'GPT 5.4 Nano', context:400000 }], chat: async () => ({ [Symbol.asyncIterator]: async function*(){ yield { type:'text', text:'x'.repeat(300000) }; } }) } };`;
async function page(b, errs, tag, seed){
  const ctx = await b.newContext({ viewport:{ width:1280, height:860 } });
  await ctx.addInitScript("try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1');" + (seed || '') + "}catch(e){}");
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ' ' + e.message));
  const log = []; p.on('request', r => { if (r.url().includes('/api/')) log.push(r.method() + ' ' + r.url().split('/api/')[1]); });
  await p.route('**/*', r => { const u = r.request().url(); if (u.startsWith(base)) return r.continue(); if (u.includes('js.puter.com')) return r.fulfill({ contentType:'text/javascript', body:PUTER }); return r.abort(); });
  p._log = log; return p;
}
const click = (p, s) => p.evaluate(s => { const e = document.querySelector(s); if (!e) throw new Error('no hay ' + s); e.click(); }, s);
const wait = (p, s, ms = 12000) => p.waitForSelector(s, { timeout:ms, state:'attached' });
const txt = (p, s) => p.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : '(no hay ' + s + ')'; }, s);
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const errs = [];
  /* 1. el Dueño crea su cuenta reservada */
  let p = await page(b, errs, '1');
  await p.goto(base + 'chat.html'); await p.waitForTimeout(3500);
  await click(p, '#accBtn'); await wait(p, '#acc .lbox'); await click(p, '#acc [data-m="signup"]'); await p.waitForTimeout(300);
  await p.fill('#acc input[name=user]', 'SammuerSynth'); await p.fill('#acc input[name=pass]', 'mi-clave-de-dueno-1'); await click(p, '#acc .lgo'); await p.waitForTimeout(1500);
  console.log('1-reservado:', await txt(p, '#acc .lerr'), '| campo de código:', await p.evaluate(() => !!document.querySelector('#acc input[name=setup]')));
  await p.fill('#acc input[name=setup]', 'codigo-de-dueno-123'); await click(p, '#acc .lgo'); await wait(p, '#acc .rccode');
  await click(p, '#acc .rcchk input'); await click(p, '#acc [data-go]'); await wait(p, '#aSec', 15000); await p.waitForTimeout(600);
  console.log('1-dentro:', await txt(p, '#acc .pfme span'), '| nube:', await txt(p, '#acc .aspace'));
  await p.screenshot({ path:'/home/claude/t/F2a.png' });
  /* 2. cerrar sesión en todos lados (otro dispositivo también sale) */
  const tok = await p.evaluate(() => localStorage.getItem('synthz:sess'));
  const q = await page(b, errs, '2', "localStorage.setItem('synthz:sess','" + tok + "');");
  await q.goto(base + 'chat.html'); await q.waitForTimeout(4000);
  console.log('2-otro dispositivo dentro:', await q.evaluate(() => SZ.ACC.ready));
  await click(p, '#aOutAll'); await p.waitForTimeout(500); await click(p, '.szc [data-ok]'); await p.waitForTimeout(3000);
  const r2 = await fetch(base + 'api/me', { headers:{ authorization:'Bearer ' + tok } });
  console.log('2-la sesión quedó cerrada en el servidor:', r2.status === 401);
  await q.reload(); await q.waitForTimeout(3500);
  console.log('2-el otro dispositivo quedó fuera:', await q.evaluate(() => !SZ.ACC.ready));
  /* 3. borrar cuenta pide contraseña */
  const sg = await fetch(base + 'api/auth', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ mode:'signup', user:'borrame' + Date.now().toString(36).slice(-4), pass:'cielo-azul-123' }) }).then(r => r.json());
  const d = await page(b, errs, '3', "localStorage.setItem('synthz:sess','" + sg.token + "');");
  await d.goto(base + 'chat.html'); await d.waitForTimeout(4000);
  await click(d, '#accBtn'); await wait(d, '#aDel'); await click(d, '#aDel'); await d.waitForTimeout(500); await click(d, '.szc [data-ok]'); await d.waitForTimeout(700);
  await d.fill('.szc input[name=v]', 'mala-mala-11'); await click(d, '.szc [type=submit]'); await d.waitForTimeout(1500);
  console.log('3-contraseña mala:', await txt(d, '#toast'));
  await click(d, '#aDel'); await d.waitForTimeout(500); await click(d, '.szc [data-ok]'); await d.waitForTimeout(700);
  await d.fill('.szc input[name=v]', 'cielo-azul-123'); await click(d, '.szc [type=submit]'); await d.waitForTimeout(2500);
  const r3 = await fetch(base + 'api/auth', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ mode:'login', user:sg.user.username, pass:'cielo-azul-123' }) });
  console.log('3-cuenta borrada de verdad:', r3.status === 401);
  /* 4. nube llena: aviso claro y sin reintentos sin fin */
  const sq = await fetch(base + 'api/auth', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ mode:'signup', user:'llenita' + Date.now().toString(36).slice(-4), pass:'mar-grande-777' }) }).then(r => r.json());
  const f = await page(b, errs, '4', "localStorage.setItem('synthz:sess','" + sq.token + "');");
  await f.goto(base + 'chat.html'); await f.waitForTimeout(4000);
  await f.evaluate(() => [...document.querySelectorAll('#mlist .mi')].find(x => /luna/.test(x.dataset.id)).click()); await f.waitForTimeout(400);
  for (const m of ['luna', 'nano']){ await f.evaluate(m => [...document.querySelectorAll('#mlist .mi')].find(x => new RegExp(m).test(x.dataset.id)).click(), m); await f.waitForTimeout(400); await f.fill('#inp', 'llena ' + m); await f.press('#inp', 'Enter'); await f.waitForFunction(() => !document.querySelector('.now-chip.live'), null, { timeout:60000 }); await f.waitForTimeout(8000); }
  console.log('4-chats guardados localmente:', await f.evaluate(() => Object.keys(SZ.state.chats).filter(k => SZ.state.chats[k].length).length), '| err:', await f.evaluate(() => SZ.ACC.err));
  f._log.length = 0; await f.waitForTimeout(25000);
  console.log('4-aviso:', await f.evaluate(() => SZ.ACC.full ? SZ.ACC.err.slice(0, 70) : 'sin aviso'), '| peticiones en 25 s después del aviso:', f._log.filter(x => /PUT me/.test(x)).length);
  await click(f, '#accBtn'); await f.waitForTimeout(900);
  console.log('4-panel:', await txt(f, '#acc .aspace'));
  console.log('ERRORS', JSON.stringify(errs));
  await b.close();
})().catch(e => { console.log('FATAL', e.message.split('\n').slice(0, 2).join(' | ')); process.exit(1); });
