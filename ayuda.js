/* Ayuda: muestra la página en el idioma que elegiste en SymphorIA (o el de tu navegador) y deja cambiarlo con un toque */
(() => {
  let L = 'es';
  try{ const s = localStorage.getItem('synthz:lang'); L = s === 'es' || s === 'en' ? s : /^en\b/i.test(navigator.language || '') ? 'en' : 'es'; }catch(e){}
  const set = l => {
    L = l; document.documentElement.lang = l;
    document.querySelectorAll('[lang="es"],[lang="en"]').forEach(el => { if (el !== document.documentElement) el.hidden = el.lang !== l; });
    const b = document.getElementById('ayLang'); if (b) b.textContent = l === 'en' ? 'Español' : 'English';
    document.title = l === 'en' ? 'Help · SymphorIA' : 'Ayuda · SymphorIA';
  };
  document.addEventListener('DOMContentLoaded', () => {
    set(L);
    const b = document.getElementById('ayLang');
    if (b) b.addEventListener('click', e => { e.preventDefault(); set(L === 'en' ? 'es' : 'en'); try{ localStorage.setItem('synthz:lang', L); }catch(er){} });
  });
})();
