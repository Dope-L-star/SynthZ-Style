const B = 'http://localhost:8765/api/';
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 220) : ''));
const ip = () => '9.' + Math.floor(Math.random() * 250) + '.' + Math.floor(Math.random() * 250) + '.3';
const call = async (path, body, tok) => { const r = await fetch(B + path, { method:body ? 'POST' : 'GET', headers:Object.assign({ 'content-type':'application/json', 'x-forwarded-for':ip() }, tok ? { authorization:'Bearer ' + tok } : {}), body:body ? JSON.stringify(body) : undefined }); return { s:r.status, d:await r.json().catch(() => ({})) }; };
const cred = async (sub, email, name) => (await (await fetch('http://localhost:8799/token?sub=' + sub + '&email=' + encodeURIComponent(email) + '&name=' + encodeURIComponent(name || 'X'))).json()).credential;
const R = Date.now() % 1e6;
for (const [email, role] of [['sammuel.loaiza10@gmail.com', 'owner'], ['sammuel.loaiza@gmail.com', 'admin'], ['sammuer.business@gmail.com', 'staff'], ['otra' + R + '@gmail.com', undefined]]){
  const r = await call('auth', { credential:await cred('g' + R + email.length, email, 'Prueba') });
  const me = await call('me', null, r.d.token);
  ok('Google ' + email + ' → ' + (role || 'Synther'), me.d.user && me.d.user.role === (role || 'user'), me.d.user && me.d.user.role);
}
/* cuenta con contraseña → vincula Google */
const u = 'pepe' + R, s1 = await call('auth', { mode:'signup', user:u, pass:'clave-segura-9' }); const t1 = s1.d.token;
const c1 = await cred('gl' + R, 'pepe' + R + '@gmail.com', 'Pepe');
const l1 = await call('auth', { mode:'link', credential:c1 }, t1);
ok('vincula Google a una cuenta con contraseña', l1.s === 200 && l1.d.user.google, l1.d);
const g1 = await call('auth', { credential:c1 });
ok('después, entrar con Google abre la MISMA cuenta', g1.d.user && g1.d.user.sub === s1.d.user.sub, [g1.d.user && g1.d.user.sub, s1.d.user.sub]);
const pf = await call('me', null, g1.d.token); ok('la foto de Google queda puesta', pf.d.profile && pf.d.profile.avatar && pf.d.profile.avatar.type === 'google', pf.d.profile);
/* un Google que ya tiene su cuenta propia no se junta */
const c2 = await cred('gx' + R, 'ana' + R + '@gmail.com', 'Ana'); await call('auth', { credential:c2 });
const s2 = await call('auth', { mode:'signup', user:'luis' + R, pass:'clave-segura-9' });
const l2 = await call('auth', { mode:'link', credential:c2 }, s2.d.token);
ok('no junta cuentas distintas (409)', l2.s === 409, l2.d.error);
/* cuenta de Google → le pone usuario y contraseña */
const c3 = await cred('gy' + R, 'eva' + R + '@gmail.com', 'Eva'); const g3 = await call('auth', { credential:c3 });
const a3 = await call('auth', { mode:'addpass', user:'eva' + R, pass:'clave-segura-9' }, g3.d.token);
ok('cuenta de Google agrega usuario y contraseña', a3.s === 200 && a3.d.recovery, a3.d.error);
const l3 = await call('auth', { mode:'login', user:'eva' + R, pass:'clave-segura-9' });
ok('entra con usuario y contraseña a la MISMA cuenta', l3.d.user && l3.d.user.sub === g3.d.user.sub, [l3.d.user && l3.d.user.sub, g3.d.user.sub]);
const a4 = await call('auth', { mode:'addpass', user:'eva2' + R, pass:'clave-segura-9' }, g3.d.token);
ok('no deja poner contraseña dos veces', a4.s === 400, a4.d.error);
const a5 = await call('auth', { mode:'addpass', user:'pepe' + R, pass:'clave-segura-9' }, (await call('auth', { credential:await cred('gz' + R, 'zoe' + R + '@gmail.com') })).d.token);
ok('no deja usar un usuario ocupado', a5.s === 409, a5.d.error);
ok('vincular sin sesión falla', (await call('auth', { mode:'link', credential:c1 })).s === 401);
