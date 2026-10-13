# SynthZ v13 · Informe del plan maestro

Todo se probó en un servidor local que ejecuta las funciones reales de `api/`, con simulaciones de Upstash, Google y OpenRouter, y con el navegador Chromium. **No se probó contra tu Vercel ni contra Upstash, Puter u OpenRouter reales.** Los números de carga son de esta máquina, no de producción.

---

## 1. Diagnóstico inicial

Partí de la versión v12.2: páginas `index.html` y `chat.html`, código compartido `core.js` y `core.css`, y funciones `api/` con cuentas, equipos y proxy de OpenRouter. Antes de cambiar nada escribí pruebas para comprobar cada sospecha (archivos `u1`, `u2`, `a1` y `c1` en la carpeta de pruebas).

| Sospecha | ¿Se producía? | Prueba |
|---|---|---|
| Dos pestañas abiertas se pisan el consumo | **Sí**: 26 + 26 quedaba en 26 | u1 A |
| Dos dispositivos con la misma cuenta no suman | **Sí**: 26 + 26 quedaba en 26 | u2 B |
| «Reiniciar contadores» se deshace al sincronizar | **Sí** (otro dispositivo lo devolvía) | u2 C |
| Los SynXCoin's estimados se guardan como exactos | **Sí** | u1 D |
| Una misma petición se cuenta dos veces | No había caso real; se agregó una protección igual | u2 F |
| Ana cierra sesión, Beto entra en el mismo navegador y recibe los datos de Ana | **Sí, grave**: chats, favoritos y consumo de Ana se subían a la cuenta de Beto | a1 |
| Los switches de Configuración no se animan bien | **Sí** | c1 |
| La respuesta de OpenRouter se marcaba como cortada (v12, ya corregido antes) | Sí | e7 |

## 2. Causa confirmada de cada bug corregido

1. **Pestañas que se pisan.**
   - **Causa:** cada pestaña guardaba su copia completa del estado en `localStorage`, así que la última en guardar borraba lo que había sumado la otra.
   - **Arreglo:** el consumo vive aparte (`synthz:ledger`). Cada suma lee lo guardado, suma y escribe; nunca se baja un contador. Las otras pestañas se enteran con el evento `storage`.
2. **Dispositivos que no suman.**
   - **Causa doble:** el navegador juntaba con `Math.max` en vez de sumar, y el servidor guardaba las preferencias como un solo bloque, así que el último en sincronizar borraba la parte del otro.
   - **Arreglo:** registro por dispositivo. Cada navegador sube **solo su fila**, el servidor la junta con la que ya tenía (tomando el mayor valor, porque una fila solo crece) y el total es la suma de todas las filas. Se guarda en `lg:<cuenta>` de Redis.
3. **Reiniciar que vuelve atrás.**
   - **Causa:** no existía la idea de «reinicio» compartida entre dispositivos.
   - **Arreglo:** una «época». Reiniciar crea una época nueva, y las filas de épocas anteriores se ignoran en el servidor y en todos los dispositivos.
4. **Estimados guardados como exactos.**
   - **Causa:** el contador guardaba solo números, sin decir de dónde salían.
   - **Arreglo:** cada respuesta registra cuánto fue estimado (`e`, `de`) y la interfaz lo muestra aparte.
5. **Datos de una cuenta en otra.**
   - **Causa:** al cerrar sesión los datos quedaban en el navegador sin dueño, y al entrar otra cuenta se mezclaban y se subían.
   - **Arreglo:**
     - Los datos locales tienen dueño (`state.owner`).
     - Al cerrar sesión primero se guarda en la nube y después se borra el dispositivo. Si no se pudo guardar, se pregunta antes de cerrar.
     - Si entra otra cuenta y quedaron datos ajenos, se borran antes de sincronizar.
     - Las demás pestañas se recargan al cambiar la sesión.
6. **Switches de Configuración.**
   - **Causa:** el cursor de SynthZ pone encima del botón una copia nítida, hecha al pasar el mouse. Al hacer clic, el switch real se animaba debajo, pero la copia seguía mostrando el estado anterior.
   - **Arreglo, solo en el menú de configuración:**
     - Los switches ya no llevan vidrio ni copia.
     - Las opciones que se pueden elegir muestran una manita.
     - En los botones que sí llevan vidrio, la copia se rehace después del clic.
     - Al rehacerla había otro problema: se copiaba el color a mitad de su transición y el texto salía invisible. Eso también quedó corregido.

## 3. Archivos modificados

