const { open } = require('./h.js');
const D = '/home/claude/t/v15/';
(async () => {
  const { b, p, errs } = await open();
  const shot = async n => { await p.screenshot({ path:D + n + '.png' }); };
  await shot('1-inicio');
  console.log('chip:', await p.textContent('#curChip'), '| pago:', await p.textContent('#payL'));
  await p.click('.tchip[data-topic="marketing"]'); await p.waitForTimeout(1300); await shot('2-tema');
  console.log('recomendadas:', await p.$$eval('.rcard b', x => x.map(e => e.textContent)));
  const cks = await p.$$('.rcard [data-rc]'); await cks[0].check(); await cks[1].check(); await p.waitForTimeout(500);
  console.log('cmpgo:', await p.textContent('#cmpGo'));
  await p.click('[data-cmpgo]'); await p.waitForTimeout(900);
  await p.fill('#inp', 'Dame 3 ideas de post para vender postres'); await p.keyboard.press('Enter');
  await p.waitForTimeout(450); await shot('3-cmp-llegando');
  await p.waitForTimeout(2600); await shot('4-cmp-listo');
  console.log('orden de llegada:', await p.$$eval('.cmp-card .who b', x => x.map(e => e.textContent)));
  /* sumar otra IA después de enviar */
  await p.click('#pickRow [data-add]'); await p.waitForTimeout(900); await shot('5-sumar');
  const item = await p.$('#mlist .mi:not(.cmpd)'); const nm = await item.$eval('.mi-name', e => e.textContent); await item.click();
  console.log('sumé:', nm); await p.waitForTimeout(400); await shot('6-sumada-pensando'); await p.waitForTimeout(2600); await shot('7-sumada-lista');
  console.log('tarjetas:', await p.$$eval('.cmp-card .who b', x => x.map(e => e.textContent)));
  await p.click('.cmp-card .flowb'); await p.waitForTimeout(1600); await shot('8-ganadora');
  console.log('modo tras elegir:', await p.evaluate(() => document.querySelectorAll('.cmp-card').length), '| mensajes:', await p.$$eval('.m', x => x.length));
  /* estrella */
  await p.click('.m.bot .act[data-a="star"]'); await p.waitForTimeout(300); await shot('9-estrella-volando'); await p.waitForTimeout(1200);
  await p.click('#rail [data-r="favs"]'); await p.waitForTimeout(900); await shot('10-favoritos');
  console.log('favoritos:', await p.$$eval('.fvi', x => x.length));
  await p.click('#rail [data-r="new"]'); await p.waitForTimeout(1200); await shot('11-nuevo-chat');
  console.log('saludo nuevo:', await p.textContent('.greet'));
  await p.click('#attachBtn'); await p.waitForTimeout(600); await shot('12-clip');
  console.log('ERRORS', JSON.stringify(errs));
  await b.close();
})();
