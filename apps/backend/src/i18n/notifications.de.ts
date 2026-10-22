import type { NotificationTexts } from '../modules/notifications/notification.texts';

/**
 * Deutsche Übersetzung der Benachrichtigungen.
 */
export const NOTIFICATIONS_DE: NotificationTexts = {
  itemAdded: (actor, item, repeatDays) =>
    `${actor} hat „${item}“ hinzugefügt${repeatDays ? ` (wiederholt sich alle ${repeatDays} Tage)` : ''}`,
  itemUpdated: (actor, item) => `${actor} hat „${item}“ bearbeitet`,
  itemPurchased: (actor, item) => `${actor} hat „${item}“ gekauft`,
  itemRestored: (actor, item) => `${actor} hat „${item}“ zurück auf die Einkaufsliste gesetzt`,
  itemRemoved: (actor, item) => `${actor} hat „${item}“ gelöscht`,
  itemReactivated: (item, days) => `„${item}“ ist wieder auf deiner Liste (alle ${days} Tage)`,
  itemOverdue: (item, daysLate) => `„${item}“ ist seit ${daysLate} Tag(en) nicht gekauft worden und überfällig`,
  listSharedTitle: 'Eine Liste wurde mit dir geteilt',
  listShared: (actor, list) => `${actor ?? 'Jemand'} hat die Liste „${list}“ mit dir geteilt`,
};
