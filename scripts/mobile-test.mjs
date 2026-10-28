#!/usr/bin/env node
/**
 * Pruebas de la app nativa en un simulador local (solo desarrollo, a pedido).
 *
 *   npm run mobile:test                       iOS, primer simulador de iPhone instalado
 *   npm run mobile:test -- --platform android  emulador «Medium_Tablet» (API 35)
 *   opciones: --device <nombre>  --rebuild  --web (además, la app en el navegador)
 *
 * Requiere la pila de Docker arriba (`npm run up`). Para ir rápido:
 * - el binario solo se recompila si cambia su huella nativa (fingerprint de Expo);
 *   el JavaScript llega por Metro, así que un cambio de JS no recompila nada;
 * - todos los flujos comparten una cuenta creada aquí, por API, antes de empezar.
 * Si todo pasa, registra la verificación en apps/mobile/.maestro/verificacion.json:
 * sin ella no se puede generar ninguna app (scripts/mobile-gate.mjs).
 */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { ROOT, appVersion, mobileSourceHash, writeVerification } from './lib/mobile-verification.mjs';

const { values: options } = parseArgs({
  options: {
    platform: { type: 'string', default: 'ios' },
    device: { type: 'string' },
    rebuild: { type: 'boolean', default: false },
    web: { type: 'boolean', default: false },
  },
});
const platform = options.platform;
if (!['ios', 'android'].includes(platform)) throw new Error('--platform debe ser ios o android');

const MOBILE = join(ROOT, 'apps/mobile');
const APP_ID = 'online.mytasklists.app';
const API_URL = 'http://127.0.0.1:8084/api';
const MAILPIT_URL = 'http://127.0.0.1:8028';
const METRO_PORT = 8081;
const ANDROID_SDK = process.env.ANDROID_HOME || join(homedir(), 'Library/Android/sdk');
const ADB = join(ANDROID_SDK, 'platform-tools/adb');
const JAVA_HOME = process.env.JAVA_HOME || '/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home';
// La app de desarrollo habla con la pila local, nunca con producción
const appEnv = {
  ...process.env,
  JAVA_HOME,
  ANDROID_HOME: ANDROID_SDK,
  CI: '1',
  EXPO_PUBLIC_API_URL: 'http://localhost:8084/api',
  EXPO_PUBLIC_SOCKET_URL: 'http://localhost:8084',
};

