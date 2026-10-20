const { open } = require('./v15/h.js');
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 220) : ''));
(async () => {
  let { b, p, errs } = await open({ w:1280, h:860, state:{ keys:{} }, wait:4000 });
  await p.evaluate(() => (document.querySelector('#accBtn') || document.querySelector('[data-tab="me"]') || document.querySelector('#railAcc')).click()); await p.waitForTimeout(1500);
  const btn = await p.evaluate(() => { const g = document.querySelector('.sbg'); return g ? g.textContent : null; });
  ok('«Continuar con Google» aparece', btn && /Google/.test(btn), btn);
  await p.screenshot({ path:'/tmp/sbg-modal.png' });
  let target = '';
  await p.route('http://localhost:8811/auth/v1/authorize**', r => { target = r.request().url(); r.fulfill({ status:302, headers:{ location:'http://localhost:8765/chat.html#access_token=good-token&token_type=bearer&expires_in=3600' } }); });
  await p.evaluate(() => document.querySelector('.sbg').click()); await p.waitForTimeout(6000);
  ok('lleva a Google por Supabase con la vuelta correcta', /provider=google/.test(target) && /redirect_to=http%3A%2F%2Flocalhost%3A8765%2Fchat\.html/.test(target), target);
  const st = await p.evaluate(() => ({ user:SZ.ACC.user && SZ.ACC.user.email, hash:location.hash }));
  ok('al volver, ya entraste y el token se borra de la dirección', st.user === 'ana@example.com' && !st.hash, st);
  ok('sin errores', !errs.length, errs);
  await b.close();
})();
