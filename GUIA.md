# SynthZ v14 · Cómo dejar las cuentas funcionando en Vercel

Sube **la carpeta completa** a tu repositorio, no solo los `.html`:

```
index.html  chat.html  core.js  core.css  icon.svg  manifest.webmanifest
package.json  vercel.json  api/   (_lib.js, auth.js, chat.js, chats.js, config.js, csp.js, me.js, teams.js)
```

Las cuentas usan **usuario y contraseña**. No necesitas Google, ni correo, ni dominio propio.

## El único paso obligatorio: conectar la base de datos (gratis)

1. En Vercel, abre tu proyecto → **Storage** → **Create Database** (o **Marketplace**) → **Upstash for Redis**.
2. Elige el plan **Free** y luego **Connect to project**.
3. Ve a **Deployments → ⋯ → Redeploy**.

Para comprobar que funcionó, abre `https://TU-PROYECTO.vercel.app/api/config`. Debe decir `"ok":true`.

Al conectarla, Vercel crea solas las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`. No tienes que copiar nada a mano.

## Cuando quieras actualizar SynthZ: no borres el proyecto

- **Actualiza el mismo proyecto.** Si usas GitHub, reemplaza los archivos y haz commit. Si arrastras la carpeta, súbela otra vez al mismo proyecto. Vercel hace un despliegue nuevo y **tu dominio y la base de datos siguen iguales**.
- **Si de todas formas borras el proyecto**, la base de datos queda guardada en **Storage** de tu cuenta de Vercel. En el proyecto nuevo vuelve a hacer **Storage → (tu base) → Connect to project** y todas las cuentas siguen ahí.
- **Si borras también la base de datos**, se pierden todas las cuentas, los chats en la nube y los equipos.

## Activar tus cuentas del equipo (sin tocar Vercel)

Rangos de SynthZ: **Prime** (dueño), **ZFlow** (administración, mismos poderes que Prime), **Symmetrix** (equipo y marketing) y **Synther** (todas las demás personas).

Los usuarios **sammuersynth** (Prime), **sammueladmin** (ZFlow) y **sammuerbusiness** (Symmetrix) están reservados: solo se crean con el **código de activación**, que vive únicamente en la variable `SYNTHZ_SETUP_CODE` de Vercel (el repo es público, así que en el código no hay nada del código: ni siquiera su huella). Usa uno largo y al azar, de 20 caracteres o más. Sin esa variable nadie puede reclamar esas cuentas.

1. Abre SynthFlow → **Entrar → Crear cuenta** y escribe el usuario (por ejemplo `sammuersynth`) y una contraseña.
2. Pulsa «Crear mi cuenta». Aparece el campo **Código de configuración**: pega tu código de activación.
3. Guarda el código de recuperación que te muestra.
4. Si alguna de esas cuentas ya existía, entra con ella y en **Tu cuenta → Activar mi rango** pega el código.

Para cambiar el código, cambia el valor de `SYNTHZ_SETUP_CODE` en Vercel y vuelve a desplegar.

## Prueba guiada (la paga SynthZ): pegar las llaves

Son 5 mensajes por persona, solo dentro de la guía, para aprender cómo funciona SynthFlow sin conectar nada.

1. Entra con **sammuersynth** o **sammueladmin**.
2. Abre **Tu cuenta → Prueba guiada → Pegar o cambiar llaves**.
3. Pega las llaves de **Groq**, **Mistral** y **Cloudflare**.
4. Pulsa **Guardar y probar**. Cada IA aparece con su punto: 🟢 funciona, 🟡 en pausa (cuota agotada por ahora) o 🔴 llave mala o sin llave.

Para Cloudflare no hace falta el «Account ID»: SynthZ lo busca solo con la llave.

**Cero cobros:**
- Solo se usan los planes gratis de cada proveedor, con topes diarios propios (Groq 200, Mistral 150 y Cloudflare 100 mensajes al día, y 300 en total).
- Cada persona tiene 5 mensajes, y cada conexión puede empezar 3 pruebas y mandar 12 mensajes al día.
- Si un proveedor responde «requiere pago» o «cuota agotada», queda en pausa y responde el siguiente.
- Si ninguno responde, ese mensaje no le cuenta a la persona.

**Dónde quedan las llaves:** cifradas en tu base de datos (Upstash). Nunca vuelven al navegador, solo se ven los últimos 4 caracteres, y no salen en los registros. Si en el futuro prefieres guardarlas en Vercel (`GROQ_API_KEY`, `MISTRAL_API_KEY`, `CLOUDFLARE_API_TOKEN`), esas tienen prioridad sobre las del panel.

## La clave de cifrado (`SYNTHZ_SECRET`): cómo guardarla y rotarla

Las llaves de OpenRouter que se guardan en una cuenta o en un equipo van cifradas con AES-256-GCM. La clave sale de `SYNTHZ_SECRET`. Si no existe, SynthZ crea una sola y la guarda en la base de datos; funciona, pero es menos seguro.

**Recomendado: ponerla ya.**

1. Genera una clave al azar de 48 caracteres. Por ejemplo, en una terminal: `openssl rand -base64 48`. También sirve un gestor de contraseñas.
2. Guárdala en Vercel como `SYNTHZ_SECRET`, solo en *Production*, y anótala en tu gestor de contraseñas. **No la pongas en el código ni la compartas.**
3. Haz **Redeploy**.

No se pierde nada: lo que estaba cifrado con la clave automática se sigue leyendo y se vuelve a cifrar con la nueva **la próxima vez que se usa**.

**Rotar la clave** (si sospechas que se filtró, o una vez al año):

1. Pon la clave actual en `SYNTHZ_SECRET_OLD`. Puedes poner varias separadas por coma.
2. Pon una clave nueva en `SYNTHZ_SECRET`.
3. Haz **Redeploy**.
4. Cada llave se re-cifra sola con la clave nueva cuando su dueño la usa. Deja `SYNTHZ_SECRET_OLD` unas semanas y después quítala.

**Lo que nunca debes hacer:** cambiar `SYNTHZ_SECRET` sin poner la anterior en `SYNTHZ_SECRET_OLD`. Nada se rompe, pero las llaves guardadas que aún no se re-cifraron dejan de abrirse y cada persona tendría que pegar la suya otra vez.

Formato interno: lo nuevo se guarda como `v2.<id de la clave>.<datos>`, y así SynthZ sabe con qué clave abrir cada cosa.

## Opcionales (no los necesitas para empezar)

| Variable | Para qué sirve |
|---|---|
| `SYNTHZ_SECRET` / `SYNTHZ_SECRET_OLD` | La clave de cifrado y las anteriores (ver la sección de arriba). |
| `SYNTHZ_SETUP_CODE` | El código de activación de las cuentas del equipo (20+ caracteres al azar). Sin ella no se pueden reclamar. |
| `SYNTHZ_RESERVED_EMAILS` | Correos de Google del equipo y su rango. Formato: `correo:owner,correo:admin,correo:staff`. Quien ya tiene su rango lo conserva aunque falte. |
| `SYNTHZ_USER_MB` | Espacio en la nube por persona, en MB. Por defecto 2: con 100 usuarios son ~200 MB, dentro de los 256 MB del plan gratis de Upstash. Cuando alguien lo llena, sus chats siguen en su dispositivo y se le avisa. |
| `SYNTHZ_RESERVED` | Para cambiar las cuentas reservadas. Formato: `usuario:rango,usuario:rango`. Rangos: owner (Prime), admin (ZFlow), staff (Symmetrix). |
| `GOOGLE_CLIENT_ID` | Agrega el botón «Continuar con Google» debajo del de usuario y contraseña. Necesita un ID de cliente de OAuth en Google Cloud con tu dominio en «Orígenes de JavaScript autorizados». Si cambias de dominio, hay que actualizar ese dato en Google. |

**No crees** las variables `GOOGLE_CERTS_URL` ni `OPENROUTER_URL`. Solo existen para las pruebas.

## Cómo funcionan las cuentas

- **Crear cuenta:**
  - El usuario tiene de 3 a 20 letras, números, puntos o guiones bajos.
  - La contraseña tiene mínimo 8 caracteres y se guarda protegida con scrypt. Ni tú ni SynthZ pueden leerla.
- **Código de recuperación:** al crear la cuenta, la persona recibe un código como `ABCD-EFGH-JKLM-NPQR`. Puede copiarlo o descargarlo, y no puede continuar hasta marcar que lo guardó. Es la única forma de recuperar la cuenta si olvida la contraseña.
- **¿Olvidaste tu contraseña?** La persona escribe su usuario, el código y una contraseña nueva. Recibe un código nuevo y se cierran sus sesiones en los demás dispositivos.
- **Seguridad** (dentro de «Tu cuenta»): sirve para cambiar la contraseña o generar un código de recuperación nuevo.
- **Protección contra quien intenta adivinar contraseñas:**
  - Máximo 10 intentos por usuario **desde la misma conexión** cada 10 minutos. Así nadie puede bloquearte desde otra.
  - Un tope amplio por usuario contra ataques repartidos.
  - Máximo 300 cuentas nuevas al día en total, para frenar a los bots.
- **Contraseñas:** se guardan con scrypt (N = 2^15). Las de antes se refuerzan solas cuando la persona vuelve a entrar.
- **Sesiones:**
  - Duran 30 días.
  - Se cierran al cambiar o recuperar la contraseña.
  - En **Tu cuenta → Cerrar sesión en todos mis dispositivos** se cierran todas.
- **Borrar la cuenta** pide la contraseña (o el correo, en cuentas de Google).

## Equipos: compartir OpenRouter

- Invitas a tus amigos con su **@usuario**. En la sección de equipos aparece el tuyo, para que lo compartas.
- La llave de OpenRouter del dueño se guarda **cifrada** en el servidor. Los miembros chatean a través de SynthZ y **nunca ven la llave**.
- El dueño puede:
  - limitar al equipo a modelos gratis,
  - poner un límite diario de SynXCoin's por persona,
  - ver cuánto usó hoy cada miembro,
  - sacar a alguien o dejar de compartir.
- **Puter no se comparte.** Sus términos lo prohíben, así que cada persona conecta su propio Puter.
- Los límites gratis de OpenRouter son **por llave**: unos 20 mensajes por minuto y 50 al día (1.000 al día si la cuenta compró al menos 10 créditos). Un equipo grande gasta rápido el cupo del dueño.

## Seguridad (`vercel.json`)

Ya vienen estas cabeceras:

- `nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy`
- `Permissions-Policy`
- La CSP (política de seguridad de contenido), más estricta y aún en modo **Report-Only**. Cada aviso llega a `/api/csp` y queda guardado, limpio y sin datos personales, para el panel de admin.

**Por qué no la activé del todo todavía:** Puter carga partes desde sus propios dominios y aquí no puedo probarlo con el Puter real. Si la activara y faltara un dominio, Puter dejaría de funcionar para todos.

**Plan:**
1. Deja la página funcionando unos días.
2. Cuando el panel de admin muestre **0 avisos**, cambia en `vercel.json` el nombre `Content-Security-Policy-Report-Only` por `Content-Security-Policy`.

## Límites del plan gratis (y cómo vigilarlos)

| Servicio | Límite gratis | Qué gasta SynthZ |
|---|---|---|
| Upstash Redis | 500.000 comandos al mes, 256 MB | ~12 comandos por mensaje y ~22 al abrir la página (solo con cuenta) |
| Vercel Hobby | 1.000.000 de llamadas a funciones al mes, 4 h de CPU activa | ~1 llamada por mensaje (solo con cuenta) |

- **Upstash se acaba primero:** alcanza para unos 50 usuarios al día que mandan 30 mensajes cada uno.
- **Quien usa SynthZ sin cuenta no gasta nada del servidor.**
- **Vigila el uso** en el panel de Upstash y en Vercel → Usage. Hobby solo guarda 1 hora de registros.
- **Uso comercial:** el plan Hobby es solo para uso personal y no comercial. Si vas a cobrar o tener muchos usuarios, pasa Upstash a un plan de pago y Vercel a Pro.

Fuentes: [Vercel Hobby](https://vercel.com/docs/plans/hobby) · [Límites de Vercel](https://vercel.com/docs/limits) · [Precios de Upstash Redis](https://upstash.com/pricing/redis) · [Límites de OpenRouter](https://openrouter.ai/docs/api-reference/limits) · [Puter: getMonthlyUsage](https://docs.puter.com/Auth/getMonthlyUsage/)
