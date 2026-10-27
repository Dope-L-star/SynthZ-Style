/* Síntesis y Comparar: elegir qué IAs consultar, armar la petición final y leer el «acuerdo». Todo con las IAs que ya hay. */
import type { ModeloIA } from "./backend";

/* De la más a la menos preferida. Se toma una por proveedor para que las voces sean realmente distintas. */
const PREFERIDAS = [
  /^sz:groq:openai\/gpt-oss-120b$/,
  /^sz:mistral:mistral-medium-latest$/,
  /^sz:cloudflare:@cf\/meta\/llama-3\.3-70b/,
  /^sz:openrouter:nvidia\/nemotron-3-ultra/,
  /^sz:ollama:(kimi-k3|deepseek-v4-pro|glm-5\.3$)/,
  /^sz:openrouter:google\/gemma-4-31b/,
  /^sz:cloudflare:@cf\/qwen\/qwen3\.8-27b$/,
];

export function elegirVoces(modelos: ModeloIA[], cuantas: number): ModeloIA[] {
  const out: ModeloIA[] = [];
  const usados = new Set<string>();
  const tomar = (m: ModeloIA) => { if (out.length < cuantas && !usados.has(m.proveedor)) { out.push(m); usados.add(m.proveedor); } };
  for (const re of PREFERIDAS) { const m = modelos.find((x) => re.test(x.id)); if (m) tomar(m); }
  for (const m of modelos) tomar(m);
  return out;
}

export interface Voz { ia: string; texto: string }

export function pedirSintesis(pregunta: string, voces: Voz[]): string {
  const bloques = voces.map((v, i) => `--- Respuesta ${i + 1} ---\n${v.texto.trim()}`).join("\n\n");
  return (
    `Pregunta del usuario:\n${pregunta}\n\n` +
    `Estas son ${voces.length} respuestas independientes de distintas IA:\n\n${bloques}\n\n` +
    "Escribe UNA sola respuesta final, en el mismo idioma de la pregunta: clara, correcta y completa. " +
    "Conserva lo que coincide, corrige errores y si las respuestas se contradicen, quédate con lo más probable y dilo en una frase. " +
    "No menciones las respuestas numeradas ni que hubo varias IA. " +
    "Al final, en una última línea aparte, escribe exactamente «ACUERDO: N» donde N es un número de 0 a 100 que indica cuánto coinciden las respuestas entre sí."
  );
}

const MARCA = "\nACUERDO";

/* Quita la línea del acuerdo (también mientras se está escribiendo) para no mostrarla */
export function sinAcuerdo(texto: string): string {
  const i = texto.lastIndexOf(MARCA);
  if (i >= 0) return texto.slice(0, i).trimEnd();
  for (let k = MARCA.length - 1; k >= 1; k--) if (texto.endsWith(MARCA.slice(0, k))) return texto.slice(0, texto.length - k).trimEnd();
  return texto;
}

export function leerAcuerdo(texto: string): number | null {
  const m = /ACUERDO\s*[:=]\s*(\d{1,3})\s*%?\W*$/i.exec(texto);
  return m ? Math.min(100, +m[1]) : null;
}

export function nivelAcuerdo(n: number): "alto" | "medio" | "bajo" {
  return n >= 75 ? "alto" : n >= 45 ? "medio" : "bajo";
}
