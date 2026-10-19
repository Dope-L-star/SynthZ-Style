/* POST /api/auth
     { mode:'signup', user, pass, name? }  → crea tu cuenta con usuario y contraseña (devuelve tu código de recuperación)
     { mode:'login',  user, pass }         → entra
     { mode:'reset',  user, code, pass }   → olvidaste la contraseña: entra con tu código y pon una nueva
     { mode:'change', old, pass }          → cambia tu contraseña (con sesión)
     { mode:'code',   pass }               → genera un código de recuperación nuevo (con sesión)
     { mode:'claim',  setup }              → reclama el rango de una cuenta reservada del equipo (con sesión)
     { credential }                        → entrar con Google (solo si GOOGLE_CLIENT_ID está configurado)
   DELETE /api/auth                         → cierra esta sesión · DELETE /api/auth?all=1 → en todos tus dispositivos */
import { route, body, json, fail, verifyGoogle, getJ, setJ, redis, rid, newSession, endSession, endAllSessions, auth, limit, cleanEmail, str,
         hasGoogle, hashPass, checkPass, passNeedsUpgrade, cleanUser, okUser, recoveryCode, codeHash, sameHash, SEED_ROLES, setupOk,
         sbAccount, sbUser, sbGoogleOn, sbFindByUid } from './_lib.js';

