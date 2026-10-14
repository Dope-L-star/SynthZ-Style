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

---

# v14 · Fase 1: arreglos visibles (sin cambios de datos)

| Cambio | Causa confirmada / qué se hizo | Prueba |
|---|---|---|
| «listo para escribir» era falso | Se mostraba siempre que no hubiera una respuesta en curso. Ahora el estado es real: sin internet, sin conectar (tócalo para conectar), cargando modelos, modelo no disponible o listo. | b1, m1 |
| «Para ti» | Estaba apagado por defecto y dependía de la encuesta. Ahora siempre está activo: pone arriba tus recomendadas con «Para ti», sin esconder las demás. Sin encuesta, invita a responderla. | v1 |
| Portada | «Sintonía con la IA. Tu futuro a la mano.» y se mantiene la frase que explica qué es SynthZ. | m2 |
| Guía | Las secciones se abren y cierran suave (alto, desenfoque y fundido). En modo rendimiento se abren al instante. | v1 |
| Manita en toda la web | Todo lo que se puede tocar muestra la manita sobre el vidrio. Los switches van sin vidrio en toda la web, para que se vea su animación. La copia nítida se rehace tras cada clic. | b1, c1, e9 |
| Marca SynthFlow | En SynthFlow, «SynthFlow» con destellos en «Flow» cada 2 s (apagados en modo rendimiento). Al señalarlo sale la flecha y se transforma en el logo de SynthZ con sus 3 círculos. Las ventanas de SynthFlow dicen SynthFlow. | b1, v1 |
| Celular y tablet | Inicio: menú ☰ (SynthFlow, Conectar, Consumo, Guía rápida, Configuración) y la cuenta siempre visible. SynthFlow: cabecera en 2 filas, «Limpiar» bajo la caja de texto en celular. Táctil: botones de 40 px o más. | m1, m2 |
| Color | El morado pasó a vino tinto (#c9566c). Brillos y selecciones en un tono cobrizo entre vino y oro, y degradados del logo y la Z que terminan en dorado. La opción «violeta» del perfil sigue siendo violeta porque la eliges tú. | capturas |

Todas las pruebas anteriores pasan (e2e, e2e2, e3, e6, e8, e9, p3, g1, c1, f1, u1, u3, a1).

---

# v14 · Fase 2: seguridad y datos

| Qué | Causa confirmada / riesgo | Qué se hizo | Prueba |
|---|---|---|---|
| Botones invisibles bajo «Entrar» | El menú del celular (Fase 1) tenía `hidden`, pero su CSS `display:grid` lo anulaba: quedaba transparente y se podía tocar | `.navdrop[hidden]{display:none}` y sin clics mientras está cerrado | n1 |
| Una cuenta podía llenar la base | 400 chats × 400 KB = 160 MB por usuario, con 256 MB en total | Tope por usuario: 2 MB (`SYNTHZ_USER_MB`), medido en bytes reales y con contador propio. Al llenarse: aviso claro, sin reintentos sin fin y los chats siguen en el dispositivo | test3, f2 |
| Bloqueo de cuentas ajenas | El límite de inicio de sesión era solo por usuario | Límite por usuario + IP, más un tope amplio por usuario (Vercel reescribe la IP, así que no se puede falsificar) | test3 |
| Clave de cifrado sin rotación | Una sola clave y, sin `SYNTHZ_SECRET`, guardada en la misma base | Claves con versión (`v2.<id>`), `SYNTHZ_SECRET_OLD` para leer lo anterior, re-cifrado al usar cada llave y la clave automática de antes siempre legible | rot (7 casos) |
| Contraseñas | scrypt N=2^14 | s2 = N=2^15; las s1 se refuerzan al entrar | test3 |
| Cambios de equipo perdidos | Leer y escribir el mismo dato sin candado | Candado corto por equipo: 12 invitaciones simultáneas quedan todas | test3 |
| Cuentas del equipo | Cualquiera podía registrar los usuarios del dueño | sammuersynth (Dueño), sammueladmin (Admin) y sammuerbusiness (Staff) reservados con `SYNTHZ_SETUP_CODE`, más «Activar mi rango» para cuentas existentes | test3, f2 |
| Sesiones | No había forma de cerrarlas todas | «Cerrar sesión en todos mis dispositivos» | test3, f2 |
| Borrar la cuenta | Bastaba la sesión | Pide la contraseña (o el correo en Google). Además se corrigió un texto que decía que lo local «se queda» | test3, f2, test |
| Bots | Sin tope global | Máximo 300 cuentas nuevas al día | — |
| Cuentas suspendidas | — | `blocked` ya funciona en el servidor; se usará desde el panel de admin | test3 |
| CSP | Sin forma de saber si activarla rompe algo | Política más estricta (imágenes y conexiones solo a dominios conocidos) y avisos guardados en `/api/csp` para el panel. **Sigue en Report-Only**: falta comprobar Puter real | test3 |
| Registros | El error completo iba a `console.error` | Solo la ruta y el mensaje, sin cuerpos ni secretos | — |

**Costo medido después:** cada mensaje gasta ~12 comandos de Redis (antes 10; los 2 nuevos llevan la cuenta del espacio en la nube) y abrir la página ~10 en `/api/me`. Iniciar sesión tarda ~116 ms de CPU (scrypt más fuerte, a propósito).

**Pruebas:**
- Servidor: test (31), test2 (38), test3 (21) y rot (7), todo OK.
- Navegador: f2 y la regresión completa (e2e, e2e2, e3, e6, e7, e8, e9, p3, g1, c1, f1, u1, u2, u3, a1, b1, v1), todo sin errores.

---

# v14 · Fase 3: prueba guiada que paga SynthZ

- **Servidor (`api/trial.js`):**
  - 5 mensajes por persona, con topes diarios por conexión, por proveedor y global.
  - Respaldo limitado: si un proveedor falla, se intenta con otro, máximo 2 intentos.
  - Errores clasificados en español.
  - Si nada responde, el mensaje no cuenta.
  - Instrucción del sistema propia y respuestas cortas (máx. 450 tokens).
  - Las llaves nunca salen del servidor.
- **Llaves:** Prime y ZFlow las pegan desde su cuenta, sin tocar Vercel, y quedan cifradas. Si existen variables en Vercel, mandan esas. Symmetrix solo ve el estado.
- **Estado de las IA de la prueba:** un punto que late (verde, ámbar o rojo), el modelo detectado, la llave enmascarada y el uso de hoy.
- **SynthFlow:**
  - Modo «Prueba guiada» con una barra que muestra los mensajes que quedan y «la paga SynthZ».
  - Cada respuesta dice «vía Groq/Mistral/Cloudflare».
  - No suma a los SynXCoin's personales.
  - Al acabarse, ofrece conectar Puter u OpenRouter.
  - Por ahora se abre con `?prueba=1`; la cinemática de la Fase 4 la abrirá sola.
- **Activación sin Vercel:** el código de activación del dueño está en el servidor solo como huella sha-256. Se puede cambiar con `SYNTHZ_SETUP_CODE`.
- **Rangos:** Prime, ZFlow, Symmetrix y Synther, con insignias de color.
- **Corrección encontrada en las pruebas:** los errores 5xx pensados («la prueba no está activada», «las IA no responden») se mostraban como «Algo falló en el servidor». Ahora se muestran tal cual.

**Pruebas:** tr1 (16, servidor) y tr2 (navegador) OK. Regresión completa OK: test 31, test2 38, test3 22, rot 7 y 22 suites del navegador.

**Nota honesta:** las llaves reales de Groq, Mistral y Cloudflare no se pudieron probar desde aquí, porque esta máquina no tiene salida a esos servicios. Se prueban desde tu SynthZ con «Guardar y probar».

# v15 · Pantalla nueva de SynthFlow (paso 1 del orden aprobado)

- **Barrita lateral (computador):**
  - Íconos: Nuevo chat, Buscar en mis chats, Mis chats y Favoritos. Abajo van Ajustes, tu foto y «Guía» (chiquito, con su nombre debajo).
  - Se despliega con animación: los nombres entran uno por uno y el logo SynthFlow se desliza.
  - Desplegada, queda encima de tus chats con efecto cristal, así se ve dónde están. Los SynXCoin's pasan a la barrita.
  - Se recuerda abierta o cerrada.
- **Tus chats:** panel con «Chats / Favoritos» y buscador. Se puede ocultar.
- **Arriba:** la IA que usas (con «Agregar otra IA»), el estado, «Guía» y «⋯».
  - Quién paga se movió abajo, junto a la caja, como pediste. En el celular sigue arriba (regla 5).
  - En el menú «⋯» quedaron:
    - Borrar este chat, que pide confirmación.
    - Copiar la conversación.
    - Exportar como .md.
    - Tu ranking.
- **Saludo:**
  - «¿Qué quieres FlowIA'r hoy?» sale la primera vez y otra vez tras 12 horas.
  - En cada chat nuevo sale otra frase: hay 10, entre ellas las tuyas y 2 «normales».
- **Temas:** 28 en total, con «+18 temas más». Al tocar uno salen 3 IA recomendadas con el porqué, quién paga, «Usar esta» y casillas para comparar.
- **Comparar:**
  - Hasta 4 IA; de OpenRouter máximo 2, y se explica el porqué.
  - Con el «+» se suma otra IA incluso después de enviar: responde la misma pregunta sin reenviarla.
  - No hay cuadros vacíos. Mientras una IA piensa sale un aviso pequeño, «… está pensando», y su respuesta entra cuando llega, en orden de llegada, con animación.
  - La primera lleva «⚡ llegó primero».
  - «Esta tiene más Flow» trae una carita buena distinta en cada respuesta.
  - En Comparar las respuestas son más cortas y sin historial, para ahorrar, y hay caché gratis.
- **Clip:** ya no abre directo el buscador de archivos. Abre un menú con «Archivo o PDF» e «Imagen».
- **Favoritos:** la estrella vuela a la colección.
- **Celular (estilo C):** pestañas abajo (Chats, IA, Coins, Ajustes y Tú con tu foto). Arriba van la IA, el «+» y quién paga.
- **Bienvenida tras 12 horas:**
  - Opciones «Ya tengo el Flow» (carita con gafas) o «Soy nuevo, quiero aprender».
  - Con sesión abierta pregunta «¿Sigues siendo tú?».
  - Para probarla a mano: `?bienvenida=1`.
- **Página principal:** misma barrita. Al abrirla, las palabras del menú de arriba vuelan con cristal y caen en la barrita.
- **SynthonIA:** ya existe su carita, con 13 expresiones más «flow» con gafas. Se usa en la bienvenida y en «Esta tiene más Flow». La asistente completa es el paso 3.
- **Prueba de llaves de la prueba guiada:**
  - Ahora manda un mensaje real mínimo (máx. 4 tokens) y dice por cada IA: ✅ funciona · 🔒 no autorizada · 💳 pide un plan · ⏳ límite.
  - Nunca activa pagos.
- **Arreglos encontrados al probar:**
  - Enviar mientras una IA seguía respondiendo no hacía nada y no avisaba. Ahora avisa «Espera a que terminen…».
  - La pestaña «Tú» del celular mostraba «?»; ahora muestra el ícono de persona.

# v16 · Guía Asistida, manita de SynthonIA, portal y sonidos (paso 2)

- **Botón «Guía»:** está en SynthFlow (arriba y en la barrita) y en la página principal (botón, barrita y menú del celular). Pregunta cómo aprender:
  - **Asistida:** SynthonIA lo muestra con su manita. Desde la página principal te lleva a SynthFlow por el portal.
  - **Lectura:** la guía corta de siempre, actualizada (varias IA, quién paga, clip, sonidos).
- **La primera vez** que alguien entra a SynthFlow, o si toca «Soy nuevo, quiero aprender» en la bienvenida de 12 horas, se ofrece la misma elección.
- **Guía Asistida (camino B, 6 pasos con barra de progreso y «Saltar guía»):**
  1. Tus temas (hasta 3 de los 28).
  2. IA recomendadas para cada tema, con quién paga.
  3. Recorrido por la pantalla: la manita señala, con un aro de luz:
     - la IA que usas
     - el «+»
     - quién paga
     - tus chats
     - los temas
     - la Guía
  4. Comparar 2 IA: ejemplo animado que no gasta nada. Llegan en orden, sale «⚡ llegó primero» y la manita toca «Esta tiene más Flow».
  5. Prueba real con los 5 mensajes que paga SynthZ:
     - SynthonIA escribe el ejemplo letra por letra, con sonido de teclas, y tú lo envías.
     - Si la prueba falla, lo dice y no gasta.
  6. Conectar, solo dentro de SynthFlow: abre la ventana y señala «Conectar con Puter» o la llave de OpenRouter.
- **La manita robótica:** dorada, con articulaciones. Tiene sus propias formas de cursor:
  - flecha
  - mano que señala, con el índice
  - mano cerrada
  - cursor de texto

  Se mueve en curvas suaves y se inclina con la velocidad. Al hacer clic se aprieta y sale una onda. Lleva la etiqueta «SynthonIA» y habla en una burbuja con su carita.
- **Portal a SynthFlow (nuevo):**
  1. Aparece «SynthFlow» y Flow destella con chispas.
  2. «Synth» se desliza detrás de Flow.
  3. La cámara entra en la «o» y dentro crece una interfaz.
  4. Al llegar, la «o» se abre sobre el chat y la pantalla ondula como agua.
  - En modo Rendimiento es un fundido corto.
- **Sonidos (Web Audio, sin archivos):** se apagan en Ajustes → «Sonidos».
  - Teclas mecánicas «brown» en la intro («Synth») y cuando SynthonIA escribe.
  - Destello agudo de Flow.
  - Papel que se desliza.
  - «Woauu» al entrar en la «o», con golpe al final.
  - «Bip» de SynthonIA según su ánimo.
  - Clic de la manita.
  - Arpegio al terminar la guía.
  - Sonido de «expansión», listo para los avisos del panel.
  - **Nota honesta:** los navegadores no dejan sonar nada hasta el primer clic o tecla en cada página. Por eso la intro suena solo si ya tocaste algo; el portal y la guía sí suenan, porque empiezan con un clic.
- **Prueba de llaves:** si no hay llaves, la ficha de prueba ni se entrega y la guía lo explica.
- **Corregido al probar:**
  - La mano que señala se veía como un dedo del medio: se redibujó con el índice a la izquierda.
  - Si un paso no encontraba qué señalar, pasaba sin esperar el «Siguiente».
  - El portal acercaba la cámara a la «w» en vez de la «o», porque medía antes de que Flow terminara de moverse.
  - Una animación anulaba el zoom.
  - La «o» salía invisible y al llegar había un destello lila.
  - Al crear el portal se habían cambiado por error dos clases del perfil; quedaron restauradas.

# v1.0B · Beta: portal nuevo, inicio «A», primera vez «B», bloqueo, Drive

**Estado honesto:** todo esto está implementado y probado en local, con Puter, OpenRouter, Google y los proveedores de la prueba simulados. En producción falta probarlo con tus llaves reales y, para Drive, activar la «Google Drive API» (ver abajo).

- **Barrita lateral (inicio y chat):** la etiqueta que aparece al pasar el mouse salía vacía; ya copia bien el texto. En la página principal la barrita siempre empieza cerrada; solo el chat recuerda cómo la dejaste. «Mis chats» va primero.
- **Animaciones de los logos:** ya no se quitan nunca, ni en modo Rendimiento. La única que se puede apagar es la del péndulo en el icono de la pestaña. SynthFlow tiene su propio icono «Flow» en la pestaña.
- **Portal a SynthFlow (nuevo, más lento):**
  1. «SynthZ» viaja suave desde su esquina al centro mientras crece.
  2. La Z se transforma en una Z cursiva, como si se escribiera.
  3. Aparece «Flow» con su línea blanca de escritura (sin pasarse del renglón).
  4. Una barrita vertical «se come» Synth.
  5. La cámara entra en la «o», que queda vacía.
  - Al volver a SynthZ se ve la misma animación al revés.
  - También se ve en modo Rendimiento. Solo se acorta si el sistema pide «reducir movimiento».
- **Sonidos:** se quitaron los de los logos y las entradas. Quedan solo los de SynthonIA.
- **Elegir IA («¿Con quién fluyes hoy?»):**
  - Se abre ampliándose desde donde la tocaste.
  - Tiene pestañas Para ti / Todas / Mis favoritas, temas y buscador.
  - Se puede hacer scroll y marcar hasta 4 IA con «Comparar».
  - Cada IA vuela con una animación hasta la barra de arriba.
  - Aviso: «cada IA responde por separado y gasta sus propios SynXCoin's: es comparar, no unir».
- **Inicio limpio (como la «A»):** «¿Qué quieres FlowIA'r hoy?», la caja de escribir al centro con la IA y «Comparar con otra IA» dentro, temas que se abren suave («Más temas») y ejemplos. Se quitó el letrero «conectado / sin conectar».
- **Primera vez (como la «B»):** 1 qué quieres hacer → 2 elige tu IA → 3 chatea. «Siguiente» sube y «Atrás» baja.
- **«Atrás» al revés en todo:** encuesta, iniciar sesión, recorrido, camino B y la Guía Asistida, que ahora tiene «← Cambiar temas» y recuerda los que elegiste.
- **Carita de SynthonIA más grande** en sus ventanas y burbujas (no en su botón).
- **Bloqueo sin IA:** si no hay Puter, OpenRouter ni prueba activa, no se puede escribir ni se muestran IA.
  - Aparece «Primero, conecta una IA», con «Conectar Puter · gratis», «Usar mi llave» y «Ver la Guía».
  - Si te ve perdido (muchos clics al azar o el mouse por todas partes), sale SynthonIA preocupada, con una gotita, y una burbuja sobre su cabeza.
  - Con su manita se señala a ella, luego la Guía y luego el botón para conectar.
  - Después ofrece 4 preguntas con respuesta guardada, que no gastan nada, y dos botones.
  - Sale como mucho 3 veces y nunca encima de otra ventana.
- **Google Drive (opcional), en «⋯ › Google Drive» y como paso 7 de la Guía:**
  - Guarda una copia de tus chats en una carpeta oculta de SynthFlow en tu Drive. No puede ver tus otros archivos.
  - Al traerla, mezcla y nunca borra. Las llaves no van en la copia.
  - El permiso dura una hora y nunca se guarda ni se envía a SynthZ.
  - **Para activarlo (una sola vez, Prime):**
    1. En Google Cloud, en el proyecto de «Entrar con Google», activa la «Google Drive API».
    2. Agrega el permiso `drive.appdata` en la pantalla de consentimiento.
    3. Pega el «ID de cliente» en tu panel (Tu cuenta › Prueba guiada › Google Drive). Si no pegas nada, usa el de «Entrar con Google».
    - No hay cobros.
- **Corregido al probar:**
  - Algunos botones ocultos se veían igual («Comparar estas 2» y el «Siguiente» de la guía).
  - Los avisos quedaban detrás de las ventanas y en celular se veían como una bolita.
  - El portal dejaba ver un aviso encima.
  - En la Guía, tocar «Siguiente» muy rápido no hacía nada.
  - En el camino B, la pantalla que se iba saltaba al borde.
  - Los paneles de la Guía perdían su estilo mientras se cerraban.
- **Pruebas:**
  - 27 suites del navegador, la Guía completa (computador y celular) y las pruebas nuevas: bloqueo, Drive con Google simulado, «Atrás» de la Guía, elegir IA, inicio y camino B en celular, tablet y computador.
  - Servidor: 31 + 38 + 22 + 7 pruebas, y 26 de la prueba guiada, con 7 nuevas para Drive.
