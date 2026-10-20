const { open } = require('../v15/h.js');
const GSI = `window.google = window.google || {}; google.accounts = { id:{ initialize(){}, renderButton(){}, prompt(){} }, oauth2:{
  initTokenClient(o){ window.__tc = o; return { requestAccessToken(p){ window.__tcPrompt = p; setTimeout(() => o.callback({ access_token:'ya29.fake', expires_in:3600, scope:o.scope }), 200); } }; },
  hasGrantedAllScopes(r, s){ return (r.scope || '').includes(s); }, revoke(t, cb){ window.__revoked = t; cb && cb(); } } };`;
(async () => {
  const { b, p, errs } = await open({ w:1440, h:900 });
  let store = JSON.stringify({ app:'SynthFlow', v:1, t:1, prefs:{ threads:{} }, chats:{ 'openrouter::remoto1':[{ role:'user', content:'Hola desde otro equipo' }, { role:'assistant', content:'¡Hola! Te respondo desde el Drive.' }] } });
  let fileId = 'f1', uploads = [], auths = new Set();
  await p.route('**/accounts.google.com/gsi/client', r => r.fulfill({ contentType:'text/javascript', body:GSI }));
  await p.route('**/www.googleapis.com/**', async r => {
    const u = new URL(r.request().url()), m = r.request().method(); auths.add(r.request().headers().authorization);
    const H = { 'access-control-allow-origin':'*', 'access-control-allow-headers':'*', 'access-control-allow-methods':'*' };
    if (m === 'OPTIONS') return r.fulfill({ status:204, headers:H });
    if (u.pathname === '/drive/v3/files' && m === 'GET') return r.fulfill({ contentType:'application/json', headers:H, body:JSON.stringify({ files:[{ id:fileId }] }) });
    if (u.pathname === '/drive/v3/files/f1' && u.searchParams.get('alt') === 'media') return r.fulfill({ contentType:'application/json', headers:H, body:store });
    if (u.pathname === '/upload/drive/v3/files/f1' && m === 'PATCH'){ uploads.push(r.request().postData()); store = r.request().postData(); return r.fulfill({ contentType:'application/json', headers:H, body:'{"id":"f1"}' }); }
    return r.fulfill({ status:404, headers:H, body:'{}' });
  });
  // seed a local chat
  await p.evaluate(() => { const s = window.SZ.S; });
  await p.click('#moreBtn'); await p.waitForTimeout(400);
  const it = await p.$$eval('.szc-menu button, [role=menuitem]', a => a.map(x => x.textContent.trim()));
  console.log('menu has drive:', it.some(t => /Google Drive/.test(t)));
  await p.locator('text=Google Drive · guardar mis chats').click(); await p.waitForTimeout(1200);
  await p.screenshot({ path:'v1b/d-dr1.png' });
  await p.click('#drv [data-d="go"]', { force:true }); await p.waitForTimeout(2500);
  await p.screenshot({ path:'v1b/d-dr2.png' });
  const res = await p.evaluate(() => ({ meta:SZ.DRIVE.meta(), prompt:window.__tcPrompt, scope:window.__tc && window.__tc.scope, hasRemote:!!document.querySelector('#thList') && document.querySelector('#thList').textContent }));
  console.log(JSON.stringify(res).slice(0, 400));
  const up = uploads.length ? JSON.parse(uploads[uploads.length - 1]) : null;
  console.log('uploads', uploads.length, up && Object.keys(up.chats), 'has keys?', /sk-or-v1/.test(uploads.join('')), 'auth', [...auths]);
  await p.reload(); await p.waitForTimeout(3000);
  const ks = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('synthz:v1')).chats || {}));
  console.log('chats after reload (local)', ks);
  console.log(errs);
  await b.close();
})();
