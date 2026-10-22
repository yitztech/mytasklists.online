# Pruebas de la app móvil y generación de apps

Las pruebas de la app móvil corren **solo en el entorno de desarrollo local**, en un simulador o emulador
instalado en tu máquina, y **solo cuando se piden**. No forman parte de CI ni del despliegue, para que estos
sigan siendo rápidos.

**Regla:** ninguna app (APK, build de tienda u OTA) se genera sin que antes pasen las pruebas en simulador con
exactamente ese código. Los scripts de build y CI lo comprueban y se niegan a continuar si no es así.

## Ejecutar las pruebas

```sh
npm run up                    # pila local (API, base de datos, Mailpit) en http://localhost:8080
npm run mobile:test           # iOS: simulador «iPhone 17»
npm run mobile:test:android   # Android: emulador «Medium_Tablet» (API 35)
```

Opciones (después de `--`): `--device "<nombre>"` para otro simulador o AVD, `--rebuild` para forzar la
recompilación del binario y `--web` para correr además la app en el navegador (Playwright, proyecto
`mobile-app`). La app en el navegador también se puede probar sola con `npm run test:e2e:mobile`.

Qué hace `scripts/mobile-test.mjs`:

1. Comprueba que la pila local responde.
2. Crea una cuenta de prueba por API (registro completo a través de Mailpit) que comparten todos los flujos.
3. Arranca el simulador (o el emulador, con `adb reverse` para que `localhost` llegue a tu máquina).
4. Arranca Metro con la configuración de **desarrollo** (API local, nunca producción) y precompila el bundle.
5. Compila e instala la app de desarrollo **solo si cambió su parte nativa** (fingerprint de Expo). Un cambio
   de JavaScript no recompila: Metro sirve el código actual. La primera vez tarda unos minutos; después, segundos.
6. Ejecuta los flujos de Maestro (`apps/mobile/.maestro/flows`).
7. Si todo pasa, registra la verificación en `apps/mobile/.maestro/verificacion.json` con la huella del código
   de la app (`apps/mobile`, `packages/contracts`, `packages/ui-data`) y la plataforma probada.

Tiempos de referencia: iOS ~75 s; Android ~14 min (el emulador es mucho más lento en esta máquina). Los AVD
`Pixel_10*` usan Android 17 (API 37), donde Maestro 2.11 se cuelga al escribir texto; por eso el predeterminado
es `Medium_Tablet` (API 35).

Los resultados (JUnit y capturas) quedan en `apps/mobile/.maestro/resultados/`, que no se versiona.

## Generar una app

`verificacion.json` **se versiona**: inclúyelo en el commit del cambio. Con él:

| Comando | Qué genera | Comprobación |
|---|---|---|
| `npm run mobile:build:android` | APK firmado en `downloads/` | verificación con el código actual |
| `npm run mobile:release:android` | APK + GitHub Release | además, la versión verificada es la que se publica |
| `npm --prefix apps/mobile run ios:release` | build Release de iOS | verificación con el código actual |
| workflow «App móvil» (EAS) | build de tienda u OTA | verificación del commit en CI |

Si cambias cualquier archivo de la app después de probar, la huella deja de coincidir y hay que volver a
ejecutar `npm run mobile:test`.

## Publicación en producción

La página de descargas de producción ofrece siempre la **última versión publicada**: el backend consulta el
último GitHub Release (`GITHUB_DISTRIBUTION_ENABLED=true` en `compose.prod.yml`, caché de 5 minutos) y lo
prefiere a cualquier APK local más antiguo. Publicar con `npm run mobile:release:android` basta para que
`https://mytasklists.online/descargar/` lo muestre.

## Escribir flujos rápidos

- Reutiliza la cuenta compartida (`${EMAIL}`, `${PASSWORD}`); no crees cuentas dentro de los flujos.
- Espera elementos con `extendedWaitUntil` y un `id`, nunca con pausas fijas.
- Un flujo por recorrido de usuario; agrupa comprobaciones relacionadas en vez de relanzar la app.
- Usa `testID` estables en los componentes; el texto visible cambia con el idioma.
