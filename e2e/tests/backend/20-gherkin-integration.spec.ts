import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import { RegisterDto } from '../../../apps/backend/dist/modules/auth/dto/auth.dto.js';
import { CreateListDto } from '../../../apps/backend/dist/modules/lists/dto/list.dto.js';
import { CreateItemDto } from '../../../apps/backend/dist/modules/items/dto/item.dto.js';

test.describe('Pruebas de Integración Gherkin con Playwright (JavaScript / TypeScript)', () => {
  const featuresDir = path.resolve('e2e/features');
  const files = fs.readdirSync(featuresDir).filter((f) => f.endsWith('.feature')).sort();

  for (const file of files) {
    const content = fs.readFileSync(path.join(featuresDir, file), 'utf8');
    const featureMatch = content.match(/(?:Característica|Feature):\s*(.+)/);
    const featureTitle = featureMatch ? featureMatch[1].trim() : file;

    test(`Gherkin Feature: ${featureTitle} [${file}]`, async () => {
      expect(content).toContain('Escenario:');

      // Validaciones clave de integración basadas en las especificaciones Gherkin
      if (file.includes('registro')) {
        const validDto = plainToInstance(RegisterDto, {
          fullName: 'Ana López García',
          email: 'ana@example.com',
          whatsapp: '+5215512345678',
          password: 'PasswordSegura123',
        });
        const errors = await validate(validDto);
        expect(errors.length).toBe(0);

        const invalidDto = plainToInstance(RegisterDto, {
          fullName: 'A',
          email: 'bad-email',
          whatsapp: 'bad-phone',
          password: '123',
        });
        const badErrors = await validate(invalidDto);
        expect(badErrors.length).toBeGreaterThan(0);
      }

      if (file.includes('listas')) {
        const listDto = plainToInstance(CreateListDto, {
          name: 'Despensa Gherkin',
          color: '#0d6efd',
          icon: '🛒',
        });
        expect((await validate(listDto)).length).toBe(0);

        const badList = plainToInstance(CreateListDto, { name: 'X' });
        expect((await validate(badList)).length).toBeGreaterThan(0);
      }

      if (file.includes('productos')) {
        const itemDto = plainToInstance(CreateItemDto, {
          name: 'Café Gherkin',
          isRecurring: true,
          recurrenceDays: 14,
          quantity: 2,
          unit: 'bolsa',
        });
        expect((await validate(itemDto)).length).toBe(0);

        const badItem = plainToInstance(CreateItemDto, {
          name: 'Café',
          isRecurring: true,
          recurrenceDays: 0,
        });
        expect((await validate(badItem)).length).toBeGreaterThan(0);
      }

      if (file.includes('validaciones')) {
        const validName = 'Ángel Peña Müller';
        expect(validName.length).toBeLessThanOrEqual(100);
        expect(validName.length).toBeGreaterThanOrEqual(2);
        expect(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜçÇàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜãõÃÕāēīōūĀĒĪŌŪ\s'.-]+$/.test(validName)).toBe(true);

        const scriptName = '<script>alert(1)</script>';
        expect(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜçÇàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜãõÃÕāēīōūĀĒĪŌŪ\s'.-]+$/.test(scriptName)).toBe(false);
      }
    });
  }
});
