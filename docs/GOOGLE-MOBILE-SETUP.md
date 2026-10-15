# Google nativo: configuración y validación

Implementación 2026-10-15: Expo 57 / React Native 0.86, `react-native-nitro-google-signin` 2.3.0 y Nitro Modules 0.37.1 (dependencias exactas). La [guía actual de Expo](https://docs.expo.dev/guides/google-authentication/) recomienda esta opción con Credential Manager en Android. [Instalación y configuración oficial](https://react-native-nitro-google-sign-in.github.io/docs/setup/expo/).

## Configurar antes del nuevo binario

- Definir `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` como cliente OAuth de tipo **Web**, también para Android; Credential Manager emite su ID token con esta audiencia. No usar un cliente Android como `webClientId`.
- Backend: incluir ese mismo ID en `GOOGLE_CLIENT_ID` o `GOOGLE_ALLOWED_AUDIENCES`. Se conservan las audiencias explícitas del login web. No definir comodines ni aceptar audiencias suministradas por la app.
- En Google Cloud, registrar cliente Android con paquete `online.mytasklists.app` y SHA-1 de cada certificado distribuido: APK directo y Play App Signing por separado. El ID Android no se pasa al SDK.
- Para iOS definir además `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` del bundle `online.mytasklists.app`. La configuración Expo registra el esquema invertido mediante el plugin del SDK. Sin cliente iOS, Google permanece indisponible en iOS. Para iOS 27/Xcode 27, revisar requisitos de SceneDelegate del SDK antes de distribuir.
- Los client IDs son identificadores públicos; nunca incluir `GOOGLE_CLIENT_SECRET` ni credenciales de firma en la app.
- Regenerar proyecto nativo y crear binario nuevo. Una actualización OTA no añade módulos nativos. Expo Go no admite este SDK y muestra indisponibilidad.

Android sin Firebase usa el ID web explícito y autolinking, sin plugin Firebase ni archivos `google-services`. El plugin Google se añade cuando existe cliente iOS para registrar el esquema correspondiente. `.native.tsx` aísla el SDK; la exportación web conserva su proveedor de navegador y no importa Nitro.

La sesión conserva `POST /auth/google/token`, `AuthContext.loginWithGoogle`, almacenamiento seguro y MFA. El backend verifica firma RS256, emisor Google, audiencia explícita y claims obligatorios `sub`, `iat`, `exp`, `email`. Una cuenta con MFA recibe únicamente un reto, sin sesión completa. Cancelar cierra la espera; fallos muestran error y permiten reintentar; un guard síncrono bloquea doble toque hasta finalizar también la petición al servidor.

Sin configuración, Login y la antigua ruta SocialHelp informan que Google no está disponible y remiten al acceso por correo. No abren `/auth/google` para simular un acceso nativo.

## Verificar

```sh
npm run build --workspace @lista/backend
node --test scripts/test-google-auth.cjs
npm run typecheck --prefix apps/mobile
npm run export:web --prefix apps/mobile
```

Los tests usan claves RSA locales y verificación criptográfica real, sin Google Cloud ni datos de usuarios. Cubren aceptación, expiración, audiencia, emisor, firma, claims obligatorios, nonce del flujo web, configuración vacía y endpoint con MFA sin emisión de sesión.

Antes de publicar, instalar el nuevo binario firmado y ejecutar G01–G09 aplicables del plan: cuenta existente/nueva, MFA, cancelar/sin red/doble toque/reintento, `/auth/me`, persistencia y renovación; repetir por canal. Guardar plataforma, versión/build, firma usada y resultado sin tokens ni datos personales. La exportación web y el APK de depuración no prueban Google en un dispositivo firmado de distribución.
