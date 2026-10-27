"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ErrorApi, estadoIA, hablar, quien, salir, type EstadoIA, type Usuario } from "@/lib/backend";
import { nivelEnergia, porcentajeRestante, TITULO_ENERGIA } from "@/lib/energia";
import { Ajustes } from "./Ajustes";
import { AnilloEnergia } from "./AnilloEnergia";
import { Texto } from "./Texto";

type Meta = { ia: string; proveedor: string; respaldo: boolean };
type Msg =
  | { rol: "user"; contenido: string }
  | { rol: "assistant"; contenido: string; meta?: Meta; gasto?: number; ms?: number; error?: { codigo: string; mensaje: string } };

const IDEAS = [
  { titulo: "Escribir", ayuda: "Correos, ensayos, mensajes", texto: "Ayúdame a escribir un correo amable para pedirle una prórroga a mi profesor." },
  { titulo: "Estudiar", ayuda: "Te lo explica paso a paso", texto: "Explícame qué es la fotosíntesis como si tuviera 8 años." },
  { titulo: "Código", ayuda: "Escribe o arregla código", texto: "Escribe una función en JavaScript que diga si una palabra es un palíndromo, con ejemplos." },
  { titulo: "Ideas", ayuda: "Lluvia de ideas sin pena", texto: "Dame 10 ideas de nombres para una cafetería con un gato." },
];

const textoGasto = (gasto: number, limite: number) => {
  const p = (gasto / Math.max(limite, 1)) * 100;
  return p < 1 ? "menos de 1 %" : `${Math.round(p)} %`;
};

export function Aplicacion() {
  const [mensajes, setMensajes] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const [estado, setEstado] = useState<EstadoIA | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const control = useRef<AbortController | null>(null);
  const fondo = useRef<HTMLDivElement>(null);

  const refrescar = useCallback(() => { estadoIA().then(setEstado).catch(() => {}); }, []);
  useEffect(() => { refrescar(); quien().then(setUsuario); }, [refrescar]);
  useEffect(() => { fondo.current?.scrollIntoView({ block: "end" }); }, [mensajes]);

  const ultimaA = (f: (m: Extract<Msg, { rol: "assistant" }>) => Extract<Msg, { rol: "assistant" }>) =>
    setMensajes((prev) => { const c = [...prev]; const u = c[c.length - 1]; if (u?.rol === "assistant") c[c.length - 1] = f(u); return c; });

  const enviar = useCallback(async (pregunta: string) => {
    const limpio = pregunta.trim();
    if (!limpio || escribiendo) return;
    const historial: Msg[] = [...mensajes.filter((m) => !(m.rol === "assistant" && (m.error || !m.contenido))), { rol: "user", contenido: limpio }];
    setMensajes([...historial, { rol: "assistant", contenido: "" }]);
    setTexto("");
    setEscribiendo(true);
    const ctl = new AbortController();
    control.current = ctl;
    const inicio = Date.now();
    try {
      const entrada = historial.slice(-20).map((m) => ({ role: m.rol, content: m.contenido }));
      for await (const e of hablar(entrada, ctl.signal)) {
        if (e.t === "meta") ultimaA((m) => ({ ...m, meta: e }));
        else if (e.t === "texto") ultimaA((m) => ({ ...m, contenido: m.contenido + e.d }));
        else if (e.t === "energia") {
          ultimaA((m) => ({ ...m, gasto: e.gasto, ms: Date.now() - inicio }));
          setEstado((x) => (x ? { ...x, usado: e.usado || x.usado, limite: e.limite || x.limite } : x));
        }
      }
    } catch (err) {
      if (ctl.signal.aborted) return;
      const e = err instanceof ErrorApi ? err : new ErrorApi("Algo salió mal. Intenta de nuevo.");
      const mensaje = e.codigo === "sz_off" ? "Ahora mismo no hay ninguna IA disponible. Intenta de nuevo en un rato." : e.message;
      ultimaA((m) => ({ ...m, error: { codigo: e.codigo, mensaje } }));
    } finally {
      setEscribiendo(false);
      control.current = null;
      refrescar();
    }
  }, [mensajes, escribiendo, refrescar]);

  const nuevo = () => { control.current?.abort(); setMensajes([]); setTexto(""); };
  const ultima = [...mensajes].reverse().find((m): m is Extract<Msg, { rol: "assistant" }> => m.rol === "assistant" && !!m.meta);
  const pct = estado ? porcentajeRestante(estado.usado, estado.limite) : 100;
  const nivel = nivelEnergia(pct);

  return (
    <div className="app">
      <aside className="riel" aria-label="Chats">
        <span className="marca">Synth<span>Z</span></span>
        <button className="boton" onClick={nuevo}>+ Nuevo chat</button>
        <span className="etiqueta">Tus chats</span>
        <p className="vacio">{usuario ? "Tus chats guardados llegan en la siguiente entrega." : "Aquí aparecerán tus chats cuando entres a tu cuenta."}</p>
        {usuario ? (
          <div className="persona">
            <span className="tenue pequeno" title={usuario.name}>@{usuario.username ?? usuario.name}</span>
            <button className="boton secundario" onClick={async () => { await salir(); window.location.reload(); }}>Salir</button>
          </div>
        ) : <Link className="boton secundario" href="/entrar/">Entrar o crear cuenta</Link>}
      </aside>

      <main className="centro">
        <div className="barra">
          <button className="chip" aria-pressed="true">Automática</button>
          <button className="chip" disabled title="Llega pronto">Comparar · pronto</button>
          <button className="chip" disabled title="Llega pronto">Síntesis · pronto</button>
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
                      {m.error.codigo === "sz_guest" && <> <Link href="/entrar/">Entrar o crear cuenta</Link></>}
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
          <div><b>{TITULO_ENERGIA[nivel]} · {pct} %</b><span>Se llena a medianoche</span></div>
        </div>
        {estado?.invitado && <p className="tenue pequeno">Sin cuenta puedes hacer {estado.invitado.max} preguntas hoy ({estado.invitado.usados} usadas). Con cuenta tienes mucho más.</p>}
        <span className="etiqueta">Esta respuesta</span>
        {ultima?.meta ? (
          <>
            <dl className="datos">
              <dt>IA</dt><dd>{ultima.meta.ia}</dd>
              {ultima.meta.proveedor && <><dt>Proveedor</dt><dd>{ultima.meta.proveedor}</dd></>}
              {ultima.ms !== undefined && <><dt>Tiempo</dt><dd>{(ultima.ms / 1000).toFixed(1).replace(".", ",")} s</dd></>}
              {ultima.gasto !== undefined && estado && <><dt>Energía</dt><dd>{textoGasto(ultima.gasto, estado.limite)}</dd></>}
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