| Archivo | Qué cambió |
|---|---|
| `core.js` | Registro de SynXCoin's por dispositivo; saldo real de Puter y OpenRouter; desglose confirmado/estimado; separación de datos por cuenta; cierre de sesión seguro; sincronización en una sola petición; mensajes de error sin datos técnicos; guía rápida; manita del cursor en Configuración; switches accesibles (`role="switch"`) |
| `core.css` | Estilos del desglose y del saldo disponible, guía rápida, manita del cursor |
| `chat.html` | Nombre SynthFlow; ejemplos que rellenan sin enviar; modo principiante con intenciones; panel de SynXCoin's con lo disponible; errores con «Reintentar» y aviso de consumo; botón «?»; avisos en «Otra vez» y «Continuar» |
| `index.html` | Nueva frase de valor, «Empezar a chatear», tres casos de uso, SynthFlow en los textos, consumo con desglose y saldo, botón «?», pie de página corregido |
| `api/_lib.js` | Registro por dispositivo (`getLedger`, `putLedger`); guardado de chats compartido (`saveChats`) |
| `api/me.js` | Recibe y devuelve el registro; acepta los chats en la misma petición; borra el registro al eliminar la cuenta |
| `api/chats.js` | Usa `saveChats` (mismo comportamiento) |
| `GUIA.md` | Límites reales y monitoreo |

## 4. Cambios por prioridad

**P0: estabilidad**
- SynXCoin's coherentes entre pestañas, dispositivos y reinicios. Una misma petición nunca cuenta dos veces: cada respuesta lleva un identificador único.
- La interfaz separa siete cosas:
  - **Disponible:** lo que dice el proveedor. Para Puter es el porcentaje del crédito del mes (`getMonthlyUsage`). Para OpenRouter son los mensajes gratis de hoy y el crédito de la llave (`/api/v1/key`).
  - **Confirmados:** el número que reportó el proveedor.
  - **≈ Estimados:** los que calcula SynthZ cuando el proveedor no da el número.
  - **Gratis:** las respuestas que salen de la caché.
  - **Límite personal:** uno que eliges tú.
  - **Límite del equipo:** lo cuenta el servidor.
  - **Errores de sincronización:** se muestran, no se ocultan.
- Cuentas: datos separados por cuenta, cierre de sesión seguro y sesión cerrada en todas las pestañas.

**P0: experiencia**
- Inicio:
  - Frase «Tu espacio para explorar la IA. Pregunta, crea, programa y compara modelos de inteligencia artificial desde un solo lugar».
  - Botón principal «Empezar a chatear».
  - Tres casos de uso que abren SynthFlow con un borrador escrito pero sin enviar.
- «Chat» pasa a llamarse **SynthFlow** en los textos visibles. Los nombres internos no cambiaron.
- Cuatro ejemplos que rellenan la caja sin enviar. «Resume este documento» además resalta el clip.
- Modo principiante con cuatro intenciones (Rápido, Programar, Estudiar, Tareas complejas):
  - Recomienda solo entre modelos conectados y gratis.
  - Cada dato dice de dónde sale: «según catálogo» o «según su nombre o descripción». No hay medición de velocidad y así lo dice.
  - Muestra límites y requisitos, y permite «Cambiar modelo».
  - Si no hay datos suficientes, lo dice.
  - Si elegiste un modelo a mano, no lo cambia.

**P1: interfaz**
- Configuración: manita y switches sin vidrio, solo en ese menú. Los demás botones de la web siguen igual.
- Errores:
  - Mensajes entendibles, sin texto técnico del proveedor.
  - Aviso de que el intento fallido no sumó SynXCoin's.
  - Botón «Reintentar» que avisa que cuenta como un mensaje nuevo.
  - PDF ilegible explicado.
  - «Otra vez» y «Continuar» explican que consumen.
- Guía rápida con el botón «?» en las dos páginas:
  - Es un panel lateral que no tapa la caja de texto.
  - Se cierra con Esc.
  - No aparece sola.

**P2: crecimiento**
- Cada mensaje hace ahora una sola sincronización de unos 10 comandos de Redis. Antes eran unas 2 sincronizaciones de 15 comandos cada una.
- Se espera 6 s para agrupar el mensaje y la respuesta en una sola subida, y se sube al salir de la pestaña.

## 5. Pruebas ejecutadas y resultados reales

| Prueba | Qué cubre | Resultado |
|---|---|---|
| `be/test.mjs` | Servidor con Google: tokens falsos, vencidos o de otra app, cifrado, equipos, proxy, límites | 30/30 OK |
| `be/test2.mjs` | Servidor sin Google: registro, contraseñas, recuperación, cambio de contraseña, fuerza bruta, equipos por @usuario, registro por dispositivo, épocas, valores raros, aislamiento entre cuentas | 38/38 OK |
| `be/load.mjs` | Costo por acción y carga local: 100 usuarios × 10 sincronizaciones simultáneas | 1.000 peticiones, 0 fallidas, contador exacto, límite activo |
| `u1.js`, `u2.js`, `u3.js` | SynXCoin's: pestañas, dispositivos, reinicio, 10 sincronizaciones sin duplicar, misma petición dos veces, paneles | Todo como se esperaba |
| `a1.js` | Ana y Beto en el mismo navegador | Beto no recibe nada de Ana; Ana recupera lo suyo |
| `s1.js` | Peticiones reales por mensaje | 1 por mensaje |
| `e2e`, `e2e2`, `e3`, `e6` | Regresión: streaming, hilos, archivos de texto, comparar, batalla ciega, límite diario, intro | Sin errores |
| `e7.js` / `e8.js` | Cuentas con Google / con usuario y contraseña, perfil, equipos, recuperación | Sin errores |
| `e9.js`, `c1.js` | Cursor, logo, menú de configuración | Sin errores |
| `p3.js`, `g1.js`, `f1.js` | Inicio, SynthFlow, ejemplos, intenciones, errores y reintento, guía, favoritos, lista vacía, imagen a un modelo sin visión, preferencias | Sin errores |

