const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8765/';
const H = { 'access-control-allow-origin':'*', 'access-control-allow-headers':'*', 'access-control-allow-methods':'GET,POST' };
const ORM = JSON.stringify({ data:[
  { id:'apodex/apodex-1.1-mini:free', name:'Apodex: Apodex 1.1 Mini (free)', context_length:262144, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:['reasoning'], description:'A reasoning-first model.' },
  { id:'qwen/qwen3-coder:free', name:'Qwen: Qwen3 Coder (free)', context_length:262144, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:[] },
  { id:'meta-llama/llama-3.3-8b-instruct:free', name:'Meta: Llama 3.3 8B Instruct (free)', context_length:131072, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:[] } ] });
const PUTER = `(function(){ window.__calls = []; window.puter = { auth:{ isSignedIn:()=>true, signIn:async()=>({}) },
  ai:{ listModels: async () => [{ id:'openai/gpt-5.6-luna', provider:'openai', name:'GPT 5.6 Luna', context:400000 }, { id:'gemini-3.5-flash-lite', provider:'google', name:'Gemini 3.5 Flash Lite', context:1000000 }],
    chat: async (m, o) => { window.__calls.push(o.model); return { [Symbol.asyncIterator]: async function*(){ yield { type:'text', text:'Respuesta de Puter.' }; } }; } } }; })();`;
const GSI = `window.google = { accounts:{ id:{ initialize(o){ window.__gsi = o; }, disableAutoSelect(){},
  renderButton(el){ el.innerHTML = '<button id="fakeG" type="button">Continuar con Google</button>'; el.querySelector('#fakeG').onclick = async () => { const r = await fetch('http://localhost:8799/token?sub=' + window.__gsub + '&email=' + encodeURIComponent(window.__gmail) + '&name=' + encodeURIComponent(window.__gname)).then(r => r.json()); window.__gsi.callback({ credential:r.credential }); }; } } } };`;
