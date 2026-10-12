import { test, expect } from '@playwright/test';
import { registerUser, createList, createItem } from '../../utils/api-helpers';

test('MOV-DATE · el interruptor de fechas muestra cuándo se agregó cada producto', async ({ page, request }) => {
  const user = await registerUser(request);
  const list = await createList(request, user.accessToken, 'Fechas móvil');
  await createItem(request, user.accessToken, list.id, { name: 'Azúcar' });
  await page.goto('/');
  await page.getByTestId('login-email').fill(user.email);
  await page.getByTestId('login-password').fill(user.password);
  await page.getByTestId('login-submit').click();
  await page.getByTestId('list-card').filter({ hasText: 'Fechas móvil' }).click();

  const item = page.getByTestId('pending-item').filter({ hasText: 'Azúcar' });
  await expect(item).toBeVisible();
  await expect(item.getByTestId('item-dates')).toHaveCount(0);
  await page.getByTestId('dates-switch').click();
  await expect(item.getByTestId('item-dates')).toContainText('Agregado');
});

