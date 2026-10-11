import { expect, test } from '@playwright/test';
import {
  API_URL,
  auth,
  createItem,
  createList,
  registerUser,
  uniqueEmail,
  type TestUser,
} from '../../utils/api-helpers';
import { waitForEmail } from '../../utils/mailpit';

test.describe('Servicio backend · duplicados, fechas de edición y regreso a la app', () => {
  let user: TestUser;
  let listId: string;

  test.beforeEach(async ({ request }) => {
    user = await registerUser(request);
    listId = (await createList(request, user.accessToken, 'Duplicados')).id;
  });

  const add = (request: Parameters<typeof createItem>[0], name: string) =>
    request.post(`${API_URL}/lists/${listId}/items`, { headers: auth(user.accessToken), data: { name } });

  test('CP-DUP-001 · no se puede agregar dos veces el mismo producto (sin importar mayúsculas, tildes ni espacios)', async ({ request }) => {
    const first = await createItem(request, user.accessToken, listId, { name: 'Café molido' });

    for (const name of ['Café molido', '  cafe   MOLIDO ']) {
      const response = await add(request, name);
      expect(response.status()).toBe(409);
      const body = await response.json();
      expect(body.code).toBe('ITEM_DUPLICATE');
      expect(body.details).toMatchObject({ itemId: first.id, status: 'pending' });
      expect(body.message).toBe('Ese producto ya está en la lista');
    }

    const english = await request.post(`${API_URL}/lists/${listId}/items`, {
      headers: { ...auth(user.accessToken), 'Accept-Language': 'en' },
      data: { name: 'CAFÉ MOLIDO' },
    });
    expect((await english.json()).message).toBe('That item is already on the list');
  });

  test('CP-DUP-002 · un producto comprado sigue en la lista; uno quitado se puede volver a agregar', async ({ request }) => {
    const item = await createItem(request, user.accessToken, listId, { name: 'Pilas' });
    await request.post(`${API_URL}/items/${item.id}/purchase`, { headers: auth(user.accessToken) });

    const whilePurchased = await add(request, 'Pilas');
    expect(whilePurchased.status()).toBe(409);
    expect((await whilePurchased.json()).details.status).toBe('purchased');

    await request.delete(`${API_URL}/items/${item.id}/close`, { headers: auth(user.accessToken) });
    const afterClose = await add(request, 'Pilas');
    expect(afterClose.status()).toBe(201);
  });

  test('CP-DUP-003 · un recurrente quitado con su vuelta programada sigue contando como en la lista', async ({ request }) => {
    const item = await createItem(request, user.accessToken, listId, {
      name: 'Pan de caja',
      isRecurring: true,
      recurrenceDays: 7,
    });
    await request.post(`${API_URL}/items/${item.id}/purchase`, { headers: auth(user.accessToken) });
    await request.delete(`${API_URL}/items/${item.id}/close`, { headers: auth(user.accessToken) });

    const response = await add(request, 'pan de caja');
    expect(response.status()).toBe(409);
    expect((await response.json()).details.status).toBe('archived');
  });

  test('CP-DUP-004 · renombrar un producto con el nombre de otro de la lista se rechaza', async ({ request }) => {
    await createItem(request, user.accessToken, listId, { name: 'Leche' });
    const other = await createItem(request, user.accessToken, listId, { name: 'Huevos' });

    const rename = await request.patch(`${API_URL}/items/${other.id}`, {
      headers: auth(user.accessToken),
      data: { name: 'leche' },
    });
    expect(rename.status()).toBe(409);

    // Cambiar solo mayúsculas del propio nombre sí se permite
    const self = await request.patch(`${API_URL}/items/${other.id}`, {
      headers: auth(user.accessToken),
      data: { name: 'HUEVOS' },
    });
    expect(self.status()).toBe(200);
  });

  test('CP-DUP-005 · dos altas simultáneas del mismo producto dejan solo una', async ({ request }) => {
    const responses = await Promise.all([add(request, 'Arroz'), add(request, 'Arroz'), add(request, 'arroz')]);
    expect(responses.map((response) => response.status()).sort()).toEqual([201, 409, 409]);
  });

  test('CP-DATE-001 · editedAt es null al agregar, cambia al editar y no al comprar', async ({ request }) => {
    const item = await createItem(request, user.accessToken, listId, { name: 'Jabón' });
    expect(item.createdAt).toBeTruthy();
    expect(item.editedAt).toBeNull();

    const purchased = await (
      await request.post(`${API_URL}/items/${item.id}/purchase`, { headers: auth(user.accessToken) })
    ).json();
    expect(purchased.editedAt).toBeNull();

    const edited = await (
      await request.patch(`${API_URL}/items/${item.id}`, { headers: auth(user.accessToken), data: { quantity: 3 } })
    ).json();
    expect(edited.editedAt).not.toBeNull();
    expect(new Date(edited.editedAt).getTime()).toBeGreaterThanOrEqual(new Date(item.createdAt).getTime());
  });

  test('CP-APP-001 · los correos pedidos desde la app Android llevan app=android en el enlace', async ({ request }) => {
    const email = uniqueEmail('desde-app');
    const response = await request.post(`${API_URL}/auth/registration/request`, {
      headers: { 'X-App-Platform': 'android' },
      data: { email },
    });
    expect(response.ok()).toBeTruthy();
    const mail = await waitForEmail(request, email, 'Completa tu registro');
    expect(mail.text).toMatch(/\/app\/register\/complete#token=[A-Za-z0-9_-]+&app=android/);

    const forgot = await request.post(`${API_URL}/auth/forgot-password`, {
      headers: { 'X-App-Platform': 'android' },
      data: { email: user.email },
    });
    expect(forgot.status()).toBe(200);
    const reset = await waitForEmail(request, user.email, 'Restablece tu contraseña');
    expect(reset.text).toMatch(/\/app\/reset-password#token=[A-Za-z0-9_-]+&app=android/);
  });

  test('CP-APP-002 · desde la web el enlace no lleva marca de app', async ({ request }) => {
    const email = uniqueEmail('desde-web');
    await request.post(`${API_URL}/auth/registration/request`, { data: { email } });
    const mail = await waitForEmail(request, email, 'Completa tu registro');
    expect(mail.text).not.toContain('&app=');
  });
});
