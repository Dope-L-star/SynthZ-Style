/* La Energía es lo que le queda de su límite del día, en porcentaje. El backend cuenta tokens (`used` y `limit`). */
export const porcentajeRestante = (usado: number, limite: number): number => {
  if (!(limite > 0)) return 100;
  return Math.max(0, Math.min(100, Math.round((1 - usado / limite) * 100)));
};

export const nivelEnergia = (pct: number): "bien" | "mitad" | "poca" | "agotada" =>
  pct > 50 ? "bien" : pct > 20 ? "mitad" : pct > 0 ? "poca" : "agotada";

export const TITULO_ENERGIA = { bien: "Vas bien", mitad: "Te queda la mitad", poca: "Queda poca", agotada: "Se acabó por hoy" } as const;
