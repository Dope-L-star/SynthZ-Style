const { open } = require('../v15/h.js');
(async () => {
  const { b, p, errs } = await open({ w:1440, h:900, state:{ keys:{} }, init:"localStorage.setItem('mockPuter','0')", wait:4000 });
  const r = await p.evaluate(() => { try{ const ro = Element.prototype.remove; Element.prototype.remove = function(){ if (this.id === 'szGate' || (this.closest && this.closest('#szGate'))) console.error('REMOVE ' + (this.id||this.className) + ' ' + new Error().stack.split('\n').slice(1,5).join(' | ')); return ro.call(this); }; new MutationObserver(ms => ms.forEach(m => [...m.removedNodes].forEach(n => { if (n.id === 'szGate') console.error('GONE from ' + (m.target.id || m.target.tagName) + ' ' + new Error().stack); }))).observe(document.body, { childList:true }); window.__u = location.href; SZ.guestGate(); return [!!document.querySelector('#szGate'), !!document.querySelector('#authm,#acc'), SZ.ACC.ready]; }catch(e){ return 'ERR ' + e.message; } });
  console.log(r, errs);
  await p.waitForTimeout(1500); console.log(errs, p.url()); console.log(await p.evaluate(() => document.querySelector('#szGate') && document.querySelector('#szGate').innerText.slice(0, 300)));
  await b.close();
})();
