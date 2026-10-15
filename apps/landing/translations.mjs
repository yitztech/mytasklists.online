// Existing build import retained; the source now lives in locale catalogs.
import { readFileSync } from 'node:fs';
export const EN = JSON.parse(readFileSync(new URL('./catalogs/en.json', import.meta.url), 'utf8'));
