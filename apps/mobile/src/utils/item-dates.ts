import type { TFunction } from 'i18next';
import type { Item } from '../types';

const format = (iso: string, language: string): string =>
  new Date(iso).toLocaleString(language.startsWith('en') ? 'en' : 'es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** "Agregado 3 oct 2026, 10:20 · Editado 5 oct 2026, 18:02" */
export const itemDates = (item: Item, t: TFunction, language: string): string =>
  [
    t('item.addedOn', { date: format(item.createdAt, language) }),
    item.editedAt ? t('item.editedOn', { date: format(item.editedAt, language) }) : null,
  ]
    .filter(Boolean)
    .join(' · ');
