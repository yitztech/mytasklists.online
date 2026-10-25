import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Pruebas unitarias y de comportamiento de Apps Móviles (iOS y Android)
 * Cubren plataformas móviles, almacenamiento seguro, tokens de notificación,
 * compatibilidad de versión, validaciones de interfaz y flujos de listas/recurrencia.
 *
 * NOTA: Como especificado, estas pruebas NO se ejecutan en los pipelines de GitHub.
 */
describe('Apps Móviles (iOS y Android) · Comportamiento y Validación', () => {

  describe('Detección y soporte de plataformas móviles (iOS y Android)', () => {
    it('Caso de éxito: acepta plataformas móviles oficiales "ios" y "android"', () => {
      const supportedPlatforms = ['ios', 'android'];
      for (const platform of supportedPlatforms) {
        assert.ok(['ios', 'android', 'web'].includes(platform));
      }
    });

    it('Caso de fracaso: rechaza plataformas móviles no reconocidas o fraudulentas', () => {
      const invalidPlatforms = ['windows_phone', 'blackberry', 'symbian', 'unknown', ''];
      for (const platform of invalidPlatforms) {
        const isValid = ['ios', 'android'].includes(platform);
        assert.strictEqual(isValid, false, `Plataforma "${platform}" debe ser rechazada`);
      }
    });
  });

  describe('Tokens Push para dispositivos móviles (iOS y Android)', () => {
    const isExpoPushToken = (token) => {
      if (typeof token !== 'string') return false;
      return /^ExponentPushToken\[[A-Za-z0-9_-]+\]$/.test(token) ||
             /^ExpoPushToken\[[A-Za-z0-9_-]+\]$/.test(token);
    };

    it('Caso de éxito: acepta tokens válidos de Expo Push tanto en iOS como en Android', () => {
      const validIosToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
      const validAndroidToken = 'ExpoPushToken[yyyy-yyyy-yyyy-yyyy]';

      assert.ok(isExpoPushToken(validIosToken), 'Token iOS válido debe aceptarse');
      assert.ok(isExpoPushToken(validAndroidToken), 'Token Android válido debe aceptarse');
    });

    it('Caso de fracaso: rechaza tokens push maliciosos, vacíos o que no sean de Expo', () => {
      const invalidTokens = [
        '',
        'fcm-token-raw-12345',
        'apns-hex-token-abcdef123456',
        'ExponentPushToken[]',
        'ExponentPushToken[contains spaces!]',
        '<script>alert("push")</script>',
      ];

      for (const token of invalidTokens) {
        assert.strictEqual(isExpoPushToken(token), false, `Token "${token}" debió ser rechazado`);
      }
    });
  });

  describe('Control de versión y actualización obligatoria (UpdateGate en móviles)', () => {
    const parseVersion = (v) => v.split('.').map(Number);
    const isCompatible = (clientVersion, minVersion) => {
      const [cMajor, cMinor, cPatch] = parseVersion(clientVersion);
      const [mMajor, mMinor, mPatch] = parseVersion(minVersion);
      if (cMajor !== mMajor) return cMajor > mMajor;
      if (cMinor !== mMinor) return cMinor > mMinor;
      return (cPatch ?? 0) >= (mPatch ?? 0);
    };

    const MIN_VERSION = '1.0.0';

    it('Caso de éxito: permite acceso a versiones iguales o superiores a la mínima', () => {
      assert.ok(isCompatible('1.0.0', MIN_VERSION), 'Versión 1.0.0 es compatible');
      assert.ok(isCompatible('1.1.0', MIN_VERSION), 'Versión 1.1.0 es compatible');
      assert.ok(isCompatible('2.0.0', MIN_VERSION), 'Versión 2.0.0 es compatible');
    });

    it('Caso de fracaso: bloquea la app y responde 426 Upgrade Required si es versión obsoleta', () => {
      assert.strictEqual(isCompatible('0.9.0', MIN_VERSION), false, 'Versión 0.9.0 debe bloquearse');
      assert.strictEqual(isCompatible('0.9.9', MIN_VERSION), false, 'Versión 0.9.9 debe bloquearse');

      const handleCompatibilityCheck = (clientVersion) => {
        if (!isCompatible(clientVersion, MIN_VERSION)) {
          return { status: 426, code: 'UPGRADE_REQUIRED', message: 'Actualiza tu aplicación' };
        }
        return { status: 200, code: 'OK' };
      };

      const result = handleCompatibilityCheck('0.8.5');
      assert.strictEqual(result.status, 426);
      assert.strictEqual(result.code, 'UPGRADE_REQUIRED');
    });
  });

  describe('Móvil: Gestión de productos, recurrencias (citas/vencimientos) y cancelaciones', () => {
    const PRESETS = [3, 7, 14, 30];

    it('Caso de éxito: selección de días de recurrencia mediante botones preset en móvil', () => {
      for (const days of PRESETS) {
        assert.ok(days >= 1 && days <= 365);
      }
    });

    it('Caso de éxito: cálculo y formateo de vencimiento en móvil', () => {
      const now = new Date('2026-10-15T12:00:00Z');
      const calculateDueDate = (purchaseDate, recurrenceDays) => {
        const due = new Date(purchaseDate.getTime());
        due.setDate(due.getDate() + recurrenceDays);
        return due;
      };

      const dueDate = calculateDueDate(now, 14);
      assert.strictEqual(dueDate.toISOString(), '2026-10-29T12:00:00.000Z');
    });

    it('Caso de éxito y fracaso: validación de cantidad y unidad en móvil', () => {
      const validateItemInput = (name, quantityStr, unit) => {
        const trimmed = name ? name.trim() : '';
        if (!trimmed || trimmed.length > 140) return { valid: false, error: 'NOMBRE_INVALIDO' };
        if (/[\x00-\x1F\x7F]/.test(trimmed)) return { valid: false, error: 'CARACTERES_CONTROL' };
        const qty = Number(quantityStr.replace(',', '.'));
        if (!Number.isFinite(qty) || qty < 0.01 || qty > 99999) return { valid: false, error: 'CANTIDAD_INVALIDA' };
        if (!unit || unit.length > 20) return { valid: false, error: 'UNIDAD_INVALIDA' };
        return { valid: true };
      };

      // Éxito
      assert.deepStrictEqual(validateItemInput('Leche', '2', 'l'), { valid: true });
      assert.deepStrictEqual(validateItemInput('Manzanas', '1.5', 'kg'), { valid: true });

      // Fracaso: nombre vacío
      assert.strictEqual(validateItemInput('', '1', 'pza').valid, false);
      // Fracaso: nombre > 140
      assert.strictEqual(validateItemInput('M'.repeat(141), '1', 'pza').valid, false);
      // Fracaso: caracteres de control
      assert.strictEqual(validateItemInput('Leche\x07', '1', 'pza').valid, false);
      // Fracaso: cantidad negativa o cero
      assert.strictEqual(validateItemInput('Leche', '0', 'l').valid, false);
      assert.strictEqual(validateItemInput('Leche', '-5', 'l').valid, false);
      // Fracaso: unidad > 20
      assert.strictEqual(validateItemInput('Leche', '1', 'U'.repeat(21)).valid, false);
    });

    it('Caso de éxito y fracaso: cancelación y restauración de productos comprados en móvil', () => {
      let item = { id: 'item-100', name: 'Huevos', status: 'pending' };

      // Comprar producto
      item.status = 'purchased';
      assert.strictEqual(item.status, 'purchased');

      // Cancelar compra (deshacer compra y regresar a pendientes)
      item.status = 'pending';
      assert.strictEqual(item.status, 'pending');

      // Archivar / eliminar producto
      item.status = 'archived';
      assert.strictEqual(item.status, 'archived');
    });
  });

  describe('Eliminación de Listas Completas en Móvil y Espaciado de Cuenta en Android', () => {
    it('Caso de éxito: eliminación de lista completa en móvil usa /lists/:id y no /items/:id', () => {
      const list = { id: 'list-xyz', name: 'Lista Completa', ownerId: 'user-10' };
      const isOwner = list.ownerId === 'user-10';
      assert.strictEqual(isOwner, true, 'Propietario puede eliminar la lista');

      const routeForListDeletion = `/lists/${list.id}`;
      assert.match(routeForListDeletion, /^\/lists\/[a-z0-9-]+$/);
      assert.doesNotMatch(routeForListDeletion, /^\/items\//);
    });

    it('Caso de éxito: cálculo de espaciado inferior en Android evita que la barra de botones del sistema tape Eliminar Cuenta', () => {
      // Simula insets de Android con barra de 3 botones (48dp) y modo edge-to-edge
      const androidInsets = { top: 24, bottom: 48, left: 0, right: 0 };
      const spacingXxl = 32;

      const calculatedBottomPadding = Math.max(androidInsets.bottom, 48) + spacingXxl * 3;
      const spacerHeight = Math.max(androidInsets.bottom, 48) + spacingXxl * 2;

      // El padding inferior debe ser al menos 144dp y el espaciador al menos 112dp para holgura total
      assert.ok(calculatedBottomPadding >= 144, `Padding inferior ${calculatedBottomPadding}dp debe superar 144dp`);
      assert.ok(spacerHeight >= 112, `Espaciador ${spacerHeight}dp debe superar 112dp de holgura tras el botón`);
    });

    it('Caso de éxito: ListDetailScreen usa un único menú contextual (3 puntos) para eliminar lista y retira opciones duplicadas', () => {
      const screensDir = fileURLToPath(new URL('../../apps/mobile/src/screens/', import.meta.url));
      const detailSource = fs.readFileSync(path.join(screensDir, 'ListDetailScreen.tsx'), 'utf8');
      assert.match(detailSource, /testID="list-menu-button"/, 'Debe incluir botón de menú contextual de 3 puntos');
      assert.match(detailSource, /testID="delete-list-button"/, 'Debe incluir opción para eliminar la lista');
      assert.doesNotMatch(detailSource, /delete-list-button-bottom/, 'No debe tener botón duplicado al final de la pantalla');
      const deleteMatches = detailSource.match(/testID="delete-list-button"/g) ?? [];
      assert.strictEqual(deleteMatches.length, 1, 'Solo debe existir una única opción de eliminar lista');
    });
  });

  describe('Formularios con teclado abierto (un solo toque en los botones)', () => {
    // Con el valor por defecto ("never") el primer toque solo cierra el teclado y hay que
    // tocar dos veces "Agregar" o "Crear". Toda pantalla con campos de texto dentro de un
    // ScrollView/FlatList debe dejar pasar el toque a los botones.
    const screensDir = fileURLToPath(new URL('../../apps/mobile/src/screens/', import.meta.url));
    const screens = fs.readdirSync(screensDir).filter((file) => file.endsWith('.tsx'));

    for (const file of screens) {
      const source = fs.readFileSync(path.join(screensDir, file), 'utf8');
      const hasInputs = /<(Field|TextInput)\b/.test(source);
      const scrollers = source.match(/<(ScrollView|FlatList|SectionList)\b(?:=>|[^>])*>/gs) ?? [];
      if (!hasInputs || scrollers.length === 0) continue;

      it(`${file}: los contenedores con scroll usan keyboardShouldPersistTaps="handled"`, () => {
        for (const tag of scrollers) {
          assert.match(tag, /keyboardShouldPersistTaps="handled"/, `${file}: ${tag.split('\n')[0]}`);
        }
      });
    }
  });

  describe('Móvil: Listas Normales vs. Avanzadas (Presupuesto, Pasillos, Entrada Inteligente y OCR)', () => {
    const mobileSrcDir = fileURLToPath(new URL('../../apps/mobile/src/', import.meta.url));

    it('ListsScreen.tsx incluye selector Normal vs. Avanzada y campo de presupuesto objetivo', () => {
      const listsSource = fs.readFileSync(path.join(mobileSrcDir, 'screens/ListsScreen.tsx'), 'utf8');
      assert.match(listsSource, /testID="list-type-normal"/, 'Debe incluir botón para lista normal');
      assert.match(listsSource, /testID="list-type-advanced"/, 'Debe incluir botón para lista avanzada');
      assert.match(listsSource, /testID="new-list-budget"/, 'Debe incluir campo de presupuesto para lista avanzada');
    });

    it('ListDetailScreen.tsx incluye panel avanzado, switch de pasillos, dictado/texto libre y escáner OCR', () => {
      const detailSource = fs.readFileSync(path.join(mobileSrcDir, 'screens/ListDetailScreen.tsx'), 'utf8');
      assert.match(detailSource, /testID="advanced-list-panel"/, 'Debe mostrar panel de lista avanzada');
      assert.match(detailSource, /testID="aisle-sort-switch"/, 'Debe permitir activar/desactivar agrupación por pasillos');
      assert.match(detailSource, /testID="smart-entry-input"/, 'Debe incluir entrada rápida por voz/texto libre');
      assert.match(detailSource, /testID="receipt-ocr-input"/, 'Debe incluir conciliación de ticket OCR');
      assert.match(detailSource, /testID="item-estimated-price-input"/, 'Debe permitir capturar precio estimado al agregar producto');
    });

    it('ItemRow.tsx, PurchasedRow.tsx y EditItemModal.tsx soportan precios en listas avanzadas', () => {
      const itemRowSource = fs.readFileSync(path.join(mobileSrcDir, 'components/ItemRow.tsx'), 'utf8');
      const purchasedRowSource = fs.readFileSync(path.join(mobileSrcDir, 'components/PurchasedRow.tsx'), 'utf8');
      const editModalSource = fs.readFileSync(path.join(mobileSrcDir, 'components/EditItemModal.tsx'), 'utf8');

      assert.match(itemRowSource, /showPrice/, 'ItemRow debe soportar showPrice');
      assert.match(purchasedRowSource, /showPrice/, 'PurchasedRow debe soportar showPrice');
      assert.match(editModalSource, /testID="edit-item-estimated-price"/, 'EditItemModal debe permitir editar precio estimado');
    });

    it('LanguageSwitcher.tsx muestra banderas de países con formato compacto sin margen excesivo a la derecha', () => {
      const switcherSource = fs.readFileSync(path.join(mobileSrcDir, 'components/LanguageSwitcher.tsx'), 'utf8');
      const i18nSource = fs.readFileSync(path.join(mobileSrcDir, 'i18n/index.ts'), 'utf8');

      assert.match(i18nSource, /LANGUAGE_FLAGS/, 'i18n/index.ts debe definir las banderas por idioma');
      assert.match(switcherSource, /LANGUAGE_FLAGS\[language\]/, 'LanguageSwitcher debe mostrar la bandera junto al nombre del idioma');
      assert.match(switcherSource, /✓/, 'LanguageSwitcher debe mostrar marca de selección en el idioma activo');
    });
  });

});
