# Base de datos (Supabase)

Proyecto nuevo: `nbnmnfpcvaxuubvpcahs` (https://nbnmnfpcvaxuubvpcahs.supabase.co).

Tablas: `perfiles`, `chats`, `mensajes`, `energia_diaria`. Todas con RLS: cada persona solo ve lo suyo.
Las migraciones aplicadas quedan guardadas en `migraciones/` para poder rehacer la base en otro proyecto.
La llave secreta (`sb_secret_…`) solo va en variables de Vercel, nunca en el código.
