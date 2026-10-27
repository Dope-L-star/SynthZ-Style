import { NextResponse } from "next/server";
import { supabaseDePersona } from "@/lib/supabase";

/* Aquí llegan las personas desde el enlace del correo (confirmar cuenta o restablecer contraseña). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const destino = url.searchParams.get("siguiente") === "restablecer" ? "/restablecer" : "/";
  if (code) {
    const sb = await supabaseDePersona();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destino, url.origin));
  }
  return NextResponse.redirect(new URL("/entrar?aviso=enlace", url.origin));
}
