const { open } = require('./v15/h.js');
(async () => {
  for (const [w,h,t] of [[1440,900,'pc'],[390,844,'mov']]){
    let { b, p, errs } = await open({ page:'privacidad.html', w, h, wait:2000 });
    await p.screenshot({ path:'/tmp/lg-' + t + '.png' });
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    console.log(t, sw, JSON.stringify(errs));
    await b.close();
  }
})();
