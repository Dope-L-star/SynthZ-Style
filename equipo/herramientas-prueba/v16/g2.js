/* Guía Asistida de punta a punta: temas → IA → recorrido → comparar → prueba real (5 mensajes) → conectar */
const { open } = require('../v15/h.js');
const D = '/home/claude/t/v16/';
const B = 'http://localhost:8765/api/';
const call = (path, body, tok) => fetch(B + path, { method:body ? 'POST' : 'GET', headers:Object.assign({ 'content-type':'application/json', 'x-forwarded-for':'9.9.9.' + Math.floor(Math.random() * 200) }, tok ? { authorization:'Bearer ' + tok } : {}), body:body ? JSON.stringify(body) : undefined }).then(r => r.json().then(d => ({ s:r.status, d })));
(async () => {
  const W = +process.argv[2] || 1440, Hh = +process.argv[3] || 900, tag = process.argv[4] || 'd', withTrial = process.argv[5] !== 'notrial';
  if (withTrial){
    const own = await call('auth', { mode:'signup', user:'sammuersynth', pass:'luz-de-prime-1', setup:'codigo-de-dueno-123' });
    const k = await call('trial', { action:'keys', groq:'gsk_prueba', mistral:'mstr_prueba', cloudflare:'cfat_prueba' }, own.d.token);
    console.log('llaves de prueba:', k.s, (k.d.providers || []).map(p => p.state).join(' | '));
  }
  const { b, p, errs } = await open({ w:W, h:Hh, page:'chat.html?guia=1', wait:1200, state:{ keys:{}, model:{}, models:{}, usage:{}, chats:{}, fav:[], cmp:[] }, init:"localStorage.setItem('mockPuter','0')" });
  await p.evaluate(() => { const H = SZ.HAND, t = H.talk; window.__talks = []; H.talk = function(x, o){ window.__talks.push(x.slice(0, 50)); return t.apply(this, arguments); }; });
  const log = [], seen = new Set(); let shots = 0, sentOnce = false;
  const t0 = Date.now();
  while (Date.now() - t0 < 150000){
    await p.waitForTimeout(450);
    const s = await p.evaluate(() => ({
      on: window.SynthFlowGuide && window.SynthFlowGuide.on(),
      hud: (document.querySelector('#szgHud .gh-t i') || {}).textContent || '',
      say: document.querySelector('#szSay.on') ? document.querySelector('#szSay .st p').textContent : '',
      sayFull: document.querySelector('#szSay.on') ? (document.querySelector('#szSay .st p')._full || '') : '',
      btns: [...document.querySelectorAll('#szSay.on [data-sb]')].map(b => b.textContent),
      panel: !!document.querySelector('#szgPanel.on'),
      chips: document.querySelectorAll('#szgPanel [data-gt]').length,
      picked: document.querySelectorAll('#szgPanel [data-gt][aria-pressed="true"]').length,
      next: (() => { const n = document.querySelector('#szgPanel.on [data-gnext]'); return n && !n.hidden && !n.disabled; })(),
      inp: document.querySelector('#inp').value,
      hand: !!document.querySelector('#szHand.on'), shape:(document.querySelector('#szHand') || {}).dataset ? document.querySelector('#szHand') && document.querySelector('#szHand').dataset.s : '',
      conn: !!document.querySelector('#conn')
    }));
    if (!s.on && Date.now() - t0 > 3000){ log.push('FIN'); break; }
    const key = s.hud + '|' + s.btns.join(',') + '|' + (s.say || '').slice(0, 30);
    if (!seen.has(key) && (s.hud || s.say)){ seen.add(key); log.push((s.hud || '·') + ' :: ' + (s.say || (s.panel ? '[panel]' : '')).slice(0, 90) + (s.btns.length ? ' [' + s.btns.join('/') + ']' : '') + (s.hand ? ' ✋' + s.shape : '')); if (shots < 14){ await p.screenshot({ path:D + tag + '-' + String(++shots).padStart(2, '0') + '.png' }); } }
    if (s.panel && s.chips && s.picked < 2){ await p.evaluate(() => { const c = [...document.querySelectorAll('#szgPanel [data-gt]')]; const pick = ['marketing', 'codigo']; pick.forEach(k => { const b = c.find(x => x.dataset.gt === k); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); }); }); continue; }
    if (s.next){ await p.waitForTimeout(500); await p.evaluate(() => document.querySelector('#szgPanel.on [data-gnext]').click()); continue; }
    if (/envíalo tú/.test(s.say) && !sentOnce){ sentOnce = true; await p.waitForTimeout(600); await p.screenshot({ path:D + tag + '-escrito.png' }); await p.evaluate(() => document.querySelector('#sendBtn').click()); continue; }
    if (s.btns.length){
      const i = s.btns.findIndex(x => /Después/.test(x));
      await p.waitForTimeout(600);
      await p.evaluate(i => { const b = document.querySelectorAll('#szSay.on [data-sb]')[i]; if (b) b.click(); }, i >= 0 ? i : 0);
    }
  }
  const after = await p.evaluate(() => ({ guide:localStorage.getItem('synthz:guide'), hud:!!document.querySelector('#szgHud'), hand:!!document.querySelector('#szHand'), user:[...document.querySelectorAll('.m.user')].map(x => x.textContent.slice(0, 60)), bot:[...document.querySelectorAll('.m.bot .body')].map(x => x.textContent.slice(0, 60)), pay:(document.querySelector('#payL') || document.querySelector('#payM') || {}).textContent }));
  await p.waitForTimeout(3600);
  const gone = await p.evaluate(() => ({ hand:!!document.querySelector('#szHand'), say:!!document.querySelector('#szSay'), spot:!!document.querySelector('#szSpot.on'), cls:document.documentElement.className }));
  log.forEach(l => console.log(l));
  console.log('TALKS', JSON.stringify(await p.evaluate(() => window.__talks)));
  console.log('al terminar:', JSON.stringify(after));
  console.log('limpio:', JSON.stringify(gone));
  console.log('ERRORS', JSON.stringify(errs));
  await b.close();
})();
