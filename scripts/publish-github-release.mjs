#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const [versionArg, rootArg] = process.argv.slice(2);
const root = resolve(rootArg || 'downloads');

let version = versionArg;
let file;

if (!version) {
  try {
    const manifest = JSON.parse(await readFile(join(root, 'android.json'), 'utf8'));
    version = manifest.version;
    file = manifest.file;
  } catch (err) {
    throw new Error('No se pudo leer downloads/android.json y no se especificó versión.');
  }
} else {
  file = `mytasklists-${version}.apk`;
}

const apkPath = join(root, file);
try {
  await stat(apkPath);
} catch {
  throw new Error(`El archivo APK ${apkPath} no existe. Ejecuta primero la compilación.`);
}

const tag = `v${version}`;
console.log(`Publicando ${file} en GitHub Release (${tag})...`);

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
} else {
  console.log(`Creando nueva release ${tag} con ${file}...`);
  execFileSync('gh', [
    'release', 'create', tag, apkPath,
    '--title', `Release ${tag}`,
    '--notes', `Versión ${version} de MyTaskLists.\n\n### Descargas\n* **APK Android (firmada)**: \`${file}\`\n* Compatible con Android 7.0+\n* Instalación directa sin depender de tiendas.`
  ], { stdio: 'inherit' });
}

console.log(`✅ Publicado exitosamente en GitHub Releases: https://github.com/yitztech/mytasklists.online/releases/tag/${tag}`);
