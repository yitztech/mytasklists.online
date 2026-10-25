import type { AisleCategory, Item, ListType } from '../types';

export const LIST_TYPE_NORMAL: ListType = 'normal';
export const LIST_TYPE_ADVANCED: ListType = 'advanced';

export const AISLE_ORDER: AisleCategory[] = [
  'produce',
  'bakery',
  'meat',
  'dairy',
  'pantry',
  'frozen',
  'beverages',
  'cleaning',
  'personal',
  'pets',
  'general',
];

export const AISLE_ICONS: Record<string, string> = {
  produce: '🥬',
  bakery: '🥖',
  meat: '🥩',
  dairy: '🥛',
  pantry: '🥫',
  frozen: '🧊',
  beverages: '🥤',
  cleaning: '🧹',
  personal: '🧴',
  pets: '🐾',
  general: '🛒',
};

export function isAdvancedList(list: { listType?: ListType } | null | undefined): boolean {
  return Boolean(list && list.listType === LIST_TYPE_ADVANCED);
}

export function hasPositivePendingTotal(
  list: { listType?: ListType; estimatedPendingTotal?: number } | null | undefined,
): boolean {
  return Boolean(
    list &&
      list.listType === LIST_TYPE_ADVANCED &&
      list.estimatedPendingTotal !== undefined &&
      list.estimatedPendingTotal > 0,
  );
}

export function hasPositiveBudget(
  list: { budget?: number | null } | null | undefined,
): boolean {
  return Boolean(list && list.budget !== null && list.budget !== undefined && list.budget > 0);
}

export function isOverBudget(
  list:
    | {
        budget?: number | null;
        estimatedPendingTotal?: number;
        purchasedTotal?: number;
      }
    | null
    | undefined,
): boolean {
  if (!list || list.budget === null || list.budget === undefined || list.budget <= 0) {
    return false;
  }
  const total = (list.estimatedPendingTotal ?? 0) + (list.purchasedTotal ?? 0);
  return total > list.budget;
}

export function getProjectedTotal(
  list: { estimatedPendingTotal?: number; purchasedTotal?: number } | null | undefined,
): string {
  const total = (list?.estimatedPendingTotal ?? 0) + (list?.purchasedTotal ?? 0);
  return total.toFixed(2);
}

export const DEFAULT_AISLE: AisleCategory = 'general';

export function groupItemsByAisle(items: Item[]): Array<{ aisle: AisleCategory; icon: string; items: Item[] }> {
  const map = new Map<AisleCategory, Item[]>();
  for (const item of items) {
    const rawCat = (item.category || DEFAULT_AISLE) as AisleCategory;
    let cat: AisleCategory = DEFAULT_AISLE;
    if (AISLE_ORDER.includes(rawCat)) {
      cat = rawCat;
    }
    const group = map.get(cat) ?? [];
    group.push(item);
    map.set(cat, group);
  }
  const result: Array<{ aisle: AisleCategory; icon: string; items: Item[] }> = [];
  for (const aisle of AISLE_ORDER) {
    const group = map.get(aisle);
    if (group && group.length > 0) {
      result.push({
        aisle,
        icon: AISLE_ICONS[aisle] || '🛒',
        items: group,
      });
    }
  }
  return result;
}

export function getListCurrency(list: { currency?: string } | null | undefined): string {
  return (list && list.currency) || 'MXN';
}

export function formatMoney(amount: number, currency?: string): string {
  const safeCurrency = currency || 'MXN';
  return '$' + amount.toFixed(2) + ' ' + safeCurrency;
}

export function formatItemTotal(item: Item): string {
  const unitPrice = item.estimatedPrice ?? item.lastPaidPrice ?? 0;
  return '$' + (unitPrice * item.quantity).toFixed(2);
}
