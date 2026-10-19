/* ---------- mensajes ---------- */
const msgsEl = $('#msgs'), lane = $('#lane'), inp = $('#inp'), sendBtn = $('#sendBtn');
/* v1.8: en modo agente la conversación es una sola aunque cada mensaje lo responda una IA distinta */
const AGK = 'agente';
const thModel = () => st().agent && !trialOn ? AGK : selId();
const ckey = () => 'openrouter::' + thModel() + (curT() ? '::' + curT() : '');
const chatArr = () => st().chats[ckey()] || (st().chats[ckey()] = []);
const near = () => msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight;
msgsEl.addEventListener('scroll', () => { stick = near() < 90; $('#toBottom').classList.toggle('show', near() > 240); SZ.S.retarget(); }, { passive:true });
const follow = () => { if (stick) msgsEl.scrollTop = msgsEl.scrollHeight; };
const jump = () => { stick = true; msgsEl.scrollTop = msgsEl.scrollHeight; };
$('#toBottom').addEventListener('click', () => { msgsEl.scrollTo({ top:msgsEl.scrollHeight, behavior:'smooth' }); });

const COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
const REGEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>';
function chipsHtml(fs){ return '<div class="fcs">' + fs.map(f => '<span class="fc ro">' + (f.thumb ? '<img src="' + esc(f.thumb) + '" alt="">' : '<i class="ic">' + esc((f.name.split('.').pop() || 'file').slice(0, 4)) + '</i>') + '<b>' + esc(f.name) + '</b></span>').join('') + '</div>'; }
function userEl(text, fs){ const u = document.createElement('div'); u.className = 'm user'; u.innerHTML = '<div class="who">tú ▸</div><div class="bub"></div>'; $('.bub', u).textContent = text; if (fs && fs.length) $('.bub', u).insertAdjacentHTML('beforeend', chipsHtml(fs)); return u; }
function botEl(mid){
  const m = info(mid), el = document.createElement('div'); el.className = 'm bot brand'; el.style.cssText = brandVars(m); el.dataset.brand = (SZ.brandOf(m) || [])[1] || '';
  el.innerHTML = '<div class="who">' + av(m, 'xs') + '<b>' + esc(m.name) + '</b><span class="md">' + esc(m.vlabel) + '</span><span class="wr">escribiendo<span class="dots"><i></i><i></i><i></i></span><span class="tk">0</span> palabras</span></div><div class="body"></div>';
  return el;
}
function thinkEl(mid){
  const m = info(mid), el = document.createElement('div'); el.className = 'm bot brand think-wrap'; el.style.cssText = brandVars(m);
  el.innerHTML = '<div class="who">' + av(m, 'xs') + '<b>' + esc(m.name) + '</b><span class="md">' + esc(m.vlabel || '') + '</span></div>';
  if (!works[mid]) works[mid] = SZ.workView({ model:m.name });
  el.appendChild(works[mid].el);
  return el;
}
/* ---------- v1.3 · lienzos: cada código o archivo de texto que da la IA sale como un lienzo con «Copiar» y «Descargar» siempre a la vista ---------- */
const CNV_LANG = { js:['JavaScript', 'js'], javascript:['JavaScript', 'js'], jsx:['React', 'jsx'], ts:['TypeScript', 'ts'], typescript:['TypeScript', 'ts'], tsx:['React', 'tsx'], py:['Python', 'py'], python:['Python', 'py'], html:['HTML', 'html'], xml:['XML', 'xml'], svg:['SVG', 'svg'], css:['CSS', 'css'], scss:['SCSS', 'scss'], json:['JSON', 'json'], sql:['SQL', 'sql'], java:['Java', 'java'], c:['C', 'c'], cpp:['C++', 'cpp'], 'c++':['C++', 'cpp'], cs:['C#', 'cs'], csharp:['C#', 'cs'], go:['Go', 'go'], rust:['Rust', 'rs'], rs:['Rust', 'rs'], php:['PHP', 'php'], rb:['Ruby', 'rb'], ruby:['Ruby', 'rb'], kotlin:['Kotlin', 'kt'], swift:['Swift', 'swift'], dart:['Dart', 'dart'], sh:['Terminal', 'sh'], bash:['Terminal', 'sh'], shell:['Terminal', 'sh'], zsh:['Terminal', 'sh'], powershell:['PowerShell', 'ps1'], ps1:['PowerShell', 'ps1'], yaml:['YAML', 'yml'], yml:['YAML', 'yml'], toml:['TOML', 'toml'], ini:['Configuración', 'ini'], md:['Texto (Markdown)', 'md'], markdown:['Texto (Markdown)', 'md'], txt:['Texto', 'txt'], text:['Texto', 'txt'], plaintext:['Texto', 'txt'], csv:['Tabla (CSV)', 'csv'], tsv:['Tabla', 'tsv'], latex:['LaTeX', 'tex'], tex:['LaTeX', 'tex'], r:['R', 'r'], lua:['Lua', 'lua'], vue:['Vue', 'vue'], dockerfile:['Dockerfile', 'Dockerfile'] };
const CNV_ICO = { copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>', down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>', big:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>' };
function cnvMeta(pre){
  const code = $('code', pre), cls = (code && code.className) || '', m = cls.match(/language-([\w+#-]+)/i), k = m ? m[1].toLowerCase() : '';
  const txt = code ? code.textContent : pre.textContent, L = CNV_LANG[k] || (k ? [k.toUpperCase(), k.replace(/[^\w]/g, '') || 'txt'] : [/^\s*</.test(txt) ? 'HTML' : 'Texto', /^\s*</.test(txt) ? 'html' : 'txt']);
  /* si la IA puso el nombre del archivo justo antes («index.html», `app.py`…), se usa ese */
  let name = '', prev = pre.parentElement && pre.parentElement.classList.contains('cnv') ? pre.parentElement.previousElementSibling : pre.previousElementSibling;
  if (prev){ const f = (prev.textContent || '').match(/([\w.-]+\.(?:[a-z0-9]{1,6}))\s*[:：]?\s*$/i); if (f && !/^\d+\.\d+$/.test(f[1])) name = f[1]; }
  if (!name) name = (L[1] === 'Dockerfile' ? 'Dockerfile' : (k === 'md' || k === 'markdown' || k === 'txt' || k === 'text' || !k ? 'documento' : 'codigo') + '.' + L[1]);
  return { label:L[0], name, text:txt.replace(/\n$/, ''), lines:txt.replace(/\n$/, '').split('\n').length };
}
function codeButtons(body){
  if (!body) return;
  $$('pre', body).forEach(pre => {
    if (pre.closest('.cnv')) return;
    const old = $('.cpc', pre); if (old) old.remove();
    const M = cnvMeta(pre), w = document.createElement('div'); w.className = 'cnv';
    w.innerHTML = '<div class="cnv-h"><span class="cnv-t"><b>' + esc(M.name) + '</b><small>' + esc(M.label) + ' · ' + M.lines + (M.lines === 1 ? ' línea' : ' líneas') + '</small></span>'
      + '<button type="button" class="cnv-b" data-cv="copy" title="Copiar todo">' + CNV_ICO.copy + '<span>Copiar</span></button>'
      + '<button type="button" class="cnv-b" data-cv="down" title="Descargar ' + esc(M.name) + '">' + CNV_ICO.down + '<span>Descargar</span></button>'
      + '<button type="button" class="cnv-b ic" data-cv="big" title="Ver en grande" aria-label="Ver en grande">' + CNV_ICO.big + '</button></div>';
    pre.before(w); w.appendChild(pre);
  });
}
function cnvDownload(M){
  try{ const blob = new Blob([M.text], { type:'text/plain;charset=utf-8' }), u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = M.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); toast('Descargué ' + M.name + '.'); }
  catch(e){ toast('No pude descargarlo. Usa «Copiar».'); }
}
function cnvBig(M){
  const o = document.createElement('div'); o.className = 'szm cnvfull'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', M.name);
  o.innerHTML = '<div class="cnv big"><div class="cnv-h"><span class="cnv-t"><b>' + esc(M.name) + '</b><small>' + esc(M.label) + ' · ' + M.lines + ' líneas</small></span><button type="button" class="cnv-b" data-cv="copy">' + CNV_ICO.copy + '<span>Copiar</span></button><button type="button" class="cnv-b" data-cv="down">' + CNV_ICO.down + '<span>Descargar</span></button><button type="button" class="cnv-b ic" data-cx aria-label="Cerrar">×</button></div><pre><code></code></pre></div>';
  $('code', o).textContent = M.text; document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 300); removeEventListener('keydown', key, true); };
  const key = e => { if (e.key === 'Escape'){ e.stopPropagation(); close(); } };
  addEventListener('keydown', key, true);
  o.addEventListener('click', async e => { if (e.target === o || e.target.closest('[data-cx]')) return close(); const b = e.target.closest('[data-cv]'); if (!b) return; if (b.dataset.cv === 'copy'){ await copyText(M.text); flash(b, '¡Copiado!'); } else cnvDownload(M); });
}
document.addEventListener('click', async e => {
  const b = e.target.closest && e.target.closest('.cnv:not(.big) [data-cv]'); if (!b) return;
  const pre = $('pre', b.closest('.cnv')), M = cnvMeta(pre);
  if (b.dataset.cv === 'copy'){ await copyText(M.text); flash(b, '¡Copiado!'); SZ.SND.tap && SZ.SND.tap(); }
  else if (b.dataset.cv === 'down') cnvDownload(M);
  else cnvBig(M);
});
const STAR_A = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z"/></svg>';
function finishBot(el, meta, last, cont, starred){
  codeButtons($('.body', el));
  if (meta) el.insertAdjacentHTML('beforeend', '<div class="meta">' + esc(meta) + '</div>');
  el.classList.toggle('starred', !!starred);
  el.insertAdjacentHTML('beforeend', '<div class="acts"><button class="act" data-a="copy">' + COPY + 'Copiar</button><button class="act" data-a="down" title="Descargar la respuesta como archivo de texto">' + CNV_ICO.down + 'Descargar</button><button class="act" data-a="star" aria-pressed="' + !!starred + '" title="Guárdala en tus favoritos">' + STAR_A + '<span>' + (starred ? 'Favorita' : 'Guardar') + '</span></button>' + (last ? '<button class="act" data-a="regen" title="Pide otra respuesta: cuenta como un mensaje nuevo">' + REGEN + 'Otra vez</button>' : '') + (last && cont ? '<button class="act" data-a="cont" title="Pide que siga desde donde quedó: cuenta como un mensaje nuevo">↪ Continuar</button>' : '') + '</div>');
  el.classList.toggle('last', !!last);
}
/* ---------- saludo: el principal la primera vez y tras 12 h; en cada chat nuevo, otro ---------- */
const GREET = [
  ['¿Qué quieres ', 'FlowIA’r', ' hoy?'],
  ['Suelta la idea, la ', 'FlowIAmos', '.'],
  ['¿A qué problema le ponemos ', 'Flow', ' hoy?'],
  ['Una idea, mucho ', 'Flow', ', cero límites.'],
  ['Tú pones la idea, ', 'yo el Flow', '.'],
  ['¿Qué ', 'creamos', ' juntos hoy?'],
  ['¿Escribimos, programamos ', 'o soñamos', '?'],
  ['Modo Flow: ', 'activado', '. ¿Qué sigue?'],
  ['¿En qué te ', 'ayudo', ' hoy?'],
  ['Cuéntame, ¿qué tienes ', 'en mente', '?']
];
const GKEY = 'synthz:greet';
let greetI = 0;
try{ const g = JSON.parse(localStorage.getItem(GKEY) || 'null'); greetI = g && Date.now() - (g.seen || 0) < 12 * 3600e3 && GREET[g.i] ? g.i : 0; }catch(e){}
function saveGreet(){ try{ localStorage.setItem(GKEY, JSON.stringify({ i:greetI, seen:Date.now() })); }catch(e){} }
saveGreet();
function nextGreet(){ let n = greetI; while (n === greetI) n = 1 + Math.floor(Math.random() * (GREET.length - 1)); greetI = n; saveGreet(); }
function greetHtml(g){
  let i = 0;
  const w = s => s.split(/(\s+)/).filter(Boolean).map(x => /^\s+$/.test(x) ? ' ' : '<span class="w" style="--i:' + (i++) + '">' + esc(x) + '</span>').join('');
  const tail = g[2].match(/^[.,!?;:]+/), rest = tail ? g[2].slice(tail[0].length) : g[2];
  /* la palabra resaltada y su punto van juntos: nunca queda un «.» solo al empezar la línea */
  return w(g[0]) + '<span class="wnb">' + '<em class="w" style="--i:' + (i++) + '">' + esc(g[1]) + '</em>' + (tail ? '<span class="w wp" style="--i:' + (i++) + '">' + esc(tail[0]) + '</span>' : '') + '</span>' + w(rest);
}
