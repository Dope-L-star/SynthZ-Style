const { open } = require('../v15/h.js');
(async () => {
  const W = +process.argv[2] || 390, H = W < 600 ? 844 : 900, tag = W < 600 ? 'm' : 'd';
  for (const [page, name, init] of [['index.html', 'idx', ''], ['chat.html', 'chat', ''], ['index.html', 'idxfirst', "localStorage.removeItem('synthz:visited');localStorage.removeItem('synthz:tour');"]]){
    const { b, p, errs } = await open({ w:W, h:H, page, init });
    await p.screenshot({ path:tag + '-' + name + '.png' });
    console.log(tag, name, errs.length ? errs.slice(0, 3) : 'ok');
    await b.close();
  }
})();
