/** Locales published consistently across web, native apps, API, email and push. */
const SUPPORTED_LOCALES = Object.freeze(['es', 'en', 'pt', 'de', 'fr']);
const ENABLED_LOCALES = SUPPORTED_LOCALES;
/** Values understood by `User.locale` in already published clients. */
const LEGACY_LOCALES = Object.freeze(['es', 'en']);
const DEFAULT_LOCALE = 'es';
const LOCALE_CONFIG = Object.freeze({
  es: Object.freeze({ intl: 'es-MX', name: 'Español' }),
  en: Object.freeze({ intl: 'en-US', name: 'English' }),
  pt: Object.freeze({ intl: 'pt-BR', name: 'Português' }),
  de: Object.freeze({ intl: 'de-DE', name: 'Deutsch' }),
  fr: Object.freeze({ intl: 'fr-FR', name: 'Français' }),
});
const isLocale = (value) => SUPPORTED_LOCALES.includes(value);
const isEnabledLocale = (value) => ENABLED_LOCALES.includes(value);
/** Normalize a device or Accept-Language tag to a published locale. */
const normalizeLocale = (value) => {
  if (typeof value !== 'string') return undefined;
  const base = value.trim().toLowerCase().replace(/_/g, '-').split('-')[0];
  return isLocale(base) ? base : undefined;
};
/** Resolve a locale to the shared published policy. */
const resolveEnabledLocale = (value) => {
  const locale = normalizeLocale(value);
  return isEnabledLocale(locale) ? locale : DEFAULT_LOCALE;
};
/** Compatibility value for published clients; the full choice travels in `preferredLocale`. */
const resolveLegacyLocale = (value) => {
  const locale = normalizeLocale(value);
  return LEGACY_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
};
exports.SUPPORTED_LOCALES = SUPPORTED_LOCALES;
exports.ENABLED_LOCALES = ENABLED_LOCALES;
exports.LEGACY_LOCALES = LEGACY_LOCALES;
exports.DEFAULT_LOCALE = DEFAULT_LOCALE;
exports.LOCALE_CONFIG = LOCALE_CONFIG;
exports.isLocale = isLocale;
exports.isEnabledLocale = isEnabledLocale;
exports.normalizeLocale = normalizeLocale;
exports.resolveEnabledLocale = resolveEnabledLocale;
exports.resolveLegacyLocale = resolveLegacyLocale;
