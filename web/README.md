# SynthZ web (nueva base)

Next.js + TypeScript. Chat con IA gratis, con respaldo entre proveedores, respuesta en vivo y Energía diaria. Cuentas con Supabase Auth.

```
cd web
cp .env.example .env.local   # y llena las llaves secretas
npm install
npm run dev
npm test        # pruebas
npm run lint    # tipos
```

## Cómo funciona el chat
- `app/api/chat`: valida, mira la Energía, elige la IA según la tarea (`lib/enrutador.ts`), la llama y devuelve la respuesta por partes. Si una IA falla antes de empezar, pasa a la siguiente.
- `lib/energia.ts`: 100 % = 25.000 tokens al día (se llena a medianoche, hora de Colombia). Invitados: 5 preguntas al día.
- `lib/proveedores.ts`: lista de IA gratis. Solo se usan las que tengan llave en las variables de entorno.

## Variables en Vercel
Públicas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
Secretas: `SUPABASE_SECRET_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY` (con una basta para empezar).

La página actual de la raíz del repo no se toca hasta el paso a producción. Para ver esta en Vercel, apuntar el Root Directory de un proyecto de vista previa a `web`.
