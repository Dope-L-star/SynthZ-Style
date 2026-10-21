/* POST /api/auth
     { mode:'signup', user, pass, name? }  → crea tu cuenta con usuario y contraseña (devuelve tu código de recuperación)
     { mode:'login',  user, pass }         → entra
     { mode:'reset',  user, code, pass }   → olvidaste la contraseña: entra con tu código y pon una nueva
     { mode:'change', old, pass }          → cambia tu contraseña (con sesión)
     { mode:'code',   pass }               → genera un código de recuperación nuevo (con sesión)
     { mode:'claim',  setup }              → reclama el rango de una cuenta reservada del equipo (con sesión)
     { credential }                        → entrar con Google (solo si GOOGLE_CLIENT_ID está configurado)
     { mode:'link', credential|token }     → vincula una cuenta de Google a la cuenta con la que ya entraste (con sesión)
     { mode:'unlink', email }              → quita un Google vinculado (con sesión)
   DELETE /api/auth                         → cierra esta sesión · DELETE /api/auth?all=1 → en todos tus dispositivos */
import { route, body, json, fail, verifyGoogle, getJ, setJ, redis, rid, newSession, endSession, endAllSessions, auth, limit, cleanEmail, str,
         hasGoogle, hashPass, checkPass, passNeedsUpgrade, cleanUser, okUser, recoveryCode, codeHash, sameHash, SEED_ROLES, setupOk,
         sbAccount, sbUser, sbGoogleOn, sbFindByUid, ipOf, roleForEmail, topRole } from './_lib.js';

const err = (s, m) => Object.assign(new Error(m), { status:s });
const okPass = p => typeof p === 'string' && p.length >= 8 && p.length <= 200;
const PASS_MSG = 'La contraseña debe tener al menos 8 caracteres.';
const RESERVED = new Set(['admin', 'synthz', 'synthflow', 'soporte', 'support', 'root', 'puter', 'openrouter', 'sistema', 'system', 'staff', 'owner', 'null', 'undefined']);
const reservedErr = () => Object.assign(new Error('Ese usuario está reservado para el equipo de SynthZ. Si eres tú, escribe el código de configuración.'), { status:403, code:'reserved' });

