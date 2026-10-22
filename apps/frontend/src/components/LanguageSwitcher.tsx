import { LOCALE_CONFIG } from '@lista/contracts/locales';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, setLanguage } from '../i18n';

/** Selector común de idioma. La elección se guarda y se sincroniza con la cuenta. */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { t, i18n } = useTranslation();

  return (
    <label className={`lc-lang ${className}`} data-testid="language-switcher">
      <span className="visually-hidden">{t('language.label')}</span>
      <i className="bi bi-translate" aria-hidden="true" />
      <select
        aria-label={t('language.label')}
        value={i18n.language}
        onChange={(event) => setLanguage(event.target.value as (typeof LANGUAGES)[number])}
    >
        {LANGUAGES.map((language) => (
          <option key={language} value={language} lang={language} data-testid={`language-${language}`}>
            {LOCALE_CONFIG[language].name}
          </option>
        ))}
      </select>
    </label>
  );
}
