/* ---------- dificultades ---------- */
function renderTrouble(){
  const now = P.now, ev = (P.events || []).filter(e => filt === 'all' || e.kind === filt || (filt === 'error' && e.kind === 'jserror'));
  const hour = (P.events || []).filter(e => now - e.t < 3600e3 && e.kind !== 'reload'), people = new Set(hour.map(e => e.who));
  $('#tSum').textContent = people.size ? people.size + (people.size === 1 ? ' persona tuvo' : ' personas tuvieron') + ' dificultades en la última hora' : 'Nadie tuvo dificultades en la última hora';
  const cnt = k => (P.events || []).filter(e => k === 'all' || e.kind === k || (k === 'error' && e.kind === 'jserror')).length;
  $('#tChips').innerHTML = [['all', 'Todas'], ['error', 'Errores'], ['reload', 'Recargas'], ['confused', 'Perdidos'], ['noai', 'Sin IA'], ['limit', 'Tope'], ['puter_out', 'Sin Puter']].map(([k, l]) => '<button type="button" data-f="' + k + '" aria-pressed="' + (filt === k) + '">' + l + '<i>' + cnt(k) + '</i></button>').join('');
  $('#tList').innerHTML = ev.length ? ev.slice(0, 80).map((e, i) => {
    const K = KIND[e.kind] || [e.kind, 'warn'];
    return '<div class="row" style="--i:' + Math.min(i, 20) + '"><span class="av r-' + rc(e.rank) + '">' + ini(e.who) + '</span><div class="tx"><b>' + esc(e.who || 'Alguien') + '</b><small>' + esc(e.detail || '—') + ' · ' + esc(PAGES[e.page] || e.page || '') + ' · ' + ago(e.t) + '</small></div><div class="tags"><span class="tag ' + K[1] + '">' + esc(K[0]) + '</span>' + (e.sub ? '<button class="mini gold" type="button" data-reach="' + esc(e.sub) + '" data-nm="' + esc(e.who) + '">Contactar</button>' : '') + '</div></div>';
  }).join('') : '<div class="empty">Nada por aquí. 🎉</div>';
}
$('#tChips').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; filt = b.dataset.f; renderTrouble(); });

/* ---------- carga ---------- */
function renderLoad(){
  const pm = P.perMin || [], mx = Math.max(1, ...pm);
  $('#lBars').innerHTML = pm.map((v, i) => '<i class="' + (v ? '' : 'z') + '" style="--i:' + i + ';height:' + Math.max(4, v / mx * 100) + '%" title="' + v + ' mensajes"></i>').join('');
  $('#lNow').textContent = pm.slice(-5).reduce((a, b) => a + b, 0) + ' mensajes en los últimos 5 min';
  const st = (P.stat || []).slice().reverse(), m2 = Math.max(1, ...st.map(s => s.req || 0));
  const dn = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  $('#lDays').innerHTML = st.map((s, i) => '<div class="day"><div class="col"><i style="--i:' + i + ';height:' + Math.max(3, (s.req || 0) / m2 * 100) + '%"></i></div><b>' + fmt(s.req || 0) + '</b><small>' + dn[new Date(s.day + 'T12:00:00').getDay()] + ' ' + s.day.slice(8) + '</small></div>').join('');
}

