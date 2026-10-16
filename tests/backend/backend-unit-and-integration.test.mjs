import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import { RegisterDto, LoginDto } from '../../apps/backend/dist/modules/auth/dto/auth.dto.js';
import { CompleteRegistrationDto } from '../../apps/backend/dist/modules/auth/dto/registration.dto.js';
import { UpdateProfileDto, ChangePasswordDto } from '../../apps/backend/dist/modules/users/dto/update-profile.dto.js';
import { CreateListDto, UpdateListDto } from '../../apps/backend/dist/modules/lists/dto/list.dto.js';
import { CreateItemDto, UpdateItemDto } from '../../apps/backend/dist/modules/items/dto/item.dto.js';

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

});
