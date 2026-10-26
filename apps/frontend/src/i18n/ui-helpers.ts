export const ESCAPE_KEY = 'Escape';
export const KEY_ARROW_UP = 'ArrowUp';
export const KEY_ARROW_DOWN = 'ArrowDown';
export const SECTION_PENDING = 'pending' as const;
export const SECTION_PURCHASED = 'purchased' as const;

export const isPendingSection = (section: string): boolean => section === SECTION_PENDING;

export function getLanguageOptionClass(selected: boolean): string {
  return selected ? 'lc-lang-option is-selected' : 'lc-lang-option';
}

export function getLanguageOptionTestId(language: string): string {
  return 'language-option-' + language;
}

export function getPendingItemClass(
  stateClass: string,
  completing: boolean,
  isDragging?: boolean,
  isDragOver?: boolean,
): string {
  return [
    'lc-item',
    stateClass,
    completing ? 'lc-item--completando' : '',
    isDragging ? 'lc-item--dragging' : '',
    isDragOver ? 'lc-item--drag-over' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function getPurchasedItemClass(isDragging?: boolean, isDragOver?: boolean): string {
  return [
    'lc-item lc-item--comprado',
    isDragging ? 'lc-item--dragging' : '',
    isDragOver ? 'lc-item--drag-over' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function getDragHandleClass(isDragging?: boolean): string {
  return isDragging ? 'lc-drag-handle dragging' : 'lc-drag-handle';
}

export function getListCardClass(isDragging: boolean, isDragOver: boolean): string {
  return [
    'lc-list-card',
    isDragging ? 'lc-list-card--dragging' : '',
    isDragOver ? 'lc-list-card--drag-over' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function getSettingsTabClass(active: boolean): string {
  return active ? 'lc-tab-btn is-active' : 'lc-tab-btn';
}

export type SettingsTabId = 'personal' | 'password' | 'language' | 'privacy';

export const SETTINGS_TAB_PERSONAL: SettingsTabId = 'personal';
export const SETTINGS_TAB_PASSWORD: SettingsTabId = 'password';
export const SETTINGS_TAB_LANGUAGE: SettingsTabId = 'language';
export const SETTINGS_TAB_PRIVACY: SettingsTabId = 'privacy';

export const isSettingsPersonal = (tab: string): boolean => tab === SETTINGS_TAB_PERSONAL;
export const isSettingsPassword = (tab: string): boolean => tab === SETTINGS_TAB_PASSWORD;
export const isSettingsLanguage = (tab: string): boolean => tab === SETTINGS_TAB_LANGUAGE;
export const isSettingsPrivacy = (tab: string): boolean => tab === SETTINGS_TAB_PRIVACY;

export function getInitialSettingsTab(): SettingsTabId {
  const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
  if (hash === SETTINGS_TAB_PASSWORD || hash === SETTINGS_TAB_LANGUAGE || hash === SETTINGS_TAB_PRIVACY) return hash;
  return SETTINGS_TAB_PERSONAL;
}

export function getListOrderStorageKey(userId?: string | null): string {
  return 'lc.listOrder.' + (userId || 'anon');
}

export function toBooleanAttr(value: boolean): 'true' | 'false' {
  return value ? 'true' : 'false';
}
