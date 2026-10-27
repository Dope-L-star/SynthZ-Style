"use client";
import { useEffect, useState } from "react";

export const COLORES = ["aurora", "azul", "violeta", "coral", "menta", "oro", "rosa", "noche"] as const;
type Color = (typeof COLORES)[number];
type Tema = "claro" | "oscuro" | "sistema";

const guardar = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} };

/* Selector de tema y de color del perfil. Cambia los atributos de <html>, que mueven todo el sistema. */
export function Ajustes() {
  const [tema, setTema] = useState<Tema>("sistema");
  const [color, setColor] = useState<Color>("aurora");

  const sistema = () => (matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro");

  useEffect(() => {
    const d = document.documentElement;
    let guardado: string | null = null;
    try { guardado = localStorage.getItem("sz-tema"); } catch {}
    setTema(guardado === "claro" || guardado === "oscuro" ? guardado : "sistema");
    setColor((d.dataset.color as Color) || "aurora");
  }, []);

  /* En Auto, sigue al sistema si la persona lo cambia mientras usa la página */
  useEffect(() => {
    if (tema !== "sistema") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const seguir = () => { document.documentElement.dataset.tema = mq.matches ? "oscuro" : "claro"; };
    mq.addEventListener("change", seguir);
    return () => mq.removeEventListener("change", seguir);
  }, [tema]);

  const elegirTema = (t: Tema) => {
    setTema(t);
    const d = document.documentElement;
    if (t === "sistema") { d.dataset.tema = sistema(); try { localStorage.removeItem("sz-tema"); } catch {} }
    else { d.dataset.tema = t; guardar("sz-tema", t); }
  };
  const elegirColor = (c: Color) => {
    setColor(c);
    document.documentElement.dataset.color = c;
    guardar("sz-color", c);
  };

  return (
    <div className="ajustes">
      <div className="grupo" role="group" aria-label="Tema">
        {(["claro", "oscuro", "sistema"] as Tema[]).map((t) => (
          <button key={t} aria-pressed={tema === t} onClick={() => elegirTema(t)}>
            {t === "claro" ? "Atlas" : t === "oscuro" ? "Consola" : "Auto"}
          </button>
        ))}
      </div>
      <div className="colores" role="group" aria-label="Color de tu perfil">
        {COLORES.map((c) => (
          <button key={c} className={`pto pto-${c}`} aria-label={c} aria-pressed={color === c} onClick={() => elegirColor(c)} />
        ))}
      </div>
    </div>
  );
}
