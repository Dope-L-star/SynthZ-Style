import { nivelAcuerdo } from "@/lib/sintesis";
import { Texto } from "./Texto";

export interface VozVista { ia: string; texto: string; estado: "pidiendo" | "lista" | "fallo" }
export interface SintesisVista { voces: VozVista[]; fase: "consultando" | "uniendo" | "lista"; acuerdo?: number }
export interface ColumnaVista { ia: string; texto: string; estado: "pidiendo" | "lista" | "fallo" }

const TEXTO_ACUERDO = { alto: "Las IA coinciden", medio: "Coinciden en parte", bajo: "Opinan distinto: revisa con calma" } as const;

export function EstadoSintesis({ s }: { s: SintesisVista }) {
  const listas = s.voces.filter((v) => v.estado === "lista").length;
  return (
    <div className="sintesis">
      {s.fase === "consultando" && <p className="tenue pequeno">Consultando {s.voces.length} IA a la vez… ({listas} listas)</p>}
      {s.fase === "uniendo" && <p className="tenue pequeno">Uniendo las mejores partes de {listas} respuestas…</p>}
      {s.acuerdo !== undefined && (
        <div className={`acuerdo acuerdo-${nivelAcuerdo(s.acuerdo)}`} role="img" aria-label={`Acuerdo entre las IA: ${s.acuerdo} %`}>
          <div className="acuerdo-barra"><i style={{ width: `${s.acuerdo}%` }} /></div>
          <span><b>{s.acuerdo} %</b> · {TEXTO_ACUERDO[nivelAcuerdo(s.acuerdo)]}</span>
        </div>
      )}
      {s.fase === "lista" && s.voces.some((v) => v.estado === "lista") && (
        <details className="voces">
          <summary>Ver cómo respondió cada IA</summary>
          {s.voces.filter((v) => v.estado === "lista").map((v, i) => (<div key={i} className="voz"><span className="etiqueta">{v.ia}</span><Texto valor={v.texto} /></div>))}
        </details>
      )}
    </div>
  );
}

export function Columnas({ c }: { c: ColumnaVista[] }) {
  return (
    <div className="columnas">
      {c.map((x, i) => (
        <section key={i} className="columna">
          <span className="etiqueta">{x.ia}</span>
          {x.estado === "fallo" ? <div className="nota">Esta IA no pudo responder ahora.</div>
            : x.texto ? <Texto valor={x.texto} />
            : <span className="pensando" aria-label="Pensando"><i /><i /><i /></span>}
        </section>
      ))}
    </div>
  );
}
