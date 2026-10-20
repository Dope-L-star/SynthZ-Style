const { open } = require('../v15/h.js');
(async () => {
  const { b, p } = await open({ w:1440, h:900, page:'chat.html', wait:3000 });
  await p.fill('#inp', 'hola'); await p.keyboard.press('Enter'); await p.waitForTimeout(3500);
  console.log(await p.evaluate(() => {
    const out = {};
    const pick = sel => { const e = document.querySelector(sel); return e ? e.outerHTML.slice(0, 300) : null; };
    out.lane = [...document.querySelectorAll('#lane > *')].slice(0, 3).map(e => e.className + ' :: ' + [...e.children].map(c => c.className).join(' | '));
    out.body = document.body.className; out.html = document.documentElement.className;
    out.bgs = [...document.body.children].map(e => e.tagName + '#' + e.id + '.' + e.className).join('  ');
    return out;
  }));
  await b.close();
})();
