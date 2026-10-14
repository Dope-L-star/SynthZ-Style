/* GET /api/config — dice a la página si las cuentas están listas y si «Entrar con Google» está activado */
import { CLIENT_ID, missing, secretFromEnv, json } from './_lib.js';
export default { fetch(){ const m = missing(); return json({ ok:m.length === 0, google:!!CLIENT_ID, googleClientId:CLIENT_ID, secretFromEnv:secretFromEnv(), missing:m }); } };
