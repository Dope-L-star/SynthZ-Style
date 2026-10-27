/* Energía del día como anillo. Nunca dice "te quedan N mensajes": solo porcentaje y a qué hora se llena. */
type Props = { porcentaje: number; tamano?: number };

export function AnilloEnergia({ porcentaje, tamano = 46 }: Props) {
  const p = Math.max(0, Math.min(100, porcentaje));
  const r = tamano / 2 - 5;
  const largo = 2 * Math.PI * r;
  const color = p <= 10 ? "var(--error)" : p <= 20 ? "var(--aviso)" : "var(--acento)";
  return (
    <svg width={tamano} height={tamano} viewBox={`0 0 ${tamano} ${tamano}`} role="img" aria-label={`Energía de hoy: ${p} %`}>
      <circle cx={tamano / 2} cy={tamano / 2} r={r} fill="none" stroke="var(--linea)" strokeWidth={5} />
      <circle
        cx={tamano / 2} cy={tamano / 2} r={r} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
        strokeDasharray={largo} strokeDashoffset={largo * (1 - p / 100)}
        transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`}
        style={{ transition: "stroke-dashoffset .5s ease" }}
      />
    </svg>
  );
}
