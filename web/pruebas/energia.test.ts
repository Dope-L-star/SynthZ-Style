import { describe, expect, it } from "vitest";
import { DIA_TOKENS, INVITADO_MENSAJES, puedeEscribir, type Estado } from "../lib/energia";

const estado = (p: Partial<Estado>): Estado => ({ usadoTokens: 0, limiteTokens: DIA_TOKENS, porcentajeRestante: 100, invitado: null, ...p });

describe("puedeEscribir", () => {
  it("deja escribir con energía", () => { expect(puedeEscribir(estado({ usadoTokens: 100 })).ok).toBe(true); });
  it("avisa cuando se acaba la energía", () => {
    const v = puedeEscribir(estado({ usadoTokens: DIA_TOKENS }));
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.codigo).toBe("sin_energia");
  });
  it("pide cuenta al invitado después de su última pregunta", () => {
    const v = puedeEscribir(estado({ invitado: { usados: INVITADO_MENSAJES, max: INVITADO_MENSAJES } }));
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.codigo).toBe("invitado_limite");
  });
});
