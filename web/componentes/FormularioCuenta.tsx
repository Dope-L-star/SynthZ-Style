"use client";
import { useState } from "react";
import { crearCuenta, entrar, ErrorApi, guardarSesion, recuperar } from "@/lib/backend";

type Modo = "entrar" | "crear" | "olvide";

const INICIO = "/nuevo/";

export function FormularioCuenta() {
  const [modo, setModo] = useState<Modo>("entrar");
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [recuerda, setRecuerda] = useState<string | null>(null); /* código de recuperación recién creado */
  const [guardado, setGuardado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const cambiar = (m: Modo) => { setModo(m); setError(""); };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const u = usuario.trim().toLowerCase();
    if (modo !== "entrar" && clave.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    setCargando(true);
    try {
      if (modo === "entrar") {
        const r = await entrar(u, clave);
        guardarSesion(r.token);
        window.location.assign(INICIO);
      } else if (modo === "crear") {
        const r = await crearCuenta(u, clave, nombre.trim());
        guardarSesion(r.token);
        if (r.recovery) setRecuerda(r.recovery); else window.location.assign(INICIO);
      } else {
        const r = await recuperar(u, codigo.trim(), clave);
        guardarSesion(r.token);
        window.location.assign(INICIO);
      }
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "Algo salió mal. Intenta de nuevo.");
    } finally { setCargando(false); }
  };

  if (recuerda) {
    return (
      <div className="tarjeta-cuenta">
        <h2>Guarda tu código de recuperación</h2>
        <p className="tenue">Es la única forma de recuperar tu cuenta si olvidas la contraseña. Solo se muestra ahora.</p>
        <code className="codigo-rec">{recuerda}</code>
        <button type="button" className="boton secundario" onClick={async () => { try { await navigator.clipboard.writeText(recuerda); setCopiado(true); } catch { /* sin permiso */ } }}>
          {copiado ? "Copiado" : "Copiar código"}
        </button>
        <label className="marca-check"><input id="guardado" type="checkbox" checked={guardado} onChange={(e) => setGuardado(e.target.checked)} /> Ya lo guardé en un lugar seguro</label>
        <button type="button" className="boton" disabled={!guardado} onClick={() => window.location.assign(INICIO)}>Seguir a SynthZ</button>
      </div>
    );
  }

  return (
    <form className="tarjeta-cuenta" onSubmit={enviar} noValidate>
      <div className="grupo" role="group" aria-label="Qué quieres hacer">
        <button type="button" aria-pressed={modo !== "crear"} onClick={() => cambiar("entrar")}>Entrar</button>
        <button type="button" aria-pressed={modo === "crear"} onClick={() => cambiar("crear")}>Crear cuenta</button>
      </div>

      {modo === "crear" && (
        <label className="campo">Cómo te llamas (opcional)
          <input id="nombre" autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={40} placeholder="Tu nombre" />
        </label>
      )}
      <label className="campo">Usuario
        <input id="usuario" autoComplete="username" autoCapitalize="none" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Letras, números o guion bajo" />
      </label>
      {modo === "olvide" && (
        <label className="campo">Código de recuperación
          <input id="codigo" autoComplete="off" autoCapitalize="characters" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="El que te dimos al crear tu cuenta" />
        </label>
      )}
      <label className="campo">{modo === "olvide" ? "Contraseña nueva" : "Contraseña"}
        <input id="clave" type="password" autoComplete={modo === "entrar" ? "current-password" : "new-password"} value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Mínimo 8 caracteres" />
      </label>

      {error && <div className="nota" role="alert">{error}</div>}

      <button className="boton" type="submit" disabled={cargando || !usuario || !clave}>
        {cargando ? "Un momento…" : modo === "entrar" ? "Entrar" : modo === "crear" ? "Crear mi cuenta" : "Cambiar contraseña y entrar"}
      </button>
      {modo === "entrar" && <button type="button" className="enlace" onClick={() => cambiar("olvide")}>Olvidé mi contraseña</button>}
      {modo === "olvide" && <button type="button" className="enlace" onClick={() => cambiar("entrar")}>Volver a entrar</button>}
    </form>
  );
}
