/* textos de IA: fórmulas, tablas, «pensando» con píxeles, iconos de vidrio, rayita y borrado */
const { open } = require('./v15/h.js');
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 260) : ''));
const ANS = '<think>El usuario quiere filas y columnas iguales. 529 es cuadrado perfecto.</think>Buscas un número \\( f \\) que multiplicado por sí mismo dé 529. Calculas la raíz cuadrada: \\(\\sqrt{529} = 23\\). Conclusión: 23 filas y 23 columnas.\n\n$$f^2 = 529$$\n\n| Filas | Columnas | Total |\n|---|---|---|\n| 23 | 23 | 529 |\n\n> Truco: prueba con números que terminen en 3.\n\n### Pasos\n1. Saca la raíz\n   - comprueba\n2. Listo';
(async () => {
  const shot = '/tmp/b3'; require('fs').mkdirSync(shot, { recursive:true });
  const { b, p, errs } = await open({ state:{ keys:{}, model:{ openrouter:'pu:openai/gpt-5.6-luna' } }, wait:4500 });
  await p.evaluate(ans => {
    SZ.state.model.openrouter = 'pu:openai/gpt-5.6-luna';
    puter.ai.chat = async (msgs, o) => (async function*(){ const parts = ans.match(/[\s\S]{1,9}/g); await new Promise(r => setTimeout(r, 1800)); for (const t of parts){ await new Promise(r => setTimeout(r, 25)); yield { type:'text', text:t }; } })();
  }, ANS);
  ok('librerías de texto cargadas', await p.evaluate(() => SZ.MDLIB.ok));
  await p.fill('#inp', '¿Cuántas filas para 529 sillas?'); await p.keyboard.press('Enter');
  await p.waitForTimeout(1100);
  const mid = await p.evaluate(() => { const w = document.querySelector('.work'); return w ? { px:w.querySelectorAll('.pxg i.on').length, txt:w.querySelector('.wk-w').textContent } : null; });
  ok('mientras piensa: píxeles armándose y qué está haciendo', mid && mid.px > 0 && mid.txt.length > 3, mid);
  await p.screenshot({ path:shot + '/1-pensando.png' });
  await p.waitForTimeout(4500);
  const r = await p.evaluate(() => { const m = [...document.querySelectorAll('.m.bot')].pop(); return { math:m.querySelectorAll('math').length, raw:/\\\(|\\\)|\\sqrt/.test(m.querySelector('.body').innerText), table:!!m.querySelector('.body table'), quote:!!m.querySelector('blockquote'), h3:!!m.querySelector('.body h3'), nested:!!m.querySelector('.body li ul'), think:/cuadrado perfecto/.test(m.querySelector('.body').textContent), fin:(m.querySelector('.work .wk-w') || {}).textContent, ico:!!m.querySelector('.gico img') }; });
  ok('fórmulas bien escritas (sin \\( \\) a la vista)', r.math >= 3 && !r.raw, r);
  ok('tabla, cita, título y lista anidada', r.table && r.quote && r.h3 && r.nested, r);
  ok('lo que pensó no se mezcla con la respuesta', !r.think, r);
  ok('al terminar: «Pensó y respondió…»', /Pensó/.test(r.fin || ''), r.fin);
  ok('icono real de la IA (vidrio)', r.ico);
  await p.click('.m.bot:last-of-type .wk-row'); await p.waitForTimeout(500);
  ok('la flechita muestra lo que pensó', await p.evaluate(() => /cuadrado perfecto/.test(([...document.querySelectorAll('.m.bot')].pop().querySelector('.wk-r p') || {}).textContent || '')));
  await p.screenshot({ path:shot + '/2-respuesta.png' });
  await p.reload(); await p.waitForTimeout(4000);
  ok('al recargar, la respuesta guardada conserva su resumen', await p.evaluate(() => !!document.querySelector('.m.bot .work.fin') && document.querySelectorAll('.m.bot math').length >= 3));
  /* rayita propia y borrado */
  await p.click('#inp'); await p.keyboard.type('Hola mundo', { delay:40 });
  ok('sin rayita propia (la normal del navegador)', await p.evaluate(() => !document.querySelector('.field .mc') && getComputedStyle(document.querySelector('#inp')).caretColor !== 'rgba(0, 0, 0, 0)'));
  await p.keyboard.press('Backspace'); await p.keyboard.press('Backspace');
  ok('al borrar, las letras se desprenden', await p.evaluate(() => document.querySelectorAll('.mghost').length > 0));
  await p.screenshot({ path:shot + '/3-borrando.png' });
  ok('sin errores en la consola', !errs.length, errs);
  await b.close();
})();
