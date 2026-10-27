import { cookies, headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { huella, type Identidad } from "./energia";
import { supabaseConfigurado, supabaseDePersona } from "./supabase";

export const COOKIE_DISPOSITIVO = "sz-d";

/* Quién escribe: una persona con cuenta o un invitado (dispositivo + conexión). */
export async function identificar(): Promise<{ id: Identidad; dispositivoNuevo: string | null }> {
  if (supabaseConfigurado()) {
    const sb = await supabaseDePersona();
    const { data } = await sb.auth.getUser();
    if (data.user) return { id: { tipo: "persona", id: data.user.id }, dispositivoNuevo: null };
  }
  const jar = await cookies();
  const h = await headers();
  let disp = jar.get(COOKIE_DISPOSITIVO)?.value ?? "";
  let nuevo: string | null = null;
  if (!/^[\w-]{12,48}$/.test(disp)) { disp = randomUUID(); nuevo = disp; }
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "sin-ip";
  return { id: { tipo: "invitado", claves: [huella("d", disp), huella("i", ip)] }, dispositivoNuevo: nuevo };
}
