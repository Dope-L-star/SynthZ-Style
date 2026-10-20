const { open } = require('../v15/h.js');
const D = '/home/claude/t/v1b/';
(async () => {
  const W = +process.argv[2] || 1440, H = +process.argv[3] || 900, tag = process.argv[4] || 'd';
  const { b, p, errs } = await open({ w:W, h:H });
  await p.click(await p.$('#curChip:visible') ? '#curChip' : '#cPick'); await p.waitForTimeout(250); await p.screenshot({ path:D + tag + '-pk0.png' }); await p.waitForTimeout(700);
  await p.screenshot({ path:D + tag + '-pk1.png' });
  await p.click('#pTopics [data-ptk="marketing"]'); await p.waitForTimeout(700);
  const cks = await p.$$('#mlist .mi [data-ck]'); await cks[0].check(); await cks[1].check(); await p.waitForTimeout(400);
  await p.screenshot({ path:D + tag + '-pk2.png' });
  console.log('nota:', await p.textContent('#pNote'), '| boton:', await p.evaluate(() => !document.querySelector('#pGo').hidden && document.querySelector('#pGo').textContent));
  await p.click('#pGo'); await p.waitForTimeout(250); await p.screenshot({ path:D + tag + '-pk3.png' }); await p.waitForTimeout(1300);
  await p.screenshot({ path:D + tag + '-pk4.png' });
  for (let k = 0; k < 2; k++){
    await p.click('#pickRow [data-add]'); await p.waitForTimeout(800);
    const it = await p.$$('#mlist .mi:not(.cmpd)');
    let added = false;
    for (const x of it){ const id = await x.getAttribute('data-id'); if (/^pu:/.test(id)){ await (await x.$('[data-use]')).click(); added = true; break; } }
    if (!added) await (await it[0].$('[data-use]')).click();
    await p.waitForTimeout(1500);
  }
  await p.screenshot({ path:D + tag + '-pk5.png' });
  console.log('comparando:', JSON.stringify(await p.evaluate(() => SZ.state.cmp)), '| + visible:', await p.evaluate(() => { const a = document.querySelector('#pickRow [data-add]'); if (!a) return 'no hay +'; const r = a.getBoundingClientRect(); return r.right <= innerWidth && r.width > 0; }));
  console.log('ERRORS', JSON.stringify(errs)); await b.close();
})();
