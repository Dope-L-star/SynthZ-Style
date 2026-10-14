/* GET /api/config — dice a la página si las cuentas están listas, si «Entrar con Google» está activado
   y qué «ID de cliente» de Google usar para guardar chats en Drive (es público: no es un secreto). */
import { CLIENT_ID, missing, secretFromEnv, json, getJ } from './_lib.js';
export const CID_RX = /^[0-9]{6,20}-[a-z0-9]{10,64}\.apps\.googleusercontent\.com$/;
async function driveCid(){
  const env = (process.env.GOOGLE_DRIVE_CLIENT_ID || '').trim();
  if (env) return env;
  try{ const c = await getJ('cfg:drive'); if (c && CID_RX.test(c.clientId || '')) return c.clientId; }catch(e){}
  return CLIENT_ID;
}
export default { async fetch(){ const m = missing(); return json({ ok:m.length === 0, google:!!CLIENT_ID, googleClientId:CLIENT_ID, driveClientId:await driveCid(), secretFromEnv:secretFromEnv(), missing:m }); } };
