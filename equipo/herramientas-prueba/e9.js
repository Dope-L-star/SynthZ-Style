const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8765/';
const PUTER = `window.puter = { auth:{ isSignedIn:()=>true, signIn:async()=>({}) }, ai:{ listModels: async () => Array.from({length:40}, (_, i) => ({ id:'openai/m' + i, provider:'openai', name:'Modelo ' + i, context:400000 })), chat: async () => ({ [Symbol.asyncIterator]: async function*(){ yield { type:'text', text:'ok' }; } }) } };`;
const seen = "try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1');localStorage.setItem('synthz:intro','never')}catch(e){}";
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'], ignoreDefaultArgs:['--hide-scrollbars'] });
  const errs = [];
  const ctx = await b.newContext({ viewport:{ width:1280, height:800 } }); await ctx.addInitScript(seen);
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.route('**/*', r => { const u = r.request().url(); if (u.startsWith(base) || u.startsWith('http://localhost:8799')) return r.continue(); if (u.includes('js.puter.com')) return r.fulfill({ contentType:'text/javascript', body:PUTER }); return r.abort(); });
  const st = () => p.evaluate(() => ({ bar:document.documentElement.classList.contains('cursor-bar'), cd:document.querySelector('#cd').style.transform, crScale:/scale\((.*?)\)/.exec(document.querySelector('#cr').style.transform)[1], cr:document.querySelector('#cr').className, op:getComputedStyle(document.querySelector('#cd')).opacity }));
  await p.goto(base + 'index.html'); await p.waitForTimeout(5000);
  const cw = await p.evaluate(() => document.documentElement.clientWidth);
  console.log('ancho página', cw, 'barra de', 1280 - cw, 'px');
  await p.mouse.move(600, 400); await p.waitForTimeout(400);
  /* --- barra de la página --- */
  await p.mouse.move(cw + 6, 300, { steps:4 }); await p.waitForTimeout(300);
  console.log('A-sobre-barra', JSON.stringify(await st()));
  await p.mouse.down(); await p.waitForTimeout(150);
  console.log('A-agarrada', JSON.stringify(await st()));
  await p.mouse.move(cw + 6, 500, { steps:6 }); await p.mouse.up(); await p.waitForTimeout(100);
  await p.mouse.move(400, 600); await p.waitForTimeout(60);
  const s = await st(); console.log('A-volver-a-la-pagina', JSON.stringify(s), '| sin vuelo:', /translate3d\(4\d\d(\.\d+)?px, [56]\d\d/.test(s.cd));
  await p.waitForTimeout(300);
  /* --- logo: frena suave y todo crece igual --- */
  const lg = await (await p.$('.logo')).boundingBox();
  await p.mouse.move(lg.x + 18, lg.y + lg.height / 2, { steps:5 });
  const f = () => p.evaluate(() => { const o = document.querySelector('.logo .mark'), c = document.querySelector('#cl .mark'); return { orig:getComputedStyle(o).transform, clon:c && c.style.transform, sw1:getComputedStyle(o.querySelector('.sw1')).transform, sw1clon:c && c.querySelector('.sw1').style.transform, texto:getComputedStyle(o.querySelector('text')).transform, circulo:getComputedStyle(o.querySelector('.b1')).transform }; });
  await p.waitForTimeout(120); console.log('B-a-los-120ms', JSON.stringify(await f()));
  await p.waitForTimeout(1000); console.log('B-a-los-1100ms', JSON.stringify(await f()));
  await p.mouse.move(640, 500, { steps:5 }); await p.waitForTimeout(300);
  console.log('B-al-salir', await p.evaluate(() => [document.querySelector('.logo .mark .sw1').style.animation === '', getComputedStyle(document.querySelector('.logo .mark .sw1')).animationName].join(' ')));
  /* --- chat: barra de la lista de modelos --- */
  await p.goto(base + 'chat.html'); await p.waitForTimeout(5000);
  const ml = await p.evaluate(() => { const m = document.querySelector('#mlist'); const r = m.getBoundingClientRect(); return { x:r.left + m.clientLeft + m.clientWidth + 3, y:r.top + 120, sh:m.scrollHeight, ch:m.clientHeight, w:r.width, cw:m.clientWidth }; });
  console.log('lista', JSON.stringify(ml));
  await p.mouse.move(200, 400); await p.waitForTimeout(200);
  await p.mouse.move(ml.x, ml.y, { steps:4 }); await p.waitForTimeout(250);
  console.log('C-sobre-barra-lista', JSON.stringify(await st()));
  await p.mouse.down(); await p.mouse.move(ml.x, ml.y + 150, { steps:5 }); await p.mouse.up(); await p.waitForTimeout(100);
  console.log('C-lista-bajó', await p.evaluate(() => document.querySelector('#mlist').scrollTop));
  await p.mouse.move(800, 300); await p.waitForTimeout(60); console.log('C-volver', JSON.stringify(await st()));
  /* --- botón tapado por una ventana: el vidrio lo suelta sin mover el mouse --- */
  const cb = await (await p.$('#cfgBtn')).boundingBox(); await p.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2, { steps:3 }); await p.waitForTimeout(300);
  console.log('D-sobre-boton', (await st()).cr);
  await p.evaluate(() => { const d = document.createElement('div'); d.id = 'tapa'; d.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.5)'; document.body.appendChild(d); }); await p.waitForTimeout(350);
  console.log('D-tapado', JSON.stringify((await st()).cr));
  await p.evaluate(() => document.querySelector('#tapa').remove()); await p.waitForTimeout(350);
  console.log('D-destapado', (await st()).cr);
  /* --- soltar el clic fuera de la página no deja el cursor encogido --- */
  await p.mouse.down(); await p.evaluate(() => window.dispatchEvent(new Event('blur'))); await p.mouse.move(700, 350); await p.waitForTimeout(400);
  console.log('E-tras-blur', (await st()).crScale);
  await p.mouse.up();
  /* --- etiqueta dentro de una ventana que crece --- */
  await p.evaluate(() => { SZ.szConfirm('Prueba', 'texto', 'Sí'); });
  await p.waitForTimeout(40);
  const ok = await (await p.$('.szc [data-ok]')).boundingBox(); await p.mouse.move(ok.x + ok.width / 2, ok.y + ok.height / 2, { steps:2 }); await p.waitForTimeout(700);
  console.log('F-etiqueta', await p.evaluate(() => { const o = document.querySelector('.szc [data-ok]').getBoundingClientRect(), c = document.querySelector('#cl > *').getBoundingClientRect(); return 'original ' + o.width.toFixed(1) + 'x' + o.height.toFixed(1) + ' / copia ' + c.width.toFixed(1) + 'x' + c.height.toFixed(1); }));
  console.log('ERRORS', JSON.stringify(errs));
  await b.close();
})().catch(e => { console.log('FATAL', e.message.split('\n').slice(0, 3).join(' | ')); process.exit(1); });
