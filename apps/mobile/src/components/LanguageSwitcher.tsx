import { LOCALE_CONFIG } from '@lista/contracts/locales';
import React from 'react';
import { ActionSheetIOS, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, currentLanguage, setLanguage } from '../i18n';
import { colors, radius } from '../theme';

/** Selector común de idioma. La elección se guarda y se sincroniza con la cuenta. */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  // En iOS el Picker es una rueda fija que ocupa media pantalla: se usa la hoja de acciones nativa
  if (Platform.OS === 'ios') {
    const open = () =>
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: t('language.label'),
          options: [...LANGUAGES.map((language) => LOCALE_CONFIG[language].name), t('common.cancel')],
          cancelButtonIndex: LANGUAGES.length,
        },
        (index) => {
          if (index < LANGUAGES.length) setLanguage(LANGUAGES[index]);
        },
      );
    return (
      <Pressable
        style={[styles.field, styles.button]}
        testID="language-switcher"
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={t('language.label')}
      >
        <Text style={styles.value}>{LOCALE_CONFIG[currentLanguage()].name}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
    );
  }

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
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  value: { fontSize: 16, color: colors.ink },
  chevron: { fontSize: 14, color: colors.ink },
});
