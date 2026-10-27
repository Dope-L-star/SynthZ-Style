import { NextResponse } from "next/server";
import { leerEstado } from "@/lib/energia";
import { identificar } from "@/lib/identidad";
import { supabaseConfigurado, supabaseDePersona } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const { id } = await identificar();
  const e = await leerEstado(id);
  let correo = "";
  if (id.tipo === "persona" && supabaseConfigurado()) correo = (await (await supabaseDePersona()).auth.getUser()).data.user?.email ?? "";
  return NextResponse.json({ porcentajeRestante: e.porcentajeRestante, invitado: e.invitado, conCuenta: id.tipo === "persona", correo });
}
