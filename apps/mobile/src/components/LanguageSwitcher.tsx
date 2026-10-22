import { LOCALE_CONFIG } from '@lista/contracts/locales';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, setLanguage } from '../i18n';
import { colors, radius } from '../theme';

/** Selector común de idioma. La elección se guarda y se sincroniza con la cuenta. */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  return (
    <View style={styles.field} testID="language-switcher">
      <Picker
        selectedValue={i18n.language}
        onValueChange={(language) => setLanguage(language as (typeof LANGUAGES)[number])}
        accessibilityLabel={t('language.label')}
        style={styles.picker}
        dropdownIconColor={colors.ink}
      >
        {LANGUAGES.map((language) => (
          <Picker.Item
            key={language}
            label={LOCALE_CONFIG[language].name}
            value={language}
            testID={`language-${language}`}
          />
        ))}
      </Picker>
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
  picker: { minWidth: 176, minHeight: 48, color: colors.ink },
});
