const { open } = require('./v15/h.js');
(async () => {
  let { b, p } = await open({ page:'index.html', w:1440, h:900, state:{ keys:{} }, wait:3000 });
  await p.keyboard.press('Escape'); await p.waitForTimeout(9000);
  const out = [];
  out.push('### INDEX\n' + await p.evaluate(() => document.body.innerText));
  await p.goto('http://localhost:8765/chat.html'); await p.waitForTimeout(4000);
  out.push('### CHAT\n' + await p.evaluate(() => document.body.innerText));
  const grab = async (label, fn) => { try{ await p.evaluate(fn); await p.waitForTimeout(1200); out.push('### ' + label + '\n' + await p.evaluate(() => { const m = [...document.querySelectorAll('.szm,#szHelp,#conn,#side.open')].pop(); return m ? m.innerText : '(nada)'; })); await p.keyboard.press('Escape'); await p.waitForTimeout(600); }catch(e){ out.push('### ' + label + ' ERR ' + e.message); } };
  await grab('CONECTAR', () => { const a = document.createElement('a'); a.setAttribute('data-conn', ''); document.body.appendChild(a); a.click(); a.remove(); });
  await grab('LIMITE', () => document.querySelector('#sxBtn').click());
  await grab('AJUSTES', () => SZ.cfgModal());
  await grab('SELECTOR', () => (document.querySelector('#cPick') || document.querySelector('#curChip')).click());
  require('fs').writeFileSync('/tmp/txt.txt', out.join('\n\n'));
  await b.close();
})();
