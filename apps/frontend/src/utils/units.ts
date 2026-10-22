import { normalizeLocale } from '@lista/contracts/locales';
import UNITS from '../../../../packages/ui-data/units.json';

export const unitLabel = (value: string, language: string): string => {
  const unit = UNITS.find((entry) => entry.value === value);
  if (!unit) return value;
  const locale = normalizeLocale(language) ?? 'es';
  return unit[locale];
};

export const localizedUnits = (language: string) => {
  const locale = normalizeLocale(language) ?? 'es';
  return UNITS.map((unit) => ({ value: unit.value, label: unit[locale] }));
};
