#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { SUPPORTED_LOCALES, ENABLED_LOCALES, LOCALE_CONFIG } from '../packages/contracts/locales.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 16);
const normalize = value => value.replace(/\s+/g, ' ').trim();
export const SURFACES = ['frontend', 'dashboard', 'mobile', 'landing', 'backend-errors'];
const read = (root, name) => fs.readFileSync(path.join(root, name), 'utf8');

export function readCatalog(root, surface, locale) {
  if (surface === 'landing') return JSON.parse(read(root, `apps/landing/catalogs/${locale}.json`));
  const name = surface === 'backend-errors'
    ? `apps/backend/src/i18n/errors.${locale === 'es' ? 'en' : locale}.ts`
    : `apps/${surface}/src/i18n/${locale}.ts`;
  const result = ts.transpileModule(read(root, name), {
    fileName: name,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  });
  if (result.diagnostics?.length) throw new Error(`Invalid catalog: ${name}`);
  const context = { exports: {} };
  vm.runInNewContext(result.outputText, context, { timeout: 1000 });
  if (surface === 'backend-errors') {
    const catalog = context.exports[`ERRORS_${(locale === 'es' ? 'en' : locale).toUpperCase()}`];
    return locale === 'es' ? Object.fromEntries(Object.keys(catalog).map(key => [key, key])) : catalog;
  }
  return context.exports[locale];
}

