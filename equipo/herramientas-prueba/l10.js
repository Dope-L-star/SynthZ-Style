const { open } = require('./v15/h.js');
(async () => {
  const mob = process.argv[2] === 'm', back = process.argv[3] === 'b';
  const [w,h] = mob ? [390,844] : [1440,900];
  let { b, p, errs } = await open({ page: back ? 'chat.html' : 'index.html', w, h, wait:3000, state:{ keys:{} } });
  if (!back){ await p.keyboard.press('Escape'); await p.waitForTimeout(9000); } else await p.waitForTimeout(3000);
  await p.route('**/chat.html*', r => r.fulfill({ body:'<html><body style="background:#000">fin</body></html>', contentType:'text/html' }));
  await p.route('**/index.html*', r => r.fulfill({ body:'<html><body style="background:#000">fin</body></html>', contentType:'text/html' }));
  p.on('console', m => { if (m.type() === 'error') console.log('CE', m.text().slice(0, 200)); });
  await p.clock.install();
  await p.evaluate(bk => { setTimeout(() => bk ? SZ.portalBack('index.html') : SZ.portalOut('chat.html'), 5); }, back);
  const tag = (mob ? 'm' : 'd') + (back ? 'b' : 'o');
  for (let i = 0; i < 16; i++){ await p.clock.runFor(450); await p.waitForTimeout(60); try{ await p.screenshot({ path:'/tmp/p-' + tag + '-' + i + '.png', type:'jpeg', quality:70 }); }catch(e){ console.log('fail', i, p.url(), e.message.slice(0,120)); break; } }
  console.log(JSON.stringify(errs));
  await b.close();
  const { execSync } = require('child_process');
  execSync(`python3 -c "
from PIL import Image
import os
fs=[f'/tmp/p-${tag}-{i}.png' for i in range(16) if os.path.exists(f'/tmp/p-${tag}-{i}.png')]
W,H=(360,225) if '${tag}'[0]=='d' else (180,390)
cols=4 if W==360 else 8
s=Image.new('RGB',(W*cols,H*((len(fs)+cols-1)//cols)))
for k,f in enumerate(fs): s.paste(Image.open(f).resize((W,H)),((k%cols)*W,(k//cols)*H))
s.save('/tmp/p-${tag}.png')"`);
})();
