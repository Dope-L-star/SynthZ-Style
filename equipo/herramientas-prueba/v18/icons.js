const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const z = 'data:image/png;base64,' + fs.readFileSync('/tmp/claude-0/-home-claude/2005f521-c462-52aa-9b36-0bbe4073251e/scratchpad/f.png').toString('base64');
  for (const [n, pad, bg, name] of [[192, 0.12, '#0b0c10', 'icon-192.png'], [512, 0.12, '#0b0c10', 'icon-512.png'], [512, 0.22, '#0b0c10', 'icon-maskable-512.png'], [180, 0.14, '#0b0c10', 'apple-touch-icon.png']]){
    const p = await b.newPage({ viewport:{ width:n, height:n } });
    await p.setContent('<html><body style="margin:0;background:radial-gradient(circle at 50% 40%, #241820, ' + bg + ' 70%);display:grid;place-items:center;width:' + n + 'px;height:' + n + 'px"><div style="width:' + Math.round(n * (1 - 2 * pad)) + 'px;height:' + Math.round(n * (1 - 2 * pad)) + 'px">' + '<img src="' + z + '" style="width:100%;height:100%;object-fit:contain">' + '</div></body></html>');
    await p.screenshot({ path:'/home/claude/site/media/' + name, omitBackground:bg === 'transparent' });
    await p.close();
  }
  await b.close();
})();