const dump = () => fetch('http://localhost:8799/dump').then(r => r.json());
async function page(b, errs, o){
  const ctx = await b.newContext({ viewport:{ width:1280, height:800 } });
  await ctx.addInitScript(`window.__gsub='${o.sub}';window.__gmail='${o.email}';window.__gname='${o.name}';` + (o.seed || ''));
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(o.tag + ' PAGEERROR ' + (e.stack || e.message).split('\n').slice(0, 2).join(' | ')));
  await p.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith(base) || u.startsWith('http://localhost:8799')) return r.continue();
    if (u.includes('js.puter.com')) return r.fulfill({ contentType:'text/javascript', body:PUTER });
    if (u.includes('accounts.google.com/gsi/client')) return r.fulfill({ contentType:'text/javascript', body:GSI });
    if (u.includes('openrouter.ai/api/v1/models')) return r.fulfill({ headers:H, contentType:'application/json', body:ORM });
    return r.abort();
  });
  return p;
}
const seen = "try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1')}catch(e){}";
const ev = (p, f, a) => p.evaluate(f, a);
const click = (p, s) => p.evaluate(s => { const e = document.querySelector(s); if (!e) throw new Error('no hay ' + s); e.click(); }, s);
const wait = (p, s, ms = 12000) => p.waitForSelector(s, { timeout:ms, state:'attached' });
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const errs = [];
  /* ---------- 1. primera visita: bienvenida → Google → encuesta → recorrido con cursor guía ---------- */
  let p = await page(b, errs, { tag:'1', sub:'111', email:'sam@gmail.com', name:'Sam' });
  await p.goto(base + 'index.html'); await wait(p, '#authm', 30000); await wait(p, '#fakeG');
  console.log('1-bienvenida', await ev(p, () => document.querySelector('#authm h3').textContent + ' | ' + document.querySelector('#authm .tb p').textContent.slice(0, 60)));
  await click(p, '#fakeG'); await wait(p, '#svm');
  console.log('1-cuenta', JSON.stringify(await ev(p, () => ({ ready:SZ.ACC.ready, name:SZ.accName(), sess:!!localStorage.getItem('synthz:sess') }))));
  for (const v of ['code', 'deep', 'es', 'no']){ await p.evaluate(v => document.querySelector('#svm .svb[data-v="' + v + '"]').click(), v); await p.waitForTimeout(900); if (v === 'code') { await click(p, '#svm [data-next]'); await p.waitForTimeout(900); } }
  await click(p, '#svm [data-next]'); await p.waitForTimeout(1200);
  console.log('1-encuesta', JSON.stringify(await ev(p, () => ({ survey: JSON.parse(localStorage.getItem('synthz:v1')).survey && JSON.parse(localStorage.getItem('synthz:v1')).survey.a }))));
  await wait(p, '#ptour', 20000); await p.waitForTimeout(1600);
  console.log('1-recorrido', JSON.stringify(await ev(p, () => ({ paso:document.querySelector('#ptour .tn').textContent, guia:document.querySelector('#gcur') && document.querySelector('#gcur').classList.contains('on'), acc:document.querySelector('#accBtn').textContent }))));
  await p.screenshot({ path:'/home/claude/t/N1.png' });
  await p.context().close();
  /* ---------- 2. chat de Sam: perfil, candado de OpenRouter, Para ti, especialidad, sync ---------- */
  p = await page(b, errs, { tag:'2', sub:'111', email:'sam@gmail.com', name:'Sam', seed:seen });
  await p.goto(base + 'chat.html'); await p.waitForTimeout(4500);
  await click(p, '#accBtn'); await wait(p, '#acc #fakeG'); await click(p, '#fakeG'); await p.waitForTimeout(2500);
  await wait(p, '#aEdit'); await click(p, '#aEdit'); await wait(p, '#pfm');
  await p.fill('#pfName', 'Sammy'); await p.fill('#pfSt', 'creando SynthZ'); await click(p, '#pfm [data-emo="🚀"]'); await click(p, '#pfm [data-col="coral"]'); await click(p, '#pfOk'); await p.waitForTimeout(1500);
  const d1 = await dump();
  console.log('2-perfil', JSON.stringify({ server: JSON.parse((d1.db.find(([k]) => k === 'p:g111') || [, '{}'])[1]), boton: await ev(p, () => document.querySelector('#accBtn').textContent) }));
  await p.screenshot({ path:'/home/claude/t/N2.png' });
  await click(p, '#aClose'); await p.waitForTimeout(600);
  console.log('2-candado', JSON.stringify(await ev(p, () => ({ lock:document.querySelector('#provSeg [data-p="or"]').classList.contains('lock'), fila:!!document.querySelector('#mlist .olock'), ex:[...document.querySelectorAll('#mlist .mi-ex')].map(x => x.textContent).slice(0, 3) }))));
  await click(p, '#provSeg [data-p="or"]'); await wait(p, '#org');
  console.log('2-guia', await ev(p, () => [...document.querySelectorAll('#org .ogs b')].map(x => x.textContent).join(' → ')));
  await click(p, '#org [data-close]'); await p.waitForTimeout(500);
  await click(p, '.fchip[data-k="forme"]'); await p.waitForTimeout(500);
  console.log('2-para-ti', await ev(p, () => [...document.querySelectorAll('#mlist .mi')].map(x => x.dataset.id).join(', ')));
  await click(p, '.fchip[data-k="forme"]'); await p.waitForTimeout(300);
  await p.fill('#inp', 'hola desde Sam'); await p.press('#inp', 'Enter'); await p.waitForTimeout(9000);
  let d2 = await dump(); const hk = d2.hashes.find(([k]) => k === 'c:g111');
  console.log('2-sync', JSON.stringify(hk && hk[1]));
  await p.evaluate(() => document.querySelector('#thList .thi [data-del]').click()); await p.waitForTimeout(500); await click(p, '.szc [data-ok]'); await p.waitForTimeout(8500);
  d2 = await dump(); console.log('2-borrado-en-la-nube', JSON.stringify((d2.hashes.find(([k]) => k === 'c:g111') || [])[1]));
  /* el logo deja el péndulo cuando lo señalas */
  const bk = await (await p.$('#backLink')).boundingBox(); await p.mouse.move(bk.x + 20, bk.y + bk.height / 2); await p.waitForTimeout(500);
  console.log('2-logo', JSON.stringify(await ev(p, () => { const c = document.querySelector('#cl .mark .sw1'); return { clon: c ? getComputedStyle(c).animationName : 'sin clon', escala: document.querySelector('#cl .mark') ? getComputedStyle(document.querySelector('#cl .mark')).transform : '' }; })));
  /* el botón se mueve y el mouse ya no está: el vidrio lo suelta */
  const sb = await (await p.$('#cfgBtn')).boundingBox(); await p.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2); await p.waitForTimeout(400);
  const before = await ev(p, () => document.querySelector('#cr').className);
  await ev(p, () => { document.querySelector('#cfgBtn').style.transform = 'translateX(200px)'; }); await p.waitForTimeout(500);
  console.log('2-boton-movido', JSON.stringify({ antes:before, despues:await ev(p, () => document.querySelector('#cr').className + ' | label:' + getComputedStyle(document.querySelector('#cl')).opacity) }));
  await ev(p, () => { document.querySelector('#cfgBtn').style.transform = ''; });
  /* scroll suave dentro de una ventana */
  await click(p, '#accBtn'); await wait(p, '#aTeams .tinv', 8000); await p.waitForTimeout(800);
  const tc = await (await p.$('#acc .tcard')).boundingBox(); await p.mouse.move(tc.x + 100, tc.y + 200);
  const s0 = await ev(p, () => document.querySelector('#acc .tcard').scrollTop); await p.mouse.wheel(0, 300); await p.waitForTimeout(50);
  const s1 = await ev(p, () => document.querySelector('#acc .tcard').scrollTop); await p.waitForTimeout(900);
  console.log('2-scroll-ventana', JSON.stringify({ s0, a50ms:Math.round(s1), final:Math.round(await ev(p, () => document.querySelector('#acc .tcard').scrollTop)), dims:await ev(p, () => { const c = document.querySelector('#acc .tcard'), s = getComputedStyle(c); return [c.scrollHeight, c.clientHeight, s.overflowY, document.elementFromPoint(0,0) && 1]; }) }));
  /* equipo: crear, compartir llave, invitar */
  await p.fill('#tNewName', 'Los Synth'); await click(p, '#acc [data-ta="create"]'); await wait(p, '#acc [data-ta="key"]');
  await p.fill('#acc [data-tk]', 'sk-or-v1-teamKEY1234567890'); await click(p, '#acc [data-ta="key"]'); await wait(p, '#acc .tmkey');
  await p.fill('#acc [data-te]', 'luna@gmail.com'); await click(p, '#acc [data-ta="invite"]'); await p.waitForTimeout(1500);
  console.log('2-equipo', await ev(p, () => [...document.querySelectorAll('#acc .tmc .tmkey, #acc .tmc .tmrow .tx')].map(x => x.textContent.replace(/\s+/g, ' ')).join(' | ')));
  await p.screenshot({ path:'/home/claude/t/N3.png' });
  await p.context().close();
  /* ---------- 3. Luna: acepta, usa el OpenRouter del equipo sin ver la llave ---------- */
  p = await page(b, errs, { tag:'3', sub:'222', email:'luna@gmail.com', name:'Luna', seed:seen });
  await p.goto(base + 'chat.html'); await p.waitForTimeout(4500);
  await click(p, '#accBtn'); await wait(p, '#acc #fakeG'); await click(p, '#fakeG'); await wait(p, '#acc [data-ta="accept"]', 15000);
  console.log('3-invitacion', await ev(p, () => document.querySelector('#acc .tminv p').textContent));
  await click(p, '#acc [data-ta="accept"]'); await wait(p, '#acc [data-ta="use"]', 15000);
  await click(p, '#acc [data-ta="use"]'); await p.waitForTimeout(500); await click(p, '#aClose'); await p.waitForTimeout(700);
  console.log('3-desbloqueado', await ev(p, () => !document.querySelector('#provSeg [data-p="or"]').classList.contains('lock')));
  await p.evaluate(() => { const x = [...document.querySelectorAll('#mlist .mi')].find(m => /apodex/.test(m.dataset.id)); x.click(); }); await p.waitForTimeout(600);
  await p.fill('#inp', 'hola equipo'); await p.press('#inp', 'Enter'); await p.waitForTimeout(4000);
  const d3 = await dump();
  console.log('3-respuesta', await ev(p, () => [...document.querySelectorAll('.m')].slice(-1)[0].querySelector('.body').textContent + ' || meta: ' + ([...document.querySelectorAll('.m')].slice(-1)[0].querySelector('.meta') || {}).textContent), '| llave usada:', JSON.stringify(d3.orLog.slice(-1)));
  console.log('3-llave-en-navegador', await ev(p, () => JSON.stringify(localStorage).includes('teamKEY') || document.documentElement.outerHTML.includes('teamKEY')));
  await p.context().close();
  console.log('ERRORS', JSON.stringify(errs, null, 1));
  await b.close();
})().catch(e => { console.log('FATAL', e.message.split('\n').slice(0, 3).join(' | ')); process.exit(1); });
