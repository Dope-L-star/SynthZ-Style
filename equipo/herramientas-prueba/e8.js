/* Cuentas con usuario y contraseña, sin Google ni SYNTHZ_SECRET (servidor en modo SIMPLE) */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8765/';
const H = { 'access-control-allow-origin':'*', 'access-control-allow-headers':'*' };
const ORM = JSON.stringify({ data:[
  { id:'apodex/apodex-1.1-mini:free', name:'Apodex: Apodex 1.1 Mini (free)', context_length:262144, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:['reasoning'] },
  { id:'qwen/qwen3-coder:free', name:'Qwen: Qwen3 Coder (free)', context_length:262144, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:[] } ] });
const PUTER = `window.puter = { auth:{ isSignedIn:()=>true, signIn:async()=>({}) }, ai:{ listModels: async () => [{ id:'openai/gpt-5.6-luna', provider:'openai', name:'GPT 5.6 Luna', context:400000 }],
  chat: async () => ({ [Symbol.asyncIterator]: async function*(){ yield { type:'text', text:'Respuesta de Puter.' }; } }) } };`;
const dump = () => fetch('http://localhost:8799/dump').then(r => r.json());
const seen = "try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1')}catch(e){}";
async function page(b, errs, tag, seed){
  const ctx = await b.newContext({ viewport:{ width:1280, height:800 }, acceptDownloads:true });
  if (seed) await ctx.addInitScript(seed);
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(tag + ' PAGEERROR ' + (e.stack || e.message).split('\n').slice(0, 2).join(' | ')));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errs.push(tag + ' CONSOLE ' + m.text().slice(0, 200)); });
  await p.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith(base) || u.startsWith('http://localhost:8799')) return r.continue();
    if (u.includes('js.puter.com')) return r.fulfill({ contentType:'text/javascript', body:PUTER });
    if (u.includes('accounts.google.com')){ errs.push(tag + ' cargó Google sin necesidad'); return r.abort(); }
    if (u.includes('openrouter.ai/api/v1/models')) return r.fulfill({ headers:H, contentType:'application/json', body:ORM });
    return r.abort();
  });
  return p;
}
const ev = (p, f, a) => p.evaluate(f, a);
const click = (p, s) => p.evaluate(s => { const e = document.querySelector(s); if (!e) throw new Error('no hay ' + s); e.click(); }, s);
const wait = (p, s, ms = 12000) => p.waitForSelector(s, { timeout:ms, state:'attached' });
const txt = (p, s) => p.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : '(no hay ' + s + ')'; }, s);
async function signup(p, box, user, pass, name){
  await click(p, box + ' [data-m="signup"]'); await p.waitForTimeout(300);
  await p.fill(box + ' input[name=user]', user); if (name) await p.fill(box + ' input[name=name]', name);
  await p.fill(box + ' input[name=pass]', pass); await p.waitForTimeout(100);
  const s = await ev(p, b => document.querySelector(b + ' .lstr').dataset.s + ' ' + document.querySelector(b + ' .lstr span').textContent, box);
  await click(p, box + ' .lgo'); await wait(p, box + ' .rccode');
  return s;
}
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const errs = [];
  /* ---- 1. primera visita: crear cuenta en la bienvenida ---- */
  let p = await page(b, errs, '1');
  await p.goto(base + 'index.html'); await wait(p, '#authm .lbox', 30000); await p.waitForTimeout(900);
  console.log('1-bienvenida', JSON.stringify(await ev(p, () => ({ google:!!document.querySelector('#authm .gbtn'), tabs:[...document.querySelectorAll('#authm .lseg button')].map(x => x.textContent), texto:document.querySelector('#authm .tb p').textContent.slice(0, 70) }))));
  await p.screenshot({ path:'/home/claude/t/P1.png' });
  await click(p, '#authm [data-m="signup"]'); await p.waitForTimeout(200);
  await p.fill('#authm input[name=user]', 'Sam Z!'); console.log('1-usuario-limpio', await ev(p, () => document.querySelector('#authm input[name=user]').value));
  await p.fill('#authm input[name=user]', 'sam'); await p.fill('#authm input[name=pass]', '123'); await click(p, '#authm .lgo'); await p.waitForTimeout(300);
  console.log('1-error-corta', await txt(p, '#authm .lerr'));
  await p.fill('#authm input[name=user]', '');
  const fuerza = await signup(p, '#authm', 'sam_z', 'Synth-Z-2026!', 'Sam');
  console.log('1-fuerza', fuerza);
  const code1 = await txt(p, '#authm .rccode');
  console.log('1-codigo', code1, '| continuar bloqueado:', await ev(p, () => document.querySelector('#authm [data-go]').disabled));
  await p.screenshot({ path:'/home/claude/t/P2.png' });
  const [dl] = await Promise.all([p.waitForEvent('download'), click(p, '#authm [data-dl]')]);
  console.log('1-descarga', dl.suggestedFilename());
  await click(p, '#authm .rcchk input'); await click(p, '#authm [data-go]'); await wait(p, '#svm', 10000);
  console.log('1-cuenta', JSON.stringify(await ev(p, () => ({ ready:SZ.ACC.ready, handle:SZ.accHandle(), name:SZ.accName() }))), '| luego la encuesta: ok');
  const d1 = await dump();
  console.log('1-servidor', JSON.stringify({ usuario:d1.db.some(([k]) => k === 'n:sam_z'), contraseñaEnClaro:JSON.stringify(d1.db).includes('Synth-Z-2026!'), codigoEnClaro:JSON.stringify(d1.db).includes(code1), claveAuto:d1.db.some(([k]) => k === 'cfg:secret') }));
  await p.context().close();
  /* ---- 2. otro dispositivo: entrar, contraseña mala, seguridad ---- */
  p = await page(b, errs, '2', seen);
  await p.goto(base + 'chat.html'); await p.waitForTimeout(4000);
  await click(p, '#accBtn'); await wait(p, '#acc .lbox'); await p.waitForTimeout(400);
  await p.fill('#acc input[name=user]', '@SAM_Z'); await p.fill('#acc input[name=pass]', 'mala-clave-1'); await click(p, '#acc .lgo'); await p.waitForTimeout(1500);
  console.log('2-mala', await txt(p, '#acc .lerr'));
  await p.fill('#acc input[name=pass]', 'Synth-Z-2026!'); await click(p, '#acc .eye');
  console.log('2-ver-contraseña', await ev(p, () => document.querySelector('#acc input[name=pass]').type));
  await click(p, '#acc .lgo'); await wait(p, '#aSec', 15000); await p.waitForTimeout(800);
  console.log('2-dentro', await txt(p, '#acc .pfme span'));
  await click(p, '#aSec'); await wait(p, '#secm form');
  await p.fill('#secm input[name=old]', 'Synth-Z-2026!'); await click(p, '#secm [data-k="code"]'); await wait(p, '#secm .rccode');
  const code2 = await txt(p, '#secm .rccode');
  console.log('2-codigo-nuevo', code2 !== code1, await txt(p, '#secm h4'));
  await click(p, '#secm .rcchk input'); await click(p, '#secm [data-go]'); await p.waitForTimeout(700);
  /* equipo */
  await wait(p, '#acc #tNewName', 8000);
  await p.fill('#tNewName', 'Los Synth'); await click(p, '#acc [data-ta="create"]'); await wait(p, '#acc [data-ta="key"]');
  await p.fill('#acc [data-tk]', 'sk-or-v1-teamKEY1234567890'); await click(p, '#acc [data-ta="key"]'); await wait(p, '#acc .tmkey');
  console.log('2-mi-usuario', await txt(p, '#acc .tmme'));
  await p.fill('#acc [data-te]', '@luna'); await click(p, '#acc [data-ta="invite"]'); await p.waitForTimeout(1200);
  console.log('2-invitar-inexistente', await txt(p, '#toast, .toast'));
  await p.screenshot({ path:'/home/claude/t/P3.png' });
  /* ---- 3. Luna crea su cuenta desde el chat ---- */
  const q = await page(b, errs, '3', seen);
  await q.goto(base + 'chat.html'); await q.waitForTimeout(4000);
  await click(q, '#accBtn'); await wait(q, '#acc .lbox'); await q.waitForTimeout(400);
  await signup(q, '#acc', 'luna', 'estrella-del-sur', '');
  const codeL = await txt(q, '#acc .rccode');
  await click(q, '#acc .rcchk input'); await click(q, '#acc [data-go]'); await wait(q, '#aSec', 15000);
  console.log('3-luna', await txt(q, '#acc .pfme span'));
  /* Sam la invita */
  await p.fill('#acc [data-te]', 'Luna'); await click(p, '#acc [data-ta="invite"]'); await p.waitForTimeout(1500);
  console.log('2-invitada', await txt(p, '#acc .tmc'));
  await click(q, '#aClose'); await q.waitForTimeout(600); await click(q, '#accBtn'); await wait(q, '#acc [data-ta="accept"]', 15000);
  console.log('3-invitacion', await txt(q, '#acc .tminv p'));
  await click(q, '#acc [data-ta="accept"]'); await wait(q, '#acc [data-ta="use"]', 15000);
  await click(q, '#acc [data-ta="use"]'); await q.waitForTimeout(500); await click(q, '#aClose'); await q.waitForTimeout(700);
  await q.evaluate(() => [...document.querySelectorAll('#mlist .mi')].find(m => /apodex/.test(m.dataset.id)).click()); await q.waitForTimeout(600);
  await q.fill('#inp', 'hola equipo'); await q.press('#inp', 'Enter'); await q.waitForTimeout(4000);
  const d3 = await dump();
  console.log('3-chat-equipo', await ev(q, () => [...document.querySelectorAll('.m')].slice(-1)[0].querySelector('.body').textContent), '| llave del dueño usada:', (d3.orLog.slice(-1)[0] || {}).auth === 'Bearer sk-or-v1-teamKEY1234567890', '| llave en el navegador:', await ev(q, () => JSON.stringify(localStorage).includes('teamKEY')));
  await q.context().close();
  /* ---- 4. Luna olvidó su contraseña ---- */
  const r = await page(b, errs, '4', seen);
  await r.goto(base + 'chat.html'); await r.waitForTimeout(4000);
  await click(r, '#accBtn'); await wait(r, '#acc .lbox'); await r.waitForTimeout(400);
  await r.fill('#acc input[name=user]', 'luna'); await click(r, '#acc [data-forgot]'); await r.waitForTimeout(300);
  console.log('4-recuperar', await txt(r, '#acc .ltop'), '| usuario conservado:', await ev(r, () => document.querySelector('#acc input[name=user]').value));
  await r.fill('#acc input[name=code]', 'AAAA-BBBB-CCCC-DDDD'); await r.fill('#acc input[name=pass]', 'luna-nueva-clave'); await click(r, '#acc .lgo'); await r.waitForTimeout(1200);
  console.log('4-codigo-malo', await txt(r, '#acc .lerr'));
  await r.fill('#acc input[name=code]', codeL.toLowerCase()); await r.fill('#acc input[name=pass]', 'cometa-azul-99'); await click(r, '#acc .lgo'); await wait(r, '#acc .rccode');
  console.log('4-recuperada', await txt(r, '#acc .rcv h4'));
  await click(r, '#acc .rcchk input'); await click(r, '#acc [data-go]'); await wait(r, '#aSec', 15000);
  await wait(r, '#acc .tmc h4', 10000).catch(() => {});
  console.log('4-dentro', await txt(r, '#acc .pfme span'), '| sus equipos siguen:', await txt(r, '#acc .tmc h4'));
  await r.screenshot({ path:'/home/claude/t/P4.png' });
  await r.context().close();
  await p.context().close();
  console.log('ERRORS', JSON.stringify(errs, null, 1));
  await b.close();
})().catch(e => { console.log('FATAL', e.message.split('\n').slice(0, 3).join(' | ')); process.exit(1); });
