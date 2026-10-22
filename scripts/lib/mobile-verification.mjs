// Huella del código de la app móvil y registro de su última verificación en simulador.
// Una app (APK, build de tienda u OTA) solo se genera si las pruebas de simulador
// pasaron con exactamente este código: `npm run mobile:test`.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const ROOT = resolve(new URL('../../', import.meta.url).pathname);
/** Versionado a propósito: CI comprueba que el código publicado es el verificado */
export const VERIFICATION_FILE = 'apps/mobile/.maestro/verificacion.json';
const SOURCES = ['apps/mobile', 'packages/contracts', 'packages/ui-data'];

/** Archivos versionados o nuevos (sin los ignorados) de la app y lo que comparte con el servidor */
export function mobileSourceHash(root = ROOT) {
  const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z', '--', ...SOURCES], { cwd: root, encoding: 'utf8' })
    .split('\0')
    .filter((file) => file && file !== VERIFICATION_FILE)
    .sort();
  const hash = createHash('sha256');
  for (const file of files) {
    let content;
    try {
      content = readFileSync(join(root, file));
    } catch (error) {
      if (error.code === 'ENOENT') continue; // borrado en el árbol de trabajo
      throw error;
    }
    hash.update(file).update('\0').update(content).update('\0');
  }
  return hash.digest('hex');
}

export const appVersion = (root = ROOT) =>
  JSON.parse(readFileSync(join(root, 'apps/mobile/app.json'), 'utf8')).expo.version;

export function readVerification(root = ROOT) {
  try {
    return JSON.parse(readFileSync(join(root, VERIFICATION_FILE), 'utf8'));
  } catch {
    return null;
  }
}

export function writeVerification(entry, root = ROOT) {
  const previous = readVerification(root);
  const runs = { ...(previous?.sourceHash === entry.sourceHash ? previous.runs : {}), [entry.platform]: entry.run };
  const verification = { sourceHash: entry.sourceHash, version: entry.version, runs };
  writeFileSync(join(root, VERIFICATION_FILE), JSON.stringify(verification, null, 2) + '\n');
  return verification;
}

/** Lanza un error explicativo si el código actual no pasó las pruebas en simulador */
export function assertMobileVerified({ root = ROOT, platform } = {}) {
  const current = mobileSourceHash(root);
  const verification = readVerification(root);
  const help = 'Ejecuta antes las pruebas en simulador: npm run mobile:test (ver docs/PRUEBAS-MOVILES.md).';
  if (!verification) throw new Error(`La app no tiene pruebas en simulador registradas. ${help}`);
  if (verification.sourceHash !== current) {
    throw new Error(`El código de la app cambió desde la última verificación en simulador. ${help}`);
  }
  const runs = Object.entries(verification.runs ?? {});
  if (!runs.length) throw new Error(`La verificación no registra ninguna plataforma. ${help}`);
  if (platform && !verification.runs[platform]) {
    console.warn(`Aviso: la verificación se hizo en ${runs.map(([name]) => name).join(', ')}, no en ${platform}.`);
  }
  return verification;
}
