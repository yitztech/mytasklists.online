import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { check, compareCatalog, uiLiterals, ROOT } from './i18n-check.mjs';

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mytasklists-i18n-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const app of ['frontend', 'dashboard', 'mobile', 'landing', 'backend']) {
    fs.mkdirSync(path.join(dir, 'apps', app), { recursive: true });
    fs.cpSync(path.join(ROOT, 'apps', app, 'src'), path.join(dir, 'apps', app, 'src'), { recursive: true });
  }
  fs.cpSync(path.join(ROOT, 'apps/landing/catalogs'), path.join(dir, 'apps/landing/catalogs'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'apps/landing/build.mjs'), path.join(dir, 'apps/landing/build.mjs'));
  fs.copyFileSync(path.join(ROOT, 'apps/mobile/app.json'), path.join(dir, 'apps/mobile/app.json'));
  fs.mkdirSync(path.join(dir, 'scripts'));
  fs.copyFileSync(path.join(ROOT, 'scripts/i18n-debt.json'), path.join(dir, 'scripts/i18n-debt.json'));
  return dir;
}

test('current staged delivery passes without hiding its existing debt', () => {
  const result = check();
  assert.deepEqual(result.errors, []);
  assert.ok(result.collected.missing.length > 0);
});

test('removing the new French Google translation fails the real checker', t => {
  const dir = fixture(t);
  fs.writeFileSync(path.join(dir, 'apps/mobile/src/i18n/fr.ts'), 'export const fr = {};');
  assert.ok(check(dir).errors.some(error => /Missing translation mobile:fr:google.unavailable/.test(error)));
});

test('new JSX literals and copy in variables fail while translation keys do not', t => {
  const dir = fixture(t);
  fs.writeFileSync(path.join(dir, 'apps/frontend/src/NewControl.tsx'), `export const NewControl = () => <button title="New action">Untranslated action</button>;`);
  const errors = check(dir).errors;
  assert.ok(errors.some(error => /NewControl.tsx.*Untranslated action/.test(error)));
  assert.ok(errors.some(error => /NewControl.tsx.*New action/.test(error)));
  const copy = uiLiterals(`const label = 'Hello'; const C = () => <button className="btn btn-primary" title={t('login.title')}>{label}</button>;`, 'apps/frontend/src/C.tsx');
  assert.deepEqual(copy.map(item => item.text), ['Hello']);
});

test('a new source key and a changed source string cannot reuse old missing-translation exemptions', t => {
  const dir = fixture(t);
  const filename = path.join(dir, 'apps/frontend/src/i18n/es.ts');
  fs.appendFileSync(filename, '\nes.newControl = "Nueva acción";\n');
  assert.ok(check(dir).errors.some(error => /frontend:fr:newControl/.test(error)));
  const frFile = path.join(dir, 'apps/frontend/src/i18n/fr.ts');
  fs.writeFileSync(frFile, fs.readFileSync(frFile, 'utf8').replace("loading: 'Chargement…',", ''));
  const debtFile = path.join(dir, 'scripts/i18n-debt.json');
  const debt = JSON.parse(fs.readFileSync(debtFile, 'utf8'));
  debt.missing.push('frontend:fr:common.loading:oldhash');
  fs.writeFileSync(debtFile, JSON.stringify(debt));
  fs.writeFileSync(filename, fs.readFileSync(filename, 'utf8').replace("loading: 'Cargando…'", "loading: 'Cargando tus listas…'"));
  assert.ok(check(dir).errors.some(error => /frontend:fr:common.loading/.test(error)));
});

test('interpolation, placeholders, empty values and unexpected keys fail', () => {
  const result = compareCatalog({ greeting: 'Hola {{name}}', url: '__APP_URL__' }, { greeting: 'Hello {{user}}', url: '', extra: 'Extra' }, 'en', 'test');
  assert.ok(result.errors.some(error => /interpolation mismatch greeting/.test(error)));
  assert.ok(result.errors.some(error => /interpolation mismatch url/.test(error)));
  assert.ok(result.errors.some(error => /empty url/.test(error)));
  assert.ok(result.errors.some(error => /unknown key extra/.test(error)));
});

test('plural categories follow locale rules; missing French many is reported', () => {
  const source = { count_one: '{{count}} artículo', count_other: '{{count}} artículos' };
  const target = { count_one: '{{count}} article', count_other: '{{count}} articles' };
  assert.ok(compareCatalog(source, target, 'fr', 'test').missing.some(item => item.key === 'count_many'));
  assert.deepEqual(compareCatalog(source, target, 'en', 'test').missing, []);
});

test('incomplete locale cannot pass release gate', () => {
  assert.ok(check(ROOT, { release: 'fr' }).errors.some(error => /Missing translation/.test(error)));
  assert.ok(check(ROOT, { release: 'fr' }).errors.some(error => /legacy landing\/backend/.test(error)));
});
