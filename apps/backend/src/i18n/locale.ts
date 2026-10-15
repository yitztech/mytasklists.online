import { DEFAULT_LOCALE, isLocale, normalizeLocale, resolveEnabledLocale, type Locale } from '@lista/contracts/locales';
export { DEFAULT_LOCALE, isLocale, resolveEnabledLocale } from '@lista/contracts/locales';
import { ERRORS_EN } from './errors.en';

export type { Locale };

/**
 * Primer idioma soportado de `Accept-Language`, respetando los pesos:
 * "en-US,en;q=0.9,es;q=0.8" → en. Se conserva la preferencia aunque su catálogo aún no esté habilitado.
 */
export function localeFromHeader(header: string | string[] | undefined): Locale {
  const value = Array.isArray(header) ? header.join(',') : (header ?? '');
  const ranked = value
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().toLowerCase().split(';');
      const q = params.find((param) => param.trim().startsWith('q='));
      return { lang: normalizeLocale(tag), weight: q ? Number(q.trim().slice(2)) || 0 : 1, index };
    })
    .filter((entry) => entry.lang && Number.isFinite(entry.weight) && entry.weight > 0 && entry.weight <= 1)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  return ranked.map((entry) => entry.lang).find(isLocale) ?? DEFAULT_LOCALE;
}

/** Mensaje para el cliente en su idioma; el español es el texto original */
export const translateMessage = (message: string, locale: Locale): string =>
  resolveEnabledLocale(locale) === 'en' ? (ERRORS_EN[message] ?? message) : message;
