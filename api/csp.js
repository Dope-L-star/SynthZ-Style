/* POST /api/csp — recibe los avisos de la política de seguridad (CSP) en modo «solo avisar».
   Guarda solo lo necesario (qué regla, qué dominio, qué página) en una lista corta para el panel de admin.
   Cuando la lista se mantenga vacía unos días, se puede activar la CSP de verdad sin romper nada. */
import { route, body, json, pipe, limit, str, ipOf } from './_lib.js';

const host = u => { try{ return u && /^https?:|^wss?:/.test(u) ? new URL(u).origin : str(u, 40); }catch(e){ return 'desconocido'; } };
const path = u => { try{ return new URL(u).pathname.slice(0, 60); }catch(e){ return ''; } };

export default route({
  async POST(req){
    await limit('csp:' + ipOf(req), 30, 600);
    const b = await body(req, 20_000);
    const list = Array.isArray(b) ? b.map(x => x && x.body).filter(Boolean) : b && b['csp-report'] ? [b['csp-report']] : [];
    const rows = list.slice(0, 5).map(r => JSON.stringify({
      d:str(r.effectiveDirective || r['effective-directive'] || r['violated-directive'] || '', 40),
      b:host(r.blockedURL || r['blocked-uri']),
      p:path(r.documentURL || r['document-uri']),
      t:Date.now()
    }));
    if (rows.length) await pipe([['LPUSH', 'csp', ...rows], ['LTRIM', 'csp', '0', '99']]);
    return json({ ok:true });
  }
});
