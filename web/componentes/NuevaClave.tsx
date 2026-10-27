"use client";
import { useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";

export function NuevaClave() {
  const [clave, setClave] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clave.length < 8) { setMensaje("La contraseña debe tener al menos 8 caracteres."); return; }
    setCargando(true);
    const { error } = await supabaseNavegador().auth.updateUser({ password: clave });
    setCargando(false);
    if (error) setMensaje("No pude cambiarla. Pide un enlace nuevo desde «Olvidé mi contraseña».");
    else window.location.assign("/");
  };

  return (
    <form className="tarjeta-cuenta" onSubmit={guardar} noValidate>
      <label className="campo">Contraseña nueva
        <input id="clave-nueva" type="password" autoComplete="new-password" value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Mínimo 8 caracteres" />
      </label>
      {mensaje && <div className="nota" role="alert">{mensaje}</div>}
      <button className="boton" type="submit" disabled={cargando}>{cargando ? "Un momento…" : "Guardar contraseña"}</button>
    </form>
  );
}
