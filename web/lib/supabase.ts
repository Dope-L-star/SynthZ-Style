import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const LLAVE_PUBLICA = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabaseConfigurado = () => URL_SB.length > 0 && LLAVE_PUBLICA.length > 0;
export const supabaseAdminConfigurado = () => supabaseConfigurado() && (process.env.SUPABASE_SECRET_KEY ?? "").length > 0;

/* Cliente con la sesión de la persona (lee sus cookies) */
export async function supabaseDePersona() {
  const jar = await cookies();
  return createServerClient(URL_SB, LLAVE_PUBLICA, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (lista) => {
        try { lista.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch { /* en rutas de solo lectura no se puede escribir */ }
      },
    },
  });
}

/* Cliente del servidor con llave secreta: se salta RLS. Solo para contar energía; nunca se devuelve al navegador. */
export function supabaseAdmin() {
  return createClient(URL_SB, process.env.SUPABASE_SECRET_KEY ?? "", { auth: { persistSession: false, autoRefreshToken: false } });
}
