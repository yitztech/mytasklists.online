export const PLATFORM_WEB = 'web';
export const SECTION_PENDING = 'pending' as const;
export const SECTION_PURCHASED = 'purchased' as const;

export const isPendingSection = (section: string): boolean => section === SECTION_PENDING;

export function getLanguageOptionTestId(language: string): string {
  return 'language-option-' + language;
}
