/* beta 2 en el navegador: IA de SynthZ sin llaves, Puter opcional, Pulso, SynthonIA */
const { open } = require('./v15/h.js');
const B = 'http://localhost:8765/api/';
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 240) : ''));
const call = async (path, body, tok) => { const r = await fetch(B + path, { method:body ? 'POST' : 'GET', headers:Object.assign({ 'content-type':'application/json', 'x-forwarded-for':'7.7.' + Math.floor(Math.random() * 250) + '.2' }, tok ? { authorization:'Bearer ' + tok } : {}), body:body ? JSON.stringify(body) : undefined }); return { s:r.status, d:await r.json().catch(() => ({})) }; };
(async () => {
  const own = await call('auth', { mode:'signup', user:'sammuersynth', pass:'luz-de-prime-1', setup:'codigo-de-dueno-123' });
  const tok = own.d.token || (await call('auth', { mode:'login', user:'sammuersynth', pass:'luz-de-prime-1' })).d.token;
  await call('trial', { action:'keys', groq:'gsk_prueba', mistral:'mstr_prueba', openrouter:'sk-or-v1-pool' }, tok);
  const shot = process.env.SHOT || '/tmp/b2';
  require('fs').mkdirSync(shot, { recursive:true });

  /* 1 · SynthFlow sin llaves: la IA de SynthZ ya funciona */
  let { b, p, errs } = await open({ state:{ keys:{} }, wait:4500 });
  const sel = await p.evaluate(() => SZ.state.model.openrouter);
  ok('por defecto usa SynthZ Auto', sel === 'sz:auto', sel);
  ok('no está bloqueado', await p.evaluate(() => !document.body.classList.contains('locked')));
  ok('la caja de escribir no pide conectar', await p.evaluate(() => !/Conecta/.test(document.querySelector('#inp').placeholder)));
  ok('el pie dice Gratis', await p.evaluate(() => /Gratis/.test((document.querySelector('#payPill') || document.querySelector('#payL') || {}).textContent || '')), await p.evaluate(() => ((document.querySelector('#payPill') || document.querySelector('#payL') || {}).textContent || '').slice(0, 90)));
  await p.screenshot({ path:shot + '/1-inicio.png' });
  await p.fill('#inp', 'Hola, ¿qué eres?'); await p.keyboard.press('Enter');
  await p.waitForTimeout(3500);
  const last = await p.evaluate(() => { const m = [...document.querySelectorAll('.m.bot')].pop(); return m ? m.textContent.slice(0, 200) : ''; });
  ok('responde con la IA de SynthZ', /prueba/.test(last), last);
  ok('el detalle dice quién respondió', /respondió/.test(last) && !/SynX|IA de SynthZ/.test(last), last);
  ok('sin «Pensando…» pegado', await p.evaluate(() => !document.querySelector('.think-wrap')));
  const q = await p.evaluate(() => SZ.SZQ);
  ok('el tope del día se actualiza', q.used > 0 && q.limit === 25000, q);
  await p.screenshot({ path:shot + '/2-respuesta.png' });
  /* selector: grupos SynthZ y Puter, sin OpenRouter bloqueado */
  await p.evaluate(() => (document.querySelector('#cPick') || document.querySelector('#curChip')).click()); await p.waitForTimeout(1200);
  const grp = await p.evaluate(() => [...document.querySelectorAll('.mgrp b')].map(x => x.textContent));
  ok('grupos: IAs conectadas y Puter', grp.some(x => /IAs conectadas/.test(x)) && grp.some(x => /Puter/.test(x)), grp);
  ok('sin candado de OpenRouter', await p.evaluate(() => !document.querySelector('.olock')));
  ok('pestañas: Gratis visible, sin OpenRouter ni Groq', await p.evaluate(() => !document.querySelector('#provSeg [data-p="sz"]').hidden && !document.querySelector('#provSeg [data-p="or"]') && !document.querySelector('#provSeg [data-p="gq"]')));
  await p.screenshot({ path:shot + '/3-selector.png' });
  await p.keyboard.press('Escape'); await p.waitForTimeout(700);
  /* conexión: solo Puter, sin cajas de llaves */
  await p.evaluate(() => { const a = document.createElement('a'); a.setAttribute('data-conn', ''); document.body.appendChild(a); a.click(); a.remove(); }); await p.waitForTimeout(900);
  ok('panel «Tu IA» sin llaves', await p.evaluate(() => !!document.querySelector('#conn') && !document.querySelector('#conn input') && /activada/i.test(document.querySelector('#conn').textContent)));
  await p.screenshot({ path:shot + '/4-tu-ia.png' });
  await p.keyboard.press('Escape'); await p.waitForTimeout(700);
  ok('Esc cierra «Tu IA»', await p.evaluate(() => !document.querySelector('#conn')));
  /* Configuración se cierra con Esc */
  await p.evaluate(() => SZ.cfgModal()); await p.waitForTimeout(600); await p.keyboard.press('Escape'); await p.waitForTimeout(700);
  ok('Esc cierra Configuración', await p.evaluate(() => !document.querySelector('#cfgm')));
  /* SynthonIA: la bolita no se congela con el cursor encima */
  const anim = await p.evaluate(() => { const b = document.querySelector('#szBot .bf'); return b ? getComputedStyle(b).animationName : 'sin bolita'; });
  ok('la bolita de SynthonIA sigue animada', anim && anim !== 'none', anim);
  ok('sin errores en la consola', !errs.length, errs);
  await b.close();

  /* 2 · Puter sin créditos: pasa sola a la IA de SynthZ */
  ({ b, p, errs } = await open({ state:{ keys:{}, model:{ openrouter:'pu:openai/gpt-5.6-luna' } }, wait:4500 }));
  await p.evaluate(() => { puter.auth.getMonthlyUsage = async () => ({ allowanceInfo:{ monthUsageAllowance:1000000, remaining:0 } }); SZ.state.model.openrouter = 'pu:openai/gpt-5.6-luna'; });
  await p.evaluate(() => { const ev = new Event('x'); });
  await p.fill('#inp', 'Hola Puter'); await p.keyboard.press('Enter'); await p.waitForTimeout(3500);
  const t2 = await p.evaluate(() => ({ last:([...document.querySelectorAll('.m.bot')].pop() || {}).textContent || '', toast:(document.querySelector('#toast') || {}).textContent || '', calls:window.__puterCalls.length }));
  ok('sin créditos: no llama a Puter', t2.calls === 0, t2.calls);
  ok('responde la IA de SynthZ y lo dice', /prueba/.test(t2.last) && /créditos de Puter se acabaron/.test(t2.last), t2.last.slice(-140));
  ok('el único aviso: «Se te acabaron tus créditos personales»', /Se te acabaron tus créditos personales/.test(t2.toast), t2.toast);
  ok('sin errores en la consola (Puter)', !errs.length, errs);
  await b.close();

  /* 3 · el Pulso: solo el equipo */
  ({ b, p, errs } = await open({ page:'pulsem.html', state:{ keys:{} }, wait:2500 }));
  ok('sin cuenta: pide entrar', await p.evaluate(() => !document.querySelector('#gate').hidden && /equipo/i.test(document.querySelector('#gate').textContent)));
  await p.evaluate(t => { localStorage.setItem('synthz:sess', t); }, tok); await p.reload(); await p.waitForTimeout(4000);
  ok('Prime ve el Pulso', await p.evaluate(() => !document.querySelector('#app').hidden));
  const pz = await p.evaluate(() => ({ title:document.querySelector('#hTitle').textContent, keys:document.querySelectorAll('#kList .krow').length, my:document.querySelectorAll('#myKeys .mk').length, rank:document.querySelector('#pRank').textContent, set:!!document.querySelector('#sLimit') }));
  ok('salud, llaves y ajustes', pz.title && pz.keys >= 3 && pz.my === 10 && pz.rank === 'Prime' && pz.set, pz);
  ok('ninguna llave completa en la página', await p.evaluate(() => !/gsk_prueba|mstr_prueba|sk-or-v1-pool/.test(document.documentElement.innerHTML)));
  await p.screenshot({ path:shot + '/5-pulso.png', fullPage:true });
  await p.setViewportSize({ width:390, height:844 }); await p.waitForTimeout(800);
  await p.screenshot({ path:shot + '/6-pulso-cel.png', fullPage:true });
  ok('Pulso en celular sin desbordar', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]));
  ok('sin errores en la consola (Pulso)', !errs.length, errs);
  await b.close();

  /* 4 · inicio: arriba solo los SynXCoin's */
  ({ b, p, errs } = await open({ page:'index.html', state:{ keys:{} }, wait:4000 }));
  const top = await p.evaluate(() => ['#helpBtn', '#cfgBtn', '#accBtn'].map(s => getComputedStyle(document.querySelector(s)).display));
  ok('arriba a la derecha solo los SynXCoin\'s', top.every(d => d === 'none'), top);
  await p.click('#railTog'); await p.waitForTimeout(1400);
  const lg = await p.evaluate(() => { const r = document.querySelector('#nav .logo').getBoundingClientRect(), rr = document.querySelector('#rail .rin').getBoundingClientRect(); return { logo:r.left, rail:rr.right }; });
  ok('con la barrita abierta el logo se ve', lg.logo >= lg.rail - 2, lg);
  await p.screenshot({ path:shot + '/7-inicio-barrita.png' });
  ok('sin errores en la consola (inicio)', !errs.length, errs);
  await b.close();
})();
