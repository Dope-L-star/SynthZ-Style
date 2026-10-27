import { describe, expect, it } from "vitest";
import { elegirVoces, leerAcuerdo, nivelAcuerdo, pedirSintesis, sinAcuerdo } from "../lib/sintesis";
import { titulo } from "../lib/chats";

const m = (id: string, proveedor: string) => ({ id, nombre: id, proveedor });

describe("Síntesis", () => {
  it("elige una IA por proveedor, las preferidas primero", () => {
    const v = elegirVoces([m("sz:openrouter:x", "openrouter"), m("sz:groq:openai/gpt-oss-120b", "groq"), m("sz:groq:otra", "groq"), m("sz:mistral:mistral-medium-latest", "mistral")], 3);
    expect(v.map((x) => x.proveedor)).toEqual(["groq", "mistral", "openrouter"]);
  });
  it("lee y esconde la línea de acuerdo", () => {
    expect(leerAcuerdo("Hola\nACUERDO: 85")).toBe(85);
    expect(leerAcuerdo("Hola\nACUERDO: 90 %")).toBe(90);
    expect(leerAcuerdo("Hola\nACUERDO: 400")).toBe(100);
    expect(leerAcuerdo("Sin marca")).toBeNull();
    expect(sinAcuerdo("Hola\nACUERDO: 85")).toBe("Hola");
    expect(sinAcuerdo("Hola\nACUE")).toBe("Hola");
    expect(sinAcuerdo("Hola mundo")).toBe("Hola mundo");
  });
  it("niveles y petición final", () => {
    expect(nivelAcuerdo(80)).toBe("alto");
    expect(nivelAcuerdo(50)).toBe("medio");
    expect(nivelAcuerdo(10)).toBe("bajo");
    expect(pedirSintesis("¿2+2?", [{ ia: "a", texto: "4" }, { ia: "b", texto: "cuatro" }])).toContain("Respuesta 2");
  });
});

describe("Chats", () => {
  it("el título sale de la primera pregunta", () => {
    expect(titulo([{ rol: "user", contenido: "  Hola   mundo " }])).toBe("Hola mundo");
    expect(titulo([{ rol: "user", contenido: "x".repeat(80) }]).length).toBe(42);
    expect(titulo([])).toBe("Chat nuevo");
  });
});
