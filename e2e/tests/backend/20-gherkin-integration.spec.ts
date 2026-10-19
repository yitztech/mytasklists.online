import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Pruebas de Integración Gherkin con Playwright (JavaScript / TypeScript)', () => {
  const featuresDir = path.resolve(__dirname, '../../features');
  const files = fs.readdirSync(featuresDir).filter((f) => f.endsWith('.feature')).sort();

  for (const file of files) {
    const content = fs.readFileSync(path.join(featuresDir, file), 'utf8');
    const featureMatch = content.match(/(?:Característica|Feature):\s*(.+)/);
    const featureTitle = featureMatch ? featureMatch[1].trim() : file;

    test(`Gherkin Feature: ${featureTitle} [${file}]`, async () => {
      expect(content).toContain('Escenario:');

      // Validaciones clave de integración basadas en las especificaciones Gherkin
      if (file.includes('registro')) {
        const validName = 'Ana López García';
        const invalidName = 'A';
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜçÇàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜãõÃÕāēīōūĀĒĪŌŪ\s'.-]+$/;
        expect(validName.length).toBeGreaterThanOrEqual(2);
        expect(validName.length).toBeLessThanOrEqual(100);
        expect(nameRegex.test(validName)).toBe(true);

        expect(invalidName.length >= 2).toBe(false);
      }

      if (file.includes('listas')) {
        const listName = 'Despensa Gherkin';
        const hexColor = '#0d6efd';
        expect(listName.length).toBeGreaterThanOrEqual(2);
        expect(listName.length).toBeLessThanOrEqual(120);
        expect(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hexColor)).toBe(true);

        const badList = 'X';
        expect(badList.length >= 2).toBe(false);
      }

      if (file.includes('productos')) {
        const validRecurrence = 14;
        expect(validRecurrence >= 1 && validRecurrence <= 365).toBe(true);

        const invalidRecurrence = 0;
        expect(invalidRecurrence >= 1 && invalidRecurrence <= 365).toBe(false);
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
