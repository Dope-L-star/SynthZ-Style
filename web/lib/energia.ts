import { createHash } from "node:crypto";
import { supabaseAdmin, supabaseAdminConfigurado } from "./supabase";

/* 100 % de Energía = 25.000 tokens al día (≈ 30 respuestas normales). Se llena a medianoche, hora de Colombia. */
export const DIA_TOKENS = 25_000;
export const INVITADO_MENSAJES = 5;

export type Identidad =
  | { tipo: "persona"; id: string }
  | { tipo: "invitado"; claves: string[] };

export interface Estado {
  usadoTokens: number;
  limiteTokens: number;
  porcentajeRestante: number;
  invitado: { usados: number; max: number } | null;
}

export const huella = (prefijo: string, valor: string) => `${prefijo}:${createHash("sha256").update(valor).digest("hex").slice(0, 32)}`;
const dia = () => new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 10); /* Colombia = UTC-5 */

/* Sin llave secreta (desarrollo local) se cuenta en memoria. En producción siempre debe estar configurada. */
const g = globalThis as unknown as { __szMemoria?: Map<string, { tokens: number; mensajes: number }> };
const memoria = (g.__szMemoria ??= new Map());
const clave = (k: string) => `${dia()}|${k}`;

function restante(usado: number): number {
  return Math.max(0, Math.round((1 - usado / DIA_TOKENS) * 100));
}

export async function leerEstado(id: Identidad): Promise<Estado> {
  if (id.tipo === "persona") {
    let usado = 0;
    if (supabaseAdminConfigurado()) {
      const { data } = await supabaseAdmin().from("energia_diaria").select("usada_tokens").eq("persona", id.id).eq("dia", dia()).maybeSingle();
      usado = data?.usada_tokens ?? 0;
    } else usado = memoria.get(clave(id.id))?.tokens ?? 0;
    return { usadoTokens: usado, limiteTokens: DIA_TOKENS, porcentajeRestante: restante(usado), invitado: null };
  }
  let tokens = 0, mensajes = 0;
  if (supabaseAdminConfigurado()) {
    const { data } = await supabaseAdmin().from("uso_invitados").select("usada_tokens, mensajes").in("huella", id.claves).eq("dia", dia());
    for (const f of data ?? []) { tokens = Math.max(tokens, f.usada_tokens); mensajes = Math.max(mensajes, f.mensajes); }
  } else for (const k of id.claves) { const m = memoria.get(clave(k)); if (m) { tokens = Math.max(tokens, m.tokens); mensajes = Math.max(mensajes, m.mensajes); } }
  return { usadoTokens: tokens, limiteTokens: DIA_TOKENS, porcentajeRestante: restante(tokens), invitado: { usados: mensajes, max: INVITADO_MENSAJES } };
}

export type Veredicto = { ok: true } | { ok: false; codigo: "sin_energia" | "invitado_limite"; mensaje: string };

export function puedeEscribir(e: Estado): Veredicto {
  if (e.invitado && e.invitado.usados >= e.invitado.max)
    return { ok: false, codigo: "invitado_limite", mensaje: "Para seguir, entra o crea tu cuenta. Es gratis y tienes mucha más energía cada día." };
  if (e.usadoTokens >= e.limiteTokens)
    return { ok: false, codigo: "sin_energia", mensaje: "Se acabó tu energía de hoy. Se llena otra vez a medianoche." };
  return { ok: true };
}

/* Suma lo gastado. `mensaje` cuenta una pregunta nueva de invitado (solo al empezar la respuesta). */
export async function gastar(id: Identidad, tokens: number, mensaje: boolean): Promise<void> {
  const t = Math.max(0, Math.round(tokens));
  if (id.tipo === "persona") {
    if (supabaseAdminConfigurado()) await supabaseAdmin().rpc("gastar_energia", { p_persona: id.id, p_tokens: t });
    else { const m = memoria.get(clave(id.id)) ?? { tokens: 0, mensajes: 0 }; m.tokens += t; memoria.set(clave(id.id), m); }
    return;
  }
  for (const k of id.claves) {
    if (supabaseAdminConfigurado()) await supabaseAdmin().rpc("gastar_invitado", { p_huella: k, p_tokens: t, p_mensaje: mensaje });
    else { const m = memoria.get(clave(k)) ?? { tokens: 0, mensajes: 0 }; m.tokens += t; if (mensaje) m.mensajes += 1; memoria.set(clave(k), m); }
  }
}
