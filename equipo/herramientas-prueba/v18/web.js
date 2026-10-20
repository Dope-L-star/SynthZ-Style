/* v2.1: buscar en internet con fuentes */
const { open } = require('../v15/h.js');
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 260) : ''));
const B = 'http://localhost:8765/api/';
const call = async (path, body, tok) => (await fetch(B + path, { method:body ? 'POST' : 'GET', headers:Object.assign({ 'content-type':'application/json', 'x-forwarded-for':'2.2.2.' + Math.floor(Math.random() * 200) }, tok ? { authorization:'Bearer ' + tok } : {}), body:body ? JSON.stringify(body) : undefined })).json();
(async () => {
  const W = +process.argv[2] || 1280, tag = W < 600 ? 'm' : 'd';
  const own = await call('auth', { mode:'signup', user:'sammuersynth', pass:'luz-de-prime-1', setup:'codigo-de-dueno-123' });
  const otok = own.token || (await call('auth', { mode:'login', user:'sammuersynth', pass:'luz-de-prime-1' })).token;
  const k = await call('trial', { action:'keys', groq:'gsk_prueba', tavily:'tvly-prueba', exa:'exa_prueba' }, otok);
  ok('Pulsem: Tavily y Exa se guardan y funcionan', (k.keys || []).filter(x => /tavily|exa/.test(x.prov)).every(x => x.ok) && (k.keys || []).some(x => x.prov === 'tavily'), (k.keys || []).map(x => x.prov + ':' + x.state));
  const u = await call('auth', { mode:'signup', user:'busca' + Date.now().toString(36).slice(-5), pass:'clave-larga-123' });
  let r = await call('ai', { action:'search', q:'precio del dólar hoy' }, u.token);
  ok('el servidor busca con Tavily', r.via === 'internet' && r.results.length === 2 && /dólar/.test(r.results[0].t), r);
  const { b, p, errs } = await open({ w:W, h:W < 600 ? 844 : 800, page:'chat.html', state:{ keys:{} }, init:"localStorage.setItem('mockPuter','0');localStorage.setItem('synthz:sess'," + JSON.stringify(u.token) + ");if(!localStorage.getItem('synthz:cfg'))localStorage.setItem('synthz:cfg',JSON.stringify({v:2,intro:'never',sound:false}))", wait:5000 });
  ok('botón «Buscar en internet» en la caja', await p.evaluate(() => !!document.querySelector('#webBtn')));
  await p.evaluate(() => { window.__sent = []; const of = window.fetch; window.fetch = (u, o) => { if (String(u).includes('/api/ai') && o && o.body && /messages/.test(o.body)) window.__sent.push(JSON.parse(o.body)); return of(u, o); }; });
  await p.evaluate(() => { const i = document.querySelector('#inp'); i.value = '¿cuál es el precio del dólar hoy?'; i.dispatchEvent(new Event('input', { bubbles:true })); document.querySelector('#sendBtn').click(); });
  await p.waitForTimeout(7000);
  const st = await p.evaluate(() => ({ sum:(document.querySelector('.websum') || {}).textContent, user:[...document.querySelectorAll('.m.user')].map(x => x.textContent), sentHasSources:(window.__sent.pop() || { messages:[] }).messages.some(m => /Resultados de una búsqueda en internet/.test(m.content)) }));
  ok('pregunta de «hoy»: busca sola, muestra «Busqué en internet · 2 fuentes»', /Busqué en internet/.test(st.sum || '') && /2 fuentes/.test(st.sum || ''), st.sum);
  ok('la IA recibe los resultados, pero tú ves solo tu pregunta', st.sentHasSources && !st.user.some(x => /Resultados/.test(x)), st);
  await p.evaluate(() => { document.querySelector('.websum .ag-row').click(); }); await p.waitForTimeout(400);
  const links = await p.evaluate(() => [...document.querySelectorAll('.websum .srcl a')].map(a => a.href));
  ok('las fuentes son enlaces de verdad', links.length === 2 && /ejemplo\.co\/dolar/.test(links[0]), links);
  await p.screenshot({ path:__dirname + '/web-' + tag + '-1.png' });
  await p.reload(); await p.waitForTimeout(4500);
  ok('al recargar, las fuentes siguen ahí', await p.evaluate(() => !!document.querySelector('.websum')));
  ok('sin errores', !errs.length, errs);
  await b.close();
  /* sin llaves de búsqueda → Wikipedia */
  await call('trial', { action:'keys', tavily:'', exa:'' }, otok);
  r = await call('ai', { action:'search', q:'Colombia' }, u.token);
  ok('sin buscadores con llave: usa Wikipedia (gratis)', r.via === 'wikipedia' && r.results.length === 1 && /wikipedia|wiki\/Colombia/.test(r.results[0].u), r);
  r = await call('ai', { action:'search', q:'algo' });
  ok('sin cuenta: unas pocas búsquedas al día', r.results && r.left === 2, r);
})();