/* ---------- llaves ---------- */
function keyState(k){ const c = k.check; return k.down ? ['off', 'en pausa: ' + k.down] : c ? [c.ok ? (c.kind === 'busy' ? 'warn' : 'ok') : c.kind === 'limit' ? 'warn' : 'off', c.state + (c.t ? ' · ' + ago(c.t) : '')] : ['', 'sin probar todavía']; }
function renderKeys(){
  const ks = (T && T.keys) || P.keys || [], can = !!P.canEdit;
  $('#kN').textContent = ks.length + (ks.length === 1 ? ' llave' : ' llaves') + ' · ' + ((T && T.models && T.models.n) || 0) + ' modelos gratis';
  $('#kAll').hidden = !can || !ks.length;
  $('#kList').innerHTML = ks.length ? ks.map((k, i) => {
    const [d, s] = keyState(k), mine = k.mine || (k.owner && T && T.keys && T.keys.find(x => x.id === k.id && x.mine));
    const pct = k.cap ? Math.min(1, (k.n || 0) / k.cap) : 0;
    return '<div class="krow" style="--i:' + i + '"><i class="dot ' + d + '"></i><div style="display:flex;gap:10px;align-items:center">' + SZ.glassIcon({ id:k.prov, vendor:k.prov === 'mistral' ? 'mistralai' : k.prov }, 'sm') + '<div><b>' + esc(k.provName || k.prov) + '</b><small>' + esc(k.owner ? k.owner.name + ' · ' + k.owner.rank : '') + (k.key ? ' · ' + esc(k.key) : '') + (k.src === 'vercel' ? ' · Vercel' : '') + '</small></div></div><div><small>' + esc(s) + '</small>' + (k.check && !k.check.ok && k.check.detail ? '<small style="color:#ffc0b2">' + esc(k.provName || k.prov) + ' dijo: «' + esc(k.check.detail) + '»</small>' : '') + '</div><div class="kmeter" style="min-width:110px"><div class="meter"><i style="transform:scaleX(' + pct.toFixed(3) + ')"></i></div><small>hoy ' + fmt(k.n || 0) + ' / ' + fmt(k.cap || 0) + ' · ' + fmt(k.tok || 0) + ' palabras</small></div><div class="kact">' + (can || mine ? '<button class="mini" type="button" data-check="' + esc(k.id) + '">Probar</button>' : '') + '</div></div>';
  }).join('') : '<div class="empty">Todavía no hay llaves. Agrega las tuyas abajo: las IAs conectadas se activa para todos al instante.</div>';
}
function renderMyKeys(){
  const mine = (T && T.mine) || {};
  $('#myKeys').innerHTML = PROVS.map(([id, name, url, ph, note]) => {
    const on = !!mine[id], P0 = SZ.byId(id) || SZ.byId('openrouter');
    return '<div class="mk" data-p="' + id + '"><div class="mh">' + SZ.glassIcon({ id, vendor:id === 'mistral' ? 'mistralai' : id }, 'sm') + '<b>' + name + '</b><em class="' + (on ? 'on' : '') + '">' + (on ? '✓ guardada' : 'sin llave') + '</em></div>'
      + (note ? '<p class="cnote" style="margin:4px 0 8px">' + esc(note) + '</p>' : '')
      + '<label class="field"><input type="text" data-sec="1" data-k="' + id + '" placeholder="' + esc(on ? 'Pega otra para cambiarla' : ph) + '" autocomplete="off" data-lpignore="true" data-1p-ignore data-form-type="other" spellcheck="false"></label>'
      + (id === 'cloudflare' ? '<label class="field"><input type="text" data-cfa placeholder="Account ID (opcional; lo busco solo si falta)" autocomplete="off" spellcheck="false" value="' + esc((T && T.cfAccount) || '') + '"></label>' : '')
      + '<div class="acts"><button class="btn sm" type="button" data-save="' + id + '">Guardar y probar</button>' + (on ? '<button class="lnk" type="button" data-del="' + id + '">Quitar</button>' : '') + '<a class="lnk" href="' + url + '" target="_blank" rel="noopener noreferrer">Sacar una gratis</a></div></div>';
  }).join('');
}
async function keysPost(body, btn, label){
  const l = btn ? btn.textContent : ''; if (btn){ btn.disabled = true; btn.textContent = label || 'Probando…'; }
  try{
    const d = await api('trial', { method:'POST', body, keep:true });
    const res = d.keys || [], ok = res.filter(k => k.ok).length;
    toast(res.length ? ok + ' de ' + res.length + (res.length === 1 ? ' llave funciona.' : ' llaves funcionan.') + (res.some(k => !k.ok) ? ' Mira el detalle en la lista.' : '') : 'Listo.');
    T = await api('trial', { keep:true }).catch(() => T); renderKeys(); renderMyKeys(); renderSettings();
  }catch(e){ toast(e.message); }
  finally{ if (btn && btn.isConnected){ btn.disabled = false; btn.textContent = l; } }
}
$('#myKeys').addEventListener('click', async e => {
  const s = e.target.closest('[data-save]'), d = e.target.closest('[data-del]');
  if (s){
    const id = s.dataset.save, v = ($('[data-k="' + id + '"]').value || '').trim(), body = { action:'keys' };
    if (v) body[id] = v;
    if (id === 'cloudflare'){ const a = $('[data-cfa]'); if (a) body.cfAccount = a.value.trim(); }
    if (!v && !(id === 'cloudflare' && body.cfAccount)){ toast('Pega tu llave de ' + PROVS.find(p => p[0] === id)[1] + '.'); return; }
    if (id === 'groq' && v && !/^gsk_/.test(v)){ toast('Esa no parece una llave de Groq: empieza con «gsk_».'); return; }
    if (id === 'openrouter' && v && !/^sk-or-/.test(v)){ toast('Esa no parece una llave de OpenRouter: empieza con «sk-or-».'); return; }
    await keysPost(body, s, 'Guardando…');
  }
  if (d){
    const id = d.dataset.del, nm = PROVS.find(p => p[0] === id)[1];
    if (!(await SZ.szConfirm('¿Quitar tu llave de ' + nm + '?', 'Dejará de usarse para las IAs conectadas. Las llaves de los demás siguen funcionando.', 'Quitar', true))) return;
    await keysPost({ action:'keys', [id]:'' }, d, 'Quitando…');
  }
});
$('#kList').addEventListener('click', e => { const b = e.target.closest('[data-check]'); if (b) keysPost({ action:'check', id:b.dataset.check }, b); });
$('#kAll').addEventListener('click', e => keysPost({ action:'check' }, e.currentTarget, 'Probando todas…'));

