"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { consultar, ErrorApi, estadoIA, hablar, modelosIA, quien, salir, sesion, turnoId, type EstadoIA, type Usuario } from "@/lib/backend";
import { borrarLocal, borrarNube, guardarLocal, leerLocales, nuevoId, subirNube, titulo, traerNube, type Chat, type Mensaje } from "@/lib/chats";
import { nivelEnergia, porcentajeRestante, TITULO_ENERGIA } from "@/lib/energia";
import { elegirVoces, leerAcuerdo, pedirSintesis, sinAcuerdo } from "@/lib/sintesis";
import { Ajustes } from "./Ajustes";
import { AnilloEnergia } from "./AnilloEnergia";
import { Texto } from "./Texto";
import { Columnas, EstadoSintesis, type ColumnaVista, type SintesisVista } from "./Voces";

type Meta = { ia: string; proveedor: string; respaldo: boolean };
type Msg =
  | { rol: "user"; contenido: string }
  | { rol: "assistant"; contenido: string; meta?: Meta; gasto?: number; ms?: number; error?: { codigo: string; mensaje: string }; sintesis?: SintesisVista; columnas?: ColumnaVista[] };
type Modo = "auto" | "comparar" | "sintesis";
type Asistente = Extract<Msg, { rol: "assistant" }>;

/* Lo que se guarda: solo texto. La comparación se guarda como un texto con el nombre de cada IA. */
const aGuardar = (m: Msg[]): Mensaje[] =>
  m.filter((x) => x.rol === "user" || (!x.error && (x.contenido || x.columnas)))
    .map((x) => x.rol === "user" ? { rol: "user", contenido: x.contenido }
      : { rol: "assistant", contenido: x.columnas ? x.columnas.filter((c) => c.texto).map((c) => `**${c.ia}**\n\n${c.texto}`).join("\n\n---\n\n") : x.contenido, ia: x.meta?.ia });
