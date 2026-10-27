import { NextResponse } from "next/server";
import { gastar, leerEstado, puedeEscribir, type Identidad } from "@/lib/energia";
import { detectarTarea, ordenar } from "@/lib/enrutador";
import { COOKIE_DISPOSITIVO, identificar } from "@/lib/identidad";
import { instruccionesPara } from "@/lib/instrucciones";
import { PROVEEDORES, baseDe, llaveDe, type Modelo } from "@/lib/proveedores";

export const runtime = "nodejs";
export const maxDuration = 60;

type Mensaje = { rol: "user" | "assistant"; contenido: string };
type Evento =
  | { t: "meta"; ia: string; proveedor: string; respaldo: boolean; tarea: string }
  | { t: "texto"; d: string }
  | { t: "fin"; gastoTokens: number; porcentajeRestante: number; ms: number }
  | { t: "error"; codigo: string; mensaje: string };

const MAX_MENSAJES = 40;
const MAX_CARACTERES = 60_000;
const MAX_SALIDA = 2048;
const ESPERA_INICIO_MS = 15_000;

const error = (status: number, codigo: string, mensaje: string) => NextResponse.json({ t: "error", codigo, mensaje }, { status });
const estimar = (texto: string) => Math.ceil(texto.length / 4);

function leerMensajes(cuerpo: unknown): Mensaje[] | null {
  const lista = (cuerpo as { mensajes?: unknown })?.mensajes;
  if (!Array.isArray(lista) || lista.length === 0 || lista.length > MAX_MENSAJES) return null;
  const out: Mensaje[] = [];
  let total = 0;
  for (const m of lista) {
    const rol = (m as Mensaje)?.rol, contenido = (m as Mensaje)?.contenido;
    if ((rol !== "user" && rol !== "assistant") || typeof contenido !== "string" || !contenido.trim()) return null;
    total += contenido.length;
    out.push({ rol, contenido });
  }
  return total > MAX_CARACTERES || out[out.length - 1].rol !== "user" ? null : out;
}

/* Pide la respuesta a un modelo y entrega los trozos de texto según llegan. Lanza error si ni siquiera arranca. */
async function* hablar(m: Modelo, mensajes: Mensaje[], sistema: string, senal: AbortSignal): AsyncGenerator<{ texto?: string; tokens?: number }> {
  const arranque = AbortSignal.timeout(ESPERA_INICIO_MS);
  const r = await fetch(`${baseDe(m.prov)}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${llaveDe(m.prov)}` },
    body: JSON.stringify({
      model: m.id,
      stream: true,
      stream_options: { include_usage: true },
      max_tokens: MAX_SALIDA,
      temperature: 0.6,
      messages: [{ role: "system", content: sistema }, ...mensajes.map((x) => ({ role: x.rol, content: x.contenido }))],
    }),
    signal: AbortSignal.any([senal, arranque]),
  });
  if (!r.ok || !r.body) throw Object.assign(new Error(`${m.prov} respondió ${r.status}`), { estado: r.status });

  const lector = r.body.getReader();
  const deco = new TextDecoder();
  let resto = "";
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    resto += deco.decode(value, { stream: true });
    const lineas = resto.split("\n");
    resto = lineas.pop() ?? "";
    for (const linea of lineas) {
      if (!linea.startsWith("data:")) continue;
      const dato = linea.slice(5).trim();
      if (!dato || dato === "[DONE]") continue;
      try {
        const j = JSON.parse(dato);
        const texto = j.choices?.[0]?.delta?.content;
        if (typeof texto === "string" && texto) yield { texto };
        const u = j.usage ?? j.x_groq?.usage;
        if (u) yield { tokens: (u.prompt_tokens ?? 0) + (u.completion_tokens ?? 0) };
      } catch { /* línea a medias o de otro tipo: se ignora */ }
    }
  }
}

export async function POST(req: Request) {
  let cuerpo: unknown;
  try { cuerpo = await req.json(); } catch { return error(400, "cuerpo_invalido", "No entendí lo que mandaste."); }
  const mensajes = leerMensajes(cuerpo);
  if (!mensajes) return error(400, "mensajes_invalidos", "Los mensajes no son válidos o son demasiado largos.");

  const { id, dispositivoNuevo } = await identificar();
  const estado = await leerEstado(id);
  const veredicto = puedeEscribir(estado);
  if (!veredicto.ok) return error(429, veredicto.codigo, veredicto.mensaje);

  const tarea = detectarTarea(mensajes[mensajes.length - 1].contenido);
  const candidatos = ordenar(tarea);
  if (candidatos.length === 0) return error(503, "sin_ia", "Ahora mismo no hay ninguna IA disponible. Intenta de nuevo en un rato.");

  await gastar(id, 0, true); /* cuenta la pregunta aunque la persona corte la respuesta */
  const sistema = instruccionesPara(tarea);
  const entrada = estimar(sistema) + mensajes.reduce((n, m) => n + estimar(m.contenido), 0);
  const enc = new TextEncoder();
  const inicio = Date.now();

  const flujo = new ReadableStream<Uint8Array>({
    async start(ctl) {
      const enviar = (e: Evento) => ctl.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      let salida = "";
      let tokensReales = 0;
      let respondio = false;
      try {
        for (let i = 0; i < candidatos.length && !respondio; i++) {
          const m = candidatos[i];
          try {
            for await (const parte of hablar(m, mensajes, sistema, req.signal)) {
              if (parte.tokens) tokensReales = parte.tokens;
              if (parte.texto) {
                if (!respondio) {
                  respondio = true;
                  enviar({ t: "meta", ia: m.nombre, proveedor: PROVEEDORES[m.prov].nombre, respaldo: i > 0, tarea });
                }
                salida += parte.texto;
                enviar({ t: "texto", d: parte.texto });
              }
            }
            if (!respondio) throw new Error("respuesta vacía");
          } catch (e) {
            if (req.signal.aborted) return;
            console.error("[synthz] ia falló", m.prov, m.id, (e as Error).message); /* sin llaves ni mensajes */
            if (respondio) { enviar({ t: "error", codigo: "cortada", mensaje: "La respuesta se cortó a la mitad. Puedes pedirle que continúe." }); return; }
          }
        }
        if (!respondio) { enviar({ t: "error", codigo: "sin_ia", mensaje: "Ninguna IA pudo responder ahora. Intenta de nuevo en un momento." }); return; }
        const gasto = tokensReales || entrada + estimar(salida);
        await gastar(id, gasto, false);
        const despues = await leerEstado(id);
        enviar({ t: "fin", gastoTokens: gasto, porcentajeRestante: despues.porcentajeRestante, ms: Date.now() - inicio });
      } finally {
        if (req.signal.aborted && salida) await gastar(id as Identidad, entrada + estimar(salida), false).catch(() => {});
        try { ctl.close(); } catch { /* ya cerrado */ }
      }
    },
  });

  const res = new Response(flujo, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
  if (dispositivoNuevo) res.headers.append("set-cookie", `${COOKIE_DISPOSITIVO}=${dispositivoNuevo}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return res;
}
