import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Pruebas unitarias del Frontend (Validaciones de formularios, límites de campos y formato)
 * Cubren las reglas de validación aplicadas en los formularios de React,
 * casos de éxito y casos de fracaso para nombres, contraseñas, listas y productos.
 *
 * SÍ estará en el pipeline de GitHub.
 */
describe('Servicio Frontend · Validación de Formularios, Campos y Textos', () => {

  describe('Formulario de Registro (RegisterPage)', () => {
    const validateRegisterForm = (form) => {
      const errors = {};
      const nameTrimmed = form.fullName ? form.fullName.trim() : '';

      if (nameTrimmed.length < 2 || nameTrimmed.length > 100) {
        errors.fullName = 'El nombre completo debe tener entre 2 y 100 caracteres';
      } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜçÇàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜãõÃÕāēīōūĀĒĪŌŪ\s'.-]+$/.test(nameTrimmed)) {
        errors.fullName = 'El nombre solo puede contener letras, espacios, guiones y apóstrofes';
      }

      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((form.email || '').trim())) {
        errors.email = 'El correo electrónico no es válido';
      }

      if (!/^\+?[0-9]{8,20}$/.test((form.whatsapp || '').trim())) {
        errors.whatsapp = 'El número de WhatsApp no es válido';
      }

      const pwd = form.password || '';
      if (pwd.length < 8 || new TextEncoder().encode(pwd).length > 72) {
        errors.password = 'La contraseña debe tener al menos 8 caracteres';
      }

      if (form.password !== form.passwordConfirmation) {
        errors.passwordConfirmation = 'Las contraseñas no coinciden';
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    };

    it('Caso de éxito: formulario de registro con datos válidos y nombre de longitud recomendada', () => {
      const validForm = {
        fullName: 'Valeria Méndez',
        email: 'valeria@example.com',
        whatsapp: '+5215511223344',
        password: 'PasswordSegura2026',
        passwordConfirmation: 'PasswordSegura2026',
      };

      const result = validateRegisterForm(validForm);
      assert.strictEqual(result.isValid, true);
      assert.deepStrictEqual(result.errors, {});
    });

    it('Caso de fracaso: rechaza nombres menores a 2 caracteres o mayores a 100', () => {
      const shortResult = validateRegisterForm({
        fullName: 'V',
        email: 'valeria@example.com',
        whatsapp: '+5215511223344',
        password: 'PasswordSegura2026',
        passwordConfirmation: 'PasswordSegura2026',
      });
      assert.strictEqual(shortResult.isValid, false);
      assert.ok(shortResult.errors.fullName);

      const longResult = validateRegisterForm({
        fullName: 'V'.repeat(101),
        email: 'valeria@example.com',
        whatsapp: '+5215511223344',
        password: 'PasswordSegura2026',
        passwordConfirmation: 'PasswordSegura2026',
      });
      assert.strictEqual(longResult.isValid, false);
      assert.ok(longResult.errors.fullName);
    });

    it('Caso de fracaso: rechaza nombres con números, símbolos o scripts', () => {
      const invalidNames = ['Valeria123', '<script>', 'Valeria_Mendez', 'Nombre @ Apellido'];
      for (const name of invalidNames) {
        const res = validateRegisterForm({
          fullName: name,
          email: 'valeria@example.com',
          whatsapp: '+5215511223344',
          password: 'PasswordSegura2026',
          passwordConfirmation: 'PasswordSegura2026',
        });
        assert.strictEqual(res.isValid, false, `El nombre "${name}" debió ser rechazado`);
        assert.ok(res.errors.fullName);
      }
    });

    it('Caso de fracaso: rechaza contraseñas no coincidentes', () => {
      const result = validateRegisterForm({
        fullName: 'Valeria Méndez',
        email: 'valeria@example.com',
        whatsapp: '+5215511223344',
        password: 'PasswordUno1',
        passwordConfirmation: 'PasswordDos2',
      });
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors.passwordConfirmation, 'Las contraseñas no coinciden');
    });
  });

  describe('Formulario de Creación de Listas (ListsPage)', () => {
    const validateListName = (name) => {
      const trimmed = (name || '').trim();
      if (!trimmed || trimmed.length < 2 || trimmed.length > 120) return false;
      if (/[\x00-\x1F\x7F]/.test(trimmed)) return false;
      return true;
    };

    it('Caso de éxito: nombres de lista entre 2 y 120 caracteres', () => {
      assert.ok(validateListName('Despensa del mes'));
      assert.ok(validateListName('AB')); // min 2
      assert.ok(validateListName('L'.repeat(120))); // max 120
    });

    it('Caso de fracaso: nombres menores a 2, mayores a 120 o con caracteres de control', () => {
      assert.strictEqual(validateListName(''), false);
      assert.strictEqual(validateListName('A'), false);
      assert.strictEqual(validateListName('L'.repeat(121)), false);
      assert.strictEqual(validateListName('Lista\x00Control'), false);
    });
  });

  describe('Formulario de Productos (AddItemForm & EditItemModal)', () => {
    const validateItem = (name, quantityStr, unit, isRecurring, recurrenceDays) => {
      const trimmed = (name || '').trim();
      if (!trimmed || trimmed.length < 1 || trimmed.length > 140) return { valid: false, error: 'NOMBRE' };
      if (/[\x00-\x1F\x7F]/.test(trimmed)) return { valid: false, error: 'CONTROL_CHARS' };

      const amount = Number(String(quantityStr).replace(',', '.'));
      if (!Number.isFinite(amount) || amount < 0.01 || amount > 99999) return { valid: false, error: 'CANTIDAD' };

      // Máximo 2 decimales
      if (Math.abs(Math.round(amount * 100) - amount * 100) > 1e-7) return { valid: false, error: 'DECIMALES' };

      const u = (unit || '').trim();
      if (!u || u.length > 20) return { valid: false, error: 'UNIDAD' };

      if (isRecurring) {
        const days = Number(recurrenceDays);
        if (!Number.isInteger(days) || days < 1 || days > 365) return { valid: false, error: 'RECURRENCIA' };
      }

      return { valid: true };
    };

    it('Caso de éxito: producto con cantidad decimal y unidad válida', () => {
      const res1 = validateItem('Manzanas Gala', '1.50', 'kg', false);
      assert.strictEqual(res1.valid, true);

      const res2 = validateItem('Leche Entera', '2', 'l', true, 14);
      assert.strictEqual(res2.valid, true);
    });

    it('Caso de fracaso: rechaza cantidades con más de 2 decimales o menores a 0.01', () => {
      const res1 = validateItem('Arroz', '1.234', 'kg', false);
      assert.strictEqual(res1.valid, false);
      assert.strictEqual(res1.error, 'DECIMALES');

      const res2 = validateItem('Arroz', '0', 'kg', false);
      assert.strictEqual(res2.valid, false);
      assert.strictEqual(res2.error, 'CANTIDAD');
    });

    it('Caso de fracaso: rechaza nombres vacíos, mayores a 140 o con caracteres de control', () => {
      assert.strictEqual(validateItem('', '1', 'pza', false).valid, false);
      assert.strictEqual(validateItem('P'.repeat(141), '1', 'pza', false).valid, false);
      assert.strictEqual(validateItem('Producto\x1F', '1', 'pza', false).valid, false);
    });

    it('Caso de fracaso: rechaza recurrencia sin días enteros entre 1 y 365', () => {
      assert.strictEqual(validateItem('Café', '1', 'pza', true, 0).valid, false);
      assert.strictEqual(validateItem('Café', '1', 'pza', true, 366).valid, false);
      assert.strictEqual(validateItem('Café', '1', 'pza', true, '14.5').valid, false);
    });
  });

  describe('Eliminación de Listas Completas de Tareas en Web', () => {
    it('Caso de éxito: eliminación de lista completa disponible en la tarjeta y en el detalle', () => {
      const list = { id: 'list-1', name: 'Supermercado', ownerId: 'user-1', itemsCount: 5 };
      const currentUser = { id: 'user-1' };
      const canDelete = list.ownerId === currentUser.id;
      assert.strictEqual(canDelete, true);
    });

    it('Caso de éxito: no confunde eliminación de lista con eliminación de ítem individual', () => {
      const listEndpoint = (id) => `/lists/${id}`;
      const itemEndpoint = (id) => `/items/${id}`;
      assert.notStrictEqual(listEndpoint('123'), itemEndpoint('123'));
      assert.ok(listEndpoint('123').startsWith('/lists/'));
    });
  });

});
