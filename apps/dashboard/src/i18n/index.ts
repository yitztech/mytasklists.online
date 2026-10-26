import { ENABLED_LOCALES, LOCALE_CONFIG, isEnabledLocale } from '@lista/contracts/locales';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { es } from './es';
import { en } from './en';
import { pt } from './pt';
import { de } from './de';
import { fr } from './fr';

export const LANGUAGES = ENABLED_LOCALES;
export type Language = (typeof LANGUAGES)[number];

/** Compartida con la app web y la landing: todos se sirven desde el mismo dominio */
const STORAGE_KEY = 'lc.lang';

const isLanguage = (value: unknown): value is Language => isEnabledLocale(value);

/**
 * La elección guardada gana; si no hay, se usa el primer idioma del navegador que
 * soportamos. Un navegador en otro idioma (francés, alemán…) ve la app en inglés.
 */
export function detectLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored)) return stored;
  } catch {
    /* almacenamiento no disponible */
  }
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of preferred) {
    const base = tag?.toLowerCase().split('-')[0];
    if (isLanguage(base)) return base;
  }
  return 'en';
}

export function setLanguage(language: Language): void {
  if (!isLanguage(language)) return;
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    /* almacenamiento no disponible: el cambio dura hasta recargar */
  }
  void i18n.changeLanguage(language);
}

export const currentLanguage = (): Language => (isLanguage(i18n.language) ? i18n.language : 'es');

/** Formato de fechas y números de cada idioma */
export const LOCALE_TAGS = Object.fromEntries(
  LANGUAGES.map(language => [language, LOCALE_CONFIG[language].intl]),
) as Record<Language, string>;

export const ESCAPE_KEY = 'Escape';
export const getLanguageOptionClass = (selected: boolean): string =>
  selected ? 'lc-lang-option is-selected' : 'lc-lang-option';
export const getLanguageOptionTestId = (language: string): string =>
  'language-option-' + language;

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});

void i18n.use(initReactI18next).init({
  supportedLngs: [...LANGUAGES],
  resources: { es: { translation: es }, en: { translation: en }, pt: { translation: pt }, de: { translation: de }, fr: { translation: fr } },
  lng: detectLanguage(),
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
});

export default i18n;
