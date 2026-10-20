/* v2.1: presentaciones PowerPoint */
const { open } = require('../v15/h.js');
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 260) : ''));
const D = { titulo:'Cómo ahorrar en casa', subtitulo:'Ideas sencillas para cada mes', diapositivas:[{ titulo:'Por qué ahorrar', puntos:['Tranquilidad', 'Metas', 'Emergencias'], notas:'Empieza con una historia.' }, { titulo:'Luz y agua', puntos:['Apaga lo que no usas', 'Duchas cortas'] }, { titulo:'Comida', puntos:['Lista de compras', 'Cocina en casa'] }, { titulo:'Conclusión', puntos:['Poco a poco se logra'] }] };
const T = 'Aquí tienes tu presentación:\n\n```json\n' + JSON.stringify(D, null, 1) + '\n```';
(async () => {
  const W = +process.argv[2] || 1280, tag = W < 600 ? 'm' : 'd';
  const { b, p, errs } = await open({ w:W, h:W < 600 ? 844 : 800, page:'chat.html', state:{ keys:{} }, init:"if(!localStorage.getItem('synthz:cfg'))localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}))", wait:4500 });
  await p.evaluate(T => { window.__asks = []; puter.ai.chat = async (msgs) => { window.__asks.push(msgs); return { message:{ role:'assistant', content:T } }; }; }, T);
  await p.evaluate(() => { const i = document.querySelector('#inp'); i.value = 'hazme una presentación sobre cómo ahorrar en casa'; i.dispatchEvent(new Event('input', { bubbles:true })); document.querySelector('#sendBtn').click(); });
  await p.waitForTimeout(8000);
  const asked = await p.evaluate(() => JSON.stringify(window.__asks.pop() || ''));
  ok('a la IA se le pide armar las diapositivas', /diapositivas/.test(asked) && /json/.test(asked));
  const c = await p.evaluate(() => { const d = document.querySelector('.fcard.deck'); return d ? d.textContent : ''; });
  ok('sale la tarjeta de la presentación', /Como-ahorrar-en-casa\.pptx/.test(c) && /4 diapositivas/.test(c), c);
  await p.evaluate(() => document.querySelector('.fcard.deck [data-dk="prev"]').click()); await p.waitForTimeout(1200);
  const pv = await p.evaluate(() => ({ n:document.querySelectorAll('.cvp .slw').length, t:(document.querySelector('.cvp .sl-t h2') || {}).textContent }));
  ok('vista previa: portada + 4 diapositivas', pv.n === 5 && /ahorrar/.test(pv.t || ''), pv);
  await p.screenshot({ path:__dirname + '/deck-' + tag + '-1.png' });
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout:15000 }).catch(() => null), p.evaluate(() => document.querySelector('.cvp [data-dk="down"]').click())]);
  ok('descarga el .pptx', dl && /\.pptx$/.test(dl.suggestedFilename()), dl && dl.suggestedFilename());
  if (dl) await dl.saveAs(__dirname + '/deck-' + tag + '.pptx');
  ok('sin errores', !errs.length, errs);
  await b.close();
})();
