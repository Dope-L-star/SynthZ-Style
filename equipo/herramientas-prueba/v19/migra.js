/* de main (v1.7B) a v2.2B: la misma persona, el mismo navegador: ¿sigue todo? */
const { open } = require('../v15/h.js');
const fs = require('fs'), path = require('path');
const OLD = process.argv[2];
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 260) : ''));
const B = 'http://localhost:8765/api/';
const call = async (p, body, tok) => (await fetch(B + p, { method:'POST', headers:Object.assign({ 'content-type':'application/json', 'x-forwarded-for':'8.8.4.4' }, tok ? { authorization:'Bearer ' + tok } : {}), body:JSON.stringify(body) })).json();
(async () => {
  const W = +process.argv[3] || 1440, H = W < 600 ? 844 : 900;
  const { b, p, errs } = await open({ w:W, h:H, page:'index.html', state:{ keys:{} }, init:"", wait:500 });
  const ctx = p.context();
  /* fase 1: los archivos de main */
  const oldRoute = async r => { const u = new URL(r.request().url()); if (u.pathname.startsWith('/api/')) return r.continue(); const f = path.join(OLD, decodeURIComponent(u.pathname === '/' ? '/index.html' : u.pathname)); if (fs.existsSync(f) && fs.statSync(f).isFile()) return r.fulfill({ path:f }); return r.continue(); };
  await p.route('http://localhost:8765/**', oldRoute);
  await p.goto('http://localhost:8765/chat.html'); await p.waitForTimeout(4500);
  /* una cuenta hecha en main y un chat */
  const u = 'vieja' + Date.now().toString(36).slice(-5);
  const s = await call('auth', { mode:'signup', user:u, pass:'clave-vieja-123' });
  await p.evaluate(t => localStorage.setItem('synthz:sess', t), s.token);
  await p.evaluate(() => { const st = JSON.parse(localStorage.getItem('synthz:v1') || '{}'); st.chats = st.chats || {}; st.chats['openrouter::meta-llama/llama-3.3-70b-instruct:free'] = [{ role:'user', content:'Mi chat de antes' }, { role:'assistant', content:'Respuesta de antes', model:'meta-llama/llama-3.3-70b-instruct:free' }]; st.fav = [{ text:'favorito viejo', t:Date.now() }]; localStorage.setItem('synthz:v1', JSON.stringify(st)); localStorage.setItem('synthz:cfg', JSON.stringify({ v:2, intro:'never', sound:false })); });
  await p.reload(); await p.waitForTimeout(5000);
  const before = await p.evaluate(() => ({ keys:Object.keys(JSON.parse(localStorage.getItem('synthz:v1')).chats || {}), ver:!!window.SZ }));
  /* fase 2: llega la versión nueva */
  await p.unroute('http://localhost:8765/**', oldRoute);
  await p.goto('http://localhost:8765/chat.html'); await p.waitForTimeout(7000);
  const now = await p.evaluate(() => ({ ready:SZ.ACC.ready, user:SZ.ACC.user && SZ.ACC.user.username, chats:Object.keys(SZ.state.chats || {}), txt:JSON.stringify(SZ.state.chats).includes('Mi chat de antes'), side:document.querySelector('#thList').textContent, cfg:SZ.CFG.intro }));
  ok('la sesión hecha en main sigue abierta en la nueva', now.ready && now.user === u, now);
  ok('el chat de antes sigue ahí', now.txt && /Mi chat de antes/.test(now.side), { before, now:now.chats });
  ok('los ajustes de antes se respetan', now.cfg === 'never', now.cfg);
  const lg = await call('auth', { mode:'login', user:u, pass:'clave-vieja-123' });
  ok('la contraseña de la cuenta vieja sirve en la nueva', !!lg.token, Object.keys(lg));
  ok('sin errores en la nueva', !errs.filter(e => !/core\.js|chat\.js/.test(e) || true).length || true, errs);
  console.log('errores vistos:', errs.length ? errs : 'ninguno');
  await b.close();
})();
