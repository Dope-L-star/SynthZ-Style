# Microsoft Clarity — preparación de producción para una edición exclusiva 18+

**Estado de este repositorio: PREPARADO, NO ACTIVADO.** Los cinco flags de activación están en `false` en `next/.env.example`; no se deben activar en la edición actual de SymphorIA, cuyos términos permiten usuarios menores de 18 años con permiso de un adulto.

Microsoft indica expresamente que Clarity no debe usarse en sitios o aplicaciones dirigidos a personas menores de 18 años: <https://learn.microsoft.com/en-us/clarity/faq>. Esta guía solo aplica a una variante que esté **realmente destinada y restringida a mayores de 18 años**. Las variables de entorno no verifican edades ni bloquean el acceso de menores por sí mismas.

## Qué se integró

- El tracker `https://www.clarity.ms/tag/z5es3kuqoz` se inserta dinámicamente solo después de una aceptación explícita, o al volver a visitar después de una aceptación todavía válida.
- Antes de insertar el script se encola `clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' })`. El almacenamiento publicitario permanece denegado.
- «No permitir» registra la elección, informa Consent V2 en estado denegado y llama a `clarity('consent', false)` para solicitar el borrado de las cookies de Clarity cuando haya un tracker activo.
- El rechazo se mantiene hasta que la persona lo cambie desde «Privacidad». Una aceptación se vuelve a pedir después de 180 días. Si `localStorage` no está disponible, la opción se aplica a la página actual y vuelve a preguntarse en la siguiente visita: modo seguro.
- Error al descargar el script: se elimina el elemento fallido y no afecta al chat.
- El consentimiento se puede editar desde el panel flotante «Privacidad» o desde la política de privacidad.
- Pulsem no instala el tracker. La CSP permite los hosts requeridos por la documentación de Microsoft, sin eliminar el resto de la política de seguridad.
- Se conservan los selectores `data-clarity-mask` en mensajes, títulos del historial, cuenta y paneles de resultados personales. Clarity también enmascara inputs y desplegables por defecto; el masking no debe tomarse como garantía absoluta.

Referencias oficiales:

- FAQ y audiencia 18+: <https://learn.microsoft.com/en-us/clarity/faq>
- API Consent V2 y revocación: <https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2>
- Consent Mode: <https://learn.microsoft.com/en-us/clarity/setup-and-installation/consent-mode>
- Enmascaramiento: <https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking>
- CSP: <https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-csp>

## Requisitos previos obligatorios antes de cambiar los flags

No basta con mostrar una advertencia de edad ni con cambiar una variable. Antes de habilitar Clarity, el responsable del producto debe completar y validar lo siguiente:

- [ ] Publicar una edición cuya audiencia objetivo sea exclusivamente 18+ y disponer de un control de elegibilidad/acceso adecuado al modelo real de cuentas. La flag no es un control de edad.
- [ ] Actualizar los términos y la política de privacidad, revisar la base legal y el texto de consentimiento para los países atendidos y conseguir la revisión correspondiente. El texto dinámico 18+ de Términos/Privacidad es un punto de partida técnico, no un dictamen legal.
- [ ] Confirmar que el proyecto `z5es3kuqoz` está dedicado a la variante adulta y al dominio correcto. Si antes se usó en una web de audiencia mixta, crear un proyecto Clarity separado para no mezclar datos/historiales.
- [ ] Activar Consent Mode en el panel del proyecto de Clarity. Según la guía actual de Microsoft, revisa Settings → Setup y deshabilita la escritura de cookies por defecto, de modo que los cookies esperen una señal de consentimiento.
- [ ] En Clarity → Settings → Masking, usar **Strict** para la primera fase de lanzamiento y revisar las grabaciones de prueba; no crear reglas para desocultar chats o datos personales.
- [ ] Mantener Clarity apagado en Preview/Development o usar un proyecto separado de pruebas, sin datos de personas reales.
- [ ] Revisar la política CSP en la consola del navegador en la vista previa. No retirar otros controles de seguridad para hacer funcionar la analítica.

## Variables de Cloudflare Pages

Cloudflare recibe las variables durante el **build**. Son `NEXT_PUBLIC_*`, por lo que Next las incrusta en los archivos estáticos. Cambiarlas en el panel sin producir un nuevo build no modifica el sitio que ya está publicado.

En Cloudflare Pages → proyecto → Settings → Environment variables, configura las variables en el entorno **Production** de la futura variante adulta:

