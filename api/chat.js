/* POST /api/chat { teamId, model, messages, max_tokens, stream }
   Habla con OpenRouter usando la llave del equipo. La llave se descifra solo aquí, en el servidor:
   el miembro recibe la respuesta, nunca la llave. Respeta "solo modelos gratis" y el límite diario. */
import { route, body, fail, auth, getJ, setJ, redis, dec, enc, needsReenc, withLock, today, limit } from './_lib.js';

export default route({
  async POST(req){
    const me = await auth(req);
    await limit('chat:' + me.sub, 20, 60);
    const b = await body(req, 1_200_000);
    const t = typeof b.teamId === 'string' ? await getJ('t:' + b.teamId) : null;
    if (!t) return fail(404, 'Ese equipo ya no existe.');
    if (t.owner !== me.sub && !(t.members || []).some(m => m.sub === me.sub)) return fail(403, 'Ya no eres parte de ese equipo.');
    if (!t.keyEnc) return fail(409, 'El dueño del equipo todavía no compartió su OpenRouter.');
    const model = String(b.model || '');
    if (!/^[\w.\-\/:@]{2,120}$/.test(model)) return fail(400, 'Modelo inválido.');
    if (t.freeOnly !== false && !/:free$/.test(model)) return fail(403, 'Tu equipo solo permite modelos gratis (los que terminan en :free).');
    if (!Array.isArray(b.messages) || !b.messages.length || b.messages.length > 60) return fail(400, 'Mensajes inválidos.');
    const ukey = 'tu:' + t.id + ':' + me.sub + ':' + today();
    if (+t.daily > 0 && +(await redis('GET', ukey) || 0) >= +t.daily) return fail(429, 'Llegaste al límite diario de SynXCoin\'s que te dio tu equipo. Se reinicia mañana.', { switchTo:'pu' });
    let key; try{ key = dec(t.keyEnc); }catch(e){ return fail(500, 'No pude abrir la llave del equipo. Pídele al dueño que la vuelva a guardar.'); }
    if (needsReenc(t.keyEnc)) withLock('t:' + t.id, async () => { const x = await getJ('t:' + t.id); if (x && x.keyEnc === t.keyEnc){ x.keyEnc = enc(key); await setJ('t:' + t.id, x); } }).catch(() => {});   /* rotación perezosa */
    const stream = b.stream !== false;
    const payload = { model, messages:b.messages, stream, usage:{ include:true } };
    if (+b.max_tokens > 0) payload.max_tokens = Math.min(32000, Math.round(+b.max_tokens));
    const up = await fetch((process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1') + '/chat/completions', {
      method:'POST', signal:req.signal,
      headers:{ Authorization:'Bearer ' + key, 'content-type':'application/json', 'HTTP-Referer':new URL(req.url).origin, 'X-Title':'SynthZ' },
      body:JSON.stringify(payload)
    });
    const count = async n => { if (n > 0) await redis('INCRBY', ukey, String(Math.round(n))).then(() => redis('EXPIRE', ukey, '259200')).catch(() => {}); };
    if (!up.ok || !stream || !up.body){
      const txt = await up.text(); let d = {}; try{ d = JSON.parse(txt); }catch(e){}
      if (up.ok && d.usage) await count((d.usage.prompt_tokens || 0) + (d.usage.completion_tokens || 0));
      return new Response(txt, { status:up.status, headers:{ 'content-type':'application/json', 'cache-control':'no-store' } });
    }
    /* reenvía el stream tal cual y, de paso, lee el uso real del último evento */
    const decd = new TextDecoder(); let buf = '', used = 0, chars = 0;
    const tap = new TransformStream({
      transform(chunk, ctl){
        ctl.enqueue(chunk);
        buf += decd.decode(chunk, { stream:true });
        let i; while ((i = buf.indexOf('\n')) >= 0){
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
          if (!line.startsWith('data:')) continue;
          try{ const j = JSON.parse(line.slice(5)); if (j.usage) used = (j.usage.prompt_tokens || 0) + (j.usage.completion_tokens || 0); const c = j.choices && j.choices[0] && j.choices[0].delta; if (c && typeof c.content === 'string') chars += c.content.length; }catch(e){}
        }
      },
      async flush(){ await count(used || Math.ceil(chars / 4) + 200); }
    });
    return new Response(up.body.pipeThrough(tap), { status:200, headers:{ 'content-type':'text/event-stream; charset=utf-8', 'cache-control':'no-store', 'x-accel-buffering':'no' } });
  }
});
