/* Habla con el backend actual de SynthZ (api/*, mismo dominio). La sesión y el dispositivo se guardan con las mismas
   claves que la página de siempre, así quien ya entró allí sigue entrado aquí y el límite de invitado no se reinicia. */

const K_SESION = "synthz:sess";
const K_DISPOSITIVO = "synthz:dev";

const leer = (k: string): string => { try { return localStorage.getItem(k) ?? ""; } catch { return ""; } };
const guardar = (k: string, v: string) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch { /* sin almacenamiento */ } };

export const sesion = (): string => leer(K_SESION);
export const guardarSesion = (token: string) => guardar(K_SESION, token);

/* Mismo cálculo que la página de siempre para el identificador del dispositivo */
export function dispositivo(): string {
  let d = leer(K_DISPOSITIVO);
  if (!/^[\w-]{4,40}$/.test(d)) {
    d = "d" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    guardar(K_DISPOSITIVO, d);
  }
  return /^[\w-]{12,48}$/.test(d) ? d : (d.replace(/[^\w-]/g, "") + "synthzdevice").slice(0, 24);
}

const cabeceras = (): Record<string, string> => {
  const h: Record<string, string> = { "content-type": "application/json", "x-sz-device": dispositivo() };
  const s = sesion();
  if (s) h.authorization = `Bearer ${s}`;
  return h;
};

export class ErrorApi extends Error {
  constructor(mensaje: string, public estado = 0, public codigo = "", public sinRed = false) { super(mensaje); }
}

export async function api<T = Record<string, unknown>>(ruta: string, o: { metodo?: string; cuerpo?: unknown; senal?: AbortSignal } = {}): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`/api/${ruta}`, { method: o.metodo ?? "GET", headers: cabeceras(), body: o.cuerpo ? JSON.stringify(o.cuerpo) : undefined, signal: o.senal });
  } catch {
    throw new ErrorApi("No pude conectarme. Revisa tu internet e intenta de nuevo.", 0, "red", true);
  }
  let d: { error?: string; code?: string } = {};
  try { d = await r.json(); } catch { /* sin cuerpo */ }
  if (r.status === 401 && sesion()) guardarSesion("");
  if (!r.ok) throw new ErrorApi(typeof d.error === "string" ? d.error : `Algo salió mal (${r.status}).`, r.status, d.code ?? "");
  return d as T;
}

/* ---------- cuenta ---------- */
export interface Usuario { username?: string; name?: string; role?: string }
interface RespuestaSesion { token: string; user: Usuario; isNew?: boolean; recovery?: string }

export const entrar = (user: string, pass: string) => api<RespuestaSesion>("auth", { metodo: "POST", cuerpo: { mode: "login", user, pass } });
export const crearCuenta = (user: string, pass: string, name: string) => api<RespuestaSesion>("auth", { metodo: "POST", cuerpo: { mode: "signup", user, pass, name } });
export const recuperar = (user: string, code: string, pass: string) => api<RespuestaSesion>("auth", { metodo: "POST", cuerpo: { mode: "reset", user, code, pass } });
export const quien = async (): Promise<Usuario | null> => (sesion() ? (await api<{ user: Usuario }>("me").catch(() => null))?.user ?? null : null);
export async function salir() {
  try { await api("auth", { metodo: "DELETE" }); } catch { /* da igual: se borra de todos modos */ }
  guardarSesion("");
}

/* ---------- IA ---------- */
export interface EstadoIA { usado: number; limite: number; invitado: { usados: number; max: number } | null; hayIA: boolean }

export async function estadoIA(): Promise<EstadoIA> {
  const d = await api<{ used?: number; limit?: number; guest?: { used: number; max: number } | null; models?: unknown[] }>("ai");
  return { usado: +(d.used ?? 0), limite: +(d.limit ?? 25000), invitado: d.guest?.max ? { usados: +d.guest.used, max: +d.guest.max } : null, hayIA: (d.models?.length ?? 0) > 0 };
}

export type Evento =
  | { t: "meta"; ia: string; proveedor: string; respaldo: boolean }
  | { t: "texto"; d: string }
  | { t: "energia"; usado: number; limite: number; gasto: number };

/* Una línea del flujo en vivo (formato OpenAI + un aviso propio `sz` con la energía). Devuelve null si no dice nada. */
export function leerLinea(linea: string): Evento | { t: "error"; mensaje: string } | null {
  const l = linea.trim();
  if (!l.startsWith("data:")) return null;
  const dato = l.slice(5).trim();
  if (!dato || dato === "[DONE]") return null;
  let j: { sz?: { used?: number; limit?: number; spent?: number }; error?: { message?: string }; choices?: { delta?: { content?: unknown } }[] };
  try { j = JSON.parse(dato); } catch { return null; }
  if (j.sz) return { t: "energia", usado: +(j.sz.used ?? 0), limite: +(j.sz.limit ?? 0), gasto: +(j.sz.spent ?? 0) };
  if (j.error) return { t: "error", mensaje: String(j.error.message || "La IA se detuvo.") };
  const c = j.choices?.[0]?.delta?.content;
  return typeof c === "string" && c ? { t: "texto", d: c } : null;
}

/* Misma idea que la página de siempre: «una pregunta» = un turno, aunque se reintente */
export function turnoId(texto: string): string {
  let h = 5381;
  for (let i = 0; i < texto.length; i++) h = ((h << 5) + h + texto.charCodeAt(i)) | 0;
  return "t" + (h >>> 0).toString(36) + "-" + Math.floor(Date.now() / 600000).toString(36);
}

export async function* hablar(mensajes: { role: "user" | "assistant"; content: string }[], senal: AbortSignal): AsyncGenerator<Evento> {
  const ultimo = [...mensajes].reverse().find((m) => m.role === "user")?.content ?? "";
  let r: Response;
  try {
    r = await fetch("/api/ai", { method: "POST", headers: cabeceras(), body: JSON.stringify({ messages: mensajes, model: "sz:auto", turn: turnoId(ultimo) }), signal: senal });
  } catch (e) {
    if (senal.aborted) throw e;
    throw new ErrorApi("No pude conectarme. Revisa tu internet e intenta de nuevo.", 0, "red", true);
  }
  if (!r.ok || !r.body) {
    const d = await r.json().catch(() => ({} as { error?: string; code?: string }));
    throw new ErrorApi(typeof d.error === "string" ? d.error : "La IA no respondió. Intenta de nuevo en un momento.", r.status, d.code ?? "");
  }
  let nombre = "";
  try { nombre = decodeURIComponent(r.headers.get("x-sz-name") ?? ""); } catch { /* nombre raro */ }
  yield { t: "meta", ia: nombre || "SynthZ", proveedor: r.headers.get("x-sz-prov") ?? "", respaldo: r.headers.get("x-sz-fallback") === "1" };

  const lector = r.body.getReader();
  const deco = new TextDecoder();
  let resto = "";
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    resto += deco.decode(value, { stream: true });
    const lineas = resto.split("\n");
    resto = lineas.pop() ?? "";
    for (const l of lineas) {
      const e = leerLinea(l);
      if (e?.t === "error") throw new ErrorApi(e.mensaje, 502, "corte");
      if (e) yield e;
    }
  }
  const e = leerLinea(resto);
  if (e && e.t !== "error") yield e;
}
