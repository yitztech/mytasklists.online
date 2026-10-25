import type { AisleCategory, Item, ListDetail, ListSummary, ListType } from '../types';

export const DEFAULT_AISLE: AisleCategory = 'general';
export const DEFAULT_CURRENCY = 'MXN';
export const LIST_TYPE_NORMAL: ListType = 'normal';
export const LIST_TYPE_ADVANCED: ListType = 'advanced';

export const AISLE_OPTIONS: { value: AisleCategory; labelKey: `advancedList.aisles.${AisleCategory}` }[] = [
  { value: 'general', labelKey: 'advancedList.aisles.general' },
  { value: 'produce', labelKey: 'advancedList.aisles.produce' },
  { value: 'bakery', labelKey: 'advancedList.aisles.bakery' },
  { value: 'meat', labelKey: 'advancedList.aisles.meat' },
  { value: 'dairy', labelKey: 'advancedList.aisles.dairy' },
  { value: 'pantry', labelKey: 'advancedList.aisles.pantry' },
  { value: 'frozen', labelKey: 'advancedList.aisles.frozen' },
  { value: 'beverages', labelKey: 'advancedList.aisles.beverages' },
  { value: 'cleaning', labelKey: 'advancedList.aisles.cleaning' },
  { value: 'personal', labelKey: 'advancedList.aisles.personal' },
  { value: 'pets', labelKey: 'advancedList.aisles.pets' },
];

export function getAisleLabelKey(category?: string | null): `advancedList.aisles.${AisleCategory}` | null {
  if (!category || category === 'general') return null;
  const found = AISLE_OPTIONS.find((opt) => opt.value === category);
  if (!found) return null;
  return found.labelKey;
}

export function isAdvancedList(list?: Pick<ListSummary | ListDetail, 'listType'> | null): boolean {
  return Boolean(list && list.listType === 'advanced');
}

export function getListCurrency(list?: Pick<ListSummary | ListDetail, 'currency'> | null): string {
  return (list && list.currency) || DEFAULT_CURRENCY;
}

export function getTypeButtonClass(active: boolean): string {
  if (active) return 'btn w-100 text-start p-3 btn-primary';
  return 'btn w-100 text-start p-3 btn-outline-secondary';
}

export function formatSampleReceiptFromItems(items: Item[]): string {
  return items
    .slice(0, 3)
    .map((it) => it.name.toUpperCase() + ' ' + (it.estimatedPrice ?? 25).toFixed(2))
    .join('\n');
}
