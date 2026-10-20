const { open } = require('../v15/h.js');
(async () => {
  const { b, p, errs } = await open({ w:390, h:844, page:'chat.html', wait:3500 });
  console.log(await p.evaluate(async () => { try{ mtOpen({ text:'x', t:Date.now() }); }catch(e){ return 'ERR ' + e.stack; } return ({ cfg:(await (await fetch('/api/config')).json()).maint, hasEl:!!document.getElementById('szMaint'), typ:typeof mtCheck }); }), errs);
  await b.close();
})();