const log = (message) => console.log(`[mobile-test] ${message}`);
const sh = (command, args, opts = {}) => execFileSync(command, args, { encoding: 'utf8', ...opts }).trim();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const run = (command, args, opts = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...opts });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} ${args[0]} terminó con ${code}`))));
  });

async function reachable(url) {
  try {
    return (await fetch(url, { signal: AbortSignal.timeout(3000) })).ok;
  } catch {
    return false;
  }
}

// ── 1. Pila local ──────────────────────────────────────────────────────────
if (!(await reachable(`${API_URL}/health`))) {
  throw new Error('La pila local no responde en http://localhost:8084. Levántala con: npm run up');
}

// ── 2. Cuenta de prueba (registro completo por correo, vía Mailpit) ────────
async function createAccount() {
  const email = `maestro.${Date.now().toString(36)}@example.com`;
  const password = 'Prueba12345';
  const post = (path, data) =>
    fetch(`${API_URL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const requested = await post('/auth/registration/request', { email });
  if (!requested.ok) throw new Error(`No se pudo pedir el alta (${requested.status}): ${await requested.text()}`);
  let token;
  for (const deadline = Date.now() + 15_000; !token && Date.now() < deadline; await sleep(200)) {
    const search = await (await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`)).json();
    const message = search.messages?.find((item) => item.To.some((to) => to.Address === email));
    if (!message) continue;
    const detail = await (await fetch(`${MAILPIT_URL}/api/v1/message/${message.ID}`)).json();
    token = /register\/complete#token=([\w-]+)/.exec(detail.Text)?.[1];
  }
  if (!token) throw new Error('No llegó el correo de alta a Mailpit (http://localhost:8028)');
  const whatsapp = `+52155${Math.floor(10_000_000 + Math.random() * 89_999_999)}`;
  const completed = await post('/auth/registration/complete', {
    token, fullName: 'Persona Maestro', whatsapp, password, passwordConfirmation: password,
  });
  if (!completed.ok) throw new Error(`No se pudo completar el alta (${completed.status}): ${await completed.text()}`);
  return { email, password };
}

// ── 3. Simulador ───────────────────────────────────────────────────────────
// Sin --device, el primer iPhone instalado: los nombres cambian con cada Xcode.
async function bootIos(requested) {
  const devices = Object.values(JSON.parse(sh('xcrun', ['simctl', 'list', 'devices', 'available', '-j'])).devices).flat();
  const device = requested ? devices.find((item) => item.name === requested) : devices.find((item) => item.name.startsWith('iPhone'));
  const name = device?.name ?? requested ?? 'iPhone';
  if (!device) throw new Error(`No hay un simulador «${name}». Disponibles: ${[...new Set(devices.map((item) => item.name))].join(', ')}`);
  if (device.state !== 'Booted') {
    log(`arrancando el simulador ${name}…`);
    sh('xcrun', ['simctl', 'boot', device.udid]);
  }
  sh('xcrun', ['simctl', 'bootstatus', device.udid, '-b']);
  try {
    sh('open', ['-a', 'Simulator', '--args', '-CurrentDeviceUDID', device.udid]);
  } catch {
    /* sin ventana también funciona */
  }
  return { id: device.udid, name };
}

// Pixel_10 (Android 17, API 37): Maestro 2.11 se cuelga al escribir texto; la imagen de API 35 funciona
async function bootAndroid(name = 'Medium_Tablet') {
  const running = () => sh(ADB, ['devices']).split('\n').slice(1).filter((line) => /\tdevice$/.test(line)).map((line) => line.split('\t')[0]);
  let serial = running().find((id) => id.startsWith('emulator-'));
  if (!serial) {
    log(`arrancando el emulador ${name}…`);
    spawn(join(ANDROID_SDK, 'emulator/emulator'), ['-avd', name, '-no-snapshot-save', '-no-audio', '-no-boot-anim'], { detached: true, stdio: 'ignore' }).unref();
    for (const deadline = Date.now() + 180_000; !serial && Date.now() < deadline; await sleep(2000)) {
      serial = running().find((id) => id.startsWith('emulator-'));
    }
    if (!serial) throw new Error(`El emulador ${name} no arrancó`);
  }
  for (const deadline = Date.now() + 180_000; Date.now() < deadline; await sleep(2000)) {
    if (sh(ADB, ['-s', serial, 'shell', 'getprop', 'sys.boot_completed']) === '1') break;
  }
  // Pantalla encendida y desbloqueada durante las pruebas: dormida, Maestro solo ve negro
  sh(ADB, ['-s', serial, 'shell', 'svc', 'power', 'stayon', 'true']);
  sh(ADB, ['-s', serial, 'shell', 'settings', 'put', 'global', 'stay_on_while_plugged_in', '7']);
  sh(ADB, ['-s', serial, 'shell', 'settings', 'put', 'system', 'screen_off_timeout', '2147483647']);
  sh(ADB, ['-s', serial, 'shell', 'input', 'keyevent', 'KEYCODE_WAKEUP']);
  sh(ADB, ['-s', serial, 'shell', 'wm', 'dismiss-keyguard']);
  // localhost del emulador → tu máquina: API (8084) y Metro (8081)
  for (const port of [8084, METRO_PORT]) sh(ADB, ['-s', serial, 'reverse', `tcp:${port}`, `tcp:${port}`]);
  return { id: serial, name };
}

// ── 4. Metro (sirve el JavaScript actual: los cambios de JS no recompilan) ─
async function ensureMetro() {
  if (await reachable(`http://localhost:${METRO_PORT}/status`)) return null;
  log('arrancando Metro…');
  const metro = spawn('npx', ['expo', 'start', '--port', String(METRO_PORT)], { cwd: MOBILE, env: appEnv, stdio: 'ignore', detached: true });
  for (const deadline = Date.now() + 120_000; Date.now() < deadline; await sleep(1000)) {
    if (await reachable(`http://localhost:${METRO_PORT}/status`)) return metro;
  }
  throw new Error('Metro no arrancó en el puerto 8081');
}

// Precompila el bundle para que la primera apertura no agote la espera de Maestro
async function warmBundle() {
  const url = `http://localhost:${METRO_PORT}/index.bundle?platform=${platform}&dev=true&minify=false`;
  const response = await fetch(url, { signal: AbortSignal.timeout(300_000) });
  if (!response.ok) throw new Error(`Metro no pudo compilar la app (${response.status}): ${(await response.text()).slice(0, 500)}`);
  await response.arrayBuffer();
}

// ── 5. Binario de desarrollo: solo si cambió la huella nativa ──────────────
function installed(device) {
  try {
    if (platform === 'ios') sh('xcrun', ['simctl', 'get_app_container', device.id, APP_ID]);
    else if (!sh(ADB, ['-s', device.id, 'shell', 'pm', 'path', APP_ID])) return false;
    return true;
  } catch {
    return false;
  }
}

async function ensureApp(device) {
  const fingerprint = JSON.parse(sh('npx', ['fingerprint', 'fingerprint:generate', '--platform', platform], { cwd: MOBILE })).hash;
  const stampFile = join(MOBILE, '.maestro', `.build-${platform}.json`);
  const stamp = existsSync(stampFile) ? JSON.parse(readFileSync(stampFile, 'utf8')) : {};
  if (!options.rebuild && stamp.fingerprint === fingerprint && stamp.device === device.id && installed(device)) {
    log('binario al día: se reutiliza');
    return;
  }
  log('compilando e instalando la app de desarrollo (solo cuando cambia la parte nativa)…');
  // ios/ y android/ se generan (CNG): aplica los plugins de app.config.js antes de compilar
  await run('npx', ['expo', 'prebuild', '--platform', platform, '--no-install'], { cwd: MOBILE, env: appEnv });
  const args = platform === 'ios'
    ? ['expo', 'run:ios', '--device', device.id, '--no-bundler']
    // Con --device <AVD>, Expo intenta abrir otra instancia del emulador que ya está arrancado
    : ['expo', 'run:android', '--no-bundler'];
  await run('npx', args, { cwd: MOBILE, env: { ...appEnv, ANDROID_SERIAL: device.id } });
  writeFileSync(stampFile, JSON.stringify({ fingerprint, device: device.id }) + '\n');
}

// ── Ejecución ──────────────────────────────────────────────────────────────
const started = Date.now();
const sourceHash = mobileSourceHash();
const [account, device] = await Promise.all([
  createAccount(),
  platform === 'ios' ? bootIos(options.device) : bootAndroid(options.device),
]);
log(`dispositivo: ${device.name} (${device.id}) · cuenta: ${account.email}`);
const metro = await ensureMetro();
try {
  await Promise.all([ensureApp(device), warmBundle()]);
  const output = join(MOBILE, '.maestro', 'resultados');
  mkdirSync(output, { recursive: true });
  await run('maestro', [
    '--device', device.id, 'test', '.maestro',
    '-e', `EMAIL=${account.email}`, '-e', `PASSWORD=${account.password}`,
    '--format', 'junit', '--output', join(output, `${platform}.xml`), '--test-output-dir', output,
  ], { cwd: MOBILE, env: { ...process.env, JAVA_HOME } });
  if (options.web) await run('npm', ['run', 'test:mobile', '--workspace', 'e2e'], { cwd: ROOT });
  if (mobileSourceHash() !== sourceHash) {
    throw new Error('El código de la app cambió durante las pruebas: vuelve a ejecutarlas.');
  }
  writeVerification({
    sourceHash,
    version: appVersion(),
    platform,
    run: { device: device.name, passedAt: new Date().toISOString() },
  });
  log(`todo en verde en ${Math.round((Date.now() - started) / 1000)} s · verificación registrada en apps/mobile/.maestro/verificacion.json`);
} finally {
  if (metro) process.kill(-metro.pid);
}
