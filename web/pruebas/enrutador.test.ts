import { afterEach, describe, expect, it } from "vitest";
import { detectarTarea, ordenar } from "../lib/enrutador";

describe("detectarTarea", () => {
  it("reconoce código", () => {
    expect(detectarTarea("Escribe una función en Python que sume dos números")).toBe("codigo");
    expect(detectarTarea("¿Por qué me sale este bug?\n```js\nfoo()\n```")).toBe("codigo");
  });
  it("reconoce escritura", () => {
    expect(detectarTarea("Redacta un correo para mi jefe pidiendo un día libre")).toBe("texto");
  });
  it("trata lo corto como rápido y lo largo como general", () => {
    expect(detectarTarea("Hola, ¿cómo estás?")).toBe("rapido");
    expect(detectarTarea("Explícame con calma cómo funcionan los mercados de acciones y por qué suben y bajan los precios con las noticias")).toBe("general");
  });
});

describe("ordenar", () => {
  const original = { ...process.env };
  afterEach(() => { process.env = { ...original }; });

  it("devuelve vacío si no hay ninguna llave", () => {
    delete process.env.GROQ_API_KEY; delete process.env.MISTRAL_API_KEY; delete process.env.GOOGLE_API_KEY; delete process.env.OPENROUTER_API_KEY;
    expect(ordenar("general")).toEqual([]);
  });
  it("usa solo proveedores con llave y pone primero los fuertes para la tarea", () => {
    delete process.env.GOOGLE_API_KEY; delete process.env.OPENROUTER_API_KEY;
    process.env.GROQ_API_KEY = "x"; process.env.MISTRAL_API_KEY = "y";
    const lista = ordenar("codigo", 0);
    expect(lista.every((m) => m.prov === "groq" || m.prov === "mistral")).toBe(true);
    expect(lista[0].fuerte).toContain("codigo");
    expect(lista.at(-1)?.fuerte).not.toContain("codigo");
  });
});
