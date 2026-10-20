const { open } = require('./h.js');
const D = '/home/claude/t/v15/';
const W = +(process.argv[2] || 1440), Hh = +(process.argv[3] || 900), tag = W < 600 ? 'm' : 'd';
(async () => {
  if (process.argv[4] !== 'sinllaves'){
    const B = 'http://localhost:8765/api/';
    const r = await fetch(B + 'auth', { method:'POST', headers:{ 'content-type':'application/json', 'x-forwarded-for':'9.9.9.' + Math.floor(Math.random() * 200) }, body:JSON.stringify({ mode:'signup', user:'sammuersynth', pass:'luz-de-prime-1', setup:'codigo-de-dueno-123' }) }).then(r => r.json());
    if (r.token) await fetch(B + 'trial', { method:'POST', headers:{ 'content-type':'application/json', authorization:'Bearer ' + r.token }, body:JSON.stringify({ action:'keys', groq:'gsk_prueba', mistral:'mstr_prueba', cloudflare:'cfat_prueba' }) });
  }
  const { b, p, errs } = await open({ w:W, h:Hh, page:'chat.html?guia=1', wait:3000 });
  const shot = async n => p.screenshot({ path:D + 'g-' + tag + '-' + n + '.png' });
  const clickSay = async (i = 0) => { await p.waitForSelector('#szSay.on [data-sb]', { timeout:20000 }); await p.waitForTimeout(400); await p.evaluate(i => document.querySelectorAll('#szSay [data-sb]')[i].click(), i); };
  await p.waitForSelector('#szSay.on', { timeout:15000 }); await p.waitForTimeout(1200); await shot('1-hola');
  console.log('hola:', await p.textContent('#szSay p'));
  await clickSay(0); await p.waitForSelector('#szgPanel.on [data-gt]', { timeout:8000 }); await p.waitForTimeout(1600); await shot('2-temas');
  await p.click('[data-gt="marketing"]'); await p.click('[data-gt="codigo"]'); await p.waitForTimeout(300);
  console.log('elegidos:', await p.textContent('.gp-n'));
  await p.click('#szgPanel [data-gnext]'); await p.waitForTimeout(2200); await shot('3-recomendadas');
  console.log('recomendadas:', await p.$$eval('.gp-row', r => r.map(x => x.innerText.replace(/\n+/g, ' / ')).join(' || ')));
  await p.click('#szgPanel [data-gnext]');
  for (let i = 0; i < 6; i++){ await p.waitForSelector('#szSay.on [data-sb]', { timeout:20000 }); await p.waitForTimeout(900); if (i === 1) await shot('4-recorrido'); console.log('recorrido', i, await p.textContent('#szSay p')); await clickSay(0); await p.waitForTimeout(300); }
  await p.waitForSelector('.gd-card', { timeout:15000 }); await p.waitForTimeout(2600); await shot('5-comparar');
  await p.waitForSelector('#szgPanel [data-gnext]:not([hidden])', { timeout:15000 }); await p.waitForTimeout(800); await shot('6-flow');
  await p.click('#szgPanel [data-gnext]'); await p.waitForTimeout(2500); await shot('7-prueba');
  console.log('prueba:', await p.textContent('#szSay p'));
  await p.waitForFunction(() => document.querySelector('#inp').value.length > 20 && document.querySelector('#szSay.on') && /envíalo/i.test(document.querySelector('#szSay p').textContent), null, { timeout:30000 }); await p.waitForTimeout(1500); await shot('8-escrito');
  console.log('escrito:', await p.inputValue('#inp')); await p.click('#sendBtn'); await p.waitForTimeout(500);
  await p.waitForSelector('#szSay.on [data-sb]', { timeout:30000 }); await p.waitForTimeout(1200); await shot('8b-respuesta');
  console.log('tras respuesta:', await p.textContent('#szSay p'));
  console.log('final1:', await p.textContent('#szSay p'));
  await clickSay(0); await p.waitForTimeout(1500); await shot('9-conectar');
  console.log('final2:', await p.textContent('#szSay p'));
  const n = await p.$$('#szSay [data-sb]'); if (n.length) await clickSay(0);
  await p.waitForTimeout(1500); await shot('10-fin');
  console.log('fin:', await p.evaluate(() => ({ guia:localStorage.getItem('synthz:guide'), mano:!!document.querySelector('#szHand'), hud:!!document.querySelector('#szgHud') })));
  console.log('ERRORS', JSON.stringify(errs)); await b.close();
})().catch(e => { console.log('FATAL', e.message.split('\n')[0]); process.exit(1); });
