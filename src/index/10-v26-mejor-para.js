/* ===== v2.6 · «¿Qué IA es mejor para…?»: lo que más busca la gente, al lado de «Compáralas a ciegas» ===== */
(() => {
document.querySelectorAll('.bf-ais').forEach(el => {
  el.innerHTML = el.dataset.ais.split(',').map(x => { const [n, v] = x.split(':'); return '<span class="bf-ai">' + SZ.glassIcon({ id:v, vendor:v, name:n }, 'xs') + n + '</span>'; }).join('');
});
})();
