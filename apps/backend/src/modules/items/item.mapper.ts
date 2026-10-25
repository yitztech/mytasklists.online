import type { Item } from '@lista/contracts';
import { ItemStatus, ListItem } from '../../database/entities';

export const DAY_MS = 24 * 60 * 60 * 1000;

export const addDays = (from: Date, days: number): Date => new Date(from.getTime() + days * DAY_MS);

/** Días completos entre dos fechas (positivo si `b` es posterior a `a`) */
export const daysBetween = (a: Date, b: Date): number =>
  Math.floor((b.getTime() - a.getTime()) / DAY_MS);

/** Días que faltan, redondeando hacia arriba: hoy mismo + 14 días muestra "14" */
const daysAhead = (from: Date, to: Date): number =>
  Math.max(0, Math.ceil((to.getTime() - from.getTime()) / DAY_MS));

/**
 * Un producto recurrente está "vencido" cuando sigue pendiente y ya se pasó la
 * fecha límite de su ciclo. La interfaz lo pinta con otro color.
 */
export const isItemOverdue = (item: ListItem, now: Date = new Date()): boolean =>
  item.status === ItemStatus.PENDING &&
  item.isRecurring &&
  item.dueAt !== null &&
  now.getTime() > new Date(item.dueAt).getTime();

/**
 * Nombre comparable para detectar productos repetidos: sin mayúsculas, tildes
 * ni espacios de más ("  Café " y "cafe" son el mismo producto).
 */
export const itemNameKey = (name: string): string =>
  name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Un producto sigue "en la lista" mientras está pendiente, comprado o, si es
 * recurrente, archivado con una reaparición programada.
 */
export const isInList = (item: Pick<ListItem, 'status' | 'isRecurring' | 'nextActivationAt'>): boolean =>
  item.status !== ItemStatus.ARCHIVED || (item.isRecurring && item.nextActivationAt !== null);

/** La forma pública del producto vive en el contrato compartido con los clientes */
export type ItemView = Item;

export const toItemView = (item: ListItem, now: Date = new Date()): ItemView => {
  const overdue = isItemOverdue(item, now);
  const dueAt = item.dueAt ? new Date(item.dueAt) : null;
  const nextActivationAt = item.nextActivationAt ? new Date(item.nextActivationAt) : null;

  return {
    id: item.id,
    listId: item.listId,
    name: item.name,
    quantity: Number(item.quantity),
    unit: item.unit,
    note: item.note,
    category: item.category,
    imageUrl: item.imageKey ? `/items/images/${encodeURIComponent(item.imageKey)}` : null,
    status: item.status,
    isRecurring: item.isRecurring,
    recurrenceDays: item.recurrenceDays,
    activatedAt: new Date(item.activatedAt).toISOString(),
    dueAt: dueAt ? dueAt.toISOString() : null,
    nextActivationAt: nextActivationAt ? nextActivationAt.toISOString() : null,
    purchasedAt: item.purchasedAt ? new Date(item.purchasedAt).toISOString() : null,
    purchasedById: item.purchasedById,
    purchasedByName: item.purchasedBy?.fullName ?? null,
    lastPurchasedAt: item.lastPurchasedAt ? new Date(item.lastPurchasedAt).toISOString() : null,
    cycleCount: item.cycleCount,
    createdById: item.createdById,
    createdByName: item.createdBy?.fullName ?? null,
    sortOrder: item.sortOrder,
    createdAt: new Date(item.createdAt).toISOString(),
    updatedAt: new Date(item.updatedAt).toISOString(),
    editedAt: item.editedAt ? new Date(item.editedAt).toISOString() : null,
    isOverdue: overdue,
    daysOverdue: overdue && dueAt ? Math.max(1, daysBetween(dueAt, now)) : 0,
    daysUntilDue: dueAt && !overdue ? daysAhead(now, dueAt) : null,
    daysUntilReactivation: nextActivationAt ? daysAhead(now, nextActivationAt) : null,
    estimatedPrice:
      item.estimatedPrice !== null && item.estimatedPrice !== undefined ? Number(item.estimatedPrice) : null,
    lastPaidPrice:
      item.lastPaidPrice !== null && item.lastPaidPrice !== undefined ? Number(item.lastPaidPrice) : null,
    storeName: item.storeName ?? null,
  };
};
