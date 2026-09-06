# DAST con OWASP ZAP

El workflow `DAST` examina una compilacion de produccion en un runner temporal,
conectada exclusivamente al proyecto Supabase QA. No escanea produccion.

## Ejecucion

- Automaticamente en PR del mismo repositorio y al hacer merge a main.
- Cada lunes a las 10:30 UTC, una vez que el workflow exista en main.
- Manualmente desde Actions > DAST > Run workflow, despues del primer merge.
- Los PR externos se omiten porque no tienen acceso a los secretos QA.

Reutiliza `QA_SUPABASE_URL` y `QA_SUPABASE_ANON_KEY`. No necesita service role,
contrasenas, credenciales Google, Resend ni permisos para escribir en GitHub.
La URL QA se valida contra el proyecto aislado; si cambia, actualizar el workflow.

## Alcance y seguridad

ZAP Baseline recorre enlaces y analiza respuestas de forma pasiva. No se habilitan
ataques activos, navegador Ajax ni envio de formularios. La instancia local usa
el puerto 3200. El rastreo tiene limites de tiempo, profundidad y concurrencia.
Puede generar peticiones GET y carga de lectura en QA; no es una prueba sin trafico.

Esta primera etapa cubre paginas anonimas que el rastreador descubre. No verifica
sesiones autenticadas, autorizacion entre usuarios, RLS, logica de negocio,
OAuth, configuracion TLS ni cabeceras agregadas por Vercel en produccion.
Los E2E autenticados existentes son complementarios, no sustituyen esas pruebas.

## Resultado

En el PR, abrir el check `ZAP passive scan (QA)` y su resumen. En la ejecucion
de Actions, descargar `dast-report-<run-id>` y abrir `report.html` en cualquier
navegador. El workflow falla si no puede generar este HTML. Tambien se conservan
JSON y Markdown durante 14 dias.
Los informes pueden contener URLs y contenido de QA: no publicar los artefactos
fuera del equipo ni usar datos personales reales en QA.

Hallazgos altos y fallos de ejecucion/informes invalidos bloquean el check.
Medios, bajos e informativos se muestran sin bloquear en esta primera etapa.
No se suprimen alertas. Un check verde no certifica ausencia de vulnerabilidades.
Revisar los medios antes de aprobar cada PR y endurecer el umbral tras resolver
la linea base. La imagen oficial `stable` se actualiza, por lo que las reglas
pueden cambiar; el informe permite consultar la version utilizada.

La aplicacion publica una CSP en `Report-Only` durante la etapa inicial. Esta
politica permite detectar recursos que serian bloqueados sin afectar a usuarios.
`X-Frame-Options: DENY` mantiene activa la proteccion contra clickjacking mientras
se valida la CSP. Antes de convertirla en `Content-Security-Policy`, probar Google
OAuth, consultas y subida de imagenes a Supabase, enlaces de WhatsApp y navegacion
en movil, y revisar violaciones en la consola del navegador.

Para impedir merges con fallos, configurar este check como obligatorio en la
regla de proteccion de main una vez ejecutado el primer PR. El workflow solo no
impide que alguien con permisos haga merge.

## Siguientes etapas

1. Resolver y priorizar los hallazgos de la primera ejecucion.
2. Bloquear tambien severidad media tras revisar la linea base.
3. DAST autenticado y escaneo activo solo en entorno desechable con datos ficticios.
4. Revision pasiva separada de TLS y cabeceras de produccion, con alcance aprobado.

Referencia: https://www.zaproxy.org/docs/docker/baseline-scan/
