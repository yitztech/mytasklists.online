# Contribuir a MyTaskLists

## Textos e idiomas

La política común vive en `packages/contracts/locales.js` y su declaración de tipos. Español, inglés, portugués brasileño, alemán y francés están habilitados en web, panel, app móvil, errores de la API, correos y avisos push. La landing (portada, precios y descargas) se publica en los cinco idiomas; las páginas legales existen en español e inglés y pt/de/fr enlazan la inglesa.

Todo texto nuevo o modificado debe tener una clave estable y su traducción en los cinco idiomas. Usar `t()` en componentes; incluir estados vacíos, errores, etiquetas, placeholders, títulos y accesibilidad. No duplicar componentes por idioma. Las marcas, identificadores técnicos y contenido creado por usuarios no se traducen.

Catálogos:

- Web, panel y móvil: `apps/<aplicación>/src/i18n/{es,en,pt,de,fr}.ts`. `es` define la estructura; `Catalog`/`DraftCatalog` aportan tipos y el control de CI comprueba claves e interpolaciones.
- Landing: `apps/landing/catalogs/*.json`. `build.mjs` aplica cada catálogo sobre `src/index.html` (atributos `data-i18n` y `data-i18n-aria`) y genera precios y descargas; las rutas por idioma viven en `ROUTES`. Los scripts del cliente leen sus textos del bloque `#landing-copy` (la CSP no permite scripts inline). Las páginas legales siguen inventariadas.
- Errores API: `apps/backend/src/i18n/errors.*.ts`. Se conserva el esquema gettext existente: el mensaje español es la clave. Una excepción nueva debe incluir sus cuatro traducciones.
- Correos y notificaciones: `apps/backend/src/i18n/{mail,notifications}.{pt,de,fr}.ts`. Español e inglés conservan sus plantillas originales en `mail.templates.ts` y `notification.texts.ts`; no añadir texto inline nuevo allí.

No interpolar datos del usuario mediante concatenaciones traducidas. Conservar los nombres de variables `{{name}}` y placeholders `__APP_URL__`. Usar `Intl` con `LOCALE_CONFIG[locale].intl`; el idioma no cambia importes, moneda ni condiciones de facturación. Las formas plurales se comprueban con `Intl.PluralRules` del idioma de destino.

Antes de integrar:

```sh
npm run i18n:check
npm run test:i18n
npm run typecheck
npm run test:auth-locales
npm run contract:check
```

CI ejecuta la cobertura de idiomas, sus pruebas negativas, tipos, builds y pruebas de autenticación/compatibilidad. La configuración de protección de ramas de GitHub debe exigir el check existente «Tipos y build»; modificar el workflow no modifica por sí solo la protección remota.

`scripts/i18n-debt.json` es un inventario congelado del código anterior a esta entrega: registra traducciones faltantes mediante clave y hash del texto de origen, y literales mediante archivo/hash/recuento. Permite avanzar sin simular que la traducción completa ya existe. No añadir excepciones para componentes nuevos ni aumentar recuentos. Al cambiar un texto de origen se invalida su excepción: hay que aportar las traducciones. Se pueden retirar entradas al resolver deuda. El guard AST cubre texto JSX, atributos visibles/accesibles, copy almacenado en variables, condicionales, alertas/excepciones y plantillas legacy. No sustituye la revisión visual y lingüística ni analiza todo flujo arbitrario de datos JavaScript.

Un idioma en `ENABLED_LOCALES` (o pasado con `npm run i18n:check -- --release=<código>`) necesita catálogos completos en todas las superficies, sin excepciones de traducción, y sus catálogos de entrega del servidor: `errors`, `mail` y `notifications`. El selector usa los nombres propios del registro compartido. Un idioma nuevo en la landing necesita también su entrada en `ROUTES` de `apps/landing/build.mjs`.

## Contratos y preferencias

El backend acepta `SupportedLocale` con cinco valores en `UpdateProfileRequest.locale` y guarda la preferencia. `User.preferredLocale` devuelve esa elección y es la que usan los clientes actuales. `User.locale` y el alias histórico `Locale` (`LegacyLocale`) conservan es/en para clientes publicados; `contract:check` lo vigila como `PublishedLocale`. El fallback de entrega se resuelve de forma explícita; no hace falta una migración para los códigos base de dos letras en las columnas actuales.

No ampliar los valores de una respuesta utilizada por apps publicadas sin revisar compatibilidad. Ejecutar `npm run contract:check` y conservar las dependencias runtime del paquete compartido en los Dockerfiles.

## Google nativo

Consultar [configuración y verificación de Google](docs/GOOGLE-MOBILE-SETUP.md). El SDK nativo requiere un binario nuevo y configuración real de Google Cloud. Los client IDs son públicos; no incluir secretos OAuth, tokens ni claves de firma en código, capturas o logs.
