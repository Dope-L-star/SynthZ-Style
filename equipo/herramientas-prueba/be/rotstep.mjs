const R = '/home/claude/site/api/';
const auth = (await import(R + 'auth.js')).default, me = (await import(R + 'me.js')).default;
const call = async (h, method, path, body, tok) => { const r = await h.fetch(new Request('http://x/api/' + path, { method, headers:Object.assign({ 'content-type':'application/json', 'x-forwarded-for':'3.3.3.3' }, tok ? { authorization:'Bearer ' + tok } : {}), body:body ? JSON.stringify(body) : undefined })); return r.json(); };
const [cmd, tok] = process.argv.slice(2);
if (cmd === 'save'){ const s = await call(auth, 'POST', 'auth', { mode:'signup', user:'rotador', pass:'girar-la-clave-1' }); await call(me, 'PUT', 'me', { key:'sk-or-v1-rotacion123456' }, s.token); console.log(s.token); }
else { const d = await call(me, 'GET', 'me', null, tok); console.log(d.key); }
