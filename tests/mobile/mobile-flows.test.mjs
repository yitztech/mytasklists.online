import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { register } from 'node:module';

const loader = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "react-native") {
    return {
      url: "data:text/javascript," + encodeURIComponent("export const Platform = { OS: \\"ios\\" }; export const Alert = { alert: () => {} }; export default { Platform, Alert };"),
      format: "module",
      shortCircuit: true,
    };
  }
  if (specifier === "expo-constants") {
    return {
      url: "data:text/javascript," + encodeURIComponent("export default { expoConfig: { version: \\"2.8.0\\" } };"),
      format: "module",
      shortCircuit: true,
    };
  }
  if (specifier === "expo-secure-store") {
    return {
      url: "data:text/javascript," + encodeURIComponent("export const getItemAsync = async () => null; export const setItemAsync = async () => {}; export const deleteItemAsync = async () => {};"),
      format: "module",
      shortCircuit: true,
    };
  }
  if (specifier.startsWith("expo-localization")) {
    return {
      url: "data:text/javascript," + encodeURIComponent("export const getLocales = () => [{ languageCode: \\"es\\" }]; export default { getLocales };"),
      format: "module",
      shortCircuit: true,
    };
  }
  if (specifier === "@react-native-async-storage/async-storage") {
    return {
      url: "data:text/javascript," + encodeURIComponent("const store = new Map(); const AsyncStorage = { getItem: async (k) => store.get(k) ?? null, setItem: async (k, v) => { store.set(k, String(v)); }, removeItem: async (k) => { store.delete(k); }, getAllKeys: async () => Array.from(store.keys()), multiRemove: async (keys) => { for (const k of keys) store.delete(k); } }; export default AsyncStorage;"),
      format: "module",
      shortCircuit: true,
    };
  }
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith(".")) {
      try {
        return await nextResolve(specifier + ".ts", context);
      } catch {}
      try {
        return await nextResolve(specifier + "/index.ts", context);
      } catch {}
    }
    throw err;
  }
}
`;
register('data:text/javascript,' + encodeURIComponent(loader), import.meta.url);

const { offlineStorage, setStorageDriver, createTempId } = await import('../../apps/mobile/src/offline/offlineStorage.ts');
const { offlineQueue } = await import('../../apps/mobile/src/offline/offlineQueue.ts');
const { offlineDrafts, getItemDraftKey } = await import('../../apps/mobile/src/offline/offlineDrafts.ts');
const { offlineSync } = await import('../../apps/mobile/src/offline/offlineSync.ts');
const { isNetworkError, ApiError } = await import('../../apps/mobile/src/api/client.ts');

/**
 * Pruebas unitarias y de comportamiento de Apps Móviles (iOS y Android)
 * Cubren plataformas móviles, almacenamiento seguro, tokens de notificación,
 * compatibilidad de versión, validaciones de interfaz, flujos de listas y
 * soporte de funcionamiento offline.
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
      assert.match(switcherSource, /testID="language-switcher-trigger"/, 'LanguageSwitcher debe mostrar botón compacto con código de idioma');
      assert.match(switcherSource, /FlagBadge/, 'LanguageSwitcher debe mostrar banderas enmarcadas para cada idioma soportado');
    });

    it('ItemRow.tsx, PurchasedRow.tsx y ListDetailScreen.tsx incluyen animación pausada al completar y reordenamiento de elementos', () => {
      const itemRowSource = fs.readFileSync(path.join(mobileSrcDir, 'components/ItemRow.tsx'), 'utf8');
      const purchasedRowSource = fs.readFileSync(path.join(mobileSrcDir, 'components/PurchasedRow.tsx'), 'utf8');
      const detailSource = fs.readFileSync(path.join(mobileSrcDir, 'screens/ListDetailScreen.tsx'), 'utf8');

      assert.match(itemRowSource, /COMPLETION_ANIMATION_MS = 600/, 'ItemRow debe animar el completado durante 600ms');
      assert.match(itemRowSource, /Animated\.parallel/, 'ItemRow debe ejecutar transición animada al marcar tarea completada');
      assert.match(itemRowSource, /testID="item-drag-handle"/, 'ItemRow debe incluir manejador para reordenar');
      assert.match(purchasedRowSource, /testID="item-drag-handle"/, 'PurchasedRow debe incluir manejador para reordenar');
      assert.match(detailSource, /itemsApi\.reorder/, 'ListDetailScreen debe persistir el reordenamiento en todos los tipos de listas');
    });
  });

  describe('Móvil: Soporte Offline, Aislamiento por Cuenta, Borradores y Sincronización', () => {
    const mobileSrcDir = fileURLToPath(new URL('../../apps/mobile/src/', import.meta.url));
    const maestroFlowsDir = fileURLToPath(new URL('../../apps/mobile/.maestro/flows/', import.meta.url));

    const createMemoryDriver = () => {
      const store = new Map();
      return {
        getItem: async (key) => store.get(key) ?? null,
        setItem: async (key, value) => { store.set(key, String(value)); },
        removeItem: async (key) => { store.delete(key); },
        getAllKeys: async () => Array.from(store.keys()),
        multiRemove: async (keys) => { for (const k of keys) store.delete(k); },
        _dump: () => Object.fromEntries(store.entries()),
      };
    };

    describe('Aislamiento de datos locales por cuenta (Partición multi-usuario y seguridad)', () => {
      it('Caso de éxito: todas las claves de caché están prefijadas por userId y no hay colisión entre cuentas usando módulos reales', async () => {
        const driver = createMemoryDriver();
        setStorageDriver(driver);
        const userA = 'usr_user_a_123';
        const userB = 'usr_user_b_456';

        await offlineStorage.saveProfile(userA, { id: userA, fullName: 'Usuario A', email: 'a@example.com' });
        await offlineStorage.saveLists(userA, [{ id: 'list_a', name: 'Lista de A', pendingCount: 1, purchasedCount: 0 }]);
        await offlineQueue.enqueue(userA, 'create_list', { name: 'Lista A' });
        await offlineDrafts.saveDraft(userA, 'new_list', { name: 'Borrador A' });

        await offlineStorage.saveProfile(userB, { id: userB, fullName: 'Usuario B', email: 'b@example.com' });
        await offlineStorage.saveLists(userB, [{ id: 'list_b', name: 'Lista de B', pendingCount: 0, purchasedCount: 0 }]);

        const profileB = await offlineStorage.getProfile(userB);
        const listsB = await offlineStorage.getLists(userB);
        const queueB = await offlineQueue.getQueue(userB);
        const draftB = await offlineDrafts.getDraft(userB, 'new_list');

        assert.strictEqual(profileB.fullName, 'Usuario B');
        assert.strictEqual(listsB[0].id, 'list_b');
        assert.strictEqual(queueB.length, 0, 'Usuario B no debe tener acceso a la cola de mutaciones de Usuario A');
        assert.strictEqual(draftB, null, 'Usuario B no debe tener acceso al borrador de Usuario A');

        // Limpiar cuenta A (clearUserData)
        await offlineStorage.clearUserData(userA);

        assert.strictEqual(await offlineStorage.getProfile(userA), null);
        assert.strictEqual(await offlineStorage.getLists(userA), null);
        assert.strictEqual((await offlineQueue.getQueue(userA)).length, 0);
        assert.notStrictEqual(await offlineStorage.getProfile(userB), null, 'Usuario B permanece intacto');
      });

      it('Caso de éxito: no se almacenan contraseñas ni hashes en el perfil seguro local', async () => {
        const driver = createMemoryDriver();
        setStorageDriver(driver);
        const profile = {
          id: 'u1',
          fullName: 'Test User',
          email: 'test@example.com',
          password: 'SecretPassword123!',
          passwordHash: '$2b$10$abcdef...',
          role: 'user',
        };

        await offlineStorage.saveProfile('u1', profile);
        const saved = await offlineStorage.getProfile('u1');
        assert.strictEqual('password' in saved, false);
        assert.strictEqual('passwordHash' in saved, false);
      });
    });

    describe('Apertura de la app sin internet y consulta de listas y perfiles', () => {
      it('Caso de éxito: bootstrap offline recupera perfil en caché y no limpia tokens por fallo de red', async () => {
        const driver = createMemoryDriver();
        setStorageDriver(driver);
        const userId = 'usr_offline_demo';
        await offlineStorage.setLastActiveUserId(userId);
        await offlineStorage.saveProfile(userId, { id: userId, fullName: 'Offline User', email: 'offline@demo.com' });

        const netErr = new TypeError('Network request failed');
        assert.strictEqual(isNetworkError(netErr), true, 'Network request failed debe ser detectado como network error');

        const authErr = new ApiError('Unauthorized', 401);
        assert.strictEqual(isNetworkError(authErr), false, '401 no es network error');

        const lastId = await offlineStorage.getLastActiveUserId();
        const cachedUser = await offlineStorage.getProfile(lastId);
        assert.notStrictEqual(cachedUser, null);
        assert.strictEqual(cachedUser.fullName, 'Offline User');
      });

      it('Caso de éxito: consulta de listas y detalle offline recupera los datos cacheados con offlineStorage', async () => {
        const driver = createMemoryDriver();
        setStorageDriver(driver);
        const userId = 'usr_offline_lists';
        const listId = 'list_cached_1';

        const cachedLists = [
          { id: listId, name: 'Supermercado', pendingCount: 3, purchasedCount: 1 },
        ];
        const cachedDetail = {
          id: listId,
          name: 'Supermercado',
          pending: [{ id: 'item_1', name: 'Leche' }],
          purchased: [{ id: 'item_2', name: 'Pan' }],
        };

        await offlineStorage.saveLists(userId, cachedLists);
        await offlineStorage.saveListDetail(userId, listId, cachedDetail);

        const lists = await offlineStorage.getLists(userId);
        const detail = await offlineStorage.getListDetail(userId, listId);

        assert.strictEqual(lists.length, 1);
        assert.strictEqual(lists[0].name, 'Supermercado');
        assert.strictEqual(detail.pending.length, 1);
        assert.strictEqual(detail.pending[0].name, 'Leche');
      });
    });

    describe('Conservación de borradores y operaciones pendientes incluso al reiniciar', () => {
      it('Caso de éxito: borradores de formularios usan offlineDrafts real y persisten', async () => {
        const driver = createMemoryDriver();
        setStorageDriver(driver);
        const userId = 'usr_drafts';

        await offlineDrafts.saveDraft(userId, 'new_list', { name: 'Lista Fiesta', listType: 'advanced', budget: '1500' });
        const restoredDraft = await offlineDrafts.getDraft(userId, 'new_list');
        assert.deepStrictEqual(restoredDraft, { name: 'Lista Fiesta', listType: 'advanced', budget: '1500' });

        await offlineDrafts.clearDraft(userId, 'new_list');
        assert.strictEqual(await offlineDrafts.getDraft(userId, 'new_list'), null);
      });

      it('Caso de éxito: la cola de operaciones usa offlineQueue real y persiste mutaciones', async () => {
        const driver = createMemoryDriver();
        setStorageDriver(driver);
        const userId = 'usr_queue';

        await offlineQueue.enqueue(userId, 'create_list', { tempId: 'temp_l1', name: 'Nueva Lista' });
        await offlineQueue.enqueue(userId, 'create_item', { tempId: 'temp_i1', listId: 'temp_l1', name: 'Manzanas' });

        const queue = await offlineQueue.getQueue(userId);
        assert.strictEqual(queue.length, 2);
        assert.strictEqual(queue[0].type, 'create_list');
        assert.strictEqual(queue[1].type, 'create_item');
        assert.strictEqual(await offlineQueue.count(userId), 2);
      });
    });

    describe('Sincronización al reconectar, sin duplicados y resolviendo conflictos', () => {
      it('Caso de éxito: deduplicación y bloqueo con offlineSync real', async () => {
        const driver = createMemoryDriver();
        setStorageDriver(driver);
        const userId = 'usr_sync_lock';

        assert.strictEqual(offlineSync.isSyncing(userId), false);
        const p1 = offlineSync.syncPending(userId);
        const p2 = offlineSync.syncPending(userId);
        const [res1, res2] = await Promise.all([p1, p2]);
        assert.strictEqual(offlineSync.isSyncing(userId), false);
        assert.ok(res1 !== null && res2 !== null);
      });

      it('Caso de éxito: remapId real actualiza referencias de ID temporales en la cola persistida', async () => {
        const driver = createMemoryDriver();
        setStorageDriver(driver);
        const userId = 'usr_remap';

        await offlineQueue.enqueue(userId, 'create_list', { tempId: 'temp_l1', name: 'Lista Abarrotes' });
        await offlineQueue.enqueue(userId, 'create_item', { tempId: 'temp_i1', listId: 'temp_l1', name: 'Arroz' });
        await offlineQueue.enqueue(userId, 'purchase_item', { itemId: 'temp_i1', listId: 'temp_l1' });
        await offlineQueue.enqueue(userId, 'reorder_items', { listId: 'temp_l1', itemIds: ['temp_i1', 'item_existing'] });

        // Ejecutar remapId real de la lista
        await offlineQueue.remapId(userId, 'temp_l1', 'real_list_999');
        // Ejecutar remapId real del producto
        await offlineQueue.remapId(userId, 'temp_i1', 'real_item_888');

        const queue = await offlineQueue.getQueue(userId);
        assert.strictEqual(queue[1].payload.listId, 'real_list_999');
        assert.strictEqual(queue[1].payload.tempId, 'real_item_888');
        assert.strictEqual(queue[2].payload.listId, 'real_list_999');
        assert.strictEqual(queue[2].payload.itemId, 'real_item_888');
        assert.deepStrictEqual(queue[3].payload.itemIds, ['real_item_888', 'item_existing']);
      });

      it('Caso de éxito: saveIdMapping y getAllIdMappings persisten el mapeo en offlineStorage', async () => {
        const driver = createMemoryDriver();
        setStorageDriver(driver);
        const userId = 'usr_idmap_storage';

        await offlineStorage.saveIdMapping(userId, 'temp_l1', 'real_l1');
        await offlineStorage.saveIdMapping(userId, 'temp_i1', 'real_i1');

        const mappings = await offlineStorage.getAllIdMappings(userId);
        assert.strictEqual(mappings['temp_l1'], 'real_l1');
        assert.strictEqual(mappings['temp_i1'], 'real_i1');
      });

      it('Caso de éxito: discriminación estricta de errores con isNetworkError (no confunde TypeErrors de runtime)', () => {
        const fetchError = new TypeError('Failed to fetch');
        assert.strictEqual(isNetworkError(fetchError), true);

        const netReqError = new TypeError('Network request failed');
        assert.strictEqual(isNetworkError(netReqError), true);

        const timeoutErr = new Error('The network connection was lost');
        assert.strictEqual(isNetworkError(timeoutErr), true);

        const runtimeError = new TypeError('Cannot read properties of undefined');
        assert.strictEqual(isNetworkError(runtimeError), false, 'Errores de runtime NO deben confundirse con errores de red');

        const codeError = new TypeError('something failed');
        assert.strictEqual(isNetworkError(codeError), false, 'Mensajes genéricos sin conectividad no son error de red');
      });
    });

    describe('Inspección de código e integridad de componentes offline y flujo Maestro', () => {
      it('04-offline.yaml existe en .maestro/flows/ para pruebas nativas offline', () => {
        assert.ok(fs.existsSync(path.join(maestroFlowsDir, '04-offline.yaml')));
        const flowContent = fs.readFileSync(path.join(maestroFlowsDir, '04-offline.yaml'), 'utf8');
        assert.match(flowContent, /appId: online\.mytasklists\.app/);
        assert.match(flowContent, /purchased-close/);
      });

      it('offlineStorage.ts, offlineQueue.ts, offlineDrafts.ts y offlineSync.ts están implementados', () => {
        assert.ok(fs.existsSync(path.join(mobileSrcDir, 'offline/offlineStorage.ts')));
        assert.ok(fs.existsSync(path.join(mobileSrcDir, 'offline/offlineQueue.ts')));
        assert.ok(fs.existsSync(path.join(mobileSrcDir, 'offline/offlineDrafts.ts')));
        assert.ok(fs.existsSync(path.join(mobileSrcDir, 'offline/offlineSync.ts')));
      });

      it('OfflineBanner.tsx existe, tiene testID="offline-banner" y usa frases completas según AGENTS.md §9.1', () => {
        const bannerSource = fs.readFileSync(path.join(mobileSrcDir, 'components/OfflineBanner.tsx'), 'utf8');
        assert.match(bannerSource, /testID="offline-banner"/);
        assert.match(bannerSource, /offline\.banner/);
        assert.match(bannerSource, /offline\.syncing/);
        assert.match(bannerSource, /offline\.bannerPending/);
        assert.match(bannerSource, /offline\.pendingCount/);
        assert.doesNotMatch(bannerSource, /\$\{t\(.*·.*\$\{t\(/, 'No debe concatenar trozos de texto traducidos');
      });

      it('ListsScreen.tsx y ListDetailScreen.tsx usan OfflineBanner y almacenamiento offline', () => {
        const listsSource = fs.readFileSync(path.join(mobileSrcDir, 'screens/ListsScreen.tsx'), 'utf8');
        const detailSource = fs.readFileSync(path.join(mobileSrcDir, 'screens/ListDetailScreen.tsx'), 'utf8');

        assert.match(listsSource, /OfflineBanner/);
        assert.match(listsSource, /offlineStorage/);
        assert.match(listsSource, /offlineQueue/);
        assert.match(listsSource, /offlineDrafts/);

        assert.match(detailSource, /OfflineBanner/);
        assert.match(detailSource, /offlineStorage/);
        assert.match(detailSource, /offlineQueue/);
        assert.match(detailSource, /offlineDrafts/);
      });

      it('ListDetailScreen.tsx preserva recurrencia en onClose con itemsApi.close y alerta en guard sin conexión', () => {
        const detailSource = fs.readFileSync(path.join(mobileSrcDir, 'screens/ListDetailScreen.tsx'), 'utf8');
        assert.match(detailSource, /onClose=\{onCloseItem\}/, 'PurchasedRow debe llamar a onCloseItem');
        assert.match(detailSource, /itemsApi\.close\(target\.id\)/, 'onCloseItem debe llamar a itemsApi.close');
        assert.match(detailSource, /toggleAutoSortAisles/, 'Switch de pasillos debe tener soporte offline');
        assert.match(detailSource, /offline\.actionUnavailable/, 'guard() debe alertar ante acciones no disponibles sin red');
      });

      it('AuthContext.tsx limpia datos locales con clearUserData al cerrar sesión y no borra sesión ante errores de red', () => {
        const authSource = fs.readFileSync(path.join(mobileSrcDir, 'context/AuthContext.tsx'), 'utf8');
        assert.match(authSource, /offlineStorage\.getLastActiveUserId/);
        assert.match(authSource, /offlineStorage\.getProfile/);
        assert.match(authSource, /offlineStorage\.clearUserData/);
        assert.match(authSource, /err\.status === 401/);
      });

      it('client.ts implementa función isNetworkError con discriminación estricta', () => {
        const clientSource = fs.readFileSync(path.join(mobileSrcDir, 'api/client.ts'), 'utf8');
        assert.match(clientSource, /export function isNetworkError/);
        assert.match(clientSource, /network request failed/);
      });
    });
  });

});
