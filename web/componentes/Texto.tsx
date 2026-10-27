"use client";
import { useState } from "react";

/* Muestra texto de la IA con Markdown básico (bloques de código, `código`, **negrita**, listas) sin inyectar HTML. */
function Linea({ texto }: { texto: string }) {
  const partes = texto.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/g);
  return (
    <>
      {partes.map((p, i) =>
        p.startsWith("`") && p.endsWith("`") && p.length > 2 ? <code key={i}>{p.slice(1, -1)}</code>
        : p.startsWith("**") && p.endsWith("**") && p.length > 4 ? <strong key={i}>{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>,
      )}
    </>
  );
}

function Codigo({ lenguaje, codigo }: { lenguaje: string; codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(codigo); setCopiado(true); setTimeout(() => setCopiado(false), 1500); } catch { /* sin permiso */ }
  };
  return (
    <div className="bloque-codigo">
      <div className="bloque-cab"><span>{lenguaje || "código"}</span><button onClick={copiar}>{copiado ? "Copiado" : "Copiar"}</button></div>
      <pre><code>{codigo}</code></pre>
    </div>
  );
}

export function Texto({ valor }: { valor: string }) {
  /* un bloque abierto (la IA aún escribe) se muestra ya como código */
  const trozos = valor.split(/```/);
  return (
    <div className="texto">
      {trozos.map((t, i) => {
        if (i % 2 === 1) {
          const salto = t.indexOf("\n");
          const lenguaje = salto === -1 ? "" : t.slice(0, salto).trim();
          const codigo = salto === -1 ? t : t.slice(salto + 1).replace(/\n$/, "");
          return <Codigo key={i} lenguaje={lenguaje} codigo={codigo} />;
        }
        return t.split(/\n{2,}/).filter((b) => b.trim()).map((b, j) => {
          const lineas = b.split("\n");
          if (lineas.every((l) => /^\s*[-*]\s+/.test(l))) return <ul key={`${i}-${j}`}>{lineas.map((l, k) => <li key={k}><Linea texto={l.replace(/^\s*[-*]\s+/, "")} /></li>)}</ul>;
          return <p key={`${i}-${j}`}>{lineas.map((l, k) => <span key={k}>{k > 0 && <br />}<Linea texto={l} /></span>)}</p>;
        });
      })}
    </div>
  );
}
