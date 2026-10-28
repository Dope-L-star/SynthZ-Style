/* Prueba de las fotos en las IAs de SymphorIA (v3.4), sin internet: Redis y los proveedores son de mentira.
   · Una IA que ve fotos recibe la imagen tal cual.
   · «Automática» con una foto elige una IA que ve.
   · Una IA que NO ve fotos recibe la descripción que hizo otra que sí ve («vista prestada»), nunca la imagen.
   · Sin fotos, todo sigue igual que antes.
   Se corre desde la raíz del repo:  node t/ia/fotos.mjs */
process.env.KV_REST_API_URL = 'https://redis.test'; process.env.KV_REST_API_TOKEN = 't';
process.env.MISTRAL_API_KEY = 'mk-prueba'; process.env.GROQ_API_KEY = 'gsk_prueba';
let fails = 0;
const check = (n, c, why) => { if (c) console.log('OK    ' + n); else { fails++; console.log('FALLO ' + n + ' — ' + (why || '')); } };
const db = new Map(), calls = [];
function cmd([c, k, ...a]){
  c = String(c).toUpperCase();
  if (c === 'GET') return db.has(k) ? db.get(k) : null;
  if (c === 'SET'){ db.set(k, a[0]); return 'OK'; }
  if (c === 'DEL'){ db.delete(k); return 1; }
  if (c === 'INCR' || c === 'INCRBY'){ const v = (+db.get(k) || 0) + (c === 'INCR' ? 1 : +a[0]); db.set(k, String(v)); return v; }
  if (c === 'HGETALL' || c === 'SMEMBERS') return [];
  if (c === 'EXISTS' || c === 'SCARD' || c === 'SISMEMBER') return 0;
  return 1;
}
const IMG = 'data:image/jpeg;base64,' + 'A'.repeat(4000);
globalThis.fetch = async (url, o = {}) => {
  url = String(url);
  if (url.startsWith('https://redis.test')){
    const b = JSON.parse(o.body); return new Response(JSON.stringify(url.endsWith('/pipeline') ? b.map(x => ({ result:cmd(x) })) : { result:cmd(b) }));
  }
  if (/\/models$/.test(url)){
    if (/mistral/.test(url)) return Response.json({ data:[{ id:'mistral-small-latest', capabilities:{ completion_chat:true, vision:true } }, { id:'codestral-latest', capabilities:{ completion_chat:true, vision:false } }] });
    return Response.json({ data:[{ id:'openai/gpt-oss-120b', active:true }] });
  }
  if (/chat\/completions$/.test(url)){
    const b = JSON.parse(o.body), last = b.messages[b.messages.length - 1];
    const imgs = Array.isArray(last.content) ? last.content.filter(x => x.type === 'image_url').length : 0;
    calls.push({ host:new URL(url).host, model:b.model, stream:b.stream, imgs, text:Array.isArray(last.content) ? last.content.map(x => x.text || '').join(' ') : last.content });
    const txt = imgs ? 'Una captura con el texto «HOLA 42» en un rectángulo amarillo sobre fondo azul.' : 'Respuesta de ' + b.model;
    if (!b.stream) return Response.json({ choices:[{ message:{ content:txt } }], usage:{ prompt_tokens:10, completion_tokens:10 } });
    return new Response('data: ' + JSON.stringify({ choices:[{ delta:{ content:txt } }] }) + '\n\ndata: [DONE]\n\n', { headers:{ 'content-type':'text/event-stream' } });
  }
  throw new Error('fetch inesperado ' + url);
};
const P = await import('../../api/_pool.js');
const read = async r => r.stream ? await new Response(r.stream).text() : r.text;
const ask = (model, content) => P.chat({ who:'u:prueba', ipKey:'ip:prueba', messages:[{ role:'user', content }], model, stream:true, free:true });
const photo = t => [{ type:'text', text:t }, { type:'image_url', image_url:{ url:IMG } }];

calls.length = 0; let r = await ask('sz:mistral:mistral-small-latest', photo('¿Qué dice?')); await read(r);
check('una IA que ve fotos recibe la imagen', calls.length === 1 && calls[0].model === 'mistral-small-latest' && calls[0].imgs === 1, JSON.stringify(calls));

calls.length = 0; r = await ask('sz:auto', photo('¿Qué dice?')); await read(r);
check('«Automática» con foto va a una IA que ve', calls.length === 1 && calls[0].model === 'mistral-small-latest' && calls[0].imgs === 1, JSON.stringify(calls));

calls.length = 0; r = await ask('sz:groq:openai/gpt-oss-120b', photo('¿Qué dice esta imagen?')); const out = await read(r);
check('vista prestada: primero mira una IA que ve (sin streaming)', calls.length === 2 && calls[0].model === 'mistral-small-latest' && calls[0].imgs === 1 && calls[0].stream === false, JSON.stringify(calls));
check('y la IA elegida recibe la descripción en palabras, sin la imagen', calls[1] && calls[1].model === 'openai/gpt-oss-120b' && calls[1].imgs === 0 && /HOLA 42/.test(calls[1].text) && /¿Qué dice esta imagen\?/.test(calls[1].text), JSON.stringify(calls[1]));
check('responde la IA que elegiste', /openai\/gpt-oss-120b/.test(out) && r.meta.model === 'sz:groq:openai/gpt-oss-120b', out.slice(0, 200));

calls.length = 0; r = await ask('sz:auto', 'Hola, ¿cómo estás?'); await read(r);
check('sin fotos todo sigue igual (Automática usa Groq primero)', calls.length === 1 && calls[0].host === 'api.groq.com' && typeof calls[0].text === 'string', JSON.stringify(calls));

const cat = await P.models(true);
check('el catálogo marca qué IAs ven fotos', cat.list.find(m => m.mid === 'mistral-small-latest').vis === true && cat.list.find(m => m.mid === 'codestral-latest').vis === false && cat.list.find(m => m.mid === 'openai/gpt-oss-120b').vis === false, JSON.stringify(cat.list));
const cm = P.cleanMsgs([{ role:'user', content:photo('vieja') }, { role:'assistant', content:'ok' }, { role:'user', content:[{ type:'text', text:'mala' }, { type:'image_url', image_url:{ url:'https://x.test/a.png' } }] }]);
check('solo viajan fotos del último mensaje y solo como data:image', cm[0].content === 'vieja\n[imagen]' && cm[2].content === 'mala\n[imagen]', JSON.stringify(cm));
process.exit(fails ? 1 : 0);