## 6. Problemas pendientes

- **No probado con servicios reales.** Falta probarlo en tu Vercel con Upstash, Puter y OpenRouter reales.
- **PDF sin probar aquí.** La lectura de PDF no se pudo probar porque pdf.js viene de un CDN que esta máquina no alcanza.
- **El consumo personal lo calcula el navegador.** Puter y OpenRouter se llaman directo desde el navegador (así las llaves no pasan por SynthZ), de modo que el servidor no ve esas respuestas y no puede verificar el consumo personal. Si alguien edita su contador, solo cambia lo que ve él. **Lo que sí controla el servidor** es el límite diario de los equipos; los límites de cada proveedor los aplica el propio proveedor.
- **Favoritos y lista de chats entre dispositivos se unen.** Un favorito quitado en un dispositivo puede volver desde otro que todavía lo tenía. Es comportamiento de antes, no lo cambié.
- **Switches fuera de Configuración.** El mismo problema de la copia encima existe en los switches de la cuenta, de los equipos y del modo ahorro. No los toqué porque pediste limitarlo al menú de configuración.
- **Alcance del modo principiante.** Sin mediciones de velocidad ni puntuaciones reales, solo se basa en el catálogo y en el nombre del modelo, y así lo dice.
- **Otros pendientes:**
  - Las ventanas no usan el elemento `<dialog>`.
  - La CSP sigue en modo *Report-Only*.
  - Falta saber qué querías con «el clip del chat».

## 7. Configuración externa necesaria

Es la misma de v12.1, sin variables nuevas:

1. En Vercel, conecta **Upstash for Redis** (plan Free) desde Storage.
2. Haz **Redeploy**.
3. Comprueba que `/api/config` responda `"ok":true`.

Opcionales:
- `SYNTHZ_SECRET`: más seguro, pero ponlo antes de que haya llaves guardadas.
- `GOOGLE_CLIENT_ID`: para el botón de Google.

## 8. Limitaciones de escalabilidad conocidas

Los límites vienen de la documentación oficial (fuentes en GUIA.md). Los costos los medí con `be/load.mjs`.

| Recurso | Límite gratis | Costo medido en SynthZ | Alcanza para |
|---|---|---|---|
| Upstash: comandos | 500.000 al mes (≈ 16.600 al día) | Abrir la página: ~19 · cada mensaje: ~10 | **≈ 50 usuarios al día que mandan 30 mensajes**, o ≈ 240 que mandan 5. **Es el primer límite que se alcanza.** |
| Upstash: datos | 256 MB | Hasta 400 KB por chat y 400 chats por cuenta | Pocos cientos de cuentas muy activas |
| Vercel Hobby: llamadas a funciones | 1.000.000 al mes | ~1 por mensaje + 3 al abrir | ≈ 1.000 usuarios al día que mandan 30 mensajes |
| Vercel Hobby: CPU activa | 4 horas al mes | Iniciar sesión (scrypt) ≈ 63 ms; sincronizar ≈ 10 ms | Suficiente para el tráfico anterior |
| OpenRouter gratis | 20 por minuto y 50 al día **por llave** | Un equipo usa la llave del dueño | Un equipo de 5 personas gasta las 50 diarias muy rápido |
| Puter | Lo paga cada usuario con su crédito | Sin costo para SynthZ | No limita a SynthZ |

Otras notas:
- **Quien usa SynthZ sin cuenta no gasta nada del servidor**: habla directo con Puter y OpenRouter.
- **Hobby es solo para uso personal y no comercial.** Si te pasas de un límite, ese recurso se pausa hasta 30 días.
- **Monitoreo:** Hobby guarda solo 1 hora de registros. Revisa el uso en el panel de Upstash y en Vercel → Usage.
- **Carga local:** 1.000 sincronizaciones simultáneas, 0 errores, p50 ≈ 0,3 s y p95 ≈ 1,2 s en un solo proceso de Node. Vercel reparte la carga en varias instancias, pero **esto no demuestra cómo se comporta en producción**.
- **Antes de crecer**, en este orden:
  1. Pasar Upstash a un plan de pago.
  2. Pasar Vercel a Pro si hay uso comercial.
  3. Agregar alertas de uso.
  4. Si hace falta, sincronizar con menos frecuencia todavía.
