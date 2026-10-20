const { open } = require('./v15/h.js');
(async () => {
  for (const [w,h] of [[390,844],[1000,800],[1440,900]]){
    let { b, p, errs } = await open({ w, h, state:{ keys:{} }, wait:4000 });
    const opened = await p.evaluate(() => { const t = document.querySelector('#railTog'); const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden'; const btn = [...document.querySelectorAll('[data-tab="chats"], #tabChats, .mtab[data-t="chats"], #chatsOpen, #railChats')].find(vis); if (btn){ btn.click(); return btn.id || btn.className; } if (vis(t)){ t.click(); return 'railTog'; } return null; });
    await p.waitForTimeout(1200);
    const cands = await p.evaluate(() => [...document.querySelectorAll('a[href="index.html"]')].map(a => { const r = a.getBoundingClientRect(); const top = r.width ? document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) : null; return { id:a.id, vis:r.width > 0 && r.height > 0, hit:!!top && a.contains(top), top:top && (top.id || String(top.className).slice(0, 40)) }; }));
    console.log(w, 'opened', opened, JSON.stringify(cands));
    await b.close();
  }
})();