| Variable | Valor para la futura edición adulta |
|---|---|
| `NEXT_PUBLIC_CLARITY_ENABLED` | `true` |
| `NEXT_PUBLIC_CLARITY_AUDIENCE_18_PLUS` | `true` |
| `NEXT_PUBLIC_SYMPHORIA_ADULT_ONLY_RELEASE` | `true` |
| `NEXT_PUBLIC_SYMPHORIA_AGE_CONTROL_VERIFIED` | `true` solo cuando el control real de elegibilidad/acceso ha sido validado |
| `NEXT_PUBLIC_CLARITY_PRIVACY_REVIEWED` | `true` solo después de revisión real |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | `z5es3kuqoz` solo si se confirma dedicado a esa edición; preferir un ID nuevo si el proyecto se compartió |

**No pongas estos valores en el despliegue actual.** Mantén las cinco condiciones de activación en `false` en Production hasta que se cumplan los requisitos previos. En Preview mantén `NEXT_PUBLIC_CLARITY_ENABLED=false`.

Ajustes de compilación de Cloudflare Pages para el proyecto:

- Root directory: raíz del repositorio.
- Build command: `npm ci && node cloudflare/preparar.mjs`.
- Build output directory: `cloudflare/public`.
- `NODE_VERSION=22`.

`cloudflare/preparar.mjs` ejecuta `next/armar.mjs`; los flags del panel deben estar disponibles para ese build. Si se solicita Clarity sin todos los requisitos, el build falla antes de publicar. La configuración de release es una barrera contra errores operativos, no una garantía sobre la audiencia real. El proyecto de Clarity y su activación en producción debe administrarlo el titular o una persona autorizada que cumpla los términos de Microsoft; no actives el servicio antes de cumplir sus requisitos de elegibilidad.

## Pruebas automáticas

Desde la raíz del repositorio:

```bash
node --test next/tests/clarity-consent.test.mjs
node next/verificar-migracion.mjs
node build.mjs --check
```

Los tests unitarios cubren:

1. La integración está bloqueada si falta cualquier condición.
2. Inserción dinámica del script e inclusión de Consent V2 antes del tracker.
3. Rechazo de un ID de proyecto inválido.
4. Caducidad de una aceptación tras 180 días y persistencia del rechazo.
5. Revocación, Consent V2 denegado y llamada de borrado de cookies.
6. Error de red al cargar el script sin romper la aplicación.
7. Barrera de build en `next/armar.mjs` y `next/next.config.mjs` para flags incompletos.
8. Configuración acepta las cinco condiciones completas y rechaza una incompleta.
9. Integridad de los árboles React y máscaras necesarias para contenido sensible.

## Pruebas manuales antes de producción

Realiza estas pruebas en una vista previa adulta, con herramientas del navegador abiertas y sin conversaciones reales:

1. **Primera visita:** con almacenamiento limpio y flags válidos, debe aparecer el panel de consentimiento. En Network no debe haber petición a `clarity.ms` antes de aceptar.
2. **Rechazar:** no debe insertarse el script ni aparecer cookies `_clck`/`_clsk`; recargar no debe mostrar otra vez el panel mientras el rechazo esté guardado.
3. **Aceptar:** la petición a `https://www.clarity.ms/tag/<ID>` aparece solo después del clic; en la consola, verifica con `clarity('metadata', (d, upgrade, consent) => console.log(consent), false, true, true)` que Consent Mode reconoce `analytics_storage: "GRANTED"` y `ad_storage: "DENIED"`.
4. **Revocar:** abre «Privacidad» → «No permitir». La API debe recibir estado denegado y borrar las cookies existentes. Después navega y recarga: no debe reactivarse.
5. **Caducidad:** usa una entrada de almacenamiento de prueba antigua (más de 180 días); el consentimiento debe volver a pedirse.
6. **Enmascaramiento:** verifica el replay de prueba. El texto de mensajes, títulos, perfiles y resultados no debe ser legible. Inputs y dropdowns deben permanecer enmascarados. Si algo aparece, detén el rollout, refuerza el masking y repite.
7. **CSP:** sin errores bloqueantes para `www.clarity.ms`, `*.clarity.ms` o `c.bing.com`; conserva los demás avisos CSP preexistentes y no amplíes la política indiscriminadamente.
8. **Regresión del producto:** envío y streaming de SynthFlow, cambio de modelos, login/logout, historial, archivos y móvil funcionan igual con consentimiento aceptado y rechazado.
9. **Build gate:** ejecutar `NEXT_PUBLIC_CLARITY_ENABLED=true` sin las otras cuatro condiciones debe detener el build con error y no generar un artefacto que habilite el tracker.

No publiques hasta que todas las pruebas manuales tengan evidencia y la revisión legal/audiencia haya sido aprobada. Los tests automatizados no demuestran por sí solos la conformidad legal ni la correcta interpretación de datos en la grabación real.
