/* Chats guardados. En este navegador siempre; en la nube de tu cuenta (mismo formato que la página de siempre) si has entrado. */
import { api, sesion } from "./backend";

export interface Mensaje { rol: "user" | "assistant"; contenido: string; ia?: string }
export interface Chat { id: string; titulo: string; mensajes: Mensaje[]; t: number }

const LOCAL = "sz-nuevo:chats";
const PREFIJO = "openrouter::sz:auto::";
export const claveNube = (id: string) => PREFIJO + id;
export const idDeClave = (k: string) => (k.startsWith(PREFIJO) ? k.slice(PREFIJO.length) : "");

export const nuevoId = () => "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

export function titulo(mensajes: Mensaje[]): string {
  const p = mensajes.find((m) => m.rol === "user")?.contenido.replace(/\s+/g, " ").trim() ?? "";
  return p.length > 42 ? p.slice(0, 41) + "…" : p || "Chat nuevo";
}

export function leerLocales(): Chat[] {
  try {
    const m = JSON.parse(localStorage.getItem(LOCAL) ?? "{}") as Record<string, Chat>;
    return Object.values(m).filter((c) => c && Array.isArray(c.mensajes)).sort((a, b) => b.t - a.t);
  } catch { return []; }
}

function escribirLocales(chats: Chat[]) {
  try { localStorage.setItem(LOCAL, JSON.stringify(Object.fromEntries(chats.slice(0, 60).map((c) => [c.id, c])))); } catch { /* sin espacio */ }
}

export function guardarLocal(chat: Chat): Chat[] {
  const otros = leerLocales().filter((c) => c.id !== chat.id);
  const todos = [chat, ...otros].sort((a, b) => b.t - a.t);
  escribirLocales(todos);
  return todos;
}

export function borrarLocal(id: string): Chat[] {
  const r = leerLocales().filter((c) => c.id !== id);
  escribirLocales(r);
  return r;
}

const aNube = (c: Chat) => c.mensajes.map((m) => ({ role: m.rol, content: m.contenido, model: m.ia }));
const deNube = (id: string, data: unknown): Chat | null => {
  if (!Array.isArray(data)) return null;
  const mensajes: Mensaje[] = data
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ rol: m.role, contenido: m.content, ia: typeof m.model === "string" ? m.model : undefined }));
  return mensajes.length ? { id, titulo: titulo(mensajes), mensajes, t: 0 } : null;
};

/* Sube un chat a la cuenta. Si falla no pasa nada: sigue guardado en este navegador. */
export async function subirNube(chat: Chat) {
  if (!sesion()) return;
  try { await api("chats", { metodo: "POST", cuerpo: { items: [{ k: claveNube(chat.id), data: aNube(chat) }] } }); } catch { /* se reintenta en el siguiente envío */ }
}

export async function borrarNube(id: string) {
  if (!sesion()) return;
  try { await api("chats", { metodo: "POST", cuerpo: { del: [claveNube(id)] } }); } catch { /* idem */ }
}

/* Trae de la cuenta los chats que este navegador no tiene */
export async function traerNube(): Promise<Chat[]> {
  if (!sesion()) return leerLocales();
  try {
    const me = await api<{ chatKeys?: string[] }>("me");
    const locales = leerLocales();
    const faltan = (me.chatKeys ?? []).filter((k) => idDeClave(k) && !locales.some((c) => c.id === idDeClave(k))).slice(0, 40);
    if (faltan.length) {
      const q = faltan.map((k) => "k=" + encodeURIComponent(k)).join("&");
      const r = await api<{ chats?: Record<string, unknown> }>("chats?" + q);
      let t = Date.now() - faltan.length;
      for (const k of faltan) {
        const c = deNube(idDeClave(k), r.chats?.[k]);
        if (c) guardarLocal({ ...c, t: t++ });
      }
    }
  } catch { /* sin red: se ven los de este navegador */ }
  return leerLocales();
}
