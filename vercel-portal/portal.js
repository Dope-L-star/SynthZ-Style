/* Vercel solo muestra el video de la nueva página; al terminar (o al saltarlo, o si no carga) aparece el link animado a Cloudflare */
const esc = document.querySelector('.esc'), vid = document.getElementById('vid');
const fin = () => { esc.classList.add('fin'); vid.pause(); setTimeout(() => document.getElementById('ir').focus({ preventScroll: true }), 900); };
vid.addEventListener('ended', fin);
vid.addEventListener('error', fin);
document.getElementById('saltar').addEventListener('click', fin);
document.getElementById('otra').addEventListener('click', () => { esc.classList.remove('fin'); vid.currentTime = 0; vid.play().catch(fin); });
if (matchMedia('(prefers-reduced-motion: reduce)').matches) fin();
else vid.play().catch(() => { vid.controls = true; });
/* quien ya tenía la página vieja instalada se queda con su service worker: este lo borra */
if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
