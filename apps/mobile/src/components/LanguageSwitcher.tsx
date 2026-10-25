import { LOCALE_CONFIG } from '@lista/contracts/locales';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, LANGUAGE_FLAGS, currentLanguage, setLanguage } from '../i18n';
import { colors, radius, shadow } from '../theme';
import { SelectField } from './SelectField';

/** Selector común de idioma. La elección se guarda y se sincroniza con la cuenta. */
export function LanguageSwitcher() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const active = currentLanguage();

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webField} testID="language-switcher">
        <SelectField
          label={t('language.label')}
          value={active}
          onChange={(language) => setLanguage(language as (typeof LANGUAGES)[number])}
          options={LANGUAGES.map((language) => ({
            label: LANGUAGE_FLAGS[language] + ' ' + LOCALE_CONFIG[language].name,
            value: language,
          }))}
          style={styles.compact}
        />
      </View>
    );
  }

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        testID="language-switcher"
        accessibilityRole="button"
        accessibilityLabel={t('language.label')}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.triggerFlag}>{LANGUAGE_FLAGS[active]}</Text>
        <Text style={styles.triggerLabel}>{LOCALE_CONFIG[active].name}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.menuCard} onStartShouldSetResponder={() => true}>
            {LANGUAGES.map((language, index) => {
              const selected = language === active;
              const isLast = index === LANGUAGES.length - 1;
              return (
                <Pressable
                  key={language}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.optionRow,
                    !isLast && !selected && styles.optionDivider,
                    selected && styles.optionSelected,
                    pressed && styles.optionPressed,
                  ]}
                  onPress={() => {
                    setOpen(false);
                    setLanguage(language);
                  }}
                >
                  <View style={styles.optionLeft}>
                    <Text style={styles.flag}>{LANGUAGE_FLAGS[language]}</Text>
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {LOCALE_CONFIG[language].name}
                    </Text>
                  </View>
                  {selected && <Text style={styles.check}>✓</Text>}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  webField: {
    alignSelf: 'flex-start',
    minHeight: 42,
    overflow: 'hidden',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
  },
  compact: { borderWidth: 0, borderRadius: 0 },
  trigger: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
  },
  triggerPressed: {
    opacity: 0.75,
  },
  triggerFlag: {
    fontSize: 17,
  },
  triggerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  chevron: {
    fontSize: 13,
    color: colors.inkSoft,
    marginLeft: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#00000038',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 6,
    paddingHorizontal: 6,
    minWidth: 164,
    ...shadow.pop,
    elevation: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 10,
  },
  optionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  optionSelected: {
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: '#cfe4dc',
  },
  optionPressed: {
    opacity: 0.75,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flag: {
    fontSize: 19,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.ink,
  },
  optionTextSelected: {
    fontWeight: '700',
    color: colors.brand,
  },
  check: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.brand,
    marginLeft: 4,
  },
});
