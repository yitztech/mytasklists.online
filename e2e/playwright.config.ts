import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8080';
const MOBILE_URL = process.env.E2E_MOBILE_URL ?? 'http://localhost:19006';

const isCI = !!process.env.CI;

/** La app móvil solo se prueba en local y a pedido: `npm run test:mobile:web` (E2E_MOBILE=1). */
const withMobile = process.env.E2E_MOBILE === '1';

/**
 * El video se graba únicamente en local cuando se solicita de manera explícita:
 *   RECORD_VIDEO=true o E2E_RECORD_VIDEO=true
 * En despliegues / CI y por defecto permanece desactivado ('off') para máximo rendimiento.
 */
const shouldRecordVideo = !isCI && (process.env.RECORD_VIDEO === 'true' || process.env.E2E_RECORD_VIDEO === 'true');
const videoSetting = (size: { width: number; height: number }) =>
  shouldRecordVideo ? ({ mode: 'on' as const, size }) : ('off' as const);

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,

  // Aprovecha al máximo los núcleos de CPU disponibles en el runner/entorno de ejecución,
  // permitiendo sobrescritura manual con PLAYWRIGHT_WORKERS si se desea.
  workers: process.env.PLAYWRIGHT_WORKERS
    ? Number(process.env.PLAYWRIGHT_WORKERS)
    : (isCI ? '100%' : undefined),
  timeout: 60_000,
  expect: { timeout: 10_000 },

  globalSetup: './utils/global-setup.ts',

  reporter: [
    ['list'],
    ['./utils/evidence-reporter.ts'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/resultados.json' }],
  ],

  use: {
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    ignoreHTTPSErrors: true,
  },

  projects: [
    // ── API (sin interfaz: no genera video) ──────────────────────────
    {
      name: 'backend-api',
      testDir: './tests/backend',
      use: {
        baseURL: process.env.E2E_API_URL ?? `${BASE_URL}/api`,
        video: 'off',
      },
    },

    // ── Aplicación web de usuarios ───────────────────────────────────
    {
      name: 'frontend',
      testDir: './tests/frontend',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: BASE_URL,
        viewport: { width: 1280, height: 800 },
        video: videoSetting({ width: 1280, height: 800 }),
      },
    },

    // ── Panel de administración ──────────────────────────────────────
    {
      name: 'dashboard',
      testDir: './tests/dashboard',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: BASE_URL,
        viewport: { width: 1440, height: 900 },
        video: videoSetting({ width: 1440, height: 900 }),
      },
    },

    // ── Landing pública ──────────────────────────────────────────────
    {
      name: 'landing',
      testDir: './tests/landing',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: BASE_URL,
        viewport: { width: 1280, height: 900 },
        video: videoSetting({ width: 1280, height: 900 }),
      },
    },

    // ── App móvil (React Native Web): solo en local y a pedido ───────
    ...(withMobile
      ? [
          {
            name: 'mobile-app',
            testDir: './tests/mobile',
            use: {
              ...devices['Pixel 7'],
              baseURL: MOBILE_URL,
              video: videoSetting({ width: 412, height: 915 }),
            },
          },
        ]
      : []),
  ],

  // Servidor estático del bundle web de la app móvil (solo con E2E_MOBILE=1).
  // El resto de servicios corren en Docker (`docker compose up -d`).
  webServer: !withMobile || process.env.E2E_SKIP_MOBILE_SERVER
    ? undefined
    : {
        command: 'node utils/mobile-web-server.mjs',
        url: MOBILE_URL,
        reuseExistingServer: true,
        timeout: 60_000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
});
