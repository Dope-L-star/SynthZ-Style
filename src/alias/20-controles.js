/* Hecho por: CONSTRUCTOR */
/* A.L.I.A.S. · pieza 20 · controles: pedir plan, editar pasos, ejecutar, pausar, rehacer, cancelar, errores. */
(function(){
'use strict';
const U = window.AliasUI;
const { $, $$, t } = U;
const show = (s, on) => U.show(s, on);
const MAX_STEPS = 7;

const stepNum = id => U.S.plan.steps.findIndex(s => String(s.id) === String(id)) + 1;
const stepById = id => U.S.plan.steps.find(s => String(s.id) === String(id));
const msgHome = txt => { const m = $('#homeMsg'); m.textContent = txt || ''; m.hidden = !txt; };

/* ---- 1) pedir el plan ---- */
U.requestPlan = async function(goal){
  const S = U.S;
  goal = String(goal || '').trim();
  if (!goal){ msgHome(t('err_vacio')); $('#goalInput').focus(); return; }
  if (S.busy) return;
  msgHome('');
  const A = window.ALIAS;
  if (!A || typeof A.plan !== 'function'){ msgHome(t('err_sin_motor')); return; }
  const req = ++S.reqId;
  S.busy = true; U.draw(); U.say(t('planeando'));
  let r;
  try{ r = await A.plan(goal); }catch(e){ r = { ok: false, error: t('err_red') }; }
  if (req !== S.reqId) return;           /* el usuario ya hizo otra cosa */
  S.busy = false;
  if (!r || !r.ok){
    msgHome(r && r.limit ? t('err_limite') : ((r && r.error) || t('err_generico')));
    U.draw(); return;
  }
  const raw = r.plan && Array.isArray(r.plan.steps) ? r.plan.steps : [];
  const steps = raw.slice(0, MAX_STEPS).filter(s => s && s.id != null).map(s => ({ id: s.id, title: String(s.title || ''), tool: s.tool, input: s.input }));
  if (!steps.length){ msgHome(t('err_plan')); U.draw(); return; }
  const mode = S.mode;
  Object.assign(S, U.fresh(), { mode, goal: r.plan.goal || goal, plan: Object.assign({}, r.plan, { steps }), reqId: req });
  U.draw(); U.say(t('plan_listo', { n: steps.length }));
  const h = $('#planTitle'); if (h) h.focus();
};

/* ---- 2) editar el plan (solo antes de ejecutar) ---- */
function move(id, d){
  const a = U.S.plan.steps, i = a.findIndex(s => String(s.id) === String(id)), j = i + d;
  if (i < 0 || j < 0 || j >= a.length) return;
  [a[i], a[j]] = [a[j], a[i]];
  U.draw();
  const b = $('li[data-id="' + CSS.escape(String(id)) + '"] [data-act="' + (d < 0 ? 'up' : 'down') + '"]');
  (b && !b.disabled ? b : $('li[data-id="' + CSS.escape(String(id)) + '"] [data-act]')).focus();
  U.say(t('movido', { title: a[j].title, pos: j + 1 }));
}
function remove(id){
  const S = U.S, a = S.plan.steps; if (a.length <= 1) return;
  const i = a.findIndex(s => String(s.id) === String(id)); if (i < 0) return;
  const [gone] = a.splice(i, 1);
  U.draw(); U.say(t('borrado', { title: gone.title }));
  const next = $$('#stepList li')[Math.min(i, a.length - 1)];
  const b = next && $('[data-act="del"]', next); if (b) b.focus();
}
function rename(id, val, save){
  const S = U.S, st = stepById(id); S.editing = null;
  const v = String(val || '').trim().slice(0, 120);
  if (save && v && st && v !== st.title){ st.title = v; U.say(t('renombrado', { title: v })); }
  U.draw();
  const b = $('li[data-id="' + CSS.escape(String(id)) + '"] [data-act="ren"]'); if (b) b.focus();
}

/* ---- 3) puerta de espera (aprobar / pausa / error) ---- */
const gate = () => new Promise(r => { U.S.gateFn = r; });
const send = x => { const f = U.S.gateFn; if (f){ U.S.gateFn = null; f(x); } };

function prepRedo(i){
  const S = U.S;
  S.plan.steps.forEach((s, k) => { if (k >= i){ delete S.status[s.id]; delete S.results[s.id]; delete S.errors[s.id]; delete S.skipped[s.id]; } });
  S.pausing = false;
}
function withHint(plan, id){
  const p = JSON.parse(JSON.stringify(plan));
  p.steps.forEach(s => { if (String(s.id) === String(id)) s.input = ((s.input || '') + ' ' + t('reintento_pista')).trim(); });
  return p;
}
async function exec(st, hint){
  const S = U.S, A = window.ALIAS;
  if (!A || typeof A.runStep !== 'function') return { err: t('err_sin_motor') };
  const idx = S.plan.steps.findIndex(s => String(s.id) === String(st.id));
  const prev = S.plan.steps.slice(0, idx).map(s => S.results[s.id]).filter(Boolean);
  let r;
  try{ r = await A.runStep(hint ? withHint(S.plan, st.id) : S.plan, st.id, prev); }
  catch(e){ return { err: t('err_red') }; }
  if (!r || !r.ok) return { err: (r && r.error) || t('err_generico'), limit: !!(r && r.limit) };
  const sp = r.step || {};
  if (sp.status === 'error') return { err: sp.error || t('err_generico') };
  return { step: sp };
}

U.runSeq = 0;
U.drive = async function(){
  const S = U.S;
  if (S.running) return;
  const my = ++U.runSeq, dead = () => my !== U.runSeq;   /* cancelar sube runSeq: este ciclo termina solo */
  S.running = true; S.cancelled = false;
  let hint = false;
  while (!dead()){
    const i = S.plan.steps.findIndex(s => !U.isFinished(s.id));
    if (i < 0){ if (U.finish) U.finish(); break; }
    if (S.pausing){
      S.pausing = false; S.phase = 'paused'; U.draw(); U.say(t('pausado'));
      const x = await gate(); if (dead()) return;
      if (x.a === 'redo') prepRedo(x.i);
      continue;
    }
    const st = S.plan.steps[i], n = i + 1, total = S.plan.steps.length;
    S.phase = 'running'; S.cur = st.id; S.status[st.id] = 'running'; delete S.errors[st.id];
    U.draw(); U.say(t('en_curso', { n, total, title: st.title }));
    const out = await exec(st, hint); hint = false;
    if (dead()) return;
    if (out.limit){ S.status[st.id] = 'pending'; S.phase = 'limit'; U.draw(); U.say(t('err_limite')); break; }
    if (out.err){
      S.status[st.id] = 'error'; S.errors[st.id] = out.err; S.phase = 'error'; U.draw();
      U.say(t('error_n', { n, title: st.title }));
      const b = $('#bErrRetry'); if (b) b.focus();
      let x = await gate();
      if (dead()) return;
      if (x.a === 'stop'){ S.phase = 'paused'; U.draw(); x = await gate(); if (dead()) return; }
      if (x.a === 'skip') S.skipped[st.id] = true;
      else if (x.a === 'retry'){ hint = true; delete S.status[st.id]; }
      else if (x.a === 'redo') prepRedo(x.i);
      continue;
    }
    S.status[st.id] = 'done'; S.results[st.id] = out.step; S.cur = null;
    U.say(t('hecho_n', { n, total, title: st.title }));
    const more = S.plan.steps.some(s => !U.isFinished(s.id));
    if (more && S.mode === 'manual' && !S.pausing){
      const nx = S.plan.steps.find(s => !U.isFinished(s.id));
      S.phase = 'await'; S.awaitNext = nx; S.awaitDone = n; U.draw();
      const b = $('#bApprove'); if (b) b.focus();
      const x = await gate(); if (dead()) return;
      if (x.a === 'redo') prepRedo(x.i);
    }else U.draw();
  }
  if (!dead()) S.running = false;
};

/* ---- 4) botones ---- */
function cancelAll(ask){
  const S = U.S;
  if (ask && S.phase !== 'edit' && !confirm(t('confirm_cancel'))) return;
  U.runSeq++; send({ a: 'cancel' });
  const mode = S.mode;
  Object.assign(S, U.fresh(), { mode, reqId: S.reqId + 1 });
  msgHome(''); U.draw(); U.say(t('cancelado'));
  const g = $('#goalInput'); if (g) g.focus();
}
function redo(id){
  const S = U.S, i = S.plan.steps.findIndex(s => String(s.id) === String(id));
  if (i < 0 || S.phase === 'running') return;
  if (S.running){ send({ a: 'redo', i }); return; }
  prepRedo(i); U.drive();
}

U.drawControls = function(){
  const S = U.S, p = S.phase, live = p === 'running' || p === 'await' || p === 'paused' || p === 'error';
  const vp = $('#vPlan'); if (vp) vp.dataset.state = p;   /* edit|running|await|paused|error|limit|done */
  show('#ctl', p !== 'done');
  $$('input[name="mode"]').forEach(r => { r.checked = r.value === S.mode; });
  show('#bRun', p === 'edit');
  show('#bPause', p === 'running' && !S.pausing);
  show('#bResume', p === 'paused');
  show('#bApprove', p === 'await');
  show('#bCancel', p !== 'done');
  const msg = $('#ctlMsg');
  let txt = '';
  if (p === 'running' && S.pausing) txt = t('pausando');
  else if (p === 'await' && S.awaitNext) txt = t('aprobar_q', { n: S.awaitDone, m: stepNum(S.awaitNext.id), title: S.awaitNext.title });
  else if (p === 'paused') txt = t('pausado');
  msg.textContent = txt; msg.hidden = !txt;
  show('#redoNote', live && S.plan.steps.some(s => S.status[s.id] === 'done'));
  show('#errBox', p === 'error');
  show('#limitBox', p === 'limit');
  if (p === 'error'){
    const id = S.plan.steps.find(s => S.status[s.id] === 'error');
    if (id){ $('#errStep').textContent = t('paso_n', { n: stepNum(id.id) }) + ' · ' + id.title; $('#errMsg').textContent = S.errors[id.id] || ''; }
  }
  const run = $('#bRun'); if (run) run.disabled = !S.plan.steps.length;
};

U.bind = function(){
  const S = U.S;
  $('#goalForm').addEventListener('submit', e => { e.preventDefault(); U.requestPlan($('#goalInput').value); });
  $('#goalInput').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)){ e.preventDefault(); U.requestPlan(e.target.value); } });
  $('#goalInput').addEventListener('input', () => msgHome(''));

  /* plantillas: rellenan el objetivo y marcan la parte [entre corchetes] para escribir encima */
  $('#tplList').addEventListener('click', e => {
    const b = e.target.closest('[data-tpl]'); if (!b) return;
    const inp = $('#goalInput'); inp.value = t('tpl_' + b.dataset.tpl + '_g'); inp.focus();
    const a = inp.value.indexOf('['), z = inp.value.indexOf(']');
    if (a >= 0 && z > a) inp.setSelectionRange(a, z + 1);
    msgHome('');
  });

  /* cabecera */
  $$('.langs button').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.lang === U.lang) return;
    U.lang = b.dataset.lang; U.saveLang(U.lang); U.applyI18n(); U.draw();
    window.dispatchEvent(new CustomEvent('alias:lang', { detail: { lang: U.lang } }));
  }));
  $('#schemeBtn').addEventListener('click', () => {
    const next = document.documentElement.dataset.scheme === 'light' ? 'dark' : 'light';
    U.setScheme(next); U.store.set(U.K_SCHEME, next); U.drawHeader();
  });

  /* pasos (delegado) */
  const list = $('#stepList');
  list.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const id = b.closest('li').dataset.id, a = b.dataset.act;
    if (a === 'up') move(id, -1);
    else if (a === 'down') move(id, 1);
    else if (a === 'del') remove(id);
    else if (a === 'ren'){ S.editing = stepById(id).id; U.drawSteps(); }
    else if (a === 'redo') redo(id);
  });
  list.addEventListener('keydown', e => {
    if (!e.target.classList.contains('ren')) return;
    const id = e.target.closest('li').dataset.id;
    if (e.key === 'Enter'){ e.preventDefault(); e.target.dataset.done = '1'; rename(id, e.target.value, true); }
    else if (e.key === 'Escape'){ e.target.dataset.done = '1'; rename(id, '', false); }
  });
  list.addEventListener('focusout', e => {
    if (!e.target.classList || !e.target.classList.contains('ren') || e.target.dataset.done) return;
    e.target.dataset.done = '1'; rename(e.target.closest('li').dataset.id, e.target.value, true);
  });

  /* controles */
  $$('input[name="mode"]').forEach(r => r.addEventListener('change', () => {
    S.mode = r.value;
    if (S.mode === 'auto' && S.phase === 'await') send({ a: 'go' });
  }));
  $('#bRun').addEventListener('click', () => { S.editing = null; U.drive(); });
  $('#bPause').addEventListener('click', () => { S.pausing = true; U.draw(); U.say(t('pausando')); });
  $('#bResume').addEventListener('click', () => send({ a: 'go' }));
  $('#bApprove').addEventListener('click', () => send({ a: 'go' }));
  $('#bCancel').addEventListener('click', () => cancelAll(true));
  $('#bErrSkip').addEventListener('click', () => send({ a: 'skip' }));
  $('#bErrRetry').addEventListener('click', () => send({ a: 'retry' }));
  $('#bErrStop').addEventListener('click', () => send({ a: 'stop' }));
  $('#bLimitBack').addEventListener('click', () => cancelAll(false));
};
U.cancelAll = cancelAll;
})();
