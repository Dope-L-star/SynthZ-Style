/* ---------- icono de la pestaña: los 3 círculos como péndulo de Newton ---------- */
function cradleAngles(t, A){
  const u = (t % 1150) / 1150, out = x => 1 - Math.pow(1 - x, 2.4), inn = x => Math.pow(x, 2.4);
  const L = u < .25 ? out(u / .25) : u < .5 ? 1 - inn((u - .25) / .25) : 0;
  const R = u >= .5 && u < .75 ? out((u - .5) / .25) : u >= .75 ? 1 - inn((u - .75) / .25) : 0;
  return [L * A, -R * A];
}
(function favCradle(){
  const link = document.getElementById('favi'); if (!link) return;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); if (!g) return;
  /* SynthFlow tiene su propio logito: la «F» de Flow en cursiva, con su destello */
  const drawFlow = now => {
    g.clearRect(0, 0, 64, 64);
    g.fillStyle = '#0b0c10'; g.beginPath(); if (g.roundRect) g.roundRect(0, 0, 64, 64, 15); else g.rect(0, 0, 64, 64); g.fill();
    const gr = g.createLinearGradient(10, 8, 54, 58); gr.addColorStop(0, '#c9566c'); gr.addColorStop(.62, '#e6b65f'); gr.addColorStop(1, '#ffd9a0');
    g.fillStyle = gr; g.font = 'italic 54px "Instrument Serif", Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText('F', 29, 51);
    const k = now ? .55 + .45 * Math.abs(Math.sin(now / 900)) : 1, sx = 50, sy = 14, r = 7.5 * k;
    g.fillStyle = '#ffe7b0'; g.globalAlpha = .55 + .45 * k; g.beginPath(); g.moveTo(sx, sy - r); g.quadraticCurveTo(sx, sy, sx + r, sy); g.quadraticCurveTo(sx, sy, sx, sy + r); g.quadraticCurveTo(sx, sy, sx - r, sy); g.quadraticCurveTo(sx, sy, sx, sy - r); g.fill(); g.globalAlpha = 1;
    try{ link.href = c.toDataURL('image/png'); }catch(e){}
  };
  const draw = now => {
    if (isFlow()) return drawFlow(now);
    const [a1, a3] = cradleAngles(now, 26 * Math.PI / 180), Lr = 30, py = 4;
    g.clearRect(0, 0, 64, 64);
    g.fillStyle = '#0b0c10'; g.beginPath(); if (g.roundRect) g.roundRect(0, 0, 64, 64, 15); else g.rect(0, 0, 64, 64); g.fill();
    [[20, a1, '#8fb0ff'], [32, 0, '#c9566c'], [44, a3, '#ff8f7a']].forEach(([x, a, col]) => {
      g.globalAlpha = .9; g.fillStyle = col; g.beginPath(); g.arc(x - Lr * Math.sin(a), py + Lr * Math.cos(a), 12, 0, Math.PI * 2); g.fill();
    });
    g.globalAlpha = 1;
    try{ link.href = c.toDataURL('image/png'); }catch(e){}
  };
  let last = 0;
  let on = false;
  const tick = now => { if (!CFG.favAnim){ on = false; draw(0); return; } if (now - last > 50){ last = now; draw(now); } requestAnimationFrame(tick); };
  window.__favStart = () => { if (!on){ on = true; requestAnimationFrame(tick); } };
  window.__favStart();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw(CFG.favAnim ? performance.now() : 0));
  setInterval(() => { if (document.hidden && CFG.favAnim) draw(performance.now()); }, 500);
})();

const total = id => { const u = state.usage[id]; return u ? (u.prompt || 0) + (u.completion || 0) : 0; };
const counted = new Set();
/* o: { est:true si es una estimación, free:true si fue a un modelo gratis, rid: id único de la petición } */
function addUsage(id, p = 0, c = 0, countReq = true, o = {}){
  if (!byId(id)) return false;
  if (o.rid){ if (counted.has(o.rid)) return false; counted.add(o.rid); }          /* la misma petición nunca cuenta dos veces */
  p = num(p); c = num(c);
  syncLedger();
  const L = state.ledger, mine = L.dev[DEV] || (L.dev[DEV] = {}), s = mine[id] || (mine[id] = cleanRow({})), d = today();
  s.p += p; s.c += c; s.days[d] = (s.days[d] || 0) + p + c;
  if (o.est){ s.e += p + c; s.de[d] = (s.de[d] || 0) + p + c; }
  if (countReq){ s.r += 1; s.rd[d] = (s.rd[d] || 0) + 1; if (o.free) s.fd[d] = (s.fd[d] || 0) + 1; }
  state.usage = usageOf(L);
  save(); hooks.usage();
  return true;
}
/* «Reiniciar contadores»: empieza una época nueva; los demás dispositivos la respetan al sincronizar */
function resetUsage(){ state.ledger = { ep:Date.now(), dev:{} }; state.usage = {}; writeLedger(); save(); hooks.usage(); }
/* otra pestaña sumó o guardó: lo traemos para no pisarlo */
addEventListener('storage', e => {
  if (e.key === LKEY){ syncLedger(); hooks.usage(); return; }
  if (e.key === KEY && e.newValue){
    try{ const o = JSON.parse(e.newValue); ['fav', 'cmp', 'model', 'models', 'keys', 'threads', 'pinned', 'del', 'arena', 'survey', 'useTeam', 'battle', 'syncKey', 'sx'].forEach(k => { if (k in o) state[k] = o[k]; }); normalizeLite(); hooks.chats(); hooks.usage(); }catch(_){}
  }
});
function normalizeLite(){ state.keys = cleanStrMap(state.keys); state.model = cleanStrMap(state.model); state.models = cleanModels(state.models); state.fav = strList(state.fav, 300); state.cmp = strList(state.cmp, 4); }

/* ---------- avisos ---------- */
let toastT;
function toast(msg){
  let t = $('#toast');
  if (!t){ t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200);
}
function hydrateIcons(scope){
  $$('[data-ico]', scope || document).forEach(el => {
    const p = byId(el.dataset.ico); if (!p) return;
    const t = document.createElement('template'); t.innerHTML = ico(p).trim();
    const n = t.content.firstChild; if (el.id) n.id = el.id;
    el.replaceWith(n);
  });
}

