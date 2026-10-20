const { open } = require('./v15/h.js');
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 220) : ''));
(async () => {
  /* portada con intro */
  let { b, p, errs } = await open({ page:'index.html', w:1440, h:900, wait:500, init:"localStorage.setItem('synthz:cfg', JSON.stringify({v:2,perf:'visual',intro:'always',cursor:true,smooth:true,bg:true,glass:true,anim:true,favAnim:true}))" });
  let sawZ = false, sawLetters = false, bubbleInIntro = false;
  for (let i = 0; i < 40; i++){ await p.waitForTimeout(400); if (i % 3 === 0) await p.mouse.click(300 + i * 5, 600).catch(() => {}); const s = await p.evaluate(() => ({ z:!!document.querySelector('#intro .zgimg'), l:document.querySelectorAll('#intro .ch.on').length, b:!!document.querySelector('#szBotB.on'), done:!document.querySelector('#intro') && !document.querySelector('#vintro') })); if (s.z) sawZ = true; if (s.l >= 5) sawLetters = true; if (s.b && !s.done) bubbleInIntro = true; if (s.done && i > 5) break; }
  ok('después del video, la Z de vidrio y se escribe «Synth»', sawZ && sawLetters, { sawZ, sawLetters });
  ok('clics en la pantalla de carga no hacen hablar a SynthonIA', !bubbleInIntro);
  await p.waitForTimeout(1500);
  const h = await p.evaluate(() => ({ btn:document.querySelector('#startBtn').innerText, face:!!document.querySelector('#startFace svg'), conectar:[...document.querySelectorAll('.cta a')].map(a => a.textContent), how:document.querySelector('#hHow').textContent, pill:document.querySelector('#navTotal').textContent }));
  ok('botón «Empezar a FlowIA’r» con carita', /FlowIA/.test(h.btn) && h.face && h.conectar.length === 1, h);
  ok('sin «Tres pasos»', !/Tres pasos/.test(h.how), h.how);
  ok('la píldora no dice números', !/\d/.test(h.pill), h.pill);
  await p.screenshot({ path:'/tmp/v14-hero.png' });
  ok('sin errores (portada)', !errs.length, errs);
  await b.close();
  /* SynthonIA */
  ({ b, p, errs } = await open({ w:1440, h:900, state:{ keys:{} }, wait:4500 }));
  await p.evaluate(() => { SZ.BOT.open(); const i = document.querySelector('#szBotP .bin input'); i.value = 'cuéntame un chiste'; i.closest('form').requestSubmit(); });
  await p.waitForTimeout(1200);
  const th = await p.evaluate(() => ({ pix:document.querySelector('#szBot').classList.contains('pix'), cells:document.querySelectorAll('#szBot .pxface .pxg i.on').length, msg:!!document.querySelector('#szBotP .pxmf') }));
  ok('pensando: su carita se vuelve píxeles', th.pix && th.msg, th);
  await p.screenshot({ path:'/tmp/v14-think.png', clip:{ x:1000, y:300, width:440, height:600 } });
  await p.evaluate(() => SZ.BOT.close());
  let zen = false, ans = '';
  for (let i = 0; i < 20; i++){ await p.waitForTimeout(300); const t = await p.evaluate(() => (document.querySelector('#szBotB.on p') || {}).textContent || ''); if (/modo zen/.test(t)) zen = true; else if (zen && t) { ans = t; break; } }
  ok('si la cierras: «Ten paciencia… modo zen…» y luego la respuesta', zen && ans.length > 8, ans);
  ok('sin emojis en lo que dice', !/\p{Extended_Pictographic}/u.test(ans), ans);
  await p.screenshot({ path:'/tmp/v14-bubble.png', clip:{ x:900, y:600, width:540, height:300 } });
  await p.waitForTimeout(6000);
  const r = await p.evaluate(() => { const r = document.querySelector('#szBot').getBoundingClientRect(); return [r.left + r.width * (.1667 + .4 * .667), r.top + r.height * (.1667 + .52 * .667)]; });
  await p.mouse.click(r[0], r[1]); await p.waitForTimeout(700);
  const eye = await p.evaluate(() => ({ mood:(document.querySelector('#szBot .bf > :last-child .szface') || {}).dataset?.mood, open:document.querySelector('#szBotP') && document.querySelector('#szBotP').classList.contains('on'), say:(document.querySelector('#szBotB.on p') || {}).textContent }));
  ok('tocarle el ojo: «¡Ay!» con su cara', eye.mood === 'auch' && /Ay/.test(eye.say || '') && !eye.open, eye);
  /* modo agente en la barra */
  await p.evaluate(() => document.querySelector('#railAgent').click()); await p.waitForTimeout(600);
  const ag = await p.evaluate(() => ({ on:SZ.state.agent, pressed:document.querySelector('#railAgent').getAttribute('aria-pressed'), head:!document.querySelector('#cAgH').hidden }));
  ok('modo agente desde la barra, con sus chats aparte', ag.on && ag.pressed === 'true' && ag.head, ag);
  await p.fill('#inp', 'quiero ideas para vender tortas'); await p.keyboard.press('Enter'); await p.waitForTimeout(9000);
  const ac = await p.evaluate(() => ({ items:document.querySelectorAll('#thList .thi').length, ag:Object.keys(SZ.state.chats || {}).filter(k => /^openrouter::agente/.test(k) && SZ.state.chats[k].length).length }));
  ok('el chat del agente queda en «Chats con el agente»', ac.items >= 1 && ac.ag >= 1, ac);
  await p.evaluate(() => document.querySelector('#cAgBack').click()); await p.waitForTimeout(500);
  ok('al salir, el modo agente se apaga', await p.evaluate(() => !SZ.state.agent));
  ok('sin errores (chat)', !errs.length, errs);
  await b.close();
  /* eventos */
  for (const n of [50, 100, 500]){
    ({ b, p, errs } = await open({ page:'chat.html?evento=' + n, w:1440, h:900, state:{ keys:{} }, wait:3000 }));
    let hk = false, badge = null;
    for (let i = 0; i < 40; i++){ await p.waitForTimeout(400); const s = await p.evaluate(() => ({ hk:!!document.querySelector('.hackev.on'), a:(document.querySelector('.achv.on') || {}).innerText })); if (s.hk && !hk){ hk = true; await p.waitForTimeout(1200); await p.screenshot({ path:'/tmp/v14-ev' + n + '.png' }); } if (s.a){ badge = s.a; await p.waitForTimeout(800); await p.screenshot({ path:'/tmp/v14-ach' + n + '.png', clip:{ x:1000, y:0, width:440, height:240 } }); break; } }
    ok('evento ' + n + ': pantalla especial y logro', hk && badge && /1 en un millón/.test(badge) && (n === 50 ? !/descuentos/.test(badge) : /descuentos/.test(badge)), badge);
    ok('evento ' + n + ' sin errores', !errs.length, errs);
    await b.close();
  }
})();
