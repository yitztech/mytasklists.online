// Catálogos de la landing por idioma; el build los aplica sobre el HTML español.
import { readFileSync } from 'node:fs';
const read = locale => JSON.parse(readFileSync(new URL(`./catalogs/${locale}.json`, import.meta.url), 'utf8'));
export const CATALOGS = Object.fromEntries(['es', 'en', 'pt', 'de', 'fr'].map(locale => [locale, read(locale)]));
export const EN = CATALOGS.en;