/* una persona = una cuenta: cada correo/identidad de Google que se vincula apunta a esa cuenta (e:<correo> y gl:<id de Google>) */
async function ownerOf(keys){ for (const k of keys){ if (!k) continue; const s = await redis('GET', k); if (s && await getJ('u:' + s)) return s; } return null; }
async function claimEmail(email, sub, force){ if (!email) return; const cur = await redis('GET', 'e:' + email); if (force || !cur || cur === sub || !(await getJ('u:' + cur))) await redis('SET', 'e:' + email, sub); }
/* apunta el correo a la cuenta, lo anota en su lista y le da el rango que le toque por ese correo */
function addLink(user, email, verified, picture){
  if (!email) return;
  const L = Array.isArray(user.links) ? user.links : (user.links = []);
  if (!L.some(x => x.email === email)) L.push({ email, t:Date.now() });
  user.links = L.slice(-8);
  if (!user.email){ user.email = email; user.emailOk = !!verified; }
  if (!user.picture && picture) user.picture = picture;
  const r = roleForEmail(email, verified); if (r) user.role = topRole(user.role, r);
}
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
      const email = cleanEmail(g.email), verified = g.email_verified === true;
      /* si ese Google (o su correo confirmado) ya está vinculado a una cuenta, se entra a ESA cuenta: no se crea otra */
      const sub = (await ownerOf(['gl:' + g.sub, email && verified ? 'e:' + email : ''])) || 'g' + g.sub;
      const prev = await getJ('u:' + sub);
      if (prev && prev.blocked) throw err(403, 'Esta cuenta está suspendida. Escríbele al equipo de SynthZ.');
      /* se conserva lo que ya tenía la cuenta (rango, suspensión, fecha); solo se actualiza lo que viene de Google */
      const user = Object.assign({}, prev || { sub, kind:'google', created:Date.now() }, { name:(prev && prev.name) || str(g.name || email.split('@')[0], 60), seen:Date.now() });
      if (!prev || prev.kind === 'google'){ user.email = prev && prev.email && prev.email !== email ? prev.email : email; user.emailOk = !!g.email_verified; user.picture = str(g.picture, 400); }
      addLink(user, email, verified, str(g.picture, 400));
      await setJ('u:' + sub, user); await sbAccount(user);
      await redis('SET', 'gl:' + g.sub, sub);
      if (verified) await claimEmail(email, sub, !!roleForEmail(email, true));
      return signedIn(sub, !prev);
    }
    /* entrar con Google a través de Supabase: Supabase confirma quién eres y aquí se crea (o se encuentra) tu cuenta de SynthZ */
    if (mode === 'supabase'){
      await limit('auth:' + ip, 20, 600);
      if (!(await sbGoogleOn())) return fail(400, 'Entrar con Google todavía no está activado.');
      const g = await sbUser(b.token);
      const email = cleanEmail(g.email), uid = String(g.id), meta = g.user_metadata || {};
      const viaGoogle = (g.app_metadata && (g.app_metadata.provider === 'google' || (Array.isArray(g.app_metadata.providers) && g.app_metadata.providers.includes('google')))) || (Array.isArray(g.identities) && g.identities.some(i => i && i.provider === 'google'));
      if (!viaGoogle) throw err(403, 'Por aquí solo se puede entrar con Google.');
      const verified = !!g.email_confirmed_at && meta.email_verified !== false;
      /* el correo solo junta tu cuenta con una que ya existía si Google confirmó que es tuyo (así nadie entra a una cuenta ajena) */
      let sub = (await ownerOf(['sbu:' + uid])) || (await sbFindByUid(uid)) || (email && verified ? await ownerOf(['e:' + email]) : null);
      const prev = sub ? await getJ('u:' + sub) : null;
      if (prev && prev.blocked) throw err(403, 'Esta cuenta está suspendida. Escríbele al equipo de SynthZ.');
      if (!sub) sub = 's' + uid.replace(/-/g, '').slice(0, 20);
      const pic = str(meta.avatar_url || meta.picture || '', 400);
      const user = Object.assign({}, prev || { sub, kind:'google', created:Date.now() }, { name:(prev && prev.name) || str(meta.full_name || meta.name || (email ? email.split('@')[0] : 'Synther'), 60), sbUid:(prev && prev.sbUid) || uid, seen:Date.now() });
      if (!prev || prev.kind === 'google'){ user.email = prev && prev.email && prev.email !== email ? prev.email : (email || ''); user.emailOk = !!g.email_confirmed_at; user.picture = pic || (prev && prev.picture) || ''; }
      addLink(user, email, verified, pic);
      await setJ('u:' + sub, user); await sbAccount(user);
      await redis('SET', 'sbu:' + uid, sub);
      if (email && verified) await claimEmail(email, sub, !!roleForEmail(email, true));
      return signedIn(sub, !prev);
    }

    /* VINCULAR: ya entraste (con usuario o con otro Google) y unes una cuenta de Google a esta misma cuenta, para no tener duplicados */
    if (mode === 'link'){
      const me = await auth(req);
      await limit('link:' + me.sub, 12, 3600);
      let gi;
      if (b.credential){
        if (!(await hasGoogle())) return fail(400, 'Entrar con Google no está activado en este SynthZ.');
        const g = await verifyGoogle(b.credential);
        gi = { gsub:g.sub, uid:'', email:cleanEmail(g.email), verified:g.email_verified === true, picture:str(g.picture, 400) };
      } else if (b.token){
        if (!(await sbGoogleOn())) return fail(400, 'Entrar con Google todavía no está activado.');
        const g = await sbUser(b.token), meta = g.user_metadata || {};
        const viaGoogle = (g.app_metadata && (g.app_metadata.provider === 'google' || (Array.isArray(g.app_metadata.providers) && g.app_metadata.providers.includes('google')))) || (Array.isArray(g.identities) && g.identities.some(i => i && i.provider === 'google'));
        if (!viaGoogle) throw err(403, 'Por aquí solo se puede vincular una cuenta de Google.');
        gi = { gsub:'', uid:String(g.id), email:cleanEmail(g.email), verified:!!g.email_confirmed_at && meta.email_verified !== false, picture:str(meta.avatar_url || meta.picture || '', 400) };
      } else throw err(400, 'Falta la cuenta de Google.');
      if (!gi.email || !gi.verified) throw err(400, 'Google no confirmó ese correo, así que no se puede vincular.');
      const otherSub = await ownerOf([gi.gsub ? 'gl:' + gi.gsub : '', gi.uid ? 'sbu:' + gi.uid : '', 'e:' + gi.email]);
      let merged = false;
      if (otherSub && otherSub !== me.sub){
        const o = await getJ('u:' + otherSub), hasPw = !!(await getJ('pw:' + otherSub));
        if (hasPw || o.username) throw err(409, 'Ese Google ya está unido a la cuenta @' + (o.username || 'otra') + '. Entra a esa cuenta, o desvincúlalo allí primero.');
        if (o.blocked) throw err(403, 'Esa cuenta de Google está suspendida. Escríbele al equipo de SynthZ.');
        /* era una cuenta creada solo con Google (duplicada): se une a esta; sus accesos pasan a esta cuenta */
        me.role = topRole(me.role, o.role);
        (Array.isArray(o.links) ? o.links : []).forEach(x => addLink(me, x.email, true, ''));
        o.mergedInto = me.sub; await setJ('u:' + otherSub, o);
        await endAllSessions(otherSub);
        merged = true;
      }
      addLink(me, gi.email, true, gi.picture);
      me.emailOk = me.emailOk || true; if (gi.uid && !me.sbUid) me.sbUid = gi.uid;
      await setJ('u:' + me.sub, me); await sbAccount(me);
      await Promise.all([claimEmail(gi.email, me.sub, true), gi.gsub ? redis('SET', 'gl:' + gi.gsub, me.sub) : null, gi.uid ? redis('SET', 'sbu:' + gi.uid, me.sub) : null]);
      return json({ ok:true, merged, links:me.links || [], role:me.role || 'user', email:me.email });
    }
    if (mode === 'unlink'){
      const me = await auth(req);
      await limit('unlink:' + me.sub, 12, 3600);
      const email = cleanEmail(b.email);
      const L = Array.isArray(me.links) ? me.links : [];
      if (!L.some(x => x.email === email)) throw err(404, 'Ese correo no está vinculado a tu cuenta.');
      const hasPw = !!(await getJ('pw:' + me.sub));
      if (!hasPw && L.length < 2) throw err(400, 'Es tu única forma de entrar: no la puedes quitar.');
      me.links = L.filter(x => x.email !== email);
      if (me.email === email) me.email = me.links[0] ? me.links[0].email : '';
      await setJ('u:' + me.sub, me);
      if ((await redis('GET', 'e:' + email)) === me.sub) await redis('DEL', 'e:' + email);
      return json({ ok:true, links:me.links });
    }
    return fail(400, 'Acción desconocida.');
  },
  async DELETE(req){
    if (new URL(req.url).searchParams.get('all') === '1'){ const me = await auth(req); await endAllSessions(me.sub); return json({ ok:true, all:true }); }
    await endSession(req); return json({ ok:true });
  }
});
