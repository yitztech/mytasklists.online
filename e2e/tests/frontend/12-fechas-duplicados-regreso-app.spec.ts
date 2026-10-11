import { expect, test } from '@playwright/test';
import { API_URL, createItem, createList, registerUser, uniqueEmail } from '../../utils/api-helpers';
import { pendingItem, useSession } from '../../utils/ui-helpers';
import { linkFromEmail, waitForEmail } from '../../utils/mailpit';

test.describe('Frontend web · fechas, duplicados y regreso a la app', () => {
  test('CP-WEB-DATE-001 · el interruptor Fechas muestra cuándo se agregó y se editó cada producto', async ({ page, request }) => {
    const user = await registerUser(request);
    const listId = (await createList(request, user.accessToken, 'Fechas')).id;
    const item = await createItem(request, user.accessToken, listId, { name: 'Detergente' });
    await request.patch(`${API_URL}/items/${item.id}`, {
      headers: { Authorization: `Bearer ${user.accessToken}` },
      data: { quantity: 2 },
    });

    await useSession(page, user);
    await page.goto(`/app/lists/${listId}`);
    const row = pendingItem(page, 'Detergente');
    await expect(row).toBeVisible();
    await expect(row.getByTestId('item-dates')).toHaveCount(0);

    await page.getByTestId('dates-switch').check();
    await expect(row.getByTestId('item-dates')).toContainText('Agregado');
    await expect(row.getByTestId('item-dates')).toContainText('Editado');

    // La preferencia se recuerda al volver a entrar
    await page.reload();
    await expect(pendingItem(page, 'Detergente').getByTestId('item-dates')).toBeVisible();
  });

  test('CP-WEB-DUP-001 · agregar un producto repetido muestra el aviso y no lo duplica', async ({ page, request }) => {
    const user = await registerUser(request);
    const listId = (await createList(request, user.accessToken, 'Repetidos')).id;
    await createItem(request, user.accessToken, listId, { name: 'Tortillas' });

    await useSession(page, user);
    await page.goto(`/app/lists/${listId}`);
    await expect(pendingItem(page, 'Tortillas')).toBeVisible();

    await page.getByTestId('item-name-input').fill('tortillas');
    await page.getByTestId('add-item-button').click();
    await expect(page.getByText('Ese producto ya está en la lista')).toBeVisible();
    await expect(page.getByTestId('pending-item')).toHaveCount(1);
  });

  test('CP-WEB-APP-001 · al completar un registro pedido desde Android se ofrece volver a la app', async ({ page, request }) => {
    const email = uniqueEmail('regreso-app');
    await request.post(`${API_URL}/auth/registration/request`, {
      headers: { 'X-App-Platform': 'android' },
      data: { email },
    });
    const mail = await waitForEmail(request, email, 'Completa tu registro');
    const link = new URL(linkFromEmail(mail, '/app/register/complete') + '&app=android');

    await page.goto(link.pathname + link.hash);
    await page.getByTestId('register-fullname').fill('Persona Desde App');
    await page.getByTestId('register-whatsapp').fill('+5215512345678');
    await page.getByTestId('register-password').fill('Prueba12345');
    await page.getByTestId('register-password-confirmation').fill('Prueba12345');
    await page.getByTestId('register-submit').click();

    await expect(page.getByTestId('return-to-app')).toBeVisible();
    const href = await page.getByTestId('open-native-app').getAttribute('href');
    expect(href).toContain('intent://login?email=' + encodeURIComponent(email));
    expect(href).toContain('scheme=mytasklists;package=online.mytasklists.app');

    await page.getByTestId('stay-on-web').click();
    await expect(page.getByTestId('lists-page')).toBeVisible();
  });
});
