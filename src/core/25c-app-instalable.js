/* ---------- v2.2 · la app instalable se quitó por ahora (vuelve más adelante, hecha 100 % nuestra).
   Si alguien la alcanzó a instalar en pruebas, aquí se borra su copia guardada. ---------- */
try{
  if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
  if (window.caches) caches.keys().then(ks => ks.filter(k => /^synthz-/.test(k)).forEach(k => caches.delete(k))).catch(() => {});
}catch(e){}
