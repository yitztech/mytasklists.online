import type { NotificationTexts } from '../modules/notifications/notification.texts';

/**
 * Tradução para o português dos avisos.
 */
export const NOTIFICATIONS_PT: NotificationTexts = {
  itemAdded: (actor, item, repeatDays) =>
    `${actor} adicionou "${item}"${repeatDays ? ` (repete a cada ${repeatDays} dias)` : ''}`,
  itemUpdated: (actor, item) => `${actor} editou "${item}"`,
  itemPurchased: (actor, item) => `${actor} comprou "${item}"`,
  itemRestored: (actor, item) => `${actor} devolveu "${item}" à lista de compras`,
  itemRemoved: (actor, item) => `${actor} excluiu "${item}"`,
  itemReactivated: (item, days) => `"${item}" voltou à sua lista (repete a cada ${days} dias)`,
  itemOverdue: (item, daysLate) => `"${item}" está há ${daysLate} dia(s) sem ser comprado e está atrasado`,
  listSharedTitle: 'Uma lista foi compartilhada com você',
  listShared: (actor, list) => `${actor ?? 'Alguém'} compartilhou a lista "${list}" com você`,
};
