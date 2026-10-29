
/* ===== v3.5 · Usuarios: a cada persona se le suben o bajan los límites, se le prenden o apagan funciones y colores, o se suspende.
   Lo guarda el servidor (api/_usuarios.js, por /api/trial) y lo aplica en cada llamada: aquí solo se muestra y se edita.
   Ver y buscar: todo el equipo. Cambiar: Prime y ZFlow (la cuenta de Prime, solo Prime).
   Textos en I18N (claves «pu.*», español e inglés); las tarjetas llevan .notr para que el traductor de frases no las mezcle. ===== */
(() => {
const { $, esc, fmt, toast, api } = SZ;
if (!$('#cUsers')) return;
Object.assign(SZ.I18N.es, {
  'pu.t.alias':'A.L.I.A.S.', 'pu.d.alias':'El agente que cumple un objetivo paso a paso.',
  'pu.t.image':'Crear imágenes', 'pu.d.image':'Imágenes con Pollinations, en SynthFlow y A.L.I.A.S.',
  'pu.t.search':'Buscar en internet', 'pu.d.search':'Tavily, Exa o Wikipedia, en SynthFlow y A.L.I.A.S.',
  'pu.t.review':'Revisión de calidad', 'pu.d.review':'Otra IA revisa cada respuesta antes de mostrarla.',
  'pu.t.aurora':'Color Aurora', 'pu.d.aurora':'Color de pago (llega con Syntonia).',
  'pu.t.oro':'Color Oro negro', 'pu.d.oro':'Color de pago (llega con Syntonia).',
  'pu.yes':'Sí', 'pu.no':'No', 'pu.on':'Prendida', 'pu.off':'Apagada', 'pu.n1':'{n} cuenta', 'pu.n':'{n} cuentas',
  'pu.blocked':'Suspendida', 'pu.own':'Ajustes propios', 'pu.open':'Abrir', 'pu.none':'No encontré a nadie con «{q}».', 'pu.empty':'Todavía no hay cuentas.',
  'pu.allFor':'{f} para todos', 'pu.allOn':'{f}: prendida para todos.', 'pu.allOff':'{f}: apagada para todos.', 'pu.viewOnly':'Puedes verlo; solo Prime y ZFlow pueden cambiarlo.', 'pu.viewPrime':'Puedes verlo; la cuenta de Prime solo la cambia Prime.',
  'pu.now':'Ahora:', 'pu.likeAll':'Como todos ({v})', 'pu.likeTeam':'Como el equipo ({v})', 'pu.team':'Es del equipo ({r}): ya usa todo sin límite de EnerX. Aquí puedes apagarle funciones o cambiarle imágenes, búsquedas y pasos.',
  'pu.google':'Google', 'pu.pass':'Usuario y contraseña', 'pu.created':'Creada {d}', 'pu.seen':'Última vez {d}', 'pu.s1':'1 sesión abierta', 'pu.s':'{n} sesiones abiertas',
  'pu.kDay':'EnerX hoy · {u} de {m} tokens', 'pu.kDayU':'EnerX hoy · sin límite', 'pu.kImg':'imágenes hoy · de {m}', 'pu.kSrch':'búsquedas hoy · de {m}', 'pu.kAx':'pasos de A.L.I.A.S. hoy · ×{x}',
  'pu.limits':'Límites al día', 'pu.limitsP':'Vacío = lo de todos. Se aplica en su próximo mensaje, contando lo que ya usó hoy.',
  'pu.day':'EnerX', 'pu.dayP':'En tokens. Lo de todos: {t} (unas {w} palabras). Entre 1.000 y 5.000.000.', 'pu.unl':'Sin límite de EnerX',
  'pu.img':'Imágenes', 'pu.imgP':'Lo de todos: {n} al día. 0 = ninguna. Hasta 500.',
  'pu.srch':'Búsquedas en internet', 'pu.srchP':'Lo de todos: {n} al día. Hasta 2.000.',
  'pu.ax':'Pasos de A.L.I.A.S.', 'pu.axP':'Cuántas veces lo de todos (planes, pasos y búsquedas del agente). De 1 a 100.', 'pu.ph':'de todos: {v}',
  'pu.feats':'Funciones y colores', 'pu.note':'Nota del equipo', 'pu.noteP':'Por qué le cambiaste esto (solo la ve el equipo)', 'pu.last':'Último cambio: {by} · {d}',
  'pu.save':'Guardar', 'pu.reset':'Volver a lo de todos', 'pu.block':'Suspender cuenta', 'pu.unblock':'Reactivar cuenta', 'pu.saving':'Guardando…',
  'pu.blockQ':'¿Suspender a {w}? Sale de todos sus dispositivos y no puede entrar hasta que la reactives.',
  'pu.okBlock':'Cuenta suspendida.', 'pu.okUnblock':'Cuenta reactivada.', 'pu.okReset':'Listo: vuelve a tener lo de todos.', 'pu.okSave':'Guardado. Se aplica en su próximo mensaje.'
});
Object.assign(SZ.I18N.en, {
  'pu.t.alias':'A.L.I.A.S.', 'pu.d.alias':'The agent that reaches a goal step by step.',
  'pu.t.image':'Create images', 'pu.d.image':'Images with Pollinations, in SynthFlow and A.L.I.A.S.',
  'pu.t.search':'Web search', 'pu.d.search':'Tavily, Exa or Wikipedia, in SynthFlow and A.L.I.A.S.',
  'pu.t.review':'Quality review', 'pu.d.review':'Another AI checks every answer before showing it.',
  'pu.t.aurora':'Aurora color', 'pu.d.aurora':'Paid color (comes with Syntonia).',
  'pu.t.oro':'Black gold color', 'pu.d.oro':'Paid color (comes with Syntonia).',
  'pu.yes':'Yes', 'pu.no':'No', 'pu.on':'On', 'pu.off':'Off', 'pu.n1':'{n} account', 'pu.n':'{n} accounts',
  'pu.blocked':'Suspended', 'pu.own':'Custom settings', 'pu.open':'Open', 'pu.none':'Nobody matches “{q}”.', 'pu.empty':'No accounts yet.',
  'pu.allFor':'{f} for everyone', 'pu.allOn':'{f}: on for everyone.', 'pu.allOff':'{f}: off for everyone.', 'pu.viewOnly':'You can look; only Prime and ZFlow can change it.', 'pu.viewPrime':'You can look; only Prime can change the Prime account.',
  'pu.now':'Now:', 'pu.likeAll':'Like everyone ({v})', 'pu.likeTeam':'Like the team ({v})', 'pu.team':'Team account ({r}): already uses everything with no EnerX limit. Here you can turn features off or change images, searches and steps.',
  'pu.google':'Google', 'pu.pass':'Username and password', 'pu.created':'Created {d}', 'pu.seen':'Last seen {d}', 'pu.s1':'1 open session', 'pu.s':'{n} open sessions',
  'pu.kDay':'EnerX today · {u} of {m} tokens', 'pu.kDayU':'EnerX today · no limit', 'pu.kImg':'images today · of {m}', 'pu.kSrch':'searches today · of {m}', 'pu.kAx':'A.L.I.A.S. steps today · ×{x}',
  'pu.limits':'Daily limits', 'pu.limitsP':'Empty = same as everyone. Applies from their next message, counting what they already used today.',
  'pu.day':'EnerX', 'pu.dayP':'In tokens. Everyone gets {t} (about {w} words). Between 1,000 and 5,000,000.', 'pu.unl':'No EnerX limit',
  'pu.img':'Images', 'pu.imgP':'Everyone gets {n} a day. 0 = none. Up to 500.',
  'pu.srch':'Web searches', 'pu.srchP':'Everyone gets {n} a day. Up to 2,000.',
  'pu.ax':'A.L.I.A.S. steps', 'pu.axP':'How many times the normal amount (plans, steps and agent searches). From 1 to 100.', 'pu.ph':'everyone: {v}',
  'pu.feats':'Features and colors', 'pu.note':'Team note', 'pu.noteP':'Why you changed this (only the team sees it)', 'pu.last':'Last change: {by} · {d}',
  'pu.save':'Save', 'pu.reset':'Back to everyone’s settings', 'pu.block':'Suspend account', 'pu.unblock':'Reactivate account', 'pu.saving':'Saving…',
  'pu.blockQ':'Suspend {w}? They are signed out of every device and can’t sign in until you reactivate them.',
  'pu.okBlock':'Account suspended.', 'pu.okUnblock':'Account reactivated.', 'pu.okReset':'Done: back to everyone’s settings.', 'pu.okSave':'Saved. It applies from their next message.'
});
const t = (k, v) => SZ.t('pu.' + k, v), FEATS = ['alias', 'image', 'search', 'review', 'aurora', 'oro'];
const ft = k => t('t.' + k), fd = k => t('d.' + k);
const RC = r => String(r || '').toLowerCase();
const ini = n => esc(String(n || '?').replace(/^@/, '').charAt(0).toUpperCase() || '?');
const when = d => d ? new Date(d).toLocaleDateString(SZ.lang(), { day:'numeric', month:'short', year:'numeric' }) : '—';
const yes = v => t(v ? 'yes' : 'no');
let L = { users:[], cursor:'0', done:true, q:'', canEdit:false, all:{} }, C = null, loaded = false, busy = false;
['#uList', '#uBody', '#uAll'].forEach(s => $(s).classList.add('notr'));

/* ---------- lista ---------- */
async function find(more){
  if (busy) return; busy = true;
  const q = ($('#uQ').value || '').trim(), mb = $('#uMore');
  if (!more){ L.users = []; L.cursor = '0'; }
  if (mb) mb.disabled = true;
  try{
    /* la búsqueda recorre las cuentas por tandas; sigue sola hasta juntar algunas */
    for (let i = 0; i < 8; i++){
      const d = await api('trial', { method:'POST', body:{ action:'users', q, cursor:L.cursor }, keep:true });
      L.users = L.users.concat(d.users || []); L.cursor = d.cursor; L.done = !!d.done; L.canEdit = !!d.canEdit; L.all = d.all || {}; L.q = q;
      if (L.done || L.users.length >= (q ? 1 : 30)) break;
    }
    loaded = true; renderList(); renderAll();
  }catch(e){ toast(e.message); }
  finally{ busy = false; if (mb) mb.disabled = false; }
}
function renderList(){
  const U = L.users.slice().sort((a, b) => (b.seen || 0) - (a.seen || 0));
  $('#uN').textContent = t(U.length === 1 ? 'n1' : 'n', { n:U.length + (L.done ? '' : '+') });
  $('#uList').innerHTML = U.length ? U.map((u, i) => '<div class="row urow' + (C && C.user.sub === u.sub ? ' on' : '') + '" style="--i:' + i + '"><span class="av r-' + RC(u.rank) + '">' + ini(u.handle || u.name) + '</span><div class="tx"><b>' + esc(u.name || u.handle) + '</b><small>' + esc([u.handle, u.email].filter(Boolean).join(' · ')) + '</small></div><div class="tags">'
    + (u.rank !== 'Synther' ? '<span class="tag gold">' + esc(u.rank) + '</span>' : '') + (u.blocked ? '<span class="tag bad">' + t('blocked') + '</span>' : '') + (u.own ? '<span class="tag ok">' + t('own') + '</span>' : '')
    + '<button class="mini gold" type="button" data-u="' + esc(u.sub) + '">' + t('open') + '</button></div></div>').join('') : '<div class="empty">' + (L.q ? esc(t('none', { q:L.q })) : t('empty')) + '</div>';
  $('#uMore').hidden = L.done;
}
$('#uFind').addEventListener('submit', e => { e.preventDefault(); find(); });
$('#uMore').addEventListener('click', () => find(true));
$('#uList').addEventListener('click', e => { const b = e.target.closest('[data-u]'); if (b) open(b.dataset.u); });

/* ---------- para todos ---------- */
function renderAll(){
  $('#uAll').innerHTML = FEATS.map(k => '<div class="ufr"><div class="tx"><b>' + esc(ft(k)) + '</b><small>' + esc(fd(k)) + '</small></div>'
    + '<div class="seg" role="group" aria-label="' + esc(t('allFor', { f:ft(k) })) + '">' + [['1', 'on'], ['0', 'off']].map(([v, l]) => '<button type="button" data-all="' + k + '" data-v="' + v + '" aria-pressed="' + ((L.all[k] ? '1' : '0') === v) + '"' + (L.canEdit ? '' : ' disabled') + '>' + t(l) + '</button>').join('') + '</div></div>').join('')
    + (L.canEdit ? '' : '<p class="cnote">' + t('viewOnly') + '</p>');
}
$('#uAll').addEventListener('click', async e => {
  const b = e.target.closest('[data-all]'); if (!b || b.disabled || b.getAttribute('aria-pressed') === 'true') return;
  const k = b.dataset.all, f = Object.assign({}, L.all, { [k]:b.dataset.v === '1' });
  try{ const d = await api('trial', { method:'POST', body:{ action:'uall', f }, keep:true }); L.all = d.all; renderAll(); toast(t(d.all[k] ? 'allOn' : 'allOff', { f:ft(k) })); if (C) open(C.user.sub, true); }
  catch(er){ toast(er.message); }
});

/* ---------- ficha ---------- */
async function open(sub, quiet){
  try{
    C = await api('trial', { method:'POST', body:{ action:'user', sub }, keep:true });
    renderCard(); renderList();
    if (!quiet) $('#cUcard').scrollIntoView({ block:'nearest', behavior:SZ.reduce ? 'auto' : 'smooth' });
  }catch(e){ toast(e.message); }
}
const numIn = (id, v, min, max, ph, dis) => '<label class="field"><input type="number" id="' + id + '" min="' + min + '" max="' + max + '" step="1" value="' + (v == null || v === -1 ? '' : v) + '" placeholder="' + esc(t('ph', { v:ph })) + '"' + (dis ? ' disabled' : '') + '></label>';
const kpi = (b, s) => '<div class="kpi"><b>' + b + '</b><span>' + esc(s) + '</span></div>';
const set = (h, p, inner) => '<div class="set"><b>' + esc(h) + '</b><p>' + esc(p) + '</p>' + inner + '</div>';
function renderCard(){
  const c = C, u = c.user, o = c.own, can = c.canEdit, base = c.base, unl = c.now.day === -1;
  $('#uTitle').firstChild.textContent = u.name || u.handle || '—';
  $('#uSub').textContent = [u.handle, u.email].filter(Boolean).join(' · ');
  const feat = k => {
    const own = k in o.f ? (o.f[k] ? '1' : '0') : '', every = c.team ? true : base.f[k];
    return '<div class="ufr"><div class="tx"><b>' + esc(ft(k)) + '</b><small>' + esc(fd(k)) + ' ' + t('now') + ' <em class="' + (c.now.f[k] ? 'on' : 'off') + '">' + yes(c.now.f[k]) + '</em></small></div>'
      + '<div class="seg" role="group" aria-label="' + esc(ft(k)) + '">' + [['', t(c.team ? 'likeTeam' : 'likeAll', { v:yes(every) })], ['1', yes(true)], ['0', yes(false)]].map(([v, l]) => '<button type="button" data-f="' + k + '" data-v="' + v + '" aria-pressed="' + (own === v) + '"' + (can ? '' : ' disabled') + '>' + esc(l) + '</button>').join('') + '</div></div>';
  };
  $('#uBody').innerHTML = '<div class="uhead"><span class="av r-' + RC(u.rank) + '">' + ini(u.handle || u.name) + '</span><div class="tags"><span class="tag' + (u.rank !== 'Synther' ? ' gold' : '') + '">' + esc(u.rank) + '</span>' + (u.blocked ? '<span class="tag bad">' + t('blocked') + '</span>' : '') + '<span class="tag">' + t(c.kind === 'google' ? 'google' : 'pass') + '</span><span class="tag">' + t('created', { d:when(u.created) }) + '</span><span class="tag">' + t('seen', { d:when(u.seen) }) + '</span><span class="tag">' + t(c.sessions === 1 ? 's1' : 's', { n:c.sessions }) + '</span></div></div>'
    + (c.team ? '<p class="note">' + esc(t('team', { r:u.rank })) + '</p>' : '')
    + '<div class="kpis ukpi">' + kpi(unl ? '∞' : Math.max(0, Math.round((1 - c.used.day / c.now.day) * 100)) + ' %', unl ? t('kDayU') : t('kDay', { u:fmt(c.used.day), m:fmt(c.now.day) })) + kpi(fmt(c.used.img), t('kImg', { m:fmt(c.now.img) })) + kpi(fmt(c.used.search), t('kSrch', { m:fmt(c.now.search) })) + kpi(fmt(c.used.alias), t('kAx', { x:c.now.aliasX })) + '</div>'
    + '<h3 class="uh">' + t('limits') + '</h3><p class="cnote">' + t('limitsP') + '</p><div class="setg ulim">'
    + set(t('day'), t('dayP', { t:fmt(base.day), w:SZ.coinsFmt(SZ.coinsOf(base.day)) }), numIn('uDay', o.day, 1000, 5000000, fmt(base.day), !can || o.day === -1) + '<label class="uchk"><input type="checkbox" id="uUnl"' + (o.day === -1 ? ' checked' : '') + (can ? '' : ' disabled') + '> ' + t('unl') + '</label>')
    + set(t('img'), t('imgP', { n:fmt(base.img) }), numIn('uImg', o.img, 0, 500, base.img, !can))
    + set(t('srch'), t('srchP', { n:base.search }), numIn('uSrch', o.search, 0, 2000, base.search, !can))
    + set(t('ax'), t('axP'), numIn('uAx', o.aliasX, 1, 100, '×1', !can)) + '</div>'
    + '<h3 class="uh">' + t('feats') + '</h3><div class="uf" id="uF">' + FEATS.map(feat).join('') + '</div>'
    + '<h3 class="uh">' + t('note') + '</h3><label class="field"><textarea id="uNote" rows="2" maxlength="200" placeholder="' + esc(t('noteP')) + '"' + (can ? '' : ' disabled') + '>' + esc(o.note) + '</textarea></label>'
    + (o.by ? '<p class="cnote">' + esc(t('last', { by:o.by, d:when(o.t) })) + '</p>' : '')
    + (can ? '<div class="tbtn uacts"><button class="btn sm" type="button" data-act="save">' + t('save') + '</button><button class="btn sm ghost" type="button" data-act="reset">' + t('reset') + '</button>'
      + (c.canBlock ? '<span class="sp"></span><button class="btn sm ghost' + (u.blocked ? '' : ' danger') + '" type="button" data-act="block">' + t(u.blocked ? 'unblock' : 'block') + '</button>' : '') + '</div>'
      : '<p class="cnote">' + t(u.rank === 'Prime' && L.canEdit ? 'viewPrime' : 'viewOnly') + '</p>');
}
$('#uBody').addEventListener('change', e => { if (e.target.id === 'uUnl'){ const d = $('#uDay'); d.disabled = e.target.checked; if (e.target.checked) d.value = ''; } });
$('#uBody').addEventListener('click', async e => {
  const f = e.target.closest('[data-f]');
  if (f){ if (!f.disabled) f.parentNode.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === f))); return; }
  const b = e.target.closest('[data-act]'); if (!b || !C) return;
  const act = b.dataset.act, sub = C.user.sub, l = b.textContent;
  if (act === 'block' && !C.user.blocked && !confirm(t('blockQ', { w:C.user.handle || C.user.name }))) return;
  b.disabled = true; b.textContent = t('saving');
  try{
    if (act === 'block') C = await api('trial', { method:'POST', body:{ action:'ublock', sub, on:!C.user.blocked }, keep:true });
    else {
      const v = id => { const x = $(id).value.trim(); return x === '' ? null : +x; }, ff = {};
      if (act === 'save') document.querySelectorAll('#uF [data-f][aria-pressed="true"]').forEach(x => { if (x.dataset.v) ff[x.dataset.f] = x.dataset.v === '1'; });
      const ux = act === 'reset' ? {} : { day:$('#uUnl').checked ? -1 : v('#uDay'), img:v('#uImg'), search:v('#uSrch'), aliasX:v('#uAx'), f:ff, note:$('#uNote').value };
      C = await api('trial', { method:'POST', body:{ action:'uset', sub, ux }, keep:true });
    }
    const u = L.users.find(x => x.sub === sub); if (u){ u.blocked = C.user.blocked; u.own = C.user.own; }
    toast(t(act === 'block' ? (C.user.blocked ? 'okBlock' : 'okUnblock') : act === 'reset' ? 'okReset' : 'okSave'));
    renderCard(); renderList();
  }catch(er){ toast(er.message); b.disabled = false; b.textContent = l; }
});

/* se carga la primera vez que alguien abre «Usuarios» */
const nav = document.getElementById('dNav');
const maybe = () => { if (!loaded && !busy && !$('#app').hidden && !$('#cUsers').hidden) find(); };
if (nav) nav.addEventListener('click', () => setTimeout(maybe, 0));
new MutationObserver(maybe).observe($('#app'), { attributes:true, attributeFilter:['hidden'] });
})();
