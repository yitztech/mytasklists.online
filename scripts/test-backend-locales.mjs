import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { SUPPORTED_LOCALES, ENABLED_LOCALES, normalizeLocale, resolveEnabledLocale, resolveLegacyLocale, isLocale } from '@lista/contracts/locales';
const require = createRequire(import.meta.url);
const { localeFromHeader, translateMessage } = require('../apps/backend/dist/i18n/locale');
const templates = require('../apps/backend/dist/modules/mail/mail.templates');
const { NOTIFICATION_TEXTS } = require('../apps/backend/dist/modules/notifications/notification.texts');
const { NotificationsService } = require('../apps/backend/dist/modules/notifications/notifications.service');
const { UpdateProfileDto } = require('../apps/backend/dist/modules/users/dto/update-profile.dto');
const { validate } = require('class-validator');

test('runtime publishes five locales and keeps the legacy es/en value', () => {
  assert.deepEqual(SUPPORTED_LOCALES, ['es', 'en', 'pt', 'de', 'fr']);
  assert.deepEqual(ENABLED_LOCALES, SUPPORTED_LOCALES);
  for (const tag of ['pt-BR', 'de-DE', 'fr-FR']) {
    assert.equal(normalizeLocale(tag), tag.slice(0, 2));
    assert.equal(resolveEnabledLocale(tag), tag.slice(0, 2));
    assert.equal(resolveLegacyLocale(tag), 'es');
  }
  assert.equal(resolveEnabledLocale('zz'), 'es');
  assert.equal(resolveLegacyLocale('en-US'), 'en');
  assert.equal(normalizeLocale('EN_us'), 'en');
  assert.equal(normalizeLocale('zz'), undefined);
  assert.equal(isLocale('fr-FR'), false);
});

test('Accept-Language preserves weighted supported preferences and rejects invalid weights', () => {
  assert.equal(localeFromHeader('zz,fr-FR;q=0.6,de-DE;q=0.9,en;q=0.8'), 'de');
  assert.equal(localeFromHeader(['pt-BR;q=0', 'fr;q=0.5']), 'fr');
  assert.equal(localeFromHeader('en;q=2,de;q=NaN,fr;q=-1'), 'es');
  assert.equal(localeFromHeader(undefined), 'es');
  assert.equal(localeFromHeader('en-US,en;q=0.9,es;q=0.8'), 'en');
});

test('profile validation accepts five base preferences without allowing arbitrary tags', async () => {
  for (const locale of SUPPORTED_LOCALES) assert.deepEqual(await validate(Object.assign(new UpdateProfileDto(), { locale })), []);
  for (const locale of ['zz', 'fr-FR', '']) assert.ok((await validate(Object.assign(new UpdateProfileDto(), { locale }))).length);
});

test('all transactional templates deliver each locale with truthful lang and HTML escaping', () => {
  const args = {
    verifyEmailTemplate: ['<User>', 'https://example.test/?a=1&b=2', 24],
    listInvitationTemplate: ['<List>', '<Inviter>', 'https://example.test', 24],
    resetPasswordTemplate: ['<User>', 'https://example.test', 30],
    passwordChangedTemplate: ['<User>', 'https://example.test'],
    mfaChangedTemplate: ['<User>', true],
    socialLinkedTemplate: ['<User>', 'Google', 'https://example.test'],
    accountDeletedTemplate: ['<User>'],
    registrationTemplate: ['https://example.test/?a=1&b=2', 30],
  };
  assert.deepEqual(Object.keys(templates).sort(), Object.keys(args).sort());
  for (const [name, values] of Object.entries(args)) {
    const spanish = templates[name]('es', ...values);
    for (const locale of ['en', 'pt', 'de', 'fr']) {
      const mail = templates[name](locale, ...values);
      assert.notEqual(mail.subject, spanish.subject, `${name}/${locale}`);
      assert.match(mail.html, new RegExp(`<html lang="${locale}">`));
      assert.doesNotMatch(mail.html, /undefined|<User>|<List>|<Inviter>/);
      assert.doesNotMatch(mail.text + mail.subject, /undefined/);
    }
  }
  assert.equal(translateMessage('Mensaje original', 'fr'), 'Mensaje original');
  assert.equal(translateMessage('Ocurrió un error inesperado', 'pt'), 'Ocorreu um erro inesperado');
});

test('notifications group by delivered catalog safely for all saved preferences', async () => {
  const recipients = SUPPORTED_LOCALES.map((locale) => ({ userId: locale, notifyOnChange: true, user: { locale } }));
  const delivered = [];
  const rows = [];
  const service = new NotificationsService(
    { create: (row) => row, save: async (values) => { rows.push(...values); return []; } },
    { find: async () => recipients },
    { emitToUser() {} },
    { sendToUsers: async (ids, payload) => delivered.push({ ids, payload }) },
  );
  await service.notifyListMembers({ listId: 'list', listName: 'Original user text', type: 'list.shared', render: (texts) => ({ title: texts.listSharedTitle, body: texts.listShared('Actor', 'Original user text') }) });
  assert.equal(rows.length, 5);
  assert.deepEqual(delivered.map(({ ids }) => ids).sort(), SUPPORTED_LOCALES.map((locale) => [locale]).sort());
  for (const locale of SUPPORTED_LOCALES) {
    assert.equal(rows.find(({ userId }) => userId === locale).title, NOTIFICATION_TEXTS[locale].listSharedTitle);
  }
  assert.notEqual(NOTIFICATION_TEXTS.fr.listSharedTitle, NOTIFICATION_TEXTS.es.listSharedTitle);
});

test('profile updates retain saved preference while legacy response stays compatible', async () => {
  const { UsersService } = require('../apps/backend/dist/modules/users/users.service');
  const { toPublicUser } = require('../apps/backend/dist/modules/users/user.mapper');
  let saved = { id: 'user', locale: 'es', createdAt: new Date('2026-01-01') };
  const service = new UsersService({ findOne: async () => saved, save: async (row) => { saved = row; return row; } }, {});
  for (const locale of SUPPORTED_LOCALES) {
    const result = await service.updateProfile('user', { locale });
    assert.equal(result.locale, locale);
    const view = toPublicUser(result);
    assert.equal(view.preferredLocale, locale);
    assert.equal(view.locale, resolveLegacyLocale(locale));
    assert.equal((await service.updateProfile('user', {})).locale, locale);
  }
});
