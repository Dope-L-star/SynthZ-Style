const { open } = require('./h.js');
const D = '/home/claude/t/v15/';
(async () => {
  /* celular */
  let { b, p, errs } = await open({ w:390, h:844 });
  await p.screenshot({ path:D + 'm1-inicio.png' });
  await p.click('#tabbar [data-tab="ia"]'); await p.waitForTimeout(900); await p.screenshot({ path:D + 'm2-ia.png' });
  await p.click('#sideDone'); await p.waitForTimeout(700);
  await p.click('#tabbar [data-tab="chats"]'); await p.waitForTimeout(900); await p.screenshot({ path:D + 'm3-chats.png' });
  await p.click('#scrim', { position:{ x:200, y:40 } }); await p.waitForTimeout(700);
  await p.click('.tchip[data-topic="codigo"]'); await p.waitForTimeout(1200); await p.screenshot({ path:D + 'm4-tema.png', fullPage:false });
  console.log('móvil ERRORS', JSON.stringify(errs)); await b.close();
  /* tablet */
  ({ b, p, errs } = await open({ w:1000, h:760 }));
  await p.screenshot({ path:D + 't1-inicio.png' });
  await p.click('#rail [data-r="chats"]'); await p.waitForTimeout(900); await p.screenshot({ path:D + 't2-chats.png' });
  console.log('tablet ERRORS', JSON.stringify(errs)); await b.close();
  /* computador: barrita abierta con chats escondidos y modo rendimiento */
  ({ b, p, errs } = await open({ w:1440, h:900, init:"localStorage.setItem('synthz:rail', JSON.stringify({open:false,chats:false,view:'chats'}))" }));
  await p.screenshot({ path:D + 'd1-sinchats.png' });
  await p.click('#railTog'); await p.waitForTimeout(1000); await p.screenshot({ path:D + 'd2-abierta-sinchats.png' });
  await p.reload(); await p.waitForTimeout(3000);
  console.log('se recuerda abierta:', await p.evaluate(() => document.getElementById('rail').classList.contains('open')));
  console.log('pc ERRORS', JSON.stringify(errs)); await b.close();
})();
