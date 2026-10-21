/* Arranque mínimo, antes de pintar la página (va en un archivo aparte para que la política de seguridad no permita código en línea). */
(function(){
  var d = document.documentElement;
  try{
    if (d.getAttribute('data-brand') === 'flow'){ d.classList.add('enter'); if (sessionStorage.getItem('synthz:portal')) d.classList.add('po'); }
    else if (sessionStorage.getItem('synthz:back')) d.classList.add('backin');
  }catch(e){}
  /* Puter: se carga desde aquí y avisa si llegó o si un bloqueador lo frenó */
  var s = document.createElement('script');
  s.src = 'https://js.puter.com/v2/'; s.async = true;
  s.onload = function(){ window.__puterOK = 1; window.dispatchEvent(new Event('puter-ready')); };
  s.onerror = function(){ window.__puterBlocked = 1; window.dispatchEvent(new Event('puter-blocked')); };
  document.head.appendChild(s);
})();
