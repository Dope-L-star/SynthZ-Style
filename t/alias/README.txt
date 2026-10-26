# Hecho por: PROBADOR

Pruebas de A.L.I.A.S. (plan gratis). No piden llaves ni tocan el build.
Se corren desde la raíz del repo, con Node 20 o más:

  node t/alias/contrato.mjs
  node t/alias/ui.mjs

ui.mjs necesita el paquete playwright y Chromium. Si faltan, esa suite
avisa FALLO y no inventa un resultado verde.
Cada prueba imprime OK o FALLO. El código de salida es 1 si alguna falla.
Al final cada archivo imprime la tabla de qué cubre.

contrato.mjs llama al api/alias.js real (el mismo estilo que api/chat.js:
export default con fetch). Levanta un servidor local y un Redis de mentira
compatible con el REST de Upstash, en KV_REST_API_URL. El modelo y la web
no salen a internet: si el servidor los pide por fetch, la prueba responde.
La sesión de prueba es la de chat: Authorization Bearer, clave s:<sha256>
y usuario en u:<sub>.

Un objetivo de más de 500 caracteres cuenta como demasiado largo (la prueba
envía 8000). El cupo del día debe aparecer en 40 usos o al subir el contador
del usuario en Redis. La trampa de la página web lleva la marca
ZXALIAS-POISON-9F3C además de la frase "ignora tus instrucciones".

ui.mjs abre alias.html (raíz, o si no src/alias/alias.html) y habla con un
doble local de POST /api/alias. No prueba el modelo: prueba la pantalla.
Estos ganchos son los que buscan las pruebas. El texto visible sale de
src/alias/textos.json; la prueba no depende de una frase escrita a mano.

  data-alias="goal"          campo del objetivo
  data-alias="plan-submit"   pide el plan
  data-alias="plan"          contiene los pasos; data-state="paused" al pausar
  data-alias="step"          un paso; data-status o data-state: pending|running|done|error
  data-alias="step-edit"     empieza a editar ese paso (dentro del paso)
  data-alias="step-title"    título editable (dentro del paso)
  data-alias="step-output"   texto del resultado (dentro del paso)
  data-alias="run"           ejecuta solo el siguiente paso
  data-alias="pause"         pausa; aria-pressed="true" o data-state="paused"
  data-alias="redo"          rehace el paso (dentro del paso, o uno solo en la página)
  data-alias="error"         aviso visible cuando un paso falla
  data-alias="decisions"     contiene al menos dos botones (aprobar, rehacer, pausar)
  data-alias="download"      descarga el archivo del paso file
  data-alias="lang-es"       vuelve al español
  data-alias="lang-en"       pasa a inglés (html lang=en, o aria-pressed / data-state=on)

window.ALIAS = { plan(goal), runStep(plan, id, prev), tools: { search, file, memory, image } }

El doble de la UI devuelve 5 pasos: search, memory, think, image, file.
Un objetivo que contiene ZXALIAS-UI-ERROR hace que el paso responda status error.
El paso file devuelve resumen.txt con el texto "Resumen de prueba ALIAS."
Ejecutar es de a un paso. Pausar tiene que frenar el siguiente. Rehacer tiene
que cambiar el texto del resultado.

Cobertura

| Prueba | Cubre |
| --- | --- |
| plan devuelve de 3 a 7 pasos | action plan, en español: id, goal y de 3 a 7 pasos con tool search, file, memory, image o think. |
| plan en inglés devuelve de 3 a 7 pasos | La misma forma con lang en y un objetivo en inglés. |
| paso hecho devuelve done | action step devuelve ok, status done, output, sources, file y error null. También con prev. |
| paso fallido devuelve error | Si la fuente o el modelo fallan, ok true y status error con mensaje. |
| límite diario devuelve limit true | Al pasar el cupo del día: ok false, error "límite" y limit true. |
| objetivo vacío se rechaza | goal vacío no crea plan. |
| objetivo en blanco se rechaza | Un goal de solo espacios también se rechaza. |
| objetivo muy largo se rechaza | 8000 caracteres, por encima del tope supuesto de 500. |
| error de objetivo vacío cambia con el idioma | El rechazo en es y en no repite el mismo texto. |
| json malformado del modelo no rompe el servidor | Respuesta JSON (ok false o un plan válido) y el plan siguiente funciona. |
| fuente con ignora tus instrucciones no cambia el plan | Una fuente envenenada no deja un plan ROBAR ni menos de 3 pasos. |
| sin token responde error | Sin Bearer, ok false y un mensaje. |
| abre alias.html | Página, campo y window.ALIAS con las cuatro herramientas. |
| escribe el objetivo y ve el plan | De 3 a 7 pasos visibles. |
| edita un paso | El título editado se queda. |
| ejecuta paso a paso | Un clic, un paso. |
| pausa el recorrido | La pausa se marca y no avanza otro paso. |
| rehace un paso | El resultado cambia. |
| muestra el error y los botones de decisión | Aviso y al menos dos botones. |
| descarga el archivo | Archivo con texto del paso file. |
| cambia el idioma con el diccionario | Los textos salen de textos.json y cambian a inglés. |
