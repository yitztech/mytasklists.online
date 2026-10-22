import type { NotificationTexts } from '../modules/notifications/notification.texts';

/**
 * Traduction française des notifications.
 */
export const NOTIFICATIONS_FR: NotificationTexts = {
  itemAdded: (actor, item, repeatDays) =>
    `${actor} a ajouté « ${item} »${repeatDays ? ` (se répète tous les ${repeatDays} jours)` : ''}`,
  itemUpdated: (actor, item) => `${actor} a modifié « ${item} »`,
  itemPurchased: (actor, item) => `${actor} a acheté « ${item} »`,
  itemRestored: (actor, item) => `${actor} a remis « ${item} » dans la liste des achats`,
  itemRemoved: (actor, item) => `${actor} a supprimé « ${item} »`,
  itemReactivated: (item, days) => `« ${item} » est de retour dans votre liste (tous les ${days} jours)`,
  itemOverdue: (item, daysLate) => `« ${item} » n'a pas été acheté depuis ${daysLate} jour(s) et est en retard`,
  listSharedTitle: 'Une liste a été partagée avec vous',
  listShared: (actor, list) => `${actor ?? 'Quelqu’un'} a partagé la liste « ${list} » avec vous`,
};
