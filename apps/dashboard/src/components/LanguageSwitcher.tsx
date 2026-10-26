import { LOCALE_CONFIG } from '@lista/contracts/locales';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ESCAPE_KEY,
  LANGUAGES,
  currentLanguage,
  getLanguageOptionClass,
  getLanguageOptionTestId,
  setLanguage,
  type Language,
} from '../i18n';

function FlagIcon({ code }: { code: Language }) {
  switch (code) {
    case 'es':
      return (
        <svg viewBox="0 0 28 20" width="100%" height="100%" aria-hidden="true">
          <rect width="28" height="20" fill="#c60b1e" />
          <rect y="5" width="28" height="10" fill="#ffc400" />
          <circle cx="7.5" cy="10" r="1.9" fill="#c60b1e" />
          <rect x="6.6" y="8.2" width="1.8" height="2.4" fill="#ffc400" />
        </svg>
      );
    case 'en':
      return (
        <svg viewBox="0 0 28 20" width="100%" height="100%" aria-hidden="true">
          <rect width="28" height="20" fill="#ffffff" />
          <rect y="0" width="28" height="1.54" fill="#b22234" />
          <rect y="3.08" width="28" height="1.54" fill="#b22234" />
          <rect y="6.15" width="28" height="1.54" fill="#b22234" />
          <rect y="9.23" width="28" height="1.54" fill="#b22234" />
          <rect y="12.31" width="28" height="1.54" fill="#b22234" />
          <rect y="15.38" width="28" height="1.54" fill="#b22234" />
          <rect y="18.46" width="28" height="1.54" fill="#b22234" />
          <rect width="12.5" height="10.77" fill="#3c3b6e" />
          <circle cx="2.5" cy="2.3" r="0.65" fill="#ffffff" />
          <circle cx="5.2" cy="2.3" r="0.65" fill="#ffffff" />
          <circle cx="7.9" cy="2.3" r="0.65" fill="#ffffff" />
          <circle cx="10.5" cy="2.3" r="0.65" fill="#ffffff" />
          <circle cx="3.8" cy="4.3" r="0.65" fill="#ffffff" />
          <circle cx="6.5" cy="4.3" r="0.65" fill="#ffffff" />
          <circle cx="9.2" cy="4.3" r="0.65" fill="#ffffff" />
          <circle cx="2.5" cy="6.3" r="0.65" fill="#ffffff" />
          <circle cx="5.2" cy="6.3" r="0.65" fill="#ffffff" />
          <circle cx="7.9" cy="6.3" r="0.65" fill="#ffffff" />
          <circle cx="10.5" cy="6.3" r="0.65" fill="#ffffff" />
          <circle cx="3.8" cy="8.3" r="0.65" fill="#ffffff" />
          <circle cx="6.5" cy="8.3" r="0.65" fill="#ffffff" />
          <circle cx="9.2" cy="8.3" r="0.65" fill="#ffffff" />
        </svg>
      );
    case 'pt':
      return (
        <svg viewBox="0 0 28 20" width="100%" height="100%" aria-hidden="true">
          <rect width="28" height="20" fill="#009b3a" />
          <polygon points="14,2.4 25.2,10 14,17.6 2.8,10" fill="#fedf00" />
          <circle cx="14" cy="10" r="4.2" fill="#002776" />
          <path d="M10.1 9.1c2.5-0.8 5.4-0.4 7.8 1.3" stroke="#ffffff" strokeWidth="1.1" fill="none" />
        </svg>
      );
    case 'de':
      return (
        <svg viewBox="0 0 28 20" width="100%" height="100%" aria-hidden="true">
          <rect width="28" height="6.67" fill="#000000" />
          <rect y="6.67" width="28" height="6.67" fill="#dd0000" />
          <rect y="13.33" width="28" height="6.67" fill="#ffce00" />
        </svg>
      );
    case 'fr':
      return (
        <svg viewBox="0 0 28 20" width="100%" height="100%" aria-hidden="true">
          <rect width="9.33" height="20" fill="#002654" />
          <rect x="9.33" width="9.34" height="20" fill="#ffffff" />
          <rect x="18.67" width="9.33" height="20" fill="#ce1126" />
        </svg>
      );
  }
}

/** Selector común de idioma. La elección se guarda en el navegador. */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const active = currentLanguage();

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ESCAPE_KEY) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`lc-lang ${className}`} data-testid="language-switcher">
      <span className="visually-hidden">{t('language.label')}</span>
      <select
        className="lc-lang-native"
        aria-label={t('language.label')}
        value={active}
        tabIndex={-1}
        onChange={(event) => {
          setLanguage(event.target.value as Language);
          setOpen(false);
        }}
      >
        {LANGUAGES.map((language) => (
          <option key={language} value={language} lang={language} data-testid={`language-${language}`}>
            {LOCALE_CONFIG[language].name}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="lc-lang-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('language.label')}
        data-testid="language-switcher-trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="lc-lang-code" data-testid="language-switcher-code">
          {active.toUpperCase()}
        </span>
        <svg className="lc-lang-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
          <path d="M0.5 0.75L5 5.25L9.5 0.75H0.5Z" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div
          className="lc-lang-menu"
          role="listbox"
          aria-label={t('language.label')}
          data-testid="language-switcher-menu"
        >
          {LANGUAGES.map((language) => {
            const selected = language === active;
            return (
              <button
                key={language}
                type="button"
                role="option"
                aria-selected={selected}
                lang={language}
                className={getLanguageOptionClass(selected)}
                data-testid={getLanguageOptionTestId(language)}
                onClick={() => {
                  setLanguage(language);
                  setOpen(false);
                }}
              >
                <span className="lc-lang-flag" aria-hidden="true">
                  <FlagIcon code={language} />
                </span>
                <span className="lc-lang-name">{LOCALE_CONFIG[language].name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
