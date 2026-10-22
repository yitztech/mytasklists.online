/**
 * Servidor estático mínimo para el bundle web de la app React Native.
 * Lo genera con `expo export` si no existe o si cambió el código de la app.
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { extname, join, normalize } from 'node:path';
import { mobileSourceHash } from '../../scripts/lib/mobile-verification.mjs';

const execFileAsync = promisify(execFile);

const PORT = Number(process.env.E2E_MOBILE_PORT ?? 19006);
const MOBILE_DIR = new URL('../../apps/mobile/', import.meta.url).pathname;
const DIST = join(MOBILE_DIR, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

// Se regenera cuando cambia el código de la app; siempre contra la pila local (nunca producción)
const sourceHash = mobileSourceHash();
const stampFile = join(DIST, '.source-hash');
const current = existsSync(stampFile) ? readFileSync(stampFile, 'utf8') : '';
if (!existsSync(join(DIST, 'index.html')) || current !== sourceHash) {
  console.error('[mobile-web] generando el bundle web con expo export…');
  await execFileAsync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', 'dist', '--clear'], {
    cwd: MOBILE_DIR,
    env: {
      ...process.env,
      CI: '1',
      EXPO_PUBLIC_API_URL: 'http://localhost:8080/api',
      EXPO_PUBLIC_SOCKET_URL: 'http://localhost:8080',
      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: '',
    },
    maxBuffer: 32 * 1024 * 1024,
  });
  writeFileSync(stampFile, sourceHash);
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const requested = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(DIST, requested);

  if (!existsSync(filePath) || requested === '/' || requested === '\\') {
    filePath = join(DIST, 'index.html'); // SPA fallback
  }

  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('no encontrado');
  }
}).listen(PORT, () => {
  console.error(`[mobile-web] sirviendo ${DIST} en http://localhost:${PORT}`);
});
