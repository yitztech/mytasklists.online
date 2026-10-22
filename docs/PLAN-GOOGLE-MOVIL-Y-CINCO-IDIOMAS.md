# Plan: Google en móvil y cobertura de cinco idiomas

Fecha: 2026-10-15. Estado (2026-10-22): **Google en Android completado.** El APK directo 2.5.1 incluye el cliente OAuth Web que el backend acepta como audiencia (`GOOGLE_CLIENT_ID`), y el inicio de sesión con Google se comprobó en un dispositivo Android real. La traducción por dominios (Fase I2) también está completa: es, en, pt, de y fr habilitados (PR #24). Pendiente: Google en iOS (falta `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` y un binario iOS distribuible) y repetir G01–G09 en Play Store cuando exista ese canal (firma de Play App Signing con su propio SHA-1).

## 1. Diagnóstico de Google

Hay dos rutas distintas:

- `apps/mobile/src/screens/LoginScreen.tsx`: si `googleConfigured` es falso, abre `SocialHelp`.
- `apps/mobile/src/screens/SocialHelpScreen.tsx`: abre `${API_URL}/auth/google` mediante `Linking.openURL`.
- `apps/backend/src/modules/auth/auth.controller.ts`: el callback de Google ejecuta `finishWebLogin`.
- `apps/backend/src/modules/auth/auth.service.ts`: `buildRedirectUrl` apunta a `/app/auth/callback`. Es una sesión web; no existe transferencia a la sesión nativa en esta ruta.

Esto reproduce estructuralmente el síntoma descrito. Los client IDs en `app.json` están vacíos, pero pueden inyectarse mediante variables de compilación: falta comprobar el binario concreto antes de atribuirle definitivamente esta causa.

La otra ruta, `GoogleSignInButton.tsx`, usa `Google.useIdTokenAuthRequest`, entrega el ID token a `POST /auth/google/token` y ya permite completar la sesión en `AuthContext`. No fija `redirectUri`. La dependencia local genera por defecto `${Application.applicationId}:/oauthredirect`; hay que comprobar que el binario registre la URI efectiva. El esquema declarado en Expo es `mytasklists`; esta diferencia es una comprobación pendiente, no prueba por sí sola de un fallo del manifiesto generado.

El enlace `mytasklists://login?email=...` de LoginScreen solo rellena el correo para registro/restablecimiento. No inicia una sesión OAuth. Cambiar únicamente el destino web a ese enlace no resuelve la autenticación.

### G0. Confirmar el canal afectado

Registrar Android/iOS, APK/tienda/PWA, versión y build, navegador y presencia de la pantalla SocialHelp. Inspeccionar configuración resuelta del build, client IDs presentes, paquete/bundle, certificados y ruta final, sin registrar tokens ni secretos. Si es una PWA, reproducir por separado: la solución nativa no se aplica automáticamente.

Salida: identificar cuál de las dos rutas se ejecuta en el dispositivo y comprobar la configuración del artefacto que realmente se distribuye.

### G1. Solución recomendada para la app nativa

1. Sustituir el proveedor Google basado en AuthSession por integración nativa compatible con Expo 57/React Native 0.86. Evaluar primero `react-native-nitro-google-signin` con Credential Manager en Android; confirmar compatibilidad y mantenimiento antes de fijar versión. La guía actual de Expo contempla esta opción y `@react-native-google-signin/google-signin`.
2. Conservar `POST /auth/google/token`, `AuthContext.loginWithGoogle`, la persistencia segura de sesión y el paso de MFA. El SDK entrega el ID token por HTTPS a ese endpoint; el servidor mantiene verificación de firma, emisor, expiración y audiencia explícita.
3. Configurar client IDs apropiados y la audiencia realmente emitida. Android: paquete `online.mytasklists.app` y huellas SHA-1 de APK directo y firma de Play cuando corresponda. iOS nativo: bundle, cliente y esquema de retorno requeridos por el SDK. No incluir secretos de cliente en la app.
4. Sustituir el fallback engañoso: sin configuración válida, mostrar indisponibilidad de Google y permitir acceso por los medios existentes. Si se ofrece abrir la web, identificar claramente que se continuará en la web.
5. Manejar cancelación, error de red, doble toque y token ausente; limpiar el estado de carga y permitir reintentar.
6. Generar e instalar un binario nuevo, verificar el artefacto firmado por cada canal que se distribuya. Una actualización JavaScript no incorpora un nuevo módulo nativo.

Alternativa solo si se decide conservar OAuth en navegador: implementar un flujo móvil explícito con callback HTTPS, state de un solo uso, PKCE y código de intercambio efímero ligado al intento/dispositivo. El retorno a la app transporta ese código, nunca access/refresh tokens en la URL. Requiere validación estricta de destinos, consumo atómico, caducidad y manejo del arranque frío/caliente. Tiene más superficie de implementación que reutilizar el endpoint de token nativo; no desarrollar ambas soluciones simultáneamente.

### Pruebas de aceptación Google

| ID | Caso | Resultado obligatorio |
|---|---|---|
| G01 | Cuenta existente, app firmada en dispositivo | Termina en las listas dentro de la app y `/auth/me` confirma el usuario |
| G02 | Primer acceso con Google | Completa los requisitos actuales de alta sin perder el flujo nativo |
| G03 | Cuenta con MFA | Solicita MFA antes de conceder sesión completa |
| G04 | Cancelar, sin red, reintentar y doble toque | Sin bloqueo ni solicitudes duplicadas; error útil |
| G05 | Cerrar y reabrir después de entrar | Sesión persistida y renovación funcional |
| G06 | ID token vencido, audiencia errónea o firma inválida | Backend rechaza; no se crea sesión |
| G07 | Build sin configuración de Google | No ofrece una ruta web como si completara el acceso nativo |
| G08 | Login web de Google | Sigue funcionando con su callback y cookies |
| G09 | APK directo / Play / iOS que efectivamente se distribuyan | Validación separada del binario y credenciales de cada canal |

Playwright sobre la exportación web de móvil no demuestra el retorno del navegador a una app nativa. Guardar evidencia del dispositivo y del build sin datos sensibles.

## 2. Estado de internacionalización

Existe soporte extensible, pero actualmente solo están habilitados `es` y `en`:

| Superficie | Estado comprobado | Cambio requerido |
|---|---|---|
| Frontend, dashboard, móvil | i18next, catálogos es/en, tipos de claves y selector | Añadir pt/de/fr, detección, persistencia, formatos y selector adecuado para cinco opciones |
| Catálogos TS | `en: Catalog<typeof es>` obliga a tener las claves españolas | Aplicar el mismo contrato a todos los idiomas |
| Texto fuera de catálogos | BillingScreen, UpdateGate y otras superficies usan condicionales es/en | Inventariar y extraer textos, atributos accesibles, validaciones y estados |
| Contratos/API | `Locale = 'es' | 'en'`, DTO y parser restringidos | Ampliar contratos, validadores, errores y preferencias |
| Correos y notificaciones | Plantillas y catálogos bilingües | Cubrir los cinco idiomas y conservar interpolaciones/escape |
| Billing | `benefits:{es:string;en:string}` | Ampliar contrato, edición y persistencia; mantener compatibilidad con clientes antiguos |
| Landing | Generación y rutas condicionadas por booleano `en` | Catálogos por idioma, rutas, SEO, legales y scripts dinámicos |
| CI | Typecheck/build y e2e; tipos comprueban catálogo inglés | Añadir controles de cobertura, interpolación y texto fuera de catálogo |

No hace falta duplicar componentes visuales por idioma: cada componente usa claves estables y cinco catálogos. Los tipos existentes ayudan con las claves, pero no impiden que alguien escriba un texto directamente en JSX.

### I0. Política y base común

- Declarar `es`, `en`, `pt`, `de`, `fr` en un registro compartido de runtime/tipos compatible con los builds existentes. Conservar catálogos separados por aplicación/dominio para no inflar todos los paquetes.
- Propuesta de variante inicial: portugués brasileño (`pt-BR`), alemán de Alemania (`de-DE`), francés de Francia (`fr-FR`); `pt` identifica el catálogo base. Confirmar mercado objetivo antes de traducir en volumen. Mantener es-MX/en-US actuales.
- Orden de preferencia explícito: elección guardada, idiomas soportados del dispositivo/navegador, fallback documentado. Respetar el idioma de la URL en landing y sincronizar preferencias autenticadas conforme al comportamiento actual.
- Usar Intl para números, fechas y monedas; traducir un idioma no convierte precios ni moneda. No traducir automáticamente contenido creado por usuarios.

### I1. Cerrar huecos y preparar controles antes de traducir

1. Inventariar textos y extraer condicionales binarios a claves, incluyendo landing, facturación, errores, diálogos, placeholders, accesibilidad, notificaciones y permisos nativos.
2. Extender contratos y DTO. Inspeccionar la definición/migraciones reales de `user.locale` antes de decidir si se necesita migración SQL. Mantener valores existentes y compatibilidad con versiones móviles publicadas.
3. Añadir `npm run i18n:check` (comando propuesto): paridad recursiva de claves, cadenas vacías, interpolaciones y formas plurales válidas por locale; cobertura de backend y landing además de TS.
4. Incorporar una regla AST/lint para nuevos textos de interfaz fuera de catálogo, incluidos atributos y ternarios. Excepciones explícitas para marcas, identificadores y contenido del usuario; lista de deuda existente temporal si la extracción se divide en entregas.
5. Añadir la comprobación a `.github/workflows/ci.yml` y hacerla obligatoria para integrar cambios conforme a las protecciones del repositorio. Verificar deliberadamente que una clave francesa ausente y un literal nuevo hagan fallar CI.
6. Documentar en la guía de contribución: toda interfaz nueva incluye claves en cinco idiomas, pruebas de estados y revisión visual. CI garantiza cobertura estructural, no calidad lingüística; añadir revisión humana para textos sensibles y traducciones dudosas.

### I2. Añadir idiomas por bloques y habilitarlos completos

Traducir por dominio: acceso/cuenta, listas, facturación, administración, landing, mensajes del servidor. Reutilizar un glosario para lista, elemento, recurrente, invitación y suscripción. Adaptar selectores a cinco opciones con nombres reconocibles y accesibilidad. Evitar publicar un idioma parcial ocultando faltantes con fallback.

Landing: sustituir el booleano `en` por configuración de locale; generar `/pt/`, `/de/`, `/fr/` y páginas correspondientes, actualizar enlaces internos, canonical propio, hreflang recíproco, sitemap y enrutamiento nginx. Preservar URLs españolas e inglesas. Revisar contenido legal traducido antes de publicarlo.

### Pruebas de aceptación de idiomas

| ID | Caso | Resultado obligatorio |
|---|---|---|
| I01 | Cinco catálogos en cada superficie | Sin claves ausentes, vacías ni interpolaciones incompatibles |
| I02 | Añadir clave sin traducción o literal UI nuevo | CI falla con archivo y clave/localización claros |
| I03 | Detección pt-BR/de-DE/fr-FR y selección manual | Idioma correcto; preferencia persiste al recargar/reabrir |
| I04 | Login, listas, invitaciones, perfil, facturación y panel | Textos, errores y accesibilidad en el idioma elegido |
| I05 | Accept-Language con región/pesos; actualizar perfil | API acepta nuevos idiomas y conserva preferencia |
| I06 | Correos y avisos | Idioma del destinatario; variables y escape correctos |
| I07 | Plurales 0/1/2 y fechas/números/moneda | Formato correcto sin cambiar importes comerciales |
| I08 | Anchos 320/375 px, texto ampliado y alemán largo | Sin controles cortados ni acciones inaccesibles |
| I09 | Landing en cinco idiomas | Rutas 200, enlaces correctos, canonical/hreflang/sitemap coherentes |
| I10 | Clientes es/en ya publicados | Compatibilidad de contratos y flujos existentes |

## 3. Secuencia y modelos para controlar el consumo

La recomendación es de organización del trabajo, no una garantía de cuota. No se conoce el plan, saldo ni reglas de consumo de esta cuenta; una ventana de cinco horas no equivale a cinco horas aseguradas de ejecución continua.

| Entrega independiente | Modelo y esfuerzo sugeridos | Punto de cierre |
|---|---|---|
| G0 + G1: diagnóstico final y reparación OAuth | GPT-6.1 Sol, Medium; High solo ante un bloqueo concreto | Build instalable + G01–G09 aplicables |
| I0 + I1: contratos y controles i18n | GPT-6.1 Sol, Medium | Controles pasan y detectan fallos introducidos deliberadamente |
| I2: traducciones y extracción mecánica acotada | GPT-6 Luna, High | Un dominio completo en cinco idiomas por tarea |
| Integración final, regresiones y revisión de seguridad | GPT-6.1 Sol, Medium | Casos aplicables con evidencia y pendientes explícitos |

Usar modo de velocidad Standard y evitar Max/Ultra por defecto. Trabajar secuencialmente, con prompts que nombren archivos, alcance y aceptación. Ejecutar comprobaciones dirigidas tras cada cambio y la suite requerida al integrar; evitar reinstalaciones y builds repetidos sin cambios que los justifiquen. Guardar un handoff breve al cerrar cada entrega para no repetir la exploración en sesiones nuevas.

Prioridad: terminar Google y su prueba física antes de iniciar la ampliación completa de idiomas. El segundo trabajo afecta cinco aplicaciones/superficies y contenido; conviene repartirlo entre ventanas si la cuota no alcanza. Revisar el indicador real de consumo entre entregas, sin convertir tokens/precios API en porcentajes de la cuota de Codex.

## Fuentes técnicas consultadas

- Expo, Google authentication: https://docs.expo.dev/guides/google-authentication/
- Expo, AuthSession: https://docs.expo.dev/versions/latest/sdk/auth-session/
- OpenAI, modelos y esfuerzo: https://learn.chatgpt.com/docs/models

La documentación oficial recomienda Sol para trabajo complejo equilibrando coste y Luna para tareas enfocadas/repetibles. La asignación por tarea de este documento es una recomendación de ingeniería, no una medición del consumo de la cuenta.
