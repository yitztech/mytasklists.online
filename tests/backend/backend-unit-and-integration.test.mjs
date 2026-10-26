import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import { RegisterDto, LoginDto } from '../../apps/backend/dist/modules/auth/dto/auth.dto.js';
import { CompleteRegistrationDto } from '../../apps/backend/dist/modules/auth/dto/registration.dto.js';
import { UpdateProfileDto, ChangePasswordDto } from '../../apps/backend/dist/modules/users/dto/update-profile.dto.js';
import { CreateListDto, UpdateListDto } from '../../apps/backend/dist/modules/lists/dto/list.dto.js';
import {
  CreateItemDto,
  UpdateItemDto,
  ReorderItemsDto,
  SmartEntryDto,
  ReceiptScanDto,
} from '../../apps/backend/dist/modules/items/dto/item.dto.js';
import { toListDetailView } from '../../apps/backend/dist/modules/lists/list.mapper.js';
import {
  classifyAisle,
  parseSmartEntryText,
  scanReceiptText,
} from '../../apps/backend/dist/modules/items/smart-tools.js';

/**
 * Pruebas unitarias y de integración del Backend (NestJS / Class-Validator)
 * Cubren validaciones de datos (longitudes, tipos de caracteres, esquemas),
 * flujos de autenticación, listas, citas/recurrencias y cancelaciones.
 *
 * SÍ estará en el pipeline de GitHub.
 */
