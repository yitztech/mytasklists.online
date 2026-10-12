import { expect, test } from '@playwright/test';
import { API_URL, auth, createItem, createList, registerUser } from '../../utils/api-helpers';
import { useSession } from '../../utils/ui-helpers';

const LONG_NAME =
  'Detergente líquido para ropa de color concentrado con suavizante, botella grande de tres litros';

test.describe('Frontend web · diseño de productos en el teléfono', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('CP-WEB-MOV-001 · la barra inferior no tapa el último producto y el nombre largo se lee completo', async ({ page, request }) => {
    const user = await registerUser(request);
    const listId = (await createList(request, user.accessToken, 'Súper')).id;
    for (let i = 1; i <= 8; i++) await createItem(request, user.accessToken, listId, { name: `Producto ${i}` });
    await createItem(request, user.accessToken, listId, { name: LONG_NAME, quantity: 2, unit: 'kg' });
    const bought = await createItem(request, user.accessToken, listId, { name: 'Último comprado', quantity: 3, unit: 'kg' });
    await request.post(`${API_URL}/items/${bought.id}/purchase`, { headers: auth(user.accessToken) });

    await useSession(page, user);
    await page.goto(`/app/lists/${listId}`);

    // El nombre largo ocupa varias líneas en vez de cortarse
    const longRow = page.locator(`[data-testid="pending-item"][data-item-name="${LONG_NAME}"]`);
    const longName = longRow.getByTestId('item-name');
    await expect(longName).toHaveText(LONG_NAME);
    const fits = await longName.evaluate((el) => el.scrollWidth <= el.clientWidth && el.clientHeight > 30);
    expect(fits).toBe(true);

    // La cantidad queda debajo del nombre
    const nameBox = (await longName.boundingBox())!;
    const quantityBox = (await longRow.getByTestId('item-quantity').boundingBox())!;
    expect(quantityBox.y).toBeGreaterThanOrEqual(nameBox.y + nameBox.height - 1);

    // Al final de la página, el último comprado queda por encima de la barra inferior
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const last = page.locator('[data-testid="purchased-item"][data-item-name="Último comprado"]');
    const lastBox = (await last.boundingBox())!;
    const navBox = (await page.locator('.lc-nav').boundingBox())!;
    expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(navBox.y);

    // Cantidad y quién lo compró, debajo del nombre del comprado
    const boughtName = (await last.getByTestId('purchased-name').boundingBox())!;
    const boughtMeta = (await last.getByTestId('purchased-meta').boundingBox())!;
    await expect(last.getByTestId('purchased-quantity')).toContainText('3');
    expect(boughtMeta.y).toBeGreaterThanOrEqual(boughtName.y + boughtName.height - 1);
  });
});
