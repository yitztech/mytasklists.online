#!/usr/bin/env node
// Corta cualquier generación de la app (APK, build de tienda, OTA) si su código no
// pasó las pruebas en simulador. Uso: node scripts/mobile-gate.mjs [ios|android]
import { assertMobileVerified } from './lib/mobile-verification.mjs';

try {
  const verification = assertMobileVerified({ platform: process.argv[2] });
  const runs = Object.entries(verification.runs)
    .map(([platform, run]) => `${platform} (${run.device}, ${run.passedAt})`)
    .join(', ');
  console.log(`App verificada en simulador: ${runs}.`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
