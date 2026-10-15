import { ENABLED_LOCALES, isEnabledLocale } from '@lista/contracts/locales';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { es } from './es';
import { en } from './en';
import { pt } from './pt';
import { de } from './de';
import { fr } from './fr';

// Draft locales stay hidden until their release coverage is complete.
export const LANGUAGES = ENABLED_LOCALES;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = 'lc.mobile.lang';

const isLanguage = (value: unknown): value is Language => isEnabledLocale(value);

/** Primer idioma del teléfono que soportamos; en otro idioma la app se ve en inglés */
function deviceLanguage(): Language {
  for (const locale of getLocales()) {
    if (isLanguage(locale.languageCode)) return locale.languageCode;
  }
  return 'en';
}

export const currentLanguage = (): Language => (isLanguage(i18n.language) ? i18n.language : 'es');

export function setLanguage(language: Language): void {
  if (!isLanguage(language)) return;
  void i18n.changeLanguage(language);
  AsyncStorage.setItem(STORAGE_KEY, language).catch(() => undefined);
}

void i18n.use(initReactI18next).init({
  supportedLngs: [...LANGUAGES],
  resources: { es: { translation: es }, en: { translation: en }, pt: { translation: pt }, de: { translation: de }, fr: { translation: fr } },
  lng: deviceLanguage(),
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
});

// La elección guardada gana sobre el idioma del teléfono
AsyncStorage.getItem(STORAGE_KEY)
  .then((stored) => {
    if (isLanguage(stored) && stored !== i18n.language) void i18n.changeLanguage(stored);
  })
  .catch(() => undefined);

export default i18n;
