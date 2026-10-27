"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Ajustes } from "./Ajustes";
import { AnilloEnergia } from "./AnilloEnergia";
import { Texto } from "./Texto";
import { supabaseNavegador } from "@/lib/supabase-navegador";

type Meta = { ia: string; proveedor: string; respaldo: boolean; tarea: string };
type Fin = { gastoTokens: number; ms: number };
type Msg =
  | { rol: "user"; contenido: string }
  | { rol: "assistant"; contenido: string; meta?: Meta; fin?: Fin; error?: { codigo: string; mensaje: string }; cortada?: boolean };
type Energia = { porcentajeRestante: number; invitado: { usados: number; max: number } | null; conCuenta: boolean; correo?: string };

const IDEAS = [
  { titulo: "Escribir", ayuda: "Correos, ensayos, mensajes", texto: "Ayúdame a escribir un correo amable para pedirle una prórroga a mi profesor." },
  { titulo: "Estudiar", ayuda: "Te lo explica paso a paso", texto: "Explícame qué es la fotosíntesis como si tuviera 8 años." },
  { titulo: "Código", ayuda: "Escribe o arregla código", texto: "Escribe una función en JavaScript que diga si una palabra es un palíndromo, con ejemplos." },
  { titulo: "Ideas", ayuda: "Lluvia de ideas sin pena", texto: "Dame 10 ideas de nombres para una cafetería con un gato." },
];

const NOMBRE_TAREA: Record<string, string> = { codigo: "Código", texto: "Escritura", rapido: "Respuesta rápida", general: "General" };

