const { open } = require('../v15/h.js');
(async () => {
  const { b, p, errs } = await open({ w:1440, h:900, state:{ keys:{ openrouter:'sk-or-v1-x' }, model:{ openrouter:'or:qwen/qwen3-235b-a22b:free' }, models:{}, usage:{}, chats:{}, fav:[], cmp:[] }, init:"localStorage.setItem('mockPuter','0')" });
  const H = { 'access-control-allow-origin':'*', 'access-control-allow-headers':'*', 'access-control-allow-methods':'*' };
  await p.route('**/api.groq.com/**', async r => {
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status:204, headers:H });
    const u = r.request().url(), auth = r.request().headers().authorization;
    if (auth !== 'Bearer gsk_' + 'x'.repeat(30)) return r.fulfill({ status:401, headers:H, contentType:'application/json', body:'{"error":{"message":"Invalid API Key"}}' });
    if (u.endsWith('/models')) return r.fulfill({ headers:H, contentType:'application/json', body:JSON.stringify({ data:[{ id:'llama-3.3-70b-versatile', owned_by:'Meta', active:true, context_window:131072 }, { id:'openai/gpt-oss-120b', owned_by:'OpenAI', active:true, context_window:131072 }, { id:'whisper-large-v3', owned_by:'OpenAI', active:true }] }) });
    const body = JSON.parse(r.request().postData());
    return r.fulfill({ headers:Object.assign({ 'content-type':'text/event-stream' }, H), body:'data: {"choices":[{"delta":{"content":"Hola desde Groq con ' + body.model + '"},"finish_reason":"stop"}]}\n\ndata: {"choices":[],"x_groq":{"usage":{"prompt_tokens":11,"completion_tokens":7}}}\n\ndata: [DONE]\n\n' });
  });
  await p.route('**/openrouter.ai/api/v1/chat/completions', async r => {
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status:204, headers:H });
    return r.fulfill({ status:404, headers:H, contentType:'application/json', body:'{"error":{"message":"This model is unavailable for free. The paid version is available now","code":404}}' });
  });
  await p.reload(); await p.waitForTimeout(3500);
  // 1) OpenRouter falla por el modelo → se esconde y cambia
  await p.fill('#inp', 'hola'); await p.press('#inp', 'Enter'); await p.waitForTimeout(2500);
  const s1 = await p.evaluate(() => ({ err:(document.querySelector('.m.err') || {}).textContent, sel:JSON.parse(localStorage.getItem('synthz:v1')).model.openrouter, bad:localStorage.getItem('synthz:bad'), inList:[...document.querySelectorAll('#mlist .mi')].some(x => x.dataset.id === 'or:qwen/qwen3-235b-a22b:free') }));
  console.log('1', JSON.stringify(s1).slice(0, 500));
  // 2) Groq: conectar con llave
  await p.evaluate(() => { document.querySelector('#moreBtn').click(); }); await p.waitForTimeout(300);
  await p.keyboard.press('Escape');
  await p.evaluate(() => document.dispatchEvent(new Event('x')));
  await p.evaluate(() => { const b = document.querySelector('[data-conn]') ; }); 
  await p.evaluate(() => window.__open = 1);
  await p.evaluate(() => { const ev = new MouseEvent('click', { bubbles:true }); const a = document.createElement('a'); a.setAttribute('data-conn', ''); document.body.appendChild(a); a.dispatchEvent(ev); a.remove(); });
  await p.waitForTimeout(900);
  await p.fill('#cGQ', 'gsk_mala'); await p.click('#cGQb', { force:true }); await p.waitForTimeout(600);
  console.log('2a toast', await p.textContent('#toast'));
  await p.fill('#cGQ', 'gsk_' + 'x'.repeat(30)); await p.click('#cGQb', { force:true }); await p.waitForTimeout(3500);
  const s2 = await p.evaluate(() => ({ sel:JSON.parse(localStorage.getItem('synthz:v1')).model.openrouter, groq:!!JSON.parse(localStorage.getItem('synthz:v1')).keys.groq, pay:(document.querySelector('#payPill') || {}).textContent }));
  console.log('2', JSON.stringify(s2), await p.evaluate(() => JSON.stringify({ gq:[...document.querySelectorAll('#mlist .mi')].map(x=>x.dataset.id).filter(x=>/^gq/.test(x)), pinned:JSON.parse(localStorage.getItem('synthz:v1')).pinned, cat:(JSON.parse(localStorage.getItem('synthz:catalog-v3')||'{}').list||[]).filter(m=>/^gq/.test(m.id)).map(m=>m.id) })));
  await p.fill('#inp', 'hola groq'); await p.press('#inp', 'Enter'); await p.waitForTimeout(3000);
  console.log('3err', await p.evaluate(() => [...document.querySelectorAll('.m.err')].map(x=>x.textContent.slice(0,120)).join(' | ')));
  console.log('3', await p.evaluate(() => [...document.querySelectorAll('.m.bot .body')].map(x => x.textContent).join(' | ')), await p.evaluate(() => JSON.stringify(SZ.state.usage.groq || null)));
  await p.evaluate(() => document.querySelector('#cPick').click && document.querySelector('#cPick').click()); await p.waitForTimeout(1200);
  await p.screenshot({ path:'v2/groq-pick.png' });
  console.log(errs);
  await b.close();
})();
