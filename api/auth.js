/* POST /api/auth
     { mode:'signup', user, pass, name? }  → crea tu cuenta con usuario y contraseña (devuelve tu código de recuperación)
     { mode:'login',  user, pass }         → entra
     { mode:'reset',  user, code, pass }   → olvidaste la contraseña: entra con tu código y pon una nueva
     { mode:'change', old, pass }          → cambia tu contraseña (con sesión)
     { mode:'code',   pass }               → genera un código de recuperación nuevo (con sesión)
     { credential }                        → entrar con Google (solo si GOOGLE_CLIENT_ID está configurado)
   DELETE /api/auth                         → cierra esta sesión */
import { route, body, json, fail, verifyGoogle, getJ, setJ, redis, rid, newSession, endSession, endAllSessions, auth, limit, cleanEmail, str,
         hasGoogle, hashPass, checkPass, cleanUser, okUser, recoveryCode, codeHash, sameHash } from './_lib.js';

const err = (s, m) => Object.assign(new Error(m), { status:s });
const ipOf = req => (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
const okPass = p => typeof p === 'string' && p.length >= 8 && p.length <= 200;
const PASS_MSG = 'La contraseña debe tener al menos 8 caracteres.';
const RESERVED = new Set(['admin', 'synthz', 'soporte', 'support', 'root', 'puter', 'openrouter', 'sistema', 'system', 'null', 'undefined']);

async function signedIn(sub, isNew, extra){
  const token = await newSession(sub);
  const [user, profile] = await Promise.all([getJ('u:' + sub), getJ('p:' + sub)]);
  return json(Object.assign({ token, user, profile, isNew }, extra || {}));
}

export default route({
  async POST(req){
    const ip = ipOf(req), b = await body(req, 8000), mode = b.mode || (b.credential ? 'google' : '');

    if (mode === 'signup'){
      await limit('signup:' + ip, 8, 3600);
      const u = cleanUser(b.user);
      if (!okUser(u)) throw err(400, 'Tu usuario debe tener de 3 a 20 letras, números, puntos o guiones bajos (sin espacios ni tildes).');
      if (RESERVED.has(u)) throw err(400, 'Ese usuario está reservado. Prueba con otro.');
      if (!okPass(b.pass)) throw err(400, PASS_MSG);
      if (b.pass.toLowerCase().includes(u)) throw err(400, 'Tu contraseña no puede contener tu usuario.');
      const sub = 'p' + rid(9);
      const got = await redis('SET', 'n:' + u, sub, 'NX');
      if (!got) throw err(409, 'Ese usuario ya existe. Elige otro o entra con él.');
      const code = recoveryCode();
      await Promise.all([
        setJ('pw:' + sub, { h:await hashPass(b.pass), rc:codeHash(code), t:Date.now() }),
        setJ('u:' + sub, { sub, username:u, email:'', name:str(b.name, 40) || u, picture:'', kind:'pass', created:Date.now(), seen:Date.now() })
      ]);
      return signedIn(sub, true, { recovery:code });
    }

    if (mode === 'login'){
      const u = cleanUser(b.user);
      await limit('login:' + ip, 30, 600);
      await limit('login-u:' + u, 10, 600);
      const sub = okUser(u) ? await redis('GET', 'n:' + u) : null;
      const pw = sub ? await getJ('pw:' + sub) : null;
      const ok = await checkPass(String(b.pass || ''), pw && pw.h);
      if (!ok || !sub) throw err(401, 'Usuario o contraseña incorrectos.');
      const user = await getJ('u:' + sub); if (user){ user.seen = Date.now(); await setJ('u:' + sub, user); }
      return signedIn(sub, false);
    }

    if (mode === 'reset'){
      const u = cleanUser(b.user);
      await limit('reset:' + ip, 10, 600);
      await limit('reset-u:' + u, 6, 3600);
      if (!okPass(b.pass)) throw err(400, PASS_MSG);
      const sub = okUser(u) ? await redis('GET', 'n:' + u) : null;
      const pw = sub ? await getJ('pw:' + sub) : null;
      if (!pw || !sameHash(codeHash(b.code), pw.rc)) throw err(401, 'Ese usuario o ese código de recuperación no coinciden.');
      const code = recoveryCode();
      await setJ('pw:' + sub, { h:await hashPass(b.pass), rc:codeHash(code), t:Date.now() });
      await endAllSessions(sub);                          /* cierra la sesión en todos los demás dispositivos */
      return signedIn(sub, false, { recovery:code });
    }

    if (mode === 'change' || mode === 'code'){
      const me = await auth(req);
      await limit('pwchg:' + me.sub, 10, 3600);
      const pw = await getJ('pw:' + me.sub);
      if (!pw) throw err(400, 'Tu cuenta entra con Google: no tiene contraseña de SynthZ.');
      if (!(await checkPass(String((mode === 'change' ? b.old : b.pass) || ''), pw.h))) throw err(401, 'Tu contraseña actual no es correcta.');
      if (mode === 'change'){
        if (!okPass(b.pass)) throw err(400, PASS_MSG);
        pw.h = await hashPass(b.pass); pw.t = Date.now(); await setJ('pw:' + me.sub, pw);
        await endAllSessions(me.sub);
        return signedIn(me.sub, false);                 /* nueva sesión para este dispositivo */
      }
      const code = recoveryCode(); pw.rc = codeHash(code); await setJ('pw:' + me.sub, pw);
      return json({ ok:true, recovery:code });
    }

    if (mode === 'google'){
      if (!hasGoogle()) return fail(400, 'Entrar con Google no está activado en este SynthZ.');
      await limit('auth:' + ip, 20, 600);
      const g = await verifyGoogle(b.credential);
      const sub = 'g' + g.sub, email = cleanEmail(g.email);
      const prev = await getJ('u:' + sub);
      const user = { sub, email, emailOk:!!g.email_verified, name:str(g.name || email.split('@')[0], 60), picture:str(g.picture, 400), kind:'google', created:(prev && prev.created) || Date.now(), seen:Date.now() };
      await setJ('u:' + sub, user);
      if (email) await redis('SET', 'e:' + email, sub);
      return signedIn(sub, !prev);
    }
    return fail(400, 'Acción desconocida.');
  },
  async DELETE(req){ await endSession(req); return json({ ok:true }); }
});
