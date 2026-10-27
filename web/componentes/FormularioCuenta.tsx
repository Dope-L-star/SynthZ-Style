"use client";
import { useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";

type Modo = "entrar" | "crear" | "olvide";

/* Traduce los errores de Supabase a algo que cualquiera entienda y sepa cómo arreglar */
function explicar(m: string): string {
  const t = m.toLowerCase();
  if (t.includes("invalid login")) return "El correo o la contraseña no coinciden. Revísalos e intenta de nuevo.";
  if (t.includes("already registered") || t.includes("already been registered")) return "Ya existe una cuenta con ese correo. Prueba entrar, o usa «Olvidé mi contraseña».";
  if (t.includes("email not confirmed")) return "Falta confirmar tu correo. Busca el mensaje de SynthZ (revisa también spam).";
  if (t.includes("password") && t.includes("characters")) return "La contraseña debe tener al menos 8 caracteres.";
  if (t.includes("rate limit") || t.includes("too many")) return "Hiciste muchos intentos seguidos. Espera unos minutos y vuelve a probar.";
  if (t.includes("fetch") || t.includes("network")) return "No pude conectarme. Revisa tu internet e intenta de nuevo.";
  return "Algo salió mal. Intenta de nuevo en un momento.";
}

export function FormularioCuenta({ aviso }: { aviso?: string }) {
  const [modo, setModo] = useState<Modo>("entrar");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(
    aviso === "enlace" ? { tipo: "error", texto: "Ese enlace ya no sirve. Pide uno nuevo desde «Olvidé mi contraseña»." } : null,
  );

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    if (modo !== "olvide" && clave.length < 8) { setMensaje({ tipo: "error", texto: "La contraseña debe tener al menos 8 caracteres." }); return; }
    setCargando(true);
    const sb = supabaseNavegador();
    const origen = window.location.origin;
    try {
      if (modo === "entrar") {
        const { error } = await sb.auth.signInWithPassword({ email: correo.trim(), password: clave });
        if (error) throw error;
        window.location.assign("/");
      } else if (modo === "crear") {
        const { data, error } = await sb.auth.signUp({
          email: correo.trim(), password: clave,
          options: { data: { name: nombre.trim().slice(0, 40) }, emailRedirectTo: `${origen}/auth/callback` },
        });
        if (error) throw error;
        if (data.session) window.location.assign("/");
        else setMensaje({ tipo: "ok", texto: "Listo. Te mandamos un correo: ábrelo y toca el enlace para activar tu cuenta." });
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(correo.trim(), { redirectTo: `${origen}/auth/callback?siguiente=restablecer` });
        if (error) throw error;
        setMensaje({ tipo: "ok", texto: "Si ese correo tiene cuenta, te mandamos un enlace para poner una contraseña nueva." });
      }
    } catch (err) {
      setMensaje({ tipo: "error", texto: explicar((err as Error).message ?? "") });
    } finally { setCargando(false); }
  };

  return (
    <form className="tarjeta-cuenta" onSubmit={enviar} noValidate>
      <div className="grupo" role="tablist" aria-label="Qué quieres hacer">
        <button type="button" role="tab" aria-selected={modo !== "crear"} aria-pressed={modo !== "crear"} onClick={() => { setModo("entrar"); setMensaje(null); }}>Entrar</button>
        <button type="button" role="tab" aria-selected={modo === "crear"} aria-pressed={modo === "crear"} onClick={() => { setModo("crear"); setMensaje(null); }}>Crear cuenta</button>
      </div>

      {modo === "crear" && (
        <label className="campo">Cómo te llamas
          <input id="nombre" autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={40} placeholder="Tu nombre" />
        </label>
      )}
      <label className="campo">Correo
        <input id="correo" type="email" autoComplete="email" inputMode="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="tu@correo.com" />
      </label>
      {modo !== "olvide" && (
        <label className="campo">Contraseña
          <input id="clave" type="password" autoComplete={modo === "crear" ? "new-password" : "current-password"} required value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Mínimo 8 caracteres" />
        </label>
      )}

      {mensaje && <div className={mensaje.tipo === "ok" ? "nota ok" : "nota"} role="alert">{mensaje.texto}</div>}

      <button className="boton" type="submit" disabled={cargando || !correo}>
        {cargando ? "Un momento…" : modo === "entrar" ? "Entrar" : modo === "crear" ? "Crear mi cuenta" : "Enviarme el enlace"}
      </button>
      {modo === "entrar" && <button type="button" className="enlace" onClick={() => { setModo("olvide"); setMensaje(null); }}>Olvidé mi contraseña</button>}
      {modo === "olvide" && <button type="button" className="enlace" onClick={() => { setModo("entrar"); setMensaje(null); }}>Volver a entrar</button>}
    </form>
  );
}
