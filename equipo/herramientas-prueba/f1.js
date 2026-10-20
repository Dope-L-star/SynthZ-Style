const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8765/';
const H = { 'access-control-allow-origin':'*', 'access-control-allow-headers':'*' };
const ORM = JSON.stringify({ data:[
  { id:'apodex/apodex-1.1-mini:free', name:'Apodex: Apodex 1.1 Mini (free)', context_length:262144, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text'], output_modalities:['text'] }, supported_parameters:['reasoning'] },
  { id:'mistralai/mistral-small-3.2:free', name:'Mistral: Mistral Small 3.2 (free)', context_length:131072, pricing:{ prompt:'0', completion:'0' }, architecture:{ input_modalities:['text','image'], output_modalities:['text'] }, supported_parameters:[] } ] });
const PUTER = `window.puter = { auth:{ isSignedIn:()=>true, signIn:async()=>({}) }, ai:{ listModels: async () => [], chat: async () => ({}) } };`;
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{ width:1280, height:860 } }); const errs = [];
  await ctx.addInitScript("try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1');if(!localStorage.getItem('synthz:v1'))localStorage.setItem('synthz:v1',JSON.stringify({keys:{openrouter:'sk-or-v1-x'},model:{openrouter:'or:apodex/apodex-1.1-mini:free'},models:{},usage:{},chats:{},fav:[],cmp:[]}))}catch(e){}");
  await ctx.route('**/*', r => { const u = r.request().url();
    if (u.startsWith(base)) return r.continue();
    if (u.includes('js.puter.com')) return r.fulfill({ contentType:'text/javascript', body:PUTER });
    if (u.includes('/api/v1/models')) return r.fulfill({ headers:H, contentType:'application/json', body:ORM });
    return r.abort(); });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(base + 'chat.html'); await p.waitForTimeout(3500);
  /* favoritos */
  await p.evaluate(() => [...document.querySelectorAll('#mlist .mi')].find(x => /mistral/.test(x.dataset.id)).querySelector('.star').click()); await p.waitForTimeout(700);
  await p.reload(); await p.waitForTimeout(3000);
  await p.evaluate(() => document.querySelector('.fchip[data-k="fav"]').click()); await p.waitForTimeout(500);
  console.log('favorito tras recargar y filtro Favoritos:', await p.evaluate(() => [...document.querySelectorAll('#mlist .mi')].map(x => x.dataset.id).join(',')));
  await p.evaluate(() => document.querySelector('.fchip[data-k="fav"]').click());
  /* filtro sin resultados */
  await p.evaluate(() => (document.querySelector('#curChip') || document.querySelector('#cPick')).click()); await p.waitForTimeout(600);
  await p.fill('#q', 'zzzz-no-existe'); await p.waitForTimeout(500);
  console.log('lista vacía:', await p.evaluate(() => document.querySelector('.mnone') ? document.querySelector('.mnone').innerText.replace(/\n+/g, ' | ') : 'sin estado vacío'));
  await p.fill('#q', ''); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('#sideClose').click()); await p.waitForTimeout(500);
  /* imagen a un modelo sin visión */
  await p.setInputFiles('#fileIn', { name:'foto.png', mimeType:'image/png', buffer:PNG }); await p.waitForTimeout(800);
  await p.fill('#inp', '¿qué ves?'); await p.press('#inp', 'Enter'); await p.waitForTimeout(800);
  console.log('imagen a modelo sin visión:', await p.evaluate(() => document.querySelector('#toast').textContent), '| no se envió:', await p.evaluate(() => !document.querySelector('.m.user, .m.u')));
  /* archivo que no se puede leer */
  await p.setInputFiles('#fileIn', { name:'programa.exe', mimeType:'application/octet-stream', buffer:Buffer.from('MZ') }); await p.waitForTimeout(600);
  console.log('archivo no compatible:', await p.evaluate(() => document.querySelector('#toast').textContent));
  /* preferencias: configuración guardada */
  await p.evaluate(() => document.querySelector('#cfgBtn').click()); await p.waitForTimeout(800);
  await p.evaluate(() => document.querySelector('#cfgm .cfgsw[data-k="bg"]').click()); await p.evaluate(() => document.querySelector('#cfgOk').click()); await p.waitForTimeout(1500);
  await p.reload(); await p.waitForTimeout(2500);
  console.log('configuración guardada tras recargar (fondo animado):', await p.evaluate(() => SZ.CFG.bg));
  console.log('ERRORS', JSON.stringify(errs));
  await b.close();
})().catch(e => { console.log('FATAL', e.message.split('\n')[0]); process.exit(1); });
