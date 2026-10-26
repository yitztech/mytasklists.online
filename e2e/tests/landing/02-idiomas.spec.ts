import { expect, test } from '@playwright/test';

test.describe('Landing · idiomas', () => {
  test.use({ locale: 'en-US' });

  test('CP-LAND-007 · la URL inglesa sirve HTML traducido y permite cambiar', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toContainText('Shared shopping lists.');
    await expect(page.getByTestId('nav-download')).toHaveText('Download');

    await page.getByTestId('language-switcher-trigger').click();
    await page.getByTestId('language-es').click();
    await expect(page.locator('h1')).toContainText('Listas de compras compartidas.');
    await expect(page.getByTestId('nav-download')).toHaveText('Descargar');

    await page.reload();
    await expect(page.locator('h1')).toContainText('Listas de compras compartidas.');
  });
});

test.describe('Landing · portugués, alemán y francés', () => {
  const pages = [
    { lang: 'pt', home: '/pt/', h1: 'Listas de compras compartilhadas.', pricing: '/pt/precos/', download: '/pt/baixar/' },
    { lang: 'de', home: '/de/', h1: 'Geteilte Einkaufslisten.', pricing: '/de/preise/', download: '/de/download/' },
    { lang: 'fr', home: '/fr/', h1: 'Listes de courses partagées.', pricing: '/fr/tarifs/', download: '/fr/telecharger/' },
  ];

  for (const { lang, home, h1, pricing, download } of pages) {
    test(`CP-LAND-011 · ${lang}: portada, precios y descargas traducidos y enlazados`, async ({ page, request }) => {
      await page.goto(home);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('h1')).toContainText(h1);
      await expect(page.getByTestId(`language-${lang}`)).toHaveAttribute('aria-current', 'page');
      await expect(page.getByTestId('nav-download')).toHaveAttribute('href', download);

      for (const path of [pricing, download]) {
        const response = await request.get(path);
        expect(response.status()).toBe(200);
        const html = await response.text();
        expect(html).toContain(`<html lang="${lang}">`);
        for (const code of ['es', 'en', 'pt', 'de', 'fr']) expect(html).toContain(`hreflang="${code}"`);
        expect(html).not.toMatch(/__[A-Z_]+__/);
      }

      await page.getByTestId('language-switcher-trigger').click();
    await page.getByTestId('language-es').click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator('h1')).toContainText('Listas de compras compartidas.');
    });
  }
});
