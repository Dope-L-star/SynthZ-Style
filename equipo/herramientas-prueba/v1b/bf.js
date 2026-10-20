const { open } = require('../v15/h.js');
const D = '/home/claude/t/v1b/';
(async () => {
  const W = +process.argv[2] || 1440, H = +process.argv[3] || 900, tag = process.argv[4] || 'd';
  const { b, p, errs } = await open({ w:W, h:H, init:"if(!sessionStorage.getItem('bfx')){localStorage.removeItem('synthz:tour');sessionStorage.setItem('bfx','1')}" });
  await p.waitForTimeout(1600); await p.screenshot({ path:D + tag + '-bf1.png' });
  await p.click('[data-bt="marketing"]'); await p.waitForTimeout(300); await p.screenshot({ path:D + tag + '-bf2a.png' }); await p.waitForTimeout(900);
  await p.screenshot({ path:D + tag + '-bf2.png' });
  const cks = await p.$$('#bflow [data-bck]'); if (cks.length > 1){ await cks[0].check(); await cks[1].check(); } await p.waitForTimeout(600);
  await p.screenshot({ path:D + tag + '-bf3.png' });
  await p.click('[data-bback]'); await p.waitForTimeout(250); await p.screenshot({ path:D + tag + '-bf4a.png' }); await p.waitForTimeout(800);
  await p.click('[data-bt="codigo"]'); await p.waitForTimeout(1200);
  try{ await p.click('[data-bstart]', { timeout:5000, force:true }); }catch(e){ console.log('BLOQUEADO', await p.evaluate(() => { const c = document.querySelector('[data-bstart]'); const r = c.getBoundingClientRect(); const t = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2); return [r.x|0, r.y|0, innerHeight] + ' ' + t.outerHTML.slice(0, 200); })); await p.screenshot({ path:D + tag + '-bfX.png' }); throw e; }
  await p.waitForTimeout(2200);
  await p.screenshot({ path:D + tag + '-bf5.png' });
  console.log('tras empezar:', JSON.stringify(await p.evaluate(() => ({ bflow:!!document.querySelector('#bflow'), model:SZ.state.model.openrouter, inp:document.querySelector('#inp').value.slice(0, 50), tour:localStorage.getItem('synthz:tour') }))));
  console.log('ERRORS', JSON.stringify(errs)); await b.close();
})();