const deGuardado = (m: Mensaje[]): Msg[] =>
  m.map((x) => x.rol === "user" ? { rol: "user", contenido: x.contenido } : { rol: "assistant", contenido: x.contenido, meta: x.ia ? { ia: x.ia, proveedor: "", respaldo: false } : undefined });

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
  const [modo, setModo] = useState<Modo>("auto");
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatId, setChatId] = useState(() => nuevoId());
  const control = useRef<AbortController | null>(null);
  const fondo = useRef<HTMLDivElement>(null);

  const refrescar = useCallback(() => { estadoIA().then(setEstado).catch(() => {}); }, []);
  useEffect(() => { refrescar(); quien().then(setUsuario); setChats(leerLocales()); traerNube().then(setChats); }, [refrescar]);
  useEffect(() => { fondo.current?.scrollIntoView({ block: "end" }); }, [mensajes]);

  const ultimaA = (f: (m: Asistente) => Asistente) =>
    setMensajes((prev) => { const c = [...prev]; const u = c[c.length - 1]; if (u?.rol === "assistant") c[c.length - 1] = f(u); return c; });

  const guardar = useCallback((id: string, msgs: Msg[]) => {
    const g = aGuardar(msgs);
    if (!g.some((m) => m.rol === "assistant")) return;
    const chat: Chat = { id, titulo: titulo(g), mensajes: g, t: Date.now() };
    setChats(guardarLocal(chat));
    subirNube(chat);
  }, []);

  /* Al terminar una respuesta (o detenerla) se guarda el chat */
  const estabaEscribiendo = useRef(false);
  useEffect(() => {
    if (estabaEscribiendo.current && !escribiendo) guardar(chatId, mensajes);
    estabaEscribiendo.current = escribiendo;
  }, [escribiendo, mensajes, chatId, guardar]);

  const sumarEnergia = (r: { usado: number; limite: number }) =>
    r.limite && setEstado((x) => (x ? { ...x, usado: r.usado || x.usado, limite: r.limite || x.limite } : x));

  const pidePermiso = (codigo: string, mensaje: string) => ultimaA((m) => ({ ...m, error: { codigo, mensaje } }));

  const enviar = useCallback(async (pregunta: string) => {
    const limpio = pregunta.trim();
    if (!limpio || escribiendo) return;
    const historial: Msg[] = [...mensajes.filter((m) => !(m.rol === "assistant" && (m.error || (!m.contenido && !m.columnas)))), { rol: "user", contenido: limpio }];
    setMensajes([...historial, { rol: "assistant", contenido: "" }]);
    setTexto("");
    setEscribiendo(true);
    const ctl = new AbortController();
    control.current = ctl;
    const inicio = Date.now();
    const entrada = historial.slice(-20).map((m) => ({ role: m.rol, content: m.rol === "assistant" ? sinAcuerdo(m.contenido) : m.contenido }));
    const turno = turnoId(limpio);
    try {
      if (modo !== "auto" && !sesion()) {
        pidePermiso("sz_cuenta", "Comparar y Síntesis usan varias IA a la vez, por eso necesitan una cuenta (es gratis).");
        return;
      }
      if (modo === "auto") {
        for await (const e of hablar(entrada, ctl.signal)) {
          if (e.t === "meta") ultimaA((m) => ({ ...m, meta: e }));
          else if (e.t === "texto") ultimaA((m) => ({ ...m, contenido: m.contenido + e.d }));
          else {
            ultimaA((m) => ({ ...m, gasto: e.gasto, ms: Date.now() - inicio }));
            sumarEnergia({ usado: e.usado, limite: e.limite });
          }
        }
      } else {
        const modelos = elegirVoces(await modelosIA(), modo === "comparar" ? 2 : 3);
        if (modelos.length < 2) throw new ErrorApi("Ahora mismo no hay suficientes IA disponibles para esto. Intenta de nuevo en un rato.");
        let gastoTotal = 0;
        if (modo === "comparar") {
          const cols: ColumnaVista[] = modelos.map((m) => ({ ia: m.nombre, texto: "", estado: "pidiendo" }));
          const poner = (i: number, c: Partial<ColumnaVista>) => { cols[i] = { ...cols[i], ...c }; ultimaA((m) => ({ ...m, contenido: "", columnas: [...cols] })); };
          poner(0, {});
          await Promise.all(modelos.map((m, i) =>
            consultar(entrada, ctl.signal, m.id, turno + "c" + i, (t) => poner(i, { texto: t }))
              .then((r) => { gastoTotal += r.gasto; sumarEnergia(r); poner(i, { estado: "lista" }); })
              .catch((e) => { if (ctl.signal.aborted) throw e; poner(i, { estado: "fallo" }); })));
          if (!cols.some((c) => c.estado === "lista")) throw new ErrorApi("Ninguna IA pudo responder ahora. Intenta de nuevo en un momento.");
          ultimaA((m) => ({ ...m, gasto: gastoTotal, ms: Date.now() - inicio, meta: { ia: `${modelos.length} IA`, proveedor: "", respaldo: false } }));
        } else {
          const voces = modelos.map((m) => ({ ia: m.nombre, texto: "", estado: "pidiendo" as const })) as SintesisVista["voces"];
          const ver = (extra: Partial<SintesisVista>) => ultimaA((m) => ({ ...m, sintesis: { voces: [...voces], fase: "consultando", ...m.sintesis, ...extra } }));
          ver({});
          await Promise.all(modelos.map((m, i) =>
            consultar(entrada, ctl.signal, m.id, turno + "s" + i)
              .then((r) => { gastoTotal += r.gasto; sumarEnergia(r); voces[i] = { ia: m.nombre, texto: r.texto, estado: r.texto.trim() ? "lista" : "fallo" }; ver({}); })
              .catch((e) => { if (ctl.signal.aborted) throw e; voces[i] = { ia: m.nombre, texto: "", estado: "fallo" }; ver({}); })));
          const buenas = voces.filter((v) => v.estado === "lista");
          if (!buenas.length) throw new ErrorApi("Ninguna IA pudo responder ahora. Intenta de nuevo en un momento.");
          ver({ fase: "uniendo" });
          const ultimaPregunta = [{ role: "user" as const, content: pedirSintesis(limpio, buenas) }];
          const r = await consultar(ultimaPregunta, ctl.signal, modelos[0].id, turno + "f", (t) => ultimaA((m) => ({ ...m, contenido: sinAcuerdo(t) })));
          gastoTotal += r.gasto; sumarEnergia(r);
          const acuerdo = buenas.length > 1 ? leerAcuerdo(r.texto) ?? undefined : undefined;
          ultimaA((m) => ({ ...m, contenido: sinAcuerdo(r.texto), gasto: gastoTotal, ms: Date.now() - inicio, meta: { ia: `Síntesis de ${buenas.length} IA`, proveedor: "", respaldo: false }, sintesis: { voces: [...voces], fase: "lista", acuerdo } }));
        }
      }
    } catch (err) {
      if (ctl.signal.aborted) return;
      const e = err instanceof ErrorApi ? err : new ErrorApi("Algo salió mal. Intenta de nuevo.");
      const mensaje = e.codigo === "sz_off" ? "Ahora mismo no hay ninguna IA disponible. Intenta de nuevo en un rato." : e.message;
      pidePermiso(e.codigo, mensaje);
    } finally {
      setEscribiendo(false);
      control.current = null;
      refrescar();
    }
  }, [mensajes, escribiendo, refrescar, modo]);

  const nuevo = () => { control.current?.abort(); setMensajes([]); setTexto(""); setChatId(nuevoId()); };
  const abrir = (c: Chat) => { control.current?.abort(); setEscribiendo(false); setChatId(c.id); setMensajes(deGuardado(c.mensajes)); };
  const quitar = (c: Chat) => { setChats(borrarLocal(c.id)); borrarNube(c.id); if (c.id === chatId) nuevo(); };
  const ultima = [...mensajes].reverse().find((m): m is Extract<Msg, { rol: "assistant" }> => m.rol === "assistant" && !!m.meta);
  const pct = estado ? porcentajeRestante(estado.usado, estado.limite) : 100;
  const nivel = nivelEnergia(pct);

  return (
    <div className="app">
      <aside className="riel" aria-label="Chats">
        <span className="marca">Synth<span>Z</span></span>
        <button className="boton" onClick={nuevo}>+ Nuevo chat</button>
        <span className="etiqueta">Tus chats</span>
        {chats.length ? (
          <ul className="lista">
            {chats.map((c) => (
              <li key={c.id}>
                <button aria-current={c.id === chatId} onClick={() => abrir(c)} title={c.titulo}>{c.titulo}</button>
                <button className="borrar" aria-label={`Borrar el chat ${c.titulo}`} onClick={() => quitar(c)}>✕</button>
              </li>
            ))}
          </ul>
        ) : <p className="vacio">{usuario ? "Aquí irán tus chats. Se guardan en tu cuenta." : "Tus chats se guardan en este navegador. Con una cuenta los tienes en todos lados."}</p>}
        {usuario ? (
          <div className="persona">
            <span className="tenue pequeno" title={usuario.name}>@{usuario.username ?? usuario.name}</span>
            <button className="boton secundario" onClick={async () => { await salir(); window.location.reload(); }}>Salir</button>
          </div>
        ) : <Link className="boton secundario" href="/entrar/">Entrar o crear cuenta</Link>}
      </aside>

      <main className="centro">
        <div className="barra">
          <button className="chip" aria-pressed={modo === "auto"} onClick={() => setModo("auto")} title="SynthZ elige la IA que mejor le va a tu pregunta">Automática</button>
          <button className="chip" aria-pressed={modo === "comparar"} onClick={() => setModo("comparar")} title="Dos IA responden lado a lado">Comparar</button>
          <button className="chip" aria-pressed={modo === "sintesis"} onClick={() => setModo("sintesis")} title="Varias IA responden y una une lo mejor">Síntesis</button>
          <details className="mini-ajustes"><summary className="chip">Apariencia</summary><div className="flotante"><Ajustes /></div></details>
        </div>

        <div className="hilo" aria-live="polite">
          {mensajes.length === 0 ? (
            <div className="inicio">
              <h1>Hola. ¿Qué hacemos hoy?</h1>
              <p className="tenue">{modo === "auto" ? "Escribe lo que quieras. SynthZ elige la IA que mejor le va a tu pregunta." : modo === "comparar" ? "Dos IA responden lado a lado para que veas cuál te sirve más." : "Varias IA responden, una une lo mejor y te dice qué tanto coinciden."}</p>
              <div className="ideas">
                {IDEAS.map((i) => (
                  <button key={i.titulo} className="idea" onClick={() => enviar(i.texto)}><b>{i.titulo}</b><span>{i.ayuda}</span></button>
                ))}
              </div>
            </div>
          ) : (
            mensajes.map((m, i) =>
              m.rol === "user" ? <div key={i} className="tu">{m.contenido}</div> : (
                <div key={i} className={`ia${m.columnas ? " ancho" : ""}`}>
                  {m.columnas ? <Columnas c={m.columnas} /> : m.contenido ? <Texto valor={m.contenido} /> : !m.error && !m.sintesis && <span className="pensando" aria-label="Pensando"><i /><i /><i /></span>}
                  {m.sintesis && <EstadoSintesis s={m.sintesis} />}
                  {m.error && (
                    <div className="nota" role="alert">
                      {m.error.mensaje}
                      {(m.error.codigo === "sz_guest" || m.error.codigo === "sz_cuenta") && <> <Link href="/entrar/">Entrar o crear cuenta</Link></>}
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
