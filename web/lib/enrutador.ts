import { MODELOS, hayLlave, type Modelo, type Tarea } from "./proveedores";

const RX_CODIGO = /```|\b(c[oó]digo|funci[oó]n|bug|error de|compil|javascript|typescript|python|java\b|html|css|sql|react|api|script|algoritmo|regex)\b|[{};]\s*$/i;
const RX_TEXTO = /\b(escribe|redacta|resume|resumen|correo|carta|ensayo|poema|cuento|traduce|mejora este texto)\b/i;

/* Mira el último mensaje y decide para qué tipo de tarea es */
export function detectarTarea(texto: string): Tarea {
  if (RX_CODIGO.test(texto)) return "codigo";
  if (RX_TEXTO.test(texto)) return "texto";
  if (texto.trim().length < 80) return "rapido";
  return "general";
}

/* Modelos con llave disponible: primero los fuertes para la tarea (rotados para repartir la carga) y luego el resto como respaldo */
export function ordenar(tarea: Tarea, semilla = Math.random()): Modelo[] {
  const disponibles = MODELOS.filter((m) => hayLlave(m.prov));
  const fuertes = disponibles.filter((m) => m.fuerte.includes(tarea));
  const resto = disponibles.filter((m) => !m.fuerte.includes(tarea));
  const rotar = <T,>(xs: T[]) => (xs.length ? [...xs.slice(Math.floor(semilla * xs.length)), ...xs.slice(0, Math.floor(semilla * xs.length))] : xs);
  return [...rotar(fuertes), ...resto];
}
