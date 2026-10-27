/* ===== v2.8 · el fondo se calma cuando conversas: apenas hay mensajes (escribiste o abriste un chat que ya tenías),
   la «seda» del cielo se apaga en «calma» y sube una ola de noche desde la caja de escribir, así todo se lee mejor.
   En un chat nuevo (o al comparar sin respuestas todavía) la ola se retira y vuelve la seda. ===== */
(() => {
  const A = SZ.AURORA; if (!A) return;
  const conv = () => !document.body.classList.contains('fresh') && !$(':scope > .hello', lane);
  let q = 0;
  const check = () => { q = 0; A.setCalm(conv()); };
  const mo = new MutationObserver(() => { if (!q) q = requestAnimationFrame(check); });
  /* al abrir, el cielo ya aparece como corresponde (sin ola); la ola es para los cambios */
  requestAnimationFrame(() => {
    A.setCalm(conv(), true);
    mo.observe(document.body, { attributes:true, attributeFilter:['class'] });
    mo.observe(lane, { childList:true });
  });
})();
