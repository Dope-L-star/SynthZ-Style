const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{ width:1280, height:860 } });
  await ctx.addInitScript("try{localStorage.setItem('synthz:tour','1');localStorage.setItem('synthz:visited','1');if(!localStorage.getItem('synthz:v1'))localStorage.setItem('synthz:v1',JSON.stringify({keys:{openrouter:'sk-or-v1-x'},model:{},models:{},usage:{},chats:{},fav:[],cmp:[]}))}catch(e){}");
  await ctx.route('**/*', r => r.request().url().startsWith('http://localhost') ? r.continue() : r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8765/chat.html'); await p.waitForTimeout(3500);
  await p.mouse.move(400, 300); await p.waitForTimeout(300);
  console.log(await p.evaluate(() => JSON.stringify({ cursorOn:document.documentElement.className, top:document.elementFromPoint(400, 300).outerHTML.slice(0, 120), cd:!!document.querySelector('#cd'), cfg:JSON.stringify(SZ.CFG) })));
  await p.screenshot({ path:'/home/claude/t/C0.png' });
  await b.close();
})();
