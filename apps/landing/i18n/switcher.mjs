const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const FLAG_SVGS = {
  es: '<svg viewBox="0 0 28 20" width="100%" height="100%" aria-hidden="true"><rect width="28" height="20" fill="#c60b1e"/><rect y="5" width="28" height="10" fill="#ffc400"/><circle cx="7.5" cy="10" r="1.9" fill="#c60b1e"/><rect x="6.6" y="8.2" width="1.8" height="2.4" fill="#ffc400"/></svg>',
  en: '<svg viewBox="0 0 28 20" width="100%" height="100%" aria-hidden="true"><rect width="28" height="20" fill="#ffffff"/><rect y="0" width="28" height="1.54" fill="#b22234"/><rect y="3.08" width="28" height="1.54" fill="#b22234"/><rect y="6.15" width="28" height="1.54" fill="#b22234"/><rect y="9.23" width="28" height="1.54" fill="#b22234"/><rect y="12.31" width="28" height="1.54" fill="#b22234"/><rect y="15.38" width="28" height="1.54" fill="#b22234"/><rect y="18.46" width="28" height="1.54" fill="#b22234"/><rect width="12.5" height="10.77" fill="#3c3b6e"/><circle cx="2.5" cy="2.3" r="0.65" fill="#ffffff"/><circle cx="5.2" cy="2.3" r="0.65" fill="#ffffff"/><circle cx="7.9" cy="2.3" r="0.65" fill="#ffffff"/><circle cx="10.5" cy="2.3" r="0.65" fill="#ffffff"/><circle cx="3.8" cy="4.3" r="0.65" fill="#ffffff"/><circle cx="6.5" cy="4.3" r="0.65" fill="#ffffff"/><circle cx="9.2" cy="4.3" r="0.65" fill="#ffffff"/><circle cx="2.5" cy="6.3" r="0.65" fill="#ffffff"/><circle cx="5.2" cy="6.3" r="0.65" fill="#ffffff"/><circle cx="7.9" cy="6.3" r="0.65" fill="#ffffff"/><circle cx="10.5" cy="6.3" r="0.65" fill="#ffffff"/><circle cx="3.8" cy="8.3" r="0.65" fill="#ffffff"/><circle cx="6.5" cy="8.3" r="0.65" fill="#ffffff"/><circle cx="9.2" cy="8.3" r="0.65" fill="#ffffff"/></svg>',
  pt: '<svg viewBox="0 0 28 20" width="100%" height="100%" aria-hidden="true"><rect width="28" height="20" fill="#009b3a"/><polygon points="14,2.4 25.2,10 14,17.6 2.8,10" fill="#fedf00"/><circle cx="14" cy="10" r="4.2" fill="#002776"/><path d="M10.1 9.1c2.5-0.8 5.4-0.4 7.8 1.3" stroke="#ffffff" stroke-width="1.1" fill="none"/></svg>',
  de: '<svg viewBox="0 0 28 20" width="100%" height="100%" aria-hidden="true"><rect width="28" height="6.67" fill="#000000"/><rect y="6.67" width="28" height="6.67" fill="#dd0000"/><rect y="13.33" width="28" height="6.67" fill="#ffce00"/></svg>',
  fr: '<svg viewBox="0 0 28 20" width="100%" height="100%" aria-hidden="true"><rect width="9.33" height="20" fill="#002654"/><rect x="9.33" width="9.34" height="20" fill="#ffffff"/><rect x="18.67" width="9.33" height="20" fill="#ce1126"/></svg>',
};

export const LOCALE_NAMES = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
  de: 'Deutsch',
  fr: 'Français',
};

/**
 * Selector de idioma compacto idéntico al de la app principal:
 * Botón con código [ES ▾] y menú desplegable con bandera SVG y nombre de idioma en su propia lengua.
 */
export function renderLanguageSwitcher(locale, page, { catalogs, routes, locales }) {
  const t = catalogs[locale] || {};
  const label = escape(t['language.label'] || 'Idioma');
  const isLegal = page === 'privacy' || page === 'privacidad' || page === 'terms' || page === 'terminos';
  const codes = isLegal ? ['es', 'en'] : locales;
  const targetPage = (page === 'privacidad' || page === 'privacy') ? 'privacy' : (page === 'terminos' || page === 'terms') ? 'terms' : page;

  const options = codes.map((code) => {
    const isCurrent = code === locale;
    const url = routes[code]?.[targetPage] || (code === 'es' ? '/' : `/${code}/`);
    return `<a href="${url}" class="lc-lang-option${isCurrent ? ' is-selected is-active' : ''}" data-lang="${code}" data-testid="language-${code}" role="option" aria-selected="${isCurrent ? 'true' : 'false'}" ${isCurrent ? 'aria-current="page"' : ''} lang="${code}" hreflang="${code}">
      <span class="lc-lang-flag" aria-hidden="true">${FLAG_SVGS[code]}</span>
      <span class="lc-lang-name">${LOCALE_NAMES[code]}</span>
    </a>`;
  }).join('');

  return `<div class="lc-lang" data-testid="language-switcher">
    <button type="button" class="lc-lang-trigger" aria-haspopup="listbox" aria-expanded="false" aria-label="${label}" data-testid="language-switcher-trigger">
      <span class="lc-lang-code" data-testid="language-switcher-code">${locale.toUpperCase()}</span>
      <svg class="lc-lang-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
        <path d="M0.5 0.75L5 5.25L9.5 0.75H0.5Z" fill="currentColor"/>
      </svg>
    </button>
    <div class="lc-lang-menu" role="listbox" aria-label="${label}" data-testid="language-switcher-menu">
      ${options}
    </div>
  </div>`;
}
