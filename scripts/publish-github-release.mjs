#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const [versionArg, rootArg] = process.argv.slice(2);
const root = resolve(rootArg || 'downloads');

let version = versionArg;
let file;

let manifest = null;
try {
  manifest = JSON.parse(await readFile(join(root, 'android.json'), 'utf8'));
} catch {}

if (!version) {
  if (manifest?.version && manifest?.file) {
    version = manifest.version;
    file = manifest.file;
  } else {
    throw new Error('No se pudo leer downloads/android.json y no se especificó versión.');
  }
} else {
  file = `mytasklists-${version}.apk`;
}

const apkPath = join(root, file);
let apkStat;
try {
  apkStat = await stat(apkPath);
} catch {
  throw new Error(`El archivo APK ${apkPath} no existe. Ejecuta primero la compilación.`);
}

const tag = `v${version}`;
console.log(`Publicando ${file} en GitHub Release (${tag})...`);

const sizeMb = ((manifest?.size || apkStat.size) / 1048576).toFixed(1);
const shaInfo = manifest?.sha256 ? `\n* **SHA-256**: \`${manifest.sha256}\`` : '';
const notes = `Versión ${version} de MyTaskLists.\n\n### Descargas\n* **APK Android (firmada)**: \`${file}\` (${sizeMb} MB)\n* Compatible con Android 7.0+${shaInfo}\n* Instalación directa sin depender de tiendas.`;

// Comprobar si la release ya existe
let releaseExists = false;
try {
  execFileSync('gh', ['release', 'view', tag], { stdio: 'pipe' });
  releaseExists = true;
} catch {
  releaseExists = false;
}

if (releaseExists) {
  console.log(`La release ${tag} ya existe. Subiendo/reemplazando APK...`);
  execFileSync('gh', ['release', 'upload', tag, apkPath, '--clobber'], { stdio: 'inherit' });
  try {
    execFileSync('gh', ['release', 'edit', tag, '--notes', notes], { stdio: 'pipe' });
  } catch {}
} else {
  console.log(`Creando nueva release ${tag} con ${file}...`);
  execFileSync('gh', [
    'release', 'create', tag, apkPath,
    '--title', `Release ${tag}`,
    '--notes', notes
  ], { stdio: 'inherit' });
}

console.log(`✅ Publicado exitosamente en GitHub Releases: https://github.com/yitztech/mytasklists.online/releases/tag/${tag}`);
