/* Hecho por: CONSTRUCTOR */
/* A.L.I.A.S. · pieza 10 · vista: textos estáticos, cabecera, tema y lista de pasos. */
(function(){
'use strict';
const U = window.AliasUI;
const { $, $$, el, t } = U;
const TOOLS = ['search', 'file', 'memory', 'image', 'think'];
const show = (sel, on) => { const n = $(sel); if (n) n.hidden = !on; };
U.show = show;

/* ---- textos de lo que ya está en alias.html (data-i18n*) ---- */
U.applyI18n = function(){
  document.documentElement.lang = U.lang;
  window.ALIAS_LANG = U.lang;
  $$('[data-i18n]').forEach(n => { n.textContent = t(n.dataset.i18n); });
  $$('[data-i18n-ph]').forEach(n => { n.placeholder = t(n.dataset.i18nPh); });
  $$('[data-i18n-aria]').forEach(n => { n.setAttribute('aria-label', t(n.dataset.i18nAria)); });
  document.title = t('titulo');
  U.drawHeader();
};

/* ---- cabecera: idioma y tema claro/oscuro ---- */
U.setScheme = function(s){
  const r = document.documentElement; r.dataset.scheme = s;
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = s === 'light' ? '#f6f2ec' : '#0b0c10';
};
U.drawHeader = function(){
  $$('.langs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === U.lang)));
  const b = $('#schemeBtn'); if (!b) return;
  const light = document.documentElement.dataset.scheme === 'light';
  b.textContent = ''; b.append(U.icon(light ? 'moon' : 'sun'));
  b.setAttribute('aria-label', t(light ? 'tema_oscuro' : 'tema_claro'));
};

/* ---- lista de pasos ---- */
function statusIcon(st){
  const i = el('span', { class: 'sdot', 'aria-hidden': 'true' });
  if (st === 'done') i.append(U.icon('check'));
  else if (st === 'error') i.append(U.icon('x'));
  else if (st === 'running') i.append(el('i', { class: 'ring' }));
  else i.append(el('i', { class: 'hole' }));
  return i;
}
function iconBtn(act, icon, label, extra){
  return el('button', { type: 'button', class: 'iconbtn' + (extra ? ' ' + extra : ''), 'data-act': act, 'data-alias': act === 'ren' ? 'step-edit' : act === 'redo' ? 'redo' : null, 'aria-label': label, title: label }, U.icon(icon));
}

U.drawSteps = function(){
  const S = U.S, box = $('#stepList'); if (!box || !S.plan) return;
  const steps = S.plan.steps, total = steps.length;
  const editable = S.phase === 'edit';
  const canRedo = S.phase !== 'edit' && S.phase !== 'running';
  const frag = document.createDocumentFragment();
  steps.forEach((st, i) => {
    const n = i + 1, stt = U.statusOf(st.id), skipped = !!S.skipped[st.id];
    const label = skipped ? 'st_skipped' : 'st_' + stt;
    const li = el('li', { class: 'step', 'data-alias': 'step', 'data-id': st.id, 'data-status': skipped ? 'skipped' : stt, 'aria-current': (S.cur === st.id && S.phase === 'running') ? 'step' : null });
    li.append(el('span', { class: 'num', 'aria-hidden': 'true' }, String(n)), statusIcon(stt));

    const body = el('div', { class: 'sbody' });
    if (S.editing === st.id){
      const inp = el('input', { type: 'text', class: 'ren', 'data-alias': 'step-title', maxlength: '120', value: st.title || '', 'aria-label': t('rename_label', { n }) });
      inp.value = st.title || '';
      body.append(inp);
    }else{
      body.append(el('div', { class: 'stitle', 'data-alias': 'step-title', text: st.title || t('paso_n', { n }) }));
    }
    const meta = el('div', { class: 'smeta' },
      el('span', { class: 'stag', text: t('paso_n', { n }) }),
      TOOLS.includes(st.tool) ? el('span', { class: 'stool', text: t('tool_' + st.tool) }) : null,
      el('span', { class: 'sst', text: t(label) }));
    body.append(meta);
    if (stt === 'error' && S.errors[st.id]) body.append(el('div', { class: 'serr', text: S.errors[st.id] }));
    const r = S.results[st.id];
    if (r && (r.output || '').trim()){
      const det = el('details', { class: 'sout' }, el('summary', { text: t('ver_salida') }));
      const txt = el('div', { class: 'rtext', 'data-alias': 'step-output' }); U.renderText(txt, r.output); det.append(txt);
      if (S.open[st.id]) det.open = true;
      det.addEventListener('toggle', () => { S.open[st.id] = det.open; });
      body.append(det);
    }
    li.append(body);

    const acts = el('div', { class: 'sacts' });
    if (editable){
      acts.append(
        iconBtn('up', 'up', t('btn_subir', { n }), i === 0 ? 'is-off' : ''),
        iconBtn('down', 'down', t('btn_bajar', { n }), i === total - 1 ? 'is-off' : ''),
        iconBtn('ren', 'edit', t('btn_renombrar', { n })),
        iconBtn('del', 'del', t('btn_borrar', { n }), total <= 1 ? 'is-off' : ''));
      acts.querySelectorAll('.is-off').forEach(b => { b.disabled = true; });
    }else if (canRedo && (stt === 'done' || stt === 'error')){
      acts.append(iconBtn('redo', 'redo', t('btn_rehacer', { n }), 'wide'));
    }
    li.append(acts);
    frag.append(li);
  });
  box.textContent = ''; box.append(frag);
  if (S.editing != null){ const inp = $('.ren', box); if (inp){ inp.focus(); inp.select(); } }

  const done = steps.filter(s => U.isFinished(s.id)).length;
  const pr = $('#progress'); if (pr){ pr.max = total; pr.value = done; pr.setAttribute('aria-label', t('progreso_n', { n: done, total })); }
  const pt = $('#progTxt'); if (pt) pt.textContent = t('progreso_n', { n: done, total });
};

/* ---- todo junto ---- */
U.draw = function(){
  const S = U.S;
  show('#vHome', !S.plan);
  show('#vPlan', !!S.plan);
  if (S.plan){
    $('#planGoal').textContent = S.goal;
    show('#editHint', S.phase === 'edit');
    U.drawSteps();
    if (U.drawControls) U.drawControls();
    if (U.drawResult) U.drawResult();
  }
  const go = $('#goBtn'); if (go){ go.disabled = S.busy; go.textContent = t(S.busy ? 'planeando' : 'goal_btn'); }
  const form = $('#goalForm'); if (form) form.setAttribute('aria-busy', String(S.busy));
};
})();
