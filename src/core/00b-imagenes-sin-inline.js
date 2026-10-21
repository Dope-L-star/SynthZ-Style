/* Si una imagen marcada con data-fb no carga: sin texto se quita, con texto se cambia por esa letra.
   (Antes eran atributos onerror dentro del HTML; la política de seguridad ya no permite código en línea.) */
document.addEventListener('error', e => {
  const t = e.target;
  if (!t || !t.getAttribute || !t.hasAttribute('data-fb')) return;
  const f = t.getAttribute('data-fb');
  if (f) t.replaceWith(document.createTextNode(f)); else t.remove();
}, true);