export function Aplicacion() {
  const [mensajes, setMensajes] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const [energia, setEnergia] = useState<Energia | null>(null);
  const control = useRef<AbortController | null>(null);
  const fondo = useRef<HTMLDivElement>(null);

  useEffect(() => { fetch("/api/energia").then((r) => r.json()).then(setEnergia).catch(() => {}); }, []);
  useEffect(() => { fondo.current?.scrollIntoView({ block: "end" }); }, [mensajes]);

  const actualizarUltima = (f: (m: Extract<Msg, { rol: "assistant" }>) => Extract<Msg, { rol: "assistant" }>) =>
    setMensajes((prev) => { const c = [...prev]; const u = c[c.length - 1]; if (u?.rol === "assistant") c[c.length - 1] = f(u); return c; });

  const enviar = useCallback(async (pregunta: string) => {
    const limpio = pregunta.trim();
    if (!limpio || escribiendo) return;
    const historial = [...mensajes.filter((m) => !(m.rol === "assistant" && m.error)), { rol: "user", contenido: limpio } as Msg];
    setMensajes([...historial, { rol: "assistant", contenido: "" }]);
    setTexto("");
    setEscribiendo(true);
    const ctl = new AbortController();
    control.current = ctl;
    const procesar = (l: string) => {
      if (!l.trim()) return;
      let e;
      try { e = JSON.parse(l); } catch { return; }
      if (e.t === "meta") actualizarUltima((m) => ({ ...m, meta: e }));
      else if (e.t === "texto") actualizarUltima((m) => ({ ...m, contenido: m.contenido + e.d }));
      else if (e.t === "fin") actualizarUltima((m) => ({ ...m, fin: e }));
      else if (e.t === "error") actualizarUltima((m) => (m.contenido ? { ...m, cortada: true, error: e } : { ...m, error: e }));
    };
    try {
      const r = await fetch("/api/chat", {
        method: "POST", headers: { "content-type": "application/json" }, signal: ctl.signal,
        body: JSON.stringify({ mensajes: historial.slice(-20).map((m) => ({ rol: m.rol, contenido: m.contenido })) }),
      });
      if (!r.body) throw new Error("sin cuerpo");
      const lector = r.body.getReader(); const deco = new TextDecoder(); let resto = "";
      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;
        resto += deco.decode(value, { stream: true });
        const lineas = resto.split("\n"); resto = lineas.pop() ?? "";
        lineas.forEach(procesar);
      }
      procesar(resto); /* los errores del servidor llegan como una sola línea sin salto final */
    } catch (e) {
      if ((e as Error).name !== "AbortError") actualizarUltima((m) => ({ ...m, error: { codigo: "red", mensaje: "No pude conectarme. Revisa tu internet e intenta de nuevo." } }));
    } finally { setEscribiendo(false); control.current = null; fetch("/api/energia").then((r) => r.json()).then(setEnergia).catch(() => {}); }
  }, [mensajes, escribiendo]);

  const nuevo = () => { control.current?.abort(); setMensajes([]); setTexto(""); };
  const ultima = [...mensajes].reverse().find((m): m is Extract<Msg, { rol: "assistant" }> => m.rol === "assistant" && !!m.meta);
  const pct = energia?.porcentajeRestante ?? 100;

  return (
    <div className="app">
      <aside className="riel" aria-label="Chats">
        <span className="marca">Synth<span>Z</span></span>
        <button className="boton" onClick={nuevo}>+ Nuevo chat</button>
        <span className="etiqueta">Tus chats</span>
        <p className="vacio">{energia?.conCuenta ? "Tus chats guardados llegan en la siguiente fase." : "Aquí aparecerán tus chats cuando entres a tu cuenta."}</p>
        {energia?.conCuenta ? (
          <div className="persona">
            <span className="tenue pequeno" title={energia.correo}>{energia.correo}</span>
            <button className="boton secundario" onClick={async () => { await supabaseNavegador().auth.signOut(); window.location.reload(); }}>Salir</button>
          </div>
        ) : <a className="boton secundario" href="/entrar">Entrar o crear cuenta</a>}
      </aside>

      <main className="centro">
        <div className="barra">
          <button className="chip" aria-pressed="true">Automática</button>
          <button className="chip" disabled title="Llega en la siguiente fase">Comparar · pronto</button>
          <button className="chip" disabled title="Llega en la siguiente fase">Síntesis · pronto</button>
          <details className="mini-ajustes"><summary className="chip">Apariencia</summary><div className="flotante"><Ajustes /></div></details>
        </div>

        <div className="hilo" aria-live="polite">
          {mensajes.length === 0 ? (
            <div className="inicio">
              <h1>Hola. ¿Qué hacemos hoy?</h1>
              <p className="tenue">Escribe lo que quieras. SynthZ elige la IA que mejor le va a tu pregunta.</p>
              <div className="ideas">
                {IDEAS.map((i) => (
                  <button key={i.titulo} className="idea" onClick={() => enviar(i.texto)}><b>{i.titulo}</b><span>{i.ayuda}</span></button>
                ))}
              </div>
            </div>
          ) : (
            mensajes.map((m, i) =>
              m.rol === "user" ? <div key={i} className="tu">{m.contenido}</div> : (
                <div key={i} className="ia">
                  {m.contenido ? <Texto valor={m.contenido} /> : !m.error && <span className="pensando" aria-label="Pensando"><i /><i /><i /></span>}
                  {m.error && (
                    <div className="nota" role="alert">
                      {m.error.mensaje}
                      {m.error.codigo === "invitado_limite" && <> <a href="/entrar">Entrar o crear cuenta</a></>}
                    </div>
                  )}
                </div>
              ))
          )}
          <div ref={fondo} />
        </div>

        <form className="caja" onSubmit={(e) => { e.preventDefault(); enviar(texto); }}>
          <textarea
            aria-label="Escribe tu pregunta" placeholder="Pregunta lo que quieras…" rows={1} value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); enviar(texto); } }}
          />
          <div className="fila">
            <span className="tenue pequeno">Enter envía · Shift + Enter hace un salto de línea</span>
            {escribiendo
              ? <button type="button" className="boton" onClick={() => control.current?.abort()}>Detener</button>
              : <button type="submit" className="boton" disabled={!texto.trim()}>Enviar</button>}
          </div>
        </form>
      </main>

      <aside className="panel" aria-label="Detalles">
        <span className="etiqueta">Tu energía de hoy</span>
        <div className="anillo-fila">
          <AnilloEnergia porcentaje={pct} />
          <div>
            <b>{pct > 50 ? "Vas bien" : pct > 20 ? "Te queda la mitad" : pct > 0 ? "Queda poca" : "Se acabó por hoy"} · {pct} %</b>
            <span>Se llena a medianoche</span>
          </div>
        </div>
        {energia?.invitado && <p className="tenue pequeno">Como invitado puedes hacer {energia.invitado.max} preguntas hoy ({energia.invitado.usados} usadas). Con cuenta tienes mucho más.</p>}
        <span className="etiqueta">Esta respuesta</span>
        {ultima?.meta ? (
          <>
            <dl className="datos">
              <dt>IA</dt><dd>{ultima.meta.ia}</dd>
              <dt>Proveedor</dt><dd>{ultima.meta.proveedor}</dd>
              <dt>Tipo</dt><dd>{NOMBRE_TAREA[ultima.meta.tarea] ?? ultima.meta.tarea}</dd>
              {ultima.fin && <><dt>Tiempo</dt><dd>{(ultima.fin.ms / 1000).toFixed(1).replace(".", ",")} s</dd><dt>Energía</dt><dd>{Math.max(1, Math.round((ultima.fin.gastoTokens / 25000) * 100))} %</dd></>}
            </dl>
            {ultima.meta.respaldo && <div className="nota">Esta vez respondió otra IA porque la primera estaba ocupada. No tienes que hacer nada.</div>}
          </>
        ) : <p className="tenue pequeno">Cuando SynthZ responda, aquí verás qué IA lo hizo y cuánto gastó.</p>}
        <span className="etiqueta">Apariencia</span>
        <Ajustes />
      </aside>
    </div>
  );
}
