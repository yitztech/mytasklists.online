// The served URL determines language; preferences only follow explicit navigation.
function initLanguageSwitcher() {
  document.querySelectorAll('[data-testid="language-switcher"]').forEach((switcher) => {
    const trigger = switcher.querySelector('.lc-lang-trigger');
    const menu = switcher.querySelector('.lc-lang-menu');
    if (trigger && menu) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = switcher.classList.toggle('is-open');
        trigger.setAttribute('aria-expanded', String(isOpen));
      });
    }
  });

  document.addEventListener('click', (e) => {
    document.querySelectorAll('.lc-lang.is-open').forEach((switcher) => {
      if (!switcher.contains(e.target)) {
        switcher.classList.remove('is-open');
        const trigger = switcher.querySelector('.lc-lang-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.lc-lang.is-open').forEach((switcher) => {
        switcher.classList.remove('is-open');
        const trigger = switcher.querySelector('.lc-lang-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    }
  });

  for (const link of document.querySelectorAll('[data-lang]')) {
    link.setAttribute('aria-current', link.dataset.lang === document.documentElement.lang ? 'page' : 'false');
    link.addEventListener('click', () => {
      try {
        localStorage.setItem('lc.lang', link.dataset.lang);
      } catch {}
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLanguageSwitcher);
} else {
  initLanguageSwitcher();
}
