const { open } = require('../v15/h.js');
(async () => {
  const { b, p, errs } = await open({ w:390, h:844, page:'chat.html', wait:3000 });
  for (const q of ['como conecto puter', 'qué es puter', 'como inicio sesion', 'no funciona nada', 'como conecto mi drive', 'quiero conectar']){
    console.log(q, '→', await p.evaluate(q => { const f = botMatch(q); return f ? f.a.slice(0, 90) : null; }, q).catch(e => 'ERR ' + e.message.slice(0, 80)));
  }
  console.log(errs); await b.close();
})();
