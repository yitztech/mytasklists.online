import { LOCALE_CONFIG } from '@lista/contracts/locales';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, currentLanguage, setLanguage } from '../i18n';
import { colors, radius } from '../theme';
import { SelectField } from './SelectField';

/** Selector común de idioma. La elección se guarda y se sincroniza con la cuenta. */
export function LanguageSwitcher() {
  const { t } = useTranslation();

  return (
    <View style={styles.field} testID="language-switcher">
      <SelectField
        label={t('language.label')}
        value={currentLanguage()}
        onChange={(language) => setLanguage(language as (typeof LANGUAGES)[number])}
        options={LANGUAGES.map((language) => ({ label: LOCALE_CONFIG[language].name, value: language }))}
        style={styles.compact}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minWidth: 176,
    minHeight: 48,
    overflow: 'hidden',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
  },
  // El borde ya lo pone el contenedor
  compact: { borderWidth: 0, borderRadius: 0 },
});
