# Seguridad y operación

Las fotos se leen con enlaces firmados de 9–10 minutos, ligados a usuario, versión de sesión y archivo. Son permisos temporales: quien copie un enlace válido puede usarlo durante ese intervalo. En cada lectura se consulta la membresía actual y que el producto siga referenciando el archivo. La expulsión, revocación de sesión y eliminación de cuenta cortan el acceso. Las respuestas llevan `private, no-store`; el gateway registra rutas sin parámetros. Web y móvil renuevan las fotos al volver a la pantalla y cada cuatro minutos.

PostgreSQL registra los archivos reemplazados o eliminados en `image_deletions`, incluso al borrar listas o cuentas mediante cascada. El worker reintenta cada cinco segundos; la conciliación revisa el directorio al arrancar y cada hora, con una hora de margen para archivos todavía no asociados. Los errores de disco conservan la tarea pendiente.

Se aceptan como máximo dos cargas de imagen simultáneas por instancia, antes de leer el cuerpo multipart. Cada cuenta propietaria dispone de un techo técnico de 100 MiB (`IMAGE_MAX_BYTES_PER_ACCOUNT`); los bytes se contabilizan sobre JPEG normalizados. Las imágenes de listas compartidas cuentan para quien posee la lista. El techo técnico de listas es 100 y de elementos, incluidos archivados, 2.000 por lista. Son protecciones operativas independientes de los beneficios comerciales aún pendientes de definición.

Las invitaciones tienen cooldown de 60 segundos por remitente/destinatario, máximo 20 envíos por cuenta/hora y 10 recibidos por destinatario/hora, más el throttle por IP. Cancelarlas no reinicia estos contadores. Solo el propietario canónico puede listar o cancelar pendientes. El registro y la cancelación bloquean la fila de invitación para resolver carreras.

El registro y las invitaciones escriben un outbox en su transacción. El contenido se cifra con AES-GCM y `APP_ENCRYPTION_KEY`. El worker reclama una tarea con un lease corto, libera la transacción y envía SMTP; reintenta con espera creciente, verifica que el enlace siga vigente y purga los trabajos al día. La entrega es al menos una vez: un cierre después de aceptar SMTP puede repetir el mismo correo. Una respuesta aceptada significa correo encolado, no entrega confirmada en el buzón.

## Identidades y despliegue

La base sigue el modelo de yunitztech: un único usuario, `POSTGRES_USER/PASSWORD`, propietario de la base. La API lo usa y ejecuta las migraciones al arrancar (`RUN_MIGRATIONS=true`). PostgreSQL y Redis no publican puertos y comparten el espacio de red de la API (ver «Aislamiento de red en Coolify»).

`apps/backend/src/database/run-migrations.ts` y la prueba `SEC-02` corresponden a un rol de aplicación sin privilegios (`APP_DB_USER`). Producción no los usa; quedan como referencia para la revisión pendiente.

`Desplegar` se ejecuta después de `CI` aprobado en main, o manualmente si el SHA ya pasó ese CI. Comprueba la punta actual de main y exige las cinco imágenes con el SHA exacto, que publica el propio CI de main en paralelo con las pruebas: una imagen publicada no se despliega mientras ese CI no termine en verde. Una clave SSH dedicada en `production` (`COOLIFY_RELEASE_SSH_KEY`, `COOLIFY_RELEASE_HOST_KEY`, variable `COOLIFY_RELEASE_HOST`) solo ejecuta `scripts/ops/mytasklists-release.py` mediante comando forzado, sin shell ni forwarding. Este comprueba CI de nuevo y solo cambia `IMAGE_TAG` de MyTaskLists en Coolify. El token existente conserva su permiso de despliegue.

Para rollback se fija explícitamente `IMAGE_TAG` a una revisión anterior validada en Coolify y se redespliega. El comando automático exige la punta de main; un rollback exige la operación administrativa documentada. Las migraciones de esta entrega añaden columnas/tablas y siguen siendo compatibles con la imagen anterior. Nunca reemplazar el volumen PostgreSQL.

## Copias y retención

La política Restic incluye `/var/lib/docker/volumes/*_item-images/_data`, los volcados SQL y `/data/coolify` (incluye descargas de APK). La fuente Ansible está en `infra-ionos-vps/roles/backup/defaults/main.yml`. Retención automática: siete copias diarias, cuatro semanales y seis mensuales. Las fotos borradas dejan de servirse inmediatamente pero pueden persistir en copias hasta caducar la retención; una restauración debe reaplicar las solicitudes de borrado posteriores al snapshot antes de abrir el servicio. Los volcados y los archivos se capturan en caliente; no equivalen a una instantánea atómica de escrituras concurrentes. Para recuperación hay que conciliar las referencias de imágenes con los archivos restaurados.

## Dependencias móviles

`uuid` transitivo de Xcode se fija a 11.1.1 y se valida compilando el APK. Las herramientas de Expo usan `node-forge` 1.4.2 (fuera de [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)) y `zod` 4.6.7 mediante un override en `apps/mobile/package.json`, porque `@expo/cli` 57 aún pide `^3.25.76` y el arreglo de [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) es 4.6.6. Retirar el override cuando Expo declare zod 4. `deepmerge` 4.3.1 ([GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), severidad baja) no tiene versión corregida; su excepción de herramientas es exacta y caduca el 31 de octubre; otros avisos bloquean CI. El APK directo tiene OTA desactivado. Ejecutar `node scripts/audit-dependencies.mjs` después de actualizar.

## Aislamiento de red en Coolify

Detectado el 2 de octubre de 2026 y resuelto en mytasklists el 14 de octubre. En yunitztech (vps2) sigue pendiente.

- Coolify añade todas las redes de nivel superior del compose, más la suya (`<uuid>`, que no es interna), a cada servicio (`bootstrap/helpers/parsers.php`). También conecta Traefik (`coolify-proxy`) a esas redes. Una red `internal: true` no aislaba nada: PostgreSQL y Redis acababan en las mismas redes que gateway, frontend, landing, dashboard y Traefik. Solo se libra un servicio que usa `network_mode`.
- Por eso `backend`, `postgres` y `redis` comparten, como un pod, el espacio de red de `backend-net` (`registry.k8s.io/pause`) mediante `network_mode: service:backend-net`. PostgreSQL (`listen_addresses=127.0.0.1`) y Redis (`--bind 127.0.0.1`) escuchan solo en loopback: únicamente la API, dentro de ese espacio, llega a ellos. Desde otro contenedor, por nombre o por IP, en cualquier red, 5432 y 6379 están cerrados. El gateway sigue llamando a `backend:3000` gracias al alias de `backend-net`.
- `backend-net` no cambia entre despliegues, así que un despliegue recrea la API sin reiniciar PostgreSQL ni Redis. Si se cambia su imagen, comprobar después del despliegue que `backend`, `postgres` y `redis` se recrearon con él; si no, quedan sin red hasta reiniciarlos.
- La red `<uuid>_backend` del despliegue anterior queda huérfana, con Traefik conectado. No la usa ningún contenedor de la app y se puede borrar con `docker network rm` después de desconectar Traefik.
- Las copias siguen funcionando: `restic-backup` hace `pg_dumpall` con `docker exec` por el socket local.
- La API sigue expuesta en 3000 a Traefik y a las redes de la app, igual que antes. El usuario de la base sigue siendo el propietario único (modelo yunitztech).
