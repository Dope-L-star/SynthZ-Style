/* Proveedores de IA gratis que hablan el formato de OpenAI. Las llaves viven solo en variables del servidor. */
export type Tarea = "general" | "codigo" | "texto" | "rapido";
export type ProveedorId = "groq" | "mistral" | "google" | "openrouter";

export interface Proveedor {
  id: ProveedorId;
  nombre: string;
  base: string;
  variable: string;
}

export interface Modelo {
  prov: ProveedorId;
  id: string;
  nombre: string;
  fuerte: Tarea[];
}

export const PROVEEDORES: Record<ProveedorId, Proveedor> = {
  groq: { id: "groq", nombre: "Groq", base: "https://api.groq.com/openai/v1", variable: "GROQ_API_KEY" },
  mistral: { id: "mistral", nombre: "Mistral", base: "https://api.mistral.ai/v1", variable: "MISTRAL_API_KEY" },
  google: {
    id: "google", nombre: "Google AI Studio",
    base: "https://generativelanguage.googleapis.com/v1beta/openai", variable: "GOOGLE_API_KEY",
  },
  openrouter: { id: "openrouter", nombre: "OpenRouter", base: "https://openrouter.ai/api/v1", variable: "OPENROUTER_API_KEY" },
};

/* Solo modelos de capas gratis. Si un modelo deja de existir, el respaldo pasa al siguiente. */
export const MODELOS: Modelo[] = [
  { prov: "groq", id: "llama-3.3-70b-versatile", nombre: "Llama 3.3 70B", fuerte: ["general", "rapido", "texto"] },
  { prov: "groq", id: "openai/gpt-oss-120b", nombre: "GPT-OSS 120B", fuerte: ["codigo", "general"] },
  { prov: "groq", id: "qwen/qwen3-32b", nombre: "Qwen3 32B", fuerte: ["codigo"] },
  { prov: "google", id: "gemini-flash-latest", nombre: "Gemini Flash", fuerte: ["texto", "general", "rapido"] },
  { prov: "mistral", id: "mistral-small-latest", nombre: "Mistral Small", fuerte: ["texto", "general"] },
  { prov: "openrouter", id: "openrouter/free", nombre: "OpenRouter gratis", fuerte: ["general"] },
];

/* Permite apuntar un proveedor a otra dirección (pruebas locales) con p. ej. GROQ_BASE_URL */
export const baseDe = (p: ProveedorId): string => (process.env[PROVEEDORES[p].variable.replace("_API_KEY", "_BASE_URL")] ?? "").trim() || PROVEEDORES[p].base;
export const llaveDe = (p: ProveedorId): string => (process.env[PROVEEDORES[p].variable] ?? "").trim();
export const hayLlave = (p: ProveedorId): boolean => llaveDe(p).length > 0;
