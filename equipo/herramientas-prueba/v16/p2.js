const { open } = require('../v15/h.js');
(async () => {
  const { b, p, errs } = await open({ w:1280, h:800, page:'index.html', wait:7000, init:"sessionStorage.setItem('synthz:intro','1')" });
  await p.evaluate(() => { const o = document.createElement('div'); o.id = 'portal'; o.className = 'szportal'; o.style.opacity = '1';
    o.innerHTML = '<i class="pg"></i><i class="szpl"></i><div class="szpw"><span class="szps">Synth</span><span class="szpf">Fl<span class="szpo">o<i class="szpin"><b></b><b></b><b></b><u></u></i></span>w</span></div>'; document.body.appendChild(o); });
  await p.waitForTimeout(500);
  console.log(await p.evaluate(() => { const r = s => { const e = document.querySelector(s), b = e.getBoundingClientRect(), c = getComputedStyle(e); return s + ' ' + [b.left, b.top, b.width, b.height].map(Math.round).join(',') + ' op ' + c.opacity + ' col ' + c.color + ' fs ' + c.fontSize + ' vis ' + c.visibility + ' ff ' + c.fontFamily.slice(0, 30); }; return ['.szpw', '.szps', '.szpf', '.szpo'].map(r).join('\n'); }));
  await p.screenshot({ path:'/home/claude/t/v16/static.png' }); await b.close();
})();
