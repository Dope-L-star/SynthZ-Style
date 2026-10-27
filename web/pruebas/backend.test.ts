import { describe, expect, it } from "vitest";
import { leerLinea, turnoId } from "../lib/backend";
import { nivelEnergia, porcentajeRestante } from "../lib/energia";

describe("leerLinea", () => {
  it("lee un trozo de texto", () => {
    expect(leerLinea('data: {"choices":[{"delta":{"content":"Hola"}}]}')).toEqual({ t: "texto", d: "Hola" });
  });
  it("lee el aviso de energía del backend", () => {
    expect(leerLinea('data: {"sz":{"used":1200,"limit":25000,"spent":300}}')).toEqual({ t: "energia", usado: 1200, limite: 25000, gasto: 300 });
  });
  it("detecta errores a mitad de la respuesta", () => {
    expect(leerLinea('data: {"error":{"message":"se cortó"}}')).toEqual({ t: "error", mensaje: "se cortó" });
  });
  it("ignora [DONE], líneas vacías, rotas o de otro tipo", () => {
    expect(leerLinea("data: [DONE]")).toBeNull();
    expect(leerLinea("")).toBeNull();
    expect(leerLinea("data: {roto")).toBeNull();
    expect(leerLinea(": ping")).toBeNull();
    expect(leerLinea('data: {"choices":[{"delta":{"role":"assistant"}}]}')).toBeNull();
  });
});

describe("turnoId", () => {
  it("es igual para la misma pregunta y distinto para otra", () => {
    expect(turnoId("hola")).toBe(turnoId("hola"));
    expect(turnoId("hola")).not.toBe(turnoId("adiós"));
  });
});

describe("energía", () => {
  it("calcula el porcentaje que queda", () => {
    expect(porcentajeRestante(0, 25000)).toBe(100);
    expect(porcentajeRestante(12500, 25000)).toBe(50);
    expect(porcentajeRestante(30000, 25000)).toBe(0);
    expect(porcentajeRestante(5, 0)).toBe(100);
  });
  it("da el nivel", () => {
    expect([100, 40, 10, 0].map(nivelEnergia)).toEqual(["bien", "mitad", "poca", "agotada"]);
  });
});
