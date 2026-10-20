/* ---------- consumo ---------- */
function updateTotals(){
  const on = SZ.SZQ.on !== false;
  $('#limRing').innerHTML = SZ.limRing(18); $('#navTotal').innerHTML = '<span class="nt-l">' + SZ.limShort() + '</span>';
  $('#limPill').className = 'pill-total lim ' + SZ.limLvl();
  $('#heroConn').textContent = on ? 'Listo para chatear' : 'Las IAs están descansando';
  $('#heroTotal').textContent = on ? SZ.limTxt().toLowerCase() : 'vuelve en un momento';
}
function renderUsage(){
  const U = st().usage || {}, d = today();
  $('#bigRing').innerHTML = SZ.limRing(76); $('#bigTotal').textContent = SZ.limShort();
  $('#useSplit').innerHTML = SZ.limBar({ title:'IAs conectadas', puter:true }); $('#useSync').innerHTML = SZ.syncNote();
  if (!renderUsage._b || Date.now() - renderUsage._b > 60000){ renderUsage._b = Date.now(); SZ.providerBalance().then(b => { $('#useBal').innerHTML = SZ.balanceHtml(b); }); }
  const req = id => ((U[id] || {}).reqDays || {});
  const SRC = [['synthz', 'IAs conectadas', '#e6b65f'], ['puter', 'Puter', '#6fd3d6']];
  const tot = id => (U[id] || {}).requests || 0, max = Math.max(1, ...SRC.map(([id]) => tot(id)));
  $('#rows').innerHTML = SRC.map(([id, n, c], i) => '<div style="--c:' + c + '"><div class="row-h">' + SZ.glassIcon({ id, vendor:id }, 'sm') + '<b>' + n + '</b><small>' + fmt(req(id)[d] || 0) + ' hoy</small><em>' + fmt(tot(id)) + '</em></div><div class="bar"><i style="--i:' + i + ';--w:' + (tot(id) / max).toFixed(4) + '"></i></div></div>').join('') + '<p class="cnote" style="margin-top:6px">Mensajes en total desde que usas SynthZ.</p>';
  const chart = $('#chart');
  if (!chart.children.length) chart.innerHTML = Array.from({ length:14 }, (_, i) => '<div class="col"><div class="tr"><div class="stack" style="--i:' + i + '"></div></div><span></span></div>').join('');
  const days = [];
  for (let k = 13; k >= 0; k--){ const dt = new Date(); dt.setDate(dt.getDate() - k); days.push(dt.toLocaleDateString('en-CA')); }
  const per = days.map(day => SRC.map(([id, , c]) => ({ c, v:req(id)[day] || 0 })));
  const dmax = Math.max(1, ...per.map(a => a.reduce((s2, x) => s2 + x.v, 0)));
  per.forEach((arr, i) => {
    const col = chart.children[i], sum = arr.reduce((s2, x) => s2 + x.v, 0), st2 = $('.stack', col);
    col.title = days[i] + ': ' + sum + (sum === 1 ? ' mensaje' : ' mensajes'); col.classList.toggle('today', i === 13);
    $('span', col).textContent = days[i].slice(8);
    st2.style.setProperty('--h', (sum / dmax * 100).toFixed(1) + '%');
    st2.innerHTML = arr.filter(x => x.v).map(x => '<u style="flex:' + x.v + ' 1 0;background:' + x.c + '"></u>').join('');
  });
}
SZ.hooks.usage = () => { renderUsage(); updateTotals(); };

$('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ ledger:st().ledger, usage:st().usage, chats:st().chats, model:st().model }, null, 2)], { type:'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'synthz-datos-' + today() + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Listo: descargué una copia de tus datos.');
});
$('#importBtn').addEventListener('click', () => $('#importFile').click());
$('#importFile').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try{
      const d = JSON.parse(r.result);
      if (!d || typeof d !== 'object') throw new Error('x');
      if (d.ledger || d.usage){ SZ.state.ledger = d.ledger ? SZ.cleanLedger(Object.assign({}, d.ledger, { ep:Date.now() })) : { ep:Date.now(), dev:{ legacy:SZ.legacyRow(d.usage) } }; try{ localStorage.setItem('synthz:ledger', JSON.stringify(SZ.state.ledger)); }catch(_){} SZ.normalize(); }
      if (d.chats) st().chats = SZ.cleanChats(d.chats);
      if (d.model) st().model = SZ.cleanStrMap(d.model);
      save(); renderUsage(); updateTotals(); toast('Datos importados.');
    }catch(err){ toast('Ese archivo no es válido.'); }
  };
  r.readAsText(f); e.target.value = '';
});
false && $('#resetBtn').addEventListener('click', async () => { if (await SZ.szConfirm('¿Reiniciar tus contadores?', 'Tu historial de uso vuelve a cero.', 'Reiniciar', true)){ SZ.resetUsage(); renderUsage(); updateTotals(); toast('Contadores en cero.'); } });
$('#wipeBtn').addEventListener('click', async () => { if (await SZ.szConfirm('¿Borrar todo de este navegador?', 'Se borran tus chats y ajustes de este equipo. Lo que está guardado en tu cuenta de SynthZ no se toca.', 'Borrar todo', true)){ SZ.state = { keys:{}, model:{}, models:{}, usage:{}, chats:{}, fav:[], cmp:[], ledger:{ ep:Date.now(), dev:{} } }; try{ localStorage.setItem('synthz:ledger', JSON.stringify(SZ.state.ledger)); }catch(_){} save(); renderCards(); observeAll(); renderLaunch(); renderUsage(); updateTotals(); toast('Todo borrado.'); } });

/* ---------- scroll: solo lo esencial (barra, navegación y sección activa) ---------- */
const bar = $('#progress'), nav = $('#nav');
const secs = ['conectar', 'chat', 'consumo'].map(id => document.getElementById(id));
let ticking = false;
function update(){
  ticking = false;
  const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';
  nav.classList.toggle('scrolled', y > 30);
  let act = null; secs.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .45) act = s.id; });
  $$('.navlinks a, .rail .rbtn[data-sec]').forEach(a => a.classList.toggle('on', a.dataset.sec === act));
  S.retarget();
}
addEventListener('scroll', () => { if (!ticking){ ticking = true; requestAnimationFrame(update); } }, { passive:true });
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href').length < 2) return;
  e.preventDefault();
  const id = a.getAttribute('href').slice(1), el = document.getElementById(id); if (!el) return;
  scrollTo({ top: id === 'top' ? 0 : el.getBoundingClientRect().top + scrollY - 20, behavior:'smooth' });
});

