# SynthZ v13 · Cómo dejar las cuentas funcionando en Vercel

Sube **la carpeta completa** a tu repositorio, no solo los `.html`:

```
index.html  chat.html  core.js  core.css  icon.svg  manifest.webmanifest
package.json  vercel.json  api/   (_lib.js, auth.js, chat.js, chats.js, config.js, me.js, teams.js)
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

## Opcionales (no los necesitas para empezar)

| Variable | Para qué sirve |
|---|---|
| `SYNTHZ_SECRET` | Una clave larga al azar, de 32 caracteres o más. Si no la pones, SynthZ crea una sola y la guarda en la base de datos. Ponerla en Vercel es un poco más seguro: si alguien llegara a ver tu base de datos, no podría descifrar las llaves de OpenRouter guardadas. **Ojo:** si la agregas o la cambias después, las llaves ya guardadas en cuentas y equipos dejan de abrirse y hay que volver a pegarlas. |
| `GOOGLE_CLIENT_ID` | Agrega el botón «Continuar con Google» debajo del de usuario y contraseña. Necesita un ID de cliente de OAuth en Google Cloud con tu dominio en «Orígenes de JavaScript autorizados». Si cambias de dominio, hay que actualizar ese dato en Google. |

**No crees** las variables `GOOGLE_CERTS_URL` ni `OPENROUTER_URL`. Solo existen para las pruebas.

## Cómo funcionan las cuentas

- **Crear cuenta:**
  - El usuario tiene de 3 a 20 letras, números, puntos o guiones bajos.
  - La contraseña tiene mínimo 8 caracteres y se guarda protegida con scrypt. Ni tú ni SynthZ pueden leerla.
- **Código de recuperación:** al crear la cuenta, la persona recibe un código como `ABCD-EFGH-JKLM-NPQR`. Puede copiarlo o descargarlo, y no puede continuar hasta marcar que lo guardó. Es la única forma de recuperar la cuenta si olvida la contraseña.
- **¿Olvidaste tu contraseña?** La persona escribe su usuario, el código y una contraseña nueva. Recibe un código nuevo y se cierran sus sesiones en los demás dispositivos.
- **Seguridad** (dentro de «Tu cuenta»): sirve para cambiar la contraseña o generar un código de recuperación nuevo.
- **Protección contra quien intenta adivinar contraseñas:** máximo 10 intentos por usuario cada 10 minutos.

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
- La CSP (política de seguridad de contenido) en modo **Report-Only**, que solo avisa en la consola y no bloquea nada.

Para activarla de verdad: navega SynthZ unos días con la consola abierta (F12). Si no aparecen avisos `[Report Only]`, cambia en `vercel.json` el nombre `Content-Security-Policy-Report-Only` por `Content-Security-Policy`.

## Límites del plan gratis (y cómo vigilarlos)

| Servicio | Límite gratis | Qué gasta SynthZ |
|---|---|---|
| Upstash Redis | 500.000 comandos al mes, 256 MB | ~10 comandos por mensaje y ~19 al abrir la página (solo con cuenta) |
| Vercel Hobby | 1.000.000 de llamadas a funciones al mes, 4 h de CPU activa | ~1 llamada por mensaje (solo con cuenta) |

- **Upstash se acaba primero:** alcanza para unos 50 usuarios al día que mandan 30 mensajes cada uno.
- **Quien usa SynthZ sin cuenta no gasta nada del servidor.**
- **Vigila el uso** en el panel de Upstash y en Vercel → Usage. Hobby solo guarda 1 hora de registros.
- **Uso comercial:** el plan Hobby es solo para uso personal y no comercial. Si vas a cobrar o tener muchos usuarios, pasa Upstash a un plan de pago y Vercel a Pro.

Fuentes: [Vercel Hobby](https://vercel.com/docs/plans/hobby) · [Límites de Vercel](https://vercel.com/docs/limits) · [Precios de Upstash Redis](https://upstash.com/pricing/redis) · [Límites de OpenRouter](https://openrouter.ai/docs/api-reference/limits) · [Puter: getMonthlyUsage](https://docs.puter.com/Auth/getMonthlyUsage/)