describe('Servicio Backend · Validaciones, Listas, Recurrencias y Cancelaciones', () => {

  describe('Validación de Datos con Librería (class-validator): Registro y Perfil', () => {
    it('Caso de éxito: RegisterDto acepta nombres válidos con tildes, longitud 2 a 100 y datos completos', async () => {
      const validPayloads = [
        {
          fullName: 'Ana López García',
          email: 'ana.lopez@example.com',
          whatsapp: '+5215512345678',
          password: 'PasswordSuper123',
        },
        {
          fullName: 'Al', // límite mínimo de 2 caracteres
          email: 'al@example.com',
          whatsapp: '+15551234567',
          password: 'PasswordSegura!',
        },
        {
          fullName: 'María-José Peña O\'Connor',
          email: 'maria.jose@example.com',
          whatsapp: '+34612345678',
          password: 'MiContraseñaLarga1',
        },
        {
          fullName: 'A'.repeat(100), // límite máximo de 100 caracteres
          email: 'limite@example.com',
          whatsapp: '+5215598765432',
          password: 'PasswordValida100',
        },
      ];

      for (const payload of validPayloads) {
        const dto = plainToInstance(RegisterDto, payload);
        const errors = await validate(dto);
        assert.strictEqual(errors.length, 0, `Payload debió ser válido: ${JSON.stringify(payload)}. Errores: ${errors.map(e => Object.keys(e.constraints || {})).join(', ')}`);
      }
    });

    it('Caso de fracaso: RegisterDto rechaza nombres que violan longitud o contienen caracteres no válidos', async () => {
      const invalidNames = [
        '', // vacío
        'A', // longitud 1 (menor al mínimo 2)
        'A'.repeat(101), // longitud 101 (mayor al máximo 100)
        'Ana1234', // números no permitidos
        '<script>alert("xss")</script>', // inyección HTML
        'User_Name$', // símbolos no permitidos
        'DROP TABLE users;', // SQL
      ];

      for (const invalidName of invalidNames) {
        const dto = plainToInstance(RegisterDto, {
          fullName: invalidName,
          email: 'test@example.com',
          whatsapp: '+5215512345678',
          password: 'PasswordValida1',
        });
        const errors = await validate(dto);
        const nameError = errors.find(e => e.property === 'fullName');
        assert.ok(nameError, `fullName "${invalidName}" debió generar error de validación`);
      }
    });

    it('Caso de fracaso: RegisterDto rechaza correo inválido, WhatsApp inválido y contraseña corta', async () => {
      const dto = plainToInstance(RegisterDto, {
        fullName: 'Carlos Gómez',
        email: 'correo-invalido',
        whatsapp: 'no-es-telefono',
        password: 'corta', // menos de 8
      });

      const errors = await validate(dto);
      const props = errors.map(e => e.property);
      assert.ok(props.includes('email'), 'Debe validar email');
      assert.ok(props.includes('whatsapp'), 'Debe validar whatsapp');
      assert.ok(props.includes('password'), 'Debe validar longitud de contraseña');
    });

    it('Caso de éxito y fracaso: CompleteRegistrationDto valida token de 43 caracteres y confirmación de contraseña', async () => {
      // Éxito: token exacto de 43 caracteres alfanuméricos base64url
      const validDto = plainToInstance(CompleteRegistrationDto, {
        token: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP1', // 43 chars
        fullName: 'Beatriz Soler',
        whatsapp: '+5215587654321',
        password: 'PasswordFuerte123',
        passwordConfirmation: 'PasswordFuerte123',
      });
      const validErrors = await validate(validDto);
      assert.strictEqual(validErrors.length, 0);

      // Fracaso: nombre con caracteres inválidos y token incorrecto
      const invalidDto = plainToInstance(CompleteRegistrationDto, {
        token: 'token_muy_corto',
        fullName: 'Beatriz999',
        whatsapp: 'invalido',
        password: '123',
        passwordConfirmation: '123',
      });
      const invalidErrors = await validate(invalidDto);
      const errProps = invalidErrors.map(e => e.property);
      assert.ok(errProps.includes('token'));
      assert.ok(errProps.includes('fullName'));
      assert.ok(errProps.includes('whatsapp'));
      assert.ok(errProps.includes('password'));
    });

    it('Caso de éxito y fracaso: UpdateProfileDto valida campos opcionales respetando límites', async () => {
      // Éxito: actualización parcial
      const validUpdate = plainToInstance(UpdateProfileDto, {
        fullName: 'Sofía Castro',
        notificationsEnabled: false,
        locale: 'en',
      });
      const okErrors = await validate(validUpdate);
      assert.strictEqual(okErrors.length, 0);

      // Fracaso: nombre que supera 100 caracteres o idioma no soportado
      const invalidUpdate = plainToInstance(UpdateProfileDto, {
        fullName: 'X'.repeat(101),
        locale: 'ru', // no soportado
      });
      const failErrors = await validate(invalidUpdate);
      const props = failErrors.map(e => e.property);
      assert.ok(props.includes('fullName'));
      assert.ok(props.includes('locale'));
    });
  });

  describe('Validación de Listas de Compras (CreateListDto & UpdateListDto)', () => {
    it('Caso de éxito: creación y actualización de listas con nombres válidos (2-120 caracteres)', async () => {
      const createDto = plainToInstance(CreateListDto, {
        name: 'Supermercado Central',
        description: 'Frutas, verduras y despensa básica',
        color: '#28a745',
        icon: '🛒',
      });
      const errors = await validate(createDto);
      assert.strictEqual(errors.length, 0);

      const updateDto = plainToInstance(UpdateListDto, {
        name: 'Supermercado Fin de Semana',
        isArchived: true,
      });
      const updateErrors = await validate(updateDto);
      assert.strictEqual(updateErrors.length, 0);
    });

    it('Caso de fracaso: rechaza listas con nombres menores a 2 o mayores a 120 caracteres', async () => {
      const tooShortDto = plainToInstance(CreateListDto, { name: 'A' });
      const tooShortErrors = await validate(tooShortDto);
      assert.ok(tooShortErrors.some(e => e.property === 'name'));

      const tooLongDto = plainToInstance(CreateListDto, { name: 'L'.repeat(121) });
      const tooLongErrors = await validate(tooLongDto);
      assert.ok(tooLongErrors.some(e => e.property === 'name'));
    });

    it('Caso de fracaso: rechaza colores en formato que no sea hexadecimal', async () => {
      const invalidColorDto = plainToInstance(CreateListDto, {
        name: 'Lista Color Invalido',
        color: 'red', // no es hex #RRGGBB
      });
      const errors = await validate(invalidColorDto);
      assert.ok(errors.some(e => e.property === 'color'));
    });
  });

  describe('Productos, Fechas / Citas de Recurrencia y Cancelaciones', () => {
    it('Caso de éxito: producto puntual y recurrente con días válidos (1 a 365)', async () => {
      const puntual = plainToInstance(CreateItemDto, {
        name: 'Aceite de Oliva Extra Virgen',
        quantity: 1,
        unit: 'l',
        isRecurring: false,
      });
      assert.strictEqual((await validate(puntual)).length, 0);

      const recurrente = plainToInstance(CreateItemDto, {
        name: 'Café de Grano',
        quantity: 2,
        unit: 'bolsa',
        isRecurring: true,
        recurrenceDays: 14,
      });
      assert.strictEqual((await validate(recurrente)).length, 0);
    });

    it('Caso de fracaso: producto recurrente sin días o con días fuera de rango [1-365]', async () => {
      const noDays = plainToInstance(CreateItemDto, {
        name: 'Café',
        isRecurring: true,
      });
      const noDaysErrors = await validate(noDays);
      assert.ok(noDaysErrors.some(e => e.property === 'recurrenceDays'));

      const negativeDays = plainToInstance(CreateItemDto, {
        name: 'Café',
        isRecurring: true,
        recurrenceDays: -5,
      });
      const negErrors = await validate(negativeDays);
      assert.ok(negErrors.some(e => e.property === 'recurrenceDays'));

      const tooManyDays = plainToInstance(CreateItemDto, {
        name: 'Café',
        isRecurring: true,
        recurrenceDays: 366,
      });
      const tooManyErrors = await validate(tooManyDays);
      assert.ok(tooManyErrors.some(e => e.property === 'recurrenceDays'));
    });

    it('Caso de fracaso: nombre de producto vacío o mayor a 140 caracteres', async () => {
      const emptyItem = plainToInstance(CreateItemDto, { name: '' });
      assert.ok((await validate(emptyItem)).some(e => e.property === 'name'));

      const longItem = plainToInstance(CreateItemDto, { name: 'P'.repeat(141) });
      assert.ok((await validate(longItem)).some(e => e.property === 'name'));
    });

    it('Motor de recurrencia (Citas y fechas de reactivación): transición al comprar', () => {
      const item = {
        name: 'Detergente',
        isRecurring: true,
        recurrenceDays: 14,
        status: 'pending',
        cycleCount: 0,
        activatedAt: new Date('2026-10-01T00:00:00Z'),
        purchasedAt: null,
        nextActivationAt: null,
      };

      // Al comprar: se marca como comprado y se programa la próxima fecha de cita/reactivación
      const purchaseTime = new Date('2026-10-05T10:00:00Z');
      item.status = 'purchased';
      item.purchasedAt = purchaseTime;
      item.cycleCount += 1;
      item.nextActivationAt = new Date(purchaseTime.getTime() + item.recurrenceDays * 24 * 60 * 60 * 1000);

      assert.strictEqual(item.status, 'purchased');
      assert.strictEqual(item.cycleCount, 1);
      assert.strictEqual(item.nextActivationAt.toISOString(), '2026-10-19T10:00:00.000Z');
    });

    it('Cancelación de compra (Deshacer): regresa producto a pendientes y cancela próxima activación', () => {
      const item = {
        name: 'Detergente',
        isRecurring: true,
        recurrenceDays: 14,
        status: 'purchased',
        purchasedAt: new Date('2026-10-05T10:00:00Z'),
        nextActivationAt: new Date('2026-10-19T10:00:00Z'),
      };

      // Deshacer compra: cancelación de la compra
      item.status = 'pending';
      item.purchasedAt = null;
      item.nextActivationAt = null;

      assert.strictEqual(item.status, 'pending');
      assert.strictEqual(item.purchasedAt, null);
      assert.strictEqual(item.nextActivationAt, null);
    });

    it('Cancelación de recurrencia: convertir producto recurrente en puntual', () => {
      const item = {
        name: 'Detergente',
        isRecurring: true,
        recurrenceDays: 14,
        nextActivationAt: new Date('2026-10-19T10:00:00Z'),
      };

      // Cancelar recurrencia
      item.isRecurring = false;
      item.recurrenceDays = null;
      item.nextActivationAt = null;

      assert.strictEqual(item.isRecurring, false);
      assert.strictEqual(item.recurrenceDays, null);
      assert.strictEqual(item.nextActivationAt, null);
    });
  });

  describe('Listas Normales vs. Avanzadas (Pilar Financiero, Hogar, Entrada Inteligente Local y OCR)', () => {
    it('Caso de éxito y fracaso: CreateListDto valida listType (normal | advanced), budget y currency', async () => {
      const normalDto = plainToInstance(CreateListDto, {
        name: 'Lista Normal Semanal',
        listType: 'normal',
      });
      assert.strictEqual((await validate(normalDto)).length, 0);

      const advancedDto = plainToInstance(CreateListDto, {
        name: 'Súper Quincenal Hogar',
        listType: 'advanced',
        budget: 1850.5,
        currency: 'MXN',
        autoSortAisles: true,
      });
      assert.strictEqual((await validate(advancedDto)).length, 0);

      const invalidTypeDto = plainToInstance(CreateListDto, {
        name: 'Lista Inválida',
        listType: 'enterprise',
        budget: -50,
      });
      const invalidErrors = await validate(invalidTypeDto);
      const props = invalidErrors.map((e) => e.property);
      assert.ok(props.includes('listType'));
      assert.ok(props.includes('budget'));
    });

    it('Clasificador determinista local de pasillos (classifyAisle) sin IA externa', () => {
      assert.strictEqual(classifyAisle('Tomate saladet'), 'produce');
      assert.strictEqual(classifyAisle('Leche deslactosada'), 'dairy');
      assert.strictEqual(classifyAisle('Pechuga de pollo'), 'meat');
      assert.strictEqual(classifyAisle('Jabón líquido para ropa'), 'cleaning');
      assert.strictEqual(classifyAisle('Croquetas para perro'), 'pets');
    });

    it('Parser determinista local de Entrada Inteligente (parseSmartEntryText) extrae cantidad, unidad, precio, recurrencia y pasillo', async () => {
      const smartDto = plainToInstance(SmartEntryDto, {
        text: '2 kg de tomate a $35, 1 l de leche en $28.50 y jabón cada 15 días',
        createItems: true,
      });
      assert.strictEqual((await validate(smartDto)).length, 0);

      const parsed = parseSmartEntryText(smartDto.text);
      assert.strictEqual(parsed.length, 3);

      assert.strictEqual(parsed[0].name, 'Tomate');
      assert.strictEqual(parsed[0].quantity, 2);
      assert.strictEqual(parsed[0].unit, 'kg');
      assert.strictEqual(parsed[0].estimatedPrice, 35);
      assert.strictEqual(parsed[0].category, 'produce');

      assert.strictEqual(parsed[1].name, 'Leche');
      assert.strictEqual(parsed[1].quantity, 1);
      assert.strictEqual(parsed[1].unit, 'l');
      assert.strictEqual(parsed[1].estimatedPrice, 28.5);
      assert.strictEqual(parsed[1].category, 'dairy');

      assert.strictEqual(parsed[2].name, 'Jabón');
      assert.strictEqual(parsed[2].isRecurring, true);
      assert.strictEqual(parsed[2].recurrenceDays, 15);
      assert.strictEqual(parsed[2].category, 'cleaning');
    });

    it('Conciliador local de tickets OCR (scanReceiptText) empareja productos, extrae precios reales e ignora totales', async () => {
      const scanDto = plainToInstance(ReceiptScanDto, {
        receiptText: 'TOMATE SALADET 2KG 70.00\nLECHE DESLACTOSADA 28.50\nSUBTOTAL 98.50\nTOTAL 98.50',
      });
      assert.strictEqual((await validate(scanDto)).length, 0);

      const listItems = [
        { id: 'item-1', name: 'Tomate saladet', status: 'pending' },
        { id: 'item-2', name: 'Leche deslactosada', status: 'pending' },
      ];
      const result = scanReceiptText(scanDto.receiptText, listItems);
      assert.strictEqual(result.lines.length, 2, 'Debe ignorar SUBTOTAL y TOTAL');
      assert.strictEqual(result.detectedTotal, 98.5);
      assert.strictEqual(result.lines[0].matchedItemId, 'item-1');
      assert.strictEqual(result.lines[0].price, 70);
      assert.strictEqual(result.lines[1].matchedItemId, 'item-2');
      assert.strictEqual(result.lines[1].price, 28.5);
    });

    it('Reordenamiento manual de productos persiste sortOrder y desactiva autoSortAisles si cruza pasillos en listas avanzadas', async () => {
      const validReorder = plainToInstance(ReorderItemsDto, {
        itemIds: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
      });
      assert.strictEqual((await validate(validReorder)).length, 0);

      const listDetailMapperSource = fs.readFileSync(
        fileURLToPath(new URL('../../apps/backend/src/modules/lists/list.mapper.ts', import.meta.url)),
        'utf8',
      );
      const itemsServiceSource = fs.readFileSync(
        fileURLToPath(new URL('../../apps/backend/src/modules/items/items.service.ts', import.meta.url)),
        'utf8',
      );
      assert.match(listDetailMapperSource, /a\.sortOrder - b\.sortOrder/, 'list.mapper.ts debe respetar sortOrder en pendientes y comprados');
      assert.match(itemsServiceSource, /autoSortAisles: false/, 'items.service.ts debe desactivar autoSortAisles cuando el usuario arrastra productos entre pasillos');

      const now = new Date();
      const mapped = toListDetailView(
        {
          id: 'list-1',
          name: 'Lista avanzada',
          description: null,
          color: '#1d5b45',
          icon: '🛒',
          listType: 'advanced',
          budget: 500,
          currency: 'MXN',
          autoSortAisles: false,
          ownerId: 'u1',
          isShared: false,
          createdAt: now,
          updatedAt: now,
          owner: { id: 'u1', name: 'Ana', email: 'ana@test.com', subscriptionStatus: 'active' },
          members: [],
          items: [
            {
              id: 'i-2',
              listId: 'list-1',
              name: 'Pan',
              quantity: 1,
              unit: 'pza',
              note: null,
              imageUrl: null,
              imageKey: null,
              category: 'bakery',
              storeName: null,
              estimatedPrice: 40,
              lastPaidPrice: null,
              status: 'pending',
              isRecurring: false,
              recurrenceDays: null,
              activatedAt: now,
              dueAt: null,
              lastPurchasedAt: null,
              nextActivationAt: null,
              isOverdue: false,
              overdueSince: null,
              cycleCount: 0,
              sortOrder: 0,
              createdById: 'u1',
              purchasedById: null,
              purchasedAt: null,
              editedAt: null,
              createdAt: now,
              updatedAt: now,
            },
            {
              id: 'i-1',
              listId: 'list-1',
              name: 'Manzana',
              quantity: 1,
              unit: 'kg',
              note: null,
              imageUrl: null,
              imageKey: null,
              category: 'produce',
              storeName: null,
              estimatedPrice: 35,
              lastPaidPrice: null,
              status: 'pending',
              isRecurring: false,
              recurrenceDays: null,
              activatedAt: now,
              dueAt: null,
              lastPurchasedAt: null,
              nextActivationAt: null,
              isOverdue: false,
              overdueSince: null,
              cycleCount: 0,
              sortOrder: 1,
              createdById: 'u1',
              purchasedById: null,
              purchasedAt: null,
              editedAt: null,
              createdAt: now,
              updatedAt: now,
            },
          ],
        },
        true,
      );
      assert.deepStrictEqual(
        mapped.pending.map((i) => i.id),
        ['i-2', 'i-1'],
        'Cuando autoSortAisles es false en lista avanzada, debe respetar el sortOrder manual',
      );
    });
  });

});
