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
const CNV_ICO = { eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>', code:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/></svg>', copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>', down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>', big:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>' };
function cnvMeta(pre){
  const code = $('code', pre), cls = (code && code.className) || '', m = cls.match(/language-([\w+#-]+)/i), k = m ? m[1].toLowerCase() : '';
  const txt = code ? code.textContent : pre.textContent, L = CNV_LANG[k] || (k ? [k.toUpperCase(), k.replace(/[^\w]/g, '') || 'txt'] : [/^\s*</.test(txt) ? 'HTML' : 'Texto', /^\s*</.test(txt) ? 'html' : 'txt']);
  /* si la IA puso el nombre del archivo justo antes («index.html», `app.py`…), se usa ese */
  let name = '', prev = pre.parentElement && /\b(cnv|fcard)\b/.test(pre.parentElement.className) ? pre.parentElement.previousElementSibling : pre.previousElementSibling;
  if (prev){ const f = (prev.textContent || '').match(/([\w.-]+\.(?:[a-z0-9]{1,6}))\s*[:：]?\s*$/i); if (f && !/^\d+\.\d+$/.test(f[1])) name = f[1]; }
  if (!name) name = (L[1] === 'Dockerfile' ? 'Dockerfile' : (k === 'md' || k === 'markdown' || k === 'txt' || k === 'text' || !k ? 'documento' : 'codigo') + '.' + L[1]);
  const named = !/^(documento|codigo)\./.test(name) && name !== 'Dockerfile', ext = (name.split('.').pop() || L[1] || 'txt').toLowerCase();
  return { label:L[0], name, named, ext, text:txt.replace(/\n$/, ''), lines:txt.replace(/\n$/, '').split('\n').length };
}
/* v1.9 · archivos como en Claude: cada archivo que da la IA es una tarjeta (nombre, tipo, líneas) con «Ver» y «Descargar»;
   al abrirla sale un lienzo con el código y, si se puede (HTML, SVG, Markdown), la vista previa en vivo.
   Los trozos cortos de código se quedan en el mensaje, solo con «Copiar». */
const FILE_EXT = new Set(['html', 'htm', 'css', 'scss', 'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cc', 'h', 'hpp', 'cs', 'go', 'rs', 'php', 'rb', 'swift', 'kt', 'dart', 'lua', 'sql', 'sh', 'bash', 'ps1', 'json', 'xml', 'svg', 'yaml', 'yml', 'toml', 'md', 'csv', 'vue', 'svelte', 'r', 'm', 'pl', 'scala', 'ino', 'txt', 'ini', 'env', 'dockerfile']);
const canPreview = M => /^(html|htm|svg|md)$/.test(M.ext);
function isFile(M, pre){ return M.named || (M.lines >= 6 && FILE_EXT.has(M.ext)) || (M.lines >= 3 && /^(html|htm|svg)$/.test(M.ext)); }
function codeButtons(body){
  if (!body) return;
  const all = $$('pre', body).filter(pre => !pre.closest('.cnv, .fcard'));
  all.forEach(pre => {
    const old = $('.cpc', pre); if (old) old.remove();
    const M = cnvMeta(pre);
    if (/^(json|txt)$/.test(M.ext) || /"diapositivas"/.test(M.text)){ const D = deckFrom(M.text); if (D){ deckCard(pre, D); return; } }
    if (isFile(M, pre)){
      const c = document.createElement('div'); c.className = 'fcard'; c.dataset.ext = M.ext;
      c.innerHTML = '<button type="button" class="fc-main" data-fv="open" title="Abrir ' + esc(M.name) + '"><span class="fc-ic" aria-hidden="true">' + esc(M.ext.slice(0, 4).toUpperCase()) + '</span><span class="fc-t"><b>' + esc(M.name) + '</b><small>' + esc(M.label) + ' · ' + M.lines + (M.lines === 1 ? ' línea' : ' líneas') + (canPreview(M) ? ' · con vista previa' : '') + '</small></span></button>'
        + (canPreview(M) ? '<button type="button" class="cnv-b" data-fv="prev">' + CNV_ICO.eye + '<span>Vista previa</span></button>' : '')
        + '<button type="button" class="cnv-b" data-fv="open">' + CNV_ICO.code + '<span>Ver</span></button>'
        + '<button type="button" class="cnv-b" data-fv="down" title="Descargar ' + esc(M.name) + '">' + CNV_ICO.down + '<span>Descargar</span></button>';
      { const pv = c.previousElementSibling, prev0 = pre.previousElementSibling; const h = prev0 && /^(P|H[1-6])$/.test(prev0.tagName) && prev0.textContent.trim().replace(/[:：`*]+$/, '').replace(/^[`*]+/, '').trim() === M.name ? prev0 : null; if (h) h.classList.add('fname-h'); }
      pre.before(c); pre.hidden = true; c.appendChild(pre);
    } else {
      const w = document.createElement('div'); w.className = 'cnv mini';
      w.innerHTML = '<button type="button" class="cnv-b cnv-cp" data-cv="copy" title="Copiar" aria-label="Copiar">' + CNV_ICO.copy + '<span>Copiar</span></button>';
      pre.before(w); w.appendChild(pre);
    }
  });
}
const MIME = { html:'text/html', htm:'text/html', css:'text/css', js:'text/javascript', json:'application/json', svg:'image/svg+xml', md:'text/markdown', csv:'text/csv', xml:'application/xml' };
function cnvDownload(M){
  try{ const blob = new Blob([M.text], { type:(MIME[M.ext] || 'text/plain') + ';charset=utf-8' }), u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = M.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); toast('Descargué ' + M.name + '.'); }
  catch(e){ toast('No pude descargarlo. Usa «Copiar».'); }
}
/* los otros archivos del mismo mensaje (para que un HTML use su style.css y su script.js en la vista previa) */
function siblingsOf(card){ const b = card.closest('.body') || card.parentElement; return $$('.fcard pre', b).map(cnvMeta); }
const escRx = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function previewDoc(M, sibs){
  if (M.ext === 'svg') return '<!doctype html><meta charset="utf-8"><style>html,body{margin:0;height:100%;display:grid;place-items:center;background:#fff}svg{max-width:96vw;max-height:96vh}</style>' + M.text;
  let h = M.text;
  if (!/<html[\s>]|<body[\s>]|<!doctype/i.test(h)) h = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + h + '</body></html>';
  (sibs || []).forEach(S => {
    if (S.ext === 'css'){ const rx = new RegExp('<link[^>]+href=["\'](?:\\./)?' + escRx(S.name) + '["\'][^>]*>', 'i'); h = rx.test(h) ? h.replace(rx, () => '<style>' + S.text + '</style>') : h; }
    if (S.ext === 'js'){ const rx = new RegExp('<script[^>]+src=["\'](?:\\./)?' + escRx(S.name) + '["\'][^>]*>\\s*</script>', 'i'); h = rx.test(h) ? h.replace(rx, () => '<script>' + S.text.replace(/<\/script/gi, '<\\/script') + '</script>') : h; }
  });
  return h;
}
/* el lienzo: a la derecha en el computador, pantalla completa en el celular */
let cvEl = null;
function openCanvas(M, sibs, tab){
  closeCanvas(true);
  const pv = canPreview(M);
  const o = document.createElement('div'); o.className = 'cvp'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', M.name);
  o.innerHTML = '<div class="cvp-in"><div class="cvp-h"><span class="fc-ic" aria-hidden="true">' + esc(M.ext.slice(0, 4).toUpperCase()) + '</span><span class="cnv-t"><b>' + esc(M.name) + '</b><small>' + esc(M.label) + ' · ' + M.lines + ' líneas</small></span>'
    + '<button type="button" class="cnv-b" data-cv="copy">' + CNV_ICO.copy + '<span>Copiar</span></button><button type="button" class="cnv-b" data-cv="down">' + CNV_ICO.down + '<span>Descargar</span></button><button type="button" class="cnv-b ic" data-cx aria-label="Cerrar">✕</button></div>'
    + (pv ? '<div class="cvp-tabs" role="tablist"><button type="button" role="tab" data-tab="code">Código</button><button type="button" role="tab" data-tab="prev">Vista previa</button></div>' : '')
    + '<div class="cvp-b"><pre class="cvp-code"><code></code></pre>' + (pv ? '<div class="cvp-prev" hidden></div>' : '') + '</div></div>';
  const code = $('code', o); code.textContent = M.text;
  document.body.appendChild(o); cvEl = o; document.body.classList.add('canvasing');
  requestAnimationFrame(() => o.classList.add('on'));
  const box = $('.cvp-prev', o);
  const show = t => {
    $$('[data-tab]', o).forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
    $('.cvp-code', o).hidden = t === 'prev'; if (box) box.hidden = t !== 'prev';
    if (t === 'prev' && box && !box.firstChild){
      if (M.ext === 'md'){ const d = document.createElement('div'); d.className = 'cvp-md'; d.innerHTML = md(M.text); box.appendChild(d); }
      else {
        /* la vista previa corre aislada: sin acceso a tu cuenta, tus chats ni esta página */
        const f = document.createElement('iframe'); f.title = 'Vista previa de ' + M.name; f.setAttribute('sandbox', 'allow-scripts allow-modals allow-forms allow-pointer-lock'); f.setAttribute('referrerpolicy', 'no-referrer');
        /* la página de la vista previa tiene su propia política (preview.html) y recibe el documento por mensaje cuando avisa que está lista.
           Si no avisa a tiempo, se muestra sin scripts (la política de esta página no deja correrlos aquí) y se explica. */
        const doc = previewDoc(M, sibs); f.src = 'preview.html';
        let ok = false;
        const onMsg = e => { if (e.source === f.contentWindow && e.data && e.data.synthzPreviewReady){ ok = true; removeEventListener('message', onMsg); f.contentWindow.postMessage({ synthzPreview:doc }, '*'); } };
        addEventListener('message', onMsg);
        setTimeout(() => {
          if (ok || !f.isConnected) return; removeEventListener('message', onMsg);
          const g = document.createElement('iframe'); g.title = f.title; g.setAttribute('sandbox', ''); g.setAttribute('referrerpolicy', 'no-referrer'); g.srcdoc = doc; f.replaceWith(g);
          const n = document.createElement('p'); n.className = 'cnote'; n.style.cssText = 'margin:6px 10px;font-size:12px'; n.textContent = 'No pude abrir la vista previa completa, así que la muestro sin scripts. Usa «Descargar» para verla con todo funcionando.'; box.prepend(n);
        }, 3000);
        box.appendChild(f);
      }
    }
  };
  show(pv && tab === 'prev' ? 'prev' : 'code');
  o.addEventListener('click', async e => {
    if (e.target === o || e.target.closest('[data-cx]')) return closeCanvas();
    const t = e.target.closest('[data-tab]'); if (t) return show(t.dataset.tab);
    const b = e.target.closest('[data-cv]'); if (!b) return;
    if (b.dataset.cv === 'copy'){ await copyText(M.text); flash(b, '¡Copiado!'); } else cnvDownload(M);
  });
}
function closeCanvas(now){ if (!cvEl) return; const o = cvEl; cvEl = null; document.body.classList.remove('canvasing'); if (now){ o.remove(); return; } o.classList.remove('on'); setTimeout(() => o.remove(), 380); }
addEventListener('keydown', e => { if (e.key === 'Escape' && cvEl){ e.stopPropagation(); closeCanvas(); } }, true);
document.addEventListener('click', async e => {
  const f = e.target.closest && e.target.closest('.fcard [data-fv]');
  if (f){
    const card = f.closest('.fcard'), M = cnvMeta($('pre', card));
    if (f.dataset.fv === 'down') cnvDownload(M);
    else openCanvas(M, siblingsOf(card), f.dataset.fv === 'prev' ? 'prev' : 'code');
    return;
  }
  const b = e.target.closest && e.target.closest('.cnv.mini [data-cv]'); if (!b) return;
  const M = cnvMeta($('pre', b.closest('.cnv')));
  await copyText(M.text); flash(b, '¡Copiado!'); SZ.SND.tap && SZ.SND.tap();
});
const STAR_A = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z"/></svg>';
function finishBot(el, meta, last, cont, starred){
  codeButtons($('.body', el)); if (el._sources) citeLinks($('.body', el), el._sources);
  if (meta) el.insertAdjacentHTML('beforeend', '<div class="meta">' + esc(meta) + '</div>');
  el.classList.toggle('starred', !!starred);
  el.insertAdjacentHTML('beforeend', '<div class="acts"><button class="act" data-a="copy" data-tip="Copiar" aria-label="Copiar">' + COPY + 'Copiar</button><button class="act" data-a="voice" data-tip="Escuchar" aria-label="Escuchar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg><span>Escuchar</span></button><button class="act" data-a="star" aria-pressed="' + !!starred + '" data-tip="' + (starred ? 'Quitar de favoritos' : 'Guardar en favoritos') + '" aria-label="Guardar en favoritos">' + STAR_A + '<span>' + (starred ? 'Favorita' : 'Guardar') + '</span></button>' + (last ? '<button class="act" data-a="regen" data-tip="Otra respuesta (cuenta como un mensaje)" aria-label="Pedir otra respuesta">' + REGEN + 'Otra vez</button>' : '') + (last && cont ? '<button class="act" data-a="cont" data-tip="Que siga desde donde quedó" aria-label="Continuar">↪ Continuar</button>' : '') + '</div>');
  $$('.acts .act', el).forEach(b => { if (!b.title) b.title = b.textContent.trim(); if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', b.textContent.trim()); });
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
