const { chromium } = require('/opt/node-tools/node_modules/playwright');
const PUTER = `window.puter = { auth:{ isSignedIn:()=>false, signIn:async()=>({}) }, ai:{ listModels: async () => [], chat: async () => ({}) } };`;
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  for (const [w, h, tag, touch] of [[390, 844, 'movil', true], [820, 1180, 'tablet', true]]){
    const ctx = await b.newContext({ viewport:{ width:w, height:h }, hasTouch:touch, isMobile:touch });
    await ctx.addInitScript("try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1');if(!localStorage.getItem('synthz:v1'))localStorage.setItem('synthz:v1',JSON.stringify({keys:{},model:{},models:{},usage:{},chats:{},fav:[],cmp:[]}))}catch(e){}");
    await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://localhost')) return r.continue(); if (u.includes('js.puter.com')) return r.fulfill({ contentType:'text/javascript', body:PUTER }); return r.abort(); });
    const p = await ctx.newPage();
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(10000);
    const ov = await p.evaluate(() => ({ anchoPagina:document.documentElement.scrollWidth, ventana:innerWidth, pequeños:[...document.querySelectorAll('button, a')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.height && (r.width < 40 || r.height < 40) && getComputedStyle(e).visibility !== 'hidden'; }).length }));
    console.log(tag, 'inicio', JSON.stringify(ov));
    await p.screenshot({ path:'/home/claude/t/M-' + tag + '-1.png' });
    await p.goto('http://localhost:8765/chat.html'); await p.waitForTimeout(4000);
    await p.evaluate(() => { const c = document.querySelector('#conn [data-close], #conn #cClose, #blk #bClose'); if (c) c.click(); }); await p.waitForTimeout(900);
    console.log(tag, 'chat', JSON.stringify(await p.evaluate(() => ({ anchoPagina:document.documentElement.scrollWidth, ventana:innerWidth, estado:(document.querySelector('#now') || {}).textContent }))));
    await p.screenshot({ path:'/home/claude/t/M-' + tag + '-2.png' });
    await ctx.close();
  }
  await b.close();
})();