export function flatten(value, prefix = '', result = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid catalog object: ${prefix}`);
  for (const [key, entry] of Object.entries(value)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (typeof entry === 'string') result[full] = entry;
    else flatten(entry, full, result);
  }
  return result;
}

const variables = value => [
  ...[...value.matchAll(/{{\s*-?\s*([^},\s]+)(?:[^}]*)}}/g)].map(match => match[1]),
  ...[...value.matchAll(/__[A-Z][A-Z_]+__/g)].map(match => match[0]),
].sort();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const pluralKey = key => key.match(/^(.*)_(zero|one|two|few|many|other)$/);

export function compareCatalog(source, target, locale, label) {
  const errors = [];
  const missing = [];
  const plurals = new Set(new Intl.PluralRules(LOCALE_CONFIG[locale].intl).resolvedOptions().pluralCategories);
  for (const [key, value] of Object.entries(source)) {
    if (!(key in target)) {
      const plural = pluralKey(key);
      if (!plural || plurals.has(plural[2]) || plural[2] === 'zero') missing.push({ id: `${label}:${locale}:${key}:${hash(value)}`, key });
      continue;
    }
    if (!target[key].trim()) errors.push(`${label}/${locale}: empty ${key}`);
    if (!same(variables(value), variables(target[key]))) errors.push(`${label}/${locale}: interpolation mismatch ${key}`);
  }
  for (const [key, value] of Object.entries(target)) {
    const plural = pluralKey(key);
    const sourcePlural = plural && Object.keys(source).find(k => pluralKey(k)?.[1] === plural[1]);
    if (!(key in source) && !sourcePlural) errors.push(`${label}/${locale}: unknown key ${key}`);
    if (plural && sourcePlural && !same(variables(source[sourcePlural]), variables(value))) errors.push(`${label}/${locale}: interpolation mismatch ${key}`);
    if (!value.trim()) errors.push(`${label}/${locale}: empty ${key}`);
    if (plural && sourcePlural) {
      for (const category of plurals) {
        if (!(`${plural[1]}_${category}` in target)) {
          const key = `${plural[1]}_${category}`;
          const family = Object.entries(source).filter(([k]) => pluralKey(k)?.[1] === plural[1]);
          missing.push({ id: `${label}:${locale}:${key}:${hash(JSON.stringify(family))}`, key });
        }
      }
    }
  }
  return { errors: [...new Set(errors)], missing: [...new Map(missing.map(item => [item.id, item])).values()] };
}

const technicalAttributes = /^(className|class|id|key|type|role|href|src|name|value|testID|data-.+|style|variant|size|lang|htmlFor|target|rel|accessibilityRole)$/;
const uiAttributes = /^(title|placeholder|alt|label|description|message|accessibilityLabel|accessibilityHint|aria-label|aria-description|aria-valuetext)$/;
const meaningful = text => /\p{L}/u.test(text) && !/^(__[A-Z_]+__|https?:|\/|#[\da-f]+$)/i.test(text);

/** AST guard: JSX text/attributes, conditional copy and alert/error call arguments.
 * For non-JSX legacy templates (mail, landing, notifications), every linguistic
 * literal is inventoried until those templates are extracted to catalogs.
 */
export function uiLiterals(source, file) {
  const result = [];
  const add = (node, text) => {
    text = normalize(text);
    if (meaningful(text)) result.push({ file, line: ts.getLineAndCharacterOfPosition(ast, node.getStart(ast)).line + 1, text });
  };
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.JS);
  const templateSurface = /apps\/landing\/|\/mail\.templates\.ts$|\/notification\.texts\.ts$|\/errors\.en\.ts$/.test(file);
  const visit = node => {
    if (ts.isJsxText(node)) add(node, node.text);
    if (ts.isTemplateExpression(node)) {
      const text = [node.head.text, ...node.templateSpans.map(span => span.literal.text)].join(' … ');
      if (templateSurface || (file.endsWith('.tsx') && /\p{L}{2,}/u.test(text))) add(node, text);
    }
    if (ts.isStringLiteralLike(node)) {
      const parent = node.parent;
      if (ts.isJsxAttribute(parent)) {
        if (uiAttributes.test(parent.name.getText(ast))) add(node, node.text);
      } else {
        let current = parent;
        // Also catch copy stored in variables before it is rendered in JSX.
        let ui = file.endsWith('.tsx') && (/\s/.test(node.text) || /^[A-Z][a-z]+$/.test(node.text));
        if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) || ts.isLiteralTypeNode(parent)) ui = false;
        while (current && !ts.isStatement(current)) {
          if (ts.isJsxAttribute(current)) { ui = !technicalAttributes.test(current.name.getText(ast)); break; }
          if (ts.isJsxExpression(current)) { ui = true; break; }
          if (ts.isConditionalExpression(current)) ui = true;
          current = current.parent;
        }
        if (ts.isCallExpression(parent)) {
          const call = parent.expression.getText(ast);
          if (/(^|\.)(alert|confirm|prompt|showError|setError|setNotice|toast)$/.test(call)) ui = true;
          // Translation keys and machine identifiers aren't displayed copy.
          if (/(^|\.)(t|navigate|replace|includes|startsWith|endsWith)$/.test(call)) ui = false;
        }
        if (ts.isNewExpression(parent) && /(Exception|Error)$/.test(parent.expression.getText(ast))) ui = true;
        if (ui || (templateSurface && /\s|[^\x00-\x7F]/.test(node.text))) add(node, node.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  if (!file.endsWith('.html') && !file.endsWith('.json')) visit(ast);
  if (file.endsWith('.html')) {
    // HTML text and accessible attributes; preserve duplicate counts.
    const clean = source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
    for (const match of clean.matchAll(/>([^<>]+)</g)) if (meaningful(normalize(match[1]))) result.push({ file, line: source.slice(0, match.index).split('\n').length, text: normalize(match[1]) });
    for (const match of clean.matchAll(/(?:title|placeholder|alt|aria-label)="([^"]+)"/g)) if (meaningful(match[1])) result.push({ file, line: 1, text: normalize(match[1]) });
  }
  if (file.endsWith('.json')) {
    const visitJson = (value, key = '') => {
      if (typeof value === 'string' && (/UsageDescription$|Permission$/i.test(key))) {
        if (meaningful(value)) result.push({ file, line: 1, text: normalize(value) });
      } else if (value && typeof value === 'object') {
        for (const [child, item] of Object.entries(value)) visitJson(item, child);
      }
    };
    visitJson(JSON.parse(source));
  }
  return result;
}

function filesUnder(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (['node_modules', 'dist', 'android', 'ios', '.expo'].includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(full) : [full];
  });
}

export function collectDebt(root = ROOT) {
  const missing = [];
  const errors = [];
  for (const surface of SURFACES) {
    const source = flatten(readCatalog(root, surface, 'es'));
    for (const locale of SUPPORTED_LOCALES) {
      const comparison = compareCatalog(source, flatten(readCatalog(root, surface, locale)), locale, surface);
      errors.push(...comparison.errors);
      missing.push(...comparison.missing);
    }
  }
  const literals = {};
  const examples = {};
  const errorKeys = new Set(Object.keys(readCatalog(root, 'backend-errors', 'es')));
  for (const app of ['frontend', 'dashboard', 'mobile', 'landing', 'backend']) {
    const candidates = filesUnder(path.join(root, 'apps', app, 'src'));
    if (app === 'landing') candidates.push(path.join(root, 'apps/landing/build.mjs'));
    if (app === 'mobile') candidates.push(path.join(root, 'apps/mobile/app.json'));
    for (const filename of candidates) {
      const file = path.relative(root, filename).split(path.sep).join('/');
      if (!/\.(tsx?|jsx?|mjs|html|json)$/.test(file) || /\/i18n\//.test(file)) continue;
      for (const item of uiLiterals(read(root, file), file)) {
        if (app === 'backend' && errorKeys.has(item.text)) continue;
        const id = `${file}:${hash(item.text)}`;
        literals[id] = (literals[id] ?? 0) + 1;
        examples[id] = item;
      }
    }
  }
  return { missing, literals, examples, errors };
}

export function check(root = ROOT, { release } = {}) {
  const baseline = JSON.parse(read(root, 'scripts/i18n-debt.json'));
  const collected = collectDebt(root);
  const errors = [...collected.errors];
  for (const item of collected.missing) {
    const locale = item.id.split(':')[1];
    const newlyEnabled = ENABLED_LOCALES.includes(locale) && !['es', 'en'].includes(locale);
    if (release === locale || newlyEnabled || !baseline.missing.includes(item.id)) errors.push(`Missing translation ${item.id}`);
  }
  for (const [id, count] of Object.entries(collected.literals)) {
    if (count > (baseline.literals[id]?.count ?? 0)) {
      const item = collected.examples[id];
      errors.push(`${item.file}:${item.line}: uncatalogued UI text ${JSON.stringify(item.text).slice(0, 180)}`);
    }
  }
  if (release && !SUPPORTED_LOCALES.includes(release)) errors.push(`Unknown release locale ${release}`);
  if ((release && !['es', 'en'].includes(release)) || ENABLED_LOCALES.some(locale => !['es', 'en'].includes(locale))) {
    // These surfaces still contain inline bilingual copy. A full release needs
    // extraction, translations and a matching runtime activation, not just UI catalogs.
    if (Object.keys(collected.literals).some(id => /apps\/(landing|backend)\//.test(id))) errors.push(`Release ${release ?? 'enabled locale'}: legacy landing/backend templates still require catalog extraction and translation`);
  }
  return { errors, collected };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const release = process.argv.find(arg => arg.startsWith('--release='))?.split('=')[1];
    const { errors, collected } = check(ROOT, { release });
    if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
    else console.log(`i18n OK: ${SURFACES.length} catalog surfaces, ${SUPPORTED_LOCALES.length} planned locales; ${collected.missing.length} existing missing translations, ${Object.keys(collected.literals).length} existing literal groups tracked. Enabled: ${ENABLED_LOCALES.join(', ')}.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