const err = (s, m) => Object.assign(new Error(m), { status:s });
const ipOf = req => (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
const okPass = p => typeof p === 'string' && p.length >= 8 && p.length <= 200;
const PASS_MSG = 'La contraseña debe tener al menos 8 caracteres.';
const RESERVED = new Set(['admin', 'synthz', 'synthflow', 'soporte', 'support', 'root', 'puter', 'openrouter', 'sistema', 'system', 'staff', 'owner', 'null', 'undefined']);
const reservedErr = () => Object.assign(new Error('Ese usuario está reservado para el equipo de SynthZ. Si eres tú, escribe el código de configuración.'), { status:403, code:'reserved' });

async function signedIn(sub, isNew, extra){
  const token = await newSession(sub);
  const [user, profile] = await Promise.all([getJ('u:' + sub), getJ('p:' + sub)]);
  await sbAccount(user);
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
      const seed = SEED_ROLES[u];
      if (seed && !setupOk(b.setup)){ await limit('setup:' + ip, 10, 3600); throw reservedErr(); }
      await limit('signup-all', 300, 86400);              /* tope global de cuentas nuevas por día: frena a los bots */
      if (!okPass(b.pass)) throw err(400, PASS_MSG);
      if (b.pass.toLowerCase().includes(u)) throw err(400, 'Tu contraseña no puede contener tu usuario.');
      const sub = 'p' + rid(9);
      const got = await redis('SET', 'n:' + u, sub, 'NX');
      if (!got) throw err(409, 'Ese usuario ya existe. Elige otro o entra con él.');
      const code = recoveryCode();
      await Promise.all([
        setJ('pw:' + sub, { h:await hashPass(b.pass), rc:codeHash(code), t:Date.now() }),
        setJ('u:' + sub, Object.assign({ sub, username:u, email:'', name:str(b.name, 40) || u, picture:'', kind:'pass', created:Date.now(), seen:Date.now() }, seed ? { role:seed } : {}))
      ]);
      return signedIn(sub, true, { recovery:code });
    }

    if (mode === 'login'){
      const u = cleanUser(b.user);
      await limit('login:' + ip, 30, 600);
      await limit('login-u:' + u + ':' + ip, 10, 600);     /* por usuario + IP: nadie puede bloquearte desde otra conexión */
      await limit('login-ux:' + u, 120, 3600);            /* tope amplio por usuario contra ataques repartidos */
      const sub = okUser(u) ? await redis('GET', 'n:' + u) : null;
      const pw = sub ? await getJ('pw:' + sub) : null;
      const ok = await checkPass(String(b.pass || ''), pw && pw.h);
      if (!ok || !sub) throw err(401, 'Usuario o contraseña incorrectos.');
      if (passNeedsUpgrade(pw.h)){ pw.h = await hashPass(String(b.pass)); await setJ('pw:' + sub, pw); }   /* sube a scrypt más fuerte sin pedir nada */
      const user = await getJ('u:' + sub); if (user){ if (user.blocked) throw err(403, 'Esta cuenta está suspendida. Escríbele al equipo de SynthZ.'); user.seen = Date.now(); await setJ('u:' + sub, user); }
      return signedIn(sub, false);
    }

    if (mode === 'reset'){
      const u = cleanUser(b.user);
      await limit('reset:' + ip, 10, 600);
      await limit('reset-u:' + u + ':' + ip, 6, 3600);
      await limit('reset-ux:' + u, 40, 3600);
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

    if (mode === 'claim'){
      const me = await auth(req);
      await limit('setup:' + ip, 10, 3600);
      const seed = SEED_ROLES[me.username || ''];
      if (!seed) throw err(400, 'Esta cuenta no está reservada para el equipo.');
      if (!setupOk(b.setup)) throw err(403, 'Ese código de configuración no es correcto.');
      me.role = seed; await setJ('u:' + me.sub, me); await sbAccount(me);
      return json({ ok:true, role:seed });
    }

    if (mode === 'google'){
      if (!(await hasGoogle())) return fail(400, 'Entrar con Google no está activado en este SynthZ.');
      await limit('auth:' + ip, 20, 600);
      const g = await verifyGoogle(b.credential);
      const sub = 'g' + g.sub, email = cleanEmail(g.email);
      const prev = await getJ('u:' + sub);
      const user = { sub, email, emailOk:!!g.email_verified, name:str(g.name || email.split('@')[0], 60), picture:str(g.picture, 400), kind:'google', created:(prev && prev.created) || Date.now(), seen:Date.now() };
      await setJ('u:' + sub, user);
      if (email) await redis('SET', 'e:' + email, sub);
      return signedIn(sub, !prev);
    }
    /* entrar con Google a través de Supabase: Supabase confirma quién eres y aquí se crea (o se encuentra) tu cuenta de SynthZ */
    if (mode === 'supabase'){
      await limit('auth:' + ip, 20, 600);
      if (!(await sbGoogleOn())) return fail(400, 'Entrar con Google todavía no está activado.');
      const g = await sbUser(b.token);
      const email = cleanEmail(g.email), uid = String(g.id), meta = g.user_metadata || {};
      let sub = await redis('GET', 'sbu:' + uid) || await sbFindByUid(uid) || (email ? await redis('GET', 'e:' + email) : null);
      const prev = sub ? await getJ('u:' + sub) : null;
      if (prev && prev.blocked) throw err(403, 'Esta cuenta está suspendida. Escríbele al equipo de SynthZ.');
      if (!sub) sub = 's' + uid.replace(/-/g, '').slice(0, 20);
      const user = Object.assign({}, prev || { sub, kind:'google', created:Date.now() }, { email:email || (prev && prev.email) || '', emailOk:!!g.email_confirmed_at, name:(prev && prev.name) || str(meta.full_name || meta.name || (email ? email.split('@')[0] : 'Synther'), 60), picture:str(meta.avatar_url || meta.picture || (prev && prev.picture) || '', 400), sbUid:uid, seen:Date.now() });
      await setJ('u:' + sub, user);
      await redis('SET', 'sbu:' + uid, sub);
      if (email && !(await redis('GET', 'e:' + email))) await redis('SET', 'e:' + email, sub);
      return signedIn(sub, !prev);
    }
    return fail(400, 'Acción desconocida.');
  },
  async DELETE(req){
    if (new URL(req.url).searchParams.get('all') === '1'){ const me = await auth(req); await endAllSessions(me.sub); return json({ ok:true, all:true }); }
    await endSession(req); return json({ ok:true });
  }
});
